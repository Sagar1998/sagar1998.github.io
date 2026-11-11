/* Sagar Kuvar — portfolio interactions. No dependencies. */
(function () {
    'use strict';

    var root = document.documentElement;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---- theme toggle ---- */
    var themeToggle = document.getElementById('themeToggle');
    var themeMeta = document.querySelector('meta[name="theme-color"]');

    function currentTheme() {
        var set = root.getAttribute('data-theme');
        if (set) return set;
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }

    function syncThemeMeta() {
        if (themeMeta) themeMeta.setAttribute('content', currentTheme() === 'light' ? '#f6f3ec' : '#0a0d12');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            var next = currentTheme() === 'light' ? 'dark' : 'light';
            root.setAttribute('data-theme', next);
            try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable */ }
            syncThemeMeta();
        });
    }
    syncThemeMeta();

    /* ---- mobile menu ---- */
    var menuToggle = document.getElementById('menuToggle');
    var navLinks = document.getElementById('navLinks');

    function setMenu(open) {
        navLinks.classList.toggle('is-open', open);
        menuToggle.setAttribute('aria-expanded', String(open));
        menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function () {
            setMenu(!navLinks.classList.contains('is-open'));
        });
        navLinks.addEventListener('click', function (e) {
            if (e.target.closest('a')) setMenu(false);
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') setMenu(false);
        });
    }

    /* ---- scroll progress + nav border ---- */
    var nav = document.getElementById('nav');
    var bar = document.getElementById('progressBar');
    var ticking = false;

    function onScroll() {
        ticking = false;
        var y = window.scrollY;
        var max = document.documentElement.scrollHeight - window.innerHeight;
        if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
        if (nav) nav.classList.toggle('is-stuck', y > 8);
    }

    window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();

    /* ---- reveal on scroll ---- */
    var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

    if (!('IntersectionObserver' in window) || reduceMotion) {
        reveals.forEach(function (el) { el.classList.add('is-in'); });
    } else {
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-in');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
        reveals.forEach(function (el) { revealObserver.observe(el); });
    }

    /* ---- active nav link ---- */
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav__links a'));
    var sections = links
        .map(function (a) { return document.querySelector(a.getAttribute('href')); })
        .filter(Boolean);

    if ('IntersectionObserver' in window && sections.length) {
        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                links.forEach(function (a) {
                    a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
                });
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        sections.forEach(function (s) { spy.observe(s); });
    }

    /* ---- count-up stats ---- */
    var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));

    function animateCount(el) {
        var target = parseInt(el.getAttribute('data-count'), 10);
        var start = null;
        var duration = 1100;
        function step(ts) {
            if (start === null) start = ts;
            var p = Math.min((ts - start) / duration, 1);
            el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        // Guarantee the real number even if animation frames are throttled.
        setTimeout(function () { el.textContent = target; }, duration + 300);
    }

    if (!reduceMotion && 'IntersectionObserver' in window) {
        var countObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    animateCount(entry.target);
                    countObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.6 });
        counters.forEach(function (el) { countObserver.observe(el); });
    }

    /* ---- footer year ---- */
    var year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
})();
