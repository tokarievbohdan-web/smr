// Sport Market Review — дизайн-система (презентаційні компоненти).
// Редакційний, мінімалістичний, діловий стиль. Без беттинг-клі.
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Pressable,
  Animated, Easing, ActivityIndicator, Image, ViewStyle, StyleProp, TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, fonts } from './theme';

// Семантичні кольори станів (окремо від акценту)
export const status = {
  success: { fg: '#0F7B4E', bg: '#E4F5EC' },
  warning: { fg: '#8A5A00', bg: '#FBF0DA' },
  danger: { fg: '#B42318', bg: '#FBE9E7' },
  info: { fg: colors.accent, bg: colors.accentSoft },
  neutral: { fg: colors.dim, bg: colors.chipBg },
};

/* ─── Layout ─────────────────────────────────────────── */

export function ScreenContainer({ children, style, scroll = false }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; scroll?: boolean }) {
  if (scroll) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={[{ padding: space(5), paddingBottom: space(8) }, style]} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    );
  }
  return <View style={[{ flex: 1, backgroundColor: colors.bg }, style]}>{children}</View>;
}

export function AppHeader({ title, onBack, right }: { title?: string; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <View style={s.header}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
        {onBack && (
          <TouchableOpacity style={s.iconBtn} onPress={onBack} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={18} color={colors.ink} />
          </TouchableOpacity>
        )}
        {title ? <Text style={s.headerTitle} numberOfLines={1}>{title}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={s.sectionHead}>
      <Text style={s.sectionTitle}>{title}</Text>
      {action ? <Text style={s.link} onPress={onAction}>{action}</Text> : null}
    </View>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Пошук', onFocus, autoFocus }: { value: string; onChange: (v: string) => void; placeholder?: string; onFocus?: () => void; autoFocus?: boolean }) {
  return (
    <View style={s.search}>
      <Ionicons name="search-outline" size={16} color={colors.muted} />
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.muted} style={s.searchInput} onFocus={onFocus} autoFocus={autoFocus} />
      {value ? (
        <TouchableOpacity onPress={() => onChange('')} hitSlop={8}><Ionicons name="close-circle" size={16} color={colors.muted} /></TouchableOpacity>
      ) : null}
    </View>
  );
}

/* ─── Buttons ────────────────────────────────────────── */

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export function Button({ label, onPress, variant = 'secondary', size = 'md', loading, disabled, icon, full }: {
  label: string; onPress?: () => void; variant?: BtnVariant; size?: 'sm' | 'md' | 'lg'; loading?: boolean; disabled?: boolean; icon?: any; full?: boolean;
}) {
  const h = size === 'sm' ? 38 : size === 'lg' ? 52 : 46;
  const bg = variant === 'primary' ? colors.accent : variant === 'danger' ? status.danger.fg : variant === 'ghost' ? 'transparent' : colors.bg;
  const fg = variant === 'primary' || variant === 'danger' ? '#fff' : colors.ink;
  const border = variant === 'secondary' ? colors.line : 'transparent';
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={disabled || loading ? undefined : onPress}
      style={[s.btn, { height: h, backgroundColor: bg, borderColor: border, borderWidth: variant === 'secondary' ? 1 : 0, opacity: disabled ? 0.5 : 1, alignSelf: full ? 'stretch' : 'auto', paddingHorizontal: size === 'sm' ? 14 : 20 }]}
    >
      {loading ? <ActivityIndicator color={fg} /> : (
        <>
          {icon && <Ionicons name={icon} size={17} color={fg} />}
          <Text style={[s.btnText, { color: fg, fontSize: size === 'sm' ? 13 : 15 }]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
export const PrimaryCTA = (p: Omit<Parameters<typeof Button>[0], 'variant'>) => <Button {...p} variant="primary" full />;
export const SecondaryCTA = (p: Omit<Parameters<typeof Button>[0], 'variant'>) => <Button {...p} variant="secondary" full />;

export function SaveButton({ saved, onPress }: { saved: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity style={s.roundBtn} onPress={onPress} hitSlop={8} activeOpacity={0.8}>
      <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={16} color={saved ? colors.accent : colors.ink} />
    </TouchableOpacity>
  );
}
export function ShareButton({ onPress }: { onPress?: () => void }) {
  return (
    <TouchableOpacity style={s.roundBtn} onPress={onPress} hitSlop={8} activeOpacity={0.8}>
      <Ionicons name="share-social-outline" size={16} color={colors.ink} />
    </TouchableOpacity>
  );
}

/* ─── Chips / Tags / Badges / Avatar ─────────────────── */

export function FilterChips({ items, value, onChange }: { items: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {items.map((it) => {
        const on = it === value;
        return (
          <TouchableOpacity key={it} activeOpacity={0.85} onPress={() => onChange(it)}>
            <View style={[s.chip, on ? { backgroundColor: colors.dark, borderColor: colors.dark } : { backgroundColor: colors.bg, borderColor: colors.line }]}>
              <Text style={[s.chipText, { color: on ? '#fff' : colors.ink }]}>{it}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export function Tag({ label }: { label: string }) {
  return <View style={s.tag}><Text style={s.tagText}>{label}</Text></View>;
}

export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: keyof typeof status }) {
  const c = status[tone];
  return <View style={[s.badge, { backgroundColor: c.bg }]}><Text style={[s.badgeText, { color: c.fg }]}>{label.toUpperCase()}</Text></View>;
}

export function VerificationBadge({ size = 15 }: { size?: number }) {
  return <Ionicons name="checkmark-circle" size={size} color={colors.accent} />;
}

export function Avatar({ initials, size = 44, shade = 0, uri, verified }: { initials?: string; size?: number; shade?: number; uri?: string; verified?: boolean }) {
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.avatar[shade % 3], alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {uri ? <Image source={{ uri }} style={{ width: '100%', height: '100%' }} /> : <Text style={{ fontFamily: fonts.bold, color: colors.dim, fontSize: size * 0.34 }}>{initials}</Text>}
      </View>
      {verified && <View style={{ position: 'absolute', right: -1, bottom: -1, backgroundColor: colors.bg, borderRadius: 9 }}><VerificationBadge size={16} /></View>}
    </View>
  );
}

/* ─── Photo placeholder ──────────────────────────────── */
export function Photo({ label, uri, height, round = radius.card, style, children }: { label?: string; uri?: string; height: number; round?: number; style?: StyleProp<ViewStyle>; children?: React.ReactNode }) {
  return (
    <View style={[{ height, borderRadius: round, backgroundColor: colors.stripe, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, style]}>
      {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill as any} resizeMode="cover" /> : label ? <Text style={{ fontFamily: fonts.med, color: colors.muted, fontSize: 10 }}>{label}</Text> : null}
      {children}
    </View>
  );
}

/* ─── Cards ──────────────────────────────────────────── */

export function ContentCard({ category, kind, title, excerpt, meta, saved, onPress, onSave, imageUri }: {
  category: string; kind?: string; title: string; excerpt?: string; meta?: string; saved?: boolean; onPress?: () => void; onSave?: () => void; imageUri?: string;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.card, pressed && s.pressed]}>
      <Photo height={170} round={0} uri={imageUri} label="фото матеріалу">
        <View style={s.imgBadge}><Text style={s.imgBadgeText}>{`${category}${kind ? ' · ' + kind : ''}`.toUpperCase()}</Text></View>
      </Photo>
      <View style={{ padding: 16, gap: 8 }}>
        <Text style={s.cardTitle}>{title}</Text>
        {excerpt ? <Text style={s.cardExcerpt}>{excerpt}</Text> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Text style={s.meta}>{meta}</Text>
          {onSave && <View style={{ marginLeft: 'auto' }}><SaveButton saved={!!saved} onPress={onSave} /></View>}
        </View>
      </View>
    </Pressable>
  );
}

export function PersonCard({ name, role, initials, tags = [], shade = 0, verified, onPress }: {
  name: string; role: string; initials: string; tags?: string[]; shade?: number; verified?: boolean; onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.rowCard, pressed && s.pressed]}>
      <Avatar initials={initials} size={48} shade={shade} verified={verified} />
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={s.name}>{name}</Text>
        </View>
        <Text style={s.role}>{role}</Text>
        {tags.length > 0 && <View style={{ flexDirection: 'row', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>{tags.map((t) => <Tag key={t} label={t} />)}</View>}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

export function OrganizationCard({ name, type, city, sports = [], verified, onPress }: {
  name: string; type: string; city?: string; sports?: string[]; verified?: boolean; onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.rowCard, pressed && s.pressed]}>
      <View style={s.orgLogo}><Ionicons name="business-outline" size={22} color={colors.dim} /></View>
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={s.name}>{name}</Text>
          {verified && <VerificationBadge size={14} />}
        </View>
        <Text style={s.role}>{[type, city].filter(Boolean).join(' · ')}</Text>
        {sports.length > 0 && <View style={{ flexDirection: 'row', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>{sports.map((t) => <Tag key={t} label={t} />)}</View>}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

export function OpportunityCard({ title, type, org, city, budget, deadline, statusLabel, onPress, sport, format, applications, verified, saved, onSave }: {
  title: string; type: string; org?: string; city?: string; budget?: string; deadline?: string; statusLabel?: { label: string; tone: keyof typeof status }; onPress?: () => void;
  sport?: string; format?: string; applications?: number; verified?: boolean; saved?: boolean; onSave?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.oppCard, pressed && s.pressed]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <StatusBadge label={type} tone="info" />
        {statusLabel && <StatusBadge label={statusLabel.label} tone={statusLabel.tone} />}
        {onSave && <View style={{ marginLeft: 'auto' }}><SaveButton saved={!!saved} onPress={onSave} /></View>}
      </View>
      <Text style={s.oppTitle}>{title}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <Text style={s.role}>{[org, city].filter(Boolean).join(' · ')}</Text>
        {verified && <VerificationBadge size={13} />}
      </View>
      {(sport || format) && (
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {sport ? <Tag label={sport} /> : null}
          {format ? <Tag label={format} /> : null}
        </View>
      )}
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 8, alignItems: 'center' }}>
        {budget ? <Text style={s.metaStrong}><Ionicons name="cash-outline" size={12} color={colors.dim} /> {budget}</Text> : null}
        {deadline ? <Text style={s.meta}><Ionicons name="time-outline" size={12} color={colors.muted} /> до {deadline}</Text> : null}
        {typeof applications === 'number' ? <Text style={s.meta}><Ionicons name="people-outline" size={12} color={colors.muted} /> {applications}</Text> : null}
      </View>
    </Pressable>
  );
}

export function EventCard({ title, date, city, format, cover, onPress, type, organizer, cost, seatsLeft, time, saved, onSave, statusLabel }: {
  title: string; date: string; city?: string; format?: string; cover?: string; onPress?: () => void;
  type?: string; organizer?: string; cost?: string; seatsLeft?: number; time?: string;
  saved?: boolean; onSave?: () => void; statusLabel?: { label: string; tone: keyof typeof status };
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.card, pressed && s.pressed]}>
      <Photo height={130} round={0} uri={cover} label="обкладинка події">
        {onSave && <View style={{ position: 'absolute', top: 10, right: 10 }}><SaveButton saved={!!saved} onPress={onSave} /></View>}
        {statusLabel && <View style={{ position: 'absolute', top: 12, left: 12 }}><StatusBadge label={statusLabel.label} tone={statusLabel.tone} /></View>}
      </Photo>
      <View style={{ padding: 14, gap: 6 }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <View style={s.dateChip}><Ionicons name="calendar-outline" size={12} color={colors.accent} /><Text style={s.dateChipText}>{date}{time ? ` · ${time}` : ''}</Text></View>
          {type ? <StatusBadge label={type} tone="info" /> : null}
          {format ? <StatusBadge label={format} tone="neutral" /> : null}
        </View>
        <Text style={s.cardTitle}>{title}</Text>
        {(organizer || city) ? <Text style={s.role}>{[organizer, city].filter(Boolean).join(' · ')}</Text> : null}
        {(cost || typeof seatsLeft === 'number') && (
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 2 }}>
            {cost ? <Text style={s.metaStrong}><Ionicons name="pricetag-outline" size={12} color={colors.dim} /> {cost}</Text> : null}
            {typeof seatsLeft === 'number' ? <Text style={s.meta}><Ionicons name="people-outline" size={12} color={colors.muted} /> {seatsLeft > 0 ? `${seatsLeft} місць` : 'немає місць'}</Text> : null}
          </View>
        )}
      </View>
    </Pressable>
  );
}

/* ─── States ─────────────────────────────────────────── */

export function EmptyState({ icon = 'file-tray-outline', title, subtitle, action, onAction }: { icon?: any; title: string; subtitle?: string; action?: string; onAction?: () => void }) {
  return (
    <View style={s.state}>
      <View style={s.stateIcon}><Ionicons name={icon} size={26} color={colors.muted} /></View>
      <Text style={s.stateTitle}>{title}</Text>
      {subtitle ? <Text style={s.stateText}>{subtitle}</Text> : null}
      {action ? <View style={{ marginTop: 12 }}><Button label={action} variant="primary" size="sm" onPress={onAction} /></View> : null}
    </View>
  );
}

export function ErrorState({ message = 'Щось пішло не так', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <View style={s.state}>
      <View style={[s.stateIcon, { backgroundColor: status.danger.bg }]}><Ionicons name="alert-circle-outline" size={26} color={status.danger.fg} /></View>
      <Text style={s.stateTitle}>{message}</Text>
      {onRetry ? <View style={{ marginTop: 12 }}><Button label="Повторити" variant="secondary" size="sm" icon="refresh" onPress={onRetry} /></View> : null}
    </View>
  );
}

export function OfflineBanner() {
  return (
    <View style={s.offline}>
      <Ionicons name="cloud-offline-outline" size={14} color={status.warning.fg} />
      <Text style={s.offlineText}>Немає зʼєднання — показуємо збережене</Text>
    </View>
  );
}

export function Skeleton({ height = 16, width = '100%', round = 8, style }: { height?: number; width?: any; round?: number; style?: StyleProp<ViewStyle> }) {
  const o = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(o, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(o, { toValue: 0.5, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [o]);
  return <Animated.View style={[{ height, width, borderRadius: round, backgroundColor: colors.chipBg, opacity: o }, style]} />;
}

export function SkeletonCard() {
  return (
    <View style={[s.card, { padding: 0 }]}>
      <Skeleton height={170} round={0} />
      <View style={{ padding: 16, gap: 10 }}>
        <Skeleton height={18} width="80%" />
        <Skeleton height={13} width="100%" />
        <Skeleton height={13} width="60%" />
      </View>
    </View>
  );
}

/* ─── List footer (pagination / infinite) ────────────── */
export function ListFooter({ loading, end }: { loading?: boolean; end?: boolean }) {
  if (loading) return <View style={{ paddingVertical: space(5), alignItems: 'center' }}><ActivityIndicator color={colors.muted} /></View>;
  if (end) return <Text style={s.endText}>Більше немає</Text>;
  return <View style={{ height: space(4) }} />;
}

/* ─── Form controls ──────────────────────────────────── */

export function FormInput({ label, value, onChange, placeholder, error, helper, multiline, keyboardType }: {
  label?: string; value: string; onChange: (v: string) => void; placeholder?: string; error?: string; helper?: string; multiline?: boolean; keyboardType?: any;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <TextInput
        value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.muted}
        multiline={multiline} keyboardType={keyboardType} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={[s.input, multiline && { height: 96, paddingTop: 12, textAlignVertical: 'top' }, focus && { borderColor: colors.accent }, !!error && { borderColor: status.danger.fg }]}
      />
      {error ? <Text style={s.errorText}>{error}</Text> : helper ? <Text style={s.helper}>{helper}</Text> : null}
    </View>
  );
}

// Select / Multi-select — відкривають список опцій (через onOpen у екрані, з BottomSheet)
export function SelectField({ label, value, placeholder = 'Обрати', onPress, error }: { label?: string; value?: string; placeholder?: string; onPress?: () => void; error?: string }) {
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <TouchableOpacity style={[s.input, s.selectRow, !!error && { borderColor: status.danger.fg }]} onPress={onPress} activeOpacity={0.8}>
        <Text style={[s.selectValue, !value && { color: colors.muted }]}>{value || placeholder}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.muted} />
      </TouchableOpacity>
      {error ? <Text style={s.errorText}>{error}</Text> : null}
    </View>
  );
}

export function MultiSelectField({ label, values, placeholder = 'Обрати', onPress }: { label?: string; values: string[]; placeholder?: string; onPress?: () => void }) {
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <TouchableOpacity style={[s.input, { minHeight: 48, height: undefined, paddingVertical: 8 }, s.selectRow]} onPress={onPress} activeOpacity={0.8}>
        {values.length ? (
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1 }}>{values.map((v) => <Tag key={v} label={v} />)}</View>
        ) : <Text style={[s.selectValue, { color: colors.muted }]}>{placeholder}</Text>}
        <Ionicons name="chevron-down" size={16} color={colors.muted} />
      </TouchableOpacity>
    </View>
  );
}

// DatePicker — легкий інлайн-календар (без нативних модулів)
export function DatePicker({ value, onChange }: { value?: Date; onChange: (d: Date) => void }) {
  const base = value || new Date(2026, 6, 1);
  const [view, setView] = useState({ y: base.getFullYear(), m: base.getMonth() });
  const first = new Date(view.y, view.m, 1);
  const startDow = (first.getDay() + 6) % 7; // Пн=0
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const monthName = new Date(view.y, view.m, 1).toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });
  const cells: (number | null)[] = [...Array(startDow).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const isSel = (d: number) => value && value.getFullYear() === view.y && value.getMonth() === view.m && value.getDate() === d;
  return (
    <View style={s.calendar}>
      <View style={s.calHead}>
        <TouchableOpacity onPress={() => setView((v) => ({ y: v.m === 0 ? v.y - 1 : v.y, m: (v.m + 11) % 12 }))} hitSlop={8}><Ionicons name="chevron-back" size={18} color={colors.ink} /></TouchableOpacity>
        <Text style={s.calMonth}>{monthName}</Text>
        <TouchableOpacity onPress={() => setView((v) => ({ y: v.m === 11 ? v.y + 1 : v.y, m: (v.m + 1) % 12 }))} hitSlop={8}><Ionicons name="chevron-forward" size={18} color={colors.ink} /></TouchableOpacity>
      </View>
      <View style={s.calGrid}>
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map((d) => <Text key={d} style={s.calDow}>{d}</Text>)}
        {cells.map((d, i) => (
          <TouchableOpacity key={i} disabled={!d} style={s.calCell} onPress={() => d && onChange(new Date(view.y, view.m, d))}>
            {d ? <View style={[s.calDay, isSel(d) && { backgroundColor: colors.accent }]}><Text style={[s.calDayText, isSel(d) && { color: '#fff' }]}>{d}</Text></View> : null}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// FileUpload — презентаційний (реальний вибір файлів = нативний модуль, пізніше)
export function FileUpload({ files, onAdd, onRemove }: { files: string[]; onAdd?: () => void; onRemove?: (f: string) => void }) {
  return (
    <View style={{ gap: 8 }}>
      <TouchableOpacity style={s.upload} onPress={onAdd} activeOpacity={0.8}>
        <Ionicons name="cloud-upload-outline" size={20} color={colors.accent} />
        <Text style={s.uploadText}>Додати файл</Text>
        <Text style={s.uploadHint}>PDF, зображення до 10 МБ</Text>
      </TouchableOpacity>
      {files.map((f) => (
        <View key={f} style={s.fileRow}>
          <Ionicons name="document-outline" size={16} color={colors.dim} />
          <Text style={s.fileName} numberOfLines={1}>{f}</Text>
          <TouchableOpacity onPress={() => onRemove?.(f)} hitSlop={8}><Ionicons name="close" size={16} color={colors.muted} /></TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space(5), paddingTop: space(2), paddingBottom: space(3) },
  iconBtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  roundBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.bold, color: colors.ink, fontSize: 18, letterSpacing: -0.3, flex: 1 },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontFamily: fonts.extra, color: colors.ink, fontSize: 18, letterSpacing: -0.3 },
  link: { fontFamily: fonts.semi, color: colors.accent, fontSize: 12 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 46, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, paddingHorizontal: 14 },
  searchInput: { flex: 1, fontFamily: fonts.med, color: colors.ink, fontSize: 14, outlineStyle: 'none' } as any,

  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radius.lg },
  btnText: { fontFamily: fonts.bold },

  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1 },
  chipText: { fontFamily: fonts.semi, fontSize: 12.5 },
  tag: { backgroundColor: colors.chipBg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontFamily: fonts.semi, color: colors.dim, fontSize: 10.5 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText: { fontFamily: fonts.bold, fontSize: 9.5, letterSpacing: 0.5 },

  card: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.bg },
  imgBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  imgBadgeText: { fontFamily: fonts.bold, color: colors.accent, fontSize: 10, letterSpacing: 0.6 },
  cardTitle: { fontFamily: fonts.extra, color: colors.ink, fontSize: 17, lineHeight: 21, letterSpacing: -0.3 },
  cardExcerpt: { fontFamily: fonts.med, color: colors.dim, fontSize: 13.5, lineHeight: 20 },
  meta: { fontFamily: fonts.semi, color: colors.muted, fontSize: 12 },
  metaStrong: { fontFamily: fonts.bold, color: colors.dim, fontSize: 12 },
  rowCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.line, borderRadius: radius.xxl, padding: 14 },
  name: { fontFamily: fonts.bold, color: colors.ink, fontSize: 14.5 },
  role: { fontFamily: fonts.med, color: colors.dim, fontSize: 12 },
  orgLogo: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.chipBg, alignItems: 'center', justifyContent: 'center' },
  oppCard: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.xxl, padding: 16 },
  oppTitle: { fontFamily: fonts.extra, color: colors.ink, fontSize: 16, lineHeight: 21, letterSpacing: -0.2, marginBottom: 3 },
  dateChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  dateChipText: { fontFamily: fonts.bold, color: colors.accent, fontSize: 11 },
  pressed: { opacity: 0.7 },

  state: { alignItems: 'center', paddingVertical: space(10), paddingHorizontal: space(6) },
  stateIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.chipBg, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  stateTitle: { fontFamily: fonts.bold, color: colors.ink, fontSize: 15, textAlign: 'center' },
  stateText: { fontFamily: fonts.med, color: colors.dim, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 19 },
  offline: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: status.warning.bg, paddingHorizontal: 14, paddingVertical: 8 },
  offlineText: { fontFamily: fonts.semi, color: status.warning.fg, fontSize: 12 },
  endText: { fontFamily: fonts.semi, color: colors.muted, fontSize: 12, textAlign: 'center', paddingVertical: space(5) },

  label: { fontFamily: fonts.semi, color: colors.dim, fontSize: 12 },
  input: { height: 48, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 14, fontFamily: fonts.med, fontSize: 14, color: colors.ink, outlineStyle: 'none' } as any,
  helper: { fontFamily: fonts.med, color: colors.muted, fontSize: 11.5 },
  errorText: { fontFamily: fonts.semi, color: status.danger.fg, fontSize: 11.5 },
  selectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectValue: { fontFamily: fonts.med, color: colors.ink, fontSize: 14 },

  calendar: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 12 },
  calHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  calMonth: { fontFamily: fonts.bold, color: colors.ink, fontSize: 14, textTransform: 'capitalize' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDow: { width: `${100 / 7}%`, textAlign: 'center', fontFamily: fonts.semi, color: colors.muted, fontSize: 11, marginBottom: 6 },
  calCell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  calDay: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  calDayText: { fontFamily: fonts.med, color: colors.ink, fontSize: 13 },

  upload: { borderWidth: 1, borderColor: colors.line, borderStyle: 'dashed', borderRadius: radius.lg, alignItems: 'center', paddingVertical: 20, gap: 4 },
  uploadText: { fontFamily: fonts.bold, color: colors.accent, fontSize: 13 },
  uploadHint: { fontFamily: fonts.med, color: colors.muted, fontSize: 11 },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10 },
  fileName: { fontFamily: fonts.med, color: colors.ink, fontSize: 13, flex: 1 },
});
