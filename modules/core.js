// Cudloun modular core.
(function () {
  "use strict";

  const seed = CUDLOUN_SEED;
  const STORAGE_KEY = "cudloun.settings.v1";
  const MAX_LOGS = 500;
  const LEVELS = { off: 0, error: 1, warn: 2, info: 3, debug: 4, trace: 5 };
  const loadedFiles = [];
  const modules = [];
  const moduleState = new Map();
  const logs = [];
  const settings = loadSettings();

  const Cudloun = {
    version: seed.version,
    repoUrl: seed.repoUrl,
    cacheBust: seed.cacheBust,
    loadedFiles,
    modules,
    settings,
    log: makeLogger(),
    storage: {
      get: getSetting,
      set: setSetting,
      isModuleEnabled,
      setModuleEnabled,
      scope: scopedStorage,
    },
    registerModule,
    startModule,
    stopModule,
    restartModule,
    startEnabledModules,
    makeModuleContext,
    navigate(url) {
      window.location.assign(url);
    },
    currentRoute() {
      return `${window.location.pathname}${window.location.search}${window.location.hash}`;
    },
    util: {
      requestText: seed.requestText,
      loadScript,
    },
  };

  window.Cudloun = Cudloun;
  Cudloun.log.info("boot", "core initialized", seed.version);
  boot();

  async function boot() {
    try {
      const manifestUrl = `${seed.repoUrl}modules.json?v=${seed.cacheBust}`;
      Cudloun.log.debug("boot", "loading manifest", manifestUrl);
      const manifest = JSON.parse(await seed.requestText(manifestUrl));
      Cudloun.manifest = manifest;
      Cudloun.log.info("boot", "manifest loaded", manifest.version || "unversioned");

      await loadManifestGroup(manifest.system || [], "system");
      await loadManifestGroup(manifest.modules || [], "module");

      startEnabledModules();

      if (Cudloun.ui && typeof Cudloun.ui.start === "function") {
        Cudloun.ui.start();
      }

      Cudloun.log.info("boot", "ready", `${modules.length} module(s)`);
    } catch (error) {
      Cudloun.log.error("boot", "startup failed", error);
    }
  }

  async function loadManifestGroup(items, groupName) {
    for (const item of items) {
      if (!item || !item.file) continue;
      if (item.required || groupName === "module") {
        await loadScript(item.file, item.id || item.file);
      }
    }
  }

  async function loadScript(file, id) {
    const url = `${seed.repoUrl}${file}?v=${seed.cacheBust}`;
    Cudloun.log.debug("loader", "loading", id, url);
    const code = await seed.requestText(url);
    seed.execute(code, url);
    loadedFiles.push({ id, file, url, loadedAt: new Date().toISOString() });
    Cudloun.log.info("loader", "loaded", id);
  }

  function registerModule(module) {
    if (!module || !module.id) {
      Cudloun.log.warn("module", "ignored module without id", module);
      return;
    }

    if (modules.some((item) => item.id === module.id)) {
      Cudloun.log.warn("module", "duplicate module ignored", module.id);
      return;
    }

    const normalized = {
      version: "0.1.0",
      defaultEnabled: false,
      ...module,
    };

    modules.push(normalized);
    Cudloun.log.info("module", "registered", normalized.id, normalized.version);
  }

  function startEnabledModules() {
    modules.forEach((module) => {
      if (isModuleEnabled(module.id)) startModule(module.id);
    });
  }

  function startModule(moduleId) {
    const module = moduleById(moduleId);
    if (!module || moduleState.get(moduleId)?.started) return;

    const record = { started: true, cleanup: null };
    moduleState.set(moduleId, record);

    try {
      if (typeof module.start === "function") {
        record.cleanup = module.start(makeModuleContext(module)) || null;
      }
      Cudloun.log.info("module", "started", moduleId);
    } catch (error) {
      record.started = false;
      Cudloun.log.error("module", "start failed", moduleId, error);
    }
  }

  function stopModule(moduleId) {
    const module = moduleById(moduleId);
    const record = moduleState.get(moduleId);
    if (!module || !record?.started) return;

    try {
      if (typeof record.cleanup === "function") record.cleanup();
      if (typeof module.stop === "function") module.stop(makeModuleContext(module));
      Cudloun.log.info("module", "stopped", moduleId);
    } catch (error) {
      Cudloun.log.error("module", "stop failed", moduleId, error);
    } finally {
      moduleState.set(moduleId, { started: false, cleanup: null });
    }
  }

  function restartModule(moduleId) {
    stopModule(moduleId);
    if (isModuleEnabled(moduleId)) startModule(moduleId);
  }

  function makeModuleContext(module) {
    return {
      module,
      log: areaLogger(module.id),
      navigate: Cudloun.navigate,
      storage: scopedStorage(`module.${module.id}.`),
      hub: {
        open: () => Cudloun.ui?.openHub(module.id),
        close: () => Cudloun.ui?.closeHub(),
        render: () => Cudloun.ui?.renderHub(module.id),
      },
    };
  }

  function moduleById(moduleId) {
    return modules.find((module) => module.id === moduleId) || null;
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { modules: {}, values: { logLevel: "info" } };

      const parsed = JSON.parse(raw);
      return {
        modules: parsed.modules || {},
        values: { logLevel: "info", ...(parsed.values || {}) },
      };
    } catch (error) {
      return { modules: {}, values: { logLevel: "info" } };
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      Cudloun.log.warn("storage", "settings could not be saved", error);
    }
  }

  function getSetting(name, fallback) {
    return Object.prototype.hasOwnProperty.call(settings.values, name) ? settings.values[name] : fallback;
  }

  function setSetting(name, value) {
    settings.values[name] = value;
    saveSettings();
    Cudloun.log.debug("storage", "set", name, value);
  }

  function scopedStorage(prefix) {
    return {
      get(name, fallback) {
        return getSetting(prefix + name, fallback);
      },
      set(name, value) {
        setSetting(prefix + name, value);
      },
    };
  }

  function isModuleEnabled(moduleId) {
    const module = moduleById(moduleId);
    if (Object.prototype.hasOwnProperty.call(settings.modules, moduleId)) {
      return settings.modules[moduleId] !== false;
    }

    return module ? module.defaultEnabled !== false : false;
  }

  function setModuleEnabled(moduleId, enabled) {
    settings.modules[moduleId] = !!enabled;
    saveSettings();
    Cudloun.log.info("module", enabled ? "enabled" : "disabled", moduleId);
    if (enabled) startModule(moduleId);
    else stopModule(moduleId);
  }

  function makeLogger() {
    function write(level, area, args) {
      const entry = {
        time: new Date().toISOString(),
        level,
        area: area || "core",
        args: Array.from(args),
      };

      logs.push(entry);
      if (logs.length > MAX_LOGS) logs.shift();
      emit(entry);
    }

    function shouldEmit(level) {
      const current = String(getSetting("logLevel", "info")).toLowerCase();
      return (LEVELS[level] || 0) <= (LEVELS[current] || LEVELS.info);
    }

    function emit(entry) {
      if (!shouldEmit(entry.level)) return;

      const prefix = `[cudloun:${entry.area}]`;
      const method = entry.level === "error" ? "error" : entry.level === "warn" ? "warn" : "log";
      const style = {
        error: "color:#ff5c5c;background:#111;padding:2px 6px;border-radius:3px;font-weight:700;",
        warn: "color:#ffb020;background:#111;padding:2px 6px;border-radius:3px;font-weight:700;",
        info: "color:#63e6be;background:#111;padding:2px 6px;border-radius:3px;",
        debug: "color:#74c0fc;background:#111;padding:2px 6px;border-radius:3px;",
        trace: "color:#d0bfff;background:#111;padding:2px 6px;border-radius:3px;",
      }[entry.level] || "";

      console[method](`%c${prefix}`, style, ...entry.args);
    }

    return {
      entries: logs,
      level: () => getSetting("logLevel", "info"),
      setLevel: (level) => setSetting("logLevel", LEVELS[level] !== undefined ? level : "info"),
      trace(area, ...args) { write("trace", area, args); },
      debug(area, ...args) { write("debug", area, args); },
      info(area, ...args) { write("info", area, args); },
      warn(area, ...args) { write("warn", area, args); },
      error(area, ...args) { write("error", area, args); },
    };
  }

  function areaLogger(area) {
    return {
      trace: (...args) => Cudloun.log.trace(area, ...args),
      debug: (...args) => Cudloun.log.debug(area, ...args),
      info: (...args) => Cudloun.log.info(area, ...args),
      warn: (...args) => Cudloun.log.warn(area, ...args),
      error: (...args) => Cudloun.log.error(area, ...args),
    };
  }
})();
