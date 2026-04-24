import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  buildUrl,
  createAsyncState,
  fetchJson,
  getText,
  shouldFetchBlock,
} from "./request";

const INFO_BOXES_ENDPOINT = "/api/public/grand-homepage/quick-links";

const pickFirstObject = (...values) => {
  for (const value of values) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value;
    }
  }
  return null;
};

const getHtml = (...values) => getText(...values) || "";

const normalizeUrl = (value) => {
  const url = String(value || "").trim();
  if (!url) return "";

  if (/^(https?:\/\/|mailto:|tel:|sms:|whatsapp:|#)/i.test(url)) {
    return url;
  }

  if (url.startsWith("/")) return url;
  return `/${url.replace(/^\/+/, "")}`;
};

const normalizeTarget = (value) => {
  const target = String(value || "").trim().toLowerCase();
  if (["_blank", "blank", "new"].includes(target)) return "_blank";
  return "_self";
};

const normalizeImageUrl = (value) => {
  const image = String(value || "").trim();
  if (!image) return "";
  return buildUrl(image);
};

const normalizeSectionPath = (value) => {
  const raw = String(value || "").trim().replace(/^\/+|\/+$/g, "");
  if (!raw) return "";

  switch (raw.toLowerCase()) {
    case "career_notices":
    case "career-notices":
      return "career_notices";
    case "why_us":
    case "why-us":
      return "why_us";
    case "scholarships":
      return "scholarships";
    default:
      return raw.toLowerCase();
  }
};

const extractSectionFromUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const clean = raw
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/^\/+/, "")
    .split("?")[0]
    .split("#")[0];

  const first = clean.split("/").filter(Boolean)[0] || "";
  return normalizeSectionPath(first);
};

const extractSlugFromUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const clean = raw
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/^\/+/, "")
    .split("?")[0]
    .split("#")[0];

  const parts = clean.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
};

const getCategoryMeta = (categoryKey) => {
  switch (categoryKey) {
    case "career_notices":
      return {
        iconClass: "fa-solid fa-trophy",
        badge: "Career",
        accentColor: "#f59e0b",
      };
    case "why_us":
      return {
        iconClass: "fa-solid fa-star",
        badge: "Why MSIT",
        accentColor: "#10b981",
      };
    case "scholarships":
      return {
        iconClass: "fa-solid fa-award",
        badge: "Scholarship",
        accentColor: "#8b5cf6",
      };
    default:
      return {
        iconClass: "fa-solid fa-circle-info",
        badge: "Info",
        accentColor: "#C94B50",
      };
  }
};

const normalizeInfoBoxItem = (item, index, categoryKey = "") => {
  if (!item || typeof item !== "object") return null;

  const style = pickFirstObject(item.style, item.styles, item.design, item.appearance);

  const rawHref = getText(
    item.url,
    item.link,
    item.href,
    item.button_link,
    item.page_url,
    item.redirect_url
  );

  const href = normalizeUrl(rawHref);

  const resolvedCategoryKey = normalizeSectionPath(
    getText(
      categoryKey,
      item.category_key,
      item.category,
      item.section,
      item.type,
      extractSectionFromUrl(rawHref)
    )
  );

  const categoryMeta = getCategoryMeta(resolvedCategoryKey);

  const title = getText(item.title, item.name, item.heading, item.label);
  const description = getText(
    item.description,
    item.subtitle,
    item.sub_title,
    item.text,
    item.summary,
    item.excerpt
  );
  const html = getHtml(item.html, item.content, item.content_html, item.description_html);
  const slug = getText(
    item.slug,
    item.page_slug,
    item.post_slug,
    item.url_slug,
    item.seo_slug,
    item.link_slug,
    item.raw?.slug,
    extractSlugFromUrl(rawHref)
  );

  const isDisabled = Number(item?.is_active ?? item?.active ?? 1) === 0;
  if (!title && !description && !html && !href) return null;
  if (isDisabled) return null;

  return {
    id: getText(item.id, item.uuid, `${resolvedCategoryKey || "info-box"}-${index + 1}`),
    categoryKey: resolvedCategoryKey,
    slug,
    title,
    description,
    html,
    href,
    target: normalizeTarget(getText(item.target, item.link_target, item.button_target)),
    buttonText: getText(
      item.button_text,
      item.cta_text,
      item.link_text,
      item.action_text,
      "Explore"
    ),
    iconClass: getText(
      item.icon,
      item.icon_class,
      item.fa_icon,
      item.iconClass,
      categoryMeta.iconClass
    ),
    iconImage: normalizeImageUrl(
      getText(item.icon_image_url, item.image_url, item.icon_url, item.iconImage)
    ),
    iconHtml: getHtml(item.icon_html, item.svg, item.icon_svg),
    badge: getText(item.badge, item.top_label, item.tag, categoryMeta.badge),
    backgroundColor: getText(
      item.background_color,
      item.bg_color,
      style?.background_color,
      style?.bg_color,
      "#ffffff"
    ),
    borderColor: getText(item.border_color, style?.border_color, "#ead4d5"),
    textColor: getText(item.text_color, style?.text_color, "#1f2937"),
    accentColor: getText(item.accent_color, style?.accent_color, categoryMeta.accentColor),
    hoverColor: getText(item.hover_color, style?.hover_color),
    raw: item,
  };
};

const extractTopLevelCategoryItems = (root) => {
  const categoryKeys = ["career_notices", "why_us", "scholarships"];

  return categoryKeys.flatMap((categoryKey) => {
    const list = Array.isArray(root?.[categoryKey]) ? root[categoryKey] : [];

    return list
      .map((item, index) => normalizeInfoBoxItem(item, index, categoryKey))
      .filter(Boolean);
  });
};

const normalizeInfoBoxesPayload = (payload) => {
  const root =
    payload?.data && typeof payload.data === "object" ? payload.data : payload;

  const settings = pickFirstObject(root?.settings, root?.config);
  const items = extractTopLevelCategoryItems(root);

  return {
    sectionTitle: getText(root?.title, root?.section_title, "Quick Links"),
    sectionSubtitle: getText(
      root?.subtitle,
      root?.section_subtitle,
      "Career notices, why us highlights, and scholarship links."
    ),
    items,
    settings: {
      columns: Math.max(
        1,
        Math.min(4, Number(settings?.columns || settings?.desktop_columns || 4) || 4)
      ),
    },
  };
};

export const fetchInfoBoxesData = createAsyncThunk(
  "infoBoxes/fetchInfoBoxesData",
  async () => normalizeInfoBoxesPayload(await fetchJson(INFO_BOXES_ENDPOINT)),
  {
    condition: (arg, { getState }) =>
      shouldFetchBlock(getState()?.infoBoxes, arg?.force === true, REQUEST_CACHE_TTL_MS),
  }
);

const infoBoxesSlice = createSlice({
  name: "infoBoxes",
  initialState: createAsyncState({
    sectionTitle: "",
    sectionSubtitle: "",
    items: [],
    settings: {
      columns: 4,
    },
  }),
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInfoBoxesData.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(fetchInfoBoxesData.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.error = "";
        state.loadedAt = Date.now();
        state.sectionTitle = action.payload.sectionTitle;
        state.sectionSubtitle = action.payload.sectionSubtitle;
        state.items = action.payload.items;
        state.settings = action.payload.settings;
      })
      .addCase(fetchInfoBoxesData.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to load info boxes";
        state.loadedAt = Date.now();
      });
  },
});

export const selectInfoBoxes = (state) => state.infoBoxes;
export default infoBoxesSlice.reducer;
