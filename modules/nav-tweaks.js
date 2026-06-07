// Cudloun module: consistent Babeta quick navigation.
(function () {
  "use strict";

  const root = window.Cudloun;
  const ID = "nav-tweaks";
  const VERSION = "0.1.0";
  const STYLE_ID = "cudloun-nav-tweaks-style";
  const BAR_ID = "cudloun-nav-tweaks-bar";
  const SETTINGS_KEY = "cudloun.module.navTweaks.v1";

  const defaults = {
    enabled: true,
    showMobile: true,
    showDesktop: false,
    compactLandscape: true,
    position: "top",
    showHome: true,
    showMessages: true,
    showFavorites: true,
    showSearch: true,
    showContribute: true,
    showTopBottom: true,
  };

  let settings = loadSettings();
  let observer = null;
  let resizeHandler = null;
  let renderScheduled = false;

  root.registerModule({
    id: ID,
    name: "Nav Tweaks",
    description: "Add consistent quick actions for Babeta navigation, board search, posting, and page top/bottom.",
    version: VERSION,
    defaultEnabled: false,
    actionLabel: "Show shortcuts",
    start(ctx) {
      install(ctx);
      return stop;
    },
    stop,
    action(ctx) {
      install(ctx);
      const bar = document.getElementById(BAR_ID);
      if (bar) flash(bar);
    },
    renderSettings(ctx) {
      const wrap = document.createElement("div");
      wrap.className = "cudloun-settings-list";
      [
        ["showMobile", "Show on mobile"],
        ["showDesktop", "Show on desktop"],
        ["compactLandscape", "Compact in landscape"],
        ["showHome", "Home"],
        ["showMessages", "Vzkaznik"],
        ["showFavorites", "Oblibene"],
        ["showSearch", "Board search"],
        ["showContribute", "Contribute"],
        ["showTopBottom", "Top/bottom"],
      ].forEach(([name, label]) => {
        wrap.appendChild(renderCheckbox(ctx, name, label));
      });

      const position = document.createElement("label");
      position.className = "cudloun-setting-row";
      const text = document.createElement("span");
      text.className = "cudloun-setting-text";
      text.textContent = "Position";
      const select = document.createElement("select");
      select.value = settings.position;
      [["top", "Top"], ["bottom", "Bottom"]].forEach(([value, label]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        select.appendChild(option);
      });
      select.addEventListener("change", () => {
        settings.position = select.value === "bottom" ? "bottom" : "top";
        saveSettings();
        applySettings();
        renderBar(ctx);
      });
      position.appendChild(text);
      position.appendChild(select);
      wrap.appendChild(position);
      return wrap;
    },
    renderHelp() {
      return [
        "Nav Tweaks adds a small fixed shortcut rail so phone, tablet, and desktop users can keep key actions in one predictable place.",
        "Home, Vzkaznik, and Oblibene prefer Babeta's native navigation buttons when visible, then fall back to route navigation.",
        "Board search and contribute shortcuts click Babeta's native controls when they are available.",
      ];
    },
  });

  function install(ctx) {
    installStyles();
    renderBar(ctx);
    applySettings();

    if (!observer) {
      observer = new MutationObserver((records) => {
        if (records.every((record) => record.target instanceof Element && record.target.closest(`#${BAR_ID}`))) return;
        scheduleRender(ctx);
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
    if (!resizeHandler) {
      resizeHandler = () => applySettings();
      window.addEventListener("resize", resizeHandler);
      window.addEventListener("orientationchange", resizeHandler);
    }
    ctx?.log?.info?.("installed");
  }

  function stop() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (resizeHandler) {
      window.removeEventListener("resize", resizeHandler);
      window.removeEventListener("orientationchange", resizeHandler);
      resizeHandler = null;
    }
    document.getElementById(BAR_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();
    document.documentElement.removeAttribute("data-cudloun-nav-tweaks-position");
    document.documentElement.removeAttribute("data-cudloun-nav-tweaks-compact");
    document.documentElement.removeAttribute("data-cudloun-nav-tweaks-visible");
    document.documentElement.removeAttribute("data-cudloun-nav-tweaks-route");
  }

  function renderCheckbox(ctx, name, labelText) {
    const label = document.createElement("label");
    label.className = "cudloun-setting-row";
    const text = document.createElement("span");
    text.className = "cudloun-setting-text";
    text.textContent = labelText;
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = settings[name] !== false;
    checkbox.addEventListener("change", () => {
      settings[name] = checkbox.checked;
      saveSettings();
      applySettings();
      renderBar(ctx);
    });
    label.appendChild(text);
    label.appendChild(checkbox);
    return label;
  }

  function renderBar(ctx) {
    renderScheduled = false;
    let bar = document.getElementById(BAR_ID);
    if (!settings.enabled) {
      bar?.remove();
      return;
    }
    if (!bar) {
      bar = document.createElement("nav");
      bar.id = BAR_ID;
      bar.setAttribute("aria-label", "Cudloun quick navigation");
      document.body.appendChild(bar);
    }

    const actions = buildActions(ctx).filter((action) => action.enabled);
    bar.innerHTML = "";
    actions.forEach((action) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "cudloun-nav-tweaks-action";
      button.dataset.action = action.id;
      button.title = action.title;
      button.setAttribute("aria-label", action.title);
      button.innerHTML = `<span class="cudloun-nav-tweaks-icon">${action.icon}</span><span class="cudloun-nav-tweaks-label">${action.label}</span>`;
      button.addEventListener("click", (event) => {
        event.preventDefault();
        action.run();
      });
      bar.appendChild(button);
    });
    applySettings();
  }

  function scheduleRender(ctx) {
    if (renderScheduled) return;
    renderScheduled = true;
    window.setTimeout(() => renderBar(ctx), 120);
  }

  function buildActions(ctx) {
    const route = root.babeguts?.route?.() || currentRoute();
    const board = route.type === "board";
    return [
      {
        id: "home",
        label: "Domu",
        title: "Domu",
        icon: "⌂",
        enabled: settings.showHome,
        run: () => nativeBottom("Domů") || navigate("/"),
      },
      {
        id: "messages",
        label: "Vzk",
        title: "Vzkaznik",
        icon: "✉",
        enabled: settings.showMessages,
        run: () => nativeBottom("Vzkazník") || navigate("/messages"),
      },
      {
        id: "favorites",
        label: "Obl",
        title: "Oblibene",
        icon: "★",
        enabled: settings.showFavorites,
        run: () => nativeBottom("Oblíbené") || navigate("/favorites"),
      },
      {
        id: "search",
        label: "Search",
        title: board ? "Hledat v klubu" : "Search",
        icon: "⌕",
        enabled: settings.showSearch,
        run: () => clickFirst([
          'button[aria-label="Hledat v klubu"]',
          'button[aria-label*="Hledat"]',
          'input[type="text"]',
        ]) || focusGlobalSearch(ctx),
      },
      {
        id: "contribute",
        label: "Post",
        title: "Prispět",
        icon: "+",
        enabled: board && settings.showContribute,
        run: () => clickTextButton(/^PŘISPĚT\\*?$/i) || clickTextButton(/^PRISPET\\*?$/i),
      },
      {
        id: "top",
        label: "Top",
        title: "Top",
        icon: "↑",
        enabled: settings.showTopBottom,
        run: () => window.scrollTo({ top: 0, behavior: "smooth" }),
      },
      {
        id: "bottom",
        label: "Bot",
        title: "Bottom",
        icon: "↓",
        enabled: settings.showTopBottom,
        run: () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" }),
      },
    ];
  }

  function nativeBottom(label) {
    const normalized = normalize(label);
    const button = Array.from(document.querySelectorAll(".MuiBottomNavigationAction-root, button"))
      .filter(isVisible)
      .find((node) => normalize(node.textContent || "") === normalized);
    if (!button) return false;
    button.click();
    return true;
  }

  function clickFirst(selectors) {
    for (const selector of selectors) {
      const node = Array.from(document.querySelectorAll(selector)).find(isVisible);
      if (!node) continue;
      if (node.matches("input, textarea")) node.focus();
      else node.click();
      return true;
    }
    return false;
  }

  function clickTextButton(pattern) {
    const button = Array.from(document.querySelectorAll("button"))
      .filter(isVisible)
      .find((node) => pattern.test(normalize(node.textContent || "")));
    if (!button) return false;
    button.click();
    return true;
  }

  function focusGlobalSearch() {
    const input = Array.from(document.querySelectorAll('input[type="text"], input[type="search"]')).find(isVisible);
    if (!input) return false;
    input.focus();
    return true;
  }

  function navigate(path) {
    if (root.navigate) root.navigate(path);
    else window.location.assign(path);
    return true;
  }

  function currentRoute() {
    const path = window.location.pathname;
    const boardMatch = path.match(/^\/boards\/([^/?#]+)/);
    return {
      href: window.location.href,
      path,
      search: window.location.search,
      hash: window.location.hash,
      type: boardMatch ? "board" : path === "/favorites" ? "favorites" : path === "/" ? "home" : "unknown",
      boardId: boardMatch ? decodeURIComponent(boardMatch[1]) : "",
    };
  }

  function applySettings() {
    const mobile = window.matchMedia?.("(max-width: 760px), (pointer: coarse)")?.matches;
    const visible = settings.enabled && ((mobile && settings.showMobile) || (!mobile && settings.showDesktop));
    const compact = settings.compactLandscape && window.innerWidth > window.innerHeight;
    const route = root.babeguts?.route?.() || currentRoute();
    document.documentElement.setAttribute("data-cudloun-nav-tweaks-route", route.type || "unknown");
    document.documentElement.setAttribute("data-cudloun-nav-tweaks-position", settings.position === "bottom" ? "bottom" : "top");
    document.documentElement.setAttribute("data-cudloun-nav-tweaks-compact", compact ? "true" : "false");
    document.documentElement.setAttribute("data-cudloun-nav-tweaks-visible", visible ? "true" : "false");
  }

  function flash(node) {
    node.animate?.([
      { transform: "translateY(0)", boxShadow: "0 10px 26px rgba(18,25,38,.18)" },
      { transform: "translateY(-2px)", boxShadow: "0 12px 32px rgba(14,116,144,.32)" },
      { transform: "translateY(0)", boxShadow: "0 10px 26px rgba(18,25,38,.18)" },
    ], { duration: 360, easing: "ease-out" });
  }

  function isVisible(node) {
    if (root.babeguts?.isVisible) return root.babeguts.isVisible(node);
    if (!(node instanceof Element)) return false;
    const rect = node.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    const style = window.getComputedStyle(node);
    return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
  }

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function loadSettings() {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
    } catch (error) {
      return { ...defaults };
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      root.log?.warn?.("nav-tweaks", "settings could not be saved", error);
    }
  }

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${BAR_ID} {
        position: fixed;
        z-index: 2147483598;
        left: 50%;
        display: flex;
        align-items: center;
        gap: 4px;
        max-width: calc(100vw - 16px);
        box-sizing: border-box;
        padding: 4px;
        border: 1px solid rgba(79, 102, 134, .18);
        border-radius: 8px;
        background: rgba(255, 255, 255, .96);
        color: #182230;
        box-shadow: 0 10px 26px rgba(18, 25, 38, .18);
        transform: translateX(-50%);
        overflow-x: auto;
        scrollbar-width: none;
        -webkit-overflow-scrolling: touch;
      }
      #${BAR_ID}::-webkit-scrollbar {
        display: none;
      }
      html[data-cudloun-nav-tweaks-visible="false"] #${BAR_ID} {
        display: none;
      }
      html[data-cudloun-nav-tweaks-position="top"] #${BAR_ID} {
        top: max(58px, env(safe-area-inset-top, 0px) + 58px);
      }
      html[data-cudloun-nav-tweaks-position="top"][data-cudloun-nav-tweaks-route="board"] #${BAR_ID} {
        top: max(112px, env(safe-area-inset-top, 0px) + 112px);
      }
      html[data-cudloun-nav-tweaks-position="bottom"] #${BAR_ID} {
        bottom: max(62px, env(safe-area-inset-bottom, 0px) + 62px);
      }
      #${BAR_ID} .cudloun-nav-tweaks-action {
        appearance: none;
        min-width: 42px;
        height: 32px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 3px;
        border: 1px solid rgba(79, 102, 134, .18);
        border-radius: 6px;
        background: #f8fafc;
        color: #243041;
        cursor: pointer;
        font: 700 11px/1 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        letter-spacing: 0;
        white-space: nowrap;
      }
      #${BAR_ID} .cudloun-nav-tweaks-action:hover {
        background: #eef2f7;
      }
      #${BAR_ID} .cudloun-nav-tweaks-icon {
        font-size: 13px;
        line-height: 1;
      }
      #${BAR_ID} .cudloun-nav-tweaks-label {
        overflow: hidden;
        text-overflow: ellipsis;
      }
      html[data-cudloun-nav-tweaks-compact="true"] #${BAR_ID} {
        padding: 3px;
        gap: 3px;
      }
      html[data-cudloun-nav-tweaks-compact="true"] #${BAR_ID} .cudloun-nav-tweaks-action {
        min-width: 34px;
        width: 34px;
        height: 28px;
      }
      html[data-cudloun-nav-tweaks-compact="true"] #${BAR_ID} .cudloun-nav-tweaks-label {
        display: none;
      }
      @media (min-width: 761px) and (pointer: fine) {
        html[data-cudloun-nav-tweaks-position="top"] #${BAR_ID} {
          top: 72px;
        }
        html[data-cudloun-nav-tweaks-position="bottom"] #${BAR_ID} {
          bottom: 18px;
        }
      }
    `;
    document.head.appendChild(style);
  }
})();
