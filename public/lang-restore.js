/* Resolve the display language before first paint (kept external so the
   CSP stays `script-src 'self'` with no inline hashes).
   Priority: explicit saved choice → client locale → English.
   Only sets <html> lang/dir here; main.ts swaps the text on load. */
(function () {
  try {
    var saved = localStorage.getItem("novan-lang");
    var lang = saved === "en" || saved === "ar" ? saved : null;
    if (!lang) {
      var locales =
        navigator.languages && navigator.languages.length
          ? navigator.languages
          : [navigator.language || ""];
      var isArabic = locales.some(function (l) {
        return String(l).toLowerCase().indexOf("ar") === 0;
      });
      lang = isArabic ? "ar" : "en";
    }
    var el = document.documentElement;
    el.setAttribute("lang", lang);
    el.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  } catch (e) {}
})();
