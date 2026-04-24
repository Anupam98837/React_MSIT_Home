import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProgramToppersDepartments,
  fetchProgramToppersList,
  selectProgramToppersDepartments,
  selectProgramToppersDepartmentsError,
  selectProgramToppersDepartmentsStatus,
  selectProgramToppersError,
  selectProgramToppersItems,
  selectProgramToppersStatus,
} from "../../redux/crm/programToppersSlice";

const PAGE_SIZE = 12;
const ORIGIN =
  typeof window !== "undefined"
    ? window.location.origin.replace(/\/+$/, "")
    : "";

const styles = String.raw`
.ptp-wrap{
  --ptp-brand: var(--primary-color, #9E363A);
  --ptp-ink: #0f172a;
  --ptp-muted: #64748b;
  --ptp-bg: var(--page-bg, #ffffff);
  --ptp-card: var(--surface, #ffffff);
  --ptp-line: var(--line-soft, rgba(15,23,42,.10));
  --ptp-shadow: 0 10px 24px rgba(2,6,23,.08);

  --ptp-card-w: 247px;
  --ptp-card-h: 329px;
  --ptp-radius: 18px;

  max-width: 1320px;
  margin: 18px auto 54px;
  padding: 0 12px;
  background: transparent;
  position: relative;
  overflow: visible;
}

/* Header */
.ptp-head{
  background: var(--ptp-card);
  border: 1px solid var(--ptp-line);
  border-radius: 16px;
  box-shadow: var(--ptp-shadow);
  padding: 14px 16px;
  margin-bottom: 16px;

  display:flex;
  gap: 12px;
  align-items:center;
  justify-content:stretch;
  min-width: 0;
}

/* Tools row only */
.ptp-tools{
  display:flex;
  gap: 10px;
  align-items:center;
  flex-wrap: nowrap;
  width: 100%;
  min-width: 0;
  justify-content: space-between;
}
.ptp-tools > *{ min-width: 0; }

/* Search */
.ptp-search{
  position: relative;
  min-width: 0;
  flex: 1 1 auto;
  width: auto;
  max-width: none;
}
.ptp-search i{
  position:absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  opacity: .65;
  color: var(--ptp-muted);
  pointer-events:none;
}
.ptp-search input{
  width:100%;
  height: 42px;
  border-radius: 999px;
  padding: 11px 12px 11px 42px;
  border: 1px solid var(--ptp-line);
  background: var(--ptp-card);
  color: var(--ptp-ink);
  outline: none;
  min-width: 0;
}
.ptp-search input:focus{
  border-color: rgba(201,75,80,.55);
  box-shadow: 0 0 0 4px rgba(201,75,80,.18);
}

/* Dept dropdown */
.ptp-select{
  position: relative;
  min-width: 0;
  flex: 0 0 clamp(220px, 30vw, 360px);
  width: clamp(220px, 30vw, 360px);
  max-width: 360px;
}
.ptp-select__icon{
  position:absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  opacity: .70;
  color: var(--ptp-muted);
  pointer-events:none;
  font-size: 14px;
}
.ptp-select__caret{
  position:absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  opacity: .70;
  color: var(--ptp-muted);
  pointer-events:none;
  font-size: 12px;
}
.ptp-select select{
  width: 100%;
  height: 42px;
  border-radius: 999px;
  padding: 10px 38px 10px 42px;
  border: 1px solid var(--ptp-line);
  background: var(--ptp-card);
  color: var(--ptp-ink);
  outline: none;

  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  display:block;
  min-width:0;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.ptp-select select:focus{
  border-color: rgba(201,75,80,.55);
  box-shadow: 0 0 0 4px rgba(201,75,80,.18);
}

/* Grid */
.ptp-grid{
  display:grid;
  grid-template-columns: repeat(auto-fill, var(--ptp-card-w));
  gap: 18px;
  align-items: start;
  justify-content: center;
}

/* Card */
.ptp-card{
  position: relative;
  width: var(--ptp-card-w);
  height: var(--ptp-card-h);
  border-radius: var(--ptp-radius);
  overflow:hidden;
  display:block;
  text-decoration:none !important;
  color: inherit;
  background: #fff;
  border: 1px solid rgba(2,6,23,.08);
  box-shadow: 0 12px 26px rgba(0,0,0,.10);
  transform: translateZ(0);
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
  cursor:pointer;
}
.ptp-card:hover{
  transform: translateY(-4px);
  box-shadow: 0 18px 42px rgba(0,0,0,.16);
  border-color: rgba(158,54,58,.22);
}

.ptp-card .bg{
  position:absolute; inset:0;
  background-size: cover;
  background-position: center;
  filter: saturate(1.02);
  transform: scale(1.0001);
}
.ptp-card .vignette{
  position:absolute; inset:0;
  background:
    radial-gradient(1200px 500px at 50% -20%, rgba(255,255,255,.10), rgba(0,0,0,0) 60%),
    linear-gradient(180deg, rgba(0,0,0,.00) 28%, rgba(0,0,0,.12) 60%, rgba(0,0,0,.62) 100%);
}

.ptp-card .info{
  position:absolute;
  left: 14px;
  right: 14px;
  bottom: 14px;
  z-index: 2;
}
.ptp-name{
  margin:0;
  font-size: 18px;
  font-weight: 950;
  line-height: 1.12;
  color: #fff;
  text-shadow: 0 6px 16px rgba(0,0,0,.35);
}
.ptp-meta{
  margin: 7px 0 0;
  font-size: 13px;
  font-weight: 800;
  color: rgba(255,255,255,.90);
  text-shadow: 0 6px 16px rgba(0,0,0,.35);
  line-height: 1.2;
}
.ptp-meta .dot{ opacity:.85; padding:0 6px; }
.ptp-submeta{
  margin: 7px 0 0;
  font-size: 12.5px;
  color: rgba(255,255,255,.82);
  text-shadow: 0 6px 16px rgba(0,0,0,.35);
  line-height: 1.2;
}

.ptp-pill{
  position:absolute;
  top: 12px;
  left: 12px;
  z-index: 2;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 900;
  letter-spacing:.15px;
  color:#fff;
  background: rgba(0,0,0,.28);
  border: 1px solid rgba(255,255,255,.20);
  backdrop-filter: blur(6px);
  max-width: calc(100% - 24px);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ptp-yearpill{
  position:absolute;
  top: 44px;
  left: 12px;
  z-index: 2;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 900;
  letter-spacing:.15px;
  color:#fff;
  background: rgba(0,0,0,.24);
  border: 1px solid rgba(255,255,255,.18);
  backdrop-filter: blur(6px);
  max-width: calc(100% - 24px);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ptp-rank{
  position:absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 950;
  letter-spacing:.15px;
  color:#1a1a2e;
  background: rgba(255,255,255,.92);
  border: 1px solid rgba(255,255,255,.35);
  backdrop-filter: blur(6px);
  box-shadow: 0 8px 18px rgba(0,0,0,.14);
}

/* Placeholder */
.ptp-placeholder{
  position:absolute; inset:0;
  display:grid; place-items:center;
  background:
    radial-gradient(800px 360px at 20% 10%, rgba(158,54,58,.20), transparent 60%),
    radial-gradient(900px 400px at 80% 90%, rgba(158,54,58,.14), transparent 60%),
    linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.82));
}
.ptp-initials{
  width: 86px; height: 86px;
  border-radius: 24px;
  display:grid; place-items:center;
  font-weight: 950;
  font-size: 28px;
  color: var(--ptp-brand);
  background: rgba(158,54,58,.12);
  border: 1px solid rgba(158,54,58,.25);
}

/* State / empty */
.ptp-state{
  background: var(--ptp-card);
  border: 1px solid var(--ptp-line);
  border-radius: 16px;
  box-shadow: var(--ptp-shadow);
  padding: 18px;
  color: var(--ptp-muted);
  text-align:center;
}

/* Skeleton */
.ptp-skeleton{
  display:grid;
  grid-template-columns: repeat(auto-fill, var(--ptp-card-w));
  gap: 18px;
  justify-content: center;
}
.ptp-sk{
  border-radius: var(--ptp-radius);
  border: 1px solid var(--ptp-line);
  background: #fff;
  overflow:hidden;
  position:relative;
  box-shadow: 0 10px 24px rgba(2,6,23,.08);
  height: var(--ptp-card-h);
}
.ptp-sk:before{
  content:'';
  position:absolute; inset:0;
  transform: translateX(-60%);
  background: linear-gradient(90deg, transparent, rgba(148,163,184,.22), transparent);
  animation: ptpSkMove 1.15s ease-in-out infinite;
}
@keyframes ptpSkMove{ to{ transform: translateX(60%);} }

/* Pagination */
.ptp-pagination{
  display:flex;
  justify-content:center;
  margin-top: 18px;
}
.ptp-pagination .ptp-pager{
  display:flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items:center;
  justify-content:center;
  padding: 10px;
}
.ptp-pagebtn{
  border:1px solid var(--ptp-line);
  background: var(--ptp-card);
  color: var(--ptp-ink);
  border-radius: 12px;
  padding: 9px 12px;
  font-size: 13px;
  font-weight: 950;
  box-shadow: 0 8px 18px rgba(2,6,23,.06);
  cursor:pointer;
  user-select:none;
}
.ptp-pagebtn:hover{ background: rgba(2,6,23,.03); }
.ptp-pagebtn[disabled]{ opacity:.55; cursor:not-allowed; }
.ptp-pagebtn.active{
  background: rgba(201,75,80,.12);
  border-color: rgba(201,75,80,.35);
  color: var(--ptp-brand);
}

@media (max-width: 1200px){
  .ptp-head{ flex-wrap: wrap; align-items: flex-end; }
  .ptp-tools{
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  .ptp-search{ flex: 1 1 340px; }
  .ptp-select{
    flex: 1 1 280px;
    width: auto;
    max-width: none;
  }
}
@media (max-width: 992px){
  .ptp-head{ flex-wrap: wrap; align-items: flex-end; }
  .ptp-tools{ flex-wrap: wrap; }
}
@media (max-width: 640px){
  .ptp-search{ min-width: 220px; flex: 1 1 240px; }
  .ptp-select{ min-width: 220px; flex: 1 1 240px; }
}

/* ===== Modal ===== */
.ptp-modal{
  position: fixed;
  inset: 0;
  display:none;
  z-index: 9999;
}
.ptp-modal.show{ display:flex; align-items:center; justify-content:center; }

.ptp-modal__overlay{
  position:fixed; inset:0;
  background: rgba(0,0,0,.72);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.ptp-modal__panel{
  position:relative;
  width: min(1060px, calc(100% - 32px));
  max-height: calc(100vh - 48px);
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 32px 80px rgba(0,0,0,.35), 0 0 0 1px rgba(255,255,255,.08);
  overflow:hidden;
  opacity: 0;
  transform: translateY(16px) scale(.97);
  transition: transform .28s cubic-bezier(.22,1,.36,1), opacity .22s ease;
  display: flex;
  flex-direction: row;
}
.ptp-modal.show .ptp-modal__panel{
  opacity: 1;
  transform: translateY(0) scale(1);
}

.ptp-modal__close{
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 20;
  width: 42px; height: 42px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,.92);
  color: #1e293b;
  cursor:pointer;
  box-shadow: 0 4px 16px rgba(0,0,0,.18);
  display:grid;
  place-items:center;
  font-size: 16px;
  transition: background .15s, transform .15s;
}
.ptp-modal__close:hover{
  background: #fff;
  transform: scale(1.08);
}

.ptp-modal__hero{
  flex: 0 0 420px;
  position: relative;
  background: #1a1a2e;
  overflow: hidden;
  min-height: 520px;
}
.ptp-modal__hero-img{
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  display: block;
}
.ptp-modal__hero-grad{
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg,
      rgba(0,0,0,0) 0%,
      rgba(0,0,0,0) 40%,
      rgba(0,0,0,.55) 75%,
      rgba(0,0,0,.82) 100%
    );
  pointer-events: none;
}
.ptp-modal__hero-info{
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 28px 26px;
  z-index: 3;
}
.ptp-modal__hero-name{
  margin: 0;
  font-size: 30px;
  font-weight: 900;
  color: #fff;
  line-height: 1.15;
  letter-spacing: -.2px;
  text-shadow: 0 2px 20px rgba(0,0,0,.4);
}
.ptp-modal__hero-sub{
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255,255,255,.88);
  text-shadow: 0 2px 12px rgba(0,0,0,.35);
}
.ptp-modal__hero-sub .sep{
  opacity: .5;
  font-size: 10px;
}
.ptp-modal__hero-quote{
  margin-top: 14px;
  font-size: 13.5px;
  font-style: italic;
  color: rgba(255,255,255,.78);
  line-height: 1.4;
  text-shadow: 0 2px 12px rgba(0,0,0,.35);
  max-width: 360px;
}

.ptp-modal__hero-placeholder{
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse at 30% 20%, rgba(158,54,58,.25), transparent 60%),
    radial-gradient(ellipse at 70% 80%, rgba(158,54,58,.18), transparent 60%),
    linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%);
}
.ptp-modal__hero-initials{
  width: 120px; height: 120px;
  border-radius: 32px;
  display:grid; place-items:center;
  font-weight: 950;
  font-size: 44px;
  color: rgba(255,255,255,.85);
  background: rgba(255,255,255,.08);
  border: 2px solid rgba(255,255,255,.12);
  backdrop-filter: blur(4px);
}

.ptp-modal__details{
  flex: 1;
  overflow-y: auto;
  padding: 0;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 48px);
}
.ptp-modal__dhead{
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 18px 24px 14px;
  background: rgba(255,255,255,.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(15,23,42,.06);
}
.ptp-modal__dhead-name{
  margin: 0;
  font-size: 22px;
  font-weight: 900;
  color: #0f172a;
  line-height: 1.2;
}
.ptp-modal__dhead-tagline{
  margin-top: 4px;
  font-size: 13.5px;
  font-weight: 600;
  color: #64748b;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  align-items: center;
}
.ptp-modal__dhead-tagline .tsep{
  opacity: .45;
  font-size: 8px;
}
.ptp-modal__dcontent{
  flex: 1;
  padding: 16px 24px 28px;
}

.ptp-msection{ margin-top: 20px; }
.ptp-msection:first-child{ margin-top: 0; }
.ptp-msection-title{
  font-size: 11.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .8px;
  color: #94a3b8;
  margin: 0 0 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(15,23,42,.06);
}

.ptp-mrow{
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.ptp-mfield{
  padding: 10px 12px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid rgba(15,23,42,.05);
  transition: background .12s;
}
.ptp-mfield:hover{ background: #f1f5f9; }
.ptp-mfield-label{
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: #94a3b8;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.ptp-mfield-label i{
  color: var(--ptp-brand, #9E363A);
  font-size: 11px;
  opacity: .85;
}
.ptp-mfield-val{
  font-size: 13.5px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.3;
  word-break: break-word;
}
.ptp-mfield-full{ grid-column: 1 / -1; }

.ptp-mchips{ display:flex; flex-wrap: wrap; gap: 6px; margin-top: 2px; }
.ptp-mchip{
  display:inline-flex;
  align-items:center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  color: #475569;
  background: #fff;
  border: 1px solid #e2e8f0;
}
.ptp-mchip i{ color: var(--ptp-brand, #9E363A); font-size: 10px; }

.ptp-mnote{
  margin-top: 8px;
  padding: 14px 16px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(158,54,58,.04), rgba(158,54,58,.08));
  border: 1px solid rgba(158,54,58,.12);
  grid-column: 1 / -1;
}
.ptp-mnote-label{
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: var(--ptp-brand, #9E363A);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.ptp-mnote-val{
  font-size: 13.5px;
  font-weight: 600;
  color: #334155;
  line-height: 1.5;
  white-space: pre-wrap;
  font-style: italic;
}

@media (max-width: 860px){
  .ptp-modal__panel{
    flex-direction: column;
    max-height: calc(100vh - 32px);
    width: min(560px, calc(100% - 24px));
  }
  .ptp-modal__hero{
    flex: 0 0 auto;
    min-height: 320px;
    max-height: 380px;
  }
  .ptp-modal__details{ max-height: none; }
  .ptp-modal__close{
    background: rgba(0,0,0,.45);
    color: #fff;
    box-shadow: 0 4px 16px rgba(0,0,0,.25);
  }
  .ptp-modal__close:hover{
    background: rgba(0,0,0,.6);
    color: #fff;
  }
}
@media (max-width: 560px){
  .ptp-modal__hero{ min-height: 260px; max-height: 300px; }
  .ptp-modal__hero-name{ font-size: 24px; }
  .ptp-modal__dhead{ padding: 14px 16px 12px; }
  .ptp-modal__dhead-name{ font-size: 18px; }
  .ptp-modal__dcontent{ padding: 14px 16px 24px; }
  .ptp-mrow{ grid-template-columns: 1fr; }
}

/* Dark mode */
html.theme-dark .ptp-modal__panel{ background: #0f172a; }
html.theme-dark .ptp-modal__close{
  background: rgba(15,23,42,.85);
  color: #e2e8f0;
  box-shadow: 0 4px 16px rgba(0,0,0,.35);
}
html.theme-dark .ptp-modal__close:hover{ background: rgba(15,23,42,.95); }
html.theme-dark .ptp-modal__dhead{
  background: rgba(15,23,42,.95);
  border-bottom-color: rgba(255,255,255,.06);
}
html.theme-dark .ptp-modal__dhead-name{ color: #f1f5f9; }
html.theme-dark .ptp-modal__dhead-tagline{ color: #94a3b8; }
html.theme-dark .ptp-mfield{
  background: rgba(255,255,255,.04);
  border-color: rgba(255,255,255,.06);
}
html.theme-dark .ptp-mfield:hover{ background: rgba(255,255,255,.07); }
html.theme-dark .ptp-mfield-label{ color: #64748b; }
html.theme-dark .ptp-mfield-val{ color: #e2e8f0; }
html.theme-dark .ptp-msection-title{ color: #475569; border-bottom-color: rgba(255,255,255,.06); }
html.theme-dark .ptp-mchip{
  background: rgba(255,255,255,.06);
  border-color: rgba(255,255,255,.08);
  color: #cbd5e1;
}
html.theme-dark .ptp-mnote{
  background: linear-gradient(135deg, rgba(158,54,58,.08), rgba(158,54,58,.14));
  border-color: rgba(158,54,58,.2);
}
html.theme-dark .ptp-mnote-val{ color: #cbd5e1; }

.dynamic-navbar .navbar-nav .dropdown-menu{
  position: absolute !important;
  inset: auto !important;
}
.dynamic-navbar .dropdown-menu.is-portaled{
  position: fixed !important;
}
`;

