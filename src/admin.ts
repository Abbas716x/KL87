import { Product, Reel, ProductCategory } from './types';
import {
  fetchProducts,
  saveProductToStore,
  deleteProductFromStore,
  fetchReels,
  saveReelToStore,
  deleteReelFromStore
} from './firebase';
import { defaultProducts } from './data/defaultProducts';
import { defaultReels } from './data/defaultReels';

// Admin Credentials
const ADMIN_USERNAME = 'ZXCV';
const ADMIN_PASSWORD = '12XC';
const AUTH_KEY = 'brand_store_admin_authenticated';

// State
let products: Product[] = [];
let reels: Reel[] = [];
let currentSearch = '';

document.addEventListener('DOMContentLoaded', async () => {
  initAuth();
  initDashboardEvents();

  if (isAuthenticated()) {
    showDashboard();
    await loadAdminData();
  } else {
    showLogin();
  }
});

// Authentication System
function initAuth() {
  const form = document.getElementById('admin-login-form') as HTMLFormElement;
  const usernameInput = document.getElementById('login-username') as HTMLInputElement;
  const passwordInput = document.getElementById('login-password') as HTMLInputElement;
  const errorMsg = document.getElementById('login-error-msg');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = usernameInput?.value.trim();
    const p = passwordInput?.value.trim();

    if (u === ADMIN_USERNAME && p === ADMIN_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      errorMsg?.classList.add('hidden');
      showAdminToast('تم تسجيل الدخول بنجاح! أهلاً بك في لوحة الإدارة');
      showDashboard();
      await loadAdminData();
    } else {
      if (errorMsg) {
        errorMsg.classList.remove('hidden');
        errorMsg.classList.add('animate-bounce');
        setTimeout(() => errorMsg.classList.remove('animate-bounce'), 800);
      }
      passwordInput.value = '';
    }
  });

  document.getElementById('admin-logout-btn')?.addEventListener('click', () => {
    sessionStorage.removeItem(AUTH_KEY);
    showLogin();
    showAdminToast('تم تسجيل الخروج بنجاح');
  });
}

function isAuthenticated(): boolean {
  return sessionStorage.getItem(AUTH_KEY) === 'true';
}

function showLogin() {
  document.getElementById('login-section')?.classList.remove('hidden');
  document.getElementById('dashboard-section')?.classList.add('hidden');
}

function showDashboard() {
  document.getElementById('login-section')?.classList.add('hidden');
  document.getElementById('dashboard-section')?.classList.remove('hidden');
}

// Load Data
async function loadAdminData() {
  try {
    products = await fetchProducts();
    reels = await fetchReels();
    updateStats();
    renderProductsTable();
    renderReelsGrid();
  } catch (err) {
    console.error('Error loading admin data:', err);
  }
}

function updateStats() {
  const prodCountEl = document.getElementById('stat-products-count');
  const reelCountEl = document.getElementById('stat-reels-count');
  if (prodCountEl) prodCountEl.textContent = String(products.length);
  if (reelCountEl) reelCountEl.textContent = String(reels.length);
}

