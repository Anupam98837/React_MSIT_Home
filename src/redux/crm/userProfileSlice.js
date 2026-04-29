import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  REQUEST_CACHE_TTL_MS,
  fetchJson,
  shouldFetchBlock,
} from "../request";

const createProfileBlock = () => ({
  status: "idle",
  error: "",
  loadedAt: 0,
  data: null,
});

const EMPTY_PROFILE_BLOCK = Object.freeze(createProfileBlock());

const BASIC_KEYS = [
  "id",
  "uuid",
  "slug",
  "name",
  "email",
  "phone_number",
  "address",
  "image",
  "image_url",
  "photo_url",
  "profile_image",
  "profile_image_url",
  "role",
  "role_title",
  "role_short_form",
  "designation",
  "department_id",
  "department",
  "status",
];

const isObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value);

const clean = (value) => String(value ?? "").trim();

const normalizeKey = (value) => {
  let text = clean(value);

  try {
    text = decodeURIComponent(text);
  } catch {
    // keep original value
  }

  return text.split("#")[0].split("?")[0].trim();
};

const getSlug = (input) => {
  const value =
    typeof input === "string"
      ? input
      : input?.slug ??
        input?.identifier ??
        input?.uuid ??
        input?.id ??
        input?.user_slug ??
        "";

  return normalizeKey(value);
};

const getForce = (input) =>
  typeof input === "object" && input !== null ? Boolean(input.force) : false;

