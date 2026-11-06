import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Product, Reel, CategoryItem, BrandItem, StoreSettings } from './types';
import { defaultProducts } from './data/defaultProducts';
import { defaultReels } from './data/defaultReels';
import { defaultCategories } from './data/defaultCategories';
import { brandsList } from './data/brands';

export const firebaseConfig = {
  apiKey: "AIzaSyALG7BHFBpezZVQDXI4Q-gF0cL4k68KQZs",
  authDomain: "vvbb-3956b.firebaseapp.com",
  projectId: "vvbb-3956b",
  storageBucket: "vvbb-3956b.firebasestorage.app",
  messagingSenderId: "618916515558",
  appId: "1:618916515558:web:a447abd36a0c79e9967527",
  measurementId: "G-XFTL9VXB9S"
};

// Initialize Firebase safely
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const storage = getStorage(app);

// Storage keys
const PRODUCTS_KEY = 'brand_store_catalog_products';
const REELS_KEY = 'brand_store_catalog_reels';
const CATEGORIES_KEY = 'brand_store_categories';
const BRANDS_KEY = 'brand_store_brands';
const SETTINGS_KEY = 'brand_store_settings';

export const defaultSettings: StoreSettings = {
  whatsappNumber: '9647800000000',
  instagramHandle: 'brandstore.iq',
  storeName: 'BRAND STORE',
  storeNameAr: 'متجر الإلكترونيات المعتمد',
  storeAddress: 'العراق - بغداد - صالة العرض الرئيسية',
  openHours: 'يومياً من 10:00 ص - 11:00 م'
};

// Rules
export const FIREBASE_FIRESTORE_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

