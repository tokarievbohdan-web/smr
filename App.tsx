import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { colors, space, fonts } from './src/theme';
import { Article } from './src/data';
import { ContentProvider } from './src/ContentContext';
import { UIProvider } from './src/UIProvider';
import { AuthProvider, useAuth } from './src/AuthContext';
import AnimatedScreen from './src/AnimatedScreen';
import HomeScreen from './src/screens/HomeScreen';
import ReviewFeedScreen from './src/screens/ReviewFeedScreen';
import ArticleScreen from './src/screens/ArticleScreen';
import NetworkScreen from './src/screens/NetworkScreen';
import OpportunitiesScreen from './src/screens/OpportunitiesScreen';
import EventsScreen from './src/screens/EventsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SearchScreen from './src/screens/SearchScreen';
import SavedScreen from './src/screens/SavedScreen';
import GalleryScreen from './src/screens/GalleryScreen';
import AuthFlow from './src/screens/auth/AuthFlow';
import BlockedScreen from './src/screens/auth/BlockedScreen';
import OnboardingFlow from './src/screens/onboarding/OnboardingFlow';

const SAVED_KEY = 'smr_saved_v1';

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
  const auth = useAuth();
  const [tab, setTab] = useState<TabKey>('review');
  const [article, setArticle] = useState<Article | null>(null);
  const [overlay, setOverlay] = useState<'search' | 'saved' | 'gallery' | 'review' | null>(null);
  const [reviewCat, setReviewCat] = useState<string | undefined>(undefined);
  const [saved, setSaved] = useState<string[]>([]);
  const [savedHydrated, setSavedHydrated] = useState(false);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const framed = Platform.OS === 'web' && width > 500;
  const topPad = Math.max(insets.top, framed ? 14 : 10);

  const [fontsLoaded] = useFonts({ Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold });

  useEffect(() => {
    (async () => {
      try { const raw = await AsyncStorage.getItem(SAVED_KEY); if (raw) setSaved(JSON.parse(raw)); } catch {}
      setSavedHydrated(true);
    })();
  }, []);
  useEffect(() => { if (savedHydrated) AsyncStorage.setItem(SAVED_KEY, JSON.stringify(saved)).catch(() => {}); }, [saved, savedHydrated]);

  if (!fontsLoaded || auth.loading || !savedHydrated) {
    return <View style={[styles.root, { backgroundColor: colors.bg }]} />;
  }

  const toggleSave = (id: string) => setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const openArticle = (a: Article) => setArticle(a);
  const goTab = (k: TabKey) => { setTab(k); setArticle(null); setOverlay(null); };

  // ── Root gate ──
  const isMain = auth.user ? (!auth.suspended && !auth.needsOnboarding) : auth.isGuest;

  const tabScreens: { key: TabKey; node: React.ReactNode }[] = [
    { key: 'review', node: <HomeScreen onOpen={openArticle} onOpenSearch={() => setOverlay('search')} onGoTab={goTab} onOpenReviewFeed={(cat) => { setReviewCat(cat); setOverlay('review'); }} saved={saved} onToggleSave={toggleSave} /> },
    { key: 'network', node: <NetworkScreen /> },
    { key: 'opportunities', node: <OpportunitiesScreen /> },
    { key: 'events', node: <EventsScreen /> },
    { key: 'profile', node: <ProfileScreen onOpenSaved={() => setOverlay('saved')} onOpenGallery={() => setOverlay('gallery')} /> },
  ];

  let gate: React.ReactNode;
  if (!auth.user && !auth.isGuest) {
    gate = <AuthFlow />;
  } else if (auth.user && auth.suspended) {
    gate = <BlockedScreen />;
  } else if (auth.user && auth.needsOnboarding) {
    gate = <OnboardingFlow />;
  } else {
    gate = (
      <>
        {tabScreens.map((t) => (
          <View key={t.key} style={{ flex: 1, display: tab === t.key ? 'flex' : 'none' }}>{t.node}</View>
        ))}
        {overlay === 'search' && <AnimatedScreen onClose={() => setOverlay(null)}>{(close) => <SearchScreen onCancel={close} onOpen={openArticle} />}</AnimatedScreen>}
        {overlay === 'saved' && <AnimatedScreen onClose={() => setOverlay(null)}>{(close) => <SavedScreen saved={saved} onBack={close} onOpen={openArticle} onToggleSave={toggleSave} />}</AnimatedScreen>}
        {overlay === 'gallery' && <AnimatedScreen onClose={() => setOverlay(null)}>{(close) => <GalleryScreen onBack={close} />}</AnimatedScreen>}
        {overlay === 'review' && <AnimatedScreen onClose={() => setOverlay(null)}>{(close) => <ReviewFeedScreen onBack={close} onOpen={openArticle} saved={saved} onToggleSave={toggleSave} initialCategory={reviewCat} />}</AnimatedScreen>}
        {article && <AnimatedScreen onClose={() => setArticle(null)}>{(close) => <ArticleScreen item={article} onBack={close} saved={saved.includes(article.id)} onToggleSave={() => toggleSave(article.id)} onOpen={openArticle} onGoTab={goTab} />}</AnimatedScreen>}
      </>
    );
  }

  const showTabs = isMain && !article && !overlay;

  const app = (
    <View style={styles.app}>
      <UIProvider>
        <View style={{ flex: 1, paddingTop: topPad }}>{gate}</View>
        {showTabs && <TabBar active={tab} onChange={goTab} bottomInset={insets.bottom} />}
        {auth.authPrompt && (
          <AnimatedScreen onClose={auth.dismissPrompt}>
            {(close) => <AuthFlow modal onClose={close} />}
          </AnimatedScreen>
        )}
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
        <AuthProvider>
          <AppInner />
        </AuthProvider>
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
  tabbar: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: space(2.5), borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: '#fff' },
  tab: { alignItems: 'center', gap: 4, flex: 1, paddingHorizontal: 2 },
  tabLabel: { fontFamily: fonts.semi, fontSize: 9.5 },
});
