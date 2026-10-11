const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const repo = path.resolve(__dirname, "..");

function harness(initial = {}) {
  const styles = new Map();
  const observers = [];
  const attributes = new Map([["data-theme", "traditional"]]);
  const rootElement = {
    setAttribute(name, value) { attributes.set(name, value); },
    getAttribute(name) { return attributes.get(name) || null; },
    hasAttribute(name) { return attributes.has(name); },
    removeAttribute(name) { attributes.delete(name); },
  };
  function element(tag) {
    const listeners = new Map();
    const children = [];
    return {
      tag,
      children,
      id: "",
      value: "",
      textContent: "",
      checked: false,
      disabled: false,
      setAttribute() {},
      appendChild(child) { children.push(child); return child; },
      append(...nodes) { children.push(...nodes); },
      addEventListener(name, fn) { listeners.set(name, fn); },
      fire(name) { listeners.get(name)?.(); },
      remove() { styles.delete(this.id); },
    };
  }
  const document = {
    documentElement: rootElement,
    createElement: element,
    getElementById(id) { return styles.get(id) || null; },
    head: {
      appendChild(node) { styles.set(node.id, node); },
    },
  };
  let registered;
  const Cudloun = {
    kapyguts: {
      isKapybara: () => true,
      colorThemeState: () => ({ ready: true, tokenPrefix: "--ðŸŸ-" }),
    },
    registerModule(module) { registered = module; },
  };
  const context = {
    window: { Cudloun },
    document,
    console,
    MutationObserver: class {
      constructor(callback) { this.callback = callback; observers.push(this); }
      observe() {}
      disconnect() { this.disconnected = true; }
      emit() { this.callback(); }
    },
  };
  vm.createContext(context);
  for (const file of ["modules/color-schemes-data.js", "modules/color-schemes.js"]) {
    vm.runInContext(fs.readFileSync(path.join(repo, file), "utf8"), context, { filename: file });
  }
  const values = new Map(Object.entries(initial));
  const ctx = {
    storage: {
      get(name, fallback) { return values.has(name) ? values.get(name) : fallback; },
      set(name, value) { values.set(name, value); },
    },
    log: { info() {}, warn() {} },
  };
  return { Cudloun, document, ctx, registered, rootElement, styles, observers, values };
}

test("Color Schemes ships opt-in and preserves attributed base palettes", () => {
  const { Cudloun, registered } = harness();
  const archive = JSON.parse(fs.readFileSync(path.join(repo, "okoun-barvy-data.json"), "utf8"));
  assert.equal(registered.id, "color-schemes");
  assert.equal(registered.defaultEnabled, false);
  assert.equal(Cudloun.colorSchemesData.schemaVersion, 1);
  assert.equal(Cudloun.colorSchemesData.base.traditional.primary, "#B85F00");
  assert.equal(Cudloun.colorSchemesData.base.dark["page-bg"], "#121212");
  assert.deepEqual(JSON.parse(JSON.stringify(Cudloun.colorSchemesData.base)), archive.base);
});

test("Color Schemes applies live-prefix tokens without changing the native theme", () => {
  const { Cudloun, registered, ctx, rootElement, styles } = harness({ mode: "dark" });
  const cleanup = registered.start(ctx);
  const css = styles.get("cudloun-color-schemes-style").textContent;
  assert.match(css, /--ðŸŸ-page-bg:#121212 !important/);
  assert.match(css, /--ðŸŸ-text-primary:#ffffff !important/);
  assert.match(css, /color-scheme:dark !important/);
  assert.equal(rootElement.getAttribute("data-theme"), "traditional");
  assert.equal(rootElement.getAttribute("data-cudloun-color-schemes"), "active");
  assert.equal(Cudloun.colorSchemes.state.status, "applied");
  cleanup();
  assert.equal(styles.size, 0);
  assert.equal(rootElement.hasAttribute("data-cudloun-color-schemes"), false);
});

test("Native reset removes overrides, and the legacy theme pauses/resumes them", () => {
  const { Cudloun, registered, ctx, rootElement, styles, observers, values } =
    harness({ mode: "traditional", customPrimary: true, accent: "#3d68c9" });
  const cleanup = registered.start(ctx);
  assert.match(styles.get("cudloun-color-schemes-style").textContent, /--ðŸŸ-primary:#3d68c9 !important/);
  rootElement.setAttribute("data-cudloun-kapybara-theme", "dark");
  observers[0].emit();
  assert.equal(styles.size, 0);
  assert.equal(Cudloun.colorSchemes.state.status, "conflict");
  rootElement.removeAttribute("data-cudloun-kapybara-theme");
  observers[0].emit();
  assert.equal(styles.size, 1);

  const ui = registered.renderSettings(ctx);
  const reset = ui.children.find((child) => child.textContent === "Reset to Native");
  reset.fire("click");
  assert.equal(values.get("mode"), "native");
  assert.equal(values.get("customPrimary"), false);
  assert.equal(styles.size, 0);
  assert.equal(rootElement.getAttribute("data-theme"), "traditional");
  cleanup();
  assert.equal(observers[0].disconnected, true);
});

test("Color Schemes fails closed on an unknown Kapybara token surface", () => {
  const { Cudloun, registered, ctx, styles } = harness({ mode: "light" });
  Cudloun.kapyguts.colorThemeState = () => ({ ready: false, tokenPrefix: "" });
  registered.start(ctx);
  assert.equal(styles.size, 0);
  assert.equal(Cudloun.colorSchemes.state.status, "unsupported");
});
