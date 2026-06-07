# Cudloun User Needs Coverage Plan

Action plan derived from `USER_NEEDS.md`. This is intentionally scoped to things Cudloun can prototype for normal users before asking Babeta admin to adopt native changes.

## Already Coverable

These needs can be tested with existing Cudloun surface, mostly `post-tweaks` plus the framework feedback panel.

### Post Readability

- Stronger post separation: `post-tweaks` already has post spacing, dividers, and optional post background.
- Mobile compactness: `post-tweaks` already supports compact mobile card layout, avatar size, side padding, card inset, reply placement, and reply metadata placement.
- Desktop/shared readability: `post-tweaks` already applies shared controls for spacing, divider, background, header scale, body font scale, image bounds, and pop-out post menu.
- Post wrapping and overflow reduction: `post-tweaks` already forces post content and images into bounded widths on mobile and shared post surfaces.
- Reply/menu ergonomics: `post-tweaks` already supports moving reply to header/menu, opening the post menu from avatar click, and popping menus out of cramped mobile overlays.

### Feedback Collection

- Per-module and per-container discussion: `sys-feedback` already exposes Firebase-backed feedback threads in Cudloun panels.
- User attribution: `sys-babeguts` already parses the logged-in Babeta user from desktop and mobile avatar/menu surfaces.
- Feature idea capture before admin escalation: existing feedback threads can collect reports against `module_post-tweaks`, `module_containers`, `container_favorite-pill-colors`, and framework threads.

## Small Extensions to Existing Modules

These should be the next low-risk changes because they extend `post-tweaks` rather than creating new modules.

### Post Tweaks 0.5 Target

- Add a true-black/dim dark readability option independent of Babeta theme.
- Add calmer unread markers, including toned-down unread background and optional vertical marker style.
- Add a landscape-compact mode that reduces post chrome and action row height when viewport height is low.
- Add explicit image max-height and full-thumbnail controls so large image posts are scaled instead of feeling cropped or oversized.
- Add optional date-link enhancement if Babeta exposes stable post URLs in the DOM.
- Add a "mobile reading preset" that enables sensible defaults for spacing, divider, image bounds, compact replies, and menu pop-out.

## Next New Modules

These needs do not belong in `post-tweaks` because they touch navigation, compose flows, search, or instrumentation.

### 1. `performance-probe`

Purpose: collect reproducible performance evidence from users.

- Measure time from page navigation to first visible post.
- Measure skeleton/placeholder lifetime where detectable.
- Detect blank-scroll gaps by sampling visible post count during scroll.
- Count visible posts, images, and loaded image placeholders.
- Provide a copyable report users can paste into Cudloun feedback or Okoun boards.

Why first: users repeatedly report performance, but admin needs concrete device/page evidence. This module is low-risk because it observes instead of changing Babeta behavior.

### 2. `image-tweaks`

Purpose: prototype image display fixes for image-heavy clubs.

- Max image width and max image height controls.
- "Full thumbnail" mode that prefers scaled full images over cropped-looking long posts.
- Thumbhash/placeholder cleanup options.
- Preserve author dimensions where Babeta leaves `width`/`height` available.
- Optional image-post highlighting or image-only scanning on the current page.

Why second: image handling is the largest repeated need cluster and can be prototyped mostly with CSS/DOM adjustments.

### 3. `nav-tweaks`

Purpose: reduce cross-device navigation friction.

- Add consistent quick actions for `Oblibene`, `Vzkaznik`, current board search, top/bottom of board, and contribution entry.
- Offer a mobile top-shortcut strip so important actions are not only in bottom navigation.
- Offer compact landscape navigation when viewport height is low.
- Keep shortcuts optional and visually restrained.

Why third: navigation complaints are frequent, but selector stability must be checked on live mobile and desktop Babeta pages.

### 4. `composer-helper`

Purpose: protect drafting and keep context visible.

- Preserve visible board context while composing where possible.
- Add draft warning/rescue when composer is about to close.
- Clarify submit/send action on mobile.
- Add image draft cleanup affordances if Babeta editor DOM permits it.
- Add a plain/Markdown mode helper only if it can avoid corrupting native editor state.

Why fourth: important user pain, but higher risk because it touches editor state and post submission flows.

### 5. `thread-context`

Purpose: help chronological readers inspect reply context.

- Add "show thread/context" affordance near reply metadata.
- Add "back to chronological position" affordance after following context links.
- Avoid forcing threaded mode as the default reading model.

Why fifth: useful, but depends heavily on whether Babeta exposes stable parent/reply links in page markup.

### 6. `search-context`

Purpose: make search results usable in context.

- Enhance search-result post links to open the surrounding board area when stable URLs exist.
- Add local current-page filters for images, author, and keyword as a prototype.
- Track broken search-in-club affordances with copyable diagnostics.

Why sixth: native search and pagination bugs may need admin-side fixes; Cudloun can mainly prototype context affordances and diagnostics.

### 7. `access-helper`

Purpose: replace generic load/access failures with useful user-facing hints.

- Detect raw Babeta load errors such as 500 responses for inaccessible clubs.
- Show a small explanation that the club may be private, unavailable, or lacking permissions.
- Provide a copyable diagnostic line.

Why seventh: small and useful, but less central to the current Cudloun module-feedback goal.

## Needs Better Left to Babeta Native

Cudloun can collect feedback and sometimes prototype UI around these, but native implementation is the real target.

- Email verification, email change, password reset, MFA, passkeys, and account security.
- Reliable server-side read-state synchronization across devices.
- True pagination correctness and server search correctness.
- Image upload pipeline, media privacy policy, and external image conversion into hosted media.
- Moderator-owned gallery settings and board-level media policy.
- Session/auth state reliability after idle or login transitions.

## Suggested Target Order

1. Extend `post-tweaks` with dark/unread/landscape/image sizing presets.
2. Build `performance-probe` so user complaints become measurable reports.
3. Build `image-tweaks` for image-heavy clubs.
4. Build `nav-tweaks` for cross-device action consistency.
5. Build `composer-helper` after live editor selectors are sampled carefully.
6. Build `thread-context` and `search-context` once stable post/thread/search URLs are confirmed.
7. Add `access-helper` when there is a clean pattern for detecting Babeta load errors.

## Validation Approach

- Sample every new module on both desktop and mobile Babeta layouts through `okoun-gateway`.
- Keep every feature disabled by default unless it is observably harmless.
- Each module should include a copyable settings/report block so users can paste exactly what they tried into Cudloun feedback.
- Promote only repeatedly useful prototypes to admin-facing proposals.
