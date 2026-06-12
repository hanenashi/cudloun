// Cudloun bundled runtime. Generated from source modules; edit source files, not this file.
(function () {
  "use strict";

  const VERSION = "0.4.48";
  const RAW_MAIN_URL = "https://raw.githubusercontent.com/hanenashi/cudloun/main/";
  const CACHE_BUST = String(Date.now());
  const embeddedText = new Map();
  const embeddedScripts = new Map();

  embeddedText.set("modules.json", "{\n  \"version\": \"0.4.48\",\n  \"system\": [\n    {\n      \"id\": \"sys-logger\",\n      \"file\": \"modules/sys-logger.js\",\n      \"required\": true\n    },\n    {\n      \"id\": \"sys-babeguts\",\n      \"file\": \"modules/sys-babeguts.js\",\n      \"required\": true\n    },\n    {\n      \"id\": \"sys-kapyguts\",\n      \"file\": \"modules/sys-kapyguts.js\",\n      \"required\": true\n    },\n    {\n      \"id\": \"sys-feedback\",\n      \"file\": \"modules/sys-feedback.js\",\n      \"required\": true\n    },\n    {\n      \"id\": \"sys-menu\",\n      \"file\": \"modules/sys-menu.js\",\n      \"required\": true\n    }\n  ],\n  \"modules\": [\n    {\n      \"id\": \"settoun\",\n      \"file\": \"modules/settoun.js\",\n      \"defaultEnabled\": true\n    },\n    {\n      \"id\": \"post-tweaks\",\n      \"file\": \"modules/post-tweaks.js\",\n      \"defaultEnabled\": false\n    },\n    {\n      \"id\": \"theme-tweaks\",\n      \"file\": \"modules/theme-tweaks.js\",\n      \"defaultEnabled\": false\n    },\n    {\n      \"id\": \"performance-probe\",\n      \"file\": \"modules/performance-probe.js\",\n      \"defaultEnabled\": false\n    },\n    {\n      \"id\": \"nav-tweaks\",\n      \"file\": \"modules/nav-tweaks.js\",\n      \"defaultEnabled\": false\n    },\n    {\n      \"id\": \"containers\",\n      \"file\": \"modules/containers.js\",\n      \"defaultEnabled\": true\n    }\n  ]\n}");
  embeddedText.set("containers.json", "{\n  \"version\": \"0.3.3\",\n  \"containers\": [\n    {\n      \"id\": \"favorite-pill-colors\",\n      \"name\": \"Favorite Pill Colors\",\n      \"description\": \"Colors unread counters on Babeta favorites by unread count.\",\n      \"file\": \"containers/favorite-pill-colors.container.js\",\n      \"sha256\": \"6205cab4f9b8bbcefef1d15f69a69464f81882dea63392f244369757f36cdda0\",\n      \"match\": [\n        \"/favorites\"\n      ]\n    },\n    {\n      \"id\": \"noooovejsi\",\n      \"name\": \"Noooovejsi\",\n      \"description\": \"Replaces Babeta compact board pagination counts with Noooovejsi distance-to-newest labels.\",\n      \"file\": \"containers/noooovejsi.container.js\",\n      \"sha256\": \"7fa8949256ccf9696fcd19d8fee2ef5beac612745b8088532b3a09c3dcbda4c7\",\n      \"match\": [\n        \"/boards/*\"\n      ]\n    }\n  ]\n}");

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

  embeddedText.set("modules/sys-babeguts.js", "// Cudloun Babeta DOM dictionary helpers.\n(function () {\n  \"use strict\";\n\n  const root = window.Cudloun;\n  const VERSION = \"0.1.3\";\n  const SELECTORS = {\n    boardPost: \".content-item.board-post\",\n    contentItem: \".content-item\",\n    avatar: \".avatar-container\",\n    replyButton: \".reply-button\",\n    postMenuButton: 'button[aria-label=\"menu\"]',\n    menuSurface: '[role=\"menu\"], [role=\"dialog\"], [role=\"presentation\"]',\n    menuItem: 'li[role=\"menuitem\"]',\n  };\n  const TEXT = {\n    postMenu: [\"Označit jako nejstarší nový\", \"Smazat příspěvek\"],\n    boardMenu: [\"Označit celý klub jako přečtený\", \"Označit stránku jako nejstarší nepřečtenou\"],\n    avatarMenu: [\"Barevné schéma\", \"Nastavení\", \"Odhlásit se\"],\n  };\n\n  const babeguts = {\n    version: VERSION,\n    selectors: SELECTORS,\n    text: TEXT,\n    route,\n    currentUser,\n    currentUserCandidates,\n    isBoardPage,\n    isVisible,\n    visibleElements,\n    allPosts,\n    visiblePosts,\n    postParts,\n    visibleMenus,\n    visiblePostMenus,\n    visibleBoardMenus,\n    visibleAvatarMenus,\n    smallestVisibleMenu,\n    inspect,\n  };\n\n  root.babeguts = babeguts;\n  root.log.info(\"babeguts\", \"ready\", VERSION);\n\n  function route() {\n    const path = window.location.pathname;\n    const boardMatch = path.match(/^\\/boards\\/([^/?#]+)/);\n    return {\n      href: window.location.href,\n      path,\n      search: window.location.search,\n      hash: window.location.hash,\n      type: boardMatch ? \"board\" : path === \"/favorites\" ? \"favorites\" : path === \"/\" ? \"home\" : \"unknown\",\n      boardId: boardMatch ? decodeURIComponent(boardMatch[1]) : \"\",\n    };\n  }\n\n  function isBoardPage() {\n    return route().type === \"board\";\n  }\n\n  function currentUser() {\n    const candidates = currentUserCandidates();\n    return candidates.find((candidate) => candidate.confidence === \"high\")?.name ||\n      candidates.find((candidate) => candidate.name)?.name ||\n      \"\";\n  }\n\n  function currentUserCandidates() {\n    const candidates = [];\n\n    visibleElements('button[aria-label=\"Uživatelské menu\"]').forEach((button) => {\n      addUserCandidate(candidates, button.querySelector(\"img[alt]\")?.getAttribute(\"alt\"), \"desktop-avatar-alt\", \"high\", button);\n      addUserCandidate(candidates, button.textContent, \"desktop-avatar-text\", \"medium\", button);\n    });\n\n    visibleElements(\".MuiBottomNavigationAction-root\").forEach((button) => {\n      const hasAvatar = !!button.querySelector(\".MuiAvatar-root, img[alt]\");\n      if (!hasAvatar) return;\n      addUserCandidate(candidates, button.querySelector(\"img[alt]\")?.getAttribute(\"alt\"), \"mobile-bottom-avatar-alt\", \"high\", button);\n      addUserCandidate(candidates, button.textContent, \"mobile-bottom-text\", \"high\", button);\n    });\n\n    visibleElements(\"header img[alt], nav img[alt]\").forEach((img) => {\n      addUserCandidate(candidates, img.getAttribute(\"alt\"), \"header-nav-img-alt\", \"medium\", img);\n    });\n\n    return candidates;\n  }\n\n  function allPosts(scope = document) {\n    return Array.from(scope.querySelectorAll(SELECTORS.boardPost));\n  }\n\n  function visiblePosts(scope = document) {\n    return allPosts(scope).filter(isVisible);\n  }\n\n  function postParts(post) {\n    if (!post) return null;\n\n    const avatar = post.querySelector(SELECTORS.avatar);\n    const row = avatar?.parentElement || null;\n    const content = avatar?.nextElementSibling || null;\n    const header = content?.firstElementChild || null;\n    const body = findPostBody(content, header);\n    const actions = findPostActions(post);\n    const reply = post.querySelector(\"[data-cudloun-post-tweaks-reply]\") || actions?.querySelector(SELECTORS.replyButton) || null;\n    const replyMeta = post.querySelector(\"[data-cudloun-post-tweaks-reply-meta]\") || findReplyMeta(post);\n    const dateWrap = findDateWrap(header);\n    const postMenuButton = findPostMenuButton(header);\n\n    return {\n      post,\n      row,\n      avatar,\n      content,\n      header,\n      body,\n      actions,\n      reply,\n      replyMeta,\n      dateWrap,\n      postMenuButton,\n    };\n  }\n\n  function visibleMenus(kind = \"\") {\n    const menus = Array.from(document.querySelectorAll(SELECTORS.menuSurface))\n      .filter(isVisible)\n      .map((node) => menuInfo(node))\n      .filter((info) => info.itemCount > 0 || info.text);\n\n    if (!kind) return menus;\n    return menus.filter((info) => info.kind === kind);\n  }\n\n  function visiblePostMenus() {\n    return visibleMenus(\"post\");\n  }\n\n  function visibleBoardMenus() {\n    return visibleMenus(\"board\");\n  }\n\n  function visibleAvatarMenus() {\n    return visibleMenus(\"avatar\");\n  }\n\n  function smallestVisibleMenu(kind = \"\") {\n    return visibleMenus(kind)\n      .sort((a, b) => a.rect.width * a.rect.height - b.rect.width * b.rect.height)[0]?.node || null;\n  }\n\n  function inspect() {\n    const posts = visiblePosts();\n    const menus = visibleMenus();\n    return {\n      version: VERSION,\n      route: route(),\n      currentUser: currentUser(),\n      currentUserCandidates: currentUserCandidates().map((candidate) => ({\n        name: candidate.name,\n        source: candidate.source,\n        confidence: candidate.confidence,\n        rect: candidate.rect,\n      })),\n      viewport: { width: window.innerWidth, height: window.innerHeight },\n      counts: {\n        contentItems: document.querySelectorAll(SELECTORS.contentItem).length,\n        boardPosts: document.querySelectorAll(SELECTORS.boardPost).length,\n        visibleBoardPosts: posts.length,\n        avatars: document.querySelectorAll(SELECTORS.avatar).length,\n        replies: document.querySelectorAll(SELECTORS.replyButton).length,\n        postMenuButtons: document.querySelectorAll(`${SELECTORS.boardPost} ${SELECTORS.postMenuButton}`).length,\n        visibleMenus: menus.length,\n      },\n      posts: posts.slice(0, 12).map((post, index) => summarizePost(post, index)),\n      menus: menus.map((info) => ({\n        kind: info.kind,\n        tag: info.node.tagName,\n        role: info.node.getAttribute(\"role\") || \"\",\n        className: String(info.node.className || \"\"),\n        rect: info.rect,\n        itemCount: info.itemCount,\n        text: info.text.slice(0, 260),\n      })),\n    };\n  }\n\n  function visibleElements(selector, scope = document) {\n    return Array.from(scope.querySelectorAll(selector)).filter(isVisible);\n  }\n\n  function addUserCandidate(candidates, value, source, confidence, node) {\n    const name = normalizeUserName(value);\n    if (!name) return;\n    if (candidates.some((candidate) => candidate.name === name && candidate.source === source)) return;\n    candidates.push({\n      name,\n      source,\n      confidence,\n      node,\n      rect: node ? rectInfo(node) : null,\n    });\n  }\n\n  function normalizeUserName(value) {\n    const text = String(value || \"\").replace(/\\s+/g, \" \").trim();\n    if (!text || text.length > 40) return \"\";\n    if (/^(menu|close|search|hledat v klubu|nastaveni|nastavení|barevne schema|barevné schéma|odhlasit|odhlásit|domů|vzkazník|oblíbené)$/i.test(text)) {\n      return \"\";\n    }\n    return text;\n  }\n\n  function isVisible(node) {\n    if (!(node instanceof Element)) return false;\n    const rect = node.getBoundingClientRect();\n    if (rect.width <= 0 || rect.height <= 0) return false;\n    if (rect.bottom <= 0 || rect.top >= window.innerHeight || rect.right <= 0 || rect.left >= window.innerWidth) return false;\n\n    const style = window.getComputedStyle(node);\n    if (style.display === \"none\" || style.visibility === \"hidden\" || style.opacity === \"0\") return false;\n\n    const modal = node.closest(\".MuiModal-root\");\n    if (modal && String(modal.className || \"\").includes(\"MuiModal-hidden\")) return false;\n    if (String(node.className || \"\").includes(\"MuiModal-hidden\")) return false;\n\n    return true;\n  }\n\n  function findPostBody(content, header) {\n    if (!content) return null;\n    const candidates = Array.from(content.children).filter((child) => {\n      return child !== header && child.textContent.trim() && !isReplyMetaNode(child) && !isHiddenBodyHelper(child);\n    });\n    return candidates[candidates.length - 1] || null;\n  }\n\n  function findPostActions(post) {\n    return (\n      post.querySelector(\"[data-cudloun-post-tweaks-actions]\") ||\n      Array.from(post.children).find((child) => child.querySelector(SELECTORS.replyButton)) ||\n      null\n    );\n  }\n\n  function findReplyMeta(actions) {\n    if (!actions) return null;\n    return Array.from(actions.querySelectorAll(\"span\")).find((node) => {\n      const text = node.textContent.trim();\n      return isReplyMetaText(text);\n    }) || null;\n  }\n\n  function isReplyMetaNode(node) {\n    return isReplyMetaText(node.textContent.trim());\n  }\n\n  function isReplyMetaText(text) {\n    return /^Re:\\s*/.test(text) || /^Reakce na\\s+/i.test(text);\n  }\n\n  function isHiddenBodyHelper(node) {\n    const text = normalizeText(node.textContent || \"\");\n    if (/^Načítám…?Přejít na příspěvek$/i.test(text)) return true;\n\n    const rect = node.getBoundingClientRect();\n    const style = window.getComputedStyle(node);\n    return style.display === \"none\" || style.visibility === \"hidden\" || rect.height <= 0 || rect.width <= 0;\n  }\n\n  function findDateWrap(header) {\n    if (!header) return null;\n    return Array.from(header.children).find((child) => /\\d{1,2}\\.\\d{1,2}\\.\\d{4}/.test(child.textContent.trim())) || null;\n  }\n\n  function findPostMenuButton(header) {\n    if (!header) return null;\n    return Array.from(header.querySelectorAll(SELECTORS.postMenuButton))\n      .find((button) => !button.closest(\"[data-cudloun-post-tweaks-reply-menu]\")) || null;\n  }\n\n  function menuInfo(node) {\n    const text = normalizeText(node.textContent || \"\");\n    return {\n      node,\n      kind: menuKind(text),\n      text,\n      rect: rectInfo(node),\n      itemCount: node.querySelectorAll(SELECTORS.menuItem).length,\n    };\n  }\n\n  function menuKind(text) {\n    if (TEXT.postMenu.some((needle) => text.includes(needle))) return \"post\";\n    if (TEXT.boardMenu.some((needle) => text.includes(needle))) return \"board\";\n    if (TEXT.avatarMenu.some((needle) => text.includes(needle))) return \"avatar\";\n    return \"unknown\";\n  }\n\n  function summarizePost(post, index) {\n    const parts = postParts(post);\n    return {\n      index,\n      rect: rectInfo(post),\n      text: normalizeText(post.textContent || \"\").slice(0, 220),\n      hasAvatar: !!parts?.avatar,\n      hasHeader: !!parts?.header,\n      hasBody: !!parts?.body,\n      hasActions: !!parts?.actions,\n      hasReply: !!parts?.reply,\n      hasReplyMeta: !!parts?.replyMeta,\n      hasDateWrap: !!parts?.dateWrap,\n      hasPostMenuButton: !!parts?.postMenuButton,\n    };\n  }\n\n  function rectInfo(node) {\n    const rect = node.getBoundingClientRect();\n    return {\n      x: Math.round(rect.x),\n      y: Math.round(rect.y),\n      width: Math.round(rect.width),\n      height: Math.round(rect.height),\n    };\n  }\n\n  function normalizeText(text) {\n    return String(text || \"\").replace(/\\s+/g, \" \").trim();\n  }\n})();\n");
  embeddedScripts.set("modules/sys-babeguts.js", function () {
    // Cudloun Babeta DOM dictionary helpers.
    (function () {
      "use strict";

      const root = window.Cudloun;
      const VERSION = "0.1.3";
      const SELECTORS = {
        boardPost: ".content-item.board-post",
        contentItem: ".content-item",
        avatar: ".avatar-container",
        replyButton: ".reply-button",
        postMenuButton: 'button[aria-label="menu"]',
        menuSurface: '[role="menu"], [role="dialog"], [role="presentation"]',
        menuItem: 'li[role="menuitem"]',
      };
      const TEXT = {
        postMenu: ["Označit jako nejstarší nový", "Smazat příspěvek"],
        boardMenu: ["Označit celý klub jako přečtený", "Označit stránku jako nejstarší nepřečtenou"],
        avatarMenu: ["Barevné schéma", "Nastavení", "Odhlásit se"],
      };

      const babeguts = {
        version: VERSION,
        selectors: SELECTORS,
        text: TEXT,
        route,
        currentUser,
        currentUserCandidates,
        isBoardPage,
        isVisible,
        visibleElements,
        allPosts,
        visiblePosts,
        postParts,
        visibleMenus,
        visiblePostMenus,
        visibleBoardMenus,
        visibleAvatarMenus,
        smallestVisibleMenu,
        inspect,
      };

      root.babeguts = babeguts;
      root.log.info("babeguts", "ready", VERSION);

      function route() {
        const path = window.location.pathname;
        const boardMatch = path.match(/^\/boards\/([^/?#]+)/);
        return {
          href: window.location.href,
          path,
          search: window.location.search,
          hash: window.location.hash,
          type: boardMatch ? "board" : path === "/favorites" ? "favorites" : path === "/" ? "home" : "unknown",
          boardId: boardMatch ? decodeURIComponent(boardMatch[1]) : "",
        };
      }

      function isBoardPage() {
        return route().type === "board";
      }

      function currentUser() {
        const candidates = currentUserCandidates();
        return candidates.find((candidate) => candidate.confidence === "high")?.name ||
          candidates.find((candidate) => candidate.name)?.name ||
          "";
      }

      function currentUserCandidates() {
        const candidates = [];

        visibleElements('button[aria-label="Uživatelské menu"]').forEach((button) => {
          addUserCandidate(candidates, button.querySelector("img[alt]")?.getAttribute("alt"), "desktop-avatar-alt", "high", button);
          addUserCandidate(candidates, button.textContent, "desktop-avatar-text", "medium", button);
        });

        visibleElements(".MuiBottomNavigationAction-root").forEach((button) => {
          const hasAvatar = !!button.querySelector(".MuiAvatar-root, img[alt]");
          if (!hasAvatar) return;
          addUserCandidate(candidates, button.querySelector("img[alt]")?.getAttribute("alt"), "mobile-bottom-avatar-alt", "high", button);
          addUserCandidate(candidates, button.textContent, "mobile-bottom-text", "high", button);
        });

        visibleElements("header img[alt], nav img[alt]").forEach((img) => {
          addUserCandidate(candidates, img.getAttribute("alt"), "header-nav-img-alt", "medium", img);
        });

        return candidates;
      }

      function allPosts(scope = document) {
        return Array.from(scope.querySelectorAll(SELECTORS.boardPost));
      }

      function visiblePosts(scope = document) {
        return allPosts(scope).filter(isVisible);
      }

      function postParts(post) {
        if (!post) return null;

        const avatar = post.querySelector(SELECTORS.avatar);
        const row = avatar?.parentElement || null;
        const content = avatar?.nextElementSibling || null;
        const header = content?.firstElementChild || null;
        const body = findPostBody(content, header);
        const actions = findPostActions(post);
        const reply = post.querySelector("[data-cudloun-post-tweaks-reply]") || actions?.querySelector(SELECTORS.replyButton) || null;
        const replyMeta = post.querySelector("[data-cudloun-post-tweaks-reply-meta]") || findReplyMeta(post);
        const dateWrap = findDateWrap(header);
        const postMenuButton = findPostMenuButton(header);

        return {
          post,
          row,
          avatar,
          content,
          header,
          body,
          actions,
          reply,
          replyMeta,
          dateWrap,
          postMenuButton,
        };
      }

      function visibleMenus(kind = "") {
        const menus = Array.from(document.querySelectorAll(SELECTORS.menuSurface))
          .filter(isVisible)
          .map((node) => menuInfo(node))
          .filter((info) => info.itemCount > 0 || info.text);

        if (!kind) return menus;
        return menus.filter((info) => info.kind === kind);
      }

      function visiblePostMenus() {
        return visibleMenus("post");
      }

      function visibleBoardMenus() {
        return visibleMenus("board");
      }

      function visibleAvatarMenus() {
        return visibleMenus("avatar");
      }

      function smallestVisibleMenu(kind = "") {
        return visibleMenus(kind)
          .sort((a, b) => a.rect.width * a.rect.height - b.rect.width * b.rect.height)[0]?.node || null;
      }

      function inspect() {
        const posts = visiblePosts();
        const menus = visibleMenus();
        return {
          version: VERSION,
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
            contentItems: document.querySelectorAll(SELECTORS.contentItem).length,
            boardPosts: document.querySelectorAll(SELECTORS.boardPost).length,
            visibleBoardPosts: posts.length,
            avatars: document.querySelectorAll(SELECTORS.avatar).length,
            replies: document.querySelectorAll(SELECTORS.replyButton).length,
            postMenuButtons: document.querySelectorAll(`${SELECTORS.boardPost} ${SELECTORS.postMenuButton}`).length,
            visibleMenus: menus.length,
          },
          posts: posts.slice(0, 12).map((post, index) => summarizePost(post, index)),
          menus: menus.map((info) => ({
            kind: info.kind,
            tag: info.node.tagName,
            role: info.node.getAttribute("role") || "",
            className: String(info.node.className || ""),
            rect: info.rect,
            itemCount: info.itemCount,
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
        const text = String(value || "").replace(/\s+/g, " ").trim();
        if (!text || text.length > 40) return "";
        if (/^(menu|close|search|hledat v klubu|nastaveni|nastavení|barevne schema|barevné schéma|odhlasit|odhlásit|domů|vzkazník|oblíbené)$/i.test(text)) {
          return "";
        }
        return text;
      }

      function isVisible(node) {
        if (!(node instanceof Element)) return false;
        const rect = node.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return false;
        if (rect.bottom <= 0 || rect.top >= window.innerHeight || rect.right <= 0 || rect.left >= window.innerWidth) return false;

        const style = window.getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;

        const modal = node.closest(".MuiModal-root");
        if (modal && String(modal.className || "").includes("MuiModal-hidden")) return false;
        if (String(node.className || "").includes("MuiModal-hidden")) return false;

        return true;
      }

      function findPostBody(content, header) {
        if (!content) return null;
        const candidates = Array.from(content.children).filter((child) => {
          return child !== header && child.textContent.trim() && !isReplyMetaNode(child) && !isHiddenBodyHelper(child);
        });
        return candidates[candidates.length - 1] || null;
      }

      function findPostActions(post) {
        return (
          post.querySelector("[data-cudloun-post-tweaks-actions]") ||
          Array.from(post.children).find((child) => child.querySelector(SELECTORS.replyButton)) ||
          null
        );
      }

      function findReplyMeta(actions) {
        if (!actions) return null;
        return Array.from(actions.querySelectorAll("span")).find((node) => {
          const text = node.textContent.trim();
          return isReplyMetaText(text);
        }) || null;
      }

      function isReplyMetaNode(node) {
        return isReplyMetaText(node.textContent.trim());
      }

      function isReplyMetaText(text) {
        return /^Re:\s*/.test(text) || /^Reakce na\s+/i.test(text);
      }

      function isHiddenBodyHelper(node) {
        const text = normalizeText(node.textContent || "");
        if (/^Načítám…?Přejít na příspěvek$/i.test(text)) return true;

        const rect = node.getBoundingClientRect();
        const style = window.getComputedStyle(node);
        return style.display === "none" || style.visibility === "hidden" || rect.height <= 0 || rect.width <= 0;
      }

      function findDateWrap(header) {
        if (!header) return null;
        return Array.from(header.children).find((child) => /\d{1,2}\.\d{1,2}\.\d{4}/.test(child.textContent.trim())) || null;
      }

      function findPostMenuButton(header) {
        if (!header) return null;
        return Array.from(header.querySelectorAll(SELECTORS.postMenuButton))
          .find((button) => !button.closest("[data-cudloun-post-tweaks-reply-menu]")) || null;
      }

      function menuInfo(node) {
        const text = normalizeText(node.textContent || "");
        return {
          node,
          kind: menuKind(text),
          text,
          rect: rectInfo(node),
          itemCount: node.querySelectorAll(SELECTORS.menuItem).length,
        };
      }

      function menuKind(text) {
        if (TEXT.postMenu.some((needle) => text.includes(needle))) return "post";
        if (TEXT.boardMenu.some((needle) => text.includes(needle))) return "board";
        if (TEXT.avatarMenu.some((needle) => text.includes(needle))) return "avatar";
        return "unknown";
      }

      function summarizePost(post, index) {
        const parts = postParts(post);
        return {
          index,
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
    })();

  });

  embeddedText.set("modules/sys-kapyguts.js", "// Cudloun Kapybara DOM dictionary helpers.\n(function () {\n  \"use strict\";\n\n  const root = window.Cudloun;\n  const VERSION = \"0.1.0\";\n  const SELECTORS = {\n    boardPost: \"article.post\",\n    avatarColumn: \".avatar-col\",\n    avatar: \".avatar\",\n    avatarImage: \".avatar img\",\n    content: \".post-main\",\n    header: \".post-header\",\n    author: \".author\",\n    meta: \".meta\",\n    dateButton: \"button.date\",\n    replyMeta: \".reply-ref\",\n    body: \".body\",\n    markdown: \".markdown\",\n    actions: \".actions\",\n    replyButton: \".reply-action\",\n    postMenuButton: \".post-menu-button[aria-label='menu']\",\n    favoriteBoardRow: \".favorites-page a[href^='/boards/'], .favorites-page a[href*='/boards/']\",\n    messageItem: \".conversation-item\",\n    messageCard: \".message-card\",\n  };\n  const TEXT = {\n    postMenu: [\"Smazat\", \"Upravit\", \"Označit\"],\n    avatarMenu: [\"Nastavení\", \"Odhlásit\", \"Barevné schéma\"],\n  };\n\n  const kapyguts = {\n    version: VERSION,\n    selectors: SELECTORS,\n    text: TEXT,\n    isKapybara,\n    route,\n    currentUser,\n    currentUserCandidates,\n    isBoardPage,\n    isFavoritesPage,\n    isMessagesPage,\n    isVisible,\n    visibleElements,\n    allPosts,\n    visiblePosts,\n    postParts,\n    visibleMenus,\n    visiblePostMenus,\n    inspect,\n  };\n\n  root.kapyguts = kapyguts;\n  root.log.info(\"kapyguts\", \"ready\", VERSION);\n\n  function isKapybara() {\n    return window.location.hostname === \"kapybara.okoun.cz\";\n  }\n\n  function route() {\n    const path = window.location.pathname;\n    const boardMatch = path.match(/^\\/boards\\/([^/?#]+)/);\n    return {\n      href: window.location.href,\n      host: window.location.hostname,\n      path,\n      search: window.location.search,\n      hash: window.location.hash,\n      type: boardMatch ? \"board\" : routeType(path),\n      boardId: boardMatch ? decodeURIComponent(boardMatch[1]) : \"\",\n    };\n  }\n\n  function routeType(path) {\n    if (path === \"/\") return \"home\";\n    if (path.startsWith(\"/fav/\")) return \"favorites\";\n    if (path.startsWith(\"/messages\")) return \"messages\";\n    if (path.startsWith(\"/topics\")) return \"topics\";\n    if (path.startsWith(\"/active-users\")) return \"active-users\";\n    return \"unknown\";\n  }\n\n  function isBoardPage() {\n    return route().type === \"board\";\n  }\n\n  function isFavoritesPage() {\n    return route().type === \"favorites\";\n  }\n\n  function isMessagesPage() {\n    return route().type === \"messages\";\n  }\n\n  function currentUser() {\n    const candidates = currentUserCandidates();\n    return candidates.find((candidate) => candidate.confidence === \"high\")?.name ||\n      candidates.find((candidate) => candidate.name)?.name ||\n      \"\";\n  }\n\n  function currentUserCandidates() {\n    const candidates = [];\n\n    visibleElements(\".avatar-button\").forEach((button) => {\n      addUserCandidate(candidates, button.textContent, \"avatar-button-text\", \"high\", button);\n      addUserCandidate(candidates, button.querySelector(\"img[alt]\")?.getAttribute(\"alt\"), \"avatar-button-img-alt\", \"high\", button);\n    });\n\n    visibleElements(\".user-item, .avatar-shell\").forEach((node) => {\n      addUserCandidate(candidates, node.textContent, \"mobile-user-text\", \"high\", node);\n      addUserCandidate(candidates, node.querySelector(\"img[alt]\")?.getAttribute(\"alt\"), \"mobile-user-img-alt\", \"medium\", node);\n    });\n\n    visibleElements(\"header img[alt], nav img[alt]\").forEach((img) => {\n      addUserCandidate(candidates, img.getAttribute(\"alt\"), \"header-nav-img-alt\", \"low\", img);\n    });\n\n    return candidates;\n  }\n\n  function allPosts(scope = document) {\n    return Array.from(scope.querySelectorAll(SELECTORS.boardPost));\n  }\n\n  function visiblePosts(scope = document) {\n    return allPosts(scope).filter(isVisible);\n  }\n\n  function postParts(post) {\n    if (!post) return null;\n\n    const avatarColumn = post.querySelector(SELECTORS.avatarColumn);\n    const avatar = post.querySelector(SELECTORS.avatar);\n    const avatarImage = post.querySelector(SELECTORS.avatarImage);\n    const content = post.querySelector(SELECTORS.content);\n    const header = post.querySelector(SELECTORS.header);\n    const author = post.querySelector(SELECTORS.author);\n    const meta = post.querySelector(SELECTORS.meta);\n    const dateButton = post.querySelector(SELECTORS.dateButton);\n    const replyMeta = post.querySelector(SELECTORS.replyMeta);\n    const body = post.querySelector(SELECTORS.body);\n    const markdown = post.querySelector(SELECTORS.markdown);\n    const actions = post.querySelector(SELECTORS.actions);\n    const reply = post.querySelector(SELECTORS.replyButton);\n    const postMenuButton = post.querySelector(SELECTORS.postMenuButton);\n\n    return {\n      post,\n      row: post,\n      avatarColumn,\n      avatar,\n      avatarImage,\n      content,\n      header,\n      author,\n      meta,\n      dateWrap: dateButton,\n      dateButton,\n      replyMeta,\n      body,\n      markdown,\n      actions,\n      reply,\n      postMenuButton,\n    };\n  }\n\n  function visibleMenus(kind = \"\") {\n    const menus = Array.from(document.querySelectorAll(\"[role='menu'], [role='dialog'], .menu, .bottom-sheet\"))\n      .filter(isVisible)\n      .map((node) => menuInfo(node))\n      .filter((info) => info.text);\n\n    if (!kind) return menus;\n    return menus.filter((info) => info.kind === kind);\n  }\n\n  function visiblePostMenus() {\n    return visibleMenus(\"post\");\n  }\n\n  function inspect() {\n    const posts = visiblePosts();\n    const menus = visibleMenus();\n    return {\n      version: VERSION,\n      isKapybara: isKapybara(),\n      route: route(),\n      currentUser: currentUser(),\n      currentUserCandidates: currentUserCandidates().map((candidate) => ({\n        name: candidate.name,\n        source: candidate.source,\n        confidence: candidate.confidence,\n        rect: candidate.rect,\n      })),\n      viewport: { width: window.innerWidth, height: window.innerHeight },\n      counts: {\n        boardPosts: document.querySelectorAll(SELECTORS.boardPost).length,\n        visibleBoardPosts: posts.length,\n        avatars: document.querySelectorAll(SELECTORS.avatar).length,\n        replies: document.querySelectorAll(SELECTORS.replyButton).length,\n        postMenuButtons: document.querySelectorAll(SELECTORS.postMenuButton).length,\n        favoriteRows: document.querySelectorAll(SELECTORS.favoriteBoardRow).length,\n        messageItems: document.querySelectorAll(SELECTORS.messageItem).length,\n        messageCards: document.querySelectorAll(SELECTORS.messageCard).length,\n        visibleMenus: menus.length,\n      },\n      posts: posts.slice(0, 12).map((post, index) => summarizePost(post, index)),\n      menus: menus.map((info) => ({\n        kind: info.kind,\n        tag: info.node.tagName,\n        role: info.node.getAttribute(\"role\") || \"\",\n        className: String(info.node.className || \"\"),\n        rect: info.rect,\n        text: info.text.slice(0, 260),\n      })),\n    };\n  }\n\n  function visibleElements(selector, scope = document) {\n    return Array.from(scope.querySelectorAll(selector)).filter(isVisible);\n  }\n\n  function addUserCandidate(candidates, value, source, confidence, node) {\n    const name = normalizeUserName(value);\n    if (!name) return;\n    if (candidates.some((candidate) => candidate.name === name && candidate.source === source)) return;\n    candidates.push({\n      name,\n      source,\n      confidence,\n      node,\n      rect: node ? rectInfo(node) : null,\n    });\n  }\n\n  function normalizeUserName(value) {\n    const text = normalizeText(value);\n    if (!text || text.length > 40) return \"\";\n    if (/^(menu|domů|vzkazník|oblíbené|účet|nastavení|odhlásit|barevné schéma)$/i.test(text)) return \"\";\n    return text;\n  }\n\n  function isVisible(node) {\n    if (!(node instanceof Element)) return false;\n    const rect = node.getBoundingClientRect();\n    if (rect.width <= 0 || rect.height <= 0) return false;\n    if (rect.bottom <= 0 || rect.top >= window.innerHeight || rect.right <= 0 || rect.left >= window.innerWidth) return false;\n\n    const style = window.getComputedStyle(node);\n    return style.display !== \"none\" && style.visibility !== \"hidden\" && style.opacity !== \"0\";\n  }\n\n  function menuInfo(node) {\n    const text = normalizeText(node.textContent || \"\");\n    return {\n      node,\n      kind: menuKind(text),\n      text,\n      rect: rectInfo(node),\n    };\n  }\n\n  function menuKind(text) {\n    if (TEXT.postMenu.some((needle) => text.includes(needle))) return \"post\";\n    if (TEXT.avatarMenu.some((needle) => text.includes(needle))) return \"avatar\";\n    return \"unknown\";\n  }\n\n  function summarizePost(post, index) {\n    const parts = postParts(post);\n    return {\n      index,\n      id: post.id || \"\",\n      postId: post.getAttribute(\"data-post-id\") || \"\",\n      threadId: post.getAttribute(\"data-thread-id\") || \"\",\n      rect: rectInfo(post),\n      text: normalizeText(post.textContent || \"\").slice(0, 220),\n      hasAvatar: !!parts?.avatar,\n      hasHeader: !!parts?.header,\n      hasBody: !!parts?.body,\n      hasActions: !!parts?.actions,\n      hasReply: !!parts?.reply,\n      hasReplyMeta: !!parts?.replyMeta,\n      hasDateWrap: !!parts?.dateWrap,\n      hasPostMenuButton: !!parts?.postMenuButton,\n    };\n  }\n\n  function rectInfo(node) {\n    const rect = node.getBoundingClientRect();\n    return {\n      x: Math.round(rect.x),\n      y: Math.round(rect.y),\n      width: Math.round(rect.width),\n      height: Math.round(rect.height),\n    };\n  }\n\n  function normalizeText(text) {\n    return String(text || \"\").replace(/\\s+/g, \" \").trim();\n  }\n})();\n");
  embeddedScripts.set("modules/sys-kapyguts.js", function () {
    // Cudloun Kapybara DOM dictionary helpers.
    (function () {
      "use strict";

      const root = window.Cudloun;
      const VERSION = "0.1.0";
      const SELECTORS = {
        boardPost: "article.post",
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
        postMenuButton: ".post-menu-button[aria-label='menu']",
        favoriteBoardRow: ".favorites-page a[href^='/boards/'], .favorites-page a[href*='/boards/']",
        messageItem: ".conversation-item",
        messageCard: ".message-card",
      };
      const TEXT = {
        postMenu: ["Smazat", "Upravit", "Označit"],
        avatarMenu: ["Nastavení", "Odhlásit", "Barevné schéma"],
      };

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
        postParts,
        visibleMenus,
        visiblePostMenus,
        inspect,
      };

      root.kapyguts = kapyguts;
      root.log.info("kapyguts", "ready", VERSION);

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
        if (path.startsWith("/fav/")) return "favorites";
        if (path.startsWith("/messages")) return "messages";
        if (path.startsWith("/topics")) return "topics";
        if (path.startsWith("/active-users")) return "active-users";
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

      function inspect() {
        const posts = visiblePosts();
        const menus = visibleMenus();
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
            avatars: document.querySelectorAll(SELECTORS.avatar).length,
            replies: document.querySelectorAll(SELECTORS.replyButton).length,
            postMenuButtons: document.querySelectorAll(SELECTORS.postMenuButton).length,
            favoriteRows: document.querySelectorAll(SELECTORS.favoriteBoardRow).length,
            messageItems: document.querySelectorAll(SELECTORS.messageItem).length,
            messageCards: document.querySelectorAll(SELECTORS.messageCard).length,
            visibleMenus: menus.length,
          },
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
          kind: menuKind(text),
          text,
          rect: rectInfo(node),
        };
      }

      function menuKind(text) {
        if (TEXT.postMenu.some((needle) => text.includes(needle))) return "post";
        if (TEXT.avatarMenu.some((needle) => text.includes(needle))) return "avatar";
        return "unknown";
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
    })();

  });

  embeddedText.set("modules/sys-feedback.js", "// Cudloun Firestore-backed feedback threads.\n(function () {\n  \"use strict\";\n\n  const root = window.Cudloun;\n  const VERSION = \"0.3.1\";\n  const PROJECT_ID = \"murkypond-vault-fc61c\";\n  const REST_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;\n  const MAX_TEXT_LENGTH = 1200;\n  const PAGE_SIZE = 80;\n  const ADMIN_AUTHORS = new Set([\"blasnik\"]);\n\n  root.feedback = {\n    version: VERSION,\n    projectId: PROJECT_ID,\n    renderThread,\n    threadId,\n    detectAuthor,\n  };\n\n  root.log.info(\"feedback\", \"ready\", VERSION);\n\n  function renderThread(target) {\n    const normalized = normalizeTarget(target);\n    const wrap = document.createElement(\"section\");\n    wrap.className = \"cudloun-feedback\";\n    wrap.dataset.threadId = normalized.threadId;\n\n    const header = document.createElement(\"div\");\n    header.className = \"cudloun-feedback-head\";\n\n    const title = document.createElement(\"h3\");\n    title.textContent = \"Feedback\";\n\n    const refresh = document.createElement(\"button\");\n    refresh.type = \"button\";\n    refresh.className = \"cudloun-feedback-refresh\";\n    refresh.textContent = \"Refresh\";\n    refresh.addEventListener(\"click\", () => loadMessages(normalized, wrap));\n\n    header.appendChild(title);\n    header.appendChild(refresh);\n\n    const meta = document.createElement(\"p\");\n    meta.className = \"cudloun-feedback-meta\";\n    meta.textContent = `${normalized.kind}:${normalized.id}`;\n\n    const messages = document.createElement(\"div\");\n    messages.className = \"cudloun-feedback-messages\";\n    messages.textContent = \"Loading feedback...\";\n\n    const form = document.createElement(\"form\");\n    form.className = \"cudloun-feedback-form\";\n\n    const author = document.createElement(\"input\");\n    author.className = \"cudloun-feedback-author\";\n    author.type = \"text\";\n    author.name = \"author\";\n    author.maxLength = 40;\n    author.placeholder = \"Name\";\n    author.value = initialAuthor();\n\n    const textarea = document.createElement(\"textarea\");\n    textarea.name = \"text\";\n    textarea.maxLength = MAX_TEXT_LENGTH;\n    textarea.rows = 3;\n    textarea.placeholder = \"Idea, bug, or note...\";\n\n    const replyBanner = document.createElement(\"div\");\n    replyBanner.className = \"cudloun-feedback-reply-target\";\n    replyBanner.hidden = true;\n\n    const replyText = document.createElement(\"span\");\n\n    const cancelReply = document.createElement(\"button\");\n    cancelReply.type = \"button\";\n    cancelReply.textContent = \"Cancel\";\n    cancelReply.addEventListener(\"click\", () => clearReplyTarget(form, textarea));\n\n    replyBanner.appendChild(replyText);\n    replyBanner.appendChild(cancelReply);\n\n    const actions = document.createElement(\"div\");\n    actions.className = \"cudloun-feedback-actions\";\n\n    const status = document.createElement(\"span\");\n    status.className = \"cudloun-feedback-status\";\n\n    const submit = document.createElement(\"button\");\n    submit.type = \"submit\";\n    submit.className = \"cudloun-button\";\n    submit.textContent = \"Send\";\n\n    actions.appendChild(status);\n    actions.appendChild(submit);\n    form.appendChild(author);\n    form.appendChild(replyBanner);\n    form.appendChild(textarea);\n    form.appendChild(actions);\n\n    form.addEventListener(\"submit\", (event) => {\n      event.preventDefault();\n      sendMessage(normalized, author, textarea, submit, status, wrap, form);\n    });\n\n    wrap.appendChild(header);\n    wrap.appendChild(meta);\n    wrap.appendChild(messages);\n    wrap.appendChild(form);\n\n    loadMessages(normalized, wrap);\n    return wrap;\n  }\n\n  async function loadMessages(target, wrap) {\n    const box = wrap.querySelector(\".cudloun-feedback-messages\");\n    if (!box) return;\n\n    box.textContent = \"Loading feedback...\";\n\n    try {\n      const url = `${REST_BASE}/cudlounThreads/${encodeURIComponent(target.threadId)}/messages?orderBy=ts%20desc&pageSize=${PAGE_SIZE}`;\n      const data = await requestJson(url);\n      const messages = (data.documents || []).map(documentToMessage).filter(Boolean).reverse();\n      renderMessages(box, messages, wrap);\n    } catch (error) {\n      root.log.warn(\"feedback\", \"ordered load failed\", target.threadId, error);\n      try {\n        const fallbackUrl = `${REST_BASE}/cudlounThreads/${encodeURIComponent(target.threadId)}/messages?pageSize=${PAGE_SIZE}`;\n        const data = await requestJson(fallbackUrl);\n        const messages = (data.documents || []).map(documentToMessage).filter(Boolean)\n          .sort((a, b) => (a.ts || 0) - (b.ts || 0));\n        renderMessages(box, messages, wrap);\n      } catch (fallbackError) {\n        root.log.warn(\"feedback\", \"load failed\", target.threadId, fallbackError);\n        box.textContent = \"Feedback could not be loaded.\";\n      }\n    }\n  }\n\n  function renderMessages(box, messages, wrap) {\n    box.innerHTML = \"\";\n\n    if (!messages.length) {\n      const empty = document.createElement(\"div\");\n      empty.className = \"cudloun-feedback-empty\";\n      empty.textContent = \"No feedback yet.\";\n      box.appendChild(empty);\n      return;\n    }\n\n    const tree = messageTree(messages);\n    tree.roots.forEach((message) => {\n      box.appendChild(renderMessage(message, tree.children, wrap, 0, new Set()));\n    });\n\n    box.scrollTop = box.scrollHeight;\n  }\n\n  function renderMessage(message, children, wrap, depth, trail) {\n    if (trail.has(message.id)) return document.createTextNode(\"\");\n    const nextTrail = new Set(trail);\n    nextTrail.add(message.id);\n\n    const item = document.createElement(\"article\");\n    item.className = \"cudloun-feedback-message\";\n    item.dataset.messageId = message.id;\n    item.dataset.depth = String(Math.min(depth, 3));\n    if (message.parentId) item.dataset.reply = \"true\";\n\n    const head = document.createElement(\"div\");\n    head.className = \"cudloun-feedback-message-head\";\n\n    const author = document.createElement(\"strong\");\n    author.textContent = message.author || \"Unknown\";\n\n    const time = document.createElement(\"time\");\n    time.textContent = formatTime(message.ts);\n\n    head.appendChild(author);\n    head.appendChild(time);\n    item.appendChild(head);\n\n    if (message.parentId) {\n      const parent = document.createElement(\"div\");\n      parent.className = \"cudloun-feedback-parent\";\n      parent.textContent = message.parentAuthor ? `Reply to ${message.parentAuthor}` : \"Reply\";\n      item.appendChild(parent);\n    }\n\n    const text = document.createElement(\"div\");\n    text.className = \"cudloun-feedback-text\";\n    renderFeedbackText(text, message.text || \"\");\n    item.appendChild(text);\n\n    const actions = document.createElement(\"div\");\n    actions.className = \"cudloun-feedback-message-actions\";\n\n    const reply = document.createElement(\"button\");\n    reply.type = \"button\";\n    reply.textContent = \"Reply\";\n    reply.addEventListener(\"click\", () => setReplyTarget(wrap, message));\n    actions.appendChild(reply);\n\n    if (canDeleteMessage(message)) {\n      const remove = document.createElement(\"button\");\n      remove.type = \"button\";\n      remove.className = \"cudloun-feedback-delete\";\n      remove.textContent = \"Delete\";\n      remove.addEventListener(\"click\", () => deleteMessage(wrap, message, remove));\n      actions.appendChild(remove);\n    }\n    item.appendChild(actions);\n\n    const replies = children.get(message.id) || [];\n    if (replies.length) {\n      const replyList = document.createElement(\"div\");\n      replyList.className = \"cudloun-feedback-replies\";\n      replies.forEach((child) => {\n        replyList.appendChild(renderMessage(child, children, wrap, depth + 1, nextTrail));\n      });\n      item.appendChild(replyList);\n    }\n\n    return item;\n  }\n\n  function messageTree(messages) {\n    const byId = new Map(messages.map((message) => [message.id, message]));\n    const children = new Map();\n    const roots = [];\n\n    messages.forEach((message) => {\n      if (message.parentId && byId.has(message.parentId)) {\n        if (!children.has(message.parentId)) children.set(message.parentId, []);\n        children.get(message.parentId).push(message);\n      } else {\n        roots.push(message);\n      }\n    });\n\n    if (!roots.length && messages.length) roots.push(...messages);\n\n    children.forEach((items) => items.sort((a, b) => (a.ts || 0) - (b.ts || 0)));\n    roots.sort((a, b) => (a.ts || 0) - (b.ts || 0));\n    return { roots, children };\n  }\n\n  function renderFeedbackText(container, value) {\n    const text = String(value || \"\");\n    const pattern = /<img\\s+[^>]*src\\s*=\\s*[\"']([^\"']+)[\"'][^>]*>|(https?:\\/\\/[^\\s<>\"']+\\.(?:png|jpe?g|gif|webp|avif)(?:\\?[^\\s<>\"']*)?)/gi;\n    let cursor = 0;\n    let match;\n\n    while ((match = pattern.exec(text))) {\n      const rawUrl = match[1] || match[2] || \"\";\n      const url = safeImageUrl(rawUrl);\n      if (!url) continue;\n\n      if (match.index > cursor) container.appendChild(document.createTextNode(text.slice(cursor, match.index)));\n      container.appendChild(renderImageLink(url));\n      cursor = match.index + match[0].length;\n    }\n\n    if (cursor < text.length) container.appendChild(document.createTextNode(text.slice(cursor)));\n  }\n\n  function safeImageUrl(value) {\n    const raw = String(value || \"\").trim();\n    if (!raw || raw.length > 500) return \"\";\n\n    try {\n      const url = new URL(raw, window.location.href);\n      if (url.protocol !== \"https:\" && url.protocol !== \"http:\") return \"\";\n      if (!/\\.(png|jpe?g|gif|webp|avif)$/i.test(url.pathname)) return \"\";\n      return url.href;\n    } catch (error) {\n      return \"\";\n    }\n  }\n\n  function renderImageLink(url) {\n    const link = document.createElement(\"a\");\n    link.className = \"cudloun-feedback-image-link\";\n    link.href = url;\n    link.target = \"_blank\";\n    link.rel = \"noopener noreferrer\";\n\n    const img = document.createElement(\"img\");\n    img.className = \"cudloun-feedback-image\";\n    img.src = url;\n    img.loading = \"lazy\";\n    img.alt = \"\";\n\n    link.appendChild(img);\n    return link;\n  }\n\n  function setReplyTarget(wrap, message) {\n    const form = wrap.querySelector(\".cudloun-feedback-form\");\n    const textarea = form?.querySelector(\"textarea\");\n    const banner = form?.querySelector(\".cudloun-feedback-reply-target\");\n    const label = banner?.querySelector(\"span\");\n    if (!form || !textarea || !banner || !label) return;\n\n    form.dataset.parentId = message.id;\n    form.dataset.parentAuthor = message.author || \"Unknown\";\n    form.dataset.parentExcerpt = excerpt(message.text);\n    label.textContent = `Replying to ${message.author || \"Unknown\"}: ${excerpt(message.text)}`;\n    banner.hidden = false;\n    textarea.placeholder = \"Reply...\";\n    textarea.focus();\n  }\n\n  function clearReplyTarget(form, textarea) {\n    delete form.dataset.parentId;\n    delete form.dataset.parentAuthor;\n    delete form.dataset.parentExcerpt;\n    const banner = form.querySelector(\".cudloun-feedback-reply-target\");\n    if (banner) banner.hidden = true;\n    if (textarea) textarea.placeholder = \"Idea, bug, or note...\";\n  }\n\n  async function sendMessage(target, authorInput, textarea, submit, status, wrap, form) {\n    const author = cleanAuthor(authorInput.value || detectAuthor());\n    const text = String(textarea.value || \"\").trim();\n    const parent = parentFields(form);\n\n    if (!text) {\n      status.textContent = \"Write something first.\";\n      return;\n    }\n\n    if (text.length > MAX_TEXT_LENGTH) {\n      status.textContent = `Max ${MAX_TEXT_LENGTH} chars.`;\n      return;\n    }\n\n    authorInput.value = author;\n    root.storage.set(\"feedback.author\", author);\n    submit.disabled = true;\n    status.textContent = \"Sending...\";\n\n    try {\n      await requestJson(`${REST_BASE}/cudlounThreads/${encodeURIComponent(target.threadId)}/messages`, {\n        method: \"POST\",\n        headers: { \"Content-Type\": \"application/json\" },\n        body: JSON.stringify({\n          fields: {\n            schemaVersion: { integerValue: parent.parentId ? 2 : 1 },\n            author: { stringValue: author },\n            text: { stringValue: text },\n            ts: { integerValue: String(Date.now()) },\n            route: { stringValue: root.currentRoute() },\n            cudlounVersion: { stringValue: root.version || \"\" },\n            userAgentHint: { stringValue: userAgentHint() },\n            ...parent.firestoreFields,\n          },\n        }),\n      });\n\n      textarea.value = \"\";\n      clearReplyTarget(form, textarea);\n      status.textContent = \"Sent.\";\n      await loadMessages(target, wrap);\n      window.setTimeout(() => {\n        if (status.textContent === \"Sent.\") status.textContent = \"\";\n      }, 1800);\n    } catch (error) {\n      root.log.warn(\"feedback\", \"send failed\", target.threadId, error);\n      status.textContent = \"Send failed.\";\n    } finally {\n      submit.disabled = false;\n    }\n  }\n\n  async function deleteMessage(wrap, message, button) {\n    const threadId = wrap.dataset.threadId;\n    if (!threadId || !message.id || !canDeleteMessage(message)) return;\n    if (!window.confirm(`Delete feedback from ${message.author || \"Unknown\"}?`)) return;\n\n    const status = wrap.querySelector(\".cudloun-feedback-status\");\n    if (button) button.disabled = true;\n    if (status) status.textContent = \"Deleting...\";\n\n    try {\n      await requestJson(`${REST_BASE}/cudlounThreads/${encodeURIComponent(threadId)}/messages/${encodeURIComponent(message.id)}`, {\n        method: \"DELETE\",\n      });\n      if (status) status.textContent = \"Deleted.\";\n      await loadMessages({ threadId }, wrap);\n      window.setTimeout(() => {\n        if (status?.textContent === \"Deleted.\") status.textContent = \"\";\n      }, 1800);\n    } catch (error) {\n      root.log.warn(\"feedback\", \"delete failed\", threadId, message.id, error);\n      if (status) status.textContent = \"Delete failed.\";\n      if (button) button.disabled = false;\n    }\n  }\n\n  function canDeleteMessage(message) {\n    const current = normalizedAuthor(detectAuthor());\n    if (!current) return false;\n    return ADMIN_AUTHORS.has(current) || current === normalizedAuthor(message.author);\n  }\n\n  function parentFields(form) {\n    const parentId = String(form?.dataset?.parentId || \"\").trim();\n    if (!parentId) return { parentId: \"\", firestoreFields: {} };\n    const parentAuthor = cleanAuthor(form.dataset.parentAuthor || \"Unknown\");\n    const parentExcerpt = excerpt(form.dataset.parentExcerpt || \"\");\n    return {\n      parentId,\n      firestoreFields: {\n        parentId: { stringValue: parentId },\n        parentAuthor: { stringValue: parentAuthor },\n        parentExcerpt: { stringValue: parentExcerpt },\n      },\n    };\n  }\n\n  async function requestJson(url, options) {\n    const response = await fetch(url, options || {});\n    if (!response.ok) {\n      throw new Error(`HTTP ${response.status}`);\n    }\n    if (response.status === 204) return {};\n    const text = await response.text();\n    if (!text) return {};\n    return JSON.parse(text);\n  }\n\n  function documentToMessage(doc) {\n    if (!doc || !doc.fields) return null;\n    return {\n      id: String(doc.name || \"\").split(\"/\").pop(),\n      author: fieldValue(doc.fields.author) || \"Unknown\",\n      text: fieldValue(doc.fields.text) || \"\",\n      ts: Number(fieldValue(doc.fields.ts) || 0),\n      route: fieldValue(doc.fields.route) || \"\",\n      cudlounVersion: fieldValue(doc.fields.cudlounVersion) || \"\",\n      userAgentHint: fieldValue(doc.fields.userAgentHint) || \"\",\n      parentId: fieldValue(doc.fields.parentId) || \"\",\n      parentAuthor: fieldValue(doc.fields.parentAuthor) || \"\",\n      parentExcerpt: fieldValue(doc.fields.parentExcerpt) || \"\",\n    };\n  }\n\n  function fieldValue(field) {\n    if (!field || typeof field !== \"object\") return null;\n    if (Object.prototype.hasOwnProperty.call(field, \"stringValue\")) return field.stringValue;\n    if (Object.prototype.hasOwnProperty.call(field, \"integerValue\")) return field.integerValue;\n    if (Object.prototype.hasOwnProperty.call(field, \"timestampValue\")) return field.timestampValue;\n    if (Object.prototype.hasOwnProperty.call(field, \"booleanValue\")) return field.booleanValue;\n    return null;\n  }\n\n  function normalizeTarget(target) {\n    const kind = String(target?.kind || \"framework\").toLowerCase();\n    const id = String(target?.id || \"cudloun\").toLowerCase();\n    return {\n      kind,\n      id,\n      name: target?.name || id,\n      threadId: target?.threadId || threadId(kind, id),\n    };\n  }\n\n  function threadId(kind, id) {\n    const safeKind = String(kind || \"framework\").toLowerCase().replace(/[^a-z0-9-]/g, \"-\");\n    const safeId = String(id || \"cudloun\").toLowerCase().replace(/[^a-z0-9-]/g, \"-\");\n    return `${safeKind}_${safeId}`;\n  }\n\n  function detectAuthor() {\n    const fromBabeguts = root.babeguts && typeof root.babeguts.currentUser === \"function\"\n      ? root.babeguts.currentUser()\n      : \"\";\n    if (validAuthor(fromBabeguts)) return cleanAuthor(fromBabeguts);\n\n    const desktopAvatar = document.querySelector('button[aria-label=\"Uživatelské menu\"] img[alt]');\n    if (validAuthor(desktopAvatar?.getAttribute(\"alt\"))) return cleanAuthor(desktopAvatar.getAttribute(\"alt\"));\n\n    const mobileAvatar = Array.from(document.querySelectorAll(\".MuiBottomNavigationAction-root\"))\n      .find((button) => button.querySelector(\".MuiAvatar-root, img[alt]\"));\n    const mobileAlt = mobileAvatar?.querySelector(\"img[alt]\")?.getAttribute(\"alt\");\n    if (validAuthor(mobileAlt)) return cleanAuthor(mobileAlt);\n    if (validAuthor(mobileAvatar?.textContent)) return cleanAuthor(mobileAvatar.textContent);\n\n    return \"Unknown\";\n  }\n\n  function cleanAuthor(value) {\n    const text = String(value || \"\").replace(/\\s+/g, \" \").trim().slice(0, 40);\n    return text || \"Unknown\";\n  }\n\n  function initialAuthor() {\n    const stored = root.storage.get(\"feedback.author\", \"\");\n    if (validAuthor(stored)) return cleanAuthor(stored);\n    return detectAuthor();\n  }\n\n  function validAuthor(value) {\n    const text = String(value || \"\").replace(/\\s+/g, \" \").trim();\n    if (!text || text.length > 40) return false;\n    return !/^(unknown|menu|close|search|hledat v klubu|nastaveni|nastavení|barevne schema|barevné schéma|odhlasit|odhlásit|okoun|domů|vzkazník|oblíbené)$/i.test(text);\n  }\n\n  function normalizedAuthor(value) {\n    return String(value || \"\")\n      .normalize(\"NFD\")\n      .replace(/[\\u0300-\\u036f]/g, \"\")\n      .replace(/\\s+/g, \" \")\n      .trim()\n      .toLowerCase();\n  }\n\n  function userAgentHint() {\n    const coarse = window.matchMedia && window.matchMedia(\"(pointer: coarse)\").matches;\n    return `${coarse ? \"mobile\" : \"desktop\"} ${window.innerWidth}x${window.innerHeight}`;\n  }\n\n  function excerpt(value) {\n    return String(value || \"\").replace(/\\s+/g, \" \").trim().slice(0, 120);\n  }\n\n  function formatTime(ts) {\n    const date = new Date(Number(ts) || Date.now());\n    return date.toLocaleString(\"cs-CZ\", {\n      day: \"2-digit\",\n      month: \"2-digit\",\n      hour: \"2-digit\",\n      minute: \"2-digit\",\n    });\n  }\n})();\n");
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
        const fromBabeguts = root.babeguts && typeof root.babeguts.currentUser === "function"
          ? root.babeguts.currentUser()
          : "";
        if (validAuthor(fromBabeguts)) return cleanAuthor(fromBabeguts);

        const desktopAvatar = document.querySelector('button[aria-label="Uživatelské menu"] img[alt]');
        if (validAuthor(desktopAvatar?.getAttribute("alt"))) return cleanAuthor(desktopAvatar.getAttribute("alt"));

        const mobileAvatar = Array.from(document.querySelectorAll(".MuiBottomNavigationAction-root"))
          .find((button) => button.querySelector(".MuiAvatar-root, img[alt]"));
        const mobileAlt = mobileAvatar?.querySelector("img[alt]")?.getAttribute("alt");
        if (validAuthor(mobileAlt)) return cleanAuthor(mobileAlt);
        if (validAuthor(mobileAvatar?.textContent)) return cleanAuthor(mobileAvatar.textContent);

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

  embeddedText.set("modules/sys-menu.js", "// Cudloun Babeta avatar menu and hub UI.\n(function () {\n  \"use strict\";\n\n  const root = window.Cudloun;\n  const MENU_ITEM_ATTR = \"data-cudloun-menu-item\";\n  const FULLSCREEN_ITEM_ATTR = \"data-cudloun-fullscreen-menu-item\";\n  const STYLE_ATTR = \"data-cudloun-style\";\n  const BACKDROP_CLASS = \"cudloun-backdrop\";\n  const RESTORE_FULLSCREEN_KEY = \"cudloun.restoreFullscreenAfterRefresh\";\n  const RESTORE_FULLSCREEN_CLASS = \"cudloun-restore-fullscreen\";\n  const HUB_POSITION_KEY = \"cudloun.hubPosition\";\n  const HUB_COLLAPSED_KEY = \"cudloun.hubCollapsed\";\n\n  let observer = null;\n  let observerDebounceTimer = null;\n  let routeTimer = null;\n  let lastRoute = root.currentRoute();\n  let hubPosition = null;\n  let hubCollapsed = false;\n  let hubSelectedId = null;\n\n  root.ui = {\n    start,\n    openHub,\n    closeHub,\n    renderHub,\n    refreshMenuItems,\n    injectIntoAvatarMenu,\n    injectIntoMobileDrawerMenu,\n    injectIntoKapybaraAvatarMenu,\n  };\n\n  function start() {\n    installStyles();\n    maybeShowRestoreFullscreenPrompt();\n    observeAvatarMenu();\n    observeRouteChanges();\n    injectIntoAvatarMenu();\n    injectIntoMobileDrawerMenu();\n    injectIntoKapybaraAvatarMenu();\n    root.log.info(\"menu\", \"started\", lastRoute);\n  }\n\n  function observeAvatarMenu() {\n    if (observer) return;\n\n    observer = new MutationObserver((mutations) => {\n      const shouldRecheck = mutations.some((mutation) => mutation.addedNodes.length || mutation.type === \"attributes\");\n      if (!shouldRecheck) return;\n\n      window.clearTimeout(observerDebounceTimer);\n      observerDebounceTimer = window.setTimeout(() => {\n        injectIntoAvatarMenu();\n        injectIntoMobileDrawerMenu();\n        injectIntoKapybaraAvatarMenu();\n      }, 40);\n    });\n\n    observer.observe(document.documentElement, {\n      childList: true,\n      subtree: true,\n      attributes: true,\n      attributeFilter: [\"class\", \"style\", \"aria-hidden\"],\n    });\n\n    root.log.debug(\"menu\", \"avatar/menu observer attached\");\n  }\n\n  function observeRouteChanges() {\n    const check = () => {\n      const route = root.currentRoute();\n      if (route !== lastRoute) {\n        lastRoute = route;\n        root.log.info(\"router\", \"route changed\", route);\n        injectIntoAvatarMenu();\n        injectIntoMobileDrawerMenu();\n        injectIntoKapybaraAvatarMenu();\n      }\n      routeTimer = window.setTimeout(check, 500);\n    };\n\n    routeTimer = window.setTimeout(check, 500);\n  }\n\n  function injectIntoAvatarMenu() {\n    const menu = visibleAvatarMenu();\n    if (!menu) {\n      root.log.trace(\"menu\", \"avatar menu not present\");\n      return;\n    }\n\n    if (menu.querySelector(`[${MENU_ITEM_ATTR}]`)) {\n      root.log.trace(\"menu\", \"avatar menu items already present\");\n      return;\n    }\n\n    const firstItem = menu.querySelector(\"li[role='menuitem']\");\n    if (!firstItem) {\n      root.log.warn(\"menu\", \"avatar menu found without menuitem\");\n      return;\n    }\n\n    const divider = menu.querySelector(\"hr\");\n    const item = makeMenuItem(firstItem, \"Cudloun\");\n    item.addEventListener(\"click\", openHub);\n\n    const controlsItem = showFullscreenControls() ? makeMenuActionRow(firstItem) : null;\n\n    if (divider) {\n      divider.before(item);\n      if (controlsItem) item.after(controlsItem);\n    } else {\n      menu.appendChild(item);\n      if (controlsItem) menu.appendChild(controlsItem);\n    }\n\n    root.log.info(\"menu\", \"avatar menu items injected\", divider ? \"before divider\" : \"at end\", menuDebug(menu));\n  }\n\n  function injectIntoMobileDrawerMenu() {\n    const menu = visibleMobileDrawerMenu();\n    if (!menu) {\n      root.log.trace(\"menu\", \"mobile drawer menu not present\");\n      return;\n    }\n\n    if (menu.querySelector(`[${MENU_ITEM_ATTR}]`)) {\n      root.log.trace(\"menu\", \"mobile drawer menu items already present\");\n      return;\n    }\n\n    const firstItem = menu.querySelector(\"li[role='menuitem']\");\n    if (!firstItem) {\n      root.log.warn(\"menu\", \"mobile drawer found without menuitem\");\n      return;\n    }\n\n    const item = makeMobileMenuItem(firstItem, \"Cudloun\");\n    item.addEventListener(\"click\", (event) => {\n      event.preventDefault();\n      event.stopPropagation();\n      dismissBabetaMenu(event.currentTarget);\n      openHub();\n    });\n\n    const controlsItem = showFullscreenControls() ? makeMenuActionRow(firstItem, true) : null;\n\n    const logout = Array.from(menu.querySelectorAll(\"li[role='menuitem']\"))\n      .find((li) => li.textContent.includes(\"Odhlásit\"));\n\n    if (logout) {\n      logout.before(item);\n      if (controlsItem) item.after(controlsItem);\n    } else {\n      menu.appendChild(item);\n      if (controlsItem) menu.appendChild(controlsItem);\n    }\n\n    root.log.info(\"menu\", \"mobile drawer menu items injected\", menuDebug(menu));\n  }\n\n  function injectIntoKapybaraAvatarMenu() {\n    if (!root.kapyguts?.isKapybara?.()) return;\n\n    const menu = visibleKapybaraAvatarMenu();\n    if (!menu) {\n      root.log.trace(\"menu\", \"kapybara avatar menu not present\");\n      return;\n    }\n\n    if (menu.querySelector(`[${MENU_ITEM_ATTR}]`)) {\n      root.log.trace(\"menu\", \"kapybara avatar menu items already present\");\n      return;\n    }\n\n    const anchor = kapybaraMenuAnchor(menu);\n    const item = makeKapybaraMenuItem(anchor);\n    item.addEventListener(\"click\", (event) => {\n      event.preventDefault();\n      event.stopPropagation();\n      dismissKapybaraMenu();\n      openHub();\n    });\n\n    if (anchor) {\n      anchor.before(item);\n    } else {\n      menu.appendChild(item);\n    }\n\n    if (showFullscreenControls()) {\n      const controls = makeKapybaraActionRow();\n      item.after(controls);\n    }\n\n    root.log.info(\"menu\", \"kapybara avatar menu items injected\", menuDebug(menu));\n  }\n\n  function visibleAvatarMenu() {\n    const menus = Array.from(document.querySelectorAll(\".MuiMenu-paper ul[role='menu']\"));\n    const visibleMenus = menus.filter((menu) => {\n      const rect = menu.getBoundingClientRect();\n      const style = window.getComputedStyle(menu);\n      return rect.width > 0 && rect.height > 0 && style.visibility !== \"hidden\" && style.display !== \"none\";\n    });\n\n    if (menus.length > 1) {\n      root.log.debug(\"menu\", \"candidate avatar menus\", menus.map(menuDebug));\n    }\n\n    return visibleMenus[visibleMenus.length - 1] || menus[menus.length - 1] || null;\n  }\n\n  function visibleMobileDrawerMenu() {\n    const menus = Array.from(document.querySelectorAll(\".MuiDrawer-paperAnchorBottom ul.MuiList-root\"));\n    const visibleMenus = menus.filter((menu) => {\n      const rect = menu.getBoundingClientRect();\n      const style = window.getComputedStyle(menu);\n      const rootNode = menu.closest(\".MuiDrawer-root\");\n      const rootClass = String(rootNode?.className || \"\");\n      const text = menu.textContent.replace(/\\s+/g, \"\");\n      const onscreen = rect.top < window.innerHeight && rect.bottom > 0;\n      return (\n        rect.width > 0 &&\n        rect.height > 0 &&\n        onscreen &&\n        !rootClass.includes(\"MuiModal-hidden\") &&\n        style.visibility !== \"hidden\" &&\n        style.display !== \"none\" &&\n        text.includes(\"Barevnéschéma\") &&\n        (text.includes(\"Nastavení\") || text.includes(\"Přihlásit\"))\n      );\n    });\n\n    if (menus.length > 1) {\n      root.log.debug(\"menu\", \"candidate mobile drawer menus\", menus.map(menuDebug));\n    }\n\n    return visibleMenus.sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top)[0] || null;\n  }\n\n  function visibleKapybaraAvatarMenu() {\n    const candidates = Array.from(document.querySelectorAll([\n      \"[role='dialog']\",\n      \"[role='menu']\",\n      \".bottom-sheet\",\n      \"[class*='sheet']\",\n      \"[class*='drawer']\",\n      \"[class*='menu']\",\n      \"section\",\n      \"nav\",\n      \"aside\",\n      \"div\",\n    ].join(\",\")))\n      .filter(isUsableKapybaraMenuCandidate)\n      .sort((a, b) => {\n        const rectA = a.getBoundingClientRect();\n        const rectB = b.getBoundingClientRect();\n        return (rectA.width * rectA.height) - (rectB.width * rectB.height);\n      });\n\n    if (candidates.length > 1) {\n      root.log.debug(\"menu\", \"candidate kapybara avatar menus\", candidates.slice(0, 8).map(menuDebug));\n    }\n\n    return candidates[0] || null;\n  }\n\n  function isUsableKapybaraMenuCandidate(node) {\n    if (!(node instanceof Element)) return false;\n    if (node.closest(`.${BACKDROP_CLASS}`)) return false;\n    if (node.querySelector(`[${MENU_ITEM_ATTR}]`)) return false;\n\n    const rect = node.getBoundingClientRect();\n    if (rect.width < 220 || rect.height < 120) return false;\n    if (rect.bottom <= 0 || rect.top >= window.innerHeight) return false;\n\n    const style = window.getComputedStyle(node);\n    if (style.display === \"none\" || style.visibility === \"hidden\" || style.opacity === \"0\") return false;\n\n    const text = normalizeMenuText(node.textContent);\n    if (!text.includes(\"Nastavení\") || !text.includes(\"Odhlásit\")) return false;\n    if (text.length > 260) return false;\n\n    return true;\n  }\n\n  function kapybaraMenuAnchor(menu) {\n    const rows = Array.from(menu.querySelectorAll(\"button, a, [role='button'], li, div, span\"))\n      .filter((node) => {\n        if (!(node instanceof Element)) return false;\n        const rect = node.getBoundingClientRect();\n        if (rect.width < 80 || rect.height < 24) return false;\n        if (rect.bottom <= 0 || rect.top >= window.innerHeight) return false;\n        const text = normalizeMenuText(node.textContent);\n        return text === \"Nastavení\" || text === \"Odhlásit se\" || text === \"Odhlásit\";\n      })\n      .sort((a, b) => {\n        const rectA = a.getBoundingClientRect();\n        const rectB = b.getBoundingClientRect();\n        return (rectA.width * rectA.height) - (rectB.width * rectB.height);\n      });\n\n    return rows[0] || null;\n  }\n\n  function makeMenuItem(firstItem, labelText = \"Cudloun\") {\n    const item = document.createElement(\"li\");\n    item.className = firstItem.className || \"\";\n    item.setAttribute(MENU_ITEM_ATTR, \"true\");\n    item.setAttribute(\"tabindex\", \"-1\");\n    item.setAttribute(\"role\", \"menuitem\");\n    item.style.cssText = [\n      firstItem.getAttribute(\"style\") || \"\",\n      \"cursor:pointer;\",\n      \"display:flex;\",\n      \"align-items:center;\",\n      \"gap:16px;\",\n      \"min-height:48px;\",\n    ].join(\"\");\n\n    const icon = document.createElement(\"div\");\n    icon.className = firstItem.querySelector(\"div\")?.className || \"\";\n    icon.innerHTML = labelText === \"Fullscreen\" ? fullscreenIconSvg() : menuIconSvg();\n\n    const label = document.createElement(\"span\");\n    label.textContent = labelText;\n\n    item.appendChild(icon);\n    item.appendChild(label);\n    return item;\n  }\n\n  function makeMobileMenuItem(firstItem, labelText = \"Cudloun\") {\n    const item = firstItem.cloneNode(true);\n    item.setAttribute(MENU_ITEM_ATTR, \"true\");\n    item.setAttribute(\"tabindex\", \"-1\");\n    item.setAttribute(\"role\", \"menuitem\");\n    item.style.cursor = \"pointer\";\n\n    const iconWrap = item.querySelector(\".MuiListItemIcon-root\") || item.querySelector(\"svg\")?.parentElement;\n    if (iconWrap) iconWrap.innerHTML = labelText === \"Fullscreen\" ? fullscreenIconSvg() : menuIconSvg();\n\n    const label = item.querySelector(\".MuiListItemText-root span\") || item.querySelector(\".MuiListItemText-root\") || item;\n    label.textContent = labelText;\n\n    return item;\n  }\n\n  function makeKapybaraMenuItem(anchor) {\n    const item = document.createElement(\"button\");\n    item.type = \"button\";\n    item.className = `${anchor?.className || \"\"} cudloun-kapybara-menu-item`.trim();\n    item.setAttribute(MENU_ITEM_ATTR, \"true\");\n    item.innerHTML = `${menuIconSvg()}<span>Cudloun<\/span>`;\n    return item;\n  }\n\n  function makeKapybaraActionRow() {\n    const row = document.createElement(\"div\");\n    row.className = \"cudloun-kapybara-action-row\";\n    row.setAttribute(FULLSCREEN_ITEM_ATTR, \"true\");\n    row.appendChild(makeMenuActionButton(\"Full\", fullscreenIconSvg(), (event) => {\n      dismissKapybaraMenu();\n      toggleFullscreen(event);\n    }, \"Fullscreen\"));\n    row.appendChild(makeMenuActionButton(\"Refresh\", refreshPageIconSvg(), (event) => {\n      dismissKapybaraMenu();\n      refreshPage(event);\n    }));\n    return row;\n  }\n\n  function makeMenuActionRow(firstItem, mobile = false) {\n    const item = document.createElement(\"li\");\n    item.className = firstItem.className || \"\";\n    item.setAttribute(FULLSCREEN_ITEM_ATTR, \"true\");\n    item.setAttribute(\"tabindex\", \"-1\");\n    item.setAttribute(\"role\", \"menuitem\");\n    item.style.cssText = [\n      firstItem.getAttribute(\"style\") || \"\",\n      \"cursor:default;\",\n      \"display:flex;\",\n      \"align-items:center;\",\n      \"gap:8px;\",\n      \"min-height:48px;\",\n      mobile ? \"padding:8px 16px;\" : \"padding:8px 16px;\",\n    ].join(\"\");\n\n    item.appendChild(makeMenuActionButton(\"Full\", fullscreenIconSvg(), toggleFullscreen, \"Fullscreen\"));\n    item.appendChild(makeMenuActionButton(\"Refresh\", refreshPageIconSvg(), refreshPage));\n    return item;\n  }\n\n  function makeMenuActionButton(labelText, iconSvg, handler, ariaLabel = labelText) {\n    const button = document.createElement(\"button\");\n    button.className = \"cudloun-menu-action-button\";\n    button.type = \"button\";\n    button.setAttribute(\"aria-label\", ariaLabel);\n    button.title = ariaLabel;\n    button.innerHTML = `${iconSvg}<span>${labelText}<\/span>`;\n    button.addEventListener(\"click\", handler);\n    return button;\n  }\n\n  async function toggleFullscreen(event) {\n    if (event) {\n      event.preventDefault();\n      event.stopPropagation();\n    }\n\n    const menuPaper = event?.currentTarget?.closest(\".MuiMenu-paper\");\n    if (menuPaper) menuPaper.style.display = \"none\";\n    dismissBabetaMenu(event?.currentTarget);\n\n    try {\n      if (document.fullscreenElement) {\n        await document.exitFullscreen();\n        root.log.info(\"fullscreen\", \"exited\");\n        return;\n      }\n\n      await document.documentElement.requestFullscreen();\n      root.log.info(\"fullscreen\", \"entered\");\n    } catch (error) {\n      root.log.warn(\"fullscreen\", \"toggle failed\", error);\n    }\n  }\n\n  function refreshPage(event) {\n    if (event) {\n      event.preventDefault();\n      event.stopPropagation();\n    }\n\n    const menuPaper = event?.currentTarget?.closest(\".MuiMenu-paper\");\n    if (menuPaper) menuPaper.style.display = \"none\";\n    dismissBabetaMenu(event?.currentTarget);\n    if (document.fullscreenElement) {\n      root.storage.set(RESTORE_FULLSCREEN_KEY, true);\n    }\n    root.log.info(\"menu\", \"refresh requested\");\n    window.location.reload();\n  }\n\n  function showFullscreenControls() {\n    return root.storage.get(\"module.settoun.showFullscreen\", true) !== false;\n  }\n\n  function refreshMenuItems() {\n    document.querySelectorAll(`[${MENU_ITEM_ATTR}], [${FULLSCREEN_ITEM_ATTR}]`)\n      .forEach((item) => item.remove());\n    injectIntoAvatarMenu();\n    injectIntoMobileDrawerMenu();\n    injectIntoKapybaraAvatarMenu();\n  }\n\n  function maybeShowRestoreFullscreenPrompt() {\n    if (root.storage.get(RESTORE_FULLSCREEN_KEY, false) !== true) return;\n    root.storage.set(RESTORE_FULLSCREEN_KEY, false);\n    if (document.fullscreenElement) return;\n\n    window.setTimeout(() => {\n      if (document.fullscreenElement || document.querySelector(`.${RESTORE_FULLSCREEN_CLASS}`)) return;\n\n      const prompt = document.createElement(\"div\");\n      prompt.className = RESTORE_FULLSCREEN_CLASS;\n\n      const button = document.createElement(\"button\");\n      button.type = \"button\";\n      button.textContent = \"Restore fullscreen\";\n      button.addEventListener(\"click\", async () => {\n        try {\n          await document.documentElement.requestFullscreen();\n          root.log.info(\"fullscreen\", \"restored after refresh\");\n        } catch (error) {\n          root.log.warn(\"fullscreen\", \"restore failed\", error);\n        } finally {\n          prompt.remove();\n        }\n      });\n\n      const dismiss = document.createElement(\"button\");\n      dismiss.type = \"button\";\n      dismiss.setAttribute(\"aria-label\", \"Dismiss\");\n      dismiss.textContent = \"x\";\n      dismiss.addEventListener(\"click\", () => prompt.remove());\n\n      prompt.appendChild(button);\n      prompt.appendChild(dismiss);\n      document.body.appendChild(prompt);\n    }, 600);\n  }\n\n  function menuIconSvg() {\n    return `\n      <svg class=\"MuiSvgIcon-root MuiSvgIcon-fontSizeSmall css-vh810p\"\n           focusable=\"false\"\n           aria-hidden=\"true\"\n           viewBox=\"0 0 24 24\">\n        <path d=\"M12 3c4.97 0 9 3.36 9 7.5 0 2.08-1.02 3.96-2.67 5.32L19 21l-4.63-2.32c-.76.21-1.56.32-2.37.32-4.97 0-9-3.36-9-7.5S7.03 3 12 3m-4 8h2V9H8zm3 0h2V9h-2zm3 0h2V9h-2z\"><\/path>\n      <\/svg>\n    `;\n  }\n\n  function fullscreenIconSvg() {\n    return `\n      <svg class=\"MuiSvgIcon-root MuiSvgIcon-fontSizeSmall css-vh810p\"\n           focusable=\"false\"\n           aria-hidden=\"true\"\n           viewBox=\"0 0 24 24\">\n        <path d=\"M5 5h6v2H7v4H5zm8 0h6v6h-2V7h-4zm4 8h2v6h-6v-2h4zm-12 0h2v4h4v2H5z\"><\/path>\n      <\/svg>\n    `;\n  }\n\n  function refreshPageIconSvg() {\n    return `\n      <svg class=\"MuiSvgIcon-root MuiSvgIcon-fontSizeSmall css-vh810p\"\n           focusable=\"false\"\n           aria-hidden=\"true\"\n           viewBox=\"0 0 24 24\">\n        <path d=\"M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.45 5.05h-2.13A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h8V3z\"><\/path>\n      <\/svg>\n    `;\n  }\n\n  function menuDebug(menu) {\n    const rect = menu.getBoundingClientRect();\n    return {\n      text: menu.textContent.trim().replace(/\\s+/g, \" \").slice(0, 120),\n      width: Math.round(rect.width),\n      height: Math.round(rect.height),\n      className: menu.className,\n    };\n  }\n\n  function openHub(eventOrModuleId) {\n    let selectedModuleId = null;\n    if (typeof eventOrModuleId === \"string\") {\n      selectedModuleId = eventOrModuleId;\n    } else if (eventOrModuleId) {\n      eventOrModuleId.preventDefault();\n      eventOrModuleId.stopPropagation();\n      const menuPaper = eventOrModuleId.currentTarget?.closest(\".MuiMenu-paper\");\n      if (menuPaper) menuPaper.style.display = \"none\";\n      dismissBabetaMenu(eventOrModuleId.currentTarget);\n    }\n\n    document.querySelector(`.${BACKDROP_CLASS}`)?.remove();\n    hubPosition = validHubPosition(root.storage.get(HUB_POSITION_KEY, null));\n    hubCollapsed = root.storage.get(HUB_COLLAPSED_KEY, false) === true;\n\n    const backdrop = document.createElement(\"div\");\n    backdrop.className = BACKDROP_CLASS;\n    backdrop.addEventListener(\"click\", (clickEvent) => {\n      if (clickEvent.target === backdrop) closeHub();\n    });\n\n    document.body.appendChild(backdrop);\n    root.log.info(\"hub\", \"opened\");\n    renderHub(selectedModuleId);\n  }\n\n  function closeHub() {\n    document.querySelector(`.${BACKDROP_CLASS}`)?.remove();\n    root.log.info(\"hub\", \"closed\");\n  }\n\n  function dismissBabetaMenu(target) {\n    const drawerRoot = target?.closest?.(\".MuiDrawer-root\");\n    if (!drawerRoot) return;\n\n    drawerRoot.style.removeProperty(\"display\");\n\n    const backdrop = drawerRoot.querySelector(\".MuiBackdrop-root\");\n    if (backdrop && window.getComputedStyle(backdrop).display !== \"none\") {\n      backdrop.dispatchEvent(new MouseEvent(\"click\", { bubbles: true, cancelable: true, view: window }));\n      return;\n    }\n\n    document.dispatchEvent(new KeyboardEvent(\"keydown\", {\n      key: \"Escape\",\n      code: \"Escape\",\n      keyCode: 27,\n      which: 27,\n      bubbles: true,\n      cancelable: true,\n    }));\n  }\n\n  function dismissKapybaraMenu() {\n    document.dispatchEvent(new KeyboardEvent(\"keydown\", {\n      key: \"Escape\",\n      code: \"Escape\",\n      keyCode: 27,\n      which: 27,\n      bubbles: true,\n      cancelable: true,\n    }));\n  }\n\n  function normalizeMenuText(text) {\n    return String(text || \"\").replace(/\\s+/g, \" \").trim();\n  }\n\n  function renderHub(selectedId) {\n    const backdrop = document.querySelector(`.${BACKDROP_CLASS}`);\n    if (!backdrop) return;\n\n    const selectedModule = root.modules.find((module) => module.id === selectedId) || root.modules[0];\n    const mode = selectedId === \"debug\" ? \"debug\" : \"module\";\n    hubSelectedId = mode === \"debug\" ? \"debug\" : selectedModule?.id;\n    backdrop.innerHTML = \"\";\n\n    const dialog = document.createElement(\"section\");\n    dialog.className = \"cudloun-dialog\";\n    if (hubCollapsed) dialog.dataset.collapsed = \"true\";\n    dialog.setAttribute(\"role\", \"dialog\");\n    dialog.setAttribute(\"aria-modal\", \"true\");\n    dialog.setAttribute(\"aria-labelledby\", \"cudloun-title\");\n    dialog.appendChild(renderMascot());\n    dialog.appendChild(renderHeader());\n    if (!hubCollapsed) dialog.appendChild(renderBody(mode, selectedModule));\n    backdrop.appendChild(dialog);\n    applyHubPosition(dialog);\n  }\n\n  function renderMascot() {\n    const mascot = document.createElement(\"img\");\n    mascot.className = \"cudloun-mascot\";\n    mascot.alt = \"\";\n    mascot.decoding = \"async\";\n    mascot.loading = \"lazy\";\n    mascot.src = `${root.repoUrl}cudloun.png`;\n    return mascot;\n  }\n\n  function renderHeader() {\n    const header = document.createElement(\"div\");\n    header.className = \"cudloun-head\";\n    header.addEventListener(\"pointerdown\", startHubDrag);\n\n    const titleWrap = document.createElement(\"div\");\n    titleWrap.className = \"cudloun-title-wrap\";\n    const title = document.createElement(\"div\");\n    title.id = \"cudloun-title\";\n    title.className = \"cudloun-title\";\n    title.textContent = \"Cudloun\";\n\n    const subtitle = document.createElement(\"div\");\n    subtitle.className = \"cudloun-subtitle\";\n    subtitle.textContent = `Babeta module hub core ${root.coreVersion} / seed ${root.seedVersion} / manifest ${root.manifestVersion}`;\n\n    titleWrap.appendChild(title);\n    titleWrap.appendChild(subtitle);\n\n    const buttons = document.createElement(\"div\");\n    buttons.className = \"cudloun-head-actions\";\n\n    const collapse = document.createElement(\"button\");\n    collapse.className = \"cudloun-icon-button\";\n    collapse.type = \"button\";\n    collapse.setAttribute(\"aria-label\", hubCollapsed ? \"Expand\" : \"Collapse\");\n    collapse.textContent = hubCollapsed ? \"+\" : \"-\";\n    collapse.addEventListener(\"click\", () => {\n      hubCollapsed = !hubCollapsed;\n      root.storage.set(HUB_COLLAPSED_KEY, hubCollapsed);\n      root.log.info(\"hub\", hubCollapsed ? \"collapsed\" : \"expanded\");\n      renderHub(hubSelectedId);\n    });\n\n    const close = document.createElement(\"button\");\n    close.className = \"cudloun-icon-button\";\n    close.type = \"button\";\n    close.setAttribute(\"aria-label\", \"Close\");\n    close.textContent = \"x\";\n    close.addEventListener(\"click\", closeHub);\n\n    header.appendChild(titleWrap);\n    buttons.appendChild(collapse);\n    buttons.appendChild(close);\n    header.appendChild(buttons);\n    return header;\n  }\n\n  function startHubDrag(event) {\n    if (event.button !== 0) return;\n    if (event.target instanceof Element && event.target.closest(\"button,input,select,a,textarea\")) return;\n\n    const dialog = event.currentTarget.closest(\".cudloun-dialog\");\n    if (!(dialog instanceof HTMLElement)) return;\n\n    const rect = dialog.getBoundingClientRect();\n    const origin = {\n      pointerX: event.clientX,\n      pointerY: event.clientY,\n      left: rect.left,\n      top: rect.top,\n      width: rect.width,\n      height: rect.height,\n    };\n\n    dialog.dataset.dragging = \"true\";\n    event.currentTarget.setPointerCapture?.(event.pointerId);\n    event.preventDefault();\n\n    const onMove = (moveEvent) => {\n      const next = clampHubPosition({\n        left: origin.left + moveEvent.clientX - origin.pointerX,\n        top: origin.top + moveEvent.clientY - origin.pointerY,\n        width: origin.width,\n        height: origin.height,\n      });\n      hubPosition = next;\n      applyHubPosition(dialog);\n    };\n\n    const onEnd = () => {\n      dialog.dataset.dragging = \"false\";\n      if (hubPosition) root.storage.set(HUB_POSITION_KEY, hubPosition);\n      window.removeEventListener(\"pointermove\", onMove);\n      window.removeEventListener(\"pointerup\", onEnd);\n      window.removeEventListener(\"pointercancel\", onEnd);\n    };\n\n    window.addEventListener(\"pointermove\", onMove);\n    window.addEventListener(\"pointerup\", onEnd);\n    window.addEventListener(\"pointercancel\", onEnd);\n  }\n\n  function applyHubPosition(dialog) {\n    if (!hubPosition) {\n      dialog.style.removeProperty(\"--cudloun-hub-left\");\n      dialog.style.removeProperty(\"--cudloun-hub-top\");\n      dialog.dataset.dragged = \"false\";\n      return;\n    }\n\n    const rect = dialog.getBoundingClientRect();\n    const clamped = clampHubPosition({\n      left: hubPosition.left,\n      top: hubPosition.top,\n      width: rect.width || 320,\n      height: rect.height || 72,\n    });\n    hubPosition = clamped;\n    dialog.style.setProperty(\"--cudloun-hub-left\", `${Math.round(clamped.left)}px`);\n    dialog.style.setProperty(\"--cudloun-hub-top\", `${Math.round(clamped.top)}px`);\n    dialog.dataset.dragged = \"true\";\n  }\n\n  function validHubPosition(value) {\n    if (!value || typeof value !== \"object\") return null;\n    if (!Number.isFinite(value.left) || !Number.isFinite(value.top)) return null;\n    return {\n      left: value.left,\n      top: value.top,\n    };\n  }\n\n  function clampHubPosition(position) {\n    const margin = 8;\n    const maxLeft = Math.max(margin, window.innerWidth - position.width - margin);\n    const maxTop = Math.max(margin, window.innerHeight - position.height - margin);\n    return {\n      left: Math.min(Math.max(margin, position.left), maxLeft),\n      top: Math.min(Math.max(margin, position.top), maxTop),\n    };\n  }\n\n  function renderBody(mode, selectedModule) {\n    const body = document.createElement(\"div\");\n    body.className = \"cudloun-body\";\n\n    const list = document.createElement(\"div\");\n    list.className = \"cudloun-module-list\";\n    root.modules.forEach((module) => {\n      list.appendChild(renderModuleListItem(module, mode === \"module\" ? selectedModule?.id : null));\n    });\n    list.appendChild(renderDebugListItem(mode === \"debug\"));\n\n    const details = document.createElement(\"div\");\n    details.className = \"cudloun-module-details\";\n    details.appendChild(mode === \"debug\" ? renderDebugPanel() : renderModuleDetails(selectedModule));\n\n    body.appendChild(list);\n    body.appendChild(details);\n    return body;\n  }\n\n  function renderModuleListItem(module, selectedModuleId) {\n    const row = document.createElement(\"button\");\n    row.className = \"cudloun-module-row\";\n    row.type = \"button\";\n    row.dataset.selected = module.id === selectedModuleId ? \"true\" : \"false\";\n    row.addEventListener(\"click\", () => renderHub(module.id));\n\n    const text = document.createElement(\"span\");\n    text.className = \"cudloun-module-row-text\";\n    text.textContent = module.name;\n\n    const enabled = document.createElement(\"input\");\n    enabled.type = \"checkbox\";\n    enabled.checked = root.storage.isModuleEnabled(module.id);\n    enabled.setAttribute(\"aria-label\", `${module.name} enabled`);\n    enabled.addEventListener(\"click\", (event) => event.stopPropagation());\n    enabled.addEventListener(\"change\", () => {\n      root.storage.setModuleEnabled(module.id, enabled.checked);\n      renderHub(module.id);\n    });\n\n    row.appendChild(text);\n    row.appendChild(enabled);\n    return row;\n  }\n\n  function renderDebugListItem(selected) {\n    const row = document.createElement(\"button\");\n    row.className = \"cudloun-module-row\";\n    row.type = \"button\";\n    row.dataset.selected = selected ? \"true\" : \"false\";\n    row.addEventListener(\"click\", () => renderHub(\"debug\"));\n\n    const text = document.createElement(\"span\");\n    text.className = \"cudloun-module-row-text\";\n    text.textContent = \"Debug\";\n\n    const badge = document.createElement(\"span\");\n    badge.className = \"cudloun-debug-count\";\n    badge.textContent = String(root.log.entries.length);\n\n    row.appendChild(text);\n    row.appendChild(badge);\n    return row;\n  }\n\n  function renderModuleDetails(module) {\n    const panel = document.createElement(\"div\");\n    if (!module) {\n      panel.textContent = \"No modules registered yet.\";\n      return panel;\n    }\n\n    const eyebrow = document.createElement(\"div\");\n    eyebrow.className = \"cudloun-eyebrow\";\n    eyebrow.textContent = `Module ${module.version}`;\n\n    const title = document.createElement(\"h2\");\n    title.className = \"cudloun-module-title\";\n    title.textContent = module.name;\n\n    const description = document.createElement(\"p\");\n    description.className = \"cudloun-module-copy\";\n    description.textContent = module.description || \"\";\n\n    const enabled = document.createElement(\"label\");\n    enabled.className = \"cudloun-toggle\";\n    const checkbox = document.createElement(\"input\");\n    checkbox.type = \"checkbox\";\n    checkbox.checked = root.storage.isModuleEnabled(module.id);\n    checkbox.addEventListener(\"change\", () => {\n      root.storage.setModuleEnabled(module.id, checkbox.checked);\n      renderHub(module.id);\n    });\n    enabled.appendChild(checkbox);\n    enabled.appendChild(document.createTextNode(\"Enabled\"));\n\n    const actions = document.createElement(\"div\");\n    actions.className = \"cudloun-actions\";\n\n    if (module.actionLabel && typeof module.action === \"function\") {\n      const action = document.createElement(\"button\");\n      action.className = \"cudloun-button\";\n      action.type = \"button\";\n      action.disabled = !root.storage.isModuleEnabled(module.id);\n      action.textContent = module.actionLabel;\n      action.addEventListener(\"click\", () => {\n        root.log.info(\"module\", \"action\", module.id, module.actionLabel);\n        module.action(root.makeModuleContext(module));\n      });\n      actions.appendChild(action);\n    }\n\n    const help = document.createElement(\"div\");\n    help.className = \"cudloun-help\";\n    const helpTitle = document.createElement(\"h3\");\n    helpTitle.textContent = \"Help\";\n    help.appendChild(helpTitle);\n\n    const helpLines = typeof module.renderHelp === \"function\" ? module.renderHelp(root.makeModuleContext(module)) : [];\n    if (helpLines.length) {\n      helpLines.forEach((line) => {\n        const paragraph = document.createElement(\"p\");\n        paragraph.textContent = line;\n        help.appendChild(paragraph);\n      });\n    } else {\n      const paragraph = document.createElement(\"p\");\n      paragraph.textContent = \"This module has no help page yet.\";\n      help.appendChild(paragraph);\n    }\n\n    panel.appendChild(eyebrow);\n    panel.appendChild(title);\n    panel.appendChild(description);\n    panel.appendChild(enabled);\n    panel.appendChild(actions);\n\n    if (typeof module.renderSettings === \"function\") {\n      const custom = module.renderSettings(root.makeModuleContext(module));\n      if (custom) {\n        panel.appendChild(custom);\n      }\n    }\n\n    if (root.feedback && typeof root.feedback.renderThread === \"function\") {\n      panel.appendChild(root.feedback.renderThread({\n        kind: \"module\",\n        id: module.id,\n        name: module.name,\n      }));\n    }\n\n    panel.appendChild(help);\n    return panel;\n  }\n\n  function renderDebugPanel() {\n    const panel = document.createElement(\"div\");\n\n    const eyebrow = document.createElement(\"div\");\n    eyebrow.className = \"cudloun-eyebrow\";\n    eyebrow.textContent = `Route ${root.currentRoute()}`;\n\n    const title = document.createElement(\"h2\");\n    title.className = \"cudloun-module-title\";\n    title.textContent = \"Debug\";\n\n    const controls = document.createElement(\"div\");\n    controls.className = \"cudloun-actions\";\n\n    const select = document.createElement(\"select\");\n    select.className = \"cudloun-select\";\n    root.logger.levels.forEach((level) => {\n      const option = document.createElement(\"option\");\n      option.value = level;\n      option.textContent = level;\n      option.selected = root.log.level() === level;\n      select.appendChild(option);\n    });\n    select.addEventListener(\"change\", () => root.logger.setLevel(select.value));\n\n    const clear = document.createElement(\"button\");\n    clear.className = \"cudloun-button cudloun-button-secondary\";\n    clear.type = \"button\";\n    clear.textContent = \"Clear\";\n    clear.addEventListener(\"click\", () => {\n      root.logger.clear();\n      renderHub(\"debug\");\n    });\n\n    const copy = document.createElement(\"button\");\n    copy.className = \"cudloun-button cudloun-button-secondary\";\n    copy.type = \"button\";\n    copy.textContent = \"Copy log\";\n    copy.addEventListener(\"click\", () => {\n      copyText(debugLogText()).then(() => {\n        root.log.info(\"debug\", \"log copied\");\n        renderHub(\"debug\");\n      }).catch((error) => root.log.warn(\"debug\", \"copy failed\", error));\n    });\n\n    const exportLog = document.createElement(\"button\");\n    exportLog.className = \"cudloun-button cudloun-button-secondary\";\n    exportLog.type = \"button\";\n    exportLog.textContent = \"Export log\";\n    exportLog.addEventListener(\"click\", () => {\n      exportTextFile(`cudloun-debug-${new Date().toISOString().replace(/[:.]/g, \"-\")}.txt`, debugLogText());\n      root.log.info(\"debug\", \"log export prepared\");\n      renderHub(\"debug\");\n    });\n\n    controls.appendChild(select);\n    controls.appendChild(copy);\n    controls.appendChild(exportLog);\n    controls.appendChild(clear);\n\n    const meta = document.createElement(\"div\");\n    meta.className = \"cudloun-debug-meta\";\n    meta.textContent = [\n      `Seed: ${root.seedVersion}`,\n      `Core: ${root.coreVersion}`,\n      `Manifest: ${root.manifestVersion}`,\n      `Loaded files: ${root.loadedFiles.map((file) => file.id).join(\", \") || \"none\"}`,\n    ].join(\" | \");\n\n    const logBox = document.createElement(\"div\");\n    logBox.className = \"cudloun-log-box\";\n    root.logger.recent(160).forEach((entry) => logBox.appendChild(renderLogEntry(entry)));\n\n    panel.appendChild(eyebrow);\n    panel.appendChild(title);\n    panel.appendChild(controls);\n    panel.appendChild(meta);\n    panel.appendChild(logBox);\n    return panel;\n  }\n\n  function renderLogEntry(entry) {\n    const row = document.createElement(\"div\");\n    row.className = \"cudloun-log-entry\";\n    row.dataset.level = entry.level;\n\n    const time = entry.time.slice(11, 19);\n    const args = entry.args.map((arg) => {\n      if (arg instanceof Error) return arg.message;\n      if (typeof arg === \"string\") return arg;\n      try {\n        return JSON.stringify(arg);\n      } catch (error) {\n        return String(arg);\n      }\n    }).join(\" \");\n\n    row.textContent = `${time} [${entry.level}] ${entry.area}: ${args}`;\n    return row;\n  }\n\n  function debugLogText() {\n    return root.logger.recent(500).map((entry) => {\n      const args = entry.args.map((arg) => {\n        if (arg instanceof Error) return arg.message;\n        if (typeof arg === \"string\") return arg;\n        try {\n          return JSON.stringify(arg);\n        } catch (error) {\n          return String(arg);\n        }\n      }).join(\" \");\n\n      return `${entry.time} [${entry.level}] ${entry.area}: ${args}`;\n    }).join(\"\\n\");\n  }\n\n  async function copyText(text) {\n    if (!navigator.clipboard || !navigator.clipboard.writeText) {\n      throw new Error(\"Clipboard API is not available\");\n    }\n    await navigator.clipboard.writeText(text);\n  }\n\n  function exportTextFile(filename, text) {\n    const blob = new Blob([text], { type: \"text/plain;charset=utf-8\" });\n    const url = URL.createObjectURL(blob);\n    const link = document.createElement(\"a\");\n    link.href = url;\n    link.download = filename;\n    document.body.appendChild(link);\n    link.click();\n    link.remove();\n    window.setTimeout(() => URL.revokeObjectURL(url), 1000);\n  }\n\n  function installStyles() {\n    if (document.head.querySelector(`[${STYLE_ATTR}]`)) return;\n\n    const style = document.createElement(\"style\");\n    style.setAttribute(STYLE_ATTR, \"true\");\n    style.textContent = `\n      .cudloun-backdrop{position:fixed;inset:0;z-index:1600;display:flex;align-items:center;justify-content:center;padding:42px 20px 20px;background:rgba(26,32,44,.34);backdrop-filter:blur(2px);box-sizing:border-box}\n      .cudloun-dialog{position:relative;box-sizing:border-box;width:min(860px,calc(100vw - 28px));max-height:min(760px,calc(100vh - 62px));display:flex;flex-direction:column;overflow:visible;border:1px solid rgba(79,102,134,.34);border-radius:8px;background:#f6f8fb;box-shadow:0 18px 48px rgba(18,27,43,.24);color:#182230;font-family:inherit}\n      .cudloun-dialog[data-dragged=true]{position:fixed;left:var(--cudloun-hub-left);top:var(--cudloun-hub-top);margin:0}\n      .cudloun-dialog[data-collapsed=true]{width:min(430px,calc(100vw - 16px));overflow:hidden}\n      .cudloun-mascot{position:absolute;left:-73px;top:0;width:100px;max-width:26vw;height:auto;transform:translateY(-48%);pointer-events:none;filter:drop-shadow(0 6px 5px rgba(18,27,43,.25));z-index:2}\n      .cudloun-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 20px 14px;border-top-left-radius:8px;border-top-right-radius:8px;border-bottom:1px solid rgba(79,102,134,.2);background:#fff;cursor:grab;touch-action:none;user-select:none}\n      .cudloun-dialog[data-dragging=true] .cudloun-head{cursor:grabbing}\n      .cudloun-title-wrap{min-width:0}\n      .cudloun-title{font-size:1.15rem;font-weight:750;letter-spacing:0}\n      .cudloun-subtitle,.cudloun-eyebrow{margin-top:3px;color:#697586;font-size:.78rem;letter-spacing:0}\n      .cudloun-head-actions{display:flex;align-items:center;gap:8px;flex:0 0 auto}\n      .cudloun-icon-button{appearance:none;width:32px;height:32px;border:1px solid rgba(79,102,134,.2);border-radius:6px;background:#fff;color:#4b5565;cursor:pointer;font:700 1rem/1 inherit;flex:0 0 auto}\n      .cudloun-icon-button:hover{background:#eef2f7}\n      .cudloun-menu-action-button{appearance:none;min-width:0;flex:1 1 0;display:inline-flex;align-items:center;justify-content:center;gap:5px;border:1px solid rgba(79,102,134,.24);border-radius:6px;background:#f8fafc;color:#243041;cursor:pointer;font:600 .8rem/1.2 inherit;padding:7px 5px}\n      .cudloun-menu-action-button:hover{background:#eef2f7}\n      .cudloun-menu-action-button svg{width:18px;height:18px;flex:0 0 auto;fill:currentColor}\n      .cudloun-menu-action-button span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n      .cudloun-kapybara-menu-item{appearance:none;width:100%;min-height:56px;display:flex;align-items:center;gap:24px;margin:0;padding:12px 40px;border:0;background:transparent;color:inherit;cursor:pointer;font:inherit;text-align:left}\n      .cudloun-kapybara-menu-item:hover{background:rgba(128,128,128,.08)}\n      .cudloun-kapybara-menu-item svg{width:24px;height:24px;flex:0 0 auto;fill:#b06a00;color:#b06a00}\n      .cudloun-kapybara-menu-item span{font-size:1rem;line-height:1.35}\n      .cudloun-kapybara-action-row{display:flex;align-items:center;gap:8px;padding:4px 40px 12px}\n      .cudloun-restore-fullscreen{position:fixed;left:50%;top:14px;z-index:1900;display:flex;align-items:center;gap:8px;transform:translateX(-50%);padding:8px;border:1px solid rgba(79,102,134,.28);border-radius:8px;background:#fff;box-shadow:0 10px 28px rgba(18,27,43,.22);font-family:inherit}\n      .cudloun-restore-fullscreen button{appearance:none;border:1px solid rgba(79,102,134,.24);border-radius:6px;background:#f8fafc;color:#243041;cursor:pointer;font:700 .86rem/1.2 inherit;padding:8px 10px}\n      .cudloun-restore-fullscreen button:hover{background:#eef2f7}\n      .cudloun-body{min-height:390px;display:grid;grid-template-columns:minmax(190px,250px) 1fr;overflow:hidden}\n      .cudloun-module-list{overflow:auto;padding:12px;border-right:1px solid rgba(79,102,134,.18);background:#edf2f7}\n      .cudloun-module-row{appearance:none;width:100%;min-height:42px;display:grid;grid-template-columns:1fr auto;align-items:center;gap:10px;margin:0 0 8px;padding:9px 10px;border:1px solid transparent;border-radius:6px;background:transparent;color:#243041;cursor:pointer;font:inherit;text-align:left}\n      .cudloun-module-row[data-selected=true],.cudloun-module-row:hover{border-color:rgba(76,111,166,.24);background:#fff}\n      .cudloun-module-row-text{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:650}\n      .cudloun-debug-count{min-width:22px;padding:2px 6px;border-radius:999px;background:#d8e2ef;color:#364152;text-align:center;font-size:.76rem;font-weight:700}\n      .cudloun-module-details{overflow:auto;padding:22px;background:#f8fafc}\n      .cudloun-module-title{margin:8px 0;color:#182230;font-size:1.35rem;line-height:1.2;letter-spacing:0}\n      .cudloun-module-copy{max-width:58ch;margin:0 0 16px;color:#4b5565;line-height:1.5}\n      .cudloun-toggle{display:inline-flex;align-items:center;gap:8px;margin:0 0 18px;color:#364152;font-weight:650}\n      .cudloun-actions{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 18px;align-items:center}\n      .cudloun-button{appearance:none;border:1px solid rgba(8,126,164,.34);border-radius:6px;padding:9px 13px;background:#087ea4;color:#fff;cursor:pointer;font:700 .92rem/1.2 inherit}\n      .cudloun-button:hover{background:#096f91}\n      .cudloun-button:disabled{opacity:.48;cursor:default}\n      .cudloun-button-secondary{background:#4b5565;border-color:rgba(75,85,101,.34)}\n      .cudloun-button-secondary:hover{background:#364152}\n      .cudloun-select{min-height:36px;border:1px solid rgba(79,102,134,.32);border-radius:6px;background:#fff;color:#182230;padding:0 10px;font:inherit}\n      .cudloun-help{max-width:62ch;padding-top:14px;border-top:1px solid rgba(79,102,134,.18);color:#4b5565}\n      .cudloun-help h3{margin:0 0 8px;color:#243041;font-size:.95rem;letter-spacing:0}\n      .cudloun-help p{margin:0 0 8px;line-height:1.45}\n      .cudloun-container-list{max-width:680px;margin:0 0 18px;display:flex;flex-direction:column;gap:10px}\n      .cudloun-container-card{border:1px solid rgba(79,102,134,.22);border-radius:8px;background:#fff;padding:12px}\n      .cudloun-container-card h3{margin:0 0 6px;color:#243041;font-size:1rem;letter-spacing:0}\n      .cudloun-container-card p{margin:0 0 10px;color:#4b5565;line-height:1.4}\n      .cudloun-container-actions{display:flex;flex-wrap:wrap;gap:8px}\n      .cudloun-feedback{box-sizing:border-box;width:100%;max-width:680px;min-width:0;margin:18px 0 18px;padding:12px;border:1px solid rgba(79,102,134,.22);border-radius:8px;background:#fff;overflow:hidden}\n      .cudloun-feedback-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 4px}\n      .cudloun-feedback h3{margin:0;color:#243041;font-size:1rem;letter-spacing:0}\n      .cudloun-feedback-meta{margin:0 0 10px;color:#697586;font-size:.78rem;line-height:1.3}\n      .cudloun-feedback-refresh{appearance:none;border:1px solid rgba(79,102,134,.24);border-radius:6px;background:#f8fafc;color:#243041;cursor:pointer;font:700 .78rem/1.2 inherit;padding:6px 8px}\n      .cudloun-feedback-refresh:hover{background:#eef2f7}\n      .cudloun-feedback-messages{box-sizing:border-box;max-width:100%;max-height:260px;overflow:auto;margin:0 0 12px;border:1px solid rgba(79,102,134,.16);border-radius:6px;background:#f8fafc}\n      .cudloun-feedback-empty{padding:12px;color:#697586}\n      .cudloun-feedback-message{box-sizing:border-box;min-width:0;padding:10px 12px;border-bottom:1px solid rgba(79,102,134,.13);background:#fff}\n      .cudloun-feedback-message:last-child{border-bottom:0}\n      .cudloun-feedback-message[data-reply=true]{border-left:3px solid rgba(8,126,164,.28)}\n      .cudloun-feedback-message[data-depth=\"1\"]{margin-left:12px}\n      .cudloun-feedback-message[data-depth=\"2\"]{margin-left:24px}\n      .cudloun-feedback-message[data-depth=\"3\"]{margin-left:36px}\n      .cudloun-feedback-message-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin:0 0 5px}\n      .cudloun-feedback-message-head strong{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#243041;font-size:.88rem}\n      .cudloun-feedback-message-head time{flex:0 0 auto;color:#697586;font-size:.74rem}\n      .cudloun-feedback-parent{margin:0 0 5px;color:#697586;font-size:.76rem;line-height:1.25;overflow-wrap:anywhere}\n      .cudloun-feedback-text{min-width:0;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;color:#364152;line-height:1.42}\n      .cudloun-feedback-image-link{display:block;width:max-content;max-width:100%;margin:8px 0 2px}\n      .cudloun-feedback-image{display:block;max-width:100%;max-height:280px;border-radius:6px;border:1px solid rgba(79,102,134,.18);object-fit:contain;background:#f8fafc}\n      .cudloun-feedback-message-actions{display:flex;justify-content:flex-end;margin:7px 0 0}\n      .cudloun-feedback-message-actions button,.cudloun-feedback-reply-target button{appearance:none;border:1px solid rgba(79,102,134,.22);border-radius:6px;background:#f8fafc;color:#243041;cursor:pointer;font:700 .74rem/1.2 inherit;padding:5px 7px}\n      .cudloun-feedback-message-actions button:hover,.cudloun-feedback-reply-target button:hover{background:#eef2f7}\n      .cudloun-feedback-message-actions button:disabled{opacity:.55;cursor:default}\n      .cudloun-feedback-message-actions .cudloun-feedback-delete{border-color:rgba(180,35,24,.22);background:#fff5f4;color:#b42318}\n      .cudloun-feedback-message-actions .cudloun-feedback-delete:hover{background:#ffe7e5}\n      .cudloun-feedback-replies{margin:8px 0 0}\n      .cudloun-feedback-form{display:grid;min-width:0;max-width:100%;gap:8px}\n      .cudloun-feedback-reply-target{box-sizing:border-box;display:flex;align-items:flex-start;justify-content:space-between;gap:8px;min-width:0;max-width:100%;min-height:32px;padding:7px 8px;border:1px solid rgba(8,126,164,.22);border-radius:6px;background:#eef8fb;color:#364152;font-size:.8rem;overflow:hidden}\n      .cudloun-feedback-reply-target[hidden]{display:none}\n      .cudloun-feedback-reply-target span{min-width:0;overflow-wrap:anywhere;line-height:1.3}\n      .cudloun-feedback-author,.cudloun-feedback textarea{box-sizing:border-box;width:100%;border:1px solid rgba(79,102,134,.28);border-radius:6px;background:#fff;color:#182230;font:inherit}\n      .cudloun-feedback-author{min-height:36px;padding:0 10px}\n      .cudloun-feedback textarea{display:block;max-width:100%;min-height:82px;resize:vertical;padding:9px 10px;line-height:1.38}\n      .cudloun-feedback-actions{display:flex;align-items:center;justify-content:space-between;gap:10px}\n      .cudloun-feedback-status{min-width:0;color:#697586;font-size:.82rem}\n      .cudloun-settings-list{max-width:520px;margin:0 0 18px}\n      .cudloun-setting-row{display:flex;align-items:center;justify-content:space-between;gap:14px;min-height:44px;padding:10px 12px;border:1px solid rgba(79,102,134,.22);border-radius:8px;background:#fff;color:#243041;font-weight:650}\n      .cudloun-setting-text{min-width:0}\n      .cudloun-code-box{max-width:680px;margin:8px 0 16px;padding:10px;border:1px solid rgba(79,102,134,.2);border-radius:6px;background:#101828;color:#e4e7ec;font:12px/1.45 Consolas,monospace;white-space:pre-wrap;word-break:break-word}\n      .cudloun-debug-meta{margin:0 0 12px;color:#697586;font-size:.82rem;line-height:1.35}\n      .cudloun-log-box{max-height:430px;overflow:auto;border:1px solid rgba(79,102,134,.2);border-radius:6px;background:#101828;color:#e4e7ec;font:12px/1.45 Consolas,monospace}\n      .cudloun-log-entry{padding:5px 8px;border-bottom:1px solid rgba(255,255,255,.07);white-space:pre-wrap;word-break:break-word}\n      .cudloun-log-entry[data-level=error]{color:#ffb4b4}\n      .cudloun-log-entry[data-level=warn]{color:#ffd18a}\n      .cudloun-log-entry[data-level=debug]{color:#9fd0ff}\n      .cudloun-log-entry[data-level=trace]{color:#d8c4ff}\n      @media (max-width:680px){.cudloun-backdrop{align-items:center;justify-content:center;padding:8px;background:rgba(26,32,44,.25)}.cudloun-dialog{width:calc(100vw - 16px);height:auto;max-height:calc(100dvh - 16px);border-radius:10px;overflow:hidden}.cudloun-dialog[data-collapsed=true]{width:min(390px,calc(100vw - 16px))}.cudloun-mascot{left:-36px;top:10px;width:58px;max-width:18vw;transform:none;opacity:.95}.cudloun-head{position:sticky;top:0;z-index:3;gap:10px;padding:12px 12px 10px 42px}.cudloun-title{font-size:1rem}.cudloun-subtitle{font-size:.68rem;line-height:1.25}.cudloun-body{min-height:0;max-height:calc(100dvh - 84px);display:flex;flex-direction:column;overflow:hidden}.cudloun-module-list{display:flex;gap:8px;min-height:56px;max-height:96px;overflow-x:auto;overflow-y:hidden;padding:8px;border-right:0;border-bottom:1px solid rgba(79,102,134,.18)}.cudloun-module-row{flex:0 0 auto;width:auto;min-width:118px;min-height:40px;margin:0;padding:8px 9px;background:#f8fafc;border-color:rgba(79,102,134,.16)}.cudloun-module-row-text{font-size:.84rem}.cudloun-module-details{flex:1;min-height:0;overflow:auto;padding:16px 12px 24px}.cudloun-module-title{font-size:1.18rem}.cudloun-container-card{padding:10px}.cudloun-container-actions{gap:7px}.cudloun-feedback{margin:14px 0;padding:10px}.cudloun-feedback-messages{max-height:220px}.cudloun-button{padding:8px 10px;font-size:.84rem}.cudloun-code-box{font-size:11px}.cudloun-log-box{max-height:52vh;font-size:11px}}\n    `;\n    document.head.appendChild(style);\n  }\n})();\n");
  embeddedScripts.set("modules/sys-menu.js", function () {
    // Cudloun Babeta avatar menu and hub UI.
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
        injectIntoAvatarMenu,
        injectIntoMobileDrawerMenu,
        injectIntoKapybaraAvatarMenu,
      };

      function start() {
        installStyles();
        maybeShowRestoreFullscreenPrompt();
        observeAvatarMenu();
        observeRouteChanges();
        injectIntoAvatarMenu();
        injectIntoMobileDrawerMenu();
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
            injectIntoAvatarMenu();
            injectIntoMobileDrawerMenu();
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

      function observeRouteChanges() {
        const check = () => {
          const route = root.currentRoute();
          if (route !== lastRoute) {
            lastRoute = route;
            root.log.info("router", "route changed", route);
            injectIntoAvatarMenu();
            injectIntoMobileDrawerMenu();
            injectIntoKapybaraAvatarMenu();
          }
          routeTimer = window.setTimeout(check, 500);
        };

        routeTimer = window.setTimeout(check, 500);
      }

      function injectIntoAvatarMenu() {
        const menu = visibleAvatarMenu();
        if (!menu) {
          root.log.trace("menu", "avatar menu not present");
          return;
        }

        if (menu.querySelector(`[${MENU_ITEM_ATTR}]`)) {
          root.log.trace("menu", "avatar menu items already present");
          return;
        }

        const firstItem = menu.querySelector("li[role='menuitem']");
        if (!firstItem) {
          root.log.warn("menu", "avatar menu found without menuitem");
          return;
        }

        const divider = menu.querySelector("hr");
        const item = makeMenuItem(firstItem, "Cudloun");
        item.addEventListener("click", openHub);

        const controlsItem = showFullscreenControls() ? makeMenuActionRow(firstItem) : null;

        if (divider) {
          divider.before(item);
          if (controlsItem) item.after(controlsItem);
        } else {
          menu.appendChild(item);
          if (controlsItem) menu.appendChild(controlsItem);
        }

        root.log.info("menu", "avatar menu items injected", divider ? "before divider" : "at end", menuDebug(menu));
      }

      function injectIntoMobileDrawerMenu() {
        const menu = visibleMobileDrawerMenu();
        if (!menu) {
          root.log.trace("menu", "mobile drawer menu not present");
          return;
        }

        if (menu.querySelector(`[${MENU_ITEM_ATTR}]`)) {
          root.log.trace("menu", "mobile drawer menu items already present");
          return;
        }

        const firstItem = menu.querySelector("li[role='menuitem']");
        if (!firstItem) {
          root.log.warn("menu", "mobile drawer found without menuitem");
          return;
        }

        const item = makeMobileMenuItem(firstItem, "Cudloun");
        item.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          dismissBabetaMenu(event.currentTarget);
          openHub();
        });

        const controlsItem = showFullscreenControls() ? makeMenuActionRow(firstItem, true) : null;

        const logout = Array.from(menu.querySelectorAll("li[role='menuitem']"))
          .find((li) => li.textContent.includes("Odhlásit"));

        if (logout) {
          logout.before(item);
          if (controlsItem) item.after(controlsItem);
        } else {
          menu.appendChild(item);
          if (controlsItem) menu.appendChild(controlsItem);
        }

        root.log.info("menu", "mobile drawer menu items injected", menuDebug(menu));
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

      function visibleAvatarMenu() {
        const menus = Array.from(document.querySelectorAll(".MuiMenu-paper ul[role='menu']"));
        const visibleMenus = menus.filter((menu) => {
          const rect = menu.getBoundingClientRect();
          const style = window.getComputedStyle(menu);
          return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
        });

        if (menus.length > 1) {
          root.log.debug("menu", "candidate avatar menus", menus.map(menuDebug));
        }

        return visibleMenus[visibleMenus.length - 1] || menus[menus.length - 1] || null;
      }

      function visibleMobileDrawerMenu() {
        const menus = Array.from(document.querySelectorAll(".MuiDrawer-paperAnchorBottom ul.MuiList-root"));
        const visibleMenus = menus.filter((menu) => {
          const rect = menu.getBoundingClientRect();
          const style = window.getComputedStyle(menu);
          const rootNode = menu.closest(".MuiDrawer-root");
          const rootClass = String(rootNode?.className || "");
          const text = menu.textContent.replace(/\s+/g, "");
          const onscreen = rect.top < window.innerHeight && rect.bottom > 0;
          return (
            rect.width > 0 &&
            rect.height > 0 &&
            onscreen &&
            !rootClass.includes("MuiModal-hidden") &&
            style.visibility !== "hidden" &&
            style.display !== "none" &&
            text.includes("Barevnéschéma") &&
            (text.includes("Nastavení") || text.includes("Přihlásit"))
          );
        });

        if (menus.length > 1) {
          root.log.debug("menu", "candidate mobile drawer menus", menus.map(menuDebug));
        }

        return visibleMenus.sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top)[0] || null;
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
        if (rect.width < 220 || rect.height < 120) return false;
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

      function makeMenuItem(firstItem, labelText = "Cudloun") {
        const item = document.createElement("li");
        item.className = firstItem.className || "";
        item.setAttribute(MENU_ITEM_ATTR, "true");
        item.setAttribute("tabindex", "-1");
        item.setAttribute("role", "menuitem");
        item.style.cssText = [
          firstItem.getAttribute("style") || "",
          "cursor:pointer;",
          "display:flex;",
          "align-items:center;",
          "gap:16px;",
          "min-height:48px;",
        ].join("");

        const icon = document.createElement("div");
        icon.className = firstItem.querySelector("div")?.className || "";
        icon.innerHTML = labelText === "Fullscreen" ? fullscreenIconSvg() : menuIconSvg();

        const label = document.createElement("span");
        label.textContent = labelText;

        item.appendChild(icon);
        item.appendChild(label);
        return item;
      }

      function makeMobileMenuItem(firstItem, labelText = "Cudloun") {
        const item = firstItem.cloneNode(true);
        item.setAttribute(MENU_ITEM_ATTR, "true");
        item.setAttribute("tabindex", "-1");
        item.setAttribute("role", "menuitem");
        item.style.cursor = "pointer";

        const iconWrap = item.querySelector(".MuiListItemIcon-root") || item.querySelector("svg")?.parentElement;
        if (iconWrap) iconWrap.innerHTML = labelText === "Fullscreen" ? fullscreenIconSvg() : menuIconSvg();

        const label = item.querySelector(".MuiListItemText-root span") || item.querySelector(".MuiListItemText-root") || item;
        label.textContent = labelText;

        return item;
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

      function makeMenuActionRow(firstItem, mobile = false) {
        const item = document.createElement("li");
        item.className = firstItem.className || "";
        item.setAttribute(FULLSCREEN_ITEM_ATTR, "true");
        item.setAttribute("tabindex", "-1");
        item.setAttribute("role", "menuitem");
        item.style.cssText = [
          firstItem.getAttribute("style") || "",
          "cursor:default;",
          "display:flex;",
          "align-items:center;",
          "gap:8px;",
          "min-height:48px;",
          mobile ? "padding:8px 16px;" : "padding:8px 16px;",
        ].join("");

        item.appendChild(makeMenuActionButton("Full", fullscreenIconSvg(), toggleFullscreen, "Fullscreen"));
        item.appendChild(makeMenuActionButton("Refresh", refreshPageIconSvg(), refreshPage));
        return item;
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

        const menuPaper = event?.currentTarget?.closest(".MuiMenu-paper");
        if (menuPaper) menuPaper.style.display = "none";
        dismissBabetaMenu(event?.currentTarget);

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

        const menuPaper = event?.currentTarget?.closest(".MuiMenu-paper");
        if (menuPaper) menuPaper.style.display = "none";
        dismissBabetaMenu(event?.currentTarget);
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
        injectIntoAvatarMenu();
        injectIntoMobileDrawerMenu();
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
          const menuPaper = eventOrModuleId.currentTarget?.closest(".MuiMenu-paper");
          if (menuPaper) menuPaper.style.display = "none";
          dismissBabetaMenu(eventOrModuleId.currentTarget);
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

      function dismissBabetaMenu(target) {
        const drawerRoot = target?.closest?.(".MuiDrawer-root");
        if (!drawerRoot) return;

        drawerRoot.style.removeProperty("display");

        const backdrop = drawerRoot.querySelector(".MuiBackdrop-root");
        if (backdrop && window.getComputedStyle(backdrop).display !== "none") {
          backdrop.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
          return;
        }

        document.dispatchEvent(new KeyboardEvent("keydown", {
          key: "Escape",
          code: "Escape",
          keyCode: 27,
          which: 27,
          bubbles: true,
          cancelable: true,
        }));
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
        subtitle.textContent = `Babeta module hub core ${root.coreVersion} / seed ${root.seedVersion} / manifest ${root.manifestVersion}`;

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

  embeddedText.set("modules/settoun.js", "// Cudloun framework settings.\n(function () {\n  \"use strict\";\n\n  const root = window.Cudloun;\n\n  root.registerModule({\n    id: \"settoun\",\n    name: \"Settoun\",\n    description: \"Framework settings for Cudloun's own Babeta menu behavior.\",\n    version: \"0.1.0\",\n    defaultEnabled: true,\n    renderSettings(ctx) {\n      const wrap = document.createElement(\"div\");\n      wrap.className = \"cudloun-settings-list\";\n\n      const label = document.createElement(\"label\");\n      label.className = \"cudloun-setting-row\";\n\n      const text = document.createElement(\"span\");\n      text.className = \"cudloun-setting-text\";\n      text.textContent = \"Show fullscreen\";\n\n      const checkbox = document.createElement(\"input\");\n      checkbox.type = \"checkbox\";\n      checkbox.checked = ctx.storage.get(\"showFullscreen\", true) !== false;\n      checkbox.addEventListener(\"change\", () => {\n        ctx.storage.set(\"showFullscreen\", checkbox.checked);\n        root.ui?.refreshMenuItems?.();\n        ctx.hub.render();\n      });\n\n      label.appendChild(text);\n      label.appendChild(checkbox);\n      wrap.appendChild(label);\n      return wrap;\n    },\n    renderHelp() {\n      return [\n        \"Settoun holds settings for Cudloun itself.\",\n        \"Show fullscreen controls whether the Babeta avatar menu includes the Fullscreen and Refresh quick actions.\",\n      ];\n    },\n  });\n})();\n");
  embeddedScripts.set("modules/settoun.js", function () {
    // Cudloun framework settings.
    (function () {
      "use strict";

      const root = window.Cudloun;

      root.registerModule({
        id: "settoun",
        name: "Settoun",
        description: "Framework settings for Cudloun's own Babeta menu behavior.",
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
            "Show fullscreen controls whether the Babeta avatar menu includes the Fullscreen and Refresh quick actions.",
          ];
        },
      });
    })();

  });

  embeddedText.set("modules/post-tweaks.js", "// Cudloun module: tune mobile board post layout.\n(function () {\n  \"use strict\";\n\n  const root = window.Cudloun;\n  const ID = \"post-tweaks\";\n  const STYLE_ID = \"cudloun-container-post-tweaks-style\";\n  const PANEL_ID = \"cudloun-container-post-tweaks-panel\";\n  const STORAGE_KEY = \"cudloun.container.postTweaks.v1\";\n  const LEGACY_STORAGE_KEY = \"cudloun.container.textWidth.v1\";\n  const MARK_POST = \"data-cudloun-post-tweaks-post\";\n  const MARK_FIRST_POST = \"data-cudloun-post-tweaks-first-post\";\n  const MARK_ROW = \"data-cudloun-post-tweaks-row\";\n  const MARK_AVATAR = \"data-cudloun-post-tweaks-avatar\";\n  const MARK_CONTENT = \"data-cudloun-post-tweaks-content\";\n  const MARK_HEADER = \"data-cudloun-post-tweaks-header\";\n  const MARK_BODY = \"data-cudloun-post-tweaks-body\";\n  const MARK_ACTIONS = \"data-cudloun-post-tweaks-actions\";\n  const MARK_REPLY = \"data-cudloun-post-tweaks-reply\";\n  const MARK_REPLY_MENU = \"data-cudloun-post-tweaks-reply-menu\";\n  const MARK_NATIVE_MENU_HOOK = \"data-cudloun-post-tweaks-native-menu-hook\";\n  const MARK_NATIVE_MENU_MODAL = \"data-cudloun-post-tweaks-native-menu-modal\";\n  const MARK_NATIVE_MENU_POPOUT = \"data-cudloun-post-tweaks-native-menu-popout\";\n  const MARK_NATIVE_MENU_SUPPRESSED = \"data-cudloun-post-tweaks-native-menu-suppressed\";\n  const MARK_NATIVE_REPLY_ITEM = \"data-cudloun-post-tweaks-native-reply-item\";\n  const MARK_REPLY_META = \"data-cudloun-post-tweaks-reply-meta\";\n  const MARK_DATE_WRAP = \"data-cudloun-post-tweaks-date-wrap\";\n  const COLOR_OPTIONS = [\n    { value: \"#ffffff\", label: \"White\" },\n    { value: \"#f8fafc\", label: \"Soft gray\" },\n    { value: \"#fff7df\", label: \"Warm\" },\n    { value: \"#edf7ff\", label: \"Blue\" },\n    { value: \"#edfdf4\", label: \"Green\" },\n  ];\n\n  const defaults = {\n    enabled: true,\n    panelVisible: true,\n    avatarInline: false,\n    divider: false,\n    dividerDashed: false,\n    dividerWidth: 1,\n    dividerColor: \"#000000\",\n    background: false,\n    backgroundColor: \"#ffffff\",\n    rounded: false,\n    radius: 0,\n    avatarSize: 28,\n    cardInset: 0,\n    sidePadding: 4,\n    postSpacing: 4,\n    headerScale: 88,\n    fontScale: 100,\n    replyPlacement: \"bottom\",\n    replyMetaInHeader: false,\n    nativeMenuPopout: false,\n    avatarMenu: true,\n  };\n\n  let observer = null;\n  let nativePopoutListenerInstalled = false;\n  let settings = loadSettings();\n  const postState = new WeakMap();\n\n  const api = {\n    id: ID,\n    name: \"Post Tweaks\",\n    run,\n    showPanel,\n    stop,\n  };\n\n  window.CudlounPostTweaks = api;\n\n  if (root && typeof root.registerModule === \"function\") {\n    root.registerModule({\n      id: ID,\n      name: \"Post Tweaks\",\n      description: \"Tune board post layout, spacing, dividers, background, reply placement, and post menu behavior.\",\n      version: \"0.2.8\",\n      defaultEnabled: false,\n      actionLabel: \"Show panel\",\n      start() {\n        run();\n        return stop;\n      },\n      action() {\n        showPanel();\n      },\n      renderSettings() {\n        const wrap = document.createElement(\"div\");\n        wrap.className = \"cudloun-settings-list\";\n\n        const row = document.createElement(\"div\");\n        row.className = \"cudloun-setting-row\";\n\n        const text = document.createElement(\"div\");\n        text.className = \"cudloun-setting-text\";\n        text.textContent = \"Post Tweaks uses its floating control panel on board pages.\";\n\n        row.appendChild(text);\n        wrap.appendChild(row);\n        return wrap;\n      },\n      renderHelp() {\n        return [\n          \"Enable the module on a Babeta board page to apply the saved Post Tweaks layout.\",\n          \"Use Show panel from this module when you want to reopen the floating controls after hiding them.\",\n          \"Existing Post Tweaks settings are kept from the old container storage key.\",\n          \"Use Export and Import in the floating panel to share tuned layouts.\",\n        ];\n      },\n    });\n  } else {\n    run();\n  }\n\n  return api;\n\n  function run() {\n    installStyles();\n    if (settings.panelVisible !== false) installPanel();\n    if (!nativePopoutListenerInstalled) {\n      document.addEventListener(\"pointerdown\", handleNativePopoutOutside, true);\n      nativePopoutListenerInstalled = true;\n    }\n    applySettings();\n    scan();\n\n    if (!observer) {\n      observer = new MutationObserver(() => scan());\n      observer.observe(document.body, { childList: true, subtree: true });\n    }\n\n    console.log(\"[cudloun] post tweaks active\");\n    return api;\n  }\n\n  function showPanel() {\n    settings.panelVisible = true;\n    saveSettings();\n    run();\n    installPanel();\n    applySettings();\n  }\n\n  function stop() {\n    if (observer) {\n      observer.disconnect();\n      observer = null;\n    }\n    document.removeEventListener(\"pointerdown\", handleNativePopoutOutside, true);\n    nativePopoutListenerInstalled = false;\n\n    document.querySelectorAll(`[${MARK_POST}]`).forEach((post) => {\n      cleanupNativeMenuHooks(post);\n      clearPostVisuals(post);\n      restorePost(post);\n    });\n\n    document.querySelectorAll([\n      `[${MARK_POST}]`,\n      `[${MARK_FIRST_POST}]`,\n      `[${MARK_ROW}]`,\n      `[${MARK_AVATAR}]`,\n      `[${MARK_CONTENT}]`,\n      `[${MARK_HEADER}]`,\n      `[${MARK_BODY}]`,\n      `[${MARK_ACTIONS}]`,\n      `[${MARK_REPLY}]`,\n      `[${MARK_REPLY_MENU}]`,\n      `[${MARK_NATIVE_MENU_HOOK}]`,\n      `[${MARK_NATIVE_MENU_MODAL}]`,\n      `[${MARK_NATIVE_MENU_POPOUT}]`,\n      `[${MARK_NATIVE_MENU_SUPPRESSED}]`,\n      `[${MARK_NATIVE_REPLY_ITEM}]`,\n      `[${MARK_REPLY_META}]`,\n      `[${MARK_DATE_WRAP}]`,\n    ].join(\",\")).forEach((node) => {\n      node.removeAttribute(MARK_POST);\n      node.removeAttribute(MARK_FIRST_POST);\n      node.removeAttribute(MARK_ROW);\n      node.removeAttribute(MARK_AVATAR);\n      node.removeAttribute(MARK_CONTENT);\n      node.removeAttribute(MARK_HEADER);\n      node.removeAttribute(MARK_BODY);\n      node.removeAttribute(MARK_ACTIONS);\n      node.removeAttribute(MARK_REPLY);\n      node.removeAttribute(MARK_REPLY_MENU);\n      node.removeAttribute(MARK_NATIVE_MENU_HOOK);\n      node.removeAttribute(MARK_NATIVE_MENU_MODAL);\n      node.removeAttribute(MARK_NATIVE_MENU_POPOUT);\n      node.removeAttribute(MARK_NATIVE_MENU_SUPPRESSED);\n      node.removeAttribute(MARK_NATIVE_REPLY_ITEM);\n      node.removeAttribute(MARK_REPLY_META);\n      node.removeAttribute(MARK_DATE_WRAP);\n    });\n\n    document.querySelectorAll(`[${MARK_REPLY_MENU}]`).forEach((node) => node.remove());\n    document.querySelectorAll(`[${MARK_NATIVE_REPLY_ITEM}]`).forEach((node) => node.remove());\n    document.getElementById(PANEL_ID)?.remove();\n    document.getElementById(STYLE_ID)?.remove();\n    [\n      \"data-cudloun-post-tweaks-enabled\",\n      \"data-cudloun-post-tweaks-avatar-inline\",\n      \"data-cudloun-post-tweaks-divider\",\n      \"data-cudloun-post-tweaks-divider-dashed\",\n      \"data-cudloun-post-tweaks-background\",\n      \"data-cudloun-post-tweaks-rounded\",\n      \"data-cudloun-post-tweaks-reply-placement\",\n      \"data-cudloun-post-tweaks-reply-meta-header\",\n      \"data-cudloun-post-tweaks-native-menu-popout\",\n      \"data-cudloun-post-tweaks-avatar-menu\",\n    ].forEach((name) => document.documentElement.removeAttribute(name));\n    console.log(\"[cudloun-container] post tweaks stopped\");\n  }\n\n  function scan() {\n    getBabegutsPosts().forEach((post, index) => {\n      markPost(post, index);\n      arrangePost(post);\n    });\n  }\n\n  function markPost(post, index = 0) {\n    const parts = getBabegutsParts(post);\n    const avatar = parts?.avatar || post.querySelector(\".avatar-container\");\n    if (!avatar) return;\n\n    const row = parts?.row || avatar.parentElement;\n    const content = parts?.content || avatar.nextElementSibling;\n    if (!row || !content) return;\n\n    const header = parts?.header || content.firstElementChild;\n    const body = parts?.body || findPostBody(content, header);\n    const actions =\n      parts?.actions ||\n      post.querySelector(`[${MARK_ACTIONS}]`) ||\n      Array.from(post.children).find((child) => child.querySelector(\".reply-button\"));\n    const reply = parts?.reply || post.querySelector(`[${MARK_REPLY}]`) || actions?.querySelector(\".reply-button\");\n    const replyMeta = parts?.replyMeta || post.querySelector(`[${MARK_REPLY_META}]`) || findReplyMeta(post);\n    const dateWrap = parts?.dateWrap || findDateWrap(header);\n\n    post.setAttribute(MARK_POST, \"true\");\n    post.toggleAttribute(MARK_FIRST_POST, index === 0);\n    row.setAttribute(MARK_ROW, \"true\");\n    avatar.setAttribute(MARK_AVATAR, \"true\");\n    content.setAttribute(MARK_CONTENT, \"true\");\n    if (header) header.setAttribute(MARK_HEADER, \"true\");\n    if (body) body.setAttribute(MARK_BODY, \"true\");\n    if (actions) actions.setAttribute(MARK_ACTIONS, \"true\");\n    if (reply) reply.setAttribute(MARK_REPLY, \"true\");\n    if (replyMeta) replyMeta.setAttribute(MARK_REPLY_META, \"true\");\n    if (dateWrap) dateWrap.setAttribute(MARK_DATE_WRAP, \"true\");\n\n    ensureNativeMenuHooks(post, header, avatar);\n  }\n\n  function findReplyMeta(actions) {\n    if (!actions) return null;\n    return Array.from(actions.querySelectorAll(\"span\")).find((node) => isReplyMetaText(node.textContent.trim())) || null;\n  }\n\n  function findPostBody(content, header) {\n    const candidates = Array.from(content.children).filter((child) => {\n      return child !== header && child.textContent.trim() && !isReplyMetaNode(child) && !isHiddenBodyHelper(child);\n    });\n    return candidates[candidates.length - 1] || null;\n  }\n\n  function isReplyMetaNode(node) {\n    return isReplyMetaText(node.textContent.trim());\n  }\n\n  function isReplyMetaText(text) {\n    return /^Re:\\s*/.test(text) || /^Reakce na\\s+/i.test(text);\n  }\n\n  function isHiddenBodyHelper(node) {\n    const text = normalizeText(node.textContent || \"\");\n    if (/^Načítám…?Přejít na příspěvek$/i.test(text)) return true;\n\n    const rect = node.getBoundingClientRect();\n    const style = window.getComputedStyle(node);\n    return style.display === \"none\" || style.visibility === \"hidden\" || rect.height <= 0 || rect.width <= 0;\n  }\n\n  function normalizeText(text) {\n    return String(text || \"\").replace(/\\s+/g, \" \").trim();\n  }\n\n  function findDateWrap(header) {\n    if (!header) return null;\n    return Array.from(header.children).find((child) => child.textContent.trim().match(/\\d{1,2}\\.\\d{1,2}\\.\\d{4}/)) || null;\n  }\n\n  function arrangePost(post) {\n    applyPostVisuals(post);\n\n    const header = post.querySelector(`[${MARK_HEADER}]`);\n    const actions = post.querySelector(`[${MARK_ACTIONS}]`);\n    const reply = post.querySelector(`[${MARK_REPLY}]`);\n    const replyMeta = post.querySelector(`[${MARK_REPLY_META}]`);\n    const dateWrap = post.querySelector(`[${MARK_DATE_WRAP}]`);\n    if (!header || !actions) return;\n\n    const state = getPostState(post, { reply, replyMeta });\n    const key = `${settings.enabled}|${settings.replyPlacement}|${settings.replyMetaInHeader}`;\n    if (state.appliedKey === key) return;\n\n    restorePost(post);\n    state.appliedKey = key;\n    if (!settings.enabled) return;\n\n    if (settings.replyPlacement === \"header\" && reply) {\n      const wrap = ensureHeaderReplySlot(post, header);\n      wrap.appendChild(reply);\n    } else if (settings.replyPlacement === \"menu\" && reply) {\n      const store = ensureReplyMenu(post, header);\n      store.appendChild(reply);\n    }\n\n    if (settings.replyMetaInHeader && replyMeta && dateWrap) {\n      dateWrap.appendChild(replyMeta);\n    }\n\n    updateActionsVisibility(actions, state);\n  }\n\n  function applyPostVisuals(post) {\n    if (settings.enabled && settings.background) {\n      post.style.setProperty(\"background\", settings.backgroundColor, \"important\");\n      post.style.setProperty(\"background-color\", settings.backgroundColor, \"important\");\n    } else {\n      post.style.removeProperty(\"background\");\n      post.style.removeProperty(\"background-color\");\n    }\n\n    if (settings.enabled) {\n      post.style.setProperty(\"border-radius\", settings.rounded ? `${settings.radius}px` : \"0\", \"important\");\n      return;\n    }\n\n    clearPostVisuals(post);\n  }\n\n  function clearPostVisuals(post) {\n    post.style.removeProperty(\"background\");\n    post.style.removeProperty(\"background-color\");\n    post.style.removeProperty(\"border-radius\");\n  }\n\n  function getPostState(post, nodes = {}) {\n    let state = postState.get(post);\n    if (!state) {\n      state = {};\n      postState.set(post, state);\n    }\n\n    if (nodes.reply && !state.replyParent) {\n      state.replyParent = nodes.reply.parentNode;\n      state.replyNext = nodes.reply.nextSibling;\n    }\n\n    if (nodes.replyMeta && !state.replyMetaParent) {\n      state.replyMetaParent = nodes.replyMeta.parentNode;\n      state.replyMetaNext = nodes.replyMeta.nextSibling;\n    }\n\n    return state;\n  }\n\n  function restorePost(post) {\n    const state = postState.get(post);\n    if (!state) return;\n\n    const reply = post.querySelector(`[${MARK_REPLY}]`);\n    if (reply && state.replyParent && reply.parentNode !== state.replyParent) {\n      state.replyParent.insertBefore(reply, state.replyNext && state.replyNext.parentNode === state.replyParent ? state.replyNext : null);\n    }\n\n    const replyMeta = post.querySelector(`[${MARK_REPLY_META}]`);\n    if (replyMeta && state.replyMetaParent && replyMeta.parentNode !== state.replyMetaParent) {\n      state.replyMetaParent.insertBefore(\n        replyMeta,\n        state.replyMetaNext && state.replyMetaNext.parentNode === state.replyMetaParent ? state.replyMetaNext : null,\n      );\n    }\n\n    post.querySelectorAll(\".cudloun-post-tweaks-header-reply\").forEach((node) => node.remove());\n    post.querySelectorAll(`[${MARK_REPLY_MENU}]`).forEach((node) => node.remove());\n    document.querySelectorAll(`[${MARK_NATIVE_REPLY_ITEM}]`).forEach((node) => node.remove());\n    updateActionsVisibility(post.querySelector(`[${MARK_ACTIONS}]`), state);\n    state.appliedKey = \"\";\n  }\n\n  function ensureHeaderReplySlot(post, header) {\n    let slot = post.querySelector(\".cudloun-post-tweaks-header-reply\");\n    if (!slot) {\n      slot = document.createElement(\"span\");\n      slot.className = \"cudloun-post-tweaks-header-reply\";\n      header.appendChild(slot);\n    }\n    return slot;\n  }\n\n  function ensureReplyMenu(post, header) {\n    let store = post.querySelector(`[${MARK_REPLY_MENU}]`);\n    if (!store) {\n      store = document.createElement(\"span\");\n      store.className = \"cudloun-post-tweaks-reply-store\";\n      store.setAttribute(MARK_REPLY_MENU, \"true\");\n      post.appendChild(store);\n    }\n\n    return store;\n  }\n\n  function ensureNativeMenuHooks(post, header, avatar) {\n    const nativeMenu = findNativePostMenuButton(header);\n    const state = getPostState(post);\n\n    if (nativeMenu && state.nativeMenuButton !== nativeMenu) {\n      if (state.nativeMenuButton && state.nativeMenuHandler) {\n        state.nativeMenuButton.removeEventListener(\"click\", state.nativeMenuHandler);\n      }\n\n      state.nativeMenuButton = nativeMenu;\n      state.nativeMenuHandler = () => {\n        scheduleNativeMenuTweaks(post, nativeMenu);\n      };\n      nativeMenu.setAttribute(MARK_NATIVE_MENU_HOOK, \"true\");\n      nativeMenu.addEventListener(\"click\", state.nativeMenuHandler);\n    }\n\n    if (avatar && state.avatar !== avatar) {\n      if (state.avatar && state.avatarMenuHandler) {\n        state.avatar.removeEventListener(\"click\", state.avatarMenuHandler);\n      }\n\n      state.avatar = avatar;\n      state.avatarMenuHandler = (event) => {\n        if (!settings.enabled || !settings.avatarMenu) return;\n\n        const menuButton = findNativePostMenuButton(header);\n        if (!menuButton) return;\n\n        event.preventDefault();\n        event.stopPropagation();\n        window.setTimeout(() => {\n          menuButton.click();\n          scheduleNativeMenuTweaks(post, avatar, true, \"left\");\n        }, 0);\n      };\n      avatar.addEventListener(\"click\", state.avatarMenuHandler);\n    }\n  }\n\n  function cleanupNativeMenuHooks(post) {\n    const state = postState.get(post);\n    if (!state) return;\n\n    if (state.nativeMenuButton && state.nativeMenuHandler) {\n      state.nativeMenuButton.removeEventListener(\"click\", state.nativeMenuHandler);\n    }\n    if (state.avatar && state.avatarMenuHandler) {\n      state.avatar.removeEventListener(\"click\", state.avatarMenuHandler);\n    }\n\n    state.nativeMenuButton = null;\n    state.nativeMenuHandler = null;\n    state.avatar = null;\n    state.avatarMenuHandler = null;\n  }\n\n  function findNativePostMenuButton(header) {\n    if (!header) return null;\n    return Array.from(header.querySelectorAll('button[aria-label=\"menu\"]')).find(\n      (button) => !button.closest(`[${MARK_REPLY_MENU}]`),\n    ) || null;\n  }\n\n  function scheduleNativeMenuTweaks(post, button, forcePopout = false, align = \"right\") {\n    const rect = button.getBoundingClientRect();\n    const anchor = {\n      top: Math.round(rect.bottom + 4),\n      forcePopout,\n    };\n\n    if (align === \"left\") {\n      anchor.left = Math.max(8, Math.min(Math.round(rect.left), window.innerWidth - 204));\n    } else {\n      anchor.right = Math.max(8, Math.round(window.innerWidth - rect.right));\n    }\n\n    [0, 40, 120, 260].forEach((delay) => {\n      window.setTimeout(() => tweakNativePostMenu(post, anchor), delay);\n    });\n  }\n\n  function tweakNativePostMenu(post, anchor) {\n    const menu = findOpenPostMenu();\n    if (!menu) return;\n\n    applyNativeMenuPopout(menu, anchor);\n    injectNativeReplyItem(post, menu);\n  }\n\n  function injectNativeReplyItem(post, menu) {\n    const reply = post.querySelector(`[${MARK_REPLY}]`);\n    if (!reply) return;\n\n    document.querySelectorAll(`[${MARK_NATIVE_REPLY_ITEM}]`).forEach((node) => {\n      if (!menu.contains(node)) node.remove();\n    });\n    if (menu.querySelector(`[${MARK_NATIVE_REPLY_ITEM}]`)) return;\n\n    const template = menu.querySelector('li[role=\"menuitem\"]');\n    if (!template) return;\n    const itemParent = template.parentElement || menu;\n\n    const item = document.createElement(\"li\");\n    item.className = template.className;\n    item.setAttribute(\"role\", \"menuitem\");\n    item.setAttribute(\"tabindex\", \"-1\");\n    item.setAttribute(MARK_NATIVE_REPLY_ITEM, \"true\");\n    item.innerHTML = `\n      <div class=\"${template.querySelector(\".MuiListItemIcon-root\")?.className || \"MuiListItemIcon-root\"}\">\n        <svg class=\"MuiSvgIcon-root MuiSvgIcon-fontSizeSmall\" focusable=\"false\" aria-hidden=\"true\" viewBox=\"0 0 24 24\">\n          <path d=\"M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-.9-5-4-10-11-11z\"><\/path>\n        <\/svg>\n      <\/div>\n      <div class=\"${template.querySelector(\".MuiListItemText-root\")?.className || \"MuiListItemText-root\"}\">\n        <span class=\"${template.querySelector(\".MuiListItemText-primary\")?.className || \"MuiTypography-root MuiTypography-body1 MuiListItemText-primary\"}\">ODPOVĚDĚT<\/span>\n      <\/div>\n    `;\n    item.addEventListener(\"click\", (event) => {\n      event.preventDefault();\n      event.stopPropagation();\n      reply.click();\n      document.dispatchEvent(new KeyboardEvent(\"keydown\", { key: \"Escape\", bubbles: true }));\n    });\n\n    const divider = Array.from(itemParent.children).find((child) => child.tagName === \"HR\");\n    itemParent.insertBefore(item, divider || template.nextSibling);\n  }\n\n  function applyNativeMenuPopout(menu, anchor) {\n    if (!settings.nativeMenuPopout && !anchor.forcePopout) return;\n\n    document.querySelectorAll(`[${MARK_NATIVE_MENU_POPOUT}]`).forEach(clearNativeMenuPopout);\n\n    const surface = findMenuPopoutSurface(menu);\n    const modal = surface.closest('[role=\"presentation\"], .MuiModal-root');\n    if (modal instanceof HTMLElement) {\n      modal.setAttribute(MARK_NATIVE_MENU_MODAL, \"true\");\n      modal.style.setProperty(\"pointer-events\", \"none\", \"important\");\n      const backdrop = modal.querySelector(\".MuiBackdrop-root\");\n      if (backdrop instanceof HTMLElement) {\n        backdrop.style.setProperty(\"background\", \"transparent\", \"important\");\n        backdrop.style.setProperty(\"opacity\", \"0\", \"important\");\n        backdrop.style.setProperty(\"backdrop-filter\", \"none\", \"important\");\n        backdrop.style.setProperty(\"pointer-events\", \"none\", \"important\");\n      }\n    }\n\n    surface.setAttribute(MARK_NATIVE_MENU_POPOUT, \"true\");\n    surface.style.setProperty(\"--cudloun-post-tweaks-menu-top\", `${anchor.top}px`);\n    if (typeof anchor.left === \"number\") {\n      surface.style.setProperty(\"--cudloun-post-tweaks-menu-left\", `${anchor.left}px`);\n      surface.style.removeProperty(\"--cudloun-post-tweaks-menu-right\");\n    } else {\n      surface.style.setProperty(\"--cudloun-post-tweaks-menu-right\", `${anchor.right}px`);\n      surface.style.removeProperty(\"--cudloun-post-tweaks-menu-left\");\n    }\n    surface.style.setProperty(\"position\", \"fixed\", \"important\");\n    surface.style.setProperty(\"top\", `${anchor.top}px`, \"important\");\n    if (typeof anchor.left === \"number\") {\n      surface.style.setProperty(\"left\", `${anchor.left}px`, \"important\");\n      surface.style.setProperty(\"right\", \"auto\", \"important\");\n    } else {\n      surface.style.setProperty(\"right\", `${anchor.right}px`, \"important\");\n      surface.style.setProperty(\"left\", \"auto\", \"important\");\n    }\n    surface.style.setProperty(\"bottom\", \"auto\", \"important\");\n    surface.style.setProperty(\"width\", \"max-content\", \"important\");\n    surface.style.setProperty(\"min-width\", \"196px\", \"important\");\n    surface.style.setProperty(\"max-width\", \"calc(100vw - 16px)\", \"important\");\n    surface.style.setProperty(\"max-height\", `calc(100vh - ${anchor.top}px - 8px)`, \"important\");\n    surface.style.setProperty(\"margin\", \"0\", \"important\");\n    surface.style.setProperty(\"transform\", \"none\", \"important\");\n    surface.style.setProperty(\"overflow\", \"auto\", \"important\");\n    surface.style.setProperty(\"border-radius\", \"8px\", \"important\");\n    surface.style.setProperty(\"visibility\", \"visible\", \"important\");\n    surface.style.setProperty(\"pointer-events\", \"auto\", \"important\");\n    suppressOtherNativePostMenus(surface);\n  }\n\n  function handleNativePopoutOutside(event) {\n    if (!settings.nativeMenuPopout && !settings.avatarMenu) return;\n\n    const surface = document.querySelector(`[${MARK_NATIVE_MENU_POPOUT}]`);\n    if (!surface) return;\n    if (surface.contains(event.target)) return;\n    if (event.target instanceof Element && event.target.closest(`[${MARK_NATIVE_MENU_HOOK}]`)) return;\n    if (event.target instanceof Element && event.target.closest(`[${MARK_AVATAR}]`)) return;\n\n    const modal = surface.closest('[role=\"presentation\"]');\n    const backdrop = modal?.querySelector(\".MuiBackdrop-root\");\n    if (backdrop instanceof HTMLElement) {\n      backdrop.click();\n    }\n    document.dispatchEvent(new KeyboardEvent(\"keydown\", { key: \"Escape\", bubbles: true }));\n    window.setTimeout(() => {\n      clearNativeMenuPopout(surface);\n      document.querySelectorAll(`[${MARK_NATIVE_REPLY_ITEM}]`).forEach((node) => node.remove());\n    }, 80);\n  }\n\n  function clearNativeMenuPopout(node) {\n    const modal = node.closest(`[${MARK_NATIVE_MENU_MODAL}]`);\n    if (modal instanceof HTMLElement) {\n      modal.removeAttribute(MARK_NATIVE_MENU_MODAL);\n      modal.style.removeProperty(\"pointer-events\");\n      const backdrop = modal.querySelector(\".MuiBackdrop-root\");\n      if (backdrop instanceof HTMLElement) {\n        [\"background\", \"opacity\", \"backdrop-filter\", \"pointer-events\"].forEach((name) => {\n          backdrop.style.removeProperty(name);\n        });\n      }\n    }\n\n    node.removeAttribute(MARK_NATIVE_MENU_POPOUT);\n    document.querySelectorAll(`[${MARK_NATIVE_MENU_SUPPRESSED}]`).forEach((suppressed) => {\n      suppressed.removeAttribute(MARK_NATIVE_MENU_SUPPRESSED);\n      suppressed.style.removeProperty(\"display\");\n      suppressed.style.removeProperty(\"visibility\");\n      suppressed.style.removeProperty(\"pointer-events\");\n    });\n    [\n      \"--cudloun-post-tweaks-menu-top\",\n      \"--cudloun-post-tweaks-menu-right\",\n      \"--cudloun-post-tweaks-menu-left\",\n      \"position\",\n      \"top\",\n      \"right\",\n      \"bottom\",\n      \"left\",\n      \"width\",\n      \"min-width\",\n      \"max-width\",\n      \"max-height\",\n      \"margin\",\n      \"transform\",\n      \"overflow\",\n      \"border-radius\",\n      \"visibility\",\n      \"pointer-events\",\n    ].forEach((name) => node.style.removeProperty(name));\n  }\n\n  function suppressOtherNativePostMenus(activeSurface) {\n    Array.from(document.querySelectorAll('[role=\"menu\"], [role=\"dialog\"], [role=\"presentation\"]'))\n      .filter((node) => node instanceof HTMLElement)\n      .filter((node) => node !== activeSurface && !node.contains(activeSurface) && !activeSurface.contains(node))\n      .filter((node) => {\n        const text = node.textContent || \"\";\n        if (!text.includes(\"Označit jako nejstarší nový\") && !text.includes(\"Smazat příspěvek\")) return false;\n        const rect = node.getBoundingClientRect();\n        return rect.width > 0 && rect.height > 0;\n      })\n      .forEach((node) => {\n        node.setAttribute(MARK_NATIVE_MENU_SUPPRESSED, \"true\");\n        node.style.setProperty(\"display\", \"none\", \"important\");\n        node.style.setProperty(\"visibility\", \"hidden\", \"important\");\n        node.style.setProperty(\"pointer-events\", \"none\", \"important\");\n      });\n  }\n\n  function findMenuPopoutSurface(menu) {\n    const candidates = [menu, ...Array.from(menu.querySelectorAll(\"*\"))]\n      .filter((node) => node instanceof HTMLElement)\n      .filter((node) => {\n        const text = node.textContent || \"\";\n        if (!text.includes(\"Označit jako nejstarší nový\") && !text.includes(\"Smazat příspěvek\")) return false;\n        const rect = node.getBoundingClientRect();\n        return rect.width > 0 && rect.height > 0 && node.querySelector('li[role=\"menuitem\"]');\n      })\n      .map((node) => ({ node, area: node.getBoundingClientRect().width * node.getBoundingClientRect().height }))\n      .sort((a, b) => a.area - b.area);\n\n    const content = candidates[0]?.node || menu;\n    return content.closest('[role=\"dialog\"]') || content;\n  }\n\n  function findOpenPostMenu() {\n    const babegutsMenu = window.Cudloun?.babeguts?.smallestVisibleMenu?.(\"post\");\n    if (babegutsMenu) return babegutsMenu;\n\n    return Array.from(document.querySelectorAll('[role=\"menu\"], [role=\"dialog\"], [role=\"presentation\"]'))\n      .map((menu) => {\n        const rect = menu.getBoundingClientRect();\n        if (rect.width <= 0 || rect.height <= 0) return null;\n        const text = menu.textContent || \"\";\n        const isPostMenu = text.includes(\"Označit jako nejstarší nový\") || text.includes(\"Smazat příspěvek\");\n        if (!isPostMenu || !menu.querySelector('li[role=\"menuitem\"]')) return null;\n        return { menu, area: rect.width * rect.height };\n      })\n      .filter(Boolean)\n      .sort((a, b) => a.area - b.area)\n      .map((entry) => entry.menu)[0] || null;\n  }\n\n  function getBabegutsPosts() {\n    const helper = window.Cudloun?.babeguts;\n    if (helper && typeof helper.allPosts === \"function\") {\n      return helper.allPosts();\n    }\n    return Array.from(document.querySelectorAll(\".content-item.board-post\"));\n  }\n\n  function getBabegutsParts(post) {\n    const helper = window.Cudloun?.babeguts;\n    if (helper && typeof helper.postParts === \"function\") {\n      return helper.postParts(post);\n    }\n    return null;\n  }\n\n  function updateActionsVisibility(actions, state) {\n    if (!actions || !state) return;\n    const hasLocalReply = !!actions.querySelector(`[${MARK_REPLY}]`);\n    const hasLocalMeta = !!actions.querySelector(`[${MARK_REPLY_META}]`);\n    actions.toggleAttribute(\"data-cudloun-post-tweaks-empty\", !hasLocalReply && !hasLocalMeta);\n  }\n\n  function installStyles() {\n    if (document.getElementById(STYLE_ID)) return;\n\n    const style = document.createElement(\"style\");\n    style.id = STYLE_ID;\n    style.textContent = `\n      #${PANEL_ID} {\n        position: fixed;\n        right: 10px;\n        bottom: 10px;\n        z-index: 1800;\n        width: min(310px, calc(100vw - 16px));\n        max-height: min(560px, calc(100dvh - 16px));\n        border: 1px solid rgba(79,102,134,.28);\n        border-radius: 8px;\n        background: #fff;\n        color: #182230;\n        box-shadow: 0 12px 34px rgba(18,27,43,.24);\n        font: 13px/1.35 system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif;\n        overflow: hidden;\n      }\n\n      #${PANEL_ID} details {\n        max-height: inherit;\n        overflow: auto;\n        overscroll-behavior: contain;\n        scrollbar-gutter: stable;\n        touch-action: pan-y;\n        padding: 0 8px 8px;\n      }\n\n      #${PANEL_ID} summary {\n        position: sticky;\n        top: 0;\n        z-index: 1;\n        margin: 0 -8px 4px;\n        padding: 8px 10px;\n        background: #fff;\n        border-bottom: 1px solid rgba(79,102,134,.16);\n        cursor: pointer;\n        font-weight: 750;\n        letter-spacing: 0;\n        user-select: none;\n        touch-action: none;\n      }\n\n      #${PANEL_ID} label {\n        display: grid;\n        grid-template-columns: 1fr auto;\n        gap: 6px;\n        align-items: center;\n        margin-top: 7px;\n      }\n\n      #${PANEL_ID} input[type=\"range\"] {\n        grid-column: 1 / -1;\n        width: 100%;\n      }\n\n      #${PANEL_ID} select,\n      #${PANEL_ID} input[type=\"color\"],\n      #${PANEL_ID} input[type=\"text\"] {\n        min-width: 112px;\n        border: 1px solid rgba(79,102,134,.26);\n        border-radius: 6px;\n        background: #fff;\n        color: #243041;\n        font: inherit;\n        padding: 3px 6px;\n      }\n\n      #${PANEL_ID} input[type=\"color\"] {\n        width: 112px;\n        height: 28px;\n        padding: 2px;\n      }\n\n      #${PANEL_ID} input[data-setting=\"backgroundColorManual\"] {\n        width: 112px;\n      }\n\n      #${PANEL_ID} .cudloun-post-tweaks-actions {\n        display: flex;\n        flex-wrap: wrap;\n        gap: 8px;\n        margin-top: 8px;\n      }\n\n      #${PANEL_ID} .cudloun-post-tweaks-share[hidden] {\n        display: none !important;\n      }\n\n      #${PANEL_ID} .cudloun-post-tweaks-share {\n        margin-top: 8px;\n      }\n\n      #${PANEL_ID} textarea {\n        box-sizing: border-box;\n        width: 100%;\n        min-height: 104px;\n        max-height: 180px;\n        resize: vertical;\n        border: 1px solid rgba(79,102,134,.26);\n        border-radius: 6px;\n        background: #fff;\n        color: #243041;\n        font: 12px/1.4 Consolas, \"SFMono-Regular\", monospace;\n        padding: 7px;\n      }\n\n      #${PANEL_ID} textarea:focus {\n        outline: 2px solid rgba(8,126,164,.22);\n        outline-offset: 1px;\n      }\n\n      #${PANEL_ID} button {\n        appearance: none;\n        border: 1px solid rgba(79,102,134,.26);\n        border-radius: 6px;\n        background: #f8fafc;\n        color: #243041;\n        cursor: pointer;\n        font: 700 12px/1.2 inherit;\n        padding: 6px 8px;\n      }\n\n      @media (max-width: 700px) {\n        #${PANEL_ID} {\n          right: 8px;\n          bottom: 8px;\n          width: min(288px, calc(100vw - 16px));\n          max-height: min(430px, calc(100dvh - 18px));\n          font-size: 12px;\n        }\n\n        #${PANEL_ID} details {\n          padding: 0 7px 7px;\n        }\n\n        #${PANEL_ID} summary {\n          margin: 0 -7px 3px;\n          padding: 7px 9px;\n        }\n\n        #${PANEL_ID} label {\n          gap: 5px;\n          margin-top: 6px;\n        }\n\n        #${PANEL_ID} select,\n        #${PANEL_ID} input[type=\"color\"] {\n          min-width: 92px;\n          max-width: 128px;\n        }\n\n        #${PANEL_ID} input[type=\"color\"] {\n          width: 112px;\n        }\n\n        #${PANEL_ID} textarea {\n          min-height: 92px;\n          max-height: 150px;\n        }\n      }\n\n      .cudloun-post-tweaks-reply-store {\n        display: none !important;\n      }\n\n      html[data-cudloun-post-tweaks-native-menu-popout=\"true\"] [${MARK_NATIVE_MENU_POPOUT}] {\n        position: fixed !important;\n        top: var(--cudloun-post-tweaks-menu-top, 48px) !important;\n        right: var(--cudloun-post-tweaks-menu-right, 8px) !important;\n        left: var(--cudloun-post-tweaks-menu-left, auto) !important;\n        bottom: auto !important;\n        width: max-content !important;\n        min-width: 196px !important;\n        max-width: calc(100vw - 16px) !important;\n        max-height: calc(100vh - var(--cudloun-post-tweaks-menu-top, 48px) - 8px) !important;\n        margin: 0 !important;\n        transform: none !important;\n        overflow: auto !important;\n        border-radius: 8px !important;\n        box-shadow: 0 10px 28px rgba(18,27,43,.24) !important;\n      }\n\n      [${MARK_NATIVE_MENU_MODAL}] {\n        pointer-events: none !important;\n      }\n\n      [${MARK_NATIVE_MENU_MODAL}] .MuiBackdrop-root {\n        background: transparent !important;\n        opacity: 0 !important;\n        backdrop-filter: none !important;\n        pointer-events: none !important;\n      }\n\n      [${MARK_NATIVE_MENU_MODAL}] [${MARK_NATIVE_MENU_POPOUT}] {\n        pointer-events: auto !important;\n      }\n\n      html[data-cudloun-post-tweaks-enabled=\"true\"][data-cudloun-post-tweaks-avatar-menu=\"true\"] [${MARK_NATIVE_MENU_HOOK}] {\n        display: none !important;\n      }\n\n      html[data-cudloun-post-tweaks-enabled=\"true\"][data-cudloun-post-tweaks-avatar-menu=\"true\"] [${MARK_AVATAR}] {\n        cursor: pointer !important;\n      }\n\n      html[data-cudloun-post-tweaks-enabled=\"true\"] [${MARK_POST}] {\n        margin-bottom: var(--cudloun-post-tweaks-post-spacing, 4px) !important;\n        font-size: var(--cudloun-post-tweaks-font-scale, 100%) !important;\n        position: relative !important;\n      }\n\n      html[data-cudloun-post-tweaks-enabled=\"true\"] [${MARK_POST}] {\n        border-radius: 0 !important;\n      }\n\n      html[data-cudloun-post-tweaks-enabled=\"true\"][data-cudloun-post-tweaks-rounded=\"true\"] [${MARK_POST}] {\n        border-radius: var(--cudloun-post-tweaks-radius, 0px) !important;\n      }\n\n      html[data-cudloun-post-tweaks-enabled=\"true\"][data-cudloun-post-tweaks-divider=\"true\"] [${MARK_POST}]:not([${MARK_FIRST_POST}])::before {\n        content: \"\" !important;\n        position: absolute !important;\n        left: var(--cudloun-post-tweaks-divider-inset, 0px) !important;\n        right: var(--cudloun-post-tweaks-divider-inset, 0px) !important;\n        top: var(--cudloun-post-tweaks-divider-offset, -2px) !important;\n        border-top: var(--cudloun-post-tweaks-divider-width, 1px) var(--cudloun-post-tweaks-divider-style, solid) var(--cudloun-post-tweaks-divider-color, #000) !important;\n        pointer-events: none !important;\n        z-index: 2 !important;\n      }\n\n      html[data-cudloun-post-tweaks-enabled=\"true\"][data-cudloun-post-tweaks-background=\"true\"] [${MARK_POST}] {\n        background: var(--cudloun-post-tweaks-background-color, #fff) !important;\n        background-color: var(--cudloun-post-tweaks-background-color, #fff) !important;\n      }\n\n      html[data-cudloun-post-tweaks-enabled=\"true\"][data-cudloun-theme-tweaks-enabled=\"true\"][data-cudloun-post-tweaks-background=\"true\"] .content-item.board-post[${MARK_POST}],\n      html[data-cudloun-post-tweaks-enabled=\"true\"][data-cudloun-theme-tweaks-enabled=\"true\"][data-cudloun-post-tweaks-background=\"true\"] .MuiPaper-root.content-item[${MARK_POST}] {\n        background: var(--cudloun-post-tweaks-background-color, #fff) !important;\n        background-color: var(--cudloun-post-tweaks-background-color, #fff) !important;\n      }\n\n      html[data-cudloun-post-tweaks-enabled=\"true\"] [${MARK_HEADER}] {\n        font-size: var(--cudloun-post-tweaks-header-scale, 88%) !important;\n      }\n\n      html[data-cudloun-post-tweaks-enabled=\"true\"] [${MARK_HEADER}] * {\n        line-height: 1.18 !important;\n      }\n\n      html[data-cudloun-post-tweaks-enabled=\"true\"] [${MARK_BODY}],\n      html[data-cudloun-post-tweaks-enabled=\"true\"] [${MARK_ACTIONS}] {\n        font-size: var(--cudloun-post-tweaks-font-scale, 100%) !important;\n      }\n\n      html[data-cudloun-post-tweaks-enabled=\"true\"] [${MARK_BODY}] * {\n        font-size: inherit !important;\n        line-height: inherit !important;\n      }\n\n      html[data-cudloun-post-tweaks-enabled=\"true\"] [${MARK_CONTENT}] img {\n        max-width: 100% !important;\n        height: auto !important;\n      }\n\n      html[data-cudloun-post-tweaks-enabled=\"true\"] .cudloun-post-tweaks-header-reply {\n        display: inline-flex !important;\n        align-items: center !important;\n        margin-left: auto !important;\n      }\n\n      html[data-cudloun-post-tweaks-enabled=\"true\"] .cudloun-post-tweaks-header-reply [${MARK_REPLY}] {\n        min-width: 0 !important;\n        padding: 2px 6px !important;\n        font-size: .82em !important;\n        line-height: 1.1 !important;\n      }\n\n      html[data-cudloun-post-tweaks-enabled=\"true\"] [${MARK_ACTIONS}][data-cudloun-post-tweaks-empty] {\n        display: none !important;\n      }\n\n      html[data-cudloun-post-tweaks-enabled=\"true\"][data-cudloun-theme-tweaks-enabled=\"true\"] [${MARK_AVATAR}].avatar-container,\n      html[data-cudloun-post-tweaks-enabled=\"true\"][data-cudloun-theme-tweaks-enabled=\"true\"] [${MARK_AVATAR}].avatar-container .MuiAvatar-root.content-avatar,\n      html[data-cudloun-post-tweaks-enabled=\"true\"][data-cudloun-theme-tweaks-enabled=\"true\"] [${MARK_AVATAR}] .content-avatar,\n      html[data-cudloun-post-tweaks-enabled=\"true\"][data-cudloun-theme-tweaks-enabled=\"true\"] [${MARK_AVATAR}] .MuiAvatar-root {\n        width: var(--cudloun-post-tweaks-avatar-size, 28px) !important;\n        height: var(--cudloun-post-tweaks-avatar-size, 28px) !important;\n        min-width: var(--cudloun-post-tweaks-avatar-size, 28px) !important;\n        font-size: var(--cudloun-post-tweaks-avatar-font-size, 12px) !important;\n        border: 0 !important;\n        box-shadow: none !important;\n      }\n\n      html[data-cudloun-post-tweaks-enabled=\"true\"][data-cudloun-theme-tweaks-enabled=\"true\"] [${MARK_AVATAR}].avatar-container .MuiAvatar-root.content-avatar img,\n      html[data-cudloun-post-tweaks-enabled=\"true\"][data-cudloun-theme-tweaks-enabled=\"true\"] [${MARK_AVATAR}] .content-avatar img,\n      html[data-cudloun-post-tweaks-enabled=\"true\"][data-cudloun-theme-tweaks-enabled=\"true\"] [${MARK_AVATAR}] .MuiAvatar-root img {\n        width: var(--cudloun-post-tweaks-avatar-size, 28px) !important;\n        height: var(--cudloun-post-tweaks-avatar-size, 28px) !important;\n        object-fit: cover !important;\n        border: 0 !important;\n        box-shadow: none !important;\n      }\n\n      @media (max-width: 700px) {\n        html[data-cudloun-post-tweaks-enabled=\"true\"] [${MARK_POST}] {\n          box-sizing: border-box !important;\n          width: calc(100% - var(--cudloun-post-tweaks-card-inset, 0px) - var(--cudloun-post-tweaks-card-inset, 0px)) !important;\n          max-width: calc(100% - var(--cudloun-post-tweaks-card-inset, 0px) - var(--cudloun-post-tweaks-card-inset, 0px)) !important;\n          margin-left: auto !important;\n          margin-right: auto !important;\n          padding-left: var(--cudloun-post-tweaks-side-padding, 4px) !important;\n          padding-right: var(--cudloun-post-tweaks-side-padding, 4px) !important;\n          padding-bottom: var(--cudloun-post-tweaks-side-padding, 4px) !important;\n          margin-bottom: var(--cudloun-post-tweaks-post-spacing, 4px) !important;\n          font-size: var(--cudloun-post-tweaks-font-scale, 100%) !important;\n        }\n\n        html[data-cudloun-post-tweaks-enabled=\"true\"][data-cudloun-post-tweaks-background=\"true\"] [${MARK_POST}] {\n          background: var(--cudloun-post-tweaks-background-color, #fff) !important;\n          background-color: var(--cudloun-post-tweaks-background-color, #fff) !important;\n        }\n\n        html[data-cudloun-post-tweaks-enabled=\"true\"] [${MARK_ROW}] {\n          display: flex !important;\n          flex-direction: column !important;\n          align-items: stretch !important;\n          gap: 2px !important;\n        }\n\n        html[data-cudloun-post-tweaks-enabled=\"true\"][data-cudloun-post-tweaks-avatar-inline=\"true\"] [${MARK_ROW}] {\n          display: grid !important;\n          grid-template-columns: var(--cudloun-post-tweaks-avatar-size, 28px) minmax(0, 1fr) !important;\n          column-gap: 6px !important;\n          row-gap: 2px !important;\n          align-items: start !important;\n        }\n\n        html[data-cudloun-post-tweaks-enabled=\"true\"] [${MARK_AVATAR}] {\n          width: var(--cudloun-post-tweaks-avatar-size, 28px) !important;\n          height: var(--cudloun-post-tweaks-avatar-size, 28px) !important;\n          min-width: 0 !important;\n          align-self: flex-start !important;\n          margin: 0 0 -2px 0 !important;\n        }\n\n        html[data-cudloun-post-tweaks-enabled=\"true\"][data-cudloun-post-tweaks-avatar-inline=\"true\"] [${MARK_AVATAR}] {\n          grid-column: 1 !important;\n          grid-row: 1 !important;\n          margin: 0 !important;\n        }\n\n        html[data-cudloun-post-tweaks-enabled=\"true\"] [${MARK_AVATAR}] .content-avatar,\n        html[data-cudloun-post-tweaks-enabled=\"true\"] [${MARK_AVATAR}] .MuiAvatar-root {\n          width: var(--cudloun-post-tweaks-avatar-size, 28px) !important;\n          height: var(--cudloun-post-tweaks-avatar-size, 28px) !important;\n          min-width: var(--cudloun-post-tweaks-avatar-size, 28px) !important;\n          font-size: var(--cudloun-post-tweaks-avatar-font-size, 12px) !important;\n        }\n\n        html[data-cudloun-post-tweaks-enabled=\"true\"][data-cudloun-theme-tweaks-enabled=\"true\"] [${MARK_AVATAR}].avatar-container,\n        html[data-cudloun-post-tweaks-enabled=\"true\"][data-cudloun-theme-tweaks-enabled=\"true\"] [${MARK_AVATAR}].avatar-container .MuiAvatar-root.content-avatar {\n          width: var(--cudloun-post-tweaks-avatar-size, 28px) !important;\n          height: var(--cudloun-post-tweaks-avatar-size, 28px) !important;\n          min-width: var(--cudloun-post-tweaks-avatar-size, 28px) !important;\n        }\n\n        html[data-cudloun-post-tweaks-enabled=\"true\"] [${MARK_AVATAR}] .content-avatar img,\n        html[data-cudloun-post-tweaks-enabled=\"true\"] [${MARK_AVATAR}] .MuiAvatar-root img {\n          width: var(--cudloun-post-tweaks-avatar-size, 28px) !important;\n          height: var(--cudloun-post-tweaks-avatar-size, 28px) !important;\n          object-fit: cover !important;\n        }\n\n        html[data-cudloun-post-tweaks-enabled=\"true\"][data-cudloun-theme-tweaks-enabled=\"true\"] [${MARK_AVATAR}].avatar-container .MuiAvatar-root.content-avatar img {\n          width: var(--cudloun-post-tweaks-avatar-size, 28px) !important;\n          height: var(--cudloun-post-tweaks-avatar-size, 28px) !important;\n          object-fit: cover !important;\n        }\n\n        html[data-cudloun-post-tweaks-enabled=\"true\"] [${MARK_CONTENT}] {\n          box-sizing: border-box !important;\n          width: 100% !important;\n          max-width: 100% !important;\n          min-width: 0 !important;\n          margin-left: 0 !important;\n        }\n\n        html[data-cudloun-post-tweaks-enabled=\"true\"] [${MARK_CONTENT}] > * {\n          box-sizing: border-box !important;\n          width: 100% !important;\n          max-width: 100% !important;\n        }\n\n        html[data-cudloun-post-tweaks-enabled=\"true\"][data-cudloun-post-tweaks-avatar-inline=\"true\"] [${MARK_CONTENT}] {\n          display: contents !important;\n        }\n\n        html[data-cudloun-post-tweaks-enabled=\"true\"] [${MARK_HEADER}] {\n          position: relative !important;\n          width: 100% !important;\n          min-width: 0 !important;\n          display: flex !important;\n          flex-wrap: wrap !important;\n          align-items: baseline !important;\n          column-gap: 6px !important;\n          row-gap: 0 !important;\n          min-height: 0 !important;\n          height: auto !important;\n          font-size: var(--cudloun-post-tweaks-header-scale, 88%) !important;\n          line-height: 1.18 !important;\n          overflow-wrap: anywhere !important;\n        }\n\n        html[data-cudloun-post-tweaks-enabled=\"true\"][data-cudloun-post-tweaks-avatar-inline=\"true\"] [${MARK_HEADER}] {\n          grid-column: 2 !important;\n          grid-row: 1 !important;\n          align-self: center !important;\n        }\n\n        html[data-cudloun-post-tweaks-enabled=\"true\"] [${MARK_HEADER}] * {\n          max-width: 100% !important;\n          min-width: 0 !important;\n          line-height: 1.18 !important;\n          overflow-wrap: anywhere !important;\n          white-space: normal !important;\n        }\n\n        html[data-cudloun-post-tweaks-enabled=\"true\"] [${MARK_DATE_WRAP}] {\n          display: inline-flex !important;\n          flex-direction: column !important;\n          align-items: flex-start !important;\n          gap: 1px !important;\n          min-width: 0 !important;\n          max-width: calc(100% - 34px) !important;\n        }\n\n        html[data-cudloun-post-tweaks-enabled=\"true\"] [${MARK_REPLY_META}] {\n          display: inline-block !important;\n          max-width: 100% !important;\n          color: rgba(54,65,82,.8) !important;\n          font-size: .82em !important;\n          line-height: 1.14 !important;\n          overflow: hidden !important;\n          text-overflow: ellipsis !important;\n          white-space: nowrap !important;\n        }\n\n        html[data-cudloun-post-tweaks-enabled=\"true\"] [${MARK_REPLY_META}] a {\n          color: inherit !important;\n        }\n\n        html[data-cudloun-post-tweaks-enabled=\"true\"] [${MARK_BODY}] {\n          width: 100% !important;\n          max-width: 100% !important;\n          margin-left: 0 !important;\n          padding-left: 0 !important;\n          font-size: var(--cudloun-post-tweaks-font-scale, 100%) !important;\n          line-height: 1.5 !important;\n          overflow-wrap: anywhere !important;\n        }\n\n        html[data-cudloun-post-tweaks-enabled=\"true\"] [${MARK_BODY}] * {\n          font-size: inherit !important;\n          line-height: inherit !important;\n        }\n\n        html[data-cudloun-post-tweaks-enabled=\"true\"][data-cudloun-post-tweaks-avatar-inline=\"true\"] [${MARK_BODY}] {\n          grid-column: 1 / -1 !important;\n          grid-row: 2 !important;\n        }\n\n        html[data-cudloun-post-tweaks-enabled=\"true\"][data-cudloun-post-tweaks-avatar-inline=\"true\"] [${MARK_CONTENT}] > :not([${MARK_HEADER}]) {\n          grid-column: 1 / -1 !important;\n          min-width: 0 !important;\n          max-width: 100% !important;\n        }\n\n        html[data-cudloun-post-tweaks-enabled=\"true\"] [${MARK_CONTENT}] img {\n          max-width: 100% !important;\n          height: auto !important;\n        }\n\n        html[data-cudloun-post-tweaks-enabled=\"true\"] .cudloun-post-tweaks-header-reply {\n          position: absolute !important;\n          right: 28px !important;\n          top: 0 !important;\n          display: inline-flex !important;\n          align-items: center !important;\n          margin-left: 0 !important;\n        }\n\n        html[data-cudloun-post-tweaks-enabled=\"true\"] .cudloun-post-tweaks-header-reply [${MARK_REPLY}] {\n          min-width: 0 !important;\n          padding: 2px 6px !important;\n          font-size: .82em !important;\n          line-height: 1.1 !important;\n        }\n\n        html[data-cudloun-post-tweaks-enabled=\"true\"] [${MARK_ACTIONS}] {\n          width: 100% !important;\n          max-width: 100% !important;\n          margin-left: 0 !important;\n          padding-left: 0 !important;\n          font-size: var(--cudloun-post-tweaks-font-scale, 100%) !important;\n        }\n\n        html[data-cudloun-post-tweaks-enabled=\"true\"] [${MARK_ACTIONS}][data-cudloun-post-tweaks-empty] {\n          display: none !important;\n        }\n      }\n    `;\n    document.head.appendChild(style);\n  }\n\n  function installPanel() {\n    if (document.getElementById(PANEL_ID)) return;\n\n    const panel = document.createElement(\"div\");\n    panel.id = PANEL_ID;\n    panel.innerHTML = `\n      <details open>\n        <summary>Post Tweaks<\/summary>\n        <label>\n          <span>Compact posts<\/span>\n          <input data-setting=\"enabled\" type=\"checkbox\">\n        <\/label>\n        <label>\n          <span>Avatar in header<\/span>\n          <input data-setting=\"avatarInline\" type=\"checkbox\">\n        <\/label>\n        <label>\n          <span>Reply button<\/span>\n          <select data-setting=\"replyPlacement\">\n            <option value=\"bottom\">Bottom<\/option>\n            <option value=\"header\">Header<\/option>\n            <option value=\"menu\">Header menu<\/option>\n          <\/select>\n        <\/label>\n        <label>\n          <span>Reply link in header<\/span>\n          <input data-setting=\"replyMetaInHeader\" type=\"checkbox\">\n        <\/label>\n        <label>\n          <span>Avatar opens menu<\/span>\n          <input data-setting=\"avatarMenu\" type=\"checkbox\">\n        <\/label>\n        <label>\n          <span>Pop out post menu<\/span>\n          <input data-setting=\"nativeMenuPopout\" type=\"checkbox\">\n        <\/label>\n        <label>\n          <span>Dividing lines<\/span>\n          <input data-setting=\"divider\" type=\"checkbox\">\n        <\/label>\n        <label>\n          <span>Line width<\/span>\n          <output data-output=\"dividerWidth\"><\/output>\n          <input data-setting=\"dividerWidth\" type=\"range\" min=\"1\" max=\"6\" step=\"1\">\n        <\/label>\n        <label>\n          <span>Dashed line<\/span>\n          <input data-setting=\"dividerDashed\" type=\"checkbox\">\n        <\/label>\n        <label>\n          <span>Line color<\/span>\n          <input data-setting=\"dividerColor\" type=\"color\">\n        <\/label>\n        <label>\n          <span>Round corners<\/span>\n          <input data-setting=\"rounded\" type=\"checkbox\">\n        <\/label>\n        <label>\n          <span>Corner radius<\/span>\n          <output data-output=\"radius\"><\/output>\n          <input data-setting=\"radius\" type=\"range\" min=\"0\" max=\"24\" step=\"1\">\n        <\/label>\n        <label>\n          <span>Background<\/span>\n          <input data-setting=\"background\" type=\"checkbox\">\n        <\/label>\n        <label>\n          <span>Color preset<\/span>\n          <select data-setting=\"backgroundColor\">\n            ${COLOR_OPTIONS.map((option) => `<option value=\"${option.value}\">${option.label}<\/option>`).join(\"\")}\n          <\/select>\n        <\/label>\n        <label>\n          <span>Custom color<\/span>\n          <input data-setting=\"backgroundColor\" type=\"color\">\n        <\/label>\n        <label>\n          <span>Manual color<\/span>\n          <input data-setting=\"backgroundColorManual\" type=\"text\" inputmode=\"text\" spellcheck=\"false\" placeholder=\"#202020\">\n        <\/label>\n        <label>\n          <span>Avatar<\/span>\n          <output data-output=\"avatarSize\"><\/output>\n          <input data-setting=\"avatarSize\" type=\"range\" min=\"18\" max=\"40\" step=\"1\">\n        <\/label>\n        <label>\n          <span>Card inset<\/span>\n          <output data-output=\"cardInset\"><\/output>\n          <input data-setting=\"cardInset\" type=\"range\" min=\"0\" max=\"36\" step=\"1\">\n        <\/label>\n        <label>\n          <span>Side padding<\/span>\n          <output data-output=\"sidePadding\"><\/output>\n          <input data-setting=\"sidePadding\" type=\"range\" min=\"0\" max=\"16\" step=\"1\">\n        <\/label>\n        <label>\n          <span>Space between posts<\/span>\n          <output data-output=\"postSpacing\"><\/output>\n          <input data-setting=\"postSpacing\" type=\"range\" min=\"0\" max=\"28\" step=\"1\">\n        <\/label>\n        <label>\n          <span>Header size<\/span>\n          <output data-output=\"headerScale\"><\/output>\n          <input data-setting=\"headerScale\" type=\"range\" min=\"72\" max=\"105\" step=\"1\">\n        <\/label>\n        <label>\n          <span>Font size<\/span>\n          <output data-output=\"fontScale\"><\/output>\n          <input data-setting=\"fontScale\" type=\"range\" min=\"82\" max=\"118\" step=\"1\">\n        <\/label>\n        <div class=\"cudloun-post-tweaks-actions\">\n          <button type=\"button\" data-action=\"reset\">Reset<\/button>\n          <button type=\"button\" data-action=\"hide\">Hide<\/button>\n          <button type=\"button\" data-action=\"export\">Export<\/button>\n          <button type=\"button\" data-action=\"import\">Import<\/button>\n        <\/div>\n        <div class=\"cudloun-post-tweaks-share\" hidden>\n          <textarea data-share-box spellcheck=\"false\"><\/textarea>\n          <div class=\"cudloun-post-tweaks-actions\">\n            <button type=\"button\" data-action=\"copy-share\">Copy<\/button>\n            <button type=\"button\" data-action=\"apply-share\">Apply<\/button>\n            <button type=\"button\" data-action=\"close-share\">Close<\/button>\n          <\/div>\n        <\/div>\n      <\/details>\n    `;\n\n    panel.querySelectorAll(\"[data-setting]\").forEach((input) => {\n      input.addEventListener(\"input\", () => updateFromInput(input, \"input\"));\n      input.addEventListener(\"change\", () => updateFromInput(input, \"change\"));\n    });\n\n    installPanelDrag(panel);\n\n    function updateFromInput(input, eventType = \"change\") {\n      const name = input.dataset.setting;\n      if (name === \"backgroundColorManual\") {\n        const color = normalizeManualColor(input.value);\n        if (!color) {\n          if (eventType === \"change\") syncBackgroundColorInputs(panel);\n          return;\n        }\n\n        settings.backgroundColor = color;\n        syncBackgroundColorInputs(panel, input);\n      } else if (input.type === \"checkbox\") {\n        settings[name] = input.checked;\n      } else if (input.type === \"range\") {\n        settings[name] = Number(input.value);\n      } else {\n        settings[name] = input.value;\n      }\n\n      if (name === \"backgroundColor\") {\n        syncBackgroundColorInputs(panel, input);\n      }\n\n      saveSettings();\n      applySettings();\n    }\n\n    panel.querySelector(\"[data-action='reset']\").addEventListener(\"click\", () => {\n      settings = { ...defaults };\n      saveSettings();\n      applySettings();\n    });\n\n    panel.querySelector(\"[data-action='hide']\").addEventListener(\"click\", () => {\n      settings.panelVisible = false;\n      saveSettings();\n      panel.remove();\n    });\n\n    panel.querySelector(\"[data-action='export']\").addEventListener(\"click\", () => {\n      const text = exportSettingsText();\n      showShareBox(panel, text);\n      copyText(text).catch(() => {});\n    });\n\n    panel.querySelector(\"[data-action='import']\").addEventListener(\"click\", () => {\n      showShareBox(panel, \"\");\n    });\n\n    panel.querySelector(\"[data-action='copy-share']\").addEventListener(\"click\", () => {\n      const text = panel.querySelector(\"[data-share-box]\")?.value || \"\";\n      copyText(text).catch(() => {});\n    });\n\n    panel.querySelector(\"[data-action='apply-share']\").addEventListener(\"click\", () => {\n      const box = panel.querySelector(\"[data-share-box]\");\n      if (!box) return;\n      try {\n        importSettingsText(box.value);\n        saveSettings();\n        applySettings();\n      } catch (error) {\n        window.alert(`Could not import Post Tweaks settings: ${error.message}`);\n      }\n    });\n\n    panel.querySelector(\"[data-action='close-share']\").addEventListener(\"click\", () => {\n      panel.querySelector(\".cudloun-post-tweaks-share\")?.setAttribute(\"hidden\", \"\");\n    });\n\n    document.body.appendChild(panel);\n  }\n\n  function installPanelDrag(panel) {\n    const handle = panel.querySelector(\"summary\");\n    if (!handle) return;\n\n    let drag = null;\n    let suppressClick = false;\n\n    handle.addEventListener(\"pointerdown\", (event) => {\n      if (event.button !== 0 || event.target.closest(\"input, select, button, a\")) return;\n\n      const rect = panel.getBoundingClientRect();\n      drag = {\n        pointerId: event.pointerId,\n        startX: event.clientX,\n        startY: event.clientY,\n        left: rect.left,\n        top: rect.top,\n        moved: false,\n      };\n      handle.setPointerCapture?.(event.pointerId);\n    });\n\n    handle.addEventListener(\"pointermove\", (event) => {\n      if (!drag || event.pointerId !== drag.pointerId) return;\n\n      const dx = event.clientX - drag.startX;\n      const dy = event.clientY - drag.startY;\n      if (!drag.moved && Math.hypot(dx, dy) < 4) return;\n\n      drag.moved = true;\n      suppressClick = true;\n      event.preventDefault();\n      movePanel(panel, drag.left + dx, drag.top + dy);\n    });\n\n    handle.addEventListener(\"pointerup\", (event) => {\n      if (!drag || event.pointerId !== drag.pointerId) return;\n      handle.releasePointerCapture?.(event.pointerId);\n      drag = null;\n      window.setTimeout(() => {\n        suppressClick = false;\n      }, 0);\n    });\n\n    handle.addEventListener(\"click\", (event) => {\n      if (!suppressClick) return;\n      event.preventDefault();\n      event.stopPropagation();\n    }, true);\n\n    window.addEventListener(\"resize\", () => {\n      const rect = panel.getBoundingClientRect();\n      movePanel(panel, rect.left, rect.top);\n    });\n  }\n\n  function movePanel(panel, left, top) {\n    const rect = panel.getBoundingClientRect();\n    const margin = 8;\n    const maxLeft = Math.max(margin, window.innerWidth - rect.width - margin);\n    const maxTop = Math.max(margin, window.innerHeight - rect.height - margin);\n    const nextLeft = Math.min(Math.max(margin, left), maxLeft);\n    const nextTop = Math.min(Math.max(margin, top), maxTop);\n\n    panel.style.left = `${Math.round(nextLeft)}px`;\n    panel.style.top = `${Math.round(nextTop)}px`;\n    panel.style.right = \"auto\";\n    panel.style.bottom = \"auto\";\n  }\n\n  function applySettings() {\n    const rootStyle = document.documentElement.style;\n    document.documentElement.setAttribute(\"data-cudloun-post-tweaks-enabled\", settings.enabled ? \"true\" : \"false\");\n    document.documentElement.setAttribute(\"data-cudloun-post-tweaks-avatar-inline\", settings.avatarInline ? \"true\" : \"false\");\n    document.documentElement.setAttribute(\"data-cudloun-post-tweaks-divider\", settings.divider ? \"true\" : \"false\");\n    document.documentElement.setAttribute(\"data-cudloun-post-tweaks-divider-dashed\", settings.dividerDashed ? \"true\" : \"false\");\n    document.documentElement.setAttribute(\"data-cudloun-post-tweaks-background\", settings.background ? \"true\" : \"false\");\n    document.documentElement.setAttribute(\"data-cudloun-post-tweaks-rounded\", settings.rounded ? \"true\" : \"false\");\n    document.documentElement.setAttribute(\"data-cudloun-post-tweaks-reply-placement\", settings.replyPlacement);\n    document.documentElement.setAttribute(\"data-cudloun-post-tweaks-reply-meta-header\", settings.replyMetaInHeader ? \"true\" : \"false\");\n    document.documentElement.setAttribute(\"data-cudloun-post-tweaks-native-menu-popout\", settings.nativeMenuPopout ? \"true\" : \"false\");\n    document.documentElement.setAttribute(\"data-cudloun-post-tweaks-avatar-menu\", settings.avatarMenu ? \"true\" : \"false\");\n    rootStyle.setProperty(\"--cudloun-post-tweaks-avatar-size\", `${settings.avatarSize}px`);\n    rootStyle.setProperty(\"--cudloun-post-tweaks-avatar-font-size\", `${Math.round(settings.avatarSize * 0.42)}px`);\n    rootStyle.setProperty(\"--cudloun-post-tweaks-card-inset\", `${settings.cardInset}px`);\n    rootStyle.setProperty(\"--cudloun-post-tweaks-side-padding\", `${settings.sidePadding}px`);\n    rootStyle.setProperty(\"--cudloun-post-tweaks-post-spacing\", `${settings.postSpacing}px`);\n    rootStyle.setProperty(\"--cudloun-post-tweaks-divider-offset\", `${Math.round(settings.postSpacing / -2)}px`);\n    rootStyle.setProperty(\"--cudloun-post-tweaks-divider-inset\", `${settings.sidePadding}px`);\n    rootStyle.setProperty(\"--cudloun-post-tweaks-divider-width\", `${settings.dividerWidth}px`);\n    rootStyle.setProperty(\"--cudloun-post-tweaks-divider-style\", settings.dividerDashed ? \"dashed\" : \"solid\");\n    rootStyle.setProperty(\"--cudloun-post-tweaks-divider-color\", settings.dividerColor);\n    rootStyle.setProperty(\"--cudloun-post-tweaks-radius\", `${settings.radius}px`);\n    rootStyle.setProperty(\"--cudloun-post-tweaks-header-scale\", `${settings.headerScale}%`);\n    rootStyle.setProperty(\"--cudloun-post-tweaks-font-scale\", `${settings.fontScale}%`);\n    rootStyle.setProperty(\"--cudloun-post-tweaks-background-color\", settings.backgroundColor);\n\n    const panel = document.getElementById(PANEL_ID);\n    if (!panel) return;\n\n    setInput(panel, \"enabled\", settings.enabled);\n    setInput(panel, \"avatarInline\", settings.avatarInline);\n    setInput(panel, \"replyPlacement\", settings.replyPlacement);\n    setInput(panel, \"replyMetaInHeader\", settings.replyMetaInHeader);\n    setInput(panel, \"avatarMenu\", settings.avatarMenu);\n    setInput(panel, \"nativeMenuPopout\", settings.nativeMenuPopout);\n    setInput(panel, \"divider\", settings.divider);\n    setInput(panel, \"dividerDashed\", settings.dividerDashed);\n    setInput(panel, \"dividerWidth\", settings.dividerWidth);\n    setInput(panel, \"dividerColor\", settings.dividerColor);\n    setInput(panel, \"background\", settings.background);\n    setInput(panel, \"rounded\", settings.rounded);\n    setInput(panel, \"radius\", settings.radius);\n    syncBackgroundColorInputs(panel);\n    setInput(panel, \"avatarSize\", settings.avatarSize);\n    setInput(panel, \"cardInset\", settings.cardInset);\n    setInput(panel, \"sidePadding\", settings.sidePadding);\n    setInput(panel, \"postSpacing\", settings.postSpacing);\n    setInput(panel, \"headerScale\", settings.headerScale);\n    setInput(panel, \"fontScale\", settings.fontScale);\n    setOutput(panel, \"avatarSize\", `${settings.avatarSize}px`);\n    setOutput(panel, \"cardInset\", `${settings.cardInset}px`);\n    setOutput(panel, \"sidePadding\", `${settings.sidePadding}px`);\n    setOutput(panel, \"postSpacing\", `${settings.postSpacing}px`);\n    setOutput(panel, \"dividerWidth\", `${settings.dividerWidth}px`);\n    setOutput(panel, \"radius\", `${settings.radius}px`);\n    setOutput(panel, \"headerScale\", `${settings.headerScale}%`);\n    setOutput(panel, \"fontScale\", `${settings.fontScale}%`);\n\n    scan();\n  }\n\n  function setInput(panel, name, value) {\n    panel.querySelectorAll(`[data-setting=\"${name}\"]`).forEach((input) => {\n      if (input.type === \"checkbox\") input.checked = !!value;\n      else input.value = String(value);\n    });\n  }\n\n  function setOutput(panel, name, value) {\n    const output = panel.querySelector(`[data-output=\"${name}\"]`);\n    if (output) output.textContent = value;\n  }\n\n  function syncBackgroundColorInputs(panel, source) {\n    const color = settings.backgroundColor;\n    const hex = toHexColor(color);\n\n    panel.querySelectorAll('[data-setting=\"backgroundColor\"]').forEach((input) => {\n      if (input === source) return;\n      if (input.tagName === \"SELECT\") {\n        input.value = COLOR_OPTIONS.some((option) => option.value.toLowerCase() === String(color).toLowerCase()) ? color : \"\";\n      } else if (input.type === \"color\" && hex) {\n        input.value = hex;\n      }\n    });\n\n    panel.querySelectorAll('[data-setting=\"backgroundColorManual\"]').forEach((input) => {\n      if (input !== source) input.value = color;\n    });\n  }\n\n  function normalizeManualColor(value) {\n    const color = String(value || \"\").trim();\n    if (!color) return \"\";\n    if (!window.CSS || typeof window.CSS.supports !== \"function\" || !window.CSS.supports(\"color\", color)) return \"\";\n    return toHexColor(color) || color;\n  }\n\n  function toHexColor(value) {\n    const color = String(value || \"\").trim();\n    let match = color.match(/^#([0-9a-f]{3})$/i);\n    if (match) {\n      return `#${match[1].split(\"\").map((part) => `${part}${part}`).join(\"\")}`.toLowerCase();\n    }\n\n    match = color.match(/^#([0-9a-f]{6})$/i);\n    if (match) return `#${match[1].toLowerCase()}`;\n\n    return \"\";\n  }\n\n  function showShareBox(panel, text) {\n    const wrap = panel.querySelector(\".cudloun-post-tweaks-share\");\n    const box = panel.querySelector(\"[data-share-box]\");\n    if (!wrap || !box) return;\n\n    wrap.removeAttribute(\"hidden\");\n    box.value = text;\n    box.focus();\n    box.select();\n  }\n\n  function exportSettingsText() {\n    return JSON.stringify({\n      cudlounContainer: ID,\n      version: 1,\n      settings: sharedSettings(),\n    }, null, 2);\n  }\n\n  function sharedSettings() {\n    return Object.fromEntries(\n      Object.keys(defaults).map((name) => [name, settings[name]]),\n    );\n  }\n\n  function importSettingsText(text) {\n    const parsed = JSON.parse(String(text || \"\").trim());\n    const source = parsed && parsed.settings && typeof parsed.settings === \"object\" ? parsed.settings : parsed;\n    if (!source || typeof source !== \"object\" || Array.isArray(source)) {\n      throw new Error(\"expected a settings object\");\n    }\n\n    const next = { ...settings };\n    Object.entries(defaults).forEach(([name, fallback]) => {\n      if (!Object.prototype.hasOwnProperty.call(source, name)) return;\n\n      const value = source[name];\n      if (typeof fallback === \"boolean\") {\n        next[name] = value === true || value === \"true\";\n      } else if (typeof fallback === \"number\") {\n        const number = Number(value);\n        if (!Number.isFinite(number)) throw new Error(`${name} must be a number`);\n        next[name] = number;\n      } else {\n        next[name] = String(value);\n      }\n    });\n\n    settings = next;\n  }\n\n  async function copyText(text) {\n    if (navigator.clipboard && navigator.clipboard.writeText) {\n      await navigator.clipboard.writeText(text);\n    }\n  }\n\n  function loadSettings() {\n    try {\n      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY) || \"{}\";\n      return { ...defaults, ...JSON.parse(raw) };\n    } catch (error) {\n      return { ...defaults };\n    }\n  }\n\n  function saveSettings() {\n    try {\n      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));\n    } catch (error) {\n      console.warn(\"[cudloun] post tweaks settings could not be saved\", error);\n    }\n  }\n})();\n");
  embeddedScripts.set("modules/post-tweaks.js", function () {
    // Cudloun module: tune mobile board post layout.
    (function () {
      "use strict";

      const root = window.Cudloun;
      const ID = "post-tweaks";
      const STYLE_ID = "cudloun-container-post-tweaks-style";
      const PANEL_ID = "cudloun-container-post-tweaks-panel";
      const STORAGE_KEY = "cudloun.container.postTweaks.v1";
      const LEGACY_STORAGE_KEY = "cudloun.container.textWidth.v1";
      const MARK_POST = "data-cudloun-post-tweaks-post";
      const MARK_FIRST_POST = "data-cudloun-post-tweaks-first-post";
      const MARK_ROW = "data-cudloun-post-tweaks-row";
      const MARK_AVATAR = "data-cudloun-post-tweaks-avatar";
      const MARK_CONTENT = "data-cudloun-post-tweaks-content";
      const MARK_HEADER = "data-cudloun-post-tweaks-header";
      const MARK_BODY = "data-cudloun-post-tweaks-body";
      const MARK_ACTIONS = "data-cudloun-post-tweaks-actions";
      const MARK_REPLY = "data-cudloun-post-tweaks-reply";
      const MARK_REPLY_MENU = "data-cudloun-post-tweaks-reply-menu";
      const MARK_NATIVE_MENU_HOOK = "data-cudloun-post-tweaks-native-menu-hook";
      const MARK_NATIVE_MENU_MODAL = "data-cudloun-post-tweaks-native-menu-modal";
      const MARK_NATIVE_MENU_POPOUT = "data-cudloun-post-tweaks-native-menu-popout";
      const MARK_NATIVE_MENU_SUPPRESSED = "data-cudloun-post-tweaks-native-menu-suppressed";
      const MARK_NATIVE_REPLY_ITEM = "data-cudloun-post-tweaks-native-reply-item";
      const MARK_REPLY_META = "data-cudloun-post-tweaks-reply-meta";
      const MARK_DATE_WRAP = "data-cudloun-post-tweaks-date-wrap";
      const COLOR_OPTIONS = [
        { value: "#ffffff", label: "White" },
        { value: "#f8fafc", label: "Soft gray" },
        { value: "#fff7df", label: "Warm" },
        { value: "#edf7ff", label: "Blue" },
        { value: "#edfdf4", label: "Green" },
      ];

      const defaults = {
        enabled: true,
        panelVisible: true,
        avatarInline: false,
        divider: false,
        dividerDashed: false,
        dividerWidth: 1,
        dividerColor: "#000000",
        background: false,
        backgroundColor: "#ffffff",
        rounded: false,
        radius: 0,
        avatarSize: 28,
        cardInset: 0,
        sidePadding: 4,
        postSpacing: 4,
        headerScale: 88,
        fontScale: 100,
        replyPlacement: "bottom",
        replyMetaInHeader: false,
        nativeMenuPopout: false,
        avatarMenu: true,
      };

      let observer = null;
      let nativePopoutListenerInstalled = false;
      let settings = loadSettings();
      const postState = new WeakMap();

      const api = {
        id: ID,
        name: "Post Tweaks",
        run,
        showPanel,
        stop,
      };

      window.CudlounPostTweaks = api;

      if (root && typeof root.registerModule === "function") {
        root.registerModule({
          id: ID,
          name: "Post Tweaks",
          description: "Tune board post layout, spacing, dividers, background, reply placement, and post menu behavior.",
          version: "0.2.8",
          defaultEnabled: false,
          actionLabel: "Show panel",
          start() {
            run();
            return stop;
          },
          action() {
            showPanel();
          },
          renderSettings() {
            const wrap = document.createElement("div");
            wrap.className = "cudloun-settings-list";

            const row = document.createElement("div");
            row.className = "cudloun-setting-row";

            const text = document.createElement("div");
            text.className = "cudloun-setting-text";
            text.textContent = "Post Tweaks uses its floating control panel on board pages.";

            row.appendChild(text);
            wrap.appendChild(row);
            return wrap;
          },
          renderHelp() {
            return [
              "Enable the module on a Babeta board page to apply the saved Post Tweaks layout.",
              "Use Show panel from this module when you want to reopen the floating controls after hiding them.",
              "Existing Post Tweaks settings are kept from the old container storage key.",
              "Use Export and Import in the floating panel to share tuned layouts.",
            ];
          },
        });
      } else {
        run();
      }

      return api;

      function run() {
        installStyles();
        if (settings.panelVisible !== false) installPanel();
        if (!nativePopoutListenerInstalled) {
          document.addEventListener("pointerdown", handleNativePopoutOutside, true);
          nativePopoutListenerInstalled = true;
        }
        applySettings();
        scan();

        if (!observer) {
          observer = new MutationObserver(() => scan());
          observer.observe(document.body, { childList: true, subtree: true });
        }

        console.log("[cudloun] post tweaks active");
        return api;
      }

      function showPanel() {
        settings.panelVisible = true;
        saveSettings();
        run();
        installPanel();
        applySettings();
      }

      function stop() {
        if (observer) {
          observer.disconnect();
          observer = null;
        }
        document.removeEventListener("pointerdown", handleNativePopoutOutside, true);
        nativePopoutListenerInstalled = false;

        document.querySelectorAll(`[${MARK_POST}]`).forEach((post) => {
          cleanupNativeMenuHooks(post);
          clearPostVisuals(post);
          restorePost(post);
        });

        document.querySelectorAll([
          `[${MARK_POST}]`,
          `[${MARK_FIRST_POST}]`,
          `[${MARK_ROW}]`,
          `[${MARK_AVATAR}]`,
          `[${MARK_CONTENT}]`,
          `[${MARK_HEADER}]`,
          `[${MARK_BODY}]`,
          `[${MARK_ACTIONS}]`,
          `[${MARK_REPLY}]`,
          `[${MARK_REPLY_MENU}]`,
          `[${MARK_NATIVE_MENU_HOOK}]`,
          `[${MARK_NATIVE_MENU_MODAL}]`,
          `[${MARK_NATIVE_MENU_POPOUT}]`,
          `[${MARK_NATIVE_MENU_SUPPRESSED}]`,
          `[${MARK_NATIVE_REPLY_ITEM}]`,
          `[${MARK_REPLY_META}]`,
          `[${MARK_DATE_WRAP}]`,
        ].join(",")).forEach((node) => {
          node.removeAttribute(MARK_POST);
          node.removeAttribute(MARK_FIRST_POST);
          node.removeAttribute(MARK_ROW);
          node.removeAttribute(MARK_AVATAR);
          node.removeAttribute(MARK_CONTENT);
          node.removeAttribute(MARK_HEADER);
          node.removeAttribute(MARK_BODY);
          node.removeAttribute(MARK_ACTIONS);
          node.removeAttribute(MARK_REPLY);
          node.removeAttribute(MARK_REPLY_MENU);
          node.removeAttribute(MARK_NATIVE_MENU_HOOK);
          node.removeAttribute(MARK_NATIVE_MENU_MODAL);
          node.removeAttribute(MARK_NATIVE_MENU_POPOUT);
          node.removeAttribute(MARK_NATIVE_MENU_SUPPRESSED);
          node.removeAttribute(MARK_NATIVE_REPLY_ITEM);
          node.removeAttribute(MARK_REPLY_META);
          node.removeAttribute(MARK_DATE_WRAP);
        });

        document.querySelectorAll(`[${MARK_REPLY_MENU}]`).forEach((node) => node.remove());
        document.querySelectorAll(`[${MARK_NATIVE_REPLY_ITEM}]`).forEach((node) => node.remove());
        document.getElementById(PANEL_ID)?.remove();
        document.getElementById(STYLE_ID)?.remove();
        [
          "data-cudloun-post-tweaks-enabled",
          "data-cudloun-post-tweaks-avatar-inline",
          "data-cudloun-post-tweaks-divider",
          "data-cudloun-post-tweaks-divider-dashed",
          "data-cudloun-post-tweaks-background",
          "data-cudloun-post-tweaks-rounded",
          "data-cudloun-post-tweaks-reply-placement",
          "data-cudloun-post-tweaks-reply-meta-header",
          "data-cudloun-post-tweaks-native-menu-popout",
          "data-cudloun-post-tweaks-avatar-menu",
        ].forEach((name) => document.documentElement.removeAttribute(name));
        console.log("[cudloun-container] post tweaks stopped");
      }

      function scan() {
        getBabegutsPosts().forEach((post, index) => {
          markPost(post, index);
          arrangePost(post);
        });
      }

      function markPost(post, index = 0) {
        const parts = getBabegutsParts(post);
        const avatar = parts?.avatar || post.querySelector(".avatar-container");
        if (!avatar) return;

        const row = parts?.row || avatar.parentElement;
        const content = parts?.content || avatar.nextElementSibling;
        if (!row || !content) return;

        const header = parts?.header || content.firstElementChild;
        const body = parts?.body || findPostBody(content, header);
        const actions =
          parts?.actions ||
          post.querySelector(`[${MARK_ACTIONS}]`) ||
          Array.from(post.children).find((child) => child.querySelector(".reply-button"));
        const reply = parts?.reply || post.querySelector(`[${MARK_REPLY}]`) || actions?.querySelector(".reply-button");
        const replyMeta = parts?.replyMeta || post.querySelector(`[${MARK_REPLY_META}]`) || findReplyMeta(post);
        const dateWrap = parts?.dateWrap || findDateWrap(header);

        post.setAttribute(MARK_POST, "true");
        post.toggleAttribute(MARK_FIRST_POST, index === 0);
        row.setAttribute(MARK_ROW, "true");
        avatar.setAttribute(MARK_AVATAR, "true");
        content.setAttribute(MARK_CONTENT, "true");
        if (header) header.setAttribute(MARK_HEADER, "true");
        if (body) body.setAttribute(MARK_BODY, "true");
        if (actions) actions.setAttribute(MARK_ACTIONS, "true");
        if (reply) reply.setAttribute(MARK_REPLY, "true");
        if (replyMeta) replyMeta.setAttribute(MARK_REPLY_META, "true");
        if (dateWrap) dateWrap.setAttribute(MARK_DATE_WRAP, "true");

        ensureNativeMenuHooks(post, header, avatar);
      }

      function findReplyMeta(actions) {
        if (!actions) return null;
        return Array.from(actions.querySelectorAll("span")).find((node) => isReplyMetaText(node.textContent.trim())) || null;
      }

      function findPostBody(content, header) {
        const candidates = Array.from(content.children).filter((child) => {
          return child !== header && child.textContent.trim() && !isReplyMetaNode(child) && !isHiddenBodyHelper(child);
        });
        return candidates[candidates.length - 1] || null;
      }

      function isReplyMetaNode(node) {
        return isReplyMetaText(node.textContent.trim());
      }

      function isReplyMetaText(text) {
        return /^Re:\s*/.test(text) || /^Reakce na\s+/i.test(text);
      }

      function isHiddenBodyHelper(node) {
        const text = normalizeText(node.textContent || "");
        if (/^Načítám…?Přejít na příspěvek$/i.test(text)) return true;

        const rect = node.getBoundingClientRect();
        const style = window.getComputedStyle(node);
        return style.display === "none" || style.visibility === "hidden" || rect.height <= 0 || rect.width <= 0;
      }

      function normalizeText(text) {
        return String(text || "").replace(/\s+/g, " ").trim();
      }

      function findDateWrap(header) {
        if (!header) return null;
        return Array.from(header.children).find((child) => child.textContent.trim().match(/\d{1,2}\.\d{1,2}\.\d{4}/)) || null;
      }

      function arrangePost(post) {
        applyPostVisuals(post);

        const header = post.querySelector(`[${MARK_HEADER}]`);
        const actions = post.querySelector(`[${MARK_ACTIONS}]`);
        const reply = post.querySelector(`[${MARK_REPLY}]`);
        const replyMeta = post.querySelector(`[${MARK_REPLY_META}]`);
        const dateWrap = post.querySelector(`[${MARK_DATE_WRAP}]`);
        if (!header || !actions) return;

        const state = getPostState(post, { reply, replyMeta });
        const key = `${settings.enabled}|${settings.replyPlacement}|${settings.replyMetaInHeader}`;
        if (state.appliedKey === key) return;

        restorePost(post);
        state.appliedKey = key;
        if (!settings.enabled) return;

        if (settings.replyPlacement === "header" && reply) {
          const wrap = ensureHeaderReplySlot(post, header);
          wrap.appendChild(reply);
        } else if (settings.replyPlacement === "menu" && reply) {
          const store = ensureReplyMenu(post, header);
          store.appendChild(reply);
        }

        if (settings.replyMetaInHeader && replyMeta && dateWrap) {
          dateWrap.appendChild(replyMeta);
        }

        updateActionsVisibility(actions, state);
      }

      function applyPostVisuals(post) {
        if (settings.enabled && settings.background) {
          post.style.setProperty("background", settings.backgroundColor, "important");
          post.style.setProperty("background-color", settings.backgroundColor, "important");
        } else {
          post.style.removeProperty("background");
          post.style.removeProperty("background-color");
        }

        if (settings.enabled) {
          post.style.setProperty("border-radius", settings.rounded ? `${settings.radius}px` : "0", "important");
          return;
        }

        clearPostVisuals(post);
      }

      function clearPostVisuals(post) {
        post.style.removeProperty("background");
        post.style.removeProperty("background-color");
        post.style.removeProperty("border-radius");
      }

      function getPostState(post, nodes = {}) {
        let state = postState.get(post);
        if (!state) {
          state = {};
          postState.set(post, state);
        }

        if (nodes.reply && !state.replyParent) {
          state.replyParent = nodes.reply.parentNode;
          state.replyNext = nodes.reply.nextSibling;
        }

        if (nodes.replyMeta && !state.replyMetaParent) {
          state.replyMetaParent = nodes.replyMeta.parentNode;
          state.replyMetaNext = nodes.replyMeta.nextSibling;
        }

        return state;
      }

      function restorePost(post) {
        const state = postState.get(post);
        if (!state) return;

        const reply = post.querySelector(`[${MARK_REPLY}]`);
        if (reply && state.replyParent && reply.parentNode !== state.replyParent) {
          state.replyParent.insertBefore(reply, state.replyNext && state.replyNext.parentNode === state.replyParent ? state.replyNext : null);
        }

        const replyMeta = post.querySelector(`[${MARK_REPLY_META}]`);
        if (replyMeta && state.replyMetaParent && replyMeta.parentNode !== state.replyMetaParent) {
          state.replyMetaParent.insertBefore(
            replyMeta,
            state.replyMetaNext && state.replyMetaNext.parentNode === state.replyMetaParent ? state.replyMetaNext : null,
          );
        }

        post.querySelectorAll(".cudloun-post-tweaks-header-reply").forEach((node) => node.remove());
        post.querySelectorAll(`[${MARK_REPLY_MENU}]`).forEach((node) => node.remove());
        document.querySelectorAll(`[${MARK_NATIVE_REPLY_ITEM}]`).forEach((node) => node.remove());
        updateActionsVisibility(post.querySelector(`[${MARK_ACTIONS}]`), state);
        state.appliedKey = "";
      }

      function ensureHeaderReplySlot(post, header) {
        let slot = post.querySelector(".cudloun-post-tweaks-header-reply");
        if (!slot) {
          slot = document.createElement("span");
          slot.className = "cudloun-post-tweaks-header-reply";
          header.appendChild(slot);
        }
        return slot;
      }

      function ensureReplyMenu(post, header) {
        let store = post.querySelector(`[${MARK_REPLY_MENU}]`);
        if (!store) {
          store = document.createElement("span");
          store.className = "cudloun-post-tweaks-reply-store";
          store.setAttribute(MARK_REPLY_MENU, "true");
          post.appendChild(store);
        }

        return store;
      }

      function ensureNativeMenuHooks(post, header, avatar) {
        const nativeMenu = findNativePostMenuButton(header);
        const state = getPostState(post);

        if (nativeMenu && state.nativeMenuButton !== nativeMenu) {
          if (state.nativeMenuButton && state.nativeMenuHandler) {
            state.nativeMenuButton.removeEventListener("click", state.nativeMenuHandler);
          }

          state.nativeMenuButton = nativeMenu;
          state.nativeMenuHandler = () => {
            scheduleNativeMenuTweaks(post, nativeMenu);
          };
          nativeMenu.setAttribute(MARK_NATIVE_MENU_HOOK, "true");
          nativeMenu.addEventListener("click", state.nativeMenuHandler);
        }

        if (avatar && state.avatar !== avatar) {
          if (state.avatar && state.avatarMenuHandler) {
            state.avatar.removeEventListener("click", state.avatarMenuHandler);
          }

          state.avatar = avatar;
          state.avatarMenuHandler = (event) => {
            if (!settings.enabled || !settings.avatarMenu) return;

            const menuButton = findNativePostMenuButton(header);
            if (!menuButton) return;

            event.preventDefault();
            event.stopPropagation();
            window.setTimeout(() => {
              menuButton.click();
              scheduleNativeMenuTweaks(post, avatar, true, "left");
            }, 0);
          };
          avatar.addEventListener("click", state.avatarMenuHandler);
        }
      }

      function cleanupNativeMenuHooks(post) {
        const state = postState.get(post);
        if (!state) return;

        if (state.nativeMenuButton && state.nativeMenuHandler) {
          state.nativeMenuButton.removeEventListener("click", state.nativeMenuHandler);
        }
        if (state.avatar && state.avatarMenuHandler) {
          state.avatar.removeEventListener("click", state.avatarMenuHandler);
        }

        state.nativeMenuButton = null;
        state.nativeMenuHandler = null;
        state.avatar = null;
        state.avatarMenuHandler = null;
      }

      function findNativePostMenuButton(header) {
        if (!header) return null;
        return Array.from(header.querySelectorAll('button[aria-label="menu"]')).find(
          (button) => !button.closest(`[${MARK_REPLY_MENU}]`),
        ) || null;
      }

      function scheduleNativeMenuTweaks(post, button, forcePopout = false, align = "right") {
        const rect = button.getBoundingClientRect();
        const anchor = {
          top: Math.round(rect.bottom + 4),
          forcePopout,
        };

        if (align === "left") {
          anchor.left = Math.max(8, Math.min(Math.round(rect.left), window.innerWidth - 204));
        } else {
          anchor.right = Math.max(8, Math.round(window.innerWidth - rect.right));
        }

        [0, 40, 120, 260].forEach((delay) => {
          window.setTimeout(() => tweakNativePostMenu(post, anchor), delay);
        });
      }

      function tweakNativePostMenu(post, anchor) {
        const menu = findOpenPostMenu();
        if (!menu) return;

        applyNativeMenuPopout(menu, anchor);
        injectNativeReplyItem(post, menu);
      }

      function injectNativeReplyItem(post, menu) {
        const reply = post.querySelector(`[${MARK_REPLY}]`);
        if (!reply) return;

        document.querySelectorAll(`[${MARK_NATIVE_REPLY_ITEM}]`).forEach((node) => {
          if (!menu.contains(node)) node.remove();
        });
        if (menu.querySelector(`[${MARK_NATIVE_REPLY_ITEM}]`)) return;

        const template = menu.querySelector('li[role="menuitem"]');
        if (!template) return;
        const itemParent = template.parentElement || menu;

        const item = document.createElement("li");
        item.className = template.className;
        item.setAttribute("role", "menuitem");
        item.setAttribute("tabindex", "-1");
        item.setAttribute(MARK_NATIVE_REPLY_ITEM, "true");
        item.innerHTML = `
          <div class="${template.querySelector(".MuiListItemIcon-root")?.className || "MuiListItemIcon-root"}">
            <svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeSmall" focusable="false" aria-hidden="true" viewBox="0 0 24 24">
              <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-.9-5-4-10-11-11z"></path>
            </svg>
          </div>
          <div class="${template.querySelector(".MuiListItemText-root")?.className || "MuiListItemText-root"}">
            <span class="${template.querySelector(".MuiListItemText-primary")?.className || "MuiTypography-root MuiTypography-body1 MuiListItemText-primary"}">ODPOVĚDĚT</span>
          </div>
        `;
        item.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          reply.click();
          document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        });

        const divider = Array.from(itemParent.children).find((child) => child.tagName === "HR");
        itemParent.insertBefore(item, divider || template.nextSibling);
      }

      function applyNativeMenuPopout(menu, anchor) {
        if (!settings.nativeMenuPopout && !anchor.forcePopout) return;

        document.querySelectorAll(`[${MARK_NATIVE_MENU_POPOUT}]`).forEach(clearNativeMenuPopout);

        const surface = findMenuPopoutSurface(menu);
        const modal = surface.closest('[role="presentation"], .MuiModal-root');
        if (modal instanceof HTMLElement) {
          modal.setAttribute(MARK_NATIVE_MENU_MODAL, "true");
          modal.style.setProperty("pointer-events", "none", "important");
          const backdrop = modal.querySelector(".MuiBackdrop-root");
          if (backdrop instanceof HTMLElement) {
            backdrop.style.setProperty("background", "transparent", "important");
            backdrop.style.setProperty("opacity", "0", "important");
            backdrop.style.setProperty("backdrop-filter", "none", "important");
            backdrop.style.setProperty("pointer-events", "none", "important");
          }
        }

        surface.setAttribute(MARK_NATIVE_MENU_POPOUT, "true");
        surface.style.setProperty("--cudloun-post-tweaks-menu-top", `${anchor.top}px`);
        if (typeof anchor.left === "number") {
          surface.style.setProperty("--cudloun-post-tweaks-menu-left", `${anchor.left}px`);
          surface.style.removeProperty("--cudloun-post-tweaks-menu-right");
        } else {
          surface.style.setProperty("--cudloun-post-tweaks-menu-right", `${anchor.right}px`);
          surface.style.removeProperty("--cudloun-post-tweaks-menu-left");
        }
        surface.style.setProperty("position", "fixed", "important");
        surface.style.setProperty("top", `${anchor.top}px`, "important");
        if (typeof anchor.left === "number") {
          surface.style.setProperty("left", `${anchor.left}px`, "important");
          surface.style.setProperty("right", "auto", "important");
        } else {
          surface.style.setProperty("right", `${anchor.right}px`, "important");
          surface.style.setProperty("left", "auto", "important");
        }
        surface.style.setProperty("bottom", "auto", "important");
        surface.style.setProperty("width", "max-content", "important");
        surface.style.setProperty("min-width", "196px", "important");
        surface.style.setProperty("max-width", "calc(100vw - 16px)", "important");
        surface.style.setProperty("max-height", `calc(100vh - ${anchor.top}px - 8px)`, "important");
        surface.style.setProperty("margin", "0", "important");
        surface.style.setProperty("transform", "none", "important");
        surface.style.setProperty("overflow", "auto", "important");
        surface.style.setProperty("border-radius", "8px", "important");
        surface.style.setProperty("visibility", "visible", "important");
        surface.style.setProperty("pointer-events", "auto", "important");
        suppressOtherNativePostMenus(surface);
      }

      function handleNativePopoutOutside(event) {
        if (!settings.nativeMenuPopout && !settings.avatarMenu) return;

        const surface = document.querySelector(`[${MARK_NATIVE_MENU_POPOUT}]`);
        if (!surface) return;
        if (surface.contains(event.target)) return;
        if (event.target instanceof Element && event.target.closest(`[${MARK_NATIVE_MENU_HOOK}]`)) return;
        if (event.target instanceof Element && event.target.closest(`[${MARK_AVATAR}]`)) return;

        const modal = surface.closest('[role="presentation"]');
        const backdrop = modal?.querySelector(".MuiBackdrop-root");
        if (backdrop instanceof HTMLElement) {
          backdrop.click();
        }
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        window.setTimeout(() => {
          clearNativeMenuPopout(surface);
          document.querySelectorAll(`[${MARK_NATIVE_REPLY_ITEM}]`).forEach((node) => node.remove());
        }, 80);
      }

      function clearNativeMenuPopout(node) {
        const modal = node.closest(`[${MARK_NATIVE_MENU_MODAL}]`);
        if (modal instanceof HTMLElement) {
          modal.removeAttribute(MARK_NATIVE_MENU_MODAL);
          modal.style.removeProperty("pointer-events");
          const backdrop = modal.querySelector(".MuiBackdrop-root");
          if (backdrop instanceof HTMLElement) {
            ["background", "opacity", "backdrop-filter", "pointer-events"].forEach((name) => {
              backdrop.style.removeProperty(name);
            });
          }
        }

        node.removeAttribute(MARK_NATIVE_MENU_POPOUT);
        document.querySelectorAll(`[${MARK_NATIVE_MENU_SUPPRESSED}]`).forEach((suppressed) => {
          suppressed.removeAttribute(MARK_NATIVE_MENU_SUPPRESSED);
          suppressed.style.removeProperty("display");
          suppressed.style.removeProperty("visibility");
          suppressed.style.removeProperty("pointer-events");
        });
        [
          "--cudloun-post-tweaks-menu-top",
          "--cudloun-post-tweaks-menu-right",
          "--cudloun-post-tweaks-menu-left",
          "position",
          "top",
          "right",
          "bottom",
          "left",
          "width",
          "min-width",
          "max-width",
          "max-height",
          "margin",
          "transform",
          "overflow",
          "border-radius",
          "visibility",
          "pointer-events",
        ].forEach((name) => node.style.removeProperty(name));
      }

      function suppressOtherNativePostMenus(activeSurface) {
        Array.from(document.querySelectorAll('[role="menu"], [role="dialog"], [role="presentation"]'))
          .filter((node) => node instanceof HTMLElement)
          .filter((node) => node !== activeSurface && !node.contains(activeSurface) && !activeSurface.contains(node))
          .filter((node) => {
            const text = node.textContent || "";
            if (!text.includes("Označit jako nejstarší nový") && !text.includes("Smazat příspěvek")) return false;
            const rect = node.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          })
          .forEach((node) => {
            node.setAttribute(MARK_NATIVE_MENU_SUPPRESSED, "true");
            node.style.setProperty("display", "none", "important");
            node.style.setProperty("visibility", "hidden", "important");
            node.style.setProperty("pointer-events", "none", "important");
          });
      }

      function findMenuPopoutSurface(menu) {
        const candidates = [menu, ...Array.from(menu.querySelectorAll("*"))]
          .filter((node) => node instanceof HTMLElement)
          .filter((node) => {
            const text = node.textContent || "";
            if (!text.includes("Označit jako nejstarší nový") && !text.includes("Smazat příspěvek")) return false;
            const rect = node.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && node.querySelector('li[role="menuitem"]');
          })
          .map((node) => ({ node, area: node.getBoundingClientRect().width * node.getBoundingClientRect().height }))
          .sort((a, b) => a.area - b.area);

        const content = candidates[0]?.node || menu;
        return content.closest('[role="dialog"]') || content;
      }

      function findOpenPostMenu() {
        const babegutsMenu = window.Cudloun?.babeguts?.smallestVisibleMenu?.("post");
        if (babegutsMenu) return babegutsMenu;

        return Array.from(document.querySelectorAll('[role="menu"], [role="dialog"], [role="presentation"]'))
          .map((menu) => {
            const rect = menu.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return null;
            const text = menu.textContent || "";
            const isPostMenu = text.includes("Označit jako nejstarší nový") || text.includes("Smazat příspěvek");
            if (!isPostMenu || !menu.querySelector('li[role="menuitem"]')) return null;
            return { menu, area: rect.width * rect.height };
          })
          .filter(Boolean)
          .sort((a, b) => a.area - b.area)
          .map((entry) => entry.menu)[0] || null;
      }

      function getBabegutsPosts() {
        const helper = window.Cudloun?.babeguts;
        if (helper && typeof helper.allPosts === "function") {
          return helper.allPosts();
        }
        return Array.from(document.querySelectorAll(".content-item.board-post"));
      }

      function getBabegutsParts(post) {
        const helper = window.Cudloun?.babeguts;
        if (helper && typeof helper.postParts === "function") {
          return helper.postParts(post);
        }
        return null;
      }

      function updateActionsVisibility(actions, state) {
        if (!actions || !state) return;
        const hasLocalReply = !!actions.querySelector(`[${MARK_REPLY}]`);
        const hasLocalMeta = !!actions.querySelector(`[${MARK_REPLY_META}]`);
        actions.toggleAttribute("data-cudloun-post-tweaks-empty", !hasLocalReply && !hasLocalMeta);
      }

      function installStyles() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
          #${PANEL_ID} {
            position: fixed;
            right: 10px;
            bottom: 10px;
            z-index: 1800;
            width: min(310px, calc(100vw - 16px));
            max-height: min(560px, calc(100dvh - 16px));
            border: 1px solid rgba(79,102,134,.28);
            border-radius: 8px;
            background: #fff;
            color: #182230;
            box-shadow: 0 12px 34px rgba(18,27,43,.24);
            font: 13px/1.35 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            overflow: hidden;
          }

          #${PANEL_ID} details {
            max-height: inherit;
            overflow: auto;
            overscroll-behavior: contain;
            scrollbar-gutter: stable;
            touch-action: pan-y;
            padding: 0 8px 8px;
          }

          #${PANEL_ID} summary {
            position: sticky;
            top: 0;
            z-index: 1;
            margin: 0 -8px 4px;
            padding: 8px 10px;
            background: #fff;
            border-bottom: 1px solid rgba(79,102,134,.16);
            cursor: pointer;
            font-weight: 750;
            letter-spacing: 0;
            user-select: none;
            touch-action: none;
          }

          #${PANEL_ID} label {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 6px;
            align-items: center;
            margin-top: 7px;
          }

          #${PANEL_ID} input[type="range"] {
            grid-column: 1 / -1;
            width: 100%;
          }

          #${PANEL_ID} select,
          #${PANEL_ID} input[type="color"],
          #${PANEL_ID} input[type="text"] {
            min-width: 112px;
            border: 1px solid rgba(79,102,134,.26);
            border-radius: 6px;
            background: #fff;
            color: #243041;
            font: inherit;
            padding: 3px 6px;
          }

          #${PANEL_ID} input[type="color"] {
            width: 112px;
            height: 28px;
            padding: 2px;
          }

          #${PANEL_ID} input[data-setting="backgroundColorManual"] {
            width: 112px;
          }

          #${PANEL_ID} .cudloun-post-tweaks-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 8px;
          }

          #${PANEL_ID} .cudloun-post-tweaks-share[hidden] {
            display: none !important;
          }

          #${PANEL_ID} .cudloun-post-tweaks-share {
            margin-top: 8px;
          }

          #${PANEL_ID} textarea {
            box-sizing: border-box;
            width: 100%;
            min-height: 104px;
            max-height: 180px;
            resize: vertical;
            border: 1px solid rgba(79,102,134,.26);
            border-radius: 6px;
            background: #fff;
            color: #243041;
            font: 12px/1.4 Consolas, "SFMono-Regular", monospace;
            padding: 7px;
          }

          #${PANEL_ID} textarea:focus {
            outline: 2px solid rgba(8,126,164,.22);
            outline-offset: 1px;
          }

          #${PANEL_ID} button {
            appearance: none;
            border: 1px solid rgba(79,102,134,.26);
            border-radius: 6px;
            background: #f8fafc;
            color: #243041;
            cursor: pointer;
            font: 700 12px/1.2 inherit;
            padding: 6px 8px;
          }

          @media (max-width: 700px) {
            #${PANEL_ID} {
              right: 8px;
              bottom: 8px;
              width: min(288px, calc(100vw - 16px));
              max-height: min(430px, calc(100dvh - 18px));
              font-size: 12px;
            }

            #${PANEL_ID} details {
              padding: 0 7px 7px;
            }

            #${PANEL_ID} summary {
              margin: 0 -7px 3px;
              padding: 7px 9px;
            }

            #${PANEL_ID} label {
              gap: 5px;
              margin-top: 6px;
            }

            #${PANEL_ID} select,
            #${PANEL_ID} input[type="color"] {
              min-width: 92px;
              max-width: 128px;
            }

            #${PANEL_ID} input[type="color"] {
              width: 112px;
            }

            #${PANEL_ID} textarea {
              min-height: 92px;
              max-height: 150px;
            }
          }

          .cudloun-post-tweaks-reply-store {
            display: none !important;
          }

          html[data-cudloun-post-tweaks-native-menu-popout="true"] [${MARK_NATIVE_MENU_POPOUT}] {
            position: fixed !important;
            top: var(--cudloun-post-tweaks-menu-top, 48px) !important;
            right: var(--cudloun-post-tweaks-menu-right, 8px) !important;
            left: var(--cudloun-post-tweaks-menu-left, auto) !important;
            bottom: auto !important;
            width: max-content !important;
            min-width: 196px !important;
            max-width: calc(100vw - 16px) !important;
            max-height: calc(100vh - var(--cudloun-post-tweaks-menu-top, 48px) - 8px) !important;
            margin: 0 !important;
            transform: none !important;
            overflow: auto !important;
            border-radius: 8px !important;
            box-shadow: 0 10px 28px rgba(18,27,43,.24) !important;
          }

          [${MARK_NATIVE_MENU_MODAL}] {
            pointer-events: none !important;
          }

          [${MARK_NATIVE_MENU_MODAL}] .MuiBackdrop-root {
            background: transparent !important;
            opacity: 0 !important;
            backdrop-filter: none !important;
            pointer-events: none !important;
          }

          [${MARK_NATIVE_MENU_MODAL}] [${MARK_NATIVE_MENU_POPOUT}] {
            pointer-events: auto !important;
          }

          html[data-cudloun-post-tweaks-enabled="true"][data-cudloun-post-tweaks-avatar-menu="true"] [${MARK_NATIVE_MENU_HOOK}] {
            display: none !important;
          }

          html[data-cudloun-post-tweaks-enabled="true"][data-cudloun-post-tweaks-avatar-menu="true"] [${MARK_AVATAR}] {
            cursor: pointer !important;
          }

          html[data-cudloun-post-tweaks-enabled="true"] [${MARK_POST}] {
            margin-bottom: var(--cudloun-post-tweaks-post-spacing, 4px) !important;
            font-size: var(--cudloun-post-tweaks-font-scale, 100%) !important;
            position: relative !important;
          }

          html[data-cudloun-post-tweaks-enabled="true"] [${MARK_POST}] {
            border-radius: 0 !important;
          }

          html[data-cudloun-post-tweaks-enabled="true"][data-cudloun-post-tweaks-rounded="true"] [${MARK_POST}] {
            border-radius: var(--cudloun-post-tweaks-radius, 0px) !important;
          }

          html[data-cudloun-post-tweaks-enabled="true"][data-cudloun-post-tweaks-divider="true"] [${MARK_POST}]:not([${MARK_FIRST_POST}])::before {
            content: "" !important;
            position: absolute !important;
            left: var(--cudloun-post-tweaks-divider-inset, 0px) !important;
            right: var(--cudloun-post-tweaks-divider-inset, 0px) !important;
            top: var(--cudloun-post-tweaks-divider-offset, -2px) !important;
            border-top: var(--cudloun-post-tweaks-divider-width, 1px) var(--cudloun-post-tweaks-divider-style, solid) var(--cudloun-post-tweaks-divider-color, #000) !important;
            pointer-events: none !important;
            z-index: 2 !important;
          }

          html[data-cudloun-post-tweaks-enabled="true"][data-cudloun-post-tweaks-background="true"] [${MARK_POST}] {
            background: var(--cudloun-post-tweaks-background-color, #fff) !important;
            background-color: var(--cudloun-post-tweaks-background-color, #fff) !important;
          }

          html[data-cudloun-post-tweaks-enabled="true"][data-cudloun-theme-tweaks-enabled="true"][data-cudloun-post-tweaks-background="true"] .content-item.board-post[${MARK_POST}],
          html[data-cudloun-post-tweaks-enabled="true"][data-cudloun-theme-tweaks-enabled="true"][data-cudloun-post-tweaks-background="true"] .MuiPaper-root.content-item[${MARK_POST}] {
            background: var(--cudloun-post-tweaks-background-color, #fff) !important;
            background-color: var(--cudloun-post-tweaks-background-color, #fff) !important;
          }

          html[data-cudloun-post-tweaks-enabled="true"] [${MARK_HEADER}] {
            font-size: var(--cudloun-post-tweaks-header-scale, 88%) !important;
          }

          html[data-cudloun-post-tweaks-enabled="true"] [${MARK_HEADER}] * {
            line-height: 1.18 !important;
          }

          html[data-cudloun-post-tweaks-enabled="true"] [${MARK_BODY}],
          html[data-cudloun-post-tweaks-enabled="true"] [${MARK_ACTIONS}] {
            font-size: var(--cudloun-post-tweaks-font-scale, 100%) !important;
          }

          html[data-cudloun-post-tweaks-enabled="true"] [${MARK_BODY}] * {
            font-size: inherit !important;
            line-height: inherit !important;
          }

          html[data-cudloun-post-tweaks-enabled="true"] [${MARK_CONTENT}] img {
            max-width: 100% !important;
            height: auto !important;
          }

          html[data-cudloun-post-tweaks-enabled="true"] .cudloun-post-tweaks-header-reply {
            display: inline-flex !important;
            align-items: center !important;
            margin-left: auto !important;
          }

          html[data-cudloun-post-tweaks-enabled="true"] .cudloun-post-tweaks-header-reply [${MARK_REPLY}] {
            min-width: 0 !important;
            padding: 2px 6px !important;
            font-size: .82em !important;
            line-height: 1.1 !important;
          }

          html[data-cudloun-post-tweaks-enabled="true"] [${MARK_ACTIONS}][data-cudloun-post-tweaks-empty] {
            display: none !important;
          }

          html[data-cudloun-post-tweaks-enabled="true"][data-cudloun-theme-tweaks-enabled="true"] [${MARK_AVATAR}].avatar-container,
          html[data-cudloun-post-tweaks-enabled="true"][data-cudloun-theme-tweaks-enabled="true"] [${MARK_AVATAR}].avatar-container .MuiAvatar-root.content-avatar,
          html[data-cudloun-post-tweaks-enabled="true"][data-cudloun-theme-tweaks-enabled="true"] [${MARK_AVATAR}] .content-avatar,
          html[data-cudloun-post-tweaks-enabled="true"][data-cudloun-theme-tweaks-enabled="true"] [${MARK_AVATAR}] .MuiAvatar-root {
            width: var(--cudloun-post-tweaks-avatar-size, 28px) !important;
            height: var(--cudloun-post-tweaks-avatar-size, 28px) !important;
            min-width: var(--cudloun-post-tweaks-avatar-size, 28px) !important;
            font-size: var(--cudloun-post-tweaks-avatar-font-size, 12px) !important;
            border: 0 !important;
            box-shadow: none !important;
          }

          html[data-cudloun-post-tweaks-enabled="true"][data-cudloun-theme-tweaks-enabled="true"] [${MARK_AVATAR}].avatar-container .MuiAvatar-root.content-avatar img,
          html[data-cudloun-post-tweaks-enabled="true"][data-cudloun-theme-tweaks-enabled="true"] [${MARK_AVATAR}] .content-avatar img,
          html[data-cudloun-post-tweaks-enabled="true"][data-cudloun-theme-tweaks-enabled="true"] [${MARK_AVATAR}] .MuiAvatar-root img {
            width: var(--cudloun-post-tweaks-avatar-size, 28px) !important;
            height: var(--cudloun-post-tweaks-avatar-size, 28px) !important;
            object-fit: cover !important;
            border: 0 !important;
            box-shadow: none !important;
          }

          @media (max-width: 700px) {
            html[data-cudloun-post-tweaks-enabled="true"] [${MARK_POST}] {
              box-sizing: border-box !important;
              width: calc(100% - var(--cudloun-post-tweaks-card-inset, 0px) - var(--cudloun-post-tweaks-card-inset, 0px)) !important;
              max-width: calc(100% - var(--cudloun-post-tweaks-card-inset, 0px) - var(--cudloun-post-tweaks-card-inset, 0px)) !important;
              margin-left: auto !important;
              margin-right: auto !important;
              padding-left: var(--cudloun-post-tweaks-side-padding, 4px) !important;
              padding-right: var(--cudloun-post-tweaks-side-padding, 4px) !important;
              padding-bottom: var(--cudloun-post-tweaks-side-padding, 4px) !important;
              margin-bottom: var(--cudloun-post-tweaks-post-spacing, 4px) !important;
              font-size: var(--cudloun-post-tweaks-font-scale, 100%) !important;
            }

            html[data-cudloun-post-tweaks-enabled="true"][data-cudloun-post-tweaks-background="true"] [${MARK_POST}] {
              background: var(--cudloun-post-tweaks-background-color, #fff) !important;
              background-color: var(--cudloun-post-tweaks-background-color, #fff) !important;
            }

            html[data-cudloun-post-tweaks-enabled="true"] [${MARK_ROW}] {
              display: flex !important;
              flex-direction: column !important;
              align-items: stretch !important;
              gap: 2px !important;
            }

            html[data-cudloun-post-tweaks-enabled="true"][data-cudloun-post-tweaks-avatar-inline="true"] [${MARK_ROW}] {
              display: grid !important;
              grid-template-columns: var(--cudloun-post-tweaks-avatar-size, 28px) minmax(0, 1fr) !important;
              column-gap: 6px !important;
              row-gap: 2px !important;
              align-items: start !important;
            }

            html[data-cudloun-post-tweaks-enabled="true"] [${MARK_AVATAR}] {
              width: var(--cudloun-post-tweaks-avatar-size, 28px) !important;
              height: var(--cudloun-post-tweaks-avatar-size, 28px) !important;
              min-width: 0 !important;
              align-self: flex-start !important;
              margin: 0 0 -2px 0 !important;
            }

            html[data-cudloun-post-tweaks-enabled="true"][data-cudloun-post-tweaks-avatar-inline="true"] [${MARK_AVATAR}] {
              grid-column: 1 !important;
              grid-row: 1 !important;
              margin: 0 !important;
            }

            html[data-cudloun-post-tweaks-enabled="true"] [${MARK_AVATAR}] .content-avatar,
            html[data-cudloun-post-tweaks-enabled="true"] [${MARK_AVATAR}] .MuiAvatar-root {
              width: var(--cudloun-post-tweaks-avatar-size, 28px) !important;
              height: var(--cudloun-post-tweaks-avatar-size, 28px) !important;
              min-width: var(--cudloun-post-tweaks-avatar-size, 28px) !important;
              font-size: var(--cudloun-post-tweaks-avatar-font-size, 12px) !important;
            }

            html[data-cudloun-post-tweaks-enabled="true"][data-cudloun-theme-tweaks-enabled="true"] [${MARK_AVATAR}].avatar-container,
            html[data-cudloun-post-tweaks-enabled="true"][data-cudloun-theme-tweaks-enabled="true"] [${MARK_AVATAR}].avatar-container .MuiAvatar-root.content-avatar {
              width: var(--cudloun-post-tweaks-avatar-size, 28px) !important;
              height: var(--cudloun-post-tweaks-avatar-size, 28px) !important;
              min-width: var(--cudloun-post-tweaks-avatar-size, 28px) !important;
            }

            html[data-cudloun-post-tweaks-enabled="true"] [${MARK_AVATAR}] .content-avatar img,
            html[data-cudloun-post-tweaks-enabled="true"] [${MARK_AVATAR}] .MuiAvatar-root img {
              width: var(--cudloun-post-tweaks-avatar-size, 28px) !important;
              height: var(--cudloun-post-tweaks-avatar-size, 28px) !important;
              object-fit: cover !important;
            }

            html[data-cudloun-post-tweaks-enabled="true"][data-cudloun-theme-tweaks-enabled="true"] [${MARK_AVATAR}].avatar-container .MuiAvatar-root.content-avatar img {
              width: var(--cudloun-post-tweaks-avatar-size, 28px) !important;
              height: var(--cudloun-post-tweaks-avatar-size, 28px) !important;
              object-fit: cover !important;
            }

            html[data-cudloun-post-tweaks-enabled="true"] [${MARK_CONTENT}] {
              box-sizing: border-box !important;
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              margin-left: 0 !important;
            }

            html[data-cudloun-post-tweaks-enabled="true"] [${MARK_CONTENT}] > * {
              box-sizing: border-box !important;
              width: 100% !important;
              max-width: 100% !important;
            }

            html[data-cudloun-post-tweaks-enabled="true"][data-cudloun-post-tweaks-avatar-inline="true"] [${MARK_CONTENT}] {
              display: contents !important;
            }

            html[data-cudloun-post-tweaks-enabled="true"] [${MARK_HEADER}] {
              position: relative !important;
              width: 100% !important;
              min-width: 0 !important;
              display: flex !important;
              flex-wrap: wrap !important;
              align-items: baseline !important;
              column-gap: 6px !important;
              row-gap: 0 !important;
              min-height: 0 !important;
              height: auto !important;
              font-size: var(--cudloun-post-tweaks-header-scale, 88%) !important;
              line-height: 1.18 !important;
              overflow-wrap: anywhere !important;
            }

            html[data-cudloun-post-tweaks-enabled="true"][data-cudloun-post-tweaks-avatar-inline="true"] [${MARK_HEADER}] {
              grid-column: 2 !important;
              grid-row: 1 !important;
              align-self: center !important;
            }

            html[data-cudloun-post-tweaks-enabled="true"] [${MARK_HEADER}] * {
              max-width: 100% !important;
              min-width: 0 !important;
              line-height: 1.18 !important;
              overflow-wrap: anywhere !important;
              white-space: normal !important;
            }

            html[data-cudloun-post-tweaks-enabled="true"] [${MARK_DATE_WRAP}] {
              display: inline-flex !important;
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 1px !important;
              min-width: 0 !important;
              max-width: calc(100% - 34px) !important;
            }

            html[data-cudloun-post-tweaks-enabled="true"] [${MARK_REPLY_META}] {
              display: inline-block !important;
              max-width: 100% !important;
              color: rgba(54,65,82,.8) !important;
              font-size: .82em !important;
              line-height: 1.14 !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
              white-space: nowrap !important;
            }

            html[data-cudloun-post-tweaks-enabled="true"] [${MARK_REPLY_META}] a {
              color: inherit !important;
            }

            html[data-cudloun-post-tweaks-enabled="true"] [${MARK_BODY}] {
              width: 100% !important;
              max-width: 100% !important;
              margin-left: 0 !important;
              padding-left: 0 !important;
              font-size: var(--cudloun-post-tweaks-font-scale, 100%) !important;
              line-height: 1.5 !important;
              overflow-wrap: anywhere !important;
            }

            html[data-cudloun-post-tweaks-enabled="true"] [${MARK_BODY}] * {
              font-size: inherit !important;
              line-height: inherit !important;
            }

            html[data-cudloun-post-tweaks-enabled="true"][data-cudloun-post-tweaks-avatar-inline="true"] [${MARK_BODY}] {
              grid-column: 1 / -1 !important;
              grid-row: 2 !important;
            }

            html[data-cudloun-post-tweaks-enabled="true"][data-cudloun-post-tweaks-avatar-inline="true"] [${MARK_CONTENT}] > :not([${MARK_HEADER}]) {
              grid-column: 1 / -1 !important;
              min-width: 0 !important;
              max-width: 100% !important;
            }

            html[data-cudloun-post-tweaks-enabled="true"] [${MARK_CONTENT}] img {
              max-width: 100% !important;
              height: auto !important;
            }

            html[data-cudloun-post-tweaks-enabled="true"] .cudloun-post-tweaks-header-reply {
              position: absolute !important;
              right: 28px !important;
              top: 0 !important;
              display: inline-flex !important;
              align-items: center !important;
              margin-left: 0 !important;
            }

            html[data-cudloun-post-tweaks-enabled="true"] .cudloun-post-tweaks-header-reply [${MARK_REPLY}] {
              min-width: 0 !important;
              padding: 2px 6px !important;
              font-size: .82em !important;
              line-height: 1.1 !important;
            }

            html[data-cudloun-post-tweaks-enabled="true"] [${MARK_ACTIONS}] {
              width: 100% !important;
              max-width: 100% !important;
              margin-left: 0 !important;
              padding-left: 0 !important;
              font-size: var(--cudloun-post-tweaks-font-scale, 100%) !important;
            }

            html[data-cudloun-post-tweaks-enabled="true"] [${MARK_ACTIONS}][data-cudloun-post-tweaks-empty] {
              display: none !important;
            }
          }
        `;
        document.head.appendChild(style);
      }

      function installPanel() {
        if (document.getElementById(PANEL_ID)) return;

        const panel = document.createElement("div");
        panel.id = PANEL_ID;
        panel.innerHTML = `
          <details open>
            <summary>Post Tweaks</summary>
            <label>
              <span>Compact posts</span>
              <input data-setting="enabled" type="checkbox">
            </label>
            <label>
              <span>Avatar in header</span>
              <input data-setting="avatarInline" type="checkbox">
            </label>
            <label>
              <span>Reply button</span>
              <select data-setting="replyPlacement">
                <option value="bottom">Bottom</option>
                <option value="header">Header</option>
                <option value="menu">Header menu</option>
              </select>
            </label>
            <label>
              <span>Reply link in header</span>
              <input data-setting="replyMetaInHeader" type="checkbox">
            </label>
            <label>
              <span>Avatar opens menu</span>
              <input data-setting="avatarMenu" type="checkbox">
            </label>
            <label>
              <span>Pop out post menu</span>
              <input data-setting="nativeMenuPopout" type="checkbox">
            </label>
            <label>
              <span>Dividing lines</span>
              <input data-setting="divider" type="checkbox">
            </label>
            <label>
              <span>Line width</span>
              <output data-output="dividerWidth"></output>
              <input data-setting="dividerWidth" type="range" min="1" max="6" step="1">
            </label>
            <label>
              <span>Dashed line</span>
              <input data-setting="dividerDashed" type="checkbox">
            </label>
            <label>
              <span>Line color</span>
              <input data-setting="dividerColor" type="color">
            </label>
            <label>
              <span>Round corners</span>
              <input data-setting="rounded" type="checkbox">
            </label>
            <label>
              <span>Corner radius</span>
              <output data-output="radius"></output>
              <input data-setting="radius" type="range" min="0" max="24" step="1">
            </label>
            <label>
              <span>Background</span>
              <input data-setting="background" type="checkbox">
            </label>
            <label>
              <span>Color preset</span>
              <select data-setting="backgroundColor">
                ${COLOR_OPTIONS.map((option) => `<option value="${option.value}">${option.label}</option>`).join("")}
              </select>
            </label>
            <label>
              <span>Custom color</span>
              <input data-setting="backgroundColor" type="color">
            </label>
            <label>
              <span>Manual color</span>
              <input data-setting="backgroundColorManual" type="text" inputmode="text" spellcheck="false" placeholder="#202020">
            </label>
            <label>
              <span>Avatar</span>
              <output data-output="avatarSize"></output>
              <input data-setting="avatarSize" type="range" min="18" max="40" step="1">
            </label>
            <label>
              <span>Card inset</span>
              <output data-output="cardInset"></output>
              <input data-setting="cardInset" type="range" min="0" max="36" step="1">
            </label>
            <label>
              <span>Side padding</span>
              <output data-output="sidePadding"></output>
              <input data-setting="sidePadding" type="range" min="0" max="16" step="1">
            </label>
            <label>
              <span>Space between posts</span>
              <output data-output="postSpacing"></output>
              <input data-setting="postSpacing" type="range" min="0" max="28" step="1">
            </label>
            <label>
              <span>Header size</span>
              <output data-output="headerScale"></output>
              <input data-setting="headerScale" type="range" min="72" max="105" step="1">
            </label>
            <label>
              <span>Font size</span>
              <output data-output="fontScale"></output>
              <input data-setting="fontScale" type="range" min="82" max="118" step="1">
            </label>
            <div class="cudloun-post-tweaks-actions">
              <button type="button" data-action="reset">Reset</button>
              <button type="button" data-action="hide">Hide</button>
              <button type="button" data-action="export">Export</button>
              <button type="button" data-action="import">Import</button>
            </div>
            <div class="cudloun-post-tweaks-share" hidden>
              <textarea data-share-box spellcheck="false"></textarea>
              <div class="cudloun-post-tweaks-actions">
                <button type="button" data-action="copy-share">Copy</button>
                <button type="button" data-action="apply-share">Apply</button>
                <button type="button" data-action="close-share">Close</button>
              </div>
            </div>
          </details>
        `;

        panel.querySelectorAll("[data-setting]").forEach((input) => {
          input.addEventListener("input", () => updateFromInput(input, "input"));
          input.addEventListener("change", () => updateFromInput(input, "change"));
        });

        installPanelDrag(panel);

        function updateFromInput(input, eventType = "change") {
          const name = input.dataset.setting;
          if (name === "backgroundColorManual") {
            const color = normalizeManualColor(input.value);
            if (!color) {
              if (eventType === "change") syncBackgroundColorInputs(panel);
              return;
            }

            settings.backgroundColor = color;
            syncBackgroundColorInputs(panel, input);
          } else if (input.type === "checkbox") {
            settings[name] = input.checked;
          } else if (input.type === "range") {
            settings[name] = Number(input.value);
          } else {
            settings[name] = input.value;
          }

          if (name === "backgroundColor") {
            syncBackgroundColorInputs(panel, input);
          }

          saveSettings();
          applySettings();
        }

        panel.querySelector("[data-action='reset']").addEventListener("click", () => {
          settings = { ...defaults };
          saveSettings();
          applySettings();
        });

        panel.querySelector("[data-action='hide']").addEventListener("click", () => {
          settings.panelVisible = false;
          saveSettings();
          panel.remove();
        });

        panel.querySelector("[data-action='export']").addEventListener("click", () => {
          const text = exportSettingsText();
          showShareBox(panel, text);
          copyText(text).catch(() => {});
        });

        panel.querySelector("[data-action='import']").addEventListener("click", () => {
          showShareBox(panel, "");
        });

        panel.querySelector("[data-action='copy-share']").addEventListener("click", () => {
          const text = panel.querySelector("[data-share-box]")?.value || "";
          copyText(text).catch(() => {});
        });

        panel.querySelector("[data-action='apply-share']").addEventListener("click", () => {
          const box = panel.querySelector("[data-share-box]");
          if (!box) return;
          try {
            importSettingsText(box.value);
            saveSettings();
            applySettings();
          } catch (error) {
            window.alert(`Could not import Post Tweaks settings: ${error.message}`);
          }
        });

        panel.querySelector("[data-action='close-share']").addEventListener("click", () => {
          panel.querySelector(".cudloun-post-tweaks-share")?.setAttribute("hidden", "");
        });

        document.body.appendChild(panel);
      }

      function installPanelDrag(panel) {
        const handle = panel.querySelector("summary");
        if (!handle) return;

        let drag = null;
        let suppressClick = false;

        handle.addEventListener("pointerdown", (event) => {
          if (event.button !== 0 || event.target.closest("input, select, button, a")) return;

          const rect = panel.getBoundingClientRect();
          drag = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            left: rect.left,
            top: rect.top,
            moved: false,
          };
          handle.setPointerCapture?.(event.pointerId);
        });

        handle.addEventListener("pointermove", (event) => {
          if (!drag || event.pointerId !== drag.pointerId) return;

          const dx = event.clientX - drag.startX;
          const dy = event.clientY - drag.startY;
          if (!drag.moved && Math.hypot(dx, dy) < 4) return;

          drag.moved = true;
          suppressClick = true;
          event.preventDefault();
          movePanel(panel, drag.left + dx, drag.top + dy);
        });

        handle.addEventListener("pointerup", (event) => {
          if (!drag || event.pointerId !== drag.pointerId) return;
          handle.releasePointerCapture?.(event.pointerId);
          drag = null;
          window.setTimeout(() => {
            suppressClick = false;
          }, 0);
        });

        handle.addEventListener("click", (event) => {
          if (!suppressClick) return;
          event.preventDefault();
          event.stopPropagation();
        }, true);

        window.addEventListener("resize", () => {
          const rect = panel.getBoundingClientRect();
          movePanel(panel, rect.left, rect.top);
        });
      }

      function movePanel(panel, left, top) {
        const rect = panel.getBoundingClientRect();
        const margin = 8;
        const maxLeft = Math.max(margin, window.innerWidth - rect.width - margin);
        const maxTop = Math.max(margin, window.innerHeight - rect.height - margin);
        const nextLeft = Math.min(Math.max(margin, left), maxLeft);
        const nextTop = Math.min(Math.max(margin, top), maxTop);

        panel.style.left = `${Math.round(nextLeft)}px`;
        panel.style.top = `${Math.round(nextTop)}px`;
        panel.style.right = "auto";
        panel.style.bottom = "auto";
      }

      function applySettings() {
        const rootStyle = document.documentElement.style;
        document.documentElement.setAttribute("data-cudloun-post-tweaks-enabled", settings.enabled ? "true" : "false");
        document.documentElement.setAttribute("data-cudloun-post-tweaks-avatar-inline", settings.avatarInline ? "true" : "false");
        document.documentElement.setAttribute("data-cudloun-post-tweaks-divider", settings.divider ? "true" : "false");
        document.documentElement.setAttribute("data-cudloun-post-tweaks-divider-dashed", settings.dividerDashed ? "true" : "false");
        document.documentElement.setAttribute("data-cudloun-post-tweaks-background", settings.background ? "true" : "false");
        document.documentElement.setAttribute("data-cudloun-post-tweaks-rounded", settings.rounded ? "true" : "false");
        document.documentElement.setAttribute("data-cudloun-post-tweaks-reply-placement", settings.replyPlacement);
        document.documentElement.setAttribute("data-cudloun-post-tweaks-reply-meta-header", settings.replyMetaInHeader ? "true" : "false");
        document.documentElement.setAttribute("data-cudloun-post-tweaks-native-menu-popout", settings.nativeMenuPopout ? "true" : "false");
        document.documentElement.setAttribute("data-cudloun-post-tweaks-avatar-menu", settings.avatarMenu ? "true" : "false");
        rootStyle.setProperty("--cudloun-post-tweaks-avatar-size", `${settings.avatarSize}px`);
        rootStyle.setProperty("--cudloun-post-tweaks-avatar-font-size", `${Math.round(settings.avatarSize * 0.42)}px`);
        rootStyle.setProperty("--cudloun-post-tweaks-card-inset", `${settings.cardInset}px`);
        rootStyle.setProperty("--cudloun-post-tweaks-side-padding", `${settings.sidePadding}px`);
        rootStyle.setProperty("--cudloun-post-tweaks-post-spacing", `${settings.postSpacing}px`);
        rootStyle.setProperty("--cudloun-post-tweaks-divider-offset", `${Math.round(settings.postSpacing / -2)}px`);
        rootStyle.setProperty("--cudloun-post-tweaks-divider-inset", `${settings.sidePadding}px`);
        rootStyle.setProperty("--cudloun-post-tweaks-divider-width", `${settings.dividerWidth}px`);
        rootStyle.setProperty("--cudloun-post-tweaks-divider-style", settings.dividerDashed ? "dashed" : "solid");
        rootStyle.setProperty("--cudloun-post-tweaks-divider-color", settings.dividerColor);
        rootStyle.setProperty("--cudloun-post-tweaks-radius", `${settings.radius}px`);
        rootStyle.setProperty("--cudloun-post-tweaks-header-scale", `${settings.headerScale}%`);
        rootStyle.setProperty("--cudloun-post-tweaks-font-scale", `${settings.fontScale}%`);
        rootStyle.setProperty("--cudloun-post-tweaks-background-color", settings.backgroundColor);

        const panel = document.getElementById(PANEL_ID);
        if (!panel) return;

        setInput(panel, "enabled", settings.enabled);
        setInput(panel, "avatarInline", settings.avatarInline);
        setInput(panel, "replyPlacement", settings.replyPlacement);
        setInput(panel, "replyMetaInHeader", settings.replyMetaInHeader);
        setInput(panel, "avatarMenu", settings.avatarMenu);
        setInput(panel, "nativeMenuPopout", settings.nativeMenuPopout);
        setInput(panel, "divider", settings.divider);
        setInput(panel, "dividerDashed", settings.dividerDashed);
        setInput(panel, "dividerWidth", settings.dividerWidth);
        setInput(panel, "dividerColor", settings.dividerColor);
        setInput(panel, "background", settings.background);
        setInput(panel, "rounded", settings.rounded);
        setInput(panel, "radius", settings.radius);
        syncBackgroundColorInputs(panel);
        setInput(panel, "avatarSize", settings.avatarSize);
        setInput(panel, "cardInset", settings.cardInset);
        setInput(panel, "sidePadding", settings.sidePadding);
        setInput(panel, "postSpacing", settings.postSpacing);
        setInput(panel, "headerScale", settings.headerScale);
        setInput(panel, "fontScale", settings.fontScale);
        setOutput(panel, "avatarSize", `${settings.avatarSize}px`);
        setOutput(panel, "cardInset", `${settings.cardInset}px`);
        setOutput(panel, "sidePadding", `${settings.sidePadding}px`);
        setOutput(panel, "postSpacing", `${settings.postSpacing}px`);
        setOutput(panel, "dividerWidth", `${settings.dividerWidth}px`);
        setOutput(panel, "radius", `${settings.radius}px`);
        setOutput(panel, "headerScale", `${settings.headerScale}%`);
        setOutput(panel, "fontScale", `${settings.fontScale}%`);

        scan();
      }

      function setInput(panel, name, value) {
        panel.querySelectorAll(`[data-setting="${name}"]`).forEach((input) => {
          if (input.type === "checkbox") input.checked = !!value;
          else input.value = String(value);
        });
      }

      function setOutput(panel, name, value) {
        const output = panel.querySelector(`[data-output="${name}"]`);
        if (output) output.textContent = value;
      }

      function syncBackgroundColorInputs(panel, source) {
        const color = settings.backgroundColor;
        const hex = toHexColor(color);

        panel.querySelectorAll('[data-setting="backgroundColor"]').forEach((input) => {
          if (input === source) return;
          if (input.tagName === "SELECT") {
            input.value = COLOR_OPTIONS.some((option) => option.value.toLowerCase() === String(color).toLowerCase()) ? color : "";
          } else if (input.type === "color" && hex) {
            input.value = hex;
          }
        });

        panel.querySelectorAll('[data-setting="backgroundColorManual"]').forEach((input) => {
          if (input !== source) input.value = color;
        });
      }

      function normalizeManualColor(value) {
        const color = String(value || "").trim();
        if (!color) return "";
        if (!window.CSS || typeof window.CSS.supports !== "function" || !window.CSS.supports("color", color)) return "";
        return toHexColor(color) || color;
      }

      function toHexColor(value) {
        const color = String(value || "").trim();
        let match = color.match(/^#([0-9a-f]{3})$/i);
        if (match) {
          return `#${match[1].split("").map((part) => `${part}${part}`).join("")}`.toLowerCase();
        }

        match = color.match(/^#([0-9a-f]{6})$/i);
        if (match) return `#${match[1].toLowerCase()}`;

        return "";
      }

      function showShareBox(panel, text) {
        const wrap = panel.querySelector(".cudloun-post-tweaks-share");
        const box = panel.querySelector("[data-share-box]");
        if (!wrap || !box) return;

        wrap.removeAttribute("hidden");
        box.value = text;
        box.focus();
        box.select();
      }

      function exportSettingsText() {
        return JSON.stringify({
          cudlounContainer: ID,
          version: 1,
          settings: sharedSettings(),
        }, null, 2);
      }

      function sharedSettings() {
        return Object.fromEntries(
          Object.keys(defaults).map((name) => [name, settings[name]]),
        );
      }

      function importSettingsText(text) {
        const parsed = JSON.parse(String(text || "").trim());
        const source = parsed && parsed.settings && typeof parsed.settings === "object" ? parsed.settings : parsed;
        if (!source || typeof source !== "object" || Array.isArray(source)) {
          throw new Error("expected a settings object");
        }

        const next = { ...settings };
        Object.entries(defaults).forEach(([name, fallback]) => {
          if (!Object.prototype.hasOwnProperty.call(source, name)) return;

          const value = source[name];
          if (typeof fallback === "boolean") {
            next[name] = value === true || value === "true";
          } else if (typeof fallback === "number") {
            const number = Number(value);
            if (!Number.isFinite(number)) throw new Error(`${name} must be a number`);
            next[name] = number;
          } else {
            next[name] = String(value);
          }
        });

        settings = next;
      }

      async function copyText(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        }
      }

      function loadSettings() {
        try {
          const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY) || "{}";
          return { ...defaults, ...JSON.parse(raw) };
        } catch (error) {
          return { ...defaults };
        }
      }

      function saveSettings() {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
          console.warn("[cudloun] post tweaks settings could not be saved", error);
        }
      }
    })();

  });

  embeddedText.set("modules/theme-tweaks.js", "// Cudloun module: Babeta theme overlays.\n(function () {\n  \"use strict\";\n\n  const root = window.Cudloun;\n  const ID = \"theme-tweaks\";\n  const VERSION = \"0.1.2\";\n  const STYLE_ID = \"cudloun-theme-tweaks-style\";\n  const STORAGE_KEY = \"cudloun.module.themeTweaks.v1\";\n  const UNREAD_MARK = \"data-cudloun-theme-unread-pill\";\n  const RAIL_MARK = \"data-cudloun-theme-rail\";\n\n  const presets = {\n    pond: {\n      label: \"Pond\",\n      bg: \"#dce8fa\",\n      chrome: \"#e8f0fc\",\n      surface: \"#f9fbff\",\n      post: \"#ffffff\",\n      text: \"#182230\",\n      muted: \"#5b677a\",\n      accent: \"#7a4a08\",\n      border: \"rgba(74, 91, 123, .24)\",\n    },\n    ink: {\n      label: \"Ink\",\n      bg: \"#151821\",\n      chrome: \"#202432\",\n      surface: \"#1b1f2b\",\n      post: \"#202635\",\n      text: \"#eef2f7\",\n      muted: \"#b8c0cc\",\n      accent: \"#f0b35a\",\n      border: \"rgba(238, 242, 247, .18)\",\n    },\n    darksilver: {\n      label: \"Darksilver\",\n      bg: \"#000000\",\n      chrome: \"#000000\",\n      surface: \"#151515\",\n      post: \"#202020\",\n      text: \"#f2f2f2\",\n      muted: \"#a8a8a8\",\n      accent: \"#ffaa33\",\n      border: \"rgba(255, 170, 51, .28)\",\n    },\n    mint: {\n      label: \"Mint\",\n      bg: \"#e1f1ec\",\n      chrome: \"#edf8f4\",\n      surface: \"#f7fcfa\",\n      post: \"#ffffff\",\n      text: \"#17352f\",\n      muted: \"#4d6f67\",\n      accent: \"#1d7568\",\n      border: \"rgba(36, 101, 89, .24)\",\n    },\n    print: {\n      label: \"Print\",\n      bg: \"#f3f4f6\",\n      chrome: \"#ffffff\",\n      surface: \"#ffffff\",\n      post: \"#ffffff\",\n      text: \"#111827\",\n      muted: \"#4b5565\",\n      accent: \"#075985\",\n      border: \"rgba(17, 24, 39, .16)\",\n    },\n  };\n\n  const defaults = {\n    preset: \"pond\",\n    themeCudloun: false,\n  };\n\n  let settings = loadSettings();\n  let observer = null;\n\n  root.registerModule({\n    id: ID,\n    name: \"Theme Tweaks\",\n    description: \"Apply Cudloun theme presets over Babeta's native color scheme.\",\n    version: VERSION,\n    defaultEnabled: false,\n    start() {\n      install();\n      return stop;\n    },\n    stop,\n    renderSettings(ctx) {\n      const wrap = document.createElement(\"div\");\n      wrap.className = \"cudloun-settings-list\";\n\n      const presetRow = document.createElement(\"label\");\n      presetRow.className = \"cudloun-setting-row\";\n\n      const presetText = document.createElement(\"span\");\n      presetText.className = \"cudloun-setting-text\";\n      presetText.textContent = \"Theme preset\";\n\n      const select = document.createElement(\"select\");\n      select.className = \"cudloun-select\";\n      Object.entries(presets).forEach(([value, preset]) => {\n        const option = document.createElement(\"option\");\n        option.value = value;\n        option.textContent = preset.label;\n        select.appendChild(option);\n      });\n      select.value = presets[settings.preset] ? settings.preset : defaults.preset;\n      select.addEventListener(\"change\", () => {\n        settings.preset = presets[select.value] ? select.value : defaults.preset;\n        saveSettings();\n        applyTheme();\n      });\n\n      presetRow.appendChild(presetText);\n      presetRow.appendChild(select);\n      wrap.appendChild(presetRow);\n      wrap.appendChild(renderCheckbox(\"themeCudloun\", \"Theme Cudloun panel\", () => ctx.hub.render()));\n      return wrap;\n    },\n    renderHelp() {\n      return [\n        \"Babeta stores its native choice in localStorage as okoun-theme-mode: traditional, light, dark, or system.\",\n        \"Theme Tweaks does not change that native setting. It applies a reversible Cudloun stylesheet on top.\",\n        \"Disable this module to return fully to Babeta's own colors.\",\n      ];\n    },\n  });\n\n  function renderCheckbox(name, labelText, afterChange) {\n    const label = document.createElement(\"label\");\n    label.className = \"cudloun-setting-row\";\n\n    const text = document.createElement(\"span\");\n    text.className = \"cudloun-setting-text\";\n    text.textContent = labelText;\n\n    const checkbox = document.createElement(\"input\");\n    checkbox.type = \"checkbox\";\n    checkbox.checked = !!settings[name];\n    checkbox.addEventListener(\"change\", () => {\n      settings[name] = checkbox.checked;\n      saveSettings();\n      applyTheme();\n      afterChange?.();\n    });\n\n    label.appendChild(text);\n    label.appendChild(checkbox);\n    return label;\n  }\n\n  function install() {\n    installStyles();\n    applyTheme();\n    scanUnreadPills();\n    scanThemeRails();\n    if (!observer) {\n      observer = new MutationObserver(() => {\n        scanUnreadPills();\n        scanThemeRails();\n      });\n      observer.observe(document.body, {\n        childList: true,\n        subtree: true,\n        characterData: true,\n        attributes: true,\n        attributeFilter: [\"class\", \"style\"],\n      });\n    }\n  }\n\n  function stop() {\n    if (observer) {\n      observer.disconnect();\n      observer = null;\n    }\n    document.querySelectorAll(`[${UNREAD_MARK}]`).forEach((node) => node.removeAttribute(UNREAD_MARK));\n    document.querySelectorAll(`[${RAIL_MARK}]`).forEach((node) => node.removeAttribute(RAIL_MARK));\n    document.getElementById(STYLE_ID)?.remove();\n    document.documentElement.removeAttribute(\"data-cudloun-theme-tweaks-enabled\");\n    document.documentElement.removeAttribute(\"data-cudloun-theme-tweaks-preset\");\n    document.documentElement.removeAttribute(\"data-cudloun-theme-tweaks-cudloun\");\n    [\n      \"--cudloun-theme-bg\",\n      \"--cudloun-theme-chrome\",\n      \"--cudloun-theme-surface\",\n      \"--cudloun-theme-post\",\n      \"--cudloun-theme-text\",\n      \"--cudloun-theme-muted\",\n      \"--cudloun-theme-accent\",\n      \"--cudloun-theme-border\",\n    ].forEach((name) => document.documentElement.style.removeProperty(name));\n  }\n\n  function installStyles() {\n    if (document.getElementById(STYLE_ID)) return;\n\n    const style = document.createElement(\"style\");\n    style.id = STYLE_ID;\n    style.textContent = `\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] body,\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] #root,\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] #root > .MuiBox-root {\n        background: var(--cudloun-theme-bg) !important;\n        color: var(--cudloun-theme-text) !important;\n      }\n\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] {\n        background: var(--cudloun-theme-bg) !important;\n        scrollbar-color: var(--cudloun-theme-border) var(--cudloun-theme-bg) !important;\n      }\n\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] ::-webkit-scrollbar {\n        background: var(--cudloun-theme-bg) !important;\n      }\n\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] ::-webkit-scrollbar-track,\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] ::-webkit-scrollbar-corner {\n        background: var(--cudloun-theme-bg) !important;\n      }\n\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] ::-webkit-scrollbar-thumb {\n        background: var(--cudloun-theme-border) !important;\n        border: 2px solid var(--cudloun-theme-bg) !important;\n        border-radius: 999px !important;\n      }\n\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] main,\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] .MuiContainer-root,\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] .board-page-container {\n        background: var(--cudloun-theme-bg) !important;\n        color: var(--cudloun-theme-text) !important;\n      }\n\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] .MuiAppBar-root,\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] .MuiBottomNavigation-root {\n        background: var(--cudloun-theme-chrome) !important;\n        color: var(--cudloun-theme-text) !important;\n        border-color: var(--cudloun-theme-border) !important;\n      }\n\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] .board-page-container > .MuiBox-root,\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] .page-header {\n        background: var(--cudloun-theme-chrome) !important;\n        color: var(--cudloun-theme-text) !important;\n        border-color: var(--cudloun-theme-border) !important;\n      }\n\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] .board-page-container > .MuiBox-root .MuiBox-root,\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] .page-header .MuiBox-root,\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] .nav-links .MuiBox-root,\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] .MuiListItemSecondaryAction-root .MuiBox-root {\n        background: transparent !important;\n      }\n\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] .MuiDrawer-paper,\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] .MuiMenu-paper,\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] .MuiPopover-paper,\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] .MuiDialog-paper,\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] .MuiPaper-root.MuiPaper-outlined {\n        background: var(--cudloun-theme-surface) !important;\n        color: var(--cudloun-theme-text) !important;\n        border-color: var(--cudloun-theme-border) !important;\n      }\n\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] .content-item.board-post,\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] .board-info,\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] .MuiPaper-root.content-item {\n        background: var(--cudloun-theme-post) !important;\n        color: var(--cudloun-theme-text) !important;\n        border-color: var(--cudloun-theme-border) !important;\n      }\n\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] .MuiTypography-root,\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] .MuiListItemText-primary,\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] .MuiListItemText-secondary {\n        color: inherit !important;\n      }\n\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] .MuiTypography-colorTextSecondary,\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] .MuiFormHelperText-root,\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] .MuiInputLabel-root {\n        color: var(--cudloun-theme-muted) !important;\n      }\n\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] a,\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] .MuiLink-root,\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] .MuiButton-text,\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] .MuiIconButton-root {\n        color: var(--cudloun-theme-accent) !important;\n      }\n\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] input,\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] textarea,\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] .MuiInputBase-root {\n        background: var(--cudloun-theme-surface) !important;\n        color: var(--cudloun-theme-text) !important;\n      }\n\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] .MuiOutlinedInput-notchedOutline,\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] hr {\n        border-color: var(--cudloun-theme-border) !important;\n      }\n\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] .MuiAvatar-root {\n        background: transparent !important;\n        border-color: transparent !important;\n        box-shadow: none !important;\n      }\n\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] .MuiAvatar-root img,\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] img.MuiBox-root {\n        border-color: transparent !important;\n        box-shadow: none !important;\n      }\n\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] [${RAIL_MARK}] {\n        background-image: none !important;\n        background-color: transparent !important;\n      }\n\n      html[data-cudloun-theme-tweaks-enabled=\"true\"] [${UNREAD_MARK}] {\n        background: color-mix(in srgb, var(--cudloun-theme-accent) 18%, var(--cudloun-theme-surface)) !important;\n        color: var(--cudloun-theme-accent) !important;\n        border-color: color-mix(in srgb, var(--cudloun-theme-accent) 55%, transparent) !important;\n        box-shadow: none !important;\n        font-weight: 750 !important;\n      }\n\n      html[data-cudloun-theme-tweaks-enabled=\"true\"][data-cudloun-theme-tweaks-preset=\"darksilver\"] [${UNREAD_MARK}] {\n        background: #0f0f0f !important;\n        color: #ffaa33 !important;\n        border-color: rgba(255, 170, 51, .5) !important;\n      }\n\n      html[data-cudloun-theme-tweaks-enabled=\"true\"][data-cudloun-theme-tweaks-preset=\"darksilver\"] .avatar-container {\n        width: 36px !important;\n        height: 36px !important;\n        overflow: hidden !important;\n        border-radius: 0 !important;\n        background: transparent !important;\n      }\n\n      html[data-cudloun-theme-tweaks-enabled=\"true\"][data-cudloun-theme-tweaks-preset=\"darksilver\"] .avatar-container .MuiAvatar-root.content-avatar {\n        width: 36px !important;\n        height: 36px !important;\n        min-width: 36px !important;\n        border: 0 !important;\n        border-radius: 0 !important;\n        overflow: hidden !important;\n        background: transparent !important;\n        box-shadow: none !important;\n      }\n\n      html[data-cudloun-theme-tweaks-enabled=\"true\"][data-cudloun-theme-tweaks-preset=\"darksilver\"] .avatar-container .MuiAvatar-root.content-avatar img {\n        width: 36px !important;\n        height: 36px !important;\n        object-fit: cover !important;\n        border: 0 !important;\n        border-radius: 0 !important;\n        background: transparent !important;\n        box-shadow: none !important;\n      }\n\n      html[data-cudloun-theme-tweaks-enabled=\"true\"][data-cudloun-theme-tweaks-cudloun=\"true\"] .cudloun-dialog,\n      html[data-cudloun-theme-tweaks-enabled=\"true\"][data-cudloun-theme-tweaks-cudloun=\"true\"] .cudloun-feedback,\n      html[data-cudloun-theme-tweaks-enabled=\"true\"][data-cudloun-theme-tweaks-cudloun=\"true\"] .cudloun-container-card,\n      html[data-cudloun-theme-tweaks-enabled=\"true\"][data-cudloun-theme-tweaks-cudloun=\"true\"] .cudloun-setting-row {\n        background: var(--cudloun-theme-surface) !important;\n        color: var(--cudloun-theme-text) !important;\n        border-color: var(--cudloun-theme-border) !important;\n      }\n    `;\n    document.head.appendChild(style);\n  }\n\n  function applyTheme() {\n    const preset = presets[settings.preset] || presets[defaults.preset];\n    document.documentElement.setAttribute(\"data-cudloun-theme-tweaks-enabled\", \"true\");\n    document.documentElement.setAttribute(\"data-cudloun-theme-tweaks-preset\", settings.preset);\n    document.documentElement.setAttribute(\"data-cudloun-theme-tweaks-cudloun\", settings.themeCudloun ? \"true\" : \"false\");\n\n    Object.entries({\n      \"--cudloun-theme-bg\": preset.bg,\n      \"--cudloun-theme-chrome\": preset.chrome,\n      \"--cudloun-theme-surface\": preset.surface,\n      \"--cudloun-theme-post\": preset.post,\n      \"--cudloun-theme-text\": preset.text,\n      \"--cudloun-theme-muted\": preset.muted,\n      \"--cudloun-theme-accent\": preset.accent,\n      \"--cudloun-theme-border\": preset.border,\n    }).forEach(([name, value]) => {\n      document.documentElement.style.setProperty(name, value);\n    });\n    scanThemeRails();\n  }\n\n  function scanUnreadPills() {\n    document.querySelectorAll(\"span\").forEach((label) => {\n      if (!/^(\\d+)\\s+nov(?:ý|é|ých)$/i.test(label.textContent.trim())) return;\n      const chip = label.closest(\".MuiChip-root\") || label.parentElement;\n      if (chip) chip.setAttribute(UNREAD_MARK, \"true\");\n    });\n  }\n\n  function scanThemeRails() {\n    document.querySelectorAll(`[${RAIL_MARK}]`).forEach((node) => {\n      if (!isThemeRail(node)) node.removeAttribute(RAIL_MARK);\n    });\n\n    document.querySelectorAll(\".MuiBox-root\").forEach((node) => {\n      if (isThemeRail(node) && node.getAttribute(RAIL_MARK) !== \"true\") node.setAttribute(RAIL_MARK, \"true\");\n    });\n  }\n\n  function isThemeRail(node) {\n    if (!(node instanceof HTMLElement)) return false;\n\n    const style = getComputedStyle(node);\n    if (style.position !== \"fixed\") return false;\n    if (Number.parseInt(style.zIndex, 10) < 9000) return false;\n    if (!style.backgroundImage.includes(\"linear-gradient\")) return false;\n    if (!style.backgroundImage.includes(\"to right\")) return false;\n    if (!style.backgroundImage.includes(\"calc(100% - 12px)\")) return false;\n\n    const rect = node.getBoundingClientRect();\n    return rect.width >= document.documentElement.clientWidth - 4 && rect.height >= window.innerHeight * 0.75;\n  }\n\n  function loadSettings() {\n    try {\n      return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || \"{}\") };\n    } catch (error) {\n      return { ...defaults };\n    }\n  }\n\n  function saveSettings() {\n    try {\n      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));\n    } catch (error) {\n      root.log.warn(\"theme-tweaks\", \"settings could not be saved\", error);\n    }\n  }\n})();\n");
  embeddedScripts.set("modules/theme-tweaks.js", function () {
    // Cudloun module: Babeta theme overlays.
    (function () {
      "use strict";

      const root = window.Cudloun;
      const ID = "theme-tweaks";
      const VERSION = "0.1.2";
      const STYLE_ID = "cudloun-theme-tweaks-style";
      const STORAGE_KEY = "cudloun.module.themeTweaks.v1";
      const UNREAD_MARK = "data-cudloun-theme-unread-pill";
      const RAIL_MARK = "data-cudloun-theme-rail";

      const presets = {
        pond: {
          label: "Pond",
          bg: "#dce8fa",
          chrome: "#e8f0fc",
          surface: "#f9fbff",
          post: "#ffffff",
          text: "#182230",
          muted: "#5b677a",
          accent: "#7a4a08",
          border: "rgba(74, 91, 123, .24)",
        },
        ink: {
          label: "Ink",
          bg: "#151821",
          chrome: "#202432",
          surface: "#1b1f2b",
          post: "#202635",
          text: "#eef2f7",
          muted: "#b8c0cc",
          accent: "#f0b35a",
          border: "rgba(238, 242, 247, .18)",
        },
        darksilver: {
          label: "Darksilver",
          bg: "#000000",
          chrome: "#000000",
          surface: "#151515",
          post: "#202020",
          text: "#f2f2f2",
          muted: "#a8a8a8",
          accent: "#ffaa33",
          border: "rgba(255, 170, 51, .28)",
        },
        mint: {
          label: "Mint",
          bg: "#e1f1ec",
          chrome: "#edf8f4",
          surface: "#f7fcfa",
          post: "#ffffff",
          text: "#17352f",
          muted: "#4d6f67",
          accent: "#1d7568",
          border: "rgba(36, 101, 89, .24)",
        },
        print: {
          label: "Print",
          bg: "#f3f4f6",
          chrome: "#ffffff",
          surface: "#ffffff",
          post: "#ffffff",
          text: "#111827",
          muted: "#4b5565",
          accent: "#075985",
          border: "rgba(17, 24, 39, .16)",
        },
      };

      const defaults = {
        preset: "pond",
        themeCudloun: false,
      };

      let settings = loadSettings();
      let observer = null;

      root.registerModule({
        id: ID,
        name: "Theme Tweaks",
        description: "Apply Cudloun theme presets over Babeta's native color scheme.",
        version: VERSION,
        defaultEnabled: false,
        start() {
          install();
          return stop;
        },
        stop,
        renderSettings(ctx) {
          const wrap = document.createElement("div");
          wrap.className = "cudloun-settings-list";

          const presetRow = document.createElement("label");
          presetRow.className = "cudloun-setting-row";

          const presetText = document.createElement("span");
          presetText.className = "cudloun-setting-text";
          presetText.textContent = "Theme preset";

          const select = document.createElement("select");
          select.className = "cudloun-select";
          Object.entries(presets).forEach(([value, preset]) => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = preset.label;
            select.appendChild(option);
          });
          select.value = presets[settings.preset] ? settings.preset : defaults.preset;
          select.addEventListener("change", () => {
            settings.preset = presets[select.value] ? select.value : defaults.preset;
            saveSettings();
            applyTheme();
          });

          presetRow.appendChild(presetText);
          presetRow.appendChild(select);
          wrap.appendChild(presetRow);
          wrap.appendChild(renderCheckbox("themeCudloun", "Theme Cudloun panel", () => ctx.hub.render()));
          return wrap;
        },
        renderHelp() {
          return [
            "Babeta stores its native choice in localStorage as okoun-theme-mode: traditional, light, dark, or system.",
            "Theme Tweaks does not change that native setting. It applies a reversible Cudloun stylesheet on top.",
            "Disable this module to return fully to Babeta's own colors.",
          ];
        },
      });

      function renderCheckbox(name, labelText, afterChange) {
        const label = document.createElement("label");
        label.className = "cudloun-setting-row";

        const text = document.createElement("span");
        text.className = "cudloun-setting-text";
        text.textContent = labelText;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = !!settings[name];
        checkbox.addEventListener("change", () => {
          settings[name] = checkbox.checked;
          saveSettings();
          applyTheme();
          afterChange?.();
        });

        label.appendChild(text);
        label.appendChild(checkbox);
        return label;
      }

      function install() {
        installStyles();
        applyTheme();
        scanUnreadPills();
        scanThemeRails();
        if (!observer) {
          observer = new MutationObserver(() => {
            scanUnreadPills();
            scanThemeRails();
          });
          observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ["class", "style"],
          });
        }
      }

      function stop() {
        if (observer) {
          observer.disconnect();
          observer = null;
        }
        document.querySelectorAll(`[${UNREAD_MARK}]`).forEach((node) => node.removeAttribute(UNREAD_MARK));
        document.querySelectorAll(`[${RAIL_MARK}]`).forEach((node) => node.removeAttribute(RAIL_MARK));
        document.getElementById(STYLE_ID)?.remove();
        document.documentElement.removeAttribute("data-cudloun-theme-tweaks-enabled");
        document.documentElement.removeAttribute("data-cudloun-theme-tweaks-preset");
        document.documentElement.removeAttribute("data-cudloun-theme-tweaks-cudloun");
        [
          "--cudloun-theme-bg",
          "--cudloun-theme-chrome",
          "--cudloun-theme-surface",
          "--cudloun-theme-post",
          "--cudloun-theme-text",
          "--cudloun-theme-muted",
          "--cudloun-theme-accent",
          "--cudloun-theme-border",
        ].forEach((name) => document.documentElement.style.removeProperty(name));
      }

      function installStyles() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
          html[data-cudloun-theme-tweaks-enabled="true"] body,
          html[data-cudloun-theme-tweaks-enabled="true"] #root,
          html[data-cudloun-theme-tweaks-enabled="true"] #root > .MuiBox-root {
            background: var(--cudloun-theme-bg) !important;
            color: var(--cudloun-theme-text) !important;
          }

          html[data-cudloun-theme-tweaks-enabled="true"] {
            background: var(--cudloun-theme-bg) !important;
            scrollbar-color: var(--cudloun-theme-border) var(--cudloun-theme-bg) !important;
          }

          html[data-cudloun-theme-tweaks-enabled="true"] ::-webkit-scrollbar {
            background: var(--cudloun-theme-bg) !important;
          }

          html[data-cudloun-theme-tweaks-enabled="true"] ::-webkit-scrollbar-track,
          html[data-cudloun-theme-tweaks-enabled="true"] ::-webkit-scrollbar-corner {
            background: var(--cudloun-theme-bg) !important;
          }

          html[data-cudloun-theme-tweaks-enabled="true"] ::-webkit-scrollbar-thumb {
            background: var(--cudloun-theme-border) !important;
            border: 2px solid var(--cudloun-theme-bg) !important;
            border-radius: 999px !important;
          }

          html[data-cudloun-theme-tweaks-enabled="true"] main,
          html[data-cudloun-theme-tweaks-enabled="true"] .MuiContainer-root,
          html[data-cudloun-theme-tweaks-enabled="true"] .board-page-container {
            background: var(--cudloun-theme-bg) !important;
            color: var(--cudloun-theme-text) !important;
          }

          html[data-cudloun-theme-tweaks-enabled="true"] .MuiAppBar-root,
          html[data-cudloun-theme-tweaks-enabled="true"] .MuiBottomNavigation-root {
            background: var(--cudloun-theme-chrome) !important;
            color: var(--cudloun-theme-text) !important;
            border-color: var(--cudloun-theme-border) !important;
          }

          html[data-cudloun-theme-tweaks-enabled="true"] .board-page-container > .MuiBox-root,
          html[data-cudloun-theme-tweaks-enabled="true"] .page-header {
            background: var(--cudloun-theme-chrome) !important;
            color: var(--cudloun-theme-text) !important;
            border-color: var(--cudloun-theme-border) !important;
          }

          html[data-cudloun-theme-tweaks-enabled="true"] .board-page-container > .MuiBox-root .MuiBox-root,
          html[data-cudloun-theme-tweaks-enabled="true"] .page-header .MuiBox-root,
          html[data-cudloun-theme-tweaks-enabled="true"] .nav-links .MuiBox-root,
          html[data-cudloun-theme-tweaks-enabled="true"] .MuiListItemSecondaryAction-root .MuiBox-root {
            background: transparent !important;
          }

          html[data-cudloun-theme-tweaks-enabled="true"] .MuiDrawer-paper,
          html[data-cudloun-theme-tweaks-enabled="true"] .MuiMenu-paper,
          html[data-cudloun-theme-tweaks-enabled="true"] .MuiPopover-paper,
          html[data-cudloun-theme-tweaks-enabled="true"] .MuiDialog-paper,
          html[data-cudloun-theme-tweaks-enabled="true"] .MuiPaper-root.MuiPaper-outlined {
            background: var(--cudloun-theme-surface) !important;
            color: var(--cudloun-theme-text) !important;
            border-color: var(--cudloun-theme-border) !important;
          }

          html[data-cudloun-theme-tweaks-enabled="true"] .content-item.board-post,
          html[data-cudloun-theme-tweaks-enabled="true"] .board-info,
          html[data-cudloun-theme-tweaks-enabled="true"] .MuiPaper-root.content-item {
            background: var(--cudloun-theme-post) !important;
            color: var(--cudloun-theme-text) !important;
            border-color: var(--cudloun-theme-border) !important;
          }

          html[data-cudloun-theme-tweaks-enabled="true"] .MuiTypography-root,
          html[data-cudloun-theme-tweaks-enabled="true"] .MuiListItemText-primary,
          html[data-cudloun-theme-tweaks-enabled="true"] .MuiListItemText-secondary {
            color: inherit !important;
          }

          html[data-cudloun-theme-tweaks-enabled="true"] .MuiTypography-colorTextSecondary,
          html[data-cudloun-theme-tweaks-enabled="true"] .MuiFormHelperText-root,
          html[data-cudloun-theme-tweaks-enabled="true"] .MuiInputLabel-root {
            color: var(--cudloun-theme-muted) !important;
          }

          html[data-cudloun-theme-tweaks-enabled="true"] a,
          html[data-cudloun-theme-tweaks-enabled="true"] .MuiLink-root,
          html[data-cudloun-theme-tweaks-enabled="true"] .MuiButton-text,
          html[data-cudloun-theme-tweaks-enabled="true"] .MuiIconButton-root {
            color: var(--cudloun-theme-accent) !important;
          }

          html[data-cudloun-theme-tweaks-enabled="true"] input,
          html[data-cudloun-theme-tweaks-enabled="true"] textarea,
          html[data-cudloun-theme-tweaks-enabled="true"] .MuiInputBase-root {
            background: var(--cudloun-theme-surface) !important;
            color: var(--cudloun-theme-text) !important;
          }

          html[data-cudloun-theme-tweaks-enabled="true"] .MuiOutlinedInput-notchedOutline,
          html[data-cudloun-theme-tweaks-enabled="true"] hr {
            border-color: var(--cudloun-theme-border) !important;
          }

          html[data-cudloun-theme-tweaks-enabled="true"] .MuiAvatar-root {
            background: transparent !important;
            border-color: transparent !important;
            box-shadow: none !important;
          }

          html[data-cudloun-theme-tweaks-enabled="true"] .MuiAvatar-root img,
          html[data-cudloun-theme-tweaks-enabled="true"] img.MuiBox-root {
            border-color: transparent !important;
            box-shadow: none !important;
          }

          html[data-cudloun-theme-tweaks-enabled="true"] [${RAIL_MARK}] {
            background-image: none !important;
            background-color: transparent !important;
          }

          html[data-cudloun-theme-tweaks-enabled="true"] [${UNREAD_MARK}] {
            background: color-mix(in srgb, var(--cudloun-theme-accent) 18%, var(--cudloun-theme-surface)) !important;
            color: var(--cudloun-theme-accent) !important;
            border-color: color-mix(in srgb, var(--cudloun-theme-accent) 55%, transparent) !important;
            box-shadow: none !important;
            font-weight: 750 !important;
          }

          html[data-cudloun-theme-tweaks-enabled="true"][data-cudloun-theme-tweaks-preset="darksilver"] [${UNREAD_MARK}] {
            background: #0f0f0f !important;
            color: #ffaa33 !important;
            border-color: rgba(255, 170, 51, .5) !important;
          }

          html[data-cudloun-theme-tweaks-enabled="true"][data-cudloun-theme-tweaks-preset="darksilver"] .avatar-container {
            width: 36px !important;
            height: 36px !important;
            overflow: hidden !important;
            border-radius: 0 !important;
            background: transparent !important;
          }

          html[data-cudloun-theme-tweaks-enabled="true"][data-cudloun-theme-tweaks-preset="darksilver"] .avatar-container .MuiAvatar-root.content-avatar {
            width: 36px !important;
            height: 36px !important;
            min-width: 36px !important;
            border: 0 !important;
            border-radius: 0 !important;
            overflow: hidden !important;
            background: transparent !important;
            box-shadow: none !important;
          }

          html[data-cudloun-theme-tweaks-enabled="true"][data-cudloun-theme-tweaks-preset="darksilver"] .avatar-container .MuiAvatar-root.content-avatar img {
            width: 36px !important;
            height: 36px !important;
            object-fit: cover !important;
            border: 0 !important;
            border-radius: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
          }

          html[data-cudloun-theme-tweaks-enabled="true"][data-cudloun-theme-tweaks-cudloun="true"] .cudloun-dialog,
          html[data-cudloun-theme-tweaks-enabled="true"][data-cudloun-theme-tweaks-cudloun="true"] .cudloun-feedback,
          html[data-cudloun-theme-tweaks-enabled="true"][data-cudloun-theme-tweaks-cudloun="true"] .cudloun-container-card,
          html[data-cudloun-theme-tweaks-enabled="true"][data-cudloun-theme-tweaks-cudloun="true"] .cudloun-setting-row {
            background: var(--cudloun-theme-surface) !important;
            color: var(--cudloun-theme-text) !important;
            border-color: var(--cudloun-theme-border) !important;
          }
        `;
        document.head.appendChild(style);
      }

      function applyTheme() {
        const preset = presets[settings.preset] || presets[defaults.preset];
        document.documentElement.setAttribute("data-cudloun-theme-tweaks-enabled", "true");
        document.documentElement.setAttribute("data-cudloun-theme-tweaks-preset", settings.preset);
        document.documentElement.setAttribute("data-cudloun-theme-tweaks-cudloun", settings.themeCudloun ? "true" : "false");

        Object.entries({
          "--cudloun-theme-bg": preset.bg,
          "--cudloun-theme-chrome": preset.chrome,
          "--cudloun-theme-surface": preset.surface,
          "--cudloun-theme-post": preset.post,
          "--cudloun-theme-text": preset.text,
          "--cudloun-theme-muted": preset.muted,
          "--cudloun-theme-accent": preset.accent,
          "--cudloun-theme-border": preset.border,
        }).forEach(([name, value]) => {
          document.documentElement.style.setProperty(name, value);
        });
        scanThemeRails();
      }

      function scanUnreadPills() {
        document.querySelectorAll("span").forEach((label) => {
          if (!/^(\d+)\s+nov(?:ý|é|ých)$/i.test(label.textContent.trim())) return;
          const chip = label.closest(".MuiChip-root") || label.parentElement;
          if (chip) chip.setAttribute(UNREAD_MARK, "true");
        });
      }

      function scanThemeRails() {
        document.querySelectorAll(`[${RAIL_MARK}]`).forEach((node) => {
          if (!isThemeRail(node)) node.removeAttribute(RAIL_MARK);
        });

        document.querySelectorAll(".MuiBox-root").forEach((node) => {
          if (isThemeRail(node) && node.getAttribute(RAIL_MARK) !== "true") node.setAttribute(RAIL_MARK, "true");
        });
      }

      function isThemeRail(node) {
        if (!(node instanceof HTMLElement)) return false;

        const style = getComputedStyle(node);
        if (style.position !== "fixed") return false;
        if (Number.parseInt(style.zIndex, 10) < 9000) return false;
        if (!style.backgroundImage.includes("linear-gradient")) return false;
        if (!style.backgroundImage.includes("to right")) return false;
        if (!style.backgroundImage.includes("calc(100% - 12px)")) return false;

        const rect = node.getBoundingClientRect();
        return rect.width >= document.documentElement.clientWidth - 4 && rect.height >= window.innerHeight * 0.75;
      }

      function loadSettings() {
        try {
          return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
        } catch (error) {
          return { ...defaults };
        }
      }

      function saveSettings() {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
          root.log.warn("theme-tweaks", "settings could not be saved", error);
        }
      }
    })();

  });

  embeddedText.set("modules/performance-probe.js", "// Cudloun module: collect Babeta page performance diagnostics.\n(function () {\n  \"use strict\";\n\n  const root = window.Cudloun;\n  const ID = \"performance-probe\";\n  const VERSION = \"0.1.1\";\n  const STYLE_ID = \"cudloun-performance-probe-style\";\n  const PANEL_ID = \"cudloun-performance-probe-panel\";\n  const SAMPLE_LIMIT = 90;\n  const SAMPLE_MS = 1000;\n\n  let sampleTimer = null;\n  let observer = null;\n  let longTaskObserver = null;\n  let firstPostAt = null;\n  let firstImageCompleteAt = null;\n  let maxPostsSeen = 0;\n  let maxImagesSeen = 0;\n  let samples = [];\n  let longTasks = [];\n\n  root.registerModule({\n    id: ID,\n    name: \"Performance Probe\",\n    description: \"Measure Babeta page loading, visible posts, image state, and blank-scroll symptoms for copyable reports.\",\n    version: VERSION,\n    defaultEnabled: false,\n    actionLabel: \"Measure\",\n    start(ctx) {\n      installStyles();\n      startSampling(ctx);\n      return stop;\n    },\n    stop,\n    action(ctx) {\n      openPanel(ctx);\n    },\n    renderSettings(ctx) {\n      const wrap = document.createElement(\"div\");\n      wrap.className = \"cudloun-settings-list\";\n\n      const row = document.createElement(\"div\");\n      row.className = \"cudloun-setting-row\";\n\n      const text = document.createElement(\"div\");\n      text.className = \"cudloun-setting-text\";\n      text.textContent = \"Performance Probe samples the current page once per second while enabled.\";\n\n      row.appendChild(text);\n      wrap.appendChild(row);\n\n      const actions = document.createElement(\"div\");\n      actions.className = \"cudloun-actions\";\n\n      const measure = document.createElement(\"button\");\n      measure.type = \"button\";\n      measure.className = \"cudloun-button\";\n      measure.textContent = \"Measure now\";\n      measure.addEventListener(\"click\", () => openPanel(ctx));\n\n      const copy = document.createElement(\"button\");\n      copy.type = \"button\";\n      copy.className = \"cudloun-button\";\n      copy.textContent = \"Copy report\";\n      copy.addEventListener(\"click\", () => copyReport(ctx));\n\n      actions.appendChild(measure);\n      actions.appendChild(copy);\n      wrap.appendChild(actions);\n      return wrap;\n    },\n    renderHelp() {\n      return [\n        \"Enable this module on a Babeta page, reproduce slow loading or blank scrolling, then copy the report.\",\n        \"The report includes a short analysis plus route, viewport, browser hints, navigation timings, long tasks where available, post counts, image state, placeholders, and recent visible-post samples.\",\n        \"It only observes the page. It does not change layout, mark posts as read, scroll the page, or send data anywhere automatically.\",\n      ];\n    },\n  });\n\n  function startSampling(ctx) {\n    resetSession();\n    sample(ctx, \"start\");\n    sampleTimer = window.setInterval(() => sample(ctx, \"tick\"), SAMPLE_MS);\n\n    observer = new MutationObserver(() => {\n      const counts = countPage();\n      if (!firstPostAt && counts.boardPosts > 0) firstPostAt = Math.round(performance.now());\n      if (!firstImageCompleteAt && counts.loadedImages > 0) firstImageCompleteAt = Math.round(performance.now());\n      maxPostsSeen = Math.max(maxPostsSeen, counts.boardPosts);\n      maxImagesSeen = Math.max(maxImagesSeen, counts.images);\n    });\n    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: [\"src\", \"style\", \"class\"] });\n    startLongTaskObserver(ctx);\n    ctx?.log?.info?.(\"sampling started\");\n  }\n\n  function stop() {\n    if (sampleTimer) {\n      window.clearInterval(sampleTimer);\n      sampleTimer = null;\n    }\n    if (observer) {\n      observer.disconnect();\n      observer = null;\n    }\n    if (longTaskObserver) {\n      longTaskObserver.disconnect();\n      longTaskObserver = null;\n    }\n    document.getElementById(PANEL_ID)?.remove();\n    document.getElementById(STYLE_ID)?.remove();\n  }\n\n  function resetSession() {\n    firstPostAt = null;\n    firstImageCompleteAt = null;\n    maxPostsSeen = 0;\n    maxImagesSeen = 0;\n    samples = [];\n    longTasks = [];\n  }\n\n  function openPanel(ctx) {\n    installStyles();\n    const report = makeReport(\"manual\");\n\n    let panel = document.getElementById(PANEL_ID);\n    if (!panel) {\n      panel = document.createElement(\"div\");\n      panel.id = PANEL_ID;\n      panel.innerHTML = `\n        <div class=\"cudloun-performance-probe-head\">\n          <strong>Performance Probe<\/strong>\n          <button type=\"button\" data-action=\"close\">x<\/button>\n        <\/div>\n        <div class=\"cudloun-performance-probe-summary\" data-summary><\/div>\n        <textarea spellcheck=\"false\" data-report><\/textarea>\n        <div class=\"cudloun-performance-probe-actions\">\n          <button type=\"button\" data-action=\"refresh\">Refresh<\/button>\n          <button type=\"button\" data-action=\"copy\">Copy report<\/button>\n        <\/div>\n      `;\n      panel.querySelector(\"[data-action='close']\").addEventListener(\"click\", () => panel.remove());\n      panel.querySelector(\"[data-action='refresh']\").addEventListener(\"click\", () => openPanel(ctx));\n      panel.querySelector(\"[data-action='copy']\").addEventListener(\"click\", () => copyReport(ctx));\n      document.body.appendChild(panel);\n    }\n\n    renderPanel(panel, report);\n  }\n\n  function renderPanel(panel, report) {\n    const counts = report.counts;\n    const summary = panel.querySelector(\"[data-summary]\");\n    const box = panel.querySelector(\"[data-report]\");\n    if (summary) {\n      summary.textContent = [\n        `${counts.boardPosts} posts`,\n        `${counts.visibleBoardPosts} visible`,\n        `${counts.loadedImages}/${counts.images} images loaded`,\n        `${report.samples.blankSamplesLast30s} blank samples`,\n      ].join(\" / \");\n    }\n    if (box) {\n      box.value = reportText(report);\n      box.focus();\n      box.select();\n    }\n  }\n\n  function copyReport(ctx) {\n    const report = makeReport(\"copy\");\n    const text = reportText(report);\n    if (navigator.clipboard?.writeText) {\n      navigator.clipboard.writeText(text).then(\n        () => ctx?.log?.info?.(\"report copied\"),\n        (error) => ctx?.log?.warn?.(\"copy failed\", error),\n      );\n    }\n\n    const panel = document.getElementById(PANEL_ID);\n    if (panel) renderPanel(panel, report);\n  }\n\n  function sample(ctx, reason) {\n    const counts = countPage();\n    const visible = visiblePostStats();\n    const now = Math.round(performance.now());\n\n    if (!firstPostAt && counts.boardPosts > 0) firstPostAt = now;\n    if (!firstImageCompleteAt && counts.loadedImages > 0) firstImageCompleteAt = now;\n    maxPostsSeen = Math.max(maxPostsSeen, counts.boardPosts);\n    maxImagesSeen = Math.max(maxImagesSeen, counts.images);\n\n    samples.push({\n      t: now,\n      reason,\n      y: Math.round(window.scrollY || 0),\n      boardPosts: counts.boardPosts,\n      visibleBoardPosts: counts.visibleBoardPosts,\n      images: counts.images,\n      loadedImages: counts.loadedImages,\n      placeholders: counts.placeholders,\n      viewportPostHits: visible.viewportPostHits,\n      mainBandPostHits: visible.mainBandPostHits,\n      blankMainBand: visible.blankMainBand,\n    });\n\n    if (samples.length > SAMPLE_LIMIT) samples.shift();\n    ctx?.log?.trace?.(\"sample\", samples[samples.length - 1]);\n  }\n\n  function makeReport(reason) {\n    const counts = countPage();\n    const navigation = navigationTiming();\n    const recent = samples.slice(-30);\n    const blankSamples = recent.filter((item) => item.blankMainBand).length;\n    const route = root.babeguts?.route?.() || {\n      href: window.location.href,\n      path: window.location.pathname,\n      search: window.location.search,\n      hash: window.location.hash,\n      type: \"unknown\",\n      boardId: \"\",\n    };\n\n    return {\n      schemaVersion: 1,\n      module: ID,\n      moduleVersion: VERSION,\n      reason,\n      capturedAt: new Date().toISOString(),\n      route,\n      cudloun: {\n        coreVersion: root.coreVersion || root.version || \"\",\n        manifestVersion: root.manifestVersion || \"\",\n        seedVersion: root.seedVersion || \"\",\n      },\n      user: root.babeguts?.currentUser?.() || \"\",\n      viewport: viewportInfo(),\n      browser: browserInfo(),\n      navigation,\n      analysis: analyzeReport({ navigation, counts, recent, blankSamples }),\n      milestones: {\n        probeStartedMs: samples[0]?.t || null,\n        firstPostSeenMs: firstPostAt,\n        firstImageCompleteSeenMs: firstImageCompleteAt,\n        maxPostsSeen,\n        maxImagesSeen,\n      },\n      longTasks: summarizeLongTasks(),\n      counts,\n      visiblePostStats: visiblePostStats(),\n      samples: {\n        intervalMs: SAMPLE_MS,\n        retained: samples.length,\n        recent: recent,\n        blankSamplesLast30s: blankSamples,\n      },\n    };\n  }\n\n  function analyzeReport(data) {\n    const probeStart = samples[0]?.t || null;\n    const firstPostDelay = probeStart !== null && firstPostAt !== null ? firstPostAt - probeStart : null;\n    const appRenderAfterLoad = firstPostAt !== null && data.navigation.loadEventEndMs !== null\n      ? firstPostAt - data.navigation.loadEventEndMs\n      : null;\n    const yValues = data.recent.map((item) => item.y);\n    const imageValues = data.recent.map((item) => item.images);\n    const scrollMoves = yValues.filter((value, index) => index > 0 && value !== yValues[index - 1]).length;\n    const imageCountChanged = imageValues.some((value, index) => index > 0 && value !== imageValues[index - 1]);\n    const longTaskSummary = summarizeLongTasks();\n    const notes = [];\n\n    if (data.blankSamples > 0) notes.push(`${data.blankSamples} recent sample(s) had no post in the main reading band.`);\n    else notes.push(\"No blank-scroll sample was captured in the recent window.\");\n\n    if (firstPostDelay !== null) notes.push(`First post was observed ${firstPostDelay} ms after the probe started.`);\n    if (appRenderAfterLoad !== null && appRenderAfterLoad > 750) notes.push(`First post appeared ${appRenderAfterLoad} ms after loadEventEnd.`);\n    if (data.counts.pendingImages > 0) notes.push(`${data.counts.pendingImages} image(s) were still pending at capture time.`);\n    if (data.counts.brokenImages > 0) notes.push(`${data.counts.brokenImages} broken image(s) were visible to the browser.`);\n    if (imageCountChanged) notes.push(\"Image count changed during the recent sample window.\");\n    if (scrollMoves > 0) notes.push(`Scroll position changed ${scrollMoves} time(s) in the recent sample window.`);\n    if (longTaskSummary.supported && longTaskSummary.count > 0) notes.push(`${longTaskSummary.count} long task(s) over 50 ms were observed.`);\n    if (!longTaskSummary.supported) notes.push(\"Long-task timing is not exposed by this browser.\");\n\n    return {\n      blankSamplesLast30s: data.blankSamples,\n      firstPostDelayAfterProbeStartMs: firstPostDelay,\n      firstPostAfterLoadEventMs: appRenderAfterLoad,\n      scrollMovesLast30s: scrollMoves,\n      imageCountChangedLast30s: imageCountChanged,\n      verdict: data.blankSamples > 0 || data.counts.pendingImages > 0 || longTaskSummary.totalDurationMs > 250\n        ? \"issue-observed\"\n        : \"no-issue-observed\",\n      notes,\n    };\n  }\n\n  function countPage() {\n    const posts = allPosts();\n    const visiblePosts = posts.filter(isVisible);\n    const images = Array.from(document.images || []);\n    const loadedImages = images.filter((img) => img.complete && img.naturalWidth > 0);\n    const pendingImages = images.filter((img) => !img.complete || img.naturalWidth === 0);\n    const placeholders = countPlaceholders();\n    const contentItems = document.querySelectorAll(\".content-item\").length;\n\n    return {\n      contentItems,\n      boardPosts: posts.length,\n      visibleBoardPosts: visiblePosts.length,\n      images: images.length,\n      loadedImages: loadedImages.length,\n      pendingImages: pendingImages.length,\n      brokenImages: images.filter((img) => img.complete && img.naturalWidth === 0).length,\n      placeholders,\n    };\n  }\n\n  function visiblePostStats() {\n    const posts = allPosts();\n    const viewport = { top: 0, bottom: window.innerHeight || 0 };\n    const mainBand = {\n      top: Math.round((window.innerHeight || 0) * 0.22),\n      bottom: Math.round((window.innerHeight || 0) * 0.86),\n    };\n    let viewportPostHits = 0;\n    let mainBandPostHits = 0;\n    let firstVisiblePostTop = null;\n    let lastVisiblePostBottom = null;\n\n    posts.forEach((post) => {\n      const rect = post.getBoundingClientRect();\n      if (rect.width <= 0 || rect.height <= 0) return;\n      if (rect.bottom > viewport.top && rect.top < viewport.bottom) {\n        viewportPostHits += 1;\n        if (firstVisiblePostTop === null) firstVisiblePostTop = Math.round(rect.top);\n        lastVisiblePostBottom = Math.round(rect.bottom);\n      }\n      if (rect.bottom > mainBand.top && rect.top < mainBand.bottom) {\n        mainBandPostHits += 1;\n      }\n    });\n\n    return {\n      viewportPostHits,\n      mainBandPostHits,\n      blankMainBand: posts.length > 0 && mainBandPostHits === 0,\n      firstVisiblePostTop,\n      lastVisiblePostBottom,\n      scrollY: Math.round(window.scrollY || 0),\n      documentHeight: Math.round(document.documentElement.scrollHeight || document.body.scrollHeight || 0),\n    };\n  }\n\n  function allPosts() {\n    if (root.babeguts?.allPosts) return root.babeguts.allPosts();\n    return Array.from(document.querySelectorAll(\".content-item.board-post\"));\n  }\n\n  function countPlaceholders() {\n    const selectors = [\n      \".MuiSkeleton-root\",\n      '[class*=\"Skeleton\"]',\n      '[class*=\"skeleton\"]',\n      '[aria-busy=\"true\"]',\n      '[role=\"progressbar\"]',\n    ];\n    return new Set(selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)))).size;\n  }\n\n  function navigationTiming() {\n    const nav = performance.getEntriesByType?.(\"navigation\")?.[0];\n    if (!nav) {\n      return {\n        type: \"\",\n        responseEndMs: null,\n        domInteractiveMs: null,\n        domContentLoadedMs: null,\n        loadEventEndMs: null,\n        transferSize: 0,\n        encodedBodySize: 0,\n        decodedBodySize: 0,\n      };\n    }\n    const start = nav.startTime || 0;\n    return {\n      type: nav.type || \"\",\n      responseEndMs: roundTiming(nav.responseEnd - start),\n      domInteractiveMs: roundTiming(nav.domInteractive - start),\n      domContentLoadedMs: roundTiming(nav.domContentLoadedEventEnd - start),\n      loadEventEndMs: roundTiming(nav.loadEventEnd - start),\n      transferSize: nav.transferSize || 0,\n      encodedBodySize: nav.encodedBodySize || 0,\n      decodedBodySize: nav.decodedBodySize || 0,\n    };\n  }\n\n  function viewportInfo() {\n    return {\n      width: window.innerWidth,\n      height: window.innerHeight,\n      devicePixelRatio: window.devicePixelRatio || 1,\n      pointer: matchMediaSafe(\"(pointer: coarse)\") ? \"coarse\" : \"fine\",\n      orientation: window.innerWidth >= window.innerHeight ? \"landscape\" : \"portrait\",\n    };\n  }\n\n  function browserInfo() {\n    const nav = navigator;\n    const connection = nav.connection || nav.mozConnection || nav.webkitConnection || {};\n    return {\n      userAgent: nav.userAgent,\n      platform: nav.platform || \"\",\n      hardwareConcurrency: nav.hardwareConcurrency || null,\n      deviceMemory: nav.deviceMemory || null,\n      connection: {\n        effectiveType: connection.effectiveType || \"\",\n        downlink: connection.downlink || null,\n        rtt: connection.rtt || null,\n        saveData: connection.saveData || false,\n      },\n    };\n  }\n\n  function startLongTaskObserver(ctx) {\n    if (!(\"PerformanceObserver\" in window)) return;\n    try {\n      longTaskObserver = new PerformanceObserver((list) => {\n        list.getEntries().forEach((entry) => {\n          longTasks.push({\n            startMs: Math.round(entry.startTime),\n            durationMs: Math.round(entry.duration),\n            name: entry.name || \"\",\n          });\n        });\n        if (longTasks.length > 120) longTasks = longTasks.slice(-120);\n      });\n      longTaskObserver.observe({ entryTypes: [\"longtask\"] });\n    } catch (error) {\n      longTaskObserver = null;\n      ctx?.log?.debug?.(\"longtask observer unavailable\", error);\n    }\n  }\n\n  function summarizeLongTasks() {\n    const supported = !!longTaskObserver || longTasks.length > 0 || supportsLongTask();\n    const totalDurationMs = longTasks.reduce((sum, item) => sum + item.durationMs, 0);\n    const maxDurationMs = longTasks.reduce((max, item) => Math.max(max, item.durationMs), 0);\n    return {\n      supported,\n      count: longTasks.length,\n      totalDurationMs,\n      maxDurationMs,\n      recent: longTasks.slice(-20),\n    };\n  }\n\n  function supportsLongTask() {\n    try {\n      return Array.isArray(PerformanceObserver.supportedEntryTypes) &&\n        PerformanceObserver.supportedEntryTypes.includes(\"longtask\");\n    } catch (error) {\n      return false;\n    }\n  }\n\n  function reportText(report) {\n    return [\n      \"Cudloun Performance Probe\",\n      `captured: ${report.capturedAt}`,\n      `route: ${report.route.path}${report.route.search || \"\"}`,\n      `viewport: ${report.viewport.width}x${report.viewport.height} ${report.viewport.orientation} ${report.viewport.pointer}`,\n      `posts: ${report.counts.boardPosts} total, ${report.counts.visibleBoardPosts} visible, max seen ${report.milestones.maxPostsSeen}`,\n      `images: ${report.counts.loadedImages}/${report.counts.images} loaded, ${report.counts.pendingImages} pending, ${report.counts.brokenImages} broken`,\n      `placeholders: ${report.counts.placeholders}`,\n      `blank main-band samples last 30s: ${report.samples.blankSamplesLast30s}`,\n      `verdict: ${report.analysis.verdict}`,\n      `first post after probe start: ${formatMs(report.analysis.firstPostDelayAfterProbeStartMs)}`,\n      `first post after load event: ${formatMs(report.analysis.firstPostAfterLoadEventMs)}`,\n      `long tasks: ${report.longTasks.supported ? `${report.longTasks.count} / ${report.longTasks.totalDurationMs} ms total` : \"not exposed\"}`,\n      \"\",\n      \"Analysis:\",\n      ...report.analysis.notes.map((note) => `- ${note}`),\n      \"\",\n      JSON.stringify(report, null, 2),\n    ].join(\"\\n\");\n  }\n\n  function isVisible(node) {\n    if (root.babeguts?.isVisible) return root.babeguts.isVisible(node);\n    if (!(node instanceof Element)) return false;\n    const rect = node.getBoundingClientRect();\n    if (rect.width <= 0 || rect.height <= 0) return false;\n    const style = window.getComputedStyle(node);\n    return style.display !== \"none\" && style.visibility !== \"hidden\" && style.opacity !== \"0\";\n  }\n\n  function matchMediaSafe(query) {\n    try {\n      return !!window.matchMedia?.(query)?.matches;\n    } catch (error) {\n      return false;\n    }\n  }\n\n  function roundTiming(value) {\n    return Number.isFinite(value) && value >= 0 ? Math.round(value) : null;\n  }\n\n  function formatMs(value) {\n    return Number.isFinite(value) ? `${value} ms` : \"n/a\";\n  }\n\n  function installStyles() {\n    if (document.getElementById(STYLE_ID)) return;\n    const style = document.createElement(\"style\");\n    style.id = STYLE_ID;\n    style.textContent = `\n      #${PANEL_ID} {\n        position: fixed;\n        z-index: 2147483603;\n        right: 12px;\n        bottom: 12px;\n        width: min(520px, calc(100vw - 24px));\n        max-height: min(680px, calc(100dvh - 24px));\n        display: grid;\n        grid-template-rows: auto auto minmax(180px, 1fr) auto;\n        gap: 8px;\n        box-sizing: border-box;\n        padding: 12px;\n        border: 1px solid rgba(79, 102, 134, .24);\n        border-radius: 8px;\n        background: #fff;\n        color: #182230;\n        box-shadow: 0 18px 44px rgba(18, 25, 38, .22);\n        font: 13px/1.35 system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif;\n      }\n      #${PANEL_ID} .cudloun-performance-probe-head,\n      #${PANEL_ID} .cudloun-performance-probe-actions {\n        display: flex;\n        align-items: center;\n        justify-content: space-between;\n        gap: 8px;\n      }\n      #${PANEL_ID} strong {\n        font-size: 14px;\n      }\n      #${PANEL_ID} button {\n        appearance: none;\n        border: 1px solid rgba(79, 102, 134, .26);\n        border-radius: 6px;\n        background: #f8fafc;\n        color: #243041;\n        cursor: pointer;\n        font: 700 12px/1.2 inherit;\n        padding: 7px 9px;\n      }\n      #${PANEL_ID} button:hover {\n        background: #eef2f7;\n      }\n      #${PANEL_ID} .cudloun-performance-probe-summary {\n        color: #4b5565;\n        font-size: 12px;\n      }\n      #${PANEL_ID} textarea {\n        box-sizing: border-box;\n        width: 100%;\n        min-height: 220px;\n        max-height: 48vh;\n        resize: vertical;\n        border: 1px solid rgba(79, 102, 134, .28);\n        border-radius: 6px;\n        background: #f8fafc;\n        color: #182230;\n        font: 11px/1.4 Consolas, \"SFMono-Regular\", monospace;\n        padding: 9px;\n      }\n      @media (max-width: 680px) {\n        #${PANEL_ID} {\n          right: 8px;\n          bottom: 8px;\n          width: calc(100vw - 16px);\n          max-height: calc(100dvh - 16px);\n          font-size: 12px;\n        }\n        #${PANEL_ID} textarea {\n          min-height: 180px;\n          max-height: 42vh;\n        }\n      }\n    `;\n    document.head.appendChild(style);\n  }\n})();\n");
  embeddedScripts.set("modules/performance-probe.js", function () {
    // Cudloun module: collect Babeta page performance diagnostics.
    (function () {
      "use strict";

      const root = window.Cudloun;
      const ID = "performance-probe";
      const VERSION = "0.1.1";
      const STYLE_ID = "cudloun-performance-probe-style";
      const PANEL_ID = "cudloun-performance-probe-panel";
      const SAMPLE_LIMIT = 90;
      const SAMPLE_MS = 1000;

      let sampleTimer = null;
      let observer = null;
      let longTaskObserver = null;
      let firstPostAt = null;
      let firstImageCompleteAt = null;
      let maxPostsSeen = 0;
      let maxImagesSeen = 0;
      let samples = [];
      let longTasks = [];

      root.registerModule({
        id: ID,
        name: "Performance Probe",
        description: "Measure Babeta page loading, visible posts, image state, and blank-scroll symptoms for copyable reports.",
        version: VERSION,
        defaultEnabled: false,
        actionLabel: "Measure",
        start(ctx) {
          installStyles();
          startSampling(ctx);
          return stop;
        },
        stop,
        action(ctx) {
          openPanel(ctx);
        },
        renderSettings(ctx) {
          const wrap = document.createElement("div");
          wrap.className = "cudloun-settings-list";

          const row = document.createElement("div");
          row.className = "cudloun-setting-row";

          const text = document.createElement("div");
          text.className = "cudloun-setting-text";
          text.textContent = "Performance Probe samples the current page once per second while enabled.";

          row.appendChild(text);
          wrap.appendChild(row);

          const actions = document.createElement("div");
          actions.className = "cudloun-actions";

          const measure = document.createElement("button");
          measure.type = "button";
          measure.className = "cudloun-button";
          measure.textContent = "Measure now";
          measure.addEventListener("click", () => openPanel(ctx));

          const copy = document.createElement("button");
          copy.type = "button";
          copy.className = "cudloun-button";
          copy.textContent = "Copy report";
          copy.addEventListener("click", () => copyReport(ctx));

          actions.appendChild(measure);
          actions.appendChild(copy);
          wrap.appendChild(actions);
          return wrap;
        },
        renderHelp() {
          return [
            "Enable this module on a Babeta page, reproduce slow loading or blank scrolling, then copy the report.",
            "The report includes a short analysis plus route, viewport, browser hints, navigation timings, long tasks where available, post counts, image state, placeholders, and recent visible-post samples.",
            "It only observes the page. It does not change layout, mark posts as read, scroll the page, or send data anywhere automatically.",
          ];
        },
      });

      function startSampling(ctx) {
        resetSession();
        sample(ctx, "start");
        sampleTimer = window.setInterval(() => sample(ctx, "tick"), SAMPLE_MS);

        observer = new MutationObserver(() => {
          const counts = countPage();
          if (!firstPostAt && counts.boardPosts > 0) firstPostAt = Math.round(performance.now());
          if (!firstImageCompleteAt && counts.loadedImages > 0) firstImageCompleteAt = Math.round(performance.now());
          maxPostsSeen = Math.max(maxPostsSeen, counts.boardPosts);
          maxImagesSeen = Math.max(maxImagesSeen, counts.images);
        });
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["src", "style", "class"] });
        startLongTaskObserver(ctx);
        ctx?.log?.info?.("sampling started");
      }

      function stop() {
        if (sampleTimer) {
          window.clearInterval(sampleTimer);
          sampleTimer = null;
        }
        if (observer) {
          observer.disconnect();
          observer = null;
        }
        if (longTaskObserver) {
          longTaskObserver.disconnect();
          longTaskObserver = null;
        }
        document.getElementById(PANEL_ID)?.remove();
        document.getElementById(STYLE_ID)?.remove();
      }

      function resetSession() {
        firstPostAt = null;
        firstImageCompleteAt = null;
        maxPostsSeen = 0;
        maxImagesSeen = 0;
        samples = [];
        longTasks = [];
      }

      function openPanel(ctx) {
        installStyles();
        const report = makeReport("manual");

        let panel = document.getElementById(PANEL_ID);
        if (!panel) {
          panel = document.createElement("div");
          panel.id = PANEL_ID;
          panel.innerHTML = `
            <div class="cudloun-performance-probe-head">
              <strong>Performance Probe</strong>
              <button type="button" data-action="close">x</button>
            </div>
            <div class="cudloun-performance-probe-summary" data-summary></div>
            <textarea spellcheck="false" data-report></textarea>
            <div class="cudloun-performance-probe-actions">
              <button type="button" data-action="refresh">Refresh</button>
              <button type="button" data-action="copy">Copy report</button>
            </div>
          `;
          panel.querySelector("[data-action='close']").addEventListener("click", () => panel.remove());
          panel.querySelector("[data-action='refresh']").addEventListener("click", () => openPanel(ctx));
          panel.querySelector("[data-action='copy']").addEventListener("click", () => copyReport(ctx));
          document.body.appendChild(panel);
        }

        renderPanel(panel, report);
      }

      function renderPanel(panel, report) {
        const counts = report.counts;
        const summary = panel.querySelector("[data-summary]");
        const box = panel.querySelector("[data-report]");
        if (summary) {
          summary.textContent = [
            `${counts.boardPosts} posts`,
            `${counts.visibleBoardPosts} visible`,
            `${counts.loadedImages}/${counts.images} images loaded`,
            `${report.samples.blankSamplesLast30s} blank samples`,
          ].join(" / ");
        }
        if (box) {
          box.value = reportText(report);
          box.focus();
          box.select();
        }
      }

      function copyReport(ctx) {
        const report = makeReport("copy");
        const text = reportText(report);
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(text).then(
            () => ctx?.log?.info?.("report copied"),
            (error) => ctx?.log?.warn?.("copy failed", error),
          );
        }

        const panel = document.getElementById(PANEL_ID);
        if (panel) renderPanel(panel, report);
      }

      function sample(ctx, reason) {
        const counts = countPage();
        const visible = visiblePostStats();
        const now = Math.round(performance.now());

        if (!firstPostAt && counts.boardPosts > 0) firstPostAt = now;
        if (!firstImageCompleteAt && counts.loadedImages > 0) firstImageCompleteAt = now;
        maxPostsSeen = Math.max(maxPostsSeen, counts.boardPosts);
        maxImagesSeen = Math.max(maxImagesSeen, counts.images);

        samples.push({
          t: now,
          reason,
          y: Math.round(window.scrollY || 0),
          boardPosts: counts.boardPosts,
          visibleBoardPosts: counts.visibleBoardPosts,
          images: counts.images,
          loadedImages: counts.loadedImages,
          placeholders: counts.placeholders,
          viewportPostHits: visible.viewportPostHits,
          mainBandPostHits: visible.mainBandPostHits,
          blankMainBand: visible.blankMainBand,
        });

        if (samples.length > SAMPLE_LIMIT) samples.shift();
        ctx?.log?.trace?.("sample", samples[samples.length - 1]);
      }

      function makeReport(reason) {
        const counts = countPage();
        const navigation = navigationTiming();
        const recent = samples.slice(-30);
        const blankSamples = recent.filter((item) => item.blankMainBand).length;
        const route = root.babeguts?.route?.() || {
          href: window.location.href,
          path: window.location.pathname,
          search: window.location.search,
          hash: window.location.hash,
          type: "unknown",
          boardId: "",
        };

        return {
          schemaVersion: 1,
          module: ID,
          moduleVersion: VERSION,
          reason,
          capturedAt: new Date().toISOString(),
          route,
          cudloun: {
            coreVersion: root.coreVersion || root.version || "",
            manifestVersion: root.manifestVersion || "",
            seedVersion: root.seedVersion || "",
          },
          user: root.babeguts?.currentUser?.() || "",
          viewport: viewportInfo(),
          browser: browserInfo(),
          navigation,
          analysis: analyzeReport({ navigation, counts, recent, blankSamples }),
          milestones: {
            probeStartedMs: samples[0]?.t || null,
            firstPostSeenMs: firstPostAt,
            firstImageCompleteSeenMs: firstImageCompleteAt,
            maxPostsSeen,
            maxImagesSeen,
          },
          longTasks: summarizeLongTasks(),
          counts,
          visiblePostStats: visiblePostStats(),
          samples: {
            intervalMs: SAMPLE_MS,
            retained: samples.length,
            recent: recent,
            blankSamplesLast30s: blankSamples,
          },
        };
      }

      function analyzeReport(data) {
        const probeStart = samples[0]?.t || null;
        const firstPostDelay = probeStart !== null && firstPostAt !== null ? firstPostAt - probeStart : null;
        const appRenderAfterLoad = firstPostAt !== null && data.navigation.loadEventEndMs !== null
          ? firstPostAt - data.navigation.loadEventEndMs
          : null;
        const yValues = data.recent.map((item) => item.y);
        const imageValues = data.recent.map((item) => item.images);
        const scrollMoves = yValues.filter((value, index) => index > 0 && value !== yValues[index - 1]).length;
        const imageCountChanged = imageValues.some((value, index) => index > 0 && value !== imageValues[index - 1]);
        const longTaskSummary = summarizeLongTasks();
        const notes = [];

        if (data.blankSamples > 0) notes.push(`${data.blankSamples} recent sample(s) had no post in the main reading band.`);
        else notes.push("No blank-scroll sample was captured in the recent window.");

        if (firstPostDelay !== null) notes.push(`First post was observed ${firstPostDelay} ms after the probe started.`);
        if (appRenderAfterLoad !== null && appRenderAfterLoad > 750) notes.push(`First post appeared ${appRenderAfterLoad} ms after loadEventEnd.`);
        if (data.counts.pendingImages > 0) notes.push(`${data.counts.pendingImages} image(s) were still pending at capture time.`);
        if (data.counts.brokenImages > 0) notes.push(`${data.counts.brokenImages} broken image(s) were visible to the browser.`);
        if (imageCountChanged) notes.push("Image count changed during the recent sample window.");
        if (scrollMoves > 0) notes.push(`Scroll position changed ${scrollMoves} time(s) in the recent sample window.`);
        if (longTaskSummary.supported && longTaskSummary.count > 0) notes.push(`${longTaskSummary.count} long task(s) over 50 ms were observed.`);
        if (!longTaskSummary.supported) notes.push("Long-task timing is not exposed by this browser.");

        return {
          blankSamplesLast30s: data.blankSamples,
          firstPostDelayAfterProbeStartMs: firstPostDelay,
          firstPostAfterLoadEventMs: appRenderAfterLoad,
          scrollMovesLast30s: scrollMoves,
          imageCountChangedLast30s: imageCountChanged,
          verdict: data.blankSamples > 0 || data.counts.pendingImages > 0 || longTaskSummary.totalDurationMs > 250
            ? "issue-observed"
            : "no-issue-observed",
          notes,
        };
      }

      function countPage() {
        const posts = allPosts();
        const visiblePosts = posts.filter(isVisible);
        const images = Array.from(document.images || []);
        const loadedImages = images.filter((img) => img.complete && img.naturalWidth > 0);
        const pendingImages = images.filter((img) => !img.complete || img.naturalWidth === 0);
        const placeholders = countPlaceholders();
        const contentItems = document.querySelectorAll(".content-item").length;

        return {
          contentItems,
          boardPosts: posts.length,
          visibleBoardPosts: visiblePosts.length,
          images: images.length,
          loadedImages: loadedImages.length,
          pendingImages: pendingImages.length,
          brokenImages: images.filter((img) => img.complete && img.naturalWidth === 0).length,
          placeholders,
        };
      }

      function visiblePostStats() {
        const posts = allPosts();
        const viewport = { top: 0, bottom: window.innerHeight || 0 };
        const mainBand = {
          top: Math.round((window.innerHeight || 0) * 0.22),
          bottom: Math.round((window.innerHeight || 0) * 0.86),
        };
        let viewportPostHits = 0;
        let mainBandPostHits = 0;
        let firstVisiblePostTop = null;
        let lastVisiblePostBottom = null;

        posts.forEach((post) => {
          const rect = post.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) return;
          if (rect.bottom > viewport.top && rect.top < viewport.bottom) {
            viewportPostHits += 1;
            if (firstVisiblePostTop === null) firstVisiblePostTop = Math.round(rect.top);
            lastVisiblePostBottom = Math.round(rect.bottom);
          }
          if (rect.bottom > mainBand.top && rect.top < mainBand.bottom) {
            mainBandPostHits += 1;
          }
        });

        return {
          viewportPostHits,
          mainBandPostHits,
          blankMainBand: posts.length > 0 && mainBandPostHits === 0,
          firstVisiblePostTop,
          lastVisiblePostBottom,
          scrollY: Math.round(window.scrollY || 0),
          documentHeight: Math.round(document.documentElement.scrollHeight || document.body.scrollHeight || 0),
        };
      }

      function allPosts() {
        if (root.babeguts?.allPosts) return root.babeguts.allPosts();
        return Array.from(document.querySelectorAll(".content-item.board-post"));
      }

      function countPlaceholders() {
        const selectors = [
          ".MuiSkeleton-root",
          '[class*="Skeleton"]',
          '[class*="skeleton"]',
          '[aria-busy="true"]',
          '[role="progressbar"]',
        ];
        return new Set(selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)))).size;
      }

      function navigationTiming() {
        const nav = performance.getEntriesByType?.("navigation")?.[0];
        if (!nav) {
          return {
            type: "",
            responseEndMs: null,
            domInteractiveMs: null,
            domContentLoadedMs: null,
            loadEventEndMs: null,
            transferSize: 0,
            encodedBodySize: 0,
            decodedBodySize: 0,
          };
        }
        const start = nav.startTime || 0;
        return {
          type: nav.type || "",
          responseEndMs: roundTiming(nav.responseEnd - start),
          domInteractiveMs: roundTiming(nav.domInteractive - start),
          domContentLoadedMs: roundTiming(nav.domContentLoadedEventEnd - start),
          loadEventEndMs: roundTiming(nav.loadEventEnd - start),
          transferSize: nav.transferSize || 0,
          encodedBodySize: nav.encodedBodySize || 0,
          decodedBodySize: nav.decodedBodySize || 0,
        };
      }

      function viewportInfo() {
        return {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio || 1,
          pointer: matchMediaSafe("(pointer: coarse)") ? "coarse" : "fine",
          orientation: window.innerWidth >= window.innerHeight ? "landscape" : "portrait",
        };
      }

      function browserInfo() {
        const nav = navigator;
        const connection = nav.connection || nav.mozConnection || nav.webkitConnection || {};
        return {
          userAgent: nav.userAgent,
          platform: nav.platform || "",
          hardwareConcurrency: nav.hardwareConcurrency || null,
          deviceMemory: nav.deviceMemory || null,
          connection: {
            effectiveType: connection.effectiveType || "",
            downlink: connection.downlink || null,
            rtt: connection.rtt || null,
            saveData: connection.saveData || false,
          },
        };
      }

      function startLongTaskObserver(ctx) {
        if (!("PerformanceObserver" in window)) return;
        try {
          longTaskObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
              longTasks.push({
                startMs: Math.round(entry.startTime),
                durationMs: Math.round(entry.duration),
                name: entry.name || "",
              });
            });
            if (longTasks.length > 120) longTasks = longTasks.slice(-120);
          });
          longTaskObserver.observe({ entryTypes: ["longtask"] });
        } catch (error) {
          longTaskObserver = null;
          ctx?.log?.debug?.("longtask observer unavailable", error);
        }
      }

      function summarizeLongTasks() {
        const supported = !!longTaskObserver || longTasks.length > 0 || supportsLongTask();
        const totalDurationMs = longTasks.reduce((sum, item) => sum + item.durationMs, 0);
        const maxDurationMs = longTasks.reduce((max, item) => Math.max(max, item.durationMs), 0);
        return {
          supported,
          count: longTasks.length,
          totalDurationMs,
          maxDurationMs,
          recent: longTasks.slice(-20),
        };
      }

      function supportsLongTask() {
        try {
          return Array.isArray(PerformanceObserver.supportedEntryTypes) &&
            PerformanceObserver.supportedEntryTypes.includes("longtask");
        } catch (error) {
          return false;
        }
      }

      function reportText(report) {
        return [
          "Cudloun Performance Probe",
          `captured: ${report.capturedAt}`,
          `route: ${report.route.path}${report.route.search || ""}`,
          `viewport: ${report.viewport.width}x${report.viewport.height} ${report.viewport.orientation} ${report.viewport.pointer}`,
          `posts: ${report.counts.boardPosts} total, ${report.counts.visibleBoardPosts} visible, max seen ${report.milestones.maxPostsSeen}`,
          `images: ${report.counts.loadedImages}/${report.counts.images} loaded, ${report.counts.pendingImages} pending, ${report.counts.brokenImages} broken`,
          `placeholders: ${report.counts.placeholders}`,
          `blank main-band samples last 30s: ${report.samples.blankSamplesLast30s}`,
          `verdict: ${report.analysis.verdict}`,
          `first post after probe start: ${formatMs(report.analysis.firstPostDelayAfterProbeStartMs)}`,
          `first post after load event: ${formatMs(report.analysis.firstPostAfterLoadEventMs)}`,
          `long tasks: ${report.longTasks.supported ? `${report.longTasks.count} / ${report.longTasks.totalDurationMs} ms total` : "not exposed"}`,
          "",
          "Analysis:",
          ...report.analysis.notes.map((note) => `- ${note}`),
          "",
          JSON.stringify(report, null, 2),
        ].join("\n");
      }

      function isVisible(node) {
        if (root.babeguts?.isVisible) return root.babeguts.isVisible(node);
        if (!(node instanceof Element)) return false;
        const rect = node.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return false;
        const style = window.getComputedStyle(node);
        return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
      }

      function matchMediaSafe(query) {
        try {
          return !!window.matchMedia?.(query)?.matches;
        } catch (error) {
          return false;
        }
      }

      function roundTiming(value) {
        return Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
      }

      function formatMs(value) {
        return Number.isFinite(value) ? `${value} ms` : "n/a";
      }

      function installStyles() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
          #${PANEL_ID} {
            position: fixed;
            z-index: 2147483603;
            right: 12px;
            bottom: 12px;
            width: min(520px, calc(100vw - 24px));
            max-height: min(680px, calc(100dvh - 24px));
            display: grid;
            grid-template-rows: auto auto minmax(180px, 1fr) auto;
            gap: 8px;
            box-sizing: border-box;
            padding: 12px;
            border: 1px solid rgba(79, 102, 134, .24);
            border-radius: 8px;
            background: #fff;
            color: #182230;
            box-shadow: 0 18px 44px rgba(18, 25, 38, .22);
            font: 13px/1.35 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }
          #${PANEL_ID} .cudloun-performance-probe-head,
          #${PANEL_ID} .cudloun-performance-probe-actions {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
          }
          #${PANEL_ID} strong {
            font-size: 14px;
          }
          #${PANEL_ID} button {
            appearance: none;
            border: 1px solid rgba(79, 102, 134, .26);
            border-radius: 6px;
            background: #f8fafc;
            color: #243041;
            cursor: pointer;
            font: 700 12px/1.2 inherit;
            padding: 7px 9px;
          }
          #${PANEL_ID} button:hover {
            background: #eef2f7;
          }
          #${PANEL_ID} .cudloun-performance-probe-summary {
            color: #4b5565;
            font-size: 12px;
          }
          #${PANEL_ID} textarea {
            box-sizing: border-box;
            width: 100%;
            min-height: 220px;
            max-height: 48vh;
            resize: vertical;
            border: 1px solid rgba(79, 102, 134, .28);
            border-radius: 6px;
            background: #f8fafc;
            color: #182230;
            font: 11px/1.4 Consolas, "SFMono-Regular", monospace;
            padding: 9px;
          }
          @media (max-width: 680px) {
            #${PANEL_ID} {
              right: 8px;
              bottom: 8px;
              width: calc(100vw - 16px);
              max-height: calc(100dvh - 16px);
              font-size: 12px;
            }
            #${PANEL_ID} textarea {
              min-height: 180px;
              max-height: 42vh;
            }
          }
        `;
        document.head.appendChild(style);
      }
    })();

  });

  embeddedText.set("modules/nav-tweaks.js", "// Cudloun module: consistent Babeta quick navigation.\n(function () {\n  \"use strict\";\n\n  const root = window.Cudloun;\n  const ID = \"nav-tweaks\";\n  const VERSION = \"0.1.0\";\n  const STYLE_ID = \"cudloun-nav-tweaks-style\";\n  const BAR_ID = \"cudloun-nav-tweaks-bar\";\n  const SETTINGS_KEY = \"cudloun.module.navTweaks.v1\";\n\n  const defaults = {\n    enabled: true,\n    showMobile: true,\n    showDesktop: false,\n    compactLandscape: true,\n    position: \"top\",\n    showHome: true,\n    showMessages: true,\n    showFavorites: true,\n    showSearch: true,\n    showContribute: true,\n    showTopBottom: true,\n  };\n\n  let settings = loadSettings();\n  let observer = null;\n  let resizeHandler = null;\n  let renderScheduled = false;\n\n  root.registerModule({\n    id: ID,\n    name: \"Nav Tweaks\",\n    description: \"Add consistent quick actions for Babeta navigation, board search, posting, and page top/bottom.\",\n    version: VERSION,\n    defaultEnabled: false,\n    actionLabel: \"Show shortcuts\",\n    start(ctx) {\n      install(ctx);\n      return stop;\n    },\n    stop,\n    action(ctx) {\n      install(ctx);\n      const bar = document.getElementById(BAR_ID);\n      if (bar) flash(bar);\n    },\n    renderSettings(ctx) {\n      const wrap = document.createElement(\"div\");\n      wrap.className = \"cudloun-settings-list\";\n      [\n        [\"showMobile\", \"Show on mobile\"],\n        [\"showDesktop\", \"Show on desktop\"],\n        [\"compactLandscape\", \"Compact in landscape\"],\n        [\"showHome\", \"Home\"],\n        [\"showMessages\", \"Vzkaznik\"],\n        [\"showFavorites\", \"Oblibene\"],\n        [\"showSearch\", \"Board search\"],\n        [\"showContribute\", \"Contribute\"],\n        [\"showTopBottom\", \"Top/bottom\"],\n      ].forEach(([name, label]) => {\n        wrap.appendChild(renderCheckbox(ctx, name, label));\n      });\n\n      const position = document.createElement(\"label\");\n      position.className = \"cudloun-setting-row\";\n      const text = document.createElement(\"span\");\n      text.className = \"cudloun-setting-text\";\n      text.textContent = \"Position\";\n      const select = document.createElement(\"select\");\n      select.value = settings.position;\n      [[\"top\", \"Top\"], [\"bottom\", \"Bottom\"]].forEach(([value, label]) => {\n        const option = document.createElement(\"option\");\n        option.value = value;\n        option.textContent = label;\n        select.appendChild(option);\n      });\n      select.addEventListener(\"change\", () => {\n        settings.position = select.value === \"bottom\" ? \"bottom\" : \"top\";\n        saveSettings();\n        applySettings();\n        renderBar(ctx);\n      });\n      position.appendChild(text);\n      position.appendChild(select);\n      wrap.appendChild(position);\n      return wrap;\n    },\n    renderHelp() {\n      return [\n        \"Nav Tweaks adds a small fixed shortcut rail so phone, tablet, and desktop users can keep key actions in one predictable place.\",\n        \"Home, Vzkaznik, and Oblibene prefer Babeta's native navigation buttons when visible, then fall back to route navigation.\",\n        \"Board search and contribute shortcuts click Babeta's native controls when they are available.\",\n      ];\n    },\n  });\n\n  function install(ctx) {\n    installStyles();\n    renderBar(ctx);\n    applySettings();\n\n    if (!observer) {\n      observer = new MutationObserver((records) => {\n        if (records.every((record) => record.target instanceof Element && record.target.closest(`#${BAR_ID}`))) return;\n        scheduleRender(ctx);\n      });\n      observer.observe(document.body, { childList: true, subtree: true });\n    }\n    if (!resizeHandler) {\n      resizeHandler = () => applySettings();\n      window.addEventListener(\"resize\", resizeHandler);\n      window.addEventListener(\"orientationchange\", resizeHandler);\n    }\n    ctx?.log?.info?.(\"installed\");\n  }\n\n  function stop() {\n    if (observer) {\n      observer.disconnect();\n      observer = null;\n    }\n    if (resizeHandler) {\n      window.removeEventListener(\"resize\", resizeHandler);\n      window.removeEventListener(\"orientationchange\", resizeHandler);\n      resizeHandler = null;\n    }\n    document.getElementById(BAR_ID)?.remove();\n    document.getElementById(STYLE_ID)?.remove();\n    document.documentElement.removeAttribute(\"data-cudloun-nav-tweaks-position\");\n    document.documentElement.removeAttribute(\"data-cudloun-nav-tweaks-compact\");\n    document.documentElement.removeAttribute(\"data-cudloun-nav-tweaks-visible\");\n    document.documentElement.removeAttribute(\"data-cudloun-nav-tweaks-route\");\n  }\n\n  function renderCheckbox(ctx, name, labelText) {\n    const label = document.createElement(\"label\");\n    label.className = \"cudloun-setting-row\";\n    const text = document.createElement(\"span\");\n    text.className = \"cudloun-setting-text\";\n    text.textContent = labelText;\n    const checkbox = document.createElement(\"input\");\n    checkbox.type = \"checkbox\";\n    checkbox.checked = settings[name] !== false;\n    checkbox.addEventListener(\"change\", () => {\n      settings[name] = checkbox.checked;\n      saveSettings();\n      applySettings();\n      renderBar(ctx);\n    });\n    label.appendChild(text);\n    label.appendChild(checkbox);\n    return label;\n  }\n\n  function renderBar(ctx) {\n    renderScheduled = false;\n    let bar = document.getElementById(BAR_ID);\n    if (!settings.enabled) {\n      bar?.remove();\n      return;\n    }\n    if (!bar) {\n      bar = document.createElement(\"nav\");\n      bar.id = BAR_ID;\n      bar.setAttribute(\"aria-label\", \"Cudloun quick navigation\");\n      document.body.appendChild(bar);\n    }\n\n    const actions = buildActions(ctx).filter((action) => action.enabled);\n    bar.innerHTML = \"\";\n    actions.forEach((action) => {\n      const button = document.createElement(\"button\");\n      button.type = \"button\";\n      button.className = \"cudloun-nav-tweaks-action\";\n      button.dataset.action = action.id;\n      button.title = action.title;\n      button.setAttribute(\"aria-label\", action.title);\n      button.innerHTML = `<span class=\"cudloun-nav-tweaks-icon\">${action.icon}<\/span><span class=\"cudloun-nav-tweaks-label\">${action.label}<\/span>`;\n      button.addEventListener(\"click\", (event) => {\n        event.preventDefault();\n        action.run();\n      });\n      bar.appendChild(button);\n    });\n    applySettings();\n  }\n\n  function scheduleRender(ctx) {\n    if (renderScheduled) return;\n    renderScheduled = true;\n    window.setTimeout(() => renderBar(ctx), 120);\n  }\n\n  function buildActions(ctx) {\n    const route = root.babeguts?.route?.() || currentRoute();\n    const board = route.type === \"board\";\n    return [\n      {\n        id: \"home\",\n        label: \"Domu\",\n        title: \"Domu\",\n        icon: \"⌂\",\n        enabled: settings.showHome,\n        run: () => nativeBottom(\"Domů\") || navigate(\"/\"),\n      },\n      {\n        id: \"messages\",\n        label: \"Vzk\",\n        title: \"Vzkaznik\",\n        icon: \"✉\",\n        enabled: settings.showMessages,\n        run: () => nativeBottom(\"Vzkazník\") || navigate(\"/messages\"),\n      },\n      {\n        id: \"favorites\",\n        label: \"Obl\",\n        title: \"Oblibene\",\n        icon: \"★\",\n        enabled: settings.showFavorites,\n        run: () => nativeBottom(\"Oblíbené\") || navigate(\"/favorites\"),\n      },\n      {\n        id: \"search\",\n        label: \"Search\",\n        title: board ? \"Hledat v klubu\" : \"Search\",\n        icon: \"⌕\",\n        enabled: settings.showSearch,\n        run: () => clickFirst([\n          'button[aria-label=\"Hledat v klubu\"]',\n          'button[aria-label*=\"Hledat\"]',\n          'input[type=\"text\"]',\n        ]) || focusGlobalSearch(ctx),\n      },\n      {\n        id: \"contribute\",\n        label: \"Post\",\n        title: \"Prispět\",\n        icon: \"+\",\n        enabled: board && settings.showContribute,\n        run: () => clickTextButton(/^PŘISPĚT\\\\*?$/i) || clickTextButton(/^PRISPET\\\\*?$/i),\n      },\n      {\n        id: \"top\",\n        label: \"Top\",\n        title: \"Top\",\n        icon: \"↑\",\n        enabled: settings.showTopBottom,\n        run: () => window.scrollTo({ top: 0, behavior: \"smooth\" }),\n      },\n      {\n        id: \"bottom\",\n        label: \"Bot\",\n        title: \"Bottom\",\n        icon: \"↓\",\n        enabled: settings.showTopBottom,\n        run: () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: \"smooth\" }),\n      },\n    ];\n  }\n\n  function nativeBottom(label) {\n    const normalized = normalize(label);\n    const button = Array.from(document.querySelectorAll(\".MuiBottomNavigationAction-root, button\"))\n      .filter(isVisible)\n      .find((node) => normalize(node.textContent || \"\") === normalized);\n    if (!button) return false;\n    button.click();\n    return true;\n  }\n\n  function clickFirst(selectors) {\n    for (const selector of selectors) {\n      const node = Array.from(document.querySelectorAll(selector)).find(isVisible);\n      if (!node) continue;\n      if (node.matches(\"input, textarea\")) node.focus();\n      else node.click();\n      return true;\n    }\n    return false;\n  }\n\n  function clickTextButton(pattern) {\n    const button = Array.from(document.querySelectorAll(\"button\"))\n      .filter(isVisible)\n      .find((node) => pattern.test(normalize(node.textContent || \"\")));\n    if (!button) return false;\n    button.click();\n    return true;\n  }\n\n  function focusGlobalSearch() {\n    const input = Array.from(document.querySelectorAll('input[type=\"text\"], input[type=\"search\"]')).find(isVisible);\n    if (!input) return false;\n    input.focus();\n    return true;\n  }\n\n  function navigate(path) {\n    if (root.navigate) root.navigate(path);\n    else window.location.assign(path);\n    return true;\n  }\n\n  function currentRoute() {\n    const path = window.location.pathname;\n    const boardMatch = path.match(/^\\/boards\\/([^/?#]+)/);\n    return {\n      href: window.location.href,\n      path,\n      search: window.location.search,\n      hash: window.location.hash,\n      type: boardMatch ? \"board\" : path === \"/favorites\" ? \"favorites\" : path === \"/\" ? \"home\" : \"unknown\",\n      boardId: boardMatch ? decodeURIComponent(boardMatch[1]) : \"\",\n    };\n  }\n\n  function applySettings() {\n    const mobile = window.matchMedia?.(\"(max-width: 760px), (pointer: coarse)\")?.matches;\n    const visible = settings.enabled && ((mobile && settings.showMobile) || (!mobile && settings.showDesktop));\n    const compact = settings.compactLandscape && window.innerWidth > window.innerHeight;\n    const route = root.babeguts?.route?.() || currentRoute();\n    document.documentElement.setAttribute(\"data-cudloun-nav-tweaks-route\", route.type || \"unknown\");\n    document.documentElement.setAttribute(\"data-cudloun-nav-tweaks-position\", settings.position === \"bottom\" ? \"bottom\" : \"top\");\n    document.documentElement.setAttribute(\"data-cudloun-nav-tweaks-compact\", compact ? \"true\" : \"false\");\n    document.documentElement.setAttribute(\"data-cudloun-nav-tweaks-visible\", visible ? \"true\" : \"false\");\n  }\n\n  function flash(node) {\n    node.animate?.([\n      { transform: \"translateY(0)\", boxShadow: \"0 10px 26px rgba(18,25,38,.18)\" },\n      { transform: \"translateY(-2px)\", boxShadow: \"0 12px 32px rgba(14,116,144,.32)\" },\n      { transform: \"translateY(0)\", boxShadow: \"0 10px 26px rgba(18,25,38,.18)\" },\n    ], { duration: 360, easing: \"ease-out\" });\n  }\n\n  function isVisible(node) {\n    if (root.babeguts?.isVisible) return root.babeguts.isVisible(node);\n    if (!(node instanceof Element)) return false;\n    const rect = node.getBoundingClientRect();\n    if (rect.width <= 0 || rect.height <= 0) return false;\n    const style = window.getComputedStyle(node);\n    return style.display !== \"none\" && style.visibility !== \"hidden\" && style.opacity !== \"0\";\n  }\n\n  function normalize(value) {\n    return String(value || \"\")\n      .normalize(\"NFD\")\n      .replace(/[\\u0300-\\u036f]/g, \"\")\n      .replace(/\\s+/g, \" \")\n      .trim()\n      .toLowerCase();\n  }\n\n  function loadSettings() {\n    try {\n      return { ...defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || \"{}\") };\n    } catch (error) {\n      return { ...defaults };\n    }\n  }\n\n  function saveSettings() {\n    try {\n      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));\n    } catch (error) {\n      root.log?.warn?.(\"nav-tweaks\", \"settings could not be saved\", error);\n    }\n  }\n\n  function installStyles() {\n    if (document.getElementById(STYLE_ID)) return;\n    const style = document.createElement(\"style\");\n    style.id = STYLE_ID;\n    style.textContent = `\n      #${BAR_ID} {\n        position: fixed;\n        z-index: 2147483598;\n        left: 50%;\n        display: flex;\n        align-items: center;\n        gap: 4px;\n        max-width: calc(100vw - 16px);\n        box-sizing: border-box;\n        padding: 4px;\n        border: 1px solid rgba(79, 102, 134, .18);\n        border-radius: 8px;\n        background: rgba(255, 255, 255, .96);\n        color: #182230;\n        box-shadow: 0 10px 26px rgba(18, 25, 38, .18);\n        transform: translateX(-50%);\n        overflow-x: auto;\n        scrollbar-width: none;\n        -webkit-overflow-scrolling: touch;\n      }\n      #${BAR_ID}::-webkit-scrollbar {\n        display: none;\n      }\n      html[data-cudloun-nav-tweaks-visible=\"false\"] #${BAR_ID} {\n        display: none;\n      }\n      html[data-cudloun-nav-tweaks-position=\"top\"] #${BAR_ID} {\n        top: max(58px, env(safe-area-inset-top, 0px) + 58px);\n      }\n      html[data-cudloun-nav-tweaks-position=\"top\"][data-cudloun-nav-tweaks-route=\"board\"] #${BAR_ID} {\n        top: max(112px, env(safe-area-inset-top, 0px) + 112px);\n      }\n      html[data-cudloun-nav-tweaks-position=\"bottom\"] #${BAR_ID} {\n        bottom: max(62px, env(safe-area-inset-bottom, 0px) + 62px);\n      }\n      #${BAR_ID} .cudloun-nav-tweaks-action {\n        appearance: none;\n        min-width: 42px;\n        height: 32px;\n        display: inline-flex;\n        align-items: center;\n        justify-content: center;\n        gap: 3px;\n        border: 1px solid rgba(79, 102, 134, .18);\n        border-radius: 6px;\n        background: #f8fafc;\n        color: #243041;\n        cursor: pointer;\n        font: 700 11px/1 system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif;\n        letter-spacing: 0;\n        white-space: nowrap;\n      }\n      #${BAR_ID} .cudloun-nav-tweaks-action:hover {\n        background: #eef2f7;\n      }\n      #${BAR_ID} .cudloun-nav-tweaks-icon {\n        font-size: 13px;\n        line-height: 1;\n      }\n      #${BAR_ID} .cudloun-nav-tweaks-label {\n        overflow: hidden;\n        text-overflow: ellipsis;\n      }\n      html[data-cudloun-nav-tweaks-compact=\"true\"] #${BAR_ID} {\n        padding: 3px;\n        gap: 3px;\n      }\n      html[data-cudloun-nav-tweaks-compact=\"true\"] #${BAR_ID} .cudloun-nav-tweaks-action {\n        min-width: 34px;\n        width: 34px;\n        height: 28px;\n      }\n      html[data-cudloun-nav-tweaks-compact=\"true\"] #${BAR_ID} .cudloun-nav-tweaks-label {\n        display: none;\n      }\n      @media (min-width: 761px) and (pointer: fine) {\n        html[data-cudloun-nav-tweaks-position=\"top\"] #${BAR_ID} {\n          top: 72px;\n        }\n        html[data-cudloun-nav-tweaks-position=\"bottom\"] #${BAR_ID} {\n          bottom: 18px;\n        }\n      }\n    `;\n    document.head.appendChild(style);\n  }\n})();\n");
  embeddedScripts.set("modules/nav-tweaks.js", function () {
    // Cudloun module: consistent Babeta quick navigation.
    (function () {
      "use strict";

      const root = window.Cudloun;
      const ID = "nav-tweaks";
      const VERSION = "0.1.0";
      const STYLE_ID = "cudloun-nav-tweaks-style";
      const BAR_ID = "cudloun-nav-tweaks-bar";
      const SETTINGS_KEY = "cudloun.module.navTweaks.v1";

      const defaults = {
        enabled: true,
        showMobile: true,
        showDesktop: false,
        compactLandscape: true,
        position: "top",
        showHome: true,
        showMessages: true,
        showFavorites: true,
        showSearch: true,
        showContribute: true,
        showTopBottom: true,
      };

      let settings = loadSettings();
      let observer = null;
      let resizeHandler = null;
      let renderScheduled = false;

      root.registerModule({
        id: ID,
        name: "Nav Tweaks",
        description: "Add consistent quick actions for Babeta navigation, board search, posting, and page top/bottom.",
        version: VERSION,
        defaultEnabled: false,
        actionLabel: "Show shortcuts",
        start(ctx) {
          install(ctx);
          return stop;
        },
        stop,
        action(ctx) {
          install(ctx);
          const bar = document.getElementById(BAR_ID);
          if (bar) flash(bar);
        },
        renderSettings(ctx) {
          const wrap = document.createElement("div");
          wrap.className = "cudloun-settings-list";
          [
            ["showMobile", "Show on mobile"],
            ["showDesktop", "Show on desktop"],
            ["compactLandscape", "Compact in landscape"],
            ["showHome", "Home"],
            ["showMessages", "Vzkaznik"],
            ["showFavorites", "Oblibene"],
            ["showSearch", "Board search"],
            ["showContribute", "Contribute"],
            ["showTopBottom", "Top/bottom"],
          ].forEach(([name, label]) => {
            wrap.appendChild(renderCheckbox(ctx, name, label));
          });

          const position = document.createElement("label");
          position.className = "cudloun-setting-row";
          const text = document.createElement("span");
          text.className = "cudloun-setting-text";
          text.textContent = "Position";
          const select = document.createElement("select");
          select.value = settings.position;
          [["top", "Top"], ["bottom", "Bottom"]].forEach(([value, label]) => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = label;
            select.appendChild(option);
          });
          select.addEventListener("change", () => {
            settings.position = select.value === "bottom" ? "bottom" : "top";
            saveSettings();
            applySettings();
            renderBar(ctx);
          });
          position.appendChild(text);
          position.appendChild(select);
          wrap.appendChild(position);
          return wrap;
        },
        renderHelp() {
          return [
            "Nav Tweaks adds a small fixed shortcut rail so phone, tablet, and desktop users can keep key actions in one predictable place.",
            "Home, Vzkaznik, and Oblibene prefer Babeta's native navigation buttons when visible, then fall back to route navigation.",
            "Board search and contribute shortcuts click Babeta's native controls when they are available.",
          ];
        },
      });

      function install(ctx) {
        installStyles();
        renderBar(ctx);
        applySettings();

        if (!observer) {
          observer = new MutationObserver((records) => {
            if (records.every((record) => record.target instanceof Element && record.target.closest(`#${BAR_ID}`))) return;
            scheduleRender(ctx);
          });
          observer.observe(document.body, { childList: true, subtree: true });
        }
        if (!resizeHandler) {
          resizeHandler = () => applySettings();
          window.addEventListener("resize", resizeHandler);
          window.addEventListener("orientationchange", resizeHandler);
        }
        ctx?.log?.info?.("installed");
      }

      function stop() {
        if (observer) {
          observer.disconnect();
          observer = null;
        }
        if (resizeHandler) {
          window.removeEventListener("resize", resizeHandler);
          window.removeEventListener("orientationchange", resizeHandler);
          resizeHandler = null;
        }
        document.getElementById(BAR_ID)?.remove();
        document.getElementById(STYLE_ID)?.remove();
        document.documentElement.removeAttribute("data-cudloun-nav-tweaks-position");
        document.documentElement.removeAttribute("data-cudloun-nav-tweaks-compact");
        document.documentElement.removeAttribute("data-cudloun-nav-tweaks-visible");
        document.documentElement.removeAttribute("data-cudloun-nav-tweaks-route");
      }

      function renderCheckbox(ctx, name, labelText) {
        const label = document.createElement("label");
        label.className = "cudloun-setting-row";
        const text = document.createElement("span");
        text.className = "cudloun-setting-text";
        text.textContent = labelText;
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = settings[name] !== false;
        checkbox.addEventListener("change", () => {
          settings[name] = checkbox.checked;
          saveSettings();
          applySettings();
          renderBar(ctx);
        });
        label.appendChild(text);
        label.appendChild(checkbox);
        return label;
      }

      function renderBar(ctx) {
        renderScheduled = false;
        let bar = document.getElementById(BAR_ID);
        if (!settings.enabled) {
          bar?.remove();
          return;
        }
        if (!bar) {
          bar = document.createElement("nav");
          bar.id = BAR_ID;
          bar.setAttribute("aria-label", "Cudloun quick navigation");
          document.body.appendChild(bar);
        }

        const actions = buildActions(ctx).filter((action) => action.enabled);
        bar.innerHTML = "";
        actions.forEach((action) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "cudloun-nav-tweaks-action";
          button.dataset.action = action.id;
          button.title = action.title;
          button.setAttribute("aria-label", action.title);
          button.innerHTML = `<span class="cudloun-nav-tweaks-icon">${action.icon}</span><span class="cudloun-nav-tweaks-label">${action.label}</span>`;
          button.addEventListener("click", (event) => {
            event.preventDefault();
            action.run();
          });
          bar.appendChild(button);
        });
        applySettings();
      }

      function scheduleRender(ctx) {
        if (renderScheduled) return;
        renderScheduled = true;
        window.setTimeout(() => renderBar(ctx), 120);
      }

      function buildActions(ctx) {
        const route = root.babeguts?.route?.() || currentRoute();
        const board = route.type === "board";
        return [
          {
            id: "home",
            label: "Domu",
            title: "Domu",
            icon: "⌂",
            enabled: settings.showHome,
            run: () => nativeBottom("Domů") || navigate("/"),
          },
          {
            id: "messages",
            label: "Vzk",
            title: "Vzkaznik",
            icon: "✉",
            enabled: settings.showMessages,
            run: () => nativeBottom("Vzkazník") || navigate("/messages"),
          },
          {
            id: "favorites",
            label: "Obl",
            title: "Oblibene",
            icon: "★",
            enabled: settings.showFavorites,
            run: () => nativeBottom("Oblíbené") || navigate("/favorites"),
          },
          {
            id: "search",
            label: "Search",
            title: board ? "Hledat v klubu" : "Search",
            icon: "⌕",
            enabled: settings.showSearch,
            run: () => clickFirst([
              'button[aria-label="Hledat v klubu"]',
              'button[aria-label*="Hledat"]',
              'input[type="text"]',
            ]) || focusGlobalSearch(ctx),
          },
          {
            id: "contribute",
            label: "Post",
            title: "Prispět",
            icon: "+",
            enabled: board && settings.showContribute,
            run: () => clickTextButton(/^PŘISPĚT\\*?$/i) || clickTextButton(/^PRISPET\\*?$/i),
          },
          {
            id: "top",
            label: "Top",
            title: "Top",
            icon: "↑",
            enabled: settings.showTopBottom,
            run: () => window.scrollTo({ top: 0, behavior: "smooth" }),
          },
          {
            id: "bottom",
            label: "Bot",
            title: "Bottom",
            icon: "↓",
            enabled: settings.showTopBottom,
            run: () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" }),
          },
        ];
      }

      function nativeBottom(label) {
        const normalized = normalize(label);
        const button = Array.from(document.querySelectorAll(".MuiBottomNavigationAction-root, button"))
          .filter(isVisible)
          .find((node) => normalize(node.textContent || "") === normalized);
        if (!button) return false;
        button.click();
        return true;
      }

      function clickFirst(selectors) {
        for (const selector of selectors) {
          const node = Array.from(document.querySelectorAll(selector)).find(isVisible);
          if (!node) continue;
          if (node.matches("input, textarea")) node.focus();
          else node.click();
          return true;
        }
        return false;
      }

      function clickTextButton(pattern) {
        const button = Array.from(document.querySelectorAll("button"))
          .filter(isVisible)
          .find((node) => pattern.test(normalize(node.textContent || "")));
        if (!button) return false;
        button.click();
        return true;
      }

      function focusGlobalSearch() {
        const input = Array.from(document.querySelectorAll('input[type="text"], input[type="search"]')).find(isVisible);
        if (!input) return false;
        input.focus();
        return true;
      }

      function navigate(path) {
        if (root.navigate) root.navigate(path);
        else window.location.assign(path);
        return true;
      }

      function currentRoute() {
        const path = window.location.pathname;
        const boardMatch = path.match(/^\/boards\/([^/?#]+)/);
        return {
          href: window.location.href,
          path,
          search: window.location.search,
          hash: window.location.hash,
          type: boardMatch ? "board" : path === "/favorites" ? "favorites" : path === "/" ? "home" : "unknown",
          boardId: boardMatch ? decodeURIComponent(boardMatch[1]) : "",
        };
      }

      function applySettings() {
        const mobile = window.matchMedia?.("(max-width: 760px), (pointer: coarse)")?.matches;
        const visible = settings.enabled && ((mobile && settings.showMobile) || (!mobile && settings.showDesktop));
        const compact = settings.compactLandscape && window.innerWidth > window.innerHeight;
        const route = root.babeguts?.route?.() || currentRoute();
        document.documentElement.setAttribute("data-cudloun-nav-tweaks-route", route.type || "unknown");
        document.documentElement.setAttribute("data-cudloun-nav-tweaks-position", settings.position === "bottom" ? "bottom" : "top");
        document.documentElement.setAttribute("data-cudloun-nav-tweaks-compact", compact ? "true" : "false");
        document.documentElement.setAttribute("data-cudloun-nav-tweaks-visible", visible ? "true" : "false");
      }

      function flash(node) {
        node.animate?.([
          { transform: "translateY(0)", boxShadow: "0 10px 26px rgba(18,25,38,.18)" },
          { transform: "translateY(-2px)", boxShadow: "0 12px 32px rgba(14,116,144,.32)" },
          { transform: "translateY(0)", boxShadow: "0 10px 26px rgba(18,25,38,.18)" },
        ], { duration: 360, easing: "ease-out" });
      }

      function isVisible(node) {
        if (root.babeguts?.isVisible) return root.babeguts.isVisible(node);
        if (!(node instanceof Element)) return false;
        const rect = node.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return false;
        const style = window.getComputedStyle(node);
        return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
      }

      function normalize(value) {
        return String(value || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, " ")
          .trim()
          .toLowerCase();
      }

      function loadSettings() {
        try {
          return { ...defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
        } catch (error) {
          return { ...defaults };
        }
      }

      function saveSettings() {
        try {
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (error) {
          root.log?.warn?.("nav-tweaks", "settings could not be saved", error);
        }
      }

      function installStyles() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
          #${BAR_ID} {
            position: fixed;
            z-index: 2147483598;
            left: 50%;
            display: flex;
            align-items: center;
            gap: 4px;
            max-width: calc(100vw - 16px);
            box-sizing: border-box;
            padding: 4px;
            border: 1px solid rgba(79, 102, 134, .18);
            border-radius: 8px;
            background: rgba(255, 255, 255, .96);
            color: #182230;
            box-shadow: 0 10px 26px rgba(18, 25, 38, .18);
            transform: translateX(-50%);
            overflow-x: auto;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
          }
          #${BAR_ID}::-webkit-scrollbar {
            display: none;
          }
          html[data-cudloun-nav-tweaks-visible="false"] #${BAR_ID} {
            display: none;
          }
          html[data-cudloun-nav-tweaks-position="top"] #${BAR_ID} {
            top: max(58px, env(safe-area-inset-top, 0px) + 58px);
          }
          html[data-cudloun-nav-tweaks-position="top"][data-cudloun-nav-tweaks-route="board"] #${BAR_ID} {
            top: max(112px, env(safe-area-inset-top, 0px) + 112px);
          }
          html[data-cudloun-nav-tweaks-position="bottom"] #${BAR_ID} {
            bottom: max(62px, env(safe-area-inset-bottom, 0px) + 62px);
          }
          #${BAR_ID} .cudloun-nav-tweaks-action {
            appearance: none;
            min-width: 42px;
            height: 32px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 3px;
            border: 1px solid rgba(79, 102, 134, .18);
            border-radius: 6px;
            background: #f8fafc;
            color: #243041;
            cursor: pointer;
            font: 700 11px/1 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            letter-spacing: 0;
            white-space: nowrap;
          }
          #${BAR_ID} .cudloun-nav-tweaks-action:hover {
            background: #eef2f7;
          }
          #${BAR_ID} .cudloun-nav-tweaks-icon {
            font-size: 13px;
            line-height: 1;
          }
          #${BAR_ID} .cudloun-nav-tweaks-label {
            overflow: hidden;
            text-overflow: ellipsis;
          }
          html[data-cudloun-nav-tweaks-compact="true"] #${BAR_ID} {
            padding: 3px;
            gap: 3px;
          }
          html[data-cudloun-nav-tweaks-compact="true"] #${BAR_ID} .cudloun-nav-tweaks-action {
            min-width: 34px;
            width: 34px;
            height: 28px;
          }
          html[data-cudloun-nav-tweaks-compact="true"] #${BAR_ID} .cudloun-nav-tweaks-label {
            display: none;
          }
          @media (min-width: 761px) and (pointer: fine) {
            html[data-cudloun-nav-tweaks-position="top"] #${BAR_ID} {
              top: 72px;
            }
            html[data-cudloun-nav-tweaks-position="bottom"] #${BAR_ID} {
              bottom: 18px;
            }
          }
        `;
        document.head.appendChild(style);
      }
    })();

  });

  embeddedText.set("modules/containers.js", "// Cudloun module for live tweak containers.\n(function () {\n  \"use strict\";\n\n  const root = window.Cudloun;\n  const MODULE_ID = \"containers\";\n  const loadedContainers = new Map();\n  const runningContainers = new Set();\n  let catalog = null;\n  let loadingCatalog = null;\n\n  root.registerModule({\n    id: MODULE_ID,\n    name: \"Containers\",\n    description: \"Small live demos that can be run from Cudloun or shared as console loaders.\",\n    version: \"0.1.1\",\n    defaultEnabled: true,\n    start(ctx) {\n      loadCatalog(ctx).then(() => ctx.hub.render()).catch((error) => ctx.log.error(\"catalog load failed\", error));\n    },\n    renderSettings(ctx) {\n      const wrap = document.createElement(\"div\");\n      wrap.className = \"cudloun-container-list\";\n\n      if (!catalog) {\n        const loading = document.createElement(\"p\");\n        loading.textContent = \"Loading container catalog...\";\n        wrap.appendChild(loading);\n        loadCatalog(ctx).then(() => ctx.hub.render()).catch((error) => ctx.log.error(\"catalog load failed\", error));\n        return wrap;\n      }\n\n      catalog.containers.forEach((container) => {\n        wrap.appendChild(renderContainerCard(container, ctx));\n      });\n\n      return wrap;\n    },\n    renderHelp() {\n      return [\n        \"Containers are tiny standalone demos. They can run inside Cudloun, or as one console paste for someone who does not have Cudloun installed.\",\n        \"This is meant for trying UI ideas on live Babeta pages before turning them into real modules or upstream changes.\",\n      ];\n    },\n  });\n\n  async function loadCatalog(ctx) {\n    if (catalog) return catalog;\n    if (loadingCatalog) return loadingCatalog;\n\n    loadingCatalog = root.util.requestText(`${root.repoUrl}containers.json?v=${root.cacheBust}`)\n      .then((text) => {\n        catalog = JSON.parse(text);\n        validateCatalog(catalog);\n        ctx.log.info(\"catalog loaded\", `${catalog.containers.length} container(s)`);\n        return catalog;\n      })\n      .finally(() => {\n        loadingCatalog = null;\n      });\n\n    return loadingCatalog;\n  }\n\n  function renderContainerCard(container, ctx) {\n    const card = document.createElement(\"section\");\n    card.className = \"cudloun-container-card\";\n\n    const title = document.createElement(\"h3\");\n    title.textContent = container.name;\n\n    const description = document.createElement(\"p\");\n    description.textContent = container.description || \"\";\n\n    const route = document.createElement(\"p\");\n    route.textContent = `Target: ${container.match.join(\", \")}`;\n\n    const actions = document.createElement(\"div\");\n    actions.className = \"cudloun-container-actions\";\n\n    const run = button(runningContainers.has(container.id) ? \"Re-run\" : \"Run\");\n    run.addEventListener(\"click\", () => {\n      runContainer(container, ctx).then(() => ctx.hub.render()).catch((error) => ctx.log.error(\"run failed\", container.id, error));\n    });\n\n    const stop = button(\"Stop\", \"secondary\");\n    stop.disabled = !runningContainers.has(container.id);\n    stop.addEventListener(\"click\", () => {\n      stopContainer(container, ctx);\n      ctx.hub.render();\n    });\n\n    const copy = button(\"Copy console loader\", \"secondary\");\n    copy.addEventListener(\"click\", () => {\n      copyConsoleLoader(container, ctx, card);\n    });\n\n    actions.appendChild(run);\n    actions.appendChild(stop);\n    actions.appendChild(copy);\n\n    card.appendChild(title);\n    card.appendChild(description);\n    card.appendChild(route);\n    card.appendChild(actions);\n\n    if (root.feedback && typeof root.feedback.renderThread === \"function\") {\n      card.appendChild(root.feedback.renderThread({\n        kind: \"container\",\n        id: container.id,\n        name: container.name,\n      }));\n    }\n\n    return card;\n  }\n\n  async function runContainer(container, ctx) {\n    const api = await loadContainer(container, ctx);\n    if (!api || typeof api.run !== \"function\") {\n      throw new Error(`Container ${container.id} has no run()`);\n    }\n\n    api.run();\n    runningContainers.add(container.id);\n    ctx.log.info(\"ran container\", container.id);\n  }\n\n  function stopContainer(container, ctx) {\n    const api = loadedContainers.get(container.id);\n    if (api && typeof api.stop === \"function\") {\n      api.stop();\n    }\n\n    runningContainers.delete(container.id);\n    ctx.log.info(\"stopped container\", container.id);\n  }\n\n  async function loadContainer(container, ctx) {\n    if (loadedContainers.has(container.id)) {\n      return loadedContainers.get(container.id);\n    }\n\n    validateContainerEntry(container);\n    ensureRegistry();\n    const url = `${root.repoUrl}${container.file}?v=${root.cacheBust}`;\n    const code = await root.util.requestText(url);\n    await verifySha256(code, container.sha256);\n    root.util.execute(code, url);\n\n    const api = window.CudlounContainerRegistry.get(container.id);\n    if (!api) {\n      throw new Error(`Container ${container.id} did not register`);\n    }\n\n    loadedContainers.set(container.id, api);\n    ctx.log.info(\"loaded container\", container.id);\n    return api;\n  }\n\n  function ensureRegistry() {\n    if (window.CudlounContainerRegistry) return;\n\n    const registry = new Map();\n    window.CudlounContainerRegistry = {\n      register(container) {\n        if (!container || !container.id) return;\n        registry.set(container.id, container);\n      },\n      get(id) {\n        return registry.get(id) || null;\n      },\n      list() {\n        return Array.from(registry.values());\n      },\n    };\n  }\n\n  function consoleLoader(container) {\n    validateContainerEntry(container);\n    const url = `${root.repoUrl}${container.file}?v=${Date.now()}`;\n    const apiName = containerGlobalName(container);\n    return [\n      \"(async()=>{\",\n      `const url=${JSON.stringify(url)};`,\n      `const expected=${JSON.stringify(normalizeSha256(container.sha256))};`,\n      \"const code=await fetch(url).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.text();});\",\n      \"const bytes=new TextEncoder().encode(code);\",\n      \"const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');\",\n      \"if(hash!==expected)throw new Error('Cudloun container hash mismatch');\",\n      \"new Function(code)();\",\n      `const api=window[${JSON.stringify(apiName)}];`,\n      \"if(api&&typeof api.run==='function')api.run();\",\n      \"})();\",\n    ].join(\"\");\n  }\n\n  function containerGlobalName(container) {\n    if (container.global) return container.global;\n\n    return `Cudloun${container.id\n      .split(/[^a-z0-9]+/i)\n      .filter(Boolean)\n      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))\n      .join(\"\")}`;\n  }\n\n  function copyConsoleLoader(container, ctx, card) {\n    const loader = consoleLoader(container);\n    if (navigator.clipboard && navigator.clipboard.writeText) {\n      navigator.clipboard.writeText(loader).then(() => {\n        ctx.log.info(\"copied console loader\", container.id);\n      }).catch((error) => ctx.log.warn(\"clipboard failed\", error));\n    }\n\n    card.querySelector(\".cudloun-code-box\")?.remove();\n    const code = document.createElement(\"div\");\n    code.className = \"cudloun-code-box\";\n    code.textContent = loader;\n    card.appendChild(code);\n  }\n\n  function button(text, variant) {\n    const element = document.createElement(\"button\");\n    element.type = \"button\";\n    element.className = variant === \"secondary\" ? \"cudloun-button cudloun-button-secondary\" : \"cudloun-button\";\n    element.textContent = text;\n    return element;\n  }\n\n  function validateCatalog(nextCatalog) {\n    if (!nextCatalog || !Array.isArray(nextCatalog.containers)) {\n      throw new Error(\"Invalid container catalog\");\n    }\n\n    nextCatalog.containers.forEach(validateContainerEntry);\n  }\n\n  function validateContainerEntry(container) {\n    if (!container || !container.id || !container.file || !container.sha256) {\n      throw new Error(\"Invalid container entry\");\n    }\n\n    if (!/^[a-z0-9][a-z0-9-]*$/.test(container.id)) {\n      throw new Error(`Invalid container id: ${container.id}`);\n    }\n\n    if (!/^containers\\/[a-z0-9][a-z0-9-]*\\.container\\.js$/.test(container.file)) {\n      throw new Error(`Refusing non-local container path: ${container.file}`);\n    }\n\n    normalizeSha256(container.sha256);\n  }\n\n  function normalizeSha256(value) {\n    const hash = String(value || \"\").toLowerCase().replace(/^sha256-/, \"\");\n    if (!/^[a-f0-9]{64}$/.test(hash)) {\n      throw new Error(\"Invalid container sha256\");\n    }\n    return hash;\n  }\n\n  async function verifySha256(text, expected) {\n    if (!crypto || !crypto.subtle || typeof TextEncoder === \"undefined\") {\n      throw new Error(\"SHA-256 verification is not available in this browser\");\n    }\n\n    const bytes = new TextEncoder().encode(text);\n    const digest = await crypto.subtle.digest(\"SHA-256\", bytes);\n    const actual = Array.from(new Uint8Array(digest))\n      .map((byte) => byte.toString(16).padStart(2, \"0\"))\n      .join(\"\");\n    const wanted = normalizeSha256(expected);\n\n    if (actual !== wanted) {\n      throw new Error(`Container hash mismatch for ${wanted.slice(0, 12)}`);\n    }\n  }\n})();\n");
  embeddedScripts.set("modules/containers.js", function () {
    // Cudloun module for live tweak containers.
    (function () {
      "use strict";

      const root = window.Cudloun;
      const MODULE_ID = "containers";
      const loadedContainers = new Map();
      const runningContainers = new Set();
      let catalog = null;
      let loadingCatalog = null;

      root.registerModule({
        id: MODULE_ID,
        name: "Containers",
        description: "Small live demos that can be run from Cudloun or shared as console loaders.",
        version: "0.1.1",
        defaultEnabled: true,
        start(ctx) {
          loadCatalog(ctx).then(() => ctx.hub.render()).catch((error) => ctx.log.error("catalog load failed", error));
        },
        renderSettings(ctx) {
          const wrap = document.createElement("div");
          wrap.className = "cudloun-container-list";

          if (!catalog) {
            const loading = document.createElement("p");
            loading.textContent = "Loading container catalog...";
            wrap.appendChild(loading);
            loadCatalog(ctx).then(() => ctx.hub.render()).catch((error) => ctx.log.error("catalog load failed", error));
            return wrap;
          }

          catalog.containers.forEach((container) => {
            wrap.appendChild(renderContainerCard(container, ctx));
          });

          return wrap;
        },
        renderHelp() {
          return [
            "Containers are tiny standalone demos. They can run inside Cudloun, or as one console paste for someone who does not have Cudloun installed.",
            "This is meant for trying UI ideas on live Babeta pages before turning them into real modules or upstream changes.",
          ];
        },
      });

      async function loadCatalog(ctx) {
        if (catalog) return catalog;
        if (loadingCatalog) return loadingCatalog;

        loadingCatalog = root.util.requestText(`${root.repoUrl}containers.json?v=${root.cacheBust}`)
          .then((text) => {
            catalog = JSON.parse(text);
            validateCatalog(catalog);
            ctx.log.info("catalog loaded", `${catalog.containers.length} container(s)`);
            return catalog;
          })
          .finally(() => {
            loadingCatalog = null;
          });

        return loadingCatalog;
      }

      function renderContainerCard(container, ctx) {
        const card = document.createElement("section");
        card.className = "cudloun-container-card";

        const title = document.createElement("h3");
        title.textContent = container.name;

        const description = document.createElement("p");
        description.textContent = container.description || "";

        const route = document.createElement("p");
        route.textContent = `Target: ${container.match.join(", ")}`;

        const actions = document.createElement("div");
        actions.className = "cudloun-container-actions";

        const run = button(runningContainers.has(container.id) ? "Re-run" : "Run");
        run.addEventListener("click", () => {
          runContainer(container, ctx).then(() => ctx.hub.render()).catch((error) => ctx.log.error("run failed", container.id, error));
        });

        const stop = button("Stop", "secondary");
        stop.disabled = !runningContainers.has(container.id);
        stop.addEventListener("click", () => {
          stopContainer(container, ctx);
          ctx.hub.render();
        });

        const copy = button("Copy console loader", "secondary");
        copy.addEventListener("click", () => {
          copyConsoleLoader(container, ctx, card);
        });

        actions.appendChild(run);
        actions.appendChild(stop);
        actions.appendChild(copy);

        card.appendChild(title);
        card.appendChild(description);
        card.appendChild(route);
        card.appendChild(actions);

        if (root.feedback && typeof root.feedback.renderThread === "function") {
          card.appendChild(root.feedback.renderThread({
            kind: "container",
            id: container.id,
            name: container.name,
          }));
        }

        return card;
      }

      async function runContainer(container, ctx) {
        const api = await loadContainer(container, ctx);
        if (!api || typeof api.run !== "function") {
          throw new Error(`Container ${container.id} has no run()`);
        }

        api.run();
        runningContainers.add(container.id);
        ctx.log.info("ran container", container.id);
      }

      function stopContainer(container, ctx) {
        const api = loadedContainers.get(container.id);
        if (api && typeof api.stop === "function") {
          api.stop();
        }

        runningContainers.delete(container.id);
        ctx.log.info("stopped container", container.id);
      }

      async function loadContainer(container, ctx) {
        if (loadedContainers.has(container.id)) {
          return loadedContainers.get(container.id);
        }

        validateContainerEntry(container);
        ensureRegistry();
        const url = `${root.repoUrl}${container.file}?v=${root.cacheBust}`;
        const code = await root.util.requestText(url);
        await verifySha256(code, container.sha256);
        root.util.execute(code, url);

        const api = window.CudlounContainerRegistry.get(container.id);
        if (!api) {
          throw new Error(`Container ${container.id} did not register`);
        }

        loadedContainers.set(container.id, api);
        ctx.log.info("loaded container", container.id);
        return api;
      }

      function ensureRegistry() {
        if (window.CudlounContainerRegistry) return;

        const registry = new Map();
        window.CudlounContainerRegistry = {
          register(container) {
            if (!container || !container.id) return;
            registry.set(container.id, container);
          },
          get(id) {
            return registry.get(id) || null;
          },
          list() {
            return Array.from(registry.values());
          },
        };
      }

      function consoleLoader(container) {
        validateContainerEntry(container);
        const url = `${root.repoUrl}${container.file}?v=${Date.now()}`;
        const apiName = containerGlobalName(container);
        return [
          "(async()=>{",
          `const url=${JSON.stringify(url)};`,
          `const expected=${JSON.stringify(normalizeSha256(container.sha256))};`,
          "const code=await fetch(url).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.text();});",
          "const bytes=new TextEncoder().encode(code);",
          "const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');",
          "if(hash!==expected)throw new Error('Cudloun container hash mismatch');",
          "new Function(code)();",
          `const api=window[${JSON.stringify(apiName)}];`,
          "if(api&&typeof api.run==='function')api.run();",
          "})();",
        ].join("");
      }

      function containerGlobalName(container) {
        if (container.global) return container.global;

        return `Cudloun${container.id
          .split(/[^a-z0-9]+/i)
          .filter(Boolean)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join("")}`;
      }

      function copyConsoleLoader(container, ctx, card) {
        const loader = consoleLoader(container);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(loader).then(() => {
            ctx.log.info("copied console loader", container.id);
          }).catch((error) => ctx.log.warn("clipboard failed", error));
        }

        card.querySelector(".cudloun-code-box")?.remove();
        const code = document.createElement("div");
        code.className = "cudloun-code-box";
        code.textContent = loader;
        card.appendChild(code);
      }

      function button(text, variant) {
        const element = document.createElement("button");
        element.type = "button";
        element.className = variant === "secondary" ? "cudloun-button cudloun-button-secondary" : "cudloun-button";
        element.textContent = text;
        return element;
      }

      function validateCatalog(nextCatalog) {
        if (!nextCatalog || !Array.isArray(nextCatalog.containers)) {
          throw new Error("Invalid container catalog");
        }

        nextCatalog.containers.forEach(validateContainerEntry);
      }

      function validateContainerEntry(container) {
        if (!container || !container.id || !container.file || !container.sha256) {
          throw new Error("Invalid container entry");
        }

        if (!/^[a-z0-9][a-z0-9-]*$/.test(container.id)) {
          throw new Error(`Invalid container id: ${container.id}`);
        }

        if (!/^containers\/[a-z0-9][a-z0-9-]*\.container\.js$/.test(container.file)) {
          throw new Error(`Refusing non-local container path: ${container.file}`);
        }

        normalizeSha256(container.sha256);
      }

      function normalizeSha256(value) {
        const hash = String(value || "").toLowerCase().replace(/^sha256-/, "");
        if (!/^[a-f0-9]{64}$/.test(hash)) {
          throw new Error("Invalid container sha256");
        }
        return hash;
      }

      async function verifySha256(text, expected) {
        if (!crypto || !crypto.subtle || typeof TextEncoder === "undefined") {
          throw new Error("SHA-256 verification is not available in this browser");
        }

        const bytes = new TextEncoder().encode(text);
        const digest = await crypto.subtle.digest("SHA-256", bytes);
        const actual = Array.from(new Uint8Array(digest))
          .map((byte) => byte.toString(16).padStart(2, "0"))
          .join("");
        const wanted = normalizeSha256(expected);

        if (actual !== wanted) {
          throw new Error(`Container hash mismatch for ${wanted.slice(0, 12)}`);
        }
      }
    })();

  });

  embeddedText.set("containers/favorite-pill-colors.container.js", "// Standalone Cudloun container: color favorite unread counter pills.\n(function () {\n  \"use strict\";\n\n  const ID = \"favorite-pill-colors\";\n  const STYLE_ID = \"cudloun-container-favorite-pill-colors-style\";\n  const MARK = \"data-cudloun-favorite-pill-color\";\n  let observer = null;\n\n  const api = {\n    id: ID,\n    name: \"Favorite Pill Colors\",\n    run,\n    stop,\n  };\n\n  window.CudlounFavoritePillColors = api;\n\n  if (window.CudlounContainerRegistry && typeof window.CudlounContainerRegistry.register === \"function\") {\n    window.CudlounContainerRegistry.register(api);\n  }\n\n  if (!window.CudlounContainerRegistry) {\n    run();\n  }\n\n  return api;\n\n  function run() {\n    installStyles();\n    scan();\n\n    if (!observer) {\n      observer = new MutationObserver(() => scan());\n      observer.observe(document.body, { childList: true, subtree: true, characterData: true });\n    }\n\n    console.log(\"[cudloun-container] favorite pill colors active\");\n    return api;\n  }\n\n  function stop() {\n    if (observer) {\n      observer.disconnect();\n      observer = null;\n    }\n\n    document.querySelectorAll(`[${MARK}]`).forEach((chip) => {\n      chip.removeAttribute(MARK);\n      chip.removeAttribute(\"title\");\n    });\n\n    document.getElementById(STYLE_ID)?.remove();\n    console.log(\"[cudloun-container] favorite pill colors stopped\");\n  }\n\n  function installStyles() {\n    if (document.getElementById(STYLE_ID)) return;\n\n    const style = document.createElement(\"style\");\n    style.id = STYLE_ID;\n    style.textContent = `\n      [${MARK}=\"low\"] {\n        border-color: #2e7d32 !important;\n        background: #dff5e3 !important;\n        color: #17451e !important;\n        font-weight: 700 !important;\n      }\n\n      [${MARK}=\"mid\"] {\n        border-color: #b26a00 !important;\n        background: #fff1cc !important;\n        color: #5f3700 !important;\n        font-weight: 700 !important;\n      }\n\n      [${MARK}=\"hot\"] {\n        border-color: #c62828 !important;\n        background: #ffe0e0 !important;\n        color: #7f1111 !important;\n        font-weight: 800 !important;\n      }\n\n      [${MARK}=\"wild\"] {\n        border-color: #6a1b9a !important;\n        background: #efe1ff !important;\n        color: #3d0b5f !important;\n        font-weight: 900 !important;\n        box-shadow: 0 0 0 2px rgba(106, 27, 154, 0.12) !important;\n      }\n    `;\n    document.head.appendChild(style);\n  }\n\n  function scan() {\n    document.querySelectorAll(\"span\").forEach((label) => {\n      const text = label.textContent.trim();\n      const match = text.match(/^(\\d+)\\s+nov(?:ý|é|ých)$/i);\n      if (!match) return;\n\n      const chip = label.closest(\".MuiChip-root\") || label.parentElement;\n      if (!chip) return;\n\n      const count = Number(match[1]);\n      chip.setAttribute(MARK, bucket(count));\n      chip.title = `Cudloun demo: ${count} unread`;\n    });\n  }\n\n  function bucket(count) {\n    if (count >= 100) return \"wild\";\n    if (count >= 20) return \"hot\";\n    if (count >= 5) return \"mid\";\n    return \"low\";\n  }\n})();\n");
  embeddedScripts.set("containers/favorite-pill-colors.container.js", function () {
    // Standalone Cudloun container: color favorite unread counter pills.
    (function () {
      "use strict";

      const ID = "favorite-pill-colors";
      const STYLE_ID = "cudloun-container-favorite-pill-colors-style";
      const MARK = "data-cudloun-favorite-pill-color";
      let observer = null;

      const api = {
        id: ID,
        name: "Favorite Pill Colors",
        run,
        stop,
      };

      window.CudlounFavoritePillColors = api;

      if (window.CudlounContainerRegistry && typeof window.CudlounContainerRegistry.register === "function") {
        window.CudlounContainerRegistry.register(api);
      }

      if (!window.CudlounContainerRegistry) {
        run();
      }

      return api;

      function run() {
        installStyles();
        scan();

        if (!observer) {
          observer = new MutationObserver(() => scan());
          observer.observe(document.body, { childList: true, subtree: true, characterData: true });
        }

        console.log("[cudloun-container] favorite pill colors active");
        return api;
      }

      function stop() {
        if (observer) {
          observer.disconnect();
          observer = null;
        }

        document.querySelectorAll(`[${MARK}]`).forEach((chip) => {
          chip.removeAttribute(MARK);
          chip.removeAttribute("title");
        });

        document.getElementById(STYLE_ID)?.remove();
        console.log("[cudloun-container] favorite pill colors stopped");
      }

      function installStyles() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
          [${MARK}="low"] {
            border-color: #2e7d32 !important;
            background: #dff5e3 !important;
            color: #17451e !important;
            font-weight: 700 !important;
          }

          [${MARK}="mid"] {
            border-color: #b26a00 !important;
            background: #fff1cc !important;
            color: #5f3700 !important;
            font-weight: 700 !important;
          }

          [${MARK}="hot"] {
            border-color: #c62828 !important;
            background: #ffe0e0 !important;
            color: #7f1111 !important;
            font-weight: 800 !important;
          }

          [${MARK}="wild"] {
            border-color: #6a1b9a !important;
            background: #efe1ff !important;
            color: #3d0b5f !important;
            font-weight: 900 !important;
            box-shadow: 0 0 0 2px rgba(106, 27, 154, 0.12) !important;
          }
        `;
        document.head.appendChild(style);
      }

      function scan() {
        document.querySelectorAll("span").forEach((label) => {
          const text = label.textContent.trim();
          const match = text.match(/^(\d+)\s+nov(?:ý|é|ých)$/i);
          if (!match) return;

          const chip = label.closest(".MuiChip-root") || label.parentElement;
          if (!chip) return;

          const count = Number(match[1]);
          chip.setAttribute(MARK, bucket(count));
          chip.title = `Cudloun demo: ${count} unread`;
        });
      }

      function bucket(count) {
        if (count >= 100) return "wild";
        if (count >= 20) return "hot";
        if (count >= 5) return "mid";
        return "low";
      }
    })();

  });

  embeddedText.set("containers/noooovejsi.container.js", "// Standalone Cudloun container: playful labels for Babeta board pagination arrows.\n(function () {\n  \"use strict\";\n\n  const ID = \"noooovejsi\";\n  const STYLE_ID = \"cudloun-container-noooovejsi-style\";\n  const PAGER_MARK = \"data-cudloun-noooovejsi-pagination\";\n  const ARROW_MARK = \"data-cudloun-noooovejsi-arrow\";\n  const LABEL_MARK = \"data-cudloun-noooovejsi-label\";\n  const TEXT_MARK = \"data-cudloun-noooovejsi-text\";\n  const ORIGINAL_TITLE = \"data-cudloun-noooovejsi-original-title\";\n  const ORIGINAL_TEXT = \"data-cudloun-noooovejsi-original-text\";\n  let observer = null;\n  let scheduled = false;\n\n  const api = {\n    id: ID,\n    name: \"Noooovejsi\",\n    run,\n    stop,\n  };\n\n  window.CudlounNoooovejsi = api;\n\n  if (window.CudlounContainerRegistry && typeof window.CudlounContainerRegistry.register === \"function\") {\n    window.CudlounContainerRegistry.register(api);\n  }\n\n  if (!window.CudlounContainerRegistry) {\n    run();\n  }\n\n  return api;\n\n  function run() {\n    installStyles();\n    scan();\n\n    if (!observer) {\n      observer = new MutationObserver(scheduleScan);\n      observer.observe(document.body, { childList: true, subtree: true });\n    }\n\n    console.log(\"[cudloun-container] noooovejsi active\");\n    return api;\n  }\n\n  function stop() {\n    if (observer) {\n      observer.disconnect();\n      observer = null;\n    }\n\n    scheduled = false;\n\n    document.querySelectorAll(`[${LABEL_MARK}]`).forEach((label) => label.remove());\n    document.querySelectorAll(`[${TEXT_MARK}]`).forEach((link) => restoreTextLink(link));\n    document.querySelectorAll(`[${ARROW_MARK}]`).forEach((link) => {\n      link.removeAttribute(ARROW_MARK);\n\n      if (link.hasAttribute(ORIGINAL_TITLE)) {\n        const title = link.getAttribute(ORIGINAL_TITLE);\n        if (title) {\n          link.title = title;\n        } else {\n          link.removeAttribute(\"title\");\n        }\n\n        link.removeAttribute(ORIGINAL_TITLE);\n      }\n    });\n    document.querySelectorAll(`[${PAGER_MARK}]`).forEach((pager) => pager.removeAttribute(PAGER_MARK));\n    document.getElementById(STYLE_ID)?.remove();\n    console.log(\"[cudloun-container] noooovejsi stopped\");\n  }\n\n  function installStyles() {\n    if (document.getElementById(STYLE_ID)) return;\n\n    const style = document.createElement(\"style\");\n    style.id = STYLE_ID;\n    style.textContent = `\n      [${PAGER_MARK}] {\n        align-items: center !important;\n      }\n\n      [${ARROW_MARK}] {\n        width: auto !important;\n        min-width: 30px !important;\n        max-width: none !important;\n        padding-left: 0.55em !important;\n        padding-right: 0.55em !important;\n        gap: 0.3em !important;\n        white-space: nowrap !important;\n      }\n\n      [${ARROW_MARK}=\"newer\"] {\n        flex-direction: row !important;\n      }\n\n      [${ARROW_MARK}=\"older\"] {\n        flex-direction: row !important;\n      }\n\n      [${LABEL_MARK}] {\n        display: inline-flex !important;\n        align-items: center !important;\n        max-width: 11em !important;\n        overflow: hidden !important;\n        text-overflow: ellipsis !important;\n        color: inherit !important;\n        font-size: 11px !important;\n        font-weight: 800 !important;\n        line-height: 1 !important;\n        letter-spacing: 0 !important;\n        text-transform: uppercase !important;\n        pointer-events: none !important;\n      }\n\n      [${TEXT_MARK}] {\n        font-weight: 900 !important;\n        letter-spacing: 0 !important;\n        white-space: nowrap !important;\n      }\n\n      @media (max-width: 520px) {\n        [${ARROW_MARK}] {\n          padding-left: 0.4em !important;\n          padding-right: 0.4em !important;\n        }\n\n        [${LABEL_MARK}] {\n          max-width: 7.5em !important;\n          font-size: 10px !important;\n        }\n      }\n    `;\n    document.head.appendChild(style);\n  }\n\n  function scheduleScan() {\n    if (scheduled) return;\n    scheduled = true;\n    window.requestAnimationFrame(() => {\n      scheduled = false;\n      scan();\n    });\n  }\n\n  function scan() {\n    if (!isBoardRoute()) {\n      cleanupMissingRoute();\n      return;\n    }\n\n    findPaginationRoots().forEach(enhancePagination);\n  }\n\n  function cleanupMissingRoute() {\n    document.querySelectorAll(`[${LABEL_MARK}]`).forEach((label) => label.remove());\n    document.querySelectorAll(`[${TEXT_MARK}]`).forEach((link) => restoreTextLink(link));\n    document.querySelectorAll(`[${ARROW_MARK}]`).forEach((link) => link.removeAttribute(ARROW_MARK));\n    document.querySelectorAll(`[${PAGER_MARK}]`).forEach((pager) => pager.removeAttribute(PAGER_MARK));\n  }\n\n  function isBoardRoute() {\n    return /^\\/boards\\/[^/]+/.test(window.location.pathname);\n  }\n\n  function findPaginationRoots() {\n    const roots = new Set();\n    const boardLinks = Array.from(document.querySelectorAll(\"a[href]\")).filter(isSameBoardPagerLink);\n\n    boardLinks.forEach((link) => {\n      const root = findPaginationRoot(link);\n      if (root) roots.add(root);\n    });\n\n    return Array.from(roots);\n  }\n\n  function findPaginationRoot(link) {\n    let node = link.parentElement;\n\n    for (let depth = 0; node && depth < 8; depth += 1, node = node.parentElement) {\n      const sameBoardLinks = Array.from(node.querySelectorAll(\"a[href]\")).filter(isSameBoardPagerLink);\n      if (sameBoardLinks.length < 3) continue;\n\n      const numberedControls = getNumberedControls(node);\n      const hasClassicNumbers = numberedControls.length >= 2;\n      const hasCompactText = hasCompactPagerText(node);\n      if (!hasClassicNumbers && !hasCompactText) continue;\n\n      const text = normalizeText(node.textContent);\n      if (hasClassicNumbers && !/\\b1\\b/.test(text) && !/\\b2\\b/.test(text)) continue;\n\n      return node;\n    }\n\n    return null;\n  }\n\n  function enhancePagination(root) {\n    const numberedControls = getNumberedControls(root);\n    const boardLinks = Array.from(root.querySelectorAll(\"a[href]\")).filter(isSameBoardPagerLink);\n    if (boardLinks.length < 2) return;\n    if (numberedControls.length < 2 && !hasCompactPagerText(root)) return;\n\n    root.setAttribute(PAGER_MARK, \"true\");\n\n    if (numberedControls.length < 2 || hasCompactPagerText(root)) {\n      enhanceCompactPagination(root, boardLinks);\n      return;\n    }\n\n    const numberBounds = getHorizontalBounds(numberedControls);\n    const arrowLinks = boardLinks\n      .filter((link) => !/^\\d+$/.test(normalizeText(link.textContent)))\n      .map((link) => ({ link, rect: link.getBoundingClientRect() }))\n      .filter((item) => item.rect.width > 0 && item.rect.height > 0)\n      .sort((a, b) => a.rect.left - b.rect.left);\n\n    const newer = arrowLinks.filter((item) => midpoint(item.rect) < numberBounds.left);\n    const older = arrowLinks.filter((item) => midpoint(item.rect) > numberBounds.right);\n\n    newer.forEach((item, index) => markArrow(item.link, \"newer\", newerLabel(index, newer.length)));\n    older.forEach((item, index) => markArrow(item.link, \"older\", olderLabel(index, older.length)));\n  }\n\n  function enhanceCompactPagination(root, boardLinks) {\n    const links = boardLinks\n      .map((link) => ({ link, rect: link.getBoundingClientRect(), text: displayText(link) }))\n      .filter((item) => item.rect.width > 0 && item.rect.height > 0)\n      .sort((a, b) => a.rect.left - b.rect.left);\n\n    const textItems = compactTextControls(root);\n    if (textItems.length === 0) return;\n\n    textItems.forEach((item) => markTextLink(item.element, compactLabel(item.text), compactTitle(item.text)));\n\n    const textBounds = getHorizontalBounds(textItems.map((item) => item.element));\n    links\n      .filter((item) => !item.text && midpoint(item.rect) < textBounds.left)\n      .forEach((item) => markTitleOnly(item.link, \"NOVĚJŠÍ\"));\n    links\n      .filter((item) => !item.text && midpoint(item.rect) > textBounds.right)\n      .forEach((item) => markTitleOnly(item.link, \"STARŠÍ\"));\n  }\n\n  function markArrow(link, direction, text) {\n    link.setAttribute(ARROW_MARK, direction);\n\n    if (!link.hasAttribute(ORIGINAL_TITLE)) {\n      link.setAttribute(ORIGINAL_TITLE, link.getAttribute(\"title\") || \"\");\n    }\n\n    link.title = text;\n\n    let label = link.querySelector(`[${LABEL_MARK}]`);\n    if (!label) {\n      label = document.createElement(\"span\");\n      label.setAttribute(LABEL_MARK, \"true\");\n      link.appendChild(label);\n    }\n\n    label.textContent = text;\n  }\n\n  function markTextLink(element, text, title) {\n    const original = originalText(element);\n    if (!element.hasAttribute(ORIGINAL_TEXT)) {\n      element.setAttribute(ORIGINAL_TEXT, original);\n    }\n\n    element.setAttribute(TEXT_MARK, \"true\");\n    element.textContent = text;\n\n    if (!element.hasAttribute(ORIGINAL_TITLE)) {\n      element.setAttribute(ORIGINAL_TITLE, element.getAttribute(\"title\") || \"\");\n    }\n\n    element.title = title || text;\n  }\n\n  function markTitleOnly(link, text) {\n    if (!link.hasAttribute(ORIGINAL_TITLE)) {\n      link.setAttribute(ORIGINAL_TITLE, link.getAttribute(\"title\") || \"\");\n    }\n\n    link.title = text;\n  }\n\n  function restoreTextLink(link) {\n    if (link.hasAttribute(ORIGINAL_TEXT)) {\n      link.textContent = link.getAttribute(ORIGINAL_TEXT) || \"\";\n      link.removeAttribute(ORIGINAL_TEXT);\n    }\n\n    link.removeAttribute(TEXT_MARK);\n\n    if (link.hasAttribute(ORIGINAL_TITLE)) {\n      const title = link.getAttribute(ORIGINAL_TITLE);\n      if (title) {\n        link.title = title;\n      } else {\n        link.removeAttribute(\"title\");\n      }\n\n      link.removeAttribute(ORIGINAL_TITLE);\n    }\n  }\n\n  function newerLabel(index, count) {\n    if (count <= 1) return \"NOVĚJŠÍ\";\n    if (index === 0) return \"NEJNOVĚJŠÍ\";\n    return \"NOOOOVĚJŠÍ\";\n  }\n\n  function olderLabel(index, count) {\n    if (count <= 1) return \"STARŠÍ\";\n    if (index === count - 1) return \"NEJSTARŠÍ\";\n    return \"STARŠÍ\";\n  }\n\n  function getNumberedControls(root) {\n    const controls = Array.from(root.querySelectorAll(\"a, button, div, span\"))\n      .filter((element) => /^\\d+$/.test(normalizeText(element.textContent)))\n      .filter((element) => {\n        const rect = element.getBoundingClientRect();\n        return rect.width >= 10 && rect.width <= 80 && rect.height >= 10 && rect.height <= 60;\n      });\n\n    return uniqueElements(controls);\n  }\n\n  function hasCompactPagerText(root) {\n    return compactTextControls(root).length > 0;\n  }\n\n  function compactTextControls(root) {\n    const linked = visibleCompactControls(Array.from(root.querySelectorAll(\"a[href]\")).filter(isSameBoardPagerLink));\n    if (linked.length > 0) return linked;\n\n    return visibleCompactControls(Array.from(root.querySelectorAll(\"a, button, span\")));\n  }\n\n  function visibleCompactControls(elements) {\n    return uniqueElements(elements\n      .filter((element) => isCompactPagerText(displayText(element)))\n      .filter((element) => {\n        const rect = element.getBoundingClientRect();\n        return rect.width >= 20 && rect.width <= 240 && rect.height >= 10 && rect.height <= 60;\n      }))\n      .map((element) => ({ element, text: originalText(element) }));\n  }\n\n  function isCompactPagerText(text) {\n    return /nov[eě]j[sš][ií](?:ch)?/i.test(text) || /posledn[ií]ch/i.test(text);\n  }\n\n  function compactLabel(text) {\n    const count = remainingPages(text);\n    return noooovejsiWord(count);\n  }\n\n  function compactTitle(text) {\n    const count = remainingPages(text);\n    if (count <= 0) return \"Aktuální nejnovější stránka\";\n    return `Zhruba ${count} strán${count === 1 ? \"ka\" : count < 5 ? \"ky\" : \"ek\"} k nejnovějším`;\n  }\n\n  function remainingPages(text) {\n    if (/posledn[ií]ch/i.test(text)) return 1;\n\n    const match = text.match(/z\\s+(\\d+)(\\+)?/i);\n    if (!match) return 0;\n    if (match[2]) return 6;\n\n    return Math.max(1, Math.min(6, Math.ceil(Number(match[1]) / 50)));\n  }\n\n  function noooovejsiWord(count) {\n    return `N${\"o\".repeat(Math.max(1, count))}vější`;\n  }\n\n  function displayText(element) {\n    return normalizeText(element.textContent);\n  }\n\n  function originalText(element) {\n    return normalizeText(element.getAttribute(ORIGINAL_TEXT) || element.textContent);\n  }\n\n  function getHorizontalBounds(elements) {\n    return elements.reduce((bounds, element) => {\n      const rect = element.getBoundingClientRect();\n      return {\n        left: Math.min(bounds.left, rect.left),\n        right: Math.max(bounds.right, rect.right),\n      };\n    }, { left: Infinity, right: -Infinity });\n  }\n\n  function midpoint(rect) {\n    return rect.left + rect.width / 2;\n  }\n\n  function isSameBoardPagerLink(link) {\n    try {\n      const url = new URL(link.href, window.location.href);\n      if (url.origin !== window.location.origin) return false;\n      if (url.pathname !== window.location.pathname) return false;\n      if (url.hash) return false;\n      return url.search === \"\" || url.searchParams.has(\"f\");\n    } catch (_error) {\n      return false;\n    }\n  }\n\n  function uniqueElements(elements) {\n    const seen = new Set();\n    return elements.filter((element) => {\n      if (seen.has(element)) return false;\n      seen.add(element);\n      return true;\n    });\n  }\n\n  function normalizeText(value) {\n    return String(value || \"\").replace(/\\s+/g, \" \").trim();\n  }\n})();\n");
  embeddedScripts.set("containers/noooovejsi.container.js", function () {
    // Standalone Cudloun container: playful labels for Babeta board pagination arrows.
    (function () {
      "use strict";

      const ID = "noooovejsi";
      const STYLE_ID = "cudloun-container-noooovejsi-style";
      const PAGER_MARK = "data-cudloun-noooovejsi-pagination";
      const ARROW_MARK = "data-cudloun-noooovejsi-arrow";
      const LABEL_MARK = "data-cudloun-noooovejsi-label";
      const TEXT_MARK = "data-cudloun-noooovejsi-text";
      const ORIGINAL_TITLE = "data-cudloun-noooovejsi-original-title";
      const ORIGINAL_TEXT = "data-cudloun-noooovejsi-original-text";
      let observer = null;
      let scheduled = false;

      const api = {
        id: ID,
        name: "Noooovejsi",
        run,
        stop,
      };

      window.CudlounNoooovejsi = api;

      if (window.CudlounContainerRegistry && typeof window.CudlounContainerRegistry.register === "function") {
        window.CudlounContainerRegistry.register(api);
      }

      if (!window.CudlounContainerRegistry) {
        run();
      }

      return api;

      function run() {
        installStyles();
        scan();

        if (!observer) {
          observer = new MutationObserver(scheduleScan);
          observer.observe(document.body, { childList: true, subtree: true });
        }

        console.log("[cudloun-container] noooovejsi active");
        return api;
      }

      function stop() {
        if (observer) {
          observer.disconnect();
          observer = null;
        }

        scheduled = false;

        document.querySelectorAll(`[${LABEL_MARK}]`).forEach((label) => label.remove());
        document.querySelectorAll(`[${TEXT_MARK}]`).forEach((link) => restoreTextLink(link));
        document.querySelectorAll(`[${ARROW_MARK}]`).forEach((link) => {
          link.removeAttribute(ARROW_MARK);

          if (link.hasAttribute(ORIGINAL_TITLE)) {
            const title = link.getAttribute(ORIGINAL_TITLE);
            if (title) {
              link.title = title;
            } else {
              link.removeAttribute("title");
            }

            link.removeAttribute(ORIGINAL_TITLE);
          }
        });
        document.querySelectorAll(`[${PAGER_MARK}]`).forEach((pager) => pager.removeAttribute(PAGER_MARK));
        document.getElementById(STYLE_ID)?.remove();
        console.log("[cudloun-container] noooovejsi stopped");
      }

      function installStyles() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
          [${PAGER_MARK}] {
            align-items: center !important;
          }

          [${ARROW_MARK}] {
            width: auto !important;
            min-width: 30px !important;
            max-width: none !important;
            padding-left: 0.55em !important;
            padding-right: 0.55em !important;
            gap: 0.3em !important;
            white-space: nowrap !important;
          }

          [${ARROW_MARK}="newer"] {
            flex-direction: row !important;
          }

          [${ARROW_MARK}="older"] {
            flex-direction: row !important;
          }

          [${LABEL_MARK}] {
            display: inline-flex !important;
            align-items: center !important;
            max-width: 11em !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            color: inherit !important;
            font-size: 11px !important;
            font-weight: 800 !important;
            line-height: 1 !important;
            letter-spacing: 0 !important;
            text-transform: uppercase !important;
            pointer-events: none !important;
          }

          [${TEXT_MARK}] {
            font-weight: 900 !important;
            letter-spacing: 0 !important;
            white-space: nowrap !important;
          }

          @media (max-width: 520px) {
            [${ARROW_MARK}] {
              padding-left: 0.4em !important;
              padding-right: 0.4em !important;
            }

            [${LABEL_MARK}] {
              max-width: 7.5em !important;
              font-size: 10px !important;
            }
          }
        `;
        document.head.appendChild(style);
      }

      function scheduleScan() {
        if (scheduled) return;
        scheduled = true;
        window.requestAnimationFrame(() => {
          scheduled = false;
          scan();
        });
      }

      function scan() {
        if (!isBoardRoute()) {
          cleanupMissingRoute();
          return;
        }

        findPaginationRoots().forEach(enhancePagination);
      }

      function cleanupMissingRoute() {
        document.querySelectorAll(`[${LABEL_MARK}]`).forEach((label) => label.remove());
        document.querySelectorAll(`[${TEXT_MARK}]`).forEach((link) => restoreTextLink(link));
        document.querySelectorAll(`[${ARROW_MARK}]`).forEach((link) => link.removeAttribute(ARROW_MARK));
        document.querySelectorAll(`[${PAGER_MARK}]`).forEach((pager) => pager.removeAttribute(PAGER_MARK));
      }

      function isBoardRoute() {
        return /^\/boards\/[^/]+/.test(window.location.pathname);
      }

      function findPaginationRoots() {
        const roots = new Set();
        const boardLinks = Array.from(document.querySelectorAll("a[href]")).filter(isSameBoardPagerLink);

        boardLinks.forEach((link) => {
          const root = findPaginationRoot(link);
          if (root) roots.add(root);
        });

        return Array.from(roots);
      }

      function findPaginationRoot(link) {
        let node = link.parentElement;

        for (let depth = 0; node && depth < 8; depth += 1, node = node.parentElement) {
          const sameBoardLinks = Array.from(node.querySelectorAll("a[href]")).filter(isSameBoardPagerLink);
          if (sameBoardLinks.length < 3) continue;

          const numberedControls = getNumberedControls(node);
          const hasClassicNumbers = numberedControls.length >= 2;
          const hasCompactText = hasCompactPagerText(node);
          if (!hasClassicNumbers && !hasCompactText) continue;

          const text = normalizeText(node.textContent);
          if (hasClassicNumbers && !/\b1\b/.test(text) && !/\b2\b/.test(text)) continue;

          return node;
        }

        return null;
      }

      function enhancePagination(root) {
        const numberedControls = getNumberedControls(root);
        const boardLinks = Array.from(root.querySelectorAll("a[href]")).filter(isSameBoardPagerLink);
        if (boardLinks.length < 2) return;
        if (numberedControls.length < 2 && !hasCompactPagerText(root)) return;

        root.setAttribute(PAGER_MARK, "true");

        if (numberedControls.length < 2 || hasCompactPagerText(root)) {
          enhanceCompactPagination(root, boardLinks);
          return;
        }

        const numberBounds = getHorizontalBounds(numberedControls);
        const arrowLinks = boardLinks
          .filter((link) => !/^\d+$/.test(normalizeText(link.textContent)))
          .map((link) => ({ link, rect: link.getBoundingClientRect() }))
          .filter((item) => item.rect.width > 0 && item.rect.height > 0)
          .sort((a, b) => a.rect.left - b.rect.left);

        const newer = arrowLinks.filter((item) => midpoint(item.rect) < numberBounds.left);
        const older = arrowLinks.filter((item) => midpoint(item.rect) > numberBounds.right);

        newer.forEach((item, index) => markArrow(item.link, "newer", newerLabel(index, newer.length)));
        older.forEach((item, index) => markArrow(item.link, "older", olderLabel(index, older.length)));
      }

      function enhanceCompactPagination(root, boardLinks) {
        const links = boardLinks
          .map((link) => ({ link, rect: link.getBoundingClientRect(), text: displayText(link) }))
          .filter((item) => item.rect.width > 0 && item.rect.height > 0)
          .sort((a, b) => a.rect.left - b.rect.left);

        const textItems = compactTextControls(root);
        if (textItems.length === 0) return;

        textItems.forEach((item) => markTextLink(item.element, compactLabel(item.text), compactTitle(item.text)));

        const textBounds = getHorizontalBounds(textItems.map((item) => item.element));
        links
          .filter((item) => !item.text && midpoint(item.rect) < textBounds.left)
          .forEach((item) => markTitleOnly(item.link, "NOVĚJŠÍ"));
        links
          .filter((item) => !item.text && midpoint(item.rect) > textBounds.right)
          .forEach((item) => markTitleOnly(item.link, "STARŠÍ"));
      }

      function markArrow(link, direction, text) {
        link.setAttribute(ARROW_MARK, direction);

        if (!link.hasAttribute(ORIGINAL_TITLE)) {
          link.setAttribute(ORIGINAL_TITLE, link.getAttribute("title") || "");
        }

        link.title = text;

        let label = link.querySelector(`[${LABEL_MARK}]`);
        if (!label) {
          label = document.createElement("span");
          label.setAttribute(LABEL_MARK, "true");
          link.appendChild(label);
        }

        label.textContent = text;
      }

      function markTextLink(element, text, title) {
        const original = originalText(element);
        if (!element.hasAttribute(ORIGINAL_TEXT)) {
          element.setAttribute(ORIGINAL_TEXT, original);
        }

        element.setAttribute(TEXT_MARK, "true");
        element.textContent = text;

        if (!element.hasAttribute(ORIGINAL_TITLE)) {
          element.setAttribute(ORIGINAL_TITLE, element.getAttribute("title") || "");
        }

        element.title = title || text;
      }

      function markTitleOnly(link, text) {
        if (!link.hasAttribute(ORIGINAL_TITLE)) {
          link.setAttribute(ORIGINAL_TITLE, link.getAttribute("title") || "");
        }

        link.title = text;
      }

      function restoreTextLink(link) {
        if (link.hasAttribute(ORIGINAL_TEXT)) {
          link.textContent = link.getAttribute(ORIGINAL_TEXT) || "";
          link.removeAttribute(ORIGINAL_TEXT);
        }

        link.removeAttribute(TEXT_MARK);

        if (link.hasAttribute(ORIGINAL_TITLE)) {
          const title = link.getAttribute(ORIGINAL_TITLE);
          if (title) {
            link.title = title;
          } else {
            link.removeAttribute("title");
          }

          link.removeAttribute(ORIGINAL_TITLE);
        }
      }

      function newerLabel(index, count) {
        if (count <= 1) return "NOVĚJŠÍ";
        if (index === 0) return "NEJNOVĚJŠÍ";
        return "NOOOOVĚJŠÍ";
      }

      function olderLabel(index, count) {
        if (count <= 1) return "STARŠÍ";
        if (index === count - 1) return "NEJSTARŠÍ";
        return "STARŠÍ";
      }

      function getNumberedControls(root) {
        const controls = Array.from(root.querySelectorAll("a, button, div, span"))
          .filter((element) => /^\d+$/.test(normalizeText(element.textContent)))
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            return rect.width >= 10 && rect.width <= 80 && rect.height >= 10 && rect.height <= 60;
          });

        return uniqueElements(controls);
      }

      function hasCompactPagerText(root) {
        return compactTextControls(root).length > 0;
      }

      function compactTextControls(root) {
        const linked = visibleCompactControls(Array.from(root.querySelectorAll("a[href]")).filter(isSameBoardPagerLink));
        if (linked.length > 0) return linked;

        return visibleCompactControls(Array.from(root.querySelectorAll("a, button, span")));
      }

      function visibleCompactControls(elements) {
        return uniqueElements(elements
          .filter((element) => isCompactPagerText(displayText(element)))
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            return rect.width >= 20 && rect.width <= 240 && rect.height >= 10 && rect.height <= 60;
          }))
          .map((element) => ({ element, text: originalText(element) }));
      }

      function isCompactPagerText(text) {
        return /nov[eě]j[sš][ií](?:ch)?/i.test(text) || /posledn[ií]ch/i.test(text);
      }

      function compactLabel(text) {
        const count = remainingPages(text);
        return noooovejsiWord(count);
      }

      function compactTitle(text) {
        const count = remainingPages(text);
        if (count <= 0) return "Aktuální nejnovější stránka";
        return `Zhruba ${count} strán${count === 1 ? "ka" : count < 5 ? "ky" : "ek"} k nejnovějším`;
      }

      function remainingPages(text) {
        if (/posledn[ií]ch/i.test(text)) return 1;

        const match = text.match(/z\s+(\d+)(\+)?/i);
        if (!match) return 0;
        if (match[2]) return 6;

        return Math.max(1, Math.min(6, Math.ceil(Number(match[1]) / 50)));
      }

      function noooovejsiWord(count) {
        return `N${"o".repeat(Math.max(1, count))}vější`;
      }

      function displayText(element) {
        return normalizeText(element.textContent);
      }

      function originalText(element) {
        return normalizeText(element.getAttribute(ORIGINAL_TEXT) || element.textContent);
      }

      function getHorizontalBounds(elements) {
        return elements.reduce((bounds, element) => {
          const rect = element.getBoundingClientRect();
          return {
            left: Math.min(bounds.left, rect.left),
            right: Math.max(bounds.right, rect.right),
          };
        }, { left: Infinity, right: -Infinity });
      }

      function midpoint(rect) {
        return rect.left + rect.width / 2;
      }

      function isSameBoardPagerLink(link) {
        try {
          const url = new URL(link.href, window.location.href);
          if (url.origin !== window.location.origin) return false;
          if (url.pathname !== window.location.pathname) return false;
          if (url.hash) return false;
          return url.search === "" || url.searchParams.has("f");
        } catch (_error) {
          return false;
        }
      }

      function uniqueElements(elements) {
        const seen = new Set();
        return elements.filter((element) => {
          if (seen.has(element)) return false;
          seen.add(element);
          return true;
        });
      }

      function normalizeText(value) {
        return String(value || "").replace(/\s+/g, " ").trim();
      }
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
    const CORE_VERSION = "0.3.11";
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
        if (!item || !item.file) continue;
        if (item.required || groupName === "module") {
          await loadScript(item.file, item.id || item.file);
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
