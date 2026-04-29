import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { buildUrl } from "../../redux/request";
import {
  fetchGalleryDepartments,
  fetchGalleryList,
  selectGalleryDepartments,
  selectGalleryDepartmentsStatus,
  selectGalleryItems,
  selectGalleryStatus,
} from "../../redux/crm/gallerySlice";

const ALBUMS_PER_PAGE = 12;
const PHOTOS_PER_PAGE = 18;
const EVENTS_ENDPOINT = "/api/public/gallery-events";
const EVENT_SHOW_ENDPOINT = "/api/public/gallery-events/__SHORTCODE__";

const styles = String.raw`
.gxa-wrap{
  --gxa-brand: #9E363A;
  --gxa-brand-rgb: 158, 54, 58;
  --gxa-accent: #C94B50;
  --gxa-accent-rgb: 201, 75, 80;
  --gxa-ink: #0f172a;
  --gxa-muted: #64748b;
  --gxa-bg: var(--page-bg, #ffffff);
  --gxa-card: var(--surface, #ffffff);
  --gxa-line: var(--line-soft, rgba(15,23,42,.10));
  --gxa-shadow: 0 10px 24px rgba(2,6,23,.08);
  --gxa-footer-safe: 96px;

  max-width: 1320px;
  margin: 18px auto 0px;
  padding: 0 12px var(--gxa-footer-safe);
  background: transparent;
  position: relative;
  overflow: visible;
  isolation: isolate;
}

.gxa-head{
  background: var(--gxa-card);
  border: 1px solid var(--gxa-line);
  border-radius: 16px;
  box-shadow: var(--gxa-shadow);
  padding: 14px 16px;
  margin-bottom: 16px;

  display:flex;
  gap: 12px;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
}

.gxa-title{
  margin: 0;
  font-weight: 950;
  letter-spacing: .2px;
  color: var(--gxa-ink);
  font-size: 28px;
  display:flex;
  align-items:center;
  gap: 10px;
}
.gxa-title i{ color: var(--gxa-brand); }

.gxa-sub{
  margin: 6px 0 0;
  color: var(--gxa-muted);
  font-size: 14px;
}

.gxa-tools{
  display:flex;
  gap: 10px;
  align-items:center;
  flex-wrap: wrap;
}

.gxa-search{
  position: relative;
  min-width: 260px;
  max-width: 520px;
  flex: 1 1 320px;
}
.gxa-search i{
  position:absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  opacity: .65;
  color: var(--gxa-muted);
  pointer-events:none;
}
.gxa-search input{
  width:100%;
  height: 42px;
  border-radius: 999px;
  padding: 11px 12px 11px 42px;
  border: 1px solid var(--gxa-line);
  background: var(--gxa-card);
  color: var(--gxa-ink);
  outline: none;
}
.gxa-search input:focus{
  border-color: rgba(var(--gxa-brand-rgb), .55);
  box-shadow: 0 0 0 4px rgba(var(--gxa-brand-rgb), .18);
}

.gxa-select{
  position: relative;
  min-width: 260px;
  max-width: 360px;
  flex: 0 1 320px;
}
.gxa-select__icon{
  position:absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  opacity: .70;
  color: var(--gxa-muted);
  pointer-events:none;
  font-size: 14px;
}
.gxa-select__caret{
  position:absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  opacity: .70;
  color: var(--gxa-muted);
  pointer-events:none;
  font-size: 12px;
}
.gxa-select select{
  width: 100%;
  height: 42px;
  border-radius: 999px;
  padding: 10px 38px 10px 42px;
  border: 1px solid var(--gxa-line);
  background: var(--gxa-card);
  color: var(--gxa-ink);
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}
.gxa-select select:focus{
  border-color: rgba(var(--gxa-brand-rgb), .55);
  box-shadow: 0 0 0 4px rgba(var(--gxa-brand-rgb), .18);
}

.gxa-btn{
  height: 42px;
  border-radius: 999px;
  border: 1px solid var(--gxa-line);
  background: var(--gxa-card);
  color: var(--gxa-ink);
  padding: 0 16px;
  font-weight: 900;
  display:inline-flex;
  align-items:center;
  gap: 8px;
  box-shadow: 0 8px 18px rgba(2,6,23,.06);
  cursor: pointer;
  transition: .18s ease;
}
.gxa-btn:hover{ background: rgba(2,6,23,.03); }
.gxa-btn--brand{
  border-color: rgba(var(--gxa-brand-rgb), .28);
  color: var(--gxa-brand);
  background: rgba(var(--gxa-brand-rgb), .06);
}
.gxa-btn--brand:hover{
  background: rgba(var(--gxa-brand-rgb), .10);
  border-color: rgba(var(--gxa-brand-rgb), .40);
}

@media (min-width: 992px){
  .gxa-head{ flex-wrap: nowrap; align-items: center; }
  .gxa-tools{ flex-wrap: nowrap; justify-content: flex-end; }
  .gxa-search{ min-width: 0; flex: 1 1 520px; }
  .gxa-select{ min-width: 0; flex: 0 1 320px; }
}

.gxa-albums{
  display:grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  align-items: stretch;
}

.gxa-album{
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(2,6,23,.06);
  box-shadow: 0 4px 12px rgba(2,6,23,.04);
  cursor: pointer;
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
  will-change: transform;
  display:flex;
  flex-direction: column;
  min-height: 100%;
}
.gxa-album:hover{
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(2,6,23,.08);
  border-color: rgba(var(--gxa-brand-rgb), .28);
}

.gxa-album__media{
  position: relative;
  height: clamp(170px, 19vw, 210px);
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(var(--gxa-brand-rgb), .14), rgba(var(--gxa-accent-rgb), .10)),
    #f8fafc;
}

.gxa-album__slides{
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(var(--gxa-brand-rgb), .12), rgba(var(--gxa-accent-rgb), .08)),
    #f8fafc;
}

.gxa-album__slide{
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display:block;
  opacity: 0;
  transform: scale(1.05);
  transition: opacity .85s ease, transform 1.05s ease;
  will-change: opacity, transform;
  pointer-events: none;
}
.gxa-album__slide.is-active{
  opacity: 1;
  transform: scale(1);
  z-index: 1;
}

.gxa-album__media img{
  width: 100%;
  height: 100%;
  object-fit: cover;
  display:block;
  transition: transform .4s ease;
}

.gxa-album__media::after{
  content:"";
  position:absolute;
  inset:auto 0 0 0;
  height: 38%;
  background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(2,6,23,.22) 62%, rgba(2,6,23,.48) 100%);
  pointer-events:none;
  z-index: 2;
}

.gxa-album--standalone .gxa-album__media {
  height: clamp(220px, 25vw, 360px);
}
.gxa-album--standalone .gxa-album__media::after {
  display: none;
}
.gxa-album--standalone:hover .gxa-album__media img {
  transform: scale(1.06);
}

.gxa-album__fallback{
  width: 100%;
  height: 100%;
  display:flex;
  align-items:center;
  justify-content:center;
  color: var(--gxa-brand);
  font-size: 38px;
  opacity: .8;
}

.gxa-album__count{
  position:absolute;
  right: 12px;
  top: 12px;
  background: linear-gradient(135deg, rgba(var(--gxa-brand-rgb), .96), rgba(var(--gxa-accent-rgb), .92));
  color: #fff;
  border: 1px solid rgba(255,255,255,.18);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 950;
  display:inline-flex;
  align-items:center;
  gap: 6px;
  backdrop-filter: blur(8px);
  z-index: 3;
}

.gxa-album__dots{
  position:absolute;
  left: 12px;
  bottom: 12px;
  display:flex;
  align-items:center;
  gap: 6px;
  z-index: 3;
}
.gxa-album__dot{
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(255,255,255,.45);
  border: 1px solid rgba(255,255,255,.24);
  transition: transform .22s ease, background .22s ease;
  box-shadow: 0 2px 10px rgba(0,0,0,.22);
}
.gxa-album__dot.is-active{
  background: #fff;
  transform: scale(1.15);
}

.gxa-album__body{
  padding: 14px 14px 15px;
  display:flex;
  flex-direction: column;
  gap: 10px;
  flex: 1 1 auto;
}

.gxa-album__row{
  display:flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items:center;
}

.gxa-pill{
  display:inline-flex;
  align-items:center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--gxa-line);
  background: rgba(2,6,23,.03);
  color: var(--gxa-ink);
  font-size: 11.5px;
  font-weight: 900;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.gxa-pill--brand{
  color: var(--gxa-brand);
  border-color: rgba(var(--gxa-brand-rgb), .24);
  background: rgba(var(--gxa-brand-rgb), .08);
}

.gxa-album__title{
  margin: 0;
  color: var(--gxa-ink);
  font-size: 18px;
  line-height: 1.2;
  font-weight: 950;
  letter-spacing: .1px;
}

.gxa-album__desc{
  color: var(--gxa-muted);
  font-size: 13px;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 58px;
}

.gxa-album__cta{
  margin-top: auto;
  display:flex;
  align-items:center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 4px;
}

.gxa-album__link{
  display:inline-flex;
  align-items:center;
  gap: 8px;
  color: var(--gxa-brand);
  font-size: 13px;
  font-weight: 950;
}

.gxa-album-head{
  background: var(--gxa-card);
  border: 1px solid var(--gxa-line);
  border-radius: 12px;
  box-shadow: var(--gxa-shadow);
  padding: 16px 18px;
  margin-bottom: 16px;
  display:grid;
  grid-template-columns: minmax(0,1fr);
  gap: 10px;
}

.gxa-album-head__top{
  display:flex;
  flex-wrap: wrap;
  align-items:center;
  justify-content: space-between;
  gap: 10px;
}

.gxa-album-head__title{
  margin: 0;
  font-size: 26px;
  line-height: 1.15;
  color: var(--gxa-ink);
  font-weight: 950;
  letter-spacing: .1px;
  display:flex;
  align-items:center;
  gap: 10px;
}
.gxa-album-head__title i{ color: var(--gxa-brand); }

.gxa-album-head__desc{
  margin: 0;
  color: var(--gxa-muted);
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.gxa-grid{
  display:grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  grid-auto-rows: 10px;
  gap: 18px;
  align-items: start;
}

.gxa-item{
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  background: #fff;
  border: 1px solid rgba(2,6,23,.06);
  box-shadow: 0 4px 12px rgba(2,6,23,.04);
  cursor: pointer;
  user-select: none;
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
  will-change: transform;
}
.gxa-item:hover{
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(2,6,23,.08);
  border-color: rgba(var(--gxa-brand-rgb), .28);
}

.gxa-item img{
  width: 100%;
  height: auto;
  display:block;
}

.gxa-meta{
  position:absolute;
  left:0; right:0; bottom:0;
  padding: 10px 10px 9px;
  color: #fff;
  background: linear-gradient(180deg, rgba(2,6,23,0) 0%, rgba(2,6,23,.55) 28%, rgba(2,6,23,.82) 100%);
  pointer-events: none;
}

.gxa-meta__title{
  font-weight: 950;
  font-size: 13px;
  letter-spacing: .2px;
  line-height: 1.18;
  text-shadow: 0 2px 10px rgba(0,0,0,.35);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.gxa-meta__desc{
  margin-top: 4px;
  font-size: 12px;
  opacity: .92;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-shadow: 0 2px 10px rgba(0,0,0,.35);
}

.gxa-meta__tags{
  margin-top: 6px;
  display:flex;
  gap: 6px;
  flex-wrap: wrap;
}

.gxa-tag{
  font-size: 11px;
  font-weight: 950;
  padding: 5px 8px;
  border-radius: 999px;
  background: rgba(255,255,255,.14);
  border: 1px solid rgba(255,255,255,.18);
  backdrop-filter: blur(6px);
  max-width: 100%;
  overflow:hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gxa-tag.more{
  background: rgba(var(--gxa-accent-rgb), .28);
  border-color: rgba(var(--gxa-accent-rgb), .42);
}

.gxa-state{
  background: var(--gxa-card);
  border: 1px solid var(--gxa-line);
  border-radius: 16px;
  box-shadow: var(--gxa-shadow);
  padding: 18px;
  color: var(--gxa-muted);
  text-align:center;
  position: relative;
  z-index: 0;
  margin-bottom: 18px;
}

.gxa-state .gxa-spin{
  width: 42px;
  height: 42px;
  margin: 0 auto 10px;
  display:flex;
  align-items:center;
  justify-content:center;
  border-radius: 999px;
  border: 1px solid var(--gxa-line);
  background: rgba(var(--gxa-brand-rgb), .05);
  box-shadow: 0 10px 22px rgba(2,6,23,.08);
  color: var(--gxa-brand);
  font-size: 18px;
}

.gxa-pagination{
  display:flex;
  justify-content:center;
  margin-top: 18px;
}

.gxa-pagination .gxa-pager{
  display:flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items:center;
  justify-content:center;
  padding: 10px;
}

.gxa-pagebtn{
  border:1px solid var(--gxa-line);
  background: var(--gxa-card);
  color: var(--gxa-ink);
  border-radius: 12px;
  padding: 9px 12px;
  font-size: 13px;
  font-weight: 950;
  box-shadow: 0 8px 18px rgba(2,6,23,.06);
  cursor:pointer;
  user-select:none;
  transition: .18s ease;
}
.gxa-pagebtn:hover{ background: rgba(2,6,23,.03); }
.gxa-pagebtn[disabled]{ opacity:.55; cursor:not-allowed; }
.gxa-pagebtn.active{
  background: rgba(var(--gxa-brand-rgb), .12);
  border-color: rgba(var(--gxa-brand-rgb), .35);
  color: var(--gxa-brand);
}

.gxa-lb{
  position: fixed;
  inset: 0;
  background: rgba(2,6,23,.72);
  display:flex;
  align-items:center;
  justify-content:center;
  z-index: 9999;
  padding: 18px;
}

.gxa-lb__inner{
  max-width: min(1100px, 96vw);
  max-height: min(86vh, 900px);
  background: #0b1220;
  border: 1px solid rgba(255,255,255,.12);
  box-shadow: 0 22px 60px rgba(0,0,0,.45);
  position: relative;
  display:flex;
  flex-direction: column;
  overflow:hidden;
  border-radius: 14px;
}

.gxa-lb__img{
  max-width: min(1100px, 96vw);
  max-height: min(72vh, 820px);
  display:block;
  object-fit: contain;
}

.gxa-lb__meta{
  border-top: 1px solid rgba(255,255,255,.10);
  padding: 12px 14px 14px;
  color: rgba(255,255,255,.92);
  background: rgba(255,255,255,.02);
}

.gxa-lb__title{
  font-weight: 950;
  font-size: 15px;
  letter-spacing: .2px;
  color:#fff;
  margin: 0 0 6px;
}

.gxa-lb__desc{
  margin: 0 0 10px;
  font-size: 13px;
  line-height: 1.35;
  color: rgba(255,255,255,.86);
  white-space: pre-wrap;
}

.gxa-lb__tags{
  display:flex;
  gap: 8px;
  flex-wrap: wrap;
}

.gxa-lb__tag{
  font-size: 12px;
  font-weight: 900;
  padding: 7px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,.10);
  border: 1px solid rgba(255,255,255,.14);
}

.gxa-lb__close{
  position:absolute;
  top: 10px;
  right: 10px;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.18);
  background: rgba(0,0,0,.35);
  color:#fff;
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:center;
  z-index: 5;
  transition: .18s ease;
}
.gxa-lb__close:hover{
  background: rgba(var(--gxa-brand-rgb), .38);
  border-color: rgba(255,255,255,.24);
}

@media (max-width: 640px){
  .gxa-title{ font-size: 24px; }
  .gxa-search{ min-width: 220px; flex: 1 1 240px; }
  .gxa-select{ min-width: 220px; flex: 1 1 240px; }
  .gxa-lb__img{ max-height: min(66vh, 760px); }
  .gxa-wrap{ --gxa-footer-safe: 84px; }
  .gxa-album-head__title{ font-size: 22px; }
  .gxa-album__desc{ min-height: auto; }
}
`;

