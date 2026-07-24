import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Pressable } from 'react-native';
import { colors, radius, space, fonts } from '../theme';
import { INTERESTS, ME } from '../data';

function Field({ label, value, dashed }: { label: string; value?: string; dashed?: boolean }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        defaultValue={value}
        placeholder={dashed ? 'linkedin.com/in/…' : undefined}
        placeholderTextColor={colors.muted}
        style={[styles.input, dashed && { borderStyle: 'dashed', borderColor: '#D3D8E2' }]}
      />
    </View>
  );
}

export default function OnboardingScreen({ onDone }: { onDone: (picked: string[]) => void }) {
  const [picked, setPicked] = useState<string[]>(['Спонсорство', 'Комерція']);
  const toggle = (t: string) => setPicked((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: space(8) }}>
      <View style={{ paddingHorizontal: space(6), paddingTop: space(6), gap: 8 }}>
        <View style={styles.logo}><Text style={styles.logoText}>SM</Text></View>
        <Text style={styles.h1}>Створіть профіль</Text>
        <Text style={styles.sub}>Займе не більше двох хвилин. Одразу після цього — персональна стрічка.</Text>
      </View>

      <View style={{ paddingHorizontal: space(6), paddingTop: space(4), gap: 12 }}>
        <Field label="Ім'я" value={ME.name} />
        <Field label="Email" value={ME.email} />
        <Field label="Посада" value={ME.position} />
        <Field label="Компанія" value={ME.company} />

        <View style={{ gap: 8, marginTop: 6 }}>
          <Text style={styles.label}>Які напрями вам цікаві?</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {INTERESTS.map((t) => {
              const on = picked.includes(t);
              return (
                <Pressable key={t} onPress={() => toggle(t)} style={[styles.pill, on ? styles.pillOn : styles.pillOff]}>
                  <Text style={[styles.pillText, { color: on ? '#fff' : colors.ink }]}>{t}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ marginTop: 6 }}>
          <Field label="LinkedIn — необов'язково" dashed />
        </View>
      </View>

      <View style={{ paddingHorizontal: space(6), paddingTop: space(5), gap: 12 }}>
        <TouchableOpacity style={styles.cta} activeOpacity={0.85} onPress={() => onDone(picked)}>
          <Text style={styles.ctaText}>Продовжити</Text>
        </TouchableOpacity>
        <Text style={styles.note}>Заповнений профіль відкриває коментарі —{'\n'}статус Community Member</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  logo: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText: { fontFamily: fonts.extra, color: '#fff', fontSize: 15, letterSpacing: -0.5 },
  h1: { fontFamily: fonts.extra, color: colors.ink, fontSize: 28, lineHeight: 32, letterSpacing: -0.6 },
  sub: { fontFamily: fonts.med, color: colors.dim, fontSize: 14, lineHeight: 21 },
  label: { fontFamily: fonts.semi, color: colors.dim, fontSize: 12 },
  input: { height: 48, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 14, fontFamily: fonts.med, fontSize: 14, color: colors.ink, outlineStyle: 'none' } as any,
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill },
  pillOn: { backgroundColor: colors.accent },
  pillOff: { borderWidth: 1, borderColor: colors.line },
  pillText: { fontFamily: fonts.semi, fontSize: 13 },
  cta: { height: 52, borderRadius: radius.lg, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: fonts.bold, color: '#fff', fontSize: 15 },
  note: { fontFamily: fonts.med, color: colors.muted, fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
