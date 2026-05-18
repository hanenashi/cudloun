// Cudloun logger control helpers.
(function () {
  "use strict";

  const root = window.Cudloun;
  const levels = ["off", "error", "warn", "info", "debug", "trace"];

  root.logger = {
    levels,
    recent(limit) {
      const count = Number(limit) || 120;
      return root.log.entries.slice(-count);
    },
    clear() {
      root.log.entries.length = 0;
      root.log.info("logger", "log buffer cleared");
    },
    setLevel(level) {
      root.log.setLevel(level);
      root.log.info("logger", "level set", level);
      if (root.ui && typeof root.ui.renderHub === "function") {
        root.ui.renderHub("debug");
      }
    },
  };

  root.log.info("logger", "ready", `level=${root.log.level()}`);
})();
