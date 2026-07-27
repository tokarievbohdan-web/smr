import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ViewStyle, StyleProp } from 'react-native';
import { colors, radius, fonts } from './theme';
import { Comment } from './data';
import { Ionicons } from '@expo/vector-icons';

// Плейсхолдер під фото (смугаста поверхня в дизайні → нейтральний блок з підписом)
export function Photo({
  label,
  uri,
  height,
  round = radius.card,
  style,
  children,
}: {
  label?: string;
  uri?: string;
  height: number;
  round?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  return (
    <View style={[{ height, borderRadius: round, backgroundColor: colors.stripe, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, style]}>
      {uri ? (
        <Image source={{ uri }} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />
      ) : label ? (
        <Text style={styles.photoLabel}>{label}</Text>
      ) : null}
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

// Один коментар з робочою кнопкою «Корисно»
export function CommentItem({
  c,
  index,
  liked,
  onToggleLike,
}: {
  c: Comment;
  index: number;
  liked: boolean;
  onToggleLike: () => void;
}) {
  return (
    <View style={[cstyles.comment, c.reply && { paddingLeft: 28 }]}>
      <Avatar initials={c.initials} size={36} shade={index} />
      <View style={{ flex: 1, gap: 5 }}>
        <View style={cstyles.head}>
          <Text style={cstyles.name}>{c.author}</Text>
          <Text style={cstyles.role}>{c.role}</Text>
        </View>
        <Text style={cstyles.text}>{c.text}</Text>
        <View style={{ flexDirection: 'row', gap: 14, marginTop: 2 }}>
          <TouchableOpacity onPress={onToggleLike} hitSlop={6}>
            <Text style={[cstyles.action, liked && { color: colors.accent, fontFamily: fonts.bold }]}>
              Корисно · {c.helpful}
            </Text>
          </TouchableOpacity>
          <Text style={cstyles.action}>Відповісти</Text>
        </View>
      </View>
    </View>
  );
}

// Поле вводу коментаря
export function CommentComposer({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [text, setText] = useState('');
  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onSubmit(t);
    setText('');
  };
  return (
    <View style={cstyles.inputRow}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Ваш професійний коментар…"
        placeholderTextColor={colors.muted}
        style={cstyles.input}
        onSubmitEditing={submit}
        returnKeyType="send"
      />
      <TouchableOpacity style={[cstyles.send, !text.trim() && { opacity: 0.5 }]} onPress={submit} activeOpacity={0.85}>
        <Ionicons name="paper-plane" size={15} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const cstyles = StyleSheet.create({
  comment: { flexDirection: 'row', gap: 10 },
  head: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' },
  name: { fontFamily: fonts.bold, color: colors.ink, fontSize: 13 },
  role: { fontFamily: fonts.med, color: colors.muted, fontSize: 11 },
  text: { fontFamily: fonts.med, color: colors.body, fontSize: 13.5, lineHeight: 20 },
  action: { fontFamily: fonts.semi, color: colors.muted, fontSize: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, height: 46, borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingHorizontal: 16, fontFamily: fonts.med, fontSize: 13.5, color: colors.ink, outlineStyle: 'none' } as any,
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
});

const styles = StyleSheet.create({
  photoLabel: { fontFamily: 'ui-monospace' as any, color: colors.muted, fontSize: 10 },
  cat: { fontFamily: fonts.bold, color: colors.accent, fontSize: 10, letterSpacing: 0.8 },
  imgBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  imgBadgeText: { fontFamily: fonts.bold, color: colors.accent, fontSize: 10, letterSpacing: 0.8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1 },
  chipText: { fontFamily: fonts.semi, fontSize: 12.5 },
});
