import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  fetchJson as requestFetchJson,
  shouldFetchBlock,
} from "../request";

export const ALL_DEPTS = "__all";
const GLOBAL_SCOPE = "__global";
const GLOBAL_LABEL = "Global (No Department)";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "https://www.msit.edu.in"
).replace(/\/+$/, "");

const INDEX_URL = `${API_BASE}/api/public/technical-assistant-preview-order`;
const SHOW_BASE = `${API_BASE}/api/public/technical-assistant-preview-order/`;

let globalScopeHints = [];
let globalAssignedCache = null;

const apiFetchJson = async (url) =>
  requestFetchJson(url, { headers: { Accept: "application/json" } });

const clean = (value) => (value ?? "").toString().trim();

const toSlug = (value) =>
  clean(value)
    .toLowerCase()
    .replace(/\s+/g, "-");

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

const toInt = (value) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
};

const isActiveRow = (row) => String(row?.order?.active ?? 1) === "1";

const previewCountFromRow = (row) =>
  toInt(
    row?.order?.technical_assistant_count ??
      row?.order?.assistant_count ??
      row?.order?.count ??
      row?.order?.staff_count ??
      0
  ) || 0;

const collectGlobalScopeHints = (rows) => {
  const vals = [];

  const add = (value) => {
    if (value === null || value === undefined) return;
    const s = clean(value);
    if (!s) return;
    vals.push(s);
  };

  for (const row of Array.isArray(rows) ? rows : []) {
    const deptUuid = clean(row?.department?.uuid);
    const hasDept = !!deptUuid;
    const count = previewCountFromRow(row);

    if (hasDept || count <= 0) continue;

    add(row?.department?.slug);
    add(row?.department?.title);

    add(row?.scope);
    add(row?.scope_key);
    add(row?.bucket);
    add(row?.bucket_key);
    add(row?.key);
    add(row?.slug);
    add(row?.uuid);
    add(row?.id);

    add(row?.order?.scope);
    add(row?.order?.scope_key);
    add(row?.order?.bucket);
    add(row?.order?.bucket_key);
    add(row?.order?.key);
    add(row?.order?.slug);
    add(row?.order?.uuid);
    add(row?.order?.id);
  }

  vals.push(
    GLOBAL_SCOPE,
    "global",
    "common",
    "unassigned",
    "no-department",
    "no_department",
    "without-department",
    "without_department",
    "none",
    "null",
    "0"
  );

  return Array.from(new Set(vals.map((v) => clean(v)).filter(Boolean)));
};

const extractOrderIds = (payload) => {
  const raw =
    payload?.order?.technical_assistant_ids ??
    payload?.order?.assistant_ids ??
    payload?.order?.staff_ids ??
    payload?.order?.user_ids ??
    payload?.order?.ids ??
    payload?.order?.technical_assistant_ids_json ??
    payload?.order?.assistant_ids_json ??
    payload?.order?.staff_ids_json ??
    payload?.order?.user_ids_json ??
    payload?.technical_assistant_ids ??
    payload?.assistant_ids ??
    payload?.staff_ids ??
    payload?.user_ids ??
    payload?.order_ids ??
    payload?.technical_assistant_order ??
    payload?.assistant_order ??
    payload?.staff_order ??
    null;

  const arr = Array.isArray(raw) ? raw : decodeMaybeJson(raw);
  if (!Array.isArray(arr)) return [];

  return arr.map((x) => toInt(x)).filter((x) => x !== null);
};

const getUserNumericId = (item) =>
  toInt(
    item?.user_id ??
      item?.technical_assistant_id ??
      item?.assistant_id ??
      item?.staff_id ??
      item?.faculty_id ??
      item?.id ??
      item?.user?.id ??
      null
  );

const orderByDb = (assigned, orderIds) => {
  if (!Array.isArray(assigned) || !assigned.length) return [];
  if (!Array.isArray(orderIds) || !orderIds.length) return assigned;

  const idx = new Map(orderIds.map((id, i) => [String(id), i]));

  return assigned
    .map((item, originalIndex) => {
      const id = getUserNumericId(item);
      const key = id === null ? null : String(id);
      const orderIndex = key && idx.has(key) ? idx.get(key) : 1e9;
      return { item, originalIndex, orderIndex };
    })
    .sort(
      (a, b) =>
        a.orderIndex - b.orderIndex || a.originalIndex - b.originalIndex
    )
    .map((x) => x.item);
};

