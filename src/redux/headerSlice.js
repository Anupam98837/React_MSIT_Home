import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  createAsyncState,
  fetchJson,
  getText,
  pickArray,
  shouldFetchBlock,
} from "./request";

const normalizeDepartments = (payload) => {
  const data =
    payload && typeof payload === "object" && "success" in payload
      ? payload.data
      : payload;

  return pickArray(data)
    .filter(Boolean)
    .map((item) => ({
      id: Number(item.id),
      uuid: getText(item.uuid, item.department_uuid, item.dept_uuid),
      shortName: getText(item.short_name, item.slug, item.shortcode),
      name: getText(item.name, item.title),
      slug: getText(item.slug, item.short_name, item.shortcode),
    }))
    .filter((item) => Number.isFinite(item.id) && item.id > 0);
};

const normalizeContactType = (rawType = "", value = "") => {
  const type = String(rawType || "").toLowerCase().trim();
  const val = String(value || "").toLowerCase();

  if (["phone", "mobile", "tel", "telephone", "call"].includes(type)) return "phone";
  if (["email", "mail"].includes(type)) return "email";
  if (["address", "location", "map", "maps"].includes(type)) return "address";
  if (["website", "web", "url", "link"].includes(type)) return "website";
  if (["whatsapp", "wa"].includes(type)) return "whatsapp";
  if (val.includes("@")) return "email";
  if (val.replace(/[^\d+]/g, "").length >= 8) return "phone";

  return type || "text";
};

const normalizeContacts = (payload) => {
  const root =
    payload && typeof payload === "object" && "success" in payload
      ? payload.data ?? payload
      : payload;

  const unpack = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.items)) return value.items;
    if (Array.isArray(value?.contacts)) return value.contacts;
    if (Array.isArray(value?.contact_infos)) return value.contact_infos;
    if (value.phone || value.email) return [value.phone, value.email].filter(Boolean);
    return [];
  };

  return unpack(root)
    .map((item) => {
      const source =
        item && typeof item === "object" && item.contact_info ? item.contact_info : item;

      if (!source || typeof source !== "object") return null;

      const key = getText(source.key, source.contact_key, source.kind);
      const label = getText(source.name, source.label, source.title, key);
      const value = getText(
        source.value,
        source.info,
        source.text,
        source.content,
        label
      );

      if (!value) return null;

      return {
        key,
        label,
        value,
        type: normalizeContactType(
          source.type || source.contact_type || key || "",
          value
        ),
        url: getText(source.url, source.href),
        icon: getText(source.icon_class, source.icon),
      };
    })
    .filter(Boolean);
};

const normalizeMenuNode = (item) => {
  if (!item || typeof item !== "object") return null;

  const status = String(item.status || "").toLowerCase();
  if (item.deleted_at) return null;
  if (status && !["active", "published"].includes(status)) return null;

  const children = Array.isArray(item.children)
    ? item.children.map(normalizeMenuNode).filter(Boolean)
    : [];

  return {
    id: Number(item.id),
    uuid: getText(item.uuid, item.menu_uuid),
    title: getText(item.title, item.name, item.menu_name, item.label, "Untitled"),
    slug: getText(item.slug),
    pageSlug: getText(item.page_slug),
    shortcode: getText(item.shortcode, item.page_shortcode, item.short_code),
    pageUrl: getText(item.page_url, item.link, item.url, item.href),
    target: getText(item.target),
    parentId:
      item.parent_id === null || item.parent_id === undefined
        ? null
        : Number(item.parent_id),
    departmentId:
      item.department_id === null || item.department_id === undefined
        ? null
        : Number(item.department_id),
    departmentUuid: getText(item.department_uuid, item.dept_uuid, item.department?.uuid),
    departmentShortcode: getText(item.department?.short_name, item.department?.slug),
    icon: getText(item.icon),
    position: Number(item.position || item.sort_order || 0),
    children,
    raw: item,
  };
};

const normalizeMenuPayload = (payload) => {
  const data =
    payload && typeof payload === "object" && "success" in payload
      ? payload.data
      : payload;

  return pickArray(data).map(normalizeMenuNode).filter(Boolean);
};

const pickLatestHeaderItem = (payload) => {
  const data =
    payload && typeof payload === "object" && "success" in payload
      ? payload
      : payload || {};

  const list = Array.isArray(data?.data) ? data.data : [];
  return list[0] || null;
};

const mapHeaderItem = (item) => {
  if (!item) return null;

  return {
    id: item.id || null,
    headerText: getText(item.header_text),
    rotatingTexts: Array.isArray(item.rotating_text_json)
      ? item.rotating_text_json
          .map((text) => String(text ?? "").trim())
          .filter(Boolean)
      : [],
    primaryLogo: getText(item.primary_logo_full_url, item.primary_logo_url),
    secondaryLogo: getText(item.secondary_logo_full_url, item.secondary_logo_url),
    admissionBadge: getText(item.admission_badge_full_url, item.admission_badge_url),
    admissionLink: getText(
      item.admission_badge_link,
      item.admission_link_full_url,
      item.admission_link_url
    ),
    affiliationLogos: Array.isArray(item.affiliation_logos)
      ? item.affiliation_logos
          .map((logo) => ({
            src: getText(logo?.url_full, logo?.url, logo?.path),
            alt: getText(logo?.caption, "Affiliation logo"),
          }))
          .filter((logo) => logo.src)
      : [],
    partnerRecruiters: Array.isArray(item.partner_recruiters)
      ? item.partner_recruiters
          .map((logo) => ({
            src: getText(logo?.logo_full_url, logo?.logo_url),
            alt: getText(logo?.title, "Partner logo"),
          }))
          .filter((logo) => logo.src)
      : [],
  };
};

