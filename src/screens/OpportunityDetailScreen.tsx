import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, Share, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, fonts } from '../theme';
import { Person, PEOPLE } from '../data';
import {
  OpportunityItem, OrgItem, ORGANIZATIONS, Applicant, APPLICATION_STATUSES, OPP_STATUSES,
  appStatus, oppStatus,
} from '../shellData';
import { useAuth as useAccount } from '../AuthContext';
import { useSheet, useToast, useConfirm, useAuth } from '../UIProvider';
import { Avatar, StatusBadge, VerificationBadge, Tag, SectionHeader, PrimaryCTA, SecondaryCTA, Button, FormInput, FileUpload } from '../ui';
import { OpportunityStore } from '../opportunityStore';

export default function OpportunityDetailScreen({
  opp, onBack, saved, onToggleSave, onOpenOrg, onOpenPerson,
}: {
  opp: OpportunityItem;
  onBack: () => void;
  saved: boolean;
  onToggleSave: () => void;
  onOpenOrg: (o: OrgItem) => void;
  onOpenPerson: (p: Person) => void;
}) {
  const account = useAccount();
  const sheet = useSheet();
  const toast = useToast();
  const confirm = useConfirm();
  const { requireAuth } = useAuth();

  const isAuthor = !!account.user && account.user.status === 'active' && account.user.profile?.org === opp.org;
  const orgMatch = ORGANIZATIONS.find((o) => o.name === opp.org);

  const [applied, setApplied] = useState<{ status: string } | null>(null);
  const [stateKey, setStateKey] = useState<string | undefined>(undefined);   // перевизначення статусу автором
  const [appStatuses, setAppStatuses] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    OpportunityStore.myApplications().then((list) => { const m = list.find((a) => a.oppId === opp.id); setApplied(m ? { status: m.status } : null); });
    OpportunityStore.getOppState(opp.id).then(setStateKey);
    OpportunityStore.getAppStatuses(opp.id).then(setAppStatuses);
    OpportunityStore.getNotes(opp.id).then(setNotes);
  }, [opp.id]);

  const effectiveStatus = stateKey ? oppStatus(stateKey) : opp.status;
  const closedOrPaused = stateKey === 'closed' || stateKey === 'paused';

  const share = async () => {
    try { await Share.share({ message: `${opp.title} — ${opp.org} · Sport Market Review` }); }
    catch { toast('Не вдалося поділитися', 'warning'); }
  };
  const save = () => requireAuth(onToggleSave);
  const openLink = (url: string) => Linking.openURL(url.startsWith('http') ? url : `https://${url}`).catch(() => toast('Не вдалося відкрити', 'warning'));

  const budgetText = () => {
    if (opp.budgetVisibility === 'За запитом') return 'Бюджет за запитом';
    if (opp.budgetVisibility === 'Не вказаний') return 'Бюджет не вказаний';
    if (opp.budget) return opp.budget;
    if (opp.budgetFrom || opp.budgetTo) return `${opp.budgetFrom ? opp.budgetFrom.toLocaleString('uk-UA') : ''}${opp.budgetTo ? '–' + opp.budgetTo.toLocaleString('uk-UA') : '+'} ${opp.currency || '₴'}`;
    return 'Бюджет не вказаний';
  };

  // ── Відгук ──
  const doApply = () => requireAuth(() => {
    let message = '', portfolio = '', file = '';
    const submit = async () => {
      if (message.trim().length < 10) { toast('Додайте кілька слів (мін. 10 символів)', 'warning'); return; }
      sheet.close();
      await OpportunityStore.apply(opp.id, opp.title, message.trim(), portfolio.trim() || undefined, file || undefined);
      setApplied({ status: 'new' });
      toast('Відгук надіслано', 'success');
    };
    sheet.open(<ApplyForm title={opp.title} onChangeMsg={(v) => (message = v)} onChangePortfolio={(v) => (portfolio = v)} onFile={(f) => (file = f)} onSubmit={submit} onCancel={() => sheet.close()} />);
  });
  const withdraw = () => confirm({
    title: 'Відкликати відгук?', confirmLabel: 'Відкликати', danger: true,
    onConfirm: async () => { await OpportunityStore.withdraw(opp.id); setApplied({ status: 'withdrawn' }); toast('Відгук відкликано', 'neutral'); },
  });

  // ── Автор ──
  const changeApplicantStatus = (a: Applicant) => {
    sheet.open(
      <View style={{ gap: 4, paddingBottom: 8 }}>
        <Text style={s.sheetTitle}>Статус відгуку</Text>
        <Text style={s.dim}>{a.name}</Text>
        {APPLICATION_STATUSES.map((st) => (
          <TouchableOpacity key={st.key} style={s.pickRow} activeOpacity={0.8} onPress={async () => {
            sheet.close();
            await OpportunityStore.setApplicantStatus(opp.id, a.id, st.key);
            setAppStatuses((p) => ({ ...p, [a.id]: st.key }));
            toast(`Статус: ${st.label}`, 'success');
          }}>
            <StatusBadge label={st.label} tone={st.tone} />
            {(appStatuses[a.id] || a.status) === st.key && <Ionicons name="checkmark" size={18} color={colors.accent} />}
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  const editNote = (a: Applicant) => {
    let note = notes[a.id] || '';
    sheet.open(
      <View style={{ gap: 12, paddingBottom: 8 }}>
        <Text style={s.sheetTitle}>Внутрішня нотатка</Text>
        <Text style={s.dim}>{a.name} · видима лише вам</Text>
        <FormInput value={note} onChange={(v) => (note = v)} placeholder="Напр.: сильний профіль, запланувати дзвінок" multiline />
        <PrimaryCTA label="Зберегти нотатку" onPress={async () => { sheet.close(); await OpportunityStore.setNote(opp.id, a.id, note.trim()); setNotes((p) => ({ ...p, [a.id]: note.trim() })); toast('Нотатку збережено', 'success'); }} />
      </View>
    );
  };
  const openApplicantProfile = (a: Applicant) => { const p = PEOPLE.find((x) => x.name === a.name); if (p) onOpenPerson(p); else toast('Профіль недоступний', 'neutral'); };
  const setOppState = (key: string, label: string) => confirm({
    title: `${label}?`, confirmLabel: label,
    onConfirm: async () => { await OpportunityStore.setOppState(opp.id, key); setStateKey(key); toast(`Можливість: ${oppStatus(key).label}`, 'success'); },
  });

  const applicants = opp.applicants || [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.header}>
        <TouchableOpacity style={s.hbtn} onPress={onBack}><Ionicons name="arrow-back" size={17} color={colors.ink} /></TouchableOpacity>
        <Text style={s.hType}>{opp.type.toUpperCase()}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={s.hbtn} onPress={save}><Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={16} color={saved ? colors.accent : colors.ink} /></TouchableOpacity>
          <TouchableOpacity style={s.hbtn} onPress={share}><Ionicons name="share-social-outline" size={16} color={colors.ink} /></TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space(5), paddingBottom: space(10), gap: 14 }}>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: space(1) }}>
          <StatusBadge label={opp.type} tone="info" />
          <StatusBadge label={effectiveStatus.label} tone={effectiveStatus.tone} />
          {isAuthor && <StatusBadge label="Ви автор" tone="neutral" />}
        </View>

        <Text style={s.title}>{opp.title}</Text>
        <Pressable style={s.orgLine} onPress={() => orgMatch && onOpenOrg(orgMatch)} disabled={!orgMatch}>
          <Ionicons name="business-outline" size={15} color={orgMatch ? colors.accent : colors.dim} />
          <Text style={[s.orgText, { color: orgMatch ? colors.accent : colors.dim }]}>{opp.org}</Text>
          {opp.verified && <VerificationBadge size={14} />}
          {orgMatch && <Ionicons name="chevron-forward" size={14} color={colors.accent} />}
        </Pressable>

        {/* Факти */}
        <View style={s.factGrid}>
          {opp.sport ? <Fact k="Спорт" v={opp.sport} /> : null}
          {opp.geography ? <Fact k="Географія" v={opp.geography} /> : null}
          {opp.format ? <Fact k="Формат" v={opp.format} /> : null}
          {opp.professionalCategory ? <Fact k="Напрям" v={opp.professionalCategory} /> : null}
          <Fact k="Бюджет" v={budgetText()} />
          {opp.deadline ? <Fact k="Дедлайн" v={opp.deadline} /> : null}
          {opp.publishedAt ? <Fact k="Опубліковано" v={opp.publishedAt} /> : null}
          {opp.expiresAt ? <Fact k="Діє до" v={opp.expiresAt} /> : null}
        </View>

        {opp.shortDesc ? <Text style={s.lead}>{opp.shortDesc}</Text> : null}
        {opp.fullDesc ? <Text style={s.body}>{opp.fullDesc}</Text> : null}

        {opp.tags && opp.tags.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>{opp.tags.map((t) => <Tag key={t} label={t} />)}</View>
        )}

        {(opp.contactMethod || opp.externalLink) && (
          <View style={{ gap: 6 }}>
            {opp.contactMethod ? <Text style={s.metaRow}><Ionicons name="chatbubble-ellipses-outline" size={13} color={colors.dim} />  Контакт: {opp.contactMethod}</Text> : null}
            {opp.externalLink ? <Text style={s.link} onPress={() => openLink(opp.externalLink!)}>{opp.externalLink} ↗</Text> : null}
          </View>
        )}

        {typeof opp.applicationsCount === 'number' && (
          <Text style={s.metaRow}><Ionicons name="people-outline" size={13} color={colors.dim} />  Відгуків: {opp.applicationsCount}</Text>
        )}

        {/* ── Дії ── */}
        {isAuthor ? (
          <View style={{ gap: 14, marginTop: space(2) }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {stateKey === 'paused'
                ? <View style={{ flex: 1 }}><SecondaryCTA label="Відновити" icon="play-outline" onPress={() => setOppState('published', 'Відновити')} /></View>
                : <View style={{ flex: 1 }}><SecondaryCTA label="Пауза" icon="pause-outline" onPress={() => setOppState('paused', 'Призупинити')} /></View>}
              <View style={{ flex: 1 }}><Button full label="Закрити" variant="danger" icon="lock-closed-outline" disabled={stateKey === 'closed'} onPress={() => setOppState('closed', 'Закрити можливість')} /></View>
            </View>

            <SectionHeader title={`Відгуки · ${applicants.length}`} />
            {applicants.length ? applicants.map((a) => {
              const stKey = appStatuses[a.id] || a.status;
              const st = appStatus(stKey);
              return (
                <View key={a.id} style={s.appCard}>
                  <Pressable style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }} onPress={() => openApplicantProfile(a)}>
                    <Avatar initials={a.initials} size={40} shade={a.shade || 0} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.appName}>{a.name}</Text>
                      <Text style={s.dim}>{a.role}</Text>
                    </View>
                    <StatusBadge label={st.label} tone={st.tone} />
                  </Pressable>
                  <Text style={s.appMsg}>«{a.message}»</Text>
                  {a.portfolio ? <Text style={s.link} onPress={() => openLink(a.portfolio!)}>{a.portfolio} ↗</Text> : null}
                  {notes[a.id] ? <View style={s.noteBox}><Text style={s.noteLabel}>НОТАТКА</Text><Text style={s.noteText}>{notes[a.id]}</Text></View> : null}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1 }}><Button full label="Статус" size="sm" variant="secondary" icon="flag-outline" onPress={() => changeApplicantStatus(a)} /></View>
                    <View style={{ flex: 1 }}><Button full label="Нотатка" size="sm" variant="secondary" icon="create-outline" onPress={() => editNote(a)} /></View>
                  </View>
                </View>
              );
            }) : <Text style={s.dim}>Відгуків поки немає.</Text>}
          </View>
        ) : (
          <View style={{ marginTop: space(2) }}>
            {closedOrPaused ? (
              <Button full label={effectiveStatus.label} variant="secondary" disabled />
            ) : applied ? (
              applied.status === 'withdrawn' ? (
                <PrimaryCTA label="Відгукнутися знову" icon="refresh" onPress={doApply} />
              ) : (
                <View style={{ gap: 10 }}>
                  <View style={s.appliedBox}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                    <Text style={s.appliedText}>Ви відгукнулися · {appStatus(applied.status).label}</Text>
                  </View>
                  <SecondaryCTA label="Відкликати відгук" onPress={withdraw} />
                </View>
              )
            ) : (
              <PrimaryCTA label="Відгукнутися" icon="paper-plane-outline" onPress={doApply} />
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ApplyForm({ title, onChangeMsg, onChangePortfolio, onFile, onSubmit, onCancel }: {
  title: string; onChangeMsg: (v: string) => void; onChangePortfolio: (v: string) => void; onFile: (f: string) => void; onSubmit: () => void; onCancel: () => void;
}) {
  const [message, setMessage] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 12 }}>
      <Text style={s.sheetTitle}>Відгук на «{title}»</Text>
      <FormInput label="Супровідне повідомлення" value={message} onChange={(v) => { setMessage(v); onChangeMsg(v); }} placeholder="Коротко про ваш досвід і мотивацію" multiline />
      <FormInput label="Посилання на портфоліо (необовʼязково)" value={portfolio} onChange={(v) => { setPortfolio(v); onChangePortfolio(v); }} placeholder="linkedin.com/in/…" />
      <FileUpload files={files} onAdd={() => { const f = `CV_${files.length + 1}.pdf`; setFiles((x) => [...x, f]); onFile(f); }} onRemove={(x) => setFiles((f) => f.filter((i) => i !== x))} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><SecondaryCTA label="Скасувати" onPress={onCancel} /></View>
        <View style={{ flex: 1 }}><PrimaryCTA label="Надіслати" onPress={onSubmit} /></View>
      </View>
    </ScrollView>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return <View style={s.fact}><Text style={s.factK}>{k.toUpperCase()}</Text><Text style={s.factV}>{v}</Text></View>;
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space(5), paddingTop: space(2), paddingBottom: space(2) },
  hbtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  hType: { fontFamily: fonts.bold, color: colors.dim, fontSize: 11, letterSpacing: 1.2 },
  title: { fontFamily: fonts.extra, color: colors.ink, fontSize: 22, lineHeight: 27, letterSpacing: -0.4 },
  orgLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orgText: { fontFamily: fonts.bold, fontSize: 13.5 },
  factGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fact: { flexGrow: 1, minWidth: '30%', backgroundColor: colors.soft, borderRadius: radius.md, padding: 12 },
  factK: { fontFamily: fonts.bold, color: colors.muted, fontSize: 9.5, letterSpacing: 0.5 },
  factV: { fontFamily: fonts.bold, color: colors.ink, fontSize: 13, marginTop: 3 },
  lead: { fontFamily: fonts.semi, color: colors.body, fontSize: 15, lineHeight: 22 },
  body: { fontFamily: fonts.med, color: colors.body, fontSize: 14.5, lineHeight: 23 },
  metaRow: { fontFamily: fonts.semi, color: colors.dim, fontSize: 13 },
  link: { fontFamily: fonts.semi, color: colors.accent, fontSize: 13 },
  dim: { fontFamily: fonts.med, color: colors.dim, fontSize: 12.5 },
  sheetTitle: { fontFamily: fonts.extra, color: colors.ink, fontSize: 18, letterSpacing: -0.3 },
  pickRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  appliedBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.accentSoft, borderRadius: radius.lg, padding: 14 },
  appliedText: { fontFamily: fonts.bold, color: colors.accent, fontSize: 13.5 },
  appCard: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.xl, padding: 14, gap: 10 },
  appName: { fontFamily: fonts.bold, color: colors.ink, fontSize: 14 },
  appMsg: { fontFamily: fonts.med, color: colors.body, fontSize: 13.5, lineHeight: 20 },
  noteBox: { backgroundColor: colors.soft, borderRadius: radius.md, padding: 10, gap: 3 },
  noteLabel: { fontFamily: fonts.bold, color: colors.muted, fontSize: 9.5, letterSpacing: 0.5 },
  noteText: { fontFamily: fonts.med, color: colors.body, fontSize: 13, lineHeight: 19 },
});
