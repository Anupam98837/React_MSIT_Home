import { memo, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router";

const pageNotFoundStyles = `
.pnf2-wrap{ width:100%; padding:12px; }
.pnf2-card{
  width:100%;
  border-radius: 18px;
  border: 1px solid var(--line-strong, #e6c8ca);
  background: var(--surface, #fff);
  box-shadow: var(--shadow-2, 0 8px 22px rgba(0,0,0,.08));
  overflow:hidden;
}
.pnf2-grid{
  display:grid;
  grid-template-columns: 1fr;
}
@media (min-width: 860px){
  .pnf2-grid{ grid-template-columns: 420px 1fr; }
}
.pnf2-visual{
  position:relative;
  padding: 22px;
  min-height: 220px;
  background:
    radial-gradient(circle at 20% 10%,
      color-mix(in oklab, var(--accent-color,#C94B50) 28%, transparent),
      transparent 55%),
    radial-gradient(circle at 80% 90%,
      color-mix(in oklab, var(--primary-color,#9E363A) 18%, transparent),
      transparent 60%),
    linear-gradient(135deg,
      color-mix(in oklab, var(--primary-color,#9E363A) 10%, #ffffff 90%),
      #ffffff);
  border-bottom: 1px solid var(--line-strong, #e6c8ca);
}
@media (min-width: 860px){
  .pnf2-visual{ border-bottom:0; border-right:1px solid var(--line-strong,#e6c8ca); }
}
.pnf2-badge{
  position:relative;
  display:flex;
  flex-direction:column;
  gap:10px;
  z-index:2;
}
.pnf2-num{
  font-weight: 950;
  letter-spacing: .02em;
  font-size: 56px;
  line-height: 1;
  color: color-mix(in oklab, var(--primary-color,#9E363A) 80%, #0f172a 20%);
}
.pnf2-chip{
  display:inline-flex;
  align-items:center;
  gap:8px;
  width:max-content;
  padding:8px 12px;
  border-radius:999px;
  border:1px solid rgba(0,0,0,.08);
  background: rgba(255,255,255,.7);
  backdrop-filter: blur(8px);
  font-weight: 800;
  color: var(--ink,#0f172a);
}
.pnf2-blob{
  position:absolute;
  right:-40px;
  top: -30px;
  width: 220px;
  height: 220px;
  border-radius: 48% 52% 58% 42% / 52% 40% 60% 48%;
  background:
    radial-gradient(circle at 30% 30%,
      color-mix(in oklab, var(--accent-color,#C94B50) 55%, transparent),
      transparent 60%),
    radial-gradient(circle at 70% 70%,
      color-mix(in oklab, var(--primary-color,#9E363A) 45%, transparent),
      transparent 65%);
  filter: blur(1px);
  opacity: .95;
  animation: pnf2-float 5.2s ease-in-out infinite;
}
@keyframes pnf2-float{
  0%,100%{ transform: translateY(0) rotate(0deg) }
  50%{ transform: translateY(10px) rotate(6deg) }
}
.pnf2-lines{
  position:absolute;
  left: 22px;
  bottom: 18px;
  display:flex;
  gap:10px;
  z-index:1;
  opacity:.55;
}
.pnf2-lines span{
  display:block;
  width: 46px;
  height: 6px;
  border-radius: 999px;
  background: color-mix(in oklab, var(--primary-color,#9E363A) 40%, #0f172a 60%);
}
.pnf2-lines span:nth-child(2){ width: 28px; opacity:.75; }
.pnf2-lines span:nth-child(3){ width: 62px; opacity:.45; }
.pnf2-content{ padding: 20px 18px; text-align:left; }
@media (min-width: 860px){ .pnf2-content{ padding: 26px 26px; } }
.pnf2-brand{
  display:flex;
  align-items:center;
  gap:12px;
  margin-bottom: 10px;
}
.pnf2-mark{
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display:flex;
  align-items:center;
  justify-content:center;
  background: color-mix(in oklab, var(--primary-color,#9E363A) 12%, #ffffff 88%);
  border: 1px solid rgba(0,0,0,.08);
  color: var(--primary-color,#9E363A);
  font-size: 18px;
}
.pnf2-app{ font-weight: 950; letter-spacing:.01em; }
.pnf2-tag{ font-size: .88rem; color: var(--muted-color,#6b7280); margin-top: 1px; }
.pnf2-title{
  margin: 8px 0 0;
  font-size: 1.35rem;
  font-weight: 950;
  color: var(--ink,#0f172a);
}
.pnf2-sub{
  margin: 10px 0 0;
  color: var(--muted-color,#6b7280);
  line-height: 1.5;
  font-size: var(--fs-13, .95rem);
}
.pnf2-sub code{
  background: rgba(0,0,0,.06);
  border-radius: 10px;
  padding: 2px 8px;
}
html.theme-dark .pnf2-sub code{ background: rgba(255,255,255,.08); }
.pnf2-actions{
  margin-top: 16px;
  display:flex;
  flex-wrap:wrap;
  gap:10px;
}
.pnf2-btn{
  display:inline-flex;
  align-items:center;
  gap:8px;
  padding: 10px 14px;
  border-radius: 14px;
  border:1px solid var(--line-strong, rgba(148,163,184,.45));
  background: var(--surface,#fff);
  color: var(--ink,#0f172a);
  font-weight: 900;
  text-decoration:none;
  cursor:pointer;
  transition: transform .18s ease, box-shadow .18s ease, opacity .18s ease;
}
.pnf2-btn:hover{ transform: translateY(-1px); box-shadow: var(--shadow-2, 0 8px 22px rgba(0,0,0,.08)); }
.pnf2-btn i{ width:18px; text-align:center; }
.pnf2-btn-primary{
  background: var(--primary-color,#9E363A);
  color:#fff;
  border-color: rgba(255,255,255,.14);
}
.pnf2-btn-primary:hover{ opacity:.95; }
.pnf2-btn-ghost{
  background: transparent;
  border-style:dashed;
}
.pnf2-help{
  margin-top: 14px;
  display:grid;
  gap:8px;
}
.pnf2-helpitem{
  display:flex;
  align-items:center;
  gap:10px;
  color: var(--muted-color,#6b7280);
  font-size: .9rem;
}
.pnf2-helpitem i{ color: color-mix(in oklab, var(--accent-color,#C94B50) 70%, #0f172a 30%); }
html.theme-dark .pnf2-card{
  background:#020617;
  border-color: rgba(148,163,184,0.6);
}
html.theme-dark .pnf2-visual{
  background:
    radial-gradient(circle at 20% 10%, rgba(201,75,80,.18), transparent 55%),
    radial-gradient(circle at 80% 90%, rgba(158,54,58,.14), transparent 60%),
    linear-gradient(135deg, rgba(255,255,255,.05), rgba(255,255,255,.02));
  border-color: rgba(148,163,184,0.35);
}
html.theme-dark .pnf2-chip{
  background: rgba(2,6,23,.55);
  border-color: rgba(148,163,184,.35);
  color:#e5e7eb;
}
html.theme-dark .pnf2-mark{
  background: rgba(255,255,255,.06);
  border-color: rgba(148,163,184,.35);
}
html.theme-dark .pnf2-title{ color:#e5e7eb; }
html.theme-dark .pnf2-tag,
html.theme-dark .pnf2-sub,
html.theme-dark .pnf2-helpitem{ color:#9ca3af; }
html.theme-dark .pnf2-btn{
  background:#0b1220;
  border-color: rgba(148,163,184,.35);
  color:#e5e7eb;
}
html.theme-dark .pnf2-btn-ghost{ background: transparent; }
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

const PageNotFound = memo(function PageNotFound({
  slug = "",
  appName,
  homeHref = "/",
  contactHref = "/contact-us",
}) {
  const navigate = useNavigate();
  const resolvedAppName = useMemo(() => appName || resolveAppName(), [appName]);
  const requestedSlug = String(slug || "").trim();

  const handleBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(homeHref);
  }, [homeHref, navigate]);

  return (
    <>
      <style>{pageNotFoundStyles}</style>
      <div className="pnf2-wrap" role="alert" aria-live="polite">
        <div className="pnf2-card">
          <div className="pnf2-grid">
            <div className="pnf2-visual" aria-hidden="true">
              <div className="pnf2-badge">
                <span className="pnf2-num">404</span>
                <span className="pnf2-chip">
                  <i className="fa-solid fa-triangle-exclamation" />
                  Not Found
                </span>
              </div>

              <div className="pnf2-blob" />

              <div className="pnf2-lines">
                <span />
                <span />
                <span />
              </div>
            </div>

            <div className="pnf2-content">
              <div className="pnf2-brand">
                <div className="pnf2-mark" aria-hidden="true">
                  <i className="fa-solid fa-layer-group" />
                </div>
                <div className="pnf2-brandtext">
                  <div className="pnf2-app">{resolvedAppName}</div>
                  <div className="pnf2-tag">The page you requested is unavailable</div>
                </div>
              </div>

              <h2 className="pnf2-title">We can’t find that page.</h2>

              <p className="pnf2-sub">
                The link may be broken, the page may have been moved, or you might not have access.
                {requestedSlug ? (
                  <span className="pnf2-slug" style={{ display: "inline" }}>
                    {" "}
                    Requested: <code>{requestedSlug}</code>
                  </span>
                ) : null}
              </p>

              <div className="pnf2-actions">
                <Link to={homeHref} className="pnf2-btn pnf2-btn-primary">
                  <i className="fa-solid fa-house" />
                  <span>Go Home</span>
                </Link>

                <button type="button" className="pnf2-btn" onClick={handleBack}>
                  <i className="fa-solid fa-arrow-left" />
                  <span>Go Back</span>
                </button>

                <Link to={contactHref} className="pnf2-btn pnf2-btn-ghost">
                  <i className="fa-solid fa-headset" />
                  <span>Contact</span>
                </Link>
              </div>

              <div className="pnf2-help">
                <div className="pnf2-helpitem">
                  <i className="fa-regular fa-circle-check" />
                  <span>Tip: check the URL for typos.</span>
                </div>
                <div className="pnf2-helpitem">
                  <i className="fa-regular fa-life-ring" />
                  <span>If you think it’s a bug, contact support.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

export default PageNotFound;
