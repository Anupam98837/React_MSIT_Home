import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  createAsyncState,
  fetchJson,
  shouldFetchBlock,
} from "../request";

export const ALL_DEPTS = "__all";

const TOPPERS_PATH = "/api/program-toppers/public/index";
const DEPTS_PATH = "/api/public/departments";

const withQuery = (path, params) => `${path}?${new URLSearchParams(params).toString()}`;

const toItems = (js) => {
  if (Array.isArray(js?.data)) return js.data;
  if (Array.isArray(js?.items)) return js.items;
  if (Array.isArray(js)) return js;
  if (Array.isArray(js?.data?.items)) return js.data.items;
  if (Array.isArray(js?.data?.data)) return js.data.data;
  return [];
};

const pick = (obj, keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== null && v !== undefined && String(v).trim() !== "") return v;
  }
  return "";
};

const looksLikeUuidLoose = (v) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(v || "").trim()
  );

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

const resolveDeptUuidFromUrl = (deptByUuid, deptBySlug) => {
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

const resolveKey = (item) => {
  const u = String(pick(item, ["uuid", "topper_uuid", "program_topper_uuid"]) || "").trim();
  if (looksLikeUuidLoose(u)) return u;
  const id = String(pick(item, ["id", "topper_id", "program_topper_id"]) || "").trim();
  return id ? `id:${id}` : "";
};

export const fetchProgramToppersDepartments = createAsyncThunk(
  "programToppersViewAll/fetchDepartments",
  async (_, { rejectWithValue }) => {
    try {
      const js = await fetchJson(DEPTS_PATH, { headers: { Accept: "application/json" } });
      return normalizeDepartments(toItems(js));
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to load departments");
    }
  },
  {
    condition: (arg, { getState }) =>
      shouldFetchBlock(getState()?.programToppersViewAll?.departments, arg?.force === true, REQUEST_CACHE_TTL_MS),
  }
);

export const fetchProgramToppersList = createAsyncThunk(
  "programToppersViewAll/fetchList",
  async (_, { rejectWithValue }) => {
    try {
      const js = await fetchJson(
        withQuery(TOPPERS_PATH, {
          status: "active",
          per_page: "500",
          sort: "created_at",
          direction: "desc",
        }),
        { headers: { Accept: "application/json" } }
      );
      return toItems(js);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to load program toppers");
    }
  },
  {
    condition: (arg, { getState }) =>
      shouldFetchBlock(getState()?.programToppersViewAll?.toppers, arg?.force === true, REQUEST_CACHE_TTL_MS),
  }
);

const initialState = {
  departments: createAsyncState({ items: [] }),
  toppers: createAsyncState({ items: [] }),
};

const programToppersSlice = createSlice({
  name: "programToppersViewAll",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProgramToppersDepartments.pending, (state) => {
        state.departments.status = "loading";
        state.departments.error = "";
      })
      .addCase(fetchProgramToppersDepartments.fulfilled, (state, action) => {
        state.departments.status = "succeeded";
        state.departments.error = "";
        state.departments.items = action.payload || [];
        state.departments.loadedAt = Date.now();
      })
      .addCase(fetchProgramToppersDepartments.rejected, (state, action) => {
        state.departments.status = "failed";
        state.departments.error = action.payload || "Failed to load departments";
      })
      .addCase(fetchProgramToppersList.pending, (state) => {
        state.toppers.status = "loading";
        state.toppers.error = "";
      })
      .addCase(fetchProgramToppersList.fulfilled, (state, action) => {
        state.toppers.status = "succeeded";
        state.toppers.error = "";
        state.toppers.items = action.payload || [];
        state.toppers.loadedAt = Date.now();
      })
      .addCase(fetchProgramToppersList.rejected, (state, action) => {
        state.toppers.status = "failed";
        state.toppers.error = action.payload || "Failed to load program toppers";
      });
  },
});

export const selectProgramToppersDepartments = (state) =>
  state.programToppersViewAll?.departments?.items || [];

export const selectProgramToppersDepartmentsStatus = (state) =>
  state.programToppersViewAll?.departments?.status || "idle";

export const selectProgramToppersDepartmentsError = (state) =>
  state.programToppersViewAll?.departments?.error || "";

export const selectProgramToppersItems = (state) =>
  state.programToppersViewAll?.toppers?.items || [];

export const selectProgramToppersStatus = (state) =>
  state.programToppersViewAll?.toppers?.status || "idle";

export const selectProgramToppersError = (state) =>
  state.programToppersViewAll?.toppers?.error || "";

export const selectProgramToppersInitialDeptUuid = (state) => {
  const deptItems = state.programToppersViewAll?.departments?.items || [];
  const deptByUuid = new Map(deptItems.map((d) => [d.uuid, d]));
  const deptBySlug = new Map(
    deptItems.filter((d) => d.slug).map((d) => [d.slug.toLowerCase(), d.uuid])
  );
  return resolveDeptUuidFromUrl(deptByUuid, deptBySlug);
};

export const selectProgramTopperKey = (item) => resolveKey(item);

export default programToppersSlice.reducer;
