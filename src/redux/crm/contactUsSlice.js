import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  buildUrl,
  createAsyncState,
  fetchJson,
  getText,
  shouldFetchBlock,
} from "../request";

const CONTACT_INFO_ENDPOINT = "/api/public/top-header-menus/contact-infos";
const CONTACT_VISIBILITY_ENDPOINT = "/api/public/contact-us-page-visibility";
const SUBMIT_CONTACT_US_ENDPOINT = "/api/contact-us";

export const CONTACT_US_LEGAL_TEXT_1 = "I agree to the Terms and conditions *";
export const CONTACT_US_LEGAL_TEXT_2 =
  "I agree to receive communication on newsletters-promotional content-offers an events through SMS-RCS *";

const DEFAULT_MAP_QUERY = "Meghnad Saha Institute of Technology Uchhepota Kolkata";

const unwrapApi = (payload) => {
  if (payload && typeof payload === "object" && "success" in payload) {
    return payload.data ?? payload;
  }
  return payload;
};

const pickArrayish = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.contacts)) return value.contacts;
  if (Array.isArray(value?.contact_infos)) return value.contact_infos;
  return [];
};

const toBool = (value, fallback = true) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const text = String(value).trim().toLowerCase();
  if (["0", "false", "no", "off"].includes(text)) return false;
  if (["1", "true", "yes", "on"].includes(text)) return true;
  return fallback;
};

const norm = (value) => String(value || "").trim().toLowerCase();

const fallbackIconByKey = (key) => {
  const k = norm(key);

  if (["address", "location", "map"].includes(k)) return "fa-solid fa-location-dot";
  if (["phone", "mobile", "tel", "telephone", "call"].includes(k)) {
    return "fa-solid fa-phone";
  }
  if (k === "whatsapp") return "fa-brands fa-whatsapp";
  if (["email", "mail"].includes(k)) return "fa-solid fa-envelope-open-text";
  if (k.includes("recruit") || k.includes("placement")) return "fa-solid fa-envelope";
  if (["website", "site", "url"].includes(k)) return "fa-solid fa-globe";
  if (k === "facebook") return "fa-brands fa-facebook-f";
  if (k === "instagram") return "fa-brands fa-instagram";
  if (k === "linkedin") return "fa-brands fa-linkedin-in";
  if (k === "youtube") return "fa-brands fa-youtube";
  if (k === "twitter" || k === "x") return "fa-brands fa-x-twitter";

  return "fa-solid fa-circle-info";
};

const toUrl = (path) => {
  const value = String(path || "").trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;
  return buildUrl(`/${value.replace(/^\/+/, "")}`);
};

