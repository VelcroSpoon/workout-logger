import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Radius, Fonts } from '@/constants/tokens';
import { ScreenTexture } from '@/components/screen-texture';
import { WeightInput } from '@/components/weight-input';
import type {
  SplitDay,
  LoggedSet,
  WorkoutSession,
  Routine,
  RoutineExercise,
  WeightUnit,
} from '@/types/workout';
import { EXERCISE_MAP } from '@/data/exercises';
import { DEFAULT_ROUTINE } from '@/data/default-routine';
import { loadSessions, saveSessions, loadRoutine, loadUnit } from '@/storage/workout-storage';
import { SPLIT_DAYS, SPLIT_LABELS, SPLIT_MUSCLES, NEXT_IN_ROTATION } from '@/constants/splits';

// How long the rest timer counts down, in seconds.
const REST_DURATION = 90;

// Turn 95 → "1:35"
function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "Tuesday · Jun 24" for today.
function todayHeading(): string {
  const d = new Date();
  return `${WEEKDAYS[d.getDay()]} · ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

// "Today" / "Yesterday" / "3 days ago" from an ISO date string.
function relativeDay(iso: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const then = new Date(iso + 'T00:00:00');
  const diff = Math.round((today.getTime() - then.getTime()) / 86_400_000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${diff} days ago`;
}

