// Cudloun module for live tweak containers.
(function () {
  "use strict";

  const root = window.Cudloun;
  const MODULE_ID = "containers";
  const loadedContainers = new Map();
  const runningContainers = new Set();
  let catalog = null;
  let loadingCatalog = null;

  root.registerModule({
    id: MODULE_ID,
    name: "Containers",
    description: "Small live demos that can be run from Cudloun or shared as console loaders.",
    version: "0.1.0",
    defaultEnabled: true,
    start(ctx) {
      loadCatalog(ctx).then(() => ctx.hub.render()).catch((error) => ctx.log.error("catalog load failed", error));
    },
    renderSettings(ctx) {
      const wrap = document.createElement("div");
      wrap.className = "cudloun-container-list";

      if (!catalog) {
        const loading = document.createElement("p");
        loading.textContent = "Loading container catalog...";
        wrap.appendChild(loading);
        loadCatalog(ctx).then(() => ctx.hub.render()).catch((error) => ctx.log.error("catalog load failed", error));
        return wrap;
      }

      catalog.containers.forEach((container) => {
        wrap.appendChild(renderContainerCard(container, ctx));
      });

      return wrap;
    },
    renderHelp() {
      return [
        "Containers are tiny standalone demos. They can run inside Cudloun, or as one console paste for someone who does not have Cudloun installed.",
        "This is meant for trying UI ideas on live Babeta pages before turning them into real modules or upstream changes.",
      ];
    },
  });

  async function loadCatalog(ctx) {
    if (catalog) return catalog;
    if (loadingCatalog) return loadingCatalog;

    loadingCatalog = root.util.requestText(`${root.repoUrl}containers.json?v=${root.cacheBust}`)
      .then((text) => {
        catalog = JSON.parse(text);
        ctx.log.info("catalog loaded", `${catalog.containers.length} container(s)`);
        return catalog;
      })
      .finally(() => {
        loadingCatalog = null;
      });

    return loadingCatalog;
  }

  function renderContainerCard(container, ctx) {
    const card = document.createElement("section");
    card.className = "cudloun-container-card";

    const title = document.createElement("h3");
    title.textContent = container.name;

    const description = document.createElement("p");
    description.textContent = container.description || "";

    const route = document.createElement("p");
    route.textContent = `Target: ${container.match.join(", ")}`;

    const actions = document.createElement("div");
    actions.className = "cudloun-container-actions";

    const run = button(runningContainers.has(container.id) ? "Re-run" : "Run");
    run.addEventListener("click", () => {
      runContainer(container, ctx).then(() => ctx.hub.render()).catch((error) => ctx.log.error("run failed", container.id, error));
    });

    const stop = button("Stop", "secondary");
    stop.disabled = !runningContainers.has(container.id);
    stop.addEventListener("click", () => {
      stopContainer(container, ctx);
      ctx.hub.render();
    });

    const copy = button("Copy console loader", "secondary");
    copy.addEventListener("click", () => {
      copyConsoleLoader(container, ctx, card);
    });

    actions.appendChild(run);
    actions.appendChild(stop);
    actions.appendChild(copy);

    card.appendChild(title);
    card.appendChild(description);
    card.appendChild(route);
    card.appendChild(actions);
    return card;
  }

  async function runContainer(container, ctx) {
    const api = await loadContainer(container, ctx);
    if (!api || typeof api.run !== "function") {
      throw new Error(`Container ${container.id} has no run()`);
    }

    api.run();
    runningContainers.add(container.id);
    ctx.log.info("ran container", container.id);
  }

  function stopContainer(container, ctx) {
    const api = loadedContainers.get(container.id);
    if (api && typeof api.stop === "function") {
      api.stop();
    }

    runningContainers.delete(container.id);
    ctx.log.info("stopped container", container.id);
  }

  async function loadContainer(container, ctx) {
    if (loadedContainers.has(container.id)) {
      return loadedContainers.get(container.id);
    }

    ensureRegistry();
    const url = `${root.repoUrl}${container.file}?v=${root.cacheBust}`;
    const code = await root.util.requestText(url);
    root.util.execute(code, url);

    const api = window.CudlounContainerRegistry.get(container.id);
    if (!api) {
      throw new Error(`Container ${container.id} did not register`);
    }

    loadedContainers.set(container.id, api);
    ctx.log.info("loaded container", container.id);
    return api;
  }

  function ensureRegistry() {
    if (window.CudlounContainerRegistry) return;

    const registry = new Map();
    window.CudlounContainerRegistry = {
      register(container) {
        if (!container || !container.id) return;
        registry.set(container.id, container);
      },
      get(id) {
        return registry.get(id) || null;
      },
      list() {
        return Array.from(registry.values());
      },
    };
  }

  function consoleLoader(container) {
    const url = `${root.repoUrl}${container.file}?v=${Date.now()}`;
    return `fetch(${JSON.stringify(url)}).then(r=>r.text()).then(code=>new Function(code)()).then(()=>window.CudlounFavoritePillColors&&window.CudlounFavoritePillColors.run());`;
  }

  function copyConsoleLoader(container, ctx, card) {
    const loader = consoleLoader(container);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(loader).then(() => {
        ctx.log.info("copied console loader", container.id);
      }).catch((error) => ctx.log.warn("clipboard failed", error));
    }

    card.querySelector(".cudloun-code-box")?.remove();
    const code = document.createElement("div");
    code.className = "cudloun-code-box";
    code.textContent = loader;
    card.appendChild(code);
  }

  function button(text, variant) {
    const element = document.createElement("button");
    element.type = "button";
    element.className = variant === "secondary" ? "cudloun-button cudloun-button-secondary" : "cudloun-button";
    element.textContent = text;
    return element;
  }
})();
