import { useEffect, useRef, useState } from "react";

const DEFAULT_ROOT_MARGIN = "900px 0px";

export default function LazySection({
  children,
  minHeight = 240,
  className = "",
  rootMargin = DEFAULT_ROOT_MARGIN,
  once = true,
  fallback = null,
  eager = false,
}) {
  const containerRef = useRef(null);
  const animationFrameRef = useRef(0);
  const [isVisible, setIsVisible] = useState(Boolean(eager));
  const [isAnimatedIn, setIsAnimatedIn] = useState(Boolean(eager));

  useEffect(() => {
    if (!isVisible) {
      setIsAnimatedIn(false);
      return undefined;
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      setIsAnimatedIn(true);
    });

    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isVisible]);

  useEffect(() => {
    if (eager) {
      setIsVisible(true);
      return undefined;
    }

    const node = containerRef.current;
    if (!node || isVisible) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;

        setIsVisible(true);
        if (once) observer.disconnect();
      },
      { rootMargin, threshold: 0.01 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [eager, isVisible, once, rootMargin]);

  return (
    <section
      ref={containerRef}
      className={className}
      style={{ minHeight: isVisible ? undefined : minHeight }}
    >
      {isVisible ? (
        <div
          className={`transform transition-all duration-700 ease-out will-change-transform ${
            isAnimatedIn ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          {children}
        </div>
      ) : (
        <div className="opacity-100">{fallback}</div>
      )}
    </section>
  );
}
