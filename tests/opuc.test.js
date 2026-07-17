const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

function runtimeContext() {
  class FakeDOMParser {
    parseFromString(html) {
      const inputMatch = String(html).match(/<input[^>]+id=["']link_[^"']*["'][^>]+value=["']([^"']*)["']/i);
      return {
        querySelector() {
          return inputMatch ? { value: inputMatch[1] } : null;
        },
      };
    }
  }

  const context = {
    Blob,
    DOMParser: FakeDOMParser,
    Error,
    FormData,
    Math,
    Map,
    Promise,
    Set,
    URL,
    WeakMap,
    console,
  };
  context.window = { Cudloun: {} };
  vm.createContext(context);
  return context;
}

function load(context, file) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  vm.runInContext(source, context, { filename: file });
}

test("manifest registers OPUc as an ordered, default-disabled multi-file module", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "modules.json"), "utf8"));
  const module = manifest.modules.find((item) => item.id === "opuc");

  assert.ok(module);
  assert.equal(module.defaultEnabled, false);
  assert.deepEqual(module.files, [
    "modules/opuc/client.js",
    "modules/opuc/image-pipeline.js",
    "modules/opuc/kapybara-adapter.js",
    "modules/opuc/queue.js",
    "modules/opuc/styles.js",
    "modules/opuc/ui.js",
    "modules/opuc/index.js",
  ]);
  module.files.forEach((file) => assert.ok(fs.existsSync(path.join(root, file)), file));
});

test("seed and manifest release versions stay synchronized", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "modules.json"), "utf8"));
  const seed = fs.readFileSync(path.join(root, "cudloun.user.js"), "utf8");
  const version = seed.match(/^\/\/ @version\s+(\S+)$/m)?.[1];
  const bundleVersion = seed.match(/cudloun\.bundle\.js\?v=([^\s]+)/)?.[1];

  assert.equal(version, manifest.version);
  assert.equal(bundleVersion, manifest.version);
});

test("OPU URL validation accepts only HTTPS image paths on the expected host", () => {
  const context = runtimeContext();
  load(context, "modules/opuc/client.js");
  const client = context.window.Cudloun.opuc.client;

  assert.equal(
    client.validateOpuUrl("https://opu.peklo.biz/p/12/34/56/image.png"),
    "https://opu.peklo.biz/p/12/34/56/image.png"
  );
  assert.equal(client.validateOpuUrl("http://opu.peklo.biz/p/12/image.png"), "");
  assert.equal(client.validateOpuUrl("https://evil.example/p/12/image.png"), "");
  assert.equal(client.validateOpuUrl("https://opu.peklo.biz/?page=userpanel"), "");
});

test("OPU response and thumbnail helpers preserve validated URLs", () => {
  const context = runtimeContext();
  load(context, "modules/opuc/client.js");
  const client = context.window.Cudloun.opuc.client;
  const image = "https://opu.peklo.biz/p/12/34/56/image.png";

  assert.equal(client.extractUploadUrl(`<input id="link_1" value="${image}">`), image);
  assert.equal(client.getThumbUrl(image), "https://opu.peklo.biz/p/12/34/56/thumbs/image.png");
  assert.equal(client.getThumbUrl("https://evil.example/image.png"), "");
});

test("image validation enforces MIME, emptiness, and configured byte limit", () => {
  const context = runtimeContext();
  load(context, "modules/opuc/image-pipeline.js");
  const pipeline = context.window.Cudloun.opuc.imagePipeline;
  const image = new Blob(["1234"], { type: "image/png" });

  assert.equal(pipeline.validateFile(image, 10), image);
  assert.throws(() => pipeline.validateFile(new Blob(["x"], { type: "text/plain" }), 10), /not an image/);
  assert.throws(() => pipeline.validateFile(new Blob([], { type: "image/png" }), 10), /empty/);
  assert.throws(() => pipeline.validateFile(image, 3), /upload limit/);
  assert.equal(pipeline.formatBytes(1024 * 1024), "1 MB");
});

test("composer sessions are isolated and can be recreated after disposal", () => {
  const context = runtimeContext();
  load(context, "modules/opuc/queue.js");
  const queue = context.window.Cudloun.opuc.queue;
  const firstComposer = {};
  const secondComposer = {};
  const first = queue.ensure({ section: firstComposer });
  const second = queue.ensure({ section: secondComposer });

  assert.notEqual(first, second);
  assert.equal(queue.ensure({ section: firstComposer }), first);
  queue.dispose(first);
  assert.notEqual(queue.ensure({ section: firstComposer }), first);
  queue.disposeAll();
  assert.equal(queue.sessions.size, 0);
});
