import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import {
  useFonts,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from '@expo-google-fonts/hanken-grotesk';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { loadOnboarded } from '@/storage/workout-storage';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Keep the native splash screen visible until BOTH the fonts are loaded
// and we've decided where to send the user. Without this we'd flash
// unstyled (fallback-font) text, and the tabs would flicker before a
// first-time user gets redirected to onboarding.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  // The keys here become the font-family names used in styles via the
  // Fonts token (constants/tokens.ts). useFonts returns false until the
  // .ttf files have loaded.
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
  });

  // Once the fonts are registered, the tree below mounts this same render,
  // so the navigator exists — decide the entry route and reveal the app.
  useEffect(() => {
    if (!fontsLoaded) return;
    (async () => {
      const onboarded = await loadOnboarded();
      if (!onboarded) router.replace('/onboarding');
      await SplashScreen.hideAsync();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontsLoaded]);

  // Don't render any screens until the fonts are loaded. Text that mounts
  // referencing a not-yet-registered font can keep the system fallback even
  // after the font arrives — so we wait, while the native splash covers us.
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
