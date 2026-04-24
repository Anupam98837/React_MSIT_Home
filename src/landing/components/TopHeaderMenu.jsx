import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router";
import {
  fetchTopHeaderData,
  selectDepartmentsById,
  selectTopHeader,
} from "../../redux/headerSlice";

const clampGutter = () => Math.max(10, Math.min(22, window.innerWidth * 0.014));

const getValue = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
};

const normalizePath = (value) => {
  let path = String(value || "/").trim();
  if (!path.startsWith("/")) path = `/${path}`;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path;
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

const isSameOrigin = (url) => {
  try {
    return new URL(url, window.location.origin).origin === window.location.origin;
  } catch {
    return false;
  }
};

const isExternalUrl = (url) => {
  try {
    return new URL(url, window.location.origin).origin !== window.location.origin;
  } catch {
    return false;
  }
};

const sortByPosition = (items = []) =>
  [...items].sort((a, b) => Number(a?.position || 0) - Number(b?.position || 0));

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

const getNodeSlug = (item) => getValue(item?.slug, item?.page_slug, item?.pageSlug);

const getNodeRawUrl = (item) =>
  getValue(item?.url, item?.page_url, item?.pageUrl, item?.link, item?.href);

const getItemDeptSlug = (item, departmentsById) => {
  const direct = getValue(
    item?.department?.slug,
    item?.department?.short_name,
    item?.department?.shortName,
    item?.departmentSlug,
    item?.department_slug,
    item?.dept_slug,
    item?.deptSlug
  );

  if (direct) return direct;

  const departmentId = getValue(item?.department_id, item?.departmentId);
  if (!departmentId) return "";

  const department = departmentsById?.[Number(departmentId)];
  if (!department) return "";

  return getValue(
    department?.slug,
    department?.short_name,
    department?.shortName,
    department?.department_slug,
    department?.dept_slug
  );
};

const applyDepartmentSlug = (url, deptSlug) => {
  const resolvedSlug = String(deptSlug || "").trim();
  if (!resolvedSlug || !url || url === "#") return url;

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

    const newSearch = kept.length
      ? `?${kept.join("&")}&dept=${encodeURIComponent(resolvedSlug)}`
      : `?dept=${encodeURIComponent(resolvedSlug)}`;

    return `${target.origin}${target.pathname}${newSearch}${target.hash || ""}`;
  } catch {
    const joiner = url.includes("?") ? "&" : "?";
    return `${url}${joiner}dept=${encodeURIComponent(resolvedSlug)}`;
  }
};

const getMenuItemUrl = (item, departmentsById) => {
  let url = "#";

  const rawUrl = getValue(item?.url);
  const rawPageUrl = getValue(item?.page_url, item?.pageUrl, item?.link, item?.href);
  const rawPageSlug = getValue(item?.page_slug, item?.pageSlug);
  const rawSlug = getValue(item?.slug);

  if (rawUrl) {
    url = rawUrl.startsWith("http")
      ? rawUrl
      : rawUrl.startsWith("/")
      ? `${window.location.origin}${rawUrl}`
      : `${window.location.origin}/${rawUrl}`;
  } else if (rawPageUrl) {
    url = rawPageUrl.startsWith("http")
      ? rawPageUrl
      : `${window.location.origin}${rawPageUrl.startsWith("/") ? rawPageUrl : `/${rawPageUrl}`}`;
  } else if (rawPageSlug) {
    url = `${window.location.origin}/view/${rawPageSlug}`;
  } else if (rawSlug) {
    url = `${window.location.origin}/view/${rawSlug}`;
  }

  const deptSlug = getItemDeptSlug(item, departmentsById);
  return applyDepartmentSlug(url, deptSlug);
};

