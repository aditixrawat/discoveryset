const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const range = (value, start, end) => clamp((value - start) / (end - start));
const mix = (start, end, amount) => start + (end - start) * amount;
const ease = value => 1 - Math.pow(1 - clamp(value), 3);

const objectFilm = document.querySelector('.object-film');
const caseRig = document.getElementById('case-rig');
const closedCase = document.querySelector('.closed-layer');
const openCase = document.querySelector('.open-layer');
const objectReflection = document.querySelector('.case-reflection');
const lineupFold = document.querySelector('.lineup-fold');
const foldLayers = [...document.querySelectorAll('.fold-layer')];
const foldActive = document.getElementById('fold-active');
const foldNum = document.getElementById('fold-num');
const foldName = document.getElementById('fold-name');
const foldNotes = document.getElementById('fold-notes');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const supportsScrollTimeline = CSS.supports('animation-timeline: scroll()');

const foldFrames = [
  { src: 'assets/images/fold/01.png', name: 'Faith At Last', notes: 'Bergamot rind, blue amber, cashmere leather.', alt: 'Faith At Last with bergamot, amber and leather' },
  { src: 'assets/images/fold/02.png', name: 'Figue Off', notes: 'Cut grass, fig, red wood.', alt: 'Figue Off with fig, grass and red wood' },
  { src: 'assets/images/fold/03.png', name: 'Tonic 29', notes: 'Yuzu citrus, crushed basil, Japanese tea.', alt: 'Tonic 29 with yuzu, basil and tea' },
  { src: 'assets/images/fold/04.png', name: 'Return Softly', notes: 'Jasmine tea, sea salt, skin musk.', alt: 'Return Softly with jasmine, salt and musk' },
  { src: 'assets/images/fold/05.png', name: 'Quando Noir', notes: 'Cypress bark, suede leather, dark patchouli.', alt: 'Quando Noir with cypress, suede and patchouli' },
  { src: 'assets/images/fold/06.png', name: 'Café Curio', notes: 'Italian espresso, dry tobacco, saffiano leather.', alt: 'Café Curio with espresso, tobacco and leather' },
  { src: 'assets/images/fold/07.png', name: 'Fragile Moss', notes: 'Rhubarb stem, Japanese pepper, Haitian vetiver.', alt: 'Fragile Moss with rhubarb, pepper and vetiver' },
  { src: 'assets/images/fold/08.png', name: 'Midnight Chatter', notes: 'Champagne, green apple, oakmoss.', alt: 'Midnight Chatter with champagne, apple and oakmoss' }
];

foldFrames.forEach(frame => { const preload = new Image(); preload.src = frame.src; });

const foldStage = document.querySelector('.fold-stage');
let foldCopyIndex = -1;
let running = false;

const state = {
  objectCurrent: 0,
  objectTarget: 0,
  foldCurrent: 0,
  foldTarget: 0
};

function localProgress(element) {
  const rect = element.getBoundingClientRect();
  const distance = element.offsetHeight - innerHeight;
  return distance > 0 ? clamp(-rect.top / distance) : 0;
}

function setOpacity(element, value) {
  element.style.opacity = clamp(value);
}

