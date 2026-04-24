import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Footer from "../components/Footer";
import HeaderMenu from "../components/HeaderMenu";
import MainHeader from "../components/MainHeader";
import TopHeaderMenu from "../components/TopHeaderMenu";
import {
  fetchRecruiters,
  selectRecruiters,
} from "../../redux/recruitersSlice";

const normalizeUrl = (url) => {
  const u = String(url || "").trim();
  if (!u) return "";
  if (/^(data:|blob:|https?:\/\/)/i.test(u)) return u;
  if (u.startsWith("//")) return `https:${u}`;
  if (u.startsWith("/")) return `${window.location.origin}${u}`;
  if (u.includes(".") && !u.includes(" ")) {
    return `https://${u.replace(/^\/+/, "")}`;
  }
  return `${window.location.origin}/${u.replace(/^\/+/, "")}`;
};

const stripHtml = (html) => {
  const raw = String(html || "")
    .replace(/<\s*br\s*\/?>/gi, " ")
    .replace(/<\/\s*(p|div|li|h[1-6]|tr|td|th|section|article)\s*>/gi, "$& ")
    .replace(/<\s*(p|div|li|h[1-6]|tr|td|th|section|article)\b[^>]*>/gi, " ");
  const div = document.createElement("div");
  div.innerHTML = raw;
  return (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
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

const pickMeta = (item, keys) => {
  const meta =
    item && typeof item === "object" && item.metadata && typeof item.metadata === "object"
      ? item.metadata
      : {};
  return pick(meta, keys);
};

const pickLogo = (item) =>
  pick(item, [
    "logo_url_full",
    "logo_url",
    "image_url",
    "image_full_url",
    "logo",
    "image",
    "src",
    "url",
  ]) ||
  pickMeta(item, [
    "logo_url_full",
    "logo_url",
    "logo",
    "image",
    "src",
    "url",
  ]) ||
  item?.attachment?.url ||
  "";

const formatDate = (value) => {
  if (!value) return "—";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return String(value);
  }
};

const formatNumber = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const n =
    typeof value === "number"
      ? value
      : parseFloat(String(value).replace(/[^\d.\-]/g, ""));
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString();
};

