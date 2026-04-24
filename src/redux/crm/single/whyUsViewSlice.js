import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  fetchJson,
  shouldFetchBlock,
} from "../../request";

/* -------------------- ENDPOINTS -------------------- */
const ENDPOINTS = [
  (slug) => `/api/public/why-us/${slug}`, // ✅ main
  () => `/api/public/why-us`,             // ✅ fallback list
];

/* -------------------- HELPERS -------------------- */
const normalizeSlug = (slug) => String(slug || "").trim();

const safeJson = (value) => {
  try {
    if (value == null) return null;
    if (typeof value === "object") return value;
    return JSON.parse(String(value));
  } catch {
    return null;
  }
};

/* -------------------- FIND OBJECT -------------------- */
const findWhyUsObject = (payload, slug) => {
  if (!payload) return null;

  // ARRAY
  if (Array.isArray(payload)) {
    return (
      payload.find((item) => normalizeSlug(item?.slug) === normalizeSlug(slug)) ||
      payload[0] ||
      null
    );
  }

  // data[]
  if (Array.isArray(payload?.data)) {
    return (
      payload.data.find((item) => normalizeSlug(item?.slug) === normalizeSlug(slug)) ||
      payload.data[0] ||
      null
    );
  }

  // nested
  if (Array.isArray(payload?.data?.data)) {
    return (
      payload.data.data.find((item) => normalizeSlug(item?.slug) === normalizeSlug(slug)) ||
      payload.data.data[0] ||
      null
    );
  }

  // direct object
  if (payload.why_us && typeof payload.why_us === "object") {
    return payload.why_us;
  }

  if (payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
    return payload.data;
  }

  if (
    typeof payload === "object" &&
    (payload.title || payload.description || payload.slug || payload.id)
  ) {
    return payload;
  }

  return null;
};

/* -------------------- UTILITIES -------------------- */
export const resolveUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return window.location.origin + "/" + String(path).replace(/^\/+/, "");
};

export const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d)) return value;
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
    : [];

  return arr
    .map((item, i) => {
      if (!item) return null;

      const url = resolveUrl(item.url || item.file || item.path || item);

      return {
        url,
        name: item.name || `Attachment ${i + 1}`,
      };
    })
    .filter(Boolean);
};

/* -------------------- ASYNC THUNK -------------------- */
export const fetchWhyUsView = createAsyncThunk(
  "whyUsView/fetchWhyUsView",
  async (slug, { rejectWithValue }) => {
    const identifier = normalizeSlug(slug);

    if (!identifier) {
      return rejectWithValue("No identifier found in URL");
    }

    try {
      for (const fn of ENDPOINTS) {
        try {
          const payload = await fetchJson(fn(identifier));
          const data = findWhyUsObject(payload, identifier);

          if (data) return data;
        } catch {
          // try next endpoint
        }
      }

      return rejectWithValue("Why Us not found");
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch Why Us");
    }
  },
  {
    condition: (slug, { getState }) => {
      const identifier = normalizeSlug(slug);
      if (!identifier) return false;

      const state = getState()?.whyUsView;

      if (state?.loadedSlug !== identifier) return true;

      return shouldFetchBlock(state, false, REQUEST_CACHE_TTL_MS);
    },
  }
);

/* -------------------- SLICE -------------------- */
const initialState = {
  data: null,
  status: "idle",
  loading: false,
  error: null,
  loadedAt: 0,
  loadedSlug: "",
};

const whyUsViewSlice = createSlice({
  name: "whyUsView",
  initialState,
  reducers: {
    clearWhyUsView: (state) => {
      state.data = null;
      state.status = "idle";
      state.loading = false;
      state.error = null;
      state.loadedAt = 0;
      state.loadedSlug = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWhyUsView.pending, (state) => {
        state.status = "loading";
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWhyUsView.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.loading = false;
        state.data = action.payload || null;
        state.loadedAt = Date.now();
        state.loadedSlug = normalizeSlug(action.meta.arg);
      })
      .addCase(fetchWhyUsView.rejected, (state, action) => {
        state.status = "failed";
        state.loading = false;
        state.error = action.payload || "Failed to fetch Why Us";
      });
  },
});

/* -------------------- EXPORTS -------------------- */
export const { clearWhyUsView } = whyUsViewSlice.actions;
export const selectWhyUsView = (state) => state.whyUsView;

export default whyUsViewSlice.reducer;