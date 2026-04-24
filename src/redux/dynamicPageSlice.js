import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  createAsyncState,
  fetchJson,
  shouldFetchBlock,
} from "./request";

const PAGE_BLOCK = () =>
  createAsyncState({
    data: null,
    isFetching: false,
  });

const TREE_BLOCK = () =>
  createAsyncState({
    data: [],
    scope: null,
    isFetching: false,
  });

const RENDER_BLOCK = () =>
  createAsyncState({
    data: null,
    isFetching: false,
  });

const toText = (value) => String(value ?? "").trim();

const normalizeKeyPart = (value) => {
  const text = toText(value);
  return text || "__none__";
};

const makePageKey = ({ slug = "", path = "" } = {}) =>
  `page:${normalizeKeyPart(slug)}|path:${normalizeKeyPart(path)}`;

const makeTreeKey = ({ pageId = "", pageSlug = "", headerMenuId = "", headerUuid = "" } = {}) =>
  [
    `pageId:${normalizeKeyPart(pageId)}`,
    `pageSlug:${normalizeKeyPart(pageSlug)}`,
    `headerMenuId:${normalizeKeyPart(headerMenuId)}`,
    `headerUuid:${normalizeKeyPart(headerUuid)}`,
  ].join("|");

const makeRenderKey = ({
  slug = "",
  pageId = "",
  pageSlug = "",
  headerMenuId = "",
  headerUuid = "",
} = {}) =>
  [
    `slug:${normalizeKeyPart(slug)}`,
    `pageId:${normalizeKeyPart(pageId)}`,
    `pageSlug:${normalizeKeyPart(pageSlug)}`,
    `headerMenuId:${normalizeKeyPart(headerMenuId)}`,
    `headerUuid:${normalizeKeyPart(headerUuid)}`,
  ].join("|");

const pushUniqueText = (bucket, value) => {
  const text = toText(value);
  if (!text || bucket.includes(text)) return;
  bucket.push(text);
};

const safeDecodeText = (value) => {
  try {
    return toText(decodeURIComponent(String(value ?? "")));
  } catch {
    return toText(value);
  }
};

const collectPathCandidates = (value, bucket) => {
  const raw = toText(value);
  if (!raw) return;

  const strippedOrigin = raw.replace(/^https?:\/\/[^/]+/i, "");
  const withoutHash = strippedOrigin.split("#")[0] || "";
  const withoutQuery = withoutHash.split("?")[0] || "";
  const decodedRaw = safeDecodeText(strippedOrigin || "");
  const decodedWithoutQuery = safeDecodeText(withoutQuery || "");
  const trimmed = withoutQuery.replace(/^\/+|\/+$/g, "");
  const decodedTrimmed = decodedWithoutQuery.replace(/^\/+|\/+$/g, "");

  const normalizedLeadingSlash =
    withoutQuery && withoutQuery.startsWith("/") ? withoutQuery : trimmed ? `/${trimmed}` : "";

  const segments = trimmed ? trimmed.split("/").filter(Boolean) : [];
  const decodedSegments = decodedTrimmed ? decodedTrimmed.split("/").filter(Boolean) : [];
  const lastSegment = segments.length ? segments[segments.length - 1] : "";
  const decodedLastSegment = decodedSegments.length ? decodedSegments[decodedSegments.length - 1] : "";

  [
    raw,
    strippedOrigin,
    decodedRaw,
    withoutQuery,
    decodedWithoutQuery,
    trimmed,
    decodedTrimmed,
    normalizedLeadingSlash,
    decodedTrimmed ? `/${decodedTrimmed}` : "",
    lastSegment,
    decodedLastSegment,
    segments[0] === "page" && segments[1] ? segments.slice(1).join("/") : "",
    segments[0] === "page" && segments[1] ? `/${segments.slice(1).join("/")}` : "",
    segments[0] === "page" && segments[1] ? segments[1] : "",
    decodedSegments[0] === "page" && decodedSegments[1] ? decodedSegments.slice(1).join("/") : "",
    decodedSegments[0] === "page" && decodedSegments[1] ? `/${decodedSegments.slice(1).join("/")}` : "",
    decodedSegments[0] === "page" && decodedSegments[1] ? decodedSegments[1] : "",
    segments[0] === "view" && segments[1] ? segments.slice(1).join("/") : "",
    segments[0] === "view" && segments[1] ? `/${segments.slice(1).join("/")}` : "",
    segments[0] === "view" && segments[1] ? segments[1] : "",
    decodedSegments[0] === "view" && decodedSegments[1] ? decodedSegments.slice(1).join("/") : "",
    decodedSegments[0] === "view" && decodedSegments[1] ? `/${decodedSegments.slice(1).join("/")}` : "",
    decodedSegments[0] === "view" && decodedSegments[1] ? decodedSegments[1] : "",
  ].forEach((item) => pushUniqueText(bucket, item));
};

