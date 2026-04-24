import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { REQUEST_CACHE_TTL_MS, fetchJson, shouldFetchBlock } from "./request";

const TESTIMONIALS_ENDPOINT = "/api/public/grand-homepage/successful-entrepreneurs";

export const fetchTestimonials = createAsyncThunk(
  "testimonials/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const payload = await fetchJson(TESTIMONIALS_ENDPOINT);
      return payload?.successful_entrepreneurs || payload?.data || [];
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch testimonials");
    }
  },
  {
    condition: (arg, { getState }) =>
      shouldFetchBlock(getState()?.testimonials, arg?.force === true, REQUEST_CACHE_TTL_MS),
  }
);

const testimonialsSlice = createSlice({
  name: "testimonials",
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
      .addCase(fetchTestimonials.pending, (state) => {
        state.loading = true;
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchTestimonials.fulfilled, (state, action) => {
        state.loading = false;
        state.status = "succeeded";
        state.items = action.payload;
        state.loadedAt = Date.now();
      })
      .addCase(fetchTestimonials.rejected, (state, action) => {
        state.loading = false;
        state.status = "failed";
        state.error = action.payload || "Failed to fetch testimonials";
        state.loadedAt = Date.now();
      });
  },
});

export default testimonialsSlice.reducer;
