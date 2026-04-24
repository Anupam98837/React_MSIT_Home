import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPlacedStudentsDepartments,
  fetchPlacedStudentsList,
  selectPlacedStudentsDepartments,
  selectPlacedStudentsDepartmentsError,
  selectPlacedStudentsDepartmentsStatus,
  selectPlacedStudentsError,
  selectPlacedStudentsItems,
  selectPlacedStudentsStatus,
} from "../../redux/crm/placedStudentsSlice";

const PAGE_SIZE = 12;
const ORIGIN =
  typeof window !== "undefined"
    ? window.location.origin.replace(/\/+$/, "")
    : "";

const styles = String.raw`
.psx-wrap{
  --psx-brand: var(--primary-color, #9E363A);
  --psx-ink: #0f172a;
  --psx-muted: #64748b;
  --psx-bg: var(--page-bg, #ffffff);
  --psx-card: var(--surface, #ffffff);
  --psx-line: var(--line-soft, rgba(15,23,42,.10));
  --psx-shadow: 0 10px 24px rgba(2,6,23,.08);

  --psx-card-w: 247px;
  --psx-card-h: 329px;
  --psx-radius: 18px;

  max-width: 1320px;
  margin: 18px auto 54px;
  padding: 0 12px;
  background: transparent;
  position: relative;
  overflow: visible;
}

.psx-head{
  background: var(--psx-card);
  border: 1px solid var(--psx-line);
  border-radius: 16px;
  box-shadow: var(--psx-shadow);
  padding: 14px 16px;
  margin-bottom: 16px;
  display:flex;
  gap: 12px;
  align-items:center;
  justify-content:space-between;
  flex-wrap: wrap;
}

.psx-head > div:first-child{
  min-width: 0;
  flex: 0 1 auto;
}

.psx-title{
  margin:0;
  font-weight: 950;
  letter-spacing: .2px;
  color: var(--psx-ink);
  font-size: 28px;
  display:flex;
  align-items:center;
  gap: 10px;
  white-space: nowrap;
}
.psx-title i{ color: var(--psx-brand); }
.psx-sub{
  margin: 6px 0 0;
  color: var(--psx-muted);
  font-size: 14px;
}

.psx-tools{
  display:flex;
  gap: 10px;
  align-items:center;
  flex-wrap: nowrap;
  flex: 1 1 560px;
  min-width: 0;
  justify-content: flex-end;
}

.psx-search{
  position: relative;
  min-width: 0;
  max-width: 520px;
  flex: 1 1 320px;
}
.psx-search i{
  position:absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  opacity: .65;
  color: var(--psx-muted);
  pointer-events:none;
}
.psx-search input{
  width:100%;
  height: 42px;
  border-radius: 999px;
  padding: 11px 12px 11px 42px;
  border: 1px solid var(--psx-line);
  background: var(--psx-card);
  color: var(--psx-ink);
  outline: none;
  min-width: 0;
}
.psx-search input:focus{
  border-color: rgba(201,75,80,.55);
  box-shadow: 0 0 0 4px rgba(201,75,80,.18);
}

.psx-select{
  position: relative;
  min-width: 0;
  max-width: 320px;
  flex: 0 1 280px;
}
.psx-select__icon{
  position:absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  opacity: .70;
  color: var(--psx-muted);
  pointer-events:none;
  font-size: 14px;
}
.psx-select__caret{
  position:absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  opacity: .70;
  color: var(--psx-muted);
  pointer-events:none;
  font-size: 12px;
}
.psx-select select{
  width: 100%;
  height: 42px;
  border-radius: 999px;
  padding: 10px 38px 10px 42px;
  border: 1px solid var(--psx-line);
  background: var(--psx-card);
  color: var(--psx-ink);
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.psx-select select:focus{
  border-color: rgba(201,75,80,.55);
  box-shadow: 0 0 0 4px rgba(201,75,80,.18);
}

.psx-grid{
  display:grid;
  grid-template-columns: repeat(auto-fill, var(--psx-card-w));
  gap: 18px;
  align-items: start;
  justify-content: center;
}

.psx-card{
  position: relative;
  width: var(--psx-card-w);
  height: var(--psx-card-h);
  border-radius: var(--psx-radius);
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
.psx-card:hover{
  transform: translateY(-4px);
  box-shadow: 0 18px 42px rgba(0,0,0,.16);
  border-color: rgba(158,54,58,.22);
}

.psx-card .bg{
  position:absolute; inset:0;
  background-size: cover;
  background-position: center;
  filter: saturate(1.02);
  transform: scale(1.0001);
}

.psx-card .vignette{
  position:absolute; inset:0;
  background:
    radial-gradient(1200px 500px at 50% -20%, rgba(255,255,255,.10), rgba(0,0,0,0) 60%),
    linear-gradient(180deg, rgba(0,0,0,.00) 28%, rgba(0,0,0,.12) 60%, rgba(0,0,0,.62) 100%);
}

.psx-card .info{
  position:absolute;
  left: 14px;
  right: 14px;
  bottom: 14px;
  z-index: 2;
}
.psx-name{
  margin:0;
  font-size: 18px;
  font-weight: 950;
  line-height: 1.12;
  color: #fff;
  text-shadow: 0 6px 16px rgba(0,0,0,.35);
}
.psx-meta{
  margin: 7px 0 0;
  font-size: 13px;
  font-weight: 800;
  color: rgba(255,255,255,.90);
  text-shadow: 0 6px 16px rgba(0,0,0,.35);
  line-height: 1.2;
}
.psx-meta .dot{
  opacity: .85;
  padding: 0 6px;
}
.psx-submeta{
  margin: 7px 0 0;
  font-size: 12.5px;
  color: rgba(255,255,255,.82);
  text-shadow: 0 6px 16px rgba(0,0,0,.35);
  line-height: 1.2;
}

.psx-pill{
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

.psx-placeholder{
  position:absolute; inset:0;
  display:grid; place-items:center;
  background:
    radial-gradient(800px 360px at 20% 10%, rgba(158,54,58,.20), transparent 60%),
    radial-gradient(900px 400px at 80% 90%, rgba(158,54,58,.14), transparent 60%),
    linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.82));
}
.psx-initials{
  width: 86px; height: 86px;
  border-radius: 24px;
  display:grid; place-items:center;
  font-weight: 950;
  font-size: 28px;
  color: var(--psx-brand);
  background: rgba(158,54,58,.12);
  border: 1px solid rgba(158,54,58,.25);
}

.psx-state{
  background: var(--psx-card);
  border: 1px solid var(--psx-line);
  border-radius: 16px;
  box-shadow: var(--psx-shadow);
  padding: 18px;
  color: var(--psx-muted);
  text-align:center;
}

.psx-skeleton{
  display:grid;
  grid-template-columns: repeat(auto-fill, var(--psx-card-w));
  gap: 18px;
  justify-content: center;
}
.psx-sk{
  border-radius: var(--psx-radius);
  border: 1px solid var(--psx-line);
  background: #fff;
  overflow:hidden;
  position:relative;
  box-shadow: 0 10px 24px rgba(2,6,23,.08);
  height: var(--psx-card-h);
}
.psx-sk:before{
  content:'';
  position:absolute; inset:0;
  transform: translateX(-60%);
  background: linear-gradient(90deg, transparent, rgba(148,163,184,.22), transparent);
  animation: psxSkMove 1.15s ease-in-out infinite;
}
@keyframes psxSkMove{ to{ transform: translateX(60%);} }

.psx-pagination{
  display:flex;
  justify-content:center;
  margin-top: 18px;
}
.psx-pagination .psx-pager{
  display:flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items:center;
  justify-content:center;
  padding: 10px;
}
.psx-pagebtn{
  border:1px solid var(--psx-line);
  background: var(--psx-card);
  color: var(--psx-ink);
  border-radius: 12px;
  padding: 9px 12px;
  font-size: 13px;
  font-weight: 950;
  box-shadow: 0 8px 18px rgba(2,6,23,.06);
  cursor:pointer;
  user-select:none;
}
.psx-pagebtn:hover{ background: rgba(2,6,23,.03); }
.psx-pagebtn[disabled]{ opacity:.55; cursor:not-allowed; }
.psx-pagebtn.active{
  background: rgba(201,75,80,.12);
  border-color: rgba(201,75,80,.35);
  color: var(--psx-brand);
}

@media (max-width: 992px){
  .psx-head{ align-items: flex-end; }
  .psx-tools{ flex-wrap: wrap; justify-content: flex-start; }
}

@media (max-width: 640px){
  .psx-title{
    font-size: 24px;
    white-space: normal;
  }
  .psx-search{ min-width: 100%; max-width: 100%; flex: 1 1 100%; }
  .psx-select{ min-width: 100%; max-width: 100%; flex: 1 1 100%; }
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

const pick = (obj, keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== null && v !== undefined && String(v).trim() !== "") return v;
  }
  return "";
};

const normalizeUrl = (url) => {
  const u = (url || "").toString().trim();
  if (!u) return "";
  if (/^(data:|blob:|https?:\/\/|mailto:|tel:)/i.test(u)) return u;
  if (u.startsWith("//")) return "https:" + u;
  if (u.startsWith("/")) return window.location.origin + u;
  if (u.includes(".") && !u.includes(" ")) return "https://" + u.replace(/^\/+/, "");
  return window.location.origin + "/" + u.replace(/^\/+/, "");
};

const fmtDate = (d) => {
  const s = (d || "").toString().trim();
  if (!s) return "";
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return s;
  const dt = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`);
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(dt);
  } catch {
    return s;
  }
};

