import { Cpu, Gem, Shirt, ShoppingBag, Tag, type LucideIcon } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { formatCategory } from '../utils/products';

const ICONS: Record<string, LucideIcon> = {
  electronics: Cpu,
  jewelery: Gem,
  jewelry: Gem,
  "men's clothing": Shirt,
  "women's clothing": ShoppingBag,
};

interface Props {
  category: string;
  onPress: (category: string) => void;
}

/** Category tile for the Home screen. The icon is decorative and falls back to a tag. */
function CategoryItemBase({ category, onPress }: Props) {
  const Icon = ICONS[category] ?? Tag;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Browse ${formatCategory(category)}`}
      onPress={() => onPress(category)}
      style={styles.container}
    >
      <View style={styles.iconBox}>
        <Icon size={26} color={colors.primary} strokeWidth={1.75} />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {formatCategory(category)}
      </Text>
    </Pressable>
  );
}

export const CategoryItem = memo(CategoryItemBase);

const styles = StyleSheet.create({
  container: { width: 88, alignItems: 'center', gap: spacing.sm },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...typography.caption, color: colors.text, textAlign: 'center' },
});
