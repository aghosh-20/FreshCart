import type { Product, SortOption } from '../types/product';

/** Validates a raw API or storage object. Returns null when required fields are missing. */
export function normalizeProduct(raw: unknown): Product | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'number' || !Number.isFinite(r.id)) return null;
  if (typeof r.title !== 'string' || r.title.trim() === '') return null;
  if (typeof r.price !== 'number' || !Number.isFinite(r.price) || r.price < 0) return null;
  const rating = (r.rating ?? {}) as Record<string, unknown>;
  return {
    id: r.id,
    title: r.title.trim(),
    price: r.price,
    description: typeof r.description === 'string' ? r.description : '',
    category: typeof r.category === 'string' ? r.category : '',
    image: typeof r.image === 'string' ? r.image : '',
    rating: {
      rate: typeof rating.rate === 'number' && Number.isFinite(rating.rate) ? rating.rate : 0,
      count: typeof rating.count === 'number' && Number.isFinite(rating.count) ? rating.count : 0,
    },
  };
}

export function normalizeProducts(raw: unknown): Product[] {
  if (!Array.isArray(raw)) throw new Error('Unexpected response format');
  return raw.map(normalizeProduct).filter((p): p is Product => p !== null);
}

/** "men's clothing" becomes "Men's Clothing". */
export function formatCategory(category: string): string {
  return category.replace(/(^|\s)(\S)/g, (_, space: string, char: string) => space + char.toUpperCase());
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[\u2018\u2019]/g, "'").trim();
}

/** Every word in the query must appear in the title. */
export function filterByQuery(products: Product[], query: string): Product[] {
  const tokens = normalizeText(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return products;
  return products.filter((product) => {
    const title = normalizeText(product.title);
    return tokens.every((token) => title.includes(token));
  });
}

/** "default" and "newest" keep the order returned by the API; the rest sort locally. */
export function sortProducts(products: Product[], sort: SortOption): Product[] {
  switch (sort) {
    case 'price-asc':
      return [...products].sort((a, b) => a.price - b.price);
    case 'price-desc':
      return [...products].sort((a, b) => b.price - a.price);
    case 'rating':
      return [...products].sort((a, b) => b.rating.rate - a.rating.rate || b.rating.count - a.rating.count);
    default:
      return products;
  }
}
