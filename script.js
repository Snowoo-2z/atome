const productVisual = document.querySelector('[data-product-visual]');

// On touch screens, a tap lets visitors reveal the worn version without relying on hover.
if (productVisual) {
  productVisual.addEventListener('click', () => {
    if (window.matchMedia('(hover: none)').matches) {
      productVisual.classList.toggle('is-active');
      productVisual.setAttribute(
        'aria-label',
        productVisual.classList.contains('is-active')
          ? 'Voir l’ensemble Atome présenté à plat'
          : 'Voir l’ensemble Atome porté'
      );
    }
  });

  productVisual.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      productVisual.classList.toggle('is-active');
    }
  });
}

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

document.querySelector('#year').textContent = new Date().getFullYear();
