import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  fetchJson,
  shouldFetchBlock,
} from "../../request";

const ENDPOINTS = [
  (slug) => `/api/public/placement-notices/${slug}`,
  (slug) => `/public/placement-notices/${slug}`,
  (slug) => `/api/placement-notices/${slug}`,
];

const normalizeSlug = (slug) => String(slug || "").trim();

const safeJson = (value) => {
  try {
    if (value == null) return null;
    if (typeof value === "object") return value;
    const text = String(value).trim();
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const findPlacementNoticeObject = (payload, slug) => {
  if (!payload) return null;

  if (Array.isArray(payload)) {
    return (
      payload.find((item) => normalizeSlug(item?.slug) === normalizeSlug(slug)) ||
      payload[0] ||
      null
    );
  }

  if (Array.isArray(payload?.data)) {
    return (
      payload.data.find((item) => normalizeSlug(item?.slug) === normalizeSlug(slug)) ||
      payload.data[0] ||
      null
    );
  }

  if (Array.isArray(payload?.data?.data)) {
    return (
      payload.data.data.find((item) => normalizeSlug(item?.slug) === normalizeSlug(slug)) ||
      payload.data.data[0] ||
      null
    );
  }

  if (payload.placement_notice && typeof payload.placement_notice === "object") {
    return payload.placement_notice;
  }

  if (payload.notice && typeof payload.notice === "object") {
    return payload.notice;
  }

  if (payload.item && typeof payload.item === "object") {
    return payload.item;
  }

  if (payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
    return payload.data;
  }

  if (
    typeof payload === "object" &&
    (payload.title || payload.description || payload.slug || payload.uuid)
  ) {
    return payload;
  }

  return null;
};

export const resolveUrl = (path) => {
  if (!path) return "";
  const p = String(path).trim();
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  return window.location.origin + "/" + p.replace(/^\/+/, "");
};

export const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const parseAttachments = (value) => {
  const parsed = safeJson(value);
  const arr = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.files)
      ? parsed.files
      : Array.isArray(parsed?.attachments)
        ? parsed.attachments
        : Array.isArray(parsed?.documents)
          ? parsed.documents
          : Array.isArray(parsed?.links)
            ? parsed.links
            : Array.isArray(value)
              ? value
              : [];

  return arr
    .map((item, idx) => {
      let url = "";
      let name = "";
      let meta = "";

      if (typeof item === "string") {
        url = resolveUrl(item);
        name = item.split("/").pop() || `Attachment ${idx + 1}`;
      } else if (item && typeof item === "object") {
        url = resolveUrl(item.url || item.path || item.file || item.href || "");
        name =
          item.name ||
          item.title ||
          (url ? url.split("/").pop() : `Attachment ${idx + 1}`);
        meta = item.type || item.mime || item.label || "";
        if (item.size) meta = meta ? `${meta} • ${item.size}` : String(item.size);
      }

      if (!url) return null;

      return {
        url,
        name,
        meta: meta || "Click to open",
        index: idx + 1,
      };
    })
    .filter(Boolean);
};

export const fetchPlacementNoticeView = createAsyncThunk(
  "placementNoticeView/fetchPlacementNoticeView",
  async (slug, { rejectWithValue }) => {
    const identifier = normalizeSlug(slug);

    if (!identifier) {
      return rejectWithValue("No identifier found in the URL.");
    }

    try {
      for (const fn of ENDPOINTS) {
        try {
          const payload = await fetchJson(fn(identifier));
          const notice = findPlacementNoticeObject(payload, identifier);

          if (notice) return notice;
        } catch {
          // try next endpoint
        }
      }

      return rejectWithValue(
        "Placement Notice not found or API endpoint is not reachable. Please verify your public show route URL (expected: /api/public/placement-notices/{identifier})."
      );
    } catch (error) {
      return rejectWithValue(
        error?.message ||
          "Placement Notice not found or API endpoint is not reachable. Please verify your public show route URL (expected: /api/public/placement-notices/{identifier})."
      );
    }
  },
  {
    condition: (slug, { getState }) => {
      const identifier = normalizeSlug(slug);
      if (!identifier) return false;

      const state = getState()?.placementNoticeView;
      if (state?.loadedSlug !== identifier) return true;

      return shouldFetchBlock(state, false, REQUEST_CACHE_TTL_MS);
    },
  }
);

const initialState = {
  notice: null,
  status: "idle",
  loading: false,
  error: null,
  loadedAt: 0,
  loadedSlug: "",
};

const slice = createSlice({
  name: "placementNoticeView",
  initialState,
  reducers: {
    clearPlacementNoticeView: (state) => {
      state.notice = null;
      state.status = "idle";
      state.loading = false;
      state.error = null;
      state.loadedAt = 0;
      state.loadedSlug = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlacementNoticeView.pending, (state) => {
        state.status = "loading";
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlacementNoticeView.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.loading = false;
        state.error = null;
        state.loadedAt = Date.now();
        state.loadedSlug = normalizeSlug(action.meta.arg);
        state.notice = action.payload || null;
      })
      .addCase(fetchPlacementNoticeView.rejected, (state, action) => {
        state.status = "failed";
        state.loading = false;
        state.error =
          action.payload ||
          "Placement Notice not found or API endpoint is not reachable. Please verify your public show route URL (expected: /api/public/placement-notices/{identifier}).";
      });
  },
});

export const { clearPlacementNoticeView } = slice.actions;
export const selectPlacementNoticeView = (state) => state.placementNoticeView;

export default slice.reducer;