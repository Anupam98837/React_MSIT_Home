import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";
import TopHeaderMenu from "@/landing/components/TopHeaderMenu";
import MainHeader from "@/landing/components/MainHeader";
import HeaderMenu from "@/landing/components/HeaderMenu";
import Footer from "@/landing/components/Footer";
import { buildUrl, decodeHtmlEntities } from "@/redux/request";
import {
  fetchUserProfile,
  selectUserProfileBlock,
} from "@/redux/crm/userProfileSlice";

const styles = `
.upx-page{
  --surface-alt: #f1f5f9;
  --ink: #1e293b;
  --muted-color: #64748b;
  --line-strong: #e2e8f0;
  --line-light: #f1f5f9;
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --shadow-1: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-2: 0 4px 6px -1px rgba(0,0,0,0.1);
  --shadow-3: 0 10px 15px -3px rgba(0,0,0,0.1);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  background: var(--bg-body);
  color: var(--ink);
  min-height: 100vh;
}
.upx-page *{ box-sizing:border-box; }

.profile-layout {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px;
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 32px;
  min-height: calc(100vh - 48px);
}
@media (max-width: 992px) {
  .profile-layout { grid-template-columns: 1fr; gap: 24px; }
}
@media (max-width: 768px) {
  .profile-layout { padding: 16px; }
}

.profile-sidebar {
  background: var(--surface);
  border-radius: var(--radius-xl);
  padding: 24px;
  box-shadow: var(--shadow-2);
  border: 1px solid var(--line-strong);
  position: sticky;
  top: 24px;
  height: fit-content;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: smooth;
  padding-bottom: 44px;
}
.profile-sidebar::-webkit-scrollbar { width: 8px; }
.profile-sidebar::-webkit-scrollbar-thumb {
  background: rgba(100,116,139,.35);
  border-radius: 10px;
  border: 2px solid transparent;
  background-clip: content-box;
}
.profile-sidebar::-webkit-scrollbar-track { background: transparent; }

.scroll-hint {
  position: sticky;
  bottom: 10px;
  left: 0;
  right: 0;
  margin-top: 14px;
  display: none;
  justify-content: center;
  pointer-events: none;
  z-index: 5;
}
.scroll-hint .hint-pill{
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.75));
  border: 1px solid rgba(226,232,240,.9);
  box-shadow: 0 10px 24px rgba(0,0,0,.10);
  color: var(--muted-color);
  font-size: 12.5px;
  backdrop-filter: blur(8px);
}
html.theme-dark .scroll-hint .hint-pill{
  background: linear-gradient(180deg, rgba(30,41,59,.92), rgba(30,41,59,.72));
  border-color: rgba(148,163,184,.25);
  color: rgba(226,232,240,.85);
}
.scroll-hint i{
  animation: bounceDown 1.2s infinite;
  font-size: 14px;
}
@keyframes bounceDown{
  0%,100%{ transform: translateY(0); opacity: .85; }
  50%{ transform: translateY(4px); opacity: 1; }
}

.profile-avatar-container { position: relative; width: 140px; height: 140px; margin: 0 auto 20px; }
.profile-avatar {
  width: 100%; height: 100%;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: linear-gradient(135deg, var(--primary-light), #e0f2fe);
  display: flex; align-items: center; justify-content: center;
  font-size: 48px; color: var(--primary-color);
  border: 4px solid white;
  box-shadow: var(--shadow-3);
}
.profile-avatar img { width: 100%; height: 100%; object-fit: cover; }

.profile-badge {
  position: absolute;
  bottom: -5px; right: -5px;
  background: var(--primary-color);
  color: white;
  width: 36px; height: 36px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
  border: 3px solid white;
}

.profile-name { font-weight: 700; font-size: 1.5rem; text-align: center; margin-bottom: 4px; word-break: break-word; }
.profile-role {
  font-size: 0.9rem;
  color: var(--primary-color);
  text-align: center;
  font-weight: 600;
  background: var(--primary-light);
  padding: 4px 12px;
  border-radius: 20px;
  display: inline-block;
  margin: 0 auto 16px;
}

.profile-contact {
  background: var(--surface-alt);
  padding: 16px;
  border-radius: var(--radius-md);
  margin-bottom: 20px;
}
.contact-item { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; font-size: 0.9rem; }
.contact-item:last-child { margin-bottom: 0; }
.contact-item i { color: var(--primary-color); width: 20px; }

.profile-social {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 20px 0;
  flex-wrap: nowrap;
  overflow-x: auto;
}
.profile-social a {
  width: 38px; height: 38px;
  border-radius: var(--radius-md);
  background: var(--surface-alt);
  display: flex; align-items: center; justify-content: center;
  color: var(--ink);
  transition: all 0.3s ease;
  border: 1px solid var(--line-strong);
  overflow: hidden;
  flex: 0 0 38px;
  text-decoration:none;
}
.profile-social a:hover {
  background: var(--primary-color);
  color: white;
  box-shadow: var(--shadow-3);
}
.profile-social a img{
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
.profile-social a i{
  font-size: 16px;
}

.profile-nav { margin-top: 24px; display: grid; gap: 8px; }
.profile-nav button {
  border: none;
  background: transparent;
  text-align: left;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  color: var(--ink);
  font-size: 0.95rem;
  display: flex; align-items: center; gap: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
}
.profile-nav button i { width: 20px; color: var(--muted-color); }
.profile-nav button:hover { background: var(--primary-light); color: var(--primary-color); transform: translateX(5px); }
.profile-nav button.active { background: var(--primary-color); color: white; }
.profile-nav button.active i { color: white; }

.profile-content { position: relative; min-height: 600px; }

.loading-indicator {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--muted-color);
}
.loading-spinner {
  width: 40px; height: 40px;
  border: 3px solid var(--line-strong);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.profile-section { animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.profile-card {
  background: var(--surface);
  border-radius: var(--radius-xl);
  padding: 28px;
  box-shadow: var(--shadow-2);
  border: 1px solid var(--line-strong);
}

.profile-card h5 {
  font-size: 1.1rem;
  font-weight: 700;
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--line-light);
  color: var(--primary-color);
}
.profile-card h5 i {
  background: var(--primary-light);
  width: 40px; height: 40px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
}

.kv-divider{
  grid-column: 1 / -1;
  height: 1px;
  border-radius: 999px;
  background: linear-gradient(90deg,
    transparent,
    rgba(148,163,184,.35),
    rgba(148,163,184,.50),
    rgba(148,163,184,.35),
    transparent
  );
  margin: 6px 0 6px;
}
html.theme-dark .kv-divider{
  background: linear-gradient(90deg,
    transparent,
    rgba(148,163,184,.18),
    rgba(148,163,184,.30),
    rgba(148,163,184,.18),
    transparent
  );
}

.kv {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 16px 24px;
  font-size: 0.95rem;
}
.kv .k { color: var(--muted-color); font-weight: 500; }
.kv .v { font-weight: 400; line-height: 1.7; min-width:0; }
.kv .v ul { padding-left: 20px; margin: 8px 0; }
.kv .v li { margin-bottom: 4px; }

@media (max-width: 768px) {
  .kv { grid-template-columns: 1fr; gap: 12px; }
  .kv .k { font-weight: 600; color: var(--ink); }
}

.content-grid { display: grid; gap: 20px; }
.content-card {
  background: var(--surface);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 20px;
  transition: all 0.3s ease;
}
.content-card:hover { border-color: var(--primary-color); box-shadow: var(--shadow-2); }

.card-image {
  width: 100px; height: 120px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--surface-alt);
  display: flex; align-items: center; justify-content: center;
  color: var(--muted-color);
  font-size: 32px;
}
.card-image img { width: 100%; height: 100%; object-fit: cover; }

.card-title { font-weight: 700; font-size: 1.1rem; margin-bottom: 8px; color: var(--ink); }
.card-meta { display: flex; flex-wrap: wrap; gap: 16px; font-size: 0.85rem; color: var(--muted-color); margin-bottom: 12px; }
.card-meta-item { display: flex; align-items: center; gap: 6px; }
.card-desc { font-size: 0.95rem; line-height: 1.6; color: var(--ink); }

.card-badge {
  background: var(--primary-light);
  color: var(--primary-color);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-block;
  margin-top: 10px;
}
.card-link { margin-top: 12px; }
.card-link a {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.card-link a:hover { text-decoration: underline; }

@media (max-width: 768px) {
  .content-card { grid-template-columns: 1fr; gap: 16px; }
  .card-image { width: 100%; height: 180px; }
}

.tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.tag { background: var(--surface-alt); color: var(--muted-color); padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; border: 1px solid var(--line-strong); }

.empty { color: var(--muted-color); text-align: center; padding: 40px 20px; font-size: 1rem; }
.empty i { font-size: 2rem; margin-bottom: 16px; display: block; color: var(--line-strong); }

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  padding: 4px 12px;
  border-radius: 20px;
  background: #dcfce7;
  color: #166534;
  margin-left: 12px;
}
.status-indicator::before {
  content: '';
  width: 8px; height: 8px;
  background: #22c55e;
  border-radius: 50%;
}

.qualification-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.qualification-tag {
  background: var(--primary-light);
  color: var(--primary-color);
  padding: 6px 14px;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 500;
}

.section-indicator {
  position: fixed;
  bottom: 20px; right: 20px;
  background: var(--primary-color);
  color: white;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  box-shadow: var(--shadow-3);
  z-index: 100;
  display: none;
}
@media (max-width: 768px) {
  .section-indicator { bottom: 10px; right: 10px; font-size: 0.8rem; }
  .profile-contact { display: none !important; }

  .profile-sidebar {
    position: relative !important;
    top: 0 !important;
    max-height: none !important;
    overflow-y: visible !important;
    height: auto !important;
  }

  .profile-nav {
    display: flex !important;
    gap: 6px;
    margin-top: 16px;
    border-radius: var(--radius-md);
    background: var(--surface-alt);
    padding: 6px;
    justify-content: space-around;
    flex-direction: row !important;
  }
  .profile-nav button {
    font-size: 0 !important;
    padding: 10px !important;
    justify-content: center;
    flex: 1;
    text-align: center;
  }
  .profile-nav button i {
    font-size: 1.25rem;
    margin: 0;
  }
}
`;

