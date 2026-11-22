/* OuraNoir site behaviour (no jQuery / Bootstrap JS needed). */
(function () {
    "use strict";

    // --- Dark / light mode toggle (initial theme is set by js/theme.js) ---
    var root = document.documentElement;
    function syncThemeButtons() {
        var dark = root.getAttribute("data-theme") === "dark";
        Array.prototype.forEach.call(document.querySelectorAll("[data-theme-toggle]"), function (btn) {
            btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
            btn.setAttribute("aria-pressed", dark ? "true" : "false");
        });
    }
    document.addEventListener("click", function (e) {
        var btn = e.target.closest && e.target.closest("[data-theme-toggle]");
        if (!btn) return;
        var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", next);
        root.classList.toggle("dark", next === "dark");
        try { localStorage.setItem("ouranoir-theme", next); } catch (err) { /* ignore */ }
        syncThemeButtons();
    });
    syncThemeButtons();

    // --- Mobile navigation toggle ---
    var toggler = document.querySelector(".navbar-toggler");
    var menu = document.getElementById("navbarCollapse");
    if (toggler && menu) {
        toggler.addEventListener("click", function () {
            var open = menu.classList.toggle("show");
            toggler.setAttribute("aria-expanded", open ? "true" : "false");
        });
        // Close the menu after choosing an in-page link
        menu.addEventListener("click", function (e) {
            if (e.target.closest("a") && menu.classList.contains("show")) {
                menu.classList.remove("show");
                toggler.setAttribute("aria-expanded", "false");
            }
        });
    }

    // --- Reveal-on-scroll animations (skipped for users who prefer reduced motion) ---
    var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reveals.length && "IntersectionObserver" in window && !reduceMotion) {
        // Anything already on screen is shown immediately (no flicker)
        reveals.forEach(function (el) {
            if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-visible");
            var delay = el.getAttribute("data-reveal-delay");
            if (delay) el.style.transitionDelay = delay;
        });
        document.documentElement.classList.add("reveal-ready");
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: "0px 0px -10% 0px" });
        reveals.forEach(function (el) {
            if (!el.classList.contains("is-visible")) observer.observe(el);
        });
    }

    // --- Back to top button ---
    var toTop = document.querySelector(".back-to-top");
    if (toTop) {
        var onScroll = function () { toTop.classList.toggle("is-visible", window.scrollY > 300); };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        toTop.addEventListener("click", function (e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
            var skip = document.querySelector(".skip-link");
            if (skip) skip.focus({ preventScroll: true });
        });
    }
})();
