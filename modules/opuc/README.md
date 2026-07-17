# OPUc for Kapybara

Implementation roadmap for bringing the useful OPUc Ultimate image workflow into
Cudloun and Kapybara's native new-post and reply composers.

Status: Phase 1 implemented and live-verified; default-disabled while the module
remains experimental.

## Implemented in Cudloun 0.6.0

- Ordered multi-file Cudloun module loading.
- Shared Kapyguts discovery for dynamic new-post and reply composers.
- One OPUc launcher per composer, aligned below the native image control.
- Independent per-composer file, preview, request, and cleanup state.
- One-file validation, OPU upload with progress/cancel handling, and retry UI.
- Validated OPU response parsing and native Lexical URL-image insertion.
- Module settings for a conservative upload-size limit.

Live verification on 2026-07-17 covered desktop and mobile layout, simultaneous
composer isolation, simulated upload UI, one real anonymous OPU upload, native
Lexical insertion, module disable cleanup, and composer-close cleanup. No
Kapybara post was submitted by these checks.

## Firefox compatibility in Cudloun 0.6.1

Firefox userscript managers may expose successful request content through
`response` while leaving `responseText` unavailable. OPUc normalizes string,
Blob, document, XML, and plain-object responses before extracting the returned
OPU URL. Extraction also accepts the known link input plus direct anchor, image,
relative, protocol-relative, and safely validated raw URL shapes.

## Firefox session compatibility in Cudloun 0.6.2

OPU stores each successful upload result in a PHP session and redirects to
`?page=done`. Some Firefox/userscript-manager combinations follow that redirect
without retaining OPU's new session cookie, so they receive the blank upload
form instead of the result. OPUc now establishes a credentialed OPU session
before posting, explicitly enables credentials on GM requests, and retries the
session-backed result page once when the upload response contains no URL.

## Firefox blocked-cookie compatibility in Cudloun 0.6.3

When Firefox isolates the userscript manager's OPU cookie store, credential
flags alone may not preserve the PHP session. OPUc now explicitly selects the
`https://opu.peklo.biz` cookie partition. As a fallback, it extracts only safe
OPU-prefixed cookie name/value pairs from OPU's privileged response headers,
then supplies the pair explicitly to the upload and result requests. The cookie
value is kept in the request closure and is never logged, stored, or included
in error messages.

## Firefox first-party handoff in Cudloun 0.6.4

Some Firefox userscript managers both isolate OPU cookies and redact the
`Set-Cookie` response header, leaving no cookie-based repair available to the
Kapybara page. Firefox therefore opens a small first-party OPU upload window
from the user's Upload click. The selected file is passed to that exact window,
which performs a same-origin multipart request with first-party cookies. The
OPU-side Cudloun bridge validates the returned `https://opu.peklo.biz/p/` URL,
sends only that URL back to `https://kapybara.okoun.cz`, and closes. The bridge
accepts results only from the exact OPU origin and matching popup.

## Decision

Build this as a first-class Cudloun module under `modules/opuc/`, not as a new
repository and not by loading the classic OPUc userscript inside Kapybara.

Reasons:

- Cudloun already owns Kapybara targeting, module lifecycle, settings, logging,
  bundling, and the account-menu hub.
- The classic OPUc runtime assumes classic Okoun forms and textareas. Kapybara
  uses dynamic Lexical `contenteditable` composers, so the DOM and insertion
  layers must be rewritten even if the image and OPU logic is reused.
- Keeping the port here gives one userscript installation and one release
  version. A shared repository can be extracted later only if stable,
  framework-neutral code genuinely needs to be consumed by both projects.

Proposed module identity:

```text
id: opuc
name: OPUc for Kapybara
defaultEnabled: false while experimental
```

## User Experience Contract

Kapybara's native image feature must remain present and unchanged.

For every visible new-post or reply composer, Cudloun adds one compact OPUc
launcher in a second row directly below the native formatting toolbar. On
desktop its horizontal position follows the native `Vložit obrázek` button; on
narrow layouts it may flow to the start of the second row rather than overlap or
overflow the composer.

Selecting the launcher opens an OPUc panel owned by that composer. A file added
from one reply must never be inserted into another reply or into the new-post
composer. Closing a composer destroys its pending UI and releases object URLs.

The first release should coexist with, not replace, Kapybara's native file,
personal-image, and URL insertion dialog.

## Verified Kapybara Integration Points

Observed on `https://kapybara.okoun.cz/boards/nepotrebny_pokus` on 2026-07-17:

