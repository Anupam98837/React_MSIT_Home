import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router";
import TopHeaderMenu from "@/landing/components/TopHeaderMenu";
import MainHeader from "@/landing/components/MainHeader";
import HeaderMenu from "@/landing/components/HeaderMenu";
import Footer from "@/landing/components/Footer";
import Overlay from "@/partials/Overlay";
import PageNotFound from "@/partials/PageNotFound";
import ComingSoon from "@/partials/ComingSoon";
import {
  clearActiveDynamicSubmenu,
  fetchDynamicPage,
  fetchDynamicRenderedSubmenu,
  fetchDynamicSubmenuTree,
  selectActiveDynamicSubmenu,
  selectDynamicPageBlock,
  selectDynamicRenderBlock,
  selectDynamicTreeBlock,
  setActiveDynamicSubmenu,
} from "@/redux/dynamicPageSlice";
import {
  fetchModuleHeaderData,
  selectModuleHeader,
} from "@/redux/headerSlice";
import {
  getCurrentSlugFromPath,
  isExternalUrl,
  isSameOrigin,
  isSpecialProtocol,
  normalizePath,
  resolveLinkUrl,
} from "@/landing/utils/pageRouting";

const Announcement = lazy(() => import("@/landing/crm/Announcement"));
const Achievement = lazy(() => import("@/landing/crm/Achievement"));
const Notice = lazy(() => import("@/landing/crm/Notice"));
const Event = lazy(() => import("@/landing/crm/Event"));
const Faculty = lazy(() => import("@/landing/crm/Faculty"));
const PlacementOfficers = lazy(() => import("@/landing/crm/PlacementOfficers"));
const TechnicalAssistant = lazy(() => import("@/landing/crm/TechnicalAssistant"));
const Alumni = lazy(() => import("@/landing/crm/Alumni"));
const PlacedStudents = lazy(() => import("@/landing/crm/PlacedStudents"));
const ProgramToppers = lazy(() => import("@/landing/crm/ProgramToppers"));
const TPCell = lazy(() => import("@/landing/crm/T&PCell"));
const SuccessStories = lazy(() => import("@/landing/crm/SuccessStories"));
const StudentActivities = lazy(() => import("@/landing/crm/StudentActivities"));
const Courses = lazy(() => import("@/landing/crm/Courses"));
const Gallery = lazy(() => import("@/landing/crm/Gallery"));
const UserProfile = lazy(() => import("@/landing/crm/global/UserProfile"));

