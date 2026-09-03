const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const range = (value, start, end) => clamp((value - start) / (end - start));
const mix = (start, end, amount) => start + (end - start) * amount;
const ease = value => 1 - Math.pow(1 - clamp(value), 3);

const objectFilm = document.querySelector('.object-film');
const caseRig = document.getElementById('case-rig');
const closedCase = document.querySelector('.closed-layer');
const openCase = document.querySelector('.open-layer');
const objectReflection = document.querySelector('.case-reflection');
const shopDock = document.querySelector('.shop-dock');
const lifestyle = document.querySelector('.lifestyle');
const lifestyleImage = document.querySelector('.lifestyle-stage img');
const lineupFold = document.querySelector('.lineup-fold');
const foldLayers = [...document.querySelectorAll('.fold-layer')];
const foldActive = document.getElementById('fold-active');
const foldNum = document.getElementById('fold-num');
const foldName = document.getElementById('fold-name');
const foldNotes = document.getElementById('fold-notes');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const foldFrames = [
  { src: 'assets/images/fold/01.png', name: 'Faith At Last', notes: 'Bergamot rind, blue amber, cashmere leather.', alt: 'Faith At Last with bergamot, amber and leather' },
  { src: 'assets/images/fold/02.png', name: 'Figue Off', notes: 'Cut grass, fig, red wood.', alt: 'Figue Off with fig, grass and red wood' },
  { src: 'assets/images/fold/03.png', name: 'Tonic 29', notes: 'Yuzu citrus, crushed basil, Japanese tea.', alt: 'Tonic 29 with yuzu, basil and tea' },
  { src: 'assets/images/fold/04.png', name: 'Going Home', notes: 'Jasmine tea, sea salt, skin musk.', alt: 'Going Home with jasmine, salt and musk' },
  { src: 'assets/images/fold/05.png', name: 'Quando Noir', notes: 'Cypress bark, suede leather, dark patchouli.', alt: 'Quando Noir with cypress, suede and patchouli' },
  { src: 'assets/images/fold/06.png', name: 'Café Curio', notes: 'Italian espresso, dry tobacco, saffiano leather.', alt: 'Café Curio with espresso, tobacco and leather' },
  { src: 'assets/images/fold/07.png', name: 'Fragile Moss', notes: 'Rhubarb stem, Japanese pepper, Haitian vetiver.', alt: 'Fragile Moss with rhubarb, pepper and vetiver' },
  { src: 'assets/images/fold/08.png', name: 'Talk Tonight', notes: 'Champagne, green apple, oakmoss.', alt: 'Talk Tonight with champagne, apple and oakmoss' }
];

foldFrames.forEach(frame => { const preload = new Image(); preload.src = frame.src; });

const foldStage = document.querySelector('.fold-stage');
let foldCopyIndex = -1;
let running = false;

const state = {
  objectCurrent: 0,
  objectTarget: 0,
  lifestyleCurrent: 0,
  lifestyleTarget: 0,
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
  const settle = ease(range(progress, .02, .22));
  const inspect = ease(range(progress, .18, .4));
  const open = ease(range(progress, .38, .64));
  const lift = ease(range(progress, .65, .9));
  const fade = ease(range(progress, .89, 1));
  const mobile = innerWidth < 701;

  const x = mobile ? 0 : mix(7, 0, settle) - inspect * 2;
  const y = mix(5, 0, settle) + lift * (mobile ? 17 : 20);
  const scale = mix(.72, 1.02, settle) + inspect * .055 - lift * .16;
  caseRig.style.transform = `translate(calc(-50% + ${x}vw),calc(-50% + ${y}vh)) perspective(1400px) rotateX(${mix(7, 0, settle)}deg) rotateY(${mix(-4, 2.2, inspect)}deg) scale(${scale})`;
  setOpacity(caseRig, 1 - fade);

  closedCase.style.opacity = 1 - open;
  closedCase.style.transform = `translateY(${-open * 2.5}%) scale(${1 - open * .025})`;
  openCase.style.opacity = open;
  openCase.style.transform = `translateY(${mix(2.5, 0, open)}%) scale(${mix(.975, 1, open)})`;

  const reflectionPass = Math.sin(range(progress, .08, .46) * Math.PI);
  objectReflection.style.opacity = reflectionPass * .54;
  objectReflection.style.transform = `translateX(${mix(-90, 940, range(progress, .08, .46))}%) skewX(-10deg)`;

  const copyA = document.querySelector('.copy-a');
  const copyB = document.querySelector('.copy-b');
  setOpacity(copyA, range(progress, .04, .13) * (1 - range(progress, .29, .4)));
  copyA.style.transform = `translateY(${mix(18, -10, range(progress, .04, .4))}px)`;
  setOpacity(copyB, range(progress, .61, .71) * (1 - range(progress, .86, .95)));
  copyB.style.transform = `translateY(${mix(18, -10, range(progress, .61, .95))}px)`;

  document.getElementById('object-meter-fill').style.width = `${progress * 100}%`;
}

