// Standalone Cudloun container: playful labels for Babeta board pagination arrows.
(function () {
  "use strict";

  const ID = "noooovejsi";
  const STYLE_ID = "cudloun-container-noooovejsi-style";
  const PAGER_MARK = "data-cudloun-noooovejsi-pagination";
  const ARROW_MARK = "data-cudloun-noooovejsi-arrow";
  const LABEL_MARK = "data-cudloun-noooovejsi-label";
  const TEXT_MARK = "data-cudloun-noooovejsi-text";
  const ORIGINAL_TITLE = "data-cudloun-noooovejsi-original-title";
  const ORIGINAL_TEXT = "data-cudloun-noooovejsi-original-text";
  let observer = null;
  let scheduled = false;

  const api = {
    id: ID,
    name: "Noooovejsi",
    run,
    stop,
  };

  window.CudlounNoooovejsi = api;

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
      observer = new MutationObserver(scheduleScan);
      observer.observe(document.body, { childList: true, subtree: true });
    }

    console.log("[cudloun-container] noooovejsi active");
    return api;
  }

  function stop() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }

    scheduled = false;

    document.querySelectorAll(`[${LABEL_MARK}]`).forEach((label) => label.remove());
    document.querySelectorAll(`[${TEXT_MARK}]`).forEach((link) => restoreTextLink(link));
    document.querySelectorAll(`[${ARROW_MARK}]`).forEach((link) => {
      link.removeAttribute(ARROW_MARK);

      if (link.hasAttribute(ORIGINAL_TITLE)) {
        const title = link.getAttribute(ORIGINAL_TITLE);
        if (title) {
          link.title = title;
        } else {
          link.removeAttribute("title");
        }

        link.removeAttribute(ORIGINAL_TITLE);
      }
    });
    document.querySelectorAll(`[${PAGER_MARK}]`).forEach((pager) => pager.removeAttribute(PAGER_MARK));
    document.getElementById(STYLE_ID)?.remove();
    console.log("[cudloun-container] noooovejsi stopped");
  }

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      [${PAGER_MARK}] {
        align-items: center !important;
      }

      [${ARROW_MARK}] {
        width: auto !important;
        min-width: 30px !important;
        max-width: none !important;
        padding-left: 0.55em !important;
        padding-right: 0.55em !important;
        gap: 0.3em !important;
        white-space: nowrap !important;
      }

      [${ARROW_MARK}="newer"] {
        flex-direction: row !important;
      }

      [${ARROW_MARK}="older"] {
        flex-direction: row !important;
      }

      [${LABEL_MARK}] {
        display: inline-flex !important;
        align-items: center !important;
        max-width: 11em !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        color: inherit !important;
        font-size: 11px !important;
        font-weight: 800 !important;
        line-height: 1 !important;
        letter-spacing: 0 !important;
        text-transform: uppercase !important;
        pointer-events: none !important;
      }

      [${TEXT_MARK}] {
        font-weight: 900 !important;
        letter-spacing: 0 !important;
        white-space: nowrap !important;
      }

      @media (max-width: 520px) {
        [${ARROW_MARK}] {
          padding-left: 0.4em !important;
          padding-right: 0.4em !important;
        }

        [${LABEL_MARK}] {
          max-width: 7.5em !important;
          font-size: 10px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function scheduleScan() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      scan();
    });
  }

  function scan() {
    if (!isBoardRoute()) {
      cleanupMissingRoute();
      return;
    }

    findPaginationRoots().forEach(enhancePagination);
  }

  function cleanupMissingRoute() {
    document.querySelectorAll(`[${LABEL_MARK}]`).forEach((label) => label.remove());
    document.querySelectorAll(`[${TEXT_MARK}]`).forEach((link) => restoreTextLink(link));
    document.querySelectorAll(`[${ARROW_MARK}]`).forEach((link) => link.removeAttribute(ARROW_MARK));
    document.querySelectorAll(`[${PAGER_MARK}]`).forEach((pager) => pager.removeAttribute(PAGER_MARK));
  }

  function isBoardRoute() {
    return /^\/boards\/[^/]+/.test(window.location.pathname);
  }

  function findPaginationRoots() {
    const roots = new Set();
    const boardLinks = Array.from(document.querySelectorAll("a[href]")).filter(isSameBoardPagerLink);

    boardLinks.forEach((link) => {
      const root = findPaginationRoot(link);
      if (root) roots.add(root);
    });

    return Array.from(roots);
  }

  function findPaginationRoot(link) {
    let node = link.parentElement;

    for (let depth = 0; node && depth < 8; depth += 1, node = node.parentElement) {
      const sameBoardLinks = Array.from(node.querySelectorAll("a[href]")).filter(isSameBoardPagerLink);
      if (sameBoardLinks.length < 3) continue;

      const numberedControls = getNumberedControls(node);
      const hasClassicNumbers = numberedControls.length >= 2;
      const hasCompactText = hasCompactPagerText(node);
      if (!hasClassicNumbers && !hasCompactText) continue;

      const text = normalizeText(node.textContent);
      if (hasClassicNumbers && !/\b1\b/.test(text) && !/\b2\b/.test(text)) continue;

      return node;
    }

    return null;
  }

  function enhancePagination(root) {
    const numberedControls = getNumberedControls(root);
    const boardLinks = Array.from(root.querySelectorAll("a[href]")).filter(isSameBoardPagerLink);
    if (boardLinks.length < 2) return;
    if (numberedControls.length < 2 && !hasCompactPagerText(root)) return;

    root.setAttribute(PAGER_MARK, "true");

    if (numberedControls.length < 2 || hasCompactPagerText(root)) {
      enhanceCompactPagination(root, boardLinks);
      return;
    }

    const numberBounds = getHorizontalBounds(numberedControls);
    const arrowLinks = boardLinks
      .filter((link) => !/^\d+$/.test(normalizeText(link.textContent)))
      .map((link) => ({ link, rect: link.getBoundingClientRect() }))
      .filter((item) => item.rect.width > 0 && item.rect.height > 0)
      .sort((a, b) => a.rect.left - b.rect.left);

    const newer = arrowLinks.filter((item) => midpoint(item.rect) < numberBounds.left);
    const older = arrowLinks.filter((item) => midpoint(item.rect) > numberBounds.right);

    newer.forEach((item, index) => markArrow(item.link, "newer", newerLabel(index, newer.length)));
    older.forEach((item, index) => markArrow(item.link, "older", olderLabel(index, older.length)));
  }

  function enhanceCompactPagination(root, boardLinks) {
    const links = boardLinks
      .map((link) => ({ link, rect: link.getBoundingClientRect(), text: displayText(link) }))
      .filter((item) => item.rect.width > 0 && item.rect.height > 0)
      .sort((a, b) => a.rect.left - b.rect.left);

    const textItems = compactTextControls(root);
    if (textItems.length === 0) return;

    textItems.forEach((item) => markTextLink(item.element, compactLabel(item.text), compactTitle(item.text)));

    const textBounds = getHorizontalBounds(textItems.map((item) => item.element));
    links
      .filter((item) => !item.text && midpoint(item.rect) < textBounds.left)
      .forEach((item) => markTitleOnly(item.link, "NOVĚJŠÍ"));
    links
      .filter((item) => !item.text && midpoint(item.rect) > textBounds.right)
      .forEach((item) => markTitleOnly(item.link, "STARŠÍ"));
  }

  function markArrow(link, direction, text) {
    link.setAttribute(ARROW_MARK, direction);

    if (!link.hasAttribute(ORIGINAL_TITLE)) {
      link.setAttribute(ORIGINAL_TITLE, link.getAttribute("title") || "");
    }

    link.title = text;

    let label = link.querySelector(`[${LABEL_MARK}]`);
    if (!label) {
      label = document.createElement("span");
      label.setAttribute(LABEL_MARK, "true");
      link.appendChild(label);
    }

    label.textContent = text;
  }

  function markTextLink(element, text, title) {
    const original = originalText(element);
    if (!element.hasAttribute(ORIGINAL_TEXT)) {
      element.setAttribute(ORIGINAL_TEXT, original);
    }

    element.setAttribute(TEXT_MARK, "true");
    element.textContent = text;

    if (!element.hasAttribute(ORIGINAL_TITLE)) {
      element.setAttribute(ORIGINAL_TITLE, element.getAttribute("title") || "");
    }

    element.title = title || text;
  }

  function markTitleOnly(link, text) {
    if (!link.hasAttribute(ORIGINAL_TITLE)) {
      link.setAttribute(ORIGINAL_TITLE, link.getAttribute("title") || "");
    }

    link.title = text;
  }

  function restoreTextLink(link) {
    if (link.hasAttribute(ORIGINAL_TEXT)) {
      link.textContent = link.getAttribute(ORIGINAL_TEXT) || "";
      link.removeAttribute(ORIGINAL_TEXT);
    }

    link.removeAttribute(TEXT_MARK);

    if (link.hasAttribute(ORIGINAL_TITLE)) {
      const title = link.getAttribute(ORIGINAL_TITLE);
      if (title) {
        link.title = title;
      } else {
        link.removeAttribute("title");
      }

      link.removeAttribute(ORIGINAL_TITLE);
    }
  }

  function newerLabel(index, count) {
    if (count <= 1) return "NOVĚJŠÍ";
    if (index === 0) return "NEJNOVĚJŠÍ";
    return "NOOOOVĚJŠÍ";
  }

  function olderLabel(index, count) {
    if (count <= 1) return "STARŠÍ";
    if (index === count - 1) return "NEJSTARŠÍ";
    return "STARŠÍ";
  }

  function getNumberedControls(root) {
    const controls = Array.from(root.querySelectorAll("a, button, div, span"))
      .filter((element) => /^\d+$/.test(normalizeText(element.textContent)))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width >= 10 && rect.width <= 80 && rect.height >= 10 && rect.height <= 60;
      });

    return uniqueElements(controls);
  }

  function hasCompactPagerText(root) {
    return compactTextControls(root).length > 0;
  }

  function compactTextControls(root) {
    return uniqueElements(Array.from(root.querySelectorAll("a, button, span"))
      .filter((element) => isCompactPagerText(displayText(element)))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width >= 20 && rect.width <= 240 && rect.height >= 10 && rect.height <= 60;
      }))
      .map((element) => ({ element, text: originalText(element) }));
  }

  function isCompactPagerText(text) {
    return /nov[eě]j[sš][ií](?:ch)?/i.test(text) || /posledn[ií]ch/i.test(text);
  }

  function compactLabel(text) {
    const count = remainingPages(text);
    const prefix = count > 0 ? `${"o".repeat(count)} ` : "";
    return `${prefix}NOVĚJŠÍ`;
  }

  function compactTitle(text) {
    const count = remainingPages(text);
    if (count <= 0) return "Aktuální nejnovější stránka";
    return `Zhruba ${count} strán${count === 1 ? "ka" : count < 5 ? "ky" : "ek"} k nejnovějším`;
  }

  function remainingPages(text) {
    if (/posledn[ií]ch/i.test(text)) return 1;

    const match = text.match(/z\s+(\d+)(\+)?/i);
    if (!match) return 0;
    if (match[2]) return 6;

    return Math.max(1, Math.min(6, Math.ceil(Number(match[1]) / 50)));
  }

  function displayText(element) {
    return normalizeText(element.textContent);
  }

  function originalText(element) {
    return normalizeText(element.getAttribute(ORIGINAL_TEXT) || element.textContent);
  }

  function getHorizontalBounds(elements) {
    return elements.reduce((bounds, element) => {
      const rect = element.getBoundingClientRect();
      return {
        left: Math.min(bounds.left, rect.left),
        right: Math.max(bounds.right, rect.right),
      };
    }, { left: Infinity, right: -Infinity });
  }

  function midpoint(rect) {
    return rect.left + rect.width / 2;
  }

  function isSameBoardPagerLink(link) {
    try {
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return false;
      if (url.pathname !== window.location.pathname) return false;
      if (url.hash) return false;
      return url.search === "" || url.searchParams.has("f");
    } catch (_error) {
      return false;
    }
  }

  function uniqueElements(elements) {
    const seen = new Set();
    return elements.filter((element) => {
      if (seen.has(element)) return false;
      seen.add(element);
      return true;
    });
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }
})();
