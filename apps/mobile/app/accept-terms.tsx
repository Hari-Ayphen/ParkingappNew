import { spacing, type as typeScale } from '@spotkey/mobile-ui/theme/tokens';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Screen } from '../src/ui/Screen';
import { Button } from '../src/ui/Button';
import { useTokens } from '../src/theme/ThemeProvider';

/**
 * GATE 1. docs/features/19-terms-acceptance-flow.md
 *
 * This screen sits BEFORE Profile Completion, not after: that screen collects name, email and
 * UPI ID, and consent must precede collecting personal data (Known Gotcha 2, resolved).
 *
 * There is no decline path that continues — declining logs the user out.
 */
export default function AcceptTerms(): React.ReactElement {
  const t = useTokens();
  const [agreed, setAgreed] = useState(false);

  return (
    <Screen title="Before you start">
      <Text style={[typeScale.body, { color: t.mutedFg, marginBottom: spacing.xl }]}>
        Please review our Terms of Service and Privacy Policy.
      </Text>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agreed }}
        onPress={() => setAgreed((v) => !v)}
        style={{
          flexDirection: 'row',
          gap: spacing.m,
          alignItems: 'center',
          marginBottom: spacing.xl,
          minHeight: 44,
        }}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: agreed ? t.primary : t.border,
            backgroundColor: agreed ? t.primary : 'transparent',
          }}
        />
        <Text style={[typeScale.body, { color: t.fg, flex: 1 }]}>
          I agree to the Terms & Privacy Policy
        </Text>
      </Pressable>

      <Button
        label="Continue"
        disabled={!agreed}
        onPress={() => {
          // TODO(v0.1-E): POST /legal/accept-terms with the current version, then continue.
          router.replace('/complete-profile');
        }}
      />
    </Screen>
  );
}
