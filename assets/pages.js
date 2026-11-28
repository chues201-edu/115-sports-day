/* =========================================================
   中湖國小 115 學年度運動會
   pages.js — 內頁滾動效果（GSAP + ScrollTrigger）
   只做「加強」：英雄區進場、頁碼視差、區塊淡入、分頁切換淡入、
   頂部進度條。任何錯誤或減少動態設定都會退回靜態完整版。
   ========================================================= */
(function () {
  "use strict";

  var doc = document.documentElement;

  function fallback(reason) {
    doc.classList.remove("js-motion");
    doc.classList.add("motion-off");
    if (window.console && console.warn) console.warn("[pages] motion off →", reason);
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
  gsap.defaults({ ease: "power3.out", duration: 0.85 });
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ── 頁首進場 ─────────────────────────────────────── */
  function intro() {
    var no = document.querySelector(".page-no");
    var targets = gsap.utils.toArray([
      ".page-hero .breadcrumb",
      ".page-hero h1",
      ".page-hero > .wrap > p",
      ".page-hero .anchor-nav",
      ".page-hero .meet-legend"
    ].join(","));

    if (!targets.length && !no) return;

    gsap.set(targets, { y: 16 });

    var tl = gsap.timeline({ delay: 0.08, defaults: { ease: "power3.out" } });

    if (no) {
      tl.fromTo(no, { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: 1.1 }, 0);
    }
    tl.to(".page-hero .breadcrumb", { autoAlpha: 1, y: 0, duration: 0.7 }, 0)
      .to(".page-hero h1", { autoAlpha: 1, y: 0, duration: 0.9 }, 0.08)
      .to(".page-hero > .wrap > p", { autoAlpha: 1, y: 0, duration: 0.9 }, 0.18)
      .to(".page-hero .anchor-nav, .page-hero .meet-legend", {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.06
      }, 0.26);
  }

  /* ── 頁首視差 ─────────────────────────────────────── */
  function heroParallax() {
    var hero = document.querySelector(".page-hero");
    if (!hero) return;

    var no = document.querySelector(".page-no");
    if (no) {
      gsap.to(no, {
        yPercent: 26,
        xPercent: -4,
        ease: "none",
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "bottom top",
          scrub: 0.7
        }
      });
    }

    gsap.to(".page-hero .wrap", {
      yPercent: -7,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: 0.7
      }
    });
  }

  /* ── 區塊淡入（跳過分頁裡的內容，避免切換分頁後位置失準） ── */
  function reveals() {
    var selector = [
      ".section-head",
      ".notice",
      ".record-callout",
      ".card",
      ".final-card",
      ".record-card",
      ".day",
      ".kv > div",
      ".prose > h3",
      ".meet-block",
      ".record-group",
      ".toolbar"
    ].join(",");

    var items = gsap.utils.toArray(selector).filter(function (el) {
      if (el.closest("[data-tab-root]")) return false;
      if (el.closest("[hidden]")) return false;
      if (el.offsetParent === null) return false;
      return true;
    });

    if (!items.length) return;

    gsap.set(items, { y: 22, autoAlpha: 0 });

    ScrollTrigger.batch(items, {
      start: "top 92%",
      once: true,
      interval: 0.1,
      batchMax: 10,
      onEnter: function (batch) {
        gsap.to(batch, {
          autoAlpha: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.055,
          ease: "power3.out",
          overwrite: true,
          clearProps: "transform"
        });
      }
    });

    /* 鍵盤使用者：第一次按 Tab 就直接顯示，不讓焦點被藏起來的內容跳過 */
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      gsap.set(items, { autoAlpha: 1, y: 0, clearProps: "transform" });
    }, { once: true });
  }

  /* ── 切換分頁時，新面板淡入 ───────────────────────── */
  function tabMotion() {
    document.addEventListener("click", function (e) {
      var tab = e.target.closest ? e.target.closest('[role="tab"]') : null;
      if (!tab) return;

      var panel = document.getElementById(tab.getAttribute("aria-controls") || "");
      if (!panel || panel.hidden) return;

      gsap.fromTo(panel, { autoAlpha: 0, y: 8 }, {
        autoAlpha: 1,
        y: 0,
        duration: 0.35,
        ease: "power2.out",
        clearProps: "transform"
      });

      window.setTimeout(function () { ScrollTrigger.refresh(); }, 60);
    });
  }

  /* ── 頂部進度條 ───────────────────────────────────── */
  function progress() {
    var bar = document.querySelector("[data-progress]");
    if (!bar) return;

    gsap.to(bar, {
      scaleX: 1,
      ease: "none",
      scrollTrigger: { start: 0, end: "max", scrub: 0.25 }
    });
  }

  /* ── header 捲動後加深 ────────────────────────────── */
  function headerState() {
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

  try {
    intro();
    heroParallax();
    reveals();
    tabMotion();
    progress();
    headerState();
    doc.classList.add("motion-ready");
  } catch (err) {
    fallback(err && err.message ? err.message : err);
    return;
  }

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
