import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, radius, space, fonts } from '../theme';
import { useContent } from '../ContentContext';
import { Avatar, Chip } from '../components';
import { Ionicons } from '@expo/vector-icons';

const FILTERS = ['Усі', 'Спонсорство', 'Клуби', 'Київ'];

export default function CommunityScreen() {
  const [filter, setFilter] = useState('Усі');
  const { people: PEOPLE } = useContent();
  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: space(5), paddingTop: space(2), gap: 14 }}>
        <Text style={styles.title}>Спільнота</Text>
        <View style={styles.search}>
          <Ionicons name="search-outline" size={16} color={colors.muted} />
          <Text style={styles.searchPh}>Ім'я, компанія або спеціалізація</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {FILTERS.map((f) => (
            <Chip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
          ))}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: space(5), gap: 10, paddingBottom: space(6) }}>
        {PEOPLE.map((p) => (
          <View key={p.id} style={styles.row}>
            <Avatar initials={p.initials} size={48} shade={p.shade} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.name}>{p.name}</Text>
              <Text style={styles.role}>{p.role}</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                {p.tags.map((t) => (
                  <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
                ))}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.extra, color: colors.ink, fontSize: 24, letterSpacing: -0.5 },
  search: { height: 46, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  searchPh: { fontFamily: fonts.med, color: colors.muted, fontSize: 13.5 },
  row: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.xxl, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' },
  name: { fontFamily: fonts.bold, color: colors.ink, fontSize: 14.5 },
  role: { fontFamily: fonts.med, color: colors.dim, fontSize: 12 },
  tag: { backgroundColor: colors.chipBg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontFamily: fonts.semi, color: colors.dim, fontSize: 10.5 },
});
