import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, fonts } from '../../theme';
import { OrgItem, ORGANIZATIONS, ORG_TYPES, CITIES } from '../../shellData';
import { useAuth } from '../../AuthContext';
import { useSheet, useToast } from '../../UIProvider';
import { OrgStore, CreatedOrg } from '../../orgStore';
import { NetworkActions } from '../../networkStore';
import { AppHeader, OrganizationCard, SectionHeader, StatusBadge, Button, FormInput, FilterChips, PrimaryCTA, EmptyState } from '../../ui';

export default function MyOrganizationsScreen({ onBack, onOpen }: { onBack: () => void; onOpen: (o: OrgItem) => void }) {
  const { user } = useAuth();
  const sheet = useSheet();
  const toast = useToast();
  const [created, setCreated] = useState<CreatedOrg[]>([]);
  const [accessIds, setAccessIds] = useState<string[]>([]);

  const reload = () => { OrgStore.list().then(setCreated); NetworkActions.orgAccessIds().then(setAccessIds); };
  useEffect(() => { reload(); }, []);

  const mine = ORGANIZATIONS.filter((o) => user?.profile?.org && o.name === user.profile.org);
  const accessOrgs = ORGANIZATIONS.filter((o) => accessIds.includes(o.id) && !mine.some((m) => m.id === o.id));

  const openCreate = () => sheet.open(<CreateOrgForm onDone={async (data) => { await OrgStore.create(data); sheet.close(); reload(); toast('Організацію надіслано на модерацію', 'success'); }} onCancel={() => sheet.close()} />);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader title="Мої організації" onBack={onBack} right={<Button label="Створити" size="sm" icon="add" variant="primary" onPress={openCreate} />} />
      <ScrollView contentContainerStyle={{ padding: space(5), gap: 12 }} showsVerticalScrollIndicator={false}>
        {mine.length > 0 && (
          <View style={{ gap: 10 }}>
            <SectionHeader title="Я представник" />
            {mine.map((o) => (
              <View key={o.id}>
                <OrganizationCard name={o.name} type={o.type} city={o.city} sports={o.sports} verified={o.verified} onPress={() => onOpen(o)} />
                <TouchableOpacity style={s.manageBtn} onPress={() => onOpen(o)}><Ionicons name="settings-outline" size={14} color={colors.accent} /><Text style={s.manageText}>Керувати</Text></TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {accessOrgs.length > 0 && (
          <View style={{ gap: 10, marginTop: space(2) }}>
            <SectionHeader title="Запити доступу" />
            {accessOrgs.map((o) => (
              <View key={o.id} style={s.reqRow}>
                <View style={{ flex: 1 }}><Text style={s.reqName}>{o.name}</Text><Text style={s.reqMeta}>{o.type} · {o.city}</Text></View>
                <StatusBadge label="Очікує" tone="warning" />
              </View>
            ))}
          </View>
        )}

        {created.length > 0 && (
          <View style={{ gap: 10, marginTop: space(2) }}>
            <SectionHeader title="На модерації" />
            {created.map((o) => (
              <View key={o.id} style={s.reqRow}>
                <View style={{ flex: 1 }}><Text style={s.reqName}>{o.name}</Text><Text style={s.reqMeta}>{o.type}{o.city ? ` · ${o.city}` : ''}</Text></View>
                <StatusBadge label={o.status} tone="warning" />
              </View>
            ))}
          </View>
        )}

        {mine.length === 0 && accessOrgs.length === 0 && created.length === 0 && (
          <EmptyState icon="business-outline" title="Немає організацій" subtitle="Створіть організацію або запросіть доступ до наявної." action="Створити організацію" onAction={openCreate} />
        )}
      </ScrollView>
    </View>
  );
}

function CreateOrgForm({ onDone, onCancel }: { onDone: (d: { name: string; type: string; city: string; shortDesc?: string }) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [city, setCity] = useState('');
  const [desc, setDesc] = useState('');
  const [err, setErr] = useState<Record<string, string>>({});

  const submit = () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = 'Вкажіть назву';
    if (!type) e.type = 'Оберіть тип';
    setErr(e);
    if (Object.keys(e).length) return;
    onDone({ name: name.trim(), type, city: city || 'Україна', shortDesc: desc.trim() || undefined });
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 12 }}>
      <Text style={s.sheetTitle}>Нова організація</Text>
      <FormInput label="Назва*" value={name} onChange={setName} placeholder="Назва організації" error={err.name} />
      <View style={{ gap: 6 }}>
        <Text style={s.fieldLabel}>Тип*{err.type ? ' — оберіть' : ''}</Text>
        <FilterChips items={ORG_TYPES} value={type} onChange={setType} />
      </View>
      <View style={{ gap: 6 }}>
        <Text style={s.fieldLabel}>Місто</Text>
        <FilterChips items={CITIES} value={city} onChange={setCity} />
      </View>
      <FormInput label="Короткий опис" value={desc} onChange={setDesc} placeholder="Чим займається організація" multiline />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><Button full label="Скасувати" variant="secondary" onPress={onCancel} /></View>
        <View style={{ flex: 1 }}><PrimaryCTA label="На модерацію" onPress={submit} /></View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  manageBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 4 },
  manageText: { fontFamily: fonts.bold, color: colors.accent, fontSize: 12.5 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 14 },
  reqName: { fontFamily: fonts.bold, color: colors.ink, fontSize: 14 },
  reqMeta: { fontFamily: fonts.med, color: colors.dim, fontSize: 12 },
  sheetTitle: { fontFamily: fonts.extra, color: colors.ink, fontSize: 18, letterSpacing: -0.3, marginBottom: 4 },
  fieldLabel: { fontFamily: fonts.semi, color: colors.dim, fontSize: 12 },
});
