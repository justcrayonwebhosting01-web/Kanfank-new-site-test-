/* ============================================================
   KEYFANK — script.js
   Systems:
     1. Product data (sample catalog, easy to extend)
     2. Collection / product-detail rendering
     3. Cart (drawer, quantities, persistence)
     4. Checkout (front-end architecture, payment marked below)
     5. Three.js scroll story — realistic keyboard (beveled
        keycaps, aluminium case, env reflections, shadows):
        blank case → key assembly → macro focus → stickers → reveal
   ============================================================ */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* ---------------- helpers ---------------- */
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const money = n => '$' + n.toFixed(2);
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE_POINTER = window.matchMedia('(pointer: fine)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smoothstep = (t, a, b) => { const x = clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
const easeOutCubic = p => 1 - Math.pow(1 - p, 3);
/* deterministic pseudo-random so every visit assembles identically */
const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/* ============================================================
   1. PRODUCT DATA — edit / add products here
   ============================================================ */
const PRODUCTS = [
  {
    id: 'aurora-flow', name: 'Aurora Flow', price: 24, category: 'Gradient Series', featured: true,
    stock: 'in', compatibility: ['60%', '65%', '75%', 'TKL', 'Full-size'],
    desc: 'A slow-pour gradient from polar cyan into violet dusk. Designed as one continuous composition across every key.',
    variants: [
      { id: 'dawn',  name: 'Dawn',  g1: '#67e8f9', g2: '#a78bfa' },
      { id: 'dusk',  name: 'Dusk',  g1: '#f0abfc', g2: '#818cf8' },
      { id: 'frost', name: 'Frost', g1: '#bae6fd', g2: '#5eead4' },
    ],
    details: ['Matte soft-touch laminate', 'Includes space-bar accent', 'Full-layout template'],
  },
  {
    id: 'sunset-punch', name: 'Sunset Punch', price: 24, category: 'Gradient Series', featured: false,
    stock: 'in', compatibility: ['60%', '65%', '75%', 'TKL', 'Full-size'],
    desc: 'Warm ember orange bleeding into hot pink. The loudest quiet upgrade your desk will ever get.',
    variants: [
      { id: 'ember', name: 'Ember', g1: '#fb923c', g2: '#f472b6' },
      { id: 'peach', name: 'Peach', g1: '#fdba74', g2: '#fb7185' },
      { id: 'coral', name: 'Coral', g1: '#f97316', g2: '#e11d48' },
    ],
    details: ['Gloss-resistant finish', 'Includes space-bar accent', 'Full-layout template'],
  },
  {
    id: 'mono-chrome', name: 'Mono Chrome', price: 19, category: 'Minimal Series', featured: false,
    stock: 'low', compatibility: ['65%', '75%', 'TKL', 'Full-size'],
    desc: 'Restraint as a feature. Two-tone graphite keys with a single pearlescent accent row.',
    variants: [
      { id: 'onyx',     name: 'Onyx',     g1: '#475569', g2: '#0f172a' },
      { id: 'pearl',    name: 'Pearl',    g1: '#f1f5f9', g2: '#94a3b8' },
      { id: 'graphite', name: 'Graphite', g1: '#64748b', g2: '#1e293b' },
    ],
    details: ['Fingerprint-proof coating', 'Single accent row', 'Extra accent keys included'],
  },
  {
    id: 'cyber-mint', name: 'Cyber Mint', price: 22, category: 'Accent Series', featured: false,
    stock: 'in', compatibility: ['60%', '65%', '75%', 'TKL', 'Full-size'],
    desc: 'Fresh mint over deep space black, with an electric lime space bar. Small footprint, big presence.',
    variants: [
      { id: 'mint', name: 'Mint', g1: '#6ee7b7', g2: '#14b8a6' },
      { id: 'ice',  name: 'Ice',  g1: '#a5f3fc', g2: '#67e8f9' },
      { id: 'lime', name: 'Lime', g1: '#bef264', g2: '#4ade80' },
    ],
    details: ['UV-stable inks', 'Electric space-bar accent', 'Full-layout template'],
  },
];

const STEPS = [
  { title: 'Choose your design', text: 'Pick a set and a variant from the collection. Every design comes in three colourways.' },
  { title: 'Receive your sticker set', text: 'Your set ships as one precision-cut template sheet — every key aligned to the millimetre.' },
  { title: 'Clean your keyboard', text: 'Wipe keycaps with the included alcohol pad. A clean surface means zero bubbles.' },
  { title: 'Apply the stickers', text: 'Peel, place, press — just like you watched on the build. Each sticker lands exactly where it should.' },
  { title: 'Transform your keyboard', text: 'Step back. A blank board is now unmistakably yours.' },
];

/* ============================================================
   2. COLLECTION RENDERING + product cards
   ============================================================ */
const grid = $('#productGrid');

function miniKeyboardHTML(variant, keys = 24, extraClass = '') {
  const keysHTML = Array.from({ length: keys }, () => '<span class="mk-key"></span>').join('');
  return `<div class="mini-kb ${extraClass}" style="--g1:${variant.g1};--g2:${variant.g2}" aria-hidden="true">${keysHTML}</div>`;
}

function renderCollection() {
  grid.innerHTML = PRODUCTS.map(p => `
    <article class="card reveal" data-tilt data-id="${p.id}">
      <div class="card-media">
        ${miniKeyboardHTML(p.variants[0])}
        ${p.featured ? '<span class="badge">Featured</span>' : ''}
      </div>
      <div class="card-body">
        <div class="card-top"><h3>${p.name}</h3><span class="price">${money(p.price)}</span></div>
        <p>${p.desc}</p>
        <div class="chips">${p.compatibility.map(c => `<span class="chip">${c}</span>`).join('')}</div>
        <div class="swatches" aria-label="Available variants">
          ${p.variants.map(v => `<span class="sw" style="background:linear-gradient(135deg,${v.g1},${v.g2})" title="${v.name}"></span>`).join('')}
        </div>
        <div class="card-actions">
          <button class="btn ghost sm" data-view="${p.id}">View Product</button>
          <button class="btn primary sm" data-add="${p.id}">Add to Cart</button>
        </div>
      </div>
    </article>`).join('');
  attachTilt();
}

/* subtle 3D tilt on product cards */
function attachTilt() {
  if (!FINE_POINTER || REDUCED) return;
  $$('[data-tilt]').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const rx = ((e.clientY - r.top) / r.height - 0.5) * -7;
      const ry = ((e.clientX - r.left) / r.width - 0.5) * 9;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}

/* ---------------- product detail modal ---------------- */
const productModal = $('#productModal');
let pmProduct = null, pmVariant = 0, pmQty = 1;

function openProduct(id) {
  pmProduct = PRODUCTS.find(p => p.id === id);
  if (!pmProduct) return;
  pmVariant = 0; pmQty = 1;
  $('#pmCategory').textContent = pmProduct.category;
  $('#pmName').textContent = pmProduct.name;
  $('#pmDesc').textContent = pmProduct.desc;
  $('#pmPrice').textContent = money(pmProduct.price);
  $('#pmCompat').innerHTML = pmProduct.compatibility.map(c => `<span class="chip">${c}</span>`).join('');
  $('#pmDetails').innerHTML = pmProduct.details.map(d => `<li>${d}</li>`).join('');
  const stockEl = $('#pmStock');
  if (pmProduct.stock === 'in')  stockEl.innerHTML = '<span class="stock ok">✓ In stock — ships in 24h</span>';
  if (pmProduct.stock === 'low') stockEl.innerHTML = '<span class="stock low">● Low stock — order soon</span>';
  renderVariants();
  syncPM();
  openModal(productModal);
  applyPaletteToKeyboard(pmProduct.variants[0]);   // 3D keyboard wears this design
}

function renderVariants() {
  $('#pmVariants').innerHTML = pmProduct.variants.map((v, i) => `
    <button class="variant-btn ${i === pmVariant ? 'active' : ''}" data-variant="${i}">
      <span class="sw" style="background:linear-gradient(135deg,${v.g1},${v.g2})"></span>${v.name}
    </button>`).join('');
  const kb = miniKeyboardHTML(pmProduct.variants[pmVariant], 24, 'lg');
  $('#pmKeyboard').outerHTML = kb.replace('class="mini-kb', 'id="pmKeyboard" class="mini-kb');
}

function syncPM() {
  $('#qtyVal').textContent = pmQty;
  $('#pmAddPrice').textContent = money(pmProduct.price * pmQty);
}

$('#pmVariants').addEventListener('click', e => {
  const btn = e.target.closest('[data-variant]');
  if (!btn) return;
  pmVariant = +btn.dataset.variant;
  renderVariants();
  applyPaletteToKeyboard(pmProduct.variants[pmVariant]);
});
$('#qtyMinus').addEventListener('click', () => { pmQty = Math.max(1, pmQty - 1); syncPM(); });
$('#qtyPlus').addEventListener('click', () => { pmQty = Math.min(9, pmQty + 1); syncPM(); });
$('#pmAdd').addEventListener('click', () => {
  addToCart(pmProduct.id, pmProduct.variants[pmVariant].id, pmQty);
  toast(`${pmProduct.name} · ${pmProduct.variants[pmVariant].name} added to cart`);
});

grid.addEventListener('click', e => {
  const view = e.target.closest('[data-view]');
  const add  = e.target.closest('[data-add]');
  if (view) openProduct(view.dataset.view);
  if (add) {
    const p = PRODUCTS.find(x => x.id === add.dataset.add);
    addToCart(p.id, p.variants[0].id, 1);
    toast(`${p.name} added to cart`);
  }
});

/* ============================================================
   3. CART
   ============================================================ */
let cart = [];
try { cart = JSON.parse(localStorage.getItem('keyfank_cart') || '[]'); } catch { cart = []; }

const drawer = $('#cartDrawer'), overlay = $('#overlay');
const saveCart = () => localStorage.setItem('keyfank_cart', JSON.stringify(cart));
const cartTotalQty = () => cart.reduce((s, i) => s + i.qty, 0);
const cartSubtotal = () => cart.reduce((s, i) => {
  const p = PRODUCTS.find(x => x.id === i.productId);
  return s + (p ? p.price * i.qty : 0);
}, 0);

function addToCart(productId, variantId, qty) {
  const line = cart.find(i => i.productId === productId && i.variantId === variantId);
  if (line) line.qty = Math.min(9, line.qty + qty);
  else cart.push({ productId, variantId, qty });
  saveCart(); renderCart(); bumpBadge();
}
function setQty(productId, variantId, qty) {
  const line = cart.find(i => i.productId === productId && i.variantId === variantId);
  if (!line) return;
  line.qty = clamp(qty, 0, 9);
  if (line.qty === 0) cart = cart.filter(i => i !== line);
  saveCart(); renderCart();
}
function bumpBadge() {
  const el = $('#cartCount');
  el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
}

function renderCart() {
  $('#cartCount').textContent = cartTotalQty();
  const body = $('#cartItems'), foot = $('#cartFoot');
  if (!cart.length) {
    body.innerHTML = `<div class="cart-empty">
      <p>Your cart is empty.</p>
      <a class="btn ghost sm" href="#collection" id="emptyBrowse">Browse the Collection</a></div>`;
    foot.style.display = 'none';
    $('#emptyBrowse').addEventListener('click', closeDrawer);
    return;
  }
  foot.style.display = '';
  body.innerHTML = cart.map(i => {
    const p = PRODUCTS.find(x => x.id === i.productId);
    const v = p.variants.find(x => x.id === i.variantId);
    return `<div class="cart-item">
      ${miniKeyboardHTML(v, 12, 'sm')}
      <div class="ci-info">
        <strong>${p.name}</strong>
        <span class="variant">${v.name} · ${p.category}</span>
        <div class="qty" style="margin-top:.4rem">
          <button data-dec="${p.id}|${v.id}" aria-label="Decrease">−</button>
          <span>${i.qty}</span>
          <button data-inc="${p.id}|${v.id}" aria-label="Increase">+</button>
        </div>
      </div>
      <div class="ci-right">
        <span class="ci-price">${money(p.price * i.qty)}</span>
        <button class="icon-btn" data-rem="${p.id}|${v.id}" aria-label="Remove ${p.name}">✕</button>
      </div>
    </div>`;
  }).join('');
  const sub = cartSubtotal();
  $('#cartSubtotal').textContent = money(sub);
  $('#shipNote').textContent = sub >= 40
    ? '✓ You unlocked free standard shipping.'
    : `Add ${money(40 - sub)} more for free standard shipping.`;
}

$('#cartItems').addEventListener('click', e => {
  const hit = e.target.closest('[data-dec],[data-inc],[data-rem]');
  if (!hit) return;
  const [pid, vid] = (hit.dataset.dec || hit.dataset.inc || hit.dataset.rem).split('|');
  const line = cart.find(i => i.productId === pid && i.variantId === vid);
  if (!line) return;
  if (hit.dataset.dec) setQty(pid, vid, line.qty - 1);
  if (hit.dataset.inc) setQty(pid, vid, line.qty + 1);
  if (hit.dataset.rem) setQty(pid, vid, 0);
});

function openDrawer() {
  renderCart();
  drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false');
  overlay.hidden = false; requestAnimationFrame(() => overlay.classList.add('show'));
  $('#cartClose').focus();
}
function closeDrawer() {
  drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true');
  overlay.classList.remove('show');
  setTimeout(() => { overlay.hidden = true; }, 300);
}
$('#cartBtn').addEventListener('click', openDrawer);
$('#cartClose').addEventListener('click', closeDrawer);
overlay.addEventListener('click', closeDrawer);

/* ============================================================
   4. CHECKOUT — front-end architecture
   PAYMENT_INTEGRATION_POINT: mount Stripe Elements / PayPal SDK
   at the marked block in index.html and confirm server-side.
   This demo stops before any real payment.
   ============================================================ */
const checkoutModal = $('#checkoutModal');

function shippingCost(method) {
  if (method === 'express') return 12.99;
  return cartSubtotal() >= 40 ? 0 : 4.99;
}

function renderSummary() {
  const method = ($('input[name="ship"]:checked') || {}).value || 'standard';
  const sub = cartSubtotal(), ship = shippingCost(method), total = sub + ship;
  $('#stdLabel').textContent = shippingCost('standard') === 0 ? 'Free' : money(4.99);
  $('#orderSummary').innerHTML =
    cart.map(i => {
      const p = PRODUCTS.find(x => x.id === i.productId);
      const v = p.variants.find(x => x.id === i.variantId);
      return `<div class="row"><span>${p.name} · ${v.name} × ${i.qty}</span><span>${money(p.price * i.qty)}</span></div>`;
    }).join('') +
    `<div class="row"><span>Shipping (${method})</span><span>${ship === 0 ? 'Free' : money(ship)}</span></div>
     <div class="row total"><span>Total</span><span>${money(total)}</span></div>`;
  $('#orderTotal').textContent = money(total);
  return total;
}

$('#checkoutBtn').addEventListener('click', () => {
  if (!cart.length) { toast('Your cart is empty.'); return; }
  closeDrawer();
  $('#checkoutFormWrap').hidden = false;
  $('#orderSuccess').hidden = true;
  renderSummary();
  openModal(checkoutModal);
});
checkoutModal.addEventListener('change', e => { if (e.target.name === 'ship') renderSummary(); });

$('#checkoutForm').addEventListener('submit', e => {
  e.preventDefault();
  const form = e.target;
  if (!form.reportValidity()) return;
  /* PAYMENT_INTEGRATION_POINT — a real provider tokenizes payment here.
     Demo behavior: simulate order acceptance, never claim a real charge. */
  const orderId = 'KF-' + Date.now().toString(36).toUpperCase().slice(-6);
  $('#orderId').textContent = orderId;
  $('#checkoutFormWrap').hidden = true;
  $('#orderSuccess').hidden = false;
  cart = []; saveCart(); renderCart();
  form.reset();
});

/* ============================================================
   MODAL / OVERLAY / TOAST utilities
   ============================================================ */
function openModal(m)  { m.classList.add('open'); m.setAttribute('aria-hidden', 'false'); }
function closeModal(m) { m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); }
$$('.modal').forEach(m => m.addEventListener('click', e => {
  if (e.target === m || e.target.closest('[data-close]')) closeModal(m);
}));
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  $$('.modal.open').forEach(closeModal);
  if (drawer.classList.contains('open')) closeDrawer();
});

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}
$$('[data-demo-link]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  toast('Demo link — this page is not part of the demo build.');
}));

