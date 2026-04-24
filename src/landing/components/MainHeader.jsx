import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { fetchMainHeaderData, selectMainHeader } from "../../redux/headerSlice";

const makeLoop = (items) => (items.length > 2 ? [...items, ...items] : items);

function LogoMarquee({
  items,
  wrapperClassName = "",
  marqueeClassName = "",
  imageClassName = "",
  durationBase = 18,
}) {
  const cleanItems = useMemo(
    () => (items || []).filter((item) => item?.src),
    [items]
  );

  const duration = useMemo(() => {
    if (cleanItems.length <= 2) return 0;
    return Math.max(10, Math.min(30, cleanItems.length * 3.6 + durationBase / 2));
  }, [cleanItems, durationBase]);

  return (
    <div className={`mh-marquee ${wrapperClassName}`.trim()}>
      <div className={`mh-track ${cleanItems.length > 2 ? "mh-track-run" : ""} ${marqueeClassName}`.trim()}
        style={{ "--mh-duration": `${duration}s` }}
      >
        {makeLoop(cleanItems).map((item, index) => (
          <img
            key={`${item.src}-${index}`}
            src={item.src}
            alt={item.alt || "logo"}
            className={imageClassName}
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
}

function MainHeader() {
  const dispatch = useDispatch();
  const { item, status } = useSelector(selectMainHeader);

  const [rotateIndex, setRotateIndex] = useState(0);
  const [rotateText, setRotateText] = useState("");
  const [isFading, setIsFading] = useState(false);

  const fadeTimeoutRef = useRef(null);
  const rotateIntervalRef = useRef(null);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchMainHeaderData());
    }
  }, [dispatch, status]);

  const rotatingTexts = useMemo(() => {
    if (!Array.isArray(item?.rotatingTexts)) return [];
    return item.rotatingTexts
      .map((text) => (text ?? "").toString().trim())
      .filter(Boolean);
  }, [item?.rotatingTexts]);

  useEffect(() => {
    setRotateIndex(0);
    setRotateText(rotatingTexts[0] || "");
    setIsFading(false);
  }, [item?.id, rotatingTexts]);

  useEffect(() => {
    if (!rotatingTexts.length) {
      setRotateText("");
      return;
    }
    setRotateText(rotatingTexts[rotateIndex] || "");
  }, [rotateIndex, rotatingTexts]);

  useEffect(() => {
    if (fadeTimeoutRef.current) {
      window.clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }

    if (rotateIntervalRef.current) {
      window.clearInterval(rotateIntervalRef.current);
      rotateIntervalRef.current = null;
    }

    if (rotatingTexts.length <= 1) return undefined;

    rotateIntervalRef.current = window.setInterval(() => {
      setIsFading(true);

      fadeTimeoutRef.current = window.setTimeout(() => {
        setRotateIndex((prev) => (prev + 1) % rotatingTexts.length);
        setIsFading(false);
      }, 180);
    }, 2600);

    return () => {
      if (fadeTimeoutRef.current) {
        window.clearTimeout(fadeTimeoutRef.current);
        fadeTimeoutRef.current = null;
      }
      if (rotateIntervalRef.current) {
        window.clearInterval(rotateIntervalRef.current);
        rotateIntervalRef.current = null;
      }
    };
  }, [rotatingTexts]);

  const loading = status === "loading" || (status === "idle" && !item);
  const hasAdmissionLink = Boolean(item?.admissionLink);

  return (
    <>
      <style>
        {`
          :root{
            --mh-red: var(--primary-color, #9E363A);
            --mh-red-dark: var(--secondary-color, #6B2528);
            --mh-ink: #111827;
            --mh-muted: #6B7280;
            --mh-line: #E5E7EB;
            --mh-bg: #FFFFFF;
          }

          .mh-bar,
          .mh-bar *{
            box-sizing:border-box;
          }

          .mh-bar{
            width:100%;
            background:var(--mh-bg);
            overflow:visible;
          }

          .mh-inner{
            max-width:1400px;
            margin:0 auto;
            padding:8px 10px;
            display:flex;
            align-items:center;
            gap:16px;
            flex-wrap:nowrap;
            min-width:0;
          }

          .mh-sec1{
            flex:0 0 auto;
            display:flex;
            align-items:center;
            justify-content:center;
          }

          .mh-primary-logo{
            width:92px;
            height:92px;
            object-fit:contain;
            display:block;
          }

          .mh-sec2{
            flex:1 1 auto;
            min-width:0;
            display:flex;
            flex-direction:column;
            justify-content:center;
            gap:6px;
          }

          .mh-title{
            display:block;
            color:var(--mh-red);
            font-weight:700;
            text-transform:uppercase;
            letter-spacing:.6px;
            line-height:1.08;
            font-size:clamp(14px, 2.8vw, 36px);
            padding-bottom:7px;
            border-bottom:3px solid var(--mh-red);
            white-space:nowrap;
            overflow:hidden;
            text-overflow:clip;
          }

          .mh-subrow{
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:16px;
            min-width:0;
          }

          .mh-rotate{
            flex:1 1 auto;
            min-width:0;
            color:var(--mh-red);
            font-size:1.05rem;
            font-weight:400;
            line-height:1.2;
            white-space:normal;
            overflow:visible;
            text-overflow:clip;
            overflow-wrap:anywhere;
            transition:opacity .18s ease, transform .18s ease, color .15s ease .10s;
          }

          .mh-rotate.is-fading{
            opacity:0;
            transform:translateY(-2px);
          }

          .mh-rotate:hover{
            color:#0D29AC;
            cursor:pointer;
          }

          .mh-affil-wrap{
            flex:0 0 380px;
            max-width:380px;
          }

          .mh-affil-marquee{
            height:36px;
          }

          .mh-affil-logo,
          .mh-partner-logo{
            width:35px;
            height:35px;
            object-fit:contain;
            display:block;
            padding:1px;
            border:1px solid var(--mh-line);
            border-radius:5px;
            background:var(--mh-bg);
          }

          .mh-sec3{
            display:flex;
            align-items:center;
            justify-content:flex-end;
            flex:0 0 auto;
          }

          .mh-secondary-logo{
            max-height:92px;
            width:auto;
            object-fit:contain;
            display:block;
          }

          .mh-sec4{
            flex:0 0 240px;
            min-width:200px;
            display:flex;
            flex-direction:column;
            align-items:stretch;
            justify-content:center;
            gap:10px;
          }

          .mh-partner-marquee{
            height:40px;
          }

          .mh-admission-row{
            display:flex;
            align-items:center;
            justify-content:flex-end;
          }

          .mh-admission{
            flex:0 0 auto;
            display:flex;
            align-items:center;
            justify-content:flex-end;
            text-decoration:none;
          }

          .mh-badge{
            height:56px;
            width:auto;
            object-fit:contain;
            display:block;
            transition:transform .12s ease, filter .12s ease;
          }

          .mh-admission:hover .mh-badge{
            transform:translateY(-1px);
            filter:drop-shadow(0 6px 14px rgba(0,0,0,.12));
          }

          .mh-marquee{
            position:relative;
            overflow:hidden;
            border-radius:10px;
            background:transparent;
            width:100%;
          }

          .mh-marquee::before,
          .mh-marquee::after{
            content:"";
            position:absolute;
            top:0;
            bottom:0;
            width:22px;
            pointer-events:none;
            z-index:2;
          }

          .mh-marquee::before{
            left:0;
            background:linear-gradient(to right, var(--mh-bg), rgba(255,255,255,0));
          }

          .mh-marquee::after{
            right:0;
            background:linear-gradient(to left, var(--mh-bg), rgba(255,255,255,0));
          }

          .mh-track{
            display:flex;
            align-items:center;
            width:max-content;
            gap:14px;
            will-change:transform;
          }

          @keyframes mh-scroll{
            from { transform:translateX(0); }
            to { transform:translateX(-50%); }
          }

          .mh-track-run{
            animation:mh-scroll var(--mh-duration, 18s) linear infinite;
          }

          .mh-track-run:hover{
            animation-play-state:paused;
          }

          .mh-skel{
            background:linear-gradient(90deg, #f3f4f6, #e5e7eb, #f3f4f6);
            background-size:200% 100%;
            animation:mh-skel 1.1s ease-in-out infinite;
            border-radius:10px;
          }

          @keyframes mh-skel{
            0%{ background-position:200% 0; }
            100%{ background-position:-200% 0; }
          }

          .mh-title-skel{
            height:46px;
            width:92%;
            border-bottom:none;
          }

          .mh-rotate-skel{
            height:22px;
            width:55%;
          }

          .mh-affil-skel{
            height:36px;
            width:100%;
          }

          .mh-partner-skel{
            height:40px;
            width:100%;
          }

          .mh-secondary-skel{
            height:86px;
            width:170px;
          }

          .mh-badge-skel{
            height:56px;
            width:230px;
          }

          @media (max-width:1250px){
            .mh-title{
              font-size:clamp(14px, 2.4vw, 30px) !important;
            }
          }

          @media (max-width:1100px){
            .mh-affil-wrap{
              flex-basis:320px;
              max-width:320px;
            }

            .mh-sec4{
              flex-basis:230px;
              min-width:210px;
            }

            .mh-secondary-logo{
              max-height:84px;
            }
          }

          @media (max-width:992px){
            .mh-sec3,
            .mh-sec4,
            .mh-affil-wrap{
              display:none !important;
            }

            .mh-subrow{
              justify-content:flex-start;
            }
          }

          @media (max-width:920px){
            .mh-inner{
              gap:12px;
              padding:8px 10px;
            }

            .mh-primary-logo{
              width:78px;
              height:78px;
            }

            .mh-title{
              border-bottom-width:2px;
            }

            .mh-subrow{
              gap:10px;
            }
          }

          @media (max-width:520px){
            .mh-inner{
              gap:10px;
              padding:8px 8px;
            }

            .mh-primary-logo{
              width:68px;
              height:68px;
            }

            .mh-title{
              font-size:clamp(10px, 3.2vw, 16px) !important;
              letter-spacing:.2px !important;
              padding-bottom:6px;
              border-bottom-width:2px;
            }

            .mh-rotate{
              font-size:.7rem;
            }
          }

          @media (prefers-reduced-motion: reduce){
            .mh-track-run,
            .mh-skel{
              animation:none !important;
            }

            .mh-rotate{
              transition:none !important;
            }
          }
        `}
      </style>

      <header className="mh-bar">
        <div className="mh-inner">
          <div className="mh-sec1">
            {loading ? (
              <div className="mh-primary-logo mh-skel" />
            ) : item?.primaryLogo ? (
              <Link to="/">
                <img
                  src={item.primaryLogo}
                  alt="Primary logo"
                  className="mh-primary-logo"
                />
              </Link>
            ) : null}
          </div>

          <div className="mh-sec2">
            {loading ? (
              <div className="mh-title-skel mh-skel" />
            ) : (
              <div className="mh-title">
                {item?.headerText}
              </div>
            )}

            <div className="mh-subrow">
              <div className={`mh-rotate ${isFading ? "is-fading" : ""}`.trim()}>
                {loading ? <div className="mh-rotate-skel mh-skel" /> : rotateText}
              </div>

              <div className="mh-affil-wrap">
                {loading ? (
                  <div className="mh-affil-skel mh-skel" />
                ) : (
                  <LogoMarquee
                    items={item?.affiliationLogos || []}
                    wrapperClassName="mh-affil-marquee"
                    imageClassName="mh-affil-logo"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="mh-sec3">
            {loading ? (
              <div className="mh-secondary-skel mh-skel" />
            ) : item?.secondaryLogo ? (
              <img
                src={item.secondaryLogo}
                alt="Secondary logo"
                className="mh-secondary-logo"
              />
            ) : null}
          </div>

          <div className="mh-sec4">
            {loading ? (
              <div className="mh-partner-skel mh-skel" />
            ) : (
              <LogoMarquee
                items={item?.partnerRecruiters || []}
                wrapperClassName="mh-partner-marquee"
                imageClassName="mh-partner-logo"
              />
            )}

            <div className="mh-admission-row">
              {loading ? (
                <div className="mh-badge-skel mh-skel" />
              ) : item?.admissionBadge ? (
                <a
                  href={hasAdmissionLink ? item.admissionLink : "#"}
                  target={hasAdmissionLink ? "_blank" : undefined}
                  rel={hasAdmissionLink ? "noopener noreferrer" : undefined}
                  className="mh-admission"
                  style={
                    hasAdmissionLink
                      ? undefined
                      : { pointerEvents: "none", opacity: 0.85 }
                  }
                >
                  <img
                    src={item.admissionBadge}
                    alt="Admission badge"
                    className="mh-badge"
                  />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export default MainHeader;