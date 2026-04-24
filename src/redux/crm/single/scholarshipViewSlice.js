import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  fetchJson,
  shouldFetchBlock,
} from "../../request";

const ENDPOINTS = [
  (slug) => `/api/public/scholarships/${slug}`,
  (slug) => `/public/scholarships/${slug}`,
  (slug) => `/api/scholarships/${slug}`,
];

const normalizeSlug = (slug) => String(slug || "").trim();

/* FIND OBJECT */
const findScholarshipObject = (payload) => {
  if (!payload) return null;

  if (payload.data && typeof payload.data === "object") return payload.data;
  if (payload.scholarship) return payload.scholarship;
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
export const fetchScholarshipView = createAsyncThunk(
  "scholarshipView/fetchScholarshipView",
  async (slug, { rejectWithValue }) => {
    const identifier = normalizeSlug(slug);

    try {
      for (const fn of ENDPOINTS) {
        try {
          const data = await fetchJson(fn(identifier));
          const scholarship = findScholarshipObject(data);

          if (scholarship) return scholarship;
        } catch {
          continue;
        }
      }

      return rejectWithValue("Scholarship not found");
    } catch {
      return rejectWithValue("API error");
    }
  },
  {
    condition: (slug, { getState }) => {
      const state = getState().scholarshipView;
      const id = normalizeSlug(slug);

      if (state.loadedSlug !== id) return true;

      return shouldFetchBlock(state, false, REQUEST_CACHE_TTL_MS);
    },
  }
);

/* SLICE */
const scholarshipSlice = createSlice({
  name: "scholarshipView",
  initialState: {
    scholarship: null,
    loading: false,
    error: null,
    loadedAt: 0,
    loadedSlug: "",
  },
  reducers: {
    clearScholarshipView: (state) => {
      state.scholarship = null;
      state.loadedSlug = "";
      state.loadedAt = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchScholarshipView.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchScholarshipView.fulfilled, (state, action) => {
        state.loading = false;
        state.scholarship = action.payload;
        state.loadedSlug = action.meta.arg;
        state.loadedAt = Date.now();
      })
      .addCase(fetchScholarshipView.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearScholarshipView } = scholarshipSlice.actions;
export const selectScholarshipView = (state) => state.scholarshipView;

export default scholarshipSlice.reducer;