const styles = `
.dp-page {
  background: var(--bg-body, #f6f7fb);
  min-height: 100vh;
}
.dp-main {
  background: var(--bg-body, #f6f7fb);
  padding: 24px 0 40px;
}
.dp-shell {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 12px;
}
.dp-grid {
  display: grid;
  grid-template-columns: minmax(0, 300px) minmax(0, 1fr);
  gap: 22px;
  align-items: start;
}
.dp-sidebar-col.is-hidden {
  display: none;
}
.dp-grid.dp-full {
  grid-template-columns: minmax(0, 1fr);
}
.dp-sticky {
  position: sticky;
  top: 16px;
  z-index: 5;
}
.hallienz-side {
  border-radius: 18px;
  overflow: hidden;
  background: var(--surface, #fff);
  border: 1px solid var(--line-strong, #e6c8ca);
  box-shadow: var(--shadow-2, 0 8px 22px rgba(0,0,0,.08));
}
.hallienz-side__head {
  background: var(--primary-color, #9E363A);
  color: #fff;
  font-weight: 800;
  padding: 14px 16px;
  font-size: 20px;
  line-height: 1.2;
}
.hallienz-side__list,
.hallienz-side__children {
  list-style: none;
  margin: 0;
  padding: 0;
}
.hallienz-side__list {
  padding-top: 6px;
  border-bottom: 0.5rem solid var(--primary-color, #9E363A);
}
.hallienz-side__row {
  display: flex;
  align-items: stretch;
}
.hallienz-side__link {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  text-decoration: none;
  color: #0b5ed7;
  border-bottom: 1px dotted rgba(0,0,0,.16);
  transition: background .22s ease, color .22s ease;
}
.hallienz-side__link:hover {
  background: rgba(158,54,58,.06);
  color: var(--primary-color, #9E363A);
}
.hallienz-side__link.is-active {
  background: rgba(158,54,58,.10);
  color: var(--primary-color, #9E363A);
  font-weight: 800;
}
.hallienz-side__text {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hallienz-side__toggle {
  flex: 0 0 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: rgba(0,0,0,.55);
  border-bottom: 1px dotted rgba(0,0,0,.16);
  cursor: pointer;
  transition: background .22s ease, color .22s ease, transform .22s ease;
}
.hallienz-side__toggle:hover {
  background: rgba(158,54,58,.06);
  color: var(--primary-color, #9E363A);
}
.hallienz-side__item.is-open > .hallienz-side__row .hallienz-side__toggle {
  color: var(--primary-color, #9E363A);
}
.hallienz-side__item.is-open > .hallienz-side__row .hallienz-side__toggle i {
  transform: rotate(90deg);
}
.hallienz-side__children {
  display: none;
  background: rgba(158,54,58,.03);
}
.hallienz-side__item.is-open > .hallienz-side__children {
  display: block;
}
.hallienz-side__children .hallienz-side__link,
.hallienz-side__children .hallienz-side__toggle {
  border-bottom: 1px dotted rgba(0,0,0,.12);
}
.dp-card {
  border-radius: 18px;
  background: var(--surface, #fff);
  border: 1px solid var(--line-strong, #e6c8ca);
  box-shadow: var(--shadow-2, 0 8px 22px rgba(0,0,0,.08));
  overflow: hidden;
}
.dp-card__head {
  padding: 16px 18px 10px;
  border-bottom: 1px solid rgba(0,0,0,.06);
}
.dp-title {
  margin: 0;
  color: var(--ink, #111827);
  font-weight: 800;
  text-align: center;
  line-height: 1.25;
  font-size: clamp(1.2rem, 1rem + .6vw, 1.7rem);
}
.dp-card__body {
  padding: 18px;
}
.dp-loading,
.dp-empty,
.dp-error {
  padding: 28px 18px;
  text-align: center;
  color: var(--muted-color, #64748b);
}
.dp-empty h3,
.dp-error h3 {
  margin: 0 0 8px;
  color: var(--ink, #111827);
  font-size: 1.2rem;
  font-weight: 800;
}
.dp-empty p,
.dp-error p {
  margin: 0;
}
.dp-loader {
  display: inline-flex;
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 3px solid rgba(158,54,58,.16);
  border-top-color: var(--primary-color, #9E363A);
  animation: dpSpin 1s linear infinite;
  margin-bottom: 12px;
}
@keyframes dpSpin { to { transform: rotate(360deg); } }
.dp-html-frame {
  width: 100%;
  min-height: 240px;
  border: 0;
  display: block;
  background: transparent;
}
.dp-skel-wrap {
  padding: 10px 12px 14px;
}
.dp-skel-head,
.dp-skel-line,
.dp-skel-dot {
  background: linear-gradient(90deg, rgba(158,54,58,.06), rgba(158,54,58,.12), rgba(158,54,58,.06));
  background-size: 200% 100%;
  animation: dpPulse 1.25s linear infinite;
}
.dp-skel-head {
  height: 18px;
  border-radius: 999px;
  margin-bottom: 14px;
}
.dp-skel-line {
  height: 13px;
  border-radius: 999px;
  margin-bottom: 10px;
}
.dp-skel-line:last-child {
  width: 72%;
  margin-bottom: 0;
}
@keyframes dpPulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@media (max-width: 991.98px) {
  .dp-main { padding-top: 18px; }
  .dp-grid,
  .dp-grid.dp-full {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }
  .dp-sticky {
    position: static;
  }
}
`;

const MODULE_COMPONENTS = [
  { test: /faculty/i, component: Faculty },
  { test: /(technical.?assistant|technicalassistant)/i, component: TechnicalAssistant },
  { test: /(placement.?officer|placementofficer)/i, component: PlacementOfficers },
  { test: /announcement/i, component: Announcement },
  { test: /achievement/i, component: Achievement },
  { test: /notice/i, component: Notice },
  { test: /event/i, component: Event },
  { test: /alumni/i, component: Alumni },
  { test: /(placed.?student|placedstudent)/i, component: PlacedStudents },
  { test: /(program.?topper|programtopper)/i, component: ProgramToppers },
  { test: /(tp.?cell|t&pcell|placement.?cell)/i, component: TPCell },
  { test: /(success.?stor|successstory)/i, component: SuccessStories },
  { test: /(student.?activit|studentactivit)/i, component: StudentActivities },
  { test: /course/i, component: Courses },
  { test: /gallery/i, component: Gallery },
  { test: /(user.?profile|profile)/i, component: UserProfile },
];