const SECTION_META = {
  personal: {
    title: "Personal Information",
    icon: "fa fa-id-card",
  },
  education: {
    title: "Education",
    icon: "fa fa-graduation-cap",
  },
  honors: {
    title: "Honors & Awards",
    icon: "fa fa-award",
  },
  journals: {
    title: "Patents",
    icon: "fa fa-book",
  },
  conferences: {
    title: "Publications",
    icon: "fa fa-microphone",
  },
  teaching: {
    title: "Engagements",
    icon: "fa fa-chalkboard-teacher",
  },
};

const SOCIAL_ICON_MAP = {
  linkedin: "fa-brands fa-linkedin",
  github: "fa-brands fa-github",
  orcid: "fa-brands fa-orcid",
  "google scholar": "fa fa-graduation-cap",
  googlescholar: "fa fa-graduation-cap",
  researchgate: "fa-brands fa-researchgate",
  twitter: "fa-brands fa-twitter",
  x: "fa-brands fa-x-twitter",
  facebook: "fa-brands fa-facebook-f",
  instagram: "fa-brands fa-instagram",
  youtube: "fa-brands fa-youtube",
  website: "fa fa-globe",
  web: "fa fa-globe",
  portfolio: "fa fa-globe",
  mail: "fa fa-envelope",
  email: "fa fa-envelope",
};

