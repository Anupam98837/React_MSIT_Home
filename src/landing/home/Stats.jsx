import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchStats } from "../../redux/statsSlice";

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

const chunkArray = (arr, size) => {
  const out = [];
  const safe = Array.isArray(arr) ? arr : [];
  const chunkSize = Math.max(1, Number(size) || 1);

  for (let i = 0; i < safe.length; i += chunkSize) {
    out.push(safe.slice(i, i + chunkSize));
  }

  return out;
};

const clampIndex = (index, total) => {
  if (total <= 0) return 0;
  if (index < 0) return 0;
  if (index >= total) return total - 1;
  return index;
};

export default function Stats() {
  const dispatch = useDispatch();
  const { data, status, error } = useSelector((state) => state.stats);

  const sectionRef = useRef(null);
  const hasAnimatedRef = useRef(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    dispatch(fetchStats());
  }, [dispatch]);

  const items = useMemo(() => {
    const raw = parseArrayish(data?.stats_items_json);
    return raw
      .slice()
      .sort((a, b) => Number(a?.sort_order || 0) - Number(b?.sort_order || 0));
  }, [data]);

  const title = useMemo(() => {
    return data?.metadata?.section_title || data?.metadata?.title || "Key Stats";
  }, [data]);

  const settings = useMemo(() => {
    return {
      autoScroll: Boolean(data?.auto_scroll ?? true),
      interval: parseInt(data?.scroll_latency_ms ?? 3000, 10) || 3000,
      wrap: Boolean(data?.loop ?? true),
      showArrows: Boolean(data?.show_arrows ?? true),
      showDots: Boolean(data?.show_dots ?? false),
    };
  }, [data]);

  const groups = useMemo(() => chunkArray(items, 4), [items]);
  const hasMulti = groups.length > 1;

  useEffect(() => {
    setCurrentSlide((prev) => clampIndex(prev, groups.length));
  }, [groups.length]);

  useEffect(() => {
    if (!hasMulti || !settings.autoScroll) return;

    const timer = window.setInterval(() => {
      setCurrentSlide((prev) => {
        const next = prev + 1;

        if (next < groups.length) return next;
        return settings.wrap ? 0 : prev;
      });
    }, settings.interval);

    return () => window.clearInterval(timer);
  }, [groups.length, hasMulti, settings.autoScroll, settings.interval, settings.wrap]);

  useEffect(() => {
    if (!sectionRef.current || hasAnimatedRef.current || items.length === 0) return;

    const animateCounters = () => {
      const counters = sectionRef.current?.querySelectorAll(".stat-num") || [];

      counters.forEach((el) => {
        const target = Number(el.getAttribute("data-count") || 0);
        let current = 0;

        const tick = () => {
          const increment = Math.max(1, target / 50);
          current += increment;

          if (current < target) {
            el.textContent = String(Math.ceil(current));
            window.requestAnimationFrame(tick);
          } else {
            el.textContent = String(target);
          }
        };

        tick();
      });

      hasAnimatedRef.current = true;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          animateCounters();
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, [items]);

  const goToSlide = (index) => {
    setCurrentSlide(clampIndex(index, groups.length));
  };

  const goPrev = () => {
    setCurrentSlide((prev) => {
      if (prev > 0) return prev - 1;
      return settings.wrap && hasMulti ? groups.length - 1 : prev;
    });
  };

  const goNext = () => {
    setCurrentSlide((prev) => {
      if (prev < groups.length - 1) return prev + 1;
      return settings.wrap && hasMulti ? 0 : prev;
    });
  };

  const bg = String(data?.background_image_url || "").trim();

  const sectionStyle = bg
    ? {
        backgroundImage: `linear-gradient(135deg, rgba(255,255,255,.88), rgba(255,255,255,.88)), url("${bg}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  return (
    <>
      <style>{`
        .stats-section{
          background:linear-gradient(135deg, rgba(158,54,58,.08), rgba(201,75,80,.04));
          border-radius:18px;
          padding:50px 30px;
          border:1px solid rgba(158,54,58,.12);
          position:relative;
          overflow:hidden;
        }

        .stats-section.has-bg{
          background-size:cover;
          background-position:center;
        }

        .stats-head{
          text-align:center;
          margin-bottom:26px;
        }

        .stats-head h2{
          margin:0;
          font-weight:950;
          color:#9E363A;
          font-size:clamp(22px, 3vw, 34px);
          line-height:1.15;
        }

        .stats-grid{
          display:grid;
          grid-template-columns:repeat(2, minmax(0, 1fr));
          gap:24px;
        }

        @media (min-width:992px){
          .stats-grid{
            grid-template-columns:repeat(4, minmax(0, 1fr));
          }
        }

        .stat-item{
          text-align:center;
        }

        .stat-icon{
          display:inline-flex;
          width:42px;
          height:42px;
          align-items:center;
          justify-content:center;
          border-radius:999px;
          background:rgba(158,54,58,.10);
          color:#9E363A;
          margin-bottom:10px;
          border:1px solid rgba(158,54,58,.18);
        }

        .stat-num{
          font-size:clamp(40px, 5vw, 64px);
          font-weight:950;
          color:#9E363A;
          line-height:1;
          margin-bottom:8px;
        }

        .stat-label{
          font-size:16px;
          color:#6b7280;
          font-weight:800;
        }

        .muted-note{
          color:#6b7280;
          font-weight:800;
          text-align:center;
          margin:0;
          padding:10px 0 0;
        }

        .stats-carousel{
          position:relative;
        }

        .stats-carousel-inner{
          padding-left:56px;
          padding-right:56px;
          overflow:hidden;
        }

        .stats-carousel-track{
          display:flex;
          transition:transform .45s ease;
          will-change:transform;
        }

        .stats-carousel-slide{
          flex:0 0 100%;
          min-width:100%;
        }

        .stats-carousel-controls{
          width:46px;
          height:46px;
          top:50%;
          position:absolute;
          transform:translateY(-50%);
          opacity:1;
          background:rgba(255,255,255,.92);
          border:1px solid rgba(158,54,58,.22);
          border-radius:999px;
          box-shadow:0 12px 24px rgba(2,6,23,.12);
          display:flex;
          align-items:center;
          justify-content:center;
          cursor:pointer;
          z-index:2;
        }

        .stats-carousel-controls:disabled{
          opacity:.45;
          cursor:not-allowed;
        }

        .stats-carousel-controls--prev{
          left:0;
        }

        .stats-carousel-controls--next{
          right:0;
        }

        .stats-carousel-controls i{
          color:#111;
          font-size:14px;
        }

        .stats-carousel-indicators{
          display:flex;
          justify-content:center;
          gap:6px;
          margin:14px 0 0;
        }

        .stats-carousel-dot{
          width:8px;
          height:8px;
          border-radius:999px;
          border:none;
          background:rgba(158,54,58,.55);
          cursor:pointer;
          padding:0;
        }

        .stats-carousel-dot.is-active{
          background:#9E363A;
        }

        @media (max-width:576px){
          .stats-carousel-inner{
            padding-left:44px;
            padding-right:44px;
          }

          .stats-carousel-controls{
            width:40px;
            height:40px;
          }
        }

        @media (max-width:768px){
          .stats-section{
            padding:26px;
          }

          .stat-num{
            font-size:36px;
          }
        }
      `}</style>

      <section
        ref={sectionRef}
        id="statsSection"
        className={`stats-section reveal ${bg ? "has-bg" : ""}`}
        data-lazy-key="stats"
        style={sectionStyle}
      >
        <div className="stats-head">
          <h2 id="statsTitle">{title}</h2>
        </div>

        {status === "loading" && (
          <div className="stats-grid" id="statsRow">
            <div className="stat-item">
              <div className="stat-icon">
                <i className="fa-solid fa-chart-column" />
              </div>
              <div className="stat-num" data-count="0">
                0
              </div>
              <div className="stat-label">Loading…</div>
            </div>
          </div>
        )}

        {status === "failed" && (
          <div id="statsRow">
            <p className="muted-note">{error || "Failed to load stats."}</p>
          </div>
        )}

        {status !== "loading" && status !== "failed" && items.length === 0 && (
          <div id="statsRow">
            <p className="muted-note">No stats published.</p>
          </div>
        )}

        {status !== "loading" && status !== "failed" && items.length > 0 && !hasMulti && (
          <div className="stats-grid" id="statsRow">
            {items.slice(0, 4).map((it, i) => {
              const label = it?.label || it?.key || "—";
              const value = String(it?.value ?? "0").replace(/[^\d]/g, "") || "0";
              const icon = it?.icon_class || "fa-solid fa-chart-column";

              return (
                <div className="stat-item" key={i}>
                  <div className="stat-icon">
                    <i className={icon} />
                  </div>
                  <div className="stat-num" data-count={value}>
                    0
                  </div>
                  <div className="stat-label">{label}</div>
                </div>
              );
            })}
          </div>
        )}

        {status !== "loading" && status !== "failed" && items.length > 0 && hasMulti && (
          <div id="statsRow">
            <div className="stats-carousel">
              {settings.showArrows && hasMulti && (
                <>
                  <button
                    type="button"
                    className="stats-carousel-controls stats-carousel-controls--prev"
                    onClick={goPrev}
                    disabled={!settings.wrap && currentSlide === 0}
                    aria-label="Previous"
                  >
                    <i className="fa-solid fa-chevron-left" />
                  </button>

                  <button
                    type="button"
                    className="stats-carousel-controls stats-carousel-controls--next"
                    onClick={goNext}
                    disabled={!settings.wrap && currentSlide === groups.length - 1}
                    aria-label="Next"
                  >
                    <i className="fa-solid fa-chevron-right" />
                  </button>
                </>
              )}

              <div className="stats-carousel-inner">
                <div
                  className="stats-carousel-track"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {groups.map((group, index) => (
                    <div className="stats-carousel-slide" key={index}>
                      <div className="stats-grid">
                        {group.map((it, i) => {
                          const label = it?.label || it?.key || "—";
                          const value =
                            String(it?.value ?? "0").replace(/[^\d]/g, "") || "0";
                          const icon = it?.icon_class || "fa-solid fa-chart-column";

                          return (
                            <div className="stat-item" key={`${index}-${i}`}>
                              <div className="stat-icon">
                                <i className={icon} />
                              </div>
                              <div className="stat-num" data-count={value}>
                                0
                              </div>
                              <div className="stat-label">{label}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {settings.showDots && hasMulti && (
                <div className="stats-carousel-indicators">
                  {groups.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`stats-carousel-dot ${
                        currentSlide === index ? "is-active" : ""
                      }`}
                      aria-label={`Slide ${index + 1}`}
                      aria-current={currentSlide === index ? "true" : undefined}
                      onClick={() => goToSlide(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </>
  );
}