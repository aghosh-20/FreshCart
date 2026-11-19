import { CircleAlert } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Button } from './Button';

interface Props {
  message: string;
  onRetry: () => void;
  compact?: boolean;
}

export function ErrorState({ message, onRetry, compact }: Props) {
  return (
    <View style={[styles.container, compact && styles.compact]}>
      <CircleAlert size={compact ? 24 : 32} color={colors.danger} strokeWidth={1.75} />
      <Text style={styles.title}>Could not load products</Text>
      <Text style={styles.message}>{message}</Text>
      <Button label="Try again" onPress={onRetry} compact style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  compact: { flex: 0, paddingVertical: spacing.lg },
  title: { ...typography.subheading, color: colors.text },
  message: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  button: { marginTop: spacing.sm, minWidth: 120 },
});
