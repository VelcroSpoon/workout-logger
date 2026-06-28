import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Colors, Spacing, Radius, Fonts } from '@/constants/tokens';

type RouteName = 'index' | 'volume' | 'history' | 'routine';

const META: Record<RouteName, { label: string; icon: IconSymbolName }> = {
  index: { label: 'Today', icon: 'house.fill' },
  volume: { label: 'Volume', icon: 'chart.bar.fill' },
  history: { label: 'History', icon: 'clock.fill' },
  routine: { label: 'Routine', icon: 'list.bullet' },
};

// Custom five-slot tab bar: Today · Volume · [ + ] · History · Routine.
// The default tab bar can't render the raised center button, so we draw
// the whole bar ourselves from the navigation state React Navigation hands us.
export function BottomNav({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeName = state.routes[state.index]?.name;

  const Tab = ({ name }: { name: RouteName }) => {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return null;
    const focused = activeName === name;
    const color = focused ? Colors.accent : Colors.textFaint;

    const onPress = () => {
      // Emit the standard tabPress event so anything listening still works,
      // then navigate unless we're already on this tab or it was prevented.
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) navigation.navigate(name);
    };

    return (
      <Pressable style={styles.tab} onPress={onPress}>
        <IconSymbol name={META[name].icon} size={24} color={color} />
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={[styles.label, { color }]}
        >
          {META[name].label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom || Spacing.sm }]}>
      <Tab name="index" />
      <Tab name="volume" />

      {/* Center "log" button — jumps to Today to start a session. */}
      <View style={styles.plusSlot}>
        <Pressable style={styles.plus} onPress={() => navigation.navigate('index')}>
          <IconSymbol name="plus" size={28} color={Colors.accentText} />
        </Pressable>
      </View>

      <Tab name="history" />
      <Tab name="routine" />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  label: { fontSize: 10, fontFamily: Fonts.bodySemibold },

  // The center slot keeps the same flex footprint as a tab so spacing stays
  // even; the button inside is lifted to overlap the bar's top edge.
  plusSlot: { flex: 1, alignItems: 'center' },
  plus: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -16 }],
    shadowColor: Colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
