const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

function loadModule() {
  let registered = null;
  const Cudloun = {
    registerModule(module) {
      registered = module;
    },
  };
  const context = { window: { Cudloun }, console };
  vm.createContext(context);
  const source = fs.readFileSync(path.join(root, "modules/classic-look.js"), "utf8");
  vm.runInContext(source, context, { filename: "modules/classic-look.js" });
  return { root: Cudloun, registered, source };
}

test("Classic Look registers as an opt-in presentation module", () => {
  const { registered } = loadModule();
  assert.equal(registered.id, "classic-look");
  assert.equal(registered.version, "0.1.2");
  assert.equal(registered.defaultEnabled, false);
  assert.equal(typeof registered.start, "function");
});

test("Classic Look exposes measured classic typography and divider tokens", () => {
  const { root: Cudloun } = loadModule();
  assert.equal(Cudloun.classicLook.tokens.fontFamily, 'Verdana, "Bitstream Vera Sans", Arial, sans-serif');
  assert.equal(Cudloun.classicLook.tokens.baseSize, "15px");
  assert.equal(Cudloun.classicLook.tokens.contentSize, "16px");
  assert.equal(Cudloun.classicLook.tokens.divider, "#80aaff");
});

test("Classic Look styles only semantic Kapybara post parts", () => {
  const { source } = loadModule();
  [".🐟-stripes", "article.post", ".avatar-col", ".post-header", ".author", ".body", ".actions", ".reply-ref"].forEach((selector) => {
    assert.match(source, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });
  assert.match(source, /kapyguts\?\.selectors\?\.viewportStripes/u);
  assert.match(source, /\$\{VIEWPORT_STRIPES_SELECTOR\}\{\s*background:none!important;/u);
  assert.doesNotMatch(source, /🇸-/u);
});

test("Classic Look loads before Post Fonts so explicit font choices win", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "modules.json"), "utf8"));
  const classicIndex = manifest.modules.findIndex((module) => module.id === "classic-look");
  const postFontsIndex = manifest.modules.findIndex((module) => module.id === "post-fonts");

  assert.notEqual(classicIndex, -1);
  assert.equal(manifest.modules[classicIndex].defaultEnabled, false);
  assert.ok(classicIndex < postFontsIndex);
});
