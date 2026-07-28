import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, radius, space, fonts } from '../theme';
import { Article, Person, typeLabel } from '../data';
import { OrgItem, OpportunityItem, EventItem, ORGANIZATIONS, OPPORTUNITIES, EVENTS } from '../shellData';
import { useContent } from '../ContentContext';
import { Photo, Avatar, EmptyState, StatusBadge } from '../ui';

const RECENT_KEY = 'smr_search_recent_v1';
const POPULAR = ['Спонсорство', 'Медіаправа', 'Неймінг', 'iGaming', 'Партнерство'];
const SUGGESTED = ['Кейси спонсорства', 'Вакансії у клубах', 'Події цього тижня', 'Верифіковані організації'];
const GROUP_LIMIT = 4;
const PAGE = 8;

type Filter = 'all' | 'articles' | 'people' | 'orgs' | 'opps' | 'events';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Усі' }, { key: 'articles', label: 'Матеріали' }, { key: 'people', label: 'Люди' },
  { key: 'orgs', label: 'Організації' }, { key: 'opps', label: 'Можливості' }, { key: 'events', label: 'Події' },
];

export default function SearchScreen({
  onCancel, onOpenArticle, onOpenPerson, onOpenOrg, onOpenOpportunity, onOpenEvent,
}: {
  onCancel: () => void;
  onOpenArticle: (a: Article) => void;
  onOpenPerson: (p: Person) => void;
  onOpenOrg: (o: OrgItem) => void;
  onOpenOpportunity: (o: OpportunityItem) => void;
  onOpenEvent: (e: EventItem) => void;
}) {
  const { articles, people } = useContent();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [recent, setRecent] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const timer = useRef<any>(null);

  useEffect(() => { AsyncStorage.getItem(RECENT_KEY).then((r) => { if (r) try { setRecent(JSON.parse(r)); } catch {} }); }, []);
  useEffect(() => { setPage(1); }, [debounced, filter]);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebounced(query.trim().toLowerCase()), 250);
    return () => timer.current && clearTimeout(timer.current);
  }, [query]);

  const pushRecent = (term: string) => {
    const t = term.trim(); if (t.length < 2) return;
    setRecent((prev) => { const next = [t, ...prev.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 8); AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next)).catch(() => {}); return next; });
  };
  const clearRecent = () => { setRecent([]); AsyncStorage.removeItem(RECENT_KEY).catch(() => {}); };

  const q = debounced;
  const m = (s?: string) => !!s && s.toLowerCase().includes(q);
  const res = useMemo(() => ({
    articles: articles.filter((a) => m(a.title) || m(a.category) || m(a.subtitle) || m(typeLabel(a.type))),
    people: people.filter((p) => m(p.name) || m(p.role) || (p.competencies || []).some(m)),
    orgs: ORGANIZATIONS.filter((o) => m(o.name) || m(o.type) || (o.directions || []).some(m)),
    opps: OPPORTUNITIES.filter((o) => m(o.title) || m(o.org) || m(o.type) || (o.tags || []).some(m)),
    events: EVENTS.filter((e) => m(e.title) || m(e.organizer) || m(e.type) || (e.tags || []).some(m)),
  }), [q, articles, people]);

  const counts = { articles: res.articles.length, people: res.people.length, orgs: res.orgs.length, opps: res.opps.length, events: res.events.length };
  const total = counts.articles + counts.people + counts.orgs + counts.opps + counts.events;
  const show = (k: Filter) => filter === 'all' || filter === k;
  const limit = (arr: any[]) => (filter === 'all' ? arr.slice(0, GROUP_LIMIT) : arr.slice(0, page * PAGE));
  // Кількість елементів у поточному одно-типовому списку (для пагінації / infinite scroll)
  const activeLen = filter === 'all' ? 0 : (counts as any)[filter] as number;
  const hasMore = filter !== 'all' && activeLen > page * PAGE;
  const onScroll = (e: any) => {
    if (!hasMore) return;
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 240) setPage((p) => p + 1);
  };
  const commit = () => pushRecent(query);

  const openA = (a: Article) => { commit(); onOpenArticle(a); };
  const openP = (p: Person) => { commit(); onOpenPerson(p); };
  const openO = (o: OrgItem) => { commit(); onOpenOrg(o); };
  const openOp = (o: OpportunityItem) => { commit(); onOpenOpportunity(o); };
  const openE = (e: EventItem) => { commit(); onOpenEvent(e); };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <View style={styles.field}>
          <Ionicons name="search-outline" size={16} color={colors.accent} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Пошук: матеріали, люди, організації…" placeholderTextColor={colors.muted} style={styles.input} autoFocus />
          {query ? <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}><Ionicons name="close-circle" size={16} color={colors.muted} /></TouchableOpacity> : null}
        </View>
        <TouchableOpacity onPress={onCancel}><Text style={styles.cancel}>Скасувати</Text></TouchableOpacity>
      </View>

      {q.length > 0 && (
        <View style={{ paddingLeft: space(5), paddingBottom: space(2) }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: space(5) }}>
            {FILTERS.map((f) => {
              const c = f.key === 'all' ? total : (counts as any)[f.key];
              return (
                <Pressable key={f.key} onPress={() => setFilter(f.key)}>
                  <View style={[styles.chip, filter === f.key ? { backgroundColor: colors.dark, borderColor: colors.dark } : { borderColor: colors.line }]}>
                    <Text style={[styles.chipText, { color: filter === f.key ? '#fff' : colors.ink }]}>{f.label}{c ? ` · ${c}` : ''}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingHorizontal: space(5), paddingBottom: space(8), gap: 18 }}>
        {q.length === 0 ? (
          <>
            {recent.length > 0 && (
              <View style={{ gap: 10 }}>
                <View style={styles.groupRow}><Text style={styles.group}>НЕЩОДАВНІ</Text><Text style={styles.clear} onPress={clearRecent}>Очистити</Text></View>
                <View style={styles.wrap}>{recent.map((t) => <Chip key={t} label={t} icon="time-outline" onPress={() => setQuery(t)} />)}</View>
              </View>
            )}
            <View style={{ gap: 10 }}>
              <Text style={styles.group}>ПОПУЛЯРНІ</Text>
              <View style={styles.wrap}>{POPULAR.map((t) => <Chip key={t} label={t} icon="trending-up-outline" onPress={() => setQuery(t)} />)}</View>
            </View>
            <View style={{ gap: 10 }}>
              <Text style={styles.group}>РЕКОМЕНДОВАНІ ЗАПИТИ</Text>
              <View style={styles.wrap}>{SUGGESTED.map((t) => <Chip key={t} label={t} icon="sparkles-outline" onPress={() => setQuery(t)} />)}</View>
            </View>
          </>
        ) : total === 0 ? (
          <View style={{ marginTop: space(6) }}><EmptyState icon="search-outline" title={`Нічого не знайдено за «${query}»`} subtitle="Спробуйте інші слова або приберіть фільтр." /></View>
        ) : (
          <>
            {show('articles') && res.articles.length > 0 && (
              <Group title="Матеріали" count={counts.articles} more={filter === 'all' && counts.articles > GROUP_LIMIT} onMore={() => setFilter('articles')}>
                {limit(res.articles).map((a) => (
                  <Pressable key={a.id} style={styles.mRow} onPress={() => openA(a)}>
                    <Photo height={56} uri={a.imageUrl} round={radius.md} style={{ width: 56 }} />
                    <View style={{ flex: 1, gap: 3 }}><Text style={styles.mTitle} numberOfLines={2}>{a.title}</Text><Text style={styles.mMeta}>{a.category} · {typeLabel(a.type)}</Text></View>
                  </Pressable>
                ))}
              </Group>
            )}
            {show('people') && res.people.length > 0 && (
              <Group title="Люди" count={counts.people} more={filter === 'all' && counts.people > GROUP_LIMIT} onMore={() => setFilter('people')}>
                {limit(res.people).map((p) => (
                  <Pressable key={p.id} style={styles.pRow} onPress={() => openP(p)}>
                    <Avatar initials={p.initials} size={44} shade={p.shade} verified={p.verified} />
                    <View style={{ flex: 1 }}><Text style={styles.pName}>{p.name}</Text><Text style={styles.pRole} numberOfLines={1}>{p.role}</Text></View>
                    <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                  </Pressable>
                ))}
              </Group>
            )}
            {show('orgs') && res.orgs.length > 0 && (
              <Group title="Організації" count={counts.orgs} more={filter === 'all' && counts.orgs > GROUP_LIMIT} onMore={() => setFilter('orgs')}>
                {limit(res.orgs).map((o) => (
                  <Pressable key={o.id} style={styles.pRow} onPress={() => openO(o)}>
                    <View style={styles.orgLogo}><Ionicons name="business-outline" size={20} color={colors.dim} /></View>
                    <View style={{ flex: 1 }}><Text style={styles.pName}>{o.name}</Text><Text style={styles.pRole}>{o.type} · {o.city}</Text></View>
                    <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                  </Pressable>
                ))}
              </Group>
            )}
            {show('opps') && res.opps.length > 0 && (
              <Group title="Можливості" count={counts.opps} more={filter === 'all' && counts.opps > GROUP_LIMIT} onMore={() => setFilter('opps')}>
                {limit(res.opps).map((o) => (
                  <Pressable key={o.id} style={styles.pRow} onPress={() => openOp(o)}>
                    <View style={styles.orgLogo}><Ionicons name="briefcase-outline" size={18} color={colors.dim} /></View>
                    <View style={{ flex: 1 }}><Text style={styles.pName} numberOfLines={1}>{o.title}</Text><Text style={styles.pRole}>{o.type} · {o.org}</Text></View>
                    <StatusBadge label={o.status.label} tone={o.status.tone} />
                  </Pressable>
                ))}
              </Group>
            )}
            {show('events') && res.events.length > 0 && (
              <Group title="Події" count={counts.events} more={filter === 'all' && counts.events > GROUP_LIMIT} onMore={() => setFilter('events')}>
                {limit(res.events).map((e) => (
                  <Pressable key={e.id} style={styles.pRow} onPress={() => openE(e)}>
                    <View style={styles.orgLogo}><Ionicons name="calendar-outline" size={18} color={colors.dim} /></View>
                    <View style={{ flex: 1 }}><Text style={styles.pName} numberOfLines={1}>{e.title}</Text><Text style={styles.pRole}>{e.date} · {e.format}</Text></View>
                    <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                  </Pressable>
                ))}
              </Group>
            )}
            {filter !== 'all' && activeLen > 0 && (
              hasMore
                ? <TouchableOpacity style={styles.more} onPress={() => setPage((p) => p + 1)} activeOpacity={0.8}><Text style={styles.moreText}>Показати ще ({activeLen - page * PAGE})</Text></TouchableOpacity>
                : <Text style={styles.end}>Показано всі · {activeLen}</Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Group({ title, count, more, onMore, children }: { title: string; count: number; more?: boolean; onMore?: () => void; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.groupRow}><Text style={styles.group}>{title.toUpperCase()} · {count}</Text>{more ? <Text style={styles.clear} onPress={onMore}>Показати всі</Text> : null}</View>
      {children}
    </View>
  );
}
function Chip({ label, icon, onPress }: { label: string; icon: any; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.sChip} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name={icon} size={13} color={colors.muted} />
      <Text style={styles.sChipText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: space(5), paddingTop: space(2), paddingBottom: space(3) },
  field: { flex: 1, height: 46, borderWidth: 1.5, borderColor: colors.accent, borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  input: { flex: 1, fontFamily: fonts.semi, color: colors.ink, fontSize: 14, outlineStyle: 'none' } as any,
  cancel: { fontFamily: fonts.semi, color: colors.dim, fontSize: 13.5 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1 },
  chipText: { fontFamily: fonts.semi, fontSize: 12.5 },
  group: { fontFamily: fonts.bold, color: colors.muted, fontSize: 11, letterSpacing: 0.8 },
  groupRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clear: { fontFamily: fonts.semi, color: colors.accent, fontSize: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.chipBg, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8 },
  sChipText: { fontFamily: fonts.semi, color: colors.dim, fontSize: 12.5 },
  mRow: { flexDirection: 'row', gap: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 10 },
  mTitle: { fontFamily: fonts.bold, color: colors.ink, fontSize: 13.5, lineHeight: 18 },
  mMeta: { fontFamily: fonts.semi, color: colors.muted, fontSize: 11.5 },
  pRow: { flexDirection: 'row', gap: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 12 },
  orgLogo: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.chipBg, alignItems: 'center', justifyContent: 'center' },
  pName: { fontFamily: fonts.bold, color: colors.ink, fontSize: 13.5 },
  pRole: { fontFamily: fonts.semi, color: colors.muted, fontSize: 11.5 },
  more: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, paddingVertical: 13, alignItems: 'center' },
  moreText: { fontFamily: fonts.bold, color: colors.accent, fontSize: 13.5 },
  end: { fontFamily: fonts.semi, color: colors.muted, fontSize: 12.5, textAlign: 'center', paddingVertical: space(2) },
});
