import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router";
import {
  ALL_DEPTS,
  fetchPlacementOfficerIndex,
  fetchPlacementOfficerList,
  selectPlacementOfficerIndexRows,
  selectPlacementOfficerIndexStatus,
  selectPlacementOfficerIndexError,
  selectPlacementOfficerListItems,
  selectPlacementOfficerListStatus,
  selectPlacementOfficerListError,
  selectPlacementOfficerDeptName,
} from "../../redux/crm/placementOfficersSlice";

const PAGE_SIZE = 9;

const fmxStyles = String.raw`
  .fmx-wrap{
    --fmx-brand: var(--primary-color, #9E363A);
    --fmx-ink: #0f172a;
    --fmx-muted: #64748b;
    --fmx-card: var(--surface, #ffffff);
    --fmx-line: var(--line-soft, rgba(15,23,42,.10));
    --fmx-shadow: 0 10px 24px rgba(2,6,23,.08);
    --fmx-card-h: 250px;
    max-width: 1320px;
    margin: 18px auto 54px;
    padding: 0 12px;
    background: transparent;
    position: relative;
    overflow: visible;
  }

  .fmx-head{
    background: var(--fmx-card);
    border: 1px solid var(--fmx-line);
    border-radius: 16px;
    box-shadow: var(--fmx-shadow);
    padding: 14px 16px;
    margin-bottom: 16px;
    display:flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
  }
  .fmx-title{
    margin: 0;
    font-weight: 950;
    letter-spacing: .2px;
    color: var(--fmx-ink);
    font-size: 28px;
    display:flex;
    align-items:center;
    gap: 10px;
    white-space: nowrap;
  }
  .fmx-title i{ color: var(--fmx-brand); }
  .fmx-sub{margin: 6px 0 0;color: var(--fmx-muted);font-size: 14px;}

  .fmx-tools{display:flex;gap: 10px;align-items:center;flex-wrap: nowrap;}

  .fmx-search{position: relative;min-width: 260px;max-width: 520px;flex: 1 1 320px;}
  .fmx-search i{position:absolute;left: 14px;top: 50%;transform: translateY(-50%);opacity: .65;color: var(--fmx-muted);pointer-events:none;}
  .fmx-search input{width:100%;height: 42px;border-radius: 999px;padding: 11px 12px 11px 42px;border: 1px solid var(--fmx-line);background: var(--fmx-card);color: var(--fmx-ink);outline: none;}
  .fmx-search input:focus{border-color: rgba(201,75,80,.55);box-shadow: 0 0 0 4px rgba(201,75,80,.18);}

  .fmx-select{position: relative;min-width: 260px;max-width: 360px;flex: 0 1 320px;}
  .fmx-select__icon{position:absolute;left: 14px;top: 50%;transform: translateY(-50%);opacity: .70;color: var(--fmx-muted);pointer-events:none;font-size: 14px;}
  .fmx-select__caret{position:absolute;right: 14px;top: 50%;transform: translateY(-50%);opacity: .70;color: var(--fmx-muted);pointer-events:none;font-size: 12px;}
  .fmx-select select{width: 100%;height: 42px;border-radius: 999px;padding: 10px 38px 10px 42px;border: 1px solid var(--fmx-line);background: var(--fmx-card);color: var(--fmx-ink);outline: none;appearance: none;-webkit-appearance: none;-moz-appearance: none;}
  .fmx-select select:focus{border-color: rgba(201,75,80,.55);box-shadow: 0 0 0 4px rgba(201,75,80,.18);}

  .fmx-grid,
  .fmx-skeleton{max-width: 1040px;margin: 0 auto;}
  .fmx-grid{display:flex;flex-direction:column;gap: 18px;align-items: stretch;}

  .fmx-card{width:100%;position:relative;display:flex;flex-direction:column;border: 1px solid rgba(2,6,23,.08);border-radius: 16px;background: #fff;box-shadow: var(--fmx-shadow);overflow:hidden;transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;will-change: transform;cursor: pointer;outline: none;}
  .fmx-card:hover{transform: translateY(-2px);box-shadow: 0 16px 34px rgba(2,6,23,.12);border-color: rgba(158,54,58,.22);}
  .fmx-card:focus-visible{box-shadow: 0 0 0 4px rgba(201,75,80,.18), 0 16px 34px rgba(2,6,23,.12);border-color: rgba(201,75,80,.55);}

  .fmx-body{padding: 16px 16px 14px;display:flex;flex-direction:column;}
  .fmx-top{ display:flex; gap: 12px; align-items:flex-start; }

  .fmx-avatar{width: 64px;height: 64px;border-radius: 999px;flex: 0 0 64px;overflow:hidden;border: 3px solid #fff;box-shadow: 0 10px 22px rgba(2,6,23,.12);background: radial-gradient(140px 140px at 30% 20%, rgba(201,75,80,.16), transparent 60%), linear-gradient(180deg, rgba(0,0,0,.03), rgba(0,0,0,.06));position: relative;display:grid;place-items:center;}
  .fmx-avatar img{ width:100%; height:100%; object-fit: cover; display:block; }
  .fmx-initial{position:absolute; inset:0;display:grid; place-items:center;font-weight: 950;color: rgba(158,54,58,.95);font-size: 18px;letter-spacing:.5px;}
  .fmx-avatar.has-img .fmx-initial{ opacity:0; pointer-events:none; }

  .fmx-name{margin: 0;font-weight: 950;color: var(--fmx-ink);font-size: 18px;line-height: 1.25;text-transform: uppercase;display:-webkit-box;-webkit-line-clamp: 2;-webkit-box-orient: vertical;overflow:hidden;overflow-wrap:anywhere;word-break:break-word;}
  .fmx-desig{margin-top: 6px;color: #334155;font-size: 14px;font-weight: 800;display:-webkit-box;-webkit-line-clamp: 1;-webkit-box-orient: vertical;overflow:hidden;}

  .fmx-meta{ margin-top: 12px; display:grid; gap: 6px; }
  .fmx-line{ font-size: 14px; color: #334155; line-height: 1.55; overflow-wrap:anywhere; }
  .fmx-line b{ font-weight: 950; color: var(--fmx-ink); }

  .fmx-links{margin-top: 12px;display:flex;flex-direction:column;gap: 6px;font-size: 14px;}
  .fmx-links a{color: #1d4ed8;text-decoration: none;font-weight: 900;word-break: break-word;}
  .fmx-links a:hover{ text-decoration: underline; }

  .fmx-social{margin-top: 12px;display:flex;gap: 10px;flex-wrap: wrap;}
  .fmx-social a{width: 42px;height: 42px;border-radius: 999px;display:grid;place-items:center;background: var(--fmx-brand);color:#fff;border: 1px solid rgba(255,255,255,.18);box-shadow: 0 12px 22px rgba(143,47,47,.18);transition: transform .14s ease, filter .14s ease;text-decoration:none;}
  .fmx-social a:hover{ transform: translateY(-1px); filter: brightness(1.06); }
  .fmx-social a i{ color:#fff; font-size: 16px; line-height: 1; }

  .fmx-state{max-width: 1040px;margin: 0 auto;background: var(--fmx-card);border: 1px solid var(--fmx-line);border-radius: 16px;box-shadow: var(--fmx-shadow);padding: 18px;color: var(--fmx-muted);text-align:center;}

  .fmx-empty-ill{
    width: 170px;
    max-width: 100%;
    margin: 0 auto 10px;
    display: block;
    color: var(--fmx-brand);
  }
  .fmx-empty-ill svg{
    display:block;
    width:100%;
    height:auto;
  }

  .fmx-skeleton{display:flex;flex-direction:column;gap: 18px;}
  .fmx-sk{border-radius: 16px;border: 1px solid var(--fmx-line);background: #fff;overflow:hidden;position:relative;box-shadow: 0 10px 24px rgba(2,6,23,.08);height: var(--fmx-card-h);}
  .fmx-sk:before{content:'';position:absolute; inset:0;transform: translateX(-60%);background: linear-gradient(90deg, transparent, rgba(148,163,184,.22), transparent);animation: fmxSkMove 1.15s ease-in-out infinite;}
  @keyframes fmxSkMove{ to{ transform: translateX(60%);} }

  .fmx-pagination{display:flex;justify-content:center;margin-top: 18px;}
  .fmx-pagination .fmx-pager{display:flex;gap: 8px;flex-wrap: wrap;align-items:center;justify-content:center;padding: 10px;}
  .fmx-pagebtn{border:1px solid var(--fmx-line);background: var(--fmx-card);color: var(--fmx-ink);border-radius: 12px;padding: 9px 12px;font-size: 13px;font-weight: 950;box-shadow: 0 8px 18px rgba(2,6,23,.06);cursor:pointer;user-select:none;}
  .fmx-pagebtn:hover{ background: rgba(2,6,23,.03); }
  .fmx-pagebtn[disabled]{ opacity:.55; cursor:not-allowed; }
  .fmx-pagebtn.active{background: rgba(201,75,80,.12);border-color: rgba(201,75,80,.35);color: var(--fmx-brand);}

  @media (max-width: 640px){
    .fmx-head{ flex-wrap: wrap; align-items: flex-end; }
    .fmx-tools{ flex-wrap: wrap; }
    .fmx-title{ font-size: 24px; white-space: normal; }
    .fmx-search{ min-width: 220px; flex: 1 1 240px; }
    .fmx-select{ min-width: 220px; flex: 1 1 240px; }
    .fmx-grid, .fmx-skeleton, .fmx-state{ max-width: 100%; }
    .fmx-empty-ill{ width: 146px; }
  }

  .dynamic-navbar .navbar-nav .dropdown-menu{position: absolute !important;inset: auto !important;}
  .dynamic-navbar .dropdown-menu.is-portaled{position: fixed !important;}
`;

