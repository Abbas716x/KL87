import { Product, Reel, FilterState, ProductCategory, SortOption } from './types';
import { subscribeToProducts, subscribeToReels, getInstagramHandle } from './firebase';
import { brandsList } from './data/brands';

// State Management
let products: Product[] = [];
let reels: Reel[] = [];
let currentTab: string = 'home';
let previousTab: string = 'home';
let activeProductId: string | null = null;
let currentBannerIndex = 0;
let bannerTimer: any = null;

const bannersData = [
  {
    tag: 'BRAND STORE',
    title: 'أقوى تشكيلة أجهزة وحواسيب ومعدات Gaming',
    desc: 'تخفيضات خاصة وعروض مميزة متوفرة في المعرض',
    image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80'
  },
  {
    tag: 'إصدارات جديدة',
    title: 'آيفون 16 وسامسونج S24 ألترا مع الذكاء الاصطناعي',
    desc: 'ضمان وكالة رسمي سنة كاملة مع فحص المواصفات',
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80'
  },
  {
    tag: 'صوتيات وبلايستيشن',
    title: 'سماعات عازلة للضوضاء وبلايستيشن 5 برو',
    desc: 'أحدث عتاد ترفيهي وصوتي متوفر في المعرض',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'
  }
];

const categoryLabels: Record<string, { label: string; icon: string; emoji: string }> = {
  all: { label: 'الكل 🛒', icon: 'fa-solid fa-shapes', emoji: '🛍️' },
  phones: { label: 'هواتف محمولة', icon: 'fa-solid fa-mobile-screen-button', emoji: '📱' },
  laptops: { label: 'حواسيب ولابتوبات', icon: 'fa-solid fa-laptop', emoji: '💻' },
  tablets: { label: 'أجهزة لوحية', icon: 'fa-solid fa-tablet-screen-button', emoji: '📲' },
  audio: { label: 'سماعات وصوتيات', icon: 'fa-solid fa-headphones', emoji: '🎧' },
  gaming: { label: 'أجهزة ألعاب', icon: 'fa-solid fa-gamepad', emoji: '🎮' },
  monitors: { label: 'شاشات قيمنق', icon: 'fa-solid fa-display', emoji: '🖥️' },
  accessories: { label: 'ملحقات وماوس', icon: 'fa-solid fa-plug', emoji: '⚡' },
  chairs: { label: 'كراسي وطاولات', icon: 'fa-solid fa-chair', emoji: '🪑' }
};

// Global Filter State
const filters: FilterState = {
  category: 'all',
  brand: 'all',
  minPrice: 0,
  maxPrice: 3500000,
  searchQuery: '',
  sortBy: 'newest'
};

export function formatIQD(num: number): string {
  return `${num.toLocaleString('en-US')} د.ع`;
}

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
  initUIEventListeners();
  renderQuickCategories();
  renderFullCategoriesGrid();
  renderBrandsGrid();
  startBannerCarousel();
  loadInstagramUI();

  // REAL-TIME SYNC: Listens to Firestore onSnapshot
  // Any update made by the admin on PC or mobile appears INSTANTLY across all devices!
  subscribeToProducts((updatedProducts) => {
    products = updatedProducts;
    applyFiltersAndRender();

    // If currently viewing a product full screen, refresh its details in real-time
    if (activeProductId) {
      openProductDetails(activeProductId, false);
    }
  });

  subscribeToReels((updatedReels) => {
    reels = updatedReels;
    renderReelsCatalog();
  });

  // Handle browser back button (history navigation)
  window.addEventListener('popstate', (e) => {
    if (activeProductId) {
      backToCatalog(false);
    }
  });
});

function loadInstagramUI() {
  const handle = getInstagramHandle();
  const handleEl = document.getElementById('instagram-header-handle');
  const btnEl = document.getElementById('instagram-link-btn') as HTMLAnchorElement;
  if (handleEl) handleEl.textContent = `@${handle}`;
  if (btnEl) btnEl.href = `https://instagram.com/${handle}`;
}

