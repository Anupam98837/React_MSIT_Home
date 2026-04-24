import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  createAsyncState,
  fetchJson,
  shouldFetchBlock,
} from "../request";

const PLACED_STUDENTS_PATH = "/api/placed-students/public";
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

const resolveDeptUuidFromUrl = (deptBySlug, deptByUuid) => {
  const url = new URL(window.location.href);
  const direct = (url.searchParams.get("department") || url.searchParams.get("dept") || "").trim();

  if (direct) {
    if (deptBySlug.has(direct.toLowerCase())) return deptBySlug.get(direct.toLowerCase());
    if (deptByUuid.has(direct)) return direct;
    return direct;
  }

  const hay = `${url.search} ${url.href}`;
  const m = hay.match(/d-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  return m ? m[1] : "";
};

export const fetchPlacedStudentsDepartments = createAsyncThunk(
  "placedStudentsViewAll/fetchDepartments",
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
      shouldFetchBlock(getState()?.placedStudentsViewAll?.departments, arg?.force === true, REQUEST_CACHE_TTL_MS),
  }
);

export const fetchPlacedStudentsList = createAsyncThunk(
  "placedStudentsViewAll/fetchList",
  async (_, { rejectWithValue }) => {
    try {
      const js = await fetchJson(
        withQuery(PLACED_STUDENTS_PATH, {
          page: "1",
          per_page: "500",
          status: "active",
          sort: "created_at",
          direction: "desc",
        }),
        { headers: { Accept: "application/json" } }
      );
      return toItems(js);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to load placed students");
    }
  },
  {
    condition: (arg, { getState }) =>
      shouldFetchBlock(getState()?.placedStudentsViewAll?.placed, arg?.force === true, REQUEST_CACHE_TTL_MS),
  }
);

const initialState = {
  departments: createAsyncState({ items: [] }),
  placed: createAsyncState({ items: [] }),
};

const placedStudentsSlice = createSlice({
  name: "placedStudentsViewAll",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlacedStudentsDepartments.pending, (state) => {
        state.departments.status = "loading";
        state.departments.error = "";
      })
      .addCase(fetchPlacedStudentsDepartments.fulfilled, (state, action) => {
        state.departments.status = "succeeded";
        state.departments.error = "";
        state.departments.items = action.payload || [];
        state.departments.loadedAt = Date.now();
      })
      .addCase(fetchPlacedStudentsDepartments.rejected, (state, action) => {
        state.departments.status = "failed";
        state.departments.error = action.payload || "Failed to load departments";
      })
      .addCase(fetchPlacedStudentsList.pending, (state) => {
        state.placed.status = "loading";
        state.placed.error = "";
      })
      .addCase(fetchPlacedStudentsList.fulfilled, (state, action) => {
        state.placed.status = "succeeded";
        state.placed.error = "";
        state.placed.items = action.payload || [];
        state.placed.loadedAt = Date.now();
      })
      .addCase(fetchPlacedStudentsList.rejected, (state, action) => {
        state.placed.status = "failed";
        state.placed.error = action.payload || "Failed to load placed students";
      });
  },
});

export const selectPlacedStudentsDepartments = (state) =>
  state.placedStudentsViewAll?.departments?.items || [];

export const selectPlacedStudentsDepartmentsStatus = (state) =>
  state.placedStudentsViewAll?.departments?.status || "idle";

export const selectPlacedStudentsDepartmentsError = (state) =>
  state.placedStudentsViewAll?.departments?.error || "";

export const selectPlacedStudentsItems = (state) =>
  state.placedStudentsViewAll?.placed?.items || [];

export const selectPlacedStudentsStatus = (state) =>
  state.placedStudentsViewAll?.placed?.status || "idle";

export const selectPlacedStudentsError = (state) =>
  state.placedStudentsViewAll?.placed?.error || "";

export const selectPlacedStudentsInitialDeptUuid = (state) => {
  const deptItems = state.placedStudentsViewAll?.departments?.items || [];
  const deptByUuid = new Map(deptItems.map((d) => [d.uuid, d]));
  const deptBySlug = new Map(
    deptItems.filter((d) => d.slug).map((d) => [d.slug.toLowerCase(), d.uuid])
  );
  return resolveDeptUuidFromUrl(deptBySlug, deptByUuid);
};

export const selectResolvedDepartmentMaps = (state) => {
  const deptItems = state.placedStudentsViewAll?.departments?.items || [];
  const deptByUuid = new Map(deptItems.map((d) => [d.uuid, d]));
  const deptBySlug = new Map(
    deptItems.filter((d) => d.slug).map((d) => [d.slug.toLowerCase(), d.uuid])
  );
  return { deptByUuid, deptBySlug };
};

export default placedStudentsSlice.reducer;
