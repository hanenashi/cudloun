// Kapybara dark theme, with the "Temná strana Síly" treatment by Lucifer as its default.
(function () {
  "use strict";

  const root = window.Cudloun;
  const STYLE_ID = "cudloun-kapybara-theme-style";
  const THEME_ATTR = "data-cudloun-kapybara-theme";

  const DEFAULTS = {
    preset: "lucifer",
    accent: "#eba500",
    pitchBlack: true,
    softenCards: false,
  };

  root.registerModule({
    id: "kapybara-theme",
    name: "Kapybara Theme",
    description: "Dark Kapybara skin with Lucifer-inspired black, graphite, amber, and unread rails.",
    version: "0.2.0",
    defaultEnabled: false,
    start(ctx) {
      apply(ctx);
      return () => cleanup();
    },
    renderSettings(ctx) {
      const wrap = document.createElement("div");
      wrap.className = "cudloun-settings-list";

      wrap.appendChild(makeSelectRow(ctx, "Color preset", "preset", [
        ["lucifer", "Temná strana Síly"],
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
        "The default preset adapts Lucifer’s Temná strana Síly: black canvas, graphite post chrome, amber actions, and blue/amber unread rails.",
        "It uses stable Kapybara parts rather than generated classes, and its responsive rules deliberately avoid the original desktop-only negative margins and fixed header height.",
        "It also keeps legacy .code blocks readable when Kapybara dynamically inserts an old-format post.",
        "Visual inspiration: https://userstyles.world/style/29691/temn-strana-sly (Lucifer, CocaColaWare).",
        "Disable the module to remove the theme style and return to native Kapybara colors.",
      ];
    },
  });

  function apply(ctx) {
    if (!root.kapyguts?.isKapybara?.()) return;

    const settings = readSettings(ctx);
    const colors = palette(settings);
    document.documentElement.setAttribute(THEME_ATTR, "dark");
    Object.entries({
      "--cudloun-kapybara-bg": colors.bg,
      "--cudloun-kapybara-surface": colors.surface,
      "--cudloun-kapybara-surface-2": colors.surface2,
      "--cudloun-kapybara-line": colors.line,
      "--cudloun-kapybara-text": colors.text,
      "--cudloun-kapybara-muted": colors.muted,
      "--cudloun-kapybara-unread": colors.unread,
      "--cudloun-kapybara-unread-read": colors.unreadRead,
      "--cudloun-kapybara-accent": settings.accent,
      "--cudloun-kapybara-accent-soft": hexToRgba(settings.accent, 0.18),
      "--cudloun-kapybara-radius": settings.softenCards ? "10px" : "0px",
    }).forEach(([name, value]) => document.documentElement.style.setProperty(name, value));
    installStyle();
    root.log.info("kapybara-theme", "applied", settings);
  }

  function cleanup() {
    document.documentElement.removeAttribute(THEME_ATTR);
    [
      "--cudloun-kapybara-bg", "--cudloun-kapybara-surface", "--cudloun-kapybara-surface-2",
      "--cudloun-kapybara-line", "--cudloun-kapybara-text", "--cudloun-kapybara-muted",
      "--cudloun-kapybara-unread", "--cudloun-kapybara-unread-read", "--cudloun-kapybara-accent",
      "--cudloun-kapybara-accent-soft", "--cudloun-kapybara-radius",
    ].forEach((name) => document.documentElement.style.removeProperty(name));
    document.getElementById(STYLE_ID)?.remove();
    root.log.info("kapybara-theme", "removed");
  }

  function readSettings(ctx) {
    return {
      preset: ctx.storage.get("preset", DEFAULTS.preset),
      accent: validColor(ctx.storage.get("accent", DEFAULTS.accent), DEFAULTS.accent),
      pitchBlack: ctx.storage.get("pitchBlack", DEFAULTS.pitchBlack) !== false,
      softenCards: ctx.storage.get("softenCards", DEFAULTS.softenCards) === true,
    };
  }

  function palette(settings) {
    const presets = {
      lucifer: {
        bg: settings.pitchBlack ? "#000000" : "#0b0b0b",
        surface: "#161819",
        surface2: "#24282b",
        line: "#666666",
        text: "#eeeeee",
        muted: "#aaaaaa",
        unread: "#4f8cbe",
        unreadRead: "#9e6700",
      },
      black: {
        bg: settings.pitchBlack ? "#000000" : "#070707",
        surface: "#141414",
        surface2: "#1f1f1f",
        line: "#303030",
        text: "#f4f4f4",
        muted: "#aaaeb6",
        unread: "#4f8cbe",
        unreadRead: "#9e6700",
      },
      charcoal: {
        bg: "#101214", surface: "#191d21", surface2: "#242a30", line: "#36404a",
        text: "#f2f4f7", muted: "#a8b0ba", unread: "#4f8cbe", unreadRead: "#9e6700",
      },
      blueblack: {
        bg: "#080b10", surface: "#111827", surface2: "#1d2636", line: "#334155",
        text: "#f8fafc", muted: "#a6b1c2", unread: "#4f8cbe", unreadRead: "#9e6700",
      },
    };
    return presets[settings.preset] || presets.lucifer;
  }

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      html[${THEME_ATTR}="dark"]{color-scheme:dark;background:var(--cudloun-kapybara-bg)!important;scrollbar-color:var(--cudloun-kapybara-accent) var(--cudloun-kapybara-bg)}
      html[${THEME_ATTR}="dark"] body,html[${THEME_ATTR}="dark"] #root{background:var(--cudloun-kapybara-bg)!important;color:var(--cudloun-kapybara-text)!important}
      html[${THEME_ATTR}="dark"] :where(body,#root)::before,html[${THEME_ATTR}="dark"] :where(body,#root)::after,html[${THEME_ATTR}="dark"] .🐟-stripes{background:transparent!important;background-image:none!important}

      /* Stable Kapybara chrome: only semantic selectors. */
      html[${THEME_ATTR}="dark"] header:not(.board-header):not(.post-header){background:#1c1816!important;color:var(--cudloun-kapybara-text)!important;border-color:#444!important}
      html[${THEME_ATTR}="dark"] header.board-header,html[${THEME_ATTR}="dark"] main,html[${THEME_ATTR}="dark"] footer,html[${THEME_ATTR}="dark"] nav,html[${THEME_ATTR}="dark"] aside{background:var(--cudloun-kapybara-bg)!important;color:var(--cudloun-kapybara-text)!important;border-color:var(--cudloun-kapybara-line)!important}
      html[${THEME_ATTR}="dark"] :where(.bottom-sheet,[role="dialog"],[role="menu"],.message-card,.conversation-item,.welcome-box,.alert.info){background:var(--cudloun-kapybara-surface)!important;color:var(--cudloun-kapybara-text)!important;border-color:var(--cudloun-kapybara-line)!important}

      html[${THEME_ATTR}="dark"] article.post{background:var(--cudloun-kapybara-bg)!important;color:var(--cudloun-kapybara-text)!important;border-radius:var(--cudloun-kapybara-radius)!important;box-shadow:none!important}
      html[${THEME_ATTR}="dark"] article.post + article.post{border-top:1px solid var(--cudloun-kapybara-line)!important}
      html[${THEME_ATTR}="dark"] article.post .post-header{min-height:24px!important;margin:0!important;padding:3px 0!important;background:var(--cudloun-kapybara-surface-2)!important;color:var(--cudloun-kapybara-text)!important;border-top:1px solid #777!important;border-bottom:1px solid #777!important}
      html[${THEME_ATTR}="dark"] article.post .body{margin-top:12px!important;color:var(--cudloun-kapybara-text)!important}
      html[${THEME_ATTR}="dark"] article.post.unread{background:#202224!important;border-left:6px solid var(--cudloun-kapybara-unread)!important;border-right:2px solid var(--cudloun-kapybara-unread)!important;border-bottom-left-radius:13px!important}
      html[${THEME_ATTR}="dark"] article.post.unread.read{background:var(--cudloun-kapybara-surface)!important;border-left-color:var(--cudloun-kapybara-unread-read)!important;border-right-color:var(--cudloun-kapybara-unread-read)!important}
      html[${THEME_ATTR}="dark"] article.post.muted{opacity:1!important}
      html[${THEME_ATTR}="dark"] article.post.muted :where(.avatar-col,.post-header){opacity:.45!important;filter:saturate(0)}
      html[${THEME_ATTR}="dark"] article.post.unread.muted.read{background:color-mix(in srgb,var(--cudloun-kapybara-surface) 70%,transparent)!important;border-color:#9999996e!important}

      /* Dynamic old-format posts arrive as .code divs, not native pre/code. */
      html[${THEME_ATTR}="dark"] article.post .body > .code{display:block;padding:10px 12px;overflow-x:auto;white-space:pre-wrap!important;tab-size:4;background:#111!important;color:#ddd!important;border:1px solid #444!important;font:13px/1.45 ui-monospace,Consolas,monospace}
      html[${THEME_ATTR}="dark"] article.post :where(pre,.markdown-code){display:block;padding:10px 12px;overflow-x:auto;white-space:pre-wrap!important;tab-size:4;background:#111!important;color:#ddd!important;border:1px solid #444!important}
      html[${THEME_ATTR}="dark"] :where(.meta,.reply-ref,time,small,label,.muted-inline-excerpt){color:var(--cudloun-kapybara-muted)!important}
      html[${THEME_ATTR}="dark"] :where(a,.author,.reply-action,button.date){color:var(--cudloun-kapybara-accent)!important}
      html[${THEME_ATTR}="dark"] :where(a,.reply-action,button):hover{color:#ffcc33!important;text-decoration-color:currentColor!important}
      html[${THEME_ATTR}="dark"] :where(.row,li > a.row){border-color:transparent!important}
      html[${THEME_ATTR}="dark"] :where(.row,li > a.row):hover{background:#151515!important;border-color:#444!important}

      html[${THEME_ATTR}="dark"] :where(button,input,textarea,select,.composer,.composer-entry,section.new-post-composer){background:var(--cudloun-kapybara-surface)!important;color:var(--cudloun-kapybara-text)!important;border-color:var(--cudloun-kapybara-line)!important}
      html[${THEME_ATTR}="dark"] :where(input,textarea,.composer){background:#111!important}
      html[${THEME_ATTR}="dark"] :where(button):hover{background:var(--cudloun-kapybara-accent-soft)!important}
      html[${THEME_ATTR}="dark"] input::placeholder,html[${THEME_ATTR}="dark"] textarea::placeholder{color:var(--cudloun-kapybara-muted)!important}
      html[${THEME_ATTR}="dark"] :where(.avatar,.avatar-button){border-radius:0!important;border-color:#123!important;box-shadow:0 0 0 1px #666!important}
      html[${THEME_ATTR}="dark"] :where(.spoiler){border-color:#666!important}
      html[${THEME_ATTR}="dark"] :where(.spoiler.revealed){background:#323232!important}
      html[${THEME_ATTR}="dark"] :where(.reply-preview){background:#181d21f5!important;border:3px solid #497e8d5e!important}
      html[${THEME_ATTR}="dark"] :where(.🐟-button--primary,.entry-prispet){background:var(--cudloun-kapybara-accent)!important;color:#000!important;border-color:var(--cudloun-kapybara-accent)!important}
      html[${THEME_ATTR}="dark"] :where(.🐟-button--primary,.entry-prispet):hover{background:#ffcc33!important;border-color:#ffcc33!important}
      html[${THEME_ATTR}="dark"] :where(.🐟-button--primary,.entry-prispet):disabled{background:#323232!important;color:#aaa!important;border-color:#666!important}
      html[${THEME_ATTR}="dark"] :where(img,video,canvas):not(.cudloun-mascot){color-scheme:normal}
      html[${THEME_ATTR}="dark"] hr{border-color:var(--cudloun-kapybara-line)!important}

      /* Mobile: retain the treatment without squeezing headers or overlapping posts. */
      @media (max-width:640px){
        html[${THEME_ATTR}="dark"] article.post .post-header{min-height:unset!important;padding:6px 0!important}
        html[${THEME_ATTR}="dark"] article.post .body{margin-top:10px!important}
        html[${THEME_ATTR}="dark"] article.post.unread{border-left-width:4px!important;border-right-width:1px!important;border-bottom-left-radius:10px!important}
        html[${THEME_ATTR}="dark"] :where(.composer-entry,section.new-post-composer){margin-inline:0!important}
        html[${THEME_ATTR}="dark"] article.post .body > .code{padding:8px 10px;font-size:12px}
        html[${THEME_ATTR}="dark"] article.post :where(pre,.markdown-code){padding:8px 10px}
      }
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
    input.checked = ctx.storage.get(key, fallback) === true;
    input.addEventListener("change", () => { ctx.storage.set(key, input.checked); apply(ctx); });
    label.append(text, input);
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
    input.addEventListener("input", () => { ctx.storage.set(key, input.value); apply(ctx); });
    label.append(text, input);
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
    select.addEventListener("change", () => { ctx.storage.set(key, select.value); apply(ctx); });
    label.append(text, select);
    return label;
  }

  function validColor(value, fallback) {
    const text = String(value || "");
    return /^#[0-9a-f]{6}$/i.test(text) ? text : fallback;
  }

  function hexToRgba(hex, alpha) {
    const value = Number.parseInt(validColor(hex, DEFAULTS.accent).slice(1), 16);
    return `rgba(${(value >> 16) & 255},${(value >> 8) & 255},${value & 255},${alpha})`;
  }
})();
