import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  fetchJson,
  shouldFetchBlock,
} from "./request";

const SUCCESS_PATH = "/api/public/grand-homepage/success-stories";

export const fetchSuccessStories = createAsyncThunk(
  "success/fetchSuccessStories",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetchJson(SUCCESS_PATH);
      return Array.isArray(res?.success_stories) ? res.success_stories : [];
    } catch (err) {
      return rejectWithValue(err.message || "Failed to load success stories");
    }
  },
  {
    condition: (arg, { getState }) =>
      shouldFetchBlock(getState()?.success, arg?.force === true, REQUEST_CACHE_TTL_MS),
  }
);

const successSlice = createSlice({
  name: "success",
  initialState: {
    items: [],
    loading: false,
    error: null,
    status: "idle",
    loadedAt: 0,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuccessStories.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.status = "loading";
      })
      .addCase(fetchSuccessStories.fulfilled, (state, action) => {
        state.loading = false;
        state.status = "succeeded";
        state.loadedAt = Date.now();
        state.items = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchSuccessStories.rejected, (state, action) => {
        state.loading = false;
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export default successSlice.reducer;
