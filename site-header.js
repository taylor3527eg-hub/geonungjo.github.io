(() => {
  const header = document.querySelector('.site-header');
  if (!header) return;

  let compact = false;
  let scheduled = false;

  const updateHeader = () => {
    // Different thresholds prevent the height change from toggling itself.
    if (!compact && window.scrollY > 64) compact = true;
    else if (compact && window.scrollY < 16) compact = false;
    header.classList.toggle('is-compact', compact);
    scheduled = false;
  };

  const updateAnchorOffset = () => {
    document.documentElement.style.setProperty('--header-height', `${header.getBoundingClientRect().height}px`);
  };

  window.addEventListener('scroll', () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(updateHeader);
  }, { passive: true });
  window.addEventListener('pageshow', updateHeader);
  new ResizeObserver(updateAnchorOffset).observe(header);

  updateHeader();
  updateAnchorOffset();

  const workLink = header.querySelector('[data-work-link]');
  if (!workLink) return;

  // One shared disclosure keeps every project directly accessible.
  const workNav = document.createElement('div');
  workNav.className = 'work-nav';
  workLink.before(workNav);
  workNav.innerHTML = `
    <div class="work-nav-trigger">
      <button class="work-toggle" type="button" aria-label="Toggle Music &amp; Tech navigation" aria-expanded="false" aria-controls="work-menu">
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
    <ul class="work-menu" id="work-menu" hidden>
      <li class="work-category">
        <p class="work-category-heading" id="nav-music-technology"><span class="music-word">Music</span> <span class="technology-word">Technology</span></p>
        <ul class="work-category-links" aria-labelledby="nav-music-technology">
          <li><a href="ctag-fx.html">CTAG-FX</a></li>
          <li><a href="tone-laboratory.html">My Tone Laboratory</a></li>
        </ul>
      </li>
      <li class="work-category">
        <p class="work-category-heading" id="nav-robotics">Robotics</p>
        <ul class="work-category-links" aria-labelledby="nav-robotics">
          <li><a href="miracle.html">MIRACLE</a></li>
          <li><a href="umi-ft.html">UMI-F/T</a></li>
        </ul>
      </li>
      <li class="work-category">
        <p class="work-category-heading" id="nav-performance">Performance &amp; Teaching</p>
        <ul class="work-category-links" aria-labelledby="nav-performance">
          <li><a href="performance-gallery.html">Performance Gallery</a></li>
        </ul>
      </li>
    </ul>`;
  workNav.querySelector('.work-nav-trigger').prepend(workLink);

  const toggle = workNav.querySelector('.work-toggle');
  const menu = workNav.querySelector('.work-menu');
  const projectLinks = [...menu.querySelectorAll('a')];
  projectLinks.forEach(link => {
    if (new URL(link.href, document.baseURI).pathname !== window.location.pathname) return;
    link.setAttribute('aria-current', 'page');
    workNav.classList.add('has-active-project');
  });
  let closeTimer;

  const setMenu = open => {
    window.clearTimeout(closeTimer);
    toggle.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
  };

  workNav.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'touch') setMenu(true);
  });
  workNav.addEventListener('pointerleave', event => {
    if (event.pointerType !== 'touch') closeTimer = window.setTimeout(() => setMenu(false), 140);
  });
  toggle.addEventListener('click', () => setMenu(menu.hidden));
  workLink.addEventListener('focus', () => setMenu(true));
  workNav.addEventListener('focusout', event => {
    if (!workNav.contains(event.relatedTarget)) setMenu(false);
  });
  workNav.addEventListener('click', event => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('pointerdown', event => {
    if (!workNav.contains(event.target)) setMenu(false);
  });
  workNav.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setMenu(false);
      toggle.focus();
    } else if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && (event.target === toggle || event.target === workLink)) {
      event.preventDefault();
      setMenu(true);
      projectLinks[event.key === 'ArrowUp' ? projectLinks.length - 1 : 0]?.focus();
    } else if (menu.contains(event.target)) {
      const index = projectLinks.indexOf(event.target);
      let next;
      if (event.key === 'ArrowDown') next = (index + 1) % projectLinks.length;
      if (event.key === 'ArrowUp') next = (index + projectLinks.length - 1) % projectLinks.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = projectLinks.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        projectLinks[next]?.focus();
      }
    }
  });
})();
