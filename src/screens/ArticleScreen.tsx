import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Pressable } from 'react-native';
import { colors, radius, space, fonts } from '../theme';
import { Article, BodyBlock, Comment, Person, typeLabel, ME, findPerson, PEOPLE } from '../data';
import { ORGANIZATIONS, OrgItem, OpportunityItem, EventItem, OPPORTUNITIES, EVENTS } from '../shellData';
import { useContent } from '../ContentContext';
import { useSheet, useToast, useAuth } from '../UIProvider';
import {
  Photo, Avatar, StatusBadge, SectionHeader, PersonCard, OrganizationCard, OpportunityCard, EventCard, PrimaryCTA, SecondaryCTA,
} from '../ui';
import { CommentItem, CommentComposer } from '../components';
import { Ionicons } from '@expo/vector-icons';

type TabKey = 'review' | 'network' | 'opportunities' | 'events' | 'profile';

function Block({ block }: { block: BodyBlock }) {
  if (block.type === 'heading') return <Text style={s.h3}>{block.text}</Text>;
  if (block.type === 'text') return <Text style={s.body}>{block.text}</Text>;
  if (block.type === 'image') return <Photo label={block.label} height={180} style={{ marginVertical: 4 }} />;
  if (block.type === 'quote') return (
    <View style={s.quote}>
      <Text style={s.quoteText}>«{block.text}»</Text>
      {block.author ? <Text style={s.quoteAuthor}>— {block.author}</Text> : null}
    </View>
  );
  if (block.type === 'table') return (
    <View style={s.table}>
      <View style={[s.tr, s.trHead]}>{block.headers.map((h, i) => <Text key={i} style={[s.th, { flex: 1 }]}>{h}</Text>)}</View>
      {block.rows.map((row, ri) => (
        <View key={ri} style={s.tr}>{row.map((c, ci) => <Text key={ci} style={[s.td, { flex: 1 }]}>{c}</Text>)}</View>
      ))}
    </View>
  );
  return null;
}

