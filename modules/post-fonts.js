// Compact post font controls for Kapybara board pages.
(function () {
  "use strict";

  const root = window.Cudloun;
  const STYLE_ID = "cudloun-post-fonts-style";
  const CONTROL_CLASS = "cudloun-post-fonts-control";
  const DEFAULT_SIZE = 17;
  const MIN_SIZE = 8;
  const MAX_SIZE = 72;
  const SLIDER_MIN = 10;
  const SLIDER_MAX = 32;
  const MAX_CUSTOM_FAMILY_LENGTH = 160;
  const FAMILIES = [
    { value: "default", label: "Kapybara default", stack: "" },
    { value: "system", label: "System sans", stack: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif" },
    { value: "system-serif", label: "System serif", stack: "ui-serif, Georgia, Cambria, \"Times New Roman\", serif" },
    { value: "system-mono", label: "System monospace", stack: "ui-monospace, \"SFMono-Regular\", Consolas, \"Liberation Mono\", monospace" },
    { value: "roboto", label: "Roboto", stack: "Roboto, Arial, sans-serif" },
    { value: "noto-sans", label: "Noto Sans", stack: "\"Noto Sans\", Arial, sans-serif" },
    { value: "segoe", label: "Segoe UI", stack: "\"Segoe UI\", Arial, sans-serif" },
    { value: "helvetica", label: "Helvetica", stack: "Helvetica, Arial, sans-serif" },
    { value: "arial", label: "Arial", stack: "Arial, sans-serif" },
    { value: "verdana", label: "Verdana", stack: "Verdana, Geneva, sans-serif" },
    { value: "tahoma", label: "Tahoma", stack: "Tahoma, sans-serif" },
    { value: "trebuchet", label: "Trebuchet MS", stack: "\"Trebuchet MS\", sans-serif" },
    { value: "georgia", label: "Georgia", stack: "Georgia, serif" },
    { value: "times", label: "Times New Roman", stack: "\"Times New Roman\", Times, serif" },
    { value: "garamond", label: "Garamond", stack: "Garamond, Georgia, serif" },
    { value: "palatino", label: "Palatino", stack: "Palatino, \"Palatino Linotype\", serif" },
    { value: "courier", label: "Courier New", stack: "\"Courier New\", monospace" },
    { value: "consolas", label: "Consolas", stack: "Consolas, \"Liberation Mono\", monospace" },
    { value: "comic-sans", label: "Comic Sans MS", stack: "\"Comic Sans MS\", cursive" },
    { value: "custom", label: "Custom…", stack: "" },
  ];

  let ctxRef = null;
  let observer = null;
  let routeTimer = null;
  let mountTimer = null;
  let outsideHandler = null;
  let keyHandler = null;
  let resizeHandler = null;

  root.postFonts = {
    families: FAMILIES.map(({ value, label }) => ({ value, label })),
    normalizeSize,
    normalizeCustomFamily,
    fontStack,
  };

  root.registerModule({
    id: "post-fonts",
    name: "Post Fonts",
    description: "Quick font family and size controls for displayed Kapybara posts.",
    version: "0.2.0",
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
      text.textContent = "Use the f button on board pages. It stays in the sticky page header on desktop and the sticky board toolbar on mobile.";
      row.appendChild(text);
      wrap.appendChild(row);
      return wrap;
    },
    renderHelp() {
      return [
        "Open f to choose a preset or enter a comma-separated custom font stack, then adjust its size with the slider or number field.",
        "Changes apply immediately to displayed post bodies and are remembered across page loads.",
        "Custom fonts must already be available in your browser or device; later names in the stack act as fallbacks.",
        "Reset restores Kapybara's font family and its current 17 px post size.",
      ];
    },
  });

  function start(ctx) {
    stop();
    ctxRef = ctx;
    installStyles();
    applySettings();
    mountForRoute();

    observer = new MutationObserver(scheduleMount);
    observer.observe(document.body, { childList: true, subtree: true });

    outsideHandler = (event) => {
      const control = document.querySelector(`.${CONTROL_CLASS}`);
      if (!control || control.contains(event.target)) return;
      setOpen(control, false);
    };
    keyHandler = (event) => {
      if (event.key !== "Escape") return;
      const control = document.querySelector(`.${CONTROL_CLASS}`);
      if (control) setOpen(control, false);
    };
    document.addEventListener("pointerdown", outsideHandler, true);
    document.addEventListener("keydown", keyHandler, true);
    resizeHandler = scheduleMount;
    window.addEventListener("resize", resizeHandler);
    observeRoute();
    ctx.log.info("post font controls ready");
    return stop;
  }

  function stop() {
    observer?.disconnect();
    observer = null;
    window.clearTimeout(routeTimer);
    window.clearTimeout(mountTimer);
    routeTimer = null;
    mountTimer = null;
    if (outsideHandler) document.removeEventListener("pointerdown", outsideHandler, true);
    if (keyHandler) document.removeEventListener("keydown", keyHandler, true);
    if (resizeHandler) window.removeEventListener("resize", resizeHandler);
    outsideHandler = null;
    keyHandler = null;
    resizeHandler = null;
    document.querySelectorAll(`.${CONTROL_CLASS}`).forEach((control) => control.remove());
    document.getElementById(STYLE_ID)?.remove();
    clearSettings();
    ctxRef = null;
  }

  function observeRoute() {
    let lastRoute = root.currentRoute();
    const check = () => {
      const route = root.currentRoute();
      if (route !== lastRoute) {
        lastRoute = route;
        mountForRoute();
      }
      routeTimer = window.setTimeout(check, 500);
    };
    routeTimer = window.setTimeout(check, 500);
  }

  function scheduleMount() {
    window.clearTimeout(mountTimer);
    mountTimer = window.setTimeout(mountForRoute, 60);
  }

  function mountForRoute() {
    const controls = Array.from(document.querySelectorAll(`.${CONTROL_CLASS}`));
    if (!root.kapyguts?.isBoardPage?.()) {
      controls.forEach((control) => control.remove());
      return;
    }

    const target = controlTarget();
    if (!target) return;
    const connected = controls.find((control) => (
      control.parentElement === target.host && control.dataset.placement === target.placement
    ));
    controls.filter((control) => control !== connected).forEach((control) => control.remove());
    if (!connected) target.host.appendChild(makeControl(target.placement));
  }

  function controlTarget() {
    if (window.matchMedia("(max-width: 700px)").matches) {
      const boardActions = root.kapyguts?.boardHeaderParts?.().actions;
      if (boardActions) return { host: boardActions, placement: "board-header" };
      const header = persistentHeader();
      return header ? { host: header, placement: "floating" } : null;
    }

    const header = persistentHeader();
    return header ? { host: header, placement: "global-header" } : null;
  }

  function persistentHeader() {
    return root.kapyguts?.pageHeader?.() || null;
  }

  function makeControl(placement) {
    const control = document.createElement("div");
    control.className = CONTROL_CLASS;
    control.dataset.placement = placement;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "cudloun-post-fonts-toggle";
    button.textContent = "f";
    button.title = "Post fonts";
    button.setAttribute("aria-label", "Post font controls");
    button.setAttribute("aria-expanded", "false");

    const panel = document.createElement("section");
    panel.className = "cudloun-post-fonts-panel";
    panel.hidden = true;
    panel.setAttribute("aria-label", "Post font controls");

    const head = document.createElement("div");
    head.className = "cudloun-post-fonts-head";
    const title = document.createElement("strong");
    title.textContent = "Post font";
    const close = document.createElement("button");
    close.type = "button";
    close.className = "cudloun-post-fonts-close";
    close.textContent = "×";
    close.setAttribute("aria-label", "Close post font controls");
    head.appendChild(title);
    head.appendChild(close);

    const familyLabel = document.createElement("label");
    familyLabel.className = "cudloun-post-fonts-field";
    const familyText = document.createElement("span");
    familyText.textContent = "Font";
    const family = document.createElement("select");
    family.setAttribute("aria-label", "Post font family");
    FAMILIES.forEach(({ value, label, stack }) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      if (stack) option.style.fontFamily = stack;
      family.appendChild(option);
    });
    family.value = validFamily(ctxRef?.storage.get("family", "default"));
    familyLabel.appendChild(familyText);
    familyLabel.appendChild(family);

    const customLabel = document.createElement("label");
    customLabel.className = "cudloun-post-fonts-field cudloun-post-fonts-custom";
    const customText = document.createElement("span");
    customText.textContent = "Custom";
    const customWrap = document.createElement("span");
    customWrap.className = "cudloun-post-fonts-custom-wrap";
    const custom = document.createElement("input");
    custom.type = "text";
    custom.maxLength = MAX_CUSTOM_FAMILY_LENGTH;
    custom.autocomplete = "off";
    custom.spellcheck = false;
    custom.placeholder = "\"Atkinson Hyperlegible\", Arial, sans-serif";
    custom.setAttribute("aria-label", "Custom post font family");
    const customHint = document.createElement("small");
    customHint.textContent = "Comma-separated local font names";
    customWrap.appendChild(custom);
    customWrap.appendChild(customHint);
    customLabel.appendChild(customText);
    customLabel.appendChild(customWrap);
    custom.value = String(ctxRef?.storage.get("customFamily", "") || "").slice(0, MAX_CUSTOM_FAMILY_LENGTH);
    syncCustomField(customLabel, custom, customHint, family.value);

    const sizeField = document.createElement("div");
    sizeField.className = "cudloun-post-fonts-field";
    const sizeText = document.createElement("span");
    sizeText.textContent = "Size";
    const sizeControls = document.createElement("div");
    sizeControls.className = "cudloun-post-fonts-size";
    const range = document.createElement("input");
    range.type = "range";
    range.min = String(SLIDER_MIN);
    range.max = String(SLIDER_MAX);
    range.step = "0.5";
    range.setAttribute("aria-label", "Post font size slider");
    const number = document.createElement("input");
    number.type = "number";
    number.min = String(MIN_SIZE);
    number.max = String(MAX_SIZE);
    number.step = "0.5";
    number.inputMode = "decimal";
    number.setAttribute("aria-label", "Post font size in pixels");
    const unit = document.createElement("span");
    unit.textContent = "px";
    sizeControls.appendChild(range);
    sizeControls.appendChild(number);
    sizeControls.appendChild(unit);
    sizeField.appendChild(sizeText);
    sizeField.appendChild(sizeControls);

    const actions = document.createElement("div");
    actions.className = "cudloun-post-fonts-actions";
    const reset = document.createElement("button");
    reset.type = "button";
    reset.textContent = "Reset";
    actions.appendChild(reset);

    panel.appendChild(head);
    panel.appendChild(familyLabel);
    panel.appendChild(customLabel);
    panel.appendChild(sizeField);
    panel.appendChild(actions);
    control.appendChild(button);
    control.appendChild(panel);

    syncSizeInputs(range, number, currentSize());
    button.addEventListener("click", () => setOpen(control, panel.hidden));
    close.addEventListener("click", () => setOpen(control, false));
    family.addEventListener("change", () => {
      ctxRef?.storage.set("family", validFamily(family.value));
      syncCustomField(customLabel, custom, customHint, family.value);
      applySettings();
      if (family.value === "custom") custom.focus();
    });
    custom.addEventListener("input", () => {
      const value = custom.value.slice(0, MAX_CUSTOM_FAMILY_LENGTH);
      ctxRef?.storage.set("customFamily", value);
      syncCustomField(customLabel, custom, customHint, family.value);
      applySettings();
    });
    range.addEventListener("input", () => {
      const size = normalizeSize(range.value);
      number.value = displaySize(size);
      saveSize(size);
    });
    number.addEventListener("input", () => {
      if (number.value === "") return;
      const size = normalizeSize(number.value);
      range.value = String(Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, size)));
      saveSize(size);
    });
    number.addEventListener("change", () => {
      const size = normalizeSize(number.value);
      syncSizeInputs(range, number, size);
      saveSize(size);
    });
    reset.addEventListener("click", () => {
      family.value = "default";
      custom.value = "";
      syncCustomField(customLabel, custom, customHint, family.value);
      syncSizeInputs(range, number, DEFAULT_SIZE);
      ctxRef?.storage.set("family", "default");
      ctxRef?.storage.set("customFamily", "");
      ctxRef?.storage.set("size", DEFAULT_SIZE);
      applySettings();
    });
    return control;
  }

  function setOpen(control, open) {
    const panel = control.querySelector(".cudloun-post-fonts-panel");
    const button = control.querySelector(".cudloun-post-fonts-toggle");
    if (!panel || !button) return;
    panel.hidden = !open;
    button.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) panel.querySelector("select")?.focus();
  }

  function saveSize(value) {
    const size = normalizeSize(value);
    ctxRef?.storage.set("size", size);
    applySettings();
  }

  function applySettings() {
    const family = validFamily(ctxRef?.storage.get("family", "default"));
    const customFamily = ctxRef?.storage.get("customFamily", "");
    const size = currentSize();
    const stack = fontStack(family, customFamily);
    const effectiveFamily = stack ? family : "default";
    const rootElement = document.documentElement;
    rootElement.setAttribute("data-cudloun-post-fonts", "true");
    rootElement.setAttribute("data-cudloun-post-font-family", effectiveFamily);
    rootElement.style.setProperty("--cudloun-post-font-size", `${displaySize(size)}px`);
    if (stack) rootElement.style.setProperty("--cudloun-post-font-family", stack);
    else rootElement.style.removeProperty("--cudloun-post-font-family");
  }

  function clearSettings() {
    const rootElement = document.documentElement;
    rootElement.removeAttribute("data-cudloun-post-fonts");
    rootElement.removeAttribute("data-cudloun-post-font-family");
    rootElement.style.removeProperty("--cudloun-post-font-size");
    rootElement.style.removeProperty("--cudloun-post-font-family");
  }

  function currentSize() {
    return normalizeSize(ctxRef?.storage.get("size", DEFAULT_SIZE));
  }

  function normalizeSize(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return DEFAULT_SIZE;
    const clamped = Math.min(MAX_SIZE, Math.max(MIN_SIZE, parsed));
    return Math.round(clamped * 2) / 2;
  }

  function displaySize(value) {
    const size = normalizeSize(value);
    return Number.isInteger(size) ? String(size) : size.toFixed(1);
  }

  function validFamily(value) {
    const candidate = String(value || "default");
    return FAMILIES.some((font) => font.value === candidate) ? candidate : "default";
  }

  function fontStack(value, customFamily = "") {
    const family = validFamily(value);
    if (family === "custom") return normalizeCustomFamily(customFamily);
    return FAMILIES.find((font) => font.value === family)?.stack || "";
  }

  function normalizeCustomFamily(value) {
    const source = String(value || "").trim();
    if (!source || source.length > MAX_CUSTOM_FAMILY_LENGTH) return "";
    if (/[;{}()\\/:]/.test(source) || /[\u0000-\u001f\u007f]/.test(source)) return "";

    const tokens = [];
    let token = "";
    let quote = "";
    for (const character of source) {
      if ((character === "\"" || character === "'") && !quote) quote = character;
      else if (character === quote) quote = "";
      if (character === "," && !quote) {
        tokens.push(token.trim());
        token = "";
      } else {
        token += character;
      }
    }
    if (quote) return "";
    tokens.push(token.trim());
    if (tokens.some((item) => !item)) return "";

    const safeName = /^[\p{L}\p{N} ._-]+$/u;
    const normalized = [];
    for (const item of tokens) {
      const opening = item[0];
      const quoted = opening === "\"" || opening === "'";
      if (quoted) {
        if (item.length < 3 || item[item.length - 1] !== opening) return "";
        const name = item.slice(1, -1).trim().replace(/\s+/g, " ");
        if (!name || !safeName.test(name)) return "";
        normalized.push(`${opening}${name}${opening}`);
      } else {
        const name = item.replace(/\s+/g, " ");
        if (!safeName.test(name)) return "";
        normalized.push(name);
      }
    }
    return normalized.join(", ");
  }

  function syncCustomField(field, input, hint, family) {
    field.hidden = family !== "custom";
    const value = input.value.trim();
    const normalized = normalizeCustomFamily(value);
    const invalid = Boolean(value && !normalized);
    input.setAttribute("aria-invalid", invalid ? "true" : "false");
    hint.textContent = invalid
      ? "Use comma-separated font names only"
      : "Comma-separated local font names";
  }

  function syncSizeInputs(range, number, value) {
    const size = normalizeSize(value);
    range.value = String(Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, size)));
    number.value = displaySize(size);
  }

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      html[data-cudloun-post-fonts="true"] article.post .body,
      html[data-cudloun-post-fonts="true"] article.post .body .markdown {
        font-size: var(--cudloun-post-font-size, 17px) !important;
      }
      html[data-cudloun-post-fonts="true"]:not([data-cudloun-post-font-family="default"]) article.post .body,
      html[data-cudloun-post-fonts="true"]:not([data-cudloun-post-font-family="default"]) article.post .body .markdown {
        font-family: var(--cudloun-post-font-family) !important;
      }
      .${CONTROL_CLASS}{position:absolute;top:8px;right:60px;z-index:4;font:14px/1.3 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#243041}
      .${CONTROL_CLASS}[data-placement="board-header"]{position:relative;top:auto;right:auto;bottom:auto;z-index:4;flex:0 0 auto}
      .${CONTROL_CLASS}[data-placement="board-header"] .cudloun-post-fonts-toggle{width:36px;height:36px;border:0;border-radius:50%;box-shadow:none;background:transparent}
      .${CONTROL_CLASS}[data-placement="board-header"] .cudloun-post-fonts-panel{top:44px;right:0}
      .cudloun-post-fonts-toggle{appearance:none;width:38px;height:38px;display:grid;place-items:center;margin:0;border:1px solid rgba(79,102,134,.3);border-radius:8px;background:#fff;color:#8a5300;box-shadow:0 2px 7px rgba(18,27,43,.14);cursor:pointer;font:italic 800 20px/1 Georgia,serif}
      .cudloun-post-fonts-toggle:hover,.cudloun-post-fonts-toggle[aria-expanded="true"]{border-color:#b06a00;background:#fff8eb;color:#7a4700}
      .cudloun-post-fonts-toggle:focus-visible{outline:2px solid #b06a00;outline-offset:2px}
      .cudloun-post-fonts-panel{box-sizing:border-box;position:absolute;top:46px;right:0;width:286px;padding:12px;border:1px solid rgba(79,102,134,.3);border-radius:10px;background:#fff;color:#243041;box-shadow:0 12px 32px rgba(18,27,43,.24)}
      .cudloun-post-fonts-panel[hidden]{display:none!important}
      .cudloun-post-fonts-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 10px}
      .cudloun-post-fonts-head strong{font-size:14px}
      .cudloun-post-fonts-close{appearance:none;width:28px;height:28px;border:0;border-radius:6px;background:transparent;color:#697586;cursor:pointer;font:700 20px/1 inherit}
      .cudloun-post-fonts-close:hover{background:#eef2f7;color:#243041}
      .cudloun-post-fonts-field{display:grid;grid-template-columns:52px minmax(0,1fr);align-items:center;gap:9px;margin:8px 0;font-weight:650}
      .cudloun-post-fonts-field select,.cudloun-post-fonts-field input[type="number"],.cudloun-post-fonts-field input[type="text"]{box-sizing:border-box;min-height:36px;border:1px solid rgba(79,102,134,.32);border-radius:7px;background:#fff;color:#182230;padding:0 8px;font:inherit}
      .cudloun-post-fonts-field select{width:100%}
      .cudloun-post-fonts-custom[hidden]{display:none!important}
      .cudloun-post-fonts-custom{align-items:start}
      .cudloun-post-fonts-custom>span:first-child{padding-top:9px}
      .cudloun-post-fonts-custom-wrap{display:grid;gap:4px;min-width:0}
      .cudloun-post-fonts-custom-wrap input{width:100%}
      .cudloun-post-fonts-custom-wrap input[aria-invalid="true"]{border-color:#b42318;outline-color:#b42318}
      .cudloun-post-fonts-custom-wrap small{color:#697586;font-size:11px;font-weight:500}
      .cudloun-post-fonts-size{display:grid;grid-template-columns:minmax(0,1fr) 62px auto;align-items:center;gap:7px}
      .cudloun-post-fonts-size input[type="range"]{width:100%;accent-color:#b06a00}
      .cudloun-post-fonts-size input[type="number"]{width:62px;text-align:right}
      .cudloun-post-fonts-size>span{color:#697586;font-size:12px}
      .cudloun-post-fonts-actions{display:flex;justify-content:flex-end;margin-top:10px;padding-top:10px;border-top:1px solid rgba(79,102,134,.16)}
      .cudloun-post-fonts-actions button{appearance:none;border:1px solid rgba(79,102,134,.26);border-radius:7px;background:#f8fafc;color:#364152;cursor:pointer;font:700 12px/1.2 inherit;padding:7px 10px}
      .cudloun-post-fonts-actions button:hover{background:#eef2f7}
      html[data-cudloun-kapybara-theme="dark"] .cudloun-post-fonts-toggle,
      html[data-cudloun-kapybara-theme="dark"] .cudloun-post-fonts-panel,
      html[data-cudloun-kapybara-theme="dark"] .cudloun-post-fonts-field select,
      html[data-cudloun-kapybara-theme="dark"] .cudloun-post-fonts-field input[type="number"],
      html[data-cudloun-kapybara-theme="dark"] .cudloun-post-fonts-field input[type="text"],
      html[data-cudloun-kapybara-theme="dark"] .cudloun-post-fonts-actions button{background:var(--cudloun-kapybara-surface,#141414);color:var(--cudloun-kapybara-text,#f4f4f4);border-color:var(--cudloun-kapybara-line,#303030)}
      @media(max-width:700px){
        .${CONTROL_CLASS}[data-placement="floating"]{position:fixed;top:auto;right:14px;bottom:62px;z-index:2020}
        .${CONTROL_CLASS}[data-placement="floating"] .cudloun-post-fonts-toggle{width:46px;height:46px;border-radius:50%;background:#b06a00;color:#fff;box-shadow:0 6px 20px rgba(18,27,43,.3);font-size:23px}
        .${CONTROL_CLASS}[data-placement="floating"] .cudloun-post-fonts-toggle:hover,
        .${CONTROL_CLASS}[data-placement="floating"] .cudloun-post-fonts-toggle[aria-expanded="true"]{background:#8f5600;color:#fff}
        .${CONTROL_CLASS}[data-placement="floating"] .cudloun-post-fonts-panel{top:auto;right:0;bottom:54px}
        .cudloun-post-fonts-panel{width:min(286px,calc(100vw - 28px));max-height:calc(100dvh - 72px);overflow:auto}
      }
    `;
    document.head.appendChild(style);
  }
})();
