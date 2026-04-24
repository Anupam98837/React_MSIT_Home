import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Footer from "../components/Footer";
import HeaderMenu from "../components/HeaderMenu";
import MainHeader from "../components/MainHeader";
import TopHeaderMenu from "../components/TopHeaderMenu";
import {
  CONTACT_US_LEGAL_TEXT_1,
  CONTACT_US_LEGAL_TEXT_2,
  fetchContactUsPageData,
  resetContactUsSubmitState,
  selectContactUsPage,
  selectContactUsSubmit,
  submitContactUs,
} from "../../redux/crm/contactUsSlice";

function InlineAlert({ type = "info", text = "" }) {
  if (!text) return null;

  const className =
    type === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <div className={`mb-3 rounded-xl border px-3 py-2 text-[12.5px] font-semibold ${className}`}>
      {text}
    </div>
  );
}

export default function ContactUs() {
  const dispatch = useDispatch();
  const page = useSelector(selectContactUsPage);
  const submitState = useSelector(selectContactUsSubmit);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentPromotions, setConsentPromotions] = useState(false);
  const [localMessage, setLocalMessage] = useState({ type: "info", text: "" });

  useEffect(() => {
    dispatch(fetchContactUsPageData());
    dispatch(resetContactUsSubmitState());
  }, [dispatch]);

  const canSubmit = useMemo(() => {
    return (
      Boolean(firstName.trim()) &&
      Boolean(email.trim()) &&
      Boolean(message.trim()) &&
      consentTerms &&
      consentPromotions &&
      submitState.status !== "loading"
    );
  }, [firstName, email, message, consentTerms, consentPromotions, submitState.status]);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setMessage("");
    setConsentTerms(false);
    setConsentPromotions(false);
    setLocalMessage({ type: "info", text: "" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalMessage({ type: "info", text: "" });

    if (!firstName.trim() || !email.trim() || !message.trim()) {
      setLocalMessage({
        type: "error",
        text: "Please fill all required fields",
      });
      return;
    }

    if (!(consentTerms && consentPromotions)) {
      setLocalMessage({
        type: "error",
        text: "Please accept the required agreements to continue.",
      });
      return;
    }

    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim() ? lastName.trim() : null,
      email: email.trim(),
      phone: phone.trim() ? phone.trim() : null,
      message: message.trim(),
      legal_authority_json: [
        { key: "terms", text: CONTACT_US_LEGAL_TEXT_1, accepted: true },
        { key: "promotions", text: CONTACT_US_LEGAL_TEXT_2, accepted: true },
      ],
    };

    try {
      await dispatch(submitContactUs(payload)).unwrap();
      setLocalMessage({
        type: "success",
        text: "Message sent successfully",
      });
      resetForm();
      dispatch(resetContactUsSubmitState());
    } catch (error) {
      setLocalMessage({
        type: "error",
        text: error || "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <>
      <style>
        {`
          :root{
            --contact-accent:#8f2d2f;
            --contact-accent-2:#6f2224;
            --contact-ink:#12212b;
            --contact-muted:#5b6b76;
            --contact-line:#e7eaee;
            --contact-surface:#ffffff;
          }

          .cu-wrap{ max-width: 980px; margin: 0 auto; padding: 28px 16px 44px; }

          .cu-hero{ text-align:center; padding-top: 6px; }
          .cu-hero h1{ margin:0; font-weight:800; letter-spacing:.2px; color:var(--contact-ink); font-size:34px; }
          .cu-hero p{ margin:8px 0 0; color:var(--contact-muted); font-size:14.5px; }

          .cu-info-grid{
            margin-top: 28px;
            display:grid;
            grid-template-columns: 1fr 1fr;
            gap: 22px 54px;
            align-items:start;
          }

          .cu-item{ display:flex; gap:14px; align-items:flex-start; }

          .cu-icon{
            width:54px; height:54px; border-radius:999px;
            background: var(--contact-accent);
            display:flex; align-items:center; justify-content:center;
            flex:0 0 54px;
            box-shadow: 0 10px 18px rgba(143,45,47,.15);
          }

          .cu-icon i{ color:#fff; font-size:18px; }

          .cu-item h4{ margin:0; font-weight:800; color:var(--contact-ink); font-size:18px; }
          .cu-item .cu-text{ margin-top:6px; color:#3b4a55; line-height:1.5; font-size:14.5px; }
          .cu-item .cu-link{ color:var(--contact-accent); text-decoration:none; font-weight:700; }
          .cu-item .cu-link:hover{ color:var(--contact-accent-2); text-decoration:underline; }
          .cu-item .cu-muted{ color: var(--contact-muted); }

          .cu-form-wrap{
            margin-top:26px;
            background: var(--contact-surface);
            border:1px solid var(--contact-line);
            border-radius:16px;
            padding:18px;
            box-shadow: 0 14px 30px rgba(16, 24, 40, .06);
          }

          .cu-form-head{
            display:flex; align-items:flex-start; justify-content:space-between;
            gap:12px; margin-bottom:12px;
          }

          .cu-form-head h3{ margin:0; font-weight:900; color:var(--contact-ink); font-size:18px; }
          .cu-form-head p{ margin:4px 0 0; color:var(--contact-muted); font-size:13.5px; }

          .cu-form{ margin-top:10px; display:grid; grid-template-columns:1fr 1fr; gap:12px; }
          .cu-form .full{ grid-column: 1 / -1; }

          .cu-form label{ display:block; font-weight:800; color:var(--contact-ink); font-size:13px; margin:0 0 6px; }

          .cu-form input, .cu-form textarea{
            width:100%;
            border:1px solid var(--contact-line);
            border-radius:12px;
            padding:11px 12px;
            font-size:14px;
            outline:none;
            background:#fff;
          }

          .cu-form textarea{ min-height:120px; resize:vertical; }

          .cu-form input:focus, .cu-form textarea:focus{
            border-color: rgba(143,45,47,.55);
            box-shadow: 0 0 0 3px rgba(143,45,47,.15);
          }

          .cu-consent{
            grid-column: 1 / -1;
            margin-top: 6px;
            padding-top: 8px;
            border-top: 1px dashed rgba(15,23,42,.12);
            display:flex;
            flex-direction:column;
            gap:10px;
          }

          .cu-check{
            display:flex;
            gap:10px;
            align-items:flex-start;
            font-size:13.5px;
            color:#2f3d46;
            line-height:1.45;
          }

          .cu-check input{
            width:18px; height:18px;
            margin-top:2px;
            accent-color: var(--contact-accent);
            flex:0 0 auto;
          }

          .cu-actions{
            grid-column: 1 / -1;
            display:flex; gap:10px; align-items:center; justify-content:flex-start;
            margin-top:4px;
            flex-wrap: wrap;
          }

          .cu-btn{
            border:none;
            background: var(--contact-accent);
            color:#fff;
            padding:11px 18px;
            border-radius:12px;
            font-weight:900;
            cursor:pointer;
            display:inline-flex;
            align-items:center;
            gap:8px;
            transition: background .15s ease, transform .15s ease, opacity .15s ease;
          }

          .cu-btn:hover{ background: var(--contact-accent-2); }
          .cu-btn:disabled{
            opacity:.55;
            cursor:not-allowed;
            filter: grayscale(.05);
          }

          .cu-note{ color:var(--contact-muted); font-size:13px; }

          .cu-find{ margin-top:26px; text-align:center; }
          .cu-find h2{ margin:0 0 12px; font-weight:900; color:var(--contact-ink); font-size:24px; }

          .cu-map{
            border:1px solid var(--contact-line);
            border-radius:16px;
            overflow:hidden;
            box-shadow: 0 14px 30px rgba(16, 24, 40, .06);
            background:#fff;
          }

          .cu-map iframe{ width:100%; height:320px; border:0; display:block; }

          @media(max-width: 900px){
            .cu-info-grid{ grid-template-columns:1fr; gap:18px; }
            .cu-form{ grid-template-columns:1fr; }
            .cu-hero h1{ font-size:30px; }
          }
        `}
      </style>

      <TopHeaderMenu />
      <MainHeader />
      <HeaderMenu />

      <main className="min-h-screen bg-[#f6f7fb]">
        <div className="cu-wrap">
          <div className="cu-hero">
            <h1>{page.heroTitle || "Contact Us"}</h1>
            <p>{page.heroSubtitle || "Excellence in Technical Education"}</p>
          </div>

          {page.showInfoGrid && page.infoCards?.length > 0 ? (
            <div className="cu-info-grid">
              {page.infoCards.map((item) => (
                <div key={item.slot} className="cu-item">
                  <div className="cu-icon">
                    <i className={item.icon} aria-hidden="true" />
                  </div>

                  <div>
                    <h4>{item.title}</h4>

                    <div className="cu-text">
                      {item.value ? (
                        item.href && item.slot !== "address" ? (
                          <a
                            className="cu-link"
                            href={item.href}
                            target={
                              item.href.startsWith("http://") || item.href.startsWith("https://")
                                ? "_blank"
                                : undefined
                            }
                            rel={
                              item.href.startsWith("http://") || item.href.startsWith("https://")
                                ? "noreferrer"
                                : undefined
                            }
                          >
                            {item.value}
                          </a>
                        ) : (
                          <span className={item.multiline ? "whitespace-pre-line" : ""}>
                            {item.value}
                          </span>
                        )
                      ) : (
                        <span className="cu-muted">Not available</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {page.showForm ? (
            <div className="cu-form-wrap">
              <div className="cu-form-head">
                <div>
                  <h3>Send a Message</h3>
                  <p>Fill the form and we’ll get back to you as soon as possible.</p>
                </div>
              </div>

              <InlineAlert type={localMessage.type} text={localMessage.text} />

              <form className="cu-form" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="first_name">First Name *</label>
                  <input
                    id="first_name"
                    type="text"
                    placeholder="Your first name"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="last_name">Last Name</label>
                  <input
                    id="last_name"
                    type="text"
                    placeholder="Your last name (optional)"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                  />
                </div>

                <div className="full">
                  <label htmlFor="email">Email *</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>

                <div className="full">
                  <label htmlFor="phone">Phone</label>
                  <input
                    id="phone"
                    type="text"
                    placeholder="Your phone number (optional)"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                </div>

                <div className="full">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    placeholder="Write your message..."
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    required
                  />
                </div>

                <div className="cu-consent">
                  <label className="cu-check" htmlFor="consent_terms">
                    <input
                      id="consent_terms"
                      type="checkbox"
                      checked={consentTerms}
                      onChange={(event) => setConsentTerms(event.target.checked)}
                    />
                    <span>{CONTACT_US_LEGAL_TEXT_1}</span>
                  </label>

                  <label className="cu-check" htmlFor="consent_promotions">
                    <input
                      id="consent_promotions"
                      type="checkbox"
                      checked={consentPromotions}
                      onChange={(event) => setConsentPromotions(event.target.checked)}
                    />
                    <span>{CONTACT_US_LEGAL_TEXT_2}</span>
                  </label>
                </div>

                <div className="cu-actions">
                  <button className="cu-btn" type="submit" disabled={!canSubmit}>
                    {submitState.status === "loading" ? (
                      <>
                        <i className="fa-solid fa-spinner animate-spin" aria-hidden="true" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-paper-plane" aria-hidden="true" />
                        Send Message
                      </>
                    )}
                  </button>

                  <span className="cu-note">We never share your details.</span>
                </div>
              </form>
            </div>
          ) : null}

          {page.showMap ? (
            <div className="cu-find">
              <h2>Find Us</h2>
              <div className="cu-map">
                <iframe
                  src={page.mapSrc}
                  title="Find Us Map"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <Footer />
    </>
  );
}