import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, fonts } from '../../theme';
import { DIRECTIONS, CITIES, AVAILABILITY_STATUSES } from '../../shellData';
import { useAuth } from '../../AuthContext';
import { useSheet, useToast } from '../../UIProvider';
import { FormInput, SelectField, MultiSelectField, PrimaryCTA, SecondaryCTA, Avatar } from '../../ui';

export default function EditProfileScreen({ onBack }: { onBack: () => void }) {
  const { user, updateProfile } = useAuth();
  const sheet = useSheet();
  const toast = useToast();
  const pr = user?.profile;

  const [firstName, setFirstName] = useState(pr?.firstName || '');
  const [lastName, setLastName] = useState(pr?.lastName || '');
  const [position, setPosition] = useState(pr?.position || '');
  const [org, setOrg] = useState(pr?.org || '');
  const [city, setCity] = useState<string | undefined>(pr?.city);
  const [bio, setBio] = useState(pr?.bio || '');
  const [portfolio, setPortfolio] = useState(pr?.portfolio || '');
  const [photo, setPhoto] = useState(!!pr?.photo);
  const [competencies, setCompetencies] = useState<string[]>(user?.directions || []);
  const [availability, setAvailability] = useState<string[]>(user?.availability || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'Я';

  const multiPick = (title: string, pool: string[], values: string[], setter: (v: string[]) => void) => sheet.open(
    <MultiPicker title={title} pool={pool} value={values} onDone={(v) => { setter(v); sheet.close(); }} />
  );
  const pickCity = () => sheet.open(
    <View style={{ gap: 4, paddingBottom: 8 }}>
      <Text style={s.sheetTitle}>Місто</Text>
      <ScrollView style={{ maxHeight: 320 }}>{CITIES.map((c) => (
        <TouchableOpacity key={c} style={s.pickRow} onPress={() => { setCity(c); sheet.close(); }}>
          <Text style={[s.pickText, c === city && { color: colors.accent, fontFamily: fonts.bold }]}>{c}</Text>
          {c === city && <Ionicons name="checkmark" size={18} color={colors.accent} />}
        </TouchableOpacity>
      ))}</ScrollView>
    </View>
  );

  const save = async () => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = 'Вкажіть імʼя';
    if (!lastName.trim()) e.lastName = 'Вкажіть прізвище';
    setErrors(e);
    if (Object.keys(e).length) { toast('Заповніть обовʼязкові поля', 'warning'); return; }
    await updateProfile({
      directions: competencies, availability,
      profile: { firstName: firstName.trim(), lastName: lastName.trim(), position: position.trim(), org: org.trim(), city, bio: bio.trim(), portfolio: portfolio.trim(), photo: photo ? 'set' : undefined },
    });
    toast('Профіль оновлено', 'success');
    onBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.header}>
        <TouchableOpacity style={s.hbtn} onPress={onBack}><Ionicons name="close" size={19} color={colors.ink} /></TouchableOpacity>
        <Text style={s.hTitle}>Редагувати профіль</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space(5), paddingBottom: space(10), gap: 16 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', gap: 10, marginTop: space(2) }}>
          <Avatar initials={initials} size={80} />
          <TouchableOpacity onPress={() => setPhoto((v) => !v)}><Text style={s.photoBtn}>{photo ? 'Прибрати фото' : 'Додати фото'}</Text></TouchableOpacity>
        </View>

        <View style={s.row}>
          <View style={{ flex: 1 }}><FormInput label="Імʼя*" value={firstName} onChange={setFirstName} placeholder="Імʼя" error={errors.firstName} /></View>
          <View style={{ flex: 1 }}><FormInput label="Прізвище*" value={lastName} onChange={setLastName} placeholder="Прізвище" error={errors.lastName} /></View>
        </View>
        <FormInput label="Посада" value={position} onChange={setPosition} placeholder="Напр.: Head of Sponsorship" />
        <FormInput label="Організація" value={org} onChange={setOrg} placeholder="Назва організації" />
        <SelectField label="Місто" value={city} placeholder="Оберіть місто" onPress={pickCity} />
        <FormInput label="Про себе" value={bio} onChange={setBio} placeholder="Короткий опис вашого досвіду" multiline />
        <MultiSelectField label="Компетенції" values={competencies} placeholder="Оберіть напрями" onPress={() => multiPick('Компетенції', DIRECTIONS, competencies, setCompetencies)} />
        <MultiSelectField label="Доступність" values={availability} placeholder="Оберіть статуси" onPress={() => multiPick('Статуси доступності', AVAILABILITY_STATUSES, availability, setAvailability)} />
        <FormInput label="Portfolio / посилання" value={portfolio} onChange={setPortfolio} placeholder="linkedin.com/in/…" />

        <View style={{ gap: 10, marginTop: space(2) }}>
          <PrimaryCTA label="Зберегти" icon="checkmark" onPress={save} />
          <SecondaryCTA label="Скасувати" onPress={onBack} />
        </View>
      </ScrollView>
    </View>
  );
}

function MultiPicker({ title, pool, value, onDone }: { title: string; pool: string[]; value: string[]; onDone: (v: string[]) => void }) {
  const [sel, setSel] = useState<string[]>(value);
  const toggle = (t: string) => setSel((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));
  return (
    <View style={{ gap: 12, paddingBottom: 8 }}>
      <Text style={s.sheetTitle}>{title}</Text>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {pool.map((t) => {
          const on = sel.includes(t);
          return (
            <TouchableOpacity key={t} onPress={() => toggle(t)} activeOpacity={0.85}>
              <View style={[s.chip, on ? { backgroundColor: colors.dark, borderColor: colors.dark } : { borderColor: colors.line }]}>
                <Text style={[s.chipText, { color: on ? '#fff' : colors.ink }]}>{t}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      <PrimaryCTA label={`Готово (${sel.length})`} onPress={() => onDone(sel)} />
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space(5), paddingTop: space(2), paddingBottom: space(3), borderBottomWidth: 1, borderBottomColor: colors.line },
  hbtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  hTitle: { fontFamily: fonts.extra, color: colors.ink, fontSize: 17, letterSpacing: -0.3 },
  row: { flexDirection: 'row', gap: 10 },
  photoBtn: { fontFamily: fonts.bold, color: colors.accent, fontSize: 13 },
  sheetTitle: { fontFamily: fonts.extra, color: colors.ink, fontSize: 18, letterSpacing: -0.3, marginBottom: 4 },
  pickRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line },
  pickText: { fontFamily: fonts.semi, color: colors.ink, fontSize: 14.5 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1 },
  chipText: { fontFamily: fonts.semi, fontSize: 12.5 },
});