const ensureFontAwesome = () => {
  if (document.querySelector('link[data-upx-fa="1"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href =
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";
  link.setAttribute("data-upx-fa", "1");
  document.head.appendChild(link);
};

const clean = (value) => (value ?? "").toString().trim();

const stripHtml = (value) =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const hasValue = (value) => {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.some((item) => hasValue(item));
  if (typeof value === "object") {
    return Object.values(value).some((entry) => hasValue(entry));
  }
  const cleaned = stripHtml(value);
  return (
    cleaned !== "" &&
    cleaned !== "—" &&
    cleaned.toLowerCase() !== "null" &&
    cleaned.toLowerCase() !== "undefined"
  );
};

const normalizeUrl = (url) => {
  const value = clean(url);
  if (!value) return "";
  if (/^(https?:\/\/|mailto:|tel:|data:|blob:)/i.test(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("/") || value.includes("/")) return buildUrl(value);
  if (value.includes(".") && !value.includes(" ")) return `https://${value}`;
  return buildUrl(value);
};

const isProbablyImagePath = (value) => {
  const text = clean(value).toLowerCase();
  if (!text) return false;
  if (text.startsWith("data:image/")) return true;
  if (text.startsWith("http://") || text.startsWith("https://")) return true;
  if (text.includes("/")) return true;
  return /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(text);
};

const isProbablyPdf = (value) => clean(value).toLowerCase().endsWith(".pdf");

const isProbablyFAClass = (value) => {
  const text = clean(value);
  if (!text) return false;
  return (
    text.includes("fa-") ||
    text.startsWith("fa ") ||
    text.startsWith("fa-solid") ||
    text.startsWith("fa-brands")
  );
};

const safeHtml = (value) => {
  const html = decodeHtmlEntities(String(value || ""));
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
};

const renderFormattedHtml = (value) => {
  if (!hasValue(value)) return null;
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: safeHtml(value),
      }}
    />
  );
};