const pickText = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null) {
      const text = String(value).trim();
      if (text) return text;
    }
  }
  return "";
};

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));

const ensureFontAwesome = () => {
  if (document.querySelector('link[href*="font-awesome"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";
  document.head.appendChild(link);
};

const normalizeUrl = (url) => {
  const text = pickText(url);
  if (!text) return "";
  if (/^(data:|blob:|https?:\/\/)/i.test(text)) return text;
  return buildUrl(text);
};

const toTimestamp = (value) => {
  const text = pickText(value);
  if (!text) return 0;
  const candidates = [text, text.replace(" ", "T")];
  for (const candidate of candidates) {
    const ts = Date.parse(candidate);
    if (Number.isFinite(ts)) return ts;
  }
  return 0;
};

const formatDate = (value) => {
  const ts = toTimestamp(value);
  if (!ts) return pickText(value);
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalizeTags = (raw) => {
  if (Array.isArray(raw)) {
    return Array.from(
      new Set(
        raw
          .map((tag) => pickText(tag).replace(/^#+/, ""))
          .filter(Boolean)
      )
    );
  }

  const text = pickText(raw);
  if (!text) return [];

  try {
    if (text.startsWith("[") || text.startsWith("{")) {
      return normalizeTags(JSON.parse(text));
    }
  } catch {
    // continue with string splitting
  }

  const parts = text.includes("|")
    ? text.split("|")
    : text.includes(",")
      ? text.split(",")
      : text.split(/\s+/);

  return Array.from(
    new Set(
      parts
        .map((tag) => pickText(tag).replace(/^#+/, ""))
        .filter(Boolean)
    )
  );
};

const renderTagChips = (tags, max = 3) => {
  const safeTags = Array.isArray(tags) ? tags.filter(Boolean) : [];
  if (!safeTags.length) return "";

  const shown = safeTags.slice(0, max);
  const more = safeTags.length - shown.length;
  let html = shown.map((tag) => `<span class="gxa-tag">${esc(tag)}</span>`).join("");
  if (more > 0) {
    html += `<span class="gxa-tag more">+${more}</span>`;
  }
  return html;
};


const pick = (obj, keys) => {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return value;
    }
  }
  return "";
};

const pickItems = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.images)) return payload.images;
  if (Array.isArray(payload?.photos)) return payload.photos;
  if (Array.isArray(payload?.events)) return payload.events;
  return [];
};

const uniqueUrls = (items) => {
  const seen = new Set();
  const output = [];

  (Array.isArray(items) ? items : []).forEach((raw) => {
    const url = normalizeUrl(raw);
    if (!url) return;

    const key = url.toLowerCase();
    if (seen.has(key)) return;

    seen.add(key);
    output.push(url);
  });

  return output;
};

const apiJson = async (path) => {
  const response = await fetch(buildUrl(path), {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });

  const text = await response.text();
  let payload = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { message: text };
  }

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || `Request failed with status ${response.status}`);
  }

  return payload;
};

