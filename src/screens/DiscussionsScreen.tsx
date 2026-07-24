import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { colors, radius, space, fonts } from '../theme';
import { DISCUSSIONS, Discussion } from '../data';
import { Chip } from '../components';

const FILTERS = ['Популярні', 'Нові', 'Питання', 'Тема тижня'];

function AvatarStack({ items }: { items: string[] }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {items.map((a, i) => (
        <View key={i} style={[styles.stackAv, { backgroundColor: colors.avatar[i % 3], marginLeft: i === 0 ? 0 : -8 }]}>
          <Text style={styles.stackTxt}>{a}</Text>
        </View>
      ))}
    </View>
  );
}

export default function DiscussionsScreen({ onOpen }: { onOpen: (d: Discussion) => void }) {
  const [filter, setFilter] = useState('Популярні');
  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: space(5), paddingTop: space(2), gap: 14 }}>
        <Text style={styles.title}>Обговорення</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {FILTERS.map((f) => (
            <Chip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
          ))}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: space(5), gap: 12, paddingBottom: space(6) }}>
        {DISCUSSIONS.map((d) => (
          <Pressable key={d.id} style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]} onPress={() => onOpen(d)}>
            {d.badge ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.badge, d.badge === 'Тема тижня' ? styles.badgeBlue : styles.badgeGray]}>
                  <Text style={[styles.badgeText, { color: d.badge === 'Тема тижня' ? colors.accent : colors.dim }]}>{d.badge.toUpperCase()}</Text>
                </View>
                <Text style={styles.cat}>{d.category}</Text>
              </View>
            ) : (
              <Text style={styles.cat}>{d.category}</Text>
            )}
            <Text style={styles.dTitle}>{d.title}</Text>
            {d.preview ? <Text style={styles.preview}>{d.preview}</Text> : null}
            {d.avatars ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <AvatarStack items={d.avatars} />
                <Text style={styles.meta}>{d.meta}</Text>
              </View>
            ) : (
              <Text style={styles.meta}>{d.meta}</Text>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.extra, color: colors.ink, fontSize: 24, letterSpacing: -0.5 },
  card: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.xxl, padding: 16, gap: 10 },
  badge: { borderRadius: 7, paddingHorizontal: 9, paddingVertical: 4 },
  badgeBlue: { backgroundColor: colors.accentSoft },
  badgeGray: { backgroundColor: colors.chipBg },
  badgeText: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.6 },
  cat: { fontFamily: fonts.semi, color: colors.muted, fontSize: 11 },
  dTitle: { fontFamily: fonts.extra, color: colors.ink, fontSize: 16, lineHeight: 21, letterSpacing: -0.2 },
  preview: { fontFamily: fonts.med, color: colors.dim, fontSize: 13, lineHeight: 20 },
  meta: { fontFamily: fonts.semi, color: colors.muted, fontSize: 12 },
  stackAv: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  stackTxt: { fontFamily: fonts.bold, color: colors.dim, fontSize: 9 },
});
