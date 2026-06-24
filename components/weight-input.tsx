import { useEffect, useState } from 'react';
import { TextInput, StyleProp, TextStyle } from 'react-native';
import type { WeightUnit } from '@/types/workout';
import { toDisplayWeight, fromDisplayWeight } from '@/constants/units';
import { Colors } from '@/constants/tokens';

type Props = {
  valueLb: number; // canonical stored value, in pounds
  unit: WeightUnit; // unit currently shown to the user
  onCommit: (lb: number) => void; // called with canonical lb when editing ends
  style?: StyleProp<TextStyle>;
};

// A weight field that DISPLAYS in the active unit but STORES in pounds.
// We keep the in-progress text in local state and only convert + commit
// on blur. Converting on every keystroke would fight the user (e.g. kg
// snapping to 2.5 mid-type), so we defer it until they leave the field.
export function WeightInput({ valueLb, unit, onCommit, style }: Props) {
  const [text, setText] = useState('');

  // Re-sync the shown text whenever the stored value or unit changes from
  // the outside — prefill from last session, an add-set copy, or a unit
  // toggle. (It does NOT fire mid-typing, since valueLb only changes on commit.)
  useEffect(() => {
    const shown = toDisplayWeight(valueLb, unit);
    setText(shown ? String(shown) : '');
  }, [valueLb, unit]);

  const commit = () => {
    onCommit(fromDisplayWeight(Number(text) || 0, unit));
  };

  return (
    <TextInput
      style={style}
      value={text}
      onChangeText={setText}
      onBlur={commit}
      keyboardType="numeric"
      placeholder="0"
      placeholderTextColor={Colors.textFaint}
    />
  );
}
