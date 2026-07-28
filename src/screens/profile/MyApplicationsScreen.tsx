import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, fonts } from '../../theme';
import { OpportunityItem, OPPORTUNITIES, findOpportunity, appStatus } from '../../shellData';
import { OpportunityStore, MyApplication } from '../../opportunityStore';
import { useConfirm, useToast } from '../../UIProvider';
import { AppHeader, StatusBadge, Button, EmptyState } from '../../ui';

export default function MyApplicationsScreen({ onBack, onOpen }: { onBack: () => void; onOpen: (o: OpportunityItem) => void }) {
  const confirm = useConfirm();
  const toast = useToast();
  const [list, setList] = useState<MyApplication[]>([]);
  const [created, setCreated] = useState<OpportunityItem[]>([]);

  const reload = () => { OpportunityStore.myApplications().then(setList); OpportunityStore.listCreated().then(setCreated); };
  useEffect(() => { reload(); }, []);

  const resolve = (id: string) => created.find((o) => o.id === id) || findOpportunity(id) || OPPORTUNITIES.find((o) => o.id === id);

  const withdraw = (a: MyApplication) => confirm({
    title: 'Відкликати відгук?', message: a.oppTitle, confirmLabel: 'Відкликати', danger: true,
    onConfirm: async () => { await OpportunityStore.withdraw(a.oppId); await reload(); toast('Відгук відкликано', 'neutral'); },
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader title="Мої відгуки" onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: space(5), gap: 12 }} showsVerticalScrollIndicator={false}>
        {list.length ? list.map((a) => {
          const st = appStatus(a.status);
          const opp = resolve(a.oppId);
          return (
            <View key={a.id} style={s.card}>
              <Pressable onPress={() => opp && onOpen(opp)} disabled={!opp}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <StatusBadge label={st.label} tone={st.tone} />
                  {opp && <Ionicons name="chevron-forward" size={16} color={colors.muted} style={{ marginLeft: 'auto' }} />}
                </View>
                <Text style={s.title}>{a.oppTitle}</Text>
                <Text style={s.msg}>«{a.message}»</Text>
                {a.portfolio ? <Text style={s.link}>{a.portfolio}</Text> : null}
              </Pressable>
              {a.status !== 'withdrawn' && (
                <View style={{ marginTop: 10 }}><Button label="Відкликати" size="sm" variant="secondary" icon="close" onPress={() => withdraw(a)} /></View>
              )}
            </View>
          );
        }) : <EmptyState icon="paper-plane-outline" title="Немає відгуків" subtitle="Ваші відгуки на можливості зʼявляться тут." />}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.xl, padding: 14 },
  title: { fontFamily: fonts.extra, color: colors.ink, fontSize: 15.5, lineHeight: 20, letterSpacing: -0.2 },
  msg: { fontFamily: fonts.med, color: colors.body, fontSize: 13.5, lineHeight: 20, marginTop: 4 },
  link: { fontFamily: fonts.semi, color: colors.accent, fontSize: 12.5, marginTop: 4 },
});