/* how-it-works steps (built from data, with staggered key glow) */
$('#howGrid').innerHTML = STEPS.map((s, i) => `
  <div class="step glass-panel reveal">
    <span class="step-num">0${i + 1}</span>
    <h3>${s.title}</h3>
    <p>${s.text}</p>
    <div class="mini-kb" style="--g1:#7dd3fc;--g2:#c084fc" aria-hidden="true">
      ${Array.from({ length: 8 }, (_, k) => `<span class="mk-key" style="--i:${k + i}"></span>`).join('')}
    </div>
  </div>`).join('');

/* reveal-on-scroll */
const io = new IntersectionObserver(entries => entries.forEach(en => {
  if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
}), { threshold: 0.18 });
function observeReveals() { $$('.reveal:not(.in)').forEach(el => io.observe(el)); }

/* ============================================================
   5. THREE.JS — SCROLL STORY (realistic build)
   Reference-driven materials:
     · machined aluminium case with polished chamfered rim
     · sculpted PBT-style keycaps, cream with tan right cluster
     · image-based lighting (RoomEnvironment) + real shadows
   Replace buildKeyboard() with a GLTF import later — keep the
   same key/sticker data system.
   ============================================================ */
const canvas = $('#scene');
const storySection = $('#story');
let renderer, scene, camera, kb, accentLight;
let keyData = [];            // { cap, capMat, decal, decalMat, t, dTop, spawn, spin, a0, a1, s0, x, ri }
let scrollTarget = 0, scrollSmooth = 0, pointerX = 0, pointerY = 0;
let sceneOK = false;

