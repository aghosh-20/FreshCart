import type { ApiSortOrder, Product } from '../types/product';
import { normalizeProduct, normalizeProducts } from '../utils/products';
import { axiosInstance } from './axiosInstance';

const CACHE_TTL_MS = 5 * 60 * 1000;

const cache = new Map<string, { time: number; data: unknown }>();
const inFlight = new Map<string, Promise<unknown>>();

/**
 * Small request cache. Fresh results are reused for five minutes and identical concurrent
 * requests share one network call, which prevents duplicate fetches when several screens
 * ask for the same data. `force` bypasses the cache (used by pull-to-refresh and retry).
 */
async function cached<T>(key: string, fetcher: () => Promise<T>, force = false): Promise<T> {
  if (!force) {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.time < CACHE_TTL_MS) return hit.data as T;
    const pending = inFlight.get(key);
    if (pending) return pending as Promise<T>;
  }
  const request = fetcher()
    .then((data) => {
      cache.set(key, { time: Date.now(), data });
      return data;
    })
    .finally(() => {
      if (inFlight.get(key) === request) inFlight.delete(key);
    });
  inFlight.set(key, request);
  return request;
}

export interface ProductQuery {
  limit?: number;
  sort?: ApiSortOrder;
  force?: boolean;
}

/** GET /products, optionally with ?limit= and ?sort= */
export function getProducts({ limit, sort, force }: ProductQuery = {}): Promise<Product[]> {
  const params: Record<string, string | number> = {};
  if (limit !== undefined) params.limit = limit;
  if (sort) params.sort = sort;
  const key = `products:${limit ?? 'all'}:${sort ?? 'default'}`;
  return cached(
    key,
    async () => normalizeProducts((await axiosInstance.get('/products', { params })).data),
    force,
  );
}

/** GET /products/:id */
export function getProductById(id: number, force = false): Promise<Product> {
  return cached(
    `product:${id}`,
    async () => {
      const product = normalizeProduct((await axiosInstance.get(`/products/${id}`)).data);
      if (!product) throw new Error('Unexpected response format');
      return product;
    },
    force,
  );
}

/** GET /products/categories */
export function getCategories(force = false): Promise<string[]> {
  return cached(
    'categories',
    async () => {
      const data = (await axiosInstance.get('/products/categories')).data;
      if (!Array.isArray(data)) throw new Error('Unexpected response format');
      return data.filter((c): c is string => typeof c === 'string');
    },
    force,
  );
}

/** GET /products/category/:category, optionally with ?sort= */
export function getProductsByCategory(
  category: string,
  { sort, force }: Pick<ProductQuery, 'sort' | 'force'> = {},
): Promise<Product[]> {
  return cached(
    `category:${category}:${sort ?? 'default'}`,
    async () =>
      normalizeProducts(
        (
          await axiosInstance.get(`/products/category/${encodeURIComponent(category)}`, {
            params: sort ? { sort } : undefined,
          })
        ).data,
      ),
    force,
  );
}
