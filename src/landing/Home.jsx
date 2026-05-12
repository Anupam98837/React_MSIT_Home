import {
  Fragment,
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Transition,
} from "@headlessui/react";
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import HeaderMenu from "./components/HeaderMenu";
import MainHeader from "./components/MainHeader";
import StickyButtons from "./components/StickyButtons";
import TopHeaderMenu from "./components/TopHeaderMenu";
import HomePageLoader from "./home/HomePageLoader";
import HeroCarousel from "./home/HeroCarousel";
import NoticeMarquee from "./home/NoticeMarquee";
import useHomeLoader from "./home/useHomeLoader";
import LazySection from "../components/LazySection";

import {
  selectMainHeader,
  selectModuleHeader,
  selectTopHeader,
} from "../redux/headerSlice";
import { selectHeroCarousel } from "../redux/heroCarouselSlice";
import {
  clearEnquiryToast,
  closeEnquiryModal,
  openEnquiryModal,
  selectEnquiryModalOpen,
  selectEnquiryToast,
} from "../redux/enquirySlice";
import { fetchFooterData, selectFooter } from "../redux/footerSlice";

const InfoBoxes = lazy(() => import("./home/InfoBoxes"));
const NvaRow = lazy(() => import("./home/NvaRow"));
const HomeHighlights = lazy(() => import("./home/HomeHighlights"));
const Courses = lazy(() => import("./home/Course"));
const UgCourses = lazy(() => import("./home/UgCourses"));
const Stats = lazy(() => import("./home/Stats"));
const Testimonials = lazy(() => import("./home/Testimonials"));
const Alumni = lazy(() => import("./home/Alumni"));
const SuccessStories = lazy(() => import("./home/SuccessStories"));
const Recruiters = lazy(() => import("./home/Recruiters"));
const MobileHomeQuickAccess = lazy(() => import("./home/MobileHomeQuickAccess"));
const Footer = lazy(() => import("./components/Footer"));
import Enquiry from "./home/Enquiry";

const SECTION_ROOT_MARGIN = "1400px 0px";
const FOOTER_ROOT_MARGIN = "1800px 0px";
const COOKIE_CONSENT_NAME = "msit_cookie_consent";
const COOKIE_ANALYTICS_NAME = "msit_cookie_analytics";
const COOKIE_MARKETING_NAME = "msit_cookie_marketing";
const COOKIE_CONSENT_MAX_AGE_SECONDS = 180 * 24 * 60 * 60;
const ENQUIRY_MODAL_COOKIE_NAME = "msit_enquiry_modal_seen_at";
const ENQUIRY_MODAL_COOLDOWN_SECONDS = 24 * 60 * 60;
const ENQUIRY_MODAL_COOLDOWN_MS = ENQUIRY_MODAL_COOLDOWN_SECONDS * 1000;

const getCookieValue = (name) => {
  if (typeof document === "undefined") return "";

  const encodedName = `${encodeURIComponent(name)}=`;
  return (
    document.cookie
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(encodedName))
      ?.slice(encodedName.length) || ""
  );
};