function updateObject(progress) {
  if (!caseRig || !closedCase || !openCase) return;
  const settle = ease(range(progress, .02, .22));
  const inspect = ease(range(progress, .18, .4));
  const open = ease(range(progress, .38, .64));
  const lift = ease(range(progress, .65, .9));
  const fade = ease(range(progress, .89, 1));
  const mobile = innerWidth < 701;

  const x = mobile ? 0 : mix(6, 0, settle) - inspect * 1.6;
  const y = mix(4, 0, settle) + lift * (mobile ? 14 : 16);
  const scale = mix(.78, 1.02, settle) + inspect * .04 - lift * .12;
  caseRig.style.transform = `translate(calc(-50% + ${x}vw),calc(-50% + ${y}vh)) perspective(1400px) rotateX(${mix(6, 0, settle)}deg) rotateY(${mix(-3.2, 1.8, inspect)}deg) scale(${scale})`;
  setOpacity(caseRig, 1 - fade);

  closedCase.style.opacity = 1 - open;
  closedCase.style.transform = `translateY(${-open * 1.8}%) scale(${1 - open * .02})`;
  openCase.style.opacity = open;
  openCase.style.transform = `translateY(${mix(1.8, 0, open)}%) scale(${mix(.98, 1, open)})`;

  const shadow = document.querySelector('.case-shadow');
  if (shadow) {
    shadow.style.opacity = mix(.1, .22, open) * (1 - fade);
    shadow.style.transform = `scale(${mix(.92, 1.08, open)})`;
  }

  if (objectReflection) {
    const reflectionPass = Math.sin(range(progress, .08, .46) * Math.PI);
    objectReflection.style.opacity = reduceMotion ? 0 : reflectionPass * .5;
    objectReflection.style.transform = `translateX(${mix(-90, 940, range(progress, .08, .46))}%) skewX(-10deg)`;
  }

  const copyA = document.querySelector('.copy-a');
  const copyB = document.querySelector('.copy-b');
  const aIn = range(progress, .04, .14) * (1 - range(progress, .28, .38));
  const bIn = range(progress, .61, .7) * (1 - range(progress, .86, .94));
  if (copyA) {
    copyA.style.opacity = aIn;
    copyA.style.clipPath = reduceMotion ? 'none' : `inset(0 0 ${(1 - aIn) * 100}% 0)`;
  }
  if (copyB) {
    copyB.style.opacity = bIn;
    copyB.style.clipPath = reduceMotion ? 'none' : `inset(0 0 ${(1 - bIn) * 100}% 0)`;
  }

  const meter = document.getElementById('object-meter-fill');
  if (meter) meter.style.width = `${progress * 100}%`;
}

function writeFoldCopy(index) {
  if (index === foldCopyIndex) return;
  foldCopyIndex = index;
  const frame = foldFrames[index];
  if (foldNum) foldNum.textContent = String(index + 1).padStart(2, '0');
  if (foldName) foldName.textContent = frame.name;
  if (foldNotes) foldNotes.textContent = frame.notes;
}

function foldScrollPos() {
  if (!lineupFold || foldLayers.length < 2) return 0;
  const pinH = foldStage ? foldStage.clientHeight : innerHeight;
  const total = lineupFold.offsetHeight - pinH;
  const scrolled = clamp(-lineupFold.getBoundingClientRect().top, 0, Math.max(total, 0));
  return total > 0 ? (scrolled / total) * (foldLayers.length - 1) : 0;
}

function updateFold() {
  if (foldLayers.length < 2) return;
  const maxPos = foldLayers.length - 1;
  const pos = clamp(foldScrollPos(), 0, maxPos);
  const base = Math.min(maxPos, Math.floor(pos));
  const frac = pos - base;

  foldLayers.forEach((frame, i) => {
    if (i === base) {
      frame.style.opacity = '1';
      frame.style.webkitMaskImage = 'none';
      frame.style.maskImage = 'none';
      frame.style.zIndex = '1';
    } else if (i === base + 1) {
      const edge = reduceMotion ? (frac >= .5 ? 100 : 0) : frac * 100;
      const mask = `linear-gradient(to top, #141414 ${edge.toFixed(1)}%, transparent ${Math.min(edge + 12, 100).toFixed(1)}%)`;
      frame.style.opacity = '1';
      frame.style.webkitMaskImage = mask;
      frame.style.maskImage = mask;
      frame.style.zIndex = '2';
    } else {
      frame.style.opacity = '0';
      frame.style.webkitMaskImage = 'none';
      frame.style.maskImage = 'none';
      frame.style.zIndex = '0';
    }
  });

  const copyIndex = frac >= .5 && base < maxPos ? base + 1 : base;
  const copyHold = base < maxPos ? 1 - Math.sin(range(frac, .42, .58) * Math.PI) : 1;
  if (foldActive) foldActive.style.opacity = reduceMotion ? 1 : copyHold;
  writeFoldCopy(copyIndex);
}

