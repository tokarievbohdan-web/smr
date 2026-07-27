import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, Share, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, fonts } from '../theme';
import { Article, Person, ContactLink, ContactType, findArticle } from '../data';
import { ORGANIZATIONS, OrgItem } from '../shellData';
import { useContent } from '../ContentContext';
import { useSheet, useToast, useConfirm, useAuth } from '../UIProvider';
import { Avatar, VerificationBadge, Tag, SectionHeader, PrimaryCTA, SecondaryCTA, Button } from '../ui';
import { NetworkActions, IntroTarget } from '../networkStore';

const REPORT_REASONS = ['Спам або реклама', 'Фейковий профіль', 'Некоректна поведінка', 'Порушення правил', 'Інше'];

const CONTACT_ICON: Record<ContactType, any> = {
  email: 'mail-outline', phone: 'call-outline', website: 'globe-outline', linkedin: 'logo-linkedin',
  telegram: 'paper-plane-outline', instagram: 'logo-instagram', facebook: 'logo-facebook', youtube: 'logo-youtube',
};
const contactUrl = (c: ContactLink) => {
  if (c.type === 'email') return `mailto:${c.value}`;
  if (c.type === 'phone') return `tel:${c.value}`;
  return c.value.startsWith('http') ? c.value : `https://${c.value}`;
};

