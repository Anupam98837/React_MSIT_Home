import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  createAsyncState,
  fetchJson,
  shouldFetchBlock,
} from "../request";

const PLACEMENT_OFFICERS_PATH = "/api/public/placement-officers";
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

export const fetchTPCellDepartments = createAsyncThunk(
  "tpCell/fetchDepartments",
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
      shouldFetchBlock(getState()?.tpCell?.departments, arg?.force === true, REQUEST_CACHE_TTL_MS),
  }
);

export const fetchTPCellList = createAsyncThunk(
  "tpCell/fetchList",
  async (_, { rejectWithValue }) => {
    try {
      const js = await fetchJson(
        withQuery(PLACEMENT_OFFICERS_PATH, {
          page: "1",
          per_page: "200",
          status: "active",
          sort: "created_at",
          direction: "desc",
        }),
        { headers: { Accept: "application/json" } }
      );
      return toItems(js);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to load placement officers");
    }
  },
  {
    condition: (arg, { getState }) =>
      shouldFetchBlock(getState()?.tpCell?.officers, arg?.force === true, REQUEST_CACHE_TTL_MS),
  }
);

const initialState = {
  departments: createAsyncState({ items: [] }),
  officers: createAsyncState({ items: [] }),
};

const tpCellSlice = createSlice({
  name: "tpCell",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTPCellDepartments.pending, (state) => {
        state.departments.status = "loading";
        state.departments.error = "";
      })
      .addCase(fetchTPCellDepartments.fulfilled, (state, action) => {
        state.departments.status = "succeeded";
        state.departments.error = "";
        state.departments.items = action.payload || [];
        state.departments.loadedAt = Date.now();
      })
      .addCase(fetchTPCellDepartments.rejected, (state, action) => {
        state.departments.status = "failed";
        state.departments.error = action.payload || "Failed to load departments";
      })
      .addCase(fetchTPCellList.pending, (state) => {
        state.officers.status = "loading";
        state.officers.error = "";
      })
      .addCase(fetchTPCellList.fulfilled, (state, action) => {
        state.officers.status = "succeeded";
        state.officers.error = "";
        state.officers.items = action.payload || [];
        state.officers.loadedAt = Date.now();
      })
      .addCase(fetchTPCellList.rejected, (state, action) => {
        state.officers.status = "failed";
        state.officers.error = action.payload || "Failed to load placement officers";
      });
  },
});

export const selectTPCellDepartments = (state) =>
  state.tpCell?.departments?.items || [];

export const selectTPCellDepartmentsStatus = (state) =>
  state.tpCell?.departments?.status || "idle";

export const selectTPCellDepartmentsError = (state) =>
  state.tpCell?.departments?.error || "";

export const selectTPCellItems = (state) =>
  state.tpCell?.officers?.items || [];

export const selectTPCellStatus = (state) =>
  state.tpCell?.officers?.status || "idle";

export const selectTPCellError = (state) =>
  state.tpCell?.officers?.error || "";

export default tpCellSlice.reducer;
