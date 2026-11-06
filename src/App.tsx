import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Product,
  CategoryItem,
  BrandItem,
  Reel,
  CartItem,
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
import { CartView } from './components/CartView';
import { AdminPortal } from './components/AdminPortal';

import {
  SlidersHorizontal,
  X,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Cpu,
  Layers
} from 'lucide-react';

const CART_STORAGE_KEY = 'brand_store_cart';

export default function App() {
  // Real-time Data States
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [categories, setCategories] = useState<CategoryItem[]>(defaultCategories);
  const [brands, setBrands] = useState<BrandItem[]>(brandsList);
  const [reels, setReels] = useState<Reel[]>(defaultReels);
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);

  // Cart State with localStorage persistence
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Navigation & View States
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(3500000);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  // Admin Modal & Toast
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  // Sync Cart changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn('Failed to save cart to localStorage:', e);
    }
  }, [cart]);

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

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Cart Management
  const handleAddToCart = (product: Product, quantity: number = 1) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          quantity: updated[idx].quantity + quantity
        };
        return updated;
      }
      return [...prev, { product, quantity }];
    });

    setRecentlyAddedId(product.id);
    setTimeout(() => setRecentlyAddedId(null), 1800);
    showToast(`تمت إضافة "${product.title}" إلى السلة 🛍️`);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('تم حذف الجهاز من السلة');
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (confirm('هل ترغب بإفراغ سلة الطلبات؟')) {
      setCart([]);
      showToast('تم إفراغ السلة بالكامل');
    }
  };

  const totalCartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Active Filters Count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterCategory !== 'all') count++;
    if (filterBrand !== 'all') count++;
    if (minPrice > 0 || maxPrice < 3500000) count++;
    if (sortBy !== 'newest') count++;
    return count;
  }, [filterCategory, filterBrand, minPrice, maxPrice, sortBy]);

  // Reset Filters
  const handleResetFilters = () => {
    setFilterCategory('all');
    setFilterBrand('all');
    setMinPrice(0);
    setMaxPrice(3500000);
    setSortBy('newest');
    setSearchQuery('');
  };

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search query filter
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

    // Price range filter
    result = result.filter((p) => p.price >= minPrice && p.price <= maxPrice);

    // Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'popular') {
      result.sort((a, b) => (b.badge ? 1 : 0) - (a.badge ? 1 : 0));
    } else {
      // Newest first
      result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    return result;
  }, [products, searchQuery, filterCategory, filterBrand, minPrice, maxPrice, sortBy]);

  // Navigate to Category details
  const handleSelectCategory = (cat: CategoryItem) => {
    setSelectedCategory(cat);
    setActiveTab('categories');
    setSelectedProduct(null);
  };

  // Navigate to Brand filtered view
  const handleSelectBrand = (brand: BrandItem) => {
    setFilterBrand(brand.name);
    setActiveTab('home');
    setSelectedCategory(null);
    setSelectedProduct(null);
    showToast(`تمت تصفية المنتجات حسب ماركة ${brand.name}`);
  };

  return (
    <div className="bg-slate-200 min-h-screen text-slate-800 font-sans" dir="rtl">
      {/* Centered Mobile App Shell (Clean Karada Light Theme) */}
      <div className="light-app-container flex flex-col justify-between overflow-x-hidden min-h-screen pb-28">
        {/* Top Header */}
        <Header
          searchQuery={searchQuery}
          setSearchQuery={(q) => {
            setSearchQuery(q);
            if (activeTab !== 'home') setActiveTab('home');
          }}
          onOpenFilter={() => setIsFilterOpen(true)}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onLogoClick={() => {
            setActiveTab('home');
            setSelectedCategory(null);
            setSelectedProduct(null);
          }}
          activeFilterCount={activeFilterCount}
        />

        {/* Main Viewport Content */}
        <main className="px-3.5 pt-3.5 flex-1 space-y-4">
          {/* Active Filter Chips Bar (if any filter is applied on Home) */}
          {activeTab === 'home' && activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pb-1">
              <span className="text-[10px] font-black text-slate-400">فلاتر نشطة:</span>

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

              {(minPrice > 0 || maxPrice < 3500000) && (
                <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span>
                    السعر: {minPrice.toLocaleString()} - {maxPrice.toLocaleString()} د.ع
                  </span>
                  <button
                    onClick={() => {
                      setMinPrice(0);
                      setMaxPrice(3500000);
                    }}
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
                <span>إعادة تعيين</span>
              </button>
            </div>
          )}

          {/* FULL SCREEN PRODUCT DETAILS VIEW */}
          {selectedProduct ? (
            <ProductDetailView
              product={selectedProduct}
              onBack={() => setSelectedProduct(null)}
              onAddToCart={handleAddToCart}
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
                  {/* Promo Banner Slider (Karada Style) */}
                  <div className="relative rounded-3xl overflow-hidden bg-slate-900 shadow-sm border border-slate-100">
                    <div
                      className="h-44 sm:h-52 bg-cover bg-center flex flex-col justify-end p-4 sm:p-5 text-white relative"
                      style={{
                        backgroundImage: `linear-gradient(to top, rgba(15, 23, 42, 0.9) 10%, rgba(15, 23, 42, 0.3) 60%, transparent 100%), url('https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80')`
                      }}
                    >
                      <span className="bg-amber-500 text-slate-900 text-[10px] font-black px-2.5 py-0.5 rounded-lg w-fit mb-1.5">
                        {settings.storeName}
                      </span>
                      <h3 className="font-black text-sm sm:text-base leading-tight">
                        كل ما تحتاجه من أجهزة وحواسيب ومعدات Gaming
                      </h3>
                      <p className="text-xs text-slate-200 mt-1 line-clamp-1">
                        تصفح الأسعار المعتمدة بالدينار العراقي واطلب مباشرة عبر الواتساب
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

                  {/* Section Header: Products Count & Sorting Badge */}
                  <div className="flex justify-between items-center pt-1 px-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">🔥🔥🔥</span>
                      <h2 className="font-black text-slate-800 text-sm sm:text-base">
                        أحدث الأجهزة المعروضة
                      </h2>
                      <span className="bg-purple-50 text-purple-700 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-purple-100">
                        {filteredProducts.length} جهاز
                      </span>
                    </div>

                    <button
                      onClick={() => setActiveTab('categories')}
                      className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>رؤية الأصناف</span>
                      <span className="text-[10px]">←</span>
                    </button>
                  </div>

                  {/* Products Catalog Grid (Luxury Rectangular Karada Cards) */}
                  {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {filteredProducts.map((p) => (
                        <ProductCard
                          key={p.id}
                          product={p}
                          onViewDetails={(prod) => setSelectedProduct(prod)}
                          onAddToCart={(prod) => handleAddToCart(prod, 1)}
                          isAdded={recentlyAddedId === p.id}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm space-y-2">
                      <Cpu size={36} className="mx-auto text-slate-300" />
                      <h4 className="font-black text-sm text-slate-800">
                        لم يتم العثور على أجهزة مطابقة للبحث أو الفلتر
                      </h4>
                      <p className="text-xs text-slate-400">
                        جرّب توسيع نطاق السعر أو اختيار علامة تجارية أخرى
                      </p>
                      <button
                        onClick={handleResetFilters}
                        className="mt-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-xs font-black hover:bg-purple-100 transition cursor-pointer"
                      >
                        إلغاء جميع الفلاتر
                      </button>
                    </div>
                  )}

                  {/* Middle Feature Banner */}
                  <div className="rounded-3xl bg-gradient-to-r from-purple-800 to-indigo-900 p-4 text-white flex items-center justify-between shadow-sm my-2">
                    <div>
                      <span className="bg-purple-500/30 text-purple-200 text-[9px] font-bold px-2 py-0.5 rounded-full">
                        {settings.storeNameAr}
                      </span>
                      <h4 className="font-black text-sm mt-1">تجهيزات كاملة للمنزل وصنّاع المحتوى</h4>
                      <p className="text-[11px] text-purple-200 mt-0.5">{settings.openHours}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-purple-200">
                      <Cpu size={26} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 2. CATEGORIES VIEW / SUB-CATEGORY BRAND FILTER VIEW */}
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
                      onAddToCart={(prod) => handleAddToCart(prod, 1)}
                      addedProductId={recentlyAddedId}
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

              {/* 3. BRANDS VIEW (4-COLUMN SQUARE CARDS GRID) */}
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

              {/* 4. DISCOVER / REELS VIEW */}
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

              {/* 5. SHOPPING CART & WHATSAPP DIRECT ORDER CHECKOUT */}
              {activeTab === 'cart' && (
                <motion.div
                  key="cart"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CartView
                    cart={cart}
                    whatsappNumber={settings.whatsappNumber}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveItem={handleRemoveFromCart}
                    onClearCart={handleClearCart}
                    onContinueShopping={() => setActiveTab('home')}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </main>

        {/* FLOATING GLASSMORPHISM EXPANDING PILL NAVIGATION DOCK */}
        <FloatingNav
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setSelectedProduct(null);
            if (tab !== 'categories') {
              setSelectedCategory(null);
            }
          }}
          cartCount={totalCartCount}
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
                {/* Modal Header */}
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

                {/* Filters Body */}
                <div className="space-y-3.5 overflow-y-auto max-h-[55vh] pr-1 text-xs">
                  {/* Category Selection */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">القسم</label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-2xl font-bold text-slate-800 focus:outline-none focus:border-purple-300"
                    >
                      <option value="all">جميع الأقسام</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Brand Selection */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      الماركة (العلامة التجارية)
                    </label>
                    <select
                      value={filterBrand}
                      onChange={(e) => setFilterBrand(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-2xl font-bold text-slate-800 focus:outline-none focus:border-purple-300"
                    >
                      <option value="all">جميع الماركات</option>
                      {brands.map((b) => (
                        <option key={b.name} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range */}
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
                        placeholder="الحد الأدنى"
                        className="bg-slate-50 border border-slate-200 p-2 rounded-xl font-bold text-center"
                      />
                      <input
                        type="number"
                        value={maxPrice}
                        step={25000}
                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                        placeholder="الحد الأقصى"
                        className="bg-slate-50 border border-slate-200 p-2 rounded-xl font-bold text-center"
                      />
                    </div>
                  </div>

                  {/* Sort Options */}
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
                        <span>السعر: من الأقل للأعلى</span>
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
                        <span>السعر: من الأعلى للأقل</span>
                        {sortBy === 'price-desc' && <CheckCircle2 size={13} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="border-t border-slate-100 pt-3 flex items-center gap-2">
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl text-xs transition cursor-pointer shadow-md shadow-purple-600/25"
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

      {/* DYNAMIC ADMIN PORTAL MODAL */}
      <AdminPortal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        products={products}
        categories={categories}
        brands={brands}
        reels={reels}
        settings={settings}
        onShowToast={showToast}
      />

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
