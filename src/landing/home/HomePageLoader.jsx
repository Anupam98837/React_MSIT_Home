import React from "react";

export default function HomePageLoader({
  visible = true,
  isDone = false,
  progress = 10,
  title = "MSIT Kolkata",
  subtitle = "Loading homepage sections…",
  message = "Preparing…",
}) {
  if (!visible) return null;

  const safeProgress = Math.max(6, Math.min(100, Number(progress) || 10));

  return (
    <>
      <style>
        {`
          .hpl-home-loader {
            --hpl-brand: #9E363A;
            --hpl-brand-dark: #6B2528;
            --hpl-accent: #C94B50;
            --hpl-muted: #6b7280;
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 18px;
            background: rgba(246,247,251,.75);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            transition: opacity .35s ease, visibility .35s ease;
          }

          .hpl-home-loader.is-done {
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
          }

          .hpl-home-loader__card {
            position: relative;
            overflow: hidden;
            width: min(520px, 92vw);
            border: 1px solid rgba(158,54,58,.18);
            border-radius: 20px;
            background: rgba(255,255,255,.92);
            box-shadow: 0 18px 44px rgba(2,6,23,.16);
            padding: 18px 18px 16px;
          }

          .hpl-home-loader__card::before {
            content: "";
            position: absolute;
            inset: -120px -120px auto auto;
            width: 260px;
            height: 260px;
            background: radial-gradient(circle at 30% 30%, rgba(201,75,80,.22), rgba(201,75,80,0));
            transform: rotate(10deg);
            pointer-events: none;
          }

          .hpl-home-loader__top {
            position: relative;
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .hpl-home-loader__logo {
            width: 42px;
            height: 42px;
            flex: 0 0 auto;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 14px;
            color: var(--hpl-brand);
            background: linear-gradient(135deg, rgba(158,54,58,.16), rgba(201,75,80,.10));
            border: 1px solid rgba(158,54,58,.18);
            font-size: 18px;
          }

          .hpl-home-loader__meta {
            min-width: 0;
            flex: 1 1 auto;
          }

          .hpl-home-loader__title {
            margin: 0;
            color: #0f172a;
            font-size: 16px;
            line-height: 1.15;
            font-weight: 950;
          }

          .hpl-home-loader__subtitle {
            margin: 2px 0 0;
            color: var(--hpl-muted);
            font-size: 13px;
            font-weight: 800;
          }

          .hpl-home-loader__bar {
            position: relative;
            margin-top: 14px;
            height: 10px;
            overflow: hidden;
            border-radius: 999px;
            background: rgba(2,6,23,.06);
            border: 1px solid rgba(2,6,23,.06);
          }

          .hpl-home-loader__bar-fill {
            position: relative;
            display: block;
            height: 100%;
            border-radius: 999px;
            background: linear-gradient(90deg, var(--hpl-brand), var(--hpl-accent), var(--hpl-brand-dark));
            transition: width .35s ease;
          }

          .hpl-home-loader__bar-fill::after {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.35), rgba(255,255,255,0));
            transform: translateX(-60%);
            animation: hpl-loader-shine 1.1s linear infinite;
            mix-blend-mode: overlay;
          }

          @keyframes hpl-loader-shine {
            to { transform: translateX(160%); }
          }

          .hpl-home-loader__row {
            position: relative;
            margin-top: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }

          .hpl-home-loader__message {
            max-width: 70%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: #7a2626;
            font-size: 13px;
            font-weight: 900;
          }

          .hpl-home-loader__spinner {
            width: 28px;
            height: 28px;
            flex: 0 0 auto;
            border-radius: 50%;
            border: 3px solid rgba(158,54,58,.22);
            border-top-color: var(--hpl-brand);
            animation: hpl-loader-spin .75s linear infinite;
          }

          @keyframes hpl-loader-spin {
            to { transform: rotate(360deg); }
          }

          @media (max-width: 768px) {
            .hpl-home-loader__card {
              padding: 16px;
              border-radius: 18px;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .hpl-home-loader,
            .hpl-home-loader__bar-fill,
            .hpl-home-loader__spinner {
              transition: none !important;
              animation: none !important;
            }
          }
        `}
      </style>

      <div
        className={`hpl-home-loader ${isDone ? "is-done" : ""}`}
        aria-hidden={isDone ? "true" : "false"}
      >
        <div className="hpl-home-loader__card">
          <div className="hpl-home-loader__top">
            <div className="hpl-home-loader__logo">
              <i className="fa-solid fa-bolt" aria-hidden="true" />
            </div>

            <div className="hpl-home-loader__meta">
              <p className="hpl-home-loader__title">{title}</p>
              <p className="hpl-home-loader__subtitle">{subtitle}</p>
            </div>
          </div>

          <div className="hpl-home-loader__bar" aria-hidden="true">
            <span
              className="hpl-home-loader__bar-fill"
              style={{ width: `${safeProgress}%` }}
            />
          </div>

          <div className="hpl-home-loader__row">
            <div className="hpl-home-loader__message">{message}</div>
            <div className="hpl-home-loader__spinner" aria-hidden="true" />
          </div>
        </div>
      </div>
    </>
  );
}