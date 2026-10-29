(() => {
  'use strict';

  const COLLEGE = window.COLLEGE || {};
  const KEY = 'crb:v1';
  const $ = (s, el = document) => el.querySelector(s);

  /* ---------- data model ---------- */

  const BASICS = [
    { k: 'name', l: 'Full name', w: 'full', ph: 'As on your certificates' },
    { k: 'email', l: 'Email', ph: 'firstname.lastname@gmail.com' },
    { k: 'phone', l: 'Phone', ph: '+91 00000 00000' },
    { k: 'location', l: 'City, State', ph: 'City, State' }
  ];

  const SECTIONS = {
    summary: { title: 'Summary', kind: 'text', rows: 3,
      hint: 'Optional. Two or three lines at most. Skip it if you have nothing specific to say.' },
    education: { title: 'Education', kind: 'list', fields: [
      { k: 'school', l: 'Institution', w: 'full' },
      { k: 'degree', l: 'Degree and branch', w: 'full', list: 'dl-degrees' },
      { k: 'location', l: 'Location' },
      { k: 'score', l: 'CGPA / Percentage', ph: 'CGPA: 8.4/10' },
      { k: 'start', l: 'Start', ph: 'Aug 2022' },
      { k: 'end', l: 'End or expected', ph: 'May 2026' },
      { k: 'details', l: 'Relevant coursework (optional)', w: 'full', t: 'area', rows: 2 }
    ] },
    skills: { title: 'Skills', kind: 'list', hint: 'One row per group, for example Languages, Tools, Databases.', fields: [
      { k: 'label', l: 'Group', ph: 'Languages' },
      { k: 'items', l: 'Skills (comma separated)', ph: 'Python, Java, C, SQL' }
    ] },
    projects: { title: 'Projects', kind: 'list', hint: 'One bullet per line. Say what you built, with what, and the result.', fields: [
      { k: 'name', l: 'Project name' },
      { k: 'tech', l: 'Tech used', ph: 'React, Node.js, MongoDB' },
      { k: 'link', l: 'Link (optional)', ph: 'github.com/your-id/project' },
      { k: 'linkText', l: 'Link text (optional)', ph: 'GitHub, Live demo, Paper' },
      { k: 'date', l: 'Date (optional)', ph: 'Mar 2025' },
      { k: 'bullets', l: 'Bullets (one per line)', w: 'full', t: 'area', rows: 4 }
    ] },
    experience: { title: 'Internships and Experience', kind: 'list', fields: [
      { k: 'role', l: 'Role', ph: 'Software Intern' },
      { k: 'org', l: 'Company' },
      { k: 'location', l: 'Location' },
      { k: 'start', l: 'Start' },
      { k: 'end', l: 'End' },
      { k: 'bullets', l: 'Bullets (one per line)', w: 'full', t: 'area', rows: 4 }
    ] },
    leadership: { title: 'Leadership and Activities', kind: 'list', hint: 'Clubs, student chapters, events, volunteering, sports.', fields: [
      { k: 'role', l: 'Role', ph: 'Technical Lead' },
      { k: 'org', l: 'Club / organisation' },
      { k: 'location', l: 'Location' },
      { k: 'start', l: 'Start' },
      { k: 'end', l: 'End' },
      { k: 'bullets', l: 'Bullets (one per line)', w: 'full', t: 'area', rows: 3 }
    ] },
    certifications: { title: 'Certifications', kind: 'list', fields: [
      { k: 'name', l: 'Certification', w: 'full' },
      { k: 'issuer', l: 'Issued by' },
      { k: 'date', l: 'Date' }
    ] },
    achievements: { title: 'Achievements', kind: 'text', rows: 4,
      hint: 'One per line. Ranks, hackathons, scholarships, publications.' }
  };

  const DEFAULT_ORDER = ['summary', 'education', 'skills', 'projects', 'experience', 'certifications', 'achievements', 'leadership'];

  const blankItem = key => key === 'links' ? { label: '', url: '' } : Object.fromEntries(SECTIONS[key].fields.map(f => [f.k, '']));
  const title = (r, k) => ((r.settings.titles || {})[k] || '').trim() || SECTIONS[k].title;

  function blankResume(name) {
    const r = {
      id: 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: name || 'My resume',
      updated: Date.now(),
      settings: { template: 'classic', paper: 'A4', fontSize: 11, margin: 0.5, linkStyle: 'label', showLogo: true, titles: {}, order: DEFAULT_ORDER.slice() },
      basics: Object.fromEntries(BASICS.map(f => [f.k, ''])),
      links: [{ label: 'LinkedIn', url: '' }, { label: 'GitHub', url: '' }],
      summary: '', achievements: ''
    };
    for (const [k, s] of Object.entries(SECTIONS)) if (s.kind === 'list') r[k] = [blankItem(k)];
    r.education[0].school = COLLEGE.name || '';
    r.education[0].location = COLLEGE.location || '';
    r.skills = ['Languages', 'Frameworks and tools', 'Databases'].map(label => ({ label, items: '' }));
    return r;
  }

  // Fill gaps so older or imported data never breaks the editor.
  function normalise(r) {
    const base = blankResume(r.name);
    const out = { ...base, ...r, settings: { ...base.settings, ...(r.settings || {}) }, basics: { ...base.basics, ...(r.basics || {}) } };
    for (const [k, s] of Object.entries(SECTIONS)) {
      if (s.kind === 'list') out[k] = Array.isArray(r[k]) ? r[k].map(i => ({ ...blankItem(k), ...i })) : [blankItem(k)];
      else out[k] = typeof r[k] === 'string' ? r[k] : '';
    }
    if (Array.isArray(r.links)) out.links = r.links.map(l => ({ label: '', url: '', ...l }));
    else {
      const old = r.basics || {};
      out.links = [['LinkedIn', old.linkedin], ['GitHub', old.github], ['Portfolio', old.portfolio]]
        .filter(x => x[1]).map(x => ({ label: x[0], url: x[1] }));
      if (!out.links.length) out.links = base.links;
    }
    out.settings.titles = { ...(out.settings.titles || {}) };
    const order = (out.settings.order || []).filter(k => SECTIONS[k]);
    DEFAULT_ORDER.forEach(k => { if (!order.includes(k)) order.push(k); });
    out.settings.order = order;
    return out;
  }

  function sample() {
    const r = blankResume('Sample resume');
    r.basics = { name: 'Your Name', email: 'your.name@example.com', phone: '+91 00000 00000', location: 'City, State' };
    r.links = [{ label: 'LinkedIn', url: 'linkedin.com/in/your-id' }, { label: 'GitHub', url: 'github.com/your-id' }];
    r.education = [
      { school: COLLEGE.name || 'Your College Name', location: COLLEGE.location || 'City, State', degree: 'B.Tech in Computer Science and Engineering',
        score: 'CGPA: 8.6/10', start: 'Aug 2022', end: 'May 2026', details: 'Data Structures, Operating Systems, DBMS, Computer Networks, Machine Learning' },
      { school: 'Your Junior College', location: 'City, State', degree: 'Intermediate (MPC)', score: '97.2%', start: '2020', end: '2022', details: '' }
    ];
    r.skills = [
      { label: 'Languages', items: 'Python, Java, C, SQL, JavaScript' },
      { label: 'Frameworks and tools', items: 'React, Node.js, Flask, Git, Docker, Linux' },
      { label: 'Databases', items: 'MySQL, MongoDB' }
    ];
    r.projects = [
      { name: 'Campus Event Portal', tech: 'React, Node.js, MongoDB', link: 'github.com/your-id/project-one', date: '2025',
        bullets: 'Built a portal where 12 student clubs publish events and 1,800+ students register.\nAdded QR check-in, which cut manual attendance entry at the fest from about 40 minutes to under 5.\nDeployed on Render with role-based access for club admins.' },
      { name: 'Crop Disease Classifier', tech: 'Python, TensorFlow', link: '', date: '2024',
        bullets: 'Trained a CNN on 54,000 leaf images across 38 classes and reached 94% test accuracy.\nWrapped the model in a Flask API that returns a prediction in under 2 seconds.' }
    ];
    r.experience = [
      { role: 'Software Development Intern', org: 'Company Name', location: 'City', start: 'Jun 2025', end: 'Jul 2025',
        bullets: 'Fixed 18 front-end defects in the customer dashboard, reducing open UI tickets by a third.\nWrote 40 unit tests with Jest, raising coverage on the billing module from 52% to 78%.' }
    ];
    r.certifications = [
      { name: 'Cloud Fundamentals Certification', issuer: 'Issuing Body', date: '2024' },
      { name: 'Programming Course Certificate', issuer: 'Platform Name', date: '2023' }
    ];
    r.achievements = 'Finalist, inter-college hackathon, 2024.\nTop 5% in an online coding contest series, 2024.';
    r.leadership = [
      { role: 'Technical Lead', org: 'Coding Club', location: '', start: '2024', end: 'Present',
        bullets: 'Run weekly problem-solving sessions for about 60 first-year students.' }
    ];
    return r;
  }

  /* ---------- storage ---------- */

  const memory = {};
  let storageOk = true;
  const store = {
    get() { try { return localStorage.getItem(KEY); } catch (e) { storageOk = false; return memory[KEY] || null; } },
    set(v) { try { localStorage.setItem(KEY, v); return true; } catch (e) { storageOk = false; memory[KEY] = v; return false; } }
  };

  let db;
  function load() {
    try {
      const raw = JSON.parse(store.get());
      if (raw && raw.resumes && Object.keys(raw.resumes).length) {
        const resumes = {};
        for (const [id, r] of Object.entries(raw.resumes)) resumes[id] = normalise({ ...r, id });
        db = { current: resumes[raw.current] ? raw.current : Object.keys(resumes)[0], resumes, logo: raw.logo };
        return;
      }
    } catch (e) { /* first run or corrupt data: start fresh */ }
    const r = normalise({ ...sample(), name: 'My resume' });   // first visit: show placeholder content so the layout is visible
    db = { current: r.id, resumes: { [r.id]: r } };
  }
  const cur = () => db.resumes[db.current];

  let saveTimer;
  function scheduleSave() {
    setSaveStatus('Saving...');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 350);
  }
  function saveNow() {
    const ok = store.set(JSON.stringify(db));
    const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setSaveStatus(ok ? 'Saved in this browser, ' + t : 'Not saved: browser storage is blocked. Export a backup.');
  }
  function setSaveStatus(t) { $('#save-status').textContent = t; }
  window.addEventListener('pagehide', () => { if (saveTimer) saveNow(); });

  /* ---------- helpers ---------- */

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lines = t => String(t || '').split('\n').map(l => l.replace(/^\s*[-•*·]\s*/, '').trim()).filter(Boolean);
  const has = o => Object.values(o).some(v => String(v).trim());
  const range = (a, b) => [a, b].map(x => String(x || '').trim()).filter(Boolean).join(' – ');
  const wordCount = s => s.split(/\s+/).filter(Boolean).length;

  let linkStyle = 'label';
  function link(u, label) {
    u = String(u || '').trim();
    if (!u) return '';
    const href = /^(https?:|mailto:)/i.test(u) ? u : 'https://' + u;
    const shown = linkStyle === 'label' && label ? label : u.replace(/^https?:\/\//i, '').replace(/\/$/, '');
    return `<a href="${esc(href)}">${esc(shown)}</a>`;
  }
  const guessLabel = u => /github\.com/i.test(u) ? 'GitHub' : /(gitlab|bitbucket)\./i.test(u) ? 'Code' : 'Link';

  function getPath(o, p) { return p.split('.').reduce((a, k) => (a == null ? a : a[k]), o); }
  function setPath(o, p, v) {
    const ks = p.split('.');
    const last = ks.pop();
    const t = ks.reduce((a, k) => a[k], o);
    t[last] = v;
  }

  /* ---------- resume rendering ---------- */

  const row = (l, r) => `<div class="row"><span class="l">${l}</span>${r ? `<span class="r">${r}</span>` : ''}</div>`;
  const bullets = t => { const l = lines(t); return l.length ? `<ul>${l.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''; };

  const RENDER = {
    summary: r => r.summary.trim() ? `<p>${esc(r.summary.trim())}</p>` : '',
    education: r => r.education.filter(has).map(e =>
      `<div class="entry">${row(`<b>${esc(e.school)}</b>${e.location ? `, ${esc(e.location)}` : ''}`, `<b>${esc(range(e.start, e.end))}</b>`)}` +
      (e.degree || e.score ? row(`<i>${esc(e.degree)}</i>`, `<i>${esc(e.score)}</i>`).replace('class="row"', 'class="row sub"') : '') +
      (e.details.trim() ? `<p class="detail"><b>Coursework:</b> ${esc(e.details.trim())}</p>` : '') + '</div>').join(''),
    skills: r => {
      const l = r.skills.filter(s => s.items.trim());
      return l.length ? `<div class="skills">${l.map(s => `<p class="skill">${s.label.trim() ? `<b>${esc(s.label.trim())}:</b> ` : ''}${esc(s.items.trim())}</p>`).join('')}</div>` : '';
    },
    projects: r => r.projects.filter(has).map(p =>
      `<div class="entry">${row(`<b>${esc(p.name)}</b>${p.tech ? ` | <i>${esc(p.tech)}</i>` : ''}${p.link.trim() ? ' | ' + link(p.link, p.linkText.trim() || guessLabel(p.link)) : ''}`, esc(p.date)).replace('class="row"', 'class="row head"')}${bullets(p.bullets)}</div>`).join(''),
    experience: r => roles(r.experience),
    leadership: r => roles(r.leadership),
    certifications: r => {
      const l = r.certifications.filter(c => c.name.trim()).map(c => {
        const extra = [c.issuer.trim(), c.date.trim()].filter(Boolean).join(', ');
        return `<li>${esc(c.name.trim())}${extra ? ', ' + esc(extra) : ''}</li>`;
      });
      return l.length ? `<ul>${l.join('')}</ul>` : '';
    },
    achievements: r => bullets(r.achievements)
  };
  function roles(list) {
    return list.filter(has).map(e => {
      const left = [e.org && `<b>${esc(e.org)}</b>`, esc(e.role), e.location && `<i>${esc(e.location)}</i>`].filter(Boolean).join(' | ');
      return `<div class="entry">${row(left, esc(range(e.start, e.end))).replace('class="row"', 'class="row head"')}${bullets(e.bullets)}</div>`;
    }).join('');
  }

  function logoSrc() { return db.logo || COLLEGE.logo || ''; }

  function resumeHTML(r) {
    const b = r.basics;
    linkStyle = r.settings.linkStyle;
    const contact = [esc(b.location), esc(b.phone), b.email && `<a href="mailto:${esc(b.email)}">${esc(b.email)}</a>`,
      ...r.links.filter(l => l.url.trim()).map(l => link(l.url, l.label.trim()))].filter(Boolean).join('<span class="sep">|</span>');
    const logo = r.settings.showLogo && logoSrc();
    let h = `<header${logo ? ' class="has-logo"' : ''}>${logo ? `<img class="logo" src="${esc(logo)}" alt="College logo" onerror="this.remove()">` : ''}` +
      `<h1>${esc(b.name.trim()) || 'Your Name'}</h1>${contact ? `<p class="contact">${contact}</p>` : ''}</header>`;
    for (const key of r.settings.order) {
      const body = RENDER[key](r);
      if (body) h += `<section><h2>${esc(title(r, key))}</h2>${body}</section>`;
    }
    return h;
  }

  const PAPER = { A4: { w: 793.7, h: 1122.5 }, Letter: { w: 816, h: 1056 } };
  let pages = 1;

  function renderPreview() {
    const r = cur(), s = r.settings, el = $('#resume'), p = PAPER[s.paper] || PAPER.A4;
    el.className = 'page t-' + s.template;
    el.style.setProperty('--pw', p.w + 'px');
    el.style.setProperty('--ph', p.h + 'px');
    el.style.setProperty('--m', s.margin + 'in');
    el.style.setProperty('--fs', s.fontSize + 'pt');
    $('#pagestyle').textContent = `@page{size:${s.paper === 'Letter' ? 'letter' : 'A4'};margin:${s.margin}in}`;
    el.innerHTML = resumeHTML(r);
    fit();
  }

  // Scale the page to the pane and count pages.
  function fit() {
    const r = cur(), el = $('#resume'), holder = $('#page-holder'), wrap = $('#preview-wrap');
    const p = PAPER[r.settings.paper] || PAPER.A4;
    const m = r.settings.margin * 96;
    const avail = wrap.clientWidth - 50;
    const scale = avail > 0 ? Math.min(1, avail / p.w) : 1;
    const h = Math.max(p.h, el.scrollHeight);
    el.style.transform = scale < 1 ? `scale(${scale})` : 'none';
    holder.style.width = p.w * scale + 'px';
    holder.style.height = h * scale + 'px';
    pages = Math.max(1, Math.ceil((el.scrollHeight - 2 * m - 1) / (p.h - 2 * m)));
    const info = $('#page-info');
    info.textContent = pages + (pages === 1 ? ' page' : ' pages') + ' (' + r.settings.paper + ')';
    info.classList.toggle('warn', pages > 1);
    renderChecks();
  }

  /* ---------- resume check ---------- */

  function renderChecks() {
    const r = cur(), out = [];
    const add = (ok, good, bad) => out.push({ ok, text: ok ? good : bad });
    const allBullets = ['projects', 'experience', 'leadership'].flatMap(k => r[k].flatMap(i => lines(i.bullets)))
      .concat(lines(r.achievements));

    add(!!r.basics.name.trim(), 'Name added', 'Add your full name');
    add(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.basics.email.trim()), 'Email looks valid', 'Add a valid email address');
    add(r.basics.phone.replace(/\D/g, '').length >= 10, 'Phone number added', 'Add a phone number with at least 10 digits');
    add(r.education.some(e => e.school.trim() && e.degree.trim()), 'Education has institution and degree', 'Add your institution and degree');
    add(r.skills.some(s => s.items.trim()), 'Skills listed', 'List your skills so keyword scans can find them');
    add(!!(r.projects.some(p => lines(p.bullets).length) || r.experience.some(e => lines(e.bullets).length)),
      'Projects or experience described', 'Describe at least one project or internship with bullets');
    add(pages === 1, 'Fits on one page', `Runs to ${pages} pages. A fresher resume should be one page`);

    const long = allBullets.filter(b => wordCount(b) > 30).length;
    add(long === 0, 'Bullets are short enough', `${long} bullet${long > 1 ? 's are' : ' is'} over 30 words. Split or trim`);

    if (allBullets.length >= 3) {
      const withNum = allBullets.filter(b => /\d/.test(b)).length;
      add(withNum / allBullets.length >= 0.3, 'Bullets include numbers', 'Few bullets have numbers. Add sizes, counts, percentages or time saved');
    }
    add(wordCount(r.summary) <= 60, 'Summary length is fine', 'Summary is over 60 words. Shorten it');

    const bad = out.filter(c => !c.ok).length;
    $('#checks').innerHTML = out.map(c => `<li class="${c.ok ? 'ok' : 'bad'}"><span class="mk">${c.ok ? 'OK' : 'Fix'}</span><span>${esc(c.text)}</span></li>`).join('');
    const badge = $('#check-badge');
    badge.textContent = bad ? bad + ' to fix' : 'All clear';
    badge.classList.toggle('warn', bad > 0);
  }

  /* ---------- editor form ---------- */

  const openState = { basics: true, links: true, education: true };

  function field(path, f, val) {
    const common = `data-path="${path}" placeholder="${esc(f.ph || '')}"${f.list ? ` list="${f.list}"` : ''}`;
    const input = f.t === 'area'
      ? `<textarea ${common} rows="${f.rows || 3}">${esc(val)}</textarea>`
      : `<input type="text" ${common} value="${esc(val)}" autocomplete="off">`;
    return `<label class="f ${f.w || ''}"><span>${esc(f.l)}</span>${input}</label>`;
  }

  function entryHTML(key, i, list, fields, label) {
    return `<div class="entry"><div class="entry-h"><span>${esc(label || 'Entry ' + (i + 1))}</span><span class="tools">` +
      `<button data-act="move" data-key="${key}" data-i="${i}" data-dir="-1"${i === 0 ? ' disabled' : ''}>Up</button>` +
      `<button data-act="move" data-key="${key}" data-i="${i}" data-dir="1"${i === list.length - 1 ? ' disabled' : ''}>Down</button>` +
      `<button data-act="remove" data-key="${key}" data-i="${i}" class="danger">Remove</button></span></div><div class="grid">` +
      fields.map(f => field(`${key}.${i}.${f.k}`, f, list[i][f.k])).join('') + '</div></div>';
  }

  const LINK_FIELDS = [
    { k: 'label', l: 'Label shown', ph: 'LinkedIn' },
    { k: 'url', l: 'Web address', ph: 'linkedin.com/in/your-id' }
  ];

  function renderForm() {
    const r = cur();
    let h = `<details class="card" data-key="basics"${openState.basics ? ' open' : ''}><summary><span>Contact details</span></summary><div class="grid">` +
      BASICS.map(f => field('basics.' + f.k, f, r.basics[f.k])).join('') + '</div></details>';

    h += `<details class="card" data-key="links"${openState.links ? ' open' : ''}><summary><span>Links</span></summary>` +
      `<p class="hint">Add any links you want in the header: LinkedIn, GitHub, portfolio, Google Scholar, LeetCode, a published paper. Blank rows are ignored.</p>` +
      r.links.map((l, i) => entryHTML('links', i, r.links, LINK_FIELDS, l.label || l.url)).join('') +
      `<button class="add" data-act="add" data-key="links">Add link</button></details>`;

    r.settings.order.forEach((key, idx) => {
      const s = SECTIONS[key], t = title(r, key);
      h += `<details class="card" data-key="${key}"${openState[key] ? ' open' : ''}><summary><span data-title="${key}">${esc(t)}</span>` +
        `<span class="sec-tools"><button data-act="sec-move" data-key="${key}" data-dir="-1" aria-label="Move ${esc(t)} up"${idx === 0 ? ' disabled' : ''}>&#9650;</button>` +
        `<button data-act="sec-move" data-key="${key}" data-dir="1" aria-label="Move ${esc(t)} down"${idx === r.settings.order.length - 1 ? ' disabled' : ''}>&#9660;</button></span></summary>` +
        `<div class="grid ttl"><label class="f full"><span>Heading shown on resume</span>` +
        `<input type="text" data-path="settings.titles.${key}" placeholder="${esc(s.title)}" value="${esc((r.settings.titles || {})[key] || '')}" autocomplete="off"></label></div>`;
      if (s.hint) h += `<p class="hint">${esc(s.hint)}</p>`;
      if (s.kind === 'text') {
        h += `<div class="body"><label class="f"><span class="sr">${esc(t)}</span><textarea data-path="${key}" rows="${s.rows}">${esc(r[key])}</textarea></label></div>`;
      } else {
        r[key].forEach((item, i) => {
          const label = item[s.fields[0].k] || item[s.fields[1] && s.fields[1].k] || '';
          h += entryHTML(key, i, r[key], s.fields, label);
        });
        h += `<button class="add" data-act="add" data-key="${key}">Add entry</button>`;
      }
      h += '</details>';
    });
    $('#form').innerHTML = h;
  }

  function renderSettings() {
    const s = cur().settings;
    document.querySelectorAll('[data-path^="settings."]:not([data-path^="settings.titles"])').forEach(el => { const v = s[el.dataset.path.slice(9)]; if (el.type === 'checkbox') el.checked = !!v; else el.value = v; });
    $('#logo-state').textContent = logoSrc() ? '(logo added)' : '(no logo yet)';
    const bl = $('#brand-logo'), src = logoSrc();
    bl.hidden = !src;
    if (src && bl.getAttribute('src') !== src) bl.src = src;
    $('#out-fs').textContent = s.fontSize + ' pt';
    $('#out-m').textContent = s.margin + ' in';
  }

  function renderSelect() {
    const sel = $('#resume-select');
    sel.innerHTML = Object.values(db.resumes).sort((a, b) => b.updated - a.updated)
      .map(r => `<option value="${r.id}"${r.id === db.current ? ' selected' : ''}>${esc(r.name)}</option>`).join('');
  }

  function renderAll() {
    renderSelect(); renderSettings(); renderForm(); renderPreview();
  }

  /* ---------- events ---------- */

  let previewTimer;
  function touch() {
    cur().updated = Date.now();
    clearTimeout(previewTimer);
    previewTimer = setTimeout(renderPreview, 80);
    scheduleSave();
  }

  document.addEventListener('input', e => {
    const p = e.target.dataset && e.target.dataset.path;
    if (!p) return;
    let v = e.target.value;
    if (e.target.type === 'range') v = parseFloat(v);
    if (e.target.type === 'checkbox') v = e.target.checked;
    setPath(cur(), p, v);
    if (p.startsWith('settings.titles.')) {
      const k = p.slice(16), el = document.querySelector(`[data-title="${k}"]`);
      if (el) el.textContent = title(cur(), k);
    } else if (p.startsWith('settings.')) renderSettings();
    touch();
  });

  document.addEventListener('toggle', e => {
    const k = e.target.dataset && e.target.dataset.key;
    if (k) openState[k] = e.target.open;
  }, true);

  $('#resume-select').addEventListener('change', e => {
    db.current = e.target.value;
    scheduleSave();
    renderAll();
  });

  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const slug = s => (s || 'resume').trim().replace(/[^\w]+/g, '_').replace(/^_|_$/g, '') || 'resume';

  function toText(r) {
    const b = r.basics, L = [];
    L.push(b.name, [b.location, b.phone, b.email, ...r.links.filter(l => l.url.trim()).map(l => `${l.label ? l.label + ': ' : ''}${l.url}`)].filter(Boolean).join(' | '), '');
    for (const key of r.settings.order) {
      const block = [];
      if (key === 'summary' && r.summary.trim()) block.push(r.summary.trim());
      if (key === 'achievements') lines(r.achievements).forEach(x => block.push('- ' + x));
      if (key === 'skills') r.skills.filter(x => x.items.trim()).forEach(x => block.push(`${x.label}: ${x.items}`));
      if (key === 'education') r.education.filter(has).forEach(e => block.push(`${e.school}, ${e.location}`, `${e.degree} | ${e.score} | ${range(e.start, e.end)}`));
      if (key === 'certifications') r.certifications.filter(c => c.name.trim()).forEach(c => block.push('- ' + [c.name, c.issuer, c.date].filter(Boolean).join(', ')));
      if (key === 'projects') r.projects.filter(has).forEach(p => { block.push([p.name, p.tech, p.link, p.date].filter(Boolean).join(' | ')); lines(p.bullets).forEach(x => block.push('- ' + x)); });
      if (key === 'experience' || key === 'leadership') r[key].filter(has).forEach(e => { block.push(`${e.role} | ${range(e.start, e.end)}`, [e.org, e.location].filter(Boolean).join(', ')); lines(e.bullets).forEach(x => block.push('- ' + x)); });
      if (block.length) L.push(title(r, key).toUpperCase(), ...block, '');
    }
    return L.join('\n');
  }

  const ACTIONS = {
    new() {
      const name = prompt('Name for the new resume (for example: Internship, Core roles):', 'Resume ' + (Object.keys(db.resumes).length + 1));
      if (!name) return;
      const r = blankResume(name.trim());
      // carry over contact details so students do not retype them
      Object.assign(r.basics, cur().basics);
      r.links = JSON.parse(JSON.stringify(cur().links));
      db.resumes[r.id] = r; db.current = r.id;
      scheduleSave(); renderAll();
    },
    dup() {
      const r = normalise({ ...JSON.parse(JSON.stringify(cur())), id: undefined, name: cur().name + ' copy' });
      r.id = blankResume().id; r.updated = Date.now();
      db.resumes[r.id] = r; db.current = r.id;
      scheduleSave(); renderAll();
    },
    rename() {
      const name = prompt('Rename resume:', cur().name);
      if (!name || !name.trim()) return;
      cur().name = name.trim();
      scheduleSave(); renderSelect();
    },
    del() {
      if (!confirm(`Delete "${cur().name}"? This cannot be undone.`)) return;
      delete db.resumes[db.current];
      if (!Object.keys(db.resumes).length) { const r = blankResume('My resume'); db.resumes[r.id] = r; }
      db.current = Object.keys(db.resumes)[0];
      scheduleSave(); renderAll();
    },
    print() { window.print(); },
    tab(el) {
      document.body.dataset.view = el.dataset.tab;
      document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b === el));
      if (el.dataset.tab === 'preview') requestAnimationFrame(fit);
    },
    'logo-remove'() { delete db.logo; scheduleSave(); renderSettings(); renderPreview(); },
    'export-json'() { download(slug(cur().name) + '.json', JSON.stringify({ app: 'college-resume-builder', version: 1, resume: cur() }, null, 2), 'application/json'); },
    'export-txt'() { download(slug(cur().basics.name || cur().name) + '.txt', toText(cur()), 'text/plain'); },
    import() { $('#file-in').click(); },
    sample() {
      if (!confirm('Replace the content of this resume with sample content? Use Duplicate first if you want to keep it.')) return;
      const s = sample(), c = cur();
      s.id = c.id; s.name = c.name; s.settings = c.settings;
      db.resumes[c.id] = normalise(s);
      scheduleSave(); renderAll();
    },
    add(el) {
      const k = el.dataset.key;
      cur()[k].push(blankItem(k));
      openState[k] = true;
      renderForm(); scheduleSave();
      const items = document.querySelectorAll(`details[data-key="${k}"] .entry`);
      const last = items[items.length - 1];
      if (last) last.querySelector('input,textarea').focus();
    },
    remove(el) {
      const k = el.dataset.key, list = cur()[k];
      list.splice(+el.dataset.i, 1);
      if (!list.length) list.push(blankItem(k));
      renderForm(); touch();
    },
    move(el) {
      const list = cur()[el.dataset.key], i = +el.dataset.i, j = i + +el.dataset.dir;
      if (j < 0 || j >= list.length) return;
      [list[i], list[j]] = [list[j], list[i]];
      renderForm(); touch();
    },
    'sec-move'(el) {
      const o = cur().settings.order, i = o.indexOf(el.dataset.key), j = i + +el.dataset.dir;
      if (j < 0 || j >= o.length) return;
      [o[i], o[j]] = [o[j], o[i]];
      renderForm(); touch();
    }
  };

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    e.preventDefault();               // keep <summary> buttons from toggling the card
    const fn = ACTIONS[el.dataset.act];
    if (fn) fn(el);
  });

  $('#logo-in').addEventListener('change', e => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      // shrink so the saved logo stays small (max 300px on the long side)
      const k = Math.min(1, 300 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      db.logo = c.toDataURL('image/png');
      cur().settings.showLogo = true;
      scheduleSave(); renderSettings(); renderPreview();
    };
    img.onerror = () => alert('Could not read that image. Use a PNG, JPG or SVG file.');
    img.src = URL.createObjectURL(file);
  });

  $('#file-in').addEventListener('change', e => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const data = JSON.parse(rd.result);
        const src = data.resume || data;
        if (!src || typeof src !== 'object' || !src.basics) throw new Error('not a resume file');
        const r = normalise(src);
        r.id = blankResume().id; r.updated = Date.now();
        db.resumes[r.id] = r; db.current = r.id;
        scheduleSave(); renderAll();
      } catch (err) { alert('That file is not a valid resume backup.'); }
    };
    rd.readAsText(file);
  });

  // Nice PDF file name when saving from the print dialog.
  let oldTitle;
  window.addEventListener('beforeprint', () => { oldTitle = document.title; document.title = slug(cur().basics.name) + '_Resume'; });
  window.addEventListener('afterprint', () => { if (oldTitle) document.title = oldTitle; });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  if ('ResizeObserver' in window) new ResizeObserver(() => fit()).observe($('#preview-wrap'));
  else window.addEventListener('resize', fit);

  /* ---------- start ---------- */

  load();
  if (COLLEGE.accent) document.documentElement.style.setProperty('--accent', COLLEGE.accent);
  $('#college-name').textContent = COLLEGE.name && COLLEGE.name !== 'Your College Name' ? COLLEGE.name : '';
  $('#dl-degrees').innerHTML = (COLLEGE.degrees || []).map(d => `<option value="${esc(d)}">`).join('');
  renderAll();
  setSaveStatus(storageOk ? 'Saved in this browser' : 'Browser storage is blocked. Export a backup.');

  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
