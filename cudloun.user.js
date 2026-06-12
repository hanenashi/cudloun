// ==UserScript==
// @name         Cudloun
// @namespace    https://github.com/hanenashi/cudloun
// @version      0.4.47
// @description  Modular userscript hub for Babeta.
// @author       hanenashi
// @match        https://babeta.okoun.cz/*
// @match        https://kapybara.okoun.cz/*
// @require      https://raw.githubusercontent.com/hanenashi/cudloun/main/cudloun.bundle.js?v=0.4.47
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

  if (!window.Cudloun) {
    console.error("[cudloun:seed] bundled runtime did not load");
  }
})();
