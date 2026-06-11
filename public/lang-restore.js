/* Restore the saved language before first paint (kept external so the
   CSP can stay `script-src 'self'` with no inline hashes). */
try {
  if (localStorage.getItem("novan-lang") === "ar") {
    document.documentElement.setAttribute("lang", "ar");
    document.documentElement.setAttribute("dir", "rtl");
  }
} catch (e) {}
