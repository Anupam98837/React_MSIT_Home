import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  createAsyncState,
  fetchJson,
  getText,
  shouldFetchBlock,
} from "./request";

const META_BLOCK = () =>
  createAsyncState({
    path: "",
    data: null,
    isFetching: false,
  });

export const normalizeMetaPath = (inputPath) => {
  const raw = String(inputPath || "").trim();
  if (!raw) return "/";

  let path = raw;

  try {
    if (/^https?:\/\//i.test(raw)) {
      const url = new URL(raw);
      path = url.pathname || "/";
    }
  } catch {
    path = raw;
  }

  path = String(path).split("?")[0].split("#")[0].trim();

  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  path = path.replace(/\/{2,}/g, "/");

  if (path.length > 1) {
    path = path.replace(/\/+$/, "");
  }

  return path || "/";
};

const normalizeTypeKey = (type, attr = "") => {
  const t = String(type || "").trim().toLowerCase();
  const a = String(attr || "").trim().toLowerCase();

  if (t === "og" || t === "open_graph" || t === "opengraph") return "opengraph";
  if (t === "http" || t === "http_equiv" || t === "http-equiv") return "http";
  if (t === "name") return a.startsWith("twitter:") ? "twitter" : "standard";
  if (t === "property") return "opengraph";
  if (t === "charset" || a === "charset") return "charset";
  if (a.startsWith("og:")) return "opengraph";
  if (a.startsWith("twitter:")) return "twitter";

  return t || "standard";
};

const normalizeMetaMap = (input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};

  return Object.entries(input).reduce((acc, [key, value]) => {
    const k = String(key || "").trim();
    const v = String(value ?? "").trim();

    if (k && v) {
      acc[k] = v;
    }

    return acc;
  }, {});
};

const pickRows = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.tags)) return payload.tags;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.meta_tags)) return payload.meta_tags;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;

  return [];
};

const buildMetaFromRows = (rows) => {
  const meta = {
    charset: null,
    standard: {},
    opengraph: {},
    twitter: {},
    http: {},
  };

  for (const row of rows || []) {
    const type = String(row?.tag_type ?? row?.type ?? "standard").trim();
    const attr = String(
      row?.attribute ?? row?.tag_attribute ?? row?.attr_value ?? ""
    ).trim();
    const value = String(
      row?.content ?? row?.tag_attribute_value ?? row?.value ?? ""
    ).trim();

    const typeKey = normalizeTypeKey(type, attr);

    if (typeKey === "charset") {
      if (!meta.charset && value) {
        meta.charset = value;
      }
      continue;
    }

    if (!attr || !value) continue;

    if (!meta[typeKey]) {
      meta[typeKey] = {};
    }

    if (!Object.prototype.hasOwnProperty.call(meta[typeKey], attr)) {
      meta[typeKey][attr] = value;
    }
  }

  return meta;
};

const normalizeMetaPayload = (payload, path) => {
  const rows = pickRows(payload);

  const groupedMetaFromApi =
    payload?.meta && typeof payload.meta === "object" && !Array.isArray(payload.meta)
      ? {
          charset: String(payload.meta?.charset ?? "").trim() || null,
          standard: normalizeMetaMap(payload.meta?.standard),
          opengraph: normalizeMetaMap(payload.meta?.opengraph),
          twitter: normalizeMetaMap(payload.meta?.twitter),
          http: normalizeMetaMap(payload.meta?.http),
        }
      : null;

  const groupedMeta = groupedMetaFromApi || buildMetaFromRows(rows);

  const title = getText(
    payload?.title,
    groupedMeta?.standard?.title,
    groupedMeta?.opengraph?.["og:title"],
    groupedMeta?.twitter?.["twitter:title"]
  );

  return {
    resolved: payload?.resolved || {
      page_id: null,
      page_link: path,
    },
    path,
    title: title || "",
    meta: {
      charset: groupedMeta?.charset || null,
      standard: groupedMeta?.standard || {},
      opengraph: groupedMeta?.opengraph || {},
      twitter: groupedMeta?.twitter || {},
      http: groupedMeta?.http || {},
    },
    rows,
  };
};

