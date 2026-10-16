/* Unison Medicines essay — navigation, figure fitting, citation pop-ups. No dependencies. */
(function () {
  'use strict';
  var doc = document;

  /* ---------- phone/tablet contents menu ---------- */
  var btn = doc.querySelector('.menu-btn'), menu = doc.getElementById('menu');
  function setMenu(open) {
    if (!btn || !menu) return;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.hidden = !open;
    doc.body.classList.toggle('menu-open', open);
  }
  if (btn) btn.addEventListener('click', function () { setMenu(menu.hidden); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setMenu(false); closePop(); closeLightbox(); } });
  window.addEventListener('resize', function () { if (window.innerWidth >= 900) setMenu(false); });

  /* keep the current chapter visible in the horizontal chapter strip */
  var strip = doc.querySelector('.chapters ul'), cur = doc.querySelector('.chapters a[aria-current="page"]');
  if (strip && cur) {
    var l = cur.offsetLeft, r = l + cur.offsetWidth;
    if (r > strip.clientWidth) strip.scrollLeft = l - 40;
  }

  /* ---------- reading progress ---------- */
  var bar = doc.querySelector('.progress span'), ticking = false;
  function progress() {
    ticking = false;
    if (!bar) return;
    var h = doc.documentElement, max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? Math.min(100, Math.max(0, h.scrollTop / max * 100)) : 0) + '%';
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(progress); } }, { passive: true });
  progress();

  /* ---------- figures: scale the print-designed graphics to the available width ---------- */
  var frames = [].slice.call(doc.querySelectorAll('.fig-frame'));
  var zoomOK = 'zoom' in doc.documentElement.style;
  function fit() {
    frames.forEach(function (f) {
      var inner = f.firstElementChild, w = +f.dataset.w, max = +f.dataset.max || 1, min = +f.dataset.min || 0;
      var avail = f.clientWidth, z = Math.min(max, avail / w), scroll = false;
      if (z < min) { z = min; scroll = true; }
      f.classList.toggle('scroll', scroll);
      if (zoomOK) { inner.style.zoom = z; f.style.height = ''; }
      else { inner.style.transform = 'scale(' + z + ')'; f.style.height = (inner.offsetHeight * z) + 'px'; }
      var enl = f.parentNode.querySelector('.fig-enlarge');
      if (enl) enl.hidden = !(z < 0.8);
    });
  }
  fit();
  window.addEventListener('resize', fit);
  window.addEventListener('load', fit);

  /* tap-to-enlarge on small screens */
  var lb = null;
  function closeLightbox() { if (lb) { lb.hidden = true; lb.querySelector('.lb-body').innerHTML = ''; doc.body.classList.remove('menu-open'); } }
  doc.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.fig-enlarge');
    if (!b) return;
    var fig = b.closest('figure'), inner = fig.querySelector('.fig-inner');
    if (!lb) {
      lb = doc.createElement('div'); lb.className = 'lightbox'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
      lb.innerHTML = '<div class="lb-top"><span class="lb-title"></span><button class="lb-close" type="button">Close</button></div><div class="lb-hint">Scroll or pinch to explore the figure.</div><div class="lb-body"></div>';
      doc.body.appendChild(lb);
      lb.querySelector('.lb-close').addEventListener('click', closeLightbox);
    }
    var clone = inner.cloneNode(true); clone.style.zoom = 1; clone.style.transform = 'none';
    lb.querySelector('.lb-body').appendChild(clone);
    var cap = fig.querySelector('figcaption');
    if (cap) { var c = cap.cloneNode(true); c.style.marginTop = '14px'; c.style.maxWidth = inner.style.width; lb.querySelector('.lb-body').appendChild(c); }
    lb.querySelector('.lb-title').textContent = (fig.querySelector('.fig-label') || {}).textContent || 'Figure';
    lb.hidden = false; doc.body.classList.add('menu-open');
    lb.querySelector('.lb-close').focus();
  });

  /* ---------- citation pop-ups ---------- */
  var pop = doc.querySelector('.cite-pop'), openLink = null;
  function closePop() { if (pop && !pop.hidden) { pop.hidden = true; if (openLink) openLink.setAttribute('aria-expanded', 'false'); openLink = null; } }
  function refNums(spec) {
    var p = spec.split('-'), a = +p[0], b = +(p[1] || p[0]), out = [];
    for (var i = a; i <= b && out.length < 12; i++) out.push(i);
    return out;
  }
  doc.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a.cite');
    if (!a) {
      if (pop && !pop.hidden && !(e.target.closest && e.target.closest('.cite-pop'))) closePop();
      return;
    }
    var R = window.UNISON_REFS; if (!R || !pop) return;      // fall back to the references page
    e.preventDefault();
    if (openLink === a) { closePop(); return; }
    closePop();
    var nums = refNums(a.dataset.refs), html = '';
    nums.forEach(function (n) { if (R[n]) html += '<div class="cp-item"><span class="cp-n">' + n + '</span><span class="cp-t">' + R[n] + '</span></div>'; });
    html += '<a class="cp-all" href="references.html#ref-' + nums[0] + '">All references →</a>';
    pop.innerHTML = html; pop.hidden = false;
    pop.querySelectorAll('.cp-t a').forEach(function (x) { x.target = '_blank'; x.rel = 'noopener'; });
    if (window.innerWidth > 640) {
      var r = a.getBoundingClientRect(), pw = pop.offsetWidth;
      var left = Math.max(16, Math.min(window.scrollX + r.left - 24, window.scrollX + doc.documentElement.clientWidth - pw - 16));
      var top = window.scrollY + r.bottom + 8;
      if (r.bottom + pop.offsetHeight + 16 > window.innerHeight && r.top > pop.offsetHeight + 80) top = window.scrollY + r.top - pop.offsetHeight - 8;
      pop.style.left = left + 'px'; pop.style.top = top + 'px';
    }
    a.setAttribute('aria-expanded', 'true'); openLink = a;
  });
})();
