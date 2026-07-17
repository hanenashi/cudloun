// Kapybara composer discovery, launcher placement, and native image insertion.
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

    const existingCount = Array.from(parts.section.querySelectorAll("img"))
      .filter((image) => image.src === validated).length;

    parts.imageButton.click();
    const dialog = await waitFor(findImageDialog, 5000, "Kapybara's image dialog did not open.");
    const urlTab = findControlByText(dialog, '[role="tab"]', "Z URL");
    if (!urlTab) throw new Error("Kapybara's URL image tab was not found.");
    urlTab.click();

    const input = await waitFor(
      () => dialog.querySelector('input[type="url"]'),
      3000,
      "Kapybara's image URL field was not found."
    );
    setInputValue(input, validated);

    const insert = await waitFor(
      () => {
        const control = findControlByText(dialog, "button", "Vložit");
        return control && !control.disabled ? control : null;
      },
      3000,
      "Kapybara did not enable image insertion."
    );
    insert.click();

    await waitFor(
      () => Array.from(parts.section.querySelectorAll("img"))
        .filter((image) => image.src === validated).length > existingCount,
      5000,
      "Kapybara did not confirm the inserted OPU image."
    );
    parts.editable?.focus();
    return validated;
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

  function findImageDialog() {
    return Array.from(document.querySelectorAll('[role="dialog"]'))
      .filter(isVisible)
      .find((dialog) => findControlByText(dialog, '[role="tab"]', "Z URL")) || null;
  }

  function findControlByText(scope, selector, text) {
    return Array.from(scope.querySelectorAll(selector))
      .find((node) => cleanText(node.textContent) === text) || null;
  }

  function setInputValue(input, value) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    if (setter) setter.call(input, value);
    else input.value = value;
    input.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
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

  function isVisible(node) {
    const rect = node.getBoundingClientRect();
    const style = window.getComputedStyle(node);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
  }

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }
})();
