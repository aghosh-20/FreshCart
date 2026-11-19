import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Button } from './Button';

interface Props {
  visible: boolean;
  initialValue: string;
  onSave: (address: string) => void;
  onClose: () => void;
}

export function LocationModal({ visible, initialValue, onSave, onClose }: Props) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fill}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View style={styles.sheet}>
          <Text style={styles.title}>Delivery location</Text>
          <Text style={styles.hint}>Enter the area or address where you want your order delivered.</Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="Area or address"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => onSave(value)}
          />
          <View style={styles.actions}>
            <Button label="Cancel" variant="secondary" onPress={onClose} style={styles.action} />
            <Button label="Save" onPress={() => onSave(value)} style={styles.action} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(23,36,28,0.45)' },
  sheet: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  title: { ...typography.heading, color: colors.text },
  hint: { ...typography.body, color: colors.textMuted },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  actions: { flexDirection: 'row', gap: spacing.md },
  action: { flex: 1 },
});
