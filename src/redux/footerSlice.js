import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const REQUEST_CACHE_TTL_MS = 5 * 60 * 1000;

const requestCache = new Map();
const inflightRequests = new Map();

const ENDPOINT = "/api/footer-components";

const buildUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  const normalized = path.startsWith("/") ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${normalized}` : normalized;
};

const getRequestCacheKey = (url, options = {}) => {
  const method = String(options.method || "GET").toUpperCase();
  if (method !== "GET" || options.skipMemoryCache) return "";
  return `private:${url}`;
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

const getAuthHeaders = (withAuth = true) => {
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token") || "";

  const headers = { Accept: "application/json" };
  if (withAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const fetchJson = async (path, options = {}) => {
  const url = buildUrl(path);
  const headers = {
    ...getAuthHeaders(options.withAuth !== false),
    ...(options.headers || {}),
  };

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

const pickLatestItem = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data[0] || null;
  if (Array.isArray(payload)) return payload[0] || null;
  return null;
};

const initialState = {
  item: null,
  status: "idle",
  error: "",
  loadedAt: 0,
};

export const fetchFooterData = createAsyncThunk(
  "footer/fetchFooterData",
  async (_, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        per_page: "1",
        page: "1",
        sort: "updated_at",
        direction: "desc",
      });

      const payload = await fetchJson(`${ENDPOINT}?${params.toString()}`, {
        withAuth: true,
      });

      return pickLatestItem(payload);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to load footer.");
    }
  },
  {
    condition: (arg, { getState }) => {
      const footer = getState()?.footer;
      if (!footer) return true;
      if (arg?.force === true) return true;
      if (footer.status === "loading") return false;

      if (
        footer.status === "succeeded" &&
        footer.loadedAt &&
        Date.now() - footer.loadedAt < REQUEST_CACHE_TTL_MS
      ) {
        return false;
      }

      return true;
    },
  }
);

const footerSlice = createSlice({
  name: "footer",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFooterData.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(fetchFooterData.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.error = "";
        state.item = action.payload || null;
        state.loadedAt = Date.now();
      })
      .addCase(fetchFooterData.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to load footer.";
        state.loadedAt = Date.now();
      });
  },
});

export const selectFooter = (state) => state.footer || initialState;
export default footerSlice.reducer;