const getDepartments = async () => {
  const departments = normalizeDepartments(await fetchJson("/api/public/departments"));

  const byId = departments.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

  return { departments, byId };
};

export const fetchTopHeaderData = createAsyncThunk(
  "header/fetchTopHeaderData",
  async () => {
    const [{ departments, byId }, menusRaw, primaryContactsRaw] = await Promise.all([
      getDepartments(),
      fetchJson("/api/public/top-header-menus"),
      fetchJson("/api/public/top-header-menus/contact-infos").catch(() => null),
    ]);

    return {
      departments,
      departmentsById: byId,
      contacts: normalizeContacts(primaryContactsRaw).slice(0, 2),
      menus: normalizeMenuPayload(menusRaw),
    };
  },
  {
    condition: (arg, { getState }) =>
      shouldFetchBlock(getState()?.header?.topHeader, arg?.force === true),
  }
);

export const fetchMainHeaderData = createAsyncThunk(
  "header/fetchMainHeaderData",
  async () => {
    const params = new URLSearchParams({
      per_page: "1",
      page: "1",
      sort: "updated_at",
      direction: "desc",
    });

    const payload = await fetchJson(`/api/header-components?${params.toString()}`, {
      withAuth: true,
    });

    return mapHeaderItem(pickLatestHeaderItem(payload));
  },
  {
    condition: (arg, { getState }) =>
      shouldFetchBlock(getState()?.header?.mainHeader, arg?.force === true),
  }
);

export const fetchModuleHeaderData = createAsyncThunk(
  "header/fetchModuleHeaderData",
  async () => {
    const [{ departments, byId }, menuRaw] = await Promise.all([
      getDepartments(),
      fetchJson("/api/public/header-menus/tree?include_children=1&only_active=1&per_page=200"),
    ]);

    return {
      departments,
      departmentsById: byId,
      menus: normalizeMenuPayload(menuRaw),
    };
  },
  {
    condition: (arg, { getState }) =>
      shouldFetchBlock(getState()?.header?.moduleHeader, arg?.force === true),
  }
);

const headerSlice = createSlice({
  name: "header",
  initialState: {
    topHeader: createAsyncState({
      contacts: [],
      menus: [],
    }),
    mainHeader: createAsyncState({
      item: null,
    }),
    moduleHeader: createAsyncState({
      menus: [],
    }),
    departments: [],
    departmentsById: {},
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTopHeaderData.pending, (state) => {
        state.topHeader.status = "loading";
        state.topHeader.error = "";
      })
      .addCase(fetchTopHeaderData.fulfilled, (state, action) => {
        state.topHeader.status = "succeeded";
        state.topHeader.loadedAt = Date.now();
        state.topHeader.contacts = action.payload.contacts;
        state.topHeader.menus = action.payload.menus;
        state.departments = action.payload.departments;
        state.departmentsById = action.payload.departmentsById;
      })
      .addCase(fetchTopHeaderData.rejected, (state, action) => {
        state.topHeader.status = "failed";
        state.topHeader.error = action.error.message || "Failed to load top header";
      })
      .addCase(fetchMainHeaderData.pending, (state) => {
        state.mainHeader.status = "loading";
        state.mainHeader.error = "";
      })
      .addCase(fetchMainHeaderData.fulfilled, (state, action) => {
        state.mainHeader.status = "succeeded";
        state.mainHeader.loadedAt = Date.now();
        state.mainHeader.item = action.payload;
      })
      .addCase(fetchMainHeaderData.rejected, (state, action) => {
        state.mainHeader.status = "failed";
        state.mainHeader.error = action.error.message || "Failed to load main header";
      })
      .addCase(fetchModuleHeaderData.pending, (state) => {
        state.moduleHeader.status = "loading";
        state.moduleHeader.error = "";
      })
      .addCase(fetchModuleHeaderData.fulfilled, (state, action) => {
        state.moduleHeader.status = "succeeded";
        state.moduleHeader.loadedAt = Date.now();
        state.moduleHeader.menus = action.payload.menus;
        state.departments = action.payload.departments;
        state.departmentsById = action.payload.departmentsById;
      })
      .addCase(fetchModuleHeaderData.rejected, (state, action) => {
        state.moduleHeader.status = "failed";
        state.moduleHeader.error = action.error.message || "Failed to load module header";
      });
  },
});

export const selectTopHeader = (state) => state.header.topHeader;
export const selectMainHeader = (state) => state.header.mainHeader;
export const selectModuleHeader = (state) => state.header.moduleHeader;
export const selectDepartments = (state) => state.header.departments;
export const selectDepartmentsById = (state) => state.header.departmentsById;

export default headerSlice.reducer;
export { REQUEST_CACHE_TTL_MS };
