import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { colors, radius, fonts } from './theme';

// Плейсхолдер під фото (смугаста поверхня в дизайні → нейтральний блок з підписом)
export function Photo({
  label,
  height,
  round = radius.card,
  style,
  children,
}: {
  label?: string;
  height: number;
  round?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  return (
    <View style={[{ height, borderRadius: round, backgroundColor: colors.stripe, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, style]}>
      {label ? <Text style={styles.photoLabel}>{label}</Text> : null}
      {children}
    </View>
  );
}

// Категорія великими літерами (синій)
export function CategoryText({ text, style }: { text: string; style?: StyleProp<ViewStyle> }) {
  return <Text style={[styles.cat, style as any]}>{text.toUpperCase()}</Text>;
}

// Бейдж на зображенні (біла плашка, синій текст)
export function ImageBadge({ text }: { text: string }) {
  return (
    <View style={styles.imgBadge}>
      <Text style={styles.imgBadgeText}>{text.toUpperCase()}</Text>
    </View>
  );
}

export function Avatar({ initials, size = 36, shade = 0 }: { initials: string; size?: number; shade?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.avatar[shade % colors.avatar.length],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: fonts.bold, color: colors.dim, fontSize: size * 0.34 }}>{initials}</Text>
    </View>
  );
}

// Чіп-фільтр: dark (обраний чорний) або accent (обраний синій)
export function Chip({
  label,
  active,
  variant = 'dark',
  onPress,
}: {
  label: string;
  active?: boolean;
  variant?: 'dark' | 'accent';
  onPress?: () => void;
}) {
  const onBg = variant === 'accent' ? colors.accent : colors.dark;
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <View
        style={[
          styles.chip,
          active ? { backgroundColor: onBg, borderColor: onBg } : { backgroundColor: colors.surface, borderColor: colors.line },
        ]}
      >
        <Text style={[styles.chipText, { color: active ? '#fff' : colors.ink }]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

// Логотип SM
export function Logo({ size = 32, text = 'Sport Market' }: { size?: number; text?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ width: size, height: size, borderRadius: size * 0.28, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: fonts.extra, color: '#fff', fontSize: size * 0.34, letterSpacing: -0.3 }}>SM</Text>
      </View>
      {text ? <Text style={{ fontFamily: fonts.extra, color: colors.ink, fontSize: 16, letterSpacing: -0.3 }}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  photoLabel: { fontFamily: 'ui-monospace' as any, color: colors.muted, fontSize: 10 },
  cat: { fontFamily: fonts.bold, color: colors.accent, fontSize: 10, letterSpacing: 0.8 },
  imgBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  imgBadgeText: { fontFamily: fonts.bold, color: colors.accent, fontSize: 10, letterSpacing: 0.8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1 },
  chipText: { fontFamily: fonts.semi, fontSize: 12.5 },
});
