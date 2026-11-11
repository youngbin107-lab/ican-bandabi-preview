(() => {
  const gallery = document.querySelector('#home-gallery');
  if (!gallery) return;

  const track = gallery.querySelector('#home-gallery-slides');
  const controls = gallery.querySelector('.home-gallery-controls');
  const [previous, next] = controls.querySelectorAll('button');
  const narrow = matchMedia('(max-width: 850px)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function updateControls() {
    previous.disabled = narrow.matches && track.scrollLeft <= 2;
    next.disabled = narrow.matches && track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
  }

  function finishDesktopMotion() {
    track.getAnimations({subtree: true}).forEach(animation => animation.cancel());
    track.querySelector('.home-gallery-exit')?.remove();
  }

  function rotateDesktop(step) {
    finishDesktopMotion();
    const outgoing = step > 0 ? track.firstElementChild : track.lastElementChild;
    const start = outgoing.offsetLeft;
    const width = outgoing.getBoundingClientRect().width;
    const travel = step * (track.children[1].offsetLeft - track.children[0].offsetLeft);

    if (step > 0) track.append(outgoing);
    else track.prepend(outgoing);
    if (reducedMotion.matches) return;

    const exit = outgoing.cloneNode(true);
    exit.classList.add('home-gallery-exit');
    exit.setAttribute('aria-hidden', 'true');
    exit.style.left = `${start}px`;
    exit.style.width = `${width}px`;
    const motion = {duration: 250, easing: 'ease-out'};
    for (const slide of track.children) {
      slide.animate([{transform: `translateX(${travel}px)`}, {transform: 'none'}], motion);
    }
    track.append(exit);
    exit.animate([{transform: 'none'}, {transform: `translateX(${-travel}px)`}], motion)
      .addEventListener('finish', () => exit.remove(), {once: true});
  }

  function move(step) {
    if (!narrow.matches) {
      rotateDesktop(step);
      return;
    }
    track.scrollBy({
      left: (track.children[1].offsetLeft - track.children[0].offsetLeft) * step,
      behavior: reducedMotion.matches ? 'instant' : 'smooth',
    });
  }

  controls.addEventListener('click', event => {
    const button = event.target.closest('[data-gallery-step]');
    if (button) move(Number(button.dataset.galleryStep));
  });

  track.addEventListener('keydown', event => {
    if (narrow.matches || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    move(event.key === 'ArrowRight' ? 1 : -1);
  });

  narrow.addEventListener('change', () => {
    finishDesktopMotion();
    track.scrollLeft = 0;
    updateControls();
  });

  track.addEventListener('scroll', updateControls, {passive: true});
  window.addEventListener('resize', updateControls);
  controls.hidden = false;
  updateControls();
})();
