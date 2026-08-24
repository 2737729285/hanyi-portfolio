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

  const projectFolds = [...document.querySelectorAll('[data-project-fold]')];
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');

  const setProjectFold = (project, expanded, pinned = false) => {
    const toggle = project.querySelector('.project-fold-toggle');
    const label = toggle?.querySelector('span');

    if (expanded) {
      projectFolds.forEach((otherProject) => {
        if (otherProject === project) return;
        const otherToggle = otherProject.querySelector('.project-fold-toggle');
        const otherLabel = otherToggle?.querySelector('span');
        otherProject.classList.remove('is-expanded', 'is-pinned');
        otherProject.setAttribute('aria-expanded', 'false');
        if (otherToggle) otherToggle.setAttribute('aria-expanded', 'false');
        if (otherLabel) otherLabel.textContent = 'OPEN CASE / 展开案例';
      });
    }

    project.classList.toggle('is-expanded', expanded);
    project.classList.toggle('is-pinned', expanded && pinned);
    project.setAttribute('aria-expanded', String(expanded));
    if (toggle) toggle.setAttribute('aria-expanded', String(expanded));
    if (label) label.textContent = expanded ? 'CLOSE CASE / 收起案例' : 'OPEN CASE / 展开案例';
  };

  projectFolds.forEach((project) => {
    const toggle = project.querySelector('.project-fold-toggle');
    if (!toggle) return;

    project.addEventListener('mouseenter', () => {
      if (canHover.matches) setProjectFold(project, true, false);
    });

    project.addEventListener('mouseleave', () => {
      if (canHover.matches && !project.classList.contains('is-pinned')) setProjectFold(project, false, false);
    });

    project.addEventListener('focusin', () => setProjectFold(project, true, false));
    project.addEventListener('focusout', (event) => {
      if (!project.contains(event.relatedTarget) && !project.classList.contains('is-pinned')) {
        setProjectFold(project, false, false);
      }
    });

    toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      const willExpand = !project.classList.contains('is-expanded') || !project.classList.contains('is-pinned');
      setProjectFold(project, willExpand, willExpand);
    });
  });

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

  const viewTransition = document.querySelector('.view-transition');
  const viewTransitionLabel = viewTransition?.querySelector('span');
  const routeTriggers = [...document.querySelectorAll('[data-view-target]')];
  let routeIsChanging = false;

  const routeForHash = (hash) => {
    if (hash === '#about' || hash === '#profile') return { view: 'profile', scrollTarget: 'about' };
    if (['#projects', '#audio', '#creator-account', '#contact'].includes(hash)) {
      return { view: 'projects', scrollTarget: hash.slice(1) };
    }
    return { view: 'home', scrollTarget: 'home' };
  };

  const applyView = (view, scrollTarget, scrollBehavior = 'auto') => {
    body.classList.remove('view-home', 'view-projects', 'view-profile');
    body.classList.add(`view-${view}`);

    const destination = document.getElementById(scrollTarget || (view === 'profile' ? 'about' : view));
    if (destination) destination.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
    else window.scrollTo({ top: 0, behavior: scrollBehavior });
  };

  const navigateView = async (view, scrollTarget, updateHistory = true) => {
    if (routeIsChanging) return;
    const currentView = body.classList.contains(`view-${view}`);

    if (currentView) {
      applyView(view, scrollTarget, reducedMotion ? 'auto' : 'smooth');
      if (updateHistory) {
        const nextHash = scrollTarget === 'contact' ? '#contact' : scrollTarget === 'creator-account' ? '#creator-account' : view === 'profile' ? '#about' : view === 'projects' ? '#projects' : '#home';
        window.history.pushState({ view }, '', nextHash);
      }
      return;
    }

    routeIsChanging = true;
    body.classList.add('is-transitioning');
    if (viewTransitionLabel) {
      viewTransitionLabel.textContent = view === 'profile' ? 'PERSONAL PROFILE / 个人履历' : view === 'projects' ? 'SELECTED PROJECTS / 项目作品' : 'HAN YI / PORTFOLIO';
    }

    if (!reducedMotion && viewTransition) {
      viewTransition.classList.add('is-covering');
      await wait(620);
    }

    applyView(view, scrollTarget, 'auto');

    if (updateHistory) {
      const nextHash = scrollTarget === 'contact' ? '#contact' : scrollTarget === 'creator-account' ? '#creator-account' : view === 'profile' ? '#about' : view === 'projects' ? '#projects' : '#home';
      window.history.pushState({ view }, '', nextHash);
    }

    if (!reducedMotion && viewTransition) {
      await wait(90);
      viewTransition.classList.remove('is-covering');
      viewTransition.classList.add('is-revealing');
      await wait(620);
      viewTransition.classList.add('is-resetting');
      viewTransition.classList.remove('is-revealing');
      window.requestAnimationFrame(() => viewTransition.classList.remove('is-resetting'));
    }

    body.classList.remove('is-transitioning');
    routeIsChanging = false;
  };

  routeTriggers.forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      navigateView(trigger.dataset.viewTarget, trigger.dataset.scrollTarget);
    });
  });

  const initialRoute = routeForHash(window.location.hash);
  applyView(initialRoute.view, initialRoute.scrollTarget, 'auto');

  window.addEventListener('popstate', () => {
    const route = routeForHash(window.location.hash);
    navigateView(route.view, route.scrollTarget, false);
  });

  const modal = document.querySelector('.video-modal');
  const modalVideo = modal.querySelector('video');
  const modalTitle = modal.querySelector('h2');
  const modalLoading = modal.querySelector('.modal-loading');
  const closeModal = () => {
    modalVideo.pause();
    modalVideo.removeAttribute('src');
    modalVideo.load();
    modal.classList.remove('is-loading', 'has-error');
    modal.close();
    body.classList.remove('modal-open');
  };

  modalVideo.addEventListener('canplay', () => {
    modal.classList.remove('is-loading');
  });

  modalVideo.addEventListener('error', () => {
    modal.classList.remove('is-loading');
    modal.classList.add('has-error');
    if (modalLoading) modalLoading.textContent = '影片加载失败，请检查网络后重试。';
  });

  document.querySelectorAll('[data-video]').forEach((button) => {
    button.addEventListener('click', () => {
      modalTitle.textContent = button.dataset.title || '作品预览';
      modal.classList.remove('has-error');
      modal.classList.add('is-loading');
      if (modalLoading) modalLoading.textContent = '正在加载高清影片…';
      modalVideo.src = button.dataset.video;
      modal.showModal();
      body.classList.add('modal-open');
      modalVideo.load();
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
      if (link.matches('[data-view-target]')) return;
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
