import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router";
import { fetchCourses, selectUgCourses } from "../../redux/courseSlice";

const PLACEHOLDER =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="450">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#9E363A" stop-opacity=".18"/>
          <stop offset="1" stop-color="#C94B50" stop-opacity=".08"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" rx="24" fill="url(#g)"/>
      <path d="M140 310 L300 180 L420 280 L520 220 L680 330 L680 370 L140 370 Z" fill="#9E363A" opacity=".25"/>
      <circle cx="310" cy="170" r="26" fill="#C94B50" opacity=".35"/>
      <text x="50%" y="54%" text-anchor="middle" font-family="Arial" font-size="26" fill="#6B2528" opacity=".8">Image</text>
    </svg>
  `);

const safeHref = (url) => {
  const raw = String(url || "").trim();
  if (!raw) return "#";
  if (/^https?:\/\//i.test(raw)) return raw;

  let path = raw.startsWith("/") ? raw : `/${raw}`;
  path = path.replace(/\/placement_notices(?=\/|$)/gi, "/placement-notices");
  path = path.replace(/\/career_notices(?=\/|$)/gi, "/career-notices");
  path = path.replace(/\/why_us(?=\/|$)/gi, "/why-us");
  path = path.replace(/\/student_activities(?=\/|$)/gi, "/student-activities");

  return path;
};

const isViewCourseLink = (url) => {
  const s = String(url || "").trim().toLowerCase();
  return /\/courses\/view\//.test(s) || /viewcourse/.test(s);
};

const pickLink = (...candidates) => {
  const cleaned = candidates.map((v) => String(v || "").trim()).filter(Boolean);

  const preferred = cleaned.find((v) => !isViewCourseLink(v));
  if (preferred) return safeHref(preferred);

  const fallback = cleaned[0] || "";
  return fallback ? safeHref(fallback) : "#";
};

const ROUTER_HOSTS = new Set([
  window.location.hostname,
  "msit.edu.in",
  "www.msit.edu.in",
]);

const getInternalRoute = (href) => {
  const value = String(href || "").trim();
  if (!value || value === "#") return null;
  if (/^(mailto:|tel:|javascript:|#)/i.test(value)) return null;

  if (value.startsWith("/")) return safeHref(value);

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      if (ROUTER_HOSTS.has(url.hostname)) {
        return safeHref(`${url.pathname}${url.search}${url.hash}`);
      }
      return null;
    } catch {
      return null;
    }
  }

  return safeHref(value);
};

function SmartLink({ href, className = "", children, ariaDisabled = false }) {
  const internalRoute = getInternalRoute(href);
  const finalHref = safeHref(href);

  if (internalRoute) {
    return (
      <Link
        to={internalRoute}
        className={className}
        aria-disabled={ariaDisabled ? "true" : undefined}
      >
        {children}
      </Link>
    );
  }

  if (finalHref && finalHref !== "#") {
    return (
      <a
        href={finalHref}
        className={className}
        aria-disabled={ariaDisabled ? "true" : undefined}
      >
        {children}
      </a>
    );
  }

  return (
    <div className={className} aria-disabled={ariaDisabled ? "true" : undefined}>
      {children}
    </div>
  );
}

const sortUgCourses = (items) => {
  return [...items].sort((a, b) => {
    const featuredDiff =
      Number(b?.is_featured_home || 0) - Number(a?.is_featured_home || 0);
    if (featuredDiff !== 0) return featuredDiff;

    const sortOrderDiff =
      Number(a?.sort_order ?? 0) - Number(b?.sort_order ?? 0);
    if (sortOrderDiff !== 0) return sortOrderDiff;

    const timeDiff =
      Date.parse(b?.publish_at || b?.created_at || "") -
      Date.parse(a?.publish_at || a?.created_at || "");
    if (Number.isFinite(timeDiff) && timeDiff !== 0) return timeDiff;

    return String(a?.title || "").localeCompare(String(b?.title || ""));
  });
};

export default function UgCourses() {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.courses);
  const ugCoursesRaw = useSelector(selectUgCourses);

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  const ugCourses = useMemo(() => sortUgCourses(ugCoursesRaw || []), [ugCoursesRaw]);

  return (
    <>
      <style>{`
        .ugc-section{
          background:#9E363A;
          border-radius:18px;
          padding:34px 22px;
          border:1px solid rgba(255,255,255,.14);
          box-shadow:0 10px 28px rgba(0,0,0,.10);
        }

        .ugc-section h2{
          text-align:center;
          font-weight:950;
          color:#fff;
          margin:0 0 24px;
          font-size:clamp(20px, 2.8vw, 32px);
          line-height:1.15;
        }

        .ugc-row{
          display:grid;
          grid-template-columns:1fr;
          gap:24px;
        }

        @media (min-width:768px){
          .ugc-row{
            grid-template-columns:repeat(2, minmax(0, 1fr));
          }
        }

        @media (min-width:992px){
          .ugc-row{
            grid-template-columns:repeat(3, minmax(0, 1fr));
          }
        }

        .ugc-col{
          min-width:0;
        }

        .ugc-card{
          display:block;
          text-decoration:none;
          color:#fff;
          height:100%;
        }

        .ugc-img{
          width:100%;
          height:170px;
          object-fit:cover;
          border-radius:10px;
          border:4px solid rgba(255,255,255,.95);
          box-shadow:0 12px 24px rgba(2,6,23,.18);
          background:#111;
          transition:transform .18s ease;
          display:block;
        }

        .ugc-title{
          margin:14px 0 0;
          font-weight:950;
          font-size:18px;
          line-height:1.25;
          color:#fff;
          display:-webkit-box;
          -webkit-line-clamp:3;
          -webkit-box-orient:vertical;
          overflow:hidden;
          min-height:calc(18px * 1.25 * 2);
        }

        .ugc-card:hover .ugc-img{
          transform:translateY(-1px);
        }

        .muted-note{
          color:#6b7280;
          font-weight:800;
          text-align:center;
          margin:0;
          padding:10px 0 0;
        }

        .muted-note--white{
          color:#fff;
        }

        @media (max-width:576px){
          .ugc-section{
            padding:26px 16px;
            border-radius:16px;
          }

          .ugc-img{
            height:150px;
          }

          .ugc-title{
            font-size:16px;
            min-height:0;
          }
        }
      `}</style>

      <section className="ugc-section reveal" data-lazy-key="coursesUg">
        <h2>AICTE UG Courses</h2>

        {status === "loading" && (
          <div className="ugc-row" id="ugCoursesContainer">
            <div className="ugc-col">
              <div className="ugc-card" aria-disabled="true">
                <img loading="lazy" decoding="async"
                  src={PLACEHOLDER}
                  alt="Course"
                  className="ugc-img"
                />
                <div className="ugc-title">Loading…</div>
              </div>
            </div>
          </div>
        )}

        {status === "failed" && (
          <div className="ugc-row" id="ugCoursesContainer">
            <div className="ugc-col" style={{ gridColumn: "1 / -1" }}>
              <p className="muted-note muted-note--white">
                {error || "Failed to load courses"}
              </p>
            </div>
          </div>
        )}

        {status !== "loading" && status !== "failed" && ugCourses.length === 0 && (
          <div className="ugc-row" id="ugCoursesContainer">
            <div className="ugc-col" style={{ gridColumn: "1 / -1" }}>
              <p className="muted-note muted-note--white">
                No UG courses available.
              </p>
            </div>
          </div>
        )}

        {status !== "loading" && status !== "failed" && ugCourses.length > 0 && (
          <div className="ugc-row" id="ugCoursesContainer">
            {ugCourses.map((course, index) => {
              const img =
                course?.cover_image ||
                course?.image_url ||
                course?.image ||
                PLACEHOLDER;

              const title = course?.title || course?.name || "UG Course";

              const href = pickLink(
                course?.title_link,
                course?.cover_image_link,
                course?.summary_link,
                course?.href,
                course?.link,
                course?.redirect_url,
                course?.url,
                course?.uuid ? `/courses/view/${course.uuid}` : ""
              );

              return (
                <div className="ugc-col" key={course?.uuid || index}>
                  <SmartLink href={href} className="ugc-card" ariaDisabled={href === "#"}>
                    <img
                      src={img}
                      loading="lazy"
                      alt={title}
                      className="ugc-img"
                      onError={(e) => {
                        e.currentTarget.src = PLACEHOLDER;
                      }}
                    />
                    <div className="ugc-title">{title}</div>
                  </SmartLink>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}