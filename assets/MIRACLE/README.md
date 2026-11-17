# MIRACLE content migration

Page: `miracle.html`.

Source: https://sites.google.com/view/geonungjo/projectwork/engineering/miracle

## Text preservation

`original-text.json` records all 113 written content blocks retrieved from the
original page, including their exact Unicode text and inline emphasis/links.
The 110 retained blocks appear under their `data-source-block` identifiers in the
new page. The duplicate original-page email line was subsequently removed at the
user's explicit request; it remains recorded in the source archive. The user also
removed the optional additional technical-sheet group and original-portfolio
closing link, leaving Back To Work.
The Prototype in Action description/photo block was later removed at the user's
request. Both navigation headers and its photograph in the development gallery
remain. The original introductory paragraph is presented as two sentence groups;
their joined text remains identical to the source.
Only presentation markup, heading levels and placement were changed. Original
wording, punctuation, notation, references and contribution statements remain.
New section labels, navigation labels and short scope labels are additional copy.

The hero and prototype area contain the physical demonstrations. The dynamics
and observer derivations are in native HTML details/summary accordions. MATLAB
tracking and impedance results have separate accessible tabs; without JavaScript,
both result panels remain available. Original mathematical and table images are
retained alongside the transcribed numerical tables. No equation was re-derived
or silently corrected.

## Original assets and provenance limits

`content-source.json` records the original asset SHA-256 hashes, source page hash,
used assets and exact transcribed table values. The 97 supplied original files
were left unmodified. The `web/` directory contains derived photographic previews,
thumbnails and video poster frames; enlargement opens the supplied original.

The Google Sites text and source links were retrieved successfully. Initial image
requests returned HTTP 403. A fresh public-page response subsequently allowed all
21 original Development Gallery images to be retrieved and retained byte-for-byte
under `Development_Gallery/`. Technical figures elsewhere still use supplied local
CAD, equation, table, plot and animation files; their remote-image byte identity
has not been verified.
The original research-report and publication links remain available; their full
external documents were not imported into this page.

The development gallery now contains 20 retained images from the original site's
21-image collection, including its handwritten research notes, in their original
order, plus the user-requested `IMG_3865.JPG` exception. The standalone colored V1
leg CAD (source image 01) was excluded at the user's explicit request, together
with its main-section copies and the redundant Additional Mechanical CAD Views.
The user confirmed the three gray joint CAD views and `image3.gif` as final-version
assets; those remain. Images outside that source gallery were
removed from the gallery selection without deleting supplied files. The exception
has incorrect EXIF orientation metadata; the display copy removes that metadata
without changing JPEG scan data or decoded pixels. It is upright in the gallery,
preview, enlargement and physical-prototype context photograph. The original
file remains unmodified. The gallery uses the unchanged `performance-gallery.js` and
`performance-gallery.css`, with one development collection, two opposing photo
strips, a stationary thumbnail archive, original-image enlargement and pause /
reduced-motion behavior. No stock or generated images were introduced.

## Validation

`migration-audit.json` records the migration checks. Automated checks cover exact
source-text equality, original asset hashes, figure/table coverage, local file
and anchor references, shared-component preservation, simulation tab behavior
and gallery selection. Browser rendering and audiovisual playback were not
performed during this local implementation.