/* assembly windows per row (fraction of story scroll), row order = build order */
const ASM_ROW_START = [0.150, 0.215, 0.280, 0.345, 0.410];
const STICKER_START = 0.70, STICKER_SPAN = 0.17;

const COL = {
  case:   0xd4d8e0,   // brushed aluminium
  rim:    0xeef1f7,   // polished chamfer highlight
  plate:  0x0e1015,   // recessed dark plate
  cap:    0xe9e3d5,   // cream keycaps
  esc:    0x3d3128,   // dark brown ESC (reference)
  accent: 0xb3a184,   // tan right-side cluster (reference)
};

/* ---- geometry helpers ---- */
function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);   s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);    s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);   s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
}

/* realistic keycap: rounded-rect footprint, bevelled top (smaller top
   face like a real sculpted cap), slight base flare. Origin at base. */
function keycapGeometry(w, d, h) {
  const bev = 0.045;
  const geo = new THREE.ExtrudeGeometry(roundedRectShape(w - 0.06, d - 0.06, Math.min(0.07, w * 0.22)), {
    depth: Math.max(0.02, h - bev * 2),
    bevelEnabled: true, bevelThickness: bev, bevelSize: 0.035,
    bevelSegments: 3, curveSegments: 5,
  });
  geo.rotateX(-Math.PI / 2);   // extrusion axis → +Y
  geo.translate(0, bev, 0);    // base sits at y = 0
  return geo;
}