const getDepartmentParam = (department) =>
  pickText(department?.slug, department?.shortcode, department?.uuid, department?.id);

const buildEventsEndpoint = (departmentParam = "") => {
  const params = new URLSearchParams({ page: "1", per_page: "200" });
  if (departmentParam) params.set("department", departmentParam);
  return `${EVENTS_ENDPOINT}?${params.toString()}`;
};

const buildEventShowEndpoint = (shortcode, departmentParam = "") => {
  const params = new URLSearchParams({ per_page: "200" });
  if (departmentParam) params.set("department", departmentParam);

  return `${EVENT_SHOW_ENDPOINT.replace("__SHORTCODE__", encodeURIComponent(shortcode))}?${params.toString()}`;
};

const extractAlbumImages = (item) => {
  const collected = [];

  const pushMaybe = (value) => {
    if (!value) return;

    if (typeof value === "string") {
      const url = normalizeUrl(value);
      if (url) collected.push(url);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(pushMaybe);
      return;
    }

    if (typeof value === "object") {
      const direct = pick(value, [
        "image_url",
        "image_full_url",
        "cover_image_url",
        "cover_image",
        "url",
        "src",
        "image",
        "full_url",
        "file_url",
        "path",
        "thumbnail_url",
      ]);

      if (direct) pushMaybe(direct);

      [
        value.images,
        value.photos,
        value.media,
        value.attachments,
        value.gallery_images,
        value.preview_images,
        value.files,
      ].forEach(pushMaybe);
    }
  };

  pushMaybe(item?.cover_image_url);
  pushMaybe(item?.cover_image);
  pushMaybe(item?.image_url);
  pushMaybe(item?.image);
  pushMaybe(item?.event?.cover_image_url);
  pushMaybe(item?.event?.cover_image);
  pushMaybe(item?.event?.image_url);
  pushMaybe(item?.event?.image);

  [
    item?.preview_images,
    item?.images,
    item?.photos,
    item?.gallery_images,
    item?.media,
    item?.attachments,
    item?.event?.preview_images,
    item?.event?.images,
    item?.event?.photos,
    item?.event?.gallery_images,
    item?.event?.media,
    item?.event?.attachments,
  ].forEach(pushMaybe);

  return uniqueUrls(collected).slice(0, 12);
};