// Setup Event Listeners
function initUIEventListeners() {
  (window as any).switchTab = switchTab;
  (window as any).selectCategory = (cat: ProductCategory) => {
    filters.category = cat;
    updateCategoryPillsUI();
    switchTab('home');
    applyFiltersAndRender();
  };
  (window as any).selectBrand = (brandName: string) => {
    filters.brand = brandName;
    switchTab('home');
    applyFiltersAndRender();
    showToast(`تمت تصفية المنتجات لماركة: ${brandName}`);
  };

  // Full-Screen Product Details Functions
  (window as any).openProductDetails = (id: string) => openProductDetails(id, true);
  (window as any).backToCatalog = () => backToCatalog(true);
  (window as any).copyProductLink = copyProductLink;

  // Search
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  const clearSearchBtn = document.getElementById('clear-search-btn');

  searchInput?.addEventListener('input', (e) => {
    const val = (e.target as HTMLInputElement).value;
    filters.searchQuery = val;
    if (val.trim()) {
      clearSearchBtn?.classList.remove('hidden');
    } else {
      clearSearchBtn?.classList.add('hidden');
    }
    applyFiltersAndRender();
  });

  clearSearchBtn?.addEventListener('click', () => {
    if (searchInput) {
      searchInput.value = '';
      filters.searchQuery = '';
      clearSearchBtn.classList.add('hidden');
      applyFiltersAndRender();
    }
  });

  // Filter Drawer Toggle
  document.getElementById('toggle-filter-btn')?.addEventListener('click', () => toggleFilterModal(true));
  document.getElementById('quick-sort-btn')?.addEventListener('click', () => toggleFilterModal(true));
  document.getElementById('close-filter-btn')?.addEventListener('click', () => toggleFilterModal(false));

  // Filter inputs
  const filterCatSelect = document.getElementById('filter-category-select') as HTMLSelectElement;
  const filterBrandSelect = document.getElementById('filter-brand-select') as HTMLSelectElement;
  const filterMinInput = document.getElementById('filter-min-price') as HTMLInputElement;
  const filterMaxInput = document.getElementById('filter-max-price') as HTMLInputElement;
  const priceRangeIndicator = document.getElementById('price-range-indicator');

  const updatePriceIndicator = () => {
    const min = Number(filterMinInput?.value) || 0;
    const max = Number(filterMaxInput?.value) || 3500000;
    if (priceRangeIndicator) {
      priceRangeIndicator.textContent = `${min.toLocaleString()} - ${max.toLocaleString()} د.ع`;
    }
  };

  filterMinInput?.addEventListener('input', updatePriceIndicator);
  filterMaxInput?.addEventListener('input', updatePriceIndicator);

  // Sort buttons inside modal
  document.querySelectorAll('#filter-sort-options .sort-chip').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const sortVal = target.getAttribute('data-sort') as SortOption;
      filters.sortBy = sortVal;
      updateSortButtonsUI(sortVal);
    });
  });

  // Apply filters
  document.getElementById('apply-filters-btn')?.addEventListener('click', () => {
    if (filterCatSelect) filters.category = filterCatSelect.value as ProductCategory;
    if (filterBrandSelect) filters.brand = filterBrandSelect.value;
    if (filterMinInput) filters.minPrice = Number(filterMinInput.value) || 0;
    if (filterMaxInput) filters.maxPrice = Number(filterMaxInput.value) || 3500000;

    toggleFilterModal(false);
    updateCategoryPillsUI();
    applyFiltersAndRender();
    showToast('تم تحديث نتائج العرض');
  });

  // Reset filters
  document.getElementById('reset-filters-btn')?.addEventListener('click', () => {
    resetFilters();
    toggleFilterModal(false);
    showToast('تمت إعادة تعيين الفلاتر');
  });

  // Reel Modal Close
  document.getElementById('close-reel-btn')?.addEventListener('click', closeReelModal);
}