// Initialize Dashboard UI Events
function initDashboardEvents() {
  // Tabs
  const tabProducts = document.getElementById('admin-tab-products');
  const tabReels = document.getElementById('admin-tab-reels');
  const tabDatabase = document.getElementById('admin-tab-database');

  const viewProducts = document.getElementById('admin-view-products');
  const viewReels = document.getElementById('admin-view-reels');
  const viewDatabase = document.getElementById('admin-view-database');

  const switchAdminTab = (target: 'products' | 'reels' | 'database') => {
    const tabs = [
      { id: 'products', btn: tabProducts, view: viewProducts },
      { id: 'reels', btn: tabReels, view: viewReels },
      { id: 'database', btn: tabDatabase, view: viewDatabase }
    ];

    tabs.forEach(t => {
      if (t.id === target) {
        t.btn?.classList.remove('bg-slate-800', 'text-slate-300');
        t.btn?.classList.add('bg-indigo-600', 'text-white', 'shadow-md');
        t.view?.classList.remove('hidden');
      } else {
        t.btn?.classList.remove('bg-indigo-600', 'text-white', 'shadow-md');
        t.btn?.classList.add('bg-slate-800', 'text-slate-300');
        t.view?.classList.add('hidden');
      }
    });
  };

  tabProducts?.addEventListener('click', () => switchAdminTab('products'));
  tabReels?.addEventListener('click', () => switchAdminTab('reels'));
  tabDatabase?.addEventListener('click', () => switchAdminTab('database'));

  // Search Products in Table
  const searchInput = document.getElementById('admin-search-products') as HTMLInputElement;
  searchInput?.addEventListener('input', (e) => {
    currentSearch = (e.target as HTMLInputElement).value.toLowerCase().trim();
    renderProductsTable();
  });

  // Open Add Product Modal
  document.getElementById('open-add-product-btn')?.addEventListener('click', () => {
    openProductEditor(null);
  });
  document.getElementById('close-product-editor-btn')?.addEventListener('click', closeProductEditor);
  document.getElementById('cancel-product-editor-btn')?.addEventListener('click', closeProductEditor);

  // Add Spec Row Button
  document.getElementById('add-spec-row-btn')?.addEventListener('click', () => {
    addSpecRow('', '');
  });

  // Product Editor Form Submit
  const productForm = document.getElementById('product-editor-form') as HTMLFormElement;
  productForm?.addEventListener('submit', handleSaveProduct);

  // Reels Modal
  document.getElementById('open-add-reel-btn')?.addEventListener('click', () => {
    document.getElementById('reel-editor-modal')?.classList.remove('hidden');
  });
  document.getElementById('close-reel-editor-btn')?.addEventListener('click', () => {
    document.getElementById('reel-editor-modal')?.classList.add('hidden');
  });
  document.getElementById('cancel-reel-editor-btn')?.addEventListener('click', () => {
    document.getElementById('reel-editor-modal')?.classList.add('hidden');
  });

  const reelForm = document.getElementById('reel-editor-form') as HTMLFormElement;
  reelForm?.addEventListener('submit', handleSaveReel);

  // Database Reset & Sync Buttons
  document.getElementById('admin-sync-now-btn')?.addEventListener('click', async () => {
    showAdminToast('جاري المزامنة السحابية مع Firebase...');
    await loadAdminData();
    showAdminToast('تمت المزامنة بنجاح مع Firebase!');
  });

  document.getElementById('admin-reset-defaults-btn')?.addEventListener('click', async () => {
    if (confirm('هل أنت متأكد من استعادة كافة الأجهزة والريلز الافتراضية؟')) {
      for (const p of defaultProducts) {
        await saveProductToStore(p);
      }
      for (const r of defaultReels) {
        await saveReelToStore(r);
      }
      await loadAdminData();
      showAdminToast('تمت استعادة الكتالوج الافتراضي بنجاح');
    }
  });

  // Expose delete and edit actions to window
  (window as any).editProduct = editProduct;
  (window as any).deleteProduct = deleteProduct;
  (window as any).deleteReel = deleteReel;
  (window as any).removeSpecRow = (btn: HTMLElement) => {
    btn.closest('.spec-row')?.remove();
  };
}

