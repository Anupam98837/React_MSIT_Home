import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { REQUEST_CACHE_TTL_MS, fetchJson, shouldFetchBlock } from "./request";

const RECRUITERS_ENDPOINT = "/api/public/recruiters?page=1&per_page=500&sort=created_at&direction=desc";

const extractRecruiters = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

export const fetchRecruiters = createAsyncThunk(
  "recruiters/fetchRecruiters",
  async (_, { rejectWithValue }) => {
    try {
      const payload = await fetchJson(RECRUITERS_ENDPOINT);
      return extractRecruiters(payload);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to fetch recruiters");
    }
  },
  {
    condition: (arg, { getState }) =>
      shouldFetchBlock(getState()?.recruiters, arg?.force === true, REQUEST_CACHE_TTL_MS),
  }
);

const recruitersSlice = createSlice({
  name: "recruiters",
  initialState: {
    items: [],
    status: "idle",
    loading: false,
    loadedAt: 0,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecruiters.pending, (state) => {
        state.status = "loading";
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecruiters.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.loading = false;
        state.loadedAt = Date.now();
        state.items = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchRecruiters.rejected, (state, action) => {
        state.status = "failed";
        state.loading = false;
        state.error = action.payload || "Failed to fetch recruiters";
        state.items = [];
      });
  },
});

export const selectRecruiters = (state) => state.recruiters?.items || [];

export default recruitersSlice.reducer;
