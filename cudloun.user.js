// ==UserScript==
// @name         Cudloun
// @namespace    https://github.com/hanenashi/cudloun
// @version      0.4.37
// @description  Modular userscript hub for Babeta.
// @author       hanenashi
// @match        https://babeta.okoun.cz/*
// @icon         https://raw.githubusercontent.com/hanenashi/cudloun/main/cudloun.ico
// @updateURL    https://raw.githubusercontent.com/hanenashi/cudloun/main/cudloun.user.js
// @downloadURL  https://raw.githubusercontent.com/hanenashi/cudloun/main/cudloun.user.js
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @connect      raw.githubusercontent.com
// @connect      api.github.com
// @connect      firestore.googleapis.com
// ==/UserScript==

(function () {
  "use strict";

  const VERSION = "0.4.37";
  const RAW_MAIN_URL = "https://raw.githubusercontent.com/hanenashi/cudloun/main/";
  const COMMIT_API_URL = "https://api.github.com/repos/hanenashi/cudloun/commits/main";
  const CACHE_BUST = String(Date.now());

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
        let settled = false;
        const settleResolve = (response) => {
          if (settled) return;
          settled = true;
          if (response.status >= 200 && response.status < 300) {
            resolve(response.responseText);
            return;
          }

          reject(new Error(`HTTP ${response.status} for ${url}`));
        };
        const settleReject = (error) => {
          if (settled) return;
          settled = true;
          reject(error instanceof Error ? error : new Error(`Request failed for ${url}`));
        };

        try {
          const result = GM.xmlHttpRequest({
            method: "GET",
            url,
            onload: settleResolve,
            onerror: settleReject,
            ontimeout: () => settleReject(new Error(`Request timed out for ${url}`)),
          });

          if (result && typeof result.then === "function") {
            result.then(settleResolve).catch(settleReject);
          }
        } catch (error) {
          settleReject(error);
        }
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

  async function resolveRepoUrl() {
    try {
      const raw = await requestText(`${COMMIT_API_URL}?v=${CACHE_BUST}`);
      const payload = JSON.parse(raw);
      if (payload && payload.sha) {
        return `https://raw.githubusercontent.com/hanenashi/cudloun/${payload.sha}/`;
      }
    } catch (error) {
      console.warn("[cudloun:seed] commit lookup failed; falling back to main", error);
    }

    return RAW_MAIN_URL;
  }

  const seed = {
    version: VERSION,
    repoUrl: RAW_MAIN_URL,
    cacheBust: CACHE_BUST,
    requestText,
    execute,
  };

  resolveRepoUrl()
    .then((repoUrl) => {
      seed.repoUrl = repoUrl;
      const coreUrl = `${repoUrl}modules/core.js?v=${CACHE_BUST}`;
      return requestText(coreUrl).then((code) => execute(code, coreUrl));
    })
    .catch((error) => console.error("[cudloun:seed] core load failed", error));
})();
