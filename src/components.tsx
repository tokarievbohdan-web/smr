import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
} from 'react-native';
import { colors, radius, fonts } from './theme';
import { Format, FORMAT_COLOR } from './data';

// Пульсирующая точка «в эфире»
export function LivePulse() {
  const a = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 0.25, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(a, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [a]);
  return <Animated.View style={[styles.pulse, { opacity: a }]} />;
}

export function LiveBadge({ label = 'Молния' }: { label?: string }) {
  return (
    <View style={styles.liveBadge}>
      <LivePulse />
      <Text style={styles.liveText}>{label}</Text>
    </View>
  );
}

const TAG_BG: Record<string, string> = {
  orange: colors.accentSoft,
  amber: colors.amberSoft,
  green: colors.oliveSoft,
};
const TAG_FG: Record<string, string> = {
  orange: colors.accent,
  amber: colors.amber,
  green: colors.olive,
};

export function FormatTag({ format }: { format: Format }) {
  const key = FORMAT_COLOR[format];
  return (
    <View style={[styles.tag, { backgroundColor: TAG_BG[key] }]}>
      <Text style={[styles.tagText, { color: TAG_FG[key] }]}>{format.toUpperCase()}</Text>
    </View>
  );
}

export function Avatar({ kind = 'a', size = 30 }: { kind?: 'a' | 'b' | 'c'; size?: number }) {
  const grad: Record<string, string> = {
    a: colors.accent,
    b: colors.olive,
    c: colors.amber,
  };
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: grad[kind],
      }}
    />
  );
}

export function Dot({ style }: { style?: ViewStyle }) {
  return <View style={[styles.brandDot, style]} />;
}

const styles = StyleSheet.create({
  pulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.live,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  liveText: { fontFamily: fonts.mono, color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  tagText: { fontFamily: fonts.mono, fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },
  brandDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: colors.live },
});
