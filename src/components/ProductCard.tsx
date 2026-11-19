import { Heart, ShoppingCart, Star } from 'lucide-react-native';
import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTransientFlag } from '../hooks/useTransientFlag';
import { useCartStore } from '../store/cartStore';
import { useIsWishlisted, useWishlistStore } from '../store/wishlistStore';
import { colors } from '../theme/colors';
import { radius, shadow, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import type { Product } from '../types/product';
import { formatPrice } from '../utils/currency';
import { formatCategory } from '../utils/products';
import { Button } from './Button';
import { SafeImage } from './SafeImage';

interface Props {
  product: Product;
  width: number;
  onPress: (product: Product) => void;
}

function ProductCardBase({ product, width, onPress }: Props) {
  const wishlisted = useIsWishlisted(product.id);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const addItem = useCartStore((s) => s.addItem);
  const [added, flashAdded] = useTransientFlag();

  const handleAdd = useCallback(() => {
    addItem(product, 1);
    flashAdded();
  }, [addItem, product, flashAdded]);

  const { rate, count } = product.rating;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={product.title}
      onPress={() => onPress(product)}
      style={[styles.card, { width }]}
    >
      <View>
        <SafeImage uri={product.image} inset={spacing.md} style={{ width: '100%', height: width * 0.85 }} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          accessibilityState={{ selected: wishlisted }}
          onPress={() => toggleWishlist(product)}
          hitSlop={6}
          style={styles.heart}
        >
          <Heart
            size={18}
            color={wishlisted ? colors.danger : colors.textMuted}
            fill={wishlisted ? colors.danger : 'transparent'}
            strokeWidth={2}
          />
        </Pressable>
      </View>
      <View style={styles.body}>
        <Text style={styles.category} numberOfLines={1}>
          {formatCategory(product.category)}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        <View style={styles.ratingRow}>
          <Star size={13} color={colors.star} fill={colors.star} strokeWidth={1.5} />
          <Text style={styles.rating}>{count > 0 ? `${rate.toFixed(1)} (${count})` : 'No ratings'}</Text>
        </View>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
        <Button
          compact
          label={added ? 'Added' : 'Add to cart'}
          icon={ShoppingCart}
          onPress={handleAdd}
          variant={added ? 'secondary' : 'primary'}
        />
      </View>
    </Pressable>
  );
}

export const ProductCard = memo(ProductCardBase);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
  },
  heart: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: spacing.md, gap: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
  category: { ...typography.caption, color: colors.textMuted },
  title: { ...typography.bodyStrong, color: colors.text, minHeight: 40 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rating: { ...typography.caption, color: colors.textMuted },
  price: { ...typography.price, color: colors.text, marginBottom: spacing.xs },
});
