(() => {
  const body = document.body;
  const header = document.querySelector('[data-header]');
  const progress = document.querySelector('.scroll-progress span');
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.site-nav');
  const heroVideo = document.querySelector('.hero-media video');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ticking = false;

  const loadHeroVideo = () => {
    if (!heroVideo || heroVideo.dataset.loaded === 'true') return;

    const source = heroVideo.querySelector('source[data-src]');
    if (!source) return;

    source.src = source.dataset.src;
    heroVideo.dataset.loaded = 'true';
    heroVideo.load();
    heroVideo.play().catch(() => {});
  };

  if (heroVideo && 'IntersectionObserver' in window) {
    const heroVideoObserver = new IntersectionObserver((entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      loadHeroVideo();
      observer.disconnect();
    }, { threshold: 0.01 });

    heroVideoObserver.observe(heroVideo);
  } else {
    loadHeroVideo();
  }

  const updateScrollUI = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;

    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateScrollUI);
      ticking = true;
    }
  }, { passive: true });
  updateScrollUI();

  const typeTargets = [...document.querySelectorAll('[data-type-text]')];
  const typeRegion = document.querySelector('.hero-typewriter');
  const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

  const runTypewriter = async () => {
    if (!typeRegion || typeTargets.length === 0) return;

    typeRegion.classList.add('is-animated');

    if (reducedMotion) {
      typeTargets.forEach((element) => element.parentElement.classList.remove('is-active'));
      typeTargets[1].parentElement.classList.add('is-active');
      return;
    }

    typeTargets.forEach((element) => { element.textContent = ''; });
    await wait(320);

    while (true) {
      for (const [index, element] of typeTargets.entries()) {
        const line = element.parentElement;
        const characters = Array.from(element.dataset.typeText || '');

        line.classList.add('is-active');
        element.classList.add('is-typing');

        for (const character of characters) {
          element.textContent += character;
          await wait(index === 1 ? 98 : 82);
        }

        element.classList.remove('is-typing');
        await wait(1200);
        line.classList.remove('is-active');
        await wait(420);
        element.textContent = '';
      }

      await wait(260);
    }
  };

  runTypewriter();

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });

  document.querySelectorAll('h1, h2, h3, h4').forEach((heading) => {
    if (!heading.classList.contains('reveal') && !heading.closest('.reveal')) {
      heading.classList.add('title-reveal');
    }
  });

  document.querySelectorAll('.reveal, .title-reveal').forEach((element) => revealObserver.observe(element));

  const closeMenu = () => {
    menuButton.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
    body.classList.remove('menu-open');
  };

  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    navigation.classList.toggle('is-open', !open);
    body.classList.toggle('menu-open', !open);
  });
  navigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

  const modal = document.querySelector('.video-modal');
  const modalVideo = modal.querySelector('video');
  const modalTitle = modal.querySelector('h2');
  const closeModal = () => {
    modalVideo.pause();
    modalVideo.removeAttribute('src');
    modalVideo.load();
    modal.close();
    body.classList.remove('modal-open');
  };

  document.querySelectorAll('.play-button').forEach((button) => {
    button.addEventListener('click', () => {
      modalTitle.textContent = button.dataset.title || '作品预览';
      modalVideo.src = button.dataset.video;
      modal.showModal();
      body.classList.add('modal-open');
      modalVideo.play().catch(() => {});
    });
  });
  modal.querySelector('.modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });
  modal.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeModal();
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    });
  });

  document.addEventListener('visibilitychange', () => {
    if (!heroVideo || heroVideo.dataset.loaded !== 'true') return;
    if (document.hidden) heroVideo.pause();
    else heroVideo.play().catch(() => {});
  });
})();
