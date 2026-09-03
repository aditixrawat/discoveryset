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
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

let running = false;

const state = {
  objectCurrent: 0,
  objectTarget: 0,
  lifestyleCurrent: 0,
  lifestyleTarget: 0
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
  const shift = reduceMotion ? 0 : (mobile ? mix(-1.2, 2.2, progress) : mix(-3.5, 6.5, progress));
  lifestyleImage.style.transform = `translate3d(0, ${shift}%, 0)`;
}

function updateInterface() {
  const maxScroll = document.documentElement.scrollHeight - innerHeight;
  document.getElementById('page-progress').style.width = `${maxScroll ? scrollY / maxScroll * 100 : 0}%`;

  const onLight = inView(document.querySelector('.closing'));
  shopDock.classList.toggle('dark', onLight);
}

function render() {
  state.objectTarget = localProgress(objectFilm);
  state.objectCurrent += (state.objectTarget - state.objectCurrent) * .09;
  if (lifestyle) {
    state.lifestyleTarget = localProgress(lifestyle);
    state.lifestyleCurrent += (state.lifestyleTarget - state.lifestyleCurrent) * .09;
  }

  updateObject(state.objectCurrent);
  updateLifestyle(state.lifestyleCurrent);
  updateInterface();

  const moving = Math.abs(state.objectTarget - state.objectCurrent) > .00035
    || Math.abs(state.lifestyleTarget - state.lifestyleCurrent) > .00035;
  if (moving) requestAnimationFrame(render);
  else running = false;
}

function requestRender() {
  if (running) return;
  running = true;
  requestAnimationFrame(render);
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
