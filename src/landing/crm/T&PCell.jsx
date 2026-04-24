import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTPCellDepartments,
  fetchTPCellList,
  selectTPCellDepartments,
  selectTPCellDepartmentsError,
  selectTPCellDepartmentsStatus,
  selectTPCellError,
  selectTPCellItems,
  selectTPCellStatus,
} from "../../redux/crm/T&PCellSlice";

const PAGE_SIZE = 9;

const styles = String.raw`
.pox-wrap{
  --pox-brand: var(--primary-color, #9E363A);
  --pox-ink: #0f172a;
  --pox-muted: #64748b;
  --pox-bg: var(--page-bg, #ffffff);
  --pox-card: var(--surface, #ffffff);
  --pox-line: var(--line-soft, rgba(15,23,42,.10));
  --pox-shadow: 0 10px 24px rgba(2,6,23,.08);

  --pox-card-h: 426.4px;
  --pox-media-h: 240px;

  max-width: 1320px;
  margin: 18px auto 54px;
  padding: 0 12px;
  background: transparent;
  position: relative;
  overflow: visible;
}

.pox-head{
  background: var(--pox-card);
  border: 1px solid var(--pox-line);
  border-radius: 16px;
  box-shadow: var(--pox-shadow);
  padding: 14px 16px;
  margin-bottom: 16px;
  display:flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}
.pox-title{
  margin: 0;
  font-weight: 950;
  letter-spacing: .2px;
  color: var(--pox-ink);
  font-size: 28px;
  display:flex;
  align-items:center;
  gap: 10px;
  white-space: nowrap;
}
.pox-title i{ color: var(--pox-brand); }
.pox-sub{
  margin: 6px 0 0;
  color: var(--pox-muted);
  font-size: 14px;
}

.pox-tools{
  display:flex;
  gap: 10px;
  align-items:center;
  flex-wrap: nowrap;
}

.pox-search{
  position: relative;
  min-width: 260px;
  max-width: 520px;
  flex: 1 1 320px;
}
.pox-search i{
  position:absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  opacity: .65;
  color: var(--pox-muted);
  pointer-events:none;
}
.pox-search input{
  width:100%;
  height: 42px;
  border-radius: 999px;
  padding: 11px 12px 11px 42px;
  border: 1px solid var(--pox-line);
  background: var(--pox-card);
  color: var(--pox-ink);
  outline: none;
}
.pox-search input:focus{
  border-color: rgba(201,75,80,.55);
  box-shadow: 0 0 0 4px rgba(201,75,80,.18);
}

.pox-select{
  position: relative;
  min-width: 260px;
  max-width: 360px;
  flex: 0 1 320px;
}
.pox-select__icon{
  position:absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  opacity: .70;
  color: var(--pox-muted);
  pointer-events:none;
  font-size: 14px;
}
.pox-select__caret{
  position:absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  opacity: .70;
  color: var(--pox-muted);
  pointer-events:none;
  font-size: 12px;
}
.pox-select select{
  width: 100%;
  height: 42px;
  border-radius: 999px;
  padding: 10px 38px 10px 42px;
  border: 1px solid var(--pox-line);
  background: var(--pox-card);
  color: var(--pox-ink);
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}
.pox-select select:focus{
  border-color: rgba(201,75,80,.55);
  box-shadow: 0 0 0 4px rgba(201,75,80,.18);
}

.pox-grid{
  display:grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
  align-items: stretch;
}

.pox-card{
  width:100%;
  height: var(--pox-card-h);
  position:relative;
  display:flex;
  flex-direction:column;
  border: 1px solid rgba(2,6,23,.08);
  border-radius: 16px;
  background: #fff;
  box-shadow: var(--pox-shadow);
  overflow:hidden;
  transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
  will-change: transform;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}
.pox-card:hover{
  transform: translateY(-2px);
  box-shadow: 0 16px 34px rgba(2,6,23,.12);
  border-color: rgba(158,54,58,.22);
}

.pox-media{
  width:100%;
  height: var(--pox-media-h);
  flex: 0 0 auto;
  background: var(--pox-brand);
  position:relative;
  overflow:hidden;
  user-select:none;
}
.pox-media .pox-fallback{
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
  gap:10px;
}
.pox-media .pox-fallback i{ opacity:.9; }
.pox-media img{
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
  object-fit:cover;
  display:block;
  z-index: 1;
}

.pox-body{
  padding: 16px 16px 14px;
  display:flex;
  flex-direction:column;
  flex: 1 1 auto;
  min-height: 0;
}
.pox-h{
  font-size: 20px;
  line-height: 1.25;
  font-weight: 950;
  margin: 0 0 10px 0;
  color: var(--pox-ink);
  display:-webkit-box;
  -webkit-line-clamp:2;
  -webkit-box-orient:vertical;
  overflow:hidden;
  overflow-wrap:anywhere;
  word-break:break-word;
}
.pox-p{
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

.pox-meta{
  margin-top:auto;
  color:#94a3b8;
  font-size: 13px;
  padding-top: 12px;
  display:flex;
  align-items:center;
  gap: 10px;
  flex-wrap:wrap;
}
.pox-meta .it{
  display:flex;
  align-items:center;
  gap: 6px;
}

.pox-state{
  background: var(--pox-card);
  border: 1px solid var(--pox-line);
  border-radius: 16px;
  box-shadow: var(--pox-shadow);
  padding: 18px;
  color: var(--pox-muted);
  text-align:center;
}

.pox-skeleton{
  display:grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
}
.pox-sk{
  border-radius: 16px;
  border: 1px solid var(--pox-line);
  background: #fff;
  overflow:hidden;
  position:relative;
  box-shadow: 0 10px 24px rgba(2,6,23,.08);
  height: var(--pox-card-h);
}
.pox-sk:before{
  content:'';
  position:absolute; inset:0;
  transform: translateX(-60%);
  background: linear-gradient(90deg, transparent, rgba(148,163,184,.22), transparent);
  animation: poxSkMove 1.15s ease-in-out infinite;
}
@keyframes poxSkMove{ to{ transform: translateX(60%);} }

.pox-pagination{
  display:flex;
  justify-content:center;
  margin-top: 18px;
}
.pox-pagination .pox-pager{
  display:flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items:center;
  justify-content:center;
  padding: 10px;
}
.pox-pagebtn{
  border:1px solid var(--pox-line);
  background: var(--pox-card);
  color: var(--pox-ink);
  border-radius: 12px;
  padding: 9px 12px;
  font-size: 13px;
  font-weight: 950;
  box-shadow: 0 8px 18px rgba(2,6,23,.06);
  cursor:pointer;
  user-select:none;
}
.pox-pagebtn:hover{ background: rgba(2,6,23,.03); }
.pox-pagebtn[disabled]{ opacity:.55; cursor:not-allowed; }
.pox-pagebtn.active{
  background: rgba(201,75,80,.12);
  border-color: rgba(201,75,80,.35);
  color: var(--pox-brand);
}

@media (max-width: 992px){
  .pox-head{ flex-wrap: wrap; align-items: flex-end; }
  .pox-tools{ flex-wrap: wrap; }
}

@media (max-width: 640px){
  .pox-title{ font-size: 24px; }
  .pox-search{ min-width: 220px; flex: 1 1 240px; }
  .pox-select{ min-width: 220px; flex: 1 1 240px; }
  .pox-wrap{ --pox-media-h: 210px; }
  .pox-media .pox-fallback{ font-size: 22px; }
}

.dynamic-navbar .navbar-nav .dropdown-menu{
  position: absolute !important;
  inset: auto !important;
}
.dynamic-navbar .dropdown-menu.is-portaled{
  position: fixed !important;
}
`;

