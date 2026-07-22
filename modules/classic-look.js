// Classic Okoun reading style for Kapybara without replacing its native UI.
(function () {
  "use strict";

  const root = window.Cudloun;
  const STYLE_ID = "cudloun-classic-look-style";
  const THEME_ATTR = "data-cudloun-classic-look";
  const VERSION = "0.1.1";
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
      html[${THEME_ATTR}="true"] .🐟-stripes{
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
