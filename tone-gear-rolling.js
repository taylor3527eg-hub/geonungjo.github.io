(() => {
  const initialize = list => {
    const cards = [...list.querySelectorAll(':scope > .gear-entry')];
    if (!cards.length) return;
    const entries = cards.map((card, index) => ({
      card,
      content: card.querySelector('.gear-roll-content'),
      side: index % 2 ? 1 : -1
    }));
    const header = document.querySelector('.site-header');
    const sectionNav = document.querySelector('[data-section-nav]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let measured = [];
    let radius = 0;
    let enterDistance = 1;
    // Bottom-to-front and front-to-top are two quarters of one mirrored semicircle.
    const maxAngle = Math.PI / 2;
    const shrink = .34;

    const clamp = value => Math.min(1, Math.max(0, value));
    const ease = value => value * value * (3 - 2 * value);

    const update = () => {
      frame = 0;
      if (reducedMotion.matches) return;

      const viewport = window.innerHeight;
      const selection = window.getSelection();
      const range = selection && !selection.isCollapsed && selection.rangeCount
        ? selection.getRangeAt(0) : null;

      // Outer stages stay in normal document flow; only inner content takes the arc.
      const states = measured.map(({ card, content, side, pinTop, hold, travel }) => {
        const box = card.getBoundingClientRect();
        const entering = clamp((viewport - 24 - box.top) / enterDistance);
        // The full card first scrolls into view, then holds before the exit begins.
        // Tall descriptions scroll naturally until their final lines have appeared.
        const leaving = clamp((pinTop - box.top - hold) / travel);
        const exiting = leaving > 0;
        const angle = maxAngle * (exiting ? leaving : 1 - entering);
        // Cancel the document's vertical entry drift so the visible approach is circular.
        const entryDrift = exiting ? 0 : enterDistance * (1 - entering);
        const selected = (range && range.intersectsNode(card)) || card.contains(document.activeElement);
        return {
          content,
          opacity: selected ? 1 : exiting ? 1 - ease(leaving) : ease(entering),
          scale: selected ? 1 : 1 - shrink * Math.sin(angle),
          x: selected ? 0 : side * radius * (1 - Math.cos(angle)),
          y: selected ? 0 : (exiting ? -1 : 1) * radius * Math.sin(angle) - entryDrift
        };
      });
      states.forEach(({ content, opacity, scale, x, y }) => {
        content.style.setProperty('--gear-opacity', opacity.toFixed(3));
        content.style.setProperty('--gear-scale', scale.toFixed(4));
        content.style.setProperty('--gear-x', `${x.toFixed(2)}px`);
        content.style.setProperty('--gear-y', `${y.toFixed(2)}px`);
        content.style.pointerEvents = opacity < .05 ? 'none' : '';
      });
    };

    const schedule = () => {
      if (frame || reducedMotion.matches) return;
      frame = window.requestAnimationFrame(update);
    };

    const measure = () => {
      if (reducedMotion.matches) return;
      const viewport = window.innerHeight;
      const viewportWidth = document.documentElement.clientWidth;
      const readingTop = (header?.getBoundingClientRect().height || 0)
        + (sectionNav?.getBoundingClientRect().height || 0) + 24;
      const available = Math.max(160, viewport - readingTop - 24);
      const travel = Math.max(120, Math.min(180, available * .26));
      enterDistance = Math.max(220, Math.min(360, available * .55));

      measured = entries.map(entry => {
        const box = entry.card.getBoundingClientRect();
        // offsetHeight excludes the animated transform, keeping the layout stable.
        const height = entry.content.offsetHeight;
        const hold = Math.max(48, Math.min(90, height * .2));
        return {
          ...entry,
          height,
          width: box.width,
          gutter: entry.side < 0 ? box.left : viewportWidth - box.right,
          pinTop: Math.min(readingTop, viewport - height - 24),
          hold,
          travel
        };
      });
      // Use one radius for both sides. Shrinking creates room for the outward arc,
      // and this bound keeps the whole card inside the viewport without clipping.
      const gutter = Math.max(0, Math.min(...measured.map(entry => entry.gutter)));
      const width = Math.min(...measured.map(entry => entry.width));
      radius = Math.max(0, Math.min(180, viewportWidth * .17, available * .28,
        gutter + width * shrink / 2 - 10));
      measured.forEach(({ card, height, hold, travel: distance, pinTop }) => {
        card.style.setProperty('--gear-stage-height', `${(height + hold + distance).toFixed(2)}px`);
        card.style.setProperty('--gear-pin-top', `${pinTop.toFixed(2)}px`);
        // Share most of the exit runway with the next card instead of leaving a gap.
        card.style.setProperty('--gear-overlap', `${Math.max(0, hold + distance - 32).toFixed(2)}px`);
      });
      schedule();
    };

    const syncMotion = () => {
      if (reducedMotion.matches) {
        window.cancelAnimationFrame(frame);
        frame = 0;
        list.classList.remove('is-rolling');
        entries.forEach(({ card, content }) => {
          ['--gear-stage-height', '--gear-pin-top', '--gear-overlap'].forEach(name => card.style.removeProperty(name));
          ['--gear-opacity', '--gear-scale', '--gear-x', '--gear-y'].forEach(name => content.style.removeProperty(name));
          content.style.pointerEvents = '';
        });
        return;
      }
      measure();
      list.classList.add('is-rolling');
      window.cancelAnimationFrame(frame);
      update();
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('pageshow', measure);
    document.addEventListener('selectionchange', schedule);
    document.addEventListener('focusin', schedule);
    document.addEventListener('focusout', schedule);
    reducedMotion.addEventListener('change', syncMotion);
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(measure);
      [...entries.map(entry => entry.content), header, sectionNav].filter(Boolean)
        .forEach(element => observer.observe(element));
    }
    if (document.fonts) document.fonts.ready.then(measure);
    syncMotion();
  };

  document.querySelectorAll('[data-gear-rolling]').forEach(initialize);
})();
