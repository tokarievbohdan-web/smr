import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, space, fonts } from '../theme';
import { EVENTS, EVENT_FILTERS } from '../shellData';
import { AppHeader, FilterChips, EventCard, EmptyState, PrimaryCTA, SecondaryCTA } from '../ui';
import { useSheet, useToast, useAuth } from '../UIProvider';

export default function EventsScreen() {
  const [filter, setFilter] = useState('Усі');
  const sheet = useSheet();
  const toast = useToast();
  const { requireAuth } = useAuth();

  const list = EVENTS.filter((e) => filter === 'Усі' || (filter === 'Онлайн' && e.format === 'Онлайн') || (filter === 'Офлайн' && e.format === 'Офлайн') || filter === 'Найближчі');

  const openEvent = (e: (typeof EVENTS)[number]) => {
    sheet.open(
      <View style={{ gap: 12, paddingBottom: 12 }}>
        <Text style={s.date}>{e.date} · {e.format}</Text>
        <Text style={s.title}>{e.title}</Text>
        <Text style={s.role}>{e.city}</Text>
        <Text style={s.body}>Опис події, спікери та програма зʼявляться тут. Demo-shell.</Text>
        <PrimaryCTA label="Зареєструватися" onPress={() => { sheet.close(); requireAuth(() => toast('Реєстрацію підтверджено', 'success')); }} />
        <SecondaryCTA label="Зберегти" onPress={() => { sheet.close(); requireAuth(() => toast('Подію збережено', 'success')); }} />
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader title="Події" />
      <View style={{ paddingHorizontal: space(5), paddingBottom: space(3) }}>
        <FilterChips items={EVENT_FILTERS} value={filter} onChange={setFilter} />
      </View>
      <ScrollView contentContainerStyle={{ padding: space(5), paddingTop: 0, gap: 14 }} showsVerticalScrollIndicator={false}>
        {list.length ? list.map((e) => (
          <EventCard key={e.id} title={e.title} date={e.date} city={e.city} format={e.format} onPress={() => openEvent(e)} />
        )) : <EmptyState icon="calendar-outline" title="Немає подій" subtitle="У цьому фільтрі поки порожньо." />}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  date: { fontFamily: fonts.bold, color: colors.accent, fontSize: 13 },
  title: { fontFamily: fonts.extra, color: colors.ink, fontSize: 19, lineHeight: 24, letterSpacing: -0.4 },
  role: { fontFamily: fonts.med, color: colors.dim, fontSize: 13 },
  body: { fontFamily: fonts.med, color: colors.dim, fontSize: 14, lineHeight: 21 },
});