const stripHtml = (html) => {
  const div = document.createElement("div");
  div.innerHTML = String(html || "");
  return (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
};

const normalizeUrl = (url) => {
  const u = (url || "").toString().trim();
  if (!u) return "";
  if (/^(data:|blob:|https?:\/\/)/i.test(u)) return u;
  if (u.startsWith("/")) return window.location.origin + u;
  return window.location.origin + "/" + u;
};

const pick = (obj, keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== null && v !== undefined && String(v).trim() !== "") return v;
  }
  return "";
};

const resolveName = (item) =>
  String(pick(item, ["name", "user_name", "full_name"]) || "Placement Officer");

const resolveEmail = (item) => String(pick(item, ["email"]) || "");

const resolveDesignation = (item) =>
  String(pick(item, ["designation", "affiliation", "role_short_form", "role"]) || "Placement Officer");

const resolveImage = (item) => {
  const img =
    pick(item, ["image_full_url", "image_url", "photo_url", "profile_image_url"]) ||
    pick(item, ["image"]) ||
    "";
  return normalizeUrl(img);
};

const resolveDeptId = (item) => {
  const v = pick(item, ["department_id", "dept_id", "departmentId", "deptId", "department"]);
  return v === null || v === undefined || String(v).trim() === "" ? "" : String(v).trim();
};

