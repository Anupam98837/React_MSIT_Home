import React, { useEffect, useMemo } from "react";
import { Link } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStickyButtons,
  selectStickyButtons,
} from "../../redux/stickyButtonsSlice";

const normalizeButtons = (value) => {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};

const normalizeUrl = (value) => {
  const raw = String(value || "").trim();

  if (!raw) return "#";

  if (/^(https?:\/\/|mailto:|tel:|sms:|whatsapp:)/i.test(raw)) {
    return raw;
  }

  let url = raw.startsWith("/") ? raw : `/${raw}`;

  url = url.replace(/\/placement_notices(?=\/|$)/gi, "/placement-notices");
  url = url.replace(/\/career_notices(?=\/|$)/gi, "/career-notices");
  url = url.replace(/\/why_us(?=\/|$)/gi, "/why-us");
  url = url.replace(/\/student_activities(?=\/|$)/gi, "/student-activities");

  return url;
};

const isExternalUrl = (value) => {
  return /^(https?:\/\/|mailto:|tel:|sms:|whatsapp:)/i.test(
    String(value || "").trim()
  );
};

const mapButton = (item) => {
  const data = item && typeof item === "object" ? item : {};

  const label = String(
    data.name ?? data.label ?? data.title ?? data.key ?? "Link"
  ).trim();

  const iconClass = String(
    data.icon_class ?? data.iconClass ?? data.icon ?? "fa-solid fa-link"
  ).trim();

  const href = normalizeUrl(
    String(
      data.action_url ??
        data.url ??
        data.href ??
        data.link ??
        data.value ??
        "#"
    ).trim()
  );

  const activeValue = data.is_active ?? data.active ?? data.status ?? 1;
  const activeText = String(activeValue).toLowerCase().trim();

  const isEnabled =
    activeValue === true ||
    activeText === "1" ||
    activeText === "yes" ||
    activeText === "active";

  return {
    label,
    iconClass: iconClass || "fa-solid fa-link",
    href,
    isEnabled,
    external: isExternalUrl(href),
  };
};

const blurAfterClick = (event) => {
  const target = event.currentTarget;

  window.setTimeout(() => {
    if (target && typeof target.blur === "function") {
      target.blur();
    }
  }, 120);
};

