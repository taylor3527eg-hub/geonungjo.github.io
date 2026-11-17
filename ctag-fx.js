(() => {
  const dataElement = document.querySelector('#ctag-data');
  if (!dataElement) return;
  const data = JSON.parse(dataElement.textContent);
  const controllers = [];
  const formatTime = value => {
    if (!Number.isFinite(value)) return '—';
    return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
  };

  const initializeStackedPlayers = root => {
    const presets = data[root.dataset.listener];
    let preset = 0;
    let variant = 'melody';
    const title = root.querySelector('[data-selected-title]');
    const players = [...root.querySelectorAll('[data-tone-player], [data-character-player]')].map(row => {
      const mode = row.dataset.tonePlayer || row.dataset.characterPlayer;
      const audio = row.querySelector('[data-listening-audio]');
      const play = row.querySelector('[data-play]');
      const seek = row.querySelector('[data-seek]');
      const volume = row.querySelector('[data-volume]');
      const elapsed = row.querySelector('[data-elapsed]');
      const duration = row.querySelector('[data-duration]');
      const status = row.querySelector('[data-playback-status]');
      const fileLink = row.querySelector('[data-audio-file]');
      let wanted = false;
      let version = 0;
      let scrubbing = false;
      const name = () => {
        if (mode === 'reference') return `${presets[preset].name}, Reference`;
        if (mode === 'synth') return `${presets[preset].name}, A&R-CTAG Synth`;
        return `${mode === 'fx' ? presets[preset].name + ' FX' : 'RAW reference'}, ${variant === 'melody' ? 'Melody' : 'Chords'}`;
      };
      const paintPlayback = playing => {
        row.querySelector('[data-play-label]').textContent = playing ? 'Pause' : 'Play';
        row.querySelector('[data-play-symbol]').textContent = playing ? 'Ⅱ' : '▶';
        play.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} ${name()}`);
        play.setAttribute('aria-pressed', String(playing));
      };
      const paintProgress = () => {
        const ready = Number.isFinite(audio.duration) && audio.duration > 0;
        seek.disabled = !ready;
        if (!scrubbing) seek.value = ready ? String(Math.round(audio.currentTime / audio.duration * 1000)) : '0';
        elapsed.textContent = formatTime(audio.currentTime || 0);
        duration.textContent = ready ? formatTime(audio.duration) : '—';
        seek.setAttribute('aria-valuetext', `${formatTime(audio.currentTime || 0)} of ${ready ? formatTime(audio.duration) : 'unknown duration'}`);
      };
      const pause = () => {
        wanted = false;
        audio.pause();
        paintPlayback(false);
      };
      const controller = { pause };
      controllers.push(controller);
      play.addEventListener('click', () => {
        if (wanted) return pause();
        controllers.forEach(other => { if (other !== controller) other.pause(); });
        wanted = true;
        status.textContent = '';
        if (audio.ended) audio.currentTime = 0;
        const request = version;
        const result = audio.play();
        if (result?.catch) result.catch(error => {
          if (request !== version || !wanted || error.name === 'AbortError') return;
          wanted = false;
          paintPlayback(false);
          status.textContent = 'Playback could not start. Try Play again or open the audio file.';
        });
      });
      audio.addEventListener('play', () => paintPlayback(true));
      audio.addEventListener('pause', () => paintPlayback(false));
      audio.addEventListener('ended', () => { wanted = false; paintPlayback(false); paintProgress(); });
      audio.addEventListener('loadedmetadata', paintProgress);
      audio.addEventListener('timeupdate', paintProgress);
      audio.addEventListener('durationchange', paintProgress);
      audio.addEventListener('error', () => {
        wanted = false;
        paintPlayback(false);
        status.textContent = 'This audio file could not be loaded. Use Open Audio File to try it directly.';
      });
      seek.addEventListener('input', () => {
        scrubbing = true;
        if (Number.isFinite(audio.duration)) audio.currentTime = Number(seek.value) / 1000 * audio.duration;
        elapsed.textContent = formatTime(audio.currentTime || 0);
      });
      seek.addEventListener('change', () => { scrubbing = false; paintProgress(); });
      volume.addEventListener('input', () => { audio.volume = Number(volume.value); });
      audio.volume = Number(volume.value);
      audio.controls = false;
      audio.hidden = true;
      row.querySelector('[data-transport]').hidden = false;
      return {
        mode,
        load: () => {
          version++;
          pause();
          scrubbing = false;
          const src = mode === 'raw' ? data.raw[variant]
            : mode === 'fx' ? presets[preset].files[variant] : presets[preset][mode];
          audio.src = src;
          audio.load();
          fileLink.href = src;
          status.textContent = '';
          paintProgress();
        }
      };
    });
    const update = (guitarOnly = false) => {
      title.textContent = presets[preset].name;
      root.querySelectorAll('[data-preset]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.preset) === preset)));
      root.querySelectorAll('[data-variant]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.variant === variant)));
      // Clip selection affects the guitar pair only. Reference and synth audio
      // retain their source, playback position and play/pause state.
      players.filter(player => !guitarOnly || player.mode === 'raw' || player.mode === 'fx')
        .forEach(player => player.load());
    };
    root.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => {
      const next = Number(button.dataset.preset);
      if (next === preset) return;
      preset = next;
      update();
    }));
    root.querySelectorAll('[data-variant]').forEach(button => button.addEventListener('click', () => {
      const next = button.dataset.variant;
      if (next === variant) return;
      variant = next;
      update(true);
    }));
    update();
  };

  document.querySelectorAll('[data-listener]').forEach(initializeStackedPlayers);

  const evidenceFigure = document.querySelector('.ctag-evidence-figure');
  if (evidenceFigure) {
    const trigger = evidenceFigure.querySelector('[data-image-zoom]');
    const image = trigger.querySelector('img');
    const caption = evidenceFigure.querySelector('figcaption');
    const buttons = [...document.querySelectorAll('[data-evidence-index]')];
    buttons.forEach(button => button.addEventListener('click', () => {
      const selected = Number(button.dataset.evidenceIndex);
      const figure = data.evidence[selected];
      image.src = figure.src;
      image.alt = figure.alt;
      trigger.dataset.imageTitle = figure.name;
      trigger.setAttribute('aria-label', `Enlarge ${figure.name}`);
      caption.textContent = figure.caption;
      buttons.forEach((item, i) => item.setAttribute('aria-pressed', String(i === selected)));
    }));
  }
})();
