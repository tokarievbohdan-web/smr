import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radius, space, fonts } from '../../theme';
import { FormInput, PrimaryCTA, Button, Avatar } from '../../ui';
import { useAuth, Profile } from '../../AuthContext';
import { Ionicons } from '@expo/vector-icons';

const USER_TYPES = ['Фахівець', 'Представник організації', 'Студент', 'Інше'];
const SPORTS = ['Футбол', 'Баскетбол', 'Теніс', 'Кіберспорт', 'Хокей', 'Волейбол', 'Бокс / ММА', 'Легка атлетика'];
const DIRECTIONS = ['Спонсорство', 'Маркетинг', 'Комерція', 'Медіа', 'Управління', 'Права / трансляції', 'Івенти', 'Аналітика'];
const CONTENT = ['Маркетинг', 'Спонсорство', 'Комерція', 'Медіа', 'Управління', 'Інновації', 'iGaming'];
const GOALS = ['Знайти партнерів', 'Знайти роботу', 'Знайти спеціалістів', 'Знайти спонсорські можливості', 'Публікувати можливості', 'Стежити за новинами індустрії', 'Відвідувати події', 'Знайти інвестиції'];

function Chips({ options, values, onToggle }: { options: string[]; values: string[]; onToggle: (v: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((o) => {
        const on = values.includes(o);
        return (
          <TouchableOpacity key={o} activeOpacity={0.85} onPress={() => onToggle(o)}>
            <View style={[s.chip, on ? { backgroundColor: colors.accent, borderColor: colors.accent } : { borderColor: colors.line }]}>
              <Text style={[s.chipText, { color: on ? '#fff' : colors.ink }]}>{o}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function OnboardingFlow() {
  const { user, saveOnboarding } = useAuth();
  const [step, setStep] = useState(Math.min(user?.onboardingStep ?? 0, 3));
  const [userType, setUserType] = useState<string | undefined>(user?.userType);
  const [sports, setSports] = useState<string[]>(user?.sports ?? []);
  const [directions, setDirections] = useState<string[]>(user?.directions ?? []);
  const [content, setContent] = useState<string[]>(user?.contentCategories ?? []);
  const [goals, setGoals] = useState<string[]>(user?.goals ?? []);
  const [p, setP] = useState<Profile>(user?.profile ?? {});
  const [busy, setBusy] = useState(false);

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const advance = async (patch: Partial<Parameters<typeof saveOnboarding>[0]>, done?: boolean) => {
    setBusy(true);
    await saveOnboarding({ ...patch, onboardingStep: done ? 4 : step + 1 });
    setBusy(false);
    if (!done && step < 3) setStep(step + 1);
    // done=true → App перемкне на Home (needsOnboarding стане false)
  };

  const back = () => setStep((st) => Math.max(0, st - 1));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Progress */}
      <View style={s.progressWrap}>
        {step > 0 ? (
          <TouchableOpacity onPress={back} hitSlop={8}><Ionicons name="arrow-back" size={20} color={colors.ink} /></TouchableOpacity>
        ) : <View style={{ width: 20 }} />}
        <View style={s.progressBar}>
          {[0, 1, 2, 3].map((i) => <View key={i} style={[s.progressSeg, i <= step && { backgroundColor: colors.accent }]} />)}
        </View>
        <Text style={s.progressText}>{step + 1}/4</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: space(6), paddingBottom: space(4), flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {step === 0 && (
          <>
            <Text style={s.h}>Хто ви?</Text>
            <Text style={s.sub}>Це допоможе персоналізувати вашу стрічку та мережу.</Text>
            <View style={{ gap: 10, marginTop: space(5) }}>
              {USER_TYPES.map((t) => (
                <TouchableOpacity key={t} activeOpacity={0.85} onPress={() => setUserType(t)}>
                  <View style={[s.typeCard, userType === t && s.typeCardOn]}>
                    <Text style={[s.typeText, userType === t && { color: colors.accent }]}>{t}</Text>
                    <Ionicons name={userType === t ? 'radio-button-on' : 'radio-button-off'} size={20} color={userType === t ? colors.accent : colors.muted} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {step === 1 && (
          <>
            <Text style={s.h}>Ваші інтереси</Text>
            <Text style={s.sub}>Оберіть, що вам близько — можна кілька.</Text>
            <Text style={s.group}>ВИДИ СПОРТУ</Text>
            <Chips options={SPORTS} values={sports} onToggle={(v) => toggle(sports, setSports, v)} />
            <Text style={s.group}>ПРОФЕСІЙНІ НАПРЯМИ</Text>
            <Chips options={DIRECTIONS} values={directions} onToggle={(v) => toggle(directions, setDirections, v)} />
            <Text style={s.group}>КАТЕГОРІЇ КОНТЕНТУ</Text>
            <Chips options={CONTENT} values={content} onToggle={(v) => toggle(content, setContent, v)} />
          </>
        )}

        {step === 2 && (
          <>
            <Text style={s.h}>Ваші цілі</Text>
            <Text style={s.sub}>Що ви хочете отримати від Sport Market Review?</Text>
            <View style={{ marginTop: space(5) }}>
              <Chips options={GOALS} values={goals} onToggle={(v) => toggle(goals, setGoals, v)} />
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <Text style={s.h}>Базовий профіль</Text>
            <Text style={s.sub}>Необовʼязкові поля можна пропустити й заповнити пізніше.</Text>
            <View style={{ alignItems: 'center', marginVertical: space(5) }}>
              <TouchableOpacity activeOpacity={0.8}>
                <Avatar initials={(p.firstName?.[0] || '') + (p.lastName?.[0] || '') || '＋'} size={84} />
                <View style={s.addPhoto}><Ionicons name="camera" size={14} color="#fff" /></View>
              </TouchableOpacity>
            </View>
            <View style={{ gap: 12 }}>
              <FormInput label="Ім'я" value={p.firstName || ''} onChange={(v) => setP({ ...p, firstName: v })} placeholder="Олена" />
              <FormInput label="Прізвище" value={p.lastName || ''} onChange={(v) => setP({ ...p, lastName: v })} placeholder="Ковальчук" />
              <FormInput label="Посада" value={p.position || ''} onChange={(v) => setP({ ...p, position: v })} placeholder="Head of Sponsorship" />
              <FormInput label="Організація" value={p.org || ''} onChange={(v) => setP({ ...p, org: v })} placeholder="ФК «Динамо» Київ" />
              <FormInput label="Місто" value={p.city || ''} onChange={(v) => setP({ ...p, city: v })} placeholder="Київ" />
              <FormInput label="Коротко про себе" value={p.bio || ''} onChange={(v) => setP({ ...p, bio: v })} placeholder="Ваш професійний фокус" multiline />
            </View>
          </>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={s.footer}>
        {step === 0 && <Button label="Продовжити" variant="primary" full loading={busy} onPress={() => userType && advance({ userType })} />}
        {step === 1 && <Button label="Продовжити" variant="primary" full loading={busy} onPress={() => advance({ sports, directions, contentCategories: content })} />}
        {step === 2 && <Button label="Продовжити" variant="primary" full loading={busy} onPress={() => advance({ goals })} />}
        {step === 3 && (
          <>
            <Button label="Завершити" variant="primary" full loading={busy} onPress={() => advance({ profile: p }, true)} />
            <TouchableOpacity style={{ alignSelf: 'center', marginTop: 10 }} onPress={() => advance({ profile: p }, true)}><Text style={s.skip}>Пропустити й перейти до стрічки</Text></TouchableOpacity>
          </>
        )}
        {step === 0 && userType == null && <Text style={s.hintCenter}>Оберіть варіант, щоб продовжити</Text>}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: space(5), paddingTop: space(3), paddingBottom: space(2) },
  progressBar: { flex: 1, flexDirection: 'row', gap: 6 },
  progressSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.chipBg },
  progressText: { fontFamily: fonts.bold, color: colors.dim, fontSize: 12 },
  h: { fontFamily: fonts.extra, color: colors.ink, fontSize: 26, letterSpacing: -0.6 },
  sub: { fontFamily: fonts.med, color: colors.dim, fontSize: 14, lineHeight: 21, marginTop: 8 },
  group: { fontFamily: fonts.bold, color: colors.muted, fontSize: 11, letterSpacing: 0.8, marginTop: space(5), marginBottom: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1 },
  chipText: { fontFamily: fonts.semi, fontSize: 13 },
  typeCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 16 },
  typeCardOn: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  typeText: { fontFamily: fonts.bold, color: colors.ink, fontSize: 15 },
  addPhoto: { position: 'absolute', right: 0, bottom: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.bg },
  footer: { padding: space(5), borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.bg },
  skip: { fontFamily: fonts.semi, color: colors.muted, fontSize: 13 },
  hintCenter: { fontFamily: fonts.med, color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 8 },
});
