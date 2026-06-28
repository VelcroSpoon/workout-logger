import { Tabs } from 'expo-router';
import React from 'react';

import { BottomNav } from '@/components/bottom-nav';
import { WorkoutActiveProvider } from '@/components/workout-active';
import { ExercisesProvider } from '@/components/exercises-context';

export default function TabLayout() {
  return (
    <ExercisesProvider>
      <WorkoutActiveProvider>
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
      </WorkoutActiveProvider>
    </ExercisesProvider>
  );
}
