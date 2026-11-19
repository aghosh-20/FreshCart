
import { ChevronDown, MapPin } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../components/Button';
import { CategoryItem } from '../components/CategoryItem';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { LocationModal } from '../components/LocationModal';
import { Logo } from '../components/Logo';
import { ProductCard } from '../components/ProductCard';
import { SafeImage } from '../components/SafeImage';
import { SearchBar } from '../components/SearchBar';

import { useCategories, useProducts } from '../hooks/useProducts';
import { getCurrentLocation } from '../services/locationService';
import { useLocationStore } from '../store/locationStore';

import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

import type { TabScreenProps } from '../types/navigation';
import type { Product } from '../types/product';

import { sortProducts } from '../utils/products';

const CARD_WIDTH = 164;
const TOP_RATED_COUNT = 8;

function SectionHeader({
  title,
  onSeeAll,
}: {
  title: string;
  onSeeAll?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {onSeeAll ? (
        <Pressable
          accessibilityRole="button"
          onPress={onSeeAll}
          hitSlop={8}
        >
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const Gap = () => <View style={{ width: spacing.md }} />;

export default function HomeScreen({
  navigation,
}: TabScreenProps<'Home'>) {
  const [query, setQuery] = useState('');
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  const address = useLocationStore((s) => s.address);
  const setAddress = useLocationStore((s) => s.setAddress);

  const categories = useCategories();
  const recommended = useProducts({ limit: 10 });
  const catalogue = useProducts();

  const detectLocation = useCallback(async () => {
    try {
      setLocationLoading(true);
      setLocationError('');

      const location = await getCurrentLocation();
      const place = location.address;

      const formattedAddress = [
        place?.name,
        place?.street,
        place?.district,
        place?.city,
        place?.region,
        place?.postalCode,
      ]
        .filter((part): part is string => Boolean(part))
        .filter((part, index, all) => all.indexOf(part) === index)
        .join(', ');

      if (!formattedAddress) {
        throw new Error('Could not determine your address.');
      }

      setAddress(formattedAddress);
    } catch (error) {
      console.log('Location detection failed:', error);

      setLocationError(
        error instanceof Error
          ? error.message
          : 'Unable to detect your location.',
      );
    } finally {
      setLocationLoading(false);
    }
  }, [setAddress]);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  const topRated = useMemo(
    () =>
      catalogue.data
        ? sortProducts(catalogue.data, 'rating').slice(
            0,
            TOP_RATED_COUNT,
          )
        : [],
    [catalogue.data],
  );

  const refreshing =
    categories.refreshing ||
    recommended.refreshing ||
    catalogue.refreshing;

  const onRefresh = useCallback(() => {
    categories.refresh();
    recommended.refresh();
    catalogue.refresh();
  }, [categories.refresh, recommended.refresh, catalogue.refresh]);

  const openProduct = useCallback(
    (product: Product) =>
      navigation.navigate('ProductDetails', {
        id: product.id,
        product,
      }),
    [navigation],
  );

  const openCategory = useCallback(
    (category: string) => navigation.navigate('Shop', { category }),
    [navigation],
  );

  const submitSearch = useCallback(() => {
    navigation.navigate('Shop', { query: query.trim() });
    setQuery('');
  }, [navigation, query]);

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => (
      <ProductCard
        product={item}
        width={CARD_WIDTH}
        onPress={openProduct}
      />
    ),
    [openProduct],
  );

  const renderCategory = useCallback(
    ({ item }: { item: string }) => (
      <CategoryItem
        category={item}
        onPress={openCategory}
      />
    ),
    [openCategory],
  );

  const bannerProduct = topRated[0];

  const bannerSummary =
    catalogue.data && categories.data
      ? `${catalogue.data.length} products across ${categories.data.length} categories`
      : 'Products from every category';

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.screen}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          <View style={styles.padded}>
            <Logo />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change delivery location"
              onPress={() => setLocationOpen(true)}
              style={styles.location}
            >
              <MapPin
                size={18}
                color={colors.primary}
                strokeWidth={2}
              />

              <View style={styles.locationText}>
                <Text style={styles.locationLabel}>
                  Deliver to
                </Text>

                <Text
                  style={styles.locationValue}
                  numberOfLines={2}
                >
                  {locationLoading
                    ? 'Detecting your location...'
                    : address || 'Set delivery location'}
                </Text>

                {locationError && !address ? (
                  <Text style={styles.locationError}>
                    {locationError}
                  </Text>
                ) : null}
              </View>

              <ChevronDown
                size={18}
                color={colors.textMuted}
                strokeWidth={2}
              />
            </Pressable>

            {!locationLoading && locationError ? (
              <Pressable
                onPress={detectLocation}
                style={styles.retryLocation}
              >
                <Text style={styles.retryText}>
                  Retry location detection
                </Text>
              </Pressable>
            ) : null}

            <SearchBar
              value={query}
              onChangeText={setQuery}
              onSubmit={submitSearch}
            />
          </View>

          <View style={styles.banner}>
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>
                Browse the full catalogue
              </Text>

              <Text style={styles.bannerBody}>
                {bannerSummary}
              </Text>

              <Button
                compact
                label="Shop all products"
                variant="secondary"
                onPress={() => navigation.navigate('Shop')}
                style={styles.bannerButton}
              />
            </View>

            {bannerProduct ? (
              <SafeImage
                uri={bannerProduct.image}
                inset={spacing.sm}
                style={styles.bannerImage}
              />
            ) : null}
          </View>

          <SectionHeader title="Categories" />

          {categories.loading ? (
            <LoadingState compact message="Loading categories" />
          ) : categories.error && !categories.data ? (
            <ErrorState
              compact
              message={categories.error}
              onRetry={categories.retry}
            />
          ) : (
            <FlatList
              horizontal
              data={categories.data ?? []}
              keyExtractor={(c) => c}
              renderItem={renderCategory}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
              ItemSeparatorComponent={Gap}
            />
          )}

          <SectionHeader
            title="Recommended"
            onSeeAll={() => navigation.navigate('Shop')}
          />

          {recommended.loading ? (
            <LoadingState compact message="Loading products" />
          ) : recommended.error && !recommended.data ? (
            <ErrorState
              compact
              message={recommended.error}
              onRetry={recommended.retry}
            />
          ) : (
            <FlatList
              horizontal
              data={recommended.data ?? []}
              keyExtractor={(p) => String(p.id)}
              renderItem={renderProduct}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
              ItemSeparatorComponent={Gap}
              initialNumToRender={4}
            />
          )}

          <SectionHeader
            title="Top rated"
            onSeeAll={() => navigation.navigate('Shop')}
          />

          {catalogue.loading ? (
            <LoadingState compact message="Loading products" />
          ) : catalogue.error && !catalogue.data ? (
            <ErrorState
              compact
              message={catalogue.error}
              onRetry={catalogue.retry}
            />
          ) : (
            <FlatList
              horizontal
              data={topRated}
              keyExtractor={(p) => String(p.id)}
              renderItem={renderProduct}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
              ItemSeparatorComponent={Gap}
              initialNumToRender={4}
            />
          )}
        </ScrollView>

        <LocationModal
          visible={locationOpen}
          initialValue={address}
          onClose={() => setLocationOpen(false)}
          onSave={(value) => {
            setAddress(value);
            setLocationOpen(false);
          }}
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

  content: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },

  padded: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },

  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },

  locationText: {
    flex: 1,
  },

  locationLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },

  locationValue: {
    ...typography.bodyStrong,
    color: colors.text,
  },

  locationError: {
    ...typography.caption,
    color: '#C0392B',
    marginTop: 3,
  },

  retryLocation: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },

  retryText: {
    ...typography.bodyStrong,
    color: colors.primary,
  },

  banner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },

  bannerText: {
    flex: 1,
    gap: spacing.xs,
  },

  bannerTitle: {
    ...typography.heading,
    color: colors.onPrimary,
  },

  bannerBody: {
    ...typography.body,
    color: '#D5E8DB',
  },

  bannerButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },

  bannerImage: {
    width: 104,
    height: 104,
    borderRadius: radius.md,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },

  sectionTitle: {
    ...typography.heading,
    color: colors.text,
  },

  seeAll: {
    ...typography.bodyStrong,
    color: colors.primary,
  },

  hList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
});
