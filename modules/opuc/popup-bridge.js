// Firefox first-party OPU upload bridge.
(function () {
  "use strict";

  const OPU_ORIGIN = "https://opu.peklo.biz";
  const KAPYBARA_ORIGIN = "https://kapybara.okoun.cz";
  const MESSAGE_TYPE = "cudloun-opu-bridge-v1";
  const WINDOW_PREFIX = "cudloun_opu_";

  if (window.location.hostname === "opu.peklo.biz") {
    if (document.readyState === "loading") {
      window.addEventListener("DOMContentLoaded", startPopupHost, { once: true });
    } else {
      startPopupHost();
    }
    return;
  }

  const root = window.Cudloun;
  if (!root) return;
  const runtime = root.opuc = root.opuc || {};
  const pending = new Map();
  let listening = false;

  runtime.popupBridge = {
    shouldUse,
    upload,
  };

  function shouldUse() {
    return /\bFirefox\/\d/i.test(String(window.navigator?.userAgent || ""));
  }

  function upload(file, options = {}) {
    let item = null;
    let cancelled = false;

    const promise = new Promise((resolve, reject) => {
      const id = requestId();
      const popupName = `${WINDOW_PREFIX}${id}`;
      const url = `${OPU_ORIGIN}/?cudloun_bridge=${encodeURIComponent(id)}`;
      const popup = window.open(url, popupName, "popup=yes,width=560,height=680,resizable=yes,scrollbars=yes");
      if (!popup) {
        reject(new Error("Firefox blocked the OPU upload window. Allow pop-ups for kapybara.okoun.cz and retry."));
        return;
      }

      item = {
        id,
        file,
        sending: false,
        popup,
        resolve,
        reject,
        onProgress: options.onProgress,
        timeout: window.setTimeout(() => settle(id, new Error("The OPU upload window timed out.")), 130000),
        closedPoll: window.setInterval(() => {
          if (popup.closed) settle(id, new Error("The OPU upload window was closed before returning an image URL."));
        }, 400),
      };
      pending.set(id, item);
      ensureListener();
    });

    return {
      promise,
      abort() {
        if (cancelled) return;
        cancelled = true;
        if (!item) return;
        try {
          item.popup.postMessage({ type: MESSAGE_TYPE, action: "cancel", id: item.id }, OPU_ORIGIN);
        } catch (_error) {}
        settle(item.id, abortError());
      },
    };
  }

  function ensureListener() {
    if (listening) return;
    listening = true;
    window.addEventListener("message", onMessage);
  }

  function onMessage(event) {
    if (event.origin !== OPU_ORIGIN || event.data?.type !== MESSAGE_TYPE) return;
    const id = String(event.data.id || "");
    const item = pending.get(id);
    if (!item || event.source !== item.popup) return;

    if (event.data.action === "ready") {
      sendFileBytes(item);
      return;
    }
    if (event.data.action === "progress") {
      if (typeof item.onProgress === "function") {
        item.onProgress({
          lengthComputable: !!event.data.lengthComputable,
          loaded: Number(event.data.loaded) || 0,
          total: Number(event.data.total) || 0,
        });
      }
      return;
    }
    if (event.data.action !== "result") return;

    const url = validateOpuUrl(event.data.url);
    if (url) {
      settle(id, null, url);
      return;
    }
    settle(id, new Error(String(event.data.error || "OPU did not return an image URL.")));
  }

  async function sendFileBytes(item) {
    if (item.sending) return;
    item.sending = true;
    try {
      const bytes = await readFileBytes(item.file);
      if (!pending.has(item.id)) return;
      item.popup.postMessage({
        type: MESSAGE_TYPE,
        action: "upload",
        id: item.id,
        bytes,
        name: String(item.file.name || "image"),
        mime: String(item.file.type || "application/octet-stream"),
      }, OPU_ORIGIN, [bytes]);
    } catch (_error) {
      settle(item.id, new Error("Firefox could not read the selected image for the OPU handoff."));
    }
  }

  async function readFileBytes(file) {
    if (typeof file.arrayBuffer === "function") {
      try {
        return await file.arrayBuffer();
      } catch (_error) {
        // Some Firefox userscript compartments expose but cannot call it.
      }
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(reader.result));
      reader.addEventListener("error", () => reject(reader.error || new Error("FileReader failed.")));
      reader.readAsArrayBuffer(file);
    });
  }

  function settle(id, error, value) {
    const item = pending.get(id);
    if (!item) return;
    pending.delete(id);
    window.clearTimeout(item.timeout);
    window.clearInterval(item.closedPoll);
    try { item.popup.close(); } catch (_error) {}
    if (!pending.size && listening) {
      listening = false;
      window.removeEventListener("message", onMessage);
    }
    if (error) item.reject(error);
    else item.resolve(value);
  }

  function startPopupHost() {
    if (!window.opener || !window.name.startsWith(WINDOW_PREFIX)) return;
    const windowId = window.name.slice(WINDOW_PREFIX.length);
    if (!validRequestId(windowId)) return;
    const queryId = new URLSearchParams(window.location.search).get("cudloun_bridge") || "";

    // The query identifies the initial handoff page. OPU removes it while
    // redirecting to ?page=done, but window.name survives that navigation.
    if (!queryId) {
      completeNativeFormResult(windowId);
      return;
    }
    if (queryId !== windowId) return;

    let submitted = false;
    const id = windowId;
    const sendReady = () => window.opener?.postMessage({ type: MESSAGE_TYPE, action: "ready", id }, KAPYBARA_ORIGIN);
    const readyTimer = window.setInterval(sendReady, 350);

    window.addEventListener("message", (event) => {
      if (event.origin !== KAPYBARA_ORIGIN || event.source !== window.opener) return;
      if (event.data?.type !== MESSAGE_TYPE || event.data.id !== id) return;
      if (event.data.action === "cancel") {
        window.clearInterval(readyTimer);
        window.close();
        return;
      }
      if (event.data.action !== "upload" || submitted) return;
      window.clearInterval(readyTimer);
      const bytes = event.data.bytes;
      const mime = String(event.data.mime || "");
      if (!(bytes instanceof ArrayBuffer) || !bytes.byteLength || !mime.startsWith("image/")) {
        sendResult(id, "", "The OPU upload window did not receive a valid image file.");
        return;
      }
      const name = safeFileName(event.data.name);
      const file = new File([bytes], name, { type: mime });
      submitted = true;
      submitNativeOpuForm(id, file);
    });

    sendReady();
  }

  function submitNativeOpuForm(id, file) {
    try {
      const form = document.querySelector('form#xpc[action*="opupload.php"]');
      const fileInput = form?.querySelector('input[type="file"][name="obrazek[0]"]');
      if (!form || !fileInput) {
        sendResult(id, "", "OPU's native upload form was not found.");
        return;
      }

      const transfer = new DataTransfer();
      transfer.items.add(file);
      fileInput.files = transfer.files;
      setFormValue(form, "sizep", "0");
      setFormValue(form, "outputf", "auto");
      form.target = "_self";
      const submit = form.querySelector('[type="submit"][name="tl_odeslat"]');
      if (submit && typeof form.requestSubmit === "function") {
        form.requestSubmit(submit);
      } else {
        form.appendChild(hiddenInput("tl_odeslat", "Odeslat"));
        form.submit();
      }
    } catch (_error) {
      sendResult(id, "", "Firefox could not place the selected image into OPU's native upload form.");
    }
  }

  function setFormValue(form, name, value) {
    const field = form.querySelector(`[name="${name}"][value="${value}"]`);
    if (field && "checked" in field) field.checked = true;
    else if (field) field.value = value;
  }

  function hiddenInput(name, value) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    return input;
  }

  function completeNativeFormResult(id) {
    const url = extractDocumentUrl(document);
    const route = `${window.location.pathname}${window.location.search}`.slice(0, 160);
    sendResult(id, url, url ? "" : `OPU returned ${route || "/"} without an image URL.`);
  }

  function sendResult(id, url, error) {
    window.opener?.postMessage({ type: MESSAGE_TYPE, action: "result", id, url, error }, KAPYBARA_ORIGIN);
    window.setTimeout(() => window.close(), 80);
  }

  function extractDocumentUrl(doc) {
    const candidates = [];
    doc.querySelectorAll('input[value*="opu.peklo.biz/p/"]')
      .forEach((input) => candidates.push(input.value));
    doc.querySelectorAll('a[href*="opu.peklo.biz/p/"], img[src*="opu.peklo.biz/p/"]')
      .forEach((element) => candidates.push(element.getAttribute("href") || element.getAttribute("src")));
    for (const value of candidates) {
      const match = String(value || "").match(/(?:href|src)=["']([^"']+)["']/i);
      const url = validateOpuUrl(match?.[1] || value);
      if (url) return url;
    }
    return "";
  }

  function validateOpuUrl(value) {
    try {
      const url = new URL(String(value || "").trim().replace(/&amp;/gi, "&"));
      if (url.protocol !== "https:" || url.hostname !== "opu.peklo.biz" || !url.pathname.startsWith("/p/")) return "";
      return url.toString();
    } catch (_error) {
      return "";
    }
  }

  function requestId() {
    const random = typeof crypto?.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
    return random.replace(/[^a-z0-9_-]/gi, "").slice(0, 80);
  }

  function validRequestId(value) {
    return /^[a-z0-9_-]{12,80}$/i.test(String(value || ""));
  }

  function safeFileName(value) {
    const name = String(value || "image")
      .replace(/[\\/\x00-\x1f\x7f]+/g, "_")
      .trim()
      .slice(0, 180);
    return name || "image";
  }

  function abortError() {
    const error = new Error("OPU upload cancelled.");
    error.name = "AbortError";
    return error;
  }
})();