export default function PersonProfileScreen({
  person, onBack, saved, onToggleSave, onOpenArticle, onOpenOrg, onOpenIntro,
}: {
  person: Person;
  onBack: () => void;
  saved: boolean;
  onToggleSave: () => void;
  onOpenArticle: (a: Article) => void;
  onOpenOrg: (o: OrgItem) => void;
  onOpenIntro: (t: IntroTarget) => void;
}) {
  const { articles } = useContent();
  const sheet = useSheet();
  const toast = useToast();
  const confirm = useConfirm();
  const { requireAuth } = useAuth();
  const [introSent, setIntroSent] = useState(false);

  useEffect(() => { NetworkActions.introTargetIds().then((ids) => setIntroSent(ids.includes(person.id))); }, [person.id]);

  const orgMatch = person.org ? ORGANIZATIONS.find((o) => o.name === person.org) : undefined;
  const related = (person.relatedArticles || [])
    .map((id) => articles.find((a) => a.id === id) || findArticle(id))
    .filter(Boolean) as Article[];

  const save = () => requireAuth(onToggleSave);
  const share = async () => {
    try { await Share.share({ message: `${person.name} — ${person.role} · Sport Market Review` }); }
    catch { toast('Не вдалося поділитися', 'warning'); }
  };
  const openLink = (c: ContactLink) => Linking.openURL(contactUrl(c)).catch(() => toast('Не вдалося відкрити', 'warning'));

  const openContacts = () => {
    const list = person.contacts || [];
    sheet.open(
      <View style={{ gap: 10, paddingBottom: 8 }}>
        <Text style={s.sheetTitle}>Контакти</Text>
        {list.length ? list.map((c) => (
          <TouchableOpacity key={c.value} style={s.contactRow} activeOpacity={0.8} onPress={() => { sheet.close(); openLink(c); }}>
            <View style={s.contactIcon}><Ionicons name={CONTACT_ICON[c.type]} size={17} color={colors.accent} /></View>
            <View style={{ flex: 1 }}><Text style={s.contactLabel}>{c.label}</Text><Text style={s.contactValue}>{c.value}</Text></View>
            <Ionicons name="open-outline" size={16} color={colors.muted} />
          </TouchableOpacity>
        )) : <Text style={s.body}>Контакти зʼявляться після знайомства.</Text>}
      </View>
    );
  };

  const doIntro = () => requireAuth(() => onOpenIntro({ targetType: 'person', targetId: person.id, targetName: person.name, targetRole: person.role }));

  const doReport = () => requireAuth(() => {
    sheet.open(
      <View style={{ gap: 8, paddingBottom: 8 }}>
        <Text style={s.sheetTitle}>Поскаржитися на профіль</Text>
        {REPORT_REASONS.map((r) => (
          <TouchableOpacity key={r} style={s.reasonRow} activeOpacity={0.8} onPress={() => {
            sheet.close();
            confirm({
              title: 'Надіслати скаргу?', message: `Причина: ${r}`, confirmLabel: 'Надіслати', danger: true,
              onConfirm: async () => { await NetworkActions.report(person.id, person.name, r); toast('Скаргу надіслано на модерацію', 'success'); },
            });
          }}>
            <Text style={s.reasonText}>{r}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </TouchableOpacity>
        ))}
      </View>
    );
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.header}>
        <TouchableOpacity style={s.hbtn} onPress={onBack}><Ionicons name="arrow-back" size={17} color={colors.ink} /></TouchableOpacity>
        <Text style={s.hType}>ПРОФІЛЬ</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={s.hbtn} onPress={save}><Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={16} color={saved ? colors.accent : colors.ink} /></TouchableOpacity>
          <TouchableOpacity style={s.hbtn} onPress={share}><Ionicons name="share-social-outline" size={16} color={colors.ink} /></TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space(5), paddingBottom: space(10), gap: 16 }}>
        {/* Шапка */}
        <View style={{ alignItems: 'center', gap: 8, paddingTop: space(2) }}>
          <Avatar initials={person.initials} size={80} shade={person.shade} verified={person.verified} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={s.name}>{person.name}</Text>
            {person.verified && <VerificationBadge size={18} />}
          </View>
          {person.headline ? <Text style={s.headline}>{person.headline}</Text> : null}
          <Text style={s.meta}>{[person.position, person.city, person.country].filter(Boolean).join(' · ')}</Text>
          {orgMatch && (
            <Pressable style={s.orgLine} onPress={() => onOpenOrg(orgMatch)}>
              <Ionicons name="business-outline" size={14} color={colors.accent} />
              <Text style={s.orgLineText}>{orgMatch.name}</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.accent} />
            </Pressable>
          )}
        </View>

        {/* Availability */}
        {person.availability && person.availability.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {person.availability.map((a) => {
              const off = a === 'Не розглядаю пропозиції';
              return <View key={a} style={[s.avail, off && { backgroundColor: colors.chipBg }]}><Text style={[s.availText, off && { color: colors.dim }]}>{a}</Text></View>;
            })}
          </View>
        )}

        {/* CTA */}
        <View style={{ gap: 10 }}>
          <PrimaryCTA label={introSent ? 'Запит надіслано' : 'Запит на знайомство'} icon={introSent ? 'checkmark' : 'person-add-outline'} disabled={introSent} onPress={doIntro} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><SecondaryCTA label="Контакти" icon="call-outline" onPress={openContacts} /></View>
            <View style={{ flex: 1 }}><SecondaryCTA label="Поділитися" icon="share-social-outline" onPress={share} /></View>
          </View>
        </View>

        {person.bio ? <Text style={s.body}>{person.bio}</Text> : null}

        <TagSection title="Види спорту" items={person.sports} />
        <TagSection title="Компетенції" items={person.competencies} />
        <TagSection title="Навички" items={person.skills} />

        {/* Досвід */}
        {person.experience && person.experience.length > 0 && (
          <View style={{ gap: 10 }}>
            <SectionHeader title="Досвід" />
            {person.experience.map((e, i) => (
              <View key={i} style={s.expRow}>
                <View style={s.dot} />
                <View style={{ flex: 1 }}>
                  <Text style={s.expRole}>{e.role}</Text>
                  <Text style={s.expOrg}>{e.org}</Text>
                  <Text style={s.expPeriod}>{e.period}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Проєкти */}
        {person.projects && person.projects.length > 0 && (
          <View style={{ gap: 10 }}>
            <SectionHeader title="Проєкти" />
            {person.projects.map((p, i) => (
              <View key={i} style={s.projCard}><Text style={s.projTitle}>{p.title}</Text><Text style={s.projDesc}>{p.desc}</Text></View>
            ))}
          </View>
        )}

        {/* Портфоліо */}
        {person.portfolio && person.portfolio.length > 0 && (
          <View style={{ gap: 8 }}>
            <SectionHeader title="Портфоліо" />
            {person.portfolio.map((l) => (
              <TouchableOpacity key={l.url} style={s.linkRow} activeOpacity={0.8} onPress={() => openLink({ type: 'website', label: l.label, value: l.url })}>
                <Ionicons name="link-outline" size={16} color={colors.accent} />
                <Text style={s.linkText} numberOfLines={1}>{l.label}</Text>
                <Ionicons name="open-outline" size={15} color={colors.muted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {person.languages && person.languages.length > 0 && (
          <View style={{ gap: 6 }}>
            <Text style={s.label}>МОВИ</Text>
            <Text style={s.body}>{person.languages.join(' · ')}</Text>
          </View>
        )}

        {/* Повʼязані матеріали */}
        {related.length > 0 && (
          <View style={{ gap: 10 }}>
            <SectionHeader title="Публікації та проєкти" />
            {related.map((a) => (
              <Pressable key={a.id} style={s.simRow} onPress={() => onOpenArticle(a)}>
                <View style={{ flex: 1, gap: 3 }}><Text style={s.simTitle} numberOfLines={2}>{a.title}</Text><Text style={s.expPeriod}>{a.category} · {a.date}</Text></View>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        )}

        <Button label="Поскаржитися" variant="ghost" size="sm" icon="flag-outline" onPress={doReport} />
      </ScrollView>
    </View>
  );
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
  name: { fontFamily: fonts.extra, color: colors.ink, fontSize: 22, letterSpacing: -0.4, textAlign: 'center' },
  headline: { fontFamily: fonts.semi, color: colors.body, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  meta: { fontFamily: fonts.med, color: colors.dim, fontSize: 12.5, textAlign: 'center' },
  orgLine: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  orgLineText: { fontFamily: fonts.bold, color: colors.accent, fontSize: 13 },
  avail: { backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  availText: { fontFamily: fonts.bold, color: colors.accent, fontSize: 11.5 },
  body: { fontFamily: fonts.med, color: colors.body, fontSize: 14.5, lineHeight: 23 },
  label: { fontFamily: fonts.bold, color: colors.muted, fontSize: 11, letterSpacing: 0.8 },
  expRow: { flexDirection: 'row', gap: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginTop: 6 },
  expRole: { fontFamily: fonts.bold, color: colors.ink, fontSize: 14 },
  expOrg: { fontFamily: fonts.semi, color: colors.dim, fontSize: 13, marginTop: 1 },
  expPeriod: { fontFamily: fonts.med, color: colors.muted, fontSize: 12, marginTop: 1 },
  projCard: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 14, gap: 4 },
  projTitle: { fontFamily: fonts.bold, color: colors.ink, fontSize: 14 },
  projDesc: { fontFamily: fonts.med, color: colors.dim, fontSize: 13, lineHeight: 20 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 12 },
  linkText: { fontFamily: fonts.semi, color: colors.ink, fontSize: 13, flex: 1 },
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