const buildPageResolveCandidates = ({
  slug = "",
  path = "",
  extraCandidates = [],
} = {}) => {
  const candidates = [];
  pushUniqueText(candidates, slug);
  collectPathCandidates(path, candidates);

  for (const item of Array.isArray(extraCandidates) ? extraCandidates : []) {
    collectPathCandidates(item, candidates);
  }

  return candidates;
};

const normalizeTreeNode = (item) => {
  if (!item || typeof item !== "object") return null;

  const children = Array.isArray(item.children)
    ? item.children.map(normalizeTreeNode).filter(Boolean)
    : [];

  return {
    ...item,
    id: Number(item.id || 0) || 0,
    parent_id:
      item.parent_id === undefined || item.parent_id === null
        ? null
        : Number(item.parent_id || 0),
    position: Number(item.position || item.sort_order || 0) || 0,
    title: toText(item.title || item.name || item.label || "Untitled"),
    slug: toText(item.slug),
    page_slug: toText(item.page_slug || item.pageSlug),
    page_shortcode: toText(item.page_shortcode || item.shortcode || item.short_code),
    page_url: toText(item.page_url || item.pageUrl || item.link || item.url || item.href),
    includable_path: toText(item.includable_path || item.includablePath),
    children,
  };
};

const normalizeTreePayload = (payload) => {
  const root = payload?.data ?? payload;
  const list = Array.isArray(root) ? root : [];
  return list.map(normalizeTreeNode).filter(Boolean);
};

const flattenMenus = (items, output = []) => {
  for (const item of items || []) {
    if (!item || typeof item !== "object") continue;
    output.push(item);
    if (Array.isArray(item.children) && item.children.length) {
      flattenMenus(item.children, output);
    }
  }
  return output;
};

const buildHeaderAncestorChain = (menus, input = {}) => {
  const flat = flattenMenus(Array.isArray(menus) ? menus : [], []);
  if (!flat.length) return [];

  const byId = new Map();
  const byUuid = new Map();
  for (const item of flat) {
    const id = Number(item?.id || 0);
    const uuid = toText(item?.uuid);
    if (id > 0) byId.set(id, item);
    if (uuid) byUuid.set(uuid, item);
  }

  let current = null;
  const requestedId = Number(input?.headerMenuId || 0);
  const requestedUuid = toText(input?.headerUuid);

  if (requestedId > 0 && byId.has(requestedId)) {
    current = byId.get(requestedId);
  } else if (requestedUuid && byUuid.has(requestedUuid)) {
    current = byUuid.get(requestedUuid);
  }

  const chain = [];
  const seen = new Set();

  while (current) {
    const id = Number(current?.id || 0);
    const uuid = toText(current?.uuid);
    const marker = `${id || 0}:${uuid}`;
    if (seen.has(marker)) break;
    seen.add(marker);

    chain.push({
      headerMenuId: id > 0 ? id : "",
      headerUuid: uuid || "",
      title: toText(current?.title),
    });

    const parentId = Number(current?.parentId ?? current?.parent_id ?? 0);
    if (!parentId || !byId.has(parentId)) break;
    current = byId.get(parentId);
  }

  return chain;
};

const buildTreeAttempts = (input, headerChain) => {
  const attempts = [];
  const seen = new Set();
  const hasPageScope = Boolean(input?.pageId || input?.pageSlug);

  const push = (attempt) => {
    const normalized = {
      pageId: attempt?.pageId ? String(attempt.pageId) : "",
      pageSlug: attempt?.pageSlug ? String(attempt.pageSlug) : "",
      headerMenuId: attempt?.headerMenuId ? String(attempt.headerMenuId) : "",
      headerUuid: attempt?.headerUuid ? String(attempt.headerUuid) : "",
      mode: attempt?.mode || "",
    };

    const marker = JSON.stringify(normalized);
    if (seen.has(marker)) return;
    seen.add(marker);
    attempts.push(normalized);
  };

  if (hasPageScope && headerChain.length) {
    for (const header of headerChain) {
      push({
        mode: "page+header",
        pageId: input?.pageId,
        pageSlug: input?.pageSlug,
        headerMenuId: header.headerMenuId,
        headerUuid: header.headerUuid,
      });
      push({
        mode: "header",
        headerMenuId: header.headerMenuId,
        headerUuid: header.headerUuid,
      });
    }
  }

  if (hasPageScope) {
    push({
      mode: "page",
      pageId: input?.pageId,
      pageSlug: input?.pageSlug,
    });
  }

  if (!attempts.length && headerChain.length) {
    for (const header of headerChain) {
      push({
        mode: "header",
        headerMenuId: header.headerMenuId,
        headerUuid: header.headerUuid,
      });
    }
  }

  return attempts;
};

