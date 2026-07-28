import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, fonts } from '../theme';
import { ME } from '../data';
import { Avatar, VerificationBadge } from '../ui';
import { useAuth } from '../AuthContext';
import { NetworkActions } from '../networkStore';

type Sub = 'edit' | 'saved' | 'opps' | 'apps' | 'events' | 'orgs' | 'settings';

export default function ProfileScreen({ onOpenSub, onOpenIntros, onOpenGallery }: {
  onOpenSub: (s: Sub) => void;
  onOpenIntros: () => void;
  onOpenGallery?: () => void;
}) {
  const { user } = useAuth();
  const [introCount, setIntroCount] = useState(0);
  useEffect(() => { NetworkActions.actionableIntroCount().then(setIntroCount); }, [user]);

  const pr = user?.profile;
  const name = [pr?.firstName, pr?.lastName].filter(Boolean).join(' ') || ME.name;
  const role = [pr?.position, pr?.org].filter(Boolean).join(' · ') || ME.role;
  const city = pr?.city || ME.city;
  const initials = `${pr?.firstName?.[0] || ''}${pr?.lastName?.[0] || ''}`.toUpperCase() || ME.initials;
  const competencies = user?.directions?.length ? user.directions : ME.tags;
  const availability = user?.availability || [];

  // Заповненість профілю
  const checks: { ok: boolean; rec: string }[] = [
    { ok: !!pr?.photo, rec: 'Додайте фотографію' },
    { ok: !!(pr?.firstName && pr?.lastName), rec: 'Вкажіть імʼя та прізвище' },
    { ok: !!pr?.position, rec: 'Вкажіть посаду' },
    { ok: !!pr?.org, rec: 'Додайте організацію' },
    { ok: !!pr?.city, rec: 'Вкажіть місто' },
    { ok: !!pr?.bio, rec: 'Додайте короткий опис' },
    { ok: (user?.directions?.length || 0) > 0, rec: 'Вкажіть компетенції' },
    { ok: availability.length > 0, rec: 'Виберіть статус доступності' },
    { ok: !!pr?.portfolio, rec: 'Додайте portfolio-посилання' },
  ];
  const done = checks.filter((c) => c.ok).length;
  const pct = Math.round((done / checks.length) * 100);
  const recs = checks.filter((c) => !c.ok).slice(0, 3);

  const menu: { icon: any; label: string; sub?: Sub; onPress?: () => void; badge?: number }[] = [
    { icon: 'bookmark-outline', label: 'Збережене', sub: 'saved' },
    { icon: 'briefcase-outline', label: 'Мої можливості', sub: 'opps' },
    { icon: 'paper-plane-outline', label: 'Мої відгуки', sub: 'apps' },
    { icon: 'calendar-outline', label: 'Мої події', sub: 'events' },
    { icon: 'people-outline', label: 'Запити на знайомство', onPress: onOpenIntros, badge: introCount },
    { icon: 'business-outline', label: 'Мої організації', sub: 'orgs' },
    { icon: 'settings-outline', label: 'Налаштування', sub: 'settings' },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: space(8) }}>
      <View style={{ paddingHorizontal: space(5), paddingTop: space(3), gap: 14 }}>
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <Avatar initials={initials} size={72} verified={user?.verified} />
          <View style={{ flex: 1, gap: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.name}>{name}</Text>
              {user?.verified && <VerificationBadge size={16} />}
            </View>
            <Text style={styles.role}>{role}</Text>
            <Text style={styles.city}>{city}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => onOpenSub('edit')}><Ionicons name="create-outline" size={18} color={colors.ink} /></TouchableOpacity>
        </View>

        {/* Верифікація + доступність */}
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <View style={[styles.pill, { backgroundColor: user?.verified ? colors.accentSoft : colors.chipBg }]}>
            <Ionicons name={user?.verified ? 'checkmark-circle' : 'time-outline'} size={13} color={user?.verified ? colors.accent : colors.dim} />
            <Text style={[styles.pillText, { color: user?.verified ? colors.accent : colors.dim }]}>{user?.verified ? 'Верифіковано' : 'Не верифіковано'}</Text>
          </View>
          {availability.map((a) => <View key={a} style={styles.availPill}><Text style={styles.availText}>{a}</Text></View>)}
        </View>

        {/* Заповненість профілю */}
        {pct < 100 && (
          <View style={styles.completeCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.completeTitle}>Профіль заповнено на {pct}%</Text>
              <Text style={styles.completeCount}>{done}/{checks.length}</Text>
            </View>
            <View style={styles.barTrack}><View style={[styles.barFill, { width: `${pct}%` }]} /></View>
            <View style={{ gap: 6, marginTop: 4 }}>
              {recs.map((r) => (
                <TouchableOpacity key={r.rec} style={styles.recRow} onPress={() => onOpenSub('edit')}>
                  <Ionicons name="add-circle-outline" size={15} color={colors.accent} />
                  <Text style={styles.recText}>{r.rec}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {competencies.map((t) => <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>)}
        </View>
      </View>

      {/* Меню кабінету */}
      <View style={{ paddingHorizontal: space(5), paddingTop: space(4), gap: 8 }}>
        {menu.map((m) => (
          <TouchableOpacity key={m.label} style={styles.linkRow} activeOpacity={0.8} onPress={() => (m.onPress ? m.onPress() : m.sub && onOpenSub(m.sub))}>
            <Ionicons name={m.icon} size={18} color={colors.dim} />
            <Text style={styles.linkRowText}>{m.label}</Text>
            {m.badge ? <View style={[styles.countBadge, { marginLeft: 'auto' }]}><Text style={styles.countText}>{m.badge}</Text></View> : null}
            <Ionicons name="chevron-forward" size={16} color={colors.muted} style={{ marginLeft: m.badge ? 8 : 'auto' }} />
          </TouchableOpacity>
        ))}
        {onOpenGallery && (
          <TouchableOpacity style={styles.linkRow} activeOpacity={0.8} onPress={onOpenGallery}>
            <Ionicons name="color-palette-outline" size={18} color={colors.dim} />
            <Text style={styles.linkRowText}>UI Kit · дизайн-система</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  name: { fontFamily: fonts.extra, color: colors.ink, fontSize: 20, letterSpacing: -0.4 },
  role: { fontFamily: fonts.semi, color: colors.dim, fontSize: 13 },
  city: { fontFamily: fonts.med, color: colors.muted, fontSize: 12 },
  editBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  pillText: { fontFamily: fonts.bold, fontSize: 11 },
  availPill: { backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  availText: { fontFamily: fonts.bold, color: colors.accent, fontSize: 11 },
  completeCard: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.xl, padding: 14, gap: 10 },
  completeTitle: { fontFamily: fonts.bold, color: colors.ink, fontSize: 14 },
  completeCount: { fontFamily: fonts.bold, color: colors.muted, fontSize: 12 },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: colors.chipBg, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: colors.accent },
  recRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recText: { fontFamily: fonts.semi, color: colors.accent, fontSize: 13 },
  tag: { backgroundColor: colors.chipBg, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 5 },
  tagText: { fontFamily: fonts.semi, color: colors.dim, fontSize: 11.5 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 14 },
  linkRowText: { fontFamily: fonts.semi, color: colors.ink, fontSize: 14 },
  countBadge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: '#8A5A00', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  countText: { fontFamily: fonts.bold, color: '#fff', fontSize: 11 },
});
