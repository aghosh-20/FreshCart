
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

export function Logo() {
  return (
    <View style={styles.row} accessibilityRole="header">
      <Image
        source={require('../../assets/images/icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.name}>FreshCart</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logo: {
    width: 36,
    height: 36,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
});
