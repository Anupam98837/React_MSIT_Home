import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  fetchJson,
  shouldFetchBlock,
} from "../request";

const GALLERY_ENDPOINT = "/api/public/gallery?page=1&per_page=500";
const DEPARTMENTS_ENDPOINT = "/api/public/departments";

const pickItems = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const pickText = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null) {
      const text = String(value).trim();
      if (text) return text;
    }
  }
  return "";
};

const normalizeTags = (raw) => {
  if (Array.isArray(raw)) {
    return Array.from(
      new Set(
        raw
          .map((tag) => pickText(tag).replace(/^#+/, ""))
          .filter(Boolean)
      )
    );
  }

  const text = pickText(raw);
  if (!text) return [];

  try {
    if (text.startsWith("[") || text.startsWith("{")) {
      return normalizeTags(JSON.parse(text));
    }
  } catch {
    // ignore parse error
  }

  const parts = text.includes("|")
    ? text.split("|")
    : text.includes(",")
      ? text.split(",")
      : text.split(/\s+/);

  return Array.from(
    new Set(
      parts
        .map((tag) => pickText(tag).replace(/^#+/, ""))
        .filter(Boolean)
    )
  );
};

const toTimestamp = (value) => {
  const text = pickText(value);
  if (!text) return 0;

  const candidates = [text, text.replace(" ", "T")];
  for (const candidate of candidates) {
    const ts = Date.parse(candidate);
    if (Number.isFinite(ts)) return ts;
  }

  return 0;
};

const isWithinPublishWindow = (item) => {
  const now = Date.now();
  const publishAt = toTimestamp(item?.publish_at);
  const expireAt = toTimestamp(item?.expire_at);

  if (publishAt && publishAt > now) return false;
  if (expireAt && expireAt < now) return false;

  return true;
};

const isApprovedVisibleItem = (item) => {
  const workflowStatus = pickText(item?.workflow_status).toLowerCase();
  const status = pickText(item?.status || "published").toLowerCase();
  const approvedFlag = Number(item?.is_approved ?? 0) === 1;
  const rejectedFlag = Number(item?.is_rejected ?? 0) === 1;
  const hasApprovedAt = Boolean(pickText(item?.approved_at));

  if (item?.deleted_at) return false;
  if (rejectedFlag) return false;
  if (status && status !== "published") return false;
  if (!isWithinPublishWindow(item)) return false;

  return workflowStatus === "approved" || approvedFlag || hasApprovedAt;
};

const mapDepartment = (department) => ({
  id: department?.id ?? null,
  uuid: pickText(department?.uuid),
  title: pickText(department?.title, department?.name),
  shortcode: pickText(
    department?.short_name,
    department?.slug,
    department?.title,
    department?.name
  )
    .toLowerCase()
    .replace(/\s+/g, "-"),
  slug: pickText(department?.slug).toLowerCase(),
  active: department?.active ?? 1,
});

const mapGalleryItem = (item) => ({
  id: item?.id ?? null,
  uuid: pickText(item?.uuid),
  workflow_status: pickText(item?.workflow_status).toLowerCase(),
  is_approved: Number(item?.is_approved ?? 0),
  is_rejected: Number(item?.is_rejected ?? 0),
  approved_at: pickText(item?.approved_at),
  status: pickText(item?.status).toLowerCase(),
  publish_at: pickText(item?.publish_at),
  expire_at: pickText(item?.expire_at),
  created_at: pickText(item?.created_at),
  updated_at: pickText(item?.updated_at),
  deleted_at: item?.deleted_at ?? null,

  department_id: item?.department_id ?? null,
  department_uuid: pickText(item?.department_uuid),
  department_slug: pickText(item?.department_slug).toLowerCase(),
  department_title: pickText(item?.department_title),

  image: pickText(item?.image),
  image_url: pickText(item?.image_url),
  title: pickText(item?.title),
  description: pickText(item?.description),
  tags: normalizeTags(item?.tags ?? item?.tags_json),

  event_shortcode: pickText(item?.event_shortcode, item?.event?.shortcode),
  event_title: pickText(item?.event_title, item?.event?.title),
  event_description: pickText(item?.event_description, item?.event?.description),
  event_date: pickText(item?.event_date, item?.event?.date),
  has_event:
    Boolean(item?.has_event) ||
    Boolean(pickText(item?.event_shortcode, item?.event?.shortcode)),

  visible: isApprovedVisibleItem(item),
});

export const fetchGalleryDepartments = createAsyncThunk(
  "galleryViewAll/fetchDepartments",
  async (_, { rejectWithValue }) => {
    try {
      const payload = await fetchJson(DEPARTMENTS_ENDPOINT);

      return pickItems(payload)
        .map(mapDepartment)
        .filter((department) => department.uuid && department.title)
        .filter((department) => String(department.active) === "1");
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to fetch departments");
    }
  },
  {
    condition: (arg, { getState }) => {
      const state = getState()?.galleryViewAll;
      const block = {
        status: state?.departments?.status || "idle",
        loadedAt: state?.departments?.loadedAt || 0,
      };
      return shouldFetchBlock(block, arg?.force === true, REQUEST_CACHE_TTL_MS);
    },
  }
);

export const fetchGalleryList = createAsyncThunk(
  "galleryViewAll/fetchGalleryList",
  async (_, { rejectWithValue }) => {
    try {
      const payload = await fetchJson(GALLERY_ENDPOINT);
      return pickItems(payload).map(mapGalleryItem);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to fetch gallery");
    }
  },
  {
    condition: (arg, { getState }) => {
      const state = getState()?.galleryViewAll;
      const block = {
        status: state?.gallery?.status || "idle",
        loadedAt: state?.gallery?.loadedAt || 0,
      };
      return shouldFetchBlock(block, arg?.force === true, REQUEST_CACHE_TTL_MS);
    },
  }
);

const initialState = {
  departments: {
    status: "idle",
    error: "",
    loadedAt: 0,
    items: [],
  },
  gallery: {
    status: "idle",
    error: "",
    loadedAt: 0,
    items: [],
  },
};

const gallerySlice = createSlice({
  name: "galleryViewAll",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGalleryDepartments.pending, (state) => {
        state.departments.status = "loading";
        state.departments.error = "";
      })
      .addCase(fetchGalleryDepartments.fulfilled, (state, action) => {
        state.departments.status = "succeeded";
        state.departments.error = "";
        state.departments.loadedAt = Date.now();
        state.departments.items = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchGalleryDepartments.rejected, (state, action) => {
        state.departments.status = "failed";
        state.departments.error = action.payload || "Failed to fetch departments";
      })
      .addCase(fetchGalleryList.pending, (state) => {
        state.gallery.status = "loading";
        state.gallery.error = "";
      })
      .addCase(fetchGalleryList.fulfilled, (state, action) => {
        state.gallery.status = "succeeded";
        state.gallery.error = "";
        state.gallery.loadedAt = Date.now();
        state.gallery.items = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchGalleryList.rejected, (state, action) => {
        state.gallery.status = "failed";
        state.gallery.error = action.payload || "Failed to fetch gallery";
      });
  },
});

export const selectGalleryDepartments = (state) =>
  state.galleryViewAll?.departments?.items || [];

export const selectGalleryDepartmentsStatus = (state) =>
  state.galleryViewAll?.departments?.status || "idle";

export const selectGalleryDepartmentsError = (state) =>
  state.galleryViewAll?.departments?.error || "";

export const selectGalleryItems = (state) =>
  state.galleryViewAll?.gallery?.items || [];

export const selectGalleryVisibleItems = (state) =>
  (state.galleryViewAll?.gallery?.items || []).filter((item) => item?.visible);

export const selectGalleryStatus = (state) =>
  state.galleryViewAll?.gallery?.status || "idle";

export const selectGalleryError = (state) =>
  state.galleryViewAll?.gallery?.error || "";

export default gallerySlice.reducer;