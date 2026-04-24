import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { REQUEST_CACHE_TTL_MS, fetchJson, shouldFetchBlock } from "./request";

const COURSES_ENDPOINT = "/api/public/grand-homepage/courses";

const normalizeCoursesPayload = (payload) => {
  if (Array.isArray(payload?.courses)) return payload.courses;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
};

export const fetchCourses = createAsyncThunk(
  "courses/fetchCourses",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchJson(COURSES_ENDPOINT);
      return normalizeCoursesPayload(response);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch courses");
    }
  },
  {
    condition: (arg, { getState }) =>
      shouldFetchBlock(
        getState()?.courses,
        arg?.force === true,
        REQUEST_CACHE_TTL_MS
      ),
  }
);

const courseSlice = createSlice({
  name: "courses",
  initialState: {
    data: [],
    status: "idle",
    error: null,
    loadedAt: 0,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
        state.error = null;
        state.loadedAt = Date.now();
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to fetch courses";
        state.loadedAt = Date.now();
      });
  },
});

export default courseSlice.reducer;

export const selectCourses = (state) => state?.courses?.data || [];

export const selectUgCourses = (state) => {
  const courses = state?.courses?.data || [];

  const isUgCourse = (course) => {
    const value =
      course?.program_level ||
      course?.programLevel ||
      course?.level ||
      course?.course_level ||
      "";

    const text = String(value || "").trim().toLowerCase();

    return text === "ug" || text === "undergraduate";
  };

  const hasAICTEApproval = (course) => {
    const value =
      course?.approvals ||
      course?.approval ||
      course?.approved_by ||
      course?.approvedBy ||
      "";

    if (Array.isArray(value)) {
      return value.some((item) =>
        String(item || "").toLowerCase().includes("aicte")
      );
    }

    if (value && typeof value === "object") {
      const nested =
        value.items || value.list || value.values || value.approvals || [];
      if (Array.isArray(nested)) {
        return nested.some((item) =>
          String(item || "").toLowerCase().includes("aicte")
        );
      }

      try {
        return JSON.stringify(value).toLowerCase().includes("aicte");
      } catch {
        return false;
      }
    }

    return String(value || "").toLowerCase().includes("aicte");
  };

  return courses.filter(
    (course) => isUgCourse(course) && hasAICTEApproval(course)
  );
};