import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { colors, radius, space, fonts } from '../theme';
import { Article, typeLabel } from '../data';
import { useContent } from '../ContentContext';
import { Photo, CategoryText } from '../components';
import { Ionicons } from '@expo/vector-icons';

export default function SavedScreen({
  saved,
  onBack,
  onOpen,
  onToggleSave,
}: {
  saved: string[];
  onBack: () => void;
  onOpen: (a: Article) => void;
  onToggleSave: (id: string) => void;
}) {
  const { articles } = useContent();
  const items = articles.filter((a) => saved.includes(a.id));

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.hbtn} onPress={onBack} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={17} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.title}>Збережене</Text>
        <Text style={styles.count}>{items.length} матеріалів</Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="bookmark-outline" size={26} color={colors.muted} />
          <Text style={styles.emptyText}>Зберігайте матеріали закладкою — вони з'являться тут.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: space(5), gap: 12, paddingBottom: space(6) }}>
          {items.map((a) => (
            <Pressable key={a.id} style={styles.card} onPress={() => onOpen(a)}>
              <Photo height={72} round={radius.md} style={{ width: 72 }} />
              <View style={{ flex: 1, gap: 4 }}>
                <CategoryText text={`${a.category} · ${typeLabel(a.type)}`} />
                <Text style={styles.cTitle}>{a.title}</Text>
                <Text style={styles.cNote}>{a.savedNote || 'збережено'}</Text>
              </View>
              <TouchableOpacity onPress={() => onToggleSave(a.id)} hitSlop={8}>
                <Ionicons name="bookmark" size={16} color={colors.accent} />
              </TouchableOpacity>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: space(5), paddingTop: space(2), paddingBottom: space(2) },
  hbtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.extra, color: colors.ink, fontSize: 22, letterSpacing: -0.5 },
  count: { fontFamily: fonts.semi, color: colors.muted, fontSize: 12, marginLeft: 'auto' },
  empty: { alignItems: 'center', gap: 10, paddingHorizontal: space(10), paddingTop: space(12) },
  emptyText: { fontFamily: fonts.med, color: colors.dim, fontSize: 13.5, textAlign: 'center', lineHeight: 20 },
  card: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.xl, padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center' },
  cTitle: { fontFamily: fonts.bold, color: colors.ink, fontSize: 13.5, lineHeight: 18 },
  cNote: { fontFamily: fonts.semi, color: colors.muted, fontSize: 11.5 },
});
