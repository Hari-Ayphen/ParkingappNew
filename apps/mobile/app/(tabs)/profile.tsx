import { Screen } from '../../src/ui/Screen';
import { Text } from 'react-native';
import { type as typeScale } from '@spotkey/mobile-ui/theme/tokens';
import { useTokens } from '../../src/theme/ThemeProvider';

/** docs/features/15-profile-flow.md — built in v1.0-B. */
export default function Profile(): React.ReactElement {
  const t = useTokens();
  return (
    <Screen title="Profile">
      <Text style={[typeScale.body, { color: t.mutedFg }]}>Coming in v1.0.</Text>
    </Screen>
  );
}
