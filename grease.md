# Firefox Greasemonkey OPU upload postmortem

This document summarizes the 2026-07-17 effort to make Cudloun's OPUc module
upload an image from Kapybara on Firefox for Android under Greasemonkey.

The short conclusion: OPU itself worked, but Firefox Greasemonkey combined two
independent incompatibilities—OPU PHP-session isolation and unreliable access
to selected `File` objects across userscript compartments. We stopped treating
all mobile browsers alike and selected a proven transport per browser/manager.

## Final support matrix

| Browser | Userscript manager | OPU transport | Status |
| --- | --- | --- | --- |
| Firefox Android | Tampermonkey | First-party OPU tab, raw-byte handoff, native OPU form | Supported and device-verified |
| Kiwi / Chromium Android | Tampermonkey | Original single `GM_xmlhttpRequest` multipart POST | Supported and device-verified |
| Firefox Android | Greasemonkey | None | Intentionally unsupported for OPUc uploads |

Firefox Greasemonkey users receive a clear message before upload telling them
to disable Cudloun in Greasemonkey and install it in Tampermonkey. This applies
to OPUc uploads; it is not a statement that every other Cudloun feature must
fail under Greasemonkey.

## Starting point

Commit `c4e128f` introduced OPUc for Kapybara in Cudloun 0.6.0. It used the
classic, simple design:

1. Select an image in the originating Kapybara composer.
2. Build a `FormData` body with `obrazek[0]` and OPU's ordinary form fields.
3. Send one `GM_xmlhttpRequest` POST to `https://opu.peklo.biz/opupload.php`.
4. Parse the returned OPU URL.
5. Insert that URL through Kapybara's native image dialog.

This worked in Kiwi with Tampermonkey. Firefox was the problem environment.

## What we tried

### 1. Normalize Firefox userscript responses — Cudloun 0.6.1

Commit `87940a2` addressed successful requests where Firefox userscript
managers exposed the response through `response` instead of `responseText`.
The parser learned to handle strings, `Blob`s, documents, XML, plain objects,
anchors, images, relative paths, and raw validated OPU URLs.

Result: response parsing became robust, but Greasemonkey still returned OPU's
blank upload form rather than the uploaded image result.

### 2. Establish and recover the OPU PHP session — Cudloun 0.6.2

Commit `639a494` added a credentialed session request before upload and a
second request to `?page=done` when the upload response contained no URL.

Why: OPU stores the result in a PHP session, then redirects to `?page=done`.
Firefox could follow the redirect without retaining the new OPU session cookie.

Observed symptom: approximately 11,271 response characters containing the
ordinary blank OPU form, with no image link.

Result: insufficient under Firefox Greasemonkey.

### 3. Select a cookie partition and relay `Set-Cookie` — Cudloun 0.6.3

Commit `7f16345` explicitly selected OPU's cookie partition and attempted to
relay only safe OPU-prefixed cookie name/value pairs from privileged response
headers. Tokens were never logged or persisted.

Result: Greasemonkey isolated the cookie store and did not expose the required
`Set-Cookie` header, so there was nothing usable to relay.

### 4. Move the upload into a first-party OPU tab — Cudloun 0.6.4

Commit `671718a` opened an OPU tab from the user's Upload click. Cudloun ran on
both Kapybara and OPU, matched requests with an unguessable ID, accepted
messages only between the exact two origins, and returned only a validated
`https://opu.peklo.biz/p/…` URL.

Goal: let OPU operate in its own first-party cookie context instead of a
cross-origin Greasemonkey request.

Result: the tab opened, but popup XHR and redirects could still land on a blank
result page or fail to expose the uploaded URL.

### 5. Submit OPU's native form — Cudloun 0.6.5

Commit `4c7e565` removed XHR from the Firefox popup path. The OPU tab received
the selected file, assigned it to OPU's real `#xpc` file input with
`DataTransfer`, and submitted the native form. The request ID survived OPU's
navigation in `window.name`.

Result: the file appeared valid in JavaScript, but Firefox could silently omit
a cross-compartment `File` from the multipart form.

### 6. Transfer raw bytes and reconstruct the file on OPU — Cudloun 0.6.6

Commit `e42e30a` read the selected image into an `ArrayBuffer`, transferred the
bytes to the OPU tab, sanitized the filename, and constructed a fresh
OPU-realm `File` before assigning it to the native input.

Result: this removed the cross-window `File` wrapper problem and worked in
Playwright Firefox, but Android Firefox Greasemonkey failed before handoff:
both `File.arrayBuffer()` and `FileReader.readAsArrayBuffer()` could fail.

### 7. Read while the native input still owns the file — Cudloun 0.6.7

Commit `a233b99` stopped clearing Kapybara's hidden file input immediately.
Byte preparation began during the selection lifecycle and cached the result
before detaching the input. Fallbacks tried, in order:

1. `Blob.arrayBuffer()`
2. `FileReader.readAsArrayBuffer()`
3. Fetching a temporary object URL
4. `FileReader.readAsDataURL()` plus base64 decoding

Safe error names were included in diagnostics without exposing file content.

Result: Firefox Tampermonkey worked through the brief OPU tab. Firefox
Greasemonkey still could not reliably read or hand off the Android-selected
file.

