import { Product, Reel, FilterState, ProductCategory, SortOption } from './types';
import { fetchProducts, fetchReels } from './firebase';
import { brandsList } from './data/brands';

// State Management
let products: Product[] = [];
let reels: Reel[] = [];
let currentTab: string = 'home';
let selectedProductForModal: Product | null = null;
let currentBannerIndex = 0;
let bannerTimer: any = null;

const bannersData = [
  {
    tag: 'BRAND STORE EXCLUSIVE',
    subtitle: 'معرض خريف 2026 للأجهزة المعتمدة',
    title: 'أقوى تشكيلة أجهزة قيمنق وحواسيب M3 معتمدة',
    desc: 'استعرض أحدث المواصفات التقنية والأسعار الرسمية بالدينار العراقي بدقة واحترافية.',
    image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=80'
  },
  {
    tag: 'NEW ARRIVALS ⚡',
    subtitle: 'أحدث الهواتف الذكية مع الذكاء الاصطناعي',
    title: 'آيفون 16 برو ماكس وسامسونج S24 ألترا',
    desc: 'فحص كامل للعتاد والمواصفات مع بطاقة ضمان رسمية معتمدة.',
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=80'
  },
  {
    tag: 'AUDIO & GAMING 🎧',
    subtitle: 'صوتيات نقية وأنظمة كونسول متطورة',
    title: 'سماعات Sony WH-1000XM5 وبلايستيشن 5 برو',
    desc: 'أفضل تجربة عزل ضوضاء وأداء رسومي 4K بتردد 120Hz.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80'
  }
];

const categoryLabels: Record<string, { label: string; icon: string }> = {
  all: { label: 'الكل', icon: 'fa-solid fa-layer-group' },
  phones: { label: 'الهواتف المحمولة', icon: 'fa-solid fa-mobile-screen-button' },
  laptops: { label: 'حواسيب ولابتوبات', icon: 'fa-solid fa-laptop' },
  tablets: { label: 'أجهزة لوحية', icon: 'fa-solid fa-tablet-screen-button' },
  audio: { label: 'سماعات وصوتيات', icon: 'fa-solid fa-headphones' },
  gaming: { label: 'أجهزة ألعاب', icon: 'fa-solid fa-gamepad' },
  monitors: { label: 'شاشات قيمنق', icon: 'fa-solid fa-display' },
  accessories: { label: 'ملحقات وشواحن', icon: 'fa-solid fa-plug' },
  chairs: { label: 'كراسي وطاولات', icon: 'fa-solid fa-chair' }
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

// Format Iraqi Dinar
export function formatIQD(num: number): string {
  return `${num.toLocaleString('en-US')} د.ع`;
}

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  initUIEventListeners();
  renderQuickCategories();
  renderFullCategoriesGrid();
  renderBrandsGrid();
  startBannerCarousel();

  // Load Data from Firebase / Cache
  try {
    showToast('جاري تحميل كتالوج المعرض...', 'info');
    products = await fetchProducts();
    reels = await fetchReels();
    applyFiltersAndRender();
    renderReelsCatalog();
  } catch (err) {
    console.error('Initial load error:', err);
    showToast('تم تحميل الكتالوج من الذاكرة المحلية', 'check');
    applyFiltersAndRender();
  }
});

