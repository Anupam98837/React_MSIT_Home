import { useEffect } from 'react';

const activeStates = new Set();
let rafId = 0;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const stopLoopIfIdle = () => {
  if (!activeStates.size && rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
};

const ensureLoop = () => {
  if (!rafId && activeStates.size) {
    rafId = requestAnimationFrame(tick);
  }
};

const removeClones = (track) => {
  if (!track) return;
  track.querySelectorAll('[data-scroller-clone="true"]').forEach((node) => node.remove());
};

const getOriginalChildren = (track) =>
  Array.from(track?.children || []).filter(
    (node) => node.nodeType === 1 && node.getAttribute('data-scroller-clone') !== 'true'
  );

const tick = (now) => {
  if (!activeStates.size) {
    rafId = 0;
    return;
  }

  rafId = requestAnimationFrame(tick);

  activeStates.forEach((state) => {
    const { viewport, track } = state;

    if (!viewport?.isConnected || !track?.isConnected || !document.body.contains(viewport)) {
      destroyAutoScroller(viewport);
      return;
    }

    if (state.rebuildQueued) return;

    let delta = now - state.lastTime;
    if (delta < 0) delta = 0;
    if (delta > 50) delta = 50;
    state.lastTime = now;

    if (document.hidden) return;
    if (state.hovering) return;
    if (now < state.pausedUntil) return;

    state.currentOffset += (state.speedPxPerSec * delta) / 1000;

    if (state.currentOffset >= state.cycleDistance) {
      state.currentOffset -= state.cycleDistance;
    }

    if (state.axis === 'x') {
      track.style.transform = `translate3d(${-state.currentOffset}px, 0, 0)`;
    } else {
      track.style.transform = `translate3d(0, ${-state.currentOffset}px, 0)`;
    }
  });
};

export const destroyAutoScroller = (viewport) => {
  const state = viewport?.__autoScrollerState;
  if (!state) return;

  if (state._roTimer) {
    clearTimeout(state._roTimer);
    state._roTimer = null;
  }

  state.cleanupFns.forEach((fn) => {
    try {
      fn();
    } catch {
      // noop
    }
  });

  if (state.resizeObserver) {
    try {
      state.resizeObserver.disconnect();
    } catch {
      // noop
    }
  }

  removeClones(state.track);

  if (state.track) {
    state.track.style.transform = '';
    state.track.style.willChange = '';
  }

  if (state.viewport) {
    state.viewport.classList.remove('scroll-active');
    state.viewport.style.removeProperty('overflow');
    state.viewport.style.removeProperty('overflow-y');
    state.viewport.style.removeProperty('overflow-x');
    state.viewport.style.removeProperty('padding-right');
    state.viewport.style.removeProperty('scrollbar-gutter');

    if (state.axis === 'x') {
      state.viewport.scrollLeft = 0;
    } else {
      state.viewport.scrollTop = 0;
    }
  }

  delete viewport.__autoScrollerState;
  activeStates.delete(state);
  stopLoopIfIdle();
};

export const initAutoScroller = (viewport, track, options = {}) => {
  if (!viewport || !track || typeof window === 'undefined') {
    return () => {};
  }

  destroyAutoScroller(viewport);

  const axis = options.axis === 'x' ? 'x' : 'y';
  const enabled = options.enabled !== false;
  const minItems = Math.max(1, Number(options.minItems ?? (axis === 'y' ? 7 : 2)));
  const speedPxPerSec = Math.max(1, Number(options.speedPxPerSec ?? (axis === 'y' ? 15 : 60)));
  const pauseDelayMs = Math.max(0, Number(options.pauseDelayMs ?? 1200));
  const disableBelow = Math.max(0, Number(options.disableBelow ?? (axis === 'y' ? 768 : 0)));

  if (!enabled || prefersReducedMotion()) {
    return () => destroyAutoScroller(viewport);
  }

  if (disableBelow && window.innerWidth <= disableBelow) {
    viewport.classList.remove('scroll-active');
    viewport.style.removeProperty('overflow');
    viewport.style.removeProperty('overflow-y');
    viewport.style.removeProperty('overflow-x');
    viewport.style.removeProperty('padding-right');
    viewport.style.removeProperty('scrollbar-gutter');
    track.style.transform = '';
    track.style.willChange = '';
    removeClones(track);
    return () => destroyAutoScroller(viewport);
  }

  removeClones(track);
  track.style.transform = 'none';
  track.style.willChange = '';

  if (axis === 'x') {
    viewport.scrollLeft = 0;
  } else {
    viewport.scrollTop = 0;
  }

  let pendingRaf = requestAnimationFrame(() => {
    pendingRaf = null;

    if (!viewport.isConnected || !track.isConnected) return;

    const originalChildren = getOriginalChildren(track);
    if (!originalChildren.length || originalChildren.length < minItems) return;

    let viewportSize = 0;
    let originalSize = 0;

    if (axis === 'x') {
      viewportSize = viewport.clientWidth;
      originalSize = track.scrollWidth;
    } else {
      viewportSize = viewport.clientHeight || 260;
      originalSize = track.scrollHeight;
    }

    if (!originalSize || originalSize <= viewportSize + 8) return;

    originalChildren.forEach((child) => {
      const clone = child.cloneNode(true);
      clone.setAttribute('data-scroller-clone', 'true');
      clone.setAttribute('aria-hidden', 'true');
      clone.tabIndex = -1;
      track.appendChild(clone);
    });

    viewport.classList.add('scroll-active');
    viewport.style.setProperty('overflow', 'hidden', 'important');
    viewport.style.setProperty('overflow-y', 'hidden', 'important');
    viewport.style.setProperty('overflow-x', 'hidden', 'important');
    viewport.style.setProperty('padding-right', '0px');
    viewport.style.setProperty('scrollbar-gutter', 'auto');

    track.style.willChange = 'transform';
    track.style.transform = 'translate3d(0,0,0)';

    const state = {
      axis,
      viewport,
      track,
      speedPxPerSec,
      cycleDistance: Math.max(1, originalSize),
      hovering: false,
      pausedUntil: 0,
      lastTime: performance.now(),
      currentOffset: 0,
      cleanupFns: [],
      resizeObserver: null,
      rebuildQueued: false,
      _roTimer: null,
    };

    viewport.__autoScrollerState = state;
    activeStates.add(state);
    ensureLoop();

    const pause = (ms = pauseDelayMs) => {
      state.pausedUntil = performance.now() + ms;
    };

    const queueRebuild = () => {
      if (state.rebuildQueued) return;
      state.rebuildQueued = true;

      requestAnimationFrame(() => {
        state.rebuildQueued = false;
        if (!viewport.isConnected || !track.isConnected) return;
        initAutoScroller(viewport, track, options);
      });
    };

    const onMouseEnter = () => {
      state.hovering = true;
    };
    const onMouseLeave = () => {
      state.hovering = false;
      pause();
    };
    const onWheel = () => pause(1600);
    const onPointerDown = () => pause(1600);
    const onTouchStart = () => pause(1600);
    const onFocusIn = () => {
      state.hovering = true;
    };
    const onFocusOut = () => {
      state.hovering = false;
      pause();
    };
    const onKeyDown = () => pause(1600);

    const bindings = [
      ['mouseenter', onMouseEnter, { passive: true }],
      ['mouseleave', onMouseLeave, { passive: true }],
      ['wheel', onWheel, { passive: true }],
      ['pointerdown', onPointerDown, { passive: true }],
      ['touchstart', onTouchStart, { passive: true }],
      ['focusin', onFocusIn, false],
      ['focusout', onFocusOut, false],
      ['keydown', onKeyDown, false],
    ];

    bindings.forEach(([eventName, handler, eventOptions]) => {
      viewport.addEventListener(eventName, handler, eventOptions);
      state.cleanupFns.push(() => viewport.removeEventListener(eventName, handler, eventOptions));
    });

    const onWindowResize = () => {
      if (disableBelow && window.innerWidth <= disableBelow) {
        destroyAutoScroller(viewport);
        return;
      }
      queueRebuild();
    };

    window.addEventListener('resize', onWindowResize, { passive: true });
    state.cleanupFns.push(() => window.removeEventListener('resize', onWindowResize));

    if (typeof ResizeObserver !== 'undefined') {
      state.lastWidth = viewport.clientWidth;
      state.lastHeight = viewport.clientHeight;

      const observer = new ResizeObserver(() => {
        const currentWidth = viewport.clientWidth;
        const currentHeight = viewport.clientHeight;

        if (state.lastWidth !== currentWidth || state.lastHeight !== currentHeight) {
          state.lastWidth = currentWidth;
          state.lastHeight = currentHeight;
          queueRebuild();
        }
      });

      observer.observe(viewport);
      state.resizeObserver = observer;
    }
  });

  return () => {
    if (pendingRaf !== null) {
      cancelAnimationFrame(pendingRaf);
      pendingRaf = null;
    }
    destroyAutoScroller(viewport);
  };
};

export const useAutoScroller = (viewportRef, trackRef, options = {}, deps = []) => {
  useEffect(() => {
    const viewport = viewportRef?.current;
    const track = trackRef?.current;

    if (!viewport || !track) return undefined;

    const teardown = initAutoScroller(viewport, track, options);

    return () => {
      teardown?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewportRef, trackRef, ...deps]);
};