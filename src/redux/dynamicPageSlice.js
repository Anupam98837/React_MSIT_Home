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
    statusCode: 0,
    notFound: false,
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

const makePageKey = ({ slug = "", path = "", dept = "" } = {}) =>
  [
    `page:${normalizeKeyPart(slug)}`,
    `path:${normalizeKeyPart(path)}`,
    `dept:${normalizeKeyPart(dept)}`,
  ].join("|");

const makeTreeKey = ({
  pageId = "",
  pageSlug = "",
  headerMenuId = "",
  headerUuid = "",
} = {}) =>
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

const stripOrigin = (value) => toText(value).replace(/^https?:\/\/[^/]+/i, "");

const stripHash = (value) => stripOrigin(value).split("#")[0] || "";

const stripQuery = (value) => stripHash(value).split("?")[0] || "";

const stripTrailingSlash = (value) => {
  const text = toText(value);
  if (!text) return "";
  if (text === "/") return "/";
  return text.replace(/\/+$/g, "") || "/";
};

const getLastSegment = (value) => {
  const clean = stripQuery(value).replace(/^\/+|\/+$/g, "");
  const parts = clean.split("/").filter(Boolean);
  return parts.length ? safeDecodeText(parts[parts.length - 1]) : "";
};

const getSearchFromValue = (value) => {
  const clean = stripHash(value);
  const index = clean.indexOf("?");
  return index >= 0 ? clean.slice(index + 1) : "";
};

const getSearchParamFromValue = (value, key) => {
  const search = getSearchFromValue(value);
  if (!search) return "";

  try {
    return toText(new URLSearchParams(search).get(key));
  } catch {
    return "";
  }
};

const collectCleanLinkCandidates = (value, bucket) => {
  const raw = toText(value);
  if (!raw) return;

  const cleanPath = stripQuery(raw);
  const decodedPath = safeDecodeText(cleanPath);
  const trimmed = cleanPath.replace(/^\/+|\/+$/g, "");
  const decodedTrimmed = decodedPath.replace(/^\/+|\/+$/g, "");
  const noTrail = stripTrailingSlash(cleanPath || "/");
  const trail = noTrail === "/" ? "/" : `${noTrail}/`;
  const noTrailNoSlash = noTrail.replace(/^\/+/, "");
  const trailNoSlash = trail.replace(/^\/+/, "");

  [
    noTrail,
    noTrailNoSlash,
    trail,
    trailNoSlash,
    decodedPath,
    decodedTrimmed,
    decodedTrimmed ? `/${decodedTrimmed}` : "",
    getLastSegment(cleanPath),
  ].forEach((item) => pushUniqueText(bucket, item));

  if (typeof window !== "undefined" && window.location?.origin) {
    [
      `${window.location.origin}${noTrail}`,
      `${window.location.origin}${trail}`,
    ].forEach((item) => pushUniqueText(bucket, item));
  }
};

const buildPageResolveCandidates = ({
  slug = "",
  path = "",
  extraCandidates = [],
} = {}) => {
  const candidates = [];

  // Must match Blade behavior:
  // current clean URL/page_url first, slug only as final fallback.
  collectCleanLinkCandidates(path, candidates);

  for (const item of Array.isArray(extraCandidates) ? extraCandidates : []) {
    collectCleanLinkCandidates(item, candidates);
  }

  pushUniqueText(candidates, slug);

  return candidates;
};

const getErrorStatus = (error) =>
  Number(
    error?.status ||
      error?.statusCode ||
      error?.response?.status ||
      error?.data?.status ||
      0
  ) || 0;

const isNotFoundMessage = (value) =>
  /(?:^|\b)(404|not found|page not found|missing)(?:\b|$)/i.test(toText(value));