const buildRenderAttempts = (input, headerChain) => {
  const attempts = [];
  const seen = new Set();
  const hasPageScope = Boolean(input?.pageId || input?.pageSlug);

  const push = (attempt) => {
    const normalized = {
      slug: toText(input?.slug),
      pageId: attempt?.pageId ? String(attempt.pageId) : "",
      pageSlug: attempt?.pageSlug ? String(attempt.pageSlug) : "",
      headerMenuId: attempt?.headerMenuId ? String(attempt.headerMenuId) : "",
      headerUuid: attempt?.headerUuid ? String(attempt.headerUuid) : "",
      mode: attempt?.mode || "",
    };

    const marker = JSON.stringify(normalized);
    if (seen.has(marker)) return;
    seen.add(marker);
    attempts.push(normalized);
  };

  if (hasPageScope) {
    push({
      mode: "page",
      pageId: input?.pageId,
      pageSlug: input?.pageSlug,
    });
  }

  for (const header of headerChain) {
    push({
      mode: "header",
      headerMenuId: header.headerMenuId,
      headerUuid: header.headerUuid,
    });

    if (hasPageScope) {
      push({
        mode: "page+header",
        pageId: input?.pageId,
        pageSlug: input?.pageSlug,
        headerMenuId: header.headerMenuId,
        headerUuid: header.headerUuid,
      });
    }
  }

  if (!attempts.length) {
    push({ mode: "plain" });
  }

  return attempts;
};

const buildScopeMeta = (payloadScope, attempt) => ({
  ...(payloadScope && typeof payloadScope === "object" ? payloadScope : {}),
  requested_header_menu_id: toText(attempt?.headerMenuId),
  requested_header_uuid: toText(attempt?.headerUuid),
  effective_header_menu_id:
    toText(payloadScope?.effective_header_menu_id || payloadScope?.header_menu_id || attempt?.headerMenuId),
  effective_header_uuid:
    toText(payloadScope?.effective_header_uuid || payloadScope?.header_uuid || attempt?.headerUuid),
  page_id: toText(payloadScope?.page_id || attempt?.pageId),
  page_slug: toText(payloadScope?.page_slug || attempt?.pageSlug),
});

export const fetchDynamicPage = createAsyncThunk(
  "dynamicPage/fetchDynamicPage",
  async (input, { rejectWithValue }) => {
    const key = makePageKey(input);
    const candidates = buildPageResolveCandidates(input);

    if (!candidates.length) {
      return rejectWithValue({ key, message: "Page slug is missing" });
    }

    let lastError = "Page not found";

    for (const candidate of candidates) {
      try {
        const payload = await fetchJson(
          `/api/public/pages/resolve?slug=${encodeURIComponent(candidate)}`,
          {
            skipMemoryCache: Boolean(input?.force),
            cache: input?.force ? "no-store" : "default",
          }
        );

        const page = payload?.data || payload?.page || payload || null;
        if (page && typeof page === "object") {
          return {
            key,
            candidate,
            data: page,
          };
        }
      } catch (error) {
        lastError = error?.message || "Page not found";
      }
    }

    return rejectWithValue({ key, message: lastError || "Page not found" });
  },
  {
    condition: (input, { getState }) => {
      const key = makePageKey(input);
      const block = getState()?.dynamicPage?.pagesByKey?.[key] || PAGE_BLOCK();
      return shouldFetchBlock(block, Boolean(input?.force), REQUEST_CACHE_TTL_MS);
    },
  }
);

