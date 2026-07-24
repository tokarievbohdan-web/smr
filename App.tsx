import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { colors, space, fonts } from './src/theme';
import { NewsItem, NEWS } from './src/data';
import FeedScreen from './src/screens/FeedScreen';
import ArticleScreen from './src/screens/ArticleScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { ProfileScreen } from './src/screens/StubScreens';

const STORE_KEY = 'smr_state_v1';

type TabKey = 'feed' | 'profile';

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'feed', label: 'Лента', icon: 'newspaper' },
  { key: 'profile', label: 'Профиль', icon: 'person' },
];

function TabBar({ active, onChange, bottomInset }: { active: TabKey; onChange: (k: TabKey) => void; bottomInset: number }) {
  return (
    <View style={[styles.tabbar, { paddingBottom: Math.max(bottomInset, space(3)) }]}>
      {TABS.map((t) => {
        const on = active === t.key;
        return (
          <TouchableOpacity key={t.key} style={styles.tab} activeOpacity={0.7} onPress={() => onChange(t.key)}>
            <Ionicons name={on ? t.icon : (`${t.icon}-outline` as any)} size={23} color={on ? colors.text : colors.textFaint} />
            <Text style={[styles.tabLabel, { color: on ? colors.text : colors.textFaint }]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function AppInner() {
  const [tab, setTab] = useState<TabKey>('feed');
  const [article, setArticle] = useState<NewsItem | null>(null);
  const [onboarded, setOnboarded] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [read, setRead] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const framed = Platform.OS === 'web' && width > 500;
  const topPad = Math.max(insets.top, framed ? 14 : 10);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  // Загрузка сохранённого состояния
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORE_KEY);
        if (raw) {
          const s = JSON.parse(raw);
          setOnboarded(!!s.onboarded);
          setInterests(Array.isArray(s.interests) ? s.interests : []);
          setSaved(Array.isArray(s.saved) ? s.saved : []);
          setRead(Array.isArray(s.read) ? s.read : []);
        }
      } catch {}
      setHydrated(true);
    })();
  }, []);

  // Сохранение состояния
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORE_KEY, JSON.stringify({ onboarded, interests, saved, read })).catch(() => {});
  }, [hydrated, onboarded, interests, saved, read]);

  if (!fontsLoaded || !hydrated) {
    return <View style={[styles.root, { backgroundColor: colors.bg }]} />;
  }

  const toggleSave = (id: string) =>
    setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const savedItems = NEWS.filter((n) => saved.includes(n.id));

  const openArticle = (item: NewsItem) => {
    setArticle(item);
    setRead((r) => (r.includes(item.id) ? r : [...r, item.id]));
  };

  const app = (
    <View style={styles.app}>
      <View style={{ flex: 1, paddingTop: topPad }}>
        {!onboarded ? (
          <OnboardingScreen
            onDone={(picked) => {
              setInterests(picked);
              setOnboarded(true);
            }}
          />
        ) : article ? (
          <ArticleScreen
            item={article}
            onBack={() => setArticle(null)}
            saved={saved.includes(article.id)}
            onToggleSave={() => toggleSave(article.id)}
          />
        ) : tab === 'feed' ? (
          <FeedScreen onOpen={openArticle} interests={interests} saved={saved} onToggleSave={toggleSave} read={read} />
        ) : (
          <ProfileScreen savedItems={savedItems} interestsCount={interests.length} onOpen={openArticle} />
        )}
      </View>

      {onboarded && !article && <TabBar active={tab} onChange={setTab} bottomInset={insets.bottom} />}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: framed ? '#E4E4E7' : colors.bg }]}>
      <StatusBar style="dark" />
      {framed ? <View style={styles.phone}>{app}</View> : app}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppInner />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  phone: {
    width: 400,
    height: 840,
    maxHeight: '96%',
    borderRadius: 44,
    overflow: 'hidden',
    borderWidth: 10,
    borderColor: '#111112',
    backgroundColor: colors.bg,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 30 },
  },
  app: { flex: 1, width: '100%', backgroundColor: colors.bg },
  tabbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: space(2.5),
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: 'rgba(255,255,255,0.96)',
  },
  tab: { alignItems: 'center', gap: 4, paddingHorizontal: space(6) },
  tabLabel: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.3 },
});
