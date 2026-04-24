import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { REQUEST_CACHE_TTL_MS, fetchJson, shouldFetchBlock } from "./request";

const STATS_ENDPOINT = "/api/public/grand-homepage/stats";

export const fetchStats = createAsyncThunk(
  "stats/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const payload = await fetchJson(STATS_ENDPOINT);
      return payload?.stats || payload?.data || payload || null;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch stats");
    }
  },
  {
    condition: (arg, { getState }) =>
      shouldFetchBlock(getState()?.stats, arg?.force === true, REQUEST_CACHE_TTL_MS),
  }
);

const statsSlice = createSlice({
  name: "stats",
  initialState: {
    data: null,
    status: "idle",
    error: null,
    loadedAt: 0,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStats.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
        state.loadedAt = Date.now();
      })
      .addCase(fetchStats.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to fetch stats";
        state.loadedAt = Date.now();
      });
  },
});

export default statsSlice.reducer;
