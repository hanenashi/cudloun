// Cudloun Kapybara account menu and hub UI.
(function () {
  "use strict";

  const root = window.Cudloun;
  const MENU_ITEM_ATTR = "data-cudloun-menu-item";
  const FULLSCREEN_ITEM_ATTR = "data-cudloun-fullscreen-menu-item";
  const STYLE_ATTR = "data-cudloun-style";
  const BACKDROP_CLASS = "cudloun-backdrop";
  const RESTORE_FULLSCREEN_KEY = "cudloun.restoreFullscreenAfterRefresh";
  const RESTORE_FULLSCREEN_CLASS = "cudloun-restore-fullscreen";
  const HUB_POSITION_KEY = "cudloun.hubPosition";
  const HUB_COLLAPSED_KEY = "cudloun.hubCollapsed";

  let observer = null;
  let observerDebounceTimer = null;
  let routeTimer = null;
  let lastRoute = root.currentRoute();
  let hubPosition = null;
  let hubCollapsed = false;
  let hubSelectedId = null;

  root.ui = {
    start,
    openHub,
    closeHub,
    renderHub,
    refreshMenuItems,
    injectIntoKapybaraAvatarMenu,
  };

  function start() {
    installStyles();
    maybeShowRestoreFullscreenPrompt();
    observeAvatarMenu();
    observeRouteChanges();
    injectIntoKapybaraAvatarMenu();
    root.log.info("menu", "started", lastRoute);
  }

  function observeAvatarMenu() {
    if (observer) return;

    observer = new MutationObserver((mutations) => {
      const shouldRecheck = mutations.some((mutation) => mutation.addedNodes.length || mutation.type === "attributes");
      if (!shouldRecheck) return;

      window.clearTimeout(observerDebounceTimer);
      observerDebounceTimer = window.setTimeout(() => {
        injectIntoKapybaraAvatarMenu();
      }, 40);
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "aria-hidden"],
    });

    root.log.debug("menu", "avatar/menu observer attached");
  }

  function observeRouteChanges() {
    const check = () => {
      const route = root.currentRoute();
      if (route !== lastRoute) {
        lastRoute = route;
        root.log.info("router", "route changed", route);
        injectIntoKapybaraAvatarMenu();
      }
      routeTimer = window.setTimeout(check, 500);
    };

    routeTimer = window.setTimeout(check, 500);
  }

  function injectIntoKapybaraAvatarMenu() {
    if (!root.kapyguts?.isKapybara?.()) return;

    const menu = visibleKapybaraAvatarMenu();
    if (!menu) {
      root.log.trace("menu", "kapybara avatar menu not present");
      return;
    }

    if (menu.querySelector(`[${MENU_ITEM_ATTR}]`)) {
      root.log.trace("menu", "kapybara avatar menu items already present");
      return;
    }

    const anchor = kapybaraMenuAnchor(menu);
    const item = makeKapybaraMenuItem(anchor);
    item.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      dismissKapybaraMenu();
      openHub();
    });

    if (anchor) {
      anchor.before(item);
    } else {
      menu.appendChild(item);
    }

    if (showFullscreenControls()) {
      const controls = makeKapybaraActionRow();
      item.after(controls);
    }

    root.log.info("menu", "kapybara avatar menu items injected", menuDebug(menu));
  }

  function visibleKapybaraAvatarMenu() {
    const candidates = Array.from(document.querySelectorAll([
      "[role='dialog']",
      "[role='menu']",
      ".bottom-sheet",
      "[class*='sheet']",
      "[class*='drawer']",
      "[class*='menu']",
      "section",
      "nav",
      "aside",
      "div",
    ].join(",")))
      .filter(isUsableKapybaraMenuCandidate)
      .sort((a, b) => {
        const rectA = a.getBoundingClientRect();
        const rectB = b.getBoundingClientRect();
        return (rectA.width * rectA.height) - (rectB.width * rectB.height);
      });

    if (candidates.length > 1) {
      root.log.debug("menu", "candidate kapybara avatar menus", candidates.slice(0, 8).map(menuDebug));
    }

    return candidates[0] || null;
  }

  function isUsableKapybaraMenuCandidate(node) {
    if (!(node instanceof Element)) return false;
    if (node.closest(`.${BACKDROP_CLASS}`)) return false;
    if (node.querySelector(`[${MENU_ITEM_ATTR}]`)) return false;

    const rect = node.getBoundingClientRect();
    if (rect.width < 220 || rect.height < 120) return false;
    if (rect.bottom <= 0 || rect.top >= window.innerHeight) return false;

    const style = window.getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;

    const text = normalizeMenuText(node.textContent);
    if (!text.includes("Nastavení") || !text.includes("Odhlásit")) return false;
    if (text.length > 260) return false;

    return true;
  }

  function kapybaraMenuAnchor(menu) {
    const rows = Array.from(menu.querySelectorAll("button, a, [role='button'], li, div, span"))
      .filter((node) => {
        if (!(node instanceof Element)) return false;
        const rect = node.getBoundingClientRect();
        if (rect.width < 80 || rect.height < 24) return false;
        if (rect.bottom <= 0 || rect.top >= window.innerHeight) return false;
        const text = normalizeMenuText(node.textContent);
        return text === "Nastavení" || text === "Odhlásit se" || text === "Odhlásit";
      })
      .sort((a, b) => {
        const rectA = a.getBoundingClientRect();
        const rectB = b.getBoundingClientRect();
        return (rectA.width * rectA.height) - (rectB.width * rectB.height);
      });

    return rows[0] || null;
  }

  function makeKapybaraMenuItem(anchor) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = `${anchor?.className || ""} cudloun-kapybara-menu-item`.trim();
    item.setAttribute(MENU_ITEM_ATTR, "true");
    item.innerHTML = `${menuIconSvg()}<span>Cudloun</span>`;
    return item;
  }

  function makeKapybaraActionRow() {
    const row = document.createElement("div");
    row.className = "cudloun-kapybara-action-row";
    row.setAttribute(FULLSCREEN_ITEM_ATTR, "true");
    row.appendChild(makeMenuActionButton("Full", fullscreenIconSvg(), (event) => {
      dismissKapybaraMenu();
      toggleFullscreen(event);
    }, "Fullscreen"));
    row.appendChild(makeMenuActionButton("Refresh", refreshPageIconSvg(), (event) => {
      dismissKapybaraMenu();
      refreshPage(event);
    }));
    return row;
  }

  function makeMenuActionButton(labelText, iconSvg, handler, ariaLabel = labelText) {
    const button = document.createElement("button");
    button.className = "cudloun-menu-action-button";
    button.type = "button";
    button.setAttribute("aria-label", ariaLabel);
    button.title = ariaLabel;
    button.innerHTML = `${iconSvg}<span>${labelText}</span>`;
    button.addEventListener("click", handler);
    return button;
  }

  async function toggleFullscreen(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    dismissKapybaraMenu();

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        root.log.info("fullscreen", "exited");
        return;
      }

      await document.documentElement.requestFullscreen();
      root.log.info("fullscreen", "entered");
    } catch (error) {
      root.log.warn("fullscreen", "toggle failed", error);
    }
  }

  function refreshPage(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    dismissKapybaraMenu();
    if (document.fullscreenElement) {
      root.storage.set(RESTORE_FULLSCREEN_KEY, true);
    }
    root.log.info("menu", "refresh requested");
    window.location.reload();
  }

  function showFullscreenControls() {
    return root.storage.get("module.settoun.showFullscreen", true) !== false;
  }

  function refreshMenuItems() {
    document.querySelectorAll(`[${MENU_ITEM_ATTR}], [${FULLSCREEN_ITEM_ATTR}]`)
      .forEach((item) => item.remove());
    injectIntoKapybaraAvatarMenu();
  }

  function maybeShowRestoreFullscreenPrompt() {
    if (root.storage.get(RESTORE_FULLSCREEN_KEY, false) !== true) return;
    root.storage.set(RESTORE_FULLSCREEN_KEY, false);
    if (document.fullscreenElement) return;

    window.setTimeout(() => {
      if (document.fullscreenElement || document.querySelector(`.${RESTORE_FULLSCREEN_CLASS}`)) return;

      const prompt = document.createElement("div");
      prompt.className = RESTORE_FULLSCREEN_CLASS;

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Restore fullscreen";
      button.addEventListener("click", async () => {
        try {
          await document.documentElement.requestFullscreen();
          root.log.info("fullscreen", "restored after refresh");
        } catch (error) {
          root.log.warn("fullscreen", "restore failed", error);
        } finally {
          prompt.remove();
        }
      });

      const dismiss = document.createElement("button");
      dismiss.type = "button";
      dismiss.setAttribute("aria-label", "Dismiss");
      dismiss.textContent = "x";
      dismiss.addEventListener("click", () => prompt.remove());

      prompt.appendChild(button);
      prompt.appendChild(dismiss);
      document.body.appendChild(prompt);
    }, 600);
  }

  function menuIconSvg() {
    return `
      <svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeSmall css-vh810p"
           focusable="false"
           aria-hidden="true"
           viewBox="0 0 24 24">
        <path d="M12 3c4.97 0 9 3.36 9 7.5 0 2.08-1.02 3.96-2.67 5.32L19 21l-4.63-2.32c-.76.21-1.56.32-2.37.32-4.97 0-9-3.36-9-7.5S7.03 3 12 3m-4 8h2V9H8zm3 0h2V9h-2zm3 0h2V9h-2z"></path>
      </svg>
    `;
  }

  function fullscreenIconSvg() {
    return `
      <svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeSmall css-vh810p"
           focusable="false"
           aria-hidden="true"
           viewBox="0 0 24 24">
        <path d="M5 5h6v2H7v4H5zm8 0h6v6h-2V7h-4zm4 8h2v6h-6v-2h4zm-12 0h2v4h4v2H5z"></path>
      </svg>
    `;
  }

  function refreshPageIconSvg() {
    return `
      <svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeSmall css-vh810p"
           focusable="false"
           aria-hidden="true"
           viewBox="0 0 24 24">
        <path d="M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.45 5.05h-2.13A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h8V3z"></path>
      </svg>
    `;
  }

  function menuDebug(menu) {
    const rect = menu.getBoundingClientRect();
    return {
      text: menu.textContent.trim().replace(/\s+/g, " ").slice(0, 120),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      className: menu.className,
    };
  }

  function openHub(eventOrModuleId) {
    let selectedModuleId = null;
    if (typeof eventOrModuleId === "string") {
      selectedModuleId = eventOrModuleId;
    } else if (eventOrModuleId) {
      eventOrModuleId.preventDefault();
      eventOrModuleId.stopPropagation();
      dismissKapybaraMenu();
    }

    document.querySelector(`.${BACKDROP_CLASS}`)?.remove();
    hubPosition = validHubPosition(root.storage.get(HUB_POSITION_KEY, null));
    hubCollapsed = root.storage.get(HUB_COLLAPSED_KEY, false) === true;

    const backdrop = document.createElement("div");
    backdrop.className = BACKDROP_CLASS;
    backdrop.addEventListener("click", (clickEvent) => {
      if (clickEvent.target === backdrop) closeHub();
    });

    document.body.appendChild(backdrop);
    root.log.info("hub", "opened");
    renderHub(selectedModuleId);
  }

  function closeHub() {
    document.querySelector(`.${BACKDROP_CLASS}`)?.remove();
    root.log.info("hub", "closed");
  }

  function dismissKapybaraMenu() {
    document.dispatchEvent(new KeyboardEvent("keydown", {
      key: "Escape",
      code: "Escape",
      keyCode: 27,
      which: 27,
      bubbles: true,
      cancelable: true,
    }));
  }

  function normalizeMenuText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function renderHub(selectedId) {
    const backdrop = document.querySelector(`.${BACKDROP_CLASS}`);
    if (!backdrop) return;

    const selectedModule = root.modules.find((module) => module.id === selectedId) || root.modules[0];
    const mode = selectedId === "debug" ? "debug" : "module";
    hubSelectedId = mode === "debug" ? "debug" : selectedModule?.id;
    backdrop.innerHTML = "";

    const dialog = document.createElement("section");
    dialog.className = "cudloun-dialog";
    if (hubCollapsed) dialog.dataset.collapsed = "true";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "cudloun-title");
    dialog.appendChild(renderMascot());
    dialog.appendChild(renderHeader());
    if (!hubCollapsed) dialog.appendChild(renderBody(mode, selectedModule));
    backdrop.appendChild(dialog);
    applyHubPosition(dialog);
  }

  function renderMascot() {
    const mascot = document.createElement("img");
    mascot.className = "cudloun-mascot";
    mascot.alt = "";
    mascot.decoding = "async";
    mascot.loading = "lazy";
    mascot.src = `${root.repoUrl}cudloun.png`;
    return mascot;
  }

  function renderHeader() {
    const header = document.createElement("div");
    header.className = "cudloun-head";
    header.addEventListener("pointerdown", startHubDrag);

    const titleWrap = document.createElement("div");
    titleWrap.className = "cudloun-title-wrap";
    const title = document.createElement("div");
    title.id = "cudloun-title";
    title.className = "cudloun-title";
    title.textContent = "Cudloun";

    const subtitle = document.createElement("div");
    subtitle.className = "cudloun-subtitle";
    subtitle.textContent = `Kapybara module hub core ${root.coreVersion} / seed ${root.seedVersion} / manifest ${root.manifestVersion}`;

    titleWrap.appendChild(title);
    titleWrap.appendChild(subtitle);

    const buttons = document.createElement("div");
    buttons.className = "cudloun-head-actions";

    const collapse = document.createElement("button");
    collapse.className = "cudloun-icon-button";
    collapse.type = "button";
    collapse.setAttribute("aria-label", hubCollapsed ? "Expand" : "Collapse");
    collapse.textContent = hubCollapsed ? "+" : "-";
    collapse.addEventListener("click", () => {
      hubCollapsed = !hubCollapsed;
      root.storage.set(HUB_COLLAPSED_KEY, hubCollapsed);
      root.log.info("hub", hubCollapsed ? "collapsed" : "expanded");
      renderHub(hubSelectedId);
    });

    const close = document.createElement("button");
    close.className = "cudloun-icon-button";
    close.type = "button";
    close.setAttribute("aria-label", "Close");
    close.textContent = "x";
    close.addEventListener("click", closeHub);

    header.appendChild(titleWrap);
    buttons.appendChild(collapse);
    buttons.appendChild(close);
    header.appendChild(buttons);
    return header;
  }

  function startHubDrag(event) {
    if (event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest("button,input,select,a,textarea")) return;

    const dialog = event.currentTarget.closest(".cudloun-dialog");
    if (!(dialog instanceof HTMLElement)) return;

    const rect = dialog.getBoundingClientRect();
    const origin = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };

    dialog.dataset.dragging = "true";
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();

    const onMove = (moveEvent) => {
      const next = clampHubPosition({
        left: origin.left + moveEvent.clientX - origin.pointerX,
        top: origin.top + moveEvent.clientY - origin.pointerY,
        width: origin.width,
        height: origin.height,
      });
      hubPosition = next;
      applyHubPosition(dialog);
    };

    const onEnd = () => {
      dialog.dataset.dragging = "false";
      if (hubPosition) root.storage.set(HUB_POSITION_KEY, hubPosition);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
  }

  function applyHubPosition(dialog) {
    if (!hubPosition) {
      dialog.style.removeProperty("--cudloun-hub-left");
      dialog.style.removeProperty("--cudloun-hub-top");
      dialog.dataset.dragged = "false";
      return;
    }

    const rect = dialog.getBoundingClientRect();
    const clamped = clampHubPosition({
      left: hubPosition.left,
      top: hubPosition.top,
      width: rect.width || 320,
      height: rect.height || 72,
    });
    hubPosition = clamped;
    dialog.style.setProperty("--cudloun-hub-left", `${Math.round(clamped.left)}px`);
    dialog.style.setProperty("--cudloun-hub-top", `${Math.round(clamped.top)}px`);
    dialog.dataset.dragged = "true";
  }

  function validHubPosition(value) {
    if (!value || typeof value !== "object") return null;
    if (!Number.isFinite(value.left) || !Number.isFinite(value.top)) return null;
    return {
      left: value.left,
      top: value.top,
    };
  }

  function clampHubPosition(position) {
    const margin = 8;
    const maxLeft = Math.max(margin, window.innerWidth - position.width - margin);
    const maxTop = Math.max(margin, window.innerHeight - position.height - margin);
    return {
      left: Math.min(Math.max(margin, position.left), maxLeft),
      top: Math.min(Math.max(margin, position.top), maxTop),
    };
  }

  function renderBody(mode, selectedModule) {
    const body = document.createElement("div");
    body.className = "cudloun-body";

    const list = document.createElement("div");
    list.className = "cudloun-module-list";
    root.modules.forEach((module) => {
      list.appendChild(renderModuleListItem(module, mode === "module" ? selectedModule?.id : null));
    });
    list.appendChild(renderDebugListItem(mode === "debug"));

    const details = document.createElement("div");
    details.className = "cudloun-module-details";
    details.appendChild(mode === "debug" ? renderDebugPanel() : renderModuleDetails(selectedModule));

    body.appendChild(list);
    body.appendChild(details);
    return body;
  }

  function renderModuleListItem(module, selectedModuleId) {
    const row = document.createElement("button");
    row.className = "cudloun-module-row";
    row.type = "button";
    row.dataset.selected = module.id === selectedModuleId ? "true" : "false";
    row.addEventListener("click", () => renderHub(module.id));

    const text = document.createElement("span");
    text.className = "cudloun-module-row-text";
    text.textContent = module.name;

    const enabled = document.createElement("input");
    enabled.type = "checkbox";
    enabled.checked = root.storage.isModuleEnabled(module.id);
    enabled.setAttribute("aria-label", `${module.name} enabled`);
    enabled.addEventListener("click", (event) => event.stopPropagation());
    enabled.addEventListener("change", () => {
      root.storage.setModuleEnabled(module.id, enabled.checked);
      renderHub(module.id);
    });

    row.appendChild(text);
    row.appendChild(enabled);
    return row;
  }

  function renderDebugListItem(selected) {
    const row = document.createElement("button");
    row.className = "cudloun-module-row";
    row.type = "button";
    row.dataset.selected = selected ? "true" : "false";
    row.addEventListener("click", () => renderHub("debug"));

    const text = document.createElement("span");
    text.className = "cudloun-module-row-text";
    text.textContent = "Debug";

    const badge = document.createElement("span");
    badge.className = "cudloun-debug-count";
    badge.textContent = String(root.log.entries.length);

    row.appendChild(text);
    row.appendChild(badge);
    return row;
  }

  function renderModuleDetails(module) {
    const panel = document.createElement("div");
    if (!module) {
      panel.textContent = "No modules registered yet.";
      return panel;
    }

    const eyebrow = document.createElement("div");
    eyebrow.className = "cudloun-eyebrow";
    eyebrow.textContent = `Module ${module.version}`;

    const title = document.createElement("h2");
    title.className = "cudloun-module-title";
    title.textContent = module.name;

    const description = document.createElement("p");
    description.className = "cudloun-module-copy";
    description.textContent = module.description || "";

    const enabled = document.createElement("label");
    enabled.className = "cudloun-toggle";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = root.storage.isModuleEnabled(module.id);
    checkbox.addEventListener("change", () => {
      root.storage.setModuleEnabled(module.id, checkbox.checked);
      renderHub(module.id);
    });
    enabled.appendChild(checkbox);
    enabled.appendChild(document.createTextNode("Enabled"));

    const actions = document.createElement("div");
    actions.className = "cudloun-actions";

    if (module.actionLabel && typeof module.action === "function") {
      const action = document.createElement("button");
      action.className = "cudloun-button";
      action.type = "button";
      action.disabled = !root.storage.isModuleEnabled(module.id);
      action.textContent = module.actionLabel;
      action.addEventListener("click", () => {
        root.log.info("module", "action", module.id, module.actionLabel);
        module.action(root.makeModuleContext(module));
      });
      actions.appendChild(action);
    }

    const help = document.createElement("div");
    help.className = "cudloun-help";
    const helpTitle = document.createElement("h3");
    helpTitle.textContent = "Help";
    help.appendChild(helpTitle);

    const helpLines = typeof module.renderHelp === "function" ? module.renderHelp(root.makeModuleContext(module)) : [];
    if (helpLines.length) {
      helpLines.forEach((line) => {
        const paragraph = document.createElement("p");
        paragraph.textContent = line;
        help.appendChild(paragraph);
      });
    } else {
      const paragraph = document.createElement("p");
      paragraph.textContent = "This module has no help page yet.";
      help.appendChild(paragraph);
    }

    panel.appendChild(eyebrow);
    panel.appendChild(title);
    panel.appendChild(description);
    panel.appendChild(enabled);
    panel.appendChild(actions);

    if (typeof module.renderSettings === "function") {
      const custom = module.renderSettings(root.makeModuleContext(module));
      if (custom) {
        panel.appendChild(custom);
      }
    }

    if (root.feedback && typeof root.feedback.renderThread === "function") {
      panel.appendChild(root.feedback.renderThread({
        kind: "module",
        id: module.id,
        name: module.name,
      }));
    }

    panel.appendChild(help);
    return panel;
  }

  function renderDebugPanel() {
    const panel = document.createElement("div");

    const eyebrow = document.createElement("div");
    eyebrow.className = "cudloun-eyebrow";
    eyebrow.textContent = `Route ${root.currentRoute()}`;

    const title = document.createElement("h2");
    title.className = "cudloun-module-title";
    title.textContent = "Debug";

    const controls = document.createElement("div");
    controls.className = "cudloun-actions";

    const select = document.createElement("select");
    select.className = "cudloun-select";
    root.logger.levels.forEach((level) => {
      const option = document.createElement("option");
      option.value = level;
      option.textContent = level;
      option.selected = root.log.level() === level;
      select.appendChild(option);
    });
    select.addEventListener("change", () => root.logger.setLevel(select.value));

    const clear = document.createElement("button");
    clear.className = "cudloun-button cudloun-button-secondary";
    clear.type = "button";
    clear.textContent = "Clear";
    clear.addEventListener("click", () => {
      root.logger.clear();
      renderHub("debug");
    });

    const copy = document.createElement("button");
    copy.className = "cudloun-button cudloun-button-secondary";
    copy.type = "button";
    copy.textContent = "Copy log";
    copy.addEventListener("click", () => {
      copyText(debugLogText()).then(() => {
        root.log.info("debug", "log copied");
        renderHub("debug");
      }).catch((error) => root.log.warn("debug", "copy failed", error));
    });

    const exportLog = document.createElement("button");
    exportLog.className = "cudloun-button cudloun-button-secondary";
    exportLog.type = "button";
    exportLog.textContent = "Export log";
    exportLog.addEventListener("click", () => {
      exportTextFile(`cudloun-debug-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`, debugLogText());
      root.log.info("debug", "log export prepared");
      renderHub("debug");
    });

    controls.appendChild(select);
    controls.appendChild(copy);
    controls.appendChild(exportLog);
    controls.appendChild(clear);

    const meta = document.createElement("div");
    meta.className = "cudloun-debug-meta";
    meta.textContent = [
      `Seed: ${root.seedVersion}`,
      `Core: ${root.coreVersion}`,
      `Manifest: ${root.manifestVersion}`,
      `Loaded files: ${root.loadedFiles.map((file) => file.id).join(", ") || "none"}`,
    ].join(" | ");

    const logBox = document.createElement("div");
    logBox.className = "cudloun-log-box";
    root.logger.recent(160).forEach((entry) => logBox.appendChild(renderLogEntry(entry)));

    panel.appendChild(eyebrow);
    panel.appendChild(title);
    panel.appendChild(controls);
    panel.appendChild(meta);
    panel.appendChild(logBox);
    return panel;
  }

  function renderLogEntry(entry) {
    const row = document.createElement("div");
    row.className = "cudloun-log-entry";
    row.dataset.level = entry.level;

    const time = entry.time.slice(11, 19);
    const args = entry.args.map((arg) => {
      if (arg instanceof Error) return arg.message;
      if (typeof arg === "string") return arg;
      try {
        return JSON.stringify(arg);
      } catch (error) {
        return String(arg);
      }
    }).join(" ");

    row.textContent = `${time} [${entry.level}] ${entry.area}: ${args}`;
    return row;
  }

  function debugLogText() {
    return root.logger.recent(500).map((entry) => {
      const args = entry.args.map((arg) => {
        if (arg instanceof Error) return arg.message;
        if (typeof arg === "string") return arg;
        try {
          return JSON.stringify(arg);
        } catch (error) {
          return String(arg);
        }
      }).join(" ");

      return `${entry.time} [${entry.level}] ${entry.area}: ${args}`;
    }).join("\n");
  }

  async function copyText(text) {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      throw new Error("Clipboard API is not available");
    }
    await navigator.clipboard.writeText(text);
  }

  function exportTextFile(filename, text) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function installStyles() {
    if (document.head.querySelector(`[${STYLE_ATTR}]`)) return;

    const style = document.createElement("style");
    style.setAttribute(STYLE_ATTR, "true");
    style.textContent = `
      .cudloun-backdrop{position:fixed;inset:0;z-index:1600;display:flex;align-items:center;justify-content:center;padding:42px 20px 20px;background:rgba(26,32,44,.34);backdrop-filter:blur(2px);box-sizing:border-box}
      .cudloun-dialog{position:relative;box-sizing:border-box;width:min(860px,calc(100vw - 28px));max-height:min(760px,calc(100vh - 62px));display:flex;flex-direction:column;overflow:visible;border:1px solid rgba(79,102,134,.34);border-radius:8px;background:#f6f8fb;box-shadow:0 18px 48px rgba(18,27,43,.24);color:#182230;font-family:inherit}
      .cudloun-dialog[data-dragged=true]{position:fixed;left:var(--cudloun-hub-left);top:var(--cudloun-hub-top);margin:0}
      .cudloun-dialog[data-collapsed=true]{width:min(430px,calc(100vw - 16px));overflow:hidden}
      .cudloun-mascot{position:absolute;left:-73px;top:0;width:100px;max-width:26vw;height:auto;transform:translateY(-48%);pointer-events:none;filter:drop-shadow(0 6px 5px rgba(18,27,43,.25));z-index:2}
      .cudloun-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 20px 14px;border-top-left-radius:8px;border-top-right-radius:8px;border-bottom:1px solid rgba(79,102,134,.2);background:#fff;cursor:grab;touch-action:none;user-select:none}
      .cudloun-dialog[data-dragging=true] .cudloun-head{cursor:grabbing}
      .cudloun-title-wrap{min-width:0}
      .cudloun-title{font-size:1.15rem;font-weight:750;letter-spacing:0}
      .cudloun-subtitle,.cudloun-eyebrow{margin-top:3px;color:#697586;font-size:.78rem;letter-spacing:0}
      .cudloun-head-actions{display:flex;align-items:center;gap:8px;flex:0 0 auto}
      .cudloun-icon-button{appearance:none;width:32px;height:32px;border:1px solid rgba(79,102,134,.2);border-radius:6px;background:#fff;color:#4b5565;cursor:pointer;font:700 1rem/1 inherit;flex:0 0 auto}
      .cudloun-icon-button:hover{background:#eef2f7}
      .cudloun-menu-action-button{appearance:none;min-width:0;flex:1 1 0;display:inline-flex;align-items:center;justify-content:center;gap:5px;border:1px solid rgba(79,102,134,.24);border-radius:6px;background:#f8fafc;color:#243041;cursor:pointer;font:600 .8rem/1.2 inherit;padding:7px 5px}
      .cudloun-menu-action-button:hover{background:#eef2f7}
      .cudloun-menu-action-button svg{width:18px;height:18px;flex:0 0 auto;fill:currentColor}
      .cudloun-menu-action-button span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .cudloun-kapybara-menu-item{appearance:none;width:100%;min-height:56px;display:flex;align-items:center;gap:24px;margin:0;padding:12px 40px;border:0;background:transparent;color:inherit;cursor:pointer;font:inherit;text-align:left}
      .cudloun-kapybara-menu-item:hover{background:rgba(128,128,128,.08)}
      .cudloun-kapybara-menu-item svg{width:24px;height:24px;flex:0 0 auto;fill:#b06a00;color:#b06a00}
      .cudloun-kapybara-menu-item span{font-size:1rem;line-height:1.35}
      .cudloun-kapybara-action-row{display:flex;align-items:center;gap:8px;padding:4px 40px 12px}
      .cudloun-restore-fullscreen{position:fixed;left:50%;top:14px;z-index:1900;display:flex;align-items:center;gap:8px;transform:translateX(-50%);padding:8px;border:1px solid rgba(79,102,134,.28);border-radius:8px;background:#fff;box-shadow:0 10px 28px rgba(18,27,43,.22);font-family:inherit}
      .cudloun-restore-fullscreen button{appearance:none;border:1px solid rgba(79,102,134,.24);border-radius:6px;background:#f8fafc;color:#243041;cursor:pointer;font:700 .86rem/1.2 inherit;padding:8px 10px}
      .cudloun-restore-fullscreen button:hover{background:#eef2f7}
      .cudloun-body{min-height:390px;display:grid;grid-template-columns:minmax(190px,250px) 1fr;overflow:hidden}
      .cudloun-module-list{overflow:auto;padding:12px;border-right:1px solid rgba(79,102,134,.18);background:#edf2f7}
      .cudloun-module-row{appearance:none;width:100%;min-height:42px;display:grid;grid-template-columns:1fr auto;align-items:center;gap:10px;margin:0 0 8px;padding:9px 10px;border:1px solid transparent;border-radius:6px;background:transparent;color:#243041;cursor:pointer;font:inherit;text-align:left}
      .cudloun-module-row[data-selected=true],.cudloun-module-row:hover{border-color:rgba(76,111,166,.24);background:#fff}
      .cudloun-module-row-text{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:650}
      .cudloun-debug-count{min-width:22px;padding:2px 6px;border-radius:999px;background:#d8e2ef;color:#364152;text-align:center;font-size:.76rem;font-weight:700}
      .cudloun-module-details{overflow:auto;padding:22px;background:#f8fafc}
      .cudloun-module-title{margin:8px 0;color:#182230;font-size:1.35rem;line-height:1.2;letter-spacing:0}
      .cudloun-module-copy{max-width:58ch;margin:0 0 16px;color:#4b5565;line-height:1.5}
      .cudloun-toggle{display:inline-flex;align-items:center;gap:8px;margin:0 0 18px;color:#364152;font-weight:650}
      .cudloun-actions{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 18px;align-items:center}
      .cudloun-button{appearance:none;border:1px solid rgba(8,126,164,.34);border-radius:6px;padding:9px 13px;background:#087ea4;color:#fff;cursor:pointer;font:700 .92rem/1.2 inherit}
      .cudloun-button:hover{background:#096f91}
      .cudloun-button:disabled{opacity:.48;cursor:default}
      .cudloun-button-secondary{background:#4b5565;border-color:rgba(75,85,101,.34)}
      .cudloun-button-secondary:hover{background:#364152}
      .cudloun-select{min-height:36px;border:1px solid rgba(79,102,134,.32);border-radius:6px;background:#fff;color:#182230;padding:0 10px;font:inherit}
      .cudloun-help{max-width:62ch;padding-top:14px;border-top:1px solid rgba(79,102,134,.18);color:#4b5565}
      .cudloun-help h3{margin:0 0 8px;color:#243041;font-size:.95rem;letter-spacing:0}
      .cudloun-help p{margin:0 0 8px;line-height:1.45}
      .cudloun-container-list{max-width:680px;margin:0 0 18px;display:flex;flex-direction:column;gap:10px}
      .cudloun-container-card{border:1px solid rgba(79,102,134,.22);border-radius:8px;background:#fff;padding:12px}
      .cudloun-container-card h3{margin:0 0 6px;color:#243041;font-size:1rem;letter-spacing:0}
      .cudloun-container-card p{margin:0 0 10px;color:#4b5565;line-height:1.4}
      .cudloun-container-actions{display:flex;flex-wrap:wrap;gap:8px}
      .cudloun-feedback{box-sizing:border-box;width:100%;max-width:680px;min-width:0;margin:18px 0 18px;padding:12px;border:1px solid rgba(79,102,134,.22);border-radius:8px;background:#fff;overflow:hidden}
      .cudloun-feedback-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 4px}
      .cudloun-feedback h3{margin:0;color:#243041;font-size:1rem;letter-spacing:0}
      .cudloun-feedback-meta{margin:0 0 10px;color:#697586;font-size:.78rem;line-height:1.3}
      .cudloun-feedback-refresh{appearance:none;border:1px solid rgba(79,102,134,.24);border-radius:6px;background:#f8fafc;color:#243041;cursor:pointer;font:700 .78rem/1.2 inherit;padding:6px 8px}
      .cudloun-feedback-refresh:hover{background:#eef2f7}
      .cudloun-feedback-messages{box-sizing:border-box;max-width:100%;max-height:260px;overflow:auto;margin:0 0 12px;border:1px solid rgba(79,102,134,.16);border-radius:6px;background:#f8fafc}
      .cudloun-feedback-empty{padding:12px;color:#697586}
      .cudloun-feedback-message{box-sizing:border-box;min-width:0;padding:10px 12px;border-bottom:1px solid rgba(79,102,134,.13);background:#fff}
      .cudloun-feedback-message:last-child{border-bottom:0}
      .cudloun-feedback-message[data-reply=true]{border-left:3px solid rgba(8,126,164,.28)}
      .cudloun-feedback-message[data-depth="1"]{margin-left:12px}
      .cudloun-feedback-message[data-depth="2"]{margin-left:24px}
      .cudloun-feedback-message[data-depth="3"]{margin-left:36px}
      .cudloun-feedback-message-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin:0 0 5px}
      .cudloun-feedback-message-head strong{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#243041;font-size:.88rem}
      .cudloun-feedback-message-head time{flex:0 0 auto;color:#697586;font-size:.74rem}
      .cudloun-feedback-parent{margin:0 0 5px;color:#697586;font-size:.76rem;line-height:1.25;overflow-wrap:anywhere}
      .cudloun-feedback-text{min-width:0;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;color:#364152;line-height:1.42}
      .cudloun-feedback-image-link{display:block;width:max-content;max-width:100%;margin:8px 0 2px}
      .cudloun-feedback-image{display:block;max-width:100%;max-height:280px;border-radius:6px;border:1px solid rgba(79,102,134,.18);object-fit:contain;background:#f8fafc}
      .cudloun-feedback-message-actions{display:flex;justify-content:flex-end;margin:7px 0 0}
      .cudloun-feedback-message-actions button,.cudloun-feedback-reply-target button{appearance:none;border:1px solid rgba(79,102,134,.22);border-radius:6px;background:#f8fafc;color:#243041;cursor:pointer;font:700 .74rem/1.2 inherit;padding:5px 7px}
      .cudloun-feedback-message-actions button:hover,.cudloun-feedback-reply-target button:hover{background:#eef2f7}
      .cudloun-feedback-message-actions button:disabled{opacity:.55;cursor:default}
      .cudloun-feedback-message-actions .cudloun-feedback-delete{border-color:rgba(180,35,24,.22);background:#fff5f4;color:#b42318}
      .cudloun-feedback-message-actions .cudloun-feedback-delete:hover{background:#ffe7e5}
      .cudloun-feedback-replies{margin:8px 0 0}
      .cudloun-feedback-form{display:grid;min-width:0;max-width:100%;gap:8px}
      .cudloun-feedback-reply-target{box-sizing:border-box;display:flex;align-items:flex-start;justify-content:space-between;gap:8px;min-width:0;max-width:100%;min-height:32px;padding:7px 8px;border:1px solid rgba(8,126,164,.22);border-radius:6px;background:#eef8fb;color:#364152;font-size:.8rem;overflow:hidden}
      .cudloun-feedback-reply-target[hidden]{display:none}
      .cudloun-feedback-reply-target span{min-width:0;overflow-wrap:anywhere;line-height:1.3}
      .cudloun-feedback-author,.cudloun-feedback textarea{box-sizing:border-box;width:100%;border:1px solid rgba(79,102,134,.28);border-radius:6px;background:#fff;color:#182230;font:inherit}
      .cudloun-feedback-author{min-height:36px;padding:0 10px}
      .cudloun-feedback textarea{display:block;max-width:100%;min-height:82px;resize:vertical;padding:9px 10px;line-height:1.38}
      .cudloun-feedback-actions{display:flex;align-items:center;justify-content:space-between;gap:10px}
      .cudloun-feedback-status{min-width:0;color:#697586;font-size:.82rem}
      .cudloun-settings-list{max-width:520px;margin:0 0 18px}
      .cudloun-setting-row{display:flex;align-items:center;justify-content:space-between;gap:14px;min-height:44px;padding:10px 12px;border:1px solid rgba(79,102,134,.22);border-radius:8px;background:#fff;color:#243041;font-weight:650}
      .cudloun-setting-text{min-width:0}
      .cudloun-code-box{max-width:680px;margin:8px 0 16px;padding:10px;border:1px solid rgba(79,102,134,.2);border-radius:6px;background:#101828;color:#e4e7ec;font:12px/1.45 Consolas,monospace;white-space:pre-wrap;word-break:break-word}
      .cudloun-debug-meta{margin:0 0 12px;color:#697586;font-size:.82rem;line-height:1.35}
      .cudloun-log-box{max-height:430px;overflow:auto;border:1px solid rgba(79,102,134,.2);border-radius:6px;background:#101828;color:#e4e7ec;font:12px/1.45 Consolas,monospace}
      .cudloun-log-entry{padding:5px 8px;border-bottom:1px solid rgba(255,255,255,.07);white-space:pre-wrap;word-break:break-word}
      .cudloun-log-entry[data-level=error]{color:#ffb4b4}
      .cudloun-log-entry[data-level=warn]{color:#ffd18a}
      .cudloun-log-entry[data-level=debug]{color:#9fd0ff}
      .cudloun-log-entry[data-level=trace]{color:#d8c4ff}
      @media (max-width:680px){.cudloun-backdrop{align-items:center;justify-content:center;padding:8px;background:rgba(26,32,44,.25)}.cudloun-dialog{width:calc(100vw - 16px);height:auto;max-height:calc(100dvh - 16px);border-radius:10px;overflow:hidden}.cudloun-dialog[data-collapsed=true]{width:min(390px,calc(100vw - 16px))}.cudloun-mascot{left:-36px;top:10px;width:58px;max-width:18vw;transform:none;opacity:.95}.cudloun-head{position:sticky;top:0;z-index:3;gap:10px;padding:12px 12px 10px 42px}.cudloun-title{font-size:1rem}.cudloun-subtitle{font-size:.68rem;line-height:1.25}.cudloun-body{min-height:0;max-height:calc(100dvh - 84px);display:flex;flex-direction:column;overflow:hidden}.cudloun-module-list{display:flex;gap:8px;min-height:56px;max-height:96px;overflow-x:auto;overflow-y:hidden;padding:8px;border-right:0;border-bottom:1px solid rgba(79,102,134,.18)}.cudloun-module-row{flex:0 0 auto;width:auto;min-width:118px;min-height:40px;margin:0;padding:8px 9px;background:#f8fafc;border-color:rgba(79,102,134,.16)}.cudloun-module-row-text{font-size:.84rem}.cudloun-module-details{flex:1;min-height:0;overflow:auto;padding:16px 12px 24px}.cudloun-module-title{font-size:1.18rem}.cudloun-container-card{padding:10px}.cudloun-container-actions{gap:7px}.cudloun-feedback{margin:14px 0;padding:10px}.cudloun-feedback-messages{max-height:220px}.cudloun-button{padding:8px 10px;font-size:.84rem}.cudloun-code-box{font-size:11px}.cudloun-log-box{max-height:52vh;font-size:11px}}
    `;
    document.head.appendChild(style);
  }
})();