const renderMetaItems = (items) => {
  const validItems = items.filter((item) => hasValue(item?.value));
  if (!validItems.length) return null;

  return (
    <div className="card-meta">
      {validItems.map((item, index) => (
        <div className="card-meta-item" key={`${item.icon}-${index}`}>
          <i className={item.icon} />
          <span>{item.value}</span>
        </div>
      ))}
    </div>
  );
};

const renderEmptySection = (id, icon, title, text) => (
  <section id={id} className="profile-card profile-section">
    <h5>
      <i className={icon} /> {title}
    </h5>
    <div className="empty">
      <i className={icon} />
      {text}
    </div>
  </section>
);

const normalizeQualifications = (input) => {
  if (Array.isArray(input)) {
    return input.map((item) => clean(item)).filter(Boolean);
  }

  const text = clean(input);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    return normalizeQualifications(parsed);
  } catch {
    return [text];
  }
};

const renderKvRows = (items) => {
  const valid = items.filter((item) => item.show);
  if (!valid.length) return null;

  return valid.map((item, index) => (
    <FragmentWithDivider
      key={`${item.label}-${index}`}
      showDivider={index < valid.length - 1}
    >
      <div className="k">{item.label}</div>
      <div className="v">{item.content}</div>
    </FragmentWithDivider>
  ));
};

function FragmentWithDivider({ children, showDivider }) {
  return (
    <>
      {children}
      {showDivider ? <div className="kv-divider" aria-hidden="true" /> : null}
    </>
  );
}

const getProfileImage = (basic) =>
  normalizeUrl(
    basic?.image ||
      basic?.image_url ||
      basic?.photo_url ||
      basic?.profile_image ||
      basic?.profile_image_url
  );

const getRoleText = (basic) =>
  clean(
    basic?.role_title ||
      basic?.designation ||
      basic?.role_short_form ||
      basic?.role
  ) || "User";

const getSocialRows = (rows) =>
  (Array.isArray(rows) ? rows : [])
    .filter((item) => {
      const active = item?.active;
      if (active === undefined || active === null || active === "") return true;
      const text = String(active).toLowerCase();
      return text === "1" || text === "true" || text === "yes";
    })
    .sort((a, b) => Number(a?.sort_order ?? 0) - Number(b?.sort_order ?? 0));

