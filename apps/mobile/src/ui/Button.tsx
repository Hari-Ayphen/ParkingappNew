import { radius, spacing, type as typeScale, layout } from '@spotkey/mobile-ui/theme/tokens';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useTokens } from '../theme/ThemeProvider';

type Variant = 'primary' | 'secondary' | 'ghost';

/**
 * Every async action is double-submit guarded and has a loading state
 * (docs/design/design-system.md → Non-negotiables). `loading` disables the press.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
}): React.ReactElement {
  const t = useTokens();
  const inert = disabled || loading;

  const bg =
    variant === 'primary' ? t.primary : variant === 'secondary' ? 'transparent' : 'transparent';
  const fg = variant === 'primary' ? t.primaryFg : t.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inert, busy: loading }}
      disabled={inert}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: pressed && variant === 'primary' ? t.primaryHover : bg,
          borderColor: variant === 'secondary' ? t.primary : 'transparent',
          borderWidth: variant === 'secondary' ? 2 : 0,
          opacity: inert ? 0.5 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[typeScale.label, { color: fg, fontWeight: '600' }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.touchMin,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
