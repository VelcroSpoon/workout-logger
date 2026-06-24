import { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from 'expo-router';
import type { WorkoutSession, WeightUnit } from '@/types/workout';
import { EXERCISE_MAP } from '@/data/exercises';
import { loadSessions, loadUnit, saveSessions } from '@/storage/workout-storage';
import { SPLIT_LABELS } from '@/constants/splits';
import { Colors, Spacing, Radius, Fonts } from '@/constants/tokens';
import { ScreenTexture } from '@/components/screen-texture';

// "rear_delts" → "Rear Delts"
function formatMuscle(muscle: string): string {
  return muscle
    .split('_')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

// Returns the Monday of the current week as a "YYYY-MM-DD" string.
// We compare dates as strings because ISO dates sort correctly
// lexicographically ("2026-06-15" < "2026-06-22"), which sidesteps
// any Date/timezone math.
function startOfWeekIso(): string {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, ...
  const shiftToMonday = day === 0 ? -6 : 1 - day;
  now.setDate(now.getDate() + shiftToMonday);

  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [unit, setUnit] = useState<WeightUnit>('lb');
  // id of the session currently open in the editor, or null for the list.
  const [editingId, setEditingId] = useState<string | null>(null);

  // ─── Reload every time the tab comes into focus ────────
  // Tab screens stay mounted in the background, so a plain
  // useEffect(..., []) would only run once and miss workouts
  // you log afterward. useFocusEffect re-runs each time you
  // switch *to* this tab, so the history is always fresh.
  useFocusEffect(
    useCallback(() => {
      loadSessions().then(setSessions);
      loadUnit().then(setUnit);
    }, []),
  );

  // ─── One write path for edits (mirrors the Routine tab) ─
  // Update React state and persist to storage together so the two
  // never drift apart.
  const persist = (updated: WorkoutSession[]) => {
    setSessions(updated);
    saveSessions(updated);
  };

  // Edit a single set's weight or reps inside a given session.
  const editSet = (
    sessionId: string,
    setIndex: number,
    field: 'weight' | 'reps',
    value: string,
  ) => {
    persist(
      sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              sets: s.sets.map((set, i) =>
                i === setIndex ? { ...set, [field]: Number(value) || 0 } : set,
              ),
            }
          : s,
      ),
    );
  };

  // Remove one set from a session.
  const deleteSet = (sessionId: string, setIndex: number) => {
    persist(
      sessions.map((s) =>
        s.id === sessionId
          ? { ...s, sets: s.sets.filter((_, i) => i !== setIndex) }
          : s,
      ),
    );
  };

  // Delete an entire session — guarded by a confirmation dialog
  // because it's destructive and can't be undone.
  const deleteSession = (sessionId: string) => {
    Alert.alert(
      'Delete workout?',
      'This permanently removes this session from your history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            persist(sessions.filter((s) => s.id !== sessionId));
            setEditingId(null); // back to the list
          },
        },
      ],
    );
  };

  // ─── Weekly volume by muscle group ─────────────────────
  // The PPL differentiator: "you've done 12 sets of chest this week."
  // We count every completed set logged since Monday, bucketed by
  // the muscle group its exercise targets.
  const weekStart = startOfWeekIso();
  const volumeCounts: Record<string, number> = {};
  for (const session of sessions) {
    if (session.date < weekStart) continue; // older than this week
    for (const set of session.sets) {
      const exercise = EXERCISE_MAP[set.exerciseId];
      if (!exercise) continue;
      volumeCounts[exercise.muscleGroup] =
        (volumeCounts[exercise.muscleGroup] ?? 0) + 1;
    }
  }
  const weeklyVolume = Object.entries(volumeCounts)
    .map(([muscle, sets]) => ({ muscle, sets }))
    .sort((a, b) => b.sets - a.sets);

  // ─── Session editor ────────────────────────────────────
  // If a session is open for editing, render the editor instead of
  // the list. We look the session up fresh from state each render, so
  // edits show immediately. If it's missing (e.g. just deleted), we
  // fall through to the list rather than crash.
  const editingSession = editingId
    ? sessions.find((s) => s.id === editingId)
    : undefined;

  if (editingSession) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <ScreenTexture />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => setEditingId(null)}>
            <Text style={styles.backButton}>← History</Text>
          </Pressable>
          <Text style={styles.title}>
            {SPLIT_LABELS[editingSession.splitDay]} · {editingSession.date}
          </Text>

          {/* Each set is editable; the index into session.sets is its
              identity, so we keep it via the .map index. */}
          {editingSession.sets.map((set, i) => {
            const exercise = EXERCISE_MAP[set.exerciseId];
            return (
              <View key={i} style={styles.editRow}>
                <Text style={styles.editExercise} numberOfLines={1}>
                  {exercise ? exercise.name : set.exerciseId}
                </Text>
                <TextInput
                  style={styles.editInput}
                  value={set.weight ? String(set.weight) : ''}
                  onChangeText={(v) => editSet(editingSession.id, i, 'weight', v)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.textFaint}
                />
                <Text style={styles.editX}>×</Text>
                <TextInput
                  style={styles.editInput}
                  value={set.reps ? String(set.reps) : ''}
                  onChangeText={(v) => editSet(editingSession.id, i, 'reps', v)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.textFaint}
                />
                <Pressable
                  style={styles.editDelete}
                  onPress={() => deleteSet(editingSession.id, i)}
                  hitSlop={6}
                >
                  <Text style={styles.editDeleteText}>✕</Text>
                </Pressable>
              </View>
            );
          })}

          {editingSession.sets.length === 0 && (
            <Text style={styles.empty}>
              No sets left. Delete this workout, or go back.
            </Text>
          )}

          <Pressable
            style={styles.deleteSessionButton}
            onPress={() => deleteSession(editingSession.id)}
          >
            <Text style={styles.deleteSessionText}>Delete workout</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScreenTexture />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>History</Text>

        {/* ─── This week's volume ─── */}
        <Text style={styles.sectionHeader}>This Week&apos;s Volume</Text>
        {weeklyVolume.length === 0 ? (
          <Text style={styles.empty}>No sets logged this week yet.</Text>
        ) : (
          <View style={styles.volumeCard}>
            {weeklyVolume.map(({ muscle, sets }) => (
              <View key={muscle} style={styles.volumeRow}>
                <Text style={styles.volumeMuscle}>{formatMuscle(muscle)}</Text>
                <Text style={styles.volumeSets}>{sets} sets</Text>
              </View>
            ))}
          </View>
        )}

        {/* ─── Past sessions ─── */}
        <Text style={styles.sectionHeader}>Past Workouts</Text>
        {sessions.length === 0 ? (
          <Text style={styles.empty}>No workouts logged yet.</Text>
        ) : (
          sessions.map((session) => {
            // Total tonnage = sum of weight × reps across all sets.
            const volume = session.sets.reduce(
              (total, s) => total + s.weight * s.reps,
              0,
            );
            return (
              <Pressable
                key={session.id}
                style={styles.sessionCard}
                onPress={() => setEditingId(session.id)}
              >
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionSplit}>
                    {SPLIT_LABELS[session.splitDay]}
                  </Text>
                  <Text style={styles.sessionDate}>{session.date}</Text>
                </View>
                <Text style={styles.sessionSummary}>
                  {session.sets.length} sets · {volume.toLocaleString()} {unit} total volume
                </Text>
                <Text style={styles.editHint}>Tap to edit</Text>
              </Pressable>
            );
          })
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

  // Weekly volume
  volumeCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  volumeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  volumeMuscle: { fontSize: 15, fontFamily: Fonts.bodyMedium, color: Colors.text },
  volumeSets: { fontSize: 15, fontFamily: Fonts.number, color: Colors.accent },

  // Past sessions
  sessionCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: 10,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  sessionSplit: { fontSize: 17, fontFamily: Fonts.heading, color: Colors.text },
  sessionDate: { fontSize: 13, fontFamily: Fonts.body, color: Colors.textMuted },
  sessionSummary: { fontSize: 14, fontFamily: Fonts.body, color: Colors.textMuted },
  editHint: { fontSize: 12, fontFamily: Fonts.bodySemibold, color: Colors.accent, marginTop: 6 },

  // ─── Editor ───
  backButton: {
    fontSize: 16,
    fontFamily: Fonts.bodySemibold,
    color: Colors.accent,
    marginBottom: Spacing.md,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  editExercise: { flex: 1, fontSize: 15, fontFamily: Fonts.bodyMedium, color: Colors.text },
  editInput: {
    width: 64,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    fontSize: 16,
    fontFamily: Fonts.bodySemibold,
    textAlign: 'center',
    color: Colors.text,
  },
  editX: { fontSize: 14, color: Colors.textMuted },
  editDelete: { padding: 6 },
  editDeleteText: { fontSize: 14, color: Colors.danger },
  deleteSessionButton: {
    marginTop: Spacing.xxl,
    padding: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  deleteSessionText: { color: Colors.danger, fontSize: 16, fontFamily: Fonts.bodySemibold },
});
