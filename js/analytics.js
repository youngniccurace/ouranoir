/*
 * Google Analytics 4, loaded ONLY after the visitor accepts analytics cookies.
 * To switch provider, replace load() below; consent handling stays the same.
 * Pages can record events with: window.ouranoirTrack("event_name", { ... })
 */
(function () {
    "use strict";

    var config = window.OURANOIR_CONFIG || {};
    var id = config.gaMeasurementId || "";
    var configured = /^G-[A-Z0-9]{4,}$/.test(id) && !/^G-X+$/.test(id); // ignore the placeholder
    var loaded = false;

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }

    function load() {
        if (loaded || !configured) return;
        loaded = true;
        gtag("consent", "default", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
        gtag("consent", "update", { analytics_storage: "granted" });
        gtag("js", new Date());
        gtag("config", id);
        var s = document.createElement("script");
        s.async = true;
        s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
        document.head.appendChild(s);
    }

    function revoke() {
        if (loaded) gtag("consent", "update", { analytics_storage: "denied" });
        // Remove any Google Analytics cookies already set
        document.cookie.split(";").forEach(function (c) {
            var name = c.split("=")[0].trim();
            if (/^_ga/.test(name)) {
                var host = location.hostname.replace(/^www\./, "");
                ["", "; domain=" + host, "; domain=." + host].forEach(function (d) {
                    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/" + d;
                });
            }
        });
    }

    window.ouranoirTrack = function (name, params) {
        if (loaded) gtag("event", name, params || {});
    };

    document.addEventListener("ouranoir:consent", function (e) {
        if (e.detail.analytics) load(); else revoke();
    });
})();
