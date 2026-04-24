import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";

import TopHeaderMenu from "../../components/TopHeaderMenu";
import MainHeader from "../../components/MainHeader";
import HeaderMenu from "../../components/HeaderMenu";
import Footer from "../../components/Footer";
import LazySection from "../../../components/LazySection";

import {
  fetchStudentActivityView,
  clearStudentActivityView,
  selectStudentActivityView,
  resolveUrl,
  parseAttachments,
  formatDate,
} from "../../../redux/crm/single/studentActivityViewSlice";

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

@media (max-width:768px){
  .announcement-header{
    padding:24px;
  }
  .announcement-title{
    font-size:28px;
  }
}
`;

export default function ViewStudentActivity() {
  const dispatch = useDispatch();
  const { slug } = useParams();

  const { activity, loading, error } = useSelector(selectStudentActivityView);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (slug) dispatch(fetchStudentActivityView(slug));
    return () => dispatch(clearStudentActivityView());
  }, [dispatch, slug]);

  const date = formatDate(
    activity?.publish_at ||
      activity?.created_at ||
      activity?.updated_at
  );

  const attachments = useMemo(
    () => parseAttachments(activity?.attachments_json || activity?.attachments),
    [activity?.attachments_json, activity?.attachments]
  );

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
          title: document.title,
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
    if (item?.description) html += item.description;

    if (!html.trim()) {
      html = "<p>No details available.</p>";
    }

    return html;
  };

  const metaItems = [];
  const dept =
    Array.isArray(activity?.departments)
      ? activity.departments
          .map((d) => d?.name || d?.title || d?.department_name)
          .filter(Boolean)
          .join(", ")
      : (activity?.department_name || activity?.department || activity?.departmentTitle || "");

  if (dept) metaItems.push({ key: "dept", label: dept });

  if (
    activity?.is_featured_home === 1 ||
    activity?.is_featured_home === true ||
    String(activity?.is_featured_home) === "1"
  ) {
    metaItems.push({ key: "featured", label: "Featured" });
  }

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
              {activity?.title || "Student Activity"}
            </h1>

            {date && <span className="meta-pill">{date}</span>}
          </div>

          {metaItems.length > 0 && (
            <div
              className="announcement-meta"
              style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "14px" }}
            >
              {metaItems.map((item) => (
                <span className="meta-pill" key={item.key}>
                  {item.label}
                </span>
              ))}
            </div>
          )}

          <LazySection eager minHeight={0}>
            <div
              className="announcement-content"
              dangerouslySetInnerHTML={{
                __html: buildBodyHTML(activity),
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

        {activity?.cover_image && (
          <LazySection minHeight={280}>
            <figure className="announcement-cover">
              <img
                src={resolveUrl(activity.cover_image)}
                alt="Cover image"
                loading="lazy"
              />
            </figure>
          </LazySection>
        )}

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

        {!loading && (!activity || error) && (
          <div className="error-container">
            <i className="fa-solid fa-hourglass-half"></i>
            <h2 className="error-title">Coming Soon!</h2>
            <div className="error-message">
              This content is currently undergoing review and will be published shortly.
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