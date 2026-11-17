# Performance Gallery

Local page: `performance-gallery.html`.

Source: https://sites.google.com/view/geonungjo/projectwork/music/performance-gallery

The introduction, performance introduction, CTAG-FX explanation, teaching text,
original emphasis, project link and video links were retained. The three gallery
themes share one interface. Teaching media and the CTAG-FX video remain separate.

## Photograph selection

- University Band Club: 16 photographs.
- University Festival: 5 photographs.
- Local Band Days (Seoul & Busan): 18 photographs.
- Introduction: `KakaoTalk_20260126_165141687.jpg` and `IMG_3707.JPG`, displayed
  as a staggered portrait pair with the same entrance animation as About.
- Teaching & Demonstration: the classroom photograph and original equipment setup.

The original photographs remain in their original relative sequence within each
theme. Eight additional local uploads were placed alongside matching scenes.
`content-source.json` records each original Google Sites image block, the selected
local file, extra uploads, original text blocks and video metadata.

Four performance photographs and the teaching equipment photograph were recovered
from the original site because matching uploads were absent. These are original
site photographs, not stock or generated imagery.

`IMG_4299.jpg` is the middle-school photograph. It appears as a small memory
above `IMG_3707.JPG` in the introduction, accompanied by its original
"When I Was in Middle School..." caption. It is not part of the themed gallery.
The two byte-identical KakaoTalk aliases and the smaller crop of `IMG_7033.JPG`
are not shown twice. `IMG_3707.JPG` was promoted from the local band gallery to
the introduction and no longer appears in either gallery strip.
All 42 existing uploaded files are untouched.

## Display assets and behavior

`web/` contains proportional WebP thumbnails and previews. Originals open in the
shared image viewer; faces and instruments are not cropped in the central view.
Only the selected theme's thumbnails are loaded into the moving strips.

The upper strip moves right, the lower strip moves left. Hover/focus pauses a
strip; Pause Motion stops both. Movement also pauses offscreen, in a background
tab, and while the image viewer is open. Reduced motion uses static, scrollable
thumbnail strips. The featured image changes only when selected, with a short
upward crossfade. Theme switches do not navigate or change the page scroll.

The original YouTube IDs are `6vLP4XBltj4` (CTAG-FX), `tk83MP09sbQ` (English
teaching demonstration) and `x52Dp8PjtV4` (original Korean-language link).
The in-person demonstration now uses the user's local
`KakaoTalk_20261030_140907677.mp4` upload (1280 × 720), with native playback
controls and a poster extracted from the video. Its original Google Drive URL
is retained in `content-source.json` for provenance.

The CTAG-FX project reference uses the shared bold, underlined link style and
points to the local `ctag-fx.html` project page.
