// OPU transport and response helpers for the Cudloun OPUc module.
(function () {
  "use strict";

  const root = window.Cudloun;
  const runtime = root.opuc = root.opuc || {};
  const SESSION_URL = "https://opu.peklo.biz/";
  const GALLERY_URL = "https://opu.peklo.biz/?page=userpanel";
  const UPLOAD_URL = "https://opu.peklo.biz/opupload.php";
  const RESULT_URL = "https://opu.peklo.biz/?page=done";

  runtime.client = {
    galleryUrl: GALLERY_URL,
    uploadUrl: UPLOAD_URL,
    checkLoginStatus,
    upload,
    responseBodyText,
    extractResponseCookies,
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
    if (runtime.popupBridge?.shouldUse?.()) return runtime.popupBridge.upload(file, options);

    let activeRequest = null;
    let cancelled = false;

    const startRequest = (details) => {
      if (cancelled) throw abortError();
      activeRequest = gmRequest(details);
      return activeRequest.promise;
    };

    const promise = (async () => {
      // OPU stores the uploaded result in a PHP session before redirecting to
      // ?page=done. Firefox userscript managers can otherwise follow that
      // redirect before retaining its Set-Cookie header, yielding a blank
      // upload form instead of the result. Establish the session first.
      const session = await startRequest({ method: "GET", url: SESSION_URL, timeout: 20000 });
      const sessionCookie = extractResponseCookies(safeResponseValue(session, "responseHeaders"));
      const sessionRelay = cookieRelay(sessionCookie);

      const formData = new FormData();
      formData.append("obrazek[0]", file);
      formData.append("sizep", "0");
      formData.append("outputf", "auto");
      formData.append("tl_odeslat", "Odeslat");

      const response = await startRequest({
        method: "POST",
        url: UPLOAD_URL,
        data: formData,
        timeout: 120000,
        onprogress: options.onProgress,
        ...sessionRelay,
      });

      if (response.status !== 200) throw new Error(`OPU upload failed with HTTP ${response.status}.`);
      const body = await responseBodyText(response);
      let url = extractUploadUrl(body) || validateOpuUrl(safeResponseValue(response, "finalUrl"));

      // Some Firefox/userscript-manager combinations retain OPU's cookie only
      // after the redirect chain finishes. A separate request then sees the
      // session-backed result page and recovers the URL without re-uploading.
      if (!url) {
        const result = await startRequest({
          method: "GET",
          url: RESULT_URL,
          timeout: 20000,
          ...sessionRelay,
        });
        if (result.status === 200) {
          const resultBody = await responseBodyText(result);
          url = extractUploadUrl(resultBody) || validateOpuUrl(safeResponseValue(result, "finalUrl"));
        }
      }

      if (!url) {
        const responseHint = body ? `${body.length} response characters were checked` : "the response body was empty";
        const relayHint = sessionCookie ? " The explicit OPU session relay was also rejected." : " The userscript manager did not expose OPU's session header for an explicit relay.";
        const pageHint = looksLikeUploadForm(body) ? ` OPU returned its blank upload form.${relayHint}` : "";
        throw new Error(`OPU upload finished, but no image URL was found (${responseHint}).${pageHint}`);
      }
      return url;
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

  function looksLikeUploadForm(html) {
    const source = String(html || "");
    return /<form\b[^>]*\bid=["']xpc["']/i.test(source) && /name=["']obrazek\[0\]["']/i.test(source);
  }

  function extractResponseCookies(responseHeaders) {
    const cookies = [];
    const seen = new Set();
    String(responseHeaders || "").split(/\r?\n/).forEach((line) => {
      const match = line.match(/^set-cookie:\s*([A-Za-z0-9_]+)=([^;\s\x00-\x1f\x7f]+)(?:;|$)/i);
      if (!match) return;
      const name = match[1];
      const value = match[2];
      if (!/^opu[A-Za-z0-9_]*$/i.test(name) || seen.has(name.toLowerCase())) return;
      seen.add(name.toLowerCase());
      cookies.push(`${name}=${value}`);
    });
    return cookies.join("; ");
  }

  function cookieRelay(cookie) {
    if (!cookie) return {};
    return {
      cookie,
      headers: { Cookie: cookie },
    };
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
        responseType: details.responseType || "text",
        anonymous: false,
        withCredentials: true,
        cookiePartition: details.cookiePartition || { topLevelSite: "https://opu.peklo.biz" },
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
        upload: {
          onprogress(event) {
            if (typeof details.onprogress === "function") details.onprogress(event);
          },
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
