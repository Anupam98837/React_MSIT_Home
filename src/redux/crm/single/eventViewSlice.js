import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { REQUEST_CACHE_TTL_MS, fetchJson, shouldFetchBlock } from "../../request";
 
const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
 
// Only the public single-event endpoint
const ENDPOINTS = [
  (slug) => `/api/public/events/${slug}`,
];
 
// ---------- HELPERS (same as noticeView) ----------
const normalizeSlug = (slug) => String(slug || "").trim();
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const getStringValue = (value) => {
  if (typeof value === "string") return value.trim();
  if (value === null || value === undefined) return "";
  return String(value).trim();
};
const getCandidateUrl = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (isObject(value)) {
    return getStringValue(value.url || value.path || value.src || value.file || value.href ||
      value.location || value.image || value.banner_image || value.cover_image || value.cover_image_url || "");
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
 
export const resolveUrl = (path) => {
  const raw = getCandidateUrl(path);
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  const cleanPath = raw.replace(/^\/+/, "");
  if (API_BASE_URL) {
    if (cleanPath.startsWith("public/")) return `${API_BASE_URL}/${cleanPath}`;
    if (cleanPath.startsWith("depy_uploads/")) return `${API_BASE_URL}/public/${cleanPath}`;
    return `${API_BASE_URL}/${cleanPath}`;
  }
  const origin = typeof window !== "undefined" && window.location ? window.location.origin : "";
  if (cleanPath.startsWith("depy_uploads/")) return origin ? `${origin}/public/${cleanPath}` : `/public/${cleanPath}`;
  return origin ? `${origin}/${cleanPath}` : cleanPath;
};
 
export const formatDate = (v) => {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};
 
export const parseGalleryImages = (value) => {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value || "[]") : value || [];
    const arr = Array.isArray(parsed) ? parsed : (isObject(parsed) && Array.isArray(parsed.images) ? parsed.images : []);
    return arr.map((item, i) => {
      let url = "", name = `Gallery ${i+1}`, meta = "";
      if (typeof item === "string") {
        url = resolveUrl(item);
        name = item.split("/").pop() || name;
      } else if (isObject(item)) {
        url = resolveUrl(item.url || item.path || item.file || item.src || item.href || item.location || "");
        name = item.name || item.title || item.file_name || item.original_name || item.filename || (url ? url.split("/").pop() : name);
        meta = item.type || item.mime || item.size || "";
      }
      return { url, name, meta };
    }).filter(item => item.url);
  } catch { return []; }
};
 
// ---------- PARSING LOGIC ----------
const pickEventFromArray = (arr, identifier) => {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const key = normalizeSlug(identifier);
  return arr.find(item => String(item?.slug || "") === key || String(item?.uuid || "") === key || String(item?.id || "") === key) || arr[0];
};
 
const findEventObject = (payload, identifier) => {
  if (!payload) return null;
  // Direct event object
  if (isObject(payload) && (payload.slug || payload.uuid || payload.id)) return payload;
  // { success: true, data: { ...event } }  <-- Laravel public API returns this shape
  if (payload.success === true && isObject(payload.data) && (payload.data.slug || payload.data.uuid || payload.data.id)) return payload.data;
  // { data: { ...event } } (no success flag)
  if (isObject(payload.data) && (payload.data.slug || payload.data.uuid || payload.data.id)) return payload.data;
  // Arrays (fallback, though public single endpoint should not return array)
  if (Array.isArray(payload)) return pickEventFromArray(payload, identifier);
  if (Array.isArray(payload?.data)) return pickEventFromArray(payload.data, identifier);
  if (Array.isArray(payload?.data?.data)) return pickEventFromArray(payload.data.data, identifier);
  // Nested object paths
  if (isObject(payload?.data?.event)) return payload.data.event;
  if (isObject(payload?.data?.item)) return payload.data.item;
  if (isObject(payload?.event)) return payload.event;
  if (isObject(payload?.item)) return payload.item;
  return null;
};
 
const normalizeEventObject = (raw) => {
  if (!isObject(raw)) return null;
  const event = { ...raw };
  const coverCandidate = pickFirstUrl(raw.cover_image_url, raw.cover_image, raw.banner_image, raw.image,
    raw.cover, raw.banner, raw.event_image, raw.hero_image, raw.thumbnail, raw.media?.[0], raw.images?.[0], raw.files?.[0]);
  if (coverCandidate) {
    event.cover_image_url = resolveUrl(coverCandidate);
    if (!event.cover_image) event.cover_image = coverCandidate;
  }
  const bodyCandidate = raw.body || raw.content || raw.description || raw.details || raw.html_content || "";
  if (!event.body && bodyCandidate) event.body = bodyCandidate;
  if (!event.gallery_images_json) {
    if (Array.isArray(raw.gallery_images)) event.gallery_images_json = JSON.stringify(raw.gallery_images);
    else if (Array.isArray(raw.images)) event.gallery_images_json = JSON.stringify(raw.images);
    else if (Array.isArray(raw.gallery)) event.gallery_images_json = JSON.stringify(raw.gallery);
  }
  return event;
};
 
// ---------- THUNK ----------
export const fetchEventView = createAsyncThunk(
  "eventView/fetchEventView",
  async (slug, { rejectWithValue }) => {
    const identifier = normalizeSlug(slug);
    try {
      // Only one endpoint – the public API
      const url = ENDPOINTS[0](identifier);
      const payload = await fetchJson(url);
      const event = normalizeEventObject(findEventObject(payload, identifier));
      if (event) return event;
      return rejectWithValue("Event not found");
    } catch (err) {
      return rejectWithValue("API error");
    }
  },
  {
    condition: (slug, { getState }) => {
      const identifier = normalizeSlug(slug);
      const state = getState()?.eventView;
      if (!identifier) return false;
      if (state?.loadedSlug !== identifier) return true;
      return shouldFetchBlock(state, false, REQUEST_CACHE_TTL_MS);
    },
  }
);
 
// ---------- SLICE ----------
const eventViewSlice = createSlice({
  name: "eventView",
  initialState: { event: null, loading: false, error: null, loadedAt: 0, loadedSlug: "" },
  reducers: { clearEventView: (state) => { state.event = null; state.loading = false; state.error = null; state.loadedAt = 0; state.loadedSlug = ""; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEventView.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchEventView.fulfilled, (state, action) => { state.loading = false; state.event = normalizeEventObject(action.payload); state.loadedAt = Date.now(); state.loadedSlug = normalizeSlug(action.meta.arg); })
      .addCase(fetchEventView.rejected, (state, action) => { state.loading = false; state.error = action.payload || "API error"; });
  },
});
 
export const { clearEventView } = eventViewSlice.actions;
export const selectEventView = (state) => state.eventView;
export default eventViewSlice.reducer;