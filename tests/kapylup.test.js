const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "kapylup.user.js"), "utf8");
const kapygutsSource = fs.readFileSync(path.join(root, "modules/sys-kapyguts.js"), "utf8");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "modules.json"), "utf8"));

test("Kapylup is an installable Kapybara userscript pinned to the canonical Kapyguts source", () => {
  const metadataVersion = source.match(/^\/\/ @version\s+(\S+)$/m)?.[1];
  const runtimeVersion = source.match(/const VERSION = "([^"]+)"/)?.[1];
  const requireVersion = source.match(/modules\/sys-kapyguts\.js\?v=([^\s]+)/)?.[1];

  assert.equal(metadataVersion, "0.1.1");
  assert.equal(runtimeVersion, metadataVersion);
  assert.equal(requireVersion, manifest.version);
  assert.match(source, /^\/\/ @match\s+https:\/\/kapybara\.okoun\.cz\/\*$/m);
  assert.match(source, /^\/\/ @run-at\s+document-idle$/m);
  assert.match(source, /window\.Kapyguts\.explain\(element\)/);
  assert.match(kapygutsSource, /window\.Kapyguts = kapyguts/);
  assert.doesNotMatch(source, /article\.post|board-header|new-post-composer|🐟-|🇸-/);
});

test("Kapylup provides keyboard and pointer selection without intercepting editors", () => {
  assert.match(source, /hotkey: "K"/);
  assert.match(source, /document\.addEventListener\("keydown", handleGlobalKeydown, true\)/);
  assert.match(source, /document\.addEventListener\("pointermove", handlePointerMove, true\)/);
  assert.match(source, /document\.addEventListener\("click", handleSelectionClick, true\)/);
  assert.match(source, /node\.matches\("input,textarea,select,\[contenteditable='true'\]"\)/);
  assert.match(source, /event\.key === "Escape" && state\.selecting/);
  assert.match(source, /event\.preventDefault\(\);\s*event\.stopImmediatePropagation\(\);\s*inspectElement\(element\)/);
  assert.match(source, /toggleAttribute\("data-kapylup-selecting", state\.selecting\)/);
  assert.match(source, /cursor: crosshair !important/);
  assert.match(source, /document\.elementsFromPoint\(x, y\)/);
  assert.match(source, /document\.addEventListener\("wheel", handleSelectionWheel, \{ capture: true, passive: false \}\)/);
  assert.match(source, /function cycleCandidate\(direction\)/);
  assert.match(source, /function cycleHierarchy\(direction\)/);
  assert.match(source, /state\.hoveredElement \|\| event\.composedPath\(\)/);
});

test("Kapylup inspector window is isolated, draggable, resizable, and copy-oriented", () => {
  assert.match(source, /attachShadow\(\{ mode: "open" \}\)/);
  assert.match(source, /resize: both/);
  assert.match(source, /header\.addEventListener\("pointerdown", beginPanelDrag\)/);
  assert.match(source, /setPointerCapture\(event\.pointerId\)/);
  assert.match(source, /new ResizeObserver\(\(\) => scheduleGeometrySave\(\)\)/);
  assert.match(source, /Kopírovat vše/);
  assert.match(source, /data-copy="related:\$\{index\}"/);
  assert.match(source, /GM_setClipboard/);
  assert.match(source, /navigator\.clipboard\?\.writeText/);
  assert.match(source, /console\.groupCollapsed\(`/);
  assert.match(source, /console\.log\("Selected element:", result\.element\)/);
  assert.match(source, /console\.log\("Kapyguts target:", result\.target\)/);
  assert.match(source, /data-cycle="previous"/);
  assert.match(source, /data-cycle="next"/);
  assert.match(source, /data-cycle="parent"/);
  assert.match(source, /data-cycle="child"/);
  assert.match(source, /data-cycle="confirm"/);
});

test("Kapylup settings are reachable from the userscript manager and expose version and panel policy", () => {
  assert.match(source, /Kapylup: nastavení \(v\$\{VERSION\}\)/);
  assert.match(source, /Kapylup: přepnout výběr prvku/);
  assert.match(source, /Kapylup: ukázat\/skrýt okno/);
  assert.match(source, /data-setting="hotkey"/);
  assert.match(source, /data-setting="cycle-previous"/);
  assert.match(source, /data-setting="cycle-next"/);
  assert.match(source, /cyclePreviousKey: "\["/);
  assert.match(source, /cycleNextKey: "\]"/);
  assert.match(source, /data-setting="show-panel"/);
  assert.match(source, /showPanelOnSelection/);
  assert.match(source, /Verze Kapylupu/);
  assert.match(source, /Zdroj překladu/);
  assert.match(source, /GM_getValue/);
  assert.match(source, /GM_setValue/);
});

test("Kapylup includes concise Czech help for selection and overlapping elements", () => {
  assert.match(source, /data-action="help"/);
  assert.match(source, /Kapylup · nápověda/);
  assert.match(source, /Překrývající se prvky/);
  assert.match(source, /Kolečkem myši/);
  assert.match(source, /Kopírovat vše/);
});
