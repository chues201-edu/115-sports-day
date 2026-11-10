/* =========================================================
   中湖國小 115 學年度運動會 官方網站
   app.js — 導覽、倒數、分頁、篩選、搜尋
   ========================================================= */
(function () {
  "use strict";

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  };

  /* ── 行動版導覽 ─────────────────────────────────────── */
  function initNav() {
    var toggle = $(".nav-toggle");
    var nav = $(".nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  /* ── 倒數計時 ───────────────────────────────────────── */
  function initCountdown() {
    var card = $("[data-countdown]");
    if (!card) return;

    var target = new Date(card.getAttribute("data-target"));
    if (isNaN(target)) return;

    var badge = $("[data-cc-badge]", card);
    var fields = {
      days: $("[data-cc-days]", card),
      hours: $("[data-cc-hours]", card),
      mins: $("[data-cc-mins]", card),
      secs: $("[data-cc-secs]", card)
    };
    var END = new Date(target.getTime() + 9 * 3600 * 1000); // 當天活動至 17:00 左右

    function pad(n, len) {
      var s = String(n);
      while (s.length < (len || 2)) s = "0" + s;
      return s;
    }

    function tick() {
      var now = new Date();
      var diff = target - now;

      if (diff > 0) {
        var d = Math.floor(diff / 86400000);
        var h = Math.floor(diff / 3600000) % 24;
        var m = Math.floor(diff / 60000) % 60;
        var s = Math.floor(diff / 1000) % 60;
        fields.days.textContent = pad(d, d >= 100 ? 3 : 2);
        fields.hours.textContent = pad(h);
        fields.mins.textContent = pad(m);
        fields.secs.textContent = pad(s);
        if (badge) { badge.textContent = "倒數中"; badge.className = "cc-badge"; }
      } else if (now < END) {
        fields.days.textContent = "00";
        fields.hours.textContent = "00";
        fields.mins.textContent = "00";
        fields.secs.textContent = "00";
        if (badge) { badge.textContent = "今日登場"; badge.className = "cc-badge is-live"; }
      } else {
        fields.days.textContent = "98";
        fields.hours.textContent = "∞";
        fields.mins.textContent = "--";
        fields.secs.textContent = "--";
        if (badge) { badge.textContent = "已圓滿落幕"; badge.className = "cc-badge is-done"; }
      }
    }

    tick();
    setInterval(tick, 1000);
  }

  /* ── 分頁 ───────────────────────────────────────────── */
  function initTabs() {
    $$("[data-tabs]").forEach(function (group) {
      var tabs = $$('[role="tab"]', group);
      var root = group.closest("[data-tab-root]") || document;

      function select(target) {
        tabs.forEach(function (tab) {
          var on = tab === target;
          tab.setAttribute("aria-selected", on ? "true" : "false");
          tab.setAttribute("tabindex", on ? "0" : "-1");
          var panel = document.getElementById(tab.getAttribute("aria-controls"));
          if (panel) panel.hidden = !on;
        });
        var id = target.getAttribute("aria-controls");
        if (id && history.replaceState) {
          history.replaceState(null, "", "#" + id);
        }
        applyAll();
      }

      tabs.forEach(function (tab, i) {
        tab.addEventListener("click", function () { select(tab); });
        tab.addEventListener("keydown", function (e) {
          var next = null;
          if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
          if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
          if (next) { e.preventDefault(); next.focus(); select(next); }
        });
      });

      var fromHash = tabs.filter(function (t) {
        return "#" + t.getAttribute("aria-controls") === location.hash;
      })[0];
      if (fromHash) select(fromHash);
    });
  }

  /* ── 可篩選清單（籌碼 + 搜尋） ───────────────────────── */
  var listRoots = [];

  function initFilterable() {
    $$("[data-list]").forEach(function (root) {
      var rows = $$("[data-row]", root);
      var chips = $$("[data-chip]", root);
      var search = $("[data-search]", root);
      var empty = $("[data-empty]", root);
      var note = $("[data-count]", root);
      var total = rows.length;

      var state = { tags: [], q: "" };

      function matchTags(row) {
        if (!state.tags.length) return true;
        var tags = (row.getAttribute("data-tags") || "").split(/\s+/);
        return state.tags.every(function (t) { return tags.indexOf(t) !== -1; });
      }

      function matchText(row) {
        if (!state.q) return true;
        return (row.textContent || "").toLowerCase().indexOf(state.q) !== -1;
      }

      function apply() {
        var shown = 0;
        rows.forEach(function (row) {
          var ok = matchTags(row) && matchText(row);
          row.hidden = !ok;
          if (ok) shown++;
        });
        if (empty) empty.hidden = shown !== 0;

        // 外層卡片（例如某一天的賽程）若已無可見項目，整張收起
        $$("[data-card]", root).forEach(function (card) {
          if (card.hasAttribute("data-row")) return;
          var any = $$("[data-row]", card).some(function (r) { return !r.hidden; });
          card.hidden = !any;
        });

        if (note) {
          note.textContent = shown === total
            ? "共 " + total + " 筆資料"
            : "顯示 " + shown + " / " + total + " 筆資料";
        }
      }

      chips.forEach(function (chip) {
        chip.addEventListener("click", function () {
          var group = chip.getAttribute("data-chip");
          var value = chip.getAttribute("data-value") || "";

          $$('[data-chip="' + group + '"]', root).forEach(function (c) {
            c.setAttribute("aria-pressed", c === chip ? "true" : "false");
          });

          if (chip.hasAttribute("data-multi")) {
            var i = state.tags.indexOf(value);
            if (i === -1) { state.tags.push(value); }
            else { state.tags.splice(i, 1); chip.setAttribute("aria-pressed", "false"); }
          } else {
            state.tags = value && value !== "all" ? [value] : [];
          }
          apply();
        });
      });

      if (search) {
        var timer = null;
        search.addEventListener("input", function () {
          clearTimeout(timer);
          var v = search.value.trim().toLowerCase();
          timer = setTimeout(function () { state.q = v; apply(); }, 90);
        });
      }

      apply();
      listRoots.push(apply);
    });
  }

  function applyAll() {
    listRoots.forEach(function (fn) { fn(); });
  }

  /* ── 會前賽日期狀態（已結束 / 今天 / 即將） ──────────── */
  function initDayStatus() {
    var days = $$(".day[data-date]");
    if (!days.length) return;

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    days.forEach(function (day) {
      var raw = day.getAttribute("data-date");
      var parts = raw.split("-");
      var d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
      var diff = Math.round((d - today) / 86400000);
      var tagSlot = $("[data-day-status]", day);

      day.classList.remove("is-past", "is-today");
      if (diff < 0) { day.classList.add("is-past"); }
      else if (diff === 0) { day.classList.add("is-today"); }

      if (tagSlot) {
        if (diff < 0) {
          tagSlot.className = "tag tag-past";
          tagSlot.textContent = "已結束";
        } else if (diff === 0) {
          tagSlot.className = "tag tag-live";
          tagSlot.textContent = "就是今天";
        } else if (diff <= 7) {
          tagSlot.className = "tag tag-soon";
          tagSlot.textContent = "本週 " + diff + " 天後";
        } else {
          tagSlot.className = "tag tag-soon";
          tagSlot.textContent = diff + " 天後";
        }
      }
    });
  }

  /* ── 回到頂端 + 列印 ────────────────────────────────── */
  function initUtilities() {
    var btn = document.createElement("button");
    btn.className = "to-top";
    btn.type = "button";
    btn.setAttribute("aria-label", "回到頁面頂端");
    btn.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>';
    document.body.appendChild(btn);

    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    var onScroll = function () {
      btn.classList.toggle("is-visible", window.scrollY > 600);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    $$("[data-print]").forEach(function (el) {
      el.addEventListener("click", function () { window.print(); });
    });
  }

  /* ── 頁內錨點平滑捲動（含 sticky header 補償） ─────── */
  function initAnchors() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.getElementById(id.slice(1));
      if (!el) return;
      e.preventDefault();
      var top = el.getBoundingClientRect().top + window.scrollY - 78;
      window.scrollTo({ top: top, behavior: "smooth" });
      if (history.pushState) history.pushState(null, "", id);
    });
  }

  /* ── 從其他頁面帶 #hash 進來時，捲到目標區塊 ────────── */
  function initHashTarget() {
    var id = location.hash.slice(1);
    if (!id) return;
    var el = document.getElementById(id);
    if (!el) return;
    window.setTimeout(function () {
      var top = el.getBoundingClientRect().top + window.scrollY - 78;
      window.scrollTo({ top: top < 0 ? 0 : top, behavior: "auto" });
    }, 80);
  }

  function boot() {
    initNav();
    initCountdown();
    initTabs();
    initFilterable();
    initDayStatus();
    initUtilities();
    initAnchors();
    initHashTarget();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
