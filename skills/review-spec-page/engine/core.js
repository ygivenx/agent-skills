/* Spec page core: sections, contents, cross-references and search.
   It reads the rendered markdown, so a re-render after a spec edit picks the edit up.
   review.js and widgets.js build on window.SpecPage; boot.js runs them in order. */
(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const spec = $('#spec');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  function clean(s) {
    s = s.replace(/\s+/g, ' ').trim().replace(/[,;:]$/, '');
    return s.length > 110 ? `${s.slice(0, 107)}…` : s;
  }
  /** An item's name: its bold lead if it opens with one, else its first sentence. */
  function lead(el) {
    const text = el.textContent.trim();
    const strong = el.querySelector('strong');
    if (strong && text.startsWith(strong.textContent.trim().slice(0, 12))) return clean(strong.textContent);
    const m = text.match(/^(.+?\.)(\s|$)/);
    return clean(m ? m[1] : text);
  }
  /** Text without the controls this page added. */
  function plain(el) {
    const c = el.cloneNode(true);
    c.querySelectorAll('.rv, .envchecks').forEach(n => n.remove());
    return c.textContent.replace(/\s+/g, ' ').trim();
  }

  // ---------- structure ----------
  function sectionize() {
    const intro = document.createElement('section');
    intro.className = 'intro';
    const sections = [intro];
    for (const el of [...spec.children]) {
      if (el.tagName === 'H2') sections.push(document.createElement('section'));
      sections[sections.length - 1].appendChild(el);
    }
    spec.replaceChildren(...sections);
    for (const s of sections.slice(1)) {
      const h2 = s.firstElementChild;
      const title = h2.textContent.trim();
      const m = title.match(/^(\d+)\./);
      s.id = m ? `s${m[1]}` : `s-${slug(title)}`;
      h2.dataset.title = title;
      const fold = document.createElement('button');
      fold.type = 'button';
      fold.className = 'fold';
      fold.textContent = '▾';
      fold.setAttribute('aria-expanded', 'true');
      fold.setAttribute('aria-label', `Fold ${title}`);
      h2.prepend(fold);
      const count = document.createElement('span');
      count.className = 'count';
      h2.append(count);
      h2.addEventListener('click', e => { if (!e.target.closest('a')) setFolded(s, !s.classList.contains('folded')); });
    }
    $$('h3', spec).forEach(h3 => {
      const m = h3.textContent.match(/^(\d+)\.(\d+)/);
      h3.id = m ? `s${m[1]}-${m[2]}` : `h-${slug(h3.textContent)}`;
    });
    const status = $('p', intro);
    if (status && /^Status:/.test(status.textContent)) status.classList.add('callout');
    $$('table', spec).forEach(t => {
      const w = document.createElement('div');
      w.className = 'table-wrap';
      t.replaceWith(w);
      w.appendChild(t);
    });
  }
  const bodySections = () => $$('#spec > section:not(.intro)');
  function setFolded(section, folded) {
    section.classList.toggle('folded', folded);
    const b = $('.fold', section);
    if (b) b.setAttribute('aria-expanded', String(!folded));
    const anyOpen = bodySections().some(s => !s.classList.contains('folded'));
    $('#toggleAll').textContent = anyOpen ? 'Collapse all' : 'Expand all';
  }
  function unfoldFor(el) {
    const s = el.closest('#spec > section');
    if (s && s.classList.contains('folded')) setFolded(s, false);
  }

  // ---------- contents ----------
  function buildToc() {
    const toc = $('#toc');
    for (const s of bodySections()) {
      const h2 = $('h2', s);
      toc.insertAdjacentHTML('beforeend', `<li><a href="#${s.id}" data-go="${s.id}">
        <span>${esc(h2.dataset.title.replace(/\s*\(.*$/, ''))}</span><span class="tag" data-tag="${s.id}"></span></a></li>`);
      for (const h3 of $$('h3', s)) {
        toc.insertAdjacentHTML('beforeend', `<li class="sub"><a href="#${h3.id}" data-go="${h3.id}">
          <span>${esc(h3.textContent)}</span></a></li>`);
      }
    }
  }
  const reviewTags = {};
  /** review.js reports "3/9" per section; search hit counts take over while a query is live. */
  function tocTag(sid, text, done) { reviewTags[sid] = { text, done }; }
  function paintToc() {
    for (const tag of $$('#toc .tag')) {
      const sid = tag.dataset.tag;
      const hits = searchHits[sid];
      tag.className = 'tag';
      if (query) {
        tag.textContent = hits ? String(hits) : '';
        if (hits) tag.classList.add('hits');
      } else {
        const r = reviewTags[sid];
        tag.textContent = r ? r.text : '';
        if (r && r.done) tag.classList.add('done');
      }
    }
  }
  let spyQueued = false;
  function spy() {
    if (spyQueued) return;
    spyQueued = true;
    requestAnimationFrame(() => {
      spyQueued = false;
      let active = null;
      for (const h of $$('#spec > section:not(.intro), #spec h3')) {
        const el = h.tagName === 'SECTION' ? $('h2', h) : h;
        if (el.offsetParent !== null && el.getBoundingClientRect().top < 140) active = h.id;
      }
      $$('#toc a').forEach(a => a.classList.toggle('active', a.dataset.go === active));
    });
  }

  // ---------- cross-references ----------
  const XREF = /§\s?(\d+)(?:\.(\d+))?|\b([A-Z]{1,3}\d{1,3})\b/g;
  function resolve(sec, sub, d) {
    const has = id => (document.getElementById(id) ? id : null);
    if (d) return has(d);
    if (sub) return has(`s${sec}-${sub}`) || has(`a${sec}-${sub}`) || has(`s${sec}`);
    return has(`s${sec}`);
  }
  function textNodes(root, skip) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: n => (n.parentElement && n.parentElement.closest(skip) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    const out = [];
    while (walker.nextNode()) out.push(walker.currentNode);
    return out;
  }
  /** Turn §5, §8.1, §11.10 and decision ids such as D1 into links that fold open and scroll to their target. */
  function linkify(root) {
    if (!root) return;
    const skip = 'a, code, textarea, button, select, option, label, .rv, .envchecks, script, style, svg';
    for (const node of textNodes(root, skip)) {
      const text = node.nodeValue;
      let frag = null;
      let last = 0;
      XREF.lastIndex = 0;
      for (let m; (m = XREF.exec(text));) {
        const target = resolve(m[1], m[2], m[3]);
        if (!target) continue;
        frag = frag || document.createDocumentFragment();
        frag.append(text.slice(last, m.index));
        const a = document.createElement('a');
        a.className = 'xref';
        a.href = `#${target}`;
        a.dataset.go = target;
        a.textContent = m[0];
        frag.append(a);
        last = m.index + m[0].length;
      }
      if (frag) { frag.append(text.slice(last)); node.replaceWith(frag); }
    }
  }
  function go(id, { flash = true, behavior } = {}) {
    const el = document.getElementById(id);
    if (!el) return;
    unfoldFor(el);
    const target = el.tagName === 'SECTION' ? $('h2', el) : el;
    const top = el.tagName === 'SECTION' || el.tagName === 'H3';
    target.scrollIntoView({ behavior: behavior || (reduced() ? 'auto' : 'smooth'), block: top ? 'start' : 'center' });
    if (flash) { target.classList.remove('flash'); void target.offsetWidth; target.classList.add('flash'); }
    history.replaceState(null, '', `#${id}`);
  }

  const peek = $('#peek');
  function showPeek(a) {
    const el = document.getElementById(a.dataset.go);
    if (!el) return;
    let title = el.dataset.ref || '';
    let body;
    if (el.tagName === 'SECTION') {
      title = $('h2', el).dataset.title;
      const p = $$(':scope > p, :scope > ul, :scope > ol', el)[0];
      body = p ? plain(p) : '';
    } else if (el.tagName === 'H3') {
      title = el.textContent;
      body = el.nextElementSibling ? plain(el.nextElementSibling) : '';
    } else if (el.tagName === 'TR') {
      title = `${el.cells[0].textContent.trim()} · ${lead(el.cells[1])}`;
      body = el.cells[2] ? plain(el.cells[2]) : '';
    } else {
      body = plain(el);
    }
    peek.innerHTML = `<b>${esc(title)}</b>${esc(body.length > 340 ? `${body.slice(0, 337)}…` : body)}`;
    peek.hidden = false;
    const r = a.getBoundingClientRect();
    const left = Math.max(8, Math.min(r.left, innerWidth - peek.offsetWidth - 8));
    const top = r.bottom + 8 + peek.offsetHeight > innerHeight ? r.top - peek.offsetHeight - 8 : r.bottom + 8;
    peek.style.left = `${left}px`;
    peek.style.top = `${Math.max(8, top)}px`;
  }
  const hidePeek = () => { peek.hidden = true; };

  // ---------- search ----------
  let query = '';
  let marks = [];
  let cur = -1;
  let searchHits = {};
  function clearMarks() {
    for (const m of $$('mark', spec)) {
      const parent = m.parentNode;
      m.replaceWith(document.createTextNode(m.textContent));
      parent.normalize();
    }
    marks = [];
    cur = -1;
    searchHits = {};
  }
  function runSearch(q) {
    clearMarks();
    query = q.trim().length >= 2 ? q.trim() : '';
    if (query) {
      const re = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      for (const node of textNodes(spec, 'textarea, button, select, option, label, .rv, .envchecks, script, style')) {
        const text = node.nodeValue;
        re.lastIndex = 0;
        if (!re.test(text)) continue;
        re.lastIndex = 0;
        const frag = document.createDocumentFragment();
        let last = 0;
        for (let m; (m = re.exec(text));) {
          frag.append(text.slice(last, m.index));
          const mark = document.createElement('mark');
          mark.textContent = m[0];
          frag.append(mark);
          last = m.index + m[0].length;
        }
        frag.append(text.slice(last));
        node.replaceWith(frag);
      }
      marks = $$('mark', spec);
      for (const m of marks) {
        const s = m.closest('#spec > section');
        if (s && !s.classList.contains('intro')) searchHits[s.id] = (searchHits[s.id] || 0) + 1;
        unfoldFor(m);
      }
    }
    if (marks.length) step(0, true);
    syncSearchUi();
    paintToc();
  }
  function step(delta, absolute = false) {
    if (!marks.length) return;
    if (cur >= 0) marks[cur].classList.remove('current');
    cur = absolute ? delta : (cur + delta + marks.length) % marks.length;
    marks[cur].classList.add('current');
    marks[cur].scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
    syncSearchUi();
  }
  function syncSearchUi() {
    const n = marks.length;
    $('#qcount').textContent = query ? (n ? `${cur + 1} / ${n}` : 'none') : '';
    $('#qprev').disabled = $('#qnext').disabled = n < 2;
  }

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  // ---------- wiring ----------
  function wire() {
    $('#toggleAll').addEventListener('click', () => {
      const anyOpen = bodySections().some(s => !s.classList.contains('folded'));
      bodySections().forEach(s => setFolded(s, anyOpen));
    });
    document.addEventListener('click', e => {
      const a = e.target.closest('a[data-go]');
      if (!a) return;
      e.preventDefault();
      hidePeek();
      document.dispatchEvent(new CustomEvent('spec:navigate', { detail: { from: a } }));
      go(a.dataset.go);
    });
    document.addEventListener('mouseover', e => { const a = e.target.closest('a.xref'); if (a) showPeek(a); });
    document.addEventListener('mouseout', e => { if (e.target.closest('a.xref')) hidePeek(); });
    document.addEventListener('focusin', e => { if (e.target.matches('a.xref')) showPeek(e.target); else hidePeek(); });
    addEventListener('scroll', () => { hidePeek(); spy(); }, { passive: true });

    const q = $('#q');
    let t;
    q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => runSearch(q.value), 180); });
    q.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(t);
        if (query !== q.value.trim()) runSearch(q.value);
        else step(e.shiftKey ? -1 : 1);
      }
      if (e.key === 'Escape') { q.value = ''; runSearch(''); q.blur(); }
    });
    $('#qnext').addEventListener('click', () => step(1));
    $('#qprev').addEventListener('click', () => step(-1));
    document.addEventListener('keydown', e => {
      if (e.key === '/' && !e.target.closest('input, textarea, select, [contenteditable]')) {
        e.preventDefault();
        q.focus();
        q.select();
      }
    });
    spy();
  }
  function openHash() {
    if (location.hash.length > 1) go(decodeURIComponent(location.hash.slice(1)), { behavior: 'auto' });
  }

  window.SpecPage = {
    $, $$, esc, slug, lead, plain, spec,
    sectionize, buildToc, tocTag, paintToc, linkify, go, toast, wire, openHash,
  };
})();
