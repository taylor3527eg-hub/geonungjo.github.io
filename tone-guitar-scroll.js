(() => {
  const initialize = list => {
    const entries = [...list.querySelectorAll(':scope > .gear-entry')]
      .map(card => ({ card, content: card.querySelector('.guitar-entry-content') }));
    if (!entries.length) return;
    const verticalFocus = list.hasAttribute('data-guitar-focus');
    const header = document.querySelector('.site-header');
    const sectionNav = document.querySelector('[data-section-nav]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;

    const clamp = value => Math.min(1, Math.max(0, value));
    const ease = value => value * value * (3 - 2 * value);

    const focusState = (box, viewport, readingTop) => {
      const available = Math.max(1, viewport - readingTop - 24);
      const mobile = window.innerWidth <= 640;
      // Give every guitar the same entrance distance. Deriving this from the
      // description height made shorter entries visibly more animated.
      // Only the full-size reading interval below depends on the card height.
      const entranceDistance = Math.max(1, Math.min(mobile ? 220 : 440,
        available * (mobile ? .5 : .66)));
      const entering = ease(clamp((viewport + 24 - box.top)
        / entranceDistance));

      // Wait for the final lines to pass the reading area before fading out.
      // This also gives the first and last guitars a complete reading interval
      // without adding pinned stages, spacer elements, or extra scroll distance.
      const exitStart = readingTop + Math.min(100, available * .16);
      const leaving = ease(clamp((exitStart - box.bottom)
        / Math.max(1, exitStart - readingTop + 32)));
      const focus = Math.min(entering, 1 - leaving);
      return {
        opacity: (mobile ? .65 : .2) + (mobile ? .35 : .8) * focus,
        scale: (mobile ? .96 : .88) + (mobile ? .04 : .12) * focus,
        y: (mobile ? 18 : 42) * (1 - entering - leaving)
      };
    };

    const update = () => {
      frame = 0;
      if (reducedMotion.matches) return;

      const viewport = window.innerHeight;
      const readingTop = (header?.getBoundingClientRect().height || 0)
        + (sectionNav?.getBoundingClientRect().height || 0) + 16;
      const entrance = Math.min(150, viewport * .2);
      const selection = window.getSelection();
      const range = selection && !selection.isCollapsed && selection.rangeCount
        ? selection.getRangeAt(0) : null;
      const states = entries.map(({ card, content }) => {
        // Measure the unchanged outer entry, not its animated picture/text wrapper.
        const box = card.getBoundingClientRect();
        const entering = ease(clamp((viewport - box.top) / entrance));
        const exitDistance = Math.max(1, Math.min(56, box.height * .1));
        const leaving = ease(clamp((box.bottom - readingTop) / exitDistance));
        const protectedContent = card.contains(document.activeElement)
          || (range && range.intersectsNode(card));
        if (verticalFocus) {
          return {
            content,
            ...(protectedContent ? { opacity: 1, scale: 1, y: 0 }
              : focusState(box, viewport, readingTop))
          };
        }
        return {
          content,
          opacity: protectedContent ? 1 : Math.min(entering, leaving),
          y: protectedContent ? 0 : 24 * (1 - entering) - 18 * (1 - leaving)
        };
      });
      states.forEach(({ content, opacity, y, scale }) => {
        content.style.setProperty('--guitar-opacity', opacity.toFixed(3));
        content.style.setProperty('--guitar-y', `${y.toFixed(2)}px`);
        if (verticalFocus) content.style.setProperty('--guitar-scale', scale.toFixed(4));
      });
    };

    const schedule = () => {
      if (frame || reducedMotion.matches) return;
      frame = window.requestAnimationFrame(update);
    };

    const syncMotion = () => {
      if (reducedMotion.matches) {
        window.cancelAnimationFrame(frame);
        frame = 0;
        list.classList.remove('is-scrolling');
        entries.forEach(({ content }) => {
          ['--guitar-opacity', '--guitar-y'].forEach(name => content.style.removeProperty(name));
          if (verticalFocus) content.style.removeProperty('--guitar-scale');
        });
        return;
      }
      update();
      list.classList.add('is-scrolling');
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('pageshow', schedule);
    document.addEventListener('selectionchange', schedule);
    document.addEventListener('focusin', schedule);
    document.addEventListener('focusout', schedule);
    reducedMotion.addEventListener('change', syncMotion);
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(schedule);
      [list, header, sectionNav].filter(Boolean).forEach(element => observer.observe(element));
    }
    if (document.fonts) document.fonts.ready.then(schedule);
    syncMotion();
  };

  document.querySelectorAll('[data-guitar-sequence]').forEach(initialize);
})();
