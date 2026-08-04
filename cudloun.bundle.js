// Cudloun bundled runtime. Generated from source modules; edit source files, not this file.
(function () {
  "use strict";

  const VERSION = "0.6.29";
  const RAW_MAIN_URL = "https://raw.githubusercontent.com/hanenashi/cudloun/main/";
  const CACHE_BUST = String(Date.now());
  const embeddedText = new Map();
  const embeddedScripts = new Map();

  if (window.location.hostname === "opu.peklo.biz") {
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
      const preparedFiles = new WeakMap();
      let listening = false;

      runtime.popupBridge = {
        managerName,
        shouldUse,
        shouldKeepInputAttached,
        unsupportedReason,
        prepare,
        upload,
      };

      function shouldUse() {
        return isFirefox() && /tampermonkey/i.test(managerName());
      }

      function shouldKeepInputAttached() {
        return isFirefox() && /greasemonkey/i.test(managerName());
      }

      function unsupportedReason() {
        if (!isFirefox() || shouldUse() || shouldKeepInputAttached()) return "";
        const manager = managerName();
        const managerHint = manager ? ` ${manager} is not supported for this upload path.` : " The active userscript manager could not be identified.";
        return `Firefox OPU uploads require Tampermonkey.${managerHint} Disable Cudloun in Greasemonkey and install it in Tampermonkey.`;
      }

      function isFirefox() {
        return /\bFirefox\/\d/i.test(String(window.navigator?.userAgent || ""));
      }

      function managerName() {
        try {
          if (typeof GM_info !== "undefined" && GM_info?.scriptHandler) return String(GM_info.scriptHandler);
        } catch (_error) {}
        try {
          if (typeof GM !== "undefined" && GM?.info?.scriptHandler) return String(GM.info.scriptHandler);
        } catch (_error) {}
        return "";
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

          const bytesPromise = prepare(file);
          bytesPromise.catch(() => {});
          item = {
            id,
            file,
            bytesPromise,
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
          const bytes = await item.bytesPromise;
          if (!pending.has(item.id)) return;
          const outgoing = bytes.slice(0);
          item.popup.postMessage({
            type: MESSAGE_TYPE,
            action: "upload",
            id: item.id,
            bytes: outgoing,
            name: String(item.file.name || "image"),
            mime: String(item.file.type || "application/octet-stream"),
          }, OPU_ORIGIN, [outgoing]);
        } catch (error) {
          settle(item.id, error instanceof Error
            ? error
            : new Error("Firefox could not read the selected image for the OPU handoff."));
        }
      }

      function prepare(file) {
        if (!file || (typeof file !== "object" && typeof file !== "function")) {
          return Promise.reject(new Error("Firefox did not expose the selected image file."));
        }
        const cached = preparedFiles.get(file);
        if (cached) return cached;

        const promise = readFileBytes(file)
          .then((bytes) => {
            if (!isArrayBuffer(bytes) || !bytes.byteLength) {
              throw new Error("Firefox returned an empty image during the OPU handoff.");
            }
            return bytes;
          })
          .catch((error) => {
            preparedFiles.delete(file);
            throw error;
          });
        preparedFiles.set(file, promise);
        return promise;
      }

      async function readFileBytes(file) {
        const failures = [];
        if (typeof file.arrayBuffer === "function") {
          try {
            return await file.arrayBuffer();
          } catch (error) {
            failures.push(["arrayBuffer", error]);
          }
        }

        try {
          return await readWithFileReader(file, "array-buffer");
        } catch (error) {
          failures.push(["FileReader", error]);
        }

        let objectUrl = "";
        try {
          objectUrl = URL.createObjectURL(file);
          const response = await fetch(objectUrl);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return await response.arrayBuffer();
        } catch (error) {
          failures.push(["object URL", error]);
        } finally {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
        }

        try {
          const dataUrl = await readWithFileReader(file, "data-url");
          return dataUrlBytes(dataUrl);
        } catch (error) {
          failures.push(["data URL", error]);
        }

        const detail = failures.map(([method, error]) => `${method}: ${safeErrorName(error)}`).join("; ");
        throw new Error(`Firefox could not read the selected image for the OPU handoff${detail ? ` (${detail})` : ""}.`);
      }

      function readWithFileReader(file, mode) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.addEventListener("load", () => resolve(reader.result));
          reader.addEventListener("error", () => reject(reader.error || new Error("FileReader failed.")));
          reader.addEventListener("abort", () => reject(new Error("FileReader aborted.")));
          if (mode === "data-url") reader.readAsDataURL(file);
          else reader.readAsArrayBuffer(file);
        });
      }

      function dataUrlBytes(value) {
        const source = String(value || "");
        const comma = source.indexOf(",");
        if (comma < 0 || !/;base64$/i.test(source.slice(0, comma))) {
          throw new Error("FileReader returned an invalid data URL.");
        }
        const binary = atob(source.slice(comma + 1));
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
        return bytes.buffer;
      }

      function isArrayBuffer(value) {
        return value instanceof ArrayBuffer || Object.prototype.toString.call(value) === "[object ArrayBuffer]";
      }

      function safeErrorName(error) {
        const name = String(error?.name || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40);
        return name || "Error";
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

    return;
  }

  embeddedText.set("modules.json", "{\n  \"version\": \"0.6.29\",\n  \"system\": [\n    {\n      \"id\": \"sys-logger\",\n      \"file\": \"modules/sys-logger.js\",\n      \"required\": true\n    },\n    {\n      \"id\": \"sys-kapyguts\",\n      \"file\": \"modules/sys-kapyguts.js\",\n      \"required\": true\n    },\n    {\n      \"id\": \"sys-feedback\",\n      \"file\": \"modules/sys-feedback.js\",\n      \"required\": true\n    },\n    {\n      \"id\": \"sys-menu\",\n      \"file\": \"modules/sys-menu.js\",\n      \"required\": true\n    }\n  ],\n  \"modules\": [\n    {\n      \"id\": \"settoun\",\n      \"file\": \"modules/settoun.js\",\n      \"defaultEnabled\": true\n    },\n    {\n      \"id\": \"first-unread\",\n      \"file\": \"modules/first-unread.js\",\n      \"defaultEnabled\": false\n    },\n    {\n      \"id\": \"kapybara-theme\",\n      \"file\": \"modules/kapybara-theme.js\",\n      \"defaultEnabled\": false\n    },\n    {\n      \"id\": \"thread-lane\",\n      \"file\": \"modules/thread-lane.js\",\n      \"defaultEnabled\": false\n    },\n    {\n      \"id\": \"classic-look\",\n      \"file\": \"modules/classic-look.js\",\n      \"defaultEnabled\": false\n    },\n    {\n      \"id\": \"post-tweaks\",\n      \"file\": \"modules/post-tweaks.js\",\n      \"defaultEnabled\": false\n    },\n    {\n      \"id\": \"post-fonts\",\n      \"file\": \"modules/post-fonts.js\",\n      \"defaultEnabled\": false\n    },\n    {\n      \"id\": \"opuc\",\n      \"files\": [\n        \"modules/opuc/popup-bridge.js\",\n        \"modules/opuc/client.js\",\n        \"modules/opuc/image-pipeline.js\",\n        \"modules/opuc/kapybara-adapter.js\",\n        \"modules/opuc/queue.js\",\n        \"modules/opuc/styles.js\",\n        \"modules/opuc/ui.js\",\n        \"modules/opuc/index.js\"\n      ],\n      \"defaultEnabled\": false\n    }\n  ]\n}");
  embeddedText.set("containers.json", "{\n  \"containers\": []\n}");

  embeddedText.set("modules/sys-logger.js", "// Cudloun logger control helpers.\n(function () {\n  \"use strict\";\n\n  const root = window.Cudloun;\n  const levels = [\"off\", \"error\", \"warn\", \"info\", \"debug\", \"trace\"];\n\n  root.logger = {\n    levels,\n    recent(limit) {\n      const count = Number(limit) || 120;\n      return root.log.entries.slice(-count);\n    },\n    clear() {\n      root.log.entries.length = 0;\n      root.log.info(\"logger\", \"log buffer cleared\");\n    },\n    setLevel(level) {\n      root.log.setLevel(level);\n      root.log.info(\"logger\", \"level set\", level);\n      if (root.ui && typeof root.ui.renderHub === \"function\") {\n        root.ui.renderHub(\"debug\");\n      }\n    },\n  };\n\n  root.log.info(\"logger\", \"ready\", `level=${root.log.level()}`);\n})();\n");
  embeddedScripts.set("modules/sys-logger.js", function () {
    // Cudloun logger control helpers.
    (function () {
      "use strict";

      const root = window.Cudloun;
      const levels = ["off", "error", "warn", "info", "debug", "trace"];

      root.logger = {
        levels,
        recent(limit) {
          const count = Number(limit) || 120;
          return root.log.entries.slice(-count);
        },
        clear() {
          root.log.entries.length = 0;
          root.log.info("logger", "log buffer cleared");
        },
        setLevel(level) {
          root.log.setLevel(level);
          root.log.info("logger", "level set", level);
          if (root.ui && typeof root.ui.renderHub === "function") {
            root.ui.renderHub("debug");
          }
        },
      };

      root.log.info("logger", "ready", `level=${root.log.level()}`);
    })();

  });

  embeddedText.set("modules/sys-kapyguts.js", "// Cudloun Kapybara DOM dictionary helpers.\n(function () {\n  \"use strict\";\n\n  const root = window.Cudloun || null;\n  const VERSION = \"0.6.1\";\n  const SELECTORS = {\n    viewportStripes: \".🐟-stripes\",\n    pageHeader: \"header:has(a[aria-label='Okoun home'], .logo)\",\n    pageHeaderLogo: \"a[aria-label='Okoun home'], .logo\",\n    pageHeaderDesktopActions: \".desktop-right\",\n    primaryNavigation: \"nav[aria-label='Hlavní navigace']\",\n    homeNavigation: \"nav[aria-label='Domovská navigace']\",\n    homeTab: \"nav[aria-label='Domovská navigace'] a[href]\",\n    homeActiveTab: \"nav[aria-label='Domovská navigace'] a[aria-current='page']\",\n    homeBoardsSection: \"section.boards-section\",\n    homeBoardList: \"section.boards-section ul.list\",\n    homeBoardRow: \"section.boards-section a.row[href^='/boards/']\",\n    desktopAvatarMenuTrigger: \"button.avatar-button[aria-label='Uživatelské menu'][aria-haspopup='menu']\",\n    mobileAvatarMenuTrigger: \"nav.mobile-bottom-nav[aria-label='Spodní navigace'] button.user-item[aria-haspopup]\",\n    dropdownMenu: \"[role='menu'][data-dropdown-menu-content]\",\n    dropdownMenuItem: \"[role='menuitem'][data-dropdown-menu-item]\",\n    nativeFontSettingsLink: \"a[role='menuitem'][href='/test/fonts']\",\n    nativePostDisplayLink: \"a[role='menuitem'][href='/test/posts']\",\n    boardHeader: \"header.board-header\",\n    boardTitleRow: \".board-header .title-row\",\n    boardTitleLink: \".board-header .title-link\",\n    boardTitleActions: \".board-header .title-row .title-actions\",\n    boardNewPostButton: \"button.entry-placeholder, button.new-post.mobile\",\n    boardImageToggle: \"button.images-toggle[aria-pressed]\",\n    boardViewToggle: \"button[role='radio'][data-toggle-group-item]\",\n    boardPager: \"nav.pager[aria-label='Stránkování příspěvků']\",\n    mobileBottomNav: \"nav.mobile-bottom-nav[aria-label='Spodní navigace']\",\n    boardPost: \"article.post\",\n    unreadPost: \"article.post[data-unread]\",\n    avatarColumn: \".avatar-col\",\n    avatar: \".avatar\",\n    avatarImage: \".avatar img\",\n    content: \".post-main\",\n    header: \".post-header\",\n    author: \".author\",\n    meta: \".meta\",\n    dateButton: \"button.date\",\n    replyMeta: \".reply-ref\",\n    body: \".body\",\n    markdown: \".markdown\",\n    actions: \".actions\",\n    replyButton: \".reply-action\",\n    postMenuButton: \"button[aria-label='menu']\",\n    favoriteBoardRow: \".favorites-page a[href^='/boards/'], .favorites-page a[href*='/boards/']\",\n    messagesPage: \"section.messages-page\",\n    messagesShell: \".messages-shell\",\n    conversationList: \".conversation-list\",\n    conversationSearchField: \".conversation-search-field\",\n    newMessageButton: \"button.new-message-button[aria-label='Nová zpráva']\",\n    messageItem: \".conversation-item\",\n    selectedMessageItem: \".conversation-item.selected\",\n    conversationDetail: \"section.conversation-detail\",\n    conversationBackButton: \"button[aria-label='Zpět na konverzace']\",\n    inlineMessageCompose: \".inline-compose\",\n    collapsedMessageComposer: \"button.collapsed-composer\",\n    collapsedMessageSend: \"button.collapsed-send\",\n    messagesScroll: \".messages-scroll\",\n    messageList: \".message-list\",\n    message: \"article.message\",\n    messageCard: \".message-card\",\n    messageMeta: \".message-meta\",\n    messageMenu: \".message-menu\",\n    messageMenuButton: \"button.message-menu-trigger[aria-label='Další možnosti']\",\n    messageBody: \".message-body\",\n    messageMarkdown: \".message-body .markdown\",\n    messageActions: \".message-actions\",\n    messageReplyButton: \"button.reply-button\",\n    newPostComposer: \"section.new-post-composer[aria-label='Nový příspěvek']\",\n    replyComposer: \"section.reply-composer[aria-label='Odpověď']\",\n    composer: \".composer\",\n    composerEditor: \".composer-editor\",\n    composerEditable: \".composer-content-editable[role='textbox'][contenteditable='true']\",\n    composerToolbarSlot: \".composer-toolbar-slot\",\n    composerToolbar: \"[role='toolbar'][aria-label='Formátování textu']\",\n    composerImageButton: \"button[aria-label='Vložit obrázek']\",\n    composerModeToggle: \"button.mode-toggle[aria-pressed]\",\n    composerMarkdownNode: \"code[data-language='markdown']\",\n    composerTitleInput: \"section.new-post-composer input[type='text']\",\n    fontSettingsPanel: \".fs-panel[role='dialog'][aria-labelledby='fs-title']\",\n    fontSettingsCopyButton: \"button.fs-copy\",\n    fontSettingsCloseButton: \"button.fs-close[aria-label='Zavřít']\",\n    fontSettingsChromeSelect: \"#fs-chrome\",\n    fontSettingsHeadersSelect: \"#fs-chrome-headers\",\n    fontSettingsContentSelect: \"#fs-content\",\n    fontSettingsCodeSelect: \"#fs-code\",\n    fontSettingsBrandSelect: \"#fs-brand\",\n    fontSettingsSizeRow: \"label.fs-size-row\",\n    postDisplayPanel: \".pd-panel[role='dialog'][aria-labelledby='pd-title']\",\n    postDisplayCloseButton: \"button.pd-close[aria-label='Zavřít']\",\n    postDisplaySection: \".pd-section\",\n    postDisplayAvatarSection: \".pd-section.av-section\",\n    postDisplaySegmentButton: \"button.av-seg-btn[aria-pressed]\",\n  };\n  const TEXT = {\n    postMenu: [\"Smazat\", \"Upravit\", \"Označit\"],\n    avatarMenu: [\"Nastavení\", \"Odhlásit\", \"Barevné schéma\"],\n    fontSettings: {\n      menuItem: \"[test] Nastavení fontů\",\n      lowDpr: \"Náhrada písma při nízkém DPR\",\n      sizeRows: {\n        chrome: \"Ovládání\",\n        headers: \"Nadpisy a záhlaví\",\n        content: \"Obsah\",\n        code: \"Kód (neproporcionální)\",\n        brand: \"Logo a značka\",\n      },\n      actions: {\n        reset: \"Obnovit výchozí\",\n        cancel: \"Zrušit\",\n        save: \"Uložit změny\",\n      },\n    },\n    postDisplay: {\n      menuItem: \"[test] Zobrazení příspěvků\",\n      switches: {\n        largerGap: \"Větší mezera\",\n        separator: \"Oddělovač\",\n      },\n      options: {\n        shape: {\n          circle: \"Kruh (výchozí)\",\n          square: \"Čtverec\",\n          roundedSquare: \"Zaoblený čtverec\",\n          rect: \"Obdélník 4:5\",\n          roundedRect: \"Zaoblený 4:5\",\n        },\n        fit: {\n          contain: \"contain (letterbox)\",\n          cover: \"cover (ořez)\",\n        },\n        ring: {\n          none: \"Bez\",\n          hairline: \"1px linka\",\n        },\n      },\n      actions: {\n        save: \"Uložit změny\",\n      },\n    },\n  };\n\n  const EXPLAIN_RULES = [\n    rule(\"legacy code block\", \"article.post .body > .code\", \"article.post .body > .code\", [\n      \"Klasický Okoun ukládá blok kódu jako div.code; pro zachování řádků použijte white-space: pre-wrap.\",\n    ]),\n    rule(\"post Markdown body\", \"article.post .body .markdown\", \"article.post .body .markdown\"),\n    rule(\"post reply metadata\", `article.post ${SELECTORS.replyMeta}`, `article.post ${SELECTORS.replyMeta}`),\n    rule(\"post reply button\", `article.post ${SELECTORS.replyButton}`, `article.post ${SELECTORS.replyButton}`),\n    rule(\"post menu button\", `article.post ${SELECTORS.postMenuButton}`, `article.post ${SELECTORS.postMenuButton}`),\n    rule(\"post date\", `article.post ${SELECTORS.dateButton}`, `article.post ${SELECTORS.dateButton}`),\n    rule(\"post actions\", `article.post ${SELECTORS.actions}`, `article.post ${SELECTORS.actions}`),\n    rule(\"post metadata\", `article.post ${SELECTORS.meta}`, `article.post ${SELECTORS.meta}`),\n    rule(\"post author\", `article.post ${SELECTORS.author}`, `article.post ${SELECTORS.author}`),\n    rule(\"post header\", `article.post ${SELECTORS.header}`, `article.post ${SELECTORS.header}`),\n    rule(\"post avatar image\", `article.post ${SELECTORS.avatarImage}`, `article.post ${SELECTORS.avatarImage}`),\n    rule(\"post avatar\", `article.post ${SELECTORS.avatar}`, `article.post ${SELECTORS.avatar}`),\n    rule(\"post avatar column\", `article.post ${SELECTORS.avatarColumn}`, `article.post ${SELECTORS.avatarColumn}`),\n    rule(\"post body\", `article.post ${SELECTORS.body}`, `article.post ${SELECTORS.body}`),\n    rule(\"post content\", `article.post ${SELECTORS.content}`, `article.post ${SELECTORS.content}`),\n    rule(\"unread post\", SELECTORS.unreadPost, SELECTORS.unreadPost),\n    rule(\"post\", SELECTORS.boardPost, SELECTORS.boardPost),\n    rule(\"message Markdown body\", `${SELECTORS.message} ${SELECTORS.messageMarkdown}`, `${SELECTORS.message} ${SELECTORS.messageMarkdown}`),\n    rule(\"message reply button\", `${SELECTORS.message} ${SELECTORS.messageReplyButton}`, `${SELECTORS.message} ${SELECTORS.messageReplyButton}`),\n    rule(\"message actions\", `${SELECTORS.message} ${SELECTORS.messageActions}`, `${SELECTORS.message} ${SELECTORS.messageActions}`),\n    rule(\"message body\", `${SELECTORS.message} ${SELECTORS.messageBody}`, `${SELECTORS.message} ${SELECTORS.messageBody}`),\n    rule(\"message menu button\", `${SELECTORS.message} ${SELECTORS.messageMenuButton}`, `${SELECTORS.message} ${SELECTORS.messageMenuButton}`),\n    rule(\"message metadata\", `${SELECTORS.message} ${SELECTORS.messageMeta}`, `${SELECTORS.message} ${SELECTORS.messageMeta}`),\n    rule(\"message card\", `${SELECTORS.message} ${SELECTORS.messageCard}`, `${SELECTORS.message} ${SELECTORS.messageCard}`),\n    rule(\"message\", SELECTORS.message, SELECTORS.message),\n    rule(\"composer Markdown source\", SELECTORS.composerMarkdownNode, SELECTORS.composerMarkdownNode),\n    rule(\"composer editable\", SELECTORS.composerEditable, SELECTORS.composerEditable),\n    rule(\"composer mode switch\", SELECTORS.composerModeToggle, SELECTORS.composerModeToggle),\n    rule(\"composer image button\", SELECTORS.composerImageButton, SELECTORS.composerImageButton),\n    rule(\"composer title input\", SELECTORS.composerTitleInput, SELECTORS.composerTitleInput),\n    rule(\"composer toolbar\", SELECTORS.composerToolbar, SELECTORS.composerToolbar),\n    rule(\"composer editor\", SELECTORS.composerEditor, SELECTORS.composerEditor),\n    rule(\"composer\", SELECTORS.composer, SELECTORS.composer),\n    rule(\"new-post composer\", SELECTORS.newPostComposer, SELECTORS.newPostComposer),\n    rule(\"reply composer\", SELECTORS.replyComposer, SELECTORS.replyComposer),\n    rule(\"board header actions\", SELECTORS.boardTitleActions, SELECTORS.boardTitleActions),\n    rule(\"board title link\", SELECTORS.boardTitleLink, SELECTORS.boardTitleLink),\n    rule(\"board title row\", SELECTORS.boardTitleRow, SELECTORS.boardTitleRow),\n    rule(\"board header\", SELECTORS.boardHeader, SELECTORS.boardHeader),\n    rule(\"board new-post launcher\", SELECTORS.boardNewPostButton, SELECTORS.boardNewPostButton),\n    rule(\"board image filter\", SELECTORS.boardImageToggle, SELECTORS.boardImageToggle),\n    rule(\"board view switch\", SELECTORS.boardViewToggle, SELECTORS.boardViewToggle),\n    rule(\"board pager\", SELECTORS.boardPager, SELECTORS.boardPager),\n    rule(\"page-header logo\", `${SELECTORS.pageHeader} :is(${SELECTORS.pageHeaderLogo})`, `${SELECTORS.pageHeader} :is(${SELECTORS.pageHeaderLogo})`),\n    rule(\"page-header actions\", `${SELECTORS.pageHeader} ${SELECTORS.pageHeaderDesktopActions}`, `${SELECTORS.pageHeader} ${SELECTORS.pageHeaderDesktopActions}`),\n    rule(\"page header\", SELECTORS.pageHeader, SELECTORS.pageHeader),\n    rule(\"viewport stripes\", SELECTORS.viewportStripes, SELECTORS.viewportStripes, [\n      \".🐟-stripes je výjimečný záměrně mapovaný selektor; zde jej lze bezpečně použít.\",\n    ]),\n    rule(\"mobile bottom navigation\", SELECTORS.mobileBottomNav, SELECTORS.mobileBottomNav),\n    rule(\"home board row\", SELECTORS.homeBoardRow, SELECTORS.homeBoardRow),\n    rule(\"home board list\", SELECTORS.homeBoardList, SELECTORS.homeBoardList),\n    rule(\"home boards section\", SELECTORS.homeBoardsSection, SELECTORS.homeBoardsSection),\n    rule(\"home navigation tab\", SELECTORS.homeTab, SELECTORS.homeTab),\n    rule(\"home navigation\", SELECTORS.homeNavigation, SELECTORS.homeNavigation),\n    rule(\"primary navigation\", SELECTORS.primaryNavigation, SELECTORS.primaryNavigation),\n    rule(\"Favorites board row\", SELECTORS.favoriteBoardRow, SELECTORS.favoriteBoardRow),\n    rule(\"selected conversation\", SELECTORS.selectedMessageItem, SELECTORS.selectedMessageItem),\n    rule(\"conversation item\", SELECTORS.messageItem, SELECTORS.messageItem),\n    rule(\"conversation back button\", SELECTORS.conversationBackButton, SELECTORS.conversationBackButton),\n    rule(\"conversation detail\", SELECTORS.conversationDetail, SELECTORS.conversationDetail),\n    rule(\"conversation list\", SELECTORS.conversationList, SELECTORS.conversationList),\n    rule(\"Vzkazník page\", SELECTORS.messagesPage, SELECTORS.messagesPage),\n    rule(\"font-settings panel\", SELECTORS.fontSettingsPanel, SELECTORS.fontSettingsPanel),\n    rule(\"post-display panel\", SELECTORS.postDisplayPanel, SELECTORS.postDisplayPanel),\n  ];\n\n  const kapyguts = {\n    version: VERSION,\n    selectors: SELECTORS,\n    text: TEXT,\n    isKapybara,\n    route,\n    currentUser,\n    currentUserCandidates,\n    isBoardPage,\n    isFavoritesPage,\n    isMessagesPage,\n    isVisible,\n    visibleElements,\n    allPosts,\n    visiblePosts,\n    unreadPosts,\n    firstUnreadPost,\n    postParts,\n    pageChromeParts,\n    pageHeader,\n    pageHeaderParts,\n    homeParts,\n    avatarMenuParts,\n    boardHeaderParts,\n    messagesParts,\n    messageParts,\n    fontSettingsParts,\n    fontSettingsState,\n    postDisplayParts,\n    postDisplayState,\n    visibleMenus,\n    visiblePostMenus,\n    allComposers,\n    composerParts,\n    observeComposers,\n    explain,\n    inspect,\n  };\n\n  window.Kapyguts = kapyguts;\n  if (root) root.kapyguts = kapyguts;\n  root?.log?.info?.(\"kapyguts\", \"ready\", VERSION);\n\n  function isKapybara() {\n    return window.location.hostname === \"kapybara.okoun.cz\";\n  }\n\n  function route() {\n    const path = window.location.pathname;\n    const boardMatch = path.match(/^\\/boards\\/([^/?#]+)/);\n    return {\n      href: window.location.href,\n      host: window.location.hostname,\n      path,\n      search: window.location.search,\n      hash: window.location.hash,\n      type: boardMatch ? \"board\" : routeType(path),\n      boardId: boardMatch ? decodeURIComponent(boardMatch[1]) : \"\",\n    };\n  }\n\n  function routeType(path) {\n    if (path === \"/\") return \"home\";\n    if (path === \"/new-boards\" || path.startsWith(\"/new-boards/\")) return \"new-boards\";\n    if (path === \"/fav\" || path.startsWith(\"/fav/\")) return \"favorites\";\n    if (path.startsWith(\"/messages\")) return \"messages\";\n    if (path.startsWith(\"/topics\")) return \"topics\";\n    if (path.startsWith(\"/active-users\")) return \"active-users\";\n    if (path === \"/test/fonts\") return \"font-settings\";\n    if (path === \"/test/posts\") return \"post-display-settings\";\n    return \"unknown\";\n  }\n\n  function isBoardPage() {\n    return route().type === \"board\";\n  }\n\n  function isFavoritesPage() {\n    return route().type === \"favorites\";\n  }\n\n  function isMessagesPage() {\n    return route().type === \"messages\";\n  }\n\n  function currentUser() {\n    const candidates = currentUserCandidates();\n    return candidates.find((candidate) => candidate.confidence === \"high\")?.name ||\n      candidates.find((candidate) => candidate.name)?.name ||\n      \"\";\n  }\n\n  function currentUserCandidates() {\n    const candidates = [];\n\n    visibleElements(\".avatar-button\").forEach((button) => {\n      addUserCandidate(candidates, button.textContent, \"avatar-button-text\", \"high\", button);\n      addUserCandidate(candidates, button.querySelector(\"img[alt]\")?.getAttribute(\"alt\"), \"avatar-button-img-alt\", \"high\", button);\n    });\n\n    visibleElements(\".user-item, .avatar-shell\").forEach((node) => {\n      addUserCandidate(candidates, node.textContent, \"mobile-user-text\", \"high\", node);\n      addUserCandidate(candidates, node.querySelector(\"img[alt]\")?.getAttribute(\"alt\"), \"mobile-user-img-alt\", \"medium\", node);\n    });\n\n    visibleElements(\"header img[alt], nav img[alt]\").forEach((img) => {\n      addUserCandidate(candidates, img.getAttribute(\"alt\"), \"header-nav-img-alt\", \"low\", img);\n    });\n\n    return candidates;\n  }\n\n  function allPosts(scope = document) {\n    return Array.from(scope.querySelectorAll(SELECTORS.boardPost));\n  }\n\n  function visiblePosts(scope = document) {\n    return allPosts(scope).filter(isVisible);\n  }\n\n  function unreadPosts(scope = document) {\n    return Array.from(scope.querySelectorAll(SELECTORS.unreadPost));\n  }\n\n  function firstUnreadPost(scope = document) {\n    return unreadPosts(scope)[0] || null;\n  }\n\n  function pageChromeParts(scope = document) {\n    const viewportStripes = scope.querySelector(SELECTORS.viewportStripes);\n    const stripeStyle = viewportStripes ? window.getComputedStyle(viewportStripes) : null;\n    const stripeBackground = stripeStyle?.backgroundImage || \"\";\n    return {\n      viewportStripes,\n      stripeBackground,\n      stripesActive: !!viewportStripes && stripeBackground !== \"none\",\n    };\n  }\n\n  function pageHeader(scope = document) {\n    return Array.from(scope.querySelectorAll(SELECTORS.pageHeader)).find((header) => (\n      !header.closest(\"article.post\") && !!header.querySelector(SELECTORS.pageHeaderLogo)\n    )) || null;\n  }\n\n  function pageHeaderParts(scope = document) {\n    const header = pageHeader(scope);\n    return {\n      header,\n      logo: header?.querySelector(SELECTORS.pageHeaderLogo) || null,\n      desktopActions: header?.querySelector(SELECTORS.pageHeaderDesktopActions) || null,\n    };\n  }\n\n  function homeParts(scope = document) {\n    const navigation = scope.querySelector(SELECTORS.homeNavigation);\n    const boardsSection = scope.querySelector(SELECTORS.homeBoardsSection);\n    const boardList = scope.querySelector(SELECTORS.homeBoardList);\n    const tabs = Array.from(scope.querySelectorAll(SELECTORS.homeTab));\n    const boardRows = Array.from(scope.querySelectorAll(SELECTORS.homeBoardRow));\n    return {\n      primaryNavigation: scope.querySelector(SELECTORS.primaryNavigation),\n      navigation,\n      tabs,\n      activeTab: scope.querySelector(SELECTORS.homeActiveTab),\n      boardsSection,\n      boardList,\n      boardRows,\n      mobileBottomNav: scope.querySelector(SELECTORS.mobileBottomNav),\n      ready: !!(navigation && boardsSection && boardList),\n    };\n  }\n\n  function avatarMenuParts(scope = document) {\n    const desktopTrigger = scope.querySelector(SELECTORS.desktopAvatarMenuTrigger);\n    const mobileTrigger = scope.querySelector(SELECTORS.mobileAvatarMenuTrigger);\n    const trigger = [desktopTrigger, mobileTrigger].find(isVisible) || desktopTrigger || mobileTrigger || null;\n    const menu = Array.from(scope.querySelectorAll(\"[role='menu']\")).find((candidate) => (\n      isVisible(candidate) && (\n        !!candidate.querySelector(SELECTORS.nativeFontSettingsLink) ||\n        !!candidate.querySelector(SELECTORS.nativePostDisplayLink) ||\n        TEXT.avatarMenu.some((needle) => normalizeText(candidate.textContent).includes(needle))\n      )\n    )) || null;\n    const items = menu ? Array.from(menu.querySelectorAll(\"[role='menuitem']\")) : [];\n    const fontSettingsLink = menu?.querySelector(SELECTORS.nativeFontSettingsLink) || null;\n    const postDisplayLink = menu?.querySelector(SELECTORS.nativePostDisplayLink) || null;\n\n    return {\n      trigger,\n      desktopTrigger,\n      mobileTrigger,\n      menu,\n      items,\n      fontSettingsLink,\n      postDisplayLink,\n      open: !!menu || trigger?.getAttribute(\"aria-expanded\") === \"true\",\n    };\n  }\n\n  function boardHeaderParts(scope = document) {\n    const header = scope.querySelector(SELECTORS.boardHeader);\n    const titleRow = scope.querySelector(SELECTORS.boardTitleRow);\n    const titleLink = scope.querySelector(SELECTORS.boardTitleLink);\n    const actions = scope.querySelector(SELECTORS.boardTitleActions);\n    return {\n      header,\n      titleRow,\n      titleLink,\n      actions,\n      newPostButton: scope.querySelector(SELECTORS.boardNewPostButton),\n      imageToggle: scope.querySelector(SELECTORS.boardImageToggle),\n      viewToggles: Array.from(scope.querySelectorAll(SELECTORS.boardViewToggle)),\n      pagers: Array.from(scope.querySelectorAll(SELECTORS.boardPager)),\n      mobileBottomNav: scope.querySelector(SELECTORS.mobileBottomNav),\n      stickyTitle: !!titleRow && window.getComputedStyle(titleRow).position === \"sticky\",\n    };\n  }\n\n  function messagesParts(scope = document) {\n    const page = scope.querySelector(SELECTORS.messagesPage);\n    const conversationList = scope.querySelector(SELECTORS.conversationList);\n    const detail = scope.querySelector(SELECTORS.conversationDetail);\n    const searchField = scope.querySelector(SELECTORS.conversationSearchField);\n    return {\n      page,\n      shell: scope.querySelector(SELECTORS.messagesShell),\n      conversationList,\n      searchField,\n      searchInput: searchField?.querySelector(\"input\") || null,\n      newMessageButton: scope.querySelector(SELECTORS.newMessageButton),\n      conversationItems: Array.from(scope.querySelectorAll(SELECTORS.messageItem)),\n      selectedConversation: scope.querySelector(SELECTORS.selectedMessageItem),\n      detail,\n      backButton: scope.querySelector(SELECTORS.conversationBackButton),\n      inlineCompose: scope.querySelector(SELECTORS.inlineMessageCompose),\n      collapsedComposer: scope.querySelector(SELECTORS.collapsedMessageComposer),\n      collapsedSend: scope.querySelector(SELECTORS.collapsedMessageSend),\n      scroll: scope.querySelector(SELECTORS.messagesScroll),\n      messageList: scope.querySelector(SELECTORS.messageList),\n      messages: Array.from(scope.querySelectorAll(SELECTORS.message)),\n      cards: Array.from(scope.querySelectorAll(SELECTORS.messageCard)),\n      layout: conversationList && detail ? \"split\" : detail ? \"detail\" : conversationList ? \"list\" : \"unknown\",\n      ready: !!page && !!(conversationList || detail),\n    };\n  }\n\n  function messageParts(node) {\n    if (!node) return null;\n    const message = node.matches?.(SELECTORS.message) ? node : node.closest?.(SELECTORS.message) || null;\n    const card = node.matches?.(SELECTORS.messageCard) ? node : message?.querySelector(SELECTORS.messageCard) || null;\n    if (!message || !card) return null;\n    return {\n      message,\n      card,\n      header: card.querySelector(\"header\"),\n      avatar: card.querySelector(SELECTORS.avatar),\n      meta: card.querySelector(SELECTORS.messageMeta),\n      menu: card.querySelector(SELECTORS.messageMenu),\n      menuButton: card.querySelector(SELECTORS.messageMenuButton),\n      body: card.querySelector(SELECTORS.messageBody),\n      markdown: card.querySelector(SELECTORS.messageMarkdown),\n      actions: card.querySelector(SELECTORS.messageActions),\n      replyButton: card.querySelector(SELECTORS.messageReplyButton),\n      direction: message.matches?.(\".outgoing\") ? \"outgoing\" : message.matches?.(\".incoming\") ? \"incoming\" : \"\",\n    };\n  }\n\n  // Kapybara labels this route as a temporary test. Keep its DOM contract\n  // isolated here so modules do not couple themselves to the experiment.\n  function fontSettingsParts(scope = document) {\n    const panel = scope.querySelector(SELECTORS.fontSettingsPanel);\n    const selects = {\n      chrome: panel?.querySelector(SELECTORS.fontSettingsChromeSelect) || null,\n      headers: panel?.querySelector(SELECTORS.fontSettingsHeadersSelect) || null,\n      content: panel?.querySelector(SELECTORS.fontSettingsContentSelect) || null,\n      code: panel?.querySelector(SELECTORS.fontSettingsCodeSelect) || null,\n      brand: panel?.querySelector(SELECTORS.fontSettingsBrandSelect) || null,\n    };\n    const sizes = Object.fromEntries(Object.entries(TEXT.fontSettings.sizeRows).map(([key, label]) => (\n      [key, labeledNumberInput(panel, label)]\n    )));\n    const lowDprSwitch = panel ? Array.from(panel.querySelectorAll(\"button[role='switch']\")).find((button) => (\n      normalizeText(button.textContent).startsWith(TEXT.fontSettings.lowDpr)\n    )) || null : null;\n    const actions = Object.fromEntries(Object.entries(TEXT.fontSettings.actions).map(([key, label]) => (\n      [key, buttonByText(panel, label)]\n    )));\n\n    return {\n      panel,\n      copyButton: panel?.querySelector(SELECTORS.fontSettingsCopyButton) || null,\n      closeButton: panel?.querySelector(SELECTORS.fontSettingsCloseButton) || null,\n      selects,\n      sizes,\n      lowDprSwitch,\n      actions,\n      ready: !!panel && Object.values(selects).every(Boolean) && Object.values(sizes).every(Boolean),\n    };\n  }\n\n  function fontSettingsState(scope = document) {\n    const parts = fontSettingsParts(scope);\n    if (!parts.panel) return null;\n\n    return {\n      ready: parts.ready,\n      serifExperiment: new URLSearchParams(window.location.search).get(\"k\") === \"chatk_colit\",\n      fonts: Object.fromEntries(Object.entries(parts.selects).map(([key, select]) => [key, select?.value || \"\"])),\n      sizes: Object.fromEntries(Object.entries(parts.sizes).map(([key, input]) => [key, input?.value || \"\"])),\n      lowDprFallback: parts.lowDprSwitch?.getAttribute(\"aria-checked\") === \"true\",\n      dirty: !!parts.actions.save && !parts.actions.save.disabled,\n    };\n  }\n\n  // Kapybara labels this route as temporary. Resolve controls by their Czech\n  // labels so callers are insulated from layout and generated class changes.\n  function postDisplayParts(scope = document) {\n    const panel = scope.querySelector(SELECTORS.postDisplayPanel);\n    const segmentButtons = panel ? Array.from(panel.querySelectorAll(SELECTORS.postDisplaySegmentButton)) : [];\n    const switches = Object.fromEntries(Object.entries(TEXT.postDisplay.switches).map(([key, label]) => (\n      [key, switchByText(panel, label)]\n    )));\n    const options = Object.fromEntries(Object.entries(TEXT.postDisplay.options).map(([group, labels]) => (\n      [group, Object.fromEntries(Object.entries(labels).map(([key, label]) => (\n        [key, buttonByText(panel, label)]\n      )))]\n    )));\n    const actions = Object.fromEntries(Object.entries(TEXT.postDisplay.actions).map(([key, label]) => (\n      [key, buttonByText(panel, label)]\n    )));\n\n    return {\n      panel,\n      closeButton: panel?.querySelector(SELECTORS.postDisplayCloseButton) || null,\n      sections: panel ? Array.from(panel.querySelectorAll(SELECTORS.postDisplaySection)) : [],\n      avatarSection: panel?.querySelector(SELECTORS.postDisplayAvatarSection) || null,\n      segmentButtons,\n      switches,\n      options,\n      actions,\n      previewPosts: panel ? Array.from(panel.querySelectorAll(SELECTORS.boardPost)) : [],\n      ready: !!panel && Object.values(switches).every(Boolean) &&\n        Object.values(options).every((group) => Object.values(group).every(Boolean)),\n    };\n  }\n\n  function postDisplayState(scope = document) {\n    const parts = postDisplayParts(scope);\n    if (!parts.panel) return null;\n\n    return {\n      ready: parts.ready,\n      largerGap: parts.switches.largerGap?.getAttribute(\"aria-checked\") === \"true\",\n      separator: parts.switches.separator?.getAttribute(\"aria-checked\") === \"true\",\n      shape: pressedOption(parts.options.shape),\n      fit: pressedOption(parts.options.fit),\n      ring: pressedOption(parts.options.ring),\n      dirty: !!parts.actions.save && !parts.actions.save.disabled,\n    };\n  }\n\n  function postParts(post) {\n    if (!post) return null;\n\n    const avatarColumn = post.querySelector(SELECTORS.avatarColumn);\n    const avatar = post.querySelector(SELECTORS.avatar);\n    const avatarImage = post.querySelector(SELECTORS.avatarImage);\n    const content = post.querySelector(SELECTORS.content);\n    const header = post.querySelector(SELECTORS.header);\n    const author = post.querySelector(SELECTORS.author);\n    const meta = post.querySelector(SELECTORS.meta);\n    const dateButton = post.querySelector(SELECTORS.dateButton);\n    const replyMeta = post.querySelector(SELECTORS.replyMeta);\n    const body = post.querySelector(SELECTORS.body);\n    const markdown = post.querySelector(SELECTORS.markdown);\n    const actions = post.querySelector(SELECTORS.actions);\n    const reply = post.querySelector(SELECTORS.replyButton);\n    const postMenuButton = post.querySelector(SELECTORS.postMenuButton);\n\n    return {\n      post,\n      row: post,\n      avatarColumn,\n      avatar,\n      avatarImage,\n      content,\n      header,\n      author,\n      meta,\n      dateWrap: dateButton,\n      dateButton,\n      replyMeta,\n      body,\n      markdown,\n      actions,\n      reply,\n      postMenuButton,\n    };\n  }\n\n  function visibleMenus(kind = \"\") {\n    const menus = Array.from(document.querySelectorAll(\"[role='menu'], [role='dialog'], .menu, .bottom-sheet\"))\n      .filter(isVisible)\n      .map((node) => menuInfo(node))\n      .filter((info) => info.text);\n\n    if (!kind) return menus;\n    return menus.filter((info) => info.kind === kind);\n  }\n\n  function visiblePostMenus() {\n    return visibleMenus(\"post\");\n  }\n\n  function allComposers(scope = document) {\n    return Array.from(scope.querySelectorAll(`${SELECTORS.newPostComposer}, ${SELECTORS.replyComposer}`));\n  }\n\n  function composerParts(section) {\n    if (!section) return null;\n\n    const composer = section.matches?.(SELECTORS.composer) ? section : section.querySelector(SELECTORS.composer);\n    const editor = section.querySelector(SELECTORS.composerEditor);\n    const editable = section.querySelector(SELECTORS.composerEditable);\n    const toolbarSlot = section.querySelector(SELECTORS.composerToolbarSlot);\n    const toolbar = section.querySelector(SELECTORS.composerToolbar);\n    const imageButton = toolbar?.querySelector(SELECTORS.composerImageButton) ||\n      section.querySelector(SELECTORS.composerImageButton);\n    const modeToggle = section.querySelector(SELECTORS.composerModeToggle);\n    const markdownNode = editable?.querySelector(SELECTORS.composerMarkdownNode) || null;\n\n    return {\n      section,\n      kind: section.matches?.(SELECTORS.newPostComposer) ? \"new-post\" : \"reply\",\n      composer,\n      editor,\n      editable,\n      toolbarSlot,\n      toolbar,\n      imageButton,\n      modeToggle,\n      markdownNode,\n      markdownMode: !!markdownNode || modeToggle?.getAttribute(\"aria-pressed\") === \"true\",\n      ready: !!(composer && editable && toolbarSlot && toolbar && imageButton),\n    };\n  }\n\n  function observeComposers(callback, scope = document.body, onRemoved = null) {\n    if (typeof callback !== \"function\") return () => {};\n\n    const active = new Map();\n    const scan = () => {\n      const current = new Set(allComposers(scope || document));\n\n      active.forEach((parts, section) => {\n        if (current.has(section) && section.isConnected) return;\n        active.delete(section);\n        if (typeof onRemoved === \"function\") onRemoved(parts);\n      });\n\n      current.forEach((section) => {\n        const parts = composerParts(section);\n        if (!parts?.ready || active.has(section)) return;\n        active.set(section, parts);\n        callback(parts);\n      });\n    };\n\n    scan();\n    const observer = new MutationObserver(scan);\n    observer.observe(scope || document.body, { childList: true, subtree: true });\n\n    return () => {\n      observer.disconnect();\n      active.clear();\n    };\n  }\n\n  function explain(element) {\n    if (!isElementLike(element)) {\n      return {\n        ok: false,\n        component: \"unknown\",\n        element: null,\n        target: null,\n        recommendedSelector: \"\",\n        selector: \"\",\n        avoid: [],\n        notes: [\"Nejdřív označte prvek v inspectoru a zavolejte Cudloun.kapyguts.explain($0).\"],\n        css: \"\",\n      };\n    }\n\n    const matched = EXPLAIN_RULES.map((candidate) => ({\n      rule: candidate,\n      target: safeClosest(element, candidate.anchor),\n    })).find((candidate) => candidate.target);\n    const target = matched?.target || element;\n    const recommendedSelector = matched?.rule.selector || fallbackSelector(target);\n    const avoid = fragileClassesBetween(element, target);\n    const notes = [...(matched?.rule.notes || [])];\n    if (avoid.length) {\n      notes.push(\"Třídy uvedené v avoid jsou generované nebo interní; do trvalého skinu je raději nekopírujte.\");\n    }\n    if (!recommendedSelector) {\n      notes.push(\"Pro tento prvek nebyl nalezen dostatečně bezpečný selektor; zkuste označit jeho sémantického rodiče.\");\n    }\n\n    return {\n      ok: !!recommendedSelector,\n      component: matched?.rule.component || \"unknown element\",\n      element,\n      target,\n      recommendedSelector,\n      selector: recommendedSelector,\n      avoid,\n      notes,\n      css: recommendedSelector ? `${recommendedSelector} {\\n  /* vlastní styl */\\n}` : \"\",\n    };\n  }\n\n  function inspect() {\n    const posts = visiblePosts();\n    const menus = visibleMenus();\n    const fontSettings = fontSettingsState();\n    const postDisplay = postDisplayState();\n    const pageChrome = pageChromeParts();\n    const home = homeParts();\n    const messages = messagesParts();\n    return {\n      version: VERSION,\n      isKapybara: isKapybara(),\n      route: route(),\n      currentUser: currentUser(),\n      currentUserCandidates: currentUserCandidates().map((candidate) => ({\n        name: candidate.name,\n        source: candidate.source,\n        confidence: candidate.confidence,\n        rect: candidate.rect,\n      })),\n      viewport: { width: window.innerWidth, height: window.innerHeight },\n      counts: {\n        boardPosts: document.querySelectorAll(SELECTORS.boardPost).length,\n        visibleBoardPosts: posts.length,\n        unreadBoardPosts: document.querySelectorAll(SELECTORS.unreadPost).length,\n        boardHeaders: document.querySelectorAll(SELECTORS.boardHeader).length,\n        pageHeaders: document.querySelectorAll(SELECTORS.pageHeader).length,\n        homeTabs: home.tabs.length,\n        homeBoardRows: home.boardRows.length,\n        avatars: document.querySelectorAll(SELECTORS.avatar).length,\n        replies: document.querySelectorAll(SELECTORS.replyButton).length,\n        postMenuButtons: document.querySelectorAll(SELECTORS.postMenuButton).length,\n        favoriteRows: document.querySelectorAll(SELECTORS.favoriteBoardRow).length,\n        messageItems: document.querySelectorAll(SELECTORS.messageItem).length,\n        messageArticles: document.querySelectorAll(SELECTORS.message).length,\n        messageCards: document.querySelectorAll(SELECTORS.messageCard).length,\n        composers: allComposers().length,\n        readyComposers: allComposers().filter((section) => composerParts(section)?.ready).length,\n        visibleMenus: menus.length,\n        nativeFontSettingsLinks: document.querySelectorAll(SELECTORS.nativeFontSettingsLink).length,\n        nativePostDisplayLinks: document.querySelectorAll(SELECTORS.nativePostDisplayLink).length,\n        viewportStripes: document.querySelectorAll(SELECTORS.viewportStripes).length,\n      },\n      pageChrome: {\n        hasViewportStripes: !!pageChrome.viewportStripes,\n        stripeBackground: pageChrome.stripeBackground,\n        stripesActive: pageChrome.stripesActive,\n      },\n      home: {\n        ready: home.ready,\n        tabs: home.tabs.length,\n        boardRows: home.boardRows.length,\n        activeHref: home.activeTab?.getAttribute(\"href\") || \"\",\n      },\n      messages: {\n        ready: messages.ready,\n        conversations: messages.conversationItems.length,\n        selected: !!messages.selectedConversation,\n        messageArticles: messages.messages.length,\n        cards: messages.cards.length,\n        hasComposerLauncher: !!messages.collapsedComposer,\n      },\n      fontSettings,\n      postDisplay,\n      posts: posts.slice(0, 12).map((post, index) => summarizePost(post, index)),\n      menus: menus.map((info) => ({\n        kind: info.kind,\n        tag: info.node.tagName,\n        role: info.node.getAttribute(\"role\") || \"\",\n        className: String(info.node.className || \"\"),\n        rect: info.rect,\n        text: info.text.slice(0, 260),\n      })),\n    };\n  }\n\n  function visibleElements(selector, scope = document) {\n    return Array.from(scope.querySelectorAll(selector)).filter(isVisible);\n  }\n\n  function addUserCandidate(candidates, value, source, confidence, node) {\n    const name = normalizeUserName(value);\n    if (!name) return;\n    if (candidates.some((candidate) => candidate.name === name && candidate.source === source)) return;\n    candidates.push({\n      name,\n      source,\n      confidence,\n      node,\n      rect: node ? rectInfo(node) : null,\n    });\n  }\n\n  function normalizeUserName(value) {\n    const text = normalizeText(value);\n    if (!text || text.length > 40) return \"\";\n    if (/^(menu|domů|vzkazník|oblíbené|účet|nastavení|odhlásit|barevné schéma)$/i.test(text)) return \"\";\n    return text;\n  }\n\n  function isVisible(node) {\n    if (!(node instanceof Element)) return false;\n    const rect = node.getBoundingClientRect();\n    if (rect.width <= 0 || rect.height <= 0) return false;\n    if (rect.bottom <= 0 || rect.top >= window.innerHeight || rect.right <= 0 || rect.left >= window.innerWidth) return false;\n\n    const style = window.getComputedStyle(node);\n    return style.display !== \"none\" && style.visibility !== \"hidden\" && style.opacity !== \"0\";\n  }\n\n  function menuInfo(node) {\n    const text = normalizeText(node.textContent || \"\");\n    return {\n      node,\n      kind: menuKind(text, node),\n      text,\n      rect: rectInfo(node),\n    };\n  }\n\n  function menuKind(text, node = null) {\n    if (node?.matches?.(SELECTORS.fontSettingsPanel)) return \"font-settings\";\n    if (node?.matches?.(SELECTORS.postDisplayPanel)) return \"post-display-settings\";\n    if (TEXT.postMenu.some((needle) => text.includes(needle))) return \"post\";\n    if (TEXT.avatarMenu.some((needle) => text.includes(needle))) return \"avatar\";\n    return \"unknown\";\n  }\n\n  function labeledNumberInput(panel, label) {\n    if (!panel) return null;\n    const row = Array.from(panel.querySelectorAll(SELECTORS.fontSettingsSizeRow)).find((candidate) => (\n      normalizeText(candidate.textContent).startsWith(label)\n    ));\n    return row?.querySelector(\"input[type='number']\") || null;\n  }\n\n  function buttonByText(panel, label) {\n    if (!panel) return null;\n    const normalizedLabel = normalizeText(label).toLocaleLowerCase(\"cs\");\n    return Array.from(panel.querySelectorAll(\"button\")).find((button) => (\n      normalizeText(button.textContent).toLocaleLowerCase(\"cs\").startsWith(normalizedLabel)\n    )) || null;\n  }\n\n  function switchByText(panel, label) {\n    if (!panel) return null;\n    const normalizedLabel = normalizeText(label).toLocaleLowerCase(\"cs\");\n    return Array.from(panel.querySelectorAll(\"button[role='switch']\")).find((button) => (\n      normalizeText(button.textContent).toLocaleLowerCase(\"cs\").startsWith(normalizedLabel)\n    )) || null;\n  }\n\n  function pressedOption(options) {\n    return Object.entries(options).find(([, button]) => button?.getAttribute(\"aria-pressed\") === \"true\")?.[0] || \"\";\n  }\n\n  function summarizePost(post, index) {\n    const parts = postParts(post);\n    return {\n      index,\n      id: post.id || \"\",\n      postId: post.getAttribute(\"data-post-id\") || \"\",\n      threadId: post.getAttribute(\"data-thread-id\") || \"\",\n      rect: rectInfo(post),\n      text: normalizeText(post.textContent || \"\").slice(0, 220),\n      hasAvatar: !!parts?.avatar,\n      hasHeader: !!parts?.header,\n      hasBody: !!parts?.body,\n      hasActions: !!parts?.actions,\n      hasReply: !!parts?.reply,\n      hasReplyMeta: !!parts?.replyMeta,\n      hasDateWrap: !!parts?.dateWrap,\n      hasPostMenuButton: !!parts?.postMenuButton,\n      unread: post.hasAttribute(\"data-unread\"),\n    };\n  }\n\n  function rectInfo(node) {\n    const rect = node.getBoundingClientRect();\n    return {\n      x: Math.round(rect.x),\n      y: Math.round(rect.y),\n      width: Math.round(rect.width),\n      height: Math.round(rect.height),\n    };\n  }\n\n  function normalizeText(text) {\n    return String(text || \"\").replace(/\\s+/g, \" \").trim();\n  }\n\n  function rule(component, anchor, selector, notes = []) {\n    return { component, anchor, selector, notes };\n  }\n\n  function isElementLike(value) {\n    return !!value && value.nodeType === 1 && typeof value.closest === \"function\";\n  }\n\n  function safeClosest(element, selector) {\n    try {\n      return element.closest(selector);\n    } catch (_error) {\n      return null;\n    }\n  }\n\n  function fragileClassesBetween(element, target) {\n    const found = new Set();\n    let current = element;\n    while (isElementLike(current)) {\n      Array.from(current.classList || []).forEach((className) => {\n        if (\n          className.startsWith(\"🇸-\") ||\n          (className.startsWith(\"🐟-\") && className !== \"🐟-stripes\")\n        ) found.add(`.${className}`);\n      });\n      if (current === target) break;\n      current = current.parentElement;\n    }\n    return Array.from(found);\n  }\n\n  function fallbackSelector(element) {\n    const tag = String(element.tagName || \"\").toLocaleLowerCase(\"en\");\n    if (!tag) return \"\";\n    const id = element.getAttribute?.(\"id\") || \"\";\n    if (id && !/^c\\d+$/i.test(id)) return `#${escapeIdentifier(id)}`;\n    const testId = element.getAttribute?.(\"data-testid\") || \"\";\n    if (testId) return `${tag}[data-testid=\"${escapeAttribute(testId)}\"]`;\n    const ariaLabel = element.getAttribute?.(\"aria-label\") || \"\";\n    if (ariaLabel) return `${tag}[aria-label=\"${escapeAttribute(ariaLabel)}\"]`;\n    const role = element.getAttribute?.(\"role\") || \"\";\n    if (role) return `${tag}[role=\"${escapeAttribute(role)}\"]`;\n    return \"\";\n  }\n\n  function escapeIdentifier(value) {\n    if (typeof CSS !== \"undefined\" && typeof CSS.escape === \"function\") return CSS.escape(value);\n    return String(value).replace(/[^a-zA-Z0-9_-]/g, (character) => `\\\\${character}`);\n  }\n\n  function escapeAttribute(value) {\n    return String(value).replace(/\\\\/g, \"\\\\\\\\\").replace(/\"/g, '\\\\\"');\n  }\n})();\n");
  embeddedScripts.set("modules/sys-kapyguts.js", function () {
    // Cudloun Kapybara DOM dictionary helpers.
    (function () {
      "use strict";

      const root = window.Cudloun || null;
      const VERSION = "0.6.1";
      const SELECTORS = {
        viewportStripes: ".🐟-stripes",
        pageHeader: "header:has(a[aria-label='Okoun home'], .logo)",
        pageHeaderLogo: "a[aria-label='Okoun home'], .logo",
        pageHeaderDesktopActions: ".desktop-right",
        primaryNavigation: "nav[aria-label='Hlavní navigace']",
        homeNavigation: "nav[aria-label='Domovská navigace']",
        homeTab: "nav[aria-label='Domovská navigace'] a[href]",
        homeActiveTab: "nav[aria-label='Domovská navigace'] a[aria-current='page']",
        homeBoardsSection: "section.boards-section",
        homeBoardList: "section.boards-section ul.list",
        homeBoardRow: "section.boards-section a.row[href^='/boards/']",
        desktopAvatarMenuTrigger: "button.avatar-button[aria-label='Uživatelské menu'][aria-haspopup='menu']",
        mobileAvatarMenuTrigger: "nav.mobile-bottom-nav[aria-label='Spodní navigace'] button.user-item[aria-haspopup]",
        dropdownMenu: "[role='menu'][data-dropdown-menu-content]",
        dropdownMenuItem: "[role='menuitem'][data-dropdown-menu-item]",
        nativeFontSettingsLink: "a[role='menuitem'][href='/test/fonts']",
        nativePostDisplayLink: "a[role='menuitem'][href='/test/posts']",
        boardHeader: "header.board-header",
        boardTitleRow: ".board-header .title-row",
        boardTitleLink: ".board-header .title-link",
        boardTitleActions: ".board-header .title-row .title-actions",
        boardNewPostButton: "button.entry-placeholder, button.new-post.mobile",
        boardImageToggle: "button.images-toggle[aria-pressed]",
        boardViewToggle: "button[role='radio'][data-toggle-group-item]",
        boardPager: "nav.pager[aria-label='Stránkování příspěvků']",
        mobileBottomNav: "nav.mobile-bottom-nav[aria-label='Spodní navigace']",
        boardPost: "article.post",
        unreadPost: "article.post[data-unread]",
        avatarColumn: ".avatar-col",
        avatar: ".avatar",
        avatarImage: ".avatar img",
        content: ".post-main",
        header: ".post-header",
        author: ".author",
        meta: ".meta",
        dateButton: "button.date",
        replyMeta: ".reply-ref",
        body: ".body",
        markdown: ".markdown",
        actions: ".actions",
        replyButton: ".reply-action",
        postMenuButton: "button[aria-label='menu']",
        favoriteBoardRow: ".favorites-page a[href^='/boards/'], .favorites-page a[href*='/boards/']",
        messagesPage: "section.messages-page",
        messagesShell: ".messages-shell",
        conversationList: ".conversation-list",
        conversationSearchField: ".conversation-search-field",
        newMessageButton: "button.new-message-button[aria-label='Nová zpráva']",
        messageItem: ".conversation-item",
        selectedMessageItem: ".conversation-item.selected",
        conversationDetail: "section.conversation-detail",
        conversationBackButton: "button[aria-label='Zpět na konverzace']",
        inlineMessageCompose: ".inline-compose",
        collapsedMessageComposer: "button.collapsed-composer",
        collapsedMessageSend: "button.collapsed-send",
        messagesScroll: ".messages-scroll",
        messageList: ".message-list",
        message: "article.message",
        messageCard: ".message-card",
        messageMeta: ".message-meta",
        messageMenu: ".message-menu",
        messageMenuButton: "button.message-menu-trigger[aria-label='Další možnosti']",
        messageBody: ".message-body",
        messageMarkdown: ".message-body .markdown",
        messageActions: ".message-actions",
        messageReplyButton: "button.reply-button",
        newPostComposer: "section.new-post-composer[aria-label='Nový příspěvek']",
        replyComposer: "section.reply-composer[aria-label='Odpověď']",
        composer: ".composer",
        composerEditor: ".composer-editor",
        composerEditable: ".composer-content-editable[role='textbox'][contenteditable='true']",
        composerToolbarSlot: ".composer-toolbar-slot",
        composerToolbar: "[role='toolbar'][aria-label='Formátování textu']",
        composerImageButton: "button[aria-label='Vložit obrázek']",
        composerModeToggle: "button.mode-toggle[aria-pressed]",
        composerMarkdownNode: "code[data-language='markdown']",
        composerTitleInput: "section.new-post-composer input[type='text']",
        fontSettingsPanel: ".fs-panel[role='dialog'][aria-labelledby='fs-title']",
        fontSettingsCopyButton: "button.fs-copy",
        fontSettingsCloseButton: "button.fs-close[aria-label='Zavřít']",
        fontSettingsChromeSelect: "#fs-chrome",
        fontSettingsHeadersSelect: "#fs-chrome-headers",
        fontSettingsContentSelect: "#fs-content",
        fontSettingsCodeSelect: "#fs-code",
        fontSettingsBrandSelect: "#fs-brand",
        fontSettingsSizeRow: "label.fs-size-row",
        postDisplayPanel: ".pd-panel[role='dialog'][aria-labelledby='pd-title']",
        postDisplayCloseButton: "button.pd-close[aria-label='Zavřít']",
        postDisplaySection: ".pd-section",
        postDisplayAvatarSection: ".pd-section.av-section",
        postDisplaySegmentButton: "button.av-seg-btn[aria-pressed]",
      };
      const TEXT = {
        postMenu: ["Smazat", "Upravit", "Označit"],
        avatarMenu: ["Nastavení", "Odhlásit", "Barevné schéma"],
        fontSettings: {
          menuItem: "[test] Nastavení fontů",
          lowDpr: "Náhrada písma při nízkém DPR",
          sizeRows: {
            chrome: "Ovládání",
            headers: "Nadpisy a záhlaví",
            content: "Obsah",
            code: "Kód (neproporcionální)",
            brand: "Logo a značka",
          },
          actions: {
            reset: "Obnovit výchozí",
            cancel: "Zrušit",
            save: "Uložit změny",
          },
        },
        postDisplay: {
          menuItem: "[test] Zobrazení příspěvků",
          switches: {
            largerGap: "Větší mezera",
            separator: "Oddělovač",
          },
          options: {
            shape: {
              circle: "Kruh (výchozí)",
              square: "Čtverec",
              roundedSquare: "Zaoblený čtverec",
              rect: "Obdélník 4:5",
              roundedRect: "Zaoblený 4:5",
            },
            fit: {
              contain: "contain (letterbox)",
              cover: "cover (ořez)",
            },
            ring: {
              none: "Bez",
              hairline: "1px linka",
            },
          },
          actions: {
            save: "Uložit změny",
          },
        },
      };

      const EXPLAIN_RULES = [
        rule("legacy code block", "article.post .body > .code", "article.post .body > .code", [
          "Klasický Okoun ukládá blok kódu jako div.code; pro zachování řádků použijte white-space: pre-wrap.",
        ]),
        rule("post Markdown body", "article.post .body .markdown", "article.post .body .markdown"),
        rule("post reply metadata", `article.post ${SELECTORS.replyMeta}`, `article.post ${SELECTORS.replyMeta}`),
        rule("post reply button", `article.post ${SELECTORS.replyButton}`, `article.post ${SELECTORS.replyButton}`),
        rule("post menu button", `article.post ${SELECTORS.postMenuButton}`, `article.post ${SELECTORS.postMenuButton}`),
        rule("post date", `article.post ${SELECTORS.dateButton}`, `article.post ${SELECTORS.dateButton}`),
        rule("post actions", `article.post ${SELECTORS.actions}`, `article.post ${SELECTORS.actions}`),
        rule("post metadata", `article.post ${SELECTORS.meta}`, `article.post ${SELECTORS.meta}`),
        rule("post author", `article.post ${SELECTORS.author}`, `article.post ${SELECTORS.author}`),
        rule("post header", `article.post ${SELECTORS.header}`, `article.post ${SELECTORS.header}`),
        rule("post avatar image", `article.post ${SELECTORS.avatarImage}`, `article.post ${SELECTORS.avatarImage}`),
        rule("post avatar", `article.post ${SELECTORS.avatar}`, `article.post ${SELECTORS.avatar}`),
        rule("post avatar column", `article.post ${SELECTORS.avatarColumn}`, `article.post ${SELECTORS.avatarColumn}`),
        rule("post body", `article.post ${SELECTORS.body}`, `article.post ${SELECTORS.body}`),
        rule("post content", `article.post ${SELECTORS.content}`, `article.post ${SELECTORS.content}`),
        rule("unread post", SELECTORS.unreadPost, SELECTORS.unreadPost),
        rule("post", SELECTORS.boardPost, SELECTORS.boardPost),
        rule("message Markdown body", `${SELECTORS.message} ${SELECTORS.messageMarkdown}`, `${SELECTORS.message} ${SELECTORS.messageMarkdown}`),
        rule("message reply button", `${SELECTORS.message} ${SELECTORS.messageReplyButton}`, `${SELECTORS.message} ${SELECTORS.messageReplyButton}`),
        rule("message actions", `${SELECTORS.message} ${SELECTORS.messageActions}`, `${SELECTORS.message} ${SELECTORS.messageActions}`),
        rule("message body", `${SELECTORS.message} ${SELECTORS.messageBody}`, `${SELECTORS.message} ${SELECTORS.messageBody}`),
        rule("message menu button", `${SELECTORS.message} ${SELECTORS.messageMenuButton}`, `${SELECTORS.message} ${SELECTORS.messageMenuButton}`),
        rule("message metadata", `${SELECTORS.message} ${SELECTORS.messageMeta}`, `${SELECTORS.message} ${SELECTORS.messageMeta}`),
        rule("message card", `${SELECTORS.message} ${SELECTORS.messageCard}`, `${SELECTORS.message} ${SELECTORS.messageCard}`),
        rule("message", SELECTORS.message, SELECTORS.message),
        rule("composer Markdown source", SELECTORS.composerMarkdownNode, SELECTORS.composerMarkdownNode),
        rule("composer editable", SELECTORS.composerEditable, SELECTORS.composerEditable),
        rule("composer mode switch", SELECTORS.composerModeToggle, SELECTORS.composerModeToggle),
        rule("composer image button", SELECTORS.composerImageButton, SELECTORS.composerImageButton),
        rule("composer title input", SELECTORS.composerTitleInput, SELECTORS.composerTitleInput),
        rule("composer toolbar", SELECTORS.composerToolbar, SELECTORS.composerToolbar),
        rule("composer editor", SELECTORS.composerEditor, SELECTORS.composerEditor),
        rule("composer", SELECTORS.composer, SELECTORS.composer),
        rule("new-post composer", SELECTORS.newPostComposer, SELECTORS.newPostComposer),
        rule("reply composer", SELECTORS.replyComposer, SELECTORS.replyComposer),
        rule("board header actions", SELECTORS.boardTitleActions, SELECTORS.boardTitleActions),
        rule("board title link", SELECTORS.boardTitleLink, SELECTORS.boardTitleLink),
        rule("board title row", SELECTORS.boardTitleRow, SELECTORS.boardTitleRow),
        rule("board header", SELECTORS.boardHeader, SELECTORS.boardHeader),
        rule("board new-post launcher", SELECTORS.boardNewPostButton, SELECTORS.boardNewPostButton),
        rule("board image filter", SELECTORS.boardImageToggle, SELECTORS.boardImageToggle),
        rule("board view switch", SELECTORS.boardViewToggle, SELECTORS.boardViewToggle),
        rule("board pager", SELECTORS.boardPager, SELECTORS.boardPager),
        rule("page-header logo", `${SELECTORS.pageHeader} :is(${SELECTORS.pageHeaderLogo})`, `${SELECTORS.pageHeader} :is(${SELECTORS.pageHeaderLogo})`),
        rule("page-header actions", `${SELECTORS.pageHeader} ${SELECTORS.pageHeaderDesktopActions}`, `${SELECTORS.pageHeader} ${SELECTORS.pageHeaderDesktopActions}`),
        rule("page header", SELECTORS.pageHeader, SELECTORS.pageHeader),
        rule("viewport stripes", SELECTORS.viewportStripes, SELECTORS.viewportStripes, [
          ".🐟-stripes je výjimečný záměrně mapovaný selektor; zde jej lze bezpečně použít.",
        ]),
        rule("mobile bottom navigation", SELECTORS.mobileBottomNav, SELECTORS.mobileBottomNav),
        rule("home board row", SELECTORS.homeBoardRow, SELECTORS.homeBoardRow),
        rule("home board list", SELECTORS.homeBoardList, SELECTORS.homeBoardList),
        rule("home boards section", SELECTORS.homeBoardsSection, SELECTORS.homeBoardsSection),
        rule("home navigation tab", SELECTORS.homeTab, SELECTORS.homeTab),
        rule("home navigation", SELECTORS.homeNavigation, SELECTORS.homeNavigation),
        rule("primary navigation", SELECTORS.primaryNavigation, SELECTORS.primaryNavigation),
        rule("Favorites board row", SELECTORS.favoriteBoardRow, SELECTORS.favoriteBoardRow),
        rule("selected conversation", SELECTORS.selectedMessageItem, SELECTORS.selectedMessageItem),
        rule("conversation item", SELECTORS.messageItem, SELECTORS.messageItem),
        rule("conversation back button", SELECTORS.conversationBackButton, SELECTORS.conversationBackButton),
        rule("conversation detail", SELECTORS.conversationDetail, SELECTORS.conversationDetail),
        rule("conversation list", SELECTORS.conversationList, SELECTORS.conversationList),
        rule("Vzkazník page", SELECTORS.messagesPage, SELECTORS.messagesPage),
        rule("font-settings panel", SELECTORS.fontSettingsPanel, SELECTORS.fontSettingsPanel),
        rule("post-display panel", SELECTORS.postDisplayPanel, SELECTORS.postDisplayPanel),
      ];

      const kapyguts = {
        version: VERSION,
        selectors: SELECTORS,
        text: TEXT,
        isKapybara,
        route,
        currentUser,
        currentUserCandidates,
        isBoardPage,
        isFavoritesPage,
        isMessagesPage,
        isVisible,
        visibleElements,
        allPosts,
        visiblePosts,
        unreadPosts,
        firstUnreadPost,
        postParts,
        pageChromeParts,
        pageHeader,
        pageHeaderParts,
        homeParts,
        avatarMenuParts,
        boardHeaderParts,
        messagesParts,
        messageParts,
        fontSettingsParts,
        fontSettingsState,
        postDisplayParts,
        postDisplayState,
        visibleMenus,
        visiblePostMenus,
        allComposers,
        composerParts,
        observeComposers,
        explain,
        inspect,
      };

      window.Kapyguts = kapyguts;
      if (root) root.kapyguts = kapyguts;
      root?.log?.info?.("kapyguts", "ready", VERSION);

      function isKapybara() {
        return window.location.hostname === "kapybara.okoun.cz";
      }

      function route() {
        const path = window.location.pathname;
        const boardMatch = path.match(/^\/boards\/([^/?#]+)/);
        return {
          href: window.location.href,
          host: window.location.hostname,
          path,
          search: window.location.search,
          hash: window.location.hash,
          type: boardMatch ? "board" : routeType(path),
          boardId: boardMatch ? decodeURIComponent(boardMatch[1]) : "",
        };
      }

      function routeType(path) {
        if (path === "/") return "home";
        if (path === "/new-boards" || path.startsWith("/new-boards/")) return "new-boards";
        if (path === "/fav" || path.startsWith("/fav/")) return "favorites";
        if (path.startsWith("/messages")) return "messages";
        if (path.startsWith("/topics")) return "topics";
        if (path.startsWith("/active-users")) return "active-users";
        if (path === "/test/fonts") return "font-settings";
        if (path === "/test/posts") return "post-display-settings";
        return "unknown";
      }

      function isBoardPage() {
        return route().type === "board";
      }

      function isFavoritesPage() {
        return route().type === "favorites";
      }

      function isMessagesPage() {
        return route().type === "messages";
      }

      function currentUser() {
        const candidates = currentUserCandidates();
        return candidates.find((candidate) => candidate.confidence === "high")?.name ||
          candidates.find((candidate) => candidate.name)?.name ||
          "";
      }

      function currentUserCandidates() {
        const candidates = [];

        visibleElements(".avatar-button").forEach((button) => {
          addUserCandidate(candidates, button.textContent, "avatar-button-text", "high", button);
          addUserCandidate(candidates, button.querySelector("img[alt]")?.getAttribute("alt"), "avatar-button-img-alt", "high", button);
        });

        visibleElements(".user-item, .avatar-shell").forEach((node) => {
          addUserCandidate(candidates, node.textContent, "mobile-user-text", "high", node);
          addUserCandidate(candidates, node.querySelector("img[alt]")?.getAttribute("alt"), "mobile-user-img-alt", "medium", node);
        });

        visibleElements("header img[alt], nav img[alt]").forEach((img) => {
          addUserCandidate(candidates, img.getAttribute("alt"), "header-nav-img-alt", "low", img);
        });

        return candidates;
      }

      function allPosts(scope = document) {
        return Array.from(scope.querySelectorAll(SELECTORS.boardPost));
      }

      function visiblePosts(scope = document) {
        return allPosts(scope).filter(isVisible);
      }

      function unreadPosts(scope = document) {
        return Array.from(scope.querySelectorAll(SELECTORS.unreadPost));
      }

      function firstUnreadPost(scope = document) {
        return unreadPosts(scope)[0] || null;
      }

      function pageChromeParts(scope = document) {
        const viewportStripes = scope.querySelector(SELECTORS.viewportStripes);
        const stripeStyle = viewportStripes ? window.getComputedStyle(viewportStripes) : null;
        const stripeBackground = stripeStyle?.backgroundImage || "";
        return {
          viewportStripes,
          stripeBackground,
          stripesActive: !!viewportStripes && stripeBackground !== "none",
        };
      }

      function pageHeader(scope = document) {
        return Array.from(scope.querySelectorAll(SELECTORS.pageHeader)).find((header) => (
          !header.closest("article.post") && !!header.querySelector(SELECTORS.pageHeaderLogo)
        )) || null;
      }

      function pageHeaderParts(scope = document) {
        const header = pageHeader(scope);
        return {
          header,
          logo: header?.querySelector(SELECTORS.pageHeaderLogo) || null,
          desktopActions: header?.querySelector(SELECTORS.pageHeaderDesktopActions) || null,
        };
      }

      function homeParts(scope = document) {
        const navigation = scope.querySelector(SELECTORS.homeNavigation);
        const boardsSection = scope.querySelector(SELECTORS.homeBoardsSection);
        const boardList = scope.querySelector(SELECTORS.homeBoardList);
        const tabs = Array.from(scope.querySelectorAll(SELECTORS.homeTab));
        const boardRows = Array.from(scope.querySelectorAll(SELECTORS.homeBoardRow));
        return {
          primaryNavigation: scope.querySelector(SELECTORS.primaryNavigation),
          navigation,
          tabs,
          activeTab: scope.querySelector(SELECTORS.homeActiveTab),
          boardsSection,
          boardList,
          boardRows,
          mobileBottomNav: scope.querySelector(SELECTORS.mobileBottomNav),
          ready: !!(navigation && boardsSection && boardList),
        };
      }

      function avatarMenuParts(scope = document) {
        const desktopTrigger = scope.querySelector(SELECTORS.desktopAvatarMenuTrigger);
        const mobileTrigger = scope.querySelector(SELECTORS.mobileAvatarMenuTrigger);
        const trigger = [desktopTrigger, mobileTrigger].find(isVisible) || desktopTrigger || mobileTrigger || null;
        const menu = Array.from(scope.querySelectorAll("[role='menu']")).find((candidate) => (
          isVisible(candidate) && (
            !!candidate.querySelector(SELECTORS.nativeFontSettingsLink) ||
            !!candidate.querySelector(SELECTORS.nativePostDisplayLink) ||
            TEXT.avatarMenu.some((needle) => normalizeText(candidate.textContent).includes(needle))
          )
        )) || null;
        const items = menu ? Array.from(menu.querySelectorAll("[role='menuitem']")) : [];
        const fontSettingsLink = menu?.querySelector(SELECTORS.nativeFontSettingsLink) || null;
        const postDisplayLink = menu?.querySelector(SELECTORS.nativePostDisplayLink) || null;

        return {
          trigger,
          desktopTrigger,
          mobileTrigger,
          menu,
          items,
          fontSettingsLink,
          postDisplayLink,
          open: !!menu || trigger?.getAttribute("aria-expanded") === "true",
        };
      }

      function boardHeaderParts(scope = document) {
        const header = scope.querySelector(SELECTORS.boardHeader);
        const titleRow = scope.querySelector(SELECTORS.boardTitleRow);
        const titleLink = scope.querySelector(SELECTORS.boardTitleLink);
        const actions = scope.querySelector(SELECTORS.boardTitleActions);
        return {
          header,
          titleRow,
          titleLink,
          actions,
          newPostButton: scope.querySelector(SELECTORS.boardNewPostButton),
          imageToggle: scope.querySelector(SELECTORS.boardImageToggle),
          viewToggles: Array.from(scope.querySelectorAll(SELECTORS.boardViewToggle)),
          pagers: Array.from(scope.querySelectorAll(SELECTORS.boardPager)),
          mobileBottomNav: scope.querySelector(SELECTORS.mobileBottomNav),
          stickyTitle: !!titleRow && window.getComputedStyle(titleRow).position === "sticky",
        };
      }

      function messagesParts(scope = document) {
        const page = scope.querySelector(SELECTORS.messagesPage);
        const conversationList = scope.querySelector(SELECTORS.conversationList);
        const detail = scope.querySelector(SELECTORS.conversationDetail);
        const searchField = scope.querySelector(SELECTORS.conversationSearchField);
        return {
          page,
          shell: scope.querySelector(SELECTORS.messagesShell),
          conversationList,
          searchField,
          searchInput: searchField?.querySelector("input") || null,
          newMessageButton: scope.querySelector(SELECTORS.newMessageButton),
          conversationItems: Array.from(scope.querySelectorAll(SELECTORS.messageItem)),
          selectedConversation: scope.querySelector(SELECTORS.selectedMessageItem),
          detail,
          backButton: scope.querySelector(SELECTORS.conversationBackButton),
          inlineCompose: scope.querySelector(SELECTORS.inlineMessageCompose),
          collapsedComposer: scope.querySelector(SELECTORS.collapsedMessageComposer),
          collapsedSend: scope.querySelector(SELECTORS.collapsedMessageSend),
          scroll: scope.querySelector(SELECTORS.messagesScroll),
          messageList: scope.querySelector(SELECTORS.messageList),
          messages: Array.from(scope.querySelectorAll(SELECTORS.message)),
          cards: Array.from(scope.querySelectorAll(SELECTORS.messageCard)),
          layout: conversationList && detail ? "split" : detail ? "detail" : conversationList ? "list" : "unknown",
          ready: !!page && !!(conversationList || detail),
        };
      }

      function messageParts(node) {
        if (!node) return null;
        const message = node.matches?.(SELECTORS.message) ? node : node.closest?.(SELECTORS.message) || null;
        const card = node.matches?.(SELECTORS.messageCard) ? node : message?.querySelector(SELECTORS.messageCard) || null;
        if (!message || !card) return null;
        return {
          message,
          card,
          header: card.querySelector("header"),
          avatar: card.querySelector(SELECTORS.avatar),
          meta: card.querySelector(SELECTORS.messageMeta),
          menu: card.querySelector(SELECTORS.messageMenu),
          menuButton: card.querySelector(SELECTORS.messageMenuButton),
          body: card.querySelector(SELECTORS.messageBody),
          markdown: card.querySelector(SELECTORS.messageMarkdown),
          actions: card.querySelector(SELECTORS.messageActions),
          replyButton: card.querySelector(SELECTORS.messageReplyButton),
          direction: message.matches?.(".outgoing") ? "outgoing" : message.matches?.(".incoming") ? "incoming" : "",
        };
      }

      // Kapybara labels this route as a temporary test. Keep its DOM contract
      // isolated here so modules do not couple themselves to the experiment.
      function fontSettingsParts(scope = document) {
        const panel = scope.querySelector(SELECTORS.fontSettingsPanel);
        const selects = {
          chrome: panel?.querySelector(SELECTORS.fontSettingsChromeSelect) || null,
          headers: panel?.querySelector(SELECTORS.fontSettingsHeadersSelect) || null,
          content: panel?.querySelector(SELECTORS.fontSettingsContentSelect) || null,
          code: panel?.querySelector(SELECTORS.fontSettingsCodeSelect) || null,
          brand: panel?.querySelector(SELECTORS.fontSettingsBrandSelect) || null,
        };
        const sizes = Object.fromEntries(Object.entries(TEXT.fontSettings.sizeRows).map(([key, label]) => (
          [key, labeledNumberInput(panel, label)]
        )));
        const lowDprSwitch = panel ? Array.from(panel.querySelectorAll("button[role='switch']")).find((button) => (
          normalizeText(button.textContent).startsWith(TEXT.fontSettings.lowDpr)
        )) || null : null;
        const actions = Object.fromEntries(Object.entries(TEXT.fontSettings.actions).map(([key, label]) => (
          [key, buttonByText(panel, label)]
        )));

        return {
          panel,
          copyButton: panel?.querySelector(SELECTORS.fontSettingsCopyButton) || null,
          closeButton: panel?.querySelector(SELECTORS.fontSettingsCloseButton) || null,
          selects,
          sizes,
          lowDprSwitch,
          actions,
          ready: !!panel && Object.values(selects).every(Boolean) && Object.values(sizes).every(Boolean),
        };
      }

      function fontSettingsState(scope = document) {
        const parts = fontSettingsParts(scope);
        if (!parts.panel) return null;

        return {
          ready: parts.ready,
          serifExperiment: new URLSearchParams(window.location.search).get("k") === "chatk_colit",
          fonts: Object.fromEntries(Object.entries(parts.selects).map(([key, select]) => [key, select?.value || ""])),
          sizes: Object.fromEntries(Object.entries(parts.sizes).map(([key, input]) => [key, input?.value || ""])),
          lowDprFallback: parts.lowDprSwitch?.getAttribute("aria-checked") === "true",
          dirty: !!parts.actions.save && !parts.actions.save.disabled,
        };
      }

      // Kapybara labels this route as temporary. Resolve controls by their Czech
      // labels so callers are insulated from layout and generated class changes.
      function postDisplayParts(scope = document) {
        const panel = scope.querySelector(SELECTORS.postDisplayPanel);
        const segmentButtons = panel ? Array.from(panel.querySelectorAll(SELECTORS.postDisplaySegmentButton)) : [];
        const switches = Object.fromEntries(Object.entries(TEXT.postDisplay.switches).map(([key, label]) => (
          [key, switchByText(panel, label)]
        )));
        const options = Object.fromEntries(Object.entries(TEXT.postDisplay.options).map(([group, labels]) => (
          [group, Object.fromEntries(Object.entries(labels).map(([key, label]) => (
            [key, buttonByText(panel, label)]
          )))]
        )));
        const actions = Object.fromEntries(Object.entries(TEXT.postDisplay.actions).map(([key, label]) => (
          [key, buttonByText(panel, label)]
        )));

        return {
          panel,
          closeButton: panel?.querySelector(SELECTORS.postDisplayCloseButton) || null,
          sections: panel ? Array.from(panel.querySelectorAll(SELECTORS.postDisplaySection)) : [],
          avatarSection: panel?.querySelector(SELECTORS.postDisplayAvatarSection) || null,
          segmentButtons,
          switches,
          options,
          actions,
          previewPosts: panel ? Array.from(panel.querySelectorAll(SELECTORS.boardPost)) : [],
          ready: !!panel && Object.values(switches).every(Boolean) &&
            Object.values(options).every((group) => Object.values(group).every(Boolean)),
        };
      }

      function postDisplayState(scope = document) {
        const parts = postDisplayParts(scope);
        if (!parts.panel) return null;

        return {
          ready: parts.ready,
          largerGap: parts.switches.largerGap?.getAttribute("aria-checked") === "true",
          separator: parts.switches.separator?.getAttribute("aria-checked") === "true",
          shape: pressedOption(parts.options.shape),
          fit: pressedOption(parts.options.fit),
          ring: pressedOption(parts.options.ring),
          dirty: !!parts.actions.save && !parts.actions.save.disabled,
        };
      }

      function postParts(post) {
        if (!post) return null;

        const avatarColumn = post.querySelector(SELECTORS.avatarColumn);
        const avatar = post.querySelector(SELECTORS.avatar);
        const avatarImage = post.querySelector(SELECTORS.avatarImage);
        const content = post.querySelector(SELECTORS.content);
        const header = post.querySelector(SELECTORS.header);
        const author = post.querySelector(SELECTORS.author);
        const meta = post.querySelector(SELECTORS.meta);
        const dateButton = post.querySelector(SELECTORS.dateButton);
        const replyMeta = post.querySelector(SELECTORS.replyMeta);
        const body = post.querySelector(SELECTORS.body);
        const markdown = post.querySelector(SELECTORS.markdown);
        const actions = post.querySelector(SELECTORS.actions);
        const reply = post.querySelector(SELECTORS.replyButton);
        const postMenuButton = post.querySelector(SELECTORS.postMenuButton);

        return {
          post,
          row: post,
          avatarColumn,
          avatar,
          avatarImage,
          content,
          header,
          author,
          meta,
          dateWrap: dateButton,
          dateButton,
          replyMeta,
          body,
          markdown,
          actions,
          reply,
          postMenuButton,
        };
      }

      function visibleMenus(kind = "") {
        const menus = Array.from(document.querySelectorAll("[role='menu'], [role='dialog'], .menu, .bottom-sheet"))
          .filter(isVisible)
          .map((node) => menuInfo(node))
          .filter((info) => info.text);

        if (!kind) return menus;
        return menus.filter((info) => info.kind === kind);
      }

      function visiblePostMenus() {
        return visibleMenus("post");
      }

      function allComposers(scope = document) {
        return Array.from(scope.querySelectorAll(`${SELECTORS.newPostComposer}, ${SELECTORS.replyComposer}`));
      }

      function composerParts(section) {
        if (!section) return null;

        const composer = section.matches?.(SELECTORS.composer) ? section : section.querySelector(SELECTORS.composer);
        const editor = section.querySelector(SELECTORS.composerEditor);
        const editable = section.querySelector(SELECTORS.composerEditable);
        const toolbarSlot = section.querySelector(SELECTORS.composerToolbarSlot);
        const toolbar = section.querySelector(SELECTORS.composerToolbar);
        const imageButton = toolbar?.querySelector(SELECTORS.composerImageButton) ||
          section.querySelector(SELECTORS.composerImageButton);
        const modeToggle = section.querySelector(SELECTORS.composerModeToggle);
        const markdownNode = editable?.querySelector(SELECTORS.composerMarkdownNode) || null;

        return {
          section,
          kind: section.matches?.(SELECTORS.newPostComposer) ? "new-post" : "reply",
          composer,
          editor,
          editable,
          toolbarSlot,
          toolbar,
          imageButton,
          modeToggle,
          markdownNode,
          markdownMode: !!markdownNode || modeToggle?.getAttribute("aria-pressed") === "true",
          ready: !!(composer && editable && toolbarSlot && toolbar && imageButton),
        };
      }

      function observeComposers(callback, scope = document.body, onRemoved = null) {
        if (typeof callback !== "function") return () => {};

        const active = new Map();
        const scan = () => {
          const current = new Set(allComposers(scope || document));

          active.forEach((parts, section) => {
            if (current.has(section) && section.isConnected) return;
            active.delete(section);
            if (typeof onRemoved === "function") onRemoved(parts);
          });

          current.forEach((section) => {
            const parts = composerParts(section);
            if (!parts?.ready || active.has(section)) return;
            active.set(section, parts);
            callback(parts);
          });
        };

        scan();
        const observer = new MutationObserver(scan);
        observer.observe(scope || document.body, { childList: true, subtree: true });

        return () => {
          observer.disconnect();
          active.clear();
        };
      }

      function explain(element) {
        if (!isElementLike(element)) {
          return {
            ok: false,
            component: "unknown",
            element: null,
            target: null,
            recommendedSelector: "",
            selector: "",
            avoid: [],
            notes: ["Nejdřív označte prvek v inspectoru a zavolejte Cudloun.kapyguts.explain($0)."],
            css: "",
          };
        }

        const matched = EXPLAIN_RULES.map((candidate) => ({
          rule: candidate,
          target: safeClosest(element, candidate.anchor),
        })).find((candidate) => candidate.target);
        const target = matched?.target || element;
        const recommendedSelector = matched?.rule.selector || fallbackSelector(target);
        const avoid = fragileClassesBetween(element, target);
        const notes = [...(matched?.rule.notes || [])];
        if (avoid.length) {
          notes.push("Třídy uvedené v avoid jsou generované nebo interní; do trvalého skinu je raději nekopírujte.");
        }
        if (!recommendedSelector) {
          notes.push("Pro tento prvek nebyl nalezen dostatečně bezpečný selektor; zkuste označit jeho sémantického rodiče.");
        }

        return {
          ok: !!recommendedSelector,
          component: matched?.rule.component || "unknown element",
          element,
          target,
          recommendedSelector,
          selector: recommendedSelector,
          avoid,
          notes,
          css: recommendedSelector ? `${recommendedSelector} {\n  /* vlastní styl */\n}` : "",
        };
      }

      function inspect() {
        const posts = visiblePosts();
        const menus = visibleMenus();
        const fontSettings = fontSettingsState();
        const postDisplay = postDisplayState();
        const pageChrome = pageChromeParts();
        const home = homeParts();
        const messages = messagesParts();
        return {
          version: VERSION,
          isKapybara: isKapybara(),
          route: route(),
          currentUser: currentUser(),
          currentUserCandidates: currentUserCandidates().map((candidate) => ({
            name: candidate.name,
            source: candidate.source,
            confidence: candidate.confidence,
            rect: candidate.rect,
          })),
          viewport: { width: window.innerWidth, height: window.innerHeight },
          counts: {
            boardPosts: document.querySelectorAll(SELECTORS.boardPost).length,
            visibleBoardPosts: posts.length,
            unreadBoardPosts: document.querySelectorAll(SELECTORS.unreadPost).length,
            boardHeaders: document.querySelectorAll(SELECTORS.boardHeader).length,
            pageHeaders: document.querySelectorAll(SELECTORS.pageHeader).length,
            homeTabs: home.tabs.length,
            homeBoardRows: home.boardRows.length,
            avatars: document.querySelectorAll(SELECTORS.avatar).length,
            replies: document.querySelectorAll(SELECTORS.replyButton).length,
            postMenuButtons: document.querySelectorAll(SELECTORS.postMenuButton).length,
            favoriteRows: document.querySelectorAll(SELECTORS.favoriteBoardRow).length,
            messageItems: document.querySelectorAll(SELECTORS.messageItem).length,
            messageArticles: document.querySelectorAll(SELECTORS.message).length,
            messageCards: document.querySelectorAll(SELECTORS.messageCard).length,
            composers: allComposers().length,
            readyComposers: allComposers().filter((section) => composerParts(section)?.ready).length,
            visibleMenus: menus.length,
            nativeFontSettingsLinks: document.querySelectorAll(SELECTORS.nativeFontSettingsLink).length,
            nativePostDisplayLinks: document.querySelectorAll(SELECTORS.nativePostDisplayLink).length,
            viewportStripes: document.querySelectorAll(SELECTORS.viewportStripes).length,
          },
          pageChrome: {
            hasViewportStripes: !!pageChrome.viewportStripes,
            stripeBackground: pageChrome.stripeBackground,
            stripesActive: pageChrome.stripesActive,
          },
          home: {
            ready: home.ready,
            tabs: home.tabs.length,
            boardRows: home.boardRows.length,
            activeHref: home.activeTab?.getAttribute("href") || "",
          },
          messages: {
            ready: messages.ready,
            conversations: messages.conversationItems.length,
            selected: !!messages.selectedConversation,
            messageArticles: messages.messages.length,
            cards: messages.cards.length,
            hasComposerLauncher: !!messages.collapsedComposer,
          },
          fontSettings,
          postDisplay,
          posts: posts.slice(0, 12).map((post, index) => summarizePost(post, index)),
          menus: menus.map((info) => ({
            kind: info.kind,
            tag: info.node.tagName,
            role: info.node.getAttribute("role") || "",
            className: String(info.node.className || ""),
            rect: info.rect,
            text: info.text.slice(0, 260),
          })),
        };
      }

      function visibleElements(selector, scope = document) {
        return Array.from(scope.querySelectorAll(selector)).filter(isVisible);
      }

      function addUserCandidate(candidates, value, source, confidence, node) {
        const name = normalizeUserName(value);
        if (!name) return;
        if (candidates.some((candidate) => candidate.name === name && candidate.source === source)) return;
        candidates.push({
          name,
          source,
          confidence,
          node,
          rect: node ? rectInfo(node) : null,
        });
      }

      function normalizeUserName(value) {
        const text = normalizeText(value);
        if (!text || text.length > 40) return "";
        if (/^(menu|domů|vzkazník|oblíbené|účet|nastavení|odhlásit|barevné schéma)$/i.test(text)) return "";
        return text;
      }

      function isVisible(node) {
        if (!(node instanceof Element)) return false;
        const rect = node.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return false;
        if (rect.bottom <= 0 || rect.top >= window.innerHeight || rect.right <= 0 || rect.left >= window.innerWidth) return false;

        const style = window.getComputedStyle(node);
        return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
      }

      function menuInfo(node) {
        const text = normalizeText(node.textContent || "");
        return {
          node,
          kind: menuKind(text, node),
          text,
          rect: rectInfo(node),
        };
      }

      function menuKind(text, node = null) {
        if (node?.matches?.(SELECTORS.fontSettingsPanel)) return "font-settings";
        if (node?.matches?.(SELECTORS.postDisplayPanel)) return "post-display-settings";
        if (TEXT.postMenu.some((needle) => text.includes(needle))) return "post";
        if (TEXT.avatarMenu.some((needle) => text.includes(needle))) return "avatar";
        return "unknown";
      }

      function labeledNumberInput(panel, label) {
        if (!panel) return null;
        const row = Array.from(panel.querySelectorAll(SELECTORS.fontSettingsSizeRow)).find((candidate) => (
          normalizeText(candidate.textContent).startsWith(label)
        ));
        return row?.querySelector("input[type='number']") || null;
      }

      function buttonByText(panel, label) {
        if (!panel) return null;
        const normalizedLabel = normalizeText(label).toLocaleLowerCase("cs");
        return Array.from(panel.querySelectorAll("button")).find((button) => (
          normalizeText(button.textContent).toLocaleLowerCase("cs").startsWith(normalizedLabel)
        )) || null;
      }

      function switchByText(panel, label) {
        if (!panel) return null;
        const normalizedLabel = normalizeText(label).toLocaleLowerCase("cs");
        return Array.from(panel.querySelectorAll("button[role='switch']")).find((button) => (
          normalizeText(button.textContent).toLocaleLowerCase("cs").startsWith(normalizedLabel)
        )) || null;
      }

      function pressedOption(options) {
        return Object.entries(options).find(([, button]) => button?.getAttribute("aria-pressed") === "true")?.[0] || "";
      }

      function summarizePost(post, index) {
        const parts = postParts(post);
        return {
          index,
          id: post.id || "",
          postId: post.getAttribute("data-post-id") || "",
          threadId: post.getAttribute("data-thread-id") || "",
          rect: rectInfo(post),
          text: normalizeText(post.textContent || "").slice(0, 220),
          hasAvatar: !!parts?.avatar,
          hasHeader: !!parts?.header,
          hasBody: !!parts?.body,
          hasActions: !!parts?.actions,
          hasReply: !!parts?.reply,
          hasReplyMeta: !!parts?.replyMeta,
          hasDateWrap: !!parts?.dateWrap,
          hasPostMenuButton: !!parts?.postMenuButton,
          unread: post.hasAttribute("data-unread"),
        };
      }

      function rectInfo(node) {
        const rect = node.getBoundingClientRect();
        return {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      }

      function normalizeText(text) {
        return String(text || "").replace(/\s+/g, " ").trim();
      }

      function rule(component, anchor, selector, notes = []) {
        return { component, anchor, selector, notes };
      }

      function isElementLike(value) {
        return !!value && value.nodeType === 1 && typeof value.closest === "function";
      }

      function safeClosest(element, selector) {
        try {
          return element.closest(selector);
        } catch (_error) {
          return null;
        }
      }

      function fragileClassesBetween(element, target) {
        const found = new Set();
        let current = element;
        while (isElementLike(current)) {
          Array.from(current.classList || []).forEach((className) => {
            if (
              className.startsWith("🇸-") ||
              (className.startsWith("🐟-") && className !== "🐟-stripes")
            ) found.add(`.${className}`);
          });
          if (current === target) break;
          current = current.parentElement;
        }
        return Array.from(found);
      }

      function fallbackSelector(element) {
        const tag = String(element.tagName || "").toLocaleLowerCase("en");
        if (!tag) return "";
        const id = element.getAttribute?.("id") || "";
        if (id && !/^c\d+$/i.test(id)) return `#${escapeIdentifier(id)}`;
        const testId = element.getAttribute?.("data-testid") || "";
        if (testId) return `${tag}[data-testid="${escapeAttribute(testId)}"]`;
        const ariaLabel = element.getAttribute?.("aria-label") || "";
        if (ariaLabel) return `${tag}[aria-label="${escapeAttribute(ariaLabel)}"]`;
        const role = element.getAttribute?.("role") || "";
        if (role) return `${tag}[role="${escapeAttribute(role)}"]`;
        return "";
      }

      function escapeIdentifier(value) {
        if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(value);
        return String(value).replace(/[^a-zA-Z0-9_-]/g, (character) => `\\${character}`);
      }

      function escapeAttribute(value) {
        return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      }
    })();

  });

  embeddedText.set("modules/sys-feedback.js", "// Cudloun Firestore-backed feedback threads.\n(function () {\n  \"use strict\";\n\n  const root = window.Cudloun;\n  const VERSION = \"0.3.1\";\n  const PROJECT_ID = \"murkypond-vault-fc61c\";\n  const REST_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;\n  const MAX_TEXT_LENGTH = 1200;\n  const PAGE_SIZE = 80;\n  const ADMIN_AUTHORS = new Set([\"blasnik\"]);\n\n  root.feedback = {\n    version: VERSION,\n    projectId: PROJECT_ID,\n    renderThread,\n    threadId,\n    detectAuthor,\n  };\n\n  root.log.info(\"feedback\", \"ready\", VERSION);\n\n  function renderThread(target) {\n    const normalized = normalizeTarget(target);\n    const wrap = document.createElement(\"section\");\n    wrap.className = \"cudloun-feedback\";\n    wrap.dataset.threadId = normalized.threadId;\n\n    const header = document.createElement(\"div\");\n    header.className = \"cudloun-feedback-head\";\n\n    const title = document.createElement(\"h3\");\n    title.textContent = \"Feedback\";\n\n    const refresh = document.createElement(\"button\");\n    refresh.type = \"button\";\n    refresh.className = \"cudloun-feedback-refresh\";\n    refresh.textContent = \"Refresh\";\n    refresh.addEventListener(\"click\", () => loadMessages(normalized, wrap));\n\n    header.appendChild(title);\n    header.appendChild(refresh);\n\n    const meta = document.createElement(\"p\");\n    meta.className = \"cudloun-feedback-meta\";\n    meta.textContent = `${normalized.kind}:${normalized.id}`;\n\n    const messages = document.createElement(\"div\");\n    messages.className = \"cudloun-feedback-messages\";\n    messages.textContent = \"Loading feedback...\";\n\n    const form = document.createElement(\"form\");\n    form.className = \"cudloun-feedback-form\";\n\n    const author = document.createElement(\"input\");\n    author.className = \"cudloun-feedback-author\";\n    author.type = \"text\";\n    author.name = \"author\";\n    author.maxLength = 40;\n    author.placeholder = \"Name\";\n    author.value = initialAuthor();\n\n    const textarea = document.createElement(\"textarea\");\n    textarea.name = \"text\";\n    textarea.maxLength = MAX_TEXT_LENGTH;\n    textarea.rows = 3;\n    textarea.placeholder = \"Idea, bug, or note...\";\n\n    const replyBanner = document.createElement(\"div\");\n    replyBanner.className = \"cudloun-feedback-reply-target\";\n    replyBanner.hidden = true;\n\n    const replyText = document.createElement(\"span\");\n\n    const cancelReply = document.createElement(\"button\");\n    cancelReply.type = \"button\";\n    cancelReply.textContent = \"Cancel\";\n    cancelReply.addEventListener(\"click\", () => clearReplyTarget(form, textarea));\n\n    replyBanner.appendChild(replyText);\n    replyBanner.appendChild(cancelReply);\n\n    const actions = document.createElement(\"div\");\n    actions.className = \"cudloun-feedback-actions\";\n\n    const status = document.createElement(\"span\");\n    status.className = \"cudloun-feedback-status\";\n\n    const submit = document.createElement(\"button\");\n    submit.type = \"submit\";\n    submit.className = \"cudloun-button\";\n    submit.textContent = \"Send\";\n\n    actions.appendChild(status);\n    actions.appendChild(submit);\n    form.appendChild(author);\n    form.appendChild(replyBanner);\n    form.appendChild(textarea);\n    form.appendChild(actions);\n\n    form.addEventListener(\"submit\", (event) => {\n      event.preventDefault();\n      sendMessage(normalized, author, textarea, submit, status, wrap, form);\n    });\n\n    wrap.appendChild(header);\n    wrap.appendChild(meta);\n    wrap.appendChild(messages);\n    wrap.appendChild(form);\n\n    loadMessages(normalized, wrap);\n    return wrap;\n  }\n\n  async function loadMessages(target, wrap) {\n    const box = wrap.querySelector(\".cudloun-feedback-messages\");\n    if (!box) return;\n\n    box.textContent = \"Loading feedback...\";\n\n    try {\n      const url = `${REST_BASE}/cudlounThreads/${encodeURIComponent(target.threadId)}/messages?orderBy=ts%20desc&pageSize=${PAGE_SIZE}`;\n      const data = await requestJson(url);\n      const messages = (data.documents || []).map(documentToMessage).filter(Boolean).reverse();\n      renderMessages(box, messages, wrap);\n    } catch (error) {\n      root.log.warn(\"feedback\", \"ordered load failed\", target.threadId, error);\n      try {\n        const fallbackUrl = `${REST_BASE}/cudlounThreads/${encodeURIComponent(target.threadId)}/messages?pageSize=${PAGE_SIZE}`;\n        const data = await requestJson(fallbackUrl);\n        const messages = (data.documents || []).map(documentToMessage).filter(Boolean)\n          .sort((a, b) => (a.ts || 0) - (b.ts || 0));\n        renderMessages(box, messages, wrap);\n      } catch (fallbackError) {\n        root.log.warn(\"feedback\", \"load failed\", target.threadId, fallbackError);\n        box.textContent = \"Feedback could not be loaded.\";\n      }\n    }\n  }\n\n  function renderMessages(box, messages, wrap) {\n    box.innerHTML = \"\";\n\n    if (!messages.length) {\n      const empty = document.createElement(\"div\");\n      empty.className = \"cudloun-feedback-empty\";\n      empty.textContent = \"No feedback yet.\";\n      box.appendChild(empty);\n      return;\n    }\n\n    const tree = messageTree(messages);\n    tree.roots.forEach((message) => {\n      box.appendChild(renderMessage(message, tree.children, wrap, 0, new Set()));\n    });\n\n    box.scrollTop = box.scrollHeight;\n  }\n\n  function renderMessage(message, children, wrap, depth, trail) {\n    if (trail.has(message.id)) return document.createTextNode(\"\");\n    const nextTrail = new Set(trail);\n    nextTrail.add(message.id);\n\n    const item = document.createElement(\"article\");\n    item.className = \"cudloun-feedback-message\";\n    item.dataset.messageId = message.id;\n    item.dataset.depth = String(Math.min(depth, 3));\n    if (message.parentId) item.dataset.reply = \"true\";\n\n    const head = document.createElement(\"div\");\n    head.className = \"cudloun-feedback-message-head\";\n\n    const author = document.createElement(\"strong\");\n    author.textContent = message.author || \"Unknown\";\n\n    const time = document.createElement(\"time\");\n    time.textContent = formatTime(message.ts);\n\n    head.appendChild(author);\n    head.appendChild(time);\n    item.appendChild(head);\n\n    if (message.parentId) {\n      const parent = document.createElement(\"div\");\n      parent.className = \"cudloun-feedback-parent\";\n      parent.textContent = message.parentAuthor ? `Reply to ${message.parentAuthor}` : \"Reply\";\n      item.appendChild(parent);\n    }\n\n    const text = document.createElement(\"div\");\n    text.className = \"cudloun-feedback-text\";\n    renderFeedbackText(text, message.text || \"\");\n    item.appendChild(text);\n\n    const actions = document.createElement(\"div\");\n    actions.className = \"cudloun-feedback-message-actions\";\n\n    const reply = document.createElement(\"button\");\n    reply.type = \"button\";\n    reply.textContent = \"Reply\";\n    reply.addEventListener(\"click\", () => setReplyTarget(wrap, message));\n    actions.appendChild(reply);\n\n    if (canDeleteMessage(message)) {\n      const remove = document.createElement(\"button\");\n      remove.type = \"button\";\n      remove.className = \"cudloun-feedback-delete\";\n      remove.textContent = \"Delete\";\n      remove.addEventListener(\"click\", () => deleteMessage(wrap, message, remove));\n      actions.appendChild(remove);\n    }\n    item.appendChild(actions);\n\n    const replies = children.get(message.id) || [];\n    if (replies.length) {\n      const replyList = document.createElement(\"div\");\n      replyList.className = \"cudloun-feedback-replies\";\n      replies.forEach((child) => {\n        replyList.appendChild(renderMessage(child, children, wrap, depth + 1, nextTrail));\n      });\n      item.appendChild(replyList);\n    }\n\n    return item;\n  }\n\n  function messageTree(messages) {\n    const byId = new Map(messages.map((message) => [message.id, message]));\n    const children = new Map();\n    const roots = [];\n\n    messages.forEach((message) => {\n      if (message.parentId && byId.has(message.parentId)) {\n        if (!children.has(message.parentId)) children.set(message.parentId, []);\n        children.get(message.parentId).push(message);\n      } else {\n        roots.push(message);\n      }\n    });\n\n    if (!roots.length && messages.length) roots.push(...messages);\n\n    children.forEach((items) => items.sort((a, b) => (a.ts || 0) - (b.ts || 0)));\n    roots.sort((a, b) => (a.ts || 0) - (b.ts || 0));\n    return { roots, children };\n  }\n\n  function renderFeedbackText(container, value) {\n    const text = String(value || \"\");\n    const pattern = /<img\\s+[^>]*src\\s*=\\s*[\"']([^\"']+)[\"'][^>]*>|(https?:\\/\\/[^\\s<>\"']+\\.(?:png|jpe?g|gif|webp|avif)(?:\\?[^\\s<>\"']*)?)/gi;\n    let cursor = 0;\n    let match;\n\n    while ((match = pattern.exec(text))) {\n      const rawUrl = match[1] || match[2] || \"\";\n      const url = safeImageUrl(rawUrl);\n      if (!url) continue;\n\n      if (match.index > cursor) container.appendChild(document.createTextNode(text.slice(cursor, match.index)));\n      container.appendChild(renderImageLink(url));\n      cursor = match.index + match[0].length;\n    }\n\n    if (cursor < text.length) container.appendChild(document.createTextNode(text.slice(cursor)));\n  }\n\n  function safeImageUrl(value) {\n    const raw = String(value || \"\").trim();\n    if (!raw || raw.length > 500) return \"\";\n\n    try {\n      const url = new URL(raw, window.location.href);\n      if (url.protocol !== \"https:\" && url.protocol !== \"http:\") return \"\";\n      if (!/\\.(png|jpe?g|gif|webp|avif)$/i.test(url.pathname)) return \"\";\n      return url.href;\n    } catch (error) {\n      return \"\";\n    }\n  }\n\n  function renderImageLink(url) {\n    const link = document.createElement(\"a\");\n    link.className = \"cudloun-feedback-image-link\";\n    link.href = url;\n    link.target = \"_blank\";\n    link.rel = \"noopener noreferrer\";\n\n    const img = document.createElement(\"img\");\n    img.className = \"cudloun-feedback-image\";\n    img.src = url;\n    img.loading = \"lazy\";\n    img.alt = \"\";\n\n    link.appendChild(img);\n    return link;\n  }\n\n  function setReplyTarget(wrap, message) {\n    const form = wrap.querySelector(\".cudloun-feedback-form\");\n    const textarea = form?.querySelector(\"textarea\");\n    const banner = form?.querySelector(\".cudloun-feedback-reply-target\");\n    const label = banner?.querySelector(\"span\");\n    if (!form || !textarea || !banner || !label) return;\n\n    form.dataset.parentId = message.id;\n    form.dataset.parentAuthor = message.author || \"Unknown\";\n    form.dataset.parentExcerpt = excerpt(message.text);\n    label.textContent = `Replying to ${message.author || \"Unknown\"}: ${excerpt(message.text)}`;\n    banner.hidden = false;\n    textarea.placeholder = \"Reply...\";\n    textarea.focus();\n  }\n\n  function clearReplyTarget(form, textarea) {\n    delete form.dataset.parentId;\n    delete form.dataset.parentAuthor;\n    delete form.dataset.parentExcerpt;\n    const banner = form.querySelector(\".cudloun-feedback-reply-target\");\n    if (banner) banner.hidden = true;\n    if (textarea) textarea.placeholder = \"Idea, bug, or note...\";\n  }\n\n  async function sendMessage(target, authorInput, textarea, submit, status, wrap, form) {\n    const author = cleanAuthor(authorInput.value || detectAuthor());\n    const text = String(textarea.value || \"\").trim();\n    const parent = parentFields(form);\n\n    if (!text) {\n      status.textContent = \"Write something first.\";\n      return;\n    }\n\n    if (text.length > MAX_TEXT_LENGTH) {\n      status.textContent = `Max ${MAX_TEXT_LENGTH} chars.`;\n      return;\n    }\n\n    authorInput.value = author;\n    root.storage.set(\"feedback.author\", author);\n    submit.disabled = true;\n    status.textContent = \"Sending...\";\n\n    try {\n      await requestJson(`${REST_BASE}/cudlounThreads/${encodeURIComponent(target.threadId)}/messages`, {\n        method: \"POST\",\n        headers: { \"Content-Type\": \"application/json\" },\n        body: JSON.stringify({\n          fields: {\n            schemaVersion: { integerValue: parent.parentId ? 2 : 1 },\n            author: { stringValue: author },\n            text: { stringValue: text },\n            ts: { integerValue: String(Date.now()) },\n            route: { stringValue: root.currentRoute() },\n            cudlounVersion: { stringValue: root.version || \"\" },\n            userAgentHint: { stringValue: userAgentHint() },\n            ...parent.firestoreFields,\n          },\n        }),\n      });\n\n      textarea.value = \"\";\n      clearReplyTarget(form, textarea);\n      status.textContent = \"Sent.\";\n      await loadMessages(target, wrap);\n      window.setTimeout(() => {\n        if (status.textContent === \"Sent.\") status.textContent = \"\";\n      }, 1800);\n    } catch (error) {\n      root.log.warn(\"feedback\", \"send failed\", target.threadId, error);\n      status.textContent = \"Send failed.\";\n    } finally {\n      submit.disabled = false;\n    }\n  }\n\n  async function deleteMessage(wrap, message, button) {\n    const threadId = wrap.dataset.threadId;\n    if (!threadId || !message.id || !canDeleteMessage(message)) return;\n    if (!window.confirm(`Delete feedback from ${message.author || \"Unknown\"}?`)) return;\n\n    const status = wrap.querySelector(\".cudloun-feedback-status\");\n    if (button) button.disabled = true;\n    if (status) status.textContent = \"Deleting...\";\n\n    try {\n      await requestJson(`${REST_BASE}/cudlounThreads/${encodeURIComponent(threadId)}/messages/${encodeURIComponent(message.id)}`, {\n        method: \"DELETE\",\n      });\n      if (status) status.textContent = \"Deleted.\";\n      await loadMessages({ threadId }, wrap);\n      window.setTimeout(() => {\n        if (status?.textContent === \"Deleted.\") status.textContent = \"\";\n      }, 1800);\n    } catch (error) {\n      root.log.warn(\"feedback\", \"delete failed\", threadId, message.id, error);\n      if (status) status.textContent = \"Delete failed.\";\n      if (button) button.disabled = false;\n    }\n  }\n\n  function canDeleteMessage(message) {\n    const current = normalizedAuthor(detectAuthor());\n    if (!current) return false;\n    return ADMIN_AUTHORS.has(current) || current === normalizedAuthor(message.author);\n  }\n\n  function parentFields(form) {\n    const parentId = String(form?.dataset?.parentId || \"\").trim();\n    if (!parentId) return { parentId: \"\", firestoreFields: {} };\n    const parentAuthor = cleanAuthor(form.dataset.parentAuthor || \"Unknown\");\n    const parentExcerpt = excerpt(form.dataset.parentExcerpt || \"\");\n    return {\n      parentId,\n      firestoreFields: {\n        parentId: { stringValue: parentId },\n        parentAuthor: { stringValue: parentAuthor },\n        parentExcerpt: { stringValue: parentExcerpt },\n      },\n    };\n  }\n\n  async function requestJson(url, options) {\n    const response = await fetch(url, options || {});\n    if (!response.ok) {\n      throw new Error(`HTTP ${response.status}`);\n    }\n    if (response.status === 204) return {};\n    const text = await response.text();\n    if (!text) return {};\n    return JSON.parse(text);\n  }\n\n  function documentToMessage(doc) {\n    if (!doc || !doc.fields) return null;\n    return {\n      id: String(doc.name || \"\").split(\"/\").pop(),\n      author: fieldValue(doc.fields.author) || \"Unknown\",\n      text: fieldValue(doc.fields.text) || \"\",\n      ts: Number(fieldValue(doc.fields.ts) || 0),\n      route: fieldValue(doc.fields.route) || \"\",\n      cudlounVersion: fieldValue(doc.fields.cudlounVersion) || \"\",\n      userAgentHint: fieldValue(doc.fields.userAgentHint) || \"\",\n      parentId: fieldValue(doc.fields.parentId) || \"\",\n      parentAuthor: fieldValue(doc.fields.parentAuthor) || \"\",\n      parentExcerpt: fieldValue(doc.fields.parentExcerpt) || \"\",\n    };\n  }\n\n  function fieldValue(field) {\n    if (!field || typeof field !== \"object\") return null;\n    if (Object.prototype.hasOwnProperty.call(field, \"stringValue\")) return field.stringValue;\n    if (Object.prototype.hasOwnProperty.call(field, \"integerValue\")) return field.integerValue;\n    if (Object.prototype.hasOwnProperty.call(field, \"timestampValue\")) return field.timestampValue;\n    if (Object.prototype.hasOwnProperty.call(field, \"booleanValue\")) return field.booleanValue;\n    return null;\n  }\n\n  function normalizeTarget(target) {\n    const kind = String(target?.kind || \"framework\").toLowerCase();\n    const id = String(target?.id || \"cudloun\").toLowerCase();\n    return {\n      kind,\n      id,\n      name: target?.name || id,\n      threadId: target?.threadId || threadId(kind, id),\n    };\n  }\n\n  function threadId(kind, id) {\n    const safeKind = String(kind || \"framework\").toLowerCase().replace(/[^a-z0-9-]/g, \"-\");\n    const safeId = String(id || \"cudloun\").toLowerCase().replace(/[^a-z0-9-]/g, \"-\");\n    return `${safeKind}_${safeId}`;\n  }\n\n  function detectAuthor() {\n    const fromKapyguts = root.kapyguts && typeof root.kapyguts.currentUser === \"function\"\n      ? root.kapyguts.currentUser()\n      : \"\";\n    if (validAuthor(fromKapyguts)) return cleanAuthor(fromKapyguts);\n\n    return \"Unknown\";\n  }\n\n  function cleanAuthor(value) {\n    const text = String(value || \"\").replace(/\\s+/g, \" \").trim().slice(0, 40);\n    return text || \"Unknown\";\n  }\n\n  function initialAuthor() {\n    const stored = root.storage.get(\"feedback.author\", \"\");\n    if (validAuthor(stored)) return cleanAuthor(stored);\n    return detectAuthor();\n  }\n\n  function validAuthor(value) {\n    const text = String(value || \"\").replace(/\\s+/g, \" \").trim();\n    if (!text || text.length > 40) return false;\n    return !/^(unknown|menu|close|search|hledat v klubu|nastaveni|nastavení|barevne schema|barevné schéma|odhlasit|odhlásit|okoun|domů|vzkazník|oblíbené)$/i.test(text);\n  }\n\n  function normalizedAuthor(value) {\n    return String(value || \"\")\n      .normalize(\"NFD\")\n      .replace(/[\\u0300-\\u036f]/g, \"\")\n      .replace(/\\s+/g, \" \")\n      .trim()\n      .toLowerCase();\n  }\n\n  function userAgentHint() {\n    const coarse = window.matchMedia && window.matchMedia(\"(pointer: coarse)\").matches;\n    return `${coarse ? \"mobile\" : \"desktop\"} ${window.innerWidth}x${window.innerHeight}`;\n  }\n\n  function excerpt(value) {\n    return String(value || \"\").replace(/\\s+/g, \" \").trim().slice(0, 120);\n  }\n\n  function formatTime(ts) {\n    const date = new Date(Number(ts) || Date.now());\n    return date.toLocaleString(\"cs-CZ\", {\n      day: \"2-digit\",\n      month: \"2-digit\",\n      hour: \"2-digit\",\n      minute: \"2-digit\",\n    });\n  }\n})();\n");
  embeddedScripts.set("modules/sys-feedback.js", function () {
    // Cudloun Firestore-backed feedback threads.
    (function () {
      "use strict";

      const root = window.Cudloun;
      const VERSION = "0.3.1";
      const PROJECT_ID = "murkypond-vault-fc61c";
      const REST_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
      const MAX_TEXT_LENGTH = 1200;
      const PAGE_SIZE = 80;
      const ADMIN_AUTHORS = new Set(["blasnik"]);

      root.feedback = {
        version: VERSION,
        projectId: PROJECT_ID,
        renderThread,
        threadId,
        detectAuthor,
      };

      root.log.info("feedback", "ready", VERSION);

      function renderThread(target) {
        const normalized = normalizeTarget(target);
        const wrap = document.createElement("section");
        wrap.className = "cudloun-feedback";
        wrap.dataset.threadId = normalized.threadId;

        const header = document.createElement("div");
        header.className = "cudloun-feedback-head";

        const title = document.createElement("h3");
        title.textContent = "Feedback";

        const refresh = document.createElement("button");
        refresh.type = "button";
        refresh.className = "cudloun-feedback-refresh";
        refresh.textContent = "Refresh";
        refresh.addEventListener("click", () => loadMessages(normalized, wrap));

        header.appendChild(title);
        header.appendChild(refresh);

        const meta = document.createElement("p");
        meta.className = "cudloun-feedback-meta";
        meta.textContent = `${normalized.kind}:${normalized.id}`;

        const messages = document.createElement("div");
        messages.className = "cudloun-feedback-messages";
        messages.textContent = "Loading feedback...";

        const form = document.createElement("form");
        form.className = "cudloun-feedback-form";

        const author = document.createElement("input");
        author.className = "cudloun-feedback-author";
        author.type = "text";
        author.name = "author";
        author.maxLength = 40;
        author.placeholder = "Name";
        author.value = initialAuthor();

        const textarea = document.createElement("textarea");
        textarea.name = "text";
        textarea.maxLength = MAX_TEXT_LENGTH;
        textarea.rows = 3;
        textarea.placeholder = "Idea, bug, or note...";

        const replyBanner = document.createElement("div");
        replyBanner.className = "cudloun-feedback-reply-target";
        replyBanner.hidden = true;

        const replyText = document.createElement("span");

        const cancelReply = document.createElement("button");
        cancelReply.type = "button";
        cancelReply.textContent = "Cancel";
        cancelReply.addEventListener("click", () => clearReplyTarget(form, textarea));

        replyBanner.appendChild(replyText);
        replyBanner.appendChild(cancelReply);

        const actions = document.createElement("div");
        actions.className = "cudloun-feedback-actions";

        const status = document.createElement("span");
        status.className = "cudloun-feedback-status";

        const submit = document.createElement("button");
        submit.type = "submit";
        submit.className = "cudloun-button";
        submit.textContent = "Send";

        actions.appendChild(status);
        actions.appendChild(submit);
        form.appendChild(author);
        form.appendChild(replyBanner);
        form.appendChild(textarea);
        form.appendChild(actions);

        form.addEventListener("submit", (event) => {
          event.preventDefault();
          sendMessage(normalized, author, textarea, submit, status, wrap, form);
        });

        wrap.appendChild(header);
        wrap.appendChild(meta);
        wrap.appendChild(messages);
        wrap.appendChild(form);

        loadMessages(normalized, wrap);
        return wrap;
      }

      async function loadMessages(target, wrap) {
        const box = wrap.querySelector(".cudloun-feedback-messages");
        if (!box) return;

        box.textContent = "Loading feedback...";

        try {
          const url = `${REST_BASE}/cudlounThreads/${encodeURIComponent(target.threadId)}/messages?orderBy=ts%20desc&pageSize=${PAGE_SIZE}`;
          const data = await requestJson(url);
          const messages = (data.documents || []).map(documentToMessage).filter(Boolean).reverse();
          renderMessages(box, messages, wrap);
        } catch (error) {
          root.log.warn("feedback", "ordered load failed", target.threadId, error);
          try {
            const fallbackUrl = `${REST_BASE}/cudlounThreads/${encodeURIComponent(target.threadId)}/messages?pageSize=${PAGE_SIZE}`;
            const data = await requestJson(fallbackUrl);
            const messages = (data.documents || []).map(documentToMessage).filter(Boolean)
              .sort((a, b) => (a.ts || 0) - (b.ts || 0));
            renderMessages(box, messages, wrap);
          } catch (fallbackError) {
            root.log.warn("feedback", "load failed", target.threadId, fallbackError);
            box.textContent = "Feedback could not be loaded.";
          }
        }
      }

      function renderMessages(box, messages, wrap) {
        box.innerHTML = "";

        if (!messages.length) {
          const empty = document.createElement("div");
          empty.className = "cudloun-feedback-empty";
          empty.textContent = "No feedback yet.";
          box.appendChild(empty);
          return;
        }

        const tree = messageTree(messages);
        tree.roots.forEach((message) => {
          box.appendChild(renderMessage(message, tree.children, wrap, 0, new Set()));
        });

        box.scrollTop = box.scrollHeight;
      }

      function renderMessage(message, children, wrap, depth, trail) {
        if (trail.has(message.id)) return document.createTextNode("");
        const nextTrail = new Set(trail);
        nextTrail.add(message.id);

        const item = document.createElement("article");
        item.className = "cudloun-feedback-message";
        item.dataset.messageId = message.id;
        item.dataset.depth = String(Math.min(depth, 3));
        if (message.parentId) item.dataset.reply = "true";

        const head = document.createElement("div");
        head.className = "cudloun-feedback-message-head";

        const author = document.createElement("strong");
        author.textContent = message.author || "Unknown";

        const time = document.createElement("time");
        time.textContent = formatTime(message.ts);

        head.appendChild(author);
        head.appendChild(time);
        item.appendChild(head);

        if (message.parentId) {
          const parent = document.createElement("div");
          parent.className = "cudloun-feedback-parent";
          parent.textContent = message.parentAuthor ? `Reply to ${message.parentAuthor}` : "Reply";
          item.appendChild(parent);
        }

        const text = document.createElement("div");
        text.className = "cudloun-feedback-text";
        renderFeedbackText(text, message.text || "");
        item.appendChild(text);

        const actions = document.createElement("div");
        actions.className = "cudloun-feedback-message-actions";

        const reply = document.createElement("button");
        reply.type = "button";
        reply.textContent = "Reply";
        reply.addEventListener("click", () => setReplyTarget(wrap, message));
        actions.appendChild(reply);

        if (canDeleteMessage(message)) {
          const remove = document.createElement("button");
          remove.type = "button";
          remove.className = "cudloun-feedback-delete";
          remove.textContent = "Delete";
          remove.addEventListener("click", () => deleteMessage(wrap, message, remove));
          actions.appendChild(remove);
        }
        item.appendChild(actions);

        const replies = children.get(message.id) || [];
        if (replies.length) {
          const replyList = document.createElement("div");
          replyList.className = "cudloun-feedback-replies";
          replies.forEach((child) => {
            replyList.appendChild(renderMessage(child, children, wrap, depth + 1, nextTrail));
          });
          item.appendChild(replyList);
        }

        return item;
      }

      function messageTree(messages) {
        const byId = new Map(messages.map((message) => [message.id, message]));
        const children = new Map();
        const roots = [];

        messages.forEach((message) => {
          if (message.parentId && byId.has(message.parentId)) {
            if (!children.has(message.parentId)) children.set(message.parentId, []);
            children.get(message.parentId).push(message);
          } else {
            roots.push(message);
          }
        });

        if (!roots.length && messages.length) roots.push(...messages);

        children.forEach((items) => items.sort((a, b) => (a.ts || 0) - (b.ts || 0)));
        roots.sort((a, b) => (a.ts || 0) - (b.ts || 0));
        return { roots, children };
      }

      function renderFeedbackText(container, value) {
        const text = String(value || "");
        const pattern = /<img\s+[^>]*src\s*=\s*["']([^"']+)["'][^>]*>|(https?:\/\/[^\s<>"']+\.(?:png|jpe?g|gif|webp|avif)(?:\?[^\s<>"']*)?)/gi;
        let cursor = 0;
        let match;

        while ((match = pattern.exec(text))) {
          const rawUrl = match[1] || match[2] || "";
          const url = safeImageUrl(rawUrl);
          if (!url) continue;

          if (match.index > cursor) container.appendChild(document.createTextNode(text.slice(cursor, match.index)));
          container.appendChild(renderImageLink(url));
          cursor = match.index + match[0].length;
        }

        if (cursor < text.length) container.appendChild(document.createTextNode(text.slice(cursor)));
      }

      function safeImageUrl(value) {
        const raw = String(value || "").trim();
        if (!raw || raw.length > 500) return "";

        try {
          const url = new URL(raw, window.location.href);
          if (url.protocol !== "https:" && url.protocol !== "http:") return "";
          if (!/\.(png|jpe?g|gif|webp|avif)$/i.test(url.pathname)) return "";
          return url.href;
        } catch (error) {
          return "";
        }
      }

      function renderImageLink(url) {
        const link = document.createElement("a");
        link.className = "cudloun-feedback-image-link";
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        const img = document.createElement("img");
        img.className = "cudloun-feedback-image";
        img.src = url;
        img.loading = "lazy";
        img.alt = "";

        link.appendChild(img);
        return link;
      }

      function setReplyTarget(wrap, message) {
        const form = wrap.querySelector(".cudloun-feedback-form");
        const textarea = form?.querySelector("textarea");
        const banner = form?.querySelector(".cudloun-feedback-reply-target");
        const label = banner?.querySelector("span");
        if (!form || !textarea || !banner || !label) return;

        form.dataset.parentId = message.id;
        form.dataset.parentAuthor = message.author || "Unknown";
        form.dataset.parentExcerpt = excerpt(message.text);
        label.textContent = `Replying to ${message.author || "Unknown"}: ${excerpt(message.text)}`;
        banner.hidden = false;
        textarea.placeholder = "Reply...";
        textarea.focus();
      }

      function clearReplyTarget(form, textarea) {
        delete form.dataset.parentId;
        delete form.dataset.parentAuthor;
        delete form.dataset.parentExcerpt;
        const banner = form.querySelector(".cudloun-feedback-reply-target");
        if (banner) banner.hidden = true;
        if (textarea) textarea.placeholder = "Idea, bug, or note...";
      }

      async function sendMessage(target, authorInput, textarea, submit, status, wrap, form) {
        const author = cleanAuthor(authorInput.value || detectAuthor());
        const text = String(textarea.value || "").trim();
        const parent = parentFields(form);

        if (!text) {
          status.textContent = "Write something first.";
          return;
        }

        if (text.length > MAX_TEXT_LENGTH) {
          status.textContent = `Max ${MAX_TEXT_LENGTH} chars.`;
          return;
        }

        authorInput.value = author;
        root.storage.set("feedback.author", author);
        submit.disabled = true;
        status.textContent = "Sending...";

        try {
          await requestJson(`${REST_BASE}/cudlounThreads/${encodeURIComponent(target.threadId)}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fields: {
                schemaVersion: { integerValue: parent.parentId ? 2 : 1 },
                author: { stringValue: author },
                text: { stringValue: text },
                ts: { integerValue: String(Date.now()) },
                route: { stringValue: root.currentRoute() },
                cudlounVersion: { stringValue: root.version || "" },
                userAgentHint: { stringValue: userAgentHint() },
                ...parent.firestoreFields,
              },
            }),
          });

          textarea.value = "";
          clearReplyTarget(form, textarea);
          status.textContent = "Sent.";
          await loadMessages(target, wrap);
          window.setTimeout(() => {
            if (status.textContent === "Sent.") status.textContent = "";
          }, 1800);
        } catch (error) {
          root.log.warn("feedback", "send failed", target.threadId, error);
          status.textContent = "Send failed.";
        } finally {
          submit.disabled = false;
        }
      }

      async function deleteMessage(wrap, message, button) {
        const threadId = wrap.dataset.threadId;
        if (!threadId || !message.id || !canDeleteMessage(message)) return;
        if (!window.confirm(`Delete feedback from ${message.author || "Unknown"}?`)) return;

        const status = wrap.querySelector(".cudloun-feedback-status");
        if (button) button.disabled = true;
        if (status) status.textContent = "Deleting...";

        try {
          await requestJson(`${REST_BASE}/cudlounThreads/${encodeURIComponent(threadId)}/messages/${encodeURIComponent(message.id)}`, {
            method: "DELETE",
          });
          if (status) status.textContent = "Deleted.";
          await loadMessages({ threadId }, wrap);
          window.setTimeout(() => {
            if (status?.textContent === "Deleted.") status.textContent = "";
          }, 1800);
        } catch (error) {
          root.log.warn("feedback", "delete failed", threadId, message.id, error);
          if (status) status.textContent = "Delete failed.";
          if (button) button.disabled = false;
        }
      }

      function canDeleteMessage(message) {
        const current = normalizedAuthor(detectAuthor());
        if (!current) return false;
        return ADMIN_AUTHORS.has(current) || current === normalizedAuthor(message.author);
      }

      function parentFields(form) {
        const parentId = String(form?.dataset?.parentId || "").trim();
        if (!parentId) return { parentId: "", firestoreFields: {} };
        const parentAuthor = cleanAuthor(form.dataset.parentAuthor || "Unknown");
        const parentExcerpt = excerpt(form.dataset.parentExcerpt || "");
        return {
          parentId,
          firestoreFields: {
            parentId: { stringValue: parentId },
            parentAuthor: { stringValue: parentAuthor },
            parentExcerpt: { stringValue: parentExcerpt },
          },
        };
      }

      async function requestJson(url, options) {
        const response = await fetch(url, options || {});
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        if (response.status === 204) return {};
        const text = await response.text();
        if (!text) return {};
        return JSON.parse(text);
      }

      function documentToMessage(doc) {
        if (!doc || !doc.fields) return null;
        return {
          id: String(doc.name || "").split("/").pop(),
          author: fieldValue(doc.fields.author) || "Unknown",
          text: fieldValue(doc.fields.text) || "",
          ts: Number(fieldValue(doc.fields.ts) || 0),
          route: fieldValue(doc.fields.route) || "",
          cudlounVersion: fieldValue(doc.fields.cudlounVersion) || "",
          userAgentHint: fieldValue(doc.fields.userAgentHint) || "",
          parentId: fieldValue(doc.fields.parentId) || "",
          parentAuthor: fieldValue(doc.fields.parentAuthor) || "",
          parentExcerpt: fieldValue(doc.fields.parentExcerpt) || "",
        };
      }

      function fieldValue(field) {
        if (!field || typeof field !== "object") return null;
        if (Object.prototype.hasOwnProperty.call(field, "stringValue")) return field.stringValue;
        if (Object.prototype.hasOwnProperty.call(field, "integerValue")) return field.integerValue;
        if (Object.prototype.hasOwnProperty.call(field, "timestampValue")) return field.timestampValue;
        if (Object.prototype.hasOwnProperty.call(field, "booleanValue")) return field.booleanValue;
        return null;
      }

      function normalizeTarget(target) {
        const kind = String(target?.kind || "framework").toLowerCase();
        const id = String(target?.id || "cudloun").toLowerCase();
        return {
          kind,
          id,
          name: target?.name || id,
          threadId: target?.threadId || threadId(kind, id),
        };
      }

      function threadId(kind, id) {
        const safeKind = String(kind || "framework").toLowerCase().replace(/[^a-z0-9-]/g, "-");
        const safeId = String(id || "cudloun").toLowerCase().replace(/[^a-z0-9-]/g, "-");
        return `${safeKind}_${safeId}`;
      }

      function detectAuthor() {
        const fromKapyguts = root.kapyguts && typeof root.kapyguts.currentUser === "function"
          ? root.kapyguts.currentUser()
          : "";
        if (validAuthor(fromKapyguts)) return cleanAuthor(fromKapyguts);

        return "Unknown";
      }

      function cleanAuthor(value) {
        const text = String(value || "").replace(/\s+/g, " ").trim().slice(0, 40);
        return text || "Unknown";
      }

      function initialAuthor() {
        const stored = root.storage.get("feedback.author", "");
        if (validAuthor(stored)) return cleanAuthor(stored);
        return detectAuthor();
      }

      function validAuthor(value) {
        const text = String(value || "").replace(/\s+/g, " ").trim();
        if (!text || text.length > 40) return false;
        return !/^(unknown|menu|close|search|hledat v klubu|nastaveni|nastavení|barevne schema|barevné schéma|odhlasit|odhlásit|okoun|domů|vzkazník|oblíbené)$/i.test(text);
      }

      function normalizedAuthor(value) {
        return String(value || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, " ")
          .trim()
          .toLowerCase();
      }

      function userAgentHint() {
        const coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
        return `${coarse ? "mobile" : "desktop"} ${window.innerWidth}x${window.innerHeight}`;
      }

      function excerpt(value) {
        return String(value || "").replace(/\s+/g, " ").trim().slice(0, 120);
      }

      function formatTime(ts) {
        const date = new Date(Number(ts) || Date.now());
        return date.toLocaleString("cs-CZ", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    })();

  });

  embeddedText.set("modules/sys-menu.js", "// Cudloun Kapybara account menu and hub UI.\n(function () {\n  \"use strict\";\n\n  const root = window.Cudloun;\n  const MENU_ITEM_ATTR = \"data-cudloun-menu-item\";\n  const FULLSCREEN_ITEM_ATTR = \"data-cudloun-fullscreen-menu-item\";\n  const STYLE_ATTR = \"data-cudloun-style\";\n  const BACKDROP_CLASS = \"cudloun-backdrop\";\n  const RESTORE_FULLSCREEN_KEY = \"cudloun.restoreFullscreenAfterRefresh\";\n  const RESTORE_FULLSCREEN_CLASS = \"cudloun-restore-fullscreen\";\n  const HUB_POSITION_KEY = \"cudloun.hubPosition\";\n  const HUB_COLLAPSED_KEY = \"cudloun.hubCollapsed\";\n\n  let observer = null;\n  let observerDebounceTimer = null;\n  let interactionDebounceTimer = null;\n  let routeTimer = null;\n  let lastRoute = root.currentRoute();\n  let hubPosition = null;\n  let hubCollapsed = false;\n  let hubSelectedId = null;\n\n  root.ui = {\n    start,\n    openHub,\n    closeHub,\n    renderHub,\n    refreshMenuItems,\n    injectIntoKapybaraAvatarMenu,\n  };\n\n  function start() {\n    installStyles();\n    maybeShowRestoreFullscreenPrompt();\n    observeAvatarMenu();\n    observeMenuInteractions();\n    observeRouteChanges();\n    injectIntoKapybaraAvatarMenu();\n    root.log.info(\"menu\", \"started\", lastRoute);\n  }\n\n  function observeAvatarMenu() {\n    if (observer) return;\n\n    observer = new MutationObserver((mutations) => {\n      const shouldRecheck = mutations.some((mutation) => mutation.addedNodes.length || mutation.type === \"attributes\");\n      if (!shouldRecheck) return;\n\n      window.clearTimeout(observerDebounceTimer);\n      observerDebounceTimer = window.setTimeout(() => {\n        injectIntoKapybaraAvatarMenu();\n      }, 40);\n    });\n\n    observer.observe(document.documentElement, {\n      childList: true,\n      subtree: true,\n      attributes: true,\n      attributeFilter: [\"class\", \"style\", \"aria-hidden\"],\n    });\n\n    root.log.debug(\"menu\", \"avatar/menu observer attached\");\n  }\n\n  function observeMenuInteractions() {\n    const schedule = (event) => {\n      if (!(event.target instanceof Element)) return;\n      if (!event.target.closest(\"[aria-label='Uživatelské menu'], .user-menu-wrap, .desktop-right, .avatar-shell, .avatar-button\")) return;\n\n      window.clearTimeout(interactionDebounceTimer);\n      interactionDebounceTimer = window.setTimeout(() => {\n        injectIntoKapybaraAvatarMenu();\n      }, 80);\n    };\n\n    document.addEventListener(\"click\", schedule, true);\n    document.addEventListener(\"pointerup\", schedule, true);\n  }\n\n  function observeRouteChanges() {\n    const check = () => {\n      const route = root.currentRoute();\n      if (route !== lastRoute) {\n        lastRoute = route;\n        root.log.info(\"router\", \"route changed\", route);\n        injectIntoKapybaraAvatarMenu();\n      }\n      routeTimer = window.setTimeout(check, 500);\n    };\n\n    routeTimer = window.setTimeout(check, 500);\n  }\n\n  function injectIntoKapybaraAvatarMenu() {\n    if (!root.kapyguts?.isKapybara?.()) return;\n\n    const menu = visibleKapybaraAvatarMenu();\n    if (!menu) {\n      root.log.trace(\"menu\", \"kapybara avatar menu not present\");\n      return;\n    }\n\n    if (menu.querySelector(`[${MENU_ITEM_ATTR}]`)) {\n      root.log.trace(\"menu\", \"kapybara avatar menu items already present\");\n      return;\n    }\n\n    const anchor = kapybaraMenuAnchor(menu);\n    const item = makeKapybaraMenuItem(anchor);\n    item.addEventListener(\"click\", (event) => {\n      event.preventDefault();\n      event.stopPropagation();\n      dismissKapybaraMenu();\n      openHub();\n    });\n\n    if (anchor) {\n      anchor.before(item);\n    } else {\n      menu.appendChild(item);\n    }\n\n    if (showFullscreenControls()) {\n      const controls = makeKapybaraActionRow();\n      item.after(controls);\n    }\n\n    root.log.info(\"menu\", \"kapybara avatar menu items injected\", menuDebug(menu));\n  }\n\n  function visibleKapybaraAvatarMenu() {\n    const candidates = Array.from(document.querySelectorAll([\n      \"[role='dialog']\",\n      \"[role='menu']\",\n      \".bottom-sheet\",\n      \"[class*='sheet']\",\n      \"[class*='drawer']\",\n      \"[class*='menu']\",\n      \"section\",\n      \"nav\",\n      \"aside\",\n      \"div\",\n    ].join(\",\")))\n      .filter(isUsableKapybaraMenuCandidate)\n      .sort((a, b) => {\n        const rectA = a.getBoundingClientRect();\n        const rectB = b.getBoundingClientRect();\n        return (rectA.width * rectA.height) - (rectB.width * rectB.height);\n      });\n\n    if (candidates.length > 1) {\n      root.log.debug(\"menu\", \"candidate kapybara avatar menus\", candidates.slice(0, 8).map(menuDebug));\n    }\n\n    return candidates[0] || null;\n  }\n\n  function isUsableKapybaraMenuCandidate(node) {\n    if (!(node instanceof Element)) return false;\n    if (node.closest(`.${BACKDROP_CLASS}`)) return false;\n    if (node.querySelector(`[${MENU_ITEM_ATTR}]`)) return false;\n\n    const rect = node.getBoundingClientRect();\n    if (rect.width < 160 || rect.height < 120) return false;\n    if (rect.bottom <= 0 || rect.top >= window.innerHeight) return false;\n\n    const style = window.getComputedStyle(node);\n    if (style.display === \"none\" || style.visibility === \"hidden\" || style.opacity === \"0\") return false;\n\n    const text = normalizeMenuText(node.textContent);\n    if (!text.includes(\"Nastavení\") || !text.includes(\"Odhlásit\")) return false;\n    if (text.length > 260) return false;\n\n    return true;\n  }\n\n  function kapybaraMenuAnchor(menu) {\n    const rows = Array.from(menu.querySelectorAll(\"button, a, [role='button'], li, div, span\"))\n      .filter((node) => {\n        if (!(node instanceof Element)) return false;\n        const rect = node.getBoundingClientRect();\n        if (rect.width < 80 || rect.height < 24) return false;\n        if (rect.bottom <= 0 || rect.top >= window.innerHeight) return false;\n        const text = normalizeMenuText(node.textContent);\n        return text === \"Nastavení\" || text === \"Odhlásit se\" || text === \"Odhlásit\";\n      })\n      .sort((a, b) => {\n        const rectA = a.getBoundingClientRect();\n        const rectB = b.getBoundingClientRect();\n        return (rectA.width * rectA.height) - (rectB.width * rectB.height);\n      });\n\n    return rows[0] || null;\n  }\n\n  function makeKapybaraMenuItem(anchor) {\n    const item = document.createElement(\"button\");\n    item.type = \"button\";\n    item.className = `${anchor?.className || \"\"} cudloun-kapybara-menu-item`.trim();\n    item.setAttribute(MENU_ITEM_ATTR, \"true\");\n    item.innerHTML = `${menuIconSvg()}<span>Cudloun<\/span>`;\n    return item;\n  }\n\n  function makeKapybaraActionRow() {\n    const row = document.createElement(\"div\");\n    row.className = \"cudloun-kapybara-action-row\";\n    row.setAttribute(FULLSCREEN_ITEM_ATTR, \"true\");\n    row.appendChild(makeMenuActionButton(\"Full\", fullscreenIconSvg(), (event) => {\n      dismissKapybaraMenu();\n      toggleFullscreen(event);\n    }, \"Fullscreen\"));\n    row.appendChild(makeMenuActionButton(\"Refresh\", refreshPageIconSvg(), (event) => {\n      dismissKapybaraMenu();\n      refreshPage(event);\n    }));\n    return row;\n  }\n\n  function makeMenuActionButton(labelText, iconSvg, handler, ariaLabel = labelText) {\n    const button = document.createElement(\"button\");\n    button.className = \"cudloun-menu-action-button\";\n    button.type = \"button\";\n    button.setAttribute(\"aria-label\", ariaLabel);\n    button.title = ariaLabel;\n    button.innerHTML = `${iconSvg}<span>${labelText}<\/span>`;\n    button.addEventListener(\"click\", handler);\n    return button;\n  }\n\n  async function toggleFullscreen(event) {\n    if (event) {\n      event.preventDefault();\n      event.stopPropagation();\n    }\n\n    dismissKapybaraMenu();\n\n    try {\n      if (document.fullscreenElement) {\n        await document.exitFullscreen();\n        root.log.info(\"fullscreen\", \"exited\");\n        return;\n      }\n\n      await document.documentElement.requestFullscreen();\n      root.log.info(\"fullscreen\", \"entered\");\n    } catch (error) {\n      root.log.warn(\"fullscreen\", \"toggle failed\", error);\n    }\n  }\n\n  function refreshPage(event) {\n    if (event) {\n      event.preventDefault();\n      event.stopPropagation();\n    }\n\n    dismissKapybaraMenu();\n    if (document.fullscreenElement) {\n      root.storage.set(RESTORE_FULLSCREEN_KEY, true);\n    }\n    root.log.info(\"menu\", \"refresh requested\");\n    window.location.reload();\n  }\n\n  function showFullscreenControls() {\n    return root.storage.get(\"module.settoun.showFullscreen\", true) !== false;\n  }\n\n  function refreshMenuItems() {\n    document.querySelectorAll(`[${MENU_ITEM_ATTR}], [${FULLSCREEN_ITEM_ATTR}]`)\n      .forEach((item) => item.remove());\n    injectIntoKapybaraAvatarMenu();\n  }\n\n  function maybeShowRestoreFullscreenPrompt() {\n    if (root.storage.get(RESTORE_FULLSCREEN_KEY, false) !== true) return;\n    root.storage.set(RESTORE_FULLSCREEN_KEY, false);\n    if (document.fullscreenElement) return;\n\n    window.setTimeout(() => {\n      if (document.fullscreenElement || document.querySelector(`.${RESTORE_FULLSCREEN_CLASS}`)) return;\n\n      const prompt = document.createElement(\"div\");\n      prompt.className = RESTORE_FULLSCREEN_CLASS;\n\n      const button = document.createElement(\"button\");\n      button.type = \"button\";\n      button.textContent = \"Restore fullscreen\";\n      button.addEventListener(\"click\", async () => {\n        try {\n          await document.documentElement.requestFullscreen();\n          root.log.info(\"fullscreen\", \"restored after refresh\");\n        } catch (error) {\n          root.log.warn(\"fullscreen\", \"restore failed\", error);\n        } finally {\n          prompt.remove();\n        }\n      });\n\n      const dismiss = document.createElement(\"button\");\n      dismiss.type = \"button\";\n      dismiss.setAttribute(\"aria-label\", \"Dismiss\");\n      dismiss.textContent = \"x\";\n      dismiss.addEventListener(\"click\", () => prompt.remove());\n\n      prompt.appendChild(button);\n      prompt.appendChild(dismiss);\n      document.body.appendChild(prompt);\n    }, 600);\n  }\n\n  function menuIconSvg() {\n    return `\n      <svg class=\"MuiSvgIcon-root MuiSvgIcon-fontSizeSmall css-vh810p\"\n           focusable=\"false\"\n           aria-hidden=\"true\"\n           viewBox=\"0 0 24 24\">\n        <path d=\"M12 3c4.97 0 9 3.36 9 7.5 0 2.08-1.02 3.96-2.67 5.32L19 21l-4.63-2.32c-.76.21-1.56.32-2.37.32-4.97 0-9-3.36-9-7.5S7.03 3 12 3m-4 8h2V9H8zm3 0h2V9h-2zm3 0h2V9h-2z\"><\/path>\n      <\/svg>\n    `;\n  }\n\n  function fullscreenIconSvg() {\n    return `\n      <svg class=\"MuiSvgIcon-root MuiSvgIcon-fontSizeSmall css-vh810p\"\n           focusable=\"false\"\n           aria-hidden=\"true\"\n           viewBox=\"0 0 24 24\">\n        <path d=\"M5 5h6v2H7v4H5zm8 0h6v6h-2V7h-4zm4 8h2v6h-6v-2h4zm-12 0h2v4h4v2H5z\"><\/path>\n      <\/svg>\n    `;\n  }\n\n  function refreshPageIconSvg() {\n    return `\n      <svg class=\"MuiSvgIcon-root MuiSvgIcon-fontSizeSmall css-vh810p\"\n           focusable=\"false\"\n           aria-hidden=\"true\"\n           viewBox=\"0 0 24 24\">\n        <path d=\"M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.45 5.05h-2.13A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h8V3z\"><\/path>\n      <\/svg>\n    `;\n  }\n\n  function menuDebug(menu) {\n    const rect = menu.getBoundingClientRect();\n    return {\n      text: menu.textContent.trim().replace(/\\s+/g, \" \").slice(0, 120),\n      width: Math.round(rect.width),\n      height: Math.round(rect.height),\n      className: menu.className,\n    };\n  }\n\n  function openHub(eventOrModuleId) {\n    let selectedModuleId = null;\n    if (typeof eventOrModuleId === \"string\") {\n      selectedModuleId = eventOrModuleId;\n    } else if (eventOrModuleId) {\n      eventOrModuleId.preventDefault();\n      eventOrModuleId.stopPropagation();\n      dismissKapybaraMenu();\n    }\n\n    document.querySelector(`.${BACKDROP_CLASS}`)?.remove();\n    hubPosition = validHubPosition(root.storage.get(HUB_POSITION_KEY, null));\n    hubCollapsed = root.storage.get(HUB_COLLAPSED_KEY, false) === true;\n\n    const backdrop = document.createElement(\"div\");\n    backdrop.className = BACKDROP_CLASS;\n    backdrop.addEventListener(\"click\", (clickEvent) => {\n      if (clickEvent.target === backdrop) closeHub();\n    });\n\n    document.body.appendChild(backdrop);\n    root.log.info(\"hub\", \"opened\");\n    renderHub(selectedModuleId);\n  }\n\n  function closeHub() {\n    document.querySelector(`.${BACKDROP_CLASS}`)?.remove();\n    root.log.info(\"hub\", \"closed\");\n  }\n\n  function dismissKapybaraMenu() {\n    document.dispatchEvent(new KeyboardEvent(\"keydown\", {\n      key: \"Escape\",\n      code: \"Escape\",\n      keyCode: 27,\n      which: 27,\n      bubbles: true,\n      cancelable: true,\n    }));\n  }\n\n  function normalizeMenuText(text) {\n    return String(text || \"\").replace(/\\s+/g, \" \").trim();\n  }\n\n  function renderHub(selectedId) {\n    const backdrop = document.querySelector(`.${BACKDROP_CLASS}`);\n    if (!backdrop) return;\n\n    const selectedModule = root.modules.find((module) => module.id === selectedId) || root.modules[0];\n    const mode = selectedId === \"debug\" ? \"debug\" : \"module\";\n    hubSelectedId = mode === \"debug\" ? \"debug\" : selectedModule?.id;\n    backdrop.innerHTML = \"\";\n\n    const dialog = document.createElement(\"section\");\n    dialog.className = \"cudloun-dialog\";\n    if (hubCollapsed) dialog.dataset.collapsed = \"true\";\n    dialog.setAttribute(\"role\", \"dialog\");\n    dialog.setAttribute(\"aria-modal\", \"true\");\n    dialog.setAttribute(\"aria-labelledby\", \"cudloun-title\");\n    dialog.appendChild(renderMascot());\n    dialog.appendChild(renderHeader());\n    if (!hubCollapsed) dialog.appendChild(renderBody(mode, selectedModule));\n    backdrop.appendChild(dialog);\n    applyHubPosition(dialog);\n  }\n\n  function renderMascot() {\n    const mascot = document.createElement(\"img\");\n    mascot.className = \"cudloun-mascot\";\n    mascot.alt = \"\";\n    mascot.decoding = \"async\";\n    mascot.loading = \"lazy\";\n    mascot.src = `${root.repoUrl}cudloun.png`;\n    return mascot;\n  }\n\n  function renderHeader() {\n    const header = document.createElement(\"div\");\n    header.className = \"cudloun-head\";\n    header.addEventListener(\"pointerdown\", startHubDrag);\n\n    const titleWrap = document.createElement(\"div\");\n    titleWrap.className = \"cudloun-title-wrap\";\n    const title = document.createElement(\"div\");\n    title.id = \"cudloun-title\";\n    title.className = \"cudloun-title\";\n    title.textContent = \"Cudloun\";\n\n    const subtitle = document.createElement(\"div\");\n    subtitle.className = \"cudloun-subtitle\";\n    subtitle.textContent = `Kapybara module hub core ${root.coreVersion} / seed ${root.seedVersion} / manifest ${root.manifestVersion}`;\n\n    titleWrap.appendChild(title);\n    titleWrap.appendChild(subtitle);\n\n    const buttons = document.createElement(\"div\");\n    buttons.className = \"cudloun-head-actions\";\n\n    const collapse = document.createElement(\"button\");\n    collapse.className = \"cudloun-icon-button\";\n    collapse.type = \"button\";\n    collapse.setAttribute(\"aria-label\", hubCollapsed ? \"Expand\" : \"Collapse\");\n    collapse.textContent = hubCollapsed ? \"+\" : \"-\";\n    collapse.addEventListener(\"click\", () => {\n      hubCollapsed = !hubCollapsed;\n      root.storage.set(HUB_COLLAPSED_KEY, hubCollapsed);\n      root.log.info(\"hub\", hubCollapsed ? \"collapsed\" : \"expanded\");\n      renderHub(hubSelectedId);\n    });\n\n    const close = document.createElement(\"button\");\n    close.className = \"cudloun-icon-button\";\n    close.type = \"button\";\n    close.setAttribute(\"aria-label\", \"Close\");\n    close.textContent = \"x\";\n    close.addEventListener(\"click\", closeHub);\n\n    header.appendChild(titleWrap);\n    buttons.appendChild(collapse);\n    buttons.appendChild(close);\n    header.appendChild(buttons);\n    return header;\n  }\n\n  function startHubDrag(event) {\n    if (event.button !== 0) return;\n    if (event.target instanceof Element && event.target.closest(\"button,input,select,a,textarea\")) return;\n\n    const dialog = event.currentTarget.closest(\".cudloun-dialog\");\n    if (!(dialog instanceof HTMLElement)) return;\n\n    const rect = dialog.getBoundingClientRect();\n    const origin = {\n      pointerX: event.clientX,\n      pointerY: event.clientY,\n      left: rect.left,\n      top: rect.top,\n      width: rect.width,\n      height: rect.height,\n    };\n\n    dialog.dataset.dragging = \"true\";\n    event.currentTarget.setPointerCapture?.(event.pointerId);\n    event.preventDefault();\n\n    const onMove = (moveEvent) => {\n      const next = clampHubPosition({\n        left: origin.left + moveEvent.clientX - origin.pointerX,\n        top: origin.top + moveEvent.clientY - origin.pointerY,\n        width: origin.width,\n        height: origin.height,\n      });\n      hubPosition = next;\n      applyHubPosition(dialog);\n    };\n\n    const onEnd = () => {\n      dialog.dataset.dragging = \"false\";\n      if (hubPosition) root.storage.set(HUB_POSITION_KEY, hubPosition);\n      window.removeEventListener(\"pointermove\", onMove);\n      window.removeEventListener(\"pointerup\", onEnd);\n      window.removeEventListener(\"pointercancel\", onEnd);\n    };\n\n    window.addEventListener(\"pointermove\", onMove);\n    window.addEventListener(\"pointerup\", onEnd);\n    window.addEventListener(\"pointercancel\", onEnd);\n  }\n\n  function applyHubPosition(dialog) {\n    if (!hubPosition) {\n      dialog.style.removeProperty(\"--cudloun-hub-left\");\n      dialog.style.removeProperty(\"--cudloun-hub-top\");\n      dialog.dataset.dragged = \"false\";\n      return;\n    }\n\n    const rect = dialog.getBoundingClientRect();\n    const clamped = clampHubPosition({\n      left: hubPosition.left,\n      top: hubPosition.top,\n      width: rect.width || 320,\n      height: rect.height || 72,\n    });\n    hubPosition = clamped;\n    dialog.style.setProperty(\"--cudloun-hub-left\", `${Math.round(clamped.left)}px`);\n    dialog.style.setProperty(\"--cudloun-hub-top\", `${Math.round(clamped.top)}px`);\n    dialog.dataset.dragged = \"true\";\n  }\n\n  function validHubPosition(value) {\n    if (!value || typeof value !== \"object\") return null;\n    if (!Number.isFinite(value.left) || !Number.isFinite(value.top)) return null;\n    return {\n      left: value.left,\n      top: value.top,\n    };\n  }\n\n  function clampHubPosition(position) {\n    const margin = 8;\n    const maxLeft = Math.max(margin, window.innerWidth - position.width - margin);\n    const maxTop = Math.max(margin, window.innerHeight - position.height - margin);\n    return {\n      left: Math.min(Math.max(margin, position.left), maxLeft),\n      top: Math.min(Math.max(margin, position.top), maxTop),\n    };\n  }\n\n  function renderBody(mode, selectedModule) {\n    const body = document.createElement(\"div\");\n    body.className = \"cudloun-body\";\n\n    const list = document.createElement(\"div\");\n    list.className = \"cudloun-module-list\";\n    root.modules.forEach((module) => {\n      list.appendChild(renderModuleListItem(module, mode === \"module\" ? selectedModule?.id : null));\n    });\n    list.appendChild(renderDebugListItem(mode === \"debug\"));\n\n    const details = document.createElement(\"div\");\n    details.className = \"cudloun-module-details\";\n    details.appendChild(mode === \"debug\" ? renderDebugPanel() : renderModuleDetails(selectedModule));\n\n    body.appendChild(list);\n    body.appendChild(details);\n    return body;\n  }\n\n  function renderModuleListItem(module, selectedModuleId) {\n    const row = document.createElement(\"button\");\n    row.className = \"cudloun-module-row\";\n    row.type = \"button\";\n    row.dataset.selected = module.id === selectedModuleId ? \"true\" : \"false\";\n    row.addEventListener(\"click\", () => renderHub(module.id));\n\n    const text = document.createElement(\"span\");\n    text.className = \"cudloun-module-row-text\";\n    text.textContent = module.name;\n\n    const enabled = document.createElement(\"input\");\n    enabled.type = \"checkbox\";\n    enabled.checked = root.storage.isModuleEnabled(module.id);\n    enabled.setAttribute(\"aria-label\", `${module.name} enabled`);\n    enabled.addEventListener(\"click\", (event) => event.stopPropagation());\n    enabled.addEventListener(\"change\", () => {\n      root.storage.setModuleEnabled(module.id, enabled.checked);\n      renderHub(module.id);\n    });\n\n    row.appendChild(text);\n    row.appendChild(enabled);\n    return row;\n  }\n\n  function renderDebugListItem(selected) {\n    const row = document.createElement(\"button\");\n    row.className = \"cudloun-module-row\";\n    row.type = \"button\";\n    row.dataset.selected = selected ? \"true\" : \"false\";\n    row.addEventListener(\"click\", () => renderHub(\"debug\"));\n\n    const text = document.createElement(\"span\");\n    text.className = \"cudloun-module-row-text\";\n    text.textContent = \"Debug\";\n\n    const badge = document.createElement(\"span\");\n    badge.className = \"cudloun-debug-count\";\n    badge.textContent = String(root.log.entries.length);\n\n    row.appendChild(text);\n    row.appendChild(badge);\n    return row;\n  }\n\n  function renderModuleDetails(module) {\n    const panel = document.createElement(\"div\");\n    if (!module) {\n      panel.textContent = \"No modules registered yet.\";\n      return panel;\n    }\n\n    const eyebrow = document.createElement(\"div\");\n    eyebrow.className = \"cudloun-eyebrow\";\n    eyebrow.textContent = `Module ${module.version}`;\n\n    const title = document.createElement(\"h2\");\n    title.className = \"cudloun-module-title\";\n    title.textContent = module.name;\n\n    const description = document.createElement(\"p\");\n    description.className = \"cudloun-module-copy\";\n    description.textContent = module.description || \"\";\n\n    const enabled = document.createElement(\"label\");\n    enabled.className = \"cudloun-toggle\";\n    const checkbox = document.createElement(\"input\");\n    checkbox.type = \"checkbox\";\n    checkbox.checked = root.storage.isModuleEnabled(module.id);\n    checkbox.addEventListener(\"change\", () => {\n      root.storage.setModuleEnabled(module.id, checkbox.checked);\n      renderHub(module.id);\n    });\n    enabled.appendChild(checkbox);\n    enabled.appendChild(document.createTextNode(\"Enabled\"));\n\n    const actions = document.createElement(\"div\");\n    actions.className = \"cudloun-actions\";\n\n    if (module.actionLabel && typeof module.action === \"function\") {\n      const action = document.createElement(\"button\");\n      action.className = \"cudloun-button\";\n      action.type = \"button\";\n      action.disabled = !root.storage.isModuleEnabled(module.id);\n      action.textContent = module.actionLabel;\n      action.addEventListener(\"click\", () => {\n        root.log.info(\"module\", \"action\", module.id, module.actionLabel);\n        module.action(root.makeModuleContext(module));\n      });\n      actions.appendChild(action);\n    }\n\n    const help = document.createElement(\"div\");\n    help.className = \"cudloun-help\";\n    const helpTitle = document.createElement(\"h3\");\n    helpTitle.textContent = \"Help\";\n    help.appendChild(helpTitle);\n\n    const helpLines = typeof module.renderHelp === \"function\" ? module.renderHelp(root.makeModuleContext(module)) : [];\n    if (helpLines.length) {\n      helpLines.forEach((line) => {\n        const paragraph = document.createElement(\"p\");\n        paragraph.textContent = line;\n        help.appendChild(paragraph);\n      });\n    } else {\n      const paragraph = document.createElement(\"p\");\n      paragraph.textContent = \"This module has no help page yet.\";\n      help.appendChild(paragraph);\n    }\n\n    panel.appendChild(eyebrow);\n    panel.appendChild(title);\n    panel.appendChild(description);\n    panel.appendChild(enabled);\n    panel.appendChild(actions);\n\n    if (typeof module.renderSettings === \"function\") {\n      const custom = module.renderSettings(root.makeModuleContext(module));\n      if (custom) {\n        panel.appendChild(custom);\n      }\n    }\n\n    if (root.feedback && typeof root.feedback.renderThread === \"function\") {\n      panel.appendChild(root.feedback.renderThread({\n        kind: \"module\",\n        id: module.id,\n        name: module.name,\n      }));\n    }\n\n    panel.appendChild(help);\n    return panel;\n  }\n\n  function renderDebugPanel() {\n    const panel = document.createElement(\"div\");\n\n    const eyebrow = document.createElement(\"div\");\n    eyebrow.className = \"cudloun-eyebrow\";\n    eyebrow.textContent = `Route ${root.currentRoute()}`;\n\n    const title = document.createElement(\"h2\");\n    title.className = \"cudloun-module-title\";\n    title.textContent = \"Debug\";\n\n    const controls = document.createElement(\"div\");\n    controls.className = \"cudloun-actions\";\n\n    const select = document.createElement(\"select\");\n    select.className = \"cudloun-select\";\n    root.logger.levels.forEach((level) => {\n      const option = document.createElement(\"option\");\n      option.value = level;\n      option.textContent = level;\n      option.selected = root.log.level() === level;\n      select.appendChild(option);\n    });\n    select.addEventListener(\"change\", () => root.logger.setLevel(select.value));\n\n    const clear = document.createElement(\"button\");\n    clear.className = \"cudloun-button cudloun-button-secondary\";\n    clear.type = \"button\";\n    clear.textContent = \"Clear\";\n    clear.addEventListener(\"click\", () => {\n      root.logger.clear();\n      renderHub(\"debug\");\n    });\n\n    const copy = document.createElement(\"button\");\n    copy.className = \"cudloun-button cudloun-button-secondary\";\n    copy.type = \"button\";\n    copy.textContent = \"Copy log\";\n    copy.addEventListener(\"click\", () => {\n      copyText(debugLogText()).then(() => {\n        root.log.info(\"debug\", \"log copied\");\n        renderHub(\"debug\");\n      }).catch((error) => root.log.warn(\"debug\", \"copy failed\", error));\n    });\n\n    const exportLog = document.createElement(\"button\");\n    exportLog.className = \"cudloun-button cudloun-button-secondary\";\n    exportLog.type = \"button\";\n    exportLog.textContent = \"Export log\";\n    exportLog.addEventListener(\"click\", () => {\n      exportTextFile(`cudloun-debug-${new Date().toISOString().replace(/[:.]/g, \"-\")}.txt`, debugLogText());\n      root.log.info(\"debug\", \"log export prepared\");\n      renderHub(\"debug\");\n    });\n\n    controls.appendChild(select);\n    controls.appendChild(copy);\n    controls.appendChild(exportLog);\n    controls.appendChild(clear);\n\n    const meta = document.createElement(\"div\");\n    meta.className = \"cudloun-debug-meta\";\n    meta.textContent = [\n      `Seed: ${root.seedVersion}`,\n      `Core: ${root.coreVersion}`,\n      `Manifest: ${root.manifestVersion}`,\n      `Loaded files: ${root.loadedFiles.map((file) => file.id).join(\", \") || \"none\"}`,\n    ].join(\" | \");\n\n    const logBox = document.createElement(\"div\");\n    logBox.className = \"cudloun-log-box\";\n    root.logger.recent(160).forEach((entry) => logBox.appendChild(renderLogEntry(entry)));\n\n    panel.appendChild(eyebrow);\n    panel.appendChild(title);\n    panel.appendChild(controls);\n    panel.appendChild(meta);\n    panel.appendChild(logBox);\n    return panel;\n  }\n\n  function renderLogEntry(entry) {\n    const row = document.createElement(\"div\");\n    row.className = \"cudloun-log-entry\";\n    row.dataset.level = entry.level;\n\n    const time = entry.time.slice(11, 19);\n    const args = entry.args.map((arg) => {\n      if (arg instanceof Error) return arg.message;\n      if (typeof arg === \"string\") return arg;\n      try {\n        return JSON.stringify(arg);\n      } catch (error) {\n        return String(arg);\n      }\n    }).join(\" \");\n\n    row.textContent = `${time} [${entry.level}] ${entry.area}: ${args}`;\n    return row;\n  }\n\n  function debugLogText() {\n    return root.logger.recent(500).map((entry) => {\n      const args = entry.args.map((arg) => {\n        if (arg instanceof Error) return arg.message;\n        if (typeof arg === \"string\") return arg;\n        try {\n          return JSON.stringify(arg);\n        } catch (error) {\n          return String(arg);\n        }\n      }).join(\" \");\n\n      return `${entry.time} [${entry.level}] ${entry.area}: ${args}`;\n    }).join(\"\\n\");\n  }\n\n  async function copyText(text) {\n    if (!navigator.clipboard || !navigator.clipboard.writeText) {\n      throw new Error(\"Clipboard API is not available\");\n    }\n    await navigator.clipboard.writeText(text);\n  }\n\n  function exportTextFile(filename, text) {\n    const blob = new Blob([text], { type: \"text/plain;charset=utf-8\" });\n    const url = URL.createObjectURL(blob);\n    const link = document.createElement(\"a\");\n    link.href = url;\n    link.download = filename;\n    document.body.appendChild(link);\n    link.click();\n    link.remove();\n    window.setTimeout(() => URL.revokeObjectURL(url), 1000);\n  }\n\n  function installStyles() {\n    if (document.head.querySelector(`[${STYLE_ATTR}]`)) return;\n\n    const style = document.createElement(\"style\");\n    style.setAttribute(STYLE_ATTR, \"true\");\n    style.textContent = `\n      .cudloun-backdrop{position:fixed;inset:0;z-index:1600;display:flex;align-items:center;justify-content:center;padding:42px 20px 20px;background:rgba(26,32,44,.34);backdrop-filter:blur(2px);box-sizing:border-box}\n      .cudloun-dialog{position:relative;box-sizing:border-box;width:min(860px,calc(100vw - 28px));max-height:min(760px,calc(100vh - 62px));display:flex;flex-direction:column;overflow:visible;border:1px solid rgba(79,102,134,.34);border-radius:8px;background:#f6f8fb;box-shadow:0 18px 48px rgba(18,27,43,.24);color:#182230;font-family:inherit}\n      .cudloun-dialog[data-dragged=true]{position:fixed;left:var(--cudloun-hub-left);top:var(--cudloun-hub-top);margin:0}\n      .cudloun-dialog[data-collapsed=true]{width:min(430px,calc(100vw - 16px));overflow:hidden}\n      .cudloun-mascot{position:absolute;left:-73px;top:0;width:100px;max-width:26vw;height:auto;transform:translateY(-48%);pointer-events:none;filter:drop-shadow(0 6px 5px rgba(18,27,43,.25));z-index:2}\n      .cudloun-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 20px 14px;border-top-left-radius:8px;border-top-right-radius:8px;border-bottom:1px solid rgba(79,102,134,.2);background:#fff;cursor:grab;touch-action:none;user-select:none}\n      .cudloun-dialog[data-dragging=true] .cudloun-head{cursor:grabbing}\n      .cudloun-title-wrap{min-width:0}\n      .cudloun-title{font-size:1.15rem;font-weight:750;letter-spacing:0}\n      .cudloun-subtitle,.cudloun-eyebrow{margin-top:3px;color:#697586;font-size:.78rem;letter-spacing:0}\n      .cudloun-head-actions{display:flex;align-items:center;gap:8px;flex:0 0 auto}\n      .cudloun-icon-button{appearance:none;width:32px;height:32px;border:1px solid rgba(79,102,134,.2);border-radius:6px;background:#fff;color:#4b5565;cursor:pointer;font:700 1rem/1 inherit;flex:0 0 auto}\n      .cudloun-icon-button:hover{background:#eef2f7}\n      .cudloun-menu-action-button{appearance:none;min-width:0;flex:1 1 0;display:inline-flex;align-items:center;justify-content:center;gap:5px;border:1px solid rgba(79,102,134,.24);border-radius:6px;background:#f8fafc;color:#243041;cursor:pointer;font:600 .8rem/1.2 inherit;padding:7px 5px}\n      .cudloun-menu-action-button:hover{background:#eef2f7}\n      .cudloun-menu-action-button svg{width:18px;height:18px;flex:0 0 auto;fill:currentColor}\n      .cudloun-menu-action-button span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n      .cudloun-kapybara-menu-item{appearance:none;width:100%;min-height:56px;display:flex;align-items:center;gap:24px;margin:0;padding:12px 40px;border:0;background:transparent;color:inherit;cursor:pointer;font:inherit;text-align:left}\n      .cudloun-kapybara-menu-item:hover{background:rgba(128,128,128,.08)}\n      .cudloun-kapybara-menu-item svg{width:24px;height:24px;flex:0 0 auto;fill:#b06a00;color:#b06a00}\n      .cudloun-kapybara-menu-item span{font-size:1rem;line-height:1.35}\n      .cudloun-kapybara-action-row{display:flex;align-items:center;gap:8px;padding:4px 40px 12px}\n      .desktop-menu .cudloun-kapybara-menu-item{min-height:36px;gap:10px;padding:0 16px}\n      .desktop-menu .cudloun-kapybara-menu-item svg{width:20px;height:20px}\n      .desktop-menu .cudloun-kapybara-menu-item span{font-size:.95rem}\n      .desktop-menu .cudloun-kapybara-action-row{padding:4px 8px 8px}\n      .cudloun-restore-fullscreen{position:fixed;left:50%;top:14px;z-index:1900;display:flex;align-items:center;gap:8px;transform:translateX(-50%);padding:8px;border:1px solid rgba(79,102,134,.28);border-radius:8px;background:#fff;box-shadow:0 10px 28px rgba(18,27,43,.22);font-family:inherit}\n      .cudloun-restore-fullscreen button{appearance:none;border:1px solid rgba(79,102,134,.24);border-radius:6px;background:#f8fafc;color:#243041;cursor:pointer;font:700 .86rem/1.2 inherit;padding:8px 10px}\n      .cudloun-restore-fullscreen button:hover{background:#eef2f7}\n      .cudloun-body{min-height:390px;display:grid;grid-template-columns:minmax(190px,250px) 1fr;overflow:hidden}\n      .cudloun-module-list{overflow:auto;padding:12px;border-right:1px solid rgba(79,102,134,.18);background:#edf2f7}\n      .cudloun-module-row{appearance:none;width:100%;min-height:42px;display:grid;grid-template-columns:1fr auto;align-items:center;gap:10px;margin:0 0 8px;padding:9px 10px;border:1px solid transparent;border-radius:6px;background:transparent;color:#243041;cursor:pointer;font:inherit;text-align:left}\n      .cudloun-module-row[data-selected=true],.cudloun-module-row:hover{border-color:rgba(76,111,166,.24);background:#fff}\n      .cudloun-module-row-text{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:650}\n      .cudloun-debug-count{min-width:22px;padding:2px 6px;border-radius:999px;background:#d8e2ef;color:#364152;text-align:center;font-size:.76rem;font-weight:700}\n      .cudloun-module-details{overflow:auto;padding:22px;background:#f8fafc}\n      .cudloun-module-title{margin:8px 0;color:#182230;font-size:1.35rem;line-height:1.2;letter-spacing:0}\n      .cudloun-module-copy{max-width:58ch;margin:0 0 16px;color:#4b5565;line-height:1.5}\n      .cudloun-toggle{display:inline-flex;align-items:center;gap:8px;margin:0 0 18px;color:#364152;font-weight:650}\n      .cudloun-actions{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 18px;align-items:center}\n      .cudloun-button{appearance:none;border:1px solid rgba(8,126,164,.34);border-radius:6px;padding:9px 13px;background:#087ea4;color:#fff;cursor:pointer;font:700 .92rem/1.2 inherit}\n      .cudloun-button:hover{background:#096f91}\n      .cudloun-button:disabled{opacity:.48;cursor:default}\n      .cudloun-button-secondary{background:#4b5565;border-color:rgba(75,85,101,.34)}\n      .cudloun-button-secondary:hover{background:#364152}\n      .cudloun-select{min-height:36px;border:1px solid rgba(79,102,134,.32);border-radius:6px;background:#fff;color:#182230;padding:0 10px;font:inherit}\n      .cudloun-help{max-width:62ch;padding-top:14px;border-top:1px solid rgba(79,102,134,.18);color:#4b5565}\n      .cudloun-help h3{margin:0 0 8px;color:#243041;font-size:.95rem;letter-spacing:0}\n      .cudloun-help p{margin:0 0 8px;line-height:1.45}\n      .cudloun-container-list{max-width:680px;margin:0 0 18px;display:flex;flex-direction:column;gap:10px}\n      .cudloun-container-card{border:1px solid rgba(79,102,134,.22);border-radius:8px;background:#fff;padding:12px}\n      .cudloun-container-card h3{margin:0 0 6px;color:#243041;font-size:1rem;letter-spacing:0}\n      .cudloun-container-card p{margin:0 0 10px;color:#4b5565;line-height:1.4}\n      .cudloun-container-actions{display:flex;flex-wrap:wrap;gap:8px}\n      .cudloun-feedback{box-sizing:border-box;width:100%;max-width:680px;min-width:0;margin:18px 0 18px;padding:12px;border:1px solid rgba(79,102,134,.22);border-radius:8px;background:#fff;overflow:hidden}\n      .cudloun-feedback-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 4px}\n      .cudloun-feedback h3{margin:0;color:#243041;font-size:1rem;letter-spacing:0}\n      .cudloun-feedback-meta{margin:0 0 10px;color:#697586;font-size:.78rem;line-height:1.3}\n      .cudloun-feedback-refresh{appearance:none;border:1px solid rgba(79,102,134,.24);border-radius:6px;background:#f8fafc;color:#243041;cursor:pointer;font:700 .78rem/1.2 inherit;padding:6px 8px}\n      .cudloun-feedback-refresh:hover{background:#eef2f7}\n      .cudloun-feedback-messages{box-sizing:border-box;max-width:100%;max-height:260px;overflow:auto;margin:0 0 12px;border:1px solid rgba(79,102,134,.16);border-radius:6px;background:#f8fafc}\n      .cudloun-feedback-empty{padding:12px;color:#697586}\n      .cudloun-feedback-message{box-sizing:border-box;min-width:0;padding:10px 12px;border-bottom:1px solid rgba(79,102,134,.13);background:#fff}\n      .cudloun-feedback-message:last-child{border-bottom:0}\n      .cudloun-feedback-message[data-reply=true]{border-left:3px solid rgba(8,126,164,.28)}\n      .cudloun-feedback-message[data-depth=\"1\"]{margin-left:12px}\n      .cudloun-feedback-message[data-depth=\"2\"]{margin-left:24px}\n      .cudloun-feedback-message[data-depth=\"3\"]{margin-left:36px}\n      .cudloun-feedback-message-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin:0 0 5px}\n      .cudloun-feedback-message-head strong{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#243041;font-size:.88rem}\n      .cudloun-feedback-message-head time{flex:0 0 auto;color:#697586;font-size:.74rem}\n      .cudloun-feedback-parent{margin:0 0 5px;color:#697586;font-size:.76rem;line-height:1.25;overflow-wrap:anywhere}\n      .cudloun-feedback-text{min-width:0;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;color:#364152;line-height:1.42}\n      .cudloun-feedback-image-link{display:block;width:max-content;max-width:100%;margin:8px 0 2px}\n      .cudloun-feedback-image{display:block;max-width:100%;max-height:280px;border-radius:6px;border:1px solid rgba(79,102,134,.18);object-fit:contain;background:#f8fafc}\n      .cudloun-feedback-message-actions{display:flex;justify-content:flex-end;margin:7px 0 0}\n      .cudloun-feedback-message-actions button,.cudloun-feedback-reply-target button{appearance:none;border:1px solid rgba(79,102,134,.22);border-radius:6px;background:#f8fafc;color:#243041;cursor:pointer;font:700 .74rem/1.2 inherit;padding:5px 7px}\n      .cudloun-feedback-message-actions button:hover,.cudloun-feedback-reply-target button:hover{background:#eef2f7}\n      .cudloun-feedback-message-actions button:disabled{opacity:.55;cursor:default}\n      .cudloun-feedback-message-actions .cudloun-feedback-delete{border-color:rgba(180,35,24,.22);background:#fff5f4;color:#b42318}\n      .cudloun-feedback-message-actions .cudloun-feedback-delete:hover{background:#ffe7e5}\n      .cudloun-feedback-replies{margin:8px 0 0}\n      .cudloun-feedback-form{display:grid;min-width:0;max-width:100%;gap:8px}\n      .cudloun-feedback-reply-target{box-sizing:border-box;display:flex;align-items:flex-start;justify-content:space-between;gap:8px;min-width:0;max-width:100%;min-height:32px;padding:7px 8px;border:1px solid rgba(8,126,164,.22);border-radius:6px;background:#eef8fb;color:#364152;font-size:.8rem;overflow:hidden}\n      .cudloun-feedback-reply-target[hidden]{display:none}\n      .cudloun-feedback-reply-target span{min-width:0;overflow-wrap:anywhere;line-height:1.3}\n      .cudloun-feedback-author,.cudloun-feedback textarea{box-sizing:border-box;width:100%;border:1px solid rgba(79,102,134,.28);border-radius:6px;background:#fff;color:#182230;font:inherit}\n      .cudloun-feedback-author{min-height:36px;padding:0 10px}\n      .cudloun-feedback textarea{display:block;max-width:100%;min-height:82px;resize:vertical;padding:9px 10px;line-height:1.38}\n      .cudloun-feedback-actions{display:flex;align-items:center;justify-content:space-between;gap:10px}\n      .cudloun-feedback-status{min-width:0;color:#697586;font-size:.82rem}\n      .cudloun-settings-list{max-width:520px;margin:0 0 18px}\n      .cudloun-setting-row{display:flex;align-items:center;justify-content:space-between;gap:14px;min-height:44px;padding:10px 12px;border:1px solid rgba(79,102,134,.22);border-radius:8px;background:#fff;color:#243041;font-weight:650}\n      .cudloun-setting-text{min-width:0}\n      .cudloun-code-box{max-width:680px;margin:8px 0 16px;padding:10px;border:1px solid rgba(79,102,134,.2);border-radius:6px;background:#101828;color:#e4e7ec;font:12px/1.45 Consolas,monospace;white-space:pre-wrap;word-break:break-word}\n      .cudloun-debug-meta{margin:0 0 12px;color:#697586;font-size:.82rem;line-height:1.35}\n      .cudloun-log-box{max-height:430px;overflow:auto;border:1px solid rgba(79,102,134,.2);border-radius:6px;background:#101828;color:#e4e7ec;font:12px/1.45 Consolas,monospace}\n      .cudloun-log-entry{padding:5px 8px;border-bottom:1px solid rgba(255,255,255,.07);white-space:pre-wrap;word-break:break-word}\n      .cudloun-log-entry[data-level=error]{color:#ffb4b4}\n      .cudloun-log-entry[data-level=warn]{color:#ffd18a}\n      .cudloun-log-entry[data-level=debug]{color:#9fd0ff}\n      .cudloun-log-entry[data-level=trace]{color:#d8c4ff}\n      @media (max-width:680px){.cudloun-backdrop{align-items:center;justify-content:center;padding:8px;background:rgba(26,32,44,.25)}.cudloun-dialog{width:calc(100vw - 16px);height:auto;max-height:calc(100dvh - 16px);border-radius:10px;overflow:hidden}.cudloun-dialog[data-collapsed=true]{width:min(390px,calc(100vw - 16px))}.cudloun-mascot{left:-36px;top:10px;width:58px;max-width:18vw;transform:none;opacity:.95}.cudloun-head{position:sticky;top:0;z-index:3;gap:10px;padding:12px 12px 10px 42px}.cudloun-title{font-size:1rem}.cudloun-subtitle{font-size:.68rem;line-height:1.25}.cudloun-body{min-height:0;max-height:calc(100dvh - 84px);display:flex;flex-direction:column;overflow:hidden}.cudloun-module-list{display:flex;gap:8px;min-height:56px;max-height:96px;overflow-x:auto;overflow-y:hidden;padding:8px;border-right:0;border-bottom:1px solid rgba(79,102,134,.18)}.cudloun-module-row{flex:0 0 auto;width:auto;min-width:118px;min-height:40px;margin:0;padding:8px 9px;background:#f8fafc;border-color:rgba(79,102,134,.16)}.cudloun-module-row-text{font-size:.84rem}.cudloun-module-details{flex:1;min-height:0;overflow:auto;padding:16px 12px 24px}.cudloun-module-title{font-size:1.18rem}.cudloun-container-card{padding:10px}.cudloun-container-actions{gap:7px}.cudloun-feedback{margin:14px 0;padding:10px}.cudloun-feedback-messages{max-height:220px}.cudloun-button{padding:8px 10px;font-size:.84rem}.cudloun-code-box{font-size:11px}.cudloun-log-box{max-height:52vh;font-size:11px}}\n    `;\n    document.head.appendChild(style);\n  }\n})();\n");
  embeddedScripts.set("modules/sys-menu.js", function () {
    // Cudloun Kapybara account menu and hub UI.
    (function () {
      "use strict";

      const root = window.Cudloun;
      const MENU_ITEM_ATTR = "data-cudloun-menu-item";
      const FULLSCREEN_ITEM_ATTR = "data-cudloun-fullscreen-menu-item";
      const STYLE_ATTR = "data-cudloun-style";
      const BACKDROP_CLASS = "cudloun-backdrop";
      const RESTORE_FULLSCREEN_KEY = "cudloun.restoreFullscreenAfterRefresh";
      const RESTORE_FULLSCREEN_CLASS = "cudloun-restore-fullscreen";
      const HUB_POSITION_KEY = "cudloun.hubPosition";
      const HUB_COLLAPSED_KEY = "cudloun.hubCollapsed";

      let observer = null;
      let observerDebounceTimer = null;
      let interactionDebounceTimer = null;
      let routeTimer = null;
      let lastRoute = root.currentRoute();
      let hubPosition = null;
      let hubCollapsed = false;
      let hubSelectedId = null;

      root.ui = {
        start,
        openHub,
        closeHub,
        renderHub,
        refreshMenuItems,
        injectIntoKapybaraAvatarMenu,
      };

      function start() {
        installStyles();
        maybeShowRestoreFullscreenPrompt();
        observeAvatarMenu();
        observeMenuInteractions();
        observeRouteChanges();
        injectIntoKapybaraAvatarMenu();
        root.log.info("menu", "started", lastRoute);
      }

      function observeAvatarMenu() {
        if (observer) return;

        observer = new MutationObserver((mutations) => {
          const shouldRecheck = mutations.some((mutation) => mutation.addedNodes.length || mutation.type === "attributes");
          if (!shouldRecheck) return;

          window.clearTimeout(observerDebounceTimer);
          observerDebounceTimer = window.setTimeout(() => {
            injectIntoKapybaraAvatarMenu();
          }, 40);
        });

        observer.observe(document.documentElement, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["class", "style", "aria-hidden"],
        });

        root.log.debug("menu", "avatar/menu observer attached");
      }

      function observeMenuInteractions() {
        const schedule = (event) => {
          if (!(event.target instanceof Element)) return;
          if (!event.target.closest("[aria-label='Uživatelské menu'], .user-menu-wrap, .desktop-right, .avatar-shell, .avatar-button")) return;

          window.clearTimeout(interactionDebounceTimer);
          interactionDebounceTimer = window.setTimeout(() => {
            injectIntoKapybaraAvatarMenu();
          }, 80);
        };

        document.addEventListener("click", schedule, true);
        document.addEventListener("pointerup", schedule, true);
      }

      function observeRouteChanges() {
        const check = () => {
          const route = root.currentRoute();
          if (route !== lastRoute) {
            lastRoute = route;
            root.log.info("router", "route changed", route);
            injectIntoKapybaraAvatarMenu();
          }
          routeTimer = window.setTimeout(check, 500);
        };

        routeTimer = window.setTimeout(check, 500);
      }

      function injectIntoKapybaraAvatarMenu() {
        if (!root.kapyguts?.isKapybara?.()) return;

        const menu = visibleKapybaraAvatarMenu();
        if (!menu) {
          root.log.trace("menu", "kapybara avatar menu not present");
          return;
        }

        if (menu.querySelector(`[${MENU_ITEM_ATTR}]`)) {
          root.log.trace("menu", "kapybara avatar menu items already present");
          return;
        }

        const anchor = kapybaraMenuAnchor(menu);
        const item = makeKapybaraMenuItem(anchor);
        item.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          dismissKapybaraMenu();
          openHub();
        });

        if (anchor) {
          anchor.before(item);
        } else {
          menu.appendChild(item);
        }

        if (showFullscreenControls()) {
          const controls = makeKapybaraActionRow();
          item.after(controls);
        }

        root.log.info("menu", "kapybara avatar menu items injected", menuDebug(menu));
      }

      function visibleKapybaraAvatarMenu() {
        const candidates = Array.from(document.querySelectorAll([
          "[role='dialog']",
          "[role='menu']",
          ".bottom-sheet",
          "[class*='sheet']",
          "[class*='drawer']",
          "[class*='menu']",
          "section",
          "nav",
          "aside",
          "div",
        ].join(",")))
          .filter(isUsableKapybaraMenuCandidate)
          .sort((a, b) => {
            const rectA = a.getBoundingClientRect();
            const rectB = b.getBoundingClientRect();
            return (rectA.width * rectA.height) - (rectB.width * rectB.height);
          });

        if (candidates.length > 1) {
          root.log.debug("menu", "candidate kapybara avatar menus", candidates.slice(0, 8).map(menuDebug));
        }

        return candidates[0] || null;
      }

      function isUsableKapybaraMenuCandidate(node) {
        if (!(node instanceof Element)) return false;
        if (node.closest(`.${BACKDROP_CLASS}`)) return false;
        if (node.querySelector(`[${MENU_ITEM_ATTR}]`)) return false;

        const rect = node.getBoundingClientRect();
        if (rect.width < 160 || rect.height < 120) return false;
        if (rect.bottom <= 0 || rect.top >= window.innerHeight) return false;

        const style = window.getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;

        const text = normalizeMenuText(node.textContent);
        if (!text.includes("Nastavení") || !text.includes("Odhlásit")) return false;
        if (text.length > 260) return false;

        return true;
      }

      function kapybaraMenuAnchor(menu) {
        const rows = Array.from(menu.querySelectorAll("button, a, [role='button'], li, div, span"))
          .filter((node) => {
            if (!(node instanceof Element)) return false;
            const rect = node.getBoundingClientRect();
            if (rect.width < 80 || rect.height < 24) return false;
            if (rect.bottom <= 0 || rect.top >= window.innerHeight) return false;
            const text = normalizeMenuText(node.textContent);
            return text === "Nastavení" || text === "Odhlásit se" || text === "Odhlásit";
          })
          .sort((a, b) => {
            const rectA = a.getBoundingClientRect();
            const rectB = b.getBoundingClientRect();
            return (rectA.width * rectA.height) - (rectB.width * rectB.height);
          });

        return rows[0] || null;
      }

      function makeKapybaraMenuItem(anchor) {
        const item = document.createElement("button");
        item.type = "button";
        item.className = `${anchor?.className || ""} cudloun-kapybara-menu-item`.trim();
        item.setAttribute(MENU_ITEM_ATTR, "true");
        item.innerHTML = `${menuIconSvg()}<span>Cudloun</span>`;
        return item;
      }

      function makeKapybaraActionRow() {
        const row = document.createElement("div");
        row.className = "cudloun-kapybara-action-row";
        row.setAttribute(FULLSCREEN_ITEM_ATTR, "true");
        row.appendChild(makeMenuActionButton("Full", fullscreenIconSvg(), (event) => {
          dismissKapybaraMenu();
          toggleFullscreen(event);
        }, "Fullscreen"));
        row.appendChild(makeMenuActionButton("Refresh", refreshPageIconSvg(), (event) => {
          dismissKapybaraMenu();
          refreshPage(event);
        }));
        return row;
      }

      function makeMenuActionButton(labelText, iconSvg, handler, ariaLabel = labelText) {
        const button = document.createElement("button");
        button.className = "cudloun-menu-action-button";
        button.type = "button";
        button.setAttribute("aria-label", ariaLabel);
        button.title = ariaLabel;
        button.innerHTML = `${iconSvg}<span>${labelText}</span>`;
        button.addEventListener("click", handler);
        return button;
      }

      async function toggleFullscreen(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }

        dismissKapybaraMenu();

        try {
          if (document.fullscreenElement) {
            await document.exitFullscreen();
            root.log.info("fullscreen", "exited");
            return;
          }

          await document.documentElement.requestFullscreen();
          root.log.info("fullscreen", "entered");
        } catch (error) {
          root.log.warn("fullscreen", "toggle failed", error);
        }
      }

      function refreshPage(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }

        dismissKapybaraMenu();
        if (document.fullscreenElement) {
          root.storage.set(RESTORE_FULLSCREEN_KEY, true);
        }
        root.log.info("menu", "refresh requested");
        window.location.reload();
      }

      function showFullscreenControls() {
        return root.storage.get("module.settoun.showFullscreen", true) !== false;
      }

      function refreshMenuItems() {
        document.querySelectorAll(`[${MENU_ITEM_ATTR}], [${FULLSCREEN_ITEM_ATTR}]`)
          .forEach((item) => item.remove());
        injectIntoKapybaraAvatarMenu();
      }

      function maybeShowRestoreFullscreenPrompt() {
        if (root.storage.get(RESTORE_FULLSCREEN_KEY, false) !== true) return;
        root.storage.set(RESTORE_FULLSCREEN_KEY, false);
        if (document.fullscreenElement) return;

        window.setTimeout(() => {
          if (document.fullscreenElement || document.querySelector(`.${RESTORE_FULLSCREEN_CLASS}`)) return;

          const prompt = document.createElement("div");
          prompt.className = RESTORE_FULLSCREEN_CLASS;

          const button = document.createElement("button");
          button.type = "button";
          button.textContent = "Restore fullscreen";
          button.addEventListener("click", async () => {
            try {
              await document.documentElement.requestFullscreen();
              root.log.info("fullscreen", "restored after refresh");
            } catch (error) {
              root.log.warn("fullscreen", "restore failed", error);
            } finally {
              prompt.remove();
            }
          });

          const dismiss = document.createElement("button");
          dismiss.type = "button";
          dismiss.setAttribute("aria-label", "Dismiss");
          dismiss.textContent = "x";
          dismiss.addEventListener("click", () => prompt.remove());

          prompt.appendChild(button);
          prompt.appendChild(dismiss);
          document.body.appendChild(prompt);
        }, 600);
      }

      function menuIconSvg() {
        return `
          <svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeSmall css-vh810p"
               focusable="false"
               aria-hidden="true"
               viewBox="0 0 24 24">
            <path d="M12 3c4.97 0 9 3.36 9 7.5 0 2.08-1.02 3.96-2.67 5.32L19 21l-4.63-2.32c-.76.21-1.56.32-2.37.32-4.97 0-9-3.36-9-7.5S7.03 3 12 3m-4 8h2V9H8zm3 0h2V9h-2zm3 0h2V9h-2z"></path>
          </svg>
        `;
      }

      function fullscreenIconSvg() {
        return `
          <svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeSmall css-vh810p"
               focusable="false"
               aria-hidden="true"
               viewBox="0 0 24 24">
            <path d="M5 5h6v2H7v4H5zm8 0h6v6h-2V7h-4zm4 8h2v6h-6v-2h4zm-12 0h2v4h4v2H5z"></path>
          </svg>
        `;
      }

      function refreshPageIconSvg() {
        return `
          <svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeSmall css-vh810p"
               focusable="false"
               aria-hidden="true"
               viewBox="0 0 24 24">
            <path d="M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.45 5.05h-2.13A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h8V3z"></path>
          </svg>
        `;
      }

      function menuDebug(menu) {
        const rect = menu.getBoundingClientRect();
        return {
          text: menu.textContent.trim().replace(/\s+/g, " ").slice(0, 120),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          className: menu.className,
        };
      }

      function openHub(eventOrModuleId) {
        let selectedModuleId = null;
        if (typeof eventOrModuleId === "string") {
          selectedModuleId = eventOrModuleId;
        } else if (eventOrModuleId) {
          eventOrModuleId.preventDefault();
          eventOrModuleId.stopPropagation();
          dismissKapybaraMenu();
        }

        document.querySelector(`.${BACKDROP_CLASS}`)?.remove();
        hubPosition = validHubPosition(root.storage.get(HUB_POSITION_KEY, null));
        hubCollapsed = root.storage.get(HUB_COLLAPSED_KEY, false) === true;

        const backdrop = document.createElement("div");
        backdrop.className = BACKDROP_CLASS;
        backdrop.addEventListener("click", (clickEvent) => {
          if (clickEvent.target === backdrop) closeHub();
        });

        document.body.appendChild(backdrop);
        root.log.info("hub", "opened");
        renderHub(selectedModuleId);
      }

      function closeHub() {
        document.querySelector(`.${BACKDROP_CLASS}`)?.remove();
        root.log.info("hub", "closed");
      }

      function dismissKapybaraMenu() {
        document.dispatchEvent(new KeyboardEvent("keydown", {
          key: "Escape",
          code: "Escape",
          keyCode: 27,
          which: 27,
          bubbles: true,
          cancelable: true,
        }));
      }

      function normalizeMenuText(text) {
        return String(text || "").replace(/\s+/g, " ").trim();
      }

      function renderHub(selectedId) {
        const backdrop = document.querySelector(`.${BACKDROP_CLASS}`);
        if (!backdrop) return;

        const selectedModule = root.modules.find((module) => module.id === selectedId) || root.modules[0];
        const mode = selectedId === "debug" ? "debug" : "module";
        hubSelectedId = mode === "debug" ? "debug" : selectedModule?.id;
        backdrop.innerHTML = "";

        const dialog = document.createElement("section");
        dialog.className = "cudloun-dialog";
        if (hubCollapsed) dialog.dataset.collapsed = "true";
        dialog.setAttribute("role", "dialog");
        dialog.setAttribute("aria-modal", "true");
        dialog.setAttribute("aria-labelledby", "cudloun-title");
        dialog.appendChild(renderMascot());
        dialog.appendChild(renderHeader());
        if (!hubCollapsed) dialog.appendChild(renderBody(mode, selectedModule));
        backdrop.appendChild(dialog);
        applyHubPosition(dialog);
      }

      function renderMascot() {
        const mascot = document.createElement("img");
        mascot.className = "cudloun-mascot";
        mascot.alt = "";
        mascot.decoding = "async";
        mascot.loading = "lazy";
        mascot.src = `${root.repoUrl}cudloun.png`;
        return mascot;
      }

      function renderHeader() {
        const header = document.createElement("div");
        header.className = "cudloun-head";
        header.addEventListener("pointerdown", startHubDrag);

        const titleWrap = document.createElement("div");
        titleWrap.className = "cudloun-title-wrap";
        const title = document.createElement("div");
        title.id = "cudloun-title";
        title.className = "cudloun-title";
        title.textContent = "Cudloun";

        const subtitle = document.createElement("div");
        subtitle.className = "cudloun-subtitle";
        subtitle.textContent = `Kapybara module hub core ${root.coreVersion} / seed ${root.seedVersion} / manifest ${root.manifestVersion}`;

        titleWrap.appendChild(title);
        titleWrap.appendChild(subtitle);

        const buttons = document.createElement("div");
        buttons.className = "cudloun-head-actions";

        const collapse = document.createElement("button");
        collapse.className = "cudloun-icon-button";
        collapse.type = "button";
        collapse.setAttribute("aria-label", hubCollapsed ? "Expand" : "Collapse");
        collapse.textContent = hubCollapsed ? "+" : "-";
        collapse.addEventListener("click", () => {
          hubCollapsed = !hubCollapsed;
          root.storage.set(HUB_COLLAPSED_KEY, hubCollapsed);
          root.log.info("hub", hubCollapsed ? "collapsed" : "expanded");
          renderHub(hubSelectedId);
        });

        const close = document.createElement("button");
        close.className = "cudloun-icon-button";
        close.type = "button";
        close.setAttribute("aria-label", "Close");
        close.textContent = "x";
        close.addEventListener("click", closeHub);

        header.appendChild(titleWrap);
        buttons.appendChild(collapse);
        buttons.appendChild(close);
        header.appendChild(buttons);
        return header;
      }

      function startHubDrag(event) {
        if (event.button !== 0) return;
        if (event.target instanceof Element && event.target.closest("button,input,select,a,textarea")) return;

        const dialog = event.currentTarget.closest(".cudloun-dialog");
        if (!(dialog instanceof HTMLElement)) return;

        const rect = dialog.getBoundingClientRect();
        const origin = {
          pointerX: event.clientX,
          pointerY: event.clientY,
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        };

        dialog.dataset.dragging = "true";
        event.currentTarget.setPointerCapture?.(event.pointerId);
        event.preventDefault();

        const onMove = (moveEvent) => {
          const next = clampHubPosition({
            left: origin.left + moveEvent.clientX - origin.pointerX,
            top: origin.top + moveEvent.clientY - origin.pointerY,
            width: origin.width,
            height: origin.height,
          });
          hubPosition = next;
          applyHubPosition(dialog);
        };

        const onEnd = () => {
          dialog.dataset.dragging = "false";
          if (hubPosition) root.storage.set(HUB_POSITION_KEY, hubPosition);
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onEnd);
          window.removeEventListener("pointercancel", onEnd);
        };

        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onEnd);
        window.addEventListener("pointercancel", onEnd);
      }

      function applyHubPosition(dialog) {
        if (!hubPosition) {
          dialog.style.removeProperty("--cudloun-hub-left");
          dialog.style.removeProperty("--cudloun-hub-top");
          dialog.dataset.dragged = "false";
          return;
        }

        const rect = dialog.getBoundingClientRect();
        const clamped = clampHubPosition({
          left: hubPosition.left,
          top: hubPosition.top,
          width: rect.width || 320,
          height: rect.height || 72,
        });
        hubPosition = clamped;
        dialog.style.setProperty("--cudloun-hub-left", `${Math.round(clamped.left)}px`);
        dialog.style.setProperty("--cudloun-hub-top", `${Math.round(clamped.top)}px`);
        dialog.dataset.dragged = "true";
      }

      function validHubPosition(value) {
        if (!value || typeof value !== "object") return null;
        if (!Number.isFinite(value.left) || !Number.isFinite(value.top)) return null;
        return {
          left: value.left,
          top: value.top,
        };
      }

      function clampHubPosition(position) {
        const margin = 8;
        const maxLeft = Math.max(margin, window.innerWidth - position.width - margin);
        const maxTop = Math.max(margin, window.innerHeight - position.height - margin);
        return {
          left: Math.min(Math.max(margin, position.left), maxLeft),
          top: Math.min(Math.max(margin, position.top), maxTop),
        };
      }

      function renderBody(mode, selectedModule) {
        const body = document.createElement("div");
        body.className = "cudloun-body";

        const list = document.createElement("div");
        list.className = "cudloun-module-list";
        root.modules.forEach((module) => {
          list.appendChild(renderModuleListItem(module, mode === "module" ? selectedModule?.id : null));
        });
        list.appendChild(renderDebugListItem(mode === "debug"));

        const details = document.createElement("div");
        details.className = "cudloun-module-details";
        details.appendChild(mode === "debug" ? renderDebugPanel() : renderModuleDetails(selectedModule));

        body.appendChild(list);
        body.appendChild(details);
        return body;
      }

      function renderModuleListItem(module, selectedModuleId) {
        const row = document.createElement("button");
        row.className = "cudloun-module-row";
        row.type = "button";
        row.dataset.selected = module.id === selectedModuleId ? "true" : "false";
        row.addEventListener("click", () => renderHub(module.id));

        const text = document.createElement("span");
        text.className = "cudloun-module-row-text";
        text.textContent = module.name;

        const enabled = document.createElement("input");
        enabled.type = "checkbox";
        enabled.checked = root.storage.isModuleEnabled(module.id);
        enabled.setAttribute("aria-label", `${module.name} enabled`);
        enabled.addEventListener("click", (event) => event.stopPropagation());
        enabled.addEventListener("change", () => {
          root.storage.setModuleEnabled(module.id, enabled.checked);
          renderHub(module.id);
        });

        row.appendChild(text);
        row.appendChild(enabled);
        return row;
      }

      function renderDebugListItem(selected) {
        const row = document.createElement("button");
        row.className = "cudloun-module-row";
        row.type = "button";
        row.dataset.selected = selected ? "true" : "false";
        row.addEventListener("click", () => renderHub("debug"));

        const text = document.createElement("span");
        text.className = "cudloun-module-row-text";
        text.textContent = "Debug";

        const badge = document.createElement("span");
        badge.className = "cudloun-debug-count";
        badge.textContent = String(root.log.entries.length);

        row.appendChild(text);
        row.appendChild(badge);
        return row;
      }

      function renderModuleDetails(module) {
        const panel = document.createElement("div");
        if (!module) {
          panel.textContent = "No modules registered yet.";
          return panel;
        }

        const eyebrow = document.createElement("div");
        eyebrow.className = "cudloun-eyebrow";
        eyebrow.textContent = `Module ${module.version}`;

        const title = document.createElement("h2");
        title.className = "cudloun-module-title";
        title.textContent = module.name;

        const description = document.createElement("p");
        description.className = "cudloun-module-copy";
        description.textContent = module.description || "";

        const enabled = document.createElement("label");
        enabled.className = "cudloun-toggle";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = root.storage.isModuleEnabled(module.id);
        checkbox.addEventListener("change", () => {
          root.storage.setModuleEnabled(module.id, checkbox.checked);
          renderHub(module.id);
        });
        enabled.appendChild(checkbox);
        enabled.appendChild(document.createTextNode("Enabled"));

        const actions = document.createElement("div");
        actions.className = "cudloun-actions";

        if (module.actionLabel && typeof module.action === "function") {
          const action = document.createElement("button");
          action.className = "cudloun-button";
          action.type = "button";
          action.disabled = !root.storage.isModuleEnabled(module.id);
          action.textContent = module.actionLabel;
          action.addEventListener("click", () => {
            root.log.info("module", "action", module.id, module.actionLabel);
            module.action(root.makeModuleContext(module));
          });
          actions.appendChild(action);
        }

        const help = document.createElement("div");
        help.className = "cudloun-help";
        const helpTitle = document.createElement("h3");
        helpTitle.textContent = "Help";
        help.appendChild(helpTitle);

        const helpLines = typeof module.renderHelp === "function" ? module.renderHelp(root.makeModuleContext(module)) : [];
        if (helpLines.length) {
          helpLines.forEach((line) => {
            const paragraph = document.createElement("p");
            paragraph.textContent = line;
            help.appendChild(paragraph);
          });
        } else {
          const paragraph = document.createElement("p");
          paragraph.textContent = "This module has no help page yet.";
          help.appendChild(paragraph);
        }

        panel.appendChild(eyebrow);
        panel.appendChild(title);
        panel.appendChild(description);
        panel.appendChild(enabled);
        panel.appendChild(actions);

        if (typeof module.renderSettings === "function") {
          const custom = module.renderSettings(root.makeModuleContext(module));
          if (custom) {
            panel.appendChild(custom);
          }
        }

        if (root.feedback && typeof root.feedback.renderThread === "function") {
          panel.appendChild(root.feedback.renderThread({
            kind: "module",
            id: module.id,
            name: module.name,
          }));
        }

        panel.appendChild(help);
        return panel;
      }

      function renderDebugPanel() {
        const panel = document.createElement("div");

        const eyebrow = document.createElement("div");
        eyebrow.className = "cudloun-eyebrow";
        eyebrow.textContent = `Route ${root.currentRoute()}`;

        const title = document.createElement("h2");
        title.className = "cudloun-module-title";
        title.textContent = "Debug";

        const controls = document.createElement("div");
        controls.className = "cudloun-actions";

        const select = document.createElement("select");
        select.className = "cudloun-select";
        root.logger.levels.forEach((level) => {
          const option = document.createElement("option");
          option.value = level;
          option.textContent = level;
          option.selected = root.log.level() === level;
          select.appendChild(option);
        });
        select.addEventListener("change", () => root.logger.setLevel(select.value));

        const clear = document.createElement("button");
        clear.className = "cudloun-button cudloun-button-secondary";
        clear.type = "button";
        clear.textContent = "Clear";
        clear.addEventListener("click", () => {
          root.logger.clear();
          renderHub("debug");
        });

        const copy = document.createElement("button");
        copy.className = "cudloun-button cudloun-button-secondary";
        copy.type = "button";
        copy.textContent = "Copy log";
        copy.addEventListener("click", () => {
          copyText(debugLogText()).then(() => {
            root.log.info("debug", "log copied");
            renderHub("debug");
          }).catch((error) => root.log.warn("debug", "copy failed", error));
        });

        const exportLog = document.createElement("button");
        exportLog.className = "cudloun-button cudloun-button-secondary";
        exportLog.type = "button";
        exportLog.textContent = "Export log";
        exportLog.addEventListener("click", () => {
          exportTextFile(`cudloun-debug-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`, debugLogText());
          root.log.info("debug", "log export prepared");
          renderHub("debug");
        });

        controls.appendChild(select);
        controls.appendChild(copy);
        controls.appendChild(exportLog);
        controls.appendChild(clear);

        const meta = document.createElement("div");
        meta.className = "cudloun-debug-meta";
        meta.textContent = [
          `Seed: ${root.seedVersion}`,
          `Core: ${root.coreVersion}`,
          `Manifest: ${root.manifestVersion}`,
          `Loaded files: ${root.loadedFiles.map((file) => file.id).join(", ") || "none"}`,
        ].join(" | ");

        const logBox = document.createElement("div");
        logBox.className = "cudloun-log-box";
        root.logger.recent(160).forEach((entry) => logBox.appendChild(renderLogEntry(entry)));

        panel.appendChild(eyebrow);
        panel.appendChild(title);
        panel.appendChild(controls);
        panel.appendChild(meta);
        panel.appendChild(logBox);
        return panel;
      }

      function renderLogEntry(entry) {
        const row = document.createElement("div");
        row.className = "cudloun-log-entry";
        row.dataset.level = entry.level;

        const time = entry.time.slice(11, 19);
        const args = entry.args.map((arg) => {
          if (arg instanceof Error) return arg.message;
          if (typeof arg === "string") return arg;
          try {
            return JSON.stringify(arg);
          } catch (error) {
            return String(arg);
          }
        }).join(" ");

        row.textContent = `${time} [${entry.level}] ${entry.area}: ${args}`;
        return row;
      }

      function debugLogText() {
        return root.logger.recent(500).map((entry) => {
          const args = entry.args.map((arg) => {
            if (arg instanceof Error) return arg.message;
            if (typeof arg === "string") return arg;
            try {
              return JSON.stringify(arg);
            } catch (error) {
              return String(arg);
            }
          }).join(" ");

          return `${entry.time} [${entry.level}] ${entry.area}: ${args}`;
        }).join("\n");
      }

      async function copyText(text) {
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
          throw new Error("Clipboard API is not available");
        }
        await navigator.clipboard.writeText(text);
      }

      function exportTextFile(filename, text) {
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }

      function installStyles() {
        if (document.head.querySelector(`[${STYLE_ATTR}]`)) return;

        const style = document.createElement("style");
        style.setAttribute(STYLE_ATTR, "true");
        style.textContent = `
          .cudloun-backdrop{position:fixed;inset:0;z-index:1600;display:flex;align-items:center;justify-content:center;padding:42px 20px 20px;background:rgba(26,32,44,.34);backdrop-filter:blur(2px);box-sizing:border-box}
          .cudloun-dialog{position:relative;box-sizing:border-box;width:min(860px,calc(100vw - 28px));max-height:min(760px,calc(100vh - 62px));display:flex;flex-direction:column;overflow:visible;border:1px solid rgba(79,102,134,.34);border-radius:8px;background:#f6f8fb;box-shadow:0 18px 48px rgba(18,27,43,.24);color:#182230;font-family:inherit}
          .cudloun-dialog[data-dragged=true]{position:fixed;left:var(--cudloun-hub-left);top:var(--cudloun-hub-top);margin:0}
          .cudloun-dialog[data-collapsed=true]{width:min(430px,calc(100vw - 16px));overflow:hidden}
          .cudloun-mascot{position:absolute;left:-73px;top:0;width:100px;max-width:26vw;height:auto;transform:translateY(-48%);pointer-events:none;filter:drop-shadow(0 6px 5px rgba(18,27,43,.25));z-index:2}
          .cudloun-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 20px 14px;border-top-left-radius:8px;border-top-right-radius:8px;border-bottom:1px solid rgba(79,102,134,.2);background:#fff;cursor:grab;touch-action:none;user-select:none}
          .cudloun-dialog[data-dragging=true] .cudloun-head{cursor:grabbing}
          .cudloun-title-wrap{min-width:0}
          .cudloun-title{font-size:1.15rem;font-weight:750;letter-spacing:0}
          .cudloun-subtitle,.cudloun-eyebrow{margin-top:3px;color:#697586;font-size:.78rem;letter-spacing:0}
          .cudloun-head-actions{display:flex;align-items:center;gap:8px;flex:0 0 auto}
          .cudloun-icon-button{appearance:none;width:32px;height:32px;border:1px solid rgba(79,102,134,.2);border-radius:6px;background:#fff;color:#4b5565;cursor:pointer;font:700 1rem/1 inherit;flex:0 0 auto}
          .cudloun-icon-button:hover{background:#eef2f7}
          .cudloun-menu-action-button{appearance:none;min-width:0;flex:1 1 0;display:inline-flex;align-items:center;justify-content:center;gap:5px;border:1px solid rgba(79,102,134,.24);border-radius:6px;background:#f8fafc;color:#243041;cursor:pointer;font:600 .8rem/1.2 inherit;padding:7px 5px}
          .cudloun-menu-action-button:hover{background:#eef2f7}
          .cudloun-menu-action-button svg{width:18px;height:18px;flex:0 0 auto;fill:currentColor}
          .cudloun-menu-action-button span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
          .cudloun-kapybara-menu-item{appearance:none;width:100%;min-height:56px;display:flex;align-items:center;gap:24px;margin:0;padding:12px 40px;border:0;background:transparent;color:inherit;cursor:pointer;font:inherit;text-align:left}
          .cudloun-kapybara-menu-item:hover{background:rgba(128,128,128,.08)}
          .cudloun-kapybara-menu-item svg{width:24px;height:24px;flex:0 0 auto;fill:#b06a00;color:#b06a00}
          .cudloun-kapybara-menu-item span{font-size:1rem;line-height:1.35}
          .cudloun-kapybara-action-row{display:flex;align-items:center;gap:8px;padding:4px 40px 12px}
          .desktop-menu .cudloun-kapybara-menu-item{min-height:36px;gap:10px;padding:0 16px}
          .desktop-menu .cudloun-kapybara-menu-item svg{width:20px;height:20px}
          .desktop-menu .cudloun-kapybara-menu-item span{font-size:.95rem}
          .desktop-menu .cudloun-kapybara-action-row{padding:4px 8px 8px}
          .cudloun-restore-fullscreen{position:fixed;left:50%;top:14px;z-index:1900;display:flex;align-items:center;gap:8px;transform:translateX(-50%);padding:8px;border:1px solid rgba(79,102,134,.28);border-radius:8px;background:#fff;box-shadow:0 10px 28px rgba(18,27,43,.22);font-family:inherit}
          .cudloun-restore-fullscreen button{appearance:none;border:1px solid rgba(79,102,134,.24);border-radius:6px;background:#f8fafc;color:#243041;cursor:pointer;font:700 .86rem/1.2 inherit;padding:8px 10px}
          .cudloun-restore-fullscreen button:hover{background:#eef2f7}
          .cudloun-body{min-height:390px;display:grid;grid-template-columns:minmax(190px,250px) 1fr;overflow:hidden}
          .cudloun-module-list{overflow:auto;padding:12px;border-right:1px solid rgba(79,102,134,.18);background:#edf2f7}
          .cudloun-module-row{appearance:none;width:100%;min-height:42px;display:grid;grid-template-columns:1fr auto;align-items:center;gap:10px;margin:0 0 8px;padding:9px 10px;border:1px solid transparent;border-radius:6px;background:transparent;color:#243041;cursor:pointer;font:inherit;text-align:left}
          .cudloun-module-row[data-selected=true],.cudloun-module-row:hover{border-color:rgba(76,111,166,.24);background:#fff}
          .cudloun-module-row-text{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:650}
          .cudloun-debug-count{min-width:22px;padding:2px 6px;border-radius:999px;background:#d8e2ef;color:#364152;text-align:center;font-size:.76rem;font-weight:700}
          .cudloun-module-details{overflow:auto;padding:22px;background:#f8fafc}
          .cudloun-module-title{margin:8px 0;color:#182230;font-size:1.35rem;line-height:1.2;letter-spacing:0}
          .cudloun-module-copy{max-width:58ch;margin:0 0 16px;color:#4b5565;line-height:1.5}
          .cudloun-toggle{display:inline-flex;align-items:center;gap:8px;margin:0 0 18px;color:#364152;font-weight:650}
          .cudloun-actions{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 18px;align-items:center}
          .cudloun-button{appearance:none;border:1px solid rgba(8,126,164,.34);border-radius:6px;padding:9px 13px;background:#087ea4;color:#fff;cursor:pointer;font:700 .92rem/1.2 inherit}
          .cudloun-button:hover{background:#096f91}
          .cudloun-button:disabled{opacity:.48;cursor:default}
          .cudloun-button-secondary{background:#4b5565;border-color:rgba(75,85,101,.34)}
          .cudloun-button-secondary:hover{background:#364152}
          .cudloun-select{min-height:36px;border:1px solid rgba(79,102,134,.32);border-radius:6px;background:#fff;color:#182230;padding:0 10px;font:inherit}
          .cudloun-help{max-width:62ch;padding-top:14px;border-top:1px solid rgba(79,102,134,.18);color:#4b5565}
          .cudloun-help h3{margin:0 0 8px;color:#243041;font-size:.95rem;letter-spacing:0}
          .cudloun-help p{margin:0 0 8px;line-height:1.45}
          .cudloun-container-list{max-width:680px;margin:0 0 18px;display:flex;flex-direction:column;gap:10px}
          .cudloun-container-card{border:1px solid rgba(79,102,134,.22);border-radius:8px;background:#fff;padding:12px}
          .cudloun-container-card h3{margin:0 0 6px;color:#243041;font-size:1rem;letter-spacing:0}
          .cudloun-container-card p{margin:0 0 10px;color:#4b5565;line-height:1.4}
          .cudloun-container-actions{display:flex;flex-wrap:wrap;gap:8px}
          .cudloun-feedback{box-sizing:border-box;width:100%;max-width:680px;min-width:0;margin:18px 0 18px;padding:12px;border:1px solid rgba(79,102,134,.22);border-radius:8px;background:#fff;overflow:hidden}
          .cudloun-feedback-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 4px}
          .cudloun-feedback h3{margin:0;color:#243041;font-size:1rem;letter-spacing:0}
          .cudloun-feedback-meta{margin:0 0 10px;color:#697586;font-size:.78rem;line-height:1.3}
          .cudloun-feedback-refresh{appearance:none;border:1px solid rgba(79,102,134,.24);border-radius:6px;background:#f8fafc;color:#243041;cursor:pointer;font:700 .78rem/1.2 inherit;padding:6px 8px}
          .cudloun-feedback-refresh:hover{background:#eef2f7}
          .cudloun-feedback-messages{box-sizing:border-box;max-width:100%;max-height:260px;overflow:auto;margin:0 0 12px;border:1px solid rgba(79,102,134,.16);border-radius:6px;background:#f8fafc}
          .cudloun-feedback-empty{padding:12px;color:#697586}
          .cudloun-feedback-message{box-sizing:border-box;min-width:0;padding:10px 12px;border-bottom:1px solid rgba(79,102,134,.13);background:#fff}
          .cudloun-feedback-message:last-child{border-bottom:0}
          .cudloun-feedback-message[data-reply=true]{border-left:3px solid rgba(8,126,164,.28)}
          .cudloun-feedback-message[data-depth="1"]{margin-left:12px}
          .cudloun-feedback-message[data-depth="2"]{margin-left:24px}
          .cudloun-feedback-message[data-depth="3"]{margin-left:36px}
          .cudloun-feedback-message-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin:0 0 5px}
          .cudloun-feedback-message-head strong{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#243041;font-size:.88rem}
          .cudloun-feedback-message-head time{flex:0 0 auto;color:#697586;font-size:.74rem}
          .cudloun-feedback-parent{margin:0 0 5px;color:#697586;font-size:.76rem;line-height:1.25;overflow-wrap:anywhere}
          .cudloun-feedback-text{min-width:0;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;color:#364152;line-height:1.42}
          .cudloun-feedback-image-link{display:block;width:max-content;max-width:100%;margin:8px 0 2px}
          .cudloun-feedback-image{display:block;max-width:100%;max-height:280px;border-radius:6px;border:1px solid rgba(79,102,134,.18);object-fit:contain;background:#f8fafc}
          .cudloun-feedback-message-actions{display:flex;justify-content:flex-end;margin:7px 0 0}
          .cudloun-feedback-message-actions button,.cudloun-feedback-reply-target button{appearance:none;border:1px solid rgba(79,102,134,.22);border-radius:6px;background:#f8fafc;color:#243041;cursor:pointer;font:700 .74rem/1.2 inherit;padding:5px 7px}
          .cudloun-feedback-message-actions button:hover,.cudloun-feedback-reply-target button:hover{background:#eef2f7}
          .cudloun-feedback-message-actions button:disabled{opacity:.55;cursor:default}
          .cudloun-feedback-message-actions .cudloun-feedback-delete{border-color:rgba(180,35,24,.22);background:#fff5f4;color:#b42318}
          .cudloun-feedback-message-actions .cudloun-feedback-delete:hover{background:#ffe7e5}
          .cudloun-feedback-replies{margin:8px 0 0}
          .cudloun-feedback-form{display:grid;min-width:0;max-width:100%;gap:8px}
          .cudloun-feedback-reply-target{box-sizing:border-box;display:flex;align-items:flex-start;justify-content:space-between;gap:8px;min-width:0;max-width:100%;min-height:32px;padding:7px 8px;border:1px solid rgba(8,126,164,.22);border-radius:6px;background:#eef8fb;color:#364152;font-size:.8rem;overflow:hidden}
          .cudloun-feedback-reply-target[hidden]{display:none}
          .cudloun-feedback-reply-target span{min-width:0;overflow-wrap:anywhere;line-height:1.3}
          .cudloun-feedback-author,.cudloun-feedback textarea{box-sizing:border-box;width:100%;border:1px solid rgba(79,102,134,.28);border-radius:6px;background:#fff;color:#182230;font:inherit}
          .cudloun-feedback-author{min-height:36px;padding:0 10px}
          .cudloun-feedback textarea{display:block;max-width:100%;min-height:82px;resize:vertical;padding:9px 10px;line-height:1.38}
          .cudloun-feedback-actions{display:flex;align-items:center;justify-content:space-between;gap:10px}
          .cudloun-feedback-status{min-width:0;color:#697586;font-size:.82rem}
          .cudloun-settings-list{max-width:520px;margin:0 0 18px}
          .cudloun-setting-row{display:flex;align-items:center;justify-content:space-between;gap:14px;min-height:44px;padding:10px 12px;border:1px solid rgba(79,102,134,.22);border-radius:8px;background:#fff;color:#243041;font-weight:650}
          .cudloun-setting-text{min-width:0}
          .cudloun-code-box{max-width:680px;margin:8px 0 16px;padding:10px;border:1px solid rgba(79,102,134,.2);border-radius:6px;background:#101828;color:#e4e7ec;font:12px/1.45 Consolas,monospace;white-space:pre-wrap;word-break:break-word}
          .cudloun-debug-meta{margin:0 0 12px;color:#697586;font-size:.82rem;line-height:1.35}
          .cudloun-log-box{max-height:430px;overflow:auto;border:1px solid rgba(79,102,134,.2);border-radius:6px;background:#101828;color:#e4e7ec;font:12px/1.45 Consolas,monospace}
          .cudloun-log-entry{padding:5px 8px;border-bottom:1px solid rgba(255,255,255,.07);white-space:pre-wrap;word-break:break-word}
          .cudloun-log-entry[data-level=error]{color:#ffb4b4}
          .cudloun-log-entry[data-level=warn]{color:#ffd18a}
          .cudloun-log-entry[data-level=debug]{color:#9fd0ff}
          .cudloun-log-entry[data-level=trace]{color:#d8c4ff}
          @media (max-width:680px){.cudloun-backdrop{align-items:center;justify-content:center;padding:8px;background:rgba(26,32,44,.25)}.cudloun-dialog{width:calc(100vw - 16px);height:auto;max-height:calc(100dvh - 16px);border-radius:10px;overflow:hidden}.cudloun-dialog[data-collapsed=true]{width:min(390px,calc(100vw - 16px))}.cudloun-mascot{left:-36px;top:10px;width:58px;max-width:18vw;transform:none;opacity:.95}.cudloun-head{position:sticky;top:0;z-index:3;gap:10px;padding:12px 12px 10px 42px}.cudloun-title{font-size:1rem}.cudloun-subtitle{font-size:.68rem;line-height:1.25}.cudloun-body{min-height:0;max-height:calc(100dvh - 84px);display:flex;flex-direction:column;overflow:hidden}.cudloun-module-list{display:flex;gap:8px;min-height:56px;max-height:96px;overflow-x:auto;overflow-y:hidden;padding:8px;border-right:0;border-bottom:1px solid rgba(79,102,134,.18)}.cudloun-module-row{flex:0 0 auto;width:auto;min-width:118px;min-height:40px;margin:0;padding:8px 9px;background:#f8fafc;border-color:rgba(79,102,134,.16)}.cudloun-module-row-text{font-size:.84rem}.cudloun-module-details{flex:1;min-height:0;overflow:auto;padding:16px 12px 24px}.cudloun-module-title{font-size:1.18rem}.cudloun-container-card{padding:10px}.cudloun-container-actions{gap:7px}.cudloun-feedback{margin:14px 0;padding:10px}.cudloun-feedback-messages{max-height:220px}.cudloun-button{padding:8px 10px;font-size:.84rem}.cudloun-code-box{font-size:11px}.cudloun-log-box{max-height:52vh;font-size:11px}}
        `;
        document.head.appendChild(style);
      }
    })();

  });

  embeddedText.set("modules/settoun.js", "// Cudloun framework settings.\n(function () {\n  \"use strict\";\n\n  const root = window.Cudloun;\n\n  root.registerModule({\n    id: \"settoun\",\n    name: \"Settoun\",\n    description: \"Framework settings for Cudloun's own Kapybara menu behavior.\",\n    version: \"0.1.0\",\n    defaultEnabled: true,\n    renderSettings(ctx) {\n      const wrap = document.createElement(\"div\");\n      wrap.className = \"cudloun-settings-list\";\n\n      const label = document.createElement(\"label\");\n      label.className = \"cudloun-setting-row\";\n\n      const text = document.createElement(\"span\");\n      text.className = \"cudloun-setting-text\";\n      text.textContent = \"Show fullscreen\";\n\n      const checkbox = document.createElement(\"input\");\n      checkbox.type = \"checkbox\";\n      checkbox.checked = ctx.storage.get(\"showFullscreen\", true) !== false;\n      checkbox.addEventListener(\"change\", () => {\n        ctx.storage.set(\"showFullscreen\", checkbox.checked);\n        root.ui?.refreshMenuItems?.();\n        ctx.hub.render();\n      });\n\n      label.appendChild(text);\n      label.appendChild(checkbox);\n      wrap.appendChild(label);\n      return wrap;\n    },\n    renderHelp() {\n      return [\n        \"Settoun holds settings for Cudloun itself.\",\n        \"Show fullscreen controls whether the Kapybara account menu includes the Fullscreen and Refresh quick actions.\",\n      ];\n    },\n  });\n})();\n");
  embeddedScripts.set("modules/settoun.js", function () {
    // Cudloun framework settings.
    (function () {
      "use strict";

      const root = window.Cudloun;

      root.registerModule({
        id: "settoun",
        name: "Settoun",
        description: "Framework settings for Cudloun's own Kapybara menu behavior.",
        version: "0.1.0",
        defaultEnabled: true,
        renderSettings(ctx) {
          const wrap = document.createElement("div");
          wrap.className = "cudloun-settings-list";

          const label = document.createElement("label");
          label.className = "cudloun-setting-row";

          const text = document.createElement("span");
          text.className = "cudloun-setting-text";
          text.textContent = "Show fullscreen";

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = ctx.storage.get("showFullscreen", true) !== false;
          checkbox.addEventListener("change", () => {
            ctx.storage.set("showFullscreen", checkbox.checked);
            root.ui?.refreshMenuItems?.();
            ctx.hub.render();
          });

          label.appendChild(text);
          label.appendChild(checkbox);
          wrap.appendChild(label);
          return wrap;
        },
        renderHelp() {
          return [
            "Settoun holds settings for Cudloun itself.",
            "Show fullscreen controls whether the Kapybara account menu includes the Fullscreen and Refresh quick actions.",
          ];
        },
      });
    })();

  });

  embeddedText.set("modules/first-unread.js", "// Optional one-shot jump to the first unread Kapybara post.\n(function () {\n  \"use strict\";\n\n  const root = window.Cudloun;\n  const VERSION = \"0.1.0\";\n  const SETTLE_MS = 90;\n  const HEADER_GAP = 8;\n  const SCROLL_KEYS = new Set([\"ArrowUp\", \"ArrowDown\", \"PageUp\", \"PageDown\", \"Home\", \"End\", \" \"]);\n  let ctxRef = null;\n  let observer = null;\n  let settleTimer = 0;\n  let route = \"\";\n  let generation = 0;\n  let handled = false;\n  let userInterrupted = false;\n\n  root.firstUnread = {\n    version: VERSION,\n    schedule: scheduleAttempt,\n    status: () => ({ route, generation, handled, userInterrupted }),\n    headerOffset,\n  };\n\n  root.registerModule({\n    id: \"first-unread\",\n    name: \"First Unread\",\n    description: \"Jump once to the first unread post when a Kapybara club opens.\",\n    version: VERSION,\n    defaultEnabled: false,\n    start(ctx) {\n      if (!root.kapyguts?.isKapybara?.()) return null;\n      return start(ctx);\n    },\n    renderSettings() {\n      const wrap = document.createElement(\"div\");\n      wrap.className = \"cudloun-settings-list\";\n      const row = document.createElement(\"div\");\n      row.className = \"cudloun-setting-row\";\n      const text = document.createElement(\"div\");\n      text.className = \"cudloun-setting-text\";\n      text.textContent = \"When enabled, entering a club scrolls once to its first post marked unread by Kapybara. Explicit URL anchors and manual scrolling win.\";\n      row.appendChild(text);\n      wrap.appendChild(row);\n      return wrap;\n    },\n    renderHelp() {\n      return [\n        \"Enable First Unread in the Cudloun hub to jump to the first unread post whenever a club finishes rendering.\",\n        \"The jump happens only once per club visit and does not poll the network or alter Kapybara's read markers.\",\n        \"A URL anchor, mouse wheel, touch scroll, or navigation key cancels the automatic jump so it does not fight your chosen position.\",\n      ];\n    },\n  });\n\n  function start(ctx) {\n    stop();\n    ctxRef = ctx;\n    route = root.currentRoute();\n    generation += 1;\n    handled = false;\n    userInterrupted = false;\n\n    observer = new MutationObserver(scheduleAttempt);\n    observer.observe(document.body || document.documentElement, {\n      childList: true,\n      subtree: true,\n      attributes: true,\n      attributeFilter: [\"data-unread\"],\n    });\n    window.addEventListener(\"popstate\", routeChanged);\n    window.addEventListener(\"hashchange\", routeChanged);\n    window.addEventListener(\"wheel\", interrupt, { passive: true });\n    window.addEventListener(\"touchmove\", interrupt, { passive: true });\n    window.addEventListener(\"keydown\", interruptByKey, true);\n    scheduleAttempt();\n    ctx.log.info(\"waiting for first unread post\", route);\n    return stop;\n  }\n\n  function stop() {\n    generation += 1;\n    handled = true;\n    observer?.disconnect();\n    observer = null;\n    window.clearTimeout(settleTimer);\n    settleTimer = 0;\n    window.removeEventListener(\"popstate\", routeChanged);\n    window.removeEventListener(\"hashchange\", routeChanged);\n    window.removeEventListener(\"wheel\", interrupt);\n    window.removeEventListener(\"touchmove\", interrupt);\n    window.removeEventListener(\"keydown\", interruptByKey, true);\n    ctxRef = null;\n  }\n\n  function routeChanged() {\n    syncRoute();\n    scheduleAttempt();\n  }\n\n  function syncRoute() {\n    const current = root.currentRoute();\n    if (current === route) return false;\n    route = current;\n    generation += 1;\n    handled = false;\n    userInterrupted = false;\n    ctxRef?.log.debug(\"club route changed\", route, `generation=${generation}`);\n    return true;\n  }\n\n  function scheduleAttempt() {\n    syncRoute();\n    if (handled) return;\n    const owner = generation;\n    window.clearTimeout(settleTimer);\n    settleTimer = window.setTimeout(() => attempt(owner), SETTLE_MS);\n  }\n\n  function attempt(owner) {\n    settleTimer = 0;\n    syncRoute();\n    if (owner !== generation || handled) return;\n\n    const routeInfo = root.kapyguts?.route?.();\n    if (routeInfo?.type !== \"board\") {\n      handled = true;\n      return;\n    }\n    if (routeInfo.hash) {\n      handled = true;\n      ctxRef?.log.debug(\"explicit anchor preserved\", routeInfo.hash);\n      return;\n    }\n    if (userInterrupted) {\n      handled = true;\n      ctxRef?.log.debug(\"automatic jump cancelled by user interaction\");\n      return;\n    }\n    if (!currentBoardIsRendered(routeInfo) || !root.kapyguts.allPosts().length) return;\n\n    const unread = root.kapyguts.firstUnreadPost();\n    handled = true;\n    if (!unread) {\n      ctxRef?.log.debug(\"club has no unread post\", routeInfo.boardId);\n      return;\n    }\n\n    const postId = unread.getAttribute(\"data-post-id\") || \"unknown\";\n    requestAnimationFrame(() => requestAnimationFrame(() => {\n      if (owner !== generation || userInterrupted || !unread.isConnected) return;\n      scrollToPost(unread);\n      ctxRef?.log.info(\"scrolled to first unread post\", routeInfo.boardId, postId);\n    }));\n  }\n\n  function currentBoardIsRendered(routeInfo) {\n    const titleLink = root.kapyguts?.boardHeaderParts?.().titleLink;\n    if (!titleLink?.href) return false;\n    try {\n      return new URL(titleLink.href, window.location.href).pathname === routeInfo.path;\n    } catch (_error) {\n      return false;\n    }\n  }\n\n  function scrollToPost(post) {\n    const top = Math.max(0, window.scrollY + post.getBoundingClientRect().top - headerOffset() - HEADER_GAP);\n    window.scrollTo({ top, left: window.scrollX, behavior: \"auto\" });\n  }\n\n  function headerOffset() {\n    const parts = [\n      root.kapyguts?.pageHeaderParts?.().header,\n      root.kapyguts?.boardHeaderParts?.().titleRow,\n    ];\n    return parts.filter((element, index, all) => (\n      element?.isConnected && all.indexOf(element) === index && isStickyHeader(element)\n    )).reduce((height, element) => height + element.getBoundingClientRect().height, 0);\n  }\n\n  function isStickyHeader(element) {\n    const style = window.getComputedStyle(element);\n    return style.display !== \"none\" && (style.position === \"fixed\" || style.position === \"sticky\");\n  }\n\n  function interrupt() {\n    if (!handled && root.kapyguts?.isBoardPage?.()) userInterrupted = true;\n  }\n\n  function interruptByKey(event) {\n    if (SCROLL_KEYS.has(event.key)) interrupt();\n  }\n})();\n");
  embeddedScripts.set("modules/first-unread.js", function () {
    // Optional one-shot jump to the first unread Kapybara post.
    (function () {
      "use strict";

      const root = window.Cudloun;
      const VERSION = "0.1.0";
      const SETTLE_MS = 90;
      const HEADER_GAP = 8;
      const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);
      let ctxRef = null;
      let observer = null;
      let settleTimer = 0;
      let route = "";
      let generation = 0;
      let handled = false;
      let userInterrupted = false;

      root.firstUnread = {
        version: VERSION,
        schedule: scheduleAttempt,
        status: () => ({ route, generation, handled, userInterrupted }),
        headerOffset,
      };

      root.registerModule({
        id: "first-unread",
        name: "First Unread",
        description: "Jump once to the first unread post when a Kapybara club opens.",
        version: VERSION,
        defaultEnabled: false,
        start(ctx) {
          if (!root.kapyguts?.isKapybara?.()) return null;
          return start(ctx);
        },
        renderSettings() {
          const wrap = document.createElement("div");
          wrap.className = "cudloun-settings-list";
          const row = document.createElement("div");
          row.className = "cudloun-setting-row";
          const text = document.createElement("div");
          text.className = "cudloun-setting-text";
          text.textContent = "When enabled, entering a club scrolls once to its first post marked unread by Kapybara. Explicit URL anchors and manual scrolling win.";
          row.appendChild(text);
          wrap.appendChild(row);
          return wrap;
        },
        renderHelp() {
          return [
            "Enable First Unread in the Cudloun hub to jump to the first unread post whenever a club finishes rendering.",
            "The jump happens only once per club visit and does not poll the network or alter Kapybara's read markers.",
            "A URL anchor, mouse wheel, touch scroll, or navigation key cancels the automatic jump so it does not fight your chosen position.",
          ];
        },
      });

      function start(ctx) {
        stop();
        ctxRef = ctx;
        route = root.currentRoute();
        generation += 1;
        handled = false;
        userInterrupted = false;

        observer = new MutationObserver(scheduleAttempt);
        observer.observe(document.body || document.documentElement, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["data-unread"],
        });
        window.addEventListener("popstate", routeChanged);
        window.addEventListener("hashchange", routeChanged);
        window.addEventListener("wheel", interrupt, { passive: true });
        window.addEventListener("touchmove", interrupt, { passive: true });
        window.addEventListener("keydown", interruptByKey, true);
        scheduleAttempt();
        ctx.log.info("waiting for first unread post", route);
        return stop;
      }

      function stop() {
        generation += 1;
        handled = true;
        observer?.disconnect();
        observer = null;
        window.clearTimeout(settleTimer);
        settleTimer = 0;
        window.removeEventListener("popstate", routeChanged);
        window.removeEventListener("hashchange", routeChanged);
        window.removeEventListener("wheel", interrupt);
        window.removeEventListener("touchmove", interrupt);
        window.removeEventListener("keydown", interruptByKey, true);
        ctxRef = null;
      }

      function routeChanged() {
        syncRoute();
        scheduleAttempt();
      }

      function syncRoute() {
        const current = root.currentRoute();
        if (current === route) return false;
        route = current;
        generation += 1;
        handled = false;
        userInterrupted = false;
        ctxRef?.log.debug("club route changed", route, `generation=${generation}`);
        return true;
      }

      function scheduleAttempt() {
        syncRoute();
        if (handled) return;
        const owner = generation;
        window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(() => attempt(owner), SETTLE_MS);
      }

      function attempt(owner) {
        settleTimer = 0;
        syncRoute();
        if (owner !== generation || handled) return;

        const routeInfo = root.kapyguts?.route?.();
        if (routeInfo?.type !== "board") {
          handled = true;
          return;
        }
        if (routeInfo.hash) {
          handled = true;
          ctxRef?.log.debug("explicit anchor preserved", routeInfo.hash);
          return;
        }
        if (userInterrupted) {
          handled = true;
          ctxRef?.log.debug("automatic jump cancelled by user interaction");
          return;
        }
        if (!currentBoardIsRendered(routeInfo) || !root.kapyguts.allPosts().length) return;

        const unread = root.kapyguts.firstUnreadPost();
        handled = true;
        if (!unread) {
          ctxRef?.log.debug("club has no unread post", routeInfo.boardId);
          return;
        }

        const postId = unread.getAttribute("data-post-id") || "unknown";
        requestAnimationFrame(() => requestAnimationFrame(() => {
          if (owner !== generation || userInterrupted || !unread.isConnected) return;
          scrollToPost(unread);
          ctxRef?.log.info("scrolled to first unread post", routeInfo.boardId, postId);
        }));
      }

      function currentBoardIsRendered(routeInfo) {
        const titleLink = root.kapyguts?.boardHeaderParts?.().titleLink;
        if (!titleLink?.href) return false;
        try {
          return new URL(titleLink.href, window.location.href).pathname === routeInfo.path;
        } catch (_error) {
          return false;
        }
      }

      function scrollToPost(post) {
        const top = Math.max(0, window.scrollY + post.getBoundingClientRect().top - headerOffset() - HEADER_GAP);
        window.scrollTo({ top, left: window.scrollX, behavior: "auto" });
      }

      function headerOffset() {
        const parts = [
          root.kapyguts?.pageHeaderParts?.().header,
          root.kapyguts?.boardHeaderParts?.().titleRow,
        ];
        return parts.filter((element, index, all) => (
          element?.isConnected && all.indexOf(element) === index && isStickyHeader(element)
        )).reduce((height, element) => height + element.getBoundingClientRect().height, 0);
      }

      function isStickyHeader(element) {
        const style = window.getComputedStyle(element);
        return style.display !== "none" && (style.position === "fixed" || style.position === "sticky");
      }

      function interrupt() {
        if (!handled && root.kapyguts?.isBoardPage?.()) userInterrupted = true;
      }

      function interruptByKey(event) {
        if (SCROLL_KEYS.has(event.key)) interrupt();
      }
    })();

  });

  embeddedText.set("modules/kapybara-theme.js", "// Kapybara dark theme.\n(function () {\n  \"use strict\";\n\n  const root = window.Cudloun;\n  const STYLE_ID = \"cudloun-kapybara-theme-style\";\n  const THEME_ATTR = \"data-cudloun-kapybara-theme\";\n\n  const DEFAULTS = {\n    preset: \"black\",\n    accent: \"#d68a1f\",\n    pitchBlack: true,\n    softenCards: true,\n  };\n\n  root.registerModule({\n    id: \"kapybara-theme\",\n    name: \"Kapybara Theme\",\n    description: \"Dark theme experiment for Kapybara pages.\",\n    version: \"0.1.0\",\n    defaultEnabled: false,\n    start(ctx) {\n      apply(ctx);\n      return () => cleanup();\n    },\n    renderSettings(ctx) {\n      const wrap = document.createElement(\"div\");\n      wrap.className = \"cudloun-settings-list\";\n\n      wrap.appendChild(makeSelectRow(ctx, \"Color preset\", \"preset\", [\n        [\"black\", \"Black\"],\n        [\"charcoal\", \"Charcoal\"],\n        [\"blueblack\", \"Blue black\"],\n      ]));\n      wrap.appendChild(makeColorRow(ctx, \"Accent\", \"accent\", DEFAULTS.accent));\n      wrap.appendChild(makeCheckboxRow(ctx, \"Pitch black page\", \"pitchBlack\", DEFAULTS.pitchBlack));\n      wrap.appendChild(makeCheckboxRow(ctx, \"Softer post cards\", \"softenCards\", DEFAULTS.softenCards));\n\n      return wrap;\n    },\n    renderHelp() {\n      return [\n        \"Enable this module to apply a Cudloun dark theme to Kapybara.\",\n        \"The first pass uses semantic Kapybara classes where possible and keeps generated class overrides minimal.\",\n        \"Disable the module to remove the theme style and return to native Kapybara colors.\",\n      ];\n    },\n  });\n\n  function apply(ctx) {\n    if (!root.kapyguts?.isKapybara?.()) return;\n\n    const settings = readSettings(ctx);\n    document.documentElement.setAttribute(THEME_ATTR, \"dark\");\n    document.documentElement.style.setProperty(\"--cudloun-kapybara-bg\", palette(settings).bg);\n    document.documentElement.style.setProperty(\"--cudloun-kapybara-surface\", palette(settings).surface);\n    document.documentElement.style.setProperty(\"--cudloun-kapybara-surface-2\", palette(settings).surface2);\n    document.documentElement.style.setProperty(\"--cudloun-kapybara-line\", palette(settings).line);\n    document.documentElement.style.setProperty(\"--cudloun-kapybara-text\", palette(settings).text);\n    document.documentElement.style.setProperty(\"--cudloun-kapybara-muted\", palette(settings).muted);\n    document.documentElement.style.setProperty(\"--cudloun-kapybara-accent\", settings.accent);\n    document.documentElement.style.setProperty(\"--cudloun-kapybara-accent-soft\", hexToRgba(settings.accent, 0.16));\n    document.documentElement.style.setProperty(\"--cudloun-kapybara-radius\", settings.softenCards ? \"10px\" : \"0px\");\n    installStyle();\n    root.log.info(\"kapybara-theme\", \"applied\", settings);\n  }\n\n  function cleanup() {\n    document.documentElement.removeAttribute(THEME_ATTR);\n    [\n      \"--cudloun-kapybara-bg\",\n      \"--cudloun-kapybara-surface\",\n      \"--cudloun-kapybara-surface-2\",\n      \"--cudloun-kapybara-line\",\n      \"--cudloun-kapybara-text\",\n      \"--cudloun-kapybara-muted\",\n      \"--cudloun-kapybara-accent\",\n      \"--cudloun-kapybara-accent-soft\",\n      \"--cudloun-kapybara-radius\",\n    ].forEach((name) => document.documentElement.style.removeProperty(name));\n    document.getElementById(STYLE_ID)?.remove();\n    root.log.info(\"kapybara-theme\", \"removed\");\n  }\n\n  function readSettings(ctx) {\n    return {\n      preset: ctx.storage.get(\"preset\", DEFAULTS.preset),\n      accent: validColor(ctx.storage.get(\"accent\", DEFAULTS.accent), DEFAULTS.accent),\n      pitchBlack: ctx.storage.get(\"pitchBlack\", DEFAULTS.pitchBlack) !== false,\n      softenCards: ctx.storage.get(\"softenCards\", DEFAULTS.softenCards) !== false,\n    };\n  }\n\n  function palette(settings) {\n    const presets = {\n      black: {\n        bg: settings.pitchBlack ? \"#000000\" : \"#070707\",\n        surface: \"#141414\",\n        surface2: \"#1f1f1f\",\n        line: \"#303030\",\n        text: \"#f4f4f4\",\n        muted: \"#aaaeb6\",\n      },\n      charcoal: {\n        bg: \"#101214\",\n        surface: \"#191d21\",\n        surface2: \"#242a30\",\n        line: \"#36404a\",\n        text: \"#f2f4f7\",\n        muted: \"#a8b0ba\",\n      },\n      blueblack: {\n        bg: \"#080b10\",\n        surface: \"#111827\",\n        surface2: \"#1d2636\",\n        line: \"#334155\",\n        text: \"#f8fafc\",\n        muted: \"#a6b1c2\",\n      },\n    };\n    return presets[settings.preset] || presets.black;\n  }\n\n  function installStyle() {\n    if (document.getElementById(STYLE_ID)) return;\n\n    const style = document.createElement(\"style\");\n    style.id = STYLE_ID;\n    style.textContent = `\n      html[${THEME_ATTR}=\"dark\"]{color-scheme:dark;background:var(--cudloun-kapybara-bg)!important;scrollbar-color:var(--cudloun-kapybara-accent) var(--cudloun-kapybara-bg)}\n      html[${THEME_ATTR}=\"dark\"] body,\n      html[${THEME_ATTR}=\"dark\"] #root{background:var(--cudloun-kapybara-bg)!important;color:var(--cudloun-kapybara-text)!important}\n      html[${THEME_ATTR}=\"dark\"] body::before,\n      html[${THEME_ATTR}=\"dark\"] body::after,\n      html[${THEME_ATTR}=\"dark\"] #root::before,\n      html[${THEME_ATTR}=\"dark\"] #root::after{background:transparent!important;background-image:none!important}\n\n      html[${THEME_ATTR}=\"dark\"] :where(main,header,nav,footer,aside,section,form):not(.cudloun-dialog):not(.cudloun-backdrop):not([class^=\"cudloun-\"]){background-color:var(--cudloun-kapybara-bg)!important;color:var(--cudloun-kapybara-text)!important;border-color:var(--cudloun-kapybara-line)!important}\n      html[${THEME_ATTR}=\"dark\"] :where(.post,.post-main,.message-card,.conversation-item,.bottom-sheet,[role=\"dialog\"],[role=\"menu\"]):not(.cudloun-dialog):not(.cudloun-backdrop):not([class^=\"cudloun-\"]){background:var(--cudloun-kapybara-surface)!important;color:var(--cudloun-kapybara-text)!important;border-color:var(--cudloun-kapybara-line)!important}\n      html[${THEME_ATTR}=\"dark\"] article.post{border-radius:var(--cudloun-kapybara-radius)!important;box-shadow:none!important}\n      html[${THEME_ATTR}=\"dark\"] article.post + article.post{border-top:1px solid var(--cudloun-kapybara-line)!important}\n      html[${THEME_ATTR}=\"dark\"] .post-header,\n      html[${THEME_ATTR}=\"dark\"] .meta,\n      html[${THEME_ATTR}=\"dark\"] .reply-ref,\n      html[${THEME_ATTR}=\"dark\"] .actions,\n      html[${THEME_ATTR}=\"dark\"] .conversation-item{border-color:var(--cudloun-kapybara-line)!important}\n\n      html[${THEME_ATTR}=\"dark\"] :where(.body,.markdown,.post-main,p,li,span,div):not(.cudloun-dialog *):not([class^=\"cudloun-\"]){color:inherit}\n      html[${THEME_ATTR}=\"dark\"] :where(.meta,.reply-ref,time,small,label):not(.cudloun-dialog *):not([class^=\"cudloun-\"]){color:var(--cudloun-kapybara-muted)!important}\n      html[${THEME_ATTR}=\"dark\"] :where(a,.author,.reply-action,button.date):not(.cudloun-dialog *):not([class^=\"cudloun-\"]){color:var(--cudloun-kapybara-accent)!important}\n      html[${THEME_ATTR}=\"dark\"] :where(a):not(.cudloun-dialog *){text-decoration-color:color-mix(in srgb,var(--cudloun-kapybara-accent) 60%,transparent)!important}\n\n      html[${THEME_ATTR}=\"dark\"] :where(button,input,textarea,select):not(.cudloun-dialog *):not([class^=\"cudloun-\"]){background:var(--cudloun-kapybara-surface-2)!important;color:var(--cudloun-kapybara-text)!important;border-color:var(--cudloun-kapybara-line)!important}\n      html[${THEME_ATTR}=\"dark\"] :where(button):not(.cudloun-dialog *):not([class^=\"cudloun-\"]):hover{background:var(--cudloun-kapybara-accent-soft)!important}\n      html[${THEME_ATTR}=\"dark\"] input::placeholder,\n      html[${THEME_ATTR}=\"dark\"] textarea::placeholder{color:var(--cudloun-kapybara-muted)!important}\n\n      html[${THEME_ATTR}=\"dark\"] .avatar,\n      html[${THEME_ATTR}=\"dark\"] .avatar img,\n      html[${THEME_ATTR}=\"dark\"] .avatar-button img,\n      html[${THEME_ATTR}=\"dark\"] .avatar-shell img{background:transparent!important;border-color:transparent!important}\n      html[${THEME_ATTR}=\"dark\"] :where(img,video,canvas):not(.cudloun-mascot){color-scheme:normal}\n      html[${THEME_ATTR}=\"dark\"] :where(hr){border-color:var(--cudloun-kapybara-line)!important}\n    `;\n    document.head.appendChild(style);\n  }\n\n  function makeCheckboxRow(ctx, labelText, key, fallback) {\n    const label = document.createElement(\"label\");\n    label.className = \"cudloun-setting-row\";\n\n    const text = document.createElement(\"span\");\n    text.className = \"cudloun-setting-text\";\n    text.textContent = labelText;\n\n    const input = document.createElement(\"input\");\n    input.type = \"checkbox\";\n    input.checked = ctx.storage.get(key, fallback) !== false;\n    input.addEventListener(\"change\", () => {\n      ctx.storage.set(key, input.checked);\n      apply(ctx);\n    });\n\n    label.appendChild(text);\n    label.appendChild(input);\n    return label;\n  }\n\n  function makeColorRow(ctx, labelText, key, fallback) {\n    const label = document.createElement(\"label\");\n    label.className = \"cudloun-setting-row\";\n\n    const text = document.createElement(\"span\");\n    text.className = \"cudloun-setting-text\";\n    text.textContent = labelText;\n\n    const input = document.createElement(\"input\");\n    input.type = \"color\";\n    input.value = validColor(ctx.storage.get(key, fallback), fallback);\n    input.addEventListener(\"input\", () => {\n      ctx.storage.set(key, input.value);\n      apply(ctx);\n    });\n\n    label.appendChild(text);\n    label.appendChild(input);\n    return label;\n  }\n\n  function makeSelectRow(ctx, labelText, key, options) {\n    const label = document.createElement(\"label\");\n    label.className = \"cudloun-setting-row\";\n\n    const text = document.createElement(\"span\");\n    text.className = \"cudloun-setting-text\";\n    text.textContent = labelText;\n\n    const select = document.createElement(\"select\");\n    select.className = \"cudloun-select\";\n    const current = ctx.storage.get(key, DEFAULTS[key]);\n    options.forEach(([value, name]) => {\n      const option = document.createElement(\"option\");\n      option.value = value;\n      option.textContent = name;\n      option.selected = value === current;\n      select.appendChild(option);\n    });\n    select.addEventListener(\"change\", () => {\n      ctx.storage.set(key, select.value);\n      apply(ctx);\n    });\n\n    label.appendChild(text);\n    label.appendChild(select);\n    return label;\n  }\n\n  function validColor(value, fallback) {\n    const text = String(value || \"\");\n    return /^#[0-9a-f]{6}$/i.test(text) ? text : fallback;\n  }\n\n  function hexToRgba(hex, alpha) {\n    const clean = validColor(hex, DEFAULTS.accent).slice(1);\n    const value = Number.parseInt(clean, 16);\n    const red = (value >> 16) & 255;\n    const green = (value >> 8) & 255;\n    const blue = value & 255;\n    return `rgba(${red},${green},${blue},${alpha})`;\n  }\n})();\n");
  embeddedScripts.set("modules/kapybara-theme.js", function () {
    // Kapybara dark theme.
    (function () {
      "use strict";

      const root = window.Cudloun;
      const STYLE_ID = "cudloun-kapybara-theme-style";
      const THEME_ATTR = "data-cudloun-kapybara-theme";

      const DEFAULTS = {
        preset: "black",
        accent: "#d68a1f",
        pitchBlack: true,
        softenCards: true,
      };

      root.registerModule({
        id: "kapybara-theme",
        name: "Kapybara Theme",
        description: "Dark theme experiment for Kapybara pages.",
        version: "0.1.0",
        defaultEnabled: false,
        start(ctx) {
          apply(ctx);
          return () => cleanup();
        },
        renderSettings(ctx) {
          const wrap = document.createElement("div");
          wrap.className = "cudloun-settings-list";

          wrap.appendChild(makeSelectRow(ctx, "Color preset", "preset", [
            ["black", "Black"],
            ["charcoal", "Charcoal"],
            ["blueblack", "Blue black"],
          ]));
          wrap.appendChild(makeColorRow(ctx, "Accent", "accent", DEFAULTS.accent));
          wrap.appendChild(makeCheckboxRow(ctx, "Pitch black page", "pitchBlack", DEFAULTS.pitchBlack));
          wrap.appendChild(makeCheckboxRow(ctx, "Softer post cards", "softenCards", DEFAULTS.softenCards));

          return wrap;
        },
        renderHelp() {
          return [
            "Enable this module to apply a Cudloun dark theme to Kapybara.",
            "The first pass uses semantic Kapybara classes where possible and keeps generated class overrides minimal.",
            "Disable the module to remove the theme style and return to native Kapybara colors.",
          ];
        },
      });

      function apply(ctx) {
        if (!root.kapyguts?.isKapybara?.()) return;

        const settings = readSettings(ctx);
        document.documentElement.setAttribute(THEME_ATTR, "dark");
        document.documentElement.style.setProperty("--cudloun-kapybara-bg", palette(settings).bg);
        document.documentElement.style.setProperty("--cudloun-kapybara-surface", palette(settings).surface);
        document.documentElement.style.setProperty("--cudloun-kapybara-surface-2", palette(settings).surface2);
        document.documentElement.style.setProperty("--cudloun-kapybara-line", palette(settings).line);
        document.documentElement.style.setProperty("--cudloun-kapybara-text", palette(settings).text);
        document.documentElement.style.setProperty("--cudloun-kapybara-muted", palette(settings).muted);
        document.documentElement.style.setProperty("--cudloun-kapybara-accent", settings.accent);
        document.documentElement.style.setProperty("--cudloun-kapybara-accent-soft", hexToRgba(settings.accent, 0.16));
        document.documentElement.style.setProperty("--cudloun-kapybara-radius", settings.softenCards ? "10px" : "0px");
        installStyle();
        root.log.info("kapybara-theme", "applied", settings);
      }

      function cleanup() {
        document.documentElement.removeAttribute(THEME_ATTR);
        [
          "--cudloun-kapybara-bg",
          "--cudloun-kapybara-surface",
          "--cudloun-kapybara-surface-2",
          "--cudloun-kapybara-line",
          "--cudloun-kapybara-text",
          "--cudloun-kapybara-muted",
          "--cudloun-kapybara-accent",
          "--cudloun-kapybara-accent-soft",
          "--cudloun-kapybara-radius",
        ].forEach((name) => document.documentElement.style.removeProperty(name));
        document.getElementById(STYLE_ID)?.remove();
        root.log.info("kapybara-theme", "removed");
      }

      function readSettings(ctx) {
        return {
          preset: ctx.storage.get("preset", DEFAULTS.preset),
          accent: validColor(ctx.storage.get("accent", DEFAULTS.accent), DEFAULTS.accent),
          pitchBlack: ctx.storage.get("pitchBlack", DEFAULTS.pitchBlack) !== false,
          softenCards: ctx.storage.get("softenCards", DEFAULTS.softenCards) !== false,
        };
      }

      function palette(settings) {
        const presets = {
          black: {
            bg: settings.pitchBlack ? "#000000" : "#070707",
            surface: "#141414",
            surface2: "#1f1f1f",
            line: "#303030",
            text: "#f4f4f4",
            muted: "#aaaeb6",
          },
          charcoal: {
            bg: "#101214",
            surface: "#191d21",
            surface2: "#242a30",
            line: "#36404a",
            text: "#f2f4f7",
            muted: "#a8b0ba",
          },
          blueblack: {
            bg: "#080b10",
            surface: "#111827",
            surface2: "#1d2636",
            line: "#334155",
            text: "#f8fafc",
            muted: "#a6b1c2",
          },
        };
        return presets[settings.preset] || presets.black;
      }

      function installStyle() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
          html[${THEME_ATTR}="dark"]{color-scheme:dark;background:var(--cudloun-kapybara-bg)!important;scrollbar-color:var(--cudloun-kapybara-accent) var(--cudloun-kapybara-bg)}
          html[${THEME_ATTR}="dark"] body,
          html[${THEME_ATTR}="dark"] #root{background:var(--cudloun-kapybara-bg)!important;color:var(--cudloun-kapybara-text)!important}
          html[${THEME_ATTR}="dark"] body::before,
          html[${THEME_ATTR}="dark"] body::after,
          html[${THEME_ATTR}="dark"] #root::before,
          html[${THEME_ATTR}="dark"] #root::after{background:transparent!important;background-image:none!important}

          html[${THEME_ATTR}="dark"] :where(main,header,nav,footer,aside,section,form):not(.cudloun-dialog):not(.cudloun-backdrop):not([class^="cudloun-"]){background-color:var(--cudloun-kapybara-bg)!important;color:var(--cudloun-kapybara-text)!important;border-color:var(--cudloun-kapybara-line)!important}
          html[${THEME_ATTR}="dark"] :where(.post,.post-main,.message-card,.conversation-item,.bottom-sheet,[role="dialog"],[role="menu"]):not(.cudloun-dialog):not(.cudloun-backdrop):not([class^="cudloun-"]){background:var(--cudloun-kapybara-surface)!important;color:var(--cudloun-kapybara-text)!important;border-color:var(--cudloun-kapybara-line)!important}
          html[${THEME_ATTR}="dark"] article.post{border-radius:var(--cudloun-kapybara-radius)!important;box-shadow:none!important}
          html[${THEME_ATTR}="dark"] article.post + article.post{border-top:1px solid var(--cudloun-kapybara-line)!important}
          html[${THEME_ATTR}="dark"] .post-header,
          html[${THEME_ATTR}="dark"] .meta,
          html[${THEME_ATTR}="dark"] .reply-ref,
          html[${THEME_ATTR}="dark"] .actions,
          html[${THEME_ATTR}="dark"] .conversation-item{border-color:var(--cudloun-kapybara-line)!important}

          html[${THEME_ATTR}="dark"] :where(.body,.markdown,.post-main,p,li,span,div):not(.cudloun-dialog *):not([class^="cudloun-"]){color:inherit}
          html[${THEME_ATTR}="dark"] :where(.meta,.reply-ref,time,small,label):not(.cudloun-dialog *):not([class^="cudloun-"]){color:var(--cudloun-kapybara-muted)!important}
          html[${THEME_ATTR}="dark"] :where(a,.author,.reply-action,button.date):not(.cudloun-dialog *):not([class^="cudloun-"]){color:var(--cudloun-kapybara-accent)!important}
          html[${THEME_ATTR}="dark"] :where(a):not(.cudloun-dialog *){text-decoration-color:color-mix(in srgb,var(--cudloun-kapybara-accent) 60%,transparent)!important}

          html[${THEME_ATTR}="dark"] :where(button,input,textarea,select):not(.cudloun-dialog *):not([class^="cudloun-"]){background:var(--cudloun-kapybara-surface-2)!important;color:var(--cudloun-kapybara-text)!important;border-color:var(--cudloun-kapybara-line)!important}
          html[${THEME_ATTR}="dark"] :where(button):not(.cudloun-dialog *):not([class^="cudloun-"]):hover{background:var(--cudloun-kapybara-accent-soft)!important}
          html[${THEME_ATTR}="dark"] input::placeholder,
          html[${THEME_ATTR}="dark"] textarea::placeholder{color:var(--cudloun-kapybara-muted)!important}

          html[${THEME_ATTR}="dark"] .avatar,
          html[${THEME_ATTR}="dark"] .avatar img,
          html[${THEME_ATTR}="dark"] .avatar-button img,
          html[${THEME_ATTR}="dark"] .avatar-shell img{background:transparent!important;border-color:transparent!important}
          html[${THEME_ATTR}="dark"] :where(img,video,canvas):not(.cudloun-mascot){color-scheme:normal}
          html[${THEME_ATTR}="dark"] :where(hr){border-color:var(--cudloun-kapybara-line)!important}
        `;
        document.head.appendChild(style);
      }

      function makeCheckboxRow(ctx, labelText, key, fallback) {
        const label = document.createElement("label");
        label.className = "cudloun-setting-row";

        const text = document.createElement("span");
        text.className = "cudloun-setting-text";
        text.textContent = labelText;

        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = ctx.storage.get(key, fallback) !== false;
        input.addEventListener("change", () => {
          ctx.storage.set(key, input.checked);
          apply(ctx);
        });

        label.appendChild(text);
        label.appendChild(input);
        return label;
      }

      function makeColorRow(ctx, labelText, key, fallback) {
        const label = document.createElement("label");
        label.className = "cudloun-setting-row";

        const text = document.createElement("span");
        text.className = "cudloun-setting-text";
        text.textContent = labelText;

        const input = document.createElement("input");
        input.type = "color";
        input.value = validColor(ctx.storage.get(key, fallback), fallback);
        input.addEventListener("input", () => {
          ctx.storage.set(key, input.value);
          apply(ctx);
        });

        label.appendChild(text);
        label.appendChild(input);
        return label;
      }

      function makeSelectRow(ctx, labelText, key, options) {
        const label = document.createElement("label");
        label.className = "cudloun-setting-row";

        const text = document.createElement("span");
        text.className = "cudloun-setting-text";
        text.textContent = labelText;

        const select = document.createElement("select");
        select.className = "cudloun-select";
        const current = ctx.storage.get(key, DEFAULTS[key]);
        options.forEach(([value, name]) => {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = name;
          option.selected = value === current;
          select.appendChild(option);
        });
        select.addEventListener("change", () => {
          ctx.storage.set(key, select.value);
          apply(ctx);
        });

        label.appendChild(text);
        label.appendChild(select);
        return label;
      }

      function validColor(value, fallback) {
        const text = String(value || "");
        return /^#[0-9a-f]{6}$/i.test(text) ? text : fallback;
      }

      function hexToRgba(hex, alpha) {
        const clean = validColor(hex, DEFAULTS.accent).slice(1);
        const value = Number.parseInt(clean, 16);
        const red = (value >> 16) & 255;
        const green = (value >> 8) & 255;
        const blue = value & 255;
        return `rgba(${red},${green},${blue},${alpha})`;
      }
    })();

  });

  embeddedText.set("modules/thread-lane.js", "// Mobile thread lane for Kapybara reply references.\n(function () {\n  \"use strict\";\n\n  const root = window.Cudloun;\n  const STYLE_ID = \"cudloun-thread-lane-style\";\n  const OPEN_ATTR = \"data-cudloun-thread-lane\";\n  const LANE_CLASS = \"cudloun-thread-lane\";\n  const BACKDROP_CLASS = \"cudloun-thread-lane-backdrop\";\n  const DEFAULTS = {\n    mobileOnly: true,\n    newestFirst: true,\n  };\n\n  let ctxRef = null;\n  let clickHandler = null;\n  let keyHandler = null;\n  let routeTimer = null;\n  let lastRoute = \"\";\n\n  root.registerModule({\n    id: \"thread-lane\",\n    name: \"Thread Lane\",\n    description: \"Mobile side lane for reading a reply thread without leaving chronological view.\",\n    version: \"0.1.0\",\n    defaultEnabled: false,\n    start(ctx) {\n      ctxRef = ctx;\n      installStyles();\n      attach();\n      return () => cleanup();\n    },\n    renderSettings(ctx) {\n      const wrap = document.createElement(\"div\");\n      wrap.className = \"cudloun-settings-list\";\n      wrap.appendChild(makeCheckboxRow(ctx, \"Mobile only\", \"mobileOnly\", DEFAULTS.mobileOnly));\n      wrap.appendChild(makeCheckboxRow(ctx, \"Newest first\", \"newestFirst\", DEFAULTS.newestFirst));\n      return wrap;\n    },\n    renderHelp() {\n      return [\n        \"Tap a Kapybara reply reference such as Re: Lucifer to slide the page left and open the whole visible thread.\",\n        \"Swipe the thread lane right, press Escape, or tap Close to return to the original page.\",\n        \"This first version only uses posts already loaded on the current Kapybara page.\",\n      ];\n    },\n  });\n\n  function attach() {\n    if (!root.kapyguts?.isKapybara?.()) return;\n    if (clickHandler) return;\n\n    clickHandler = (event) => {\n      if (!isAllowedViewport()) return;\n\n      const target = event.target instanceof Element ? event.target : null;\n      const replyRef = target?.closest(root.kapyguts.selectors.replyMeta || \".reply-ref\");\n      if (!replyRef) return;\n\n      const post = replyRef.closest(root.kapyguts.selectors.boardPost || \"article.post\");\n      if (!post) return;\n\n      const threadId = post.getAttribute(\"data-thread-id\") || \"\";\n      if (!threadId) return;\n\n      const posts = threadPosts(threadId);\n      if (posts.length < 2) return;\n\n      event.preventDefault();\n      event.stopPropagation();\n      event.stopImmediatePropagation();\n      openLane({ sourcePost: post, replyRef, threadId, posts });\n    };\n\n    keyHandler = (event) => {\n      if (event.key === \"Escape\") closeLane();\n    };\n\n    document.addEventListener(\"click\", clickHandler, true);\n    document.addEventListener(\"keydown\", keyHandler, true);\n    observeRouteChanges();\n    root.log.info(\"thread-lane\", \"ready\");\n  }\n\n  function cleanup() {\n    closeLane(true);\n    if (clickHandler) document.removeEventListener(\"click\", clickHandler, true);\n    if (keyHandler) document.removeEventListener(\"keydown\", keyHandler, true);\n    clickHandler = null;\n    keyHandler = null;\n    window.clearTimeout(routeTimer);\n    routeTimer = null;\n    document.getElementById(STYLE_ID)?.remove();\n    ctxRef = null;\n    root.log.info(\"thread-lane\", \"removed\");\n  }\n\n  function observeRouteChanges() {\n    lastRoute = root.currentRoute();\n    const check = () => {\n      const route = root.currentRoute();\n      if (route !== lastRoute) {\n        lastRoute = route;\n        closeLane();\n      }\n      routeTimer = window.setTimeout(check, 500);\n    };\n    routeTimer = window.setTimeout(check, 500);\n  }\n\n  function isAllowedViewport() {\n    if (!ctxRef?.storage.get(\"mobileOnly\", DEFAULTS.mobileOnly)) return true;\n    return window.innerWidth <= 760 || window.matchMedia(\"(pointer: coarse)\").matches;\n  }\n\n  function openLane({ sourcePost, replyRef, threadId, posts }) {\n    closeLane();\n\n    const sourceId = sourcePost.getAttribute(\"data-post-id\") || \"\";\n    const title = cleanText(replyRef.textContent) || \"Thread\";\n    const sorted = sortedThreadPosts(posts);\n\n    const backdrop = document.createElement(\"div\");\n    backdrop.className = BACKDROP_CLASS;\n    backdrop.addEventListener(\"click\", (event) => {\n      if (event.target === backdrop) closeLane();\n    });\n\n    const lane = document.createElement(\"aside\");\n    lane.className = LANE_CLASS;\n    lane.setAttribute(\"role\", \"dialog\");\n    lane.setAttribute(\"aria-modal\", \"true\");\n    lane.setAttribute(\"aria-label\", title);\n\n    const header = document.createElement(\"div\");\n    header.className = \"cudloun-thread-lane-head\";\n\n    const titleWrap = document.createElement(\"div\");\n    titleWrap.className = \"cudloun-thread-lane-title-wrap\";\n    const heading = document.createElement(\"h2\");\n    heading.textContent = title;\n    const meta = document.createElement(\"p\");\n    meta.textContent = `${sorted.length} visible posts`;\n    titleWrap.appendChild(heading);\n    titleWrap.appendChild(meta);\n\n    const close = document.createElement(\"button\");\n    close.type = \"button\";\n    close.className = \"cudloun-thread-lane-close\";\n    close.textContent = \"Close\";\n    close.addEventListener(\"click\", closeLane);\n\n    header.appendChild(titleWrap);\n    header.appendChild(close);\n    lane.appendChild(header);\n\n    const list = document.createElement(\"div\");\n    list.className = \"cudloun-thread-lane-list\";\n    sorted.forEach((post) => list.appendChild(renderPostClone(post, sourceId)));\n    lane.appendChild(list);\n\n    backdrop.appendChild(lane);\n    document.body.appendChild(backdrop);\n    installSwipeClose(lane);\n\n    window.requestAnimationFrame(() => {\n      document.documentElement.setAttribute(OPEN_ATTR, \"open\");\n      lane.focus?.();\n    });\n\n    root.log.info(\"thread-lane\", \"opened\", threadId, `${sorted.length} posts`);\n  }\n\n  function closeLane(immediate = false) {\n    document.documentElement.removeAttribute(OPEN_ATTR);\n    const backdrop = document.querySelector(`.${BACKDROP_CLASS}`);\n    if (!backdrop) return;\n\n    if (immediate) {\n      backdrop.remove();\n      return;\n    }\n\n    window.setTimeout(() => {\n      if (!document.documentElement.hasAttribute(OPEN_ATTR)) backdrop.remove();\n    }, 180);\n  }\n\n  function threadPosts(threadId) {\n    return root.kapyguts.allPosts()\n      .filter((post) => post.getAttribute(\"data-thread-id\") === threadId);\n  }\n\n  function sortedThreadPosts(posts) {\n    const newestFirst = ctxRef?.storage.get(\"newestFirst\", DEFAULTS.newestFirst) !== false;\n    return posts.slice().sort((a, b) => {\n      const aId = numericPostId(a);\n      const bId = numericPostId(b);\n      if (aId !== bId) return newestFirst ? bId - aId : aId - bId;\n      return posts.indexOf(a) - posts.indexOf(b);\n    });\n  }\n\n  function renderPostClone(post, sourceId) {\n    const clone = post.cloneNode(true);\n    clone.classList.add(\"cudloun-thread-lane-post\");\n    clone.removeAttribute(\"id\");\n    clone.querySelectorAll(\"[id]\").forEach((node) => node.removeAttribute(\"id\"));\n    clone.querySelectorAll(\"button, input, textarea, select\").forEach((node) => {\n      node.disabled = true;\n      node.setAttribute(\"aria-disabled\", \"true\");\n    });\n    clone.querySelectorAll(\"a\").forEach((node) => {\n      node.addEventListener(\"click\", (event) => event.stopPropagation());\n    });\n    if ((post.getAttribute(\"data-post-id\") || \"\") === sourceId) {\n      clone.dataset.threadLaneSource = \"true\";\n    }\n    return clone;\n  }\n\n  function installSwipeClose(lane) {\n    let startX = 0;\n    let startY = 0;\n    let tracking = false;\n\n    lane.addEventListener(\"pointerdown\", (event) => {\n      if (event.pointerType === \"mouse\") return;\n      tracking = true;\n      startX = event.clientX;\n      startY = event.clientY;\n      lane.setPointerCapture?.(event.pointerId);\n    });\n\n    lane.addEventListener(\"pointerup\", (event) => {\n      if (!tracking) return;\n      tracking = false;\n      const dx = event.clientX - startX;\n      const dy = event.clientY - startY;\n      if (dx > 72 && Math.abs(dx) > Math.abs(dy) * 1.4) closeLane();\n    });\n\n    lane.addEventListener(\"pointercancel\", () => {\n      tracking = false;\n    });\n  }\n\n  function installStyles() {\n    if (document.getElementById(STYLE_ID)) return;\n\n    const style = document.createElement(\"style\");\n    style.id = STYLE_ID;\n    style.textContent = `\n      html[${OPEN_ATTR}=\"open\"]{overflow:hidden}\n      html[${OPEN_ATTR}=\"open\"] #root{transform:translateX(-34vw);transition:transform 180ms ease;will-change:transform}\n      html:not([${OPEN_ATTR}=\"open\"]) #root{transition:transform 180ms ease}\n      .${BACKDROP_CLASS}{position:fixed;inset:0;z-index:1500;background:rgba(0,0,0,.18);pointer-events:none}\n      .${LANE_CLASS}{box-sizing:border-box;position:absolute;top:0;right:0;width:min(92vw,430px);height:100dvh;display:flex;flex-direction:column;overflow:hidden;transform:translateX(104%);transition:transform 180ms ease;background:#f8fafc;color:#182230;border-left:1px solid rgba(79,102,134,.22);box-shadow:-18px 0 42px rgba(0,0,0,.24);pointer-events:auto;font-family:inherit}\n      html[${OPEN_ATTR}=\"open\"] .${LANE_CLASS}{transform:translateX(0)}\n      .cudloun-thread-lane-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 12px 10px;border-bottom:1px solid rgba(79,102,134,.18);background:#fff;flex:0 0 auto}\n      .cudloun-thread-lane-title-wrap{min-width:0}\n      .cudloun-thread-lane-title-wrap h2{margin:0;color:#182230;font-size:1rem;line-height:1.2;letter-spacing:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n      .cudloun-thread-lane-title-wrap p{margin:3px 0 0;color:#697586;font-size:.78rem;line-height:1.25}\n      .cudloun-thread-lane-close{appearance:none;border:1px solid rgba(79,102,134,.24);border-radius:6px;background:#f8fafc;color:#243041;cursor:pointer;font:700 .82rem/1.2 inherit;padding:7px 9px}\n      .cudloun-thread-lane-list{flex:1 1 auto;min-height:0;overflow:auto;padding:8px;background:#edf2f7}\n      .cudloun-thread-lane-post{box-sizing:border-box;width:100%!important;margin:0 0 8px!important;border-radius:8px!important;border:1px solid rgba(79,102,134,.18)!important;background:#fff!important;box-shadow:none!important}\n      .cudloun-thread-lane-post[data-thread-lane-source=true]{outline:2px solid rgba(8,126,164,.45);outline-offset:0}\n      .cudloun-thread-lane-post .post-menu-button{display:none!important}\n      html[data-cudloun-kapybara-theme=\"dark\"] .${LANE_CLASS}{background:var(--cudloun-kapybara-bg,#000);color:var(--cudloun-kapybara-text,#f4f4f4);border-color:var(--cudloun-kapybara-line,#303030)}\n      html[data-cudloun-kapybara-theme=\"dark\"] .cudloun-thread-lane-head{background:var(--cudloun-kapybara-surface,#141414);border-color:var(--cudloun-kapybara-line,#303030)}\n      html[data-cudloun-kapybara-theme=\"dark\"] .cudloun-thread-lane-title-wrap h2{color:var(--cudloun-kapybara-text,#f4f4f4)}\n      html[data-cudloun-kapybara-theme=\"dark\"] .cudloun-thread-lane-title-wrap p{color:var(--cudloun-kapybara-muted,#aaaeb6)}\n      html[data-cudloun-kapybara-theme=\"dark\"] .cudloun-thread-lane-close{background:var(--cudloun-kapybara-surface-2,#1f1f1f);color:var(--cudloun-kapybara-text,#f4f4f4);border-color:var(--cudloun-kapybara-line,#303030)}\n      html[data-cudloun-kapybara-theme=\"dark\"] .cudloun-thread-lane-list{background:var(--cudloun-kapybara-bg,#000)}\n      html[data-cudloun-kapybara-theme=\"dark\"] .cudloun-thread-lane-post{background:var(--cudloun-kapybara-surface,#141414)!important;border-color:var(--cudloun-kapybara-line,#303030)!important}\n    `;\n    document.head.appendChild(style);\n  }\n\n  function makeCheckboxRow(ctx, labelText, key, fallback) {\n    const label = document.createElement(\"label\");\n    label.className = \"cudloun-setting-row\";\n\n    const text = document.createElement(\"span\");\n    text.className = \"cudloun-setting-text\";\n    text.textContent = labelText;\n\n    const input = document.createElement(\"input\");\n    input.type = \"checkbox\";\n    input.checked = ctx.storage.get(key, fallback) !== false;\n    input.addEventListener(\"change\", () => ctx.storage.set(key, input.checked));\n\n    label.appendChild(text);\n    label.appendChild(input);\n    return label;\n  }\n\n  function numericPostId(post) {\n    const value = Number.parseInt(post.getAttribute(\"data-post-id\") || \"0\", 10);\n    return Number.isFinite(value) ? value : 0;\n  }\n\n  function cleanText(value) {\n    return String(value || \"\").replace(/\\s+/g, \" \").trim();\n  }\n})();\n");
  embeddedScripts.set("modules/thread-lane.js", function () {
    // Mobile thread lane for Kapybara reply references.
    (function () {
      "use strict";

      const root = window.Cudloun;
      const STYLE_ID = "cudloun-thread-lane-style";
      const OPEN_ATTR = "data-cudloun-thread-lane";
      const LANE_CLASS = "cudloun-thread-lane";
      const BACKDROP_CLASS = "cudloun-thread-lane-backdrop";
      const DEFAULTS = {
        mobileOnly: true,
        newestFirst: true,
      };

      let ctxRef = null;
      let clickHandler = null;
      let keyHandler = null;
      let routeTimer = null;
      let lastRoute = "";

      root.registerModule({
        id: "thread-lane",
        name: "Thread Lane",
        description: "Mobile side lane for reading a reply thread without leaving chronological view.",
        version: "0.1.0",
        defaultEnabled: false,
        start(ctx) {
          ctxRef = ctx;
          installStyles();
          attach();
          return () => cleanup();
        },
        renderSettings(ctx) {
          const wrap = document.createElement("div");
          wrap.className = "cudloun-settings-list";
          wrap.appendChild(makeCheckboxRow(ctx, "Mobile only", "mobileOnly", DEFAULTS.mobileOnly));
          wrap.appendChild(makeCheckboxRow(ctx, "Newest first", "newestFirst", DEFAULTS.newestFirst));
          return wrap;
        },
        renderHelp() {
          return [
            "Tap a Kapybara reply reference such as Re: Lucifer to slide the page left and open the whole visible thread.",
            "Swipe the thread lane right, press Escape, or tap Close to return to the original page.",
            "This first version only uses posts already loaded on the current Kapybara page.",
          ];
        },
      });

      function attach() {
        if (!root.kapyguts?.isKapybara?.()) return;
        if (clickHandler) return;

        clickHandler = (event) => {
          if (!isAllowedViewport()) return;

          const target = event.target instanceof Element ? event.target : null;
          const replyRef = target?.closest(root.kapyguts.selectors.replyMeta || ".reply-ref");
          if (!replyRef) return;

          const post = replyRef.closest(root.kapyguts.selectors.boardPost || "article.post");
          if (!post) return;

          const threadId = post.getAttribute("data-thread-id") || "";
          if (!threadId) return;

          const posts = threadPosts(threadId);
          if (posts.length < 2) return;

          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          openLane({ sourcePost: post, replyRef, threadId, posts });
        };

        keyHandler = (event) => {
          if (event.key === "Escape") closeLane();
        };

        document.addEventListener("click", clickHandler, true);
        document.addEventListener("keydown", keyHandler, true);
        observeRouteChanges();
        root.log.info("thread-lane", "ready");
      }

      function cleanup() {
        closeLane(true);
        if (clickHandler) document.removeEventListener("click", clickHandler, true);
        if (keyHandler) document.removeEventListener("keydown", keyHandler, true);
        clickHandler = null;
        keyHandler = null;
        window.clearTimeout(routeTimer);
        routeTimer = null;
        document.getElementById(STYLE_ID)?.remove();
        ctxRef = null;
        root.log.info("thread-lane", "removed");
      }

      function observeRouteChanges() {
        lastRoute = root.currentRoute();
        const check = () => {
          const route = root.currentRoute();
          if (route !== lastRoute) {
            lastRoute = route;
            closeLane();
          }
          routeTimer = window.setTimeout(check, 500);
        };
        routeTimer = window.setTimeout(check, 500);
      }

      function isAllowedViewport() {
        if (!ctxRef?.storage.get("mobileOnly", DEFAULTS.mobileOnly)) return true;
        return window.innerWidth <= 760 || window.matchMedia("(pointer: coarse)").matches;
      }

      function openLane({ sourcePost, replyRef, threadId, posts }) {
        closeLane();

        const sourceId = sourcePost.getAttribute("data-post-id") || "";
        const title = cleanText(replyRef.textContent) || "Thread";
        const sorted = sortedThreadPosts(posts);

        const backdrop = document.createElement("div");
        backdrop.className = BACKDROP_CLASS;
        backdrop.addEventListener("click", (event) => {
          if (event.target === backdrop) closeLane();
        });

        const lane = document.createElement("aside");
        lane.className = LANE_CLASS;
        lane.setAttribute("role", "dialog");
        lane.setAttribute("aria-modal", "true");
        lane.setAttribute("aria-label", title);

        const header = document.createElement("div");
        header.className = "cudloun-thread-lane-head";

        const titleWrap = document.createElement("div");
        titleWrap.className = "cudloun-thread-lane-title-wrap";
        const heading = document.createElement("h2");
        heading.textContent = title;
        const meta = document.createElement("p");
        meta.textContent = `${sorted.length} visible posts`;
        titleWrap.appendChild(heading);
        titleWrap.appendChild(meta);

        const close = document.createElement("button");
        close.type = "button";
        close.className = "cudloun-thread-lane-close";
        close.textContent = "Close";
        close.addEventListener("click", closeLane);

        header.appendChild(titleWrap);
        header.appendChild(close);
        lane.appendChild(header);

        const list = document.createElement("div");
        list.className = "cudloun-thread-lane-list";
        sorted.forEach((post) => list.appendChild(renderPostClone(post, sourceId)));
        lane.appendChild(list);

        backdrop.appendChild(lane);
        document.body.appendChild(backdrop);
        installSwipeClose(lane);

        window.requestAnimationFrame(() => {
          document.documentElement.setAttribute(OPEN_ATTR, "open");
          lane.focus?.();
        });

        root.log.info("thread-lane", "opened", threadId, `${sorted.length} posts`);
      }

      function closeLane(immediate = false) {
        document.documentElement.removeAttribute(OPEN_ATTR);
        const backdrop = document.querySelector(`.${BACKDROP_CLASS}`);
        if (!backdrop) return;

        if (immediate) {
          backdrop.remove();
          return;
        }

        window.setTimeout(() => {
          if (!document.documentElement.hasAttribute(OPEN_ATTR)) backdrop.remove();
        }, 180);
      }

      function threadPosts(threadId) {
        return root.kapyguts.allPosts()
          .filter((post) => post.getAttribute("data-thread-id") === threadId);
      }

      function sortedThreadPosts(posts) {
        const newestFirst = ctxRef?.storage.get("newestFirst", DEFAULTS.newestFirst) !== false;
        return posts.slice().sort((a, b) => {
          const aId = numericPostId(a);
          const bId = numericPostId(b);
          if (aId !== bId) return newestFirst ? bId - aId : aId - bId;
          return posts.indexOf(a) - posts.indexOf(b);
        });
      }

      function renderPostClone(post, sourceId) {
        const clone = post.cloneNode(true);
        clone.classList.add("cudloun-thread-lane-post");
        clone.removeAttribute("id");
        clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
        clone.querySelectorAll("button, input, textarea, select").forEach((node) => {
          node.disabled = true;
          node.setAttribute("aria-disabled", "true");
        });
        clone.querySelectorAll("a").forEach((node) => {
          node.addEventListener("click", (event) => event.stopPropagation());
        });
        if ((post.getAttribute("data-post-id") || "") === sourceId) {
          clone.dataset.threadLaneSource = "true";
        }
        return clone;
      }

      function installSwipeClose(lane) {
        let startX = 0;
        let startY = 0;
        let tracking = false;

        lane.addEventListener("pointerdown", (event) => {
          if (event.pointerType === "mouse") return;
          tracking = true;
          startX = event.clientX;
          startY = event.clientY;
          lane.setPointerCapture?.(event.pointerId);
        });

        lane.addEventListener("pointerup", (event) => {
          if (!tracking) return;
          tracking = false;
          const dx = event.clientX - startX;
          const dy = event.clientY - startY;
          if (dx > 72 && Math.abs(dx) > Math.abs(dy) * 1.4) closeLane();
        });

        lane.addEventListener("pointercancel", () => {
          tracking = false;
        });
      }

      function installStyles() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
          html[${OPEN_ATTR}="open"]{overflow:hidden}
          html[${OPEN_ATTR}="open"] #root{transform:translateX(-34vw);transition:transform 180ms ease;will-change:transform}
          html:not([${OPEN_ATTR}="open"]) #root{transition:transform 180ms ease}
          .${BACKDROP_CLASS}{position:fixed;inset:0;z-index:1500;background:rgba(0,0,0,.18);pointer-events:none}
          .${LANE_CLASS}{box-sizing:border-box;position:absolute;top:0;right:0;width:min(92vw,430px);height:100dvh;display:flex;flex-direction:column;overflow:hidden;transform:translateX(104%);transition:transform 180ms ease;background:#f8fafc;color:#182230;border-left:1px solid rgba(79,102,134,.22);box-shadow:-18px 0 42px rgba(0,0,0,.24);pointer-events:auto;font-family:inherit}
          html[${OPEN_ATTR}="open"] .${LANE_CLASS}{transform:translateX(0)}
          .cudloun-thread-lane-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 12px 10px;border-bottom:1px solid rgba(79,102,134,.18);background:#fff;flex:0 0 auto}
          .cudloun-thread-lane-title-wrap{min-width:0}
          .cudloun-thread-lane-title-wrap h2{margin:0;color:#182230;font-size:1rem;line-height:1.2;letter-spacing:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
          .cudloun-thread-lane-title-wrap p{margin:3px 0 0;color:#697586;font-size:.78rem;line-height:1.25}
          .cudloun-thread-lane-close{appearance:none;border:1px solid rgba(79,102,134,.24);border-radius:6px;background:#f8fafc;color:#243041;cursor:pointer;font:700 .82rem/1.2 inherit;padding:7px 9px}
          .cudloun-thread-lane-list{flex:1 1 auto;min-height:0;overflow:auto;padding:8px;background:#edf2f7}
          .cudloun-thread-lane-post{box-sizing:border-box;width:100%!important;margin:0 0 8px!important;border-radius:8px!important;border:1px solid rgba(79,102,134,.18)!important;background:#fff!important;box-shadow:none!important}
          .cudloun-thread-lane-post[data-thread-lane-source=true]{outline:2px solid rgba(8,126,164,.45);outline-offset:0}
          .cudloun-thread-lane-post .post-menu-button{display:none!important}
          html[data-cudloun-kapybara-theme="dark"] .${LANE_CLASS}{background:var(--cudloun-kapybara-bg,#000);color:var(--cudloun-kapybara-text,#f4f4f4);border-color:var(--cudloun-kapybara-line,#303030)}
          html[data-cudloun-kapybara-theme="dark"] .cudloun-thread-lane-head{background:var(--cudloun-kapybara-surface,#141414);border-color:var(--cudloun-kapybara-line,#303030)}
          html[data-cudloun-kapybara-theme="dark"] .cudloun-thread-lane-title-wrap h2{color:var(--cudloun-kapybara-text,#f4f4f4)}
          html[data-cudloun-kapybara-theme="dark"] .cudloun-thread-lane-title-wrap p{color:var(--cudloun-kapybara-muted,#aaaeb6)}
          html[data-cudloun-kapybara-theme="dark"] .cudloun-thread-lane-close{background:var(--cudloun-kapybara-surface-2,#1f1f1f);color:var(--cudloun-kapybara-text,#f4f4f4);border-color:var(--cudloun-kapybara-line,#303030)}
          html[data-cudloun-kapybara-theme="dark"] .cudloun-thread-lane-list{background:var(--cudloun-kapybara-bg,#000)}
          html[data-cudloun-kapybara-theme="dark"] .cudloun-thread-lane-post{background:var(--cudloun-kapybara-surface,#141414)!important;border-color:var(--cudloun-kapybara-line,#303030)!important}
        `;
        document.head.appendChild(style);
      }

      function makeCheckboxRow(ctx, labelText, key, fallback) {
        const label = document.createElement("label");
        label.className = "cudloun-setting-row";

        const text = document.createElement("span");
        text.className = "cudloun-setting-text";
        text.textContent = labelText;

        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = ctx.storage.get(key, fallback) !== false;
        input.addEventListener("change", () => ctx.storage.set(key, input.checked));

        label.appendChild(text);
        label.appendChild(input);
        return label;
      }

      function numericPostId(post) {
        const value = Number.parseInt(post.getAttribute("data-post-id") || "0", 10);
        return Number.isFinite(value) ? value : 0;
      }

      function cleanText(value) {
        return String(value || "").replace(/\s+/g, " ").trim();
      }
    })();

  });

  embeddedText.set("modules/classic-look.js", "// Classic Okoun reading style for Kapybara without replacing its native UI.\n(function () {\n  \"use strict\";\n\n  const root = window.Cudloun;\n  const STYLE_ID = \"cudloun-classic-look-style\";\n  const THEME_ATTR = \"data-cudloun-classic-look\";\n  const VERSION = \"0.1.2\";\n  const VIEWPORT_STRIPES_SELECTOR = root.kapyguts?.selectors?.viewportStripes || \".🐟-stripes\";\n  const TOKENS = Object.freeze({\n    fontFamily: \"Verdana, \\\"Bitstream Vera Sans\\\", Arial, sans-serif\",\n    baseSize: \"15px\",\n    contentSize: \"16px\",\n    contentLineHeight: \"1.5\",\n    postBackground: \"#ffffff\",\n    text: \"#000000\",\n    muted: \"#666633\",\n    divider: \"#80aaff\",\n    softDivider: \"#c0d4ff\",\n    action: \"#7b8495\",\n    avatarBackground: \"#fffbf7\",\n    avatarBorder: \"#cccccc\",\n  });\n\n  root.classicLook = {\n    version: VERSION,\n    tokens: { ...TOKENS },\n  };\n\n  root.registerModule({\n    id: \"classic-look\",\n    name: \"Classic Look\",\n    description: \"Classic Okoun typography and clearly divided posts on Kapybara.\",\n    version: VERSION,\n    defaultEnabled: false,\n    start(ctx) {\n      if (!root.kapyguts?.isKapybara?.()) return null;\n      apply();\n      ctx.log.info(\"classic look ready\");\n      return cleanup;\n    },\n    renderSettings() {\n      const wrap = document.createElement(\"div\");\n      wrap.className = \"cudloun-settings-list\";\n      const row = document.createElement(\"div\");\n      row.className = \"cudloun-setting-row\";\n      const text = document.createElement(\"div\");\n      text.className = \"cudloun-setting-text\";\n      text.textContent = \"Uses classic Verdana sizing, square avatars, white post rows, compact metadata, and strong dividers while leaving Kapybara navigation and controls intact.\";\n      row.appendChild(text);\n      wrap.appendChild(row);\n      return wrap;\n    },\n    renderHelp() {\n      return [\n        \"Classic Look changes presentation only. Kapybara's sticky headers, menus, composer, replies, reactions, and mobile navigation remain native.\",\n        \"Post Fonts can still override the displayed post font and size when both modules are enabled.\",\n        \"Disable Classic Look to remove every style and return immediately to Kapybara's current appearance.\",\n      ];\n    },\n  });\n\n  function apply() {\n    document.documentElement.setAttribute(THEME_ATTR, \"true\");\n    installStyle();\n  }\n\n  function cleanup() {\n    document.documentElement.removeAttribute(THEME_ATTR);\n    document.getElementById(STYLE_ID)?.remove();\n  }\n\n  function installStyle() {\n    if (document.getElementById(STYLE_ID)) return;\n    const style = document.createElement(\"style\");\n    style.id = STYLE_ID;\n    style.textContent = `\n      html[${THEME_ATTR}=\"true\"] body{\n        font-family:${TOKENS.fontFamily}!important;\n        font-size:${TOKENS.baseSize};\n        line-height:1.5;\n      }\n      html[${THEME_ATTR}=\"true\"] ${VIEWPORT_STRIPES_SELECTOR}{\n        background:none!important;\n        background-image:none!important;\n      }\n      html[${THEME_ATTR}=\"true\"] :where(.🐟-header,header.board-header,nav.mobile-bottom-nav,section.new-post-composer,section.reply-composer),\n      html[${THEME_ATTR}=\"true\"] :where(.🐟-header,header.board-header,nav.mobile-bottom-nav,section.new-post-composer,section.reply-composer) :where(button,input,select,textarea):not(.cudloun-post-fonts-control *){\n        font-family:${TOKENS.fontFamily}!important;\n      }\n\n      html[${THEME_ATTR}=\"true\"] main .posts:has(> article.post){\n        gap:0!important;\n        background:${TOKENS.postBackground}!important;\n      }\n\n      html[${THEME_ATTR}=\"true\"] article.post{\n        box-sizing:border-box!important;\n        grid-template-columns:54px minmax(0,1fr)!important;\n        gap:10px!important;\n        padding:11px 12px 8px 4px!important;\n        margin:0!important;\n        border:0!important;\n        border-bottom:2px solid ${TOKENS.divider}!important;\n        border-radius:0!important;\n        background:${TOKENS.postBackground}!important;\n        color:${TOKENS.text}!important;\n        box-shadow:none!important;\n        font-family:${TOKENS.fontFamily}!important;\n        font-size:${TOKENS.baseSize}!important;\n        line-height:1.5!important;\n      }\n      html[${THEME_ATTR}=\"true\"] article.post:first-of-type{\n        border-top:2px solid ${TOKENS.divider}!important;\n      }\n      html[${THEME_ATTR}=\"true\"] article.post .avatar-col{\n        width:52px!important;\n        min-width:52px!important;\n        align-items:flex-start!important;\n        justify-content:flex-start!important;\n        padding-top:3px!important;\n      }\n      html[${THEME_ATTR}=\"true\"] article.post .avatar,\n      html[${THEME_ATTR}=\"true\"] article.post .avatar img{\n        box-sizing:border-box!important;\n        width:52px!important;\n        height:52px!important;\n        min-width:52px!important;\n        border-radius:0!important;\n      }\n      html[${THEME_ATTR}=\"true\"] article.post .avatar{\n        border:1px dotted ${TOKENS.avatarBorder}!important;\n        background:${TOKENS.avatarBackground}!important;\n      }\n      html[${THEME_ATTR}=\"true\"] article.post .avatar img{\n        border:0!important;\n        object-fit:cover!important;\n      }\n      html[${THEME_ATTR}=\"true\"] article.post .post-main{\n        min-width:0!important;\n      }\n      html[${THEME_ATTR}=\"true\"] article.post .post-header{\n        min-height:25px!important;\n        height:auto!important;\n        align-items:flex-start!important;\n        gap:8px!important;\n        margin:0 0 5px!important;\n        line-height:1.5!important;\n      }\n      html[${THEME_ATTR}=\"true\"] article.post .identity{\n        min-width:0!important;\n        padding-top:1px!important;\n      }\n      html[${THEME_ATTR}=\"true\"] article.post .author{\n        color:${TOKENS.text}!important;\n        font-family:${TOKENS.fontFamily}!important;\n        font-size:${TOKENS.contentSize}!important;\n        font-weight:700!important;\n        line-height:1.5!important;\n      }\n      html[${THEME_ATTR}=\"true\"] article.post .meta{\n        align-items:flex-start!important;\n        margin-left:auto!important;\n        color:${TOKENS.muted}!important;\n        font-family:${TOKENS.fontFamily}!important;\n        font-size:12px!important;\n        line-height:18px!important;\n      }\n      html[${THEME_ATTR}=\"true\"] article.post button.date{\n        color:${TOKENS.muted}!important;\n        font-family:${TOKENS.fontFamily}!important;\n        font-size:12px!important;\n        line-height:18px!important;\n      }\n      html[${THEME_ATTR}=\"true\"] article.post .body,\n      html[${THEME_ATTR}=\"true\"] article.post .body .markdown{\n        color:${TOKENS.text}!important;\n        font-family:${TOKENS.fontFamily}!important;\n        font-size:${TOKENS.contentSize}!important;\n        line-height:${TOKENS.contentLineHeight}!important;\n      }\n      html[${THEME_ATTR}=\"true\"] article.post .body{\n        padding-right:8px!important;\n      }\n      html[${THEME_ATTR}=\"true\"] article.post .markdown :where(p,ul,ol,blockquote,pre){\n        margin-top:0!important;\n      }\n      html[${THEME_ATTR}=\"true\"] article.post .markdown p:last-child{\n        margin-bottom:0!important;\n      }\n      html[${THEME_ATTR}=\"true\"] article.post .actions{\n        min-height:24px!important;\n        align-items:center!important;\n        gap:8px!important;\n        margin:7px 0 0!important;\n        padding:3px 0 0!important;\n        border-top:1px solid ${TOKENS.softDivider}!important;\n        color:${TOKENS.action}!important;\n        font-family:${TOKENS.fontFamily}!important;\n        font-size:12px!important;\n        line-height:18px!important;\n      }\n      html[${THEME_ATTR}=\"true\"] article.post .reply-action{\n        min-height:22px!important;\n        padding:2px 4px!important;\n        color:${TOKENS.action}!important;\n        font-family:${TOKENS.fontFamily}!important;\n        font-size:12px!important;\n        line-height:16px!important;\n      }\n      html[${THEME_ATTR}=\"true\"] article.post .reply-ref{\n        color:${TOKENS.action}!important;\n        font-family:${TOKENS.fontFamily}!important;\n        font-size:12px!important;\n        line-height:18px!important;\n      }\n      html[${THEME_ATTR}=\"true\"] article.post :where(.reply-link,.reply-link-text){\n        font-family:${TOKENS.fontFamily}!important;\n        font-size:12px!important;\n      }\n\n      html[${THEME_ATTR}=\"true\"][data-cudloun-kapybara-theme=\"dark\"] article.post{\n        background:var(--cudloun-kapybara-surface,#141414)!important;\n        color:var(--cudloun-kapybara-text,#f4f4f4)!important;\n        border-color:#43638f!important;\n      }\n      html[${THEME_ATTR}=\"true\"][data-cudloun-kapybara-theme=\"dark\"] main .posts:has(> article.post){\n        background:var(--cudloun-kapybara-surface,#141414)!important;\n      }\n      html[${THEME_ATTR}=\"true\"][data-cudloun-kapybara-theme=\"dark\"] article.post :where(.author,.body,.markdown){\n        color:var(--cudloun-kapybara-text,#f4f4f4)!important;\n      }\n      html[${THEME_ATTR}=\"true\"][data-cudloun-kapybara-theme=\"dark\"] article.post :where(.meta,button.date,.actions,.reply-action,.reply-ref){\n        color:var(--cudloun-kapybara-muted,#aaaeb6)!important;\n      }\n      html[${THEME_ATTR}=\"true\"][data-cudloun-kapybara-theme=\"dark\"] article.post .actions{\n        border-color:var(--cudloun-kapybara-line,#303030)!important;\n      }\n\n      @media(max-width:700px){\n        html[${THEME_ATTR}=\"true\"] article.post{\n          grid-template-columns:44px minmax(0,1fr)!important;\n          gap:8px!important;\n          padding:9px 8px 7px 4px!important;\n        }\n        html[${THEME_ATTR}=\"true\"] article.post .avatar-col{\n          width:42px!important;\n          min-width:42px!important;\n          padding-top:2px!important;\n        }\n        html[${THEME_ATTR}=\"true\"] article.post .avatar,\n        html[${THEME_ATTR}=\"true\"] article.post .avatar img{\n          width:42px!important;\n          height:42px!important;\n          min-width:42px!important;\n        }\n        html[${THEME_ATTR}=\"true\"] article.post .post-header{\n          gap:5px!important;\n          margin-bottom:4px!important;\n        }\n        html[${THEME_ATTR}=\"true\"] article.post .author,\n        html[${THEME_ATTR}=\"true\"] article.post .body,\n        html[${THEME_ATTR}=\"true\"] article.post .body .markdown{\n          font-size:15px!important;\n          line-height:1.5!important;\n        }\n        html[${THEME_ATTR}=\"true\"] article.post .actions{\n          gap:5px!important;\n          margin-top:6px!important;\n        }\n      }\n    `;\n    document.head.appendChild(style);\n  }\n})();\n");
  embeddedScripts.set("modules/classic-look.js", function () {
    // Classic Okoun reading style for Kapybara without replacing its native UI.
    (function () {
      "use strict";

      const root = window.Cudloun;
      const STYLE_ID = "cudloun-classic-look-style";
      const THEME_ATTR = "data-cudloun-classic-look";
      const VERSION = "0.1.2";
      const VIEWPORT_STRIPES_SELECTOR = root.kapyguts?.selectors?.viewportStripes || ".🐟-stripes";
      const TOKENS = Object.freeze({
        fontFamily: "Verdana, \"Bitstream Vera Sans\", Arial, sans-serif",
        baseSize: "15px",
        contentSize: "16px",
        contentLineHeight: "1.5",
        postBackground: "#ffffff",
        text: "#000000",
        muted: "#666633",
        divider: "#80aaff",
        softDivider: "#c0d4ff",
        action: "#7b8495",
        avatarBackground: "#fffbf7",
        avatarBorder: "#cccccc",
      });

      root.classicLook = {
        version: VERSION,
        tokens: { ...TOKENS },
      };

      root.registerModule({
        id: "classic-look",
        name: "Classic Look",
        description: "Classic Okoun typography and clearly divided posts on Kapybara.",
        version: VERSION,
        defaultEnabled: false,
        start(ctx) {
          if (!root.kapyguts?.isKapybara?.()) return null;
          apply();
          ctx.log.info("classic look ready");
          return cleanup;
        },
        renderSettings() {
          const wrap = document.createElement("div");
          wrap.className = "cudloun-settings-list";
          const row = document.createElement("div");
          row.className = "cudloun-setting-row";
          const text = document.createElement("div");
          text.className = "cudloun-setting-text";
          text.textContent = "Uses classic Verdana sizing, square avatars, white post rows, compact metadata, and strong dividers while leaving Kapybara navigation and controls intact.";
          row.appendChild(text);
          wrap.appendChild(row);
          return wrap;
        },
        renderHelp() {
          return [
            "Classic Look changes presentation only. Kapybara's sticky headers, menus, composer, replies, reactions, and mobile navigation remain native.",
            "Post Fonts can still override the displayed post font and size when both modules are enabled.",
            "Disable Classic Look to remove every style and return immediately to Kapybara's current appearance.",
          ];
        },
      });

      function apply() {
        document.documentElement.setAttribute(THEME_ATTR, "true");
        installStyle();
      }

      function cleanup() {
        document.documentElement.removeAttribute(THEME_ATTR);
        document.getElementById(STYLE_ID)?.remove();
      }

      function installStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
          html[${THEME_ATTR}="true"] body{
            font-family:${TOKENS.fontFamily}!important;
            font-size:${TOKENS.baseSize};
            line-height:1.5;
          }
          html[${THEME_ATTR}="true"] ${VIEWPORT_STRIPES_SELECTOR}{
            background:none!important;
            background-image:none!important;
          }
          html[${THEME_ATTR}="true"] :where(.🐟-header,header.board-header,nav.mobile-bottom-nav,section.new-post-composer,section.reply-composer),
          html[${THEME_ATTR}="true"] :where(.🐟-header,header.board-header,nav.mobile-bottom-nav,section.new-post-composer,section.reply-composer) :where(button,input,select,textarea):not(.cudloun-post-fonts-control *){
            font-family:${TOKENS.fontFamily}!important;
          }

          html[${THEME_ATTR}="true"] main .posts:has(> article.post){
            gap:0!important;
            background:${TOKENS.postBackground}!important;
          }

          html[${THEME_ATTR}="true"] article.post{
            box-sizing:border-box!important;
            grid-template-columns:54px minmax(0,1fr)!important;
            gap:10px!important;
            padding:11px 12px 8px 4px!important;
            margin:0!important;
            border:0!important;
            border-bottom:2px solid ${TOKENS.divider}!important;
            border-radius:0!important;
            background:${TOKENS.postBackground}!important;
            color:${TOKENS.text}!important;
            box-shadow:none!important;
            font-family:${TOKENS.fontFamily}!important;
            font-size:${TOKENS.baseSize}!important;
            line-height:1.5!important;
          }
          html[${THEME_ATTR}="true"] article.post:first-of-type{
            border-top:2px solid ${TOKENS.divider}!important;
          }
          html[${THEME_ATTR}="true"] article.post .avatar-col{
            width:52px!important;
            min-width:52px!important;
            align-items:flex-start!important;
            justify-content:flex-start!important;
            padding-top:3px!important;
          }
          html[${THEME_ATTR}="true"] article.post .avatar,
          html[${THEME_ATTR}="true"] article.post .avatar img{
            box-sizing:border-box!important;
            width:52px!important;
            height:52px!important;
            min-width:52px!important;
            border-radius:0!important;
          }
          html[${THEME_ATTR}="true"] article.post .avatar{
            border:1px dotted ${TOKENS.avatarBorder}!important;
            background:${TOKENS.avatarBackground}!important;
          }
          html[${THEME_ATTR}="true"] article.post .avatar img{
            border:0!important;
            object-fit:cover!important;
          }
          html[${THEME_ATTR}="true"] article.post .post-main{
            min-width:0!important;
          }
          html[${THEME_ATTR}="true"] article.post .post-header{
            min-height:25px!important;
            height:auto!important;
            align-items:flex-start!important;
            gap:8px!important;
            margin:0 0 5px!important;
            line-height:1.5!important;
          }
          html[${THEME_ATTR}="true"] article.post .identity{
            min-width:0!important;
            padding-top:1px!important;
          }
          html[${THEME_ATTR}="true"] article.post .author{
            color:${TOKENS.text}!important;
            font-family:${TOKENS.fontFamily}!important;
            font-size:${TOKENS.contentSize}!important;
            font-weight:700!important;
            line-height:1.5!important;
          }
          html[${THEME_ATTR}="true"] article.post .meta{
            align-items:flex-start!important;
            margin-left:auto!important;
            color:${TOKENS.muted}!important;
            font-family:${TOKENS.fontFamily}!important;
            font-size:12px!important;
            line-height:18px!important;
          }
          html[${THEME_ATTR}="true"] article.post button.date{
            color:${TOKENS.muted}!important;
            font-family:${TOKENS.fontFamily}!important;
            font-size:12px!important;
            line-height:18px!important;
          }
          html[${THEME_ATTR}="true"] article.post .body,
          html[${THEME_ATTR}="true"] article.post .body .markdown{
            color:${TOKENS.text}!important;
            font-family:${TOKENS.fontFamily}!important;
            font-size:${TOKENS.contentSize}!important;
            line-height:${TOKENS.contentLineHeight}!important;
          }
          html[${THEME_ATTR}="true"] article.post .body{
            padding-right:8px!important;
          }
          html[${THEME_ATTR}="true"] article.post .markdown :where(p,ul,ol,blockquote,pre){
            margin-top:0!important;
          }
          html[${THEME_ATTR}="true"] article.post .markdown p:last-child{
            margin-bottom:0!important;
          }
          html[${THEME_ATTR}="true"] article.post .actions{
            min-height:24px!important;
            align-items:center!important;
            gap:8px!important;
            margin:7px 0 0!important;
            padding:3px 0 0!important;
            border-top:1px solid ${TOKENS.softDivider}!important;
            color:${TOKENS.action}!important;
            font-family:${TOKENS.fontFamily}!important;
            font-size:12px!important;
            line-height:18px!important;
          }
          html[${THEME_ATTR}="true"] article.post .reply-action{
            min-height:22px!important;
            padding:2px 4px!important;
            color:${TOKENS.action}!important;
            font-family:${TOKENS.fontFamily}!important;
            font-size:12px!important;
            line-height:16px!important;
          }
          html[${THEME_ATTR}="true"] article.post .reply-ref{
            color:${TOKENS.action}!important;
            font-family:${TOKENS.fontFamily}!important;
            font-size:12px!important;
            line-height:18px!important;
          }
          html[${THEME_ATTR}="true"] article.post :where(.reply-link,.reply-link-text){
            font-family:${TOKENS.fontFamily}!important;
            font-size:12px!important;
          }

          html[${THEME_ATTR}="true"][data-cudloun-kapybara-theme="dark"] article.post{
            background:var(--cudloun-kapybara-surface,#141414)!important;
            color:var(--cudloun-kapybara-text,#f4f4f4)!important;
            border-color:#43638f!important;
          }
          html[${THEME_ATTR}="true"][data-cudloun-kapybara-theme="dark"] main .posts:has(> article.post){
            background:var(--cudloun-kapybara-surface,#141414)!important;
          }
          html[${THEME_ATTR}="true"][data-cudloun-kapybara-theme="dark"] article.post :where(.author,.body,.markdown){
            color:var(--cudloun-kapybara-text,#f4f4f4)!important;
          }
          html[${THEME_ATTR}="true"][data-cudloun-kapybara-theme="dark"] article.post :where(.meta,button.date,.actions,.reply-action,.reply-ref){
            color:var(--cudloun-kapybara-muted,#aaaeb6)!important;
          }
          html[${THEME_ATTR}="true"][data-cudloun-kapybara-theme="dark"] article.post .actions{
            border-color:var(--cudloun-kapybara-line,#303030)!important;
          }

          @media(max-width:700px){
            html[${THEME_ATTR}="true"] article.post{
              grid-template-columns:44px minmax(0,1fr)!important;
              gap:8px!important;
              padding:9px 8px 7px 4px!important;
            }
            html[${THEME_ATTR}="true"] article.post .avatar-col{
              width:42px!important;
              min-width:42px!important;
              padding-top:2px!important;
            }
            html[${THEME_ATTR}="true"] article.post .avatar,
            html[${THEME_ATTR}="true"] article.post .avatar img{
              width:42px!important;
              height:42px!important;
              min-width:42px!important;
            }
            html[${THEME_ATTR}="true"] article.post .post-header{
              gap:5px!important;
              margin-bottom:4px!important;
            }
            html[${THEME_ATTR}="true"] article.post .author,
            html[${THEME_ATTR}="true"] article.post .body,
            html[${THEME_ATTR}="true"] article.post .body .markdown{
              font-size:15px!important;
              line-height:1.5!important;
            }
            html[${THEME_ATTR}="true"] article.post .actions{
              gap:5px!important;
              margin-top:6px!important;
            }
          }
        `;
        document.head.appendChild(style);
      }
    })();

  });

  embeddedText.set("modules/post-tweaks.js", "// Durable copy of Kapybara's temporary post-display experiment.\n(function () {\n  \"use strict\";\n\n  const root = window.Cudloun;\n  const VERSION = \"0.1.0\";\n  const STYLE_ID = \"cudloun-post-tweaks-style\";\n  const ACTIVE_ATTR = \"data-cudloun-post-tweaks\";\n  const DEFAULTS = Object.freeze({\n    largerGap: false,\n    separator: false,\n    shape: \"circle\",\n    fit: \"contain\",\n    ring: \"none\",\n  });\n  const SHAPES = Object.freeze({\n    circle: { label: \"Kruh (výchozí)\", radius: \"50%\", aspect: \"1\" },\n    square: { label: \"Čtverec\", radius: \"0\", aspect: \"1\" },\n    \"rounded-square\": { label: \"Zaoblený čtverec\", radius: \"22%\", aspect: \"1\" },\n    rect: { label: \"Obdélník 4:5\", radius: \"0\", aspect: \"4 / 5\" },\n    \"rounded-rect\": { label: \"Zaoblený 4:5\", radius: \"22%\", aspect: \"4 / 5\" },\n  });\n  const FITS = Object.freeze({\n    contain: \"contain (letterbox)\",\n    cover: \"cover (ořez)\",\n  });\n  const RINGS = Object.freeze({\n    none: \"Bez\",\n    hairline: \"1px linka\",\n  });\n  const AVATAR_VARIABLES = [\n    \"--🐟-avatar-radius\",\n    \"--🐟-avatar-aspect\",\n    \"--🐟-avatar-fit\",\n    \"--🐟-avatar-ring\",\n  ];\n\n  let activeContext = null;\n  let previousVariables = null;\n\n  root.postTweaks = {\n    version: VERSION,\n    defaults: { ...DEFAULTS },\n    shapes: Object.fromEntries(Object.entries(SHAPES).map(([key, value]) => [key, { ...value }])),\n  };\n\n  root.registerModule({\n    id: \"post-tweaks\",\n    name: \"Post Tweaks\",\n    description: \"Keeps Kapybara's temporary spacing, divider, and avatar controls available.\",\n    version: VERSION,\n    defaultEnabled: false,\n    start(ctx) {\n      if (!root.kapyguts?.isKapybara?.()) return null;\n      activeContext = ctx;\n      captureVariables();\n      installStyle();\n      applySettings(ctx);\n      ctx.log.info(\"post tweaks ready\", readSettings(ctx));\n      return cleanup;\n    },\n    renderSettings(ctx) {\n      const wrap = document.createElement(\"div\");\n      wrap.className = \"cudloun-settings-list\";\n      wrap.appendChild(makeCheckboxRow(ctx, \"Větší mezera\", \"largerGap\", DEFAULTS.largerGap));\n      wrap.appendChild(makeCheckboxRow(ctx, \"Oddělovač\", \"separator\", DEFAULTS.separator));\n      wrap.appendChild(makeSelectRow(ctx, \"Tvar ikonky\", \"shape\", SHAPES));\n      wrap.appendChild(makeSelectRow(ctx, \"Vyplnění\", \"fit\", FITS));\n      wrap.appendChild(makeSelectRow(ctx, \"Linka\", \"ring\", RINGS));\n      return wrap;\n    },\n    renderHelp() {\n      return [\n        \"This default-off module preserves the useful controls from Kapybara's temporary /test/posts page.\",\n        \"It reproduces Koles' 12/16 px post spacing and the same avatar radius, 4:5 aspect, contain/cover, and 1 px outline values.\",\n        \"Settings live in Cudloun, so they remain available if Kapybara removes the test menu. Disable the module to restore the page's previous values.\",\n      ];\n    },\n  });\n\n  function readSettings(ctx) {\n    return {\n      largerGap: ctx.storage.get(\"largerGap\", DEFAULTS.largerGap) === true,\n      separator: ctx.storage.get(\"separator\", DEFAULTS.separator) === true,\n      shape: validChoice(ctx.storage.get(\"shape\", DEFAULTS.shape), SHAPES, DEFAULTS.shape),\n      fit: validChoice(ctx.storage.get(\"fit\", DEFAULTS.fit), FITS, DEFAULTS.fit),\n      ring: validChoice(ctx.storage.get(\"ring\", DEFAULTS.ring), RINGS, DEFAULTS.ring),\n    };\n  }\n\n  function applySettings(ctx) {\n    if (!activeContext) return;\n    const settings = readSettings(ctx);\n    const html = document.documentElement;\n    const shape = SHAPES[settings.shape];\n\n    html.setAttribute(ACTIVE_ATTR, \"true\");\n    html.setAttribute(\"data-cudloun-post-tweaks-gap\", settings.largerGap ? \"large\" : \"normal\");\n    html.setAttribute(\"data-cudloun-post-tweaks-separator\", String(settings.separator));\n    html.style.setProperty(\"--🐟-avatar-radius\", shape.radius);\n    html.style.setProperty(\"--🐟-avatar-aspect\", shape.aspect);\n    html.style.setProperty(\"--🐟-avatar-fit\", settings.fit);\n    html.style.setProperty(\"--🐟-avatar-ring\", settings.ring === \"hairline\" ? \"1px solid var(--🐟-border)\" : \"none\");\n  }\n\n  function cleanup() {\n    const html = document.documentElement;\n    html.removeAttribute(ACTIVE_ATTR);\n    html.removeAttribute(\"data-cudloun-post-tweaks-gap\");\n    html.removeAttribute(\"data-cudloun-post-tweaks-separator\");\n    restoreVariables();\n    document.getElementById(STYLE_ID)?.remove();\n    activeContext = null;\n    root.log.info(\"post-tweaks\", \"removed\");\n  }\n\n  function captureVariables() {\n    if (previousVariables) return;\n    const style = document.documentElement.style;\n    previousVariables = new Map(AVATAR_VARIABLES.map((name) => [name, {\n      value: style.getPropertyValue(name),\n      priority: style.getPropertyPriority(name),\n    }]));\n  }\n\n  function restoreVariables() {\n    if (!previousVariables) return;\n    const style = document.documentElement.style;\n    previousVariables.forEach(({ value, priority }, name) => {\n      if (value) style.setProperty(name, value, priority);\n      else style.removeProperty(name);\n    });\n    previousVariables = null;\n  }\n\n  function installStyle() {\n    if (document.getElementById(STYLE_ID)) return;\n    const style = document.createElement(\"style\");\n    style.id = STYLE_ID;\n    style.textContent = `\n      html[${ACTIVE_ATTR}=\"true\"] main .posts:has(> article.post){\n        --post-gap:12px!important;\n        gap:var(--post-gap)!important;\n      }\n      html[${ACTIVE_ATTR}=\"true\"][data-cudloun-post-tweaks-gap=\"large\"] main .posts:has(> article.post){\n        --post-gap:16px!important;\n      }\n      html[${ACTIVE_ATTR}=\"true\"] article.post .avatar{\n        aspect-ratio:var(--🐟-avatar-aspect,1)!important;\n        border-radius:var(--🐟-avatar-radius,50%)!important;\n        outline:var(--🐟-avatar-ring,none)!important;\n        outline-offset:-1px!important;\n        height:auto!important;\n      }\n      html[${ACTIVE_ATTR}=\"true\"] article.post .avatar img{\n        border-radius:inherit!important;\n        object-fit:var(--🐟-avatar-fit,contain)!important;\n        width:100%!important;\n        height:100%!important;\n      }\n      html[data-cudloun-classic-look=\"true\"][${ACTIVE_ATTR}=\"true\"] article.post{\n        border-bottom:0!important;\n      }\n      html[data-cudloun-classic-look=\"true\"][${ACTIVE_ATTR}=\"true\"] article.post:first-of-type{\n        border-top:0!important;\n      }\n      html[${ACTIVE_ATTR}=\"true\"][data-cudloun-post-tweaks-separator=\"false\"] article.post.separator-above .post-main::before{\n        content:none!important;\n      }\n      html[${ACTIVE_ATTR}=\"true\"][data-cudloun-post-tweaks-separator=\"true\"] main .posts>article.post+article.post .post-main::before,\n      html[${ACTIVE_ATTR}=\"true\"][data-cudloun-post-tweaks-separator=\"true\"] article.post.separator-above .post-main::before{\n        content:\"\"!important;\n        top:calc(-1 * (10px + var(--post-gap,12px) / 2))!important;\n        border-top:1px solid var(--🐟-border)!important;\n        pointer-events:none!important;\n        position:absolute!important;\n        left:0!important;\n        right:0!important;\n      }\n    `;\n    document.head.appendChild(style);\n  }\n\n  function makeCheckboxRow(ctx, label, key, fallback) {\n    const row = document.createElement(\"label\");\n    row.className = \"cudloun-setting-row\";\n    const text = document.createElement(\"span\");\n    text.className = \"cudloun-setting-text\";\n    text.textContent = label;\n    const input = document.createElement(\"input\");\n    input.type = \"checkbox\";\n    input.checked = ctx.storage.get(key, fallback) === true;\n    input.addEventListener(\"change\", () => {\n      ctx.storage.set(key, input.checked);\n      applySettings(ctx);\n    });\n    row.append(text, input);\n    return row;\n  }\n\n  function makeSelectRow(ctx, label, key, choices) {\n    const row = document.createElement(\"label\");\n    row.className = \"cudloun-setting-row\";\n    const text = document.createElement(\"span\");\n    text.className = \"cudloun-setting-text\";\n    text.textContent = label;\n    const select = document.createElement(\"select\");\n    select.className = \"cudloun-setting-select\";\n    const fallback = DEFAULTS[key];\n    const current = validChoice(ctx.storage.get(key, fallback), choices, fallback);\n    Object.entries(choices).forEach(([value, config]) => {\n      const option = document.createElement(\"option\");\n      option.value = value;\n      option.textContent = typeof config === \"string\" ? config : config.label;\n      select.appendChild(option);\n    });\n    select.value = current;\n    select.addEventListener(\"change\", () => {\n      ctx.storage.set(key, select.value);\n      applySettings(ctx);\n    });\n    row.append(text, select);\n    return row;\n  }\n\n  function validChoice(value, choices, fallback) {\n    return typeof value === \"string\" && Object.prototype.hasOwnProperty.call(choices, value) ? value : fallback;\n  }\n})();\n");
  embeddedScripts.set("modules/post-tweaks.js", function () {
    // Durable copy of Kapybara's temporary post-display experiment.
    (function () {
      "use strict";

      const root = window.Cudloun;
      const VERSION = "0.1.0";
      const STYLE_ID = "cudloun-post-tweaks-style";
      const ACTIVE_ATTR = "data-cudloun-post-tweaks";
      const DEFAULTS = Object.freeze({
        largerGap: false,
        separator: false,
        shape: "circle",
        fit: "contain",
        ring: "none",
      });
      const SHAPES = Object.freeze({
        circle: { label: "Kruh (výchozí)", radius: "50%", aspect: "1" },
        square: { label: "Čtverec", radius: "0", aspect: "1" },
        "rounded-square": { label: "Zaoblený čtverec", radius: "22%", aspect: "1" },
        rect: { label: "Obdélník 4:5", radius: "0", aspect: "4 / 5" },
        "rounded-rect": { label: "Zaoblený 4:5", radius: "22%", aspect: "4 / 5" },
      });
      const FITS = Object.freeze({
        contain: "contain (letterbox)",
        cover: "cover (ořez)",
      });
      const RINGS = Object.freeze({
        none: "Bez",
        hairline: "1px linka",
      });
      const AVATAR_VARIABLES = [
        "--🐟-avatar-radius",
        "--🐟-avatar-aspect",
        "--🐟-avatar-fit",
        "--🐟-avatar-ring",
      ];

      let activeContext = null;
      let previousVariables = null;

      root.postTweaks = {
        version: VERSION,
        defaults: { ...DEFAULTS },
        shapes: Object.fromEntries(Object.entries(SHAPES).map(([key, value]) => [key, { ...value }])),
      };

      root.registerModule({
        id: "post-tweaks",
        name: "Post Tweaks",
        description: "Keeps Kapybara's temporary spacing, divider, and avatar controls available.",
        version: VERSION,
        defaultEnabled: false,
        start(ctx) {
          if (!root.kapyguts?.isKapybara?.()) return null;
          activeContext = ctx;
          captureVariables();
          installStyle();
          applySettings(ctx);
          ctx.log.info("post tweaks ready", readSettings(ctx));
          return cleanup;
        },
        renderSettings(ctx) {
          const wrap = document.createElement("div");
          wrap.className = "cudloun-settings-list";
          wrap.appendChild(makeCheckboxRow(ctx, "Větší mezera", "largerGap", DEFAULTS.largerGap));
          wrap.appendChild(makeCheckboxRow(ctx, "Oddělovač", "separator", DEFAULTS.separator));
          wrap.appendChild(makeSelectRow(ctx, "Tvar ikonky", "shape", SHAPES));
          wrap.appendChild(makeSelectRow(ctx, "Vyplnění", "fit", FITS));
          wrap.appendChild(makeSelectRow(ctx, "Linka", "ring", RINGS));
          return wrap;
        },
        renderHelp() {
          return [
            "This default-off module preserves the useful controls from Kapybara's temporary /test/posts page.",
            "It reproduces Koles' 12/16 px post spacing and the same avatar radius, 4:5 aspect, contain/cover, and 1 px outline values.",
            "Settings live in Cudloun, so they remain available if Kapybara removes the test menu. Disable the module to restore the page's previous values.",
          ];
        },
      });

      function readSettings(ctx) {
        return {
          largerGap: ctx.storage.get("largerGap", DEFAULTS.largerGap) === true,
          separator: ctx.storage.get("separator", DEFAULTS.separator) === true,
          shape: validChoice(ctx.storage.get("shape", DEFAULTS.shape), SHAPES, DEFAULTS.shape),
          fit: validChoice(ctx.storage.get("fit", DEFAULTS.fit), FITS, DEFAULTS.fit),
          ring: validChoice(ctx.storage.get("ring", DEFAULTS.ring), RINGS, DEFAULTS.ring),
        };
      }

      function applySettings(ctx) {
        if (!activeContext) return;
        const settings = readSettings(ctx);
        const html = document.documentElement;
        const shape = SHAPES[settings.shape];

        html.setAttribute(ACTIVE_ATTR, "true");
        html.setAttribute("data-cudloun-post-tweaks-gap", settings.largerGap ? "large" : "normal");
        html.setAttribute("data-cudloun-post-tweaks-separator", String(settings.separator));
        html.style.setProperty("--🐟-avatar-radius", shape.radius);
        html.style.setProperty("--🐟-avatar-aspect", shape.aspect);
        html.style.setProperty("--🐟-avatar-fit", settings.fit);
        html.style.setProperty("--🐟-avatar-ring", settings.ring === "hairline" ? "1px solid var(--🐟-border)" : "none");
      }

      function cleanup() {
        const html = document.documentElement;
        html.removeAttribute(ACTIVE_ATTR);
        html.removeAttribute("data-cudloun-post-tweaks-gap");
        html.removeAttribute("data-cudloun-post-tweaks-separator");
        restoreVariables();
        document.getElementById(STYLE_ID)?.remove();
        activeContext = null;
        root.log.info("post-tweaks", "removed");
      }

      function captureVariables() {
        if (previousVariables) return;
        const style = document.documentElement.style;
        previousVariables = new Map(AVATAR_VARIABLES.map((name) => [name, {
          value: style.getPropertyValue(name),
          priority: style.getPropertyPriority(name),
        }]));
      }

      function restoreVariables() {
        if (!previousVariables) return;
        const style = document.documentElement.style;
        previousVariables.forEach(({ value, priority }, name) => {
          if (value) style.setProperty(name, value, priority);
          else style.removeProperty(name);
        });
        previousVariables = null;
      }

      function installStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
          html[${ACTIVE_ATTR}="true"] main .posts:has(> article.post){
            --post-gap:12px!important;
            gap:var(--post-gap)!important;
          }
          html[${ACTIVE_ATTR}="true"][data-cudloun-post-tweaks-gap="large"] main .posts:has(> article.post){
            --post-gap:16px!important;
          }
          html[${ACTIVE_ATTR}="true"] article.post .avatar{
            aspect-ratio:var(--🐟-avatar-aspect,1)!important;
            border-radius:var(--🐟-avatar-radius,50%)!important;
            outline:var(--🐟-avatar-ring,none)!important;
            outline-offset:-1px!important;
            height:auto!important;
          }
          html[${ACTIVE_ATTR}="true"] article.post .avatar img{
            border-radius:inherit!important;
            object-fit:var(--🐟-avatar-fit,contain)!important;
            width:100%!important;
            height:100%!important;
          }
          html[data-cudloun-classic-look="true"][${ACTIVE_ATTR}="true"] article.post{
            border-bottom:0!important;
          }
          html[data-cudloun-classic-look="true"][${ACTIVE_ATTR}="true"] article.post:first-of-type{
            border-top:0!important;
          }
          html[${ACTIVE_ATTR}="true"][data-cudloun-post-tweaks-separator="false"] article.post.separator-above .post-main::before{
            content:none!important;
          }
          html[${ACTIVE_ATTR}="true"][data-cudloun-post-tweaks-separator="true"] main .posts>article.post+article.post .post-main::before,
          html[${ACTIVE_ATTR}="true"][data-cudloun-post-tweaks-separator="true"] article.post.separator-above .post-main::before{
            content:""!important;
            top:calc(-1 * (10px + var(--post-gap,12px) / 2))!important;
            border-top:1px solid var(--🐟-border)!important;
            pointer-events:none!important;
            position:absolute!important;
            left:0!important;
            right:0!important;
          }
        `;
        document.head.appendChild(style);
      }

      function makeCheckboxRow(ctx, label, key, fallback) {
        const row = document.createElement("label");
        row.className = "cudloun-setting-row";
        const text = document.createElement("span");
        text.className = "cudloun-setting-text";
        text.textContent = label;
        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = ctx.storage.get(key, fallback) === true;
        input.addEventListener("change", () => {
          ctx.storage.set(key, input.checked);
          applySettings(ctx);
        });
        row.append(text, input);
        return row;
      }

      function makeSelectRow(ctx, label, key, choices) {
        const row = document.createElement("label");
        row.className = "cudloun-setting-row";
        const text = document.createElement("span");
        text.className = "cudloun-setting-text";
        text.textContent = label;
        const select = document.createElement("select");
        select.className = "cudloun-setting-select";
        const fallback = DEFAULTS[key];
        const current = validChoice(ctx.storage.get(key, fallback), choices, fallback);
        Object.entries(choices).forEach(([value, config]) => {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = typeof config === "string" ? config : config.label;
          select.appendChild(option);
        });
        select.value = current;
        select.addEventListener("change", () => {
          ctx.storage.set(key, select.value);
          applySettings(ctx);
        });
        row.append(text, select);
        return row;
      }

      function validChoice(value, choices, fallback) {
        return typeof value === "string" && Object.prototype.hasOwnProperty.call(choices, value) ? value : fallback;
      }
    })();

  });

  embeddedText.set("modules/post-fonts.js", "// Compact quick and per-area font controls for Kapybara board pages.\n(function () {\n  \"use strict\";\n\n  const root = window.Cudloun;\n  const STYLE_ID = \"cudloun-post-fonts-style\";\n  const CONTROL_CLASS = \"cudloun-post-fonts-control\";\n  const DEFAULT_SIZE = 17;\n  const MIN_SIZE = 8;\n  const MAX_SIZE = 72;\n  const SLIDER_MIN = 10;\n  const SLIDER_MAX = 32;\n  const LONG_PRESS_MS = 520;\n  const LONG_PRESS_MOVE_PX = 10;\n  const MAX_CUSTOM_FAMILY_LENGTH = 160;\n  const FONT_ROLES = [\n    { id: \"posts\", label: \"Posts\", title: \"Post content\", unit: \"px\", defaultSize: DEFAULT_SIZE, min: MIN_SIZE, max: MAX_SIZE, sliderMin: SLIDER_MIN, sliderMax: SLIDER_MAX, step: 0.5 },\n    { id: \"interface\", label: \"UI\", title: \"Interface\", unit: \"px\", defaultSize: 16, min: 12, max: 20, sliderMin: 12, sliderMax: 20, step: 1 },\n    { id: \"headings\", label: \"Titles\", title: \"Headings and authors\", unit: \"%\", defaultSize: 100, min: 70, max: 130, sliderMin: 70, sliderMax: 130, step: 5 },\n    { id: \"code\", label: \"Code\", title: \"Code and monospace text\", unit: \"%\", defaultSize: 100, min: 70, max: 130, sliderMin: 70, sliderMax: 130, step: 5 },\n    { id: \"logo\", label: \"Logo\", title: \"Okoun logo\", unit: \"%\", defaultSize: 100, min: 70, max: 130, sliderMin: 70, sliderMax: 130, step: 5 },\n  ];\n  const FAMILIES = [\n    { value: \"default\", label: \"Kapybara default\", stack: \"\" },\n    { value: \"classic-okoun\", label: \"Classic Okoun\", stack: \"Verdana, \\\"Bitstream Vera Sans\\\", Arial, sans-serif\" },\n    { value: \"system\", label: \"System sans\", stack: \"system-ui, -apple-system, BlinkMacSystemFont, \\\"Segoe UI\\\", sans-serif\" },\n    { value: \"system-serif\", label: \"System serif\", stack: \"ui-serif, Georgia, Cambria, \\\"Times New Roman\\\", serif\" },\n    { value: \"system-mono\", label: \"System monospace\", stack: \"ui-monospace, \\\"SFMono-Regular\\\", Consolas, \\\"Liberation Mono\\\", monospace\" },\n    { value: \"roboto\", label: \"Roboto\", stack: \"Roboto, Arial, sans-serif\" },\n    { value: \"noto-sans\", label: \"Noto Sans\", stack: \"\\\"Noto Sans\\\", Arial, sans-serif\" },\n    { value: \"segoe\", label: \"Segoe UI\", stack: \"\\\"Segoe UI\\\", Arial, sans-serif\" },\n    { value: \"helvetica\", label: \"Helvetica\", stack: \"Helvetica, Arial, sans-serif\" },\n    { value: \"arial\", label: \"Arial\", stack: \"Arial, sans-serif\" },\n    { value: \"verdana\", label: \"Verdana\", stack: \"Verdana, Geneva, sans-serif\" },\n    { value: \"tahoma\", label: \"Tahoma\", stack: \"Tahoma, sans-serif\" },\n    { value: \"trebuchet\", label: \"Trebuchet MS\", stack: \"\\\"Trebuchet MS\\\", sans-serif\" },\n    { value: \"georgia\", label: \"Georgia\", stack: \"Georgia, serif\" },\n    { value: \"times\", label: \"Times New Roman\", stack: \"\\\"Times New Roman\\\", Times, serif\" },\n    { value: \"garamond\", label: \"Garamond\", stack: \"Garamond, Georgia, serif\" },\n    { value: \"palatino\", label: \"Palatino\", stack: \"Palatino, \\\"Palatino Linotype\\\", serif\" },\n    { value: \"courier\", label: \"Courier New\", stack: \"\\\"Courier New\\\", monospace\" },\n    { value: \"consolas\", label: \"Consolas\", stack: \"Consolas, \\\"Liberation Mono\\\", monospace\" },\n    { value: \"comic-sans\", label: \"Comic Sans MS\", stack: \"\\\"Comic Sans MS\\\", cursive\" },\n    { value: \"custom\", label: \"Custom…\", stack: \"\" },\n  ];\n  let ctxRef = null;\n  let observer = null;\n  let routeTimer = null;\n  let mountTimer = null;\n  let outsideHandler = null;\n  let keyHandler = null;\n  let resizeHandler = null;\n\n  root.postFonts = {\n    families: FAMILIES.map(({ value, label }) => ({ value, label })),\n    roles: FONT_ROLES.map(({ id, label, title, unit, defaultSize, min, max, step }) => ({ id, label, title, unit, defaultSize, min, max, step })),\n    longPressMs: LONG_PRESS_MS,\n    normalizeSize,\n    normalizeRoleSize,\n    normalizeCustomFamily,\n    fontStack,\n  };\n\n  root.registerModule({\n    id: \"post-fonts\",\n    name: \"Post Fonts\",\n    description: \"Quick post fonts with optional per-area controls for Kapybara.\",\n    version: \"0.5.0\",\n    defaultEnabled: false,\n    start(ctx) {\n      if (!root.kapyguts?.isKapybara?.()) return null;\n      return start(ctx);\n    },\n    renderSettings() {\n      const wrap = document.createElement(\"div\");\n      wrap.className = \"cudloun-settings-list\";\n\n      const row = document.createElement(\"div\");\n      row.className = \"cudloun-setting-row\";\n      const text = document.createElement(\"div\");\n      text.className = \"cudloun-setting-text\";\n      text.textContent = \"Tap f for quick post fonts. Hold it on touch screens or right-click it for separate interface, heading, code, and logo controls.\";\n      row.appendChild(text);\n      wrap.appendChild(row);\n      return wrap;\n    },\n    renderHelp() {\n      return [\n        \"Open f to choose a preset or enter a comma-separated custom font stack, then adjust its size with the slider or number field.\",\n        \"Hold f on a touch screen, or right-click it with a mouse, to open advanced controls for Posts, UI, Titles, Code, and Logo.\",\n        \"Changes apply immediately to the selected area and are remembered across page loads.\",\n        \"Custom fonts must already be available in your browser or device; later names in the stack act as fallbacks.\",\n        \"Reset restores the currently selected area; untouched advanced areas keep Kapybara's native styling.\",\n      ];\n    },\n  });\n\n  function start(ctx) {\n    stop();\n    ctxRef = ctx;\n    installStyles();\n    applySettings();\n    mountForRoute();\n\n    observer = new MutationObserver(scheduleMount);\n    observer.observe(document.body, { childList: true, subtree: true });\n\n    outsideHandler = (event) => {\n      const control = document.querySelector(`.${CONTROL_CLASS}`);\n      if (!control || control.contains(event.target)) return;\n      setOpen(control, false);\n    };\n    keyHandler = (event) => {\n      if (event.key !== \"Escape\") return;\n      const control = document.querySelector(`.${CONTROL_CLASS}`);\n      if (control) setOpen(control, false);\n    };\n    document.addEventListener(\"pointerdown\", outsideHandler, true);\n    document.addEventListener(\"keydown\", keyHandler, true);\n    resizeHandler = scheduleMount;\n    window.addEventListener(\"resize\", resizeHandler);\n    observeRoute();\n    ctx.log.info(\"post font controls ready\");\n    return stop;\n  }\n\n  function stop() {\n    observer?.disconnect();\n    observer = null;\n    window.clearTimeout(routeTimer);\n    window.clearTimeout(mountTimer);\n    routeTimer = null;\n    mountTimer = null;\n    if (outsideHandler) document.removeEventListener(\"pointerdown\", outsideHandler, true);\n    if (keyHandler) document.removeEventListener(\"keydown\", keyHandler, true);\n    if (resizeHandler) window.removeEventListener(\"resize\", resizeHandler);\n    outsideHandler = null;\n    keyHandler = null;\n    resizeHandler = null;\n    document.querySelectorAll(`.${CONTROL_CLASS}`).forEach((control) => control.remove());\n    document.getElementById(STYLE_ID)?.remove();\n    clearSettings();\n    ctxRef = null;\n  }\n\n  function observeRoute() {\n    let lastRoute = root.currentRoute();\n    const check = () => {\n      const route = root.currentRoute();\n      if (route !== lastRoute) {\n        lastRoute = route;\n        mountForRoute();\n      }\n      routeTimer = window.setTimeout(check, 500);\n    };\n    routeTimer = window.setTimeout(check, 500);\n  }\n\n  function scheduleMount() {\n    window.clearTimeout(mountTimer);\n    mountTimer = window.setTimeout(mountForRoute, 60);\n  }\n\n  function mountForRoute() {\n    const controls = Array.from(document.querySelectorAll(`.${CONTROL_CLASS}`));\n    if (!root.kapyguts?.isBoardPage?.()) {\n      controls.forEach((control) => control.remove());\n      return;\n    }\n\n    const target = controlTarget();\n    if (!target) return;\n    const connected = controls.find((control) => (\n      control.parentElement === target.host && control.dataset.placement === target.placement\n    ));\n    controls.filter((control) => control !== connected).forEach((control) => control.remove());\n    if (!connected) target.host.appendChild(makeControl(target.placement));\n  }\n\n  function controlTarget() {\n    if (window.matchMedia(\"(max-width: 700px)\").matches) {\n      const boardActions = root.kapyguts?.boardHeaderParts?.().actions;\n      if (boardActions) return { host: boardActions, placement: \"board-header\" };\n      const header = persistentHeader();\n      return header ? { host: header, placement: \"floating\" } : null;\n    }\n\n    const desktopActions = root.kapyguts?.pageHeaderParts?.().desktopActions;\n    if (desktopActions) return { host: desktopActions, placement: \"global-actions\" };\n    const header = persistentHeader();\n    return header ? { host: header, placement: \"global-header\" } : null;\n  }\n\n  function persistentHeader() {\n    return root.kapyguts?.pageHeader?.() || null;\n  }\n\n  function makeControl(placement) {\n    const control = document.createElement(\"div\");\n    control.className = CONTROL_CLASS;\n    control.dataset.placement = placement;\n\n    const button = document.createElement(\"button\");\n    button.type = \"button\";\n    button.className = \"cudloun-post-fonts-toggle\";\n    button.textContent = \"f\";\n    button.title = \"Post fonts — hold or right-click for more\";\n    button.setAttribute(\"aria-label\", \"Post font controls\");\n    button.setAttribute(\"aria-expanded\", \"false\");\n\n    const panel = document.createElement(\"section\");\n    panel.className = \"cudloun-post-fonts-panel cudloun-post-fonts-panel--simple\";\n    panel.hidden = true;\n    panel.setAttribute(\"aria-label\", \"Post font controls\");\n\n    const head = document.createElement(\"div\");\n    head.className = \"cudloun-post-fonts-head\";\n    const title = document.createElement(\"strong\");\n    title.textContent = \"Post font\";\n    const close = document.createElement(\"button\");\n    close.type = \"button\";\n    close.className = \"cudloun-post-fonts-close\";\n    close.textContent = \"×\";\n    close.setAttribute(\"aria-label\", \"Close post font controls\");\n    head.appendChild(title);\n    head.appendChild(close);\n\n    const familyLabel = document.createElement(\"label\");\n    familyLabel.className = \"cudloun-post-fonts-field\";\n    const familyText = document.createElement(\"span\");\n    familyText.textContent = \"Font\";\n    const family = document.createElement(\"select\");\n    family.setAttribute(\"aria-label\", \"Post font family\");\n    FAMILIES.forEach(({ value, label, stack }) => {\n      const option = document.createElement(\"option\");\n      option.value = value;\n      option.textContent = label;\n      if (stack) option.style.fontFamily = stack;\n      family.appendChild(option);\n    });\n    family.value = validFamily(ctxRef?.storage.get(\"family\", \"default\"));\n    familyLabel.appendChild(familyText);\n    familyLabel.appendChild(family);\n\n    const customLabel = document.createElement(\"label\");\n    customLabel.className = \"cudloun-post-fonts-field cudloun-post-fonts-custom\";\n    const customText = document.createElement(\"span\");\n    customText.textContent = \"Custom\";\n    const customWrap = document.createElement(\"span\");\n    customWrap.className = \"cudloun-post-fonts-custom-wrap\";\n    const custom = document.createElement(\"input\");\n    custom.type = \"text\";\n    custom.maxLength = MAX_CUSTOM_FAMILY_LENGTH;\n    custom.autocomplete = \"off\";\n    custom.spellcheck = false;\n    custom.placeholder = \"\\\"Atkinson Hyperlegible\\\", Arial, sans-serif\";\n    custom.setAttribute(\"aria-label\", \"Custom post font family\");\n    const customHint = document.createElement(\"small\");\n    customHint.textContent = \"Comma-separated local font names\";\n    customWrap.appendChild(custom);\n    customWrap.appendChild(customHint);\n    customLabel.appendChild(customText);\n    customLabel.appendChild(customWrap);\n    custom.value = String(ctxRef?.storage.get(\"customFamily\", \"\") || \"\").slice(0, MAX_CUSTOM_FAMILY_LENGTH);\n    syncCustomField(customLabel, custom, customHint, family.value);\n\n    const sizeField = document.createElement(\"div\");\n    sizeField.className = \"cudloun-post-fonts-field\";\n    const sizeText = document.createElement(\"span\");\n    sizeText.textContent = \"Size\";\n    const sizeControls = document.createElement(\"div\");\n    sizeControls.className = \"cudloun-post-fonts-size\";\n    const range = document.createElement(\"input\");\n    range.type = \"range\";\n    range.min = String(SLIDER_MIN);\n    range.max = String(SLIDER_MAX);\n    range.step = \"0.5\";\n    range.setAttribute(\"aria-label\", \"Post font size slider\");\n    const number = document.createElement(\"input\");\n    number.type = \"number\";\n    number.min = String(MIN_SIZE);\n    number.max = String(MAX_SIZE);\n    number.step = \"0.5\";\n    number.inputMode = \"decimal\";\n    number.setAttribute(\"aria-label\", \"Post font size in pixels\");\n    const unit = document.createElement(\"span\");\n    unit.textContent = \"px\";\n    sizeControls.appendChild(range);\n    sizeControls.appendChild(number);\n    sizeControls.appendChild(unit);\n    sizeField.appendChild(sizeText);\n    sizeField.appendChild(sizeControls);\n\n    const actions = document.createElement(\"div\");\n    actions.className = \"cudloun-post-fonts-actions\";\n    const reset = document.createElement(\"button\");\n    reset.type = \"button\";\n    reset.textContent = \"Reset\";\n    actions.appendChild(reset);\n\n    const advancedHint = document.createElement(\"small\");\n    advancedHint.className = \"cudloun-post-fonts-advanced-hint\";\n    advancedHint.textContent = \"Hold or right-click f for more\";\n\n    panel.appendChild(head);\n    panel.appendChild(familyLabel);\n    panel.appendChild(customLabel);\n    panel.appendChild(sizeField);\n    panel.appendChild(actions);\n    panel.appendChild(advancedHint);\n    control.appendChild(button);\n    control.appendChild(panel);\n    control.appendChild(makeAdvancedPanel(control));\n\n    syncSizeInputs(range, number, currentSize());\n    installToggleGestures(button, control);\n    close.addEventListener(\"click\", () => setOpen(control, false));\n    family.addEventListener(\"change\", () => {\n      ctxRef?.storage.set(\"family\", validFamily(family.value));\n      syncCustomField(customLabel, custom, customHint, family.value);\n      applySettings();\n      if (family.value === \"custom\") custom.focus();\n    });\n    custom.addEventListener(\"input\", () => {\n      const value = custom.value.slice(0, MAX_CUSTOM_FAMILY_LENGTH);\n      ctxRef?.storage.set(\"customFamily\", value);\n      syncCustomField(customLabel, custom, customHint, family.value);\n      applySettings();\n    });\n    range.addEventListener(\"input\", () => {\n      const size = normalizeSize(range.value);\n      number.value = displaySize(size);\n      saveSize(size);\n    });\n    number.addEventListener(\"input\", () => {\n      if (number.value === \"\") return;\n      const size = normalizeSize(number.value);\n      range.value = String(Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, size)));\n      saveSize(size);\n    });\n    number.addEventListener(\"change\", () => {\n      const size = normalizeSize(number.value);\n      syncSizeInputs(range, number, size);\n      saveSize(size);\n    });\n    reset.addEventListener(\"click\", () => {\n      family.value = \"default\";\n      custom.value = \"\";\n      syncCustomField(customLabel, custom, customHint, family.value);\n      syncSizeInputs(range, number, DEFAULT_SIZE);\n      ctxRef?.storage.set(\"family\", \"default\");\n      ctxRef?.storage.set(\"customFamily\", \"\");\n      ctxRef?.storage.set(\"size\", DEFAULT_SIZE);\n      applySettings();\n    });\n    return control;\n  }\n\n  function makeAdvancedPanel(control) {\n    const panel = document.createElement(\"section\");\n    panel.className = \"cudloun-post-fonts-panel cudloun-post-fonts-panel--advanced\";\n    panel.hidden = true;\n    panel.setAttribute(\"aria-label\", \"Advanced font controls\");\n\n    const head = document.createElement(\"div\");\n    head.className = \"cudloun-post-fonts-head\";\n    const heading = document.createElement(\"div\");\n    heading.className = \"cudloun-post-fonts-advanced-title\";\n    const title = document.createElement(\"strong\");\n    title.textContent = \"More fonts\";\n    const intro = document.createElement(\"small\");\n    intro.textContent = \"Pick an area, then tune it\";\n    heading.appendChild(title);\n    heading.appendChild(intro);\n    const close = document.createElement(\"button\");\n    close.type = \"button\";\n    close.className = \"cudloun-post-fonts-close\";\n    close.textContent = \"×\";\n    close.setAttribute(\"aria-label\", \"Close advanced font controls\");\n    head.appendChild(heading);\n    head.appendChild(close);\n\n    const roles = document.createElement(\"div\");\n    roles.className = \"cudloun-post-fonts-roles\";\n    roles.setAttribute(\"role\", \"tablist\");\n    roles.setAttribute(\"aria-label\", \"Font area\");\n    const roleButtons = new Map();\n    FONT_ROLES.forEach((config) => {\n      const roleButton = document.createElement(\"button\");\n      roleButton.type = \"button\";\n      roleButton.textContent = config.label;\n      roleButton.title = config.title;\n      roleButton.dataset.fontRole = config.id;\n      roleButton.setAttribute(\"role\", \"tab\");\n      roleButton.setAttribute(\"aria-selected\", \"false\");\n      roles.appendChild(roleButton);\n      roleButtons.set(config.id, roleButton);\n    });\n\n    const areaName = document.createElement(\"strong\");\n    areaName.className = \"cudloun-post-fonts-area-name\";\n\n    const familyLabel = document.createElement(\"label\");\n    familyLabel.className = \"cudloun-post-fonts-field\";\n    const familyText = document.createElement(\"span\");\n    familyText.textContent = \"Font\";\n    const family = document.createElement(\"select\");\n    family.setAttribute(\"aria-label\", \"Selected area font family\");\n    FAMILIES.forEach(({ value, label, stack }) => {\n      const option = document.createElement(\"option\");\n      option.value = value;\n      option.textContent = label;\n      if (stack) option.style.fontFamily = stack;\n      family.appendChild(option);\n    });\n    familyLabel.appendChild(familyText);\n    familyLabel.appendChild(family);\n\n    const customLabel = document.createElement(\"label\");\n    customLabel.className = \"cudloun-post-fonts-field cudloun-post-fonts-custom\";\n    const customText = document.createElement(\"span\");\n    customText.textContent = \"Custom\";\n    const customWrap = document.createElement(\"span\");\n    customWrap.className = \"cudloun-post-fonts-custom-wrap\";\n    const custom = document.createElement(\"input\");\n    custom.type = \"text\";\n    custom.maxLength = MAX_CUSTOM_FAMILY_LENGTH;\n    custom.autocomplete = \"off\";\n    custom.spellcheck = false;\n    custom.placeholder = \"Georgia, serif\";\n    custom.setAttribute(\"aria-label\", \"Selected area custom font family\");\n    const customHint = document.createElement(\"small\");\n    customWrap.appendChild(custom);\n    customWrap.appendChild(customHint);\n    customLabel.appendChild(customText);\n    customLabel.appendChild(customWrap);\n\n    const sizeField = document.createElement(\"div\");\n    sizeField.className = \"cudloun-post-fonts-field\";\n    const sizeText = document.createElement(\"span\");\n    sizeText.textContent = \"Size\";\n    const sizeControls = document.createElement(\"div\");\n    sizeControls.className = \"cudloun-post-fonts-size\";\n    const range = document.createElement(\"input\");\n    range.type = \"range\";\n    range.setAttribute(\"aria-label\", \"Selected area font size slider\");\n    const number = document.createElement(\"input\");\n    number.type = \"number\";\n    number.inputMode = \"decimal\";\n    number.setAttribute(\"aria-label\", \"Selected area font size\");\n    const unit = document.createElement(\"span\");\n    sizeControls.appendChild(range);\n    sizeControls.appendChild(number);\n    sizeControls.appendChild(unit);\n    sizeField.appendChild(sizeText);\n    sizeField.appendChild(sizeControls);\n\n    const actions = document.createElement(\"div\");\n    actions.className = \"cudloun-post-fonts-actions cudloun-post-fonts-advanced-actions\";\n    const nativeLink = document.createElement(\"a\");\n    nativeLink.href = \"/test/fonts\";\n    nativeLink.textContent = \"Native settings\";\n    nativeLink.title = \"Open Kapybara's full experimental font settings\";\n    const reset = document.createElement(\"button\");\n    reset.type = \"button\";\n    reset.textContent = \"Reset area\";\n    actions.appendChild(nativeLink);\n    actions.appendChild(reset);\n\n    panel.appendChild(head);\n    panel.appendChild(roles);\n    panel.appendChild(areaName);\n    panel.appendChild(familyLabel);\n    panel.appendChild(customLabel);\n    panel.appendChild(sizeField);\n    panel.appendChild(actions);\n\n    let activeRole = \"posts\";\n    const sync = (role = activeRole) => {\n      const config = roleConfig(role);\n      activeRole = config.id;\n      roleButtons.forEach((button, id) => button.setAttribute(\"aria-selected\", id === activeRole ? \"true\" : \"false\"));\n      areaName.textContent = config.title;\n      family.value = currentRoleFamily(activeRole);\n      custom.value = currentRoleCustomFamily(activeRole);\n      syncCustomField(customLabel, custom, customHint, family.value);\n      range.min = String(config.sliderMin);\n      range.max = String(config.sliderMax);\n      range.step = String(config.step);\n      number.min = String(config.min);\n      number.max = String(config.max);\n      number.step = String(config.step);\n      unit.textContent = config.unit;\n      syncRoleSizeInputs(activeRole, range, number, currentRoleSize(activeRole));\n    };\n\n    roleButtons.forEach((roleButton, role) => roleButton.addEventListener(\"click\", () => sync(role)));\n    close.addEventListener(\"click\", () => setOpen(control, false));\n    family.addEventListener(\"change\", () => {\n      ctxRef?.storage.set(roleStorageKey(activeRole, \"family\"), validFamily(family.value));\n      syncCustomField(customLabel, custom, customHint, family.value);\n      applySettings();\n      if (family.value === \"custom\") custom.focus();\n    });\n    custom.addEventListener(\"input\", () => {\n      const value = custom.value.slice(0, MAX_CUSTOM_FAMILY_LENGTH);\n      ctxRef?.storage.set(roleStorageKey(activeRole, \"customFamily\"), value);\n      syncCustomField(customLabel, custom, customHint, family.value);\n      applySettings();\n    });\n    range.addEventListener(\"input\", () => {\n      const size = normalizeRoleSize(activeRole, range.value);\n      number.value = displayRoleSize(activeRole, size);\n      saveRoleSize(activeRole, size);\n    });\n    number.addEventListener(\"input\", () => {\n      if (number.value === \"\") return;\n      const config = roleConfig(activeRole);\n      const size = normalizeRoleSize(activeRole, number.value);\n      range.value = String(Math.min(config.sliderMax, Math.max(config.sliderMin, size)));\n      saveRoleSize(activeRole, size);\n    });\n    number.addEventListener(\"change\", () => {\n      const size = normalizeRoleSize(activeRole, number.value);\n      syncRoleSizeInputs(activeRole, range, number, size);\n      saveRoleSize(activeRole, size);\n    });\n    reset.addEventListener(\"click\", () => {\n      const config = roleConfig(activeRole);\n      ctxRef?.storage.set(roleStorageKey(activeRole, \"family\"), \"default\");\n      ctxRef?.storage.set(roleStorageKey(activeRole, \"customFamily\"), \"\");\n      ctxRef?.storage.set(roleStorageKey(activeRole, \"size\"), config.defaultSize);\n      applySettings();\n      sync(activeRole);\n    });\n    panel.addEventListener(\"cudloun-fonts-sync\", () => sync(activeRole));\n    sync();\n    return panel;\n  }\n\n  function installToggleGestures(button, control) {\n    let timer = null;\n    let start = null;\n    let suppressClick = false;\n    const cancel = () => {\n      window.clearTimeout(timer);\n      timer = null;\n      start = null;\n    };\n\n    button.addEventListener(\"click\", (event) => {\n      if (suppressClick) {\n        suppressClick = false;\n        event.preventDefault();\n        return;\n      }\n      const panel = control.querySelector(\".cudloun-post-fonts-panel--simple\");\n      setOpen(control, panel?.hidden !== false, \"simple\");\n    });\n    button.addEventListener(\"contextmenu\", (event) => {\n      event.preventDefault();\n      cancel();\n      suppressClick = event.button !== 2;\n      setOpen(control, true, \"advanced\");\n    });\n    button.addEventListener(\"pointerdown\", (event) => {\n      if (event.button !== 0 || event.pointerType === \"mouse\") return;\n      cancel();\n      start = { x: event.clientX, y: event.clientY };\n      timer = window.setTimeout(() => {\n        timer = null;\n        suppressClick = true;\n        setOpen(control, true, \"advanced\");\n      }, LONG_PRESS_MS);\n    });\n    button.addEventListener(\"pointermove\", (event) => {\n      if (!start) return;\n      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > LONG_PRESS_MOVE_PX) cancel();\n    });\n    button.addEventListener(\"pointerup\", cancel);\n    button.addEventListener(\"pointercancel\", cancel);\n    button.addEventListener(\"lostpointercapture\", cancel);\n  }\n\n  function setOpen(control, open, mode = \"simple\") {\n    const panels = Array.from(control.querySelectorAll(\".cudloun-post-fonts-panel\"));\n    const button = control.querySelector(\".cudloun-post-fonts-toggle\");\n    if (!panels.length || !button) return;\n    panels.forEach((panel) => {\n      const selected = panel.classList.contains(`cudloun-post-fonts-panel--${mode}`);\n      panel.hidden = !open || !selected;\n      if (open && selected && mode === \"advanced\") panel.dispatchEvent(new Event(\"cudloun-fonts-sync\"));\n    });\n    button.setAttribute(\"aria-expanded\", open ? \"true\" : \"false\");\n    control.dataset.openPanel = open ? mode : \"\";\n    if (open) {\n      const panel = control.querySelector(`.cudloun-post-fonts-panel--${mode}`);\n      (mode === \"advanced\" ? panel?.querySelector(\"[role='tab'][aria-selected='true']\") : panel?.querySelector(\"select\"))?.focus();\n    }\n  }\n\n  function saveSize(value) {\n    const size = normalizeSize(value);\n    ctxRef?.storage.set(\"size\", size);\n    applySettings();\n  }\n\n  function roleConfig(role) {\n    return FONT_ROLES.find((config) => config.id === role) || FONT_ROLES[0];\n  }\n\n  function roleStorageKey(role, field) {\n    if (role === \"posts\") {\n      if (field === \"family\") return \"family\";\n      if (field === \"customFamily\") return \"customFamily\";\n      if (field === \"size\") return \"size\";\n    }\n    return `${role}${field[0].toUpperCase()}${field.slice(1)}`;\n  }\n\n  function currentRoleFamily(role) {\n    return validFamily(ctxRef?.storage.get(roleStorageKey(role, \"family\"), \"default\"));\n  }\n\n  function currentRoleCustomFamily(role) {\n    return String(ctxRef?.storage.get(roleStorageKey(role, \"customFamily\"), \"\") || \"\").slice(0, MAX_CUSTOM_FAMILY_LENGTH);\n  }\n\n  function currentRoleSize(role) {\n    const config = roleConfig(role);\n    return normalizeRoleSize(role, ctxRef?.storage.get(roleStorageKey(role, \"size\"), config.defaultSize));\n  }\n\n  function saveRoleSize(role, value) {\n    ctxRef?.storage.set(roleStorageKey(role, \"size\"), normalizeRoleSize(role, value));\n    applySettings();\n  }\n\n  function applySettings() {\n    const rootElement = document.documentElement;\n    rootElement.setAttribute(\"data-cudloun-post-fonts\", \"true\");\n    FONT_ROLES.forEach((config) => applyRoleSettings(rootElement, config));\n  }\n\n  function applyRoleSettings(rootElement, config) {\n    const family = currentRoleFamily(config.id);\n    const stack = fontStack(family, currentRoleCustomFamily(config.id));\n    const cssId = config.id === \"posts\" ? \"post\" : config.id;\n    const familyAttribute = `data-cudloun-${cssId}-font-family`;\n    const sizeAttribute = `data-cudloun-${cssId}-font-size`;\n    const familyProperty = `--cudloun-${cssId}-font-family`;\n    const sizeProperty = `--cudloun-${cssId}-font-size`;\n    const size = currentRoleSize(config.id);\n\n    rootElement.setAttribute(familyAttribute, stack ? family : \"default\");\n    if (stack) rootElement.style.setProperty(familyProperty, stack);\n    else rootElement.style.removeProperty(familyProperty);\n\n    const applySize = config.id === \"posts\" || size !== config.defaultSize;\n    if (applySize) {\n      rootElement.setAttribute(sizeAttribute, \"true\");\n      rootElement.style.setProperty(sizeProperty, `${displayRoleSize(config.id, size)}${config.unit}`);\n    } else {\n      rootElement.removeAttribute(sizeAttribute);\n      rootElement.style.removeProperty(sizeProperty);\n    }\n  }\n\n  function clearSettings() {\n    const rootElement = document.documentElement;\n    rootElement.removeAttribute(\"data-cudloun-post-fonts\");\n    FONT_ROLES.forEach((config) => {\n      const cssId = config.id === \"posts\" ? \"post\" : config.id;\n      rootElement.removeAttribute(`data-cudloun-${cssId}-font-family`);\n      rootElement.removeAttribute(`data-cudloun-${cssId}-font-size`);\n      rootElement.style.removeProperty(`--cudloun-${cssId}-font-family`);\n      rootElement.style.removeProperty(`--cudloun-${cssId}-font-size`);\n    });\n  }\n\n  function currentSize() {\n    return normalizeSize(ctxRef?.storage.get(\"size\", DEFAULT_SIZE));\n  }\n\n  function normalizeSize(value) {\n    const parsed = Number(value);\n    if (!Number.isFinite(parsed)) return DEFAULT_SIZE;\n    const clamped = Math.min(MAX_SIZE, Math.max(MIN_SIZE, parsed));\n    return Math.round(clamped * 2) / 2;\n  }\n\n  function normalizeRoleSize(role, value) {\n    if (role === \"posts\") return normalizeSize(value);\n    const config = roleConfig(role);\n    const parsed = Number(value);\n    if (!Number.isFinite(parsed)) return config.defaultSize;\n    const clamped = Math.min(config.max, Math.max(config.min, parsed));\n    return Math.round(clamped / config.step) * config.step;\n  }\n\n  function displaySize(value) {\n    const size = normalizeSize(value);\n    return Number.isInteger(size) ? String(size) : size.toFixed(1);\n  }\n\n  function displayRoleSize(role, value) {\n    return role === \"posts\" ? displaySize(value) : String(normalizeRoleSize(role, value));\n  }\n\n  function validFamily(value) {\n    const candidate = String(value || \"default\");\n    return FAMILIES.some((font) => font.value === candidate) ? candidate : \"default\";\n  }\n\n  function fontStack(value, customFamily = \"\") {\n    const family = validFamily(value);\n    if (family === \"custom\") return normalizeCustomFamily(customFamily);\n    return FAMILIES.find((font) => font.value === family)?.stack || \"\";\n  }\n\n  function normalizeCustomFamily(value) {\n    const source = String(value || \"\").trim();\n    if (!source || source.length > MAX_CUSTOM_FAMILY_LENGTH) return \"\";\n    if (/[;{}()\\\\/:]/.test(source) || /[\\u0000-\\u001f\\u007f]/.test(source)) return \"\";\n\n    const tokens = [];\n    let token = \"\";\n    let quote = \"\";\n    for (const character of source) {\n      if ((character === \"\\\"\" || character === \"'\") && !quote) quote = character;\n      else if (character === quote) quote = \"\";\n      if (character === \",\" && !quote) {\n        tokens.push(token.trim());\n        token = \"\";\n      } else {\n        token += character;\n      }\n    }\n    if (quote) return \"\";\n    tokens.push(token.trim());\n    if (tokens.some((item) => !item)) return \"\";\n\n    const safeName = /^[\\p{L}\\p{N} ._-]+$/u;\n    const normalized = [];\n    for (const item of tokens) {\n      const opening = item[0];\n      const quoted = opening === \"\\\"\" || opening === \"'\";\n      if (quoted) {\n        if (item.length < 3 || item[item.length - 1] !== opening) return \"\";\n        const name = item.slice(1, -1).trim().replace(/\\s+/g, \" \");\n        if (!name || !safeName.test(name)) return \"\";\n        normalized.push(`${opening}${name}${opening}`);\n      } else {\n        const name = item.replace(/\\s+/g, \" \");\n        if (!safeName.test(name)) return \"\";\n        normalized.push(name);\n      }\n    }\n    return normalized.join(\", \");\n  }\n\n  function syncCustomField(field, input, hint, family) {\n    field.hidden = family !== \"custom\";\n    const value = input.value.trim();\n    const normalized = normalizeCustomFamily(value);\n    const invalid = Boolean(value && !normalized);\n    input.setAttribute(\"aria-invalid\", invalid ? \"true\" : \"false\");\n    hint.textContent = invalid\n      ? \"Use comma-separated font names only\"\n      : \"Comma-separated local font names\";\n  }\n\n  function syncSizeInputs(range, number, value) {\n    const size = normalizeSize(value);\n    range.value = String(Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, size)));\n    number.value = displaySize(size);\n  }\n\n  function syncRoleSizeInputs(role, range, number, value) {\n    const config = roleConfig(role);\n    const size = normalizeRoleSize(role, value);\n    range.value = String(Math.min(config.sliderMax, Math.max(config.sliderMin, size)));\n    number.value = displayRoleSize(role, size);\n  }\n\n  function installStyles() {\n    if (document.getElementById(STYLE_ID)) return;\n    const style = document.createElement(\"style\");\n    style.id = STYLE_ID;\n    style.textContent = `\n      html[data-cudloun-post-fonts=\"true\"] article.post .body,\n      html[data-cudloun-post-fonts=\"true\"] article.post .body .markdown {\n        font-size: var(--cudloun-post-font-size, 17px) !important;\n      }\n      html[data-cudloun-post-fonts=\"true\"]:not([data-cudloun-post-font-family=\"default\"]) article.post .body,\n      html[data-cudloun-post-fonts=\"true\"]:not([data-cudloun-post-font-family=\"default\"]) article.post .body .markdown {\n        font-family: var(--cudloun-post-font-family) !important;\n      }\n      html[data-cudloun-interface-font-family]:not([data-cudloun-interface-font-family=\"default\"]) :where(header:not(.post-header),nav,section.new-post-composer,section.reply-composer),\n      html[data-cudloun-interface-font-family]:not([data-cudloun-interface-font-family=\"default\"]) :where(header:not(.post-header),nav,section.new-post-composer,section.reply-composer) :where(button,input,select,textarea):not(.cudloun-post-fonts-control *){font-family:var(--cudloun-interface-font-family)!important}\n      html[data-cudloun-interface-font-size=\"true\"] :where(header:not(.post-header),nav,section.new-post-composer,section.reply-composer){font-size:var(--cudloun-interface-font-size)!important}\n      html[data-cudloun-interface-font-size=\"true\"] :where(header:not(.post-header),nav,section.new-post-composer,section.reply-composer) :where(button,input,select,textarea):not(.cudloun-post-fonts-control *){font-size:var(--cudloun-interface-font-size)!important}\n      html[data-cudloun-headings-font-family]:not([data-cudloun-headings-font-family=\"default\"]) :where(h1,h2,h3,h4,h5,h6,.title-link,article.post .author){font-family:var(--cudloun-headings-font-family)!important}\n      html[data-cudloun-headings-font-size=\"true\"] :where(h1,h2,h3,h4,h5,h6,.title-link,article.post .author){font-size:var(--cudloun-headings-font-size)!important}\n      html[data-cudloun-code-font-family]:not([data-cudloun-code-font-family=\"default\"]) :where(pre,code,kbd,samp){font-family:var(--cudloun-code-font-family)!important}\n      html[data-cudloun-code-font-size=\"true\"] :where(pre,:not(pre)>code,kbd,samp){font-size:var(--cudloun-code-font-size)!important}\n      html[data-cudloun-logo-font-family]:not([data-cudloun-logo-font-family=\"default\"]) :where(a[aria-label=\"Okoun home\"],.logo) :where(.text,.orange-o){font-family:var(--cudloun-logo-font-family)!important}\n      html[data-cudloun-logo-font-size=\"true\"] :where(a[aria-label=\"Okoun home\"],.logo){zoom:var(--cudloun-logo-font-size)}\n      .${CONTROL_CLASS}{position:absolute;top:8px;right:60px;z-index:4;font:14px/1.3 system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;color:#243041}\n      .${CONTROL_CLASS}[data-placement=\"board-header\"],.${CONTROL_CLASS}[data-placement=\"global-actions\"]{position:relative;top:auto;right:auto;bottom:auto;z-index:4;flex:0 0 auto}\n      .${CONTROL_CLASS}[data-placement=\"global-actions\"]{order:-1}\n      .${CONTROL_CLASS}[data-placement=\"board-header\"] .cudloun-post-fonts-toggle,.${CONTROL_CLASS}[data-placement=\"global-actions\"] .cudloun-post-fonts-toggle{width:36px;height:36px;border:0;border-radius:50%;box-shadow:none;background:transparent}\n      .${CONTROL_CLASS}[data-placement=\"board-header\"] .cudloun-post-fonts-panel{top:44px;right:0}\n      .${CONTROL_CLASS}[data-placement=\"global-actions\"] .cudloun-post-fonts-panel{top:45px;right:0}\n      .cudloun-post-fonts-toggle{appearance:none;width:38px;height:38px;display:grid;place-items:center;margin:0;border:1px solid rgba(79,102,134,.3);border-radius:8px;background:#fff;color:#8a5300;box-shadow:0 2px 7px rgba(18,27,43,.14);cursor:pointer;font:italic 800 20px/1 Georgia,serif;-webkit-touch-callout:none;user-select:none}\n      .cudloun-post-fonts-toggle:hover,.cudloun-post-fonts-toggle[aria-expanded=\"true\"]{border-color:#b06a00;background:#fff8eb;color:#7a4700}\n      .cudloun-post-fonts-toggle:focus-visible{outline:2px solid #b06a00;outline-offset:2px}\n      .cudloun-post-fonts-panel{box-sizing:border-box;position:absolute;top:46px;right:0;width:286px;padding:12px;border:1px solid rgba(79,102,134,.3);border-radius:10px;background:#fff;color:#243041;box-shadow:0 12px 32px rgba(18,27,43,.24)}\n      .cudloun-post-fonts-panel--advanced{width:330px}\n      .cudloun-post-fonts-panel[hidden]{display:none!important}\n      .cudloun-post-fonts-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 10px}\n      .cudloun-post-fonts-head strong{font-size:14px}\n      .cudloun-post-fonts-advanced-title{display:grid;gap:2px}\n      .cudloun-post-fonts-advanced-title small,.cudloun-post-fonts-advanced-hint{color:#697586;font-size:11px;font-weight:500}\n      .cudloun-post-fonts-advanced-hint{display:block;margin-top:7px;text-align:right}\n      .cudloun-post-fonts-close{appearance:none;width:28px;height:28px;border:0;border-radius:6px;background:transparent;color:#697586;cursor:pointer;font:700 20px/1 inherit}\n      .cudloun-post-fonts-close:hover{background:#eef2f7;color:#243041}\n      .cudloun-post-fonts-field{display:grid;grid-template-columns:52px minmax(0,1fr);align-items:center;gap:9px;margin:8px 0;font-weight:650}\n      .cudloun-post-fonts-field select,.cudloun-post-fonts-field input[type=\"number\"],.cudloun-post-fonts-field input[type=\"text\"]{box-sizing:border-box;min-height:36px;border:1px solid rgba(79,102,134,.32);border-radius:7px;background:#fff;color:#182230;padding:0 8px;font:inherit}\n      .cudloun-post-fonts-field select{width:100%}\n      .cudloun-post-fonts-custom[hidden]{display:none!important}\n      .cudloun-post-fonts-custom{align-items:start}\n      .cudloun-post-fonts-custom>span:first-child{padding-top:9px}\n      .cudloun-post-fonts-custom-wrap{display:grid;gap:4px;min-width:0}\n      .cudloun-post-fonts-custom-wrap input{width:100%}\n      .cudloun-post-fonts-custom-wrap input[aria-invalid=\"true\"]{border-color:#b42318;outline-color:#b42318}\n      .cudloun-post-fonts-custom-wrap small{color:#697586;font-size:11px;font-weight:500}\n      .cudloun-post-fonts-size{display:grid;grid-template-columns:minmax(0,1fr) 62px auto;align-items:center;gap:7px}\n      .cudloun-post-fonts-size input[type=\"range\"]{width:100%;accent-color:#b06a00}\n      .cudloun-post-fonts-size input[type=\"number\"]{width:62px;text-align:right}\n      .cudloun-post-fonts-size>span{color:#697586;font-size:12px}\n      .cudloun-post-fonts-roles{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;margin:2px 0 10px}\n      .cudloun-post-fonts-roles button{appearance:none;min-width:0;border:1px solid rgba(79,102,134,.25);border-radius:999px;background:#f8fafc;color:#4a5667;cursor:pointer;font:700 11px/1.2 inherit;padding:7px 3px}\n      .cudloun-post-fonts-roles button[aria-selected=\"true\"]{border-color:#b06a00;background:#fff3dc;color:#7a4700}\n      .cudloun-post-fonts-area-name{display:block;margin:0 0 4px;color:#697586;font-size:11px}\n      .cudloun-post-fonts-actions{display:flex;justify-content:flex-end;margin-top:10px;padding-top:10px;border-top:1px solid rgba(79,102,134,.16)}\n      .cudloun-post-fonts-actions button{appearance:none;border:1px solid rgba(79,102,134,.26);border-radius:7px;background:#f8fafc;color:#364152;cursor:pointer;font:700 12px/1.2 inherit;padding:7px 10px}\n      .cudloun-post-fonts-actions button:hover{background:#eef2f7}\n      .cudloun-post-fonts-advanced-actions{align-items:center;justify-content:space-between}\n      .cudloun-post-fonts-advanced-actions a{color:#8a5300;font-size:11px;font-weight:700;text-decoration:none}\n      .cudloun-post-fonts-advanced-actions a:hover{text-decoration:underline}\n      html[data-cudloun-kapybara-theme=\"dark\"] .cudloun-post-fonts-toggle,\n      html[data-cudloun-kapybara-theme=\"dark\"] .cudloun-post-fonts-panel,\n      html[data-cudloun-kapybara-theme=\"dark\"] .cudloun-post-fonts-field select,\n      html[data-cudloun-kapybara-theme=\"dark\"] .cudloun-post-fonts-field input[type=\"number\"],\n      html[data-cudloun-kapybara-theme=\"dark\"] .cudloun-post-fonts-field input[type=\"text\"],\n      html[data-cudloun-kapybara-theme=\"dark\"] .cudloun-post-fonts-actions button,\n      html[data-cudloun-kapybara-theme=\"dark\"] .cudloun-post-fonts-roles button{background:var(--cudloun-kapybara-surface,#141414);color:var(--cudloun-kapybara-text,#f4f4f4);border-color:var(--cudloun-kapybara-line,#303030)}\n      html[data-cudloun-kapybara-theme=\"dark\"] .cudloun-post-fonts-roles button[aria-selected=\"true\"]{background:var(--cudloun-kapybara-accent-soft,#3a2b16);color:var(--cudloun-kapybara-accent,#d68a1f);border-color:var(--cudloun-kapybara-accent,#d68a1f)}\n      html[data-cudloun-kapybara-theme=\"dark\"] .cudloun-post-fonts-advanced-actions a{color:var(--cudloun-kapybara-accent,#d68a1f)}\n      html[data-cudloun-kapybara-theme=\"dark\"] .${CONTROL_CLASS}[data-placement=\"board-header\"] .cudloun-post-fonts-toggle,\n      html[data-cudloun-kapybara-theme=\"dark\"] .${CONTROL_CLASS}[data-placement=\"global-actions\"] .cudloun-post-fonts-toggle{background:transparent;border-color:transparent}\n      @media(max-width:700px){\n        .${CONTROL_CLASS}[data-placement=\"floating\"]{position:fixed;top:auto;right:14px;bottom:62px;z-index:2020}\n        .${CONTROL_CLASS}[data-placement=\"floating\"] .cudloun-post-fonts-toggle{width:46px;height:46px;border-radius:50%;background:#b06a00;color:#fff;box-shadow:0 6px 20px rgba(18,27,43,.3);font-size:23px}\n        .${CONTROL_CLASS}[data-placement=\"floating\"] .cudloun-post-fonts-toggle:hover,\n        .${CONTROL_CLASS}[data-placement=\"floating\"] .cudloun-post-fonts-toggle[aria-expanded=\"true\"]{background:#8f5600;color:#fff}\n        .${CONTROL_CLASS}[data-placement=\"floating\"] .cudloun-post-fonts-panel{top:auto;right:0;bottom:54px}\n        .cudloun-post-fonts-panel{width:min(286px,calc(100vw - 20px));max-height:calc(100dvh - 72px);overflow:auto}\n        .cudloun-post-fonts-panel--advanced{width:min(330px,calc(100vw - 20px))}\n      }\n    `;\n    document.head.appendChild(style);\n  }\n})();\n");
  embeddedScripts.set("modules/post-fonts.js", function () {
    // Compact quick and per-area font controls for Kapybara board pages.
    (function () {
      "use strict";

      const root = window.Cudloun;
      const STYLE_ID = "cudloun-post-fonts-style";
      const CONTROL_CLASS = "cudloun-post-fonts-control";
      const DEFAULT_SIZE = 17;
      const MIN_SIZE = 8;
      const MAX_SIZE = 72;
      const SLIDER_MIN = 10;
      const SLIDER_MAX = 32;
      const LONG_PRESS_MS = 520;
      const LONG_PRESS_MOVE_PX = 10;
      const MAX_CUSTOM_FAMILY_LENGTH = 160;
      const FONT_ROLES = [
        { id: "posts", label: "Posts", title: "Post content", unit: "px", defaultSize: DEFAULT_SIZE, min: MIN_SIZE, max: MAX_SIZE, sliderMin: SLIDER_MIN, sliderMax: SLIDER_MAX, step: 0.5 },
        { id: "interface", label: "UI", title: "Interface", unit: "px", defaultSize: 16, min: 12, max: 20, sliderMin: 12, sliderMax: 20, step: 1 },
        { id: "headings", label: "Titles", title: "Headings and authors", unit: "%", defaultSize: 100, min: 70, max: 130, sliderMin: 70, sliderMax: 130, step: 5 },
        { id: "code", label: "Code", title: "Code and monospace text", unit: "%", defaultSize: 100, min: 70, max: 130, sliderMin: 70, sliderMax: 130, step: 5 },
        { id: "logo", label: "Logo", title: "Okoun logo", unit: "%", defaultSize: 100, min: 70, max: 130, sliderMin: 70, sliderMax: 130, step: 5 },
      ];
      const FAMILIES = [
        { value: "default", label: "Kapybara default", stack: "" },
        { value: "classic-okoun", label: "Classic Okoun", stack: "Verdana, \"Bitstream Vera Sans\", Arial, sans-serif" },
        { value: "system", label: "System sans", stack: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif" },
        { value: "system-serif", label: "System serif", stack: "ui-serif, Georgia, Cambria, \"Times New Roman\", serif" },
        { value: "system-mono", label: "System monospace", stack: "ui-monospace, \"SFMono-Regular\", Consolas, \"Liberation Mono\", monospace" },
        { value: "roboto", label: "Roboto", stack: "Roboto, Arial, sans-serif" },
        { value: "noto-sans", label: "Noto Sans", stack: "\"Noto Sans\", Arial, sans-serif" },
        { value: "segoe", label: "Segoe UI", stack: "\"Segoe UI\", Arial, sans-serif" },
        { value: "helvetica", label: "Helvetica", stack: "Helvetica, Arial, sans-serif" },
        { value: "arial", label: "Arial", stack: "Arial, sans-serif" },
        { value: "verdana", label: "Verdana", stack: "Verdana, Geneva, sans-serif" },
        { value: "tahoma", label: "Tahoma", stack: "Tahoma, sans-serif" },
        { value: "trebuchet", label: "Trebuchet MS", stack: "\"Trebuchet MS\", sans-serif" },
        { value: "georgia", label: "Georgia", stack: "Georgia, serif" },
        { value: "times", label: "Times New Roman", stack: "\"Times New Roman\", Times, serif" },
        { value: "garamond", label: "Garamond", stack: "Garamond, Georgia, serif" },
        { value: "palatino", label: "Palatino", stack: "Palatino, \"Palatino Linotype\", serif" },
        { value: "courier", label: "Courier New", stack: "\"Courier New\", monospace" },
        { value: "consolas", label: "Consolas", stack: "Consolas, \"Liberation Mono\", monospace" },
        { value: "comic-sans", label: "Comic Sans MS", stack: "\"Comic Sans MS\", cursive" },
        { value: "custom", label: "Custom…", stack: "" },
      ];
      let ctxRef = null;
      let observer = null;
      let routeTimer = null;
      let mountTimer = null;
      let outsideHandler = null;
      let keyHandler = null;
      let resizeHandler = null;

      root.postFonts = {
        families: FAMILIES.map(({ value, label }) => ({ value, label })),
        roles: FONT_ROLES.map(({ id, label, title, unit, defaultSize, min, max, step }) => ({ id, label, title, unit, defaultSize, min, max, step })),
        longPressMs: LONG_PRESS_MS,
        normalizeSize,
        normalizeRoleSize,
        normalizeCustomFamily,
        fontStack,
      };

      root.registerModule({
        id: "post-fonts",
        name: "Post Fonts",
        description: "Quick post fonts with optional per-area controls for Kapybara.",
        version: "0.5.0",
        defaultEnabled: false,
        start(ctx) {
          if (!root.kapyguts?.isKapybara?.()) return null;
          return start(ctx);
        },
        renderSettings() {
          const wrap = document.createElement("div");
          wrap.className = "cudloun-settings-list";

          const row = document.createElement("div");
          row.className = "cudloun-setting-row";
          const text = document.createElement("div");
          text.className = "cudloun-setting-text";
          text.textContent = "Tap f for quick post fonts. Hold it on touch screens or right-click it for separate interface, heading, code, and logo controls.";
          row.appendChild(text);
          wrap.appendChild(row);
          return wrap;
        },
        renderHelp() {
          return [
            "Open f to choose a preset or enter a comma-separated custom font stack, then adjust its size with the slider or number field.",
            "Hold f on a touch screen, or right-click it with a mouse, to open advanced controls for Posts, UI, Titles, Code, and Logo.",
            "Changes apply immediately to the selected area and are remembered across page loads.",
            "Custom fonts must already be available in your browser or device; later names in the stack act as fallbacks.",
            "Reset restores the currently selected area; untouched advanced areas keep Kapybara's native styling.",
          ];
        },
      });

      function start(ctx) {
        stop();
        ctxRef = ctx;
        installStyles();
        applySettings();
        mountForRoute();

        observer = new MutationObserver(scheduleMount);
        observer.observe(document.body, { childList: true, subtree: true });

        outsideHandler = (event) => {
          const control = document.querySelector(`.${CONTROL_CLASS}`);
          if (!control || control.contains(event.target)) return;
          setOpen(control, false);
        };
        keyHandler = (event) => {
          if (event.key !== "Escape") return;
          const control = document.querySelector(`.${CONTROL_CLASS}`);
          if (control) setOpen(control, false);
        };
        document.addEventListener("pointerdown", outsideHandler, true);
        document.addEventListener("keydown", keyHandler, true);
        resizeHandler = scheduleMount;
        window.addEventListener("resize", resizeHandler);
        observeRoute();
        ctx.log.info("post font controls ready");
        return stop;
      }

      function stop() {
        observer?.disconnect();
        observer = null;
        window.clearTimeout(routeTimer);
        window.clearTimeout(mountTimer);
        routeTimer = null;
        mountTimer = null;
        if (outsideHandler) document.removeEventListener("pointerdown", outsideHandler, true);
        if (keyHandler) document.removeEventListener("keydown", keyHandler, true);
        if (resizeHandler) window.removeEventListener("resize", resizeHandler);
        outsideHandler = null;
        keyHandler = null;
        resizeHandler = null;
        document.querySelectorAll(`.${CONTROL_CLASS}`).forEach((control) => control.remove());
        document.getElementById(STYLE_ID)?.remove();
        clearSettings();
        ctxRef = null;
      }

      function observeRoute() {
        let lastRoute = root.currentRoute();
        const check = () => {
          const route = root.currentRoute();
          if (route !== lastRoute) {
            lastRoute = route;
            mountForRoute();
          }
          routeTimer = window.setTimeout(check, 500);
        };
        routeTimer = window.setTimeout(check, 500);
      }

      function scheduleMount() {
        window.clearTimeout(mountTimer);
        mountTimer = window.setTimeout(mountForRoute, 60);
      }

      function mountForRoute() {
        const controls = Array.from(document.querySelectorAll(`.${CONTROL_CLASS}`));
        if (!root.kapyguts?.isBoardPage?.()) {
          controls.forEach((control) => control.remove());
          return;
        }

        const target = controlTarget();
        if (!target) return;
        const connected = controls.find((control) => (
          control.parentElement === target.host && control.dataset.placement === target.placement
        ));
        controls.filter((control) => control !== connected).forEach((control) => control.remove());
        if (!connected) target.host.appendChild(makeControl(target.placement));
      }

      function controlTarget() {
        if (window.matchMedia("(max-width: 700px)").matches) {
          const boardActions = root.kapyguts?.boardHeaderParts?.().actions;
          if (boardActions) return { host: boardActions, placement: "board-header" };
          const header = persistentHeader();
          return header ? { host: header, placement: "floating" } : null;
        }

        const desktopActions = root.kapyguts?.pageHeaderParts?.().desktopActions;
        if (desktopActions) return { host: desktopActions, placement: "global-actions" };
        const header = persistentHeader();
        return header ? { host: header, placement: "global-header" } : null;
      }

      function persistentHeader() {
        return root.kapyguts?.pageHeader?.() || null;
      }

      function makeControl(placement) {
        const control = document.createElement("div");
        control.className = CONTROL_CLASS;
        control.dataset.placement = placement;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "cudloun-post-fonts-toggle";
        button.textContent = "f";
        button.title = "Post fonts — hold or right-click for more";
        button.setAttribute("aria-label", "Post font controls");
        button.setAttribute("aria-expanded", "false");

        const panel = document.createElement("section");
        panel.className = "cudloun-post-fonts-panel cudloun-post-fonts-panel--simple";
        panel.hidden = true;
        panel.setAttribute("aria-label", "Post font controls");

        const head = document.createElement("div");
        head.className = "cudloun-post-fonts-head";
        const title = document.createElement("strong");
        title.textContent = "Post font";
        const close = document.createElement("button");
        close.type = "button";
        close.className = "cudloun-post-fonts-close";
        close.textContent = "×";
        close.setAttribute("aria-label", "Close post font controls");
        head.appendChild(title);
        head.appendChild(close);

        const familyLabel = document.createElement("label");
        familyLabel.className = "cudloun-post-fonts-field";
        const familyText = document.createElement("span");
        familyText.textContent = "Font";
        const family = document.createElement("select");
        family.setAttribute("aria-label", "Post font family");
        FAMILIES.forEach(({ value, label, stack }) => {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = label;
          if (stack) option.style.fontFamily = stack;
          family.appendChild(option);
        });
        family.value = validFamily(ctxRef?.storage.get("family", "default"));
        familyLabel.appendChild(familyText);
        familyLabel.appendChild(family);

        const customLabel = document.createElement("label");
        customLabel.className = "cudloun-post-fonts-field cudloun-post-fonts-custom";
        const customText = document.createElement("span");
        customText.textContent = "Custom";
        const customWrap = document.createElement("span");
        customWrap.className = "cudloun-post-fonts-custom-wrap";
        const custom = document.createElement("input");
        custom.type = "text";
        custom.maxLength = MAX_CUSTOM_FAMILY_LENGTH;
        custom.autocomplete = "off";
        custom.spellcheck = false;
        custom.placeholder = "\"Atkinson Hyperlegible\", Arial, sans-serif";
        custom.setAttribute("aria-label", "Custom post font family");
        const customHint = document.createElement("small");
        customHint.textContent = "Comma-separated local font names";
        customWrap.appendChild(custom);
        customWrap.appendChild(customHint);
        customLabel.appendChild(customText);
        customLabel.appendChild(customWrap);
        custom.value = String(ctxRef?.storage.get("customFamily", "") || "").slice(0, MAX_CUSTOM_FAMILY_LENGTH);
        syncCustomField(customLabel, custom, customHint, family.value);

        const sizeField = document.createElement("div");
        sizeField.className = "cudloun-post-fonts-field";
        const sizeText = document.createElement("span");
        sizeText.textContent = "Size";
        const sizeControls = document.createElement("div");
        sizeControls.className = "cudloun-post-fonts-size";
        const range = document.createElement("input");
        range.type = "range";
        range.min = String(SLIDER_MIN);
        range.max = String(SLIDER_MAX);
        range.step = "0.5";
        range.setAttribute("aria-label", "Post font size slider");
        const number = document.createElement("input");
        number.type = "number";
        number.min = String(MIN_SIZE);
        number.max = String(MAX_SIZE);
        number.step = "0.5";
        number.inputMode = "decimal";
        number.setAttribute("aria-label", "Post font size in pixels");
        const unit = document.createElement("span");
        unit.textContent = "px";
        sizeControls.appendChild(range);
        sizeControls.appendChild(number);
        sizeControls.appendChild(unit);
        sizeField.appendChild(sizeText);
        sizeField.appendChild(sizeControls);

        const actions = document.createElement("div");
        actions.className = "cudloun-post-fonts-actions";
        const reset = document.createElement("button");
        reset.type = "button";
        reset.textContent = "Reset";
        actions.appendChild(reset);

        const advancedHint = document.createElement("small");
        advancedHint.className = "cudloun-post-fonts-advanced-hint";
        advancedHint.textContent = "Hold or right-click f for more";

        panel.appendChild(head);
        panel.appendChild(familyLabel);
        panel.appendChild(customLabel);
        panel.appendChild(sizeField);
        panel.appendChild(actions);
        panel.appendChild(advancedHint);
        control.appendChild(button);
        control.appendChild(panel);
        control.appendChild(makeAdvancedPanel(control));

        syncSizeInputs(range, number, currentSize());
        installToggleGestures(button, control);
        close.addEventListener("click", () => setOpen(control, false));
        family.addEventListener("change", () => {
          ctxRef?.storage.set("family", validFamily(family.value));
          syncCustomField(customLabel, custom, customHint, family.value);
          applySettings();
          if (family.value === "custom") custom.focus();
        });
        custom.addEventListener("input", () => {
          const value = custom.value.slice(0, MAX_CUSTOM_FAMILY_LENGTH);
          ctxRef?.storage.set("customFamily", value);
          syncCustomField(customLabel, custom, customHint, family.value);
          applySettings();
        });
        range.addEventListener("input", () => {
          const size = normalizeSize(range.value);
          number.value = displaySize(size);
          saveSize(size);
        });
        number.addEventListener("input", () => {
          if (number.value === "") return;
          const size = normalizeSize(number.value);
          range.value = String(Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, size)));
          saveSize(size);
        });
        number.addEventListener("change", () => {
          const size = normalizeSize(number.value);
          syncSizeInputs(range, number, size);
          saveSize(size);
        });
        reset.addEventListener("click", () => {
          family.value = "default";
          custom.value = "";
          syncCustomField(customLabel, custom, customHint, family.value);
          syncSizeInputs(range, number, DEFAULT_SIZE);
          ctxRef?.storage.set("family", "default");
          ctxRef?.storage.set("customFamily", "");
          ctxRef?.storage.set("size", DEFAULT_SIZE);
          applySettings();
        });
        return control;
      }

      function makeAdvancedPanel(control) {
        const panel = document.createElement("section");
        panel.className = "cudloun-post-fonts-panel cudloun-post-fonts-panel--advanced";
        panel.hidden = true;
        panel.setAttribute("aria-label", "Advanced font controls");

        const head = document.createElement("div");
        head.className = "cudloun-post-fonts-head";
        const heading = document.createElement("div");
        heading.className = "cudloun-post-fonts-advanced-title";
        const title = document.createElement("strong");
        title.textContent = "More fonts";
        const intro = document.createElement("small");
        intro.textContent = "Pick an area, then tune it";
        heading.appendChild(title);
        heading.appendChild(intro);
        const close = document.createElement("button");
        close.type = "button";
        close.className = "cudloun-post-fonts-close";
        close.textContent = "×";
        close.setAttribute("aria-label", "Close advanced font controls");
        head.appendChild(heading);
        head.appendChild(close);

        const roles = document.createElement("div");
        roles.className = "cudloun-post-fonts-roles";
        roles.setAttribute("role", "tablist");
        roles.setAttribute("aria-label", "Font area");
        const roleButtons = new Map();
        FONT_ROLES.forEach((config) => {
          const roleButton = document.createElement("button");
          roleButton.type = "button";
          roleButton.textContent = config.label;
          roleButton.title = config.title;
          roleButton.dataset.fontRole = config.id;
          roleButton.setAttribute("role", "tab");
          roleButton.setAttribute("aria-selected", "false");
          roles.appendChild(roleButton);
          roleButtons.set(config.id, roleButton);
        });

        const areaName = document.createElement("strong");
        areaName.className = "cudloun-post-fonts-area-name";

        const familyLabel = document.createElement("label");
        familyLabel.className = "cudloun-post-fonts-field";
        const familyText = document.createElement("span");
        familyText.textContent = "Font";
        const family = document.createElement("select");
        family.setAttribute("aria-label", "Selected area font family");
        FAMILIES.forEach(({ value, label, stack }) => {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = label;
          if (stack) option.style.fontFamily = stack;
          family.appendChild(option);
        });
        familyLabel.appendChild(familyText);
        familyLabel.appendChild(family);

        const customLabel = document.createElement("label");
        customLabel.className = "cudloun-post-fonts-field cudloun-post-fonts-custom";
        const customText = document.createElement("span");
        customText.textContent = "Custom";
        const customWrap = document.createElement("span");
        customWrap.className = "cudloun-post-fonts-custom-wrap";
        const custom = document.createElement("input");
        custom.type = "text";
        custom.maxLength = MAX_CUSTOM_FAMILY_LENGTH;
        custom.autocomplete = "off";
        custom.spellcheck = false;
        custom.placeholder = "Georgia, serif";
        custom.setAttribute("aria-label", "Selected area custom font family");
        const customHint = document.createElement("small");
        customWrap.appendChild(custom);
        customWrap.appendChild(customHint);
        customLabel.appendChild(customText);
        customLabel.appendChild(customWrap);

        const sizeField = document.createElement("div");
        sizeField.className = "cudloun-post-fonts-field";
        const sizeText = document.createElement("span");
        sizeText.textContent = "Size";
        const sizeControls = document.createElement("div");
        sizeControls.className = "cudloun-post-fonts-size";
        const range = document.createElement("input");
        range.type = "range";
        range.setAttribute("aria-label", "Selected area font size slider");
        const number = document.createElement("input");
        number.type = "number";
        number.inputMode = "decimal";
        number.setAttribute("aria-label", "Selected area font size");
        const unit = document.createElement("span");
        sizeControls.appendChild(range);
        sizeControls.appendChild(number);
        sizeControls.appendChild(unit);
        sizeField.appendChild(sizeText);
        sizeField.appendChild(sizeControls);

        const actions = document.createElement("div");
        actions.className = "cudloun-post-fonts-actions cudloun-post-fonts-advanced-actions";
        const nativeLink = document.createElement("a");
        nativeLink.href = "/test/fonts";
        nativeLink.textContent = "Native settings";
        nativeLink.title = "Open Kapybara's full experimental font settings";
        const reset = document.createElement("button");
        reset.type = "button";
        reset.textContent = "Reset area";
        actions.appendChild(nativeLink);
        actions.appendChild(reset);

        panel.appendChild(head);
        panel.appendChild(roles);
        panel.appendChild(areaName);
        panel.appendChild(familyLabel);
        panel.appendChild(customLabel);
        panel.appendChild(sizeField);
        panel.appendChild(actions);

        let activeRole = "posts";
        const sync = (role = activeRole) => {
          const config = roleConfig(role);
          activeRole = config.id;
          roleButtons.forEach((button, id) => button.setAttribute("aria-selected", id === activeRole ? "true" : "false"));
          areaName.textContent = config.title;
          family.value = currentRoleFamily(activeRole);
          custom.value = currentRoleCustomFamily(activeRole);
          syncCustomField(customLabel, custom, customHint, family.value);
          range.min = String(config.sliderMin);
          range.max = String(config.sliderMax);
          range.step = String(config.step);
          number.min = String(config.min);
          number.max = String(config.max);
          number.step = String(config.step);
          unit.textContent = config.unit;
          syncRoleSizeInputs(activeRole, range, number, currentRoleSize(activeRole));
        };

        roleButtons.forEach((roleButton, role) => roleButton.addEventListener("click", () => sync(role)));
        close.addEventListener("click", () => setOpen(control, false));
        family.addEventListener("change", () => {
          ctxRef?.storage.set(roleStorageKey(activeRole, "family"), validFamily(family.value));
          syncCustomField(customLabel, custom, customHint, family.value);
          applySettings();
          if (family.value === "custom") custom.focus();
        });
        custom.addEventListener("input", () => {
          const value = custom.value.slice(0, MAX_CUSTOM_FAMILY_LENGTH);
          ctxRef?.storage.set(roleStorageKey(activeRole, "customFamily"), value);
          syncCustomField(customLabel, custom, customHint, family.value);
          applySettings();
        });
        range.addEventListener("input", () => {
          const size = normalizeRoleSize(activeRole, range.value);
          number.value = displayRoleSize(activeRole, size);
          saveRoleSize(activeRole, size);
        });
        number.addEventListener("input", () => {
          if (number.value === "") return;
          const config = roleConfig(activeRole);
          const size = normalizeRoleSize(activeRole, number.value);
          range.value = String(Math.min(config.sliderMax, Math.max(config.sliderMin, size)));
          saveRoleSize(activeRole, size);
        });
        number.addEventListener("change", () => {
          const size = normalizeRoleSize(activeRole, number.value);
          syncRoleSizeInputs(activeRole, range, number, size);
          saveRoleSize(activeRole, size);
        });
        reset.addEventListener("click", () => {
          const config = roleConfig(activeRole);
          ctxRef?.storage.set(roleStorageKey(activeRole, "family"), "default");
          ctxRef?.storage.set(roleStorageKey(activeRole, "customFamily"), "");
          ctxRef?.storage.set(roleStorageKey(activeRole, "size"), config.defaultSize);
          applySettings();
          sync(activeRole);
        });
        panel.addEventListener("cudloun-fonts-sync", () => sync(activeRole));
        sync();
        return panel;
      }

      function installToggleGestures(button, control) {
        let timer = null;
        let start = null;
        let suppressClick = false;
        const cancel = () => {
          window.clearTimeout(timer);
          timer = null;
          start = null;
        };

        button.addEventListener("click", (event) => {
          if (suppressClick) {
            suppressClick = false;
            event.preventDefault();
            return;
          }
          const panel = control.querySelector(".cudloun-post-fonts-panel--simple");
          setOpen(control, panel?.hidden !== false, "simple");
        });
        button.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          cancel();
          suppressClick = event.button !== 2;
          setOpen(control, true, "advanced");
        });
        button.addEventListener("pointerdown", (event) => {
          if (event.button !== 0 || event.pointerType === "mouse") return;
          cancel();
          start = { x: event.clientX, y: event.clientY };
          timer = window.setTimeout(() => {
            timer = null;
            suppressClick = true;
            setOpen(control, true, "advanced");
          }, LONG_PRESS_MS);
        });
        button.addEventListener("pointermove", (event) => {
          if (!start) return;
          if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > LONG_PRESS_MOVE_PX) cancel();
        });
        button.addEventListener("pointerup", cancel);
        button.addEventListener("pointercancel", cancel);
        button.addEventListener("lostpointercapture", cancel);
      }

      function setOpen(control, open, mode = "simple") {
        const panels = Array.from(control.querySelectorAll(".cudloun-post-fonts-panel"));
        const button = control.querySelector(".cudloun-post-fonts-toggle");
        if (!panels.length || !button) return;
        panels.forEach((panel) => {
          const selected = panel.classList.contains(`cudloun-post-fonts-panel--${mode}`);
          panel.hidden = !open || !selected;
          if (open && selected && mode === "advanced") panel.dispatchEvent(new Event("cudloun-fonts-sync"));
        });
        button.setAttribute("aria-expanded", open ? "true" : "false");
        control.dataset.openPanel = open ? mode : "";
        if (open) {
          const panel = control.querySelector(`.cudloun-post-fonts-panel--${mode}`);
          (mode === "advanced" ? panel?.querySelector("[role='tab'][aria-selected='true']") : panel?.querySelector("select"))?.focus();
        }
      }

      function saveSize(value) {
        const size = normalizeSize(value);
        ctxRef?.storage.set("size", size);
        applySettings();
      }

      function roleConfig(role) {
        return FONT_ROLES.find((config) => config.id === role) || FONT_ROLES[0];
      }

      function roleStorageKey(role, field) {
        if (role === "posts") {
          if (field === "family") return "family";
          if (field === "customFamily") return "customFamily";
          if (field === "size") return "size";
        }
        return `${role}${field[0].toUpperCase()}${field.slice(1)}`;
      }

      function currentRoleFamily(role) {
        return validFamily(ctxRef?.storage.get(roleStorageKey(role, "family"), "default"));
      }

      function currentRoleCustomFamily(role) {
        return String(ctxRef?.storage.get(roleStorageKey(role, "customFamily"), "") || "").slice(0, MAX_CUSTOM_FAMILY_LENGTH);
      }

      function currentRoleSize(role) {
        const config = roleConfig(role);
        return normalizeRoleSize(role, ctxRef?.storage.get(roleStorageKey(role, "size"), config.defaultSize));
      }

      function saveRoleSize(role, value) {
        ctxRef?.storage.set(roleStorageKey(role, "size"), normalizeRoleSize(role, value));
        applySettings();
      }

      function applySettings() {
        const rootElement = document.documentElement;
        rootElement.setAttribute("data-cudloun-post-fonts", "true");
        FONT_ROLES.forEach((config) => applyRoleSettings(rootElement, config));
      }

      function applyRoleSettings(rootElement, config) {
        const family = currentRoleFamily(config.id);
        const stack = fontStack(family, currentRoleCustomFamily(config.id));
        const cssId = config.id === "posts" ? "post" : config.id;
        const familyAttribute = `data-cudloun-${cssId}-font-family`;
        const sizeAttribute = `data-cudloun-${cssId}-font-size`;
        const familyProperty = `--cudloun-${cssId}-font-family`;
        const sizeProperty = `--cudloun-${cssId}-font-size`;
        const size = currentRoleSize(config.id);

        rootElement.setAttribute(familyAttribute, stack ? family : "default");
        if (stack) rootElement.style.setProperty(familyProperty, stack);
        else rootElement.style.removeProperty(familyProperty);

        const applySize = config.id === "posts" || size !== config.defaultSize;
        if (applySize) {
          rootElement.setAttribute(sizeAttribute, "true");
          rootElement.style.setProperty(sizeProperty, `${displayRoleSize(config.id, size)}${config.unit}`);
        } else {
          rootElement.removeAttribute(sizeAttribute);
          rootElement.style.removeProperty(sizeProperty);
        }
      }

      function clearSettings() {
        const rootElement = document.documentElement;
        rootElement.removeAttribute("data-cudloun-post-fonts");
        FONT_ROLES.forEach((config) => {
          const cssId = config.id === "posts" ? "post" : config.id;
          rootElement.removeAttribute(`data-cudloun-${cssId}-font-family`);
          rootElement.removeAttribute(`data-cudloun-${cssId}-font-size`);
          rootElement.style.removeProperty(`--cudloun-${cssId}-font-family`);
          rootElement.style.removeProperty(`--cudloun-${cssId}-font-size`);
        });
      }

      function currentSize() {
        return normalizeSize(ctxRef?.storage.get("size", DEFAULT_SIZE));
      }

      function normalizeSize(value) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return DEFAULT_SIZE;
        const clamped = Math.min(MAX_SIZE, Math.max(MIN_SIZE, parsed));
        return Math.round(clamped * 2) / 2;
      }

      function normalizeRoleSize(role, value) {
        if (role === "posts") return normalizeSize(value);
        const config = roleConfig(role);
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return config.defaultSize;
        const clamped = Math.min(config.max, Math.max(config.min, parsed));
        return Math.round(clamped / config.step) * config.step;
      }

      function displaySize(value) {
        const size = normalizeSize(value);
        return Number.isInteger(size) ? String(size) : size.toFixed(1);
      }

      function displayRoleSize(role, value) {
        return role === "posts" ? displaySize(value) : String(normalizeRoleSize(role, value));
      }

      function validFamily(value) {
        const candidate = String(value || "default");
        return FAMILIES.some((font) => font.value === candidate) ? candidate : "default";
      }

      function fontStack(value, customFamily = "") {
        const family = validFamily(value);
        if (family === "custom") return normalizeCustomFamily(customFamily);
        return FAMILIES.find((font) => font.value === family)?.stack || "";
      }

      function normalizeCustomFamily(value) {
        const source = String(value || "").trim();
        if (!source || source.length > MAX_CUSTOM_FAMILY_LENGTH) return "";
        if (/[;{}()\\/:]/.test(source) || /[\u0000-\u001f\u007f]/.test(source)) return "";

        const tokens = [];
        let token = "";
        let quote = "";
        for (const character of source) {
          if ((character === "\"" || character === "'") && !quote) quote = character;
          else if (character === quote) quote = "";
          if (character === "," && !quote) {
            tokens.push(token.trim());
            token = "";
          } else {
            token += character;
          }
        }
        if (quote) return "";
        tokens.push(token.trim());
        if (tokens.some((item) => !item)) return "";

        const safeName = /^[\p{L}\p{N} ._-]+$/u;
        const normalized = [];
        for (const item of tokens) {
          const opening = item[0];
          const quoted = opening === "\"" || opening === "'";
          if (quoted) {
            if (item.length < 3 || item[item.length - 1] !== opening) return "";
            const name = item.slice(1, -1).trim().replace(/\s+/g, " ");
            if (!name || !safeName.test(name)) return "";
            normalized.push(`${opening}${name}${opening}`);
          } else {
            const name = item.replace(/\s+/g, " ");
            if (!safeName.test(name)) return "";
            normalized.push(name);
          }
        }
        return normalized.join(", ");
      }

      function syncCustomField(field, input, hint, family) {
        field.hidden = family !== "custom";
        const value = input.value.trim();
        const normalized = normalizeCustomFamily(value);
        const invalid = Boolean(value && !normalized);
        input.setAttribute("aria-invalid", invalid ? "true" : "false");
        hint.textContent = invalid
          ? "Use comma-separated font names only"
          : "Comma-separated local font names";
      }

      function syncSizeInputs(range, number, value) {
        const size = normalizeSize(value);
        range.value = String(Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, size)));
        number.value = displaySize(size);
      }

      function syncRoleSizeInputs(role, range, number, value) {
        const config = roleConfig(role);
        const size = normalizeRoleSize(role, value);
        range.value = String(Math.min(config.sliderMax, Math.max(config.sliderMin, size)));
        number.value = displayRoleSize(role, size);
      }

      function installStyles() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
          html[data-cudloun-post-fonts="true"] article.post .body,
          html[data-cudloun-post-fonts="true"] article.post .body .markdown {
            font-size: var(--cudloun-post-font-size, 17px) !important;
          }
          html[data-cudloun-post-fonts="true"]:not([data-cudloun-post-font-family="default"]) article.post .body,
          html[data-cudloun-post-fonts="true"]:not([data-cudloun-post-font-family="default"]) article.post .body .markdown {
            font-family: var(--cudloun-post-font-family) !important;
          }
          html[data-cudloun-interface-font-family]:not([data-cudloun-interface-font-family="default"]) :where(header:not(.post-header),nav,section.new-post-composer,section.reply-composer),
          html[data-cudloun-interface-font-family]:not([data-cudloun-interface-font-family="default"]) :where(header:not(.post-header),nav,section.new-post-composer,section.reply-composer) :where(button,input,select,textarea):not(.cudloun-post-fonts-control *){font-family:var(--cudloun-interface-font-family)!important}
          html[data-cudloun-interface-font-size="true"] :where(header:not(.post-header),nav,section.new-post-composer,section.reply-composer){font-size:var(--cudloun-interface-font-size)!important}
          html[data-cudloun-interface-font-size="true"] :where(header:not(.post-header),nav,section.new-post-composer,section.reply-composer) :where(button,input,select,textarea):not(.cudloun-post-fonts-control *){font-size:var(--cudloun-interface-font-size)!important}
          html[data-cudloun-headings-font-family]:not([data-cudloun-headings-font-family="default"]) :where(h1,h2,h3,h4,h5,h6,.title-link,article.post .author){font-family:var(--cudloun-headings-font-family)!important}
          html[data-cudloun-headings-font-size="true"] :where(h1,h2,h3,h4,h5,h6,.title-link,article.post .author){font-size:var(--cudloun-headings-font-size)!important}
          html[data-cudloun-code-font-family]:not([data-cudloun-code-font-family="default"]) :where(pre,code,kbd,samp){font-family:var(--cudloun-code-font-family)!important}
          html[data-cudloun-code-font-size="true"] :where(pre,:not(pre)>code,kbd,samp){font-size:var(--cudloun-code-font-size)!important}
          html[data-cudloun-logo-font-family]:not([data-cudloun-logo-font-family="default"]) :where(a[aria-label="Okoun home"],.logo) :where(.text,.orange-o){font-family:var(--cudloun-logo-font-family)!important}
          html[data-cudloun-logo-font-size="true"] :where(a[aria-label="Okoun home"],.logo){zoom:var(--cudloun-logo-font-size)}
          .${CONTROL_CLASS}{position:absolute;top:8px;right:60px;z-index:4;font:14px/1.3 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#243041}
          .${CONTROL_CLASS}[data-placement="board-header"],.${CONTROL_CLASS}[data-placement="global-actions"]{position:relative;top:auto;right:auto;bottom:auto;z-index:4;flex:0 0 auto}
          .${CONTROL_CLASS}[data-placement="global-actions"]{order:-1}
          .${CONTROL_CLASS}[data-placement="board-header"] .cudloun-post-fonts-toggle,.${CONTROL_CLASS}[data-placement="global-actions"] .cudloun-post-fonts-toggle{width:36px;height:36px;border:0;border-radius:50%;box-shadow:none;background:transparent}
          .${CONTROL_CLASS}[data-placement="board-header"] .cudloun-post-fonts-panel{top:44px;right:0}
          .${CONTROL_CLASS}[data-placement="global-actions"] .cudloun-post-fonts-panel{top:45px;right:0}
          .cudloun-post-fonts-toggle{appearance:none;width:38px;height:38px;display:grid;place-items:center;margin:0;border:1px solid rgba(79,102,134,.3);border-radius:8px;background:#fff;color:#8a5300;box-shadow:0 2px 7px rgba(18,27,43,.14);cursor:pointer;font:italic 800 20px/1 Georgia,serif;-webkit-touch-callout:none;user-select:none}
          .cudloun-post-fonts-toggle:hover,.cudloun-post-fonts-toggle[aria-expanded="true"]{border-color:#b06a00;background:#fff8eb;color:#7a4700}
          .cudloun-post-fonts-toggle:focus-visible{outline:2px solid #b06a00;outline-offset:2px}
          .cudloun-post-fonts-panel{box-sizing:border-box;position:absolute;top:46px;right:0;width:286px;padding:12px;border:1px solid rgba(79,102,134,.3);border-radius:10px;background:#fff;color:#243041;box-shadow:0 12px 32px rgba(18,27,43,.24)}
          .cudloun-post-fonts-panel--advanced{width:330px}
          .cudloun-post-fonts-panel[hidden]{display:none!important}
          .cudloun-post-fonts-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 10px}
          .cudloun-post-fonts-head strong{font-size:14px}
          .cudloun-post-fonts-advanced-title{display:grid;gap:2px}
          .cudloun-post-fonts-advanced-title small,.cudloun-post-fonts-advanced-hint{color:#697586;font-size:11px;font-weight:500}
          .cudloun-post-fonts-advanced-hint{display:block;margin-top:7px;text-align:right}
          .cudloun-post-fonts-close{appearance:none;width:28px;height:28px;border:0;border-radius:6px;background:transparent;color:#697586;cursor:pointer;font:700 20px/1 inherit}
          .cudloun-post-fonts-close:hover{background:#eef2f7;color:#243041}
          .cudloun-post-fonts-field{display:grid;grid-template-columns:52px minmax(0,1fr);align-items:center;gap:9px;margin:8px 0;font-weight:650}
          .cudloun-post-fonts-field select,.cudloun-post-fonts-field input[type="number"],.cudloun-post-fonts-field input[type="text"]{box-sizing:border-box;min-height:36px;border:1px solid rgba(79,102,134,.32);border-radius:7px;background:#fff;color:#182230;padding:0 8px;font:inherit}
          .cudloun-post-fonts-field select{width:100%}
          .cudloun-post-fonts-custom[hidden]{display:none!important}
          .cudloun-post-fonts-custom{align-items:start}
          .cudloun-post-fonts-custom>span:first-child{padding-top:9px}
          .cudloun-post-fonts-custom-wrap{display:grid;gap:4px;min-width:0}
          .cudloun-post-fonts-custom-wrap input{width:100%}
          .cudloun-post-fonts-custom-wrap input[aria-invalid="true"]{border-color:#b42318;outline-color:#b42318}
          .cudloun-post-fonts-custom-wrap small{color:#697586;font-size:11px;font-weight:500}
          .cudloun-post-fonts-size{display:grid;grid-template-columns:minmax(0,1fr) 62px auto;align-items:center;gap:7px}
          .cudloun-post-fonts-size input[type="range"]{width:100%;accent-color:#b06a00}
          .cudloun-post-fonts-size input[type="number"]{width:62px;text-align:right}
          .cudloun-post-fonts-size>span{color:#697586;font-size:12px}
          .cudloun-post-fonts-roles{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;margin:2px 0 10px}
          .cudloun-post-fonts-roles button{appearance:none;min-width:0;border:1px solid rgba(79,102,134,.25);border-radius:999px;background:#f8fafc;color:#4a5667;cursor:pointer;font:700 11px/1.2 inherit;padding:7px 3px}
          .cudloun-post-fonts-roles button[aria-selected="true"]{border-color:#b06a00;background:#fff3dc;color:#7a4700}
          .cudloun-post-fonts-area-name{display:block;margin:0 0 4px;color:#697586;font-size:11px}
          .cudloun-post-fonts-actions{display:flex;justify-content:flex-end;margin-top:10px;padding-top:10px;border-top:1px solid rgba(79,102,134,.16)}
          .cudloun-post-fonts-actions button{appearance:none;border:1px solid rgba(79,102,134,.26);border-radius:7px;background:#f8fafc;color:#364152;cursor:pointer;font:700 12px/1.2 inherit;padding:7px 10px}
          .cudloun-post-fonts-actions button:hover{background:#eef2f7}
          .cudloun-post-fonts-advanced-actions{align-items:center;justify-content:space-between}
          .cudloun-post-fonts-advanced-actions a{color:#8a5300;font-size:11px;font-weight:700;text-decoration:none}
          .cudloun-post-fonts-advanced-actions a:hover{text-decoration:underline}
          html[data-cudloun-kapybara-theme="dark"] .cudloun-post-fonts-toggle,
          html[data-cudloun-kapybara-theme="dark"] .cudloun-post-fonts-panel,
          html[data-cudloun-kapybara-theme="dark"] .cudloun-post-fonts-field select,
          html[data-cudloun-kapybara-theme="dark"] .cudloun-post-fonts-field input[type="number"],
          html[data-cudloun-kapybara-theme="dark"] .cudloun-post-fonts-field input[type="text"],
          html[data-cudloun-kapybara-theme="dark"] .cudloun-post-fonts-actions button,
          html[data-cudloun-kapybara-theme="dark"] .cudloun-post-fonts-roles button{background:var(--cudloun-kapybara-surface,#141414);color:var(--cudloun-kapybara-text,#f4f4f4);border-color:var(--cudloun-kapybara-line,#303030)}
          html[data-cudloun-kapybara-theme="dark"] .cudloun-post-fonts-roles button[aria-selected="true"]{background:var(--cudloun-kapybara-accent-soft,#3a2b16);color:var(--cudloun-kapybara-accent,#d68a1f);border-color:var(--cudloun-kapybara-accent,#d68a1f)}
          html[data-cudloun-kapybara-theme="dark"] .cudloun-post-fonts-advanced-actions a{color:var(--cudloun-kapybara-accent,#d68a1f)}
          html[data-cudloun-kapybara-theme="dark"] .${CONTROL_CLASS}[data-placement="board-header"] .cudloun-post-fonts-toggle,
          html[data-cudloun-kapybara-theme="dark"] .${CONTROL_CLASS}[data-placement="global-actions"] .cudloun-post-fonts-toggle{background:transparent;border-color:transparent}
          @media(max-width:700px){
            .${CONTROL_CLASS}[data-placement="floating"]{position:fixed;top:auto;right:14px;bottom:62px;z-index:2020}
            .${CONTROL_CLASS}[data-placement="floating"] .cudloun-post-fonts-toggle{width:46px;height:46px;border-radius:50%;background:#b06a00;color:#fff;box-shadow:0 6px 20px rgba(18,27,43,.3);font-size:23px}
            .${CONTROL_CLASS}[data-placement="floating"] .cudloun-post-fonts-toggle:hover,
            .${CONTROL_CLASS}[data-placement="floating"] .cudloun-post-fonts-toggle[aria-expanded="true"]{background:#8f5600;color:#fff}
            .${CONTROL_CLASS}[data-placement="floating"] .cudloun-post-fonts-panel{top:auto;right:0;bottom:54px}
            .cudloun-post-fonts-panel{width:min(286px,calc(100vw - 20px));max-height:calc(100dvh - 72px);overflow:auto}
            .cudloun-post-fonts-panel--advanced{width:min(330px,calc(100vw - 20px))}
          }
        `;
        document.head.appendChild(style);
      }
    })();

  });

  embeddedText.set("modules/opuc/popup-bridge.js", "// Firefox first-party OPU upload bridge.\n(function () {\n  \"use strict\";\n\n  const OPU_ORIGIN = \"https://opu.peklo.biz\";\n  const KAPYBARA_ORIGIN = \"https://kapybara.okoun.cz\";\n  const MESSAGE_TYPE = \"cudloun-opu-bridge-v1\";\n  const WINDOW_PREFIX = \"cudloun_opu_\";\n\n  if (window.location.hostname === \"opu.peklo.biz\") {\n    if (document.readyState === \"loading\") {\n      window.addEventListener(\"DOMContentLoaded\", startPopupHost, { once: true });\n    } else {\n      startPopupHost();\n    }\n    return;\n  }\n\n  const root = window.Cudloun;\n  if (!root) return;\n  const runtime = root.opuc = root.opuc || {};\n  const pending = new Map();\n  const preparedFiles = new WeakMap();\n  let listening = false;\n\n  runtime.popupBridge = {\n    managerName,\n    shouldUse,\n    shouldKeepInputAttached,\n    unsupportedReason,\n    prepare,\n    upload,\n  };\n\n  function shouldUse() {\n    return isFirefox() && /tampermonkey/i.test(managerName());\n  }\n\n  function shouldKeepInputAttached() {\n    return isFirefox() && /greasemonkey/i.test(managerName());\n  }\n\n  function unsupportedReason() {\n    if (!isFirefox() || shouldUse() || shouldKeepInputAttached()) return \"\";\n    const manager = managerName();\n    const managerHint = manager ? ` ${manager} is not supported for this upload path.` : \" The active userscript manager could not be identified.\";\n    return `Firefox OPU uploads require Tampermonkey.${managerHint} Disable Cudloun in Greasemonkey and install it in Tampermonkey.`;\n  }\n\n  function isFirefox() {\n    return /\\bFirefox\\/\\d/i.test(String(window.navigator?.userAgent || \"\"));\n  }\n\n  function managerName() {\n    try {\n      if (typeof GM_info !== \"undefined\" && GM_info?.scriptHandler) return String(GM_info.scriptHandler);\n    } catch (_error) {}\n    try {\n      if (typeof GM !== \"undefined\" && GM?.info?.scriptHandler) return String(GM.info.scriptHandler);\n    } catch (_error) {}\n    return \"\";\n  }\n\n  function upload(file, options = {}) {\n    let item = null;\n    let cancelled = false;\n\n    const promise = new Promise((resolve, reject) => {\n      const id = requestId();\n      const popupName = `${WINDOW_PREFIX}${id}`;\n      const url = `${OPU_ORIGIN}/?cudloun_bridge=${encodeURIComponent(id)}`;\n      const popup = window.open(url, popupName, \"popup=yes,width=560,height=680,resizable=yes,scrollbars=yes\");\n      if (!popup) {\n        reject(new Error(\"Firefox blocked the OPU upload window. Allow pop-ups for kapybara.okoun.cz and retry.\"));\n        return;\n      }\n\n      const bytesPromise = prepare(file);\n      bytesPromise.catch(() => {});\n      item = {\n        id,\n        file,\n        bytesPromise,\n        sending: false,\n        popup,\n        resolve,\n        reject,\n        onProgress: options.onProgress,\n        timeout: window.setTimeout(() => settle(id, new Error(\"The OPU upload window timed out.\")), 130000),\n        closedPoll: window.setInterval(() => {\n          if (popup.closed) settle(id, new Error(\"The OPU upload window was closed before returning an image URL.\"));\n        }, 400),\n      };\n      pending.set(id, item);\n      ensureListener();\n    });\n\n    return {\n      promise,\n      abort() {\n        if (cancelled) return;\n        cancelled = true;\n        if (!item) return;\n        try {\n          item.popup.postMessage({ type: MESSAGE_TYPE, action: \"cancel\", id: item.id }, OPU_ORIGIN);\n        } catch (_error) {}\n        settle(item.id, abortError());\n      },\n    };\n  }\n\n  function ensureListener() {\n    if (listening) return;\n    listening = true;\n    window.addEventListener(\"message\", onMessage);\n  }\n\n  function onMessage(event) {\n    if (event.origin !== OPU_ORIGIN || event.data?.type !== MESSAGE_TYPE) return;\n    const id = String(event.data.id || \"\");\n    const item = pending.get(id);\n    if (!item || event.source !== item.popup) return;\n\n    if (event.data.action === \"ready\") {\n      sendFileBytes(item);\n      return;\n    }\n    if (event.data.action === \"progress\") {\n      if (typeof item.onProgress === \"function\") {\n        item.onProgress({\n          lengthComputable: !!event.data.lengthComputable,\n          loaded: Number(event.data.loaded) || 0,\n          total: Number(event.data.total) || 0,\n        });\n      }\n      return;\n    }\n    if (event.data.action !== \"result\") return;\n\n    const url = validateOpuUrl(event.data.url);\n    if (url) {\n      settle(id, null, url);\n      return;\n    }\n    settle(id, new Error(String(event.data.error || \"OPU did not return an image URL.\")));\n  }\n\n  async function sendFileBytes(item) {\n    if (item.sending) return;\n    item.sending = true;\n    try {\n      const bytes = await item.bytesPromise;\n      if (!pending.has(item.id)) return;\n      const outgoing = bytes.slice(0);\n      item.popup.postMessage({\n        type: MESSAGE_TYPE,\n        action: \"upload\",\n        id: item.id,\n        bytes: outgoing,\n        name: String(item.file.name || \"image\"),\n        mime: String(item.file.type || \"application/octet-stream\"),\n      }, OPU_ORIGIN, [outgoing]);\n    } catch (error) {\n      settle(item.id, error instanceof Error\n        ? error\n        : new Error(\"Firefox could not read the selected image for the OPU handoff.\"));\n    }\n  }\n\n  function prepare(file) {\n    if (!file || (typeof file !== \"object\" && typeof file !== \"function\")) {\n      return Promise.reject(new Error(\"Firefox did not expose the selected image file.\"));\n    }\n    const cached = preparedFiles.get(file);\n    if (cached) return cached;\n\n    const promise = readFileBytes(file)\n      .then((bytes) => {\n        if (!isArrayBuffer(bytes) || !bytes.byteLength) {\n          throw new Error(\"Firefox returned an empty image during the OPU handoff.\");\n        }\n        return bytes;\n      })\n      .catch((error) => {\n        preparedFiles.delete(file);\n        throw error;\n      });\n    preparedFiles.set(file, promise);\n    return promise;\n  }\n\n  async function readFileBytes(file) {\n    const failures = [];\n    if (typeof file.arrayBuffer === \"function\") {\n      try {\n        return await file.arrayBuffer();\n      } catch (error) {\n        failures.push([\"arrayBuffer\", error]);\n      }\n    }\n\n    try {\n      return await readWithFileReader(file, \"array-buffer\");\n    } catch (error) {\n      failures.push([\"FileReader\", error]);\n    }\n\n    let objectUrl = \"\";\n    try {\n      objectUrl = URL.createObjectURL(file);\n      const response = await fetch(objectUrl);\n      if (!response.ok) throw new Error(`HTTP ${response.status}`);\n      return await response.arrayBuffer();\n    } catch (error) {\n      failures.push([\"object URL\", error]);\n    } finally {\n      if (objectUrl) URL.revokeObjectURL(objectUrl);\n    }\n\n    try {\n      const dataUrl = await readWithFileReader(file, \"data-url\");\n      return dataUrlBytes(dataUrl);\n    } catch (error) {\n      failures.push([\"data URL\", error]);\n    }\n\n    const detail = failures.map(([method, error]) => `${method}: ${safeErrorName(error)}`).join(\"; \");\n    throw new Error(`Firefox could not read the selected image for the OPU handoff${detail ? ` (${detail})` : \"\"}.`);\n  }\n\n  function readWithFileReader(file, mode) {\n    return new Promise((resolve, reject) => {\n      const reader = new FileReader();\n      reader.addEventListener(\"load\", () => resolve(reader.result));\n      reader.addEventListener(\"error\", () => reject(reader.error || new Error(\"FileReader failed.\")));\n      reader.addEventListener(\"abort\", () => reject(new Error(\"FileReader aborted.\")));\n      if (mode === \"data-url\") reader.readAsDataURL(file);\n      else reader.readAsArrayBuffer(file);\n    });\n  }\n\n  function dataUrlBytes(value) {\n    const source = String(value || \"\");\n    const comma = source.indexOf(\",\");\n    if (comma < 0 || !/;base64$/i.test(source.slice(0, comma))) {\n      throw new Error(\"FileReader returned an invalid data URL.\");\n    }\n    const binary = atob(source.slice(comma + 1));\n    const bytes = new Uint8Array(binary.length);\n    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);\n    return bytes.buffer;\n  }\n\n  function isArrayBuffer(value) {\n    return value instanceof ArrayBuffer || Object.prototype.toString.call(value) === \"[object ArrayBuffer]\";\n  }\n\n  function safeErrorName(error) {\n    const name = String(error?.name || \"\").replace(/[^A-Za-z0-9_-]/g, \"\").slice(0, 40);\n    return name || \"Error\";\n  }\n\n  function settle(id, error, value) {\n    const item = pending.get(id);\n    if (!item) return;\n    pending.delete(id);\n    window.clearTimeout(item.timeout);\n    window.clearInterval(item.closedPoll);\n    try { item.popup.close(); } catch (_error) {}\n    if (!pending.size && listening) {\n      listening = false;\n      window.removeEventListener(\"message\", onMessage);\n    }\n    if (error) item.reject(error);\n    else item.resolve(value);\n  }\n\n  function startPopupHost() {\n    if (!window.opener || !window.name.startsWith(WINDOW_PREFIX)) return;\n    const windowId = window.name.slice(WINDOW_PREFIX.length);\n    if (!validRequestId(windowId)) return;\n    const queryId = new URLSearchParams(window.location.search).get(\"cudloun_bridge\") || \"\";\n\n    // The query identifies the initial handoff page. OPU removes it while\n    // redirecting to ?page=done, but window.name survives that navigation.\n    if (!queryId) {\n      completeNativeFormResult(windowId);\n      return;\n    }\n    if (queryId !== windowId) return;\n\n    let submitted = false;\n    const id = windowId;\n    const sendReady = () => window.opener?.postMessage({ type: MESSAGE_TYPE, action: \"ready\", id }, KAPYBARA_ORIGIN);\n    const readyTimer = window.setInterval(sendReady, 350);\n\n    window.addEventListener(\"message\", (event) => {\n      if (event.origin !== KAPYBARA_ORIGIN || event.source !== window.opener) return;\n      if (event.data?.type !== MESSAGE_TYPE || event.data.id !== id) return;\n      if (event.data.action === \"cancel\") {\n        window.clearInterval(readyTimer);\n        window.close();\n        return;\n      }\n      if (event.data.action !== \"upload\" || submitted) return;\n      window.clearInterval(readyTimer);\n      const bytes = event.data.bytes;\n      const mime = String(event.data.mime || \"\");\n      if (!(bytes instanceof ArrayBuffer) || !bytes.byteLength || !mime.startsWith(\"image/\")) {\n        sendResult(id, \"\", \"The OPU upload window did not receive a valid image file.\");\n        return;\n      }\n      const name = safeFileName(event.data.name);\n      const file = new File([bytes], name, { type: mime });\n      submitted = true;\n      submitNativeOpuForm(id, file);\n    });\n\n    sendReady();\n  }\n\n  function submitNativeOpuForm(id, file) {\n    try {\n      const form = document.querySelector('form#xpc[action*=\"opupload.php\"]');\n      const fileInput = form?.querySelector('input[type=\"file\"][name=\"obrazek[0]\"]');\n      if (!form || !fileInput) {\n        sendResult(id, \"\", \"OPU's native upload form was not found.\");\n        return;\n      }\n\n      const transfer = new DataTransfer();\n      transfer.items.add(file);\n      fileInput.files = transfer.files;\n      setFormValue(form, \"sizep\", \"0\");\n      setFormValue(form, \"outputf\", \"auto\");\n      form.target = \"_self\";\n      const submit = form.querySelector('[type=\"submit\"][name=\"tl_odeslat\"]');\n      if (submit && typeof form.requestSubmit === \"function\") {\n        form.requestSubmit(submit);\n      } else {\n        form.appendChild(hiddenInput(\"tl_odeslat\", \"Odeslat\"));\n        form.submit();\n      }\n    } catch (_error) {\n      sendResult(id, \"\", \"Firefox could not place the selected image into OPU's native upload form.\");\n    }\n  }\n\n  function setFormValue(form, name, value) {\n    const field = form.querySelector(`[name=\"${name}\"][value=\"${value}\"]`);\n    if (field && \"checked\" in field) field.checked = true;\n    else if (field) field.value = value;\n  }\n\n  function hiddenInput(name, value) {\n    const input = document.createElement(\"input\");\n    input.type = \"hidden\";\n    input.name = name;\n    input.value = value;\n    return input;\n  }\n\n  function completeNativeFormResult(id) {\n    const url = extractDocumentUrl(document);\n    const route = `${window.location.pathname}${window.location.search}`.slice(0, 160);\n    sendResult(id, url, url ? \"\" : `OPU returned ${route || \"/\"} without an image URL.`);\n  }\n\n  function sendResult(id, url, error) {\n    window.opener?.postMessage({ type: MESSAGE_TYPE, action: \"result\", id, url, error }, KAPYBARA_ORIGIN);\n    window.setTimeout(() => window.close(), 80);\n  }\n\n  function extractDocumentUrl(doc) {\n    const candidates = [];\n    doc.querySelectorAll('input[value*=\"opu.peklo.biz/p/\"]')\n      .forEach((input) => candidates.push(input.value));\n    doc.querySelectorAll('a[href*=\"opu.peklo.biz/p/\"], img[src*=\"opu.peklo.biz/p/\"]')\n      .forEach((element) => candidates.push(element.getAttribute(\"href\") || element.getAttribute(\"src\")));\n    for (const value of candidates) {\n      const match = String(value || \"\").match(/(?:href|src)=[\"']([^\"']+)[\"']/i);\n      const url = validateOpuUrl(match?.[1] || value);\n      if (url) return url;\n    }\n    return \"\";\n  }\n\n  function validateOpuUrl(value) {\n    try {\n      const url = new URL(String(value || \"\").trim().replace(/&amp;/gi, \"&\"));\n      if (url.protocol !== \"https:\" || url.hostname !== \"opu.peklo.biz\" || !url.pathname.startsWith(\"/p/\")) return \"\";\n      return url.toString();\n    } catch (_error) {\n      return \"\";\n    }\n  }\n\n  function requestId() {\n    const random = typeof crypto?.randomUUID === \"function\"\n      ? crypto.randomUUID()\n      : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;\n    return random.replace(/[^a-z0-9_-]/gi, \"\").slice(0, 80);\n  }\n\n  function validRequestId(value) {\n    return /^[a-z0-9_-]{12,80}$/i.test(String(value || \"\"));\n  }\n\n  function safeFileName(value) {\n    const name = String(value || \"image\")\n      .replace(/[\\\\/\\x00-\\x1f\\x7f]+/g, \"_\")\n      .trim()\n      .slice(0, 180);\n    return name || \"image\";\n  }\n\n  function abortError() {\n    const error = new Error(\"OPU upload cancelled.\");\n    error.name = \"AbortError\";\n    return error;\n  }\n})();\n");
  embeddedScripts.set("modules/opuc/popup-bridge.js", function () {
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
      const preparedFiles = new WeakMap();
      let listening = false;

      runtime.popupBridge = {
        managerName,
        shouldUse,
        shouldKeepInputAttached,
        unsupportedReason,
        prepare,
        upload,
      };

      function shouldUse() {
        return isFirefox() && /tampermonkey/i.test(managerName());
      }

      function shouldKeepInputAttached() {
        return isFirefox() && /greasemonkey/i.test(managerName());
      }

      function unsupportedReason() {
        if (!isFirefox() || shouldUse() || shouldKeepInputAttached()) return "";
        const manager = managerName();
        const managerHint = manager ? ` ${manager} is not supported for this upload path.` : " The active userscript manager could not be identified.";
        return `Firefox OPU uploads require Tampermonkey.${managerHint} Disable Cudloun in Greasemonkey and install it in Tampermonkey.`;
      }

      function isFirefox() {
        return /\bFirefox\/\d/i.test(String(window.navigator?.userAgent || ""));
      }

      function managerName() {
        try {
          if (typeof GM_info !== "undefined" && GM_info?.scriptHandler) return String(GM_info.scriptHandler);
        } catch (_error) {}
        try {
          if (typeof GM !== "undefined" && GM?.info?.scriptHandler) return String(GM.info.scriptHandler);
        } catch (_error) {}
        return "";
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

          const bytesPromise = prepare(file);
          bytesPromise.catch(() => {});
          item = {
            id,
            file,
            bytesPromise,
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
          const bytes = await item.bytesPromise;
          if (!pending.has(item.id)) return;
          const outgoing = bytes.slice(0);
          item.popup.postMessage({
            type: MESSAGE_TYPE,
            action: "upload",
            id: item.id,
            bytes: outgoing,
            name: String(item.file.name || "image"),
            mime: String(item.file.type || "application/octet-stream"),
          }, OPU_ORIGIN, [outgoing]);
        } catch (error) {
          settle(item.id, error instanceof Error
            ? error
            : new Error("Firefox could not read the selected image for the OPU handoff."));
        }
      }

      function prepare(file) {
        if (!file || (typeof file !== "object" && typeof file !== "function")) {
          return Promise.reject(new Error("Firefox did not expose the selected image file."));
        }
        const cached = preparedFiles.get(file);
        if (cached) return cached;

        const promise = readFileBytes(file)
          .then((bytes) => {
            if (!isArrayBuffer(bytes) || !bytes.byteLength) {
              throw new Error("Firefox returned an empty image during the OPU handoff.");
            }
            return bytes;
          })
          .catch((error) => {
            preparedFiles.delete(file);
            throw error;
          });
        preparedFiles.set(file, promise);
        return promise;
      }

      async function readFileBytes(file) {
        const failures = [];
        if (typeof file.arrayBuffer === "function") {
          try {
            return await file.arrayBuffer();
          } catch (error) {
            failures.push(["arrayBuffer", error]);
          }
        }

        try {
          return await readWithFileReader(file, "array-buffer");
        } catch (error) {
          failures.push(["FileReader", error]);
        }

        let objectUrl = "";
        try {
          objectUrl = URL.createObjectURL(file);
          const response = await fetch(objectUrl);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return await response.arrayBuffer();
        } catch (error) {
          failures.push(["object URL", error]);
        } finally {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
        }

        try {
          const dataUrl = await readWithFileReader(file, "data-url");
          return dataUrlBytes(dataUrl);
        } catch (error) {
          failures.push(["data URL", error]);
        }

        const detail = failures.map(([method, error]) => `${method}: ${safeErrorName(error)}`).join("; ");
        throw new Error(`Firefox could not read the selected image for the OPU handoff${detail ? ` (${detail})` : ""}.`);
      }

      function readWithFileReader(file, mode) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.addEventListener("load", () => resolve(reader.result));
          reader.addEventListener("error", () => reject(reader.error || new Error("FileReader failed.")));
          reader.addEventListener("abort", () => reject(new Error("FileReader aborted.")));
          if (mode === "data-url") reader.readAsDataURL(file);
          else reader.readAsArrayBuffer(file);
        });
      }

      function dataUrlBytes(value) {
        const source = String(value || "");
        const comma = source.indexOf(",");
        if (comma < 0 || !/;base64$/i.test(source.slice(0, comma))) {
          throw new Error("FileReader returned an invalid data URL.");
        }
        const binary = atob(source.slice(comma + 1));
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
        return bytes.buffer;
      }

      function isArrayBuffer(value) {
        return value instanceof ArrayBuffer || Object.prototype.toString.call(value) === "[object ArrayBuffer]";
      }

      function safeErrorName(error) {
        const name = String(error?.name || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40);
        return name || "Error";
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

  });

  embeddedText.set("modules/opuc/client.js", "// OPU transport and response helpers for the Cudloun OPUc module.\n(function () {\n  \"use strict\";\n\n  const root = window.Cudloun;\n  const runtime = root.opuc = root.opuc || {};\n  const GALLERY_URL = \"https://opu.peklo.biz/?page=userpanel\";\n  const UPLOAD_URL = \"https://opu.peklo.biz/opupload.php\";\n\n  runtime.client = {\n    galleryUrl: GALLERY_URL,\n    uploadUrl: UPLOAD_URL,\n    checkLoginStatus,\n    upload,\n    responseBodyText,\n    extractUploadUrl,\n    validateOpuUrl,\n    getThumbUrl,\n  };\n\n  async function checkLoginStatus() {\n    const request = gmRequest({ method: \"GET\", url: GALLERY_URL, timeout: 20000 });\n    const response = await request.promise;\n    const finalUrl = String(response.finalUrl || response.responseURL || \"\");\n    return finalUrl ? !finalUrl.includes(\"page=prihlaseni\") : false;\n  }\n\n  function upload(file, options = {}) {\n    const unsupported = runtime.popupBridge?.unsupportedReason?.();\n    if (unsupported) return rejectedRequest(unsupported);\n    if (runtime.popupBridge?.shouldUse?.()) return runtime.popupBridge.upload(file, options);\n\n    const formData = new FormData();\n    formData.append(\"obrazek[0]\", file);\n    formData.append(\"sizep\", \"0\");\n    formData.append(\"outputf\", \"auto\");\n    formData.append(\"tl_odeslat\", \"Odeslat\");\n\n    const request = gmRequest({\n      method: \"POST\",\n      url: UPLOAD_URL,\n      data: formData,\n      timeout: 120000,\n      onprogress: options.onProgress,\n    });\n\n    return {\n      abort: request.abort,\n      promise: request.promise.then(async (response) => {\n        if (response.status !== 200) throw new Error(`OPU upload failed with HTTP ${response.status}.`);\n        const body = await responseBodyText(response);\n        const url = extractUploadUrl(body) || validateOpuUrl(safeResponseValue(response, \"finalUrl\"));\n        if (!url) throw new Error(\"OPU upload response did not contain an image URL.\");\n        return url;\n      }),\n    };\n  }\n\n  function rejectedRequest(message) {\n    return {\n      promise: Promise.reject(new Error(message)),\n      abort() {},\n    };\n  }\n\n  async function responseBodyText(response) {\n    const responseText = safeResponseValue(response, \"responseText\");\n    if (typeof responseText === \"string\" && responseText) return responseText;\n\n    const body = safeResponseValue(response, \"response\");\n    if (typeof body === \"string\") return body;\n    if (!body) {\n      const xml = safeResponseValue(response, \"responseXML\");\n      return serializeDocument(xml);\n    }\n    if (typeof body.text === \"function\") {\n      try {\n        return await body.text();\n      } catch (_error) {\n        // Continue to the document/object fallbacks below.\n      }\n    }\n    const serialized = serializeDocument(body);\n    if (serialized) return serialized;\n    if (typeof body === \"object\") {\n      try {\n        return JSON.stringify(body);\n      } catch (_error) {\n        return \"\";\n      }\n    }\n    return String(body || \"\");\n  }\n\n  function extractUploadUrl(html) {\n    const source = String(html || \"\");\n    if (!source) return \"\";\n    const doc = new DOMParser().parseFromString(source, \"text/html\");\n    const candidates = [];\n\n    doc.querySelectorAll('input[id^=\"link_\"], input[name^=\"link\"], input[value*=\"opu.peklo.biz/p/\"]')\n      .forEach((input) => candidates.push(input.value));\n    doc.querySelectorAll('a[href*=\"opu.peklo.biz/p/\"], a[href^=\"/p/\"]')\n      .forEach((link) => candidates.push(link.getAttribute(\"href\")));\n    doc.querySelectorAll('img[src*=\"opu.peklo.biz/p/\"], img[src^=\"/p/\"]')\n      .forEach((image) => candidates.push(image.getAttribute(\"src\")));\n\n    for (const value of candidates) {\n      const direct = extractCandidateUrl(value);\n      if (direct) return direct;\n    }\n\n    const unescaped = source.replace(/\\\\\\//g, \"/\");\n    const rawMatches = unescaped.match(/(?:https?:)?\\/\\/opu\\.peklo\\.biz\\/p\\/[^\\s\"'<>\\\\]+|\\/p\\/[^\\s\"'<>\\\\]+/gi) || [];\n    for (const value of rawMatches) {\n      const direct = validateOpuUrl(value);\n      if (direct) return direct;\n    }\n    return \"\";\n  }\n\n  function extractCandidateUrl(value) {\n    const text = String(value || \"\");\n    const match = text.match(/(?:href|src)=[\"']([^\"']+)[\"']/i);\n    return validateOpuUrl(match?.[1] || text);\n  }\n\n  function validateOpuUrl(value) {\n    try {\n      let candidate = String(value || \"\").trim().replace(/&amp;/gi, \"&\");\n      if (candidate.startsWith(\"//\")) candidate = `https:${candidate}`;\n      if (candidate.startsWith(\"/p/\")) candidate = `https://opu.peklo.biz${candidate}`;\n      const url = new URL(candidate);\n      if (url.protocol !== \"https:\" || url.hostname !== \"opu.peklo.biz\") return \"\";\n      if (!url.pathname.startsWith(\"/p/\")) return \"\";\n      return url.toString();\n    } catch (_error) {\n      return \"\";\n    }\n  }\n\n  function getThumbUrl(imageUrl) {\n    const validated = validateOpuUrl(imageUrl);\n    if (!validated) return \"\";\n\n    const url = new URL(validated);\n    const parts = url.pathname.split(\"/\");\n    const fileName = parts.pop();\n    if (!fileName || parts.includes(\"thumbs\")) return url.toString();\n\n    const pIndex = parts.indexOf(\"p\");\n    if (pIndex < 0) return url.toString();\n    parts.push(\"thumbs\", fileName);\n    url.pathname = parts.join(\"/\");\n    return url.toString();\n  }\n\n  function gmRequest(details) {\n    let handle = null;\n    let settled = false;\n    let rejectPromise = null;\n\n    const promise = new Promise((resolve, reject) => {\n      rejectPromise = reject;\n      const requestDetails = {\n        ...details,\n        onload(response) {\n          if (settled) return;\n          settled = true;\n          resolve(response);\n        },\n        onerror() {\n          if (settled) return;\n          settled = true;\n          reject(new Error(\"OPU network request failed.\"));\n        },\n        ontimeout() {\n          if (settled) return;\n          settled = true;\n          reject(new Error(\"OPU network request timed out.\"));\n        },\n        onabort() {\n          if (settled) return;\n          settled = true;\n          reject(abortError());\n        },\n        onprogress(event) {\n          if (typeof details.onprogress === \"function\") details.onprogress(event);\n        },\n      };\n\n      try {\n        if (typeof GM_xmlhttpRequest === \"function\") {\n          handle = GM_xmlhttpRequest(requestDetails);\n          return;\n        }\n        if (typeof GM !== \"undefined\" && GM && typeof GM.xmlHttpRequest === \"function\") {\n          handle = GM.xmlHttpRequest(requestDetails);\n          return;\n        }\n        settled = true;\n        reject(new Error(\"The userscript network bridge is unavailable.\"));\n      } catch (_error) {\n        settled = true;\n        reject(new Error(\"The OPU request could not be started.\"));\n      }\n    });\n\n    return {\n      promise,\n      abort() {\n        if (settled) return;\n        if (handle && typeof handle.abort === \"function\") {\n          handle.abort();\n          return;\n        }\n        settled = true;\n        rejectPromise?.(abortError());\n      },\n    };\n  }\n\n  function abortError() {\n    const error = new Error(\"OPU upload cancelled.\");\n    error.name = \"AbortError\";\n    return error;\n  }\n\n  function safeResponseValue(response, name) {\n    try {\n      return response?.[name];\n    } catch (_error) {\n      return undefined;\n    }\n  }\n\n  function serializeDocument(value) {\n    if (!value || typeof value !== \"object\") return \"\";\n    if (value.nodeType !== 9 && !value.documentElement) return \"\";\n    try {\n      if (typeof XMLSerializer === \"function\") return new XMLSerializer().serializeToString(value);\n    } catch (_error) {\n      // Fall through to outerHTML.\n    }\n    return String(value.documentElement?.outerHTML || \"\");\n  }\n})();\n");
  embeddedScripts.set("modules/opuc/client.js", function () {
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
        if (runtime.popupBridge?.shouldUse?.()) return runtime.popupBridge.upload(file, options);

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
          promise: request.promise.then(async (response) => {
            if (response.status !== 200) throw new Error(`OPU upload failed with HTTP ${response.status}.`);
            const body = await responseBodyText(response);
            const url = extractUploadUrl(body) || validateOpuUrl(safeResponseValue(response, "finalUrl"));
            if (!url) throw new Error("OPU upload response did not contain an image URL.");
            return url;
          }),
        };
      }

      function rejectedRequest(message) {
        return {
          promise: Promise.reject(new Error(message)),
          abort() {},
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

  });

  embeddedText.set("modules/opuc/image-pipeline.js", "// Minimal image validation and preview helpers for OPUc.\n(function () {\n  \"use strict\";\n\n  const root = window.Cudloun;\n  const runtime = root.opuc = root.opuc || {};\n\n  runtime.imagePipeline = {\n    validateFile,\n    describeFile,\n    formatBytes,\n  };\n\n  function validateFile(file, maxBytes) {\n    if (!(file instanceof Blob)) throw new Error(\"Choose an image file first.\");\n    if (!String(file.type || \"\").startsWith(\"image/\")) throw new Error(\"The selected file is not an image.\");\n    if (!file.size) throw new Error(\"The selected image is empty.\");\n    if (maxBytes > 0 && file.size > maxBytes) {\n      throw new Error(`The image is larger than the ${formatBytes(maxBytes)} upload limit.`);\n    }\n    return file;\n  }\n\n  function describeFile(file) {\n    return {\n      name: String(file?.name || \"image\"),\n      type: String(file?.type || \"application/octet-stream\"),\n      size: Number(file?.size || 0),\n      sizeText: formatBytes(Number(file?.size || 0)),\n    };\n  }\n\n  function formatBytes(bytes) {\n    const value = Number(bytes) || 0;\n    if (value <= 0) return \"0 B\";\n    const units = [\"B\", \"KB\", \"MB\", \"GB\"];\n    const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);\n    const amount = value / Math.pow(1024, index);\n    return `${Number(amount.toFixed(index ? 1 : 0))} ${units[index]}`;\n  }\n})();\n");
  embeddedScripts.set("modules/opuc/image-pipeline.js", function () {
    // Minimal image validation and preview helpers for OPUc.
    (function () {
      "use strict";

      const root = window.Cudloun;
      const runtime = root.opuc = root.opuc || {};

      runtime.imagePipeline = {
        validateFile,
        describeFile,
        formatBytes,
      };

      function validateFile(file, maxBytes) {
        if (!(file instanceof Blob)) throw new Error("Choose an image file first.");
        if (!String(file.type || "").startsWith("image/")) throw new Error("The selected file is not an image.");
        if (!file.size) throw new Error("The selected image is empty.");
        if (maxBytes > 0 && file.size > maxBytes) {
          throw new Error(`The image is larger than the ${formatBytes(maxBytes)} upload limit.`);
        }
        return file;
      }

      function describeFile(file) {
        return {
          name: String(file?.name || "image"),
          type: String(file?.type || "application/octet-stream"),
          size: Number(file?.size || 0),
          sizeText: formatBytes(Number(file?.size || 0)),
        };
      }

      function formatBytes(bytes) {
        const value = Number(bytes) || 0;
        if (value <= 0) return "0 B";
        const units = ["B", "KB", "MB", "GB"];
        const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
        const amount = value / Math.pow(1024, index);
        return `${Number(amount.toFixed(index ? 1 : 0))} ${units[index]}`;
      }
    })();

  });

  embeddedText.set("modules/opuc/kapybara-adapter.js", "// Kapybara composer discovery, launcher placement, and Markdown image insertion.\n(function () {\n  \"use strict\";\n\n  const root = window.Cudloun;\n  const runtime = root.opuc = root.opuc || {};\n  const bindings = new Map();\n  let stopObserver = null;\n\n  runtime.adapter = {\n    start,\n    stop,\n    bindLauncher,\n    insertImageUrl,\n    imageMarkdown,\n  };\n\n  function start(onComposer, onRemoved) {\n    stop();\n    stopObserver = root.kapyguts.observeComposers(\n      (parts) => onComposer(parts),\n      document.body,\n      (parts) => {\n        bindings.get(parts.section)?.remove();\n        if (typeof onRemoved === \"function\") onRemoved(parts);\n      }\n    );\n    return stop;\n  }\n\n  function stop() {\n    stopObserver?.();\n    stopObserver = null;\n    Array.from(bindings.values()).forEach((binding) => binding.remove());\n    bindings.clear();\n  }\n\n  function bindLauncher(parts, onClick) {\n    if (bindings.has(parts.section)) return bindings.get(parts.section);\n\n    const row = document.createElement(\"div\");\n    row.className = \"cudloun-opuc-launcher-row\";\n    row.dataset.composerKind = parts.kind;\n\n    const button = document.createElement(\"button\");\n    button.type = \"button\";\n    button.className = \"cudloun-opuc-launcher\";\n    button.setAttribute(\"aria-label\", \"OPUc upload\");\n    button.title = \"Upload an image through OPUc\";\n    button.textContent = \"OPUc\";\n    button.addEventListener(\"click\", onClick);\n    row.appendChild(button);\n    parts.toolbarSlot.insertAdjacentElement(\"afterend\", row);\n\n    const align = () => alignBelowImageButton(parts, row);\n    window.requestAnimationFrame(align);\n    const resizeObserver = typeof ResizeObserver === \"function\" ? new ResizeObserver(align) : null;\n    resizeObserver?.observe(parts.toolbarSlot);\n    window.addEventListener(\"resize\", align);\n\n    const binding = {\n      parts,\n      row,\n      button,\n      remove() {\n        resizeObserver?.disconnect();\n        window.removeEventListener(\"resize\", align);\n        button.removeEventListener(\"click\", onClick);\n        row.remove();\n        bindings.delete(parts.section);\n      },\n    };\n    bindings.set(parts.section, binding);\n    return binding;\n  }\n\n  async function insertImageUrl(parts, imageUrl) {\n    if (!parts?.section?.isConnected) throw new Error(\"The originating Kapybara composer was closed.\");\n    const validated = runtime.client.validateOpuUrl(imageUrl);\n    if (!validated) throw new Error(\"OPU returned an invalid image URL.\");\n    const section = parts.section;\n    const wasMarkdown = isMarkdownMode(section);\n\n    if (!wasMarkdown) {\n      const toggle = findModeToggle(section);\n      if (!toggle) throw new Error(\"Kapybara's Markdown mode toggle was not found.\");\n      toggle.click();\n    }\n\n    const editor = await waitFor(\n      () => findMarkdownEditor(section),\n      5000,\n      \"Kapybara did not switch to Markdown mode.\"\n    );\n    const markdown = imageMarkdown(validated, editor.innerText);\n    if (!insertTextAtEnd(editor, markdown)) {\n      throw new Error(\"Kapybara did not accept the OPU image Markdown.\");\n    }\n    await waitFor(\n      () => String(editor.innerText || \"\").includes(`![](${validated})`),\n      3000,\n      \"Kapybara did not retain the OPU image Markdown.\"\n    );\n\n    root.log?.debug?.(\"opuc\", \"inserted image through Markdown mode\", {\n      composerKind: parts.kind || \"unknown\",\n      restoredFormattedMode: !wasMarkdown,\n    });\n\n    if (!wasMarkdown) {\n      const toggle = await waitFor(\n        () => isMarkdownMode(section) ? findModeToggle(section) : null,\n        3000,\n        \"Kapybara's formatted-text toggle was not found.\"\n      );\n      toggle.click();\n      await waitFor(\n        () => Array.from(section.querySelectorAll(\"img\")).some((image) => image.src === validated),\n        5000,\n        \"Kapybara did not render the inserted OPU image.\"\n      );\n    }\n\n    (root.kapyguts?.composerParts?.(section)?.editable || editor)?.focus();\n    return validated;\n  }\n\n  function imageMarkdown(imageUrl, existingText = \"\") {\n    const tag = `![](${imageUrl})`;\n    const text = String(existingText || \"\").replace(/\\u00a0/g, \" \");\n    if (!text.trim()) return tag;\n    const trailingNewlines = text.match(/\\n*$/)?.[0].length || 0;\n    return `${\"\\n\".repeat(Math.max(0, 2 - trailingNewlines))}${tag}`;\n  }\n\n  function findModeToggle(section) {\n    const selector = root.kapyguts?.selectors?.composerModeToggle || \"button.mode-toggle[aria-pressed]\";\n    return section.querySelector(selector);\n  }\n\n  function isMarkdownMode(section) {\n    const selector = root.kapyguts?.selectors?.composerMarkdownNode || \"code[data-language='markdown']\";\n    return !!section.querySelector(selector) || findModeToggle(section)?.getAttribute(\"aria-pressed\") === \"true\";\n  }\n\n  function findMarkdownEditor(section) {\n    if (!isMarkdownMode(section)) return null;\n    const selector = root.kapyguts?.selectors?.composerEditable ||\n      \".composer-content-editable[role='textbox'][contenteditable='true']\";\n    const editor = section.querySelector(selector);\n    return editor?.querySelector(\"code[data-language='markdown']\") ? editor : null;\n  }\n\n  function insertTextAtEnd(editor, text) {\n    try {\n      // Lexical tracks browser editing commands; mutating textContent directly\n      // would leave its internal editor state stale and be reverted on render.\n      editor.focus();\n      const range = document.createRange();\n      range.selectNodeContents(editor);\n      range.collapse(false);\n      const selection = window.getSelection();\n      selection.removeAllRanges();\n      selection.addRange(range);\n      return document.execCommand(\"insertText\", false, text);\n    } catch (_error) {\n      return false;\n    }\n  }\n\n  function alignBelowImageButton(parts, row) {\n    if (!row.isConnected || !parts.imageButton?.isConnected || !parts.toolbarSlot?.isConnected) return;\n    const slotRect = parts.toolbarSlot.getBoundingClientRect();\n    const imageRect = parts.imageButton.getBoundingClientRect();\n    const rowWidth = row.getBoundingClientRect().width;\n    const desired = Math.max(0, Math.round(imageRect.left - slotRect.left));\n    const safe = desired + 64 < rowWidth ? desired : 0;\n    row.style.setProperty(\"--cudloun-opuc-launcher-offset\", `${safe}px`);\n  }\n\n  function waitFor(probe, timeout, message) {\n    const started = Date.now();\n    return new Promise((resolve, reject) => {\n      const check = () => {\n        try {\n          const result = probe();\n          if (result) {\n            resolve(result);\n            return;\n          }\n        } catch (_error) {\n          // Retry until timeout so transient rerenders do not fail insertion.\n        }\n        if (Date.now() - started >= timeout) {\n          reject(new Error(message));\n          return;\n        }\n        window.setTimeout(check, 50);\n      };\n      check();\n    });\n  }\n\n})();\n");
  embeddedScripts.set("modules/opuc/kapybara-adapter.js", function () {
    // Kapybara composer discovery, launcher placement, and Markdown image insertion.
    (function () {
      "use strict";

      const root = window.Cudloun;
      const runtime = root.opuc = root.opuc || {};
      const bindings = new Map();
      let stopObserver = null;

      runtime.adapter = {
        start,
        stop,
        bindLauncher,
        insertImageUrl,
        imageMarkdown,
      };

      function start(onComposer, onRemoved) {
        stop();
        stopObserver = root.kapyguts.observeComposers(
          (parts) => onComposer(parts),
          document.body,
          (parts) => {
            bindings.get(parts.section)?.remove();
            if (typeof onRemoved === "function") onRemoved(parts);
          }
        );
        return stop;
      }

      function stop() {
        stopObserver?.();
        stopObserver = null;
        Array.from(bindings.values()).forEach((binding) => binding.remove());
        bindings.clear();
      }

      function bindLauncher(parts, onClick) {
        if (bindings.has(parts.section)) return bindings.get(parts.section);

        const row = document.createElement("div");
        row.className = "cudloun-opuc-launcher-row";
        row.dataset.composerKind = parts.kind;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "cudloun-opuc-launcher";
        button.setAttribute("aria-label", "OPUc upload");
        button.title = "Upload an image through OPUc";
        button.textContent = "OPUc";
        button.addEventListener("click", onClick);
        row.appendChild(button);
        parts.toolbarSlot.insertAdjacentElement("afterend", row);

        const align = () => alignBelowImageButton(parts, row);
        window.requestAnimationFrame(align);
        const resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(align) : null;
        resizeObserver?.observe(parts.toolbarSlot);
        window.addEventListener("resize", align);

        const binding = {
          parts,
          row,
          button,
          remove() {
            resizeObserver?.disconnect();
            window.removeEventListener("resize", align);
            button.removeEventListener("click", onClick);
            row.remove();
            bindings.delete(parts.section);
          },
        };
        bindings.set(parts.section, binding);
        return binding;
      }

      async function insertImageUrl(parts, imageUrl) {
        if (!parts?.section?.isConnected) throw new Error("The originating Kapybara composer was closed.");
        const validated = runtime.client.validateOpuUrl(imageUrl);
        if (!validated) throw new Error("OPU returned an invalid image URL.");
        const section = parts.section;
        const wasMarkdown = isMarkdownMode(section);

        if (!wasMarkdown) {
          const toggle = findModeToggle(section);
          if (!toggle) throw new Error("Kapybara's Markdown mode toggle was not found.");
          toggle.click();
        }

        const editor = await waitFor(
          () => findMarkdownEditor(section),
          5000,
          "Kapybara did not switch to Markdown mode."
        );
        const markdown = imageMarkdown(validated, editor.innerText);
        if (!insertTextAtEnd(editor, markdown)) {
          throw new Error("Kapybara did not accept the OPU image Markdown.");
        }
        await waitFor(
          () => String(editor.innerText || "").includes(`![](${validated})`),
          3000,
          "Kapybara did not retain the OPU image Markdown."
        );

        root.log?.debug?.("opuc", "inserted image through Markdown mode", {
          composerKind: parts.kind || "unknown",
          restoredFormattedMode: !wasMarkdown,
        });

        if (!wasMarkdown) {
          const toggle = await waitFor(
            () => isMarkdownMode(section) ? findModeToggle(section) : null,
            3000,
            "Kapybara's formatted-text toggle was not found."
          );
          toggle.click();
          await waitFor(
            () => Array.from(section.querySelectorAll("img")).some((image) => image.src === validated),
            5000,
            "Kapybara did not render the inserted OPU image."
          );
        }

        (root.kapyguts?.composerParts?.(section)?.editable || editor)?.focus();
        return validated;
      }

      function imageMarkdown(imageUrl, existingText = "") {
        const tag = `![](${imageUrl})`;
        const text = String(existingText || "").replace(/\u00a0/g, " ");
        if (!text.trim()) return tag;
        const trailingNewlines = text.match(/\n*$/)?.[0].length || 0;
        return `${"\n".repeat(Math.max(0, 2 - trailingNewlines))}${tag}`;
      }

      function findModeToggle(section) {
        const selector = root.kapyguts?.selectors?.composerModeToggle || "button.mode-toggle[aria-pressed]";
        return section.querySelector(selector);
      }

      function isMarkdownMode(section) {
        const selector = root.kapyguts?.selectors?.composerMarkdownNode || "code[data-language='markdown']";
        return !!section.querySelector(selector) || findModeToggle(section)?.getAttribute("aria-pressed") === "true";
      }

      function findMarkdownEditor(section) {
        if (!isMarkdownMode(section)) return null;
        const selector = root.kapyguts?.selectors?.composerEditable ||
          ".composer-content-editable[role='textbox'][contenteditable='true']";
        const editor = section.querySelector(selector);
        return editor?.querySelector("code[data-language='markdown']") ? editor : null;
      }

      function insertTextAtEnd(editor, text) {
        try {
          // Lexical tracks browser editing commands; mutating textContent directly
          // would leave its internal editor state stale and be reverted on render.
          editor.focus();
          const range = document.createRange();
          range.selectNodeContents(editor);
          range.collapse(false);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
          return document.execCommand("insertText", false, text);
        } catch (_error) {
          return false;
        }
      }

      function alignBelowImageButton(parts, row) {
        if (!row.isConnected || !parts.imageButton?.isConnected || !parts.toolbarSlot?.isConnected) return;
        const slotRect = parts.toolbarSlot.getBoundingClientRect();
        const imageRect = parts.imageButton.getBoundingClientRect();
        const rowWidth = row.getBoundingClientRect().width;
        const desired = Math.max(0, Math.round(imageRect.left - slotRect.left));
        const safe = desired + 64 < rowWidth ? desired : 0;
        row.style.setProperty("--cudloun-opuc-launcher-offset", `${safe}px`);
      }

      function waitFor(probe, timeout, message) {
        const started = Date.now();
        return new Promise((resolve, reject) => {
          const check = () => {
            try {
              const result = probe();
              if (result) {
                resolve(result);
                return;
              }
            } catch (_error) {
              // Retry until timeout so transient rerenders do not fail insertion.
            }
            if (Date.now() - started >= timeout) {
              reject(new Error(message));
              return;
            }
            window.setTimeout(check, 50);
          };
          check();
        });
      }

    })();

  });

  embeddedText.set("modules/opuc/queue.js", "// Per-composer OPUc session state.\n(function () {\n  \"use strict\";\n\n  const root = window.Cudloun;\n  const runtime = root.opuc = root.opuc || {};\n  const byComposer = new WeakMap();\n  const sessions = new Set();\n\n  runtime.queue = {\n    ensure,\n    dispose,\n    disposeAll,\n    sessions,\n  };\n\n  function ensure(parts) {\n    const key = parts?.section;\n    if (!key) throw new Error(\"A Kapybara composer is required.\");\n    if (byComposer.has(key)) return byComposer.get(key);\n\n    const session = {\n      parts,\n      file: null,\n      previewUrl: \"\",\n      status: \"idle\",\n      message: \"\",\n      progress: 0,\n      uploadedUrl: \"\",\n      request: null,\n      disposed: false,\n      listeners: new Set(),\n      subscribe(listener) {\n        this.listeners.add(listener);\n        return () => this.listeners.delete(listener);\n      },\n      notify() {\n        this.listeners.forEach((listener) => listener(this));\n      },\n      update(values) {\n        Object.assign(this, values);\n        this.notify();\n      },\n      setFile(file) {\n        this.request?.abort?.();\n        revokePreview(this);\n        this.file = file;\n        this.previewUrl = URL.createObjectURL(file);\n        this.status = \"ready\";\n        this.message = \"Ready to upload.\";\n        this.progress = 0;\n        this.uploadedUrl = \"\";\n        this.request = null;\n        this.notify();\n      },\n      clear() {\n        this.request?.abort?.();\n        revokePreview(this);\n        this.file = null;\n        this.status = \"idle\";\n        this.message = \"\";\n        this.progress = 0;\n        this.uploadedUrl = \"\";\n        this.request = null;\n        this.notify();\n      },\n    };\n\n    byComposer.set(key, session);\n    sessions.add(session);\n    return session;\n  }\n\n  function dispose(session) {\n    if (!session || session.disposed) return;\n    session.disposed = true;\n    session.request?.abort?.();\n    revokePreview(session);\n    session.listeners.clear();\n    sessions.delete(session);\n    byComposer.delete(session.parts.section);\n  }\n\n  function disposeAll() {\n    Array.from(sessions).forEach(dispose);\n  }\n\n  function revokePreview(session) {\n    if (!session.previewUrl) return;\n    URL.revokeObjectURL(session.previewUrl);\n    session.previewUrl = \"\";\n  }\n})();\n");
  embeddedScripts.set("modules/opuc/queue.js", function () {
    // Per-composer OPUc session state.
    (function () {
      "use strict";

      const root = window.Cudloun;
      const runtime = root.opuc = root.opuc || {};
      const byComposer = new WeakMap();
      const sessions = new Set();

      runtime.queue = {
        ensure,
        dispose,
        disposeAll,
        sessions,
      };

      function ensure(parts) {
        const key = parts?.section;
        if (!key) throw new Error("A Kapybara composer is required.");
        if (byComposer.has(key)) return byComposer.get(key);

        const session = {
          parts,
          file: null,
          previewUrl: "",
          status: "idle",
          message: "",
          progress: 0,
          uploadedUrl: "",
          request: null,
          disposed: false,
          listeners: new Set(),
          subscribe(listener) {
            this.listeners.add(listener);
            return () => this.listeners.delete(listener);
          },
          notify() {
            this.listeners.forEach((listener) => listener(this));
          },
          update(values) {
            Object.assign(this, values);
            this.notify();
          },
          setFile(file) {
            this.request?.abort?.();
            revokePreview(this);
            this.file = file;
            this.previewUrl = URL.createObjectURL(file);
            this.status = "ready";
            this.message = "Ready to upload.";
            this.progress = 0;
            this.uploadedUrl = "";
            this.request = null;
            this.notify();
          },
          clear() {
            this.request?.abort?.();
            revokePreview(this);
            this.file = null;
            this.status = "idle";
            this.message = "";
            this.progress = 0;
            this.uploadedUrl = "";
            this.request = null;
            this.notify();
          },
        };

        byComposer.set(key, session);
        sessions.add(session);
        return session;
      }

      function dispose(session) {
        if (!session || session.disposed) return;
        session.disposed = true;
        session.request?.abort?.();
        revokePreview(session);
        session.listeners.clear();
        sessions.delete(session);
        byComposer.delete(session.parts.section);
      }

      function disposeAll() {
        Array.from(sessions).forEach(dispose);
      }

      function revokePreview(session) {
        if (!session.previewUrl) return;
        URL.revokeObjectURL(session.previewUrl);
        session.previewUrl = "";
      }
    })();

  });

  embeddedText.set("modules/opuc/styles.js", "// Removable styles for OPUc composer UI.\n(function () {\n  \"use strict\";\n\n  const root = window.Cudloun;\n  const runtime = root.opuc = root.opuc || {};\n  const STYLE_ID = \"cudloun-opuc-style\";\n\n  runtime.styles = { install, remove };\n\n  function install() {\n    if (document.getElementById(STYLE_ID)) return;\n    const style = document.createElement(\"style\");\n    style.id = STYLE_ID;\n    style.textContent = `\n      .cudloun-opuc-launcher-row{box-sizing:border-box;display:flex;align-items:center;width:100%;padding:4px 0 2px var(--cudloun-opuc-launcher-offset,0);min-height:30px}\n      .cudloun-opuc-launcher{appearance:none;border:1px solid rgba(70,92,120,.3);border-radius:6px;background:#f4f7fa;color:#243041;cursor:pointer;font:700 12px/1.2 inherit;padding:5px 9px;box-shadow:0 1px 2px rgba(0,0,0,.08)}\n      .cudloun-opuc-launcher:hover{border-color:#087ea4;color:#087ea4}\n      .cudloun-opuc-launcher:focus-visible{outline:2px solid #087ea4;outline-offset:2px}\n      .cudloun-opuc-panel{box-sizing:border-box;display:none;gap:10px;align-items:center;margin:4px 0 8px;padding:9px;border:1px solid rgba(70,92,120,.22);border-radius:8px;background:#f8fafc;color:#243041;font:13px/1.35 inherit}\n      .cudloun-opuc-panel[data-open=true]{display:grid;grid-template-columns:56px minmax(0,1fr);grid-template-areas:\"preview info\" \"preview status\" \"actions actions\"}\n      .cudloun-opuc-preview{grid-area:preview;width:54px;height:54px;object-fit:cover;border-radius:6px;border:1px solid rgba(70,92,120,.22);background:#fff}\n      .cudloun-opuc-file-info{grid-area:info;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700}\n      .cudloun-opuc-status{grid-area:status;color:#596579;min-height:18px}\n      .cudloun-opuc-panel[data-state=error] .cudloun-opuc-status{color:#b42318}\n      .cudloun-opuc-panel[data-state=success] .cudloun-opuc-status{color:#067647}\n      .cudloun-opuc-actions{grid-area:actions;display:flex;gap:7px;justify-content:flex-end}\n      .cudloun-opuc-action{appearance:none;border:1px solid rgba(70,92,120,.28);border-radius:6px;background:#fff;color:#243041;cursor:pointer;font:700 12px/1.2 inherit;padding:6px 10px}\n      .cudloun-opuc-action[data-primary=true]{border-color:#087ea4;background:#087ea4;color:#fff}\n      .cudloun-opuc-action:disabled{cursor:default;opacity:.55}\n      html[data-cudloun-kapybara-theme=dark] .cudloun-opuc-launcher,\n      html[data-cudloun-kapybara-theme=dark] .cudloun-opuc-panel,\n      html[data-cudloun-kapybara-theme=dark] .cudloun-opuc-action{background:var(--cudloun-kapybara-surface,#141414);color:var(--cudloun-kapybara-text,#f4f4f4);border-color:var(--cudloun-kapybara-line,#303030)}\n      html[data-cudloun-kapybara-theme=dark] .cudloun-opuc-action[data-primary=true]{background:var(--cudloun-kapybara-accent,#d68a1f);color:#fff}\n      @media(max-width:620px){.cudloun-opuc-launcher-row{padding-inline-start:0}.cudloun-opuc-panel[data-open=true]{grid-template-columns:48px minmax(0,1fr)}.cudloun-opuc-preview{width:46px;height:46px}}\n    `;\n    document.head.appendChild(style);\n  }\n\n  function remove() {\n    document.getElementById(STYLE_ID)?.remove();\n  }\n})();\n");
  embeddedScripts.set("modules/opuc/styles.js", function () {
    // Removable styles for OPUc composer UI.
    (function () {
      "use strict";

      const root = window.Cudloun;
      const runtime = root.opuc = root.opuc || {};
      const STYLE_ID = "cudloun-opuc-style";

      runtime.styles = { install, remove };

      function install() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
          .cudloun-opuc-launcher-row{box-sizing:border-box;display:flex;align-items:center;width:100%;padding:4px 0 2px var(--cudloun-opuc-launcher-offset,0);min-height:30px}
          .cudloun-opuc-launcher{appearance:none;border:1px solid rgba(70,92,120,.3);border-radius:6px;background:#f4f7fa;color:#243041;cursor:pointer;font:700 12px/1.2 inherit;padding:5px 9px;box-shadow:0 1px 2px rgba(0,0,0,.08)}
          .cudloun-opuc-launcher:hover{border-color:#087ea4;color:#087ea4}
          .cudloun-opuc-launcher:focus-visible{outline:2px solid #087ea4;outline-offset:2px}
          .cudloun-opuc-panel{box-sizing:border-box;display:none;gap:10px;align-items:center;margin:4px 0 8px;padding:9px;border:1px solid rgba(70,92,120,.22);border-radius:8px;background:#f8fafc;color:#243041;font:13px/1.35 inherit}
          .cudloun-opuc-panel[data-open=true]{display:grid;grid-template-columns:56px minmax(0,1fr);grid-template-areas:"preview info" "preview status" "actions actions"}
          .cudloun-opuc-preview{grid-area:preview;width:54px;height:54px;object-fit:cover;border-radius:6px;border:1px solid rgba(70,92,120,.22);background:#fff}
          .cudloun-opuc-file-info{grid-area:info;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700}
          .cudloun-opuc-status{grid-area:status;color:#596579;min-height:18px}
          .cudloun-opuc-panel[data-state=error] .cudloun-opuc-status{color:#b42318}
          .cudloun-opuc-panel[data-state=success] .cudloun-opuc-status{color:#067647}
          .cudloun-opuc-actions{grid-area:actions;display:flex;gap:7px;justify-content:flex-end}
          .cudloun-opuc-action{appearance:none;border:1px solid rgba(70,92,120,.28);border-radius:6px;background:#fff;color:#243041;cursor:pointer;font:700 12px/1.2 inherit;padding:6px 10px}
          .cudloun-opuc-action[data-primary=true]{border-color:#087ea4;background:#087ea4;color:#fff}
          .cudloun-opuc-action:disabled{cursor:default;opacity:.55}
          html[data-cudloun-kapybara-theme=dark] .cudloun-opuc-launcher,
          html[data-cudloun-kapybara-theme=dark] .cudloun-opuc-panel,
          html[data-cudloun-kapybara-theme=dark] .cudloun-opuc-action{background:var(--cudloun-kapybara-surface,#141414);color:var(--cudloun-kapybara-text,#f4f4f4);border-color:var(--cudloun-kapybara-line,#303030)}
          html[data-cudloun-kapybara-theme=dark] .cudloun-opuc-action[data-primary=true]{background:var(--cudloun-kapybara-accent,#d68a1f);color:#fff}
          @media(max-width:620px){.cudloun-opuc-launcher-row{padding-inline-start:0}.cudloun-opuc-panel[data-open=true]{grid-template-columns:48px minmax(0,1fr)}.cudloun-opuc-preview{width:46px;height:46px}}
        `;
        document.head.appendChild(style);
      }

      function remove() {
        document.getElementById(STYLE_ID)?.remove();
      }
    })();

  });

  embeddedText.set("modules/opuc/ui.js", "// Minimal one-file OPUc staging and upload UI.\n(function () {\n  \"use strict\";\n\n  const root = window.Cudloun;\n  const runtime = root.opuc = root.opuc || {};\n  const views = new Map();\n  let ctxRef = null;\n  let stopAdapter = null;\n  let loginState = \"unknown\";\n  let loginProbe = null;\n\n  runtime.ui = { start, stop };\n\n  function start(ctx) {\n    stop();\n    ctxRef = ctx;\n    runtime.styles.install();\n    stopAdapter = runtime.adapter.start(\n      (parts) => mountComposer(parts),\n      (parts) => unmountComposer(parts)\n    );\n    ctx.log.info(\"OPUc composer integration ready\");\n    return stop;\n  }\n\n  function stop() {\n    stopAdapter?.();\n    stopAdapter = null;\n    views.forEach((view) => view.remove());\n    views.clear();\n    runtime.queue?.disposeAll();\n    runtime.styles?.remove();\n    ctxRef = null;\n    loginState = \"unknown\";\n    loginProbe = null;\n  }\n\n  function mountComposer(parts) {\n    if (!ctxRef || views.has(parts.section)) return;\n    const session = runtime.queue.ensure(parts);\n    const binding = runtime.adapter.bindLauncher(parts, () => chooseFile(view));\n    const view = createView(session, binding);\n    views.set(parts.section, view);\n  }\n\n  function unmountComposer(parts) {\n    const view = views.get(parts.section);\n    if (!view) return;\n    view.remove();\n    views.delete(parts.section);\n  }\n\n  function createView(session, binding) {\n    const input = document.createElement(\"input\");\n    input.type = \"file\";\n    input.accept = \"image/*\";\n    input.hidden = true;\n    binding.row.appendChild(input);\n\n    const panel = document.createElement(\"div\");\n    panel.className = \"cudloun-opuc-panel\";\n    panel.dataset.open = \"false\";\n    panel.dataset.state = \"idle\";\n\n    const preview = document.createElement(\"img\");\n    preview.className = \"cudloun-opuc-preview\";\n    preview.alt = \"Selected image preview\";\n\n    const fileInfo = document.createElement(\"div\");\n    fileInfo.className = \"cudloun-opuc-file-info\";\n\n    const status = document.createElement(\"div\");\n    status.className = \"cudloun-opuc-status\";\n    status.setAttribute(\"aria-live\", \"polite\");\n\n    const actions = document.createElement(\"div\");\n    actions.className = \"cudloun-opuc-actions\";\n\n    const clear = actionButton(\"Clear\", false);\n    const upload = actionButton(\"Upload to OPU\", true);\n    actions.appendChild(clear);\n    actions.appendChild(upload);\n\n    panel.appendChild(preview);\n    panel.appendChild(fileInfo);\n    panel.appendChild(status);\n    panel.appendChild(actions);\n    binding.row.insertAdjacentElement(\"afterend\", panel);\n\n    const view = {\n      session,\n      binding,\n      input,\n      panel,\n      preview,\n      fileInfo,\n      status,\n      clear,\n      upload,\n      unsubscribe: null,\n      removed: false,\n      remove() {\n        if (this.removed) return;\n        this.removed = true;\n        this.unsubscribe?.();\n        input.removeEventListener(\"change\", onFileChange);\n        clear.removeEventListener(\"click\", onClear);\n        upload.removeEventListener(\"click\", onUpload);\n        panel.remove();\n        binding.remove();\n        runtime.queue.dispose(session);\n      },\n    };\n\n    const onFileChange = () => selectFile(view, input.files?.[0] || null);\n    const onClear = () => {\n      input.value = \"\";\n      session.clear();\n    };\n    const onUpload = () => {\n      if (session.status === \"uploading\") session.request?.abort?.();\n      else uploadFile(view);\n    };\n    input.addEventListener(\"change\", onFileChange);\n    clear.addEventListener(\"click\", onClear);\n    upload.addEventListener(\"click\", onUpload);\n    view.unsubscribe = session.subscribe(() => render(view));\n    render(view);\n    return view;\n  }\n\n  function chooseFile(view) {\n    if (!view.session.parts.section.isConnected) return;\n    probeLogin(view);\n    view.input.click();\n  }\n\n  function selectFile(view, file) {\n    if (!file) return;\n    try {\n      const maxMb = validMaxMb(ctxRef?.storage.get(\"maxUploadMb\", 25));\n      runtime.imagePipeline.validateFile(file, maxMb * 1024 * 1024);\n      view.session.setFile(file);\n      prepareFirefoxFile(view, file);\n    } catch (error) {\n      view.input.value = \"\";\n      view.session.update({ status: \"error\", message: safeMessage(error), progress: 0 });\n    }\n  }\n\n  function prepareFirefoxFile(view, file) {\n    const bridge = runtime.popupBridge;\n    const unsupported = bridge?.unsupportedReason?.();\n    if (unsupported) {\n      view.input.value = \"\";\n      view.session.update({ status: \"error\", message: unsupported, progress: 0 });\n      return;\n    }\n    if (!bridge?.shouldUse?.()) {\n      if (!bridge?.shouldKeepInputAttached?.()) view.input.value = \"\";\n      return;\n    }\n\n    const session = view.session;\n    session.update({ status: \"preparing\", message: \"Preparing image for Firefox…\", progress: 0 });\n    bridge.prepare(file)\n      .then(() => {\n        if (session.disposed || session.file !== file) return;\n        view.input.value = \"\";\n        if (session.status === \"preparing\") {\n          session.update({ status: \"ready\", message: \"Ready to upload.\", progress: 0 });\n        }\n      })\n      .catch((error) => {\n        if (session.disposed || session.file !== file) return;\n        session.update({ status: \"error\", message: safeMessage(error), progress: 0 });\n      });\n  }\n\n  async function uploadFile(view) {\n    const session = view.session;\n    if (!session.file || session.disposed) return;\n\n    session.update({ status: \"uploading\", message: \"Uploading to OPU…\", progress: 0 });\n    const request = runtime.client.upload(session.file, {\n      onProgress(event) {\n        if (!event.lengthComputable || !event.total) return;\n        const progress = Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100)));\n        session.update({ progress, message: `Uploading to OPU… ${progress}%` });\n      },\n    });\n    session.request = request;\n\n    try {\n      const url = await request.promise;\n      if (session.disposed || !session.parts.section.isConnected) {\n        throw new Error(\"The originating Kapybara composer was closed.\");\n      }\n      session.update({ status: \"inserting\", message: \"Adding the image to Kapybara…\", uploadedUrl: url });\n      await runtime.adapter.insertImageUrl(session.parts, url);\n      session.update({ status: \"success\", message: \"Uploaded and inserted. Review the post before sending.\", progress: 100 });\n    } catch (error) {\n      const cancelled = error?.name === \"AbortError\";\n      session.update({\n        status: cancelled ? \"ready\" : \"error\",\n        message: cancelled ? \"Upload cancelled. The image is still staged.\" : safeMessage(error),\n        progress: 0,\n      });\n    } finally {\n      session.request = null;\n      render(view);\n    }\n  }\n\n  function render(view) {\n    const session = view.session;\n    const hasFile = !!session.file;\n    view.panel.dataset.open = hasFile || session.status === \"error\" ? \"true\" : \"false\";\n    view.panel.dataset.state = session.status;\n    view.preview.hidden = !session.previewUrl;\n    if (session.previewUrl) view.preview.src = session.previewUrl;\n\n    const info = runtime.imagePipeline.describeFile(session.file);\n    view.fileInfo.textContent = hasFile ? `${info.name} · ${info.sizeText}` : \"No image selected\";\n    view.status.textContent = session.message || loginMessage();\n    view.clear.disabled = session.status === \"uploading\" || session.status === \"inserting\";\n    view.upload.disabled = !hasFile || session.status === \"preparing\" || session.status === \"inserting\" || session.status === \"success\";\n    view.upload.textContent = session.status === \"uploading\" ? \"Cancel upload\" : session.status === \"error\" ? \"Retry upload\" : \"Upload to OPU\";\n  }\n\n  function probeLogin(view) {\n    if (loginState !== \"unknown\" || loginProbe) return loginProbe;\n    loginState = \"checking\";\n    render(view);\n    loginProbe = runtime.client.checkLoginStatus()\n      .then((loggedIn) => {\n        loginState = loggedIn ? \"logged-in\" : \"logged-out\";\n        return loggedIn;\n      })\n      .catch(() => {\n        loginState = \"unavailable\";\n        return false;\n      })\n      .finally(() => {\n        loginProbe = null;\n        views.forEach(render);\n      });\n    return loginProbe;\n  }\n\n  function loginMessage() {\n    if (loginState === \"checking\") return \"Checking OPU session…\";\n    if (loginState === \"logged-out\") return \"OPU is not signed in; account features may be limited.\";\n    if (loginState === \"unavailable\") return \"OPU session could not be checked; upload may still work.\";\n    return \"\";\n  }\n\n  function actionButton(label, primary) {\n    const button = document.createElement(\"button\");\n    button.type = \"button\";\n    button.className = \"cudloun-opuc-action\";\n    button.dataset.primary = primary ? \"true\" : \"false\";\n    button.textContent = label;\n    return button;\n  }\n\n  function validMaxMb(value) {\n    const parsed = Number(value);\n    return Number.isFinite(parsed) && parsed >= 1 && parsed <= 100 ? parsed : 25;\n  }\n\n  function safeMessage(error) {\n    return error instanceof Error && error.message ? error.message : \"The OPU operation failed.\";\n  }\n})();\n");
  embeddedScripts.set("modules/opuc/ui.js", function () {
    // Minimal one-file OPUc staging and upload UI.
    (function () {
      "use strict";

      const root = window.Cudloun;
      const runtime = root.opuc = root.opuc || {};
      const views = new Map();
      let ctxRef = null;
      let stopAdapter = null;
      let loginState = "unknown";
      let loginProbe = null;

      runtime.ui = { start, stop };

      function start(ctx) {
        stop();
        ctxRef = ctx;
        runtime.styles.install();
        stopAdapter = runtime.adapter.start(
          (parts) => mountComposer(parts),
          (parts) => unmountComposer(parts)
        );
        ctx.log.info("OPUc composer integration ready");
        return stop;
      }

      function stop() {
        stopAdapter?.();
        stopAdapter = null;
        views.forEach((view) => view.remove());
        views.clear();
        runtime.queue?.disposeAll();
        runtime.styles?.remove();
        ctxRef = null;
        loginState = "unknown";
        loginProbe = null;
      }

      function mountComposer(parts) {
        if (!ctxRef || views.has(parts.section)) return;
        const session = runtime.queue.ensure(parts);
        const binding = runtime.adapter.bindLauncher(parts, () => chooseFile(view));
        const view = createView(session, binding);
        views.set(parts.section, view);
      }

      function unmountComposer(parts) {
        const view = views.get(parts.section);
        if (!view) return;
        view.remove();
        views.delete(parts.section);
      }

      function createView(session, binding) {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.hidden = true;
        binding.row.appendChild(input);

        const panel = document.createElement("div");
        panel.className = "cudloun-opuc-panel";
        panel.dataset.open = "false";
        panel.dataset.state = "idle";

        const preview = document.createElement("img");
        preview.className = "cudloun-opuc-preview";
        preview.alt = "Selected image preview";

        const fileInfo = document.createElement("div");
        fileInfo.className = "cudloun-opuc-file-info";

        const status = document.createElement("div");
        status.className = "cudloun-opuc-status";
        status.setAttribute("aria-live", "polite");

        const actions = document.createElement("div");
        actions.className = "cudloun-opuc-actions";

        const clear = actionButton("Clear", false);
        const upload = actionButton("Upload to OPU", true);
        actions.appendChild(clear);
        actions.appendChild(upload);

        panel.appendChild(preview);
        panel.appendChild(fileInfo);
        panel.appendChild(status);
        panel.appendChild(actions);
        binding.row.insertAdjacentElement("afterend", panel);

        const view = {
          session,
          binding,
          input,
          panel,
          preview,
          fileInfo,
          status,
          clear,
          upload,
          unsubscribe: null,
          removed: false,
          remove() {
            if (this.removed) return;
            this.removed = true;
            this.unsubscribe?.();
            input.removeEventListener("change", onFileChange);
            clear.removeEventListener("click", onClear);
            upload.removeEventListener("click", onUpload);
            panel.remove();
            binding.remove();
            runtime.queue.dispose(session);
          },
        };

        const onFileChange = () => selectFile(view, input.files?.[0] || null);
        const onClear = () => {
          input.value = "";
          session.clear();
        };
        const onUpload = () => {
          if (session.status === "uploading") session.request?.abort?.();
          else uploadFile(view);
        };
        input.addEventListener("change", onFileChange);
        clear.addEventListener("click", onClear);
        upload.addEventListener("click", onUpload);
        view.unsubscribe = session.subscribe(() => render(view));
        render(view);
        return view;
      }

      function chooseFile(view) {
        if (!view.session.parts.section.isConnected) return;
        probeLogin(view);
        view.input.click();
      }

      function selectFile(view, file) {
        if (!file) return;
        try {
          const maxMb = validMaxMb(ctxRef?.storage.get("maxUploadMb", 25));
          runtime.imagePipeline.validateFile(file, maxMb * 1024 * 1024);
          view.session.setFile(file);
          prepareFirefoxFile(view, file);
        } catch (error) {
          view.input.value = "";
          view.session.update({ status: "error", message: safeMessage(error), progress: 0 });
        }
      }

      function prepareFirefoxFile(view, file) {
        const bridge = runtime.popupBridge;
        const unsupported = bridge?.unsupportedReason?.();
        if (unsupported) {
          view.input.value = "";
          view.session.update({ status: "error", message: unsupported, progress: 0 });
          return;
        }
        if (!bridge?.shouldUse?.()) {
          if (!bridge?.shouldKeepInputAttached?.()) view.input.value = "";
          return;
        }

        const session = view.session;
        session.update({ status: "preparing", message: "Preparing image for Firefox…", progress: 0 });
        bridge.prepare(file)
          .then(() => {
            if (session.disposed || session.file !== file) return;
            view.input.value = "";
            if (session.status === "preparing") {
              session.update({ status: "ready", message: "Ready to upload.", progress: 0 });
            }
          })
          .catch((error) => {
            if (session.disposed || session.file !== file) return;
            session.update({ status: "error", message: safeMessage(error), progress: 0 });
          });
      }

      async function uploadFile(view) {
        const session = view.session;
        if (!session.file || session.disposed) return;

        session.update({ status: "uploading", message: "Uploading to OPU…", progress: 0 });
        const request = runtime.client.upload(session.file, {
          onProgress(event) {
            if (!event.lengthComputable || !event.total) return;
            const progress = Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100)));
            session.update({ progress, message: `Uploading to OPU… ${progress}%` });
          },
        });
        session.request = request;

        try {
          const url = await request.promise;
          if (session.disposed || !session.parts.section.isConnected) {
            throw new Error("The originating Kapybara composer was closed.");
          }
          session.update({ status: "inserting", message: "Adding the image to Kapybara…", uploadedUrl: url });
          await runtime.adapter.insertImageUrl(session.parts, url);
          session.update({ status: "success", message: "Uploaded and inserted. Review the post before sending.", progress: 100 });
        } catch (error) {
          const cancelled = error?.name === "AbortError";
          session.update({
            status: cancelled ? "ready" : "error",
            message: cancelled ? "Upload cancelled. The image is still staged." : safeMessage(error),
            progress: 0,
          });
        } finally {
          session.request = null;
          render(view);
        }
      }

      function render(view) {
        const session = view.session;
        const hasFile = !!session.file;
        view.panel.dataset.open = hasFile || session.status === "error" ? "true" : "false";
        view.panel.dataset.state = session.status;
        view.preview.hidden = !session.previewUrl;
        if (session.previewUrl) view.preview.src = session.previewUrl;

        const info = runtime.imagePipeline.describeFile(session.file);
        view.fileInfo.textContent = hasFile ? `${info.name} · ${info.sizeText}` : "No image selected";
        view.status.textContent = session.message || loginMessage();
        view.clear.disabled = session.status === "uploading" || session.status === "inserting";
        view.upload.disabled = !hasFile || session.status === "preparing" || session.status === "inserting" || session.status === "success";
        view.upload.textContent = session.status === "uploading" ? "Cancel upload" : session.status === "error" ? "Retry upload" : "Upload to OPU";
      }

      function probeLogin(view) {
        if (loginState !== "unknown" || loginProbe) return loginProbe;
        loginState = "checking";
        render(view);
        loginProbe = runtime.client.checkLoginStatus()
          .then((loggedIn) => {
            loginState = loggedIn ? "logged-in" : "logged-out";
            return loggedIn;
          })
          .catch(() => {
            loginState = "unavailable";
            return false;
          })
          .finally(() => {
            loginProbe = null;
            views.forEach(render);
          });
        return loginProbe;
      }

      function loginMessage() {
        if (loginState === "checking") return "Checking OPU session…";
        if (loginState === "logged-out") return "OPU is not signed in; account features may be limited.";
        if (loginState === "unavailable") return "OPU session could not be checked; upload may still work.";
        return "";
      }

      function actionButton(label, primary) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "cudloun-opuc-action";
        button.dataset.primary = primary ? "true" : "false";
        button.textContent = label;
        return button;
      }

      function validMaxMb(value) {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed >= 1 && parsed <= 100 ? parsed : 25;
      }

      function safeMessage(error) {
        return error instanceof Error && error.message ? error.message : "The OPU operation failed.";
      }
    })();

  });

  embeddedText.set("modules/opuc/index.js", "// Cudloun module registration for OPUc on Kapybara.\n(function () {\n  \"use strict\";\n\n  const root = window.Cudloun;\n  const runtime = root.opuc = root.opuc || {};\n\n  root.registerModule({\n    id: \"opuc\",\n    name: \"OPUc for Kapybara\",\n    description: \"Upload an image through OPU and insert it into Kapybara's native editor.\",\n    version: \"0.2.0\",\n    defaultEnabled: false,\n    start(ctx) {\n      if (!root.kapyguts?.isKapybara?.()) return null;\n      return runtime.ui.start(ctx);\n    },\n    renderSettings(ctx) {\n      const wrap = document.createElement(\"div\");\n      wrap.className = \"cudloun-settings-list\";\n\n      const label = document.createElement(\"label\");\n      label.className = \"cudloun-setting-row\";\n      const text = document.createElement(\"span\");\n      text.className = \"cudloun-setting-text\";\n      text.textContent = \"Maximum image size (MB)\";\n\n      const input = document.createElement(\"input\");\n      input.className = \"cudloun-select\";\n      input.type = \"number\";\n      input.min = \"1\";\n      input.max = \"100\";\n      input.step = \"1\";\n      input.value = String(ctx.storage.get(\"maxUploadMb\", 25));\n      input.addEventListener(\"change\", () => {\n        const value = Math.max(1, Math.min(100, Number(input.value) || 25));\n        input.value = String(value);\n        ctx.storage.set(\"maxUploadMb\", value);\n      });\n\n      label.appendChild(text);\n      label.appendChild(input);\n      wrap.appendChild(label);\n      return wrap;\n    },\n    renderHelp() {\n      return [\n        \"Enable the module to add an OPUc button below the native image control in new-post and reply composers.\",\n        \"The first version stages one image, uploads it to OPU, and inserts it through Kapybara's native URL image flow.\",\n        \"Firefox/Tampermonkey uses the reliable OPU handoff tab. Firefox/Greasemonkey uses OPUc Ultimate's direct request pattern experimentally and keeps the selected file input attached.\",\n        \"Uploaded URLs are inserted as Markdown through Kapybara's text mode, bypassing the native image dialog. OPUc restores formatted mode when that was the editor's original mode.\",\n        \"OPUc never submits the Kapybara post. Review the inserted image and send or cancel the post yourself.\",\n      ];\n    },\n  });\n})();\n");
  embeddedScripts.set("modules/opuc/index.js", function () {
    // Cudloun module registration for OPUc on Kapybara.
    (function () {
      "use strict";

      const root = window.Cudloun;
      const runtime = root.opuc = root.opuc || {};

      root.registerModule({
        id: "opuc",
        name: "OPUc for Kapybara",
        description: "Upload an image through OPU and insert it into Kapybara's native editor.",
        version: "0.2.0",
        defaultEnabled: false,
        start(ctx) {
          if (!root.kapyguts?.isKapybara?.()) return null;
          return runtime.ui.start(ctx);
        },
        renderSettings(ctx) {
          const wrap = document.createElement("div");
          wrap.className = "cudloun-settings-list";

          const label = document.createElement("label");
          label.className = "cudloun-setting-row";
          const text = document.createElement("span");
          text.className = "cudloun-setting-text";
          text.textContent = "Maximum image size (MB)";

          const input = document.createElement("input");
          input.className = "cudloun-select";
          input.type = "number";
          input.min = "1";
          input.max = "100";
          input.step = "1";
          input.value = String(ctx.storage.get("maxUploadMb", 25));
          input.addEventListener("change", () => {
            const value = Math.max(1, Math.min(100, Number(input.value) || 25));
            input.value = String(value);
            ctx.storage.set("maxUploadMb", value);
          });

          label.appendChild(text);
          label.appendChild(input);
          wrap.appendChild(label);
          return wrap;
        },
        renderHelp() {
          return [
            "Enable the module to add an OPUc button below the native image control in new-post and reply composers.",
            "The first version stages one image, uploads it to OPU, and inserts it through Kapybara's native URL image flow.",
            "Firefox/Tampermonkey uses the reliable OPU handoff tab. Firefox/Greasemonkey uses OPUc Ultimate's direct request pattern experimentally and keeps the selected file input attached.",
            "Uploaded URLs are inserted as Markdown through Kapybara's text mode, bypassing the native image dialog. OPUc restores formatted mode when that was the editor's original mode.",
            "OPUc never submits the Kapybara post. Review the inserted image and send or cancel the post yourself.",
          ];
        },
      });
    })();

  });

  function normalizeEmbeddedPath(url) {
    const raw = String(url || "").split("#")[0].split("?")[0];
    if (raw.startsWith(RAW_MAIN_URL)) return raw.slice(RAW_MAIN_URL.length);
    try {
      const parsed = new URL(raw, window.location.href);
      const marker = "/hanenashi/cudloun/";
      const index = parsed.pathname.indexOf(marker);
      if (parsed.hostname === "raw.githubusercontent.com" && index >= 0) {
        const parts = parsed.pathname.slice(index + marker.length).split("/");
        return parts.slice(1).join("/");
      }
    } catch (_error) {
      // Fall through to local relative handling.
    }
    return raw.replace(/^\.\//, "").replace(/^\//, "");
  }

  function requestText(url) {
    const path = normalizeEmbeddedPath(url);
    if (embeddedText.has(path)) return Promise.resolve(embeddedText.get(path));

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
            reject(new Error("HTTP " + response.status + " for " + url));
          },
          onerror() { reject(new Error("Request failed for " + url)); },
          ontimeout() { reject(new Error("Request timed out for " + url)); },
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
          reject(new Error("HTTP " + response.status + " for " + url));
        };
        const settleReject = (error) => {
          if (settled) return;
          settled = true;
          reject(error instanceof Error ? error : new Error("Request failed for " + url));
        };

        try {
          const result = GM.xmlHttpRequest({
            method: "GET",
            url,
            onload: settleResolve,
            onerror: settleReject,
            ontimeout: () => settleReject(new Error("Request timed out for " + url)),
          });
          if (result && typeof result.then === "function") result.then(settleResolve).catch(settleReject);
        } catch (error) {
          settleReject(error);
        }
        return;
      }

      fetch(url, { cache: "no-store" })
        .then((response) => {
          if (!response.ok) throw new Error("HTTP " + response.status + " for " + url);
          return response.text();
        })
        .then(resolve)
        .catch(reject);
    });
  }

  function execute(code, label) {
    const path = normalizeEmbeddedPath(label);
    if (embeddedScripts.has(path)) {
      embeddedScripts.get(path)();
      return;
    }
    throw new Error("Cudloun dynamic script execution is disabled by the bundled loader: " + (label || "unknown script"));
  }

  const seed = {
    version: VERSION,
    repoUrl: RAW_MAIN_URL,
    cacheBust: CACHE_BUST,
    requestText,
    execute,
  };

  const CUDLOUN_SEED = seed;

  // Cudloun modular core.
  (function () {
    "use strict";

    const seed = CUDLOUN_SEED;
    const CORE_VERSION = "0.3.12";
    const STORAGE_KEY = "cudloun.settings.v1";
    const MAX_LOGS = 500;
    const LEVELS = { off: 0, error: 1, warn: 2, info: 3, debug: 4, trace: 5 };
    const loadedFiles = [];
    const modules = [];
    const moduleState = new Map();
    const logs = [];
    const settings = loadSettings();

    const Cudloun = {
      version: CORE_VERSION,
      seedVersion: seed.version,
      coreVersion: CORE_VERSION,
      manifestVersion: "unknown",
      repoUrl: seed.repoUrl,
      cacheBust: seed.cacheBust,
      loadedFiles,
      modules,
      settings,
      log: makeLogger(),
      storage: {
        get: getSetting,
        set: setSetting,
        isModuleEnabled,
        setModuleEnabled,
        scope: scopedStorage,
      },
      registerModule,
      startModule,
      stopModule,
      restartModule,
      startEnabledModules,
      makeModuleContext,
      navigate(url) {
        window.location.assign(url);
      },
      currentRoute() {
        return `${window.location.pathname}${window.location.search}${window.location.hash}`;
      },
      util: {
        requestText: seed.requestText,
        execute: seed.execute,
        loadScript,
      },
    };

    window.Cudloun = Cudloun;
    Cudloun.log.info("boot", "core initialized", CORE_VERSION, `seed=${seed.version}`);
    boot();

    async function boot() {
      try {
        const manifestUrl = `${seed.repoUrl}modules.json?v=${seed.cacheBust}`;
        Cudloun.log.debug("boot", "loading manifest", manifestUrl);
        const manifest = JSON.parse(await seed.requestText(manifestUrl));
        Cudloun.manifest = manifest;
        Cudloun.manifestVersion = manifest.version || "unversioned";
        Cudloun.log.info("boot", "manifest loaded", manifest.version || "unversioned");

        await loadManifestGroup(manifest.system || [], "system");
        await loadManifestGroup(manifest.modules || [], "module");

        startEnabledModules();

        if (Cudloun.ui && typeof Cudloun.ui.start === "function") {
          Cudloun.ui.start();
        }

        Cudloun.log.info("boot", "ready", `${modules.length} module(s)`);
      } catch (error) {
        Cudloun.log.error("boot", "startup failed", error);
      }
    }

    async function loadManifestGroup(items, groupName) {
      for (const item of items) {
        if (!item) continue;
        const files = Array.isArray(item.files) ? item.files : item.file ? [item.file] : [];
        if (item.required || groupName === "module") {
          for (const file of files) {
            await loadScript(file, files.length === 1 ? (item.id || file) : `${item.id || groupName}:${file}`);
          }
        }
      }
    }

    async function loadScript(file, id) {
      const url = `${seed.repoUrl}${file}?v=${seed.cacheBust}`;
      Cudloun.log.debug("loader", "loading", id, url);
      const code = await seed.requestText(url);
      seed.execute(code, url);
      loadedFiles.push({ id, file, url, loadedAt: new Date().toISOString() });
      Cudloun.log.info("loader", "loaded", id);
    }

    function registerModule(module) {
      if (!module || !module.id) {
        Cudloun.log.warn("module", "ignored module without id", module);
        return;
      }

      if (modules.some((item) => item.id === module.id)) {
        Cudloun.log.warn("module", "duplicate module ignored", module.id);
        return;
      }

      const normalized = {
        version: "0.1.0",
        defaultEnabled: false,
        ...module,
      };

      modules.push(normalized);
      Cudloun.log.info("module", "registered", normalized.id, normalized.version);
    }

    function startEnabledModules() {
      modules.forEach((module) => {
        if (isModuleEnabled(module.id)) startModule(module.id);
      });
    }

    function startModule(moduleId) {
      const module = moduleById(moduleId);
      if (!module || moduleState.get(moduleId)?.started) return;

      const record = { started: true, cleanup: null };
      moduleState.set(moduleId, record);

      try {
        if (typeof module.start === "function") {
          record.cleanup = module.start(makeModuleContext(module)) || null;
        }
        Cudloun.log.info("module", "started", moduleId);
      } catch (error) {
        record.started = false;
        Cudloun.log.error("module", "start failed", moduleId, error);
      }
    }

    function stopModule(moduleId) {
      const module = moduleById(moduleId);
      const record = moduleState.get(moduleId);
      if (!module || !record?.started) return;

      try {
        if (typeof record.cleanup === "function") record.cleanup();
        if (typeof module.stop === "function") module.stop(makeModuleContext(module));
        Cudloun.log.info("module", "stopped", moduleId);
      } catch (error) {
        Cudloun.log.error("module", "stop failed", moduleId, error);
      } finally {
        moduleState.set(moduleId, { started: false, cleanup: null });
      }
    }

    function restartModule(moduleId) {
      stopModule(moduleId);
      if (isModuleEnabled(moduleId)) startModule(moduleId);
    }

    function makeModuleContext(module) {
      return {
        module,
        log: areaLogger(module.id),
        navigate: Cudloun.navigate,
        storage: scopedStorage(`module.${module.id}.`),
        hub: {
          open: () => Cudloun.ui?.openHub(module.id),
          close: () => Cudloun.ui?.closeHub(),
          render: () => Cudloun.ui?.renderHub(module.id),
        },
      };
    }

    function moduleById(moduleId) {
      return modules.find((module) => module.id === moduleId) || null;
    }

    function loadSettings() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { modules: {}, values: { logLevel: "info" } };

        const parsed = JSON.parse(raw);
        return {
          modules: parsed.modules || {},
          values: { logLevel: "info", ...(parsed.values || {}) },
        };
      } catch (error) {
        return { modules: {}, values: { logLevel: "info" } };
      }
    }

    function saveSettings() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        Cudloun.log.warn("storage", "settings could not be saved", error);
      }
    }

    function getSetting(name, fallback) {
      return Object.prototype.hasOwnProperty.call(settings.values, name) ? settings.values[name] : fallback;
    }

    function setSetting(name, value) {
      settings.values[name] = value;
      saveSettings();
      Cudloun.log.debug("storage", "set", name, value);
    }

    function scopedStorage(prefix) {
      return {
        get(name, fallback) {
          return getSetting(prefix + name, fallback);
        },
        set(name, value) {
          setSetting(prefix + name, value);
        },
      };
    }

    function isModuleEnabled(moduleId) {
      const module = moduleById(moduleId);
      if (Object.prototype.hasOwnProperty.call(settings.modules, moduleId)) {
        return settings.modules[moduleId] !== false;
      }

      return module ? module.defaultEnabled !== false : false;
    }

    function setModuleEnabled(moduleId, enabled) {
      settings.modules[moduleId] = !!enabled;
      saveSettings();
      Cudloun.log.info("module", enabled ? "enabled" : "disabled", moduleId);
      if (enabled) startModule(moduleId);
      else stopModule(moduleId);
    }

    function makeLogger() {
      function write(level, area, args) {
        const entry = {
          time: new Date().toISOString(),
          level,
          area: area || "core",
          args: Array.from(args),
        };

        logs.push(entry);
        if (logs.length > MAX_LOGS) logs.shift();
        emit(entry);
      }

      function shouldEmit(level) {
        const current = String(getSetting("logLevel", "info")).toLowerCase();
        return (LEVELS[level] || 0) <= (LEVELS[current] || LEVELS.info);
      }

      function emit(entry) {
        if (!shouldEmit(entry.level)) return;

        const prefix = `[cudloun:${entry.area}]`;
        const method = entry.level === "error" ? "error" : entry.level === "warn" ? "warn" : "log";
        const style = {
          error: "color:#ff5c5c;background:#111;padding:2px 6px;border-radius:3px;font-weight:700;",
          warn: "color:#ffb020;background:#111;padding:2px 6px;border-radius:3px;font-weight:700;",
          info: "color:#63e6be;background:#111;padding:2px 6px;border-radius:3px;",
          debug: "color:#74c0fc;background:#111;padding:2px 6px;border-radius:3px;",
          trace: "color:#d0bfff;background:#111;padding:2px 6px;border-radius:3px;",
        }[entry.level] || "";

        console[method](`%c${prefix}`, style, ...entry.args);
      }

      return {
        entries: logs,
        level: () => getSetting("logLevel", "info"),
        setLevel: (level) => setSetting("logLevel", LEVELS[level] !== undefined ? level : "info"),
        trace(area, ...args) { write("trace", area, args); },
        debug(area, ...args) { write("debug", area, args); },
        info(area, ...args) { write("info", area, args); },
        warn(area, ...args) { write("warn", area, args); },
        error(area, ...args) { write("error", area, args); },
      };
    }

    function areaLogger(area) {
      return {
        trace: (...args) => Cudloun.log.trace(area, ...args),
        debug: (...args) => Cudloun.log.debug(area, ...args),
        info: (...args) => Cudloun.log.info(area, ...args),
        warn: (...args) => Cudloun.log.warn(area, ...args),
        error: (...args) => Cudloun.log.error(area, ...args),
      };
    }
  })();

})();