// Setup All DOM Event Listeners
function initUIEventListeners() {
  // Navigation Tabs
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
  (window as any).viewProductSpecs = viewProductSpecs;

  // Header Logo click -> reset to home
  document.getElementById('header-logo-btn')?.addEventListener('click', () => {
    resetFilters();
    switchTab('home');
  });

  // Search Input
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

  // Quick Sort dropdown on header / catalog toolbar
  const catalogSortSelect = document.getElementById('catalog-sort') as HTMLSelectElement;
  catalogSortSelect?.addEventListener('change', (e) => {
    const val = (e.target as HTMLSelectElement).value as SortOption;
    filters.sortBy = val;
    updateSortButtonsUI(val);
    applyFiltersAndRender();
  });

  document.getElementById('quick-sort-btn')?.addEventListener('click', () => {
    toggleFilterModal(true);
  });

  // Filter Drawer Toggle
  document.getElementById('toggle-filter-btn')?.addEventListener('click', () => {
    toggleFilterModal(true);
  });
  document.getElementById('close-filter-btn')?.addEventListener('click', () => {
    toggleFilterModal(false);
  });

  // Filter Select Elements inside Modal
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

  // Price preset chips in modal
  document.querySelectorAll('.price-chip').forEach((chip) => {
    chip.addEventListener('click', (e) => {
      const btn = e.currentTarget as HTMLElement;
      const min = Number(btn.getAttribute('data-min'));
      const max = Number(btn.getAttribute('data-max'));
      if (filterMinInput) filterMinInput.value = String(min);
      if (filterMaxInput) filterMaxInput.value = String(max);
      updatePriceIndicator();

      document.querySelectorAll('.price-chip').forEach(c => {
        c.className = 'price-chip px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-300 hover:bg-slate-700';
      });
      btn.className = 'price-chip px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-600 text-white';
    });
  });

  // Sort buttons inside modal
  document.querySelectorAll('#filter-sort-options .sort-chip').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const sortVal = target.getAttribute('data-sort') as SortOption;
      filters.sortBy = sortVal;
      updateSortButtonsUI(sortVal);
    });
  });

  // Apply filters button
  document.getElementById('apply-filters-btn')?.addEventListener('click', () => {
    if (filterCatSelect) filters.category = filterCatSelect.value as ProductCategory;
    if (filterBrandSelect) filters.brand = filterBrandSelect.value;
    if (filterMinInput) filters.minPrice = Number(filterMinInput.value) || 0;
    if (filterMaxInput) filters.maxPrice = Number(filterMaxInput.value) || 3500000;

    toggleFilterModal(false);
    updateCategoryPillsUI();
    applyFiltersAndRender();
    showToast('تم تحديث نتائج الكتالوج');
  });

  // Reset filters button
  document.getElementById('reset-filters-btn')?.addEventListener('click', () => {
    resetFilters();
    toggleFilterModal(false);
    showToast('تمت إعادة تعيين الفلاتر');
  });

  // Product Modal Close Buttons
  document.getElementById('close-product-modal-btn')?.addEventListener('click', () => {
    closeProductModal();
  });
  document.getElementById('modal-done-btn')?.addEventListener('click', () => {
    closeProductModal();
  });

  // Reel Modal Close
  document.getElementById('close-reel-btn')?.addEventListener('click', () => {
    closeReelModal();
  });
}

function updateSortButtonsUI(currentSort: SortOption) {
  const catalogSortSelect = document.getElementById('catalog-sort') as HTMLSelectElement;
  if (catalogSortSelect) catalogSortSelect.value = currentSort;

  const quickSortLabel = document.getElementById('current-sort-label');
  const labels: Record<SortOption, string> = {
    newest: 'الأحدث ⚡',
    'price-asc': 'الأقل سعراً ⬆️',
    'price-desc': 'الأعلى سعراً ⬇️',
    popular: 'الأكثر طلباً ⭐'
  };
  if (quickSortLabel) quickSortLabel.textContent = labels[currentSort] || 'الترتيب';

  document.querySelectorAll('#filter-sort-options .sort-chip').forEach((chip) => {
    const val = chip.getAttribute('data-sort');
    if (val === currentSort) {
      chip.className = 'sort-chip p-2.5 rounded-xl text-xs font-bold border border-indigo-500/50 bg-indigo-600/30 text-white text-right flex items-center justify-between';
    } else {
      chip.className = 'sort-chip p-2.5 rounded-xl text-xs font-bold border border-slate-700 bg-slate-800 text-slate-300 text-right flex items-center justify-between';
    }
  });
}

