import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  createAsyncState,
  fetchJson,
  shouldFetchBlock,
} from "../request";

const STORIES_PATH = "/api/public/success-stories";
const DEPT_PATH = "/api/public/departments";

const withQuery = (path, params) => `${path}?${new URLSearchParams(params).toString()}`;

const toItems = (js) => {
  if (Array.isArray(js?.data)) return js.data;
  if (Array.isArray(js?.items)) return js.items;
  if (Array.isArray(js)) return js;
  if (Array.isArray(js?.data?.items)) return js.data.items;
  return [];
};

const normalizeDepartments = (items) =>
  (Array.isArray(items) ? items : [])
    .map((d) => ({
      id: d?.id ?? null,
      uuid: (d?.uuid ?? "").toString().trim(),
      shortcode: (d?.short_name ?? d?.slug ?? "").toString().trim().toLowerCase(),
      slug: (d?.slug ?? "").toString().trim(),
      title: (d?.title ?? d?.name ?? "").toString().trim(),
      active: d?.active ?? 1,
    }))
    .filter((d) => d.uuid && d.title && String(d.active) === "1");

const resolveKey = (item) => {
  const uuid = String(item?.uuid || "").trim();
  if (uuid) return uuid;
  const slug = String(item?.slug || "").trim();
  return slug ? `slug:${slug}` : "";
};

export const fetchSuccessStoriesDepartments = createAsyncThunk(
  "successStories/fetchDepartments",
  async (_, { rejectWithValue }) => {
    try {
      const js = await fetchJson(DEPT_PATH, { headers: { Accept: "application/json" } });
      return normalizeDepartments(toItems(js));
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to load departments");
    }
  },
  {
    condition: (arg, { getState }) =>
      shouldFetchBlock(getState()?.successStories?.departments, arg?.force === true, REQUEST_CACHE_TTL_MS),
  }
);

export const fetchSuccessStoriesList = createAsyncThunk(
  "successStories/fetchList",
  async (_, { rejectWithValue }) => {
    try {
      const js = await fetchJson(
        withQuery(STORIES_PATH, {
          page: "1",
          per_page: "200",
          visible_now: "1",
          sort: "created_at",
          direction: "desc",
        }),
        { headers: { Accept: "application/json" } }
      );
      return toItems(js);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to load success stories");
    }
  },
  {
    condition: (arg, { getState }) =>
      shouldFetchBlock(getState()?.successStories?.stories, arg?.force === true, REQUEST_CACHE_TTL_MS),
  }
);

const initialState = {
  departments: createAsyncState({ items: [] }),
  stories: createAsyncState({ items: [] }),
};

const successStoriesSlice = createSlice({
  name: "successStories",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuccessStoriesDepartments.pending, (state) => {
        state.departments.status = "loading";
        state.departments.error = "";
      })
      .addCase(fetchSuccessStoriesDepartments.fulfilled, (state, action) => {
        state.departments.status = "succeeded";
        state.departments.error = "";
        state.departments.items = action.payload || [];
        state.departments.loadedAt = Date.now();
      })
      .addCase(fetchSuccessStoriesDepartments.rejected, (state, action) => {
        state.departments.status = "failed";
        state.departments.error = action.payload || "Failed to load departments";
      })
      .addCase(fetchSuccessStoriesList.pending, (state) => {
        state.stories.status = "loading";
        state.stories.error = "";
      })
      .addCase(fetchSuccessStoriesList.fulfilled, (state, action) => {
        state.stories.status = "succeeded";
        state.stories.error = "";
        state.stories.items = action.payload || [];
        state.stories.loadedAt = Date.now();
      })
      .addCase(fetchSuccessStoriesList.rejected, (state, action) => {
        state.stories.status = "failed";
        state.stories.error = action.payload || "Failed to load success stories";
      });
  },
});

export const selectSuccessStoriesDepartments = (state) =>
  state.successStories?.departments?.items || [];

export const selectSuccessStoriesDepartmentsStatus = (state) =>
  state.successStories?.departments?.status || "idle";

export const selectSuccessStoriesDepartmentsError = (state) =>
  state.successStories?.departments?.error || "";

export const selectSuccessStoriesItems = (state) =>
  state.successStories?.stories?.items || [];

export const selectSuccessStoriesStatus = (state) =>
  state.successStories?.stories?.status || "idle";

export const selectSuccessStoriesError = (state) =>
  state.successStories?.stories?.error || "";

export const selectSuccessStoryKey = (item) => resolveKey(item);

export default successStoriesSlice.reducer;
