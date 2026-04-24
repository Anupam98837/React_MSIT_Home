import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  buildUrl,
  createAsyncState,
  decodeHtmlEntities,
  fetchJson,
  shouldFetchBlock,
} from "./request";

const HERO_ENDPOINT = "/api/public/grand-homepage/hero-carousel";

const getHtml = (value) => decodeHtmlEntities(String(value ?? "").trim());

const normalizeImageUrl = (value) => {
  const image = String(value || "").trim();
  if (!image) return "";
  return buildUrl(image);
};

const normalizeHeroPayload = (payload) => {
  const root =
    payload?.data && typeof payload.data === "object" ? payload.data : payload;

  const hero = root?.hero_carousel || root?.hero || root || {};

  const rawItems = Array.isArray(hero?.items)
    ? hero.items
    : Array.isArray(root?.items)
    ? root.items
    : [];

  const settings =
    hero?.settings && typeof hero.settings === "object"
      ? hero.settings
      : root?.settings && typeof root.settings === "object"
      ? root.settings
      : {};

  return {
    items: rawItems
      .map((item, index) => ({
        id: String(item?.id || item?.uuid || `hero-${index}`).trim(),
        desktopImage: normalizeImageUrl(
          item?.desktop_image_url ||
            item?.image_url ||
            item?.desktop_image ||
            item?.image
        ),
        mobileImage: normalizeImageUrl(item?.mobile_image_url || item?.mobile_image),
        altText: String(item?.alt_text || item?.title || "").trim(),
        overlayHtml: getHtml(item?.overlay_text || item?.content || item?.html || ""),
      }))
      .filter((item) => item.desktopImage || item.mobileImage || item.overlayHtml || item.altText),
    settings: {
      autoplay: Number(settings?.autoplay ?? 1) === 1,
      autoplayDelayMs:
        parseInt(settings?.autoplay_delay_ms ?? settings?.autoplay_speed ?? 5000, 10) || 5000,
      transition:
        String(settings?.transition || "slide").toLowerCase() === "fade"
          ? "fade"
          : "slide",
      transitionMs: Math.max(0, parseInt(settings?.transition_ms ?? 600, 10) || 600),
      loop: Number(settings?.loop ?? 1) === 1,
      pauseOnHover: Number(settings?.pause_on_hover ?? 1) === 1,
      showArrows: Number(settings?.show_arrows ?? 1) === 1,
      showDots: Number(settings?.show_dots ?? 1) === 1,
    },
  };
};

export const fetchHeroCarouselData = createAsyncThunk(
  "heroCarousel/fetchHeroCarouselData",
  async () => normalizeHeroPayload(await fetchJson(HERO_ENDPOINT)),
  {
    condition: (arg, { getState }) =>
      shouldFetchBlock(getState()?.heroCarousel, arg?.force === true, REQUEST_CACHE_TTL_MS),
  }
);

const heroCarouselSlice = createSlice({
  name: "heroCarousel",
  initialState: createAsyncState({
    items: [],
    settings: {
      autoplay: true,
      autoplayDelayMs: 5000,
      transition: "slide",
      transitionMs: 600,
      loop: true,
      pauseOnHover: true,
      showArrows: true,
      showDots: true,
    },
  }),
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHeroCarouselData.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(fetchHeroCarouselData.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.error = "";
        state.loadedAt = Date.now();
        state.items = action.payload.items;
        state.settings = action.payload.settings;
      })
      .addCase(fetchHeroCarouselData.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to load hero carousel";
        state.loadedAt = Date.now();
      });
  },
});

export const selectHeroCarousel = (state) => state.heroCarousel;
export default heroCarouselSlice.reducer;
