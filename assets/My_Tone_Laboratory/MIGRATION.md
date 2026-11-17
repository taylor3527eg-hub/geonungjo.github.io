# My Tone Laboratory migration

Source: https://sites.google.com/view/geonungjo/projectwork/music/my-tone-laboratory

Source retrieved and compared on 2026-11-15.

- `tone-laboratory.html` contains all 183 original content blocks in their original order. Headings, paragraph boundaries, wording, numbers, punctuation, and inline bold/italic emphasis are preserved; Google Sites navigation and heading-copy controls are excluded.
- All 38 inline source photographs/diagrams are mapped to the supplied files in this folder. No equipment image is generated, substituted with stock imagery, or edited. Original file hashes, source text and image roles are recorded in `content-source.json`.
- The new introduction uses the user's existing `assets/About/My_Space.jpg` workspace photograph. The original Google Sites decorative header background returned HTTP 403 and could not be verified or downloaded. This background is not counted among the 38 recovered inline images; exact recovery of that decorative banner remains unverified.
- The bass demonstration uses the original YouTube video, https://www.youtube.com/watch?v=85VmUi9q2y8. YouTube oEmbed returned HTTP 200 with the title **Bass Pedalboard Brief Demo**, by **Wilt**. The page includes an embedded player and a direct viewing link.
- The signal-chain diagram uses its original local file, the existing image dialog, and a direct full-size image link for inspecting fine details on small screens.
- Existing shared header, image-viewer JavaScript, footer, typography, colors, section labels and motion timing are reused. The homepage project link and the shared Work dropdown now link to `tone-laboratory.html`.

## Verification

The migration checks compare each `data-source-block` against the captured source text, verify all 38 source-image mappings and original hashes, check HTML/CSS structure, local asset paths, heading/ARIA targets, and local navigation links. No original paragraph is missing or rewritten. No gear claims or terminology were silently corrected.

Live browser layout and embedded playback have not been visually inspected. Other portfolio pages and their styles are unchanged; only the homepage project link and the shared dropdown destination were updated outside the new page.
