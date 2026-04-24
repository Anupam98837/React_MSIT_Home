import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  fetchJson,
  shouldFetchBlock,
} from "../request";

const ANNOUNCEMENTS_ENDPOINT =
  "/api/public/announcements?page=1&per_page=500&sort=created_at&direction=desc";

const pickAnnouncements = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const isApprovedAnnouncement = (item) =>
  String(item?.workflow_status || "").toLowerCase() === "approved";

export const fetchAnnouncements = createAsyncThunk(
  "announcement/fetchAnnouncements",
  async (_, { rejectWithValue }) => {
    try {
      const payload = await fetchJson(ANNOUNCEMENTS_ENDPOINT);
      return pickAnnouncements(payload);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to fetch announcements");
    }
  },
  {
    condition: (arg, { getState }) =>
      shouldFetchBlock(
        getState()?.announcement,
        arg?.force === true,
        REQUEST_CACHE_TTL_MS
      ),
  }
);

const initialState = {
  announcements: [],
  status: "idle",
  loading: false,
  error: null,
  loadedAt: 0,
  search: "",
  deptUuid: "",
  deptId: null,
  deptName: "",
  deptSlug: "",
  page: 1,
  perPage: 9,
};

const announcementSlice = createSlice({
  name: "announcement",
  initialState,
  reducers: {
    setSearch: (state, action) => {
      state.search = action.payload;
      state.page = 1;
    },
    setDept: (state, action) => {
      const d = action.payload || {};
      state.deptUuid = d.department_uuid || d.uuid || "";
      state.deptId = d.department_id || d.id || null;
      state.deptName = d.department_title || d.title || d.name || "";
      state.deptSlug = d.department_slug || d.slug || "";
      state.page = 1;
    },
    setPage: (state, action) => {
      state.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnnouncements.pending, (state) => {
        state.status = "loading";
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnnouncements.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.loading = false;
        state.error = null;
        state.loadedAt = Date.now();

        const items = Array.isArray(action.payload) ? action.payload : [];
        state.announcements = items.filter(isApprovedAnnouncement);
      })
      .addCase(fetchAnnouncements.rejected, (state, action) => {
        state.status = "failed";
        state.loading = false;
        state.error = action.payload || "Failed to fetch announcements";
      });
  },
});

export const { setSearch, setDept, setPage } = announcementSlice.actions;

export default announcementSlice.reducer;