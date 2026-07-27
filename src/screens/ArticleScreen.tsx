import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, radius, space, fonts } from '../theme';
import { Article, Comment, ME } from '../data';
import { Photo, CategoryText, CommentItem, CommentComposer } from '../components';
import { Ionicons } from '@expo/vector-icons';

function HBtn({ name, onPress, active }: { name: any; onPress?: () => void; active?: boolean }) {
  return (
    <TouchableOpacity style={styles.hbtn} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name={name} size={17} color={active ? colors.accent : colors.ink} />
    </TouchableOpacity>
  );
}

export default function ArticleScreen({
  item,
  onBack,
  saved,
  onToggleSave,
}: {
  item: Article;
  onBack: () => void;
  saved: boolean;
  onToggleSave: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>(item.comments);
  const [liked, setLiked] = useState<number[]>([]);

  const toggleLike = (i: number) => {
    setLiked((l) => (l.includes(i) ? l.filter((x) => x !== i) : [...l, i]));
    setComments((cs) => cs.map((c, idx) => (idx === i ? { ...c, helpful: c.helpful + (liked.includes(i) ? -1 : 1) } : c)));
  };
  const addComment = (text: string) =>
    setComments((cs) => [...cs, { author: ME.name, role: ME.role, initials: ME.initials, text, helpful: 0 }]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <HBtn name="arrow-back" onPress={onBack} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <HBtn name={saved ? 'bookmark' : 'bookmark-outline'} onPress={onToggleSave} active={saved} />
          <HBtn name="share-social-outline" />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: space(8) }}>
        <View style={{ paddingHorizontal: space(5), gap: 10, paddingTop: space(2) }}>
          <CategoryText text={`${item.category} · ${item.kind}`} />
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>{item.date} · {item.readMin} хв читання</Text>
        </View>

        <Photo label="ключовий візуал кампанії" uri={item.imageUrl} height={190} style={{ marginHorizontal: space(5), marginTop: space(3) }} />

        <View style={{ paddingHorizontal: space(5), paddingTop: space(4), gap: 14 }}>
          <Text style={styles.body}>{item.excerpt}</Text>

          <View style={styles.factsBox}>
            <Text style={styles.factsLabel}>ОСНОВНІ ФАКТИ</Text>
            {item.facts.map((f, i) => (
              <Text key={i} style={styles.factItem}>· {f}</Text>
            ))}
          </View>

          <View style={styles.whyBox}>
            <Text style={styles.whyLabel}>ЧОМУ ЦЕ ВАЖЛИВО</Text>
            <Text style={styles.whyText}>{item.why}</Text>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={styles.factsLabel}>ВИСНОВОК ДЛЯ ІНДУСТРІЇ</Text>
            <Text style={styles.body}>{item.conclusion}</Text>
          </View>

          <Text style={styles.source}>Першоджерело: {item.source} ↗</Text>
        </View>

        {/* Коментарі */}
        <View style={styles.commentsWrap}>
          <View style={styles.rowHead}>
            <Text style={styles.h3}>Коментарі спільноти</Text>
            <Text style={styles.count}>{comments.length}</Text>
          </View>
          {comments.map((c, i) => (
            <CommentItem key={i} c={c} index={i} liked={liked.includes(i)} onToggleLike={() => toggleLike(i)} />
          ))}
        </View>

        <View style={{ marginHorizontal: space(5), marginTop: space(4) }}>
          <CommentComposer onSubmit={addComment} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space(5), paddingTop: space(2), paddingBottom: space(2) },
  hbtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.extra, color: colors.ink, fontSize: 23, lineHeight: 28, letterSpacing: -0.5 },
  meta: { fontFamily: fonts.semi, color: colors.muted, fontSize: 12 },
  body: { fontFamily: fonts.med, color: colors.body, fontSize: 14.5, lineHeight: 23 },

  factsBox: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.xl, padding: 16, gap: 8 },
  factsLabel: { fontFamily: fonts.bold, color: colors.muted, fontSize: 11, letterSpacing: 0.8 },
  factItem: { fontFamily: fonts.med, color: colors.body, fontSize: 13.5, lineHeight: 21 },
  whyBox: { backgroundColor: colors.accentSoft, borderRadius: radius.xl, padding: 16, gap: 6 },
  whyLabel: { fontFamily: fonts.extra, color: colors.accent, fontSize: 12, letterSpacing: 0.8 },
  whyText: { fontFamily: fonts.med, color: colors.ink, fontSize: 14, lineHeight: 22 },
  source: { fontFamily: fonts.semi, color: colors.accent, fontSize: 13 },

  commentsWrap: { marginHorizontal: space(5), marginTop: space(4), borderTopWidth: 1, borderTopColor: colors.line, paddingTop: space(4), gap: 14 },
  rowHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  h3: { fontFamily: fonts.extra, color: colors.ink, fontSize: 16, letterSpacing: -0.2 },
  count: { fontFamily: fonts.semi, color: colors.muted, fontSize: 12 },
  comment: { flexDirection: 'row', gap: 10 },
  cHead: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' },
  cName: { fontFamily: fonts.bold, color: colors.ink, fontSize: 13 },
  cRole: { fontFamily: fonts.med, color: colors.muted, fontSize: 11 },
  cText: { fontFamily: fonts.med, color: colors.body, fontSize: 13.5, lineHeight: 20 },
  cAction: { fontFamily: fonts.semi, color: colors.muted, fontSize: 12 },

  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: space(5), marginTop: space(4) },
  input: { flex: 1, height: 46, borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, justifyContent: 'center', paddingHorizontal: 16 },
  inputPh: { fontFamily: fonts.med, color: colors.muted, fontSize: 13.5 },
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
});