function inView(element) {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  const mid = innerHeight * .5;
  return rect.top < mid && rect.bottom > mid;
}

function updateLifestyle(progress) {
  if (!lifestyleImage) return;
  const mobile = innerWidth < 701;
  const shift = reduceMotion ? 0 : (mobile ? mix(-2, 3, progress) : mix(-6, 8, progress));
  lifestyleImage.style.transform = `translate3d(0, ${shift}%, 0)`;
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
      const mask = `linear-gradient(to top, #000 ${edge.toFixed(1)}%, transparent ${Math.min(edge + 12, 100).toFixed(1)}%)`;
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
  const maxScroll = document.documentElement.scrollHeight - innerHeight;
  document.getElementById('page-progress').style.width = `${maxScroll ? scrollY / maxScroll * 100 : 0}%`;

  const onLight = ['.lineup-fold', '.finder', '.a-plus', '.closing'].some(sel => inView(document.querySelector(sel)));
  shopDock.classList.toggle('dark', onLight);
}

function render() {
  state.objectTarget = localProgress(objectFilm);
  state.objectCurrent += (state.objectTarget - state.objectCurrent) * .09;
  if (lifestyle) {
    state.lifestyleTarget = localProgress(lifestyle);
    state.lifestyleCurrent += (state.lifestyleTarget - state.lifestyleCurrent) * .09;
  }
  if (lineupFold) {
    state.foldTarget = foldScrollPos();
    state.foldCurrent += (state.foldTarget - state.foldCurrent) * .18;
  }

  updateObject(state.objectCurrent);
  updateLifestyle(state.lifestyleCurrent);
  updateFold();
  updateInterface();

  const moving = Math.abs(state.objectTarget - state.objectCurrent) > .00035
    || Math.abs(state.lifestyleTarget - state.lifestyleCurrent) > .00035
    || Math.abs(state.foldTarget - state.foldCurrent) > .00035;
  if (moving) requestAnimationFrame(render);
  else running = false;
}

function requestRender() {
  if (running) return;
  running = true;
  requestAnimationFrame(render);
}

const aPlusTrack = document.querySelector('.a-plus-track');
function scrollAPlus(direction) {
  if (!aPlusTrack) return;
  const card = aPlusTrack.querySelector('.a-plus-card');
  const step = card ? card.getBoundingClientRect().width + 22 : aPlusTrack.clientWidth * .7;
  aPlusTrack.scrollBy({ left: direction * step, behavior: reduceMotion ? 'auto' : 'smooth' });
}
document.querySelector('.a-plus-nav.prev')?.addEventListener('click', () => scrollAPlus(-1));
document.querySelector('.a-plus-nav.next')?.addEventListener('click', () => scrollAPlus(1));

/*
  Find Your Scent
  Yogesh: replace `scores` with a 1–10 ranking per fragrance per tag.
  Sidharth: Shopify product metafield
    namespace: lineup
    key: occasion_scores
    type: json
    example: { "day": 8, "night": 5, "party": 3, "office": 9, "date": 6, "brunch": 7, "weekend": 6, "travel": 8 }
  Scores below are draft placeholders until Yogesh signs off.
*/
const OCCASION_TAGS = ['day', 'night', 'party', 'office', 'date', 'brunch', 'weekend', 'travel'];

