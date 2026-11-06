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
  saveReelToStore,
  deleteReelFromStore,
  saveStoreSettings,
  uploadImageFile,
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
  MessageCircle,
  Instagram,
  Boxes,
  Grid,
  Layers,
  Play,
  Settings,
  Upload,
  Lock
} from 'lucide-react';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: CategoryItem[];
  brands: BrandItem[];
  reels: Reel[];
  settings: StoreSettings;
  onShowToast: (msg: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  brands,
  reels,
  settings,
  onShowToast
}) => {
  // Login State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('brand_store_admin_auth') === 'true';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'products' | 'categories' | 'brands' | 'reels' | 'settings'
  >('products');

  // Product Form State
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    title: '',
    titleEn: '',
    category: 'phones',
    brand: 'Apple',
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
  const [isUploading, setIsUploading] = useState(false);

  // Category Form State
  const [isEditingCat, setIsEditingCat] = useState(false);
  const [catForm, setCatForm] = useState({
    name: '',
    nameEn: '',
    image: '',
    gradient: 'from-amber-400/20 to-amber-500/10',
    description: ''
  });

  // Brand Form State
  const [isEditingBrand, setIsEditingBrand] = useState(false);
  const [brandForm, setBrandForm] = useState({
    name: '',
    displayName: '',
    logo: '',
    categoryId: 'phones'
  });

  // Reel Form State
  const [isEditingReel, setIsEditingReel] = useState(false);
  const [reelForm, setReelForm] = useState({
    title: '',
    thumbnail: '',
    videoUrl: '',
    instagramUrl: '',
    views: '1.5K',
    productTitle: ''
  });

  // Settings State
  const [settingsForm, setSettingsForm] = useState<StoreSettings>({ ...settings });
  const [rulesCopied, setRulesCopied] = useState<'firestore' | 'storage' | null>(null);

  if (!isOpen) return null;

  // Login Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === 'ZXCV' && password.trim() === '12XC') {
      setIsAuthenticated(true);
      sessionStorage.setItem('brand_store_admin_auth', 'true');
      setLoginError('');
      onShowToast('تم تسجيل الدخول إلى لوحة الأدمن');
    } else {
      setLoginError('بيانات الدخول غير صحيحة (اسم المستخدم أو كلمة المرور)');
    }
  };

  // Image Upload Handler for Products
  const handleProductImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      onShowToast('جاري ضغط ومعالجة الصورة...');
      try {
        const url = await uploadImageFile(e.target.files[0], 'products');
        setProductForm((prev) => ({ ...prev, image: url }));
        onShowToast('تم تجهيز الصورة بنجاح!');
      } catch {
        onShowToast('فشل الرفع، يرجى استخدام رابط مباشر');
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Save Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

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
          ? `خصم ${(productForm.oldPrice - productForm.price).toLocaleString()} د.ع`
          : undefined,
      badge: productForm.badge,
      warranty: productForm.warranty,
      image:
        productForm.image ||
        'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=700&q=80',
      inStock: true,
      specs,
      createdAt: Date.now()
    };

    await saveProductToStore(newProd);
    setIsUploading(false);
    setIsEditingProduct(false);
    setEditingProductId(null);
    onShowToast('تم حفظ الجهاز وتحديث الكتالوج فوراً!');
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
        'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=400&q=80',
      gradient: catForm.gradient,
      description: catForm.description
    };
    await saveCategoryToStore(newCat);
    setIsEditingCat(false);
    setCatForm({
      name: '',
      nameEn: '',
      image: '',
      gradient: 'from-amber-400/20 to-amber-500/10',
      description: ''
    });
    onShowToast('تم حفظ الصنف الجديد!');
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
      categoryIds: [brandForm.categoryId]
    };
    await saveBrandToStore(newBrand);
    setIsEditingBrand(false);
    setBrandForm({ name: '', displayName: '', logo: '', categoryId: 'phones' });
    onShowToast('تم حفظ الماركة بنجاح!');
  };

  // Save Reel
  const handleSaveReel = async (e: React.FormEvent) => {
    e.preventDefault();
    const newReel: Reel = {
      id: `reel-${Date.now()}`,
      title: reelForm.title,
      thumbnail:
        reelForm.thumbnail ||
        'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=400&q=80',
      videoUrl: reelForm.videoUrl,
      instagramUrl: reelForm.instagramUrl,
      views: reelForm.views || '1.5K',
      category: 'phones',
      productTitle: reelForm.productTitle,
      createdAt: Date.now()
    };
    await saveReelToStore(newReel);
    setIsEditingReel(false);
    setReelForm({
      title: '',
      thumbnail: '',
      videoUrl: '',
      instagramUrl: '',
      views: '1.5K',
      productTitle: ''
    });
    onShowToast('تمت إضافة الريل بنجاح!');
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveStoreSettings(settingsForm);
    onShowToast('تم حفظ إعدادات المتجر والواتساب!');
  };

  const handleCopyRules = (type: 'firestore' | 'storage') => {
    const text = type === 'firestore' ? FIREBASE_FIRESTORE_RULES : FIREBASE_STORAGE_RULES;
    navigator.clipboard.writeText(text);
    setRulesCopied(type);
    onShowToast('تم نسخ القواعد بنجاح!');
    setTimeout(() => setRulesCopied(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border border-slate-100">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black">
              B
            </div>
            <div>
              <h2 className="font-black text-sm sm:text-base text-slate-800">
                لوحة تحكم BRAND STORE
              </h2>
              <p className="text-[10px] text-purple-600 font-bold">
                إدارة الأصناف، الماركات، المنتجات، والواتساب
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 text-slate-600 flex items-center justify-center transition shadow-sm cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* LOGIN SCREEN IF NOT AUTHENTICATED */}
        {!isAuthenticated ? (
          <div className="p-6 sm:p-8 space-y-4 max-w-sm mx-auto my-auto text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Lock size={26} />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-800">دخول المشرف (Admin)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                أدخل اسم المستخدم وكلمة المرور المعتمدة
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3 text-right text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">اسم المستخدم</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ZXCV"
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">كلمة المرور</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••"
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold"
                />
              </div>

              {loginError && (
                <div className="p-2 bg-red-50 text-red-600 rounded-xl font-bold text-xs">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl text-xs transition shadow-md cursor-pointer"
              >
                تسجيل الدخول
              </button>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED ADMIN DASHBOARD */
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 p-2 bg-slate-100/70 overflow-x-auto no-scrollbar border-b border-slate-200/80">
              <button
                onClick={() => setActiveTab('products')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  activeTab === 'products'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                <Boxes size={14} />
                <span>المنتجات ({products.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('categories')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  activeTab === 'categories'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                <Grid size={14} />
                <span>الأصناف ({categories.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('brands')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  activeTab === 'brands'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                <Layers size={14} />
                <span>الماركات ({brands.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('reels')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  activeTab === 'reels'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                <Play size={14} />
                <span>الريلز ({reels.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                <Settings size={14} />
                <span>الواتساب والقواعد</span>
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* 1. PRODUCTS MANAGEMENT */}
              {activeTab === 'products' && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm text-slate-800">قائمة الأجهزة</h3>
                    <button
                      onClick={() => {
                        setIsEditingProduct(true);
                        setEditingProductId(null);
                        setProductForm({
                          title: '',
                          titleEn: '',
                          category: categories[0]?.id || 'phones',
                          brand: brands[0]?.name || 'Apple',
                          price: 500000,
                          oldPrice: 600000,
                          badge: 'جديد',
                          warranty: 'ضمان سنة كاملة',
                          image: '',
                          cpu: '',
                          ram: '',
                          screen: '',
                          battery: ''
                        });
                      }}
                      className="px-3.5 py-1.5 bg-purple-600 text-white rounded-xl font-black flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>+ إضافة جهاز</span>
                    </button>
                  </div>

                  {/* Add / Edit Form Modal inside */}
                  {isEditingProduct && (
                    <form
                      onSubmit={handleSaveProduct}
                      className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-3"
                    >
                      <h4 className="font-black text-purple-700">
                        {editingProductId ? 'تعديل الجهاز' : 'إضافة جهاز جديد للكتالوج'}
                      </h4>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold mb-1">اسم الجهاز بالعربي *</label>
                          <input
                            type="text"
                            required
                            value={productForm.title}
                            onChange={(e) =>
                              setProductForm({ ...productForm, title: e.target.value })
                            }
                            placeholder="آيفون 16 برو ماكس 256GB"
                            className="w-full bg-white border border-slate-200 p-2 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block font-bold mb-1">الموديل بالإنجليزية</label>
                          <input
                            type="text"
                            value={productForm.titleEn}
                            onChange={(e) =>
                              setProductForm({ ...productForm, titleEn: e.target.value })
                            }
                            placeholder="iPhone 16 Pro Max"
                            className="w-full bg-white border border-slate-200 p-2 rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold mb-1">القسم *</label>
                          <select
                            value={productForm.category}
                            onChange={(e) =>
                              setProductForm({ ...productForm, category: e.target.value })
                            }
                            className="w-full bg-white border border-slate-200 p-2 rounded-xl font-bold"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold mb-1">الماركة *</label>
                          <select
                            value={productForm.brand}
                            onChange={(e) =>
                              setProductForm({ ...productForm, brand: e.target.value })
                            }
                            className="w-full bg-white border border-slate-200 p-2 rounded-xl font-bold"
                          >
                            {brands.map((b) => (
                              <option key={b.name} value={b.name}>
                                {b.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold mb-1">السعر المعتمد (د.ع) *</label>
                          <input
                            type="number"
                            required
                            value={productForm.price}
                            onChange={(e) =>
                              setProductForm({ ...productForm, price: Number(e.target.value) })
                            }
                            className="w-full bg-white border border-slate-200 p-2 rounded-xl font-black text-purple-700"
                          />
                        </div>
                        <div>
                          <label className="block font-bold mb-1">السعر السابق (اختياري)</label>
                          <input
                            type="number"
                            value={productForm.oldPrice}
                            onChange={(e) =>
                              setProductForm({ ...productForm, oldPrice: Number(e.target.value) })
                            }
                            className="w-full bg-white border border-slate-200 p-2 rounded-xl"
                          />
                        </div>
                      </div>

                      {/* Image Upload / URL */}
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-2">
                        <label className="block font-bold text-slate-700">
                          صورة الجهاز (رفع مباشر من جهازك أو رابط):
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl font-bold flex items-center gap-1.5">
                            <Upload size={14} />
                            <span>رفع صورة من الاستوديو</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleProductImageSelect}
                              className="hidden"
                            />
                          </label>
                          {productForm.image && (
                            <img
                              src={productForm.image}
                              alt="preview"
                              className="w-10 h-10 object-contain rounded-lg border border-slate-200 bg-slate-50"
                            />
                          )}
                        </div>
                        <input
                          type="url"
                          value={productForm.image}
                          onChange={(e) =>
                            setProductForm({ ...productForm, image: e.target.value })
                          }
                          placeholder="أو اكتب رابط الصورة هنا https://..."
                          className="w-full bg-slate-50 border border-slate-200 p-1.5 rounded-lg text-[11px]"
                        />
                      </div>

                      {/* Specs */}
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={productForm.cpu}
                          onChange={(e) =>
                            setProductForm({ ...productForm, cpu: e.target.value })
                          }
                          placeholder="المعالج (مثال: A18 Pro)"
                          className="bg-white border border-slate-200 p-2 rounded-xl"
                        />
                        <input
                          type="text"
                          value={productForm.ram}
                          onChange={(e) =>
                            setProductForm({ ...productForm, ram: e.target.value })
                          }
                          placeholder="الرام والتخزين (مثال: 8GB / 256GB)"
                          className="bg-white border border-slate-200 p-2 rounded-xl"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t">
                        <button
                          type="button"
                          onClick={() => setIsEditingProduct(false)}
                          className="px-4 py-2 bg-white rounded-xl text-slate-600 font-bold"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          disabled={isUploading}
                          className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black cursor-pointer shadow-sm"
                        >
                          {isUploading ? 'جاري الحفظ...' : 'حفظ الجهاز فوراً'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Products List */}
                  <div className="space-y-2">
                    {products.map((p) => (
                      <div
                        key={p.id}
                        className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={p.image}
                            alt={p.title}
                            className="w-10 h-10 object-contain rounded-lg bg-white p-0.5 border border-slate-200 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <h5 className="font-black text-slate-800 truncate">{p.title}</h5>
                            <span className="text-[10px] text-purple-600 font-bold">
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
                            className="p-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100"
                            title="تعديل"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف ${p.title}؟`)) {
                                deleteProductFromStore(p.id);
                                onShowToast('تم حذف الجهاز');
                              }
                            }}
                            className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
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

              {/* 2. DYNAMIC CATEGORIES MANAGEMENT */}
              {activeTab === 'categories' && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-sm text-slate-800">الأصناف الحالية</h3>
                      <p className="text-[10px] text-slate-400">
                        الأصناف المعروضة في شبكة الأصناف الرئيسية
                      </p>
                    </div>
                    <button
                      onClick={() => setIsEditingCat(!isEditingCat)}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded-xl font-black flex items-center gap-1"
                    >
                      <Plus size={14} />
                      <span>+ إضافة صنف جديد</span>
                    </button>
                  </div>

                  {isEditingCat && (
                    <form
                      onSubmit={handleSaveCategory}
                      className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-3"
                    >
                      <h4 className="font-black text-purple-700">إضافة صنف إلكترونيات جديد</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold mb-1">اسم الصنف (بالعربي) *</label>
                          <input
                            type="text"
                            required
                            value={catForm.name}
                            onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                            placeholder="مثال: شواحن وبنوك طاقة"
                            className="w-full bg-white border border-slate-200 p-2 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block font-bold mb-1">معرف الصنف بالإنجليزية *</label>
                          <input
                            type="text"
                            required
                            value={catForm.nameEn}
                            onChange={(e) => setCatForm({ ...catForm, nameEn: e.target.value })}
                            placeholder="powerbanks"
                            className="w-full bg-white border border-slate-200 p-2 rounded-xl"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold mb-1">رابط صورة الصنف *</label>
                        <input
                          type="url"
                          required
                          value={catForm.image}
                          onChange={(e) => setCatForm({ ...catForm, image: e.target.value })}
                          placeholder="https://..."
                          className="w-full bg-white border border-slate-200 p-2 rounded-xl"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingCat(false)}
                          className="px-4 py-2 bg-white rounded-xl text-slate-600 font-bold"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-purple-600 text-white rounded-xl font-black"
                        >
                          حفظ الصنف
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {categories.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={c.image}
                            alt={c.name}
                            className="w-8 h-8 object-contain rounded-lg bg-slate-50 p-1"
                          />
                          <span className="font-black text-slate-800 text-xs">{c.name}</span>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm(`حذف قسم ${c.name}؟`)) {
                              deleteCategoryFromStore(c.id);
                              onShowToast('تم حذف الصنف');
                            }
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. SQUARE BRANDS MANAGEMENT */}
              {activeTab === 'brands' && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-sm text-slate-800">العلامات التجارية المربعة</h3>
                      <p className="text-[10px] text-slate-400">تظهر في شبكة الماركات المربعة</p>
                    </div>
                    <button
                      onClick={() => setIsEditingBrand(!isEditingBrand)}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded-xl font-black flex items-center gap-1"
                    >
                      <Plus size={14} />
                      <span>+ إضافة ماركة جديدة</span>
                    </button>
                  </div>

                  {isEditingBrand && (
                    <form
                      onSubmit={handleSaveBrand}
                      className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-3"
                    >
                      <h4 className="font-black text-purple-700">إضافة علامة تجارية جديدة</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold mb-1">اسم الماركة *</label>
                          <input
                            type="text"
                            required
                            value={brandForm.name}
                            onChange={(e) =>
                              setBrandForm({ ...brandForm, name: e.target.value })
                            }
                            placeholder="مثال: Sony"
                            className="w-full bg-white border border-slate-200 p-2 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block font-bold mb-1">القسم المرتبط</label>
                          <select
                            value={brandForm.categoryId}
                            onChange={(e) =>
                              setBrandForm({ ...brandForm, categoryId: e.target.value })
                            }
                            className="w-full bg-white border border-slate-200 p-2 rounded-xl font-bold"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold mb-1">رابط الشعار (Logo URL) *</label>
                        <input
                          type="url"
                          required
                          value={brandForm.logo}
                          onChange={(e) =>
                            setBrandForm({ ...brandForm, logo: e.target.value })
                          }
                          placeholder="https://upload.wikimedia.org/.../Logo.svg"
                          className="w-full bg-white border border-slate-200 p-2 rounded-xl"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingBrand(false)}
                          className="px-4 py-2 bg-white rounded-xl text-slate-600 font-bold"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-purple-600 text-white rounded-xl font-black"
                        >
                          حفظ الماركة
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {brands.map((b) => (
                      <div
                        key={b.id || b.name}
                        className="p-2.5 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={b.logo}
                            alt={b.name}
                            className="w-7 h-7 object-contain flex-shrink-0"
                          />
                          <span className="font-black text-slate-800 text-xs truncate">
                            {b.name}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm(`حذف ماركة ${b.name}؟`)) {
                              deleteBrandFromStore(b.id || b.name);
                              onShowToast('تم حذف الماركة');
                            }
                          }}
                          className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. REELS MANAGEMENT */}
              {activeTab === 'reels' && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-sm text-slate-800">مقاطع الريلز (Reels)</h3>
                      <p className="text-[10px] text-slate-400">
                        فيديوهات واستعراضات قسم اكتشف
                      </p>
                    </div>
                    <button
                      onClick={() => setIsEditingReel(!isEditingReel)}
                      className="px-3 py-1.5 bg-pink-600 text-white rounded-xl font-black flex items-center gap-1"
                    >
                      <Plus size={14} />
                      <span>+ إضافة ريل</span>
                    </button>
                  </div>

                  {isEditingReel && (
                    <form
                      onSubmit={handleSaveReel}
                      className="p-4 bg-pink-50/50 rounded-2xl border border-pink-100 space-y-3"
                    >
                      <h4 className="font-black text-pink-700">إضافة فيديو ريل جديد</h4>
                      <div>
                        <label className="block font-bold mb-1">عنوان الفيديو *</label>
                        <input
                          type="text"
                          required
                          value={reelForm.title}
                          onChange={(e) =>
                            setReelForm({ ...reelForm, title: e.target.value })
                          }
                          placeholder="استعراض ميزات iPhone 16 Pro Max"
                          className="w-full bg-white border border-slate-200 p-2 rounded-xl"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold mb-1">صورة الغلاف (Thumbnail) *</label>
                          <input
                            type="url"
                            required
                            value={reelForm.thumbnail}
                            onChange={(e) =>
                              setReelForm({ ...reelForm, thumbnail: e.target.value })
                            }
                            placeholder="https://..."
                            className="w-full bg-white border border-slate-200 p-2 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block font-bold mb-1">رابط الفيديو (MP4)</label>
                          <input
                            type="url"
                            value={reelForm.videoUrl}
                            onChange={(e) =>
                              setReelForm({ ...reelForm, videoUrl: e.target.value })
                            }
                            placeholder="https://..."
                            className="w-full bg-white border border-slate-200 p-2 rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold mb-1">رابط منشور الإنستغرام</label>
                          <input
                            type="url"
                            value={reelForm.instagramUrl}
                            onChange={(e) =>
                              setReelForm({ ...reelForm, instagramUrl: e.target.value })
                            }
                            placeholder="https://instagram.com/reel/..."
                            className="w-full bg-white border border-slate-200 p-2 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block font-bold mb-1">اسم الجهاز المرتبط</label>
                          <input
                            type="text"
                            value={reelForm.productTitle}
                            onChange={(e) =>
                              setReelForm({ ...reelForm, productTitle: e.target.value })
                            }
                            placeholder="iPhone 16 Pro Max"
                            className="w-full bg-white border border-slate-200 p-2 rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingReel(false)}
                          className="px-4 py-2 bg-white rounded-xl text-slate-600 font-bold"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-pink-600 text-white rounded-xl font-black"
                        >
                          حفظ الريل
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2">
                    {reels.map((r) => (
                      <div
                        key={r.id}
                        className="p-2.5 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={r.thumbnail}
                            alt={r.title}
                            className="w-10 h-10 object-cover rounded-lg"
                          />
                          <div>
                            <h5 className="font-black text-slate-800 text-xs">{r.title}</h5>
                            <span className="text-[10px] text-pink-600 font-bold">
                              {r.views} مشاهدة
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (confirm('حذف هذا الريل؟')) {
                              deleteReelFromStore(r.id);
                              onShowToast('تم حذف الريل');
                            }
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. STORE SETTINGS & FIREBASE RULES */}
              {activeTab === 'settings' && (
                <div className="space-y-5 text-xs">
                  {/* WhatsApp & Instagram Form */}
                  <form
                    onSubmit={handleSaveSettings}
                    className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3"
                  >
                    <div className="flex items-center gap-2 text-emerald-600 font-black text-sm">
                      <MessageCircle size={18} />
                      <span>إعدادات التواصل والطلب عبر الواتساب</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          رقم هاتف الواتساب لاستقبال الطلبات *
                        </label>
                        <input
                          type="tel"
                          required
                          value={settingsForm.whatsappNumber}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })
                          }
                          placeholder="9647800000000"
                          className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-black text-purple-700"
                        />
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          اكتب الرقم بالصيغة الدولية (مثال: 9647800000000)
                        </span>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                          <Instagram size={13} className="text-pink-600" />
                          <span>معرف حساب الإنستغرام</span>
                        </label>
                        <input
                          type="text"
                          value={settingsForm.instagramHandle}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, instagramHandle: e.target.value })
                          }
                          placeholder="brandstore.iq"
                          className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-black"
                        />
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          بدون علامة @ (مثال: brandstore.iq)
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black flex items-center gap-1.5 shadow-md cursor-pointer"
                      >
                        <Save size={14} />
                        <span>حفظ إعدادات الواتساب والإنستغرام</span>
                      </button>
                    </div>
                  </form>

                  {/* Firebase Rules Copy Section */}
                  <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-amber-400 text-xs">
                        قواعد حماية فايربيس (Firebase Security Rules):
                      </span>
                      <span className="text-[10px] text-slate-400">Project: vvbb-3956b</span>
                    </div>

                    {/* Firestore Rules */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-300">
                          1. قواعد Firestore Database:
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyRules('firestore')}
                          className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                        >
                          {rulesCopied === 'firestore' ? <Check size={12} /> : <Copy size={12} />}
                          <span>نسخ القواعد</span>
                        </button>
                      </div>
                      <pre className="p-2.5 bg-slate-950 rounded-xl text-[10px] font-mono text-emerald-400 overflow-x-auto text-left" dir="ltr">
{FIREBASE_FIRESTORE_RULES}
                      </pre>
                    </div>

                    {/* Storage Rules */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-300">
                          2. قواعد Firebase Storage (رفع الصور):
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyRules('storage')}
                          className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                        >
                          {rulesCopied === 'storage' ? <Check size={12} /> : <Copy size={12} />}
                          <span>نسخ القواعد</span>
                        </button>
                      </div>
                      <pre className="p-2.5 bg-slate-950 rounded-xl text-[10px] font-mono text-emerald-400 overflow-x-auto text-left" dir="ltr">
{FIREBASE_STORAGE_RULES}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
