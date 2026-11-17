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

  // All pages use the same navigation; WORK itself keeps its original link.
  const workNav = document.createElement('div');
  workNav.className = 'work-nav';
  workLink.before(workNav);
  workNav.innerHTML = `
    <div class="work-nav-trigger">
      <button class="work-toggle" type="button" aria-label="Toggle work navigation" aria-expanded="false" aria-controls="work-menu">
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
    <ul class="work-menu" id="work-menu" hidden>
      <li class="work-category">
        <div class="work-category-row" role="group" tabindex="0" aria-label="Engineering projects" aria-expanded="false" aria-controls="work-engineering">
          <span>Engineering</span>
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <ul class="work-submenu" id="work-engineering" aria-label="Engineering projects" hidden>
          <li><a href="ctag-fx.html">CTAG-FX</a></li>
          <li><a href="miracle.html">MIRACLE</a></li>
          <li><a href="umi-ft.html">UMI-F/T</a></li>
        </ul>
      </li>
      <li class="work-category">
        <div class="work-category-row" role="group" tabindex="0" aria-label="Music projects" aria-expanded="false" aria-controls="work-music">
          <span>Music</span>
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <ul class="work-submenu" id="work-music" aria-label="Music projects" hidden>
          <li><a href="performance-gallery.html">Performance Gallery</a></li>
          <li><a href="tone-laboratory.html">My Tone Laboratory</a></li>
        </ul>
      </li>
    </ul>`;
  workNav.querySelector('.work-nav-trigger').prepend(workLink);

  const toggle = workNav.querySelector('.work-toggle');
  const menu = workNav.querySelector('.work-menu');
  const categories = [...workNav.querySelectorAll('.work-category')];
  let closeTimer;

  const setCategory = (category, open) => {
    category.querySelector('.work-category-row').setAttribute('aria-expanded', String(open));
    category.querySelector('.work-submenu').hidden = !open;
  };
  const setMenu = open => {
    window.clearTimeout(closeTimer);
    toggle.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    if (!open) categories.forEach(category => setCategory(category, false));
  };
  const openCategory = category => {
    setMenu(true);
    categories.forEach(item => setCategory(item, item === category));
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
    } else if (event.key === 'ArrowDown' && (event.target === toggle || event.target === workLink)) {
      event.preventDefault();
      setMenu(true);
      categories[0].querySelector('.work-category-row').focus();
    }
  });

  categories.forEach(category => {
    const submenu = category.querySelector('.work-submenu');
    category.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'touch') openCategory(category);
    });
    category.addEventListener('focusin', () => openCategory(category));
    category.addEventListener('keydown', event => {
      if ((event.key === 'ArrowRight' || event.key === 'ArrowDown') && event.target.closest('.work-category-row')) {
        event.preventDefault();
        openCategory(category);
        submenu.querySelector('a').focus();
      }
    });
  });
})();
