/* ============================================================
   NOVAN WATER — interactions (v2)
   ============================================================ */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var supportsIO = "IntersectionObserver" in window;

  /* enable JS-driven reveal styling only if we can actually drive it */
  if (supportsIO && !prefersReduced) {
    document.documentElement.classList.add("js");
  }

  /* ---------- header scroll state ---------- */
  var header = document.querySelector(".header");
  var onScroll = function () {
    if (header) header.classList.toggle("scrolled", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- reveal on scroll (with failsafe) ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  var medias = Array.prototype.slice.call(document.querySelectorAll(".media.zoom"));
  var revealAll = function () {
    reveals.forEach(function (el) { el.classList.add("in"); });
    medias.forEach(function (el) { el.classList.add("in"); });
  };

  if (supportsIO && !prefersReduced) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach(function (el) { io.observe(el); });

    var zio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("in"); zio.unobserve(e.target); }
        });
      },
      { threshold: 0.2 }
    );
    medias.forEach(function (el) { zio.observe(el); });

    /* failsafe: if anything is still hidden after load + grace, just show it */
    window.addEventListener("load", function () {
      setTimeout(function () {
        reveals.forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.top < window.innerHeight && !el.classList.contains("in")) el.classList.add("in");
        });
      }, 400);
    });
    /* hard failsafe — never leave content invisible */
    setTimeout(revealAll, 4000);
  } else {
    revealAll();
  }

  /* ---------- light parallax (hero background only) ---------- */
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
  if (parallaxEls.length && !prefersReduced) {
    /* scale the hero image up a touch so the parallax shift never reveals an edge */
    parallaxEls.forEach(function (el) {
      var img = el.querySelector("img.cover, .ph");
      el.querySelectorAll("img.cover, .ph").forEach(function (n) { n.style.transform = "scale(1.18)"; n.style.transformOrigin = "center"; });
    });
    var ticking = false;
    var applyParallax = function () {
      parallaxEls.forEach(function (el) {
        var speed = parseFloat(el.getAttribute("data-parallax")) || 0.1;
        var offset = window.scrollY * speed;
        el.style.transform = "translate3d(0," + offset.toFixed(1) + "px,0)";
      });
      ticking = false;
    };
    var onMove = function () {
      if (!ticking) { window.requestAnimationFrame(applyParallax); ticking = true; }
    };
    window.addEventListener("scroll", onMove, { passive: true });
    applyParallax();
  }

  /* ---------- animated counters ---------- */
  var animateCount = function (el) {
    var raw = el.getAttribute("data-count");
    var target = parseFloat(raw);
    var decimals = (raw.split(".")[1] || "").length;
    var dur = 1600;
    var start = performance.now();
    var tick = function (now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.textContent = val.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  var counters = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));
  if (supportsIO && !prefersReduced) {
    var countIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { animateCount(e.target); countIO.unobserve(e.target); }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) { countIO.observe(el); });
    setTimeout(function () {
      counters.forEach(function (el) { if (el.textContent === "0") animateCount(el); });
    }, 4200);
  } else {
    counters.forEach(function (el) { el.textContent = el.getAttribute("data-count"); });
  }

  /* ---------- mobile menu ---------- */
  var menuBtn = document.querySelector(".menu-btn");
  var mobileMenu = document.querySelector(".mobile-menu");
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", function () { mobileMenu.classList.toggle("open"); });
    mobileMenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { mobileMenu.classList.remove("open"); });
    });
  }

  /* ---------- film lightbox (YouTube) ---------- */
  var lightbox = document.getElementById("lightbox");
  var lbFrame = document.getElementById("lightbox-frame");
  var stage = document.querySelector(".film-stage");
  var openLightbox = function (id) {
    if (!lightbox || !lbFrame) return;
    lbFrame.innerHTML =
      '<iframe src="https://www.youtube-nocookie.com/embed/' + id +
      '?autoplay=1&rel=0&modestbranding=1" title="Novan film" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>';
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };
  var closeLightbox = function () {
    if (!lightbox || !lbFrame) return;
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    setTimeout(function () { lbFrame.innerHTML = ""; }, 400);
  };
  if (stage) {
    var play = function () { openLightbox(stage.getAttribute("data-video") || "1La4QzGeaaQ"); };
    stage.addEventListener("click", play);
    stage.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); play(); }
    });
  }
  if (lightbox) {
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox || e.target.closest(".lightbox-close")) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeLightbox();
    });
  }

  /* ---------- language toggle (EN / AR) ---------- */
  var htmlEl = document.documentElement;
  var setLang = function (lang) {
    var isAR = lang === "ar";
    htmlEl.setAttribute("lang", isAR ? "ar" : "en");
    htmlEl.setAttribute("dir", isAR ? "rtl" : "ltr");
    document.querySelectorAll("[data-en]").forEach(function (el) {
      var txt = isAR ? el.getAttribute("data-ar") : el.getAttribute("data-en");
      if (txt !== null) el.textContent = txt;
    });
    document.querySelectorAll(".lang-toggle button").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-lang") === lang);
    });
    try { localStorage.setItem("novan-lang", lang); } catch (e) {}
  };
  document.querySelectorAll(".lang-toggle button").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.getAttribute("data-lang")); });
  });
  var saved = "en";
  try { saved = localStorage.getItem("novan-lang") || "en"; } catch (e) {}
  setLang(saved);
})();
