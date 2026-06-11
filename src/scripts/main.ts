/* ============================================================
   NOVAN WATER — interactions
   Ported from the design prototype (v3) and finished per the
   final design-chat feedback: focused-card films carousel,
   RTL-aware arrows, language toggle, no bottle animation.
   ============================================================ */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const supportsIO = "IntersectionObserver" in window;

if (supportsIO && !prefersReduced) {
  document.documentElement.classList.add("js");
}

/* ---------- header scroll state ---------- */
const header = document.querySelector<HTMLElement>(".header");
const onScroll = () => {
  header?.classList.toggle("scrolled", window.scrollY > 24);
};
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

/* ---------- reveal on scroll (with failsafe) ---------- */
const reveals = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
const revealAll = () => reveals.forEach((el) => el.classList.add("in"));

if (supportsIO && !prefersReduced) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  reveals.forEach((el) => io.observe(el));
  /* hard failsafe — never leave content invisible */
  setTimeout(revealAll, 4000);
} else {
  revealAll();
}

/* ---------- hero parallax ---------- */
const parallaxEls = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));
if (parallaxEls.length && !prefersReduced) {
  for (const el of parallaxEls) {
    el.querySelectorAll<HTMLElement>("img.cover, .ph").forEach((n) => {
      n.style.transform = "scale(1.16)";
      n.style.transformOrigin = "center";
    });
  }
  let pTick = false;
  const applyParallax = () => {
    for (const el of parallaxEls) {
      const speed = parseFloat(el.getAttribute("data-parallax") ?? "") || 0.1;
      el.style.transform = `translate3d(0,${(window.scrollY * speed).toFixed(1)}px,0)`;
    }
    pTick = false;
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!pTick) {
        requestAnimationFrame(applyParallax);
        pTick = true;
      }
    },
    { passive: true }
  );
  applyParallax();
}

/* ---------- scroll-driven FX (Aupale-style) ----------
   data-fx="tilt" : appears from nothing — rotates upright and grows
   data-fx="grow" : scales up gently as it enters
   State is computed from scroll position, so a fresh load mid-page
   shows the correct (visible) state immediately. */
const fxEls = Array.from(document.querySelectorAll<HTMLElement>("[data-fx]"));
if (fxEls.length && !prefersReduced) {
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
  const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
  const fxState = fxEls.map(() => ({ cur: -1 }));
  let fxRunning = false;
  const fxFrame = () => {
    const vh = window.innerHeight;
    fxEls.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > vh + 200) return;
      const raw = clamp01((vh * 0.92 - rect.top) / (vh * 0.55));
      const p = easeOut(raw);
      const st = fxState[i]!;
      /* lerp towards target for buttery motion */
      st.cur = st.cur < 0 ? p : st.cur + (p - st.cur) * 0.18;
      const v = st.cur;
      if (el.getAttribute("data-fx") === "tilt") {
        el.style.opacity = (0.05 + 0.95 * v).toFixed(3);
        el.style.transform = `scale(${(0.82 + 0.18 * v).toFixed(4)}) rotate(${((1 - v) * -5).toFixed(2)}deg)`;
      } else {
        el.style.transform = `scale(${(0.9 + 0.1 * v).toFixed(4)})`;
      }
    });
    if (fxRunning) requestAnimationFrame(fxFrame);
  };
  /* run the loop only while at least one fx element is near the viewport */
  if (supportsIO) {
    const visible = new Set<Element>();
    const fxIO = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target);
          else visible.delete(e.target);
        }
        if (visible.size && !fxRunning) {
          fxRunning = true;
          requestAnimationFrame(fxFrame);
        } else if (!visible.size) {
          fxRunning = false;
        }
      },
      { rootMargin: "200px 0px" }
    );
    fxEls.forEach((el) => fxIO.observe(el));
  } else {
    fxRunning = true;
    requestAnimationFrame(fxFrame);
  }
}

