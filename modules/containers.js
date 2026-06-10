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
    version: "0.1.1",
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
        validateCatalog(catalog);
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

    if (root.feedback && typeof root.feedback.renderThread === "function") {
      card.appendChild(root.feedback.renderThread({
        kind: "container",
        id: container.id,
        name: container.name,
      }));
    }

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

    validateContainerEntry(container);
    ensureRegistry();
    const url = `${root.repoUrl}${container.file}?v=${root.cacheBust}`;
    const code = await root.util.requestText(url);
    await verifySha256(code, container.sha256);
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
    validateContainerEntry(container);
    const url = `${root.repoUrl}${container.file}?v=${Date.now()}`;
    const apiName = containerGlobalName(container);
    return [
      "(async()=>{",
      `const url=${JSON.stringify(url)};`,
      `const expected=${JSON.stringify(normalizeSha256(container.sha256))};`,
      "const code=await fetch(url).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.text();});",
      "const bytes=new TextEncoder().encode(code);",
      "const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');",
      "if(hash!==expected)throw new Error('Cudloun container hash mismatch');",
      "new Function(code)();",
      `const api=window[${JSON.stringify(apiName)}];`,
      "if(api&&typeof api.run==='function')api.run();",
      "})();",
    ].join("");
  }

  function containerGlobalName(container) {
    if (container.global) return container.global;

    return `Cudloun${container.id
      .split(/[^a-z0-9]+/i)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("")}`;
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

  function validateCatalog(nextCatalog) {
    if (!nextCatalog || !Array.isArray(nextCatalog.containers)) {
      throw new Error("Invalid container catalog");
    }

    nextCatalog.containers.forEach(validateContainerEntry);
  }

  function validateContainerEntry(container) {
    if (!container || !container.id || !container.file || !container.sha256) {
      throw new Error("Invalid container entry");
    }

    if (!/^[a-z0-9][a-z0-9-]*$/.test(container.id)) {
      throw new Error(`Invalid container id: ${container.id}`);
    }

    if (!/^containers\/[a-z0-9][a-z0-9-]*\.container\.js$/.test(container.file)) {
      throw new Error(`Refusing non-local container path: ${container.file}`);
    }

    normalizeSha256(container.sha256);
  }

  function normalizeSha256(value) {
    const hash = String(value || "").toLowerCase().replace(/^sha256-/, "");
    if (!/^[a-f0-9]{64}$/.test(hash)) {
      throw new Error("Invalid container sha256");
    }
    return hash;
  }

  async function verifySha256(text, expected) {
    if (!crypto || !crypto.subtle || typeof TextEncoder === "undefined") {
      throw new Error("SHA-256 verification is not available in this browser");
    }

    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const actual = Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    const wanted = normalizeSha256(expected);

    if (actual !== wanted) {
      throw new Error(`Container hash mismatch for ${wanted.slice(0, 12)}`);
    }
  }
})();