```text
new post:  section.new-post-composer[aria-label="Nový příspěvek"]
reply:     section.reply-composer[aria-label="Odpověď"]
composer:  .composer
editor:    .composer-editor
editable:  .composer-content-editable[role="textbox"][contenteditable="true"]
slot:      .composer-toolbar-slot
toolbar:   [role="toolbar"][aria-label="Formátování textu"]
image:     button[aria-label="Vložit obrázek"]
```

The native image dialog provides `Ze souboru`, `Z mých obrázků`, and `Z URL`.
Inserting an external URL through it creates a Lexical decorator image node.

These facts imply two rules:

1. Do not reuse OPUc Ultimate's textarea mutation or HTML/Markdown/Radeox tag
   injection.
2. For the MVP, insert an uploaded OPU URL through Kapybara's native URL image
   flow. Do not reach into private Lexical or framework properties.

Kapyguts owns these selectors and exposes composer helpers so the module does
not invent its own Kapybara dictionary.

## Proposed Source Layout

```text
modules/opuc/
├── README.md                 # this plan and module field notes
├── client.js                 # OPU auth, upload, response parsing, thumbnails
├── image-pipeline.js         # resize/format conversion and later crop helpers
├── kapybara-adapter.js       # composer discovery, launcher placement, native insertion
├── queue.js                   # per-composer queue and upload state
├── ui.js                      # staging panel, progress, errors, module settings UI
├── styles.js                  # namespaced removable styles
└── index.js                   # module registration, start, cleanup, help
```

To support this without a generated bundle inside the generated Cudloun bundle,
extend the Cudloun manifest once to accept an ordered `files` array for a module:

```json
{
  "id": "opuc",
  "files": [
    "modules/opuc/client.js",
    "modules/opuc/image-pipeline.js",
    "modules/opuc/kapybara-adapter.js",
    "modules/opuc/queue.js",
    "modules/opuc/ui.js",
    "modules/opuc/styles.js",
    "modules/opuc/index.js"
  ],
  "defaultEnabled": false
}
```

`modules/core.js` and `scripts/build-bundle.js` should continue accepting the
current singular `file` form as well. Only `index.js` registers the module;
earlier files attach private OPUc services to a temporary module namespace.

## Porting Map

Reuse with cleanup and tests:

- OPU login probe against the user panel.
- Upload request fields for `opupload.php`.
- Upload-response link extraction.
- OPU thumbnail URL derivation.
- Canvas resize and JPEG/WEBP conversion rules.
- Queue concepts: selection, reorder, remove, progress, cancel, and retry.

Rewrite for Cudloun/Kapybara:

- Global `window.OPUc*` objects become module-owned services and state.
- GM/localStorage settings become `ctx.storage` settings.
- Classic Okoun textarea/form discovery becomes Kapyguts composer discovery.
- Global active textarea and global queue become a
  `WeakMap<composerElement, ComposerSession>`.
- Text syntax generation becomes native Kapybara image insertion.
- Classic button wrappers, staging DOM, modals, and CSS become namespaced,
  removable Cudloun UI.
- Startup and global observers become the Cudloun `start()` cleanup contract.

Defer until the core path is stable:

- OPU gallery.
- Cropper studio.
- Captions, linked thumbnails, and width overrides.
- Clipboard image interception, drag/drop interception, and URL leeching.
- Crash recovery and EXIF/privacy work.

## Roadmap

### Phase 0: Framework and DOM foundation

- Add composer facts to `sys-kapyguts.js`:
  `allComposers()`, `composerParts()`, and a composer observer/helper.
- Add ordered multi-file module support while preserving existing manifests.
- Add `@connect opu.peklo.biz` to the Cudloun seed. Do not add `@connect *`.
- Register an experimental, default-disabled `opuc` module with complete cleanup.
- Add a launcher to both dynamically created composer types, idempotently.
- Align the launcher below the native image button and keep responsive fallback
  behavior deterministic.

Exit criteria:

- Repeated composer open/close cycles never duplicate launchers.
- New-post and reply composers are both detected.
- Disabling the module removes injected DOM, styles, observers, object URLs, and
  listeners without reloading the page.
- Native image insertion continues working unchanged.

### Phase 1: Minimal upload-to-editor path

- Implement the OPU login probe and one-file upload transport.
- Use a local hidden file input opened from the OPUc launcher.
- Validate file type and enforce a conservative size guard before upload.
- Parse and validate the returned URL as HTTPS on `opu.peklo.biz`.
- Hand the returned URL to the originating composer's native `Z URL` image flow.
- Show visible pending, success, cancellation, and error states.
- Never submit the Kapybara post automatically.

Exit criteria:

- A PNG and JPEG can each be selected, uploaded, and inserted as a native Lexical
  image node in both composer types.
