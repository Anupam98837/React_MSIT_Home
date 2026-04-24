import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  buildUrl,
  createAsyncState,
  fetchJson,
  getText,
  shouldFetchBlock,
} from "./request";

const ORDERED_COURSES_ENDPOINT = "/api/public/ordered-courses";
const SUBMIT_ENQUIRY_ENDPOINT = "/api/contact-us";

const normalizeCourse = (item, index) => {
  if (!item || typeof item !== "object") return null;

  const id = Number(item.id);
  const title = getText(item.custom_name, item.title, item.name, item.label);

  if (!Number.isFinite(id) || id <= 0 || !title) return null;

  return {
    id,
    title: getText(item.title, item.name, item.label),
    customName: getText(item.custom_name, item.customName),
    programLevel: getText(item.program_level, item.programLevel).toLowerCase(),
    approvals: getText(item.approvals),
    sortOrder: Number(item.position || item.sort_order || index || 0),
  };
};

const normalizeCourses = (payload) => {
  const list = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload)
    ? payload
    : [];

  return list
    .map(normalizeCourse)
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
};

const parseErrorPayload = async (response) => {
  const text = await response.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  let message = data?.message || `Request failed with status ${response.status}`;

  if (data?.errors && typeof data.errors === "object") {
    const firstKey = Object.keys(data.errors)[0];
    const firstMessage = firstKey && Array.isArray(data.errors[firstKey])
      ? data.errors[firstKey][0]
      : "";

    if (firstMessage) {
      message = firstMessage;
    }
  }

  return {
    message,
    data,
  };
};

export const fetchEnquiryCourses = createAsyncThunk(
  "enquiry/fetchEnquiryCourses",
  async (_, { rejectWithValue }) => {
    try {
      const payload = await fetchJson(ORDERED_COURSES_ENDPOINT);
      return normalizeCourses(payload);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to load courses.");
    }
  },
  {
    condition: (arg, { getState }) =>
      shouldFetchBlock(
        getState()?.enquiry?.courses,
        arg?.force === true,
        REQUEST_CACHE_TTL_MS
      ),
  }
);

export const submitEnquiry = createAsyncThunk(
  "enquiry/submitEnquiry",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await fetch(buildUrl(SUBMIT_ENQUIRY_ENDPOINT), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorPayload = await parseErrorPayload(response);
        return rejectWithValue(errorPayload.message);
      }

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};
      return data;
    } catch (error) {
      return rejectWithValue(error?.message || "Something went wrong. Please try again.");
    }
  }
);

const initialState = {
  isModalOpen: false,
  courses: createAsyncState({
    items: [],
  }),
  submit: createAsyncState(),
  toast: null,
};

const enquirySlice = createSlice({
  name: "enquiry",
  initialState,
  reducers: {
    openEnquiryModal: (state) => {
      state.isModalOpen = true;
    },
    closeEnquiryModal: (state) => {
      state.isModalOpen = false;
    },
    setEnquiryToast: (state, action) => {
      state.toast = {
        id: Date.now(),
        type: action.payload?.type || "info",
        title: action.payload?.title || "Notice",
        message: action.payload?.message || "",
      };
    },
    clearEnquiryToast: (state) => {
      state.toast = null;
    },
    resetEnquirySubmitState: (state) => {
      state.submit.status = "idle";
      state.submit.error = "";
      state.submit.loadedAt = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEnquiryCourses.pending, (state) => {
        state.courses.status = "loading";
        state.courses.error = "";
      })
      .addCase(fetchEnquiryCourses.fulfilled, (state, action) => {
        state.courses.status = "succeeded";
        state.courses.error = "";
        state.courses.items = action.payload || [];
        state.courses.loadedAt = Date.now();
      })
      .addCase(fetchEnquiryCourses.rejected, (state, action) => {
        state.courses.status = "failed";
        state.courses.error = action.payload || "Failed to load courses.";
        state.courses.loadedAt = Date.now();
      })
      .addCase(submitEnquiry.pending, (state) => {
        state.submit.status = "loading";
        state.submit.error = "";
      })
      .addCase(submitEnquiry.fulfilled, (state) => {
        state.submit.status = "succeeded";
        state.submit.error = "";
        state.submit.loadedAt = Date.now();
      })
      .addCase(submitEnquiry.rejected, (state, action) => {
        state.submit.status = "failed";
        state.submit.error = action.payload || "Failed to submit enquiry.";
        state.submit.loadedAt = Date.now();
      });
  },
});

export const {
  openEnquiryModal,
  closeEnquiryModal,
  setEnquiryToast,
  clearEnquiryToast,
  resetEnquirySubmitState,
} = enquirySlice.actions;

export const selectEnquiry = (state) => state.enquiry || initialState;
export const selectEnquiryModalOpen = (state) => Boolean(state.enquiry?.isModalOpen);
export const selectEnquiryCourses = (state) => state.enquiry?.courses || initialState.courses;
export const selectEnquirySubmit = (state) => state.enquiry?.submit || initialState.submit;
export const selectEnquiryToast = (state) => state.enquiry?.toast || null;

export default enquirySlice.reducer;