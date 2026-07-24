import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { colors, radius, space, fonts } from '../theme';
import { POLL, THREADS, PollOption } from '../data';
import { Avatar, Dot } from '../components';
import { Ionicons } from '@expo/vector-icons';

function PollRow({ opt, voted, onVote }: { opt: PollOption; voted: boolean; onVote: () => void }) {
  return (
    <Pressable onPress={onVote} style={styles.optWrap}>
      <View style={styles.opt}>
        <View
          style={[
            styles.optFill,
            {
              width: `${opt.pct}%`,
              backgroundColor: opt.lead ? 'rgba(10,10,10,0.12)' : 'rgba(10,10,10,0.06)',
              opacity: voted ? 1 : 0,
            },
          ]}
        />
        <Text style={styles.optLabel}>{opt.label}</Text>
        {voted && <Text style={styles.optPct}>{opt.pct}%</Text>}
      </View>
    </Pressable>
  );
}

function ThreadItem({ t }: { t: (typeof THREADS)[number] }) {
  return (
    <View style={styles.thread}>
      <Avatar kind={t.avatar} size={32} />
      <View style={{ flex: 1 }}>
        <View style={styles.threadHead}>
          <Text style={styles.threadName}>{t.name}</Text>
          <Text style={styles.threadRole}>· {t.role}</Text>
        </View>
        <Text style={styles.threadText}>{t.text}</Text>
        <View style={styles.threadFoot}>
          <Text style={styles.threadMeta}>🔥 {t.fire}</Text>
          <Text style={styles.threadMeta}>💬 {t.replies}</Text>
          <Text style={styles.threadMeta}>Ответить</Text>
        </View>
      </View>
    </View>
  );
}

export default function ClubScreen() {
  const [voted, setVoted] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.appbar}>
        <View style={styles.logo}>
          <Dot />
          <Text style={styles.logoText}>КЛУБ</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="create-outline" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: space(4), paddingBottom: space(6) }}>
        <View style={styles.verifyBanner}>
          <Ionicons name="shield-checkmark" size={16} color={colors.olive} />
          <Text style={styles.verifyText}>Закрытый клуб профи · роли верифицированы</Text>
        </View>

        {/* Poll */}
        <View style={styles.poll}>
          <Text style={styles.pollQ}>{POLL.question}</Text>
          {POLL.options.map((o, i) => (
            <PollRow key={i} opt={o} voted={voted} onVote={() => setVoted(true)} />
          ))}
          <Text style={styles.pollVotes}>{voted ? POLL.votes : 'Нажми, чтобы проголосовать'}</Text>
        </View>

        <Text style={styles.sectionLabel}>ОБСУЖДЕНИЕ</Text>
        {THREADS.map((t) => (
          <ThreadItem key={t.id} t={t} />
        ))}
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
    paddingBottom: space(3),
  },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { fontFamily: fonts.serif, color: colors.text, fontSize: 22, fontWeight: '700', letterSpacing: 0.5 },
  iconBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },

  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.oliveSoft,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: space(4),
  },
  verifyText: { fontFamily: fonts.mono, color: colors.olive, fontSize: 11.5, fontWeight: '600' },

  poll: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.xl,
    padding: space(4),
    marginBottom: space(5),
  },
  pollQ: { fontFamily: fonts.serif, color: colors.text, fontSize: 17, fontWeight: '700', lineHeight: 23, marginBottom: space(3), letterSpacing: -0.2 },
  optWrap: { marginBottom: 8 },
  opt: {
    backgroundColor: colors.chip,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
  },
  optFill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  optLabel: { color: colors.text, fontSize: 13.5, fontWeight: '500' },
  optPct: { color: colors.text, fontSize: 13.5, fontWeight: '800' },
  pollVotes: { fontFamily: fonts.mono, color: colors.textFaint, fontSize: 11, marginTop: 8 },

  sectionLabel: { fontFamily: fonts.mono, color: colors.textFaint, fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginBottom: space(1) },
  thread: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: space(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.line2,
  },
  threadHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  threadName: { fontFamily: fonts.serif, color: colors.text, fontSize: 15, fontWeight: '700' },
  threadRole: { fontFamily: fonts.mono, color: colors.accent, fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase' },
  threadText: { fontFamily: fonts.body, color: colors.textDim, fontSize: 13.5, lineHeight: 19, marginBottom: 8 },
  threadFoot: { flexDirection: 'row', gap: 16 },
  threadMeta: { fontFamily: fonts.mono, color: colors.textFaint, fontSize: 11 },
});
