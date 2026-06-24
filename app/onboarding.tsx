import { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import type { WeightUnit } from '@/types/workout';
import { DEFAULT_ROUTINE } from '@/data/default-routine';
import {
  saveUnit,
  saveRoutine,
  loadRoutine,
  saveOnboarded,
} from '@/storage/workout-storage';
import { Colors, Spacing, Radius, Fonts } from '@/constants/tokens';
import { ScreenTexture } from '@/components/screen-texture';

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
      <StatusBar style="light" />
      <ScreenTexture />
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
    backgroundColor: Colors.bg,
    padding: Spacing.xxl,
    justifyContent: 'space-between',
  },
  content: { flex: 1, justifyContent: 'center' },
  emoji: { fontSize: 56, marginBottom: Spacing.lg },
  title: {
    fontSize: 40,
    fontFamily: Fonts.heading,
    color: Colors.text,
    letterSpacing: -1,
    lineHeight: 42,
    marginBottom: Spacing.lg,
  },
  subtitle: { fontSize: 16, fontFamily: Fonts.body, color: Colors.textMuted, lineHeight: 23 },

  question: {
    fontSize: 16,
    fontFamily: Fonts.bodySemibold,
    color: Colors.text,
    marginTop: 40,
    marginBottom: Spacing.md,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: Spacing.xs,
  },
  unitOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  unitOptionActive: { backgroundColor: Colors.accent },
  unitOptionText: { fontSize: 16, fontFamily: Fonts.bodyBold, color: Colors.textMuted },
  unitOptionTextActive: { color: Colors.accentText },

  cta: {
    backgroundColor: Colors.accent,
    padding: 18,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  ctaText: { color: Colors.accentText, fontSize: 18, fontFamily: Fonts.bodyBold },
});
