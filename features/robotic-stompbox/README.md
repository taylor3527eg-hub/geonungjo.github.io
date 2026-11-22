# Robotic Stompbox audio

The homepage uses the original `assets/Home/star.mp3` recording. Audio is unmuted
by default (**Mute Audio** is shown), but no context, request, or playback starts
until a click/tap or keyboard gesture unlocks browser audio. The pedal controls
play/pause; playback resumes at the saved position and loops. **Mute Audio**
silences the recording independently of the physical pedal, including during
loading. Loading never overrides the visitor's latest mute or pedal choice.

The existing physical model and ranges remain unchanged:

| Physical parameter | Range | Starting/audio reference |
| --- | --- | --- |
| Mass | 0.5–10 | 3.35 |
| Damping constant | 0–12 | 2.4 |
| Stiffness | 0–80 | 18 |

The references are read from the actual starting slider values. At those
settings the filters use unity bypass paths and the reverb wet gain is zero.
The original tone is retained at a reduced playback volume.

- **Force → master gain:** normalized actual external-force magnitude smoothly
  controls gain from 0.18 to 0.85 while enabled and the pedal is ON. It returns
  to the baseline when input stops. OFF/mute ramps toward zero.
- **Mass → low-pass:** above 3.35, progressively crossfade into a low-pass
  filter and lower the cutoff exponentially from 12 kHz to 1 kHz. At or below
  3.35 the filter is bypassed.
- **Stiffness → high-pass:** above 18, crossfade into two cascaded high-pass
  biquads (24 dB/octave). With normalized increase `s`, cutoff is
  `70 + 1130 * s^0.65` Hz; blending completes at `s = 0.05`. At or below 18
  both filters are bypassed. Cutoff is capped at 60% of the current mass low-pass
  cutoff to preserve a passband when both parameters are high.
- **Damping → reverb:** below 2.4, normalized decrease `d` sets wet gain to
  `0.85 * d^0.55` and dry gain to `1 - 0.5 * wet`. Equal-power mixing shifts
  between 0.45-second and 2.6-second stereo convolution tails. At or above 2.4
  the sound stays dry; no additional effect is added above the reference.

The reverb has no feedback connections. Two deterministic finite noise impulse
responses are prepared once at context creation, with 12 ms predelay, an 8 ms
attack, exponential decay, and per-channel energy normalization. The wet return
is filtered at 180 Hz and 5.2 kHz. Slider changes smoothly mix the existing tails
without regenerating buffers. Short per-voice fades limit switching clicks, and
a final compressor guards peaks. The original recording is not replaced or
processed on disk. The orange force gauge, pedal LED, note cadence (0.60 s),
collision logic, and two-link dynamics are preserved.

No physics range expansion was needed: comparable-force checks already show
clear mass, damping, and stiffness differences. A faint hover-only ankle circle
shows the actual interaction radius. Existing touch and arrow-key inputs remain
available for making repeatable comparisons.

## Verification limits

Control/graph tests cover gesture-only initialization, pause/resume offsets,
looping, rapid toggles, loading races, retry, context suspension, neutral bypass,
parameter directions, finite feedback-free reverb, and cleanup. Eight physical range
corners remained finite in ten-second repeated-force simulations.

A real browser/listening test is still required for final filter/reverb/volume
tuning, perceived switching clicks, loudness, and phone/desktop presentation.
Browser preview was unavailable during implementation. If the browser suspends
audio, use **Resume Audio**; the robot remains usable without audio support.
