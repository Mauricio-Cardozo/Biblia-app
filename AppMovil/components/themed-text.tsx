import { C } from '@/constants/theme';
import { Text, type TextProps } from 'react-native';

export function ThemedText({ style, ...rest }: TextProps) {
  return <Text style={[{ color: C.text, fontSize: 16, lineHeight: 24 }, style]} {...rest} />;
}
