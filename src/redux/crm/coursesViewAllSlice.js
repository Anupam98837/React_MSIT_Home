import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  createAsyncState,
  fetchJson,
  shouldFetchBlock,
} from "../request";

const COURSES_PATH = "/api/public/courses";
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

export const fetchCoursesDepartments = createAsyncThunk(
  "coursesViewAll/fetchDepartments",
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
      shouldFetchBlock(getState()?.coursesViewAll?.departments, arg?.force === true, REQUEST_CACHE_TTL_MS),
  }
);

export const fetchCoursesList = createAsyncThunk(
  "coursesViewAll/fetchList",
  async (_, { rejectWithValue }) => {
    try {
      const js = await fetchJson(
        withQuery(COURSES_PATH, {
          page: "1",
          per_page: "200",
          sort: "created_at",
          direction: "desc",
        }),
        { headers: { Accept: "application/json" } }
      );
      return toItems(js);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to load courses");
    }
  },
  {
    condition: (arg, { getState }) =>
      shouldFetchBlock(getState()?.coursesViewAll?.courses, arg?.force === true, REQUEST_CACHE_TTL_MS),
  }
);

const initialState = {
  departments: createAsyncState({ items: [] }),
  courses: createAsyncState({ items: [] }),
};

const coursesViewAllSlice = createSlice({
  name: "coursesViewAll",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCoursesDepartments.pending, (state) => {
        state.departments.status = "loading";
        state.departments.error = "";
      })
      .addCase(fetchCoursesDepartments.fulfilled, (state, action) => {
        state.departments.status = "succeeded";
        state.departments.error = "";
        state.departments.items = action.payload || [];
        state.departments.loadedAt = Date.now();
      })
      .addCase(fetchCoursesDepartments.rejected, (state, action) => {
        state.departments.status = "failed";
        state.departments.error = action.payload || "Failed to load departments";
      })
      .addCase(fetchCoursesList.pending, (state) => {
        state.courses.status = "loading";
        state.courses.error = "";
      })
      .addCase(fetchCoursesList.fulfilled, (state, action) => {
        state.courses.status = "succeeded";
        state.courses.error = "";
        state.courses.items = action.payload || [];
        state.courses.loadedAt = Date.now();
      })
      .addCase(fetchCoursesList.rejected, (state, action) => {
        state.courses.status = "failed";
        state.courses.error = action.payload || "Failed to load courses";
      });
  },
});

export const selectCoursesDepartments = (state) =>
  state.coursesViewAll?.departments?.items || [];

export const selectCoursesDepartmentsStatus = (state) =>
  state.coursesViewAll?.departments?.status || "idle";

export const selectCoursesDepartmentsError = (state) =>
  state.coursesViewAll?.departments?.error || "";

export const selectCoursesItems = (state) =>
  state.coursesViewAll?.courses?.items || [];

export const selectCoursesStatus = (state) =>
  state.coursesViewAll?.courses?.status || "idle";

export const selectCoursesError = (state) =>
  state.coursesViewAll?.courses?.error || "";

export default coursesViewAllSlice.reducer;
