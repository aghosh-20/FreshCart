
import { SearchX } from 'lucide-react-native';
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { ProductCard } from '../components/ProductCard';
import { SearchBar } from '../components/SearchBar';
import { useCategories, useProducts } from '../hooks/useProducts';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import type { TabScreenProps } from '../types/navigation';
import type { Product, SortOption } from '../types/product';
import {
  filterByQuery,
  formatCategory,
  sortProducts,
} from '../utils/products';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
];

const GAP = spacing.md;

export default function ProductListingScreen({
  navigation,
  route,
}: TabScreenProps<'Shop'>) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>('default');
  const deferredQuery = useDeferredValue(query);
  const { width } = useWindowDimensions();

  // Apply filters passed from Home, then clear them from the route.
  const params = route.params;

  useEffect(() => {
    if (!params) return;

    if (params.category !== undefined) {
      setCategory(params.category);
    }

    if (params.query !== undefined) {
      setQuery(params.query);
    }

    if (
      params.category !== undefined ||
      params.query !== undefined
    ) {
      navigation.setParams({
        category: undefined,
        query: undefined,
      });
    }
  }, [params, navigation]);

  const categories = useCategories();

  // Newest sorting is executed by the API.
  const products = useProducts({
    category,
    sort: sort === 'newest' ? 'desc' : undefined,
  });

  const visible = useMemo(() => {
    if (!products.data) return [];

    return sortProducts(
      filterByQuery(products.data, deferredQuery),
      sort,
    );
  }, [products.data, deferredQuery, sort]);

  const columns = width >= 720 ? 3 : 2;

  const cardWidth = Math.floor(
    (width - spacing.lg * 2 - GAP * (columns - 1)) / columns,
  );

  const openProduct = useCallback(
    (product: Product) =>
      navigation.navigate('ProductDetails', {
        id: product.id,
        product,
      }),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <ProductCard
        product={item}
        width={cardWidth}
        onPress={openProduct}
      />
    ),
    [cardWidth, openProduct],
  );

  const clearFilters = useCallback(() => {
    setQuery('');
    setCategory(null);
    setSort('default');
  }, []);

  const hasFilters = query.trim() !== '' || category !== null;

  let emptyComponent: React.ReactElement;

  if (products.loading) {
    emptyComponent = <LoadingState message="Loading products" />;
  } else if (products.error && !products.data) {
    emptyComponent = (
      <ErrorState
        message={products.error}
        onRetry={products.retry}
      />
    );
  } else {
    emptyComponent = (
      <EmptyState
        icon={SearchX}
        title="No products found"
        message={
          query.trim()
            ? `Nothing matches "${query.trim()}"${
                category
                  ? ` in ${formatCategory(category)}`
                  : ''
              }. Try a different word.`
            : 'There are no products in this selection.'
        }
        actionLabel={hasFilters ? 'Clear filters' : undefined}
        onAction={hasFilters ? clearFilters : undefined}
      />
    );
  }

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.screen}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Shop</Text>
          <SearchBar
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            <Chip
              label="All"
              selected={category === null}
              onPress={() => setCategory(null)}
            />

            {(categories.data ?? []).map((c) => (
              <Chip
                key={c}
                label={formatCategory(c)}
                selected={category === c}
                onPress={() => setCategory(c)}
              />
            ))}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {SORT_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                selected={sort === o.value}
                onPress={() => setSort(o.value)}
              />
            ))}
          </ScrollView>
        </View>

        <FlatList
          key={columns}
          data={products.loading ? [] : visible}
          keyExtractor={(p) => String(p.id)}
          renderItem={renderItem}
          numColumns={columns}
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={[
            styles.list,
            visible.length === 0 && styles.listEmpty,
          ]}
          ItemSeparatorComponent={() => (
            <View style={{ height: GAP }} />
          )}
          ListHeaderComponent={
            products.error && products.data ? (
              <View style={styles.refreshError}>
                <Text style={styles.refreshErrorText}>
                  {products.error}
                </Text>
                <Button
                  compact
                  label="Try again"
                  onPress={products.retry}
                  variant="secondary"
                />
              </View>
            ) : visible.length > 0 ? (
              <Text style={styles.count}>
                {visible.length}{' '}
                {visible.length === 1 ? 'product' : 'products'}
              </Text>
            ) : null
          }
          ListEmptyComponent={emptyComponent}
          refreshControl={
            <RefreshControl
              refreshing={products.refreshing}
              onRefresh={products.refresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          keyboardShouldPersistTaps="handled"
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },

  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },

  title: {
    ...typography.title,
    color: colors.text,
  },

  chips: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },

  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  listEmpty: {
    flexGrow: 1,
  },

  count: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },

  refreshError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.dangerSoft,
    borderRadius: 8,
  },

  refreshErrorText: {
    flex: 1,
    ...typography.caption,
    color: colors.danger,
  },
});
