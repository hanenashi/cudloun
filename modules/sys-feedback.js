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
