import { Link, useNavigate, useSearchParams } from "react-router";
import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchEvents,
  fetchDepartments,
  setSearch,
  setDept,
  setPage,
} from "../../redux/crm/eventSlice";

export default function Event() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

  const { events = [], departments = [], search, deptSlug, page, perPage, loading } =
    useSelector((s) => s.events);

  /* ================= FETCH ================= */
  useEffect(() => {
    dispatch(fetchEvents());
    dispatch(fetchDepartments());
  }, [dispatch]);

  /* ================= DEPT FILTER FROM URL ================= */
  useEffect(() => {
    if (!departments.length) return;

    const deptParam = (params.get("dept") || "").toLowerCase();

    if (!deptParam) {
      dispatch(setDept({}));
      return;
    }

    const d = departments.find(
      (x) =>
        String(x.shortcode || "").toLowerCase() === deptParam ||
        String(x.slug || "").toLowerCase() === deptParam
    );

    dispatch(setDept(d || {}));
  }, [departments, params, dispatch]);

  /* ================= IMAGE FIX ================= */
  const getImage = (item) => {
    const raw =
      item?.cover_image_url ||
      item?.image_url ||
      item?.cover_image ||
      item?.image ||
      "";

    if (!raw) return "";

    if (/^(https?:|data:|blob:)/i.test(raw)) return raw;

    if (raw.startsWith("/")) {
      return `${BASE_URL}${raw}`;
    }

    return `${BASE_URL}/storage/${raw}`;
  };

  /* ================= FILTER ================= */
  const filtered = useMemo(() => {
    let items = Array.isArray(events) ? [...events] : [];

    if (deptSlug) {
      items = items.filter((e) => {
        const slug =
          e.department_slug || e.department?.slug || "";
        return String(slug).toLowerCase() === deptSlug;
      });
    }

    if (search) {
      const q = search.toLowerCase().trim();
      if (q) {
        items = items.filter(
          (e) =>
            (e.title || "").toLowerCase().includes(q) ||
            (e.description || "").toLowerCase().includes(q)
        );
      }
    }

    return items;
  }, [events, search, deptSlug]);

  /* ================= PAGINATION ================= */
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  const pageItems = filtered.slice(
    (page - 1) * perPage,
    page * perPage
  );

  /* ================= DATE ================= */
  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "";

  /* ================= DETAIL PATH ================= */
  const getDetailPath = (item) => {
    return `/events/view/${item?.slug || item?.uuid || item?.id}`;
  };

  return (
    <>
    <style>
      {
        `
/* WRAPPER */
.ntx-wrap {
  max-width: 1320px;
  margin: 18px auto 54px;
  padding: 0 12px;
}

/* HEADER */
.ntx-head {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 16px;
  box-shadow: 0 10px 24px rgba(2, 6, 23, 0.08);
  padding: 14px 16px;
  margin-bottom: 16px;
}

.ntx-title {
  font-size: 28px;
  font-weight: 900;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 10px;
}

.ntx-sub {
  margin-top: 6px;
  font-size: 14px;
  color: #64748b;
}

.ntx-tools {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: nowrap;
}

/* SEARCH */
.ntx-search {
  position: relative;
  min-width: 260px;
  max-width: 520px;
  flex: 1;
}

.ntx-search input {
  width: 100%;
  height: 42px;
  border-radius: 999px;
  padding: 11px 12px 11px 42px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  outline: none;
}

.ntx-search input:focus {
  border-color: rgba(201, 75, 80, 0.5);
  box-shadow: 0 0 0 4px rgba(201, 75, 80, 0.15);
}

.ntx-search i {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
}

/* SELECT */
.ntx-select {
  position: relative;
  min-width: 260px;
  max-width: 360px;
}

.ntx-select select {
  width: 100%;
  height: 42px;
  border-radius: 999px;
  padding: 10px 38px 10px 42px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  appearance: none;
  background: #fff;
}

.ntx-select select:focus {
  border-color: rgba(201, 75, 80, 0.5);
  box-shadow: 0 0 0 4px rgba(201, 75, 80, 0.15);
}

.ntx-select__icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
}

.ntx-select__caret {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
}

/* GRID */
.ntx-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
}

/* CARD */
.ntx-card {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 426px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(2, 6, 23, 0.08);
  box-shadow: 0 10px 24px rgba(2, 6, 23, 0.08);
  overflow: hidden;
  transition: all 0.15s ease;
}

.ntx-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 34px rgba(2, 6, 23, 0.12);
}

/* IMAGE */
.ntx-media {
  height: 240px;
  background: #9e363a;
  position: relative;
}

.ntx-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ntx-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  color: white;
  font-size: 22px;
}

/* BODY */
.ntx-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.ntx-h {
  font-size: 20px;
  font-weight: 900;
  margin-bottom: 10px;
  color: #0f172a;

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ntx-p {
  font-size: 14px;
  color: #475569;
  line-height: 1.6;

  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ntx-date {
  margin-top: auto;
  font-size: 13px;
  color: #94a3b8;
  padding-top: 10px;
}

/* LINK */
.ntx-link {
  position: absolute;
  inset: 0;
}

/* EMPTY */
.ntx-state {
  text-align: center;
  padding: 20px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.1);
  color: #64748b;
}

/* SKELETON */
.ntx-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
}

.ntx-sk {
  height: 426px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.1);
  position: relative;
  overflow: hidden;
}

.ntx-sk::before {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-60%);
  background: linear-gradient(
    90deg,
    transparent,
    rgba(148, 163, 184, 0.2),
    transparent
  );
  animation: shimmer 1.2s infinite;
}

@keyframes shimmer {
  to {
    transform: translateX(60%);
  }
}

/* PAGINATION */
.ntx-pagination {
  display: flex;
  justify-content: center;
  margin-top: 18px;
}

.ntx-pager {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.ntx-pagebtn {
  border: 1px solid rgba(15, 23, 42, 0.1);
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
}

.ntx-pagebtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ntx-pagebtn.active {
  background: rgba(201, 75, 80, 0.1);
  color: #9e363a;
}

/* RESPONSIVE */
@media (max-width: 992px) {
  .ntx-head {
    flex-wrap: wrap;
  }
  .ntx-tools {
    flex-wrap: wrap;
  }
}

@media (max-width: 640px) {
  .ntx-title {
    font-size: 24px;
  }
}
        `
      }
    </style>
    <div className="ntx-wrap">

      {/* HEADER */}
      <div className="ntx-head">
        <div className="ntx-search">
          <input
            type="search"
            placeholder="Search events..."
            value={search || ""}
            onChange={(e) => {
              dispatch(setSearch(e.target.value));
              dispatch(setPage(1));
            }}
          />
        </div>

        <div className="ntx-select">
          <select
            value={deptSlug || ""}
            onChange={(e) => {
              const slug = e.target.value;

              const d = departments.find(
                (x) =>
                  x.shortcode === slug ||
                  x.slug === slug
              );

              dispatch(setDept(d || {}));
              dispatch(setPage(1));

              navigate(slug ? `/events?dept=${slug}` : `/events`);
            }}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.uuid} value={d.shortcode || d.slug}>
                {d.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* LOADING */}
      {loading && <div className="ntx-state">Loading events...</div>}

      {/* EMPTY */}
      {!loading && pageItems.length === 0 && (
        <div className="ntx-state">No events found</div>
      )}

      {/* GRID */}
      {!loading && pageItems.length > 0 && (
        <div className="ntx-grid">
          {pageItems.map((e) => {
            const img = getImage(e);

            return (
              <div key={e.uuid || e.id} className="ntx-card">

                {/* IMAGE */}
                <div className="ntx-media">
                  {img ? (
                    <img
                      src={img}
                      alt={e.title}
                      loading="lazy"
                      onError={(ev) => {
                        ev.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="ntx-fallback">Event</div>
                  )}
                </div>

                {/* BODY */}
                <div className="ntx-body">
                  <div className="ntx-h">{e.title}</div>

                  <p className="ntx-p">
                    {e.description || "No description available"}
                  </p>

                  <div className="ntx-date">
                    {formatDate(e.event_start_date)}
                  </div>
                </div>

                {/* ✅ FIXED LINK (IMPORTANT) */}
                <Link
  to={`/events/view/${encodeURIComponent(e.slug || e.uuid || e.id)}`}
  className="ntx-link"
  aria-label={`View ${e.title || "event"}`}
/>
              </div>
            );
          })}
        </div>
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="ntx-pagination">
          <button
            disabled={page === 1}
            onClick={() => dispatch(setPage(page - 1))}
          >
            Prev
          </button>

          <span>{page} / {totalPages}</span>

          <button
            disabled={page === totalPages}
            onClick={() => dispatch(setPage(page + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
    </>
  );
}