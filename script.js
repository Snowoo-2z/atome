const productVisuals = document.querySelectorAll('[data-product-visual]');

function toggleProductVisual(productVisual) {
  const isActive = productVisual.classList.toggle('is-active');
  productVisual.setAttribute('aria-pressed', String(isActive));
}

// On touch screens, a tap lets visitors reveal the worn version without relying on hover.
productVisuals.forEach((productVisual) => {
  productVisual.addEventListener('click', () => {
    if (window.matchMedia('(hover: none)').matches) {
      toggleProductVisual(productVisual);
    }
  });

  productVisual.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleProductVisual(productVisual);
    }
  });
});

const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

revealElements.forEach((element) => revealObserver.observe(element));

const year = document.querySelector('#year');
if (year) {
  year.textContent = new Date().getFullYear();
}
