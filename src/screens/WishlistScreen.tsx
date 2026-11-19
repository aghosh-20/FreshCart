
import { Heart, ShoppingCart, Trash2 } from 'lucide-react-native';
import { memo, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { SafeImage } from '../components/SafeImage';
import { useTransientFlag } from '../hooks/useTransientFlag';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { colors } from '../theme/colors';
import { radius, shadow, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import type { TabScreenProps } from '../types/navigation';
import type { Product } from '../types/product';
import { formatPrice } from '../utils/currency';

const WishlistRow = memo(function WishlistRow({
  product,
  onOpen,
}: {
  product: Product;
  onOpen: (p: Product) => void;
}) {
  const remove = useWishlistStore((s) => s.remove);
  const addItem = useCartStore((s) => s.addItem);
  const [added, flashAdded] = useTransientFlag();

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={product.title}
        onPress={() => onOpen(product)}
      >
        <SafeImage
          uri={product.image}
          inset={spacing.sm}
          style={styles.thumb}
        />
      </Pressable>

      <View style={styles.body}>
        <View style={styles.top}>
          <Pressable
            style={styles.flex}
            onPress={() => onOpen(product)}
          >
            <Text style={styles.name} numberOfLines={2}>
              {product.title}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${product.title} from wishlist`}
            onPress={() => remove(product.id)}
            hitSlop={8}
          >
            <Trash2
              size={18}
              color={colors.danger}
              strokeWidth={1.75}
            />
          </Pressable>
        </View>

        <Text style={styles.price}>
          {formatPrice(product.price)}
        </Text>

        <Button
          compact
          icon={ShoppingCart}
          label={added ? 'Added' : 'Add to cart'}
          variant={added ? 'secondary' : 'primary'}
          onPress={() => {
            addItem(product, 1);
            flashAdded();
          }}
          style={styles.addButton}
        />
      </View>
    </View>
  );
});

export default function WishlistScreen({
  navigation,
}: TabScreenProps<'Wishlist'>) {
  const items = useWishlistStore((s) => s.items);

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
      <WishlistRow
        product={item}
        onOpen={openProduct}
      />
    ),
    [openProduct],
  );

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.screen}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Wishlist</Text>

          {items.length > 0 ? (
            <Text style={styles.subtitle}>
              {items.length} saved{' '}
              {items.length === 1 ? 'product' : 'products'}
            </Text>
          ) : null}
        </View>

        {items.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="No saved products"
            message="Tap the heart on any product to keep it here for later."
            actionLabel="Browse products"
            onAction={() => navigation.navigate('Shop')}
          />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(p) => String(p.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => (
              <View style={{ height: spacing.md }} />
            )}
          />
        )}
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

  flex: {
    flex: 1,
  },

  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },

  title: {
    ...typography.title,
    color: colors.text,
  },

  subtitle: {
    ...typography.body,
    color: colors.textMuted,
  },

  list: {
    padding: spacing.lg,
  },

  row: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },

  thumb: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  body: {
    flex: 1,
    gap: spacing.xs,
  },

  top: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  name: {
    ...typography.bodyStrong,
    color: colors.text,
  },

  price: {
    ...typography.price,
    color: colors.text,
  },

  addButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
});