const toText = (value) => String(value ?? "").trim();

const getLastPathSegment = (pathname) => {
  const clean = String(pathname || "").split("?")[0].split("#")[0];
  const parts = clean.split("/").filter(Boolean);
  return parts.length ? decodeURIComponent(parts[parts.length - 1]) : "";
};

const sortByPosition = (items) =>
  [...(Array.isArray(items) ? items : [])].sort((a, b) => {
    const aPos = Number(a?.position || 0);
    const bPos = Number(b?.position || 0);
    if (aPos !== bPos) return aPos - bPos;
    return Number(a?.id || 0) - Number(b?.id || 0);
  });

const flattenTree = (items, output = []) => {
  for (const item of items || []) {
    output.push(item);
    if (Array.isArray(item?.children) && item.children.length) {
      flattenTree(item.children, output);
    }
  }
  return output;
};

const findTrail = (items, predicate, path = []) => {
  for (const item of items || []) {
    const nextPath = [...path, item];
    if (predicate(item)) return nextPath;
    if (Array.isArray(item?.children) && item.children.length) {
      const match = findTrail(item.children, predicate, nextPath);
      if (match.length) return match;
    }
  }
  return [];
};

const withSearch = (pathname, search) => `${pathname}${search || ""}`;

const stripTrailingSlash = (value) => {
  const text = toText(value);
  if (!text) return "";
  if (text === "/") return "/";
  return text.replace(/\/+$/g, "") || "/";
};

const toComparableInternalPath = (value) => {
  const text = toText(value);
  if (!text) return "";

  try {
    const baseOrigin =
      typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const url = new URL(text, baseOrigin);
    if (typeof window !== "undefined" && url.origin !== window.location.origin) {
      return url.toString();
    }
    return stripTrailingSlash(
      withSearch(normalizePath(url.pathname || "/"), url.search || "")
    );
  } catch {
    const [pathPart = ""] = text.split("#");
    const [pathnamePart = "", searchPart = ""] = pathPart.split("?");
    const normalizedPath = normalizePath(pathnamePart || "/");
    const comparable = withSearch(
      normalizedPath,
      searchPart ? `?${searchPart}` : ""
    );
    return stripTrailingSlash(comparable || "/");
  }
};

const isSameInternalPath = (left, right) => {
  const a = toComparableInternalPath(left);
  const b = toComparableInternalPath(right);
  return Boolean(a && b && a === b);
};

const normalizeInternalHref = (href) => {
  const value = toText(href);
  if (!value) return "";
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return url.toString();
    return withSearch(url.pathname, url.search);
  } catch {
    return value;
  }
};

const escapeHtmlAttribute = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const escapeInlineScript = (value) => String(value ?? "").replace(/<\/script/gi, "<\\/script");

