(() => {
  const section = document.querySelector('#camp-experiences');
  if (!section) return;

  const track = section.querySelector('#camp-experience-slides');
  const slides = [...track.children];
  const controls = section.querySelector('.wave-carousel-controls');
  const dots = [...controls.querySelectorAll('.wave-carousel-progress i')];
  const toggle = controls.querySelector('.wave-carousel-play');
  const mobile = matchMedia('(max-width: 600px)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const interval = 5000;

  let index = 0;
  let destination;
  let timer;
  let settleTimer;
  let inView = false;
  let playing = true;
  let pointerDown = false;

  function schedule() {
    clearTimeout(timer);
    const keyboardFocus = section.contains(document.activeElement) && document.activeElement.matches(':focus-visible');
    if (mobile.matches && !reducedMotion.matches && playing && inView && !document.hidden && !pointerDown && !keyboardFocus) {
      timer = setTimeout(() => move(1), interval);
    }
  }

  function showIndex(next) {
    index = next;
    dots.forEach((dot, position) => dot.classList.toggle('is-current', position === index));
  }

  function move(step) {
    const target = (destination ?? index) + step;
    const next = (target + slides.length) % slides.length;
    const wraps = target !== next;
    destination = next;
    track.scrollTo({left: slides[next].offsetLeft, behavior: wraps || reducedMotion.matches ? 'instant' : 'smooth'});
    settle();
    schedule();
  }

  function settle() {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => { destination = undefined; }, 180);
  }

  function updateControls() {
    section.toggleAttribute('data-carousel-ready', mobile.matches);
    controls.hidden = !mobile.matches;
    toggle.hidden = reducedMotion.matches;
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.title = playing ? '자동 넘김 일시정지' : '자동 넘김 시작';
    toggle.firstElementChild.textContent = playing ? 'Ⅱ' : '▶';
    schedule();
  }

  controls.querySelectorAll('[data-slide-step]').forEach(button => {
    button.addEventListener('click', () => move(Number(button.dataset.slideStep)));
  });

  toggle.addEventListener('click', () => {
    playing = !playing;
    updateControls();
  });

  track.addEventListener('scroll', () => {
    if (!mobile.matches) return;
    const closest = slides.reduce((nearest, slide, position) => (
      Math.abs(track.scrollLeft - slide.offsetLeft) < Math.abs(track.scrollLeft - slides[nearest].offsetLeft) ? position : nearest
    ), 0);
    if (closest !== index) showIndex(closest);
    settle();
    schedule();
  }, {passive: true});

  track.addEventListener('pointerdown', () => {
    pointerDown = true;
    destination = undefined;
    schedule();
  }, {passive: true});

  function releasePointer() {
    if (!pointerDown) return;
    pointerDown = false;
    schedule();
  }

  window.addEventListener('pointerup', releasePointer, {passive: true});
  window.addEventListener('pointercancel', releasePointer, {passive: true});
  section.addEventListener('focusin', schedule);
  section.addEventListener('focusout', () => queueMicrotask(schedule));
  document.addEventListener('visibilitychange', schedule);
  mobile.addEventListener('change', () => {
    updateControls();
    destination = undefined;
    showIndex(0);
    track.scrollLeft = 0;
  });
  reducedMotion.addEventListener('change', updateControls);

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.intersectionRatio >= 0.55;
      schedule();
    }, {threshold: 0.55});
    observer.observe(track);
  } else {
    inView = true;
  }

  updateControls();
})();