const guessContactType = (contact) => {
  const raw = getValue(
    contact?.type,
    contact?.key,
    contact?.contact_type,
    contact?.contactType
  ).toLowerCase();

  const value = getValue(contact?.value, contact?.label).toLowerCase();

  if (["phone", "mobile", "tel", "telephone", "call"].includes(raw)) return "phone";
  if (["email", "mail"].includes(raw)) return "email";
  if (["address", "location", "map", "maps"].includes(raw)) return "address";
  if (["website", "web", "url", "link"].includes(raw)) return "website";
  if (["whatsapp", "wa"].includes(raw)) return "whatsapp";

  if (value.includes("@")) return "email";
  if (value.replace(/[^\d+]/g, "").length >= 8) return "phone";

  return "text";
};

const sanitizePhone = (value) => {
  let phone = String(value || "").trim().replace(/[^\d+]/g, "");
  if (phone.startsWith("+")) return `+${phone.slice(1).replace(/[^\d]/g, "")}`;
  return phone.replace(/[^\d]/g, "");
};

const getContactHref = (contact) => {
  const explicit = getValue(contact?.url, contact?.href);
  if (explicit) return explicit;

  const type = guessContactType(contact);
  const value = getValue(contact?.value, contact?.label);

  if (!value) return "#";

  if (type === "email") return `mailto:${value}`;
  if (type === "phone") return `tel:${sanitizePhone(value)}`;
  if (type === "address") {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`;
  }
  if (type === "whatsapp") {
    const phone = sanitizePhone(value).replace("+", "");
    return phone ? `https://wa.me/${phone}` : "#";
  }
  if (type === "website") {
    return /^https?:\/\//i.test(value) ? value : `https://${value.replace(/^\/+/, "")}`;
  }

  return "#";
};

const contactMeta = {
  phone: { iconClass: "fa-solid fa-phone" },
  email: { iconClass: "fa-solid fa-envelope" },
  address: { iconClass: "fa-solid fa-location-dot" },
  website: { iconClass: "fa-solid fa-globe" },
  whatsapp: { iconClass: "fa-brands fa-whatsapp" },
  text: { iconClass: "fa-solid fa-circle-info" },
};

