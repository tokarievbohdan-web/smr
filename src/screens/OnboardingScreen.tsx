import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { colors, radius, space, fonts } from '../theme';
import { CATEGORIES } from '../data';
import { Dot } from '../components';
import { Ionicons } from '@expo/vector-icons';

const TOPICS = CATEGORIES.filter((c) => c !== 'Всё');

export default function OnboardingScreen({ onDone }: { onDone: (picked: string[]) => void }) {
  const [picked, setPicked] = useState<string[]>(['Спонсорство', 'Права']);

  const toggle = (t: string) =>
    setPicked((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: space(6), paddingTop: space(8), flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.logo}>
          <Dot />
          <Text style={styles.logoText}>PITCH</Text>
        </View>

        <Text style={styles.eyebrow}>НАСТРОЙКА ЛЕНТЫ</Text>
        <Text style={styles.h}>Что тебе интересно в спортивном маркетинге?</Text>
        <Text style={styles.sub}>Выбери темы — соберём ленту под тебя. Позже можно изменить.</Text>

        <View style={styles.grid}>
          {TOPICS.map((t) => {
            const on = picked.includes(t);
            return (
              <Pressable key={t} onPress={() => toggle(t)} style={[styles.topic, on && styles.topicOn]}>
                <Text style={[styles.topicText, on && styles.topicTextOn]}>{t}</Text>
                {on && <Ionicons name="checkmark-circle" size={18} color="#fff" />}
              </Pressable>
            );
          })}
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.cta, picked.length === 0 && styles.ctaOff]}
          disabled={picked.length === 0}
          onPress={() => onDone(picked)}
        >
          <Text style={styles.ctaText}>
            {picked.length ? `Собрать ленту · ${picked.length}` : 'Выбери хотя бы одну тему'}
          </Text>
          {picked.length > 0 && <Ionicons name="arrow-forward" size={18} color="#fff" />}
        </TouchableOpacity>
        <Text style={styles.skip} onPress={() => onDone([])}>
          Пропустить
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  logo: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: space(8) },
  logoText: { fontFamily: fonts.serif, color: colors.text, fontSize: 24, fontWeight: '700', letterSpacing: 0.5 },
  eyebrow: { fontFamily: fonts.mono, color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginBottom: space(3) },
  h: { fontFamily: fonts.serif, color: colors.text, fontSize: 30, fontWeight: '700', lineHeight: 37, letterSpacing: -0.6 },
  sub: { color: colors.textDim, fontSize: 15, lineHeight: 22, marginTop: space(3) },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: space(6) },
  topic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  topicOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  topicText: { fontFamily: fonts.serif, color: colors.text, fontSize: 16, fontWeight: '700' },
  topicTextOn: { color: '#fff' },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 16,
    marginTop: space(6),
  },
  ctaOff: { backgroundColor: colors.textFaint },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skip: { fontFamily: fonts.mono, color: colors.textFaint, fontSize: 13, textAlign: 'center', paddingVertical: space(4) },
});