export const fetchDynamicSubmenuTree = createAsyncThunk(
  "dynamicPage/fetchDynamicSubmenuTree",
  async (input, { rejectWithValue, getState }) => {
    const key = makeTreeKey(input);
    const headerChain = buildHeaderAncestorChain(getState()?.header?.moduleHeader?.menus, input);
    const attempts = buildTreeAttempts(input, headerChain);

    if (!attempts.length) {
      return rejectWithValue({ key, message: "Tree scope is missing" });
    }

    let lastError = "Failed to fetch submenu tree";
    let lastScope = null;

    for (const attempt of attempts) {
      const params = new URLSearchParams();
      if (attempt.pageId) params.set("page_id", String(attempt.pageId));
      else if (attempt.pageSlug) params.set("page_slug", String(attempt.pageSlug));

      if (attempt.headerMenuId) params.set("header_menu_id", String(attempt.headerMenuId));
      else if (attempt.headerUuid) params.set("header_uuid", String(attempt.headerUuid));

      try {
        const payload = await fetchJson(`/api/public/page-submenus/tree?${params.toString()}`, {
          skipMemoryCache: Boolean(input?.force),
          cache: input?.force ? "no-store" : "default",
        });
        const data = normalizeTreePayload(payload);
        const scope = buildScopeMeta(payload?.scope, attempt);
        lastScope = scope;

        if (data.length) {
          return {
            key,
            data,
            scope,
          };
        }
      } catch (error) {
        lastError = error?.message || "Failed to fetch submenu tree";
      }
    }

    return {
      key,
      data: [],
      scope: lastScope,
    };
  },
  {
    condition: (input, { getState }) => {
      const key = makeTreeKey(input);
      const block = getState()?.dynamicPage?.treesByKey?.[key] || TREE_BLOCK();
      return shouldFetchBlock(block, Boolean(input?.force), REQUEST_CACHE_TTL_MS);
    },
  }
);

export const fetchDynamicRenderedSubmenu = createAsyncThunk(
  "dynamicPage/fetchDynamicRenderedSubmenu",
  async (input, { rejectWithValue, getState }) => {
    const key = makeRenderKey(input);
    const slug = toText(input?.slug);

    if (!slug) {
      return rejectWithValue({ key, message: "Submenu slug is missing" });
    }

    const headerChain = buildHeaderAncestorChain(getState()?.header?.moduleHeader?.menus, input);
    const attempts = buildRenderAttempts(input, headerChain);
    let lastError = "Failed to load submenu";

    for (const attempt of attempts) {
      const params = new URLSearchParams();
      params.set("slug", slug);

      if (attempt.pageId) params.set("page_id", String(attempt.pageId));
      else if (attempt.pageSlug) params.set("page_slug", String(attempt.pageSlug));

      if (attempt.headerMenuId) params.set("header_menu_id", String(attempt.headerMenuId));
      if (attempt.headerUuid) params.set("header_uuid", String(attempt.headerUuid));

      try {
        const payload = await fetchJson(`/api/public/page-submenus/render?${params.toString()}`, {
          skipMemoryCache: Boolean(input?.force),
          cache: input?.force ? "no-store" : "default",
        });
        return {
          key,
          data: payload?.data || payload || null,
          scope: buildScopeMeta(payload?.scope, attempt),
        };
      } catch (error) {
        lastError = error?.message || "Failed to load submenu";
      }
    }

    return rejectWithValue({ key, message: lastError });
  },
  {
    condition: (input, { getState }) => {
      const key = makeRenderKey(input);
      const block = getState()?.dynamicPage?.rendersByKey?.[key] || RENDER_BLOCK();
      return shouldFetchBlock(block, Boolean(input?.force), REQUEST_CACHE_TTL_MS);
    },
  }
);

const initialState = {
  pagesByKey: {},
  treesByKey: {},
  rendersByKey: {},
  activeSubmenuByScope: {},
};

const upsertPending = (bucket, key, factory, { preserveData = false } = {}) => {
  if (!bucket[key]) {
    bucket[key] = factory();
  }

  bucket[key].error = "";
  bucket[key].isFetching = true;

  if (preserveData) {
    const hasRenderableData =
      (Array.isArray(bucket[key].data) && bucket[key].data.length > 0) ||
      (bucket[key].data && !Array.isArray(bucket[key].data));
    if (!hasRenderableData) {
      bucket[key].status = "loading";
    }
    return;
  }

  bucket[key].status = "loading";
};

