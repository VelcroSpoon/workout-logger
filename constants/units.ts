import type { WeightUnit } from '@/types/workout';

// We store every weight canonically in POUNDS. These helpers convert at
// the display/input boundary so the stored data never changes when the
// user toggles units — toggling only reformats what's shown.

export const KG_PER_LB = 0.45359;

// Canonical lb → the number to show in the active unit.
// kg snaps to the nearest 2.5 (real plates come in 2.5 increments).
export function toDisplayWeight(lb: number, unit: WeightUnit): number {
  if (unit === 'kg') return Math.round((lb * KG_PER_LB) / 2.5) * 2.5;
  return Math.round(lb * 10) / 10; // lb: trim float noise
}

// A number typed in the active unit → canonical lb to store.
export function fromDisplayWeight(value: number, unit: WeightUnit): number {
  return unit === 'kg' ? value / KG_PER_LB : value;
}

// Canonical lb tonnage → the number to show in the active unit.
export function toDisplayVolume(lb: number, unit: WeightUnit): number {
  return unit === 'kg' ? Math.round(lb * KG_PER_LB) : Math.round(lb);
}

// Tonnage formatted with thousands separators and a unit suffix.
export function formatVolume(lb: number, unit: WeightUnit): string {
  return `${toDisplayVolume(lb, unit).toLocaleString()} ${unit}`;
}
