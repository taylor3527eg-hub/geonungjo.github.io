(() => {
  const onBodyVideo = document.querySelector('.miracle-on-body video');
  if (onBodyVideo) {
    onBodyVideo.volume = 0;
    onBodyVideo.muted = true;
  }

  const cadSelector = document.querySelector('[data-joint-cad-selector]');
  if (cadSelector) {
    const selected = cadSelector.querySelector('[data-cad-selected]');
    const caption = cadSelector.querySelector('[data-cad-selected-caption]');
    const choices = [...cadSelector.querySelectorAll('[data-cad-choice]')];
    const views = [selected, ...choices].map(button => {
      const image = button.querySelector('img');
      return {
        index: Number(button.dataset.cadView),
        src: button.dataset.imageFullSrc,
        preview: image.getAttribute('src'),
        width: image.getAttribute('width'),
        height: image.getAttribute('height'),
        alt: image.alt,
        title: button.dataset.imageTitle,
        caption: button.dataset.cadCaption
      };
    });

    const showView = index => {
      const view = views.find(item => item.index === index);
      if (!view) return;
      const updateImage = (button, item, action) => {
        const image = button.querySelector('img');
        image.src = item.preview;
        image.alt = item.alt;
        image.width = item.width;
        image.height = item.height;
        button.dataset.imageFullSrc = item.src;
        button.dataset.imageTitle = item.title;
        button.dataset.cadView = String(item.index);
        button.dataset.cadCaption = item.caption;
        button.setAttribute('aria-label', `${action} ${item.title}`);
      };
      updateImage(selected, view, 'Enlarge');
      // Size the two columns in proportion to their native aspect ratios so
      // both images share a height without cropping or padded containers.
      cadSelector.style.setProperty('--cad-selected-track', `${Number(view.width) / Number(view.height)}fr`);
      caption.textContent = view.caption;
      views.filter(item => item.index !== index).forEach((item, position) => {
        const choice = choices[position];
        updateImage(choice, item, 'Show');
        choice.closest('figure').querySelector('[data-cad-choice-caption]').textContent = item.caption;
      });
    };

    choices.forEach(choice => {
      choice.addEventListener('click', () => showView(Number(choice.dataset.cadView)));
    });
    showView(0);
  }

  document.querySelectorAll('[data-accordion-close]').forEach(button => {
    const accordion = button.closest('details');
    const summary = accordion?.querySelector(':scope > summary');
    if (!accordion || !summary) return;
    button.addEventListener('click', () => {
      if (!accordion.open) return;
      const summaryTop = summary.getBoundingClientRect().top + window.scrollY;
      accordion.open = false;
      summary.focus({ preventScroll: true });
      window.requestAnimationFrame(() => {
        const headerHeight = document.querySelector('.site-header')?.getBoundingClientRect().height || 0;
        const navHeight = document.querySelector('[data-section-nav]')?.getBoundingClientRect().height || 0;
        window.scrollTo({
          top: Math.max(0, summaryTop - headerHeight - navHeight - 16),
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
        });
      });
    });
  });

  const initializeTabs = (tablist, resetDocumentScroll = false) => {
    if (!tablist) return;
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];
    const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
    if (panels.some(panel => !panel)) return;
    let activeIndex = -1;

    const select = index => {
      tabs.forEach((tab, position) => {
        const active = index === position;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        panels[position].hidden = !active;
        if (!active) panels[position].querySelectorAll('video').forEach(video => video.pause());
        if (active && resetDocumentScroll && index !== activeIndex) {
          const documentView = panels[position].querySelector('.miracle-linkage-properties-scroll');
          if (documentView) {
            documentView.scrollTop = 0;
            documentView.scrollLeft = 0;
          }
        }
      });
      activeIndex = index;
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(index));
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        select(next);
        tabs[next].focus({ preventScroll: true });
      });
    });

    select(0);
    tablist.hidden = false;
  };

  initializeTabs(document.querySelector('[data-linkage-tabs]'), true);
  initializeTabs(document.querySelector('[data-simulation-tabs]'));
  initializeTabs(document.querySelector('[data-impedance-tabs]'));
})();
