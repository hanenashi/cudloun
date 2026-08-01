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

function loadModule(search = "?k=chatk_colit", pathname = "/test/fonts") {
  const document = node();
  const Cudloun = { log: { info() {} } };
  const window = {
    Cudloun,
    location: {
      hostname: "kapybara.okoun.cz",
      pathname,
      search,
      hash: "",
      href: `https://kapybara.okoun.cz${pathname}${search}`,
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

function explainElement({ tag = "DIV", classes = [], attrs = {}, closest = {} } = {}) {
  return {
    nodeType: 1,
    tagName: tag,
    classList: classes,
    parentElement: null,
    getAttribute(name) { return attrs[name] ?? null; },
    closest(selector) { return closest[selector] || null; },
  };
}

test("Kapyguts recognizes the native font test route", () => {
  const kapyguts = loadModule();
  assert.equal(kapyguts.version, "0.5.0");
  assert.equal(kapyguts.route().type, "font-settings");
  assert.equal(kapyguts.selectors.nativeFontSettingsLink, "a[role='menuitem'][href='/test/fonts']");
});

test("Kapyguts explains known components with stable selectors and CSS skeletons", () => {
  const kapyguts = loadModule();
  const body = explainElement({ classes: ["body", "🐟-content", "🇸-trfpop"] });
  const paragraph = explainElement({ tag: "P", classes: ["🇸-paragraph"] });
  paragraph.parentElement = body;
  paragraph.closest = (selector) => selector === "article.post .body" ? body : null;

  const result = kapyguts.explain(paragraph);
  assert.equal(result.ok, true);
  assert.equal(result.component, "post body");
  assert.equal(result.element, paragraph);
  assert.equal(result.target, body);
  assert.equal(result.recommendedSelector, "article.post .body");
  assert.equal(result.selector, "article.post .body");
  assert.deepEqual(Array.from(result.avoid), [".🇸-paragraph", ".🐟-content", ".🇸-trfpop"]);
  assert.match(result.notes.join(" "), /generované nebo interní/);
  assert.equal(result.css, "article.post .body {\n  /* vlastní styl */\n}");
});

test("Kapyguts identifies classic code blocks and explains their whitespace fix", () => {
  const kapyguts = loadModule();
  const legacyCode = explainElement({ classes: ["code", "🇸-legacy"] });
  legacyCode.closest = (selector) => selector === "article.post .body > .code" ? legacyCode : null;

  const result = kapyguts.explain(legacyCode);
  assert.equal(result.component, "legacy code block");
  assert.equal(result.recommendedSelector, "article.post .body > .code");
  assert.match(result.notes.join(" "), /white-space: pre-wrap/);
  assert.deepEqual(Array.from(result.avoid), [".🇸-legacy"]);
});

test("Kapyguts uses conservative accessible fallbacks and handles missing selections", () => {
  const kapyguts = loadModule();
  const button = explainElement({
    tag: "BUTTON",
    attrs: { "aria-label": "Vlastní ovládání" },
  });
  const fallback = kapyguts.explain(button);
  assert.equal(fallback.component, "unknown element");
  assert.equal(fallback.recommendedSelector, 'button[aria-label="Vlastní ovládání"]');

  const missing = kapyguts.explain(null);
  assert.equal(missing.ok, false);
  assert.equal(missing.recommendedSelector, "");
  assert.match(missing.notes[0], /explain\(\$0\)/);
});

test("Kapyguts maps the temporary post-display route and labeled controls", () => {
  const kapyguts = loadModule("", "/test/posts");
  const largerGap = node({ text: "Větší mezera", attrs: { "aria-checked": "true" } });
  const separator = node({ text: "Oddělovač", attrs: { "aria-checked": "false" } });
  const optionLabels = [
    "Kruh (výchozí)", "Čtverec", "Zaoblený čtverec", "Obdélník 4:5", "Zaoblený 4:5",
    "contain (letterbox)", "cover (ořez)", "Bez", "1px linka",
  ];
  const optionButtons = optionLabels.map((label) => node({
    text: label,
    attrs: { "aria-pressed": ["Zaoblený 4:5", "cover (ořez)", "1px linka"].includes(label) ? "true" : "false" },
  }));
  const save = node({ text: "Uložit změny", disabled: false });
  const previewPost = node();
  const panel = node({
    many: {
      "button[role='switch']": [separator, largerGap],
      "button.av-seg-btn[aria-pressed]": optionButtons,
      button: [save, ...optionButtons, separator, largerGap],
      ".pd-section": [node(), node()],
      "article.post": [previewPost],
    },
  });
  const scope = node({ one: { ".pd-panel[role='dialog'][aria-labelledby='pd-title']": panel } });

  const parts = kapyguts.postDisplayParts(scope);
  const state = kapyguts.postDisplayState(scope);
  assert.equal(kapyguts.route().type, "post-display-settings");
  assert.equal(kapyguts.selectors.nativePostDisplayLink, "a[role='menuitem'][href='/test/posts']");
  assert.equal(parts.ready, true);
  assert.equal(parts.segmentButtons.length, 9);
  assert.equal(parts.previewPosts[0], previewPost);
  assert.equal(state.largerGap, true);
  assert.equal(state.separator, false);
  assert.equal(state.shape, "roundedRect");
  assert.equal(state.fit, "cover");
  assert.equal(state.ring, "hairline");
  assert.equal(state.dirty, true);
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
