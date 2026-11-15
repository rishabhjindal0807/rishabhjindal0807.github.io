/* ------------------------------------------------------------------
   Contact email. Put your address between the quotes to show the
   email link, the "Copy email" button and the command-menu action.
   Leave it empty to use LinkedIn as the main contact.
------------------------------------------------------------------- */
const CONTACT_EMAIL = '';

(function () {
  'use strict';
  const doc = document.documentElement;
  const motion = () => doc.classList.contains('motion');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const fine = matchMedia('(pointer: fine)').matches;
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  if (!isMac) $$('kbd.mod').forEach(k => k.textContent = 'Ctrl');

  /* ---------- Contact wiring ---------- */
  if (CONTACT_EMAIL) {
    const big = $('#email-big'); big.textContent = CONTACT_EMAIL; big.href = 'mailto:' + CONTACT_EMAIL; big.hidden = false;
    $('#copy-email').hidden = false; $('#linkedin-btn').classList.remove('btn-primary'); $('#linkedin-btn').textContent = 'LinkedIn';
  }

  /* ---------- Split text ---------- */
  let ci = 0;
  $$('[data-split-chars]').forEach(line => {
    const txt = line.textContent; line.textContent = '';
    [...txt].forEach((c, idx) => {
      const s = document.createElement('span'); s.className = 'ch'; s.textContent = c;
      s.style.setProperty('--i', ci++); s.setAttribute('aria-hidden', 'true');
      if (line.hasAttribute('data-accent-last') && idx === txt.length - 1) s.classList.add('accent');
      line.appendChild(s);
    });
  });
  $$('[data-split-words]').forEach(h => {
    const label = h.textContent.trim(), words = label.split(/\s+/);
    h.setAttribute('aria-label', label); h.textContent = '';
    words.forEach((w, i) => {
      const m = document.createElement('span'); m.className = 'wm'; m.setAttribute('aria-hidden', 'true');
      const inner = document.createElement('span'); inner.className = 'wi'; inner.textContent = w; inner.style.setProperty('--i', i);
      m.appendChild(inner); h.appendChild(m); if (i < words.length - 1) h.appendChild(document.createTextNode(' '));
    });
  });
  $$('.role').forEach(r => $$('ul li', r).forEach((li, i) => li.style.setProperty('--i', i)));

  /* ---------- Answer: wrap words for streaming ---------- */
  const answer = $('#answer');
  (function wrapWords(node) {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !n.classList.contains('cite')) wrapWords(n);
    });
  })(answer);
  // Keep each citation marker on the same line as the word before it
  $$('.cite[data-c]', answer).forEach(c => {
    const claim = c.previousElementSibling; if (!claim || !claim.classList.contains('claim')) return;
    const ws = claim.querySelectorAll('.w'), last = ws[ws.length - 1]; if (!last) return;
    const nb = document.createElement('span'); nb.style.whiteSpace = 'nowrap'; last.replaceWith(nb); nb.append(last, c);
  });
  const streamEls = $$('.w, .cite', answer);
  const caret = document.createElement('span'); caret.className = 'caret'; caret.setAttribute('aria-hidden', 'true');
  let streamTimer = null, typeTimer = null;
  // Reserve the answer's final height so streaming never shifts the layout
  function lockHeight() { answer.style.minHeight = ''; answer.style.minHeight = answer.offsetHeight + 'px'; }

  function stream() {
    clearTimeout(streamTimer); clearTimeout(typeTimer); closePop(); caret.remove();
    const chat = $('#chat'), q = $('#question'), typed = $('.typed', q), full = typed.dataset.text;
    if (!motion()) { streamEls.forEach(e => e.classList.add('on')); typed.textContent = full; q.classList.add('done'); return; }
    lockHeight();
    chat.classList.add('streaming'); answer.classList.add('streaming'); q.classList.remove('done');
    streamEls.forEach(e => e.classList.remove('on'));
    typed.textContent = ''; let k = 0;
    (function type() {
      typed.textContent = full.slice(0, ++k);
      if (k < full.length) typeTimer = setTimeout(type, 26 + Math.random() * 38);
      else { q.classList.add('done'); typeTimer = setTimeout(() => { answer.prepend(caret); next(0); }, 450); }
    })();
    function next(i) {
      if (i >= streamEls.length) { caret.remove(); answer.classList.remove('streaming'); chat.classList.remove('streaming'); return; }
      const el = streamEls[i]; el.classList.add('on'); el.after(caret);
      const pause = el.classList.contains('cite') ? 170 : /[.,:]$/.test(el.textContent) ? 150 : 30 + Math.random() * 36;
      streamTimer = setTimeout(() => next(i + 1), pause);
    }
  }
  $('#replay').addEventListener('click', stream);

  /* ---------- Citation popover ---------- */
  const SOURCES = {
    1: { head: 'Team and platform', quote: 'Lead a team of 6 engineers that owns OptimaAI end to end, an AI-powered credit-underwriting platform.', from: 'Lead Software Engineer, Accumn, 2024 to now', target: 'ev-1' },
    2: { head: 'Lenders in production', quote: 'Live with 10 lenders across India and MENA, running in separate India and UAE environments.', from: 'Lead Software Engineer, Accumn, 2024 to now', target: 'ev-7' },
    3: { head: 'Years of experience', quote: 'First role: System Engineer at Tata Consultancy Services from September 2017, followed by Publicis Sapient, Yubi and Accumn.', from: 'System Engineer, TCS, 2017 to 2019', target: 'ev-tcs' },
    4: { head: 'Full-stack ownership', quote: 'Async PostgreSQL, SQLAlchemy 2.0, Redis and Qdrant; React 18 + TypeScript modules; Kubernetes, Helm and Argo CD at 99.9%+ uptime.', from: 'Lead Software Engineer, Accumn, 2024 to now', target: 'ev-6' },
    5: { head: 'Traceable AI answers', quote: 'MCP tools return cited data, LLM output is limited to citation markers, and the UI links each marker to a source panel.', from: 'Lead Software Engineer, Accumn, 2024 to now', target: 'ev-4' }
  };
  const pop = $('#pop'); let openCite = null;
  function placePop(btn) {
    const r = btn.getBoundingClientRect(), w = pop.offsetWidth;
    const left = Math.max(12, Math.min(r.left + r.width / 2 - w / 2, innerWidth - w - 12));
    pop.style.left = (left + scrollX) + 'px'; pop.style.top = (r.bottom + scrollY + 10) + 'px';
  }
  function openPop(btn) {
    const id = btn.dataset.c, s = SOURCES[id];
    $('#pop-num').textContent = id; $('#pop-head').textContent = s.head; $('#pop-quote').textContent = s.quote; $('#pop-from').textContent = s.from;
    $('#pop-jump').dataset.target = s.target;
    $$('.cite[data-c]', answer).forEach(c => c.setAttribute('aria-expanded', String(c === btn)));
    $$('.claim', answer).forEach(c => c.classList.toggle('on', c.dataset.c === id));
    placePop(btn); pop.classList.add('open'); openCite = btn;
  }
  function closePop() {
    if (!pop.classList.contains('open') && !openCite) return;
    pop.classList.remove('open'); openCite = null;
    $$('.cite[data-c]', answer).forEach(c => c.setAttribute('aria-expanded', 'false'));
    $$('.claim', answer).forEach(c => c.classList.remove('on'));
  }
  $$('.cite[data-c]', answer).forEach(b => b.addEventListener('click', e => { e.stopPropagation(); openCite === b ? closePop() : openPop(b); }));
  document.addEventListener('click', e => { if (openCite && !pop.contains(e.target)) closePop(); });
  addEventListener('resize', () => { if (openCite) placePop(openCite); });
  $('#pop-jump').addEventListener('click', e => {
    const el = document.getElementById(e.currentTarget.dataset.target); closePop();
    if (!el) return;
    el.scrollIntoView({ behavior: motion() ? 'smooth' : 'auto', block: 'center' });
    el.classList.remove('flag'); void el.offsetWidth; el.classList.add('flag');
    el.setAttribute('tabindex', '-1'); setTimeout(() => el.focus({ preventScroll: true }), 700);
  });

  /* ---------- Night-sky background: stars drawn toward the pointer ---------- */
  const field = $('#field'), ctx = field.getContext('2d'), aur = $$('.aurora i'), par = $$('.parallax');
  const P = { x: -999, y: -999, tx: -999, ty: -999, ax: innerWidth * .7, ay: innerHeight * .35, active: false };
  const R = 210;                         // pull radius in px
  let W = 0, H = 0, dpr = 1, stars = [], colors = {}, t0 = performance.now();
  const rgb = h => { h = h.trim().replace('#', ''); if (h.length === 3) h = [...h].map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); };
  function readColors() {
    const cs = getComputedStyle(doc);
    const dark = doc.dataset.theme === 'dark';
    colors = { star: rgb(cs.getPropertyValue(dark ? '--text' : '--muted')), acc: rgb(cs.getPropertyValue('--accent')), dark };
  }
  function size() {
    dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
    field.width = W * dpr; field.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(950, W * H / (colors.dark ? 2100 : 2900)));
    stars = [];
    for (let i = 0; i < n; i++) {
      const z = Math.random();             // 0 = far away, 1 = close
      stars.push({ x: Math.random() * W, y: Math.random() * H, z, r: .35 + Math.pow(z, 2.4) * 1.55,
        a: .22 + Math.random() * .6, ph: Math.random() * 6.283, sp: .5 + Math.random() * 1.8, ox: 0, oy: 0 });
    }
    draw();
  }
  function draw(now = performance.now()) {
    const live = motion(), t = (now - t0) / 1000, sy = live ? scrollY : 0;
    const [sr, sg, sb] = colors.star, [ar, ag, ab] = colors.acc, k = colors.dark ? 1 : .42;
    ctx.clearRect(0, 0, W, H);
    const near = [];
    for (const s of stars) {
      const bx = live ? ((s.x + t * (1.5 + s.z * 5)) % (W + 20) + W + 20) % (W + 20) - 10 : s.x;
      const by = ((s.y - sy * (.03 + s.z * .16)) % H + H) % H;
      let tx = 0, ty = 0, f = 0;
      if (P.active && live) {
        const dx = P.x - bx, dy = P.y - by, d = Math.hypot(dx, dy);
        if (d < R) { f = 1 - d / R; const pull = f * f * .45; tx = dx * pull; ty = dy * pull; }
      }
      s.ox += (tx - s.ox) * .085; s.oy += (ty - s.oy) * .085;
      const x = bx + s.ox, y = by + s.oy;
      const tw = live ? .62 + .38 * Math.sin(t * s.sp + s.ph) : 1;
      const al = Math.min(1, s.a * tw + f * .7) * k, r = s.r * (1 + f * 1.1);
      ctx.fillStyle = f > .02 ? `rgba(${ar},${ag},${ab},${al.toFixed(3)})` : `rgba(${sr},${sg},${sb},${al.toFixed(3)})`;
      if (r < .9) ctx.fillRect(x - r, y - r, r * 2, r * 2); else { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); }
      if (s.z > .94 && colors.dark && f < .02) { ctx.fillStyle = `rgba(${sr},${sg},${sb},${(al * .1).toFixed(3)})`; ctx.beginPath(); ctx.arc(x, y, r * 3.2, 0, 6.283); ctx.fill(); }
      if (f > .3) near.push([x, y, f]);
    }
    if (near.length > 1) {                 // constellation: link each gathered star to its nearest neighbours
      near.sort((m, n) => n[2] - m[2]);
      const g = near.slice(0, 16), seen = new Set(); ctx.lineWidth = .8;
      g.forEach((p, i) => {
        g.map((q, j) => [j, Math.hypot(p[0] - q[0], p[1] - q[1])]).filter(([j]) => j !== i)
          .sort((m, n) => m[1] - n[1]).slice(0, 2).forEach(([j, d]) => {
            const key = i < j ? i + '-' + j : j + '-' + i; if (seen.has(key) || d > 120) return; seen.add(key);
            const q = g[j], a = Math.min(p[2], q[2]) - .3;
            ctx.strokeStyle = `rgba(${ar},${ag},${ab},${(a * (colors.dark ? .9 : .7)).toFixed(3)})`;
            ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
          });
      });
    }
  }
  function loop(now) {
    P.x += (P.tx - P.x) * .25; P.y += (P.ty - P.y) * .25;
    if (P.active) { P.ax += (P.tx - P.ax) * .04; P.ay += (P.ty - P.ay) * .04; }
    const nx = P.ax / W - .5, ny = P.ay / H - .5;
    if (aur[0]) aur[0].style.transform = `translate3d(${W * .5 + nx * W * .5}px, ${H * .4 + ny * H * .45}px, 0)`;
    if (aur[1]) aur[1].style.transform = `translate3d(${W * .5 - nx * W * .35}px, ${H * .65 - ny * H * .3}px, 0)`;
    par.forEach(el => { const d = +el.dataset.depth; el.style.transform = `translate3d(${nx * d}px, ${ny * d}px, 0)`; });
    draw(now);
    requestAnimationFrame(loop);
  }
  readColors(); size();
  addEventListener('resize', size);
  if (fine) {
    addEventListener('pointermove', e => { if (!P.active) { P.x = e.clientX; P.y = e.clientY; } P.tx = e.clientX; P.ty = e.clientY; P.active = true; }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => { P.active = false; });
  }
  if (motion()) requestAnimationFrame(loop);
  else { addEventListener('scroll', () => draw(), { passive: true }); }

  /* ---------- Card spotlight edges ---------- */
  if (fine) $$('.spot').forEach(el => el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect(); el.style.setProperty('--x', (e.clientX - r.left) + 'px'); el.style.setProperty('--y', (e.clientY - r.top) + 'px');
  }));

  /* ---------- Magnetic buttons ---------- */
  if (fine && motion()) {
    $$('.magnet').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .2}px, ${(e.clientY - r.top - r.height / 2) * .3}px)`;
      });
      b.addEventListener('pointerleave', () => b.style.transform = '');
    });
  }

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add('in'); io.unobserve(en.target);
    if (en.target.matches('.numbers li')) countUp($('.num', en.target));
  }), { rootMargin: '0px 0px -10% 0px', threshold: .08 });
  $$('[data-reveal], .h2, .role, #arch').forEach(el => io.observe(el));

  function countUp(el) {
    const to = parseFloat(el.dataset.to), dec = +(el.dataset.dec || 0), suf = el.dataset.suffix || '';
    if (!motion()) { el.textContent = to.toFixed(dec) + suf; return; }
    const t0 = performance.now(), dur = 1800;
    (function tick(t) {
      const p = Math.min(1, Math.max(0, (t - t0) / dur)), e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      el.textContent = (to * e).toFixed(dec) + suf;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* ---------- Architecture ---------- */
  $$('#arch .wire').forEach(p => { let len = 600; try { len = Math.ceil(p.getTotalLength()) + 2; } catch (e) {} p.style.setProperty('--len', len); });
  const svg = $('#arch svg'), archScroll = $('.arch-scroll');
  new IntersectionObserver((en, ob) => { if (!en[0].isIntersecting) return; ob.disconnect();
    if (archScroll.scrollWidth > archScroll.clientWidth + 10 && motion()) {
      setTimeout(() => archScroll.scrollTo({ left: 140, behavior: 'smooth' }), 1400);
      setTimeout(() => archScroll.scrollTo({ left: 0, behavior: 'smooth' }), 2400);
    } }, { threshold: .5 }).observe(archScroll);
  if (!motion() && svg.pauseAnimations) svg.pauseAnimations();
  const NODES = {
    ui: { k: 'Where credit teams work', h: 'Workspace', p: 'React 18 + TypeScript modules for company search, AI chat, tool configuration, analytics dashboards and PDF export. Every citation marker opens the source it came from.', t: ['React 18', 'TypeScript', 'Zustand', 'Recharts'] },
    api: { k: 'The front door', h: 'FastAPI services', p: 'Async Python 3.13 services with OAuth/JWT and hierarchical role-based access across lender, division and branch scopes, for six personas from Relationship Manager to Chief Risk Officer.', t: ['Python 3.13', 'FastAPI', 'OAuth/JWT', 'RBAC'] },
    agents: { k: 'The reasoning layer', h: 'Claude agents', p: 'Conversations route to company and retail agents through mcp-agent. A dedicated editing agent drafts and refines Credit Assessment Memos with per-turn versioning, audit history and rollback.', t: ['Claude SDK', 'mcp-agent', 'CAM generation'] },
    mcp: { k: 'Why MCP', h: '5 MCP servers, 30+ tools', p: 'Calculator, company, retail, legacy and MENA servers give every agent one standard tool interface. New tools or regions plug in without touching agent code.', t: ['Model Context Protocol', 'FastAPI', 'Monorepo'] },
    data: { k: 'State and search', h: 'Data layer', p: 'PostgreSQL through async SQLAlchemy 2.0 and asyncpg, alongside Redis and Qdrant for vector search.', t: ['PostgreSQL', 'SQLAlchemy 2.0', 'Redis', 'Qdrant'] },
    temporal: { k: 'Why Temporal', h: 'Durable workflows', p: 'Long-running taskbook execution, RFP orchestration and operations automation. Durable state and automatic retries mean 100+ concurrent jobs survive failures without anyone stepping in.', t: ['Temporal', '100+ concurrent', 'Automatic retries'] },
    infra: { k: 'How it ships', h: 'Weekly releases, 99.9%+ uptime', p: 'Docker multi-stage builds, Kubernetes with Helm, Argo CD GitOps and Jenkins pipelines, with separate India and UAE environments.', t: ['Kubernetes', 'Helm', 'Argo CD', 'Jenkins'] }
  };
  const detail = $('#detail');
  function showNode(key) {
    const n = NODES[key]; if (!n) return;
    $$('#arch .node').forEach(g => g.classList.toggle('active', g.dataset.node === key));
    detail.classList.add('swap');
    setTimeout(() => {
      detail.innerHTML = `<p class="detail-kicker">${n.k}</p><h3>${n.h}</h3><p>${n.p}</p><div class="tags">${n.t.map(x => `<span>${x}</span>`).join('')}</div>`;
      detail.classList.remove('swap');
    }, motion() ? 180 : 0);
  }
  $$('#arch [data-node]').forEach(g => {
    g.addEventListener('click', () => showNode(g.dataset.node));
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showNode(g.dataset.node); } });
  });

  /* ---------- Experience timeline ---------- */
  const tl = $('#timeline');
  const track = document.createElement('span'); track.className = 'track'; track.setAttribute('aria-hidden', 'true');
  const fill = document.createElement('span'); fill.className = 'fill'; fill.setAttribute('aria-hidden', 'true');
  tl.parentNode.style.position = 'relative'; tl.prepend(fill); tl.prepend(track);
  const roles = $$('.role'), yr = $('#yr'), dots = $$('#stick-dots i');
  let activeRole = 0;
  function setRole(i) {
    if (i === activeRole) return;
    const dir = i > activeRole ? 1 : -1; activeRole = i;
    const r = roles[i]; $$('span', yr).forEach((s, k, a) => { if (k < a.length - 1) s.remove(); });
    const old = $('span', yr), nu = document.createElement('span');
    nu.textContent = r.dataset.year; yr.appendChild(nu);
    $('#stick-org').textContent = r.dataset.org; $('#stick-range').textContent = r.dataset.range;
    dots.forEach((d, k) => d.classList.toggle('on', k === i));
    if (motion() && old) {
      const o = { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' };
      old.animate([{ transform: 'none', opacity: 1 }, { transform: `translateY(${-70 * dir}%)`, opacity: 0 }], o).onfinish = () => old.remove();
      nu.animate([{ transform: `translateY(${70 * dir}%)`, opacity: 0 }, { transform: 'none', opacity: 1 }], o);
    } else if (old) old.remove();
  }

  /* ---------- Scroll loop ---------- */
  const bar = $('.progress'), head = $('#masthead'), navLinks = $$('.nav a.link');
  const secs = navLinks.map(a => document.querySelector(a.getAttribute('href')));
  let lastY = scrollY, ticking = false;
  function onScroll() {
    ticking = false;
    const y = scrollY, h = doc.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    head.classList.toggle('scrolled', y > 10);
    if (Math.abs(y - lastY) > 4) { const hid = y > lastY && y > 700; head.classList.toggle('hide', hid); doc.classList.toggle('nav-hidden', hid); lastY = y; }
    const tr = tl.getBoundingClientRect(), mid = innerHeight * .55;
    fill.style.transform = `scaleY(${Math.max(0, Math.min(1, (mid - tr.top) / tr.height))})`;
    let idx = 0;
    roles.forEach((r, i) => { const top = r.getBoundingClientRect().top; r.classList.toggle('lit', top < mid); if (top < mid) idx = i; });
    setRole(idx);
    let cur = -1; secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * .4) cur = i; });
    navLinks.forEach((a, i) => a.classList.toggle('current', i === cur));
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  /* ---------- Tabs ---------- */
  const tabs = $$('.tab'), ind = $('#tab-ind');
  function placeInd(t) { if (!t) return; ind.style.left = t.offsetLeft + 'px'; ind.style.width = t.offsetWidth + 'px'; ind.style.top = t.offsetTop + 'px'; ind.style.height = t.offsetHeight + 'px'; }
  function selectTab(t, focus) {
    tabs.forEach(x => {
      const on = x === t, p = document.getElementById(x.getAttribute('aria-controls'));
      x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; p.hidden = !on; p.classList.remove('show');
    });
    const panel = document.getElementById(t.getAttribute('aria-controls'));
    $$('.chips li', panel).forEach((li, i) => li.style.setProperty('--i', i));
    void panel.offsetWidth; panel.classList.add('show');
    placeInd(t); if (focus) t.focus();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); selectTab(tabs[(i + d + tabs.length) % tabs.length], true); }
    });
  });
  $$('.chips li', $('#p-ai')).forEach((li, i) => li.style.setProperty('--i', i));
  addEventListener('resize', () => placeInd($('.tab[aria-selected="true"]')));

  /* ---------- Toast + copy ---------- */
  const toast = $('#toast'); let toastT;
  function say(msg) { $('#toast-text').textContent = msg; toast.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('show'), 2200); }
  async function copyEmail() {
    if (!CONTACT_EMAIL) return;
    try { await navigator.clipboard.writeText(CONTACT_EMAIL); say('Email copied'); }
    catch (e) { location.href = 'mailto:' + CONTACT_EMAIL; }
  }
  $('#copy-email').addEventListener('click', copyEmail);

  /* ---------- Theme ---------- */
  function applyTheme(t) {
    doc.dataset.theme = t; try { localStorage.setItem('rj-theme', t); } catch (e) {}
    $('meta[name="theme-color"]').setAttribute('content', t === 'dark' ? '#0D1526' : '#EEF1F0');
    readColors(); size();
  }
  function toggleTheme(e) {
    const next = doc.dataset.theme === 'dark' ? 'light' : 'dark';
    if (!document.startViewTransition || !motion()) { applyTheme(next); return; }
    const x = e && e.clientX ? e.clientX : innerWidth - 40, y = e && e.clientY ? e.clientY : 30;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const vt = document.startViewTransition(() => applyTheme(next));
    vt.ready.then(() => doc.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 750, easing: 'cubic-bezier(.65,0,.35,1)', pseudoElement: '::view-transition-new(root)' })).catch(() => {});
  }
  $('#theme-btn').addEventListener('click', toggleTheme);

  /* ---------- Command palette ---------- */
  const pal = $('#palette'), palQ = $('#pal-q'), palList = $('#pal-list'), palEmpty = $('#pal-empty');
  const go = sel => () => document.querySelector(sel).scrollIntoView({ behavior: motion() ? 'smooth' : 'auto' });
  const CMDS = [
    { label: 'Go to the top', hint: 'Section', run: go('#top') },
    { label: 'Inside OptimaAI', hint: 'Section', run: go('#platform') },
    { label: 'Experience', hint: 'Section', run: go('#experience') },
    { label: 'Skills', hint: 'Section', run: go('#skills') },
    { label: 'Contact', hint: 'Section', run: go('#contact') },
    CONTACT_EMAIL && { label: 'Copy email address', hint: 'Action', run: copyEmail },
    { label: 'Download resume (PDF)', hint: 'Action', run: () => { const a = document.createElement('a'); a.href = 'Rishabh-Jindal-Lead-Software-Engineer.pdf'; a.download = 'Rishabh-Jindal-Lead-Software-Engineer.pdf'; document.body.appendChild(a); a.click(); a.remove(); } },
    { label: 'Open LinkedIn', hint: 'Link', run: () => window.open('https://www.linkedin.com/in/rishabh-jindal-34132362/', '_blank', 'noopener') },
    { label: 'Switch to light or dark mode', hint: 'Action', run: () => toggleTheme() },
    { label: 'Replay the answer', hint: 'Action', run: () => { go('#top')(); setTimeout(stream, 600); } }
  ].filter(Boolean);
  let palItems = [], palSel = 0;
  function renderPal() {
    const q = palQ.value.trim().toLowerCase();
    palItems = CMDS.filter(c => c.label.toLowerCase().includes(q));
    palSel = Math.min(palSel, Math.max(0, palItems.length - 1));
    palList.innerHTML = palItems.map((c, i) => `<li role="option" id="pal-${i}" aria-selected="${i === palSel}">${c.label}<small>${c.hint}</small></li>`).join('');
    palEmpty.hidden = palItems.length > 0;
    if (palItems.length) palQ.setAttribute('aria-activedescendant', 'pal-' + palSel); else palQ.removeAttribute('aria-activedescendant');
  }
  function openPal() { if (pal.open) return; closePop(); palQ.value = ''; palSel = 0; renderPal(); pal.showModal(); palQ.focus(); }
  function runPal(i) { const c = palItems[i]; if (!c) return; pal.close(); setTimeout(c.run, 60); }
  function movePal(d) { if (!palItems.length) return; palSel = (palSel + d + palItems.length) % palItems.length; renderPal(); const el = document.getElementById('pal-' + palSel); if (el) el.scrollIntoView({ block: 'nearest' }); }
  $('#open-palette').addEventListener('click', openPal);
  palQ.addEventListener('input', () => { palSel = 0; renderPal(); });
  palQ.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); movePal(1); }
    if (e.key === 'ArrowUp') { e.preventDefault(); movePal(-1); }
    if (e.key === 'Enter') { e.preventDefault(); runPal(palSel); }
  });
  palList.addEventListener('click', e => { const li = e.target.closest('li'); if (li) runPal(+li.id.split('-')[1]); });
  pal.addEventListener('click', e => { if (e.target === pal) pal.close(); });
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); pal.open ? pal.close() : openPal(); }
    if (e.key === 'Escape' && openCite) closePop();
  });

  /* ---------- Start ---------- */
  function start() {
    requestAnimationFrame(() => {
      doc.classList.add('ready');
      placeInd($('.tab[aria-selected="true"]'));
      onScroll();
      if (motion()) setTimeout(stream, 1100); else stream();
    });
  }
  const fontsReady = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1200))]) : Promise.resolve();
  fontsReady.then(start);
})();
