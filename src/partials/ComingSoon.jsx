import { memo, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router";

const comingSoonStyles = `
.cs2-wrap{ width:100%; padding:12px; }
.cs2-card{
  width:100%;
  border-radius: 18px;
  border: 1px solid var(--line-strong, #e6c8ca);
  background: var(--surface, #fff);
  box-shadow: var(--shadow-2, 0 8px 22px rgba(0,0,0,.08));
  overflow:hidden;
}
.cs2-grid{ display:grid; grid-template-columns: 1fr; }
@media (min-width: 860px){
  .cs2-grid{ grid-template-columns: 420px 1fr; }
}
.cs2-visual{
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
  .cs2-visual{ border-bottom:0; border-right:1px solid var(--line-strong,#e6c8ca); }
}
.cs2-badge{
  position:relative;
  display:flex;
  flex-direction:column;
  gap:10px;
  z-index:2;
}
.cs2-num{
  font-weight: 950;
  letter-spacing: .02em;
  font-size: 56px;
  line-height: 1;
  color: color-mix(in oklab, var(--primary-color,#9E363A) 80%, #0f172a 20%);
}
.cs2-chip{
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
.cs2-blob{
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
  animation: cs2-float 5.2s ease-in-out infinite;
}
@keyframes cs2-float{
  0%,100%{ transform: translateY(0) rotate(0deg) }
  50%{ transform: translateY(10px) rotate(6deg) }
}
.cs2-lines{
  position:absolute;
  left: 22px;
  bottom: 18px;
  display:flex;
  gap:10px;
  z-index:1;
  opacity:.55;
}
.cs2-lines span{
  display:block;
  width: 46px;
  height: 6px;
  border-radius: 999px;
  background: color-mix(in oklab, var(--primary-color,#9E363A) 40%, #0f172a 60%);
}
.cs2-lines span:nth-child(2){ width: 28px; opacity:.75; }
.cs2-lines span:nth-child(3){ width: 62px; opacity:.45; }
.cs2-content{ padding: 20px 18px; text-align:left; }
@media (min-width: 860px){ .cs2-content{ padding: 26px 26px; } }
.cs2-brand{
  display:flex;
  align-items:center;
  gap:12px;
  margin-bottom: 10px;
}
.cs2-mark{
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
.cs2-app{ font-weight: 950; letter-spacing:.01em; }
.cs2-tag{ font-size: .88rem; color: var(--muted-color,#6b7280); margin-top: 1px; }
.cs2-title{
  margin: 8px 0 0;
  font-size: 1.35rem;
  font-weight: 950;
  color: var(--ink,#0f172a);
}
.cs2-sub{
  margin: 10px 0 0;
  color: var(--muted-color,#6b7280);
  line-height: 1.5;
  font-size: var(--fs-13, .95rem);
}
.cs2-sub code{
  background: rgba(0,0,0,.06);
  border-radius: 10px;
  padding: 2px 8px;
}
html.theme-dark .cs2-sub code{ background: rgba(255,255,255,.08); }
.cs2-actions{
  margin-top: 16px;
  display:flex;
  flex-wrap:wrap;
  gap:10px;
}
.cs2-btn{
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
.cs2-btn:hover{ transform: translateY(-1px); box-shadow: var(--shadow-2, 0 8px 22px rgba(0,0,0,.08)); }
.cs2-btn i{ width:18px; text-align:center; }
.cs2-btn-primary{
  background: var(--primary-color,#9E363A);
  color:#fff;
  border-color: rgba(255,255,255,.14);
}
.cs2-btn-primary:hover{ opacity:.95; }
.cs2-btn-ghost{
  background: transparent;
  border-style:dashed;
}
.cs2-help{
  margin-top: 14px;
  display:grid;
  gap:8px;
}
.cs2-helpitem{
  display:flex;
  align-items:center;
  gap:10px;
  color: var(--muted-color,#6b7280);
  font-size: .9rem;
}
.cs2-helpitem i{ color: color-mix(in oklab, var(--accent-color,#C94B50) 70%, #0f172a 30%); }
html.theme-dark .cs2-card{
  background:#020617;
  border-color: rgba(148,163,184,0.6);
}
html.theme-dark .cs2-visual{
  background:
    radial-gradient(circle at 20% 10%, rgba(201,75,80,.18), transparent 55%),
    radial-gradient(circle at 80% 90%, rgba(158,54,58,.14), transparent 60%),
    linear-gradient(135deg, rgba(255,255,255,.05), rgba(255,255,255,.02));
  border-color: rgba(148,163,184,0.35);
}
html.theme-dark .cs2-chip{
  background: rgba(2,6,23,.55);
  border-color: rgba(148,163,184,.35);
  color:#e5e7eb;
}
html.theme-dark .cs2-mark{
  background: rgba(255,255,255,.06);
  border-color: rgba(148,163,184,.35);
}
html.theme-dark .cs2-title{ color:#e5e7eb; }
html.theme-dark .cs2-tag,
html.theme-dark .cs2-sub,
html.theme-dark .cs2-helpitem{ color:#9ca3af; }
html.theme-dark .cs2-btn{
  background:#0b1220;
  border-color: rgba(148,163,184,.35);
  color:#e5e7eb;
}
html.theme-dark .cs2-btn-ghost{ background: transparent; }
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

const ComingSoon = memo(function ComingSoon({
  slug = "",
  appName,
  homeHref = "/",
  menuHref = "#sidebarCard",
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
      <style>{comingSoonStyles}</style>
      <div className="cs2-wrap" role="status" aria-live="polite">
        <div className="cs2-card">
          <div className="cs2-grid">
            <div className="cs2-visual" aria-hidden="true">
              <div className="cs2-badge">
                <span className="cs2-num">Soon</span>
                <span className="cs2-chip">
                  <i className="fa-solid fa-hourglass-half" />
                  Coming Soon
                </span>
              </div>

              <div className="cs2-blob" />

              <div className="cs2-lines">
                <span />
                <span />
                <span />
              </div>
            </div>

            <div className="cs2-content">
              <div className="cs2-brand">
                <div className="cs2-mark" aria-hidden="true">
                  <i className="fa-solid fa-wand-magic-sparkles" />
                </div>
                <div className="cs2-brandtext">
                  <div className="cs2-app">{resolvedAppName}</div>
                  <div className="cs2-tag">This section is being prepared</div>
                </div>
              </div>

              <h2 className="cs2-title">This page is coming soon.</h2>

              <p className="cs2-sub">
                The submenu destination isn’t available yet. It may still be under development or awaiting content approval.
                {requestedSlug ? (
                  <span className="cs2-slug" style={{ display: "inline" }}>
                    {" "}
                    Requested: <code>{requestedSlug}</code>
                  </span>
                ) : null}
              </p>

              <div className="cs2-actions">
                <Link to={homeHref} className="cs2-btn cs2-btn-primary">
                  <i className="fa-solid fa-house" />
                  <span>Go Home</span>
                </Link>

                <button type="button" className="cs2-btn" onClick={handleBack}>
                  <i className="fa-solid fa-arrow-left" />
                  <span>Go Back</span>
                </button>

                <a href={menuHref} className="cs2-btn cs2-btn-ghost">
                  <i className="fa-solid fa-layer-group" />
                  <span>Explore Menu</span>
                </a>
              </div>

              <div className="cs2-help">
                <div className="cs2-helpitem">
                  <i className="fa-regular fa-circle-check" />
                  <span>Try another submenu from the left list.</span>
                </div>
                <div className="cs2-helpitem">
                  <i className="fa-regular fa-life-ring" />
                  <span>If you need this urgently, contact support.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

export default ComingSoon;
