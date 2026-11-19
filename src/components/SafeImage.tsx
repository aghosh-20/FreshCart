import { ImageOff } from 'lucide-react-native';
import { memo, useEffect, useState } from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  uri: string;
  style?: StyleProp<ViewStyle>;
  /** Inner padding so product photos with tight crops do not touch the edges. */
  inset?: number;
}

/** Product image that shows a neutral fallback when the URL is missing or fails to load. */
function SafeImageBase({ uri, style, inset = 0 }: Props) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  return (
    <View style={[styles.container, style]}>
      {!uri || failed ? (
        <ImageOff size={28} color={colors.textMuted} strokeWidth={1.5} />
      ) : (
        <Image
          source={{ uri }}
          style={[styles.image, { padding: inset }]}
          resizeMode="contain"
          onError={() => setFailed(true)}
          accessibilityIgnoresInvertColors
        />
      )}
    </View>
  );
}

export const SafeImage = memo(SafeImageBase);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
});
