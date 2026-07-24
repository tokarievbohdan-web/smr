import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { colors, space, fonts } from './src/theme';
import { Article, Discussion } from './src/data';
import OnboardingScreen from './src/screens/OnboardingScreen';
import FeedScreen from './src/screens/FeedScreen';
import ArticleScreen from './src/screens/ArticleScreen';
import DiscussionsScreen from './src/screens/DiscussionsScreen';
import DiscussionDetailScreen from './src/screens/DiscussionDetailScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SearchScreen from './src/screens/SearchScreen';
import SavedScreen from './src/screens/SavedScreen';

const STORE_KEY = 'smc_state_v1';

type TabKey = 'home' | 'discussions' | 'community' | 'profile';

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'home', label: 'Головна', icon: 'home' },
  { key: 'discussions', label: 'Обговорення', icon: 'chatbubble-ellipses' },
  { key: 'community', label: 'Спільнота', icon: 'people' },
  { key: 'profile', label: 'Профіль', icon: 'person' },
];

function TabBar({ active, onChange, bottomInset }: { active: TabKey; onChange: (k: TabKey) => void; bottomInset: number }) {
  return (
    <View style={[styles.tabbar, { paddingBottom: Math.max(bottomInset, space(3)) }]}>
      {TABS.map((t) => {
        const on = active === t.key;
        return (
          <TouchableOpacity key={t.key} style={styles.tab} activeOpacity={0.7} onPress={() => onChange(t.key)}>
            <Ionicons name={on ? t.icon : (`${t.icon}-outline` as any)} size={21} color={on ? colors.accent : colors.muted} />
            <Text style={[styles.tabLabel, { color: on ? colors.accent : colors.muted }]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function AppInner() {
  const [tab, setTab] = useState<TabKey>('home');
  const [article, setArticle] = useState<Article | null>(null);
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [overlay, setOverlay] = useState<'search' | 'saved' | null>(null);
  const [onboarded, setOnboarded] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const framed = Platform.OS === 'web' && width > 500;
  const topPad = Math.max(insets.top, framed ? 14 : 10);

  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORE_KEY);
        if (raw) {
          const s = JSON.parse(raw);
          setOnboarded(!!s.onboarded);
          setInterests(Array.isArray(s.interests) ? s.interests : []);
          setSaved(Array.isArray(s.saved) ? s.saved : []);
        }
      } catch {}
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORE_KEY, JSON.stringify({ onboarded, interests, saved })).catch(() => {});
  }, [hydrated, onboarded, interests, saved]);

  if (!fontsLoaded || !hydrated) {
    return <View style={[styles.root, { backgroundColor: colors.bg }]} />;
  }

  const toggleSave = (id: string) => setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const openArticle = (a: Article) => setArticle(a);
  const openDiscussion = (d: Discussion) => setDiscussion(d);
  const goTab = (k: TabKey) => {
    setTab(k);
    setArticle(null);
    setDiscussion(null);
    setOverlay(null);
  };

  let content: React.ReactNode;
  if (!onboarded) {
    content = <OnboardingScreen onDone={(picked) => { setInterests(picked); setOnboarded(true); }} />;
  } else if (article) {
    content = <ArticleScreen item={article} onBack={() => setArticle(null)} saved={saved.includes(article.id)} onToggleSave={() => toggleSave(article.id)} />;
  } else if (discussion) {
    content = <DiscussionDetailScreen item={discussion} onBack={() => setDiscussion(null)} />;
  } else if (overlay === 'search') {
    content = <SearchScreen onCancel={() => setOverlay(null)} onOpen={openArticle} onOpenDiscussion={openDiscussion} />;
  } else if (overlay === 'saved') {
    content = <SavedScreen saved={saved} onBack={() => setOverlay(null)} onOpen={openArticle} onToggleSave={toggleSave} />;
  } else if (tab === 'home') {
    content = <FeedScreen onOpen={openArticle} onOpenSearch={() => setOverlay('search')} onGoDiscussions={() => setTab('discussions')} onOpenDiscussion={openDiscussion} saved={saved} onToggleSave={toggleSave} />;
  } else if (tab === 'discussions') {
    content = <DiscussionsScreen onOpen={openDiscussion} />;
  } else if (tab === 'community') {
    content = <CommunityScreen />;
  } else {
    content = <ProfileScreen onOpenSaved={() => setOverlay('saved')} />;
  }

  const showTabs = onboarded && !article && !discussion && !overlay;

  const app = (
    <View style={styles.app}>
      <View style={{ flex: 1, paddingTop: topPad }}>{content}</View>
      {showTabs && <TabBar active={tab} onChange={goTab} bottomInset={insets.bottom} />}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: framed ? colors.canvas : colors.bg }]}>
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
    height: 844,
    maxHeight: '96%',
    borderRadius: 44,
    overflow: 'hidden',
    borderWidth: 10,
    borderColor: '#16181D',
    backgroundColor: colors.bg,
    shadowColor: '#000',
    shadowOpacity: 0.35,
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
    backgroundColor: '#fff',
  },
  tab: { alignItems: 'center', gap: 4, flex: 1 },
  tabLabel: { fontFamily: fonts.semi, fontSize: 10.5 },
});
