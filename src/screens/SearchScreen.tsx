import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { colors, radius, space, fonts } from '../theme';
import { ARTICLES, PEOPLE, SEARCH_TAGS, Article } from '../data';
import { Photo, Avatar } from '../components';
import { Ionicons } from '@expo/vector-icons';

export default function SearchScreen({ onCancel, onOpen }: { onCancel: () => void; onOpen: (a: Article) => void }) {
  const materials = ARTICLES.filter((a) => a.id === 'a3' || a.id === 'a1');
  const people = PEOPLE.filter((p) => p.id === 'p1' || p.id === 'p4');

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <View style={styles.field}>
          <Ionicons name="search-outline" size={16} color={colors.accent} />
          <Text style={styles.query}>спонсорство</Text>
          <View style={styles.caret} />
        </View>
        <TouchableOpacity onPress={onCancel}><Text style={styles.cancel}>Скасувати</Text></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space(5), paddingBottom: space(6), gap: 18 }}>
        <View style={{ gap: 10 }}>
          <Text style={styles.group}>МАТЕРІАЛИ</Text>
          {materials.map((a) => (
            <Pressable key={a.id} style={styles.mRow} onPress={() => onOpen(a)}>
              <Photo height={64} round={radius.lg} style={{ width: 64 }} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.mTitle}>{a.title}</Text>
                <Text style={styles.mMeta}>{a.category} · {a.readMin} хв</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={{ gap: 10 }}>
          <Text style={styles.group}>ЛЮДИ</Text>
          {people.map((p) => (
            <View key={p.id} style={styles.pRow}>
              <Avatar initials={p.initials} size={44} shade={p.shade} />
              <View style={{ gap: 2 }}>
                <Text style={styles.pName}>{p.name}</Text>
                <Text style={styles.pRole}>{p.role.split(' · ').slice(0, 2).join(' · ')}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ gap: 10 }}>
          <Text style={styles.group}>ТЕГИ</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {SEARCH_TAGS.map((t) => (
              <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: space(5), paddingTop: space(2), paddingBottom: space(3) },
  field: { flex: 1, height: 46, borderWidth: 1.5, borderColor: colors.accent, borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  query: { fontFamily: fonts.semi, color: colors.ink, fontSize: 14 },
  caret: { width: 2, height: 18, backgroundColor: colors.accent },
  cancel: { fontFamily: fonts.semi, color: colors.dim, fontSize: 13.5 },
  group: { fontFamily: fonts.bold, color: colors.muted, fontSize: 11, letterSpacing: 0.8 },
  mRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  mTitle: { fontFamily: fonts.bold, color: colors.ink, fontSize: 13.5, lineHeight: 18 },
  mMeta: { fontFamily: fonts.semi, color: colors.muted, fontSize: 11.5 },
  pRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  pName: { fontFamily: fonts.bold, color: colors.ink, fontSize: 13.5 },
  pRole: { fontFamily: fonts.semi, color: colors.muted, fontSize: 11.5 },
  tag: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingHorizontal: 13, paddingVertical: 7 },
  tagText: { fontFamily: fonts.semi, color: colors.ink, fontSize: 12.5 },
});
