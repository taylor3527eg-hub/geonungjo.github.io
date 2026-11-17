(() => {
  const rail = document.querySelector('[data-other-gear-rail]');
  if (!rail) return;
  const track = rail.querySelector('.other-gear-track');
  const originals = [...track.children];
  if (originals.length < 2) return;

  const toggle = document.querySelector('[data-rail-pause]');
  const dialog = document.querySelector('[data-image-viewer]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const speed = 64; // Pixels per second, right to left.
  let base = 0;
  let cycle = 0;
  let frame = 0;
  let lastTime = null;
  let automaticPosition = 0;
  let resumeTimer = 0;
  let manualUntil = 0;
  let suppressClickUntil = 0;
  let hovered = false;
  let pausedByUser = false;
  let visible = false;
  let pointer = null;

  const copyCard = (original, index) => {
    const copy = original.cloneNode(true);
    copy.dataset.railCopy = String(index);
    copy.setAttribute('aria-hidden', 'true');
    [copy, ...copy.querySelectorAll('[id], [data-source-block], [data-source-image]')]
      .forEach(node => ['id', 'data-source-block', 'data-source-image'].forEach(name => node.removeAttribute(name)));
    // Copies are decorative and cannot receive focus. Their image clicks forward
    // to the original image button, preserving the shared enlargement dialog.
    copy.querySelectorAll('button').forEach(button => {
      const image = document.createElement('div');
      image.className = button.className;
      image.append(...button.childNodes);
      button.replaceWith(image);
    });
    copy.querySelectorAll('a, [tabindex]').forEach(node => node.setAttribute('tabindex', '-1'));
    return copy;
  };
  const leading = originals.map(copyCard);
  track.prepend(...leading);
  track.append(...originals.map(copyCard));

  const wrap = value => cycle ? base + ((value - base) % cycle + cycle) % cycle : value;
  const blocked = () => reducedMotion.matches || pausedByUser || hovered || pointer
    || rail.contains(document.activeElement) || document.hidden || !visible || dialog?.open || !cycle;

  const tick = time => {
    frame = 0;
    if (blocked() || performance.now() < manualUntil) { sync(); return; }
    if (lastTime !== null) {
      const elapsed = Math.max(0, Math.min(48, time - lastTime));
      // Keep subpixel progress even on browsers that round scrollLeft on readback.
      automaticPosition = wrap(automaticPosition + speed * elapsed / 1000);
      rail.scrollLeft = automaticPosition;
    }
    lastTime = time;
    frame = window.requestAnimationFrame(tick);
  };

  function sync() {
    window.cancelAnimationFrame(frame);
    window.clearTimeout(resumeTimer);
    frame = 0;
    resumeTimer = 0;
    lastTime = null;
    if (toggle) {
      toggle.hidden = reducedMotion.matches;
      toggle.textContent = pausedByUser ? 'Resume' : 'Pause';
      toggle.setAttribute('aria-label', pausedByUser ? 'Resume automatic equipment scrolling' : 'Pause automatic equipment scrolling');
    }
    if (blocked()) return;
    const delay = manualUntil - performance.now();
    if (delay > 0) { resumeTimer = window.setTimeout(sync, delay + 16); return; }
    rail.classList.remove('is-manual');
    automaticPosition = rail.scrollLeft;
    frame = window.requestAnimationFrame(tick);
  }

  const pauseForInteraction = () => {
    manualUntil = performance.now() + 1800;
    rail.classList.add('is-manual');
    sync();
  };

  const measure = () => {
    const fraction = cycle ? (wrap(rail.scrollLeft) - base) / cycle : 0;
    base = originals[0].offsetLeft;
    cycle = base - leading[0].offsetLeft;
    rail.scrollLeft = base + fraction * cycle;
    const box = rail.getBoundingClientRect();
    visible = box.bottom > 0 && box.top < window.innerHeight;
    sync();
  };

  rail.addEventListener('pointerenter', event => {
    if (event.pointerType === 'touch') return;
    hovered = true;
    sync();
  });
  rail.addEventListener('pointerleave', () => { hovered = false; sync(); });
  rail.addEventListener('focusin', sync);
  rail.addEventListener('focusout', () => window.setTimeout(sync, 0));
  rail.addEventListener('dragstart', event => event.preventDefault());

  rail.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse') { pauseForInteraction(); return; }
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey) return;
    const box = rail.getBoundingClientRect();
    if (event.clientY >= box.top + rail.clientHeight) { pauseForInteraction(); return; }
    // Keep a mouse click from focusing the moving rail. Keyboard focus stays native.
    event.preventDefault();
    pointer = { id: event.pointerId, x: event.clientX, scroll: rail.scrollLeft, dragging: false };
    sync();
  });
  window.addEventListener('pointermove', event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const delta = event.clientX - pointer.x;
    if (!pointer.dragging && Math.abs(delta) < 6) return;
    if (!pointer.dragging) {
      pointer.dragging = true;
      rail.setPointerCapture(event.pointerId);
      rail.classList.add('is-dragging', 'is-manual');
    }
    event.preventDefault();
    rail.scrollLeft = wrap(pointer.scroll - delta);
  }, { passive: false });
  const finishPointer = event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dragged = pointer.dragging;
    pointer = null;
    rail.classList.remove('is-dragging');
    if (rail.hasPointerCapture(event.pointerId)) rail.releasePointerCapture(event.pointerId);
    if (dragged) {
      suppressClickUntil = performance.now() + 300;
      pauseForInteraction();
    } else sync();
  };
  window.addEventListener('pointerup', finishPointer);
  window.addEventListener('pointercancel', finishPointer);
  rail.addEventListener('pointerup', event => {
    if (event.pointerType === 'touch') pauseForInteraction();
  });
  rail.addEventListener('wheel', event => {
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey) pauseForInteraction();
  }, { passive: true });

  rail.addEventListener('click', event => {
    if (performance.now() < suppressClickUntil) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
  rail.addEventListener('click', event => {
    const copy = event.target.closest('[data-rail-copy]');
    if (copy && event.target.closest('.tone-image')) {
      originals[Number(copy.dataset.railCopy)].querySelector('[data-image-zoom]').click();
    }
    sync();
  });
  rail.addEventListener('scroll', () => {
    // Keep focused originals in place; decorative copies need no keyboard focus.
    if (rail.contains(document.activeElement) && document.activeElement !== rail) return;
    const value = wrap(rail.scrollLeft);
    if (Math.abs(value - rail.scrollLeft) > .5) rail.scrollLeft = value;
  }, { passive: true });
  rail.addEventListener('keydown', event => {
    if (event.target !== rail || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    pauseForInteraction();
    const stride = originals[1].offsetLeft - originals[0].offsetLeft;
    let target = rail.scrollLeft + (event.key === 'ArrowLeft' ? -stride : stride);
    if (event.key === 'Home') target = base;
    if (event.key === 'End') target = base + Math.max(0, cycle - rail.clientWidth);
    rail.scrollTo({ left: wrap(target), behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  });
  toggle?.addEventListener('click', () => { pausedByUser = !pausedByUser; sync(); });
  reducedMotion.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  dialog?.addEventListener('close', sync);
  window.addEventListener('pageshow', measure);
  window.addEventListener('resize', measure);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(measure);
    observer.observe(rail);
    observer.observe(track);
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      sync();
    }, { threshold: 0 });
    observer.observe(rail);
  }
  if (document.fonts) document.fonts.ready.then(measure);
  measure();
})();
