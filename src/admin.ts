import { Product, Reel, ProductCategory } from './types';
import {
  fetchProducts,
  subscribeToProducts,
  saveProductToStore,
  deleteProductFromStore,
  fetchReels,
  subscribeToReels,
  saveReelToStore,
  deleteReelFromStore,
  uploadImageFile,
  getInstagramHandle,
  saveInstagramHandle,
  FIREBASE_FIRESTORE_RULES,
  FIREBASE_STORAGE_RULES
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
let activeSection: 'hierarchy' | 'all-products' | 'reels' | 'firebase' = 'hierarchy';

// Hierarchy Navigation State
let hierarchyCategory: ProductCategory | null = null;
let hierarchyBrand: string | null = null;

// File Upload State
let selectedImageFile: File | null = null;
let selectedImageDataUrl: string = '';

const categoryLabels: Record<string, { label: string; icon: string; emoji: string }> = {
  phones: { label: 'الهواتف المحمولة', icon: 'fa-solid fa-mobile-screen-button', emoji: '📱' },
  laptops: { label: 'حواسيب ولابتوبات', icon: 'fa-solid fa-laptop', emoji: '💻' },
  tablets: { label: 'أجهزة لوحية وآيباد', icon: 'fa-solid fa-tablet-screen-button', emoji: '📲' },
  audio: { label: 'سماعات وصوتيات', icon: 'fa-solid fa-headphones', emoji: '🎧' },
  gaming: { label: 'أجهزة ألعاب وكونسول', icon: 'fa-solid fa-gamepad', emoji: '🎮' },
  monitors: { label: 'شاشات قيمنق', icon: 'fa-solid fa-display', emoji: '🖥️' },
  accessories: { label: 'ملحقات وشواحن وماوس', icon: 'fa-solid fa-plug', emoji: '⚡' },
  chairs: { label: 'كراسي وطاولات قيمنق', icon: 'fa-solid fa-chair', emoji: '🪑' }
};

document.addEventListener('DOMContentLoaded', async () => {
  initAuth();
  initSidebarDrawer();
  initHierarchyEvents();
  initProductEditor();
  initInstagramAndReels();
  initFirebaseRulesCopy();

  if (isAuthenticated()) {
    showDashboard();
    await loadAdminData();
  } else {
    showLogin();
  }
});

// Authentication
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
      showAdminToast('تم تسجيل الدخول بنجاح');
      showDashboard();
      await loadAdminData();
    } else {
      errorMsg?.classList.remove('hidden');
      if (passwordInput) passwordInput.value = '';
    }
  });

  const logout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    showLogin();
    showAdminToast('تم تسجيل الخروج');
  };

  document.getElementById('admin-logout-btn')?.addEventListener('click', logout);
  document.getElementById('drawer-logout-btn')?.addEventListener('click', logout);
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

let unsubProducts: (() => void) | null = null;
let unsubReels: (() => void) | null = null;

// Real-time Data Loading
function loadAdminData() {
  if (unsubProducts) unsubProducts();
  if (unsubReels) unsubReels();

  unsubProducts = subscribeToProducts((liveProducts) => {
    products = liveProducts;
    renderHierarchyCurrentView();
    renderDirectProductsList();
  });

  unsubReels = subscribeToReels((liveReels) => {
    reels = liveReels;
    renderAdminReels();
  });
}

// Hamburger Drawer (3 lines button)
function initSidebarDrawer() {
  const drawer = document.getElementById('sidebar-drawer');
  const openBtn = document.getElementById('toggle-sidebar-btn');
  const closeBtn = document.getElementById('close-sidebar-btn');

  openBtn?.addEventListener('click', () => {
    drawer?.classList.remove('hidden');
  });

  closeBtn?.addEventListener('click', () => {
    drawer?.classList.add('hidden');
  });

  (window as any).switchAdminSection = (section: 'hierarchy' | 'all-products' | 'reels' | 'firebase') => {
    activeSection = section;
    drawer?.classList.add('hidden');

    const views = ['hierarchy', 'all-products', 'reels', 'firebase'];
    views.forEach(v => {
      const el = document.getElementById(`view-${v}`);
      if (el) el.classList.toggle('hidden', v !== section);
    });

    const titleEl = document.getElementById('admin-current-section-title');
    const titles = {
      hierarchy: 'الأقسام والأصناف والمنتجات',
      'all-products': 'قائمة كل الأجهزة المباشرة',
      reels: 'فيديوهات الريلز والانستغرام',
      firebase: 'قواعد وحماية فايربيس'
    };
    if (titleEl) titleEl.textContent = titles[section];
  };
}

