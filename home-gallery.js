(() => {
  const gallery = document.querySelector('#home-gallery');
  if (!gallery) return;

  const track = gallery.querySelector('#home-gallery-slides');
  const controls = gallery.querySelector('.home-gallery-controls');
  const [previous, next] = controls.querySelectorAll('button');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function updateControls() {
    previous.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
  }

  controls.addEventListener('click', event => {
    const button = event.target.closest('[data-gallery-step]');
    if (!button) return;
    const first = track.children[0].getBoundingClientRect();
    const second = track.children[1].getBoundingClientRect();
    track.scrollBy({
      left: (second.left - first.left) * Number(button.dataset.galleryStep),
      behavior: reducedMotion.matches ? 'instant' : 'smooth',
    });
  });

  track.addEventListener('scroll', updateControls, {passive: true});
  window.addEventListener('resize', updateControls);
  controls.hidden = false;
  updateControls();
})();
