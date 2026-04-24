import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router";
import Overlay from "@/partials/Overlay";
import {
  fetchMainHeaderData,
  fetchModuleHeaderData,
  selectDepartmentsById,
  selectMainHeader,
  selectModuleHeader,
} from "../../redux/headerSlice";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

const ROOTS_PER_COLUMN = 5;

const getValue = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
};

const getCurrentSlug = (pathname) => {
  if (!pathname || pathname === "/") return "__HOME__";
  if (pathname.startsWith("/view/")) {
    return pathname.replace("/view/", "").replace(/^\/+/, "");
  }
  if (pathname.startsWith("/page/")) {
    return pathname.replace("/page/", "").replace(/^\/+/, "");
  }
  return "";
};

const sortByPosition = (items = []) =>
  [...items].sort((a, b) => Number(a?.position || 0) - Number(b?.position || 0));

const chunkArray = (arr = [], size = 5) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const getMegaColumns = (items = []) =>
  chunkArray(sortByPosition(items || []), ROOTS_PER_COLUMN);

const getMegaWidth = (items = []) => {
  const totalItems = Array.isArray(items) ? items.length : 0;
  const columns = Math.max(1, Math.ceil(totalItems / ROOTS_PER_COLUMN));
  const columnWidth = 270;
  return `min(${columns * columnWidth}px, calc(100vw - 32px))`;
};

const collectTrail = (nodes, predicate, chain = []) => {
  for (const node of nodes || []) {
    const nextChain = [...chain, node];
    if (predicate(node)) return nextChain;

    if (node.children?.length) {
      const result = collectTrail(node.children, predicate, nextChain);
      if (result.length) return result;
    }
  }
  return [];
};

const isSameOrigin = (url) => {
  try {
    return new URL(url, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
};

const isExternalUrl = (url) => {
  try {
    return new URL(url, window.location.href).origin !== window.location.origin;
  } catch {
    return false;
  }
};

const isSpecialProtocol = (url) =>
  /^(mailto:|tel:|sms:|whatsapp:)/i.test(String(url || "").trim());

const resolveLinkUrl = (rawUrl) => {
  const value = String(rawUrl || "").trim();
  if (!value) return "";
  try {
    return new URL(value, window.location.href).href;
  } catch {
    return value;
  }
};

const getNodeLink = (item) =>
  getValue(item?.page_url, item?.pageUrl, item?.link, item?.url, item?.href);

const getNodePageSlug = (item) => getValue(item?.page_slug, item?.pageSlug);
const getNodeMenuSlug = (item) => getValue(item?.slug);
const getNodeShortcode = (item) =>
  getValue(item?.shortcode, item?.page_shortcode, item?.pageShortcode, item?.short_code);

const normalizeInternalPageUrl = (identifier) => {
  const value = String(identifier || "").trim();
  if (!value) return "#";
  return `${window.location.origin}/view/${encodeURIComponent(value)}`;
};

const getItemDeptShortcode = (item, departmentsById) => {
  const direct = getValue(
    item?.department?.short_name,
    item?.department?.shortName,
    item?.department?.slug,
    item?.departmentShortcode
  );
  if (direct) return direct;

  const departmentId = getValue(item?.department_id, item?.departmentId);
  if (!departmentId) return "";

  const department = departmentsById?.[Number(departmentId)];
  if (!department) return "";

  return getValue(department?.short_name, department?.shortName, department?.slug);
};

const applyDepartmentShortcode = (url, shortcode) => {
  const value = String(shortcode || "").trim();
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

    kept.push(`dept=${value}`);
    target.search = `?${kept.join("&")}`;

    return target.toString();
  } catch {
    const joiner = url.includes("?") ? "&" : "?";
    return `${url}${joiner}dept=${value}`;
  }
};

const findBestTarget = (item) => {
  if (!item) return { type: "", value: "" };

  const link = getNodeLink(item);
  if (link) return { type: "link", value: link };

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

const getMenuItemUrl = (item, departmentsById) => {
  const target = findBestTarget(item);
  let url = "#";

  if (target.type === "link") {
    url = resolveLinkUrl(target.value) || "#";
    if (isSpecialProtocol(url)) return url;
    if (!isSameOrigin(url)) return url;
  } else if (target.type === "page_slug") {
    url = normalizeInternalPageUrl(target.value);
  } else if (target.type === "menu_slug") {
    url = normalizeInternalPageUrl(target.value);
  } else if (target.type === "shortcode") {
    url = normalizeInternalPageUrl(target.value);
  }

  if (!url || url === "#") return "#";

  if (isSameOrigin(url)) {
    const deptShortcode = getItemDeptShortcode(item, departmentsById);
    url = applyDepartmentShortcode(url, deptShortcode);
  }

  return url;
};

const parseRotatingTextEntries = (...sources) => {
  const result = [];

  const addText = (value) => {
    const text = String(value || "").trim();
    if (text) result.push(text);
  };

  const walk = (value) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }

    if (typeof value === "object") {
      const direct = getValue(
        value?.text,
        value?.title,
        value?.name,
        value?.label,
        value?.value,
        value?.content,
        value?.message
      );

      if (direct) {
        addText(direct);
        return;
      }

      if (Array.isArray(value?.items)) {
        walk(value.items);
        return;
      }

      if (Array.isArray(value?.data)) {
        walk(value.data);
      }

      return;
    }

    if (typeof value === "string") {
      const raw = value.trim();
      if (!raw) return;

      if (
        (raw.startsWith("[") && raw.endsWith("]")) ||
        (raw.startsWith("{") && raw.endsWith("}"))
      ) {
        try {
          walk(JSON.parse(raw));
          return;
        } catch {
          // fall through
        }
      }

      if (raw.includes("\n") || raw.includes("|") || raw.includes(";")) {
        raw
          .split(/\n|\||;/g)
          .map((part) => part.trim())
          .filter(Boolean)
          .forEach(addText);
        return;
      }

      addText(raw);
      return;
    }

    addText(value);
  };

  sources.forEach(walk);

  return [...new Set(result)];
};

