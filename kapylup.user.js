// ==UserScript==
// @name         Kapylup
// @namespace    https://github.com/hanenashi/cudloun
// @version      0.1.3
// @description  Interactive Kapyguts-powered Kapybara element explorer.
// @author       hanenashi
// @match        https://kapybara.okoun.cz/*
// @run-at       document-idle
// @require      https://raw.githubusercontent.com/hanenashi/cudloun/main/modules/sys-kapyguts.js?v=0.6.31
// @updateURL    https://raw.githubusercontent.com/hanenashi/cudloun/main/kapylup.user.js
// @downloadURL  https://raw.githubusercontent.com/hanenashi/cudloun/main/kapylup.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.registerMenuCommand
// @grant        GM.setClipboard
// ==/UserScript==

(function () {
  "use strict";

  const VERSION = "0.1.3";
  const SETTINGS_KEY = "kapylup.settings.v1";
  const DEFAULTS = Object.freeze({
    hotkey: "K",
    cyclePreviousKey: "[",
    cycleNextKey: "]",
    showPanelOnSelection: true,
    panel: { left: 24, top: 72, width: 430, height: 560 },
  });
  const state = {
    settings: null,
    selecting: false,
    panelVisible: false,
    view: "welcome",
    selectedElement: null,
    result: null,
    related: [],
    uiHost: null,
    shadow: null,
    panel: null,
    panelBody: null,
    panelTitle: null,
    modeBadge: null,
    cycleNav: null,
    highlight: null,
    cursorStyle: null,
    hoverFrame: 0,
    lastWheelCycle: 0,
    hoveredElement: null,
    candidates: [],
    candidateIndex: -1,
    pointer: { x: 0, y: 0 },
    badgeTimer: 0,
    saveGeometryTimer: 0,
    resizeObserver: null,
  };

  if (window.Kapylup?.version) return;
  void start();

  async function start() {
    const kapyguts = window.Kapyguts;
    if (!kapyguts?.explain) {
      console.error("[Kapylup] Kapyguts did not load; interactive explorer is unavailable.");
      return;
    }
    state.settings = normalizeSettings(await readSetting(SETTINGS_KEY, DEFAULTS));
    installUi();
    installEvents();
    registerMenus();
    exposeApi();
    renderWelcome();
    console.info(`[Kapylup ${VERSION}] ready; Kapyguts ${kapyguts.version}; hotkey ${state.settings.hotkey}`);
  }

  function exposeApi() {
    window.Kapylup = Object.freeze({
      version: VERSION,
      kapygutsVersion: window.Kapyguts.version,
      toggle: toggleSelection,
      startSelection: () => setSelecting(true),
      stopSelection: () => setSelecting(false),
      inspect: inspectElement,
      show: showPanel,
      hide: hidePanel,
      settings: openSettings,
    });
  }

  function installUi() {
    const host = document.createElement("div");
    host.setAttribute("data-kapylup-ui", "true");
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <style>
        :host {
          all: initial;
          position: fixed;
          inset: 0;
          z-index: 2147483647;
          pointer-events: none;
          color-scheme: dark;
        }
        *, *::before, *::after { box-sizing: border-box; }
        button, input { font: inherit; }
        .window {
          position: fixed;
          display: none;
          min-width: 280px;
          min-height: 260px;
          max-width: calc(100vw - 8px);
          max-height: calc(100vh - 8px);
          overflow: hidden;
          resize: both;
          border: 1px solid #71512d;
          border-radius: 3px;
          background: #111315;
          box-shadow: 0 14px 46px rgba(0,0,0,.62);
          color: #e8e2d8;
          font: 13px/1.4 ui-monospace, SFMono-Regular, Consolas, monospace;
          pointer-events: auto;
        }
        .window[data-visible="true"] { display: grid; grid-template-rows: auto minmax(0,1fr); }
        .window-header {
          display: grid;
          grid-template-columns: minmax(0,1fr) auto auto auto auto;
          align-items: center;
          min-height: 38px;
          padding-left: 10px;
          border-bottom: 1px solid #39342d;
          background: #1b1917;
          cursor: move;
          touch-action: none;
          user-select: none;
        }
        .window-title { overflow: hidden; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
        .version { padding: 0 7px; color: #a9a097; font-size: 11px; }
        .header-button {
          width: 38px;
          height: 38px;
          padding: 0;
          border: 0;
          background: transparent;
          color: #e8e2d8;
          cursor: pointer;
        }
        .header-button:hover, .header-button:focus-visible { background: #33281d; outline: 1px solid #d7872d; }
        .window-body { min-height: 0; padding: 10px; overflow: auto; }
        .intro { margin: 0 0 10px; color: #bbb3a9; }
        .toolbar { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
        .button, .copy-button {
          min-height: 30px;
          padding: 5px 9px;
          border: 1px solid #66513a;
          border-radius: 2px;
          background: #24211e;
          color: #f1d4ad;
          cursor: pointer;
        }
        .button:hover, .button:focus-visible, .copy-button:hover, .copy-button:focus-visible {
          border-color: #e38a2f;
          outline: none;
          background: #34271b;
        }
        .button--primary { background: #6e3d12; color: #fff4e4; }
        .field, .related-row {
          display: grid;
          grid-template-columns: minmax(0,1fr) auto;
          gap: 6px;
          align-items: start;
          padding: 7px 0;
          border-top: 1px solid #2d2d2d;
        }
        .field:first-child { border-top: 0; }
        .field-label { display: block; margin-bottom: 3px; color: #d78834; font: 600 11px/1.3 system-ui,sans-serif; }
        .field-value { overflow-wrap: anywhere; white-space: pre-wrap; }
        .copy-button { min-height: 27px; padding: 3px 7px; font-size: 11px; }
        textarea, .hotkey-input {
          width: 100%;
          border: 1px solid #49433b;
          border-radius: 2px;
          background: #090a0b;
          color: #e8e2d8;
        }
        textarea { min-height: 92px; padding: 8px; resize: vertical; font: 12px/1.45 ui-monospace,monospace; }
        .section-title { margin: 14px 0 5px; color: #f0b66f; font: 700 12px/1.3 system-ui,sans-serif; }
        .related-row { font-size: 12px; }
        .related-name { color: #c7beb4; }
        .related-selector { display: block; margin-top: 2px; color: #e3a15c; overflow-wrap: anywhere; }
        .mode-badge {
          position: fixed;
          right: 12px;
          bottom: max(12px, env(safe-area-inset-bottom));
          display: none;
          max-width: calc(100vw - 24px);
          padding: 7px 10px;
          border: 1px solid #d27a22;
          border-radius: 2px;
          background: rgba(18,19,20,.94);
          box-shadow: 0 4px 18px rgba(0,0,0,.42);
          color: #ffd8a4;
          font: 600 12px/1.35 system-ui,sans-serif;
          pointer-events: none;
        }
        .mode-badge[data-visible="true"] { display: block; }
        .cycle-nav {
          position: fixed;
          left: 12px;
          bottom: max(12px, env(safe-area-inset-bottom));
          display: none;
          align-items: center;
          gap: 4px;
          padding: 4px;
          border: 1px solid #66513a;
          border-radius: 2px;
          background: rgba(18,19,20,.96);
          box-shadow: 0 4px 18px rgba(0,0,0,.42);
          pointer-events: auto;
        }
        .cycle-nav[data-visible="true"] { display: flex; }
        .cycle-button {
          min-width: 34px;
          min-height: 34px;
          padding: 3px 7px;
          border: 1px solid #544536;
          border-radius: 2px;
          background: #24211e;
          color: #ffd8a4;
          font: 700 13px/1 system-ui,sans-serif;
          cursor: pointer;
        }
        .cycle-button:hover, .cycle-button:focus-visible { border-color: #e38a2f; outline: none; }
        .help-list { margin: 8px 0 14px; padding-left: 20px; }
        .help-list li { margin: 0 0 7px; }
        .settings-row { display: grid; gap: 5px; margin: 0 0 14px; }
        .settings-row > span { color: #d6cec4; font: 600 12px/1.3 system-ui,sans-serif; }
        .hotkey-input { min-height: 38px; padding: 7px 9px; text-align: center; }
        .check-row { display: flex; gap: 9px; align-items: center; font-family: system-ui,sans-serif; }
        .hint { color: #9e968d; font-size: 11px; }
        @media (max-width: 520px) {
          .window { min-width: 260px; }
          .version { display: none; }
          .mode-badge { right: 12px; bottom: max(58px, calc(env(safe-area-inset-bottom) + 58px)); }
        }
      </style>
      <section class="window" role="dialog" aria-label="Kapylup inspector" data-visible="false">
        <header class="window-header">
          <span class="window-title">Kapylup</span>
          <span class="version">v${VERSION}</span>
          <button class="header-button" type="button" data-action="help" aria-label="Nápověda Kapylupu" title="Nápověda">?</button>
          <button class="header-button" type="button" data-action="settings" aria-label="Nastavení Kapylupu" title="Nastavení">⚙</button>
          <button class="header-button" type="button" data-action="close" aria-label="Skrýt Kapylup" title="Skrýt">×</button>
        </header>
        <div class="window-body"></div>
      </section>
      <div class="mode-badge" role="status" aria-live="polite" data-visible="false"></div>
      <nav class="cycle-nav" aria-label="Výběr překrývajících se prvků" data-visible="false">
        <button class="cycle-button" type="button" data-cycle="previous" aria-label="Předchozí překrývající se prvek" title="Předchozí prvek">‹</button>
        <button class="cycle-button" type="button" data-cycle="next" aria-label="Další překrývající se prvek" title="Další prvek">›</button>
        <button class="cycle-button" type="button" data-cycle="parent" aria-label="Rodičovský prvek" title="Rodič">↑</button>
        <button class="cycle-button" type="button" data-cycle="child" aria-label="Vnořený prvek" title="Potomek">↓</button>
        <button class="cycle-button" type="button" data-cycle="confirm" aria-label="Potvrdit zvýrazněný prvek" title="Vybrat">✓</button>
      </nav>
    `;
    document.documentElement.appendChild(host);

    const highlight = document.createElement("div");
    highlight.setAttribute("data-kapylup-highlight", "true");
    Object.assign(highlight.style, {
      position: "fixed",
      display: "none",
      zIndex: "2147483646",
      border: "2px solid #ff8a24",
      background: "rgba(255,138,36,.12)",
      boxShadow: "0 0 0 1px rgba(0,0,0,.7)",
      pointerEvents: "none",
    });
    document.documentElement.appendChild(highlight);

    const cursorStyle = document.createElement("style");
    cursorStyle.textContent = `
      html[data-kapylup-selecting="true"],
      html[data-kapylup-selecting="true"] body,
      html[data-kapylup-selecting="true"] body * { cursor: crosshair !important; }
    `;
    document.documentElement.appendChild(cursorStyle);

    state.uiHost = host;
    state.shadow = shadow;
    state.panel = shadow.querySelector(".window");
    state.panelBody = shadow.querySelector(".window-body");
    state.panelTitle = shadow.querySelector(".window-title");
    state.modeBadge = shadow.querySelector(".mode-badge");
    state.cycleNav = shadow.querySelector(".cycle-nav");
    state.highlight = highlight;
    state.cursorStyle = cursorStyle;
    applyPanelGeometry();
    installPanelInteractions();
  }

  function installEvents() {
    document.addEventListener("keydown", handleGlobalKeydown, true);
    document.addEventListener("pointermove", handlePointerMove, true);
    document.addEventListener("wheel", handleSelectionWheel, { capture: true, passive: false });
    document.addEventListener("click", handleSelectionClick, true);
    window.addEventListener("resize", clampPanelGeometry);
  }

  function installPanelInteractions() {
    state.shadow.addEventListener("click", (event) => {
      const action = event.target.closest?.("[data-action]")?.dataset.action;
      if (action === "close") hidePanel();
      if (action === "settings") openSettings();
      if (action === "help") renderHelp();
      if (action === "toggle") toggleSelection();
      if (action === "copy") void handleCopy(event.target.dataset.copy);
      if (action === "save-settings") void saveSettingsFromPanel();
      if (action === "reset-hotkey") setHotkeyDraft("K");
      if (action === "reset-cycle-keys") {
        setHotkeyDraft("[", "cycle-previous");
        setHotkeyDraft("]", "cycle-next");
      }
      if (action === "back") state.result ? renderInspector() : renderWelcome();

      const cycle = event.target.closest?.("[data-cycle]")?.dataset.cycle;
      if (cycle === "previous") cycleCandidate(-1);
      if (cycle === "next") cycleCandidate(1);
      if (cycle === "parent") cycleHierarchy(1);
      if (cycle === "child") cycleHierarchy(-1);
      if (cycle === "confirm" && state.hoveredElement) inspectElement(state.hoveredElement);
    });

    const header = state.shadow.querySelector(".window-header");
    header.addEventListener("pointerdown", beginPanelDrag);
    if (typeof ResizeObserver === "function") {
      state.resizeObserver = new ResizeObserver(() => scheduleGeometrySave());
      state.resizeObserver.observe(state.panel);
    }
  }

  function handleGlobalKeydown(event) {
    if (event.composedPath().includes(state.uiHost)) return;
    if (event.key === "Escape" && state.selecting) {
      event.preventDefault();
      setSelecting(false);
      return;
    }
    if (isEditableEvent(event) || event.repeat) return;
    const hotkey = eventHotkey(event);
    if (state.selecting && hotkey === state.settings.cyclePreviousKey) {
      event.preventDefault();
      event.stopImmediatePropagation();
      cycleCandidate(-1);
      return;
    }
    if (state.selecting && hotkey === state.settings.cycleNextKey) {
      event.preventDefault();
      event.stopImmediatePropagation();
      cycleCandidate(1);
      return;
    }
    if (hotkey !== state.settings.hotkey) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    toggleSelection();
  }

  function handlePointerMove(event) {
    if (!state.selecting || event.composedPath().includes(state.uiHost)) return;
    state.pointer = { x: event.clientX, y: event.clientY };
    if (state.hoverFrame) return;
    state.hoverFrame = requestAnimationFrame(() => {
      state.hoverFrame = 0;
      refreshCandidateStack(state.pointer.x, state.pointer.y);
    });
  }

  function handleSelectionWheel(event) {
    if (!state.selecting || event.composedPath().includes(state.uiHost) || !event.deltaY) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const now = performance.now();
    if (now - state.lastWheelCycle < 80) return;
    state.lastWheelCycle = now;
    if (!state.candidates.length) refreshCandidateStack(event.clientX, event.clientY);
    cycleCandidate(event.deltaY > 0 ? 1 : -1);
  }

  function handleSelectionClick(event) {
    if (!state.selecting || event.composedPath().includes(state.uiHost)) return;
    if (!state.candidates.length) refreshCandidateStack(event.clientX, event.clientY);
    const element = state.hoveredElement || event.composedPath().find((node) => node instanceof Element && !isKapylupElement(node));
    if (!element) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    inspectElement(element);
  }

  function refreshCandidateStack(x, y) {
    const current = state.hoveredElement;
    const candidates = document.elementsFromPoint(x, y).filter((element, index, all) => (
      isSelectableCandidate(element) && all.indexOf(element) === index
    ));
    state.candidates = candidates;
    const preservedIndex = candidates.indexOf(current);
    selectCandidate(preservedIndex >= 0 ? preservedIndex : candidates.length ? 0 : -1);
  }

  function isSelectableCandidate(element) {
    if (!isElement(element) || isKapylupElement(element)) return false;
    if (element === document.documentElement || element === document.body) return false;
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    const style = getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden" && style.pointerEvents !== "none";
  }

  function cycleCandidate(direction) {
    if (!state.candidates.length) return;
    const current = state.candidateIndex >= 0 ? state.candidateIndex : 0;
    selectCandidate((current + direction + state.candidates.length) % state.candidates.length);
  }

  function cycleHierarchy(direction) {
    if (!state.hoveredElement || !state.candidates.length) return;
    const current = state.candidateIndex;
    const indexes = direction > 0
      ? Array.from({ length: state.candidates.length - current - 1 }, (_, index) => current + index + 1)
      : Array.from({ length: current }, (_, index) => current - index - 1);
    const next = indexes.find((index) => direction > 0
      ? state.candidates[index].contains(state.hoveredElement)
      : state.hoveredElement.contains(state.candidates[index]));
    if (next !== undefined) selectCandidate(next);
  }

  function selectCandidate(index) {
    state.candidateIndex = index;
    state.hoveredElement = index >= 0 ? state.candidates[index] : null;
    highlightElement(state.hoveredElement);
    updateSelectionUi();
  }

  function inspectElement(element) {
    const result = window.Kapyguts.explain(element);
    state.selectedElement = element;
    state.result = result;
    state.related = relatedElements(element, result);
    logInspection(result, state.related);
    highlightElement(result.target || element);
    renderInspector();
    if (state.settings.showPanelOnSelection) showPanel();
    return result;
  }

  function relatedElements(element, result) {
    const collected = new Map();
    addRelated(collected, "selected", element);
    addRelated(collected, "translated target", result.target);

    const post = window.Kapyguts.allPosts().find((candidate) => candidate.contains(element));
    if (post) addPartObject(collected, "post", window.Kapyguts.postParts(post));

    const composer = window.Kapyguts.allComposers().find((candidate) => candidate.contains(element));
    if (composer) addPartObject(collected, "composer", window.Kapyguts.composerParts(composer));

    for (const [group, parts] of [
      ["page header", window.Kapyguts.pageHeaderParts()],
      ["board header", window.Kapyguts.boardHeaderParts()],
    ]) {
      const elements = Object.values(parts).filter(isElement);
      if (elements.some((candidate) => candidate === element || candidate.contains(element))) {
        addPartObject(collected, group, parts);
      }
    }
    return Array.from(collected.values()).slice(0, 30);
  }

  function addPartObject(collected, group, parts) {
    Object.entries(parts || {}).forEach(([name, element]) => {
      if (isElement(element)) addRelated(collected, `${group}.${name}`, element);
    });
  }

  function addRelated(collected, name, element) {
    if (!isElement(element) || collected.has(element)) return;
    const explanation = window.Kapyguts.explain(element);
    collected.set(element, {
      name,
      element,
      descriptor: describeElement(element),
      selector: explanation.recommendedSelector,
    });
  }

  function logInspection(result, related) {
    const heading = result.recommendedSelector || describeElement(result.element) || "unknown element";
    console.groupCollapsed(`[Kapylup] ${result.component}: ${heading}`);
    console.log("Selected element:", result.element);
    console.log("Kapyguts target:", result.target);
    console.log("Translation:", result);
    console.log("Related elements:", related.map(({ name, element, selector }) => ({ name, element, selector })));
    console.groupEnd();
  }

  function renderWelcome() {
    state.view = "welcome";
    state.panelTitle.textContent = "Kapylup";
    state.panelBody.innerHTML = `
      <p class="intro">Ruční průzkumník Kapybary. Přepněte výběrový kurzor, ukažte na prvek a klikněte. Překlad vždy poskytuje Kapyguts.</p>
      <div class="toolbar">
        <button class="button button--primary" type="button" data-action="toggle">${state.selecting ? "Ukončit výběr" : "Spustit výběr"} (${escapeHtml(state.settings.hotkey)})</button>
        <button class="button" type="button" data-action="help">Jak se používá?</button>
        <button class="button" type="button" data-action="settings">Nastavení</button>
      </div>
      <div class="field"><div><span class="field-label">Kapylup</span><div class="field-value">${VERSION}</div></div></div>
      <div class="field"><div><span class="field-label">Kapyguts</span><div class="field-value">${escapeHtml(window.Kapyguts.version)}</div></div></div>
      <div class="field"><div><span class="field-label">Použití z konzole</span><div class="field-value">Kapylup.inspect($0)\nKapyguts.explain($0)</div></div><button class="copy-button" data-action="copy" data-copy="console-help">Kopírovat</button></div>
    `;
  }

  function renderHelp() {
    state.view = "help";
    state.panelTitle.textContent = "Kapylup · nápověda";
    state.panelBody.innerHTML = `
      <p class="intro"><strong>TL;DR:</strong> Stiskněte ${escapeHtml(state.settings.hotkey)}, ukažte na část Kapybary a klikněte. Kapylup ji přeloží přes Kapyguts a nabídne bezpečný selektor i CSS kostru ke zkopírování.</p>
      <div class="section-title">Překrývající se prvky</div>
      <ul class="help-list">
        <li>Kolečkem myši nebo klávesami <strong>${escapeHtml(state.settings.cyclePreviousKey)}</strong> / <strong>${escapeHtml(state.settings.cycleNextKey)}</strong> procházejte prvky pod kurzorem.</li>
        <li>Oranžový štítek ukazuje pořadí ve vrstvě a jméno přeložené komponenty.</li>
        <li>Na dotykové obrazovce použijte tlačítka ‹ ›, ↑ rodič, ↓ potomek a ✓ pro potvrzení.</li>
        <li>Kliknutím potvrdíte zvýrazněný prvek; Escape výběrový režim ukončí.</li>
      </ul>
      <div class="section-title">Výsledek</div>
      <p class="intro">Každou hodnotu lze kopírovat zvlášť, nebo tlačítkem „Kopírovat vše“ získat celý souhrn. Okno můžete táhnout za záhlaví a měnit jeho velikost za pravý dolní roh.</p>
      <div class="toolbar">
        <button class="button button--primary" type="button" data-action="toggle">${state.selecting ? "Ukončit výběr" : "Spustit výběr"} (${escapeHtml(state.settings.hotkey)})</button>
        <button class="button" type="button" data-action="settings">Nastavení kláves</button>
        <button class="button" type="button" data-action="back">Zpět</button>
      </div>
    `;
    showPanel();
  }

  function renderInspector() {
    if (!state.result) {
      renderWelcome();
      return;
    }
    state.view = "inspector";
    const result = state.result;
    state.panelTitle.textContent = `Kapylup · ${result.component}`;
    state.panelBody.innerHTML = `
      <div class="toolbar">
        <button class="button button--primary" type="button" data-action="copy" data-copy="all">Kopírovat vše</button>
        <button class="button" type="button" data-action="toggle">${state.selecting ? "Ukončit výběr" : "Další výběr"} (${escapeHtml(state.settings.hotkey)})</button>
        <button class="button" type="button" data-action="settings">Nastavení</button>
      </div>
      ${fieldMarkup("Komponenta", result.component, "component")}
      ${fieldMarkup("Označený element", describeElement(result.element), "selected")}
      ${fieldMarkup("Přeložený element", describeElement(result.target), "target")}
      ${fieldMarkup("Doporučený selektor", result.recommendedSelector || "—", "selector")}
      ${fieldMarkup("Nepoužívat", result.avoid.join("\n") || "—", "avoid")}
      ${fieldMarkup("Poznámky", result.notes.join("\n") || "—", "notes")}
      <div class="section-title">CSS kostra</div>
      <textarea readonly aria-label="CSS kostra"></textarea>
      <div class="toolbar"><button class="copy-button" type="button" data-action="copy" data-copy="css">Kopírovat CSS</button></div>
      <div class="section-title">Související elementy</div>
      <div class="related-list">
        ${state.related.map((item, index) => `
          <div class="related-row">
            <div><span class="related-name">${escapeHtml(item.name)} · ${escapeHtml(item.descriptor)}</span><span class="related-selector">${escapeHtml(item.selector || "bez bezpečného selektoru")}</span></div>
            <button class="copy-button" type="button" data-action="copy" data-copy="related:${index}">Kopírovat</button>
          </div>
        `).join("")}
      </div>
    `;
    state.panelBody.querySelector("textarea").value = result.css;
  }

  function fieldMarkup(label, value, copyKey) {
    return `<div class="field"><div><span class="field-label">${escapeHtml(label)}</span><div class="field-value">${escapeHtml(value)}</div></div><button class="copy-button" type="button" data-action="copy" data-copy="${escapeHtml(copyKey)}">Kopírovat</button></div>`;
  }

  function openSettings() {
    state.view = "settings";
    state.panelTitle.textContent = "Kapylup · nastavení";
    state.panelBody.innerHTML = `
      <p class="intro">Nastavení se ukládá přes userscript manager. Klávesová zkratka se ignoruje při psaní do editorů a formulářů.</p>
      <label class="settings-row"><span>Klávesa pro přepnutí kurzoru</span><input class="hotkey-input" data-setting="hotkey" value="${escapeHtml(state.settings.hotkey)}" readonly aria-label="Klávesová zkratka"><small class="hint">Klikněte do pole a stiskněte novou kombinaci. Escape je vyhrazen pro ukončení výběru.</small></label>
      <div class="toolbar"><button class="button" type="button" data-action="reset-hotkey">Vrátit K</button></div>
      <label class="settings-row"><span>Předchozí překrývající se prvek</span><input class="hotkey-input" data-setting="cycle-previous" value="${escapeHtml(state.settings.cyclePreviousKey)}" readonly aria-label="Klávesa pro předchozí překrývající se prvek"></label>
      <label class="settings-row"><span>Další překrývající se prvek</span><input class="hotkey-input" data-setting="cycle-next" value="${escapeHtml(state.settings.cycleNextKey)}" readonly aria-label="Klávesa pro další překrývající se prvek"></label>
      <div class="toolbar"><button class="button" type="button" data-action="reset-cycle-keys">Vrátit [ a ]</button></div>
      <label class="settings-row check-row"><input type="checkbox" data-setting="show-panel" ${state.settings.showPanelOnSelection ? "checked" : ""}><span>Po výběru automaticky ukázat okno</span></label>
      <div class="field"><div><span class="field-label">Verze Kapylupu</span><div class="field-value">${VERSION}</div></div></div>
      <div class="field"><div><span class="field-label">Zdroj překladu</span><div class="field-value">Kapyguts ${escapeHtml(window.Kapyguts.version)}</div></div></div>
      <div class="toolbar">
        <button class="button button--primary" type="button" data-action="save-settings">Uložit</button>
        <button class="button" type="button" data-action="back">Zpět</button>
      </div>
    `;
    state.panelBody.querySelectorAll(".hotkey-input").forEach((input) => input.addEventListener("keydown", captureHotkey));
    showPanel();
  }

  function captureHotkey(event) {
    event.preventDefault();
    event.stopPropagation();
    const hotkey = eventHotkey(event);
    if (!hotkey || hotkey === "Escape" || modifierOnly(event.key)) {
      showBadge("Tuto klávesu nelze použít.");
      return;
    }
    event.currentTarget.value = hotkey;
  }

  function setHotkeyDraft(value, setting = "hotkey") {
    const input = state.panelBody.querySelector(`[data-setting='${setting}']`);
    if (input) input.value = value;
  }

  async function saveSettingsFromPanel() {
    const hotkey = state.panelBody.querySelector("[data-setting='hotkey']")?.value || "K";
    const cyclePreviousKey = state.panelBody.querySelector("[data-setting='cycle-previous']")?.value || "[";
    const cycleNextKey = state.panelBody.querySelector("[data-setting='cycle-next']")?.value || "]";
    const showPanelOnSelection = !!state.panelBody.querySelector("[data-setting='show-panel']")?.checked;
    if (new Set([hotkey, cyclePreviousKey, cycleNextKey]).size !== 3) {
      showBadge("Ovládací klávesy musí být navzájem odlišné.");
      return;
    }
    state.settings = normalizeSettings({ ...state.settings, hotkey, cyclePreviousKey, cycleNextKey, showPanelOnSelection });
    await writeSetting(SETTINGS_KEY, state.settings);
    showBadge("Nastavení uloženo.");
    state.result ? renderInspector() : renderWelcome();
  }

  async function handleCopy(key) {
    const result = state.result;
    let value = "";
    if (key === "console-help") value = "Kapylup.inspect($0)\nKapyguts.explain($0)";
    if (result) {
      if (key === "all") value = fullSummary();
      if (key === "component") value = result.component;
      if (key === "selected") value = describeElement(result.element);
      if (key === "target") value = describeElement(result.target);
      if (key === "selector") value = result.recommendedSelector;
      if (key === "avoid") value = result.avoid.join("\n");
      if (key === "notes") value = result.notes.join("\n");
      if (key === "css") value = result.css;
      if (key?.startsWith("related:")) {
        const related = state.related[Number(key.split(":")[1])];
        value = related?.selector || related?.descriptor || "";
      }
    }
    if (!value) {
      showBadge("Není co kopírovat.");
      return;
    }
    await copyText(value);
    showBadge("Zkopírováno.");
  }

  function fullSummary() {
    const result = state.result;
    const route = window.Kapyguts.route();
    return [
      `Kapylup ${VERSION} / Kapyguts ${window.Kapyguts.version}`,
      `Route: ${route.path}${route.search}${route.hash}`,
      `Component: ${result.component}`,
      `Selected: ${describeElement(result.element)}`,
      `Target: ${describeElement(result.target)}`,
      `Selector: ${result.recommendedSelector || "—"}`,
      `Avoid: ${result.avoid.join(", ") || "—"}`,
      `Notes: ${result.notes.join(" | ") || "—"}`,
      "",
      result.css || "",
      "",
      "Related:",
      ...state.related.map((item) => `- ${item.name}: ${item.selector || item.descriptor}`),
    ].join("\n");
  }

  function toggleSelection() {
    setSelecting(!state.selecting);
    return state.selecting;
  }

  function setSelecting(enabled) {
    state.selecting = enabled === true;
    document.documentElement.toggleAttribute("data-kapylup-selecting", state.selecting);
    if (!state.selecting) {
      state.highlight.style.display = "none";
      state.hoveredElement = null;
      state.candidates = [];
      state.candidateIndex = -1;
    }
    state.cycleNav.dataset.visible = state.selecting ? "true" : "false";
    showBadge(
      state.selecting
        ? selectionBadgeText()
        : "Kapylup: normální kurzor",
      state.selecting,
    );
    if (state.view === "welcome") renderWelcome();
    if (state.view === "inspector") renderInspector();
  }

  function highlightElement(element) {
    if (!isElement(element) || !element.isConnected) {
      state.highlight.style.display = "none";
      return;
    }
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      state.highlight.style.display = "none";
      return;
    }
    Object.assign(state.highlight.style, {
      display: "block",
      left: `${Math.max(0, rect.left)}px`,
      top: `${Math.max(0, rect.top)}px`,
      width: `${Math.min(window.innerWidth, rect.right) - Math.max(0, rect.left)}px`,
      height: `${Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top)}px`,
    });
  }

  function showPanel(view = "") {
    state.panelVisible = true;
    state.panel.dataset.visible = "true";
    clampPanelGeometry();
    if (view === "settings") openSettings();
    else if (view === "inspector") renderInspector();
    else if (view === "welcome") renderWelcome();
  }

  function hidePanel() {
    state.panelVisible = false;
    state.panel.dataset.visible = "false";
  }

  function beginPanelDrag(event) {
    if (event.button !== 0 || event.target.closest("button,input")) return;
    event.preventDefault();
    const rect = state.panel.getBoundingClientRect();
    const origin = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
    state.panel.setPointerCapture(event.pointerId);
    const move = (moveEvent) => {
      state.panel.style.left = `${origin.left + moveEvent.clientX - origin.x}px`;
      state.panel.style.top = `${origin.top + moveEvent.clientY - origin.y}px`;
      clampPanelGeometry();
    };
    const finish = () => {
      state.panel.removeEventListener("pointermove", move);
      state.panel.removeEventListener("pointerup", finish);
      state.panel.removeEventListener("pointercancel", finish);
      scheduleGeometrySave();
    };
    state.panel.addEventListener("pointermove", move);
    state.panel.addEventListener("pointerup", finish);
    state.panel.addEventListener("pointercancel", finish);
  }

  function applyPanelGeometry() {
    const panel = state.settings.panel;
    state.panel.style.left = `${panel.left}px`;
    state.panel.style.top = `${panel.top}px`;
    state.panel.style.width = `${panel.width}px`;
    state.panel.style.height = `${panel.height}px`;
    clampPanelGeometry();
  }

  function clampPanelGeometry() {
    if (!state.panel) return;
    const rect = state.panel.getBoundingClientRect();
    const width = Math.min(Math.max(280, rect.width || state.settings.panel.width), Math.max(280, window.innerWidth - 8));
    const height = Math.min(Math.max(260, rect.height || state.settings.panel.height), Math.max(260, window.innerHeight - 8));
    const left = Math.min(Math.max(4, rect.left || state.settings.panel.left), Math.max(4, window.innerWidth - width - 4));
    const top = Math.min(Math.max(4, rect.top || state.settings.panel.top), Math.max(4, window.innerHeight - height - 4));
    Object.assign(state.panel.style, {
      left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px`,
    });
  }

  function scheduleGeometrySave() {
    clearTimeout(state.saveGeometryTimer);
    state.saveGeometryTimer = window.setTimeout(() => void savePanelGeometry(), 250);
  }

  async function savePanelGeometry() {
    if (!state.panel || !state.settings) return;
    const rect = state.panel.getBoundingClientRect();
    if (!state.panelVisible || rect.width <= 0 || rect.height <= 0) return;
    state.settings = normalizeSettings({
      ...state.settings,
      panel: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
    });
    await writeSetting(SETTINGS_KEY, state.settings);
  }

  function showBadge(text, persistent = false) {
    clearTimeout(state.badgeTimer);
    state.modeBadge.textContent = text;
    state.modeBadge.dataset.visible = "true";
    if (!persistent) {
      state.badgeTimer = window.setTimeout(() => {
        if (state.selecting) {
          state.modeBadge.textContent = selectionBadgeText();
          state.modeBadge.dataset.visible = "true";
        } else {
          state.modeBadge.dataset.visible = "false";
        }
      }, 1500);
    }
  }

  function selectionBadgeText() {
    if (state.hoveredElement && state.candidates.length) {
      const component = window.Kapyguts.explain(state.hoveredElement).component;
      return `Kapylup · ${state.candidateIndex + 1}/${state.candidates.length} · ${component} · klik = vybrat`;
    }
    return `Kapylup: vyberte prvek · ${state.settings.cyclePreviousKey}/${state.settings.cycleNextKey} nebo kolečko pro vrstvy · Esc ukončí`;
  }

  function updateSelectionUi() {
    if (!state.selecting) return;
    showBadge(selectionBadgeText(), true);
    state.cycleNav.querySelector('[data-cycle="previous"]').title = `Předchozí (${state.settings.cyclePreviousKey})`;
    state.cycleNav.querySelector('[data-cycle="next"]').title = `Další (${state.settings.cycleNextKey})`;
  }

  function isKapylupElement(element) {
    return element === state.uiHost || element === state.highlight || element.hasAttribute("data-kapylup-ui") || element.hasAttribute("data-kapylup-highlight");
  }

  function isEditableEvent(event) {
    return event.composedPath().some((node) => isElement(node) && (
      node.matches("input,textarea,select,[contenteditable='true']") || node.isContentEditable
    ));
  }

  function eventHotkey(event) {
    const key = normalizedKey(event.key);
    if (!key || modifierOnly(key)) return "";
    const modifiers = [];
    if (event.ctrlKey) modifiers.push("Ctrl");
    if (event.altKey) modifiers.push("Alt");
    if (event.shiftKey) modifiers.push("Shift");
    if (event.metaKey) modifiers.push("Meta");
    modifiers.push(key.length === 1 ? key.toUpperCase() : key);
    return modifiers.join("+");
  }

  function normalizedKey(key) {
    if (key === " ") return "Space";
    if (key === "Esc") return "Escape";
    return String(key || "");
  }

  function modifierOnly(key) {
    return ["Control", "Alt", "Shift", "Meta"].includes(key);
  }

  function describeElement(element) {
    if (!isElement(element)) return "—";
    const tag = element.tagName.toLocaleLowerCase("en");
    const id = element.id ? `#${element.id}` : "";
    const classes = Array.from(element.classList).map((name) => `.${name}`).join("");
    return `${tag}${id}${classes}`;
  }

  function isElement(value) {
    return value instanceof Element;
  }

  function normalizeSettings(value) {
    const panel = value?.panel || {};
    return {
      hotkey: typeof value?.hotkey === "string" && value.hotkey && value.hotkey !== "Escape" ? value.hotkey : DEFAULTS.hotkey,
      cyclePreviousKey: typeof value?.cyclePreviousKey === "string" && value.cyclePreviousKey && value.cyclePreviousKey !== "Escape"
        ? value.cyclePreviousKey : DEFAULTS.cyclePreviousKey,
      cycleNextKey: typeof value?.cycleNextKey === "string" && value.cycleNextKey && value.cycleNextKey !== "Escape"
        ? value.cycleNextKey : DEFAULTS.cycleNextKey,
      showPanelOnSelection: value?.showPanelOnSelection !== false,
      panel: {
        left: finite(panel.left, DEFAULTS.panel.left),
        top: finite(panel.top, DEFAULTS.panel.top),
        width: finite(panel.width, DEFAULTS.panel.width),
        height: finite(panel.height, DEFAULTS.panel.height),
      },
    };
  }

  function finite(value, fallback) {
    return Number.isFinite(Number(value)) ? Number(value) : fallback;
  }

  async function readSetting(key, fallback) {
    try {
      if (typeof GM_getValue === "function") return GM_getValue(key, fallback);
      if (typeof GM !== "undefined" && typeof GM.getValue === "function") return await GM.getValue(key, fallback);
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (_error) {
      return fallback;
    }
  }

  async function writeSetting(key, value) {
    try {
      if (typeof GM_setValue === "function") return GM_setValue(key, value);
      if (typeof GM !== "undefined" && typeof GM.setValue === "function") return await GM.setValue(key, value);
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn("[Kapylup] Settings could not be saved.", error?.name || "Error");
    }
    return undefined;
  }

  function registerMenus() {
    registerMenu(`Kapylup: nastavení (v${VERSION})`, openSettings);
    registerMenu("Kapylup: přepnout výběr prvku", toggleSelection);
    registerMenu("Kapylup: ukázat/skrýt okno", () => state.panelVisible ? hidePanel() : showPanel());
  }

  function registerMenu(label, callback) {
    try {
      if (typeof GM_registerMenuCommand === "function") GM_registerMenuCommand(label, callback);
      else if (typeof GM !== "undefined" && typeof GM.registerMenuCommand === "function") GM.registerMenuCommand(label, callback);
    } catch (_error) {
      // Menu support is optional; keyboard and window controls remain available.
    }
  }

  async function copyText(text) {
    if (typeof GM_setClipboard === "function") {
      GM_setClipboard(text, "text");
      return;
    }
    if (typeof GM !== "undefined" && typeof GM.setClipboard === "function") {
      await GM.setClipboard(text, "text");
      return;
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
