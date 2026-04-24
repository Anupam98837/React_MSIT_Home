import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  fetchJson,
  shouldFetchBlock,
} from "../../request";

/* ENDPOINTS */
const ENDPOINTS = [
  (slug) => `/api/public/notices/${slug}`,
  (slug) => `/public/notices/${slug}`,
  (slug) => `/api/notices/${slug}`,
];

/* NORMALIZE */
const normalizeSlug = (slug) => String(slug || "").trim();

/* FIND OBJECT */
const findNoticeObject = (payload) => {
  if (!payload) return null;

  if (payload.data && typeof payload.data === "object") return payload.data;
  if (payload.notice) return payload.notice;
  if (payload.item) return payload.item;
  if (payload.data?.data) return payload.data.data;

  if (Array.isArray(payload)) return payload[0];

  if (typeof payload === "object") return payload;

  return null;
};

/* HELPERS */
export const resolveUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return window.location.origin + "/" + path.replace(/^\/+/, "");
};

export const formatDate = (v) => {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const parseAttachments = (json) => {
  try {
    const arr = JSON.parse(json || "[]");
    return Array.isArray(arr)
      ? arr.map((item, i) => ({
          url: resolveUrl(item.url || item),
          name:
            item.name ||
            (typeof item === "string"
              ? item.split("/").pop()
              : `Attachment ${i + 1}`),
        }))
      : [];
  } catch {
    return [];
  }
};

/* THUNK WITH CACHING */
export const fetchNoticeView = createAsyncThunk(
  "noticeView/fetchNoticeView",
  async (slug, { rejectWithValue }) => {
    const identifier = normalizeSlug(slug);

    try {
      for (const fn of ENDPOINTS) {
        try {
          const payload = await fetchJson(fn(identifier));
          const notice = findNoticeObject(payload);

          if (notice) return notice;
        } catch {
          continue;
        }
      }

      return rejectWithValue("Notice not found");
    } catch (err) {
      return rejectWithValue("API error");
    }
  },
  {
    condition: (slug, { getState }) => {
      const identifier = normalizeSlug(slug);
      const state = getState()?.noticeView;

      if (!identifier) return false;

      /* 🔥 SAME CACHING LOGIC */
      if (state?.loadedSlug !== identifier) return true;

      return shouldFetchBlock(state, false, REQUEST_CACHE_TTL_MS);
    },
  }
);

/* SLICE */
const noticeViewSlice = createSlice({
  name: "noticeView",
  initialState: {
    notice: null,
    loading: false,
    error: null,
    loadedAt: 0,
    loadedSlug: "",
  },
  reducers: {
    clearNoticeView: (state) => {
      state.notice = null;
      state.loading = false;
      state.error = null;
      state.loadedAt = 0;
      state.loadedSlug = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNoticeView.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNoticeView.fulfilled, (state, action) => {
        state.loading = false;
        state.notice = action.payload;
        state.loadedAt = Date.now();
        state.loadedSlug = normalizeSlug(action.meta.arg);
      })
      .addCase(fetchNoticeView.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

/* EXPORTS */
export const { clearNoticeView } = noticeViewSlice.actions;
export const selectNoticeView = (state) => state.noticeView;
export default noticeViewSlice.reducer;