/* aluminium case block with softened machined edges */
function caseGeometry(w, d, h) {
  const geo = new THREE.ExtrudeGeometry(roundedRectShape(w, d, 0.32), {
    depth: h - 0.12, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05,
    bevelSegments: 4, curveSegments: 8,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0.06, 0);
  return geo;                  // spans y ∈ [0, h]
}

/* polished rim ring with a window cut out (the bright edge line) */
function rimGeometry(ow, od, iw, id, h) {
  const shape = roundedRectShape(ow, od, 0.34);
  const hole = roundedRectShape(iw, id, 0.26);
  shape.holes.push(new THREE.Path(hole.getPoints(24).reverse()));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 8 });
  geo.rotateX(-Math.PI / 2);
  return geo;                  // spans y ∈ [0, h]
}

/* gradient sticker texture (canvas-generated, no external assets) */
function stickerTexture(c1, c2, angle = 135) {
  const s = 128, cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const ctx = cv.getContext('2d');
  const rad = angle * Math.PI / 180;
  const g = ctx.createLinearGradient(0, 0, s * Math.abs(Math.cos(rad)) || s, s * Math.abs(Math.sin(rad)) || s);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
  const hl = ctx.createLinearGradient(0, 0, 0, s);
  hl.addColorStop(0, 'rgba(255,255,255,.35)'); hl.addColorStop(0.4, 'rgba(255,255,255,0)');
  ctx.fillStyle = hl; ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function capMaterial(color, seed) {
  const m = new THREE.MeshPhysicalMaterial({
    color, metalness: 0, roughness: 0.46,
    clearcoat: 0.35, clearcoatRoughness: 0.55,   // satin PBT sheen
    envMapIntensity: 0.55,
    transparent: true, opacity: 0,
  });
  /* tiny per-key colour drift, like real moulded PBT */
  m.color.offsetHSL(0, (rnd(seed + 3) - 0.5) * 0.02, (rnd(seed + 5) - 0.5) * 0.035);
  return m;
}

function buildKeyboard() {
  const U = 0.4;                                  // key unit
  const GAP = 0.06, CAP_H = 0.24, SCULPT = 0.012; // row sculpt rise
  const rows = [
    { widths: Array(14).fill(1) },                                        // number row
    { widths: Array(14).fill(1) },                                        // QWERTY row
    { widths: [1.5, ...Array(12).fill(1), 1.5] },                         // home row
    { widths: [1.75, ...Array(11).fill(1), 2.25] },                       // modifier row
    { widths: [2.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 2.75] },         // bottom row
  ];
  const maxUnits = 14;
  const baseW = maxUnits * U + 0.7, baseD = rows.length * U + 0.6;

  kb = new THREE.Group();

  /* --- machined aluminium case (the blank hero of stage 01) --- */
  const caseMat = new THREE.MeshStandardMaterial({
    color: COL.case, metalness: 1, roughness: 0.28, envMapIntensity: 1.25,
  });
  const base = new THREE.Mesh(caseGeometry(baseW, baseD, 0.42), caseMat);
  base.position.y = -0.37;                       // top of case at y = 0.05
  base.receiveShadow = true;
  kb.add(base);

  /* polished chamfered rim — catches the bright edge highlight */
  const rimMat = new THREE.MeshStandardMaterial({
    color: COL.rim, metalness: 1, roughness: 0.12, envMapIntensity: 1.6,
  });
  const rim = new THREE.Mesh(rimGeometry(baseW - 0.02, baseD - 0.02, baseW - 0.42, baseD - 0.42, 0.055), rimMat);
  rim.position.y = 0.05;
  kb.add(rim);

  /* dark recessed plate visible between the caps */
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(baseW - 0.3, 0.04, baseD - 0.3),
    new THREE.MeshStandardMaterial({ color: COL.plate, metalness: 0.55, roughness: 0.6 })
  );
  plate.position.y = 0.045;
  plate.receiveShadow = true;
  kb.add(plate);

  let keyIndex = 0;
  rows.forEach((row, ri) => {
    const total = row.widths.reduce((a, b) => a + b, 0);
    const offset = (maxUnits - total) / 2;
    let cursor = offset;
    const cols = row.widths.length;
    const sculptY = ri * SCULPT;

    row.widths.forEach((wUnits, ci) => {
      const w = wUnits * U - GAP, d = U - GAP;
      const cx = -baseW / 2 + 0.35 + (cursor + wUnits / 2) * U;
      const cz = (ri - 2) * U;
      const baseY = 0.06 + sculptY;                  // cap base height
      const topY = baseY + CAP_H;                    // cap top surface
      const i = keyIndex++;

      /* reference-inspired accents: dark ESC, tan right cluster */
      let color = COL.cap;
      if (ri === 0 && ci === 0) color = COL.esc;
      else if ((ri < 4 && ci >= cols - 3) || (ri === 4 && ci >= 5)) color = COL.accent;

      const capMat = capMaterial(color, i);
      const cap = new THREE.Mesh(keycapGeometry(w, d, CAP_H), capMat);
      cap.visible = false;
      cap.castShadow = true;
      cap.receiveShadow = true;
      kb.add(cap);

      /* sticker decal — flies down and presses onto the cap in stages 05–06 */
      const decalMat = new THREE.MeshBasicMaterial({
        map: stickerTexture('#67e8f9', '#a78bfa', 135 + (ri % 3) * 60),
        transparent: true, opacity: 0, toneMapped: false,
      });
      const decal = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.15, d - 0.15), decalMat);
      decal.rotation.x = -Math.PI / 2;
      decal.visible = false;
      kb.add(decal);

      /* deterministic flight plan: alternate sides, arc above the board */
      const side = (ci % 2 === 0 ? -1 : 1) * (ri % 2 === 0 ? 1 : -1);
      keyData.push({
        cap, capMat, decal, decalMat,
        t: new THREE.Vector3(cx, baseY + CAP_H / 2, cz),
        dTop: new THREE.Vector3(cx, topY + 0.012, cz),
        spawn: new THREE.Vector3(
          cx + side * (1.9 + rnd(i) * 1.6),
          topY + 4.6 + rnd(i + 40) * 2.2,
          cz + (rnd(i + 80) - 0.5) * 1.6
        ),
        spin: new THREE.Vector3((rnd(i + 7) - 0.5) * 1.4, side * (0.9 + rnd(i + 13)), (rnd(i + 21) - 0.5) * 1.0),
        a0: 0, a1: 0, s0: 0, x: cx, ri,
      });

      cursor += wUnits;
    });
  });

  /* assembly windows: row base + column stagger, last cap lands ≈ t 0.52 */
  keyData.forEach(k => {
    const colFrac = clamp((k.x + baseW / 2 - 0.35) / (maxUnits * U), 0, 1);
    k.a0 = ASM_ROW_START[k.ri] + colFrac * 0.05;
    k.a1 = k.a0 + 0.055;
  });

  /* sticker order: rightmost keys first (matches the stage-04 macro focus) */
  const byRight = [...keyData].sort((a, b) => (b.x - a.x) || (a.ri - b.ri));
  byRight.forEach((k, i) => { k.s0 = STICKER_START + (i / (byRight.length - 1)) * STICKER_SPAN; });

  /* soft fake floor shadow */
  const shCv = document.createElement('canvas'); shCv.width = shCv.height = 256;
  const sctx = shCv.getContext('2d');
  const rg = sctx.createRadialGradient(128, 128, 20, 128, 128, 128);
  rg.addColorStop(0, 'rgba(0,0,0,.6)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
  sctx.fillStyle = rg; sctx.fillRect(0, 0, 256, 256);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(baseW * 1.8, baseD * 2.8),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shCv), transparent: true, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.48;
  kb.add(shadow);

  scene.add(kb);
}

