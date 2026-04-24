import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAnnouncements,
  setSearch,
  setDept,
  setPage,
} from "../../redux/crm/announcementSlice";
import { fetchDepartments } from "../../redux/crm/noticeSlice";

const stripHtml = (html) => {
  const raw = String(html || "")
    .replace(/<\s*br\s*\/?>/gi, " ")
    .replace(/<\/\s*(p|div|li|h[1-6]|tr|td|th|section|article)\s*>/gi, "$& ")
    .replace(/<\s*(p|div|li|h[1-6]|tr|td|th|section|article)\b[^>]*>/gi, " ");

  const div = document.createElement("div");
  div.innerHTML = raw;
  return (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
};

const getExcerpt = (text, maxChars = 90) => {
  const clean = stripHtml(text || "");
  if (clean.length <= maxChars) return clean;

  return (
    clean
      .slice(0, maxChars)
      .trim()
      .replace(/[,\.;:\-\s]+$/g, "") + "......"
  );
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const ensureAbsoluteUrl = (url, baseUrl = "") => {
  const value = String(url || "").trim();
  if (!value) return "";

  if (/^(data:|blob:|https?:\/\/)/i.test(value)) return value;
  if (value.startsWith("//")) return `${window.location.protocol}${value}`;

  const cleanBase = String(baseUrl || "").trim().replace(/\/+$/, "");

  if (value.startsWith("/")) {
    return cleanBase ? `${cleanBase}${value}` : `${window.location.origin}${value}`;
  }

  return cleanBase
    ? `${cleanBase}/${value.replace(/^\/+/, "")}`
    : `${window.location.origin}/${value.replace(/^\/+/, "")}`;
};

const isApprovedAnnouncement = (item) =>
  String(item?.workflow_status || "").toLowerCase() === "approved";

const buildPageList = (current, total) => {
  const pages = [];
  const win = 2;
  const start = Math.max(1, current - win);
  const end = Math.min(total, current + win);

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push("...");
  }

  for (let p = start; p <= end; p += 1) {
    pages.push(p);
  }

  if (end < total) {
    if (end < total - 1) pages.push("...");
    pages.push(total);
  }

  return pages;
};

function SkeletonGrid() {
  return (
    <div className="anx-skeleton">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={idx} className="anx-sk" />
      ))}
    </div>
  );
}

function EmptyState({ deptName }) {
  return (
    <div className="anx-state">
      <div className="anx-empty-ill" aria-hidden="true">
        <svg
          viewBox="0 0 220 140"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: "block", width: "100%", height: "auto" }}
        >
          <rect
            x="10"
            y="18"
            width="200"
            height="112"
            rx="16"
            fill="white"
            stroke="rgba(15,23,42,0.10)"
          />
          <rect
            x="24"
            y="32"
            width="172"
            height="84"
            rx="12"
            fill="rgba(148,163,184,0.08)"
            stroke="rgba(148,163,184,0.18)"
          />
          <circle
            cx="70"
            cy="66"
            r="16"
            fill="rgba(158,54,58,0.14)"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M49 97c5-11 16-16 21-16s16 5 21 16"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <rect
            x="100"
            y="52"
            width="72"
            height="8"
            rx="4"
            fill="rgba(100,116,139,0.20)"
          />
          <rect
            x="100"
            y="68"
            width="54"
            height="8"
            rx="4"
            fill="rgba(100,116,139,0.16)"
          />
          <rect
            x="100"
            y="84"
            width="64"
            height="8"
            rx="4"
            fill="rgba(100,116,139,0.12)"
          />
          <circle
            cx="182"
            cy="26"
            r="12"
            fill="rgba(158,54,58,0.10)"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M177.5 26h9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M182 21.5v9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div>No announcements found.</div>

      {deptName ? (
        <div style={{ marginTop: 6, fontSize: 12.5, opacity: 0.95 }}>
          Department: <b>{deptName}</b>
        </div>
      ) : null}
    </div>
  );
}

