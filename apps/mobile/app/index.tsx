import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../src/theme/ThemeProvider';

/**
 * Splash / route decision. docs/features/00-splash-onboarding-flow.md
 *
 * The stored token is validated silently here before deciding where to send the user.
 * This screen never renders a login form, an error dialog or a permission prompt.
 *
 * TODO(v0.1-D): validate the stored token and branch on the result. Until auth is wired,
 * everyone goes to login.
 */
export default function Splash(): React.ReactElement {
  const { tokens: t, ready } = useTheme();

  // Waiting for the persisted theme avoids a light flash before dark resolves.
  if (!ready) {
    return (
      <View
        style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}
      >
        <ActivityIndicator color={t.primary} />
      </View>
    );
  }

  return <Redirect href="/(auth)/login" />;
}