const normalizePublicAlbumCard = (item, index = 0) => {
  const event = item?.event || {};
  const shortcode = pickText(
    event?.shortcode,
    item?.event_shortcode,
    item?.shortcode,
    item?.code,
    item?.slug
  );
  const images = extractAlbumImages(item);
  const title = pickText(
    event?.title,
    item?.event_title,
    item?.title,
    item?.name,
    shortcode ? "Untitled Event" : "Gallery Image"
  );
  const description = pickText(
    event?.description,
    item?.event_description,
    item?.description,
    item?.desc,
    item?.summary
  );
  const date = pickText(
    event?.date,
    event?.event_date,
    item?.event_date,
    item?.date,
    item?.published_at,
    item?.created_at
  );
  const count =
    parseInt(pickText(item?.images_count, item?.photos_count, item?.count), 10) ||
    images.length ||
    (shortcode ? 0 : 1);
  const full = images[0] || "";

  return {
    type: shortcode ? "event" : "single",
    key: `${shortcode ? "event" : "single"}-${shortcode || full || item?.uuid || item?.id || index}`,
    shortcode,
    title,
    description: description || (shortcode ? "No description available for this event." : ""),
    date,
    latestCreatedAt: toTimestamp(item?.latest_created_at || item?.created_at || item?.updated_at || date),
    imagesCount: Math.max(count, images.length),
    previewImages: images,
    full,
    tags: normalizeTags(item?.tags ?? item?.tags_json),
  };
};

const dedupeCards = (cards) => {
  const seen = new Set();
  const output = [];

  (Array.isArray(cards) ? cards : []).forEach((card, index) => {
    if (!card) return;
    const key = pickText(card?.shortcode, card?.full, card?.key, `${card?.title || "card"}-${index}`).toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    output.push(card);
  });

  return output.sort((left, right) => (right.latestCreatedAt || 0) - (left.latestCreatedAt || 0));
};

const normalizePublicAlbumCards = (payload) =>
  dedupeCards(pickItems(payload).map((item, index) => normalizePublicAlbumCard(item, index)));

const normalizeDetailPhoto = (item, eventMeta = {}) => ({
  id: item?.id ?? null,
  uuid: pickText(item?.uuid),
  image: pickText(item?.image),
  image_url: pickText(item?.image_url, item?.image_full_url, item?.url, item?.src),
  title: pickText(item?.title) || "Gallery Image",
  description: pickText(item?.description),
  tags: normalizeTags(item?.tags ?? item?.tags_json),
  created_at: pickText(item?.created_at),
  updated_at: pickText(item?.updated_at),
  event_shortcode: pickText(item?.event_shortcode, item?.event?.shortcode, eventMeta?.shortcode),
  event_title: pickText(item?.event_title, item?.event?.title, eventMeta?.title),
  event_description: pickText(item?.event_description, item?.event?.description, eventMeta?.description),
  event_date: pickText(item?.event_date, item?.event?.date, eventMeta?.date),
});

const normalizeEventShowPayload = (payload, shortcode) => {
  const event = payload?.event || payload?.data?.event || {};
  const eventMeta = {
    shortcode: pickText(event?.shortcode, shortcode),
    title: pickText(event?.title) || "Album",
    description: pickText(event?.description),
    date: pickText(event?.date),
  };

  const items = pickItems(payload)
    .map((item) => normalizeDetailPhoto(item, eventMeta))
    .filter((item) => normalizeUrl(item?.image_url || item?.image));

  return { event: eventMeta, items };
};

const resolveDeptUuidFromUrl = (deptBySlug, deptByUuid) => {
  const url = new URL(window.location.href);
  const direct = pickText(url.searchParams.get("department"), url.searchParams.get("dept"));

  if (!direct) return "";
  const normalized = direct.toLowerCase();
  if (deptBySlug.has(normalized)) return deptBySlug.get(normalized);
  if (deptByUuid.has(direct)) return direct;
  return "";
};

const resolveEventFromUrl = () => {
  const url = new URL(window.location.href);
  return pickText(url.searchParams.get("event"), url.searchParams.get("album"));
};

const syncUrl = (selectedDeptUuid, selectedEventShortcode, deptByUuid) => {
  const url = new URL(window.location.href);

  if (selectedDeptUuid) {
    const department = deptByUuid.get(selectedDeptUuid);
    const slug = pickText(department?.shortcode, department?.slug);
    if (slug) {
      url.searchParams.set("dept", slug);
      url.searchParams.delete("department");
    } else {
      url.searchParams.set("department", selectedDeptUuid);
      url.searchParams.delete("dept");
    }
  } else {
    url.searchParams.delete("department");
    url.searchParams.delete("dept");
  }

  if (selectedEventShortcode) {
    url.searchParams.set("event", selectedEventShortcode);
    url.searchParams.delete("album");
  } else {
    url.searchParams.delete("event");
    url.searchParams.delete("album");
  }

  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
};

