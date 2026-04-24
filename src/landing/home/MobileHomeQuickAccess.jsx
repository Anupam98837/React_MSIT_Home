import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import {
  fetchInfoBoxesData,
  selectInfoBoxes,
} from "../../redux/infoBoxesSlice";
import {
  fetchHomeHighlightsData,
  selectHomeHighlights,
} from "../../redux/homeHighlightsSlice";
import { fetchNvaRowData, selectNvaRow } from "../../redux/nvaRowSlice";
import {
  buildContentViewUrl,
  isSameOrigin,
  normalizeContentBasePath,
  resolveLinkUrl,
} from "../utils/pageRouting";

const INFO_SECTION_ORDER = ["career_notices", "why_us", "scholarships"];
const HIGHLIGHT_SECTION_ORDER = [
  "achievements",
  "student_activities",
  "placement_notices",
];

const SECTION_META = {
  career_notices: {
    title: "Career At MSIT",
    iconClass: "fa-solid fa-trophy",
    itemIconClass: "fa-solid fa-chevron-right",
    emptyText: "No career notices.",
  },
  why_us: {
    title: "Why MSIT",
    iconClass: "fa-solid fa-star",
    itemIconClass: "fa-solid fa-check",
    emptyText: "No highlights.",
  },
  scholarships: {
    title: "Scholarship",
    iconClass: "fa-solid fa-award",
    itemIconClass: "fa-solid fa-gift",
    emptyText: "No scholarships.",
  },
  notices: {
    title: "Notice",
    iconClass: "fa-solid fa-bullhorn",
    itemIconClass: "fa-solid fa-caret-right",
    emptyText: "No notices found.",
  },
  announcements: {
    title: "Announcements",
    iconClass: "fa-solid fa-bell",
    itemIconClass: "fa-solid fa-caret-right",
    emptyText: "No announcements found.",
  },
  achievements: {
    title: "Achievements",
    iconClass: "fa-solid fa-trophy",
    itemIconClass: "fa-solid fa-medal",
    emptyText: "No achievements found.",
  },
  student_activities: {
    title: "Students Activity",
    iconClass: "fa-solid fa-users",
    itemIconClass: "fa-solid fa-calendar",
    emptyText: "No student activities found.",
  },
  placement_notices: {
    title: "Placement Notice",
    iconClass: "fa-solid fa-briefcase",
    itemIconClass: "fa-solid fa-building",
    emptyText: "No placement notices found.",
  },
};

const TAB_ORDER = [
  "career_notices",
  "why_us",
  "scholarships",
  "notices",
  "announcements",
  "achievements",
  "student_activities",
  "placement_notices",
];