// ================= HIERARCHY NAVIGATION ENGINE =================
// Level 1: Categories -> Level 2: Brands/Companies -> Level 3: Products of Brand
function initHierarchyEvents() {
  (window as any).navHierarchy = (target: 'root' | 'cat') => {
    if (target === 'root') {
      hierarchyCategory = null;
      hierarchyBrand = null;
    } else if (target === 'cat') {
      hierarchyBrand = null;
    }
    renderHierarchyCurrentView();
  };

  (window as any).selectHierarchyCategory = (cat: ProductCategory) => {
    hierarchyCategory = cat;
    hierarchyBrand = null;
    renderHierarchyCurrentView();
  };

  (window as any).selectHierarchyBrand = (brand: string) => {
    hierarchyBrand = brand;
    renderHierarchyCurrentView();
  };

  (window as any).openProductEditor = openProductEditor;
  (window as any).deleteProduct = deleteProduct;
}

function renderHierarchyCurrentView() {
  const stepCat = document.getElementById('step-categories');
  const stepBrands = document.getElementById('step-brands');
  const stepProducts = document.getElementById('step-products');

  const bcSep1 = document.getElementById('bc-sep1');
  const bcCat = document.getElementById('bc-cat');
  const bcSep2 = document.getElementById('bc-sep2');
  const bcBrand = document.getElementById('bc-brand');

  if (!hierarchyCategory) {
    // LEVEL 1: Main Categories
    stepCat?.classList.remove('hidden');
    stepBrands?.classList.add('hidden');
    stepProducts?.classList.add('hidden');

    bcSep1?.classList.add('hidden');
    bcCat?.classList.add('hidden');
    bcSep2?.classList.add('hidden');
    bcBrand?.classList.add('hidden');

    renderHierarchyCategories();
  } else if (!hierarchyBrand) {
    // LEVEL 2: Brands in Selected Category
    stepCat?.classList.add('hidden');
    stepBrands?.classList.remove('hidden');
    stepProducts?.classList.add('hidden');

    bcSep1?.classList.remove('hidden');
    if (bcCat) {
      bcCat.textContent = categoryLabels[hierarchyCategory]?.label || hierarchyCategory;
      bcCat.classList.remove('hidden');
    }
    bcSep2?.classList.add('hidden');
    bcBrand?.classList.add('hidden');

    renderHierarchyBrands();
  } else {
    // LEVEL 3: Products of Selected Brand in Category
    stepCat?.classList.add('hidden');
    stepBrands?.classList.add('hidden');
    stepProducts?.classList.remove('hidden');

    bcSep1?.classList.remove('hidden');
    bcCat?.classList.remove('hidden');
    bcSep2?.classList.remove('hidden');
    if (bcBrand) {
      bcBrand.textContent = hierarchyBrand;
      bcBrand.classList.remove('hidden');
    }

    renderHierarchyProducts();
  }
}

// Render Level 1 Categories Cards
function renderHierarchyCategories() {
  const container = document.getElementById('admin-categories-cards');
  if (!container) return;

  const categories = Object.keys(categoryLabels) as ProductCategory[];
  container.innerHTML = categories.map(cat => {
    const info = categoryLabels[cat];
    const catProducts = products.filter(p => p.category === cat);
    return `
      <div 
        onclick="window.selectHierarchyCategory('${cat}')" 
        class="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm hover:border-purple-400 hover:shadow-md cursor-pointer transition flex flex-col justify-between group"
      >
        <div class="flex items-center justify-between">
          <span class="text-3xl">${info.emoji}</span>
          <span class="bg-purple-50 text-purple-700 text-[11px] font-black px-2.5 py-0.5 rounded-full">
            ${catProducts.length} جهاز
          </span>
        </div>
        <div class="mt-4">
          <h4 class="font-black text-sm text-slate-800 group-hover:text-purple-700 transition">${info.label}</h4>
          <span class="text-[10px] text-slate-400 font-bold block mt-0.5">اضغط للاطلاع على الشركات ←</span>
        </div>
      </div>
    `;
  }).join('');
}

