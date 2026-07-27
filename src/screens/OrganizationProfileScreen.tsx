import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, Share, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, fonts } from '../theme';
import { Article, Person, ContactLink, ContactType, PEOPLE, findArticle } from '../data';
import { OrgItem, OpportunityItem, EventItem, OPPORTUNITIES, EVENTS } from '../shellData';
import { useContent } from '../ContentContext';
import { useSheet, useToast, useConfirm, useAuth } from '../UIProvider';
import {
  Photo, VerificationBadge, Tag, StatusBadge, SectionHeader, PersonCard, OpportunityCard, EventCard,
  PrimaryCTA, SecondaryCTA, Button,
} from '../ui';
import { NetworkActions, IntroTarget } from '../networkStore';

const REPORT_REASONS = ['Недостовірна інформація', 'Дублікат організації', 'Спам або реклама', 'Порушення правил', 'Інше'];

const CONTACT_ICON: Record<ContactType, any> = {
  email: 'mail-outline', phone: 'call-outline', website: 'globe-outline', linkedin: 'logo-linkedin',
  telegram: 'paper-plane-outline', instagram: 'logo-instagram', facebook: 'logo-facebook', youtube: 'logo-youtube',
};
const contactUrl = (c: ContactLink) => {
  if (c.type === 'email') return `mailto:${c.value}`;
  if (c.type === 'phone') return `tel:${c.value}`;
  return c.value.startsWith('http') ? c.value : `https://${c.value}`;
};