const uniqueTechnicalAssistantKey = (item) =>
  (
    clean(pick(item, ["user_uuid", "uuid"])) ||
    String(getUserNumericId(item) ?? "")
  ).trim();

const pushUniqueItems = (target, items) => {
  const seen = new Set(
    (Array.isArray(target) ? target : [])
      .map(uniqueTechnicalAssistantKey)
      .filter(Boolean)
  );

  for (const item of Array.isArray(items) ? items : []) {
    const key = uniqueTechnicalAssistantKey(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    target.push(item);
  }

  return target;
};

const normalizeTechnicalAssistant = (item, deptTitle = "", deptUuid = "") => ({
  ...item,
  __department_title: clean(deptTitle),
  __department_uuid: clean(deptUuid),
  __profile_slug: clean(
    pick(item, ["slug", "user_slug", "profile_slug", "user_profile_slug"]) ||
      item?.user?.slug
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

const buildDepartments = (rows) =>
  (Array.isArray(rows) ? rows : [])
    .filter(isActiveRow)
    .map((row) => ({
      id: row?.department?.id ?? null,
      uuid: clean(row?.department?.uuid),
      slug: toSlug(row?.department?.slug || row?.department?.short_name),
      shortcode: toSlug(row?.department?.slug || row?.department?.short_name),
      title: clean(row?.department?.title),
      count: previewCountFromRow(row),
    }))
    .filter((d) => d.uuid && d.slug && d.title && d.count > 0);

const loadGlobalAssignedList = async () => {
  if (Array.isArray(globalAssignedCache)) {
    return globalAssignedCache.map((x) => ({ ...x }));
  }

  const candidates = Array.from(
    new Set(
      [
        ...(Array.isArray(globalScopeHints) ? globalScopeHints : []),
        GLOBAL_SCOPE,
        "global",
        "common",
        "unassigned",
        "no-department",
        "no_department",
        "without-department",
        "without_department",
        "none",
        "null",
        "0",
      ]
        .map((v) => clean(v))
        .filter(Boolean)
    )
  );

  for (const key of candidates) {
    try {
      const url = `${SHOW_BASE}${encodeURIComponent(key)}?status=active`;
      const payload = await apiFetchJson(url);

      const assigned = Array.isArray(payload?.assigned) ? payload.assigned : [];
      if (!assigned.length) continue;

      const orderIds = extractOrderIds(payload);
      const ordered = orderByDb(assigned, orderIds);

      const label =
        clean(payload?.department?.title) ||
        clean(payload?.scope_title) ||
        clean(payload?.title) ||
        GLOBAL_LABEL;

      globalAssignedCache = ordered.map((item) =>
        normalizeTechnicalAssistant(item, label, GLOBAL_SCOPE)
      );

      return globalAssignedCache.map((x) => ({ ...x }));
    } catch {
      // try next candidate
    }
  }

  globalAssignedCache = [];
  return [];
};

export const fetchTechnicalAssistantIndex = createAsyncThunk(
  "technicalAssistants/fetchIndex",
  async (_, { rejectWithValue }) => {
    try {
      const payload = await apiFetchJson(INDEX_URL);
      const rows = Array.isArray(payload?.data) ? payload.data : [];
      globalScopeHints = collectGlobalScopeHints(rows);
      globalAssignedCache = null;
      return rows;
    } catch (error) {
      return rejectWithValue(
        error?.message || "Failed to load technical assistant index"
      );
    }
  },
  {
    condition: (arg, { getState }) =>
      shouldFetchBlock(
        getState()?.technicalAssistants?.index,
        arg?.force === true,
        REQUEST_CACHE_TTL_MS
      ),
  }
);

export const fetchTechnicalAssistantList = createAsyncThunk(
  "technicalAssistants/fetchList",
  async ({ deptUuid = ALL_DEPTS } = {}, { getState, rejectWithValue }) => {
    try {
      let rows = getState()?.technicalAssistants?.index?.rows || [];

      if (!rows.length) {
        const payload = await apiFetchJson(INDEX_URL);
        rows = Array.isArray(payload?.data) ? payload.data : [];
      }

      globalScopeHints = collectGlobalScopeHints(rows);
      globalAssignedCache = null;

      const depts = buildDepartments(rows);
      const deptByUuid = new Map(depts.map((d) => [d.uuid, d]));
      const deptByShortcode = new Map(
        depts.filter((d) => d.shortcode).map((d) => [d.shortcode, d])
      );

      const resolvedDeptUuid = resolveDeptUuid(
        deptUuid,
        deptByUuid,
        deptByShortcode
      );

      const loadDept = async (uuid) => {
        const url = `${SHOW_BASE}${encodeURIComponent(uuid)}?status=active`;
        const payload = await apiFetchJson(url);

        const dept = payload?.department || {};
        const assigned = Array.isArray(payload?.assigned) ? payload.assigned : [];
        const orderIds = extractOrderIds(payload);

        const deptTitle =
          clean(dept?.title) || clean(deptByUuid.get(uuid)?.title);

        return {
          title: deptTitle,
          items: orderByDb(assigned, orderIds).map((item) =>
            normalizeTechnicalAssistant(item, deptTitle, uuid)
          ),
        };
      };

      let items = [];
      let deptName = "All Departments";

      if (resolvedDeptUuid === ALL_DEPTS) {
        for (const dept of [...depts].sort((a, b) =>
          a.title.localeCompare(b.title)
        )) {
          try {
            const loaded = await loadDept(dept.uuid);
            pushUniqueItems(items, loaded.items);
          } catch {
            // keep loading remaining departments
          }
        }

        try {
          const globals = await loadGlobalAssignedList();
          pushUniqueItems(
            items,
            globals.map((item) =>
              normalizeTechnicalAssistant(
                item,
                item?.__department_title || GLOBAL_LABEL,
                GLOBAL_SCOPE
              )
            )
          );
        } catch {
          // ignore
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

        try {
          const globals = await loadGlobalAssignedList();
          pushUniqueItems(
            items,
            globals.map((item) =>
              normalizeTechnicalAssistant(
                item,
                item?.__department_title || GLOBAL_LABEL,
                GLOBAL_SCOPE
              )
            )
          );
        } catch {
          // ignore
        }
      }

      return {
        items,
        deptUuid: resolvedDeptUuid,
        deptName,
      };
    } catch (error) {
      return rejectWithValue(
        error?.message || "Failed to load technical assistants"
      );
    }
  },
  {
    condition: (arg, { getState }) => {
      const requestedDeptUuid = arg?.deptUuid || ALL_DEPTS;
      const current = getState()?.technicalAssistants?.list;

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

const technicalAssistantSlice = createSlice({
  name: "technicalAssistants",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTechnicalAssistantIndex.pending, (state) => {
        state.index.status = "loading";
        state.index.error = "";
      })
      .addCase(fetchTechnicalAssistantIndex.fulfilled, (state, action) => {
        state.index.status = "succeeded";
        state.index.rows = action.payload || [];
        state.index.error = "";
        state.index.loadedAt = Date.now();
      })
      .addCase(fetchTechnicalAssistantIndex.rejected, (state, action) => {
        state.index.status = "failed";
        state.index.error = action.payload || "Failed to load index";
      })

      .addCase(fetchTechnicalAssistantList.pending, (state) => {
        state.list.status = "loading";
        state.list.error = "";
      })
      .addCase(fetchTechnicalAssistantList.fulfilled, (state, action) => {
        state.list.status = "succeeded";
        state.list.error = "";
        state.list.items = action.payload?.items || [];
        state.list.deptUuid = action.payload?.deptUuid || ALL_DEPTS;
        state.list.deptName = action.payload?.deptName || "All Departments";
        state.list.loadedAt = Date.now();
      })
      .addCase(fetchTechnicalAssistantList.rejected, (state, action) => {
        state.list.status = "failed";
        state.list.error =
          action.payload || "Failed to load technical assistants";
      });
  },
});

export const selectTechnicalAssistantIndexRows = (state) =>
  state.technicalAssistants?.index?.rows || [];

export const selectTechnicalAssistantIndexStatus = (state) =>
  state.technicalAssistants?.index?.status || "idle";

export const selectTechnicalAssistantIndexError = (state) =>
  state.technicalAssistants?.index?.error || "";

export const selectTechnicalAssistantListItems = (state) =>
  state.technicalAssistants?.list?.items || [];

export const selectTechnicalAssistantListStatus = (state) =>
  state.technicalAssistants?.list?.status || "idle";

export const selectTechnicalAssistantListError = (state) =>
  state.technicalAssistants?.list?.error || "";

export const selectTechnicalAssistantDeptName = (state) =>
  state.technicalAssistants?.list?.deptName || "All Departments";

export default technicalAssistantSlice.reducer;