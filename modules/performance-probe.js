// Cudloun module: collect Babeta page performance diagnostics.
(function () {
  "use strict";

  const root = window.Cudloun;
  const ID = "performance-probe";
  const VERSION = "0.1.1";
  const STYLE_ID = "cudloun-performance-probe-style";
  const PANEL_ID = "cudloun-performance-probe-panel";
  const SAMPLE_LIMIT = 90;
  const SAMPLE_MS = 1000;

  let sampleTimer = null;
  let observer = null;
  let longTaskObserver = null;
  let firstPostAt = null;
  let firstImageCompleteAt = null;
  let maxPostsSeen = 0;
  let maxImagesSeen = 0;
  let samples = [];
  let longTasks = [];

  root.registerModule({
    id: ID,
    name: "Performance Probe",
    description: "Measure Babeta page loading, visible posts, image state, and blank-scroll symptoms for copyable reports.",
    version: VERSION,
    defaultEnabled: false,
    actionLabel: "Measure",
    start(ctx) {
      installStyles();
      startSampling(ctx);
      return stop;
    },
    stop,
    action(ctx) {
      openPanel(ctx);
    },
    renderSettings(ctx) {
      const wrap = document.createElement("div");
      wrap.className = "cudloun-settings-list";

      const row = document.createElement("div");
      row.className = "cudloun-setting-row";

      const text = document.createElement("div");
      text.className = "cudloun-setting-text";
      text.textContent = "Performance Probe samples the current page once per second while enabled.";

      row.appendChild(text);
      wrap.appendChild(row);

      const actions = document.createElement("div");
      actions.className = "cudloun-actions";

      const measure = document.createElement("button");
      measure.type = "button";
      measure.className = "cudloun-button";
      measure.textContent = "Measure now";
      measure.addEventListener("click", () => openPanel(ctx));

      const copy = document.createElement("button");
      copy.type = "button";
      copy.className = "cudloun-button";
      copy.textContent = "Copy report";
      copy.addEventListener("click", () => copyReport(ctx));

      actions.appendChild(measure);
      actions.appendChild(copy);
      wrap.appendChild(actions);
      return wrap;
    },
    renderHelp() {
      return [
        "Enable this module on a Babeta page, reproduce slow loading or blank scrolling, then copy the report.",
        "The report includes a short analysis plus route, viewport, browser hints, navigation timings, long tasks where available, post counts, image state, placeholders, and recent visible-post samples.",
        "It only observes the page. It does not change layout, mark posts as read, scroll the page, or send data anywhere automatically.",
      ];
    },
  });

  function startSampling(ctx) {
    resetSession();
    sample(ctx, "start");
    sampleTimer = window.setInterval(() => sample(ctx, "tick"), SAMPLE_MS);

    observer = new MutationObserver(() => {
      const counts = countPage();
      if (!firstPostAt && counts.boardPosts > 0) firstPostAt = Math.round(performance.now());
      if (!firstImageCompleteAt && counts.loadedImages > 0) firstImageCompleteAt = Math.round(performance.now());
      maxPostsSeen = Math.max(maxPostsSeen, counts.boardPosts);
      maxImagesSeen = Math.max(maxImagesSeen, counts.images);
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["src", "style", "class"] });
    startLongTaskObserver(ctx);
    ctx?.log?.info?.("sampling started");
  }

  function stop() {
    if (sampleTimer) {
      window.clearInterval(sampleTimer);
      sampleTimer = null;
    }
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (longTaskObserver) {
      longTaskObserver.disconnect();
      longTaskObserver = null;
    }
    document.getElementById(PANEL_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();
  }

  function resetSession() {
    firstPostAt = null;
    firstImageCompleteAt = null;
    maxPostsSeen = 0;
    maxImagesSeen = 0;
    samples = [];
    longTasks = [];
  }

  function openPanel(ctx) {
    installStyles();
    const report = makeReport("manual");

    let panel = document.getElementById(PANEL_ID);
    if (!panel) {
      panel = document.createElement("div");
      panel.id = PANEL_ID;
      panel.innerHTML = `
        <div class="cudloun-performance-probe-head">
          <strong>Performance Probe</strong>
          <button type="button" data-action="close">x</button>
        </div>
        <div class="cudloun-performance-probe-summary" data-summary></div>
        <textarea spellcheck="false" data-report></textarea>
        <div class="cudloun-performance-probe-actions">
          <button type="button" data-action="refresh">Refresh</button>
          <button type="button" data-action="copy">Copy report</button>
        </div>
      `;
      panel.querySelector("[data-action='close']").addEventListener("click", () => panel.remove());
      panel.querySelector("[data-action='refresh']").addEventListener("click", () => openPanel(ctx));
      panel.querySelector("[data-action='copy']").addEventListener("click", () => copyReport(ctx));
      document.body.appendChild(panel);
    }

    renderPanel(panel, report);
  }

  function renderPanel(panel, report) {
    const counts = report.counts;
    const summary = panel.querySelector("[data-summary]");
    const box = panel.querySelector("[data-report]");
    if (summary) {
      summary.textContent = [
        `${counts.boardPosts} posts`,
        `${counts.visibleBoardPosts} visible`,
        `${counts.loadedImages}/${counts.images} images loaded`,
        `${report.samples.blankSamplesLast30s} blank samples`,
      ].join(" / ");
    }
    if (box) {
      box.value = reportText(report);
      box.focus();
      box.select();
    }
  }

  function copyReport(ctx) {
    const report = makeReport("copy");
    const text = reportText(report);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => ctx?.log?.info?.("report copied"),
        (error) => ctx?.log?.warn?.("copy failed", error),
      );
    }

    const panel = document.getElementById(PANEL_ID);
    if (panel) renderPanel(panel, report);
  }

  function sample(ctx, reason) {
    const counts = countPage();
    const visible = visiblePostStats();
    const now = Math.round(performance.now());

    if (!firstPostAt && counts.boardPosts > 0) firstPostAt = now;
    if (!firstImageCompleteAt && counts.loadedImages > 0) firstImageCompleteAt = now;
    maxPostsSeen = Math.max(maxPostsSeen, counts.boardPosts);
    maxImagesSeen = Math.max(maxImagesSeen, counts.images);

    samples.push({
      t: now,
      reason,
      y: Math.round(window.scrollY || 0),
      boardPosts: counts.boardPosts,
      visibleBoardPosts: counts.visibleBoardPosts,
      images: counts.images,
      loadedImages: counts.loadedImages,
      placeholders: counts.placeholders,
      viewportPostHits: visible.viewportPostHits,
      mainBandPostHits: visible.mainBandPostHits,
      blankMainBand: visible.blankMainBand,
    });

    if (samples.length > SAMPLE_LIMIT) samples.shift();
    ctx?.log?.trace?.("sample", samples[samples.length - 1]);
  }

  function makeReport(reason) {
    const counts = countPage();
    const navigation = navigationTiming();
    const recent = samples.slice(-30);
    const blankSamples = recent.filter((item) => item.blankMainBand).length;
    const route = root.babeguts?.route?.() || {
      href: window.location.href,
      path: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      type: "unknown",
      boardId: "",
    };

    return {
      schemaVersion: 1,
      module: ID,
      moduleVersion: VERSION,
      reason,
      capturedAt: new Date().toISOString(),
      route,
      cudloun: {
        coreVersion: root.coreVersion || root.version || "",
        manifestVersion: root.manifestVersion || "",
        seedVersion: root.seedVersion || "",
      },
      user: root.babeguts?.currentUser?.() || "",
      viewport: viewportInfo(),
      browser: browserInfo(),
      navigation,
      analysis: analyzeReport({ navigation, counts, recent, blankSamples }),
      milestones: {
        probeStartedMs: samples[0]?.t || null,
        firstPostSeenMs: firstPostAt,
        firstImageCompleteSeenMs: firstImageCompleteAt,
        maxPostsSeen,
        maxImagesSeen,
      },
      longTasks: summarizeLongTasks(),
      counts,
      visiblePostStats: visiblePostStats(),
      samples: {
        intervalMs: SAMPLE_MS,
        retained: samples.length,
        recent: recent,
        blankSamplesLast30s: blankSamples,
      },
    };
  }

  function analyzeReport(data) {
    const probeStart = samples[0]?.t || null;
    const firstPostDelay = probeStart !== null && firstPostAt !== null ? firstPostAt - probeStart : null;
    const appRenderAfterLoad = firstPostAt !== null && data.navigation.loadEventEndMs !== null
      ? firstPostAt - data.navigation.loadEventEndMs
      : null;
    const yValues = data.recent.map((item) => item.y);
    const imageValues = data.recent.map((item) => item.images);
    const scrollMoves = yValues.filter((value, index) => index > 0 && value !== yValues[index - 1]).length;
    const imageCountChanged = imageValues.some((value, index) => index > 0 && value !== imageValues[index - 1]);
    const longTaskSummary = summarizeLongTasks();
    const notes = [];

    if (data.blankSamples > 0) notes.push(`${data.blankSamples} recent sample(s) had no post in the main reading band.`);
    else notes.push("No blank-scroll sample was captured in the recent window.");

    if (firstPostDelay !== null) notes.push(`First post was observed ${firstPostDelay} ms after the probe started.`);
    if (appRenderAfterLoad !== null && appRenderAfterLoad > 750) notes.push(`First post appeared ${appRenderAfterLoad} ms after loadEventEnd.`);
    if (data.counts.pendingImages > 0) notes.push(`${data.counts.pendingImages} image(s) were still pending at capture time.`);
    if (data.counts.brokenImages > 0) notes.push(`${data.counts.brokenImages} broken image(s) were visible to the browser.`);
    if (imageCountChanged) notes.push("Image count changed during the recent sample window.");
    if (scrollMoves > 0) notes.push(`Scroll position changed ${scrollMoves} time(s) in the recent sample window.`);
    if (longTaskSummary.supported && longTaskSummary.count > 0) notes.push(`${longTaskSummary.count} long task(s) over 50 ms were observed.`);
    if (!longTaskSummary.supported) notes.push("Long-task timing is not exposed by this browser.");

    return {
      blankSamplesLast30s: data.blankSamples,
      firstPostDelayAfterProbeStartMs: firstPostDelay,
      firstPostAfterLoadEventMs: appRenderAfterLoad,
      scrollMovesLast30s: scrollMoves,
      imageCountChangedLast30s: imageCountChanged,
      verdict: data.blankSamples > 0 || data.counts.pendingImages > 0 || longTaskSummary.totalDurationMs > 250
        ? "issue-observed"
        : "no-issue-observed",
      notes,
    };
  }

  function countPage() {
    const posts = allPosts();
    const visiblePosts = posts.filter(isVisible);
    const images = Array.from(document.images || []);
    const loadedImages = images.filter((img) => img.complete && img.naturalWidth > 0);
    const pendingImages = images.filter((img) => !img.complete || img.naturalWidth === 0);
    const placeholders = countPlaceholders();
    const contentItems = document.querySelectorAll(".content-item").length;

    return {
      contentItems,
      boardPosts: posts.length,
      visibleBoardPosts: visiblePosts.length,
      images: images.length,
      loadedImages: loadedImages.length,
      pendingImages: pendingImages.length,
      brokenImages: images.filter((img) => img.complete && img.naturalWidth === 0).length,
      placeholders,
    };
  }

  function visiblePostStats() {
    const posts = allPosts();
    const viewport = { top: 0, bottom: window.innerHeight || 0 };
    const mainBand = {
      top: Math.round((window.innerHeight || 0) * 0.22),
      bottom: Math.round((window.innerHeight || 0) * 0.86),
    };
    let viewportPostHits = 0;
    let mainBandPostHits = 0;
    let firstVisiblePostTop = null;
    let lastVisiblePostBottom = null;

    posts.forEach((post) => {
      const rect = post.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      if (rect.bottom > viewport.top && rect.top < viewport.bottom) {
        viewportPostHits += 1;
        if (firstVisiblePostTop === null) firstVisiblePostTop = Math.round(rect.top);
        lastVisiblePostBottom = Math.round(rect.bottom);
      }
      if (rect.bottom > mainBand.top && rect.top < mainBand.bottom) {
        mainBandPostHits += 1;
      }
    });

    return {
      viewportPostHits,
      mainBandPostHits,
      blankMainBand: posts.length > 0 && mainBandPostHits === 0,
      firstVisiblePostTop,
      lastVisiblePostBottom,
      scrollY: Math.round(window.scrollY || 0),
      documentHeight: Math.round(document.documentElement.scrollHeight || document.body.scrollHeight || 0),
    };
  }

  function allPosts() {
    if (root.babeguts?.allPosts) return root.babeguts.allPosts();
    return Array.from(document.querySelectorAll(".content-item.board-post"));
  }

  function countPlaceholders() {
    const selectors = [
      ".MuiSkeleton-root",
      '[class*="Skeleton"]',
      '[class*="skeleton"]',
      '[aria-busy="true"]',
      '[role="progressbar"]',
    ];
    return new Set(selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)))).size;
  }

  function navigationTiming() {
    const nav = performance.getEntriesByType?.("navigation")?.[0];
    if (!nav) {
      return {
        type: "",
        responseEndMs: null,
        domInteractiveMs: null,
        domContentLoadedMs: null,
        loadEventEndMs: null,
        transferSize: 0,
        encodedBodySize: 0,
        decodedBodySize: 0,
      };
    }
    const start = nav.startTime || 0;
    return {
      type: nav.type || "",
      responseEndMs: roundTiming(nav.responseEnd - start),
      domInteractiveMs: roundTiming(nav.domInteractive - start),
      domContentLoadedMs: roundTiming(nav.domContentLoadedEventEnd - start),
      loadEventEndMs: roundTiming(nav.loadEventEnd - start),
      transferSize: nav.transferSize || 0,
      encodedBodySize: nav.encodedBodySize || 0,
      decodedBodySize: nav.decodedBodySize || 0,
    };
  }

  function viewportInfo() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
      pointer: matchMediaSafe("(pointer: coarse)") ? "coarse" : "fine",
      orientation: window.innerWidth >= window.innerHeight ? "landscape" : "portrait",
    };
  }

  function browserInfo() {
    const nav = navigator;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection || {};
    return {
      userAgent: nav.userAgent,
      platform: nav.platform || "",
      hardwareConcurrency: nav.hardwareConcurrency || null,
      deviceMemory: nav.deviceMemory || null,
      connection: {
        effectiveType: connection.effectiveType || "",
        downlink: connection.downlink || null,
        rtt: connection.rtt || null,
        saveData: connection.saveData || false,
      },
    };
  }

  function startLongTaskObserver(ctx) {
    if (!("PerformanceObserver" in window)) return;
    try {
      longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          longTasks.push({
            startMs: Math.round(entry.startTime),
            durationMs: Math.round(entry.duration),
            name: entry.name || "",
          });
        });
        if (longTasks.length > 120) longTasks = longTasks.slice(-120);
      });
      longTaskObserver.observe({ entryTypes: ["longtask"] });
    } catch (error) {
      longTaskObserver = null;
      ctx?.log?.debug?.("longtask observer unavailable", error);
    }
  }

  function summarizeLongTasks() {
    const supported = !!longTaskObserver || longTasks.length > 0 || supportsLongTask();
    const totalDurationMs = longTasks.reduce((sum, item) => sum + item.durationMs, 0);
    const maxDurationMs = longTasks.reduce((max, item) => Math.max(max, item.durationMs), 0);
    return {
      supported,
      count: longTasks.length,
      totalDurationMs,
      maxDurationMs,
      recent: longTasks.slice(-20),
    };
  }

  function supportsLongTask() {
    try {
      return Array.isArray(PerformanceObserver.supportedEntryTypes) &&
        PerformanceObserver.supportedEntryTypes.includes("longtask");
    } catch (error) {
      return false;
    }
  }

  function reportText(report) {
    return [
      "Cudloun Performance Probe",
      `captured: ${report.capturedAt}`,
      `route: ${report.route.path}${report.route.search || ""}`,
      `viewport: ${report.viewport.width}x${report.viewport.height} ${report.viewport.orientation} ${report.viewport.pointer}`,
      `posts: ${report.counts.boardPosts} total, ${report.counts.visibleBoardPosts} visible, max seen ${report.milestones.maxPostsSeen}`,
      `images: ${report.counts.loadedImages}/${report.counts.images} loaded, ${report.counts.pendingImages} pending, ${report.counts.brokenImages} broken`,
      `placeholders: ${report.counts.placeholders}`,
      `blank main-band samples last 30s: ${report.samples.blankSamplesLast30s}`,
      `verdict: ${report.analysis.verdict}`,
      `first post after probe start: ${formatMs(report.analysis.firstPostDelayAfterProbeStartMs)}`,
      `first post after load event: ${formatMs(report.analysis.firstPostAfterLoadEventMs)}`,
      `long tasks: ${report.longTasks.supported ? `${report.longTasks.count} / ${report.longTasks.totalDurationMs} ms total` : "not exposed"}`,
      "",
      "Analysis:",
      ...report.analysis.notes.map((note) => `- ${note}`),
      "",
      JSON.stringify(report, null, 2),
    ].join("\n");
  }

  function isVisible(node) {
    if (root.babeguts?.isVisible) return root.babeguts.isVisible(node);
    if (!(node instanceof Element)) return false;
    const rect = node.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    const style = window.getComputedStyle(node);
    return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
  }

  function matchMediaSafe(query) {
    try {
      return !!window.matchMedia?.(query)?.matches;
    } catch (error) {
      return false;
    }
  }

  function roundTiming(value) {
    return Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
  }

  function formatMs(value) {
    return Number.isFinite(value) ? `${value} ms` : "n/a";
  }

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${PANEL_ID} {
        position: fixed;
        z-index: 2147483603;
        right: 12px;
        bottom: 12px;
        width: min(520px, calc(100vw - 24px));
        max-height: min(680px, calc(100dvh - 24px));
        display: grid;
        grid-template-rows: auto auto minmax(180px, 1fr) auto;
        gap: 8px;
        box-sizing: border-box;
        padding: 12px;
        border: 1px solid rgba(79, 102, 134, .24);
        border-radius: 8px;
        background: #fff;
        color: #182230;
        box-shadow: 0 18px 44px rgba(18, 25, 38, .22);
        font: 13px/1.35 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      #${PANEL_ID} .cudloun-performance-probe-head,
      #${PANEL_ID} .cudloun-performance-probe-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      #${PANEL_ID} strong {
        font-size: 14px;
      }
      #${PANEL_ID} button {
        appearance: none;
        border: 1px solid rgba(79, 102, 134, .26);
        border-radius: 6px;
        background: #f8fafc;
        color: #243041;
        cursor: pointer;
        font: 700 12px/1.2 inherit;
        padding: 7px 9px;
      }
      #${PANEL_ID} button:hover {
        background: #eef2f7;
      }
      #${PANEL_ID} .cudloun-performance-probe-summary {
        color: #4b5565;
        font-size: 12px;
      }
      #${PANEL_ID} textarea {
        box-sizing: border-box;
        width: 100%;
        min-height: 220px;
        max-height: 48vh;
        resize: vertical;
        border: 1px solid rgba(79, 102, 134, .28);
        border-radius: 6px;
        background: #f8fafc;
        color: #182230;
        font: 11px/1.4 Consolas, "SFMono-Regular", monospace;
        padding: 9px;
      }
      @media (max-width: 680px) {
        #${PANEL_ID} {
          right: 8px;
          bottom: 8px;
          width: calc(100vw - 16px);
          max-height: calc(100dvh - 16px);
          font-size: 12px;
        }
        #${PANEL_ID} textarea {
          min-height: 180px;
          max-height: 42vh;
        }
      }
    `;
    document.head.appendChild(style);
  }
})();