export default function OrganizationProfileScreen({
  org, onBack, saved, onToggleSave, onOpenArticle, onOpenPerson, onGoTab, onOpenOpportunity, onOpenEvent, onOpenIntro,
}: {
  org: OrgItem;
  onBack: () => void;
  saved: boolean;
  onToggleSave: () => void;
  onOpenArticle: (a: Article) => void;
  onOpenPerson: (p: Person) => void;
  onGoTab: (t: 'opportunities' | 'events') => void;
  onOpenOpportunity: (o: OpportunityItem) => void;
  onOpenEvent: (e: EventItem) => void;
  onOpenIntro: (t: IntroTarget) => void;
}) {
  const { articles } = useContent();
  const sheet = useSheet();
  const toast = useToast();
  const confirm = useConfirm();
  const { requireAuth } = useAuth();
  const [introSent, setIntroSent] = useState(false);
  const [accessSent, setAccessSent] = useState(false);

  useEffect(() => {
    NetworkActions.introTargetIds().then((ids) => setIntroSent(ids.includes(org.id)));
    NetworkActions.orgAccessIds().then((ids) => setAccessSent(ids.includes(org.id)));
  }, [org.id]);

  const related = (org.relatedArticles || []).map((id) => articles.find((a) => a.id === id) || findArticle(id)).filter(Boolean) as Article[];
  const opps = (org.activeOpportunities || []).map((id) => OPPORTUNITIES.find((o) => o.id === id)).filter(Boolean) as typeof OPPORTUNITIES;
  const events = (org.events || []).map((id) => EVENTS.find((e) => e.id === id)).filter(Boolean) as typeof EVENTS;

  const save = () => requireAuth(onToggleSave);
  const share = async () => {
    try { await Share.share({ message: `${org.name} — ${org.type} · Sport Market Review` }); }
    catch { toast('Не вдалося поділитися', 'warning'); }
  };
  const openLink = (c: ContactLink) => Linking.openURL(contactUrl(c)).catch(() => toast('Не вдалося відкрити', 'warning'));

  const openContacts = () => {
    const list = [...(org.contacts || []), ...(org.socials || [])];
    sheet.open(
      <View style={{ gap: 10, paddingBottom: 8 }}>
        <Text style={s.sheetTitle}>Контакти та соцмережі</Text>
        {org.website ? (
          <TouchableOpacity style={s.contactRow} activeOpacity={0.8} onPress={() => { sheet.close(); openLink({ type: 'website', label: 'Сайт', value: org.website! }); }}>
            <View style={s.contactIcon}><Ionicons name="globe-outline" size={17} color={colors.accent} /></View>
            <View style={{ flex: 1 }}><Text style={s.contactLabel}>Сайт</Text><Text style={s.contactValue}>{org.website}</Text></View>
            <Ionicons name="open-outline" size={16} color={colors.muted} />
          </TouchableOpacity>
        ) : null}
        {list.map((c) => (
          <TouchableOpacity key={c.value} style={s.contactRow} activeOpacity={0.8} onPress={() => { sheet.close(); openLink(c); }}>
            <View style={s.contactIcon}><Ionicons name={CONTACT_ICON[c.type]} size={17} color={colors.accent} /></View>
            <View style={{ flex: 1 }}><Text style={s.contactLabel}>{c.label}</Text><Text style={s.contactValue}>{c.value}</Text></View>
            <Ionicons name="open-outline" size={16} color={colors.muted} />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const doIntro = () => requireAuth(() => onOpenIntro({ targetType: 'organization', targetId: org.id, targetName: org.name, targetRole: org.type }));

  const doOrgAccess = () => requireAuth(() => {
    confirm({
      title: 'Запит на управління', message: `Ви подаєте запит на доступ до управління сторінкою «${org.name}». Модерація перевірить звʼязок з організацією.`, confirmLabel: 'Подати запит',
      onConfirm: async () => { await NetworkActions.requestOrgAccess(org.id, org.name); setAccessSent(true); toast('Запит на управління надіслано', 'success'); },
    });
  });

  const doReport = () => requireAuth(() => {
    sheet.open(
      <View style={{ gap: 8, paddingBottom: 8 }}>
        <Text style={s.sheetTitle}>Поскаржитися на організацію</Text>
        {REPORT_REASONS.map((r) => (
          <TouchableOpacity key={r} style={s.reasonRow} activeOpacity={0.8} onPress={() => {
            sheet.close();
            confirm({
              title: 'Надіслати скаргу?', message: `Причина: ${r}`, confirmLabel: 'Надіслати', danger: true,
              onConfirm: async () => { await NetworkActions.report(org.id, org.name, r); toast('Скаргу надіслано на модерацію', 'success'); },
            });
          }}>
            <Text style={s.reasonText}>{r}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </TouchableOpacity>
        ))}
      </View>
    );
  });

  const openTeamMember = (name: string) => {
    const p = PEOPLE.find((x) => x.name === name);
    if (p) onOpenPerson(p); else toast('Профіль недоступний', 'neutral');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.header}>
        <TouchableOpacity style={s.hbtn} onPress={onBack}><Ionicons name="arrow-back" size={17} color={colors.ink} /></TouchableOpacity>
        <Text style={s.hType}>ОРГАНІЗАЦІЯ</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={s.hbtn} onPress={save}><Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={16} color={saved ? colors.accent : colors.ink} /></TouchableOpacity>
          <TouchableOpacity style={s.hbtn} onPress={share}><Ionicons name="share-social-outline" size={16} color={colors.ink} /></TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: space(10) }}>
        <Photo label={org.cover || 'обкладинка організації'} uri={org.cover} height={130} round={0} />
        <View style={{ paddingHorizontal: space(5), gap: 16 }}>
          <View style={{ flexDirection: 'row', gap: 14, marginTop: -28 }}>
            <View style={s.logo}><Ionicons name="business" size={30} color={colors.dim} /></View>
            <View style={{ flex: 1, paddingTop: 32 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={s.name}>{org.name}</Text>
                {org.verified && <VerificationBadge size={17} />}
              </View>
              <Text style={s.meta}>{[org.type, org.city, org.country].filter(Boolean).join(' · ')}</Text>
            </View>
          </View>

          {org.shortDesc ? <Text style={s.short}>{org.shortDesc}</Text> : null}

          {/* CTA */}
          <View style={{ gap: 10 }}>
            <PrimaryCTA label={introSent ? 'Запит надіслано' : 'Запит на партнерство'} icon={introSent ? 'checkmark' : 'briefcase-outline'} disabled={introSent} onPress={doIntro} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}><SecondaryCTA label="Контакти" icon="call-outline" onPress={openContacts} /></View>
              {org.website ? <View style={{ flex: 1 }}><SecondaryCTA label="Сайт" icon="globe-outline" onPress={() => openLink({ type: 'website', label: 'Сайт', value: org.website! })} /></View> : null}
            </View>
          </View>

          {/* Факти */}
          <View style={s.factGrid}>
            {org.founded ? <Fact k="Заснована" v={org.founded} /> : null}
            {org.region ? <Fact k="Область" v={org.region} /> : null}
            {org.audience ? <Fact k="Аудиторія" v={org.audience} /> : null}
          </View>

          {org.fullDesc ? (
            <View style={{ gap: 6 }}><Text style={s.label}>ПРО ОРГАНІЗАЦІЮ</Text><Text style={s.body}>{org.fullDesc}</Text></View>
          ) : null}

          <TagSection title="Види спорту" items={org.sports} />
          <TagSection title="Напрями" items={org.directions} />
          <TagSection title="Послуги" items={org.services} />
          <TagSection title="Партнери" items={org.partners} />
        </View>

        {/* Команда */}
        {org.team && org.team.length > 0 && (
          <View style={s.section}>
            <SectionHeader title="Команда" />
            {org.team.map((m) => (
              <PersonCard key={m.name} name={m.name} role={m.role} initials={m.initials} onPress={() => openTeamMember(m.name)} />
            ))}
          </View>
        )}

        {/* Портфоліо */}
        {org.portfolio && org.portfolio.length > 0 && (
          <View style={s.section}>
            <SectionHeader title="Портфоліо" />
            {org.portfolio.map((p, i) => (
              <View key={i} style={s.projCard}><Text style={s.projTitle}>{p.title}</Text><Text style={s.projDesc}>{p.desc}</Text></View>
            ))}
          </View>
        )}

        {/* Активні можливості */}
        {opps.length > 0 && (
          <View style={s.section}>
            <SectionHeader title="Активні можливості" />
            {opps.map((o) => <OpportunityCard key={o.id} title={o.title} type={o.type} org={o.org} city={o.city} budget={o.budgetVisibility === 'Публічний' ? o.budget : undefined} deadline={o.deadline} statusLabel={o.status} sport={o.sport} format={o.format} verified={o.verified} onPress={() => onOpenOpportunity(o)} />)}
          </View>
        )}

        {/* Події */}
        {events.length > 0 && (
          <View style={s.section}>
            <SectionHeader title="Події" />
            {events.map((e) => <EventCard key={e.id} title={e.title} date={e.date} time={e.time} city={e.city} format={e.format} type={e.type} organizer={e.organizer} cost={e.cost} seatsLeft={e.seatsLeft} onPress={() => onOpenEvent(e)} />)}
          </View>
        )}

        {/* Публікації */}
        {related.length > 0 && (
          <View style={s.section}>
            <SectionHeader title="Згадки та публікації" />
            {related.map((a) => (
              <Pressable key={a.id} style={s.simRow} onPress={() => onOpenArticle(a)}>
                <View style={{ flex: 1, gap: 3 }}><Text style={s.simTitle} numberOfLines={2}>{a.title}</Text><Text style={s.projDesc}>{a.category} · {a.date}</Text></View>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        )}

        <View style={{ paddingHorizontal: space(5), marginTop: space(5), gap: 8 }}>
          <SecondaryCTA label={accessSent ? 'Запит на управління надіслано' : 'Запит на управління сторінкою'} icon={accessSent ? 'checkmark' : 'shield-checkmark-outline'} disabled={accessSent} onPress={doOrgAccess} />
          <Button label="Поскаржитися" variant="ghost" size="sm" icon="flag-outline" onPress={doReport} />
        </View>
      </ScrollView>
    </View>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return <View style={s.fact}><Text style={s.factK}>{k.toUpperCase()}</Text><Text style={s.factV}>{v}</Text></View>;
}
function TagSection({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.label}>{title.toUpperCase()}</Text>
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>{items.map((t) => <Tag key={t} label={t} />)}</View>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space(5), paddingTop: space(2), paddingBottom: space(2) },
  hbtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  hType: { fontFamily: fonts.bold, color: colors.dim, fontSize: 11, letterSpacing: 1.2 },
  logo: { width: 72, height: 72, borderRadius: radius.xl, backgroundColor: colors.chipBg, borderWidth: 3, borderColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.extra, color: colors.ink, fontSize: 19, letterSpacing: -0.4 },
  meta: { fontFamily: fonts.med, color: colors.dim, fontSize: 12.5, marginTop: 2 },
  short: { fontFamily: fonts.semi, color: colors.body, fontSize: 14.5, lineHeight: 21 },
  factGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fact: { flexGrow: 1, minWidth: '30%', backgroundColor: colors.soft, borderRadius: radius.md, padding: 12 },
  factK: { fontFamily: fonts.bold, color: colors.muted, fontSize: 9.5, letterSpacing: 0.5 },
  factV: { fontFamily: fonts.bold, color: colors.ink, fontSize: 13, marginTop: 3 },
  label: { fontFamily: fonts.bold, color: colors.muted, fontSize: 11, letterSpacing: 0.8 },
  body: { fontFamily: fonts.med, color: colors.body, fontSize: 14.5, lineHeight: 23 },
  section: { marginHorizontal: space(5), marginTop: space(5), gap: 10 },
  projCard: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 14, gap: 4 },
  projTitle: { fontFamily: fonts.bold, color: colors.ink, fontSize: 14 },
  projDesc: { fontFamily: fonts.med, color: colors.muted, fontSize: 12.5, lineHeight: 19 },
  simRow: { flexDirection: 'row', gap: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 12 },
  simTitle: { fontFamily: fonts.bold, color: colors.ink, fontSize: 13.5, lineHeight: 18 },
  sheetTitle: { fontFamily: fonts.extra, color: colors.ink, fontSize: 18, letterSpacing: -0.3 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 12 },
  contactIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  contactLabel: { fontFamily: fonts.bold, color: colors.ink, fontSize: 13 },
  contactValue: { fontFamily: fonts.med, color: colors.dim, fontSize: 12.5 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line },
  reasonText: { fontFamily: fonts.semi, color: colors.ink, fontSize: 14 },
});
