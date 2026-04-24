import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchEnquiryCourses,
  resetEnquirySubmitState,
  selectEnquiryCourses,
  selectEnquirySubmit,
  setEnquiryToast,
  submitEnquiry,
} from "../../redux/enquirySlice";

const LEGAL_TEXT_1 = "I agree to the Terms and conditions *";
const LEGAL_TEXT_2 =
  "I agree to receive communication on newsletters, promotional content, offers & events via SMS/RCS *";

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const genCode = (len = 6) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";

  for (let i = 0; i < len; i += 1) {
    out += chars[rand(0, chars.length - 1)];
  }

  return out;
};

const groupCourses = (courses = []) => {
  const groups = {
    "B.Tech in": [],
    "AICTE Bachelor Degree": [],
    "M.Tech in": [],
    "MCA & MBA": [],
    "Other Courses": [],
  };

  courses.forEach((course) => {
    const title = String(course?.title || "").toUpperCase();
    const level = String(course?.programLevel || "").toLowerCase();

    if (title.includes("M.TECH") || title.includes("M. TECH")) {
      groups["M.Tech in"].push(course);
      return;
    }

    if (title.includes("MCA") || title.includes("MBA")) {
      groups["MCA & MBA"].push(course);
      return;
    }

    if (title.includes("BCA") || title.includes("BBA")) {
      groups["AICTE Bachelor Degree"].push(course);
      return;
    }

    if (level === "ug") {
      groups["B.Tech in"].push(course);
      return;
    }

    groups["Other Courses"].push(course);
  });

  return Object.entries(groups).filter(([, items]) => items.length > 0);
};

function ToastInline({ type = "info", text = "" }) {
  if (!text) return null;

  const toneClass =
    type === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <div className={`rounded-xl border px-3 py-2 text-[12.5px] font-semibold ${toneClass}`}>
      {text}
    </div>
  );
}