const BLOCKED_EDITOR_ASSET_PATTERNS = [
  /(?:^|\/)(?:main|index)\.(?:css|js)(?:[?#].*)?$/i,
  /\/src\/(?:main|index)\.[^/?#]+(?:[?#].*)?$/i,
  /(?:^|\/)(?:vite|@vite)(?:\/|$)/i,
  /react-refresh/i,
  /\/node_modules\//i,
];

const shouldBlockEditorAsset = (value) => {
  const asset = toText(value);
  if (!asset) return false;
  return BLOCKED_EDITOR_ASSET_PATTERNS.some((pattern) => pattern.test(asset));
};

const extractIsolatedDocumentParts = (rawHtml = "", fallbackStylesText = "", fallbackScriptsText = "") => {
  const htmlText = String(rawHtml ?? "");
  const collectedStyles = [];
  const collectedScripts = [];
  const externalStyleHrefs = [];
  const externalScriptSrcs = [];

  const pushStyle = (value) => {
    const next = String(value ?? "").trim();
    if (next) collectedStyles.push(next);
  };

  const pushScript = (value) => {
    const next = String(value ?? "").trim();
    if (next) collectedScripts.push(next);
  };

  pushStyle(fallbackStylesText);
  pushScript(fallbackScriptsText);

  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return {
      bodyHtml: htmlText,
      stylesText: collectedStyles.join("\n\n"),
      scriptsText: collectedScripts.join("\n\n"),
      externalStyleHrefs,
      externalScriptSrcs,
    };
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText || "<div></div>", "text/html");

    doc.querySelectorAll("base").forEach((node) => node.remove());

    doc.querySelectorAll('link[rel="stylesheet"]').forEach((node) => {
      const href = toText(node.getAttribute("href"));
      if (href && !shouldBlockEditorAsset(href)) {
        externalStyleHrefs.push(href);
      }
      node.remove();
    });

    doc.querySelectorAll("style").forEach((node) => {
      pushStyle(node.textContent || "");
      node.remove();
    });

    doc.querySelectorAll("script").forEach((node) => {
      const src = toText(node.getAttribute("src"));
      if (src) {
        if (!shouldBlockEditorAsset(src)) {
          externalScriptSrcs.push(src);
        }
      } else {
        pushScript(node.textContent || "");
      }
      node.remove();
    });

    return {
      bodyHtml: doc.body?.innerHTML || htmlText,
      stylesText: collectedStyles.join("\n\n"),
      scriptsText: collectedScripts.join("\n\n"),
      externalStyleHrefs: Array.from(new Set(externalStyleHrefs)),
      externalScriptSrcs: Array.from(new Set(externalScriptSrcs)),
    };
  } catch {
    return {
      bodyHtml: htmlText,
      stylesText: collectedStyles.join("\n\n"),
      scriptsText: collectedScripts.join("\n\n"),
      externalStyleHrefs,
      externalScriptSrcs,
    };
  }
};

function DynamicModuleRenderer(props) {
  const ResolvedComponent = props.component;

  return (
    <Suspense
      fallback={
        <div className="dp-loading">
          <span className="dp-loader" />
          <div>Loading {props.title || "section"}…</div>
        </div>
      }
    >
      <ResolvedComponent />
    </Suspense>
  );
}

function SidebarSkeleton() {
  return (
    <div className="hallienz-side dp-sticky">
      <div className="hallienz-side__head">Menu</div>
      <div className="dp-skel-wrap">
        <div className="dp-skel-head" />
        <div className="dp-skel-line" />
        <div className="dp-skel-line" />
        <div className="dp-skel-line" />
        <div className="dp-skel-line" />
      </div>
    </div>
  );
}

function IsolatedHtmlFrame({ frameKey, documentData, onInternalNavigate }) {
  const iframeRef = useRef(null);
  const channelRef = useRef(`dp-frame-${Math.random().toString(36).slice(2)}`);
  const [height, setHeight] = useState(320);

  const srcDoc = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "/";
    const {
      bodyHtml,
      stylesText,
      scriptsText,
      externalStyleHrefs,
      externalScriptSrcs,
    } = extractIsolatedDocumentParts(
      documentData?.html || "",
      documentData?.stylesText || "",
      documentData?.scriptsText || ""
    );

    const styleLinks = externalStyleHrefs
      .map((href) => `<link rel="stylesheet" href="${escapeHtmlAttribute(href)}" />`)
      .join("\n");

    const scriptTags = [
      ...externalScriptSrcs.map(
        (src) => `<script src="${escapeHtmlAttribute(src)}"><\/script>`
      ),
      scriptsText ? `<script>${escapeInlineScript(scriptsText)}<\/script>` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const bridgeScript = `
      (function () {
        const channel = ${JSON.stringify(channelRef.current)};
        const post = (payload) => {
          try {
            window.parent.postMessage({ channel, ...payload }, "*");
          } catch (_) {}
        };

        const measure = () => {
          const body = document.body;
          const root = document.documentElement;
          const height = Math.max(
            body ? body.scrollHeight : 0,
            body ? body.offsetHeight : 0,
            root ? root.scrollHeight : 0,
            root ? root.offsetHeight : 0
          );
          post({ type: "dp-frame-height", height });
        };

        document.addEventListener(
          "click",
          function (event) {
            const link = event.target && event.target.closest ? event.target.closest("a[href]") : null;
            if (!link) return;

            const rawHref = String(link.getAttribute("href") || "").trim();
            if (!rawHref || rawHref === "#") return;
            if (/^(mailto:|tel:|sms:|whatsapp:)/i.test(rawHref)) return;

            try {
              const url = new URL(rawHref, window.location.href);
              if (url.origin !== window.location.origin) return;
              event.preventDefault();
              post({ type: "dp-frame-nav", href: url.pathname + url.search + url.hash });
            } catch (_) {}
          },
          true
        );

        if (typeof ResizeObserver === "function") {
          const observer = new ResizeObserver(measure);
          if (document.documentElement) observer.observe(document.documentElement);
          if (document.body) observer.observe(document.body);
        }

        window.addEventListener("load", measure);
        window.addEventListener("resize", measure);
        setTimeout(measure, 0);
        setTimeout(measure, 120);
        setTimeout(measure, 300);
      })();
    `;

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <base href="${escapeHtmlAttribute(origin)}/" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
    ${styleLinks}
    <style>
      :root { color-scheme: light; }
      html, body {
        margin: 0;
        padding: 0;
        background: transparent;
        color: #111827;
        font-family: "Poppins", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
      }
      body, button, input, select, textarea, table, th, td, p, span, div, a, li, dt, dd, blockquote, figcaption, small, label {
        font-family: "Poppins", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      img, iframe, video, table {
        max-width: 100%;
      }
      iframe {
        width: 100%;
      }
      ${stylesText || ""}
    </style>
  </head>
  <body>
    ${bodyHtml || ""}
    <script>${escapeInlineScript(bridgeScript)}<\/script>
    ${scriptTags}
  </body>
</html>`;
  }, [documentData]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data || {};
      if (data?.channel !== channelRef.current) return;

      if (data?.type === "dp-frame-height") {
        setHeight(Math.max(240, Number(data.height || 0) || 0));
      }

      if (data?.type === "dp-frame-nav" && data.href && typeof onInternalNavigate === "function") {
        onInternalNavigate(String(data.href));
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onInternalNavigate]);

  useEffect(() => {
    setHeight(320);
  }, [frameKey]);

  return (
    <iframe
      key={frameKey}
      ref={iframeRef}
      title="Dynamic page content"
      className="dp-html-frame"
      srcDoc={srcDoc}
      style={{ height }}
    />
  );
}

export default function DynamicPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const [manualOpenIds, setManualOpenIds] = useState(() => new Set());

  const moduleHeader = useSelector(selectModuleHeader);

  const pathname = normalizePath(location.pathname || "/");
  const currentPath = useMemo(
    () => withSearch(pathname, location.search || ""),
    [pathname, location.search]
  );
  const rawParamSlug = toText(params.slug);
  const slugFromPath = toText(getCurrentSlugFromPath(pathname));
  const routeSlug = rawParamSlug || (slugFromPath !== "__HOME__" ? slugFromPath : "");
  const legacyQuerySubmenu = toText(
    new URLSearchParams(location.search || "").get("submenu") || ""
  );
  const submenuScopeKey = useMemo(() => `dynamic-submenu:${pathname}`, [pathname]);
  const selectedSubmenuSlug = useSelector((state) =>
    selectActiveDynamicSubmenu(state, submenuScopeKey)
  );
  const activeSubmenuSlug = toText(selectedSubmenuSlug || legacyQuerySubmenu);

  useEffect(() => {
    if (moduleHeader.status === "idle") {
      dispatch(fetchModuleHeaderData());
    }
  }, [dispatch, moduleHeader.status]);

  useEffect(() => {
    if (!legacyQuerySubmenu) return;

    dispatch(
      setActiveDynamicSubmenu({
        scopeKey: submenuScopeKey,
        slug: legacyQuerySubmenu,
      })
    );

    const params = new URLSearchParams(location.search || "");
    params.delete("submenu");
    const nextSearch = params.toString();
    navigate(`${pathname}${nextSearch ? `?${nextSearch}` : ""}${location.hash || ""}`, {
      replace: true,
    });
  }, [
    dispatch,
    legacyQuerySubmenu,
    location.hash,
    location.search,
    navigate,
    pathname,
    submenuScopeKey,
  ]);

  useEffect(() => {
    return () => {
      dispatch(clearActiveDynamicSubmenu(submenuScopeKey));
    };
  }, [dispatch, submenuScopeKey]);

  const normalizedMenus = useMemo(() => sortByPosition(moduleHeader.menus || []), [moduleHeader.menus]);

  const inferredHeaderMenu = useMemo(() => {
    const currentComparablePath = toComparableInternalPath(currentPath);
    const currentComparableBare = toComparableInternalPath(pathname);

    const allNodes = flattenTree(normalizedMenus, []);
    for (const node of allNodes) {
      const candidates = [
        normalizeInternalHref(resolveLinkUrl(node?.pageUrl || node?.page_url || "")),
        toText(node?.pageUrl || node?.page_url || node?.link || node?.url || node?.href),
        node?.pageSlug ? `/page/${encodeURIComponent(node.pageSlug)}` : "",
        node?.slug ? `/page/${encodeURIComponent(node.slug)}` : "",
        node?.shortcode ? `/view/${encodeURIComponent(node.shortcode)}` : "",
      ]
        .map((item) => toText(item))
        .filter(Boolean);

      if (
        candidates.some(
          (item) =>
            isSameInternalPath(item, currentComparablePath) ||
            isSameInternalPath(item, currentComparableBare)
        )
      ) {
        return node;
      }

      const slugCandidates = [
        toText(node?.pageSlug || node?.page_slug),
        toText(node?.slug),
        toText(node?.shortcode || node?.page_shortcode),
      ].filter(Boolean);

      if (routeSlug && slugCandidates.includes(routeSlug)) {
        return node;
      }
    }

    return null;
  }, [normalizedMenus, currentPath, pathname, routeSlug]);

  const effectivePageSlug = useMemo(() => {
    return toText(
      inferredHeaderMenu?.pageSlug ||
        routeSlug ||
        inferredHeaderMenu?.slug ||
        inferredHeaderMenu?.shortcode
    );
  }, [inferredHeaderMenu, routeSlug]);

  const pageResolveCandidates = useMemo(
    () =>
      [
        currentPath,
        pathname,
        normalizeInternalHref(
          resolveLinkUrl(
            inferredHeaderMenu?.pageUrl ||
              inferredHeaderMenu?.page_url ||
              inferredHeaderMenu?.link ||
              inferredHeaderMenu?.url ||
              inferredHeaderMenu?.href ||
              ""
          )
        ),
        toText(
          inferredHeaderMenu?.pageUrl ||
            inferredHeaderMenu?.page_url ||
            inferredHeaderMenu?.link ||
            inferredHeaderMenu?.url ||
            inferredHeaderMenu?.href
        ),
      ].filter(Boolean),
    [currentPath, pathname, inferredHeaderMenu]
  );

  const pageInput = useMemo(
    () => ({
      slug: effectivePageSlug,
      path: currentPath,
      extraCandidates: pageResolveCandidates,
    }),
    [effectivePageSlug, currentPath, pageResolveCandidates]
  );

  const pageBlock = useSelector((state) =>
    selectDynamicPageBlock(state, pageInput)
  );
  const page = pageBlock.data;

  useEffect(() => {
    if (pathname === "/") return;
    if (
      moduleHeader.status === "loading" &&
      !effectivePageSlug &&
      !pageResolveCandidates.length
    ) {
      return;
    }

    dispatch(fetchDynamicPage({ ...pageInput, force: true }));
  }, [
    dispatch,
    pageInput,
    pathname,
    moduleHeader.status,
    effectivePageSlug,
    pageResolveCandidates.length,
  ]);

  const treeInput = useMemo(() => {
    if (!page && !inferredHeaderMenu) return null;
    return {
      pageId: page?.id || "",
      pageSlug: page?.slug || page?.page_slug || effectivePageSlug || "",
      headerMenuId: inferredHeaderMenu?.id || "",
      headerUuid: inferredHeaderMenu?.uuid || "",
    };
  }, [page, inferredHeaderMenu, effectivePageSlug]);

  const treeBlock = useSelector((state) =>
    treeInput ? selectDynamicTreeBlock(state, treeInput) : { status: "idle", data: [], scope: null, error: "" }
  );

  useEffect(() => {
    if (!treeInput) return;
    dispatch(fetchDynamicSubmenuTree({ ...treeInput, force: true }));
  }, [dispatch, treeInput]);

  const treeData = useMemo(() => sortByPosition(treeBlock.data || []), [treeBlock.data]);

  const trailToActive = useMemo(() => {
    if (!activeSubmenuSlug) return [];
    return findTrail(treeData, (node) => toText(node?.slug) === activeSubmenuSlug);
  }, [treeData, activeSubmenuSlug]);

  const activeNode = useMemo(() => {
    if (!activeSubmenuSlug) return null;
    return flattenTree(treeData, []).find((item) => toText(item?.slug) === activeSubmenuSlug) || null;
  }, [treeData, activeSubmenuSlug]);

  const renderInput = useMemo(() => {
    if (!activeSubmenuSlug) return null;
    const scope = treeBlock.scope || {};
    return {
      slug: activeSubmenuSlug,
      pageId: page?.id || scope?.page_id || "",
      pageSlug: page?.slug || page?.page_slug || effectivePageSlug || "",
      headerMenuId:
        scope?.effective_header_menu_id ||
        scope?.header_menu_id ||
        inferredHeaderMenu?.id ||
        "",
      headerUuid:
        scope?.effective_header_uuid ||
        scope?.header_uuid ||
        inferredHeaderMenu?.uuid ||
        "",
    };
  }, [activeSubmenuSlug, treeBlock.scope, page, effectivePageSlug, inferredHeaderMenu]);

  const renderBlock = useSelector((state) =>
    renderInput ? selectDynamicRenderBlock(state, renderInput) : { status: "idle", data: null, error: "" }
  );

  useEffect(() => {
    if (!renderInput) return;
    dispatch(fetchDynamicRenderedSubmenu({ ...renderInput, force: true }));
  }, [dispatch, renderInput]);

  const payload = renderBlock.data || null;
  const cardTitle = toText(
    payload?.title ||
      activeNode?.title ||
      page?.page_title ||
      page?.title ||
      routeSlug ||
      getLastPathSegment(pathname) ||
      "Dynamic Page"
  );

  const resolveMappedComponent = (node, payloadData) => {
    const haystacks = [
      toText(node?.includable_path),
      toText(node?.slug),
      toText(node?.page_slug),
      toText(node?.page_shortcode),
      toText(payloadData?.path),
      toText(payloadData?.includable_path),
      toText(payloadData?.module),
      toText(payloadData?.title),
    ].filter(Boolean);

    for (const item of haystacks) {
      for (const matcher of MODULE_COMPONENTS) {
        if (matcher.test.test(item)) {
          return matcher.component;
        }
      }
    }

    return null;
  };

  const mappedComponent = useMemo(
    () => resolveMappedComponent(activeNode, payload),
    [activeNode, payload]
  );

  const openIds = useMemo(() => {
    const next = new Set(Array.from(manualOpenIds));
    for (const item of trailToActive) {
      next.add(item.id);
    }
    return next;
  }, [manualOpenIds, trailToActive]);

  useEffect(() => {
    if (payload?.type !== "url") return;

    const rawUrl = toText(payload?.url || payload?.link || payload?.href);
    if (!rawUrl) return;

    const resolved = normalizeInternalHref(rawUrl);
    if (!resolved) return;

    if (isSameOrigin(resolved) && !isExternalUrl(resolved)) {
      navigate(resolved, { replace: false });
      return;
    }

    window.open(rawUrl, "_blank", "noopener,noreferrer");
  }, [payload, navigate]);

  const toggleOpen = (id) => {
    setManualOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openSubmenu = (node) => {
    const slug = toText(node?.slug);
    if (!slug) return;

    dispatch(
      setActiveDynamicSubmenu({
        scopeKey: submenuScopeKey,
        slug,
      })
    );
  };

  const handleNodeClick = (event, node) => {
    const rawUrl = toText(node?.page_url);
    if (rawUrl && (isSpecialProtocol(rawUrl) || isExternalUrl(rawUrl))) {
      return;
    }

    event.preventDefault();
    openSubmenu(node);
  };

  const renderTreeNodes = (items, level = 0) =>
    sortByPosition(items).map((node) => {
      const hasChildren = Array.isArray(node?.children) && node.children.length > 0;
      const isOpen = openIds.has(node.id);
      const isActive = toText(node?.slug) === activeSubmenuSlug;
      const rawUrl = toText(node?.page_url || node?.pageUrl);

      let href = pathname || "/";
      if (rawUrl && (isSpecialProtocol(rawUrl) || isExternalUrl(rawUrl))) {
        href = resolveLinkUrl(rawUrl) || rawUrl;
      }

      return (
        <li
          key={node.id || `${node.slug}-${level}`}
          className={`hallienz-side__item ${isOpen ? "is-open" : ""}`}
        >
          <div className="hallienz-side__row">
            <a
              href={href}
              data-submenu-slug={toText(node?.slug)}
              className={`hallienz-side__link ${isActive ? "is-active" : ""}`}
              onClick={(event) => handleNodeClick(event, node)}
              style={{ paddingLeft: `${14 + Math.max(0, level) * 14}px` }}
            >
              <span className="hallienz-side__text">{node.title}</span>
            </a>

            {hasChildren ? (
              <button
                type="button"
                className="hallienz-side__toggle"
                aria-label={`Toggle ${node.title}`}
                aria-expanded={isOpen ? "true" : "false"}
                onClick={() => toggleOpen(node.id)}
              >
                <i className="fa-solid fa-chevron-right" />
              </button>
            ) : null}
          </div>

          {hasChildren ? (
            <ul className="hallienz-side__children">{renderTreeNodes(node.children, level + 1)}</ul>
          ) : null}
        </li>
      );
    });

  const htmlFrameData = useMemo(() => {
    if (mappedComponent) return null;

    if (!activeSubmenuSlug) {
      return {
        html: toText(page?.content_html || page?.html),
        stylesText: "",
        scriptsText: "",
      };
    }

    if (!payload || payload.type === "coming_soon") {
      return {
        html: "",
        stylesText: "",
        scriptsText: "",
      };
    }

    if (payload.type === "includable") {
      return {
        html: toText(payload?.html),
        stylesText: toText(payload?.assets?.styles || payload?.styles),
        scriptsText: toText(payload?.assets?.scripts || payload?.scripts),
      };
    }

    return {
      html: toText(payload?.html),
      stylesText: "",
      scriptsText: "",
    };
  }, [mappedComponent, activeSubmenuSlug, page, payload]);

  const showSidebar = treeBlock.status === "loading" || treeData.length > 0;
  const showPageLoading = pageBlock.status === "loading" && !page;
  const showPageMissing = pageBlock.status === "failed" && !page;
  const showSubmenuComingSoon =
    Boolean(activeSubmenuSlug) &&
    renderBlock.status === "failed" &&
    !mappedComponent;
  const pageErrorText = toText(pageBlock.error || pageBlock?.message || "");
  const requestedPageSlug = toText(
    routeSlug || currentPath || page?.slug || page?.page_slug || getLastPathSegment(pathname)
  );
  const requestedSubmenuSlug = toText(activeSubmenuSlug);
  const isNotFoundState = /(?:^|\b)(404|not found|page not found|missing)(?:\b|$)/i.test(pageErrorText);
  const showBusyOverlay = showPageLoading;

  const mainContent = showPageMissing ? (
    isNotFoundState ? (
      <PageNotFound slug={requestedPageSlug} />
    ) : (
      <ComingSoon slug={requestedPageSlug} />
    )
  ) : showSubmenuComingSoon ? (
    <ComingSoon slug={requestedSubmenuSlug} />
  ) : (
    <section className="dp-card">
      <div className="dp-card__head">
        <h1 className="dp-title">{cardTitle || "Dynamic Page"}</h1>
      </div>

      <div className="dp-card__body">
        {mappedComponent ? (
          <DynamicModuleRenderer component={mappedComponent} title={cardTitle} />
        ) : payload?.type === "url" && !payload?.html ? (
          <div className="dp-empty">
            <h3>{cardTitle || "External Link"}</h3>
            <p>Opening link…</p>
          </div>
        ) : (
          <IsolatedHtmlFrame
            frameKey={`${pathname}|${activeSubmenuSlug || "page"}|${cardTitle}`}
            documentData={htmlFrameData || { html: "", stylesText: "", scriptsText: "" }}
            onInternalNavigate={(href) => navigate(href)}
          />
        )}
      </div>
    </section>
  );

  return (
    <div className="dp-page">
      <style>{styles}</style>
      <Overlay show={showBusyOverlay} />
      <TopHeaderMenu />
      <MainHeader />
      <HeaderMenu />

      <main className="dp-main">
        <div className="dp-shell">
          <div className={`dp-grid ${!showSidebar ? "dp-full" : ""}`}>
            <aside className={`dp-sidebar-col ${!showSidebar ? "is-hidden" : ""}`}>
              {treeBlock.status === "loading" && !treeData.length ? (
                <SidebarSkeleton />
              ) : treeData.length ? (
                <div id="sidebarCard" className="hallienz-side dp-sticky">
                  <div className="hallienz-side__head">{toText(page?.title || page?.page_title || "Menu")}</div>
                  <ul className="hallienz-side__list">{renderTreeNodes(treeData)}</ul>
                </div>
              ) : null}
            </aside>

            {mainContent}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}