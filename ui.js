// ui.js
const menu = document.getElementById('menu');
const menuOpenBtn = document.getElementById('menu-open');
const menuCloseBtn = document.getElementById('menu-close');
const menuBackdrop = document.getElementById('menu-backdrop');
const menuLinks = document.querySelectorAll('.menu__link');

function setMenu(open) {
  if (!menu || !menuOpenBtn) return;
  if (open) {
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    menuOpenBtn.setAttribute('aria-expanded', 'true');
    menuCloseBtn?.focus({ preventScroll: true });
  } else {
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    menuOpenBtn.setAttribute('aria-expanded', 'false');
    menuOpenBtn.focus({ preventScroll: true });
  }
}

menuOpenBtn?.addEventListener('click', () => setMenu(true));
menuCloseBtn?.addEventListener('click', () => setMenu(false));
menuBackdrop?.addEventListener('click', () => setMenu(false));

menuLinks.forEach((link) => {
  link.addEventListener('click', () => setMenu(false));
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menu?.classList.contains('is-open')) {
    setMenu(false);
  }
});