export default function ArticleScreen({
  item, onBack, saved, onToggleSave, onOpen, onGoTab, onOpenPerson, onOpenOrg, onOpenOpportunity, onOpenEvent,
}: {
  item: Article;
  onBack: () => void;
  saved: boolean;
  onToggleSave: () => void;
  onOpen: (a: Article) => void;
  onGoTab: (t: TabKey) => void;
  onOpenPerson: (p: Person) => void;
  onOpenOrg: (o: OrgItem) => void;
  onOpenOpportunity: (o: OpportunityItem) => void;
  onOpenEvent: (e: EventItem) => void;
}) {
  const { articles, people } = useContent();
  const sheet = useSheet();
  const toast = useToast();
  const { requireAuth } = useAuth();

  const [comments, setComments] = useState<Comment[]>(item.comments);
  const [liked, setLiked] = useState<number[]>([]);

  const toggleLike = (i: number) => {
    setLiked((l) => (l.includes(i) ? l.filter((x) => x !== i) : [...l, i]));
    setComments((cs) => cs.map((c, idx) => (idx === i ? { ...c, helpful: c.helpful + (liked.includes(i) ? -1 : 1) } : c)));
  };
  const addComment = (text: string) => requireAuth(() => setComments((cs) => [...cs, { author: ME.name, role: ME.role, initials: ME.initials, text, helpful: 0 }]));

  const save = () => requireAuth(onToggleSave);
  const share = async () => {
    try { await Share.share({ message: `${item.title} — Sport Market Review` }); }
    catch { toast('Не вдалося поділитися', 'warning'); }
  };

  const openAuthor = () => sheet.open(
    <View style={{ gap: 12, paddingBottom: 8 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Avatar initials={item.author.initials} size={48} />
        <View><Text style={s.sheetName}>{item.author.name}</Text><Text style={s.role}>{item.author.role}</Text></View>
      </View>
      <PrimaryCTA label="Відкрити профіль" onPress={() => { sheet.close(); const p = PEOPLE.find((x) => x.name === item.author.name); p ? onOpenPerson(p) : onGoTab('network'); }} />
      <SecondaryCTA label="Запит на знайомство" onPress={() => { sheet.close(); requireAuth(() => toast('Запит надіслано', 'success')); }} />
    </View>
  );

  const relOrgs = (item.relatedOrgs || []).map((id) => ORGANIZATIONS.find((o) => o.id === id)).filter(Boolean) as typeof ORGANIZATIONS;
  const relPeople = (item.relatedPeople || []).map((id) => people.find((p) => p.id === id) || findPerson(id)).filter(Boolean) as any[];
  const relOpps = (item.relatedOpportunities || []).map((id) => OPPORTUNITIES.find((o) => o.id === id)).filter(Boolean) as typeof OPPORTUNITIES;
  const relEvents = (item.relatedEvents || []).map((id) => EVENTS.find((e) => e.id === id)).filter(Boolean) as typeof EVENTS;
  const similar = articles.filter((a) => a.category === item.category && a.id !== item.id).slice(0, 3);
  const cs = item.caseStudy;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.header}>
        <TouchableOpacity style={s.hbtn} onPress={onBack}><Ionicons name="arrow-back" size={17} color={colors.ink} /></TouchableOpacity>
        <Text style={s.hType}>{typeLabel(item.type).toUpperCase()}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={s.hbtn} onPress={save}><Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={16} color={saved ? colors.accent : colors.ink} /></TouchableOpacity>
          <TouchableOpacity style={s.hbtn} onPress={share}><Ionicons name="share-social-outline" size={16} color={colors.ink} /></TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: space(10) }}>
        <Photo label={item.photo} uri={item.imageUrl} height={200} round={0}>
          <View style={s.coverBadge}><Text style={s.coverBadgeText}>{`${item.category} · ${typeLabel(item.type)}`.toUpperCase()}</Text></View>
        </Photo>

        <View style={{ paddingHorizontal: space(5), paddingTop: space(4), gap: 10 }}>
          <Text style={s.title}>{item.title}</Text>
          {item.subtitle ? <Text style={s.subtitle}>{item.subtitle}</Text> : null}
          <Pressable style={s.author} onPress={openAuthor}>
            <Avatar initials={item.author.initials} size={34} />
            <View style={{ flex: 1 }}>
              <Text style={s.authorName}>{item.author.name}</Text>
              <Text style={s.metaSmall}>{item.date} · {item.readMin} хв читання</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: space(5), paddingTop: space(4), gap: 14 }}>
          {item.body.map((b, i) => <Block key={i} block={b} />)}

          {item.stats && item.stats.length > 0 && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {item.stats.map((st, i) => (
                <View key={i} style={s.stat}><Text style={s.statV}>{st.value}</Text><Text style={s.statL}>{st.label.toUpperCase()}</Text></View>
              ))}
            </View>
          )}

          {item.facts && item.facts.length > 0 && (
            <View style={s.factsBox}>
              <Text style={s.label}>ОСНОВНІ ФАКТИ</Text>
              {item.facts.map((f, i) => <Text key={i} style={s.factItem}>· {f}</Text>)}
            </View>
          )}

          {item.why ? (
            <View style={s.whyBox}>
              <Text style={s.whyLabel}>ЧОМУ ЦЕ ВАЖЛИВО</Text>
              <Text style={s.whyText}>{item.why}</Text>
            </View>
          ) : null}

          {item.conclusion ? (
            <View style={{ gap: 6 }}>
              <Text style={s.label}>ВИСНОВОК ДЛЯ ІНДУСТРІЇ</Text>
              <Text style={s.body}>{item.conclusion}</Text>
            </View>
          ) : null}

          {item.source ? <Text style={s.source}>Першоджерело: {item.source} ↗</Text> : null}
        </View>

        {/* Case Study */}
        {cs && (
          <View style={{ marginHorizontal: space(5), marginTop: space(4), borderWidth: 1, borderColor: colors.line, borderRadius: radius.card, padding: 16, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <StatusBadge label="Кейс" tone="info" /><Text style={s.csCampaign}>{cs.campaign}</Text>
            </View>
            <View style={s.csGrid}>
              {[['Бренд', cs.brand], ['Організація', cs.org], ['Країна', cs.country], ['Спорт', cs.sport]].map(([k, v]) => (
                <View key={k} style={s.csCell}><Text style={s.csKey}>{k}</Text><Text style={s.csVal}>{v}</Text></View>
              ))}
            </View>
            <CsRow label="Задача" text={cs.task} />
            <CsRow label="Аудиторія" text={cs.audience} />
            <CsRow label="Механіка" text={cs.mechanics} />
            <View style={{ gap: 6 }}><Text style={s.csKey}>КАНАЛИ</Text><View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>{cs.channels.map((c) => <View key={c} style={s.chan}><Text style={s.chanText}>{c}</Text></View>)}</View></View>
            <View style={{ gap: 6 }}><Text style={s.csKey}>РЕЗУЛЬТАТИ</Text>{cs.results.map((r) => <Text key={r} style={s.factItem}>· {r}</Text>)}</View>
            <View style={s.whyBox}><Text style={s.whyLabel}>ГОЛОВНИЙ ВИСНОВОК</Text><Text style={s.whyText}>{cs.takeaway}</Text></View>
            <View style={{ gap: 6 }}><Text style={s.csKey}>ЗАСТОСОВНІСТЬ ДЛЯ УКРАЇНИ</Text><Text style={s.body}>{cs.ukraine}</Text></View>
          </View>
        )}

        {/* Related */}
        {relOrgs.length > 0 && (
          <View style={s.relSection}><SectionHeader title="Повʼязані організації" />{relOrgs.map((o) => <OrganizationCard key={o.id} name={o.name} type={o.type} city={o.city} sports={o.sports} verified={o.verified} onPress={() => onOpenOrg(o)} />)}</View>
        )}
        {relPeople.length > 0 && (
          <View style={s.relSection}><SectionHeader title="Повʼязані люди" />{relPeople.map((p) => <PersonCard key={p.id} name={p.name} role={p.role} initials={p.initials} tags={p.tags} shade={p.shade} verified={p.verified} onPress={() => onOpenPerson(p)} />)}</View>
        )}
        {relOpps.length > 0 && (
          <View style={s.relSection}><SectionHeader title="Повʼязані можливості" />{relOpps.map((o) => <OpportunityCard key={o.id} title={o.title} type={o.type} org={o.org} city={o.city} budget={o.budgetVisibility === 'Публічний' ? o.budget : undefined} deadline={o.deadline} statusLabel={o.status} sport={o.sport} format={o.format} verified={o.verified} onPress={() => onOpenOpportunity(o)} />)}</View>
        )}
        {relEvents.length > 0 && (
          <View style={s.relSection}><SectionHeader title="Повʼязані події" />{relEvents.map((e) => <EventCard key={e.id} title={e.title} date={e.date} time={e.time} city={e.city} format={e.format} type={e.type} organizer={e.organizer} cost={e.cost} seatsLeft={e.seatsLeft} onPress={() => onOpenEvent(e)} />)}</View>
        )}
        {similar.length > 0 && (
          <View style={s.relSection}><SectionHeader title="Схожі матеріали" />{similar.map((a) => (
            <Pressable key={a.id} style={s.simRow} onPress={() => onOpen(a)}>
              <Photo height={54} uri={a.imageUrl} round={radius.md} style={{ width: 54 }} />
              <View style={{ flex: 1, gap: 3 }}><Text style={s.simTitle} numberOfLines={2}>{a.title}</Text><Text style={s.metaSmall}>{a.category} · {typeLabel(a.type)}</Text></View>
            </Pressable>
          ))}</View>
        )}

        {/* Comments */}
        <View style={s.commentsWrap}>
          <View style={s.headRow}><Text style={s.h3b}>Коментарі спільноти</Text><Text style={s.count}>{comments.length}</Text></View>
          {comments.map((c, i) => <CommentItem key={i} c={c} index={i} liked={liked.includes(i)} onToggleLike={() => toggleLike(i)} />)}
        </View>
        <View style={{ marginHorizontal: space(5), marginTop: space(4) }}><CommentComposer onSubmit={addComment} /></View>
      </ScrollView>
    </View>
  );
}

