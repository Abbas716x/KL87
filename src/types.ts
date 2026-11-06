export type ProductCategory =
  | 'all'
  | 'phones'
  | 'laptops'
  | 'chairs'
  | 'gaming'
  | 'audio'
  | 'chargers'
  | 'accessories'
  | 'monitors'
  | 'cameras'
  | string;

export interface CategoryItem {
  id: string;
  name: string;
  nameEn?: string;
  image: string;
  gradient?: string; // Tailwind gradient classes
  accentColor?: string; // Hex color for artistic wave
  description?: string;
  icon?: string;
}

export interface BrandItem {
  id: string;
  name: string;
  displayName: string;
  logo: string;
  categoryIds?: string[]; // categories this brand belongs to
  sector?: 'phones' | 'gaming' | 'audio' | string;
}

export interface Product {
  id: string;
  title: string;
  titleEn?: string;
  category: string;
  brand: string;
  price: number; // In Iraqi Dinars (د.ع) - flexible with NO validation constraints
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

export interface StoreSettings {
  storeName: string;
  storeNameAr: string;
  storeAddress: string;
  openHours: string;
  instagramHandle: string; // e.g. "716xstor.iq"
  instagramAccessToken?: string;
  whatsappNumber?: string;
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
