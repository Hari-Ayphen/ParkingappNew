import { radius, spacing, type as typeScale } from '@spotkey/mobile-ui/theme/tokens';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput } from 'react-native';
import { Screen } from '../../src/ui/Screen';
import { Button } from '../../src/ui/Button';
import { useTokens } from '../../src/theme/ThemeProvider';

/** docs/features/01-login-flow.md — US-2/US-3. */
export default function Verify(): React.ReactElement {
  const t = useTokens();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const verify = (): void => {
    setLoading(true);
    // TODO(v0.1-D): POST /auth/verify-otp, then route on `destination`
    // (accept-terms → complete-profile → home). See @spotkey/common postLoginDestination.
    setLoading(false);
    router.replace('/accept-terms');
  };

  return (
    <Screen title="Enter the code">
      <Text style={[typeScale.body, { color: t.mutedFg, marginBottom: spacing.xl }]}>
        Sent to your phone. It expires in a few minutes.
      </Text>

      <TextInput
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        maxLength={6}
        placeholder="000000"
        placeholderTextColor={t.mutedFg}
        accessibilityLabel="6-digit code"
        style={{
          minHeight: 56,
          paddingHorizontal: spacing.l,
          borderWidth: 1,
          borderColor: t.border,
          borderRadius: radius.md,
          backgroundColor: t.card,
          color: t.fg,
          /* Mono: a code transcribed under pressure must not confuse 0/O or 1/l. */
          fontFamily: 'JetBrainsMono',
          fontSize: 24,
          letterSpacing: 8,
          textAlign: 'center',
          marginBottom: spacing.l,
        }}
      />

      <Button label="Verify" onPress={verify} loading={loading} disabled={otp.length !== 6} />
    </Screen>
  );
}
