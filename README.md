# cudloun

<p align="center">
  <img src="kapybaroun.png" alt="Cudloun" width="360">
</p>

Kapybara extension framework for Okoun userscripts.

Install:

```text
https://raw.githubusercontent.com/hanenashi/cudloun/main/cudloun.user.js
```

## Archive

Babeta support ended at `0.4.48`.

Archived tags:

- `v0.4.48`
- `v0.4.48-babeta-compatible`

Use those tags for the last Babeta-compatible code, docs, modules, and containers. `main` is Kapybara-only from `0.5.0` onward.

## Current Shape

- `cudloun.user.js` is the installable userscript seed.
- `cudloun.bundle.js` is the generated runtime loaded through userscript `@require`.
- `modules/core.js` owns module loading and shared Cudloun runtime APIs.
- `modules/sys-logger.js` owns logging controls.
- `modules/sys-kapyguts.js` owns the shared Kapybara DOM dictionary.
- `modules/sys-feedback.js` owns Firestore-backed per-feature feedback threads.
- `modules/sys-menu.js` owns Kapybara account-menu injection and the Cudloun hub.
- `modules/settoun.js` owns framework settings for Cudloun itself.
- `modules/kapybara-theme.js` owns the experimental Kapybara dark theme.
- `modules/thread-lane.js` owns the experimental mobile reply-thread side lane.

The installable seed uses `@require` so CSP-strict frontends such as Kapybara do not block startup. Source modules stay separate in `modules/`; run this after source changes:

```text
node scripts/build-bundle.js
```

## Kapyguts

`modules/sys-kapyguts.js` exposes a Kapybara DOM dictionary at:

```js
window.Cudloun.kapyguts
```

It starts with route helpers, current-user candidates, board post helpers for `article.post`, visible menu helpers, and a compact `inspect()` snapshot.

Keep `kapyguts.md` updated as the quick field guide for Kapybara live-DOM tweaking sessions.

## Feedback Backend

Cudloun feedback/discussion threads are per-framework and per-module boards where normal users can try UI changes and leave ideas before anything is proposed upstream.

Firebase project:

```text
murkypond-vault-fc61c
```

Prepared Firestore roots:

```text
cudlounMeta/feedback
cudlounThreads/framework_cudloun
cudlounThreads/module_settoun
```

Each `cudlounThreads/{threadId}` document owns a `messages` subcollection. The intended client message shape is:

```js
{
  schemaVersion: 1,
  author: "Kapybara visible username",
  text: "Feedback text",
  ts: 1710000000000,
  route: "/boards/board_name",
  cudlounVersion: "0.5.0",
  userAgentHint: "mobile or desktop hint",
  parentId: "optional parent message document id",
  parentAuthor: "optional parent author label",
  parentExcerpt: "optional short parent text excerpt"
}
```

The visible Kapybara username is convenience identity, not authentication. `parentId`, `parentAuthor`, and `parentExcerpt` are optional and only present on replies. The client shows Delete for messages owned by the current visible Kapybara user, and for all messages when the visible user is `Blasnik`.

Before opening this to real users, Firebase rules should allow public reads and message creates only, reject client edits/deletes unless there is a server-side/admin story, validate the allowed fields, and cap feedback text length.

## Version 0.5.2 TL;DR

- Added the experimental Thread Lane module for mobile reply-thread side reading.
- Tapping a `Re:` reference opens the visible thread in a right-hand lane, newest first.

## Version 0.5.1 TL;DR

- Added the experimental Kapybara Theme module for a dark Kapybara skin.
- Keeps the theme removable: disabling the module removes its root marker and injected stylesheet.

## Version 0.5.0 TL;DR

- Tagged `v0.4.48` and `v0.4.48-babeta-compatible` as the archived Babeta-compatible line.
- Removed Babeta userscript matching from `main`.
- Removed Babeta DOM helpers, Babeta tweak modules, and Babeta containers from active code.
- Kept the Kapybara hub, Kapyguts, feedback, logging, and Settoun as the new base.
