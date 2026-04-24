import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router";
import {
  fetchStickyButtons,
  selectStickyButtons,
} from "../../redux/stickyButtonsSlice";

const safeArray = (value) => {
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

const normalizePath = (url) => {
  const raw = String(url || "").trim();
  if (!raw) return "#";

  if (/^(https?:\/\/|mailto:|tel:|sms:|whatsapp:)/i.test(raw)) {
    return raw;
  }

  let path = raw.startsWith("/") ? raw : `/${raw}`;
  path = path.replace(/\/placement_notices(?=\/|$)/gi, "/placement-notices");
  path = path.replace(/\/career_notices(?=\/|$)/gi, "/career-notices");
  path = path.replace(/\/why_us(?=\/|$)/gi, "/why-us");
  path = path.replace(/\/student_activities(?=\/|$)/gi, "/student-activities");

  return path;
};

const isExternalUrl = (url) =>
  /^(https?:\/\/|mailto:|tel:|sms:|whatsapp:)/i.test(String(url || "").trim());

const normalizeButton = (x) => {
  const obj = x && typeof x === "object" ? x : {};

  const label = (
    obj.name ??
    obj.label ??
    obj.title ??
    obj.key ??
    "Link"
  )
    .toString()
    .trim();

  const iconClass = (
    obj.icon_class ??
    obj.iconClass ??
    obj.icon ??
    "fa-solid fa-link"
  )
    .toString()
    .trim();

  const url = (
    obj.action_url ??
    obj.url ??
    obj.href ??
    obj.link ??
    obj.value ??
    "#"
  )
    .toString()
    .trim();

  const href = normalizePath(url);
  const enabledRaw = obj.is_active ?? obj.active ?? obj.status ?? 1;
  const enabledStr = String(enabledRaw).toLowerCase().trim();
  const isEnabled =
    enabledRaw === true ||
    enabledStr === "1" ||
    enabledStr === "yes" ||
    enabledStr === "active";

  const external = isExternalUrl(href);

  return {
    label,
    iconClass: iconClass || "fa-solid fa-link",
    href,
    isEnabled,
    external,
  };
};

const handleDeactivateAfterClick = (event) => {
  const node = event.currentTarget;
  window.setTimeout(() => {
    if (node && typeof node.blur === "function") {
      node.blur();
    }
  }, 120);
};

function StickyButtonLink({ button }) {
  const sharedContent = (
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
        {sharedContent}
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
        onClick={handleDeactivateAfterClick}
      >
        {sharedContent}
      </a>
    );
  }

  return (
    <Link
      className="sbx-link"
      to={button.href}
      title={button.label}
      onClick={handleDeactivateAfterClick}
    >
      {sharedContent}
    </Link>
  );
}

