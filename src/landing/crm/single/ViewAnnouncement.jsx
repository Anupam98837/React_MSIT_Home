import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";

/* Layout */
import TopHeaderMenu from "../../components/TopHeaderMenu";
import MainHeader from "../../components/MainHeader";
import HeaderMenu from "../../components/HeaderMenu";
import Footer from "../../components/Footer";

/* Lazy section */
import LazySection from "../../../components/LazySection";

/* Redux */
import {
  fetchAnnouncementView,
  clearAnnouncementView,
  selectAnnouncementView,
  resolveUrl,
  parseAttachments,
} from "../../../redux/crm/single/announcementSlice";

const styles = `
html, body { height: 100%; margin: 0; }

body{
  background: var(--bg-body);
  color: var(--ink);
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  line-height: 1.6;
}

.announcement-container{
  max-width: 1280px;
  margin: 0 auto;
  padding: clamp(24px, 4vw, 48px) clamp(16px, 3vw, 24px);
}

.announcement-header{
  background: var(--surface);
  border-radius: var(--radius-xl);
  padding: clamp(24px, 4vw, 40px);
  box-shadow: var(--shadow-2);
  border: 1px solid var(--line-strong);
  margin-bottom: 32px;
  border-radius: 10px;
}

.announcement-headbar{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.announcement-title{
  margin: 0;
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1.1;
  font-size: clamp(28px, 5vw, 48px);
  color: var(--ink);
  flex: 1 1 520px;
  min-width: 260px;
}

.notice-meta{
  display:flex;
  flex-wrap:wrap;
  gap:12px;
  align-items:center;
  margin-bottom: 24px;
}

.meta-pill{
  display:inline-flex;
  align-items:center;
  gap:8px;
  padding: 8px 16px;
  border-radius: 999px;
  background: var(--surface-alt);
  border: 1px solid var(--line-strong);
  color: var(--ink);
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.meta-pill i{
  color: var(--primary-color);
  opacity: .8;
}

.meta-pill-date{
  margin-left: auto;
  flex: 0 0 auto;
}

.announcement-actions{
  display:flex;
  flex-wrap:wrap;
  gap:12px;
  padding-top: 20px;
  border-top: 2px solid var(--line-light);
}

.action-btn{
  display:inline-flex;
  align-items:center;
  gap:8px;
  padding: 10px 20px;
  border-radius: 999px;
  border: 1px solid var(--line-strong);
  background: var(--surface);
  color: var(--ink);
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  transition: all .3s ease;
  cursor: pointer;
}

.action-btn:hover{
  background: var(--primary-color);
  color: #fff;
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: var(--shadow-2);
}

.action-btn i{ font-size: 16px; }

.announcement-cover{
  margin-bottom: 32px;
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--line-strong);
  box-shadow: var(--shadow-2);
}

.announcement-cover img{
  width: 100%;
  height: auto;
  display: block;
  max-height: 500px;
  object-fit: cover;
}

.announcement-content{
  color: var(--ink);
  font-size: 16px;
  line-height: 1.85;
  overflow-wrap: anywhere;
  margin-bottom: 24px;
}

.announcement-content p{ margin: 0 0 16px; }

.announcement-content h1,
.announcement-content h2,
.announcement-content h3,
.announcement-content h4{
  margin: 24px 0 12px;
  line-height: 1.3;
  letter-spacing: -0.02em;
  font-weight: 700;
  color: var(--ink);
}

.announcement-content h1{ font-size: 2rem; }
.announcement-content h2{ font-size: 1.75rem; }
.announcement-content h3{ font-size: 1.5rem; }
.announcement-content h4{ font-size: 1.25rem; }

.announcement-content img{
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-lg);
  margin: 20px 0;
  box-shadow: var(--shadow-1);
}

.announcement-content a{
  color: var(--primary-color);
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color .2s ease;
}

.announcement-content a:hover{ color: var(--accent-color); }

.announcement-content blockquote{
  margin: 20px 0;
  padding: 16px 20px;
  border-left: 5px solid var(--primary-color);
  background: var(--surface-alt);
  border-radius: var(--radius-md);
  font-style: italic;
}

.announcement-content pre{
  padding: 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--line-strong);
  background: var(--surface-alt);
  overflow: auto;
  font-family: 'Courier New', monospace;
  font-size: 14px;
}

.announcement-content ul,
.announcement-content ol{
  padding-left: 24px;
  margin: 16px 0;
}

.announcement-content li{ margin-bottom: 8px; }

.announcement-attachments{
  background: var(--surface);
  border-radius: var(--radius-xl);
  padding: clamp(24px, 4vw, 40px);
  box-shadow: var(--shadow-2);
  border: 1px solid var(--line-strong);
}

.attachments-title{
  display:flex;
  align-items:center;
  gap:12px;
  font-weight:700;
  font-size: 1.25rem;
  margin: 0 0 20px;
  letter-spacing: -0.01em;
  color: var(--ink);
}

.attachments-title i{
  background: var(--primary-light);
  color: var(--primary-color);
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display:flex;
  align-items:center;
  justify-content:center;
}

.attachments-list{ display:grid; gap: 12px; }

.attachment-item{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 16px;
  padding: 16px 20px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--line-strong);
  background: var(--surface-alt);
  text-decoration: none;
  color: var(--ink);
  transition: all .3s ease;
}

.attachment-item:hover{
  border-color: var(--primary-color);
  background: var(--surface);
  transform: translateY(-2px);
  box-shadow: var(--shadow-2);
}

.attachment-left{
  display:flex;
  align-items:center;
  gap: 16px;
  min-width: 0;
  flex: 1;
}

.attachment-icon{
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--primary-light);
  color: var(--primary-color);
  display:flex;
  align-items:center;
  justify-content:center;
  font-size: 20px;
  flex-shrink: 0;
}

.attachment-info{ min-width:0; flex:1; }

.attachment-name{
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.attachment-meta{
  font-size: 13px;
  color: var(--muted-color);
}

.attachment-number{
  font-size: 13px;
  color: var(--muted-color);
  white-space: nowrap;
  font-weight: 500;
}

.loading-container{
  display:grid;
  gap: 16px;
  max-width: 100%;
  padding: 40px 0;
}

.loading-bar{
  height: 16px;
  border-radius: 999px;
  background: var(--surface-alt);
  overflow: hidden;
  position: relative;
}

.loading-bar::after{
  content:"";
  position:absolute;
  inset:0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(59,130,246,.3), transparent);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer { to { transform: translateX(100%); } }

.error-container{
  background: var(--surface);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-xl);
  padding: clamp(40px, 8vw, 80px) 24px;
  text-align: center;
  margin: 40px auto;
  max-width: 700px;
  box-shadow: var(--shadow-3);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.error-container i{
  font-size: clamp(48px, 8vw, 80px);
  color: var(--primary-color);
  margin-bottom: 8px;
  filter: drop-shadow(0 8px 16px var(--primary-light));
  animation: pulse-soft 3s infinite ease-in-out;
}

.error-title{
  font-size: clamp(24px, 4vw, 36px);
  font-weight: 900;
  color: var(--ink);
  letter-spacing: -0.03em;
  margin: 0;
}

.error-message{
  font-size: 16px;
  color: var(--muted-color);
  max-width: 480px;
  margin: 0 auto;
  line-height: 1.7;
}

@keyframes pulse-soft {
  0%, 100% { transform: translateY(0); opacity: 1; }
  50% { transform: translateY(-10px); opacity: 0.8; }
}

@media (max-width:768px){
  .announcement-header{ padding:24px; }
  .announcement-title{ font-size:28px; }
  .notice-meta{ gap: 8px; }
  .meta-pill{ font-size: 13px; padding: 6px 12px; }
  .action-btn{ font-size: 13px; padding: 8px 16px; }
  .attachment-item{ padding: 12px 16px; }
  .attachment-icon{ width: 40px; height: 40px; font-size: 18px; }
  .announcement-headbar{ gap: 10px; }
}

.meta-pill-date, #metaFeatured { display: none !important; }
`;