const dynamicPageSlice = createSlice({
  name: "dynamicPage",
  initialState,
  reducers: {
    clearDynamicRender(state, action) {
      const key = toText(action.payload);
      if (!key) return;
      delete state.rendersByKey[key];
    },
    setActiveDynamicSubmenu(state, action) {
      const scopeKey = toText(action.payload?.scopeKey);
      const slug = toText(action.payload?.slug);
      if (!scopeKey) return;
      state.activeSubmenuByScope[scopeKey] = slug;
    },
    clearActiveDynamicSubmenu(state, action) {
      const scopeKey = toText(action.payload);
      if (!scopeKey) return;
      delete state.activeSubmenuByScope[scopeKey];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDynamicPage.pending, (state, action) => {
        const key = makePageKey(action.meta.arg);
        upsertPending(state.pagesByKey, key, PAGE_BLOCK);
      })
      .addCase(fetchDynamicPage.fulfilled, (state, action) => {
        const key = toText(action.payload?.key);
        if (!key) return;
        state.pagesByKey[key] = {
          status: "succeeded",
          error: "",
          loadedAt: Date.now(),
          data: action.payload?.data || null,
          isFetching: false,
        };
      })
      .addCase(fetchDynamicPage.rejected, (state, action) => {
        const key = toText(action.payload?.key || makePageKey(action.meta.arg));
        if (!key) return;
        state.pagesByKey[key] = {
          status: "failed",
          error:
            action.payload?.message ||
            action.error?.message ||
            "Failed to fetch page",
          loadedAt: 0,
          data: null,
          isFetching: false,
        };
      })
      .addCase(fetchDynamicSubmenuTree.pending, (state, action) => {
        const key = makeTreeKey(action.meta.arg);
        upsertPending(state.treesByKey, key, TREE_BLOCK, { preserveData: true });
      })
      .addCase(fetchDynamicSubmenuTree.fulfilled, (state, action) => {
        const key = toText(action.payload?.key);
        if (!key) return;
        state.treesByKey[key] = {
          status: "succeeded",
          error: "",
          loadedAt: Date.now(),
          data: Array.isArray(action.payload?.data) ? action.payload.data : [],
          scope: action.payload?.scope || null,
          isFetching: false,
        };
      })
      .addCase(fetchDynamicSubmenuTree.rejected, (state, action) => {
        const key = toText(action.payload?.key || makeTreeKey(action.meta.arg));
        if (!key) return;
        const prev = state.treesByKey[key] || TREE_BLOCK();
        state.treesByKey[key] = {
          ...prev,
          status: prev.data?.length ? "succeeded" : "failed",
          error:
            action.payload?.message ||
            action.error?.message ||
            "Failed to fetch submenu tree",
          isFetching: false,
        };
      })
      .addCase(fetchDynamicRenderedSubmenu.pending, (state, action) => {
        const key = makeRenderKey(action.meta.arg);
        upsertPending(state.rendersByKey, key, RENDER_BLOCK, { preserveData: true });
      })
      .addCase(fetchDynamicRenderedSubmenu.fulfilled, (state, action) => {
        const key = toText(action.payload?.key);
        if (!key) return;
        state.rendersByKey[key] = {
          status: "succeeded",
          error: "",
          loadedAt: Date.now(),
          data: action.payload?.data || null,
          scope: action.payload?.scope || null,
          isFetching: false,
        };
      })
      .addCase(fetchDynamicRenderedSubmenu.rejected, (state, action) => {
        const key = toText(action.payload?.key || makeRenderKey(action.meta.arg));
        if (!key) return;
        const prev = state.rendersByKey[key] || RENDER_BLOCK();
        state.rendersByKey[key] = {
          ...prev,
          status: prev.data ? "succeeded" : "failed",
          error:
            action.payload?.message ||
            action.error?.message ||
            "Failed to load submenu",
          isFetching: false,
        };
      });
  },
});

export const {
  clearDynamicRender,
  setActiveDynamicSubmenu,
  clearActiveDynamicSubmenu,
} = dynamicPageSlice.actions;

export const dynamicPageKeys = {
  makePageKey,
  makeTreeKey,
  makeRenderKey,
};

export const selectDynamicPageBlock = (state, input) => {
  const key = typeof input === "string" ? input : makePageKey(input);
  return state.dynamicPage?.pagesByKey?.[key] || PAGE_BLOCK();
};

export const selectDynamicTreeBlock = (state, input) => {
  const key = typeof input === "string" ? input : makeTreeKey(input);
  return state.dynamicPage?.treesByKey?.[key] || TREE_BLOCK();
};

export const selectDynamicRenderBlock = (state, input) => {
  const key = typeof input === "string" ? input : makeRenderKey(input);
  return state.dynamicPage?.rendersByKey?.[key] || RENDER_BLOCK();
};

export default dynamicPageSlice.reducer;

export const selectActiveDynamicSubmenu = (state, scopeKey) => {
  const key = toText(scopeKey);
  if (!key) return "";
  return toText(state.dynamicPage?.activeSubmenuByScope?.[key]);
};