function StickyButtonLink({ button }) {
  const content = (
    <>
      <span className="sbx-mobile-accent" aria-hidden="true" />
      <i className={button.iconClass} aria-hidden="true" />
      <span className="sbx-visually-hidden">{button.label}</span>
    </>
  );

  if (!button.href || button.href === "#") {
    return (
      <span
        className="sbx-link"
        aria-disabled="true"
        tabIndex={-1}
        title={button.label}
      >
        {content}
      </span>
    );
  }

  if (button.external) {
    return (
      <a
        className="sbx-link"
        href={button.href}
        target="_blank"
        rel="noopener noreferrer"
        title={button.label}
        onClick={blurAfterClick}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      className="sbx-link"
      to={button.href}
      title={button.label}
      onClick={blurAfterClick}
    >
      {content}
    </Link>
  );
}

export default function StickyButtons() {
  const dispatch = useDispatch();
  const stickyButtons = useSelector(selectStickyButtons);
  const stickyButtonsStatus = useSelector(
    (state) => state.stickyButtons?.status || "idle"
  );

  useEffect(() => {
    if (stickyButtonsStatus === "idle") {
      dispatch(fetchStickyButtons());
    }
  }, [dispatch, stickyButtonsStatus]);

  const buttons = useMemo(() => {
    return normalizeButtons(stickyButtons).map(mapButton).filter((btn) => btn.isEnabled);
  }, [stickyButtons]);

  if (!buttons.length) return null;

  return (
    <div className="sbx-wrap" aria-label="Sticky contact buttons">
      <style>{`
        .sbx-wrap {
          --sbx-brand: var(--primary-color, #9E363A);
          --sbx-brand-2: var(--secondary-color, #6B2528);
          --sbx-accent: var(--accent-color, #C94B50);
          --sbx-ink: #7d2d31;
          --sbx-w: 44px;
          --sbx-h: 44px;
          --sbx-gap: 8px;

          position: fixed;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          z-index: 9999;
          pointer-events: none;
        }

        .sbx-stack {
          display: flex;
          flex-direction: column;
          gap: var(--sbx-gap);
          padding: 8px 0;
          pointer-events: auto;
        }

        .sbx-item {
          position: relative;
          width: var(--sbx-w);
          height: var(--sbx-h);
          border: 1px solid rgba(158, 54, 58, 0.16);
          border-right: 0;
          border-radius: 14px 0 0 14px;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.98),
            rgba(251, 236, 236, 0.96)
          );
          color: var(--sbx-ink);
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.10);
          overflow: visible;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          transition:
            transform 0.22s ease,
            border-color 0.22s ease,
            background 0.22s ease,
            box-shadow 0.22s ease,
            color 0.22s ease;
        }

        .sbx-link {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--sbx-ink);
          text-decoration: none;
          outline: none;
          border-radius: 14px 0 0 14px;
          background: transparent;
          transform: none;
          -webkit-tap-highlight-color: transparent;
        }

        .sbx-link::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 14px 0 0 14px;
          background: linear-gradient(
            135deg,
            rgba(158, 54, 58, 0.04),
            rgba(201, 75, 80, 0.06)
          );
          opacity: 0;
          transition: opacity 0.22s ease;
        }

        .sbx-mobile-accent {
          display: block;
          position: absolute;
          right: 0;
          top: 8px;
          bottom: 8px;
          width: 3px;
          border-radius: 999px;
          background: linear-gradient(180deg, var(--sbx-brand), var(--sbx-accent));
          opacity: 0.9;
          z-index: 2;
        }

        .sbx-link i {
          position: relative;
          z-index: 2;
          font-size: 15px;
          line-height: 1;
          color: var(--sbx-ink);
          transform: none;
          transition: color 0.22s ease;
        }

        .sbx-item:hover,
        .sbx-item:focus-within {
          transform: translateX(-6px);
          color: var(--sbx-brand);
          border-color: rgba(158, 54, 58, 0.30);
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 1),
            rgba(255, 246, 246, 0.98)
          );
          box-shadow: 0 16px 30px rgba(15, 23, 42, 0.14);
        }

        .sbx-item:hover .sbx-link::before,
        .sbx-item:focus-within .sbx-link::before {
          opacity: 1;
        }

        .sbx-item:hover .sbx-link i,
        .sbx-item:focus-within .sbx-link i {
          transform: none;
          color: var(--sbx-brand);
        }

        .sbx-item:active {
          transform: translateX(-4px);
        }

        .sbx-label {
          display: block;
          position: absolute;
          left: -10px;
          top: 50%;
          transform: translate(-100%, -50%) translateX(10px);
          opacity: 0;
          pointer-events: none;
          background: rgba(15, 23, 42, 0.95);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          padding: 7px 12px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.20);
          transition:
            opacity 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
            transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          z-index: 10000;
        }

        .sbx-label::after {
          content: "";
          position: absolute;
          right: -5px;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-top: 5px solid transparent;
          border-bottom: 5px solid transparent;
          border-left: 5px solid rgba(15, 23, 42, 0.95);
        }

        .sbx-item:hover .sbx-label,
        .sbx-item:focus-within .sbx-label {
          opacity: 1;
          transform: translate(-100%, -50%) translateX(0);
        }

        .sbx-visually-hidden {
          position: absolute !important;
          width: 1px !important;
          height: 1px !important;
          padding: 0 !important;
          margin: -1px !important;
          overflow: hidden !important;
          clip: rect(0, 0, 0, 0) !important;
          white-space: nowrap !important;
          border: 0 !important;
        }

        @media (prefers-reduced-motion: reduce) {
          .sbx-item,
          .sbx-link,
          .sbx-link::before,
          .sbx-link i,
          .sbx-label {
            transition: none !important;
          }
        }
      `}</style>

      <div className="sbx-stack" id="sbxStack">
        {buttons.map((button, index) => (
          <div className="sbx-item" key={`${button.label}-${index}`}>
            <StickyButtonLink button={button} />
            <div className="sbx-label">{button.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}