function LoadingOverlay({ show, title }) {
  return (
    <Overlay
      show={show}
      title={title}
      subtitle="Loading header menu…"
      hint="Menus are being prepared for this page."
    />
  );
}

function HeaderMenu() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { menus, status } = useSelector(selectModuleHeader);
  const { item: mainHeaderItem, status: mainHeaderStatus } = useSelector(selectMainHeader);
  const departmentsById = useSelector(selectDepartmentsById);

  const rowRef = useRef(null);
  const navRef = useRef(null);
  const closeTimerRef = useRef(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openRootId, setOpenRootId] = useState(null);
  const [densityClass, setDensityClass] = useState("");
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);
  const [showPrevBtn, setShowPrevBtn] = useState(false);
  const [showNextBtn, setShowNextBtn] = useState(false);
  const [menuReady, setMenuReady] = useState(false);
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [megaOpenPath, setMegaOpenPath] = useState([]);
  const [isMobileStickyActive, setIsMobileStickyActive] = useState(false);
  const [rotatingIndex, setRotatingIndex] = useState(0);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchModuleHeaderData());
    }
  }, [dispatch, status]);

  useEffect(() => {
    if (mainHeaderStatus === "idle") {
      dispatch(fetchMainHeaderData());
    }
  }, [dispatch, mainHeaderStatus]);

  useEffect(() => {
    if (window.innerWidth >= 992) setDrawerOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const updateStickyState = () => {
      if (window.innerWidth >= 992) {
        setIsMobileStickyActive(false);
        return;
      }

      const navEl = navRef.current;
      if (!navEl) return;

      const rect = navEl.getBoundingClientRect();
      setIsMobileStickyActive(rect.top <= 0.5);
    };

    updateStickyState();

    window.addEventListener("scroll", updateStickyState, { passive: true });
    window.addEventListener("resize", updateStickyState, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateStickyState);
      window.removeEventListener("resize", updateStickyState);
    };
  }, []);

  const currentSlug = useMemo(() => getCurrentSlug(location.pathname), [location.pathname]);
  const isHome = currentSlug === "__HOME__";

  const sortedMenus = useMemo(() => sortByPosition(menus || []), [menus]);

  const mobileBrandTitle = useMemo(() => {
    return getValue(mainHeaderItem?.headerText) || "Meghnad Saha Institute of Technology";
  }, [mainHeaderItem?.headerText]);

  const mobileBrandLogo = useMemo(() => {
    return getValue(mainHeaderItem?.primaryLogo, mainHeaderItem?.secondaryLogo);
  }, [mainHeaderItem?.primaryLogo, mainHeaderItem?.secondaryLogo]);

  const mobileRotatingTexts = useMemo(() => {
    return parseRotatingTextEntries(
      mainHeaderItem?.rotatingTexts,
      mainHeaderItem?.rotating_texts,
      mainHeaderItem?.rotatingText,
      mainHeaderItem?.rotating_text,
      mainHeaderItem?.headerRotatingTexts,
      mainHeaderItem?.header_rotating_texts,
      mainHeaderItem?.headerTextRotate,
      mainHeaderItem?.header_text_rotate,
      mainHeaderItem?.marqueeTexts,
      mainHeaderItem?.marquee_texts,
      mainHeaderItem?.rotatingMessages,
      mainHeaderItem?.rotating_messages
    );
  }, [mainHeaderItem]);

  useEffect(() => {
    setRotatingIndex(0);
  }, [mobileRotatingTexts]);

  useEffect(() => {
    if (mobileRotatingTexts.length <= 1) return;

    const timer = window.setInterval(() => {
      setRotatingIndex((prev) => (prev + 1) % mobileRotatingTexts.length);
    }, 2400);

    return () => window.clearInterval(timer);
  }, [mobileRotatingTexts]);

  const currentMobileRotatingText =
    mobileRotatingTexts[rotatingIndex] || mobileRotatingTexts[0] || "";

  const activeTrail = useMemo(() => {
    if (isHome) return [];

    return collectTrail(
      sortedMenus,
      (node) => {
        const keys = [
          getValue(node?.page_slug, node?.pageSlug),
          getValue(node?.slug),
          getValue(node?.shortcode, node?.page_shortcode, node?.pageShortcode, node?.short_code),
        ]
          .map((x) => String(x || "").trim())
          .filter(Boolean);

        return keys.includes(currentSlug);
      },
      []
    );
  }, [sortedMenus, currentSlug, isHome]);

  const activeIds = useMemo(() => new Set(activeTrail.map((item) => item.id)), [activeTrail]);

  useEffect(() => {
    setExpandedIds(new Set(activeTrail.map((item) => item.id)));
  }, [activeTrail]);

  useEffect(() => {
    setOpenRootId(null);
    setMegaOpenPath([]);
  }, [location.pathname, location.search]);

  useEffect(() => {
    setMenuReady(status === "succeeded");
  }, [status]);

  const navItemsCount = sortedMenus.length + 1;

  const getDensityClass = () => {
    if (densityClass === "ultra-compact") return "px-[.25rem] text-[.76rem]";
    if (densityClass === "very-compact") return "px-[.4rem] text-[.8rem]";
    if (densityClass === "compact") return "px-[.6rem] text-[.85rem]";
    return "px-[.8rem] text-[.95rem]";
  };

  const cancelClose = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimerRef.current = window.setTimeout(() => {
      setOpenRootId(null);
      setMegaOpenPath([]);
    }, 180);
  };

  const getInitialMegaPath = (rootId) => {
    if (!activeTrail.length) return [];
    if (Number(activeTrail[0]?.id) !== Number(rootId)) return [];
    return activeTrail.slice(1).map((item) => item.id);
  };

  const openDesktopDropdown = (rootId) => {
    cancelClose();
    setOpenRootId(rootId);
    setMegaOpenPath(getInitialMegaPath(rootId));
  };

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    const hideAll = () => {
      setShowLeftFade(false);
      setShowRightFade(false);
      setShowPrevBtn(false);
      setShowNextBtn(false);
    };

    const updateOverflow = () => {
      if (!menuReady) {
        hideAll();
        return;
      }

      const maxScroll = Math.max(0, row.scrollWidth - row.clientWidth);
      const hasOverflow = maxScroll > 2;

      if (!hasOverflow) {
        hideAll();
        return;
      }

      const atStart = row.scrollLeft <= 1;
      const atEnd = row.scrollLeft >= maxScroll - 1;

      setShowLeftFade(!atStart);
      setShowRightFade(!atEnd);
      setShowPrevBtn(!atStart);
      setShowNextBtn(!atEnd);
    };

    const updateDensity = () => {
      if (window.innerWidth < 992) {
        setDensityClass("");
        return;
      }

      const rowWidth = row.offsetWidth || row.clientWidth || 0;
      if (!rowWidth || !navItemsCount) {
        setDensityClass("");
        return;
      }

      const estimatedItemWidth = rowWidth / navItemsCount;

      if (estimatedItemWidth < 70) setDensityClass("ultra-compact");
      else if (estimatedItemWidth < 85) setDensityClass("very-compact");
      else if (estimatedItemWidth < 115) setDensityClass("compact");
      else setDensityClass("");
    };

    const updateAll = () => {
      updateOverflow();
      updateDensity();
    };

    updateAll();

    const onWheel = (event) => {
      if (window.innerWidth < 992) return;
      const maxScroll = Math.max(0, row.scrollWidth - row.clientWidth);
      if (maxScroll <= 2) return;

      if (!event.shiftKey && Math.abs(event.deltaY) > 0) {
        row.scrollLeft += event.deltaY;
        event.preventDefault();
      }
    };

    row.addEventListener("scroll", updateOverflow, { passive: true });
    row.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", updateAll, { passive: true });

    return () => {
      row.removeEventListener("scroll", updateOverflow);
      row.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", updateAll);
    };
  }, [menuReady, navItemsCount]);

  const hardNavigate = (event, href, openNewTab = false) => {
    if (!href || href === "#") {
      event?.preventDefault?.();
      return;
    }

    if (
      event?.metaKey ||
      event?.ctrlKey ||
      event?.shiftKey ||
      event?.altKey ||
      event?.button === 1
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

      window.location.href = href;
    } catch {
      window.location.href = href;
    }
  };

  const toggleExpanded = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderDesktopMegaItem = (item, ancestry = []) => {
    const href = getMenuItemUrl(item, departmentsById);
    const hasChildren = Boolean(item.children?.length);
    const slug = getValue(item?.slug, item?.page_slug, item?.pageSlug);
    const isActive = activeIds.has(item.id) || (currentSlug && slug && currentSlug === slug);

    const nodePath = [...ancestry, item.id];
    const isOpen = megaOpenPath.includes(item.id);

    const rawExternal = getNodeLink(item);
    const openNewTab =
      rawExternal && !isSpecialProtocol(rawExternal) && isExternalUrl(href);

    return (
      <li
        key={item.id}
        className="relative"
        onMouseEnter={() => {
          if (hasChildren) setMegaOpenPath(nodePath);
        }}
      >
        <a
          href={href}
          onClick={(event) => {
            setOpenRootId(null);
            setMegaOpenPath([]);
            hardNavigate(event, href, openNewTab);
          }}
          className={[
            "flex w-full items-center justify-between gap-[10px] rounded-[10px] bg-transparent px-[.95rem] py-[.62rem] text-left text-[.93rem] font-normal leading-[1.35] text-white outline outline-1 outline-transparent transition",
            isActive
              ? "relative bg-white/13 outline-white/16 before:absolute before:left-2 before:top-1/2 before:h-[18px] before:w-[3px] before:-translate-y-1/2 before:rounded-[3px] before:bg-[#f1c40f] before:content-['']"
              : "hover:bg-white/10 hover:outline-white/10 hover:translate-x-[2px]",
            hasChildren
              ? "after:ml-[10px] after:flex-none after:text-[.95rem] after:font-extrabold after:leading-none after:text-white/95 after:opacity-90 after:transition after:content-['▾']"
              : "",
            hasChildren && isOpen ? "after:translate-y-[1px] after:rotate-180 after:opacity-100" : "after:-translate-y-[1px]",
          ].join(" ")}
        >
          <span>{item.title}</span>
        </a>

        {hasChildren && isOpen ? (
          <ul className="my-[6px] ml-0 list-none border-l border-dashed border-white/25 pl-3 pt-[6px]">
            {sortByPosition(item.children).map((child) =>
              renderDesktopMegaItem(child, nodePath)
            )}
          </ul>
        ) : null}
      </li>
    );
  };

  const renderDesktopDropdownContent = (rootItem) => {
    const children = sortByPosition(rootItem?.children || []);
    const columns = getMegaColumns(children);

    if (!children.length) return null;

    return (
      <DropdownMenuContent
        align="start"
        side="bottom"
        sideOffset={0}
        collisionPadding={16}
        onCloseAutoFocus={(event) => event.preventDefault()}
        className="z-[12001] rounded-b-[12px] rounded-t-none border border-white/12 border-t-0 bg-[var(--secondary-color)] p-0 text-white shadow-[0_16px_40px_rgba(0,0,0,.28)]"
        style={{ width: getMegaWidth(children) }}
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
      >
        <div className="max-h-[calc(100vh-150px)] overflow-auto">
          <div
            className="grid gap-0"
            style={{
              gridTemplateColumns: `repeat(${Math.max(columns.length, 1)}, minmax(270px, 270px))`,
            }}
          >
            {columns.map((group, idx) => (
              <div
                key={`desktop-col-${rootItem.id}-${idx}`}
                className={idx > 0 ? "border-l border-white/12 p-2" : "p-2"}
              >
                <ul className="list-none p-1">
                  {group.map((item) => renderDesktopMegaItem(item, []))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </DropdownMenuContent>
    );
  };

  const renderMobileTree = (items, level = 0) =>
    sortByPosition(items).map((item) => {
      const hasChildren = Boolean(item.children?.length);
      const href = getMenuItemUrl(item, departmentsById);
      const slug = getValue(item?.slug, item?.page_slug, item?.pageSlug);
      const isActive = activeIds.has(item.id) || (currentSlug && slug && currentSlug === slug);
      const isExpanded = expandedIds.has(item.id);

      const rawExternal = getNodeLink(item);
      const openNewTab =
        rawExternal && !isSpecialProtocol(rawExternal) && isExternalUrl(href);

      return (
        <li key={item.id}>
          <div
            className="flex items-center gap-2 rounded-[12px] px-[10px] py-2 transition hover:bg-white/8"
            style={{ paddingLeft: `${Math.min(level, 7) * 12 + 10}px` }}
          >
            <a
              href={href}
              onClick={(event) => {
                setDrawerOpen(false);
                hardNavigate(event, href, openNewTab);
              }}
              className={[
                "flex-1 rounded-[10px] px-2 py-[6px] text-[.95rem] leading-[1.2] text-white transition",
                isActive ? "bg-white/14 shadow-[inset_0_0_0_1px_rgba(255,255,255,.18)]" : "",
              ].join(" ")}
            >
              {item.title}
            </a>

            {hasChildren ? (
              <button
                type="button"
                className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-white/18 bg-white/8 text-white transition hover:-translate-y-[1px] hover:bg-white/10"
                aria-expanded={isExpanded ? "true" : "false"}
                onClick={() => toggleExpanded(item.id)}
              >
                <span
                  className={`h-0 w-0 border-b-[5px] border-l-[6px] border-t-[5px] border-b-transparent border-l-white border-t-transparent opacity-90 transition ${
                    isExpanded ? "rotate-90" : "rotate-0"
                  }`}
                />
              </button>
            ) : null}
          </div>

          {hasChildren && isExpanded ? (
            <ul className="my-1 list-none border-l border-dashed border-white/25 pl-[14px]">
              {renderMobileTree(item.children, level + 1)}
            </ul>
          ) : null}
        </li>
      );
    });

  return (
    <>
      <LoadingOverlay show={status === "loading"} title={mobileBrandTitle} />

      <Drawer direction="left" open={drawerOpen} onOpenChange={setDrawerOpen}>
        <nav
          ref={navRef}
          className="dynamic-navbar sticky top-0 z-[1000] w-full overflow-visible bg-[var(--primary-color)] shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
          onMouseLeave={scheduleClose}
        >
          <div className="relative mx-auto flex w-full max-w-[1280px] items-stretch justify-start overflow-visible px-[calc(clamp(10px,1.4vw,22px)/2)]">
            {showLeftFade ? (
              <div className="pointer-events-none absolute inset-y-0 left-0 z-[10500] w-[34px] bg-[linear-gradient(270deg,rgba(158,54,58,0),rgba(158,54,58,.65))]" />
            ) : null}

            {showRightFade ? (
              <div className="pointer-events-none absolute inset-y-0 right-0 z-[10500] w-[54px] bg-[linear-gradient(90deg,rgba(158,54,58,0),rgba(158,54,58,.75))]" />
            ) : null}

            {showPrevBtn ? (
              <button
                type="button"
                aria-label="Scroll menu left"
                className="absolute left-[6px] top-1/2 z-[11001] hidden h-[34px] w-[34px] -translate-y-1/2 items-center justify-center rounded-[12px] border border-white/22 bg-white/10 text-xl text-white shadow-[0_10px_22px_rgba(0,0,0,.22)] backdrop-blur-[2px] transition hover:bg-white/14 min-[992px]:flex"
                onClick={() =>
                  rowRef.current?.scrollBy({
                    left: -Math.max(240, Math.floor((rowRef.current?.clientWidth || 0) * 0.65)),
                    behavior: "smooth",
                  })
                }
              >
                ‹
              </button>
            ) : null}

            {showNextBtn ? (
              <button
                type="button"
                aria-label="Scroll menu right"
                className="absolute right-[6px] top-1/2 z-[11001] hidden h-[34px] w-[34px] -translate-y-1/2 items-center justify-center rounded-[12px] border border-white/22 bg-white/10 text-xl text-white shadow-[0_10px_22px_rgba(0,0,0,.22)] backdrop-blur-[2px] transition hover:bg-white/14 min-[992px]:flex"
                onClick={() =>
                  rowRef.current?.scrollBy({
                    left: Math.max(240, Math.floor((rowRef.current?.clientWidth || 0) * 0.65)),
                    behavior: "smooth",
                  })
                }
              >
                ›
              </button>
            ) : null}

            <div
              ref={rowRef}
              className="menu-row hidden w-full max-w-[1280px] overflow-x-auto overflow-y-visible pr-[44px] min-[992px]:flex"
            >
              <ul className="navbar-nav flex w-max min-w-0 list-none items-stretch">
                <li
                  className="nav-item nav-home relative flex flex-none"
                  data-id="home_static"
                  data-slug="__HOME__"
                >
                  <a
                    href="/"
                    onClick={(event) => hardNavigate(event, `${window.location.origin}/`, false)}
                    className={[
                      "nav-link flex items-center justify-center whitespace-nowrap bg-transparent py-3 font-normal text-white transition min-w-[44px] px-[0.6rem]",
                      isHome ? "active bg-[var(--secondary-color)]" : "hover:bg-[var(--secondary-color)]",
                    ].join(" ")}
                  >
                    <i className="fa-solid fa-house" />
                  </a>
                </li>

                {sortedMenus.map((item) => {
                  const hasChildren = Boolean(item.children?.length);
                  const href = getMenuItemUrl(item, departmentsById);
                  const slug = getValue(item?.slug, item?.page_slug, item?.pageSlug);
                  const active =
                    activeIds.has(item.id) ||
                    (currentSlug && slug && currentSlug === slug);

                  const rawExternal = getNodeLink(item);
                  const openNewTab =
                    rawExternal && !isSpecialProtocol(rawExternal) && isExternalUrl(href);

                  if (!hasChildren) {
                    return (
                      <li
                        key={item.id}
                        data-id={item.id}
                        data-slug={slug || ""}
                        className="nav-item relative flex flex-none min-w-0"
                      >
                        <a
                          href={href}
                          onClick={(event) => hardNavigate(event, href, openNewTab)}
                          className={[
                            "nav-link flex items-center justify-center whitespace-nowrap bg-transparent py-3 font-normal text-white transition",
                            getDensityClass(),
                            active
                              ? "active bg-[var(--secondary-color)]"
                              : "hover:bg-[var(--secondary-color)]",
                          ].join(" ")}
                        >
                          {item.title}
                        </a>
                      </li>
                    );
                  }

                  return (
                    <li
                      key={item.id}
                      data-id={item.id}
                      data-slug={slug || ""}
                      className="nav-item relative flex flex-none min-w-0"
                      onMouseEnter={() => openDesktopDropdown(item.id)}
                      onMouseLeave={scheduleClose}
                    >
                      <DropdownMenu
                        open={openRootId === item.id}
                        modal={false}
                        onOpenChange={(open) => {
                          if (open) {
                            openDesktopDropdown(item.id);
                          } else {
                            setOpenRootId(null);
                            setMegaOpenPath([]);
                          }
                        }}
                      >
                        <DropdownMenuTrigger asChild>
                          <a
                            href={href}
                            onClick={(event) => hardNavigate(event, href, openNewTab)}
                            className={[
                              "nav-link flex items-center justify-center gap-1 whitespace-nowrap bg-transparent py-3 font-normal text-white transition outline-none",
                              getDensityClass(),
                              active || openRootId === item.id
                                ? "active bg-[var(--secondary-color)]"
                                : "hover:bg-[var(--secondary-color)]",
                            ].join(" ")}
                          >
                            <span>{item.title}</span>
                            <ChevronDown
                              className={`h-4 w-4 transition ${
                                openRootId === item.id ? "rotate-180" : ""
                              }`}
                            />
                          </a>
                        </DropdownMenuTrigger>

                        {renderDesktopDropdownContent(item)}
                      </DropdownMenu>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="flex min-h-[56px] w-full items-center justify-between gap-3 min-[992px]:hidden">
              {isMobileStickyActive ? (
                <a
                  href="/"
                  onClick={(event) => hardNavigate(event, `${window.location.origin}/`, false)}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-[14px] border border-white/12 bg-white/8 px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,.06)] backdrop-blur-[2px] transition hover:bg-white/10"
                  aria-label={mobileBrandTitle}
                >
                  {mobileBrandLogo ? (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-white/15 bg-white/95 shadow-[0_6px_16px_rgba(0,0,0,.12)]">
                      <img
                        src={mobileBrandLogo}
                        alt="Logo"
                        className="h-full w-full object-contain p-1"
                      />
                    </span>
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-white/15 bg-white/12 text-sm font-bold text-white">
                      {mobileBrandTitle?.charAt(0)?.toUpperCase() || "M"}
                    </span>
                  )}

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.92rem] font-semibold leading-[1.15] text-white">
                      {mobileBrandTitle}
                    </span>

                    {currentMobileRotatingText ? (
                      <span
                        key={currentMobileRotatingText}
                        className="mt-[2px] block min-h-[1.02rem] truncate text-[0.68rem] font-medium leading-[1.15] text-white/78 transition-all duration-300"
                      >
                        {currentMobileRotatingText}
                      </span>
                    ) : null}
                  </span>
                </a>
              ) : (
                <div className="flex-1" />
              )}

              <DrawerTrigger asChild>
                <button
                  type="button"
                  className="menu-toggle flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[12px] border border-white/15 bg-white/8 text-white shadow-[0_8px_20px_rgba(0,0,0,.18)] transition hover:-translate-y-[1px] hover:bg-white/12"
                  aria-label="Open menu"
                >
                  <span className="burger relative inline-block h-4 w-[22px]">
                    <span className="absolute left-0 right-0 top-[7px] h-[2px] rounded bg-white opacity-95" />
                    <span className="absolute left-0 right-0 top-0 h-[2px] rounded bg-white opacity-95" />
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded bg-white opacity-95" />
                  </span>
                </button>
              </DrawerTrigger>
            </div>
          </div>
        </nav>

        <DrawerContent
          className="
            z-[13010] border-none bg-[var(--secondary-color)] p-0 text-white shadow-[0_18px_50px_rgba(0,0,0,.35)]
            data-[vaul-drawer-direction=left]:inset-y-0
            data-[vaul-drawer-direction=left]:left-0
            data-[vaul-drawer-direction=left]:right-auto
            data-[vaul-drawer-direction=left]:mt-0
            data-[vaul-drawer-direction=left]:h-full
            data-[vaul-drawer-direction=left]:w-[340px]
            data-[vaul-drawer-direction=left]:max-w-[92vw]
            data-[vaul-drawer-direction=left]:rounded-none
            data-[vaul-drawer-direction=left]:border-r
            data-[vaul-drawer-direction=left]:border-white/15
          "
        >
          <DrawerHeader className="border-b border-white/15 px-4 py-[14px] text-left">
            <div className="flex items-center justify-between gap-3">
              <DrawerTitle className="m-0 text-base font-bold tracking-[0.2px] text-white">
                Menu
              </DrawerTitle>

              <DrawerClose asChild>
                <button
                  type="button"
                  className="rounded-lg p-2 text-white transition hover:bg-white/10"
                  aria-label="Close"
                >
                  ✕
                </button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="overflow-y-auto px-[10px] pb-[18px] pt-3">
            <ul className="offcanvas-menu list-none p-0">
              <li>
                <div className="oc-row flex items-center gap-2 rounded-[12px] px-[10px] py-2 transition hover:bg-white/8">
                  <a
                    href="/"
                    onClick={(event) => {
                      setDrawerOpen(false);
                      hardNavigate(event, `${window.location.origin}/`, false);
                    }}
                    className={[
                      "oc-link flex-1 rounded-[10px] px-2 py-[6px] text-[.95rem] leading-[1.2] text-white transition",
                      isHome ? "bg-white/14 shadow-[inset_0_0_0_1px_rgba(255,255,255,.18)]" : "",
                    ].join(" ")}
                  >
                    <i className="fa-solid fa-house" />
                  </a>
                </div>
              </li>

              {renderMobileTree(sortedMenus)}
            </ul>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export default HeaderMenu;