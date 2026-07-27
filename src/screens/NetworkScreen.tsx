import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, radius, space, fonts } from '../theme';
import { useContent } from '../ContentContext';
import { Person } from '../data';
import {
  ORGANIZATIONS, OrgItem, NETWORK_TABS, SPORTS_LIST, DIRECTIONS, CITIES, REGIONS, ORG_TYPES,
  AVAILABILITY_STATUSES, PEOPLE_SORT, ORG_SORT, RECOMMENDED_PEOPLE, RECOMMENDED_ORGS,
} from '../shellData';
import { AppHeader, SearchInput, FilterChips, PersonCard, OrganizationCard, EmptyState, Button, SectionHeader } from '../ui';
import { useSheet } from '../UIProvider';

const RECENT_KEY = 'smr_recent_search_v1';
const ALL = 'Усі';

type PFilters = { sport?: string; direction?: string; city?: string; availability?: string; verifiedOnly: boolean };
type OFilters = { sport?: string; direction?: string; type?: string; region?: string; city?: string; verifiedOnly: boolean; withOpportunities: boolean };

export default function NetworkScreen({
  onOpenPerson, onOpenOrg, saved, onToggleSave,
}: {
  onOpenPerson: (p: Person) => void;
  onOpenOrg: (o: OrgItem) => void;
  saved: string[];
  onToggleSave: (id: string) => void;
}) {
  const { people } = useContent();
  const sheet = useSheet();
  const [tab, setTab] = useState('Люди');
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [pf, setPf] = useState<PFilters>({ verifiedOnly: false });
  const [of, setOf] = useState<OFilters>({ verifiedOnly: false, withOpportunities: false });
  const [pSort, setPSort] = useState(PEOPLE_SORT[0]);
  const [oSort, setOSort] = useState(ORG_SORT[0]);

  const isPeople = tab === 'Люди';

  useEffect(() => { AsyncStorage.getItem(RECENT_KEY).then((r) => { if (r) try { setRecent(JSON.parse(r)); } catch {} }); }, []);
  const pushRecent = (term: string) => {
    const t = term.trim();
    if (t.length < 2) return;
    setRecent((prev) => {
      const next = [t, ...prev.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 6);
      AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };
  const clearRecent = () => { setRecent([]); AsyncStorage.removeItem(RECENT_KEY).catch(() => {}); };

  const q = query.trim().toLowerCase();
  const pActive = (pf.sport ? 1 : 0) + (pf.direction ? 1 : 0) + (pf.city ? 1 : 0) + (pf.availability ? 1 : 0) + (pf.verifiedOnly ? 1 : 0);
  const oActive = (of.sport ? 1 : 0) + (of.direction ? 1 : 0) + (of.type ? 1 : 0) + (of.region ? 1 : 0) + (of.city ? 1 : 0) + (of.verifiedOnly ? 1 : 0) + (of.withOpportunities ? 1 : 0);
  const activeCount = isPeople ? pActive : oActive;
  const hasFilterOrQuery = !!q || activeCount > 0;

  const filteredPeople = useMemo(() => {
    let list = people.filter((p) => {
      if (q && !(p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q) || (p.competencies || []).some((c) => c.toLowerCase().includes(q)) || (p.org || '').toLowerCase().includes(q))) return false;
      if (pf.sport && !(p.sports || []).includes(pf.sport)) return false;
      if (pf.direction && !(p.competencies || []).includes(pf.direction)) return false;
      if (pf.city && p.city !== pf.city) return false;
      if (pf.availability && !(p.availability || []).includes(pf.availability)) return false;
      if (pf.verifiedOnly && !p.verified) return false;
      return true;
    });
    if (pSort === 'За іменем') list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'uk'));
    else if (pSort === 'Спочатку верифіковані') list = [...list].sort((a, b) => Number(!!b.verified) - Number(!!a.verified));
    else list = [...list].sort((a, b) => idx(RECOMMENDED_PEOPLE, a.id) - idx(RECOMMENDED_PEOPLE, b.id));
    return list;
  }, [people, q, pf, pSort]);

  const filteredOrgs = useMemo(() => {
    let list = ORGANIZATIONS.filter((o) => {
      if (q && !(o.name.toLowerCase().includes(q) || o.type.toLowerCase().includes(q) || (o.directions || []).some((d) => d.toLowerCase().includes(q)))) return false;
      if (of.sport && !(o.sports || []).includes(of.sport)) return false;
      if (of.direction && !(o.directions || []).includes(of.direction)) return false;
      if (of.type && o.type !== of.type) return false;
      if (of.region && o.region !== of.region) return false;
      if (of.city && o.city !== of.city) return false;
      if (of.verifiedOnly && !o.verified) return false;
      if (of.withOpportunities && !((o.activeOpportunities || []).length > 0)) return false;
      return true;
    });
    if (oSort === 'За назвою') list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'uk'));
    else if (oSort === 'Спочатку верифіковані') list = [...list].sort((a, b) => Number(!!b.verified) - Number(!!a.verified));
    else if (oSort === 'З можливостями') list = [...list].sort((a, b) => (b.activeOpportunities?.length || 0) - (a.activeOpportunities?.length || 0));
    else list = [...list].sort((a, b) => idx(RECOMMENDED_ORGS, a.id) - idx(RECOMMENDED_ORGS, b.id));
    return list;
  }, [q, of, oSort]);

  const recommendedPeople = RECOMMENDED_PEOPLE.map((id) => people.find((p) => p.id === id)).filter(Boolean) as Person[];
  const recommendedOrgs = RECOMMENDED_ORGS.map((id) => ORGANIZATIONS.find((o) => o.id === id)).filter(Boolean) as OrgItem[];

  const openPerson = (p: Person) => { pushRecent(query); onOpenPerson(p); };
  const openOrg = (o: OrgItem) => { pushRecent(query); onOpenOrg(o); };

  const openFilters = () => sheet.open(
    isPeople
      ? <PeopleFilterSheet value={pf} onApply={(v) => { setPf(v); sheet.close(); }} onReset={() => { setPf({ verifiedOnly: false }); sheet.close(); }} />
      : <OrgFilterSheet value={of} onApply={(v) => { setOf(v); sheet.close(); }} onReset={() => { setOf({ verifiedOnly: false, withOpportunities: false }); sheet.close(); }} />
  );
  const openSort = () => sheet.open(
    <SortSheet options={isPeople ? PEOPLE_SORT : ORG_SORT} value={isPeople ? pSort : oSort} onPick={(v) => { isPeople ? setPSort(v) : setOSort(v); sheet.close(); }} />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader
        title="Мережа"
        right={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={st.roundBtn} onPress={openSort}><Ionicons name="swap-vertical-outline" size={17} color={colors.ink} /></TouchableOpacity>
            <TouchableOpacity style={st.roundBtn} onPress={openFilters}>
              <Ionicons name="options-outline" size={17} color={activeCount ? colors.accent : colors.ink} />
              {activeCount > 0 && <View style={st.badge}><Text style={st.badgeText}>{activeCount}</Text></View>}
            </TouchableOpacity>
          </View>
        }
      />

      <View style={{ paddingHorizontal: space(5), gap: 12 }}>
        <SearchInput value={query} onChange={setQuery} placeholder="Імʼя, організація або спеціалізація" onFocus={() => setFocused(true)} />
        <View style={st.segment}>
          {NETWORK_TABS.map((t) => (
            <Text key={t} onPress={() => setTab(t)} style={[st.seg, tab === t && st.segOn]}>{t}</Text>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: space(5), paddingTop: space(3), gap: 10 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Недавні пошуки */}
        {focused && !q && recent.length > 0 && (
          <View style={{ gap: 8, marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={st.recentLabel}>Нещодавні пошуки</Text>
              <Text style={st.clear} onPress={clearRecent}>Очистити</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {recent.map((r) => (
                <TouchableOpacity key={r} style={st.recentChip} onPress={() => setQuery(r)} activeOpacity={0.8}>
                  <Ionicons name="time-outline" size={13} color={colors.muted} />
                  <Text style={st.recentChipText}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Рекомендовані (порожній стан пошуку) */}
        {!hasFilterOrQuery && (
          <View style={{ gap: 10, marginBottom: 4 }}>
            <SectionHeader title={isPeople ? 'Рекомендовані спеціалісти' : 'Рекомендовані організації'} />
            {isPeople
              ? recommendedPeople.map((p) => <PersonCardRow key={p.id} p={p} saved={saved.includes(p.id)} onToggleSave={() => onToggleSave(p.id)} onPress={() => openPerson(p)} />)
              : recommendedOrgs.map((o) => <OrgCardRow key={o.id} o={o} saved={saved.includes(o.id)} onToggleSave={() => onToggleSave(o.id)} onPress={() => openOrg(o)} />)}
            <View style={{ height: 4 }} />
            <SectionHeader title={isPeople ? `Усі спеціалісти · ${filteredPeople.length}` : `Усі організації · ${filteredOrgs.length}`} />
          </View>
        )}

        {/* Список */}
        {isPeople ? (
          filteredPeople.length
            ? filteredPeople.map((p) => <PersonCardRow key={p.id} p={p} saved={saved.includes(p.id)} onToggleSave={() => onToggleSave(p.id)} onPress={() => openPerson(p)} />)
            : <EmptyState title="Нікого не знайдено" subtitle="Змініть запит або скиньте фільтри." action={activeCount ? 'Скинути фільтри' : undefined} onAction={() => setPf({ verifiedOnly: false })} />
        ) : (
          filteredOrgs.length
            ? filteredOrgs.map((o) => <OrgCardRow key={o.id} o={o} saved={saved.includes(o.id)} onToggleSave={() => onToggleSave(o.id)} onPress={() => openOrg(o)} />)
            : <EmptyState title="Організацій не знайдено" subtitle="Змініть запит або скиньте фільтри." action={oActive ? 'Скинути фільтри' : undefined} onAction={() => setOf({ verifiedOnly: false, withOpportunities: false })} />
        )}
      </ScrollView>
    </View>
  );
}

const idx = (arr: string[], id: string) => { const i = arr.indexOf(id); return i === -1 ? 999 : i; };

/* Картки з кнопкою збереження */
function PersonCardRow({ p, saved, onToggleSave, onPress }: { p: Person; saved: boolean; onToggleSave: () => void; onPress: () => void }) {
  return (
    <View style={{ position: 'relative' }}>
      <PersonCard name={p.name} role={p.role} initials={p.initials} tags={p.tags} shade={p.shade} verified={p.verified} onPress={onPress} />
      <TouchableOpacity style={st.saveDot} hitSlop={8} onPress={onToggleSave}>
        <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={15} color={saved ? colors.accent : colors.muted} />
      </TouchableOpacity>
    </View>
  );
}
function OrgCardRow({ o, saved, onToggleSave, onPress }: { o: OrgItem; saved: boolean; onToggleSave: () => void; onPress: () => void }) {
  return (
    <View style={{ position: 'relative' }}>
      <OrganizationCard name={o.name} type={o.type} city={o.city} sports={o.sports} verified={o.verified} onPress={onPress} />
      <TouchableOpacity style={st.saveDot} hitSlop={8} onPress={onToggleSave}>
        <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={15} color={saved ? colors.accent : colors.muted} />
      </TouchableOpacity>
    </View>
  );
}

/* Групи фільтрів */
function Group({ title, items, value, onChange }: { title: string; items: string[]; value?: string; onChange: (v?: string) => void }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={st.groupLabel}>{title}</Text>
      <FilterChips items={[ALL, ...items]} value={value || ALL} onChange={(v) => onChange(v === ALL ? undefined : v)} />
    </View>
  );
}
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <TouchableOpacity style={st.toggleRow} activeOpacity={0.8} onPress={() => onChange(!value)}>
      <Text style={st.toggleLabel}>{label}</Text>
      <View style={[st.switch, value && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
        <View style={[st.knob, value && { alignSelf: 'flex-end' }]} />
      </View>
    </TouchableOpacity>
  );
}

function PeopleFilterSheet({ value, onApply, onReset }: { value: PFilters; onApply: (v: PFilters) => void; onReset: () => void }) {
  const [v, setV] = useState<PFilters>(value);
  return (
    <View style={{ gap: 16, paddingBottom: 8 }}>
      <Text style={st.sheetTitle}>Фільтри — люди</Text>
      <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
        <Group title="Вид спорту" items={SPORTS_LIST} value={v.sport} onChange={(x) => setV({ ...v, sport: x })} />
        <Group title="Напрям" items={DIRECTIONS} value={v.direction} onChange={(x) => setV({ ...v, direction: x })} />
        <Group title="Місто" items={CITIES} value={v.city} onChange={(x) => setV({ ...v, city: x })} />
        <Group title="Доступність" items={AVAILABILITY_STATUSES} value={v.availability} onChange={(x) => setV({ ...v, availability: x })} />
        <Toggle label="Лише верифіковані" value={v.verifiedOnly} onChange={(x) => setV({ ...v, verifiedOnly: x })} />
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><Button full label="Скинути" variant="secondary" onPress={onReset} /></View>
        <View style={{ flex: 1 }}><Button full label="Застосувати" variant="primary" onPress={() => onApply(v)} /></View>
      </View>
    </View>
  );
}
function OrgFilterSheet({ value, onApply, onReset }: { value: OFilters; onApply: (v: OFilters) => void; onReset: () => void }) {
  const [v, setV] = useState<OFilters>(value);
  return (
    <View style={{ gap: 16, paddingBottom: 8 }}>
      <Text style={st.sheetTitle}>Фільтри — організації</Text>
      <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
        <Group title="Тип організації" items={ORG_TYPES} value={v.type} onChange={(x) => setV({ ...v, type: x })} />
        <Group title="Вид спорту" items={SPORTS_LIST} value={v.sport} onChange={(x) => setV({ ...v, sport: x })} />
        <Group title="Напрям" items={DIRECTIONS} value={v.direction} onChange={(x) => setV({ ...v, direction: x })} />
        <Group title="Область" items={REGIONS} value={v.region} onChange={(x) => setV({ ...v, region: x })} />
        <Group title="Місто" items={CITIES} value={v.city} onChange={(x) => setV({ ...v, city: x })} />
        <Toggle label="Лише верифіковані" value={v.verifiedOnly} onChange={(x) => setV({ ...v, verifiedOnly: x })} />
        <Toggle label="З активними можливостями" value={v.withOpportunities} onChange={(x) => setV({ ...v, withOpportunities: x })} />
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><Button full label="Скинути" variant="secondary" onPress={onReset} /></View>
        <View style={{ flex: 1 }}><Button full label="Застосувати" variant="primary" onPress={() => onApply(v)} /></View>
      </View>
    </View>
  );
}
function SortSheet({ options, value, onPick }: { options: string[]; value: string; onPick: (v: string) => void }) {
  return (
    <View style={{ gap: 4, paddingBottom: 8 }}>
      <Text style={[st.sheetTitle, { marginBottom: 8 }]}>Сортування</Text>
      {options.map((o) => (
        <TouchableOpacity key={o} style={st.sortRow} activeOpacity={0.8} onPress={() => onPick(o)}>
          <Text style={[st.sortText, o === value && { color: colors.accent, fontFamily: fonts.bold }]}>{o}</Text>
          {o === value && <Ionicons name="checkmark" size={18} color={colors.accent} />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  roundBtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { fontFamily: fonts.bold, color: '#fff', fontSize: 9.5 },
  segment: { flexDirection: 'row', gap: 8 },
  seg: { fontFamily: fonts.semi, color: colors.muted, fontSize: 14, paddingVertical: 6, paddingHorizontal: 4, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  segOn: { color: colors.ink, fontFamily: fonts.bold, borderBottomColor: colors.accent },
  recentLabel: { fontFamily: fonts.bold, color: colors.dim, fontSize: 12.5 },
  clear: { fontFamily: fonts.semi, color: colors.accent, fontSize: 12 },
  recentChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.chipBg, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  recentChipText: { fontFamily: fonts.semi, color: colors.dim, fontSize: 12.5 },
  saveDot: { position: 'absolute', top: 12, right: 12, width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  sheetTitle: { fontFamily: fonts.extra, color: colors.ink, fontSize: 18, letterSpacing: -0.3 },
  groupLabel: { fontFamily: fonts.bold, color: colors.dim, fontSize: 12.5 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  toggleLabel: { fontFamily: fonts.semi, color: colors.ink, fontSize: 14 },
  switch: { width: 44, height: 26, borderRadius: 13, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.chipBg, padding: 2, justifyContent: 'center' },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  sortRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line },
  sortText: { fontFamily: fonts.semi, color: colors.ink, fontSize: 14.5 },
});
