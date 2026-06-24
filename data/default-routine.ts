import type { Routine } from '@/types/workout';

export const DEFAULT_ROUTINE: Routine = {
  push: [
    { exerciseId: 'bench_press',        targetSets: 4 },
    { exerciseId: 'ohp',                targetSets: 3 },
    { exerciseId: 'incline_db_press',   targetSets: 3 },
    { exerciseId: 'lateral_raise',      targetSets: 3 },
    { exerciseId: 'tricep_pushdown',    targetSets: 3 },
  ],
  pull: [
    { exerciseId: 'barbell_row',        targetSets: 4 },
    { exerciseId: 'lat_pulldown',       targetSets: 3 },
    { exerciseId: 'cable_row',          targetSets: 3 },
    { exerciseId: 'face_pull',          targetSets: 3 },
    { exerciseId: 'barbell_curl',       targetSets: 3 },
  ],
  legs: [
    { exerciseId: 'squat',              targetSets: 4 },
    { exerciseId: 'rdl',                targetSets: 3 },
    { exerciseId: 'leg_press',          targetSets: 3 },
    { exerciseId: 'leg_curl',           targetSets: 3 },
    { exerciseId: 'calf_raise',         targetSets: 4 },
  ],
};
