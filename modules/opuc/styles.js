// Removable styles for OPUc composer UI.
(function () {
  "use strict";

  const root = window.Cudloun;
  const runtime = root.opuc = root.opuc || {};
  const STYLE_ID = "cudloun-opuc-style";

  runtime.styles = { install, remove };

  function install() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .cudloun-opuc-launcher-row{box-sizing:border-box;display:flex;align-items:center;width:100%;padding:4px 0 2px var(--cudloun-opuc-launcher-offset,0);min-height:30px}
      .cudloun-opuc-launcher{appearance:none;border:1px solid rgba(70,92,120,.3);border-radius:6px;background:#f4f7fa;color:#243041;cursor:pointer;font:700 12px/1.2 inherit;padding:5px 9px;box-shadow:0 1px 2px rgba(0,0,0,.08)}
      .cudloun-opuc-launcher:hover{border-color:#087ea4;color:#087ea4}
      .cudloun-opuc-launcher:focus-visible{outline:2px solid #087ea4;outline-offset:2px}
      .cudloun-opuc-panel{box-sizing:border-box;display:none;gap:10px;align-items:center;margin:4px 0 8px;padding:9px;border:1px solid rgba(70,92,120,.22);border-radius:8px;background:#f8fafc;color:#243041;font:13px/1.35 inherit}
      .cudloun-opuc-panel[data-open=true]{display:grid;grid-template-columns:56px minmax(0,1fr);grid-template-areas:"preview info" "preview status" "actions actions"}
      .cudloun-opuc-preview{grid-area:preview;width:54px;height:54px;object-fit:cover;border-radius:6px;border:1px solid rgba(70,92,120,.22);background:#fff}
      .cudloun-opuc-file-info{grid-area:info;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700}
      .cudloun-opuc-status{grid-area:status;color:#596579;min-height:18px}
      .cudloun-opuc-panel[data-state=error] .cudloun-opuc-status{color:#b42318}
      .cudloun-opuc-panel[data-state=success] .cudloun-opuc-status{color:#067647}
      .cudloun-opuc-actions{grid-area:actions;display:flex;gap:7px;justify-content:flex-end}
      .cudloun-opuc-action{appearance:none;border:1px solid rgba(70,92,120,.28);border-radius:6px;background:#fff;color:#243041;cursor:pointer;font:700 12px/1.2 inherit;padding:6px 10px}
      .cudloun-opuc-action[data-primary=true]{border-color:#087ea4;background:#087ea4;color:#fff}
      .cudloun-opuc-action:disabled{cursor:default;opacity:.55}
      html[data-cudloun-kapybara-theme=dark] .cudloun-opuc-launcher,
      html[data-cudloun-kapybara-theme=dark] .cudloun-opuc-panel,
      html[data-cudloun-kapybara-theme=dark] .cudloun-opuc-action{background:var(--cudloun-kapybara-surface,#141414);color:var(--cudloun-kapybara-text,#f4f4f4);border-color:var(--cudloun-kapybara-line,#303030)}
      html[data-cudloun-kapybara-theme=dark] .cudloun-opuc-action[data-primary=true]{background:var(--cudloun-kapybara-accent,#d68a1f);color:#fff}
      @media(max-width:620px){.cudloun-opuc-launcher-row{padding-inline-start:0}.cudloun-opuc-panel[data-open=true]{grid-template-columns:48px minmax(0,1fr)}.cudloun-opuc-preview{width:46px;height:46px}}
    `;
    document.head.appendChild(style);
  }

  function remove() {
    document.getElementById(STYLE_ID)?.remove();
  }
})();
