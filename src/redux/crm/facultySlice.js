import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  fetchJson as requestFetchJson,
  shouldFetchBlock,
} from "../request";

export const ALL_DEPTS = "__all";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "https://www.msit.edu.in"
).replace(/\/+$/, "");

const INDEX_URL = `${API_BASE}/api/public/faculty-preview-order`;
const SHOW_BASE = `${API_BASE}/api/public/faculty-preview-order/`;

const apiFetchJson = async (url) =>
  requestFetchJson(url, { headers: { Accept: "application/json" } });

const clean = (value) => (value ?? "").toString().trim();

const toInt = (value) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
};

const pick = (obj, keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== null && v !== undefined && clean(v) !== "") return v;
  }
  return "";
};

const decodeMaybeJson = (value) => {
  if (value == null) return null;
  if (Array.isArray(value) || typeof value === "object") return value;

  try {
    return JSON.parse(String(value));
  } catch {
    return null;
  }
};

const toSlug = (value) =>
  clean(value)
    .toLowerCase()
    .replace(/\s+/g, "-");

const isActivePreviewRow = (row) =>
  String(row?.order?.active ?? 1) === "1";

const previewCountFromRow = (row) =>
  toInt(row?.order?.faculty_count ?? row?.order?.count ?? 0) || 0;

const extractOrderIds = (payload) => {
  const raw =
    payload?.order?.faculty_ids ??
    payload?.order?.faculty_ids_json ??
    payload?.faculty_ids ??
    payload?.order_ids ??
    payload?.faculty_order ??
    null;

  const arr = Array.isArray(raw) ? raw : decodeMaybeJson(raw);
  if (!Array.isArray(arr)) return [];

  return arr.map((x) => toInt(x)).filter((x) => x !== null);
};

const getUserNumericId = (item) =>
  toInt(item?.user_id ?? item?.faculty_id ?? item?.id ?? item?.user?.id ?? null);

const uniqueFacultyKey = (item) =>
  (
    clean(pick(item, ["user_uuid", "uuid"])) ||
    String(getUserNumericId(item) ?? "")
  ).trim();

const orderByDb = (assigned, orderIds) => {
  if (!Array.isArray(assigned) || !assigned.length) return [];
  if (!Array.isArray(orderIds) || !orderIds.length) return assigned;

  const idx = new Map(orderIds.map((id, i) => [String(id), i]));

  return assigned
    .map((it, originalIndex) => {
      const id = getUserNumericId(it);
      const key = id === null ? null : String(id);
      const orderIndex = key && idx.has(key) ? idx.get(key) : 1e9;

      return { it, originalIndex, orderIndex };
    })
    .sort(
      (a, b) =>
        a.orderIndex - b.orderIndex || a.originalIndex - b.originalIndex
    )
    .map((x) => x.it);
};

const normalizeFacultyItem = (item, deptTitle = "", deptUuid = "") => ({
  ...item,
  __department_title: clean(deptTitle),
  __department_uuid: clean(deptUuid),
  __profile_slug: clean(
    pick(item, [
      "slug",
      "user_slug",
      "profile_slug",
      "user_profile_slug",
    ]) || item?.user?.slug
  ),
});

const loadDepartmentsFromIndex = (rows) =>
  (Array.isArray(rows) ? rows : [])
    .filter(isActivePreviewRow)
    .map((row) => ({
      id: row?.department?.id ?? null,
      uuid: clean(row?.department?.uuid),
      slug: toSlug(row?.department?.slug || row?.department?.short_name),
      shortcode: toSlug(row?.department?.slug || row?.department?.short_name),
      title: clean(row?.department?.title),
      count: previewCountFromRow(row),
    }))
    .filter((dept) => dept.uuid && dept.title && dept.slug && dept.count > 0);

const buildDeptMaps = (departments) => ({
  deptByUuid: new Map(departments.map((d) => [d.uuid, d])),
  deptByShortcode: new Map(
    departments
      .filter((d) => d.shortcode)
      .map((d) => [d.shortcode, d])
  ),
});

const resolveDeptUuid = (value, deptByUuid, deptByShortcode) => {
  const v = clean(value);
  if (!v || v === ALL_DEPTS) return ALL_DEPTS;
  if (deptByUuid.has(v)) return v;

  const sc = v.toLowerCase();
  if (deptByShortcode.has(sc)) return deptByShortcode.get(sc).uuid;

  return v;
};

export const fetchFacultyIndex = createAsyncThunk(
  "faculty/fetchIndex",
  async (_, { rejectWithValue }) => {
    try {
      const js = await apiFetchJson(INDEX_URL);
      return Array.isArray(js?.data) ? js.data : [];
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to load faculty index");
    }
  },
  {
    condition: (arg, { getState }) =>
      shouldFetchBlock(
        getState()?.facultyMembers?.index,
        arg?.force === true,
        REQUEST_CACHE_TTL_MS
      ),
  }
);

