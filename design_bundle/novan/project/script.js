/* ============================================================
   NOVAN WATER — interactions (v3)
   ============================================================ */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var supportsIO = "IntersectionObserver" in window;

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
  var revealAll = function () {
    reveals.forEach(function (el) { el.classList.add("in"); });
  };

  if (supportsIO && !prefersReduced) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach(function (el) { io.observe(el); });
    /* hard failsafe — never leave content invisible */
    setTimeout(revealAll, 4000);
  } else {
    revealAll();
  }

  /* ---------- hero parallax ---------- */
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
  if (parallaxEls.length && !prefersReduced) {
    parallaxEls.forEach(function (el) {
      el.querySelectorAll("img.cover, .ph").forEach(function (n) {
        n.style.transform = "scale(1.16)";
        n.style.transformOrigin = "center";
      });
    });
    var pTick = false;
    var applyParallax = function () {
      parallaxEls.forEach(function (el) {
        var speed = parseFloat(el.getAttribute("data-parallax")) || 0.1;
        el.style.transform = "translate3d(0," + (window.scrollY * speed).toFixed(1) + "px,0)";
      });
      pTick = false;
    };
    window.addEventListener("scroll", function () {
      if (!pTick) { requestAnimationFrame(applyParallax); pTick = true; }
    }, { passive: true });
    applyParallax();
  }

  /* ---------- scroll-driven FX (Aupale-style) ----------
     data-fx="tilt" : appears from nothing — rotates upright and grows
     data-fx="grow" : scales up gently as it enters
     State is computed from scroll position, so a fresh load mid-page
     shows the correct (visible) state immediately. */
  var fxEls = Array.prototype.slice.call(document.querySelectorAll("[data-fx]"));
  if (fxEls.length && !prefersReduced) {
    var clamp01 = function (v) { return Math.max(0, Math.min(1, v)); };
    var easeOut = function (p) { return 1 - Math.pow(1 - p, 3); };
    var fxState = fxEls.map(function () { return { cur: -1 }; });
    var fxFrame = function () {
      var vh = window.innerHeight;
      fxEls.forEach(function (el, i) {
        var rect = el.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) return;
        var raw = clamp01((vh * 0.92 - rect.top) / (vh * 0.55));
        var p = easeOut(raw);
        var st = fxState[i];
        /* lerp towards target for buttery motion */
        st.cur = st.cur < 0 ? p : st.cur + (p - st.cur) * 0.18;
        var v = st.cur;
        if (el.getAttribute("data-fx") === "tilt") {
          el.style.opacity = (0.05 + 0.95 * v).toFixed(3);
          el.style.transform =
            "scale(" + (0.82 + 0.18 * v).toFixed(4) + ") rotate(" + ((1 - v) * -5).toFixed(2) + "deg)";
        } else {
          el.style.transform = "scale(" + (0.9 + 0.1 * v).toFixed(4) + ")";
        }
      });
      requestAnimationFrame(fxFrame);
    };
    requestAnimationFrame(fxFrame);
  }

  /* ---------- animated counters ---------- */
  var animateCount = function (el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var dur = 1600;
    var start = performance.now();
    var tick = function (now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
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

  /* ---------- films carousel ---------- */
  var track = document.querySelector(".films-track");
  if (track) {
    var cardStep = function () {
      var card = track.querySelector(".film-card");
      return card ? card.getBoundingClientRect().width + 22 : 600;
    };
    var dirMul = function () { return document.documentElement.getAttribute("dir") === "rtl" ? -1 : 1; };
    var prev = document.querySelector(".films-prev");
    var next = document.querySelector(".films-next");
    if (prev) prev.addEventListener("click", function () { track.scrollBy({ left: -cardStep() * dirMul(), behavior: "smooth" }); });
    if (next) next.addEventListener("click", function () { track.scrollBy({ left: cardStep() * dirMul(), behavior: "smooth" }); });

    /* drag to scroll */
    var isDown = false, startX = 0, startScroll = 0, moved = false;
    track.addEventListener("pointerdown", function (e) {
      isDown = true; moved = false;
      startX = e.clientX; startScroll = track.scrollLeft;
      track.classList.add("dragging");
    });
    window.addEventListener("pointermove", function (e) {
      if (!isDown) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 6) moved = true;
      track.scrollLeft = startScroll - dx;
    });
    window.addEventListener("pointerup", function () {
      isDown = false;
      track.classList.remove("dragging");
    });
    /* suppress click-after-drag */
    track.addEventListener("click", function (e) {
      if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; }
    }, true);
  }

  /* ---------- film lightbox (YouTube) ---------- */
  var lightbox = document.getElementById("lightbox");
  var lbFrame = document.getElementById("lightbox-frame");
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
  Array.prototype.slice.call(document.querySelectorAll(".film-card")).forEach(function (card) {
    var play = function () { openLightbox(card.getAttribute("data-video")); };
    card.addEventListener("click", play);
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); play(); }
    });
  });
  if (lightbox) {
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox || e.target.closest(".lightbox-close")) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeLightbox();
    });
  }

  /* ---------- voices slider (auto, faded slide) ---------- */
  var voices = Array.prototype.slice.call(document.querySelectorAll(".voice"));
  var dotsWrap = document.querySelector(".voices-dots");
  if (voices.length && dotsWrap) {
    var vIndex = 0;
    var vTimer = null;
    voices.forEach(function (_, i) {
      var b = document.createElement("button");
      b.setAttribute("aria-label", "Quote " + (i + 1));
      if (i === 0) b.classList.add("active");
      b.addEventListener("click", function () { goVoice(i); restartTimer(); });
      dotsWrap.appendChild(b);
    });
    var dots = Array.prototype.slice.call(dotsWrap.children);
    var goVoice = function (i) {
      if (i === vIndex) return;
      voices[vIndex].classList.remove("active");
      voices[vIndex].classList.add("leaving");
      (function (old) {
        setTimeout(function () { voices[old].classList.remove("leaving"); }, 900);
      })(vIndex);
      vIndex = i;
      voices[vIndex].classList.add("active");
      dots.forEach(function (d, j) { d.classList.toggle("active", j === vIndex); });
    };
    var restartTimer = function () {
      if (vTimer) clearInterval(vTimer);
      if (prefersReduced) return;
      vTimer = setInterval(function () { goVoice((vIndex + 1) % voices.length); }, 6000);
    };
    restartTimer();
    var stage = document.querySelector(".voices-stage");
    if (stage) {
      stage.addEventListener("mouseenter", function () { if (vTimer) clearInterval(vTimer); });
      stage.addEventListener("mouseleave", restartTimer);
    }
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
  if (saved !== "en") setLang(saved);
})();