// Render Products Table
function renderProductsTable() {
  const tbody = document.getElementById('admin-products-table-body');
  if (!tbody) return;

  let filtered = [...products];
  if (currentSearch) {
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(currentSearch) ||
      p.brand.toLowerCase().includes(currentSearch) ||
      (p.titleEn || '').toLowerCase().includes(currentSearch)
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="p-6 text-center text-slate-500 font-bold">
          لا توجد أجهزة مطابقة للبحث
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(p => `
    <tr class="hover:bg-slate-800/40 transition">
      <td class="p-3">
        <div class="flex items-center gap-3">
          <img src="${p.image}" class="w-10 h-10 object-contain rounded-lg bg-slate-900 p-1 border border-slate-800 flex-shrink-0" onerror="this.src='https://via.placeholder.com/80/0F172A/6366F1?text=IMG'">
          <div>
            <span class="font-extrabold text-white block line-clamp-1">${p.title}</span>
            <span class="text-[10px] text-slate-400 font-mono">${p.titleEn || p.id}</span>
          </div>
        </div>
      </td>
      <td class="p-3">
        <span class="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-bold text-slate-300">
          ${p.category}
        </span>
      </td>
      <td class="p-3 font-bold text-slate-200">
        ${p.brand}
      </td>
      <td class="p-3 font-black text-amber-400">
        ${p.price.toLocaleString()} د.ع
      </td>
      <td class="p-3 text-[11px] text-slate-400">
        ${p.warranty}
      </td>
      <td class="p-3 text-center">
        <div class="flex items-center justify-center gap-2">
          <button onclick="window.editProduct('${p.id}')" class="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white transition font-bold text-[11px] flex items-center gap-1">
            <i class="fa-solid fa-pen-to-square"></i>
            <span>تعديل</span>
          </button>
          <button onclick="window.deleteProduct('${p.id}')" class="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-600 text-rose-300 hover:text-white transition font-bold text-[11px] flex items-center gap-1">
            <i class="fa-solid fa-trash-can"></i>
            <span>حذف</span>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Open Editor Modal (Create or Edit)
function openProductEditor(product: Product | null) {
  const modal = document.getElementById('product-editor-modal');
  const modalTitle = document.getElementById('product-editor-title');
  const idInput = document.getElementById('edit-product-id') as HTMLInputElement;
  const titleInput = document.getElementById('form-product-title') as HTMLInputElement;
  const titleEnInput = document.getElementById('form-product-title-en') as HTMLInputElement;
  const catSelect = document.getElementById('form-product-category') as HTMLSelectElement;
  const brandInput = document.getElementById('form-product-brand') as HTMLInputElement;
  const priceInput = document.getElementById('form-product-price') as HTMLInputElement;
  const oldPriceInput = document.getElementById('form-product-old-price') as HTMLInputElement;
  const badgeInput = document.getElementById('form-product-badge') as HTMLInputElement;
  const warrantyInput = document.getElementById('form-product-warranty') as HTMLInputElement;
  const imageInput = document.getElementById('form-product-image') as HTMLInputElement;
  const specsContainer = document.getElementById('specs-editor-container');

  if (specsContainer) specsContainer.innerHTML = '';

  if (product) {
    if (modalTitle) modalTitle.textContent = 'تعديل بيانات الجهاز في الكتالوج';
    if (idInput) idInput.value = product.id;
    if (titleInput) titleInput.value = product.title;
    if (titleEnInput) titleEnInput.value = product.titleEn || '';
    if (catSelect) catSelect.value = product.category;
    if (brandInput) brandInput.value = product.brand;
    if (priceInput) priceInput.value = String(product.price);
    if (oldPriceInput) oldPriceInput.value = product.oldPrice ? String(product.oldPrice) : '';
    if (badgeInput) badgeInput.value = product.badge || product.discountText || '';
    if (warrantyInput) warrantyInput.value = product.warranty;
    if (imageInput) imageInput.value = product.image;

    // Populate specs rows
    const specs = Object.entries(product.specs || {});
    if (specs.length > 0) {
      specs.forEach(([k, v]) => addSpecRow(k, v));
    } else {
      addDefaultSpecRows();
    }
  } else {
    if (modalTitle) modalTitle.textContent = 'إضافة جهاز جديد للكتالوج';
    if (idInput) idInput.value = '';
    const form = document.getElementById('product-editor-form') as HTMLFormElement;
    form?.reset();
    if (warrantyInput) warrantyInput.value = 'ضمان وكالة رسمي سنة كاملة';
    addDefaultSpecRows();
  }

  modal?.classList.remove('hidden');
}

function closeProductEditor() {
  document.getElementById('product-editor-modal')?.classList.add('hidden');
}

function addDefaultSpecRows() {
  const defaults = [
    { key: 'المعالج', val: '' },
    { key: 'الذاكرة العشوائية (RAM)', val: '' },
    { key: 'سعة التخزين', val: '' },
    { key: 'الشاشة', val: '' },
    { key: 'البطارية والشحن', val: '' }
  ];
  defaults.forEach(d => addSpecRow(d.key, d.val));
}

function addSpecRow(key: string, val: string) {
  const container = document.getElementById('specs-editor-container');
  if (!container) return;

  const row = document.createElement('div');
  row.className = 'spec-row flex items-center gap-2';
  row.innerHTML = `
    <input type="text" placeholder="اسم الخاصية (مثال: المعالج)" value="${key}" class="spec-key w-1/3 glass-input p-2 rounded-lg text-xs font-bold">
    <input type="text" placeholder="القيمة (مثال: Apple A18 Pro 3nm)" value="${val}" class="spec-val flex-1 glass-input p-2 rounded-lg text-xs font-semibold">
    <button type="button" onclick="window.removeSpecRow(this)" class="w-8 h-8 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-600 hover:text-white flex items-center justify-center flex-shrink-0 transition">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;
  container.appendChild(row);
}

// Save Product Handler
async function handleSaveProduct(e: Event) {
  e.preventDefault();

  const idInput = document.getElementById('edit-product-id') as HTMLInputElement;
  const title = (document.getElementById('form-product-title') as HTMLInputElement).value.trim();
  const titleEn = (document.getElementById('form-product-title-en') as HTMLInputElement).value.trim();
  const category = (document.getElementById('form-product-category') as HTMLSelectElement).value as ProductCategory;
  const brand = (document.getElementById('form-product-brand') as HTMLInputElement).value.trim();
  const price = Number((document.getElementById('form-product-price') as HTMLInputElement).value);
  const oldPriceVal = (document.getElementById('form-product-old-price') as HTMLInputElement).value;
  const oldPrice = oldPriceVal ? Number(oldPriceVal) : undefined;
  const badge = (document.getElementById('form-product-badge') as HTMLInputElement).value.trim();
  const warranty = (document.getElementById('form-product-warranty') as HTMLInputElement).value.trim();
  const image = (document.getElementById('form-product-image') as HTMLInputElement).value.trim();

  // Extract specs from rows
  const specs: Record<string, string> = {};
  document.querySelectorAll('.spec-row').forEach(row => {
    const k = (row.querySelector('.spec-key') as HTMLInputElement)?.value.trim();
    const v = (row.querySelector('.spec-val') as HTMLInputElement)?.value.trim();
    if (k && v) {
      specs[k] = v;
    }
  });

  const productId = idInput.value || `prod-${Date.now()}`;
  const existingProd = products.find(p => p.id === productId);

  const productData: Product = {
    id: productId,
    title,
    titleEn,
    category,
    brand,
    price,
    oldPrice,
    discountText: oldPrice && oldPrice > price ? `وفر ${(oldPrice - price).toLocaleString()} د.ع` : undefined,
    badge: badge || undefined,
    warranty: warranty || 'ضمان معتمد',
    showroomLocation: 'صالة العرض الرئيسية - BRAND STORE',
    image: image || 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=700&q=80',
    inStock: true,
    specs,
    createdAt: existingProd?.createdAt || Date.now()
  };

  showAdminToast('جاري الحفظ والمزامنة مع الكتالوج...');
  await saveProductToStore(productData);

  // Reload admin data
  await loadAdminData();
  closeProductEditor();
  showAdminToast('تم حفظ الجهاز بنجاح في الكتالوج!');
}

function editProduct(productId: string) {
  const prod = products.find(p => p.id === productId);
  if (prod) {
    openProductEditor(prod);
  }
}

async function deleteProduct(productId: string) {
  const prod = products.find(p => p.id === productId);
  if (!prod) return;

  if (confirm(`هل أنت متأكد من حذف الجهاز "${prod.title}" من الكتالوج نهائياً؟`)) {
    showAdminToast('جاري حذف الجهاز...');
    await deleteProductFromStore(productId);
    await loadAdminData();
    showAdminToast('تم حذف الجهاز من الكتالوج بنجاح');
  }
}

// Reels Management
function renderReelsGrid() {
  const container = document.getElementById('admin-reels-grid');
  if (!container) return;

  container.innerHTML = reels.map(r => `
    <div class="glass-card p-3 rounded-2xl flex items-center justify-between gap-3 border border-slate-800">
      <div class="flex items-center gap-2.5">
        <img src="${r.thumbnail}" class="w-12 h-14 object-cover rounded-xl bg-slate-900 border border-slate-800 flex-shrink-0">
        <div>
          <h4 class="font-extrabold text-white text-xs line-clamp-1">${r.title}</h4>
          <span class="text-[10px] text-slate-400 block">${r.views} مشاهدة • ${r.category}</span>
          ${r.productTitle ? `<span class="text-[10px] text-amber-400 font-bold truncate block">${r.productTitle}</span>` : ''}
        </div>
      </div>
      <button onclick="window.deleteReel('${r.id}')" class="w-8 h-8 rounded-xl bg-rose-950/40 text-rose-400 hover:bg-rose-600 hover:text-white flex items-center justify-center transition">
        <i class="fa-solid fa-trash-can text-xs"></i>
      </button>
    </div>
  `).join('');
}

async function handleSaveReel(e: Event) {
  e.preventDefault();
  const title = (document.getElementById('form-reel-title') as HTMLInputElement).value.trim();
  const thumbnail = (document.getElementById('form-reel-thumb') as HTMLInputElement).value.trim();
  const videoUrl = (document.getElementById('form-reel-video') as HTMLInputElement).value.trim();
  const views = (document.getElementById('form-reel-views') as HTMLInputElement).value.trim() || '1.5K';
  const category = (document.getElementById('form-reel-category') as HTMLSelectElement).value;

  const newReel: Reel = {
    id: `reel-${Date.now()}`,
    title,
    thumbnail,
    videoUrl: videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    views,
    category,
    createdAt: Date.now()
  };

  showAdminToast('جاري حفظ الريل...');
  await saveReelToStore(newReel);
  await loadAdminData();

  document.getElementById('reel-editor-modal')?.classList.add('hidden');
  (document.getElementById('reel-editor-form') as HTMLFormElement)?.reset();
  showAdminToast('تمت إضافة الريل بنجاح لقسم اكتشف!');
}

async function deleteReel(reelId: string) {
  if (confirm('هل تريد حذف هذا الريل؟')) {
    showAdminToast('جاري حذف الريل...');
    await deleteReelFromStore(reelId);
    await loadAdminData();
    showAdminToast('تم حذف الريل بنجاح');
  }
}

// Admin Toast Helper
function showAdminToast(msg: string) {
  const toast = document.getElementById('admin-toast-box');
  const text = document.getElementById('admin-toast-text');
  if (!toast || !text) return;

  text.textContent = msg;
  toast.classList.remove('opacity-0', 'pointer-events-none');
  setTimeout(() => {
    toast.classList.add('opacity-0', 'pointer-events-none');
  }, 2500);
}
