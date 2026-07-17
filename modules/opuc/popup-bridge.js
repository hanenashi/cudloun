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
      item.popup.postMessage({ type: MESSAGE_TYPE, action: "upload", id, file: item.file }, OPU_ORIGIN);
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
    const id = new URLSearchParams(window.location.search).get("cudloun_bridge") || "";
    if (window.name !== `${WINDOW_PREFIX}${id}` || !validRequestId(id)) return;
    let request = null;
    const sendReady = () => window.opener?.postMessage({ type: MESSAGE_TYPE, action: "ready", id }, KAPYBARA_ORIGIN);
    const readyTimer = window.setInterval(sendReady, 350);

    window.addEventListener("message", (event) => {
      if (event.origin !== KAPYBARA_ORIGIN || event.source !== window.opener) return;
      if (event.data?.type !== MESSAGE_TYPE || event.data.id !== id) return;
      if (event.data.action === "cancel") {
        window.clearInterval(readyTimer);
        request?.abort?.();
        window.close();
        return;
      }
      if (event.data.action !== "upload" || request) return;
      window.clearInterval(readyTimer);
      const file = event.data.file;
      if (!(file instanceof Blob) || !String(file.type || "").startsWith("image/")) {
        sendResult(id, "", "The OPU upload window did not receive a valid image file.");
        return;
      }
      request = uploadOnOpu(id, file);
    });

    sendReady();
  }

  function uploadOnOpu(id, file) {
    const formData = new FormData();
    formData.append("obrazek[0]", file, String(file.name || "image"));
    formData.append("sizep", "0");
    formData.append("outputf", "auto");
    formData.append("tl_odeslat", "Odeslat");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${OPU_ORIGIN}/opupload.php`);
    xhr.withCredentials = true;
    xhr.timeout = 120000;
    xhr.upload.addEventListener("progress", (event) => {
      window.opener?.postMessage({
        type: MESSAGE_TYPE,
        action: "progress",
        id,
        lengthComputable: event.lengthComputable,
        loaded: event.loaded,
        total: event.total,
      }, KAPYBARA_ORIGIN);
    });
    xhr.addEventListener("load", () => {
      if (xhr.status !== 200) {
        sendResult(id, "", `OPU upload failed with HTTP ${xhr.status}.`);
        return;
      }
      const url = extractHtmlUrl(xhr.responseText);
      sendResult(id, url, url ? "" : "OPU uploaded the file, but its result page did not contain an image URL.");
    });
    xhr.addEventListener("error", () => sendResult(id, "", "The first-party OPU upload request failed."));
    xhr.addEventListener("timeout", () => sendResult(id, "", "The first-party OPU upload request timed out."));
    xhr.send(formData);
    return xhr;
  }

  function sendResult(id, url, error) {
    window.opener?.postMessage({ type: MESSAGE_TYPE, action: "result", id, url, error }, KAPYBARA_ORIGIN);
    window.setTimeout(() => window.close(), 80);
  }

  function extractHtmlUrl(html) {
    const doc = new DOMParser().parseFromString(String(html || ""), "text/html");
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

  function abortError() {
    const error = new Error("OPU upload cancelled.");
    error.name = "AbortError";
    return error;
  }
})();