const resolveDeptUuid = (item) => {
  const v = pick(item, ["department_uuid", "dept_uuid", "departmentUuid", "deptUuid"]);
  return String(v || "").trim();
};

const buildProfileUrl = (identifier) =>
  identifier ? `${window.location.origin.replace(/\/+$/, "")}/user/profile/${encodeURIComponent(identifier)}` : "#";

const getDeptFromUrl = (deptByUuid, deptByShortcode) => {
  const url = new URL(window.location.href);
  const direct = (url.searchParams.get("department") || url.searchParams.get("dept") || "").trim();

  if (direct) {
    if (deptByShortcode.has(direct.toLowerCase())) return deptByShortcode.get(direct.toLowerCase());
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

const ensureFontAwesome = () => {
  if (document.querySelector('link[href*="font-awesome"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";
  document.head.appendChild(link);
};

function OfficerCard({ item, deptName }) {
  const [broken, setBroken] = useState(false);

  const name = resolveName(item);
  const designation = stripHtml(resolveDesignation(item));
  const email = resolveEmail(item);
  const image = resolveImage(item);
  const identifier = pick(item, ["uuid", "user_uuid", "id"]) || "";
  const href = buildProfileUrl(identifier);

  return (
    <a
      className="pox-card"
      href={href}
      onClick={(e) => {
        if (!identifier) e.preventDefault();
      }}
      aria-label={identifier ? `Open ${name} profile` : `${name} profile unavailable`}
    >
      <div className="pox-media">
        <div className="pox-fallback">
          <i className="fa-solid fa-user-tie"></i>
          Placement Officer
        </div>

        {image && !broken ? (
          <img
            className="pox-img"
            src={image}
            alt={name}
            loading="lazy"
            onError={() => setBroken(true)}
          />
        ) : null}
      </div>

      <div className="pox-body">
        <div className="pox-h">{name}</div>
        <p className="pox-p">{designation || "Placement Officer"}</p>

        <div className="pox-meta">
          <div className="it" title="Email">
            <i className="fa-regular fa-envelope"></i>
            <span>{email || "—"}</span>
          </div>
          <div className="it" title="Department">
            <i className="fa-regular fa-building"></i>
            <span>{deptName || "All Departments"}</span>
          </div>
        </div>
      </div>
    </a>
  );
}

export default function TPCell() {
  const dispatch = useDispatch();

  const departments = useSelector(selectTPCellDepartments);
  const departmentsStatus = useSelector(selectTPCellDepartmentsStatus);
  const departmentsError = useSelector(selectTPCellDepartmentsError);

  const officers = useSelector(selectTPCellItems);
  const officersStatus = useSelector(selectTPCellStatus);
  const officersError = useSelector(selectTPCellError);

  const [selectedDeptUuid, setSelectedDeptUuid] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [initialized, setInitialized] = useState(false);
  const [requestsStarted, setRequestsStarted] = useState(false);

  useEffect(() => {
    ensureFontAwesome();
    dispatch(fetchTPCellDepartments());
    dispatch(fetchTPCellList());
    setRequestsStarted(true);
  }, [dispatch]);

  const deptByUuid = useMemo(() => new Map((departments || []).map((d) => [d.uuid, d])), [departments]);

  const deptByShortcode = useMemo(
    () =>
      new Map(
        (departments || [])
          .filter((d) => d.shortcode)
          .map((d) => [d.shortcode, d.uuid])
      ),
    [departments]
  );

  const selectedDeptMeta = selectedDeptUuid ? deptByUuid.get(selectedDeptUuid) || null : null;
  const selectedDeptId =
    selectedDeptMeta?.id !== null && selectedDeptMeta?.id !== undefined
      ? String(selectedDeptMeta.id)
      : "";
  const selectedDeptName = selectedDeptMeta?.title || "";

  useEffect(() => {
    if (!requestsStarted || initialized) return;
    if (departmentsStatus === "loading" || officersStatus === "loading") return;
    if (departmentsStatus === "idle" && officersStatus === "idle") return;

    const initialDept = getDeptFromUrl(deptByUuid, deptByShortcode);
    setSelectedDeptUuid(initialDept || "");
    setInitialized(true);
    setPage(1);
  }, [requestsStarted, initialized, departmentsStatus, officersStatus, deptByUuid, deptByShortcode]);

  useEffect(() => {
    if (!initialized) return;
    syncUrl(selectedDeptUuid, deptByUuid);
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
    officersStatus === "loading" ||
    !initialized;

  const filteredItems = useMemo(() => {
    let items = Array.isArray(officers) ? officers.slice() : [];

    if (selectedDeptUuid) {
      items = items.filter((item) => {
        const did = resolveDeptId(item);
        const duu = resolveDeptUuid(item);
        return (selectedDeptId && did === selectedDeptId) || (duu && duu === selectedDeptUuid);
      });
    }

    const q = searchQuery.toLowerCase();
    if (q) {
      items = items.filter((item) => {
        const n = resolveName(item).toLowerCase();
        const d = stripHtml(resolveDesignation(item)).toLowerCase();
        const e = resolveEmail(item).toLowerCase();
        return n.includes(q) || d.includes(q) || e.includes(q);
      });
    }

    return items;
  }, [officers, selectedDeptUuid, selectedDeptId, searchQuery]);

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
    ? `Placement Officers for ${selectedDeptName}`
    : "Meet our Placement & Training team.";

  const emptyMessage = selectedDeptUuid
    ? "No placement officers found for this department."
    : "No placement officers found.";

  return (
    <div className="pox-wrap">
      <style>{styles}</style>

      <div className="pox-head">
        <div>
          <h1 className="pox-title">
            <i className="fa-solid fa-bullhorn"></i>
            Placement Officers
          </h1>
          <div className="pox-sub">{subtitle}</div>
        </div>

        <div className="pox-tools">
          <div className="pox-search">
            <i className="fa fa-magnifying-glass"></i>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              type="search"
              placeholder="Search placement officers (name/email/designation)…"
            />
          </div>

          <div className="pox-select" title="Filter by department">
            <i className="fa-solid fa-building-columns pox-select__icon"></i>
            <select value={selectedDeptUuid} onChange={(e) => setSelectedDeptUuid(e.target.value)} aria-label="Filter by department">
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
            <i className="fa-solid fa-chevron-down pox-select__caret"></i>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="pox-skeleton">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="pox-sk"></div>
          ))}
        </div>
      ) : (departmentsError || officersError) && !currentItems.length ? (
        <div className="pox-state">
          <div style={{ fontSize: 34, opacity: 0.6, marginBottom: 6 }}>
            <i className="fa-regular fa-face-frown"></i>
          </div>
          No placement officers found.
          {selectedDeptName ? (
            <div style={{ marginTop: 6, fontSize: 12.5, opacity: 0.95 }}>
              Department: <b>{selectedDeptName}</b>
            </div>
          ) : null}
        </div>
      ) : currentItems.length ? (
        <>
          <div className="pox-grid">
            {currentItems.map((item) => (
              <OfficerCard
                key={item?.uuid || item?.user_uuid || item?.id || resolveName(item)}
                item={item}
                deptName={selectedDeptName || "All Departments"}
              />
            ))}
          </div>

          {lastPage > 1 ? (
            <div className="pox-pagination">
              <div className="pox-pager">
                <button
                  className="pox-pagebtn"
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
                        className={`pox-pagebtn ${currentPage === 1 ? "active" : ""}`}
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
                        className={`pox-pagebtn ${currentPage === p ? "active" : ""}`}
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
                        className={`pox-pagebtn ${currentPage === lastPage ? "active" : ""}`}
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
                  className="pox-pagebtn"
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
        <div className="pox-state">
          <div style={{ fontSize: 34, opacity: 0.6, marginBottom: 6 }}>
            <i className="fa-regular fa-face-frown"></i>
          </div>
          {emptyMessage}
        </div>
      )}
    </div>
  );
}