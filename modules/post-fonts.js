// Compact quick and per-area font controls for Kapybara board pages.
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
  const LONG_PRESS_MS = 520;
  const LONG_PRESS_MOVE_PX = 10;
  const MAX_CUSTOM_FAMILY_LENGTH = 160;
  const FONT_ROLES = [
    { id: "posts", label: "Posts", title: "Post content", unit: "px", defaultSize: DEFAULT_SIZE, min: MIN_SIZE, max: MAX_SIZE, sliderMin: SLIDER_MIN, sliderMax: SLIDER_MAX, step: 0.5 },
    { id: "interface", label: "UI", title: "Interface", unit: "px", defaultSize: 16, min: 12, max: 20, sliderMin: 12, sliderMax: 20, step: 1 },
    { id: "headings", label: "Titles", title: "Headings and authors", unit: "%", defaultSize: 100, min: 70, max: 130, sliderMin: 70, sliderMax: 130, step: 5 },
    { id: "code", label: "Code", title: "Code and monospace text", unit: "%", defaultSize: 100, min: 70, max: 130, sliderMin: 70, sliderMax: 130, step: 5 },
    { id: "logo", label: "Logo", title: "Okoun logo", unit: "%", defaultSize: 100, min: 70, max: 130, sliderMin: 70, sliderMax: 130, step: 5 },
  ];
  const FAMILIES = [
    { value: "default", label: "Kapybara default", stack: "" },
    { value: "classic-okoun", label: "Classic Okoun", stack: "Verdana, \"Bitstream Vera Sans\", Arial, sans-serif" },
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
    roles: FONT_ROLES.map(({ id, label, title, unit, defaultSize, min, max, step }) => ({ id, label, title, unit, defaultSize, min, max, step })),
    longPressMs: LONG_PRESS_MS,
    normalizeSize,
    normalizeRoleSize,
    normalizeCustomFamily,
    fontStack,
  };

  root.registerModule({
    id: "post-fonts",
    name: "Post Fonts",
    description: "Quick post fonts with optional per-area controls for Kapybara.",
    version: "0.5.0",
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
      text.textContent = "Tap f for quick post fonts. Hold it on touch screens or right-click it for separate interface, heading, code, and logo controls.";
      row.appendChild(text);
      wrap.appendChild(row);
      return wrap;
    },
    renderHelp() {
      return [
        "Open f to choose a preset or enter a comma-separated custom font stack, then adjust its size with the slider or number field.",
        "Hold f on a touch screen, or right-click it with a mouse, to open advanced controls for Posts, UI, Titles, Code, and Logo.",
        "Changes apply immediately to the selected area and are remembered across page loads.",
        "Custom fonts must already be available in your browser or device; later names in the stack act as fallbacks.",
        "Reset restores the currently selected area; untouched advanced areas keep Kapybara's native styling.",
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

    const desktopActions = root.kapyguts?.pageHeaderParts?.().desktopActions;
    if (desktopActions) return { host: desktopActions, placement: "global-actions" };
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
    button.title = "Post fonts — hold or right-click for more";
    button.setAttribute("aria-label", "Post font controls");
    button.setAttribute("aria-expanded", "false");

    const panel = document.createElement("section");
    panel.className = "cudloun-post-fonts-panel cudloun-post-fonts-panel--simple";
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

    const advancedHint = document.createElement("small");
    advancedHint.className = "cudloun-post-fonts-advanced-hint";
    advancedHint.textContent = "Hold or right-click f for more";

    panel.appendChild(head);
    panel.appendChild(familyLabel);
    panel.appendChild(customLabel);
    panel.appendChild(sizeField);
    panel.appendChild(actions);
    panel.appendChild(advancedHint);
    control.appendChild(button);
    control.appendChild(panel);
    control.appendChild(makeAdvancedPanel(control));

    syncSizeInputs(range, number, currentSize());
    installToggleGestures(button, control);
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

  function makeAdvancedPanel(control) {
    const panel = document.createElement("section");
    panel.className = "cudloun-post-fonts-panel cudloun-post-fonts-panel--advanced";
    panel.hidden = true;
    panel.setAttribute("aria-label", "Advanced font controls");

    const head = document.createElement("div");
    head.className = "cudloun-post-fonts-head";
    const heading = document.createElement("div");
    heading.className = "cudloun-post-fonts-advanced-title";
    const title = document.createElement("strong");
    title.textContent = "More fonts";
    const intro = document.createElement("small");
    intro.textContent = "Pick an area, then tune it";
    heading.appendChild(title);
    heading.appendChild(intro);
    const close = document.createElement("button");
    close.type = "button";
    close.className = "cudloun-post-fonts-close";
    close.textContent = "×";
    close.setAttribute("aria-label", "Close advanced font controls");
    head.appendChild(heading);
    head.appendChild(close);

    const roles = document.createElement("div");
    roles.className = "cudloun-post-fonts-roles";
    roles.setAttribute("role", "tablist");
    roles.setAttribute("aria-label", "Font area");
    const roleButtons = new Map();
    FONT_ROLES.forEach((config) => {
      const roleButton = document.createElement("button");
      roleButton.type = "button";
      roleButton.textContent = config.label;
      roleButton.title = config.title;
      roleButton.dataset.fontRole = config.id;
      roleButton.setAttribute("role", "tab");
      roleButton.setAttribute("aria-selected", "false");
      roles.appendChild(roleButton);
      roleButtons.set(config.id, roleButton);
    });

    const areaName = document.createElement("strong");
    areaName.className = "cudloun-post-fonts-area-name";

    const familyLabel = document.createElement("label");
    familyLabel.className = "cudloun-post-fonts-field";
    const familyText = document.createElement("span");
    familyText.textContent = "Font";
    const family = document.createElement("select");
    family.setAttribute("aria-label", "Selected area font family");
    FAMILIES.forEach(({ value, label, stack }) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      if (stack) option.style.fontFamily = stack;
      family.appendChild(option);
    });
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
    custom.placeholder = "Georgia, serif";
    custom.setAttribute("aria-label", "Selected area custom font family");
    const customHint = document.createElement("small");
    customWrap.appendChild(custom);
    customWrap.appendChild(customHint);
    customLabel.appendChild(customText);
    customLabel.appendChild(customWrap);

    const sizeField = document.createElement("div");
    sizeField.className = "cudloun-post-fonts-field";
    const sizeText = document.createElement("span");
    sizeText.textContent = "Size";
    const sizeControls = document.createElement("div");
    sizeControls.className = "cudloun-post-fonts-size";
    const range = document.createElement("input");
    range.type = "range";
    range.setAttribute("aria-label", "Selected area font size slider");
    const number = document.createElement("input");
    number.type = "number";
    number.inputMode = "decimal";
    number.setAttribute("aria-label", "Selected area font size");
    const unit = document.createElement("span");
    sizeControls.appendChild(range);
    sizeControls.appendChild(number);
    sizeControls.appendChild(unit);
    sizeField.appendChild(sizeText);
    sizeField.appendChild(sizeControls);

    const actions = document.createElement("div");
    actions.className = "cudloun-post-fonts-actions cudloun-post-fonts-advanced-actions";
    const nativeLink = document.createElement("a");
    nativeLink.href = "/test/fonts";
    nativeLink.textContent = "Native settings";
    nativeLink.title = "Open Kapybara's full experimental font settings";
    const reset = document.createElement("button");
    reset.type = "button";
    reset.textContent = "Reset area";
    actions.appendChild(nativeLink);
    actions.appendChild(reset);

    panel.appendChild(head);
    panel.appendChild(roles);
    panel.appendChild(areaName);
    panel.appendChild(familyLabel);
    panel.appendChild(customLabel);
    panel.appendChild(sizeField);
    panel.appendChild(actions);

    let activeRole = "posts";
    const sync = (role = activeRole) => {
      const config = roleConfig(role);
      activeRole = config.id;
      roleButtons.forEach((button, id) => button.setAttribute("aria-selected", id === activeRole ? "true" : "false"));
      areaName.textContent = config.title;
      family.value = currentRoleFamily(activeRole);
      custom.value = currentRoleCustomFamily(activeRole);
      syncCustomField(customLabel, custom, customHint, family.value);
      range.min = String(config.sliderMin);
      range.max = String(config.sliderMax);
      range.step = String(config.step);
      number.min = String(config.min);
      number.max = String(config.max);
      number.step = String(config.step);
      unit.textContent = config.unit;
      syncRoleSizeInputs(activeRole, range, number, currentRoleSize(activeRole));
    };

    roleButtons.forEach((roleButton, role) => roleButton.addEventListener("click", () => sync(role)));
    close.addEventListener("click", () => setOpen(control, false));
    family.addEventListener("change", () => {
      ctxRef?.storage.set(roleStorageKey(activeRole, "family"), validFamily(family.value));
      syncCustomField(customLabel, custom, customHint, family.value);
      applySettings();
      if (family.value === "custom") custom.focus();
    });
    custom.addEventListener("input", () => {
      const value = custom.value.slice(0, MAX_CUSTOM_FAMILY_LENGTH);
      ctxRef?.storage.set(roleStorageKey(activeRole, "customFamily"), value);
      syncCustomField(customLabel, custom, customHint, family.value);
      applySettings();
    });
    range.addEventListener("input", () => {
      const size = normalizeRoleSize(activeRole, range.value);
      number.value = displayRoleSize(activeRole, size);
      saveRoleSize(activeRole, size);
    });
    number.addEventListener("input", () => {
      if (number.value === "") return;
      const config = roleConfig(activeRole);
      const size = normalizeRoleSize(activeRole, number.value);
      range.value = String(Math.min(config.sliderMax, Math.max(config.sliderMin, size)));
      saveRoleSize(activeRole, size);
    });
    number.addEventListener("change", () => {
      const size = normalizeRoleSize(activeRole, number.value);
      syncRoleSizeInputs(activeRole, range, number, size);
      saveRoleSize(activeRole, size);
    });
    reset.addEventListener("click", () => {
      const config = roleConfig(activeRole);
      ctxRef?.storage.set(roleStorageKey(activeRole, "family"), "default");
      ctxRef?.storage.set(roleStorageKey(activeRole, "customFamily"), "");
      ctxRef?.storage.set(roleStorageKey(activeRole, "size"), config.defaultSize);
      applySettings();
      sync(activeRole);
    });
    panel.addEventListener("cudloun-fonts-sync", () => sync(activeRole));
    sync();
    return panel;
  }

  function installToggleGestures(button, control) {
    let timer = null;
    let start = null;
    let suppressClick = false;
    const cancel = () => {
      window.clearTimeout(timer);
      timer = null;
      start = null;
    };

    button.addEventListener("click", (event) => {
      if (suppressClick) {
        suppressClick = false;
        event.preventDefault();
        return;
      }
      const panel = control.querySelector(".cudloun-post-fonts-panel--simple");
      setOpen(control, panel?.hidden !== false, "simple");
    });
    button.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      cancel();
      suppressClick = event.button !== 2;
      setOpen(control, true, "advanced");
    });
    button.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || event.pointerType === "mouse") return;
      cancel();
      start = { x: event.clientX, y: event.clientY };
      timer = window.setTimeout(() => {
        timer = null;
        suppressClick = true;
        setOpen(control, true, "advanced");
      }, LONG_PRESS_MS);
    });
    button.addEventListener("pointermove", (event) => {
      if (!start) return;
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > LONG_PRESS_MOVE_PX) cancel();
    });
    button.addEventListener("pointerup", cancel);
    button.addEventListener("pointercancel", cancel);
    button.addEventListener("lostpointercapture", cancel);
  }

  function setOpen(control, open, mode = "simple") {
    const panels = Array.from(control.querySelectorAll(".cudloun-post-fonts-panel"));
    const button = control.querySelector(".cudloun-post-fonts-toggle");
    if (!panels.length || !button) return;
    panels.forEach((panel) => {
      const selected = panel.classList.contains(`cudloun-post-fonts-panel--${mode}`);
      panel.hidden = !open || !selected;
      if (open && selected && mode === "advanced") panel.dispatchEvent(new Event("cudloun-fonts-sync"));
    });
    button.setAttribute("aria-expanded", open ? "true" : "false");
    control.dataset.openPanel = open ? mode : "";
    if (open) {
      const panel = control.querySelector(`.cudloun-post-fonts-panel--${mode}`);
      (mode === "advanced" ? panel?.querySelector("[role='tab'][aria-selected='true']") : panel?.querySelector("select"))?.focus();
    }
  }

  function saveSize(value) {
    const size = normalizeSize(value);
    ctxRef?.storage.set("size", size);
    applySettings();
  }

  function roleConfig(role) {
    return FONT_ROLES.find((config) => config.id === role) || FONT_ROLES[0];
  }

  function roleStorageKey(role, field) {
    if (role === "posts") {
      if (field === "family") return "family";
      if (field === "customFamily") return "customFamily";
      if (field === "size") return "size";
    }
    return `${role}${field[0].toUpperCase()}${field.slice(1)}`;
  }

  function currentRoleFamily(role) {
    return validFamily(ctxRef?.storage.get(roleStorageKey(role, "family"), "default"));
  }

  function currentRoleCustomFamily(role) {
    return String(ctxRef?.storage.get(roleStorageKey(role, "customFamily"), "") || "").slice(0, MAX_CUSTOM_FAMILY_LENGTH);
  }

  function currentRoleSize(role) {
    const config = roleConfig(role);
    return normalizeRoleSize(role, ctxRef?.storage.get(roleStorageKey(role, "size"), config.defaultSize));
  }

  function saveRoleSize(role, value) {
    ctxRef?.storage.set(roleStorageKey(role, "size"), normalizeRoleSize(role, value));
    applySettings();
  }

  function applySettings() {
    const rootElement = document.documentElement;
    rootElement.setAttribute("data-cudloun-post-fonts", "true");
    FONT_ROLES.forEach((config) => applyRoleSettings(rootElement, config));
  }

  function applyRoleSettings(rootElement, config) {
    const family = currentRoleFamily(config.id);
    const stack = fontStack(family, currentRoleCustomFamily(config.id));
    const cssId = config.id === "posts" ? "post" : config.id;
    const familyAttribute = `data-cudloun-${cssId}-font-family`;
    const sizeAttribute = `data-cudloun-${cssId}-font-size`;
    const familyProperty = `--cudloun-${cssId}-font-family`;
    const sizeProperty = `--cudloun-${cssId}-font-size`;
    const size = currentRoleSize(config.id);

    rootElement.setAttribute(familyAttribute, stack ? family : "default");
    if (stack) rootElement.style.setProperty(familyProperty, stack);
    else rootElement.style.removeProperty(familyProperty);

    const applySize = config.id === "posts" || size !== config.defaultSize;
    if (applySize) {
      rootElement.setAttribute(sizeAttribute, "true");
      rootElement.style.setProperty(sizeProperty, `${displayRoleSize(config.id, size)}${config.unit}`);
    } else {
      rootElement.removeAttribute(sizeAttribute);
      rootElement.style.removeProperty(sizeProperty);
    }
  }

  function clearSettings() {
    const rootElement = document.documentElement;
    rootElement.removeAttribute("data-cudloun-post-fonts");
    FONT_ROLES.forEach((config) => {
      const cssId = config.id === "posts" ? "post" : config.id;
      rootElement.removeAttribute(`data-cudloun-${cssId}-font-family`);
      rootElement.removeAttribute(`data-cudloun-${cssId}-font-size`);
      rootElement.style.removeProperty(`--cudloun-${cssId}-font-family`);
      rootElement.style.removeProperty(`--cudloun-${cssId}-font-size`);
    });
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

  function normalizeRoleSize(role, value) {
    if (role === "posts") return normalizeSize(value);
    const config = roleConfig(role);
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return config.defaultSize;
    const clamped = Math.min(config.max, Math.max(config.min, parsed));
    return Math.round(clamped / config.step) * config.step;
  }

  function displaySize(value) {
    const size = normalizeSize(value);
    return Number.isInteger(size) ? String(size) : size.toFixed(1);
  }

  function displayRoleSize(role, value) {
    return role === "posts" ? displaySize(value) : String(normalizeRoleSize(role, value));
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

  function syncRoleSizeInputs(role, range, number, value) {
    const config = roleConfig(role);
    const size = normalizeRoleSize(role, value);
    range.value = String(Math.min(config.sliderMax, Math.max(config.sliderMin, size)));
    number.value = displayRoleSize(role, size);
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
      html[data-cudloun-interface-font-family]:not([data-cudloun-interface-font-family="default"]) :where(header:not(.post-header),nav,section.new-post-composer,section.reply-composer),
      html[data-cudloun-interface-font-family]:not([data-cudloun-interface-font-family="default"]) :where(header:not(.post-header),nav,section.new-post-composer,section.reply-composer) :where(button,input,select,textarea):not(.cudloun-post-fonts-control *){font-family:var(--cudloun-interface-font-family)!important}
      html[data-cudloun-interface-font-size="true"] :where(header:not(.post-header),nav,section.new-post-composer,section.reply-composer){font-size:var(--cudloun-interface-font-size)!important}
      html[data-cudloun-interface-font-size="true"] :where(header:not(.post-header),nav,section.new-post-composer,section.reply-composer) :where(button,input,select,textarea):not(.cudloun-post-fonts-control *){font-size:var(--cudloun-interface-font-size)!important}
      html[data-cudloun-headings-font-family]:not([data-cudloun-headings-font-family="default"]) :where(h1,h2,h3,h4,h5,h6,.title-link,article.post .author){font-family:var(--cudloun-headings-font-family)!important}
      html[data-cudloun-headings-font-size="true"] :where(h1,h2,h3,h4,h5,h6,.title-link,article.post .author){font-size:var(--cudloun-headings-font-size)!important}
      html[data-cudloun-code-font-family]:not([data-cudloun-code-font-family="default"]) :where(pre,code,kbd,samp){font-family:var(--cudloun-code-font-family)!important}
      html[data-cudloun-code-font-size="true"] :where(pre,:not(pre)>code,kbd,samp){font-size:var(--cudloun-code-font-size)!important}
      html[data-cudloun-logo-font-family]:not([data-cudloun-logo-font-family="default"]) :where(a[aria-label="Okoun home"],.logo) :where(.text,.orange-o){font-family:var(--cudloun-logo-font-family)!important}
      html[data-cudloun-logo-font-size="true"] :where(a[aria-label="Okoun home"],.logo){zoom:var(--cudloun-logo-font-size)}
      .${CONTROL_CLASS}{position:absolute;top:8px;right:60px;z-index:4;font:14px/1.3 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#243041}
      .${CONTROL_CLASS}[data-placement="board-header"],.${CONTROL_CLASS}[data-placement="global-actions"]{position:relative;top:auto;right:auto;bottom:auto;z-index:4;flex:0 0 auto}
      .${CONTROL_CLASS}[data-placement="global-actions"]{order:-1}
      .${CONTROL_CLASS}[data-placement="board-header"] .cudloun-post-fonts-toggle,.${CONTROL_CLASS}[data-placement="global-actions"] .cudloun-post-fonts-toggle{width:36px;height:36px;border:0;border-radius:50%;box-shadow:none;background:transparent}
      .${CONTROL_CLASS}[data-placement="board-header"] .cudloun-post-fonts-panel{top:44px;right:0}
      .${CONTROL_CLASS}[data-placement="global-actions"] .cudloun-post-fonts-panel{top:45px;right:0}
      .cudloun-post-fonts-toggle{appearance:none;width:38px;height:38px;display:grid;place-items:center;margin:0;border:1px solid rgba(79,102,134,.3);border-radius:8px;background:#fff;color:#8a5300;box-shadow:0 2px 7px rgba(18,27,43,.14);cursor:pointer;font:italic 800 20px/1 Georgia,serif;-webkit-touch-callout:none;user-select:none}
      .cudloun-post-fonts-toggle:hover,.cudloun-post-fonts-toggle[aria-expanded="true"]{border-color:#b06a00;background:#fff8eb;color:#7a4700}
      .cudloun-post-fonts-toggle:focus-visible{outline:2px solid #b06a00;outline-offset:2px}
      .cudloun-post-fonts-panel{box-sizing:border-box;position:absolute;top:46px;right:0;width:286px;padding:12px;border:1px solid rgba(79,102,134,.3);border-radius:10px;background:#fff;color:#243041;box-shadow:0 12px 32px rgba(18,27,43,.24)}
      .cudloun-post-fonts-panel--advanced{width:330px}
      .cudloun-post-fonts-panel[hidden]{display:none!important}
      .cudloun-post-fonts-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 10px}
      .cudloun-post-fonts-head strong{font-size:14px}
      .cudloun-post-fonts-advanced-title{display:grid;gap:2px}
      .cudloun-post-fonts-advanced-title small,.cudloun-post-fonts-advanced-hint{color:#697586;font-size:11px;font-weight:500}
      .cudloun-post-fonts-advanced-hint{display:block;margin-top:7px;text-align:right}
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
      .cudloun-post-fonts-roles{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;margin:2px 0 10px}
      .cudloun-post-fonts-roles button{appearance:none;min-width:0;border:1px solid rgba(79,102,134,.25);border-radius:999px;background:#f8fafc;color:#4a5667;cursor:pointer;font:700 11px/1.2 inherit;padding:7px 3px}
      .cudloun-post-fonts-roles button[aria-selected="true"]{border-color:#b06a00;background:#fff3dc;color:#7a4700}
      .cudloun-post-fonts-area-name{display:block;margin:0 0 4px;color:#697586;font-size:11px}
      .cudloun-post-fonts-actions{display:flex;justify-content:flex-end;margin-top:10px;padding-top:10px;border-top:1px solid rgba(79,102,134,.16)}
      .cudloun-post-fonts-actions button{appearance:none;border:1px solid rgba(79,102,134,.26);border-radius:7px;background:#f8fafc;color:#364152;cursor:pointer;font:700 12px/1.2 inherit;padding:7px 10px}
      .cudloun-post-fonts-actions button:hover{background:#eef2f7}
      .cudloun-post-fonts-advanced-actions{align-items:center;justify-content:space-between}
      .cudloun-post-fonts-advanced-actions a{color:#8a5300;font-size:11px;font-weight:700;text-decoration:none}
      .cudloun-post-fonts-advanced-actions a:hover{text-decoration:underline}
      html[data-cudloun-kapybara-theme="dark"] .cudloun-post-fonts-toggle,
      html[data-cudloun-kapybara-theme="dark"] .cudloun-post-fonts-panel,
      html[data-cudloun-kapybara-theme="dark"] .cudloun-post-fonts-field select,
      html[data-cudloun-kapybara-theme="dark"] .cudloun-post-fonts-field input[type="number"],
      html[data-cudloun-kapybara-theme="dark"] .cudloun-post-fonts-field input[type="text"],
      html[data-cudloun-kapybara-theme="dark"] .cudloun-post-fonts-actions button,
      html[data-cudloun-kapybara-theme="dark"] .cudloun-post-fonts-roles button{background:var(--cudloun-kapybara-surface,#141414);color:var(--cudloun-kapybara-text,#f4f4f4);border-color:var(--cudloun-kapybara-line,#303030)}
      html[data-cudloun-kapybara-theme="dark"] .cudloun-post-fonts-roles button[aria-selected="true"]{background:var(--cudloun-kapybara-accent-soft,#3a2b16);color:var(--cudloun-kapybara-accent,#d68a1f);border-color:var(--cudloun-kapybara-accent,#d68a1f)}
      html[data-cudloun-kapybara-theme="dark"] .cudloun-post-fonts-advanced-actions a{color:var(--cudloun-kapybara-accent,#d68a1f)}
      html[data-cudloun-kapybara-theme="dark"] .${CONTROL_CLASS}[data-placement="board-header"] .cudloun-post-fonts-toggle,
      html[data-cudloun-kapybara-theme="dark"] .${CONTROL_CLASS}[data-placement="global-actions"] .cudloun-post-fonts-toggle{background:transparent;border-color:transparent}
      @media(max-width:700px){
        .${CONTROL_CLASS}[data-placement="floating"]{position:fixed;top:auto;right:14px;bottom:62px;z-index:2020}
        .${CONTROL_CLASS}[data-placement="floating"] .cudloun-post-fonts-toggle{width:46px;height:46px;border-radius:50%;background:#b06a00;color:#fff;box-shadow:0 6px 20px rgba(18,27,43,.3);font-size:23px}
        .${CONTROL_CLASS}[data-placement="floating"] .cudloun-post-fonts-toggle:hover,
        .${CONTROL_CLASS}[data-placement="floating"] .cudloun-post-fonts-toggle[aria-expanded="true"]{background:#8f5600;color:#fff}
        .${CONTROL_CLASS}[data-placement="floating"] .cudloun-post-fonts-panel{top:auto;right:0;bottom:54px}
        .cudloun-post-fonts-panel{width:min(286px,calc(100vw - 20px));max-height:calc(100dvh - 72px);overflow:auto}
        .cudloun-post-fonts-panel--advanced{width:min(330px,calc(100vw - 20px))}
      }
    `;
    document.head.appendChild(style);
  }
})();