function updateSortButtonsUI(currentSort: SortOption) {
  const labels: Record<SortOption, string> = {
    newest: 'الأحدث ⚡',
    'price-asc': 'الأقل سعراً',
    'price-desc': 'الأعلى سعراً',
    popular: 'الأكثر طلباً'
  };
  const labelEl = document.getElementById('current-sort-label');
  if (labelEl) labelEl.textContent = labels[currentSort] || 'الأحدث';

  document.querySelectorAll('#filter-sort-options .sort-chip').forEach((chip) => {
    const val = chip.getAttribute('data-sort');
    if (val === currentSort) {
      chip.className = 'sort-chip p-2 rounded-xl font-bold border border-purple-600 bg-purple-50 text-purple-700 text-right';
    } else {
      chip.className = 'sort-chip p-2 rounded-xl font-bold border border-slate-200 bg-slate-50 text-slate-700 text-right';
    }
  });
}

function resetFilters() {
  filters.category = 'all';
  filters.brand = 'all';
  filters.minPrice = 0;
  filters.maxPrice = 3500000;
  filters.searchQuery = '';
  filters.sortBy = 'newest';

  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  if (searchInput) searchInput.value = '';
  document.getElementById('clear-search-btn')?.classList.add('hidden');

  updateSortButtonsUI('newest');
  updateCategoryPillsUI();
  applyFiltersAndRender();
}

function toggleFilterModal(show: boolean) {
  const modal = document.getElementById('filter-modal');
  if (!modal) return;
  if (show) {
    const filterCatSelect = document.getElementById('filter-category-select') as HTMLSelectElement;
    if (filterCatSelect) filterCatSelect.value = filters.category;

    const filterBrandSelect = document.getElementById('filter-brand-select') as HTMLSelectElement;
    if (filterBrandSelect) filterBrandSelect.value = filters.brand;

    const filterMinInput = document.getElementById('filter-min-price') as HTMLInputElement;
    if (filterMinInput) filterMinInput.value = String(filters.minPrice);

    const filterMaxInput = document.getElementById('filter-max-price') as HTMLInputElement;
    if (filterMaxInput) filterMaxInput.value = String(filters.maxPrice);

    updateSortButtonsUI(filters.sortBy);
    modal.classList.remove('hidden');
  } else {
    modal.classList.add('hidden');
  }
}

