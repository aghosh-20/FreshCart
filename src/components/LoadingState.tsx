import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface Props {
  message?: string;
  compact?: boolean;
}

export function LoadingState({ message = 'Loading', compact }: Props) {
  return (
    <View style={[styles.container, compact && styles.compact]} accessibilityLiveRegion="polite">
      <ActivityIndicator size="small" color={colors.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  compact: { flex: 0, paddingVertical: spacing.xl },
  text: { ...typography.body, color: colors.textMuted },
});
