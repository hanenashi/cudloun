// Standalone Cudloun container: tune mobile board post text width.
(function () {
  "use strict";

  const ID = "text-width";
  const STYLE_ID = "cudloun-container-text-width-style";
  const PANEL_ID = "cudloun-container-text-width-panel";
  const STORAGE_KEY = "cudloun.container.textWidth.v1";
  const MARK_POST = "data-cudloun-text-width-post";
  const MARK_ROW = "data-cudloun-text-width-row";
  const MARK_AVATAR = "data-cudloun-text-width-avatar";
  const MARK_CONTENT = "data-cudloun-text-width-content";
  const MARK_HEADER = "data-cudloun-text-width-header";
  const MARK_BODY = "data-cudloun-text-width-body";
  const MARK_ACTIONS = "data-cudloun-text-width-actions";

  const defaults = {
    enabled: true,
    avatarSize: 28,
    sidePadding: 4,
    headerScale: 88,
  };

  let observer = null;
  let settings = loadSettings();

  const api = {
    id: ID,
    name: "Text Width",
    run,
    stop,
  };

  window.CudlounTextWidth = api;

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
    applySettings();
    scan();

    if (!observer) {
      observer = new MutationObserver(() => scan());
      observer.observe(document.body, { childList: true, subtree: true });
    }

    console.log("[cudloun-container] text width active");
    return api;
  }

  function stop() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }

    document.querySelectorAll([
      `[${MARK_POST}]`,
      `[${MARK_ROW}]`,
      `[${MARK_AVATAR}]`,
      `[${MARK_CONTENT}]`,
      `[${MARK_HEADER}]`,
      `[${MARK_BODY}]`,
      `[${MARK_ACTIONS}]`,
    ].join(",")).forEach((node) => {
      node.removeAttribute(MARK_POST);
      node.removeAttribute(MARK_ROW);
      node.removeAttribute(MARK_AVATAR);
      node.removeAttribute(MARK_CONTENT);
      node.removeAttribute(MARK_HEADER);
      node.removeAttribute(MARK_BODY);
      node.removeAttribute(MARK_ACTIONS);
    });

    document.getElementById(PANEL_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();
    document.documentElement.removeAttribute("data-cudloun-text-width-enabled");
    console.log("[cudloun-container] text width stopped");
  }

  function scan() {
    document.querySelectorAll(".content-item.board-post").forEach(markPost);
  }

  function markPost(post) {
    const avatar = post.querySelector(".avatar-container");
    if (!avatar) return;

    const row = avatar.parentElement;
    const content = avatar.nextElementSibling;
    if (!row || !content) return;

    const header = content.firstElementChild;
    const body = Array.from(content.children).find((child) => child !== header && child.textContent.trim());
    const actions = Array.from(post.children).find((child) => child.textContent.includes("ODPOV"));

    post.setAttribute(MARK_POST, "true");
    row.setAttribute(MARK_ROW, "true");
    avatar.setAttribute(MARK_AVATAR, "true");
    content.setAttribute(MARK_CONTENT, "true");
    if (header) header.setAttribute(MARK_HEADER, "true");
    if (body) body.setAttribute(MARK_BODY, "true");
    if (actions) actions.setAttribute(MARK_ACTIONS, "true");
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
        width: min(310px, calc(100vw - 20px));
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

      #${PANEL_ID} .cudloun-text-width-actions {
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

      @media (max-width: 700px) {
        html[data-cudloun-text-width-enabled="true"] [${MARK_POST}] {
          padding-left: var(--cudloun-text-width-side-padding, 4px) !important;
          padding-right: var(--cudloun-text-width-side-padding, 4px) !important;
        }

        html[data-cudloun-text-width-enabled="true"] [${MARK_ROW}] {
          display: flex !important;
          flex-direction: column !important;
          align-items: stretch !important;
          gap: 2px !important;
        }

        html[data-cudloun-text-width-enabled="true"] [${MARK_AVATAR}] {
          width: var(--cudloun-text-width-avatar-size, 28px) !important;
          height: var(--cudloun-text-width-avatar-size, 28px) !important;
          min-width: 0 !important;
          align-self: flex-start !important;
          margin: 0 0 -2px 0 !important;
        }

        html[data-cudloun-text-width-enabled="true"] [${MARK_AVATAR}] .content-avatar,
        html[data-cudloun-text-width-enabled="true"] [${MARK_AVATAR}] .MuiAvatar-root {
          width: var(--cudloun-text-width-avatar-size, 28px) !important;
          height: var(--cudloun-text-width-avatar-size, 28px) !important;
          font-size: calc(var(--cudloun-text-width-avatar-size, 28px) * .42) !important;
        }

        html[data-cudloun-text-width-enabled="true"] [${MARK_CONTENT}] {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          margin-left: 0 !important;
        }

        html[data-cudloun-text-width-enabled="true"] [${MARK_HEADER}] {
          width: 100% !important;
          min-width: 0 !important;
          display: flex !important;
          flex-wrap: wrap !important;
          align-items: baseline !important;
          column-gap: 6px !important;
          row-gap: 0 !important;
          min-height: 0 !important;
          height: auto !important;
          font-size: calc(var(--cudloun-text-width-header-scale, 88) * 1%) !important;
          line-height: 1.18 !important;
          overflow-wrap: anywhere !important;
        }

        html[data-cudloun-text-width-enabled="true"] [${MARK_HEADER}] * {
          max-width: 100% !important;
          min-width: 0 !important;
          line-height: 1.18 !important;
          overflow-wrap: anywhere !important;
          white-space: normal !important;
        }

        html[data-cudloun-text-width-enabled="true"] [${MARK_BODY}] {
          width: 100% !important;
          max-width: 100% !important;
          margin-left: 0 !important;
          padding-left: 0 !important;
          overflow-wrap: anywhere !important;
        }

        html[data-cudloun-text-width-enabled="true"] [${MARK_ACTIONS}] {
          width: 100% !important;
          max-width: 100% !important;
          margin-left: 0 !important;
          padding-left: 0 !important;
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
        <summary>Text Width</summary>
        <label>
          <span>Compact posts</span>
          <input data-setting="enabled" type="checkbox">
        </label>
        <label>
          <span>Avatar</span>
          <output data-output="avatarSize"></output>
          <input data-setting="avatarSize" type="range" min="18" max="40" step="1">
        </label>
        <label>
          <span>Side padding</span>
          <output data-output="sidePadding"></output>
          <input data-setting="sidePadding" type="range" min="0" max="16" step="1">
        </label>
        <label>
          <span>Header size</span>
          <output data-output="headerScale"></output>
          <input data-setting="headerScale" type="range" min="72" max="105" step="1">
        </label>
        <div class="cudloun-text-width-actions">
          <button type="button" data-action="reset">Reset</button>
          <button type="button" data-action="hide">Hide</button>
        </div>
      </details>
    `;

    panel.querySelectorAll("[data-setting]").forEach((input) => {
      input.addEventListener("input", () => {
        settings[input.dataset.setting] = input.type === "checkbox" ? input.checked : Number(input.value);
        saveSettings();
        applySettings();
      });
    });

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
    document.documentElement.setAttribute("data-cudloun-text-width-enabled", settings.enabled ? "true" : "false");
    rootStyle.setProperty("--cudloun-text-width-avatar-size", `${settings.avatarSize}px`);
    rootStyle.setProperty("--cudloun-text-width-side-padding", `${settings.sidePadding}px`);
    rootStyle.setProperty("--cudloun-text-width-header-scale", String(settings.headerScale));

    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;

    setInput(panel, "enabled", settings.enabled);
    setInput(panel, "avatarSize", settings.avatarSize);
    setInput(panel, "sidePadding", settings.sidePadding);
    setInput(panel, "headerScale", settings.headerScale);
    setOutput(panel, "avatarSize", `${settings.avatarSize}px`);
    setOutput(panel, "sidePadding", `${settings.sidePadding}px`);
    setOutput(panel, "headerScale", `${settings.headerScale}%`);
  }

  function setInput(panel, name, value) {
    const input = panel.querySelector(`[data-setting="${name}"]`);
    if (!input) return;
    if (input.type === "checkbox") input.checked = !!value;
    else input.value = String(value);
  }

  function setOutput(panel, name, value) {
    const output = panel.querySelector(`[data-output="${name}"]`);
    if (output) output.textContent = value;
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
      console.warn("[cudloun-container] text width settings could not be saved", error);
    }
  }
})();
