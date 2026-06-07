// Cudloun Firestore-backed feedback threads.
(function () {
  "use strict";

  const root = window.Cudloun;
  const VERSION = "0.1.0";
  const PROJECT_ID = "murkypond-vault-fc61c";
  const REST_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
  const MAX_TEXT_LENGTH = 1200;
  const PAGE_SIZE = 40;

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
    author.value = root.storage.get("feedback.author", detectAuthor());

    const textarea = document.createElement("textarea");
    textarea.name = "text";
    textarea.maxLength = MAX_TEXT_LENGTH;
    textarea.rows = 3;
    textarea.placeholder = "Idea, bug, or note...";

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
    form.appendChild(textarea);
    form.appendChild(actions);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      sendMessage(normalized, author, textarea, submit, status, wrap);
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
      renderMessages(box, messages);
    } catch (error) {
      root.log.warn("feedback", "ordered load failed", target.threadId, error);
      try {
        const fallbackUrl = `${REST_BASE}/cudlounThreads/${encodeURIComponent(target.threadId)}/messages?pageSize=${PAGE_SIZE}`;
        const data = await requestJson(fallbackUrl);
        const messages = (data.documents || []).map(documentToMessage).filter(Boolean)
          .sort((a, b) => (a.ts || 0) - (b.ts || 0));
        renderMessages(box, messages);
      } catch (fallbackError) {
        root.log.warn("feedback", "load failed", target.threadId, fallbackError);
        box.textContent = "Feedback could not be loaded.";
      }
    }
  }

  function renderMessages(box, messages) {
    box.innerHTML = "";

    if (!messages.length) {
      const empty = document.createElement("div");
      empty.className = "cudloun-feedback-empty";
      empty.textContent = "No feedback yet.";
      box.appendChild(empty);
      return;
    }

    messages.forEach((message) => {
      const item = document.createElement("article");
      item.className = "cudloun-feedback-message";

      const head = document.createElement("div");
      head.className = "cudloun-feedback-message-head";

      const author = document.createElement("strong");
      author.textContent = message.author || "Unknown";

      const time = document.createElement("time");
      time.textContent = formatTime(message.ts);

      const text = document.createElement("div");
      text.className = "cudloun-feedback-text";
      text.textContent = message.text || "";

      head.appendChild(author);
      head.appendChild(time);
      item.appendChild(head);
      item.appendChild(text);
      box.appendChild(item);
    });

    box.scrollTop = box.scrollHeight;
  }

  async function sendMessage(target, authorInput, textarea, submit, status, wrap) {
    const author = cleanAuthor(authorInput.value || detectAuthor());
    const text = String(textarea.value || "").trim();

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
            schemaVersion: { integerValue: 1 },
            author: { stringValue: author },
            text: { stringValue: text },
            ts: { integerValue: String(Date.now()) },
            route: { stringValue: root.currentRoute() },
            cudlounVersion: { stringValue: root.version || "" },
            userAgentHint: { stringValue: userAgentHint() },
          },
        }),
      });

      textarea.value = "";
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

  async function requestJson(url, options) {
    const response = await fetch(url, options || {});
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
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
    const candidates = [
      ...Array.from(document.querySelectorAll("button[aria-label], [title], img[alt]"))
        .map((node) => node.getAttribute("aria-label") || node.getAttribute("title") || node.getAttribute("alt")),
      ...Array.from(document.querySelectorAll(".MuiAvatar-root, .avatar-container"))
        .map((node) => node.textContent),
    ];

    const ignored = /^(menu|close|search|nastaveni|nastavení|barevne schema|barevné schéma|odhlasit|odhlásit|okoun)$/i;
    const found = candidates
      .map((value) => String(value || "").replace(/\s+/g, " ").trim())
      .find((value) => value && value.length <= 40 && !ignored.test(value));

    return cleanAuthor(found || "Unknown");
  }

  function cleanAuthor(value) {
    const text = String(value || "").replace(/\s+/g, " ").trim().slice(0, 40);
    return text || "Unknown";
  }

  function userAgentHint() {
    const coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    return `${coarse ? "mobile" : "desktop"} ${window.innerWidth}x${window.innerHeight}`;
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
