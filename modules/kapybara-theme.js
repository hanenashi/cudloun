// Kapybara dark theme.
(function () {
  "use strict";

  const root = window.Cudloun;
  const STYLE_ID = "cudloun-kapybara-theme-style";
  const THEME_ATTR = "data-cudloun-kapybara-theme";

  const DEFAULTS = {
    preset: "black",
    accent: "#d68a1f",
    pitchBlack: true,
    softenCards: true,
  };

  root.registerModule({
    id: "kapybara-theme",
    name: "Kapybara Theme",
    description: "Dark theme experiment for Kapybara pages.",
    version: "0.1.0",
    defaultEnabled: false,
    start(ctx) {
      apply(ctx);
      return () => cleanup();
    },
    renderSettings(ctx) {
      const wrap = document.createElement("div");
      wrap.className = "cudloun-settings-list";

      wrap.appendChild(makeSelectRow(ctx, "Color preset", "preset", [
        ["black", "Black"],
        ["charcoal", "Charcoal"],
        ["blueblack", "Blue black"],
      ]));
      wrap.appendChild(makeColorRow(ctx, "Accent", "accent", DEFAULTS.accent));
      wrap.appendChild(makeCheckboxRow(ctx, "Pitch black page", "pitchBlack", DEFAULTS.pitchBlack));
      wrap.appendChild(makeCheckboxRow(ctx, "Softer post cards", "softenCards", DEFAULTS.softenCards));

      return wrap;
    },
    renderHelp() {
      return [
        "Enable this module to apply a Cudloun dark theme to Kapybara.",
        "The first pass uses semantic Kapybara classes where possible and keeps generated class overrides minimal.",
        "Disable the module to remove the theme style and return to native Kapybara colors.",
      ];
    },
  });

  function apply(ctx) {
    if (!root.kapyguts?.isKapybara?.()) return;

    const settings = readSettings(ctx);
    document.documentElement.setAttribute(THEME_ATTR, "dark");
    document.documentElement.style.setProperty("--cudloun-kapybara-bg", palette(settings).bg);
    document.documentElement.style.setProperty("--cudloun-kapybara-surface", palette(settings).surface);
    document.documentElement.style.setProperty("--cudloun-kapybara-surface-2", palette(settings).surface2);
    document.documentElement.style.setProperty("--cudloun-kapybara-line", palette(settings).line);
    document.documentElement.style.setProperty("--cudloun-kapybara-text", palette(settings).text);
    document.documentElement.style.setProperty("--cudloun-kapybara-muted", palette(settings).muted);
    document.documentElement.style.setProperty("--cudloun-kapybara-accent", settings.accent);
    document.documentElement.style.setProperty("--cudloun-kapybara-accent-soft", hexToRgba(settings.accent, 0.16));
    document.documentElement.style.setProperty("--cudloun-kapybara-radius", settings.softenCards ? "10px" : "0px");
    installStyle();
    root.log.info("kapybara-theme", "applied", settings);
  }

  function cleanup() {
    document.documentElement.removeAttribute(THEME_ATTR);
    [
      "--cudloun-kapybara-bg",
      "--cudloun-kapybara-surface",
      "--cudloun-kapybara-surface-2",
      "--cudloun-kapybara-line",
      "--cudloun-kapybara-text",
      "--cudloun-kapybara-muted",
      "--cudloun-kapybara-accent",
      "--cudloun-kapybara-accent-soft",
      "--cudloun-kapybara-radius",
    ].forEach((name) => document.documentElement.style.removeProperty(name));
    document.getElementById(STYLE_ID)?.remove();
    root.log.info("kapybara-theme", "removed");
  }

  function readSettings(ctx) {
    return {
      preset: ctx.storage.get("preset", DEFAULTS.preset),
      accent: validColor(ctx.storage.get("accent", DEFAULTS.accent), DEFAULTS.accent),
      pitchBlack: ctx.storage.get("pitchBlack", DEFAULTS.pitchBlack) !== false,
      softenCards: ctx.storage.get("softenCards", DEFAULTS.softenCards) !== false,
    };
  }

  function palette(settings) {
    const presets = {
      black: {
        bg: settings.pitchBlack ? "#000000" : "#070707",
        surface: "#141414",
        surface2: "#1f1f1f",
        line: "#303030",
        text: "#f4f4f4",
        muted: "#aaaeb6",
      },
      charcoal: {
        bg: "#101214",
        surface: "#191d21",
        surface2: "#242a30",
        line: "#36404a",
        text: "#f2f4f7",
        muted: "#a8b0ba",
      },
      blueblack: {
        bg: "#080b10",
        surface: "#111827",
        surface2: "#1d2636",
        line: "#334155",
        text: "#f8fafc",
        muted: "#a6b1c2",
      },
    };
    return presets[settings.preset] || presets.black;
  }

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      html[${THEME_ATTR}="dark"]{color-scheme:dark;background:var(--cudloun-kapybara-bg)!important;scrollbar-color:var(--cudloun-kapybara-accent) var(--cudloun-kapybara-bg)}
      html[${THEME_ATTR}="dark"] body,
      html[${THEME_ATTR}="dark"] #root{background:var(--cudloun-kapybara-bg)!important;color:var(--cudloun-kapybara-text)!important}
      html[${THEME_ATTR}="dark"] body::before,
      html[${THEME_ATTR}="dark"] body::after,
      html[${THEME_ATTR}="dark"] #root::before,
      html[${THEME_ATTR}="dark"] #root::after{background:transparent!important;background-image:none!important}

      html[${THEME_ATTR}="dark"] :where(main,header,nav,footer,aside,section,form):not(.cudloun-dialog):not(.cudloun-backdrop):not([class^="cudloun-"]){background-color:var(--cudloun-kapybara-bg)!important;color:var(--cudloun-kapybara-text)!important;border-color:var(--cudloun-kapybara-line)!important}
      html[${THEME_ATTR}="dark"] :where(.post,.post-main,.message-card,.conversation-item,.bottom-sheet,[role="dialog"],[role="menu"]):not(.cudloun-dialog):not(.cudloun-backdrop):not([class^="cudloun-"]){background:var(--cudloun-kapybara-surface)!important;color:var(--cudloun-kapybara-text)!important;border-color:var(--cudloun-kapybara-line)!important}
      html[${THEME_ATTR}="dark"] article.post{border-radius:var(--cudloun-kapybara-radius)!important;box-shadow:none!important}
      html[${THEME_ATTR}="dark"] article.post + article.post{border-top:1px solid var(--cudloun-kapybara-line)!important}
      html[${THEME_ATTR}="dark"] .post-header,
      html[${THEME_ATTR}="dark"] .meta,
      html[${THEME_ATTR}="dark"] .reply-ref,
      html[${THEME_ATTR}="dark"] .actions,
      html[${THEME_ATTR}="dark"] .conversation-item{border-color:var(--cudloun-kapybara-line)!important}

      html[${THEME_ATTR}="dark"] :where(.body,.markdown,.post-main,p,li,span,div):not(.cudloun-dialog *):not([class^="cudloun-"]){color:inherit}
      html[${THEME_ATTR}="dark"] :where(.meta,.reply-ref,time,small,label):not(.cudloun-dialog *):not([class^="cudloun-"]){color:var(--cudloun-kapybara-muted)!important}
      html[${THEME_ATTR}="dark"] :where(a,.author,.reply-action,button.date):not(.cudloun-dialog *):not([class^="cudloun-"]){color:var(--cudloun-kapybara-accent)!important}
      html[${THEME_ATTR}="dark"] :where(a):not(.cudloun-dialog *){text-decoration-color:color-mix(in srgb,var(--cudloun-kapybara-accent) 60%,transparent)!important}

      html[${THEME_ATTR}="dark"] :where(button,input,textarea,select):not(.cudloun-dialog *):not([class^="cudloun-"]){background:var(--cudloun-kapybara-surface-2)!important;color:var(--cudloun-kapybara-text)!important;border-color:var(--cudloun-kapybara-line)!important}
      html[${THEME_ATTR}="dark"] :where(button):not(.cudloun-dialog *):not([class^="cudloun-"]):hover{background:var(--cudloun-kapybara-accent-soft)!important}
      html[${THEME_ATTR}="dark"] input::placeholder,
      html[${THEME_ATTR}="dark"] textarea::placeholder{color:var(--cudloun-kapybara-muted)!important}

      html[${THEME_ATTR}="dark"] .avatar,
      html[${THEME_ATTR}="dark"] .avatar img,
      html[${THEME_ATTR}="dark"] .avatar-button img,
      html[${THEME_ATTR}="dark"] .avatar-shell img{background:transparent!important;border-color:transparent!important}
      html[${THEME_ATTR}="dark"] :where(img,video,canvas):not(.cudloun-mascot){color-scheme:normal}
      html[${THEME_ATTR}="dark"] :where(hr){border-color:var(--cudloun-kapybara-line)!important}
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
    input.addEventListener("change", () => {
      ctx.storage.set(key, input.checked);
      apply(ctx);
    });

    label.appendChild(text);
    label.appendChild(input);
    return label;
  }

  function makeColorRow(ctx, labelText, key, fallback) {
    const label = document.createElement("label");
    label.className = "cudloun-setting-row";

    const text = document.createElement("span");
    text.className = "cudloun-setting-text";
    text.textContent = labelText;

    const input = document.createElement("input");
    input.type = "color";
    input.value = validColor(ctx.storage.get(key, fallback), fallback);
    input.addEventListener("input", () => {
      ctx.storage.set(key, input.value);
      apply(ctx);
    });

    label.appendChild(text);
    label.appendChild(input);
    return label;
  }

  function makeSelectRow(ctx, labelText, key, options) {
    const label = document.createElement("label");
    label.className = "cudloun-setting-row";

    const text = document.createElement("span");
    text.className = "cudloun-setting-text";
    text.textContent = labelText;

    const select = document.createElement("select");
    select.className = "cudloun-select";
    const current = ctx.storage.get(key, DEFAULTS[key]);
    options.forEach(([value, name]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = name;
      option.selected = value === current;
      select.appendChild(option);
    });
    select.addEventListener("change", () => {
      ctx.storage.set(key, select.value);
      apply(ctx);
    });

    label.appendChild(text);
    label.appendChild(select);
    return label;
  }

  function validColor(value, fallback) {
    const text = String(value || "");
    return /^#[0-9a-f]{6}$/i.test(text) ? text : fallback;
  }

  function hexToRgba(hex, alpha) {
    const clean = validColor(hex, DEFAULTS.accent).slice(1);
    const value = Number.parseInt(clean, 16);
    const red = (value >> 16) & 255;
    const green = (value >> 8) & 255;
    const blue = value & 255;
    return `rgba(${red},${green},${blue},${alpha})`;
  }
})();
