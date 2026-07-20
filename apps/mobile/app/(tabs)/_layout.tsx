import { Tabs } from 'expo-router';
import { useTokens } from '../../src/theme/ThemeProvider';

/** Bottom nav: Home | Profile | Settings. docs/features/02-after-login-flow.md */
export default function TabsLayout(): React.ReactElement {
  const t = useTokens();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.mutedFg,
        tabBarStyle: { backgroundColor: t.card, borderTopColor: t.border },
        sceneStyle: { backgroundColor: t.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
