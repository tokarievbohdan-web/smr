import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { colors, radius, space, fonts } from '../theme';
import { CATEGORIES, NEWS, NewsItem, timeAgo } from '../data';
import { LiveBadge, FormatTag, Dot } from '../components';
import { Ionicons } from '@expo/vector-icons';

const PAGE = 6;

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
      <Ionicons name={on ? 'bookmark' : 'bookmark-outline'} size={18} color={on ? colors.text : colors.textFaint} />
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
        <Text style={styles.metaDim}> · {timeAgo(item.agoMin)} · {item.reads} читают</Text>
      </View>
    </Pressable>
  );
}

function NewsRow({ item, onPress, saved, onToggleSave, read }: {
  item: NewsItem; onPress: () => void; saved: boolean; onToggleSave: () => void; read: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.thumb, read && styles.dim]}>
        <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, read && styles.rowTitleRead]}>{item.title}</Text>
        <View style={styles.rowMeta}>
          {read ? (
            <Ionicons name="checkmark-circle" size={13} color={colors.textFaint} />
          ) : (
            <FormatTag format={item.format} />
          )}
          <Text style={styles.metaDim}>{item.source} · {timeAgo(item.agoMin)}</Text>
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
  read,
}: {
  onOpen: (item: NewsItem) => void;
  interests: string[];
  saved: string[];
  onToggleSave: (id: string) => void;
  read: string[];
}) {
  const [cat, setCat] = useState('Всё');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const cats = interests.length ? ['Всё', ...interests] : CATEGORIES;
  const q = query.trim().toLowerCase();
  const inSearch = q.length > 0;

  const featured = NEWS.find((n) => n.featured)!;
  const isSaved = (id: string) => saved.includes(id);
  const isRead = (id: string) => read.includes(id);

  const base = inSearch
    ? NEWS.filter((n) => n.title.toLowerCase().includes(q))
    : NEWS.filter((n) => !n.featured && (cat === 'Всё' || n.category === cat));

  const showFeatured = !inSearch && (cat === 'Всё' || featured.category === cat);
  const visible = inSearch ? base : base.slice(0, page * PAGE);
  const hasMore = !inSearch && visible.length < base.length;

  const selectCat = (c: string) => {
    setCat(c);
    setPage(1);
  };

  const onEndReached = () => {
    if (hasMore && !loadingMore) {
      setLoadingMore(true);
      setTimeout(() => {
        setPage((p) => p + 1);
        setLoadingMore(false);
      }, 450);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setPage(1);
      setRefreshing(false);
    }, 900);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery('');
  };

  const header = (
    <View>
      {!inSearch && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {cats.map((c) => (
            <Chip key={c} label={c} active={cat === c} onPress={() => selectCat(c)} />
          ))}
        </ScrollView>
      )}
      {inSearch && <Text style={styles.searchMeta}>{base.length} результатов</Text>}
      {showFeatured && (
        <FeatureCard item={featured} onPress={() => onOpen(featured)} saved={isSaved(featured.id)} onToggleSave={() => onToggleSave(featured.id)} />
      )}
    </View>
  );

  const footer = () => {
    if (loadingMore) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator color={colors.textFaint} />
        </View>
      );
    }
    if (!inSearch && !hasMore && visible.length > 0) {
      return <Text style={styles.footerEnd}>Больше новостей нет</Text>;
    }
    return <View style={{ height: space(4) }} />;
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.appbar}>
        <View style={styles.logo}>
          <Dot />
          <Text style={styles.logoText}>SMR</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => (searchOpen ? closeSearch() : setSearchOpen(true))}>
            <Ionicons name={searchOpen ? 'close' : 'search'} size={18} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {searchOpen && (
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={colors.textFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Поиск по новостям…"
            placeholderTextColor={colors.textFaint}
            style={styles.searchInput}
            autoFocus
          />
        </View>
      )}

      <FlatList
        data={visible}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <NewsRow item={item} onPress={() => onOpen(item)} saved={isSaved(item.id)} onToggleSave={() => onToggleSave(item.id)} read={isRead(item.id)} />
        )}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        ListEmptyComponent={
          inSearch ? <Text style={styles.empty}>Ничего не нашлось. Попробуй другой запрос.</Text> : null
        }
        contentContainerStyle={{ paddingHorizontal: space(4), paddingBottom: space(6) }}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textFaint} colors={[colors.text]} />
        }
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
  logoText: { fontFamily: fonts.black, color: colors.text, fontSize: 22, letterSpacing: 0.3 },
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
  searchInput: { flex: 1, color: colors.text, fontSize: 15, fontFamily: fonts.body, outlineStyle: 'none' } as any,
  searchMeta: { fontFamily: fonts.mono, color: colors.textFaint, fontSize: 11, paddingVertical: space(2) },

  chips: { gap: 8, paddingBottom: space(3) },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.chip,
  },
  chipOn: { backgroundColor: colors.accent },
  chipText: { fontFamily: fonts.med, color: colors.textDim, fontSize: 13 },
  chipTextOn: { color: colors.onAccent },

  feature: {
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space(4),
    marginBottom: space(3),
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  featureTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  featureTitle: { fontFamily: fonts.serif, color: colors.text, fontSize: 21, lineHeight: 27, letterSpacing: -0.3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  metaAccent: { fontFamily: fonts.mono, color: colors.text, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.4 },
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
  dim: { opacity: 0.5 },
  rowTitle: { fontFamily: fonts.serif, color: colors.text, fontSize: 16, lineHeight: 21, letterSpacing: -0.2, marginBottom: 6 },
  rowTitleRead: { color: colors.textDim },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveBtn: { padding: 6, alignSelf: 'flex-start' },
  pressed: { opacity: 0.6 },
  empty: { fontFamily: fonts.body, color: colors.textFaint, fontSize: 14, paddingVertical: space(8), textAlign: 'center' },
  footer: { paddingVertical: space(5), alignItems: 'center' },
  footerEnd: { fontFamily: fonts.mono, color: colors.textFaint, fontSize: 11, textAlign: 'center', paddingVertical: space(5) },
});