// Reset all filters to default
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

  const filterCatSelect = document.getElementById('filter-category-select') as HTMLSelectElement;
  if (filterCatSelect) filterCatSelect.value = 'all';

  const filterBrandSelect = document.getElementById('filter-brand-select') as HTMLSelectElement;
  if (filterBrandSelect) filterBrandSelect.value = 'all';

  const filterMinInput = document.getElementById('filter-min-price') as HTMLInputElement;
  if (filterMinInput) filterMinInput.value = '0';

  const filterMaxInput = document.getElementById('filter-max-price') as HTMLInputElement;
  if (filterMaxInput) filterMaxInput.value = '3500000';

  updateSortButtonsUI('newest');
  updateCategoryPillsUI();
  applyFiltersAndRender();
}

// Toggle Filter Modal
function toggleFilterModal(show: boolean) {
  const modal = document.getElementById('filter-modal');
  if (!modal) return;
  if (show) {
    // Sync current values to modal controls
    const filterCatSelect = document.getElementById('filter-category-select') as HTMLSelectElement;
    if (filterCatSelect) filterCatSelect.value = filters.category;

    const filterBrandSelect = document.getElementById('filter-brand-select') as HTMLSelectElement;
    if (filterBrandSelect) filterBrandSelect.value = filters.brand;

    const filterMinInput = document.getElementById('filter-min-price') as HTMLInputElement;
    if (filterMinInput) filterMinInput.value = String(filters.minPrice);

    const filterMaxInput = document.getElementById('filter-max-price') as HTMLInputElement;
    if (filterMaxInput) filterMaxInput.value = String(filters.maxPrice);

    const priceRangeIndicator = document.getElementById('price-range-indicator');
    if (priceRangeIndicator) {
      priceRangeIndicator.textContent = `${filters.minPrice.toLocaleString()} - ${filters.maxPrice.toLocaleString()} د.ع`;
    }

    updateSortButtonsUI(filters.sortBy);
    modal.classList.remove('hidden');
  } else {
    modal.classList.add('hidden');
  }
}

