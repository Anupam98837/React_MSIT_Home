const ORIGIN = typeof window !== "undefined" ? window.location.origin : "";

const SECTION_PATH_MAP = {
  career_notices: "career-notices",
  "career-notices": "career-notices",

  why_us: "why-us",
  "why-us": "why-us",

  scholarships: "scholarships",

  placement_notices: "placement-notices",
  "placement-notices": "placement-notices",

  student_activities: "student-activities",
  "student-activities": "student-activities",
};

const CONTENT_VIEW_SECTIONS = new Set([
  "career-notices",
  "why-us",
  "scholarships",
  "placement-notices",
  "student-activities",
  "achievements",
  "announcements",
  "notices",
  "gallery",
  "placed-students",
  "successful-entrepreneurs",
  "success-stories",
]);

const RESERVED_CHILD_SEGMENTS = new Set([
  "view",
  "create",
  "edit",
  "manage",
  "list",
  "index",
]);

const getCanonicalSection = (value) => {
  const raw = String(value || "").trim().replace(/^\/+|\/+$/g, "");
  if (!raw) return "";
  return SECTION_PATH_MAP[raw.toLowerCase()] || raw;
};

const normalizePathnameSections = (pathname) => {
  const raw = String(pathname || "").trim();
  if (!raw) return "";

  const cleaned = raw.startsWith("/") ? raw : `/${raw}`;
  const segments = cleaned.split("/");

  const normalized = segments.map((segment, index) => {
    if (index === 0) return segment;
    return getCanonicalSection(segment);
  });

  return normalized.join("/").replace(/\/{2,}/g, "/");
};

const canonicalizeContentDetailPath = (pathname) => {
  const normalized = normalizePathnameSections(pathname);
  if (!normalized) return "";

  const segments = normalized.split("/").filter(Boolean);
  if (segments.length !== 2) return normalized;

  const [section, identifier] = segments;
  const canonicalSection = getCanonicalSection(section);
  const child = String(identifier || "").trim();

  if (!CONTENT_VIEW_SECTIONS.has(canonicalSection)) return normalized;
  if (!child) return normalized;
  if (RESERVED_CHILD_SEGMENTS.has(child.toLowerCase())) return normalized;

  return `/${canonicalSection}/view/${child}`;
};

const normalizeRelativeContentPath = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (/^(https?:\/\/|mailto:|tel:|sms:|whatsapp:|data:|blob:|#)/i.test(raw)) {
    return raw;
  }

  const hashIndex = raw.indexOf("#");
  const beforeHash = hashIndex >= 0 ? raw.slice(0, hashIndex) : raw;
  const hash = hashIndex >= 0 ? raw.slice(hashIndex) : "";

  const queryIndex = beforeHash.indexOf("?");
  const pathname = queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash;
  const search = queryIndex >= 0 ? beforeHash.slice(queryIndex) : "";

  const normalizedPath = canonicalizeContentDetailPath(pathname);
  return `${normalizedPath}${search}${hash}`;
};

export const getValue = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
};

export const normalizeContentBasePath = (value) => {
  return normalizeRelativeContentPath(value);
};

export const normalizePath = (value) => {
  let path = String(value || "/").trim();
  if (!path.startsWith("/")) path = `/${path}`;
  path = canonicalizeContentDetailPath(path);
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path;
};

export const getCurrentSlugFromPath = (pathname) => {
  const path = normalizePath(pathname);
  if (!path || path === "/") return "__HOME__";

  const simpleView = path.match(/^\/view\/([^/?#]+)/i);
  if (simpleView) {
    return decodeURIComponent(simpleView[1] || "").replace(/^\/+/, "");
  }

  const contentView = path.match(
    /^\/(?:career-notices|career_notices|why_us|why-us|scholarships|placement-notices|placement_notices|student-activities|student_activities|courses|department|curriculum-syllabus|announcements|achievements|notices|gallery|placed-students|successful-entrepreneurs|success-stories)\/view\/([^/?#]+)/i
  );

  if (contentView) {
    return decodeURIComponent(contentView[1] || "").replace(/^\/+/, "");
  }

  const legacyPage = path.match(/^\/page\/([^/?#]+)/i);
  if (legacyPage) {
    return decodeURIComponent(legacyPage[1] || "").replace(/^\/+/, "");
  }

  return "";
};

export const buildViewUrl = (identifier) => {
  const value = String(identifier || "").trim();
  if (!value) return "#";
  return `${ORIGIN}/view/${encodeURIComponent(value)}`;
};

export const buildContentViewUrl = (section, slug) => {
  const cleanedSection = getCanonicalSection(section);
  const cleanedSlug = String(slug || "").trim();

  if (!cleanedSection || !cleanedSlug) return "#";

  return `${ORIGIN}/${cleanedSection}/view/${encodeURIComponent(cleanedSlug)}`;
};

export const resolveLinkUrl = (rawUrl) => {
  const value = String(rawUrl || "").trim();
  if (!value) return "";

  if (/^(mailto:|tel:|sms:|whatsapp:|data:|blob:|#)/i.test(value)) {
    return value;
  }

  try {
    const url = new URL(value, ORIGIN || "http://localhost");

    if (ORIGIN && url.origin === ORIGIN) {
      url.pathname = canonicalizeContentDetailPath(url.pathname);
      return url.toString();
    }

    if (!ORIGIN && url.origin === "http://localhost") {
      return `${canonicalizeContentDetailPath(url.pathname)}${url.search}${url.hash}`;
    }

    return url.toString();
  } catch {
    const normalized = normalizeRelativeContentPath(
      value.startsWith("/") ? value : `/${value}`
    );
    return normalized;
  }
};

export const isSameOrigin = (url) => {
  try {
    return new URL(url, ORIGIN).origin === ORIGIN;
  } catch {
    return false;
  }
};

export const isExternalUrl = (url) => {
  try {
    return new URL(url, ORIGIN).origin !== ORIGIN;
  } catch {
    return false;
  }
};

export const isSpecialProtocol = (url) =>
  /^(mailto:|tel:|sms:|whatsapp:)/i.test(String(url || "").trim());

export const getDeptQueryValue = (item, departmentsById) => {
  const direct = getValue(
    item?.department?.short_name,
    item?.department?.shortName,
    item?.department?.slug,
    item?.department_slug,
    item?.departmentShortcode,
    item?.dept_slug,
    item?.deptSlug
  );

  if (direct) return direct;

  const departmentId = getValue(item?.department_id, item?.departmentId);
  if (!departmentId) return "";

  const department = departmentsById?.[Number(departmentId)];
  if (!department) return "";

  return getValue(department?.short_name, department?.shortName, department?.slug);
};

export const applyDeptQuery = (url, deptValue) => {
  const value = String(deptValue || "").trim();
  if (!value || !url || url === "#" || isSpecialProtocol(url)) return url;

  try {
    const target = new URL(url, ORIGIN);
    if (target.origin !== ORIGIN) return url;

    const params = target.searchParams;
    params.delete("department_uuid");
    params.delete("dept");

    const remove = [];
    params.forEach((_, key) => {
      if (key.startsWith("d-")) remove.push(key);
    });
    remove.forEach((key) => params.delete(key));

    params.set("dept", value);
    target.search = params.toString() ? `?${params.toString()}` : "";
    return target.toString();
  } catch {
    const joiner = url.includes("?") ? "&" : "?";
    return `${url}${joiner}dept=${encodeURIComponent(value)}`;
  }
};