const esc = (str) =>
  (str ?? "").toString().replace(/[&<>"']/g, (s) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[s]));

const escAttr = (str) => (str ?? "").toString().replace(/"/g, "&quot;");

const normalizeUrl = (url) => {
  const u = (url || "").toString().trim();
  if (!u) return "";
  if (/^(data:|blob:|https?:\/\/|mailto:|tel:)/i.test(u)) return u;
  if (u.startsWith("//")) return "https:" + u;
  if (u.startsWith("/")) return ORIGIN + u;
  if (u.includes(".") && !u.includes(" ")) return "https://" + u.replace(/^\/+/, "");
  return ORIGIN + "/" + u.replace(/^\/+/, "");
};

const pick = (obj, keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== null && v !== undefined && String(v).trim() !== "") return v;
  }
  return "";
};

const initials = (name) => {
  const n = (name || "").trim();
  if (!n) return "TP";
  const parts = n.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((p) => p[0].toUpperCase()).join("");
};

const ordinal = (n) => {
  const x = parseInt(n, 10);
  if (!x || Number.isNaN(x)) return "";
  const v = x % 100;
  if (v >= 11 && v <= 13) return x + "th";
  switch (x % 10) {
    case 1:
      return x + "st";
    case 2:
      return x + "nd";
    case 3:
      return x + "rd";
    default:
      return x + "th";
  }
};

const format2 = (v) => {
  const s = (v ?? "").toString().trim();
  if (!s) return "";
  const num = Number(s);
  if (Number.isFinite(num)) return num.toFixed(2);
  return s;
};

const getMeta = (item) => {
  const meta = item?.metadata;
  if (meta && typeof meta === "object") return meta;
  if (typeof meta === "string") {
    try {
      return JSON.parse(meta);
    } catch {
      return {};
    }
  }
  return {};
};

const resolveName = (item) =>
  String(
    pick(item, ["user_name", "topper_name", "name", "full_name", "student_name"]) ||
      pick(item?.user, ["name", "full_name", "username"]) ||
      "Topper"
  );

const resolveDepartmentName = (item) =>
  String(
    pick(item, ["department_title", "department_name"]) ||
      pick(item?.department, ["title", "name"]) ||
      ""
  );

const resolveDepartmentId = (item) =>
  String(
    pick(item, ["department_id", "dept_id"]) ||
      pick(item?.department, ["id"]) ||
      ""
  );

const resolveDepartmentUuid = (item) =>
  String(
    pick(item, ["department_uuid", "dept_uuid"]) ||
      pick(item?.department, ["uuid"]) ||
      ""
  );

const resolveProgram = (item) =>
  String(pick(item, ["program", "degree", "course"]) || pick(getMeta(item), ["program", "degree"]) || "");

const resolveSpecialization = (item) =>
  String(pick(item, ["specialization", "branch", "stream"]) || pick(getMeta(item), ["specialization", "branch"]) || "");

const resolveAdmissionYear = (item) =>
  String(
    pick(item, ["admission_year", "start_year", "joining_year", "batch_start_year"]) ||
      pick(getMeta(item), ["admission_year", "start_year"]) ||
      ""
  );

const resolvePassingYear = (item) =>
  String(
    pick(item, ["passing_year", "passout_year", "graduation_year", "completion_year", "batch_end_year"]) ||
      pick(getMeta(item), ["passing_year", "passout_year"]) ||
      ""
  );

const resolveYearTopper = (item) =>
  String(pick(item, ["year_topper", "topper_year", "year_of_topper"]) || pick(getMeta(item), ["year_topper", "topper_year"]) || "");

const resolveYGPA = (item) => {
  const v = pick(item, ["ygpa", "year_gpa", "year_gpa_score", "yearly_gpa"]) || pick(getMeta(item), ["ygpa", "year_gpa"]) || "";
  return format2(v);
};

const resolveRank = (item) =>
  String(pick(item, ["rank", "position", "top_rank", "merit_rank"]) || pick(getMeta(item), ["rank", "position"]) || "");

const resolveScore = (item) => {
  const yg = resolveYGPA(item);
  if (yg) return yg;
  return String(pick(item, ["cgpa", "gpa", "percentage", "score", "marks", "result"]) || pick(getMeta(item), ["cgpa", "percentage", "score"]) || "");
};

const resolveAchievement = (item) =>
  String(
    pick(item, ["achievement", "achievements", "award", "title", "note", "about", "bio", "summary"]) ||
      pick(getMeta(item), ["achievement", "achievements", "award", "note", "about"]) ||
      ""
  );

const resolveSkills = (item) => {
  const m = getMeta(item);
  const s = m?.skills;
  if (Array.isArray(s)) return s.map((x) => String(x || "").trim()).filter(Boolean);
  const s2 = pick(item, ["skills"]) || pick(m, ["skills"]) || "";
  if (Array.isArray(s2)) return s2.map((x) => String(x || "").trim()).filter(Boolean);
  if (typeof s2 === "string" && s2.trim()) return s2.split(",").map((x) => x.trim()).filter(Boolean);
  return [];
};

const resolveImage = (item) => {
  const img =
    pick(item, ["user_image", "image", "image_url", "photo_url", "profile_image_url", "avatar_url"]) ||
    pick(item?.user, ["image", "photo_url", "image_url"]) ||
    "";
  return normalizeUrl(img);
};

const resolveKey = (item) => {
  const u = String(
    pick(item, ["uuid", "topper_uuid", "program_topper_uuid"]) || ""
  ).trim();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(u)) return u;
  const id = String(pick(item, ["id", "topper_id", "program_topper_id"]) || "").trim();
  return id ? `id:${id}` : "";
};

