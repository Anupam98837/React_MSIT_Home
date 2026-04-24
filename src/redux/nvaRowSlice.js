import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const REQUEST_CACHE_TTL_MS = 5 * 60 * 1000;

const requestCache = new Map();
const inflightRequests = new Map();

const ENDPOINT = "/api/public/grand-homepage/notice-board";

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

const parseJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const normalizeListItem = (item, index, fallbackKey) => {
  if (!item || typeof item !== "object") return null;

  const title = getText(
    item.title,
    item.text,
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
    id: getText(item.id, item.uuid, `${fallbackKey}-${index}-${title}`),
    title,
    href: normalizeUrl(
      getText(item.url, item.href, item.link, item.page_url, item.target_url)
    ),
    target: getText(item.target, item.link_target),
  };
};

const normalizeList = (value, fallbackKey) => {
  return pickArray(value)
    .map((item, index) => normalizeListItem(item, index, fallbackKey))
    .filter(Boolean);
};

const normalizeButtons = (value) => {
  const raw = parseJsonArray(value);

  return raw
    .map((button, index) => {
      if (!button || typeof button !== "object") return null;

      const text = getText(button.text, button.label, button.title, "Open");
      const url = normalizeUrl(getText(button.url, button.href, button.link));
      const sortOrder = Number(button.sort_order ?? button.sort ?? index);

      if (!url) return null;

      return {
        id: getText(button.id, `button-${index}-${text}`),
        text,
        url,
        sortOrder,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder);
};

const normalizeCenter = (value) => {
  const center = value && typeof value === "object" ? value : {};

  return {
    title: getText(center.title, center.heading, center.name, "—"),
    iframeUrl: getText(center.iframe_url, center.video_url, center.url),
    buttons: normalizeButtons(center.buttons_json ?? center.buttons),
  };
};

export const fetchNvaRowData = createAsyncThunk(
  "nvaRow/fetchNvaRowData",
  async (_, { rejectWithValue }) => {
    try {
      const payload = await fetchJson(ENDPOINT);
      const root = payload?.data && typeof payload.data === "object" ? payload.data : payload;

      return {
        notices: normalizeList(
          root?.notices ??
            root?.notice ??
            root?.left_notices ??
            root?.notice_list ??
            root?.notice_board_left,
          "notice"
        ),
        announcements: normalizeList(
          root?.announcements ??
            root?.announcement ??
            root?.right_announcements ??
            root?.announcement_list ??
            root?.notice_board_right,
          "announcement"
        ),
        center: normalizeCenter(
          root?.center ??
            root?.center_iframe ??
            root?.iframe ??
            root?.center_video ??
            root?.middle
        ),
      };
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to load NVA row.");
    }
  }
);

const initialState = {
  notices: [],
  announcements: [],
  center: {
    title: "—",
    iframeUrl: "",
    buttons: [],
  },
  status: "idle",
  error: null,
};

const nvaRowSlice = createSlice({
  name: "nvaRow",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNvaRowData.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchNvaRowData.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.error = null;
        state.notices = action.payload.notices;
        state.announcements = action.payload.announcements;
        state.center = action.payload.center;
      })
      .addCase(fetchNvaRowData.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to load NVA row.";
      });
  },
});

export const selectNvaRow = (state) => state.nvaRow || initialState;

export default nvaRowSlice.reducer;