const setCookieValue = (name, value, maxAgeSeconds) => {
  if (typeof document === "undefined") return;

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value
  )}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax${secure}`;
};

const hasCookieChoice = () => Boolean(getCookieValue(COOKIE_CONSENT_NAME));

const allowsNecessaryCookies = () =>
  ["accepted", "custom"].includes(
    decodeURIComponent(getCookieValue(COOKIE_CONSENT_NAME) || "")
  );

const rememberEnquiryModalSeen = () => {
  if (!allowsNecessaryCookies()) return;

  setCookieValue(
    ENQUIRY_MODAL_COOKIE_NAME,
    String(Date.now()),
    ENQUIRY_MODAL_COOLDOWN_SECONDS
  );
};

const shouldAutoOpenEnquiryModal = () => {
  if (!allowsNecessaryCookies()) return false;

  const rawValue = getCookieValue(ENQUIRY_MODAL_COOKIE_NAME);
  const lastSeenAt = Number(decodeURIComponent(rawValue || ""));

  if (!Number.isFinite(lastSeenAt) || lastSeenAt <= 0) return true;

  return Date.now() - lastSeenAt > ENQUIRY_MODAL_COOLDOWN_MS;
};

function normalizeRotateLines(raw) {
  if (raw == null) return [];

  let value = raw;

  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return [];

    try {
      value = JSON.parse(text);
    } catch {
      return text
        .split(/\r?\n|\||,/g)
        .map((item) => String(item || "").trim())
        .filter(Boolean);
    }
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    value = value.lines || value.items || value.texts || [];
  }

  if (!Array.isArray(value)) return [];

  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}

function useIsMobileHome() {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => { };

      const media = window.matchMedia("(max-width: 767.98px)");

      if (typeof media.addEventListener === "function") {
        media.addEventListener("change", onStoreChange);
        return () => media.removeEventListener("change", onStoreChange);
      }

      media.addListener(onStoreChange);
      return () => media.removeListener(onStoreChange);
    },
    () => {
      if (typeof window === "undefined") return false;
      return window.matchMedia("(max-width: 767.98px)").matches;
    },
    () => false
  );
}

function HomeSectionFallback({ height = 220, className = "" }) {
  return (
    <div
      className={`w-full animate-pulse rounded-[24px] border border-[#ead7d8] bg-white/80 ${className}`}
      style={{ minHeight: height }}
    />
  );
}

function FooterFallback() {
  return <div className="w-full" style={{ minHeight: 380 }} />;
}

function LazyHomeBlock({
  children,
  height,
  eager = false,
  rootMargin = SECTION_ROOT_MARGIN,
  className = "",
  fallbackClassName = "",
}) {
  return (
    <Suspense
      fallback={
        <HomeSectionFallback height={height} className={fallbackClassName} />
      }
    >
      <LazySection
        eager={eager}
        minHeight={height}
        rootMargin={rootMargin}
        className={className}
        fallback={
          <HomeSectionFallback height={height} className={fallbackClassName} />
        }
      >
        {children}
      </LazySection>
    </Suspense>
  );
}

