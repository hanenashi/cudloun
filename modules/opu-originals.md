# OPU Originals

This is a default-disabled Cudloun reader module, separate from the OPUc
uploader. It addresses [Pebble's request in the Kapybara club](https://kapybara.okoun.cz/boards/kapybara/c/1074768364#p1074770293)
from 7 October 2026. In the follow-up replies, Pebble clarified that a
thumbnail should display its full-resolution OPU image inline, in the same
tab, without a click. The discussion also asked how much space it should use;
Pebble preferred the space needed by the original.

Version 0.1.0 only handles rendered images in Kapybara board posts whose
`src` is an exact HTTPS OPU thumbnail path:

```text
https://opu.peklo.biz/p/26/10/06/thumbs/1791283892-fab9f.jpg
→ https://opu.peklo.biz/p/26/10/06/1791283892-fab9f.jpg
```

It leaves the author's link unchanged, allows the image to grow up to the
post width, and avoids changing Kapybara's content-warning controls. An
unreachable original falls back to the thumbnail. Disabling the module
restores the original DOM source and layout. Newly rendered posts are handled
through a DOM observer. Plain image URLs are not auto-embedded, and images
inside `<picture>` or with `srcset` are skipped until those cases can be
mapped safely.

Large originals cost more bandwidth and can make posts taller. The module is
therefore opt-in. It was tested with a synthetic OPU thumbnail fixture and
with current live board DOM; none of the sampled live board images used a
`/thumbs/` source, so a naturally occurring thumbnail post remains an
end-to-end follow-up test.
