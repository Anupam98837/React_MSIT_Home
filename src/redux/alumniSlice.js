import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  fetchJson,
  shouldFetchBlock,
} from "./request";

const ALUMNI_PATH = "/api/public/grand-homepage/alumni-speak";

export const fetchAlumni = createAsyncThunk(
  "alumni/fetchAlumni",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetchJson(ALUMNI_PATH);
      return res?.alumni_speak || null;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to load alumni");
    }
  },
  {
    condition: (arg, { getState }) =>
      shouldFetchBlock(getState()?.alumni, arg?.force === true, REQUEST_CACHE_TTL_MS),
  }
);

const alumniSlice = createSlice({
  name: "alumni",
  initialState: {
    items: [],
    title: "Alumni Speak",
    loading: false,
    error: null,
    status: "idle",
    loadedAt: 0,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlumni.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.status = "loading";
      })
      .addCase(fetchAlumni.fulfilled, (state, action) => {
        state.loading = false;
        state.status = "succeeded";
        state.loadedAt = Date.now();
        state.items = action.payload?.iframe_urls_json || [];
        state.title = action.payload?.title || "Alumni Speak";
      })
      .addCase(fetchAlumni.rejected, (state, action) => {
        state.loading = false;
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export default alumniSlice.reducer;
