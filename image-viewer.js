(() => {
  const imageViewer = document.querySelector('[data-image-viewer]');
  if (!imageViewer) return;

  const fullImage = imageViewer.querySelector('[data-full-image]');
  const imageCaption = imageViewer.querySelector('figcaption');
  const viewport = imageViewer.querySelector('.roadmap-zoom-viewport');
  let previousOverflow = '';

  for (const trigger of document.querySelectorAll('[data-image-zoom]')) {
    trigger.addEventListener('click', () => {
      const thumbnail = trigger.querySelector('img');
      fullImage.src = trigger.dataset.imageFullSrc || thumbnail.currentSrc || thumbnail.src;
      fullImage.alt = thumbnail.alt;
      fullImage.style.imageOrientation = thumbnail.dataset.imageOrientation || 'from-image';
      imageCaption.textContent = trigger.dataset.imageTitle;
      previousOverflow = document.body.style.overflow;
      imageViewer.showModal();
      document.body.style.overflow = 'hidden';
      if (viewport) {
        viewport.scrollTop = 0;
        viewport.scrollLeft = 0;
      }
    });
  }
  imageViewer.querySelector('[data-image-close]').addEventListener('click', () => imageViewer.close());
  imageViewer.addEventListener('click', event => {
    const box = imageViewer.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) imageViewer.close();
  });
  imageViewer.addEventListener('close', () => { document.body.style.overflow = previousOverflow; });
})();
