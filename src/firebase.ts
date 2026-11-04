import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Product, Reel } from './types';
import { defaultProducts } from './data/defaultProducts';
import { defaultReels } from './data/defaultReels';

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

// Local Storage Keys for fast catalog loading and resilient offline backup
const PRODUCTS_STORAGE_KEY = 'brand_store_catalog_products';
const REELS_STORAGE_KEY = 'brand_store_catalog_reels';

/**
 * Fetch all products: Attempts Firestore first, falls back to local storage / default catalog.
 */
export async function fetchProducts(): Promise<Product[]> {
  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, orderBy('createdAt', 'desc'));
    
    // Set a 3.5s timeout for Firestore fetch so offline / slow connections don't hang
    const fetchPromise = getDocs(q);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), 3500)
    );

    const snapshot = await Promise.race([fetchPromise, timeoutPromise]);
    
    if (!snapshot.empty) {
      const remoteProducts: Product[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        remoteProducts.push({
          id: docSnap.id,
          title: data.title || '',
          titleEn: data.titleEn || '',
          category: data.category || 'phones',
          brand: data.brand || 'Original',
          price: Number(data.price) || 0,
          oldPrice: data.oldPrice ? Number(data.oldPrice) : undefined,
          discountText: data.discountText || undefined,
          badge: data.badge || undefined,
          image: data.image || '',
          gallery: data.gallery || [],
          inStock: data.inStock !== false,
          warranty: data.warranty || 'ضمان معتمد',
          showroomLocation: data.showroomLocation || 'معرض BRAND STORE',
          specs: data.specs || {},
          featured: Boolean(data.featured),
          createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt || Date.now())
        });
      });
      // Cache locally
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(remoteProducts));
      return remoteProducts;
    }
  } catch (err) {
    console.warn('Firebase sync notice: using cached or default catalog', err);
  }

  // Fallback to local storage or defaults
  const cached = localStorage.getItem(PRODUCTS_STORAGE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // ignore parse error
    }
  }

  // Fallback to default catalog
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(defaultProducts));
  return defaultProducts;
}

/**
 * Save / Add / Update a product
 */
export async function saveProductToStore(product: Product): Promise<void> {
  // Update local storage first for instant feedback
  const current = await getLocalProducts();
  const index = current.findIndex(p => p.id === product.id);
  if (index >= 0) {
    current[index] = product;
  } else {
    current.unshift(product);
  }
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(current));

  // Try sync with Firestore
  try {
    const docRef = doc(db, 'products', product.id);
    await setDoc(docRef, {
      ...product,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn('Could not write to remote Firestore (saved locally):', err);
  }
}

/**
 * Delete a product
 */
export async function deleteProductFromStore(productId: string): Promise<void> {
  const current = await getLocalProducts();
  const filtered = current.filter(p => p.id !== productId);
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(filtered));

  try {
    const docRef = doc(db, 'products', productId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Could not delete from remote Firestore (deleted locally):', err);
  }
}

/**
 * Fetch all reels
 */
export async function fetchReels(): Promise<Reel[]> {
  try {
    const reelsRef = collection(db, 'reels');
    const snapshot = await getDocs(reelsRef);
    if (!snapshot.empty) {
      const reels: Reel[] = [];
      snapshot.forEach(docSnap => {
        reels.push({ id: docSnap.id, ...docSnap.data() } as Reel);
      });
      localStorage.setItem(REELS_STORAGE_KEY, JSON.stringify(reels));
      return reels;
    }
  } catch (err) {
    console.warn('Reels fetch notice:', err);
  }

  const cached = localStorage.getItem(REELS_STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // ignore
    }
  }

  localStorage.setItem(REELS_STORAGE_KEY, JSON.stringify(defaultReels));
  return defaultReels;
}

export async function saveReelToStore(reel: Reel): Promise<void> {
  const current = await getLocalReels();
  const index = current.findIndex(r => r.id === reel.id);
  if (index >= 0) {
    current[index] = reel;
  } else {
    current.unshift(reel);
  }
  localStorage.setItem(REELS_STORAGE_KEY, JSON.stringify(current));

  try {
    const docRef = doc(db, 'reels', reel.id);
    await setDoc(docRef, reel, { merge: true });
  } catch (err) {
    console.warn('Saved reel locally:', err);
  }
}

export async function deleteReelFromStore(reelId: string): Promise<void> {
  const current = await getLocalReels();
  const filtered = current.filter(r => r.id !== reelId);
  localStorage.setItem(REELS_STORAGE_KEY, JSON.stringify(filtered));

  try {
    const docRef = doc(db, 'reels', reelId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Deleted reel locally:', err);
  }
}

async function getLocalProducts(): Promise<Product[]> {
  const cached = localStorage.getItem(PRODUCTS_STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // ignore
    }
  }
  return defaultProducts;
}

async function getLocalReels(): Promise<Reel[]> {
  const cached = localStorage.getItem(REELS_STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // ignore
    }
  }
  return defaultReels;
}
