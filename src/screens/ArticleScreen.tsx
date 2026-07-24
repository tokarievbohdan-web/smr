import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, radius, space, fonts } from '../theme';
import { NewsItem } from '../data';
import { LiveBadge, Avatar } from '../components';
import { Ionicons } from '@expo/vector-icons';

export default function ArticleScreen({
  item,
  onBack,
  saved,
  onToggleSave,
}: {
  item: NewsItem;
  onBack: () => void;
  saved: boolean;
  onToggleSave: () => void;
}) {
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.appbar}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.appbarTitle}>{item.format.toUpperCase()}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.iconBtn} onPress={onToggleSave}>
            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={17} color={saved ? colors.accent : colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="share-outline" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: space(10) }}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>{item.emoji}</Text>
          {item.live && <LiveBadge label={item.format} />}
        </View>

        <View style={{ paddingHorizontal: space(4) }}>
          <Text style={styles.title}>{item.title}</Text>

          <View style={styles.byline}>
            <Avatar kind="a" size={22} />
            <Text style={styles.bylineText}>{item.source} · сегодня, 09:12</Text>
          </View>

          {item.lead && <Text style={styles.lead}>{item.lead}</Text>}

          {item.stats && (
            <View style={styles.stats}>
              {item.stats.map((s, i) => (
                <View key={i} style={styles.stat}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          )}

          {item.body?.[0] && <Text style={styles.body}>{item.body[0]}</Text>}

          {item.pull && (
            <View style={styles.pull}>
              <Text style={styles.pullText}>{item.pull}</Text>
            </View>
          )}

          {item.body?.slice(1).map((p, i) => (
            <Text key={i} style={styles.body}>{p}</Text>
          ))}

          {/* Reactions */}
          {item.reactions && (
            <View style={styles.reactions}>
              <View style={styles.reactBtn}>
                <Text style={styles.reactText}>🔥 {item.reactions.fire}</Text>
              </View>
              <View style={styles.reactBtn}>
                <Text style={styles.reactText}>🧠 {item.reactions.brain}</Text>
              </View>
              <View style={styles.reactBtn}>
                <Text style={styles.reactText}>💬 {item.reactions.comments}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity activeOpacity={0.85} style={styles.discuss}>
            <Ionicons name="chatbubbles-outline" size={18} color="#fff" />
            <Text style={styles.discussText}>Обсудить в Клубе</Text>
          </TouchableOpacity>
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
    paddingBottom: space(2),
  },
  appbarTitle: { fontFamily: fonts.mono, color: colors.textDim, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    marginHorizontal: space(4),
    height: 170,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceGrad1,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space(4),
    justifyContent: 'space-between',
    marginBottom: space(4),
    overflow: 'hidden',
  },
  heroEmoji: { fontSize: 60, alignSelf: 'flex-end', opacity: 0.9 },
  title: { fontFamily: fonts.serif, color: colors.text, fontSize: 27, fontWeight: '700', lineHeight: 33, letterSpacing: -0.5 },
  byline: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: space(3), marginBottom: space(4) },
  bylineText: { fontFamily: fonts.mono, color: colors.textFaint, fontSize: 11 },
  lead: { fontFamily: fonts.med, color: colors.text, fontSize: 17, lineHeight: 26, marginBottom: space(4) },
  body: { fontFamily: fonts.body, color: colors.textDim, fontSize: 15, lineHeight: 24, marginBottom: space(4) },
  stats: { flexDirection: 'row', gap: 8, marginBottom: space(4) },
  stat: { flex: 1, backgroundColor: colors.chip, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 12 },
  statValue: { fontFamily: fonts.serif, color: colors.accent, fontSize: 26, fontWeight: '700', letterSpacing: -0.5 },
  statLabel: { fontFamily: fonts.mono, color: colors.textFaint, fontSize: 9, letterSpacing: 0.5, marginTop: 3 },
  pull: { borderLeftWidth: 2, borderLeftColor: colors.text, paddingLeft: 14, marginBottom: space(4) },
  pullText: { fontFamily: fonts.serif, color: colors.text, fontSize: 18, lineHeight: 25, letterSpacing: -0.3 },
  reactions: { flexDirection: 'row', gap: 8, marginBottom: space(4) },
  reactBtn: { flex: 1, backgroundColor: colors.chip, borderRadius: radius.md, paddingVertical: 10, alignItems: 'center' },
  reactText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  discuss: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discussText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
