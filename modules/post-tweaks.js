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
