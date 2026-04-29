import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  fetchJson,
  shouldFetchBlock,
} from "../../request";

/* ENDPOINTS */
const ENDPOINTS = [
  (slug) => `/api/public/career-notices/${slug}`,
 
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
        value.download_url ||
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

const matchesIdentifier = (item, slug) => {
  if (!item || !slug) return false;
  const key = normalizeSlug(slug);

  return (
    normalizeSlug(item.slug) === key ||
    normalizeSlug(item.uuid) === key ||
    normalizeSlug(item.identifier) === key ||
    normalizeSlug(item.id) === key
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

  if (isObject(payload?.career_notice)) return payload.career_notice;
  if (isObject(payload?.notice)) return payload.notice;
  if (isObject(payload?.item)) return payload.item;

  if (isObject(payload?.data)) return payload.data;

  if (
    isObject(payload) &&
    (payload.title || payload.body || payload.slug || payload.uuid || payload.id)
  ) {
    return payload;
  }

  return null;
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
  const parsed = safeJson(value);

  const arr = Array.isArray(parsed)
    ? parsed
    : isObject(parsed) && Array.isArray(parsed.files)
    ? parsed.files
    : isObject(parsed) && Array.isArray(parsed.attachments)
    ? parsed.attachments
    : isObject(parsed) && Array.isArray(parsed.documents)
    ? parsed.documents
    : Array.isArray(value)
    ? value
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
            item.href ||
            item.src ||
            item.download_url ||
            item.link ||
            ""
        );

        if (!url && isObject(item.file)) {
          url = resolveUrl(item.file);
        }

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

/* NORMALIZE NOTICE */
const normalizeCareerNoticeObject = (raw) => {
  if (!isObject(raw)) return null;

  const notice = { ...raw };

  const coverCandidate = pickFirstUrl(
    raw.cover_image_url,
    raw.cover_image,
    raw.banner_image,
    raw.image,
    raw.cover,
    raw.banner,
    raw.career_notice_image,
    raw.notice_image,
    raw.hero_image,
    raw.thumbnail,
    raw.media?.[0],
    raw.images?.[0],
    raw.files?.[0]
  );

  if (coverCandidate) {
    notice.cover_image_url = resolveUrl(coverCandidate);
  }

  if (!notice.cover_image && coverCandidate) {
    notice.cover_image = coverCandidate;
  }

  const bodyCandidate =
    raw.body ||
    raw.content ||
    raw.description ||
    raw.details ||
    raw.html_content ||
    "";

  if (!notice.body && bodyCandidate) {
    notice.body = bodyCandidate;
  }

  if (!notice.attachments_json) {
    if (Array.isArray(raw.attachments)) {
      notice.attachments_json = JSON.stringify(raw.attachments);
    } else if (Array.isArray(raw.files)) {
      notice.attachments_json = JSON.stringify(raw.files);
    } else if (Array.isArray(raw.documents)) {
      notice.attachments_json = JSON.stringify(raw.documents);
    }
  }

  return notice;
};

/* THUNK */
export const fetchCareerNoticeView = createAsyncThunk(
  "careerNoticeView/fetchCareerNoticeView",
  async (slug, { rejectWithValue }) => {
    const identifier = normalizeSlug(slug);

    if (!identifier) {
      return rejectWithValue("No identifier found in the URL.");
    }

    try {
      for (const fn of ENDPOINTS) {
        try {
          const payload = await fetchJson(fn(identifier));
          const notice = normalizeCareerNoticeObject(
            findCareerNoticeObject(payload, identifier)
          );

          if (notice) return notice;
        } catch {
          continue;
        }
      }

      return rejectWithValue(
        "Career Notice not found or API endpoint is not reachable."
      );
    } catch (error) {
      return rejectWithValue(
        error?.message ||
          "Career Notice not found or API endpoint is not reachable."
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

/* SLICE */
const initialState = {
  notice: null,
  status: "idle",
  loading: false,
  error: null,
  loadedAt: 0,
  loadedSlug: "",
};

const careerNoticeViewSlice = createSlice({
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
        state.notice = normalizeCareerNoticeObject(action.payload);
      })
      .addCase(fetchCareerNoticeView.rejected, (state, action) => {
        state.status = "failed";
        state.loading = false;
        state.error =
          action.payload ||
          "Career Notice not found or API endpoint is not reachable.";
      });
  },
});

/* EXPORTS */
export const { clearCareerNoticeView } = careerNoticeViewSlice.actions;
export const selectCareerNoticeView = (state) => state.careerNoticeView;

export default careerNoticeViewSlice.reducer;