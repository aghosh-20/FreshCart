
import { ArrowLeft, Heart, ShoppingCart, Star } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { QuantitySelector } from '../components/QuantitySelector';
import { SafeImage } from '../components/SafeImage';
import { useProduct } from '../hooks/useProducts';
import { useTransientFlag } from '../hooks/useTransientFlag';
import { useCartQuantity, useCartStore } from '../store/cartStore';
import { useIsWishlisted, useWishlistStore } from '../store/wishlistStore';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import type { DetailsScreenProps } from '../types/navigation';
import { toCents, formatCents, formatPrice } from '../utils/currency';
import { MAX_QUANTITY, MIN_QUANTITY } from '../utils/cartLogic';
import { formatCategory } from '../utils/products';

export default function ProductDetailsScreen({
  navigation,
  route,
}: DetailsScreenProps) {
  const { id, product: initial } = route.params;
  const { data: product, loading, error, retry } = useProduct(id, initial);
  const [quantity, setQuantity] = useState(MIN_QUANTITY);
  const [added, flashAdded] = useTransientFlag();
  const inCart = useCartQuantity(id);
  const wishlisted = useIsWishlisted(id);
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Tabs');
  }, [navigation]);

  const backButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      onPress={goBack}
      hitSlop={8}
      style={styles.iconButton}
    >
      <ArrowLeft size={20} color={colors.text} strokeWidth={2} />
    </Pressable>
  );

  if (!product) {
    return (
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.screen}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.topBar}>{backButton}</View>
          {loading ? (
            <LoadingState message="Loading product" />
          ) : (
            <ErrorState
              message={error ?? 'Product not found.'}
              onRetry={retry}
            />
          )}
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const { rate, count } = product.rating;
  const lineTotal = formatCents(toCents(product.price) * quantity);

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.screen}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.topBar}>
          {backButton}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              wishlisted ? 'Remove from wishlist' : 'Add to wishlist'
            }
            accessibilityState={{ selected: wishlisted }}
            onPress={() => toggleWishlist(product)}
            hitSlop={8}
            style={styles.iconButton}
          >
            <Heart
              size={20}
              color={wishlisted ? colors.danger : colors.text}
              fill={wishlisted ? colors.danger : 'transparent'}
              strokeWidth={2}
            />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <SafeImage
            uri={product.image}
            inset={spacing.xl}
            style={[
              styles.image,
              { height: Math.min(360, height * 0.4) },
            ]}
          />

          <View style={styles.info}>
            <Text style={styles.category}>
              {formatCategory(product.category)}
            </Text>

            <Text style={styles.title}>{product.title}</Text>

            <View style={styles.ratingRow}>
              <Star
                size={16}
                color={colors.star}
                fill={colors.star}
                strokeWidth={1.5}
              />
              <Text style={styles.ratingText}>
                {count > 0
                  ? `${rate.toFixed(1)} from ${count} ${
                      count === 1 ? 'review' : 'reviews'
                    }`
                  : 'No reviews yet'}
              </Text>
            </View>

            <Text style={styles.price}>
              {formatPrice(product.price)}
            </Text>

            {product.description ? (
              <>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>
                  {product.description}
                </Text>
              </>
            ) : null}
          </View>
        </ScrollView>

        <View
          style={[
            styles.bar,
            { paddingBottom: Math.max(insets.bottom, spacing.md) },
          ]}
        >
          <View style={styles.barRow}>
            <QuantitySelector
              value={quantity}
              onIncrement={() =>
                setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))
              }
              onDecrement={() =>
                setQuantity((q) => Math.max(MIN_QUANTITY, q - 1))
              }
            />

            <Button
              label={added ? 'Added to cart' : `Add to cart, ${lineTotal}`}
              icon={ShoppingCart}
              variant={added ? 'secondary' : 'primary'}
              onPress={() => {
                addItem(product, quantity);
                flashAdded();
              }}
              style={styles.addButton}
            />
          </View>

          {inCart > 0 ? (
            <Text style={styles.inCart}>{inCart} in your cart</Text>
          ) : null}
        </View>
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

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    paddingBottom: spacing.xl,
  },

  image: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },

  info: {
    padding: spacing.lg,
    gap: spacing.sm,
  },

  category: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },

  title: {
    ...typography.title,
    fontSize: 22,
    color: colors.text,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  ratingText: {
    ...typography.body,
    color: colors.textMuted,
  },

  price: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xs,
  },

  sectionTitle: {
    ...typography.subheading,
    color: colors.text,
    marginTop: spacing.md,
  },

  description: {
    ...typography.body,
    color: colors.textMuted,
    lineHeight: 22,
  },

  bar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },

  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  addButton: {
    flex: 1,
  },

  inCart: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
