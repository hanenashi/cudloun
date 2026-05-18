// ==UserScript==
// @name         Cudloun
// @namespace    https://github.com/hanenashi/cudloun
// @version      0.3.1
// @description  Modular userscript hub for Babeta.
// @author       hanenashi
// @match        https://babeta.okoun.cz/*
// @updateURL    https://raw.githubusercontent.com/hanenashi/cudloun/main/cudloun.user.js
// @downloadURL  https://raw.githubusercontent.com/hanenashi/cudloun/main/cudloun.user.js
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @connect      raw.githubusercontent.com
// ==/UserScript==

(function () {
  "use strict";

  const VERSION = "0.3.1";
  const REPO_URL = "https://raw.githubusercontent.com/hanenashi/cudloun/main/";
  const CACHE_BUST = String(Date.now());
  const CORE_URL = `${REPO_URL}modules/core.js?v=${CACHE_BUST}`;

  function requestText(url) {
    return new Promise((resolve, reject) => {
      if (typeof GM_xmlhttpRequest === "function") {
        GM_xmlhttpRequest({
          method: "GET",
          url,
          onload(response) {
            if (response.status >= 200 && response.status < 300) {
              resolve(response.responseText);
              return;
            }

            reject(new Error(`HTTP ${response.status} for ${url}`));
          },
          onerror() {
            reject(new Error(`Request failed for ${url}`));
          },
          ontimeout() {
            reject(new Error(`Request timed out for ${url}`));
          },
        });
        return;
      }

      if (typeof GM !== "undefined" && GM && typeof GM.xmlHttpRequest === "function") {
        const result = GM.xmlHttpRequest({ method: "GET", url });
        Promise.resolve(result).then((response) => {
          if (response.status >= 200 && response.status < 300) {
            resolve(response.responseText);
            return;
          }

          reject(new Error(`HTTP ${response.status} for ${url}`));
        }).catch(reject);
        return;
      }

      fetch(url, { cache: "no-store" })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status} for ${url}`);
          }
          return response.text();
        })
        .then(resolve)
        .catch(reject);
    });
  }

  function execute(code, label) {
    const run = new Function("CUDLOUN_SEED", `${code}\n//# sourceURL=${label}`);
    run(seed);
  }

  const seed = {
    version: VERSION,
    repoUrl: REPO_URL,
    cacheBust: CACHE_BUST,
    requestText,
    execute,
  };

  requestText(CORE_URL)
    .then((code) => execute(code, CORE_URL))
    .catch((error) => console.error("[cudloun:seed] core load failed", error));
})();
