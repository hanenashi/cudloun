// Cudloun Babeta avatar menu and hub UI.
(function () {
  "use strict";

  const root = window.Cudloun;
  const MENU_ITEM_ATTR = "data-cudloun-menu-item";
  const STYLE_ATTR = "data-cudloun-style";
  const BACKDROP_CLASS = "cudloun-backdrop";

  let observer = null;
  let routeTimer = null;
  let lastRoute = root.currentRoute();

  root.ui = {
    start,
    openHub,
    closeHub,
    renderHub,
    injectIntoAvatarMenu,
    injectIntoMobileDrawerMenu,
  };

  function start() {
    installStyles();
    observeAvatarMenu();
    observeRouteChanges();
    injectIntoAvatarMenu();
    injectIntoMobileDrawerMenu();
    root.log.info("menu", "started", lastRoute);
  }

  function observeAvatarMenu() {
    if (observer) return;

    observer = new MutationObserver((mutations) => {
      const hasAddedNodes = mutations.some((mutation) => mutation.addedNodes.length);
      if (hasAddedNodes) {
        injectIntoAvatarMenu();
        injectIntoMobileDrawerMenu();
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    root.log.debug("menu", "avatar/menu observer attached");
  }

  function observeRouteChanges() {
    const check = () => {
      const route = root.currentRoute();
      if (route !== lastRoute) {
        lastRoute = route;
        root.log.info("router", "route changed", route);
        injectIntoAvatarMenu();
        injectIntoMobileDrawerMenu();
      }
      routeTimer = window.setTimeout(check, 500);
    };

    routeTimer = window.setTimeout(check, 500);
  }

  function injectIntoAvatarMenu() {
    const menu = visibleAvatarMenu();
    if (!menu) {
      root.log.trace("menu", "avatar menu not present");
      return;
    }

    if (menu.querySelector(`[${MENU_ITEM_ATTR}]`)) {
      root.log.trace("menu", "avatar menu item already present");
      return;
    }

    const firstItem = menu.querySelector("li[role='menuitem']");
    if (!firstItem) {
      root.log.warn("menu", "avatar menu found without menuitem");
      return;
    }

    const divider = menu.querySelector("hr");
    const item = makeMenuItem(firstItem);
    item.addEventListener("click", openHub);

    if (divider) divider.before(item);
    else menu.appendChild(item);

    root.log.info("menu", "avatar menu item injected", divider ? "before divider" : "at end", menuDebug(menu));
  }

  function injectIntoMobileDrawerMenu() {
    const menu = visibleMobileDrawerMenu();
    if (!menu) {
      root.log.trace("menu", "mobile drawer menu not present");
      return;
    }

    if (menu.querySelector(`[${MENU_ITEM_ATTR}]`)) {
      root.log.trace("menu", "mobile drawer menu item already present");
      return;
    }

    const firstItem = menu.querySelector("li[role='menuitem']");
    if (!firstItem) {
      root.log.warn("menu", "mobile drawer found without menuitem");
      return;
    }

    const item = makeMobileMenuItem(firstItem);
    item.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const drawerRoot = item.closest(".MuiDrawer-root");
      if (drawerRoot) drawerRoot.style.display = "none";
      openHub();
    });

    const logout = Array.from(menu.querySelectorAll("li[role='menuitem']"))
      .find((li) => li.textContent.includes("Odhlásit"));

    if (logout) logout.before(item);
    else menu.appendChild(item);

    root.log.info("menu", "mobile drawer menu item injected", menuDebug(menu));
  }

  function visibleAvatarMenu() {
    const menus = Array.from(document.querySelectorAll(".MuiMenu-paper ul[role='menu']"));
    const visibleMenus = menus.filter((menu) => {
      const rect = menu.getBoundingClientRect();
      const style = window.getComputedStyle(menu);
      return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
    });

    if (menus.length > 1) {
      root.log.debug("menu", "candidate avatar menus", menus.map(menuDebug));
    }

    return visibleMenus[visibleMenus.length - 1] || menus[menus.length - 1] || null;
  }

  function visibleMobileDrawerMenu() {
    const menus = Array.from(document.querySelectorAll(".MuiDrawer-paperAnchorBottom ul.MuiList-root"));
    const visibleMenus = menus.filter((menu) => {
      const rect = menu.getBoundingClientRect();
      const style = window.getComputedStyle(menu);
      const text = menu.textContent.replace(/\s+/g, "");
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.visibility !== "hidden" &&
        style.display !== "none" &&
        text.includes("Barevnéschéma") &&
        (text.includes("Nastavení") || text.includes("Přihlásit"))
      );
    });

    if (menus.length > 1) {
      root.log.debug("menu", "candidate mobile drawer menus", menus.map(menuDebug));
    }

    return visibleMenus[visibleMenus.length - 1] || null;
  }

  function makeMenuItem(firstItem) {
    const item = document.createElement("li");
    item.className = firstItem.className || "";
    item.setAttribute(MENU_ITEM_ATTR, "true");
    item.setAttribute("tabindex", "-1");
    item.setAttribute("role", "menuitem");
    item.style.cssText = [
      firstItem.getAttribute("style") || "",
      "cursor:pointer;",
      "display:flex;",
      "align-items:center;",
      "gap:16px;",
      "min-height:48px;",
    ].join("");

    const icon = document.createElement("div");
    icon.className = firstItem.querySelector("div")?.className || "";
    icon.innerHTML = menuIconSvg();

    const label = document.createElement("span");
    label.textContent = "Cudloun";

    item.appendChild(icon);
    item.appendChild(label);
    return item;
  }

  function makeMobileMenuItem(firstItem) {
    const item = firstItem.cloneNode(true);
    item.setAttribute(MENU_ITEM_ATTR, "true");
    item.setAttribute("tabindex", "-1");
    item.setAttribute("role", "menuitem");
    item.style.cursor = "pointer";

    const iconWrap = item.querySelector(".MuiListItemIcon-root") || item.querySelector("svg")?.parentElement;
    if (iconWrap) iconWrap.innerHTML = menuIconSvg();

    const label = item.querySelector(".MuiListItemText-root span") || item.querySelector(".MuiListItemText-root") || item;
    label.textContent = "Cudloun";

    return item;
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
      const menuPaper = eventOrModuleId.currentTarget?.closest(".MuiMenu-paper");
      const drawerRoot = eventOrModuleId.currentTarget?.closest(".MuiDrawer-root");
      if (menuPaper) menuPaper.style.display = "none";
      if (drawerRoot) drawerRoot.style.display = "none";
    }

    document.querySelector(`.${BACKDROP_CLASS}`)?.remove();

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

  function renderHub(selectedId) {
    const backdrop = document.querySelector(`.${BACKDROP_CLASS}`);
    if (!backdrop) return;

    const selectedModule = root.modules.find((module) => module.id === selectedId) || root.modules[0];
    const mode = selectedId === "debug" ? "debug" : "module";
    backdrop.innerHTML = "";

    const dialog = document.createElement("section");
    dialog.className = "cudloun-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "cudloun-title");
    dialog.appendChild(renderMascot());
    dialog.appendChild(renderHeader());
    dialog.appendChild(renderBody(mode, selectedModule));
    backdrop.appendChild(dialog);
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

    const titleWrap = document.createElement("div");
    titleWrap.className = "cudloun-title-wrap";
    const title = document.createElement("div");
    title.id = "cudloun-title";
    title.className = "cudloun-title";
    title.textContent = "Cudloun";

    const subtitle = document.createElement("div");
    subtitle.className = "cudloun-subtitle";
    subtitle.textContent = `Babeta module hub core ${root.coreVersion} / seed ${root.seedVersion} / manifest ${root.manifestVersion}`;

    titleWrap.appendChild(title);
    titleWrap.appendChild(subtitle);

    const close = document.createElement("button");
    close.className = "cudloun-icon-button";
    close.type = "button";
    close.setAttribute("aria-label", "Close");
    close.textContent = "x";
    close.addEventListener("click", closeHub);

    header.appendChild(titleWrap);
    header.appendChild(close);
    return header;
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

    controls.appendChild(select);
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

  function installStyles() {
    if (document.head.querySelector(`[${STYLE_ATTR}]`)) return;

    const style = document.createElement("style");
    style.setAttribute(STYLE_ATTR, "true");
    style.textContent = `
      .cudloun-backdrop{position:fixed;inset:0;z-index:1600;display:flex;align-items:center;justify-content:center;padding:42px 20px 20px;background:rgba(26,32,44,.34);backdrop-filter:blur(2px);box-sizing:border-box}
      .cudloun-dialog{position:relative;box-sizing:border-box;width:min(860px,calc(100vw - 28px));max-height:min(760px,calc(100vh - 62px));display:flex;flex-direction:column;overflow:visible;border:1px solid rgba(79,102,134,.34);border-radius:8px;background:#f6f8fb;box-shadow:0 18px 48px rgba(18,27,43,.24);color:#182230;font-family:inherit}
      .cudloun-mascot{position:absolute;left:-73px;top:0;width:100px;max-width:26vw;height:auto;transform:translateY(-48%);pointer-events:none;filter:drop-shadow(0 6px 5px rgba(18,27,43,.25));z-index:2}
      .cudloun-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 20px 14px;border-top-left-radius:8px;border-top-right-radius:8px;border-bottom:1px solid rgba(79,102,134,.2);background:#fff}
      .cudloun-title-wrap{min-width:0}
      .cudloun-title{font-size:1.15rem;font-weight:750;letter-spacing:0}
      .cudloun-subtitle,.cudloun-eyebrow{margin-top:3px;color:#697586;font-size:.78rem;letter-spacing:0}
      .cudloun-icon-button{appearance:none;width:32px;height:32px;border:1px solid rgba(79,102,134,.2);border-radius:6px;background:#fff;color:#4b5565;cursor:pointer;font:700 1rem/1 inherit;flex:0 0 auto}
      .cudloun-icon-button:hover{background:#eef2f7}
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
      .cudloun-code-box{max-width:680px;margin:8px 0 16px;padding:10px;border:1px solid rgba(79,102,134,.2);border-radius:6px;background:#101828;color:#e4e7ec;font:12px/1.45 Consolas,monospace;white-space:pre-wrap;word-break:break-word}
      .cudloun-debug-meta{margin:0 0 12px;color:#697586;font-size:.82rem;line-height:1.35}
      .cudloun-log-box{max-height:430px;overflow:auto;border:1px solid rgba(79,102,134,.2);border-radius:6px;background:#101828;color:#e4e7ec;font:12px/1.45 Consolas,monospace}
      .cudloun-log-entry{padding:5px 8px;border-bottom:1px solid rgba(255,255,255,.07);white-space:pre-wrap;word-break:break-word}
      .cudloun-log-entry[data-level=error]{color:#ffb4b4}
      .cudloun-log-entry[data-level=warn]{color:#ffd18a}
      .cudloun-log-entry[data-level=debug]{color:#9fd0ff}
      .cudloun-log-entry[data-level=trace]{color:#d8c4ff}
      @media (max-width:680px){.cudloun-backdrop{align-items:stretch;justify-content:stretch;padding:8px;background:rgba(26,32,44,.25)}.cudloun-dialog{width:100%;height:calc(100dvh - 16px);max-height:calc(100dvh - 16px);border-radius:10px;overflow:hidden}.cudloun-mascot{left:-36px;top:10px;width:58px;max-width:18vw;transform:none;opacity:.95}.cudloun-head{position:sticky;top:0;z-index:3;gap:10px;padding:12px 12px 10px 42px}.cudloun-title{font-size:1rem}.cudloun-subtitle{font-size:.68rem;line-height:1.25}.cudloun-body{min-height:0;flex:1;display:flex;flex-direction:column;overflow:hidden}.cudloun-module-list{display:flex;gap:8px;min-height:56px;max-height:96px;overflow-x:auto;overflow-y:hidden;padding:8px;border-right:0;border-bottom:1px solid rgba(79,102,134,.18)}.cudloun-module-row{flex:0 0 auto;width:auto;min-width:118px;min-height:40px;margin:0;padding:8px 9px;background:#f8fafc;border-color:rgba(79,102,134,.16)}.cudloun-module-row-text{font-size:.84rem}.cudloun-module-details{flex:1;min-height:0;overflow:auto;padding:16px 12px 24px}.cudloun-module-title{font-size:1.18rem}.cudloun-container-card{padding:10px}.cudloun-container-actions{gap:7px}.cudloun-button{padding:8px 10px;font-size:.84rem}.cudloun-code-box{font-size:11px}.cudloun-log-box{max-height:52vh;font-size:11px}}
    `;
    document.head.appendChild(style);
  }
})();
