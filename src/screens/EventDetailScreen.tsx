import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, Share, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, fonts } from '../theme';
import { Article, Person, PEOPLE, findArticle } from '../data';
import { EventItem, OrgItem, ORGANIZATIONS, regStatus } from '../shellData';
import { useContent } from '../ContentContext';
import { useToast, useConfirm, useAuth } from '../UIProvider';
import { Photo, Avatar, StatusBadge, VerificationBadge, Tag, SectionHeader, PrimaryCTA, SecondaryCTA, Button } from '../ui';
import { EventStore } from '../eventStore';
import { IntroTarget } from '../networkStore';

export default function EventDetailScreen({
  event, onBack, saved, onToggleSave, onOpenOrg, onOpenPerson, onOpenArticle, onOpenIntro,
}: {
  event: EventItem;
  onBack: () => void;
  saved: boolean;
  onToggleSave: () => void;
  onOpenOrg: (o: OrgItem) => void;
  onOpenPerson: (p: Person) => void;
  onOpenArticle: (a: Article) => void;
  onOpenIntro: (t: IntroTarget) => void;
}) {
  const { articles } = useContent();
  const toast = useToast();
  const confirm = useConfirm();
  const { requireAuth } = useAuth();

  const [regKey, setRegKey] = useState<string | null>(null);
  const [seatsLeft, setSeatsLeft] = useState<number | undefined>(event.seatsLeft);

  useEffect(() => { EventStore.getRegistration(event.id).then((r) => setRegKey(r && (r.status === 'cancelled' ? null : r.status) || null)); }, [event.id]);

  const orgMatch = ORGANIZATIONS.find((o) => o.id === event.org || o.name === event.organizer);
  const related = (event.relatedArticles || []).map((id) => articles.find((a) => a.id === id) || findArticle(id)).filter(Boolean) as Article[];
  const full = typeof seatsLeft === 'number' && seatsLeft <= 0;

  const share = async () => {
    try { await Share.share({ message: `${event.title} — ${event.date} · Sport Market Review` }); }
    catch { toast('Не вдалося поділитися', 'warning'); }
  };
  const save = () => requireAuth(onToggleSave);
  const openLink = (url: string) => Linking.openURL(url.startsWith('http') ? url : `https://${url}`).catch(() => toast('Не вдалося відкрити', 'warning'));

  const addToCalendar = () => {
    const params = new URLSearchParams({ action: 'TEMPLATE', text: event.title, details: `${event.organizer || ''} · Sport Market Review`, location: event.venue || event.city || '' });
    Linking.openURL(`https://calendar.google.com/calendar/render?${params.toString()}`).catch(() => {});
    toast('Відкрито додавання в календар', 'success');
  };

  const register = () => requireAuth(() => {
    const willWaitlist = full;
    confirm({
      title: willWaitlist ? 'Стати у список очікування?' : 'Підтвердити реєстрацію?',
      message: willWaitlist ? 'Місць немає — ми повідомимо, якщо звільниться.' : `${event.title}\n${event.date}${event.time ? ' · ' + event.time : ''}`,
      confirmLabel: willWaitlist ? 'У список очікування' : 'Зареєструватися',
      onConfirm: async () => {
        const status = willWaitlist ? 'waitlist' : 'registered';
        await EventStore.setRegistration(event.id, event.title, status);
        setRegKey(status);
        if (!willWaitlist && typeof seatsLeft === 'number') setSeatsLeft(Math.max(0, seatsLeft - 1));
        toast(willWaitlist ? 'Додано у список очікування' : 'Реєстрацію підтверджено', 'success');
      },
    });
  });
  const cancel = () => confirm({
    title: 'Скасувати реєстрацію?', confirmLabel: 'Скасувати реєстрацію', danger: true,
    onConfirm: async () => {
      await EventStore.setRegistration(event.id, event.title, 'cancelled');
      if (regKey === 'registered' && typeof seatsLeft === 'number') setSeatsLeft(seatsLeft + 1);
      setRegKey(null);
      toast('Реєстрацію скасовано', 'neutral');
    },
  });

  const openSpeaker = (name: string) => { const p = PEOPLE.find((x) => x.name === name); if (p) onOpenPerson(p); else toast('Профіль недоступний', 'neutral'); };
  const introWithOrganizer = () => requireAuth(() => onOpenIntro({
    targetType: 'organization', targetId: orgMatch?.id || event.id, targetName: orgMatch?.name || event.organizer || 'Організатор', targetRole: 'Організатор події',
    relatedType: 'event', relatedId: event.id, relatedLabel: event.title,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.header}>
        <TouchableOpacity style={s.hbtn} onPress={onBack}><Ionicons name="arrow-back" size={17} color={colors.ink} /></TouchableOpacity>
        <Text style={s.hType}>{(event.type || 'ПОДІЯ').toUpperCase()}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={s.hbtn} onPress={save}><Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={16} color={saved ? colors.accent : colors.ink} /></TouchableOpacity>
          <TouchableOpacity style={s.hbtn} onPress={share}><Ionicons name="share-social-outline" size={16} color={colors.ink} /></TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: space(10) }}>
        <Photo label={event.cover || 'обкладинка події'} uri={event.cover} height={170} round={0}>
          <View style={s.coverBadges}>
            {event.type ? <StatusBadge label={event.type} tone="info" /> : null}
            <StatusBadge label={event.format} tone="neutral" />
            {regKey ? <StatusBadge label={regStatus(regKey).label} tone={regStatus(regKey).tone} /> : null}
          </View>
        </Photo>

        <View style={{ paddingHorizontal: space(5), paddingTop: space(4), gap: 14 }}>
          <Text style={s.title}>{event.title}</Text>
          <Pressable style={s.orgLine} onPress={() => orgMatch && onOpenOrg(orgMatch)} disabled={!orgMatch}>
            <Ionicons name="business-outline" size={15} color={orgMatch ? colors.accent : colors.dim} />
            <Text style={[s.orgText, { color: orgMatch ? colors.accent : colors.dim }]}>{event.organizer || 'Організатор'}</Text>
            {orgMatch?.verified && <VerificationBadge size={14} />}
            {orgMatch && <Ionicons name="chevron-forward" size={14} color={colors.accent} />}
          </Pressable>

          {/* Факти */}
          <View style={s.factGrid}>
            <Fact k="Дата" v={event.date} />
            {event.time ? <Fact k="Час" v={event.time} /> : null}
            {event.timezone ? <Fact k="Часовий пояс" v={event.timezone} /> : null}
            <Fact k="Формат" v={event.format} />
            {event.city ? <Fact k="Місто" v={event.city} /> : null}
            {event.venue ? <Fact k="Місце" v={event.venue} /> : null}
            {event.cost ? <Fact k="Вартість" v={event.cost} /> : null}
            {typeof seatsLeft === 'number' ? <Fact k="Вільні місця" v={seatsLeft > 0 ? String(seatsLeft) : 'немає'} /> : null}
            {event.regDeadline ? <Fact k="Реєстрація до" v={event.regDeadline} /> : null}
          </View>

          {event.shortDesc ? <Text style={s.lead}>{event.shortDesc}</Text> : null}
          {event.fullDesc ? <Text style={s.body}>{event.fullDesc}</Text> : null}

          {event.tags && event.tags.length > 0 && (
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>{event.tags.map((t) => <Tag key={t} label={t} />)}</View>
          )}

          {/* Дії */}
          <View style={{ gap: 10, marginTop: space(1) }}>
            {regKey ? (
              <View style={{ gap: 10 }}>
                <View style={s.regBox}>
                  <Ionicons name={regKey === 'waitlist' ? 'hourglass-outline' : 'checkmark-circle'} size={18} color={colors.accent} />
                  <Text style={s.regText}>{regKey === 'waitlist' ? 'Ви у списку очікування' : 'Вас зареєстровано'}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}><SecondaryCTA label="У календар" icon="calendar-outline" onPress={addToCalendar} /></View>
                  <View style={{ flex: 1 }}><Button full label="Скасувати" variant="secondary" onPress={cancel} /></View>
                </View>
              </View>
            ) : event.isPaid && event.ticketUrl ? (
              <View style={{ gap: 10 }}>
                <PrimaryCTA label={`Купити квиток · ${event.cost || ''}`.trim()} icon="open-outline" onPress={() => openLink(event.ticketUrl!)} />
                <Text style={s.payHint}>Оплата — на зовнішньому білетному сервісі. Застосунок не приймає платежі.</Text>
                <SecondaryCTA label="У календар" icon="calendar-outline" onPress={addToCalendar} />
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                <PrimaryCTA label={full ? 'У список очікування' : 'Зареєструватися'} icon={full ? 'hourglass-outline' : 'checkmark'} onPress={register} />
                <SecondaryCTA label="У календар" icon="calendar-outline" onPress={addToCalendar} />
              </View>
            )}
            <SecondaryCTA label="Знайомство з організатором" icon="person-add-outline" onPress={introWithOrganizer} />
          </View>
        </View>

        {/* Спікери */}
        {event.speakers && event.speakers.length > 0 && (
          <View style={s.section}>
            <SectionHeader title="Спікери" />
            {event.speakers.map((sp) => (
              <Pressable key={sp.name} style={s.speakerRow} onPress={() => openSpeaker(sp.name)}>
                <Avatar initials={sp.initials} size={44} shade={sp.shade || 0} />
                <View style={{ flex: 1 }}><Text style={s.spName}>{sp.name}</Text><Text style={s.dim}>{sp.role}</Text></View>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        )}

        {/* Партнери */}
        {event.partners && event.partners.length > 0 && (
          <View style={s.section}>
            <SectionHeader title="Партнери" />
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>{event.partners.map((p) => <Tag key={p} label={p} />)}</View>
          </View>
        )}

        {/* Повʼязані матеріали */}
        {related.length > 0 && (
          <View style={s.section}>
            <SectionHeader title="Повʼязані матеріали" />
            {related.map((a) => (
              <Pressable key={a.id} style={s.simRow} onPress={() => onOpenArticle(a)}>
                <View style={{ flex: 1, gap: 3 }}><Text style={s.simTitle} numberOfLines={2}>{a.title}</Text><Text style={s.dim}>{a.category} · {a.date}</Text></View>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return <View style={s.fact}><Text style={s.factK}>{k.toUpperCase()}</Text><Text style={s.factV}>{v}</Text></View>;
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space(5), paddingTop: space(2), paddingBottom: space(2) },
  hbtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  hType: { fontFamily: fonts.bold, color: colors.dim, fontSize: 11, letterSpacing: 1.2 },
  coverBadges: { position: 'absolute', top: 12, left: space(5), right: space(5), flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  title: { fontFamily: fonts.extra, color: colors.ink, fontSize: 23, lineHeight: 28, letterSpacing: -0.4 },
  orgLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orgText: { fontFamily: fonts.bold, fontSize: 13.5 },
  factGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fact: { flexGrow: 1, minWidth: '30%', backgroundColor: colors.soft, borderRadius: radius.md, padding: 12 },
  factK: { fontFamily: fonts.bold, color: colors.muted, fontSize: 9.5, letterSpacing: 0.5 },
  factV: { fontFamily: fonts.bold, color: colors.ink, fontSize: 13, marginTop: 3 },
  lead: { fontFamily: fonts.semi, color: colors.body, fontSize: 15, lineHeight: 22 },
  body: { fontFamily: fonts.med, color: colors.body, fontSize: 14.5, lineHeight: 23 },
  regBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.accentSoft, borderRadius: radius.lg, padding: 14 },
  regText: { fontFamily: fonts.bold, color: colors.accent, fontSize: 13.5 },
  payHint: { fontFamily: fonts.med, color: colors.muted, fontSize: 11.5, lineHeight: 17, textAlign: 'center' },
  section: { marginHorizontal: space(5), marginTop: space(5), gap: 10 },
  speakerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.line, borderRadius: radius.xl, padding: 12 },
  spName: { fontFamily: fonts.bold, color: colors.ink, fontSize: 14 },
  dim: { fontFamily: fonts.med, color: colors.dim, fontSize: 12.5 },
  simRow: { flexDirection: 'row', gap: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 12 },
  simTitle: { fontFamily: fonts.bold, color: colors.ink, fontSize: 13.5, lineHeight: 18 },
});
