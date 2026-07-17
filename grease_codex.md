# Desktop Codex handoff: Firefox Greasemonkey and OPUc

Prepared on 2026-07-17 after the Android investigation. Read `grease.md` for
the full experiment-by-experiment postmortem; this file is the shorter working
brief for the next desktop session.

## Current conclusion

Do not change Cudloun before reproducing the failure on desktop Firefox.

The strongest new evidence is that **OPUc Ultimate itself is broken in the
same Firefox + Greasemonkey environment**. Cudloun's current upload also fails
there, while Cudloun 0.6.11 works perfectly in Kiwi. That moves the leading
hypothesis below Kapybara and Cudloun's Markdown insertion: Firefox,
Greasemonkey, OPU's session/redirect behavior, or their interaction.

The Kapybara side has already been separated from the transport. Once Cudloun
has a validated OPU URL, it switches the originating composer to `<>` Markdown
mode, inserts `![](OPU_URL)` into Lexical with a browser editing command, and
switches back to `Tt` when appropriate. Live tests passed for both new-post and
reply composers without submitting a post.

## Released state

- Repository: `hanenashi/cudloun`, branch `main`
- Current release: `0.6.11`
- Current commit: `87f6892` (`Insert OPU images through Kapybara Markdown`)
- Kiwi/Chromium: direct multipart `GM_xmlhttpRequest`; device-verified working
- Firefox + Tampermonkey: first-party OPU popup bridge; previously
  device-verified working, with a briefly opened OPU tab
- Firefox + Greasemonkey: experimental direct multipart request; currently
  broken on Android
- OPUc Ultimate + the same Firefox/Grease setup: also currently broken

Keep 0.6.11 intact while collecting desktop evidence. In particular, do not
replace the working Kiwi transport or the working Tampermonkey popup path just
to accommodate Greasemonkey.

## Desktop test matrix

Use the same small disposable image for every case and test in this order:

| Case | Browser / manager | Script | What it isolates |
| --- | --- | --- | --- |
| A | Desktop Firefox + Greasemonkey | OPUc Ultimate | Baseline independent of Cudloun and Kapybara Markdown insertion |
| B | Desktop Firefox + Greasemonkey | Cudloun 0.6.11 | Whether Cudloun differs from the baseline direct request |
| C | Desktop Firefox + Tampermonkey | Cudloun 0.6.11 | Known popup bridge control |
| D | Chromium + Tampermonkey | Cudloun 0.6.11 | Known direct-request control |

For each case, record:

1. Exact Firefox and userscript-manager versions.
2. Whether the file appears in the OPU gallery even when the script reports
   failure.
3. HTTP status, `finalUrl`/`responseURL`, response length, and whether the body
   is the blank upload form, a redirect/result page, or an actual image result.
4. Which response properties Greasemonkey exposes: `responseText`, `response`,
   `responseXML`, and headers. Do not record cookies or image bytes.
5. Whether `GM_info.scriptHandler` or `GM.info.scriptHandler` identifies the
   manager as expected.
6. For Cudloun, the status shown in the OPUc panel and the relevant Cudloun
   debug-log lines.

Use OPU's gallery to detect a successful-but-unreadable upload. Do **not**
blindly retry after such a result: a second POST can create a duplicate image.

## First questions to answer

1. Does OPUc Ultimate fail on desktop Firefox + Greasemonkey too?
2. If it fails, is the POST rejected, or does OPU store the file while the
   script receives a blank/session-lost result page?
3. Are OPUc Ultimate and Cudloun sending materially different multipart
   requests under desktop Greasemonkey?
4. Does Greasemonkey expose a usable final URL, redirect chain, response body,
   or `Set-Cookie` header on desktop that Android did not expose?
5. Does a tiny isolated userscript reproduce the result without any Kapybara
   or Cudloun code?

Only after those answers should the transport be changed.

## Recommended minimal probe

