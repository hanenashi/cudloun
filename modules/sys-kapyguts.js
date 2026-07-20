// Cudloun Kapybara DOM dictionary helpers.
(function () {
  "use strict";

  const root = window.Cudloun;
  const VERSION = "0.2.0";
  const SELECTORS = {
    pageHeader: "header:not(.board-header):not(.post-header)",
    pageHeaderLogo: "a[aria-label='Okoun home'], .logo",
    pageHeaderDesktopActions: ".desktop-right",
    desktopAvatarMenuTrigger: "button.avatar-button[aria-label='Uživatelské menu'][aria-haspopup='menu']",
    mobileAvatarMenuTrigger: "nav.mobile-bottom-nav[aria-label='Spodní navigace'] button.user-item[aria-haspopup]",
    dropdownMenu: "[role='menu'][data-dropdown-menu-content]",
    dropdownMenuItem: "[role='menuitem'][data-dropdown-menu-item]",
    nativeFontSettingsLink: "a[role='menuitem'][href='/test/fonts']",
    boardHeader: "header.board-header",
    boardTitleRow: ".board-header .title-row",
    boardTitleLink: ".board-header .title-link",
    boardTitleActions: ".board-header .title-row .title-actions",
    mobileBottomNav: "nav.mobile-bottom-nav[aria-label='Spodní navigace']",
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
    fontSettingsPanel: ".fs-panel[role='dialog'][aria-labelledby='fs-title']",
    fontSettingsCopyButton: "button.fs-copy",
    fontSettingsCloseButton: "button.fs-close[aria-label='Zavřít']",
    fontSettingsChromeSelect: "#fs-chrome",
    fontSettingsHeadersSelect: "#fs-chrome-headers",
    fontSettingsContentSelect: "#fs-content",
    fontSettingsCodeSelect: "#fs-code",
    fontSettingsBrandSelect: "#fs-brand",
    fontSettingsSizeRow: "label.fs-size-row",
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
    pageHeader,
    pageHeaderParts,
    avatarMenuParts,
    boardHeaderParts,
    fontSettingsParts,
    fontSettingsState,
    visibleMenus,
    visiblePostMenus,
    allComposers,
    composerParts,
    observeComposers,
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
    if (path === "/test/fonts") return "font-settings";
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

  function avatarMenuParts(scope = document) {
    const desktopTrigger = scope.querySelector(SELECTORS.desktopAvatarMenuTrigger);
    const mobileTrigger = scope.querySelector(SELECTORS.mobileAvatarMenuTrigger);
    const trigger = [desktopTrigger, mobileTrigger].find(isVisible) || desktopTrigger || mobileTrigger || null;
    const menu = Array.from(scope.querySelectorAll("[role='menu']")).find((candidate) => (
      isVisible(candidate) && (
        !!candidate.querySelector(SELECTORS.nativeFontSettingsLink) ||
        TEXT.avatarMenu.some((needle) => normalizeText(candidate.textContent).includes(needle))
      )
    )) || null;
    const items = menu ? Array.from(menu.querySelectorAll("[role='menuitem']")) : [];
    const fontSettingsLink = menu?.querySelector(SELECTORS.nativeFontSettingsLink) || null;

    return {
      trigger,
      desktopTrigger,
      mobileTrigger,
      menu,
      items,
      fontSettingsLink,
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
      mobileBottomNav: scope.querySelector(SELECTORS.mobileBottomNav),
      stickyTitle: !!titleRow && window.getComputedStyle(titleRow).position === "sticky",
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

  function inspect() {
    const posts = visiblePosts();
    const menus = visibleMenus();
    const fontSettings = fontSettingsState();
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
        boardHeaders: document.querySelectorAll(SELECTORS.boardHeader).length,
        avatars: document.querySelectorAll(SELECTORS.avatar).length,
        replies: document.querySelectorAll(SELECTORS.replyButton).length,
        postMenuButtons: document.querySelectorAll(SELECTORS.postMenuButton).length,
        favoriteRows: document.querySelectorAll(SELECTORS.favoriteBoardRow).length,
        messageItems: document.querySelectorAll(SELECTORS.messageItem).length,
        messageCards: document.querySelectorAll(SELECTORS.messageCard).length,
        composers: allComposers().length,
        readyComposers: allComposers().filter((section) => composerParts(section)?.ready).length,
        visibleMenus: menus.length,
        nativeFontSettingsLinks: document.querySelectorAll(SELECTORS.nativeFontSettingsLink).length,
      },
      fontSettings,
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
