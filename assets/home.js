/* =========================================================
   中湖國小 115 學年度運動會
   home.js — 首頁滾動視差（GSAP + ScrollTrigger）
   全部效果都只是「加強」：GSAP 沒載入、關閉動態、或任何錯誤
   都會退回成一個靜態但完整可讀的頁面。
   ========================================================= */
(function () {
  "use strict";

  var doc = document.documentElement;

  function fallback(reason) {
    doc.classList.remove("js-motion");
    doc.classList.add("motion-off");
    if (window.console && console.warn) {
      console.warn("[home] motion off →", reason);
    }
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    fallback("prefers-reduced-motion");
    return;
  }
  if (!window.gsap || !window.ScrollTrigger) {
    fallback("GSAP not loaded");
    return;
  }

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;

  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: "power3.out", duration: 0.9 });
  ScrollTrigger.config({ ignoreMobileResize: true });

  var mm = gsap.matchMedia();

  /* ── 開場：標題逐行、內容依序進場 ─────────────────── */
  function introHero() {
    var lines = gsap.utils.toArray(".hero-title .ht-inner");
    var fades = gsap.utils.toArray("[data-hero-fade]");

    gsap.set(lines, { yPercent: 112, opacity: 1 });
    gsap.set(fades, { y: 18 });
    gsap.set(".hero-side", { y: 26 });
    gsap.set(".hero-foot", { y: 10 });

    var tl = gsap.timeline({ delay: 0.12, defaults: { ease: "expo.out" } });
    tl.to(lines, { yPercent: 0, duration: 1.35, stagger: 0.09 }, 0)
      .to(fades, { autoAlpha: 1, y: 0, duration: 0.95, stagger: 0.08 }, 0.34)
      .to(".hero-side", { autoAlpha: 1, y: 0, duration: 1.1 }, 0.4)
      .to(".hero-foot", { autoAlpha: 1, y: 0, duration: 0.9 }, 0.72);
  }

  /* ── 進場：元素進入視窗時淡入上移 ─────────────────── */
  function setupReveals() {
    var items = gsap.utils.toArray("[data-reveal]");
    if (!items.length) return;

    gsap.set(items, { y: 28 });

    ScrollTrigger.batch(items, {
      start: "top 90%",
      once: true,
      interval: 0.12,
      batchMax: 8,
      onEnter: function (batch) {
        gsap.to(batch, {
          autoAlpha: 1,
          y: 0,
          duration: 1,
          stagger: 0.075,
          ease: "power3.out",
          overwrite: true,
          clearProps: "transform"
        });
      }
    });
  }

  /* ── Hero：釘住一個視窗，讓三層背景以不同速度散開 ── */
  function setupHeroScroll() {
    mm.add("(min-width: 1081px) and (min-height: 700px)", function () {
      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "+=60%",
          pin: true,
          scrub: 0.7,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });

      tl.to(".hero-copy", { yPercent: -12, ease: "none" }, 0)
        .to(".hero-side", { yPercent: -18, ease: "none" }, 0)
        .to(".hero-foot", { autoAlpha: 0, ease: "none" }, 0)
        .to(".track-wrap", { yPercent: 10, scale: 1.1, ease: "none" }, 0)
        .to(".hero-num", { yPercent: -20, xPercent: 5, ease: "none" }, 0)
        .to(".glow--coral", { yPercent: 14, ease: "none" }, 0);

      return function () {
        tl.scrollTrigger.kill();
        tl.kill();
      };
    });

    /* 手機、平板：不釘住，只讓跑道比內容慢一點，保留視差感 */
    mm.add("(max-width: 1080px)", function () {
      var t = gsap.to(".track-wrap", {
        yPercent: 14,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });

      return function () {
        t.scrollTrigger.kill();
        t.kill();
      };
    });
  }

  /* ── 當天流程：時間軸進度線跟著捲動長出來 ─────────── */
  function setupFlow() {
    var flow = document.querySelector("[data-flow]");
    if (!flow) return;

    var fill = flow.querySelector("[data-flow-fill]");
    if (fill) {
      gsap.fromTo(fill, { scaleY: 0 }, {
        scaleY: 1,
        ease: "none",
        scrollTrigger: {
          trigger: flow,
          start: "top 72%",
          end: "bottom 72%",
          scrub: 0.35
        }
      });
    }

    gsap.utils.toArray(".flow-row", flow).forEach(function (row) {
      ScrollTrigger.create({
        trigger: row,
        start: "top 76%",
        end: "bottom 42%",
        onToggle: function (self) {
          row.classList.toggle("is-on", self.isActive);
        }
      });
    });
  }

  /* ── 競賽項目：釘住版面，垂直捲動換成橫向移動 ─────── */
  function setupEvents() {
    var section = document.querySelector("[data-events]");
    if (!section) return;

    var track = section.querySelector("[data-events-track]");
    var bar = section.querySelector("[data-events-bar]");
    if (!track) return;

    mm.add("(min-width: 1024px) and (min-height: 620px)", function () {
      function distance() {
        return Math.max(0, track.scrollWidth - window.innerWidth);
      }

      var tween = gsap.to(track, {
        x: function () { return -distance(); },
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: function () { return "+=" + distance(); },
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: function (self) {
            if (bar) bar.style.transform = "scaleX(" + self.progress + ")";
          }
        }
      });

      return function () {
        if (bar) bar.style.transform = "";
        tween.scrollTrigger.kill();
        tween.kill();
      };
    });
  }

  /* ── 大會數字：跑馬燈、數字滾動 ───────────────────── */
  function setupStats() {
    var marquee = document.querySelector("[data-marquee]");

    if (marquee) {
      var inner = marquee.querySelector(".marquee-inner");
      if (inner) {
        gsap.to(inner, {
          xPercent: -50,
          duration: 38,
          ease: "none",
          repeat: -1
        });

        var skewTo = gsap.quickTo(inner, "skewX", {
          duration: 0.55,
          ease: "power3"
        });

        ScrollTrigger.create({
          trigger: marquee,
          start: "top bottom",
          end: "bottom top",
          onUpdate: function (self) {
            var v = self.getVelocity() / -420;
            skewTo(Math.max(-7, Math.min(7, v)));
          }
        });
      }
    }

    gsap.utils.toArray("[data-count]").forEach(function (el) {
      var end = parseFloat(el.getAttribute("data-count")) || 0;
      var state = { v: 0 };

      el.textContent = "0";

      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: function () {
          gsap.to(state, {
            v: end,
            duration: 1.5,
            ease: "power2.out",
            onUpdate: function () {
              el.textContent = Math.round(state.v);
            }
          });
        }
      });
    });
  }

  /* ── 重要時程：把「還有幾天」算出來 ───────────────── */
  function setupDates() {
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    gsap.utils.toArray("[data-eta]").forEach(function (el) {
      var raw = el.getAttribute("data-eta") || "";
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
      if (!m) return;

      var target = new Date(+m[1], +m[2] - 1, +m[3]);
      var diff = Math.round((target - today) / 86400000);
      var text = "還有 " + diff + " 天";
      var cls = "is-soon";

      if (diff < 0) {
        text = "已結束";
        cls = "is-past";
      } else if (diff === 0) {
        text = "就是今天";
        cls = "is-today";
      }

      el.textContent = text;
      el.classList.add(cls);
    });
  }

  /* ── 結尾：大字與巨大日期視差 ─────────────────────── */
  function setupOutro() {
    gsap.to(".outro-num", {
      yPercent: -14,
      xPercent: -4,
      ease: "none",
      scrollTrigger: {
        trigger: ".outro",
        start: "top bottom",
        end: "bottom top",
        scrub: 0.8
      }
    });

    gsap.to(".outro-line", {
      xPercent: -3,
      ease: "none",
      scrollTrigger: {
        trigger: ".outro",
        start: "top bottom",
        end: "bottom top",
        scrub: 1
      }
    });

    gsap.from(".outro-big", {
      y: 44,
      autoAlpha: 0,
      duration: 1.1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".outro",
        start: "top 74%",
        once: true
      }
    });
  }

  /* ── 頂部進度條 ───────────────────────────────────── */
  function setupProgress() {
    var bar = document.querySelector("[data-progress]");
    if (!bar) return;

    gsap.to(bar, {
      scaleX: 1,
      ease: "none",
      scrollTrigger: { start: 0, end: "max", scrub: 0.25 }
    });
  }

  /* ── header 捲動後加深底色 ────────────────────────── */
  function setupHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;

    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: function (self) {
        header.classList.toggle("is-scrolled", self.scroll() > 20);
      }
    });
  }

  /* 鍵盤使用者：第一次按 Tab 就把所有內容直接顯示，避免焦點被跳過 */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Tab") return;
    gsap.set(gsap.utils.toArray("[data-reveal]"), {
      autoAlpha: 1,
      y: 0,
      clearProps: "transform"
    });
  }, { once: true });

  try {
    introHero();
    setupReveals();
    setupHeroScroll();
    setupFlow();
    setupEvents();
    setupStats();
    setupDates();
    setupOutro();
    setupProgress();
    setupHeader();
    doc.classList.add("motion-ready");
  } catch (err) {
    fallback(err && err.message ? err.message : err);
    return;
  }

  /* 字型、圖片載入後重算位置，避免 pin 的長度算錯 */
  function refresh() {
    ScrollTrigger.refresh();
  }
  window.addEventListener("load", refresh);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(refresh).catch(function () {});
  }
  window.setTimeout(refresh, 1200);
  window.addEventListener("pageshow", function (e) {
    if (e.persisted) refresh();
  });
})();
