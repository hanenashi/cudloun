// Collapse Kapybara's automatic video/social preview cards to their native link cues.
(function () {
  "use strict";

  const root = window.Cudloun;
  const VERSION = "0.1.0";
  const PROVIDERS = new Set(["video", "youtube", "x", "twitter", "tweet"]);
  const CARD_CLASSES = /(?:^|\s)okoun-embed--(?:video|youtube|x|twitter|tweet)(?:\s|$)/;
  const collapsed = new Set();
  let observer = null;
  let timer = 0;

  root.mediaCards = {
    version: VERSION,
    status: () => ({ active: !!observer, collapsed: collapsed.size }),
  };

  root.registerModule({
    id: "media-cards",
    name: "Compact Media Links",
    description: "Start video, YouTube and X posts as links with Kapybara's play/open cue, not large preview cards.",
    version: VERSION,
    defaultEnabled: false,
    start(ctx) {
      if (!root.kapyguts?.isKapybara?.()) return null;
      stop();
      observer = new MutationObserver(schedule);
      observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
      window.addEventListener("popstate", schedule);
      scan();
      ctx.log.info("Compact Media Links ready");
      return stop;
    },
    renderHelp() {
      return [
        "On Kapybara club posts, collapse automatic video, YouTube, and X/Twitter preview cards to their original links and native play/open cues.",
        "Click the cue to show a card when you want it. The module does not block playback, change posts, or affect other embed providers.",
        "Disabling the module restores cards it collapsed when their posts are still on screen.",
      ];
    },
  });

  function stop() {
    observer?.disconnect();
    observer = null;
    window.clearTimeout(timer);
    timer = 0;
    window.removeEventListener("popstate", schedule);
    for (const cue of collapsed) {
      if (cue.isConnected && cue.getAttribute("data-cue-open") === "false") cue.click();
    }
    collapsed.clear();
  }

  function schedule() {
    if (!observer || timer) return;
    timer = window.setTimeout(() => {
      timer = 0;
      scan();
    }, 0);
  }

  function scan() {
    for (const cue of collapsed) {
      if (!cue.isConnected) collapsed.delete(cue);
    }
    if (root.kapyguts?.route?.().type !== "board") return;
    for (const card of document.querySelectorAll("article.post .body .okoun-embed")) {
      const provider = card.getAttribute("data-embed-provider")?.toLowerCase();
      if (!PROVIDERS.has(provider) && !CARD_CLASSES.test(card.className)) continue;
      const id = card.getAttribute("data-embed-id");
      const previous = card.previousElementSibling;
      if (!previous || !id) continue;
      const cues = previous.querySelectorAll("button.okoun-play-cue[data-cue-id]");
      for (const cue of cues) {
        if (cue.getAttribute("data-cue-id") !== id || collapsed.has(cue)) continue;
        if (cue.getAttribute("data-cue-open") !== "true") continue;
        collapsed.add(cue);
        cue.click();
        break;
      }
    }
  }
})();