function AnnouncementCard({ item, imageBaseUrl, detailPath }) {
  const titleRaw = item?.title || "Untitled";
  const excerpt = getExcerpt(item?.body || "");
  const created = formatDate(item?.created_at || item?.publish_at || item?.updated_at);

  const cover =
    item?.cover_image_url ||
    item?.cover_image ||
    item?.image_url ||
    item?.image ||
    item?.thumbnail ||
    "";

  const coverUrl = ensureAbsoluteUrl(cover, imageBaseUrl);

  return (
    <div className="anx-card">
      <div className="anx-media">
        <div className="anx-fallback">Announcement</div>

        {coverUrl ? (
          <img
            src={coverUrl}
            alt={titleRaw}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : null}
      </div>

      <div className="anx-body">
        <div className="anx-h">{titleRaw}</div>

        <p className="anx-p">{excerpt}</p>

        <div className="anx-date">
          <i className="fa-regular fa-calendar" />
          <span>Created: {created || "—"}</span>
        </div>
      </div>

      <Link
        to={detailPath}
        className="anx-link"
        aria-label={`Open ${titleRaw}`}
      />
    </div>
  );
}

export function AnnouncementContent() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const IMAGE_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

  const {
    announcements = [],
    search = "",
    deptUuid = "",
    deptId = null,
    deptName = "",
    page = 1,
    perPage = 9,
    loading = false,
  } = useSelector((s) => s.announcement);

  const { departments = [] } = useSelector((s) => s.notices);

  const [searchDraft, setSearchDraft] = useState(search || "");

  useEffect(() => {
    dispatch(fetchAnnouncements());
    dispatch(fetchDepartments());
  }, [dispatch]);

  useEffect(() => {
    setSearchDraft(search || "");
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchDraft !== search) {
        dispatch(setSearch(searchDraft));
        dispatch(setPage(1));
      }
    }, 260);

    return () => clearTimeout(timer);
  }, [searchDraft, search, dispatch]);

  const visibleDepartments = useMemo(() => {
    return departments
      .filter((d) => {
        if (!d?.uuid) return false;
        if (!(d?.title || d?.name)) return false;
        if (d?.active === undefined || d?.active === null) return true;
        return String(d.active) === "1";
      })
      .sort((a, b) =>
        String(a?.title || a?.name || "").localeCompare(String(b?.title || b?.name || ""))
      );
  }, [departments]);

  useEffect(() => {
    if (!visibleDepartments.length) return;

    const deptParam = (params.get("dept") || "").trim().toLowerCase();

    if (!deptParam) {
      dispatch(setDept({}));
      return;
    }

    const matched =
      visibleDepartments.find(
        (d) => String(d?.slug || "").trim().toLowerCase() === deptParam
      ) ||
      visibleDepartments.find(
        (d) => String(d?.uuid || "").trim().toLowerCase() === deptParam
      );

    dispatch(setDept(matched || {}));
  }, [visibleDepartments, params, dispatch]);

  const filteredItems = useMemo(() => {
    let items = Array.isArray(announcements) ? [...announcements] : [];

    items = items.filter(isApprovedAnnouncement);

    if (deptUuid) {
      items = items.filter(
        (n) =>
          String(n?.department_id ?? "") === String(deptId ?? "") ||
          String(n?.department_uuid ?? "") === String(deptUuid)
      );
    }

    if (search) {
      const q = search.toLowerCase().trim();

      if (q) {
        items = items.filter((n) =>
          `${n?.title || ""} ${stripHtml(n?.body || "")}`
            .toLowerCase()
            .includes(q)
        );
      }
    }

    return items;
  }, [announcements, search, deptUuid, deptId]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredItems.length / perPage)),
    [filteredItems.length, perPage]
  );

  useEffect(() => {
    if (page > totalPages) {
      dispatch(setPage(totalPages));
    }
  }, [page, totalPages, dispatch]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredItems.slice(start, start + perPage);
  }, [filteredItems, page, perPage]);

  const handleDept = (uuid) => {
    const selected = visibleDepartments.find((d) => String(d.uuid) === String(uuid));

    dispatch(setDept(selected || {}));
    dispatch(setPage(1));

    if (!uuid || !selected) {
      navigate("/announcements");
      return;
    }

    const slugOrUuid = selected.slug || selected.uuid;
    navigate(`/announcements?dept=${encodeURIComponent(slugOrUuid)}`);
  };

  const getDetailPath = (item) => {
    const slugOrUuid = item?.slug || item?.uuid || "";
    return `/announcements/view/${slugOrUuid}`;
  };

  const pageList = useMemo(() => buildPageList(page, totalPages), [page, totalPages]);

  return (
    <>
      <style>
        {`
.anx-wrap{
  --anx-brand: var(--primary-color, #9E363A);
  --anx-ink: #0f172a;
  --anx-muted: #64748b;
  --anx-card: var(--surface, #ffffff);
  --anx-line: var(--line-soft, rgba(15,23,42,.10));
  --anx-shadow: 0 10px 24px rgba(2,6,23,.08);
  --anx-card-h: 426.4px;
  --anx-media-h: 240px;

  max-width: 1320px;
  margin: 18px auto 54px;
  padding: 0 12px;
  background: transparent;
  position: relative;
  overflow: visible;
}

.anx-head{
  background: var(--anx-card);
  border: 1px solid var(--anx-line);
  border-radius: 16px;
  box-shadow: var(--anx-shadow);
  padding: 14px 16px;
  margin-bottom: 16px;
  display:flex;
  gap: 12px;
  align-items:flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
}

.anx-head > div:first-child{
  flex: 1 1 280px;
  min-width: 0;
}

.anx-title{
  margin: 0;
  font-weight: 950;
  letter-spacing: .2px;
  color: var(--anx-ink);
  font-size: 28px;
  display:flex;
  align-items:center;
  gap: 10px;
  white-space: nowrap;
}

.anx-title i{
  color: var(--anx-brand);
}

.anx-sub{
  margin: 6px 0 0;
  color: var(--anx-muted);
  font-size: 14px;
}

.anx-tools{
  display:grid;
  grid-template-columns: minmax(0,1fr) minmax(220px,360px);
  gap: 10px;
  align-items:center;
  justify-content: end;
  min-width: 0;
  flex: 1 1 620px;
  width: min(100%, 920px);
}

.anx-tools > *{
  min-width:0;
}

.anx-search{
  position: relative;
  min-width: 0;
  max-width: none;
  width:100%;
}

.anx-search i{
  position:absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  opacity: .65;
  color: var(--anx-muted);
  pointer-events:none;
}

.anx-search input{
  width:100%;
  max-width:100%;
  height: 42px;
  border-radius: 999px;
  padding: 11px 12px 11px 42px;
  border: 1px solid var(--anx-line);
  background: var(--anx-card);
  color: var(--anx-ink);
  outline: none;
}

.anx-search input:focus{
  border-color: rgba(201,75,80,.55);
  box-shadow: 0 0 0 4px rgba(201,75,80,.18);
}

.anx-select{
  position: relative;
  min-width: 0;
  max-width: none;
  width:100%;
}

.anx-select__icon{
  position:absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  opacity: .70;
  color: var(--anx-muted);
  pointer-events:none;
  font-size: 14px;
}

.anx-select__caret{
  position:absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  opacity: .70;
  color: var(--anx-muted);
  pointer-events:none;
  font-size: 12px;
}

.anx-select select{
  width: 100%;
  max-width:100%;
  height: 42px;
  border-radius: 999px;
  padding: 10px 38px 10px 42px;
  border: 1px solid var(--anx-line);
  background: var(--anx-card);
  color: var(--anx-ink);
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.anx-select select:focus{
  border-color: rgba(201,75,80,.55);
  box-shadow: 0 0 0 4px rgba(201,75,80,.18);
}

.anx-grid{
  display:grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
  align-items: stretch;
}

.anx-card{
  width:100%;
  height: var(--anx-card-h);
  position:relative;
  display:flex;
  flex-direction:column;
  border: 1px solid rgba(2,6,23,.08);
  border-radius: 16px;
  background: #fff;
  box-shadow: var(--anx-shadow);
  overflow:hidden;
  transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
  will-change: transform;
}

.anx-card:hover{
  transform: translateY(-2px);
  box-shadow: 0 16px 34px rgba(2,6,23,.12);
  border-color: rgba(158,54,58,.22);
}

.anx-media{
  width:100%;
  height: var(--anx-media-h);
  flex: 0 0 auto;
  background: var(--anx-brand);
  position:relative;
  overflow:hidden;
  user-select:none;
}

.anx-media .anx-fallback{
  position:absolute;
  inset:0;
  display:flex;
  align-items:center;
  justify-content:center;
  color:#fff;
  font-weight:950;
  font-size: 26px;
  letter-spacing:.2px;
  z-index: 0;
}

.anx-media img{
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
  object-fit:cover;
  display:block;
  z-index: 1;
}

.anx-body{
  padding: 16px 16px 14px;
  display:flex;
  flex-direction:column;
  flex: 1 1 auto;
  min-height: 0;
}

.anx-h{
  font-size: 20px;
  line-height: 1.25;
  font-weight: 950;
  margin: 0 0 10px 0;
  color: var(--anx-ink);
  display:-webkit-box;
  -webkit-line-clamp:2;
  -webkit-box-orient:vertical;
  overflow:hidden;
  overflow-wrap:anywhere;
  word-break:break-word;
}

.anx-p{
  margin:0;
  color:#475569;
  font-size: 14.5px;
  line-height: 1.7;
  display:-webkit-box;
  -webkit-line-clamp:3;
  -webkit-box-orient:vertical;
  overflow:hidden;
  overflow-wrap:anywhere;
  word-break:break-word;
  hyphens:auto;
}

.anx-date{
  margin-top:auto;
  color:#94a3b8;
  font-size: 13px;
  padding-top: 12px;
  display:flex;
  align-items:center;
  gap: 6px;
}

.anx-link{
  position:absolute;
  inset:0;
  z-index:2;
  border-radius: 16px;
}

.anx-state{
  background: var(--anx-card);
  border: 1px solid var(--anx-line);
  border-radius: 16px;
  box-shadow: var(--anx-shadow);
  padding: 18px;
  color: var(--anx-muted);
  text-align:center;
}

.anx-empty-ill{
  width: 170px;
  max-width: 100%;
  margin: 0 auto 10px;
  display: block;
  color: var(--anx-brand);
}

.anx-skeleton{
  display:grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
}

.anx-sk{
  border-radius: 16px;
  border: 1px solid var(--anx-line);
  background: #fff;
  overflow:hidden;
  position:relative;
  box-shadow: 0 10px 24px rgba(2,6,23,.08);
  height: var(--anx-card-h);
}

.anx-sk:before{
  content:'';
  position:absolute;
  inset:0;
  transform: translateX(-60%);
  background: linear-gradient(90deg, transparent, rgba(148,163,184,.22), transparent);
  animation: anxSkMove 1.15s ease-in-out infinite;
}

@keyframes anxSkMove{
  to{ transform: translateX(60%); }
}

.anx-pagination{
  display:flex;
  justify-content:center;
  margin-top: 18px;
}

.anx-pager{
  display:flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items:center;
  justify-content:center;
  padding: 10px;
}

.anx-pagebtn{
  border:1px solid var(--anx-line);
  background: var(--anx-card);
  color: var(--anx-ink);
  border-radius: 12px;
  padding: 9px 12px;
  font-size: 13px;
  font-weight: 950;
  box-shadow: 0 8px 18px rgba(2,6,23,.06);
  cursor:pointer;
  user-select:none;
}

.anx-pagebtn:hover{
  background: rgba(2,6,23,.03);
}

.anx-pagebtn[disabled]{
  opacity:.55;
  cursor:not-allowed;
}

.anx-pagebtn.active{
  background: rgba(201,75,80,.12);
  border-color: rgba(201,75,80,.35);
  color: var(--anx-brand);
}

.anx-pagegap{
  opacity:.6;
  padding: 0 4px;
  display:flex;
  align-items:center;
}

@media (max-width: 980px){
  .anx-head{
    align-items:flex-end;
  }

  .anx-tools{
    grid-template-columns: 1fr;
    width: 100%;
    flex: 1 1 100%;
  }

  .anx-search,
  .anx-select{
    width:100%;
    max-width:none;
  }
}

@media (max-width: 640px){
  .anx-title{
    font-size: 24px;
    white-space: normal;
  }

  .anx-search,
  .anx-select{
    min-width: 0;
  }

  .anx-wrap{
    --anx-media-h: 210px;
  }

  .anx-media .anx-fallback{
    font-size: 22px;
  }
}
        `}
      </style>

      <div className="anx-wrap">
        <div className="anx-head">
          <div>
            <h1 className="anx-title">
              <i className="fa-solid fa-bullhorn" />
              <span>Announcements</span>
            </h1>

            <div className="anx-sub">
              {deptName
                ? `Announcements for ${deptName}`
                : "Latest public notices and updates."}
            </div>
          </div>

          <div className="anx-tools">
            <div className="anx-search">
              <i className="fa fa-magnifying-glass" />
              <input
                type="search"
                placeholder="Search announcements (title/body)…"
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
              />
            </div>

            <div className="anx-select" title="Filter by department">
              <i className="fa-solid fa-building-columns anx-select__icon" />
              <select
                value={deptUuid || ""}
                onChange={(e) => handleDept(e.target.value)}
                aria-label="Filter by department"
              >
                <option value="">All Departments</option>
                {visibleDepartments.map((d) => (
                  <option key={d.uuid} value={d.uuid}>
                    {d.title || d.name}
                  </option>
                ))}
              </select>
              <i className="fa-solid fa-chevron-down anx-select__caret" />
            </div>
          </div>
        </div>

        {loading ? <SkeletonGrid /> : null}

        {!loading && pageItems.length === 0 ? (
          <EmptyState deptName={deptName} />
        ) : null}

        {!loading && pageItems.length > 0 ? (
          <div className="anx-grid">
            {pageItems.map((item, index) => (
              <AnnouncementCard
                key={item?.uuid || item?.slug || item?.id || index}
                item={item}
                imageBaseUrl={IMAGE_BASE_URL}
                detailPath={getDetailPath(item)}
              />
            ))}
          </div>
        ) : null}

        {!loading && totalPages > 1 ? (
          <div className="anx-pagination">
            <div className="anx-pager">
              <button
                className="anx-pagebtn"
                disabled={page === 1}
                onClick={() => dispatch(setPage(Math.max(1, page - 1)))}
              >
                Previous
              </button>

              {pageList.map((entry, idx) =>
                entry === "..." ? (
                  <span key={`gap-${idx}`} className="anx-pagegap">
                    …
                  </span>
                ) : (
                  <button
                    key={entry}
                    className={`anx-pagebtn ${entry === page ? "active" : ""}`}
                    onClick={() => dispatch(setPage(entry))}
                  >
                    {entry}
                  </button>
                )
              )}

              <button
                className="anx-pagebtn"
                disabled={page === totalPages}
                onClick={() => dispatch(setPage(Math.min(totalPages, page + 1)))}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

export default AnnouncementContent;