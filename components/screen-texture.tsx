import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { Theme } from '@/constants/tokens';

// A single shared "brush" for the spec's subtle diagonal texture:
//   repeating-linear-gradient(135deg, rgba(255,255,255,0.014) 0 7px, transparent 7px 14px)
//
// Drop <ScreenTexture /> as the first child of a screen's root view. It
// fills the screen behind everything (absolute, taps pass through) and
// renders nothing when the cardTexture toggle is off — so the whole
// effect is controlled from one token in constants/tokens.ts.
export function ScreenTexture() {
  if (!Theme.cardTexture) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          {/* A 14px tile rotated 135°: a 7px faint-white stripe, 7px gap. */}
          <Pattern
            id="diagonal"
            patternUnits="userSpaceOnUse"
            width={14}
            height={14}
            patternTransform="rotate(135)"
          >
            <Rect x={0} y={0} width={7} height={14} fill="#FFFFFF" opacity={0.014} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#diagonal)" />
      </Svg>
    </View>
  );
}
