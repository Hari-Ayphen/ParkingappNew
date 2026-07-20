import { radius, spacing, type as typeScale } from '@spotkey/mobile-ui/theme/tokens';
import type { ThemePreference } from '@spotkey/mobile-ui/theme/resolve';
import { Pressable, Text, View } from 'react-native';
import { Screen } from '../../src/ui/Screen';
import { useTheme, useTokens } from '../../src/theme/ThemeProvider';

/**
 * The full Settings screen is v1.0-A. The theme picker is here early because the mechanism
 * ships in v0.1-I and it is the only way to exercise both themes on a device — which v0.1's
 * exit criteria require.
 */
const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export default function Settings(): React.ReactElement {
  const t = useTokens();
  const { preference, setPreference } = useTheme();

  return (
    <Screen title="Settings">
      <Text style={[typeScale.overline, { color: t.mutedFg, marginBottom: spacing.m }]}>
        APPEARANCE
      </Text>
      <View style={{ gap: spacing.s }}>
        {OPTIONS.map((o) => {
          const active = preference === o.value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => setPreference(o.value)}
              style={{
                minHeight: 48,
                paddingHorizontal: spacing.l,
                justifyContent: 'center',
                borderRadius: radius.md,
                borderWidth: active ? 2 : 1,
                borderColor: active ? t.primary : t.border,
                backgroundColor: active ? t.primarySubtle : t.card,
              }}
            >
              <Text style={[typeScale.body, { color: active ? t.primary : t.fg }]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
