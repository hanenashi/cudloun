// Optional full-resolution OPU images inside Kapybara board posts.
(function () {
  "use strict";

  const root = window.Cudloun;
  const VERSION = "0.1.0";
  const STYLE_ID = "cudloun-opu-originals-style";
  const MARKER = "data-cudloun-opu-originals";
  const THUMB_PATH = /^\/p\/\d{2}\/\d{2}\/\d{2}\/thumbs\/([a-z0-9][a-z0-9._-]*\.(?:jpe?g|png|gif|webp))$/i;
  const records = new Map();
  let observer = null;
  let timer = 0;

  root.opuOriginals = {
    version: VERSION,
    originalUrl,
    status: () => ({
      active: !!observer,
      converted: Array.from(records.values()).filter((record) => record.image.getAttribute("src") === record.full).length,
    }),
  };

  root.registerModule({
    id: "opu-originals",
    name: "OPU Originals",
    description: "Show full-resolution OPU images inline instead of authored thumbnails.",
    version: VERSION,
    defaultEnabled: false,
    start(ctx) {
      if (!root.kapyguts?.isKapybara?.()) return null;
      return start(ctx);
    },
    renderHelp() {
      return [
        "On Kapybara club posts, replace OPU /thumbs/ image sources with their matching full-resolution OPU URL.",
        "Images can grow up to the post width. Existing links, content warnings, and other image hosts are left alone.",
        "The original thumbnail is restored if the full-size image fails to load or when you disable this module.",
        "Plain image URLs are not auto-embedded. Full-size files may consume more data and page space.",
      ];
    },
  });

  function originalUrl(value) {
    try {
      const url = new URL(value, window.location.href);
      if (url.origin !== "https://opu.peklo.biz" || url.username || url.password || url.search || url.hash) return "";
      const match = url.pathname.match(THUMB_PATH);
      if (!match) return "";
      url.pathname = url.pathname.replace("/thumbs/", "/");
      return url.href;
    } catch (_error) {
      return "";
    }
  }

  function start(ctx) {
    stop();
    installStyle();
    observer = new MutationObserver(schedule);
    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "srcset"],
    });
    window.addEventListener("popstate", schedule);
    scan();
    ctx.log.info("OPU Originals ready");
    return stop;
  }

  function stop() {
    observer?.disconnect();
    observer = null;
    window.clearTimeout(timer);
    timer = 0;
    window.removeEventListener("popstate", schedule);
    for (const record of records.values()) restore(record);
    records.clear();
    document.getElementById(STYLE_ID)?.remove();
  }

  function schedule() {
    if (!observer || timer) return;
    timer = window.setTimeout(() => {
      timer = 0;
      scan();
    }, 60);
  }

  function scan() {
    for (const record of records.values()) {
      if (!record.image.isConnected) {
        restore(record);
        records.delete(record.image);
      }
    }
    if (root.kapyguts?.route?.().type !== "board") return;
    for (const image of document.querySelectorAll(root.kapyguts.selectors.postImage)) {
      if (image.closest("picture") || image.hasAttribute("srcset")) continue;
      const thumbnail = image.getAttribute("src");
      const full = originalUrl(thumbnail);
      if (!full) continue;
      const previous = records.get(image);
      if (previous?.failed && previous.thumbnail === thumbnail) continue;
      if (previous) restore(previous);

      const wrapper = image.closest(".okimg-sized");
      const record = { image, wrapper, thumbnail, full, failed: false, onError: null };
      record.onError = () => {
        if (image.getAttribute("src") !== full) return;
        record.failed = true;
        image.setAttribute("src", thumbnail);
        unmark(record);
      };
      records.set(image, record);
      image.addEventListener("error", record.onError);
      image.setAttribute(MARKER, "");
      wrapper?.setAttribute(MARKER, "");
      image.setAttribute("src", full);
    }
  }

  function restore(record) {
    record.image.removeEventListener("error", record.onError);
    if (record.image.getAttribute("src") === record.full) {
      record.image.setAttribute("src", record.thumbnail);
    }
    unmark(record);
  }

  function unmark(record) {
    record.image.removeAttribute(MARKER);
    record.wrapper?.removeAttribute(MARKER);
  }

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      article.post .body img[${MARKER}] {
        width: auto !important;
        height: auto !important;
        max-width: 100% !important;
        max-height: none !important;
        aspect-ratio: auto !important;
      }
      article.post .body .okimg-sized[${MARKER}] {
        width: auto !important;
        height: auto !important;
        max-width: 100% !important;
        aspect-ratio: auto !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }
})();
