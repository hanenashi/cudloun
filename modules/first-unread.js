// Optional one-shot jump to the first unread Kapybara post.
(function () {
  "use strict";

  const root = window.Cudloun;
  const VERSION = "0.1.0";
  const SETTLE_MS = 90;
  const HEADER_GAP = 8;
  const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);
  let ctxRef = null;
  let observer = null;
  let settleTimer = 0;
  let route = "";
  let generation = 0;
  let handled = false;
  let userInterrupted = false;

  root.firstUnread = {
    version: VERSION,
    schedule: scheduleAttempt,
    status: () => ({ route, generation, handled, userInterrupted }),
    headerOffset,
  };

  root.registerModule({
    id: "first-unread",
    name: "First Unread",
    description: "Jump once to the first unread post when a Kapybara club opens.",
    version: VERSION,
    defaultEnabled: false,
    start(ctx) {
      if (!root.kapyguts?.isKapybara?.()) return null;
      return start(ctx);
    },
    renderSettings() {
      const wrap = document.createElement("div");
      wrap.className = "cudloun-settings-list";
      const row = document.createElement("div");
      row.className = "cudloun-setting-row";
      const text = document.createElement("div");
      text.className = "cudloun-setting-text";
      text.textContent = "When enabled, entering a club scrolls once to its first post marked unread by Kapybara. Explicit URL anchors and manual scrolling win.";
      row.appendChild(text);
      wrap.appendChild(row);
      return wrap;
    },
    renderHelp() {
      return [
        "Enable First Unread in the Cudloun hub to jump to the first unread post whenever a club finishes rendering.",
        "The jump happens only once per club visit and does not poll the network or alter Kapybara's read markers.",
        "A URL anchor, mouse wheel, touch scroll, or navigation key cancels the automatic jump so it does not fight your chosen position.",
      ];
    },
  });

  function start(ctx) {
    stop();
    ctxRef = ctx;
    route = root.currentRoute();
    generation += 1;
    handled = false;
    userInterrupted = false;

    observer = new MutationObserver(scheduleAttempt);
    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-unread"],
    });
    window.addEventListener("popstate", routeChanged);
    window.addEventListener("hashchange", routeChanged);
    window.addEventListener("wheel", interrupt, { passive: true });
    window.addEventListener("touchmove", interrupt, { passive: true });
    window.addEventListener("keydown", interruptByKey, true);
    scheduleAttempt();
    ctx.log.info("waiting for first unread post", route);
    return stop;
  }

  function stop() {
    generation += 1;
    handled = true;
    observer?.disconnect();
    observer = null;
    window.clearTimeout(settleTimer);
    settleTimer = 0;
    window.removeEventListener("popstate", routeChanged);
    window.removeEventListener("hashchange", routeChanged);
    window.removeEventListener("wheel", interrupt);
    window.removeEventListener("touchmove", interrupt);
    window.removeEventListener("keydown", interruptByKey, true);
    ctxRef = null;
  }

  function routeChanged() {
    syncRoute();
    scheduleAttempt();
  }

  function syncRoute() {
    const current = root.currentRoute();
    if (current === route) return false;
    route = current;
    generation += 1;
    handled = false;
    userInterrupted = false;
    ctxRef?.log.debug("club route changed", route, `generation=${generation}`);
    return true;
  }

  function scheduleAttempt() {
    syncRoute();
    if (handled) return;
    const owner = generation;
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => attempt(owner), SETTLE_MS);
  }

  function attempt(owner) {
    settleTimer = 0;
    syncRoute();
    if (owner !== generation || handled) return;

    const routeInfo = root.kapyguts?.route?.();
    if (routeInfo?.type !== "board") {
      handled = true;
      return;
    }
    if (routeInfo.hash) {
      handled = true;
      ctxRef?.log.debug("explicit anchor preserved", routeInfo.hash);
      return;
    }
    if (userInterrupted) {
      handled = true;
      ctxRef?.log.debug("automatic jump cancelled by user interaction");
      return;
    }
    if (!currentBoardIsRendered(routeInfo) || !root.kapyguts.allPosts().length) return;

    const unread = root.kapyguts.firstUnreadPost();
    handled = true;
    if (!unread) {
      ctxRef?.log.debug("club has no unread post", routeInfo.boardId);
      return;
    }

    const postId = unread.getAttribute("data-post-id") || "unknown";
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (owner !== generation || userInterrupted || !unread.isConnected) return;
      scrollToPost(unread);
      ctxRef?.log.info("scrolled to first unread post", routeInfo.boardId, postId);
    }));
  }

  function currentBoardIsRendered(routeInfo) {
    const titleLink = root.kapyguts?.boardHeaderParts?.().titleLink;
    if (!titleLink?.href) return false;
    try {
      return new URL(titleLink.href, window.location.href).pathname === routeInfo.path;
    } catch (_error) {
      return false;
    }
  }

  function scrollToPost(post) {
    const top = Math.max(0, window.scrollY + post.getBoundingClientRect().top - headerOffset() - HEADER_GAP);
    window.scrollTo({ top, left: window.scrollX, behavior: "auto" });
  }

  function headerOffset() {
    const parts = [
      root.kapyguts?.pageHeaderParts?.().header,
      root.kapyguts?.boardHeaderParts?.().titleRow,
    ];
    return parts.filter((element, index, all) => (
      element?.isConnected && all.indexOf(element) === index && isStickyHeader(element)
    )).reduce((height, element) => height + element.getBoundingClientRect().height, 0);
  }

  function isStickyHeader(element) {
    const style = window.getComputedStyle(element);
    return style.display !== "none" && (style.position === "fixed" || style.position === "sticky");
  }

  function interrupt() {
    if (!handled && root.kapyguts?.isBoardPage?.()) userInterrupted = true;
  }

  function interruptByKey(event) {
    if (SCROLL_KEYS.has(event.key)) interrupt();
  }
})();
