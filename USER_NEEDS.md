# Cudloun User Needs Tracker

Working notes from live Babeta/Okoun discussions. Keep this as summarized product input, not a post archive.

## 2026-06-07 - Malovanky a mopedy

Source:

```text
https://babeta.okoun.cz/boards/malovanky_a_mopedy
```

Coverage:

```text
Board title: Malovanky a mopedy
Board size at sampling time: 306 posts
Profile: okoun-gateway Babeta profile
Windows sampled: newest page, ?f=20260517-194331, ?f=20260513-013750,
?f=20260506-200445, ?f=20260504-181908, ?f=20260427-161616, ?f=0
Observed range: 2026-04-27 through 2026-06-06
```

### Performance and Loading

- Mobile/tablet performance is a primary user need, not an edge case. Users report Babeta stuttering on current Android phones, tablets, and iPad-sized devices, with classic Okoun used as the speed baseline.
- Slow club entry is visible as skeleton placeholders, delayed first content, and blank regions while scrolling. One tablet report describes waiting after scroll before content appears.
- Users connect performance to page size and client work. The discussion mentions large post windows, heavy JavaScript, and CPU work more than raw RAM.
- Admin attention is already on moderation and tablet performance, so Cudloun prototypes should be measurable and reversible rather than broad rewrites.

### Navigation and Read State

- Navigation placement should be more consistent across phone, tablet, and desktop. `Oblibene` moving between bottom navigation on phones and top navigation on larger screens causes repeated lookup friction.
- Landscape mobile/tablet layouts need specific treatment. Wide nav/pager/contribution bars can consume too much vertical space, leaving little room for posts.
- Favorites/new-post flows are confusing in Babeta. Users mention favorite boards appearing differently than in classic and missing one-click ways to remove/clear a club from favorites or new-post state.
- Read-state behavior across mobile and desktop matters. Users describe "odnovovani" / marking-read behavior as confusing, delayed, or unreliable when reading the same club on multiple devices.
- After writing a post, returning to "all posts" can jump to the end of a club, which is bad while catching up on multi-page unread discussions.

### Post Layout and Readability

- Post text wrapping needs fixing or stronger guarantees.
- Stronger visual separation between posts is wanted. Users mention dividers, vertical unread markers, and avoiding one flat merged surface.
- Dark theme needs a darker or true-black option and calmer unread highlighting for night reading. Current blue/bright tones are too intense for some users.
- Users want post controls and metadata to remain compact, especially on mobile and landscape.
- Dates and direct post affordances should be clearer. A user specifically wanted the post date to act as a direct link into the club context instead of only copying.

### Composer and Drafting

- Opening the new-post composer currently hides the club content, which is a major friction point for users who want to react to several posts without replying to one exact post.
- Some users do not understand how to send a message on mobile. The send/post action needs clearer placement and state.
- The `+PRISPET*` label/entry point was called confusing, including the asterisk.
- Markdown/rich-text switching can mangle blank lines. Users want a reliable plain textarea or Markdown mode.
- The editor can freeze or become hard to use after inserting images, especially repeated paste/insert flows.
- Draft image placeholders can persist, be hard to delete, or block continued text editing. Users need clear discard/remove and draft rescue behavior.
- ESC closing/discarding composer state is risky when a draft contains work.

### Image Handling

- Image rendering is the biggest repeated feature area in this board. Users discuss insertion, dimensions, cropping, search, galleries, privacy, and layout stability.
- Respect author-provided image dimensions where possible, including explicit `width` and `height`.
- Avoid layout jumps by preallocating image space, but avoid intrusive generated inline styles that make posts harder to control.
- Thumbhash/placeholders should not flicker or flash badly, especially in Firefox.
- Oversized images should be constrained predictably. Users want control over maximum size and exact display dimensions.
- Server-side or automatic cropping is disliked in image-heavy clubs unless it is optional. A reduced full-image thumbnail is preferred over cutting off important image content.
- Image posts that are long because of one large photo or multiple photos should not be treated like ordinary overlong text posts.
- Users want easier image insertion from external sources such as Peklo/OPU and Flickr. Desktop paste, URL paste, and pasted `<img>` HTML should offer conversion to an inline uploaded image.
- Preview before posting is important when image insertion mode is unclear.
- Hotlinking/privacy tradeoffs matter. Babeta intentionally uploads images to `media.okoun.cz`, but users still need a clear workflow for linked albums and external image sources.
- Image gallery features are desired in selected clubs, with moderator-level controls.
- Search/filtering for image posts is requested, including finding image posts by user or keyword.
- Vzkaznik image insertion was reported as not working.

