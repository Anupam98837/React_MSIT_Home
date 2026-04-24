import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCoursesDepartments,
  fetchCoursesList,
  selectCoursesDepartments,
  selectCoursesDepartmentsStatus,
  selectCoursesItems,
  selectCoursesStatus,
} from "../../redux/crm/coursesViewAllSlice";

const PAGE_SIZE = 9;
const ORIGIN =
  typeof window !== "undefined" ? window.location.origin.replace(/\/+$/, "") : "";

const styles = String.raw`
.csx-wrap{
  --csx-brand: var(--primary-color, #9E363A);
  --csx-ink: #0f172a;
  --csx-muted: #64748b;
  --csx-bg: var(--page-bg, #ffffff);
  --csx-card: var(--surface, #ffffff);
  --csx-line: var(--line-soft, rgba(15,23,42,.10));
  --csx-shadow: 0 10px 24px rgba(2,6,23,.08);

  --csx-card-h: 426.4px;
  --csx-media-h: 240px;

  max-width: 1320px;
  margin: 18px auto 54px;
  padding: 0 12px;
  background: transparent;
  position: relative;
  overflow: visible;
}

.csx-head{
  background: var(--csx-card);
  border: 1px solid var(--csx-line);
  border-radius: 16px;
  box-shadow: var(--csx-shadow);
  padding: 14px 16px;
  margin-bottom: 16px;

  display:flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: nowrap;
}
.csx-title{
  margin: 0;
  font-weight: 950;
  letter-spacing: .2px;
  color: var(--csx-ink);
  font-size: 28px;
  display:flex;
  align-items:center;
  gap: 10px;
  white-space: nowrap;
}
.csx-title i{ color: var(--csx-brand); }
.csx-sub{
  margin: 6px 0 0;
  color: var(--csx-muted);
  font-size: 14px;
}

.csx-tools{
  display:flex;
  gap: 10px;
  align-items:center;
  flex-wrap: nowrap;
}

.csx-search{
  position: relative;
  min-width: 260px;
  max-width: 520px;
  flex: 1 1 320px;
}
.csx-search i{
  position:absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  opacity: .65;
  color: var(--csx-muted);
  pointer-events:none;
}
.csx-search input{
  width:100%;
  height: 42px;
  border-radius: 999px;
  padding: 11px 12px 11px 42px;
  border: 1px solid var(--csx-line);
  background: var(--csx-card);
  color: var(--csx-ink);
  outline: none;
}
.csx-search input:focus{
  border-color: rgba(201,75,80,.55);
  box-shadow: 0 0 0 4px rgba(201,75,80,.18);
}

.csx-select{
  position: relative;
  min-width: 260px;
  max-width: 360px;
  flex: 0 1 320px;
}
.csx-select.csx-level{
  min-width: 210px;
  max-width: 260px;
  flex: 0 1 260px;
}

.csx-select__icon{
  position:absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  opacity: .70;
  color: var(--csx-muted);
  pointer-events:none;
  font-size: 14px;
}
.csx-select__caret{
  position:absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  opacity: .70;
  color: var(--csx-muted);
  pointer-events:none;
  font-size: 12px;
}
.csx-select select{
  width: 100%;
  height: 42px;
  border-radius: 999px;
  padding: 10px 38px 10px 42px;
  border: 1px solid var(--csx-line);
  background: var(--csx-card);
  color: var(--csx-ink);
  outline: none;

  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}
.csx-select select:focus{
  border-color: rgba(201,75,80,.55);
  box-shadow: 0 0 0 4px rgba(201,75,80,.18);
}

.csx-grid{
  display:grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
  align-items: stretch;
}

.csx-card{
  width:100%;
  height: var(--csx-card-h);
  position:relative;
  display:flex;
  flex-direction:column;
  border: 1px solid rgba(2,6,23,.08);
  border-radius: 16px;
  background: #fff;
  box-shadow: var(--csx-shadow);
  overflow:hidden;
  transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
  will-change: transform;
}
.csx-card:hover{
  transform: translateY(-2px);
  box-shadow: 0 16px 34px rgba(2,6,23,.12);
  border-color: rgba(158,54,58,.22);
}

.csx-media{
  width:100%;
  height: var(--csx-media-h);
  flex: 0 0 auto;
  background: var(--csx-brand);
  position:relative;
  overflow:hidden;
  user-select:none;
}
.csx-media .csx-fallback{
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
  line-height: 1.15;
}
.csx-media img{
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
  object-fit:cover;
  display:block;
  z-index: 1;
}

.csx-body{
  padding: 16px 16px 14px;
  display:flex;
  flex-direction:column;
  flex: 1 1 auto;
  min-height: 0;
}
.csx-h{
  font-size: 20px;
  line-height: 1.25;
  font-weight: 950;
  margin: 0 0 10px 0;
  color: var(--csx-ink);

  display:-webkit-box;
  -webkit-line-clamp:2;
  -webkit-box-orient:vertical;
  overflow:hidden;
  overflow-wrap:anywhere;
  word-break:break-word;
}
.csx-p{
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

.csx-link{
  position:absolute;
  inset:0;
  z-index:2;
  border-radius: 16px;
}

.csx-state{
  background: var(--csx-card);
  border: 1px solid var(--csx-line);
  border-radius: 16px;
  box-shadow: var(--csx-shadow);
  padding: 18px;
  color: var(--csx-muted);
  text-align:center;
}

.csx-skeleton{
  display:grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
}
.csx-sk{
  border-radius: 16px;
  border: 1px solid var(--csx-line);
  background: #fff;
  overflow:hidden;
  position:relative;
  box-shadow: 0 10px 24px rgba(2,6,23,.08);
  height: var(--csx-card-h);
}
.csx-sk:before{
  content:'';
  position:absolute; inset:0;
  transform: translateX(-60%);
  background: linear-gradient(90deg, transparent, rgba(148,163,184,.22), transparent);
  animation: csxSkMove 1.15s ease-in-out infinite;
}
@keyframes csxSkMove{ to{ transform: translateX(60%);} }

.csx-pagination{
  display:flex;
  justify-content:center;
  margin-top: 18px;
}
.csx-pagination .csx-pager{
  display:flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items:center;
  justify-content:center;
  padding: 10px;
}
.csx-pagebtn{
  border:1px solid var(--csx-line);
  background: var(--csx-card);
  color: var(--csx-ink);
  border-radius: 12px;
  padding: 9px 12px;
  font-size: 13px;
  font-weight: 950;
  box-shadow: 0 8px 18px rgba(2,6,23,.06);
  cursor:pointer;
  user-select:none;
}
.csx-pagebtn:hover{ background: rgba(2,6,23,.03); }
.csx-pagebtn[disabled]{ opacity:.55; cursor:not-allowed; }
.csx-pagebtn.active{
  background: rgba(201,75,80,.12);
  border-color: rgba(201,75,80,.35);
  color: var(--csx-brand);
}

@media (max-width: 640px){
  .csx-head{ flex-wrap: wrap; align-items: flex-end; }
  .csx-tools{ flex-wrap: wrap; }

  .csx-title{ font-size: 24px; white-space: normal; }
  .csx-search{ min-width: 220px; flex: 1 1 240px; }
  .csx-select{ min-width: 220px; flex: 1 1 240px; }
  .csx-select.csx-level{ min-width: 220px; flex: 1 1 240px; }
  .csx-wrap{ --csx-media-h: 210px; }
  .csx-media .csx-fallback{ font-size: 22px; }
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

const normalizeUrl = (url) => {
  const u = (url || "").toString().trim();
  if (!u) return "";
  if (/^(data:|blob:|https?:\/\/)/i.test(u)) return u;
  if (u.startsWith("/")) return ORIGIN + u;
  return ORIGIN + "/" + u;
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

const normalizeLevel = (v) => (v ?? "").toString().trim().toLowerCase();

const levelLabel = (v) => {
  const s = (v ?? "").toString().trim();
  if (!s) return "";
  const low = s.toLowerCase();
  if (low === "ug") return "UG";
  if (low === "pg") return "PG";
  return s
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const resolveTitle = (item) => String(item?.title || "Course");
const resolveBody = (item) => String(item?.summary || item?.career_scope || item?.body || "");
const resolveCover = (item) =>
  normalizeUrl(item?.cover_image_url || item?.cover_image || item?.image_url || "");
const resolveKey = (item) => String(item?.uuid || item?.slug || "");

const getDeptId = (item) =>
  String(item?.department_id === null || item?.department_id === undefined ? "" : item.department_id);

const getDeptUuid = (item) => String(item?.department_uuid || "");

function CourseCard({ item, viewBase }) {
  const [broken, setBroken] = useState(false);

  const titleRaw = resolveTitle(item);
  const bodyText = stripHtml(resolveBody(item));
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
    <div className="csx-card">
      <div className="csx-media">
        <div className="csx-fallback">Course</div>
        {cover && !broken ? (
          <img
            className="csx-img"
            src={cover}
            alt={titleRaw}
            loading="lazy"
            onError={() => setBroken(true)}
          />
        ) : null}
      </div>

      <div className="csx-body">
        <div className="csx-h">{titleRaw}</div>
        <p className="csx-p">{excerptText || ""}</p>
      </div>

      {identifier ? (
        <a className="csx-link" href={href} aria-label={`Open ${titleRaw}`}></a>
      ) : (
        <div className="csx-link" title="Missing UUID"></div>
      )}
    </div>
  );
}

export default function Courses() {
  const dispatch = useDispatch();

  const departments = useSelector(selectCoursesDepartments);
  const departmentsStatus = useSelector(selectCoursesDepartmentsStatus);
  const coursesStatus = useSelector(selectCoursesStatus);
  const courses = useSelector(selectCoursesItems);

  const [selectedDeptUuid, setSelectedDeptUuid] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedDeptName, setSelectedDeptName] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [initialized, setInitialized] = useState(false);
  const [requestsStarted, setRequestsStarted] = useState(false);

  useEffect(() => {
    ensureFontAwesome();
    dispatch(fetchCoursesDepartments());
    dispatch(fetchCoursesList());
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

  const levelOptions = useMemo(() => {
    const map = new Map();
    (Array.isArray(courses) ? courses : []).forEach((it) => {
      const norm = normalizeLevel(it?.program_level || "");
      if (!norm) return;
      if (!map.has(norm)) map.set(norm, levelLabel(norm));
    });

    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [courses]);

  useEffect(() => {
    if (!requestsStarted || initialized) return;
    if (departmentsStatus === "loading" || coursesStatus === "loading") return;
    if (departmentsStatus === "idle" || coursesStatus === "idle") return;

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
  }, [requestsStarted, initialized, departmentsStatus, coursesStatus, deptByUuid, deptByShortcode]);

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
    coursesStatus === "loading" ||
    !initialized;

  const filteredItems = useMemo(() => {
    let items = Array.isArray(courses) ? courses.slice() : [];

    if (selectedDeptUuid) {
      items = items.filter((item) => {
        const did = getDeptId(item);
        const duu = getDeptUuid(item);
        return (selectedDeptId && did === selectedDeptId) || (duu && duu === selectedDeptUuid);
      });
    }

    if (selectedLevel) {
      const lvl = String(selectedLevel);
      items = items.filter((item) => normalizeLevel(item?.program_level || "") === lvl);
    }

    const q = searchQuery.toLowerCase();
    if (q) {
      items = items.filter((item) => {
        const t = resolveTitle(item).toLowerCase();
        const s = stripHtml(item?.summary || "").toLowerCase();
        const c = stripHtml(item?.career_scope || "").toLowerCase();
        const b = stripHtml(item?.body || "").toLowerCase();
        return t.includes(q) || s.includes(q) || c.includes(q) || b.includes(q);
      });
    }

    return items;
  }, [courses, selectedDeptUuid, selectedDeptId, selectedLevel, searchQuery]);

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
    ? selectedLevel
      ? `Courses for ${selectedDeptName} · Level: ${levelLabel(selectedLevel)}`
      : `Courses for ${selectedDeptName}`
    : selectedLevel
      ? `Browse all published programs & courses · Level: ${levelLabel(selectedLevel)}`
      : "Browse all published programs & courses.";

  const emptyMessage = selectedDeptUuid || selectedLevel
    ? "No courses found."
    : "No courses found.";

  return (
    <div className="csx-wrap">
      <style>{styles}</style>

      <div className="csx-head">
        <div>
          <h1 className="csx-title">
            <i className="fa-solid fa-graduation-cap"></i>
            Courses
          </h1>
          <div className="csx-sub">{subtitle}</div>
        </div>

        <div className="csx-tools">
          <div className="csx-search">
            <i className="fa fa-magnifying-glass"></i>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              type="search"
              placeholder="Search courses (title/summary/body/career scope)…"
            />
          </div>

          <div className="csx-select csx-level" title="Filter by level">
            <i className="fa-solid fa-layer-group csx-select__icon"></i>
            <select
              value={selectedLevel}
              onChange={(e) => {
                setSelectedLevel((e.target.value || "").toString());
                setPage(1);
              }}
              aria-label="Filter by level"
            >
              <option value="">All Levels</option>
              {levelOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <i className="fa-solid fa-chevron-down csx-select__caret"></i>
          </div>

          <div className="csx-select" title="Filter by department">
            <i className="fa-solid fa-building-columns csx-select__icon"></i>
            <select
              value={selectedDeptUuid}
              onChange={(e) => {
                setSelectedDeptUuid((e.target.value || "").toString());
                setPage(1);
              }}
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
            <i className="fa-solid fa-chevron-down csx-select__caret"></i>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="csx-skeleton">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="csx-sk"></div>
          ))}
        </div>
      ) : currentItems.length ? (
        <>
          <div className="csx-grid">
            {currentItems.map((item) => (
              <CourseCard
                key={resolveKey(item) || `${item?.title || "course"}-${item?.uuid || ""}`}
                item={item}
                viewBase={`${ORIGIN}/courses/view`}
              />
            ))}
          </div>

          {lastPage > 1 ? (
            <div className="csx-pagination">
              <div className="csx-pager">
                <button
                  className="csx-pagebtn"
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
                        className={`csx-pagebtn ${currentPage === 1 ? "active" : ""}`}
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
                        className={`csx-pagebtn ${currentPage === p ? "active" : ""}`}
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
                        className={`csx-pagebtn ${currentPage === lastPage ? "active" : ""}`}
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
                  className="csx-pagebtn"
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
        <div className="csx-state">
          <div aria-hidden="true" style={{ width: "170px", maxWidth: "100%", margin: "0 auto 10px", display: "block", color: "var(--csx-brand)" }}>
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