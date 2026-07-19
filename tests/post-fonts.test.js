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
  const source = fs.readFileSync(path.join(root, "modules/post-fonts.js"), "utf8");
  vm.runInContext(source, context, { filename: "modules/post-fonts.js" });
  return { root: Cudloun, registered };
}

test("Post Fonts registers as an opt-in module", () => {
  const { registered } = loadModule();
  assert.equal(registered.id, "post-fonts");
  assert.equal(registered.defaultEnabled, false);
  assert.equal(typeof registered.start, "function");
});

test("Post Fonts normalizes manual pixel sizes", () => {
  const { root: Cudloun } = loadModule();
  assert.equal(Cudloun.postFonts.normalizeSize("18.5"), 18.5);
  assert.equal(Cudloun.postFonts.normalizeSize("18.26"), 18.5);
  assert.equal(Cudloun.postFonts.normalizeSize(4), 8);
  assert.equal(Cudloun.postFonts.normalizeSize(100), 72);
  assert.equal(Cudloun.postFonts.normalizeSize("nope"), 17);
});

test("Post Fonts exposes only predefined safe font stacks", () => {
  const { root: Cudloun } = loadModule();
  assert.equal(Cudloun.postFonts.fontStack("georgia"), "Georgia, serif");
  assert.equal(Cudloun.postFonts.fontStack("default"), "");
  assert.equal(Cudloun.postFonts.fontStack("url(evil)"), "");
});