/* ---------- animated counters ---------- */
const animateCount = (el: HTMLElement) => {
  const target = parseFloat(el.getAttribute("data-count") ?? "0");
  const dur = 1600;
  const start = performance.now();
  const tick = (now: number) => {
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased).toLocaleString();
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
const counters = Array.from(document.querySelectorAll<HTMLElement>("[data-count]"));
if (supportsIO && !prefersReduced) {
  const countIO = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          animateCount(e.target as HTMLElement);
          countIO.unobserve(e.target);
        }
      }
    },
    { threshold: 0.6 }
  );
  counters.forEach((el) => countIO.observe(el));
  setTimeout(() => {
    counters.forEach((el) => {
      if (el.textContent === "0") animateCount(el);
    });
  }, 4200);
} else {
  counters.forEach((el) => {
    el.textContent = el.getAttribute("data-count");
  });
}

/* ---------- films carousel ---------- */
const track = document.querySelector<HTMLElement>(".films-track");
if (track) {
  const cards = Array.from(track.querySelectorAll<HTMLElement>(".film-card"));

  /* focused-card effect: the centered film is big & vivid, the
     others fade and shrink (per the final design feedback). */
  const focusFrame = () => {
    const mid = window.innerWidth / 2;
    for (const card of cards) {
      const r = card.getBoundingClientRect();
      const dist = Math.abs(r.left + r.width / 2 - mid);
      const f = Math.max(0, 1 - dist / (r.width * 0.9));
      card.style.setProperty("--f", f.toFixed(3));
    }
  };
  let fTick = false;
  const queueFocus = () => {
    if (!fTick) {
      requestAnimationFrame(() => {
        focusFrame();
        fTick = false;
      });
      fTick = true;
    }
  };
  if (!prefersReduced) {
    track.classList.add("fx"); /* enables the focus styling — no-JS stays full */
    track.addEventListener("scroll", queueFocus, { passive: true });
    window.addEventListener("resize", queueFocus, { passive: true });
    focusFrame();
  }

  const cardStep = () => {
    const card = track.querySelector<HTMLElement>(".film-card");
    return card ? card.getBoundingClientRect().width + 22 : 600;
  };
  const dirMul = () => (document.documentElement.getAttribute("dir") === "rtl" ? -1 : 1);
  const scrollMode = (): ScrollBehavior => (prefersReduced ? "auto" : "smooth");
  const prev = document.querySelector<HTMLButtonElement>(".films-prev");
  const next = document.querySelector<HTMLButtonElement>(".films-next");
  prev?.addEventListener("click", () => track.scrollBy({ left: -cardStep() * dirMul(), behavior: scrollMode() }));
  next?.addEventListener("click", () => track.scrollBy({ left: cardStep() * dirMul(), behavior: scrollMode() }));

  /* drag to scroll — native image-drag disabled so it can't hijack the gesture */
  track.querySelectorAll("img").forEach((img) => img.setAttribute("draggable", "false"));
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;
  track.addEventListener("pointerdown", (e) => {
    isDown = true;
    moved = false;
    startX = e.clientX;
    startScroll = track.scrollLeft;
    track.setPointerCapture(e.pointerId);
    track.classList.add("dragging");
  });
  window.addEventListener("pointermove", (e) => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 6) moved = true;
    track.scrollLeft = startScroll - dx;
  });
  window.addEventListener("pointerup", () => {
    isDown = false;
    track.classList.remove("dragging");
  });
  /* suppress click-after-drag */
  track.addEventListener(
    "click",
    (e) => {
      if (moved) {
        e.stopPropagation();
        e.preventDefault();
        moved = false;
      }
    },
    true
  );
}

