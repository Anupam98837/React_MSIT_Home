import { memo, useMemo } from "react";

const overlayStyles = `
.w3-loader-overlay{
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  font-family: var(--font-sans, inherit);
  background:
    radial-gradient(circle at top, rgba(148,163,255,0.18), transparent 55%),
    linear-gradient(135deg,
      color-mix(in oklab, var(--bg-body, #0b1220) 80%, #020617 20%),
      color-mix(in oklab, var(--bg-body, #0b1220) 90%, #020617 10%)
    );
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.w3-loader-backdrop{
  position:absolute;
  inset:0;
  pointer-events:none;
  background:
    radial-gradient(circle at bottom,
      rgba(15,23,42,0.7),
      transparent 55%);
  opacity:.9;
}

.w3-loader-inner{
  position: relative;
  z-index: 1;
  max-width: 360px;
  width: 100%;
  padding: 24px 22px 18px;
  border-radius: 20px;
  border: 1px solid var(--line-strong, rgba(148,163,184,0.5));
  background:
    radial-gradient(circle at top left,
      color-mix(in oklab, var(--t-primary, rgba(59,130,246,0.16)) 70%, transparent),
      transparent 60%),
    var(--surface, #ffffff);
  box-shadow: var(--shadow-3, 0 22px 45px rgba(15,23,42,0.55));
  color: var(--ink, #0f172a);
  text-align: center;
  overflow: hidden;
}

.w3-loader-logo-wrap{
  position: relative;
  display:flex;
  align-items:center;
  justify-content:center;
  margin-bottom: 14px;
}

.w3-loader-logo-ring{
  width: 76px;
  height: 76px;
  border-radius: 999px;
  padding: 3px;
  background:
    conic-gradient(
      from 180deg,
      color-mix(in oklab, var(--primary-color,#6366f1) 80%, #020617 20%),
      color-mix(in oklab, var(--accent-color,#ec4899) 80%, #020617 20%),
      color-mix(in oklab, var(--primary-color,#6366f1) 80%, #020617 20%)
    );
  display:flex;
  align-items:center;
  justify-content:center;
  animation: w3-loader-pulse 1.6s ease-in-out infinite;
}

.w3-loader-logo{
  width: 100%;
  height: 100%;
  border-radius: 999px;
  background: var(--surface,#ffffff);
  padding: 8px;
  object-fit: contain;
}

.w3-loader-orbit{
  position:absolute;
  width:110px;
  height:110px;
  border-radius:999px;
  border:1px dashed color-mix(in oklab, var(--accent-color,#ec4899) 35%, transparent);
  display:flex;
  align-items:center;
  justify-content:center;
  animation: w3-loader-spin 7s linear infinite;
}

.w3-loader-orbit-dot{
  position:absolute;
  width:9px;
  height:9px;
  border-radius:999px;
  background: color-mix(in oklab, var(--accent-color,#ec4899) 75%, #020617 25%);
  box-shadow:0 0 0 4px color-mix(in oklab, var(--accent-color,#ec4899) 18%, transparent);
}
.w3-loader-orbit-dot:nth-child(1){ top:-4px; left:50%; transform:translateX(-50%); }
.w3-loader-orbit-dot:nth-child(2){ bottom:-4px; right:10px; }
.w3-loader-orbit-dot:nth-child(3){ top:18px; left:-2px; }

.w3-loader-text h2{
  font-family: var(--font-head, inherit);
  font-size: 1.25rem;
  margin: 2px 0 4px;
}
.w3-loader-text p{
  margin:0;
  font-size: var(--fs-13, 0.85rem);
  color: var(--muted-color,#6b7280);
}

.w3-loader-bar{
  margin-top: 14px;
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: color-mix(in oklab, var(--page-hover,#e5e7eb) 70%, transparent);
  overflow:hidden;
  position:relative;
}
.w3-loader-bar-fill{
  position:absolute;
  inset:0;
  transform-origin:left;
  background: linear-gradient(90deg,
    var(--primary-color,#6366f1),
    var(--accent-color,#ec4899));
  animation: w3-loader-bar 1.7s ease-in-out infinite;
}

.w3-loader-hint{
  margin-top: 10px;
  font-size: var(--fs-12, 0.8rem);
  color: var(--muted-color,#6b7280);
}

@keyframes w3-loader-spin{
  to { transform: rotate(360deg); }
}
@keyframes w3-loader-pulse{
  0%,100%{ transform:scale(1); box-shadow:0 0 0 0 rgba(0,0,0,0.12); }
  50%{ transform:scale(1.04); box-shadow:0 0 0 10px rgba(0,0,0,0.07); }
}
@keyframes w3-loader-bar{
  0%{ transform:scaleX(0.18); opacity:.5; }
  40%{ transform:scaleX(0.9); opacity:1; }
  100%{ transform:scaleX(0.2) translateX(40%); opacity:.6; }
}

html.theme-dark .w3-loader-overlay{
  background:
    radial-gradient(circle at top, rgba(56,189,248,0.16), transparent 55%),
    linear-gradient(135deg,#020617,#020617);
}
html.theme-dark .w3-loader-inner{
  background:
    radial-gradient(circle at top left,
      color-mix(in oklab, var(--t-primary,rgba(59,130,246,0.25)) 85%, transparent),
      transparent 60%),
    #020617;
  color:#e5e7eb;
  border-color: rgba(148,163,184,0.6);
}
html.theme-dark .w3-loader-text p,
html.theme-dark .w3-loader-hint{
  color:#9ca3af;
}
html.theme-dark .w3-loader-bar{
  background:#020617;
}
`;

const resolveAppName = () => {
  if (typeof document === "undefined") return "Application";

  const ogTitle = document
    .querySelector('meta[property="og:title"]')
    ?.getAttribute("content")
    ?.split("|")[0]
    ?.trim();

  const titleText = document.title?.split("|")[0]?.trim();

  return ogTitle || titleText || import.meta.env.VITE_APP_NAME || "Application";
};

const Overlay = memo(function Overlay({
  show = true,
  appName,
  title,
  subtitle = "Loading your workspace…",
  hint = "Theme will match your last choice automatically.",
  logoSrc = "/msit_logo.jpg",
}) {
  const resolvedAppName = useMemo(() => appName || title || resolveAppName(), [appName, title]);

  if (!show) return null;

  return (
    <>
      <style>{overlayStyles}</style>
      <div id="pageOverlay" className="w3-loader-overlay" role="status" aria-live="polite">
        <div className="w3-loader-backdrop" />

        <div className="w3-loader-inner">
          <div className="w3-loader-logo-wrap">
            <div className="w3-loader-orbit" aria-hidden="true">
              <span className="w3-loader-orbit-dot" />
              <span className="w3-loader-orbit-dot" />
              <span className="w3-loader-orbit-dot" />
            </div>

            <div className="w3-loader-logo-ring">
              <img src={logoSrc} alt={resolvedAppName} className="w3-loader-logo" />
            </div>
          </div>

          <div className="w3-loader-text">
            <h2>{resolvedAppName}</h2>
            <p>{subtitle}</p>
          </div>

          <div className="w3-loader-bar" aria-hidden="true">
            <div className="w3-loader-bar-fill" />
          </div>

          <div className="w3-loader-hint">
            <i className="fa-regular fa-circle-check me-1" />
            {" "}
            {hint}
          </div>
        </div>
      </div>
    </>
  );
});

export default Overlay;
