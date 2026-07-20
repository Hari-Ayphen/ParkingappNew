import { radius, spacing, type as typeScale } from '@spotkey/mobile-ui/theme/tokens';
import { Pressable, Text, View } from 'react-native';
import { Screen } from '../../src/ui/Screen';
import { useTokens } from '../../src/theme/ThemeProvider';

/**
 * The dual-mode hub. docs/features/02-after-login-flow.md
 *
 * Both entry points are ALWAYS visible, whether or not the user owns a space — there is no
 * role selection and no locking into a mode. Tapping "My space" with no space yet leads into
 * Add Space; with spaces, to the dashboard.
 */
export default function Home(): React.ReactElement {
  const t = useTokens();

  const modeCard = (title: string, body: string, onPress: () => void) => (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 140,
        padding: spacing.l,
        borderRadius: radius.lg,
        backgroundColor: t.card,
        borderWidth: 1,
        borderColor: pressed ? t.primary : t.border,
        justifyContent: 'flex-end',
      })}
    >
      <Text style={[typeScale.h3, { color: t.fg, marginBottom: spacing.xs }]}>{title}</Text>
      <Text style={[typeScale.caption, { color: t.mutedFg }]}>{body}</Text>
    </Pressable>
  );

  return (
    <Screen title="SpotKey">
      <View style={{ flexDirection: 'row', gap: spacing.l }}>
        {modeCard('Book a space', 'Find parking near you', () => {
          // TODO(v0.3-D): route to the map/search screen
        })}
        {modeCard('My space', 'List it and earn', () => {
          // TODO(v0.2-C): route to the dashboard, or Add Space if none yet
        })}
      </View>
    </Screen>
  );
}
