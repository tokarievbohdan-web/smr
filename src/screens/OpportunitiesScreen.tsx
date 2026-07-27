import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, fonts } from '../theme';
import {
  OPPORTUNITIES, OpportunityItem, OPPORTUNITY_TYPES, SPORTS_LIST, WORK_FORMATS, GEO_LIST, BUDGET_VISIBILITY,
} from '../shellData';
import { OpportunityStore } from '../opportunityStore';
import { AppHeader, SearchInput, FilterChips, OpportunityCard, EmptyState, Button, SectionHeader } from '../ui';
import { useSheet, useToast, useAuth } from '../UIProvider';

const ALL = 'Усі';
type Filters = { sport?: string; format?: string; geo?: string; budget?: string; verifiedOnly: boolean };

export default function OpportunitiesScreen({
  onOpen, onCreate, saved, onToggleSave, reloadKey = 0,
}: {
  onOpen: (o: OpportunityItem) => void;
  onCreate: () => void;
  saved: string[];
  onToggleSave: (id: string) => void;
  reloadKey?: number;
}) {
  const sheet = useSheet();
  const toast = useToast();
  const { requireAuth } = useAuth();
  const [mode, setMode] = useState<'feed' | 'saved'>('feed');
  const [type, setType] = useState(ALL);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({ verifiedOnly: false });
  const [created, setCreated] = useState<OpportunityItem[]>([]);

  useEffect(() => { OpportunityStore.listCreated().then(setCreated); }, [reloadKey]);

  const all = useMemo(() => [...created, ...OPPORTUNITIES], [created]);
  const q = query.trim().toLowerCase();
  const activeCount = (filters.sport ? 1 : 0) + (filters.format ? 1 : 0) + (filters.geo ? 1 : 0) + (filters.budget ? 1 : 0) + (filters.verifiedOnly ? 1 : 0);

  const match = (o: OpportunityItem) => {
    if (type !== ALL && o.type !== type) return false;
    if (q && !(o.title.toLowerCase().includes(q) || o.org.toLowerCase().includes(q) || (o.tags || []).some((t) => t.toLowerCase().includes(q)) || (o.professionalCategory || '').toLowerCase().includes(q))) return false;
    if (filters.sport && o.sport !== filters.sport) return false;
    if (filters.format && o.format !== filters.format) return false;
    if (filters.geo && o.geography !== filters.geo) return false;
    if (filters.budget && o.budgetVisibility !== filters.budget) return false;
    if (filters.verifiedOnly && !o.verified) return false;
    return true;
  };

  const filtered = all.filter(match);
  const savedList = all.filter((o) => saved.includes(o.id));
  const hasQueryOrFilter = !!q || type !== ALL || activeCount > 0;
  const featured = filtered.filter((o) => o.featured);
  const recommended = filtered.filter((o) => o.recommended && !o.featured);
  const latest = filtered;

  const openFilters = () => sheet.open(<FilterSheet value={filters} onApply={(v) => { setFilters(v); sheet.close(); }} onReset={() => { setFilters({ verifiedOnly: false }); sheet.close(); }} />);
  const create = () => requireAuth(onCreate);

  const Card = (o: OpportunityItem) => (
    <OpportunityCard
      key={o.id} title={o.title} type={o.type} org={o.org} city={o.city}
      budget={o.budgetVisibility === 'Публічний' ? o.budget : undefined} deadline={o.deadline}
      statusLabel={o.status} sport={o.sport} format={o.format} applications={o.applicationsCount}
      verified={o.verified} saved={saved.includes(o.id)} onSave={() => onToggleSave(o.id)} onPress={() => onOpen(o)}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader title="Можливості" right={<Button label="Створити" size="sm" icon="add" variant="primary" onPress={create} />} />

      <View style={{ paddingHorizontal: space(5), gap: 12 }}>
        <SearchInput value={query} onChange={setQuery} placeholder="Назва, організація або тег" />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={s.segment}>
            <Text onPress={() => setMode('feed')} style={[s.seg, mode === 'feed' && s.segOn]}>Стрічка</Text>
            <Text onPress={() => setMode('saved')} style={[s.seg, mode === 'saved' && s.segOn]}>Збережені{savedList.length ? ` · ${savedList.length}` : ''}</Text>
          </View>
          <TouchableOpacity style={s.filterBtn} onPress={openFilters}>
            <Ionicons name="options-outline" size={16} color={activeCount ? colors.accent : colors.ink} />
            {activeCount > 0 && <View style={s.badge}><Text style={s.badgeText}>{activeCount}</Text></View>}
          </TouchableOpacity>
        </View>
      </View>

      {mode === 'feed' && (
        <View style={{ paddingHorizontal: space(5), paddingTop: space(3) }}>
          <FilterChips items={OPPORTUNITY_TYPES} value={type} onChange={setType} />
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: space(5), paddingTop: space(3), gap: 12 }} showsVerticalScrollIndicator={false}>
        {mode === 'saved' ? (
          savedList.length ? savedList.map(Card) : <EmptyState icon="bookmark-outline" title="Немає збережених" subtitle="Зберігайте можливості, щоб повернутися пізніше." action="До стрічки" onAction={() => setMode('feed')} />
        ) : !hasQueryOrFilter ? (
          <>
            {featured.length > 0 && (
              <View style={{ gap: 12 }}>
                <SectionHeader title="Рекомендовані партнерства" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                  {featured.map((o) => <View key={o.id} style={{ width: 300 }}>{Card(o)}</View>)}
                </ScrollView>
              </View>
            )}
            {recommended.length > 0 && (
              <View style={{ gap: 12 }}>
                <SectionHeader title="Підібрано для вас" />
                {recommended.map(Card)}
              </View>
            )}
            <View style={{ gap: 12 }}>
              <SectionHeader title={`Нові можливості · ${latest.length}`} />
              {latest.map(Card)}
            </View>
          </>
        ) : (
          filtered.length ? (
            <>
              <SectionHeader title={`Знайдено · ${filtered.length}`} />
              {filtered.map(Card)}
            </>
          ) : <EmptyState icon="briefcase-outline" title="Нічого не знайдено" subtitle="Змініть запит або скиньте фільтри." action={activeCount || type !== ALL ? 'Скинути' : undefined} onAction={() => { setFilters({ verifiedOnly: false }); setType(ALL); setQuery(''); }} />
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
function FilterSheet({ value, onApply, onReset }: { value: Filters; onApply: (v: Filters) => void; onReset: () => void }) {
  const [v, setV] = useState<Filters>(value);
  return (
    <View style={{ gap: 16, paddingBottom: 8 }}>
      <Text style={s.sheetTitle}>Фільтри можливостей</Text>
      <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
        <Group title="Вид спорту" items={SPORTS_LIST} value={v.sport} onChange={(x) => setV({ ...v, sport: x })} />
        <Group title="Формат роботи" items={WORK_FORMATS} value={v.format} onChange={(x) => setV({ ...v, format: x })} />
        <Group title="Географія" items={GEO_LIST} value={v.geo} onChange={(x) => setV({ ...v, geo: x })} />
        <Group title="Видимість бюджету" items={BUDGET_VISIBILITY} value={v.budget} onChange={(x) => setV({ ...v, budget: x })} />
        <TouchableOpacity style={s.toggleRow} activeOpacity={0.8} onPress={() => setV({ ...v, verifiedOnly: !v.verifiedOnly })}>
          <Text style={s.toggleLabel}>Лише верифіковані організації</Text>
          <View style={[s.switch, v.verifiedOnly && { backgroundColor: colors.accent, borderColor: colors.accent }]}><View style={[s.knob, v.verifiedOnly && { alignSelf: 'flex-end' }]} /></View>
        </TouchableOpacity>
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><Button full label="Скинути" variant="secondary" onPress={onReset} /></View>
        <View style={{ flex: 1 }}><Button full label="Застосувати" variant="primary" onPress={() => onApply(v)} /></View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  segment: { flexDirection: 'row', gap: 8, flex: 1 },
  seg: { fontFamily: fonts.semi, color: colors.muted, fontSize: 14, paddingVertical: 6, paddingHorizontal: 4, borderBottomWidth: 2, borderBottomColor: 'transparent' },
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