export default function LogScreen() {
  // ─── State ─────────────────────────────────────────────
  const [routine, setRoutine] = useState<Routine>(DEFAULT_ROUTINE);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [activeSplit, setActiveSplit] = useState<SplitDay | null>(null);
  const [sets, setSets] = useState<LoggedSet[]>([]);
  const [unit, setUnit] = useState<WeightUnit>('lb');

  // restRemaining: seconds left on the rest timer, or null when no
  // timer is running.
  const [restRemaining, setRestRemaining] = useState<number | null>(null);

  // Reload saved routine + history + unit whenever the Log tab regains
  // focus, but only while we're on the split picker — never mid-workout,
  // so an in-progress session is never disrupted. This is how routine
  // edits (and the unit toggle) made in the Routine tab show up here.
  useFocusEffect(
    useCallback(() => {
      if (activeSplit !== null) return;
      loadRoutine().then((saved) => {
        if (saved) setRoutine(saved);
      });
      loadSessions().then(setSessions);
      loadUnit().then(setUnit);
    }, [activeSplit]),
  );

  // ─── Rest timer tick ───────────────────────────────────
  // Each time restRemaining changes we schedule a single 1-second
  // timeout that decrements it, which re-runs this effect and schedules
  // the next tick — a self-perpetuating clock. The cleanup function
  // clears the pending timeout so we never leak timers or double-count
  // (e.g. if the user skips or the component unmounts mid-countdown).
  useEffect(() => {
    if (restRemaining === null) return;
    if (restRemaining <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRestRemaining(null);
      return;
    }
    const id = setTimeout(() => {
      setRestRemaining((r) => (r === null ? null : r - 1));
    }, 1000);
    return () => clearTimeout(id);
  }, [restRemaining]);

  // ─── Pre-fill from last session ────────────────────────
  // When the user picks a split day, we look at their most recent
  // session for that same day and copy the weights/reps as starting
  // values. This is the "sub-30-second UX" idea: the lifter just
  // tweaks numbers instead of typing from scratch.
  const startWorkout = useCallback(
    (day: SplitDay) => {
      const lastSession = sessions.find((s) => s.splitDay === day);
      const exercises = routine[day];

      const prefilled: LoggedSet[] = exercises.flatMap((re: RoutineExercise) => {
        // Find what the user lifted last time for this exercise
        const previousSets = lastSession
          ? lastSession.sets.filter((s) => s.exerciseId === re.exerciseId)
          : [];

        // Create one row per target set, pre-filled if we have history
        return Array.from({ length: re.targetSets }, (_, i) => ({
          exerciseId: re.exerciseId,
          setNumber: i + 1,
          weight: previousSets[i]?.weight ?? 0,
          reps: previousSets[i]?.reps ?? 0,
          completed: false,
        }));
      });

      setSets(prefilled);
      setActiveSplit(day);
    },
    [routine, sessions],
  );

  // ─── Update a single set's field ───────────────────────
  // Instead of managing separate state for each input, we keep
  // one flat array of sets and update by index. This pattern
  // ("update item at index in array") is very common in React.
  const updateSet = useCallback(
    (index: number, field: 'weight' | 'reps', value: string) => {
      setSets((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: Number(value) || 0 };
        return next;
      });
    },
    [],
  );

  // Weight is committed by WeightInput as a canonical pounds value, so it
  // bypasses the string-parsing path above.
  const updateWeight = useCallback((index: number, lb: number) => {
    setSets((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], weight: lb };
      return next;
    });
  }, []);

  const toggleCompleted = useCallback((index: number) => {
    setSets((prev) => {
      const next = [...prev];
      const nowCompleted = !next[index].completed;
      next[index] = { ...next[index], completed: nowCompleted };
      // Marking a set done kicks off the rest timer; un-checking leaves
      // any running timer alone.
      if (nowCompleted) setRestRemaining(REST_DURATION);
      return next;
    });
  }, []);

  // ─── Add a set mid-workout ─────────────────────────────
  // Append one more set for this exercise, pre-filled with the
  // weight/reps of its current last set (you usually do your next
  // set at a similar load). setNumber is just the new count.
  const addSet = useCallback((exerciseId: string) => {
    setSets((prev) => {
      const exerciseSets = prev.filter((s) => s.exerciseId === exerciseId);
      const last = exerciseSets[exerciseSets.length - 1];
      const newSet: LoggedSet = {
        exerciseId,
        setNumber: exerciseSets.length + 1,
        weight: last?.weight ?? 0,
        reps: last?.reps ?? 0,
        completed: false,
      };
      return [...prev, newSet];
    });
  }, []);

  // ─── Remove a set mid-workout ──────────────────────────
  // Drop the set at globalIndex, then renumber the remaining sets
  // of that same exercise so they stay 1, 2, 3… with no gaps.
  const removeSet = useCallback((globalIndex: number) => {
    setSets((prev) => {
      const target = prev[globalIndex];
      if (!target) return prev;
      const filtered = prev.filter((_, i) => i !== globalIndex);
      let n = 0;
      return filtered.map((s) =>
        s.exerciseId === target.exerciseId ? { ...s, setNumber: ++n } : s,
      );
    });
  }, []);

  // ─── Finish workout ────────────────────────────────────
  const finishWorkout = useCallback(async () => {
    if (!activeSplit) return;

    const session: WorkoutSession = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0], // "2026-06-20"
      splitDay: activeSplit,
      sets: sets.filter((s) => s.completed),
    };

    // Put newest session first so "find last Push day" is fast
    const updated = [session, ...sessions];
    setSessions(updated);
    await saveSessions(updated);

    // Reset to split picker
    setActiveSplit(null);
    setSets([]);
    setRestRemaining(null); // stop any running rest timer
  }, [activeSplit, sets, sessions]);

  // ─── Today (split picker) ──────────────────────────────
  if (!activeSplit) {
    // Next up = the day that follows the most recently logged session in
    // the PPL rotation; default to Push when there's no history yet.
    const nextUp: SplitDay = sessions.length
      ? NEXT_IN_ROTATION[sessions[0].splitDay]
      : 'push';

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <ScreenTexture />
        <ScrollView contentContainerStyle={styles.todayContent}>
          {/* Header: date + avatar */}
          <View style={styles.todayHeader}>
            <Text style={styles.todayDate}>{todayHeading()}</Text>
            <View style={styles.avatar} />
          </View>

          <Text style={styles.todayTitle}>What are you{'\n'}training today?</Text>

          {/* Day cards */}
          <View style={styles.dayCards}>
            {SPLIT_DAYS.map((day) => {
              const lastSession = sessions.find((s) => s.splitDay === day);
              const isNext = day === nextUp;
              return (
                <Pressable
                  key={day}
                  style={[styles.dayCard, isNext && styles.dayCardNext]}
                  onPress={() => startWorkout(day)}
                >
                  {/* Top row: status pill + last-trained */}
                  <View style={styles.dayCardTop}>
                    <View style={[styles.pill, isNext ? styles.pillNext : styles.pillRested]}>
                      <Text style={isNext ? styles.pillNextText : styles.pillRestedText}>
                        {isNext ? 'NEXT UP' : 'RESTED'}
                      </Text>
                    </View>
                    <View style={styles.lastWrap}>
                      <Text style={styles.lastLabel}>Last</Text>
                      <Text style={styles.lastValue}>
                        {lastSession ? relativeDay(lastSession.date) : '—'}
                      </Text>
                    </View>
                  </View>

                  {/* Bottom row: day name + muscles, arrow chip */}
                  <View style={styles.dayCardBottom}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dayLabel}>{SPLIT_LABELS[day].toUpperCase()}</Text>
                      <Text style={styles.dayMuscles}>{SPLIT_MUSCLES[day]}</Text>
                    </View>
                    <View style={[styles.arrowChip, isNext && styles.arrowChipNext]}>
                      <Text style={[styles.arrowText, isNext && styles.arrowTextNext]}>→</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Empty-session option */}
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.orLine} />
          </View>
          <Pressable onPress={() => startWorkout(nextUp)}>
            <Text style={styles.emptySession}>Start an empty session</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Active Workout ────────────────────────────────────
  // Group the flat sets array by exercise so we can render
  // sections. We walk the routine order (not the sets order)
  // to keep exercises in the planned sequence.
  const exercisesForDay = routine[activeSplit];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScreenTexture />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              setActiveSplit(null);
              setRestRemaining(null); // stop timer when leaving the workout
            }}
          >
            <Text style={styles.backButton}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>{SPLIT_LABELS[activeSplit]} Day</Text>
        </View>

        <ScrollView style={styles.scrollArea} keyboardShouldPersistTaps="handled">
          {exercisesForDay.map((re: RoutineExercise) => {
            const exercise = EXERCISE_MAP[re.exerciseId];
            if (!exercise) return null;

            // Find this exercise's sets in our flat array
            const exerciseSets = sets
              .map((s, i) => ({ ...s, globalIndex: i }))
              .filter((s) => s.exerciseId === re.exerciseId);

            return (
              <View key={re.exerciseId} style={styles.exerciseBlock}>
                <View style={styles.exerciseHeader}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.muscleTag}>{exercise.muscleGroup}</Text>
                </View>

                {/* Column labels */}
                <View style={styles.setRow}>
                  <Text style={[styles.setLabel, { flex: 0.5 }]}>Set</Text>
                  <Text style={styles.setLabel}>Weight ({unit})</Text>
                  <Text style={styles.setLabel}>Reps</Text>
                  <Text style={[styles.setLabel, { flex: 0.5 }]}>✓</Text>
                  <Text style={[styles.setLabel, { flex: 0.4 }]} />
                </View>

                {exerciseSets.map((s) => (
                  <View key={s.globalIndex} style={styles.setRow}>
                    <Text style={[styles.setNumber, { flex: 0.5 }]}>
                      {s.setNumber}
                    </Text>
                    <WeightInput
                      valueLb={s.weight}
                      unit={unit}
                      onCommit={(lb) => updateWeight(s.globalIndex, lb)}
                      style={[
                        styles.setInput,
                        s.completed && styles.setInputDone,
                      ]}
                    />
                    <TextInput
                      style={[
                        styles.setInput,
                        s.completed && styles.setInputDone,
                      ]}
                      value={s.reps ? String(s.reps) : ''}
                      onChangeText={(v) => updateSet(s.globalIndex, 'reps', v)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={Colors.textFaint}
                    />
                    <Pressable
                      style={[
                        styles.checkButton,
                        s.completed && styles.checkButtonDone,
                        { flex: 0.5 },
                      ]}
                      onPress={() => toggleCompleted(s.globalIndex)}
                    >
                      <Text
                        style={[
                          styles.checkText,
                          s.completed && styles.checkTextDone,
                        ]}
                      >
                        {s.completed ? '✓' : '○'}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.removeSetButton, { flex: 0.4 }]}
                      onPress={() => removeSet(s.globalIndex)}
                      hitSlop={6}
                    >
                      <Text style={styles.removeSetText}>✕</Text>
                    </Pressable>
                  </View>
                ))}

                <Pressable
                  style={styles.addSetButton}
                  onPress={() => addSet(re.exerciseId)}
                >
                  <Text style={styles.addSetText}>+ Add set</Text>
                </Pressable>
              </View>
            );
          })}

          {/* Spacer so the finish button isn't hidden by keyboard */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Rest timer bar — only visible while a timer is running */}
        {restRemaining !== null && (
          <View style={styles.restBar}>
            <Text style={styles.restLabel}>
              Rest {formatTime(restRemaining)}
            </Text>
            <View style={styles.restControls}>
              <Pressable
                style={styles.restButton}
                onPress={() => setRestRemaining((r) => (r ?? 0) + 15)}
              >
                <Text style={styles.restButtonText}>+15s</Text>
              </Pressable>
              <Pressable
                style={styles.restButton}
                onPress={() => setRestRemaining(null)}
              >
                <Text style={styles.restButtonText}>Skip</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Finish button pinned to bottom */}
        <Pressable style={styles.finishButton} onPress={finishWorkout}>
          <Text style={styles.finishText}>Finish Workout</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  title: {
    fontSize: 28,
    fontFamily: Fonts.headingBold,
    color: Colors.text,
    letterSpacing: -0.5,
  },

  // ─── Today screen ───
  todayContent: { padding: Spacing.xl },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayDate: { fontSize: 13, fontFamily: Fonts.body, color: Colors.textMuted },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  todayTitle: {
    fontSize: 34,
    fontFamily: Fonts.heading,
    color: Colors.text,
    letterSpacing: -0.5,
    lineHeight: 38,
    marginTop: Spacing.lg,
  },

  dayCards: { marginTop: Spacing.xl, gap: Spacing.md },
  dayCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 18,
    paddingHorizontal: Spacing.xl,
  },
  dayCardNext: { borderColor: Colors.accent },
  dayCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  pillNext: { backgroundColor: Colors.accent },
  pillRested: { borderWidth: 1, borderColor: Colors.border },
  pillNextText: {
    fontSize: 10,
    fontFamily: Fonts.bodyBold,
    letterSpacing: 0.8,
    color: Colors.accentText,
  },
  pillRestedText: {
    fontSize: 10,
    fontFamily: Fonts.bodyBold,
    letterSpacing: 0.8,
    color: Colors.textFaint,
  },
  lastWrap: { alignItems: 'flex-end' },
  lastLabel: { fontSize: 11, fontFamily: Fonts.body, color: Colors.textFaint },
  lastValue: { fontSize: 12, fontFamily: Fonts.bodySemibold, color: Colors.textMuted },

  dayCardBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: Spacing.lg,
  },
  dayLabel: {
    fontSize: 30,
    fontFamily: Fonts.headingBold,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  dayMuscles: {
    fontSize: 13,
    fontFamily: Fonts.body,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  arrowChip: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowChipNext: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  arrowText: { fontSize: 18, color: Colors.textMuted },
  arrowTextNext: { color: Colors.accentText },

  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  orLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  orText: { fontSize: 13, fontFamily: Fonts.body, color: Colors.textFaint },
  emptySession: {
    textAlign: 'center',
    marginTop: Spacing.lg,
    fontSize: 15,
    fontFamily: Fonts.bodySemibold,
    color: Colors.text,
  },

  // Active workout header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: { fontSize: 16, fontFamily: Fonts.bodySemibold, color: Colors.accent },

  // Scroll area
  scrollArea: { flex: 1, paddingHorizontal: Spacing.xl },

  // Exercise blocks
  exerciseBlock: {
    marginTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  exerciseName: { fontSize: 18, fontFamily: Fonts.heading, color: Colors.text },
  muscleTag: {
    fontSize: 11,
    fontFamily: Fonts.bodyBold,
    letterSpacing: 0.7,
    color: Colors.accent,
    backgroundColor: Colors.accentTint,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    textTransform: 'uppercase',
  },

  // Set rows
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginVertical: 3,
  },
  setLabel: {
    flex: 1,
    fontSize: 11,
    fontFamily: Fonts.bodyMedium,
    letterSpacing: 0.4,
    color: Colors.textFaint,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  setNumber: {
    fontSize: 15,
    fontFamily: Fonts.number,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  setInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.sm,
    padding: 10,
    fontSize: 16,
    fontFamily: Fonts.bodySemibold,
    textAlign: 'center',
    color: Colors.text,
  },
  setInputDone: {
    borderColor: Colors.accent,
  },

  // Check button — bordered box when empty, filled lime when done
  checkButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
  },
  checkButtonDone: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  checkText: { fontSize: 18, color: Colors.checkEmpty },
  checkTextDone: { color: Colors.accentText },

  // Remove-set button (mid-workout)
  removeSetButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
  },
  removeSetText: { fontSize: 14, color: Colors.danger },

  // Add-set button (mid-workout)
  addSetButton: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addSetText: { color: Colors.accent, fontFamily: Fonts.bodySemibold, fontSize: 14 },

  // Rest timer bar
  restBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
  },
  restLabel: {
    color: Colors.accent,
    fontSize: 20,
    fontFamily: Fonts.number,
    fontVariant: ['tabular-nums'], // digits keep a fixed width as they tick
  },
  restControls: { flexDirection: 'row', gap: Spacing.sm },
  restButton: {
    backgroundColor: Colors.surfaceAlt,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
  },
  restButtonText: { color: Colors.text, fontSize: 14, fontFamily: Fonts.bodySemibold },

  // Finish button
  finishButton: {
    backgroundColor: Colors.accent,
    margin: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  finishText: { color: Colors.accentText, fontSize: 17, fontFamily: Fonts.bodyBold },
});
