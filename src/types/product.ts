export interface ProductRating {
  rate: number;
  count: number;
}

export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: ProductRating;
}

/** Sort values understood by the app. Only "newest" is executed by the API (?sort=desc). */
export type SortOption = 'default' | 'newest' | 'price-asc' | 'price-desc' | 'rating';

export type ApiSortOrder = 'asc' | 'desc';