- The user can still edit or cancel the post before submitting it.
- A failed upload preserves the file and offers retry.
- No credentials, cookies, user-panel HTML, or personal gallery content appear
  in Cudloun logs.
- A clearly labelled smoke-test post is verified only in
  `nepotrebny_pokus` after explicit write mode is enabled.

### Phase 2: Per-composer staging and batch uploads

- Add thumbnail tiles with filename, dimensions, and byte size.
- Add selection, reorder, remove, clear, cancel, and retry.
- Upload sequentially at first; preserve successful results if a later item
  fails.
- Insert each successful URL into the exact session that started the batch.
- Decide and document what happens if that composer closes mid-upload.
- Add mobile layout and keyboard/focus behavior.

Exit criteria:

- Two simultaneously open composers maintain independent queues and targets.
- Reordering determines insertion order.
- Cancel stops remaining requests and does not discard already uploaded URLs.
- Object URLs and request handles are released on cleanup.

### Phase 3: Image processing

- Port ingestion downscaling and manual optimization as pure functions.
- Support original, JPEG, and WEBP output with explicit quality settings.
- Preserve the white-background rule when transparent PNG becomes JPEG.
- Add Cropper.js only through a CSP-compatible, pinned userscript dependency or
  a properly reviewed vendored build.
- Keep originals available until the user confirms the processed result.

Exit criteria:

- Dimension, aspect-ratio, transparency, MIME, filename, and cancellation cases
  have automated coverage.
- Large-image processing reports progress and fails without losing the queue.
- Mobile memory limits are tested before enabling automatic ingestion resize by
  default.

### Phase 4: Gallery, captions, and settings

- Port the OPU gallery with pagination and multi-select insertion.
- Map captions and link/thumbnail choices onto capabilities the native Lexical
  image model actually preserves; do not emulate unsupported HTML attributes.
- Add Cudloun settings for staging, conversion, resize, gallery thumbnail size,
  and button presentation.
- Add module help and use Cudloun's per-module feedback thread.

Exit criteria:

- Logged-out OPU state has a clear, non-destructive explanation.
- Gallery data is fetched only on demand.
- Settings are scoped under `module.opuc.*` and survive reload.
- Unsupported classic-OPUc formatting choices are omitted rather than silently
  degraded.

### Phase 5: Interceptors and parity hardening

- Add paste/drop image interception only when the event originates in a known
  Kapybara composer.
- Consider URL leeching separately because arbitrary remote URLs would require
  broader userscript network permission.
- Add route-change, multiple-composer, dark-theme, mobile, and accessibility
  regression coverage.
- Compare remaining behavior with OPUc Ultimate and explicitly mark features as
  ported, redesigned, or intentionally excluded.

Exit criteria:

- No listener survives module disable or route teardown.
- Native clipboard, drag/drop, toolbar, and submission behavior is unchanged
  when interception is disabled.
- The generated `cudloun.bundle.js` is reproducible from source and the seed,
  manifest, and README versions agree.

## Test Strategy

- Unit-test response parsing, thumbnail URL generation, image calculations,
  queue state transitions, and URL validation without live services.
- Test the Kapybara adapter against saved semantic DOM fixtures for both composer
  types; generated classes must not be assertions.
- Add a bundle check that rebuilds `cudloun.bundle.js` and fails on an unexpected
  diff.
- Use the gateway's Kapybara Chromium profile for read-only live structure
  checks.
- Restrict write smoke tests to `nepotrebny_pokus`; use recognizable test text,
  never private club content, and never auto-submit from the module.

## Safety and Release Rules

- Keep the module default-disabled until Phase 2 is stable.
- Limit network permission to `opu.peklo.biz`; revisit broader URL leeching as a
  separate user-visible permission decision.
- Do not log OPU cookies, response bodies, gallery contents, Kapybara post text,
  credentials, access codes, or browser storage.
- Validate upload response URLs before inserting them.
- Preserve attribution to OPUc Ultimate when porting algorithms or behavior.
- Version the experimental module independently inside Cudloun, then bump the
  Cudloun manifest/seed together for releases.

## First Implementation Slice

The first coding slice should stop after Phase 1. It is deliberately small:

1. Kapyguts composer helpers.
2. Multi-file manifest support.
3. Default-disabled module and launcher placement.
4. One-file OPU upload.
5. Native URL-dialog insertion into the originating composer.
6. Read-only lifecycle tests plus one authorized `nepotrebny_pokus` smoke post.

Do not begin by copying all eleven classic OPUc modules. Port the verified upload
path first, then earn staging and processing complexity one phase at a time.
