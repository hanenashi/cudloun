// Cudloun module registration for OPUc on Kapybara.
(function () {
  "use strict";

  const root = window.Cudloun;
  const runtime = root.opuc = root.opuc || {};

  root.registerModule({
    id: "opuc",
    name: "OPUc for Kapybara",
    description: "Upload an image through OPU and insert it into Kapybara's native editor.",
    version: "0.1.0",
    defaultEnabled: false,
    start(ctx) {
      if (!root.kapyguts?.isKapybara?.()) return null;
      return runtime.ui.start(ctx);
    },
    renderSettings(ctx) {
      const wrap = document.createElement("div");
      wrap.className = "cudloun-settings-list";

      const label = document.createElement("label");
      label.className = "cudloun-setting-row";
      const text = document.createElement("span");
      text.className = "cudloun-setting-text";
      text.textContent = "Maximum image size (MB)";

      const input = document.createElement("input");
      input.className = "cudloun-select";
      input.type = "number";
      input.min = "1";
      input.max = "100";
      input.step = "1";
      input.value = String(ctx.storage.get("maxUploadMb", 25));
      input.addEventListener("change", () => {
        const value = Math.max(1, Math.min(100, Number(input.value) || 25));
        input.value = String(value);
        ctx.storage.set("maxUploadMb", value);
      });

      label.appendChild(text);
      label.appendChild(input);
      wrap.appendChild(label);
      return wrap;
    },
    renderHelp() {
      return [
        "Enable the module to add an OPUc button below the native image control in new-post and reply composers.",
        "The first version stages one image, uploads it to OPU, and inserts it through Kapybara's native URL image flow.",
        "OPUc never submits the Kapybara post. Review the inserted image and send or cancel the post yourself.",
      ];
    },
  });
})();
