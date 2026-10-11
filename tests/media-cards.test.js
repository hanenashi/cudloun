const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const rootPath = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(rootPath, "modules/media-cards.js"), "utf8");

function setup(providers = []) {
  let registered;
  let observer;
  let routeType = "board";
  let cards = [];
  const timers = [];
  const cues = providers.map((provider, index) => {
    const attrs = { "data-cue-id": `id-${index}`, "data-cue-open": "true" };
    const cue = {
      isConnected: true,
      clicks: 0,
      getAttribute(name) { return attrs[name] ?? null; },
      click() {
        this.clicks++;
        attrs["data-cue-open"] = attrs["data-cue-open"] === "true" ? "false" : "true";
        if (attrs["data-cue-open"] === "false") cards = cards.filter((card) => card.cue !== this);
      },
    };
    return cue;
  });
  cards = providers.map((provider, index) => ({
    cue: cues[index],
    className: provider === "class-only-youtube" ? "okoun-embed okoun-embed--youtube" : "okoun-embed",
    getAttribute(name) {
      return { "data-embed-provider": provider === "class-only-youtube" ? null : provider, "data-embed-id": `id-${index}` }[name] ?? null;
    },
    previousElementSibling: { querySelectorAll() { return [cues[index]]; } },
  }));
  const document = {
    body: {},
    querySelectorAll(selector) {
      assert.equal(selector, "article.post .body .okoun-embed");
      return cards;
    },
  };
  class MutationObserver {
    constructor(callback) { this.callback = callback; observer = this; }
    observe() {}
    disconnect() {}
    trigger() { this.callback(); }
  }
  const Cudloun = {
    kapyguts: { isKapybara: () => true, route: () => ({ type: routeType }) },
    registerModule(module) { registered = module; },
  };
  const window = {
    Cudloun,
    setTimeout(callback) { timers.push(callback); return timers.length; },
    clearTimeout() {},
    addEventListener() {},
    removeEventListener() {},
  };
  vm.runInNewContext(source, { window, document, MutationObserver, Set, console });
  return {
    registered, Cudloun, cues,
    get cards() { return cards; },
    set route(value) { routeType = value; },
    trigger() { observer.trigger(); while (timers.length) timers.shift()(); },
  };
}

test("Compact Media Links is a default-off current module", () => {
  const { registered } = setup();
  const manifest = JSON.parse(fs.readFileSync(path.join(rootPath, "modules.json"), "utf8"));
  const entry = manifest.modules.find((item) => item.id === "media-cards");
  assert.equal(registered.defaultEnabled, false);
  assert.equal(entry.category, "current");
  assert.equal(entry.defaultEnabled, false);
});

test("collapses video, YouTube, X and Twitter cards, but not other providers", () => {
  const state = setup(["video", "youtube", "x", "twitter", "class-only-youtube", "image"]);
  const stop = state.registered.start({ log: { info() {} } });
  assert.deepEqual(state.cues.map((cue) => cue.clicks), [1, 1, 1, 1, 1, 0]);
  assert.equal(state.Cudloun.mediaCards.status().collapsed, 5);
  state.trigger();
  assert.deepEqual(state.cues.map((cue) => cue.clicks), [1, 1, 1, 1, 1, 0]);
  stop();
  assert.deepEqual(state.cues.map((cue) => cue.clicks), [2, 2, 2, 2, 2, 0]);
});

test("does not collapse cards outside a board route", () => {
  const state = setup(["youtube"]);
  state.route = "home";
  const stop = state.registered.start({ log: { info() {} } });
  assert.equal(state.cues[0].clicks, 0);
  stop();
});