function updateInterface() {
  if (supportsScrollTimeline) return;
  const maxScroll = document.documentElement.scrollHeight - innerHeight;
  const progress = document.getElementById('page-progress');
  if (progress) progress.style.transform = `scaleX(${maxScroll ? scrollY / maxScroll : 0})`;
}

function render() {
  state.objectTarget = localProgress(objectFilm);
  state.objectCurrent += (state.objectTarget - state.objectCurrent) * .09;
  if (lineupFold) {
    state.foldTarget = foldScrollPos();
    state.foldCurrent += (state.foldTarget - state.foldCurrent) * .18;
  }

  updateObject(state.objectCurrent);
  updateFold();
  updateInterface();

  const moving = visibleFilms.size > 0
    || Math.abs(state.objectTarget - state.objectCurrent) > .00035
    || Math.abs(state.foldTarget - state.foldCurrent) > .00035;
  if (moving) requestAnimationFrame(render);
  else running = false;
}

function requestRender() {
  if (running) return;
  running = true;
  requestAnimationFrame(render);
}

const visibleFilms = new Set();
const filmObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) visibleFilms.add(entry.target);
    else visibleFilms.delete(entry.target);
  });
  caseRig?.classList.toggle('is-live', visibleFilms.has(objectFilm));
  if (visibleFilms.size) requestRender();
}, { threshold: 0, rootMargin: '12% 0px' });

if (objectFilm) filmObserver.observe(objectFilm);
if (lineupFold) filmObserver.observe(lineupFold);
addEventListener('resize', requestRender);
requestRender();

const aPlusTrack = document.getElementById('a-plus-track') || document.querySelector('.a-plus-track');
const aPlusSection = document.getElementById('a-plus');
const aPlusVideos = [...document.querySelectorAll('.a-plus-video')];

function playAPlusVideo(video) {
  if (!video || reduceMotion) return;
  const play = video.play();
  if (play) {
    play.then(() => video.classList.add('is-playing')).catch(() => video.classList.add('is-poster'));
  }
}

function pauseAPlusVideos() {
  aPlusVideos.forEach(video => {
    video.pause();
    if (!video.classList.contains('is-on')) video.currentTime = 0;
  });
}

function setAPlusVideo(index) {
  aPlusVideos.forEach((video, i) => {
    const on = i === index;
    video.classList.toggle('is-on', on);
    if (on) playAPlusVideo(video);
    else {
      video.pause();
      video.currentTime = 0;
      video.classList.remove('is-playing');
    }
  });
}

aPlusVideos.forEach(video => {
  video.addEventListener('error', () => video.classList.add('is-poster'));
  video.addEventListener('emptied', () => video.classList.remove('is-playing'));
});