export const FIREBASE_STORAGE_RULES = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}`;

// Fast local image compression to avoid upload failures or limits
export async function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

export async function uploadImageFile(file: File, folder: string = 'products'): Promise<string> {
  const fallbackBase64 = await compressImageToDataUrl(file);

  try {
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const storagePath = `${folder}/${Date.now()}_${sanitizedName}`;
    const storageRef = ref(storage, storagePath);

    const uploadPromise = new Promise<string>((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, file, { contentType: file.type });
      task.on(
        'state_changed',
        null,
        (err) => reject(err),
        async () => {
          try {
            const url = await getDownloadURL(task.snapshot.ref);
            resolve(url);
          } catch (e) {
            reject(e);
          }
        }
      );
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Storage upload timeout')), 3500)
    );

    return await Promise.race([uploadPromise, timeoutPromise]);
  } catch (err) {
    console.warn('Storage upload fallback to compressed image:', err);
    return fallbackBase64;
  }
}

// ================= REAL-TIME SUBSCRIBERS =================

// Products
export function subscribeToProducts(callback: (products: Product[]) => void): () => void {
  const cached = localStorage.getItem(PRODUCTS_KEY);
  if (cached) {
    try {
      callback(JSON.parse(cached));
    } catch {
      callback(defaultProducts);
    }
  } else {
    callback(defaultProducts);
  }

  try {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const liveProducts: Product[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          liveProducts.push({
            id: docSnap.id,
            title: d.title || '',
            titleEn: d.titleEn || '',
            category: d.category || 'phones',
            brand: d.brand || 'Apple',
            price: Number(d.price) || 0,
            oldPrice: d.oldPrice ? Number(d.oldPrice) : undefined,
            discountText: d.discountText || undefined,
            badge: d.badge || undefined,
            image: d.image || '',
            gallery: d.gallery || [],
            inStock: d.inStock !== false,
            warranty: d.warranty || 'ضمان معتمد',
            showroomLocation: d.showroomLocation || 'معرض BRAND STORE',
            specs: d.specs || {},
            featured: Boolean(d.featured),
            createdAt: d.createdAt || Date.now()
          });
        });
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(liveProducts));
        callback(liveProducts);
      }
    }, (err) => {
      console.warn('Firestore products listener fallback:', err);
    });
  } catch {
    return () => {};
  }
}

export async function saveProductToStore(product: Product): Promise<void> {
  // Update local storage immediately for zero-delay UX
  const cached = localStorage.getItem(PRODUCTS_KEY);
  let current: Product[] = cached ? JSON.parse(cached) : [...defaultProducts];
  const idx = current.findIndex(p => p.id === product.id);
  if (idx >= 0) {
    current[idx] = product;
  } else {
    current.unshift(product);
  }
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(current));

  try {
    const docRef = doc(db, 'products', product.id);
    const sanitized: Record<string, any> = { ...product };
    Object.keys(sanitized).forEach(k => {
      if (sanitized[k] === undefined) delete sanitized[k];
    });
    await setDoc(docRef, sanitized, { merge: true });
  } catch (err) {
    console.warn('Firestore write warning (saved locally):', err);
  }
}

export async function deleteProductFromStore(productId: string): Promise<void> {
  const cached = localStorage.getItem(PRODUCTS_KEY);
  let current: Product[] = cached ? JSON.parse(cached) : [...defaultProducts];
  current = current.filter(p => p.id !== productId);
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(current));

  try {
    const docRef = doc(db, 'products', productId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore delete warning:', err);
  }
}

// Categories
export function subscribeToCategories(callback: (categories: CategoryItem[]) => void): () => void {
  const cached = localStorage.getItem(CATEGORIES_KEY);
  if (cached) {
    try {
      callback(JSON.parse(cached));
    } catch {
      callback(defaultCategories);
    }
  } else {
    callback(defaultCategories);
  }

  try {
    const refCol = collection(db, 'categories');
    return onSnapshot(refCol, (snapshot) => {
      if (!snapshot.empty) {
        const liveCats: CategoryItem[] = [];
        snapshot.forEach((docSnap) => {
          liveCats.push({ id: docSnap.id, ...docSnap.data() } as CategoryItem);
        });
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(liveCats));
        callback(liveCats);
      }
    }, () => {});
  } catch {
    return () => {};
  }
}

export async function saveCategoryToStore(cat: CategoryItem): Promise<void> {
  const cached = localStorage.getItem(CATEGORIES_KEY);
  let current: CategoryItem[] = cached ? JSON.parse(cached) : [...defaultCategories];
  const idx = current.findIndex(c => c.id === cat.id);
  if (idx >= 0) {
    current[idx] = cat;
  } else {
    current.push(cat);
  }
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(current));

  try {
    const docRef = doc(db, 'categories', cat.id);
    await setDoc(docRef, cat, { merge: true });
  } catch (err) {
    console.warn('Save category error:', err);
  }
}

export async function deleteCategoryFromStore(catId: string): Promise<void> {
  const cached = localStorage.getItem(CATEGORIES_KEY);
  let current: CategoryItem[] = cached ? JSON.parse(cached) : [...defaultCategories];
  current = current.filter(c => c.id !== catId);
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(current));

  try {
    await deleteDoc(doc(db, 'categories', catId));
  } catch (err) {
    console.warn('Delete category error:', err);
  }
}

// Brands
export function subscribeToBrands(callback: (brands: BrandItem[]) => void): () => void {
  const cached = localStorage.getItem(BRANDS_KEY);
  if (cached) {
    try {
      callback(JSON.parse(cached));
    } catch {
      callback(brandsList);
    }
  } else {
    callback(brandsList);
  }

  try {
    const refCol = collection(db, 'brands');
    return onSnapshot(refCol, (snapshot) => {
      if (!snapshot.empty) {
        const liveBrands: BrandItem[] = [];
        snapshot.forEach((docSnap) => {
          liveBrands.push({ id: docSnap.id, ...docSnap.data() } as BrandItem);
        });
        localStorage.setItem(BRANDS_KEY, JSON.stringify(liveBrands));
        callback(liveBrands);
      }
    }, () => {});
  } catch {
    return () => {};
  }
}

export async function saveBrandToStore(brand: BrandItem): Promise<void> {
  const cached = localStorage.getItem(BRANDS_KEY);
  let current: BrandItem[] = cached ? JSON.parse(cached) : [...brandsList];
  const idx = current.findIndex(b => b.id === brand.id);
  if (idx >= 0) {
    current[idx] = brand;
  } else {
    current.push(brand);
  }
  localStorage.setItem(BRANDS_KEY, JSON.stringify(current));

  try {
    const docRef = doc(db, 'brands', brand.id);
    await setDoc(docRef, brand, { merge: true });
  } catch (err) {
    console.warn('Save brand error:', err);
  }
}

export async function deleteBrandFromStore(brandId: string): Promise<void> {
  const cached = localStorage.getItem(BRANDS_KEY);
  let current: BrandItem[] = cached ? JSON.parse(cached) : [...brandsList];
  current = current.filter(b => b.id !== brandId);
  localStorage.setItem(BRANDS_KEY, JSON.stringify(current));

  try {
    await deleteDoc(doc(db, 'brands', brandId));
  } catch (err) {
    console.warn('Delete brand error:', err);
  }
}

// Reels
export function subscribeToReels(callback: (reels: Reel[]) => void): () => void {
  const cached = localStorage.getItem(REELS_KEY);
  if (cached) {
    try {
      callback(JSON.parse(cached));
    } catch {
      callback(defaultReels);
    }
  } else {
    callback(defaultReels);
  }

  try {
    const refCol = collection(db, 'reels');
    return onSnapshot(refCol, (snapshot) => {
      if (!snapshot.empty) {
        const liveReels: Reel[] = [];
        snapshot.forEach((docSnap) => {
          liveReels.push({ id: docSnap.id, ...docSnap.data() } as Reel);
        });
        localStorage.setItem(REELS_KEY, JSON.stringify(liveReels));
        callback(liveReels);
      }
    }, () => {});
  } catch {
    return () => {};
  }
}

export async function saveReelToStore(reel: Reel): Promise<void> {
  const cached = localStorage.getItem(REELS_KEY);
  let current: Reel[] = cached ? JSON.parse(cached) : [...defaultReels];
  const idx = current.findIndex(r => r.id === reel.id);
  if (idx >= 0) {
    current[idx] = reel;
  } else {
    current.unshift(reel);
  }
  localStorage.setItem(REELS_KEY, JSON.stringify(current));

  try {
    const docRef = doc(db, 'reels', reel.id);
    await setDoc(docRef, reel, { merge: true });
  } catch (err) {
    console.warn('Save reel error:', err);
  }
}

export async function deleteReelFromStore(reelId: string): Promise<void> {
  const cached = localStorage.getItem(REELS_KEY);
  let current: Reel[] = cached ? JSON.parse(cached) : [...defaultReels];
  current = current.filter(r => r.id !== reelId);
  localStorage.setItem(REELS_KEY, JSON.stringify(current));

  try {
    await deleteDoc(doc(db, 'reels', reelId));
  } catch (err) {
    console.warn('Delete reel error:', err);
  }
}

// Settings (WhatsApp number, Instagram handle, etc.)
export function subscribeToSettings(callback: (settings: StoreSettings) => void): () => void {
  const cached = localStorage.getItem(SETTINGS_KEY);
  if (cached) {
    try {
      callback(JSON.parse(cached));
    } catch {
      callback(defaultSettings);
    }
  } else {
    callback(defaultSettings);
  }

  try {
    const docRef = doc(db, 'settings', 'general');
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const live = { ...defaultSettings, ...docSnap.data() } as StoreSettings;
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(live));
        callback(live);
      }
    }, () => {});
  } catch {
    return () => {};
  }
}

export async function saveStoreSettings(settings: StoreSettings): Promise<void> {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  try {
    const docRef = doc(db, 'settings', 'general');
    await setDoc(docRef, settings, { merge: true });
  } catch (err) {
    console.warn('Save settings error:', err);
  }
}

// Compatibility helper functions
export function getInstagramHandle(): string {
  const cached = localStorage.getItem(SETTINGS_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      return parsed.instagramHandle || defaultSettings.instagramHandle;
    } catch {
      return defaultSettings.instagramHandle;
    }
  }
  return defaultSettings.instagramHandle;
}

export async function saveInstagramHandle(handle: string): Promise<void> {
  const cached = localStorage.getItem(SETTINGS_KEY);
  let current = defaultSettings;
  if (cached) {
    try {
      current = { ...defaultSettings, ...JSON.parse(cached) };
    } catch {}
  }
  current.instagramHandle = handle;
  await saveStoreSettings(current);
}

export async function fetchProducts(): Promise<Product[]> {
  const cached = localStorage.getItem(PRODUCTS_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      return defaultProducts;
    }
  }
  return defaultProducts;
}

export async function fetchReels(): Promise<Reel[]> {
  const cached = localStorage.getItem(REELS_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      return defaultReels;
    }
  }
  return defaultReels;
}
