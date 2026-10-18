/* Mar de Sitios — interacciones */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.remove("no-js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- idioma ---------- */
  function setLang(l) {
    doc.lang = l === "en" ? "en" : "es";
    $$(".lang button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.lang === doc.lang)); });
    var t = doc.getAttribute("data-title-" + doc.lang);
    if (t) document.title = t;
    store.set("mds-lang", doc.lang);
  }
  setLang(store.get("mds-lang") || "es");
  $$(".lang button").forEach(function (b) { b.addEventListener("click", function () { setLang(b.dataset.lang); }); });

  /* ---------- titular palabra por palabra ---------- */
  $$("[data-split]").forEach(function (el) {
    var i = 0;
    function wrapWords(text, em) {
      var frag = document.createDocumentFragment();
      text.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
        var w = document.createElement("span"); w.className = "w";
        var s = document.createElement("span"); s.style.transitionDelay = (0.12 + i++ * 0.055) + "s";
        if (em) { var e = document.createElement("em"); e.textContent = part; s.appendChild(e); } else { s.textContent = part; }
        w.appendChild(s); frag.appendChild(w);
      });
      return frag;
    }
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) el.replaceChild(wrapWords(n.textContent, false), n);
      else if (n.nodeType === 1) el.replaceChild(wrapWords(n.textContent, n.tagName === "EM"), n);
    });
  });

  /* ---------- loader + entrada del hero ---------- */
  var loader = $(".loader"), hero = $(".hero, .page-hero");
  var seen = false; try { seen = sessionStorage.getItem("mds-intro") === "1"; } catch (e) {}
  function start() {
    if (loader) loader.classList.add("done");
    if (hero) hero.classList.add("in");
    try { sessionStorage.setItem("mds-intro", "1"); } catch (e) {}
  }
  if (!loader || seen || reduce) { if (loader) loader.remove(); requestAnimationFrame(start); }
  else {
    var go = function () { setTimeout(start, 650); };
    if (document.readyState === "complete") go(); else window.addEventListener("load", go);
    setTimeout(start, 1800); // nunca bloquear más de 1.8 s
  }

  /* ---------- video del hero ---------- */
  var video = $(".hero-media video");
  var vt = $(".vid-toggle");
  if (video) {
    var conn = navigator.connection || {};
    var portrait = window.innerWidth / window.innerHeight < 0.9;
    if (reduce || conn.saveData) {
      if (vt) vt.hidden = true;
    } else {
      video.muted = true; video.defaultMuted = true; video.playsInline = true;
      video.setAttribute("playsinline", ""); video.setAttribute("webkit-playsinline", "");
      video.src = portrait ? video.dataset.srcMobile : video.dataset.src;
      video.addEventListener("playing", function () { video.classList.add("ready"); }, { once: true });
      var p = video.play(); if (p && p.catch) p.catch(function () { if (vt) vt.classList.add("paused"); });
      var userPaused = false;
      if (vt) vt.addEventListener("click", function () {
        if (video.paused) { userPaused = false; video.play(); vt.classList.remove("paused"); vt.setAttribute("aria-label", vt.dataset.pause); }
        else { userPaused = true; video.pause(); vt.classList.add("paused"); vt.setAttribute("aria-label", vt.dataset.play); }
      });
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (es) {
          es.forEach(function (e) { if (userPaused) return; if (e.isIntersecting) video.play().catch(function () {}); else video.pause(); });
        }, { threshold: 0.05 }).observe(video);
      }
    }
  }

  /* ---------- navegación ---------- */
  var nav = $(".nav"), bar = $(".progress"), wa = $(".wa-float");
  var lastY = window.scrollY, ticking = false;
  function onScroll() {
    var y = window.scrollY;
    if (nav) {
      nav.classList.toggle("solid", y > 40);
      var open = document.body.classList.contains("menu-open");
      if (!open && y > 600 && y > lastY + 4) nav.classList.add("hide");
      else if (y < lastY - 4 || y < 600) nav.classList.remove("hide");
    }
    if (bar) { var h = doc.scrollHeight - window.innerHeight; bar.style.transform = "scaleX(" + (h > 0 ? y / h : 0) + ")"; }
    if (wa) wa.classList.toggle("show", y > window.innerHeight * 0.6);
    lastY = y; ticking = false;
    scrollFx();
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  /* ---------- menú de pantalla completa ---------- */
  var burger = $(".burger"), menu = $(".menu");
  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    document.body.classList.toggle("lock", open);
    if (burger) burger.setAttribute("aria-expanded", String(open));
    if (menu) menu.setAttribute("aria-hidden", String(!open));
    if (nav) nav.classList.remove("hide");
    if (open) { var f = $(".menu-list a", menu); if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 350); }
    else if (burger) burger.focus({ preventScroll: true });
  }
  if (burger && menu) {
    burger.addEventListener("click", function () { setMenu(!document.body.classList.contains("menu-open")); });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) {
      if (!document.body.classList.contains("menu-open")) return;
      if (e.key === "Escape") setMenu(false);
      if (e.key === "Tab") { // mantener el foco dentro del menú
        var items = $$("a, button", menu).concat(burger ? [burger] : []).filter(function (x) { return x.offsetParent !== null; });
        var first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    var previews = $$(".menu-preview img", menu);
    $$(".menu-list a", menu).forEach(function (a) {
      var show = function () { var i = +a.dataset.preview; previews.forEach(function (im, k) { im.classList.toggle("on", k === i); }); };
      a.addEventListener("mouseenter", show); a.addEventListener("focus", show);
    });
  }

  /* ---------- tarjetas del hero que rotan ---------- */
  var cards = $$(".hero-card");
  if (cards.length > 1 && !reduce) {
    var order = cards.map(function (c, i) { return i; });
    setInterval(function () {
      if (document.hidden) return;
      var top = order.shift(); order.push(top);
      cards[top].dataset.pos = "out";
      order.forEach(function (ci, k) { if (ci !== top) cards[ci].dataset.pos = String(k); });
      setTimeout(function () { cards[top].dataset.pos = String(order.length - 1); }, 700);
    }, 3400);
  }

  /* ---------- declaración: palabras que se iluminan ---------- */
  var stmt = $("[data-scrub]"), words = [];
  if (stmt) {
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) frag.appendChild(document.createTextNode(p));
            else { var s = document.createElement("span"); s.className = "sw"; s.textContent = p; frag.appendChild(s); }
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    $$("[lang]", stmt).forEach(walk);
  }
  var stepsWrap = $(".steps"), steps = $$(".step"), line = $(".steps-line");
  function scrollFx() {
    var vh = window.innerHeight;
    if (stmt) {
      var r = stmt.getBoundingClientRect();
      var prog = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
      words = $$("[lang]:not([hidden]) .sw", stmt).filter(function (w) { return w.offsetParent !== null; });
      var n = Math.round(prog * words.length);
      words.forEach(function (w, i) { w.classList.toggle("lit", i < n); });
    }
    if (stepsWrap) {
      var rs = stepsWrap.getBoundingClientRect();
      var pp = Math.min(1, Math.max(0, (vh * 0.75 - rs.top) / (rs.width > 600 ? vh * 0.45 : rs.height)));
      if (line) line.style.setProperty("--p", pp);
      steps.forEach(function (s, i) { s.classList.toggle("on", pp >= (i / steps.length) + 0.02 || pp === 1); });
    }
  }

  /* ---------- revelado ---------- */
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    $$(".rv").forEach(function (el) { io.observe(el); });
  } else { $$(".rv").forEach(function (el) { el.classList.add("in"); }); }

  /* ---------- FAQ ---------- */
  $$(".faq-item").forEach(function (item) {
    var q = $(".faq-q", item);
    q.addEventListener("click", function () {
      var open = item.classList.contains("open");
      $$(".faq-item.open").forEach(function (o) { o.classList.remove("open"); $(".faq-q", o).setAttribute("aria-expanded", "false"); });
      if (!open) { item.classList.add("open"); q.setAttribute("aria-expanded", "true"); }
    });
  });

  /* ---------- inclinación 3D sutil (solo mouse) ---------- */
  if (finePointer && !reduce) {
    $$("[data-tilt]").forEach(function (el) {
      var target = $(".browser", el) || el;
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        target.style.setProperty("--ry", (x * 6).toFixed(2) + "deg");
        target.style.setProperty("--rx", (-y * 5).toFixed(2) + "deg");
      });
      el.addEventListener("mouseleave", function () { target.style.setProperty("--ry", "0deg"); target.style.setProperty("--rx", "0deg"); });
    });
  }

  /* ---------- formulario: paquete desde los botones ---------- */
  $$("[data-pick]").forEach(function (a) {
    a.addEventListener("click", function () { var s = $("#f-paquete"); if (s) s.value = a.dataset.pick; });
  });

  var y = $("[data-year]"); if (y) y.textContent = new Date().getFullYear();
  onScroll();
})();
