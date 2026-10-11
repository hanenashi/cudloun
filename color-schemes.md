# Cudloun color switcher: implementation sketch

Source snapshot inspected 2026-10-11: [Okoun barvy](https://media.okoun.cz/tmp/okoun-barvy/index.html).
The temporary page is a prototype, not a stable runtime API. Kapyguts records
its useful color model and the current live Kapybara token surface in
[`kapyguts.md`](kapyguts.md#color-schemes-and-palette-prototype-2026-10-11).

As of 2026-10-12, the prototype's 75 named variants and three base palettes
are preserved as attributed, non-executable data in
[`okoun-barvy-data.json`](okoun-barvy-data.json). The first switcher slice is
implemented in `modules/color-schemes.js`: Native/reset, three base schemes,
custom primary color, contrast feedback, and a legacy-theme conflict guard.
The larger gallery, import/export, and Lucifer migration remain future work.
The archive captures the prototype's data object, not the generated Kolo 10/11
tuner combinations or the page's UI code.

## Product shape

Build one opt-in `color-schemes` module, replacing the role of the older
`kapybara-theme` module. Start with **Native** (no overrides), three Kapybara
base schemes, a small curated palette, and **Lucifer / Temná strana Síly** as
a migrated preset. Searchable historical rounds can follow; showing every
prototype experiment as a top-level choice would make the hub unwieldy.

Keep a prominent one-click **Native / Reset** action and an undoable live
preview. Offer a custom editor for page, post, header, card, primary, text,
link, unread, and stripe colors; show contrast ratios for text on backgrounds
and on primary buttons. Store choices in Cudloun's own storage. The prototype's
`localStorage` belongs to `media.okoun.cz` and is not shared with Kapybara.

## Implementation path

1. Preserve an attributed data snapshot of the prototype palettes and their
   base-scheme token values while the page exists. Done; runtime only bundles
   the compact base palettes, and never requests `/tmp/okoun-barvy/`.
2. Use `kapyguts.colorThemeState()` to check the live page and resolve actual
   token property names. Reject unknown token surfaces safely. Never assume
   the preview's `--🐟-` spelling also works on live Kapybara.
3. Apply a complete base palette plus overrides in one owned stylesheet. Do
   not overwrite Kapybara's native persisted preference. Remove the stylesheet
   entirely on Native/disable, and reapply after native scheme or root changes.
4. Keep button-style exceptions in a small, tested CSS layer. Reuse semantic
   controls where possible; isolate fragile Kapybara selectors behind
   Kapyguts and recheck them after frontend releases.
5. Let users import/export a portable Cudloun palette JSON. The prototype's
   `#c=` URLs may be decoded after validation; its `#k=` tuner URLs need a
   small compatible parser. Its `#v=` IDs require an archived preset table
   once the temporary page disappears.
6. Ensure only one color engine is active. Either migrate existing
   `kapybara-theme` settings into the Lucifer preset or disable the old module
   with a clear explanation; stacking both would create unpredictable CSS.
7. Test on home, club, messages, composer, menus, and mobile/desktop, with
   traditional/light/dark native settings. Verify route changes, native theme
   changes, unread states, contrast, and clean teardown.

The first shippable slice is **Native + three schemes + custom primary color**
with automatic prefix discovery and reset. Add the broader gallery only after
that slice survives Kapybara's current update cycle.
