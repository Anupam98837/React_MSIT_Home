const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
export const REQUEST_CACHE_TTL_MS = 5 * 60 * 1000;

const requestCache = new Map();
const inflightRequests = new Map();

export const buildUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  const normalized = path.startsWith("/") ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${normalized}` : normalized;
};

const getRequestCacheKey = (url, options = {}) => {
  const method = (options.method || "GET").toString().toUpperCase();

  if (method !== "GET" || options.skipMemoryCache) {
    return "";
  }

  return `${options.withAuth ? "auth" : "public"}:${url}`;
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

export const fetchJson = async (path, options = {}) => {
  const url = buildUrl(path);
  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
  };

  if (options.withAuth) {
    const token =
      sessionStorage.getItem("token") || localStorage.getItem("token") || "";

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

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

  if (cacheKey) {
    inflightRequests.set(cacheKey, requestPromise);
  }

  try {
    return await requestPromise;
  } finally {
    if (cacheKey) {
      inflightRequests.delete(cacheKey);
    }
  }
};

export const shouldFetchBlock = (block, force = false, ttl = REQUEST_CACHE_TTL_MS) => {
  if (force) return true;
  if (!block) return true;
  if (block.status === "loading") return false;

  if (
    block.status === "succeeded" &&
    block.loadedAt &&
    Date.now() - block.loadedAt < ttl
  ) {
    return false;
  }

  return true;
};

export const createAsyncState = (extra = {}) => ({
  status: "idle",
  error: "",
  loadedAt: 0,
  ...extra,
});

export const pickArray = (input) => {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input?.data)) return input.data;
  if (Array.isArray(input?.items)) return input.items;
  if (Array.isArray(input?.contacts)) return input.contacts;
  if (Array.isArray(input?.contact_infos)) return input.contact_infos;
  return [];
};

export const getText = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null) {
      const text = String(value).trim();
      if (text) return text;
    }
  }
  return "";
};

export const decodeHtmlEntities = (value) => {
  try {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = String(value ?? "");
    return textarea.value;
  } catch {
    return String(value ?? "");
  }
};
