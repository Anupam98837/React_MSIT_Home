import { useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { fetchNvaRowData, selectNvaRow } from "../../redux/nvaRowSlice";
import { useAutoScroller } from "./scrollers";
import {
  isSameOrigin,
  normalizeContentBasePath,
  resolveLinkUrl,
} from "../utils/pageRouting";

const getSafeHref = (value) => {
  const href = String(value || "").trim();
  if (!href) return "";
  if (/^(https?:\/\/|mailto:|tel:|sms:|whatsapp:|#)/i.test(href)) return href;
  if (href.startsWith("/")) return href;
  return `/${href.replace(/^\/+/, "")}`;
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

const isBlankTarget = (target) => {
  const value = String(target || "").trim().toLowerCase();
  return value === "_blank" || value === "blank" || value === "new";
};

function resolveNvaItemUrl(item) {
  if (!item) return "";
  const rawHref = String(item.href || "").trim();
  if (!rawHref) return "";
  return resolveLinkUrl(normalizeContentBasePath(rawHref));
}

function NvaList({ title, headIconClass, itemIconClass, items, emptyText }) {
  const navigate = useNavigate();
  const viewportRef = useRef(null);
  const listRef = useRef(null);

  useAutoScroller(
    viewportRef,
    listRef,
    {
      axis: "y",
      minItems: 7,
      speedPxPerSec: 15,
      pauseDelayMs: 1200,
      disableBelow: 768,
    },
    [items.length]
  );

  const visibleItems = useMemo(() => {
    if (items.length) return items.slice(0, 80);

    return [
      {
        id: `${title}-empty`,
        title: emptyText,
        href: "",
      },
    ];
  }, [items, title, emptyText]);

  const handleItemClick = (event, href, target) => {
    if (isBlankTarget(target)) return;

    const resolved = resolveLinkUrl(href);
    if (!resolved || !isSameOrigin(resolved)) return;
    if (/^(mailto:|tel:|sms:|whatsapp:|#)/i.test(resolved)) return;

    const url = new URL(resolved, window.location.origin);
    event.preventDefault();
    navigate(`${url.pathname}${url.search}${url.hash}`);
  };

  return (
    <div className="msit-nva-card">
      <div className="msit-nva-head">
        <i className={headIconClass} aria-hidden="true" />
        <span>{title}</span>
      </div>

      <div ref={viewportRef} className="msit-nva-body" tabIndex={0}>
        <ul ref={listRef} className="msit-nva-list">
          {visibleItems.map((item) => {
            const href = resolveNvaItemUrl(item);
            const shouldOpenBlank = isBlankTarget(item.target);

            return (
              <li key={item.id}>
                <i className={itemIconClass} aria-hidden="true" />
                {href ? (
                  <a
                    href={href}
                    target={shouldOpenBlank ? "_blank" : undefined}
                    rel={shouldOpenBlank ? "noreferrer" : undefined}
                    onClick={(event) => handleItemClick(event, href, item.target)}
                  >
                    {item.title}
                  </a>
                ) : (
                  <span>{item.title}</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function CenterIframe({ center }) {
  const navigate = useNavigate();
  const embedUrl = toEmbedUrl(center?.iframeUrl);

  const handleButtonClick = (event, href) => {
    const resolved = resolveLinkUrl(href);
    if (!resolved || !isSameOrigin(resolved)) return;
    if (/^(mailto:|tel:|sms:|whatsapp:|#)/i.test(resolved)) return;

    const url = new URL(resolved, window.location.origin);
    event.preventDefault();
    navigate(`${url.pathname}${url.search}${url.hash}`);
  };

  return (
    <div className="msit-center-video-card">
      <div className="msit-center-video-title">{center?.title || "—"}</div>

      <div className="msit-video-embed">
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
          <div className="msit-video-empty">No video available</div>
        )}
      </div>

      <div className="msit-cta-section">
        {center?.buttons?.length ? (
          center.buttons.map((button, index) => {
            const href = resolveLinkUrl(normalizeContentBasePath(getSafeHref(button.url)));
            const isExternalLike =
              !href ||
              /^(mailto:|tel:|sms:|whatsapp:|#)/i.test(href) ||
              !isSameOrigin(href);

            return (
              <a
                key={button.id}
                href={href || "#"}
                className={`msit-cta-btn ${index >= 2 ? "btn-secondary" : ""}`}
                target={isExternalLike ? "_blank" : undefined}
                rel={isExternalLike ? "noopener noreferrer" : undefined}
                onClick={(event) => {
                  if (!href || href === "#") {
                    event.preventDefault();
                    return;
                  }
                  handleButtonClick(event, href);
                }}
              >
                <i className={iconForButton(button.text)} aria-hidden="true" />
                <span>{button.text || "Open"}</span>
              </a>
            );
          })
        ) : (
          <a href="#" className="msit-cta-btn" onClick={(e) => e.preventDefault()}>
            <i className="fa-solid fa-link" aria-hidden="true" />
            <span>No actions</span>
          </a>
        )}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <section className="msit-nva-section">
      <style>{styles}</style>

      <div className="msit-nva-grid">
        <div className="msit-nva-card">
          <div className="msit-nva-head">
            <i className="fa-solid fa-bullhorn" aria-hidden="true" />
            <span>Notice</span>
          </div>
          <div className="msit-nva-body">
            <ul className="msit-nva-list">
              {Array.from({ length: 6 }).map((_, index) => (
                <li key={index}>
                  <i className="fa-solid fa-caret-right" aria-hidden="true" />
                  <span className="block h-4 w-full animate-pulse rounded-full bg-[#9E363A]/10" />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="msit-center-video-card">
          <div className="h-6 w-3/4 mx-auto animate-pulse rounded-full bg-[#9E363A]/10" />
          <div className="msit-video-embed">
            <div className="absolute inset-0 animate-pulse bg-[#9E363A]/10" />
          </div>
          <div className="msit-cta-section">
            <div className="h-11 rounded-[14px] bg-[#f59e0b]/20" />
            <div className="h-11 rounded-[14px] bg-[#991b1b]/20" />
          </div>
        </div>

        <div className="msit-nva-card">
          <div className="msit-nva-head">
            <i className="fa-solid fa-bell" aria-hidden="true" />
            <span>Announcements</span>
          </div>
          <div className="msit-nva-body">
            <ul className="msit-nva-list">
              {Array.from({ length: 6 }).map((_, index) => (
                <li key={index}>
                  <i className="fa-solid fa-caret-right" aria-hidden="true" />
                  <span className="block h-4 w-full animate-pulse rounded-full bg-[#9E363A]/10" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

const styles = `
  .msit-nva-section {
    width: 100%;
    background: #ffffff;
  }

  .msit-nva-grid {
    width: min(1320px, 100%);
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    align-items: start;
  }

  .msit-nva-card {
    background: #ffffff;
    border-radius: 18px;
    box-shadow: 0 10px 28px rgba(0,0,0,.10);
    padding: 14px;
    border: 1px solid #e6c8ca;
    overflow: hidden;
    height: 100%;
  }

  .msit-nva-head {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: #ffffff;
    font-weight: 950;
    letter-spacing: .3px;
    padding: 10px 12px;
    font-size: 18px;
    user-select: none;
    border-radius: 14px;
    margin: 0 0 10px;
    background: linear-gradient(135deg, #9E363A, #6B2528);
  }

  .msit-nva-head i {
    opacity: .95;
    filter: drop-shadow(0 6px 10px rgba(0,0,0,.12));
  }

  .msit-nva-body {
    background: #ffffff;
    border-radius: 14px;
    border: 1px solid rgba(17,17,17,.06);
    padding: 12px;
    color: #111111;
    position: relative;
    max-height: 260px;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-gutter: stable;
    overscroll-behavior: contain;
  }

  .msit-nva-body.scroll-active {
    overflow: hidden !important;
    padding-right: 12px;
    scrollbar-gutter: auto;
  }

  .msit-nva-body:not(.scroll-active)::-webkit-scrollbar {
    width: 6px;
  }

  .msit-nva-body:not(.scroll-active)::-webkit-scrollbar-track {
    background: #f8f9fa;
    border-radius: 4px;
    margin: 4px 0;
  }

  .msit-nva-body:not(.scroll-active)::-webkit-scrollbar-thumb {
    background: #9E363A;
    border-radius: 4px;
  }

  .msit-nva-list {
    list-style: none;
    padding: 0;
    margin: 0;
    position: relative;
  }

  .msit-nva-list li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 9px 6px;
    border-bottom: 1px dashed rgba(2,6,23,.12);
    font-weight: 700;
    color: #0f172a;
    line-height: 1.35;
  }

  .msit-nva-list li:last-child {
    border-bottom: 0;
  }

  .msit-nva-list li i {
    margin-top: 3px;
    color: rgba(15,23,42,.55);
    flex: 0 0 auto;
  }

  .msit-nva-list a,
  .msit-nva-list span {
    color: #0f172a;
    text-decoration: none;
    font-weight: 800;
    line-height: 1.25;
    flex: 1 1 auto;
    word-break: break-word;
  }

  .msit-nva-list a:hover {
    color: #9E363A;
    text-decoration: underline;
  }

  .msit-center-video-card {
    background: #ffffff;
    border-radius: 18px;
    border: 1px solid #e6c8ca;
    box-shadow: 0 10px 28px rgba(0,0,0,.10);
    padding: 14px;
    height: 100%;
    overflow: hidden;
  }

  .msit-center-video-title {
    font-weight: 950;
    color: #0f172a;
    margin: 2px 0 12px;
    text-align: center;
    font-size: 1.35rem;
  }

  .msit-video-embed {
    position: relative;
    width: 100%;
    padding-bottom: 56.25%;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 10px 24px rgba(2,6,23,.12);
    background: #111111;
  }

  .msit-video-embed iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
  }

  .msit-video-empty {
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

  .msit-cta-section {
    padding-top: 13px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    align-items: stretch;
    justify-content: center;
    max-width: 100%;
    margin-left: auto;
    margin-right: auto;
  }

  .msit-cta-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    min-width: 0;
    background: #f59e0b;
    color: #ffffff;
    border: 0;
    border-radius: 14px;
    padding: 10px 14px;
    font-weight: 950;
    font-size: 11px;
    box-shadow: 0 6px 14px rgba(245,158,11,.28);
    transition: transform .15s ease, filter .15s ease, background .15s ease;
    text-decoration: none;
  }

  .msit-cta-btn:hover {
    background: #d97706;
    transform: translateY(-1px);
    color: #ffffff;
  }

  .msit-cta-btn.btn-secondary {
    background: #991b1b;
    box-shadow: 0 6px 14px rgba(153,27,27,.22);
  }

  .msit-cta-btn.btn-secondary:hover {
    background: #7f1d1d;
    color: #ffffff;
  }

  @media (max-width: 991.98px) {
    .msit-nva-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .msit-center-video-title {
      font-size: 18px;
    }

    .msit-cta-btn {
      font-size: 11px;
      padding: 10px 12px;
    }
  }
`;

export default function NvaRow() {
  const dispatch = useDispatch();
  const { notices, announcements, center, status, error } = useSelector(selectNvaRow);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchNvaRowData());
    }
  }, [dispatch, status]);

  if (status === "idle" || status === "loading") {
    return <Skeleton />;
  }

  return (
    <section className="msit-nva-section">
      <style>{styles}</style>

      <>
        {status === "failed" ? (
          <div className="mb-4 rounded-[16px] border border-[#f3d0d2] bg-[#fff5f5] px-4 py-3 text-sm font-semibold text-[#9E363A]">
            {error || "Failed to load NVA row."}
          </div>
        ) : null}

        <div className="msit-nva-grid">
          <NvaList
            title="Notice"
            headIconClass="fa-solid fa-bullhorn"
            itemIconClass="fa-solid fa-caret-right"
            items={notices}
            emptyText="No notices found."
          />

          <CenterIframe center={center} />

          <NvaList
            title="Announcements"
            headIconClass="fa-solid fa-bell"
            itemIconClass="fa-solid fa-caret-right"
            items={announcements}
            emptyText="No announcements found."
          />
        </div>
      </>
    </section>
  );
}