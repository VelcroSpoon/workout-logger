import { Tabs } from 'expo-router';
import React from 'react';

import { BottomNav } from '@/components/bottom-nav';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{ headerShown: false }}>
      {/* Order here sets the route order; the custom BottomNav places the
          center "+" button between Volume and History visually. */}
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="volume" options={{ title: 'Volume' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="routine" options={{ title: 'Routine' }} />
    </Tabs>
  );
}