/* ---------- film lightbox (YouTube) ---------- */
const lightbox = document.getElementById("lightbox");
const lbFrame = document.getElementById("lightbox-frame");
const YT_ID = /^[A-Za-z0-9_-]{11}$/; /* hard gate — the id is the only dynamic input */
let lastFocus: HTMLElement | null = null;
const openLightbox = (id: string | null) => {
  if (!lightbox || !lbFrame || !id || !YT_ID.test(id)) return;
  const frame = document.createElement("iframe");
  frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1`;
  frame.title = "Novan film";
  frame.allow = "autoplay; encrypted-media; fullscreen";
  frame.referrerPolicy = "strict-origin-when-cross-origin";
  frame.setAttribute("allowfullscreen", "");
  lbFrame.replaceChildren(frame);
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  /* move focus into the dialog; restore on close */
  lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  lightbox.querySelector<HTMLElement>(".lightbox-close")?.focus();
};
const closeLightbox = () => {
  if (!lightbox || !lbFrame) return;
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  lastFocus?.focus();
  lastFocus = null;
  setTimeout(() => {
    lbFrame.replaceChildren();
  }, 400);
};
/* lightweight focus trap: anything tabbing out of the open dialog comes back */
document.addEventListener("focusin", (e) => {
  if (!lightbox?.classList.contains("open")) return;
  if (e.target instanceof Node && !lightbox.contains(e.target)) {
    lightbox.querySelector<HTMLElement>(".lightbox-close")?.focus();
  }
});
document.querySelectorAll<HTMLElement>(".film-card").forEach((card) => {
  const play = () => openLightbox(card.getAttribute("data-video"));
  card.addEventListener("click", play);
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      play();
    }
  });
});
if (lightbox) {
  lightbox.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    if (t === lightbox || t.closest(".lightbox-close")) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });
}

/* ---------- voices slider (auto, faded slide) ---------- */
const voices = Array.from(document.querySelectorAll<HTMLElement>(".voice"));
const dotsWrap = document.querySelector<HTMLElement>(".voices-dots");
if (voices.length && dotsWrap) {
  let vIndex = 0;
  let vTimer: ReturnType<typeof setInterval> | null = null;
  voices.forEach((_, i) => {
    const b = document.createElement("button");
    b.setAttribute("data-aria-en", `Quote ${i + 1}`);
    b.setAttribute("data-aria-ar", `اقتباس ${i + 1}`);
    b.setAttribute(
      "aria-label",
      document.documentElement.getAttribute("lang") === "ar" ? `اقتباس ${i + 1}` : `Quote ${i + 1}`
    );
    if (i === 0) b.classList.add("active");
    b.addEventListener("click", () => {
      goVoice(i);
      restartTimer();
    });
    dotsWrap.appendChild(b);
  });
  const dots = Array.from(dotsWrap.children);
  const goVoice = (i: number) => {
    if (i === vIndex) return;
    const old = vIndex;
    voices[old]!.classList.remove("active");
    voices[old]!.classList.add("leaving");
    setTimeout(() => voices[old]!.classList.remove("leaving"), 900);
    vIndex = i;
    voices[vIndex]!.classList.add("active");
    dots.forEach((d, j) => d.classList.toggle("active", j === vIndex));
  };
  const restartTimer = () => {
    if (vTimer) clearInterval(vTimer);
    if (prefersReduced) return;
    vTimer = setInterval(() => goVoice((vIndex + 1) % voices.length), 6000);
  };
  restartTimer();
  const stage = document.querySelector<HTMLElement>(".voices-stage");
  const voicesSection = document.getElementById("voices");
  const pause = () => {
    if (vTimer) clearInterval(vTimer);
  };
  stage?.addEventListener("mouseenter", pause);
  stage?.addEventListener("mouseleave", restartTimer);
  /* keyboard pause hooks onto the whole section — the dots are its
     focusable elements, the stage itself has none */
  voicesSection?.addEventListener("focusin", pause);
  voicesSection?.addEventListener("focusout", restartTimer);
}

/* ---------- living water footer (Path-style, wavify mechanic) ----------
   The wave path is regenerated each frame: "bone" points bob on offset
   sine phases, joined by cubic curves with control points at the
   horizontal midpoints — same mechanic drinkpathwater.com gets from
   wavify.js + GSAP, here in vanilla TS. The filled path is the water. */
const wavePath = document.querySelector<SVGPathElement>("#footer-wave");
const seaEl = document.querySelector<HTMLElement>(".footer .sea");
if (wavePath && seaEl) {
  const svg = wavePath.ownerSVGElement!;
  const BONES = 4; /* articulation points — few = calm, not curvy */
  const AMP = 11; /* px of rise & fall */
  const MID = 40; /* surface baseline from the sea top */
  const SPEED = 0.0011; /* rad per ms — slow breathing */
  let w = 1440;
  let h = 600;

  const size = () => {
    w = seaEl.clientWidth || 1440;
    h = seaEl.clientHeight || 600;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  };

  const draw = (t: number) => {
    const seg = w / BONES;
    const y = (i: number) => MID + Math.sin(t + i * 1.7) * AMP;
    /* bottom edge overdraws 4px past the viewBox (clipped) so the path
       fills flush — no anti-aliased hairline against the backdrop */
    let d = `M 0 ${h + 4} L 0 ${y(0).toFixed(2)}`;
    for (let i = 1; i <= BONES; i++) {
      const cx = (i * seg - seg / 2).toFixed(2);
      d += ` C ${cx} ${y(i - 1).toFixed(2)} ${cx} ${y(i).toFixed(2)} ${(i * seg).toFixed(2)} ${y(i).toFixed(2)}`;
    }
    d += ` L ${w} ${h + 4} Z`;
    wavePath.setAttribute("d", d);
  };

  size();
  draw(0);
  const onSeaResize = () => {
    size();
    draw(0); /* immediate redraw — the rAF loop (if running) keeps it live */
  };
  if ("ResizeObserver" in window) {
    /* fonts/images settling change the sea's height — track it directly */
    new ResizeObserver(onSeaResize).observe(seaEl);
  } else {
    window.addEventListener("resize", onSeaResize, { passive: true });
  }

  if (!prefersReduced) {
    let raf = 0;
    let running = false;
    const loop = (now: number) => {
      draw(now * SPEED);
      raf = requestAnimationFrame(loop);
    };
    if (supportsIO) {
      /* only animate while the footer is on screen */
      const waveIO = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !running) {
            running = true;
            raf = requestAnimationFrame(loop);
          } else if (!e.isIntersecting && running) {
            running = false;
            cancelAnimationFrame(raf);
          }
        }
      });
      waveIO.observe(seaEl);
    } else {
      raf = requestAnimationFrame(loop);
    }
  }
}

/* ---------- mobile menu ---------- */
const menuBtn = document.querySelector<HTMLElement>(".menu-btn");
const mobileMenu = document.querySelector<HTMLElement>(".mobile-menu");
if (menuBtn && mobileMenu) {
  const setMenu = (open: boolean) => {
    mobileMenu.classList.toggle("open", open);
    menuBtn.classList.toggle("open", open);
    /* the open menu has a light backdrop — force the header into its dark
       (scrolled-style) treatment so the brand/toggle/X stay legible */
    header?.classList.toggle("menu-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
  };
  menuBtn.addEventListener("click", () => setMenu(!mobileMenu.classList.contains("open")));
  mobileMenu.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => setMenu(false));
  });
}

/* ---------- language toggle (EN / AR) ---------- */
const htmlEl = document.documentElement;
const setLang = (lang: string) => {
  const isAR = lang === "ar";
  htmlEl.setAttribute("lang", isAR ? "ar" : "en");
  htmlEl.setAttribute("dir", isAR ? "rtl" : "ltr");
  document.querySelectorAll<Element>("[data-en]").forEach((el) => {
    const txt = isAR ? el.getAttribute("data-ar") : el.getAttribute("data-en");
    if (txt !== null) el.textContent = txt;
  });
  /* aria-labels are translated too — same pattern, separate attribute pair */
  document.querySelectorAll<Element>("[data-aria-en]").forEach((el) => {
    const label = isAR ? el.getAttribute("data-aria-ar") : el.getAttribute("data-aria-en");
    if (label !== null) el.setAttribute("aria-label", label);
  });
  document.querySelectorAll<HTMLButtonElement>(".lang-toggle button").forEach((b) => {
    const active = b.getAttribute("data-lang") === lang;
    b.classList.toggle("active", active);
    b.setAttribute("aria-pressed", String(active));
  });
  try {
    localStorage.setItem("novan-lang", lang);
  } catch {
    /* private mode — ignore */
  }
};
document.querySelectorAll<HTMLButtonElement>(".lang-toggle button").forEach((b) => {
  b.addEventListener("click", () => setLang(b.getAttribute("data-lang") ?? "en"));
});
let saved = "en";
try {
  saved = localStorage.getItem("novan-lang") ?? "en";
} catch {
  /* ignore */
}
if (saved !== "en") setLang(saved);
