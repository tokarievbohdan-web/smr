import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, TextInput } from 'react-native';
import { colors, radius, space, fonts } from '../theme';
import { SEARCH_TAGS, Article } from '../data';
import { useContent } from '../ContentContext';
import { Photo, Avatar } from '../components';
import { Ionicons } from '@expo/vector-icons';

export default function SearchScreen({
  onCancel,
  onOpen,
}: {
  onCancel: () => void;
  onOpen: (a: Article) => void;
}) {
  const { articles: ARTICLES, people: PEOPLE } = useContent();
  const [query, setQuery] = useState('спонсорство');
  const q = query.trim().toLowerCase();
  const match = (s: string) => !q || s.toLowerCase().includes(q);

  const materials = ARTICLES.filter((a) => match(a.title) || match(a.category));
  const people = PEOPLE.filter((p) => match(p.name) || match(p.role));
  const empty = materials.length === 0 && people.length === 0;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <View style={styles.field}>
          <Ionicons name="search-outline" size={16} color={colors.accent} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Пошук по матеріалах і людях"
            placeholderTextColor={colors.muted}
            style={styles.input}
            autoFocus
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={colors.muted} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity onPress={onCancel}><Text style={styles.cancel}>Скасувати</Text></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: space(5), paddingBottom: space(6), gap: 18 }}>
        {materials.length > 0 && (
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
        )}

        {people.length > 0 && (
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
        )}

        {empty ? (
          <Text style={styles.none}>Нічого не знайдено за запитом «{query}».</Text>
        ) : (
          <View style={{ gap: 10 }}>
            <Text style={styles.group}>ТЕГИ</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {SEARCH_TAGS.map((t) => (
                <TouchableOpacity key={t} style={styles.tag} onPress={() => setQuery(t.replace('#', ''))}>
                  <Text style={styles.tagText}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: space(5), paddingTop: space(2), paddingBottom: space(3) },
  field: { flex: 1, height: 46, borderWidth: 1.5, borderColor: colors.accent, borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  input: { flex: 1, fontFamily: fonts.semi, color: colors.ink, fontSize: 14, outlineStyle: 'none' } as any,
  cancel: { fontFamily: fonts.semi, color: colors.dim, fontSize: 13.5 },
  group: { fontFamily: fonts.bold, color: colors.muted, fontSize: 11, letterSpacing: 0.8 },
  mRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  dRow: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 14, gap: 4 },
  mTitle: { fontFamily: fonts.bold, color: colors.ink, fontSize: 13.5, lineHeight: 18 },
  mMeta: { fontFamily: fonts.semi, color: colors.muted, fontSize: 11.5 },
  pRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  pName: { fontFamily: fonts.bold, color: colors.ink, fontSize: 13.5 },
  pRole: { fontFamily: fonts.semi, color: colors.muted, fontSize: 11.5 },
  tag: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingHorizontal: 13, paddingVertical: 7 },
  tagText: { fontFamily: fonts.semi, color: colors.ink, fontSize: 12.5 },
  none: { fontFamily: fonts.med, color: colors.muted, fontSize: 13.5, paddingVertical: space(6), textAlign: 'center' },
});
