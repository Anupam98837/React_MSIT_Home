import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const REQUEST_CACHE_TTL_MS = 5 * 60 * 1000;

const requestCache = new Map();
const inflightRequests = new Map();

const ENDPOINTS = {
  achvRow: "/api/public/grand-homepage/activities",
  placementNotices: "/api/public/grand-homepage/placement-notices",
};

const buildUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  const normalized = path.startsWith("/") ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${normalized}` : normalized;
};

const getRequestCacheKey = (url, options = {}) => {
  const method = String(options.method || "GET").toUpperCase();
  if (method !== "GET" || options.skipMemoryCache) return "";
  return `public:${url}`;
};

const getCachedResponse = (cacheKey) => {
  if (!cacheKey || !requestCache.has(cacheKey)) return null;

  const cached = requestCache.get(cacheKey);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > REQUEST_CACHE_TTL_MS) {
    requestCache.delete(cacheKey);
    return null;
  }

  return cached.data;
};

const fetchJson = async (path, options = {}) => {
  const url = buildUrl(path);
  const headers = { Accept: "application/json", ...(options.headers || {}) };

  const cacheKey = getRequestCacheKey(url, options);
  const cached = getCachedResponse(cacheKey);
  if (cached !== null) return cached;

  if (cacheKey && inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey);
  }

  const requestPromise = (async () => {
    const response = await fetch(url, {
      cache: options.cache ?? "default",
      ...options,
      headers,
    });

    const text = await response.text();
    let data = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(data?.message || `Request failed with status ${response.status}`);
    }

    if (cacheKey) {
      requestCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });
    }

    return data;
  })();

  if (cacheKey) inflightRequests.set(cacheKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    if (cacheKey) inflightRequests.delete(cacheKey);
  }
};

const getText = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null) {
      const text = String(value).trim();
      if (text) return text;
    }
  }
  return "";
};

const pickArray = (...values) => {
  for (const value of values) {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.items)) return value.items;
  }
  return [];
};

const normalizeUrl = (value) => {
  const url = String(value || "").trim();
  if (!url) return "";

  if (/^(https?:\/\/|mailto:|tel:|sms:|whatsapp:|#)/i.test(url)) {
    return url;
  }

  if (url.startsWith("/")) return url;
  return `/${url.replace(/^\/+/, "")}`;
};

const normalizeListItem = (item, categoryKey, index) => {
  if (!item || typeof item !== "object") return null;

  const title = getText(
    item.title,
    item.name,
    item.heading,
    item.notice_title,
    item.post_title,
    item.label,
    item.subject,
    item.description
  );

  if (!title) return null;

  return {
    id: getText(item.id, item.uuid, `${categoryKey}-${index}-${title}`),
    title,
    href: normalizeUrl(
      getText(item.href, item.url, item.link, item.page_url, item.target_url)
    ),
    target: getText(item.target, item.link_target),
    categoryKey,
  };
};

const normalizeList = (items, categoryKey) => {
  return pickArray(items)
    .map((item, index) => normalizeListItem(item, categoryKey, index))
    .filter(Boolean);
};

export const fetchHomeHighlightsData = createAsyncThunk(
  "homeHighlights/fetchHomeHighlightsData",
  async (_, { rejectWithValue }) => {
    try {
      const [achvPayload, placementPayload] = await Promise.all([
        fetchJson(ENDPOINTS.achvRow),
        fetchJson(ENDPOINTS.placementNotices),
      ]);

      return {
        achievements: normalizeList(
          achvPayload?.achievements || achvPayload?.data?.achievements,
          "achievements"
        ),
        studentActivities: normalizeList(
          achvPayload?.student_activities || achvPayload?.data?.student_activities,
          "student_activities"
        ),
        placementNotices: normalizeList(
          placementPayload?.placement_notices ||
            placementPayload?.data?.placement_notices ||
            placementPayload?.items ||
            placementPayload,
          "placement_notices"
        ),
      };
    } catch (error) {
      return rejectWithValue(
        error?.message || "Failed to load homepage highlights."
      );
    }
  }
);

const initialState = {
  achievements: [],
  studentActivities: [],
  placementNotices: [],
  status: "idle",
  error: null,
};

const homeHighlightsSlice = createSlice({
  name: "homeHighlights",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHomeHighlightsData.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchHomeHighlightsData.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.error = null;
        state.achievements = action.payload.achievements;
        state.studentActivities = action.payload.studentActivities;
        state.placementNotices = action.payload.placementNotices;
      })
      .addCase(fetchHomeHighlightsData.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to load homepage highlights.";
      });
  },
});

export const selectHomeHighlights = (state) =>
  state.homeHighlights || initialState;

export default homeHighlightsSlice.reducer;