import { Minus, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MAX_QUANTITY, MIN_QUANTITY } from '../utils/cartLogic';
import { colors } from '../theme/colors';
import { radius } from '../theme/spacing';
import { typography } from '../theme/typography';

interface Props {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  size?: 'md' | 'sm';
}

export function QuantitySelector({ value, onIncrement, onDecrement, size = 'md' }: Props) {
  const box = size === 'md' ? 40 : 32;
  const atMin = value <= MIN_QUANTITY;
  const atMax = value >= MAX_QUANTITY;
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        disabled={atMin}
        onPress={onDecrement}
        hitSlop={6}
        style={[styles.button, { width: box, height: box }, atMin && styles.disabled]}
      >
        <Minus size={16} color={colors.text} strokeWidth={2} />
      </Pressable>
      <Text style={[styles.value, { minWidth: box }]} accessibilityLiveRegion="polite">
        {value}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        disabled={atMax}
        onPress={onIncrement}
        hitSlop={6}
        style={[styles.button, { width: box, height: box }, atMax && styles.disabled]}
      >
        <Plus size={16} color={colors.text} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  button: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
  value: { ...typography.subheading, color: colors.text, textAlign: 'center' },
});
