/* Sagar Kuvar — portfolio interactions. No dependencies. */
(function () {
    'use strict';

    var root = document.documentElement;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var canHover = window.matchMedia('(hover: hover)').matches;

    /* ---- loading screen ---- */
    var LOADER_MS = reduceMotion ? 600 : 3200;
    var loaderBar = document.getElementById('loaderBar');
    var loaderPct = document.getElementById('loaderPct');
    var loaderText = document.getElementById('loaderText');
    var loaderSteps = [
        [0, 'Initialising secure session'],
        [28, 'Running integrity checks'],
        [60, 'Verifying certificates'],
        [90, 'Access granted']
    ];
    var loadedCallbacks = [];
    var isLoaded = false;

    function whenLoaded(fn) {
        if (isLoaded) fn(); else loadedCallbacks.push(fn);
    }

    function finishLoading() {
        if (isLoaded) return;
        isLoaded = true;
        setLoaderProgress(100);
        root.classList.remove('is-loading');
        root.classList.add('is-loaded');
        loadedCallbacks.forEach(function (fn) { fn(); });
    }

    function setLoaderProgress(pct) {
        if (loaderBar) loaderBar.style.transform = 'scaleX(' + pct / 100 + ')';
        if (loaderPct) loaderPct.textContent = Math.round(pct);
        if (loaderText) {
            var label = loaderSteps[0][1];
            loaderSteps.forEach(function (s) { if (pct >= s[0]) label = s[1]; });
            if (loaderText.textContent !== label) loaderText.textContent = label;
        }
    }

    (function runLoader() {
        var startedAt = Date.now();
        // An interval (not animation frames) so it also completes in a background tab.
        var timer = setInterval(function () {
            var p = Math.min((Date.now() - startedAt) / LOADER_MS, 1);
            // ease-out so it starts fast and settles
            setLoaderProgress((1 - Math.pow(1 - p, 2.2)) * 100);
            if (p >= 1) {
                clearInterval(timer);
                setTimeout(finishLoading, 220);
            }
        }, 40);
    })();

    /* ---- theme toggle ---- */
    var themeToggle = document.getElementById('themeToggle');
    var themeMeta = document.querySelector('meta[name="theme-color"]');
    var themeListeners = [];

    function currentTheme() {
        var set = root.getAttribute('data-theme');
        if (set) return set;
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }

    function syncTheme() {
        if (themeMeta) themeMeta.setAttribute('content', currentTheme() === 'light' ? '#f6f3ec' : '#0a0d12');
        themeListeners.forEach(function (fn) { fn(); });
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            var next = currentTheme() === 'light' ? 'dark' : 'light';
            root.setAttribute('data-theme', next);
            try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable */ }
            syncTheme();
        });
    }
    syncTheme();

    /* ---- mobile menu ---- */
    var menuToggle = document.getElementById('menuToggle');
    var navLinks = document.getElementById('navLinks');

    function setMenu(open) {
        navLinks.classList.toggle('is-open', open);
        root.classList.toggle('menu-open', open);
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
        window.addEventListener('resize', function () {
            if (window.innerWidth > 860) setMenu(false);
        });
    }

    /* ---- scroll progress, nav border, back-to-top ---- */
    var nav = document.getElementById('nav');
    var bar = document.getElementById('progressBar');
    var toTop = document.getElementById('toTop');
    var ticking = false;

    function onScroll() {
        ticking = false;
        var y = window.scrollY;
        var max = document.documentElement.scrollHeight - window.innerHeight;
        if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
        if (nav) nav.classList.toggle('is-stuck', y > 8);
        if (toTop) toTop.classList.toggle('is-on', y > window.innerHeight * 0.9);
    }

    window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();

    /* ---- reveal on scroll, staggered within each group ---- */
    var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

    reveals.forEach(function (el) {
        var siblings = Array.prototype.filter.call(el.parentNode.children, function (c) {
            return c.classList.contains('reveal');
        });
        var index = siblings.indexOf(el);
        if (index > 0) el.style.setProperty('--d', Math.min(index, 6) * 70 + 'ms');
    });

    // Once revealed, hand the element back to its own (faster) hover transitions.
    function settle(el) {
        setTimeout(function () { el.classList.add('is-settled'); }, 1300);
    }

    if (!('IntersectionObserver' in window) || reduceMotion) {
        reveals.forEach(function (el) { el.classList.add('is-in', 'is-settled'); });
    } else {
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-in');
                    revealObserver.unobserve(entry.target);
                    settle(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
        whenLoaded(function () {
            reveals.forEach(function (el) { revealObserver.observe(el); });
        });
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
        var duration = 1300;
        function step(ts) {
            if (start === null) start = ts;
            var p = Math.min((ts - start) / duration, 1);
            el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(step);
        }
        el.textContent = '0';
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
        whenLoaded(function () {
            // wait for the hero entrance so the numbers are visible while they count
            setTimeout(function () {
                counters.forEach(function (el) { countObserver.observe(el); });
            }, 700);
        });
    }

    /* ---- typed role line ---- */
    var typed = document.getElementById('typed');
    var phrases = [
        'VAPT & penetration testing',
        'Web, API & mobile app security',
        'Security automation in Python',
        'SEBI CSCRF & NCIIPC compliance',
        'Vulnerability management at scale'
    ];

    if (typed && !reduceMotion) {
        whenLoaded(function () {
            var phrase = 0;
            var chars = phrases[0].length;
            var deleting = true;

            function tick() {
                var text = phrases[phrase];
                var delay;
                if (deleting) {
                    chars--;
                    delay = 28;
                    if (chars === 0) {
                        deleting = false;
                        phrase = (phrase + 1) % phrases.length;
                        delay = 350;
                    }
                } else {
                    chars++;
                    delay = 55;
                    if (chars === phrases[phrase].length) {
                        deleting = true;
                        delay = 2200;
                    }
                }
                typed.textContent = (deleting ? text : phrases[phrase]).slice(0, chars);
                setTimeout(tick, delay);
            }
            setTimeout(tick, 2600);
        });
    }

    /* ---- pointer-following glow on cards ---- */
    if (canHover) {
        Array.prototype.forEach.call(
            document.querySelectorAll('.skillcard, .project, .extra, .edu__item, .stats'),
            function (card) {
                card.addEventListener('pointermove', function (e) {
                    var r = card.getBoundingClientRect();
                    card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
                    card.style.setProperty('--my', (e.clientY - r.top) + 'px');
                });
            }
        );
    }

    /* ---- hero network background ---- */
    var canvas = document.getElementById('net');

    if (canvas && canvas.getContext && !reduceMotion) {
        (function () {
            var ctx = canvas.getContext('2d');
            var hero = canvas.parentNode;
            var dpr = Math.min(window.devicePixelRatio || 1, 2);
            var w = 0, h = 0, nodes = [], running = false, visible = true, frame = null;
            var pointer = { x: -9999, y: -9999 };
            var colors = { dot: '', line: '' };
            var LINK = 130;

            function readColors() {
                var cs = getComputedStyle(root);
                colors.dot = cs.getPropertyValue('--accent').trim() || '#ffb000';
                colors.line = cs.getPropertyValue('--muted').trim() || '#98a1b0';
            }

            function resize() {
                var rect = hero.getBoundingClientRect();
                w = rect.width; h = rect.height;
                canvas.width = Math.round(w * dpr);
                canvas.height = Math.round(h * dpr);
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                var count = Math.max(18, Math.min(70, Math.round(w * h / 24000)));
                nodes = [];
                for (var i = 0; i < count; i++) {
                    nodes.push({
                        x: Math.random() * w,
                        y: Math.random() * h,
                        vx: (Math.random() - 0.5) * 0.28,
                        vy: (Math.random() - 0.5) * 0.28,
                        r: Math.random() * 1.4 + 0.8
                    });
                }
            }

            function draw() {
                frame = null;
                if (!running) return;
                ctx.clearRect(0, 0, w, h);

                for (var i = 0; i < nodes.length; i++) {
                    var n = nodes[i];
                    n.x += n.vx; n.y += n.vy;
                    if (n.x < 0 || n.x > w) n.vx *= -1;
                    if (n.y < 0 || n.y > h) n.vy *= -1;

                    for (var j = i + 1; j < nodes.length; j++) {
                        var m = nodes[j];
                        var dx = n.x - m.x, dy = n.y - m.y;
                        var dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < LINK) {
                            ctx.globalAlpha = (1 - dist / LINK) * 0.22;
                            ctx.strokeStyle = colors.line;
                            ctx.lineWidth = 1;
                            ctx.beginPath();
                            ctx.moveTo(n.x, n.y);
                            ctx.lineTo(m.x, m.y);
                            ctx.stroke();
                        }
                    }

                    var px = n.x - pointer.x, py = n.y - pointer.y;
                    var pd = Math.sqrt(px * px + py * py);
                    if (pd < 170) {
                        ctx.globalAlpha = (1 - pd / 170) * 0.55;
                        ctx.strokeStyle = colors.dot;
                        ctx.beginPath();
                        ctx.moveTo(n.x, n.y);
                        ctx.lineTo(pointer.x, pointer.y);
                        ctx.stroke();
                    }

                    ctx.globalAlpha = 0.55;
                    ctx.fillStyle = colors.dot;
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
                frame = requestAnimationFrame(draw);
            }

            function update() {
                var shouldRun = visible && !document.hidden;
                if (shouldRun && !running) {
                    running = true;
                    if (!frame) frame = requestAnimationFrame(draw);
                } else if (!shouldRun) {
                    running = false;
                }
            }

            readColors();
            resize();
            themeListeners.push(readColors);

            var resizeTimer;
            var lastWidth = window.innerWidth;
            window.addEventListener('resize', function () {
                // ignore height-only changes (mobile address bar showing and hiding)
                if (window.innerWidth === lastWidth) return;
                lastWidth = window.innerWidth;
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(resize, 150);
            });

            if (canHover) {
                hero.addEventListener('pointermove', function (e) {
                    var rect = hero.getBoundingClientRect();
                    pointer.x = e.clientX - rect.left;
                    pointer.y = e.clientY - rect.top;
                });
                hero.addEventListener('pointerleave', function () {
                    pointer.x = pointer.y = -9999;
                });
            }

            if ('IntersectionObserver' in window) {
                new IntersectionObserver(function (entries) {
                    visible = entries[0].isIntersecting;
                    update();
                }).observe(hero);
            }
            document.addEventListener('visibilitychange', update);
            whenLoaded(function () {
                // the hero's final height is only known once fonts have settled
                resize();
                update();
            });
        })();
    }

    /* ---- footer year ---- */
    var year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
})();
