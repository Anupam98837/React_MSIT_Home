import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  fetchJson,
  shouldFetchBlock,
} from "../request";

const EVENTS_ENDPOINT = "/api/public/events";
const DEPARTMENTS_ENDPOINT = "/api/public/departments";

const pickItems = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const mapDepartment = (d) => ({
  id: d?.id ?? null,
  uuid: d?.uuid || "",
  title: d?.title || d?.name || "",
  shortcode: (d?.short_name || d?.slug || d?.title || d?.name || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-"),
});

const normalizeImage = (img) => {
  if (!img) return "";
  if (img.startsWith("http")) return img;
  return `${import.meta.env.VITE_API_BASE_URL}/storage/${img}`;
};

export const fetchEvents = createAsyncThunk(
  "events/fetchEvents",
  async (_, { rejectWithValue }) => {
    try {
      const payload = await fetchJson(EVENTS_ENDPOINT);
      return pickItems(payload);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to fetch events");
    }
  },
  {
    condition: (arg, { getState }) =>
      shouldFetchBlock(
        getState()?.events,
        arg?.force === true,
        REQUEST_CACHE_TTL_MS
      ),
  }
);

export const fetchDepartments = createAsyncThunk(
  "events/fetchDepartments",
  async (_, { rejectWithValue }) => {
    try {
      const payload = await fetchJson(DEPARTMENTS_ENDPOINT);
      return pickItems(payload);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to fetch departments");
    }
  },
  {
    condition: (arg, { getState }) => {
      const state = getState()?.events;
      const block = {
        status: state?.departmentsStatus || "idle",
        loadedAt: state?.departmentsLoadedAt || 0,
      };
      return shouldFetchBlock(block, arg?.force === true, REQUEST_CACHE_TTL_MS);
    },
  }
);

const initialState = {
  events: [],
  departments: [],
  search: "",
  deptSlug: "",
  deptName: "",
  page: 1,
  perPage: 9,
  status: "idle",
  departmentsStatus: "idle",
  loading: false,
  error: null,
  departmentsError: null,
  loadedAt: 0,
  departmentsLoadedAt: 0,
};

const eventSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    setSearch: (state, action) => {
      state.search = action.payload;
      state.page = 1;
    },
    setDept: (state, action) => {
      const d = action.payload || {};
      state.deptSlug = d.shortcode || "";
      state.deptName = d.title || "";
      state.page = 1;
    },
    setPage: (state, action) => {
      state.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.status = "loading";
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.loading = false;
        state.error = null;
        state.loadedAt = Date.now();

        const items = Array.isArray(action.payload) ? action.payload : [];

        state.events = items.map((e) => ({
          ...e,
          cover_image: normalizeImage(e.cover_image || e.image || e.banner),
        }));
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.status = "failed";
        state.loading = false;
        state.error = action.payload || "Failed to fetch events";
      })
      .addCase(fetchDepartments.pending, (state) => {
        state.departmentsStatus = "loading";
        state.departmentsError = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.departmentsStatus = "succeeded";
        state.departmentsError = null;
        state.departmentsLoadedAt = Date.now();

        const items = pickItems(action.payload);

        state.departments = items
          .filter((d) => String(d?.active ?? 1) === "1")
          .map(mapDepartment)
          .filter((d) => d.uuid && d.title);
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.departmentsStatus = "failed";
        state.departmentsError = action.payload || "Failed to fetch departments";
      });
  },
});

export const { setSearch, setDept, setPage } = eventSlice.actions;
export default eventSlice.reducer;