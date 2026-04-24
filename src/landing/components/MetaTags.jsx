import { useEffect, useMemo } from "react";
import { useLocation } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMetaTags,
  normalizeMetaPath,
  selectMetaTagsBlock,
} from "../../redux/metaTagsSlice";

const CLIENT_META_ATTR = "data-seo-source";
const CLIENT_META_VALUE = "client";

const removeInjectedMeta = () => {
  if (typeof document === "undefined") return;

  document
    .querySelectorAll(`[${CLIENT_META_ATTR}="${CLIENT_META_VALUE}"]`)
    .forEach((node) => node.parentNode?.removeChild(node));
};

const appendHeadNode = (node) => {
  if (!node || typeof document === "undefined") return;
  document.head.appendChild(node);
};

const markNode = (node) => {
  node.setAttribute(CLIENT_META_ATTR, CLIENT_META_VALUE);
  return node;
};

const createMetaNode = (type, attr, value) => {
  const safeAttr = String(attr || "").trim();
  const safeValue = String(value ?? "").trim();

  if (type === "charset") {
    if (!safeValue) return null;
    const meta = document.createElement("meta");
    meta.setAttribute("charset", safeValue);
    return markNode(meta);
  }

  if (!safeAttr || !safeValue) return null;

  if (
    type === "standard" &&
    ["canonical", "canonical_url"].includes(safeAttr.toLowerCase())
  ) {
    const link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    link.setAttribute("href", safeValue);
    return markNode(link);
  }

  const meta = document.createElement("meta");

  if (type === "opengraph") {
    meta.setAttribute("property", safeAttr);
  } else if (type === "http") {
    meta.setAttribute("http-equiv", safeAttr);
  } else {
    meta.setAttribute("name", safeAttr);
  }

  meta.setAttribute("content", safeValue);
  return markNode(meta);
};

const applyMetaPayload = (payload) => {
  if (typeof document === "undefined") return;

  removeInjectedMeta();

  const defaultTitle =
    window.__APP_DEFAULT_TITLE__ ||
    String(document.querySelector("head > title")?.textContent || "").trim() ||
    String(document.title || "").trim();

  const title = String(payload?.title || "").trim();
  document.title = title || defaultTitle || document.title;

  const meta = payload?.meta || {};

  if (meta?.charset) {
    appendHeadNode(createMetaNode("charset", "charset", meta.charset));
  }

  Object.entries(meta?.standard || {}).forEach(([attr, value]) => {
    appendHeadNode(createMetaNode("standard", attr, value));
  });

  Object.entries(meta?.opengraph || {}).forEach(([attr, value]) => {
    appendHeadNode(createMetaNode("opengraph", attr, value));
  });

  Object.entries(meta?.twitter || {}).forEach(([attr, value]) => {
    appendHeadNode(createMetaNode("twitter", attr, value));
  });

  Object.entries(meta?.http || {}).forEach(([attr, value]) => {
    appendHeadNode(createMetaNode("http", attr, value));
  });
};

export default function MetaTags() {
  const location = useLocation();
  const dispatch = useDispatch();

  const pagePath = useMemo(() => {
    const fallback =
      typeof window !== "undefined" ? window.location.pathname : "/";
    return normalizeMetaPath(location?.pathname || fallback || "/");
  }, [location?.pathname]);

  const metaBlock = useSelector((state) =>
    selectMetaTagsBlock(state, pagePath)
  );

  useEffect(() => {
    dispatch(fetchMetaTags({ path: pagePath }));
  }, [dispatch, pagePath]);

  useEffect(() => {
    if (metaBlock?.status !== "succeeded" || !metaBlock?.data) {
      return;
    }

    applyMetaPayload(metaBlock.data);
  }, [metaBlock?.status, metaBlock?.data]);

  useEffect(() => {
    if (metaBlock?.status === "failed") {
      removeInjectedMeta();

      const defaultTitle =
        window.__APP_DEFAULT_TITLE__ ||
        String(document.querySelector("head > title")?.textContent || "").trim() ||
        String(document.title || "").trim();

      if (defaultTitle) {
        document.title = defaultTitle;
      }
    }
  }, [metaBlock?.status]);

  return null;
}