// Render Level 2 Brands in Category
function renderHierarchyBrands() {
  const container = document.getElementById('admin-brands-cards');
  const titleEl = document.getElementById('step-brands-title');
  if (!container || !hierarchyCategory) return;

  if (titleEl) {
    titleEl.textContent = `شركات وأصناف قسم (${categoryLabels[hierarchyCategory]?.label}):`;
  }

  // Get unique brands that have products in this category
  const inCatProducts = products.filter(p => p.category === hierarchyCategory);
  const brandCounts: Record<string, number> = {};
  inCatProducts.forEach(p => {
    brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
  });

  // Also include standard brands if none exist yet
  const defaultBrandsForCat = ['Apple', 'Samsung', 'Sony', 'Lenovo', 'Anker', 'MSI', 'Xiaomi', 'Logitech'];
  defaultBrandsForCat.forEach(b => {
    if (!brandCounts[b]) brandCounts[b] = 0;
  });

  const brands = Object.entries(brandCounts);

  container.innerHTML = brands.map(([brandName, count]) => `
    <div 
      onclick="window.selectHierarchyBrand('${brandName}')" 
      class="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm hover:border-purple-400 hover:shadow-md cursor-pointer transition flex flex-col justify-between group text-center"
    >
      <div class="w-12 h-12 mx-auto rounded-2xl bg-purple-50 flex items-center justify-center font-black text-purple-700 text-lg shadow-sm">
        ${brandName.charAt(0)}
      </div>
      <div class="mt-3">
        <h4 class="font-black text-xs text-slate-800 group-hover:text-purple-700 transition">${brandName}</h4>
        <span class="text-[10px] text-purple-600 font-bold block mt-1">${count} أجهزة مسجلة</span>
      </div>
    </div>
  `).join('');
}

