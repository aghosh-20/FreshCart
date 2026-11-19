# FreshCart

A grocery-inspired shopping app built with React Native, Expo and TypeScript. It follows the visual direction of the supplied Dribbble reference and shows the real products and categories returned by [FakeStoreAPI](https://fakestoreapi.com/docs).

FakeStoreAPI is a general sample catalogue (clothing, jewelery, electronics), not groceries. No product data is hardcoded. The fresh, grocery style lives in the design only.

## Requirements

- Node.js 20.19 or newer
- npm
- For devices: the Expo Go app (SDK 54), or an Android emulator or iOS simulator

## Install and run

```bash
npm install
npm start            # opens the Expo dev server, press a for Android, i for iOS, w for web
npm run android
npm run ios          # macOS only
npm run web
```

Other commands:

```bash
npm run typecheck    # tsc --noEmit
npm test             # unit tests for cart, totals, search and sorting logic
```

### Build an Android APK

An APK needs a cloud or local Android toolchain, so it is not committed. To produce one:

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview    # eas.json already sets buildType "apk"
```

Alternatively run `npx expo prebuild -p android` and build with Android Studio or `./gradlew assembleRelease`.

## Dependencies

| Package | Purpose |
| --- | --- |
| expo, react-native, react | Runtime (Expo SDK 54) |
| @react-navigation/native, native-stack, bottom-tabs | Navigation |
| axios | HTTP client |
| zustand | State management, with the `persist` middleware |
| @supabase/supabase-js | Authentication, profiles and order history |
| expo-secure-store | Encrypted persistent auth-session storage |
| expo-auth-session, expo-web-browser, expo-linking | Native Google OAuth browser flow |
| expo-image-picker | Profile image selection |
| react-native-url-polyfill | URL support required by Supabase on React Native |
| @react-native-async-storage/async-storage | Local persistence |
| lucide-react-native, react-native-svg | Icons |
| react-native-safe-area-context, react-native-screens | Navigation support |
| react-native-web, react-dom | Web build |
| tsx (dev) | Runs the unit tests |

## Architecture

```
src/
  api/         axiosInstance.ts (client, error messages), productApi.ts (endpoints, cache)
  components/  ProductCard, SearchBar, Chip, CategoryItem, QuantitySelector, SafeImage,
               Button, Logo, LocationModal, LoadingState, ErrorState, EmptyState
  hooks/       useRemoteData (loading, refresh, error), useProducts, useTransientFlag,
               useStoresHydrated
  navigation/  RootNavigator (stack), TabNavigator (bottom tabs with cart badge)
  features/    auth/authStore (Supabase session and profile state)
  screens/     Home, ProductListing, ProductDetails, Cart, Wishlist, Account
supabase/      migrations/ (profiles, demo orders, RLS and avatar storage)
  store/       cartStore, wishlistStore, locationStore, safeStorage
  theme/       colors, typography, spacing
  types/       product, cart, navigation
  utils/       currency, calculations, cartLogic, products, confirm
tests/         logic.test.ts (unit), e2e/flow.py (browser flow, see below)
```

Decisions worth knowing:

- **Pure logic is separate from the stores.** `cartLogic.ts`, `calculations.ts` and `products.ts` have no React Native imports, so they are unit tested directly. Stores only call them.
- **Money is calculated in integer cents.** Prices are converted with `Math.round(price * 100)` so totals never drift (for example 0.1 x 3).
- **No duplicate cart lines.** `addToCart` finds the product by id and increases its quantity. Quantity is clamped between 1 and 99. Removing is a separate action.
- **Persistence.** Zustand `persist` writes the cart, wishlist and delivery location to AsyncStorage on every change. On start the app waits for rehydration (with a 3 second safety timeout) before showing the UI. Stored data is validated on load, so corrupt or outdated entries are dropped and duplicates merged. Storage read and write errors are caught and logged and never crash the app.
- **Fewer requests.** `productApi.ts` caches responses for 5 minutes and shares one in-flight request between identical calls. Search and price/rating sorting run locally on loaded data. Pull-to-refresh and Try again bypass the cache.
- **Stale responses are ignored.** `useRemoteData` discards results from superseded requests, so switching category quickly cannot show the wrong list.
- **Response validation.** Products are checked on arrival. Items missing an id, title or valid price are dropped, and an unexpected response shape produces a readable error.


## Supabase account setup

1. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_SUPABASE_URL` plus your Supabase **publishable** key. Never put a service-role/secret key in the app.
2. In the Supabase SQL Editor, run `supabase/migrations/001_account_and_orders.sql`. It creates `profiles`, `orders`, `order_items`, RLS policies, the `avatars` Storage bucket and the transactional `create_demo_order` RPC.
3. In Authentication → Providers, enable Email. Configure email confirmation as desired.
4. Enable Google in Authentication → Providers and enter the Google OAuth client ID/secret from Google Cloud Console. Add the Supabase callback URL shown in the provider settings to the Google OAuth client's authorised redirect URIs.
5. Add `freshcart://auth/callback` as an allowed redirect URL in Supabase Authentication → URL Configuration. For production, configure the native app scheme and platform OAuth client IDs/redirect handling in the Google Cloud project and test on real Android/iOS builds. Google OAuth cannot work until these dashboard settings and credentials are supplied.
6. Install and start: `npm install`, then `npx expo start`. Native dependencies require a development build for a production app; rebuild after adding them.

### Session behaviour and security

Supabase Auth persists its PKCE session through an Expo SecureStore adapter, split into chunks for larger tokens. Automatic refresh is enabled. App startup waits for session restoration before rendering navigation; logging out signs out of Supabase but does not delete profile or order records. Uninstalling may remove the device session; users can sign in again to retrieve backend data. Avatar files are publicly readable by URL but only the owning authenticated user can upload, replace or delete files in their own UUID folder. If private avatar URLs are required, change the bucket to private and issue signed URLs.

`create_demo_order` writes the order and line items atomically under the authenticated user's UUID. The cart is cleared only after the RPC succeeds. This is a demo checkout, not a payment gateway.

## API usage

| Endpoint | Where it is used |
| --- | --- |
| `GET /products` | Shop screen (All), Home "Top rated" |
| `GET /products?limit=10` | Home "Recommended" |
| `GET /products?sort=desc` | Shop sort "Newest first" |
| `GET /products/:id` | Product details |
| `GET /products/categories` | Home category tiles, Shop category chips |
| `GET /products/category/:category` | Shop category filter (also accepts `?sort=desc`) |

The API has no search, and its `sort` only orders by id. Search by title, price sorting and rating sorting are therefore done on the client.

## Implemented

- Home: logo, delivery location (tap to set, saved on the device), search, banner, category tiles, Recommended and Top rated lists, pull-to-refresh
- Shop: two-column grid (three on wide screens) in a virtualized FlatList, category filter, title search, five sort options, loading, empty and error states with retry, pull-to-refresh
- Details: large image, full title and description, price, rating and review count, quantity selector, add to cart, wishlist toggle
- Cart: line items, quantity controls, remove, clear, item count, line totals, subtotal, total, empty state, tab badge
- Wishlist: saved list, remove, add to cart, open details, empty state, survives restarts
- Image fallback when a URL is missing or fails to load
- App name, icon, adaptive icon, splash and web favicon configured

The banner copy is generated from the API response (product and category counts), so it makes no commercial claim. Delivery fees, taxes and discounts do not exist in this demo, so the total equals the subtotal and the cart says so.

## Testing

What was run:

- `npm run typecheck`: no errors.
- `npm test`: 10 unit tests (duplicate prevention, quantity limits, totals in cents, removal, storage sanitising, search, sorting, formatting). All pass.
- `npx expo export --platform android --platform web`: both bundles build, including the Hermes bytecode for Android.
- `tests/e2e/flow.py`: a Playwright script that drives the **web build** at a phone-sized viewport through the full shopping flow (32 checks): home, search, category filter, all sort options, details, quantity, cart math, wishlist, reload to simulate a restart, removal, clearing, empty states, forced network failure with retry, and broken images. It intercepts requests to fakestoreapi.com and answers from a fixed fixture of 8 products so results are deterministic. It needs `pip install playwright`, a Chromium, and `npx expo export --platform web` first. All 32 checks passed with no console errors.

What was not run, and why:

- **The live FakeStoreAPI was never called** in this environment, because outbound access to fakestoreapi.com was not available. The endpoint paths and response shape follow the official documentation, but please run the app once against the real API.
- **No Android or iOS device or emulator was used.** Native behaviour (safe areas, keyboard handling, the Alert dialog, AsyncStorage on device) is covered by the bundle build and by code written for those platforms, but not by a run.
- **No APK was built.** Use the EAS steps above.
- The Dribbble page could not be read (it renders with JavaScript). The design follows the written brief: a leaf-green palette, off-white background, thin borders, small radii, no gradients, system fonts. Compare against the shot and adjust `src/theme` if needed.
- Screenshots and a screen recording for the submission still need to be captured on a device or emulator.

## Known limitations

- Search and price/rating sort run on the client. That is fine for 20 products. For a large catalogue, move them to the server (see below).
- The API's `jewelery` spelling is kept as returned.
- Cart and wishlist remain device-local in this iteration. FakeStoreAPI cart endpoints are not used.
- Account authentication, profile management, avatar upload and private demo order history are implemented with Supabase.
- Checkout is explicitly a demo order flow; it does not collect payment or claim shipping status.
- Prices are shown in USD as returned by the API.
- A web deployment is not included, so no custom domain has been configured or verified.

## Notes for the review discussion

- **10,000 products:** server-side pagination, search and sort with cursor-based infinite scroll (`onEndReached`), a query library such as TanStack Query for caching, a debounced search input, and `getItemLayout` with fixed card heights.
- **FlatList and images:** the lists already use `initialNumToRender`, `windowSize`, `removeClippedSubviews` and memoised cards with stable callbacks. Next steps are `expo-image` with disk caching and sized thumbnails.
- **Before production:** a real backend for cart and orders, authentication, analytics and crash reporting, localisation and currency handling, accessibility review on devices, E2E tests on native, and a store-ready icon set.
