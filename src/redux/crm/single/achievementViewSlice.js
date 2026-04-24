import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  fetchJson,
  shouldFetchBlock,
} from "../../request";

const ENDPOINT = "/api/public/achievements";

const pickAchievements = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const findAchievementBySlug = (payload, slug) => {
  const list = pickAchievements(payload);
  const target = String(slug || "").trim();

  if (!target) return null;

  return (
    list.find((item) => String(item?.slug || "").trim() === target) ||
    list.find((item) => String(item?.uuid || "").trim() === target) ||
    null
  );
};

export const fetchAchievementView = createAsyncThunk(
  "achievementView/fetch",
  async (slug, { rejectWithValue }) => {
    try {
      const payload = await fetchJson(ENDPOINT);
      const achievement = findAchievementBySlug(payload, slug);

      if (!achievement) {
        return rejectWithValue(
          "Achievement not found or API endpoint is not reachable. Please verify your public show route URL (expected: /api/public/achievements/{uuid})."
        );
      }

      return achievement;
    } catch (error) {
      return rejectWithValue(
        error?.message ||
          "Achievement not found or API endpoint is not reachable. Please verify your public show route URL (expected: /api/public/achievements/{uuid})."
      );
    }
  },
  {
    condition: (slug, { getState }) => {
      const state = getState()?.achievementView;
      const currentSlug = state?.loadedSlug || "";
      const nextSlug = String(slug || "").trim();

      if (!nextSlug) return false;

      if (currentSlug !== nextSlug) return true;

      return shouldFetchBlock(state, false, REQUEST_CACHE_TTL_MS);
    },
  }
);

export const resolveUrl = (path) => {
  if (!path) return "";
  const p = String(path).trim();
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  return window.location.origin + "/" + p.replace(/^\/+/, "");
};

export const formatDate = (v) => {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const parseAttachments = (value) => {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value || [];
    const arr = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.files)
        ? parsed.files
        : [];

    return arr
      .map((item, idx) => {
        let url = "";
        let name = "";
        let meta = "";

        if (typeof item === "string") {
          url = resolveUrl(item);
          name = item.split("/").pop() || `Attachment ${idx + 1}`;
        } else if (item && typeof item === "object") {
          url = resolveUrl(item.url || item.path || item.file || "");
          name = item.name || (url ? url.split("/").pop() : `Attachment ${idx + 1}`);
          meta = item.type || item.mime || "";
          if (item.size) meta = meta ? `${meta} • ${item.size}` : String(item.size);
        }

        if (!url) return null;

        return {
          url,
          name,
          meta: meta || "Click to open",
          index: idx + 1,
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
};

const initialState = {
  achievement: null,
  status: "idle",
  loading: false,
  error: null,
  loadedAt: 0,
  loadedSlug: "",
};

const slice = createSlice({
  name: "achievementView",
  initialState,
  reducers: {
    clearAchievementView: (state) => {
      state.achievement = null;
      state.status = "idle";
      state.loading = false;
      state.error = null;
      state.loadedAt = 0;
      state.loadedSlug = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAchievementView.pending, (state) => {
        state.status = "loading";
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAchievementView.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.loading = false;
        state.error = null;
        state.loadedAt = Date.now();
        state.loadedSlug = String(action.meta.arg || "").trim();
        state.achievement = action.payload || null;
      })
      .addCase(fetchAchievementView.rejected, (state, action) => {
        state.status = "failed";
        state.loading = false;
        state.error =
          action.payload ||
          "Achievement not found or API endpoint is not reachable. Please verify your public show route URL (expected: /api/public/achievements/{uuid}).";
      });
  },
});

export const { clearAchievementView } = slice.actions;
export const selectAchievementView = (state) => state.achievementView;

export default slice.reducer;