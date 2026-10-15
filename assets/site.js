(() => {
    'use strict';
    const root = document.documentElement;
    const preferences = window.portfolioPreferences;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const compactMotion = window.matchMedia('(max-width: 850px), (pointer: coarse)');
    function listenMedia(media, listener) {
        if (media.addEventListener) media.addEventListener('change', listener);
        else if (media.addListener) media.addListener(listener);
    }
    root.classList.add('js-enabled');
    preferences.start();
    const isChinese = () => root.dataset.lang === 'zh';
    const localText = (en, zh) => isChinese() ? zh : en;
    const settings = document.getElementById('settings-dialog');
    const lightbox = document.getElementById('lightbox-dialog');
    const dialogs = [settings, lightbox];
    let lastTrigger = null;

    function openDialog(dialog, trigger) {
        lastTrigger = trigger;
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else {
            dialog.classList.add('dialog-fallback');
            dialog.setAttribute('role', 'dialog');
            dialog.setAttribute('aria-modal', 'true');
            dialog.setAttribute('open', '');
            dialog.open = true;
            document.body.classList.add('fallback-modal-open');
            dialog.querySelector('[data-close]').focus({ preventScroll: true });
        }
        document.body.classList.add('modal-open');
    }
    function closeDialog(dialog) {
        if (!dialog.classList.contains('dialog-fallback')) dialog.close();
        else {
            dialog.removeAttribute('open');
            dialog.open = false;
            dialog.dispatchEvent(new Event('close'));
        }
    }
    dialogs.forEach(dialog => {
        dialog.querySelector('[data-close]').addEventListener('click', () => closeDialog(dialog));
        dialog.addEventListener('click', event => {
            if (event.target !== dialog) return;
            const bounds = dialog.getBoundingClientRect();
            if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeDialog(dialog);
        });
        dialog.addEventListener('close', () => {
            if (!dialogs.some(item => item.open)) document.body.classList.remove('modal-open', 'fallback-modal-open');
            lastTrigger?.focus({ preventScroll: true });
        });
        dialog.addEventListener('keydown', event => {
            if (!dialog.classList.contains('dialog-fallback')) return;
            if (event.key === 'Escape') { event.preventDefault(); closeDialog(dialog); }
            if (event.key !== 'Tab') return;
            const focusable = [...dialog.querySelectorAll('button:not([disabled]),a[href],select,[tabindex="0"]')].filter(item => item.getClientRects().length);
            const first = focusable[0], last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        });
    });
    document.addEventListener('click', event => {
        if (!document.body.classList.contains('fallback-modal-open') || event.target.closest('dialog,[data-gallery],[data-open-settings]')) return;
        dialogs.filter(dialog => dialog.open && dialog.classList.contains('dialog-fallback')).forEach(closeDialog);
    });
    document.querySelectorAll('[data-open-settings]').forEach(button => button.addEventListener('click', () => openDialog(settings, button)));
    document.getElementById('language-btn').addEventListener('click', () => preferences.setLanguage(isChinese() ? 'en' : 'zh'));
    document.getElementById('theme-btn').addEventListener('click', () => preferences.setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));
    document.getElementById('language-setting').addEventListener('change', event => preferences.setLanguage(event.target.value));
    document.getElementById('theme-setting').addEventListener('change', event => preferences.setTheme(event.target.value));
    document.getElementById('reset-language').addEventListener('click', preferences.resetLanguage);
    document.getElementById('reset-theme').addEventListener('click', preferences.resetTheme);
    document.getElementById('reset-all').addEventListener('click', preferences.reset);

    const menuButton = document.getElementById('menu-btn');
    const menu = document.getElementById('section-nav');
    function setMenu(open) {
        menu.classList.toggle('open', open);
        menuButton.setAttribute('aria-expanded', String(open));
    }
    menuButton.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('click', event => { if (!event.target.closest('.site-nav')) setMenu(false); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') setMenu(false); });

    const imageLinks = [...document.querySelectorAll('[data-gallery]')];
    const viewerImage = document.getElementById('lightbox-image');
    const viewerTitle = document.getElementById('lightbox-title');
    const counter = document.getElementById('lightbox-counter');
    const originalLink = document.getElementById('lightbox-original');
    const previous = document.getElementById('lightbox-prev');
    const next = document.getElementById('lightbox-next');
    let currentGroup = [];
    let currentIndex = 0;
    function showImage(index) {
        currentIndex = Math.max(0, Math.min(index, currentGroup.length - 1));
        const link = currentGroup[currentIndex];
        const caption = link.dataset[isChinese() ? 'captionZh' : 'captionEn'];
        const displaySource = link.dataset.viewerSrc || link.href;
        if (viewerImage.getAttribute('src') !== displaySource) viewerImage.src = displaySource;
        viewerImage.alt = caption;
        viewerTitle.textContent = caption;
        counter.textContent = `${currentIndex + 1} / ${currentGroup.length}`;
        originalLink.href = link.href;
        previous.disabled = currentIndex === 0;
        next.disabled = currentIndex === currentGroup.length - 1;
    }
    imageLinks.forEach(link => link.addEventListener('click', event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        currentGroup = imageLinks.filter(item => item.dataset.gallery === link.dataset.gallery);
        showImage(currentGroup.indexOf(link));
        openDialog(lightbox, link);
    }));
    previous.addEventListener('click', () => showImage(currentIndex - 1));
    next.addEventListener('click', () => showImage(currentIndex + 1));
    lightbox.addEventListener('keydown', event => {
        if (event.key === 'ArrowLeft') { event.preventDefault(); showImage(currentIndex - 1); }
        if (event.key === 'ArrowRight') { event.preventDefault(); showImage(currentIndex + 1); }
    });
    const stage = document.getElementById('lightbox-stage');
    let touchStart = null;
    stage.addEventListener('touchstart', event => {
        touchStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
    }, { passive: true });
    stage.addEventListener('touchend', event => {
        if (!touchStart || event.touches.length) { touchStart = null; return; }
        const end = event.changedTouches[0];
        const dx = end.clientX - touchStart.x;
        const dy = end.clientY - touchStart.y;
        if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) showImage(currentIndex + (dx < 0 ? 1 : -1));
        touchStart = null;
    }, { passive: true });
    stage.addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });
    const main = document.querySelector('main');
    let previousLanguage = root.dataset.lang;
    let previousTheme = root.dataset.theme;
    let preferenceAnimation = null;
    window.addEventListener('portfolio:preferences', () => {
        if (lightbox.open) showImage(currentIndex);
        const changed = previousLanguage !== root.dataset.lang || previousTheme !== root.dataset.theme;
        previousLanguage = root.dataset.lang;
        previousTheme = root.dataset.theme;
        if (changed) refreshScrollMetrics();
        if (!changed || compactMotion.matches || reducedMotion.matches || !main?.animate) return;
        preferenceAnimation?.cancel();
        preferenceAnimation = main.animate([
            { opacity: .7, transform: 'translateY(5px)' },
            { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 280, easing: 'cubic-bezier(.22,1,.36,1)' });
    });

    const header = document.querySelector('.site-header');
    const progress = document.getElementById('scroll-progress');
    let scrollPending = false;
    let scrollRange = 0;
    let headerScrolled = null;
    function updateScroll() {
        const scrolled = window.scrollY > 12;
        if (scrolled !== headerScrolled) {
            header.classList.toggle('is-scrolled', scrolled);
            headerScrolled = scrolled;
        }
        if (!compactMotion.matches) progress.style.transform = `scaleX(${scrollRange > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollRange)) : 0})`;
        scrollPending = false;
    }
    function refreshScrollMetrics() {
        // Read layout on size/content changes, rather than on every scroll frame.
        scrollRange = compactMotion.matches ? 0 : Math.max(0, root.scrollHeight - window.innerHeight);
        updateScroll();
    }
    window.addEventListener('scroll', () => {
        if (compactMotion.matches) {
            if ((window.scrollY > 12) !== headerScrolled) updateScroll();
            return;
        }
        if (!scrollPending) { scrollPending = true; window.requestAnimationFrame(updateScroll); }
    }, { passive: true });
    window.addEventListener('resize', () => { if (window.innerWidth > 850) setMenu(false); refreshScrollMetrics(); });
    window.addEventListener('load', refreshScrollMetrics);
    document.querySelectorAll('.case-details').forEach(details => details.addEventListener('toggle', refreshScrollMetrics));
    if ('ResizeObserver' in window) new ResizeObserver(refreshScrollMetrics).observe(document.body);
    refreshScrollMetrics();

    const revealItems = [...document.querySelectorAll('.reveal')];
    if ('IntersectionObserver' in window) {
        const revealedOnce = new WeakSet();
        const revealObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealedOnce.add(entry.target);
                    if (compactMotion.matches) revealObserver.unobserve(entry.target);
                }
                else if (!compactMotion.matches) {
                    const bounds = entry.boundingClientRect;
                    // Re-arm only outside the viewport; scrolling must never hide readable content.
                    if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) entry.target.classList.remove('visible');
                }
            });
        }, { threshold: 0, rootMargin: '0px 0px 40px 0px' });
        function syncRevealMotion() {
            revealObserver.disconnect();
            revealItems.forEach(item => {
                item.classList.add('pending');
                if (reducedMotion.matches || (compactMotion.matches && revealedOnce.has(item))) item.classList.add('visible');
                else {
                    const bounds = item.getBoundingClientRect();
                    if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) item.classList.remove('visible');
                    revealObserver.observe(item);
                }
            });
        }
        syncRevealMotion();
        listenMedia(reducedMotion, event => {
            if (event.matches) preferenceAnimation?.cancel();
            syncRevealMotion();
        });
        listenMedia(compactMotion, () => { refreshScrollMetrics(); syncRevealMotion(); });
    }
    if ('IntersectionObserver' in window) {
        const links = [...menu.querySelectorAll('a')];
        const sectionObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                links.forEach(link => {
                    if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
                    else link.removeAttribute('aria-current');
                });
            });
        }, { rootMargin: '-15% 0px -65% 0px', threshold: 0 });
        document.querySelectorAll('section[data-nav-section]').forEach(section => sectionObserver.observe(section));
    }

    const copyButton = document.getElementById('copy-email');
    const copyFeedback = document.getElementById('copy-feedback');
    copyButton.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText('2746783219@qq.com');
            copyFeedback.textContent = localText('Email address copied.', '邮箱已复制。');
        } catch {
            copyFeedback.textContent = localText('Select the email address to copy it.', '请选中邮箱地址进行复制。');
        }
        window.setTimeout(() => { copyFeedback.textContent = ''; }, 4000);
    });
})();