function HomeEnquiryToast() {
  const dispatch = useDispatch();
  const toast = useSelector(selectEnquiryToast);

  useEffect(() => {
    if (!toast?.id) return undefined;

    const timer = window.setTimeout(() => {
      dispatch(clearEnquiryToast());
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [dispatch, toast?.id]);

  if (!toast) return null;

  const tone =
    toast.type === "success"
      ? {
        bar: "bg-emerald-600",
        iconBg: "bg-emerald-50 text-emerald-700",
        icon: "fa-solid fa-circle-check",
      }
      : toast.type === "error"
        ? {
          bar: "bg-red-600",
          iconBg: "bg-red-50 text-red-700",
          icon: "fa-solid fa-circle-exclamation",
        }
        : {
          bar: "bg-blue-600",
          iconBg: "bg-blue-50 text-blue-700",
          icon: "fa-solid fa-circle-info",
        };

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[10020] flex w-[min(380px,calc(100vw-24px))] flex-col gap-2">
      <div className="pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-[14px] border border-[#e8edf2] bg-white px-3 py-2.5 shadow-[0_18px_40px_rgba(16,24,40,.16)]">
        <span className={`absolute inset-y-0 left-0 w-1 ${tone.bar}`} />

        <div
          className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${tone.iconBg}`}
        >
          <i className={tone.icon} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-black leading-[1.2] text-[#111827]">
            {toast.title || "Notice"}
          </p>
          <p className="mt-0.5 break-words text-[13px] leading-[1.35] text-[#475569]">
            {toast.message || ""}
          </p>
        </div>

        <button
          type="button"
          onClick={() => dispatch(clearEnquiryToast())}
          className="pointer-events-auto rounded-md p-1 text-[#64748b] hover:bg-slate-100 hover:text-[#0f172a]"
          aria-label="Close toast"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function HomeEnquiryButton({ onClick, hidden = false }) {
  if (hidden) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-4 right-4 z-[9998] inline-flex h-12 items-center gap-2 rounded-full border border-[rgba(255,255,255,.48)] bg-[linear-gradient(135deg,var(--primary-color,#9E363A),var(--secondary-color,#6B2528))] px-4 text-[13px] font-black uppercase tracking-[.02em] text-white shadow-[0_16px_36px_rgba(107,37,40,.30)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(107,37,40,.36)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(158,54,58,.35)] focus-visible:ring-offset-2"
      aria-label="Open enquiry form"
    >
      <ChatBubbleLeftRightIcon className="h-5 w-5" aria-hidden="true" />
      <span>Enquiry</span>
    </button>
  );
}

function ToggleSwitch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-[28px] w-[52px] rounded-full border transition ${
        checked
          ? "border-[rgba(158,54,58,.40)] bg-[#9E363A]"
          : "border-[#d7dce2] bg-white"
      }`}
    >
      <span
        className={`absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-[0_4px_10px_rgba(15,23,42,.18)] transition ${
          checked ? "left-[27px]" : "left-[4px]"
        }`}
      />
    </button>
  );
}

function CookiePreferenceRow({
  title,
  description,
  required = false,
  checked = false,
  onChange,
}) {
  return (
    <div className="flex min-h-[58px] items-center justify-between gap-3 rounded-[10px] border border-[#ead7d8] bg-[#fff8f8] px-3.5 py-2.5">
      <div className="min-w-0">
        <p className="m-0 text-[13px] font-black leading-[1.2] text-[#271214]">
          {title}
        </p>
        <p className="m-0 mt-0.5 text-[11.5px] font-medium leading-[1.2] text-[#6b4b4d]">
          {description}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <span className="text-[12px] font-black text-[#7d2d31]">
          {required ? "Required" : checked ? "On" : "Off"}
        </span>
        {required ? (
          <div className="relative h-[28px] w-[52px] rounded-full border border-[rgba(158,54,58,.35)] bg-[#9E363A]">
            <span className="absolute left-[27px] top-[3px] h-5 w-5 rounded-full bg-white shadow-[0_4px_10px_rgba(15,23,42,.18)]" />
          </div>
        ) : (
          <ToggleSwitch checked={checked} onChange={onChange} label={title} />
        )}
      </div>
    </div>
  );
}

function CookieSettingsCard({
  visible,
  mode,
  analytics,
  marketing,
  onAnalyticsChange,
  onMarketingChange,
  onCustomize,
  onReject,
  onAccept,
  onSave,
}) {
  if (!visible) return null;

  if (mode === "customize") {
    return (
      <div className="fixed bottom-4 right-4 z-[10030] w-[min(460px,calc(100vw-28px))] rounded-[18px] border border-[rgba(158,54,58,.18)] bg-white p-4 text-[#271214] shadow-[0_20px_54px_rgba(15,23,42,.22)] sm:p-5">
        <p className="m-0 text-[21px] font-semibold leading-[1.2]">
          Cookie settings
        </p>
        <p className="mt-4 text-[14px] font-medium leading-[1.45] text-[#594245]">
          Our website uses cookies to distinguish you from other users of our
          website. This helps us provide a more personalized experience when
          you browse our website and also allows us to improve our site. You
          can choose not to allow some types of cookies.
        </p>

        <div className="mt-4 flex flex-col gap-2.5">
          <CookiePreferenceRow
            title="Necessary"
            description="Enables security and basic functionality."
            required
            checked
          />
          <CookiePreferenceRow
            title="Analytics"
            description="Enables tracking of site performance."
            checked={analytics}
            onChange={onAnalyticsChange}
          />
          <CookiePreferenceRow
            title="Marketing"
            description="Enables ads personalization and tracking."
            checked={marketing}
            onChange={onMarketingChange}
          />
        </div>

        <button
          type="button"
          onClick={onSave}
          className="mt-5 h-[48px] w-full rounded-[10px] bg-[linear-gradient(135deg,var(--primary-color,#9E363A),var(--secondary-color,#6B2528))] text-[16px] font-black text-white shadow-[0_12px_26px_rgba(107,37,40,.22)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(107,37,40,.28)]"
        >
          Save preferences
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[10030] w-[min(460px,calc(100vw-28px))] rounded-[18px] border border-[rgba(158,54,58,.18)] bg-white p-4 text-[#271214] shadow-[0_20px_54px_rgba(15,23,42,.22)] sm:p-5">
      <p className="m-0 text-[21px] font-semibold leading-[1.2]">
        Cookie settings
      </p>
      <p className="mt-4 text-[14px] font-medium leading-[1.45] text-[#594245]">
        We use cookies to deliver and improve our services, analyze site usage,
        and if you agree, customize or personalize your experience. You can read
        our Cookie Policy here.
      </p>

      <button
        type="button"
        onClick={onCustomize}
        className="mt-4 h-[48px] w-full rounded-[10px] border border-[rgba(158,54,58,.28)] bg-white text-[15px] font-black text-[#7d2d31] transition hover:bg-[#fff5f5]"
      >
        Customize Cookie Settings
      </button>

      <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <button
          type="button"
          onClick={onReject}
          className="h-[48px] rounded-[10px] border border-[rgba(158,54,58,.28)] bg-white text-[15px] font-black text-[#7d2d31] transition hover:bg-[#fff5f5]"
        >
          Reject All Cookies
        </button>
        <button
          type="button"
          onClick={onAccept}
          className="h-[48px] rounded-[10px] bg-[linear-gradient(135deg,var(--primary-color,#9E363A),var(--secondary-color,#6B2528))] text-[15px] font-black text-white shadow-[0_12px_26px_rgba(107,37,40,.22)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(107,37,40,.28)]"
        >
          Accept All Cookies
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const dispatch = useDispatch();
  const location = useLocation();
  const isMobileHome = useIsMobileHome();

  const { status: topStatus } = useSelector(selectTopHeader);
  const { status: mainStatus, item: mainHeaderItem } =
    useSelector(selectMainHeader);
  const { status: menuStatus } = useSelector(selectModuleHeader);
  const { status: heroStatus } = useSelector(selectHeroCarousel);
  const isEnquiryModalOpen = useSelector(selectEnquiryModalOpen);
  const { status: footerStatus } = useSelector(selectFooter);

  const { status: noticeMarqueeStatus } = useSelector(
    (state) => state.noticeMarquee || {}
  );
  const { status: stickyButtonsStatus } = useSelector(
    (state) => state.stickyButtons || {}
  );

  const enquiryStatus =
    mainStatus === "succeeded" || mainStatus === "failed"
      ? "succeeded"
      : "loading";

  const { loaderVisible, loaderDone, loaderProgress, loaderMessage } =
    useHomeLoader({
      topStatus,
      mainStatus,
      menuStatus,
      stickyButtonsStatus,
      noticeMarqueeStatus,
      heroStatus,
      enquiryStatus,
    });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initialTitle = String(window.__APP_DEFAULT_TITLE__ || document.title || "").trim();
    if (initialTitle && !window.__APP_DEFAULT_TITLE__) {
      window.__APP_DEFAULT_TITLE__ = initialTitle;
    }

    if (location.pathname === "/" && window.__APP_DEFAULT_TITLE__) {
      document.title = window.__APP_DEFAULT_TITLE__;
    }
  }, [location.pathname]);

  useEffect(() => {
    if (footerStatus === "idle") {
      dispatch(fetchFooterData());
    }
  }, [dispatch, footerStatus]);

  const popupHeaderTitle =
    mainHeaderItem?.headerText || "MEGHNAD SAHA INSTITUTE OF TECHNOLOGY";

  const popupHeaderLogo =
    mainHeaderItem?.primaryLogo ||
    "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2252%22%20height%3D%2252%22%20viewBox%3D%220%200%2052%2052%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20rx%3D%2212%22%20fill%3D%22%23f3f4f6%22%2F%3E%3Cpath%20d%3D%22M16%2016h20v20H16z%22%20fill%3D%22%239E363A%22%20opacity%3D%22.35%22%2F%3E%3C%2Fsvg%3E";

  const popupRotateLines = useMemo(() => {
    const lines = normalizeRotateLines(mainHeaderItem?.rotatingTexts);
    if (lines.length) return lines;

    return [
      "Got questions about admissions, courses, or campus life? Fill out the enquiry form and our team will get back to you soon.",
    ];
  }, [mainHeaderItem?.rotatingTexts]);

  const popupRotateIntervalMs = Math.max(
    1200,
    Number(mainHeaderItem?.rotatingTextIntervalMs) || 2600
  );

  const [popupRotateIndex, setPopupRotateIndex] = useState(0);
  const [popupRotateFading, setPopupRotateFading] = useState(false);
  const [cookieCardVisible, setCookieCardVisible] = useState(
    () => !hasCookieChoice()
  );
  const [cookieCardMode, setCookieCardMode] = useState("compact");
  const [analyticsCookies, setAnalyticsCookies] = useState(false);
  const [marketingCookies, setMarketingCookies] = useState(false);

  const popupSubText =
    popupRotateLines[popupRotateIndex] ||
    "Got questions about admissions, courses, or campus life? Fill out the enquiry form and our team will get back to you soon.";

  const popupOpenedOnceRef = useRef(false);

  useEffect(() => {
    setPopupRotateIndex(0);
    setPopupRotateFading(false);
  }, [popupRotateLines]);

  useEffect(() => {
    if (!isEnquiryModalOpen || popupRotateLines.length <= 1) return undefined;

    let fadeTimeout = null;
    const interval = window.setInterval(() => {
      setPopupRotateFading(true);

      fadeTimeout = window.setTimeout(() => {
        setPopupRotateIndex(
          (current) => (current + 1) % popupRotateLines.length
        );
        setPopupRotateFading(false);
      }, 160);
    }, popupRotateIntervalMs);

    return () => {
      window.clearInterval(interval);
      if (fadeTimeout) window.clearTimeout(fadeTimeout);
      setPopupRotateFading(false);
    };
  }, [isEnquiryModalOpen, popupRotateIntervalMs, popupRotateLines]);

  const handleAdvancePopupText = () => {
    if (popupRotateLines.length <= 1) return;
    setPopupRotateFading(true);

    window.setTimeout(() => {
      setPopupRotateIndex(
        (current) => (current + 1) % popupRotateLines.length
      );
      setPopupRotateFading(false);
    }, 160);
  };

  const handleOpenEnquiryModal = () => {
    dispatch(openEnquiryModal());
  };

  const handleCloseEnquiryModal = () => {
    rememberEnquiryModalSeen();
    dispatch(closeEnquiryModal());
  };

  const saveCookieChoice = ({ consent, analytics = false, marketing = false }) => {
    setCookieValue(COOKIE_CONSENT_NAME, consent, COOKIE_CONSENT_MAX_AGE_SECONDS);
    setCookieValue(
      COOKIE_ANALYTICS_NAME,
      String(Boolean(analytics)),
      COOKIE_CONSENT_MAX_AGE_SECONDS
    );
    setCookieValue(
      COOKIE_MARKETING_NAME,
      String(Boolean(marketing)),
      COOKIE_CONSENT_MAX_AGE_SECONDS
    );
    setCookieCardVisible(false);
  };

  const handleAcceptAllCookies = () => {
    setAnalyticsCookies(true);
    setMarketingCookies(true);
    saveCookieChoice({
      consent: "accepted",
      analytics: true,
      marketing: true,
    });
  };

  const handleRejectAllCookies = () => {
    setAnalyticsCookies(false);
    setMarketingCookies(false);
    saveCookieChoice({
      consent: "rejected",
      analytics: false,
      marketing: false,
    });
  };

  const handleSaveCookiePreferences = () => {
    saveCookieChoice({
      consent: "custom",
      analytics: analyticsCookies,
      marketing: marketingCookies,
    });
  };

  useEffect(() => {
    setCookieCardVisible(!hasCookieChoice());
    setAnalyticsCookies(
      decodeURIComponent(getCookieValue(COOKIE_ANALYTICS_NAME) || "") === "true"
    );
    setMarketingCookies(
      decodeURIComponent(getCookieValue(COOKIE_MARKETING_NAME) || "") === "true"
    );
  }, []);

  useEffect(() => {
    if (!loaderDone || popupOpenedOnceRef.current) return;
    if (cookieCardVisible) return;
    if (!shouldAutoOpenEnquiryModal()) return;

    popupOpenedOnceRef.current = true;

    const timer = window.setTimeout(() => {
      dispatch(openEnquiryModal());
    }, 180);

    return () => window.clearTimeout(timer);
  }, [dispatch, loaderDone]);

  useEffect(() => {
    if (!isEnquiryModalOpen) return undefined;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [isEnquiryModalOpen]);

  return (
    <>
      <HomePageLoader
        visible={loaderVisible}
        isDone={loaderDone}
        progress={loaderProgress}
        title="MSIT Kolkata"
        subtitle="Loading homepage sections..."
        message={loaderMessage}
      />

      <HomeEnquiryToast />
      <CookieSettingsCard
        visible={cookieCardVisible}
        mode={cookieCardMode}
        analytics={analyticsCookies}
        marketing={marketingCookies}
        onAnalyticsChange={setAnalyticsCookies}
        onMarketingChange={setMarketingCookies}
        onCustomize={() => setCookieCardMode("customize")}
        onReject={handleRejectAllCookies}
        onAccept={handleAcceptAllCookies}
        onSave={handleSaveCookiePreferences}
      />
      <HomeEnquiryButton
        hidden={cookieCardVisible || isEnquiryModalOpen || loaderVisible}
        onClick={handleOpenEnquiryModal}
      />

      <Transition appear show={isEnquiryModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-[10000]"
          open={isEnquiryModalOpen}
          onClose={handleCloseEnquiryModal}
        >
          <DialogBackdrop
            transition
            className="fixed inset-0 z-[10000] bg-[rgba(2,6,23,.62)] backdrop-blur-[5px] transition duration-200 ease-out data-[closed]:opacity-0"
          />

          <div className="fixed inset-0 z-[10001] w-screen overflow-y-auto">
            <div className="flex min-h-full items-start justify-center p-3 sm:p-[18px]">
              <DialogPanel
                transition
                className="relative my-3 flex max-h-[calc(100vh-24px)] w-[min(980px,98vw)] flex-col overflow-hidden rounded-[18px] border border-[rgba(158,54,58,.22)] bg-[rgba(255,255,255,.99)] shadow-[0_22px_60px_rgba(2,6,23,.30)] transition duration-200 ease-out data-[closed]:translate-y-2 data-[closed]:scale-[0.985] data-[closed]:opacity-0 sm:my-[18px] sm:w-[min(980px,96vw)] sm:rounded-[20px]"
              >
                <div className="pointer-events-none absolute -right-[140px] -top-[140px] h-[280px] w-[280px] rotate-[12deg] bg-[radial-gradient(circle_at_30%_30%,rgba(201,75,80,.22),rgba(201,75,80,0))]" />

                <div className="relative flex items-start justify-between gap-3 px-[14px] pb-2 pt-4 sm:px-[18px] sm:pb-[10px] sm:pt-[18px]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-xl border border-[rgba(158,54,58,.18)] bg-[linear-gradient(135deg,rgba(158,54,58,.16),rgba(201,75,80,.10))] p-1.5">
                      <img
                        src={popupHeaderLogo}
                        alt="College Logo"
                        className="h-full w-full rounded-[10px] object-contain"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <Dialog.Title className="m-0 line-clamp-2 text-[16px] font-black leading-[1.15] text-[#0f172a]">
                        {popupHeaderTitle}
                      </Dialog.Title>

                      <button
                        type="button"
                        onClick={handleAdvancePopupText}
                        disabled={popupRotateLines.length <= 1}
                        aria-live="polite"
                        className={`mt-1 block w-full bg-transparent text-left text-[13px] font-medium leading-[1.2] text-[#6b7280] transition-all duration-200 ${popupRotateLines.length > 1
                            ? "cursor-pointer"
                            : "cursor-default"
                          } ${popupRotateFading
                            ? "translate-y-[2px] opacity-0"
                            : "translate-y-0 opacity-100"
                          }`}
                      >
                        {popupSubText}
                      </button>

                      <p className="mt-1 hidden text-[12.5px] font-[650] leading-[1.35] text-[#6b7280] sm:block">
                        Got questions about admissions, courses, or campus life?
                        Fill out the enquiry form and our team will get back to
                        you soon.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label="Close"
                    onClick={handleCloseEnquiryModal}
                    className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl border border-[rgba(2,6,23,.12)] bg-[rgba(255,255,255,.94)] text-slate-700 transition hover:bg-slate-100"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="relative min-h-0 flex-1 overflow-auto px-[14px] pb-[14px] sm:px-[18px] sm:pb-[18px]">
                  <Enquiry
                    isOpen={isEnquiryModalOpen}
                    onSubmitted={handleCloseEnquiryModal}
                    useGlobalToast={true}
                  />
                </div>
              </DialogPanel>
            </div>
          </div>
        </Dialog>
      </Transition>

      <TopHeaderMenu />
      <MainHeader />
      <HeaderMenu />
      <StickyButtons />

      <main className="bg-[var(--surface)] pb-5">
        <div className="w-full">
          <NoticeMarquee />
          <HeroCarousel />
        </div>

        <div className="mx-auto w-full max-w-[1280px] px-3 sm:px-3 lg:px-4">
          <div className="mt-4 flex flex-col gap-6 lg:mt-6 lg:gap-10">
            {isMobileHome ? (
              <Suspense fallback={<HomeSectionFallback height={520} />}>
                <MobileHomeQuickAccess />
              </Suspense>
            ) : (
              <>
                <LazyHomeBlock eager height={210}>
                  <InfoBoxes />
                </LazyHomeBlock>

                <LazyHomeBlock eager height={300}>
                  <NvaRow />
                </LazyHomeBlock>

                <LazyHomeBlock eager height={300}>
                  <HomeHighlights />
                </LazyHomeBlock>
              </>
            )}

            <LazyHomeBlock height={420}>
              <Courses />
            </LazyHomeBlock>

            <LazyHomeBlock height={360}>
              <UgCourses />
            </LazyHomeBlock>

            <LazyHomeBlock height={260}>
              <Stats />
            </LazyHomeBlock>

            <LazyHomeBlock height={360}>
              <Testimonials />
            </LazyHomeBlock>

            <LazyHomeBlock height={320}>
              <Alumni />
            </LazyHomeBlock>

            <LazyHomeBlock height={420}>
              <SuccessStories />
            </LazyHomeBlock>

            <LazyHomeBlock height={260}>
              <Recruiters />
            </LazyHomeBlock>
          </div>
        </div>
      </main>

      <Suspense fallback={<FooterFallback />}>
        <LazySection
          minHeight={380}
          rootMargin={FOOTER_ROOT_MARGIN}
          fallback={<FooterFallback />}
        >
          <Footer />
        </LazySection>
      </Suspense>
    </>
  );
}
