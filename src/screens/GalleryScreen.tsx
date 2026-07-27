import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, space, fonts } from '../theme';
import {
  AppHeader, SectionHeader, SearchInput, Button, PrimaryCTA, SecondaryCTA, SaveButton, ShareButton,
  FilterChips, Tag, StatusBadge, VerificationBadge, Avatar, ContentCard, PersonCard, OrganizationCard,
  OpportunityCard, EventCard, EmptyState, ErrorState, OfflineBanner, Skeleton, SkeletonCard, ListFooter,
  FormInput, SelectField, MultiSelectField, DatePicker, FileUpload,
} from '../ui';
import { useSheet, useModal, useToast, useConfirm, useAuth } from '../UIProvider';

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 12, marginBottom: space(7) }}>
      <SectionHeader title={title} />
      {children}
    </View>
  );
}

export default function GalleryScreen({ onBack }: { onBack: () => void }) {
  const sheet = useSheet();
  const modal = useModal();
  const toast = useToast();
  const confirm = useConfirm();
  const { requireAuth, isAuthed, signOut, signIn } = useAuth();

  const [chip, setChip] = useState('Усі');
  const [saved, setSaved] = useState(false);
  const [text, setText] = useState('');
  const [textErr, setTextErr] = useState('');
  const [date, setDate] = useState<Date | undefined>();
  const [files, setFiles] = useState<string[]>([]);
  const [role, setRole] = useState<string>();
  const [tags, setTags] = useState<string[]>(['Спонсорство']);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader title="UI Kit · Дизайн-система" onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: space(5), paddingBottom: space(10) }} showsVerticalScrollIndicator={false}>

        <Block title="Buttons / CTA">
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            <Button label="Primary" variant="primary" />
            <Button label="Secondary" variant="secondary" />
            <Button label="Ghost" variant="ghost" />
            <Button label="Danger" variant="danger" />
            <Button label="Loading" variant="primary" loading />
            <Button label="Icon" variant="secondary" icon="add" size="sm" />
          </View>
          <PrimaryCTA label="Primary CTA (full)" onPress={() => toast('Натиснуто', 'info')} />
          <SecondaryCTA label="Secondary CTA (full)" />
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <SaveButton saved={saved} onPress={() => setSaved((v) => !v)} />
            <ShareButton onPress={() => toast('Поділитися', 'neutral')} />
            <Text style={s.hint}>Save / Share</Text>
          </View>
        </Block>

        <Block title="Search · Filter chips · Tags">
          <SearchInput value={text} onChange={setText} />
          <FilterChips items={['Усі', 'Маркетинг', 'Спонсорство', 'Медіа', 'Комерція']} value={chip} onChange={setChip} />
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Tag label="Спонсорство" /><Tag label="Партнерства" /><Tag label="Медіа" />
          </View>
        </Block>

        <Block title="Badges · Avatar · Verification">
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <StatusBadge label="Відкрито" tone="success" />
            <StatusBadge label="Дедлайн" tone="warning" />
            <StatusBadge label="Закрито" tone="danger" />
            <StatusBadge label="News" tone="info" />
            <StatusBadge label="Чернетка" tone="neutral" />
          </View>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Avatar initials="ОК" shade={0} verified />
            <Avatar initials="АМ" shade={1} />
            <Avatar initials="ІС" shade={2} size={56} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><VerificationBadge /><Text style={s.hint}>Verified</Text></View>
          </View>
        </Block>

        <Block title="Cards">
          <ContentCard category="Маркетинг" kind="News" title="Nike запускає кампанію навколо жіночого футболу" excerpt="Бренд представив кампанію за участю футболісток національних збірних." meta="4 хв · 12 коментарів" saved={saved} onSave={() => setSaved((v) => !v)} onPress={() => toast('Матеріал')} />
          <PersonCard name="Олена Ковальчук" role="Head of Sponsorship · ФК «Динамо»" initials="ОК" tags={['Спонсорство', 'Партнерства']} verified onPress={() => toast('Профіль')} />
          <OrganizationCard name="ФК «Динамо» Київ" type="Клуб" city="Київ" sports={['Футбол']} verified onPress={() => toast('Організація')} />
          <OpportunityCard title="Head of Sponsorship у клуб" type="Вакансія" org="ФК «Динамо»" city="Київ" deadline="15 серпня" statusLabel={{ label: 'Відкрито', tone: 'success' }} onPress={() => toast('Можливість')} />
          <EventCard title="Sport Business Forum Ukraine 2026" date="12 вересня" city="Київ" format="Офлайн" onPress={() => toast('Подія')} />
        </Block>

        <Block title="States">
          <OfflineBanner />
          <View style={s.stateBox}><EmptyState title="Поки порожньо" subtitle="Тут зʼявляться дані." action="Оновити" onAction={() => toast('Оновлено')} /></View>
          <View style={s.stateBox}><ErrorState onRetry={() => toast('Повтор')} /></View>
        </Block>

        <Block title="Skeleton (loading)">
          <SkeletonCard />
          <View style={{ gap: 8, marginTop: 8 }}><Skeleton height={16} width="70%" /><Skeleton height={13} /><Skeleton height={13} width="50%" /></View>
          <ListFooter loading />
          <ListFooter end />
        </Block>

        <Block title="Form controls">
          <FormInput label="Ім'я" value={text} onChange={setText} placeholder="Введіть ім'я" helper="Як вас видно у мережі" />
          <FormInput label="Про себе" value={text} onChange={(v) => { setText(v); setTextErr(v.length < 3 ? 'Замало символів' : ''); }} placeholder="Кілька слів" multiline error={textErr} />
          <SelectField label="Посада" value={role} placeholder="Оберіть посаду" onPress={() => sheet.open(
            <View style={{ gap: 10, paddingBottom: 12 }}>
              <Text style={s.sheetTitle}>Посада</Text>
              {['Head of Sponsorship', 'CMO', 'Commercial Director', 'Sponsorship Manager'].map((r) => (
                <Text key={r} style={s.option} onPress={() => { setRole(r); sheet.close(); }}>{r}</Text>
              ))}
            </View>
          )} />
          <MultiSelectField label="Напрями" values={tags} onPress={() => sheet.open(
            <View style={{ gap: 10, paddingBottom: 12 }}>
              <Text style={s.sheetTitle}>Напрями</Text>
              {['Спонсорство', 'Комерція', 'Маркетинг', 'Медіа', 'iGaming'].map((t) => (
                <Text key={t} style={[s.option, tags.includes(t) && s.optionOn]} onPress={() => setTags((cur) => cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t])}>
                  {tags.includes(t) ? '✓ ' : ''}{t}
                </Text>
              ))}
              <PrimaryCTA label="Готово" onPress={() => sheet.close()} />
            </View>
          )} />
          <View style={{ gap: 6 }}>
            <Text style={s.label}>Дата</Text>
            <DatePicker value={date} onChange={setDate} />
          </View>
          <View style={{ gap: 6 }}>
            <Text style={s.label}>Файли</Text>
            <FileUpload files={files} onAdd={() => setFiles((f) => [...f, `file_${f.length + 1}.pdf`])} onRemove={(x) => setFiles((f) => f.filter((i) => i !== x))} />
          </View>
        </Block>

        <Block title="Overlays · dialogs">
          <View style={{ gap: 10 }}>
            <Button label="Bottom Sheet" variant="secondary" full onPress={() => sheet.open(<View style={{ gap: 10, paddingBottom: 12 }}><Text style={s.sheetTitle}>Bottom sheet</Text><Text style={s.hint}>Контент знизу. Тап по фону — закрити.</Text><PrimaryCTA label="Ок" onPress={() => sheet.close()} /></View>)} />
            <Button label="Modal" variant="secondary" full onPress={() => modal.open(<View style={{ gap: 8 }}><Text style={s.sheetTitle}>Modal</Text><Text style={s.hint}>Центроване вікно.</Text><View style={{ marginTop: 12 }}><PrimaryCTA label="Закрити" onPress={() => modal.close()} /></View></View>)} />
            <Button label="Toast" variant="secondary" full onPress={() => toast('Збережено успішно', 'success')} />
            <Button label="Confirmation dialog" variant="secondary" full onPress={() => confirm({ title: 'Видалити?', message: 'Цю дію не можна скасувати.', confirmLabel: 'Видалити', danger: true, onConfirm: () => toast('Видалено', 'danger') })} />
            <Button label={`Auth gate (зараз: ${isAuthed ? 'увійшли' : 'гість'})`} variant="ghost" full onPress={() => (isAuthed ? signOut() : signIn())} />
            <Button label="Дія, що потребує входу" variant="primary" full onPress={() => requireAuth(() => toast('Дія виконана', 'success'))} />
          </View>
        </Block>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  hint: { fontFamily: fonts.med, color: colors.dim, fontSize: 13 },
  label: { fontFamily: fonts.semi, color: colors.dim, fontSize: 12 },
  stateBox: { borderWidth: 1, borderColor: colors.line, borderRadius: 16 },
  sheetTitle: { fontFamily: fonts.extra, color: colors.ink, fontSize: 18, letterSpacing: -0.3 },
  option: { fontFamily: fonts.semi, color: colors.ink, fontSize: 15, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  optionOn: { color: colors.accent },
});
