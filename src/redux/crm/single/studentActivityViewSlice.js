import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  fetchJson,
  shouldFetchBlock,
} from "../../request";

/* ENDPOINTS */
const ENDPOINTS = [
  (slug) => `/api/public/student-activities/${slug}`,
];

/* ENV */
const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "").replace(
  /\/+$/,
  ""
);

/* NORMALIZE */
const normalizeSlug = (slug) => String(slug || "").trim();

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const getStringValue = (value) => {
  if (typeof value === "string") return value.trim();
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const getCandidateUrl = (value) => {
  if (!value) return "";

  if (typeof value === "string") return value.trim();

  if (isObject(value)) {
    return getStringValue(
      value.url ||
        value.path ||
        value.src ||
        value.file ||
        value.href ||
        value.location ||
        value.image ||
        value.banner_image ||
        value.cover_image ||
        value.cover_image_url ||
        ""
    );
  }

  return "";
};

const pickFirstUrl = (...values) => {
  for (const value of values) {
    const url = getCandidateUrl(value);
    if (url) return url;
  }
  return "";
};

/* HELPERS */
export const resolveUrl = (path) => {
  const raw = getCandidateUrl(path);
  if (!raw) return "";

  if (/^https?:\/\//i.test(raw)) return raw;

  const cleanPath = raw.replace(/^\/+/, "");

  if (API_BASE_URL) {
    if (cleanPath.startsWith("public/")) {
      return `${API_BASE_URL}/${cleanPath}`;
    }

    if (cleanPath.startsWith("depy_uploads/")) {
      return `${API_BASE_URL}/public/${cleanPath}`;
    }

    return `${API_BASE_URL}/${cleanPath}`;
  }

  const origin =
    typeof window !== "undefined" && window.location
      ? window.location.origin
      : "";

  if (cleanPath.startsWith("depy_uploads/")) {
    return origin ? `${origin}/public/${cleanPath}` : `/public/${cleanPath}`;
  }

  return origin ? `${origin}/${cleanPath}` : cleanPath;
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
  try {
    const parsed =
      typeof value === "string" ? JSON.parse(value || "[]") : value || [];

    const arr = Array.isArray(parsed)
      ? parsed
      : isObject(parsed) && Array.isArray(parsed.files)
      ? parsed.files
      : isObject(parsed) && Array.isArray(parsed.attachments)
      ? parsed.attachments
      : isObject(parsed) && Array.isArray(parsed.documents)
      ? parsed.documents
      : isObject(parsed) && Array.isArray(parsed.links)
      ? parsed.links
      : [];

    return arr
      .map((item, idx) => {
        let url = "";
        let name = `Attachment ${idx + 1}`;
        let meta = "";

        if (typeof item === "string") {
          url = resolveUrl(item);
          name = item.split("/").pop() || name;
        } else if (isObject(item)) {
          url = resolveUrl(
            item.url ||
              item.path ||
              item.file ||
              item.src ||
              item.href ||
              item.location ||
              ""
          );

          name =
            item.name ||
            item.title ||
            item.file_name ||
            item.original_name ||
            item.filename ||
            (url ? url.split("/").pop() : name);

          meta = item.type || item.mime || item.label || "";
          if (item.size) {
            meta = meta ? `${meta} • ${item.size}` : String(item.size);
          }
        }

        return {
          url,
          name,
          meta: meta || "Click to open",
          index: idx + 1,
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
};

/* PICK OBJECT FROM ARRAY */
const pickStudentActivityFromArray = (arr, identifier) => {
  if (!Array.isArray(arr) || arr.length === 0) return null;

  const key = normalizeSlug(identifier);

  return (
    arr.find(
      (item) =>
        String(item?.slug || "") === key ||
        String(item?.uuid || "") === key ||
        String(item?.id || "") === key
    ) || arr[0]
  );
};

/* FIND OBJECT */
const findStudentActivityObject = (payload, identifier) => {
  if (!payload) return null;

  if (Array.isArray(payload)) {
    return pickStudentActivityFromArray(payload, identifier);
  }

  if (Array.isArray(payload?.data)) {
    return pickStudentActivityFromArray(payload.data, identifier);
  }

  if (Array.isArray(payload?.data?.data)) {
    return pickStudentActivityFromArray(payload.data.data, identifier);
  }

  if (isObject(payload?.data?.student_activity)) {
    return payload.data.student_activity;
  }

  if (isObject(payload?.data?.activity)) {
    return payload.data.activity;
  }

  if (isObject(payload?.data?.item)) {
    return payload.data.item;
  }

  if (isObject(payload?.data)) {
    return payload.data;
  }

  if (isObject(payload?.student_activity)) {
    return payload.student_activity;
  }

  if (isObject(payload?.activity)) {
    return payload.activity;
  }

  if (isObject(payload?.item)) {
    return payload.item;
  }

  if (isObject(payload)) {
    return payload;
  }

  return null;
};

/* NORMALIZE OBJECT */
const normalizeStudentActivityObject = (raw) => {
  if (!isObject(raw)) return null;

  const activity = { ...raw };

  const coverCandidate = pickFirstUrl(
    raw.cover_image_url,
    raw.cover_image,
    raw.banner_image,
    raw.image,
    raw.cover,
    raw.banner,
    raw.student_activity_image,
    raw.activity_image,
    raw.hero_image,
    raw.thumbnail,
    raw.media?.[0],
    raw.images?.[0],
    raw.files?.[0]
  );

  if (coverCandidate) {
    activity.cover_image_url = resolveUrl(coverCandidate);
  }

  if (!activity.cover_image && coverCandidate) {
    activity.cover_image = coverCandidate;
  }

  const bodyCandidate =
    raw.body ||
    raw.content ||
    raw.description ||
    raw.details ||
    raw.html_content ||
    "";

  if (!activity.body && bodyCandidate) {
    activity.body = bodyCandidate;
  }

  if (!activity.attachments_json) {
    if (Array.isArray(raw.attachments)) {
      activity.attachments_json = JSON.stringify(raw.attachments);
    } else if (Array.isArray(raw.files)) {
      activity.attachments_json = JSON.stringify(raw.files);
    } else if (Array.isArray(raw.documents)) {
      activity.attachments_json = JSON.stringify(raw.documents);
    }
  }

  return activity;
};

/* THUNK WITH CACHING */
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
          const activity = normalizeStudentActivityObject(
            findStudentActivityObject(payload, identifier)
          );

          if (activity) return activity;
        } catch {
          continue;
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

/* SLICE */
const initialState = {
  activity: null,
  status: "idle",
  loading: false,
  error: null,
  loadedAt: 0,
  loadedSlug: "",
};

const studentActivityViewSlice = createSlice({
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
        state.activity = normalizeStudentActivityObject(action.payload);
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

export const { clearStudentActivityView } = studentActivityViewSlice.actions;
export const selectStudentActivityView = (state) => state.studentActivityView;

export default studentActivityViewSlice.reducer;