// Cudloun module: Babeta theme overlays.
(function () {
  "use strict";

  const root = window.Cudloun;
  const ID = "theme-tweaks";
  const VERSION = "0.1.0";
  const STYLE_ID = "cudloun-theme-tweaks-style";
  const STORAGE_KEY = "cudloun.module.themeTweaks.v1";
  const UNREAD_MARK = "data-cudloun-theme-unread-pill";

  const presets = {
    pond: {
      label: "Pond",
      bg: "#dce8fa",
      chrome: "#e8f0fc",
      surface: "#f9fbff",
      post: "#ffffff",
      text: "#182230",
      muted: "#5b677a",
      accent: "#7a4a08",
      border: "rgba(74, 91, 123, .24)",
    },
    ink: {
      label: "Ink",
      bg: "#151821",
      chrome: "#202432",
      surface: "#1b1f2b",
      post: "#202635",
      text: "#eef2f7",
      muted: "#b8c0cc",
      accent: "#f0b35a",
      border: "rgba(238, 242, 247, .18)",
    },
    darksilver: {
      label: "Darksilver",
      bg: "#000000",
      chrome: "#101010",
      surface: "#151515",
      post: "#202020",
      text: "#f2f2f2",
      muted: "#a8a8a8",
      accent: "#ffaa33",
      border: "rgba(255, 170, 51, .28)",
    },
    mint: {
      label: "Mint",
      bg: "#e1f1ec",
      chrome: "#edf8f4",
      surface: "#f7fcfa",
      post: "#ffffff",
      text: "#17352f",
      muted: "#4d6f67",
      accent: "#1d7568",
      border: "rgba(36, 101, 89, .24)",
    },
    print: {
      label: "Print",
      bg: "#f3f4f6",
      chrome: "#ffffff",
      surface: "#ffffff",
      post: "#ffffff",
      text: "#111827",
      muted: "#4b5565",
      accent: "#075985",
      border: "rgba(17, 24, 39, .16)",
    },
  };

  const defaults = {
    preset: "pond",
    themeCudloun: false,
  };

  let settings = loadSettings();
  let observer = null;

  root.registerModule({
    id: ID,
    name: "Theme Tweaks",
    description: "Apply Cudloun theme presets over Babeta's native color scheme.",
    version: VERSION,
    defaultEnabled: false,
    start() {
      install();
      return stop;
    },
    stop,
    renderSettings(ctx) {
      const wrap = document.createElement("div");
      wrap.className = "cudloun-settings-list";

      const presetRow = document.createElement("label");
      presetRow.className = "cudloun-setting-row";

      const presetText = document.createElement("span");
      presetText.className = "cudloun-setting-text";
      presetText.textContent = "Theme preset";

      const select = document.createElement("select");
      select.className = "cudloun-select";
      Object.entries(presets).forEach(([value, preset]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = preset.label;
        select.appendChild(option);
      });
      select.value = presets[settings.preset] ? settings.preset : defaults.preset;
      select.addEventListener("change", () => {
        settings.preset = presets[select.value] ? select.value : defaults.preset;
        saveSettings();
        applyTheme();
      });

      presetRow.appendChild(presetText);
      presetRow.appendChild(select);
      wrap.appendChild(presetRow);
      wrap.appendChild(renderCheckbox("themeCudloun", "Theme Cudloun panel", () => ctx.hub.render()));
      return wrap;
    },
    renderHelp() {
      return [
        "Babeta stores its native choice in localStorage as okoun-theme-mode: traditional, light, dark, or system.",
        "Theme Tweaks does not change that native setting. It applies a reversible Cudloun stylesheet on top.",
        "Disable this module to return fully to Babeta's own colors.",
      ];
    },
  });

  function renderCheckbox(name, labelText, afterChange) {
    const label = document.createElement("label");
    label.className = "cudloun-setting-row";

    const text = document.createElement("span");
    text.className = "cudloun-setting-text";
    text.textContent = labelText;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = !!settings[name];
    checkbox.addEventListener("change", () => {
      settings[name] = checkbox.checked;
      saveSettings();
      applyTheme();
      afterChange?.();
    });

    label.appendChild(text);
    label.appendChild(checkbox);
    return label;
  }

  function install() {
    installStyles();
    applyTheme();
    scanUnreadPills();
    if (!observer) {
      observer = new MutationObserver(() => scanUnreadPills());
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
  }

  function stop() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    document.querySelectorAll(`[${UNREAD_MARK}]`).forEach((node) => node.removeAttribute(UNREAD_MARK));
    document.getElementById(STYLE_ID)?.remove();
    document.documentElement.removeAttribute("data-cudloun-theme-tweaks-enabled");
    document.documentElement.removeAttribute("data-cudloun-theme-tweaks-preset");
    document.documentElement.removeAttribute("data-cudloun-theme-tweaks-cudloun");
    [
      "--cudloun-theme-bg",
      "--cudloun-theme-chrome",
      "--cudloun-theme-surface",
      "--cudloun-theme-post",
      "--cudloun-theme-text",
      "--cudloun-theme-muted",
      "--cudloun-theme-accent",
      "--cudloun-theme-border",
    ].forEach((name) => document.documentElement.style.removeProperty(name));
  }

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      html[data-cudloun-theme-tweaks-enabled="true"] body,
      html[data-cudloun-theme-tweaks-enabled="true"] #root {
        background: var(--cudloun-theme-bg) !important;
        color: var(--cudloun-theme-text) !important;
      }

      html[data-cudloun-theme-tweaks-enabled="true"] {
        background: var(--cudloun-theme-bg) !important;
      }

      html[data-cudloun-theme-tweaks-enabled="true"] main,
      html[data-cudloun-theme-tweaks-enabled="true"] .MuiContainer-root,
      html[data-cudloun-theme-tweaks-enabled="true"] .board-page-container {
        background: var(--cudloun-theme-bg) !important;
        color: var(--cudloun-theme-text) !important;
      }

      html[data-cudloun-theme-tweaks-enabled="true"] .MuiAppBar-root,
      html[data-cudloun-theme-tweaks-enabled="true"] .MuiBottomNavigation-root {
        background: var(--cudloun-theme-chrome) !important;
        color: var(--cudloun-theme-text) !important;
        border-color: var(--cudloun-theme-border) !important;
      }

      html[data-cudloun-theme-tweaks-enabled="true"] .board-page-container > .MuiBox-root,
      html[data-cudloun-theme-tweaks-enabled="true"] .page-header {
        background: var(--cudloun-theme-chrome) !important;
        color: var(--cudloun-theme-text) !important;
        border-color: var(--cudloun-theme-border) !important;
      }

      html[data-cudloun-theme-tweaks-enabled="true"] .board-page-container > .MuiBox-root .MuiBox-root,
      html[data-cudloun-theme-tweaks-enabled="true"] .page-header .MuiBox-root,
      html[data-cudloun-theme-tweaks-enabled="true"] .nav-links .MuiBox-root,
      html[data-cudloun-theme-tweaks-enabled="true"] .MuiListItemSecondaryAction-root .MuiBox-root {
        background: transparent !important;
      }

      html[data-cudloun-theme-tweaks-enabled="true"] .MuiDrawer-paper,
      html[data-cudloun-theme-tweaks-enabled="true"] .MuiMenu-paper,
      html[data-cudloun-theme-tweaks-enabled="true"] .MuiPopover-paper,
      html[data-cudloun-theme-tweaks-enabled="true"] .MuiDialog-paper,
      html[data-cudloun-theme-tweaks-enabled="true"] .MuiPaper-root.MuiPaper-outlined {
        background: var(--cudloun-theme-surface) !important;
        color: var(--cudloun-theme-text) !important;
        border-color: var(--cudloun-theme-border) !important;
      }

      html[data-cudloun-theme-tweaks-enabled="true"] .content-item.board-post,
      html[data-cudloun-theme-tweaks-enabled="true"] .board-info,
      html[data-cudloun-theme-tweaks-enabled="true"] .MuiPaper-root.content-item {
        background: var(--cudloun-theme-post) !important;
        color: var(--cudloun-theme-text) !important;
        border-color: var(--cudloun-theme-border) !important;
      }

      html[data-cudloun-theme-tweaks-enabled="true"] .MuiTypography-root,
      html[data-cudloun-theme-tweaks-enabled="true"] .MuiListItemText-primary,
      html[data-cudloun-theme-tweaks-enabled="true"] .MuiListItemText-secondary {
        color: inherit !important;
      }

      html[data-cudloun-theme-tweaks-enabled="true"] .MuiTypography-colorTextSecondary,
      html[data-cudloun-theme-tweaks-enabled="true"] .MuiFormHelperText-root,
      html[data-cudloun-theme-tweaks-enabled="true"] .MuiInputLabel-root {
        color: var(--cudloun-theme-muted) !important;
      }

      html[data-cudloun-theme-tweaks-enabled="true"] a,
      html[data-cudloun-theme-tweaks-enabled="true"] .MuiLink-root,
      html[data-cudloun-theme-tweaks-enabled="true"] .MuiButton-text,
      html[data-cudloun-theme-tweaks-enabled="true"] .MuiIconButton-root {
        color: var(--cudloun-theme-accent) !important;
      }

      html[data-cudloun-theme-tweaks-enabled="true"] input,
      html[data-cudloun-theme-tweaks-enabled="true"] textarea,
      html[data-cudloun-theme-tweaks-enabled="true"] .MuiInputBase-root {
        background: var(--cudloun-theme-surface) !important;
        color: var(--cudloun-theme-text) !important;
      }

      html[data-cudloun-theme-tweaks-enabled="true"] .MuiOutlinedInput-notchedOutline,
      html[data-cudloun-theme-tweaks-enabled="true"] hr {
        border-color: var(--cudloun-theme-border) !important;
      }

      html[data-cudloun-theme-tweaks-enabled="true"] .MuiAvatar-root {
        background: transparent !important;
        border-color: transparent !important;
        box-shadow: none !important;
      }

      html[data-cudloun-theme-tweaks-enabled="true"] .MuiAvatar-root img,
      html[data-cudloun-theme-tweaks-enabled="true"] img.MuiBox-root {
        border-color: transparent !important;
        box-shadow: none !important;
      }

      html[data-cudloun-theme-tweaks-enabled="true"] [${UNREAD_MARK}] {
        background: color-mix(in srgb, var(--cudloun-theme-accent) 18%, var(--cudloun-theme-surface)) !important;
        color: var(--cudloun-theme-accent) !important;
        border-color: color-mix(in srgb, var(--cudloun-theme-accent) 55%, transparent) !important;
        box-shadow: none !important;
        font-weight: 750 !important;
      }

      html[data-cudloun-theme-tweaks-enabled="true"][data-cudloun-theme-tweaks-preset="darksilver"] [${UNREAD_MARK}] {
        background: #0f0f0f !important;
        color: #ffaa33 !important;
        border-color: rgba(255, 170, 51, .5) !important;
      }

      html[data-cudloun-theme-tweaks-enabled="true"][data-cudloun-theme-tweaks-preset="darksilver"] .avatar-container {
        width: 36px !important;
        height: 36px !important;
        overflow: hidden !important;
        border-radius: 0 !important;
        background: transparent !important;
      }

      html[data-cudloun-theme-tweaks-enabled="true"][data-cudloun-theme-tweaks-preset="darksilver"] .avatar-container .MuiAvatar-root.content-avatar {
        width: 36px !important;
        height: 36px !important;
        min-width: 36px !important;
        border: 0 !important;
        border-radius: 0 !important;
        overflow: hidden !important;
        background: transparent !important;
        box-shadow: none !important;
      }

      html[data-cudloun-theme-tweaks-enabled="true"][data-cudloun-theme-tweaks-preset="darksilver"] .avatar-container .MuiAvatar-root.content-avatar img {
        width: 36px !important;
        height: 36px !important;
        object-fit: contain !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }

      html[data-cudloun-theme-tweaks-enabled="true"][data-cudloun-theme-tweaks-cudloun="true"] .cudloun-dialog,
      html[data-cudloun-theme-tweaks-enabled="true"][data-cudloun-theme-tweaks-cudloun="true"] .cudloun-feedback,
      html[data-cudloun-theme-tweaks-enabled="true"][data-cudloun-theme-tweaks-cudloun="true"] .cudloun-container-card,
      html[data-cudloun-theme-tweaks-enabled="true"][data-cudloun-theme-tweaks-cudloun="true"] .cudloun-setting-row {
        background: var(--cudloun-theme-surface) !important;
        color: var(--cudloun-theme-text) !important;
        border-color: var(--cudloun-theme-border) !important;
      }
    `;
    document.head.appendChild(style);
  }

  function applyTheme() {
    const preset = presets[settings.preset] || presets[defaults.preset];
    document.documentElement.setAttribute("data-cudloun-theme-tweaks-enabled", "true");
    document.documentElement.setAttribute("data-cudloun-theme-tweaks-preset", settings.preset);
    document.documentElement.setAttribute("data-cudloun-theme-tweaks-cudloun", settings.themeCudloun ? "true" : "false");

    Object.entries({
      "--cudloun-theme-bg": preset.bg,
      "--cudloun-theme-chrome": preset.chrome,
      "--cudloun-theme-surface": preset.surface,
      "--cudloun-theme-post": preset.post,
      "--cudloun-theme-text": preset.text,
      "--cudloun-theme-muted": preset.muted,
      "--cudloun-theme-accent": preset.accent,
      "--cudloun-theme-border": preset.border,
    }).forEach(([name, value]) => {
      document.documentElement.style.setProperty(name, value);
    });
  }

  function scanUnreadPills() {
    document.querySelectorAll("span").forEach((label) => {
      if (!/^(\d+)\s+nov(?:ý|é|ých)$/i.test(label.textContent.trim())) return;
      const chip = label.closest(".MuiChip-root") || label.parentElement;
      if (chip) chip.setAttribute(UNREAD_MARK, "true");
    });
  }

  function loadSettings() {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
    } catch (error) {
      return { ...defaults };
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      root.log.warn("theme-tweaks", "settings could not be saved", error);
    }
  }
})();
