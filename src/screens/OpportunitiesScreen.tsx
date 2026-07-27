import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, space, fonts } from '../theme';
import { OPPORTUNITIES, OPPORTUNITY_TYPES } from '../shellData';
import { AppHeader, FilterChips, OpportunityCard, Button, EmptyState, PrimaryCTA, SecondaryCTA, StatusBadge, FormInput, FileUpload } from '../ui';
import { useSheet, useToast, useAuth } from '../UIProvider';

export default function OpportunitiesScreen() {
  const [type, setType] = useState('Усі');
  const sheet = useSheet();
  const toast = useToast();
  const { requireAuth } = useAuth();

  const list = OPPORTUNITIES.filter((o) => type === 'Усі' || o.type === type);

  const openDetail = (o: (typeof OPPORTUNITIES)[number]) => {
    sheet.open(
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <StatusBadge label={o.type} tone="info" />
          <StatusBadge label={o.status.label} tone={o.status.tone} />
        </View>
        <Text style={s.title}>{o.title}</Text>
        <Text style={s.role}>{o.org} · {o.city}</Text>
        <Text style={s.body}>Опис можливості зʼявиться тут. Це демонстраційний shell — повна логіка модуля буде на наступному етапі.</Text>
        <PrimaryCTA label="Відгукнутися" onPress={() => { sheet.close(); requireAuth(() => openApply(o.title)); }} />
      </ScrollView>
    );
  };

  const openApply = (title: string) => {
    let msg = '';
    sheet.open(
      <ApplyForm title={title} onSubmit={() => { sheet.close(); toast('Відгук надіслано', 'success'); }} onCancel={() => sheet.close()} />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader title="Можливості" right={<Button label="Створити" size="sm" icon="add" variant="primary" onPress={() => requireAuth(() => toast('Публікація доступна верифікованим', 'warning'))} />} />
      <View style={{ paddingHorizontal: space(5), paddingBottom: space(3) }}>
        <FilterChips items={OPPORTUNITY_TYPES} value={type} onChange={setType} />
      </View>
      <ScrollView contentContainerStyle={{ padding: space(5), paddingTop: 0, gap: 12 }} showsVerticalScrollIndicator={false}>
        {list.length ? list.map((o) => (
          <OpportunityCard key={o.id} title={o.title} type={o.type} org={o.org} city={o.city} budget={o.budget} deadline={o.deadline} statusLabel={o.status} onPress={() => openDetail(o)} />
        )) : <EmptyState icon="briefcase-outline" title="Немає можливостей" subtitle="У цій категорії поки порожньо." />}
      </ScrollView>
    </View>
  );
}

function ApplyForm({ title, onSubmit, onCancel }: { title: string; onSubmit: () => void; onCancel: () => void }) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const [error, setError] = useState('');
  const submit = () => {
    if (message.trim().length < 10) { setError('Додайте кілька слів (мін. 10 символів)'); return; }
    onSubmit();
  };
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 12 }}>
      <Text style={s.title}>Відгук на «{title}»</Text>
      <FormInput label="Супровідне повідомлення" value={message} onChange={(v) => { setMessage(v); setError(''); }} placeholder="Коротко про ваш досвід і мотивацію" multiline error={error} />
      <FileUpload files={files} onAdd={() => setFiles((f) => [...f, `CV_${f.length + 1}.pdf`])} onRemove={(x) => setFiles((f) => f.filter((i) => i !== x))} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><SecondaryCTA label="Скасувати" onPress={onCancel} /></View>
        <View style={{ flex: 1 }}><PrimaryCTA label="Надіслати" onPress={submit} /></View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  title: { fontFamily: fonts.extra, color: colors.ink, fontSize: 18, lineHeight: 23, letterSpacing: -0.3 },
  role: { fontFamily: fonts.med, color: colors.dim, fontSize: 13 },
  body: { fontFamily: fonts.med, color: colors.dim, fontSize: 14, lineHeight: 21 },
});