const scentCatalog = [
  { handle: 'faith-at-last', name: 'Faith At Last', family: 'AQUA · WOODY', image: 'assets/images/fold/01.png', scores: { day: 8, night: 5, party: 4, office: 8, date: 6, brunch: 7, weekend: 7, travel: 8 } },
  { handle: 'figue-off', name: 'Figue Off', family: 'GREEN · WOODY', image: 'assets/images/fold/02.png', scores: { day: 8, night: 5, party: 3, office: 6, date: 6, brunch: 7, weekend: 8, travel: 7 } },
  { handle: 'tonic-29', name: 'Tonic 29', family: 'CITRUS · GREEN', image: 'assets/images/fold/03.png', scores: { day: 9, night: 4, party: 4, office: 8, date: 5, brunch: 9, weekend: 8, travel: 8 } },
  { handle: 'going-home', name: 'Going Home', family: 'AQUA · MUSKY', image: 'assets/images/fold/04.png', scores: { day: 6, night: 8, party: 3, office: 4, date: 7, brunch: 5, weekend: 7, travel: 6 } },
  { handle: 'quando-noir', name: 'Quando Noir', family: 'WOODY', image: 'assets/images/fold/05.png', scores: { day: 3, night: 9, party: 7, office: 4, date: 8, brunch: 2, weekend: 6, travel: 5 } },
  { handle: 'cafe-curio', name: 'Café Curio', family: 'WOODY', image: 'assets/images/fold/06.png', scores: { day: 5, night: 8, party: 5, office: 7, date: 7, brunch: 4, weekend: 6, travel: 6 } },
  { handle: 'fragile-moss', name: 'Fragile Moss', family: 'WOODY · GREEN', image: 'assets/images/fold/07.png', scores: { day: 8, night: 5, party: 3, office: 7, date: 6, brunch: 6, weekend: 7, travel: 7 } },
  { handle: 'talk-tonight', name: 'Talk Tonight', family: 'GOURMAND · CITRUS', image: 'assets/images/fold/08.png', scores: { day: 5, night: 8, party: 9, office: 3, date: 8, brunch: 6, weekend: 7, travel: 4 } }
];

const finderTags = document.getElementById('finder-tags');
const finderGrid = document.getElementById('finder-grid');
const finderStatus = document.getElementById('finder-status');
const selectedOccasions = new Set();

function occasionScore(scent, tags) {
  if (!tags.length) return 0;
  return tags.reduce((sum, tag) => sum + (scent.scores[tag] || 0), 0) / tags.length;
}

function renderFinder() {
  if (!finderGrid || !finderTags) return;
  const tags = [...selectedOccasions];
  const ranked = scentCatalog
    .map((scent, index) => ({ scent, index, score: occasionScore(scent, tags) }))
    .sort((a, b) => tags.length ? b.score - a.score || a.index - b.index : a.index - b.index);

  if (tags.length) {
    const label = tags.map(tag => tag.toUpperCase()).join(' + ');
    finderStatus.textContent = `Ranked for ${label}. Draft 1–10 scores — Yogesh to confirm.`;
  } else {
    finderStatus.textContent = 'All eight, in house order.';
  }

  finderGrid.innerHTML = ranked.map(({ scent, score }) => {
    const low = tags.length && score < 6;
    const meter = tags.length
      ? `<div class="finder-score"><b>${Math.round(score)} / 10</b><i><em style="width:${score * 10}%"></em></i></div>`
      : '';
    return `<article class="finder-card${low ? ' is-low' : ''}" data-handle="${scent.handle}">
      <figure><img src="${scent.image}" alt="${scent.name}"></figure>
      <h3>${scent.name}</h3>
      <p class="finder-family">${scent.family}</p>
      ${meter}
    </article>`;
  }).join('');
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
    document.querySelectorAll('.closing-buy span').forEach(label => { label.textContent = 'ADDED TO BAG'; });
    document.querySelector('.header-actions button:last-child').textContent = 'BAG  1';
  });
});

addEventListener('scroll', requestRender, { passive: true });
addEventListener('resize', requestRender);
requestRender();