function CsRow({ label, text }: { label: string; text: string }) {
  return <View style={{ gap: 4 }}><Text style={s.csKey}>{label.toUpperCase()}</Text><Text style={s.body}>{text}</Text></View>;
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space(5), paddingTop: space(2), paddingBottom: space(2) },
  hbtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  hType: { fontFamily: fonts.bold, color: colors.dim, fontSize: 11, letterSpacing: 1.2 },
  coverBadge: { position: 'absolute', top: 14, left: space(5), backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  coverBadgeText: { fontFamily: fonts.bold, color: colors.accent, fontSize: 10, letterSpacing: 0.6 },
  title: { fontFamily: fonts.extra, color: colors.ink, fontSize: 24, lineHeight: 29, letterSpacing: -0.5 },
  subtitle: { fontFamily: fonts.med, color: colors.dim, fontSize: 15, lineHeight: 22 },
  author: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12, marginTop: 4 },
  authorName: { fontFamily: fonts.bold, color: colors.ink, fontSize: 13.5 },
  metaSmall: { fontFamily: fonts.semi, color: colors.muted, fontSize: 11.5 },
  role: { fontFamily: fonts.med, color: colors.dim, fontSize: 12.5 },
  h3: { fontFamily: fonts.extra, color: colors.ink, fontSize: 17, letterSpacing: -0.2, marginTop: 4 },
  body: { fontFamily: fonts.med, color: colors.body, fontSize: 14.5, lineHeight: 23 },
  quote: { borderLeftWidth: 3, borderLeftColor: colors.accent, paddingLeft: 14, gap: 4 },
  quoteText: { fontFamily: fonts.bold, color: colors.ink, fontSize: 16, lineHeight: 23 },
  quoteAuthor: { fontFamily: fonts.semi, color: colors.muted, fontSize: 12.5 },
  table: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, overflow: 'hidden' },
  tr: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.line },
  trHead: { borderTopWidth: 0, backgroundColor: colors.soft },
  th: { fontFamily: fonts.bold, color: colors.dim, fontSize: 12, padding: 10 },
  td: { fontFamily: fonts.med, color: colors.body, fontSize: 12.5, padding: 10 },
  stat: { flex: 1, backgroundColor: colors.soft, borderRadius: radius.md, padding: 12 },
  statV: { fontFamily: fonts.extra, color: colors.accent, fontSize: 22 },
  statL: { fontFamily: fonts.bold, color: colors.muted, fontSize: 9, letterSpacing: 0.5, marginTop: 2 },
  label: { fontFamily: fonts.bold, color: colors.muted, fontSize: 11, letterSpacing: 0.8 },
  factsBox: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.xl, padding: 16, gap: 8 },
  factItem: { fontFamily: fonts.med, color: colors.body, fontSize: 13.5, lineHeight: 21 },
  whyBox: { backgroundColor: colors.accentSoft, borderRadius: radius.xl, padding: 16, gap: 6 },
  whyLabel: { fontFamily: fonts.extra, color: colors.accent, fontSize: 12, letterSpacing: 0.8 },
  whyText: { fontFamily: fonts.med, color: colors.ink, fontSize: 14, lineHeight: 22 },
  source: { fontFamily: fonts.semi, color: colors.accent, fontSize: 13 },
  csCampaign: { fontFamily: fonts.bold, color: colors.ink, fontSize: 14 },
  csGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  csCell: { width: '50%', paddingVertical: 6 },
  csKey: { fontFamily: fonts.bold, color: colors.muted, fontSize: 10.5, letterSpacing: 0.6 },
  csVal: { fontFamily: fonts.semi, color: colors.ink, fontSize: 13.5, marginTop: 2 },
  chan: { backgroundColor: colors.chipBg, borderRadius: 6, paddingHorizontal: 9, paddingVertical: 4 },
  chanText: { fontFamily: fonts.semi, color: colors.dim, fontSize: 11 },
  relSection: { marginHorizontal: space(5), marginTop: space(5), gap: 10 },
  simRow: { flexDirection: 'row', gap: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 10 },
  simTitle: { fontFamily: fonts.bold, color: colors.ink, fontSize: 13.5, lineHeight: 18 },
  commentsWrap: { marginHorizontal: space(5), marginTop: space(5), borderTopWidth: 1, borderTopColor: colors.line, paddingTop: space(4), gap: 14 },
  headRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  h3b: { fontFamily: fonts.extra, color: colors.ink, fontSize: 16, letterSpacing: -0.2 },
  count: { fontFamily: fonts.semi, color: colors.muted, fontSize: 12 },
  sheetName: { fontFamily: fonts.extra, color: colors.ink, fontSize: 18, letterSpacing: -0.3 },
});