// Render Level 3 Products Cards
function renderHierarchyProducts() {
  const container = document.getElementById('admin-products-cards');
  const titleEl = document.getElementById('step-products-title');
  if (!container || !hierarchyCategory || !hierarchyBrand) return;

  if (titleEl) {
    titleEl.textContent = `أجهزة شركة (${hierarchyBrand}) في قسم (${categoryLabels[hierarchyCategory]?.label}):`;
  }

  const items = products.filter(
    p => p.category === hierarchyCategory && p.brand.toLowerCase() === hierarchyBrand!.toLowerCase()
  );

  if (items.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-8 text-center bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
        <p class="text-xs text-slate-500 font-bold">لا توجد أجهزة مسجلة لهذه الشركة في هذا القسم حتى الآن.</p>
        <button onclick="window.openProductEditor(null, '${hierarchyCategory}', '${hierarchyBrand}')" class="px-4 py-2 bg-purple-700 text-white font-black text-xs rounded-xl">
          + إضافة أول جهاز لـ ${hierarchyBrand}
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(p => `
    <div class="bg-white rounded-3xl p-3 border border-slate-200/80 shadow-sm flex flex-col justify-between">
      <div class="h-28 w-full rounded-2xl bg-slate-50 flex items-center justify-center p-2 mb-2">
        <img src="${p.image}" class="max-h-full max-w-full object-contain" onerror="this.src='https://via.placeholder.com/200/FAF9FE/6C5CE7?text=IMG'">
      </div>
      <div>
        <h4 class="font-black text-xs text-slate-800 line-clamp-1">${p.title}</h4>
        <div class="mt-1 flex items-center justify-between">
          <span class="text-purple-700 font-black text-xs">${p.price.toLocaleString()} د.ع</span>
          <span class="text-[10px] text-slate-400">${p.warranty}</span>
        </div>
        <div class="mt-3 pt-2 border-t flex items-center gap-2">
          <button onclick="window.openProductEditor('${p.id}')" class="flex-1 py-1.5 bg-slate-100 hover:bg-purple-100 text-purple-700 font-black text-[11px] rounded-xl transition">
            تعديل
          </button>
          <button onclick="window.deleteProduct('${p.id}')" class="w-8 h-8 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl flex items-center justify-center text-xs transition">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Render All Products Direct List View
function renderDirectProductsList() {
  const container = document.getElementById('admin-direct-products-list');
  const searchInput = document.getElementById('admin-direct-search') as HTMLInputElement;
  if (!container) return;

  const query = searchInput?.value.toLowerCase().trim() || '';
  const filtered = query
    ? products.filter(p => p.title.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query))
    : products;

  searchInput?.addEventListener('input', () => renderDirectProductsList());

  container.innerHTML = filtered.map(p => `
    <div class="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <img src="${p.image}" class="w-12 h-12 object-contain rounded-xl bg-slate-50 p-1 flex-shrink-0" onerror="this.src='https://via.placeholder.com/80/FAF9FE/6C5CE7?text=IMG'">
        <div>
          <h4 class="font-black text-xs text-slate-800 line-clamp-1">${p.title}</h4>
          <span class="text-[10px] text-purple-600 font-bold">${p.brand} • ${categoryLabels[p.category]?.label || p.category}</span>
          <span class="text-xs font-black text-slate-900 block mt-0.5">${p.price.toLocaleString()} د.ع</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="window.openProductEditor('${p.id}')" class="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-black rounded-xl transition">
          تعديل
        </button>
        <button onclick="window.deleteProduct('${p.id}')" class="w-8 h-8 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl flex items-center justify-center text-xs transition">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    </div>
  `).join('');
}

// ================= PRODUCT EDITOR WITH INSTANT IMAGE UPLOAD =================
function initProductEditor() {
  const modal = document.getElementById('product-editor-modal');
  const closeBtn = document.getElementById('close-product-editor-btn');
  const cancelBtn = document.getElementById('cancel-product-editor-btn');
  const fileInput = document.getElementById('form-product-file') as HTMLInputElement;
  const previewImg = document.getElementById('image-live-preview') as HTMLImageElement;
  const placeholderIcon = document.getElementById('image-placeholder-icon');
  const fileNameText = document.getElementById('file-chosen-name');
  const form = document.getElementById('product-editor-form') as HTMLFormElement;

  closeBtn?.addEventListener('click', () => modal?.classList.add('hidden'));
  cancelBtn?.addEventListener('click', () => modal?.classList.add('hidden'));

  // Live File Selection Handler (Converts and shows preview immediately)
  fileInput?.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) {
      selectedImageFile = fileInput.files[0];
      if (fileNameText) fileNameText.textContent = selectedImageFile.name;

      const reader = new FileReader();
      reader.onload = (e) => {
        selectedImageDataUrl = e.target?.result as string;
        if (previewImg) {
          previewImg.src = selectedImageDataUrl;
          previewImg.classList.remove('hidden');
        }
        placeholderIcon?.classList.add('hidden');
      };
      reader.readAsDataURL(selectedImageFile);
    }
  });

  form?.addEventListener('submit', handleSaveProduct);
}

function openProductEditor(productId: string | null = null, defaultCat: string = '', defaultBrand: string = '') {
  const modal = document.getElementById('product-editor-modal');
  const modalTitle = document.getElementById('product-editor-title');
  const idInput = document.getElementById('edit-product-id') as HTMLInputElement;
  const titleInput = document.getElementById('form-product-title') as HTMLInputElement;
  const catSelect = document.getElementById('form-product-category') as HTMLSelectElement;
  const brandInput = document.getElementById('form-product-brand') as HTMLInputElement;
  const priceInput = document.getElementById('form-product-price') as HTMLInputElement;
  const oldPriceInput = document.getElementById('form-product-old-price') as HTMLInputElement;
  const imageInput = document.getElementById('form-product-image') as HTMLInputElement;
  const fileInput = document.getElementById('form-product-file') as HTMLInputElement;
  const previewImg = document.getElementById('image-live-preview') as HTMLImageElement;
  const placeholderIcon = document.getElementById('image-placeholder-icon');
  const fileNameText = document.getElementById('file-chosen-name');

  selectedImageFile = null;
  selectedImageDataUrl = '';
  if (fileInput) fileInput.value = '';
  if (fileNameText) fileNameText.textContent = 'لم يتم اختيار ملف بعد';

  const cpuInput = document.getElementById('form-spec-cpu') as HTMLInputElement;
  const ramInput = document.getElementById('form-spec-ram') as HTMLInputElement;
  const screenInput = document.getElementById('form-spec-screen') as HTMLInputElement;
  const batteryInput = document.getElementById('form-spec-battery') as HTMLInputElement;

  if (productId) {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    if (modalTitle) modalTitle.textContent = 'تعديل الجهاز';
    if (idInput) idInput.value = prod.id;
    if (titleInput) titleInput.value = prod.title;
    if (catSelect) catSelect.value = prod.category;
    if (brandInput) brandInput.value = prod.brand;
    if (priceInput) priceInput.value = String(prod.price);
    if (oldPriceInput) oldPriceInput.value = prod.oldPrice ? String(prod.oldPrice) : '';
    if (imageInput) imageInput.value = prod.image;

    if (previewImg) {
      previewImg.src = prod.image;
      previewImg.classList.remove('hidden');
    }
    placeholderIcon?.classList.add('hidden');

    if (cpuInput) cpuInput.value = prod.specs?.['المعالج'] || '';
    if (ramInput) ramInput.value = prod.specs?.['الذاكرة العشوائية'] || '';
    if (screenInput) screenInput.value = prod.specs?.['الشاشة'] || '';
    if (batteryInput) batteryInput.value = prod.specs?.['البطارية'] || '';
  } else {
    if (modalTitle) modalTitle.textContent = 'إضافة جهاز جديد';
    if (idInput) idInput.value = '';
    (document.getElementById('product-editor-form') as HTMLFormElement)?.reset();
    if (defaultCat && catSelect) catSelect.value = defaultCat;
    if (defaultBrand && brandInput) brandInput.value = defaultBrand;

    previewImg?.classList.add('hidden');
    placeholderIcon?.classList.remove('hidden');
  }

  modal?.classList.remove('hidden');
}

async function handleSaveProduct(e: Event) {
  e.preventDefault();
  const submitBtn = document.getElementById('save-product-submit-btn');
  if (submitBtn) {
    submitBtn.setAttribute('disabled', 'true');
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i><span>جاري الحفظ...</span>';
  }

  try {
    const idInput = document.getElementById('edit-product-id') as HTMLInputElement;
    const title = (document.getElementById('form-product-title') as HTMLInputElement).value.trim();
    const category = (document.getElementById('form-product-category') as HTMLSelectElement).value as ProductCategory;
    const brand = (document.getElementById('form-product-brand') as HTMLInputElement).value.trim();
    const price = Number((document.getElementById('form-product-price') as HTMLInputElement).value);
    const oldPriceVal = (document.getElementById('form-product-old-price') as HTMLInputElement).value;
    const oldPrice = oldPriceVal ? Number(oldPriceVal) : undefined;
    const urlImage = (document.getElementById('form-product-image') as HTMLInputElement).value.trim();

    // IMAGE UPLOAD HANDLING:
    // If a file was selected, upload via uploadImageFile (which never hangs due to fallback)
    let finalImageUrl = urlImage || 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=700&q=80';
    if (selectedImageFile) {
      showAdminToast('جاري معالجة الصورة...');
      finalImageUrl = await uploadImageFile(selectedImageFile);
    } else if (selectedImageDataUrl) {
      finalImageUrl = selectedImageDataUrl;
    }

    const cpu = (document.getElementById('form-spec-cpu') as HTMLInputElement).value.trim();
    const ram = (document.getElementById('form-spec-ram') as HTMLInputElement).value.trim();
    const screen = (document.getElementById('form-spec-screen') as HTMLInputElement).value.trim();
    const battery = (document.getElementById('form-spec-battery') as HTMLInputElement).value.trim();

    const specs: Record<string, string> = {};
    if (cpu) specs['المعالج'] = cpu;
    if (ram) specs['الذاكرة العشوائية'] = ram;
    if (screen) specs['الشاشة'] = screen;
    if (battery) specs['البطارية'] = battery;

    const productId = idInput.value || `prod-${Date.now()}`;
    const existing = products.find(p => p.id === productId);

    const productData: Product = {
      id: productId,
      title,
      category,
      brand,
      price,
      oldPrice,
      discountText: oldPrice && oldPrice > price ? `خصم ${(oldPrice - price).toLocaleString()} د.ع` : undefined,
      badge: 'جديد',
      warranty: 'ضمان وكالة رسمي 12 شهراً',
      image: finalImageUrl,
      inStock: true,
      specs,
      createdAt: existing?.createdAt || Date.now()
    };

    await saveProductToStore(productData);
    await loadAdminData();

    document.getElementById('product-editor-modal')?.classList.add('hidden');
    showAdminToast('تم حفظ الجهاز بنجاح وفوراً!');
  } catch (err) {
    console.error('Save error:', err);
    showAdminToast('حدث خطأ أثناء الحفظ، تم التخزين محلياً');
  } finally {
    if (submitBtn) {
      submitBtn.removeAttribute('disabled');
      submitBtn.innerHTML = '<span>حفظ فوراً</span>';
    }
  }
}

async function deleteProduct(productId: string) {
  const prod = products.find(p => p.id === productId);
  if (!prod) return;

  if (confirm(`هل أنت متأكد من حذف (${prod.title})؟`)) {
    await deleteProductFromStore(productId);
    await loadAdminData();
    showAdminToast('تم حذف الجهاز بنجاح');
  }
}

// ================= INSTAGRAM & REELS =================
function initInstagramAndReels() {
  const instagramInput = document.getElementById('admin-instagram-input') as HTMLInputElement;
  const saveBtn = document.getElementById('save-instagram-btn');

  if (instagramInput) {
    instagramInput.value = getInstagramHandle();
  }

  saveBtn?.addEventListener('click', () => {
    if (instagramInput) {
      saveInstagramHandle(instagramInput.value);
      showAdminToast('تم تحديث حساب الانستغرام بنجاح');
    }
  });

  // Reels
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
  reelForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = (document.getElementById('form-reel-title') as HTMLInputElement).value.trim();
    const thumb = (document.getElementById('form-reel-thumb') as HTMLInputElement).value.trim();
    const video = (document.getElementById('form-reel-video') as HTMLInputElement).value.trim();
    const views = (document.getElementById('form-reel-views') as HTMLInputElement).value.trim() || '1.2K';

    const newReel: Reel = {
      id: `reel-${Date.now()}`,
      title,
      thumbnail: thumb,
      videoUrl: video || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      views,
      category: 'phones',
      createdAt: Date.now()
    };

    await saveReelToStore(newReel);
    await loadAdminData();
    document.getElementById('reel-editor-modal')?.classList.add('hidden');
    reelForm.reset();
    showAdminToast('تمت إضافة الريل بنجاح');
  });

  (window as any).deleteReel = async (id: string) => {
    if (confirm('هل تريد حذف هذا الريل؟')) {
      await deleteReelFromStore(id);
      await loadAdminData();
      showAdminToast('تم حذف الريل');
    }
  };
}

function renderAdminReels() {
  const container = document.getElementById('admin-reels-container');
  if (!container) return;

  container.innerHTML = reels.map(r => `
    <div class="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <img src="${r.thumbnail}" class="w-10 h-12 object-cover rounded-xl bg-slate-100 flex-shrink-0">
        <div>
          <h4 class="font-black text-xs text-slate-800 line-clamp-1">${r.title}</h4>
          <span class="text-[10px] text-pink-600 font-bold">${r.views} مشاهدة</span>
        </div>
      </div>
      <button onclick="window.deleteReel('${r.id}')" class="w-7 h-7 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-xs">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  `).join('');
}

// ================= FIREBASE RULES COPY HELPER =================
function initFirebaseRulesCopy() {
  (window as any).copyRules = (type: 'firestore' | 'storage') => {
    const text = type === 'firestore' ? FIREBASE_FIRESTORE_RULES : FIREBASE_STORAGE_RULES;
    navigator.clipboard.writeText(text).then(() => {
      showAdminToast('تم نسخ القواعد بنجاح! يمكنك الآن لصقها في فايربيس');
    }).catch(() => {
      showAdminToast('تم تحديد القواعد، انسخها يدوياً');
    });
  };

  document.getElementById('admin-reset-defaults-btn')?.addEventListener('click', async () => {
    if (confirm('استعادة جميع الأجهزة والريلز الافتراضية؟')) {
      for (const p of defaultProducts) {
        await saveProductToStore(p);
      }
      for (const r of defaultReels) {
        await saveReelToStore(r);
      }
      await loadAdminData();
      showAdminToast('تمت استعادة الكتالوج بالكامل');
    }
  });
}

// Toast
function showAdminToast(msg: string) {
  const toast = document.getElementById('admin-toast-box');
  if (!toast) return;

  toast.textContent = msg;
  toast.classList.remove('opacity-0', 'pointer-events-none');
  setTimeout(() => {
    toast.classList.add('opacity-0', 'pointer-events-none');
  }, 2200);
}