if (aPlusTrack) {
  const aPlusCards = [...aPlusTrack.querySelectorAll('.a-plus-card')];
  const setStoryIndex = index => {
    aPlusCards.forEach((card, i) => card.classList.toggle('is-active', i === index));
    setAPlusVideo(index);
  };
  const cardStep = () => {
    const card = aPlusTrack.querySelector('.a-plus-card');
    return card ? card.getBoundingClientRect().width + 18 : aPlusTrack.clientWidth * .7;
  };
  const storyIO = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) setStoryIndex(Number(visible.target.dataset.index) || aPlusCards.indexOf(visible.target));
  }, { root: aPlusTrack, threshold: [.45, .6, .75] });
  aPlusCards.forEach(card => storyIO.observe(card));

  aPlusTrack.addEventListener('wheel', event => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    aPlusTrack.scrollBy({ left: event.deltaY, behavior: 'auto' });
  }, { passive: false });

  aPlusTrack.addEventListener('keydown', event => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const dir = event.key === 'ArrowRight' ? 1 : -1;
    aPlusTrack.scrollBy({ left: dir * cardStep(), behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  function scrollAPlus(direction) {
    aPlusTrack.scrollBy({ left: direction * cardStep(), behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  document.querySelector('.a-plus-nav.prev')?.addEventListener('click', () => scrollAPlus(-1));
  document.querySelector('.a-plus-nav.next')?.addEventListener('click', () => scrollAPlus(1));

  setAPlusVideo(0);
}

if (aPlusSection && aPlusVideos.length) {
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      const active = aPlusVideos.find(video => video.classList.contains('is-on'));
      playAPlusVideo(active);
    } else {
      pauseAPlusVideos();
    }
  }, { threshold: 0.12 }).observe(aPlusSection);
}

const OCCASION_TAGS = [
  { id: 'all', label: 'All' },
  { id: 'date', label: 'Date' },
  { id: 'gala', label: 'Gala' },
  { id: 'hike', label: 'Hike' },
  { id: 'garden', label: 'Garden' },
  { id: 'sea', label: 'Sea' },
  { id: 'cafe', label: 'Cafe' }
];

const scentCatalog = [
  { handle: 'faith-at-last', name: 'Faith At Last', bottle: 'assets/images/bottles/01.png', notes: 'assets/images/notes/faith-at-last.jpg', tags: ['sea', 'hike'] },
  { handle: 'figue-off', name: 'Figue Off', bottle: 'assets/images/bottles/02.png', notes: 'assets/images/notes/figue-off.jpg', tags: ['garden', 'hike'] },
  { handle: 'tonic-29', name: 'Tonic 29', bottle: 'assets/images/bottles/03.png', notes: 'assets/images/notes/tonic-29.jpg', tags: ['garden', 'sea', 'hike'] },
  { handle: 'return-softly', name: 'Return Softly', bottle: 'assets/images/bottles/04.png', notes: 'assets/images/notes/return-softly.jpg', tags: ['date', 'sea'] },
  { handle: 'quando-noir', name: 'Quando Noir', bottle: 'assets/images/bottles/05.png', notes: 'assets/images/notes/quando-noir.jpg', tags: ['date', 'gala'] },
  { handle: 'cafe-curio', name: 'Café Curio', bottle: 'assets/images/bottles/06.png', notes: 'assets/images/notes/cafe-curio.jpg', tags: ['cafe', 'date'] },
  { handle: 'fragile-moss', name: 'Fragile Moss', bottle: 'assets/images/bottles/07.png', notes: 'assets/images/notes/fragile-moss.jpg', tags: ['garden', 'hike'] },
  { handle: 'midnight-chatter', name: 'Midnight Chatter', bottle: 'assets/images/bottles/08.png', notes: 'assets/images/notes/midnight-chatter.jpg', tags: ['gala', 'date'] }
];

const finderTags = document.getElementById('finder-tags');
const finderGrid = document.getElementById('finder-grid');
const finderStatus = document.getElementById('finder-status');
const finderBar = document.getElementById('finder-bar');
const finderBarName = document.getElementById('finder-bar-name');
let activeOccasion = 'all';
let focusedHandle = scentCatalog[0].handle;
let finderFocusIO;

function listedScents() {
  if (activeOccasion === 'all') return scentCatalog;
  return scentCatalog.filter(scent => scent.tags.includes(activeOccasion));
}

function setFocusedScent(handle) {
  const scent = scentCatalog.find(item => item.handle === handle) || listedScents()[0];
  if (!scent) return;
  focusedHandle = scent.handle;
  if (finderBarName) finderBarName.textContent = scent.name;
  finderGrid?.querySelectorAll('.finder-cell').forEach(cell => {
    cell.classList.toggle('is-active', cell.dataset.handle === focusedHandle);
  });
}

function bindFinderFocus() {
  finderFocusIO?.disconnect();
  const cells = [...(finderGrid?.querySelectorAll('.finder-cell') || [])];
  if (!cells.length) return;
  finderFocusIO = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) setFocusedScent(visible.target.dataset.handle);
  }, { rootMargin: '-35% 0px -35% 0px', threshold: [.25, .5, .75] });
  cells.forEach(cell => finderFocusIO.observe(cell));
}

