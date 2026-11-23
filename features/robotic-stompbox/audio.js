// Audio starts unmuted, but context creation/loading waits for a user gesture.
export function createStompboxAudio({ root, sourceUrl, reference, ranges }) {
  const button = root.querySelector('[data-enable-audio]');
  const status = root.querySelector('[data-audio-status]');
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const events = new AbortController();
  let context, graph, buffer, loading, voice;
  let enabled = true, pedalOn = false, destroyed = false, failed = false;
  let offset = 0, force = 0, lastGain = -1;
  let parameters = { ...reference };
  const voices = new Set();
  const clamp = value => Math.max(0, Math.min(1, value));
  const above = name => clamp((parameters[name] - reference[name]) / (ranges[name].max - reference[name]));
  const below = name => clamp((reference[name] - parameters[name]) / (reference[name] - ranges[name].min));

  function render(message) {
    if (!button) return;
    button.disabled = destroyed || !AudioContextClass;
    const running = context?.state === 'running';
    button.textContent = !AudioContextClass ? 'Audio unavailable'
      : enabled && context && !running && !loading ? 'Resume Audio' : enabled ? 'Mute Audio' : 'Unmute Audio';
    button.setAttribute('aria-pressed', String(enabled && Boolean(AudioContextClass)));
    if (status) {
      const ready = Boolean(AudioContextClass && enabled && !destroyed && !loading && !failed && running && buffer);
      const playing = ready && Boolean(voice);
      status.dataset.audioState = playing ? 'on' : ready ? 'ready' : 'off';
      status.textContent = message || (!AudioContextClass ? 'This browser does not support Web Audio.'
        : !enabled || destroyed ? 'AUDIO OFF · Audio muted.' : loading ? 'Loading your guitar recording…'
        : failed ? 'Audio could not start. Click or tap the scene to retry.'
        : !context ? 'Click or tap once to unlock sound.'
        : !running ? 'Audio suspended. Click Resume Audio.'
        : !buffer ? 'Loading your guitar recording…'
        : playing ? 'AUDIO ON · Pedal ON · guitar playing' : 'AUDIO READY · Pedal OFF');
    }
  }

  function smooth(param, value, seconds = 0.045) {
    const now = context.currentTime;
    if (typeof param.cancelAndHoldAtTime === 'function') param.cancelAndHoldAtTime(now);
    else param.cancelScheduledValues(now);
    param.setTargetAtTime(value, now, seconds);
  }

  function bypassFilter(type, cutoff, stages = 1) {
    const input = context.createGain(), output = context.createGain();
    const bypass = context.createGain(), filtered = context.createGain();
    const filters = Array.from({ length: stages }, () => {
      const filter = context.createBiquadFilter();
      filter.type = type;
      filter.Q.value = Math.SQRT1_2;
      filter.frequency.value = cutoff;
      return filter;
    });
    filtered.gain.value = 0;
    input.connect(bypass).connect(output);
    let path = input;
    for (const filter of filters) path = path.connect(filter);
    path.connect(filtered).connect(output);
    return { input, output, bypass, filtered, filters };
  }

  function reverbImpulse(seconds, seed) {
    const length = Math.ceil(seconds * context.sampleRate);
    const impulse = context.createBuffer(2, length, context.sampleRate);
    const preDelay = Math.round(0.012 * context.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const samples = impulse.getChannelData(channel);
      let state = (seed + channel * 7919) | 0, previous = 0, energy = 0;
      for (let i = preDelay; i < length; i++) {
        state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
        const noise = (state >>> 0) / 2147483648 - 1;
        previous = 0.55 * previous + 0.45 * noise;
        const elapsed = (i - preDelay) / context.sampleRate;
        const attack = Math.min(1, elapsed / 0.008);
        samples[i] = previous * attack * Math.exp(-6.91 * elapsed / seconds);
        energy += samples[i] * samples[i];
      }
      const gain = 0.7 / Math.sqrt(energy || 1);
      for (let i = preDelay; i < length; i++) samples[i] *= gain;
    }
    return impulse;
  }

  function buildGraph() {
    const low = bypassFilter('lowpass', 12000);
    const high = bypassFilter('highpass', 70, 2);
    const dry = context.createGain(), wet = context.createGain();
    const mix = context.createGain(), master = context.createGain();
    const guard = context.createDynamicsCompressor();
    wet.gain.value = 0;
    master.gain.value = 0;
    guard.threshold.value = -3;
    guard.knee.value = 2;
    guard.ratio.value = 20;
    guard.attack.value = 0.002;
    guard.release.value = 0.1;
    low.output.connect(high.input);
    high.output.connect(dry).connect(mix);
    wet.connect(mix);
    mix.connect(master).connect(guard).connect(context.destination);

    // Finite stereo convolution tails: no feedback loops or changing delay times.
    const wetHigh = context.createBiquadFilter(), wetLow = context.createBiquadFilter();
    wetHigh.type = 'highpass'; wetHigh.frequency.value = 180; wetHigh.Q.value = 0.5;
    wetLow.type = 'lowpass'; wetLow.frequency.value = 5200; wetLow.Q.value = 0.5;
    wetHigh.connect(wetLow).connect(wet);
    const tails = [0.45, 2.6].map((seconds, index) => {
      const convolver = context.createConvolver(), level = context.createGain();
      convolver.normalize = false;
      convolver.buffer = reverbImpulse(seconds, 137 + index * 104729);
      level.gain.value = index === 0 ? 1 : 0;
      high.output.connect(convolver).connect(level).connect(wetHigh);
      return level;
    });
    return { low, high, dry, wet, master, guard, tails };
  }

  function applyParameters() {
    if (!graph) return;
    const mass = above('mass'), stiffness = above('stiffness'), damping = below('damping');
    const lowCutoff = 12000 * Math.pow(1000 / 12000, mass);
    const highCutoff = Math.min(70 + 1130 * Math.pow(stiffness, 0.65), lowCutoff * 0.6);
    // At/below the references, unity bypass paths retain the recording's original tone.
    for (const [stage, amount, cutoff, transition] of [
      [graph.low, mass, lowCutoff, 0.12],
      [graph.high, stiffness, highCutoff, 0.05],
    ]) {
      const blend = Math.min(1, amount / transition);
      for (const filter of stage.filters) smooth(filter.frequency, cutoff);
      smooth(stage.bypass.gain, 1 - blend);
      smooth(stage.filtered.gain, blend);
    }
    const wet = 0.85 * Math.pow(damping, 0.55);
    smooth(graph.wet.gain, wet, 0.09);
    smooth(graph.dry.gain, 1 - 0.5 * wet, 0.09);
    const tailBlend = Math.pow(damping, 0.7) * Math.PI / 2;
    smooth(graph.tails[0].gain, Math.cos(tailBlend), 0.09);
    smooth(graph.tails[1].gain, Math.sin(tailBlend), 0.09);
  }

  function applyVolume() {
    if (!graph) return;
    const target = enabled && pedalOn && context.state === 'running' ? 0.18 + 0.67 * Math.sqrt(force) : 0;
    if (Math.abs(target - lastGain) < 0.001) return;
    smooth(graph.master.gain, target);
    lastGain = target;
  }

  function pauseVoice() {
    if (!voice) return;
    const current = voice;
    voice = null;
    const now = context.currentTime;
    offset = (current.offset + Math.max(0, now - current.startedAt)) % buffer.duration;
    current.gate.gain.cancelScheduledValues(now);
    current.gate.gain.setValueAtTime(Math.min(1, Math.max(0, (now - current.startedAt) / 0.025)), now);
    current.gate.gain.linearRampToValueAtTime(0, now + 0.025);
    current.source.stop(now + 0.03);
  }

  function startVoice() {
    if (voice || !buffer || !enabled || !pedalOn || context.state !== 'running' || destroyed) return;
    const source = context.createBufferSource(), gate = context.createGain();
    const now = context.currentTime;
    source.buffer = buffer;
    source.loop = true;
    gate.gain.value = 0;
    source.connect(gate).connect(graph.low.input);
    const current = { source, gate, offset, startedAt: now };
    voices.add(current);
    source.onended = () => {
      source.disconnect();
      gate.disconnect();
      voices.delete(current);
    };
    source.start(now, offset);
    gate.gain.linearRampToValueAtTime(1, now + 0.025);
    voice = current;
  }

  function syncPlayback() {
    if (!enabled || !pedalOn || context?.state !== 'running') pauseVoice();
    else startVoice();
    applyVolume();
    render();
  }

  async function unlock() {
    if (destroyed || loading || !AudioContextClass) return;
    try {
      if (!context) {
        context = new AudioContextClass();
        graph = buildGraph();
        context.addEventListener('statechange', () => { if (!destroyed) syncPlayback(); }, { signal: events.signal });
        applyParameters();
      }
      failed = false;
      // Resume directly in the click/key gesture, before any asynchronous loading.
      const resume = context.resume();
      loading = (async () => {
        await resume;
        if (!buffer) {
          const response = await fetch(sourceUrl, { signal: events.signal });
          if (!response.ok) throw new Error(`Audio request failed (${response.status}).`);
          buffer = await context.decodeAudioData(await response.arrayBuffer());
          // Preserve timbre; a conservative linear trim handles MP3 sample overshoots.
          let peak = 1;
          for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const samples = buffer.getChannelData(channel);
            for (let i = 0; i < samples.length; i++) peak = Math.max(peak, Math.abs(samples[i]));
          }
          if (peak > 1) for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const samples = buffer.getChannelData(channel);
            for (let i = 0; i < samples.length; i++) samples[i] /= peak;
          }
        }
      })();
      render();
      await loading;
      loading = null;
      if (destroyed) return;
      syncPlayback();
    } catch (error) {
      loading = null;
      failed = true;
      if (!destroyed) { pauseVoice(); applyVolume(); render(); }
    }
  }

  button?.addEventListener('click', () => {
    if (enabled && context && context.state !== 'running' && !loading) {
      void unlock();
    } else if (enabled) {
      enabled = false;
      syncPlayback();
    } else {
      enabled = true;
      void unlock();
      syncPlayback();
    }
  }, { signal: events.signal });
  const unlockOnGesture = event => {
    if (event.isTrusted === false || event.target?.closest?.('[data-enable-audio]')) return;
    if (event.type === 'keydown' && (event.ctrlKey || event.metaKey || event.altKey
      || ['Shift', 'Control', 'Alt', 'Meta', 'Escape', 'Tab'].includes(event.key))) return;
    if (enabled && (!buffer || context?.state !== 'running')) void unlock();
  };
  document.addEventListener('click', unlockOnGesture, { capture: true, signal: events.signal });
  document.addEventListener('keydown', unlockOnGesture, { signal: events.signal });
  render();

  return {
    setPedal(on) { pedalOn = Boolean(on); syncPlayback(); },
    setParameters(values) { parameters = { ...values }; applyParameters(); },
    setForce(value) { force = clamp(Number.isFinite(value) ? value : 0); applyVolume(); },
    destroy() {
      destroyed = true;
      enabled = false;
      events.abort();
      pauseVoice();
      for (const current of voices) {
        current.source.onended = null;
        try { current.source.stop(); } catch { /* Already stopped. */ }
        current.source.disconnect(); current.gate.disconnect();
      }
      voices.clear();
      if (context && context.state !== 'closed') void context.close().catch(() => {});
    },
  };
}
