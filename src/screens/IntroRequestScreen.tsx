import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, fonts } from '../theme';
import { INTRO_REASONS } from '../shellData';
import { useSheet, useToast } from '../UIProvider';
import { NetworkActions, IntroTarget } from '../networkStore';
import { Avatar, FormInput, SelectField, PrimaryCTA, SecondaryCTA } from '../ui';

const RELATED_ICON = { article: 'document-text-outline', opportunity: 'briefcase-outline', event: 'calendar-outline' } as const;

export default function IntroRequestScreen({ target, onBack, onCreated }: { target: IntroTarget; onBack: () => void; onCreated: () => void }) {
  const sheet = useSheet();
  const toast = useToast();
  const [reason, setReason] = useState<string | undefined>();
  const [context, setContext] = useState('');
  const [expected, setExpected] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isOrg = target.targetType === 'organization';

  const pickReason = () => sheet.open(
    <View style={{ gap: 4, paddingBottom: 8 }}>
      <Text style={s.sheetTitle}>Причина знайомства</Text>
      {INTRO_REASONS.map((r) => (
        <TouchableOpacity key={r} style={s.pickRow} activeOpacity={0.8} onPress={() => { setReason(r); sheet.close(); }}>
          <Text style={[s.pickText, r === reason && { color: colors.accent, fontFamily: fonts.bold }]}>{r}</Text>
          {r === reason && <Ionicons name="checkmark" size={18} color={colors.accent} />}
        </TouchableOpacity>
      ))}
    </View>
  );

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!reason) e.reason = 'Оберіть причину знайомства';
    if (context.trim().length < 10) e.context = 'Додайте короткий контекст (мін. 10 символів)';
    if (!consent) e.consent = 'Потрібна згода на передачу контактів';
    setErrors(e);
    if (Object.keys(e).length) { toast('Перевірте обовʼязкові поля', 'warning'); return; }
    await NetworkActions.createIntro({
      targetType: target.targetType, targetId: target.targetId, targetName: target.targetName, targetRole: target.targetRole,
      reason: reason!, context: context.trim(), expectedResult: expected.trim() || undefined,
      relatedType: target.relatedType, relatedId: target.relatedId, relatedLabel: target.relatedLabel,
      consent: true,
    });
    toast('Запит на знайомство надіслано', 'success');
    onCreated();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.header}>
        <TouchableOpacity style={s.hbtn} onPress={onBack}><Ionicons name="close" size={19} color={colors.ink} /></TouchableOpacity>
        <Text style={s.hTitle}>Запит на знайомство</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space(5), paddingBottom: space(10), gap: 16 }} keyboardShouldPersistTaps="handled">
        {/* Ціль */}
        <View style={s.targetCard}>
          {isOrg
            ? <View style={s.orgLogo}><Ionicons name="business" size={22} color={colors.dim} /></View>
            : <Avatar initials={target.targetName.split(' ').map((w) => w[0]).join('').slice(0, 2)} size={44} />}
          <View style={{ flex: 1 }}>
            <Text style={s.tName}>{target.targetName}</Text>
            <Text style={s.tRole}>{target.targetRole || (isOrg ? 'Організація' : 'Спеціаліст')}</Text>
          </View>
        </View>

        {target.relatedLabel ? (
          <View style={s.relatedRow}>
            <Ionicons name={RELATED_ICON[target.relatedType || 'article']} size={15} color={colors.accent} />
            <Text style={s.relatedText} numberOfLines={1}>Контекст: {target.relatedLabel}</Text>
          </View>
        ) : null}

        <SelectField label="Причина знайомства*" value={reason} placeholder="Оберіть причину" error={errors.reason} onPress={pickReason} />
        <FormInput label="Короткий контекст*" value={context} onChange={(v) => { setContext(v); setErrors((e) => ({ ...e, context: '' })); }} placeholder="Хто ви і чому хочете познайомитися" multiline error={errors.context} />
        <FormInput label="Очікуваний результат" value={expected} onChange={setExpected} placeholder="Напр.: домовитися про дзвінок / пілот / партнерство" multiline />

        {/* Згода */}
        <TouchableOpacity style={[s.consent, consent && { borderColor: colors.accent, backgroundColor: colors.accentSoft }]} activeOpacity={0.85} onPress={() => { setConsent((v) => !v); setErrors((e) => ({ ...e, consent: '' })); }}>
          <Ionicons name={consent ? 'checkbox' : 'square-outline'} size={20} color={consent ? colors.accent : colors.muted} />
          <Text style={s.consentText}>Погоджуюся на передачу моїх контактів іншій стороні, якщо знайомство буде схвалене.</Text>
        </TouchableOpacity>
        {errors.consent ? <Text style={s.err}>{errors.consent}</Text> : null}

        <View style={{ gap: 10, marginTop: space(1) }}>
          <PrimaryCTA label="Надіслати запит" icon="paper-plane-outline" onPress={submit} />
          <SecondaryCTA label="Скасувати" onPress={onBack} />
          <Text style={s.hint}>Запити обробляє команда Sport Market Review. Ви побачите статус у розділі «Запити на знайомство».</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space(5), paddingTop: space(2), paddingBottom: space(3), borderBottomWidth: 1, borderBottomColor: colors.line },
  hbtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  hTitle: { fontFamily: fonts.extra, color: colors.ink, fontSize: 17, letterSpacing: -0.3 },
  targetCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.line, borderRadius: radius.xl, padding: 14, marginTop: space(2) },
  orgLogo: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.chipBg, alignItems: 'center', justifyContent: 'center' },
  tName: { fontFamily: fonts.bold, color: colors.ink, fontSize: 15 },
  tRole: { fontFamily: fonts.med, color: colors.dim, fontSize: 12.5, marginTop: 2 },
  relatedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.soft, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10 },
  relatedText: { fontFamily: fonts.semi, color: colors.dim, fontSize: 12.5, flex: 1 },
  consent: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 14 },
  consentText: { fontFamily: fonts.med, color: colors.body, fontSize: 13, lineHeight: 19, flex: 1 },
  err: { fontFamily: fonts.semi, color: '#B42318', fontSize: 11.5, marginTop: -8 },
  hint: { fontFamily: fonts.med, color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  sheetTitle: { fontFamily: fonts.extra, color: colors.ink, fontSize: 18, letterSpacing: -0.3, marginBottom: 4 },
  pickRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line },
  pickText: { fontFamily: fonts.semi, color: colors.ink, fontSize: 14.5 },
});
