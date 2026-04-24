import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSuccessStoriesDepartments,
  fetchSuccessStoriesList,
  selectSuccessStoriesDepartments,
  selectSuccessStoriesDepartmentsError,
  selectSuccessStoriesDepartmentsStatus,
  selectSuccessStoriesError,
  selectSuccessStoriesItems,
  selectSuccessStoriesStatus,
} from "../../redux/crm/successStoriesSlice";

const PAGE_SIZE = 9;

const styles = String.raw`
.ss-wrap{
  --ss-brand: var(--primary-color, #9E363A);
  --ss-ink: #0f172a;
  --ss-muted: #64748b;
  --ss-bg: var(--page-bg, #ffffff);
  --ss-card: var(--surface, #ffffff);
  --ss-line: var(--line-soft, rgba(15,23,42,.10));
  --ss-shadow: 0 10px 24px rgba(2,6,23,.08);

  --ss-card-h: 426.4px;
  --ss-media-h: 240px;

  max-width: 1320px;
  margin: 18px auto 54px;
  padding: 0 12px;
  background: transparent;
  position: relative;
  overflow: visible;
}

/* Header */
.ss-head{
  background: var(--ss-card);
  border: 1px solid var(--ss-line);
  border-radius: 16px;
  box-shadow: var(--ss-shadow);
  padding: 14px 16px;
  margin-bottom: 16px;

  display:flex;
  gap: 12px;
  align-items: flex-end;
  justify-content: space-between;
}
.ss-head > div:first-child{
  flex: 1 1 auto;
  min-width: 260px;
}

.ss-title{
  margin: 0;
  font-weight: 950;
  letter-spacing: .2px;
  color: var(--ss-ink);
  font-size: 28px;
  display:flex;
  align-items:center;
  gap: 10px;
  white-space: nowrap;
}
.ss-title i{ color: var(--ss-brand); }
.ss-sub{
  margin: 6px 0 0;
  color: var(--ss-muted);
  font-size: 14px;
}

.ss-tools{
  display:flex;
  gap: 10px;
  align-items:center;
  flex-wrap: nowrap;
  flex: 0 0 auto;
}

/* Search */
.ss-search{
  position: relative;
  min-width: 260px;
  max-width: 520px;
  flex: 1 1 320px;
}
.ss-search i{
  position:absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  opacity: .65;
  color: var(--ss-muted);
  pointer-events:none;
}
.ss-search input{
  width:100%;
  height: 42px;
  border-radius: 999px;
  padding: 11px 12px 11px 42px;
  border: 1px solid var(--ss-line);
  background: var(--ss-card);
  color: var(--ss-ink);
  outline: none;
}
.ss-search input:focus{
  border-color: rgba(201,75,80,.55);
  box-shadow: 0 0 0 4px rgba(201,75,80,.18);
}

/* Dept dropdown */
.ss-select{
  position: relative;
  min-width: 260px;
  max-width: 360px;
  flex: 0 1 320px;
}
.ss-select__icon{
  position:absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  opacity: .70;
  color: var(--ss-muted);
  pointer-events:none;
  font-size: 14px;
}
.ss-select__caret{
  position:absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  opacity: .70;
  color: var(--ss-muted);
  pointer-events:none;
  font-size: 12px;
}
.ss-select select{
  width: 100%;
  height: 42px;
  border-radius: 999px;
  padding: 10px 38px 10px 42px;
  border: 1px solid var(--ss-line);
  background: var(--ss-card);
  color: var(--ss-ink);
  outline: none;

  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}
.ss-select select:focus{
  border-color: rgba(201,75,80,.55);
  box-shadow: 0 0 0 4px rgba(201,75,80,.18);
}

/* Grid */
.ss-grid{
  display:grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
  align-items: stretch;
}

/* Card */
.ss-card{
  width:100%;
  height: var(--ss-card-h);
  position:relative;
  display:flex;
  flex-direction:column;
  border: 1px solid rgba(2,6,23,.08);
  border-radius: 16px;
  background: #fff;
  box-shadow: var(--ss-shadow);
  overflow:hidden;
  transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
  will-change: transform;
}
.ss-card:hover{
  transform: translateY(-2px);
  box-shadow: 0 16px 34px rgba(2,6,23,.12);
  border-color: rgba(158,54,58,.22);
}

.ss-media{
  width:100%;
  height: var(--ss-media-h);
  flex: 0 0 auto;
  background: var(--ss-brand);
  position:relative;
  overflow:hidden;
  user-select:none;
}
.ss-media .ss-fallback{
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
.ss-media img{
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
  object-fit:cover;
  display:block;
  z-index: 1;
}

.ss-body{
  padding: 16px 16px 14px;
  display:flex;
  flex-direction:column;
  flex: 1 1 auto;
  min-height: 0;
}
.ss-h{
  font-size: 20px;
  line-height: 1.25;
  font-weight: 950;
  margin: 0 0 8px 0;
  color: var(--ss-ink);

  display:-webkit-box;
  -webkit-line-clamp:2;
  -webkit-box-orient:vertical;
  overflow:hidden;

  overflow-wrap:anywhere;
  word-break:break-word;
}
.ss-subline{
  margin: 0 0 10px 0;
  color: #334155;
  font-weight: 800;
  font-size: 13px;

  display:-webkit-box;
  -webkit-line-clamp:1;
  -webkit-box-orient:vertical;
  overflow:hidden;

  min-height: 17px;
}
.ss-p{
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

.ss-date{
  margin-top:auto;
  color:#94a3b8;
  font-size: 13px;
  padding-top: 12px;
  display:flex;
  align-items:center;
  gap: 6px;
}

.ss-link{
  position:absolute;
  inset:0;
  z-index:2;
  border-radius: 16px;
}

/* State / empty */
.ss-state{
  background: var(--ss-card);
  border: 1px solid var(--ss-line);
  border-radius: 16px;
  box-shadow: var(--ss-shadow);
  padding: 18px;
  color: var(--ss-muted);
  text-align:center;
}

/* Skeleton */
.ss-skeleton{
  display:grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
}
.ss-sk{
  border-radius: 16px;
  border: 1px solid var(--ss-line);
  background: #fff;
  overflow:hidden;
  position:relative;
  box-shadow: 0 10px 24px rgba(2,6,23,.08);
  height: var(--ss-card-h);
}
.ss-sk:before{
  content:'';
  position:absolute; inset:0;
  transform: translateX(-60%);
  background: linear-gradient(90deg, transparent, rgba(148,163,184,.22), transparent);
  animation: ssSkMove 1.15s ease-in-out infinite;
}
@keyframes ssSkMove{ to{ transform: translateX(60%);} }

/* Pagination */
.ss-pagination{
  display:flex;
  justify-content:center;
  margin-top: 18px;
}
.ss-pagination .ss-pager{
  display:flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items:center;
  justify-content:center;
  padding: 10px;
}
.ss-pagebtn{
  border:1px solid var(--ss-line);
  background: var(--ss-card);
  color: var(--ss-ink);
  border-radius: 12px;
  padding: 9px 12px;
  font-size: 13px;
  font-weight: 950;
  box-shadow: 0 8px 18px rgba(2,6,23,.06);
  cursor:pointer;
  user-select:none;
}
.ss-pagebtn:hover{ background: rgba(2,6,23,.03); }
.ss-pagebtn[disabled]{ opacity:.55; cursor:not-allowed; }
.ss-pagebtn.active{
  background: rgba(201,75,80,.12);
  border-color: rgba(201,75,80,.35);
  color: var(--ss-brand);
}

@media (max-width: 640px){
  .ss-head{ flex-wrap: wrap; align-items: flex-end; }
  .ss-tools{ flex-wrap: wrap; }

  .ss-title{ font-size: 24px; white-space: normal; }
  .ss-search{ min-width: 220px; flex: 1 1 240px; }
  .ss-select{ min-width: 220px; flex: 1 1 240px; }
  .ss-wrap{ --ss-media-h: 210px; }
  .ss-media .ss-fallback{ font-size: 22px; }
}

/* Bootstrap guard */
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

const stripHtml = (html) => {
  const raw = String(html || "")
    .replace(/<\s*br\s*\/?>/gi, " ")
    .replace(/<\/\s*(p|div|li|h[1-6]|tr|td|th|section|article)\s*>/gi, "$& ")
    .replace(/<\s*(p|div|li|h[1-6]|tr|td|th|section|article)\b[^>]*>/gi, " ");
  const div = document.createElement("div");
  div.innerHTML = raw;
  return (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
};

const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
};

const normalizeUrl = (url) => {
  const u = (url || "").toString().trim();
  if (!u) return "";
  if (/^(data:|blob:|https?:\/\/)/i.test(u)) return u;
  if (u.startsWith("/")) return window.location.origin + u;
  return window.location.origin + "/" + u;
};

const resolveDeptUuidFromUrl = (deptByUuid, deptByShortcode) => {
  const url = new URL(window.location.href);
  const direct = (url.searchParams.get("department") || url.searchParams.get("dept") || "").trim();

  if (direct) {
    if (deptByShortcode.has(direct.toLowerCase())) return deptByShortcode.get(direct.toLowerCase());
    return direct;
  }

  const hay = `${url.search} ${url.href}`;
  const m = hay.match(/d-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{12})/i);
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

const ensureFontAwesome = () => {
  if (document.querySelector('link[href*="font-awesome"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";
  document.head.appendChild(link);
};

const resolveName = (item) => String(item?.name || "Student");
const resolveTitle = (item) => String(item?.title || "");
const resolveQuote = (item) => String(item?.quote || item?.description || "");
const resolvePhoto = (item) =>
  normalizeUrl(
    item?.photo_full_url ||
      item?.photo_url ||
      item?.photo ||
      item?.cover_image_url ||
      item?.cover_image ||
      ""
  );

const getDeptId = (item) =>
  String(item?.department_id === null || item?.department_id === undefined ? "" : item.department_id);

const getDeptUuid = (item) => String(item?.department_uuid || "");

function StoryCard({ item, viewBase }) {
  const [broken, setBroken] = useState(false);
  const name = resolveName(item);
  const title = resolveTitle(item);
  const quote = stripHtml(resolveQuote(item));
  const created = fmtDate(item?.created_at || null);
  const uuid = item?.uuid ? String(item.uuid) : "";
  const slug = item?.slug ? String(item.slug) : "";
  const identifier = slug || uuid;
  const href = identifier ? `${viewBase}/${encodeURIComponent(identifier)}` : "#";
  const photo = resolvePhoto(item);

  let excerptText = quote;
  if (excerptText.length > 110) {
    excerptText = excerptText.slice(0, 110).trim().replace(/[,\.;:\-\s]+$/g, "");
    excerptText += "......";
  }

  return (
    <div className="ss-card">
      <div className="ss-media">
        <div className="ss-fallback">Success Story</div>
        {photo && !broken ? (
          <img
            className="ss-img"
            src={photo}
            alt={name}
            loading="lazy"
            onError={() => setBroken(true)}
          />
        ) : null}
      </div>

      <div className="ss-body">
        <div className="ss-h">{name}</div>
        <div className="ss-subline">{title || "\u00A0"}</div>
        <p className="ss-p">{excerptText || ""}</p>

        <div className="ss-date">
          <i className="fa-regular fa-calendar"></i>
          <span>Created: {created || "—"}</span>
        </div>
      </div>

      {identifier ? (
        <a className="ss-link" href={href} aria-label={`Open ${name}`}></a>
      ) : (
        <div className="ss-link" title="Missing identifier"></div>
      )}
    </div>
  );
}

export default function SuccessStories() {
  const dispatch = useDispatch();

  const departments = useSelector(selectSuccessStoriesDepartments);
  const departmentsStatus = useSelector(selectSuccessStoriesDepartmentsStatus);
  const departmentsError = useSelector(selectSuccessStoriesDepartmentsError);

  const stories = useSelector(selectSuccessStoriesItems);
  const storiesStatus = useSelector(selectSuccessStoriesStatus);
  const storiesError = useSelector(selectSuccessStoriesError);

  const [selectedDeptUuid, setSelectedDeptUuid] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedDeptName, setSelectedDeptName] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [initialized, setInitialized] = useState(false);
  const [requestsStarted, setRequestsStarted] = useState(false);

  useEffect(() => {
    ensureFontAwesome();
    dispatch(fetchSuccessStoriesDepartments());
    dispatch(fetchSuccessStoriesList());
    setRequestsStarted(true);
  }, [dispatch]);

  const deptByUuid = useMemo(
    () => new Map((departments || []).map((d) => [d.uuid, d])),
    [departments]
  );

  const deptByShortcode = useMemo(
    () =>
      new Map(
        (departments || [])
          .filter((d) => d.shortcode)
          .map((d) => [d.shortcode, d.uuid])
      ),
    [departments]
  );

  useEffect(() => {
    if (!requestsStarted || initialized) return;
    if (departmentsStatus === "loading" || storiesStatus === "loading") return;

    const initialDept = resolveDeptUuidFromUrl(deptByUuid, deptByShortcode);
    if (initialDept && deptByUuid.has(initialDept)) {
      const d = deptByUuid.get(initialDept);
      setSelectedDeptUuid(initialDept);
      setSelectedDeptId(d?.id !== null && d?.id !== undefined ? String(d.id) : "");
      setSelectedDeptName(d?.title || "");
    } else {
      setSelectedDeptUuid("");
      setSelectedDeptId("");
      setSelectedDeptName("");
    }

    setInitialized(true);
    setPage(1);
  }, [requestsStarted, initialized, departmentsStatus, storiesStatus, deptByUuid, deptByShortcode]);

  useEffect(() => {
    if (!initialized) return;
    syncUrl(selectedDeptUuid, deptByUuid);

    if (selectedDeptUuid) {
      const d = deptByUuid.get(selectedDeptUuid);
      setSelectedDeptId(d?.id !== null && d?.id !== undefined ? String(d.id) : "");
      setSelectedDeptName(d?.title || "");
    } else {
      setSelectedDeptId("");
      setSelectedDeptName("");
    }
  }, [initialized, selectedDeptUuid, deptByUuid]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, 260);

    return () => clearTimeout(t);
  }, [searchInput]);

  const loading =
    !requestsStarted ||
    departmentsStatus === "loading" ||
    storiesStatus === "loading" ||
    !initialized;

  const filteredItems = useMemo(() => {
    let items = Array.isArray(stories) ? stories.slice() : [];

    if (selectedDeptUuid) {
      items = items.filter((item) => {
        const did = getDeptId(item);
        const duu = getDeptUuid(item);
        return (selectedDeptId && did === selectedDeptId) || (duu && duu === selectedDeptUuid);
      });
    }

    const q = searchQuery.toLowerCase();
    if (q) {
      items = items.filter((item) => {
        const n = resolveName(item).toLowerCase();
        const t = resolveTitle(item).toLowerCase();
        const p = stripHtml(resolveQuote(item)).toLowerCase();
        return n.includes(q) || t.includes(q) || p.includes(q);
      });
    }

    return items;
  }, [stories, selectedDeptUuid, selectedDeptId, searchQuery]);

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
    ? `Success stories for ${selectedDeptName}`
    : "Alumni journeys, placements, and inspiring wins.";

  const emptyMessage = selectedDeptUuid
    ? "No success stories found for this department."
    : "No success stories found.";

  return (
    <div className="ss-wrap">
      <style>{styles}</style>

      <div className="ss-head">
        <div>
          <h1 className="ss-title">
            <i className="fa-solid fa-trophy"></i>
            Success Stories
          </h1>
          <div className="ss-sub">{subtitle}</div>
        </div>

        <div className="ss-tools">
          <div className="ss-search">
            <i className="fa fa-magnifying-glass"></i>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              type="search"
              placeholder="Search success stories (name/title/quote)…"
            />
          </div>

          <div className="ss-select" title="Filter by department">
            <i className="fa-solid fa-building-columns ss-select__icon"></i>
            <select
              value={selectedDeptUuid}
              onChange={(e) => setSelectedDeptUuid(e.target.value)}
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
            <i className="fa-solid fa-chevron-down ss-select__caret"></i>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="ss-skeleton">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ss-sk"></div>
          ))}
        </div>
      ) : (departmentsError || storiesError) && !currentItems.length ? (
        <div className="ss-state">
          <div style={{ fontSize: 34, opacity: 0.6, marginBottom: 6 }}>
            <i className="fa-regular fa-face-frown"></i>
          </div>
          No success stories found.
        </div>
      ) : currentItems.length ? (
        <>
          <div className="ss-grid">
            {currentItems.map((item) => (
              <StoryCard
                key={item?.uuid || item?.slug || item?.id || resolveName(item)}
                item={item}
                viewBase={`${window.location.origin.replace(/\/+$/, "")}/success-stories/view`}
              />
            ))}
          </div>

          {lastPage > 1 ? (
            <div className="ss-pagination">
              <div className="ss-pager">
                <button
                  className="ss-pagebtn"
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
                        className={`ss-pagebtn ${currentPage === 1 ? "active" : ""}`}
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
                        className={`ss-pagebtn ${currentPage === p ? "active" : ""}`}
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
                        className={`ss-pagebtn ${currentPage === lastPage ? "active" : ""}`}
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
                  className="ss-pagebtn"
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
        <div className="ss-state">
          <div style={{ fontSize: 34, opacity: 0.6, marginBottom: 6 }}>
            <i className="fa-regular fa-face-frown"></i>
          </div>
          {emptyMessage}
        </div>
      )}
    </div>
  );
}