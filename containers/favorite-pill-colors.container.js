// Standalone Cudloun container: color favorite unread counter pills.
(function () {
  "use strict";

  const ID = "favorite-pill-colors";
  const STYLE_ID = "cudloun-container-favorite-pill-colors-style";
  const MARK = "data-cudloun-favorite-pill-color";
  let observer = null;

  const api = {
    id: ID,
    name: "Favorite Pill Colors",
    run,
    stop,
  };

  window.CudlounFavoritePillColors = api;

  if (window.CudlounContainerRegistry && typeof window.CudlounContainerRegistry.register === "function") {
    window.CudlounContainerRegistry.register(api);
  }

  if (!window.CudlounContainerRegistry) {
    run();
  }

  return api;

  function run() {
    installStyles();
    scan();

    if (!observer) {
      observer = new MutationObserver(() => scan());
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    console.log("[cudloun-container] favorite pill colors active");
    return api;
  }

  function stop() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }

    document.querySelectorAll(`[${MARK}]`).forEach((chip) => {
      chip.removeAttribute(MARK);
      chip.removeAttribute("title");
    });

    document.getElementById(STYLE_ID)?.remove();
    console.log("[cudloun-container] favorite pill colors stopped");
  }

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      [${MARK}="low"] {
        border-color: #2e7d32 !important;
        background: #dff5e3 !important;
        color: #17451e !important;
        font-weight: 700 !important;
      }

      [${MARK}="mid"] {
        border-color: #b26a00 !important;
        background: #fff1cc !important;
        color: #5f3700 !important;
        font-weight: 700 !important;
      }

      [${MARK}="hot"] {
        border-color: #c62828 !important;
        background: #ffe0e0 !important;
        color: #7f1111 !important;
        font-weight: 800 !important;
      }

      [${MARK}="wild"] {
        border-color: #6a1b9a !important;
        background: #efe1ff !important;
        color: #3d0b5f !important;
        font-weight: 900 !important;
        box-shadow: 0 0 0 2px rgba(106, 27, 154, 0.12) !important;
      }
    `;
    document.head.appendChild(style);
  }

  function scan() {
    document.querySelectorAll("span").forEach((label) => {
      const text = label.textContent.trim();
      const match = text.match(/^(\d+)\s+nov(?:ý|é|ých)$/i);
      if (!match) return;

      const chip = label.closest(".MuiChip-root") || label.parentElement;
      if (!chip) return;

      const count = Number(match[1]);
      chip.setAttribute(MARK, bucket(count));
      chip.title = `Cudloun demo: ${count} unread`;
    });
  }

  function bucket(count) {
    if (count >= 100) return "wild";
    if (count >= 20) return "hot";
    if (count >= 5) return "mid";
    return "low";
  }
})();
