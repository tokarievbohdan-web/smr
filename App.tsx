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
import { Article } from './src/data';
import { ContentProvider } from './src/ContentContext';
import { UIProvider } from './src/UIProvider';
import AnimatedScreen from './src/AnimatedScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import FeedScreen from './src/screens/FeedScreen';
import ArticleScreen from './src/screens/ArticleScreen';
import NetworkScreen from './src/screens/NetworkScreen';
import OpportunitiesScreen from './src/screens/OpportunitiesScreen';
import EventsScreen from './src/screens/EventsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SearchScreen from './src/screens/SearchScreen';
import SavedScreen from './src/screens/SavedScreen';
import GalleryScreen from './src/screens/GalleryScreen';

const STORE_KEY = 'smc_state_v1';

type TabKey = 'review' | 'network' | 'opportunities' | 'events' | 'profile';

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'review', label: 'Огляд', icon: 'reader' },
  { key: 'network', label: 'Мережа', icon: 'people' },
  { key: 'opportunities', label: 'Можливості', icon: 'briefcase' },
  { key: 'events', label: 'Події', icon: 'calendar' },
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
            <Text style={[styles.tabLabel, { color: on ? colors.accent : colors.muted }]} numberOfLines={1}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function AppInner() {
  const [tab, setTab] = useState<TabKey>('review');
  const [article, setArticle] = useState<Article | null>(null);
  const [overlay, setOverlay] = useState<'search' | 'saved' | 'gallery' | null>(null);
  const [onboarded, setOnboarded] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const framed = Platform.OS === 'web' && width > 500;
  const topPad = Math.max(insets.top, framed ? 14 : 10);

  const [fontsLoaded] = useFonts({
    Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold,
  });

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORE_KEY);
        if (raw) {
          const st = JSON.parse(raw);
          setOnboarded(!!st.onboarded);
          setInterests(Array.isArray(st.interests) ? st.interests : []);
          setSaved(Array.isArray(st.saved) ? st.saved : []);
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
  const goTab = (k: TabKey) => {
    setTab(k);
    setArticle(null);
    setOverlay(null);
  };

  // Усі таби змонтовані — стан і позиція списків зберігаються при перемиканні
  const tabScreens: { key: TabKey; node: React.ReactNode }[] = [
    { key: 'review', node: <FeedScreen onOpen={openArticle} onOpenSearch={() => setOverlay('search')} saved={saved} onToggleSave={toggleSave} /> },
    { key: 'network', node: <NetworkScreen /> },
    { key: 'opportunities', node: <OpportunitiesScreen /> },
    { key: 'events', node: <EventsScreen /> },
    { key: 'profile', node: <ProfileScreen onOpenSaved={() => setOverlay('saved')} onOpenGallery={() => setOverlay('gallery')} /> },
  ];

  const showTabs = onboarded && !article && !overlay;

  const app = (
    <View style={styles.app}>
      <UIProvider>
        <View style={{ flex: 1, paddingTop: topPad }}>
          {!onboarded ? (
            <OnboardingScreen onDone={(picked) => { setInterests(picked); setOnboarded(true); }} />
          ) : (
            <>
              {tabScreens.map((t) => (
                <View key={t.key} style={{ flex: 1, display: tab === t.key ? 'flex' : 'none' }}>{t.node}</View>
              ))}

              {overlay === 'search' && (
                <AnimatedScreen onClose={() => setOverlay(null)}>
                  {(close) => <SearchScreen onCancel={close} onOpen={openArticle} />}
                </AnimatedScreen>
              )}
              {overlay === 'saved' && (
                <AnimatedScreen onClose={() => setOverlay(null)}>
                  {(close) => <SavedScreen saved={saved} onBack={close} onOpen={openArticle} onToggleSave={toggleSave} />}
                </AnimatedScreen>
              )}
              {overlay === 'gallery' && (
                <AnimatedScreen onClose={() => setOverlay(null)}>
                  {(close) => <GalleryScreen onBack={close} />}
                </AnimatedScreen>
              )}
              {article && (
                <AnimatedScreen onClose={() => setArticle(null)}>
                  {(close) => <ArticleScreen item={article} onBack={close} saved={saved.includes(article.id)} onToggleSave={() => toggleSave(article.id)} />}
                </AnimatedScreen>
              )}
            </>
          )}
        </View>
        {showTabs && <TabBar active={tab} onChange={goTab} bottomInset={insets.bottom} />}
      </UIProvider>
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
      <ContentProvider>
        <AppInner />
      </ContentProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  phone: {
    width: 400, height: 844, maxHeight: '96%', borderRadius: 44, overflow: 'hidden',
    borderWidth: 10, borderColor: '#16181D', backgroundColor: colors.bg,
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 60, shadowOffset: { width: 0, height: 30 },
  },
  app: { flex: 1, width: '100%', backgroundColor: colors.bg },
  tabbar: {
    flexDirection: 'row', justifyContent: 'space-around', paddingTop: space(2.5),
    borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: '#fff',
  },
  tab: { alignItems: 'center', gap: 4, flex: 1, paddingHorizontal: 2 },
  tabLabel: { fontFamily: fonts.semi, fontSize: 9.5 },
});
