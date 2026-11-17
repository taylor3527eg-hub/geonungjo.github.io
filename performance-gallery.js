(() => {
  const gallery = document.querySelector('[data-performance-gallery]');
  const data = document.querySelector('#performance-gallery-data');
  if (!gallery || !data) return;
  const themes = JSON.parse(data.textContent);
  const tabs = [...document.querySelectorAll('[data-performance-theme]')];
  const panel = document.querySelector('#performance-panel');
  const heading = document.querySelector('[data-theme-title]');
  const thumbnailGrid = document.querySelector('[data-photo-grid]');
  const archive = document.querySelector('[data-photo-archive]');
  const archiveCount = document.querySelector('[data-archive-count]');
  const mobileArchive = window.matchMedia('(max-width: 740px)');
  const rails = [...gallery.querySelectorAll('[data-photo-conveyor]')];
  const featured = gallery.querySelector('.performance-featured');
  const image = featured.querySelector('img');
  const previous = gallery.querySelector('[data-featured-previous]');
  const counter = gallery.querySelector('[data-photo-counter]');
  const pause = gallery.querySelector('[data-gallery-pause]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const viewer = document.querySelector('[data-image-viewer]');
  let themeIndex = 0;
  let photoIndex = themes[0].initial;
  let pendingSelection = 0;
  let paused = false;
  let animations = [];

  const stopAnimations = () => {
    animations.forEach(animation => animation.cancel());
    animations = [];
  };

  const updateSelection = () => {
    [...rails, thumbnailGrid].filter(Boolean).forEach(container => {
      container.querySelectorAll('[data-photo-index]').forEach(button => {
        button.setAttribute('aria-pressed', String(Number(button.dataset.photoIndex) === photoIndex));
      });
    });
    counter.textContent = `${String(photoIndex + 1).padStart(2, '0')} / ${String(themes[themeIndex].photos.length).padStart(2, '0')}`;
  };

  // Commit only the most recent request once its image is decoded. Rapid clicks
  // and theme changes cannot leave a stale photograph in the selected theme.
  const selectPhoto = async (index, themeChange = false) => {
    const request = ++pendingSelection;
    const selectedTheme = themeIndex;
    const theme = themes[selectedTheme];
    const photo = theme.photos[index];
    if (!photo) return;
    const incoming = new Image();
    incoming.src = photo.preview;
    try {
      await incoming.decode();
    } catch {
      // The original is also a usable fallback if a derived preview is missing.
      incoming.src = photo.src;
      try { await incoming.decode(); } catch { return; }
    }
    if (request !== pendingSelection || selectedTheme !== themeIndex) return;
    stopAnimations();
    previous.src = image.currentSrc || image.src;
    image.src = incoming.src;
    image.alt = photo.alt;
    image.width = photo.width;
    image.height = photo.height;
    featured.dataset.imageFullSrc = photo.src;
    featured.dataset.imageTitle = theme.label;
    featured.setAttribute('aria-label', `Enlarge ${theme.label}, photograph ${index + 1}`);
    photoIndex = index;
    updateSelection();
    if (!reduced.matches && typeof image.animate === 'function') {
      const options = { duration: themeChange ? 360 : 300, easing: 'cubic-bezier(.22, 1, .36, 1)' };
      animations = [
        previous.animate([{ opacity: 1 }, { opacity: 0 }], options),
        image.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }], options)
      ];
    }
  };

  const measureRails = () => {
    rails.forEach(rail => {
      const group = rail.querySelector('.photo-group');
      if (!group) return;
      const distance = group.offsetWidth;
      rail.style.setProperty('--photo-cycle', `${distance}px`);
      const speed = (window.innerWidth <= 740 ? 56 : 96) / 1.5;
      rail.style.setProperty('--photo-duration', `${Math.max(1, distance / speed)}s`);
    });
  };

  const syncArchiveLayout = () => {
    if (archive) archive.open = !mobileArchive.matches || themes[themeIndex].photos.length <= 12;
  };

  const renderThumbnails = () => {
    if (!thumbnailGrid) return;
    const theme = themes[themeIndex];
    thumbnailGrid.replaceChildren();
    theme.photos.forEach((photo, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'archive-thumbnail';
      button.dataset.photoIndex = index;
      button.setAttribute('aria-label', `Show ${theme.label}, photograph ${index + 1}`);
      button.setAttribute('aria-controls', 'performance-panel');
      button.setAttribute('aria-pressed', String(index === photoIndex));
      const thumbnail = document.createElement('img');
      thumbnail.src = photo.thumbnail;
      thumbnail.alt = '';
      thumbnail.width = photo.width;
      thumbnail.height = photo.height;
      thumbnail.loading = 'lazy';
      thumbnail.decoding = 'async';
      button.append(thumbnail);
      thumbnailGrid.append(button);
    });
    if (archiveCount) archiveCount.textContent = String(theme.photos.length);
    if (archive) archive.hidden = false;
    syncArchiveLayout();
  };

  const renderRails = () => {
    const theme = themes[themeIndex];
    rails.forEach((rail, railIndex) => {
      rail.replaceChildren();
      rail.scrollLeft = 0;
      rail.classList.remove('is-keyboard');
      const track = document.createElement('div');
      track.className = 'photo-track';
      const group = document.createElement('div');
      group.className = 'photo-group';
      // Both strips follow the original collection order. Only their movement
      // differs. Three groups cover the viewport even for the smallest theme.
      theme.photos.forEach((photo, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'photo-thumbnail';
        button.dataset.photoIndex = index;
        button.setAttribute('aria-label', `Show ${theme.label}, photograph ${index + 1}`);
        button.setAttribute('aria-pressed', String(index === photoIndex));
        const thumbnail = document.createElement('img');
        thumbnail.src = photo.thumbnail;
        thumbnail.alt = '';
        thumbnail.width = photo.width;
        thumbnail.height = photo.height;
        thumbnail.decoding = 'async';
        thumbnail.loading = railIndex === 0 && index < 6 ? 'eager' : 'lazy';
        button.append(thumbnail);
        group.append(button);
      });
      track.append(group);
      for (let copy = 0; copy < 2; copy++) {
        const duplicate = group.cloneNode(true);
        duplicate.setAttribute('aria-hidden', 'true');
        duplicate.querySelectorAll('button').forEach(button => {
          button.tabIndex = -1;
          button.setAttribute('aria-hidden', 'true');
        });
        track.append(duplicate);
      }
      rail.append(track);
    });
    measureRails();
  };

  const selectTheme = index => {
    if (index === themeIndex) return;
    themeIndex = index;
    const theme = themes[index];
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(index === i));
      tab.tabIndex = index === i ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', tabs[index].id);
    heading.textContent = theme.heading;
    // Clear the old theme immediately so that two collections never appear
    // together while the incoming representative photograph is loading.
    stopAnimations();
    previous.removeAttribute('src');
    image.src = theme.photos[theme.initial].thumbnail;
    image.alt = theme.photos[theme.initial].alt;
    featured.dataset.imageFullSrc = theme.photos[theme.initial].src;
    featured.dataset.imageTitle = theme.label;
    featured.setAttribute('aria-label', `Enlarge ${theme.label}, photograph ${theme.initial + 1}`);
    photoIndex = theme.initial;
    renderRails();
    renderThumbnails();
    updateSelection();
    selectPhoto(photoIndex, true);
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTheme(index));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      selectTheme(next);
      tabs[next].focus({ preventScroll: true });
      const tabRail = tabs[next].parentElement;
      tabRail.scrollLeft = Math.max(0, tabs[next].offsetLeft - tabRail.offsetLeft - 12);
    });
  });

  rails.forEach(rail => {
    rail.addEventListener('click', event => {
      const button = event.target.closest('[data-photo-index]');
      if (button) selectPhoto(Number(button.dataset.photoIndex));
    });
    rail.addEventListener('focusin', event => {
      const button = event.target.closest('[data-photo-index]');
      if (!button || !button.matches(':focus-visible')) return;
      rail.classList.add('is-keyboard');
      rail.scrollLeft = Math.max(0, button.offsetLeft - (rail.clientWidth - button.offsetWidth) / 2);
    });
    rail.addEventListener('focusout', event => {
      if (rail.contains(event.relatedTarget)) return;
      rail.classList.remove('is-keyboard');
      rail.scrollLeft = 0;
    });
  });

  thumbnailGrid?.addEventListener('click', event => {
    const button = event.target.closest('[data-photo-index]');
    if (button) selectPhoto(Number(button.dataset.photoIndex));
  });
  mobileArchive.addEventListener('change', syncArchiveLayout);

  const syncAvailability = () => {
    pause.hidden = reduced.matches;
    gallery.classList.toggle('is-suspended', document.hidden || Boolean(viewer?.open));
    if (reduced.matches) stopAnimations();
  };
  pause.addEventListener('click', () => {
    paused = !paused;
    pause.setAttribute('aria-pressed', String(paused));
    pause.textContent = paused ? 'Resume Motion' : 'Pause Motion';
    gallery.classList.toggle('is-paused', paused);
  });
  document.addEventListener('visibilitychange', syncAvailability);
  reduced.addEventListener('change', syncAvailability);
  window.addEventListener('resize', measureRails, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(measureRails).observe(gallery);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      gallery.classList.toggle('is-in-view', entries[0].isIntersecting);
    }).observe(gallery);
  } else gallery.classList.add('is-in-view');
  if (viewer && 'MutationObserver' in window) {
    new MutationObserver(syncAvailability).observe(viewer, { attributes: true, attributeFilter: ['open'] });
  }
  renderRails();
  renderThumbnails();
  updateSelection();
  syncAvailability();
})();
