import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WorkoutSession, Routine, WeightUnit, Exercise } from '@/types/workout';

const KEYS = {
  SESSIONS: 'workout_sessions',
  ROUTINE: 'workout_routine',
  UNIT: 'workout_unit',
  ONBOARDED: 'workout_onboarded',
  CUSTOM_EXERCISES: 'workout_custom_exercises',
} as const;

// ─── Sessions ──────────────────────────────────────────────────

export async function loadSessions(): Promise<WorkoutSession[]> {
  const json = await AsyncStorage.getItem(KEYS.SESSIONS);
  return json ? JSON.parse(json) : [];
}

export async function saveSessions(sessions: WorkoutSession[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
}

// ─── Routine ───────────────────────────────────────────────────

export async function loadRoutine(): Promise<Routine | null> {
  const json = await AsyncStorage.getItem(KEYS.ROUTINE);
  return json ? JSON.parse(json) : null;
}

export async function saveRoutine(routine: Routine): Promise<void> {
  await AsyncStorage.setItem(KEYS.ROUTINE, JSON.stringify(routine));
}

// ─── Weight unit (global setting) ──────────────────────────────

export async function loadUnit(): Promise<WeightUnit> {
  const value = await AsyncStorage.getItem(KEYS.UNIT);
  return value === 'kg' ? 'kg' : 'lb'; // default to lb
}

export async function saveUnit(unit: WeightUnit): Promise<void> {
  await AsyncStorage.setItem(KEYS.UNIT, unit);
}

// ─── Onboarding flag ───────────────────────────────────────────

export async function loadOnboarded(): Promise<boolean> {
  const value = await AsyncStorage.getItem(KEYS.ONBOARDED);
  return value === 'true';
}

export async function saveOnboarded(): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDED, 'true');
}

export async function clearOnboarded(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.ONBOARDED);
}

// ─── Custom exercises ──────────────────────────────────────────

export async function loadCustomExercises(): Promise<Exercise[]> {
  const json = await AsyncStorage.getItem(KEYS.CUSTOM_EXERCISES);
  return json ? JSON.parse(json) : [];
}

export async function saveCustomExercises(list: Exercise[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.CUSTOM_EXERCISES, JSON.stringify(list));
}

// ─── Helpers ───────────────────────────────────────────────────

export async function getLastSession(
  sessions: WorkoutSession[],
  splitDay: string,
): Promise<WorkoutSession | undefined> {
  return sessions.find((s) => s.splitDay === splitDay);
}
