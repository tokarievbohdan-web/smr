import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import { colors, radius, space, fonts } from '../theme';
import { useContent } from '../ContentContext';
import { useAuth } from '../AuthContext';
import { Article, typeLabel } from '../data';
import { ORGANIZATIONS, OPPORTUNITIES, EVENTS } from '../shellData';
import {
  SectionHeader, ContentCard, PersonCard, OrganizationCard, OpportunityCard, EventCard,
  Photo, StatusBadge, SkeletonCard, FilterChips,
} from '../ui';
import { Logo } from '../components';
import { Ionicons } from '@expo/vector-icons';

type TabKey = 'review' | 'network' | 'opportunities' | 'events' | 'profile';

export default function HomeScreen({
  onOpen, onOpenSearch, onGoTab, onOpenReviewFeed, saved, onToggleSave,
}: {
  onOpen: (a: Article) => void;
  onOpenSearch: () => void;
  onGoTab: (t: TabKey) => void;
  onOpenReviewFeed: (category?: string) => void;
  saved: string[];
  onToggleSave: (id: string) => void;
}) {
  const { articles, people, categories, loading } = useContent();
  const { user } = useAuth();

  const featured = articles.find((a) => a.topToday) || articles[0];
  const topRow = articles.filter((a) => a.topToday && a.id !== featured?.id).slice(0, 4);
  const savedArticles = articles.filter((a) => saved.includes(a.id));

  // Персоналізація порядку блоків за цілями
  const goals = user?.goals || [];
  const score: Record<string, number> = { materials: 100, opportunities: 40, events: 30, specialists: 20, organizations: 10, continue: savedArticles.length ? 90 : -100 };
  goals.forEach((g) => {
    if (/робот|партнер|спонсор|можлив|інвест|публік/i.test(g)) score.opportunities += 25;
    if (/поді/i.test(g)) score.events += 25;
    if (/спеціаліст/i.test(g)) score.specialists += 25;
    if (/новин/i.test(g)) score.materials += 15;
  });
  const orderKeys = Object.keys(score).sort((a, b) => score[b] - score[a]);

  const Materials = () => (
    <View key="materials" style={{ gap: 12 }}>
      <View style={s.headRow}>
        <Text style={s.h1}>Головне сьогодні</Text>
        <Text style={s.date}>{featured?.date || ''}</Text>
      </View>
      {loading && !featured ? <SkeletonCard /> : featured ? (
        <ContentCard category={featured.category} kind={typeLabel(featured.type)} title={featured.title} excerpt={featured.subtitle || featured.excerpt} meta={`${typeLabel(featured.type)} · ${featured.readMin} хв · ${featured.commentsCount} коментарів`} imageUri={featured.imageUrl} saved={saved.includes(featured.id)} onSave={() => onToggleSave(featured.id)} onPress={() => onOpen(featured)} />
      ) : null}
      {topRow.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {topRow.map((a) => (
            <Pressable key={a.id} style={s.topCard} onPress={() => onOpen(a)}>
              <Photo label={a.photo} uri={a.imageUrl} height={100} round={0} />
              <View style={{ padding: 12, gap: 6 }}>
                <Text style={s.cat}>{a.category.toUpperCase()}</Text>
                <Text style={s.topTitle} numberOfLines={3}>{a.title}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
      <FilterChips items={['Усі', ...categories.map((c) => c.title)]} value="Усі" onChange={(v) => onOpenReviewFeed(v === 'Усі' ? undefined : v)} />
      <TouchableOpacity style={s.allBtn} onPress={() => onOpenReviewFeed()} activeOpacity={0.8}>
        <Text style={s.allBtnText}>Переглянути всі матеріали</Text>
        <Ionicons name="arrow-forward" size={16} color={colors.accent} />
      </TouchableOpacity>
    </View>
  );

  const Opportunities = () => (
    <View key="opportunities" style={{ gap: 12 }}>
      <SectionHeader title="Нові можливості" action="Усі" onAction={() => onGoTab('opportunities')} />
      {OPPORTUNITIES.slice(0, 2).map((o) => (
        <OpportunityCard key={o.id} title={o.title} type={o.type} org={o.org} city={o.city} budget={o.budget} deadline={o.deadline} statusLabel={o.status} onPress={() => onGoTab('opportunities')} />
      ))}
    </View>
  );

  const Events = () => (
    <View key="events" style={{ gap: 12 }}>
      <SectionHeader title="Найближчі події" action="Усі" onAction={() => onGoTab('events')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
        {EVENTS.slice(0, 3).map((e) => (
          <View key={e.id} style={{ width: 260 }}>
            <EventCard title={e.title} date={e.date} city={e.city} format={e.format} onPress={() => onGoTab('events')} />
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const Specialists = () => (
    <View key="specialists" style={{ gap: 12 }}>
      <SectionHeader title="Рекомендовані фахівці" action="Мережа" onAction={() => onGoTab('network')} />
      {people.slice(0, 3).map((p) => (
        <PersonCard key={p.id} name={p.name} role={p.role} initials={p.initials} tags={p.tags} shade={p.shade} verified={p.id === 'p1'} onPress={() => onGoTab('network')} />
      ))}
    </View>
  );

  const Organizations = () => (
    <View key="organizations" style={{ gap: 12 }}>
      <SectionHeader title="Рекомендовані організації" action="Мережа" onAction={() => onGoTab('network')} />
      {ORGANIZATIONS.slice(0, 2).map((o) => (
        <OrganizationCard key={o.id} name={o.name} type={o.type} city={o.city} sports={o.sports} verified={o.verified} onPress={() => onGoTab('network')} />
      ))}
    </View>
  );

  const Continue = () =>
    savedArticles.length ? (
      <View key="continue" style={{ gap: 12 }}>
        <SectionHeader title="Продовжити читати" />
        {savedArticles.slice(0, 2).map((a) => (
          <Pressable key={a.id} style={s.contRow} onPress={() => onOpen(a)}>
            <Photo height={56} uri={a.imageUrl} round={radius.md} style={{ width: 56 }} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={s.contTitle} numberOfLines={2}>{a.title}</Text>
              <Text style={s.contMeta}>{a.category} · {a.readMin} хв</Text>
            </View>
            <Ionicons name="bookmark" size={16} color={colors.accent} />
          </Pressable>
        ))}
      </View>
    ) : null;

  const blocks: Record<string, () => React.ReactNode> = {
    materials: Materials, opportunities: Opportunities, events: Events, specialists: Specialists, organizations: Organizations, continue: Continue,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.header}>
        <Logo />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={s.iconBtn} onPress={onOpenSearch}><Ionicons name="search-outline" size={18} color={colors.ink} /></TouchableOpacity>
          <TouchableOpacity style={s.iconBtn}><Ionicons name="notifications-outline" size={18} color={colors.ink} /><View style={s.dot} /></TouchableOpacity>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: space(5), paddingTop: space(2), gap: space(7) }} showsVerticalScrollIndicator={false}>
        {orderKeys.map((k) => blocks[k]())}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space(5), paddingTop: space(2), paddingBottom: space(3) },
  iconBtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: 8, right: 9, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent, borderWidth: 1.5, borderColor: colors.bg },
  headRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  h1: { fontFamily: fonts.extra, color: colors.ink, fontSize: 20, letterSpacing: -0.4 },
  date: { fontFamily: fonts.semi, color: colors.accent, fontSize: 12 },
  cat: { fontFamily: fonts.bold, color: colors.accent, fontSize: 10, letterSpacing: 0.6 },
  topCard: { width: 240, borderWidth: 1, borderColor: colors.line, borderRadius: radius.xxl, overflow: 'hidden' },
  topTitle: { fontFamily: fonts.bold, color: colors.ink, fontSize: 14, lineHeight: 18, letterSpacing: -0.2 },
  allBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, paddingVertical: 13 },
  allBtnText: { fontFamily: fonts.bold, color: colors.accent, fontSize: 14 },
  contRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 10 },
  contTitle: { fontFamily: fonts.bold, color: colors.ink, fontSize: 13.5, lineHeight: 18 },
  contMeta: { fontFamily: fonts.semi, color: colors.muted, fontSize: 11.5 },
});
