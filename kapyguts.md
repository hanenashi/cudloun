# Kapyguts: Kapybara Tweak Field Notes

Nerdy TL;DR for Cudloun sessions that touch live Kapybara pages.

Kapybara currently lives at:

```text
https://kapybara.okoun.cz/
```

It is expected to become the future Okoun frontend, but the DOM is still moving. Treat these notes as a current snapshot, not a stability guarantee.

## First Rule

Use Kapyguts before inventing one-off selectors.

```js
window.Cudloun.kapyguts.inspect()
```

For logged-in display user parsing, prefer:

```js
window.Cudloun.kapyguts.currentUser()
window.Cudloun.kapyguts.currentUserCandidates()
```

Kapyguts lives in:

```text
modules/sys-kapyguts.js
```

It exposes:

- `isKapybara()`
- `route()`
- `currentUser()`
- `currentUserCandidates()`
- `isBoardPage()`
- `isFavoritesPage()`
- `isMessagesPage()`
- `allPosts()`
- `visiblePosts()`
- `postParts(post)`
- `pageChromeParts()`
- `pageHeader()`
- `pageHeaderParts()`
- `avatarMenuParts()`
- `boardHeaderParts()`
- `fontSettingsParts()`
- `fontSettingsState()`
- `postDisplayParts()`
- `postDisplayState()`
- `visibleMenus(kind)`
- `visiblePostMenus()`
- `allComposers()`
- `composerParts(section)`
- `observeComposers(callback, scope, onRemoved)`
- `explain(element)`
- `inspect()`

## Selector Coach

Select an element in DevTools and pass the console's `$0` reference to:

```js
Cudloun.kapyguts.explain($0)
```

The read-only result contains:

```js
{
  ok: true,
  component: "post body",
  element: $0,
  target: /* nearest recognized component */,
  recommendedSelector: "article.post .body",
  selector: "article.post .body",
  avoid: [".🐟-content", ".🇸-trfpop"],
  notes: [/* short Czech guidance */],
  css: "article.post .body {\n  /* vlastní styl */\n}"
}
```

Known mappings cover post parts, composers, global and board headers, mobile
navigation, Favorites rows, messages, test settings panels, viewport stripes,
and legacy classic-Okoun `div.code` blocks. Selecting a descendant is enough:
Kapyguts walks to the nearest recognized component and returns that node as
`target`.

Classes beginning with `🇸-` and internal `🐟-` classes are reported under
`avoid`. The mapped `.🐟-stripes` viewport painter is the intentional
exception. For unknown elements, Kapyguts only constructs conservative
fallbacks from a stable ID, `data-testid`, `aria-label`, or `role`; otherwise
it returns `ok: false` instead of suggesting an unsafe generic selector.

## Access Notes

Kapybara may show its own access gate and has a separate login form. Keep access mechanics, credentials, cookies, and local automation details in private local notes, not in public Cudloun docs.

The current login form uses:

```text
input[autocomplete="username"]
input[autocomplete="current-password"]
button[type="submit"]
```

Do not print credentials, access codes, cookies, or local automation details in logs.

## Board Page Lab Species

Baseline page inspected on 2026-06-11:

```text
https://kapybara.okoun.cz/boards/boatd_name
```

Observed route:

```text
route.type: board
route.boardId: boatd_name
posts: 50
```

Useful post selectors:

```text
article.post
article.post[data-post-id]
article.post[data-thread-id]
.avatar-col
.avatar
.post-main
.post-header
.author
.meta
button.date
.reply-ref
.body
.markdown
.actions
.reply-action
.post-menu-button[aria-label="menu"]
```

`postParts(post)` returns:

```text
post
row
avatarColumn
avatar
avatarImage
content
header
author
meta
dateWrap
dateButton
replyMeta
body
markdown
actions
reply
postMenuButton
```

Kapybara post links use stable anchors:

```text
/boards/boatd_name/c/1074607522#p1074607522
```

Individual posts use:

```text
id="p1074607522"
data-post-id="1074607522"
data-thread-id="1074607385"
```

## Board Post Shape

Kapybara board posts:

```text
article.post
data-post-id
data-thread-id
```

## Persistent And Board Headers

Observed on desktop and mobile on 2026-07-20 in `nepotrebny_pokus`:

```text
global page header:  header:not(.board-header):not(.post-header)
home marker:         a[aria-label="Okoun home"], .logo
desktop actions:     .desktop-right
board header:        header.board-header
board title row:     .board-header .title-row
board title link:    .board-header .title-link
board actions:       .board-header .title-row .title-actions
mobile bottom nav:   nav.mobile-bottom-nav[aria-label="Spodní navigace"]
```

On desktop, the global page header is sticky at `top: 0` while the board header
scrolls away. At mobile width, the global page header scrolls away and the
board title row becomes the sticky toolbar at `top: 0`. Use `pageHeaderParts()`
for the desktop header and its native action group, and `boardHeaderParts()` for
the mobile board toolbar, so modules do not repeat that responsive lookup.

## Viewport Edge Stripes

Observed on desktop on 2026-07-22 in the `kapybara` board:

```text
.🐟-stripes
```

This decorative `aria-hidden` element is fixed across the viewport at
`z-index: 2000`. Its native `linear-gradient` paints 12 px blue strips at the
far left and right edges. It is not an `html`/`body` border, which makes it easy
to miss while inspecting the page shell. At mobile width the same element
remains present, but its computed background image is `none`.

Kapyguts owns this exceptional emoji-prefixed hook as
`selectors.viewportStripes`. Use `pageChromeParts()` to obtain
`viewportStripes`, `stripeBackground`, and `stripesActive` instead of repeating
the selector in feature modules. `inspect()` exposes the same facts under
`pageChrome`.

