// Cudloun Kapybara DOM dictionary helpers.
(function () {
  "use strict";

  const root = window.Cudloun || null;
  const VERSION = "0.6.0";
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
