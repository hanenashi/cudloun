const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

function runtimeContext() {
  class FakeDOMParser {
    parseFromString(html) {
      const nodes = Array.from(String(html).matchAll(/<(input|a|img)\b([^>]*)>/gi)).map((match) => {
        const attributes = {};
        for (const attribute of match[2].matchAll(/([\w-]+)\s*=\s*(["'])(.*?)\2/g)) {
          attributes[attribute[1].toLowerCase()] = attribute[3];
        }
        return {
          tagName: match[1].toLowerCase(),
          value: attributes.value || "",
          getAttribute(name) {
            return attributes[String(name).toLowerCase()] || null;
          },
        };
      });
      return {
        querySelectorAll(selector) {
          if (selector.startsWith("input")) return nodes.filter((node) => node.tagName === "input");
          if (selector.startsWith("a")) return nodes.filter((node) => node.tagName === "a");
          if (selector.startsWith("img")) return nodes.filter((node) => node.tagName === "img");
          return [];
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
    "modules/opuc/popup-bridge.js",
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
  assert.match(seed, /^\/\/ @match\s+https:\/\/opu\.peklo\.biz\/\*$/m);

  const bundle = fs.readFileSync(path.join(root, "cudloun.bundle.js"), "utf8");
  const bridgeEntry = bundle.indexOf('if (window.location.hostname === "opu.peklo.biz")');
  const coreEntry = bundle.indexOf("// Cudloun modular core.");
  assert.ok(bridgeEntry >= 0 && coreEntry > bridgeEntry, "OPU bridge must run before the Kapybara core");
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
  assert.equal(client.validateOpuUrl("//opu.peklo.biz/p/12/image.png"), "https://opu.peklo.biz/p/12/image.png");
  assert.equal(client.validateOpuUrl("/p/12/image.png"), "https://opu.peklo.biz/p/12/image.png");
});

test("Firefox selects the first-party OPU popup transport", () => {
  const context = runtimeContext();
  context.window.location = { hostname: "kapybara.okoun.cz" };
  context.window.navigator = { userAgent: "Mozilla/5.0 Firefox/141.0" };
  load(context, "modules/opuc/popup-bridge.js");

  assert.equal(context.window.Cudloun.opuc.popupBridge.shouldUse(), true);
  context.window.navigator.userAgent = "Mozilla/5.0 Chrome/140.0.0.0 Safari/537.36";
  assert.equal(context.window.Cudloun.opuc.popupBridge.shouldUse(), false);
});

test("Firefox prepares selected bytes once and reuses the cached result", async () => {
  const context = runtimeContext();
  context.window.location = { hostname: "kapybara.okoun.cz" };
  context.window.navigator = { userAgent: "Mozilla/5.0 Firefox/142.0" };
  load(context, "modules/opuc/popup-bridge.js");

  let reads = 0;
  const expected = new Uint8Array([1, 2, 3, 4]).buffer;
  const file = {
    async arrayBuffer() {
      reads += 1;
      return expected;
    },
  };
  const bridge = context.window.Cudloun.opuc.popupBridge;
  const [first, second] = await Promise.all([bridge.prepare(file), bridge.prepare(file)]);

  assert.equal(reads, 1);
  assert.equal(first.byteLength, 4);
  assert.equal(second, first);
});

test("Firefox preparation falls back to reading the selected file through an object URL", async () => {
  const context = runtimeContext();
  context.window.location = { hostname: "kapybara.okoun.cz" };
  context.window.navigator = { userAgent: "Mozilla/5.0 Android Firefox/142.0" };
  context.URL = class FakeURL extends URL {
    static createObjectURL() { return "blob:greasemonkey-file"; }
    static revokeObjectURL() {}
  };
  context.FileReader = class FailingFileReader {
    addEventListener() {}
    readAsArrayBuffer() {
      const error = new Error("blocked");
      error.name = "NotReadableError";
      throw error;
    }
  };
  const expected = new Uint8Array([5, 6, 7]).buffer;
  context.fetch = async (url) => {
    assert.equal(url, "blob:greasemonkey-file");
    return { ok: true, arrayBuffer: async () => expected };
  };
  load(context, "modules/opuc/popup-bridge.js");

  const file = {
    async arrayBuffer() {
      const error = new Error("blocked");
      error.name = "SecurityError";
      throw error;
    },
  };
  const bytes = await context.window.Cudloun.opuc.popupBridge.prepare(file);
  assert.equal(bytes.byteLength, 3);
});

test("OPU client delegates Firefox uploads before starting a GM request", () => {
  const context = runtimeContext();
  const expected = { promise: Promise.resolve("popup"), abort() {} };
  let delegated = false;
  context.window.Cudloun.opuc = {
    popupBridge: {
      shouldUse: () => true,
      upload() {
        delegated = true;
        return expected;
      },
    },
  };
  load(context, "modules/opuc/client.js");

  assert.equal(context.window.Cudloun.opuc.client.upload(new Blob(["png"], { type: "image/png" })), expected);
  assert.equal(delegated, true);
});

test("OPU response and thumbnail helpers preserve validated URLs", () => {
  const context = runtimeContext();
  load(context, "modules/opuc/client.js");
  const client = context.window.Cudloun.opuc.client;
  const image = "https://opu.peklo.biz/p/12/34/56/image.png";

  assert.equal(client.extractUploadUrl(`<input id="link_1" value="${image}">`), image);
  assert.equal(client.extractUploadUrl(`<a href="${image}">uploaded</a>`), image);
  assert.equal(client.extractUploadUrl(`<img src="/p/12/34/56/image.png">`), image);
  assert.equal(client.extractUploadUrl(`{"url":"${image.replaceAll("/", "\\/")}"}`), image);
  assert.equal(client.getThumbUrl(image), "https://opu.peklo.biz/p/12/34/56/thumbs/image.png");
  assert.equal(client.getThumbUrl("https://evil.example/image.png"), "");
});

test("Firefox response variants normalize before OPU URL extraction", async () => {
  const context = runtimeContext();
  load(context, "modules/opuc/client.js");
  const client = context.window.Cudloun.opuc.client;
  const image = "https://opu.peklo.biz/p/12/34/56/firefox.png";
  const html = `<input id="link_1" value="${image}">`;
  const throwingText = {
    get responseText() { throw new Error("responseText unavailable"); },
    response: html,
  };

  assert.equal(await client.responseBodyText({ responseText: html }), html);
  assert.equal(await client.responseBodyText({ response: html }), html);
  assert.equal(await client.responseBodyText({ response: new Blob([html], { type: "text/html" }) }), html);
  assert.equal(await client.responseBodyText({ response: { nodeType: 9, documentElement: { outerHTML: html } } }), html);
  assert.equal(await client.responseBodyText(throwingText), html);
  assert.equal(client.extractUploadUrl(await client.responseBodyText({ response: html })), image);
});

test("OPU response cookie relay accepts only safe OPU cookie pairs", () => {
  const context = runtimeContext();
  load(context, "modules/opuc/client.js");
  const client = context.window.Cudloun.opuc.client;

  assert.equal(
    client.extractResponseCookies([
      "date: Fri, 17 Jul 2026 03:00:00 GMT",
      "set-cookie: opu260706=safe_session-123; path=/; secure; HttpOnly",
      "set-cookie: unrelated=ignored; path=/",
      "set-cookie: opu260706=duplicate-ignored; path=/",
    ].join("\r\n")),
    "opu260706=safe_session-123"
  );
  assert.equal(client.extractResponseCookies("set-cookie: opu260706=bad value; path=/"), "");
});

test("upload establishes a credentialed OPU session before posting", async () => {
  const context = runtimeContext();
  load(context, "modules/opuc/client.js");
  const client = context.window.Cudloun.opuc.client;
  const image = "https://opu.peklo.biz/p/12/34/56/firefox-upload.png";
  const requests = [];
  context.GM_xmlhttpRequest = (details) => {
    requests.push(details);
    if (details.method === "GET") {
      details.onload({
        status: 200,
        response: "<html>OPU</html>",
        responseHeaders: "set-cookie: opu260706=firefox_session; path=/; secure; HttpOnly",
        finalUrl: "https://opu.peklo.biz/",
      });
    } else {
      details.onload({
        status: 200,
        responseText: undefined,
        response: `<input id="link_1" value="${image}">`,
        finalUrl: "https://opu.peklo.biz/?page=done",
      });
    }
    return { abort() {} };
  };

  const request = client.upload(new Blob(["png"], { type: "image/png" }));
  assert.equal(await request.promise, image);
  assert.deepEqual(requests.map(({ method }) => method), ["GET", "POST"]);
  requests.forEach((details) => {
    assert.equal(details.anonymous, false);
    assert.equal(details.withCredentials, true);
    assert.equal(details.responseType, "text");
    assert.equal(details.cookiePartition.topLevelSite, "https://opu.peklo.biz");
  });
  assert.equal(requests[1].cookie, "opu260706=firefox_session");
  assert.equal(requests[1].headers.Cookie, "opu260706=firefox_session");
});

test("upload recovers Firefox's session-backed result after a blank redirect page", async () => {
  const context = runtimeContext();
  load(context, "modules/opuc/client.js");
  const client = context.window.Cudloun.opuc.client;
  const image = "https://opu.peklo.biz/p/26/07/17/firefox-recovered.png";
  const requests = [];
  const requestDetails = [];
  context.GM_xmlhttpRequest = (details) => {
    requests.push(`${details.method} ${details.url}`);
    requestDetails.push(details);
    if (details.method === "POST") {
      details.onload({
        status: 200,
        response: '<form id="xpc"><input name="obrazek[0]" type="file"></form>',
        finalUrl: "https://opu.peklo.biz/",
      });
    } else if (details.url.includes("page=done")) {
      details.onload({
        status: 200,
        response: `<input id="html_0" value="${image}">`,
        finalUrl: "https://opu.peklo.biz/?page=done",
      });
    } else {
      details.onload({
        status: 200,
        response: "<html>OPU</html>",
        responseHeaders: "set-cookie: opu260706=recovery_session; path=/; secure; HttpOnly",
        finalUrl: details.url,
      });
    }
    return { abort() {} };
  };

  assert.equal(await client.upload(new Blob(["png"], { type: "image/png" })).promise, image);
  assert.deepEqual(requests, [
    "GET https://opu.peklo.biz/",
    "POST https://opu.peklo.biz/opupload.php",
    "GET https://opu.peklo.biz/?page=done",
  ]);
  assert.equal(requestDetails[1].headers.Cookie, "opu260706=recovery_session");
  assert.equal(requestDetails[2].headers.Cookie, "opu260706=recovery_session");
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