export default function ViewAnnouncement() {
  const dispatch = useDispatch();
  const { slug } = useParams();

  const { announcement, loading, error } = useSelector(selectAnnouncementView);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (slug) dispatch(fetchAnnouncementView(slug));
    return () => dispatch(clearAnnouncementView());
  }, [dispatch, slug]);

  const attachments = useMemo(
    () => parseAttachments(announcement?.attachments),
    [announcement?.attachments]
  );

  const departmentName =
    announcement?.department?.name ||
    announcement?.department?.title ||
    announcement?.department_name ||
    announcement?.department_title ||
    announcement?.category ||
    "";

  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Copy failed. Please copy the URL from the address bar.");
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: announcement?.title || document.title,
          url: window.location.href,
        });
      }
    } catch {
      // cancelled
    }
  };

  const buildBodyHTML = (item) => {
    let html = "";

    if (item?.body) html += item.body;

    if (!html.trim() && !loading) {
      html = `<p>No details available.</p>`;
    }

    return html;
  };

  const getImage = () => {
    if (!announcement) return "";

    const candidates = [
      announcement.cover_image_url,
      announcement.cover_image,
      announcement.image,
      announcement.banner_image,
      announcement.cover,
      announcement.notice_image,
      announcement.hero_image,
      announcement.thumbnail,
      announcement?.banner?.url,
      announcement?.image?.url,
      announcement?.media?.[0]?.url,
      announcement?.images?.[0]?.url,
    ];

    return candidates.map((item) => resolveUrl(item)).find(Boolean) || "";
  };

  const coverImageUrl = getImage();

  return (
    <>
      <style>{styles}</style>

      <TopHeaderMenu />
      <MainHeader />
      <HeaderMenu />

      <main className="announcement-container">
        <div className="announcement-header">
          <div className="announcement-headbar">
            <h1 className="announcement-title">
              {announcement?.title || "Announcement"}
            </h1>
          </div>

          {departmentName ? (
            <div className="notice-meta">
              <span className="meta-pill" id="metaDept">
                <i className="fa-solid fa-building-columns"></i>
                <span>{departmentName}</span>
              </span>
            </div>
          ) : null}

          <LazySection eager minHeight={0}>
            <div
              className="announcement-content"
              dangerouslySetInnerHTML={{
                __html: buildBodyHTML(announcement),
              }}
            />
          </LazySection>

          <div className="announcement-actions">
            <button className="action-btn" onClick={handleCopy} type="button">
              <i className="fa-solid fa-link"></i>
              {copied ? "Copied!" : "Copy Link"}
            </button>

            {canShare && (
              <button className="action-btn" onClick={handleShare} type="button">
                <i className="fa-solid fa-share-nodes"></i>
                Share
              </button>
            )}
          </div>
        </div>

        {coverImageUrl ? (
          <LazySection minHeight={280}>
            <section className="announcement-cover">
              <img
                src={coverImageUrl}
                alt={announcement?.title || "Banner image"}
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </section>
          </LazySection>
        ) : null}

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
                        <div className="attachment-name" title={a.name}>
                          {a.name}
                        </div>

                        <div className="attachment-meta">
                          {a.meta || "Click to open"}
                        </div>
                      </div>
                    </div>

                    <div className="attachment-number">#{i + 1}</div>
                  </a>
                ))}
              </div>
            </section>
          </LazySection>
        )}

        {loading && (
          <section className="loading-container" aria-live="polite">
            <div className="loading-bar" style={{ width: "65%" }}></div>
            <div className="loading-bar" style={{ width: "92%" }}></div>
            <div className="loading-bar" style={{ width: "78%" }}></div>
            <div className="loading-bar" style={{ width: "85%" }}></div>
            <div className="loading-bar" style={{ width: "58%" }}></div>
          </section>
        )}

        {!loading && (!announcement || error) && (
          <div className="error-container">
            <i className="fa-solid fa-hourglass-half"></i>

            <h2 className="error-title">Coming Soon!</h2>

            <div className="error-message">
              This content is currently undergoing review and will be published
              shortly.
            </div>

            <a href="/" className="action-btn" style={{ marginTop: 24 }}>
              <i className="fa-solid fa-house"></i>
              Explore Website
            </a>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}