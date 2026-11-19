import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { CartItem } from '../src/types/cart';
import type { Product } from '../src/types/product';
import { getItemCount, getSubtotalCents, getTotalCents, lineTotalCents } from '../src/utils/calculations';
import { MAX_QUANTITY, addToCart, changeQuantity, removeFromCart, sanitizeCartItems } from '../src/utils/cartLogic';
import { formatCents, formatPrice } from '../src/utils/currency';
import { filterByQuery, formatCategory, normalizeProduct, sortProducts } from '../src/utils/products';

const make = (id: number, price: number, title = `Product ${id}`, rate = 3, count = 10): Product => ({
  id, title, price, description: 'd', category: "men's clothing", image: 'https://x/y.png', rating: { rate, count },
});

test('adding an existing product increases quantity and never duplicates', () => {
  let items: CartItem[] = [];
  items = addToCart(items, make(1, 10));
  items = addToCart(items, make(1, 10), 2);
  items = addToCart(items, make(2, 5));
  assert.equal(items.length, 2);
  assert.equal(items.find((i) => i.product.id === 1)?.quantity, 3);
});

test('quantity never falls below one and never exceeds the maximum', () => {
  let items = addToCart([], make(1, 10));
  items = changeQuantity(items, 1, -1);
  items = changeQuantity(items, 1, -5);
  assert.equal(items[0].quantity, 1);
  items = addToCart(items, make(1, 10), 500);
  assert.equal(items[0].quantity, MAX_QUANTITY);
  assert.equal(addToCart([], make(3, 1), 0)[0].quantity, 1);
  assert.equal(addToCart([], make(3, 1), NaN)[0].quantity, 1);
});

test('removing a product updates totals', () => {
  let items = addToCart(addToCart([], make(1, 10.5), 2), make(2, 3.25));
  assert.equal(getSubtotalCents(items), 2425);
  items = removeFromCart(items, 1);
  assert.equal(getSubtotalCents(items), 325);
  assert.equal(getItemCount(items), 1);
  assert.equal(getSubtotalCents(removeFromCart(items, 2)), 0);
});

test('totals avoid floating point errors', () => {
  const items = addToCart([], make(1, 0.1), 3);
  assert.equal(lineTotalCents(items[0]), 30);
  const many = addToCart(addToCart([], make(1, 109.95), 3), make(2, 22.3), 2);
  assert.equal(getSubtotalCents(many), 32985 + 4460);
  assert.equal(getTotalCents(many), getSubtotalCents(many));
  assert.equal(formatCents(getSubtotalCents(many)), '$374.45');
});

test('currency formatting', () => {
  assert.equal(formatPrice(109.95), '$109.95');
  assert.equal(formatCents(5), '$0.05');
  assert.equal(formatCents(123456789), '$1,234,567.89');
  assert.equal(formatCents(0), '$0.00');
});

test('stored data is validated, malformed entries dropped, duplicates merged', () => {
  const good = make(1, 10);
  const result = sanitizeCartItems([
    { product: good, quantity: 2 },
    { product: good, quantity: 1 },
    { product: { id: 'x' }, quantity: 1 },
    { product: make(2, 4), quantity: 'many' },
    null,
    42,
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0].quantity, 3);
  assert.deepEqual(sanitizeCartItems('corrupt'), []);
  assert.deepEqual(sanitizeCartItems(undefined), []);
});

test('normalizeProduct rejects invalid items and fills missing optional fields', () => {
  assert.equal(normalizeProduct({ id: 1, title: '', price: 1 }), null);
  assert.equal(normalizeProduct({ id: 1, title: 'a', price: -1 }), null);
  assert.equal(normalizeProduct(null), null);
  const p = normalizeProduct({ id: 1, title: 'a', price: 2 });
  assert.deepEqual(p?.rating, { rate: 0, count: 0 });
  assert.equal(p?.image, '');
});

test('search matches every word in the title, ignoring case and curly quotes', () => {
  const list = [make(1, 1, "Mens Casual Slim Fit"), make(2, 1, 'Solid Gold Petite Micropave'), make(3, 1, 'Fjallraven Backpack')];
  assert.deepEqual(filterByQuery(list, 'slim fit').map((p) => p.id), [1]);
  assert.deepEqual(filterByQuery(list, 'GOLD').map((p) => p.id), [2]);
  assert.deepEqual(filterByQuery(list, 'gold backpack'), []);
  assert.equal(filterByQuery(list, '   ').length, 3);
});

test('sorting by price and rating, without mutating the input', () => {
  const list = [make(1, 30, 'a', 3.1, 5), make(2, 10, 'b', 4.8, 5), make(3, 20, 'c', 4.8, 50)];
  assert.deepEqual(sortProducts(list, 'price-asc').map((p) => p.id), [2, 3, 1]);
  assert.deepEqual(sortProducts(list, 'price-desc').map((p) => p.id), [1, 3, 2]);
  assert.deepEqual(sortProducts(list, 'rating').map((p) => p.id), [3, 2, 1]);
  assert.deepEqual(list.map((p) => p.id), [1, 2, 3]);
  assert.equal(sortProducts(list, 'default'), list);
});

test('category names are formatted for display', () => {
  assert.equal(formatCategory("men's clothing"), "Men's Clothing");
  assert.equal(formatCategory('electronics'), 'Electronics');
});
