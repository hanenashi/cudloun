# Compact Media Links

An opt-in reader-side module for Kapybara board posts. It collapses automatic
preview cards for direct video, YouTube, and X/Twitter links using Kapybara's
existing cue button. The original link remains visible, and clicking its cue
opens the native card on demand. Other embed providers are untouched.

The module only acts on cards paired with a matching native cue. It does not
rewrite post content, inject media, or start playback. Newly rendered posts
are handled too. Disable the module to restore the cards it collapsed, where
those posts remain mounted.

This follows Leknin's request in the Kapybara club for an option to avoid
large automatic embeds while retaining the small interactive triangle. The
implementation is intentionally default-off until it has been tried across
all three card types on mobile and desktop.