const clean = (value) => (value ?? "").toString().trim();

const pick = (obj, keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== null && v !== undefined && clean(v) !== "") return v;
  }
  return "";
};

const decodeMaybeJson = (value) => {
  if (value == null) return null;
  if (Array.isArray(value) || typeof value === "object") return value;

  try {
    return JSON.parse(String(value));
  } catch {
    return null;
  }
};

const toSlug = (value) =>
  clean(value)
    .toLowerCase()
    .replace(/\s+/g, "-");

const emptyStateIllustration = () => (
  <div className="fmx-empty-ill" aria-hidden="true">
    <svg viewBox="0 0 220 140" fill="none" xmlns="http://www.w3.org/2000/svg">
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

const normalizeUrl = (url) => {
  const u = clean(url);
  if (!u) return "";
  if (/^(data:|blob:|https?:\/\/|mailto:|tel:)/i.test(u)) return u;
  if (u.startsWith("//")) return `https:${u}`;
  if (u.startsWith("/")) return `${window.location.origin}${u}`;
  if (u.includes(".") && !u.includes(" ")) return `https://${u.replace(/^\/+/, "")}`;
  return `${window.location.origin}/${u.replace(/^\/+/, "")}`;
};

const initials = (name) => {
  const n = clean(name);
  if (!n) return "PO";
  return n
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
};

const formatQualification = (q) => {
  const arr = Array.isArray(q) ? q : decodeMaybeJson(q);
  if (!arr) return "";
  if (Array.isArray(arr) && arr.every((x) => typeof x === "string")) {
    return arr.join(", ");
  }

  const bits = (Array.isArray(arr) ? arr : [arr])
    .map((x) => x?.title || x?.degree || x?.name)
    .filter(Boolean);

  return bits.length ? bits.join(", ") : "";
};

const iconForPlatform = (platform) => {
  const p = clean(platform).toLowerCase();
  if (p.includes("linkedin")) return "fa-brands fa-linkedin-in";
  if (p.includes("google") || p.includes("scholar")) return "fa-solid fa-graduation-cap";
  if (p.includes("university") || p.includes("profile") || p.includes("college")) {
    return "fa-solid fa-building-columns";
  }
  if (p.includes("researchgate")) return "fa-brands fa-researchgate";
  if (p === "facebook" || p.includes("fb")) return "fa-brands fa-facebook-f";
  if (p.includes("instagram") || p.includes("insta")) return "fa-brands fa-instagram";
  if (p === "x" || p.includes("twitter")) return "fa-brands fa-x-twitter";
  if (p.includes("github")) return "fa-brands fa-github";
  if (p.includes("youtube")) return "fa-brands fa-youtube";
  return "fa-solid fa-link";
};

const normalizeFaIcon = (icon) => {
  const i = clean(icon);
  if (!i) return "";
  if (
    i.startsWith("fa-") &&
    !i.includes("fa-solid") &&
    !i.includes("fa-brands") &&
    !i.includes("fa-regular")
  ) {
    return `fa-brands ${i}`;
  }
  return i;
};

const getSocialLinks = (item) => {
  const socials = Array.isArray(item?.socials) ? item.socials : [];
  const meta = decodeMaybeJson(item?.metadata) || {};
  let items = [];

  if (socials.length) {
    items = socials.map((s) => ({
      url: clean(s?.url),
      icon: normalizeFaIcon(s?.icon) || iconForPlatform(s?.platform),
      title: clean(s?.platform || "Link"),
    }));
  } else {
    const pickUrl = (...keys) => {
      for (const k of keys) {
        const v = meta?.[k] ?? item?.[k];
        if (clean(v)) return v;
      }
      return "";
    };

    const add = (url, title, icon) => {
      const u = clean(url);
      if (!u) return;
      items.push({ url: u, title, icon });
    };

    add(pickUrl("linkedin", "linkedin_url", "linkedIn", "linkedinLink"), "LinkedIn", "fa-brands fa-linkedin-in");
    add(pickUrl("google_scholar", "scholar", "scholar_url", "google_scholar_url"), "Google Scholar", "fa-solid fa-graduation-cap");
    add(pickUrl("college_profile", "university_profile", "profile_url", "msit_profile", "institute_profile"), "Profile", "fa-solid fa-building-columns");
    add(pickUrl("facebook", "facebook_url", "fb", "fb_url"), "Facebook", "fa-brands fa-facebook-f");
    add(pickUrl("instagram", "instagram_url", "insta", "insta_url"), "Instagram", "fa-brands fa-instagram");
    add(pickUrl("twitter", "x", "twitter_url", "x_url"), "X", "fa-brands fa-x-twitter");
    add(pickUrl("github", "github_url"), "GitHub", "fa-brands fa-github");
    add(pickUrl("youtube", "youtube_url"), "YouTube", "fa-brands fa-youtube");
    add(pickUrl("researchgate", "researchgate_url"), "ResearchGate", "fa-brands fa-researchgate");
  }

  return items
    .map((x) => ({ ...x, url: normalizeUrl(x.url) }))
    .filter((x) => x.url);
};

const renderLine = (label, value) => {
  const v = clean(value);
  if (!v) return null;

  return (
    <div className="fmx-line">
      <b>{label}:</b> <span>{v}</span>
    </div>
  );
};

const ensureFontAwesome = () => {
  if (document.querySelector('link[data-fmx-fa="1"]')) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href =
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";
  link.setAttribute("data-fmx-fa", "1");
  document.head.appendChild(link);
};

const getPageItems = (currentPage, lastPage) => {
  const win = 2;
  const start = Math.max(1, currentPage - win);
  const end = Math.min(lastPage, currentPage + win);
  const nodes = [];

  if (start > 1) {
    nodes.push(1);
    if (start > 2) nodes.push("dots-start");
  }

  for (let p = start; p <= end; p += 1) nodes.push(p);

  if (end < lastPage) {
    if (end < lastPage - 1) nodes.push("dots-end");
    nodes.push(lastPage);
  }

  return nodes;
};

const buildViewPath = (item) => {
  const slug = clean(
    pick(item, ["__profile_slug", "slug", "user_slug", "profile_slug"]) ||
      item?.user?.slug
  );

  if (!slug) return "#";
  return `/user/profile/${encodeURIComponent(slug)}`;
};

export function PlacementOfficersContent() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const indexRows = useSelector(selectPlacementOfficerIndexRows);
  const indexStatus = useSelector(selectPlacementOfficerIndexStatus);
  const indexError = useSelector(selectPlacementOfficerIndexError);

  const listItems = useSelector(selectPlacementOfficerListItems);
  const listStatus = useSelector(selectPlacementOfficerListStatus);
  const listError = useSelector(selectPlacementOfficerListError);
  const deptNameFromStore = useSelector(selectPlacementOfficerDeptName);

  const [selectedDeptUuid, setSelectedDeptUuid] = useState(ALL_DEPTS);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    ensureFontAwesome();
    dispatch(fetchPlacementOfficerIndex());
  }, [dispatch]);

  const departments = useMemo(() => {
    return (indexRows || [])
      .filter((row) => String(row?.order?.active ?? 1) === "1")
      .map((row) => ({
        id: row?.department?.id ?? null,
        uuid: clean(row?.department?.uuid),
        slug: toSlug(row?.department?.slug || row?.department?.short_name),
        title: clean(row?.department?.title),
        count:
          parseInt(
            row?.order?.placement_officer_count ??
              row?.order?.officer_count ??
              row?.order?.placement_count ??
              row?.order?.count ??
              0,
            10
          ) || 0,
      }))
      .filter((dept) => dept.uuid && dept.slug && dept.title && dept.count > 0)
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [indexRows]);

  const deptByUuid = useMemo(
    () => new Map(departments.map((d) => [d.uuid, d])),
    [departments]
  );

  const deptBySlug = useMemo(
    () => new Map(departments.map((d) => [d.slug, d])),
    [departments]
  );

  useEffect(() => {
    if (indexStatus !== "succeeded" || initialized) return;

    const params = new URLSearchParams(location.search);
    const raw = clean(params.get("dept") || params.get("department")).toLowerCase();

    if (!raw) {
      setSelectedDeptUuid(ALL_DEPTS);
      setInitialized(true);
      return;
    }

    const matched = deptBySlug.get(raw) || deptByUuid.get(raw) || null;

    setSelectedDeptUuid(matched?.uuid || ALL_DEPTS);
    setInitialized(true);
  }, [indexStatus, initialized, location.search, deptBySlug, deptByUuid]);

  useEffect(() => {
    if (!initialized || indexStatus !== "succeeded") return;

    dispatch(fetchPlacementOfficerList({ deptUuid: selectedDeptUuid }));
    setPage(1);
  }, [initialized, selectedDeptUuid, indexStatus, dispatch]);

  useEffect(() => {
    if (!initialized) return;

    const url = new URL(window.location.href);

    if (selectedDeptUuid && selectedDeptUuid !== ALL_DEPTS) {
      const dept = deptByUuid.get(selectedDeptUuid);

      if (dept?.slug) {
        url.searchParams.set("dept", dept.slug);
        url.searchParams.delete("department");
      } else {
        url.searchParams.set("department", selectedDeptUuid);
        url.searchParams.delete("dept");
      }
    } else {
      url.searchParams.delete("dept");
      url.searchParams.delete("department");
    }

    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (nextUrl !== currentUrl) {
      window.history.replaceState({}, "", nextUrl);
    }
  }, [initialized, selectedDeptUuid, deptByUuid]);

  const loading =
    indexStatus === "loading" ||
    listStatus === "loading" ||
    (!initialized && indexStatus !== "failed");

  const error = indexError || listError;

  const subtitle =
    selectedDeptUuid === ALL_DEPTS
      ? "Showing placement officers from all departments."
      : `Placement officers of ${deptNameFromStore || "selected department"}`;

  const filteredItems = useMemo(() => {
    const q = clean(search).toLowerCase();
    if (!q) return listItems || [];

    return (listItems || []).filter((item) => {
      const name = clean(pick(item, ["name", "user_name", "title"])).toLowerCase();
      const desig = clean(
        pick(item, ["designation"]) ||
          decodeMaybeJson(item?.metadata)?.designation ||
          decodeMaybeJson(item?.metadata)?.role_title
      ).toLowerCase();

      const qual = formatQualification(item?.qualification).toLowerCase();
      const dept = clean(item?.__department_title).toLowerCase();

      return (
        name.includes(q) ||
        desig.includes(q) ||
        qual.includes(q) ||
        dept.includes(q)
      );
    });
  }, [listItems, search]);

  const lastPage = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, lastPage);

  useEffect(() => {
    if (page > lastPage) setPage(lastPage);
  }, [page, lastPage]);

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, currentPage]);

  const pagerItems = useMemo(
    () => getPageItems(currentPage, lastPage),
    [currentPage, lastPage]
  );

  const handleDeptChange = (e) => {
    setSearch("");
    setSelectedDeptUuid(e.target.value);
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const emptyMessage =
    selectedDeptUuid === ALL_DEPTS
      ? "No placement officers found."
      : "No placement officer found for this department.";

  const cardNavigate = (path) => {
    if (!path || path === "#") return;
    navigate(path);
  };

  return (
    <div className="fmx-wrap">
      <style>{fmxStyles}</style>

      <div className="fmx-head">
        <div>
          <h1 className="fmx-title">
            <i className="fa-solid fa-users"></i>
            Placement Officers
          </h1>
          <div className="fmx-sub">{subtitle}</div>
        </div>

        <div className="fmx-tools">
          <div className="fmx-search">
            <i className="fa fa-magnifying-glass"></i>
            <input
              value={search}
              onChange={handleSearchChange}
              type="search"
              placeholder="Search placement officer (name/designation/qualification)…"
            />
          </div>

          <div className="fmx-select" title="Filter by department">
            <i className="fa-solid fa-building-columns fmx-select__icon"></i>
            <select
              value={selectedDeptUuid}
              onChange={handleDeptChange}
              aria-label="Filter by department"
            >
              <option value={ALL_DEPTS}>All Departments</option>
              {departments.map((dept) => (
                <option key={dept.uuid} value={dept.uuid}>
                  {dept.title}
                </option>
              ))}
            </select>
            <i className="fa-solid fa-chevron-down fmx-select__caret"></i>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="fmx-skeleton">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="fmx-sk"></div>
          ))}
        </div>
      ) : error ? (
        <div className="fmx-state">
          <div style={{ fontSize: "34px", opacity: 0.6, marginBottom: "6px" }}>
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          Placement officer list is not available right now.
        </div>
      ) : currentItems.length ? (
        <>
          <div className="fmx-grid">
            {currentItems.map((item, idx) => {
              const path = buildViewPath(item);

              const key =
                clean(pick(item, ["user_uuid", "uuid", "__profile_slug"])) ||
                `${clean(pick(item, ["name", "user_name", "title"]))}-${idx}`;

              const name =
                pick(item, ["name", "user_name", "title"]) || "Placement Officer";

              const desig =
                pick(item, ["designation"]) ||
                decodeMaybeJson(item?.metadata)?.designation ||
                decodeMaybeJson(item?.metadata)?.role_title ||
                "Placement Officer";

              const qualification = formatQualification(item?.qualification);
              const specification = clean(pick(item, ["specification"]));
              const experience = clean(pick(item, ["experience"]));
              const interest = clean(pick(item, ["interest"]));
              const administration = clean(pick(item, ["administration"]));
              const research = clean(pick(item, ["research_project"]));
              const deptLineTitle = clean(item?.__department_title);

              const meta = decodeMaybeJson(item?.metadata) || {};
              const email = clean(pick(item, ["email"]) || meta.email);
              const website = clean(pick(item, ["website"]) || meta.website);

              const img = normalizeUrl(pick(item, ["image_full_url", "image"]));
              const ini = initials(name);
              const socialLinks = getSocialLinks(item);

              return (
                <article
                  key={key}
                  className="fmx-card"
                  tabIndex={0}
                  role="link"
                  aria-label={`${name} profile`}
                  onClick={() => cardNavigate(path)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      cardNavigate(path);
                    }
                  }}
                >
                  <div className="fmx-body">
                    <div className="fmx-top">
                      <div className={`fmx-avatar ${img ? "has-img" : ""}`}>
                        <div className="fmx-initial">{ini}</div>

                        {img ? (
                          <img
                            className="fmx-img"
                            src={img}
                            alt={name}
                            loading="lazy"
                            decoding="async"
                            onLoad={(e) => {
                              const avatar =
                                e.currentTarget.closest(".fmx-avatar");
                              if (avatar) avatar.classList.add("has-img");
                            }}
                            onError={(e) => {
                              const avatar =
                                e.currentTarget.closest(".fmx-avatar");
                              if (avatar) avatar.classList.remove("has-img");
                              e.currentTarget.remove();
                            }}
                          />
                        ) : null}
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h3 className="fmx-name">{name}</h3>
                        <div className="fmx-desig">{desig}</div>
                      </div>
                    </div>

                    <div className="fmx-meta">
                      {selectedDeptUuid === ALL_DEPTS
                        ? renderLine("Department", deptLineTitle)
                        : null}
                      {renderLine("Qualification", qualification)}
                      {renderLine("Specification", specification)}
                      {renderLine("Experience", experience)}
                      {renderLine("Interest", interest)}
                      {renderLine("Administration", administration)}
                      {renderLine("Research Project", research)}
                    </div>

                    <div className="fmx-links">
                      {email ? (
                        <div>
                          <b>Email:</b>{" "}
                          <a
                            href={`mailto:${email}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {email}
                          </a>
                        </div>
                      ) : null}

                      {website ? (
                        <div>
                          <b>Website:</b>{" "}
                          <a
                            href={normalizeUrl(website)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {website}
                          </a>
                        </div>
                      ) : null}
                    </div>

                    {socialLinks.length ? (
                      <div className="fmx-social">
                        {socialLinks.map((social, socialIdx) => (
                          <a
                            key={`${social.title}-${socialIdx}`}
                            href={social.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={social.title}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <i className={social.icon}></i>
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>

          {lastPage > 1 ? (
            <div className="fmx-pagination">
              <div className="fmx-pager">
                <button
                  className="fmx-pagebtn"
                  disabled={currentPage <= 1}
                  onClick={() => {
                    setPage(Math.max(1, currentPage - 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Previous
                </button>

                {pagerItems.map((item, idx) =>
                  typeof item === "number" ? (
                    <button
                      key={`${item}-${idx}`}
                      className={`fmx-pagebtn ${
                        currentPage === item ? "active" : ""
                      }`}
                      onClick={() => {
                        setPage(item);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      {item}
                    </button>
                  ) : (
                    <span
                      key={`${item}-${idx}`}
                      style={{ opacity: 0.6, padding: "0 4px" }}
                    >
                      …
                    </span>
                  )
                )}

                <button
                  className="fmx-pagebtn"
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
        <div className="fmx-state">
          {emptyStateIllustration()}
          {emptyMessage}
        </div>
      )}
    </div>
  );
}

export default PlacementOfficersContent;