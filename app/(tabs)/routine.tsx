import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  NestableScrollContainer,
  NestableDraggableFlatList,
  ScaleDecorator,
  type RenderItemParams,
} from 'react-native-draggable-flatlist';
import type { SplitDay, Routine, RoutineExercise, WeightUnit, MuscleGroup } from '@/types/workout';
import { DEFAULT_ROUTINE } from '@/data/default-routine';
import { SPLIT_MUSCLE_GROUPS, formatMuscle } from '@/data/muscle-targets';
import {
  loadRoutine,
  saveRoutine,
  loadUnit,
  saveUnit,
  clearOnboarded,
} from '@/storage/workout-storage';
import { SPLIT_DAYS, SPLIT_LABELS } from '@/constants/splits';
import { Colors, Spacing, Radius, Fonts } from '@/constants/tokens';
import { ScreenTexture } from '@/components/screen-texture';
import { useExercises } from '@/components/exercises-context';

export default function RoutineScreen() {
  const router = useRouter();
  const { allExercises, exerciseMap, addCustomExercise } = useExercises();
  const [routine, setRoutine] = useState<Routine>(DEFAULT_ROUTINE);
  const [activeSplit, setActiveSplit] = useState<SplitDay>('push');
  const [unit, setUnit] = useState<WeightUnit>('lb');

  // Custom-exercise creation form state.
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMuscle, setNewMuscle] = useState<MuscleGroup | null>(null);

  // Clear the onboarded flag and jump back to the intro so it can be replayed.
  const resetOnboarding = async () => {
    await clearOnboarded();
    router.replace('/onboarding');
  };

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

  // Persist the new order once a drag finishes. DraggableFlatList hands
  // us the fully reordered array.
  const onDragEnd = ({ data }: { data: RoutineExercise[] }) => {
    updateDay(activeSplit, data);
  };

  // One exercise row in the draggable list. `drag` starts the drag (we
  // wire it to the grip handle); `isActive` is true while it's lifted.
  const renderExercise = ({ item: re, drag, isActive }: RenderItemParams<RoutineExercise>) => {
    const ex = exerciseMap[re.exerciseId];
    if (!ex) return null;
    return (
      <ScaleDecorator>
        <View style={[styles.exerciseRow, isActive && styles.exerciseRowActive]}>
          <Pressable
            onLongPress={drag}
            disabled={isActive}
            hitSlop={8}
            style={styles.dragHandle}
          >
            <Text style={styles.dragDots}>⋮⋮</Text>
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={styles.exerciseName}>{ex.name}</Text>
            <Text style={styles.muscleTag}>{ex.muscleGroup}</Text>
          </View>

          <View style={styles.stepper}>
            <Pressable style={styles.stepBtn} onPress={() => changeSets(re.exerciseId, -1)}>
              <Text style={styles.stepBtnText}>−</Text>
            </Pressable>
            <Text style={styles.setCount}>{re.targetSets}</Text>
            <Pressable style={styles.stepBtn} onPress={() => changeSets(re.exerciseId, 1)}>
              <Text style={styles.stepBtnText}>+</Text>
            </Pressable>
          </View>

          <Pressable style={styles.removeBtn} onPress={() => removeExercise(re.exerciseId)}>
            <Text style={styles.removeBtnText}>✕</Text>
          </Pressable>
        </View>
      </ScaleDecorator>
    );
  };

  // Library exercises (built-in + custom) for this split day that aren't
  // already in the routine.
  const available = allExercises.filter(
    (e) =>
      e.splitDay === activeSplit &&
      !current.some((re) => re.exerciseId === e.id),
  );

  // Create a brand-new exercise and drop it straight into the routine.
  const createExercise = () => {
    if (!newName.trim() || !newMuscle) return;
    const exercise = addCustomExercise(newName, newMuscle, activeSplit);
    updateDay(activeSplit, [...current, { exerciseId: exercise.id, targetSets: 3 }]);
    setNewName('');
    setNewMuscle(null);
    setCreating(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScreenTexture />
      <NestableScrollContainer
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
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
          <NestableDraggableFlatList
            data={current}
            keyExtractor={(item) => item.exerciseId}
            renderItem={renderExercise}
            onDragEnd={onDragEnd}
          />
        )}

        {/* ─── Add exercise ─── */}
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

        {/* Create a custom exercise */}
        {creating ? (
          <View style={styles.createCard}>
            <TextInput
              style={styles.createInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Exercise name"
              placeholderTextColor={Colors.textFaint}
            />
            <View style={styles.muscleChips}>
              {SPLIT_MUSCLE_GROUPS[activeSplit].map((m) => (
                <Pressable
                  key={m}
                  style={[styles.muscleChip, newMuscle === m && styles.muscleChipActive]}
                  onPress={() => setNewMuscle(m)}
                >
                  <Text
                    style={[
                      styles.muscleChipText,
                      newMuscle === m && styles.muscleChipTextActive,
                    ]}
                  >
                    {formatMuscle(m)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.createActions}>
              <Pressable
                onPress={() => {
                  setCreating(false);
                  setNewName('');
                  setNewMuscle(null);
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.createBtn,
                  (!newName.trim() || !newMuscle) && styles.createBtnDisabled,
                ]}
                onPress={createExercise}
                disabled={!newName.trim() || !newMuscle}
              >
                <Text style={styles.createBtnText}>Add exercise</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable style={styles.createToggle} onPress={() => setCreating(true)}>
            <Text style={styles.createToggleText}>+ Create custom exercise</Text>
          </Pressable>
        )}

        {/* Settings */}
        <Pressable style={styles.resetButton} onPress={resetOnboarding}>
          <Text style={styles.resetText}>Reset onboarding</Text>
        </Pressable>
      </NestableScrollContainer>
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
    paddingHorizontal: Spacing.xl,
    marginHorizontal: -Spacing.xl, // bleed to screen edges so the lifted row looks full-width
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  exerciseRowActive: { backgroundColor: Colors.surface },

  // Drag handle
  dragHandle: { paddingHorizontal: 2, paddingVertical: 4 },
  dragDots: { fontSize: 16, color: Colors.textFaint, letterSpacing: -2 },
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

  // Create custom exercise
  createToggle: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  createToggleText: { fontSize: 14, fontFamily: Fonts.bodySemibold, color: Colors.textMuted },
  createCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
    gap: Spacing.md,
  },
  createInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    fontSize: 16,
    fontFamily: Fonts.body,
    color: Colors.text,
  },
  muscleChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  muscleChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  muscleChipActive: { backgroundColor: Colors.accentTint, borderColor: Colors.accent },
  muscleChipText: { fontSize: 13, fontFamily: Fonts.bodyMedium, color: Colors.textMuted },
  muscleChipTextActive: { color: Colors.accent },
  createActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.lg,
  },
  cancelText: { fontSize: 14, fontFamily: Fonts.bodySemibold, color: Colors.textMuted },
  createBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  createBtnDisabled: { opacity: 0.4 },
  createBtnText: { fontSize: 14, fontFamily: Fonts.bodyBold, color: Colors.accentText },

  // Settings
  resetButton: {
    marginTop: Spacing.xxl,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  resetText: { fontSize: 13, fontFamily: Fonts.body, color: Colors.textFaint },
});
