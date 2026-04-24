import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  fetchJson,
  shouldFetchBlock,
} from "../../request";

const ANNOUNCEMENTS_ENDPOINT =
  "/api/public/announcements?page=1&per_page=500&sort=created_at&direction=desc";

const pickAnnouncements = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const safeJson = (value) => {
  try {
    if (value == null) return null;
    if (typeof value === "object") return value;
    const str = String(value).trim();
    if (!str) return null;
    return JSON.parse(str);
  } catch {
    return null;
  }
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

export const parseAttachments = (attachmentsValue) => {
  const parsed = safeJson(attachmentsValue);
  const arr = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.files)
      ? parsed.files
      : Array.isArray(attachmentsValue)
        ? attachmentsValue
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

const findAnnouncementBySlug = (payload, slug) => {
  const items = pickAnnouncements(payload);
  const target = String(slug || "").trim();

  if (!target) return null;

  return (
    items.find((item) => String(item?.slug || "").trim() === target) ||
    items.find((item) => String(item?.uuid || "").trim() === target) ||
    null
  );
};

export const fetchAnnouncementView = createAsyncThunk(
  "announcementView/fetchAnnouncementView",
  async (slug, { rejectWithValue }) => {
    try {
      const payload = await fetchJson(ANNOUNCEMENTS_ENDPOINT);
      const announcement = findAnnouncementBySlug(payload, slug);

      if (!announcement) {
        return rejectWithValue(
          "Announcement not found or API endpoint is not reachable. Please verify your public show route URL (expected: /api/public/announcements/{identifier})."
        );
      }

      return announcement;
    } catch (error) {
      return rejectWithValue(
        error?.message || "Failed to fetch announcement"
      );
    }
  },
  {
    condition: (slug, { getState }) =>
      shouldFetchBlock(
        getState()?.announcementView,
        false,
        REQUEST_CACHE_TTL_MS
      ),
  }
);

const initialState = {
  announcement: null,
  status: "idle",
  loading: false,
  error: null,
  loadedAt: 0,
};

const announcementViewSlice = createSlice({
  name: "announcementView",
  initialState,
  reducers: {
    clearAnnouncementView: (state) => {
      state.announcement = null;
      state.status = "idle";
      state.loading = false;
      state.error = null;
      state.loadedAt = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnnouncementView.pending, (state) => {
        state.status = "loading";
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnnouncementView.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.loading = false;
        state.error = null;
        state.loadedAt = Date.now();
        state.announcement = action.payload || null;
      })
      .addCase(fetchAnnouncementView.rejected, (state, action) => {
        state.status = "failed";
        state.loading = false;
        state.error =
          action.payload || "Failed to fetch announcement";
      });
  },
});

export const { clearAnnouncementView } = announcementViewSlice.actions;
export const selectAnnouncementView = (state) => state.announcementView;

export default announcementViewSlice.reducer;