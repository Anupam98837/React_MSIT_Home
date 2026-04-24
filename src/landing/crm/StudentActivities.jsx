import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStudentActivitiesDepartments,
  fetchStudentActivitiesList,
  selectStudentActivitiesDepartments,
  selectStudentActivitiesDepartmentsError,
  selectStudentActivitiesDepartmentsStatus,
  selectStudentActivitiesError,
  selectStudentActivitiesItems,
  selectStudentActivitiesStatus,
} from "../../redux/crm/studentActivitiesSlice";

const PAGE_SIZE = 9;

const styles = String.raw`
.sa-wrap{
  --sa-brand: var(--primary-color, #9E363A);
  --sa-ink: #0f172a;
  --sa-muted: #64748b;
  --sa-bg: var(--page-bg, #ffffff);
  --sa-card: var(--surface, #ffffff);
  --sa-line: var(--line-soft, rgba(15,23,42,.10));
  --sa-shadow: 0 10px 24px rgba(2,6,23,.08);

  --sa-card-h: 426.4px;
  --sa-media-h: 240px;

  max-width: 1320px;
  margin: 18px auto 54px;
  padding: 0 12px;
  background: transparent;
  position: relative;
  overflow: visible;
}

.sa-head{
  background: var(--sa-card);
  border: 1px solid var(--sa-line);
  border-radius: 16px;
  box-shadow: var(--sa-shadow);
  padding: 14px 16px;
  margin-bottom: 16px;

  display:flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}
.sa-head > div:first-child{ flex: 0 0 auto; }

.sa-title{
  margin: 0;
  font-weight: 950;
  letter-spacing: .2px;
  color: var(--sa-ink);
  font-size: 28px;
  display:flex;
  align-items:center;
  gap: 10px;
}
.sa-title i{ color: var(--sa-brand); }
.sa-sub{
  margin: 6px 0 0;
  color: var(--sa-muted);
  font-size: 14px;
}

.sa-tools{
  display:flex;
  gap: 10px;
  align-items:center;
  flex-wrap: nowrap;
  justify-content: flex-end;
  flex: 1 1 auto;
}

.sa-search{
  position: relative;
  min-width: 260px;
  max-width: 520px;
  flex: 1 1 320px;
}
.sa-search i{
  position:absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  opacity: .65;
  color: var(--sa-muted);
  pointer-events:none;
}
.sa-search input{
  width:100%;
  height: 42px;
  border-radius: 999px;
  padding: 11px 12px 11px 42px;
  border: 1px solid var(--sa-line);
  background: var(--sa-card);
  color: var(--sa-ink);
  outline: none;
}
.sa-search input:focus{
  border-color: rgba(201,75,80,.55);
  box-shadow: 0 0 0 4px rgba(201,75,80,.18);
}

.sa-select{
  position: relative;
  min-width: 260px;
  max-width: 360px;
  flex: 0 1 320px;
}
.sa-select__icon{
  position:absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  opacity: .70;
  color: var(--sa-muted);
  pointer-events:none;
  font-size: 14px;
}
.sa-select__caret{
  position:absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  opacity: .70;
  color: var(--sa-muted);
  pointer-events:none;
  font-size: 12px;
}
.sa-select select{
  width: 100%;
  height: 42px;
  border-radius: 999px;
  padding: 10px 38px 10px 42px;
  border: 1px solid var(--sa-line);
  background: var(--sa-card);
  color: var(--sa-ink);
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}
.sa-select select:focus{
  border-color: rgba(201,75,80,.55);
  box-shadow: 0 0 0 4px rgba(201,75,80,.18);
}

.sa-grid{
  display:grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
  align-items: stretch;
}

.sa-card{
  width:100%;
  height: var(--sa-card-h);
  position:relative;
  display:flex;
  flex-direction:column;
  border: 1px solid rgba(2,6,23,.08);
  border-radius: 16px;
  background: #fff;
  box-shadow: var(--sa-shadow);
  overflow:hidden;
  transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
  will-change: transform;
}
.sa-card:hover{
  transform: translateY(-2px);
  box-shadow: 0 16px 34px rgba(2,6,23,.12);
  border-color: rgba(158,54,58,.22);
}

.sa-media{
  width:100%;
  height: var(--sa-media-h);
  flex: 0 0 auto;
  background: var(--sa-brand);
  position:relative;
  overflow:hidden;
  user-select:none;
}
.sa-media .sa-fallback{
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
  padding: 0 16px;
  text-align:center;
}
.sa-media img{
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
  object-fit:cover;
  display:block;
  z-index: 1;
}

.sa-body{
  padding: 16px 16px 14px;
  display:flex;
  flex-direction:column;
  flex: 1 1 auto;
  min-height: 0;
}
.sa-h{
  font-size: 20px;
  line-height: 1.25;
  font-weight: 950;
  margin: 0 0 10px 0;
  color: var(--sa-ink);
  display:-webkit-box;
  -webkit-line-clamp:2;
  -webkit-box-orient:vertical;
  overflow:hidden;
  overflow-wrap:anywhere;
  word-break:break-word;
}
.sa-p{
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

.sa-date{
  margin-top:auto;
  color:#94a3b8;
  font-size: 13px;
  padding-top: 12px;
  display:flex;
  align-items:center;
  gap: 6px;
}

.sa-link{
  position:absolute;
  inset:0;
  z-index:2;
  border-radius: 16px;
}

.sa-state{
  background: var(--sa-card);
  border: 1px solid var(--sa-line);
  border-radius: 16px;
  box-shadow: var(--sa-shadow);
  padding: 18px;
  color: var(--sa-muted);
  text-align:center;
}

.sa-skeleton{
  display:grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
}
.sa-sk{
  border-radius: 16px;
  border: 1px solid var(--sa-line);
  background: #fff;
  overflow:hidden;
  position:relative;
  box-shadow: 0 10px 24px rgba(2,6,23,.08);
  height: var(--sa-card-h);
}
.sa-sk:before{
  content:'';
  position:absolute; inset:0;
  transform: translateX(-60%);
  background: linear-gradient(90deg, transparent, rgba(148,163,184,.22), transparent);
  animation: saSkMove 1.15s ease-in-out infinite;
}
@keyframes saSkMove{ to{ transform: translateX(60%);} }

.sa-pagination{
  display:flex;
  justify-content:center;
  margin-top: 18px;
}
.sa-pagination .sa-pager{
  display:flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items:center;
  justify-content:center;
  padding: 10px;
}
.sa-pagebtn{
  border:1px solid var(--sa-line);
  background: var(--sa-card);
  color: var(--sa-ink);
  border-radius: 12px;
  padding: 9px 12px;
  font-size: 13px;
  font-weight: 950;
  box-shadow: 0 8px 18px rgba(2,6,23,.06);
  cursor:pointer;
  user-select:none;
}
.sa-pagebtn:hover{ background: rgba(2,6,23,.03); }
.sa-pagebtn[disabled]{ opacity:.55; cursor:not-allowed; }
.sa-pagebtn.active{
  background: rgba(201,75,80,.12);
  border-color: rgba(201,75,80,.35);
  color: var(--sa-brand);
}

@media (max-width: 992px){
  .sa-head{ flex-wrap: wrap; align-items: flex-end; }
  .sa-tools{ flex-wrap: wrap; justify-content: flex-start; }
}

@media (max-width: 640px){
  .sa-title{ font-size: 24px; white-space: normal; }
  .sa-search{ min-width: 220px; flex: 1 1 240px; }
  .sa-select{ min-width: 220px; flex: 1 1 240px; }
  .sa-wrap{ --sa-media-h: 210px; }
  .sa-media .sa-fallback{ font-size: 22px; }
}

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

const resolveName = (item) => String(item?.title || "Untitled");
const resolveBody = (item) => String(item?.body || "");
const resolveCover = (item) =>
  normalizeUrl(item?.cover_image_url || item?.cover_image || item?.image_url || "");
const resolveKey = (item) => String(item?.uuid || item?.slug || "");

const getDeptId = (item) =>
  String(item?.department_id === null || item?.department_id === undefined ? "" : item.department_id);

const getDeptUuid = (item) => String(item?.department_uuid || "");

function ActivityCard({ item, viewBase }) {
  const [broken, setBroken] = useState(false);

  const titleRaw = resolveName(item);
  const bodyText = stripHtml(resolveBody(item));
  const created = fmtDate(item?.created_at || null);
  const cover = resolveCover(item);
  const uuid = item?.uuid ? String(item.uuid) : "";
  const slug = item?.slug ? String(item.slug) : "";
  const identifier = slug || uuid;
  const href = identifier ? `${viewBase}/${encodeURIComponent(identifier)}` : "#";

  let excerptText = bodyText;
  if (excerptText.length > 90) {
    excerptText = excerptText.slice(0, 90).trim().replace(/[,\.;:\-\s]+$/g, "");
    excerptText += "......";
  }

  return (
    <div className="sa-card">
      <div className="sa-media">
        <div className="sa-fallback">Activity</div>
        {cover && !broken ? (
          <img
            className="sa-img"
            src={cover}
            alt={titleRaw}
            loading="lazy"
            onError={() => setBroken(true)}
          />
        ) : null}
      </div>

      <div className="sa-body">
        <div className="sa-h">{titleRaw}</div>
        <p className="sa-p">{excerptText || ""}</p>

        <div className="sa-date">
          <i className="fa-regular fa-calendar"></i>
          <span>Created: {created || "—"}</span>
        </div>
      </div>

      {identifier ? (
        <a className="sa-link" href={href} aria-label={`Open ${titleRaw}`}></a>
      ) : (
        <div className="sa-link" title="Missing UUID"></div>
      )}
    </div>
  );
}

export default function StudentActivities() {
  const dispatch = useDispatch();

  const departments = useSelector(selectStudentActivitiesDepartments);
  const departmentsStatus = useSelector(selectStudentActivitiesDepartmentsStatus);
  const departmentsError = useSelector(selectStudentActivitiesDepartmentsError);

  const activities = useSelector(selectStudentActivitiesItems);
  const activitiesStatus = useSelector(selectStudentActivitiesStatus);
  const activitiesError = useSelector(selectStudentActivitiesError);

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
    dispatch(fetchStudentActivitiesDepartments());
    dispatch(fetchStudentActivitiesList());
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
    if (departmentsStatus === "loading" || activitiesStatus === "loading") return;

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
  }, [requestsStarted, initialized, departmentsStatus, activitiesStatus, deptByUuid, deptByShortcode]);

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
    activitiesStatus === "loading" ||
    !initialized;

  const filteredItems = useMemo(() => {
    let items = Array.isArray(activities) ? activities.slice() : [];

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
        const t = resolveName(item).toLowerCase();
        const b = stripHtml(resolveBody(item)).toLowerCase();
        return t.includes(q) || b.includes(q);
      });
    }

    return items;
  }, [activities, selectedDeptUuid, selectedDeptId, searchQuery]);

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
    ? `Student Activities for ${selectedDeptName}`
    : "Latest updates, workshops, events, and campus highlights.";

  const emptyMessage = selectedDeptUuid
    ? "No student activities found for this department."
    : "No student activities found.";

  return (
    <div className="sa-wrap">
      <style>{styles}</style>

      <div className="sa-head">
        <div>
          <h1 className="sa-title">
            <i className="fa-solid fa-people-group"></i>
            Student Activities
          </h1>
          <div className="sa-sub">{subtitle}</div>
        </div>

        <div className="sa-tools">
          <div className="sa-search">
            <i className="fa fa-magnifying-glass"></i>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              type="search"
              placeholder="Search activities (title/body)…"
            />
          </div>

          <div className="sa-select" title="Filter by department">
            <i className="fa-solid fa-building-columns sa-select__icon"></i>
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
            <i className="fa-solid fa-chevron-down sa-select__caret"></i>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="sa-skeleton">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="sa-sk"></div>
          ))}
        </div>
      ) : (departmentsError || activitiesError) && !currentItems.length ? (
        <div className="sa-state">
          <div aria-hidden="true" style={{ width: "170px", maxWidth: "100%", margin: "0 auto 10px", display: "block", color: "var(--sa-brand)" }}>
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
      ) : currentItems.length ? (
        <>
          <div className="sa-grid">
            {currentItems.map((item) => (
              <ActivityCard
                key={resolveKey(item) || `${item?.title || "activity"}-${item?.created_at || ""}`}
                item={item}
                viewBase={`${window.location.origin.replace(/\/+$/, "")}/student-activities/view`}
              />
            ))}
          </div>

          {lastPage > 1 ? (
            <div className="sa-pagination">
              <div className="sa-pager">
                <button
                  className="sa-pagebtn"
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
                        className={`sa-pagebtn ${currentPage === 1 ? "active" : ""}`}
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
                        className={`sa-pagebtn ${currentPage === p ? "active" : ""}`}
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
                        className={`sa-pagebtn ${currentPage === lastPage ? "active" : ""}`}
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
                  className="sa-pagebtn"
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
        <div className="sa-state">
          <div aria-hidden="true" style={{ width: "170px", maxWidth: "100%", margin: "0 auto 10px", display: "block", color: "var(--sa-brand)" }}>
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
    </div>
  );
}