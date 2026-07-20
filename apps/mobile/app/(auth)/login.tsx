import { radius, spacing, type as typeScale } from '@spotkey/mobile-ui/theme/tokens';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Screen } from '../../src/ui/Screen';
import { Button } from '../../src/ui/Button';
import { useTokens } from '../../src/theme/ThemeProvider';

/** docs/features/01-login-flow.md — US-1. Country picker + phone, requests an OTP. */
export default function Login(): React.ReactElement {
  const t = useTokens();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const send = (): void => {
    setLoading(true);
    setError(null);
    // TODO(v0.1-D): POST /auth/request-otp
    setLoading(false);
    router.push('/(auth)/verify');
  };

  return (
    <Screen title="Enter your number">
      <Text style={[typeScale.body, { color: t.mutedFg, marginBottom: spacing.xl }]}>
        We'll text you a 6-digit code. No password needed.
      </Text>

      <View style={{ flexDirection: 'row', gap: spacing.s, marginBottom: spacing.m }}>
        <View
          style={{
            paddingHorizontal: spacing.l,
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: radius.md,
            backgroundColor: t.card,
          }}
        >
          {/* TODO(v0.1-D): country picker from GET /auth/countries */}
          <Text style={[typeScale.body, { color: t.fg }]}>+91</Text>
        </View>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          keyboardType="number-pad"
          placeholder="Phone number"
          placeholderTextColor={t.mutedFg}
          accessibilityLabel="Phone number"
          style={{
            flex: 1,
            minHeight: 48,
            paddingHorizontal: spacing.l,
            borderWidth: error ? 2 : 1,
            borderColor: error ? t.destructive : t.border,
            borderRadius: radius.md,
            backgroundColor: t.card,
            color: t.fg,
            fontSize: 16,
          }}
        />
      </View>

      {error ? (
        <Text style={[typeScale.caption, { color: t.destructive, marginBottom: spacing.m }]}>
          {error}
        </Text>
      ) : null}

      <Button label="Send code" onPress={send} loading={loading} disabled={phone.length < 6} />
    </Screen>
  );
}