/* recolour every sticker to a product variant (called from product modal) */
function applyPaletteToKeyboard(variant) {
  if (!sceneOK) return;
  keyData.forEach((k, i) => {
    const old = k.decalMat.map;
    k.decalMat.map = stickerTexture(variant.g1, variant.g2, 135 + (i % 3) * 60);
    k.decalMat.needsUpdate = true;
    if (old) old.dispose();
  });
}

/* camera + board-pose keyframes across the story (t = 0..1) */
const KEYS = [
  { t: 0.00, cam: [0, 2.3, 9.0],   look: [0.5, 0, 0],      rotY: -0.30, kbx: 0.9 },
  { t: 0.15, cam: [0.3, 2.0, 8.4],look: [0.6, 0, 0],      rotY: -0.25, kbx: 0.9 },
  { t: 0.35, cam: [0, 2.6, 7.6],  look: [0.5, 0.1, 0],    rotY: 0.10,  kbx: 0.7 },
  { t: 0.55, cam: [0.6, 2.9, 7.0],look: [0.3, 0.1, 0],    rotY: 0.30,  kbx: 0.5 },
  { t: 0.70, cam: [2.6, 1.15, 3.4],look: [1.7, 0.15, 0.15],rotY: 0.50,  kbx: -1.6 },
  { t: 0.90, cam: [2.3, 1.4, 3.9],look: [1.5, 0.15, 0.1], rotY: 0.45,  kbx: -1.6 },
  { t: 1.00, cam: [0, 2.1, 8.6],  look: [0, 0.3, 0],      rotY: 0.05,  kbx: 0.0 },
];
const _pos = new THREE.Vector3(), _look = new THREE.Vector3();
function poseAt(t) {
  let a = KEYS[0], b = KEYS[KEYS.length - 1];
  for (let i = 0; i < KEYS.length - 1; i++) {
    if (t >= KEYS[i].t && t <= KEYS[i + 1].t) { a = KEYS[i]; b = KEYS[i + 1]; break; }
  }
  const f = smoothstep((t - a.t) / (b.t - a.t || 1), 0, 1);
  _pos.set(
    a.cam[0] + (b.cam[0] - a.cam[0]) * f,
    a.cam[1] + (b.cam[1] - a.cam[1]) * f,
    a.cam[2] + (b.cam[2] - a.cam[2]) * f
  );
  _look.set(
    a.look[0] + (b.look[0] - a.look[0]) * f,
    a.look[1] + (b.look[1] - a.look[1]) * f,
    a.look[2] + (b.look[2] - a.look[2]) * f
  );
  return {
    pos: _pos, look: _look,
    rotY: a.rotY + (b.rotY - a.rotY) * f,
    kbx: a.kbx + (b.kbx - a.kbx) * f,
  };
}