const actionUrlFor = (key, value) => {
  const k = norm(key);
  const v = String(value || "").trim();

  if (!v) return null;

  if (["email", "mail"].includes(k)) return `mailto:${v}`;

  if (["phone", "mobile", "tel", "telephone", "call"].includes(k)) {
    return `tel:${v.replace(/\s+/g, "")}`;
  }

  if (k === "whatsapp") {
    const digits = v.replace(/\D+/g, "").replace(/^0+/, "");
    return digits ? `https://wa.me/${digits}` : null;
  }

  if (["address", "location", "map"].includes(k)) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v)}`;
  }

  if (
    ["website", "site", "url", "linkedin", "facebook", "instagram", "twitter", "x", "youtube"].includes(
      k
    ) ||
    /^https?:\/\//i.test(v) ||
    v.startsWith("/") ||
    v.startsWith("//")
  ) {
    return toUrl(v);
  }

  return null;
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
  const root = unwrapApi(payload);

  return pickArrayish(root)
    .map((item, index) => {
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

      return {
        id: Number(source.id ?? item?.id ?? index + 1),
        key,
        label,
        value,
        type: normalizeContactType(source.type || source.contact_type || key || "", value),
        url: getText(source.url, source.href),
        icon: getText(source.icon_class, source.icon),
      };
    })
    .filter(Boolean);
};

const normalizeVisibility = (payload) => {
  const root = unwrapApi(payload);
  const row = Array.isArray(root) ? root[0] || {} : root || {};

  return {
    showAddress: toBool(row.show_address ?? row.showAddress, true),
    showCall: toBool(row.show_call ?? row.showCall, true),
    showRecruitment: toBool(row.show_recruitment ?? row.showRecruitment, true),
    showEmail: toBool(row.show_email ?? row.showEmail, true),
    showForm: toBool(row.show_form ?? row.showForm, true),
    showMap: toBool(row.show_map ?? row.showMap, true),
  };
};

const buildContactUsPage = (contactsPayload, visibilityPayload) => {
  const contacts = normalizeContacts(contactsPayload);
  const visibility = normalizeVisibility(visibilityPayload);

  const addressRow = contacts.find((row) =>
    ["address", "location", "map"].includes(norm(row.key))
  );

  const callRow = contacts.find((row) =>
    ["phone", "mobile", "tel", "telephone", "call"].includes(norm(row.key))
  );

  let recruitRow = contacts.find((row) => {
    const k = norm(row.key);
    return (
      k.includes("recruit") ||
      k.includes("placement") ||
      k === "recruitment_email" ||
      k === "placement_email"
    );
  });

  if (!recruitRow) {
    recruitRow = contacts.find((row) => {
      const k = norm(row.key);
      const n = norm(row.label);
      return ["email", "mail"].includes(k) && (n.includes("recruit") || n.includes("placement"));
    });
  }

  const emailRow = contacts
    .filter((row) => ["email", "mail"].includes(norm(row.key)))
    .find((row) => !recruitRow || row.id !== recruitRow.id);

  const addressValue = String(addressRow?.value || "").trim();
  const callValue = String(callRow?.value || "").trim();
  const recruitValue = String(recruitRow?.value || "").trim();
  const emailValue = String(emailRow?.value || "").trim();

  const infoCards = [
    {
      slot: "address",
      visible: visibility.showAddress,
      icon:
        addressRow?.icon && String(addressRow.icon).trim()
          ? addressRow.icon
          : fallbackIconByKey("address"),
      title:
        addressRow?.label && String(addressRow.label).trim()
          ? addressRow.label
          : "Address",
      value: addressValue,
      href: addressRow ? actionUrlFor(addressRow.key, addressValue) : null,
      multiline: true,
    },
    {
      slot: "call",
      visible: visibility.showCall,
      icon:
        callRow?.icon && String(callRow.icon).trim()
          ? callRow.icon
          : fallbackIconByKey("phone"),
      title:
        callRow?.label && String(callRow.label).trim()
          ? callRow.label
          : "Call Us",
      value: callValue,
      href: callRow ? actionUrlFor(callRow.key, callValue) : null,
      multiline: false,
    },
    {
      slot: "recruitment",
      visible: visibility.showRecruitment,
      icon:
        recruitRow?.icon && String(recruitRow.icon).trim()
          ? recruitRow.icon
          : fallbackIconByKey("recruitment"),
      title:
        recruitRow?.label && String(recruitRow.label).trim()
          ? recruitRow.label
          : "For Campus Recruitment Drive",
      value: recruitValue,
      href: recruitRow ? actionUrlFor(recruitRow.key, recruitValue) : null,
      multiline: false,
    },
    {
      slot: "email",
      visible: visibility.showEmail,
      icon:
        emailRow?.icon && String(emailRow.icon).trim()
          ? emailRow.icon
          : fallbackIconByKey("email"),
      title:
        emailRow?.label && String(emailRow.label).trim()
          ? emailRow.label
          : "Email",
      value: emailValue,
      href: emailRow ? actionUrlFor(emailRow.key, emailValue) : null,
      multiline: false,
    },
  ].filter((item) => item.visible);

  const mapQuery = addressValue || DEFAULT_MAP_QUERY;
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;

  return {
    heroTitle: "Contact Us",
    heroSubtitle: "Excellence in Technical Education",
    showInfoGrid:
      visibility.showAddress ||
      visibility.showCall ||
      visibility.showRecruitment ||
      visibility.showEmail,
    showForm: visibility.showForm,
    showMap: visibility.showMap,
    infoCards,
    mapQuery,
    mapSrc,
  };
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
    const firstMessage =
      firstKey && Array.isArray(data.errors[firstKey]) ? data.errors[firstKey][0] : "";

    if (firstMessage) message = firstMessage;
  }

  return { message, data };
};

export const fetchContactUsPageData = createAsyncThunk(
  "contactUs/fetchContactUsPageData",
  async (_, { rejectWithValue }) => {
    try {
      const [contactsPayload, visibilityPayload] = await Promise.all([
        fetchJson(CONTACT_INFO_ENDPOINT).catch(() => null),
        fetchJson(CONTACT_VISIBILITY_ENDPOINT).catch(() => null),
      ]);

      return buildContactUsPage(contactsPayload, visibilityPayload);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to load contact us page.");
    }
  },
  {
    condition: (arg, { getState }) =>
      shouldFetchBlock(
        getState()?.contactUs?.page,
        arg?.force === true,
        REQUEST_CACHE_TTL_MS
      ),
  }
);

export const submitContactUs = createAsyncThunk(
  "contactUs/submitContactUs",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await fetch(buildUrl(SUBMIT_CONTACT_US_ENDPOINT), {
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
  page: createAsyncState({
    heroTitle: "Contact Us",
    heroSubtitle: "Excellence in Technical Education",
    showInfoGrid: false,
    showForm: true,
    showMap: true,
    infoCards: [],
    mapQuery: DEFAULT_MAP_QUERY,
    mapSrc: `https://www.google.com/maps?q=${encodeURIComponent(DEFAULT_MAP_QUERY)}&output=embed`,
  }),
  submit: createAsyncState(),
};

const contactUsSlice = createSlice({
  name: "contactUs",
  initialState,
  reducers: {
    resetContactUsSubmitState: (state) => {
      state.submit.status = "idle";
      state.submit.error = "";
      state.submit.loadedAt = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchContactUsPageData.pending, (state) => {
        state.page.status = "loading";
        state.page.error = "";
      })
      .addCase(fetchContactUsPageData.fulfilled, (state, action) => {
        state.page.status = "succeeded";
        state.page.error = "";
        state.page.loadedAt = Date.now();
        Object.assign(state.page, action.payload || {});
      })
      .addCase(fetchContactUsPageData.rejected, (state, action) => {
        state.page.status = "failed";
        state.page.error = action.payload || "Failed to load contact us page.";
        state.page.loadedAt = Date.now();
      })
      .addCase(submitContactUs.pending, (state) => {
        state.submit.status = "loading";
        state.submit.error = "";
      })
      .addCase(submitContactUs.fulfilled, (state) => {
        state.submit.status = "succeeded";
        state.submit.error = "";
        state.submit.loadedAt = Date.now();
      })
      .addCase(submitContactUs.rejected, (state, action) => {
        state.submit.status = "failed";
        state.submit.error = action.payload || "Failed to send message.";
        state.submit.loadedAt = Date.now();
      });
  },
});

export const { resetContactUsSubmitState } = contactUsSlice.actions;

export const selectContactUs = (state) => state.contactUs || initialState;
export const selectContactUsPage = (state) => state.contactUs?.page || initialState.page;
export const selectContactUsSubmit = (state) =>
  state.contactUs?.submit || initialState.submit;

export default contactUsSlice.reducer;