import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAlumni } from "../../redux/alumniSlice";

const BRAND = "#9E363A";
const LINE = "#e6c8ca";
const MUTED = "#6b7280";

const toEmbedUrl = (url = "") => {
  const raw = String(url || "").trim();
  if (!raw) return "";

  if (raw.includes("youtube-nocookie.com/embed/")) return raw;
  if (raw.includes("youtube.com/embed/")) {
    return raw.replace("youtube.com/embed/", "youtube-nocookie.com/embed/");
  }

  const ytMatch =
    raw.match(/[?&]v=([^&]+)/)?.[1] ||
    raw.match(/youtu\.be\/([^?&/]+)/)?.[1] ||
    raw.match(/youtube\.com\/shorts\/([^?&/]+)/)?.[1];

  if (ytMatch) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch}`;
  }

  return raw;
};

const chunkArray = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const Alumni = () => {
  const dispatch = useDispatch();
  const alumniState = useSelector((state) => state.alumni || {});
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    dispatch(fetchAlumni());
  }, [dispatch]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loading = Boolean(alumniState?.loading);

  const title = alumniState?.title
    ? String(alumniState.title)
    : "Alumni Speak";

  const videos = useMemo(() => {
    const source = Array.isArray(alumniState?.iframe_urls_json)
      ? alumniState.iframe_urls_json
      : Array.isArray(alumniState?.items)
      ? alumniState.items
      : [];

    return source
      .slice()
      .sort((a, b) => Number(a?.sort_order || 0) - Number(b?.sort_order || 0))
      .slice(0, 12);
  }, [alumniState]);

  const perSlide = isMobile ? 1 : 3;
  const groups = useMemo(() => chunkArray(videos, perSlide), [videos, perSlide]);
  const hasMulti = groups.length > 1;
  const showStaticGrid = videos.length <= perSlide;

  useEffect(() => {
    setCurrentIndex(0);
  }, [perSlide, videos.length]);

  const goPrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const goNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, groups.length - 1));
  };

  if (loading) {
    return (
      <section>
        <div
          className="rounded-[18px] border bg-white p-10 shadow-[0_10px_28px_rgba(0,0,0,.10)]"
          style={{ borderColor: LINE }}
        >
          <h2
            className="mb-8 text-center text-[clamp(22px,3vw,36px)] font-black"
            style={{ color: BRAND }}
          >
            {title}
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: isMobile ? 1 : 3 }).map((_, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-2xl bg-black shadow-[0_10px_22px_rgba(2,6,23,.10)]"
              >
                <div className="h-[240px] animate-pulse bg-neutral-800" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!videos.length) {
    return (
      <section>
        <div
          className="rounded-[18px] border bg-white p-10 shadow-[0_10px_28px_rgba(0,0,0,.10)]"
          style={{ borderColor: LINE }}
        >
          <h2
            className="mb-8 text-center text-[clamp(22px,3vw,36px)] font-black"
            style={{ color: BRAND }}
          >
            {title}
          </h2>

          <p
            className="m-0 pt-2 text-center text-sm font-extrabold"
            style={{ color: MUTED }}
          >
            No alumni videos available.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div
        className="rounded-[18px] border bg-white p-[26px] shadow-[0_10px_28px_rgba(0,0,0,.10)] md:p-10"
        style={{ borderColor: LINE }}
      >
        <h2
          className="mb-8 text-center text-[clamp(22px,3vw,36px)] font-black"
          style={{ color: BRAND }}
        >
          {title}
        </h2>

        {showStaticGrid ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {videos.slice(0, 6).map((video, idx) => {
              const embed =
                video?.video_id
                  ? `https://www.youtube-nocookie.com/embed/${String(
                      video.video_id
                    )}`
                  : toEmbedUrl(video?.url || "");

              const ttl = video?.title || "Video";

              return (
                <div key={video?.id || video?.uuid || idx} className="w-full">
                  <div className="h-full overflow-hidden rounded-2xl bg-black shadow-[0_10px_22px_rgba(2,6,23,.10)]">
                    <iframe
                      src={embed}
                      title={ttl}
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="block h-[240px] w-full border-0"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="relative">
            <div className="px-11 sm:px-14">
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-300 ease-out"
                  style={{
                    transform: `translateX(-${currentIndex * 100}%)`,
                  }}
                >
                  {groups.map((group, groupIdx) => (
                    <div
                      key={groupIdx}
                      className="min-w-full"
                    >
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        {group.map((video, idx) => {
                          const embed =
                            video?.video_id
                              ? `https://www.youtube-nocookie.com/embed/${String(
                                  video.video_id
                                )}`
                              : toEmbedUrl(video?.url || "");

                          const ttl = video?.title || "Video";

                          return (
                            <div
                              key={video?.id || video?.uuid || `${groupIdx}-${idx}`}
                              className="w-full"
                            >
                              <div className="h-full overflow-hidden rounded-2xl bg-black shadow-[0_10px_22px_rgba(2,6,23,.10)]">
                                <iframe
                                  src={embed}
                                  title={ttl}
                                  loading="lazy"
                                  referrerPolicy="strict-origin-when-cross-origin"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                  className="block h-[240px] w-full border-0"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {hasMulti && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={currentIndex === 0}
                  aria-label="Previous"
                  className="absolute left-0 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border bg-white shadow-[0_12px_24px_rgba(2,6,23,.12)] transition disabled:cursor-not-allowed disabled:opacity-40 sm:h-[46px] sm:w-[46px]"
                  style={{ borderColor: "rgba(158,54,58,.22)" }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-[1.15rem] w-[1.15rem] text-black opacity-90"
                  >
                    <path
                      d="M15 18L9 12L15 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={goNext}
                  disabled={currentIndex === groups.length - 1}
                  aria-label="Next"
                  className="absolute right-0 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border bg-white shadow-[0_12px_24px_rgba(2,6,23,.12)] transition disabled:cursor-not-allowed disabled:opacity-40 sm:h-[46px] sm:w-[46px]"
                  style={{ borderColor: "rgba(158,54,58,.22)" }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-[1.15rem] w-[1.15rem] text-black opacity-90"
                  >
                    <path
                      d="M9 6L15 12L9 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default Alumni;