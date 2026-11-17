(() => {
  const section = document.querySelector('.about-journey');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!section || reducedMotion.matches || !('IntersectionObserver' in window)) return;

  const targets = [];
  const prepare = (element, index) => {
    element.classList.add('journey-reveal', 'is-pending');
    element.style.setProperty('--reveal-delay', `${index * .12}s`);
    targets.push(element);
  };

  // Keep timeline dots and connecting lines still while the text slides in.
  section.querySelectorAll('.about-timeline > li').forEach((item, index) => {
    const text = document.createElement('div');
    text.className = 'timeline-entry';
    text.append(...item.childNodes);
    item.append(text);
    prepare(text, index);
  });

  // The collage's visual order differs from its order in the HTML.
  [...section.querySelectorAll('.journey-photo')]
    .sort((a, b) => a.offsetTop - b.offsetTop)
    .forEach(prepare);

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.remove('is-pending');
      entry.target.classList.add('is-revealed');
      observer.unobserve(entry.target);
    }
  }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });

  targets.forEach(target => observer.observe(target));
  reducedMotion.addEventListener('change', event => {
    if (!event.matches) return;
    observer.disconnect();
    targets.forEach(target => target.classList.remove('is-pending', 'is-revealed'));
  });
})();
