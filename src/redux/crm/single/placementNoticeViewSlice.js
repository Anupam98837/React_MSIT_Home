import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  fetchJson,
  shouldFetchBlock,
} from "../../request";

/* ENDPOINTS */
const ENDPOINTS = [
  (slug) => `/api/public/placement-notices/${slug}`,
  (slug) => `/public/placement-notices/${slug}`,
  (slug) => `/api/placement-notices/${slug}`,
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

const normalizeStatus = (value) => String(value || "").trim().toLowerCase();

const isTruthyFlag = (value) => value === true || value === 1 || String(value) === "1";

const APPROVED_STATUSES = new Set([
  "approved",
  "published",
  "publish",
  "live",
  "active",
  "visible",
]);

const PENDING_STATUSES = new Set([
  "pending",
  "review",
  "under_review",
  "in_review",
  "approval_pending",
  "draft",
  "hold",
  "on_hold",
]);

const getNoticeStatus = (notice) =>
  normalizeStatus(
    notice?.approval_status ||
      notice?.approvalStatus ||
      notice?.status ||
      notice?.publish_status ||
      notice?.state
  );

const isApprovedNotice = (notice) => {
  if (!isObject(notice)) return false;

  const status = getNoticeStatus(notice);
  if (status && APPROVED_STATUSES.has(status)) return true;

  if (
    isTruthyFlag(notice.is_approved) ||
    isTruthyFlag(notice.approved) ||
    isTruthyFlag(notice.is_published) ||
    isTruthyFlag(notice.published)
  ) {
    return true;
  }

  if (
    notice.approved_at ||
    notice.approvedAt ||
    notice.published_at ||
    notice.publishedAt
  ) {
    return true;
  }

  return false;
};

const isPendingNotice = (notice) => {
  if (!isObject(notice)) return false;

  const status = getNoticeStatus(notice);
  if (status && PENDING_STATUSES.has(status)) return true;

  if (
    isTruthyFlag(notice.is_pending) ||
    isTruthyFlag(notice.pending) ||
    isTruthyFlag(notice.awaiting_approval) ||
    isTruthyFlag(notice.needs_approval)
  ) {
    return true;
  }

  return false;
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
          url = resolveUrl(item.url || item.path || item.file || item.href || "");
          name =
            item.name ||
            item.title ||
            (url ? url.split("/").pop() : name);
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
  } catch {
    return [];
  }
};

/* CACHE */
const CACHE_PREFIX = "placementNoticeView:lastApproved:";

const getCacheKey = (slug) => `${CACHE_PREFIX}${normalizeSlug(slug)}`;

const readCachedApprovedNotice = (slug) => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(getCacheKey(slug));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const writeCachedApprovedNotice = (slug, notice) => {
  if (typeof window === "undefined") return;

  try {
    if (!notice) {
      window.localStorage.removeItem(getCacheKey(slug));
      return;
    }

    window.localStorage.setItem(getCacheKey(slug), JSON.stringify(notice));
  } catch {
    // ignore storage failures
  }
};

/* FIND OBJECT */
const findPlacementNoticeObject = (payload, slug) => {
  if (!payload) return null;

  if (Array.isArray(payload)) {
    return (
      payload.find(
        (item) =>
          String(item?.slug || "") === normalizeSlug(slug) ||
          String(item?.uuid || "") === normalizeSlug(slug) ||
          String(item?.id || "") === normalizeSlug(slug)
      ) || payload[0] || null
    );
  }

  if (Array.isArray(payload?.data)) {
    return (
      payload.data.find(
        (item) =>
          String(item?.slug || "") === normalizeSlug(slug) ||
          String(item?.uuid || "") === normalizeSlug(slug) ||
          String(item?.id || "") === normalizeSlug(slug)
      ) || payload.data[0] || null
    );
  }

  if (Array.isArray(payload?.data?.data)) {
    return (
      payload.data.data.find(
        (item) =>
          String(item?.slug || "") === normalizeSlug(slug) ||
          String(item?.uuid || "") === normalizeSlug(slug) ||
          String(item?.id || "") === normalizeSlug(slug)
      ) || payload.data.data[0] || null
    );
  }

  if (isObject(payload?.data?.placement_notice)) return payload.data.placement_notice;
  if (isObject(payload?.data?.notice)) return payload.data.notice;
  if (isObject(payload?.data?.item)) return payload.data.item;

  if (isObject(payload?.placement_notice)) return payload.placement_notice;
  if (isObject(payload?.notice)) return payload.notice;
  if (isObject(payload?.item)) return payload.item;

  if (isObject(payload?.data)) return payload.data;

  if (
    isObject(payload) &&
    (payload.title || payload.description || payload.slug || payload.uuid || payload.id)
  ) {
    return payload;
  }

  return null;
};

const extractCandidateFromKeys = (payload, slug, keys = []) => {
  for (const key of keys) {
    const value = payload?.[key];
    if (value == null) continue;

    const nested = findPlacementNoticeObject(value, slug);
    if (nested) return nested;

    if (isObject(value)) return value;
  }

  return null;
};

