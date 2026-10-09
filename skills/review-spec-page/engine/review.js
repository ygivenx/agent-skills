/* Spec page review: Keep / Change / Question on every decision, assumption and gap, a
   checklist ticked per environment, and a drawer that exports it all as Markdown. Items are
   found by heading, not by number (see SECTIONS). State lives in this browser's localStorage. */
(() => {
  'use strict';
  const P = window.SpecPage;
  const { $, $$, esc, slug, lead } = P;
  const CFG = window.SPEC_CONFIG || {};
  const STORE = `spec-review-v1:${P.slug(document.title) || 'spec'}`;
  // Which sections hold which kind of item. Override any of these in SPEC_CONFIG.sections.
  const SECTIONS = {
    assumption: /assum/i,
    gap: /\b(gaps?|limitations?|risks?|open questions?|known issues?)\b/i,
    checklist: /before (enabling|launch|rollout)|checklist|pre-?launch|rollout/i,
    ...(CFG.sections || {}),
  };
  const ENVS = CFG.envs && CFG.envs.length ? CFG.envs : ['Done'];
  const VERDICTS = { keep: 'Keep', change: 'Change', ask: 'Question' };
  const KIND = { decision: 'Decision', assumption: 'Assumption', gap: 'Gap' };

  // ---------- targets ----------
  const items = [];
  const secNum = sec => (sec.id.match(/^s(\d+)$/) || [])[1];
  const sectionsFor = kind => P.$$('#spec > section:not(.intro)').filter(x => SECTIONS[kind].test(P.$('h2', x).dataset.title));
  const topList = (sec, tag) => P.$$(`:scope > ${tag}`, sec)[0];
  function collect() {
    // Decisions: any table whose first column holds ids like D1, R2 or ADR3.
    for (const table of P.$$('#spec table')) {
      const head = table.tHead && table.tHead.rows[0];
      const rows = [...table.tBodies[0].rows];
      if (!rows.length || !rows.every(r => /^[A-Z]{1,3}\d{1,3}$/.test(r.cells[0].textContent.trim()))) continue;
      if (head) head.insertAdjacentHTML('beforeend', '<th>Your call</th>');
      for (const tr of rows) {
        const ref = tr.cells[0].textContent.trim();
        tr.id = ref;
        items.push({ id: ref, kind: 'decision', ref, label: lead(tr.cells[1]), el: tr });
      }
    }
    for (const sec of sectionsFor('assumption')) {
      const list = topList(sec, 'ol') || topList(sec, 'ul');
      const n = secNum(sec) || slug(sec.id);
      [...(list ? list.children : [])].forEach((li, i) => {
        li.id = `a${n}-${i + 1}`;
        const ref = secNum(sec) ? `§${n}.${i + 1}` : `Assumption ${i + 1}`;
        items.push({ id: `${n}.${i + 1}`, kind: 'assumption', ref, label: lead(li), el: li });
      });
    }
    for (const sec of sectionsFor('gap')) {
      for (const li of (topList(sec, 'ul') || topList(sec, 'ol') || { children: [] }).children) {
        const label = lead(li);
        li.id = `gap-${slug(label)}`;
        items.push({ id: li.id, kind: 'gap', ref: 'Gap', label, el: li });
      }
    }
    for (const it of items) {
      it.sec = it.el.closest('#spec > section').id;
      it.el.dataset.ref = it.kind === 'gap' ? `Gap · ${it.label}` : `${it.ref} · ${it.label}`;
    }
  }

  function addControls() {
    for (const it of items) {
      const box = document.createElement('div');
      box.className = 'rv';
      const name = it.kind === 'gap' ? `gap: ${it.label}` : it.ref;
      box.innerHTML = `
        <div class="seg" role="group" aria-label="Your call on ${esc(name)}">
          <button type="button" data-v="keep" aria-pressed="false">✓ Keep</button>
          <button type="button" data-v="change" aria-pressed="false">✎ Change</button>
          <button type="button" data-v="ask" aria-pressed="false">? Question</button>
        </div>
        <button type="button" class="note-btn" aria-expanded="false">Add a note</button>
        <textarea hidden aria-label="Note on ${esc(name)}" placeholder="What should change, or what do you want to ask? Saved in this browser."></textarea>`;
      if (it.el.tagName === 'TR') it.el.insertCell().appendChild(box);
      else it.el.appendChild(box);
      it.el.classList.add('reviewable');
      it.box = box;
      box.addEventListener('click', e => {
        const v = e.target.closest('[data-v]');
        if (v) return setVerdict(it.id, v.dataset.v);
        if (e.target.closest('.note-btn')) {
          const ta = $('textarea', box);
          ta.hidden = !ta.hidden;
          paint(it);
          if (!ta.hidden) ta.focus();
        }
      });
      $('textarea', box).addEventListener('input', e => setNote(it.id, e.target.value));
    }
  }

  // ---------- state ----------
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE));
      if (s && typeof s === 'object') return { items: s.items || {}, checks: s.checks || {} };
    } catch { /* corrupt or blocked storage: start empty */ }
    return { items: {}, checks: {} };
  }
  let state = load();
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch { /* private mode: in-memory only */ }
  }
  const entry = id => state.items[id] || {};
  function setVerdict(id, v) {
    const e = { ...entry(id) };
    e.v = e.v === v ? undefined : v;
    store(id, e);
  }
  let noteTimer;
  function setNote(id, note) {
    store(id, { ...entry(id), note }, { quiet: true });
    clearTimeout(noteTimer);
    noteTimer = setTimeout(summarize, 250);
  }
  function store(id, e, { quiet = false } = {}) {
    if (!e.v && !(e.note || '').trim()) delete state.items[id];
    else state.items[id] = e;
    save();
    paint(items.find(i => i.id === id));
    if (!quiet) summarize();
  }
  function paint(it, { initial = false } = {}) {
    if (!it) return;
    const e = entry(it.id);
    it.el.dataset.verdict = e.v || '';
    $$('[data-v]', it.box).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === e.v)));
    const ta = $('textarea', it.box);
    const btn = $('.note-btn', it.box);
    if (document.activeElement !== ta) ta.value = e.note || '';
    if (initial) ta.hidden = !(e.note || '').trim();
    btn.setAttribute('aria-expanded', String(!ta.hidden));
    btn.textContent = ta.hidden ? ((e.note || '').trim() ? 'Show note' : 'Add a note') : 'Hide note';
  }

  function counts(list = items) {
    const c = { keep: 0, change: 0, ask: 0, open: 0 };
    for (const it of list) c[entry(it.id).v || 'open'] += 1;
    return c;
  }
  let drawerFilter = 'all';
  function summarize() {
    const c = counts();
    $('#reviewBadge').textContent = `${items.length - c.open}/${items.length}`;
    for (const sid of new Set(items.map(i => i.sec))) {
      const group = items.filter(i => i.sec === sid);
      const done = group.length - counts(group).open;
      const h = $(`#${sid} h2 .count`);
      if (h) h.textContent = `${done} of ${group.length} marked`;
      P.tocTag(sid, `${done}/${group.length}`, done === group.length);
    }
    $('#reviewStats').innerHTML = ['keep', 'change', 'ask', 'open'].map(k =>
      `<div class="stat ${k}"><b>${c[k]}</b>${k === 'open' ? 'Not reviewed' : VERDICTS[k]}</div>`).join('');
    const shown = items.filter(it => drawerFilter === 'all' || drawerFilter === (entry(it.id).v || 'open'));
    $('#reviewList').innerHTML = shown.map(it => {
      const e = entry(it.id);
      const v = e.v || 'open';
      const note = (e.note || '').trim();
      return `<li><span class="v ${v}">${v === 'open' ? '—' : VERDICTS[v]}</span>
        <span class="ref">${esc(KIND[it.kind])}${it.ref === 'Gap' ? '' : ` · ${esc(it.ref)}`}</span><br>
        <a href="#${esc(it.el.id)}" data-go="${esc(it.el.id)}">${esc(it.label)}</a>
        ${note ? `<div class="note">${esc(note)}</div>` : ''}</li>`;
    }).join('') || '<li class="muted">Nothing here.</li>';
    P.paintToc();
  }

  // ---------- checklist: the first ordered list under a rollout-style heading ----------
  const checklist = [];
  function addChecklist() {
    const sec = P.$$('#spec h2, #spec h3').find(h => SECTIONS.checklist.test(h.textContent));
    let ol = sec && sec.nextElementSibling;
    while (ol && !['OL', 'H2', 'H3'].includes(ol.tagName)) ol = ol.nextElementSibling;
    if (!ol || ol.tagName !== 'OL') return;
    const group = slug(sec.textContent);
    [...ol.children].forEach((li, i) => {
      const key = `${group}.${i + 1}`;
      checklist.push({ key, n: i + 1, label: lead(li) });
      const box = document.createElement('div');
      box.className = 'envchecks';
      box.innerHTML = `${ENVS.length > 1 ? 'Checked in: ' : ''}${ENVS.map(env => `<label><input type="checkbox" data-env="${env}">${env}</label>`).join('')}`;
      li.appendChild(box);
      box.addEventListener('change', e => {
        state.checks[key] = { ...(state.checks[key] || {}), [e.target.dataset.env]: e.target.checked };
        save();
      });
      paintChecks(box, key);
    });
    checklist.title = sec.textContent.replace(/^[\d.\s]+/, '').trim();
  }
  function paintChecks(box, key) {
    $$('input', box).forEach(inp => { inp.checked = !!(state.checks[key] || {})[inp.dataset.env]; });
  }

  // ---------- numbers an explorer can read ----------
  // An extras script fills P.defaults (name -> text) from the spec; num() reads one as a number
  // with a fallback, so explorers follow the spec when it changes.
  const defaults = {};
  function num(name, fallback) {
    const v = defaults[name];
    const n = Number(v);
    return v !== undefined && v !== '' && Number.isFinite(n) ? n : fallback;
  }

  // ---------- export ----------
  const today = () => new Date().toISOString().slice(0, 10);
  function exportMd() {
    const title = $('.brand .title').textContent.trim();
    const prov = $('.brand .prov').textContent.trim();
    const c = counts();
    const out = [`# Review: ${title}`, '', `_${prov} · reviewed ${today()}_`, '',
      `**${c.change} to change · ${c.ask} questions · ${c.keep} keep · ${c.open} not reviewed**`, ''];
    const name = it => (it.kind === 'gap' ? `Gap: ${it.label}` : `**${it.ref}** ${it.label}`);
    const quote = note => note.trim().split('\n').map(l => `  > ${l}`).join('\n');
    for (const [v, heading] of [['change', 'To change'], ['ask', 'Questions'], ['open', 'Not reviewed'], ['keep', 'Keep']]) {
      const group = items.filter(it => (entry(it.id).v || 'open') === v);
      if (!group.length) continue;
      out.push(`## ${heading}`, '');
      const bare = [];
      for (const it of group) {
        const note = (entry(it.id).note || '').trim();
        if ((v === 'keep' || v === 'open') && !note) { bare.push(it.kind === 'gap' ? `Gap: ${it.label}` : it.ref); continue; }
        out.push(`- ${name(it)}`);
        if (note) out.push(quote(note));
      }
      if (bare.length) out.push(`- ${bare.join('; ')}`);
      out.push('');
    }
    const ticked = checklist.some(ch => ENVS.some(env => (state.checks[ch.key] || {})[env]));
    if (ticked) {
      out.push(`## ${checklist.title || 'Checklist'}`, '');
      for (const ch of checklist) {
        const marks = ENVS.map(env => `${env} ${(state.checks[ch.key] || {})[env] ? '✓' : '–'}`).join(' · ');
        out.push(`- ${ch.n}. ${ch.label} (${marks})`);
      }
      out.push('');
    }
    return out.join('\n');
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch { /* fall back below */ }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }

  // ---------- drawer ----------
  const drawer = $('#review');
  let lastFocus = null;
  function openDrawer() {
    lastFocus = document.activeElement;
    drawer.hidden = false;
    $('#openReview').setAttribute('aria-expanded', 'true');
    $('#reviewTitle').setAttribute('tabindex', '-1');
    $('#reviewTitle').focus();
  }
  function closeDrawer() {
    drawer.hidden = true;
    $('#openReview').setAttribute('aria-expanded', 'false');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function wire() {
    $('#openReview').addEventListener('click', () => (drawer.hidden ? openDrawer() : closeDrawer()));
    $('#closeReview').addEventListener('click', closeDrawer);
    $('#copyReview').addEventListener('click', async () =>
      P.toast(await copy(exportMd()) ? 'Review copied as Markdown' : 'Copy failed: use Download'));
    $('#downloadReview').addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([exportMd()], { type: 'text/markdown' }));
      a.download = `${P.slug(document.title) || 'spec'}-review-${today()}.md`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    $('#resetReview').addEventListener('click', () => {
      if (!confirm('Clear every mark, note and checklist tick on this page?')) return;
      state = { items: {}, checks: {} };
      save();
      items.forEach(it => paint(it, { initial: true }));
      $$('.envchecks').forEach((box, i) => paintChecks(box, checklist[i].key));
      summarize();
      P.toast('Review cleared');
    });
    $$('.filter button').forEach(b => b.addEventListener('click', () => {
      drawerFilter = b.dataset.show;
      $$('.filter button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      summarize();
    }));
    document.addEventListener('click', e => {
      if (!e.target.closest('[data-action="open-review"]')) return;
      e.preventDefault();
      openDrawer();
    });
    // On a narrow screen the drawer covers the spec, so jumping to an item closes it.
    document.addEventListener('spec:navigate', e => {
      if (e.detail.from.closest('#review') && innerWidth < 1200) closeDrawer();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !drawer.hidden && !e.target.closest('input, textarea, select')) closeDrawer();
    });
  }

  /** Controls, checklist and saved state go on after linkify, so it never walks into them. */
  function mount() {
    addControls();
    addChecklist();
    items.forEach(it => paint(it, { initial: true }));
    $$('[data-count="assumptions"]').forEach(el => { el.textContent = items.filter(i => i.kind === 'assumption').length; });
    $$('[data-count="gaps"]').forEach(el => { el.textContent = items.filter(i => i.kind === 'gap').length; });
    $$('[data-default]').forEach(el => { if (defaults[el.dataset.default]) el.textContent = defaults[el.dataset.default]; });
  }

  P.defaults = defaults;
  P.num = num;
  P.review = { collect, mount, summarize, wire };
})();
