// Standalone Cudloun container: tune mobile board post layout.
(function () {
  "use strict";

  const ID = "post-tweaks";
  const STYLE_ID = "cudloun-container-post-tweaks-style";
  const PANEL_ID = "cudloun-container-post-tweaks-panel";
  const STORAGE_KEY = "cudloun.container.postTweaks.v1";
  const LEGACY_STORAGE_KEY = "cudloun.container.textWidth.v1";
  const MARK_POST = "data-cudloun-post-tweaks-post";
  const MARK_ROW = "data-cudloun-post-tweaks-row";
  const MARK_AVATAR = "data-cudloun-post-tweaks-avatar";
  const MARK_CONTENT = "data-cudloun-post-tweaks-content";
  const MARK_HEADER = "data-cudloun-post-tweaks-header";
  const MARK_BODY = "data-cudloun-post-tweaks-body";
  const MARK_ACTIONS = "data-cudloun-post-tweaks-actions";
  const MARK_REPLY = "data-cudloun-post-tweaks-reply";
  const MARK_REPLY_MENU = "data-cudloun-post-tweaks-reply-menu";
  const MARK_NATIVE_MENU_HOOK = "data-cudloun-post-tweaks-native-menu-hook";
  const MARK_NATIVE_MENU_POPOUT = "data-cudloun-post-tweaks-native-menu-popout";
  const MARK_NATIVE_REPLY_ITEM = "data-cudloun-post-tweaks-native-reply-item";
  const MARK_REPLY_META = "data-cudloun-post-tweaks-reply-meta";
  const MARK_DATE_WRAP = "data-cudloun-post-tweaks-date-wrap";
  const COLOR_OPTIONS = [
    { value: "#ffffff", label: "White" },
    { value: "#f8fafc", label: "Soft gray" },
    { value: "#fff7df", label: "Warm" },
    { value: "#edf7ff", label: "Blue" },
    { value: "#edfdf4", label: "Green" },
  ];

  const defaults = {
    enabled: true,
    avatarInline: false,
    divider: false,
    background: false,
    backgroundColor: "#ffffff",
    avatarSize: 28,
    cardInset: 0,
    sidePadding: 4,
    postSpacing: 4,
    headerScale: 88,
    fontScale: 100,
    replyPlacement: "bottom",
    replyMetaInHeader: false,
    nativeMenuPopout: false,
  };

  let observer = null;
  let nativePopoutListenerInstalled = false;
  let settings = loadSettings();
  const postState = new WeakMap();

  const api = {
    id: ID,
    name: "Post Tweaks",
    run,
    stop,
  };

  window.CudlounPostTweaks = api;

  if (window.CudlounContainerRegistry && typeof window.CudlounContainerRegistry.register === "function") {
    window.CudlounContainerRegistry.register(api);
  }

  if (!window.CudlounContainerRegistry) {
    run();
  }

  return api;

  function run() {
    installStyles();
    installPanel();
    if (!nativePopoutListenerInstalled) {
      document.addEventListener("pointerdown", handleNativePopoutOutside, true);
      nativePopoutListenerInstalled = true;
    }
    applySettings();
    scan();

    if (!observer) {
      observer = new MutationObserver(() => scan());
      observer.observe(document.body, { childList: true, subtree: true });
    }

    console.log("[cudloun-container] post tweaks active");
    return api;
  }

  function stop() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    document.removeEventListener("pointerdown", handleNativePopoutOutside, true);
    nativePopoutListenerInstalled = false;

    document.querySelectorAll(`[${MARK_POST}]`).forEach(restorePost);

    document.querySelectorAll([
      `[${MARK_POST}]`,
      `[${MARK_ROW}]`,
      `[${MARK_AVATAR}]`,
      `[${MARK_CONTENT}]`,
      `[${MARK_HEADER}]`,
      `[${MARK_BODY}]`,
      `[${MARK_ACTIONS}]`,
      `[${MARK_REPLY}]`,
      `[${MARK_REPLY_MENU}]`,
      `[${MARK_NATIVE_MENU_POPOUT}]`,
      `[${MARK_REPLY_META}]`,
      `[${MARK_DATE_WRAP}]`,
    ].join(",")).forEach((node) => {
      node.removeAttribute(MARK_POST);
      node.removeAttribute(MARK_ROW);
      node.removeAttribute(MARK_AVATAR);
      node.removeAttribute(MARK_CONTENT);
      node.removeAttribute(MARK_HEADER);
      node.removeAttribute(MARK_BODY);
      node.removeAttribute(MARK_ACTIONS);
      node.removeAttribute(MARK_REPLY);
      node.removeAttribute(MARK_REPLY_MENU);
      node.removeAttribute(MARK_NATIVE_MENU_HOOK);
      node.removeAttribute(MARK_NATIVE_MENU_POPOUT);
      node.removeAttribute(MARK_NATIVE_REPLY_ITEM);
      node.removeAttribute(MARK_REPLY_META);
      node.removeAttribute(MARK_DATE_WRAP);
    });

    document.querySelectorAll(`[${MARK_REPLY_MENU}]`).forEach((node) => node.remove());
    document.querySelectorAll(`[${MARK_NATIVE_REPLY_ITEM}]`).forEach((node) => node.remove());
    document.getElementById(PANEL_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();
    [
      "data-cudloun-post-tweaks-enabled",
      "data-cudloun-post-tweaks-avatar-inline",
      "data-cudloun-post-tweaks-divider",
      "data-cudloun-post-tweaks-background",
      "data-cudloun-post-tweaks-reply-placement",
      "data-cudloun-post-tweaks-reply-meta-header",
      "data-cudloun-post-tweaks-native-menu-popout",
    ].forEach((name) => document.documentElement.removeAttribute(name));
    console.log("[cudloun-container] post tweaks stopped");
  }

  function scan() {
    document.querySelectorAll(".content-item.board-post").forEach((post) => {
      markPost(post);
      arrangePost(post);
    });
  }

  function markPost(post) {
    const avatar = post.querySelector(".avatar-container");
    if (!avatar) return;

    const row = avatar.parentElement;
    const content = avatar.nextElementSibling;
    if (!row || !content) return;

    const header = content.firstElementChild;
    const body = Array.from(content.children).find((child) => child !== header && child.textContent.trim());
    const actions =
      post.querySelector(`[${MARK_ACTIONS}]`) ||
      Array.from(post.children).find((child) => child.querySelector(".reply-button"));
    const reply = post.querySelector(`[${MARK_REPLY}]`) || actions?.querySelector(".reply-button");
    const replyMeta = post.querySelector(`[${MARK_REPLY_META}]`) || (actions ? findReplyMeta(actions) : null);
    const dateWrap = findDateWrap(header);

    post.setAttribute(MARK_POST, "true");
    row.setAttribute(MARK_ROW, "true");
    avatar.setAttribute(MARK_AVATAR, "true");
    content.setAttribute(MARK_CONTENT, "true");
    if (header) header.setAttribute(MARK_HEADER, "true");
    if (body) body.setAttribute(MARK_BODY, "true");
    if (actions) actions.setAttribute(MARK_ACTIONS, "true");
    if (reply) reply.setAttribute(MARK_REPLY, "true");
    if (replyMeta) replyMeta.setAttribute(MARK_REPLY_META, "true");
    if (dateWrap) dateWrap.setAttribute(MARK_DATE_WRAP, "true");
  }

  function findReplyMeta(actions) {
    return Array.from(actions.querySelectorAll("span")).find((node) => /^Re:\s*/.test(node.textContent.trim())) || null;
  }

  function findDateWrap(header) {
    if (!header) return null;
    return Array.from(header.children).find((child) => child.textContent.trim().match(/\d{1,2}\.\d{1,2}\.\d{4}/)) || null;
  }

  function arrangePost(post) {
    const header = post.querySelector(`[${MARK_HEADER}]`);
    const actions = post.querySelector(`[${MARK_ACTIONS}]`);
    const reply = post.querySelector(`[${MARK_REPLY}]`);
    const replyMeta = post.querySelector(`[${MARK_REPLY_META}]`);
    const dateWrap = post.querySelector(`[${MARK_DATE_WRAP}]`);
    if (!header || !actions) return;

    const state = getPostState(post, { reply, replyMeta });
    const key = `${settings.enabled}|${settings.replyPlacement}|${settings.replyMetaInHeader}`;
    if (state.appliedKey === key) return;

    restorePost(post);
    state.appliedKey = key;
    if (!settings.enabled) return;

    if (settings.replyPlacement === "header" && reply) {
      const wrap = ensureHeaderReplySlot(post, header);
      wrap.appendChild(reply);
    } else if (settings.replyPlacement === "menu" && reply) {
      const store = ensureReplyMenu(post, header);
      store.appendChild(reply);
    }

    if (settings.replyMetaInHeader && replyMeta && dateWrap) {
      dateWrap.appendChild(replyMeta);
    }

    updateActionsVisibility(actions, state);
  }

  function getPostState(post, nodes) {
    let state = postState.get(post);
    if (!state) {
      state = {};
      postState.set(post, state);
    }

    if (nodes.reply && !state.replyParent) {
      state.replyParent = nodes.reply.parentNode;
      state.replyNext = nodes.reply.nextSibling;
    }

    if (nodes.replyMeta && !state.replyMetaParent) {
      state.replyMetaParent = nodes.replyMeta.parentNode;
      state.replyMetaNext = nodes.replyMeta.nextSibling;
    }

    return state;
  }

  function restorePost(post) {
    const state = postState.get(post);
    if (!state) return;

    const reply = post.querySelector(`[${MARK_REPLY}]`);
    if (reply && state.replyParent && reply.parentNode !== state.replyParent) {
      state.replyParent.insertBefore(reply, state.replyNext && state.replyNext.parentNode === state.replyParent ? state.replyNext : null);
    }

    const replyMeta = post.querySelector(`[${MARK_REPLY_META}]`);
    if (replyMeta && state.replyMetaParent && replyMeta.parentNode !== state.replyMetaParent) {
      state.replyMetaParent.insertBefore(
        replyMeta,
        state.replyMetaNext && state.replyMetaNext.parentNode === state.replyMetaParent ? state.replyMetaNext : null,
      );
    }

    post.querySelectorAll(".cudloun-post-tweaks-header-reply").forEach((node) => node.remove());
    post.querySelectorAll(`[${MARK_REPLY_MENU}]`).forEach((node) => node.remove());
    document.querySelectorAll(`[${MARK_NATIVE_REPLY_ITEM}]`).forEach((node) => node.remove());
    updateActionsVisibility(post.querySelector(`[${MARK_ACTIONS}]`), state);
    state.appliedKey = "";
  }

  function ensureHeaderReplySlot(post, header) {
    let slot = post.querySelector(".cudloun-post-tweaks-header-reply");
    if (!slot) {
      slot = document.createElement("span");
      slot.className = "cudloun-post-tweaks-header-reply";
      header.appendChild(slot);
    }
    return slot;
  }

  function ensureReplyMenu(post, header) {
    let store = post.querySelector(`[${MARK_REPLY_MENU}]`);
    if (!store) {
      store = document.createElement("span");
      store.className = "cudloun-post-tweaks-reply-store";
      store.setAttribute(MARK_REPLY_MENU, "true");
      post.appendChild(store);
    }

    const nativeMenu = findNativePostMenuButton(header);
    if (nativeMenu && nativeMenu.getAttribute(MARK_NATIVE_MENU_HOOK) !== "true") {
      nativeMenu.setAttribute(MARK_NATIVE_MENU_HOOK, "true");
      nativeMenu.addEventListener("click", () => {
        scheduleNativeMenuTweaks(post, nativeMenu);
      });
    }

    return store;
  }

  function findNativePostMenuButton(header) {
    if (!header) return null;
    return Array.from(header.querySelectorAll('button[aria-label="menu"]')).find(
      (button) => !button.closest(`[${MARK_REPLY_MENU}]`),
    ) || null;
  }

  function scheduleNativeMenuTweaks(post, button) {
    const rect = button.getBoundingClientRect();
    const anchor = {
      top: Math.round(rect.bottom + 4),
      right: Math.max(8, Math.round(window.innerWidth - rect.right)),
    };

    [0, 40, 120, 260].forEach((delay) => {
      window.setTimeout(() => tweakNativePostMenu(post, anchor), delay);
    });
  }

  function tweakNativePostMenu(post, anchor) {
    const menu = findOpenPostMenu();
    if (!menu) return;

    applyNativeMenuPopout(menu, anchor);
    injectNativeReplyItem(post, menu);
  }

  function injectNativeReplyItem(post, menu) {
    const reply = post.querySelector(`[${MARK_REPLY}]`);
    if (!reply) return;

    document.querySelectorAll(`[${MARK_NATIVE_REPLY_ITEM}]`).forEach((node) => {
      if (!menu.contains(node)) node.remove();
    });
    if (menu.querySelector(`[${MARK_NATIVE_REPLY_ITEM}]`)) return;

    const template = menu.querySelector('li[role="menuitem"]');
    if (!template) return;
    const itemParent = template.parentElement || menu;

    const item = document.createElement("li");
    item.className = template.className;
    item.setAttribute("role", "menuitem");
    item.setAttribute("tabindex", "-1");
    item.setAttribute(MARK_NATIVE_REPLY_ITEM, "true");
    item.innerHTML = `
      <div class="${template.querySelector(".MuiListItemIcon-root")?.className || "MuiListItemIcon-root"}">
        <svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeSmall" focusable="false" aria-hidden="true" viewBox="0 0 24 24">
          <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-.9-5-4-10-11-11z"></path>
        </svg>
      </div>
      <div class="${template.querySelector(".MuiListItemText-root")?.className || "MuiListItemText-root"}">
        <span class="${template.querySelector(".MuiListItemText-primary")?.className || "MuiTypography-root MuiTypography-body1 MuiListItemText-primary"}">ODPOVĚDĚT</span>
      </div>
    `;
    item.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      reply.click();
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });

    const divider = Array.from(itemParent.children).find((child) => child.tagName === "HR");
    itemParent.insertBefore(item, divider || template.nextSibling);
  }

  function applyNativeMenuPopout(menu, anchor) {
    if (!settings.nativeMenuPopout) return;

    document.querySelectorAll(`[${MARK_NATIVE_MENU_POPOUT}]`).forEach(clearNativeMenuPopout);

    const surface = findMenuPopoutSurface(menu);
    surface.setAttribute(MARK_NATIVE_MENU_POPOUT, "true");
    surface.style.setProperty("--cudloun-post-tweaks-menu-top", `${anchor.top}px`);
    surface.style.setProperty("--cudloun-post-tweaks-menu-right", `${anchor.right}px`);
    surface.style.setProperty("position", "fixed", "important");
    surface.style.setProperty("top", `${anchor.top}px`, "important");
    surface.style.setProperty("right", `${anchor.right}px`, "important");
    surface.style.setProperty("bottom", "auto", "important");
    surface.style.setProperty("left", "auto", "important");
    surface.style.setProperty("width", "max-content", "important");
    surface.style.setProperty("min-width", "196px", "important");
    surface.style.setProperty("max-width", "calc(100vw - 16px)", "important");
    surface.style.setProperty("max-height", `calc(100vh - ${anchor.top}px - 8px)`, "important");
    surface.style.setProperty("margin", "0", "important");
    surface.style.setProperty("transform", "none", "important");
    surface.style.setProperty("overflow", "auto", "important");
    surface.style.setProperty("border-radius", "8px", "important");
    surface.style.setProperty("visibility", "visible", "important");
    surface.style.setProperty("pointer-events", "auto", "important");
  }

  function handleNativePopoutOutside(event) {
    if (!settings.nativeMenuPopout) return;

    const surface = document.querySelector(`[${MARK_NATIVE_MENU_POPOUT}]`);
    if (!surface) return;
    if (surface.contains(event.target)) return;
    if (event.target instanceof Element && event.target.closest(`[${MARK_NATIVE_MENU_HOOK}]`)) return;

    const modal = surface.closest('[role="presentation"]');
    const backdrop = modal?.querySelector(".MuiBackdrop-root");
    if (backdrop instanceof HTMLElement) {
      backdrop.click();
    }
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    window.setTimeout(() => {
      clearNativeMenuPopout(surface);
      document.querySelectorAll(`[${MARK_NATIVE_REPLY_ITEM}]`).forEach((node) => node.remove());
    }, 80);
  }

  function clearNativeMenuPopout(node) {
    node.removeAttribute(MARK_NATIVE_MENU_POPOUT);
    [
      "--cudloun-post-tweaks-menu-top",
      "--cudloun-post-tweaks-menu-right",
      "position",
      "top",
      "right",
      "bottom",
      "left",
      "width",
      "min-width",
      "max-width",
      "max-height",
      "margin",
      "transform",
      "overflow",
      "border-radius",
      "visibility",
      "pointer-events",
    ].forEach((name) => node.style.removeProperty(name));
  }

  function findMenuPopoutSurface(menu) {
    const candidates = [menu, ...Array.from(menu.querySelectorAll("*"))]
      .filter((node) => node instanceof HTMLElement)
      .filter((node) => {
        const text = node.textContent || "";
        if (!text.includes("Označit jako nejstarší nový") && !text.includes("Smazat příspěvek")) return false;
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && node.querySelector('li[role="menuitem"]');
      })
      .map((node) => ({ node, area: node.getBoundingClientRect().width * node.getBoundingClientRect().height }))
      .sort((a, b) => a.area - b.area);

    const content = candidates[0]?.node || menu;
    return content.closest('[role="dialog"]') || content;
  }

  function findOpenPostMenu() {
    return Array.from(document.querySelectorAll('[role="menu"], [role="dialog"], [role="presentation"]'))
      .map((menu) => {
        const rect = menu.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return null;
        const text = menu.textContent || "";
        const isPostMenu = text.includes("Označit jako nejstarší nový") || text.includes("Smazat příspěvek");
        if (!isPostMenu || !menu.querySelector('li[role="menuitem"]')) return null;
        return { menu, area: rect.width * rect.height };
      })
      .filter(Boolean)
      .sort((a, b) => a.area - b.area)
      .map((entry) => entry.menu)[0] || null;
  }

  function updateActionsVisibility(actions, state) {
    if (!actions || !state) return;
    const hasLocalReply = !!actions.querySelector(`[${MARK_REPLY}]`);
    const hasLocalMeta = !!actions.querySelector(`[${MARK_REPLY_META}]`);
    actions.toggleAttribute("data-cudloun-post-tweaks-empty", !hasLocalReply && !hasLocalMeta);
  }

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${PANEL_ID} {
        position: fixed;
        right: 10px;
        bottom: 10px;
        z-index: 1800;
        width: min(330px, calc(100vw - 20px));
        border: 1px solid rgba(79,102,134,.28);
        border-radius: 8px;
        background: #fff;
        color: #182230;
        box-shadow: 0 12px 34px rgba(18,27,43,.24);
        font: 13px/1.35 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      #${PANEL_ID} details {
        padding: 8px 10px 10px;
      }

      #${PANEL_ID} summary {
        cursor: pointer;
        font-weight: 750;
        letter-spacing: 0;
      }

      #${PANEL_ID} label {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 8px;
        align-items: center;
        margin-top: 9px;
      }

      #${PANEL_ID} input[type="range"] {
        grid-column: 1 / -1;
        width: 100%;
      }

      #${PANEL_ID} select,
      #${PANEL_ID} input[type="color"] {
        min-width: 112px;
        border: 1px solid rgba(79,102,134,.26);
        border-radius: 6px;
        background: #fff;
        color: #243041;
        font: inherit;
        padding: 4px 6px;
      }

      #${PANEL_ID} input[type="color"] {
        width: 112px;
        height: 30px;
        padding: 2px;
      }

      #${PANEL_ID} .cudloun-post-tweaks-actions {
        display: flex;
        gap: 8px;
        margin-top: 10px;
      }

      #${PANEL_ID} button {
        appearance: none;
        border: 1px solid rgba(79,102,134,.26);
        border-radius: 6px;
        background: #f8fafc;
        color: #243041;
        cursor: pointer;
        font: 700 12px/1.2 inherit;
        padding: 7px 9px;
      }

      .cudloun-post-tweaks-reply-store {
        display: none !important;
      }

      html[data-cudloun-post-tweaks-native-menu-popout="true"] [${MARK_NATIVE_MENU_POPOUT}] {
        position: fixed !important;
        top: var(--cudloun-post-tweaks-menu-top, 48px) !important;
        right: var(--cudloun-post-tweaks-menu-right, 8px) !important;
        bottom: auto !important;
        left: auto !important;
        width: max-content !important;
        min-width: 196px !important;
        max-width: calc(100vw - 16px) !important;
        max-height: calc(100vh - var(--cudloun-post-tweaks-menu-top, 48px) - 8px) !important;
        margin: 0 !important;
        transform: none !important;
        overflow: auto !important;
        border-radius: 8px !important;
        box-shadow: 0 10px 28px rgba(18,27,43,.24) !important;
      }

      @media (max-width: 700px) {
        html[data-cudloun-post-tweaks-enabled="true"] [${MARK_POST}] {
          box-sizing: border-box !important;
          width: calc(100% - var(--cudloun-post-tweaks-card-inset, 0px) - var(--cudloun-post-tweaks-card-inset, 0px)) !important;
          max-width: calc(100% - var(--cudloun-post-tweaks-card-inset, 0px) - var(--cudloun-post-tweaks-card-inset, 0px)) !important;
          margin-left: auto !important;
          margin-right: auto !important;
          padding-left: var(--cudloun-post-tweaks-side-padding, 4px) !important;
          padding-right: var(--cudloun-post-tweaks-side-padding, 4px) !important;
          padding-bottom: var(--cudloun-post-tweaks-side-padding, 4px) !important;
          margin-bottom: var(--cudloun-post-tweaks-post-spacing, 4px) !important;
          font-size: calc(var(--cudloun-post-tweaks-font-scale, 100) * 1%) !important;
        }

        html[data-cudloun-post-tweaks-enabled="true"][data-cudloun-post-tweaks-divider="true"] [${MARK_POST}] {
          border-bottom: 1px solid rgba(79,102,134,.32) !important;
          box-shadow: inset 0 -1px 0 rgba(79,102,134,.32) !important;
        }

        html[data-cudloun-post-tweaks-enabled="true"][data-cudloun-post-tweaks-background="true"] [${MARK_POST}] {
          background: var(--cudloun-post-tweaks-background-color, #fff) !important;
        }

        html[data-cudloun-post-tweaks-enabled="true"] [${MARK_ROW}] {
          display: flex !important;
          flex-direction: column !important;
          align-items: stretch !important;
          gap: 2px !important;
        }

        html[data-cudloun-post-tweaks-enabled="true"][data-cudloun-post-tweaks-avatar-inline="true"] [${MARK_ROW}] {
          display: grid !important;
          grid-template-columns: var(--cudloun-post-tweaks-avatar-size, 28px) minmax(0, 1fr) !important;
          column-gap: 6px !important;
          row-gap: 2px !important;
          align-items: start !important;
        }

        html[data-cudloun-post-tweaks-enabled="true"] [${MARK_AVATAR}] {
          width: var(--cudloun-post-tweaks-avatar-size, 28px) !important;
          height: var(--cudloun-post-tweaks-avatar-size, 28px) !important;
          min-width: 0 !important;
          align-self: flex-start !important;
          margin: 0 0 -2px 0 !important;
        }

        html[data-cudloun-post-tweaks-enabled="true"][data-cudloun-post-tweaks-avatar-inline="true"] [${MARK_AVATAR}] {
          grid-column: 1 !important;
          grid-row: 1 !important;
          margin: 0 !important;
        }

        html[data-cudloun-post-tweaks-enabled="true"] [${MARK_AVATAR}] .content-avatar,
        html[data-cudloun-post-tweaks-enabled="true"] [${MARK_AVATAR}] .MuiAvatar-root {
          width: var(--cudloun-post-tweaks-avatar-size, 28px) !important;
          height: var(--cudloun-post-tweaks-avatar-size, 28px) !important;
          font-size: calc(var(--cudloun-post-tweaks-avatar-size, 28px) * .42) !important;
        }

        html[data-cudloun-post-tweaks-enabled="true"] [${MARK_CONTENT}] {
          box-sizing: border-box !important;
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          margin-left: 0 !important;
        }

        html[data-cudloun-post-tweaks-enabled="true"] [${MARK_CONTENT}] > * {
          box-sizing: border-box !important;
          width: 100% !important;
          max-width: 100% !important;
        }

        html[data-cudloun-post-tweaks-enabled="true"][data-cudloun-post-tweaks-avatar-inline="true"] [${MARK_CONTENT}] {
          display: contents !important;
        }

        html[data-cudloun-post-tweaks-enabled="true"] [${MARK_HEADER}] {
          position: relative !important;
          width: 100% !important;
          min-width: 0 !important;
          display: flex !important;
          flex-wrap: wrap !important;
          align-items: baseline !important;
          column-gap: 6px !important;
          row-gap: 0 !important;
          min-height: 0 !important;
          height: auto !important;
          font-size: calc(var(--cudloun-post-tweaks-header-scale, 88) * 1%) !important;
          line-height: 1.18 !important;
          overflow-wrap: anywhere !important;
        }

        html[data-cudloun-post-tweaks-enabled="true"][data-cudloun-post-tweaks-avatar-inline="true"] [${MARK_HEADER}] {
          grid-column: 2 !important;
          grid-row: 1 !important;
          align-self: center !important;
        }

        html[data-cudloun-post-tweaks-enabled="true"] [${MARK_HEADER}] * {
          max-width: 100% !important;
          min-width: 0 !important;
          line-height: 1.18 !important;
          overflow-wrap: anywhere !important;
          white-space: normal !important;
        }

        html[data-cudloun-post-tweaks-enabled="true"] [${MARK_DATE_WRAP}] {
          display: inline-flex !important;
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 1px !important;
          min-width: 0 !important;
          max-width: calc(100% - 34px) !important;
        }

        html[data-cudloun-post-tweaks-enabled="true"] [${MARK_REPLY_META}] {
          display: inline-block !important;
          max-width: 100% !important;
          color: rgba(54,65,82,.8) !important;
          font-size: .82em !important;
          line-height: 1.14 !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
        }

        html[data-cudloun-post-tweaks-enabled="true"] [${MARK_REPLY_META}] a {
          color: inherit !important;
        }

        html[data-cudloun-post-tweaks-enabled="true"] [${MARK_BODY}] {
          width: 100% !important;
          max-width: 100% !important;
          margin-left: 0 !important;
          padding-left: 0 !important;
          font-size: calc(var(--cudloun-post-tweaks-font-scale, 100) * 1%) !important;
          line-height: 1.5 !important;
          overflow-wrap: anywhere !important;
        }

        html[data-cudloun-post-tweaks-enabled="true"] [${MARK_BODY}] * {
          font-size: inherit !important;
          line-height: inherit !important;
        }

        html[data-cudloun-post-tweaks-enabled="true"][data-cudloun-post-tweaks-avatar-inline="true"] [${MARK_BODY}] {
          grid-column: 1 / -1 !important;
          grid-row: 2 !important;
        }

        html[data-cudloun-post-tweaks-enabled="true"][data-cudloun-post-tweaks-avatar-inline="true"] [${MARK_CONTENT}] > :not([${MARK_HEADER}]) {
          grid-column: 1 / -1 !important;
          min-width: 0 !important;
          max-width: 100% !important;
        }

        html[data-cudloun-post-tweaks-enabled="true"] [${MARK_CONTENT}] img {
          max-width: 100% !important;
          height: auto !important;
        }

        html[data-cudloun-post-tweaks-enabled="true"] .cudloun-post-tweaks-header-reply {
          position: absolute !important;
          right: 28px !important;
          top: 0 !important;
          display: inline-flex !important;
          align-items: center !important;
          margin-left: 0 !important;
        }

        html[data-cudloun-post-tweaks-enabled="true"] .cudloun-post-tweaks-header-reply [${MARK_REPLY}] {
          min-width: 0 !important;
          padding: 2px 6px !important;
          font-size: .82em !important;
          line-height: 1.1 !important;
        }

        html[data-cudloun-post-tweaks-enabled="true"] [${MARK_ACTIONS}] {
          width: 100% !important;
          max-width: 100% !important;
          margin-left: 0 !important;
          padding-left: 0 !important;
          font-size: calc(var(--cudloun-post-tweaks-font-scale, 100) * 1%) !important;
        }

        html[data-cudloun-post-tweaks-enabled="true"] [${MARK_ACTIONS}][data-cudloun-post-tweaks-empty] {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function installPanel() {
    if (document.getElementById(PANEL_ID)) return;

    const panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.innerHTML = `
      <details open>
        <summary>Post Tweaks</summary>
        <label>
          <span>Compact posts</span>
          <input data-setting="enabled" type="checkbox">
        </label>
        <label>
          <span>Avatar in header</span>
          <input data-setting="avatarInline" type="checkbox">
        </label>
        <label>
          <span>Reply button</span>
          <select data-setting="replyPlacement">
            <option value="bottom">Bottom</option>
            <option value="header">Header</option>
            <option value="menu">Header menu</option>
          </select>
        </label>
        <label>
          <span>Reply link in header</span>
          <input data-setting="replyMetaInHeader" type="checkbox">
        </label>
        <label>
          <span>Pop out post menu</span>
          <input data-setting="nativeMenuPopout" type="checkbox">
        </label>
        <label>
          <span>Dividing lines</span>
          <input data-setting="divider" type="checkbox">
        </label>
        <label>
          <span>Background</span>
          <input data-setting="background" type="checkbox">
        </label>
        <label>
          <span>Color preset</span>
          <select data-setting="backgroundColor">
            ${COLOR_OPTIONS.map((option) => `<option value="${option.value}">${option.label}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Custom color</span>
          <input data-setting="backgroundColor" type="color">
        </label>
        <label>
          <span>Avatar</span>
          <output data-output="avatarSize"></output>
          <input data-setting="avatarSize" type="range" min="18" max="40" step="1">
        </label>
        <label>
          <span>Card inset</span>
          <output data-output="cardInset"></output>
          <input data-setting="cardInset" type="range" min="0" max="36" step="1">
        </label>
        <label>
          <span>Side padding</span>
          <output data-output="sidePadding"></output>
          <input data-setting="sidePadding" type="range" min="0" max="16" step="1">
        </label>
        <label>
          <span>Space between posts</span>
          <output data-output="postSpacing"></output>
          <input data-setting="postSpacing" type="range" min="0" max="28" step="1">
        </label>
        <label>
          <span>Header size</span>
          <output data-output="headerScale"></output>
          <input data-setting="headerScale" type="range" min="72" max="105" step="1">
        </label>
        <label>
          <span>Font size</span>
          <output data-output="fontScale"></output>
          <input data-setting="fontScale" type="range" min="82" max="118" step="1">
        </label>
        <div class="cudloun-post-tweaks-actions">
          <button type="button" data-action="reset">Reset</button>
          <button type="button" data-action="hide">Hide</button>
        </div>
      </details>
    `;

    panel.querySelectorAll("[data-setting]").forEach((input) => {
      input.addEventListener("input", () => updateFromInput(input));
      input.addEventListener("change", () => updateFromInput(input));
    });

    function updateFromInput(input) {
      const name = input.dataset.setting;
      if (input.type === "checkbox") {
        settings[name] = input.checked;
      } else if (input.type === "range") {
        settings[name] = Number(input.value);
      } else {
        settings[name] = input.value;
      }

      if (name === "backgroundColor") {
        panel.querySelectorAll(`[data-setting="${name}"]`).forEach((other) => {
          if (other !== input) other.value = input.value;
        });
      }

      saveSettings();
      applySettings();
    }

    panel.querySelector("[data-action='reset']").addEventListener("click", () => {
      settings = { ...defaults };
      saveSettings();
      applySettings();
    });

    panel.querySelector("[data-action='hide']").addEventListener("click", () => {
      panel.remove();
    });

    document.body.appendChild(panel);
  }

  function applySettings() {
    const rootStyle = document.documentElement.style;
    document.documentElement.setAttribute("data-cudloun-post-tweaks-enabled", settings.enabled ? "true" : "false");
    document.documentElement.setAttribute("data-cudloun-post-tweaks-avatar-inline", settings.avatarInline ? "true" : "false");
    document.documentElement.setAttribute("data-cudloun-post-tweaks-divider", settings.divider ? "true" : "false");
    document.documentElement.setAttribute("data-cudloun-post-tweaks-background", settings.background ? "true" : "false");
    document.documentElement.setAttribute("data-cudloun-post-tweaks-reply-placement", settings.replyPlacement);
    document.documentElement.setAttribute("data-cudloun-post-tweaks-reply-meta-header", settings.replyMetaInHeader ? "true" : "false");
    document.documentElement.setAttribute("data-cudloun-post-tweaks-native-menu-popout", settings.nativeMenuPopout ? "true" : "false");
    rootStyle.setProperty("--cudloun-post-tweaks-avatar-size", `${settings.avatarSize}px`);
    rootStyle.setProperty("--cudloun-post-tweaks-card-inset", `${settings.cardInset}px`);
    rootStyle.setProperty("--cudloun-post-tweaks-side-padding", `${settings.sidePadding}px`);
    rootStyle.setProperty("--cudloun-post-tweaks-post-spacing", `${settings.postSpacing}px`);
    rootStyle.setProperty("--cudloun-post-tweaks-header-scale", String(settings.headerScale));
    rootStyle.setProperty("--cudloun-post-tweaks-font-scale", String(settings.fontScale));
    rootStyle.setProperty("--cudloun-post-tweaks-background-color", settings.backgroundColor);

    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;

    setInput(panel, "enabled", settings.enabled);
    setInput(panel, "avatarInline", settings.avatarInline);
    setInput(panel, "replyPlacement", settings.replyPlacement);
    setInput(panel, "replyMetaInHeader", settings.replyMetaInHeader);
    setInput(panel, "nativeMenuPopout", settings.nativeMenuPopout);
    setInput(panel, "divider", settings.divider);
    setInput(panel, "background", settings.background);
    setInput(panel, "backgroundColor", settings.backgroundColor);
    setInput(panel, "avatarSize", settings.avatarSize);
    setInput(panel, "cardInset", settings.cardInset);
    setInput(panel, "sidePadding", settings.sidePadding);
    setInput(panel, "postSpacing", settings.postSpacing);
    setInput(panel, "headerScale", settings.headerScale);
    setInput(panel, "fontScale", settings.fontScale);
    setOutput(panel, "avatarSize", `${settings.avatarSize}px`);
    setOutput(panel, "cardInset", `${settings.cardInset}px`);
    setOutput(panel, "sidePadding", `${settings.sidePadding}px`);
    setOutput(panel, "postSpacing", `${settings.postSpacing}px`);
    setOutput(panel, "headerScale", `${settings.headerScale}%`);
    setOutput(panel, "fontScale", `${settings.fontScale}%`);

    scan();
  }

  function setInput(panel, name, value) {
    panel.querySelectorAll(`[data-setting="${name}"]`).forEach((input) => {
      if (input.type === "checkbox") input.checked = !!value;
      else input.value = String(value);
    });
  }

  function setOutput(panel, name, value) {
    const output = panel.querySelector(`[data-output="${name}"]`);
    if (output) output.textContent = value;
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY) || "{}";
      return { ...defaults, ...JSON.parse(raw) };
    } catch (error) {
      return { ...defaults };
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn("[cudloun-container] post tweaks settings could not be saved", error);
    }
  }
})();
