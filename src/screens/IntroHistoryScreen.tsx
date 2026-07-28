import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, fonts } from '../theme';
import { Person, PEOPLE } from '../data';
import { OrgItem, ORGANIZATIONS, INTRO_STATUSES, introStatus } from '../shellData';
import { useToast } from '../UIProvider';
import { NetworkActions, IntroRequest, ReceivedIntro } from '../networkStore';
import { StatusBadge, Avatar, FormInput, PrimaryCTA, EmptyState } from '../ui';

const relTime = (ts: number) => {
  const d = Math.floor((Date.now() - ts) / 86400000);
  if (d <= 0) return 'сьогодні';
  if (d === 1) return 'вчора';
  return `${d} дн тому`;
};
const RELATED_ICON = { article: 'document-text-outline', opportunity: 'briefcase-outline', event: 'calendar-outline' } as const;

export default function IntroHistoryScreen({ onBack, onOpenPerson, onOpenOrg }: {
  onBack: () => void;
  onOpenPerson?: (p: Person) => void;
  onOpenOrg?: (o: OrgItem) => void;
}) {
  const toast = useToast();
  const [list, setList] = useState<IntroRequest[]>([]);
  const [received, setReceived] = useState<ReceivedIntro[]>([]);
  const [tab, setTab] = useState<'sent' | 'received'>('sent');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [response, setResponse] = useState('');

  const reload = () => { NetworkActions.listIntros().then(setList); NetworkActions.listReceived().then(setReceived); };
  useEffect(() => { reload(); }, []);

  const selected = list.find((i) => i.id === selectedId) || null;

  const sendResponse = async () => {
    if (!selected || response.trim().length < 5) { toast('Додайте відповідь', 'warning'); return; }
    await NetworkActions.respondMoreInfo(selected.id, response.trim());
    setResponse('');
    await reload();
    toast('Відповідь надіслано', 'success');
  };

  const openTarget = (r: IntroRequest) => {
    if (r.targetType === 'person' && onOpenPerson) { const p = PEOPLE.find((x) => x.id === r.targetId); if (p) return onOpenPerson(p); }
    if (r.targetType === 'organization' && onOpenOrg) { const o = ORGANIZATIONS.find((x) => x.id === r.targetId); if (o) return onOpenOrg(o); }
    toast('Профіль недоступний', 'neutral');
  };

  // ── Деталі запиту ──
  if (selected) {
    const st = introStatus(selected.status);
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={s.header}>
          <TouchableOpacity style={s.hbtn} onPress={() => setSelectedId(null)}><Ionicons name="arrow-back" size={17} color={colors.ink} /></TouchableOpacity>
          <Text style={s.hTitle}>Запит на знайомство</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space(5), paddingBottom: space(10), gap: 16 }}>
          <Pressable style={s.targetCard} onPress={() => openTarget(selected)}>
            {selected.targetType === 'organization'
              ? <View style={s.orgLogo}><Ionicons name="business" size={22} color={colors.dim} /></View>
              : <Avatar initials={selected.targetName.split(' ').map((w) => w[0]).join('').slice(0, 2)} size={44} />}
            <View style={{ flex: 1 }}>
              <Text style={s.tName}>{selected.targetName}</Text>
              <Text style={s.tRole}>{selected.targetRole || ''}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </Pressable>

          <View style={{ flexDirection: 'row' }}><StatusBadge label={st.label} tone={st.tone} /></View>

          <Field k="Причина" v={selected.reason} />
          <Field k="Контекст" v={selected.context} />
          {selected.expectedResult ? <Field k="Очікуваний результат" v={selected.expectedResult} /> : null}
          {selected.relatedLabel ? (
            <View style={s.relatedRow}>
              <Ionicons name={RELATED_ICON[selected.relatedType || 'article']} size={15} color={colors.accent} />
              <Text style={s.relatedText} numberOfLines={2}>{selected.relatedLabel}</Text>
            </View>
          ) : null}
          <View style={s.consentRow}>
            <Ionicons name="checkmark-circle" size={15} color={colors.accent} />
            <Text style={s.consentText}>Згода на передачу контактів надана</Text>
          </View>

          {/* Запит додаткової інформації */}
          {selected.status === 'moreinfo' && (
            <View style={s.infoBox}>
              <Text style={s.infoLabel}>ПОТРІБНО БІЛЬШЕ ІНФОРМАЦІЇ</Text>
              <Text style={s.infoText}>{selected.infoRequest}</Text>
              <FormInput value={response} onChange={setResponse} placeholder="Ваша відповідь команді SMR" multiline />
              <PrimaryCTA label="Надіслати відповідь" icon="paper-plane-outline" onPress={sendResponse} />
            </View>
          )}
          {selected.infoResponse && selected.status !== 'moreinfo' ? (
            <View style={s.answerBox}><Text style={s.infoLabel}>ВАША ВІДПОВІДЬ</Text><Text style={s.infoText}>{selected.infoResponse}</Text></View>
          ) : null}
          {selected.status === 'sent' ? (
            <View style={s.sentBox}><Ionicons name="checkmark-done" size={16} color={colors.accent} /><Text style={s.sentText}>Знайомство надіслано — контакти передано обом сторонам.</Text></View>
          ) : null}

          {/* Таймлайн */}
          <View style={{ gap: 10, marginTop: space(1) }}>
            <Text style={s.secLabel}>ІСТОРІЯ СТАТУСІВ</Text>
            {selected.history.slice().reverse().map((h, i) => {
              const hs = introStatus(h.status);
              return (
                <View key={i} style={s.timeRow}>
                  <View style={[s.dot, { backgroundColor: i === 0 ? colors.accent : colors.line }]} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={s.timeStatus}>{hs.label}</Text>
                      <Text style={s.timeAt}>· {relTime(h.at)}</Text>
                    </View>
                    {h.note ? <Text style={s.timeNote}>{h.note}</Text> : null}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Список ──
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.header}>
        <TouchableOpacity style={s.hbtn} onPress={onBack}><Ionicons name="arrow-back" size={17} color={colors.ink} /></TouchableOpacity>
        <Text style={s.hTitle}>Запити на знайомство</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={s.segment}>
        <Text onPress={() => setTab('sent')} style={[s.seg, tab === 'sent' && s.segOn]}>Надіслані{list.length ? ` · ${list.length}` : ''}</Text>
        <Text onPress={() => setTab('received')} style={[s.seg, tab === 'received' && s.segOn]}>Отримані{received.length ? ` · ${received.length}` : ''}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: space(5), gap: 10 }}>
        {tab === 'sent' ? (
          list.length ? list.map((r) => {
            const st = introStatus(r.status);
            return (
              <TouchableOpacity key={r.id} style={s.row} activeOpacity={0.85} onPress={() => setSelectedId(r.id)}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={s.rowName}>{r.targetName}</Text>
                  <Text style={s.rowMeta}>{r.reason} · оновлено {relTime(r.updatedAt)}</Text>
                  <View style={{ flexDirection: 'row', marginTop: 2 }}><StatusBadge label={st.label} tone={st.tone} /></View>
                </View>
                {r.status === 'moreinfo' && <View style={s.attn}><Text style={s.attnText}>Дія</Text></View>}
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </TouchableOpacity>
            );
          }) : <EmptyState icon="people-outline" title="Немає запитів" subtitle="Ваші запити на знайомство зʼявляться тут." />
        ) : (
          received.length ? received.map((r) => {
            const st = introStatus(r.status);
            return (
              <View key={r.id} style={s.row}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={s.rowName}>{r.fromName}</Text>
                  <Text style={s.rowMeta}>{r.fromRole}</Text>
                  <Text style={s.rowMeta}>{r.reason} · {r.context}</Text>
                  <View style={{ flexDirection: 'row', marginTop: 2 }}><StatusBadge label={st.label} tone={st.tone} /></View>
                </View>
              </View>
            );
          }) : <EmptyState icon="mail-open-outline" title="Немає отриманих запитів" subtitle="Запити на знайомство з вами зʼявляться тут." />
        )}
      </ScrollView>
    </View>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return <View style={{ gap: 4 }}><Text style={s.secLabel}>{k.toUpperCase()}</Text><Text style={s.fieldText}>{v}</Text></View>;
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space(5), paddingTop: space(2), paddingBottom: space(3), borderBottomWidth: 1, borderBottomColor: colors.line },
  hbtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  hTitle: { fontFamily: fonts.extra, color: colors.ink, fontSize: 17, letterSpacing: -0.3 },
  segment: { flexDirection: 'row', gap: 16, paddingHorizontal: space(5), paddingTop: space(3) },
  seg: { fontFamily: fonts.semi, color: colors.muted, fontSize: 14, paddingVertical: 6, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  segOn: { color: colors.ink, fontFamily: fonts.bold, borderBottomColor: colors.accent },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.line, borderRadius: radius.xl, padding: 14 },
  rowName: { fontFamily: fonts.bold, color: colors.ink, fontSize: 15 },
  rowMeta: { fontFamily: fonts.med, color: colors.dim, fontSize: 12.5 },
  attn: { backgroundColor: '#FBF0DA', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  attnText: { fontFamily: fonts.bold, color: '#8A5A00', fontSize: 10, letterSpacing: 0.3 },
  targetCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.line, borderRadius: radius.xl, padding: 14, marginTop: space(2) },
  orgLogo: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.chipBg, alignItems: 'center', justifyContent: 'center' },
  tName: { fontFamily: fonts.bold, color: colors.ink, fontSize: 15 },
  tRole: { fontFamily: fonts.med, color: colors.dim, fontSize: 12.5, marginTop: 2 },
  secLabel: { fontFamily: fonts.bold, color: colors.muted, fontSize: 11, letterSpacing: 0.6 },
  fieldText: { fontFamily: fonts.med, color: colors.body, fontSize: 14, lineHeight: 21 },
  relatedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.soft, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10 },
  relatedText: { fontFamily: fonts.semi, color: colors.dim, fontSize: 12.5, flex: 1 },
  consentRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  consentText: { fontFamily: fonts.med, color: colors.dim, fontSize: 12.5 },
  infoBox: { backgroundColor: '#FBF0DA', borderRadius: radius.lg, padding: 14, gap: 10 },
  infoLabel: { fontFamily: fonts.bold, color: '#8A5A00', fontSize: 10.5, letterSpacing: 0.6 },
  infoText: { fontFamily: fonts.med, color: colors.body, fontSize: 13.5, lineHeight: 20 },
  answerBox: { backgroundColor: colors.soft, borderRadius: radius.lg, padding: 14, gap: 6 },
  sentBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.accentSoft, borderRadius: radius.lg, padding: 14 },
  sentText: { fontFamily: fonts.semi, color: colors.accent, fontSize: 13, flex: 1, lineHeight: 18 },
  timeRow: { flexDirection: 'row', gap: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  timeStatus: { fontFamily: fonts.bold, color: colors.ink, fontSize: 13.5 },
  timeAt: { fontFamily: fonts.med, color: colors.muted, fontSize: 12 },
  timeNote: { fontFamily: fonts.med, color: colors.dim, fontSize: 12.5, marginTop: 2, lineHeight: 18 },
});
