import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  fetchJson,
  shouldFetchBlock,
} from "../request";

const NOTICES_ENDPOINT =
  "/api/public/notices?page=1&per_page=500&visible_now=1&sort=created_at&direction=desc";
const DEPARTMENTS_ENDPOINT = "/api/public/departments";

const pickNotices = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const pickDepartments = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const isApprovedNotice = (item) =>
  String(item?.workflow_status || "").toLowerCase() === "approved";

const mapDepartment = (d) => ({
  id: d?.id ?? null,
  uuid: d?.uuid || "",
  title: d?.title || d?.name || "",
  slug: (d?.slug || "").toString().trim().toLowerCase(),
  shortcode: (d?.slug || d?.short_name || d?.title || d?.name || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-"),
});

export const fetchNotices = createAsyncThunk(
  "notices/fetchNotices",
  async (_, { rejectWithValue }) => {
    try {
      const payload = await fetchJson(NOTICES_ENDPOINT);
      return pickNotices(payload);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to fetch notices");
    }
  },
  {
    condition: (arg, { getState }) =>
      shouldFetchBlock(
        getState()?.notices,
        arg?.force === true,
        REQUEST_CACHE_TTL_MS
      ),
  }
);

export const fetchDepartments = createAsyncThunk(
  "notices/fetchDepartments",
  async (_, { rejectWithValue }) => {
    try {
      const payload = await fetchJson(DEPARTMENTS_ENDPOINT);
      return pickDepartments(payload);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to fetch departments");
    }
  },
  {
    condition: (arg, { getState }) => {
      const state = getState()?.notices;
      const block = {
        status: state?.departmentsStatus || "idle",
        loadedAt: state?.departmentsLoadedAt || 0,
      };
      return shouldFetchBlock(block, arg?.force === true, REQUEST_CACHE_TTL_MS);
    },
  }
);

const initialState = {
  notices: [],
  departments: [],
  status: "idle",
  departmentsStatus: "idle",
  loading: false,
  error: null,
  departmentsError: null,
  loadedAt: 0,
  departmentsLoadedAt: 0,
  search: "",
  deptId: null,
  deptUuid: "",
  deptName: "",
  deptSlug: "",
  page: 1,
  perPage: 9,
};

const noticeSlice = createSlice({
  name: "notices",
  initialState,
  reducers: {
    setSearch: (state, action) => {
      state.search = action.payload;
      state.page = 1;
    },
    setDept: (state, action) => {
      const d = action.payload || {};
      state.deptId = d.department_id || d.id || null;
      state.deptUuid = d.department_uuid || d.uuid || "";
      state.deptName = d.department_title || d.title || d.name || "";
      state.deptSlug = d.department_slug || d.slug || d.shortcode || "";
      state.page = 1;
    },
    setPage: (state, action) => {
      state.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotices.pending, (state) => {
        state.status = "loading";
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotices.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.loading = false;
        state.error = null;
        state.loadedAt = Date.now();

        const items = Array.isArray(action.payload) ? action.payload : [];
        state.notices = items.filter(isApprovedNotice);
      })
      .addCase(fetchNotices.rejected, (state, action) => {
        state.status = "failed";
        state.loading = false;
        state.error = action.payload || "Failed to fetch notices";
      })
      .addCase(fetchDepartments.pending, (state) => {
        state.departmentsStatus = "loading";
        state.departmentsError = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.departmentsStatus = "succeeded";
        state.departmentsError = null;
        state.departmentsLoadedAt = Date.now();

        const items = Array.isArray(action.payload) ? action.payload : [];

        state.departments = items
          .filter((d) => String(d?.active ?? 1) === "1")
          .map(mapDepartment)
          .filter((d) => d.uuid && d.title);
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.departmentsStatus = "failed";
        state.departmentsError = action.payload || "Failed to fetch departments";
      });
  },
});

export const { setSearch, setDept, setPage } = noticeSlice.actions;

export default noticeSlice.reducer;