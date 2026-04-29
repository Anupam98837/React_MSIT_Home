import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  REQUEST_CACHE_TTL_MS,
  fetchJson,
  shouldFetchBlock,
} from "../../request";

/* ENDPOINTS */
const ENDPOINTS = [
  (slug) => `/api/public/announcements/${slug}`,
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

export const formatDate = (v) => {
  if (!v) return "";

  const d = new Date(v);

  if (isNaN(d.getTime())) return String(v);

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
      : [];

    return arr
      .map((item, i) => {
        let url = "";
        let name = `Attachment ${i + 1}`;
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

          meta = item.type || item.mime || item.size || "";
          if (item.size && item.type) {
            meta = `${item.type} • ${item.size}`;
          }
        }

        return {
          url,
          name,
          meta,
        };
      })
      .filter((item) => item.url);
  } catch {
    return [];
  }
};

/* PICK ITEM FROM ARRAY */
const pickAnnouncementFromArray = (arr, identifier) => {
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
const findAnnouncementObject = (payload, identifier) => {
  if (!payload) return null;

  if (Array.isArray(payload)) {
    return pickAnnouncementFromArray(payload, identifier);
  }

  if (Array.isArray(payload?.data)) {
    return pickAnnouncementFromArray(payload.data, identifier);
  }

  if (Array.isArray(payload?.data?.data)) {
    return pickAnnouncementFromArray(payload.data.data, identifier);
  }

  if (isObject(payload?.data?.announcement)) {
    return payload.data.announcement;
  }

  if (isObject(payload?.data?.item)) {
    return payload.data.item;
  }

  if (isObject(payload?.data)) {
    return payload.data;
  }

  if (isObject(payload?.announcement)) {
    return payload.announcement;
  }

  if (isObject(payload?.item)) {
    return payload.item;
  }

  if (isObject(payload)) {
    return payload;
  }

  return null;
};

/* NORMALIZE ANNOUNCEMENT OBJECT */
const normalizeAnnouncementObject = (raw) => {
  if (!isObject(raw)) return null;

  const announcement = { ...raw };

  const coverCandidate = pickFirstUrl(
    raw.cover_image_url,
    raw.cover_image,
    raw.banner_image,
    raw.image,
    raw.cover,
    raw.banner,
    raw.announcement_image,
    raw.hero_image,
    raw.thumbnail,
    raw.media?.[0],
    raw.images?.[0],
    raw.files?.[0]
  );

  if (coverCandidate) {
    announcement.cover_image_url = resolveUrl(coverCandidate);
  }

  if (!announcement.cover_image && coverCandidate) {
    announcement.cover_image = coverCandidate;
  }

  const bodyCandidate =
    raw.body ||
    raw.content ||
    raw.description ||
    raw.details ||
    raw.html_content ||
    "";

  if (!announcement.body && bodyCandidate) {
    announcement.body = bodyCandidate;
  }

  if (!announcement.attachments_json) {
    if (Array.isArray(raw.attachments)) {
      announcement.attachments_json = JSON.stringify(raw.attachments);
    } else if (Array.isArray(raw.files)) {
      announcement.attachments_json = JSON.stringify(raw.files);
    } else if (Array.isArray(raw.documents)) {
      announcement.attachments_json = JSON.stringify(raw.documents);
    }
  }

  return announcement;
};

/* THUNK WITH CACHING */
export const fetchAnnouncementView = createAsyncThunk(
  "announcementView/fetchAnnouncementView",
  async (slug, { rejectWithValue }) => {
    const identifier = normalizeSlug(slug);

    try {
      for (const fn of ENDPOINTS) {
        try {
          const payload = await fetchJson(fn(identifier));
          const announcement = normalizeAnnouncementObject(
            findAnnouncementObject(payload, identifier)
          );

          if (announcement) return announcement;
        } catch {
          continue;
        }
      }

      return rejectWithValue("Announcement not found");
    } catch {
      return rejectWithValue("API error");
    }
  },
  {
    condition: (slug, { getState }) => {
      const identifier = normalizeSlug(slug);
      const state = getState()?.announcementView;

      if (!identifier) return false;

      if (state?.loadedSlug !== identifier) return true;

      return shouldFetchBlock(state, false, REQUEST_CACHE_TTL_MS);
    },
  }
);

/* SLICE */
const announcementViewSlice = createSlice({
  name: "announcementView",
  initialState: {
    announcement: null,
    loading: false,
    error: null,
    loadedAt: 0,
    loadedSlug: "",
  },
  reducers: {
    clearAnnouncementView: (state) => {
      state.announcement = null;
      state.loading = false;
      state.error = null;
      state.loadedAt = 0;
      state.loadedSlug = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnnouncementView.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnnouncementView.fulfilled, (state, action) => {
        state.loading = false;
        state.announcement = normalizeAnnouncementObject(action.payload);
        state.loadedAt = Date.now();
        state.loadedSlug = normalizeSlug(action.meta.arg);
      })
      .addCase(fetchAnnouncementView.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "API error";
      });
  },
});

/* EXPORTS */
export const { clearAnnouncementView } = announcementViewSlice.actions;
export const selectAnnouncementView = (state) => state.announcementView;

export default announcementViewSlice.reducer;