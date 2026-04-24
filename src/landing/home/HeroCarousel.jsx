import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchHeroCarouselData,
  selectHeroCarousel,
} from "../../redux/heroCarouselSlice";

function HeroIndicators({ count, activeIndex, onChange }) {
  if (count <= 1) return null;

  return (
    <div className="hc-hero-carousel__indicators">
      {Array.from({ length: count }).map((_, index) => (
        <button
          key={`hero-indicator-${index}`}
          type="button"
          className={[
            "hc-hero-carousel__indicator",
            activeIndex === index ? "is-active" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-label={`Slide ${index + 1}`}
          aria-current={activeIndex === index ? "true" : undefined}
          onClick={() => onChange(index)}
        />
      ))}
    </div>
  );
}

function HeroControls({ onPrev, onNext }) {
  return (
    <>
      <button
        type="button"
        className="hc-hero-carousel__control hc-hero-carousel__control--prev"
        aria-label="Previous slide"
        onClick={onPrev}
      >
        <span className="fa-solid fa-chevron-left" aria-hidden="true" />
      </button>

      <button
        type="button"
        className="hc-hero-carousel__control hc-hero-carousel__control--next"
        aria-label="Next slide"
        onClick={onNext}
      >
        <span className="fa-solid fa-chevron-right" aria-hidden="true" />
      </button>
    </>
  );
}

function HeroSlideItem({ item, isMobile, isFallback = false }) {
  const backgroundSource =
    isMobile && item?.mobileImage
      ? item.mobileImage
      : item?.desktopImage || item?.mobileImage || "";

  const hasKicker = Boolean(item?.altText);
  const hasTitle = Boolean(String(item?.overlayHtml || "").trim());
  const hasOverlay = hasKicker || hasTitle;

  const backgroundStyle = backgroundSource
    ? { backgroundImage: `url(${backgroundSource})` }
    : {
        backgroundImage:
          "linear-gradient(135deg, rgba(158,54,58,.95), rgba(107,37,40,.92))",
      };

  return (
    <article
      className={[
        "hc-hero-carousel__slide",
        hasOverlay ? "has-overlay" : "",
        isFallback ? "is-fallback" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={backgroundStyle}
    >
      <div className="hc-hero-carousel__content">
        {hasKicker ? (
          <div className="hc-hero-carousel__kicker">
            <i className="fa-solid fa-graduation-cap" aria-hidden="true" />
            <span>{item.altText}</span>
          </div>
        ) : null}

        {hasTitle ? (
          <div
            className="hc-hero-carousel__title"
            dangerouslySetInnerHTML={{ __html: item.overlayHtml }}
          />
        ) : null}

        {isFallback ? (
          <div className="hc-hero-carousel__actions">
            <Link to="/admissions" className="hc-hero-carousel__button">
              Apply Now
            </Link>
            <Link to="/courses" className="hc-hero-carousel__button">
              Explore Programs
            </Link>
          </div>
        ) : null}
      </div>
    </article>
  );
}

const getInitialIsMobile = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(max-width: 768px)").matches;
};

export default function HeroCarousel() {
  const dispatch = useDispatch();
  const heroData = useSelector(selectHeroCarousel);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(getInitialIsMobile);

  useEffect(() => {
    dispatch(fetchHeroCarouselData());
  }, [dispatch]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const media = window.matchMedia("(max-width: 768px)");
    const updateViewport = (event) => setIsMobile(event.matches);

    setIsMobile(media.matches);

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", updateViewport);
      return () => media.removeEventListener("change", updateViewport);
    }

    media.addListener(updateViewport);
    return () => media.removeListener(updateViewport);
  }, []);

  const slides = useMemo(() => {
    if (heroData.items.length) return heroData.items;

    return [
      {
        id: "hero-fallback",
        desktopImage: "",
        mobileImage: "",
        altText: "",
        overlayHtml: "",
        isFallback: true,
      },
    ];
  }, [heroData.items]);

  useEffect(() => {
    setActiveIndex((current) => {
      if (current <= slides.length - 1) return current;
      return 0;
    });
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    if (!heroData.settings.autoplay) return undefined;
    if (heroData.settings.pauseOnHover && isHovered) return undefined;
    if (!heroData.settings.loop && activeIndex === slides.length - 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        const next = current + 1;

        if (next >= slides.length) {
          return heroData.settings.loop ? 0 : current;
        }

        return next;
      });
    }, heroData.settings.autoplayDelayMs);

    return () => window.clearInterval(timer);
  }, [
    activeIndex,
    heroData.settings.autoplay,
    heroData.settings.autoplayDelayMs,
    heroData.settings.loop,
    heroData.settings.pauseOnHover,
    isHovered,
    slides.length,
  ]);

  const goToSlide = (index) => setActiveIndex(index);

  const goToPrev = () => {
    setActiveIndex((current) => {
      if (current === 0) {
        return heroData.settings.loop ? slides.length - 1 : 0;
      }
      return current - 1;
    });
  };

  const goToNext = () => {
    setActiveIndex((current) => {
      if (current === slides.length - 1) {
        return heroData.settings.loop ? 0 : current;
      }
      return current + 1;
    });
  };

  const isFadeMode = heroData.settings.transition === "fade";
  const showControls = heroData.settings.showArrows && slides.length > 1;
  const showIndicators = heroData.settings.showDots && slides.length > 1;

  return (
    <section className="hc-hero-carousel">
      <style>
        {`
          .hc-hero-carousel {
            --hc-hero-brand: #9E363A;
            --hc-hero-brand-dark: #6B2528;
            --hc-hero-accent: #C94B50;
            --hc-hero-surface: #ffffff;
            --hc-hero-transition-ms: 600ms;
            position: relative;
            width: 100%;
            overflow: hidden;
            background: var(--hc-hero-surface);
          }

          .hc-hero-carousel__viewport {
            position: relative;
            overflow: hidden;
            background: var(--hc-hero-surface);
          }

          .hc-hero-carousel__track {
            display: flex;
            width: 100%;
          }

          .hc-hero-carousel__track.is-slide {
            transition: transform var(--hc-hero-transition-ms) ease-in-out;
          }

          .hc-hero-carousel__track.is-fade {
            position: relative;
            display: block;
            min-height: 500px;
          }

          .hc-hero-carousel__item {
            position: relative;
            width: 100%;
            flex: 0 0 100%;
          }

          .hc-hero-carousel__track.is-fade .hc-hero-carousel__item {
            position: absolute;
            inset: 0;
            opacity: 0;
            pointer-events: none;
            transition: opacity var(--hc-hero-transition-ms) ease-in-out;
          }

          .hc-hero-carousel__track.is-fade .hc-hero-carousel__item.is-active {
            opacity: 1;
            pointer-events: auto;
            position: relative;
          }

          .hc-hero-carousel__slide {
            position: relative;
            min-height: 500px;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
          }

          .hc-hero-carousel__slide::before {
            content: "";
            position: absolute;
            inset: 0;
            opacity: 0;
            pointer-events: none;
            transition: opacity .25s ease;
          }

          .hc-hero-carousel__slide.has-overlay::before {
            opacity: 1;
            background: linear-gradient(90deg, rgba(0,0,0,.65), rgba(0,0,0,.20));
          }

          .hc-hero-carousel__content {
            position: relative;
            z-index: 1;
            max-width: 980px;
            padding: 60px 40px;
            color: #ffffff;
          }

          .hc-hero-carousel__kicker {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 20px;
            border: 1px solid rgba(255,255,255,.25);
            border-radius: 999px;
            background: rgba(255,255,255,.16);
            padding: 8px 16px;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: .4px;
          }

          .hc-hero-carousel__title {
            margin: 0;
            color: #ffffff;
          }

          .hc-hero-carousel__title p,
          .hc-hero-carousel__title h1,
          .hc-hero-carousel__title h2,
          .hc-hero-carousel__title h3,
          .hc-hero-carousel__title h4,
          .hc-hero-carousel__title h5,
          .hc-hero-carousel__title h6 {
            margin: 0 0 16px;
            color: inherit;
          }

          .hc-hero-carousel__title > *:last-child {
            margin-bottom: 0;
          }

          .hc-hero-carousel__title:where(:not(.keep-backend-font-size)) {
            font-size: clamp(28px, 4vw, 52px);
            font-weight: 900;
            line-height: 1.1;
          }

          .hc-hero-carousel__title ul,
          .hc-hero-carousel__title ol {
            margin: 10px 0 0 24px;
          }

          .hc-hero-carousel__actions {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 20px;
          }

          .hc-hero-carousel__button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 48px;
            border: 0;
            border-radius: 12px;
            background: var(--hc-hero-accent);
            padding: 12px 24px;
            color: #ffffff;
            font-size: 15px;
            font-weight: 800;
            text-decoration: none;
            transition: background .18s ease, transform .18s ease;
          }

          .hc-hero-carousel__button:hover {
            background: var(--hc-hero-brand);
            color: #ffffff;
            transform: translateY(-1px);
          }

          .hc-hero-carousel__indicators {
            position: absolute;
            left: 50%;
            bottom: 18px;
            z-index: 2;
            display: flex;
            align-items: center;
            gap: 8px;
            transform: translateX(-50%);
          }

          .hc-hero-carousel__indicator {
            width: 10px;
            height: 10px;
            border: 0;
            border-radius: 999px;
            background: rgba(255,255,255,.55);
            transition: transform .18s ease, background .18s ease;
          }

          .hc-hero-carousel__indicator.is-active {
            background: #ffffff;
            transform: scale(1.12);
          }

          .hc-hero-carousel__control {
            position: absolute;
            top: 50%;
            z-index: 2;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 46px;
            height: 46px;
            border: 1px solid rgba(158,54,58,.22);
            border-radius: 999px;
            background: rgba(255,255,255,.92);
            color: #111111;
            transform: translateY(-50%);
            box-shadow: 0 12px 24px rgba(2,6,23,.12);
            transition: background .18s ease, transform .18s ease;
          }

          .hc-hero-carousel__control:hover {
            background: #ffffff;
          }

          .hc-hero-carousel__control--prev {
            left: 18px;
          }

          .hc-hero-carousel__control--next {
            right: 18px;
          }

          .hc-hero-carousel__status {
            position: absolute;
            right: 16px;
            top: 16px;
            z-index: 2;
            border-radius: 999px;
            background: rgba(255,255,255,.92);
            padding: 6px 12px;
            color: var(--hc-hero-brand-dark);
            font-size: 12px;
            font-weight: 800;
            letter-spacing: .2px;
          }

          @media (max-width: 991.98px) {
            .hc-hero-carousel__slide,
            .hc-hero-carousel__track.is-fade {
              min-height: 380px;
            }
          }

          @media (max-width: 768px) {
            .hc-hero-carousel__slide,
            .hc-hero-carousel__track.is-fade {
              min-height: 280px;
            }

            .hc-hero-carousel__content {
              padding: 40px 24px;
            }

            .hc-hero-carousel__control {
              width: 40px;
              height: 40px;
            }

            .hc-hero-carousel__control--prev {
              left: 12px;
            }

            .hc-hero-carousel__control--next {
              right: 12px;
            }
          }
        `}
      </style>

      <div
        className="hc-hero-carousel__viewport"
        onMouseEnter={() => {
          if (heroData.settings.pauseOnHover) setIsHovered(true);
        }}
        onMouseLeave={() => setIsHovered(false)}
      >
        {heroData.status === "loading" ? (
          <div className="hc-hero-carousel__status">Loading hero…</div>
        ) : null}

        <div
          className={[
            "hc-hero-carousel__track",
            isFadeMode ? "is-fade" : "is-slide",
          ].join(" ")}
          style={{
            transform: isFadeMode
              ? undefined
              : `translateX(-${activeIndex * 100}%)`,
            "--hc-hero-transition-ms": `${heroData.settings.transitionMs}ms`,
          }}
        >
          {slides.map((item, index) => (
            <div
              key={item.id || `hero-slide-${index}`}
              className={[
                "hc-hero-carousel__item",
                activeIndex === index ? "is-active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-hidden={activeIndex === index ? "false" : "true"}
            >
              <HeroSlideItem
                item={item}
                isMobile={isMobile}
                isFallback={Boolean(item?.isFallback)}
              />
            </div>
          ))}
        </div>

        {showControls ? (
          <HeroControls onPrev={goToPrev} onNext={goToNext} />
        ) : null}

        {showIndicators ? (
          <HeroIndicators
            count={slides.length}
            activeIndex={activeIndex}
            onChange={goToSlide}
          />
        ) : null}
      </div>
    </section>
  );
}