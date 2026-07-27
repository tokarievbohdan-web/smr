import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, fonts } from '../theme';
import {
  OpportunityItem, BudgetVisibility, OPPORTUNITY_TYPE_LABELS, WORK_FORMATS, BUDGET_VISIBILITY,
  CURRENCIES, GEO_LIST, SPORTS_LIST, DIRECTIONS,
} from '../shellData';
import { useAuth as useAccount } from '../AuthContext';
import { useSheet, useToast } from '../UIProvider';
import { OpportunityStore } from '../opportunityStore';
import { FormInput, SelectField, MultiSelectField, DatePicker, FileUpload, PrimaryCTA, SecondaryCTA, Button } from '../ui';

const TAG_POOL = Array.from(new Set([...DIRECTIONS, 'B2B', 'Титульне', 'Fintech', 'OTT', 'Жіночий спорт', 'Seed']));
const fmtDate = (d: Date) => d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });

export default function CreateOpportunityScreen({ onBack, onCreated }: { onBack: () => void; onCreated: (o: OpportunityItem) => void }) {
  const account = useAccount();
  const sheet = useSheet();
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [type, setType] = useState<string | undefined>();
  const [org, setOrg] = useState(account.user?.profile?.org || '');
  const [sport, setSport] = useState<string | undefined>();
  const [profCat, setProfCat] = useState<string | undefined>();
  const [geo, setGeo] = useState<string | undefined>();
  const [format, setFormat] = useState<string | undefined>();
  const [budgetVis, setBudgetVis] = useState<BudgetVisibility>('За запитом');
  const [budgetFrom, setBudgetFrom] = useState('');
  const [budgetTo, setBudgetTo] = useState('');
  const [currency, setCurrency] = useState('₴');
  const [contact, setContact] = useState('Через застосунок');
  const [link, setLink] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [expires, setExpires] = useState<Date | undefined>();
  const [files, setFiles] = useState<string[]>([]);
  const [showDeadline, setShowDeadline] = useState(false);
  const [showExpires, setShowExpires] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pick = (options: string[], value: string | undefined, onPick: (v: string) => void, titleText: string) => sheet.open(
    <View style={{ gap: 4, paddingBottom: 8 }}>
      <Text style={s.sheetTitle}>{titleText}</Text>
      <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
        {options.map((o) => (
          <TouchableOpacity key={o} style={s.pickRow} activeOpacity={0.8} onPress={() => { onPick(o); sheet.close(); }}>
            <Text style={[s.pickText, o === value && { color: colors.accent, fontFamily: fonts.bold }]}>{o}</Text>
            {o === value && <Ionicons name="checkmark" size={18} color={colors.accent} />}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
  const pickTags = () => sheet.open(<TagPicker pool={TAG_POOL} value={tags} onDone={(v) => { setTags(v); sheet.close(); }} />);

  const validate = () => {
    const e: Record<string, string> = {};
    if (title.trim().length < 6) e.title = 'Вкажіть зрозумілу назву (мін. 6 символів)';
    if (shortDesc.trim().length < 10) e.shortDesc = 'Додайте короткий опис';
    if (!type) e.type = 'Оберіть тип можливості';
    if (!org.trim()) e.org = 'Вкажіть організацію';
    if (budgetVis === 'Публічний' && !budgetFrom.trim() && !budgetTo.trim()) e.budget = 'Вкажіть бюджет або змініть видимість';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const build = (statusKey: 'draft' | 'pending'): OpportunityItem => ({
    id: '', title: title.trim(), type: type!, org: org.trim(), city: geo || 'Україна',
    sport, geography: geo, format, professionalCategory: profCat,
    budgetVisibility: budgetVis,
    budgetFrom: budgetFrom ? Number(budgetFrom.replace(/\D/g, '')) : undefined,
    budgetTo: budgetTo ? Number(budgetTo.replace(/\D/g, '')) : undefined,
    currency,
    budget: budgetVis === 'Публічний' && (budgetFrom || budgetTo) ? `${budgetFrom || ''}${budgetTo ? '–' + budgetTo : '+'} ${currency}` : undefined,
    deadline: deadline ? fmtDate(deadline) : undefined,
    expiresAt: expires ? fmtDate(expires) : undefined,
    publishedAt: 'щойно',
    shortDesc: shortDesc.trim(), fullDesc: fullDesc.trim() || undefined,
    contactMethod: contact, externalLink: link.trim() || undefined,
    tags, applicationsCount: 0, applicants: [],
    status: statusKey === 'draft' ? { label: 'Чернетка', tone: 'neutral' } : { label: 'На модерації', tone: 'warning' },
  });

  const submit = async (statusKey: 'draft' | 'pending') => {
    if (statusKey === 'pending' && !validate()) { toast('Перевірте обовʼязкові поля', 'warning'); return; }
    if (statusKey === 'draft' && title.trim().length < 3) { toast('Додайте назву для чернетки', 'warning'); return; }
    const rec = await OpportunityStore.createOpp(build(statusKey));
    toast(statusKey === 'draft' ? 'Чернетку збережено' : 'Надіслано на модерацію', 'success');
    onCreated(rec);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.header}>
        <TouchableOpacity style={s.hbtn} onPress={onBack}><Ionicons name="close" size={19} color={colors.ink} /></TouchableOpacity>
        <Text style={s.hTitle}>Нова можливість</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space(5), paddingBottom: space(10), gap: 16 }} keyboardShouldPersistTaps="handled">
        <FormInput label="Назва*" value={title} onChange={(v) => setTitle(v)} placeholder="Напр.: Head of Sponsorship у клуб" error={errors.title} />
        <FormInput label="Короткий опис*" value={shortDesc} onChange={setShortDesc} placeholder="Одне-два речення для картки" multiline error={errors.shortDesc} />
        <FormInput label="Повний опис" value={fullDesc} onChange={setFullDesc} placeholder="Деталі, вимоги, умови" multiline />

        <SelectField label="Тип можливості*" value={type} placeholder="Оберіть тип" error={errors.type} onPress={() => pick(OPPORTUNITY_TYPE_LABELS, type, setType, 'Тип можливості')} />
        <FormInput label="Організація*" value={org} onChange={setOrg} placeholder="Назва організації" error={errors.org} />

        <View style={s.row}>
          <View style={{ flex: 1 }}><SelectField label="Вид спорту" value={sport} onPress={() => pick(SPORTS_LIST, sport, setSport, 'Вид спорту')} /></View>
          <View style={{ flex: 1 }}><SelectField label="Напрям" value={profCat} onPress={() => pick(DIRECTIONS, profCat, setProfCat, 'Професійний напрям')} /></View>
        </View>
        <View style={s.row}>
          <View style={{ flex: 1 }}><SelectField label="Географія" value={geo} onPress={() => pick(GEO_LIST, geo, setGeo, 'Географія')} /></View>
          <View style={{ flex: 1 }}><SelectField label="Формат роботи" value={format} onPress={() => pick(WORK_FORMATS, format, setFormat, 'Формат роботи')} /></View>
        </View>

        <SelectField label="Видимість бюджету" value={budgetVis} onPress={() => pick(BUDGET_VISIBILITY, budgetVis, (v) => setBudgetVis(v as BudgetVisibility), 'Видимість бюджету')} />
        {budgetVis === 'Публічний' && (
          <View style={s.row}>
            <View style={{ flex: 1 }}><FormInput label="Бюджет від" value={budgetFrom} onChange={setBudgetFrom} placeholder="0" keyboardType="numeric" error={errors.budget} /></View>
            <View style={{ flex: 1 }}><FormInput label="до" value={budgetTo} onChange={setBudgetTo} placeholder="0" keyboardType="numeric" /></View>
            <View style={{ width: 80 }}><SelectField label="Валюта" value={currency} onPress={() => pick(CURRENCIES, currency, setCurrency, 'Валюта')} /></View>
          </View>
        )}

        <SelectField label="Спосіб звʼязку" value={contact} onPress={() => pick(['Через застосунок', 'Email', 'Телефон', 'Зовнішнє посилання'], contact, setContact, 'Спосіб звʼязку')} />
        <FormInput label="Зовнішнє посилання" value={link} onChange={setLink} placeholder="напр. site.com/vacancy" />
        <MultiSelectField label="Теги" values={tags} placeholder="Додати теги" onPress={pickTags} />

        {/* Дедлайн */}
        <View style={{ gap: 6 }}>
          <SelectField label="Дедлайн подання" value={deadline ? fmtDate(deadline) : undefined} placeholder="Оберіть дату" onPress={() => setShowDeadline((v) => !v)} />
          {showDeadline && <DatePicker value={deadline} onChange={(d) => { setDeadline(d); setShowDeadline(false); }} />}
        </View>
        {/* Дата завершення */}
        <View style={{ gap: 6 }}>
          <SelectField label="Дата завершення публікації" value={expires ? fmtDate(expires) : undefined} placeholder="Оберіть дату" onPress={() => setShowExpires((v) => !v)} />
          {showExpires && <DatePicker value={expires} onChange={(d) => { setExpires(d); setShowExpires(false); }} />}
        </View>

        <View style={{ gap: 6 }}>
          <Text style={s.label}>ВКЛАДЕННЯ</Text>
          <FileUpload files={files} onAdd={() => setFiles((f) => [...f, `Бриф_${f.length + 1}.pdf`])} onRemove={(x) => setFiles((f) => f.filter((i) => i !== x))} />
        </View>

        <View style={{ gap: 10, marginTop: space(2) }}>
          <PrimaryCTA label="Опублікувати на модерацію" icon="cloud-upload-outline" onPress={() => submit('pending')} />
          <SecondaryCTA label="Зберегти чернетку" onPress={() => submit('draft')} />
          <Text style={s.hint}>Публікація проходить модерацію перед показом у стрічці. Поля з * — обовʼязкові.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function TagPicker({ pool, value, onDone }: { pool: string[]; value: string[]; onDone: (v: string[]) => void }) {
  const [sel, setSel] = useState<string[]>(value);
  const toggle = (t: string) => setSel((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));
  return (
    <View style={{ gap: 12, paddingBottom: 8 }}>
      <Text style={s.sheetTitle}>Теги</Text>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {pool.map((t) => {
          const on = sel.includes(t);
          return (
            <TouchableOpacity key={t} onPress={() => toggle(t)} activeOpacity={0.85}>
              <View style={[s.tagChip, on ? { backgroundColor: colors.dark, borderColor: colors.dark } : { borderColor: colors.line }]}>
                <Text style={[s.tagChipText, { color: on ? '#fff' : colors.ink }]}>{t}</Text>
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
  label: { fontFamily: fonts.semi, color: colors.dim, fontSize: 12 },
  hint: { fontFamily: fonts.med, color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  sheetTitle: { fontFamily: fonts.extra, color: colors.ink, fontSize: 18, letterSpacing: -0.3, marginBottom: 4 },
  pickRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line },
  pickText: { fontFamily: fonts.semi, color: colors.ink, fontSize: 14.5 },
  tagChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1 },
  tagChipText: { fontFamily: fonts.semi, fontSize: 12.5 },
});
