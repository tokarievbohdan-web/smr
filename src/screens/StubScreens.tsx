import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { colors, radius, space, fonts } from '../theme';
import { Dot, FormatTag } from '../components';
import { NewsItem } from '../data';
import { Ionicons } from '@expo/vector-icons';

const FORMATS = [
  { icon: 'flash', name: 'Молния', desc: 'Срочные сделки: стороны, сумма, срок' },
  { icon: 'search', name: 'Разбор', desc: 'Что стоит за новостью и кто выиграл' },
  { icon: 'stats-chart', name: 'Цифры недели', desc: 'Рынок в графиках' },
  { icon: 'trophy', name: 'Кейс', desc: 'Кампания от идеи до результата' },
  { icon: 'mic', name: 'Голос', desc: 'Колонка практика индустрии' },
  { icon: 'flame', name: 'Спор дня', desc: 'Острый вопрос и опрос' },
] as const;

export function TrendsScreen() {
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.appbar}>
        <View style={styles.logo}>
          <Dot />
          <Text style={styles.logoText}>ТРЕНДЫ</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: space(4), paddingBottom: space(6) }} showsVerticalScrollIndicator={false}>
        <Text style={styles.h}>Форматы недели</Text>
        <Text style={styles.sub}>Из них собирается твоя лента — включай нужное</Text>
        <View style={{ gap: 10, marginTop: space(4) }}>
          {FORMATS.map((f) => (
            <View key={f.name} style={styles.card}>
              <View style={styles.cardIcon}>
                <Ionicons name={f.icon as any} size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{f.name}</Text>
                <Text style={styles.cardDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export function ProfileScreen({
  savedItems = [],
  interestsCount = 0,
  onOpen,
}: {
  savedItems?: NewsItem[];
  interestsCount?: number;
  onOpen?: (item: NewsItem) => void;
}) {
  const stats = [
    { v: 'Pro', l: 'подписка' },
    { v: String(interestsCount), l: 'темы' },
    { v: String(savedItems.length), l: 'в закладках' },
  ];
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.appbar}>
        <View style={styles.logo}>
          <Dot />
          <Text style={styles.logoText}>ПРОФИЛЬ</Text>
        </View>
        <Ionicons name="settings-outline" size={20} color={colors.textDim} />
      </View>
      <ScrollView contentContainerStyle={{ padding: space(4), paddingBottom: space(6) }} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHead}>
          <View style={styles.bigAvatar} />
          <View>
            <Text style={styles.name}>Богдан Т.</Text>
            <View style={styles.roleBadge}>
              <Ionicons name="shield-checkmark" size={12} color={colors.olive} />
              <Text style={styles.roleText}>Маркетолог · верифицирован</Text>
            </View>
          </View>
        </View>
        <View style={styles.statsRow}>
          {stats.map((s) => (
            <View key={s.l} style={styles.statBox}>
              <Text style={styles.statV}>{s.v}</Text>
              <Text style={styles.statL}>{s.l.toUpperCase()}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>СОХРАНЁННОЕ</Text>
        {savedItems.length === 0 ? (
          <View style={styles.emptySaved}>
            <Ionicons name="bookmark-outline" size={22} color={colors.textFaint} />
            <Text style={styles.emptyText}>Сохраняй материалы закладкой — они появятся здесь.</Text>
          </View>
        ) : (
          savedItems.map((n) => (
            <Pressable key={n.id} onPress={() => onOpen?.(n)} style={({ pressed }) => [styles.savedRow, pressed && { opacity: 0.6 }]}>
              <View style={styles.savedThumb}><Text style={{ fontSize: 20 }}>{n.emoji}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.savedTitle} numberOfLines={2}>{n.title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 }}>
                  <FormatTag format={n.format} />
                  <Text style={styles.savedMeta}>{n.source}</Text>
                </View>
              </View>
              <Ionicons name="bookmark" size={16} color={colors.accent} />
            </Pressable>
          ))
        )}

        <View style={[styles.proCard, { marginTop: space(5) }]}>
          <Text style={styles.proLabel}>SMR PRO</Text>
          <Text style={styles.proTitle}>Все разборы, архив кейсов и «Цифры недели»</Text>
          <Text style={styles.proPrice}>590 ₽<Text style={styles.proPer}> / мес</Text></Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  appbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space(4),
    paddingTop: space(2),
    paddingBottom: space(3),
  },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { fontFamily: fonts.black, color: colors.text, fontSize: 20, letterSpacing: 0.3 },
  h: { fontFamily: fonts.serif, color: colors.text, fontSize: 24, fontWeight: '700', letterSpacing: -0.4 },
  sub: { fontFamily: fonts.body, color: colors.textDim, fontSize: 14, marginTop: 6 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: space(3.5),
  },
  cardIcon: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: fonts.serif, color: colors.text, fontSize: 16, fontWeight: '700' },
  cardDesc: { fontFamily: fonts.body, color: colors.textDim, fontSize: 12.5, marginTop: 2 },

  profileHead: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: space(5) },
  bigAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.text },
  name: { fontFamily: fonts.serif, color: colors.text, fontSize: 22, fontWeight: '700' },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  roleText: { fontFamily: fonts.mono, color: colors.olive, fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: space(5) },
  statBox: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center' },
  statV: { fontFamily: fonts.black, color: colors.text, fontSize: 24 },
  statL: { fontFamily: fonts.mono, color: colors.textFaint, fontSize: 9.5, letterSpacing: 0.8, marginTop: 4 },
  proCard: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent, borderRadius: radius.xl, padding: space(4) },
  proLabel: { fontFamily: fonts.mono, color: colors.text, fontSize: 11, letterSpacing: 1 },
  proTitle: { fontFamily: fonts.serif, color: colors.text, fontSize: 17, fontWeight: '700', marginTop: 8, lineHeight: 23 },
  proPrice: { fontFamily: fonts.serif, color: colors.text, fontSize: 30, fontWeight: '700', marginTop: 12 },
  proPer: { color: colors.textDim, fontSize: 14, fontWeight: '600' },

  sectionLabel: { fontFamily: fonts.mono, color: colors.textFaint, fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginBottom: space(2) },
  emptySaved: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: space(7),
    paddingHorizontal: space(6),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
  },
  emptyText: { fontFamily: fonts.body, color: colors.textDim, fontSize: 13.5, textAlign: 'center', lineHeight: 19 },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: space(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.line2,
  },
  savedThumb: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.chip,
    borderWidth: 1,
    borderColor: colors.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedTitle: { fontFamily: fonts.serif, color: colors.text, fontSize: 14.5, fontWeight: '700', lineHeight: 19 },
  savedMeta: { fontFamily: fonts.mono, color: colors.textFaint, fontSize: 10.5 },
});