const initials = (name) => {
  const n = (name || "").trim();
  if (!n) return "PS";
  const parts = n.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((p) => p[0].toUpperCase()).join("");
};

const looksLikeUuid = (v) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(v || "").trim()
  );

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
    pick(item, ["user_name", "student_name", "name"]) ||
      pick(item?.user, ["name", "full_name", "username"]) ||
      "Student"
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

const resolveCompany = (item) =>
  String(pick(getMeta(item), ["company"]) || pick(item, ["company", "company_name"]) || "");

const resolveRoleTitle = (item) =>
  String(
    pick(item, ["role_title", "role", "designation", "job_title"]) ||
      pick(getMeta(item), ["role_title", "role"]) ||
      ""
  );

const resolveCTC = (item) =>
  String(pick(item, ["ctc", "package", "salary"]) || pick(getMeta(item), ["ctc"]) || "");

const resolveOfferDate = (item) => String(pick(item, ["offer_date"]) || "");
const resolveJoiningDate = (item) => String(pick(item, ["joining_date"]) || "");

const resolveImage = (item) => {
  const img =
    pick(item, ["user_image", "image", "user_image_url", "image_url", "photo_url", "profile_image_url"]) ||
    pick(item?.user, ["image", "photo_url", "image_url"]) ||
    "";
  return normalizeUrl(img);
};

