# Cudloun User Needs Tracker

Working notes from live Babeta/Okoun discussions. Keep this as summarized product input, not a post archive.

## 2026-06-07 - Malovanky a mopedy

Source:

```text
https://babeta.okoun.cz/boards/maiovanky_a_mopedy
```

Observed page:

```text
Malovanky a mopedy - Okoun
306 posts
recent page sampled through okoun-gateway Babeta profile
```

### Needs

- Mobile performance matters on more than old phones. Users report Babeta stuttering on current Android devices and tablets, and compare it unfavorably with classic Okoun's speed.
- Keep mobile and desktop navigation locations consistent where possible. A user specifically complained that `Oblibene` is bottom navigation on phone but top navigation on iPad/desktop, causing repeated lookup friction.
- Do not assume phone users are a tiny minority. The thread states mobile visits are a substantial share, possibly close to half.
- Preserve or improve post text wrapping. A user asked for wrapping in posts to be fixed.
- Support clearer separation between posts. Users mention dividers, vertical unread markers, and avoiding content visually merging into one flat surface.
- Dark theme needs a darker/black option and less intense unread highlighting for night reading.
- Landscape mobile/tablet layout needs attention. Wide navigation/pager/contribution bars can consume too much vertical space.
- Image rendering needs careful handling. Users discussed respecting author-provided image dimensions, avoiding layout jumps, avoiding bad thumbhash flashes, and keeping oversized images constrained predictably.
- Threaded/reply-oriented views are wanted. Users asked to bring back thread context or add thread links to posts.
- Account/email flows need clarity. Users objected to persistent email verification banners, missing/unclear email change flow in Babeta, and weak email-only password reset semantics.

### Cudloun Opportunities

- Post Tweaks should keep mobile-first controls, but shared desktop controls are useful for post separation, background, font scale, and image bounds.
- A navigation tweak module/container could prototype top mobile shortcuts for `Oblibene`, `Vzkaznik`, or other cross-device consistent actions.
- A readability module could prototype darker dark mode, toned-down unread markers, and post separators.
- An image tweak module could prototype client-side fixes for max image dimensions, thumbhash/background cleanup, and layout jump reduction.
- A thread helper could prototype reply-chain affordances before Babeta's native thread UI settles.

### Evidence Pointers

- 2026-06-06: pan_sof, Lucifer, and koles discuss Babeta performance on Android/mobile/tablet.
- 2026-06-05: invain and Fredie discuss inconsistent favorite navigation placement between phone and larger screens.
- 2026-06-05: Leknin asks for post wrapping to be fixed.
- 2026-05-27: Lucifer gives mobile/tablet dark-mode, separator, landscape, and unread-marker feedback.
- 2026-05-31: koles, pixycz, Lucifer discuss image dimensions, thumbhash, placeholder behavior, and layout stability.
- 2026-05-25: Leknin and koles discuss thread views.
- 2026-05-25: hacker_, koles, Lucifer discuss email banner, email change, reset, MFA/passkey implications.
