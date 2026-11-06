export type ProductCategory =
  | 'all'
  | 'phones'
  | 'tablets'
  | 'laptops'
  | 'audio'
  | 'gaming'
  | 'monitors'
  | 'accessories'
  | 'chairs'
  | string;

export interface CategoryItem {
  id: string;
  name: string;
  nameEn?: string;
  image: string;
  gradient: string; // e.g. "from-amber-400 to-amber-500" or hex
  description?: string;
  icon?: string;
}

export interface BrandItem {
  id: string;
  name: string;
  displayName: string;
  logo: string;
  categoryIds?: string[]; // which categories this brand belongs to
}

export interface Product {
  id: string;
  title: string;
  titleEn?: string;
  category: string;
  brand: string;
  price: number; // In Iraqi Dinars (د.ع)
  oldPrice?: number;
  discountText?: string;
  badge?: string;
  image: string;
  gallery?: string[];
  inStock: boolean;
  warranty: string;
  showroomLocation?: string;
  specs: Record<string, string>;
  featured?: boolean;
  createdAt: number;
}

export interface Reel {
  id: string;
  title: string;
  category: string;
  views: string;
  thumbnail: string;
  videoUrl?: string;
  instagramUrl?: string;
  productId?: string;
  productTitle?: string;
  likes?: string;
  createdAt?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CustomerOrderInfo {
  name: string;
  phone: string;
  city: string;
  address: string;
  notes?: string;
}

export interface StoreSettings {
  whatsappNumber: string; // e.g. "9647800000000"
  instagramHandle: string; // e.g. "brandstore.iq"
  storeName: string;
  storeNameAr: string;
  storeAddress: string;
  openHours: string;
}

export type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'popular';

export interface FilterState {
  category: string;
  brand: string;
  minPrice: number;
  maxPrice: number;
  searchQuery: string;
  sortBy: SortOption;
}
