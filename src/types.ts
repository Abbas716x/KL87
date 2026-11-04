export type ProductCategory =
  | 'all'
  | 'phones'
  | 'tablets'
  | 'laptops'
  | 'audio'
  | 'gaming'
  | 'monitors'
  | 'accessories'
  | 'chairs';

export interface Product {
  id: string;
  title: string;
  titleEn?: string;
  category: ProductCategory;
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
  category: ProductCategory | string;
  views: string;
  thumbnail: string;
  videoUrl?: string;
  productId?: string;
  productTitle?: string;
  createdAt?: number;
}

export type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'popular';

export interface FilterState {
  category: ProductCategory;
  brand: string;
  minPrice: number;
  maxPrice: number;
  searchQuery: string;
  sortBy: SortOption;
}

export interface BrandInfo {
  name: string;
  displayName: string;
  logo: string;
  category: string;
}
