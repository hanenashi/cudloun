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
  assert.equal(registered.version, "0.5.0");
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

test("Post Fonts exposes compact advanced roles with native-style size ranges", () => {
  const { root: Cudloun } = loadModule();
  assert.deepEqual(
    Array.from(Cudloun.postFonts.roles, ({ id, unit }) => [id, unit]),
    [["posts", "px"], ["interface", "px"], ["headings", "%"], ["code", "%"], ["logo", "%"]],
  );
  assert.equal(Cudloun.postFonts.longPressMs, 520);
  assert.equal(Cudloun.postFonts.normalizeRoleSize("interface", 99), 20);
  assert.equal(Cudloun.postFonts.normalizeRoleSize("headings", 112), 110);
  assert.equal(Cudloun.postFonts.normalizeRoleSize("code", "nope"), 100);
});

test("Post Fonts exposes expanded predefined safe font stacks", () => {
  const { root: Cudloun } = loadModule();
  assert.equal(
    Cudloun.postFonts.fontStack("classic-okoun"),
    "Verdana, \"Bitstream Vera Sans\", Arial, sans-serif",
  );
  assert.equal(Cudloun.postFonts.fontStack("georgia"), "Georgia, serif");
  assert.equal(Cudloun.postFonts.fontStack("system-mono"), "ui-monospace, \"SFMono-Regular\", Consolas, \"Liberation Mono\", monospace");
  assert.equal(Cudloun.postFonts.fontStack("comic-sans"), "\"Comic Sans MS\", cursive");
  assert.equal(Cudloun.postFonts.fontStack("default"), "");
  assert.equal(Cudloun.postFonts.fontStack("url(evil)"), "");
});

test("Post Fonts normalizes safe custom font stacks", () => {
  const { root: Cudloun } = loadModule();
  assert.equal(
    Cudloun.postFonts.normalizeCustomFamily('  "Atkinson   Hyperlegible", Arial,sans-serif  '),
    '"Atkinson Hyperlegible", Arial, sans-serif',
  );
  assert.equal(
    Cudloun.postFonts.fontStack("custom", "Noto Serif, serif"),
    "Noto Serif, serif",
  );
  assert.equal(Cudloun.postFonts.normalizeCustomFamily("Comic Sans MS, cursive"), "Comic Sans MS, cursive");
});

test("Post Fonts rejects unsafe or malformed custom font stacks", () => {
  const { root: Cudloun } = loadModule();
  [
    "url(https://example.com/font.woff)",
    "var(--post-font)",
    "Arial; color: red",
    "Arial,",
    "\"Unclosed font, serif",
    "Arial\\, serif",
  ].forEach((value) => assert.equal(Cudloun.postFonts.fontStack("custom", value), "", value));
});
