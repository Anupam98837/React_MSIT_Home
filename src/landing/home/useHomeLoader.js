import { useMemo } from "react";

const BLOCKING_STATUSES = new Set(["idle", "loading", "pending"]);

const isResolved = (status) => {
  if (status == null || status === "") return true;
  return !BLOCKING_STATUSES.has(String(status).toLowerCase());
};

export default function useHomeLoader({
  topStatus,
  mainStatus,
  menuStatus,
  stickyButtonsStatus,
  noticeMarqueeStatus,
  heroStatus,
  enquiryStatus,
}) {
  const steps = useMemo(
    () => [
      {
        key: "top",
        done: isResolved(topStatus),
        label: "Loading top header...",
      },
      {
        key: "main",
        done: isResolved(mainStatus),
        label: "Loading main header...",
      },
      {
        key: "menu",
        done: isResolved(menuStatus),
        label: "Loading navigation...",
      },
      {
        key: "sticky",
        done: isResolved(stickyButtonsStatus),
        label: "Loading sticky buttons...",
      },
      {
        key: "notice",
        done: isResolved(noticeMarqueeStatus),
        label: "Loading notice marquee...",
      },
      {
        key: "hero",
        done: isResolved(heroStatus),
        label: "Loading hero carousel...",
      },
      {
        key: "enquiry",
        done: isResolved(enquiryStatus),
        label: "Preparing enquiry form...",
      },
    ],
    [
      topStatus,
      mainStatus,
      menuStatus,
      stickyButtonsStatus,
      noticeMarqueeStatus,
      heroStatus,
      enquiryStatus,
    ]
  );

  const resolvedCount = useMemo(
    () => steps.filter((step) => step.done).length,
    [steps]
  );

  const totalParts = steps.length || 1;

  const loaderProgress = Math.min(
    100,
    Math.max(8, Math.round((resolvedCount / totalParts) * 100))
  );

  const nextPending = steps.find((step) => !step.done);
  const loaderMessage = nextPending ? nextPending.label : "Almost done...";
  const loaderDone = resolvedCount >= totalParts;
  const loaderVisible = !loaderDone;

  return {
    loaderVisible,
    loaderDone,
    loaderProgress,
    loaderMessage,
  };
}