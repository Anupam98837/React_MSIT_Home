import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAlumniDepartments,
  fetchAlumniList,
  selectAlumniDepartments,
  selectAlumniDepartmentsError,
  selectAlumniDepartmentsStatus,
  selectAlumniError,
  selectAlumniItems,
  selectAlumniStatus,
} from "../../redux/crm/alumniViewAllSlice";

const PAGE_SIZE = 12;
const ORIGIN =
  typeof window !== "undefined"
    ? window.location.origin.replace(/\/+$/, "")
    : "";

const styles = String.raw`
.alx-wrap{
  --alx-brand: var(--primary-color, #9E363A);
  --alx-ink: #0f172a;
  --alx-muted: #64748b;
  --alx-bg: var(--page-bg, #ffffff);
  --alx-card: var(--surface, #ffffff);
  --alx-line: var(--line-soft, rgba(15,23,42,.10));
  --alx-shadow: 0 10px 24px rgba(2,6,23,.08);

  --alx-card-w: 247px;
  --alx-card-h: 329px;
  --alx-radius: 18px;

  max-width: 1320px;
  margin: 18px auto 54px;
  padding: 0 12px;
  background: transparent;
  position: relative;
  overflow: visible;
}

.alx-head{
  background: var(--alx-card);
  border: 1px solid var(--alx-line);
  border-radius: 16px;
  box-shadow: var(--alx-shadow);
  padding: 14px 16px;
  margin-bottom: 16px;
  display:flex;
  gap: 12px;
  align-items:center;
  justify-content:space-between;
}
.alx-title{
  margin:0;
  font-weight: 950;
  letter-spacing: .2px;
  color: var(--alx-ink);
  font-size: 28px;
  display:flex;
  align-items:center;
  gap: 10px;
  white-space: nowrap;
}
.alx-title i{ color: var(--alx-brand); }
.alx-sub{
  margin: 6px 0 0;
  color: var(--alx-muted);
  font-size: 14px;
}

.alx-tools{
  display:flex;
  gap: 10px;
  align-items:center;
  flex-wrap: nowrap;
}

.alx-search{
  position: relative;
  min-width: 260px;
  max-width: 520px;
  flex: 1 1 320px;
}
.alx-search i{
  position:absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  opacity: .65;
  color: var(--alx-muted);
  pointer-events:none;
}
.alx-search input{
  width:100%;
  height: 42px;
  border-radius: 999px;
  padding: 11px 12px 11px 42px;
  border: 1px solid var(--alx-line);
  background: var(--alx-card);
  color: var(--alx-ink);
  outline: none;
}
.alx-search input:focus{
  border-color: rgba(201,75,80,.55);
  box-shadow: 0 0 0 4px rgba(201,75,80,.18);
}

.alx-select{
  position: relative;
  min-width: 260px;
  max-width: 360px;
  flex: 0 1 320px;
}
.alx-select__icon{
  position:absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  opacity: .70;
  color: var(--alx-muted);
  pointer-events:none;
  font-size: 14px;
}
.alx-select__caret{
  position:absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  opacity: .70;
  color: var(--alx-muted);
  pointer-events:none;
  font-size: 12px;
}
.alx-select select{
  width: 100%;
  height: 42px;
  border-radius: 999px;
  padding: 10px 38px 10px 42px;
  border: 1px solid var(--alx-line);
  background: var(--alx-card);
  color: var(--alx-ink);
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}
.alx-select select:focus{
  border-color: rgba(201,75,80,.55);
  box-shadow: 0 0 0 4px rgba(201,75,80,.18);
}

.alx-grid{
  display:grid;
  grid-template-columns: repeat(auto-fill, var(--alx-card-w));
  gap: 18px;
  align-items: start;
  justify-content: center;
}

.alx-card{
  position: relative;
  width: var(--alx-card-w);
  height: var(--alx-card-h);
  border-radius: var(--alx-radius);
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
.alx-card:hover{
  transform: translateY(-4px);
  box-shadow: 0 18px 42px rgba(0,0,0,.16);
  border-color: rgba(158,54,58,.22);
}

.alx-card .bg{
  position:absolute; inset:0;
  background-size: cover;
  background-position: center;
  filter: saturate(1.02);
  transform: scale(1.0001);
}

.alx-card .vignette{
  position:absolute; inset:0;
  background:
    radial-gradient(1200px 500px at 50% -20%, rgba(255,255,255,.10), rgba(0,0,0,0) 60%),
    linear-gradient(180deg, rgba(0,0,0,.00) 28%, rgba(0,0,0,.12) 60%, rgba(0,0,0,.62) 100%);
}

.alx-card .info{
  position:absolute;
  left: 14px;
  right: 14px;
  bottom: 14px;
  z-index: 2;
}
.alx-name{
  margin:0;
  font-size: 18px;
  font-weight: 950;
  line-height: 1.12;
  color: #fff;
  text-shadow: 0 6px 16px rgba(0,0,0,.35);
}
.alx-meta{
  margin: 7px 0 0;
  font-size: 13px;
  font-weight: 800;
  color: rgba(255,255,255,.90);
  text-shadow: 0 6px 16px rgba(0,0,0,.35);
  line-height: 1.2;
}
.alx-meta .dot{
  opacity: .85;
  padding: 0 6px;
}
.alx-submeta{
  margin: 7px 0 0;
  font-size: 12.5px;
  color: rgba(255,255,255,.82);
  text-shadow: 0 6px 16px rgba(0,0,0,.35);
  line-height: 1.2;
}

.alx-pill{
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

.alx-placeholder{
  position:absolute; inset:0;
  display:grid; place-items:center;
  background:
    radial-gradient(800px 360px at 20% 10%, rgba(158,54,58,.20), transparent 60%),
    radial-gradient(900px 400px at 80% 90%, rgba(158,54,58,.14), transparent 60%),
    linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.82));
}
.alx-initials{
  width: 86px; height: 86px;
  border-radius: 24px;
  display:grid; place-items:center;
  font-weight: 950;
  font-size: 28px;
  color: var(--alx-brand);
  background: rgba(158,54,58,.12);
  border: 1px solid rgba(158,54,58,.25);
}

.alx-state{
  background: var(--alx-card);
  border: 1px solid var(--alx-line);
  border-radius: 16px;
  box-shadow: var(--alx-shadow);
  padding: 18px;
  color: var(--alx-muted);
  text-align:center;
}

.alx-skeleton{
  display:grid;
  grid-template-columns: repeat(auto-fill, var(--alx-card-w));
  gap: 18px;
  justify-content: center;
}
.alx-sk{
  border-radius: var(--alx-radius);
  border: 1px solid var(--alx-line);
  background: #fff;
  overflow:hidden;
  position:relative;
  box-shadow: 0 10px 24px rgba(2,6,23,.08);
  height: var(--alx-card-h);
}
.alx-sk:before{
  content:'';
  position:absolute; inset:0;
  transform: translateX(-60%);
  background: linear-gradient(90deg, transparent, rgba(148,163,184,.22), transparent);
  animation: alxSkMove 1.15s ease-in-out infinite;
}
@keyframes alxSkMove{ to{ transform: translateX(60%);} }

.alx-pagination{
  display:flex;
  justify-content:center;
  margin-top: 18px;
}
.alx-pagination .alx-pager{
  display:flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items:center;
  justify-content:center;
  padding: 10px;
}
.alx-pagebtn{
  border:1px solid var(--alx-line);
  background: var(--alx-card);
  color: var(--alx-ink);
  border-radius: 12px;
  padding: 9px 12px;
  font-size: 13px;
  font-weight: 950;
  box-shadow: 0 8px 18px rgba(2,6,23,.06);
  cursor:pointer;
  user-select:none;
}
.alx-pagebtn:hover{ background: rgba(2,6,23,.03); }
.alx-pagebtn[disabled]{ opacity:.55; cursor:not-allowed; }
.alx-pagebtn.active{
  background: rgba(201,75,80,.12);
  border-color: rgba(201,75,80,.35);
  color: var(--alx-brand);
}

@media (max-width: 992px){
  .alx-head{ flex-wrap: wrap; align-items: flex-end; }
  .alx-tools{ flex-wrap: wrap; }
}
@media (max-width: 640px){
  .alx-title{ font-size: 24px; }
  .alx-search{ min-width: 220px; flex: 1 1 240px; }
  .alx-select{ min-width: 220px; flex: 1 1 240px; }
}

.alx-modal{
  position: fixed;
  inset: 0;
  display:none;
  z-index: 9999;
}
.alx-modal.show{ display:flex; align-items:center; justify-content:center; }

.alx-modal__overlay{
  position:fixed; inset:0;
  background: rgba(0,0,0,.72);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.alx-modal__panel{
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
.alx-modal.show .alx-modal__panel{
  opacity: 1;
  transform: translateY(0) scale(1);
}

.alx-modal__close{
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
.alx-modal__close:hover{
  background: #fff;
  transform: scale(1.08);
}

.alx-modal__hero{
  flex: 0 0 420px;
  position: relative;
  background: #1a1a2e;
  overflow: hidden;
  min-height: 520px;
}
.alx-modal__hero-img{
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  display: block;
}
.alx-modal__hero-grad{
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
.alx-modal__hero-info{
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 28px 26px;
  z-index: 3;
}
.alx-modal__hero-name{
  margin: 0;
  font-size: 30px;
  font-weight: 900;
  color: #fff;
  line-height: 1.15;
  letter-spacing: -.2px;
  text-shadow: 0 2px 20px rgba(0,0,0,.4);
}
.alx-modal__hero-sub{
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
.alx-modal__hero-sub .sep{
  opacity: .5;
  font-size: 10px;
}
.alx-modal__hero-quote{
  margin-top: 14px;
  font-size: 13.5px;
  font-style: italic;
  color: rgba(255,255,255,.78);
  line-height: 1.4;
  text-shadow: 0 2px 12px rgba(0,0,0,.35);
  max-width: 360px;
}

.alx-modal__hero-placeholder{
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
.alx-modal__hero-initials{
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

.alx-modal__details{
  flex: 1;
  overflow-y: auto;
  padding: 0;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 48px);
}

.alx-modal__dhead{
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 18px 24px 14px;
  background: rgba(255,255,255,.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(15,23,42,.06);
}
.alx-modal__dhead-name{
  margin: 0;
  font-size: 22px;
  font-weight: 900;
  color: #0f172a;
  line-height: 1.2;
}
.alx-modal__dhead-tagline{
  margin-top: 4px;
  font-size: 13.5px;
  font-weight: 600;
  color: #64748b;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  align-items: center;
}
.alx-modal__dhead-tagline .tsep{
  opacity: .45;
  font-size: 8px;
}

.alx-modal__dcontent{
  flex: 1;
  padding: 16px 24px 28px;
}

.alx-msection{
  margin-top: 20px;
}
.alx-msection:first-child{ margin-top: 0; }
.alx-msection-title{
  font-size: 11.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .8px;
  color: #94a3b8;
  margin: 0 0 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(15,23,42,.06);
}

.alx-mrow{
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.alx-mfield{
  padding: 10px 12px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid rgba(15,23,42,.05);
  transition: background .12s;
}
.alx-mfield:hover{ background: #f1f5f9; }
.alx-mfield-label{
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
.alx-mfield-label i{
  color: var(--alx-brand, #9E363A);
  font-size: 11px;
  opacity: .85;
}
.alx-mfield-val{
  font-size: 13.5px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.3;
  word-break: break-word;
}
.alx-mfield-full{
  grid-column: 1 / -1;
}

.alx-mchips{
  display:flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
}
.alx-mchip{
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
.alx-mchip i{
  color: var(--alx-brand, #9E363A);
  font-size: 10px;
}

.alx-mnote{
  margin-top: 8px;
  padding: 14px 16px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(158,54,58,.04), rgba(158,54,58,.08));
  border: 1px solid rgba(158,54,58,.12);
  grid-column: 1 / -1;
}
.alx-mnote-label{
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: var(--alx-brand, #9E363A);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.alx-mnote-val{
  font-size: 13.5px;
  font-weight: 600;
  color: #334155;
  line-height: 1.5;
  white-space: pre-wrap;
  font-style: italic;
}

@media (max-width: 860px){
  .alx-modal__panel{
    flex-direction: column;
    max-height: calc(100vh - 32px);
    width: min(560px, calc(100% - 24px));
  }
  .alx-modal__hero{
    flex: 0 0 auto;
    min-height: 320px;
    max-height: 380px;
  }
  .alx-modal__details{
    max-height: none;
  }
  .alx-modal__close{
    background: rgba(0,0,0,.45);
    color: #fff;
    box-shadow: 0 4px 16px rgba(0,0,0,.25);
  }
  .alx-modal__close:hover{
    background: rgba(0,0,0,.6);
    color: #fff;
  }
}
@media (max-width: 560px){
  .alx-modal__hero{
    min-height: 260px;
    max-height: 300px;
  }
  .alx-modal__hero-name{
    font-size: 24px;
  }
  .alx-modal__dhead{
    padding: 14px 16px 12px;
  }
  .alx-modal__dhead-name{
    font-size: 18px;
  }
  .alx-modal__dcontent{
    padding: 14px 16px 24px;
  }
  .alx-mrow{
    grid-template-columns: 1fr;
  }
}

html.theme-dark .alx-modal__panel{ background: #0f172a; }
html.theme-dark .alx-modal__close{
  background: rgba(15,23,42,.85);
  color: #e2e8f0;
  box-shadow: 0 4px 16px rgba(0,0,0,.35);
}
html.theme-dark .alx-modal__close:hover{ background: rgba(15,23,42,.95); }
html.theme-dark .alx-modal__dhead{
  background: rgba(15,23,42,.95);
  border-bottom-color: rgba(255,255,255,.06);
}
html.theme-dark .alx-modal__dhead-name{ color: #f1f5f9; }
html.theme-dark .alx-modal__dhead-tagline{ color: #94a3b8; }
html.theme-dark .alx-mfield{
  background: rgba(255,255,255,.04);
  border-color: rgba(255,255,255,.06);
}
html.theme-dark .alx-mfield:hover{ background: rgba(255,255,255,.07); }
html.theme-dark .alx-mfield-label{ color: #64748b; }
html.theme-dark .alx-mfield-val{ color: #e2e8f0; }
html.theme-dark .alx-msection-title{ color: #475569; border-bottom-color: rgba(255,255,255,.06); }
html.theme-dark .alx-mchip{
  background: rgba(255,255,255,.06);
  border-color: rgba(255,255,255,.08);
  color: #cbd5e1;
}
html.theme-dark .alx-mnote{
  background: linear-gradient(135deg, rgba(158,54,58,.08), rgba(158,54,58,.14));
  border-color: rgba(158,54,58,.2);
}
html.theme-dark .alx-mnote-val{ color: #cbd5e1; }

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

const decodeMaybeJson = (v) => {
  if (v == null) return null;
  if (Array.isArray(v) || typeof v === "object") return v;
  try {
    return JSON.parse(String(v));
  } catch {
    return null;
  }
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
  if (!n) return "AL";
  const parts = n.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((p) => p[0].toUpperCase()).join("");
};

const getMeta = (item) => decodeMaybeJson(item?.metadata) || {};

const resolveName = (item) =>
  String(
    pick(item, ["user_name", "alumni_name", "name", "full_name", "student_name"]) ||
      pick(item?.user, ["name", "full_name", "username"]) ||
      "Alumni"
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
      pick(getMeta(item), ["admission_year"]) ||
      ""
  );

const resolvePassingYear = (item) =>
  String(
    pick(item, ["passing_year", "passout_year", "graduation_year", "completion_year", "batch_end_year"]) ||
      pick(getMeta(item), ["passing_year", "passout_year"]) ||
      ""
  );

const resolveCompany = (item) =>
  String(pick(item, ["current_company", "company", "company_name"]) || pick(getMeta(item), ["company", "current_company"]) || "");

const resolveRoleTitle = (item) =>
  String(
    pick(item, ["current_role_title", "current_role", "designation", "role_title", "job_title", "position"]) ||
      pick(getMeta(item), ["role_title", "designation"]) ||
      ""
  );

const resolveIndustry = (item) =>
  String(pick(item, ["industry", "sector"]) || pick(getMeta(item), ["industry"]) || "");

const resolveCity = (item) =>
  String(pick(item, ["city", "current_city"]) || pick(getMeta(item), ["city"]) || "");

const resolveCountry = (item) =>
  String(pick(item, ["country", "current_country"]) || pick(getMeta(item), ["country"]) || "");

const resolveSkills = (item) => {
  const s = getMeta(item)?.skills;
  if (Array.isArray(s)) return s.map((x) => String(x || "").trim()).filter(Boolean);
  return [];
};

const resolveNote = (item) =>
  String(pick(item, ["note", "about", "bio", "summary"]) || pick(getMeta(item), ["note", "about"]) || "");

const resolveImage = (item) => {
  const img =
    pick(item, ["user_image", "image", "image_url", "photo_url", "profile_image_url", "avatar_url"]) ||
    pick(item?.user, ["image", "photo_url", "image_url"]) ||
    "";
  return normalizeUrl(img);
};

const looksLikeUuidLoose = (v) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || "").trim());

const resolveKey = (item) => {
  const u = String(pick(item, ["uuid", "alumni_uuid"]) || "").trim();
  if (looksLikeUuidLoose(u)) return u;
  const id = String(pick(item, ["id", "alumni_id"]) || "").trim();
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
  const idx = parts.findIndex((p) => p.toLowerCase() === "alumni");
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

const renderLine = (label, value) => {
  const v = (value || "").toString().trim();
  if (!v) return null;
  return (
    <div className="alx-mfield">
      <div className="alx-mfield-label">
        <i className="fa-solid fa-circle-info"></i>
        {label}
      </div>
      <div className="alx-mfield-val">{v}</div>
    </div>
  );
};

export default function Alumni() {
  const dispatch = useDispatch();

  const departments = useSelector(selectAlumniDepartments);
  const departmentStatus = useSelector(selectAlumniDepartmentsStatus);
  const departmentError = useSelector(selectAlumniDepartmentsError);

  const alumni = useSelector(selectAlumniItems);
  const alumniStatus = useSelector(selectAlumniStatus);
  const alumniError = useSelector(selectAlumniError);

  const [selectedDeptUuid, setSelectedDeptUuid] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [initialized, setInitialized] = useState(false);
  const [requestsStarted, setRequestsStarted] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const lastFocusRef = useRef(null);

  useEffect(() => {
    ensureFontAwesome();
    dispatch(fetchAlumniDepartments());
    dispatch(fetchAlumniList());
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
  const selectedDeptId = selectedDeptMeta?.id !== null && selectedDeptMeta?.id !== undefined ? String(selectedDeptMeta.id) : "";
  const selectedDeptName = selectedDeptMeta?.title || "";

  useEffect(() => {
    if (!requestsStarted || initialized) return;
    if (departmentStatus === "loading" || alumniStatus === "loading") return;

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
  }, [requestsStarted, initialized, departmentStatus, alumniStatus, deptByUuid, deptBySlug]);

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
    alumniStatus === "loading" ||
    !initialized;

  const filteredItems = useMemo(() => {
    let items = Array.isArray(alumni) ? alumni.slice() : [];

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
        const company = resolveCompany(item).toLowerCase();
        const role = resolveRoleTitle(item).toLowerCase();
        const industry = resolveIndustry(item).toLowerCase();
        const city = resolveCity(item).toLowerCase();
        const country = resolveCountry(item).toLowerCase();

        return (
          name.includes(q) ||
          dept.includes(q) ||
          program.includes(q) ||
          spec.includes(q) ||
          ay.includes(q) ||
          py.includes(q) ||
          company.includes(q) ||
          role.includes(q) ||
          industry.includes(q) ||
          city.includes(q) ||
          country.includes(q)
        );
      });
    }

    return items;
  }, [alumni, selectedDeptUuid, selectedDeptId, searchQuery]);

  const lastPage = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, lastPage);

  useEffect(() => {
    if (page > lastPage) setPage(lastPage);
  }, [lastPage, page]);

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, currentPage]);

  const subtitle = selectedDeptName
    ? `Alumni of ${selectedDeptName}`
    : "Explore our alumni community.";

  const emptyMessage = selectedDeptUuid
    ? "No alumni found for this department."
    : "No alumni found.";

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

  const handleDeptChange = (e) => {
    const v = (e.target.value || "").toString().trim();
    setSelectedDeptUuid(v);
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleCardKeyDown = (e, item) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openModalForItem(item);
    }
  };

  const modalHero = activeItem ? (() => {
    const name = resolveName(activeItem);
    const company = resolveCompany(activeItem);
    const role = resolveRoleTitle(activeItem);
    const city = resolveCity(activeItem);
    const country = resolveCountry(activeItem);
    const location = [city, country].filter(Boolean).join(", ");
    const note = resolveNote(activeItem);
    const img = resolveImage(activeItem);

    const heroSub = [];
    if (role && company) heroSub.push(`${role} · ${company}${location ? ", " + location : ""}`);
    else if (company) heroSub.push(company + (location ? ", " + location : ""));
    else if (role) heroSub.push(role + (location ? ", " + location : ""));
    else if (location) heroSub.push(location);

    const heroSubHtml = heroSub.length
      ? heroSub.map((s) => `<span>${esc(s)}</span>`).join('<span class="sep">•</span>')
      : "";

    const quoteHtml = note ? `<div class="alx-modal__hero-quote">"${esc(note)}"</div>` : "";

    if (img) {
      return `
        <img class="alx-modal__hero-img" src="${escAttr(img)}" alt="${escAttr(name)} photo">
        <div class="alx-modal__hero-grad"></div>
        <div class="alx-modal__hero-info">
          <h2 class="alx-modal__hero-name">${esc(name)}</h2>
          ${heroSubHtml ? `<div class="alx-modal__hero-sub">${heroSubHtml}</div>` : ""}
          ${quoteHtml}
        </div>
      `;
    }

    return `
      <div class="alx-modal__hero-placeholder">
        <div class="alx-modal__hero-initials">${esc(initials(name))}</div>
      </div>
      <div class="alx-modal__hero-grad"></div>
      <div class="alx-modal__hero-info">
        <h2 class="alx-modal__hero-name">${esc(name)}</h2>
        ${heroSubHtml ? `<div class="alx-modal__hero-sub">${heroSubHtml}</div>` : ""}
        ${quoteHtml}
      </div>
    `;
  })() : "";

  const modalDetails = activeItem ? (() => {
    const name = resolveName(activeItem);
    const company = resolveCompany(activeItem);
    const role = resolveRoleTitle(activeItem);
    const industry = resolveIndustry(activeItem);
    const city = resolveCity(activeItem);
    const country = resolveCountry(activeItem);
    const location = [city, country].filter(Boolean).join(", ");
    const skills = resolveSkills(activeItem);
    const note = resolveNote(activeItem);
    const dept = resolveDepartmentName(activeItem);

    const tagParts = [];
    if (dept) tagParts.push(dept);
    if (role || company) tagParts.push([role, company].filter(Boolean).join(" · "));
    if (location) tagParts.push(location);

    const tagHtml = tagParts.length
      ? tagParts.map((t) => `<span>${esc(t)}</span>`).join('<span class="tsep">•</span>')
      : "";

    const profFields = [
      renderLine("Company", company),
      renderLine("Role / Designation", role),
      renderLine("Industry", industry),
      renderLine("Location", location),
    ].filter(Boolean);

    const skillsHtml = skills.length
      ? `
        <div class="alx-mfield alx-mfield-full">
          <div class="alx-mfield-label">
            <i class="fa-solid fa-wand-magic-sparkles"></i>
            Skills
          </div>
          <div class="alx-mfield-val">
            <div class="alx-mchips">
              ${skills
                .map(
                  (s) => `
                    <span class="alx-mchip">
                      <i class="fa-solid fa-check"></i>
                      ${esc(s)}
                    </span>
                  `
                )
                .join("")}
            </div>
          </div>
        </div>
      `
      : "";

    const noteHtml = note
      ? `
        <div class="alx-mnote">
          <div class="alx-mnote-label"><i class="fa-solid fa-quote-left"></i>About</div>
          <div class="alx-mnote-val">${esc(note)}</div>
        </div>
      `
      : "";

    return `
      <div class="alx-modal__dhead">
        <h2 class="alx-modal__dhead-name">${esc(name)}</h2>
        ${tagHtml ? `<div class="alx-modal__dhead-tagline">${tagHtml}</div>` : ""}
      </div>
      <div class="alx-modal__dcontent">
        ${
          profFields.length
            ? `
              <div class="alx-msection">
                <div class="alx-msection-title">Professional</div>
                <div class="alx-mrow">
                  ${profFields.join("")}
                </div>
              </div>
            `
            : ""
        }
        ${
          skillsHtml
            ? `
              <div class="alx-msection">
                <div class="alx-msection-title">Skills</div>
                <div class="alx-mrow">${skillsHtml}</div>
              </div>
            `
            : ""
        }
        ${
          noteHtml
            ? `
              <div class="alx-msection">
                ${noteHtml}
              </div>
            `
            : ""
        }
      </div>
    `;
  })() : "";

  return (
    <div className="alx-wrap">
      <style>{styles}</style>

      <div className="alx-head">
        <div>
          <h1 className="alx-title">
            <i className="fa-solid fa-user-group"></i>
            Alumni
          </h1>
          <div className="alx-sub">{subtitle}</div>
        </div>

        <div className="alx-tools">
          <div className="alx-search">
            <i className="fa fa-magnifying-glass"></i>
            <input
              value={searchInput}
              onChange={handleSearchChange}
              type="search"
              placeholder="Search (name, department, program, company, role, year)…"
            />
          </div>

          <div className="alx-select" title="Filter by department">
            <i className="fa-solid fa-building-columns alx-select__icon"></i>
            <select
              value={selectedDeptUuid}
              onChange={handleDeptChange}
              aria-label="Filter by department"
            >
              <option value="">All Departments</option>
              {departments
                .slice()
                .sort((a, b) => a.title.localeCompare(b.title))
                .map((d) => (
                  <option key={d.uuid} value={d.uuid}>
                    {d.title}
                  </option>
                ))}
            </select>
            <i className="fa-solid fa-chevron-down alx-select__caret"></i>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="alx-skeleton">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="alx-sk"></div>
          ))}
        </div>
      ) : alumniError ? (
        <div className="alx-state">
          <div style={{ fontSize: "34px", opacity: 0.6, marginBottom: "6px" }}>
            <i className="fa-regular fa-circle-xmark"></i>
          </div>
          Unable to load alumni right now.
          <div style={{ marginTop: "8px", fontSize: "12.5px", opacity: 0.95 }}>
            <b>Error:</b> {alumniError}
          </div>
        </div>
      ) : currentItems.length ? (
        <>
          <div className="alx-grid">
            {currentItems.map((item) => {
              const name = resolveName(item);
              const deptName = resolveDepartmentName(item);
              const program = resolveProgram(item);
              const spec = resolveSpecialization(item);
              const admissionYear = resolveAdmissionYear(item);
              const passingYear = resolvePassingYear(item);
              const company = resolveCompany(item);
              const role = resolveRoleTitle(item);
              const img = resolveImage(item);

              const metaLine =
                company || role ? (
                  <p className="alx-meta">
                    {company || "Company"}
                    {company && role ? <span className="dot">•</span> : null}
                    {role || ""}
                  </p>
                ) : program || spec ? (
                  <p className="alx-meta">
                    {program || "Program"}
                    {program && spec ? <span className="dot">•</span> : null}
                    {spec || ""}
                  </p>
                ) : (
                  <p className="alx-meta">{deptName || "Alumni"}</p>
                );

              const subParts = [];
              if (program && !(company || role)) subParts.push(program);
              if (admissionYear) {
                subParts.push(
                  `Batch: ${admissionYear}${passingYear ? "–" + passingYear : ""}`
                );
              } else if (passingYear) {
                subParts.push(`Passout: ${passingYear}`);
              }

              const subLine = subParts.length ? (
                <p className="alx-submeta">
                  {subParts.map((s, idx) => (
                    <span key={idx}>
                      {idx > 0 ? <span className="dot">•</span> : null}
                      {s}
                    </span>
                  ))}
                </p>
              ) : null;

              return (
                <a
                  key={resolveKey(item) || `${name}-${deptName}`}
                  href="#"
                  className="alx-card"
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
                    <div className="alx-placeholder">
                      <div className="alx-initials">{initials(name)}</div>
                    </div>
                  )}

                  {deptName ? (
                    <div className="alx-pill" title={deptName}>
                      {deptName}
                    </div>
                  ) : null}

                  <div className="vignette"></div>

                  <div className="info">
                    <p className="alx-name">{name}</p>
                    {metaLine}
                    {subLine}
                  </div>
                </a>
              );
            })}
          </div>

          {lastPage > 1 ? (
            <div className="alx-pagination">
              <div className="alx-pager">
                <button
                  className="alx-pagebtn"
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
                        className={`alx-pagebtn ${currentPage === 1 ? "active" : ""}`}
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
                        className={`alx-pagebtn ${currentPage === p ? "active" : ""}`}
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
                        className={`alx-pagebtn ${currentPage === lastPage ? "active" : ""}`}
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
                  className="alx-pagebtn"
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
        <div className="alx-state">
          <div aria-hidden="true" style={{ width: "170px", maxWidth: "100%", margin: "0 auto 10px", display: "block", color: "var(--alx-brand)" }}>
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
          {emptyMessage}
        </div>
      )}

      <div
        id="alxModal"
        className={`alx-modal ${activeItem ? "show" : ""}`}
        aria-hidden={activeItem ? "false" : "true"}
        role="dialog"
        aria-modal="true"
        onClick={closeModal}
      >
        <div className="alx-modal__overlay" data-close="1"></div>
        <div
          className="alx-modal__panel"
          role="document"
          aria-label="Alumni details"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="alx-modal__close"
            type="button"
            aria-label="Close"
            onClick={closeModal}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>

          <div className="alx-modal__hero" dangerouslySetInnerHTML={{ __html: modalHero }} />
          <div className="alx-modal__details" dangerouslySetInnerHTML={{ __html: modalDetails }} />
        </div>
      </div>
    </div>
  );
}