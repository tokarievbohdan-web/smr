import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { colors, radius, space, fonts } from '../../theme';
import { Article, Person, typeLabel } from '../../data';
import { OrgItem, OpportunityItem, EventItem, ORGANIZATIONS, OPPORTUNITIES, EVENTS } from '../../shellData';
import { useContent } from '../../ContentContext';
import { AppHeader, ContentCard, PersonCard, OrganizationCard, OpportunityCard, EventCard, EmptyState } from '../../ui';

type Tab = 'articles' | 'people' | 'orgs' | 'opps' | 'events';

export default function SavedHubScreen({
  onBack, saved, savedNet, savedOpp, savedEvt,
  onToggleSave, onToggleSaveNet, onToggleSaveOpp, onToggleSaveEvt,
  onOpenArticle, onOpenPerson, onOpenOrg, onOpenOpportunity, onOpenEvent,
}: {
  onBack: () => void;
  saved: string[]; savedNet: string[]; savedOpp: string[]; savedEvt: string[];
  onToggleSave: (id: string) => void; onToggleSaveNet: (id: string) => void; onToggleSaveOpp: (id: string) => void; onToggleSaveEvt: (id: string) => void;
  onOpenArticle: (a: Article) => void; onOpenPerson: (p: Person) => void; onOpenOrg: (o: OrgItem) => void;
  onOpenOpportunity: (o: OpportunityItem) => void; onOpenEvent: (e: EventItem) => void;
}) {
  const { articles, people } = useContent();
  const [tab, setTab] = useState<Tab>('articles');

  const savedArticles = articles.filter((a) => saved.includes(a.id));
  const savedPeople = people.filter((p) => savedNet.includes(p.id));
  const savedOrgs = ORGANIZATIONS.filter((o) => savedNet.includes(o.id));
  const savedOpps = OPPORTUNITIES.filter((o) => savedOpp.includes(o.id));
  const savedEvents = EVENTS.filter((e) => savedEvt.includes(e.id));

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'articles', label: 'Матеріали', count: savedArticles.length },
    { key: 'people', label: 'Люди', count: savedPeople.length },
    { key: 'orgs', label: 'Організації', count: savedOrgs.length },
    { key: 'opps', label: 'Можливості', count: savedOpps.length },
    { key: 'events', label: 'Події', count: savedEvents.length },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader title="Збережене" onBack={onBack} />
      <View style={{ paddingLeft: space(5), paddingBottom: space(2) }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: space(5) }}>
          {tabs.map((t) => (
            <Pressable key={t.key} onPress={() => setTab(t.key)}>
              <View style={[s.chip, tab === t.key ? { backgroundColor: colors.dark, borderColor: colors.dark } : { borderColor: colors.line }]}>
                <Text style={[s.chipText, { color: tab === t.key ? '#fff' : colors.ink }]}>{t.label}{t.count ? ` · ${t.count}` : ''}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: space(5), paddingTop: space(2), gap: 12 }} showsVerticalScrollIndicator={false}>
        {tab === 'articles' && (savedArticles.length ? savedArticles.map((a) => (
          <ContentCard key={a.id} category={a.category} kind={typeLabel(a.type)} title={a.title} excerpt={a.subtitle || a.excerpt} meta={`${typeLabel(a.type)} · ${a.readMin} хв`} imageUri={a.imageUrl} saved onSave={() => onToggleSave(a.id)} onPress={() => onOpenArticle(a)} />
        )) : <Empty label="матеріалів" />)}

        {tab === 'people' && (savedPeople.length ? savedPeople.map((p) => (
          <PersonCard key={p.id} name={p.name} role={p.role} initials={p.initials} tags={p.tags} shade={p.shade} verified={p.verified} onPress={() => onOpenPerson(p)} />
        )) : <Empty label="людей" />)}

        {tab === 'orgs' && (savedOrgs.length ? savedOrgs.map((o) => (
          <OrganizationCard key={o.id} name={o.name} type={o.type} city={o.city} sports={o.sports} verified={o.verified} onPress={() => onOpenOrg(o)} />
        )) : <Empty label="організацій" />)}

        {tab === 'opps' && (savedOpps.length ? savedOpps.map((o) => (
          <OpportunityCard key={o.id} title={o.title} type={o.type} org={o.org} city={o.city} budget={o.budgetVisibility === 'Публічний' ? o.budget : undefined} deadline={o.deadline} statusLabel={o.status} sport={o.sport} format={o.format} verified={o.verified} saved onSave={() => onToggleSaveOpp(o.id)} onPress={() => onOpenOpportunity(o)} />
        )) : <Empty label="можливостей" />)}

        {tab === 'events' && (savedEvents.length ? savedEvents.map((e) => (
          <EventCard key={e.id} title={e.title} date={e.date} time={e.time} city={e.city} format={e.format} type={e.type} organizer={e.organizer} cost={e.cost} seatsLeft={e.seatsLeft} saved onSave={() => onToggleSaveEvt(e.id)} onPress={() => onOpenEvent(e)} />
        )) : <Empty label="подій" />)}
      </ScrollView>
    </View>
  );
}

function Empty({ label }: { label: string }) {
  return <EmptyState icon="bookmark-outline" title={`Немає збережених ${label}`} subtitle="Зберігайте потрібне, щоб швидко повертатися." />;
}

const s = StyleSheet.create({
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1 },
  chipText: { fontFamily: fonts.semi, fontSize: 12.5 },
});
