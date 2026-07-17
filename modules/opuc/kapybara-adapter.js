// Kapybara composer discovery, launcher placement, and Markdown image insertion.
(function () {
  "use strict";

  const root = window.Cudloun;
  const runtime = root.opuc = root.opuc || {};
  const bindings = new Map();
  let stopObserver = null;

  runtime.adapter = {
    start,
    stop,
    bindLauncher,
    insertImageUrl,
    imageMarkdown,
  };

  function start(onComposer, onRemoved) {
    stop();
    stopObserver = root.kapyguts.observeComposers(
      (parts) => onComposer(parts),
      document.body,
      (parts) => {
        bindings.get(parts.section)?.remove();
        if (typeof onRemoved === "function") onRemoved(parts);
      }
    );
    return stop;
  }

  function stop() {
    stopObserver?.();
    stopObserver = null;
    Array.from(bindings.values()).forEach((binding) => binding.remove());
    bindings.clear();
  }

  function bindLauncher(parts, onClick) {
    if (bindings.has(parts.section)) return bindings.get(parts.section);

    const row = document.createElement("div");
    row.className = "cudloun-opuc-launcher-row";
    row.dataset.composerKind = parts.kind;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "cudloun-opuc-launcher";
    button.setAttribute("aria-label", "OPUc upload");
    button.title = "Upload an image through OPUc";
    button.textContent = "OPUc";
    button.addEventListener("click", onClick);
    row.appendChild(button);
    parts.toolbarSlot.insertAdjacentElement("afterend", row);

    const align = () => alignBelowImageButton(parts, row);
    window.requestAnimationFrame(align);
    const resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(align) : null;
    resizeObserver?.observe(parts.toolbarSlot);
    window.addEventListener("resize", align);

    const binding = {
      parts,
      row,
      button,
      remove() {
        resizeObserver?.disconnect();
        window.removeEventListener("resize", align);
        button.removeEventListener("click", onClick);
        row.remove();
        bindings.delete(parts.section);
      },
    };
    bindings.set(parts.section, binding);
    return binding;
  }

  async function insertImageUrl(parts, imageUrl) {
    if (!parts?.section?.isConnected) throw new Error("The originating Kapybara composer was closed.");
    const validated = runtime.client.validateOpuUrl(imageUrl);
    if (!validated) throw new Error("OPU returned an invalid image URL.");
    const section = parts.section;
    const wasMarkdown = isMarkdownMode(section);

    if (!wasMarkdown) {
      const toggle = findModeToggle(section);
      if (!toggle) throw new Error("Kapybara's Markdown mode toggle was not found.");
      toggle.click();
    }

    const editor = await waitFor(
      () => findMarkdownEditor(section),
      5000,
      "Kapybara did not switch to Markdown mode."
    );
    const markdown = imageMarkdown(validated, editor.innerText);
    if (!insertTextAtEnd(editor, markdown)) {
      throw new Error("Kapybara did not accept the OPU image Markdown.");
    }
    await waitFor(
      () => String(editor.innerText || "").includes(`![](${validated})`),
      3000,
      "Kapybara did not retain the OPU image Markdown."
    );

    root.log?.debug?.("opuc", "inserted image through Markdown mode", {
      composerKind: parts.kind || "unknown",
      restoredFormattedMode: !wasMarkdown,
    });

    if (!wasMarkdown) {
      const toggle = await waitFor(
        () => isMarkdownMode(section) ? findModeToggle(section) : null,
        3000,
        "Kapybara's formatted-text toggle was not found."
      );
      toggle.click();
      await waitFor(
        () => Array.from(section.querySelectorAll("img")).some((image) => image.src === validated),
        5000,
        "Kapybara did not render the inserted OPU image."
      );
    }

    (root.kapyguts?.composerParts?.(section)?.editable || editor)?.focus();
    return validated;
  }

  function imageMarkdown(imageUrl, existingText = "") {
    const tag = `![](${imageUrl})`;
    const text = String(existingText || "").replace(/\u00a0/g, " ");
    if (!text.trim()) return tag;
    const trailingNewlines = text.match(/\n*$/)?.[0].length || 0;
    return `${"\n".repeat(Math.max(0, 2 - trailingNewlines))}${tag}`;
  }

  function findModeToggle(section) {
    const selector = root.kapyguts?.selectors?.composerModeToggle || "button.mode-toggle[aria-pressed]";
    return section.querySelector(selector);
  }

  function isMarkdownMode(section) {
    const selector = root.kapyguts?.selectors?.composerMarkdownNode || "code[data-language='markdown']";
    return !!section.querySelector(selector) || findModeToggle(section)?.getAttribute("aria-pressed") === "true";
  }

  function findMarkdownEditor(section) {
    if (!isMarkdownMode(section)) return null;
    const selector = root.kapyguts?.selectors?.composerEditable ||
      ".composer-content-editable[role='textbox'][contenteditable='true']";
    const editor = section.querySelector(selector);
    return editor?.querySelector("code[data-language='markdown']") ? editor : null;
  }

  function insertTextAtEnd(editor, text) {
    try {
      // Lexical tracks browser editing commands; mutating textContent directly
      // would leave its internal editor state stale and be reverted on render.
      editor.focus();
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      return document.execCommand("insertText", false, text);
    } catch (_error) {
      return false;
    }
  }

  function alignBelowImageButton(parts, row) {
    if (!row.isConnected || !parts.imageButton?.isConnected || !parts.toolbarSlot?.isConnected) return;
    const slotRect = parts.toolbarSlot.getBoundingClientRect();
    const imageRect = parts.imageButton.getBoundingClientRect();
    const rowWidth = row.getBoundingClientRect().width;
    const desired = Math.max(0, Math.round(imageRect.left - slotRect.left));
    const safe = desired + 64 < rowWidth ? desired : 0;
    row.style.setProperty("--cudloun-opuc-launcher-offset", `${safe}px`);
  }

  function waitFor(probe, timeout, message) {
    const started = Date.now();
    return new Promise((resolve, reject) => {
      const check = () => {
        try {
          const result = probe();
          if (result) {
            resolve(result);
            return;
          }
        } catch (_error) {
          // Retry until timeout so transient rerenders do not fail insertion.
        }
        if (Date.now() - started >= timeout) {
          reject(new Error(message));
          return;
        }
        window.setTimeout(check, 50);
      };
      check();
    });
  }

})();