const getMetaPath = (input) => {
  const raw =
    typeof input === "string"
      ? input
      : input?.path ?? input?.page_link ?? input?.url ?? input?.pathname ?? "/";
  return normalizeMetaPath(raw);
};

export const fetchMetaTags = createAsyncThunk(
  "metaTags/fetchMetaTags",
  async (input, { rejectWithValue }) => {
    const path = getMetaPath(input);
    const force = Boolean(input?.force);

    try {
      let payload = null;

      try {
        payload = await fetchJson(
          `/api/public/meta-tags/resolve?path=${encodeURIComponent(path)}`,
          { skipMemoryCache: force }
        );
      } catch {
        payload = await fetchJson(
          `/api/public/meta-tags?page_link=${encodeURIComponent(path)}`,
          { skipMemoryCache: force }
        );
      }

      return normalizeMetaPayload(payload, path);
    } catch (error) {
      return rejectWithValue({
        path,
        message: error?.message || "Failed to fetch meta tags",
      });
    }
  },
  {
    condition: (input, { getState }) => {
      const path = getMetaPath(input);
      if (!path) return false;

      const state = getState()?.metaTags;
      const block = state?.byPath?.[path] || META_BLOCK();

      return shouldFetchBlock(
        block,
        Boolean(input?.force),
        REQUEST_CACHE_TTL_MS
      );
    },
  }
);

const initialState = {
  byPath: {},
};

const metaTagsSlice = createSlice({
  name: "metaTags",
  initialState,
  reducers: {
    clearMetaTagsCache: (state) => {
      state.byPath = {};
    },
    invalidateMetaTagsPath: (state, action) => {
      const path = getMetaPath(action.payload);
      if (state.byPath?.[path]) {
        state.byPath[path].loadedAt = 0;
        state.byPath[path].status = "idle";
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMetaTags.pending, (state, action) => {
        const path = getMetaPath(action.meta.arg);
        if (!state.byPath[path]) {
          state.byPath[path] = META_BLOCK();
        }

        state.byPath[path].path = path;
        state.byPath[path].status = "loading";
        state.byPath[path].error = "";
        state.byPath[path].isFetching = true;
      })
      .addCase(fetchMetaTags.fulfilled, (state, action) => {
        const path = getMetaPath(action.payload?.path || action.meta.arg);

        state.byPath[path] = {
          status: "succeeded",
          error: "",
          loadedAt: Date.now(),
          isFetching: false,
          path,
          data: action.payload || null,
        };
      })
      .addCase(fetchMetaTags.rejected, (state, action) => {
        const path =
          getMetaPath(action.payload?.path || action.meta.arg);

        if (!state.byPath[path]) {
          state.byPath[path] = META_BLOCK();
        }

        state.byPath[path].path = path;
        state.byPath[path].status = "failed";
        state.byPath[path].isFetching = false;
        state.byPath[path].error =
          action.payload?.message ||
          action.error?.message ||
          "Failed to fetch meta tags";
      });
  },
});

export const { clearMetaTagsCache, invalidateMetaTagsPath } =
  metaTagsSlice.actions;

export const selectMetaTagsBlock = (state, path) =>
  state.metaTags?.byPath?.[normalizeMetaPath(path)] || META_BLOCK();

export const selectMetaTagsData = (state, path) =>
  state.metaTags?.byPath?.[normalizeMetaPath(path)]?.data || null;

export const selectMetaTagsStatus = (state, path) =>
  state.metaTags?.byPath?.[normalizeMetaPath(path)]?.status || "idle";

export const selectMetaTagsError = (state, path) =>
  state.metaTags?.byPath?.[normalizeMetaPath(path)]?.error || "";

export default metaTagsSlice.reducer;