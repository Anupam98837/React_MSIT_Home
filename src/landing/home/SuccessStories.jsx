import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { fetchSuccessStories } from "../../redux/successSlice";

const BRAND = "#9E363A";
const LINE = "#e6c8ca";
const MUTED = "#6b7280";
const SECTION_BG = "#f9fafb";
const PLACEHOLDER =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'%3E%3Crect width='100%25' height='100%25' fill='%23eeeeee'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999999' font-family='Arial, sans-serif' font-size='28'%3ENo Image%3C/text%3E%3C/svg%3E";

const stripHtml = (value) => {
  if (!value) return "";
  return String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
};

const getImage = (item) =>
  item?.image_url || item?.image || item?.photo_url || PLACEHOLDER;

const getName = (item) => item?.name || item?.title || "—";

const getRole = (item) =>
  item?.department_title ||
  item?.departmentTitle ||
  item?.department_name ||
  item?.role ||
  item?.subtitle ||
  item?.year ||
  "";

const getSlug = (item) =>
  String(item?.slug || item?.story_slug || item?.url_slug || "").trim();

const SuccessStories = () => {
  const dispatch = useDispatch();
  const scrollerRef = useRef(null);
  const { items = [], loading, error } = useSelector((state) => state.success);

  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    dispatch(fetchSuccessStories());
  }, [dispatch]);

  const stories = useMemo(() => {
    return Array.isArray(items) ? items.slice(0, 12) : [];
  }, [items]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const updateScrollState = () => {
      setCanScroll(el.scrollWidth > el.clientWidth + 8);
    };

    updateScrollState();
    window.addEventListener("resize", updateScrollState);

    return () => {
      window.removeEventListener("resize", updateScrollState);
    };
  }, [stories]);

  const scrollByAmount = (direction) => {
    const el = scrollerRef.current;
    if (!el) return;

    const amount = Math.max(el.clientWidth * 0.88, 280);

    el.scrollBy({
      left: direction === "next" ? amount : -amount,
      behavior: "smooth",
    });
  };

  if (loading) {
    return (
      <section className="my-6 md:my-10">
        <div className="rounded-[18px] border border-black/5 bg-[#f9fafb] p-6 md:p-10 text-center">
          <p className="text-sm font-semibold text-gray-500">
            Loading success stories...
          </p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="my-6 md:my-10">
        <div className="rounded-[18px] border border-black/5 bg-[#f9fafb] p-6 md:p-10 text-center">
          <p className="text-sm font-semibold text-red-500">{error}</p>
        </div>
      </section>
    );
  }

  if (!stories.length) {
    return (
      <section className="my-6 md:my-10">
        <div className="rounded-[18px] border border-black/5 bg-[#f9fafb] p-6 md:p-10 text-center">
          <p className="text-sm font-bold" style={{ color: MUTED }}>
            No success stories found.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="my-6 md:my-10">
      <div
        className="rounded-[18px] border p-6 md:p-10"
        style={{
          backgroundColor: SECTION_BG,
          borderColor: "rgba(17,17,17,.06)",
        }}
      >
        <div className="relative mb-3 md:mb-6">
          <h2
            className="mb-0 text-center text-[22px] font-black leading-tight md:text-[30px]"
            style={{ color: BRAND }}
          >
            Success Stories
          </h2>

          {canScroll && (
            <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 gap-2 md:flex">
              <button
                type="button"
                onClick={() => scrollByAmount("prev")}
                aria-label="Previous"
                className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white text-xs transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  borderColor: LINE,
                  color: BRAND,
                  boxShadow: "0 4px 12px rgba(0,0,0,.05)",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => scrollByAmount("next")}
                aria-label="Next"
                className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white text-xs transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  borderColor: LINE,
                  color: BRAND,
                  boxShadow: "0 4px 12px rgba(0,0,0,.05)",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div
          ref={scrollerRef}
          className="
            flex gap-4 overflow-x-auto p-0 m-0 scroll-smooth snap-x snap-mandatory
            [-ms-overflow-style:none] [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
        >
          {stories.map((story, index) => {
            const image = getImage(story);
            const name = getName(story);
            const role = getRole(story);
            const slug = getSlug(story);
            const description = stripHtml(story?.description || story?.text || "");

            const cardClassName =
              "block h-full rounded-2xl border bg-white p-5 text-inherit no-underline transition-all duration-200 hover:-translate-y-0.5";

            const content = (
              <>
                <img loading="lazy" decoding="async"
                  src={image}
                  alt={name}
                  className="mb-4 h-[200px] w-full rounded-xl object-cover bg-[#eee]"
                  onError={(e) => {
                    e.currentTarget.src = PLACEHOLDER;
                  }}
                />

                <div
                  className="mb-3 text-sm leading-[1.5]"
                  style={{ color: MUTED, wordBreak: "break-word" }}
                >
                  {description || "—"}
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
                  {role || "—"}
                </div>
              </>
            );

            return (
              <div
                key={story?.uuid || story?.id || `${name}-${index}`}
                className="
                  shrink-0 snap-start
                  basis-[82%] max-w-[82%]
                  md:basis-[calc((100%-16px)/2)] md:max-w-[calc((100%-16px)/2)]
                  lg:basis-[calc((100%-32px)/3)] lg:max-w-[calc((100%-32px)/3)]
                  xl:basis-[calc((100%-48px)/4)] xl:max-w-[calc((100%-48px)/4)]
                "
              >
                {slug ? (
                  <Link
                    to={`/success-stories/view/${slug}`}
                    className={cardClassName}
                    style={{ borderColor: LINE }}
                  >
                    {content}
                  </Link>
                ) : (
                  <div className={cardClassName} style={{ borderColor: LINE }}>
                    {content}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SuccessStories;