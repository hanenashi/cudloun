// Cudloun Babeta DOM dictionary helpers.
(function () {
  "use strict";

  const root = window.Cudloun;
  const VERSION = "0.1.0";
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
    const replyMeta = post.querySelector("[data-cudloun-post-tweaks-reply-meta]") || findReplyMeta(actions);
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
    return Array.from(content.children).find((child) => child !== header && child.textContent.trim()) || null;
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
      return /^Re:\s*/.test(text) || /^Reakce na\s+/i.test(text);
    }) || null;
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
