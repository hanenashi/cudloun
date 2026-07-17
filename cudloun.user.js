// ==UserScript==
// @name         Cudloun
// @namespace    https://github.com/hanenashi/cudloun
// @version      0.6.5
// @description  Modular userscript hub for Kapybara.
// @author       hanenashi
// @match        https://kapybara.okoun.cz/*
// @match        https://opu.peklo.biz/*
// @require      https://raw.githubusercontent.com/hanenashi/cudloun/main/cudloun.bundle.js?v=0.6.5
// @icon         https://raw.githubusercontent.com/hanenashi/cudloun/main/cudloun.ico
// @updateURL    https://raw.githubusercontent.com/hanenashi/cudloun/main/cudloun.user.js
// @downloadURL  https://raw.githubusercontent.com/hanenashi/cudloun/main/cudloun.user.js
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @connect      raw.githubusercontent.com
// @connect      api.github.com
// @connect      firestore.googleapis.com
// @connect      opu.peklo.biz
// ==/UserScript==

(function () {
  "use strict";

  if (window.location.hostname !== "opu.peklo.biz" && !window.Cudloun) {
    console.error("[cudloun:seed] bundled runtime did not load");
  }
})();
