import { radius, spacing, type as typeScale } from '@spotkey/mobile-ui/theme/tokens';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Screen } from '../src/ui/Screen';
import { Button } from '../src/ui/Button';
import { useTokens } from '../src/theme/ThemeProvider';

/**
 * GATE 2. docs/features/02-after-login-flow.md
 *
 * The UPI ID collected here is used to generate the exit QR a parker scans, and later as the
 * autopay mandate target. It is NOT an instrument SpotKey charges — the app processes no
 * parking payments.
 */
export default function CompleteProfile(): React.ReactElement {
  const t = useTokens();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', upiId: '' });

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const complete = Object.values(form).every((v) => v.trim().length > 0);

  const field = (label: string, key: keyof typeof form, hint?: string, mono = false) => (
    <View style={{ marginBottom: spacing.m }}>
      <Text style={[typeScale.label, { color: t.fg, marginBottom: spacing.xs }]}>{label}</Text>
      <TextInput
        value={form[key]}
        onChangeText={set(key)}
        accessibilityLabel={label}
        autoCapitalize={key === 'email' || key === 'upiId' ? 'none' : 'words'}
        keyboardType={key === 'email' ? 'email-address' : 'default'}
        style={{
          minHeight: 48,
          paddingHorizontal: spacing.l,
          borderWidth: 1,
          borderColor: t.border,
          borderRadius: radius.md,
          backgroundColor: t.card,
          color: t.fg,
          fontSize: 16,
          fontFamily: mono ? 'JetBrainsMono' : undefined,
        }}
      />
      {hint ? (
        <Text style={[typeScale.caption, { color: t.mutedFg, marginTop: spacing.xs }]}>{hint}</Text>
      ) : null}
    </View>
  );

  return (
    <Screen title="Complete your profile">
      {field('First name', 'firstName')}
      {field('Last name', 'lastName')}
      {field('Email', 'email', 'Where we send your invoices')}
      {field('UPI ID', 'upiId', 'Used to generate your payment QR — we never charge it', true)}

      <Button
        label="Save & continue"
        disabled={!complete}
        onPress={() => {
          // TODO(v0.1-F): PUT /users/me/complete-profile
          router.replace('/(tabs)');
        }}
      />
    </Screen>
  );
}
