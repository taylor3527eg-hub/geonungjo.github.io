(() => {
  const nav = document.querySelector('[data-section-nav]');
  const header = document.querySelector('.site-header');
  if (!nav || !header) return;

  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const links = [...nav.querySelectorAll('a[href^="#"]')];
  const linksById = new Map(links.map(link => [link.hash.slice(1), link]));
  // Each major section has its own menu item.
  const sections = [...document.querySelectorAll('main > .section-block')]
    .map(section => ({ section, link: linksById.get(section.id) }))
    .filter(entry => entry.link);
  if (!sections.length) return;

  let activeLink = null;
  let scheduled = false;

  const revealLink = link => {
    if (!link || nav.scrollWidth <= nav.clientWidth) return;
    const box = nav.getBoundingClientRect();
    const item = link.getBoundingClientRect();
    let delta = 0;
    if (item.left < box.left + 6) delta = item.left - box.left - 6;
    else if (item.right > box.right - 6) delta = item.right - box.right + 6;
    if (delta) nav.scrollTo({
      left: nav.scrollLeft + delta,
      behavior: reducedMotion.matches ? 'instant' : 'smooth'
    });
  };

  const update = () => {
    scheduled = false;
    const headerHeight = header.getBoundingClientRect().height;
    const navBox = nav.getBoundingClientRect();
    const readingLine = headerHeight + navBox.height + 16;
    nav.classList.toggle('is-stuck', navBox.top <= headerHeight + 1);

    let nextLink = null;
    for (const entry of sections) {
      if (entry.section.getBoundingClientRect().top > readingLine + 1) break;
      nextLink = entry.link;
    }
    // A short final section may never reach the reading line before the page ends.
    const atBottom = window.scrollY + window.innerHeight >= root.scrollHeight - 2;
    if (atBottom) nextLink = sections[sections.length - 1].link;
    if (nextLink === activeLink) return;
    links.forEach(link => {
      if (link === nextLink) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    activeLink = nextLink;
    revealLink(activeLink);
  };

  const scheduleUpdate = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(update);
  };

  const measure = () => {
    root.style.setProperty('--section-nav-height', `${nav.getBoundingClientRect().height}px`);
    scheduleUpdate();
  };

  // The shared header script supplies --header-height, including its compact state.
  // Measure the section bar separately so wrapped text, zoom and mobile stay correct.
  const observer = new ResizeObserver(measure);
  observer.observe(nav);
  observer.observe(header);
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('pageshow', measure);
  window.addEventListener('hashchange', scheduleUpdate);
  if (document.fonts) document.fonts.ready.then(measure);
  measure();
})();
