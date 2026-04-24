import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";

import TopHeaderMenu from "../../components/TopHeaderMenu";
import MainHeader from "../../components/MainHeader";
import HeaderMenu from "../../components/HeaderMenu";
import Footer from "../../components/Footer";

import {
  fetchSuccessStoriesView,
  clearSuccessStoriesView,
  selectSuccessStoriesView,
} from "../../../redux/crm/single/successStoriesViewSlice";

export default function ViewSuccessStories() {
  const dispatch = useDispatch();
  const { slug } = useParams();

  const { story, loading, error } = useSelector(selectSuccessStoriesView);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (slug) dispatch(fetchSuccessStoriesView(slug));
    return () => dispatch(clearSuccessStoriesView());
  }, [slug]);

  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: story?.name,
        url: window.location.href,
      });
    }
  };

  return (
    <>
      {/* ================= FULL CSS ================= */}
      <style>{`
      body {
        background: #f8fafc;
        font-family: 'Segoe UI', sans-serif;
      }

      .ss-container {
        max-width: 1200px;
        margin: auto;
        padding: 30px;
      }

      .ss-card {
        background: #fff;
        border-radius: 18px;
        border: 1px solid #e5e7eb;
        box-shadow: 0 10px 26px rgba(0,0,0,0.05);
      }

      .ss-hero {
        display: grid;
        grid-template-columns: 1.4fr 0.6fr;
        gap: 20px;
      }

      .ss-hero-main {
        padding: 25px;
      }

      .ss-kicker {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: #fce7e7;
        color: #9E363A;
        padding: 6px 12px;
        border-radius: 999px;
        font-weight: 700;
        font-size: 12px;
        margin-bottom: 10px;
      }

      .ss-title {
        font-size: 42px;
        font-weight: 900;
        margin: 10px 0;
      }

      .ss-name {
        color: #64748b;
        font-weight: 700;
        margin-bottom: 10px;
      }

      .ss-intro {
        background: #f9fafb;
        border: 1px dashed #cbd5e1;
        padding: 12px;
        border-radius: 12px;
        margin: 15px 0;
        line-height: 1.6;
      }

      .ss-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        border-radius: 999px;
        border: 1px solid #e5e7eb;
        background: #f1f5f9;
        font-weight: 700;
        margin-bottom: 10px;
      }

      .ss-actions {
        display: flex;
        gap: 10px;
        margin-top: 10px;
      }

      .ss-btn {
        padding: 10px 16px;
        border-radius: 999px;
        border: 1px solid #ddd;
        background: #fff;
        font-weight: 700;
        cursor: pointer;
        transition: 0.2s;
      }

      .ss-btn:hover {
        background: #9E363A;
        color: #fff;
      }

      .ss-btn-ghost {
        background: #fff5f5;
        color: #9E363A;
      }

      .ss-photo-wrap {
        padding: 15px;
      }

      .ss-photo-frame {
        border-radius: 14px;
        overflow: hidden;
        aspect-ratio: 1/1;
        background: #f1f5f9;
      }

      .ss-photo-frame img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .ss-no-photo {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        color: #64748b;
      }

      .ss-loading-bar {
        height: 14px;
        background: #eee;
        border-radius: 999px;
        margin-bottom: 10px;
      }

      .ss-error {
        background: #fee2e2;
        color: #b91c1c;
        padding: 12px;
        border-radius: 10px;
      }

      @media (max-width: 900px) {
        .ss-hero {
          grid-template-columns: 1fr;
        }
      }
      `}</style>

      <TopHeaderMenu />
      <MainHeader />
      <HeaderMenu />

      <main className="ss-container">

        {/* LOADING */}
        {loading && (
          <>
            <div className="ss-loading-bar" style={{ width: "70%" }}></div>
            <div className="ss-loading-bar" style={{ width: "90%" }}></div>
          </>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="ss-error">{error}</div>
        )}

        {/* CONTENT */}
        {!loading && story && (
          <section className="ss-hero">

            {/* LEFT */}
            <div className="ss-card ss-hero-main">

              <div className="ss-kicker">
                <i className="fa-solid fa-trophy"></i>
                SUCCESS STORY
              </div>

              <h1 className="ss-title">
                {story?.name || "Success Story"}
              </h1>

              {/* PARAGRAPH */}
              {story?.description && (
                <div className="ss-intro">
                  {story.description}
                </div>
              )}

              {/* DEPARTMENT */}
              {story?.department_title && (
                <div className="ss-pill">
                  <i className="fa-solid fa-building-columns"></i>
                  {story.department_title}
                </div>
              )}

              {/* BUTTONS */}
              <div className="ss-actions">
                <button className="ss-btn" onClick={handleCopy}>
                  <i className="fa-solid fa-link"></i>
                  {copied ? "Copied!" : "Copy Link"}
                </button>

                {canShare && (
                  <button className="ss-btn ss-btn-ghost" onClick={handleShare}>
                    <i className="fa-solid fa-share-nodes"></i>
                    Share
                  </button>
                )}
              </div>

            </div>

            {/* RIGHT IMAGE */}
            <div className="ss-card ss-photo-wrap">
              <div className="ss-photo-frame">
                {story?.photo_full_url ? (
                  <img src={story.photo_full_url} alt="story" />
                ) : (
                  <div className="ss-no-photo">No Image</div>
                )}
              </div>
            </div>

          </section>
        )}

      </main>

      <Footer />
    </>
  );
}