const resolveDeptUuidFromUrl = (deptByUuid, deptBySlug) => {
  const url = new URL(window.location.href);
  const direct = (url.searchParams.get("department") || url.searchParams.get("dept") || "").trim();

  if (direct) {
    if (deptBySlug.has(direct.toLowerCase())) return deptBySlug.get(direct.toLowerCase());
    if (deptByUuid.has(direct)) return direct;
    return direct;
  }

  const hay = `${url.search} ${url.href}`;
  const m = hay.match(/d-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  return m ? m[1] : "";
};

const syncUrl = (selectedDeptUuid, deptByUuid) => {
  const url = new URL(window.location.href);
  if (selectedDeptUuid) {
    const dept = deptByUuid.get(selectedDeptUuid);
    if (dept?.shortcode) {
      url.searchParams.set("dept", dept.shortcode);
      url.searchParams.delete("department");
    } else {
      url.searchParams.set("department", selectedDeptUuid);
      url.searchParams.delete("dept");
    }
  } else {
    url.searchParams.delete("department");
    url.searchParams.delete("dept");
  }
  history.replaceState({}, "", url.pathname + url.search + url.hash);
};

const readDeptSlugFromPath = () => {
  const parts = window.location.pathname.split("/").filter(Boolean);
  const idx = parts.findIndex((p) => p.toLowerCase() === "program-toppers" || p.toLowerCase() === "toppers");
  if (idx > 0) return parts[idx - 1];
  return "";
};

const ensureFontAwesome = () => {
  if (document.querySelector('link[href*="font-awesome"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";
  document.head.appendChild(link);
};

const emptyStateSvg = (
  <div aria-hidden="true" style={{ width: "170px", maxWidth: "100%", margin: "0 auto 10px", display: "block", color: "var(--ptp-brand)" }}>
    <svg viewBox="0 0 220 140" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", width: "100%", height: "auto" }}>
      <rect x="10" y="18" width="200" height="112" rx="16" fill="white" stroke="rgba(15,23,42,0.10)" />
      <rect x="24" y="32" width="172" height="84" rx="12" fill="rgba(148,163,184,0.08)" stroke="rgba(148,163,184,0.18)" />
      <circle cx="70" cy="66" r="16" fill="rgba(158,54,58,0.14)" stroke="currentColor" strokeWidth="2" />
      <path d="M49 97c5-11 16-16 21-16s16 5 21 16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="100" y="52" width="72" height="8" rx="4" fill="rgba(100,116,139,0.20)" />
      <rect x="100" y="68" width="54" height="8" rx="4" fill="rgba(100,116,139,0.16)" />
      <rect x="100" y="84" width="64" height="8" rx="4" fill="rgba(100,116,139,0.12)" />
      <circle cx="182" cy="26" r="12" fill="rgba(158,54,58,0.10)" stroke="currentColor" strokeWidth="1.8" />
      <path d="M177.5 26h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M182 21.5v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  </div>
);

const renderLine = (label, value) => {
  const v = (value || "").toString().trim();
  if (!v) return null;
  return (
    <div className="ptp-mfield">
      <div className="ptp-mfield-label">
        <i className="fa-solid fa-circle-info"></i>
        {label}
      </div>
      <div className="ptp-mfield-val">{v}</div>
    </div>
  );
};

const renderChipList = (label, iconClass, items) => {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!list.length) return null;
  return (
    <div className="ptp-mfield ptp-mfield-full">
      <div className="ptp-mfield-label">
        <i className={iconClass}></i>
        {label}
      </div>
      <div className="ptp-mfield-val">
        <div className="ptp-mchips">
          {list.map((x, i) => (
            <span className="ptp-mchip" key={`${x}-${i}`}>
              <i className="fa-solid fa-check"></i>
              {x}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const toYearTopperLabel = (yearTopper) => {
  const ord = ordinal(yearTopper);
  if (ord) return `${ord} Year Topper`;
  if (yearTopper) return `Year Topper ${yearTopper}`;
  return "";
};

export default function ProgramToppers() {
  const dispatch = useDispatch();

  const departments = useSelector(selectProgramToppersDepartments);
  const departmentStatus = useSelector(selectProgramToppersDepartmentsStatus);
  const departmentError = useSelector(selectProgramToppersDepartmentsError);

  const toppers = useSelector(selectProgramToppersItems);
  const toppersStatus = useSelector(selectProgramToppersStatus);
  const toppersError = useSelector(selectProgramToppersError);

  const [selectedDeptUuid, setSelectedDeptUuid] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [initialized, setInitialized] = useState(false);
  const [requestsStarted, setRequestsStarted] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const lastFocusRef = useState(null)[0];

  useEffect(() => {
    ensureFontAwesome();
    dispatch(fetchProgramToppersDepartments());
    dispatch(fetchProgramToppersList());
    setRequestsStarted(true);
  }, [dispatch]);

  const deptByUuid = useMemo(() => {
    return new Map((departments || []).map((d) => [d.uuid, d]));
  }, [departments]);

  const deptBySlug = useMemo(() => {
    return new Map(
      (departments || [])
        .filter((d) => d.slug)
        .map((d) => [d.slug.toLowerCase(), d.uuid])
    );
  }, [departments]);

  const selectedDeptMeta = selectedDeptUuid ? deptByUuid.get(selectedDeptUuid) || null : null;
  const selectedDeptId =
    selectedDeptMeta?.id !== null && selectedDeptMeta?.id !== undefined
      ? String(selectedDeptMeta.id)
      : "";
  const selectedDeptName = selectedDeptMeta?.title || "";

  useEffect(() => {
    if (!requestsStarted || initialized) return;
    if (departmentStatus === "loading" || toppersStatus === "loading") return;
    if (departmentStatus === "idle" || toppersStatus === "idle") return;

    const initialDept = resolveDeptUuidFromUrl(deptByUuid, deptBySlug);

    if (initialDept && deptByUuid.has(initialDept)) {
      setSelectedDeptUuid(initialDept);
    } else {
      const pathSlug = readDeptSlugFromPath();
      const fromSlug = pathSlug ? deptBySlug.get(pathSlug.toLowerCase()) || "" : "";
      setSelectedDeptUuid(fromSlug || "");
    }

    setInitialized(true);
    setPage(1);
  }, [requestsStarted, initialized, departmentStatus, toppersStatus, deptByUuid, deptBySlug]);

  useEffect(() => {
    if (!initialized) return;
    syncUrl(selectedDeptUuid, deptByUuid);
  }, [initialized, selectedDeptUuid, deptByUuid]);

  useEffect(() => {
    if (!activeItem) return;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [activeItem]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, 260);

    return () => clearTimeout(t);
  }, [searchInput]);

  const loading =
    !requestsStarted ||
    departmentStatus === "loading" ||
    toppersStatus === "loading" ||
    !initialized;

  const filteredItems = useMemo(() => {
    let items = Array.isArray(toppers) ? toppers.slice() : [];

    if (selectedDeptUuid) {
      items = items.filter((item) => {
        const itemDeptId = resolveDepartmentId(item);
        const itemDeptUuid = resolveDepartmentUuid(item);
        return (
          (selectedDeptId && itemDeptId === selectedDeptId) ||
          (itemDeptUuid && itemDeptUuid === selectedDeptUuid)
        );
      });
    }

    const q = searchQuery.toLowerCase();
    if (q) {
      items = items.filter((item) => {
        const name = resolveName(item).toLowerCase();
        const dept = resolveDepartmentName(item).toLowerCase();
        const program = resolveProgram(item).toLowerCase();
        const spec = resolveSpecialization(item).toLowerCase();
        const ay = resolveAdmissionYear(item).toLowerCase();
        const py = resolvePassingYear(item).toLowerCase();
        const yearTopper = resolveYearTopper(item).toLowerCase();
        const ygpa = resolveYGPA(item).toLowerCase();
        const rank = resolveRank(item).toLowerCase();
        const score = resolveScore(item).toLowerCase();
        const ach = resolveAchievement(item).toLowerCase();

        return (
          name.includes(q) ||
          dept.includes(q) ||
          program.includes(q) ||
          spec.includes(q) ||
          ay.includes(q) ||
          py.includes(q) ||
          yearTopper.includes(q) ||
          ygpa.includes(q) ||
          rank.includes(q) ||
          score.includes(q) ||
          ach.includes(q)
        );
      });
    }

    items.sort((a, b) => {
      const ra = parseFloat(resolveRank(a));
      const rb = parseFloat(resolveRank(b));
      const aHas = Number.isFinite(ra);
      const bHas = Number.isFinite(rb);
      if (aHas && bHas) return ra - rb;
      if (aHas && !bHas) return -1;
      if (!aHas && bHas) return 1;
      return 0;
    });

    return items;
  }, [toppers, selectedDeptUuid, selectedDeptId, searchQuery]);

  const lastPage = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, lastPage);

  useEffect(() => {
    if (page > lastPage) setPage(lastPage);
  }, [lastPage, page]);

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, currentPage]);

  const emptyMessage = selectedDeptUuid
    ? "No program toppers found for this department."
    : "No program toppers found.";

  const handleDeptChange = (e) => {
    const v = (e.target.value || "").toString();
    setSelectedDeptUuid(v);
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const openModalForItem = (item) => {
    lastFocusRef.current = document.activeElement;
    setActiveItem(item);
  };

  const closeModal = () => {
    setActiveItem(null);
    if (lastFocusRef.current && typeof lastFocusRef.current.focus === "function") {
      try {
        lastFocusRef.current.focus();
      } catch {
        // ignore
      }
    }
    lastFocusRef.current = null;
  };

  const handleCardKeyDown = (e, item) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openModalForItem(item);
    }
  };

  const modalHero = activeItem ? (() => {
    const name = resolveName(activeItem);
    const dept = resolveDepartmentName(activeItem);
    const program = resolveProgram(activeItem);
    const spec = resolveSpecialization(activeItem);
    const admissionYear = resolveAdmissionYear(activeItem);
    const passingYear = resolvePassingYear(activeItem);
    const yearTopper = resolveYearTopper(activeItem);
    const ygpa = resolveYGPA(activeItem);
    const rank = resolveRank(activeItem);
    const img = resolveImage(activeItem);

    const heroSub = [];
    if (rank) heroSub.push("Rank " + rank);
    if (yearTopper) heroSub.push(toYearTopperLabel(yearTopper));
    if (ygpa) heroSub.push("YGPA " + ygpa);
    if (program) heroSub.push(program + (spec ? " · " + spec : ""));
    if (dept) heroSub.push(dept);
    const batch = admissionYear ? admissionYear + (passingYear ? "–" + passingYear : "") : (passingYear || "");
    if (batch) heroSub.push("Batch " + batch);

    const heroSubHtml = heroSub.length
      ? heroSub.map((s) => `<span>${esc(s)}</span>`).join('<span class="sep">•</span>')
      : "";

    const quoteText = resolveAchievement(activeItem) || (ygpa ? "YGPA: " + ygpa : (resolveScore(activeItem) ? "Score: " + resolveScore(activeItem) : ""));
    const quoteHtml = quoteText ? `<div class="ptp-modal__hero-quote">"${esc(quoteText)}"</div>` : "";

    if (img) {
      return `
        <img class="ptp-modal__hero-img" src="${escAttr(img)}" alt="${escAttr(name)} photo">
        <div class="ptp-modal__hero-grad"></div>
        <div class="ptp-modal__hero-info">
          <h2 class="ptp-modal__hero-name">${esc(name)}</h2>
          ${heroSubHtml ? `<div class="ptp-modal__hero-sub">${heroSubHtml}</div>` : ""}
          ${quoteHtml}
        </div>
      `;
    }

    return `
      <div class="ptp-modal__hero-placeholder">
        <div class="ptp-modal__hero-initials">${esc(initials(name))}</div>
      </div>
      <div class="ptp-modal__hero-grad"></div>
      <div class="ptp-modal__hero-info">
        <h2 class="ptp-modal__hero-name">${esc(name)}</h2>
        ${heroSubHtml ? `<div class="ptp-modal__hero-sub">${heroSubHtml}</div>` : ""}
        ${quoteHtml}
      </div>
    `;
  })() : "";

  const modalDetails = activeItem ? (() => {
    const name = resolveName(activeItem);
    const dept = resolveDepartmentName(activeItem);
    const program = resolveProgram(activeItem);
    const spec = resolveSpecialization(activeItem);
    const admissionYear = resolveAdmissionYear(activeItem);
    const passingYear = resolvePassingYear(activeItem);
    const yearTopper = resolveYearTopper(activeItem);
    const ygpa = resolveYGPA(activeItem);
    const rank = resolveRank(activeItem);
    const score = resolveScore(activeItem);
    const ach = resolveAchievement(activeItem);
    const skills = resolveSkills(activeItem);

    const tagParts = [];
    if (dept) tagParts.push(dept);
    if (program) tagParts.push(program + (spec ? " · " + spec : ""));
    if (yearTopper) tagParts.push(toYearTopperLabel(yearTopper));
    if (rank) tagParts.push("Rank " + rank);
    if (ygpa) tagParts.push("YGPA " + ygpa);

    const tagHtml = tagParts.length
      ? tagParts.map((t) => `<span>${esc(t)}</span>`).join('<span class="tsep">•</span>')
      : "";

    const acadFields = [
      renderLine("Program", program),
      renderLine("Specialization", spec),
      renderLine("Batch Start", admissionYear),
      renderLine("Batch End", passingYear),
      renderLine("Year Topper", yearTopper ? toYearTopperLabel(yearTopper) : ""),
      renderLine("YGPA", ygpa),
      renderLine("Rank", rank ? "Rank " + rank : ""),
      renderLine("Score", score),
    ].filter(Boolean);

    return `
      <div class="ptp-modal__dhead">
        <h2 class="ptp-modal__dhead-name">${esc(name)}</h2>
        ${tagHtml ? `<div class="ptp-modal__dhead-tagline">${tagHtml}</div>` : ""}
      </div>
      <div class="ptp-modal__dcontent">
        ${
          acadFields.length
            ? `
              <div class="ptp-msection">
                <div class="ptp-msection-title">Academic</div>
                <div class="ptp-mrow">
                  ${acadFields.join("")}
                </div>
              </div>
            `
            : ""
        }
        ${
          skills.length
            ? `
              <div class="ptp-msection">
                <div class="ptp-msection-title">Skills</div>
                <div class="ptp-mrow">
                  ${renderChipList("Skills", "fa-solid fa-wand-magic-sparkles", skills).props?.children?.toString() || ""}
                </div>
              </div>
            `
            : ""
        }
        ${
          ach
            ? `
              <div class="ptp-msection">
                <div class="ptp-mnote">
                  <div class="ptp-mnote-label"><i class="fa-solid fa-star"></i>Highlight</div>
                  <div class="ptp-mnote-val">${esc(ach)}</div>
                </div>
              </div>
            `
            : ""
        }
      </div>
    `;
  })() : "";

  return (
    <div className="ptp-wrap">
      <style>{styles}</style>

      <div className="ptp-head">
        <div className="ptp-tools">
          <div className="ptp-search">
            <i className="fa fa-magnifying-glass"></i>
            <input
              value={searchInput}
              onChange={handleSearchChange}
              type="search"
              placeholder="Search (name, department, program, batch, year topper, YGPA, rank)…"
            />
          </div>

          <div className="ptp-select" title="Filter by department">
            <i className="fa-solid fa-building-columns ptp-select__icon"></i>
            <select
              value={selectedDeptUuid}
              onChange={handleDeptChange}
              aria-label="Filter by department"
            >
              <option value="">All Departments</option>
              {(departments || [])
                .slice()
                .sort((a, b) => a.title.localeCompare(b.title))
                .map((d) => (
                  <option key={d.uuid} value={d.uuid}>
                    {d.title}
                  </option>
                ))}
            </select>
            <i className="fa-solid fa-chevron-down ptp-select__caret"></i>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="ptp-skeleton">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="ptp-sk"></div>
          ))}
        </div>
      ) : (departmentError || toppersError) && !currentItems.length ? (
        <div className="ptp-state">
          {emptyStateSvg}
          Unable to load program toppers right now.
        </div>
      ) : currentItems.length ? (
        <>
          <div className="ptp-grid">
            {currentItems.map((item) => {
              const name = resolveName(item);
              const deptName = resolveDepartmentName(item);
              const program = resolveProgram(item);
              const spec = resolveSpecialization(item);
              const admissionYear = resolveAdmissionYear(item);
              const passingYear = resolvePassingYear(item);
              const yearTopper = resolveYearTopper(item);
              const ygpa = resolveYGPA(item);
              const rank = resolveRank(item);
              const img = resolveImage(item);
              const key = resolveKey(item);

              const deptPill = deptName ? (
                <div className="ptp-pill" title={deptName}>
                  {deptName}
                </div>
              ) : null;

              const yearPill = yearTopper ? (
                <div className="ptp-yearpill" title="Year topper">
                  {toYearTopperLabel(yearTopper)}
                </div>
              ) : null;

              const rankPill = rank ? (
                <div className="ptp-rank" title="Rank">
                  {`Rank ${rank}`}
                </div>
              ) : null;

              const metaLine = program || spec ? (
                <p className="ptp-meta">
                  {program || "Program"}
                  {program && spec ? <span className="dot">•</span> : null}
                  {spec || ""}
                </p>
              ) : deptName ? (
                <p className="ptp-meta">{deptName}</p>
              ) : (
                <p className="ptp-meta">Program Topper</p>
              );

              const subParts = [];
              if (admissionYear) subParts.push(`Batch: ${admissionYear}${passingYear ? "–" + passingYear : ""}`);
              else if (passingYear) subParts.push(`Passout: ${passingYear}`);
              if (yearTopper) subParts.push(toYearTopperLabel(yearTopper));
              if (ygpa) subParts.push(`YGPA: ${ygpa}`);

              return (
                <a
                  key={key || `${name}-${deptName}`}
                  className="ptp-card"
                  href="#"
                  role="button"
                  aria-label={`${name} details`}
                  onClick={(e) => {
                    e.preventDefault();
                    openModalForItem(item);
                  }}
                  onKeyDown={(e) => handleCardKeyDown(e, item)}
                >
                  {img ? (
                    <div
                      className="bg"
                      style={{ backgroundImage: `url('${escAttr(img)}')` }}
                    />
                  ) : (
                    <div className="ptp-placeholder">
                      <div className="ptp-initials">{initials(name)}</div>
                    </div>
                  )}

                  {deptPill}
                  {yearPill}
                  {rankPill}

                  <div className="vignette"></div>

                  <div className="info">
                    <p className="ptp-name">{name}</p>
                    {metaLine}
                    {subParts.length ? (
                      <p className="ptp-submeta">
                        {subParts.map((part, idx) => (
                          <span key={idx}>
                            {idx > 0 ? <span className="dot">•</span> : null}
                            {part}
                          </span>
                        ))}
                      </p>
                    ) : null}
                  </div>
                </a>
              );
            })}
          </div>

          {lastPage > 1 ? (
            <div className="ptp-pagination">
              <div className="ptp-pager">
                <button
                  className="ptp-pagebtn"
                  disabled={currentPage <= 1}
                  onClick={() => {
                    setPage(Math.max(1, currentPage - 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Previous
                </button>

                {(() => {
                  const win = 2;
                  const start = Math.max(1, currentPage - win);
                  const end = Math.min(lastPage, currentPage + win);
                  const nodes = [];

                  if (start > 1) {
                    nodes.push(
                      <button
                        key="p1"
                        className={`ptp-pagebtn ${currentPage === 1 ? "active" : ""}`}
                        onClick={() => {
                          setPage(1);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        1
                      </button>
                    );
                    if (start > 2) {
                      nodes.push(
                        <span key="dots1" style={{ opacity: 0.6, padding: "0 4px" }}>
                          …
                        </span>
                      );
                    }
                  }

                  for (let p = start; p <= end; p++) {
                    nodes.push(
                      <button
                        key={p}
                        className={`ptp-pagebtn ${currentPage === p ? "active" : ""}`}
                        onClick={() => {
                          setPage(p);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        {p}
                      </button>
                    );
                  }

                  if (end < lastPage) {
                    if (end < lastPage - 1) {
                      nodes.push(
                        <span key="dots2" style={{ opacity: 0.6, padding: "0 4px" }}>
                          …
                        </span>
                      );
                    }
                    nodes.push(
                      <button
                        key={lastPage}
                        className={`ptp-pagebtn ${currentPage === lastPage ? "active" : ""}`}
                        onClick={() => {
                          setPage(lastPage);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        {lastPage}
                      </button>
                    );
                  }

                  return nodes;
                })()}

                <button
                  className="ptp-pagebtn"
                  disabled={currentPage >= lastPage}
                  onClick={() => {
                    setPage(Math.min(lastPage, currentPage + 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="ptp-state">
          {emptyStateSvg}
          {emptyMessage}
        </div>
      )}

      <div
        className={`ptp-modal ${activeItem ? "show" : ""}`}
        aria-hidden={activeItem ? "false" : "true"}
        role="dialog"
        aria-modal="true"
        onClick={closeModal}
      >
        <div className="ptp-modal__overlay" data-close="1"></div>
        <div
          className="ptp-modal__panel"
          role="document"
          aria-label="Program topper details"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="ptp-modal__close"
            type="button"
            aria-label="Close"
            onClick={closeModal}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>

          <div
            className="ptp-modal__hero"
            dangerouslySetInnerHTML={{ __html: modalHero }}
          />
          <div
            className="ptp-modal__details"
            dangerouslySetInnerHTML={{ __html: modalDetails }}
          />
        </div>
      </div>
    </div>
  );
}