function renderFinder() {
  if (!finderGrid || !finderTags) return;
  const listed = listedScents();

  if (activeOccasion === 'all') {
    finderStatus.textContent = 'All eight, in house order.';
  } else {
    const label = OCCASION_TAGS.find(tag => tag.id === activeOccasion)?.label.toUpperCase();
    finderStatus.textContent = listed.length
      ? `Showing ${listed.length} for ${label}.`
      : `Nothing for ${label}. Try another occasion.`;
  }

  finderGrid.innerHTML = listed.map((scent, index) => {
    const bottle = `<button class="finder-cell is-bottle" type="button" data-handle="${scent.handle}" aria-label="${scent.name}"><img src="${scent.bottle}" alt=""></button>`;
    const notes = `<button class="finder-cell is-notes" type="button" data-handle="${scent.handle}" aria-label="${scent.name} notes"><img src="${scent.notes}" alt=""></button>`;
    return index % 2 === 0 ? bottle + notes : notes + bottle;
  }).join('');

  if (!listed.some(scent => scent.handle === focusedHandle)) {
    focusedHandle = listed[0]?.handle || scentCatalog[0].handle;
  }
  setFocusedScent(focusedHandle);
  bindFinderFocus();
}

if (finderTags && finderGrid) {
  finderTags.innerHTML = OCCASION_TAGS.map((tag, index) =>
    `<button class="finder-tag" type="button" data-tag="${tag.id}" aria-pressed="${index === 0 ? 'true' : 'false'}">${tag.label}</button>`
  ).join('');

  finderTags.addEventListener('click', event => {
    const button = event.target.closest('[data-tag]');
    if (!button) return;
    activeOccasion = button.dataset.tag;
    finderTags.querySelectorAll('.finder-tag').forEach(tag => {
      tag.setAttribute('aria-pressed', tag === button ? 'true' : 'false');
    });
    renderFinder();
  });

  finderGrid.addEventListener('pointerover', event => {
    const cell = event.target.closest('.finder-cell');
    if (cell) setFocusedScent(cell.dataset.handle);
  });

  finderGrid.addEventListener('focusin', event => {
    const cell = event.target.closest('.finder-cell');
    if (cell) setFocusedScent(cell.dataset.handle);
  });

  renderFinder();
}

document.querySelectorAll('.closing-buy').forEach(button => {
  button.addEventListener('click', () => {
    button.classList.add('is-done');
    document.querySelectorAll('.closing-buy span').forEach(label => { label.textContent = 'Added to bag'; });
    const bag = document.querySelector('.bag-count');
    if (bag) bag.textContent = 'BAG  1';
  });
});

const siteHeader = document.querySelector('.site-header');
const shopDock = document.querySelector('.shop-dock');
const purchase = document.getElementById('purchase');
const finderSection = document.querySelector('.finder');

const compactSentinel = document.createElement('div');
compactSentinel.setAttribute('aria-hidden', 'true');
compactSentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:24px;pointer-events:none;';
document.body.prepend(compactSentinel);

new IntersectionObserver(([entry]) => {
  if (siteHeader) siteHeader.classList.toggle('is-compact', !entry.isIntersecting);
}, { threshold: 0 }).observe(compactSentinel);

let foldReached = false;
let overPurchase = false;
let overFinder = false;

function syncShopDock() {
  if (shopDock) shopDock.classList.toggle('is-hidden', !foldReached || overPurchase || overFinder);
  if (finderBar) finderBar.classList.toggle('is-hidden', !overFinder || overPurchase);
}

if (shopDock && lineupFold) {
  new IntersectionObserver(([entry]) => {
    foldReached = entry.isIntersecting || entry.boundingClientRect.top < 0;
    syncShopDock();
  }, { threshold: 0 }).observe(lineupFold);
}

if (finderSection) {
  new IntersectionObserver(([entry]) => {
    overFinder = entry.isIntersecting;
    syncShopDock();
  }, { threshold: 0, rootMargin: '-18% 0px -18% 0px' }).observe(finderSection);
}

if (shopDock && purchase) {
  new IntersectionObserver(([entry]) => {
    overPurchase = entry.isIntersecting;
    syncShopDock();
  }, { threshold: 0, rootMargin: '-20% 0px -20% 0px' }).observe(purchase);
}
