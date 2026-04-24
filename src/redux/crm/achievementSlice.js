import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  fetchJson,
  shouldFetchBlock,
} from "../request";

const ACHIEVEMENTS_ENDPOINT = "/api/public/achievements";

const pickAchievements = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const isApprovedAchievement = (item) =>
  String(item?.workflow_status || "").toLowerCase() === "approved";

export const fetchAchievements = createAsyncThunk(
  "achievements/fetchAchievements",
  async (_, { rejectWithValue }) => {
    try {
      const payload = await fetchJson(ACHIEVEMENTS_ENDPOINT);
      return pickAchievements(payload);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to fetch achievements");
    }
  },
  {
    condition: (arg, { getState }) =>
      shouldFetchBlock(
        getState()?.achievements,
        arg?.force === true,
        REQUEST_CACHE_TTL_MS
      ),
  }
);

const initialState = {
  achievements: [],
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
  perPage: 10,
};

const achievementSlice = createSlice({
  name: "achievements",
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
      .addCase(fetchAchievements.pending, (state) => {
        state.status = "loading";
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAchievements.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.loading = false;
        state.error = null;
        state.loadedAt = Date.now();

        const items = Array.isArray(action.payload) ? action.payload : [];
        state.achievements = items.filter(isApprovedAchievement);
      })
      .addCase(fetchAchievements.rejected, (state, action) => {
        state.status = "failed";
        state.loading = false;
        state.error = action.payload || "Failed to fetch achievements";
      });
  },
});

export const { setSearch, setDept, setPage } = achievementSlice.actions;

export default achievementSlice.reducer;