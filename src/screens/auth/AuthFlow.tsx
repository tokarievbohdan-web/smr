import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { colors, radius, space, fonts } from '../../theme';
import { FormInput, PrimaryCTA, SecondaryCTA, Button } from '../../ui';
import { useAuth } from '../../AuthContext';
import { useToast } from '../../UIProvider';
import { Ionicons } from '@expo/vector-icons';

export default function AuthFlow({ modal, onClose }: { modal?: boolean; onClose?: () => void }) {
  const { requestCode, verifyCode, continueAsGuest } = useAuth();
  const toast = useToast();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const send = async () => {
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Введіть коректний email'); return; }
    if (!consent) { setError('Потрібна згода з умовами та політикою'); return; }
    setBusy(true);
    const r = await requestCode(email);
    setBusy(false);
    setIsNew(r.isNew); setStep('otp'); setCode(''); setCooldown(30);
    toast(`Демо-код: ${r.devCode}`, 'info');
  };

  const verify = async () => {
    setError('');
    if (code.trim().length !== 6) { setError('Код складається з 6 цифр'); return; }
    setBusy(true);
    const r = await verifyCode(email, code);
    setBusy(false);
    if (!r.ok) { setError(r.error || 'Помилка'); return; }
    onClose?.(); // при успіху App перемкне на onboarding / home / blocked
  };

  const resend = async () => {
    if (cooldown > 0) return;
    const r = await requestCode(email);
    setCooldown(30);
    toast(`Новий код: ${r.devCode}`, 'info');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: space(6), paddingTop: space(8), flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {modal && (
        <TouchableOpacity style={s.close} onPress={onClose} hitSlop={8}><Ionicons name="close" size={22} color={colors.dim} /></TouchableOpacity>
      )}
      <View style={s.logo}><Text style={s.logoText}>SM</Text></View>

      {step === 'email' ? (
        <>
          <Text style={s.title}>Увійти або зареєструватися</Text>
          <Text style={s.sub}>Введіть email — надішлемо одноразовий код для входу.</Text>
          <View style={{ height: space(5) }} />
          <FormInput label="Email" value={email} onChange={(v) => { setEmail(v); setError(''); }} placeholder="you@company.ua" keyboardType="email-address" error={error} />
          <TouchableOpacity style={s.consent} activeOpacity={0.8} onPress={() => setConsent((c) => !c)}>
            <View style={[s.checkbox, consent && s.checkboxOn]}>{consent && <Ionicons name="checkmark" size={13} color="#fff" />}</View>
            <Text style={s.consentText}>Погоджуюся з <Text style={s.linkText}>Умовами</Text> та <Text style={s.linkText}>Політикою конфіденційності</Text></Text>
          </TouchableOpacity>
          <View style={{ height: space(4) }} />
          <PrimaryCTA label="Продовжити" loading={busy} onPress={send} />
          {!modal ? (
            <View style={{ marginTop: 12 }}><SecondaryCTA label="Продовжити як гість" onPress={continueAsGuest} /></View>
          ) : (
            <View style={{ marginTop: 12 }}><SecondaryCTA label="Не зараз" onPress={onClose} /></View>
          )}
        </>
      ) : (
        <>
          <Text style={s.title}>Введіть код</Text>
          <Text style={s.sub}>Надіслали 6-значний код на <Text style={s.emailStrong}>{email.trim().toLowerCase()}</Text>{isNew ? ' — створюємо акаунт' : ''}.</Text>
          <View style={{ height: space(5) }} />
          <TextInput
            value={code}
            onChangeText={(v) => { setCode(v.replace(/[^0-9]/g, '').slice(0, 6)); setError(''); }}
            placeholder="______"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            style={[s.otp, !!error && { borderColor: '#B42318' }]}
            autoFocus
          />
          {error ? <Text style={s.error}>{error}</Text> : null}
          <View style={{ height: space(4) }} />
          <PrimaryCTA label="Підтвердити" loading={busy} onPress={verify} />
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 16 }}>
            <Text style={s.muted}>Не отримали код?</Text>
            <Text style={[s.linkText, cooldown > 0 && { color: colors.muted }]} onPress={resend}>{cooldown > 0 ? `Надіслати ще (${cooldown})` : 'Надіслати ще'}</Text>
          </View>
          <TouchableOpacity style={{ alignSelf: 'center', marginTop: 8 }} onPress={() => setStep('email')}><Text style={s.muted}>Змінити email</Text></TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  close: { position: 'absolute', top: space(4), right: space(5), zIndex: 2, padding: 6 },
  logo: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: space(5) },
  logoText: { fontFamily: fonts.extra, color: '#fff', fontSize: 16, letterSpacing: -0.5 },
  title: { fontFamily: fonts.extra, color: colors.ink, fontSize: 26, lineHeight: 31, letterSpacing: -0.6 },
  sub: { fontFamily: fonts.med, color: colors.dim, fontSize: 14, lineHeight: 21, marginTop: 8 },
  emailStrong: { fontFamily: fonts.bold, color: colors.ink },
  consent: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  consentText: { flex: 1, fontFamily: fonts.med, color: colors.dim, fontSize: 12.5, lineHeight: 18 },
  linkText: { fontFamily: fonts.bold, color: colors.accent },
  otp: { height: 60, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, textAlign: 'center', fontFamily: fonts.extra, fontSize: 28, letterSpacing: 10, color: colors.ink, outlineStyle: 'none' } as any,
  error: { fontFamily: fonts.semi, color: '#B42318', fontSize: 12.5, marginTop: 8, textAlign: 'center' },
  muted: { fontFamily: fonts.med, color: colors.muted, fontSize: 13 },
});
