import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from 'expo-router';
import type { WorkoutSession, MuscleGroup } from '@/types/workout';
import {
  DEFAULT_MUSCLE_TARGETS,
  MUSCLE_ORDER,
  formatMuscle,
} from '@/data/muscle-targets';
import { loadSessions, loadTargets, saveTargets } from '@/storage/workout-storage';
import { Colors, Spacing, Radius, Fonts } from '@/constants/tokens';
import { ScreenTexture } from '@/components/screen-texture';
import { useExercises } from '@/components/exercises-context';

// ─── Week boundaries ───────────────────────────────────────────
// Monday 00:00 of the current week, as both a Date and a YYYY-MM-DD
// string (string compare is enough to filter sessions by date).
function startOfWeek(): Date {
  const d = new Date();
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ...
  const shiftToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + shiftToMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isoLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "Jun 22–28" or "Jun 29 – Jul 5" across a month boundary.
function formatWeekRange(start: Date, end: Date): string {
  const left = `${MONTHS[start.getMonth()]} ${start.getDate()}`;
  if (start.getMonth() === end.getMonth()) return `${left}–${end.getDate()}`;
  return `${left} – ${MONTHS[end.getMonth()]} ${end.getDate()}`;
}

export default function VolumeScreen() {
  const { exerciseMap } = useExercises();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [targets, setTargets] = useState<Record<MuscleGroup, number>>(DEFAULT_MUSCLE_TARGETS);
  const [editing, setEditing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadSessions().then(setSessions);
      loadTargets().then(setTargets);
    }, []),
  );

  // Adjust a muscle's weekly target (clamped 0–30) and persist it.
  const changeTarget = (muscle: MuscleGroup, delta: number) => {
    setTargets((prev) => {
      const next = { ...prev, [muscle]: Math.min(30, Math.max(0, prev[muscle] + delta)) };
      saveTargets(next);
      return next;
    });
  };

  // ─── Tally completed sets this week, per muscle group ─────────
  const weekStart = startOfWeek();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekStartIso = isoLocal(weekStart);
  const weekEndIso = isoLocal(weekEnd);

  const counts: Record<string, number> = {};
  for (const session of sessions) {
    if (session.date < weekStartIso || session.date > weekEndIso) continue;
    for (const set of session.sets) {
      const exercise = exerciseMap[set.exerciseId];
      if (!exercise) continue;
      counts[exercise.muscleGroup] = (counts[exercise.muscleGroup] ?? 0) + 1;
    }
  }

  // Rows: every muscle, its done count, and its weekly target.
  const rows = MUSCLE_ORDER.map((muscle) => ({
    muscle,
    done: counts[muscle] ?? 0,
    target: targets[muscle],
  }));

  // Summary numbers.
  const totalDone = rows.reduce((sum, r) => sum + r.done, 0);
  const totalTarget = rows.reduce((sum, r) => sum + r.target, 0);
  const pctOfTarget =
    totalTarget === 0 ? 0 : Math.round((totalDone / totalTarget) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScreenTexture />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>
          This week · {formatWeekRange(weekStart, weekEnd)}
        </Text>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Sets per muscle</Text>
          <Pressable onPress={() => setEditing((e) => !e)} hitSlop={8}>
            <Text style={styles.editToggle}>{editing ? 'Done' : 'Edit targets'}</Text>
          </Pressable>
        </View>
        <Text style={styles.subtitle}>
          {editing
            ? 'Set your weekly target sets per muscle.'
            : 'Planned vs. actual — the number that drives growth.'}
        </Text>

        {/* ─── Summary stat cards ─── */}
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: Colors.accent }]}>
              {totalDone}
            </Text>
            <Text style={styles.statLabel}>sets logged</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: Colors.text }]}>
              {pctOfTarget}%
            </Text>
            <Text style={styles.statLabel}>of weekly target</Text>
          </View>
        </View>

        {/* ─── Per-muscle progress (or target steppers in edit mode) ─── */}
        {rows.map(({ muscle, done, target }) => {
          const hit = target === 0 ? true : done >= target;
          const pct = target === 0 ? 100 : Math.min(100, Math.round((done / target) * 100));
          return (
            <View key={muscle} style={styles.muscleRow}>
              <View style={styles.muscleTop}>
                <Text style={styles.muscleName}>{formatMuscle(muscle)}</Text>
                {editing ? (
                  <View style={styles.stepper}>
                    <Pressable style={styles.stepBtn} onPress={() => changeTarget(muscle, -1)}>
                      <Text style={styles.stepBtnText}>−</Text>
                    </Pressable>
                    <Text style={styles.stepValue}>{target}</Text>
                    <Pressable style={styles.stepBtn} onPress={() => changeTarget(muscle, 1)}>
                      <Text style={styles.stepBtnText}>+</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text style={styles.muscleCount}>
                    <Text style={hit ? styles.countHit : styles.countDone}>{done}</Text>
                    <Text style={styles.countTarget}> / {target} sets</Text>
                  </Text>
                )}
              </View>
              {!editing && (
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${pct}%`,
                        backgroundColor: hit ? Colors.accent : Colors.accentDim,
                      },
                    ]}
                  />
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl },

  eyebrow: { fontSize: 13, fontFamily: Fonts.body, color: Colors.textMuted },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  editToggle: { fontSize: 14, fontFamily: Fonts.bodySemibold, color: Colors.accent },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 18, fontFamily: Fonts.bodySemibold, color: Colors.text },
  stepValue: {
    fontSize: 16,
    fontFamily: Fonts.number,
    color: Colors.text,
    minWidth: 22,
    textAlign: 'center',
  },
  title: {
    fontSize: 30,
    fontFamily: Fonts.heading,
    color: Colors.text,
    letterSpacing: -0.5,
    marginTop: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.body,
    color: Colors.textMuted,
    marginTop: 6,
  },

  // Summary cards
  statRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  statNumber: { fontSize: 30, fontFamily: Fonts.headingBold },
  statLabel: { fontSize: 13, fontFamily: Fonts.body, color: Colors.textMuted, marginTop: 2 },

  // Muscle rows
  muscleRow: { marginTop: Spacing.xl },
  muscleTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  muscleName: { fontSize: 15, fontFamily: Fonts.bodySemibold, color: Colors.text },
  muscleCount: { fontSize: 13 },
  countDone: { fontFamily: Fonts.bodySemibold, color: Colors.text },
  countHit: { fontFamily: Fonts.number, color: Colors.accent },
  countTarget: { fontFamily: Fonts.body, color: Colors.textMuted },

  // Progress bar
  track: {
    height: 9,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
});
