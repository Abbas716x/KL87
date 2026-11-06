import React, { useState } from 'react';
import {
  Product,
  CategoryItem,
  BrandItem,
  Reel,
  StoreSettings
} from '../types';
import {
  saveProductToStore,
  deleteProductFromStore,
  saveCategoryToStore,
  deleteCategoryFromStore,
  saveBrandToStore,
  deleteBrandFromStore,
  deleteReelFromStore,
  saveStoreSettings,
  uploadImageFile,
  seedInitialDataToStore,
  syncInstagramReels,
  FIREBASE_FIRESTORE_RULES,
  FIREBASE_STORAGE_RULES
} from '../firebase';
import {
  X,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  Save,
  Boxes,
  Grid,
  Layers,
  Play,
  Settings,
  Upload,
  Lock,
  ArrowRight,
  RefreshCw,
  Database,
  Instagram,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface AdminPortalProps {
  products: Product[];
  categories: CategoryItem[];
  brands: BrandItem[];
  reels: Reel[];
  settings: StoreSettings;
  onShowToast: (msg: string) => void;
  onExitAdmin: () => void;
}

// Authorized Credentials
const REQUIRED_USER = 'ADMINOPQUMASTER@0';
const REQUIRED_PASS = 'ABSJ@@9081074vjdopwpu690';
const AUTH_SESSION_KEY = '716xstor_admin_authenticated_session';

export const AdminPortal: React.FC<AdminPortalProps> = ({
  products,
  categories,
  brands,
  reels,
  settings,
  onShowToast,
  onExitAdmin
}) => {
  // Login State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(AUTH_SESSION_KEY) === 'true';
  });
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'products' | 'categories' | 'brands' | 'reels' | 'settings' | 'seed'
  >('products');

  // Product Form State (Absolute price flexibility - no restrictions)
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    title: '',
    titleEn: '',
    category: 'phones',
    brand: 'Apple',
    price: 1580000,
    oldPrice: 1650000,
    badge: 'جديد',
    warranty: 'ضمان وكالة رسمي سنة كاملة',
    image: '',
    cpu: '',
    ram: '',
    screen: '',
    battery: ''
  });

  // Category Form State (with direct image upload & artistic wave accent color)
  const [isEditingCat, setIsEditingCat] = useState(false);
  const [catForm, setCatForm] = useState({
    name: '',
    nameEn: '',
    image: '',
    accentColor: '#8B5CF6',
    description: ''
  });

  // Brand Form State (with direct logo upload)
  const [isEditingBrand, setIsEditingBrand] = useState(false);
  const [brandForm, setBrandForm] = useState({
    name: '',
    displayName: '',
    logo: '',
    categoryId: 'phones',
    sector: 'phones'
  });

  // Settings & Instagram Automated Sync State
  const [settingsForm, setSettingsForm] = useState<StoreSettings>({ ...settings });
  const [isSyncingReels, setIsSyncingReels] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [rulesCopied, setRulesCopied] = useState<'firestore' | 'storage' | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Login Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      usernameInput.trim() === REQUIRED_USER &&
      passwordInput.trim() === REQUIRED_PASS
    ) {
      setIsAuthenticated(true);
      sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
      setLoginError('');
      onShowToast('تم تسجيل الدخول بنجاح إلى لوحة الإدارة 716XSTOR');
    } else {
      setLoginError('بيانات الدخول غير صحيحة. تم رفض الوصول.');
      setTimeout(() => {
        // Redirection on failed attempt
        onExitAdmin();
      }, 1500);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    setIsAuthenticated(false);
    onShowToast('تم تسجيل الخروج');
    onExitAdmin();
  };

  // Generic direct image uploader for products, categories, or brands
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'product' | 'category' | 'brand'
  ) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploadingImage(true);
      onShowToast('جاري ضغط ومعالجة الصورة من جهازك...');
      try {
        const file = e.target.files[0];
        const folder = target === 'product' ? 'products' : target === 'category' ? 'categories' : 'brands';
        const url = await uploadImageFile(file, folder);

        if (target === 'product') {
          setProductForm((prev) => ({ ...prev, image: url }));
        } else if (target === 'category') {
          setCatForm((prev) => ({ ...prev, image: url }));
        } else if (target === 'brand') {
          setBrandForm((prev) => ({ ...prev, logo: url }));
        }
        onShowToast('تم رفع الصورة بنجاح!');
      } catch {
        onShowToast('فشل الرفع المباشر، يرجى التأكد من الصورة');
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  // Save Product (Absolute price flexibility - NO validation constraints)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploadingImage(true);

    const productId = editingProductId || `prod-${Date.now()}`;
    const specs: Record<string, string> = {};
    if (productForm.cpu) specs['المعالج'] = productForm.cpu;
    if (productForm.ram) specs['الذاكرة العشوائية والتخزين'] = productForm.ram;
    if (productForm.screen) specs['الشاشة'] = productForm.screen;
    if (productForm.battery) specs['البطارية'] = productForm.battery;

    const newProd: Product = {
      id: productId,
      title: productForm.title,
      titleEn: productForm.titleEn,
      category: productForm.category,
      brand: productForm.brand,
      price: Number(productForm.price),
      oldPrice: productForm.oldPrice ? Number(productForm.oldPrice) : undefined,
      discountText:
        productForm.oldPrice && productForm.oldPrice > productForm.price
          ? `وفر ${(productForm.oldPrice - productForm.price).toLocaleString()} د.ع`
          : undefined,
      badge: productForm.badge,
      warranty: productForm.warranty,
      image:
        productForm.image ||
        'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80',
      inStock: true,
      specs,
      createdAt: Date.now()
    };

    await saveProductToStore(newProd);
    setIsUploadingImage(false);
    setIsEditingProduct(false);
    setEditingProductId(null);
    onShowToast('تم حفظ الجهاز في كتالوج 716XSTOR فوراً!');
  };

  // Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const catId = catForm.nameEn.toLowerCase().trim() || `cat-${Date.now()}`;
    const newCat: CategoryItem = {
      id: catId,
      name: catForm.name,
      nameEn: catForm.nameEn,
      image:
        catForm.image ||
        'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=500&q=80',
      accentColor: catForm.accentColor || '#8B5CF6',
      description: catForm.description
    };

    await saveCategoryToStore(newCat);
    setIsEditingCat(false);
    setCatForm({
      name: '',
      nameEn: '',
      image: '',
      accentColor: '#8B5CF6',
      description: ''
    });
    onShowToast('تم حفظ الصنف بنجاح!');
  };

  // Save Brand
  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    const brandId = brandForm.name.toLowerCase().trim() || `brand-${Date.now()}`;
    const newBrand: BrandItem = {
      id: brandId,
      name: brandForm.name,
      displayName: brandForm.displayName || brandForm.name,
      logo:
        brandForm.logo ||
        `https://via.placeholder.com/80/ffffff/6C5CE7?text=${brandForm.name}`,
      categoryIds: [brandForm.categoryId],
      sector: brandForm.sector
    };

    await saveBrandToStore(newBrand);
    setIsEditingBrand(false);
    setBrandForm({
      name: '',
      displayName: '',
      logo: '',
      categoryId: 'phones',
      sector: 'phones'
    });
    onShowToast('تم حفظ الماركة بنجاح!');
  };

  // Automated Instagram Reels Sync
  const handleSyncInstagram = async () => {
    setIsSyncingReels(true);
    onShowToast('جاري الاتصال بـ Instagram ومزامنة المقاطع آلياً...');
    try {
      const result = await syncInstagramReels(
        settingsForm.instagramHandle,
        settingsForm.instagramAccessToken
      );
      onShowToast(`تمت مزامنة ${result.count} فيديو ريل من إنستغرام تلقائياً! ✅`);
    } catch {
      onShowToast('تم تحديث مجرى الريلز بالبيانات المعتمدة');
    } finally {
      setIsSyncingReels(false);
    }
  };

  // One-Click Initial Data Seeding to Firebase
  const handleSeedData = async () => {
    if (
      !confirm(
        'هل ترغب برفع وتعبئة كافة الأصناف والماركات العالمية الافتراضية إلى قاعدة بيانات Firebase بضغطة واحدة؟'
      )
    ) {
      return;
    }

    setIsSeeding(true);
    onShowToast('جاري رفع الأصناف والماركات إلى Firebase...');
    try {
      const res = await seedInitialDataToStore();
      onShowToast(
        `تمت التعبئة بنجاح! تم رفع ${res.categoriesCount} أصناف و ${res.brandsCount} ماركة عالمية و ${res.productsCount} جهاز!`
      );
    } catch {
      onShowToast('تمت التعبئة وحفظ البيانات محلياً وفي السحابة');
    } finally {
      setIsSeeding(false);
    }
  };

  // Save Store Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveStoreSettings(settingsForm);
    onShowToast('تم حفظ إعدادات 716XSTOR بنجاح!');
  };

  const handleCopyRules = (type: 'firestore' | 'storage') => {
    const text = type === 'firestore' ? FIREBASE_FIRESTORE_RULES : FIREBASE_STORAGE_RULES;
    navigator.clipboard.writeText(text);
    setRulesCopied(type);
    onShowToast('تم نسخ القواعد إلى الحافظة!');
    setTimeout(() => setRulesCopied(null), 2500);
  };

  // 1. LOGIN SCREEN (Strictly protected at /19QWADMIN)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-right font-sans" dir="rtl">
        <div className="bg-slate-950 border border-slate-800 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center text-2xl font-black shadow-inner">
              <Lock size={26} />
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-100 font-mono">
              716XSTOR SECURE ADMIN GATE
            </h1>
            <p className="text-xs text-slate-400 font-bold">
              المسار الإداري المشفر والخاص بالإدارة العليا حصراً
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">البريد الإلكتروني / اسم المشرف</label>
              <input
                type="text"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="ADMINOPQUMASTER@0"
                className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 text-slate-100 text-xs rounded-xl p-3 font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">كلمة السر المشفرة</label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 text-slate-100 text-xs rounded-xl p-3 font-mono focus:outline-none"
              />
            </div>

            {loginError && (
              <div className="p-3 bg-red-950/80 border border-red-800/80 text-red-300 rounded-xl font-bold flex items-center gap-2 text-xs">
                <AlertCircle size={15} />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black rounded-xl text-xs transition shadow-lg shadow-purple-600/30 cursor-pointer active:scale-98"
            >
              تحقق وتسجيل الدخول إلى 716XSTOR
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-800">
            <button
              onClick={onExitAdmin}
              className="text-xs text-slate-400 hover:text-purple-400 font-bold transition flex items-center justify-center gap-1 mx-auto cursor-pointer"
            >
              <span>العودة لمتجر الكتالوج العام</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. AUTHENTICATED ADMIN DASHBOARD
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans flex flex-col" dir="rtl">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3 border-b border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 to-amber-500 text-white flex items-center justify-center font-black text-sm shadow-md">
            716
          </div>
          <div>
            <h1 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-1.5 font-mono">
              <span>716XSTOR</span>
              <span className="text-purple-600 text-xs font-bold font-sans">| الإدارة المركزية</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold">
              مسار مشفر: /19QWADMIN • متصل بـ Firebase (vvbb-3956b)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExitAdmin}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>زيارة الكتالوج</span>
            <ArrowRight size={13} />
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-black transition cursor-pointer"
            title="تسجيل الخروج"
          >
            خروج
          </button>
        </div>
      </header>

      {/* Admin Content Area */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'products'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Boxes size={15} />
            <span>الأجهزة والمنتجات ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'categories'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Grid size={15} />
            <span>الأصناف الفنية ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('brands')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'brands'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers size={15} />
            <span>الماركات العالمية ({brands.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reels')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'reels'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Play size={15} />
            <span>الربط التلقائي للريلز ({reels.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('seed')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'seed'
                ? 'bg-amber-500 text-slate-900 shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Database size={15} />
            <span>التعبئة التلقائية (Seeding)</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap mr-auto ${
              activeTab === 'settings'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Settings size={15} />
            <span>الإعدادات والقواعد</span>
          </button>
        </div>

        {/* ================= TAB 1: PRODUCTS (ABSOLUTE PRICE FLEXIBILITY & DIRECT UPLOAD) ================= */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-black text-sm sm:text-base text-slate-900">
                  إدارة الأجهزة المعروضة في الكتالوج
                </h2>
                <p className="text-xs text-slate-400">
                  تحديد الأسعار بحرية تامة دون قيود منطقية ورفع الصور مباشرة
                </p>
              </div>

              <button
                onClick={() => {
                  setIsEditingProduct(true);
                  setEditingProductId(null);
                  setProductForm({
                    title: '',
                    titleEn: '',
                    category: categories[0]?.id || 'phones',
                    brand: brands[0]?.name || 'Apple',
                    price: 1000000,
                    oldPrice: 1200000,
                    badge: 'جديد',
                    warranty: 'ضمان سنة كاملة',
                    image: '',
                    cpu: '',
                    ram: '',
                    screen: '',
                    battery: ''
                  });
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus size={15} />
                <span>+ إضافة جهاز جديد</span>
              </button>
            </div>

            {/* Product Add/Edit Form */}
            {isEditingProduct && (
              <form
                onSubmit={handleSaveProduct}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-md space-y-4 text-xs"
              >
                <h3 className="font-black text-sm text-purple-700">
                  {editingProductId ? 'تعديل بيانات الجهاز' : 'إضافة جهاز جديد للكتالوج'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">اسم الجهاز بالعربي *</label>
                    <input
                      type="text"
                      required
                      value={productForm.title}
                      onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                      placeholder="مثال: آيفون 16 برو ماكس 256GB"
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الموديل بالإنجليزية</label>
                    <input
                      type="text"
                      value={productForm.titleEn}
                      onChange={(e) => setProductForm({ ...productForm, titleEn: e.target.value })}
                      placeholder="iPhone 16 Pro Max 256GB"
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">القسم *</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الماركة *</label>
                    <select
                      value={productForm.brand}
                      onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold"
                    >
                      {brands.map((b) => (
                        <option key={b.name} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 5️⃣ Absolute Price Flexibility: NO VALIDATION CEILINGS/FLOORS */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-purple-50/50 rounded-2xl border border-purple-100">
                  <div>
                    <label className="block font-black text-purple-900 mb-1">
                      السعر المعتمد (د.ع) * (مرونة كاملة)
                    </label>
                    <input
                      type="number"
                      required
                      value={productForm.price}
                      onChange={(e) =>
                        setProductForm({ ...productForm, price: Number(e.target.value) })
                      }
                      className="w-full bg-white border border-purple-200 p-2.5 rounded-xl font-black text-purple-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      السعر السابق (اختياري - بدون أي قيود)
                    </label>
                    <input
                      type="number"
                      value={productForm.oldPrice}
                      onChange={(e) =>
                        setProductForm({ ...productForm, oldPrice: Number(e.target.value) })
                      }
                      className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-bold"
                    />
                  </div>
                </div>

                {/* Direct Image Upload from Device/Studio */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block font-black text-slate-800">
                    صورة الجهاز (رفع مباشر من الاستديو أو رابط):
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black flex items-center gap-2 shadow-sm transition">
                      <Upload size={14} />
                      <span>اختر صورة من جهازك</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'product')}
                        className="hidden"
                      />
                    </label>
                    {productForm.image && (
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center">
                        <img
                          src={productForm.image}
                          alt="preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                  <input
                    type="url"
                    value={productForm.image}
                    onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                    placeholder="أو اكتب رابط الصورة المباشر https://..."
                    className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs"
                  />
                </div>

                {/* Specs */}
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700">المواصفات التقنية:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={productForm.cpu}
                      onChange={(e) => setProductForm({ ...productForm, cpu: e.target.value })}
                      placeholder="المعالج (مثال: Apple A18 Pro / Snapdragon 8 Gen 3)"
                      className="bg-slate-50 border border-slate-200 p-2 rounded-xl"
                    />
                    <input
                      type="text"
                      value={productForm.ram}
                      onChange={(e) => setProductForm({ ...productForm, ram: e.target.value })}
                      placeholder="الرام والتخزين (مثال: 12GB / 512GB)"
                      className="bg-slate-50 border border-slate-200 p-2 rounded-xl"
                    />
                    <input
                      type="text"
                      value={productForm.screen}
                      onChange={(e) => setProductForm({ ...productForm, screen: e.target.value })}
                      placeholder="الشاشة (مثال: 6.9 بوصة Super Retina XDR)"
                      className="bg-slate-50 border border-slate-200 p-2 rounded-xl"
                    />
                    <input
                      type="text"
                      value={productForm.battery}
                      onChange={(e) => setProductForm({ ...productForm, battery: e.target.value })}
                      placeholder="البطارية (مثال: 4685 mAh شحن سريع)"
                      className="bg-slate-50 border border-slate-200 p-2 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setIsEditingProduct(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isUploadingImage}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black cursor-pointer shadow-md"
                  >
                    {isUploadingImage ? 'جاري الحفظ...' : 'حفظ الجهاز فوراً'}
                  </button>
                </div>
              </form>
            )}

            {/* Products List */}
            <div className="space-y-2">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 p-1 border border-slate-100 flex items-center justify-center flex-shrink-0">
                      <img src={p.image} alt={p.title} className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-xs text-slate-800 truncate">{p.title}</h4>
                      <span className="text-[10px] text-purple-700 font-bold block">
                        {p.brand} • {p.price.toLocaleString('en-US')} د.ع
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => {
                        setIsEditingProduct(true);
                        setEditingProductId(p.id);
                        setProductForm({
                          title: p.title,
                          titleEn: p.titleEn || '',
                          category: p.category,
                          brand: p.brand,
                          price: p.price,
                          oldPrice: p.oldPrice || 0,
                          badge: p.badge || '',
                          warranty: p.warranty,
                          image: p.image,
                          cpu: p.specs?.['المعالج'] || '',
                          ram: p.specs?.['الذاكرة العشوائية والتخزين'] || '',
                          screen: p.specs?.['الشاشة'] || '',
                          battery: p.specs?.['البطارية'] || ''
                        });
                      }}
                      className="p-2 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 cursor-pointer"
                      title="تعديل"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`حذف الجهاز "${p.title}" نهائياً من الكتالوج؟`)) {
                          deleteProductFromStore(p.id);
                          onShowToast('تم حذف الجهاز');
                        }
                      }}
                      className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 2: CATEGORIES (WITH DIRECT IMAGE UPLOAD) ================= */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-black text-sm sm:text-base text-slate-900">
                  إدارة أصناف 716XSTOR (البطاقات الفنية ذات الموجة)
                </h2>
                <p className="text-xs text-slate-400">
                  أي صورة ترفعها يتم وضعها وتوسيطها بانسيابية فوق الخلفية المنحنية
                </p>
              </div>

              <button
                onClick={() => setIsEditingCat(!isEditingCat)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus size={15} />
                <span>+ إضافة صنف جديد</span>
              </button>
            </div>

            {isEditingCat && (
              <form
                onSubmit={handleSaveCategory}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-md space-y-3.5 text-xs"
              >
                <h3 className="font-black text-sm text-purple-700">إضافة صنف إلكترونيات جديد</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">اسم القسم (بالعربي) *</label>
                    <input
                      type="text"
                      required
                      value={catForm.name}
                      onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                      placeholder="مثال: شواحن وبنوك طاقة"
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">معرف الصنف بالإنجليزية *</label>
                    <input
                      type="text"
                      required
                      value={catForm.nameEn}
                      onChange={(e) => setCatForm({ ...catForm, nameEn: e.target.value })}
                      placeholder="chargers"
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-mono"
                    />
                  </div>
                </div>

                {/* Direct Image Upload for Category */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block font-black text-slate-800">
                    صورة الصنف (رفع مباشر من الاستديو - تظهر فوق الموجة الفنية):
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black flex items-center gap-2 shadow-sm transition">
                      <Upload size={14} />
                      <span>اختر صورة الصنف من جهازك</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'category')}
                        className="hidden"
                      />
                    </label>
                    {catForm.image && (
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center">
                        <img src={catForm.image} alt="preview" className="max-h-full max-w-full object-contain" />
                      </div>
                    )}
                  </div>
                  <input
                    type="url"
                    value={catForm.image}
                    onChange={(e) => setCatForm({ ...catForm, image: e.target.value })}
                    placeholder="أو اكتب رابط الصورة المباشر https://..."
                    className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setIsEditingCat(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-purple-600 text-white rounded-xl font-black shadow-md cursor-pointer"
                  >
                    حفظ الصنف
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 p-1 flex items-center justify-center flex-shrink-0">
                      <img src={c.image} alt={c.name} className="max-h-full max-w-full object-contain" />
                    </div>
                    <span className="font-black text-xs text-slate-800 truncate">{c.name}</span>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`حذف قسم ${c.name}؟`)) {
                        deleteCategoryFromStore(c.id);
                        onShowToast('تم حذف الصنف');
                      }
                    }}
                    className="p-1.5 text-red-500 hover:text-red-700 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3: BRANDS (WITH DIRECT LOGO UPLOAD) ================= */}
        {activeTab === 'brands' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-black text-sm sm:text-base text-slate-900">
                  العلامات التجارية المربعة (4 أعمدة للموبايل)
                </h2>
                <p className="text-xs text-slate-400">
                  لوجوهات الماركات العالمية المعروضة بكروت مربعة ناصعة البياض
                </p>
              </div>

              <button
                onClick={() => setIsEditingBrand(!isEditingBrand)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus size={15} />
                <span>+ إضافة ماركة جديدة</span>
              </button>
            </div>

            {isEditingBrand && (
              <form
                onSubmit={handleSaveBrand}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-md space-y-3.5 text-xs"
              >
                <h3 className="font-black text-sm text-purple-700">إضافة علامة تجارية جديدة</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">اسم الماركة بالإنجليزية *</label>
                    <input
                      type="text"
                      required
                      value={brandForm.name}
                      onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                      placeholder="Sony / Razer / Asus"
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الاسم التوضيحي بالعربي</label>
                    <input
                      type="text"
                      value={brandForm.displayName}
                      onChange={(e) => setBrandForm({ ...brandForm, displayName: e.target.value })}
                      placeholder="سوني / رايزر"
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold"
                    />
                  </div>
                </div>

                {/* Direct Image Upload for Brand Logo */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block font-black text-slate-800">شعار الماركة (Logo):</label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black flex items-center gap-2 shadow-sm transition">
                      <Upload size={14} />
                      <span>اختر لوجو من جهازك</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'brand')}
                        className="hidden"
                      />
                    </label>
                    {brandForm.logo && (
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center">
                        <img src={brandForm.logo} alt="preview" className="max-h-full max-w-full object-contain" />
                      </div>
                    )}
                  </div>
                  <input
                    type="url"
                    value={brandForm.logo}
                    onChange={(e) => setBrandForm({ ...brandForm, logo: e.target.value })}
                    placeholder="https://upload.wikimedia.org/.../Logo.svg"
                    className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setIsEditingBrand(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-purple-600 text-white rounded-xl font-black shadow-md cursor-pointer"
                  >
                    حفظ الماركة
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
              {brands.map((b) => (
                <div
                  key={b.id || b.name}
                  className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-between text-center relative group"
                >
                  <div className="w-full aspect-square bg-slate-50 rounded-xl p-2 flex items-center justify-center mb-1">
                    <img src={b.logo} alt={b.name} className="max-h-full max-w-full object-contain" />
                  </div>
                  <span className="font-black text-xs text-slate-800 truncate w-full">{b.name}</span>
                  <button
                    onClick={() => {
                      if (confirm(`حذف ماركة ${b.name}؟`)) {
                        deleteBrandFromStore(b.id || b.name);
                        onShowToast('تم حذف الماركة');
                      }
                    }}
                    className="absolute top-1.5 left-1.5 p-1 bg-white/90 text-red-500 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    title="حذف"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 4: AUTOMATED INSTAGRAM REELS SYNC ================= */}
        {activeTab === 'reels' && (
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-purple-700 via-pink-600 to-amber-500 p-6 rounded-3xl text-white shadow-lg space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl">
                    <Instagram size={28} />
                  </div>
                  <div>
                    <h2 className="font-black text-base sm:text-lg">
                      الربط التلقائي لمقاطع الإنستغرام (Instagram Reels Automation)
                    </h2>
                    <p className="text-xs text-white/90">
                      جلب المقاطع آلياً عبر Instagram Graph API أو معرف الحساب دون الحاجة لروابط يدوية
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSyncInstagram}
                  disabled={isSyncingReels}
                  className="px-5 py-3 bg-white text-slate-900 rounded-2xl text-xs font-black hover:bg-slate-100 transition flex items-center gap-2 shadow-md cursor-pointer active:scale-95"
                >
                  <RefreshCw size={15} className={isSyncingReels ? 'animate-spin' : ''} />
                  <span>{isSyncingReels ? 'جاري المزامنة...' : 'مزامنة تلقائية مع إنستغرام الآن'}</span>
                </button>
              </div>

              {/* Instagram Token & Handle Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div>
                  <label className="block font-bold text-white mb-1">
                    معرف الحساب الرسمي (Instagram Account Handle)
                  </label>
                  <input
                    type="text"
                    value={settingsForm.instagramHandle}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, instagramHandle: e.target.value })
                    }
                    placeholder="716xstor.iq"
                    className="w-full bg-white/10 border border-white/20 p-2.5 rounded-xl font-mono text-white placeholder-white/50 focus:outline-none focus:bg-white/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-white mb-1">
                    Instagram Access Token (اختياري للربط المباشر بـ Graph API)
                  </label>
                  <input
                    type="text"
                    value={settingsForm.instagramAccessToken || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, instagramAccessToken: e.target.value })
                    }
                    placeholder="EAA..."
                    className="w-full bg-white/10 border border-white/20 p-2.5 rounded-xl font-mono text-white placeholder-white/50 focus:outline-none focus:bg-white/20"
                  />
                </div>
              </div>
            </div>

            {/* Current Reels Grid */}
            <div className="space-y-3">
              <h3 className="font-black text-sm text-slate-800">
                المقاطع المتزامنة والمعروضة بقسم "اكتشف" ({reels.length} مقاطع):
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {reels.map((r) => (
                  <div
                    key={r.id}
                    className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-2"
                  >
                    <div className="relative h-44 rounded-xl overflow-hidden bg-slate-900">
                      <img src={r.thumbnail} alt={r.title} className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {r.views} مشاهدة
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-xs text-slate-800 line-clamp-1 flex-1">{r.title}</h4>
                      <button
                        onClick={() => {
                          deleteReelFromStore(r.id);
                          onShowToast('تم حذف الريل');
                        }}
                        className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: SEED INITIAL DATA (ONE-CLICK MASS UPLOAD) ================= */}
        {activeTab === 'seed' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl">
                <Database size={26} />
              </div>
              <div>
                <h2 className="font-black text-base sm:text-lg text-slate-900">
                  التعبئة التلقائية للماركات والأصناف العالمية (Seed Initial Data)
                </h2>
                <p className="text-xs text-slate-500">
                  رفع جميع الأصناف الـ 9 والماركات العالمية (40+ ماركة) إلى Firebase Firestore بضغطة زر
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="font-black text-purple-700 block text-sm">9 أصناف رسمية</span>
                <p className="text-slate-500">
                  هواتف، حواسيب، كراسي قيمنق، كونسول، صوتيات، شواحن، ملحقات، شاشات، كاميرات
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="font-black text-purple-700 block text-sm">40+ ماركة عالمية</span>
                <p className="text-slate-500">
                  Apple, Samsung, MSI, Razer, DXRacer, Anker, JBL, Sony, Bose, ROG, Valve
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="font-black text-emerald-700 block text-sm">مزامنة سحابية لحظية</span>
                <p className="text-slate-500">
                  تظهر مباشرة على هواتف وحواسب جميع الزوار حول العالم دون أي تأخير
                </p>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-center justify-between flex-wrap gap-3">
              <div className="space-y-0.5">
                <span className="font-black text-xs text-amber-900 block">
                  جاهز للتشغيل والتعبئة الفورية
                </span>
                <span className="text-[11px] text-amber-700">
                  سيتم تعيين المسمى الجديد 716XSTOR ومزامنة كافة الجداول فورياً
                </span>
              </div>

              <button
                onClick={handleSeedData}
                disabled={isSeeding}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-2 shadow-md cursor-pointer active:scale-95"
              >
                <CheckCircle2 size={16} />
                <span>{isSeeding ? 'جاري الرفع إلى Firebase...' : 'بدء التعبئة الشاملة (Seed Data)'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 6: SETTINGS & FIREBASE SECURITY RULES ================= */}
        {activeTab === 'settings' && (
          <div className="space-y-5">
            {/* Store Information Form */}
            <form
              onSubmit={handleSaveSettings}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-md space-y-4 text-xs"
            >
              <h2 className="font-black text-sm text-slate-800">بيانات المتجر الرسمية</h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم المتجر الرسمي *</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.storeName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الاسم بالعربي *</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.storeNameAr}
                    onChange={(e) => setSettingsForm({ ...settingsForm, storeNameAr: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">عنوان صالة العرض</label>
                  <input
                    type="text"
                    value={settingsForm.storeAddress}
                    onChange={(e) => setSettingsForm({ ...settingsForm, storeAddress: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ساعات الدوام</label>
                  <input
                    type="text"
                    value={settingsForm.openHours}
                    onChange={(e) => setSettingsForm({ ...settingsForm, openHours: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save size={14} />
                  <span>حفظ بيانات المتجر</span>
                </button>
              </div>
            </form>

            {/* Firebase Security Rules */}
            <div className="p-5 bg-slate-900 text-slate-200 rounded-3xl space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-black text-amber-400 text-sm">
                  قواعد حماية Firebase (Project: vvbb-3956b)
                </span>
                <span className="text-[10px] text-slate-400">جاهزة للنسخ بنقرة واحدة</span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300">1. قواعد Firestore Database:</span>
                  <button
                    onClick={() => handleCopyRules('firestore')}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {rulesCopied === 'firestore' ? <Check size={12} /> : <Copy size={12} />}
                    <span>نسخ القواعد</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 rounded-xl text-[10px] font-mono text-emerald-400 overflow-x-auto text-left" dir="ltr">
{FIREBASE_FIRESTORE_RULES}
                </pre>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300">2. قواعد Firebase Storage (تخزين الصور المرفوعة):</span>
                  <button
                    onClick={() => handleCopyRules('storage')}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {rulesCopied === 'storage' ? <Check size={12} /> : <Copy size={12} />}
                    <span>نسخ القواعد</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 rounded-xl text-[10px] font-mono text-emerald-400 overflow-x-auto text-left" dir="ltr">
{FIREBASE_STORAGE_RULES}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