const resolveUserUuid = (item) => {
  const u = String(
    pick(item, ["user_uuid"]) || pick(item?.user, ["uuid", "user_uuid"]) || ""
  ).trim();
  return looksLikeUuid(u) ? u : "";
};

const buildProfileUrl = (userUuid) => {
  const id = String(userUuid || "").trim();
  if (!id) return "#";
  return `${window.location.origin.replace(/\/+$/, "")}/user/profile/${encodeURIComponent(id)}`;
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

const renderLine = (label, value) => {
  const v = (value || "").toString().trim();
  if (!v) return null;
  return (
    <div className="psx-meta">
      {label}
      <span className="dot">•</span>
      {v}
    </div>
  );
};

const ensureFontAwesome = () => {
  if (document.querySelector('link[href*="font-awesome"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";
  document.head.appendChild(link);
};

const emptyStateSvg = (
  <div aria-hidden="true" style={{ width: "170px", maxWidth: "100%", margin: "0 auto 10px", display: "block", color: "var(--psx-brand)" }}>
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

export default function PlacedStudents() {
  const dispatch = useDispatch();

  const departments = useSelector(selectPlacedStudentsDepartments);
  const departmentStatus = useSelector(selectPlacedStudentsDepartmentsStatus);
  const departmentError = useSelector(selectPlacedStudentsDepartmentsError);

  const placedStudents = useSelector(selectPlacedStudentsItems);
  const placedStatus = useSelector(selectPlacedStudentsStatus);
  const placedError = useSelector(selectPlacedStudentsError);

  const [selectedDeptUuid, setSelectedDeptUuid] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [initialized, setInitialized] = useState(false);
  const [requestsStarted, setRequestsStarted] = useState(false);

  useEffect(() => {
    ensureFontAwesome();
    dispatch(fetchPlacedStudentsDepartments());
    dispatch(fetchPlacedStudentsList());
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

    if (departmentStatus === "loading" || placedStatus === "loading") return;

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
  }, [requestsStarted, initialized, departmentStatus, placedStatus, deptByUuid, deptBySlug]);

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
    departmentStatus === "loading" ||
    placedStatus === "loading" ||
    !requestsStarted ||
    !initialized;

  const filteredItems = useMemo(() => {
    let items = Array.isArray(placedStudents) ? placedStudents.slice() : [];

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
        const company = resolveCompany(item).toLowerCase();
        const role = resolveRoleTitle(item).toLowerCase();
        const ctc = resolveCTC(item).toLowerCase();
        const offer = resolveOfferDate(item).toLowerCase();
        const join = resolveJoiningDate(item).toLowerCase();

        return (
          name.includes(q) ||
          dept.includes(q) ||
          company.includes(q) ||
          role.includes(q) ||
          ctc.includes(q) ||
          offer.includes(q) ||
          join.includes(q)
        );
      });
    }

    return items;
  }, [placedStudents, selectedDeptUuid, selectedDeptId, searchQuery]);

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
    ? `Placed students for ${selectedDeptName}`
    : "Explore our recent placements.";

  const emptyMessage = selectedDeptUuid
    ? "No Placed Students found for this department."
    : "No Placed Students found.";

  return (
    <div className="psx-wrap">
      <style>{styles}</style>

      <div className="psx-head">
        <div>
          <h1 className="psx-title">
            <i className="fa-solid fa-user-graduate"></i>
            Placed Students
          </h1>
          <div className="psx-sub">{subtitle}</div>
        </div>

        <div className="psx-tools">
          <div className="psx-search">
            <i className="fa fa-magnifying-glass"></i>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              type="search"
              placeholder="Search (name, department, company, role, CTC)…"
            />
          </div>

          <div className="psx-select" title="Filter by department">
            <i className="fa-solid fa-building-columns psx-select__icon"></i>
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
            <i className="fa-solid fa-chevron-down psx-select__caret"></i>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="psx-skeleton">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="psx-sk"></div>
          ))}
        </div>
      ) : (departmentError || placedError) && !currentItems.length ? (
        <div className="psx-state">
          {emptyStateSvg}
          {emptyMessage}
        </div>
      ) : currentItems.length ? (
        <>
          <div className="psx-grid">
            {currentItems.map((item) => {
              const name = resolveName(item);
              const deptName = resolveDepartmentName(item);
              const company = resolveCompany(item);
              const role = resolveRoleTitle(item);
              const ctc = resolveCTC(item);
              const offerDate = fmtDate(resolveOfferDate(item));
              const joiningDate = fmtDate(resolveJoiningDate(item));
              const img = resolveImage(item);
              const userUuid = resolveUserUuid(item);
              const href = buildProfileUrl(userUuid);

              const metaLine =
                company || role ? (
                  <p className="psx-meta">
                    {company || "Company"}
                    {company && role ? <span className="dot">•</span> : null}
                    {role || ""}
                  </p>
                ) : (
                  <p className="psx-meta">{deptName ? deptName : "Placed Student"}</p>
                );

              const subParts = [];
              if (ctc) subParts.push(`CTC: ${ctc}`);
              if (offerDate) subParts.push(`Offer: ${offerDate}`);
              if (joiningDate) subParts.push(`Join: ${joiningDate}`);

              return (
                <a
                  key={userUuid || `${name}-${deptName}`}
                  className="psx-card"
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${name} profile`}
                >
                  {img ? (
                    <div
                      className="bg"
                      style={{ backgroundImage: `url('${escAttr(img)}')` }}
                    />
                  ) : (
                    <div className="psx-placeholder">
                      <div className="psx-initials">{initials(name)}</div>
                    </div>
                  )}

                  {deptName ? (
                    <div className="psx-pill" title={deptName}>
                      {deptName}
                    </div>
                  ) : null}

                  <div className="vignette"></div>

                  <div className="info">
                    <p className="psx-name">{name}</p>
                    {metaLine}
                    {subParts.length ? (
                      <p className="psx-submeta">
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
            <div className="psx-pagination">
              <div className="psx-pager">
                <button
                  className="psx-pagebtn"
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
                        className={`psx-pagebtn ${currentPage === 1 ? "active" : ""}`}
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
                        className={`psx-pagebtn ${currentPage === p ? "active" : ""}`}
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
                        className={`psx-pagebtn ${currentPage === lastPage ? "active" : ""}`}
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
                  className="psx-pagebtn"
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
        <div className="psx-state">
          {emptyStateSvg}
          {emptyMessage}
        </div>
      )}
    </div>
  );
}