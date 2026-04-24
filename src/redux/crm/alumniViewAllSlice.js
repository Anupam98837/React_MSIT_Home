import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  createAsyncState,
  fetchJson,
  shouldFetchBlock,
} from "../request";

const ALUMNI_PATH = "/api/alumni";
const DEPT_PATH = "/api/public/departments";

const withQuery = (path, params) => `${path}?${new URLSearchParams(params).toString()}`;

const toItems = (js) => {
  if (Array.isArray(js?.data)) return js.data;
  if (Array.isArray(js?.items)) return js.items;
  if (Array.isArray(js)) return js;
  if (Array.isArray(js?.data?.items)) return js.data.items;
  if (Array.isArray(js?.data?.data)) return js.data.data;
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

export const fetchAlumniDepartments = createAsyncThunk(
  "alumniViewAll/fetchDepartments",
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
      shouldFetchBlock(getState()?.alumniViewAll?.departments, arg?.force === true, REQUEST_CACHE_TTL_MS),
  }
);

export const fetchAlumniList = createAsyncThunk(
  "alumniViewAll/fetchAlumniList",
  async (_, { rejectWithValue }) => {
    try {
      const js = await fetchJson(
        withQuery(ALUMNI_PATH, {
          status: "active",
          per_page: "500",
          sort: "created_at",
          direction: "desc",
        }),
        { headers: { Accept: "application/json" } }
      );
      return toItems(js);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to load alumni");
    }
  },
  {
    condition: (arg, { getState }) =>
      shouldFetchBlock(getState()?.alumniViewAll?.alumni, arg?.force === true, REQUEST_CACHE_TTL_MS),
  }
);

const initialState = {
  departments: createAsyncState({ items: [] }),
  alumni: createAsyncState({ items: [] }),
};

const alumniViewAllSlice = createSlice({
  name: "alumniViewAll",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlumniDepartments.pending, (state) => {
        state.departments.status = "loading";
        state.departments.error = "";
      })
      .addCase(fetchAlumniDepartments.fulfilled, (state, action) => {
        state.departments.status = "succeeded";
        state.departments.error = "";
        state.departments.items = action.payload || [];
        state.departments.loadedAt = Date.now();
      })
      .addCase(fetchAlumniDepartments.rejected, (state, action) => {
        state.departments.status = "failed";
        state.departments.error = action.payload || "Failed to load departments";
      })
      .addCase(fetchAlumniList.pending, (state) => {
        state.alumni.status = "loading";
        state.alumni.error = "";
      })
      .addCase(fetchAlumniList.fulfilled, (state, action) => {
        state.alumni.status = "succeeded";
        state.alumni.error = "";
        state.alumni.items = action.payload || [];
        state.alumni.loadedAt = Date.now();
      })
      .addCase(fetchAlumniList.rejected, (state, action) => {
        state.alumni.status = "failed";
        state.alumni.error = action.payload || "Failed to load alumni";
      });
  },
});

export const selectAlumniDepartments = (state) =>
  state.alumniViewAll?.departments?.items || [];

export const selectAlumniDepartmentsStatus = (state) =>
  state.alumniViewAll?.departments?.status || "idle";

export const selectAlumniDepartmentsError = (state) =>
  state.alumniViewAll?.departments?.error || "";

export const selectAlumniItems = (state) =>
  state.alumniViewAll?.alumni?.items || [];

export const selectAlumniStatus = (state) =>
  state.alumniViewAll?.alumni?.status || "idle";

export const selectAlumniError = (state) =>
  state.alumniViewAll?.alumni?.error || "";

export default alumniViewAllSlice.reducer;
