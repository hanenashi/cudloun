const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const rootPath = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(rootPath, "modules/first-unread.js"), "utf8");

function loadModule({ hash = "", interrupted = false } = {}) {
  let routePath = "/boards/demo";
  let registered = null;
  const scrollCalls = [];
  const timers = [];
  const listeners = new Map();
  const unread = {
    isConnected: true,
    getAttribute(name) { return name === "data-post-id" ? "123" : null; },
    getBoundingClientRect() { return { top: 300, height: 100 }; },
  };
  const titleLink = { href: `https://kapybara.okoun.cz${routePath}` };
  const Cudloun = {
    currentRoute: () => `${routePath}${hash}`,
    kapyguts: {
      isKapybara: () => true,
      isBoardPage: () => true,
      route: () => ({ type: "board", path: routePath, hash, boardId: routePath.split("/").pop() }),
      allPosts: () => [unread],
      firstUnreadPost: () => unread,
      boardHeaderParts: () => ({ titleLink, titleRow: null }),
      pageHeaderParts: () => ({ header: null }),
    },
    registerModule(module) { registered = module; },
  };
  class MutationObserver {
    observe() {}
    disconnect() {}
  }
  const window = {
    Cudloun,
    location: { href: `https://kapybara.okoun.cz${routePath}${hash}` },
    scrollY: 0,
    scrollX: 0,
    setTimeout(callback) { timers.push(callback); return timers.length; },
    clearTimeout() {},
    addEventListener(type, callback) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(callback);
    },
    removeEventListener(type, callback) { listeners.get(type)?.delete(callback); },
    getComputedStyle() { return { display: "block", position: "static" }; },
    scrollTo(options) { scrollCalls.push(options); },
  };
  const document = { body: {}, documentElement: {} };
  const context = {
    window,
    document,
    MutationObserver,
    URL,
    console,
    requestAnimationFrame(callback) { callback(); return 1; },
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: "modules/first-unread.js" });
  const cleanup = registered.start({
    log: { info() {}, debug() {}, warn() {} },
  });
  if (interrupted) listeners.get("wheel")?.forEach((callback) => callback({}));
  const runTimers = () => { while (timers.length) timers.shift()(); };
  runTimers();
  return {
    Cudloun,
    registered,
    cleanup,
    scrollCalls,
    listeners,
    runTimers,
    setRoute(nextPath) {
      routePath = nextPath;
      titleLink.href = `https://kapybara.okoun.cz${routePath}`;
      window.location.href = `${titleLink.href}${hash}`;
    },
  };
}

test("First Unread is an explicit opt-in module registered after Settoun", () => {
  const { registered, cleanup } = loadModule({ hash: "#skip-initial-jump" });
  const manifest = JSON.parse(fs.readFileSync(path.join(rootPath, "modules.json"), "utf8"));
  const index = manifest.modules.findIndex((module) => module.id === "first-unread");

  assert.equal(registered.id, "first-unread");
  assert.equal(registered.version, "0.1.0");
  assert.equal(registered.defaultEnabled, false);
  assert.ok(index > manifest.modules.findIndex((module) => module.id === "settoun"));
  assert.equal(manifest.modules[index].defaultEnabled, false);
  cleanup();
});

test("First Unread scrolls once to the semantic unread post with header clearance", () => {
  const { Cudloun, cleanup, scrollCalls } = loadModule();

  assert.equal(scrollCalls.length, 1);
  assert.equal(scrollCalls[0].top, 292);
  assert.equal(scrollCalls[0].left, 0);
  assert.equal(scrollCalls[0].behavior, "auto");
  assert.equal(Cudloun.firstUnread.status().handled, true);
  Cudloun.firstUnread.schedule();
  assert.equal(scrollCalls.length, 1);
  cleanup();
});

test("First Unread preserves explicit anchors and manual scrolling", () => {
  const anchored = loadModule({ hash: "#post-123" });
  assert.equal(anchored.scrollCalls.length, 0);
  anchored.cleanup();

  const interrupted = loadModule({ interrupted: true });
  assert.equal(interrupted.scrollCalls.length, 0);
  assert.equal(interrupted.Cudloun.firstUnread.status().userInterrupted, true);
  interrupted.cleanup();
});

test("First Unread rearms once when a sibling club route renders", () => {
  const qa = loadModule();
  assert.equal(qa.scrollCalls.length, 1);
  qa.setRoute("/boards/sibling");
  qa.Cudloun.firstUnread.schedule();
  qa.runTimers();
  assert.equal(qa.scrollCalls.length, 2);
  assert.equal(qa.Cudloun.firstUnread.status().route, "/boards/sibling");
  qa.cleanup();
});

test("First Unread is traffic-free and does not mutate read markers", () => {
  assert.doesNotMatch(source, /fetch\(|XMLHttpRequest|GM_xmlhttpRequest|setInterval/);
  assert.doesNotMatch(source, /removeAttribute\(["']data-unread|classList\.(?:add|remove|toggle)/);
  assert.match(source, /firstUnreadPost\(\)/);
  assert.match(source, /attributeFilter: \["data-unread"\]/);
});