const isUsablePage = (page) => {
  if (!page || typeof page !== "object" || Array.isArray(page)) return false;
  if (page.success === false) return false;

  return Boolean(
    page.id ||
      page.uuid ||
      page.slug ||
      page.page_slug ||
      page.page_url ||
      page.page_link ||
      page.title ||
      page.page_title ||
      page.content_html ||
      page.html
  );
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
  effective_header_menu_id: toText(
    payloadScope?.effective_header_menu_id ||
      payloadScope?.header_menu_id ||
      attempt?.headerMenuId
  ),
  effective_header_uuid: toText(
    payloadScope?.effective_header_uuid ||
      payloadScope?.header_uuid ||
      attempt?.headerUuid
  ),
  page_id: toText(payloadScope?.page_id || attempt?.pageId),
  page_slug: toText(payloadScope?.page_slug || attempt?.pageSlug),
});

export const fetchDynamicPage = createAsyncThunk(
  "dynamicPage/fetchDynamicPage",
  async (input, { rejectWithValue }) => {
    const key = makePageKey(input);
    const candidates = buildPageResolveCandidates(input);
    const dept =
      toText(input?.dept) ||
      candidates.map((item) => getSearchParamFromValue(item, "dept")).find(Boolean) ||
      "";

    if (!candidates.length) {
      return rejectWithValue({
        key,
        message: "Page link is missing",
        statusCode: 404,
        notFound: true,
      });
    }

    let lastError = "Page not found";
    let lastStatus = 404;

    for (const candidate of candidates) {
      try {
        const params = new URLSearchParams();

        // Keep old backend compatibility: resolve endpoint already accepted `slug`.
        // Candidate order is now page_url/link-first, then slug fallback.
        params.set("slug", candidate);

        // Extra params help if backend now supports link/path directly.
        params.set("link", candidate);
        params.set("path", candidate);
        params.set("page_url", candidate);

        if (dept) {
          params.set("dept", dept);
          params.set("department_slug", dept);
        }

        const payload = await fetchJson(`/api/public/pages/resolve?${params.toString()}`, {
          skipMemoryCache: Boolean(input?.force),
          cache: input?.force ? "no-store" : "default",
        });

        const page = payload?.data || payload?.page || payload || null;

        if (isUsablePage(page)) {
          return {
            key,
            candidate,
            data: page,
          };
        }
      } catch (error) {
        lastStatus = getErrorStatus(error) || lastStatus;
        lastError = error?.message || "Page not found";
      }
    }

    return rejectWithValue({
      key,
      message: lastError || "Page not found",
      statusCode: lastStatus || 404,
      notFound: lastStatus === 404 || isNotFoundMessage(lastError),
    });
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
    const headerChain = buildHeaderAncestorChain(
      getState()?.header?.moduleHeader?.menus,
      input
    );
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

    const headerChain = buildHeaderAncestorChain(
      getState()?.header?.moduleHeader?.menus,
      input
    );
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
  bucket[key].statusCode = 0;
  bucket[key].notFound = false;

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
          statusCode: 200,
          notFound: false,
        };
      })
      .addCase(fetchDynamicPage.rejected, (state, action) => {
        const key = toText(action.payload?.key || makePageKey(action.meta.arg));
        if (!key) return;

        const message =
          action.payload?.message ||
          action.error?.message ||
          "Page not found";

        const statusCode =
          Number(action.payload?.statusCode || 0) ||
          (isNotFoundMessage(message) ? 404 : 0);

        state.pagesByKey[key] = {
          status: "failed",
          error: message,
          loadedAt: 0,
          data: null,
          isFetching: false,
          statusCode,
          notFound:
            Boolean(action.payload?.notFound) ||
            statusCode === 404 ||
            isNotFoundMessage(message),
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

export const selectActiveDynamicSubmenu = (state, scopeKey) => {
  const key = toText(scopeKey);
  if (!key) return "";
  return toText(state.dynamicPage?.activeSubmenuByScope?.[key]);
};

export default dynamicPageSlice.reducer;