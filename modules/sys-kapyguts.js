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