// Tab Switcher
export function switchTab(tabId: string) {
  currentTab = tabId;
  const pages = ['home', 'categories', 'brands', 'discover', 'more'];
  pages.forEach(p => {
    const el = document.getElementById(`page-${p}`);
    if (el) el.classList.toggle('hidden', p !== tabId);
  });

  // Update Bottom Dock Nav Styling
  pages.forEach(p => {
    const btn = document.getElementById(`nav-${p}`);
    if (btn) {
      if (p === tabId) {
        btn.className = 'nav-btn active flex flex-col sm:flex-row items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-all text-amber-400 bg-amber-400/10 shadow-sm';
      } else {
        btn.className = 'nav-btn flex flex-col sm:flex-row items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-all text-slate-400 hover:text-white';
      }
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
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

  container.innerHTML = categories.map(cat => {
    const info = categoryLabels[cat];
    const isActive = filters.category === cat;
    const activeClasses = isActive
      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border-indigo-500'
      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border-slate-700/80';
    return `
      <button 
        onclick="window.selectCategory('${cat}')" 
        class="cat-pill whitespace-nowrap text-xs font-bold px-3.5 py-2 rounded-xl border flex items-center gap-1.5 transition-all ${activeClasses}"
        data-cat="${cat}"
      >
        <i class="${info.icon} text-[11px]"></i>
        <span>${info.label}</span>
      </button>
    `;
  }).join('');
}

function updateCategoryPillsUI() {
  document.querySelectorAll('.cat-pill').forEach(btn => {
    const cat = btn.getAttribute('data-cat');
    if (cat === filters.category) {
      btn.className = 'cat-pill whitespace-nowrap text-xs font-bold px-3.5 py-2 rounded-xl border flex items-center gap-1.5 transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border-indigo-500';
    } else {
      btn.className = 'cat-pill whitespace-nowrap text-xs font-bold px-3.5 py-2 rounded-xl border flex items-center gap-1.5 transition-all bg-slate-800/80 text-slate-300 hover:bg-slate-700 border-slate-700/80';
    }
  });
}

// Render Categories Full Grid (in Categories Tab)
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
    phones: { desc: 'آيفون، سامسونج، شاومي', emoji: '📱' },
    laptops: { desc: 'MacBook، Legion، ROG', emoji: '💻' },
    tablets: { desc: 'iPad Pro، Galaxy Tab', emoji: '📲' },
    audio: { desc: 'سماعات رأس، عزل صوتي', emoji: '🎧' },
    gaming: { desc: 'PlayStation 5، كونسول', emoji: '🎮' },
    monitors: { desc: 'شاشات منحنية 165Hz-240Hz', emoji: '🖥️' },
    accessories: { desc: 'شواحن GaN، ماوس، كيبلات', emoji: '⚡' },
    chairs: { desc: 'كراسي قيمنق ومكاتب', emoji: '🪑' }
  };

  grid.innerHTML = categories.map(cat => {
    const info = categoryLabels[cat];
    const details = catDetails[cat] || { desc: '', emoji: '✨' };
    return `
      <div 
        onclick="window.selectCategory('${cat}')" 
        class="glass-card p-4 rounded-2xl cursor-pointer hover:border-indigo-400 group transition flex flex-col justify-between"
      >
        <div class="flex items-center justify-between">
          <span class="text-2xl">${details.emoji}</span>
          <i class="fa-solid fa-arrow-left text-xs text-slate-500 group-hover:text-indigo-400 group-hover:-translate-x-1 transition"></i>
        </div>
        <div class="mt-3">
          <h4 class="font-extrabold text-white text-sm group-hover:text-indigo-300 transition">${info.label}</h4>
          <p class="text-[11px] text-slate-400 mt-0.5 truncate">${details.desc}</p>
        </div>
      </div>
    `;
  }).join('');
}

// Render Brands Grid (in Brands Tab)
function renderBrandsGrid() {
  const grid = document.getElementById('brands-full-grid');
  if (!grid) return;

  grid.innerHTML = brandsList.map(b => {
    const count = products.filter(p => p.brand.toLowerCase() === b.name.toLowerCase()).length;
    return `
      <div 
        onclick="window.selectBrand('${b.name}')" 
        class="glass-card p-3 rounded-2xl cursor-pointer text-center group flex flex-col items-center justify-center gap-2 hover:border-amber-400 transition"
      >
        <div class="w-12 h-12 rounded-xl bg-white/95 p-2 flex items-center justify-center shadow-sm group-hover:scale-105 transition">
          <img src="${b.logo}" alt="${b.name}" class="max-h-full max-w-full object-contain" onerror="this.src='https://via.placeholder.com/80/ffffff/0F172A?text=${b.name}'">
        </div>
        <div>
          <span class="font-extrabold text-xs text-slate-200 group-hover:text-amber-400 transition block truncate">${b.name}</span>
          <span class="text-[10px] text-slate-400">${count > 0 ? `${count} جهاز بالكتالوج` : 'وكالة معتمدة'}</span>
        </div>
      </div>
    `;
  }).join('');
}

// Filter and Sort Engine
export function applyFiltersAndRender() {
  let list = [...products];

  // 1. Category Filter
  if (filters.category !== 'all') {
    list = list.filter(p => p.category === filters.category);
  }

  // 2. Brand Filter
  if (filters.brand !== 'all') {
    list = list.filter(p => p.brand.toLowerCase() === filters.brand.toLowerCase());
  }

  // 3. Price Range Filter
  list = list.filter(p => p.price >= filters.minPrice && p.price <= filters.maxPrice);

  // 4. Search Query Filter
  if (filters.searchQuery.trim()) {
    const q = filters.searchQuery.toLowerCase().trim();
    list = list.filter(p => {
      const titleMatch = p.title.toLowerCase().includes(q);
      const enMatch = (p.titleEn || '').toLowerCase().includes(q);
      const brandMatch = p.brand.toLowerCase().includes(q);
      const specsMatch = Object.entries(p.specs || {}).some(
        ([k, v]) => k.toLowerCase().includes(q) || v.toLowerCase().includes(q)
      );
      return titleMatch || enMatch || brandMatch || specsMatch;
    });
  }

  // 5. Sorting Engine
  switch (filters.sortBy) {
    case 'newest':
      // Sort by arrival date (newest first)
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      break;
    case 'price-asc':
      // Price low to high
      list.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      // Price high to low
      list.sort((a, b) => b.price - a.price);
      break;
    case 'popular':
      // Featured items first, then by discount
      list.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return (b.oldPrice || b.price) - (a.oldPrice || a.price);
      });
      break;
  }

  // Update active filter count badge
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

  // Render Active Filter Chips
  renderActiveFilterChips();

  // Render Results Count Badge
  const countBadge = document.getElementById('products-count-badge');
  if (countBadge) {
    countBadge.textContent = `${list.length} جهاز متوفر`;
  }

  // Render Catalog Grid
  renderProductsGrid(list);
}

