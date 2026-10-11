// Opt-in color schemes for Kapybara. Native mode makes no DOM/CSS changes.
(function () {
  "use strict";

  const root = window.Cudloun;
  const DATA = root.colorSchemesData;
  const STYLE_ID = "cudloun-color-schemes-style";
  const MARKER = "data-cudloun-color-schemes";
  const LEGACY_MARKER = "data-cudloun-kapybara-theme";
  const DEFAULT_ACCENT = "#b85f00";
  const MODES = ["native", "traditional", "light", "dark"];
  let activeContext = null;
  let observer = null;
  let lastResult = { status: "inactive" };

  root.registerModule({
    id: "color-schemes",
    name: "Color Schemes",
    description: "Switch Kapybara's colors or tune its primary color, with one-click return to native.",
    version: "0.1.0",
    defaultEnabled: false,
    start(ctx) {
      if (!root.kapyguts?.isKapybara?.()) return () => {};
      activeContext = ctx;
      apply(ctx);
      if (typeof MutationObserver === "function") {
        observer = new MutationObserver(() => apply(ctx));
        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["data-theme", LEGACY_MARKER],
        });
      }
      return () => {
        observer?.disconnect();
        observer = null;
        activeContext = null;
        clearStyle();
        lastResult = { status: "inactive" };
      };
    },
    renderSettings(ctx) {
      const wrap = document.createElement("div");
      wrap.className = "cudloun-settings-list";
      const mode = readMode(ctx);
      const select = document.createElement("select");
      select.setAttribute("aria-label", "Color scheme");
      [
        ["native", "Native Kapybara (no override)"],
        ["traditional", "Traditional blue"],
        ["light", "Light"],
        ["dark", "Dark"],
      ].forEach(([value, label]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        select.appendChild(option);
      });
      select.value = mode;
      wrap.appendChild(settingRow("Scheme", select));

      const custom = document.createElement("input");
      custom.type = "checkbox";
      custom.checked = ctx.storage.get("customPrimary", false) === true;
      wrap.appendChild(settingRow("Custom primary color", custom));

      const accent = document.createElement("input");
      accent.type = "color";
      accent.value = safeHex(ctx.storage.get("accent", DEFAULT_ACCENT), DEFAULT_ACCENT);
      wrap.appendChild(settingRow("Primary", accent));

      const reset = document.createElement("button");
      reset.type = "button";
      reset.textContent = "Reset to Native";
      wrap.appendChild(reset);

      const status = document.createElement("p");
      status.setAttribute("role", "status");
      wrap.appendChild(status);
      const refresh = () => {
        accent.disabled = select.value === "native" || !custom.checked;
        custom.disabled = select.value === "native";
        const result = activeContext ? lastResult : previewStatus(ctx);
        status.textContent = activeContext ? result.message : `When enabled: ${result.message}`;
      };
      select.addEventListener("change", () => {
        ctx.storage.set("mode", normalizeMode(select.value));
        apply(ctx);
        refresh();
      });
      custom.addEventListener("change", () => {
        ctx.storage.set("customPrimary", custom.checked);
        apply(ctx);
        refresh();
      });
      accent.addEventListener("input", () => {
        ctx.storage.set("accent", safeHex(accent.value, DEFAULT_ACCENT));
        apply(ctx);
        refresh();
      });
      reset.addEventListener("click", () => {
        ctx.storage.set("mode", "native");
        ctx.storage.set("customPrimary", false);
        ctx.storage.set("accent", DEFAULT_ACCENT);
        select.value = "native";
        custom.checked = false;
        accent.value = DEFAULT_ACCENT;
        apply(ctx);
        refresh();
      });
      refresh();
      return wrap;
    },
    renderHelp() {
      return [
        "Native removes every override from this module and leaves Kapybara's own saved preference alone.",
        "Traditional, Light, and Dark use palette values preserved from the temporary Okoun barvy prototype.",
        "If legacy Kapybara Theme is active, this module pauses until that theme is disabled.",
        "Source: https://media.okoun.cz/tmp/okoun-barvy/index.html (captured 2026-10-12).",
      ];
    },
  });

  root.colorSchemes = {
    get state() { return lastResult; },
    reapply() { if (activeContext) apply(activeContext); },
  };

  function settingRow(labelText, control) {
    const label = document.createElement("label");
    label.className = "cudloun-setting-row";
    const text = document.createElement("span");
    text.className = "cudloun-setting-text";
    text.textContent = labelText;
    label.append(text, control);
    return label;
  }

  function readMode(ctx) {
    return normalizeMode(ctx.storage.get("mode", "native"));
  }

  function normalizeMode(value) {
    return MODES.includes(value) ? value : "native";
  }

  function safeHex(value, fallback) {
    return /^#[0-9a-f]{6}$/i.test(String(value || "")) ? String(value).toLowerCase() : fallback;
  }

  function previewStatus(ctx) {
    const mode = readMode(ctx);
    if (mode === "native") return { status: "native", message: "Native Kapybara colors; no override." };
    if (document.documentElement.hasAttribute(LEGACY_MARKER)) {
      return { status: "conflict", message: "Legacy Kapybara Theme is active. Disable it to use Color Schemes." };
    }
    const probe = root.kapyguts?.colorThemeState?.();
    if (!probe?.ready || !validPrefix(probe.tokenPrefix)) {
      return { status: "unsupported", message: "Kapybara color tokens were not recognized; no override was applied." };
    }
    const accent = ctx.storage.get("customPrimary", false) === true ?
      safeHex(ctx.storage.get("accent", DEFAULT_ACCENT), DEFAULT_ACCENT) : DATA.base[mode].primary;
    const visibleAccent = mode === "dark" && ctx.storage.get("customPrimary", false) === true ?
      liftForDark(accent, DATA.base.dark["page-bg"]) : accent;
    const pageRatio = contrast(visibleAccent, DATA.base[mode]["page-bg"]);
    const buttonText = ctx.storage.get("customPrimary", false) === true ?
      (contrast(visibleAccent, "#ffffff") >= contrast(visibleAccent, "#000000") ? "#ffffff" : "#000000") :
      DATA.base[mode]["primary-contrast"];
    const buttonRatio = contrast(buttonText, visibleAccent);
    return {
      status: "applied",
      tokenPrefix: probe.tokenPrefix,
      message: `${mode[0].toUpperCase() + mode.slice(1)} palette · primary/page ${pageRatio.toFixed(2)}:1${pageRatio < 4.5 ? " (low)" : ""}; button text ${buttonRatio.toFixed(2)}:1${buttonRatio < 4.5 ? " (low)" : ""}.`,
    };
  }

  function apply(ctx) {
    const result = previewStatus(ctx);
    lastResult = result;
    if (result.status !== "applied") {
      clearStyle();
      if (result.status === "unsupported") ctx.log?.warn?.(result.message);
      return;
    }
    const mode = readMode(ctx);
    const palette = { ...DATA.base[mode] };
    if (ctx.storage.get("customPrimary", false) === true) {
      const chosen = safeHex(ctx.storage.get("accent", DEFAULT_ACCENT), DEFAULT_ACCENT);
      const primary = mode === "dark" ? liftForDark(chosen, palette["page-bg"]) : chosen;
      palette.primary = primary;
      palette["primary-text"] = primary;
      palette["primary-light"] = mix(primary, "#ffffff", 0.5);
      palette["primary-dark"] = mode === "dark" ? chosen : mix(primary, "#000000", 0.85);
      palette["primary-contrast"] = contrast(primary, "#ffffff") >= contrast(primary, "#000000") ? "#ffffff" : "#000000";
      palette.highlight = rgba(primary, 0.25);
    }
    const prefix = result.tokenPrefix;
    const declarations = Object.entries(palette).map(([key, raw]) => {
      const value = String(raw).replace(/var\(--c-/g, `var(${prefix}`);
      return `${prefix}${key}:${value} !important;`;
    });
    declarations.push(`color-scheme:${mode === "dark" ? "dark" : "light"} !important;`);
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = `html[${MARKER}="active"]{${declarations.join("")}}`;
    document.documentElement.setAttribute(MARKER, "active");
    ctx.log?.info?.("applied", mode);
  }

  function clearStyle() {
    document.getElementById(STYLE_ID)?.remove();
    document.documentElement.removeAttribute(MARKER);
  }

  function validPrefix(prefix) {
    return typeof prefix === "string" && prefix.startsWith("--") &&
      prefix.endsWith("-") && !/[\s;:{}()"'\\]/u.test(prefix);
  }

  function rgb(hex) {
    return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  }

  function mix(a, b, fraction) {
    const left = rgb(a), right = rgb(b);
    return "#" + left.map((channel, i) => Math.round(channel * fraction + right[i] * (1 - fraction))
      .toString(16).padStart(2, "0")).join("");
  }

  function luminance(hex) {
    const channels = rgb(hex).map((value) => {
      const x = value / 255;
      return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  }

  function contrast(a, b) {
    const left = luminance(a), right = luminance(b);
    return (Math.max(left, right) + 0.05) / (Math.min(left, right) + 0.05);
  }

  function liftForDark(chosen, background) {
    let primary = chosen;
    for (let fraction = 0; fraction <= 1 && contrast(primary, background) < 5.5; fraction += 0.02) {
      primary = mix("#ffffff", chosen, fraction);
    }
    return primary;
  }

  function rgba(hex, alpha) {
    return `rgba(${rgb(hex).join(", ")}, ${alpha})`;
  }
})();
