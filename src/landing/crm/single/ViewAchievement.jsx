import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";

/* Layout */
import TopHeaderMenu from "../../components/TopHeaderMenu";
import MainHeader from "../../components/MainHeader";
import HeaderMenu from "../../components/HeaderMenu";
import Footer from "../../components/Footer";

/* Lazy */
import LazySection from "../../../components/LazySection";

/* Redux */
import {
  fetchAchievementView,
  clearAchievementView,
  selectAchievementView,
  resolveUrl,
  parseAttachments,
  formatDate,
} from "../../../redux/crm/single/achievementViewSlice";

/* ✅ EXACT SAME CSS AS PLACEMENT NOTICE */
const styles = `
body{
  background:#eef3f3;
}

.announcement-container{
  max-width:1100px;
  margin:40px auto;
  padding:20px;
}

.announcement-header{
  background:#fff;
  border-radius:14px;
  padding:32px;
  border:1px solid #e5e5e5;
  box-shadow:0 8px 20px rgba(0,0,0,0.05);
}

.announcement-headbar{
  display:flex;
  justify-content:space-between;
  align-items:center;
  flex-wrap:wrap;
  gap:10px;
}

.announcement-title{
  font-size:32px;
  font-weight:800;
  color:#111;
  margin:0;
}

.meta-pill{
  border:1px solid #ddd;
  padding:8px 16px;
  border-radius:30px;
  background:#f9f9f9;
  font-size:14px;
}

.announcement-content{
  margin-top:25px;
  line-height:1.8;
  color:#333;
}

.announcement-actions{
  margin-top:25px;
  display:flex;
  flex-wrap:wrap;
  gap:10px;
}

.action-btn{
  border:1px solid #ccc;
  padding:8px 16px;
  border-radius:25px;
  background:#fff;
  cursor:pointer;
  transition:all .3s ease;
  text-decoration:none;
  color:#111;
  display:inline-flex;
  align-items:center;
  gap:8px;
}

.action-btn:hover{
  background:#a52a2a;
  color:#fff;
}

.announcement-cover{
  margin-top:30px;
}

.announcement-cover img{
  width:100%;
  border-radius:12px;
  display:block;
}

.announcement-attachments{
  margin-top:30px;
}

.attachments-title{
  margin:0 0 14px;
  font-size:18px;
  font-weight:700;
}

.attachments-list{
  display:grid;
  gap:12px;
}

.attachment-item{
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:12px 14px;
  border:1px solid #eee;
  border-radius:10px;
  text-decoration:none;
  color:#000;
  background:#fff;
  transition:all .3s ease;
}

.attachment-item:hover{
  background:#fafafa;
  transform:translateY(-1px);
}

.attachment-left{
  display:flex;
  gap:10px;
  align-items:center;
  min-width:0;
}

.attachment-icon{
  width:40px;
  height:40px;
  display:flex;
  align-items:center;
  justify-content:center;
  background:#f5f5f5;
  border-radius:6px;
  flex-shrink:0;
}

.attachment-info{
  min-width:0;
}

.attachment-name{
  font-weight:600;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

.attachment-meta{
  font-size:12px;
  color:#666;
}

.loading-container{
  padding:40px 0;
  display:grid;
  gap:12px;
}

.loading-bar{
  height:12px;
  background:#eee;
  border-radius:6px;
}

.error-container{
  text-align:center;
  padding:40px;
}

.error-message{
  color:#555;
}
`;

export default function ViewAchievement() {
  const dispatch = useDispatch();
  const { slug } = useParams();

  const { achievement, loading, error } =
    useSelector(selectAchievementView);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (slug) dispatch(fetchAchievementView(slug));
    return () => dispatch(clearAchievementView());
  }, [dispatch, slug]);

  const date = formatDate(
    achievement?.publish_at ||
    achievement?.created_at ||
    achievement?.updated_at
  );

  const attachments = useMemo(
    () => parseAttachments(achievement?.attachments_json),
    [achievement]
  );

  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Copy failed.");
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: document.title,
          url: window.location.href,
        });
      }
    } catch {}
  };

  return (
    <>
      <style>{styles}</style>

      <TopHeaderMenu />
      <MainHeader />
      <HeaderMenu />

      <main className="announcement-container">
        <div className="announcement-header">

          {/* HEADER */}
          <div className="announcement-headbar">
            <h1 className="announcement-title">
              {achievement?.title || "Achievement"}
            </h1>

            {date && <span className="meta-pill">{date}</span>}
          </div>

          {/* CONTENT */}
          <LazySection eager minHeight={0}>
            <div
              className="announcement-content"
              dangerouslySetInnerHTML={{
                __html: achievement?.body || "<p>No details available.</p>",
              }}
            />
          </LazySection>

          {/* ACTIONS */}
          <div className="announcement-actions">
            <button className="action-btn" onClick={handleCopy}>
              <i className="fa-solid fa-link"></i>
              {copied ? "Copied!" : "Copy Link"}
            </button>

            {canShare && (
              <button className="action-btn" onClick={handleShare}>
                <i className="fa-solid fa-share-nodes"></i>
                Share
              </button>
            )}
          </div>
        </div>

        {/* COVER */}
        {achievement?.cover_image && (
          <LazySection minHeight={280}>
            <figure className="announcement-cover">
              <img
                src={resolveUrl(achievement.cover_image)}
                alt="Cover"
                loading="lazy"
              />
            </figure>
          </LazySection>
        )}

        {/* ATTACHMENTS */}
        {attachments.length > 0 && (
          <LazySection minHeight={220}>
            <section className="announcement-attachments">
              <h3 className="attachments-title">
                <i className="fa-solid fa-paperclip"></i>
                Attachments
              </h3>

              <div className="attachments-list">
                {attachments.map((a, i) => (
                  <a
                    key={`${a.url}-${i}`}
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="attachment-item"
                  >
                    <div className="attachment-left">
                      <div className="attachment-icon">
                        <i className="fa-solid fa-file-arrow-down"></i>
                      </div>

                      <div className="attachment-info">
                        <div className="attachment-name">
                          {a.name}
                        </div>
                        <div className="attachment-meta">
                          {a.meta || "Click to open"}
                        </div>
                      </div>
                    </div>

                    <div>#{i + 1}</div>
                  </a>
                ))}
              </div>
            </section>
          </LazySection>
        )}

        {/* LOADING SKELETON */}
        {loading && (
          <section className="loading-container">
            <div className="loading-bar" style={{ width: "65%" }} />
            <div className="loading-bar" style={{ width: "92%" }} />
            <div className="loading-bar" style={{ width: "78%" }} />
            <div className="loading-bar" style={{ width: "85%" }} />
          </section>
        )}

        {/* ERROR */}
        {!loading && (!achievement || error) && (
          <div className="error-container">
            <i className="fa-solid fa-hourglass-half"></i>
            <h2>Coming Soon!</h2>
            <div className="error-message">
              This content will be published shortly.
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}