const renderSectionContent = (sectionKey, profileData) => {
  const personal = profileData?.personal || {};
  const educations = Array.isArray(profileData?.educations)
    ? profileData.educations
    : [];
  const honors = Array.isArray(profileData?.honors) ? profileData.honors : [];
  const journals = Array.isArray(profileData?.journals)
    ? profileData.journals
    : [];
  const conferences = Array.isArray(profileData?.conference_publications)
    ? profileData.conference_publications
    : [];
  const teaching = Array.isArray(profileData?.teaching_engagements)
    ? profileData.teaching_engagements
    : [];

  if (sectionKey === "personal") {
    const qualifications = normalizeQualifications(personal?.qualification);

    const rows = renderKvRows([
      {
        label: "Qualifications",
        show: qualifications.length > 0,
        content: (
          <div className="qualification-list">
            {qualifications.map((item, index) => (
              <span className="qualification-tag" key={`${item}-${index}`}>
                {item}
              </span>
            ))}
          </div>
        ),
      },
      {
        label: "Affiliation",
        show: hasValue(personal?.affiliation),
        content: renderFormattedHtml(personal?.affiliation),
      },
      {
        label: "Specification",
        show: hasValue(personal?.specification),
        content: renderFormattedHtml(personal?.specification),
      },
      {
        label: "Experience",
        show: hasValue(personal?.experience),
        content: renderFormattedHtml(personal?.experience),
      },
      {
        label: "Research Interests",
        show: hasValue(personal?.interest),
        content: renderFormattedHtml(personal?.interest),
      },
      {
        label: "Administration",
        show: hasValue(personal?.administration),
        content: renderFormattedHtml(personal?.administration),
      },
      {
        label: "Research Projects",
        show: hasValue(personal?.research_project),
        content: renderFormattedHtml(personal?.research_project),
      },
    ]);

    if (!rows) {
      return renderEmptySection(
        "personal",
        "fa fa-id-card",
        "Personal Information",
        "No personal information found"
      );
    }

    return (
      <section id="personal" className="profile-card profile-section">
        <h5>
          <i className="fa fa-id-card" /> Personal Information
        </h5>
        <div className="kv">{rows}</div>
      </section>
    );
  }

  if (sectionKey === "education") {
    const filtered = educations.filter(
      (edu) =>
        hasValue(edu?.degree_title) ||
        hasValue(edu?.education_level) ||
        hasValue(edu?.institution_name) ||
        hasValue(edu?.university_name) ||
        hasValue(edu?.location) ||
        hasValue(edu?.passing_year) ||
        hasValue(edu?.grade_value) ||
        hasValue(edu?.field_of_study) ||
        hasValue(edu?.description)
    );

    if (!filtered.length) {
      return renderEmptySection(
        "education",
        "fa fa-graduation-cap",
        "Education",
        "No education records found"
      );
    }

    return (
      <section id="education" className="profile-card profile-section">
        <h5>
          <i className="fa fa-graduation-cap" /> Education
        </h5>
        <div className="content-grid">
          {filtered.map((edu, index) => {
            const title = clean(edu?.degree_title || edu?.education_level);
            return (
              <div className="content-card" key={`edu-${index}`}>
                <div className="card-image">
                  <i className="fa fa-university" />
                </div>
                <div className="card-content">
                  {title ? <div className="card-title">{title}</div> : null}
                  {renderMetaItems([
                    {
                      icon: "fa fa-university",
                      value: clean(
                        edu?.institution_name || edu?.university_name
                      ),
                    },
                    {
                      icon: "fa fa-map-marker-alt",
                      value: clean(edu?.location),
                    },
                    {
                      icon: "fa fa-calendar",
                      value: clean(edu?.passing_year),
                    },
                    {
                      icon: "fa fa-chart-line",
                      value:
                        hasValue(edu?.grade_value) || hasValue(edu?.grade_type)
                          ? `${clean(edu?.grade_type || "Grade")}: ${clean(
                              edu?.grade_value || "—"
                            )}`
                          : "",
                    },
                  ])}
                  {hasValue(edu?.field_of_study) ? (
                    <div className="card-badge">{clean(edu.field_of_study)}</div>
                  ) : null}
                  {hasValue(edu?.description) ? (
                    <div className="card-desc">{clean(edu.description)}</div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  if (sectionKey === "honors") {
    const filtered = honors.filter(
      (honor) =>
        hasValue(honor?.title) ||
        hasValue(honor?.honouring_organization) ||
        hasValue(honor?.honor_year) ||
        hasValue(honor?.honor_type) ||
        hasValue(honor?.description) ||
        hasValue(honor?.image)
    );

    if (!filtered.length) {
      return renderEmptySection(
        "honors",
        "fa fa-award",
        "Honors & Awards",
        "No honors records found"
      );
    }

    return (
      <section id="honors" className="profile-card profile-section">
        <h5>
          <i className="fa fa-award" /> Honors & Awards
        </h5>
        <div className="content-grid">
          {filtered.map((honor, index) => {
            const image = normalizeUrl(honor?.image || honor?.image_url);
            return (
              <div className="content-card" key={`honor-${index}`}>
                <div className="card-image">
                  {image ? (
                    <img src={image} alt={clean(honor?.title || "Honor")} loading="lazy" />
                  ) : (
                    <i className="fa fa-award" />
                  )}
                </div>
                <div className="card-content">
                  {hasValue(honor?.title) ? (
                    <div className="card-title">{clean(honor.title)}</div>
                  ) : null}
                  {renderMetaItems([
                    {
                      icon: "fa fa-building",
                      value: clean(honor?.honouring_organization),
                    },
                    {
                      icon: "fa fa-calendar",
                      value: clean(honor?.honor_year),
                    },
                    {
                      icon: "fa fa-tag",
                      value: clean(honor?.honor_type),
                    },
                  ])}
                  {hasValue(honor?.description) ? (
                    <div className="card-desc">{clean(honor.description)}</div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  if (sectionKey === "journals") {
    const filtered = journals.filter(
      (journal) =>
        hasValue(journal?.title) ||
        hasValue(journal?.publication_organization) ||
        hasValue(journal?.publication_year) ||
        hasValue(journal?.description) ||
        hasValue(journal?.url) ||
        hasValue(journal?.image)
    );

    if (!filtered.length) {
      return renderEmptySection(
        "journals",
        "fa fa-book",
        "Patents",
        "No patent found"
      );
    }

    return (
      <section id="journals" className="profile-card profile-section">
        <h5>
          <i className="fa fa-book" /> Patents
        </h5>
        <div className="content-grid">
          {filtered.map((journal, index) => {
            const image = normalizeUrl(journal?.image || journal?.image_url);
            const link = normalizeUrl(journal?.url);
            return (
              <div className="content-card" key={`journal-${index}`}>
                <div className="card-image">
                  {image ? (
                    <img
                      src={image}
                      alt={clean(journal?.title || "Patent")}
                      loading="lazy"
                    />
                  ) : (
                    <i className="fa fa-newspaper" />
                  )}
                </div>
                <div className="card-content">
                  {hasValue(journal?.title) ? (
                    <div className="card-title">{clean(journal.title)}</div>
                  ) : null}
                  {renderMetaItems([
                    {
                      icon: "fa fa-building",
                      value: clean(journal?.publication_organization),
                    },
                    {
                      icon: "fa fa-calendar",
                      value: clean(journal?.publication_year),
                    },
                  ])}
                  {hasValue(journal?.description) ? (
                    <div className="card-desc">{clean(journal.description)}</div>
                  ) : null}
                  {link ? (
                    <div className="card-link">
                      <a href={link} target="_blank" rel="noopener noreferrer">
                        <i className="fa fa-external-link-alt" /> View Publication
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  if (sectionKey === "conferences") {
    const filtered = conferences.filter(
      (conf) =>
        hasValue(conf?.title) ||
        hasValue(conf?.publication_year) ||
        hasValue(conf?.location) ||
        hasValue(conf?.publication_type) ||
        hasValue(conf?.conference_name) ||
        hasValue(conf?.domain) ||
        hasValue(conf?.description) ||
        hasValue(conf?.url) ||
        hasValue(conf?.image)
    );

    if (!filtered.length) {
      return renderEmptySection(
        "conferences",
        "fa fa-microphone",
        "Publications",
        "No publications found"
      );
    }

    return (
      <section id="conferences" className="profile-card profile-section">
        <h5>
          <i className="fa fa-microphone" /> Publications
        </h5>
        <div className="content-grid">
          {filtered.map((conf, index) => {
            const image = normalizeUrl(conf?.image || conf?.image_url);
            const link = normalizeUrl(conf?.url);
            return (
              <div className="content-card" key={`conf-${index}`}>
                <div className="card-image">
                  {image ? (
                    <img
                      src={image}
                      alt={clean(conf?.title || "Publication")}
                      loading="lazy"
                    />
                  ) : (
                    <i className="fa fa-microphone-alt" />
                  )}
                </div>
                <div className="card-content">
                  {hasValue(conf?.title) ? (
                    <div className="card-title">{clean(conf.title)}</div>
                  ) : null}
                  {renderMetaItems([
                    {
                      icon: "fa fa-calendar",
                      value: clean(conf?.publication_year),
                    },
                    {
                      icon: "fa fa-map-marker-alt",
                      value: clean(conf?.location),
                    },
                    {
                      icon: "fa fa-tag",
                      value: clean(conf?.publication_type),
                    },
                    {
                      icon: "fa fa-building",
                      value: clean(conf?.conference_name),
                    },
                  ])}
                  {hasValue(conf?.domain) ? (
                    <div className="card-badge">{clean(conf.domain)}</div>
                  ) : null}
                  {hasValue(conf?.description) ? (
                    <div className="card-desc">{clean(conf.description)}</div>
                  ) : null}
                  {link ? (
                    <div className="card-link">
                      <a href={link} target="_blank" rel="noopener noreferrer">
                        <i className="fa fa-external-link-alt" /> View Details
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  if (sectionKey === "teaching") {
    const filtered = teaching.filter(
      (teach) =>
        hasValue(teach?.organization_name) ||
        hasValue(teach?.domain) ||
        hasValue(teach?.description)
    );

    if (!filtered.length) {
      return renderEmptySection(
        "teaching",
        "fa fa-chalkboard-teacher",
        "Engagements",
        "No engagements found"
      );
    }

    return (
      <section id="teaching" className="profile-card profile-section">
        <h5>
          <i className="fa fa-chalkboard-teacher" /> Engagements
        </h5>
        <div className="content-grid">
          {filtered.map((teach, index) => (
            <div className="content-card" key={`teach-${index}`}>
              <div className="card-image">
                <i className="fa fa-chalkboard-teacher" />
              </div>
              <div className="card-content">
                {hasValue(teach?.organization_name) ? (
                  <div className="card-title">{clean(teach.organization_name)}</div>
                ) : null}
                {renderMetaItems([
                  {
                    icon: "fa fa-tag",
                    value: clean(teach?.domain),
                  },
                ])}
                {hasValue(teach?.description) ? (
                  <div className="card-desc">{clean(teach.description)}</div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return null;
};

export default function UserProfilePage() {
  const { slug = "" } = useParams();
  const dispatch = useDispatch();
  const sidebarRef = useRef(null);
  const [currentSection, setCurrentSection] = useState("personal");
  const [sectionLoading, setSectionLoading] = useState(false);
  const [showSectionIndicator, setShowSectionIndicator] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(false);

  const profileBlock = useSelector((state) =>
    selectUserProfileBlock(state, slug)
  );

  const profileData = profileBlock?.data || {};
  const basic = profileData?.basic || {};
  const isInitialLoading =
    profileBlock?.status === "loading" && !profileBlock?.data;
  const hasError = profileBlock?.status === "failed";

  useEffect(() => {
    ensureFontAwesome();
  }, []);

  useEffect(() => {
    if (!slug) return;
    dispatch(fetchUserProfile(slug));
  }, [dispatch, slug]);

  useEffect(() => {
    const hash = clean(window.location.hash.replace(/^#/, ""));
    if (hash && SECTION_META[hash]) {
      setCurrentSection(hash);
    }
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const hash = clean(window.location.hash.replace(/^#/, ""));
      if (hash && SECTION_META[hash]) {
        setCurrentSection(hash);
      }
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const updateHint = () => {
      const canScroll = sidebar.scrollHeight > sidebar.clientHeight + 2;
      const atBottom =
        sidebar.scrollTop + sidebar.clientHeight >= sidebar.scrollHeight - 4;
      setShowScrollHint(canScroll && !atBottom);
    };

    updateHint();
    const timer = setTimeout(updateHint, 250);
    sidebar.addEventListener("scroll", updateHint, { passive: true });
    window.addEventListener("resize", updateHint);

    return () => {
      clearTimeout(timer);
      sidebar.removeEventListener("scroll", updateHint);
      window.removeEventListener("resize", updateHint);
    };
  }, [profileData, currentSection]);

  useEffect(() => {
    const name = clean(basic?.name);
    document.title = name ? `User Profile - ${name}` : "User Profile";
  }, [basic]);

  const socialRows = useMemo(
    () => getSocialRows(profileData?.social_media),
    [profileData]
  );

  const handleSectionChange = (sectionKey) => {
    if (!SECTION_META[sectionKey] || sectionKey === currentSection) return;

    setCurrentSection(sectionKey);
    setSectionLoading(true);
    setShowSectionIndicator(true);
    window.history.pushState({}, "", `${window.location.pathname}#${sectionKey}`);

    window.setTimeout(() => {
      setSectionLoading(false);
    }, 220);

    window.setTimeout(() => {
      setShowSectionIndicator(false);
    }, 3000);
  };

  const avatarImage = getProfileImage(basic);
  const roleText = getRoleText(basic);

  const sectionContent = renderSectionContent(currentSection, profileData);

  return (
    <>
      <TopHeaderMenu />
      <MainHeader />
      <HeaderMenu />

      <div className="upx-page">
        <style>{styles}</style>

        <div className="profile-layout">
          <aside className="profile-sidebar" ref={sidebarRef}>
            <div className="profile-avatar-container">
              <div className="profile-avatar">
                {avatarImage ? (
                  <img src={avatarImage} alt={clean(basic?.name || "avatar")} />
                ) : (
                  <i className="fa fa-user-graduate" />
                )}
              </div>
              <div className="profile-badge">
                <i className="fa fa-check" />
              </div>
            </div>

            <div className="profile-name">{clean(basic?.name) || "—"}</div>
            <div style={{ textAlign: "center" }}>
              <div className="profile-role">{roleText.toUpperCase()}</div>
            </div>

            {hasValue(basic?.email) ||
            hasValue(basic?.phone_number) ||
            hasValue(basic?.address) ? (
              <div className="profile-contact">
                {hasValue(basic?.email) ? (
                  <div className="contact-item">
                    <i className="fa fa-envelope" />
                    <span>{clean(basic.email)}</span>
                  </div>
                ) : null}
                {hasValue(basic?.phone_number) ? (
                  <div className="contact-item">
                    <i className="fa fa-phone" />
                    <span>{clean(basic.phone_number)}</span>
                  </div>
                ) : null}
                {hasValue(basic?.address) ? (
                  <div className="contact-item">
                    <i className="fa fa-map-marker-alt" />
                    <span>{clean(basic.address).replace(/\n/g, ", ")}</span>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="profile-social">
              {socialRows.map((item, index) => {
                const link = normalizeUrl(item?.link);
                if (!link) return null;

                const platform = clean(item?.platform).toLowerCase();
                const customIcon = clean(item?.icon);
                const title = clean(item?.platform || "Link");

                if (
                  customIcon &&
                  isProbablyImagePath(customIcon) &&
                  !isProbablyPdf(customIcon)
                ) {
                  return (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={title}
                      key={`social-${index}`}
                    >
                      <img
                        src={normalizeUrl(customIcon)}
                        alt={title}
                        loading="lazy"
                      />
                    </a>
                  );
                }

                const iconClass =
                  customIcon && isProbablyFAClass(customIcon)
                    ? customIcon
                    : SOCIAL_ICON_MAP[platform] || "fa fa-link";

                return (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={title}
                    key={`social-${index}`}
                  >
                    <i className={iconClass} />
                  </a>
                );
              })}
            </div>

            <div className="profile-nav">
              {Object.entries(SECTION_META).map(([key, meta]) => (
                <button
                  key={key}
                  className={currentSection === key ? "active" : ""}
                  onClick={() => handleSectionChange(key)}
                  type="button"
                >
                  <i className={meta.icon} /> {meta.title.split(" & ")[0]}
                </button>
              ))}
            </div>

            <div
              className="scroll-hint"
              style={{ display: showScrollHint ? "flex" : "none" }}
              aria-hidden="true"
            >
              <div className="hint-pill">
                <i className="fa fa-arrow-down" />
              </div>
            </div>
          </aside>

          <main className="profile-content">
            {isInitialLoading || sectionLoading ? (
              <div className="loading-indicator">
                <div className="loading-spinner" />
                <div>
                  {isInitialLoading ? "Loading profile..." : "Loading section..."}
                </div>
              </div>
            ) : null}

            {!isInitialLoading && !sectionLoading ? (
              <div>
                {hasError ? (
                  <div className="profile-card">
                    <div className="empty">
                      <i className="fa fa-exclamation-triangle" />
                      <div>{profileBlock?.error || "Failed to load profile data"}</div>
                    </div>
                  </div>
                ) : sectionContent}
              </div>
            ) : null}
          </main>
        </div>

        <div
          className="section-indicator"
          style={{ display: showSectionIndicator ? "block" : "none" }}
        >
          Viewing: <span>{SECTION_META[currentSection]?.title || "Section"}</span>
        </div>
      </div>

      <Footer />
    </>
  );
}