const getSafeHref = (value) => {
  const href = String(value || "").trim();
  if (!href) return "";
  if (/^(https?:\/\/|mailto:|tel:|sms:|whatsapp:|#)/i.test(href)) return href;
  if (href.startsWith("/")) return href;
  return `/${href.replace(/^\/+/, "")}`;
};

const isBlankTarget = (target) => {
  const value = String(target || "").trim().toLowerCase();
  return value === "_blank" || value === "blank" || value === "new";
};

const toEmbedUrl = (url) => {
  const value = String(url || "").trim();
  if (!value) return "";

  if (value.includes("youtube-nocookie.com/embed/")) return value;

  const shortMatch = value.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
  if (shortMatch) return `https://www.youtube-nocookie.com/embed/${shortMatch[1]}`;

  const queryMatch = value.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
  if (queryMatch) return `https://www.youtube-nocookie.com/embed/${queryMatch[1]}`;

  const embedMatch = value.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/);
  if (embedMatch) return `https://www.youtube-nocookie.com/embed/${embedMatch[1]}`;

  return value;
};

const iconForButton = (text) => {
  const value = String(text || "").toLowerCase();
  if (value.includes("counsel")) return "fa-solid fa-calendar";
  if (value.includes("admission")) return "fa-solid fa-pen";
  if (value.includes("fee") || value.includes("payment")) return "fa-solid fa-credit-card";
  if (value.includes("tour")) return "fa-solid fa-building";
  return "fa-solid fa-link";
};

const getInfoItemHref = (item) => {
  if (!item) return "";
  if (item.slug && item.categoryKey) {
    return buildContentViewUrl(item.categoryKey, item.slug);
  }
  const rawHref = String(item.href || "").trim();
  if (!rawHref) return "";
  return resolveLinkUrl(normalizeContentBasePath(rawHref));
};

const getGenericItemHref = (item) => {
  if (!item) return "";
  const rawHref = String(item.href || item.url || "").trim();
  if (!rawHref) return "";
  return resolveLinkUrl(normalizeContentBasePath(rawHref));
};

function QuickList({ sectionKey, items, loading, onNavigate }) {
  const meta = SECTION_META[sectionKey];
  const visibleItems = items?.length
    ? items.slice(0, 80)
    : [
        {
          id: `${sectionKey}-empty`,
          title: meta.emptyText,
          href: "",
        },
      ];

  return (
    <div className="mhqa-pane-scroll">
      {loading ? (
        <ul className="mhqa-list">
          {Array.from({ length: 7 }).map((_, index) => (
            <li key={`${sectionKey}-loading-${index}`} className="mhqa-list-item">
              <i className={meta.itemIconClass} aria-hidden="true" />
              <span className="block h-4 w-full animate-pulse rounded-full bg-[#9E363A]/10" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mhqa-list">
          {visibleItems.map((item) => {
            const href =
              sectionKey === "career_notices" ||
              sectionKey === "why_us" ||
              sectionKey === "scholarships"
                ? getInfoItemHref(item)
                : getGenericItemHref(item);

            const title =
              item.title || item.description || item.buttonText || meta.emptyText;
            const shouldOpenBlank = isBlankTarget(item.target);

            return (
              <li key={item.id || `${sectionKey}-${title}`} className="mhqa-list-item">
                <i className={meta.itemIconClass} aria-hidden="true" />
                {href ? (
                  <a
                    href={href}
                    target={shouldOpenBlank ? "_blank" : undefined}
                    rel={shouldOpenBlank ? "noreferrer" : undefined}
                    onClick={(event) => onNavigate(event, href, item.target)}
                  >
                    {title}
                  </a>
                ) : (
                  <span>{title}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function MobileCenterCard({ center, loading, onNavigate }) {
  const embedUrl = toEmbedUrl(center?.iframeUrl);

  return (
    <section className="mhqa-center-wrap" aria-label="Homepage featured video">
      <style>{styles}</style>

      <div className="mhqa-center-card">
        {loading ? (
          <>
            <div className="mx-auto h-6 w-3/4 animate-pulse rounded-full bg-[#9E363A]/10" />
            <div className="mhqa-video-shell">
              <div className="absolute inset-0 animate-pulse bg-[#9E363A]/10" />
            </div>
            <div className="mhqa-center-actions">
              <div className="h-11 rounded-[14px] bg-[#f59e0b]/20" />
              <div className="h-11 rounded-[14px] bg-[#991b1b]/20" />
            </div>
          </>
        ) : (
          <>
            <h3 className="mhqa-center-title">{center?.title || "—"}</h3>

            <div className="mhqa-video-shell">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  title={center?.title || "Video"}
                />
              ) : (
                <div className="mhqa-video-empty">No video available</div>
              )}
            </div>

            <div className="mhqa-center-actions">
              {center?.buttons?.length ? (
                center.buttons.map((button, index) => {
                  const href = resolveLinkUrl(
                    normalizeContentBasePath(getSafeHref(button.url))
                  );
                  const externalLike =
                    !href ||
                    /^(mailto:|tel:|sms:|whatsapp:|#)/i.test(href) ||
                    !isSameOrigin(href);

                  return (
                    <a
                      key={button.id || `${button.text}-${index}`}
                      href={href || "#"}
                      className={`mhqa-center-btn ${index >= 2 ? "secondary" : ""}`}
                      target={externalLike ? "_blank" : undefined}
                      rel={externalLike ? "noopener noreferrer" : undefined}
                      onClick={(event) => onNavigate(event, href, externalLike ? "_blank" : "")}
                    >
                      <i className={iconForButton(button.text)} aria-hidden="true" />
                      <span>{button.text || "Open"}</span>
                    </a>
                  );
                })
              ) : (
                <button type="button" className="mhqa-center-btn" disabled>
                  <i className="fa-solid fa-link" aria-hidden="true" />
                  <span>No actions</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default function MobileHomeQuickAccess() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("");

  const infoBoxesState = useSelector(selectInfoBoxes);
  const highlightsState = useSelector(selectHomeHighlights);
  const nvaState = useSelector(selectNvaRow);

  useEffect(() => {
    if (infoBoxesState?.status === "idle") {
      dispatch(fetchInfoBoxesData());
    }
  }, [dispatch, infoBoxesState?.status]);

  useEffect(() => {
    if (highlightsState?.status === "idle") {
      dispatch(fetchHomeHighlightsData());
    }
  }, [dispatch, highlightsState?.status]);

  useEffect(() => {
    if (nvaState?.status === "idle") {
      dispatch(fetchNvaRowData());
    }
  }, [dispatch, nvaState?.status]);

  useEffect(() => {
    if (!activeTab) return undefined;

    const originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
    };
  }, [activeTab]);

  const groupedInfoItems = (() => {
    const source = Array.isArray(infoBoxesState?.items) ? infoBoxesState.items : [];
    return INFO_SECTION_ORDER.reduce((acc, key) => {
      acc[key] = source.filter((item) => item?.categoryKey === key);
      return acc;
    }, {});
  })();

  const groupedHighlightItems = (() => ({
    achievements: Array.isArray(highlightsState?.achievements)
      ? highlightsState.achievements
      : [],
    student_activities: Array.isArray(highlightsState?.studentActivities)
      ? highlightsState.studentActivities
      : [],
    placement_notices: Array.isArray(highlightsState?.placementNotices)
      ? highlightsState.placementNotices
      : [],
  }))();

  const tabContentMap = {
    career_notices: groupedInfoItems.career_notices || [],
    why_us: groupedInfoItems.why_us || [],
    scholarships: groupedInfoItems.scholarships || [],
    notices: Array.isArray(nvaState?.notices) ? nvaState.notices : [],
    announcements: Array.isArray(nvaState?.announcements)
      ? nvaState.announcements
      : [],
    achievements: groupedHighlightItems.achievements || [],
    student_activities: groupedHighlightItems.student_activities || [],
    placement_notices: groupedHighlightItems.placement_notices || [],
  };

  const tabLoadingMap = {
    career_notices:
      infoBoxesState?.status === "idle" || infoBoxesState?.status === "loading",
    why_us: infoBoxesState?.status === "idle" || infoBoxesState?.status === "loading",
    scholarships:
      infoBoxesState?.status === "idle" || infoBoxesState?.status === "loading",
    notices: nvaState?.status === "idle" || nvaState?.status === "loading",
    announcements: nvaState?.status === "idle" || nvaState?.status === "loading",
    achievements:
      highlightsState?.status === "idle" || highlightsState?.status === "loading",
    student_activities:
      highlightsState?.status === "idle" || highlightsState?.status === "loading",
    placement_notices:
      highlightsState?.status === "idle" || highlightsState?.status === "loading",
  };

  const handleNavigate = (event, href, target) => {
    if (!href || href === "#") {
      event?.preventDefault?.();
      return;
    }

    if (isBlankTarget(target)) return;

    const resolved = resolveLinkUrl(href);
    if (!resolved || !isSameOrigin(resolved)) return;
    if (/^(mailto:|tel:|sms:|whatsapp:|#)/i.test(resolved)) return;

    const url = new URL(resolved, window.location.origin);
    event.preventDefault();
    setActiveTab("");
    navigate(`${url.pathname}${url.search}${url.hash}`);
  };

  const activeMeta = activeTab ? SECTION_META[activeTab] : null;

  return (
    <>
      <style>{styles}</style>

      <div className="mhqa-shell" aria-hidden={false}>
        <div className="mhqa-stack" aria-label="Quick mobile access">
          {TAB_ORDER.map((key) => {
            const meta = SECTION_META[key];
            const isActive = activeTab === key;

            return (
              <button
                key={key}
                type="button"
                className={`mhqa-tab-btn ${isActive ? "is-active" : ""}`}
                aria-label={meta.title}
                aria-pressed={isActive}
                onClick={() => setActiveTab((current) => (current === key ? "" : key))}
              >
                <span className="mhqa-tab-accent" />
                <i className={meta.iconClass} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>

      <MobileCenterCard
        center={nvaState?.center}
        loading={nvaState?.status === "idle" || nvaState?.status === "loading"}
        onNavigate={handleNavigate}
      />

      {activeTab ? (
        <>
          <button
            type="button"
            className="mhqa-backdrop"
            aria-label="Close quick access"
            onClick={() => setActiveTab("")}
          />

          <div className="mhqa-panel" role="dialog" aria-modal="true">
            <div className="mhqa-panel-head">
              <div className="mhqa-panel-title-wrap">
                <i className={activeMeta?.iconClass} aria-hidden="true" />
                <span>{activeMeta?.title}</span>
              </div>

              <button
                type="button"
                className="mhqa-close"
                aria-label="Close panel"
                onClick={() => setActiveTab("")}
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>

            <QuickList
              sectionKey={activeTab}
              items={tabContentMap[activeTab] || []}
              loading={Boolean(tabLoadingMap[activeTab])}
              onNavigate={handleNavigate}
            />
          </div>
        </>
      ) : null}
    </>
  );
}

const styles = `
  .mhqa-shell {
    position: fixed;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    z-index: 990;
    pointer-events: none;
  }

  .mhqa-stack {
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: auto;
    padding: 8px 0;
  }

  .mhqa-tab-btn {
    position: relative;
    width: 44px;
    height: 44px;
    border: 1px solid rgba(158, 54, 58, 0.16);
    border-left: 0;
    border-radius: 0 14px 14px 0;
    background: linear-gradient(180deg, rgba(255,255,255,.98), rgba(251,236,236,.96));
    color: #7d2d31;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.10);
    transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease, color .22s ease, background .22s ease;
    overflow: hidden;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .mhqa-tab-btn i {
    position: relative;
    z-index: 2;
    font-size: 15px;
    line-height: 1;
  }

  .mhqa-tab-accent {
    position: absolute;
    left: 0;
    top: 8px;
    bottom: 8px;
    width: 3px;
    border-radius: 999px;
    background: linear-gradient(180deg, #9E363A, #C94B50);
    opacity: .9;
  }

  .mhqa-tab-btn.is-active,
  .mhqa-tab-btn:hover {
    transform: translateX(6px);
    color: #9E363A;
    border-color: rgba(158, 54, 58, 0.30);
    background: linear-gradient(180deg, rgba(255,255,255,1), rgba(255,246,246,.98));
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.14);
  }

  .mhqa-tab-btn.is-active::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(158,54,58,.04), rgba(201,75,80,.06));
    pointer-events: none;
  }

  .mhqa-center-wrap {
    width: 100%;
    background: #ffffff;
  }

  .mhqa-center-card {
    background: #ffffff;
    border-radius: 18px;
    border: 1px solid #e6c8ca;
    box-shadow: 0 10px 28px rgba(0,0,0,.10);
    padding: 14px;
    overflow: hidden;
  }

  .mhqa-center-title {
    font-weight: 950;
    color: #0f172a;
    margin: 2px 0 12px;
    text-align: center;
    font-size: 18px;
    line-height: 1.25;
  }

  .mhqa-video-shell {
    position: relative;
    width: 100%;
    padding-bottom: 56.25%;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 10px 24px rgba(2,6,23,.12);
    background: #111111;
  }

  .mhqa-video-shell iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
  }

  .mhqa-video-empty {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-weight: 800;
    text-align: center;
    padding: 16px;
  }

  .mhqa-center-actions {
    padding-top: 13px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .mhqa-center-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    min-width: 0;
    border: 0;
    border-radius: 14px;
    padding: 10px 12px;
    background: #f59e0b;
    color: #ffffff;
    text-decoration: none;
    font-size: 11px;
    font-weight: 950;
    box-shadow: 0 6px 14px rgba(245,158,11,.28);
    transition: transform .15s ease, background .15s ease;
  }

  .mhqa-center-btn.secondary {
    background: #991b1b;
    box-shadow: 0 6px 14px rgba(153,27,27,.22);
  }

  .mhqa-center-btn:hover {
    transform: translateY(-1px);
    background: #d97706;
    color: #ffffff;
  }

  .mhqa-center-btn.secondary:hover {
    background: #7f1d1d;
  }

  .mhqa-center-btn:disabled {
    cursor: not-allowed;
    opacity: .8;
  }

  .mhqa-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1001;
    background: rgba(2,6,23,.34);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    border: 0;
  }

  .mhqa-panel {
    position: fixed;
    left: 54px;
    top: 50%;
    transform: translateY(-50%);
    width: min(340px, calc(100vw - 72px));
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 18px 44px rgba(2,6,23,.24);
    z-index: 1001;
    animation: mhqa-slide-in .24s cubic-bezier(.2,.8,.2,1);
    border: 1px solid rgba(158,54,58,.12);
  }

  .mhqa-panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    background: linear-gradient(135deg, #9E363A, #6B2528);
    color: #ffffff;
  }

  .mhqa-panel-title-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    font-size: 17px;
    font-weight: 950;
    letter-spacing: .2px;
  }

  .mhqa-panel-title-wrap span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mhqa-close {
    width: 30px;
    height: 30px;
    border: 0;
    border-radius: 8px;
    background: rgba(255,255,255,.14);
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .mhqa-pane-scroll {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding: 14px 16px 16px;
    background: #ffffff;
  }

  .mhqa-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .mhqa-list-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 4px;
    border-bottom: 1px solid rgba(15,23,42,.08);
    line-height: 1.4;
  }

  .mhqa-list-item:last-child {
    border-bottom: 0;
  }

  .mhqa-list-item i {
    margin-top: 3px;
    color: #9E363A;
    font-size: 13px;
    flex: 0 0 auto;
  }

  .mhqa-list-item a,
  .mhqa-list-item span {
    flex: 1 1 auto;
    color: #334155;
    text-decoration: none;
    font-size: 14px;
    font-weight: 600;
    word-break: break-word;
  }

  .mhqa-list-item a:hover {
    color: #9E363A;
  }

  @keyframes mhqa-slide-in {
    from {
      opacity: 0;
      transform: translate(-12px, -50%);
    }
    to {
      opacity: 1;
      transform: translate(0, -50%);
    }
  }
`;