// Render Active Filter Chips Bar
function renderActiveFilterChips() {
  const container = document.getElementById('active-filter-chips');
  if (!container) return;

  const chips: { label: string; onRemove: () => void }[] = [];

  if (filters.category !== 'all') {
    chips.push({
      label: `القسم: ${categoryLabels[filters.category]?.label || filters.category}`,
      onRemove: () => {
        filters.category = 'all';
        updateCategoryPillsUI();
        applyFiltersAndRender();
      }
    });
  }

  if (filters.brand !== 'all') {
    chips.push({
      label: `الماركة: ${filters.brand}`,
      onRemove: () => {
        filters.brand = 'all';
        applyFiltersAndRender();
      }
    });
  }

  if (filters.minPrice > 0 || filters.maxPrice < 3500000) {
    chips.push({
      label: `السعر: ${filters.minPrice.toLocaleString()} - ${filters.maxPrice.toLocaleString()} د.ع`,
      onRemove: () => {
        filters.minPrice = 0;
        filters.maxPrice = 3500000;
        applyFiltersAndRender();
      }
    });
  }

  if (filters.searchQuery.trim()) {
    chips.push({
      label: `البحث: "${filters.searchQuery}"`,
      onRemove: () => {
        filters.searchQuery = '';
        const searchInput = document.getElementById('search-input') as HTMLInputElement;
        if (searchInput) searchInput.value = '';
        document.getElementById('clear-search-btn')?.classList.add('hidden');
        applyFiltersAndRender();
      }
    });
  }

  if (filters.sortBy !== 'newest') {
    const sortLabels: Record<SortOption, string> = {
      newest: 'الأحدث',
      'price-asc': 'السعر من الأقل للأعلى',
      'price-desc': 'السعر من الأعلى للأقل',
      popular: 'الأكثر طلباً'
    };
    chips.push({
      label: `الترتيب: ${sortLabels[filters.sortBy]}`,
      onRemove: () => {
        filters.sortBy = 'newest';
        updateSortButtonsUI('newest');
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
    <span class="text-[11px] text-slate-400 font-bold ml-1">فلاتر نشطة:</span>
    ${chips.map((chip, idx) => `
      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
        <span>${chip.label}</span>
        <button onclick="window._removeFilterChip(${idx})" class="hover:text-white transition">
          <i class="fa-solid fa-xmark text-[10px]"></i>
        </button>
      </span>
    `).join('')}
    <button onclick="window._resetAllFilters()" class="text-xs text-amber-400 hover:underline font-bold px-1">
      مسح الكل
    </button>
  `;

  (window as any)._removeFilterChip = (idx: number) => {
    chips[idx]?.onRemove();
  };
  (window as any)._resetAllFilters = () => {
    resetFilters();
  };
}

// Render Products Grid (Catalog Display ONLY - Zero Buying / Cart Buttons)
function renderProductsGrid(list: Product[]) {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center space-y-3 glass-panel rounded-3xl p-6">
        <div class="w-16 h-16 mx-auto rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-2xl">
          <i class="fa-solid fa-magnifying-glass"></i>
        </div>
        <h4 class="font-extrabold text-base text-white">لم يتم العثور على أجهزة مطابقة للبحث</h4>
        <p class="text-xs text-slate-400 max-w-sm mx-auto">
          جرّب تغيير فلاتر السعر أو الماركة أو القسم للوصول إلى الأجهزة المطلوبة في الكتالوج.
        </p>
        <button onclick="window._resetAllFilters()" class="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition">
          إعادة تعيين جميع الفلاتر
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = list.map(prod => {
    // Generate quick specs summary chips (e.g. 256GB, 8GB RAM, OLED)
    const specChips = Object.entries(prod.specs || {})
      .slice(0, 2)
      .map(([k, v]) => `<span class="bg-slate-800/80 text-slate-300 text-[10px] px-2 py-0.5 rounded border border-slate-700/60 truncate max-w-[120px]">${v}</span>`)
      .join('');

    return `
      <div class="glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 flex flex-col justify-between relative group">
        
        <!-- Top Tags (Badge & Brand) -->
        <div class="flex items-center justify-between gap-1 mb-2 z-10">
          <span class="text-[10px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-500/30">
            ${prod.brand}
          </span>
          ${prod.badge ? `
            <span class="text-[9px] font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30">
              ${prod.badge}
            </span>
          ` : prod.discountText ? `
            <span class="text-[9px] font-black text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30">
              ${prod.discountText}
            </span>
          ` : ''}
        </div>

        <!-- Product Image Showcase -->
        <div 
          onclick="window.viewProductSpecs('${prod.id}')"
          class="h-36 sm:h-44 w-full rounded-xl sm:rounded-2xl bg-slate-900/80 p-2 overflow-hidden flex items-center justify-center cursor-pointer relative"
        >
          <img 
            src="${prod.image}" 
            alt="${prod.title}" 
            class="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-500" 
            onerror="this.src='https://via.placeholder.com/300/0F172A/6366F1?text=BRAND+STORE'"
          />
          <div class="absolute inset-0 bg-indigo-950/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center pointer-events-none">
            <span class="bg-indigo-600/90 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg">
              <i class="fa-solid fa-eye ml-1"></i> فحص المواصفات
            </span>
          </div>
        </div>

        <!-- Product Info & Specs -->
        <div class="mt-3 space-y-2">
          
          <div>
            <h3 
              onclick="window.viewProductSpecs('${prod.id}')" 
              class="font-black text-xs sm:text-sm text-slate-100 hover:text-indigo-400 line-clamp-2 leading-snug cursor-pointer transition"
            >
              ${prod.title}
            </h3>
            ${prod.titleEn ? `<p class="text-[10px] text-slate-400 font-mono truncate mt-0.5">${prod.titleEn}</p>` : ''}
          </div>

          <!-- Quick Specs Tags -->
          <div class="flex items-center gap-1 flex-wrap pt-0.5">
            ${specChips}
          </div>

          <!-- Price Section (In Iraqi Dinars) -->
          <div class="pt-1 border-t border-slate-800">
            <div class="flex items-baseline gap-1.5 flex-wrap">
              <span class="text-amber-400 font-black text-xs sm:text-sm">${formatIQD(prod.price)}</span>
              ${prod.oldPrice ? `<span class="text-[10px] text-slate-400 line-through font-bold">${formatIQD(prod.oldPrice)}</span>` : ''}
            </div>
            <div class="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
              <i class="fa-solid fa-shield-halved text-emerald-400 text-[9px]"></i>
              <span class="truncate">${prod.warranty || 'ضمان وكالة رسمي'}</span>
            </div>
          </div>

          <!-- Catalog Button: VIEW FULL SPECS ONLY (NO BUY BUTTONS) -->
          <button 
            onclick="window.viewProductSpecs('${prod.id}')" 
            class="w-full mt-2 py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-indigo-600 hover:text-white text-slate-200 text-xs font-extrabold border border-slate-700 hover:border-indigo-500 transition duration-200 flex items-center justify-center gap-1.5 active:scale-98 shadow-sm"
          >
            <i class="fa-solid fa-file-lines text-indigo-400"></i>
            <span>عرض المواصفات الكاملة</span>
          </button>

        </div>

      </div>
    `;
  }).join('');
}

// Product Full Technical Specifications Modal
export function viewProductSpecs(productId: string) {
  const prod = products.find(p => p.id === productId);
  if (!prod) return;

  selectedProductForModal = prod;
  const modal = document.getElementById('product-modal');
  if (!modal) return;

  // Populate Modal Fields
  const titleEl = document.getElementById('modal-title');
  const titleEnEl = document.getElementById('modal-title-en');
  const brandEl = document.getElementById('modal-brand-badge');
  const tagEl = document.getElementById('modal-tag-badge');
  const imgEl = document.getElementById('modal-image') as HTMLImageElement;
  const priceEl = document.getElementById('modal-price');
  const oldPriceEl = document.getElementById('modal-old-price');
  const discountEl = document.getElementById('modal-discount');
  const warrantyEl = document.getElementById('modal-warranty');
  const locationEl = document.getElementById('modal-location');
  const specsTableEl = document.getElementById('modal-specs-table');

  if (titleEl) titleEl.textContent = prod.title;
  if (titleEnEl) titleEnEl.textContent = prod.titleEn || '';
  if (brandEl) brandEl.textContent = prod.brand;
  if (tagEl) {
    tagEl.textContent = prod.badge || 'معتمد 100%';
  }
  if (imgEl) {
    imgEl.src = prod.image;
    imgEl.onerror = () => {
      imgEl.src = 'https://via.placeholder.com/400/0F172A/6366F1?text=BRAND+STORE';
    };
  }
  if (priceEl) priceEl.textContent = formatIQD(prod.price);
  if (oldPriceEl) {
    if (prod.oldPrice) {
      oldPriceEl.textContent = formatIQD(prod.oldPrice);
      oldPriceEl.classList.remove('hidden');
    } else {
      oldPriceEl.classList.add('hidden');
    }
  }
  if (discountEl) {
    discountEl.textContent = prod.discountText || (prod.oldPrice ? `وفر ${(prod.oldPrice - prod.price).toLocaleString()} د.ع` : '');
  }
  if (warrantyEl) warrantyEl.textContent = prod.warranty || 'ضمان وكالة رسمي 12 شهراً';
  if (locationEl) locationEl.textContent = prod.showroomLocation || 'صالة عرض BRAND STORE الرئيسية';

  // Render Technical Specifications Table
  if (specsTableEl) {
    const specsEntries = Object.entries(prod.specs || {});
    if (specsEntries.length === 0) {
      specsTableEl.innerHTML = `<p class="text-slate-400 text-xs py-2">لا توجد تفاصيل إضافية مسجلة لهذا الجهاز حالياً.</p>`;
    } else {
      specsTableEl.innerHTML = specsEntries.map(([key, val]) => `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 px-2.5 rounded-lg odd:bg-slate-800/40 even:bg-slate-800/20 border border-slate-700/30 gap-1">
          <span class="font-bold text-slate-300 text-xs">${key}</span>
          <span class="font-semibold text-indigo-300 text-xs">${val}</span>
        </div>
      `).join('');
    }
  }

  modal.classList.remove('hidden');
}

function closeProductModal() {
  document.getElementById('product-modal')?.classList.add('hidden');
  selectedProductForModal = null;
}

// Render Discover / Reels Grid
function renderReelsCatalog() {
  const container = document.getElementById('reels-catalog-grid');
  if (!container) return;

  container.innerHTML = reels.map(r => `
    <div 
      onclick="window.openReelVideo('${r.id}')" 
      class="relative rounded-2xl overflow-hidden h-60 bg-slate-900 border border-slate-800 shadow-md group cursor-pointer"
    >
      <img src="${r.thumbnail}" alt="${r.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-85">
      <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent flex flex-col justify-between p-3 text-white">
        
        <div class="flex justify-between items-center">
          <span class="bg-black/60 backdrop-blur-md text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 text-slate-300">
            <i class="fa-solid fa-eye text-[9px] text-indigo-400"></i> ${r.views}
          </span>
          <div class="w-7 h-7 rounded-full bg-rose-600/80 text-white flex items-center justify-center text-[10px]">
            <i class="fa-solid fa-play mr-0.5"></i>
          </div>
        </div>

        <div>
          <p class="text-xs font-black line-clamp-2 leading-snug drop-shadow-md">${r.title}</p>
          ${r.productTitle ? `
            <span class="text-[10px] text-amber-400 font-bold mt-1 block truncate">
              الجهاز: ${r.productTitle}
            </span>
          ` : ''}
        </div>

      </div>
    </div>
  `).join('');

  (window as any).openReelVideo = openReelVideo;
}

// Open Reel Preview Modal
function openReelVideo(reelId: string) {
  const reel = reels.find(r => r.id === reelId);
  if (!reel) return;

  const modal = document.getElementById('reel-modal');
  const titleEl = document.getElementById('reel-title-preview');
  const viewsEl = document.getElementById('reel-views-preview');
  const productEl = document.getElementById('reel-product-name');
  const videoEl = document.getElementById('reel-video-element') as HTMLVideoElement;
  const viewProductBtn = document.getElementById('reel-view-product-btn');

  if (titleEl) titleEl.textContent = reel.title;
  if (viewsEl) viewsEl.textContent = `${reel.views} مشاهدة`;
  if (productEl) productEl.textContent = reel.productTitle || 'جهاز إلكتروني';

  if (videoEl) {
    videoEl.src = reel.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
    videoEl.load();
    videoEl.play().catch(() => {
      // autoplay restriction fallback
    });
  }

  if (viewProductBtn) {
    if (reel.productId) {
      viewProductBtn.onclick = () => {
        closeReelModal();
        viewProductSpecs(reel.productId!);
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

// Banner Carousel Rotation
function startBannerCarousel() {
  const slider = document.getElementById('banner-slider');
  const headline = document.getElementById('banner-headline');
  const subtitle = document.getElementById('banner-subtitle');
  const dotsContainer = document.getElementById('banner-dots');

  const updateBanner = (idx: number) => {
    currentBannerIndex = idx;
    const item = bannersData[idx];
    if (slider) {
      slider.style.backgroundImage = `linear-gradient(to top, rgba(9, 13, 22, 0.95) 15%, rgba(9, 13, 22, 0.4) 60%, transparent 100%), url('${item.image}')`;
    }
    if (headline) headline.textContent = item.title;
    if (subtitle) subtitle.textContent = item.desc;

    // Update dots
    if (dotsContainer) {
      dotsContainer.innerHTML = bannersData.map((_, i) => `
        <button 
          onclick="window._goToBanner(${i})" 
          class="${i === idx ? 'w-6 h-1.5 rounded-full bg-amber-400' : 'w-2 h-1.5 rounded-full bg-slate-600'} transition-all"
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

// Toast Notifications Helper
export function showToast(message: string, type: 'check' | 'info' | 'error' = 'check') {
  const toast = document.getElementById('toast-box');
  const text = document.getElementById('toast-text');
  const icon = document.getElementById('toast-icon');

  if (!toast || !text) return;
  text.textContent = message;

  if (icon) {
    if (type === 'error') {
      icon.innerHTML = '<i class="fa-solid fa-circle-exclamation text-rose-400"></i>';
    } else if (type === 'info') {
      icon.innerHTML = '<i class="fa-solid fa-circle-info text-indigo-400"></i>';
    } else {
      icon.innerHTML = '<i class="fa-solid fa-circle-check text-amber-400"></i>';
    }
  }

  toast.classList.remove('opacity-0', 'pointer-events-none');
  setTimeout(() => {
    toast.classList.add('opacity-0', 'pointer-events-none');
  }, 2600);
}
