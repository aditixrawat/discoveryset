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

const aPlusTrack = document.querySelector('.a-plus-track');
function scrollAPlus(direction) {
  if (!aPlusTrack) return;
  const card = aPlusTrack.querySelector('.a-plus-card');
  const step = card ? card.getBoundingClientRect().width + 22 : aPlusTrack.clientWidth * .7;
  aPlusTrack.scrollBy({ left: direction * step, behavior: reduceMotion ? 'auto' : 'smooth' });
}
document.querySelector('.a-plus-nav.prev')?.addEventListener('click', () => scrollAPlus(-1));
document.querySelector('.a-plus-nav.next')?.addEventListener('click', () => scrollAPlus(1));

const OCCASION_TAGS = ['day', 'night', 'party', 'office', 'date', 'brunch', 'weekend', 'travel'];

const scentCatalog = [
  { handle: 'faith-at-last', name: 'Faith At Last', family: 'AQUA · WOODY', image: 'assets/images/finder/01.png', tags: ['day', 'office', 'brunch', 'travel', 'weekend'] },
  { handle: 'figue-off', name: 'Figue Off', family: 'GREEN · WOODY', image: 'assets/images/finder/02.png', tags: ['day', 'weekend', 'brunch', 'travel'] },
  { handle: 'tonic-29', name: 'Tonic 29', family: 'CITRUS · GREEN', image: 'assets/images/finder/03.png', tags: ['day', 'office', 'brunch', 'weekend', 'travel'] },
  { handle: 'return-softly', name: 'Return Softly', family: 'AQUA · MUSKY', image: 'assets/images/finder/04.png', tags: ['night', 'date', 'weekend'] },
  { handle: 'quando-noir', name: 'Quando Noir', family: 'WOODY', image: 'assets/images/finder/05.png', tags: ['night', 'date', 'party'] },
  { handle: 'cafe-curio', name: 'Café Curio', family: 'WOODY', image: 'assets/images/finder/06.png', tags: ['night', 'office', 'date'] },
  { handle: 'fragile-moss', name: 'Fragile Moss', family: 'WOODY · GREEN', image: 'assets/images/finder/07.png', tags: ['day', 'office', 'weekend', 'travel'] },
  { handle: 'midnight-chatter', name: 'Midnight Chatter', family: 'GOURMAND · CITRUS', image: 'assets/images/finder/08.png', tags: ['night', 'party', 'date', 'weekend'] }
];

const finderTags = document.getElementById('finder-tags');
const finderGrid = document.getElementById('finder-grid');
const finderStatus = document.getElementById('finder-status');
const selectedOccasions = new Set();

function matchesOccasions(scent, tags) {
  if (!tags.length) return true;
  return tags.every(tag => scent.tags.includes(tag));
}

function renderFinder() {
  if (!finderGrid || !finderTags) return;
  const tags = [...selectedOccasions];
  const listed = scentCatalog.map((scent, index) => ({ scent, index, match: matchesOccasions(scent, tags) }));

  if (tags.length) {
    const label = tags.map(tag => tag.toUpperCase()).join(' + ');
    const count = listed.filter(item => item.match).length;
    finderStatus.textContent = count
      ? `Showing ${count} for ${label}.`
      : `Nothing for ${label}. Try another occasion.`;
  } else {
    finderStatus.textContent = 'All eight, in house order.';
  }

  finderGrid.innerHTML = listed.map(({ scent, match }) => `
    <article class="finder-card" data-handle="${scent.handle}" ${tags.length && !match ? 'hidden' : ''}>
      <figure><img src="${scent.image}" alt="${scent.name}"></figure>
      <h3>${scent.name}</h3>
      <p class="finder-family">${scent.family}</p>
    </article>`).join('');
}

if (finderTags) {
  finderTags.innerHTML = OCCASION_TAGS.map(tag =>
    `<button class="finder-tag" type="button" data-tag="${tag}" aria-pressed="false">${tag}</button>`
  ).join('');

  finderTags.addEventListener('click', event => {
    const button = event.target.closest('[data-tag]');
    if (!button) return;
    const tag = button.dataset.tag;
    if (selectedOccasions.has(tag)) selectedOccasions.delete(tag);
    else selectedOccasions.add(tag);
    button.setAttribute('aria-pressed', selectedOccasions.has(tag) ? 'true' : 'false');
    renderFinder();
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

const compactSentinel = document.createElement('div');
compactSentinel.setAttribute('aria-hidden', 'true');
compactSentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:24px;pointer-events:none;';
document.body.prepend(compactSentinel);

new IntersectionObserver(([entry]) => {
  if (siteHeader) siteHeader.classList.toggle('is-compact', !entry.isIntersecting);
}, { threshold: 0 }).observe(compactSentinel);

let foldReached = false;
let overPurchase = false;

function syncShopDock() {
  if (!shopDock) return;
  shopDock.classList.toggle('is-hidden', !foldReached || overPurchase);
}

if (shopDock && lineupFold) {
  new IntersectionObserver(([entry]) => {
    foldReached = entry.isIntersecting || entry.boundingClientRect.top < 0;
    syncShopDock();
  }, { threshold: 0 }).observe(lineupFold);
}

if (shopDock && purchase) {
  new IntersectionObserver(([entry]) => {
    overPurchase = entry.isIntersecting;
    syncShopDock();
  }, { threshold: 0, rootMargin: '-20% 0px -20% 0px' }).observe(purchase);
}
