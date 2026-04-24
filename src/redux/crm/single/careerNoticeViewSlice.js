import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  fetchJson,
  shouldFetchBlock,
} from "../../request";

const ENDPOINTS = [
  "/public/career-notices",
  "/api/public/career-notices",
  "/api/career-notices",
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

const matchesIdentifier = (item, slug) => {
  if (!item || !slug) return false;
  const target = normalizeSlug(slug);
  return (
    normalizeSlug(item.slug) === target ||
    normalizeSlug(item.uuid) === target ||
    normalizeSlug(item.identifier) === target ||
    normalizeSlug(item.id) === target
  );
};

const findCareerNoticeObject = (payload, slug) => {
  if (!payload) return null;

  if (Array.isArray(payload)) {
    return (
      payload.find((item) => matchesIdentifier(item, slug)) ||
      payload[0] ||
      null
    );
  }

  if (Array.isArray(payload?.data)) {
    return (
      payload.data.find((item) => matchesIdentifier(item, slug)) ||
      payload.data[0] ||
      null
    );
  }

  if (Array.isArray(payload?.data?.data)) {
    return (
      payload.data.data.find((item) => matchesIdentifier(item, slug)) ||
      payload.data.data[0] ||
      null
    );
  }

  if (payload.career_notice && typeof payload.career_notice === "object") {
    return payload.career_notice;
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
    (payload.title || payload.body || payload.slug || payload.uuid)
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
        url = resolveUrl(item.url || item.path || item.file || "");
        name = item.name || (url ? url.split("/").pop() : `Attachment ${idx + 1}`);
        meta = item.type || item.mime || "";
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

export const fetchCareerNoticeView = createAsyncThunk(
  "careerNoticeView/fetchCareerNoticeView",
  async (slug, { rejectWithValue }) => {
    const identifier = normalizeSlug(slug);

    if (!identifier) {
      return rejectWithValue("No identifier found in the URL.");
    }

    try {
      for (const base of ENDPOINTS) {
        try {
          const payload = await fetchJson(
            `${base}/${encodeURIComponent(identifier)}`
          );

          const notice = findCareerNoticeObject(payload, identifier);
          if (notice) return notice;
        } catch {
          // try next endpoint
        }
      }

      return rejectWithValue(
        "Career Notice not found or API endpoint is not reachable. Please verify your public show route URL (expected: /public/career-notices/{identifier})."
      );
    } catch (error) {
      return rejectWithValue(
        error?.message ||
          "Career Notice not found or API endpoint is not reachable. Please verify your public show route URL (expected: /public/career-notices/{identifier})."
      );
    }
  },
  {
    condition: (slug, { getState }) => {
      const identifier = normalizeSlug(slug);
      if (!identifier) return false;

      const state = getState()?.careerNoticeView;
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
  name: "careerNoticeView",
  initialState,
  reducers: {
    clearCareerNoticeView: (state) => {
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
      .addCase(fetchCareerNoticeView.pending, (state) => {
        state.status = "loading";
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCareerNoticeView.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.loading = false;
        state.error = null;
        state.loadedAt = Date.now();
        state.loadedSlug = normalizeSlug(action.meta.arg);
        state.notice = action.payload || null;
      })
      .addCase(fetchCareerNoticeView.rejected, (state, action) => {
        state.status = "failed";
        state.loading = false;
        state.error =
          action.payload ||
          "Career Notice not found or API endpoint is not reachable. Please verify your public show route URL (expected: /public/career-notices/{identifier}).";
      });
  },
});

export const { clearCareerNoticeView } = slice.actions;
export const selectCareerNoticeView = (state) => state.careerNoticeView;

export default slice.reducer;