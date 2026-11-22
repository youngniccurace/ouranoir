/*
 * Cookie consent for OuraNoir.
 * - Shows a banner to first-time visitors (and again after 12 months or a policy version change).
 * - Records the choice in localStorage ("ouranoir-consent").
 * - Non-essential scripts (analytics) listen for the "ouranoir:consent" event and only load when allowed.
 * - Any element with [data-cookie-settings] reopens the banner.
 */
(function () {
    "use strict";

    var KEY = "ouranoir-consent";
    var VERSION = 1;                         // bump when the cookie policy changes to ask again
    var MAX_AGE = 365 * 24 * 60 * 60 * 1000; // re-ask after 12 months
    var script = document.currentScript;
    var siteRoot = script ? new URL("..", script.src).href : "/";
    var listeners = [];
    var banner = null;

    function read() {
        try {
            var saved = JSON.parse(localStorage.getItem(KEY) || "null");
            if (saved && saved.v === VERSION && Date.now() - saved.ts < MAX_AGE) return saved;
        } catch (e) { /* storage unavailable or corrupt */ }
        return null;
    }

    function notify(state) {
        var detail = { analytics: !!(state && state.analytics) };
        listeners.forEach(function (fn) { fn(detail); });
        document.dispatchEvent(new CustomEvent("ouranoir:consent", { detail: detail }));
    }

    function save(analytics) {
        var state = { v: VERSION, ts: Date.now(), analytics: !!analytics };
        try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
        hide();
        notify(state);
    }

    function hide() {
        if (banner) {
            banner.hidden = true;
        }
    }

    function show() {
        if (!banner) build();
        var state = read();
        banner.querySelector("[data-consent-current]").textContent = state
            ? "Current choice: analytics " + (state.analytics ? "allowed." : "not allowed.")
            : "";
        banner.hidden = false;
        banner.querySelector("[data-consent-accept]").focus({ preventScroll: true });
    }

    function build() {
        banner = document.createElement("section");
        banner.className = "consent-banner";
        banner.setAttribute("role", "region");
        banner.setAttribute("aria-label", "Cookie consent");
        banner.hidden = true;
        banner.innerHTML =
            '<div class="consent-inner">' +
                '<div class="consent-text">' +
                    '<h2 class="consent-title">Your privacy</h2>' +
                    '<p>We use essential storage to make this site work. With your permission we\'d also like to use ' +
                    'analytics cookies (Google Analytics) to understand how visitors use the site. ' +
                    '<a href="' + siteRoot + 'privacy.html#cookies">Read our Privacy Policy</a>.</p>' +
                    '<p class="consent-current" data-consent-current></p>' +
                '</div>' +
                '<div class="consent-actions">' +
                    '<button type="button" class="consent-btn consent-btn-outline" data-consent-reject>Reject analytics</button>' +
                    '<button type="button" class="consent-btn consent-btn-solid" data-consent-accept>Accept analytics</button>' +
                '</div>' +
            '</div>';
        banner.querySelector("[data-consent-accept]").addEventListener("click", function () { save(true); });
        banner.querySelector("[data-consent-reject]").addEventListener("click", function () { save(false); });
        document.body.appendChild(banner);
    }

    window.OuraNoirConsent = {
        /** true / false once the visitor has chosen, null if not yet */
        analyticsAllowed: function () { var s = read(); return s ? s.analytics : null; },
        onChange: function (fn) { listeners.push(fn); },
        open: show
    };

    function init() {
        document.addEventListener("click", function (e) {
            var trigger = e.target.closest && e.target.closest("[data-cookie-settings]");
            if (trigger) { e.preventDefault(); show(); }
        });
        var state = read();
        if (state) notify(state); else show();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
