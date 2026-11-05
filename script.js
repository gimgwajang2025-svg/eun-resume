// 휴대폰 햄버거 메뉴 열고 닫기
const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');

function setMenu(open) {
  nav.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
}
toggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));

// 화면에 보일 때 스르륵 나타나기
const items = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  items.forEach((item) => observer.observe(item));
} else {
  items.forEach((item) => item.classList.add('show'));
}

// 경력 캐러셀: 가운데에서 멀어질수록 조금씩 작고 흐리게 (움직이는 동안 계속 부드럽게 바뀜)
const track = document.querySelector('.carousel-track');
const cards = [...track.querySelectorAll('.capsule')];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function markCenter() {
  const mid = track.getBoundingClientRect().left + track.clientWidth / 2;
  let closestIndex = 0;
  let best = Infinity;
  cards.forEach((card, i) => {
    const r = card.getBoundingClientRect();
    const d = Math.abs(r.left + r.width / 2 - mid);
    // 0 = 딱 가운데, 1 = 카드 한 장만큼 떨어짐
    const p = Math.min(1, d / (card.offsetWidth + 24));
    card.style.setProperty('--p', p.toFixed(3));
    if (d < best) { best = d; closestIndex = i; }
  });
  return closestIndex;
}

// 천천히 출발해서 천천히 멈추는 이동
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
let animId = null;

function goTo(index) {
  const card = cards[Math.max(0, Math.min(cards.length - 1, index))];
  const target = card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
  if (reduceMotion) { track.scrollLeft = target; markCenter(); return; }

  cancelAnimationFrame(animId);
  const start = track.scrollLeft;
  const distance = target - start;
  const duration = 700;
  const t0 = performance.now();
  track.classList.add('animating');

  function step(now) {
    const t = Math.min(1, (now - t0) / duration);
    track.scrollLeft = start + distance * ease(t);
    if (t < 1) {
      animId = requestAnimationFrame(step);
    } else {
      track.classList.remove('animating');
    }
  }
  animId = requestAnimationFrame(step);
}

// 넘어가는 중에 손으로 밀면, 자동 이동을 멈추고 손을 따라가기
function stopAnim() {
  cancelAnimationFrame(animId);
  track.classList.remove('animating');
}
track.addEventListener('pointerdown', stopAnim);
track.addEventListener('wheel', stopAnim, { passive: true });
track.addEventListener('touchstart', stopAnim, { passive: true });

document.querySelector('.arrow.prev').addEventListener('click', () => goTo(markCenter() - 1));
document.querySelector('.arrow.next').addEventListener('click', () => goTo(markCenter() + 1));
track.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(markCenter() - 1); }
  if (e.key === 'ArrowRight') { e.preventDefault(); goTo(markCenter() + 1); }
});

let ticking = false;
track.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => { markCenter(); ticking = false; });
    ticking = true;
  }
});
window.addEventListener('resize', markCenter);
markCenter();
