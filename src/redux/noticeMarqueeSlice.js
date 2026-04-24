import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { REQUEST_CACHE_TTL_MS, fetchJson, shouldFetchBlock } from "./request";

const NOTICE_MARQUEE_ENDPOINT = "/api/public/grand-homepage/notice-marquee";

const safeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const normalizeNoticeItem = (item, index) => {
  if (typeof item === "string") {
    return {
      id: `notice-${index}`,
      text: item.trim(),
      url: "",
    };
  }

  const obj = item && typeof item === "object" ? item : {};
  const text = (
    obj.text ??
    obj.title ??
    obj.notice ??
    obj.message ??
    obj.name ??
    ""
  )
    .toString()
    .trim();

  const url = (
    obj.url ??
    obj.link ??
    obj.href ??
    obj.action_url ??
    ""
  )
    .toString()
    .trim();

  return {
    id: obj.id ?? obj.uuid ?? obj.slug ?? `notice-${index}`,
    text,
    url,
  };
};

const normalizeNoticeMarqueePayload = (payload) => {
  const root =
    payload && typeof payload === "object" && payload.data && typeof payload.data === "object"
      ? payload.data
      : payload || {};

  const notice = root.notice_marquee || root.item || root || {};
  const itemsRaw = notice.items ?? notice.notice_items_json ?? root.items ?? [];
  const items = safeArray(itemsRaw)
    .map(normalizeNoticeItem)
    .filter((item) => item.text);

  const settings =
    notice.settings && typeof notice.settings === "object"
      ? notice.settings
      : notice && typeof notice === "object"
      ? notice
      : {};

  const gifSrc =
    notice.gif_src ||
    notice.notice_marquee_gif_src ||
    notice.separator_gif ||
    settings.gif_src ||
    settings.separator_gif ||
    root.notice_marquee_gif_src ||
    "";

  return {
    items,
    settings,
    gifSrc,
  };
};

export const fetchNoticeMarquee = createAsyncThunk(
  "noticeMarquee/fetchNoticeMarquee",
  async (_, { rejectWithValue }) => {
    try {
      const payload = await fetchJson(NOTICE_MARQUEE_ENDPOINT);
      return normalizeNoticeMarqueePayload(payload);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch notices");
    }
  },
  {
    condition: (arg, { getState }) =>
      shouldFetchBlock(
        getState()?.noticeMarquee,
        arg?.force === true,
        REQUEST_CACHE_TTL_MS
      ),
  }
);

const initialState = {
  items: [],
  settings: {},
  gifSrc: "",
  loading: false,
  error: null,
  status: "idle",
  loadedAt: 0,
};

const noticeMarqueeSlice = createSlice({
  name: "noticeMarquee",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNoticeMarquee.pending, (state) => {
        state.loading = true;
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchNoticeMarquee.fulfilled, (state, action) => {
        state.loading = false;
        state.status = "succeeded";
        state.items = action.payload.items || [];
        state.settings = action.payload.settings || {};
        state.gifSrc = action.payload.gifSrc || "";
        state.loadedAt = Date.now();
      })
      .addCase(fetchNoticeMarquee.rejected, (state, action) => {
        state.loading = false;
        state.status = "failed";
        state.error = action.payload || "Failed to fetch notices";
        state.loadedAt = Date.now();
      });
  },
});

export const selectNoticeMarquee = (state) => state.noticeMarquee || initialState;
export default noticeMarqueeSlice.reducer;