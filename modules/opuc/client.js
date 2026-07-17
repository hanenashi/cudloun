// OPU transport and response helpers for the Cudloun OPUc module.
(function () {
  "use strict";

  const root = window.Cudloun;
  const runtime = root.opuc = root.opuc || {};
  const GALLERY_URL = "https://opu.peklo.biz/?page=userpanel";
  const UPLOAD_URL = "https://opu.peklo.biz/opupload.php";

  runtime.client = {
    galleryUrl: GALLERY_URL,
    uploadUrl: UPLOAD_URL,
    checkLoginStatus,
    upload,
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
    const formData = new FormData();
    formData.append("obrazek[0]", file);
    formData.append("sizep", "0");
    formData.append("outputf", "auto");
    formData.append("tl_odeslat", "Odeslat");

    const request = gmRequest({
      method: "POST",
      url: UPLOAD_URL,
      data: formData,
      timeout: 120000,
      onprogress: options.onProgress,
    });

    return {
      abort: request.abort,
      promise: request.promise.then((response) => {
        if (response.status !== 200) throw new Error(`OPU upload failed with HTTP ${response.status}.`);
        const url = extractUploadUrl(response.responseText || "");
        if (!url) throw new Error("OPU upload response did not contain an image URL.");
        return url;
      }),
    };
  }

  function extractUploadUrl(html) {
    const doc = new DOMParser().parseFromString(String(html || ""), "text/html");
    const input = doc.querySelector('input[id^="link_"]');
    if (!input?.value) return "";

    const match = input.value.match(/href=["']([^"']+)["']/i);
    const candidate = match?.[1] || input.value;
    return validateOpuUrl(candidate);
  }

  function validateOpuUrl(value) {
    try {
      const url = new URL(String(value || "").trim());
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
})();
