const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

function loadModule() {
  let registered = null;
  const Cudloun = { registerModule(module) { registered = module; } };
  const context = { window: { Cudloun }, console };
  vm.createContext(context);
  const source = fs.readFileSync(path.join(root, "modules/kapybara-theme.js"), "utf8");
  vm.runInContext(source, context, { filename: "modules/kapybara-theme.js" });
  return { registered, source };
}

test("Kapybara Theme remains an opt-in Lucifer-inspired presentation module", () => {
  const { registered } = loadModule();
  assert.equal(registered.id, "kapybara-theme");
  assert.equal(registered.version, "0.2.0");
  assert.equal(registered.defaultEnabled, false);
  assert.match(registered.description, /Lucifer-inspired/);
});

test("Kapybara Theme uses stable parts and repairs dynamic legacy code blocks", () => {
  const { source } = loadModule();
  ["header:not(.board-header):not(.post-header)", "header.board-header", "article.post", ".post-header", ".body > .code", ".markdown-code", ".🐟-stripes"].forEach((selector) => {
    assert.match(source, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });
  assert.match(source, /white-space:pre-wrap!important/);
  assert.match(source, /@media \(max-width:640px\)/);
  assert.doesNotMatch(source, /\[class\*=[^\]]*🇸-/u);
});

test("Kapybara Theme retains shared variables for the other Cudloun modules", () => {
  const { source } = loadModule();
  ["--cudloun-kapybara-bg", "--cudloun-kapybara-surface", "--cudloun-kapybara-text", "--cudloun-kapybara-accent"].forEach((token) => {
    assert.match(source, new RegExp(token));
  });
});