// 4 Tabs Switcher: home, categories, brands, discover
export function switchTab(tabId: string) {
  // If product detail is open, close it cleanly
  if (activeProductId) {
    activeProductId = null;
    document.getElementById('page-product-details')?.classList.add('hidden');
    document.getElementById('main-header')?.classList.remove('hidden');
    document.getElementById('bottom-dock-nav')?.classList.remove('hidden');
  }

  currentTab = tabId;
  const pages = ['home', 'categories', 'brands', 'discover'];
  pages.forEach((p) => {
    const el = document.getElementById(`page-${p}`);
    if (el) el.classList.toggle('hidden', p !== tabId);
  });

  // Dock items styling
  pages.forEach((p) => {
    const btn = document.getElementById(`nav-${p}`);
    if (btn) {
      if (p === tabId) {
        btn.className = 'nav-item flex items-center gap-1.5 text-purple-700 font-black text-xs bg-purple-50 px-3.5 py-2 rounded-full transition-all shadow-sm';
      } else {
        btn.className = 'nav-item flex items-center gap-1.5 text-slate-500 font-bold text-xs hover:text-purple-600 px-2.5 py-2 rounded-full transition-all';
      }
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================= FULL-SCREEN PRODUCT DETAILS VIEW (NO MODAL!) =================
export function openProductDetails(productId: string, pushHistory = true) {
  const prod = products.find((p) => p.id === productId);
  if (!prod) return;

  activeProductId = productId;
  previousTab = currentTab;

  // Hide catalog tabs & bottom nav
  ['home', 'categories', 'brands', 'discover'].forEach((p) => {
    document.getElementById(`page-${p}`)?.classList.add('hidden');
  });
  document.getElementById('main-header')?.classList.add('hidden');
  document.getElementById('bottom-dock-nav')?.classList.add('hidden');

  const pageDetails = document.getElementById('page-product-details');
  if (!pageDetails) return;
  pageDetails.classList.remove('hidden');

  // Populate data
  const navBrand = document.getElementById('detail-nav-brand');
  const brandBadge = document.getElementById('detail-brand-badge');
  const imgEl = document.getElementById('detail-image') as HTMLImageElement;
  const titleEl = document.getElementById('detail-title');
  const titleEnEl = document.getElementById('detail-title-en');
  const priceEl = document.getElementById('detail-price');
  const oldPriceEl = document.getElementById('detail-old-price');
  const discountTag = document.getElementById('detail-discount-tag');
  const warrantyEl = document.getElementById('detail-warranty');
  const specsContainer = document.getElementById('detail-specs-container');

  if (navBrand) navBrand.textContent = prod.brand;
  if (brandBadge) brandBadge.textContent = prod.brand;
  if (imgEl) {
    imgEl.src = prod.image;
    imgEl.onerror = () => {
      imgEl.src = 'https://via.placeholder.com/400/FAF9FE/6C5CE7?text=BRAND+STORE';
    };
  }
  if (titleEl) titleEl.textContent = prod.title;
  if (titleEnEl) titleEnEl.textContent = prod.titleEn || prod.brand;
  if (priceEl) priceEl.textContent = formatIQD(prod.price);

  if (oldPriceEl) {
    if (prod.oldPrice && prod.oldPrice > prod.price) {
      oldPriceEl.textContent = formatIQD(prod.oldPrice);
      oldPriceEl.classList.remove('hidden');
    } else {
      oldPriceEl.classList.add('hidden');
    }
  }

  if (discountTag) {
    if (prod.discountText) {
      discountTag.textContent = prod.discountText;
      discountTag.classList.remove('hidden');
    } else if (prod.oldPrice && prod.oldPrice > prod.price) {
      discountTag.textContent = `وفر ${(prod.oldPrice - prod.price).toLocaleString()} د.ع`;
      discountTag.classList.remove('hidden');
    } else {
      discountTag.classList.add('hidden');
    }
  }

  if (warrantyEl) warrantyEl.textContent = prod.warranty || 'ضمان وكالة رسمي 12 شهراً';

  // Render Full Specs Grid Cards
  if (specsContainer) {
    const specsEntries = Object.entries(prod.specs || {});
    if (specsEntries.length === 0) {
      specsContainer.innerHTML = `
        <div class="p-4 bg-slate-50 rounded-2xl text-center text-slate-500 font-bold text-xs">
          جميع ملحقات ومواصفات الجهاز أصلية 100% مع ضمان معتمد.
        </div>
      `;
    } else {
      specsContainer.innerHTML = specsEntries.map(([k, v]) => `
        <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-purple-200 transition">
          <span class="font-bold text-slate-600 flex items-center gap-2">
            <i class="fa-solid fa-angle-left text-purple-500 text-[10px]"></i>
            <span>${k}</span>
          </span>
          <span class="font-black text-purple-700 text-left dir-ltr">${v}</span>
        </div>
      `).join('');
    }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (pushHistory) {
    history.pushState({ productId }, '', `#device-${productId}`);
  }
}

export function backToCatalog(updateHistory = true) {
  activeProductId = null;
  document.getElementById('page-product-details')?.classList.add('hidden');
  document.getElementById('main-header')?.classList.remove('hidden');
  document.getElementById('bottom-dock-nav')?.classList.remove('hidden');

  switchTab(previousTab || 'home');

  if (updateHistory && window.location.hash.startsWith('#device-')) {
    history.pushState(null, '', window.location.pathname);
  }
}

function copyProductLink() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    showToast('تم نسخ رابط مواصفات الجهاز بنجاح!');
  }).catch(() => {
    showToast('مواصفات الجهاز جاهزة للمشاركة');
  });
}

// Render Quick Category Horizontal Carousel
function renderQuickCategories() {
  const container = document.getElementById('quick-category-pills');
  if (!container) return;

  const categories: ProductCategory[] = [
    'all',
    'phones',
    'laptops',
    'tablets',
    'audio',
    'gaming',
    'monitors',
    'accessories',
    'chairs'
  ];

  container.innerHTML = categories.map((cat) => {
    const info = categoryLabels[cat];
    const isActive = filters.category === cat;
    const activeClasses = isActive
      ? 'bg-purple-600 text-white shadow-sm'
      : 'bg-white text-slate-700 border border-slate-200/80';
    return `
      <button 
        onclick="window.selectCategory('${cat}')" 
        class="cat-pill whitespace-nowrap text-xs font-bold px-4 py-2 rounded-xl transition ${activeClasses}"
        data-cat="${cat}"
      >
        <span>${info.label}</span>
      </button>
    `;
  }).join('');
}

function updateCategoryPillsUI() {
  document.querySelectorAll('.cat-pill').forEach((btn) => {
    const cat = btn.getAttribute('data-cat');
    if (cat === filters.category) {
      btn.className = 'cat-pill whitespace-nowrap text-xs font-bold px-4 py-2 rounded-xl transition bg-purple-600 text-white shadow-sm';
    } else {
      btn.className = 'cat-pill whitespace-nowrap text-xs font-bold px-4 py-2 rounded-xl transition bg-white text-slate-700 border border-slate-200/80';
    }
  });
}

// Render Categories Grid (in Categories Tab)
function renderFullCategoriesGrid() {
  const grid = document.getElementById('categories-full-grid');
  if (!grid) return;

  const categories: ProductCategory[] = [
    'phones',
    'laptops',
    'tablets',
    'audio',
    'gaming',
    'monitors',
    'accessories',
    'chairs'
  ];

  const catDetails: Record<string, { desc: string; emoji: string }> = {
    phones: { desc: 'آيفون، سامسونج', emoji: '📱' },
    laptops: { desc: 'Gaming, Work', emoji: '💻' },
    tablets: { desc: 'آيباد، تابلت', emoji: '📲' },
    audio: { desc: 'Sony, JBL, Anker', emoji: '🎧' },
    gaming: { desc: 'PlayStation, Switch', emoji: '🎮' },
    monitors: { desc: '4K, 165Hz', emoji: '🖥️' },
    accessories: { desc: 'شواحن، ماوس، أقلام', emoji: '✏️' },
    chairs: { desc: 'DXRacer, مكاتب', emoji: '🪑' }
  };

  grid.innerHTML = categories.map((cat) => {
    const info = categoryLabels[cat];
    const details = catDetails[cat] || { desc: '', emoji: '✨' };
    return `
      <div 
        onclick="window.selectCategory('${cat}')" 
        class="karada-card p-3.5 flex items-center justify-between cursor-pointer hover:border-purple-300 transition group"
      >
        <div>
          <h3 class="font-bold text-xs text-slate-800 group-hover:text-purple-600 transition">${info.label.replace(' 🛒', '')}</h3>
          <span class="text-[10px] text-slate-400">${details.desc}</span>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-xl shadow-sm">
          ${details.emoji}
        </div>
      </div>
    `;
  }).join('');
}

// Render Brands Grid (in Brands Tab)
function renderBrandsGrid() {
  const grid = document.getElementById('brands-full-grid');
  if (!grid) return;

  grid.innerHTML = brandsList.map((b) => {
    const count = products.filter((p) => p.brand.toLowerCase() === b.name.toLowerCase()).length;
    return `
      <div 
        onclick="window.selectBrand('${b.name}')" 
        class="karada-card p-3 flex flex-col items-center justify-center gap-1.5 hover:border-purple-300 cursor-pointer transition group"
      >
        <div class="w-11 h-11 flex items-center justify-center">
          <img src="${b.logo}" alt="${b.name}" class="max-h-full max-w-full object-contain" onerror="this.src='https://via.placeholder.com/80/ffffff/6C5CE7?text=${b.name}'">
        </div>
        <span class="text-[10px] font-bold text-slate-700 truncate w-full text-center group-hover:text-purple-600">${b.name}</span>
        <span class="text-[9px] text-purple-600 font-bold">${count > 0 ? `${count} جهاز` : 'معتمد'}</span>
      </div>
    `;
  }).join('');
}

// Filter and Sort Engine
export function applyFiltersAndRender() {
  let list = [...products];

  if (filters.category !== 'all') {
    list = list.filter((p) => p.category === filters.category);
  }

  if (filters.brand !== 'all') {
    list = list.filter((p) => p.brand.toLowerCase() === filters.brand.toLowerCase());
  }

  list = list.filter((p) => p.price >= filters.minPrice && p.price <= filters.maxPrice);

  if (filters.searchQuery.trim()) {
    const q = filters.searchQuery.toLowerCase().trim();
    list = list.filter((p) => {
      const titleMatch = p.title.toLowerCase().includes(q);
      const enMatch = (p.titleEn || '').toLowerCase().includes(q);
      const brandMatch = p.brand.toLowerCase().includes(q);
      const specsMatch = Object.entries(p.specs || {}).some(
        ([k, v]) => k.toLowerCase().includes(q) || v.toLowerCase().includes(q)
      );
      return titleMatch || enMatch || brandMatch || specsMatch;
    });
  }

  switch (filters.sortBy) {
    case 'newest':
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      break;
    case 'price-asc':
      list.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      list.sort((a, b) => b.price - a.price);
      break;
    case 'popular':
      list.sort((a, b) => (b.oldPrice || b.price) - (a.oldPrice || a.price));
      break;
  }

  let activeCount = 0;
  if (filters.category !== 'all') activeCount++;
  if (filters.brand !== 'all') activeCount++;
  if (filters.minPrice > 0 || filters.maxPrice < 3500000) activeCount++;
  if (filters.searchQuery.trim()) activeCount++;
  if (filters.sortBy !== 'newest') activeCount++;

  const activeCountEl = document.getElementById('active-filter-count');
  if (activeCountEl) {
    if (activeCount > 0) {
      activeCountEl.textContent = String(activeCount);
      activeCountEl.classList.remove('hidden');
    } else {
      activeCountEl.classList.add('hidden');
    }
  }

  renderActiveFilterChips();

  const countBadge = document.getElementById('products-count-badge');
  if (countBadge) {
    countBadge.textContent = `${list.length} جهاز`;
  }

  renderProductsGrid(list);
}

function renderActiveFilterChips() {
  const container = document.getElementById('active-filter-chips');
  if (!container) return;

  const chips: { label: string; onRemove: () => void }[] = [];

  if (filters.category !== 'all') {
    chips.push({
      label: `${categoryLabels[filters.category]?.label || filters.category}`,
      onRemove: () => {
        filters.category = 'all';
        updateCategoryPillsUI();
        applyFiltersAndRender();
      }
    });
  }

  if (filters.brand !== 'all') {
    chips.push({
      label: `ماركة: ${filters.brand}`,
      onRemove: () => {
        filters.brand = 'all';
        applyFiltersAndRender();
      }
    });
  }

  if (filters.minPrice > 0 || filters.maxPrice < 3500000) {
    chips.push({
      label: `${filters.minPrice.toLocaleString()} - ${filters.maxPrice.toLocaleString()} د.ع`,
      onRemove: () => {
        filters.minPrice = 0;
        filters.maxPrice = 3500000;
        applyFiltersAndRender();
      }
    });
  }

  if (filters.searchQuery.trim()) {
    chips.push({
      label: `"${filters.searchQuery}"`,
      onRemove: () => {
        filters.searchQuery = '';
        const searchInput = document.getElementById('search-input') as HTMLInputElement;
        if (searchInput) searchInput.value = '';
        document.getElementById('clear-search-btn')?.classList.add('hidden');
        applyFiltersAndRender();
      }
    });
  }

  if (chips.length === 0) {
    container.classList.add('hidden');
    container.innerHTML = '';
    return;
  }

  container.classList.remove('hidden');
  container.innerHTML = `
    ${chips.map((chip, idx) => `
      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
        <span>${chip.label}</span>
        <button onclick="window._removeFilterChip(${idx})" class="text-purple-400 hover:text-purple-700">
          <i class="fa-solid fa-xmark text-[10px]"></i>
        </button>
      </span>
    `).join('')}
    <button onclick="window._resetAllFilters()" class="text-xs text-slate-500 hover:text-purple-700 font-bold px-1 underline">
      مسح الفلاتر
    </button>
  `;

  (window as any)._removeFilterChip = (idx: number) => {
    chips[idx]?.onRemove();
  };
  (window as any)._resetAllFilters = () => {
    resetFilters();
  };
}

// Render Products Grid (Luxury Rectangular Karada Card - 100% Display Only)
function renderProductsGrid(list: Product[]) {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="col-span-2 sm:col-span-3 md:col-span-4 text-center py-12 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <i class="fa-solid fa-box-open text-4xl text-slate-300 mb-2 block"></i>
        <p class="text-xs text-slate-500 font-bold">لا توجد أجهزة مطابقة للفلاتر المحددة حالياً</p>
        <button onclick="window._resetAllFilters()" class="mt-3 px-4 py-2 bg-purple-50 text-purple-700 rounded-full font-bold text-xs hover:bg-purple-100 transition">
          عرض جميع الأجهزة
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = list.map((prod) => `
    <div class="karada-card p-3 flex flex-col justify-between group">
      
      <!-- Top Tag (Discount / Badge) -->
      ${prod.discountText ? `
        <span class="absolute top-3 right-3 bg-purple-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full z-10 shadow-sm">
          ${prod.discountText}
        </span>
      ` : prod.badge ? `
        <span class="absolute top-3 right-3 bg-amber-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full z-10 shadow-sm">
          ${prod.badge}
        </span>
      ` : ''}

      <!-- Centered Luxury Image Frame -->
      <div 
        onclick="window.openProductDetails('${prod.id}')"
        class="karada-img-frame h-36 w-full p-2 mb-2.5 cursor-pointer"
      >
        <img 
          src="${prod.image}" 
          alt="${prod.title}" 
          class="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300"
          onerror="this.src='https://via.placeholder.com/200/FAF9FE/6C5CE7?text=BRAND+STORE'"
        />
      </div>

      <!-- Info -->
      <div>
        <h3 
          onclick="window.openProductDetails('${prod.id}')" 
          class="font-black text-xs text-slate-800 line-clamp-2 leading-snug cursor-pointer hover:text-purple-700 transition"
        >
          ${prod.title}
        </h3>
        
        <!-- Price in Iraqi Dinars -->
        <div class="mt-2 flex items-baseline gap-1.5 flex-wrap">
          <span class="text-purple-700 font-black text-xs sm:text-sm">${formatIQD(prod.price)}</span>
          ${prod.oldPrice ? `<span class="text-[10px] text-slate-400 line-through font-bold">${formatIQD(prod.oldPrice)}</span>` : ''}
        </div>

        <!-- Brand Tag & Full-Screen Specs Button -->
        <div class="mt-2.5 flex items-center justify-between">
          <span class="text-[10px] font-bold text-slate-400">${prod.brand || 'Original'}</span>
          <button 
            onclick="window.openProductDetails('${prod.id}')" 
            class="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-700 font-black text-[10px] transition flex items-center gap-1 active:scale-95 shadow-sm"
          >
            <i class="fa-solid fa-circle-info text-[9px]"></i>
            <span>المواصفات</span>
          </button>
        </div>
      </div>

    </div>
  `).join('');
}

// Render Discover / Reels Grid
function renderReelsCatalog() {
  const container = document.getElementById('reels-catalog-grid');
  if (!container) return;

  container.innerHTML = reels.map((r) => `
    <div 
      onclick="window.openReelVideo('${r.id}')" 
      class="relative rounded-3xl overflow-hidden h-48 bg-slate-900 shadow-sm group cursor-pointer border border-slate-100"
    >
      <img src="${r.thumbnail}" alt="${r.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90">
      <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex flex-col justify-between p-3 text-white">
        
        <div class="flex justify-between items-center">
          <span class="text-[10px] font-bold flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full">
            <i class="fa-solid fa-play text-[8px]"></i> ${r.views}
          </span>
          <i class="fa-brands fa-instagram text-white/90 text-sm"></i>
        </div>

        <div>
          <p class="text-[11px] font-black line-clamp-2 leading-tight drop-shadow">${r.title}</p>
          ${r.productTitle ? `
            <span class="text-[9px] text-amber-300 font-bold block truncate mt-0.5">${r.productTitle}</span>
          ` : ''}
        </div>

      </div>
    </div>
  `).join('');

  (window as any).openReelVideo = openReelVideo;
}

function openReelVideo(reelId: string) {
  const reel = reels.find((r) => r.id === reelId);
  if (!reel) return;

  const modal = document.getElementById('reel-modal');
  const titleEl = document.getElementById('reel-title-preview');
  const viewsEl = document.getElementById('reel-views-preview');
  const videoEl = document.getElementById('reel-video-element') as HTMLVideoElement;
  const viewProductBtn = document.getElementById('reel-view-product-btn');

  if (titleEl) titleEl.textContent = reel.title;
  if (viewsEl) viewsEl.textContent = `${reel.views} مشاهدة`;

  if (videoEl) {
    videoEl.src = reel.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
    videoEl.load();
    videoEl.play().catch(() => {});
  }

  if (viewProductBtn) {
    if (reel.productId) {
      viewProductBtn.onclick = () => {
        closeReelModal();
        openProductDetails(reel.productId!, true);
      };
      viewProductBtn.classList.remove('hidden');
    } else {
      viewProductBtn.classList.add('hidden');
    }
  }

  modal?.classList.remove('hidden');
}

function closeReelModal() {
  const modal = document.getElementById('reel-modal');
  const videoEl = document.getElementById('reel-video-element') as HTMLVideoElement;
  if (videoEl) {
    videoEl.pause();
    videoEl.currentTime = 0;
  }
  modal?.classList.add('hidden');
}

// Banner Slider
function startBannerCarousel() {
  const slider = document.getElementById('banner-slider');
  const headline = document.getElementById('banner-headline');
  const subtitle = document.getElementById('banner-subtitle');
  const tagEl = document.getElementById('banner-tag');
  const dotsContainer = document.getElementById('banner-dots');

  const updateBanner = (idx: number) => {
    currentBannerIndex = idx;
    const item = bannersData[idx];
    if (slider) {
      slider.style.backgroundImage = `linear-gradient(to top, rgba(15, 23, 42, 0.9) 10%, rgba(15, 23, 42, 0.3) 60%, transparent 100%), url('${item.image}')`;
    }
    if (headline) headline.textContent = item.title;
    if (subtitle) subtitle.textContent = item.desc;
    if (tagEl) tagEl.textContent = item.tag;

    if (dotsContainer) {
      dotsContainer.innerHTML = bannersData.map((_, i) => `
        <button 
          onclick="window._goToBanner(${i})" 
          class="${i === idx ? 'w-5 h-1.5 rounded-full bg-amber-400' : 'w-1.5 h-1.5 rounded-full bg-white/50'} transition-all"
        ></button>
      `).join('');
    }
  };

  (window as any)._goToBanner = (idx: number) => {
    clearInterval(bannerTimer);
    updateBanner(idx);
    startInterval();
  };

  const startInterval = () => {
    bannerTimer = setInterval(() => {
      const nextIdx = (currentBannerIndex + 1) % bannersData.length;
      updateBanner(nextIdx);
    }, 6000);
  };

  updateBanner(0);
  startInterval();
}

// Toast
export function showToast(message: string) {
  const toast = document.getElementById('toast-box');
  const text = document.getElementById('toast-text');
  if (!toast || !text) return;

  text.textContent = message;
  toast.classList.remove('opacity-0', 'pointer-events-none');
  setTimeout(() => {
    toast.classList.add('opacity-0', 'pointer-events-none');
  }, 2200);
}
