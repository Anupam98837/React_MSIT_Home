import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  fetchJson,
  shouldFetchBlock,
} from "../../request";

const ENDPOINTS = [
  (slug) => `/api/public/student-activities/${slug}`,
  (slug) => `/public/student-activities/${slug}`,
  (slug) => `/api/student-activities/${slug}`,
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

const findStudentActivityObject = (payload, slug) => {
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

  if (payload.student_activity && typeof payload.student_activity === "object") {
    return payload.student_activity;
  }

  if (payload.activity && typeof payload.activity === "object") {
    return payload.activity;
  }

  if (payload.item && typeof payload.item === "object") {
    return payload.item;
  }

  if (payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
    return payload.data;
  }

  if (
    typeof payload === "object" &&
    (payload.title || payload.body || payload.slug || payload.uuid || payload.description)
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

export const fetchStudentActivityView = createAsyncThunk(
  "studentActivityView/fetchStudentActivityView",
  async (slug, { rejectWithValue }) => {
    const identifier = normalizeSlug(slug);

    if (!identifier) {
      return rejectWithValue("No identifier found in the URL.");
    }

    try {
      for (const fn of ENDPOINTS) {
        try {
          const payload = await fetchJson(fn(identifier));
          const activity = findStudentActivityObject(payload, identifier);

          if (activity) return activity;
        } catch {
          // try next endpoint
        }
      }

      return rejectWithValue(
        "Student Activity not found or API endpoint is not reachable. Please verify your public show route URL (expected: /api/public/student-activities/{identifier})."
      );
    } catch (error) {
      return rejectWithValue(
        error?.message ||
          "Student Activity not found or API endpoint is not reachable. Please verify your public show route URL (expected: /api/public/student-activities/{identifier})."
      );
    }
  },
  {
    condition: (slug, { getState }) => {
      const identifier = normalizeSlug(slug);
      if (!identifier) return false;

      const state = getState()?.studentActivityView;
      if (state?.loadedSlug !== identifier) return true;

      return shouldFetchBlock(state, false, REQUEST_CACHE_TTL_MS);
    },
  }
);

const initialState = {
  activity: null,
  status: "idle",
  loading: false,
  error: null,
  loadedAt: 0,
  loadedSlug: "",
};

const slice = createSlice({
  name: "studentActivityView",
  initialState,
  reducers: {
    clearStudentActivityView: (state) => {
      state.activity = null;
      state.status = "idle";
      state.loading = false;
      state.error = null;
      state.loadedAt = 0;
      state.loadedSlug = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudentActivityView.pending, (state) => {
        state.status = "loading";
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentActivityView.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.loading = false;
        state.error = null;
        state.loadedAt = Date.now();
        state.loadedSlug = normalizeSlug(action.meta.arg);
        state.activity = action.payload || null;
      })
      .addCase(fetchStudentActivityView.rejected, (state, action) => {
        state.status = "failed";
        state.loading = false;
        state.error =
          action.payload ||
          "Student Activity not found or API endpoint is not reachable. Please verify your public show route URL (expected: /api/public/student-activities/{identifier}).";
      });
  },
});

export const { clearStudentActivityView } = slice.actions;
export const selectStudentActivityView = (state) => state.studentActivityView;

export default slice.reducer;