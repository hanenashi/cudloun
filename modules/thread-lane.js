// Mobile thread lane for Kapybara reply references.
(function () {
  "use strict";

  const root = window.Cudloun;
  const STYLE_ID = "cudloun-thread-lane-style";
  const OPEN_ATTR = "data-cudloun-thread-lane";
  const LANE_CLASS = "cudloun-thread-lane";
  const BACKDROP_CLASS = "cudloun-thread-lane-backdrop";
  const DEFAULTS = {
    mobileOnly: true,
    newestFirst: true,
  };

  let ctxRef = null;
  let clickHandler = null;
  let keyHandler = null;
  let routeTimer = null;
  let lastRoute = "";

  root.registerModule({
    id: "thread-lane",
    name: "Thread Lane",
    description: "Mobile side lane for reading a reply thread without leaving chronological view.",
    version: "0.1.0",
    defaultEnabled: false,
    start(ctx) {
      ctxRef = ctx;
      installStyles();
      attach();
      return () => cleanup();
    },
    renderSettings(ctx) {
      const wrap = document.createElement("div");
      wrap.className = "cudloun-settings-list";
      wrap.appendChild(makeCheckboxRow(ctx, "Mobile only", "mobileOnly", DEFAULTS.mobileOnly));
      wrap.appendChild(makeCheckboxRow(ctx, "Newest first", "newestFirst", DEFAULTS.newestFirst));
      return wrap;
    },
    renderHelp() {
      return [
        "Tap a Kapybara reply reference such as Re: Lucifer to slide the page left and open the whole visible thread.",
        "Swipe the thread lane right, press Escape, or tap Close to return to the original page.",
        "This first version only uses posts already loaded on the current Kapybara page.",
      ];
    },
  });

  function attach() {
    if (!root.kapyguts?.isKapybara?.()) return;
    if (clickHandler) return;

    clickHandler = (event) => {
      if (!isAllowedViewport()) return;

      const target = event.target instanceof Element ? event.target : null;
      const replyRef = target?.closest(root.kapyguts.selectors.replyMeta || ".reply-ref");
      if (!replyRef) return;

      const post = replyRef.closest(root.kapyguts.selectors.boardPost || "article.post");
      if (!post) return;

      const threadId = post.getAttribute("data-thread-id") || "";
      if (!threadId) return;

      const posts = threadPosts(threadId);
      if (posts.length < 2) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openLane({ sourcePost: post, replyRef, threadId, posts });
    };

    keyHandler = (event) => {
      if (event.key === "Escape") closeLane();
    };

    document.addEventListener("click", clickHandler, true);
    document.addEventListener("keydown", keyHandler, true);
    observeRouteChanges();
    root.log.info("thread-lane", "ready");
  }

  function cleanup() {
    closeLane(true);
    if (clickHandler) document.removeEventListener("click", clickHandler, true);
    if (keyHandler) document.removeEventListener("keydown", keyHandler, true);
    clickHandler = null;
    keyHandler = null;
    window.clearTimeout(routeTimer);
    routeTimer = null;
    document.getElementById(STYLE_ID)?.remove();
    ctxRef = null;
    root.log.info("thread-lane", "removed");
  }

  function observeRouteChanges() {
    lastRoute = root.currentRoute();
    const check = () => {
      const route = root.currentRoute();
      if (route !== lastRoute) {
        lastRoute = route;
        closeLane();
      }
      routeTimer = window.setTimeout(check, 500);
    };
    routeTimer = window.setTimeout(check, 500);
  }

  function isAllowedViewport() {
    if (!ctxRef?.storage.get("mobileOnly", DEFAULTS.mobileOnly)) return true;
    return window.innerWidth <= 760 || window.matchMedia("(pointer: coarse)").matches;
  }

  function openLane({ sourcePost, replyRef, threadId, posts }) {
    closeLane();

    const sourceId = sourcePost.getAttribute("data-post-id") || "";
    const title = cleanText(replyRef.textContent) || "Thread";
    const sorted = sortedThreadPosts(posts);

    const backdrop = document.createElement("div");
    backdrop.className = BACKDROP_CLASS;
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) closeLane();
    });

    const lane = document.createElement("aside");
    lane.className = LANE_CLASS;
    lane.setAttribute("role", "dialog");
    lane.setAttribute("aria-modal", "true");
    lane.setAttribute("aria-label", title);

    const header = document.createElement("div");
    header.className = "cudloun-thread-lane-head";

    const titleWrap = document.createElement("div");
    titleWrap.className = "cudloun-thread-lane-title-wrap";
    const heading = document.createElement("h2");
    heading.textContent = title;
    const meta = document.createElement("p");
    meta.textContent = `${sorted.length} visible posts`;
    titleWrap.appendChild(heading);
    titleWrap.appendChild(meta);

    const close = document.createElement("button");
    close.type = "button";
    close.className = "cudloun-thread-lane-close";
    close.textContent = "Close";
    close.addEventListener("click", closeLane);

    header.appendChild(titleWrap);
    header.appendChild(close);
    lane.appendChild(header);

    const list = document.createElement("div");
    list.className = "cudloun-thread-lane-list";
    sorted.forEach((post) => list.appendChild(renderPostClone(post, sourceId)));
    lane.appendChild(list);

    backdrop.appendChild(lane);
    document.body.appendChild(backdrop);
    installSwipeClose(lane);

    window.requestAnimationFrame(() => {
      document.documentElement.setAttribute(OPEN_ATTR, "open");
      lane.focus?.();
    });

    root.log.info("thread-lane", "opened", threadId, `${sorted.length} posts`);
  }

  function closeLane(immediate = false) {
    document.documentElement.removeAttribute(OPEN_ATTR);
    const backdrop = document.querySelector(`.${BACKDROP_CLASS}`);
    if (!backdrop) return;

    if (immediate) {
      backdrop.remove();
      return;
    }

    window.setTimeout(() => {
      if (!document.documentElement.hasAttribute(OPEN_ATTR)) backdrop.remove();
    }, 180);
  }

  function threadPosts(threadId) {
    return root.kapyguts.allPosts()
      .filter((post) => post.getAttribute("data-thread-id") === threadId);
  }

  function sortedThreadPosts(posts) {
    const newestFirst = ctxRef?.storage.get("newestFirst", DEFAULTS.newestFirst) !== false;
    return posts.slice().sort((a, b) => {
      const aId = numericPostId(a);
      const bId = numericPostId(b);
      if (aId !== bId) return newestFirst ? bId - aId : aId - bId;
      return posts.indexOf(a) - posts.indexOf(b);
    });
  }

  function renderPostClone(post, sourceId) {
    const clone = post.cloneNode(true);
    clone.classList.add("cudloun-thread-lane-post");
    clone.removeAttribute("id");
    clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
    clone.querySelectorAll("button, input, textarea, select").forEach((node) => {
      node.disabled = true;
      node.setAttribute("aria-disabled", "true");
    });
    clone.querySelectorAll("a").forEach((node) => {
      node.addEventListener("click", (event) => event.stopPropagation());
    });
    if ((post.getAttribute("data-post-id") || "") === sourceId) {
      clone.dataset.threadLaneSource = "true";
    }
    return clone;
  }

  function installSwipeClose(lane) {
    let startX = 0;
    let startY = 0;
    let tracking = false;

    lane.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse") return;
      tracking = true;
      startX = event.clientX;
      startY = event.clientY;
      lane.setPointerCapture?.(event.pointerId);
    });

    lane.addEventListener("pointerup", (event) => {
      if (!tracking) return;
      tracking = false;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (dx > 72 && Math.abs(dx) > Math.abs(dy) * 1.4) closeLane();
    });

    lane.addEventListener("pointercancel", () => {
      tracking = false;
    });
  }

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      html[${OPEN_ATTR}="open"]{overflow:hidden}
      html[${OPEN_ATTR}="open"] #root{transform:translateX(-34vw);transition:transform 180ms ease;will-change:transform}
      html:not([${OPEN_ATTR}="open"]) #root{transition:transform 180ms ease}
      .${BACKDROP_CLASS}{position:fixed;inset:0;z-index:1500;background:rgba(0,0,0,.18);pointer-events:none}
      .${LANE_CLASS}{box-sizing:border-box;position:absolute;top:0;right:0;width:min(92vw,430px);height:100dvh;display:flex;flex-direction:column;overflow:hidden;transform:translateX(104%);transition:transform 180ms ease;background:#f8fafc;color:#182230;border-left:1px solid rgba(79,102,134,.22);box-shadow:-18px 0 42px rgba(0,0,0,.24);pointer-events:auto;font-family:inherit}
      html[${OPEN_ATTR}="open"] .${LANE_CLASS}{transform:translateX(0)}
      .cudloun-thread-lane-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 12px 10px;border-bottom:1px solid rgba(79,102,134,.18);background:#fff;flex:0 0 auto}
      .cudloun-thread-lane-title-wrap{min-width:0}
      .cudloun-thread-lane-title-wrap h2{margin:0;color:#182230;font-size:1rem;line-height:1.2;letter-spacing:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .cudloun-thread-lane-title-wrap p{margin:3px 0 0;color:#697586;font-size:.78rem;line-height:1.25}
      .cudloun-thread-lane-close{appearance:none;border:1px solid rgba(79,102,134,.24);border-radius:6px;background:#f8fafc;color:#243041;cursor:pointer;font:700 .82rem/1.2 inherit;padding:7px 9px}
      .cudloun-thread-lane-list{flex:1 1 auto;min-height:0;overflow:auto;padding:8px;background:#edf2f7}
      .cudloun-thread-lane-post{box-sizing:border-box;width:100%!important;margin:0 0 8px!important;border-radius:8px!important;border:1px solid rgba(79,102,134,.18)!important;background:#fff!important;box-shadow:none!important}
      .cudloun-thread-lane-post[data-thread-lane-source=true]{outline:2px solid rgba(8,126,164,.45);outline-offset:0}
      .cudloun-thread-lane-post .post-menu-button{display:none!important}
      html[data-cudloun-kapybara-theme="dark"] .${LANE_CLASS}{background:var(--cudloun-kapybara-bg,#000);color:var(--cudloun-kapybara-text,#f4f4f4);border-color:var(--cudloun-kapybara-line,#303030)}
      html[data-cudloun-kapybara-theme="dark"] .cudloun-thread-lane-head{background:var(--cudloun-kapybara-surface,#141414);border-color:var(--cudloun-kapybara-line,#303030)}
      html[data-cudloun-kapybara-theme="dark"] .cudloun-thread-lane-title-wrap h2{color:var(--cudloun-kapybara-text,#f4f4f4)}
      html[data-cudloun-kapybara-theme="dark"] .cudloun-thread-lane-title-wrap p{color:var(--cudloun-kapybara-muted,#aaaeb6)}
      html[data-cudloun-kapybara-theme="dark"] .cudloun-thread-lane-close{background:var(--cudloun-kapybara-surface-2,#1f1f1f);color:var(--cudloun-kapybara-text,#f4f4f4);border-color:var(--cudloun-kapybara-line,#303030)}
      html[data-cudloun-kapybara-theme="dark"] .cudloun-thread-lane-list{background:var(--cudloun-kapybara-bg,#000)}
      html[data-cudloun-kapybara-theme="dark"] .cudloun-thread-lane-post{background:var(--cudloun-kapybara-surface,#141414)!important;border-color:var(--cudloun-kapybara-line,#303030)!important}
    `;
    document.head.appendChild(style);
  }

  function makeCheckboxRow(ctx, labelText, key, fallback) {
    const label = document.createElement("label");
    label.className = "cudloun-setting-row";

    const text = document.createElement("span");
    text.className = "cudloun-setting-text";
    text.textContent = labelText;

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = ctx.storage.get(key, fallback) !== false;
    input.addEventListener("change", () => ctx.storage.set(key, input.checked));

    label.appendChild(text);
    label.appendChild(input);
    return label;
  }

  function numericPostId(post) {
    const value = Number.parseInt(post.getAttribute("data-post-id") || "0", 10);
    return Number.isFinite(value) ? value : 0;
  }

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }
})();
