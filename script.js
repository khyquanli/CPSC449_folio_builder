/* ===== NAVBAR INJECTION ===== */
fetch("navbar.html")
  .then(r => r.text())
  .then(html => { const host = document.getElementById("navbar"); if (host) host.innerHTML = html; })
  .catch(err => console.error("Error loading navbar:", err));

/* ===== OUR TEAM: REVEAL ON SCROLL ===== */
function revealOnScroll() {
  document.querySelectorAll('.hidden').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 100) el.classList.add('show');
  });
}
window.addEventListener('scroll', revealOnScroll);
window.addEventListener('load', revealOnScroll);

/* ===== PRICING: MONTHLY/YEARLY TOGGLE ===== */
document.querySelectorAll('.pb-toggle-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const cycle = btn.dataset.cycle; // 'monthly' or 'yearly'
    document.querySelectorAll('.pb-toggle-btn')
      .forEach(b => b.classList.toggle('is-active', b === btn));
    document.querySelectorAll('.pb-amount').forEach(el => {
      const value = el.getAttribute(`data-${cycle}`) || el.textContent;
      el.textContent = value;
    });
  });
});

/* =========================================================
   PORTFOLIO: templates + grid (localStorage stub)
   ========================================================= */
const FREE_LIMIT = 1;
const PF_KEY = 'fb_portfolios_v1';

const TEMPLATE_CATALOG = [
  {id:'tmpl-resume-a', name:'Resume • Serif'},
  {id:'tmpl-resume-b', name:'Resume • Swiss'},
  {id:'tmpl-resume-c', name:'Resume • Coral'},
  {id:'tmpl-proposal', name:'Project Proposal'},
  {id:'tmpl-letter',   name:'Letter'},
  {id:'tmpl-blank',    name:'Blank'}
];

function loadPortfolios(){
  try { return JSON.parse(localStorage.getItem(PF_KEY) || '[]'); }
  catch { return []; }
}
function savePortfolios(list){ localStorage.setItem(PF_KEY, JSON.stringify(list)); }

function newPortfolioName(existing){
  const base = 'My Portfolio';
  let n = 1;
  while (existing.some(p => p.name === (n===1?base:`${base} ${n}`))) n++;
  return n===1 ? base : `${base} ${n}`;
}

function randomBrandColor(){
  const colors = ['#0f62fe','#22a6b3','#8e44ad','#16a085','#e67e22','#e63946'];
  return colors[Math.floor(Math.random()*colors.length)];
}

/* Grab elements (only run UI if present) */
const elTmpl     = document.getElementById('tmplGallery');
const elGrid     = document.getElementById('pfGrid');
const elEmpty    = document.getElementById('pfEmpty');
const btnCreate  = document.getElementById('btnCreatePortfolio');
const btnUpgrade = document.getElementById('btnUpgrade');

if (elTmpl && elGrid) {
  function renderTemplates(){
    elTmpl.innerHTML = '';
    TEMPLATE_CATALOG.forEach((t, i) => {
      const card = document.createElement('div');
      card.className = 'pf-card';
      card.innerHTML = `
        <div class="pf-thumb">${i<5 ? 'Preview' : 'Blank'}</div>
        <div class="pf-meta">
          <div class="pf-title">${t.name}</div>
          <div class="pf-actions">
            <button class="pf-chip">Preview</button>
            <button class="pf-chip primary" data-use="${t.id}">Use</button>
          </div>
        </div>`;
      elTmpl.appendChild(card);
    });
  }
  function renderPortfolios(){
    const list = loadPortfolios();
    elGrid.innerHTML = '';
    if (elEmpty) elEmpty.style.display = list.length ? 'none' : '';

    list.forEach(p => {
      const card = document.createElement('div');
      card.className = 'pf-card';
      card.innerHTML = `
        <div class="pf-thumb" style="background:
          linear-gradient(135deg, ${p.color}20, ${p.color}08)">${p.preview || 'Preview'}</div>
        <div class="pf-meta">
          <div class="pf-title">${p.name}</div>
          <div class="pf-sub">Updated ${new Date(p.updated).toLocaleDateString()}</div>
          <div class="pf-actions">
            <button class="pf-chip">Edit</button>
            <button class="pf-chip">Publish</button>
          </div>
        </div>`;
      elGrid.appendChild(card);
    });

    const atLimit = list.length >= FREE_LIMIT;
    if (btnCreate) {
      btnCreate.disabled = atLimit;
      btnCreate.title = atLimit ? `Free plan allows ${FREE_LIMIT} portfolio` : '';
    }
    if (btnUpgrade) btnUpgrade.style.display = atLimit ? '' : 'none';
  }
  function createPortfolio(templateId){
    const list = loadPortfolios();
    if (list.length >= FREE_LIMIT) return;
    list.push({
      id: (crypto?.randomUUID?.() || String(Date.now())),
      name: newPortfolioName(list),
      template: templateId || 'tmpl-blank',
      preview: 'Preview',
      color: randomBrandColor(),
      updated: Date.now()
    });
    savePortfolios(list);
    renderPortfolios();
  }

  elTmpl.addEventListener('click', (e)=>{
    const use = e.target?.getAttribute?.('data-use');
    if (use) createPortfolio(use);
  });
  btnCreate?.addEventListener('click', () => createPortfolio('tmpl-blank'));
  btnUpgrade?.addEventListener('click', () => alert('Upgrade flow TBD'));

  renderTemplates();
  renderPortfolios();
}

/* =========================================================
   SIDEBAR: popover menus (.item.has-menu -> .menu-pop)
   ========================================================= */
const sidebarEl = document.getElementById('sidebar');

function closeAllMenus() {
  document.querySelectorAll('.menu-pop').forEach(m => (m.style.display = 'none'));
  document.querySelectorAll('.item.has-menu').forEach(i => i.setAttribute('aria-expanded', 'false'));
}

if (sidebarEl) {
  sidebarEl.addEventListener('click', (e) => {
    const item = e.target.closest('.item.has-menu');
    if (!item) return;

    e.preventDefault();
    e.stopPropagation();

    const id = item.getAttribute('data-menu');
    const menu = document.getElementById(id);
    if (!menu) return;

    const isOpen = menu.style.display === 'block';
    closeAllMenus();

    if (!isOpen) {
      const rect = item.getBoundingClientRect();
      menu.style.left = `${rect.right + 8}px`;
      menu.style.top  = `${rect.top}px`;
      menu.style.display = 'block';
      item.setAttribute('aria-expanded', 'true');
    }
  });
}
document.addEventListener('click', closeAllMenus);
window.addEventListener('hashchange', closeAllMenus);

/* Optional: clicking a popover row navigates */
document.querySelectorAll('.menu-pop .menu-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const route = btn.dataset.route;
    if (route) location.hash = route;
    closeAllMenus();
  });
});

/* =========================================================
   PANELS: single show/hide system for [data-panel]
   ========================================================= */
function panelsCloseAll(){ document.querySelectorAll('.panel').forEach(p => p.hidden = true); }
function panelOpen(id){
  const p = document.getElementById(id);
  if (!p) return;
  panelsCloseAll();
  p.hidden = false;
}
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-panel]');
  if (trigger) {
    e.preventDefault();
    panelOpen(trigger.getAttribute('data-panel'));
  }
});
document.addEventListener('click', (e) => {
  const insidePanel = e.target.closest('.panel');
  const isTrigger   = e.target.closest('[data-panel]');
  if (!insidePanel && !isTrigger) panelsCloseAll();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') panelsCloseAll(); });