### Search and Context

- Search results can open an isolated single post without surrounding context. Users want a way back into the club around that post.
- Classic-style searches for posts containing images by user/keyword are expected but not fully working in Babeta.
- A search-in-club icon was reported as doing nothing after click.
- Pagination bugs matter. A 139-post club reportedly showed only page 1 with no page 2.
- Direct links should support context. Users want dates/post links that navigate into the club around the post, not just copied IDs.

### Threads and Replies

- Thread context is wanted even by users who prefer chronological reading. They want a direct link to a thread without switching the whole club permanently to threaded view.
- Users asked for return/restore of thread context or links from posts into their thread.
- Do not force threaded posting. Several posts describe replying generally to multiple people while still needing previous posts visible.
- A reply-chain helper should support "show context around this reply" and "return to chronological position" rather than just replacing chronological reading.

### Account, Session, and Access

- Persistent email verification banners are annoying when users cannot resolve them immediately.
- Babeta needs a clearer email change flow.
- Password reset based only on email raises security concerns. MFA, passkeys, or authenticator-app options were discussed as desired future protections.
- Session state can appear logged out after a pause until reload, on both mobile and desktop.
- Opening inaccessible clubs should show a useful access/permission message. A raw "Response not successful: Received status code 500" was reported.

### Moderation and Settings

- Moderator controls are expected for club-level visual/media behavior, especially image gallery behavior.
- Users may not understand where post settings or board settings live; settings affordances should be discoverable without adding clutter.
- Admin-facing changes should preserve classic Okoun expectations where possible, because users keep comparing Babeta to classic for speed, navigation, search, and reading state.

### Cudloun Opportunities

- `post-tweaks`: keep mobile-first layout controls, but use shared desktop controls for post separation, background, font scale, image bounds, and calmer unread markers.
- `nav-tweaks`: prototype consistent shortcuts for `Oblibene`, `Vzkaznik`, search, and board actions across phone/tablet/desktop.
- `readability-tweaks`: prototype true-black dark mode, less intense unread markers, clearer dividers, and compact landscape chrome.
- `image-tweaks`: prototype max image dimensions, full-thumbnail instead of crop, thumbhash cleanup, preserved dimensions, and layout-jump reduction.
- `composer-helper`: keep previous posts visible while composing, add draft rescue/discard affordances, clarify send/post, and stabilize plain/Markdown/image insertion modes.
- `thread-context`: add lightweight "show thread", "show parent/replies", and "back to chronological context" affordances without forcing threaded mode.
- `search-context`: open searched posts with neighboring posts and direct board-position links.
- `performance-probe`: measure first-content delay, skeleton duration, scroll blank gaps, post count, and image placeholder time so users can report reproducible data before escalating to admin.
- `access-helper`: replace raw load failures with clearer permission/access messages when Babeta surfaces generic errors.

### Evidence Pointers

- 2026-06-06 and 2026-06-05: pan_sof, Lucifer, koles, invain, Fredie discuss mobile/tablet performance and navigation placement.
- 2026-05-31 through 2026-05-25: koles, pixycz, Lucifer, Leknin, hacker_ discuss image dimensions, thumbhashes, layout stability, threads, and account/email flows.
- 2026-05-17 through 2026-05-10: posts discuss image search, pagination/search bugs, reply editor freezes, search-result context, slow tablet loading, Vzkaznik image insertion, favorites, and unread/read-state behavior.
- 2026-05-06 through 2026-05-03: posts discuss post-composer context loss, mobile send discoverability, `+PRISPET*`, Markdown/plain textarea behavior, image placeholders, draft discard, session state, and post separation.
- 2026-04-30 through 2026-04-27: posts discuss image cropping, external image insertion, hotlink/privacy policy, direct post/thread links, access errors, and the usefulness of periodic AI summaries.