const resolveApprovedAndPendingNotice = (payload, slug) => {
  const currentNotice = extractCandidateFromKeys(payload, slug, [
    "current_notice",
    "current_data",
    "approved_notice",
    "approved_data",
    "live_notice",
    "live_data",
    "published_notice",
    "published_data",
    "old_notice",
    "old_data",
    "existing_notice",
    "existing_data",
    "previous_notice",
    "previous_data",
    "before_update",
    "before",
    "original_notice",
    "original_data",
  ]);

  const pendingNotice = extractCandidateFromKeys(payload, slug, [
    "pending_notice",
    "pending_data",
    "draft_notice",
    "draft_data",
    "updated_notice",
    "updated_data",
    "proposed_notice",
    "proposed_data",
    "revision_notice",
    "revision_data",
    "new_notice",
    "new_data",
    "change_notice",
    "change_data",
    "after_update",
    "after",
  ]);

  const directNotice = findPlacementNoticeObject(payload, slug);

  if (currentNotice) {
    return {
      notice: currentNotice,
      pendingNotice: pendingNotice || (isPendingNotice(directNotice) ? directNotice : null),
    };
  }

  if (directNotice) {
    return {
      notice: directNotice,
      pendingNotice: pendingNotice || null,
    };
  }

  if (pendingNotice) {
    return {
      notice: null,
      pendingNotice,
    };
  }

  return {
    notice: null,
    pendingNotice: null,
  };
};

/* NORMALIZE NOTICE OBJECT */
const normalizePlacementNoticeObject = (raw) => {
  if (!isObject(raw)) return null;

  const notice = { ...raw };

  const coverCandidate = pickFirstUrl(
    raw.cover_image_url,
    raw.cover_image,
    raw.banner_image,
    raw.image,
    raw.cover,
    raw.banner,
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

/* THUNK WITH CACHING */
export const fetchPlacementNoticeView = createAsyncThunk(
  "placementNoticeView/fetchPlacementNoticeView",
  async (slug, { rejectWithValue }) => {
    const identifier = normalizeSlug(slug);

    if (!identifier) {
      return rejectWithValue("No identifier found in the URL.");
    }

    try {
      for (const fn of ENDPOINTS) {
        try {
          const payload = await fetchJson(fn(identifier));
          const { notice, pendingNotice } = resolveApprovedAndPendingNotice(
            payload,
            identifier
          );

          if (notice || pendingNotice) {
            return {
              notice: normalizePlacementNoticeObject(notice),
              pendingNotice: normalizePlacementNoticeObject(pendingNotice),
            };
          }
        } catch {
          continue;
        }
      }

      return rejectWithValue(
        "Placement Notice not found or API endpoint is not reachable. Please verify your public show route URL (expected: /api/public/placement-notices/{identifier})."
      );
    } catch (error) {
      return rejectWithValue(
        error?.message ||
          "Placement Notice not found or API endpoint is not reachable. Please verify your public show route URL (expected: /api/public/placement-notices/{identifier})."
      );
    }
  },
  {
    condition: (slug, { getState }) => {
      const identifier = normalizeSlug(slug);
      if (!identifier) return false;

      const state = getState()?.placementNoticeView;
      if (state?.loadedSlug !== identifier) return true;

      return shouldFetchBlock(state, false, REQUEST_CACHE_TTL_MS);
    },
  }
);

/* SLICE */
const initialState = {
  notice: null,
  pendingNotice: null,
  status: "idle",
  loading: false,
  error: null,
  loadedAt: 0,
  loadedSlug: "",
};

const placementNoticeViewSlice = createSlice({
  name: "placementNoticeView",
  initialState,
  reducers: {
    clearPlacementNoticeView: (state) => {
      state.notice = null;
      state.pendingNotice = null;
      state.status = "idle";
      state.loading = false;
      state.error = null;
      state.loadedAt = 0;
      state.loadedSlug = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlacementNoticeView.pending, (state) => {
        state.status = "loading";
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlacementNoticeView.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.loading = false;
        state.error = null;
        state.loadedAt = Date.now();

        const slug = normalizeSlug(action.meta.arg);
        const incomingNotice = normalizePlacementNoticeObject(action.payload?.notice);
        const incomingPendingNotice = normalizePlacementNoticeObject(action.payload?.pendingNotice);
        const cachedApprovedNotice = readCachedApprovedNotice(slug);
        const previousApprovedNotice = state.loadedSlug === slug ? state.notice : null;
        const fallbackApprovedNotice =
          previousApprovedNotice || cachedApprovedNotice || null;

        if (incomingNotice) {
          if (isApprovedNotice(incomingNotice)) {
            state.notice = incomingNotice;
            writeCachedApprovedNotice(slug, incomingNotice);
          } else if (fallbackApprovedNotice) {
            state.notice = fallbackApprovedNotice;
          } else {
            state.notice = incomingNotice;
          }
        } else if (fallbackApprovedNotice) {
          state.notice = fallbackApprovedNotice;
        } else {
          state.notice = null;
        }

        state.pendingNotice =
          incomingPendingNotice ||
          (incomingNotice && isPendingNotice(incomingNotice) ? incomingNotice : null);
        state.loadedSlug = slug;
      })
      .addCase(fetchPlacementNoticeView.rejected, (state, action) => {
        state.status = "failed";
        state.loading = false;
        state.error =
          action.payload ||
          "Placement Notice not found or API endpoint is not reachable. Please verify your public show route URL (expected: /api/public/placement-notices/{identifier}).";
      });
  },
});

/* EXPORTS */
export const { clearPlacementNoticeView } = placementNoticeViewSlice.actions;
export const selectPlacementNoticeView = (state) => state.placementNoticeView;

export default placementNoticeViewSlice.reducer;