import { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { WeightUnit } from '@/types/workout';
import { DEFAULT_ROUTINE } from '@/data/default-routine';
import {
  saveUnit,
  saveRoutine,
  loadRoutine,
  saveOnboarded,
} from '@/storage/workout-storage';

export default function OnboardingScreen() {
  const router = useRouter();
  const [unit, setUnit] = useState<WeightUnit>('lb');

  // Persist the user's choices, seed a starting routine so the app
  // isn't empty, mark onboarding done, then send them to the app.
  // replace() (not push()) means there's no "back" into onboarding.
  const finish = async () => {
    await saveUnit(unit);
    // Seed the default routine ONLY if one doesn't already exist, so we
    // never wipe a routine the user has already customized.
    const existing = await loadRoutine();
    if (!existing) await saveRoutine(DEFAULT_ROUTINE);
    await saveOnboarded();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🏋️</Text>
        <Text style={styles.title}>Welcome to your PPL log</Text>
        <Text style={styles.subtitle}>
          Built around Push / Pull / Legs. We&apos;ll start you with a
          standard routine — you can add, remove, and reorder exercises
          anytime in the Routine tab.
        </Text>

        {/* Unit choice */}
        <Text style={styles.question}>What unit do you lift in?</Text>
        <View style={styles.unitToggle}>
          {(['lb', 'kg'] as WeightUnit[]).map((u) => (
            <Pressable
              key={u}
              style={[styles.unitOption, unit === u && styles.unitOptionActive]}
              onPress={() => setUnit(u)}
            >
              <Text
                style={[
                  styles.unitOptionText,
                  unit === u && styles.unitOptionTextActive,
                ]}
              >
                {u.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable style={styles.cta} onPress={finish}>
        <Text style={styles.ctaText}>Get started</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'space-between',
  },
  content: { flex: 1, justifyContent: 'center' },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#555', lineHeight: 23 },

  question: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginTop: 40,
    marginBottom: 12,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 4,
  },
  unitOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  unitOptionActive: { backgroundColor: '#2563eb' },
  unitOptionText: { fontSize: 16, fontWeight: '700', color: '#555' },
  unitOptionTextActive: { color: '#fff' },

  cta: {
    backgroundColor: '#2563eb',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
