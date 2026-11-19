import { getCategories, getProductById, getProducts, getProductsByCategory } from '../api/productApi';
import type { ApiSortOrder, Product } from '../types/product';
import { useRemoteData } from './useRemoteData';

interface UseProductsOptions {
  category?: string | null;
  sort?: ApiSortOrder;
  limit?: number;
}

/** Products for the whole catalogue or one category. Optional API-side sort and limit. */
export function useProducts({ category, sort, limit }: UseProductsOptions = {}) {
  return useRemoteData<Product[]>(
    (force) =>
      category
        ? getProductsByCategory(category, { sort, force })
        : getProducts({ sort, limit, force }),
    [category ?? null, sort ?? null, limit ?? null],
  );
}

export function useCategories() {
  return useRemoteData<string[]>((force) => getCategories(force), []);
}

/** Loads one product. `initial` (from navigation) is shown immediately while the fetch runs. */
export function useProduct(id: number, initial?: Product) {
  const result = useRemoteData<Product>((force) => getProductById(id, force), [id], initial ?? null);
  return result;
}