### 8. Stop forcing one transport onto every manager — Cudloun 0.6.8

Commit `4a5e56e` used `GM_info.scriptHandler` / `GM.info.scriptHandler` to split
the transports:

- Firefox plus Tampermonkey uses the first-party OPU tab.
- Kiwi/Chromium uses the original one-POST GM transport.
- Firefox plus Greasemonkey is rejected before network activity.

The Kiwi route dropped every Firefox-specific addition: session preflight,
result-page retry, cookie relay, cookie partition, forced credentials, and
forced response type.

This was necessary because the accumulated Firefox workarounds broke the
originally working Kiwi path: OPU received the image, but Cudloun failed to
recover the URL.

### 9. Separate upload success from Kapybara insertion — Cudloun 0.6.9

After both supported transports uploaded successfully, both browsers reported
`Kapybara's image dialog did not open.` This was not another OPU failure.

Commit `5126654` fixed a separate lifecycle bug: while upload was running,
Kapybara could replace the React-owned composer toolbar. Cudloun clicked the
old detached image button and nothing opened. The adapter now re-resolves the
live composer, supports dialogs and mobile bottom sheets, and re-finds controls
after rerenders.

Device result: Kiwi/Tampermonkey and Firefox/Tampermonkey both completed upload
and native Kapybara insertion.

## What the sibling OPU repositories taught us

- `OPUh` runs directly on OPU with `@grant none`, keeps files attached to OPU's
  native input, and rebuilds `input.files` with `DataTransfer`. It does not
  exercise cross-origin or privileged userscript file transport.
- `OPUg` observes OPU's native upload input and result pages. It does not move a
  Kapybara-selected file between origins.
- `OPUx` operates mainly on OPU's gallery/settings pages and does not provide a
  reusable upload transport.
- `OPUc_ultimate` supplied the proven direct `FormData` plus
  `GM_xmlhttpRequest` pattern that worked in Kiwi, but its classic Okoun editor
  integration could not be reused for Kapybara's dynamic Lexical composers.

The important lesson was that code working first-party on OPU says little
about a `File` selected inside Kapybara, wrapped by a privileged userscript
sandbox, and transferred to another origin.

## Why Greasemonkey remained incompatible

There was no single bug.

1. **PHP session state:** OPU redirects through session-backed `?page=done`.
   Greasemonkey could isolate or lose the OPU cookie during the cross-origin
   request and hide the response header needed to repair it.
2. **Privileged file wrappers:** Cudloun requests GM APIs, so it does not have
   the same simple first-party execution model as `OPUh`. Android-selected
   files could be previewable through an object URL while still unreadable by
   `arrayBuffer()` or `FileReader` in the Greasemonkey compartment.
3. **Cross-window files:** a wrapped `File` could pass JavaScript type checks
   and still be omitted when OPU's native form serialized its multipart body.
4. **Multiple independent stages:** an image could be stored successfully on
   OPU while URL recovery failed, or upload and URL recovery could succeed
   while the later Kapybara dialog insertion failed.

Tampermonkey on Firefox successfully handled the raw-byte first-party bridge,
so continuing to add Greasemonkey-specific complexity would have increased
risk for the two working platforms without a reliable path to success.

## Do not retry these without new evidence

- Adding more `withCredentials`, `anonymous`, cookie-partition, or explicit
  `Cookie` combinations to the direct Firefox request.
- Depending on Greasemonkey to reveal OPU's `Set-Cookie` response header.
- Performing popup XHR and expecting OPU's redirect session to survive.
- Posting a Kapybara-realm `File` directly through OPU's native form.
- Clearing the native input before Android file bytes have been prepared.
- Treating `uploaded to OPU` as proof that URL recovery or Kapybara insertion
  also succeeded.

Any future Greasemonkey attempt should begin with a small, isolated proof that
can read an Android-selected file and preserve OPU's first-party result session
under the exact current Firefox and Greasemonkey versions. Until both are
demonstrated, Firefox Tampermonkey remains the supported solution.

## Follow-up: Kapybara Markdown insertion experiment

Cudloun 0.6.11 separates upload transport from editor insertion. After an OPU
URL is validated, OPUc switches the originating Kapybara composer to its `<>`
Markdown mode, inserts `![](OPU_URL)` through the Lexical contenteditable, and
restores formatted mode when that was the user's original mode. This avoids
Kapybara's native image dialog completely.

The Greasemonkey direct request is re-enabled experimentally using the same
multipart shape as OPUc Ultimate, while keeping the selected file input
attached. There is still no automatic retry: an unreadable result could follow
a successful OPU upload, so retrying through another transport might create a
duplicate.

## Safety and validation notes

- OPU URLs are accepted only from HTTPS `opu.peklo.biz/p/…` paths.
- Popup messages are restricted to exact Kapybara and OPU origins plus a
  matching request ID and popup window.
- Cookie values and image bytes are never written to Cudloun logs or storage.
- Test uploads were made to OPU, but automated checks never submitted a
  Kapybara post.
- The final insertion adapter was checked in Chromium and Firefox for both new
  posts and replies, including deliberate toolbar and bottom-sheet rerenders.
