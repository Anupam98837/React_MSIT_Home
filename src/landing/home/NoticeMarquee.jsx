import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router";
import {
  fetchNoticeMarquee,
  selectNoticeMarquee,
} from "../../redux/noticeMarqueeSlice";
import newGif from "../../assets/noticeMarquee/new.gif";

const normalizePath = (url) => {
  const raw = String(url || "").trim();
  if (!raw) return "";

  if (/^(https?:\/\/|mailto:|tel:|sms:|whatsapp:)/i.test(raw)) {
    return raw;
  }

  let path = raw.startsWith("/") ? raw : `/${raw}`;
  path = path.replace(/\/placement_notices(?=\/|$)/gi, "/placement-notices");
  path = path.replace(/\/career_notices(?=\/|$)/gi, "/career-notices");
  path = path.replace(/\/why_us(?=\/|$)/gi, "/why-us");
  path = path.replace(/\/student_activities(?=\/|$)/gi, "/student-activities");

  return path;
};

const isExternalUrl = (url) =>
  /^(https?:\/\/|mailto:|tel:|sms:|whatsapp:)/i.test(String(url || "").trim());

const toFlag = (value, fallback = 1) => {
  if (value == null) return fallback === 1;
  return parseInt(value, 10) === 1;
};

function NoticeNode({ item }) {
  const href = normalizePath(item.url);
  const text = item.text;

  if (!href) {
    return <span className="nm-text">{text}</span>;
  }

  if (isExternalUrl(href)) {
    return (
      <a
        className="nm-link"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {text}
      </a>
    );
  }

  return (
    <Link className="nm-link" to={href}>
      {text}
    </Link>
  );
}

function NoticeItem({ item, showFrontGif, gifSrc }) {
  return (
    <span className="nm-item">
      {showFrontGif ? (
        <img
          className="nm-gif nm-gif--front"
          src={gifSrc}
          alt=""
          aria-hidden="true"
          draggable="false"
        />
      ) : null}

      <NoticeNode item={item} />

      <img
        className="nm-gif nm-gif--tail"
        src={gifSrc}
        alt=""
        aria-hidden="true"
        draggable="false"
      />
    </span>
  );
}

