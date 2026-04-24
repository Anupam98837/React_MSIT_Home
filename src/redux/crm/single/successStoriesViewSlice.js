import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  fetchJson,
  shouldFetchBlock,
} from "../../request";

/* ENDPOINTS */
const ENDPOINTS = [
  (slug) => `/api/public/success-stories/${slug}`,
  (slug) => `/public/success-stories/${slug}`,
  (slug) => `/api/success-stories/${slug}`,
];

const normalizeSlug = (slug) => String(slug || "").trim();

/* FIND OBJECT */
const findStory = (payload) => {
  if (!payload) return null;

  if (payload.data && typeof payload.data === "object") return payload.data;
  if (payload.story) return payload.story;
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

    return arr.map((item, i) => ({
      url: resolveUrl(item.url || item),
      name:
        item.name ||
        (typeof item === "string"
          ? item.split("/").pop()
          : `Attachment ${i + 1}`),
    }));
  } catch {
    return [];
  }
};

/* THUNK */
export const fetchSuccessStoriesView = createAsyncThunk(
  "successStoriesView/fetch",
  async (slug, { rejectWithValue }) => {
    const id = normalizeSlug(slug);

    try {
      for (const fn of ENDPOINTS) {
        try {
          const data = await fetchJson(fn(id));
          const story = findStory(data);

          if (story) return story;
        } catch {
          continue;
        }
      }

      return rejectWithValue("Story not found");
    } catch {
      return rejectWithValue("API error");
    }
  },
  {
    condition: (slug, { getState }) => {
      const state = getState().successStoriesView;
      const id = normalizeSlug(slug);

      if (state.loadedSlug !== id) return true;

      return shouldFetchBlock(state, false, REQUEST_CACHE_TTL_MS);
    },
  }
);

/* SLICE */
const slice = createSlice({
  name: "successStoriesView",
  initialState: {
    story: null,
    loading: false,
    error: null,
    loadedAt: 0,
    loadedSlug: "",
  },
  reducers: {
    clearSuccessStoriesView: (state) => {
      state.story = null;
      state.loadedSlug = "";
      state.loadedAt = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuccessStoriesView.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSuccessStoriesView.fulfilled, (state, action) => {
        state.loading = false;
        state.story = action.payload;
        state.loadedSlug = action.meta.arg;
        state.loadedAt = Date.now();
      })
      .addCase(fetchSuccessStoriesView.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSuccessStoriesView } = slice.actions;
export const selectSuccessStoriesView = (state) =>
  state.successStoriesView;

export default slice.reducer;