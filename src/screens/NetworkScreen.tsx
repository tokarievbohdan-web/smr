import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, space, fonts } from '../theme';
import { useContent } from '../ContentContext';
import { ORGANIZATIONS, NETWORK_TABS, NETWORK_FILTERS } from '../shellData';
import { AppHeader, SearchInput, FilterChips, PersonCard, OrganizationCard, Button, EmptyState, PrimaryCTA, SecondaryCTA } from '../ui';
import { useSheet, useToast, useAuth } from '../UIProvider';

export default function NetworkScreen() {
  const { people } = useContent();
  const [tab, setTab] = useState('Люди');
  const [filter, setFilter] = useState('Усі');
  const [query, setQuery] = useState('');
  const sheet = useSheet();
  const toast = useToast();
  const { requireAuth } = useAuth();

  const q = query.trim().toLowerCase();
  const filteredPeople = people.filter((p) => !q || p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q));
  const filteredOrgs = ORGANIZATIONS.filter((o) => !q || o.name.toLowerCase().includes(q) || o.type.toLowerCase().includes(q));

  const openPerson = (name: string, role: string) => {
    sheet.open(
      <View style={{ gap: 12, paddingBottom: 8 }}>
        <Text style={s.sheetName}>{name}</Text>
        <Text style={s.sheetRole}>{role}</Text>
        <View style={{ gap: 10, marginTop: 8 }}>
          <PrimaryCTA label="Запит на знайомство" onPress={() => { sheet.close(); requireAuth(() => toast('Запит на знайомство надіслано', 'success')); }} />
          <SecondaryCTA label="Зберегти в мережу" onPress={() => { sheet.close(); requireAuth(() => toast('Додано до вашої мережі', 'success')); }} />
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader title="Мережа" right={<Button label="Фільтри" size="sm" icon="options-outline" onPress={() => sheet.open(<FilterSheet value={filter} onChange={(v) => { setFilter(v); sheet.close(); }} />)} />} />
      <View style={{ paddingHorizontal: space(5), gap: 12 }}>
        <SearchInput value={query} onChange={setQuery} placeholder="Ім'я, компанія або спеціалізація" />
        <View style={s.segment}>
          {NETWORK_TABS.map((t) => (
            <Text key={t} onPress={() => setTab(t)} style={[s.seg, tab === t && s.segOn]}>{t}</Text>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: space(5), paddingTop: space(3), gap: 10 }} showsVerticalScrollIndicator={false}>
        {tab === 'Люди' ? (
          filteredPeople.length ? filteredPeople.map((p) => (
            <PersonCard key={p.id} name={p.name} role={p.role} initials={p.initials} tags={p.tags} shade={p.shade} verified={p.id === 'p1'} onPress={() => openPerson(p.name, p.role)} />
          )) : <EmptyState title="Нікого не знайдено" subtitle="Спробуйте інший запит або фільтр." />
        ) : (
          filteredOrgs.length ? filteredOrgs.map((o) => (
            <OrganizationCard key={o.id} name={o.name} type={o.type} city={o.city} sports={o.sports} verified={o.verified} onPress={() => openPerson(o.name, `${o.type} · ${o.city}`)} />
          )) : <EmptyState title="Організацій не знайдено" />
        )}
      </ScrollView>
    </View>
  );
}

function FilterSheet({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ gap: 12, paddingBottom: 12 }}>
      <Text style={s.sheetName}>Фільтри</Text>
      <FilterChips items={NETWORK_FILTERS} value={value} onChange={onChange} />
    </View>
  );
}

const s = StyleSheet.create({
  segment: { flexDirection: 'row', gap: 8 },
  seg: { fontFamily: fonts.semi, color: colors.muted, fontSize: 14, paddingVertical: 6, paddingHorizontal: 4, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  segOn: { color: colors.ink, fontFamily: fonts.bold, borderBottomColor: colors.accent },
  sheetName: { fontFamily: fonts.extra, color: colors.ink, fontSize: 20, letterSpacing: -0.3 },
  sheetRole: { fontFamily: fonts.med, color: colors.dim, fontSize: 14 },
});
