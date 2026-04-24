import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchRecruiters,
  selectRecruiters,
} from "../../redux/recruitersSlice";

const normalizeUrl = (url) => {
  const u = String(url || "").trim();
  if (!u) return "";
  if (/^(data:|blob:|https?:\/\/)/i.test(u)) return u;
  if (u.startsWith("//")) return `https:${u}`;
  if (u.startsWith("/")) return `${window.location.origin}${u}`;
  if (u.includes(".") && !u.includes(" ")) {
    return `https://${u.replace(/^\/+/, "")}`;
  }
  return `${window.location.origin}/${u.replace(/^\/+/, "")}`;
};

const pickLogo = (item) =>
  item?.logo_url_full ||
  item?.logo_url ||
  item?.image_url ||
  item?.image_full_url ||
  item?.logo ||
  item?.image ||
  item?.src ||
  item?.url ||
  item?.attachment?.url ||
  "";

export default function Recruiters() {
  const dispatch = useDispatch();

  const items = useSelector(selectRecruiters);
  const loading = useSelector((state) => state.recruiters?.loading ?? false);
  const error = useSelector((state) => state.recruiters?.error ?? null);

  useEffect(() => {
    dispatch(fetchRecruiters());
  }, [dispatch]);

  const previewItems = useMemo(() => {
    return Array.isArray(items) ? items.slice(0, 36) : [];
  }, [items]);

  const shouldAnimate = previewItems.length >= 10;
  const duration = Math.max(
    24,
    Math.min(70, Math.round(previewItems.length * 1.15))
  );

  return (
    <section className="mb-8">
      <div className="orc-home-shell orc-scope">
        <div className="orc-wrap">
          <div className="orc-head">
            <div>
              <h2 className="orc-title">
                <i className="fa-solid fa-building" />
                Our Recruiters
              </h2>
              <div className="orc-sub">
                Companies that recruit from our campus
              </div>
            </div>

            <a className="orc-viewall" href="/our-recruiters">
              View All <i className="fa-solid fa-arrow-right" />
            </a>
          </div>

          {loading ? (
            <div className="orc-skeleton">
              {Array.from({ length: 18 }).map((_, idx) => (
                <div className="orc-sk-tile" key={idx} />
              ))}
            </div>
          ) : error ? (
            <div className="orc-state">Failed to load recruiters.</div>
          ) : !previewItems.length ? (
            <div className="orc-state">No recruiters found.</div>
          ) : (
            <div className="orc-rail">
              <div className="orc-track" data-anim={shouldAnimate ? "1" : "0"}>
                {[0, 1].slice(0, shouldAnimate ? 2 : 1).map((copy) => (
                  <div className="orc-grid-wrap" key={copy}>
                    <div className="orc-grid">
                      {previewItems.map((item, index) => {
                        const name =
                          item?.name ||
                          item?.title ||
                          item?.company ||
                          item?.label ||
                          "Recruiter";

                        const rawLogo = pickLogo(item);
                        const logo = rawLogo ? normalizeUrl(rawLogo) : "";

                        return (
                          <a
                            className="orc-tile"
                            href="/our-recruiters"
                            aria-label="View all recruiters"
                            key={`${copy}-${item?.id || item?.uuid || index}`}
                          >
                            <span className="orc-tile__inner">
                              <span
                                className="orc-tile__fallback"
                                style={{ display: logo ? "none" : "flex" }}
                              >
                                {name}
                              </span>

                              {logo ? (
                                <img
                                  className="orc-logo"
                                  src={logo}
                                  alt={name}
                                  loading="lazy"
                                  decoding="async"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    e.currentTarget.remove();
                                    const fallback =
                                      e.currentTarget.parentElement?.querySelector(
                                        ".orc-tile__fallback"
                                      );
                                    if (fallback) fallback.style.display = "flex";
                                  }}
                                />
                              ) : null}
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <style>{`
          .orc-scope{
            --orc-brand: #8f2f2f;
            --orc-ink: #0f172a;
            --orc-muted: #64748b;
            --orc-page: #f6f7fb;
            --orc-card: #ffffff;
            --orc-line: rgba(15, 23, 42, .10);
            --orc-outer-line: rgba(201, 75, 80, .24);
            --orc-shadow: 0 10px 24px rgba(2, 6, 23, .08);
            --orc-marquee-duration: ${duration}s;
            --orc-tile-h: 110px;
          }

          .orc-home-shell{
            max-width: 100%;
            margin: 0 auto;
          }

          .orc-wrap{
            background: var(--surface);
            border: 1px solid var(--orc-outer-line);
            border-radius: 18px;
            padding: 24px 16px 24px;
            position: relative;
            overflow: hidden;
          }

          .orc-head{
            background: var(--orc-card);
            border: 1px solid var(--orc-line);
            border-radius: 20px;
            box-shadow: 0 6px 16px rgba(2,6,23,.04);
            padding: 18px 18px;
            margin-bottom: 16px;
            display: flex;
            gap: 12px;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
          }

          .orc-title{
            margin: 0;
            font-weight: 950;
            letter-spacing: .2px;
            color: var(--orc-ink);
            font-size: 28px;
            display: flex;
            align-items: center;
            gap: 12px;
            line-height: 1.1;
          }

          .orc-title i{
            width: 34px;
            height: 34px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 7px;
            background: var(--orc-brand);
            color: #fff;
            font-size: 15px;
          }

          .orc-sub{
            margin: 8px 0 0;
            color: var(--orc-muted);
            font-size: 14px;
            font-weight: 500;
          }

          .orc-viewall{
            border: 1px solid #d9e3e0;
            background: #fbfcfc;
            color: var(--orc-ink);
            border-radius: 999px;
            padding: 12px 20px;
            font-size: 14px;
            font-weight: 900;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 4px 10px rgba(2,6,23,.04);
            transition: all .2s ease;
            white-space: nowrap;
          }

          .orc-viewall:hover{
            transform: translateY(-1px);
            border-color: rgba(201,75,80,.35);
            color: var(--orc-brand);
          }

          .orc-rail{
            background: var(--orc-card);
            border: 1px solid var(--orc-line);
            border-radius: 18px;
            box-shadow: var(--orc-shadow);
            overflow: hidden;
            position: relative;
          }

          .orc-rail:before,
          .orc-rail:after{
            content:'';
            position:absolute;
            top:0;
            bottom:0;
            width:52px;
            z-index:3;
            pointer-events:none;
          }

          .orc-rail:before{
            left:0;
            background: linear-gradient(90deg, var(--orc-card), rgba(255,255,255,0));
          }

          .orc-rail:after{
            right:0;
            background: linear-gradient(270deg, var(--orc-card), rgba(255,255,255,0));
          }

          .orc-track{
            display:flex;
            width:max-content;
            will-change: transform;
          }

          .orc-track[data-anim="1"]{
            animation: orcGridMove var(--orc-marquee-duration) linear infinite;
          }

          .orc-rail:hover .orc-track[data-anim="1"]{
            animation-play-state: paused;
          }

          @keyframes orcGridMove{
            from{ transform: translateX(0); }
            to{ transform: translateX(-50%); }
          }

          .orc-grid-wrap{
            flex: 0 0 auto;
            width: min(1320px, calc(100vw - 56px));
            padding: 0;
            max-height: calc(var(--orc-tile-h) * 4);
            overflow: hidden;
          }

          .orc-grid{
            display:grid;
            grid-template-columns: repeat(9, minmax(0,1fr));
            align-items:stretch;
            gap:0;
            grid-auto-rows: var(--orc-tile-h);
            grid-auto-flow: dense;
          }

          .orc-tile{
            margin:0;
            border-radius:12px;
            overflow:hidden;
            background:#fff;
            border:1px solid rgba(15,23,42,.06);
            box-shadow: 0 1px 3px rgba(2,6,23,.06), 0 6px 12px rgba(2,6,23,.04);
            transition:all .2s cubic-bezier(.4,0,.2,1);
            height:var(--orc-tile-h);
            grid-column:span 1;
            grid-row:span 1;
            position:relative;
            outline:none;
            text-decoration:none;
            display:block;
          }

          .orc-tile:nth-child(12n + 2),
          .orc-tile:nth-child(12n + 4),
          .orc-tile:nth-child(12n + 6),
          .orc-tile:nth-child(12n + 7),
          .orc-tile:nth-child(12n + 9),
          .orc-tile:nth-child(12n + 11){
            grid-column: span 2;
          }

          .orc-tile:hover,
          .orc-tile:focus{
            transform:translateY(-3px);
            box-shadow: 0 4px 6px rgba(2,6,23,.08), 0 16px 28px rgba(2,6,23,.12);
            border-color: rgba(143,47,47,.20);
          }

          .orc-tile__inner{
            display:block;
            width:100%;
            height:100%;
            background:#fff;
          }

          .orc-tile img{
            width:100%;
            height:100%;
            object-fit:contain;
            object-position:center;
            display:block;
            padding:8px;
          }

          .orc-tile__fallback{
            height:100%;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:14px 12px;
            color:#64748b;
            font-weight:900;
            font-size:14px;
            text-align:center;
          }

          .orc-skeleton{
            display:grid;
            gap:14px;
            grid-template-columns:repeat(12, minmax(0,1fr));
          }

          .orc-sk-tile{
            --w:2;
            grid-column:span var(--w);
            background:#fff;
            border:1px solid var(--orc-line);
            box-shadow:var(--orc-shadow);
            border-radius:18px;
            overflow:hidden;
            position:relative;
            height:var(--orc-tile-h);
          }

          .orc-sk-tile:before{
            content:'';
            position:absolute;
            inset:0;
            transform:translateX(-60%);
            background:linear-gradient(90deg,transparent,rgba(148,163,184,.22),transparent);
            animation:orcSkMove 1.15s ease-in-out infinite;
          }

          @keyframes orcSkMove{
            to{ transform:translateX(60%); }
          }

          .orc-sk-tile:nth-child(6n + 1){ --w:1; }
          .orc-sk-tile:nth-child(6n + 2){ --w:2; }
          .orc-sk-tile:nth-child(6n + 3){ --w:1; }
          .orc-sk-tile:nth-child(6n + 4){ --w:2; }
          .orc-sk-tile:nth-child(6n + 5){ --w:3; }
          .orc-sk-tile:nth-child(6n + 6){ --w:3; }

          .orc-state{
            background:var(--orc-card);
            border:1px solid var(--orc-line);
            border-radius:16px;
            box-shadow:var(--orc-shadow);
            padding:18px;
            color:var(--orc-muted);
            text-align:center;
          }

          @media (max-width: 1200px){
            .orc-grid{ grid-template-columns: repeat(5, minmax(0,1fr)); }
          }

          @media (max-width: 992px){
            .orc-grid{ grid-template-columns: repeat(4, minmax(0,1fr)); }
          }

          @media (max-width: 768px){
            .orc-wrap{ padding: 16px 12px 16px; }
            .orc-grid{ grid-template-columns: repeat(3, minmax(0,1fr)); }
            .orc-title{ font-size: 24px; }
            .orc-grid-wrap{ width: min(1320px, calc(100vw - 48px)); }
          }

          @media (max-width: 520px){
            .orc-grid{ grid-template-columns: repeat(2, minmax(0,1fr)); }
            .orc-title{ font-size: 22px; }
          }

          @media (hover: none){
            .orc-rail{
              overflow-x:auto;
              -webkit-overflow-scrolling:touch;
            }

            .orc-track[data-anim="1"]{
              animation:none;
            }

            .orc-rail:before,
            .orc-rail:after{
              display:none;
            }

            .orc-rail::-webkit-scrollbar{
              display:none;
            }

            .orc-rail{
              scrollbar-width:none;
            }
          }
        `}</style>
      </div>
    </section>
  );
}