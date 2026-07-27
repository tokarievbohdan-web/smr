import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, fonts } from '../theme';
import { EventItem, EVENT_TYPE_LABELS, EVENT_FORMATS, CITIES } from '../shellData';
import { useAuth as useAccount } from '../AuthContext';
import { useSheet, useToast } from '../UIProvider';
import { EventStore } from '../eventStore';
import { FormInput, SelectField, DatePicker, PrimaryCTA, SecondaryCTA } from '../ui';

const TIMEZONES = ['EET (UTC+2)', 'EEST (UTC+3)', 'CET (UTC+1)', 'UTC'];
const fmtDate = (d: Date) => d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });

export default function CreateEventScreen({ onBack, onCreated }: { onBack: () => void; onCreated: (e: EventItem) => void }) {
  const account = useAccount();
  const sheet = useSheet();
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<string | undefined>();
  const [organizer, setOrganizer] = useState(account.user?.profile?.org || '');
  const [format, setFormat] = useState<string | undefined>();
  const [city, setCity] = useState<string | undefined>();
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState('');
  const [timezone, setTimezone] = useState('EET (UTC+2)');
  const [isPaid, setIsPaid] = useState(false);
  const [cost, setCost] = useState('');
  const [ticketUrl, setTicketUrl] = useState('');
  const [seats, setSeats] = useState('');
  const [regDeadline, setRegDeadline] = useState<Date | undefined>();
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [showDate, setShowDate] = useState(false);
  const [showReg, setShowReg] = useState(false);
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

  const validate = () => {
    const e: Record<string, string> = {};
    if (title.trim().length < 6) e.title = 'Вкажіть назву події (мін. 6 символів)';
    if (!type) e.type = 'Оберіть тип події';
    if (!format) e.format = 'Оберіть формат';
    if (!organizer.trim()) e.organizer = 'Вкажіть організатора';
    if (!date) e.date = 'Оберіть дату';
    if (isPaid && !ticketUrl.trim()) e.ticket = 'Для платної події вкажіть посилання на білетний сервіс';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) { toast('Перевірте обовʼязкові поля', 'warning'); return; }
    const rec: EventItem = {
      id: '', title: title.trim(), type, organizer: organizer.trim(),
      date: date ? fmtDate(date) : '', time: time.trim() || undefined, timezone,
      format: format!, city: city || (format === 'Онлайн' ? 'Онлайн' : 'Україна'), venue: venue.trim() || undefined,
      cost: isPaid ? (cost.trim() || 'Платно') : 'Безкоштовно', isPaid, ticketUrl: ticketUrl.trim() || undefined,
      seatsTotal: seats ? Number(seats.replace(/\D/g, '')) : undefined,
      seatsLeft: seats ? Number(seats.replace(/\D/g, '')) : undefined,
      regDeadline: regDeadline ? fmtDate(regDeadline) : undefined,
      shortDesc: shortDesc.trim() || undefined, fullDesc: fullDesc.trim() || undefined,
      speakers: [], partners: [], tags: [], relatedArticles: [],
      status: { label: 'На модерації', tone: 'warning' },
    };
    const saved = await EventStore.createEvent(rec);
    toast('Подію надіслано на модерацію', 'success');
    onCreated(saved);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.header}>
        <TouchableOpacity style={s.hbtn} onPress={onBack}><Ionicons name="close" size={19} color={colors.ink} /></TouchableOpacity>
        <Text style={s.hTitle}>Нова подія</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space(5), paddingBottom: space(10), gap: 16 }} keyboardShouldPersistTaps="handled">
        <FormInput label="Назва*" value={title} onChange={setTitle} placeholder="Напр.: Sport Business Forum 2026" error={errors.title} />
        <SelectField label="Тип події*" value={type} placeholder="Оберіть тип" error={errors.type} onPress={() => pick(EVENT_TYPE_LABELS, type, setType, 'Тип події')} />
        <FormInput label="Організатор*" value={organizer} onChange={setOrganizer} placeholder="Назва організації" error={errors.organizer} />

        <View style={s.row}>
          <View style={{ flex: 1 }}><SelectField label="Формат*" value={format} error={errors.format} onPress={() => pick(EVENT_FORMATS, format, setFormat, 'Формат')} /></View>
          <View style={{ flex: 1 }}><SelectField label="Місто" value={city} onPress={() => pick(CITIES, city, setCity, 'Місто')} /></View>
        </View>
        <FormInput label="Місце проведення" value={venue} onChange={setVenue} placeholder="Напр.: Parkovy, Київ" />

        <View style={{ gap: 6 }}>
          <SelectField label="Дата*" value={date ? fmtDate(date) : undefined} placeholder="Оберіть дату" error={errors.date} onPress={() => setShowDate((v) => !v)} />
          {showDate && <DatePicker value={date} onChange={(d) => { setDate(d); setShowDate(false); }} />}
        </View>
        <View style={s.row}>
          <View style={{ flex: 1 }}><FormInput label="Час" value={time} onChange={setTime} placeholder="18:00" /></View>
          <View style={{ flex: 1 }}><SelectField label="Часовий пояс" value={timezone} onPress={() => pick(TIMEZONES, timezone, setTimezone, 'Часовий пояс')} /></View>
        </View>

        <View style={{ gap: 6 }}>
          <SelectField label="Дедлайн реєстрації" value={regDeadline ? fmtDate(regDeadline) : undefined} placeholder="Оберіть дату" onPress={() => setShowReg((v) => !v)} />
          {showReg && <DatePicker value={regDeadline} onChange={(d) => { setRegDeadline(d); setShowReg(false); }} />}
        </View>
        <FormInput label="Кількість місць" value={seats} onChange={setSeats} placeholder="Напр.: 200" keyboardType="numeric" />

        {/* Платність */}
        <TouchableOpacity style={s.toggleRow} activeOpacity={0.8} onPress={() => setIsPaid((v) => !v)}>
          <View>
            <Text style={s.toggleLabel}>Платна подія</Text>
            <Text style={s.toggleHint}>Оплата — на зовнішньому сервісі (без платежів у застосунку)</Text>
          </View>
          <View style={[s.switch, isPaid && { backgroundColor: colors.accent, borderColor: colors.accent }]}><View style={[s.knob, isPaid && { alignSelf: 'flex-end' }]} /></View>
        </TouchableOpacity>
        {isPaid && (
          <>
            <FormInput label="Вартість" value={cost} onChange={setCost} placeholder="Напр.: ₴1 500 або від ₴900" />
            <FormInput label="Посилання на білети*" value={ticketUrl} onChange={setTicketUrl} placeholder="concert.ua/…" error={errors.ticket} />
          </>
        )}

        <FormInput label="Короткий опис" value={shortDesc} onChange={setShortDesc} placeholder="Одне-два речення для картки" multiline />
        <FormInput label="Повний опис" value={fullDesc} onChange={setFullDesc} placeholder="Програма, деталі, для кого" multiline />

        <View style={{ gap: 10, marginTop: space(2) }}>
          <PrimaryCTA label="Надіслати на модерацію" icon="cloud-upload-outline" onPress={submit} />
          <SecondaryCTA label="Скасувати" onPress={onBack} />
          <Text style={s.hint}>Подія проходить модерацію перед показом. Поля з * — обовʼязкові.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space(5), paddingTop: space(2), paddingBottom: space(3), borderBottomWidth: 1, borderBottomColor: colors.line },
  hbtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  hTitle: { fontFamily: fonts.extra, color: colors.ink, fontSize: 17, letterSpacing: -0.3 },
  row: { flexDirection: 'row', gap: 10 },
  hint: { fontFamily: fonts.med, color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  sheetTitle: { fontFamily: fonts.extra, color: colors.ink, fontSize: 18, letterSpacing: -0.3, marginBottom: 4 },
  pickRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line },
  pickText: { fontFamily: fonts.semi, color: colors.ink, fontSize: 14.5 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 4 },
  toggleLabel: { fontFamily: fonts.bold, color: colors.ink, fontSize: 14 },
  toggleHint: { fontFamily: fonts.med, color: colors.muted, fontSize: 11.5, marginTop: 2, maxWidth: 220 },
  switch: { width: 44, height: 26, borderRadius: 13, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.chipBg, padding: 2, justifyContent: 'center' },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
});
