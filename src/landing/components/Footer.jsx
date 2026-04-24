import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import {
  fetchMainHeaderData,
  fetchModuleHeaderData,
  selectDepartmentsById,
  selectMainHeader,
  selectModuleHeader,
} from "../../redux/headerSlice";
import { fetchFooterData, selectFooter } from "../../redux/footerSlice";

const SITE_BASE = window.location.origin.replace(/\/+$/, "");
const PAGE_BASE = `${SITE_BASE}/view`;

const KNOWN_DIRECT_ROUTES = [
  "/",
  "/login",
  "/dashboard",
  "/announcements",
  "/achievements",
  "/notices",
  "/student-activities",
  "/gallery",
  "/gallery/all-images",
  "/our-recruiters",
  "/success-stories",
  "/courses",
  "/events",
  "/faculty-members",
  "/technical-assistants",
  "/placement-officers",
  "/placed-students",
  "/alumni",
  "/program-toppers",
  "/tp-cell",
  "/placement-notices",
  "/statistics",
  "/contact-us",
  "/enquiry",
  "/career-notices",
  "/why-us",
  "/scholarships",
];

const PLACEHOLDER_LOGO =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <rect width="120" height="120" rx="60" fill="rgba(255,255,255,.14)"/>
      <circle cx="60" cy="52" r="18" fill="rgba(255,255,255,.35)"/>
      <path d="M28 98c8-18 22-26 32-26s24 8 32 26" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="6" stroke-linecap="round"/>
    </svg>
  `);

const getValue = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
};

const decodeHtmlEntities = (value) => {
  try {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = String(value ?? "");
    return textarea.value;
  } catch {
    return String(value ?? "");
  }
};

const safeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    const raw = value.trim();
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      try {
        const parsed = JSON.parse(decodeHtmlEntities(raw));
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
  }
  return [];
};

const safeObject = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      try {
        return JSON.parse(decodeHtmlEntities(value));
      } catch {
        return null;
      }
    }
  }
  return null;
};

const normalizeUrl = (value) => {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^(data:|blob:|https?:\/\/|mailto:|tel:|sms:|whatsapp:)/i.test(url)) return url;
  if (url.startsWith("/")) return `${window.location.origin}${url}`;
  return `${window.location.origin}/${url}`;
};

const normalizeInternalPageUrl = (identifier) => {
  const value = String(identifier || "").trim();
  if (!value) return "#";
  if (value.startsWith("/")) return `${SITE_BASE}${value}`;
  return `${PAGE_BASE}/${encodeURIComponent(value)}`;
};

const firstNonEmptyArray = (...candidates) => {
  for (const candidate of candidates) {
    const arr = safeArray(candidate);
    if (arr.length) return arr;
  }
  return [];
};

const sortByPosition = (items = []) =>
  [...items].sort((a, b) => Number(a?.position || 0) - Number(b?.position || 0));

const isKnownDirectRoute = (path) => {
  const p = String(path || "")
    .replace(/\/+$/, "")
    .toLowerCase();

  if (!p || p === "/") return true;
  if (KNOWN_DIRECT_ROUTES.includes(p)) return true;

  if (
    /^\/(courses|department|curriculum-syllabus|announcements|achievements|notices|student-activities|gallery|placed-students|placement-notices|successful-entrepreneurs|career-notices|why-us|scholarships|success-stories)\/view\/[^/]+$/i.test(
      p
    )
  ) {
    return true;
  }

  if (p.startsWith("/user/")) return true;
  if (p.startsWith("/department/")) return true;

  return false;
};

const isSameOrigin = (url) => {
  try {
    return new URL(url, window.location.origin).origin === window.location.origin;
  } catch {
    return false;
  }
};

const isSpecialProtocol = (url) =>
  /^(mailto:|tel:|sms:|whatsapp:)/i.test(String(url || "").trim());

const isExternalAbsoluteUrl = (url) =>
  /^https?:\/\//i.test(String(url || "").trim()) &&
  !String(url || "").trim().startsWith(window.location.origin);

const resolveLinkUrl = (rawUrl) => {
  const value = String(rawUrl || "").trim();
  if (!value) return "";

  if (/^https?:\/\//i.test(value)) return value;
  if (/^(mailto:|tel:|sms:|whatsapp:|data:|blob:)/i.test(value)) return value;
  if (value.startsWith("/")) return `${window.location.origin}${value}`;

  return `${window.location.origin}/${value}`;
};

const isDirectLink = (rawUrl) => {
  const value = String(rawUrl || "").trim();
  if (!value) return false;

  if (/^https?:\/\//i.test(value)) return true;
  if (/^(mailto:|tel:|sms:|whatsapp:)/i.test(value)) return true;
  if (value.toLowerCase().startsWith("/page/")) return true;
  if (value.toLowerCase().startsWith("/view/")) return true;

  let path = value;
  if (!path.startsWith("/")) path = `/${path}`;
  const cleanPath = path.split("?")[0].split("#")[0].replace(/\/+$/, "").toLowerCase();

  if (isKnownDirectRoute(cleanPath)) return true;
  if (cleanPath.split("/").filter(Boolean).length >= 2) return true;

  return false;
};

const getNodeLink = (item) =>
  getValue(item?.page_url, item?.pageUrl, item?.url_full, item?.link, item?.url, item?.href, item?.path);

const getNodePageSlug = (item) => getValue(item?.page_slug, item?.pageSlug);
const getNodeMenuSlug = (item) => getValue(item?.slug);
const getNodeShortcode = (item) =>
  getValue(item?.shortcode, item?.page_shortcode, item?.pageShortcode, item?.short_code);

const findBestTarget = (item) => {
  if (!item) return { type: "", value: "" };

  const link = getNodeLink(item);
  if (link && link !== "#") return { type: "link", value: link };

  const pageSlug = getNodePageSlug(item);
  if (pageSlug) return { type: "page_slug", value: pageSlug };

  const menuSlug = getNodeMenuSlug(item);
  if (menuSlug) return { type: "menu_slug", value: menuSlug };

  const shortcode = getNodeShortcode(item);
  if (shortcode) return { type: "shortcode", value: shortcode };

  const kids = Array.isArray(item.children) ? sortByPosition(item.children) : [];
  for (const child of kids) {
    const found = findBestTarget(child);
    if (found?.value) return found;
  }

  return { type: "", value: "" };
};

const getItemDeptSlug = (item, deptMap) => {
  const direct = getValue(
    item?.department?.slug,
    item?.department_slug,
    item?.departmentSlug,
    item?.dept_slug,
    item?.deptSlug
  );
  if (direct) return direct;

  const departmentId = Number(item?.department_id ?? item?.departmentId ?? 0);
  if (!departmentId) return "";

  const department = deptMap.get(departmentId);
  if (!department) return "";

  return getValue(
    department?.slug,
    department?.department_slug,
    department?.short_name,
    department?.shortName
  );
};

const applyDepartmentSlug = (url, slug) => {
  const value = String(slug || "").trim();
  if (!value || !url || url === "#") return url;

  try {
    const target = new URL(url, window.location.origin);
    if (target.origin !== window.location.origin) return url;

    const raw = (target.search || "").replace(/^\?/, "");
    const parts = raw ? raw.split("&").filter(Boolean) : [];

    const kept = parts.filter((part) => {
      const key = (part.split("=")[0] || "").trim();
      if (!key) return false;
      if (key === "department_uuid") return false;
      if (key === "dept") return false;
      if (key.startsWith("d-")) return false;
      return true;
    });

    kept.push(`dept=${encodeURIComponent(value)}`);
    target.search = `?${kept.join("&")}`;

    return target.toString();
  } catch {
    const joiner = url.includes("?") ? "&" : "?";
    return `${url}${joiner}dept=${encodeURIComponent(value)}`;
  }
};

const getFooterMenuItemUrl = (item, deptMap) => {
  const target = findBestTarget(item);
  let url = "#";

  if (target.type === "link") {
    const rawLink = target.value;

    if (isSpecialProtocol(rawLink)) return rawLink;
    if (isExternalAbsoluteUrl(rawLink)) return rawLink;

    if (rawLink.startsWith("/")) {
      url = resolveLinkUrl(rawLink) || "#";
    } else if (isDirectLink(rawLink)) {
      url = resolveLinkUrl(rawLink) || "#";
    } else {
      url = normalizeInternalPageUrl(rawLink);
    }
  } else if (target.type === "page_slug") {
    url = normalizeInternalPageUrl(target.value);
  } else if (target.type === "menu_slug") {
    url = normalizeInternalPageUrl(target.value);
  } else if (target.type === "shortcode") {
    url = normalizeInternalPageUrl(target.value);
  }

  if (!url || url === "#") return "#";

  if (isSameOrigin(url)) {
    const deptSlug = getItemDeptSlug(item, deptMap);
    url = applyDepartmentSlug(url, deptSlug);
  }

  return url;
};

const getFooterFlatLinkUrl = (item, deptMap) => {
  const href = getFooterMenuItemUrl(item, deptMap);
  if (href && href !== "#") return href;

  const raw = getValue(item?.url_full, item?.url, item?.link, item?.href, item?.path);
  return raw ? normalizeUrl(raw) : "#";
};

const iconFromPlatform = (platform) => {
  const value = String(platform || "").toLowerCase().trim();
  if (value.includes("youtube")) return "fa-brands fa-youtube";
  if (value.includes("linkedin")) return "fa-brands fa-linkedin-in";
  if (value.includes("facebook")) return "fa-brands fa-facebook-f";
  if (value.includes("instagram")) return "fa-brands fa-instagram";
  if (value.includes("twitter") || value.includes("x.com") || value === "x") {
    return "fa-brands fa-x-twitter";
  }
  if (value.includes("github")) return "fa-brands fa-github";
  return "fa-solid fa-link";
};

function Footer({ onLoadComplete }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [rotateIndex, setRotateIndex] = useState(0);
  const [rotateFading, setRotateFading] = useState(false);

  const { item: headerItem, status: headerStatus } = useSelector(selectMainHeader);
  const { menus: headerMenus, status: menuStatus } = useSelector(selectModuleHeader);
  const departmentsById = useSelector(selectDepartmentsById);
  const { item: footerItem, status: footerStatus } = useSelector(selectFooter);

  const loading = footerStatus === "idle" || footerStatus === "loading";

  useEffect(() => {
    if (headerStatus === "idle") {
      dispatch(fetchMainHeaderData());
    }

    if (menuStatus === "idle") {
      dispatch(fetchModuleHeaderData());
    }

    if (footerStatus === "idle") {
      dispatch(fetchFooterData());
    }
  }, [dispatch, headerStatus, menuStatus, footerStatus]);

  useEffect(() => {
    if (!loading) {
      onLoadComplete?.();
    }
  }, [loading, onLoadComplete]);

  const deptMap = useMemo(() => {
    const map = new Map();

    Object.values(departmentsById || {}).forEach((department) => {
      const id = Number(department?.id);
      if (Number.isFinite(id) && id > 0) {
        map.set(id, department);
      }
    });

    return map;
  }, [departmentsById]);

  const menuMap = useMemo(() => {
    const map = new Map();

    const indexMenuTree = (items) => {
      (items || []).forEach((menu) => {
        const id = Number(menu?.id);
        if (!Number.isFinite(id) || id <= 0) return;

        map.set(id, {
          ...menu,
          title: getValue(menu?.title, menu?.name, menu?.label, menu?.menu_title),
          page_slug: getValue(menu?.page_slug, menu?.pageSlug),
          page_url: getValue(menu?.page_url, menu?.pageUrl),
          department_slug: getValue(menu?.department_slug, menu?.departmentShortcode),
          department_id: menu?.department_id ?? menu?.departmentId ?? null,
          children: Array.isArray(menu?.children) ? menu.children : [],
        });

        if (Array.isArray(menu?.children) && menu.children.length) {
          indexMenuTree(menu.children);
        }
      });
    };

    indexMenuTree(headerMenus);
    return map;
  }, [headerMenus]);

  const metadata = useMemo(() => safeObject(footerItem?.metadata) || {}, [footerItem]);

  const topLinks = useMemo(
    () =>
      safeArray(
        footerItem?.section1_menu ??
          footerItem?.section1_menu_json ??
          metadata?.section1_menu ??
          metadata?.section1_menu_json ??
          []
      ),
    [footerItem, metadata]
  );

  const section2Blocks = useMemo(
    () =>
      safeArray(
        footerItem?.section2_header_menus_resolved ??
          metadata?.section2_header_menus_resolved ??
          footerItem?.section2_header_menu_json ??
          footerItem?.section2_header_menus ??
          metadata?.section2_header_menu_json ??
          metadata?.section2_header_menus ??
          []
      ),
    [footerItem, metadata]
  );

  const middleLinks = useMemo(
    () =>
      safeArray(
        footerItem?.section3_menu ??
          footerItem?.section3_menu_json ??
          metadata?.section3_menu ??
          metadata?.section3_menu_json ??
          []
      ),
    [footerItem, metadata]
  );

  const bottomLinks = useMemo(
    () =>
      safeArray(
        footerItem?.section5_menu ??
          footerItem?.section5_menu_json ??
          metadata?.section5_menu ??
          metadata?.section5_menu_json ??
          []
      ),
    [footerItem, metadata]
  );

  const socialLinks = useMemo(
    () => safeArray(footerItem?.social_links ?? footerItem?.social_links_json ?? []),
    [footerItem]
  );

  const section2RenderedBlocks = useMemo(() => {
    const blocks = safeArray(section2Blocks)
      .slice(0, 4)
      .map((block) => {
        const hasTitle = getValue(block?.title, block?.menu_title, block?.name, block?.label);
        const kids = firstNonEmptyArray(block?.submenus, block?.children, block?.childs);
        const headerMenuId = Number(block?.header_menu_id ?? block?.menu_id ?? block?.id ?? 0);

        if (hasTitle && kids.length) {
          return {
            title: hasTitle,
            headerMenuId,
            childIdSet: null,
            kids,
          };
        }

        const childIds = new Set(
          safeArray(block?.child_ids ?? block?.children_ids ?? block?.submenu_ids ?? [])
            .map((x) => Number(x))
            .filter((x) => Number.isFinite(x))
        );

        return {
          title: "",
          headerMenuId,
          childIdSet: childIds,
          kids: null,
        };
      })
      .filter((block) => Number.isFinite(block.headerMenuId) && block.headerMenuId > 0)
      .map((block) => {
        const menu = menuMap.get(block.headerMenuId) || null;

        const resolvedTitle =
          block.title ||
          ((footerItem?.section2_title_override || "").trim() &&
          safeArray(section2Blocks).length === 1
            ? String(footerItem?.section2_title_override).trim()
            : "") ||
          getValue(menu?.title, menu?.name, menu?.label) ||
          "Menu";

        let kids = block.kids;
        if (!kids) {
          const rawKids = firstNonEmptyArray(menu?.children, menu?.submenus, menu?.childs);
          if (block.childIdSet && block.childIdSet.size) {
            kids = rawKids.filter((child) => block.childIdSet.has(Number(child?.id)));
          } else {
            kids = rawKids;
          }
        }

        const enrichedKids = (kids || []).map((child) => {
          const childId = Number(child?.id);
          if (childId && menuMap.has(childId)) {
            const fullItem = menuMap.get(childId);
            return {
              ...fullItem,
              ...child,
              page_slug: fullItem?.page_slug || child?.page_slug || "",
              page_url: child?.page_url !== undefined ? child.page_url : fullItem?.page_url,
              department_slug:
                child?.department_slug || fullItem?.department_slug || "",
              department_id: child?.department_id ?? fullItem?.department_id,
            };
          }
          return child;
        });

        return {
          title: resolvedTitle,
          kids: enrichedKids,
        };
      });

    return blocks;
  }, [section2Blocks, footerItem, menuMap]);

  const brandLogo = useMemo(() => {
    const sameAsHeader = Boolean(footerItem?.same_as_header ?? footerItem?.is_same_as_header ?? false);
    if (sameAsHeader) {
      return getValue(
        headerItem?.primaryLogo,
        footerItem?.brand_logo_full_url,
        footerItem?.brand_logo_url
      );
    }
    return getValue(footerItem?.brand_logo_full_url, footerItem?.brand_logo_url);
  }, [footerItem, headerItem]);

  const brandTitle = useMemo(() => {
    const sameAsHeader = Boolean(footerItem?.same_as_header ?? footerItem?.is_same_as_header ?? false);
    if (sameAsHeader) {
      return getValue(headerItem?.headerText, footerItem?.brand_title, footerItem?.footer_title);
    }
    return getValue(footerItem?.brand_title, footerItem?.footer_title);
  }, [footerItem, headerItem]);

  const rotateLines = useMemo(() => {
    const sameAsHeader = Boolean(footerItem?.same_as_header ?? footerItem?.is_same_as_header ?? false);
    if (sameAsHeader) {
      return safeArray(headerItem?.rotatingTexts || []);
    }
    return safeArray(footerItem?.rotating_text_json || []);
  }, [footerItem, headerItem]);

  const copyrightText = useMemo(
    () =>
      getValue(
        footerItem?.copyright_text,
        metadata?.copyright_text,
        metadata?.copyright
      ),
    [footerItem, metadata]
  );

  const addressText = useMemo(
    () =>
      getValue(
        footerItem?.address_text,
        metadata?.address_text,
        metadata?.address,
        metadata?.address_line
      ),
    [footerItem, metadata]
  );

  useEffect(() => {
    setRotateIndex(0);
    setRotateFading(false);
  }, [footerItem?.id, rotateLines.length]);

  useEffect(() => {
    if (!rotateLines.length) return undefined;
    if (rotateLines.length === 1) {
      setRotateIndex(0);
      return undefined;
    }

    const timer = window.setInterval(() => {
      setRotateFading(true);

      window.setTimeout(() => {
        setRotateIndex((prev) => (prev + 1) % rotateLines.length);
        setRotateFading(false);
      }, 180);
    }, 2600);

    return () => window.clearInterval(timer);
  }, [rotateLines]);

  const hardNavigate = (event, href, openNewTab = false) => {
    if (!href || href === "#") {
      event?.preventDefault?.();
      return;
    }

    if (
      event &&
      (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button === 1)
    ) {
      return;
    }

    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (openNewTab) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }

    if (isSpecialProtocol(href)) {
      window.location.href = href;
      return;
    }

    try {
      const target = new URL(href, window.location.origin);

      if (target.origin === window.location.origin) {
        navigate(`${target.pathname}${target.search}${target.hash}`);
        return;
      }

      window.location.href = target.href;
    } catch {
      window.location.href = href;
    }
  };

  const renderInlineLinks = (links, alignLeft = false) => {
    const clean = (Array.isArray(links) ? links : [])
      .map((link) => {
        const title = getValue(link?.title, link?.label, link?.name);
        const url = getValue(link?.url_full, link?.url, link?.link, link?.href, link?.path);
        if (!title) return null;
        return { ...link, title, url };
      })
      .filter(Boolean);

    if (!clean.length) return null;

    return (
      <div
        className={[
          "flex flex-wrap gap-x-[1.35rem] gap-y-[10px] py-[6px]",
          alignLeft ? "justify-start max-[780px]:justify-center" : "justify-center",
          "max-[780px]:text-center",
        ].join(" ")}
      >
        {clean.map((item, index) => {
          const href = getFooterFlatLinkUrl(item, deptMap);
          const isExternal = href && isExternalAbsoluteUrl(href);

          return (
            <a
              key={`${item.title}-${index}`}
              href={href || "javascript:void(0)"}
              onClick={(event) => {
                if (!href || href === "#") {
                  event.preventDefault();
                  return;
                }

                if (!isExternal && !isSpecialProtocol(href)) {
                  hardNavigate(event, href, false);
                }
              }}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              className={[
                "border-b-2 border-transparent pb-[2px] text-[.95rem] leading-[1.25] text-white transition",
                !href || href === "#"
                  ? "pointer-events-none opacity-90"
                  : "hover:border-[#E2B13C] hover:text-[#F2C94C]",
              ].join(" ")}
            >
              {item.title}
            </a>
          );
        })}
      </div>
    );
  };

  return (
    <footer className="w-full bg-[var(--primary-color)] text-white">
      <div className="mx-auto max-w-[1280px] px-4 pb-[18px] pt-[22px]">
        {loading ? (
          <>
            <div className="min-h-[24px] animate-pulse rounded-[10px] bg-white/10" />
            <hr className="my-[18px] border-0 border-t border-white/70" />

            <div className="grid grid-cols-4 gap-x-[34px] gap-y-[18px] max-[1100px]:grid-cols-2 max-[780px]:grid-cols-1">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="max-[780px]:text-center">
                  <div className="h-8 w-[220px] animate-pulse rounded-[10px] bg-white/10 max-[780px]:mx-auto" />
                  <div className="mt-2 h-[120px] animate-pulse rounded-[14px] bg-white/10" />
                </div>
              ))}
            </div>

            <hr className="my-[18px] border-0 border-t border-white/70" />
            <div className="min-h-[24px] animate-pulse rounded-[10px] bg-white/10" />

            <hr className="my-[18px] border-0 border-t border-white/70" />
            <div className="flex items-center justify-between gap-[18px] max-[780px]:flex-col max-[780px]:items-center max-[780px]:text-center">
              <div className="flex min-w-0 items-center gap-[14px] max-[780px]:flex-col max-[780px]:items-center">
                <div className="h-[120px] w-[120px] animate-pulse rounded-full bg-white/10" />
                <div className="flex min-w-0 flex-col gap-1 max-[780px]:items-center">
                  <div className="h-[34px] w-[520px] max-w-[72vw] animate-pulse rounded-[10px] bg-white/10" />
                  <div className="h-6 w-[520px] max-w-[72vw] animate-pulse rounded-[10px] bg-white/10" />
                </div>
              </div>
            </div>

            <hr className="my-[18px] border-0 border-t border-white/70" />
          </>
        ) : null}

        {!loading ? renderInlineLinks(topLinks, false) : null}
        <hr className="my-[18px] border-0 border-t border-white/70" />

        <div className="grid grid-cols-4 gap-x-[34px] gap-y-[18px] max-[1100px]:grid-cols-2 max-[780px]:grid-cols-1">
          {section2RenderedBlocks.map((block, index) => (
            <div key={`${block.title}-${index}`} className="min-w-0 max-[780px]:text-center">
              <div className="relative mb-3 inline-block text-[1.08rem] font-bold leading-[1.2] after:absolute after:bottom-[-6px] after:left-0 after:h-[3px] after:w-14 after:rounded-[6px] after:bg-[#E2B13C] after:content-[''] max-[780px]:after:left-1/2 max-[780px]:after:-translate-x-1/2">
                {block.title}
              </div>

              <div className="flex flex-col gap-[12px]">
                {(block.kids || []).map((child, childIndex) => {
                  const label = getValue(
                    child?.title,
                    child?.name,
                    child?.label,
                    child?.menu_title
                  );
                  if (!label) return null;

                  const href = getFooterMenuItemUrl(child, deptMap);
                  const isExternal = href && isExternalAbsoluteUrl(href);

                  return (
                    <a
                      key={`${block.title}-${label}-${childIndex}`}
                      href={href || "javascript:void(0)"}
                      onClick={(event) => {
                        if (!href || href === "#") {
                          event.preventDefault();
                          return;
                        }
                        if (!isExternal && !isSpecialProtocol(href)) {
                          hardNavigate(event, href, false);
                        }
                      }}
                      target={isExternal ? "_blank" : undefined}
                      rel={isExternal ? "noopener noreferrer" : undefined}
                      className={[
                        "break-words text-[.93rem] leading-[1.25] text-white transition max-[780px]:text-center",
                        !href || href === "#"
                          ? "pointer-events-none opacity-90"
                          : "opacity-95 hover:translate-x-[2px] hover:opacity-100 max-[780px]:hover:translate-x-0",
                      ].join(" ")}
                    >
                      {label}
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <hr className="my-[18px] border-0 border-t border-white/70" />
        {!loading ? renderInlineLinks(middleLinks, true) : null}

        <hr className="my-[18px] border-0 border-t border-white/70" />

        <div className="flex items-center justify-between gap-[18px] max-[780px]:flex-col max-[780px]:items-center max-[780px]:text-center">
          <div className="flex min-w-0 items-center gap-[14px] max-[780px]:flex-col max-[780px]:items-center">
            <img loading="lazy" decoding="async"
              src={normalizeUrl(brandLogo) || PLACEHOLDER_LOGO}
              alt="Brand logo"
              className="h-[120px] w-[120px] shrink-0 rounded-full bg-white/12 p-[6px] object-cover"
            />

            <div className="flex min-w-0 flex-col gap-1 max-[780px]:items-center">
              <h3 className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-[1.35rem] font-extrabold leading-[1.15] max-[780px]:whitespace-normal max-[780px]:text-center">
                {brandTitle}
              </h3>

              <p
                className={[
                  "m-0 text-[.98rem] leading-[1.25] text-white/90 transition",
                  rotateFading ? "opacity-0 -translate-y-[2px]" : "opacity-100 translate-y-0",
                  "max-[780px]:mt-2 max-[780px]:whitespace-normal max-[780px]:text-center",
                ].join(" ")}
              >
                {rotateLines.length ? rotateLines[rotateIndex] : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-[14px] max-[780px]:mt-2 max-[780px]:w-full max-[780px]:justify-center">
            {socialLinks.map((social, index) => {
              const href = normalizeUrl(
                getValue(social?.url_full, social?.url, social?.link, social?.href)
              );
              if (!href) return null;

              return (
                <a
                  key={`${href}-${index}`}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={getValue(social?.platform, social?.title, social?.label, "social")}
                  className="inline-flex h-[35px] w-[35px] items-center justify-center border-2 border-[#F2C94C] bg-transparent text-[#F2C94C] transition hover:bg-[#F2C94C] hover:drop-shadow-[0_8px_18px_rgba(0,0,0,.12)]"
                >
                  <i
                    className={`${getValue(social?.icon) || iconFromPlatform(social?.platform)} text-[17px] leading-none`}
                  />
                </a>
              );
            })}
          </div>
        </div>

        <hr className="my-[18px] border-0 border-t border-white/70" />

        <div className="flex items-start justify-between gap-4 max-[780px]:flex-col max-[780px]:items-center max-[780px]:text-center">
          <div className="flex flex-wrap items-center gap-x-[18px] gap-y-[10px] max-[780px]:justify-center">
            {bottomLinks.map((link, index) => {
              const title = getValue(link?.title, link?.label, link?.name);
              const href = getFooterFlatLinkUrl(link, deptMap);
              const isExternal = href && isExternalAbsoluteUrl(href);

              return (
                <span key={`${title}-${index}`} className="flex items-center gap-2">
                  <a
                    href={href || "javascript:void(0)"}
                    onClick={(event) => {
                      if (!href || href === "#") {
                        event.preventDefault();
                        return;
                      }
                      if (!isExternal && !isSpecialProtocol(href)) {
                        hardNavigate(event, href, false);
                      }
                    }}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    className={[
                      "border-b-2 border-transparent pb-[2px] text-[.95rem] leading-[1.25] text-white transition",
                      !href || href === "#"
                        ? "pointer-events-none opacity-90"
                        : "hover:border-[#E2B13C] hover:text-[#F2C94C]",
                    ].join(" ")}
                  >
                    {title}
                  </a>

                  {index < bottomLinks.length - 1 ? (
                    <span className="mx-1 opacity-85">|</span>
                  ) : null}
                </span>
              );
            })}
          </div>

          <div className="whitespace-nowrap text-right text-[.95rem] leading-[1.25] text-white/90 max-[780px]:whitespace-normal max-[780px]:text-center">
            {copyrightText}
          </div>
        </div>

        {addressText ? (
          <div className="mt-[10px] text-[.95rem] leading-[1.35] text-white max-[780px]:text-center">
            {addressText}
          </div>
        ) : null}
      </div>
    </footer>
  );
}

export default Footer;