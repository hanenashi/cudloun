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
  const source = fs.readFileSync(path.join(root, "modules/post-tweaks.js"), "utf8");
  vm.runInContext(source, context, { filename: "modules/post-tweaks.js" });
  return { Cudloun, registered, source };
}

test("Post Tweaks registers as a default-disabled module", () => {
  const { registered } = loadModule();
  assert.equal(registered.id, "post-tweaks");
  assert.equal(registered.version, "0.1.0");
  assert.equal(registered.defaultEnabled, false);
  assert.equal(typeof registered.start, "function");
  assert.equal(typeof registered.renderSettings, "function");
});

test("Post Tweaks preserves the measured native display values", () => {
  const { Cudloun, source } = loadModule();
  assert.equal(Cudloun.postTweaks.defaults.shape, "circle");
  assert.equal(Cudloun.postTweaks.shapes["rounded-rect"].radius, "22%");
  assert.equal(Cudloun.postTweaks.shapes["rounded-rect"].aspect, "4 / 5");
  assert.match(source, /--post-gap:12px!important/u);
  assert.match(source, /--post-gap:16px!important/u);
  assert.match(source, /1px solid var\(--🐟-border\)/u);
  assert.doesNotMatch(source, /🇸-/u);
});

test("Post Tweaks loads after Classic Look and before Post Fonts", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "modules.json"), "utf8"));
  const classicIndex = manifest.modules.findIndex((module) => module.id === "classic-look");
  const tweaksIndex = manifest.modules.findIndex((module) => module.id === "post-tweaks");
  const fontsIndex = manifest.modules.findIndex((module) => module.id === "post-fonts");

  assert.ok(classicIndex < tweaksIndex);
  assert.ok(tweaksIndex < fontsIndex);
  assert.equal(manifest.modules[tweaksIndex].defaultEnabled, false);
});
