const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

function node({ text = "", attrs = {}, value = "", disabled = false, one = {}, many = {} } = {}) {
  return {
    textContent: text,
    value,
    disabled,
    querySelector(selector) { return one[selector] || null; },
    querySelectorAll(selector) { return many[selector] || []; },
    getAttribute(name) { return attrs[name] ?? null; },
  };
}

function loadModule(search = "?k=chatk_colit") {
  const document = node();
  const Cudloun = { log: { info() {} } };
  const window = {
    Cudloun,
    location: {
      hostname: "kapybara.okoun.cz",
      pathname: "/test/fonts",
      search,
      hash: "",
      href: `https://kapybara.okoun.cz/test/fonts${search}`,
    },
    getComputedStyle(element) {
      return { backgroundImage: element.backgroundImage || "none" };
    },
  };
  const context = { window, document, URLSearchParams, console };
  vm.createContext(context);
  const source = fs.readFileSync(path.join(root, "modules/sys-kapyguts.js"), "utf8");
  vm.runInContext(source, context, { filename: "modules/sys-kapyguts.js" });
  return Cudloun.kapyguts;
}

test("Kapyguts recognizes the native font test route", () => {
  const kapyguts = loadModule();
  assert.equal(kapyguts.version, "0.3.0");
  assert.equal(kapyguts.route().type, "font-settings");
  assert.equal(kapyguts.selectors.nativeFontSettingsLink, "a[role='menuitem'][href='/test/fonts']");
});

test("Kapyguts owns the viewport edge-stripe painter", () => {
  const kapyguts = loadModule();
  const stripes = node();
  stripes.backgroundImage = "linear-gradient(to right, blue 0 12px, transparent 12px)";
  const scope = node({ one: { ".🐟-stripes": stripes } });

  const parts = kapyguts.pageChromeParts(scope);
  assert.equal(kapyguts.selectors.viewportStripes, ".🐟-stripes");
  assert.equal(parts.viewportStripes, stripes);
  assert.equal(parts.stripesActive, true);
  assert.match(parts.stripeBackground, /linear-gradient/);
});

test("Kapyguts maps native font controls without relying on layout order", () => {
  const kapyguts = loadModule();
  const selects = Object.fromEntries([
    ["Chrome", "#fs-chrome"],
    ["Headers", "#fs-chrome-headers"],
    ["Content", "#fs-content"],
    ["Code", "#fs-code"],
    ["Brand", "#fs-brand"],
  ].map(([value, selector]) => [selector, node({ value })]));
  const sizeLabels = ["Ovládání", "Nadpisy a záhlaví", "Obsah", "Kód (neproporcionální)", "Logo a značka"];
  const rows = sizeLabels.map((label, index) => node({
    text: `${label} jednotka`,
    one: { "input[type='number']": node({ value: String(16 + index) }) },
  }));
  const lowDpr = node({ text: "Náhrada písma při nízkém DPR (Tahoma na 1×)", attrs: { "aria-checked": "true" } });
  const reset = node({ text: "Obnovit výchozí" });
  const cancel = node({ text: "Zrušit" });
  const save = node({ text: "Uložit změnyUložit", disabled: true });
  const panel = node({
    one: selects,
    many: {
      "label.fs-size-row": rows,
      "button[role='switch']": [lowDpr],
      button: [reset, cancel, save],
    },
  });
  const scope = node({ one: { ".fs-panel[role='dialog'][aria-labelledby='fs-title']": panel } });

  const parts = kapyguts.fontSettingsParts(scope);
  const state = kapyguts.fontSettingsState(scope);
  assert.equal(parts.ready, true);
  assert.equal(parts.actions.save, save);
  assert.deepEqual(Object.keys(parts.sizes), ["chrome", "headers", "content", "code", "brand"]);
  assert.equal(state.serifExperiment, true);
  assert.equal(state.fonts.content, "Content");
  assert.equal(state.sizes.brand, "20");
  assert.equal(state.lowDprFallback, true);
  assert.equal(state.dirty, false);
});
