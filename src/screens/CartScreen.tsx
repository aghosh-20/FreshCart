
import { ShoppingCart, Trash2 } from 'lucide-react-native';
import { Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../api/supabase';
import { useAuthStore } from '../features/auth/authStore';
import { memo, useCallback } from 'react';
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
import { QuantitySelector } from '../components/QuantitySelector';
import { SafeImage } from '../components/SafeImage';
import {
  useCartItemCount,
  useCartStore,
  useCartSubtotalCents,
  useCartTotalCents,
} from '../store/cartStore';
import { colors } from '../theme/colors';
import { radius, shadow, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import type { CartItem } from '../types/cart';
import type { TabScreenProps } from '../types/navigation';
import { lineTotalCents } from '../utils/calculations';
import { confirmAction } from '../utils/confirm';
import { formatCents, formatPrice } from '../utils/currency';

interface RowProps {
  item: CartItem;
  onOpen: (item: CartItem) => void;
}

const CartRow = memo(function CartRow({ item, onOpen }: RowProps) {
  const increment = useCartStore((s) => s.increment);
  const decrement = useCartStore((s) => s.decrement);
  const removeItem = useCartStore((s) => s.removeItem);
  const { product, quantity } = item;

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={product.title}
        onPress={() => onOpen(item)}
      >
        <SafeImage
          uri={product.image}
          inset={spacing.sm}
          style={styles.thumb}
        />
      </Pressable>

      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Pressable style={styles.flex} onPress={() => onOpen(item)}>
            <Text style={styles.rowTitle} numberOfLines={2}>
              {product.title}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${product.title} from cart`}
            onPress={() => removeItem(product.id)}
            hitSlop={8}
          >
            <Trash2
              size={18}
              color={colors.danger}
              strokeWidth={1.75}
            />
          </Pressable>
        </View>

        <Text style={styles.unitPrice}>
          {formatPrice(product.price)} each
        </Text>

        <View style={styles.rowBottom}>
          <QuantitySelector
            size="sm"
            value={quantity}
            onIncrement={() => increment(product.id)}
            onDecrement={() => decrement(product.id)}
          />

          <Text style={styles.lineTotal}>
            {formatCents(lineTotalCents(item))}
          </Text>
        </View>
      </View>
    </View>
  );
});

export default function CartScreen({
  navigation,
}: TabScreenProps<'Cart'>) {
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const itemCount = useCartItemCount();
  const subtotal = useCartSubtotalCents();
  const total = useCartTotalCents();
  const user = useAuthStore((state) => state.user);

  const openItem = useCallback(
    (item: CartItem) =>
      navigation.navigate('ProductDetails', {
        id: item.product.id,
        product: item.product,
      }),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: CartItem }) => (
      <CartRow item={item} onOpen={openItem} />
    ),
    [openItem],
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
          <View>
            <Text style={styles.title}>Cart</Text>
            {items.length > 0 ? (
              <Text style={styles.subtitle}>
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </Text>
            ) : null}
          </View>

          {items.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                confirmAction(
                  'Clear cart',
                  'Remove every item from your cart?',
                  'Clear cart',
                  clear,
                )
              }
              hitSlop={8}
            >
              <Text style={styles.clear}>Clear cart</Text>
            </Pressable>
          ) : null}
        </View>

        {items.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Your cart is empty"
            message="Products you add will appear here with their totals."
            actionLabel="Browse products"
            onAction={() => navigation.navigate('Shop')}
          />
        ) : (
          <>
            <FlatList
              data={items}
              keyExtractor={(i) => String(i.product.id)}
              renderItem={renderItem}
              contentContainerStyle={styles.list}
              ItemSeparatorComponent={() => (
                <View style={{ height: spacing.md }} />
              )}
            />

            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Items</Text>
                <Text style={styles.summaryValue}>{itemCount}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>
                  {formatCents(subtotal)}
                </Text>
              </View>

              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  {formatCents(total)}
                </Text>
              </View>

              <Text style={styles.note}>
                Delivery and taxes are not calculated in this demo.
              </Text>

              <Button
                label="Continue shopping"
                variant="secondary"
                onPress={() => navigation.navigate('Shop')}
              />

              <Button
                label="Place demo order"
                onPress={() => {
                  if (!user) {
                    Alert.alert(
                      'Sign in required',
                      'Sign in from the Account tab before placing an order.',
                      [
                        { text: 'OK' },
                        {
                          text: 'Go to Account',
                          onPress: () => navigation.navigate('Account'),
                        },
                      ],
                    );
                    return;
                  }

                  Alert.alert(
                    'Demo checkout',
                    'This is a demo order only. No payment will be collected.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Confirm order',
                        onPress: () => {
                          void (async () => {
                            const payload = items.map(
                              ({ product, quantity }) => ({
                                product_id: product.id,
                                title: product.title,
                                image: product.image,
                                unit_price: product.price,
                                quantity,
                              }),
                            );

                            const { error } = await supabase.rpc(
                              'create_demo_order',
                              { items: payload },
                            );

                            if (error) {
                              Alert.alert(
                                'Could not place order',
                                error.message,
                              );
                              return;
                            }

                            clear();

                            Alert.alert(
                              'Demo order placed',
                              'Your order has been saved to Shopping History.',
                            );
                          })().catch((e) =>
                            Alert.alert(
                              'Checkout failed',
                              e instanceof Error
                                ? e.message
                                : 'Please try again.',
                            ),
                          );
                        },
                      },
                    ],
                  );
                }}
              />
            </View>
          </>
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
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
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

  clear: {
    ...typography.bodyStrong,
    color: colors.danger,
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
    width: 84,
    height: 84,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  rowBody: {
    flex: 1,
    gap: spacing.xs,
  },

  rowTop: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  rowTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },

  unitPrice: {
    ...typography.caption,
    color: colors.textMuted,
  },

  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },

  lineTotal: {
    ...typography.price,
    color: colors.text,
  },

  summary: {
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  summaryLabel: {
    ...typography.body,
    color: colors.textMuted,
  },

  summaryValue: {
    ...typography.bodyStrong,
    color: colors.text,
  },

  totalRow: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  totalLabel: {
    ...typography.heading,
    color: colors.text,
  },

  totalValue: {
    ...typography.heading,
    color: colors.text,
  },

  note: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
});
