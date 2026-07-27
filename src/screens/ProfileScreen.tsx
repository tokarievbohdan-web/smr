import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, radius, space, fonts } from '../theme';
import { ME } from '../data';
import { Photo } from '../components';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';
import { useConfirm } from '../UIProvider';

export default function ProfileScreen({ onOpenSaved, onOpenGallery }: { onOpenSaved: () => void; onOpenGallery?: () => void }) {
  const [tab, setTab] = useState<'comments' | 'saved'>('comments');
  const { user, signOut } = useAuth();
  const confirm = useConfirm();

  const pr = user?.profile;
  const name = [pr?.firstName, pr?.lastName].filter(Boolean).join(' ') || ME.name;
  const role = [pr?.position, pr?.org].filter(Boolean).join(' · ') || ME.role;
  const city = pr?.city || ME.city;
  const bio = pr?.bio || ME.bio;
  const tags = user?.directions?.length ? user.directions : ME.tags;

  const selectSaved = () => {
    setTab('saved');
    onOpenSaved();
  };
  const logout = () => confirm({ title: 'Вийти з акаунта?', confirmLabel: 'Вийти', danger: true, onConfirm: () => signOut() });

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: space(6) }}>
      <View style={{ paddingHorizontal: space(5), paddingTop: space(3), gap: 14 }}>
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <View style={{ width: 72 }}>
            <Photo height={72} round={36} label="фото" />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.role}>{role}</Text>
            <Text style={styles.city}>{city}</Text>
          </View>
        </View>

        <Text style={styles.bio}>{bio}</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {tags.map((t) => (
            <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={styles.btnDark} activeOpacity={0.85}><Text style={styles.btnDarkText}>LinkedIn ↗</Text></TouchableOpacity>
          <TouchableOpacity style={styles.btnOutline} activeOpacity={0.85}><Text style={styles.btnOutlineText}>Поділитися</Text></TouchableOpacity>
        </View>

        <View style={styles.segment}>
          <TouchableOpacity style={[styles.segItem, tab === 'comments' && styles.segActive]} onPress={() => setTab('comments')}>
            <Text style={[styles.segText, tab === 'comments' && styles.segTextActive]}>Коментарі</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.segItem, { borderLeftWidth: 1, borderLeftColor: colors.line }, tab === 'saved' && styles.segActive]} onPress={selectSaved}>
            <Text style={[styles.segText, tab === 'saved' && styles.segTextActive]}>Збережене</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ paddingHorizontal: space(5), paddingTop: space(3), gap: 10 }}>
        {ME.activity.map((a, i) => (
          <View key={i} style={styles.actCard}>
            <Text style={styles.actContext}>{a.context}</Text>
            <Text style={styles.actText}>{a.text}</Text>
            <Text style={styles.actHelpful}>Корисно · {a.helpful}</Text>
          </View>
        ))}

        <TouchableOpacity style={styles.linkRow} activeOpacity={0.8} onPress={onOpenGallery}>
          <Ionicons name="color-palette-outline" size={18} color={colors.dim} />
          <Text style={styles.linkRowText}>UI Kit · дизайн-система</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.muted} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        {user ? (
          <TouchableOpacity style={styles.linkRow} activeOpacity={0.8} onPress={logout}>
            <Ionicons name="log-out-outline" size={18} color="#B42318" />
            <Text style={[styles.linkRowText, { color: '#B42318' }]}>Вийти</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  name: { fontFamily: fonts.extra, color: colors.ink, fontSize: 20, letterSpacing: -0.4 },
  role: { fontFamily: fonts.semi, color: colors.dim, fontSize: 13 },
  city: { fontFamily: fonts.med, color: colors.muted, fontSize: 12 },
  bio: { fontFamily: fonts.med, color: colors.body, fontSize: 13.5, lineHeight: 21 },
  tag: { backgroundColor: colors.chipBg, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 5 },
  tagText: { fontFamily: fonts.semi, color: colors.dim, fontSize: 11.5 },
  btnDark: { flex: 1, height: 46, borderRadius: 12, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' },
  btnDarkText: { fontFamily: fonts.bold, color: '#fff', fontSize: 13.5 },
  btnOutline: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  btnOutlineText: { fontFamily: fonts.bold, color: colors.ink, fontSize: 13.5 },
  segment: { flexDirection: 'row', borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, overflow: 'hidden' },
  segItem: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  segActive: { backgroundColor: colors.soft },
  segText: { fontFamily: fonts.semi, color: colors.muted, fontSize: 13 },
  segTextActive: { fontFamily: fonts.bold, color: colors.ink },
  actCard: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.xl, padding: 14, gap: 6 },
  actContext: { fontFamily: fonts.semi, color: colors.muted, fontSize: 11 },
  actText: { fontFamily: fonts.med, color: colors.body, fontSize: 13, lineHeight: 19 },
  actHelpful: { fontFamily: fonts.bold, color: colors.accent, fontSize: 12 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 14, marginTop: space(2) },
  linkRowText: { fontFamily: fonts.semi, color: colors.ink, fontSize: 14 },
});

