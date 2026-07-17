// Cudloun module registration for OPUc on Kapybara.
(function () {
  "use strict";

  const root = window.Cudloun;
  const runtime = root.opuc = root.opuc || {};

  root.registerModule({
    id: "opuc",
    name: "OPUc for Kapybara",
    description: "Upload an image through OPU and insert it into Kapybara's native editor.",
    version: "0.1.10",
    defaultEnabled: false,
    start(ctx) {
      if (!root.kapyguts?.isKapybara?.()) return null;
      runtime.firefoxUploadMode = normalizeFirefoxUploadMode(ctx.storage.get("firefoxUploadMode", "tab"));
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

      const modeLabel = document.createElement("label");
      modeLabel.className = "cudloun-setting-row";
      const modeText = document.createElement("span");
      modeText.className = "cudloun-setting-text";
      modeText.textContent = "Firefox upload mode";

      const mode = document.createElement("select");
      mode.className = "cudloun-select";
      mode.appendChild(modeOption("tab", "Native OPU tab (reliable)"));
      mode.appendChild(modeOption("background", "Background, no tab (experimental)"));
      mode.value = normalizeFirefoxUploadMode(ctx.storage.get("firefoxUploadMode", "tab"));
      mode.addEventListener("change", () => {
        const value = normalizeFirefoxUploadMode(mode.value);
        mode.value = value;
        runtime.firefoxUploadMode = value;
        ctx.storage.set("firefoxUploadMode", value);
      });

      modeLabel.appendChild(modeText);
      modeLabel.appendChild(mode);
      wrap.appendChild(modeLabel);
      return wrap;
    },
    renderHelp() {
      return [
        "Enable the module to add an OPUc button below the native image control in new-post and reply composers.",
        "The first version stages one image, uploads it to OPU, and inserts it through Kapybara's native URL image flow.",
        "On Firefox, OPUc uploads require Tampermonkey; Greasemonkey is not supported. The reliable mode briefly opens OPU, while the experimental background mode opens no tab.",
        "The background mode never retries through a tab automatically because OPU could otherwise receive the same image twice.",
        "OPUc never submits the Kapybara post. Review the inserted image and send or cancel the post yourself.",
      ];
    },
  });

  function normalizeFirefoxUploadMode(value) {
    return value === "background" ? "background" : "tab";
  }

  function modeOption(value, label) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    return option;
  }
})();
