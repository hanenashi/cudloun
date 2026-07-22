# cudloun

<p align="center">
  <img src="kapybaroun.png" alt="Cudloun" width="360">
</p>

Kapybara extension framework for Okoun userscripts.

Install: [cudloun.user.js](https://raw.githubusercontent.com/hanenashi/cudloun/main/cudloun.user.js)

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
- `modules/classic-look.js` brings classic Okoun's reading rhythm to Kapybara
  posts without replacing the new frontend controls.
- `modules/post-fonts.js` owns the compact post font family and size control.
- `modules/opuc/` contains the experimental OPUc-for-Kapybara integration.

The installable seed uses `@require` so CSP-strict frontends such as Kapybara do not block startup. Source modules stay separate in `modules/`; run this after source changes:

```text
node scripts/build-bundle.js
```

## OPUc Integration

The Kapybara port of OPUc is a default-disabled Cudloun module rather than a
separate userscript or repository. Its architecture, implementation phases, and
test criteria are in [`modules/opuc/README.md`](modules/opuc/README.md).
The Firefox Greasemonkey compatibility investigation and final manager-specific
transport decision are documented in [`grease.md`](grease.md).

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

## Version 0.6.23 TL;DR

- Kapyguts 0.3.0 now owns Kapybara's viewport stripe painter and exposes its
  computed state through `pageChromeParts()` and `inspect()`; Classic Look uses
  that shared hook instead of owning the DOM selector.

## Version 0.6.22 TL;DR

- Classic Look now removes Kapybara's fixed `🐟-stripes` gradient, the hidden
  painter responsible for the 12 px blue strips at both viewport edges.

## Version 0.6.21 TL;DR

- Added a default-disabled Classic Look module with measured classic Okoun
  typography, square avatars, white post rows, compact metadata/actions, and
  strong dividers while retaining Kapybara's navigation and interactions.

## Version 0.6.20 TL;DR

- Tap or click `f` still opens the original quick post-font picker. Long-press
  it on touch screens or right-click it to open compact per-area controls for
  Posts, UI, titles, code, and the Okoun logo, plus a link to the full native
  experiment.

## Version 0.6.19 TL;DR

- Kapyguts now normalizes Kapybara's temporary native font-settings entry on
  desktop and mobile, plus exposes read-only helpers for its font roles, sizes,
  low-DPR fallback, actions, and serif experiment.

## Version 0.6.18 TL;DR

- Post Fonts now joins Kapybara's native desktop action group beside the avatar
  and uses the same transparent circular `f` treatment as the mobile toolbar.

## Version 0.6.17 TL;DR

- Removed Post Fonts availability detection and its warning UI. Browsers now
  silently resolve each CSS font stack and fall back naturally when needed.

## Version 0.6.16 TL;DR

- Replaced Post Fonts' unstable canvas-width availability guess with the
  browser's asynchronous local-font resolver, including stale-result guards
  when users switch fonts quickly on Android/Kiwi.

## Version 0.6.15 TL;DR

- Post Fonts now warns when the selected stack's first-choice font is not
  installed on the current device, while continuing to use its fallback stack.

## Version 0.6.14 TL;DR

- Added a Classic Okoun post-font preset using the original Verdana,
  Bitstream Vera Sans, Arial, and sans-serif fallback stack.

## Version 0.6.13 TL;DR

- Expanded Post Fonts with system, sans-serif, serif, monospace, and playful
  local-font presets.
- Added a persistent Custom option for safe comma-separated CSS font-family
  stacks, with invalid CSS rejected and Kapybara's default used as fallback.

## Version 0.6.12 TL;DR

- Added a default-disabled Post Fonts module with a compact `f` menu for font
  family and live post-size adjustment.
- The control uses Kapybara's sticky global header on desktop and becomes a
  reachable bottom-right floating button where the mobile header scrolls away.
- Font size can be changed with a slider or a synchronized numeric pixel input.

## Version 0.6.11 TL;DR

- OPUc now switches Kapybara to Markdown mode, inserts `![](OPU_URL)` as
  editor text, and restores formatted mode when appropriate. This bypasses the
  fragile native image dialog in both new-post and reply composers.
- Firefox/Greasemonkey's OPUc Ultimate-style direct upload is available again
  experimentally, with the selected native file input kept attached.

## Version 0.6.9 TL;DR

- OPUc re-resolves Kapybara's live composer toolbar after upload instead of
  clicking a stale React-owned image button.
- Native image insertion now recognizes dialogs, menus, and mobile bottom
  sheets, and re-finds controls after Kapybara rerenders the image flow.

## Version 0.6.8 TL;DR

- Firefox uses the first-party OPU tab only under Tampermonkey; Greasemonkey
  receives an explicit unsupported-manager message.
- Kiwi and other Chromium browsers again use the original single-request OPU
  upload path without Firefox cookie/session overrides.

## Version 0.6.7 TL;DR

- Firefox prepares selected image bytes while the native file input is still
  attached, avoiding Android Greasemonkey's detached-file limitation.
- Added FileReader, object-URL, and data-URL fallbacks with safe error names.

## Version 0.6.6 TL;DR

- Firefox now transfers raw bytes to OPU and reconstructs a fresh OPU-realm
  `File` before populating the native form.
- This avoids cross-compartment `File` wrappers that Firefox may accept as a
  Blob but silently omit from multipart form submission.

## Version 0.6.5 TL;DR

- Firefox now submits OPU's own native upload form inside the first-party tab
  and reads the rendered result page after its normal navigation.
- Removed XHR from the Firefox popup path after one manager still lost OPU's
  session across the XHR redirect.

## Version 0.6.4 TL;DR

- Firefox uploads now use a first-party OPU popup handoff because some
  userscript managers redact and isolate OPU's PHP session cookie completely.
- The popup is opened by the Upload click, returns only a validated OPU image
  URL to Kapybara, and closes automatically. Kiwi keeps the GM request path.

## Version 0.6.3 TL;DR

- Added OPU-targeted cookie partitioning plus an explicit, host-scoped session
  relay for Firefox userscript managers that isolate cross-site cookies.
- OPU session tokens are never logged or included in errors.

## Version 0.6.2 TL;DR

- Fixed OPU result recovery when Firefox loses OPU's session cookie while
  following the post-upload redirect.
- OPUc now establishes a credentialed session before upload and performs one
  credentialed result-page lookup when the redirect body has no image URL.

## Version 0.6.1 TL;DR

- Fixed OPU upload response parsing in Firefox/Violentmonkey, where response
  content may be exposed through `response` instead of `responseText`.
- Added safe fallbacks for string, Blob, document, and alternate OPU link
  response shapes.

## Version 0.6.0 TL;DR

- Added a default-disabled OPUc module for one-image OPU upload and native
  Kapybara editor insertion.
- Added shared Kapyguts helpers for dynamic new-post and reply composers.
- Added ordered multi-file module support to the loader and bundle builder.

## Version 0.5.3 TL;DR

- Fixed Cudloun injection into Kapybara's compact desktop account menu.

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
