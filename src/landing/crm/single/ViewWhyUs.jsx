import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";

/* LAYOUT */
import TopHeaderMenu from "../../components/TopHeaderMenu";
import MainHeader from "../../components/MainHeader";
import HeaderMenu from "../../components/HeaderMenu";
import Footer from "../../components/Footer";

/* LAZY */
import LazySection from "../../../components/LazySection";

/* REDUX */
import {
  fetchWhyUsView,
  clearWhyUsView,
  selectWhyUsView,
} from "../../../redux/crm/single/whyUsViewSlice";

/* ================= CSS ================= */
const styles = `
:root{
  --primary:#a52a2a;
  --bg:#eef3f3;
  --card:#ffffff;
  --text:#1a1a1a;
  --muted:#666;
  --border:#e5e5e5;
}

body{
  background: var(--bg);
}

.page-container{
  max-width:1100px;
  margin:40px auto;
  padding:20px;
}

.page-header{
  background:var(--card);
  border-radius:14px;
  padding:32px;
  border:1px solid var(--border);
  box-shadow:0 8px 20px rgba(0,0,0,0.05);
}

.page-headbar{
  display:flex;
  justify-content:space-between;
  align-items:center;
  flex-wrap:wrap;
  gap:10px;
}

.page-title{
  font-size:32px;
  font-weight:800;
  color:var(--text);
  margin:0;
}

.meta-pill{
  border:1px solid var(--border);
  padding:8px 16px;
  border-radius:30px;
  font-size:14px;
  background:#f9f9f9;
}

.page-content{
  margin-top:25px;
  line-height:1.8;
  color:#333;
}

.bullet-list{
  margin:0;
  padding-left:22px;
  display:grid;
  gap:12px;
}

.bullet-list li{
  line-height:1.8;
  color:#333;
}

.page-actions{
  margin-top:25px;
  display:flex;
  gap:10px;
  flex-wrap:wrap;
}

.action-btn{
  border:1px solid var(--border);
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
  background:var(--primary);
  color:#fff;
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
  color:#555;
}
`;

function extractSentencesFromHtml(html) {
  if (!html || typeof html !== "string") return [];

  if (typeof document === "undefined") {
    return html
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const temp = document.createElement("div");
  temp.innerHTML = html;

  const text = (temp.textContent || temp.innerText || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return [];

  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts : [text];
}

export default function ViewWhyUs() {
  const dispatch = useDispatch();
  const { slug } = useParams();

  const { data, loading, error } = useSelector(selectWhyUsView);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (slug) dispatch(fetchWhyUsView(slug));
    return () => dispatch(clearWhyUsView());
  }, [dispatch, slug]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Copy failed. Please copy the URL from the address bar.");
    }
  };

  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: data?.title || document.title,
          url: window.location.href,
        });
      }
    } catch {
      // cancelled
    }
  };

  const bulletPoints = useMemo(() => {
    const points = extractSentencesFromHtml(data?.body);
    return points.length > 0 ? points : ["Coming Soon"];
  }, [data?.body]);

  return (
    <>
      <style>{styles}</style>

      <TopHeaderMenu />
      <MainHeader />
      <HeaderMenu />

      <main className="page-container">
        <div className="page-header">
          <div className="page-headbar">
            <h1 className="page-title">
              {data?.title || "Why Us"}
            </h1>

            {data?.created_at && (
              <span className="meta-pill">
                {new Date(data.created_at).toLocaleDateString()}
              </span>
            )}
          </div>

          <LazySection eager minHeight={0}>
            <div className="page-content">
              <ul className="bullet-list">
                {bulletPoints.map((point, index) => (
                  <li key={`${index}-${point.slice(0, 20)}`}>{point}</li>
                ))}
              </ul>
            </div>
          </LazySection>

          <div className="page-actions">
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

        {loading && (
          <section className="loading-container" aria-live="polite">
            <div className="loading-bar" style={{ width: "65%" }}></div>
            <div className="loading-bar" style={{ width: "92%" }}></div>
            <div className="loading-bar" style={{ width: "78%" }}></div>
            <div className="loading-bar" style={{ width: "85%" }}></div>
            <div className="loading-bar" style={{ width: "58%" }}></div>
          </section>
        )}

        {!loading && (!data || error) && (
          <div className="error-container">
            <h2>Coming Soon</h2>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}