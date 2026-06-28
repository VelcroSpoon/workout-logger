import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from 'expo-router';
import type { SplitDay, Routine, RoutineExercise, WeightUnit } from '@/types/workout';
import { DEFAULT_EXERCISES, EXERCISE_MAP } from '@/data/exercises';
import { DEFAULT_ROUTINE } from '@/data/default-routine';
import { loadRoutine, saveRoutine, loadUnit, saveUnit } from '@/storage/workout-storage';
import { SPLIT_DAYS, SPLIT_LABELS } from '@/constants/splits';
import { Colors, Spacing, Radius, Fonts } from '@/constants/tokens';
import { ScreenTexture } from '@/components/screen-texture';

export default function RoutineScreen() {
  const [routine, setRoutine] = useState<Routine>(DEFAULT_ROUTINE);
  const [activeSplit, setActiveSplit] = useState<SplitDay>('push');
  const [unit, setUnit] = useState<WeightUnit>('lb');

  // Load the saved routine + unit each time this tab gains focus, so it
  // reflects changes even if storage changed elsewhere.
  useFocusEffect(
    useCallback(() => {
      loadRoutine().then((saved) => {
        if (saved) setRoutine(saved);
      });
      loadUnit().then(setUnit);
    }, []),
  );

  // Change the weight unit and persist it. State updates the toggle
  // instantly; the Log/History tabs pick it up when they next focus.
  const changeUnit = (next: WeightUnit) => {
    setUnit(next);
    saveUnit(next);
  };

  // ─── One write path for every edit ─────────────────────
  // add / remove / changeSets all funnel through here. We update
  // React state (instant UI) AND persist to storage in the same
  // step, so the two never drift apart.
  const updateDay = useCallback(
    (day: SplitDay, exercises: RoutineExercise[]) => {
      setRoutine((prev) => {
        const next = { ...prev, [day]: exercises };
        saveRoutine(next); // fire-and-forget; UI already updated by setState
        return next;
      });
    },
    [],
  );

  const current = routine[activeSplit];

  const addExercise = (exerciseId: string) => {
    updateDay(activeSplit, [...current, { exerciseId, targetSets: 3 }]);
  };

  const removeExercise = (exerciseId: string) => {
    updateDay(
      activeSplit,
      current.filter((re) => re.exerciseId !== exerciseId),
    );
  };

  const changeSets = (exerciseId: string, delta: number) => {
    updateDay(
      activeSplit,
      current.map((re) =>
        re.exerciseId === exerciseId
          ? { ...re, targetSets: Math.min(8, Math.max(1, re.targetSets + delta)) } // clamp 1–8
          : re,
      ),
    );
  };

  // Move an exercise up (direction -1) or down (direction +1) by
  // swapping it with its neighbor. We bail if the move would fall
  // off either end of the list.
  const moveExercise = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= current.length) return;
    const next = [...current];
    [next[index], next[target]] = [next[target], next[index]]; // swap
    updateDay(activeSplit, next);
  };

  // Library exercises for this split day that aren't already in the routine.
  const available = DEFAULT_EXERCISES.filter(
    (e) =>
      e.splitDay === activeSplit &&
      !current.some((re) => re.exerciseId === e.id),
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScreenTexture />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Edit routine</Text>

        {/* ─── Weight unit toggle ─── */}
        <View style={styles.unitRow}>
          <Text style={styles.unitLabel}>Weight unit</Text>
          <View style={styles.unitToggle}>
            {(['lb', 'kg'] as WeightUnit[]).map((u) => (
              <Pressable
                key={u}
                style={[styles.unitOption, unit === u && styles.unitOptionActive]}
                onPress={() => changeUnit(u)}
              >
                <Text
                  style={[
                    styles.unitOptionText,
                    unit === u && styles.unitOptionTextActive,
                  ]}
                >
                  {u}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ─── Split day selector ─── */}
        <View style={styles.splitTabs}>
          {SPLIT_DAYS.map((day) => (
            <Pressable
              key={day}
              style={[
                styles.splitTab,
                activeSplit === day && styles.splitTabActive,
              ]}
              onPress={() => setActiveSplit(day)}
            >
              <Text
                style={[
                  styles.splitTabText,
                  activeSplit === day && styles.splitTabTextActive,
                ]}
              >
                {SPLIT_LABELS[day]}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ─── Current exercises ─── */}
        <Text style={styles.sectionHeader}>
          Your {SPLIT_LABELS[activeSplit]} Day
        </Text>
        {current.length === 0 ? (
          <Text style={styles.empty}>No exercises yet. Add some below.</Text>
        ) : (
          current.map((re, index) => {
            const ex = EXERCISE_MAP[re.exerciseId];
            if (!ex) return null;
            const isFirst = index === 0;
            const isLast = index === current.length - 1;
            return (
              <View key={re.exerciseId} style={styles.exerciseRow}>
                {/* reorder arrows */}
                <View style={styles.reorder}>
                  <Pressable
                    onPress={() => moveExercise(index, -1)}
                    disabled={isFirst}
                    hitSlop={6}
                  >
                    <Text
                      style={[styles.reorderArrow, isFirst && styles.reorderDisabled]}
                    >
                      ▲
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => moveExercise(index, 1)}
                    disabled={isLast}
                    hitSlop={6}
                  >
                    <Text
                      style={[styles.reorderArrow, isLast && styles.reorderDisabled]}
                    >
                      ▼
                    </Text>
                  </Pressable>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.exerciseName}>{ex.name}</Text>
                  <Text style={styles.muscleTag}>{ex.muscleGroup}</Text>
                </View>

                {/* sets stepper */}
                <View style={styles.stepper}>
                  <Pressable
                    style={styles.stepBtn}
                    onPress={() => changeSets(re.exerciseId, -1)}
                  >
                    <Text style={styles.stepBtnText}>−</Text>
                  </Pressable>
                  <Text style={styles.setCount}>{re.targetSets}</Text>
                  <Pressable
                    style={styles.stepBtn}
                    onPress={() => changeSets(re.exerciseId, 1)}
                  >
                    <Text style={styles.stepBtnText}>+</Text>
                  </Pressable>
                </View>

                <Pressable
                  style={styles.removeBtn}
                  onPress={() => removeExercise(re.exerciseId)}
                >
                  <Text style={styles.removeBtnText}>✕</Text>
                </Pressable>
              </View>
            );
          })
        )}

        {/* ─── Add from library ─── */}
        {available.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Add Exercise</Text>
            {available.map((ex) => (
              <Pressable
                key={ex.id}
                style={styles.addRow}
                onPress={() => addExercise(ex.id)}
              >
                <View>
                  <Text style={styles.exerciseName}>{ex.name}</Text>
                  <Text style={styles.muscleTag}>{ex.muscleGroup}</Text>
                </View>
                <Text style={styles.addPlus}>＋</Text>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl },
  title: {
    fontSize: 28,
    fontFamily: Fonts.headingBold,
    color: Colors.text,
    letterSpacing: -0.5,
  },

  // Weight unit toggle
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
  },
  unitLabel: { fontSize: 15, color: Colors.text },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.sm,
    padding: 2,
  },
  unitOption: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.lg,
    borderRadius: 6,
  },
  unitOptionActive: { backgroundColor: Colors.accent },
  unitOptionText: {
    fontSize: 14,
    fontFamily: Fonts.bodyBold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  unitOptionTextActive: { color: Colors.accentText },

  // Split day selector
  splitTabs: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  splitTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  splitTabActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  splitTabText: { fontSize: 15, fontFamily: Fonts.bodySemibold, color: Colors.textMuted },
  splitTabTextActive: { color: Colors.accentText },

  sectionHeader: {
    fontSize: 13,
    fontFamily: Fonts.bodyBold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.xxl,
    marginBottom: 10,
  },

  empty: { color: Colors.textMuted, fontStyle: 'italic' },

  // Current exercise row
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  // Reorder arrows
  reorder: { justifyContent: 'center', gap: 1 },
  reorderArrow: { fontSize: 13, color: Colors.accent, paddingHorizontal: 2 },
  reorderDisabled: { color: Colors.border },
  exerciseName: { fontSize: 16, fontFamily: Fonts.heading, color: Colors.text },
  muscleTag: {
    fontSize: 10,
    fontFamily: Fonts.bodyBold,
    letterSpacing: 0.6,
    color: Colors.accent,
    backgroundColor: Colors.accentTint,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    textTransform: 'uppercase',
    marginTop: 4,
  },

  // Sets stepper
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 20, fontFamily: Fonts.bodySemibold, color: Colors.text },
  setCount: {
    fontSize: 16,
    fontFamily: Fonts.number,
    color: Colors.text,
    minWidth: 20,
    textAlign: 'center',
  },

  // Remove button
  removeBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: { fontSize: 16, color: Colors.danger },

  // Add-from-library row
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    marginBottom: Spacing.sm,
  },
  addPlus: { fontSize: 22, color: Colors.accent, fontWeight: '600' },
});