function initScene() {
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (err) {
    $('#loader').classList.add('done');
    toast('WebGL unavailable — showing the site without 3D.');
    return;
  }
  sceneOK = true;
  const mobile = innerWidth < 768;
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 60);

  /* image-based lighting — without this, bare metal renders black */
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  /* cinematic studio lighting (direction matched to the reference shot) */
  scene.add(new THREE.HemisphereLight(0xcfd8ee, 0x0a0c12, 0.35));
  const key = new THREE.DirectionalLight(0xfff2e2, 2.4);
  key.position.set(4, 8, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  key.shadow.camera.left = -8; key.shadow.camera.right = 8;
  key.shadow.camera.top = 8;   key.shadow.camera.bottom = -8;
  key.shadow.camera.near = 1;  key.shadow.camera.far = 25;
  key.shadow.bias = -0.0004;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xbcd2ff, 0.5);
  fill.position.set(-6, 4, 4);
  scene.add(fill);
  const rimViolet = new THREE.PointLight(0x8b5cf6, 18, 24); rimViolet.position.set(-5, 3.5, -3); scene.add(rimViolet);
  const rimCyan = new THREE.PointLight(0x22d3ee, 10, 22); rimCyan.position.set(5, 2, -3); scene.add(rimCyan);
  accentLight = new THREE.PointLight(0xf0abfc, 0, 18); accentLight.position.set(0, 4, 2); scene.add(accentLight);

  buildKeyboard();

  if (REDUCED) {          /* static, fully-built board — no scroll animation */
    keyData.forEach(k => {
      k.cap.visible = true; k.capMat.opacity = 1;
      k.cap.position.copy(k.t); k.cap.rotation.set(0, 0, 0);
      k.decal.visible = true; k.decalMat.opacity = 1;
      k.decal.position.copy(k.dTop); k.decal.rotation.set(-Math.PI / 2, 0, 0);
    });
    kb.position.set(0, 0, 0);
    const p = poseAt(1);
    camera.position.copy(p.pos); camera.lookAt(p.look);
    kb.rotation.y = p.rotY;
    renderer.render(scene, camera);
  } else {
    requestAnimationFrame(tick);
  }
  $('#loader').classList.add('done');
}