## Native Font Settings (Temporary Experiment)

Observed on desktop and mobile on 2026-07-20 after Koles announced the test in
the `kapybara` board. Kapybara itself labels this menu item `[test]` and Koles
described its location as very temporary, so keep all dependencies behind the
Kapyguts helpers below.

Responsive account-menu entry points:

```text
desktop: button.avatar-button[aria-label="Uživatelské menu"][aria-haspopup="menu"]
mobile:  nav.mobile-bottom-nav[aria-label="Spodní navigace"] button.user-item[aria-haspopup]
link:    a[role="menuitem"][href="/test/fonts"]
```

Desktop opens a menu with `data-dropdown-menu-content`; mobile opens
`[role="dialog"][aria-label="uživatelské menu"]` containing a role menu.
`avatarMenuParts()` normalizes both into `trigger`, `menu`, `items`,
`fontSettingsLink`, and `open`.

Native routes:

```text
/test/fonts
/test/fonts?k=chatk_colit  (serif experiment shared by Koles)
```

The settings panel and durable controls observed on both layouts:

```text
.fs-panel[role="dialog"][aria-labelledby="fs-title"]
#fs-chrome
#fs-chrome-headers
#fs-content
#fs-code
#fs-brand
label.fs-size-row input[type="number"]
button.fs-copy
button.fs-close[aria-label="Zavřít"]
```

`fontSettingsParts()` maps the five select roles, their five size inputs, the
low-DPR fallback switch, and reset/cancel/save actions. Since the number inputs
and action buttons lack unique IDs, Kapyguts resolves them by their Czech labels
inside the panel rather than by layout position. `fontSettingsState()` is a
read-only value snapshot and identifies the `chatk_colit` serif experiment.

Never depend on the generated emoji-prefixed classes or generated menu IDs.
Expect this whole contract to change or disappear while the native page remains
a test.

## Native Post Display Settings (Temporary Experiment)

Observed on desktop and mobile on 2026-07-22. Kapybara labels the account-menu
entry `[test] Zobrazení příspěvků` and says the page is temporary. Keep all
dependencies behind Kapyguts so its removal cannot break feature modules.

```text
menu link: a[role="menuitem"][href="/test/posts"]
route:     /test/posts
panel:     .pd-panel[role="dialog"][aria-labelledby="pd-title"]
close:     button.pd-close[aria-label="Zavřít"]
```

The panel offers switches labeled `Větší mezera` and `Oddělovač`, plus
`aria-pressed` choices for five avatar shapes, contain/cover filling, and no
outline/1 px outline. `postDisplayParts()` resolves these controls by their
Czech labels, and `postDisplayState()` returns their read-only values.

Measured native presentation contract:

```text
post gap:       12 px normally, 16 px with larger gap
shape radius:   circle 50%, square/rectangle 0, rounded 22%
shape aspect:   square 1, rectangle 4 / 5
image fit:      contain or cover
avatar outline: none or 1px solid var(--🐟-border)
```

Kapybara currently stores the experiment in its own local browser state. Do not
read or overwrite that storage from Kapyguts; Cudloun's Post Tweaks module owns
an independent copy so it remains useful after the native experiment vanishes.

## New Post and Reply Composers

Observed on desktop on 2026-07-17 in `nepotrebny_pokus`:

```text
section.new-post-composer[aria-label="Nový příspěvek"]
section.reply-composer[aria-label="Odpověď"]
.composer
.composer-editor
.composer-content-editable[role="textbox"][contenteditable="true"]
.composer-toolbar-slot
[role="toolbar"][aria-label="Formátování textu"]
button[aria-label="Vložit obrázek"]
button.mode-toggle[aria-pressed]
code[data-language="markdown"]
```

The composer is dynamic and uses a Lexical editor, not a textarea. Its `<>`
mode is also Lexical: Markdown source lives in a
`code[data-language="markdown"]` node inside the same contenteditable editor.
The mode toggle exposes `aria-pressed` and localized accessible labels. Native URL
image insertion creates a decorator node marked with:

```text
data-lexical-decorator="true"
```

The native image dialog currently offers:

```text
Ze souboru
Z mých obrázků
Z URL
```

Prefer the semantic classes, roles, and accessible labels above. Do not couple
tweaks to the generated classes. Composer helpers should be added to Kapyguts
before individual modules depend on these facts.

## Favorites

Observed route:

```text
https://kapybara.okoun.cz/fav/topics?unread
```

Useful hooks:

```text
.favorites-page
a[href^="/fav/topics"]
a[href^="/fav/activity"]
a[href^="/boards/"]
.new-pill
.pill-full
.pill-compact
.posts-count
.topic-path
```

Rows are board links, not MUI list items.

## Messages

Observed route:

```text
https://kapybara.okoun.cz/messages
```

Useful hooks:

```text
.messages-page
.conversation-list
.conversation-item
.conversation-detail
.message-list
.message
.message-card
.reply-button
.message-menu-trigger
```

Do not quote Vzkaznik text into public notes or logs. Treat it as private user content. Record structure, counts, selectors, and layout only.

## Generated Classes

Kapybara currently uses some semantic classes plus generated emoji-prefixed scoped classes such as:

```text
🇸-u7z253
🐟-main
```

Use the semantic classes first. Do not rely on the generated classes unless there is no alternative and the tweak is explicitly experimental.

The known exception is `.🐟-stripes`: it has no semantic alternative and is
centralized behind Kapyguts' `viewportStripes` selector.

## Update Discipline

When future Cudloun work discovers a durable Kapybara DOM fact, update this file.

Keep it practical:

- verified selector
- page/route where it was observed
- desktop vs mobile difference
- helper that should own the knowledge
