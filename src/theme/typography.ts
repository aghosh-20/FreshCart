import { TextStyle } from 'react-native';

export const typography = {
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  subheading: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  body: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  bodyStrong: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  price: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
} satisfies Record<string, TextStyle>;
