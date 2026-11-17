# CTAG-FX portfolio draft

Page: `ctag-fx.html`. This is a curated introduction, not a duplicate of the
standalone research demo. It uses the site's existing header, section navigation,
footer and image viewer. All audio playback is user initiated.

## Sources

- User-supplied `ctag-fx-platform-demo-main.zip`: audio samples, their prompt
  assignments, RAW recording chain, performance video and workflow SVG.
- Original portfolio: https://sites.google.com/view/geonungjo/projectwork/engineering/ctag-fx
- Research demo: https://taylor3527eg-hub.github.io/ctag-fx-platform-demo/
- Paper version: https://arxiv.org/html/2610.08182v1

`content-source.json` records source URLs, original contribution statements,
figure provenance, audio associations and SHA-256 hashes of the imported files.
No audio samples were generated, normalized, edited or re-encoded.

## Listening interface

- `_1.wav` is Melody; `_2.wav` is Chords. `RAW 1.wav` and `RAW 2.wav` are the
  corresponding baseline recordings. `Bird_2.wav` retains its original case.
- The four tone presets use the original Clean, Chewy, RAT and Fuzz files.
- The character examples distinguish real reference recordings, A&R-CTAG synth
  outputs, baseline guitar and the reinterpreted guitar FX output.
- Explore the Tones uses stacked RAW and FX players with one shared Melody /
  Chords selector. Each row has independent playback, seeking and volume; only
  one can play at a time. Changing a tone or recording loads both paused at the
  beginning, without synchronizing playback positions.
- Sound Exploration uses two groups of stacked players: Reference and A&R-CTAG
  Synth under Source & Interpretation; Guitar RAW and Guitar FX under Guitar
  Application. Each player has independent playback, seeking and volume.
- Its Melody / Chords selector changes only the guitar players, loading them
  paused at the beginning. Reference and synth playback remain uninterrupted.
  Changing a character loads all four players paused at the beginning.
- Selecting an option never starts audio automatically.
- Only one local audio player plays at a time across both sections. Native audio controls remain
  available if JavaScript is disabled.
- Media uses `preload="none"`; the original RAW/FX level difference is retained.
  The original source's listening-volume notice is included.
- RAW refers to the supplied baseline recording, which already includes the
  source's recording chain. It is not presented as an untouched guitar DI.

## Research accuracy

The processor operation test bypassed A&R-CTAG and directly instantiated FX
configurations with GPT-4o. The synth-side CTAG / A&R-CTAG comparison is separate.
The demo ZIP's listening prose is therefore not used to imply that the processor
evaluation measured the complete A&R-CTAG pipeline.

Figures 7 and 8 are original SVGs from the paper. Architecture figures are
original paper images; the workflow SVG comes directly from the supplied ZIP.
The four Table 3 rows retain the published values exactly. Character listening
examples are not presented as results of a completed perceptual study.

The role descriptions preserve the five contribution statements from the
original portfolio, grouped as Creator, Engineer and Musician. NAM is described
as capture and host playback of a fixed configuration, not live text-to-FX
generation. Parameter generation and processing do not run in this webpage.
