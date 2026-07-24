import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, radius, space, fonts } from '../theme';
import { Discussion, Comment, ME } from '../data';
import { Avatar, CommentItem, CommentComposer } from '../components';
import { Ionicons } from '@expo/vector-icons';

export default function DiscussionDetailScreen({ item, onBack }: { item: Discussion; onBack: () => void }) {
  const [comments, setComments] = useState<Comment[]>(item.thread);
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
        <TouchableOpacity style={styles.hbtn} onPress={onBack} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={17} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.hTitle}>Обговорення</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: space(8) }}>
        <View style={{ paddingHorizontal: space(5), paddingTop: space(1), gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {item.badge ? (
              <View style={[styles.badge, item.badge === 'Тема тижня' ? styles.badgeBlue : styles.badgeGray]}>
                <Text style={[styles.badgeText, { color: item.badge === 'Тема тижня' ? colors.accent : colors.dim }]}>{item.badge.toUpperCase()}</Text>
              </View>
            ) : null}
            <Text style={styles.cat}>{item.category}</Text>
          </View>

          <Text style={styles.title}>{item.title}</Text>

          <View style={styles.authorRow}>
            <Avatar initials={item.authorInitials} size={40} shade={2} />
            <View>
              <Text style={styles.author}>{item.author}</Text>
              <Text style={styles.authorRole}>{item.authorRole}</Text>
            </View>
          </View>

          <Text style={styles.body}>{item.body}</Text>
          <Text style={styles.meta}>{item.meta}</Text>
        </View>

        <View style={styles.commentsWrap}>
          <View style={styles.rowHead}>
            <Text style={styles.h3}>Коментарі</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space(5), paddingTop: space(2), paddingBottom: space(3) },
  hbtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  hTitle: { fontFamily: fonts.bold, color: colors.ink, fontSize: 15 },
  badge: { borderRadius: 7, paddingHorizontal: 9, paddingVertical: 4 },
  badgeBlue: { backgroundColor: colors.accentSoft },
  badgeGray: { backgroundColor: colors.chipBg },
  badgeText: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.6 },
  cat: { fontFamily: fonts.semi, color: colors.muted, fontSize: 11 },
  title: { fontFamily: fonts.extra, color: colors.ink, fontSize: 22, lineHeight: 27, letterSpacing: -0.4 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  author: { fontFamily: fonts.bold, color: colors.ink, fontSize: 13.5 },
  authorRole: { fontFamily: fonts.med, color: colors.muted, fontSize: 11.5 },
  body: { fontFamily: fonts.med, color: colors.body, fontSize: 14.5, lineHeight: 23 },
  meta: { fontFamily: fonts.semi, color: colors.muted, fontSize: 12 },
  commentsWrap: { marginHorizontal: space(5), marginTop: space(4), borderTopWidth: 1, borderTopColor: colors.line, paddingTop: space(4), gap: 14 },
  rowHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  h3: { fontFamily: fonts.extra, color: colors.ink, fontSize: 16, letterSpacing: -0.2 },
  count: { fontFamily: fonts.semi, color: colors.muted, fontSize: 12 },
});