/* ---------------- story captions + HUD ---------------- */
const CAPS = $$('.story-cap').map(el => {
  const in0 = +el.dataset.cap === 0 ? 0.0 :
    [0.15, 0.35, 0.55, 0.70, 0.90][+el.dataset.cap - 1];
  const in1 = [0.15, 0.35, 0.55, 0.70, 0.90, 1.01][+el.dataset.cap];
  return { el, in0, in1 };
});
const STAGE_LABELS = [
  'STAGE 01 / 06 — BLANK CANVAS', 'STAGE 02 / 06 — KEY ASSEMBLY', 'STAGE 03 / 06 — FULL BUILD',
  'STAGE 04 / 06 — MACRO FOCUS', 'STAGE 05 / 06 — STICKER APPLICATION', 'STAGE 06 / 06 — FINAL REVEAL',
];
let lastStage = -1;

function updateCaptions(t) {
  CAPS.forEach(({ el, in0, in1 }) => {
    const o = smoothstep(t, in0, in0 + 0.045) * (1 - smoothstep(t, in1 - 0.045, in1));
    el.style.opacity = o.toFixed(3);
  });
  const stage = t < 0.15 ? 0 : t < 0.35 ? 1 : t < 0.55 ? 2 : t < 0.70 ? 3 : t < 0.90 ? 4 : 5;
  if (stage !== lastStage) {
    lastStage = stage;
    $('#stageLabel').textContent = STAGE_LABELS[stage];
  }
  $('#storyBar').style.width = (t * 100).toFixed(1) + '%';
  $('#storyHint').classList.toggle('gone', t > 0.02);
}