const hasValue = (value) => {
  if (value === null || value === undefined) return false;

  if (Array.isArray(value)) {
    return value.some((item) => hasValue(item));
  }

  if (isObject(value)) {
    return Object.values(value).some((item) => hasValue(item));
  }

  const text = clean(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  return text !== "" && text !== "null" && text !== "undefined" && text !== "—";
};

const firstObject = (...items) => items.find((item) => isObject(item)) || {};

const pickFields = (source, keys) => {
  const out = {};

  if (!isObject(source)) return out;

  keys.forEach((key) => {
    if (hasValue(source[key])) {
      out[key] = source[key];
    }
  });

  return out;
};

const mergeFilled = (...sources) => {
  const out = {};

  sources.forEach((source) => {
    if (!isObject(source)) return;

    Object.entries(source).forEach(([key, value]) => {
      if (hasValue(value)) {
        out[key] = value;
      }
    });
  });

  return out;
};

const firstArray = (...items) => {
  for (const item of items) {
    if (Array.isArray(item)) return item;

    if (isObject(item) && Array.isArray(item.data)) {
      return item.data;
    }
  }

  return [];
};

const unwrapRoot = (payload) => {
  const root = firstObject(
    payload?.data?.profile,
    payload?.data?.user_profile,
    payload?.profile,
    payload?.user_profile,
    payload?.data,
    payload
  );

  return root;
};

const normalizeProfilePayload = (profilePayload) => {
  const root = unwrapRoot(profilePayload);

  const nestedUser = firstObject(
    root?.basic,
    root?.user,
    root?.profile_user,
    root?.core,
    profilePayload?.data?.user,
    profilePayload?.user
  );

  const basic = mergeFilled(
    pickFields(root, BASIC_KEYS),
    pickFields(nestedUser, BASIC_KEYS),
    root?.basic
  );

  return {
    ...root,

    basic,

    personal: firstObject(
      root?.personal,
      root?.personal_information,
      root?.profile_personal,
      root?.profile_personal_information
    ),

    educations: firstArray(
      root?.educations,
      root?.education,
      root?.profile_educations,
      root?.user_educations
    ),

    honors: firstArray(
      root?.honors,
      root?.awards,
      root?.honors_awards,
      root?.profile_honors
    ),

    journals: firstArray(
      root?.journals,
      root?.patents,
      root?.profile_journals,
      root?.user_journals
    ),

    conference_publications: firstArray(
      root?.conference_publications,
      root?.conferences,
      root?.publications,
      root?.profile_conference_publications
    ),

    teaching_engagements: firstArray(
      root?.teaching_engagements,
      root?.engagements,
      root?.profile_teaching_engagements
    ),

    social_media: firstArray(
      root?.social_media,
      root?.social_links,
      root?.social_media_links,
      root?.profile_social_media,
      root?.socials
    ),
  };
};

const hasUsefulProfileData = (data) => {
  if (!isObject(data)) return false;

  return (
    hasValue(data.basic) ||
    hasValue(data.personal) ||
    hasValue(data.educations) ||
    hasValue(data.honors) ||
    hasValue(data.journals) ||
    hasValue(data.conference_publications) ||
    hasValue(data.teaching_engagements) ||
    hasValue(data.social_media)
  );
};

const getCacheKeys = (requestedSlug, data) => {
  const keys = [
    requestedSlug,
    data?.basic?.slug,
    data?.basic?.uuid,
    data?.basic?.id,
    data?.slug,
    data?.uuid,
    data?.id,
  ]
    .map(normalizeKey)
    .filter(Boolean);

  return [...new Set(keys)];
};

export const fetchUserProfile = createAsyncThunk(
  "userProfile/fetchUserProfile",
  async (input, { rejectWithValue, signal }) => {
    const slug = getSlug(input);

    if (!slug) {
      return rejectWithValue({
        slug: "",
        message: "Profile slug is missing",
      });
    }

    try {
      const encoded = encodeURIComponent(slug);
      const profileEndpoint =
        slug.toLowerCase() === "me"
          ? "/api/me/profile"
          : `/api/users/${encoded}/profile`;

      const profilePayload = await fetchJson(profileEndpoint, {
        withAuth: true,
        skipMemoryCache: getForce(input),
        cache: "no-store",
        signal,
      });

      const data = normalizeProfilePayload(profilePayload);

      return {
        slug,
        keys: getCacheKeys(slug, data),
        data,
      };
    } catch (error) {
      return rejectWithValue({
        slug,
        message: error?.message || "Failed to fetch user profile",
      });
    }
  },
  {
    condition: (input, { getState }) => {
      const slug = getSlug(input);
      if (!slug) return false;

      const state = getState()?.userProfile;
      const block = state?.bySlug?.[slug] || EMPTY_PROFILE_BLOCK;

      if (block.status === "succeeded" && !hasUsefulProfileData(block.data)) {
        return true;
      }

      return shouldFetchBlock(block, getForce(input), REQUEST_CACHE_TTL_MS);
    },
  }
);

const initialState = {
  bySlug: {},
};

const userProfileSlice = createSlice({
  name: "userProfile",
  initialState,
  reducers: {
    clearUserProfileCache: (state) => {
      state.bySlug = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state, action) => {
        const slug = getSlug(action.meta.arg);
        if (!slug) return;

        if (!state.bySlug[slug]) {
          state.bySlug[slug] = createProfileBlock();
        }

        state.bySlug[slug].status = "loading";
        state.bySlug[slug].error = "";
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        const slug = getSlug(action.payload?.slug);
        if (!slug) return;

        const block = {
          status: "succeeded",
          error: "",
          loadedAt: Date.now(),
          data: action.payload?.data || {},
        };

        const keys = action.payload?.keys?.length
          ? action.payload.keys
          : [slug];

        keys.forEach((key) => {
          const normalizedKey = normalizeKey(key);
          if (normalizedKey) {
            state.bySlug[normalizedKey] = block;
          }
        });
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        const rejectedSlug =
          getSlug(action.payload?.slug) || getSlug(action.meta.arg);

        if (!rejectedSlug) return;

        if (!state.bySlug[rejectedSlug]) {
          state.bySlug[rejectedSlug] = createProfileBlock();
        }

        state.bySlug[rejectedSlug].status = "failed";
        state.bySlug[rejectedSlug].error =
          action.payload?.message ||
          action.error?.message ||
          "Failed to fetch user profile";
      });
  },
});

export const { clearUserProfileCache } = userProfileSlice.actions;

export const selectUserProfileBlock = (state, slug) => {
  const key = normalizeKey(slug);
  return state.userProfile?.bySlug?.[key] || EMPTY_PROFILE_BLOCK;
};

export const selectUserProfileData = (state, slug) => {
  const key = normalizeKey(slug);
  return state.userProfile?.bySlug?.[key]?.data || null;
};

export const selectUserProfileStatus = (state, slug) => {
  const key = normalizeKey(slug);
  return state.userProfile?.bySlug?.[key]?.status || "idle";
};

export const selectUserProfileError = (state, slug) => {
  const key = normalizeKey(slug);
  return state.userProfile?.bySlug?.[key]?.error || "";
};

export default userProfileSlice.reducer;