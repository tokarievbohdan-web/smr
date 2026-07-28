import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, fonts } from '../theme';
import { useSheet, useToast } from '../UIProvider';
import { Notifications, Notification, NotifType, NOTIF_META, EntityType } from '../notificationStore';
import { AppHeader, EmptyState } from '../ui';

const relTime = (ts: number) => {
  const min = Math.floor((Date.now() - ts) / 60000);
  if (min < 60) return `${Math.max(1, min)} хв`;
  const h = Math.floor(min / 60); if (h < 24) return `${h} год`;
  const d = Math.floor(h / 24); return `${d} дн`;
};
const GROUPS = ['Можливості', 'Відгуки', 'Події', 'Знайомства', 'Організації', 'Акаунт'];

export default function NotificationsScreen({ onBack, onDeepLink }: {
  onBack: () => void;
  onDeepLink: (entityType: EntityType, entityId?: string) => void;
}) {
  const sheet = useSheet();
  const toast = useToast();
  const [items, setItems] = useState<Notification[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const reload = () => Notifications.list().then(setItems);
  useEffect(() => { reload(); }, []);
  const toggleGroup = (key: string) => setExpanded((e) => ({ ...e, [key]: !e[key] }));

  const unread = items.filter((i) => !i.read).length;
  const buckets = useMemo(() => {
    const today: Notification[] = []; const earlier: Notification[] = [];
    const dayAgo = Date.now() - 86400000;
    items.forEach((i) => (i.at >= dayAgo ? today : earlier).push(i));
    return { today, earlier };
  }, [items]);

  const open = async (n: Notification) => {
    await Notifications.markRead(n.id);
    await reload();
    if (n.entityType) onDeepLink(n.entityType, n.entityId);
  };
  const markAll = async () => { await Notifications.markAllRead(); await reload(); toast('Усі позначено прочитаними', 'success'); };

  const openPrefs = () => sheet.open(<PrefsSheet />);

  const renderItem = (n: Notification) => {
    const meta = NOTIF_META[n.type];
    return (
      <TouchableOpacity key={n.id} style={[s.row, !n.read && s.unread]} activeOpacity={0.85} onPress={() => open(n)}>
        <View style={[s.icon, !n.read && { backgroundColor: colors.accentSoft }]}><Ionicons name={meta.icon as any} size={17} color={!n.read ? colors.accent : colors.dim} /></View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={s.title} numberOfLines={2}>{n.title}</Text>
          <Text style={s.body} numberOfLines={2}>{n.body}</Text>
          <Text style={s.meta}>{meta.label} · {relTime(n.at)} тому</Text>
        </View>
        {!n.read && <View style={s.dot} />}
      </TouchableOpacity>
    );
  };

  // Групування схожих (однотипних) сповіщень у межах дня
  const renderBucket = (list: Notification[], bucketKey: string) => {
    const order: NotifType[] = [];
    const byType = new Map<NotifType, Notification[]>();
    list.forEach((n) => { if (!byType.has(n.type)) { byType.set(n.type, []); order.push(n.type); } byType.get(n.type)!.push(n); });
    return order.map((type) => {
      const group = byType.get(type)!;
      if (group.length < 2) return renderItem(group[0]);
      const key = bucketKey + ':' + type;
      const meta = NOTIF_META[type];
      const unread = group.filter((g) => !g.read).length;
      const open = expanded[key];
      return (
        <View key={key} style={{ gap: 10 }}>
          <TouchableOpacity style={[s.row, unread > 0 && s.unread]} activeOpacity={0.85} onPress={() => toggleGroup(key)}>
            <View style={[s.icon, unread > 0 && { backgroundColor: colors.accentSoft }]}><Ionicons name={meta.icon as any} size={17} color={unread > 0 ? colors.accent : colors.dim} /></View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.title}>{group.length} × {meta.label}</Text>
              <Text style={s.body} numberOfLines={1}>{group[0].title}</Text>
              <Text style={s.meta}>{unread ? `${unread} нових · ` : ''}натисніть, щоб {open ? 'згорнути' : 'розгорнути'}</Text>
            </View>
            <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.muted} />
          </TouchableOpacity>
          {open && <View style={{ gap: 10, paddingLeft: 12 }}>{group.map(renderItem)}</View>}
        </View>
      );
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader title="Сповіщення" onBack={onBack} right={
        <TouchableOpacity style={s.hbtn} onPress={openPrefs}><Ionicons name="options-outline" size={17} color={colors.ink} /></TouchableOpacity>
      } />
      {items.length > 0 && (
        <View style={s.actionsRow}>
          <Text style={s.count}>{unread ? `${unread} непрочитаних` : 'Усі прочитані'}</Text>
          {unread > 0 && <Text style={s.markAll} onPress={markAll}>Позначити всі</Text>}
        </View>
      )}
      <ScrollView contentContainerStyle={{ padding: space(5), paddingTop: space(2), gap: 10 }} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <View style={{ marginTop: space(6) }}><EmptyState icon="notifications-outline" title="Немає сповіщень" subtitle="Тут зʼявляться статуси заявок, знайомств і подій." /></View>
        ) : (
          <>
            {buckets.today.length > 0 && <><Text style={s.section}>СЬОГОДНІ</Text>{renderBucket(buckets.today, 'today')}</>}
            {buckets.earlier.length > 0 && <><Text style={[s.section, { marginTop: space(2) }]}>РАНІШЕ</Text>{renderBucket(buckets.earlier, 'earlier')}</>}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function PrefsSheet() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  useEffect(() => { Notifications.getPrefs().then(setPrefs); }, []);
  const isOn = (g: string) => prefs[g] !== false;
  const toggle = async (g: string) => { const v = !isOn(g); setPrefs((p) => ({ ...p, [g]: v })); await Notifications.setPref(g, v); };
  return (
    <View style={{ gap: 12, paddingBottom: 8 }}>
      <Text style={s.sheetTitle}>Налаштування сповіщень</Text>
      {GROUPS.map((g) => (
        <TouchableOpacity key={g} style={s.prefRow} activeOpacity={0.8} onPress={() => toggle(g)}>
          <Text style={s.prefLabel}>{g}</Text>
          <View style={[s.switch, isOn(g) && { backgroundColor: colors.accent, borderColor: colors.accent }]}><View style={[s.knob, isOn(g) && { alignSelf: 'flex-end' }]} /></View>
        </TouchableOpacity>
      ))}
      <Text style={s.pushHint}>Push-сповіщення буде додано пізніше — зараз доступні сповіщення в застосунку.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  hbtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space(5), paddingBottom: space(2) },
  count: { fontFamily: fonts.semi, color: colors.dim, fontSize: 12.5 },
  markAll: { fontFamily: fonts.bold, color: colors.accent, fontSize: 12.5 },
  section: { fontFamily: fonts.bold, color: colors.muted, fontSize: 11, letterSpacing: 0.8, marginBottom: 2 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 12 },
  unread: { borderColor: colors.accentSoft, backgroundColor: '#FAFBFF' },
  icon: { width: 38, height: 38, borderRadius: 10, backgroundColor: colors.chipBg, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.bold, color: colors.ink, fontSize: 13.5, lineHeight: 18 },
  body: { fontFamily: fonts.med, color: colors.dim, fontSize: 12.5, lineHeight: 17 },
  meta: { fontFamily: fonts.semi, color: colors.muted, fontSize: 11 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  sheetTitle: { fontFamily: fonts.extra, color: colors.ink, fontSize: 18, letterSpacing: -0.3 },
  prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  prefLabel: { fontFamily: fonts.semi, color: colors.ink, fontSize: 14 },
  switch: { width: 44, height: 26, borderRadius: 13, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.chipBg, padding: 2, justifyContent: 'center' },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  pushHint: { fontFamily: fonts.med, color: colors.muted, fontSize: 11.5, lineHeight: 17, marginTop: 4 },
});