export default function NoticeMarquee() {
  const dispatch = useDispatch();
  const { items, settings, status, loading, error } =
    useSelector(selectNoticeMarquee);

  const viewportRef = useRef(null);
  const firstRunRef = useRef(null);

  const [metrics, setMetrics] = useState({
    distance: 0,
    duration: 0,
    singleFrom: 0,
    singleTo: 0,
    singleDuration: 0,
  });

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchNoticeMarquee());
    }
  }, [dispatch, status]);

  const notices = useMemo(
    () => (Array.isArray(items) ? items.filter((item) => item?.text) : []),
    [items]
  );

  const autoScroll = toFlag(settings?.auto_scroll, 1);
  const loop = toFlag(settings?.loop, 1);
  const pauseOnHover = toFlag(settings?.pause_on_hover, 1);
  const direction =
    String(settings?.direction ?? "left").toLowerCase() === "right"
      ? "right"
      : "left";

  const pxPerSec = Math.max(
    28,
    parseInt(settings?.scroll_speed ?? 70, 10) || 70
  );

  const noticeGif = newGif;

  useEffect(() => {
    const node = firstRunRef.current;
    const viewport = viewportRef.current;

    if (!node || !viewport || !notices.length || !autoScroll || !loop) {
      setMetrics({
        distance: 0,
        duration: 0,
        singleFrom: 0,
        singleTo: 0,
        singleDuration: 0,
      });
      return undefined;
    }

    let frameId = null;

    const updateMetrics = () => {
      if (frameId) cancelAnimationFrame(frameId);

      frameId = requestAnimationFrame(() => {
        const runWidth = node.scrollWidth || 0;
        const viewportWidth = viewport.clientWidth || 0;

        const multiDistance = runWidth;
        const multiDuration =
          multiDistance > 0 ? Math.max(multiDistance / pxPerSec, 10) : 0;

        const itemWidth = runWidth;
        const singleTravel = viewportWidth + itemWidth;
        const singleDuration =
          singleTravel > 0 ? Math.max(singleTravel / pxPerSec, 8) : 0;

        const singleFrom = direction === "left" ? viewportWidth : -itemWidth;
        const singleTo = direction === "left" ? -itemWidth : viewportWidth;

        setMetrics((prev) => {
          const next = {
            distance: multiDistance,
            duration: multiDuration,
            singleFrom,
            singleTo,
            singleDuration,
          };

          if (
            prev.distance === next.distance &&
            Math.abs(prev.duration - next.duration) < 0.05 &&
            prev.singleFrom === next.singleFrom &&
            prev.singleTo === next.singleTo &&
            Math.abs(prev.singleDuration - next.singleDuration) < 0.05
          ) {
            return prev;
          }

          return next;
        });
      });
    };

    updateMetrics();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateMetrics)
        : null;

    if (resizeObserver) {
      resizeObserver.observe(node);
      resizeObserver.observe(viewport);
    }

    window.addEventListener("resize", updateMetrics);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updateMetrics);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [notices, autoScroll, loop, pxPerSec, direction]);

  const shouldAnimateMulti =
    autoScroll && loop && notices.length > 1 && metrics.distance > 0;

  const shouldAnimateSingle =
    autoScroll && loop && notices.length === 1 && metrics.singleDuration > 0;

  const trackStyle = shouldAnimateMulti
    ? {
        "--nm-distance": `${metrics.distance}px`,
        "--nm-duration": `${metrics.duration}s`,
      }
    : shouldAnimateSingle
    ? {
        "--nm-single-from": `${metrics.singleFrom}px`,
        "--nm-single-to": `${metrics.singleTo}px`,
        "--nm-single-duration": `${metrics.singleDuration}s`,
      }
    : undefined;

  const primaryRunContent =
    notices.length > 0 ? (
      notices.map((item, index) => (
        <NoticeItem
          key={`${item.id ?? "notice"}-${index}`}
          item={item}
          showFrontGif={index === 0 && !!noticeGif}
          gifSrc={noticeGif}
        />
      ))
    ) : (
      <span className="nm-empty">
        {loading ? "Loading notices..." : error ? error : "No notices available."}
      </span>
    );

  const duplicateRunContent =
    notices.length > 0 ? (
      notices.map((item, index) => (
        <NoticeItem
          key={`dup-${item.id ?? "notice"}-${index}`}
          item={item}
          showFrontGif={false}
          gifSrc={noticeGif}
        />
      ))
    ) : null;

  return (
    <section className="notice-strip reveal is-in" data-anim="up">
      <style>{`
        .notice-strip{
          background:#ffd600;
          padding:5px 14px;
          overflow:hidden;
        }

        .notice-strip-row{
          display:flex;
          align-items:center;
          gap:12px;
          min-width:0;
        }

        .strip-ico{
          width:34px;
          height:34px;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          border-radius:999px;
          background:rgba(158,54,58,.12);
          color:#9E363A;
          border:1px solid rgba(158,54,58,.18);
          flex:0 0 auto;
        }

        .nm-viewport{
          overflow:hidden;
          width:100%;
          flex:1 1 auto;
          min-width:0;
          position:relative;
        }

        .nm-track{
          display:flex;
          align-items:center;
          width:max-content;
          will-change:transform;
          transform:translate3d(0,0,0);
          backface-visibility:hidden;
        }

        .nm-track--animate.nm-track--left{
          animation:nm-marquee-left var(--nm-duration) linear infinite;
        }

        .nm-track--animate.nm-track--right{
          animation:nm-marquee-right var(--nm-duration) linear infinite;
        }

        .nm-track--single-left{
          animation:nm-single-left var(--nm-single-duration) linear infinite;
        }

        .nm-track--single-right{
          animation:nm-single-right var(--nm-single-duration) linear infinite;
        }

        .nm-viewport:hover .nm-track--pause{
          animation-play-state:paused;
        }

        .nm-run{
          display:inline-flex;
          align-items:center;
          white-space:nowrap;
          flex:0 0 auto;
        }

        .nm-item{
          display:inline-flex;
          align-items:center;
          gap:10px;
          white-space:nowrap;
          padding-right:22px;
          flex:0 0 auto;
        }

        .nm-text,
        .nm-link{
          color:#7a2626;
          font-size:14.5px;
          font-family:'Poppins';
          font-weight:950;
          line-height:1.15;
          letter-spacing:.1px;
          text-decoration:none;
        }

        .nm-link:hover{
          color:#0D29AC;
        }

        .nm-gif{
          width:45px;
          height:30px;
          object-fit:contain;
          display:inline-block;
          vertical-align:middle;
          flex:0 0 auto;
          filter:drop-shadow(0 1px 0 rgba(0,0,0,.08));
          user-select:none;
          pointer-events:none;
        }

        .nm-empty{
          color:#7a2626;
          font-size:14.5px;
          font-weight:950;
          white-space:nowrap;
        }

        @keyframes nm-marquee-left{
          from{
            transform:translate3d(0,0,0);
          }
          to{
            transform:translate3d(calc(-1 * var(--nm-distance)),0,0);
          }
        }

        @keyframes nm-marquee-right{
          from{
            transform:translate3d(calc(-1 * var(--nm-distance)),0,0);
          }
          to{
            transform:translate3d(0,0,0);
          }
        }

        @keyframes nm-single-left{
          from{
            transform:translate3d(var(--nm-single-from),0,0);
          }
          to{
            transform:translate3d(var(--nm-single-to),0,0);
          }
        }

        @keyframes nm-single-right{
          from{
            transform:translate3d(var(--nm-single-from),0,0);
          }
          to{
            transform:translate3d(var(--nm-single-to),0,0);
          }
        }

        @media (prefers-reduced-motion: reduce){
          .nm-track--animate,
          .nm-track--single-left,
          .nm-track--single-right{
            animation:none !important;
            transform:none !important;
          }
        }
      `}</style>

      <div className="notice-strip-row">
        <div className="strip-ico">
          <i className="fa-solid fa-bullhorn" aria-hidden="true" />
        </div>

        <div ref={viewportRef} className="nm-viewport" id="noticeMarqueeViewport">
          <div
            className={[
              "nm-track",
              shouldAnimateMulti ? "nm-track--animate" : "",
              shouldAnimateMulti ? `nm-track--${direction}` : "",
              shouldAnimateSingle ? `nm-track--single-${direction}` : "",
              (shouldAnimateMulti || shouldAnimateSingle) && pauseOnHover
                ? "nm-track--pause"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={trackStyle}
            id="noticeMarqueeTrack"
          >
            <div ref={firstRunRef} className="nm-run" data-run="1">
              {primaryRunContent}
            </div>

            {shouldAnimateMulti ? (
              <div className="nm-run" data-run="2" aria-hidden="true">
                {duplicateRunContent}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}