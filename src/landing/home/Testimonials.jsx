import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTestimonials } from "../../redux/testimonialsSlice";

const BRAND = "#9E363A";
const LINE = "#e6c8ca";
const MUTED = "#6b7280";
const SHADOW = "0 10px 28px rgba(0,0,0,.10)";
const PLACEHOLDER =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='100%25' height='100%25' rx='100' fill='%23f3f4f6'/%3E%3Ccircle cx='100' cy='76' r='30' fill='%23d1d5db'/%3E%3Cpath d='M42 164c10-28 34-44 58-44s48 16 58 44' fill='%23d1d5db'/%3E%3C/svg%3E";

const stripHtml = (value) => {
  if (!value) return "";
  return String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
};

const hasHtml = (value) => /<\/?[a-z][\s\S]*>/i.test(String(value || ""));

const chunkArray = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
};

const Testimonials = () => {
  const dispatch = useDispatch();
  const { items = [], loading, error } = useSelector(
    (state) => state.testimonials
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerSlide, setItemsPerSlide] = useState(
    typeof window !== "undefined" && window.innerWidth < 768 ? 1 : 2
  );

  const autoRef = useRef(null);

  useEffect(() => {
    dispatch(fetchTestimonials());
  }, [dispatch]);

  useEffect(() => {
    const handleResize = () => {
      const next = window.innerWidth < 768 ? 1 : 2;

      setItemsPerSlide((prev) => {
        if (prev !== next) {
          setCurrentIndex(0);
        }
        return next;
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const safeItems = useMemo(() => {
    return Array.isArray(items) ? items.slice(0, 12) : [];
  }, [items]);

  const slides = useMemo(() => {
    return chunkArray(safeItems, itemsPerSlide);
  }, [safeItems, itemsPerSlide]);

  const totalPages = slides.length;

  const startAuto = () => {
    clearInterval(autoRef.current);

    if (totalPages <= 1) return;

    autoRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev === totalPages - 1 ? 0 : prev + 1));
    }, 6000);
  };

  useEffect(() => {
    startAuto();
    return () => clearInterval(autoRef.current);
  }, [totalPages]);

  const goToPrevious = () => {
    if (totalPages <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
    startAuto();
  };

  const goToNext = () => {
    if (totalPages <= 1) return;
    setCurrentIndex((prev) => (prev === totalPages - 1 ? 0 : prev + 1));
    startAuto();
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
    startAuto();
  };

  if (loading) {
    return (
      <section className="my-6 md:my-10">
        <div
          className="rounded-[18px] border bg-white p-6 text-center md:p-10"
          style={{ borderColor: LINE, boxShadow: SHADOW }}
        >
          <p className="text-sm font-semibold text-gray-500">
            Loading testimonials...
          </p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="my-6 md:my-10">
        <div
          className="rounded-[18px] border bg-white p-6 text-center md:p-10"
          style={{ borderColor: LINE, boxShadow: SHADOW }}
        >
          <p className="text-sm font-semibold text-red-500">{error}</p>
        </div>
      </section>
    );
  }

  if (!safeItems.length) {
    return (
      <section className="my-6 md:my-10">
        <div
          className="rounded-[18px] border bg-white p-6 text-center md:p-10"
          style={{ borderColor: LINE, boxShadow: SHADOW }}
        >
          <p className="text-sm font-bold" style={{ color: MUTED }}>
            No testimonials found.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="my-6 md:my-10">
      <div
        className="rounded-[18px] border bg-white p-[26px] md:p-10"
        style={{ borderColor: LINE, boxShadow: SHADOW }}
      >
        <h2
          className="mb-8 text-center text-[22px] font-black leading-tight md:mb-[30px] md:text-[36px]"
          style={{ color: BRAND }}
        >
          Successful Entrepreneurs
        </h2>

        <div
          className="relative"
          onMouseEnter={() => clearInterval(autoRef.current)}
          onMouseLeave={startAuto}
        >
          {totalPages > 1 && (
            <button
              type="button"
              onClick={goToPrevious}
              aria-label="Previous"
              className="absolute left-[-10px] top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border bg-white md:left-[-14px]"
              style={{
                borderColor: "rgba(158,54,58,.22)",
                boxShadow: "0 12px 24px rgba(2,6,23,.12)",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-[1.15rem] w-[1.15rem]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                style={{ color: "#111" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          {totalPages > 1 && (
            <button
              type="button"
              onClick={goToNext}
              aria-label="Next"
              className="absolute right-[-10px] top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border bg-white md:right-[-14px]"
              style={{
                borderColor: "rgba(158,54,58,.22)",
                boxShadow: "0 12px 24px rgba(2,6,23,.12)",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-[1.15rem] w-[1.15rem]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                style={{ color: "#111" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}

          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out will-change-transform"
              style={{
                transform: `translate3d(-${currentIndex * 100}%, 0, 0)`,
              }}
            >
              {slides.map((slide, slideIndex) => (
                <div
                  key={slideIndex}
                  className="min-w-full px-4 md:px-6"
                >
                  <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 md:gap-8">
                    {slide.map((item, itemIndex) => {
                      const avatar =
                        item?.avatar ||
                        item?.photo_url ||
                        item?.image_url ||
                        item?.image ||
                        PLACEHOLDER;

                      const rawText =
                        item?.text || item?.description || item?.quote || "";
                      const name = item?.name || "—";
                      const company =
                        item?.company_name ||
                        item?.company ||
                        item?.organization ||
                        "";
                      const title =
                        item?.title && item?.title !== name ? item.title : "";
                      const role =
                        item?.role ||
                        [title, company].filter(Boolean).join(", ") ||
                        "—";

                      return (
                        <div
                          key={item?.uuid || item?.id || `${name}-${itemIndex}`}
                          className="h-full"
                        >
                          <div
                            className="flex h-full min-h-[390px] flex-col rounded-2xl border p-[30px] text-center md:min-h-[410px]"
                            style={{
                              borderColor: LINE,
                              background:
                                "linear-gradient(135deg, rgba(158,54,58,.06), rgba(201,75,80,.03))",
                            }}
                          >
                            <div className="flex justify-center">
                              <img loading="lazy" decoding="async"
                                src={avatar}
                                alt={name}
                                className="mb-4 h-20 w-20 rounded-full object-cover bg-white"
                                style={{ border: `4px solid ${BRAND}` }}
                                onError={(e) => {
                                  e.currentTarget.src = PLACEHOLDER;
                                }}
                              />
                            </div>

                            <div
                              className="mb-4 flex-1 text-[15px] italic leading-6"
                              style={{ color: "#111", wordBreak: "break-word" }}
                            >
                              {hasHtml(rawText) ? (
                                <div
                                  className="line-clamp-6"
                                  dangerouslySetInnerHTML={{ __html: rawText }}
                                />
                              ) : (
                                <p className="line-clamp-6">
                                  {stripHtml(rawText) || "—"}
                                </p>
                              )}
                            </div>

                            <div
                              className="mb-1 text-base font-black"
                              style={{ color: BRAND }}
                            >
                              {name}
                            </div>

                            <div
                              className="text-[13px] font-extrabold"
                              style={{ color: MUTED }}
                            >
                              {role}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {slide.length === 1 && itemsPerSlide === 2 && (
                      <div className="hidden md:block" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="mt-[14px] flex justify-center gap-[6px]">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => goToSlide(idx)}
                aria-label={`Slide ${idx + 1}`}
                className="h-2 w-2 rounded-full transition-all duration-200"
                style={{
                  backgroundColor:
                    currentIndex === idx ? BRAND : "rgba(158,54,58,.55)",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;