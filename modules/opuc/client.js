// OPU transport and response helpers for the Cudloun OPUc module.
(function () {
  "use strict";

  const root = window.Cudloun;
  const runtime = root.opuc = root.opuc || {};
  const OPU_URL = "https://opu.peklo.biz/";
  const KAPYBARA_ORIGIN = "https://kapybara.okoun.cz";
  const GALLERY_URL = "https://opu.peklo.biz/?page=userpanel";
  const UPLOAD_URL = "https://opu.peklo.biz/opupload.php";

  runtime.client = {
    galleryUrl: GALLERY_URL,
    uploadUrl: UPLOAD_URL,
    checkLoginStatus,
    upload,
    responseBodyText,
    extractUploadUrl,
    validateOpuUrl,
    getThumbUrl,
  };

  async function checkLoginStatus() {
    const request = gmRequest({ method: "GET", url: GALLERY_URL, timeout: 20000 });
    const response = await request.promise;
    const finalUrl = String(response.finalUrl || response.responseURL || "");
    return finalUrl ? !finalUrl.includes("page=prihlaseni") : false;
  }

  function upload(file, options = {}) {
    const unsupported = runtime.popupBridge?.unsupportedReason?.();
    if (unsupported) return rejectedRequest(unsupported);
    if (runtime.popupBridge?.shouldUseBackground?.()) return uploadInBackground(file, options);
    if (runtime.popupBridge?.shouldUse?.()) return runtime.popupBridge.upload(file, options);

    return uploadDirect(file, options);
  }

  function uploadDirect(file, options = {}, requestOptions = {}) {

    const formData = new FormData();
    formData.append("obrazek[0]", file);
    formData.append("sizep", "0");
    formData.append("outputf", "auto");
    formData.append("tl_odeslat", "Odeslat");

    const request = gmRequest({
      ...requestOptions,
      method: "POST",
      url: UPLOAD_URL,
      data: formData,
      timeout: 120000,
      onprogress: options.onProgress,
    });

    return {
      abort: request.abort,
      promise: request.promise.then(async (response) => {
        if (response.status !== 200) throw new Error(`OPU upload failed with HTTP ${response.status}.`);
        const body = await responseBodyText(response);
        const url = extractUploadUrl(body) || validateOpuUrl(safeResponseValue(response, "finalUrl"));
        if (!url) throw new Error("OPU upload response did not contain an image URL.");
        return url;
      }),
    };
  }

  function uploadInBackground(file, options = {}) {
    let activeRequest = null;
    let cancelled = false;

    const promise = (async () => {
      const bytes = await runtime.popupBridge.prepare(file);
      if (cancelled) throw abortError();

      const name = safeFileName(file?.name);
      const mime = String(file?.type || "application/octet-stream");
      const stagedFile = new File([bytes], name, { type: mime });
      const cookiePartition = { topLevelSite: KAPYBARA_ORIGIN };

      // Seed Tampermonkey's OPU cookie jar before the multipart POST. There is
      // deliberately no automatic tab fallback: OPU may have accepted a POST
      // even when a manager hides its result, and retrying would duplicate it.
      activeRequest = gmRequest({ method: "GET", url: OPU_URL, cookiePartition, timeout: 20000 });
      const sessionResponse = await activeRequest.promise;
      if (sessionResponse.status && (sessionResponse.status < 200 || sessionResponse.status >= 400)) {
        throw new Error(`OPU session request failed with HTTP ${sessionResponse.status}.`);
      }
      if (cancelled) throw abortError();

      activeRequest = uploadDirect(stagedFile, options, { cookiePartition });
      return await activeRequest.promise;
    })();

    return {
      promise,
      abort() {
        if (cancelled) return;
        cancelled = true;
        activeRequest?.abort?.();
      },
    };
  }

  function rejectedRequest(message) {
    return {
      promise: Promise.reject(new Error(message)),
      abort() {},
    };
  }

  function safeFileName(value) {
    const name = String(value || "image")
      .replace(/[\\/\x00-\x1f\x7f]+/g, "_")
      .trim()
      .slice(0, 180);
    return name || "image";
  }

  async function responseBodyText(response) {
    const responseText = safeResponseValue(response, "responseText");
    if (typeof responseText === "string" && responseText) return responseText;

    const body = safeResponseValue(response, "response");
    if (typeof body === "string") return body;
    if (!body) {
      const xml = safeResponseValue(response, "responseXML");
      return serializeDocument(xml);
    }
    if (typeof body.text === "function") {
      try {
        return await body.text();
      } catch (_error) {
        // Continue to the document/object fallbacks below.
      }
    }
    const serialized = serializeDocument(body);
    if (serialized) return serialized;
    if (typeof body === "object") {
      try {
        return JSON.stringify(body);
      } catch (_error) {
        return "";
      }
    }
    return String(body || "");
  }

  function extractUploadUrl(html) {
    const source = String(html || "");
    if (!source) return "";
    const doc = new DOMParser().parseFromString(source, "text/html");
    const candidates = [];

    doc.querySelectorAll('input[id^="link_"], input[name^="link"], input[value*="opu.peklo.biz/p/"]')
      .forEach((input) => candidates.push(input.value));
    doc.querySelectorAll('a[href*="opu.peklo.biz/p/"], a[href^="/p/"]')
      .forEach((link) => candidates.push(link.getAttribute("href")));
    doc.querySelectorAll('img[src*="opu.peklo.biz/p/"], img[src^="/p/"]')
      .forEach((image) => candidates.push(image.getAttribute("src")));

    for (const value of candidates) {
      const direct = extractCandidateUrl(value);
      if (direct) return direct;
    }

    const unescaped = source.replace(/\\\//g, "/");
    const rawMatches = unescaped.match(/(?:https?:)?\/\/opu\.peklo\.biz\/p\/[^\s"'<>\\]+|\/p\/[^\s"'<>\\]+/gi) || [];
    for (const value of rawMatches) {
      const direct = validateOpuUrl(value);
      if (direct) return direct;
    }
    return "";
  }

  function extractCandidateUrl(value) {
    const text = String(value || "");
    const match = text.match(/(?:href|src)=["']([^"']+)["']/i);
    return validateOpuUrl(match?.[1] || text);
  }

  function validateOpuUrl(value) {
    try {
      let candidate = String(value || "").trim().replace(/&amp;/gi, "&");
      if (candidate.startsWith("//")) candidate = `https:${candidate}`;
      if (candidate.startsWith("/p/")) candidate = `https://opu.peklo.biz${candidate}`;
      const url = new URL(candidate);
      if (url.protocol !== "https:" || url.hostname !== "opu.peklo.biz") return "";
      if (!url.pathname.startsWith("/p/")) return "";
      return url.toString();
    } catch (_error) {
      return "";
    }
  }

  function getThumbUrl(imageUrl) {
    const validated = validateOpuUrl(imageUrl);
    if (!validated) return "";

    const url = new URL(validated);
    const parts = url.pathname.split("/");
    const fileName = parts.pop();
    if (!fileName || parts.includes("thumbs")) return url.toString();

    const pIndex = parts.indexOf("p");
    if (pIndex < 0) return url.toString();
    parts.push("thumbs", fileName);
    url.pathname = parts.join("/");
    return url.toString();
  }

  function gmRequest(details) {
    let handle = null;
    let settled = false;
    let rejectPromise = null;

    const promise = new Promise((resolve, reject) => {
      rejectPromise = reject;
      const requestDetails = {
        ...details,
        onload(response) {
          if (settled) return;
          settled = true;
          resolve(response);
        },
        onerror() {
          if (settled) return;
          settled = true;
          reject(new Error("OPU network request failed."));
        },
        ontimeout() {
          if (settled) return;
          settled = true;
          reject(new Error("OPU network request timed out."));
        },
        onabort() {
          if (settled) return;
          settled = true;
          reject(abortError());
        },
        onprogress(event) {
          if (typeof details.onprogress === "function") details.onprogress(event);
        },
      };

      try {
        if (typeof GM_xmlhttpRequest === "function") {
          handle = GM_xmlhttpRequest(requestDetails);
          return;
        }
        if (typeof GM !== "undefined" && GM && typeof GM.xmlHttpRequest === "function") {
          handle = GM.xmlHttpRequest(requestDetails);
          return;
        }
        settled = true;
        reject(new Error("The userscript network bridge is unavailable."));
      } catch (_error) {
        settled = true;
        reject(new Error("The OPU request could not be started."));
      }
    });

    return {
      promise,
      abort() {
        if (settled) return;
        if (handle && typeof handle.abort === "function") {
          handle.abort();
          return;
        }
        settled = true;
        rejectPromise?.(abortError());
      },
    };
  }

  function abortError() {
    const error = new Error("OPU upload cancelled.");
    error.name = "AbortError";
    return error;
  }

  function safeResponseValue(response, name) {
    try {
      return response?.[name];
    } catch (_error) {
      return undefined;
    }
  }

  function serializeDocument(value) {
    if (!value || typeof value !== "object") return "";
    if (value.nodeType !== 9 && !value.documentElement) return "";
    try {
      if (typeof XMLSerializer === "function") return new XMLSerializer().serializeToString(value);
    } catch (_error) {
      // Fall through to outerHTML.
    }
    return String(value.documentElement?.outerHTML || "");
  }
})();
