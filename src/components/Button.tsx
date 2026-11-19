import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface Props {
  label: string;
  onPress: () => void;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, onPress, icon: Icon, variant = 'primary', disabled, compact, style }: Props) {
  const primary = variant === 'primary';
  const fg = primary ? colors.onPrimary : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        primary ? styles.primary : styles.secondary,
        pressed && { opacity: 0.85 },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {Icon ? <Icon size={compact ? 16 : 18} color={fg} strokeWidth={2} /> : null}
      <Text style={[compact ? styles.labelCompact : styles.label, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  compact: { height: 36, paddingHorizontal: spacing.md },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary },
  label: { ...typography.subheading },
  labelCompact: { ...typography.bodyStrong },
});
