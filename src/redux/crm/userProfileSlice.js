import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  fetchJson,
  shouldFetchBlock,
} from "../request";

const PROFILE_BLOCK = () => ({
  status: "idle",
  error: "",
  loadedAt: 0,
  data: null,
});

const getSlug = (input) => {
  const value =
    typeof input === "string" ? input : input?.slug ?? input?.id ?? "";
  return String(value || "").trim();
};

export const fetchUserProfile = createAsyncThunk(
  "userProfile/fetchUserProfile",
  async (input, { rejectWithValue }) => {
    const slug = getSlug(input);
    if (!slug) {
      return rejectWithValue("Profile slug is missing");
    }

    try {
      const payload = await fetchJson(
        `/api/users/${encodeURIComponent(slug)}/profile`
      );

      return {
        slug,
        data: payload?.data || {},
      };
    } catch (error) {
      return rejectWithValue({
        slug,
        message: error?.message || "Failed to fetch user profile",
      });
    }
  },
  {
    condition: (input, { getState }) => {
      const slug = getSlug(input);
      if (!slug) return false;

      const state = getState()?.userProfile;
      const block = state?.bySlug?.[slug] || PROFILE_BLOCK();

      return shouldFetchBlock(
        block,
        Boolean(input?.force),
        REQUEST_CACHE_TTL_MS
      );
    },
  }
);

const initialState = {
  bySlug: {},
};

const userProfileSlice = createSlice({
  name: "userProfile",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state, action) => {
        const slug = getSlug(action.meta.arg);
        if (!slug) return;

        if (!state.bySlug[slug]) {
          state.bySlug[slug] = PROFILE_BLOCK();
        }

        state.bySlug[slug].status = "loading";
        state.bySlug[slug].error = "";
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        const slug = getSlug(action.payload?.slug);
        if (!slug) return;

        state.bySlug[slug] = {
          status: "succeeded",
          error: "",
          loadedAt: Date.now(),
          data: action.payload?.data || {},
        };
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        const rejectedSlug =
          getSlug(action.payload?.slug) || getSlug(action.meta.arg);
        if (!rejectedSlug) return;

        if (!state.bySlug[rejectedSlug]) {
          state.bySlug[rejectedSlug] = PROFILE_BLOCK();
        }

        state.bySlug[rejectedSlug].status = "failed";
        state.bySlug[rejectedSlug].error =
          action.payload?.message ||
          action.error?.message ||
          "Failed to fetch user profile";
      });
  },
});

export const selectUserProfileBlock = (state, slug) =>
  state.userProfile?.bySlug?.[slug] || PROFILE_BLOCK();

export const selectUserProfileData = (state, slug) =>
  state.userProfile?.bySlug?.[slug]?.data || null;

export const selectUserProfileStatus = (state, slug) =>
  state.userProfile?.bySlug?.[slug]?.status || "idle";

export const selectUserProfileError = (state, slug) =>
  state.userProfile?.bySlug?.[slug]?.error || "";

export default userProfileSlice.reducer;