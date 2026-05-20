// Cudloun framework settings.
(function () {
  "use strict";

  const root = window.Cudloun;

  root.registerModule({
    id: "settoun",
    name: "Settoun",
    description: "Framework settings for Cudloun's own Babeta menu behavior.",
    version: "0.1.0",
    defaultEnabled: true,
    renderSettings(ctx) {
      const wrap = document.createElement("div");
      wrap.className = "cudloun-settings-list";

      const label = document.createElement("label");
      label.className = "cudloun-setting-row";

      const text = document.createElement("span");
      text.className = "cudloun-setting-text";
      text.textContent = "Show fullscreen";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = ctx.storage.get("showFullscreen", true) !== false;
      checkbox.addEventListener("change", () => {
        ctx.storage.set("showFullscreen", checkbox.checked);
        root.ui?.refreshMenuItems?.();
        ctx.hub.render();
      });

      label.appendChild(text);
      label.appendChild(checkbox);
      wrap.appendChild(label);
      return wrap;
    },
    renderHelp() {
      return [
        "Settoun holds settings for Cudloun itself.",
        "Show fullscreen controls whether the Babeta avatar menu includes the Fullscreen and Refresh quick actions.",
      ];
    },
  });
})();