const groupAlbumCards = (items) => {
  const eventMap = new Map();
  const standaloneCards = [];

  (Array.isArray(items) ? items : []).forEach((item, index) => {
    const imageUrl = normalizeUrl(item?.image_url || item?.image);
    if (!imageUrl) return;

    const shortcode = pickText(item?.event_shortcode);
    const createdAtTs = toTimestamp(item?.created_at || item?.updated_at);

    if (!shortcode) {
      standaloneCards.push({
        type: "single",
        key: `single-${item?.uuid || item?.id || index}`,
        title: pickText(item?.title) || "Gallery Image",
        description: pickText(item?.description),
        full: imageUrl,
        latestCreatedAt: createdAtTs,
        tags: normalizeTags(item?.tags),
      });
      return;
    }

    if (!eventMap.has(shortcode)) {
      eventMap.set(shortcode, {
        type: "event",
        key: `event-${shortcode}`,
        shortcode,
        title: pickText(item?.event_title) || "Untitled Event",
        description:
          pickText(item?.event_description) || "No description available for this event.",
        date: pickText(item?.event_date),
        latestCreatedAt: createdAtTs,
        imagesCount: 0,
        previewImages: [],
      });
    }

    const group = eventMap.get(shortcode);
    group.imagesCount += 1;
    group.latestCreatedAt = Math.max(group.latestCreatedAt || 0, createdAtTs || 0);

    if (imageUrl && !group.previewImages.includes(imageUrl) && group.previewImages.length < 8) {
      group.previewImages.push(imageUrl);
    }

    if (!pickText(group.title) && pickText(item?.event_title)) {
      group.title = pickText(item?.event_title);
    }
    if (
      (!pickText(group.description) || group.description === "No description available for this event.") &&
      pickText(item?.event_description)
    ) {
      group.description = pickText(item?.event_description);
    }
    if (!pickText(group.date) && pickText(item?.event_date)) {
      group.date = pickText(item?.event_date);
    }
  });

  return [...standaloneCards, ...Array.from(eventMap.values())].sort(
    (left, right) => (right.latestCreatedAt || 0) - (left.latestCreatedAt || 0)
  );
};

