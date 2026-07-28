import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, space, fonts } from '../../theme';
import { EventItem, EVENTS, findEvent, regStatus } from '../../shellData';
import { EventStore, Registration } from '../../eventStore';
import { AppHeader, EventCard, EmptyState } from '../../ui';

type Tab = 'upcoming' | 'waitlist' | 'cancelled';

export default function MyEventsScreen({ onBack, onOpen }: { onBack: () => void; onOpen: (e: EventItem) => void }) {
  const [regs, setRegs] = useState<Registration[]>([]);
  const [created, setCreated] = useState<EventItem[]>([]);
  const [tab, setTab] = useState<Tab>('upcoming');

  useEffect(() => { EventStore.allRegistrations().then(setRegs); EventStore.listCreated().then(setCreated); }, []);
  const resolve = (id: string) => created.find((e) => e.id === id) || findEvent(id) || EVENTS.find((e) => e.id === id);

  const groups = useMemo(() => ({
    upcoming: regs.filter((r) => r.status === 'registered'),
    waitlist: regs.filter((r) => r.status === 'waitlist'),
    cancelled: regs.filter((r) => r.status === 'cancelled'),
  }), [regs]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'upcoming', label: `Найближчі${groups.upcoming.length ? ` · ${groups.upcoming.length}` : ''}` },
    { key: 'waitlist', label: `Очікування${groups.waitlist.length ? ` · ${groups.waitlist.length}` : ''}` },
    { key: 'cancelled', label: `Скасовані${groups.cancelled.length ? ` · ${groups.cancelled.length}` : ''}` },
  ];
  const list = groups[tab];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader title="Мої події" onBack={onBack} />
      <View style={s.segment}>
        {tabs.map((t) => (
          <Text key={t.key} onPress={() => setTab(t.key)} style={[s.seg, tab === t.key && s.segOn]}>{t.label}</Text>
        ))}
      </View>
      <ScrollView contentContainerStyle={{ padding: space(5), paddingTop: space(3), gap: 14 }} showsVerticalScrollIndicator={false}>
        {list.length ? list.map((r) => {
          const e = resolve(r.eventId);
          if (!e) return null;
          return <EventCard key={r.eventId} title={e.title} date={e.date} time={e.time} city={e.city} format={e.format} type={e.type} organizer={e.organizer} cost={e.cost} statusLabel={regStatus(r.status)} onPress={() => onOpen(e)} />;
        }) : <EmptyState icon="calendar-outline" title="Порожньо" subtitle="Тут зʼявляться події за вашими реєстраціями." />}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  segment: { flexDirection: 'row', gap: 16, paddingHorizontal: space(5), paddingBottom: space(1) },
  seg: { fontFamily: fonts.semi, color: colors.muted, fontSize: 13.5, paddingVertical: 6, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  segOn: { color: colors.ink, fontFamily: fonts.bold, borderBottomColor: colors.accent },
});