export default function StickyButtons() {
  const dispatch = useDispatch();
  const items = useSelector(selectStickyButtons);
  const status = useSelector((state) => state.stickyButtons?.status || "idle");

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchStickyButtons());
    }
  }, [dispatch, status]);

  const buttons = useMemo(
    () =>
      safeArray(items)
        .map(normalizeButton)
        .filter((item) => item.isEnabled),
    [items]
  );

  if (!buttons.length) return null;

  return (
    <div className="sbx-wrap" aria-label="Sticky contact buttons">
      <style>{`
        .sbx-wrap{
          --sbx-brand: var(--primary-color, #9E363A);
          --sbx-brand-2: var(--secondary-color, #6B2528);
          --sbx-ink: #ffffff;
          --sbx-shadow: 0 8px 24px rgba(2,6,23,.18);
          --sbx-w: 52px;
          --sbx-h: 52px;
          --sbx-gap: 6px;
          position: fixed;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          z-index: 9999;
          pointer-events: none;
        }

        .sbx-stack{
          display:flex;
          flex-direction:column;
          gap:var(--sbx-gap);
          pointer-events:auto;
          padding:6px 0;
        }

        .sbx-item{
          position:relative;
          width:var(--sbx-w);
          height:var(--sbx-h);
          background:linear-gradient(135deg, var(--sbx-brand) 0%, var(--sbx-brand-2) 100%);
          border-radius:50%;
          box-shadow:var(--sbx-shadow);
          transition:all .25s cubic-bezier(0.4, 0, 0.2, 1);
          overflow:visible;
        }

        .sbx-link{
          width:100%;
          height:100%;
          display:flex;
          align-items:center;
          justify-content:center;
          color:var(--sbx-ink);
          text-decoration:none;
          outline:none;
          border-radius:50%;
          position:relative;
          transition:transform .25s cubic-bezier(0.34, 1.56, 0.64, 1);
          -webkit-tap-highlight-color: transparent;
        }

        .sbx-link::before{
          content:'';
          position:absolute;
          inset:-2px;
          background:rgba(255,255,255,.15);
          border-radius:50%;
          opacity:0;
          transition:opacity .25s ease;
        }

        .sbx-link i{
          font-size:22px;
          line-height:1;
          position:relative;
          z-index:1;
          transition:transform .25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .sbx-mobile-accent{
          display:none;
        }

        .sbx-label{
          position:absolute;
          left:-12px;
          top:50%;
          transform:translate(-100%, -50%) translateX(10px);
          opacity:0;
          pointer-events:none;
          background:rgba(15,23,42,.95);
          color:#fff;
          border:1px solid rgba(255,255,255,.15);
          border-radius:8px;
          padding:8px 14px;
          font-size:13px;
          font-weight:600;
          white-space:nowrap;
          box-shadow:0 8px 20px rgba(0,0,0,.2);
          transition:all .25s cubic-bezier(0.34, 1.56, 0.64, 1);
          backdrop-filter:blur(10px);
          -webkit-backdrop-filter:blur(10px);
        }

        .sbx-label::after{
          content:'';
          position:absolute;
          right:-5px;
          top:50%;
          transform:translateY(-50%);
          width:0;
          height:0;
          border-top:5px solid transparent;
          border-bottom:5px solid transparent;
          border-left:5px solid rgba(15,23,42,.95);
        }

        .sbx-item:hover .sbx-label,
        .sbx-item:focus-within .sbx-label{
          opacity:1;
          transform:translate(-100%, -50%) translateX(0);
        }

        .sbx-item:hover{
          transform:translateX(-8px) scale(1.08);
          box-shadow:0 12px 32px rgba(2,6,23,.25), 0 0 0 3px rgba(255,255,255,.2);
        }

        .sbx-item:hover .sbx-link::before,
        .sbx-item:focus-within .sbx-link::before{
          opacity:1;
        }

        .sbx-item:hover .sbx-link i{
          transform:scale(1.15);
          color:white;
        }

        .sbx-item:active{
          transform:translateX(-6px) scale(1.02);
        }

        .sbx-item:active .sbx-link i{
          transform:scale(.9);
        }

        .sbx-visually-hidden{
          position:absolute !important;
          width:1px !important;
          height:1px !important;
          padding:0 !important;
          margin:-1px !important;
          overflow:hidden !important;
          clip:rect(0,0,0,0) !important;
          white-space:nowrap !important;
          border:0 !important;
        }

        @media (max-width:576px){
          .sbx-wrap{
            --sbx-w: 44px;
            --sbx-h: 44px;
            --sbx-gap: 8px;
            right: 0;
          }

          .sbx-stack{
            padding: 8px 0;
          }

          .sbx-item{
            width: var(--sbx-w);
            height: var(--sbx-h);
            border: 1px solid rgba(158, 54, 58, 0.16);
            border-right: 0;
            border-radius: 14px 0 0 14px;
            background: linear-gradient(180deg, rgba(255,255,255,.98), rgba(251,236,236,.96));
            color: #7d2d31;
            box-shadow: 0 10px 24px rgba(15, 23, 42, 0.10);
            overflow: visible;
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
          }

          .sbx-link{
            border-radius: 14px 0 0 14px;
            color: #7d2d31;
            background: transparent;
            transform: none;
          }

          .sbx-link::before{
            content: "";
            position: absolute;
            inset: 0;
            border-radius: 14px 0 0 14px;
            background: linear-gradient(135deg, rgba(158,54,58,.04), rgba(201,75,80,.06));
            opacity: 0;
            transition: opacity .22s ease;
          }

          .sbx-mobile-accent{
            display:block;
            position:absolute;
            right:0;
            top:8px;
            bottom:8px;
            width:3px;
            border-radius:999px;
            background: linear-gradient(180deg, #9E363A, #C94B50);
            opacity:.9;
            z-index:2;
          }

          .sbx-link i{
            position: relative;
            z-index: 2;
            font-size: 15px;
            line-height: 1;
            color: #7d2d31;
            transform: none;
          }

          .sbx-item:hover,
          .sbx-item:focus-within{
            transform: translateX(-6px);
            color: #9E363A;
            border-color: rgba(158, 54, 58, 0.30);
            background: linear-gradient(180deg, rgba(255,255,255,1), rgba(255,246,246,.98));
            box-shadow: 0 16px 30px rgba(15, 23, 42, 0.14);
          }

          .sbx-item:hover .sbx-link i,
          .sbx-item:focus-within .sbx-link i{
            transform: none;
            color: #9E363A;
          }

          .sbx-item:active{
            transform: translateX(-4px);
          }

          .sbx-label{
            display:block;
            left:-10px;
            top:50%;
            transform:translate(-100%, -50%) translateX(10px);
            opacity:0;
            font-size:12px;
            padding:7px 12px;
            border-radius:10px;
            white-space:nowrap;
            z-index:10000;
          }

          .sbx-item:hover .sbx-label,
          .sbx-item:focus-within .sbx-label{
            opacity:1;
            transform:translate(-100%, -50%) translateX(0);
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