export default function Enquiry({
  isOpen = false,
  onSubmitted,
  useGlobalToast = Boolean(onSubmitted),
}) {
  const dispatch = useDispatch();
  const { items: courses, status: coursesStatus, error: coursesError } =
    useSelector(selectEnquiryCourses);
  const submitState = useSelector(selectEnquirySubmit);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isAdmissionEnquiry, setIsAdmissionEnquiry] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentPromotions, setConsentPromotions] = useState(false);
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaCode, setCaptchaCode] = useState(() => genCode(6));
  const [localMessage, setLocalMessage] = useState({ type: "info", text: "" });

  const canvasRef = useRef(null);

  const groupedCourses = useMemo(() => groupCourses(courses), [courses]);

  useEffect(() => {
    if (!isOpen) return;
    dispatch(resetEnquirySubmitState());
  }, [dispatch, isOpen]);

  useEffect(() => {
    if (!isOpen || !isAdmissionEnquiry) return;
    if (coursesStatus === "idle") {
      dispatch(fetchEnquiryCourses());
    }
  }, [dispatch, isOpen, isAdmissionEnquiry, coursesStatus]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.moveTo(rand(0, canvas.width), rand(0, canvas.height));
      ctx.lineTo(rand(0, canvas.width), rand(0, canvas.height));
      ctx.strokeStyle = `rgba(143,45,47,${Math.random() * 0.25 + 0.1})`;
      ctx.lineWidth = rand(1, 2);
      ctx.stroke();
    }

    for (let i = 0; i < 28; i += 1) {
      ctx.beginPath();
      ctx.arc(rand(0, canvas.width), rand(0, canvas.height), rand(1, 2), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(16,24,40,${Math.random() * 0.12 + 0.05})`;
      ctx.fill();
    }

    ctx.font = "900 22px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.textBaseline = "middle";

    const startX = 10;
    const gap = 18;

    for (let i = 0; i < captchaCode.length; i += 1) {
      const ch = captchaCode[i];
      const x = startX + i * gap;
      const y = Math.floor(canvas.height / 2);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.45);
      ctx.fillStyle = `rgba(18,33,43,${Math.random() * 0.2 + 0.78})`;
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    }

    ctx.strokeStyle = "rgba(231,234,238,1)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
  }, [captchaCode]);

  const refreshCaptcha = () => {
    setCaptchaCode(genCode(6));
    setCaptchaInput("");
  };

  const captchaOk = useMemo(() => {
    const typed = captchaInput.trim();
    if (!typed) return false;
    if (typed !== typed.toUpperCase()) return false;
    return typed === captchaCode;
  }, [captchaCode, captchaInput]);

  const checkedCount = selectedCourseIds.length;

  const canSubmit =
    Boolean(name.trim()) &&
    Boolean(phone.trim()) &&
    consentTerms &&
    consentPromotions &&
    captchaOk &&
    (!isAdmissionEnquiry || checkedCount > 0) &&
    submitState.status !== "loading";

  const toggleCourse = (courseId) => {
    setSelectedCourseIds((current) =>
      current.includes(courseId)
        ? current.filter((id) => id !== courseId)
        : [...current, courseId]
    );
  };

  const raiseMessage = (type, title, text) => {
    const messageText = text || title || "";
    setLocalMessage({ type, text: messageText });

    if (useGlobalToast) {
      dispatch(
        setEnquiryToast({
          type,
          title,
          message: messageText,
        })
      );
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setMessage("");
    setIsAdmissionEnquiry(false);
    setSelectedCourseIds([]);
    setConsentTerms(false);
    setConsentPromotions(false);
    setLocalMessage({ type: "info", text: "" });
    refreshCaptcha();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalMessage({ type: "info", text: "" });

    if (!name.trim() || !phone.trim()) {
      raiseMessage("error", "Error", "Please fill all required fields (Name, Phone).");
      return;
    }

    if (isAdmissionEnquiry && checkedCount === 0) {
      raiseMessage("error", "Error", "Please select at least one course.");
      return;
    }

    if (!(consentTerms && consentPromotions)) {
      raiseMessage(
        "error",
        "Error",
        "Please accept the required agreements to continue."
      );
      return;
    }

    if (!captchaOk) {
      raiseMessage(
        "error",
        "Error",
        "Captcha does not match. Use CAPITAL letters only."
      );
      refreshCaptcha();
      return;
    }

    const payload = {
      name: name.trim(),
      email: email.trim() ? email.trim() : null,
      phone: phone.trim(),
      message: message.trim() ? message.trim() : null,
      is_admission_enquiry: isAdmissionEnquiry ? true : null,
      course_ids: isAdmissionEnquiry ? selectedCourseIds : null,
      legal_authority_json: [
        { key: "terms", text: LEGAL_TEXT_1, accepted: true },
        { key: "promotions", text: LEGAL_TEXT_2, accepted: true },
      ],
    };
  };

  return (
    <>
      <style>
        {`
          .enq-course-name-gradient {
            display: inline-block;
            font-weight: 500;
            background: linear-gradient(
              to bottom,
              #111111 0%,
              #2b1516 25%,
              #5d1f21 55%,
              #8f2d2f 78%,
              #8f2d2f 100%
            );
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            color: transparent;
          }
        `}
      </style>

      <div className="mx-auto w-full max-w-[980px]">
        <div className="rounded-[14px] border border-[#e7eaee] bg-white px-[14px] py-3 shadow-[0_14px_30px_rgba(16,24,40,.06)]">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div>
              <h3 className="m-0 text-[17px] font-black text-[#12212b]">Enquiry</h3>
            </div>
          </div>

          <ToastInline type={localMessage.type} text={localMessage.text} />

          <form
            className="mt-2 grid grid-cols-1 gap-x-3 gap-y-[7px] md:grid-cols-3"
            autoComplete="off"
            onSubmit={handleSubmit}
          >
            <div>
              <label
                htmlFor="enquiry-name"
                className="mb-[3px] block text-[12px] font-extrabold text-[#12212b]"
              >
                Name *
              </label>
              <input
                id="enquiry-name"
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-9 w-full rounded-[10px] border border-[#e7eaee] bg-white px-[10px] py-[7px] text-[13px] outline-none transition focus:border-[rgba(143,45,47,.55)] focus:ring-4 focus:ring-[rgba(143,45,47,.12)]"
                required
              />
            </div>

            <div>
              <label
                htmlFor="enquiry-email"
                className="mb-[3px] block text-[12px] font-extrabold text-[#12212b]"
              >
                Email
              </label>
              <input
                id="enquiry-email"
                type="email"
                placeholder="your@email.com (optional)"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-9 w-full rounded-[10px] border border-[#e7eaee] bg-white px-[10px] py-[7px] text-[13px] outline-none transition focus:border-[rgba(143,45,47,.55)] focus:ring-4 focus:ring-[rgba(143,45,47,.12)]"
              />
            </div>

            <div>
              <label
                htmlFor="enquiry-phone"
                className="mb-[3px] block text-[12px] font-extrabold text-[#12212b]"
              >
                Phone *
              </label>
              <input
                id="enquiry-phone"
                type="text"
                placeholder="Your phone number"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="h-9 w-full rounded-[10px] border border-[#e7eaee] bg-white px-[10px] py-[7px] text-[13px] outline-none transition focus:border-[rgba(143,45,47,.55)] focus:ring-4 focus:ring-[rgba(143,45,47,.12)]"
                required
              />
            </div>

            <div className="md:col-span-3 flex items-center justify-between gap-[10px] rounded-xl border border-dashed border-[rgba(15,23,42,.14)] bg-[rgba(143,45,47,.03)] px-3 py-[7px]">
              <div className="min-w-0">
                <div className="text-[12.5px] font-black leading-[1.2] text-[#12212b]">
                  Enquiring for Admission?
                </div>
                <div className="text-[11.5px] leading-[1.2] text-[#5b6b76]">
                  Turn ON if you want admission-related help.
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isAdmissionEnquiry}
                onClick={() =>
                  setIsAdmissionEnquiry((current) => {
                    const next = !current;
                    if (!next) setSelectedCourseIds([]);
                    return next;
                  })
                }
                className={`relative h-7 w-[42px] shrink-0 rounded-full transition-colors duration-200 ease-out ${
                  isAdmissionEnquiry ? "bg-[#8f2d2f]" : "bg-[#e5e7eb]"
                }`}
                title="Admission enquiry toggle"
              >
                <span
                  className={`absolute left-[3px] top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-[0_10px_20px_rgba(16,24,40,.12)] transition-transform duration-200 ease-out ${
                    isAdmissionEnquiry ? "translate-x-[18px]" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {isAdmissionEnquiry ? (
              <div className="md:col-span-3">
                <label className="mb-1.5 block text-[12px] font-extrabold text-[#12212b]">
                  Interested Course(s) *
                </label>

                <div className="rounded-[10px] border border-[#e7eaee] bg-white p-3">
                  {coursesStatus === "loading" ? (
                    <div className="text-[13px] text-[#5b6b76]">Loading courses...</div>
                  ) : coursesStatus === "failed" ? (
                    <div className="text-[13px] text-red-600">
                      {coursesError || "Unable to load courses"}
                    </div>
                  ) : groupedCourses.length ? (
                    <div className="space-y-2">
                      {groupedCourses.map(([groupTitle, items]) => (
                        <div key={groupTitle}>
                          <div className="mb-[6px] border-b border-dashed border-[#e7eaee] pb-[3px] text-[13px] font-semibold text-[#8f2d2f]">
                            {groupTitle}
                          </div>
                          <div
                            className={`grid gap-2 ${
                              groupTitle === "MCA & MBA"
                                ? "grid-cols-1 sm:grid-cols-2"
                                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                            }`}
                          >
                            {items.map((course) => (
                              <label
                                key={course.id}
                                className="flex cursor-pointer items-center gap-[6px] text-[12.5px]"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedCourseIds.includes(course.id)}
                                  onChange={() => toggleCourse(course.id)}
                                  className="h-[15px] w-[15px] cursor-pointer accent-[#8f2d2f]"
                                />
                                <span className="enq-course-name-gradient">
                                  {course.customName || course.title}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[13px] text-[#5b6b76]">No courses found</div>
                  )}
                </div>

                <div className="mt-[3px] text-[11px] leading-[1.2] text-[#5b6b76]">
                  Select one or more courses you are interested in.
                </div>
              </div>
            ) : null}

            <div className="md:col-span-3 mt-[6px] border-t border-dashed border-[rgba(15,23,42,.12)] pt-[6px]" />

            <div>
              <label
                htmlFor="enquiry-message"
                className="mb-[3px] block text-[12px] font-extrabold text-[#12212b]"
              >
                Message
              </label>
              <textarea
                id="enquiry-message"
                placeholder="Write your message..."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="h-[58px] min-h-[58px] w-full rounded-[10px] border border-[#e7eaee] bg-white px-[10px] py-2 text-[13px] outline-none transition focus:border-[rgba(143,45,47,.55)] focus:ring-4 focus:ring-[rgba(143,45,47,.12)]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-[3px] block text-[12px] font-extrabold text-[#12212b]">
                Agreements *
              </label>
              <div className="grid gap-1">
                <label className="m-0 flex items-start gap-[7px] text-[11.5px] leading-[1.3] text-[#2f3d46]">
                  <input
                    type="checkbox"
                    checked={consentTerms}
                    onChange={(event) => setConsentTerms(event.target.checked)}
                    className="mt-px h-[15px] w-[15px] shrink-0 accent-[#8f2d2f]"
                  />
                  <span className="font-medium">{LEGAL_TEXT_1}</span>
                </label>

                <label className="m-0 flex items-start gap-[7px] text-[11.5px] leading-[1.3] text-[#2f3d46]">
                  <input
                    type="checkbox"
                    checked={consentPromotions}
                    onChange={(event) => setConsentPromotions(event.target.checked)}
                    className="mt-px h-[15px] w-[15px] shrink-0 accent-[#8f2d2f]"
                  />
                  <span className="font-medium">{LEGAL_TEXT_2}</span>
                </label>
              </div>
            </div>

            <div className="md:col-span-3 grid grid-cols-1 gap-3 md:grid-cols-2 md:items-end">
              <div>
                <label
                  htmlFor="captcha-input"
                  className="mb-1 block text-[12px] font-extrabold text-[#12212b]"
                >
                  Captcha *
                </label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="h-[42px] w-[130px] shrink-0 overflow-hidden rounded-[10px] border border-[#e7eaee] bg-white shadow-[0_6px_14px_rgba(16,24,40,.05)]">
                    <canvas
                      ref={canvasRef}
                      width="130"
                      height="42"
                      className="block h-[42px] w-[130px]"
                    />
                  </div>

                  <button
                    id="refreshCaptcha"
                    type="button"
                    onClick={refreshCaptcha}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-[#e7eaee] bg-white px-[10px] text-[12.5px] font-black text-[#12212b] transition hover:border-[rgba(143,45,47,.35)] hover:shadow-[0_0_0_3px_rgba(143,45,47,.10)]"
                  >
                    <i className="fa-solid fa-rotate-right" aria-hidden="true" />
                    Refresh
                  </button>

                  <div className="min-w-[150px] flex-1">
                    <input
                      id="captcha-input"
                      type="text"
                      inputMode="text"
                      placeholder="ENTER CAPTCHA (CAPITAL)"
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      value={captchaInput}
                      onChange={(event) => setCaptchaInput(event.target.value.toUpperCase())}
                      className="h-9 w-full rounded-[10px] border border-[#e7eaee] bg-white px-[10px] py-[7px] text-[13px] uppercase outline-none transition focus:border-[rgba(143,45,47,.55)] focus:ring-4 focus:ring-[rgba(143,45,47,.12)]"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-[10px] md:justify-start">
                <button
                  id="submitBtn"
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-[10px] bg-[#8f2d2f] px-4 py-2 text-[13px] font-black text-white transition hover:bg-[#6f2224] disabled:cursor-not-allowed disabled:opacity-55"
                >
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

                <span className="text-[11.5px] leading-[1.25] text-[#5b6b76]">
                  We&apos;ll get back to you as soon as possible.
                </span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}