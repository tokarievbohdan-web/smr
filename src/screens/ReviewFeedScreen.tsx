import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView } from 'react-native';
import { colors, space, fonts } from '../theme';
import { useContent } from '../ContentContext';
import { Article, MATERIAL_TYPES, typeLabel } from '../data';
import { AppHeader, ContentCard, FilterChips, EmptyState, ErrorState, SkeletonCard, ListFooter } from '../ui';

const PAGE = 6;

export default function ReviewFeedScreen({
  onBack, onOpen, saved, onToggleSave, initialCategory,
}: {
  onBack: () => void;
  onOpen: (a: Article) => void;
  saved: string[];
  onToggleSave: (id: string) => void;
  initialCategory?: string;
}) {
  const { articles, categories, loading, error, refresh } = useContent();
  const [cat, setCat] = useState(initialCategory || 'Усі');
  const [type, setType] = useState('Усі');
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const catItems = ['Усі', ...categories.map((c) => c.title)];
  const typeItems = ['Усі', ...MATERIAL_TYPES.map((t) => t.label)];

  const filtered = articles.filter((a) =>
    (cat === 'Усі' || a.category === cat) &&
    (type === 'Усі' || typeLabel(a.type) === type)
  );
  const visible = filtered.slice(0, page * PAGE);
  const hasMore = visible.length < filtered.length;

  const onEnd = () => {
    if (hasMore && !loadingMore) {
      setLoadingMore(true);
      setTimeout(() => { setPage((p) => p + 1); setLoadingMore(false); }, 400);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader title="Review" onBack={onBack} />
      <View style={{ paddingHorizontal: space(5), gap: 10, paddingBottom: space(3) }}>
        <FilterChips items={catItems} value={cat} onChange={(v) => { setCat(v); setPage(1); }} />
        <FilterChips items={typeItems} value={type} onChange={(v) => { setType(v); setPage(1); }} />
      </View>

      {error ? (
        <ErrorState onRetry={refresh} />
      ) : loading && articles.length === 0 ? (
        <View style={{ padding: space(5), gap: 16 }}><SkeletonCard /><SkeletonCard /></View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => (
            <ContentCard
              category={item.category} kind={typeLabel(item.type)} title={item.title}
              excerpt={item.subtitle || item.excerpt} meta={`${typeLabel(item.type)} · ${item.readMin} хв · ${item.commentsCount} коментарів`}
              imageUri={item.imageUrl} saved={saved.includes(item.id)} onSave={() => onToggleSave(item.id)} onPress={() => onOpen(item)}
            />
          )}
          contentContainerStyle={{ padding: space(5), paddingTop: 0, gap: 16 }}
          showsVerticalScrollIndicator={false}
          onEndReached={onEnd}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={<EmptyState icon="reader-outline" title="Немає матеріалів" subtitle="Спробуйте інші фільтри." />}
          ListFooterComponent={<ListFooter loading={loadingMore} end={!hasMore && visible.length > 0} />}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({});
