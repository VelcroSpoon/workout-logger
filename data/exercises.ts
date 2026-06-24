import type { Exercise } from '@/types/workout';

export const DEFAULT_EXERCISES: Exercise[] = [
  // ─── Push ──────────────────────────────────────────────
  { id: 'bench_press',       name: 'Bench Press',         splitDay: 'push', muscleGroup: 'chest' },
  { id: 'incline_db_press',  name: 'Incline DB Press',    splitDay: 'push', muscleGroup: 'chest' },
  { id: 'cable_fly',         name: 'Cable Fly',           splitDay: 'push', muscleGroup: 'chest' },
  { id: 'ohp',               name: 'Overhead Press',      splitDay: 'push', muscleGroup: 'shoulders' },
  { id: 'lateral_raise',     name: 'Lateral Raise',       splitDay: 'push', muscleGroup: 'shoulders' },
  { id: 'tricep_pushdown',   name: 'Tricep Pushdown',     splitDay: 'push', muscleGroup: 'triceps' },
  { id: 'overhead_extension', name: 'Overhead Extension', splitDay: 'push', muscleGroup: 'triceps' },

  // ─── Pull ──────────────────────────────────────────────
  { id: 'barbell_row',       name: 'Barbell Row',         splitDay: 'pull', muscleGroup: 'back' },
  { id: 'lat_pulldown',      name: 'Lat Pulldown',        splitDay: 'pull', muscleGroup: 'back' },
  { id: 'cable_row',         name: 'Cable Row',           splitDay: 'pull', muscleGroup: 'back' },
  { id: 'face_pull',         name: 'Face Pull',           splitDay: 'pull', muscleGroup: 'rear_delts' },
  { id: 'barbell_curl',      name: 'Barbell Curl',        splitDay: 'pull', muscleGroup: 'biceps' },
  { id: 'hammer_curl',       name: 'Hammer Curl',         splitDay: 'pull', muscleGroup: 'biceps' },
  { id: 'deadlift',          name: 'Deadlift',            splitDay: 'pull', muscleGroup: 'back' },

  // ─── Legs ──────────────────────────────────────────────
  { id: 'squat',             name: 'Squat',               splitDay: 'legs', muscleGroup: 'quads' },
  { id: 'leg_press',         name: 'Leg Press',           splitDay: 'legs', muscleGroup: 'quads' },
  { id: 'leg_extension',     name: 'Leg Extension',       splitDay: 'legs', muscleGroup: 'quads' },
  { id: 'rdl',               name: 'Romanian Deadlift',   splitDay: 'legs', muscleGroup: 'hamstrings' },
  { id: 'leg_curl',          name: 'Leg Curl',            splitDay: 'legs', muscleGroup: 'hamstrings' },
  { id: 'hip_thrust',        name: 'Hip Thrust',          splitDay: 'legs', muscleGroup: 'glutes' },
  { id: 'calf_raise',        name: 'Calf Raise',          splitDay: 'legs', muscleGroup: 'calves' },
];

// Lookup table: exerciseId → Exercise. Built once here so every
// screen shares the same map instead of rebuilding its own.
export const EXERCISE_MAP: Record<string, Exercise> = Object.fromEntries(
  DEFAULT_EXERCISES.map((e) => [e.id, e]),
);
