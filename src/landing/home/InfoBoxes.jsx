import { useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { fetchInfoBoxesData, selectInfoBoxes } from '../../redux/infoBoxesSlice';
import { useAutoScroller } from './scrollers';
import {
  buildContentViewUrl,
  isSameOrigin,
  normalizeContentBasePath,
  resolveLinkUrl,
} from '../utils/pageRouting';

const SECTION_ORDER = ['career_notices', 'why_us', 'scholarships'];

const SECTION_META = {
  career_notices: {
    title: 'Career At MSIT',
    iconClass: 'fa-solid fa-trophy',
    itemIconClass: 'fa-solid fa-chevron-right',
    emptyText: 'No career notices.',
  },
  why_us: {
    title: 'Why MSIT',
    iconClass: 'fa-solid fa-star',
    itemIconClass: 'fa-solid fa-check',
    emptyText: 'No highlights.',
  },
  scholarships: {
    title: 'Scholarship',
    iconClass: 'fa-solid fa-award',
    itemIconClass: 'fa-solid fa-gift',
    emptyText: 'No scholarships.',
  },
};

function resolveInfoItemUrl(item) {
  if (!item) return '';

  if (item.slug && item.categoryKey) {
    return buildContentViewUrl(item.categoryKey, item.slug);
  }

  const rawHref = String(item.href || '').trim();
  if (!rawHref) return '';

  return resolveLinkUrl(normalizeContentBasePath(rawHref));
}

function InfoBoxList({ sectionKey, items }) {
  const navigate = useNavigate();
  const viewportRef = useRef(null);
  const listRef = useRef(null);
  const meta = SECTION_META[sectionKey];

  useAutoScroller(
    viewportRef,
    listRef,
    {
      axis: 'y',
      minItems: 7,
      speedPxPerSec: 15,
      pauseDelayMs: 1200,
      disableBelow: 768,
    },
    [items.length]
  );

  const visibleItems = useMemo(() => {
    if (items.length) return items.slice(0, 60);
    return [
      {
        id: `${sectionKey}-empty`,
        title: meta.emptyText,
        href: '',
      },
    ];
  }, [items, meta.emptyText, sectionKey]);

  const handleItemClick = (event, href) => {
    const resolved = resolveLinkUrl(href);
    if (!resolved || !isSameOrigin(resolved)) return;
    if (/^(mailto:|tel:|sms:|whatsapp:|#)/i.test(resolved)) return;

    const url = new URL(resolved, window.location.origin);
    event.preventDefault();
    navigate(`${url.pathname}${url.search}${url.hash}`);
  };

  return (
    <div className="msit-home-info-box">
      <h5 className="msit-home-info-box__heading">
        <i className={meta.iconClass} aria-hidden="true" />
        <span>{meta.title}</span>
      </h5>

      <div ref={viewportRef} className="msit-home-info-box__viewport" tabIndex={0}>
        <ul ref={listRef} className="msit-home-info-box__list">
          {visibleItems.map((item) => {
            const href = resolveInfoItemUrl(item);
            const hasLink = Boolean(href);
            const title = item.title || item.description || item.buttonText || meta.emptyText;

            return (
              <li key={item.id} className="msit-home-info-box__item">
                <i className={meta.itemIconClass} aria-hidden="true" />
                {hasLink ? (
                  <a href={href} onClick={(event) => handleItemClick(event, href)}>
                    {title}
                  </a>
                ) : (
                  <span>{title}</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function InfoBoxesSkeleton() {
  return (
    <section className="msit-home-info-boxes-section">
      <style>{sharedStyles}</style>
      <div className="msit-home-container">
        <div className="msit-home-info-boxes-grid">
          {SECTION_ORDER.map((key) => (
            <div key={key} className="msit-home-info-box">
              <h5 className="msit-home-info-box__heading">
                <i className={SECTION_META[key].iconClass} aria-hidden="true" />
                <span>{SECTION_META[key].title}</span>
              </h5>
              <div className="msit-home-info-box__viewport">
                <ul className="msit-home-info-box__list">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <li key={`${key}-${index}`} className="msit-home-info-box__item">
                      <i className={SECTION_META[key].itemIconClass} aria-hidden="true" />
                      <span className="block h-4 w-full animate-pulse rounded-full bg-white/15" />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const sharedStyles = `
  .msit-home-info-boxes-section {
    width: 100%;
    background: #ffffff;
  }

  .msit-home-container {
    width: min(1320px, 100%);
    margin: 0 auto;
  }

  .msit-home-info-boxes-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .msit-home-info-box {
    position: relative;
    overflow: hidden;
    height: 100%;
    min-height: 320px;
    border-radius: 16px;
    background: #9E363A;
    color: #ffffff;
    padding: 24px;
    box-shadow: 0 10px 28px rgba(0,0,0,.10);
  }

  .msit-home-info-box::after {
    content: '';
    position: absolute;
    inset: -40px -40px auto auto;
    width: 160px;
    height: 160px;
    background: radial-gradient(circle at 30% 30%, rgba(255,255,255,.18), rgba(255,255,255,0));
    transform: rotate(18deg);
    pointer-events: none;
  }

  .msit-home-info-box__heading {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 12px;
    font-size: 18px;
    font-weight: 900;
    color: #ffffff;
  }

  .msit-home-info-box__viewport {
    position: relative;
    z-index: 1;
    height: 260px;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 4px;
    scrollbar-gutter: stable;
    overscroll-behavior: contain;
  }

  .msit-home-info-box__viewport.scroll-active {
    overflow: hidden !important;
    padding-right: 0 !important;
    scrollbar-gutter: auto;
  }

  .msit-home-info-box__viewport:not(.scroll-active)::-webkit-scrollbar {
    width: 6px;
  }

  .msit-home-info-box__viewport:not(.scroll-active)::-webkit-scrollbar-track {
    background: rgba(255,255,255,.08);
    border-radius: 4px;
    margin: 4px 0;
  }

  .msit-home-info-box__viewport:not(.scroll-active)::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,.34);
    border-radius: 4px;
  }

  .msit-home-info-box__list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .msit-home-info-box__item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px dashed rgba(255,255,255,.30);
    font-size: 14px;
    line-height: 1.45;
  }

  .msit-home-info-box__item:last-child {
    border-bottom: 0;
  }

  .msit-home-info-box__item i {
    margin-top: 2px;
    opacity: .92;
    flex: 0 0 auto;
  }

  .msit-home-info-box__item span,
  .msit-home-info-box__item a {
    color: #ffffff;
    text-decoration: none;
    flex: 1 1 auto;
    word-break: break-word;
  }

  .msit-home-info-box__item a:hover {
    text-decoration: underline;
  }

  @media (min-width: 768px) and (max-width: 991.98px) {
    .msit-home-info-boxes-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }

    .msit-home-info-boxes-grid > .msit-home-info-box:nth-child(3) {
      grid-column: 1 / -1;
    }

    .msit-home-info-box {
      min-height: 286px;
      padding: 20px;
      border-radius: 14px;
    }

    .msit-home-info-box__heading {
      margin-bottom: 10px;
      font-size: 17px;
    }

    .msit-home-info-box__viewport {
      height: 228px;
    }

    .msit-home-info-box__item {
      gap: 9px;
      padding: 7px 0;
      font-size: 13.5px;
      line-height: 1.4;
    }
  }

  @media (max-width: 767.98px) {
    .msit-home-info-boxes-grid {
      grid-template-columns: 1fr;
    }

    .msit-home-info-box {
      min-height: 0;
    }
  }
`;

export default function InfoBoxes() {
  const dispatch = useDispatch();
  const { items, status, error } = useSelector(selectInfoBoxes);

  useEffect(() => {
    dispatch(fetchInfoBoxesData());
  }, [dispatch]);

  const groupedItems = useMemo(() => {
    return SECTION_ORDER.reduce((acc, key) => {
      acc[key] = items.filter((item) => item.categoryKey === key);
      return acc;
    }, {});
  }, [items]);

  if (status === 'idle' || status === 'loading') {
    return <InfoBoxesSkeleton />;
  }

  return (
    <section className="msit-home-info-boxes-section">
      <style>{sharedStyles}</style>
      <div className="msit-home-container">
        {status === 'failed' ? (
          <div className="mb-4 rounded-[16px] border border-[#f3d0d2] bg-[#fff5f5] px-4 py-3 text-sm font-semibold text-[#9E363A]">
            {error || 'Failed to load quick links.'}
          </div>
        ) : null}

        <div className="msit-home-info-boxes-grid">
          {SECTION_ORDER.map((sectionKey) => (
            <InfoBoxList
              key={sectionKey}
              sectionKey={sectionKey}
              items={groupedItems[sectionKey] || []}
            />
          ))}
        </div>
      </div>
    </section>
  );
}