# Babegun: Babeta Tweak Field Notes

Nerdy TL;DR for Cudloun sessions that touch live Babeta pages.

## Why This Exists

Classic `www.okoun.cz` exposes old server-rendered HTML that can often be tweaked with direct CSS selectors.

Babeta is a modern React/MUI app. The DOM is live, rerendered, and full of hidden leftover menus/drawers. For Babeta tweaks, scan first, then tweak. Do not assume a selector means the thing is currently visible or interactive.

## First Rule

Use Babeguts before inventing one-off selectors.

```js
window.Cudloun.babeguts.inspect()
```

For logged-in display user parsing, prefer:

```js
window.Cudloun.babeguts.currentUser()
window.Cudloun.babeguts.currentUserCandidates()
```

Babeguts lives in:

```text
modules/sys-babeguts.js
```

It exposes:

- `route()`
- `currentUser()`
- `currentUserCandidates()`
- `isBoardPage()`
- `allPosts()`
- `visiblePosts()`
- `postParts(post)`
- `visibleMenus(kind)`
- `visiblePostMenus()`
- `visibleBoardMenus()`
- `visibleAvatarMenus()`
- `smallestVisibleMenu(kind)`
- `inspect()`

Known menu kinds:

```text
post
board
avatar
unknown
```

## Board Page Lab Species

Use this board as the baseline lab page:

```text
https://babeta.okoun.cz/boards/nepotrebny_pokus
```

Live scan on 2026-05-26 found:

```text
route.type: board
route.boardId: nepotrebny_pokus
visible posts: 3
avatars: 3
reply buttons: 3
post menu buttons: 3
reply metadata blocks: 1
```

Stable enough selectors observed there:

```text
.content-item.board-post
.avatar-container
.reply-button
button[aria-label="menu"]
li[role="menuitem"]
```

Do not treat generated MUI classes like `css-1ta6gwn` as stable hooks.

## Other Page Species

Live scan on 2026-05-26 covered home, Vzkaznik, and Oblibene.

Home:

```text
path: /
title: Okoun <...><
content items: 0
board posts: 0
visible links: top nav plus board links
visible buttons: user menu plus MUI tabs
chips: unread counters
```

Useful home hooks:

```text
a[href="/"]
a[href="/messages"]
a[href^="/fav/topics"]
.MuiTab-root
.MuiListItem-root[href^="/boards/"]
.MuiChip-root
```

Logged-in user signal on desktop:

```text
button[aria-label="Uživatelské menu"] img[alt]
```

Desktop avatar menu opens as a top-right MUI popover. The opened menu contains actions such as `Moderované kluby`, `Nastavení`, `Barevné schéma`, and `Odhlásit se`, but not the username itself.

Home board rows are link/list rows, not `.content-item` posts.

Vzkaznik:

```text
path: /messages
content items: message cards
board posts: 0
avatars: message avatars
inputs: compose/reply fields
```

Useful Vzkaznik hooks:

```text
.content-item.message-item
.content-item.outgoing.message-item
.content-item.incoming.message-item
.avatar-container
.reply-button
button[aria-label="menu"]
```

Do not quote Vzkaznik text into notes or logs. Treat it as private user content. Record structure, counts, selectors, and layout only.

Oblibene:

```text
path: /fav/topics
common query: ?unread
content items: 0
board posts: 0
layout: expanded MUI accordions containing board list rows
chips: unread counters
tabs: theme/activity views
```

Useful Oblibene hooks:

```text
a[href^="/fav/topics"]
a[href^="/mod/topics"]
.MuiAccordion-root
.MuiAccordionSummary-root
.MuiListItem-container
.MuiListItem-root[href^="/boards/"]
.MuiChip-root
button[aria-label="Odebrat z oblíbených"]
```

Oblibene is the right lab for chip/unread-counter work. `favorite-pill-colors` currently targets these unread chips.

Logged-in user signal on mobile:

```text
.MuiBottomNavigationAction-root
.MuiBottomNavigationAction-root img[alt]
```

Mobile avatar menu opens as a bottom MUI drawer. Like desktop, the opened menu contains action labels but not the username. Parse the user from the bottom navigation avatar trigger before or after opening the drawer.

## Feedback Backend Notes

Firestore has been prepared for future Cudloun discussion threads in project:

```text
murkypond-vault-fc61c
```

Prepared roots:

```text
cudlounMeta/feedback
cudlounThreads/{threadId}
cudlounThreads/{threadId}/messages
```

Initial thread IDs:

```text
framework_cudloun
module_settoun
module_containers
module_post-tweaks
container_favorite-pill-colors
```

`modules/sys-feedback.js` renders these threads in the Cudloun hub. Module pages get their own Feedback panel, and container cards get container-specific Feedback panels.

Use these threads for long-form per-feature feedback, not real-time coordination. Babeta username parsing should be treated as best-effort display identity only. Do not put service account keys, Firebase Admin credentials, Okoun credentials, or Babeta invite data into Cudloun client code.

Before public use, tighten Firebase rules so clients can read threads and create message docs only. Client writes should validate allowed fields and length limits, and should not allow edits or deletes.

## Post Parts

Prefer:

```js
const posts = Cudloun.babeguts.visiblePosts();
const parts = Cudloun.babeguts.postParts(posts[0]);
```

`postParts(post)` returns:

```text
post
row
avatar
content
header
body
actions
reply
replyMeta
dateWrap
postMenuButton
```

Use this before moving buttons, changing spacing, or attaching observers.

## MUI Menu Trap

Babeta leaves hidden MUI surfaces in the DOM.

Examples:

```text
.MuiModal-hidden
bottom drawers parked below viewport
old role="presentation" wrappers
hidden avatar/login drawers
```

So this is not enough:

```js
document.querySelectorAll('[role="dialog"]')
```

Use:

```js
Cudloun.babeguts.visibleMenus()
Cudloun.babeguts.visiblePostMenus()
Cudloun.babeguts.smallestVisibleMenu("post")
```

On desktop, the post menu is a MUI popover/menu.

On mobile, the post menu is a bottom drawer/dialog. When `post-tweaks` popout mode is enabled, it can be restyled into a smaller anchored popout.

## Post Tweaks Relationship

`modules/post-tweaks.js` uses Babeguts when Cudloun is present:

```text
getBabegutsPosts()
getBabegutsParts(post)
smallestVisibleMenu("post")
```

It keeps standalone fallbacks for direct console development, but it is now shipped as a normal module, not through `containers.json`.

## Useful Console Snippets

Inspect current page:

```js
Cudloun.babeguts.inspect()
```

List post summaries:

```js
Cudloun.babeguts.visiblePosts().map((post, index) => ({
  index,
  ...Cudloun.babeguts.postParts(post),
}))
```

Find current post menu:

```js
Cudloun.babeguts.smallestVisibleMenu("post")
```

Check what menus Babeta currently has open:

```js
Cudloun.babeguts.visibleMenus().map(({ kind, text, rect, itemCount }) => ({
  kind,
  text,
  rect,
  itemCount,
}))
```

## Update Discipline

When a future Cudloun task discovers a durable Babeta DOM fact, update this file.

Keep it practical:

- verified selector
- page/route where it was observed
- desktop vs mobile difference
- hidden MUI surface gotcha
- helper that should own the knowledge
