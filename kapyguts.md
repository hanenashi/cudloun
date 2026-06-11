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
- `visibleMenus(kind)`
- `visiblePostMenus()`
- `inspect()`

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

## Page Structure Differences From Babeta

Kapybara is not MUI-shaped.

Babeta board posts:

```text
div.content-item.board-post
.MuiPaper-root
```

Kapybara board posts:

```text
article.post
data-post-id
data-thread-id
```

Kapybara still loads JavaScript chunks, but content is server-rendered into the document earlier. In a quick 2026-06-11 board sample, Kapybara had fewer elements than Babeta on the same board, while sending a larger rendered HTML body.

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

## Update Discipline

When future Cudloun work discovers a durable Kapybara DOM fact, update this file.

Keep it practical:

- verified selector
- page/route where it was observed
- desktop vs mobile difference
- helper that should own the knowledge
