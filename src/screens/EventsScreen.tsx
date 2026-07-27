import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, fonts } from '../theme';
import { EVENTS, EventItem, EVENT_TYPES, EVENT_FORMATS, CITIES, regStatus } from '../shellData';
import { EventStore, Registration } from '../eventStore';
import { AppHeader, SearchInput, FilterChips, EventCard, EmptyState, Button, SectionHeader } from '../ui';
import { useSheet, useAuth } from '../UIProvider';

const ALL = 'Усі';
type Filters = { format?: string; city?: string; thisWeek: boolean; hasSeats: boolean };

export default function EventsScreen({
  onOpen, onCreate, saved, onToggleSave, reloadKey = 0,
}: {
  onOpen: (e: EventItem) => void;
  onCreate: () => void;
  saved: string[];
  onToggleSave: (id: string) => void;
  reloadKey?: number;
}) {
  const sheet = useSheet();
  const { requireAuth } = useAuth();
  const [mode, setMode] = useState<'feed' | 'saved' | 'reg'>('feed');
  const [type, setType] = useState(ALL);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({ thisWeek: false, hasSeats: false });
  const [created, setCreated] = useState<EventItem[]>([]);
  const [regs, setRegs] = useState<Registration[]>([]);

  useEffect(() => {
    EventStore.listCreated().then(setCreated);
    EventStore.listRegistrations().then(setRegs);
  }, [reloadKey]);

  const all = useMemo(() => [...created, ...EVENTS], [created]);
  const q = query.trim().toLowerCase();
  const activeCount = (filters.format ? 1 : 0) + (filters.city ? 1 : 0) + (filters.thisWeek ? 1 : 0) + (filters.hasSeats ? 1 : 0);

  const match = (e: EventItem) => {
    if (type !== ALL && e.type !== type) return false;
    if (q && !(e.title.toLowerCase().includes(q) || (e.organizer || '').toLowerCase().includes(q) || (e.tags || []).some((t) => t.toLowerCase().includes(q)))) return false;
    if (filters.format && e.format !== filters.format) return false;
    if (filters.city && e.city !== filters.city) return false;
    if (filters.thisWeek && !e.thisWeek) return false;
    if (filters.hasSeats && !(typeof e.seatsLeft === 'number' ? e.seatsLeft > 0 : true)) return false;
    return true;
  };

  const filtered = all.filter(match);
  const savedList = all.filter((e) => saved.includes(e.id));
  const regIds = regs.map((r) => r.eventId);
  const regList = all.filter((e) => regIds.includes(e.id));
  const hasQueryOrFilter = !!q || type !== ALL || activeCount > 0;
  const thisWeek = filtered.filter((e) => e.thisWeek);
  const online = filtered.filter((e) => e.format === 'Онлайн');

  const openFilters = () => sheet.open(<FilterSheet value={filters} onApply={(v) => { setFilters(v); sheet.close(); }} onReset={() => { setFilters({ thisWeek: false, hasSeats: false }); sheet.close(); }} />);
  const create = () => requireAuth(onCreate);

  const Card = (e: EventItem) => {
    const reg = regs.find((r) => r.eventId === e.id);
    return (
      <EventCard
        key={e.id} title={e.title} date={e.date} time={e.time} city={e.city} format={e.format}
        type={e.type} organizer={e.organizer} cost={e.cost} seatsLeft={e.seatsLeft} cover={e.cover}
        saved={saved.includes(e.id)} onSave={() => onToggleSave(e.id)}
        statusLabel={reg ? regStatus(reg.status) : e.status} onPress={() => onOpen(e)}
      />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader title="Події" right={<Button label="Створити" size="sm" icon="add" variant="primary" onPress={create} />} />

      <View style={{ paddingHorizontal: space(5), gap: 12 }}>
        <SearchInput value={query} onChange={setQuery} placeholder="Назва, організатор або тег" />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={s.segment}>
            <Text onPress={() => setMode('feed')} style={[s.seg, mode === 'feed' && s.segOn]}>Стрічка</Text>
            <Text onPress={() => setMode('saved')} style={[s.seg, mode === 'saved' && s.segOn]}>Збережені{savedList.length ? ` · ${savedList.length}` : ''}</Text>
            <Text onPress={() => setMode('reg')} style={[s.seg, mode === 'reg' && s.segOn]}>Мої{regList.length ? ` · ${regList.length}` : ''}</Text>
          </View>
          <TouchableOpacity style={s.filterBtn} onPress={openFilters}>
            <Ionicons name="options-outline" size={16} color={activeCount ? colors.accent : colors.ink} />
            {activeCount > 0 && <View style={s.badge}><Text style={s.badgeText}>{activeCount}</Text></View>}
          </TouchableOpacity>
        </View>
      </View>

      {mode === 'feed' && (
        <View style={{ paddingHorizontal: space(5), paddingTop: space(3) }}>
          <FilterChips items={EVENT_TYPES} value={type} onChange={setType} />
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: space(5), paddingTop: space(3), gap: 14 }} showsVerticalScrollIndicator={false}>
        {mode === 'saved' ? (
          savedList.length ? savedList.map(Card) : <EmptyState icon="bookmark-outline" title="Немає збережених" subtitle="Зберігайте події, щоб не загубити." action="До стрічки" onAction={() => setMode('feed')} />
        ) : mode === 'reg' ? (
          regList.length ? regList.map(Card) : <EmptyState icon="calendar-outline" title="Немає реєстрацій" subtitle="Ваші реєстрації зʼявляться тут." action="До стрічки" onAction={() => setMode('feed')} />
        ) : !hasQueryOrFilter ? (
          <>
            {thisWeek.length > 0 && (
              <View style={{ gap: 12 }}>
                <SectionHeader title="Цього тижня" />
                {thisWeek.map(Card)}
              </View>
            )}
            {online.length > 0 && (
              <View style={{ gap: 12 }}>
                <SectionHeader title="Онлайн-події" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                  {online.map((e) => <View key={e.id} style={{ width: 300 }}>{Card(e)}</View>)}
                </ScrollView>
              </View>
            )}
            <View style={{ gap: 12 }}>
              <SectionHeader title={`Найближчі події · ${filtered.length}`} />
              {filtered.map(Card)}
            </View>
          </>
        ) : (
          filtered.length ? (
            <>
              <SectionHeader title={`Знайдено · ${filtered.length}`} />
              {filtered.map(Card)}
            </>
          ) : <EmptyState icon="calendar-outline" title="Нічого не знайдено" subtitle="Змініть запит або скиньте фільтри." action={activeCount || type !== ALL ? 'Скинути' : undefined} onAction={() => { setFilters({ thisWeek: false, hasSeats: false }); setType(ALL); setQuery(''); }} />
        )}
      </ScrollView>
    </View>
  );
}

function Group({ title, items, value, onChange }: { title: string; items: string[]; value?: string; onChange: (v?: string) => void }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.groupLabel}>{title}</Text>
      <FilterChips items={[ALL, ...items]} value={value || ALL} onChange={(v) => onChange(v === ALL ? undefined : v)} />
    </View>
  );
}
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <TouchableOpacity style={s.toggleRow} activeOpacity={0.8} onPress={() => onChange(!value)}>
      <Text style={s.toggleLabel}>{label}</Text>
      <View style={[s.switch, value && { backgroundColor: colors.accent, borderColor: colors.accent }]}><View style={[s.knob, value && { alignSelf: 'flex-end' }]} /></View>
    </TouchableOpacity>
  );
}
function FilterSheet({ value, onApply, onReset }: { value: Filters; onApply: (v: Filters) => void; onReset: () => void }) {
  const [v, setV] = useState<Filters>(value);
  return (
    <View style={{ gap: 16, paddingBottom: 8 }}>
      <Text style={s.sheetTitle}>Фільтри подій</Text>
      <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
        <Group title="Формат" items={EVENT_FORMATS} value={v.format} onChange={(x) => setV({ ...v, format: x })} />
        <Group title="Місто" items={CITIES} value={v.city} onChange={(x) => setV({ ...v, city: x })} />
        <Toggle label="Лише цього тижня" value={v.thisWeek} onChange={(x) => setV({ ...v, thisWeek: x })} />
        <Toggle label="Лише з вільними місцями" value={v.hasSeats} onChange={(x) => setV({ ...v, hasSeats: x })} />
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><Button full label="Скинути" variant="secondary" onPress={onReset} /></View>
        <View style={{ flex: 1 }}><Button full label="Застосувати" variant="primary" onPress={() => onApply(v)} /></View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  segment: { flexDirection: 'row', gap: 10, flex: 1 },
  seg: { fontFamily: fonts.semi, color: colors.muted, fontSize: 13.5, paddingVertical: 6, paddingHorizontal: 2, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  segOn: { color: colors.ink, fontFamily: fonts.bold, borderBottomColor: colors.accent },
  filterBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { fontFamily: fonts.bold, color: '#fff', fontSize: 9.5 },
  groupLabel: { fontFamily: fonts.bold, color: colors.dim, fontSize: 12.5 },
  sheetTitle: { fontFamily: fonts.extra, color: colors.ink, fontSize: 18, letterSpacing: -0.3 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  toggleLabel: { fontFamily: fonts.semi, color: colors.ink, fontSize: 14 },
  switch: { width: 44, height: 26, borderRadius: 13, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.chipBg, padding: 2, justifyContent: 'center' },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
});
