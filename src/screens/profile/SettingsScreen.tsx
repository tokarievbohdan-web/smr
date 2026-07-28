import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, fonts } from '../../theme';
import { useAuth } from '../../AuthContext';
import { useConfirm, useToast, useSheet } from '../../UIProvider';
import { AppHeader, Button } from '../../ui';

const LANGS = ['Українська', 'English'];

export default function SettingsScreen({ onBack }: { onBack: () => void }) {
  const { user, updateProfile, signOut, deleteAccount } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();
  const sheet = useSheet();
  const st = user?.settings || {};

  const [language, setLanguage] = useState(st.language || 'Українська');
  const [privacyPublic, setPrivacyPublic] = useState(st.privacyPublic ?? true);
  const [contactsPublic, setContactsPublic] = useState(st.contactsPublic ?? false);
  const [emailNotif, setEmailNotif] = useState(st.emailNotifications ?? true);

  const persist = (partial: any) => updateProfile({ settings: { ...st, language, privacyPublic, contactsPublic, emailNotifications: emailNotif, ...partial } });

  const pickLang = () => sheet.open(
    <View style={{ gap: 4, paddingBottom: 8 }}>
      <Text style={s.sheetTitle}>Мова застосунку</Text>
      {LANGS.map((l) => (
        <TouchableOpacity key={l} style={s.pickRow} onPress={() => { setLanguage(l); persist({ language: l }); sheet.close(); toast('Мову збережено', 'success'); }}>
          <Text style={[s.pickText, l === language && { color: colors.accent, fontFamily: fonts.bold }]}>{l}</Text>
          {l === language && <Ionicons name="checkmark" size={18} color={colors.accent} />}
        </TouchableOpacity>
      ))}
    </View>
  );

  const logout = () => confirm({ title: 'Вийти з акаунта?', confirmLabel: 'Вийти', danger: true, onConfirm: () => signOut() });
  const remove = () => confirm({
    title: 'Видалити акаунт?', message: 'Дію не можна скасувати. Профіль і дані буде видалено.', confirmLabel: 'Видалити акаунт', danger: true,
    onConfirm: async () => { await deleteAccount(); },
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader title="Налаштування" onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: space(5), gap: 10 }} showsVerticalScrollIndicator={false}>
        <Text style={s.group}>ЗАГАЛЬНІ</Text>
        <TouchableOpacity style={s.row} onPress={pickLang} activeOpacity={0.8}>
          <Ionicons name="language-outline" size={18} color={colors.dim} />
          <Text style={s.label}>Мова</Text>
          <Text style={s.value}>{language}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.muted} />
        </TouchableOpacity>

        <Text style={s.group}>ПРИВАТНІСТЬ</Text>
        <Toggle icon="eye-outline" label="Публічний профіль" hint="Показувати профіль у Мережі та пошуку" value={privacyPublic} onChange={(v) => { setPrivacyPublic(v); persist({ privacyPublic: v }); }} />
        <Toggle icon="call-outline" label="Публічні контакти" hint="Показувати контакти без запиту на знайомство" value={contactsPublic} onChange={(v) => { setContactsPublic(v); persist({ contactsPublic: v }); }} />

        <Text style={s.group}>СПОВІЩЕННЯ</Text>
        <Toggle icon="mail-outline" label="Email-сповіщення" hint="Статуси заявок, знайомств і подій" value={emailNotif} onChange={(v) => { setEmailNotif(v); persist({ emailNotifications: v }); }} />

        <View style={{ marginTop: space(4), gap: 10 }}>
          <Button label="Вийти" variant="secondary" icon="log-out-outline" onPress={logout} />
          <Button label="Видалити акаунт" variant="danger" icon="trash-outline" onPress={remove} />
        </View>
        <Text style={s.version}>Sport Market Review · MVP</Text>
      </ScrollView>
    </View>
  );
}

function Toggle({ icon, label, hint, value, onChange }: { icon: any; label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <TouchableOpacity style={s.row} activeOpacity={0.8} onPress={() => onChange(!value)}>
      <Ionicons name={icon} size={18} color={colors.dim} />
      <View style={{ flex: 1 }}>
        <Text style={s.label}>{label}</Text>
        <Text style={s.hint}>{hint}</Text>
      </View>
      <View style={[s.switch, value && { backgroundColor: colors.accent, borderColor: colors.accent }]}><View style={[s.knob, value && { alignSelf: 'flex-end' }]} /></View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  group: { fontFamily: fonts.bold, color: colors.muted, fontSize: 11, letterSpacing: 0.8, marginTop: space(3) },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 13 },
  label: { fontFamily: fonts.semi, color: colors.ink, fontSize: 14 },
  value: { fontFamily: fonts.med, color: colors.dim, fontSize: 13, marginLeft: 'auto' },
  hint: { fontFamily: fonts.med, color: colors.muted, fontSize: 11.5, marginTop: 2 },
  switch: { width: 44, height: 26, borderRadius: 13, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.chipBg, padding: 2, justifyContent: 'center' },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  sheetTitle: { fontFamily: fonts.extra, color: colors.ink, fontSize: 18, letterSpacing: -0.3, marginBottom: 4 },
  pickRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line },
  pickText: { fontFamily: fonts.semi, color: colors.ink, fontSize: 14.5 },
  version: { fontFamily: fonts.med, color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: space(5) },
});