/* ---------------- per-frame ---------------- */
const clock = new THREE.Clock();
function tick() {
  requestAnimationFrame(tick);
  const t = clock.getElapsedTime();

  scrollSmooth += (scrollTarget - scrollSmooth) * 0.09;
  const p = poseAt(scrollSmooth);

  /* --- keycaps: fly in, rotate, settle (stages 02–03) --- */
  keyData.forEach(k => {
    const raw = smoothstep(scrollSmooth, k.a0, k.a1);
    const e = easeOutCubic(raw);
    k.cap.visible = raw > 0.002;
    k.capMat.opacity = clamp(raw / 0.12, 0, 1);
    /* small settle-bounce in the last 20% of the flight */
    const bounce = raw > 0.8 ? Math.sin((raw - 0.8) / 0.2 * Math.PI) * 0.06 * (1 - raw) : 0;
    k.cap.position.set(
      k.t.x + k.spawn.x * (1 - e),
      k.t.y + k.spawn.y * (1 - e) + bounce,
      k.t.z + k.spawn.z * (1 - e)
    );
    k.cap.rotation.set(k.spin.x * (1 - e), k.spin.y * (1 - e), k.spin.z * (1 - e));
  });

  /* --- stickers: descend, align, press onto the cap (stages 05–06) --- */
  keyData.forEach(k => {
    const raw = smoothstep(scrollSmooth, k.s0, k.s0 + 0.05);
    k.decal.visible = raw > 0.002;
    k.decalMat.opacity = clamp(raw / 0.25, 0, 1);
    const e = easeOutCubic(raw);
    const press = raw > 0.85 ? Math.sin((raw - 0.85) / 0.15 * Math.PI) * 0.018 * (1 - raw) : 0;
    k.decal.position.set(k.dTop.x, k.dTop.y + 0.95 * (1 - e) + press, k.dTop.z);
    k.decal.rotation.set(-Math.PI / 2 + (1 - e) * 0.55, 0, (1 - e) * 0.2);
  });

  /* --- board pose: rotation, lateral shift, idle float --- */
  kb.rotation.y = p.rotY;
  kb.rotation.x = -0.05;
  kb.position.x = p.kbx;
  kb.position.y = Math.sin(t * 0.7) * 0.04;

  /* --- camera: keyframe pose + gentle pointer parallax --- */
  pointerX += ((window._px || 0) - pointerX) * 0.05;
  pointerY += ((window._py || 0) - pointerY) * 0.05;
  camera.position.set(
    p.pos.x + pointerX * 0.35,
    p.pos.y - pointerY * 0.25,
    p.pos.z
  );
  camera.lookAt(p.look);

  /* reveal glow ramps in for the final hero */
  accentLight.intensity = smoothstep(scrollSmooth, 0.88, 1) * 30;

  updateCaptions(scrollSmooth);
  renderer.render(scene, camera);
}

/* ---------------- scroll / pointer / resize ---------------- */
function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  const pageP = max > 0 ? clamp(scrollY / max, 0, 1) : 0;
  $('#nav').classList.toggle('scrolled', scrollY > 30);
  $('#progress').style.width = (pageP * 100).toFixed(2) + '%';

  /* story-local progress: 0 when story enters, 1 when it leaves */
  const r = storySection.getBoundingClientRect();
  const total = storySection.offsetHeight - innerHeight;
  scrollTarget = total > 0 ? clamp(-r.top / total, 0, 1) : (r.top < 0 ? 1 : 0);
}
addEventListener('scroll', onScroll, { passive: true });
addEventListener('pointermove', e => {
  window._px = (e.clientX / innerWidth - 0.5) * 2;
  window._py = (e.clientY / innerHeight - 0.5) * 2;
}, { passive: true });
addEventListener('resize', () => {
  if (!sceneOK) return;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  onScroll();
});

/* ---------------- boot ---------------- */
renderCollection();
renderCart();
observeReveals();
onScroll();
initScene();