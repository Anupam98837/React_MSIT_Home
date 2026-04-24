import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { REQUEST_CACHE_TTL_MS, fetchJson, shouldFetchBlock } from "./request";

const STICKY_BUTTONS_ENDPOINT = "/api/public/sticky-buttons";

const normalizeStickyButtons = (payload) => {
  const raw = payload?.data?.[0]?.buttons_json;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const fetchStickyButtons = createAsyncThunk(
  "stickyButtons/fetchStickyButtons",
  async (_, { rejectWithValue }) => {
    try {
      return normalizeStickyButtons(await fetchJson(STICKY_BUTTONS_ENDPOINT));
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch sticky buttons");
    }
  },
  {
    condition: (arg, { getState }) =>
      shouldFetchBlock(getState()?.stickyButtons, arg?.force === true, REQUEST_CACHE_TTL_MS),
  }
);

const stickyButtonsSlice = createSlice({
  name: "stickyButtons",
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
      .addCase(fetchStickyButtons.pending, (state) => {
        state.loading = true;
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchStickyButtons.fulfilled, (state, action) => {
        state.loading = false;
        state.status = "succeeded";
        state.items = action.payload;
        state.loadedAt = Date.now();
      })
      .addCase(fetchStickyButtons.rejected, (state, action) => {
        state.loading = false;
        state.status = "failed";
        state.error = action.payload || "Failed to fetch sticky buttons";
        state.loadedAt = Date.now();
      });
  },
});

export const selectStickyButtons = (state) => state.stickyButtons?.items || [];
export default stickyButtonsSlice.reducer;
