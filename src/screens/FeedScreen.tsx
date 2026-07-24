import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { colors, radius, space, fonts } from '../theme';
import { CATEGORIES, NEWS, NewsItem } from '../data';
import { LiveBadge, FormatTag, Dot } from '../components';
import { Ionicons } from '@expo/vector-icons';

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.chip, active && styles.chipOn]}>
        <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

function SaveBtn({ on, onPress }: { on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.saveBtn}>
      <Ionicons
        name={on ? 'bookmark' : 'bookmark-outline'}
        size={18}
        color={on ? colors.accent : colors.textFaint}
      />
    </Pressable>
  );
}

function FeatureCard({ item, onPress, saved, onToggleSave }: {
  item: NewsItem; onPress: () => void; saved: boolean; onToggleSave: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.feature, pressed && styles.pressed]}>
      <View style={styles.featureTop}>
        <LiveBadge label={item.format} />
        <SaveBtn on={saved} onPress={onToggleSave} />
      </View>
      <Text style={styles.featureTitle}>{item.title}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.metaAccent}>{item.source}</Text>
        <Text style={styles.metaDim}> · {item.readMin} мин · {item.reads} читают</Text>
      </View>
    </Pressable>
  );
}

function NewsRow({ item, onPress, saved, onToggleSave }: {
  item: NewsItem; onPress: () => void; saved: boolean; onToggleSave: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.thumb}>
        <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        <View style={styles.rowMeta}>
          <FormatTag format={item.format} />
          <Text style={styles.metaDim}>{item.source} · {item.readMin} мин</Text>
        </View>
      </View>
      <SaveBtn on={saved} onPress={onToggleSave} />
    </Pressable>
  );
}

export default function FeedScreen({
  onOpen,
  interests,
  saved,
  onToggleSave,
}: {
  onOpen: (item: NewsItem) => void;
  interests: string[];
  saved: string[];
  onToggleSave: (id: string) => void;
}) {
  const [cat, setCat] = useState('Всё');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const cats = interests.length ? ['Всё', ...interests] : CATEGORIES;
  const q = query.trim().toLowerCase();

  const featured = NEWS.find((n) => n.featured)!;
  const isSaved = (id: string) => saved.includes(id);

  // Режим поиска — плоский список по всем новостям
  if (q.length > 0) {
    const matches = NEWS.filter((n) => n.title.toLowerCase().includes(q));
    return (
      <View style={{ flex: 1 }}>
        <Header searchOpen onToggleSearch={() => { setSearchOpen(false); setQuery(''); }} />
        <SearchBar value={query} onChange={setQuery} autoFocus />
        <ScrollView contentContainerStyle={{ paddingHorizontal: space(4), paddingBottom: space(6) }}>
          <Text style={styles.searchMeta}>{matches.length} результатов</Text>
          {matches.map((n) => (
            <NewsRow key={n.id} item={n} onPress={() => onOpen(n)} saved={isSaved(n.id)} onToggleSave={() => onToggleSave(n.id)} />
          ))}
          {matches.length === 0 && <Text style={styles.empty}>Ничего не нашлось. Попробуй другой запрос.</Text>}
        </ScrollView>
      </View>
    );
  }

  const rest = NEWS.filter((n) => !n.featured && (cat === 'Всё' || n.category === cat));
  const showFeatured = cat === 'Всё' || featured.category === cat;

  return (
    <View style={{ flex: 1 }}>
      <Header onToggleSearch={() => setSearchOpen((s) => !s)} />
      {searchOpen && <SearchBar value={query} onChange={setQuery} autoFocus />}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: space(6) }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {cats.map((c) => (
            <Chip key={c} label={c} active={cat === c} onPress={() => setCat(c)} />
          ))}
        </ScrollView>

        <View style={{ paddingHorizontal: space(4) }}>
          {showFeatured && (
            <FeatureCard item={featured} onPress={() => onOpen(featured)} saved={isSaved(featured.id)} onToggleSave={() => onToggleSave(featured.id)} />
          )}
          {rest.map((n) => (
            <NewsRow key={n.id} item={n} onPress={() => onOpen(n)} saved={isSaved(n.id)} onToggleSave={() => onToggleSave(n.id)} />
          ))}
          {rest.length === 0 && !showFeatured && (
            <Text style={styles.empty}>В этой теме пока нет свежих материалов.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Header({ onToggleSearch, searchOpen }: { onToggleSearch: () => void; searchOpen?: boolean }) {
  return (
    <View style={styles.appbar}>
      <View style={styles.logo}>
        <Dot />
        <Text style={styles.logoText}>PITCH</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity style={styles.iconBtn} onPress={onToggleSearch}>
          <Ionicons name={searchOpen ? 'close' : 'search'} size={18} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="notifications-outline" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SearchBar({ value, onChange, autoFocus }: { value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  return (
    <View style={styles.searchWrap}>
      <Ionicons name="search" size={16} color={colors.textFaint} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Поиск по новостям…"
        placeholderTextColor={colors.textFaint}
        style={styles.searchInput}
        autoFocus={autoFocus}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  appbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space(4),
    paddingTop: space(2),
    paddingBottom: space(3),
  },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { fontFamily: fonts.serif, color: colors.text, fontSize: 22, fontWeight: '700', letterSpacing: 0.5 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: space(4),
    marginBottom: space(3),
    paddingHorizontal: 14,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.chip,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 15, outlineStyle: 'none' } as any,
  searchMeta: { fontFamily: fonts.mono, color: colors.textFaint, fontSize: 11, paddingVertical: space(2) },

  chips: { gap: 8, paddingHorizontal: space(4), paddingBottom: space(3) },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.chip,
  },
  chipOn: { backgroundColor: colors.accent },
  chipText: { color: colors.textDim, fontSize: 13, fontWeight: '600' },
  chipTextOn: { color: '#fff' },

  feature: {
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space(4),
    marginBottom: space(3),
    gap: 10,
    shadowColor: '#1C1A16',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  featureTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  featureTitle: { fontFamily: fonts.serif, color: colors.text, fontSize: 21, fontWeight: '700', lineHeight: 27, letterSpacing: -0.3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  metaAccent: { fontFamily: fonts.mono, color: colors.accent, fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  metaDim: { fontFamily: fonts.mono, color: colors.textFaint, fontSize: 10.5 },

  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: space(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.line2,
    alignItems: 'center',
  },
  thumb: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.chip,
    borderWidth: 1,
    borderColor: colors.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontFamily: fonts.serif, color: colors.text, fontSize: 16, fontWeight: '700', lineHeight: 21, letterSpacing: -0.2, marginBottom: 6 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveBtn: { padding: 6, alignSelf: 'flex-start' },
  pressed: { opacity: 0.6 },
  empty: { color: colors.textFaint, fontSize: 14, paddingVertical: space(8), textAlign: 'center' },
});