function AlbumCard({ card, onOpenEvent, onOpenStandalone }) {
  const previewImages = Array.isArray(card?.previewImages)
    ? card.previewImages.filter(Boolean)
    : [];
  const cover = card?.full || previewImages[0] || "";
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setActiveIndex(0);
  }, [card?.key]);

  useEffect(() => {
    if (card?.type !== "event") return undefined;
    if (previewImages.length <= 1 || paused) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % previewImages.length);
    }, 2400);

    return () => window.clearInterval(timer);
  }, [card?.type, previewImages.length, paused]);

  const handleActivate = () => {
    if (card?.type === "event") {
      onOpenEvent(card);
      return;
    }
    onOpenStandalone(card);
  };

  const media = card?.type === "event" && previewImages.length ? (
    <div
      className="gxa-album__slides"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {previewImages.map((src, index) => (
        <img
          key={`${card.key}-slide-${src}-${index}`}
          className={`gxa-album__slide ${index === activeIndex ? "is-active" : ""}`}
          src={src}
          alt={card.title}
          loading="lazy"
          decoding="async"
        />
      ))}
    </div>
  ) : cover ? (
    <img src={cover} alt={card.title} loading="lazy" decoding="async" />
  ) : (
    <div className="gxa-album__fallback">
      <i className="fa-regular fa-images" />
    </div>
  );

  return (
    <article
      className={`gxa-album ${card?.type !== "event" ? "gxa-album--standalone" : ""}`}
      role="button"
      tabIndex={0}
      aria-label={card.title}
      onClick={handleActivate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleActivate();
        }
      }}
    >
      <div className="gxa-album__media">
        {media}

        {card?.type === "event" ? (
          <>
            <div className="gxa-album__count">
              <i className="fa-regular fa-image" />
              <span>
                {card.imagesCount} Photo{card.imagesCount === 1 ? "" : "s"}
              </span>
            </div>

            {previewImages.length > 1 ? (
              <div className="gxa-album__dots">
                {previewImages.map((_, index) => (
                  <span
                    key={`${card.key}-dot-${index}`}
                    className={`gxa-album__dot ${index === activeIndex ? "is-active" : ""}`}
                  />
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="gxa-album__body">
        {card.date ? (
          <div className="gxa-album__row">
            <span className="gxa-pill gxa-pill--brand">
              <i className="fa-regular fa-calendar" />
              {formatDate(card.date)}
            </span>
          </div>
        ) : null}

        <h2 className="gxa-album__title">{card.title}</h2>
        {card.description ? (
          <div className="gxa-album__desc">{card.description}</div>
        ) : null}

        <div className="gxa-album__cta">
          <span className="gxa-album__link">
            <i className={card?.type === "event" ? "fa-solid fa-arrow-right" : "fa-regular fa-eye"} />
            <span>{card?.type === "event" ? "Open Album" : "View Image"}</span>
          </span>
        </div>
      </div>
    </article>
  );
}

function PhotoTile({ item, onOpen, onMediaLoad, registerTile }) {
  const imageUrl = normalizeUrl(item?.image_url || item?.image);
  const title = pickText(item?.title) || "Gallery Image";
  const description = pickText(item?.description);
  const tags = normalizeTags(item?.tags);

  return (
    <div
      className="gxa-item"
      ref={registerTile}
      role="button"
      tabIndex={0}
      aria-label={title}
      onClick={() => onOpen({ src: imageUrl, title, description, tags })}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen({ src: imageUrl, title, description, tags });
        }
      }}
    >
      <img
        src={imageUrl}
        alt={title}
        loading="lazy"
        decoding="async"
        onLoad={onMediaLoad}
        onError={onMediaLoad}
      />

      <div className="gxa-meta">
        <div className="gxa-meta__title">{title}</div>
        <div className="gxa-meta__desc" style={!description ? { opacity: 0 } : undefined}>
          {description || "placeholder"}
        </div>
        {tags.length ? (
          <div
            className="gxa-meta__tags"
            dangerouslySetInnerHTML={{ __html: renderTagChips(tags, 3) }}
          />
        ) : null}
      </div>
    </div>
  );
}

export default function Gallery() {
  const dispatch = useDispatch();
  const departments = useSelector(selectGalleryDepartments);
  const departmentsStatus = useSelector(selectGalleryDepartmentsStatus);
  const galleryItems = useSelector(selectGalleryItems);
  const galleryStatus = useSelector(selectGalleryStatus);

  const [initialized, setInitialized] = useState(false);
  const [selectedDeptUuid, setSelectedDeptUuid] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedEventShortcode, setSelectedEventShortcode] = useState("");
  const [lightbox, setLightbox] = useState(null);
  const [eventStatus, setEventStatus] = useState("idle");
  const [eventError, setEventError] = useState("");
  const [eventCards, setEventCards] = useState([]);
  const [eventDetailsStatus, setEventDetailsStatus] = useState("idle");
  const [eventDetailsError, setEventDetailsError] = useState("");
  const [eventDetailsMeta, setEventDetailsMeta] = useState(null);
  const [eventDetailsItems, setEventDetailsItems] = useState([]);
  const gridRef = useRef(null);
  const tileRefs = useRef([]);

  useEffect(() => {
    ensureFontAwesome();
    dispatch(fetchGalleryDepartments());
    dispatch(fetchGalleryList());
  }, [dispatch]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, 260);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const deptByUuid = useMemo(
    () => new Map((departments || []).map((department) => [department.uuid, department])),
    [departments]
  );

  const deptBySlug = useMemo(
    () =>
      new Map(
        (departments || [])
          .flatMap((department) => {
            const keys = [pickText(department?.shortcode), pickText(department?.slug)]
              .map((value) => value.toLowerCase())
              .filter(Boolean);
            return keys.map((key) => [key, department.uuid]);
          })
      ),
    [departments]
  );

  const visibleItems = useMemo(
    () =>
      (Array.isArray(galleryItems) ? galleryItems : [])
        .filter((item) => item?.visible !== false)
        .filter((item) => normalizeUrl(item?.image_url || item?.image)),
    [galleryItems]
  );

  useEffect(() => {
    const departmentsReady =
      departmentsStatus !== "idle" && departmentsStatus !== "loading";

    if (!departmentsReady || initialized) return;

    const deptFromUrl = resolveDeptUuidFromUrl(deptBySlug, deptByUuid);
    const eventFromUrl = resolveEventFromUrl();

    if (deptFromUrl && deptByUuid.has(deptFromUrl)) {
      setSelectedDeptUuid(deptFromUrl);
    }

    if (eventFromUrl) {
      setSelectedEventShortcode(eventFromUrl);
    }

    setInitialized(true);
  }, [departmentsStatus, initialized, deptBySlug, deptByUuid]);

  useEffect(() => {
    if (!initialized) return;
    syncUrl(selectedDeptUuid, selectedEventShortcode, deptByUuid);
  }, [initialized, selectedDeptUuid, selectedEventShortcode, deptByUuid]);

  const selectedDepartment = useMemo(() => {
    if (!selectedDeptUuid) return null;
    return deptByUuid.get(selectedDeptUuid) || null;
  }, [selectedDeptUuid, deptByUuid]);

  const selectedDepartmentParam = useMemo(
    () => getDepartmentParam(selectedDepartment),
    [selectedDepartment]
  );

  const selectedDeptName = useMemo(() => {
    if (!selectedDepartment) return "";
    return pickText(selectedDepartment?.title);
  }, [selectedDepartment]);

  useEffect(() => {
    let cancelled = false;

    const loadEventCards = async () => {
      setEventStatus("loading");
      setEventError("");

      try {
        const payload = await apiJson(buildEventsEndpoint(selectedDepartmentParam));
        const cards = normalizePublicAlbumCards(payload);

        if (!cancelled) {
          setEventCards(cards);
          setEventStatus("succeeded");
        }
      } catch (error) {
        if (!cancelled) {
          setEventCards([]);
          setEventStatus("failed");
          setEventError(error?.message || "Failed to load gallery event cards");
        }
      }
    };

    loadEventCards();

    return () => {
      cancelled = true;
    };
  }, [selectedDepartmentParam]);

  const deptFilteredItems = useMemo(() => {
    if (!selectedDeptUuid) return visibleItems;

    const selectedDeptId = selectedDepartment?.id != null ? String(selectedDepartment.id) : "";

    return visibleItems.filter((item) => {
      const itemUuid = pickText(item?.department_uuid);
      const itemId = item?.department_id != null ? String(item.department_id) : "";

      // Public pages should still show common/global gallery rows with a department filter.
      if (!itemUuid && !itemId) return true;

      return itemUuid === selectedDeptUuid || (selectedDeptId && itemId === selectedDeptId);
    });
  }, [visibleItems, selectedDeptUuid, selectedDepartment]);

  const albumCards = useMemo(() => {
    const groupedCards = groupAlbumCards(deptFilteredItems);
    const directCards = Array.isArray(eventCards) ? eventCards : [];
    const cards = dedupeCards([...directCards, ...groupedCards]);

    if (!searchQuery) return cards;

    const query = searchQuery.toLowerCase();
    return cards.filter((card) => {
      const haystack = [card.title, card.description, card.shortcode]
        .map((value) => pickText(value).toLowerCase())
        .join(" ");
      return haystack.includes(query);
    });
  }, [eventCards, deptFilteredItems, searchQuery]);

  const eventItemsByShortcode = useMemo(() => {
    const map = new Map();
    deptFilteredItems.forEach((item) => {
      const shortcode = pickText(item?.event_shortcode).toLowerCase();
      if (!shortcode) return;
      if (!map.has(shortcode)) map.set(shortcode, []);
      map.get(shortcode).push(item);
    });

    map.forEach((items, shortcode) => {
      map.set(
        shortcode,
        items.slice().sort((left, right) => {
          const rightTs = toTimestamp(right?.created_at || right?.updated_at);
          const leftTs = toTimestamp(left?.created_at || left?.updated_at);
          return rightTs - leftTs;
        })
      );
    });

    return map;
  }, [deptFilteredItems]);

  const selectedAlbumCard = useMemo(() => {
    if (!selectedEventShortcode) return null;
    const target = selectedEventShortcode.toLowerCase();

    return (
      albumCards.find((card) => pickText(card?.shortcode).toLowerCase() === target) ||
      null
    );
  }, [albumCards, selectedEventShortcode]);

  useEffect(() => {
    let cancelled = false;

    if (!selectedEventShortcode) {
      setEventDetailsStatus("idle");
      setEventDetailsError("");
      setEventDetailsMeta(null);
      setEventDetailsItems([]);
      return undefined;
    }

    const loadEventDetails = async () => {
      setEventDetailsStatus("loading");
      setEventDetailsError("");

      try {
        const payload = await apiJson(buildEventShowEndpoint(selectedEventShortcode));
        const normalized = normalizeEventShowPayload(payload, selectedEventShortcode);

        if (!cancelled) {
          setEventDetailsMeta(normalized.event);
          setEventDetailsItems(normalized.items);
          setEventDetailsStatus("succeeded");
        }
      } catch (error) {
        if (!cancelled) {
          setEventDetailsMeta(null);
          setEventDetailsItems([]);
          setEventDetailsStatus("failed");
          setEventDetailsError(error?.message || "Failed to load this album");
        }
      }
    };

    loadEventDetails();

    return () => {
      cancelled = true;
    };
  }, [selectedEventShortcode]);

  const fallbackEventItems = useMemo(() => {
    if (!selectedEventShortcode) return [];
    return eventItemsByShortcode.get(selectedEventShortcode.toLowerCase()) || [];
  }, [selectedEventShortcode, eventItemsByShortcode]);

  const activeEventMeta = useMemo(() => {
    if (!selectedEventShortcode) return null;

    if (eventDetailsMeta) {
      return {
        shortcode: pickText(eventDetailsMeta?.shortcode, selectedEventShortcode),
        title: pickText(eventDetailsMeta?.title, selectedAlbumCard?.title) || "Album",
        description: pickText(eventDetailsMeta?.description, selectedAlbumCard?.description),
        date: pickText(eventDetailsMeta?.date, selectedAlbumCard?.date),
        total: eventDetailsItems.length || selectedAlbumCard?.imagesCount || fallbackEventItems.length,
      };
    }

    if (selectedAlbumCard) {
      return {
        shortcode: selectedEventShortcode,
        title: pickText(selectedAlbumCard?.title) || "Album",
        description: pickText(selectedAlbumCard?.description),
        date: pickText(selectedAlbumCard?.date),
        total: selectedAlbumCard?.imagesCount || fallbackEventItems.length,
      };
    }

    const first = fallbackEventItems[0];
    return {
      shortcode: selectedEventShortcode,
      title: pickText(first?.event_title) || "Album",
      description: pickText(first?.event_description),
      date: pickText(first?.event_date),
      total: fallbackEventItems.length,
    };
  }, [
    selectedEventShortcode,
    eventDetailsMeta,
    eventDetailsItems.length,
    selectedAlbumCard,
    fallbackEventItems,
  ]);

  const photoItems = useMemo(() => {
    if (!selectedEventShortcode) return [];

    const sourceItems = eventDetailsItems.length ? eventDetailsItems : fallbackEventItems;
    if (!searchQuery) return sourceItems;

    const query = searchQuery.toLowerCase();
    return sourceItems.filter((item) => {
      const tags = normalizeTags(item?.tags).join(" ");
      const haystack = [item?.title, item?.description, tags]
        .map((value) => pickText(value).toLowerCase())
        .join(" ");
      return haystack.includes(query);
    });
  }, [selectedEventShortcode, eventDetailsItems, fallbackEventItems, searchQuery]);

  const isPhotosMode = Boolean(selectedEventShortcode);
  const currentItems = isPhotosMode ? photoItems : albumCards;
  const perPage = isPhotosMode ? PHOTOS_PER_PAGE : ALBUMS_PER_PAGE;
  const totalItems = currentItems.length;
  const lastPage = Math.max(1, Math.ceil(totalItems / perPage));
  const currentPage = Math.min(page, lastPage);
  const pageItems = currentItems.slice((currentPage - 1) * perPage, currentPage * perPage);

  useEffect(() => {
    if (page !== currentPage) setPage(currentPage);
  }, [page, currentPage]);

  const loading =
    !initialized ||
    departmentsStatus === "loading" ||
    (isPhotosMode
      ? eventDetailsStatus === "loading" && !photoItems.length && !fallbackEventItems.length
      : (eventStatus === "idle" || eventStatus === "loading") &&
        !albumCards.length &&
        (galleryStatus === "idle" || galleryStatus === "loading"));

  const applyMasonry = useCallback(() => {
    if (!gridRef.current || !isPhotosMode) return;

    const grid = gridRef.current;
    const style = window.getComputedStyle(grid);
    const rowHeight = parseInt(style.getPropertyValue("grid-auto-rows"), 10) || 10;
    const rowGap = parseInt(style.getPropertyValue("gap"), 10) || 18;

    tileRefs.current.forEach((tile) => {
      if (!tile) return;
      tile.style.gridRowEnd = "auto";
      const height = tile.getBoundingClientRect().height;
      const span = Math.ceil((height + rowGap) / (rowHeight + rowGap));
      tile.style.gridRowEnd = `span ${Math.max(1, span)}`;
    });
  }, [isPhotosMode]);

  useEffect(() => {
    tileRefs.current = [];
  }, [pageItems, isPhotosMode]);

  useEffect(() => {
    if (!isPhotosMode) return undefined;

    const raf = window.requestAnimationFrame(() => applyMasonry());
    const onResize = () => applyMasonry();
    window.addEventListener("resize", onResize);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [applyMasonry, isPhotosMode, pageItems]);

  useEffect(() => {
    if (!lightbox) return undefined;

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setLightbox(null);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lightbox]);

  const pagerNodes = useMemo(() => {
    if (lastPage <= 1) return [];

    const nodes = [];
    const win = 2;
    const start = Math.max(1, currentPage - win);
    const end = Math.min(lastPage, currentPage + win);

    nodes.push(
      <button
        key="prev"
        className="gxa-pagebtn"
        disabled={currentPage <= 1}
        onClick={() => {
          setPage(Math.max(1, currentPage - 1));
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        Previous
      </button>
    );

    if (start > 1) {
      nodes.push(
        <button
          key="page-1"
          className={`gxa-pagebtn ${currentPage === 1 ? "active" : ""}`}
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
          <span key="dots-start" style={{ opacity: 0.6, padding: "0 4px" }}>
            …
          </span>
        );
      }
    }

    for (let pageNo = start; pageNo <= end; pageNo += 1) {
      nodes.push(
        <button
          key={`page-${pageNo}`}
          className={`gxa-pagebtn ${currentPage === pageNo ? "active" : ""}`}
          onClick={() => {
            setPage(pageNo);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          {pageNo}
        </button>
      );
    }

    if (end < lastPage) {
      if (end < lastPage - 1) {
        nodes.push(
          <span key="dots-end" style={{ opacity: 0.6, padding: "0 4px" }}>
            …
          </span>
        );
      }
      nodes.push(
        <button
          key={`page-${lastPage}`}
          className={`gxa-pagebtn ${currentPage === lastPage ? "active" : ""}`}
          onClick={() => {
            setPage(lastPage);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          {lastPage}
        </button>
      );
    }

    nodes.push(
      <button
        key="next"
        className="gxa-pagebtn"
        disabled={currentPage >= lastPage}
        onClick={() => {
          setPage(Math.min(lastPage, currentPage + 1));
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        Next
      </button>
    );

    return nodes;
  }, [currentPage, lastPage]);

  const emptyMessage = isPhotosMode
    ? eventDetailsStatus === "failed"
      ? "Unable to load this album."
      : "No photos found in this album."
    : eventStatus === "failed" && galleryStatus === "failed"
      ? "Unable to load gallery."
      : "No album cards found.";

  const emptyDescription = isPhotosMode
    ? eventDetailsError || "Try another search within this album."
    : eventError && galleryStatus === "failed"
      ? eventError
      : selectedDeptName
        ? "Try another search or department filter."
        : "Try another search.";

  return (
    <>
      <style>{styles}</style>

      <div className="gxa-wrap">
        <div className="gxa-head">
          <div>
            <h1 className="gxa-title">
              <i className="fa-regular fa-images" />
              Gallery
            </h1>
            <div className="gxa-sub">
              {isPhotosMode && activeEventMeta
                ? selectedDeptName
                  ? `${activeEventMeta.title} — ${selectedDeptName}`
                  : `Viewing album: ${activeEventMeta.title}`
                : selectedDeptName
                  ? `Browse event albums for ${selectedDeptName}`
                  : "Browse event albums and open each album to view its photos."}
            </div>
          </div>

          <div className="gxa-tools">
            {isPhotosMode ? (
              <button
                className="gxa-btn gxa-btn--brand"
                type="button"
                onClick={() => {
                  setSelectedEventShortcode("");
                  setSearchInput("");
                  setSearchQuery("");
                  setPage(1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <i className="fa-solid fa-arrow-left" />
                <span>Back to Albums</span>
              </button>
            ) : null}

            <div className="gxa-search">
              <i className="fa fa-magnifying-glass" />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={isPhotosMode ? "Search within this album…" : "Search event title / description / shortcode…"}
              />
            </div>

            <div className="gxa-select" title="Filter by department">
              <i className="fa-solid fa-building-columns gxa-select__icon" />
              <select
                value={selectedDeptUuid}
                onChange={(event) => {
                  setSelectedDeptUuid(event.target.value);
                  setPage(1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                aria-label="Filter by department"
              >
                <option value="">All Departments</option>
                {departments.map((department) => (
                  <option key={department.uuid} value={department.uuid}>
                    {department.title}
                  </option>
                ))}
              </select>
              <i className="fa-solid fa-chevron-down gxa-select__caret" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="gxa-state">
            <div className="gxa-spin">
              <i className="fa-solid fa-circle-notch fa-spin" />
            </div>
            <div style={{ fontWeight: 900, color: "var(--gxa-ink)" }}>
              {isPhotosMode ? "Loading album photos…" : "Loading gallery…"}
            </div>
            <div style={{ marginTop: 6, fontSize: 12.5, opacity: 0.95 }}>
              Please wait…
            </div>
          </div>
        ) : totalItems ? (
          <>
            {isPhotosMode && activeEventMeta ? (
              <section>
                <div className="gxa-album-head">
                  <div className="gxa-album-head__top">
                    <h2 className="gxa-album-head__title">
                      <i className="fa-solid fa-folder-open" />
                      <span>{activeEventMeta.title || "Album"}</span>
                    </h2>

                    <div className="d-flex flex-wrap gap-2">
                      {activeEventMeta.date ? (
                        <span className="gxa-pill gxa-pill--brand">
                          <i className="fa-regular fa-calendar" />
                          {formatDate(activeEventMeta.date)}
                        </span>
                      ) : null}
                      {activeEventMeta.shortcode ? (
                        <span className="gxa-pill">
                          <i className="fa-solid fa-link" />
                          {activeEventMeta.shortcode}
                        </span>
                      ) : null}
                      <span className="gxa-pill">
                        <i className="fa-regular fa-image" />
                        {activeEventMeta?.total || photoItems.length || 0} Photo
                        {(activeEventMeta?.total || photoItems.length || 0) === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>

                  {activeEventMeta.description ? (
                    <p className="gxa-album-head__desc">{activeEventMeta.description}</p>
                  ) : null}
                </div>

                <div className="gxa-grid" ref={gridRef}>
                  {pageItems.map((item, index) => (
                    <PhotoTile
                      key={item.uuid || item.id || `${selectedEventShortcode}-${index}`}
                      item={item}
                      onOpen={setLightbox}
                      onMediaLoad={applyMasonry}
                      registerTile={(node) => {
                        tileRefs.current[index] = node;
                      }}
                    />
                  ))}
                </div>
              </section>
            ) : (
              <section>
                <div className="gxa-albums">
                  {pageItems.map((card) => (
                    <AlbumCard
                      key={card.key}
                      card={card}
                      onOpenEvent={(eventCard) => {
                        setSelectedEventShortcode(eventCard.shortcode || "");
                        setSearchInput("");
                        setSearchQuery("");
                        setPage(1);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      onOpenStandalone={(singleCard) => {
                        setLightbox({
                          src: singleCard.full || singleCard.previewImages?.[0] || "",
                          title: singleCard.title || "Gallery Image",
                          description: singleCard.description || "",
                          tags: Array.isArray(singleCard.tags) ? singleCard.tags : [],
                        });
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            {lastPage > 1 ? (
              <div className="gxa-pagination">
                <div className="gxa-pager">{pagerNodes}</div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="gxa-state">
            <div style={{ fontSize: 34, opacity: 0.6, marginBottom: 6 }}>
              <i className="fa-regular fa-folder-open" />
            </div>
            <div style={{ fontWeight: 900, color: "var(--gxa-ink)" }}>{emptyMessage}</div>
            <div style={{ marginTop: 6, fontSize: 12.5, opacity: 0.95 }}>
              {emptyDescription}
            </div>
          </div>
        )}
      </div>

      {lightbox ? (
        <div
          className="gxa-lb"
          aria-hidden="false"
          onClick={(event) => {
            if (event.target === event.currentTarget) setLightbox(null);
          }}
        >
          <div className="gxa-lb__inner">
            <button
              className="gxa-lb__close"
              type="button"
              aria-label="Close"
              onClick={() => setLightbox(null)}
            >
              <i className="fa-solid fa-xmark" />
            </button>

            <img className="gxa-lb__img" src={lightbox.src} alt={lightbox.title || "Gallery image"} />

            {lightbox.title || lightbox.description || (lightbox.tags || []).length ? (
              <div className="gxa-lb__meta">
                {lightbox.title ? <div className="gxa-lb__title">{lightbox.title}</div> : null}
                {lightbox.description ? (
                  <div className="gxa-lb__desc">{lightbox.description}</div>
                ) : null}
                {(lightbox.tags || []).length ? (
                  <div className="gxa-lb__tags">
                    {(lightbox.tags || []).map((tag) => (
                      <span key={tag} className="gxa-lb__tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
