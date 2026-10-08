const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const rootPath = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(rootPath, "modules/opu-originals.js"), "utf8");
const thumb = "https://opu.peklo.biz/p/26/10/06/thumbs/1791283892-fab9f.jpg";
const full = "https://opu.peklo.biz/p/26/10/06/1791283892-fab9f.jpg";

function element(attributes = {}) {
  const attrs = { ...attributes };
  const listeners = new Map();
  return {
    isConnected: true,
    attrs,
    listeners,
    getAttribute(name) { return attrs[name] ?? null; },
    hasAttribute(name) { return Object.hasOwn(attrs, name); },
    setAttribute(name, value) { attrs[name] = value; },
    removeAttribute(name) { delete attrs[name]; },
    addEventListener(name, callback) { listeners.set(name, callback); },
    removeEventListener(name) { listeners.delete(name); },
  };
}

function setup(images = []) {
  let registered;
  let style = null;
  let observer = null;
  const timers = [];
  const wrapper = element();
  const imageNodes = images.map((src) => {
    const image = element({ src });
    image.closest = (selector) => selector === ".okimg-sized" ? wrapper : null;
    return image;
  });
  const document = {
    body: {},
    documentElement: {},
    head: { appendChild(node) { style = node; } },
    getElementById(id) { return style?.id === id ? style : null; },
    createElement() { return { remove() { style = null; } }; },
    querySelectorAll(selector) {
      assert.equal(selector, "article.post .body img[src]");
      return imageNodes;
    },
  };
  class MutationObserver {
    constructor(callback) { this.callback = callback; observer = this; }
    observe() {}
    disconnect() {}
    trigger() { this.callback(); }
  }
  const Cudloun = {
    kapyguts: {
      isKapybara: () => true,
      route: () => ({ type: "board" }),
      selectors: { postImage: "article.post .body img[src]" },
    },
    registerModule(module) { registered = module; },
  };
  const window = {
    Cudloun,
    location: { href: "https://kapybara.okoun.cz/boards/demo" },
    setTimeout(callback) { timers.push(callback); return timers.length; },
    clearTimeout() {},
    addEventListener() {},
    removeEventListener() {},
  };
  vm.runInNewContext(source, { window, document, MutationObserver, URL, console });
  return {
    Cudloun,
    registered,
    imageNodes,
    wrapper,
    get style() { return style; },
    triggerMutation() { observer?.trigger(); },
    runTimers() { while (timers.length) timers.shift()(); },
  };
}

test("OPU Originals is an opt-in Cudloun module", () => {
  const { registered } = setup();
  const manifest = JSON.parse(fs.readFileSync(path.join(rootPath, "modules.json"), "utf8"));
  const entry = manifest.modules.find((module) => module.id === "opu-originals");
  assert.equal(registered.id, "opu-originals");
  assert.equal(registered.defaultEnabled, false);
  assert.equal(entry.file, "modules/opu-originals.js");
  assert.equal(entry.defaultEnabled, false);
});

test("OPU Originals only accepts exact HTTPS OPU thumbnail image paths", () => {
  const { Cudloun } = setup();
  const convert = Cudloun.opuOriginals.originalUrl;
  assert.equal(convert(thumb), full);
  assert.equal(convert("/p/26/10/06/thumbs/1791283892-fab9f.jpg"), "");
  for (const url of [
    "http://opu.peklo.biz/p/26/10/06/thumbs/file.jpg",
    "https://evil.example/p/26/10/06/thumbs/file.jpg",
    "https://opu.peklo.biz.evil.example/p/26/10/06/thumbs/file.jpg",
    "https://user@opu.peklo.biz/p/26/10/06/thumbs/file.jpg",
    "https://opu.peklo.biz:8443/p/26/10/06/thumbs/file.jpg",
    "https://opu.peklo.biz/p/26/10/06/thumbs/file.svg",
    "https://opu.peklo.biz/p/26/10/06/file.jpg",
    `${thumb}?size=small`,
  ]) assert.equal(convert(url), "", url);
});

test("OPU Originals converts inline thumbnails and restores them on disable", () => {
  const other = "https://example.com/p/26/10/06/thumbs/file.jpg";
  const state = setup([thumb, other]);
  const cleanup = state.registered.start({ log: { info() {} } });
  const [image, untouched] = state.imageNodes;
  assert.equal(image.getAttribute("src"), full);
  assert.equal(untouched.getAttribute("src"), other);
  assert.equal(image.hasAttribute("data-cudloun-opu-originals"), true);
  assert.equal(state.wrapper.hasAttribute("data-cudloun-opu-originals"), true);
  assert.match(state.style.textContent, /max-height: none !important/);
  assert.equal(state.Cudloun.opuOriginals.status().converted, 1);
  cleanup();
  assert.equal(image.getAttribute("src"), thumb);
  assert.equal(image.hasAttribute("data-cudloun-opu-originals"), false);
  assert.equal(state.style, null);
});

test("OPU Originals falls back to a failed thumbnail without retrying it", () => {
  const state = setup([thumb]);
  const cleanup = state.registered.start({ log: { info() {} } });
  const image = state.imageNodes[0];
  image.listeners.get("error")();
  assert.equal(image.getAttribute("src"), thumb);
  assert.equal(image.hasAttribute("data-cudloun-opu-originals"), false);
  state.triggerMutation();
  state.runTimers();
  assert.equal(image.getAttribute("src"), thumb);
  cleanup();
});

test("OPU Originals follows dynamically changed image sources", () => {
  const secondThumb = "https://opu.peklo.biz/p/26/10/07/thumbs/1791391515-2bcca.png";
  const state = setup(["https://example.com/image.jpg"]);
  const cleanup = state.registered.start({ log: { info() {} } });
  const image = state.imageNodes[0];
  image.setAttribute("src", secondThumb);
  state.triggerMutation();
  state.runTimers();
  assert.equal(image.getAttribute("src"), "https://opu.peklo.biz/p/26/10/07/1791391515-2bcca.png");
  cleanup();
  assert.equal(image.getAttribute("src"), secondThumb);
});
