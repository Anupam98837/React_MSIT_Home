import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router";
import { fetchCourses } from "../../redux/courseSlice";

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

const parseArrayish = (value) => {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};

const safeHref = (url) => {
  const raw = String(url || "").trim();
  if (!raw) return "#";

  if (/^(mailto:|tel:|javascript:|#)/i.test(raw)) return raw;

  if (/^https?:\/\//i.test(raw)) return raw;

  let path = raw.startsWith("/") ? raw : `/${raw}`;

  path = path.replace(/\/placement_notices(?=\/|$)/gi, "/placement-notices");
  path = path.replace(/\/career_notices(?=\/|$)/gi, "/career-notices");
  path = path.replace(/\/why_us(?=\/|$)/gi, "/why-us");
  path = path.replace(/\/student_activities(?=\/|$)/gi, "/student-activities");

  return path;
};

const isViewCourseLink = (url) => {
  const value = String(url || "").trim().toLowerCase();
  return /\/courses\/view\//.test(value) || /viewcourse/.test(value);
};

const pickLink = (...candidates) => {
  const cleaned = candidates.map((v) => String(v || "").trim()).filter(Boolean);

  const preferred = cleaned.find((v) => !isViewCourseLink(v));
  if (preferred) return safeHref(preferred);

  const fallback = cleaned[0] || "";
  return fallback ? safeHref(fallback) : "#";
};

const pickImageHref = (course) =>
  pickLink(
    course?.cover_image_link,
    course?.image_link,
    course?.image_href,
    course?.image_url_link,
    course?.redirect_url,
    course?.title_link,
    course?.summary_link,
    course?.href,
    course?.link,
    course?.url
  );

const pickTitleHref = (course) =>
  pickLink(
    course?.title_link,
    course?.cover_image_link,
    course?.summary_link,
    course?.href,
    course?.link,
    course?.redirect_url,
    course?.url
  );

const pickSummaryHref = (course) =>
  pickLink(
    course?.summary_link,
    course?.title_link,
    course?.cover_image_link,
    course?.href,
    course?.link,
    course?.redirect_url,
    course?.url
  );

const pickDefaultButtonHref = (course) =>
  pickLink(
    course?.title_link,
    course?.cover_image_link,
    course?.summary_link,
    course?.href,
    course?.link,
    course?.redirect_url,
    course?.url
  );

const sortCourses = (items) => {
  return [...items].sort((a, b) => {
    const featuredDiff =
      Number(b?.is_featured_home || 0) - Number(a?.is_featured_home || 0);
    if (featuredDiff !== 0) return featuredDiff;

    const sortOrderDiff =
      Number(a?.sort_order ?? 0) - Number(b?.sort_order ?? 0);
    if (sortOrderDiff !== 0) return sortOrderDiff;

    const dateDiff =
      Date.parse(b?.publish_at || b?.created_at || "") -
      Date.parse(a?.publish_at || a?.created_at || "");
    if (Number.isFinite(dateDiff) && dateDiff !== 0) return dateDiff;

    return String(a?.title || "").localeCompare(String(b?.title || ""));
  });
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

function SmartLink({ href, className = "", children }) {
  const internalRoute = getInternalRoute(href);
  const finalHref = safeHref(href);

  if (internalRoute) {
    return (
      <Link to={internalRoute} className={className}>
        {children}
      </Link>
    );
  }

  if (finalHref && finalHref !== "#") {
    return (
      <a href={finalHref} className={className}>
        {children}
      </a>
    );
  }

  return <div className={className}>{children}</div>;
}

export default function Courses() {
  const dispatch = useDispatch();
  const { data, status, error } = useSelector((state) => state.courses);

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  const courses = useMemo(() => {
    const items = Array.isArray(data) ? data : [];
    return sortCourses(items);
  }, [data]);

  return (
    <>
      <style>{`
        .msit-courses-section{
          background:#fff;
          border-radius:18px;
          border:1px solid #e6c8ca;
          padding:40px;
          box-shadow:0 10px 28px rgba(0,0,0,.10);
        }

        .msit-courses-heading{
          text-align:center;
          font-weight:950;
          color:#9E363A;
          margin:0 0 30px;
          font-size:clamp(22px, 3vw, 36px);
          line-height:1.15;
        }

        .msit-courses-grid{
          display:grid;
          grid-template-columns:1fr;
          gap:24px;
        }

        @media (min-width:768px){
          .msit-courses-grid{
            grid-template-columns:repeat(2, minmax(0, 1fr));
          }
        }

        @media (min-width:1200px){
          .msit-courses-grid{
            grid-template-columns:repeat(4, minmax(0, 1fr));
          }
        }

        .msit-course-card{
          background:linear-gradient(135deg, rgba(158,54,58,.08), rgba(201,75,80,.04));
          border-radius:16px;
          padding:24px;
          height:100%;
          border:1px solid #e6c8ca;
          transition:transform .18s ease, box-shadow .18s ease;
          display:flex;
          flex-direction:column;
        }

        .msit-course-card:hover{
          transform:translateY(-3px);
          box-shadow:0 16px 30px rgba(2,6,23,.12);
        }

        .msit-course-block-link{
          display:block;
          text-decoration:none;
        }

        .msit-course-img{
          width:100%;
          height:180px;
          object-fit:cover;
          border-radius:12px;
          margin-bottom:16px;
          background:#eee;
          display:block;
        }

        .msit-course-title{
          font-weight:950;
          color:#9E363A;
          font-size:20px;
          margin:0 0 10px;
          line-height:1.15;
        }

        .msit-course-desc{
          font-size:14px;
          color:#6b7280;
          line-height:1.6;
          margin:0 0 14px;
        }

        .msit-course-links{
          display:flex;
          gap:8px;
          flex-wrap:wrap;
          margin-top:auto;
        }

        .msit-course-link{
          font-size:12px;
          padding:6px 12px;
          background:rgba(158,54,58,.15);
          color:#9E363A;
          border-radius:999px;
          text-decoration:none;
          font-weight:900;
          transition:background .15s ease, color .15s ease, transform .15s ease;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          line-height:1.2;
        }

        .msit-course-link:hover{
          background:#9E363A;
          color:#fff;
          transform:translateY(-1px);
        }

        .msit-muted-note{
          color:#6b7280;
          font-weight:800;
          text-align:center;
          margin:0;
          padding:10px 0 0;
        }

        @media (max-width:768px){
          .msit-courses-section{
            padding:26px;
          }

          .msit-course-title{
            font-size:18px;
          }
        }
      `}</style>

      <section className="msit-courses-section reveal" data-lazy-key="courses">
        <h2 className="msit-courses-heading">Courses Offered</h2>

        {status === "loading" && (
          <div className="msit-courses-grid">
            <div className="msit-course-card">
              <img loading="lazy" decoding="async"
                src={PLACEHOLDER}
                alt="Course"
                className="msit-course-img"
              />
              <h3 className="msit-course-title">Loading…</h3>
              <p className="msit-course-desc">Please wait…</p>
              <div className="msit-course-links">
                <span className="msit-course-link">Vision & Mission</span>
                <span className="msit-course-link">PEO, PSO, PO</span>
                <span className="msit-course-link">Faculty</span>
                <span className="msit-course-link">Department Home</span>
              </div>
            </div>
          </div>
        )}

        {status === "failed" && (
          <p className="msit-muted-note">
            {error || "Failed to fetch courses"}
          </p>
        )}

        {status !== "loading" && status !== "failed" && courses.length === 0 && (
          <p className="msit-muted-note">Courses not available right now.</p>
        )}

        {status !== "loading" && status !== "failed" && courses.length > 0 && (
          <div className="msit-courses-grid" id="coursesContainer">
            {courses.map((course, index) => {
              const img =
                course?.cover_image ||
                course?.image_url ||
                course?.image ||
                PLACEHOLDER;

              const name = course?.title || course?.name || "Course";
              const desc =
                course?.summary ||
                course?.blurb ||
                course?.description ||
                "—";

              const imageHref = pickImageHref(course);
              const titleHref = pickTitleHref(course);
              const summaryHref = pickSummaryHref(course);
              const defaultButtonHref = pickDefaultButtonHref(course);

              const links = parseArrayish(course?.buttons_json).length
                ? parseArrayish(course?.buttons_json)
                : Array.isArray(course?.links) && course.links.length
                ? course.links
                : [
                    { name: "Vision & Mission", link: defaultButtonHref },
                    { name: "PEO, PSO, PO", link: defaultButtonHref },
                    { name: "Faculty", link: defaultButtonHref },
                    { name: "Department Home", link: defaultButtonHref },
                  ];

              return (
                <div key={course?.uuid || index} className="h-full">
                  <div className="msit-course-card">
                    <SmartLink
                      href={imageHref}
                      className="msit-course-block-link"
                    >
                      <img
                        src={img}
                        alt={name}
                        loading="lazy"
                        className="msit-course-img"
                        onError={(e) => {
                          e.currentTarget.src = PLACEHOLDER;
                        }}
                      />
                    </SmartLink>

                    <SmartLink
                      href={titleHref}
                      className="msit-course-block-link"
                    >
                      <h3 className="msit-course-title">{name}</h3>
                    </SmartLink>

                    <SmartLink
                      href={summaryHref}
                      className="msit-course-block-link"
                    >
                      <p className="msit-course-desc">{desc}</p>
                    </SmartLink>

                    <div className="msit-course-links">
                      {links.slice(0, 4).map((item, i) => {
                        const label =
                          item?.name || item?.text || item?.title || "Link";

                        const rawLink = String(
                          item?.link || item?.url || item?.href || ""
                        ).trim();

                        const finalHref = rawLink
                          ? safeHref(rawLink)
                          : defaultButtonHref;

                        return (
                          <SmartLink
                            key={i}
                            href={finalHref}
                            className="msit-course-link"
                          >
                            {label}
                          </SmartLink>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}