function TopHeaderMenu() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { menus, contacts, status } = useSelector(selectTopHeader);
  const departmentsById = useSelector(selectDepartmentsById);

  const navRef = useRef(null);
  const rowRef = useRef(null);
  const panelRef = useRef(null);
  const closeTimerRef = useRef(null);

  const [openRootId, setOpenRootId] = useState(null);
  const [portalStyle, setPortalStyle] = useState(null);
  const [megaColumns, setMegaColumns] = useState([]);
  const [densityClass, setDensityClass] = useState("");
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);
  const [showPrevBtn, setShowPrevBtn] = useState(false);
  const [showNextBtn, setShowNextBtn] = useState(false);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchTopHeaderData());
    }
  }, [dispatch, status]);

  useEffect(() => {
    setOpenRootId(null);
    setMegaColumns([]);
  }, [location.pathname, location.search]);

  const roots = useMemo(() => sortByPosition(menus || []), [menus]);
  const topContacts = useMemo(() => (contacts || []).slice(0, 2), [contacts]);
  const currentSlug = useMemo(() => getCurrentSlug(location.pathname), [location.pathname]);
  const currentPath = useMemo(
    () => normalizePath(location.pathname || "/"),
    [location.pathname]
  );

  const activeTrail = useMemo(() => {
    return collectTrail(
      roots,
      (node) => {
        const nodeSlug = getNodeSlug(node);
        if (currentSlug && nodeSlug && nodeSlug === currentSlug) return true;

        const rawUrl = getNodeRawUrl(node);
        if (!rawUrl) return false;

        try {
          const target = new URL(
            rawUrl.startsWith("http")
              ? rawUrl
              : rawUrl.startsWith("/")
              ? `${window.location.origin}${rawUrl}`
              : `${window.location.origin}/${rawUrl}`,
            window.location.origin
          );

          if (target.origin !== window.location.origin) return false;
          return normalizePath(target.pathname) === currentPath;
        } catch {
          return false;
        }
      },
      []
    );
  }, [roots, currentSlug, currentPath]);

  const activeIds = useMemo(() => new Set(activeTrail.map((item) => item.id)), [activeTrail]);

  const openRoot = useMemo(
    () => roots.find((item) => Number(item.id) === Number(openRootId)) || null,
    [roots, openRootId]
  );

  const navItemsCount = topContacts.length + roots.length;

  const getRootLinkSizeClass = () => {
    if (densityClass === "ultra-compact") return "px-[.45rem] text-[.75rem]";
    if (densityClass === "very-compact") return "px-[.55rem] text-[.8rem]";
    if (densityClass === "compact") return "px-[.8rem] text-[.85rem]";
    return "px-[1.2rem] text-[.95rem]";
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
      setMegaColumns([]);
    }, 140);
  };

  const setPortalPosition = () => {
    if (!navRef.current) return;
    const rect = navRef.current.getBoundingClientRect();
    const gutter = clampGutter();

    setPortalStyle({
      top: Math.round(rect.bottom),
      left: gutter,
      right: gutter,
    });
  };

  const getAnchorTop = (anchorEl) => {
    const panel = panelRef.current;
    if (!panel || !anchorEl) return 0;

    const panelRect = panel.getBoundingClientRect();
    const anchorRect = anchorEl.getBoundingClientRect();

    let top = anchorRect.top - panelRect.top;
    top = Math.max(0, top - 4);

    const minVisible = 140;
    const availableBelow = window.innerHeight - panelRect.top - 20;
    const maxTop = Math.max(0, availableBelow - minVisible);

    return Math.min(top, maxTop);
  };

  const openDesktopMega = (rootId) => {
    cancelClose();
    setPortalPosition();

    const root = roots.find((item) => Number(item.id) === Number(rootId));
    setOpenRootId(rootId);

    if (!root?.children?.length) {
      setMegaColumns([]);
      return;
    }

    const activeSlice =
      activeTrail.length && Number(activeTrail[0]?.id) === Number(rootId)
        ? activeTrail.slice(1)
        : [];

    const firstActiveId = activeSlice[0]?.id ?? null;

    setMegaColumns([
      {
        colIndex: 0,
        items: sortByPosition(root.children),
        alignTopPx: 0,
        activeId: firstActiveId,
      },
    ]);
  };

  const handleMegaItemEnter = (colIndex, item, anchorEl) => {
    setMegaColumns((prev) => {
      const next = prev
        .filter((column) => column.colIndex <= colIndex)
        .map((column) =>
          column.colIndex === colIndex
            ? { ...column, activeId: item.id }
            : column
        );

      if (item.children?.length) {
        next.push({
          colIndex: colIndex + 1,
          items: sortByPosition(item.children),
          alignTopPx: getAnchorTop(anchorEl),
          activeId: null,
        });
      }

      return next;
    });
  };

  useEffect(() => {
    if (!openRoot || !megaColumns.length) return;

    const activeSlice =
      activeTrail.length && Number(activeTrail[0]?.id) === Number(openRoot.id)
        ? activeTrail.slice(1)
        : [];

    if (!activeSlice.length) return;

    const frame = window.requestAnimationFrame(() => {
      let nextColumns = [
        {
          colIndex: 0,
          items: sortByPosition(openRoot.children || []),
          alignTopPx: 0,
          activeId: activeSlice[0]?.id ?? null,
        },
      ];

      for (let i = 0; i < activeSlice.length; i += 1) {
        const node = activeSlice[i];
        const children = sortByPosition(node?.children || []);
        if (!children.length) break;

        nextColumns.push({
          colIndex: i + 1,
          items: children,
          alignTopPx: 0,
          activeId: activeSlice[i + 1]?.id ?? null,
        });
      }

      setMegaColumns(nextColumns);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [openRoot, activeTrail]);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    const updateOverflow = () => {
      const maxScroll = Math.max(0, row.scrollWidth - row.clientWidth);
      const hasOverflow = maxScroll > 2;
      const atStart = row.scrollLeft <= 1;
      const atEnd = row.scrollLeft >= maxScroll - 1;

      setShowLeftFade(hasOverflow && !atStart);
      setShowRightFade(hasOverflow && !atEnd);
      setShowPrevBtn(hasOverflow && !atStart);
      setShowNextBtn(hasOverflow && !atEnd);
    };

    const updateDensity = () => {
      if (window.innerWidth < 992 || !row) {
        setDensityClass("");
        return;
      }

      const rowWidth = row.offsetWidth || row.clientWidth || 0;
      if (!rowWidth || !navItemsCount) {
        setDensityClass("");
        return;
      }

      const estimatedItemWidth = rowWidth / navItemsCount;

      if (estimatedItemWidth < 90) setDensityClass("ultra-compact");
      else if (estimatedItemWidth < 110) setDensityClass("very-compact");
      else if (estimatedItemWidth < 140) setDensityClass("compact");
      else setDensityClass("");
    };

    const updateAll = () => {
      updateOverflow();
      updateDensity();
      if (openRootId) setPortalPosition();
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
    window.addEventListener("scroll", updateAll, { passive: true });

    return () => {
      row.removeEventListener("scroll", updateOverflow);
      row.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", updateAll);
      window.removeEventListener("scroll", updateAll);
    };
  }, [navItemsCount, openRootId]);

  const handleInternalRoute = (href) => {
    const target = new URL(href, window.location.origin);
    navigate(`${target.pathname}${target.search}${target.hash}`);
  };

  const hardNavigate = (event, href, openNewTab = false) => {
    if (!href || href === "#") {
      event.preventDefault();
      return;
    }

    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button === 1
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (openNewTab) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }

    if (isSameOrigin(href)) {
      handleInternalRoute(href);
      return;
    }

    window.location.href = href;
  };

  const renderContactLink = (contact, index) => {
    const type = guessContactType(contact);
    const meta = contactMeta[type] || contactMeta.text;
    const href = getContactHref(contact);
    const openNewTab =
      ["address", "whatsapp", "website"].includes(type) || /^https?:\/\//i.test(href);

    return (
      <li key={`${type}-${index}`} className="flex flex-none">
        <a
          href={href}
          onClick={(event) => hardNavigate(event, href, openNewTab)}
          className={[
            "flex items-center justify-start gap-[.55rem] whitespace-nowrap px-[.95rem] py-3 text-[0.95rem] font-normal text-white transition",
            "hover:bg-[var(--secondary-color)]",
            index === topContacts.length - 1
              ? "mr-[6px] shadow-[inset_-1px_0_0_rgba(255,255,255,.18)]"
              : "",
          ].join(" ")}
        >
          <i className={`${meta.iconClass} opacity-95`} />
          <span>{getValue(contact?.value, contact?.label)}</span>
        </a>
      </li>
    );
  };

  const renderMegaColumns = () => {
    if (!openRoot || !portalStyle || !megaColumns.length) return null;

    return createPortal(
      <div
        className="fixed z-[12000]"
        style={{
          top: `${portalStyle.top}px`,
          left: `${portalStyle.left}px`,
          right: `${portalStyle.right}px`,
        }}
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
      >
        <div
          ref={panelRef}
          className="relative inline-flex max-w-full items-stretch overflow-x-auto overflow-y-hidden rounded-b-[10px] border border-white/10 border-t-0 bg-[var(--secondary-color)] shadow-[0_12px_30px_rgba(0,0,0,.22)]"
        >
          {megaColumns.map((column, index) => (
            <div
              key={`mega-col-${column.colIndex}`}
              data-col={column.colIndex}
              className={[
                "relative flex w-[270px] min-w-[270px] flex-col p-2",
                index > 0 ? "before:absolute before:bottom-0 before:left-0 before:top-0 before:w-px before:bg-white/15 before:content-['']" : "",
              ].join(" ")}
              style={{
                marginTop:
                  index > 0 && column.alignTopPx > 0 ? `${column.alignTopPx}px` : "0px",
              }}
            >
              <ul className="max-h-[calc(100vh-180px)] list-none overflow-auto p-1">
                {column.items.map((item) => {
                  const href = getMenuItemUrl(item, departmentsById);
                  const isActive = column.activeId === item.id || activeIds.has(item.id);
                  const hasChildren = Boolean(item.children?.length);

                  const rawExternal = getValue(item?.page_url, item?.pageUrl, item?.url);
                  const openNewTab =
                    /^https?:\/\//i.test(rawExternal) && isExternalUrl(href);

                  return (
                    <li key={item.id} data-id={item.id}>
                      <a
                        href={href}
                        data-mid={item.id}
                        data-col={column.colIndex}
                        onMouseEnter={(event) => handleMegaItemEnter(column.colIndex, item, event.currentTarget)}
                        onClick={(event) => hardNavigate(event, href, openNewTab)}
                        className={[
                          "relative flex w-full items-center justify-between gap-[10px] rounded-[10px] px-[.95rem] py-[.62rem] text-left text-[.93rem] font-normal text-white outline outline-1 outline-transparent transition",
                          isActive
                            ? "bg-white/13 outline-white/16 before:absolute before:left-2 before:top-1/2 before:h-[18px] before:w-[3px] before:-translate-y-1/2 before:rounded-[3px] before:bg-[#f1c40f] before:content-['']"
                            : "hover:bg-white/10 hover:outline-white/10",
                        ].join(" ")}
                      >
                        <span className="pr-2">{item.title}</span>
                        {hasChildren ? (
                          <span className="ml-[10px] flex-none text-[1.2rem] font-bold leading-none text-white/90 transition">
                            ›
                          </span>
                        ) : null}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="hidden min-[992px]:block">
      <nav
        ref={navRef}
        className="sticky top-0 z-[1000] w-full overflow-visible bg-[var(--primary-color)] px-[clamp(10px,1.4vw,22px)] shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
        onMouseLeave={scheduleClose}
      >
        <div className="relative mx-auto flex max-w-[1280px] items-stretch justify-start overflow-visible">
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
              className="absolute left-[6px] top-1/2 z-[11000] flex h-[34px] w-[34px] -translate-y-1/2 items-center justify-center rounded-[12px] border border-white/20 bg-white/10 text-xl text-white shadow-[0_10px_22px_rgba(0,0,0,.22)] transition hover:-translate-y-[calc(50%+1px)] hover:bg-white/14"
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
              className="absolute right-[6px] top-1/2 z-[11000] flex h-[34px] w-[34px] -translate-y-1/2 items-center justify-center rounded-[12px] border border-white/20 bg-white/10 text-xl text-white shadow-[0_10px_22px_rgba(0,0,0,.22)] transition hover:-translate-y-[calc(50%+1px)] hover:bg-white/14"
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
            className="w-full max-w-[1280px] overflow-x-auto overflow-y-hidden pr-[44px]"
          >
            <ul className="flex w-max min-w-0 list-none items-stretch">
              {topContacts.map(renderContactLink)}

              {roots.map((item) => {
                const href = getMenuItemUrl(item, departmentsById);
                const hasChildren = Boolean(item.children?.length);
                const isActive = activeIds.has(item.id);

                const rawExternal = getValue(item?.page_url, item?.pageUrl, item?.url);
                const openNewTab =
                  /^https?:\/\//i.test(rawExternal) && isExternalUrl(href);

                return (
                  <li
                    key={item.id}
                    data-id={item.id}
                    className="relative flex flex-none"
                    onMouseEnter={() => hasChildren && openDesktopMega(item.id)}
                  >
                    <a
                      href={href}
                      onClick={(event) => hardNavigate(event, href, openNewTab)}
                      className={[
                        "flex items-center justify-center whitespace-nowrap bg-transparent py-3 font-normal text-white transition",
                        getRootLinkSizeClass(),
                        isActive
                          ? "bg-[var(--secondary-color)]"
                          : "hover:bg-[var(--secondary-color)]",
                      ].join(" ")}
                    >
                      {item.title}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </nav>

      {renderMegaColumns()}
    </div>
  );
}

export default TopHeaderMenu;