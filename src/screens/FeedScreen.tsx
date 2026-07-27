import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TouchableOpacity } from 'react-native';
import { colors, radius, space, fonts } from '../theme';
import { FEED_FILTERS, Article, Discussion } from '../data';
import { useContent } from '../ContentContext';
import { Photo, CategoryText, ImageBadge, Chip, Logo } from '../components';
import { Ionicons } from '@expo/vector-icons';

function IconBtn({ name, onPress, dot }: { name: any; onPress?: () => void; dot?: boolean }) {
  return (
    <TouchableOpacity style={styles.iconBtn} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name={name} size={18} color={colors.ink} />
      {dot ? <View style={styles.dot} /> : null}
    </TouchableOpacity>
  );
}

export default function FeedScreen({
  onOpen,
  onOpenSearch,
  onGoDiscussions,
  onOpenDiscussion,
  saved,
  onToggleSave,
}: {
  onOpen: (a: Article) => void;
  onOpenSearch: () => void;
  onGoDiscussions: () => void;
  onOpenDiscussion: (d: Discussion) => void;
  saved: string[];
  onToggleSave: (id: string) => void;
}) {
  const [filter, setFilter] = useState('Усе');
  const [subscribed, setSubscribed] = useState(false);
  const { articles, discussions } = useContent();
  const top = articles.filter((a) => a.topToday);
  const feed = articles.filter((a) => filter === 'Усе' || a.category === filter);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Logo />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <IconBtn name="search-outline" onPress={onOpenSearch} />
          <IconBtn name="notifications-outline" dot />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: space(6) }}>
        <View style={styles.sectionHead}>
          <Text style={styles.h1}>Головне сьогодні</Text>
          <Text style={styles.date}>24 липня</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topRow}>
          {top.map((a) => (
            <Pressable key={a.id} style={styles.topCard} onPress={() => onOpen(a)}>
              <Photo label={a.photo} height={110} round={0} />
              <View style={{ padding: 12, gap: 6 }}>
                <CategoryText text={a.category} />
                <Text style={styles.topTitle} numberOfLines={3}>{a.title}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {FEED_FILTERS.map((f) => (
            <Chip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
          ))}
        </ScrollView>

        <View style={{ paddingHorizontal: space(5), gap: 16, paddingTop: space(3) }}>
          {feed.map((a) => (
            <Pressable key={a.id} style={styles.card} onPress={() => onOpen(a)}>
              <Photo label={a.photo} height={180} round={0}>
                <ImageBadge text={`${a.category} · ${a.kind}`} />
              </Photo>
              <View style={{ padding: 16, gap: 8 }}>
                <Text style={styles.cardTitle}>{a.title}</Text>
                <Text style={styles.cardExcerpt}>{a.excerpt}</Text>
                <View style={styles.cardMeta}>
                  <Text style={styles.metaText}>{a.readMin} хв · {a.commentsCount} коментарів</Text>
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={() => onToggleSave(a.id)}
                    hitSlop={8}
                  >
                    <Ionicons name={saved.includes(a.id) ? 'bookmark' : 'bookmark-outline'} size={15} color={saved.includes(a.id) ? colors.accent : colors.ink} />
                  </TouchableOpacity>
                </View>
              </View>
            </Pressable>
          ))}

          <View style={styles.rowHead}>
            <Text style={styles.h2}>Найактивніші обговорення</Text>
            <Text style={styles.link} onPress={onGoDiscussions}>Усі</Text>
          </View>
          {discussions.slice(0, 2).map((d) => (
            <Pressable key={d.id} style={({ pressed }) => [styles.discRow, pressed && { opacity: 0.7 }]} onPress={() => onOpenDiscussion(d)}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.discTitle}>{d.title}</Text>
                <Text style={styles.discMeta}>{d.category} · {d.meta.split(' · ')[0]}</Text>
              </View>
              {d.hot ? (
                <View style={styles.hot}><Text style={styles.hotText}>Гаряче</Text></View>
              ) : null}
            </Pressable>
          ))}

          <View style={styles.digest}>
            <Text style={styles.digestEyebrow}>ЩОТИЖНЕВИЙ ДАЙДЖЕСТ</Text>
            <Text style={styles.digestTitle}>Головне за тиждень — щоп'ятниці на вашій пошті</Text>
            <TouchableOpacity style={styles.digestBtn} activeOpacity={0.85} onPress={() => setSubscribed((s) => !s)}>
              <Text style={styles.digestBtnText}>{subscribed ? 'Готово ✓' : 'Отримувати'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space(5), paddingTop: space(2), paddingBottom: space(3) },
  iconBtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: 8, right: 9, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent, borderWidth: 1.5, borderColor: '#fff' },

  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: space(5), paddingTop: space(2), paddingBottom: space(1) },
  h1: { fontFamily: fonts.extra, color: colors.ink, fontSize: 20, letterSpacing: -0.4 },
  date: { fontFamily: fonts.semi, color: colors.accent, fontSize: 12 },

  topRow: { gap: 12, paddingHorizontal: space(5), paddingTop: space(3), paddingBottom: space(1) },
  topCard: { width: 250, borderWidth: 1, borderColor: colors.line, borderRadius: radius.xxl, overflow: 'hidden' },
  topTitle: { fontFamily: fonts.bold, color: colors.ink, fontSize: 14, lineHeight: 18, letterSpacing: -0.2 },

  chips: { gap: 8, paddingHorizontal: space(5), paddingTop: space(3) },

  card: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.card, overflow: 'hidden' },
  cardTitle: { fontFamily: fonts.extra, color: colors.ink, fontSize: 17, lineHeight: 21, letterSpacing: -0.3 },
  cardExcerpt: { fontFamily: fonts.med, color: colors.dim, fontSize: 13.5, lineHeight: 20 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metaText: { fontFamily: fonts.semi, color: colors.muted, fontSize: 12 },
  saveBtn: { marginLeft: 'auto', width: 34, height: 34, borderRadius: 10, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },

  rowHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: space(1) },
  h2: { fontFamily: fonts.extra, color: colors.ink, fontSize: 17, letterSpacing: -0.3 },
  link: { fontFamily: fonts.semi, color: colors.accent, fontSize: 12 },
  discRow: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.xl, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  discTitle: { fontFamily: fonts.bold, color: colors.ink, fontSize: 13.5, lineHeight: 18 },
  discMeta: { fontFamily: fonts.semi, color: colors.muted, fontSize: 11.5 },
  hot: { backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  hotText: { fontFamily: fonts.bold, color: colors.accent, fontSize: 11 },

  digest: { backgroundColor: colors.dark, borderRadius: radius.card, padding: 18, gap: 8, marginTop: space(1) },
  digestEyebrow: { fontFamily: fonts.bold, color: colors.onDarkDim, fontSize: 10, letterSpacing: 1 },
  digestTitle: { fontFamily: fonts.extra, color: '#fff', fontSize: 16, lineHeight: 21, letterSpacing: -0.2 },
  digestBtn: { marginTop: 6, height: 44, width: 160, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  digestBtnText: { fontFamily: fonts.bold, color: '#fff', fontSize: 14 },
});
