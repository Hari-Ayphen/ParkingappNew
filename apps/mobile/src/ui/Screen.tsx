import { layout, spacing, type as typeScale } from '@spotkey/mobile-ui/theme/tokens';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTokens } from '../theme/ThemeProvider';

/**
 * The mobile layout primitive. Owns screen padding, safe-area insets and the title.
 * A screen never sets its own horizontal padding — docs/design/design-system.md.
 */
export function Screen({
  title,
  children,
  style,
}: {
  title?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
}): React.ReactElement {
  const t = useTokens();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: t.bg,
          paddingTop: insets.top + spacing.l,
          paddingBottom: insets.bottom + spacing.l,
          paddingHorizontal: layout.screenPaddingX,
        },
        style,
      ]}
    >
      {title ? (
        <Text style={[typeScale.h1, { color: t.fg, marginBottom: spacing.xl }]}>{title}</Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