export default function RecruitersPage() {
  const dispatch = useDispatch();

  const items = useSelector(selectRecruiters);
  const loading = useSelector((state) => state.recruiters?.loading ?? false);
  const error = useSelector((state) => state.recruiters?.error ?? null);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [activeItem, setActiveItem] = useState(null);

  useEffect(() => {
    dispatch(fetchRecruiters());
  }, [dispatch]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    if (!activeItem) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [activeItem]);

  const filteredItems = useMemo(() => {
    const list = Array.isArray(items) ? [...items] : [];
    const q = query.trim().toLowerCase();

    if (!q) return list;

    return list.filter((item) => {
      const name = String(pick(item, ["name", "title", "company", "label"]) || "").toLowerCase();
      const industry = String(
        pick(item, ["industry", "sector", "category"]) ||
          pickMeta(item, ["industry", "sector", "category"]) ||
          ""
      ).toLowerCase();
      const location = String(
        pick(item, ["location", "city", "country", "headquarters", "hq"]) ||
          pickMeta(item, ["hq", "location", "city", "country", "headquarters"]) ||
          ""
      ).toLowerCase();
      const desc = stripHtml(
        pick(item, ["description", "about", "summary", "content", "details", "body"]) || ""
      ).toLowerCase();

      return (
        name.includes(q) ||
        industry.includes(q) ||
        location.includes(q) ||
        desc.includes(q)
      );
    });
  }, [items, query]);

  const perPage = 24;
  const lastPage = Math.max(1, Math.ceil(filteredItems.length / perPage));
  const safePage = Math.min(page, lastPage);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return filteredItems.slice(start, start + perPage);
  }, [filteredItems, safePage]);

  useEffect(() => {
    if (page > lastPage) {
      setPage(lastPage);
    }
  }, [page, lastPage]);

  const paginationItems = useMemo(() => {
    const result = [];
    const windowSize = 2;
    const start = Math.max(1, safePage - windowSize);
    const end = Math.min(lastPage, safePage + windowSize);

    result.push({ type: "prev", page: Math.max(1, safePage - 1), disabled: safePage <= 1 });

    if (start > 1) {
      result.push({ type: "page", page: 1, active: safePage === 1 });
      if (start > 2) result.push({ type: "ellipsis-1" });
    }

    for (let p = start; p <= end; p += 1) {
      result.push({ type: "page", page: p, active: p === safePage });
    }

    if (end < lastPage) {
      if (end < lastPage - 1) result.push({ type: "ellipsis-2" });
      result.push({ type: "page", page: lastPage, active: safePage === lastPage });
    }

    result.push({
      type: "next",
      page: Math.min(lastPage, safePage + 1),
      disabled: safePage >= lastPage,
    });

    return result;
  }, [safePage, lastPage]);

  const modalData = useMemo(() => {
    if (!activeItem) return null;

    const name = String(
      pick(activeItem, ["name", "title", "company", "label"]) || "Company"
    ).trim();

    const description = stripHtml(
      pick(activeItem, ["description", "about", "summary", "content", "details", "body"]) || ""
    );

    const logoRaw = pickLogo(activeItem);
    const logo = logoRaw ? normalizeUrl(logoRaw) : "";

    const websiteRaw =
      pick(activeItem, ["website", "link", "web_url", "site", "company_url"]) ||
      pickMeta(activeItem, ["website", "link", "web_url", "site", "company_url"]);
    const website = websiteRaw ? normalizeUrl(websiteRaw) : "";

    const department =
      pick(activeItem, ["department_title", "department", "dept_title"]) || "—";

    const industry =
      pick(activeItem, ["industry", "sector", "category"]) ||
      pickMeta(activeItem, ["industry", "sector", "category"]) ||
      "—";

    const location =
      pick(activeItem, ["location", "city", "country", "headquarters", "hq"]) ||
      pickMeta(activeItem, ["hq", "location", "city", "country", "headquarters"]) ||
      "—";

    const hired =
      pick(activeItem, ["students_hired", "hired_count", "placements"]) ||
      pickMeta(activeItem, ["students_hired", "hired_count", "placements"]) ||
      "";

    const createdAt = pick(activeItem, ["created_at", "date_added", "joined_date"]) || "";
    const updatedAt = pick(activeItem, ["updated_at", "last_updated"]) || "";

    const roles = Array.isArray(activeItem?.job_roles_json)
      ? activeItem.job_roles_json
      : [];

    return {
      name,
      description,
      logo,
      website,
      department,
      industry,
      location,
      hired,
      createdAt,
      updatedAt,
      roles,
    };
  }, [activeItem]);

  const showLoading = loading && !items.length;

  return (
    <>
      <TopHeaderMenu />
      <MainHeader />
      <HeaderMenu />

      <main className="bg-[var(--surface,#f6f7fb)] py-6 sm:py-8">
        <div className="orc-wrap orc-scope">
          <div className="orc-head">
            <div>
              <h1 className="orc-title">
                <i className="fa-solid fa-building" />
                Our Recruiters
              </h1>
              <div className="orc-sub">
                Companies that recruit from our campus
              </div>
            </div>

            <div className="orc-tools">
              <div className="orc-search">
                <i className="fa fa-magnifying-glass" />
                <input
                  type="search"
                  placeholder="Search recruiters (name/industry/location)…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {showLoading ? (
            <div className="orc-skeleton">
              {Array.from({ length: 18 }).map((_, idx) => (
                <div className="orc-sk-tile" key={idx} />
              ))}
            </div>
          ) : error ? (
            <div className="orc-state">Failed to load recruiters.</div>
          ) : !pageItems.length ? (
            <div className="orc-state">
              <div style={{ fontSize: "34px", opacity: 0.6, marginBottom: 6 }}>
                <i className="fa-regular fa-face-frown" />
              </div>
              No recruiters found.
            </div>
          ) : (
            <>
              <div className="orc-grid">
                {pageItems.map((item, idx) => {
                  const key = item?.uuid || item?.id || `idx_${idx}`;
                  const name =
                    item?.name || item?.title || item?.company || item?.label || "Recruiter";

                  const rawLogo = pickLogo(item);
                  const logo = rawLogo ? normalizeUrl(rawLogo) : "";

                  return (
                    <button
                      type="button"
                      className="orc-tile"
                      key={key}
                      onClick={() => setActiveItem(item)}
                      aria-label={`View ${name} details`}
                    >
                      <span className="orc-tile__inner">
                        <span
                          className="orc-tile__fallback"
                          style={{ display: logo ? "none" : "flex" }}
                        >
                          {name}
                        </span>

                        {logo ? (
                          <img
                            className="orc-logo"
                            src={logo}
                            alt={name}
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.remove();
                              const fallback =
                                e.currentTarget.parentElement?.querySelector(
                                  ".orc-tile__fallback"
                                );
                              if (fallback) fallback.style.display = "flex";
                            }}
                          />
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>

              {lastPage > 1 ? (
                <div className="orc-pagination">
                  <div className="orc-pager">
                    {paginationItems.map((item, idx) => {
                      if (item.type.startsWith("ellipsis")) {
                        return (
                          <span key={idx} style={{ opacity: 0.6, padding: "0 4px" }}>
                            …
                          </span>
                        );
                      }

                      const label =
                        item.type === "prev"
                          ? "Previous"
                          : item.type === "next"
                          ? "Next"
                          : String(item.page);

                      return (
                        <button
                          key={`${item.type}-${item.page}-${idx}`}
                          type="button"
                          className={`orc-pagebtn ${item.active ? "active" : ""}`}
                          disabled={item.disabled}
                          onClick={() => {
                            if (item.disabled) return;
                            setPage(item.page);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </main>

      <Footer />

      {modalData ? (
        <div
          className="orc-modal show orc-scope"
          aria-hidden="false"
          role="dialog"
          aria-modal="true"
          aria-labelledby="recModalTitle"
          aria-describedby="recModalDesc"
        >
          <div className="orc-modal__backdrop" onClick={() => setActiveItem(null)} />

          <div className="orc-modal__dialog" role="document">
            <div className="orc-modal__header">
              <h3 id="recModalTitle" className="orc-modal__title">
                {modalData.name}
              </h3>

              <button
                type="button"
                className="orc-modal__close"
                aria-label="Close modal"
                onClick={() => setActiveItem(null)}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="orc-modal__body">
              <div className="orc-modal__logo-container">
                <div className="orc-modal__logo">
                  {modalData.logo ? (
                    <img loading="lazy" decoding="async"
                      src={modalData.logo}
                      alt={`${modalData.name} Logo`}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="orc-modal__logo-fallback">
                      <i className="fa-solid fa-building" />
                    </div>
                  )}
                </div>

                <div className="orc-modal__info-item">
                  <i className="fa-solid fa-calendar" />
                  <span className="orc-modal__info-label">Added</span>
                  <span className="orc-modal__info-value">
                    {formatDate(modalData.createdAt)}
                  </span>
                </div>
              </div>

              <div className="orc-modal__details">
                <div className="orc-modal__section">
                  <div className="orc-modal__section-title">
                    <i className="fa-solid fa-circle-info" />
                    About Company
                  </div>

                  <div id="recModalDesc" className="orc-modal__description">
                    {modalData.description ? (
                      <p>{modalData.description}</p>
                    ) : (
                      <p style={{ color: "var(--orc-muted)", fontStyle: "italic" }}>
                        No description available.
                      </p>
                    )}
                  </div>
                </div>

                <div className="orc-modal__section">
                  <div className="orc-modal__section-title">
                    <i className="fa-solid fa-briefcase" />
                    Job Roles
                  </div>

                  <div className="orc-modal__description" style={{ maxHeight: 220 }}>
                    {modalData.roles.length ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {modalData.roles.map((role, idx) => (
                          <div
                            key={idx}
                            style={{
                              border: "1px solid var(--orc-line)",
                              borderRadius: 12,
                              padding: "10px 12px",
                              background: "rgba(2,6,23,.02)",
                            }}
                          >
                            <div style={{ fontWeight: 900, color: "var(--orc-ink)" }}>
                              {role?.role || "—"}
                            </div>
                            <div
                              style={{
                                marginTop: 2,
                                color: "var(--orc-muted)",
                                fontSize: 13,
                              }}
                            >
                              CTC:{" "}
                              <b style={{ color: "var(--orc-ink)" }}>
                                {role?.ctc || "—"}
                              </b>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: "var(--orc-muted)", fontStyle: "italic" }}>
                        No roles available.
                      </p>
                    )}
                  </div>
                </div>

                <div className="orc-modal__info-grid">
                  <div className="orc-modal__info-item">
                    <i className="fa-solid fa-building-columns" />
                    <span className="orc-modal__info-label">Department</span>
                    <span className="orc-modal__info-value">{modalData.department}</span>
                  </div>

                  <div className="orc-modal__info-item">
                    <i className="fa-solid fa-industry" />
                    <span className="orc-modal__info-label">Industry</span>
                    <span className="orc-modal__info-value">{modalData.industry}</span>
                  </div>

                  <div className="orc-modal__info-item">
                    <i className="fa-solid fa-location-dot" />
                    <span className="orc-modal__info-label">HQ</span>
                    <span className="orc-modal__info-value">{modalData.location}</span>
                  </div>

                  <div className="orc-modal__info-item">
                    <i className="fa-solid fa-users" />
                    <span className="orc-modal__info-label">Hired</span>
                    <span className="orc-modal__info-value">
                      {modalData.hired !== "" ? formatNumber(modalData.hired) : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="orc-modal__footer">
              <div className="orc-modal__footer-left">
                <i className="fa-solid fa-clock" />
                <span>
                  Last updated: <span>{formatDate(modalData.updatedAt)}</span>
                </span>
              </div>

              <div className="orc-modal__footer-right">
                {modalData.website ? (
                  <a
                    className="orc-modal__btn primary"
                    href={modalData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="fa-solid fa-external-link" />
                    Visit Website
                  </a>
                ) : null}

                <button
                  type="button"
                  className="orc-modal__btn secondary"
                  onClick={() => setActiveItem(null)}
                >
                  <i className="fa-solid fa-xmark" />
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <style>{`
        .orc-scope{
          --orc-brand: var(--primary-color, #8f2f2f);
          --orc-ink: var(--ink, #0f172a);
          --orc-muted: var(--muted-color, #64748b);
          --orc-bg: var(--page-bg, #ffffff);
          --orc-card: var(--surface, #ffffff);
          --orc-line: var(--line-soft, rgba(15, 23, 42, .10));
          --orc-shadow: var(--shadow-2, 0 10px 24px rgba(2, 6, 23, .08));
        }

        .orc-wrap{
          max-width: 1320px;
          margin: 0 auto;
          padding: 0 12px;
          background: transparent;
          position: relative;
          overflow: visible;
        }

        .orc-head{
          background: var(--orc-card);
          border: 1px solid var(--orc-line);
          border-radius: 16px;
          box-shadow: var(--orc-shadow);
          padding: 14px 16px;
          margin-bottom: 16px;
          display:flex;
          gap:12px;
          align-items:center;
          justify-content:space-between;
          flex-wrap:nowrap;
        }

        .orc-head > div:first-child{ flex: 0 0 auto; }

        .orc-title{
          margin:0;
          font-weight:950;
          letter-spacing:.2px;
          color:var(--orc-ink);
          font-size:28px;
          display:flex;
          align-items:center;
          gap:10px;
        }

        .orc-title i{ color:var(--orc-brand); }

        .orc-sub{
          margin:6px 0 0;
          color:var(--orc-muted);
          font-size:14px;
        }

        .orc-tools{
          display:flex;
          gap:10px;
          align-items:center;
          flex-wrap:nowrap;
          justify-content:flex-end;
          flex:1 1 auto;
        }

        .orc-search{
          position:relative;
          min-width:260px;
          max-width:520px;
          flex:1 1 320px;
        }

        .orc-search i{
          position:absolute;
          left:14px;
          top:50%;
          transform:translateY(-50%);
          opacity:.65;
          color:var(--orc-muted);
          pointer-events:none;
        }

        .orc-search input{
          width:100%;
          height:42px;
          border-radius:999px;
          padding:11px 12px 11px 42px;
          border:1px solid var(--orc-line);
          background:var(--orc-card);
          color:var(--orc-ink);
          outline:none;
        }

        .orc-search input:focus{
          border-color:rgba(201,75,80,.55);
          box-shadow:0 0 0 4px rgba(201,75,80,.18);
        }

        .orc-grid{
          display:grid;
          grid-template-columns:repeat(9, minmax(0,1fr));
          align-items:start;
          gap:0;
        }

        .orc-tile{
          margin:0;
          border-radius:12px;
          overflow:hidden;
          background:#fff;
          border:1px solid rgba(15,23,42,.06);
          box-shadow:0 1px 3px rgba(2,6,23,.06), 0 6px 12px rgba(2,6,23,.04);
          cursor:pointer;
          transition:all .2s cubic-bezier(0.4, 0, 0.2, 1);
          height:110px;
          grid-column:span 1;
          position:relative;
          outline:none;
          text-decoration:none;
          padding:0;
        }

        .orc-tile:nth-child(12n + 2),
        .orc-tile:nth-child(12n + 4),
        .orc-tile:nth-child(12n + 6),
        .orc-tile:nth-child(12n + 7),
        .orc-tile:nth-child(12n + 9),
        .orc-tile:nth-child(12n + 11){
          grid-column:span 2;
        }

        .orc-tile:hover,
        .orc-tile:focus{
          transform:translateY(-3px);
          box-shadow:0 4px 6px rgba(2, 6, 23, .08), 0 16px 28px rgba(2, 6, 23, .12);
          border-color:rgba(143, 47, 47, .20);
        }

        .orc-tile__inner{
          display:block;
          width:100%;
          height:100%;
          background:#fff;
        }

        .orc-tile img{
          width:100%;
          height:100%;
          object-fit:contain;
          object-position:center;
          display:block;
          padding:8px;
        }

        .orc-tile__fallback{
          height:100%;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:14px 12px;
          color:#64748b;
          font-weight:900;
          font-size:14px;
          text-align:center;
        }

        .orc-skeleton{
          display:grid;
          gap:14px;
          grid-template-columns:repeat(12, minmax(0,1fr));
        }

        .orc-sk-tile{
          --w:2;
          grid-column:span var(--w);
          background:#fff;
          border:1px solid var(--orc-line);
          box-shadow:var(--orc-shadow);
          border-radius:18px;
          overflow:hidden;
          position:relative;
          height:110px;
        }

        .orc-sk-tile:before{
          content:'';
          position:absolute;
          inset:0;
          transform:translateX(-60%);
          background:linear-gradient(90deg, transparent, rgba(148,163,184,.22), transparent);
          animation:orcSkMove 1.15s ease-in-out infinite;
        }

        @keyframes orcSkMove{
          to{ transform:translateX(60%); }
        }

        .orc-sk-tile:nth-child(6n + 1){ --w:1; }
        .orc-sk-tile:nth-child(6n + 2){ --w:2; }
        .orc-sk-tile:nth-child(6n + 3){ --w:1; }
        .orc-sk-tile:nth-child(6n + 4){ --w:2; }
        .orc-sk-tile:nth-child(6n + 5){ --w:3; }
        .orc-sk-tile:nth-child(6n + 6){ --w:3; }

        .orc-state{
          background:var(--orc-card);
          border:1px solid var(--orc-line);
          border-radius:16px;
          box-shadow:var(--orc-shadow);
          padding:18px;
          color:var(--orc-muted);
          text-align:center;
        }

        .orc-pagination{
          display:flex;
          justify-content:center;
          margin-top:18px;
        }

        .orc-pager{
          display:flex;
          gap:8px;
          flex-wrap:wrap;
          align-items:center;
          justify-content:center;
          padding:10px;
        }

        .orc-pagebtn{
          border:1px solid var(--orc-line);
          background:var(--orc-card);
          color:var(--orc-ink);
          border-radius:12px;
          padding:9px 12px;
          font-size:13px;
          font-weight:950;
          box-shadow:0 8px 18px rgba(2,6,23,.06);
          cursor:pointer;
          user-select:none;
        }

        .orc-pagebtn:hover{ background:rgba(2,6,23,.03); }
        .orc-pagebtn[disabled]{ opacity:.55; cursor:not-allowed; }

        .orc-pagebtn.active{
          background:rgba(201,75,80,.12);
          border-color:rgba(201,75,80,.35);
          color:var(--orc-brand);
        }

        .orc-modal{
          position:fixed;
          inset:0;
          z-index:9999;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:16px;
          opacity:1;
        }

        .orc-modal__backdrop{
          position:absolute;
          inset:0;
          background:rgba(2, 6, 23, 0.88);
          backdrop-filter:blur(4px);
        }

        .orc-modal__dialog{
          position:relative;
          width:min(800px, 100%);
          max-height:90vh;
          background:var(--orc-card);
          border:1px solid var(--orc-line);
          border-radius:20px;
          box-shadow:0 24px 64px rgba(2, 6, 23, 0.35);
          overflow:hidden;
          transform:translateY(0) scale(1);
          display:flex;
          flex-direction:column;
          animation:orcModalSlideUp .3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes orcModalSlideUp{
          from { transform: translateY(20px) scale(0.98); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }

        .orc-modal__header{
          padding:18px 24px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:16px;
          border-bottom:1px solid var(--orc-line);
          background:rgba(255,255,255,0.95);
          backdrop-filter:blur(8px);
          position:sticky;
          top:0;
          z-index:10;
        }

        .orc-modal__title{
          margin:0;
          font-size:20px;
          font-weight:950;
          color:var(--orc-ink);
          letter-spacing:-0.2px;
          line-height:1.3;
          display:-webkit-box;
          -webkit-line-clamp:2;
          -webkit-box-orient:vertical;
          overflow:hidden;
        }

        .orc-modal__close{
          border:none;
          background:rgba(2,6,23,0.04);
          width:40px;
          height:40px;
          border-radius:12px;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          color:var(--orc-muted);
          transition:all .2s ease;
          flex-shrink:0;
        }

        .orc-modal__close:hover{
          background:rgba(201,75,80,0.12);
          color:var(--orc-brand);
          transform:rotate(90deg);
        }

        .orc-modal__body{
          padding:24px;
          display:grid;
          grid-template-columns:140px 1fr;
          gap:24px;
          align-items:start;
          overflow-y:auto;
          flex:1;
        }

        .orc-modal__logo-container{
          display:flex;
          flex-direction:column;
          gap:12px;
        }

        .orc-modal__logo{
          width:140px;
          height:140px;
          border:1px solid var(--orc-line);
          border-radius:20px;
          background:#fff;
          display:flex;
          align-items:center;
          justify-content:center;
          overflow:hidden;
          padding:16px;
          box-shadow:0 12px 32px rgba(2, 6, 23, 0.1);
        }

        .orc-modal__logo img{
          max-width:100%;
          max-height:100%;
          object-fit:contain;
          display:block;
        }

        .orc-modal__logo-fallback{
          display:flex;
          align-items:center;
          justify-content:center;
          width:100%;
          height:100%;
          color:var(--orc-muted);
          font-weight:900;
          font-size:42px;
          opacity:.6;
        }

        .orc-modal__details{
          display:flex;
          flex-direction:column;
          gap:20px;
        }

        .orc-modal__section{
          display:flex;
          flex-direction:column;
          gap:8px;
        }

        .orc-modal__section-title{
          font-size:12px;
          font-weight:900;
          text-transform:uppercase;
          letter-spacing:.5px;
          color:var(--orc-brand);
          opacity:.8;
          display:flex;
          align-items:center;
          gap:6px;
        }

        .orc-modal__description{
          color:var(--orc-ink);
          font-size:15px;
          line-height:1.6;
          max-height:300px;
          overflow-y:auto;
          padding-right:8px;
        }

        .orc-modal__description p{
          margin:0 0 12px 0;
        }

        .orc-modal__description p:last-child{
          margin-bottom:0;
        }

        .orc-modal__info-grid{
          display:grid;
          grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));
          gap:12px;
          margin-top:4px;
        }

        .orc-modal__info-item{
          display:flex;
          align-items:center;
          gap:8px;
          padding:8px 12px;
          background:rgba(2,6,23,.02);
          border-radius:10px;
          border:1px solid var(--orc-line);
        }

        .orc-modal__info-item i{
          color:var(--orc-brand);
          opacity:.8;
          font-size:14px;
          width:16px;
        }

        .orc-modal__info-label{
          font-size:13px;
          font-weight:600;
          color:var(--orc-muted);
          white-space:nowrap;
        }

        .orc-modal__info-value{
          font-size:13px;
          font-weight:700;
          color:var(--orc-ink);
          margin-left:auto;
        }

        .orc-modal__footer{
          padding:18px 24px;
          border-top:1px solid var(--orc-line);
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          flex-wrap:wrap;
          background:rgba(255,255,255,0.95);
          backdrop-filter:blur(8px);
          position:sticky;
          bottom:0;
        }

        .orc-modal__footer-left{
          display:flex;
          align-items:center;
          gap:8px;
          color:var(--orc-muted);
          font-size:13px;
        }

        .orc-modal__footer-right{
          display:flex;
          align-items:center;
          gap:10px;
        }

        .orc-modal__btn{
          border:1px solid var(--orc-line);
          background:var(--orc-card);
          color:var(--orc-ink);
          border-radius:12px;
          padding:10px 16px;
          font-size:14px;
          font-weight:700;
          cursor:pointer;
          box-shadow:0 8px 20px rgba(2,6,23,.08);
          text-decoration:none;
          display:inline-flex;
          align-items:center;
          gap:8px;
          transition:all .2s ease;
          min-height:42px;
        }

        .orc-modal__btn:hover{
          background:rgba(2,6,23,.03);
          transform:translateY(-1px);
          box-shadow:0 12px 24px rgba(2,6,23,.12);
        }

        .orc-modal__btn.primary{
          background:linear-gradient(135deg, rgba(201,75,80,0.15), rgba(201,75,80,0.08));
          border-color:rgba(201,75,80,0.35);
          color:var(--orc-brand);
          font-weight:800;
        }

        .orc-modal__btn.secondary{
          background:rgba(2,6,23,0.02);
          border-color:rgba(2,6,23,0.08);
        }

        @media (max-width: 992px){
          .orc-head{ flex-wrap:wrap; align-items:flex-end; }
          .orc-tools{ flex-wrap:wrap; justify-content:flex-start; }
          .orc-grid, .orc-skeleton{ grid-template-columns:repeat(6, minmax(0,1fr)); }
          .orc-tile, .orc-sk-tile{ grid-column:span 3; }
        }

        @media (max-width: 768px){
          .orc-grid{ grid-template-columns:repeat(3, minmax(0,1fr)); }
          .orc-wrap{ padding:0 10px; }
          .orc-title{ font-size:24px; }
          .orc-modal__body{ grid-template-columns:1fr; gap:20px; }
          .orc-modal__logo-container{ align-items:center; }
          .orc-modal__logo{ width:160px; height:160px; }
          .orc-modal__footer{ flex-direction:column; align-items:stretch; gap:12px; }
          .orc-modal__footer-right{ width:100%; }
          .orc-modal__btn{ flex:1; justify-content:center; min-width:0; }
        }

        @media (max-width: 640px){
          .orc-search{ min-width:220px; flex:1 1 240px; }
        }

        @media (max-width: 520px){
          .orc-grid, .orc-skeleton{ grid-template-columns:repeat(2, minmax(0,1fr)); }
          .orc-tile, .orc-sk-tile{ grid-column:span 2; }
          .orc-title{ font-size:22px; }
        }

        @media (max-width: 480px){
          .orc-modal__header{ padding:16px 20px; }
          .orc-modal__body{ padding:20px; }
          .orc-modal__footer{ padding:16px 20px; }
          .orc-modal__btn{ padding:10px 14px; font-size:13px; }
          .orc-modal__info-grid{ grid-template-columns:1fr; }
        }
      `}</style>
    </>
  );
}