export const fetchFacultyList = createAsyncThunk(
  "faculty/fetchList",
  async ({ deptUuid = ALL_DEPTS } = {}, { getState, rejectWithValue }) => {
    try {
      let rows = getState()?.facultyMembers?.index?.rows || [];

      if (!rows.length) {
        const js = await apiFetchJson(INDEX_URL);
        rows = Array.isArray(js?.data) ? js.data : [];
      }

      const departments = loadDepartmentsFromIndex(rows);
      const { deptByUuid, deptByShortcode } = buildDeptMaps(departments);

      const resolvedDeptUuid = resolveDeptUuid(
        deptUuid,
        deptByUuid,
        deptByShortcode
      );

      const loadDept = async (uuid) => {
        const url = `${SHOW_BASE}${encodeURIComponent(uuid)}?status=active`;
        const js = await apiFetchJson(url);

        const dept = js?.department || {};
        const assigned = Array.isArray(js?.assigned) ? js.assigned : [];
        const orderIds = extractOrderIds(js);

        const deptTitle =
          clean(dept?.title) || clean(deptByUuid.get(uuid)?.title);

        return {
          title: deptTitle,
          items: orderByDb(assigned, orderIds).map((it) =>
            normalizeFacultyItem(it, deptTitle, uuid)
          ),
        };
      };

      let items = [];
      let deptName = "All Departments";

      if (resolvedDeptUuid === ALL_DEPTS) {
        const seen = new Set();

        for (const dept of [...departments].sort((a, b) =>
          a.title.localeCompare(b.title)
        )) {
          try {
            const loaded = await loadDept(dept.uuid);

            for (const item of loaded.items) {
              const key = uniqueFacultyKey(item);
              if (!key || seen.has(key)) continue;

              seen.add(key);
              items.push(
                normalizeFacultyItem(item, dept.title, dept.uuid)
              );
            }
          } catch {
            // keep loading remaining departments
          }
        }

        deptName = "All Departments";
      } else {
        const dept =
          deptByUuid.get(resolvedDeptUuid) ||
          [...deptByUuid.values()].find((d) => d.slug === resolvedDeptUuid) ||
          null;

        if (!dept) {
          return {
            items: [],
            deptUuid: resolvedDeptUuid,
            deptName: "",
          };
        }

        const loaded = await loadDept(dept.uuid);
        items = loaded.items;
        deptName = loaded.title || dept.title || "";
      }

      return {
        items,
        deptUuid: resolvedDeptUuid,
        deptName,
      };
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to load faculty members");
    }
  },
  {
    condition: (arg, { getState }) => {
      const state = getState()?.facultyMembers;
      const current = state?.list;

      const rows = state?.index?.rows || [];
      const departments = loadDepartmentsFromIndex(rows);
      const { deptByUuid, deptByShortcode } = buildDeptMaps(departments);

      const requestedDeptUuid = resolveDeptUuid(
        arg?.deptUuid || ALL_DEPTS,
        deptByUuid,
        deptByShortcode
      );

      if (!current) return true;
      if ((current.deptUuid || ALL_DEPTS) !== requestedDeptUuid) return true;

      return shouldFetchBlock(
        current,
        arg?.force === true,
        REQUEST_CACHE_TTL_MS
      );
    },
  }
);

const initialState = {
  index: {
    status: "idle",
    error: "",
    rows: [],
    loadedAt: 0,
  },
  list: {
    status: "idle",
    error: "",
    items: [],
    deptUuid: ALL_DEPTS,
    deptName: "All Departments",
    loadedAt: 0,
  },
};

const facultySlice = createSlice({
  name: "facultyMembers",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFacultyIndex.pending, (state) => {
        state.index.status = "loading";
        state.index.error = "";
      })
      .addCase(fetchFacultyIndex.fulfilled, (state, action) => {
        state.index.status = "succeeded";
        state.index.rows = action.payload || [];
        state.index.error = "";
        state.index.loadedAt = Date.now();
      })
      .addCase(fetchFacultyIndex.rejected, (state, action) => {
        state.index.status = "failed";
        state.index.error = action.payload || "Failed to load index";
      })

      .addCase(fetchFacultyList.pending, (state) => {
        state.list.status = "loading";
        state.list.error = "";
      })
      .addCase(fetchFacultyList.fulfilled, (state, action) => {
        state.list.status = "succeeded";
        state.list.error = "";
        state.list.items = action.payload?.items || [];
        state.list.deptUuid = action.payload?.deptUuid || ALL_DEPTS;
        state.list.deptName = action.payload?.deptName || "All Departments";
        state.list.loadedAt = Date.now();
      })
      .addCase(fetchFacultyList.rejected, (state, action) => {
        state.list.status = "failed";
        state.list.error = action.payload || "Failed to load faculty members";
      });
  },
});

export const selectFacultyIndexRows = (state) =>
  state.facultyMembers?.index?.rows || [];

export const selectFacultyIndexStatus = (state) =>
  state.facultyMembers?.index?.status || "idle";

export const selectFacultyIndexError = (state) =>
  state.facultyMembers?.index?.error || "";

export const selectFacultyListItems = (state) =>
  state.facultyMembers?.list?.items || [];

export const selectFacultyListStatus = (state) =>
  state.facultyMembers?.list?.status || "idle";

export const selectFacultyListError = (state) =>
  state.facultyMembers?.list?.error || "";

export const selectFacultyDeptName = (state) =>
  state.facultyMembers?.list?.deptName || "All Departments";

export default facultySlice.reducer;