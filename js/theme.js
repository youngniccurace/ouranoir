/*
 * Theme + palette, applied before first paint (kept tiny on purpose; loaded in <head>).
 *  - Dark mode: saved choice ("ouranoir-theme") or the device setting.
 *  - Colour prototypes: preview with ?palette=blue | pink | spectrum | gold (remembered for the
 *    browser tab only). The live brand stays gold unless DEFAULT_PALETTE is changed below.
 */
(function () {
    var DEFAULT_PALETTE = "gold";
    var root = document.documentElement;
    var theme = null;
    try { theme = localStorage.getItem("ouranoir-theme"); } catch (e) { /* storage blocked */ }
    if (theme !== "dark" && theme !== "light") {
        theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    root.setAttribute("data-theme", theme);
    if (theme === "dark") root.classList.add("dark");

    var palette = DEFAULT_PALETTE;
    try {
        var fromUrl = new URLSearchParams(location.search).get("palette");
        if (fromUrl) sessionStorage.setItem("ouranoir-palette", fromUrl);
        palette = sessionStorage.getItem("ouranoir-palette") || DEFAULT_PALETTE;
    } catch (e) { /* ignore */ }
    if (!/^(gold|blue|pink|spectrum)$/.test(palette)) palette = DEFAULT_PALETTE;
    root.setAttribute("data-palette", palette);
})();