If both full scripts fail, create a temporary local userscript that does only
the following:

1. Runs on a disposable test page or Kapybara.
2. Lets the user choose one file.
3. Builds the same `FormData` fields used by OPUc Ultimate and Cudloun:
   `obrazek[0]`, `sizep=0`, `outputf=auto`, and `tl_odeslat=Odeslat`.
4. Sends exactly one `GM_xmlhttpRequest` POST to
   `https://opu.peklo.biz/opupload.php`.
5. Reports only safe metadata: status, final URL, response type/length,
   property availability, and a classification of the returned page.

Do not add session preflights, retries, cookie relays, popup navigation, or
Kapybara insertion to this probe. Its purpose is to establish whether the
classic OPUc transport works at all in current desktop Greasemonkey.

## Relevant Cudloun code

- `modules/opuc/client.js`: direct multipart request and upload-response URL
  extraction.
- `modules/opuc/popup-bridge.js`: browser/manager routing and the Firefox
  Tampermonkey first-party bridge. `shouldUse()` selects Tampermonkey;
  `shouldKeepInputAttached()` selects Firefox Greasemonkey's direct experiment.
- `modules/opuc/ui.js`: file-input lifecycle, upload status, and handoff to the
  composer adapter.
- `modules/opuc/kapybara-adapter.js`: validated URL to Markdown insertion. This
  is already live-tested and is not the leading suspect.
- `modules/sys-kapyguts.js`: Kapybara composer, mode-toggle, and Markdown-node
  discovery.
- `tests/opuc.test.js`: transport routing, parsing, and Markdown helper tests.
- `scripts/build-bundle.js`: rebuilds `cudloun.bundle.js` after source changes.
- Sibling repositories: `../OPUc_ultimate`, `../OPUc`, `../OPUg`, `../OPUh`,
  and `../OPUx`.

Note that `modules/opuc/README.md` still describes Firefox Greasemonkey as
rejected. Runtime 0.6.11 temporarily re-enabled its direct path for this
experiment; update that document only once the supported policy is settled.

## Useful commands

From `/home/beechan/GIT/cudloun`:

```bash
git status --short --branch
git log --oneline -10
node --test tests/*.test.js
node scripts/build-bundle.js
node --check cudloun.bundle.js
```

After any source change, rebuild the bundle, rerun all tests, bump the release
version/cache key, and verify the raw GitHub manifest after pushing.

## Prior experiments and guardrails

The detailed evidence and commit list are in `grease.md`. The key guardrails
are:

- Do not assume an OPU gallery upload means URL recovery succeeded.
- Do not assume a recovered URL means Kapybara insertion succeeded.
- Do not automatically retry an ambiguous upload.
- Do not log or persist cookies, session tokens, response headers containing
  secrets, or file contents.
- Do not clear or detach the Firefox Greasemonkey file input before the direct
  request has consumed its `File`.
- Do not regress Kiwi's original one-POST path.
- Do not regress Firefox Tampermonkey's known-good popup path.
- Avoid reviving the optional no-tab experiment from `4d41811`; it was reverted
  by `0d1b149` after both Kiwi and Firefox failed to find Kapybara's image
  button. The Markdown adapter in 0.6.11 supersedes that insertion approach.

## Decision points after desktop testing

- If OPUc Ultimate and the minimal probe both fail, treat current Firefox
  Greasemonkey as an upstream/runtime incompatibility. Restore the explicit
  unsupported message and keep Tampermonkey as the Firefox solution.
- If the minimal probe works but Cudloun fails, diff request construction and
  userscript grants before touching response parsing or the composer.
- If upload succeeds and only URL recovery fails, capture the safe shape of
  the actual response and improve extraction once, without issuing a second
  upload.
- If a validated URL reaches `kapybara-adapter.js` but insertion fails, then
  reopen Kapybara work; otherwise leave the Markdown adapter alone.

No further Android-side tweaking is recommended until this desktop comparison
is complete.
