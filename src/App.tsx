import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Product,
  CategoryItem,
  BrandItem,
  Reel,
  StoreSettings,
  SortOption
} from './types';
import {
  subscribeToProducts,
  subscribeToCategories,
  subscribeToBrands,
  subscribeToReels,
  subscribeToSettings,
  defaultSettings
} from './firebase';
import { defaultCategories } from './data/defaultCategories';
import { brandsList } from './data/brands';
import { defaultProducts } from './data/defaultProducts';
import { defaultReels } from './data/defaultReels';

// Components
import { Header } from './components/Header';
import { FloatingNav, NavTab } from './components/FloatingNav';
import { ProductCard } from './components/ProductCard';
import { CategoriesView } from './components/CategoriesView';
import { CategoryDetailView } from './components/CategoryDetailView';
import { BrandsView } from './components/BrandsView';
import { ReelsView } from './components/ReelsView';
import { ProductDetailView } from './components/ProductDetailView';
import { AdminPortal } from './components/AdminPortal';

import {
  SlidersHorizontal,
  X,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Cpu
} from 'lucide-react';

export default function App() {
  // 3️⃣ Secret Admin Route Detection (/19QWADMIN)
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    const path = window.location.pathname.toUpperCase();
    const hash = window.location.hash.toUpperCase();
    return path.includes('19QWADMIN') || hash.includes('19QWADMIN') ? '/19QWADMIN' : '/';
  });

  // Listen to browser navigation & URL changes
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toUpperCase();
      const hash = window.location.hash.toUpperCase();
      const isAdmin = path.includes('19QWADMIN') || hash.includes('19QWADMIN');
      setCurrentRoute(isAdmin ? '/19QWADMIN' : '/');
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigateTo = (route: string) => {
    try {
      window.history.pushState(null, '', route);
    } catch {
      window.location.hash = route;
    }
    setCurrentRoute(route);
  };

  // Real-time Data States
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [categories, setCategories] = useState<CategoryItem[]>(defaultCategories);
  const [brands, setBrands] = useState<BrandItem[]>(brandsList);
  const [reels, setReels] = useState<Reel[]>(defaultReels);
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);

  // Client Navigation & View States (Pure Catalog: 4 tabs, NO CART)
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(5000000);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Real-time Firestore Subscriptions
  useEffect(() => {
    const unsubProducts = subscribeToProducts((prods) => {
      if (prods && prods.length > 0) setProducts(prods);
    });
    const unsubCategories = subscribeToCategories((cats) => {
      if (cats && cats.length > 0) setCategories(cats);
    });
    const unsubBrands = subscribeToBrands((brs) => {
      if (brs && brs.length > 0) setBrands(brs);
    });
    const unsubReels = subscribeToReels((rls) => {
      if (rls && rls.length > 0) setReels(rls);
    });
    const unsubSettings = subscribeToSettings((st) => {
      if (st) setSettings(st);
    });

    return () => {
      unsubProducts();
      unsubCategories();
      unsubBrands();
      unsubReels();
      unsubSettings();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Active Filters Count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterCategory !== 'all') count++;
    if (filterBrand !== 'all') count++;
    if (minPrice > 0 || maxPrice < 5000000) count++;
    if (sortBy !== 'newest') count++;
    return count;
  }, [filterCategory, filterBrand, minPrice, maxPrice, sortBy]);

  const handleResetFilters = () => {
    setFilterCategory('all');
    setFilterBrand('all');
    setMinPrice(0);
    setMaxPrice(5000000);
    setSortBy('newest');
    setSearchQuery('');
  };

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.titleEn && p.titleEn.toLowerCase().includes(q)) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          Object.values(p.specs || {}).some((spec) => spec.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (filterCategory !== 'all') {
      result = result.filter(
        (p) => p.category.toLowerCase() === filterCategory.toLowerCase()
      );
    }

    // Brand filter
    if (filterBrand !== 'all') {
      result = result.filter(
        (p) => p.brand.toLowerCase() === filterBrand.toLowerCase()
      );
    }

    // Price range
    result = result.filter((p) => p.price >= minPrice && p.price <= maxPrice);

    // Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'popular') {
      result.sort((a, b) => (b.badge ? 1 : 0) - (a.badge ? 1 : 0));
    } else {
      result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    return result;
  }, [products, searchQuery, filterCategory, filterBrand, minPrice, maxPrice, sortBy]);

  const handleSelectCategory = (cat: CategoryItem) => {
    setSelectedCategory(cat);
    setActiveTab('categories');
    setSelectedProduct(null);
  };

  const handleSelectBrand = (brand: BrandItem) => {
    setFilterBrand(brand.name);
    setActiveTab('home');
    setSelectedCategory(null);
    setSelectedProduct(null);
    showToast(`تمت تصفية المنتجات حسب ماركة ${brand.name}`);
  };

  // ================= 3️⃣ SECRET ADMIN VIEW ROUTE (/19QWADMIN) =================
  if (currentRoute === '/19QWADMIN') {
    return (
      <AdminPortal
        products={products}
        categories={categories}
        brands={brands}
        reels={reels}
        settings={settings}
        onShowToast={showToast}
        onExitAdmin={() => navigateTo('/')}
      />
    );
  }

  // ================= 1️⃣ & 2️⃣ PURE CLIENT CATALOG VIEW (ZERO ADMIN ARTIFACTS) =================
  return (
    <div className="bg-slate-200 min-h-screen text-slate-800 font-sans" dir="rtl">
      {/* Centered Mobile App Shell (Clean Light Theme) */}
      <div className="light-app-container flex flex-col justify-between overflow-x-hidden min-h-screen pb-28">
        {/* Clean Header - 716XSTOR Branding - ZERO ADMIN BUTTONS */}
        <Header
          searchQuery={searchQuery}
          setSearchQuery={(q) => {
            setSearchQuery(q);
            if (activeTab !== 'home') setActiveTab('home');
          }}
          onOpenFilter={() => setIsFilterOpen(true)}
          onLogoClick={() => {
            setActiveTab('home');
            setSelectedCategory(null);
            setSelectedProduct(null);
          }}
          activeFilterCount={activeFilterCount}
        />

        {/* Main Viewport Content */}
        <main className="px-3.5 pt-3.5 flex-1 space-y-4">
          {/* Active Filter Chips Bar */}
          {activeTab === 'home' && activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pb-1">
              <span className="text-[10px] font-black text-slate-400">تصفية نشطة:</span>

              {filterCategory !== 'all' && (
                <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span>قسم: {filterCategory}</span>
                  <button
                    onClick={() => setFilterCategory('all')}
                    className="hover:text-purple-900 cursor-pointer"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {filterBrand !== 'all' && (
                <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span>ماركة: {filterBrand}</span>
                  <button
                    onClick={() => setFilterBrand('all')}
                    className="hover:text-purple-900 cursor-pointer"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              <button
                onClick={handleResetFilters}
                className="text-[10px] text-red-500 font-bold hover:underline flex items-center gap-0.5 mr-auto cursor-pointer"
              >
                <RotateCcw size={10} />
                <span>إلغاء الفلاتر</span>
              </button>
            </div>
          )}

          {/* FULL SCREEN PRODUCT DETAILS VIEW (PURE CATALOG) */}
          {selectedProduct ? (
            <ProductDetailView
              product={selectedProduct}
              onBack={() => setSelectedProduct(null)}
            />
          ) : (
            /* TABBED VIEWS */
            <AnimatePresence mode="wait">
              {/* 1. HOME CATALOG VIEW */}
              {activeTab === 'home' && (
                <motion.div
                  key="home"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* Hero Showcase Banner */}
                  <div className="relative rounded-3xl overflow-hidden bg-slate-900 shadow-sm border border-slate-100">
                    <div
                      className="h-44 sm:h-52 bg-cover bg-center flex flex-col justify-end p-4 sm:p-5 text-white relative"
                      style={{
                        backgroundImage: `linear-gradient(to top, rgba(15, 23, 42, 0.9) 10%, rgba(15, 23, 42, 0.3) 60%, transparent 100%), url('https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80')`
                      }}
                    >
                      <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-lg w-fit mb-1.5 font-mono shadow-sm">
                        716XSTOR
                      </span>
                      <h2 className="font-black text-sm sm:text-base leading-tight">
                        كتالوج الأجهزة الإلكترونية ومعدات القيمنق المعتمدة
                      </h2>
                      <p className="text-xs text-slate-200 mt-1 line-clamp-1">
                        تصفح المواصفات الرسمية والأسعار بالدينار العراقي قبل زيارة المعرض
                      </p>
                    </div>
                  </div>

                  {/* Horizontal Quick Categories Carousel */}
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                    <button
                      onClick={() => setFilterCategory('all')}
                      className={`px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all shadow-sm cursor-pointer flex items-center gap-1.5 ${
                        filterCategory === 'all'
                          ? 'bg-purple-600 text-white shadow-purple-600/25'
                          : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
                      }`}
                    >
                      <Sparkles size={13} />
                      <span>جميع الأجهزة</span>
                    </button>

                    {categories.map((c) => {
                      const isSelected = filterCategory.toLowerCase() === c.id.toLowerCase();
                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            if (isSelected) {
                              setFilterCategory('all');
                            } else {
                              setFilterCategory(c.id);
                            }
                          }}
                          className={`px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all shadow-sm cursor-pointer flex items-center gap-2 ${
                            isSelected
                              ? 'bg-purple-600 text-white shadow-purple-600/25'
                              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
                          }`}
                        >
                          <img
                            src={c.image}
                            alt={c.name}
                            className="w-4 h-4 object-contain rounded-full"
                          />
                          <span>{c.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Section Header */}
                  <div className="flex justify-between items-center pt-1 px-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">🔥🔥🔥</span>
                      <h3 className="font-black text-slate-800 text-sm sm:text-base">
                        أحدث الأجهزة المعروضة
                      </h3>
                      <span className="bg-purple-50 text-purple-700 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-purple-100">
                        {filteredProducts.length} جهاز
                      </span>
                    </div>

                    <button
                      onClick={() => setActiveTab('categories')}
                      className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>تصفح الأقسام</span>
                      <span className="text-[10px]">←</span>
                    </button>
                  </div>

                  {/* Products Catalog Grid */}
                  {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {filteredProducts.map((p) => (
                        <ProductCard
                          key={p.id}
                          product={p}
                          onViewDetails={(prod) => setSelectedProduct(prod)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm space-y-2">
                      <Cpu size={36} className="mx-auto text-slate-300" />
                      <h4 className="font-black text-sm text-slate-800">
                        لم يتم العثور على أجهزة مطابقة للبحث
                      </h4>
                      <button
                        onClick={handleResetFilters}
                        className="mt-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-xs font-black hover:bg-purple-100 transition cursor-pointer"
                      >
                        إلغاء جميع الفلاتر
                      </button>
                    </div>
                  )}

                  {/* Showroom Feature Strip */}
                  <div className="rounded-3xl bg-gradient-to-r from-purple-800 to-indigo-900 p-4 text-white flex items-center justify-between shadow-sm my-2">
                    <div>
                      <span className="bg-purple-500/30 text-purple-200 text-[9px] font-bold px-2 py-0.5 rounded-full font-mono">
                        716XSTOR SHOWROOM
                      </span>
                      <h4 className="font-black text-sm mt-1">تجهيزات كاملة للمحترفين وصنّاع المحتوى</h4>
                      <p className="text-[11px] text-purple-200 mt-0.5">{settings.openHours}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-purple-200">
                      <Cpu size={26} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 2. ARTISTIC WAVE CATEGORIES VIEW */}
              {activeTab === 'categories' && (
                <motion.div
                  key="categories"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {selectedCategory ? (
                    <CategoryDetailView
                      category={selectedCategory}
                      products={products}
                      brands={brands}
                      onBack={() => setSelectedCategory(null)}
                      onViewProduct={(prod) => setSelectedProduct(prod)}
                    />
                  ) : (
                    <CategoriesView
                      categories={categories}
                      products={products}
                      onSelectCategory={handleSelectCategory}
                    />
                  )}
                </motion.div>
              )}

              {/* 3. 4-COLUMN BRANDS VIEW */}
              {activeTab === 'brands' && (
                <motion.div
                  key="brands"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <BrandsView
                    brands={brands}
                    products={products}
                    onSelectBrand={handleSelectBrand}
                  />
                </motion.div>
              )}

              {/* 4. DISCOVER / AUTOMATED INSTAGRAM REELS */}
              {activeTab === 'reels' && (
                <motion.div
                  key="reels"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ReelsView
                    reels={reels}
                    instagramHandle={settings.instagramHandle}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </main>

        {/* 7️⃣ FLOATING GLASSMORPHISM PILL DOCK (4 CATALOG TABS ONLY - NO CART) */}
        <FloatingNav
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setSelectedProduct(null);
            if (tab !== 'categories') {
              setSelectedCategory(null);
            }
          }}
        />
      </div>

      {/* FILTER & SORT MODAL */}
      <AnimatePresence>
        {isFilterOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] flex flex-col justify-between shadow-2xl space-y-4"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                      <SlidersHorizontal size={15} />
                    </div>
                    <h3 className="font-black text-slate-800 text-sm sm:text-base">
                      فلترة وترتيب الأجهزة
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="space-y-3.5 overflow-y-auto max-h-[55vh] pr-1 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">القسم</label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-2xl font-bold text-slate-800"
                    >
                      <option value="all">جميع الأقسام</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الماركة (الشركة)</label>
                    <select
                      value={filterBrand}
                      onChange={(e) => setFilterBrand(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-2xl font-bold text-slate-800"
                    >
                      <option value="all">جميع الماركات</option>
                      {brands.map((b) => (
                        <option key={b.name} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-700">نطاق السعر بالدينار:</span>
                      <span className="text-purple-700 font-black">
                        {minPrice.toLocaleString()} - {maxPrice.toLocaleString()} د.ع
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <input
                        type="number"
                        value={minPrice}
                        step={25000}
                        onChange={(e) => setMinPrice(Number(e.target.value))}
                        className="bg-slate-50 border border-slate-200 p-2 rounded-xl font-bold text-center"
                      />
                      <input
                        type="number"
                        value={maxPrice}
                        step={25000}
                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                        className="bg-slate-50 border border-slate-200 p-2 rounded-xl font-bold text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الترتيب حسب</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSortBy('newest')}
                        className={`p-2.5 rounded-xl font-bold text-right transition cursor-pointer border text-xs flex items-center justify-between ${
                          sortBy === 'newest'
                            ? 'border-purple-600 bg-purple-50 text-purple-700'
                            : 'border-slate-200 bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span>الأحدث وصولاً ⚡</span>
                        {sortBy === 'newest' && <CheckCircle2 size={13} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSortBy('popular')}
                        className={`p-2.5 rounded-xl font-bold text-right transition cursor-pointer border text-xs flex items-center justify-between ${
                          sortBy === 'popular'
                            ? 'border-purple-600 bg-purple-50 text-purple-700'
                            : 'border-slate-200 bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span>الأكثر طلباً ⭐</span>
                        {sortBy === 'popular' && <CheckCircle2 size={13} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSortBy('price-asc')}
                        className={`p-2.5 rounded-xl font-bold text-right transition cursor-pointer border text-xs flex items-center justify-between ${
                          sortBy === 'price-asc'
                            ? 'border-purple-600 bg-purple-50 text-purple-700'
                            : 'border-slate-200 bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span>السعر: الأقل للأعلى</span>
                        {sortBy === 'price-asc' && <CheckCircle2 size={13} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSortBy('price-desc')}
                        className={`p-2.5 rounded-xl font-bold text-right transition cursor-pointer border text-xs flex items-center justify-between ${
                          sortBy === 'price-desc'
                            ? 'border-purple-600 bg-purple-50 text-purple-700'
                            : 'border-slate-200 bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span>السعر: الأعلى للأقل</span>
                        {sortBy === 'price-desc' && <CheckCircle2 size={13} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center gap-2">
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl text-xs transition cursor-pointer shadow-md"
                >
                  تطبيق الفلاتر ({filteredProducts.length} جهاز)
                </button>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl text-xs transition cursor-pointer"
                >
                  إلغاء الفلاتر
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-14 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl z-50 flex items-center gap-2 border border-slate-800"
          >
            <span className="text-amber-400">
              <CheckCircle2 size={15} />
            </span>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
