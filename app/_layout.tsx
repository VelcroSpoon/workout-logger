import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { loadOnboarded } from '@/storage/workout-storage';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Keep the native splash screen visible until we've decided where to
// send the user. Without this, the tabs would flash for a frame before
// a first-time user gets redirected to onboarding.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  // The <Stack> below is always rendered so the navigator is mounted and
  // ready to navigate. The native splash screen stays up (we never auto-
  // hid it) covering everything until we've decided where to go, so the
  // first-launch redirect to onboarding happens unseen.
  useEffect(() => {
    (async () => {
      const onboarded = await loadOnboarded();
      // First launch (flag not set) → send them through onboarding.
      // replace() leaves no history entry, so back won't return to tabs.
      if (!onboarded) router.replace('/onboarding');
      await SplashScreen.hideAsync();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
