import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  createAsyncState,
  fetchJson,
  shouldFetchBlock,
} from "../request";

const ACTIVITIES_PATH = "/api/public/student-activities";
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

export const fetchStudentActivitiesDepartments = createAsyncThunk(
  "studentActivities/fetchDepartments",
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
      shouldFetchBlock(getState()?.studentActivities?.departments, arg?.force === true, REQUEST_CACHE_TTL_MS),
  }
);

export const fetchStudentActivitiesList = createAsyncThunk(
  "studentActivities/fetchList",
  async (_, { rejectWithValue }) => {
    try {
      const js = await fetchJson(
        withQuery(ACTIVITIES_PATH, {
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
      return rejectWithValue(error?.message || "Failed to load student activities");
    }
  },
  {
    condition: (arg, { getState }) =>
      shouldFetchBlock(getState()?.studentActivities?.activities, arg?.force === true, REQUEST_CACHE_TTL_MS),
  }
);

const initialState = {
  departments: createAsyncState({ items: [] }),
  activities: createAsyncState({ items: [] }),
};

const studentActivitiesSlice = createSlice({
  name: "studentActivities",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudentActivitiesDepartments.pending, (state) => {
        state.departments.status = "loading";
        state.departments.error = "";
      })
      .addCase(fetchStudentActivitiesDepartments.fulfilled, (state, action) => {
        state.departments.status = "succeeded";
        state.departments.error = "";
        state.departments.items = action.payload || [];
        state.departments.loadedAt = Date.now();
      })
      .addCase(fetchStudentActivitiesDepartments.rejected, (state, action) => {
        state.departments.status = "failed";
        state.departments.error = action.payload || "Failed to load departments";
      })
      .addCase(fetchStudentActivitiesList.pending, (state) => {
        state.activities.status = "loading";
        state.activities.error = "";
      })
      .addCase(fetchStudentActivitiesList.fulfilled, (state, action) => {
        state.activities.status = "succeeded";
        state.activities.error = "";
        state.activities.items = action.payload || [];
        state.activities.loadedAt = Date.now();
      })
      .addCase(fetchStudentActivitiesList.rejected, (state, action) => {
        state.activities.status = "failed";
        state.activities.error = action.payload || "Failed to load student activities";
      });
  },
});

export const selectStudentActivitiesDepartments = (state) =>
  state.studentActivities?.departments?.items || [];

export const selectStudentActivitiesDepartmentsStatus = (state) =>
  state.studentActivities?.departments?.status || "idle";

export const selectStudentActivitiesDepartmentsError = (state) =>
  state.studentActivities?.departments?.error || "";

export const selectStudentActivitiesItems = (state) =>
  state.studentActivities?.activities?.items || [];

export const selectStudentActivitiesStatus = (state) =>
  state.studentActivities?.activities?.status || "idle";

export const selectStudentActivitiesError = (state) =>
  state.studentActivities?.activities?.error || "";

export default studentActivitiesSlice.reducer;
