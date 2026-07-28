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
import { Article, Person } from './src/data';
import { OrgItem, OpportunityItem, EventItem } from './src/shellData';
import { NetworkActions, IntroTarget } from './src/networkStore';
import { Notifications, EntityType } from './src/notificationStore';
import { OPPORTUNITIES, EVENTS } from './src/shellData';
import { findArticle } from './src/data';
import { ContentProvider } from './src/ContentContext';
import { UIProvider } from './src/UIProvider';
import { AuthProvider, useAuth } from './src/AuthContext';
import AnimatedScreen from './src/AnimatedScreen';
import HomeScreen from './src/screens/HomeScreen';
import ReviewFeedScreen from './src/screens/ReviewFeedScreen';
import ArticleScreen from './src/screens/ArticleScreen';
import NetworkScreen from './src/screens/NetworkScreen';
import PersonProfileScreen from './src/screens/PersonProfileScreen';
import OrganizationProfileScreen from './src/screens/OrganizationProfileScreen';
import OpportunitiesScreen from './src/screens/OpportunitiesScreen';
import OpportunityDetailScreen from './src/screens/OpportunityDetailScreen';
import CreateOpportunityScreen from './src/screens/CreateOpportunityScreen';
import EventsScreen from './src/screens/EventsScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';
import CreateEventScreen from './src/screens/CreateEventScreen';
import IntroRequestScreen from './src/screens/IntroRequestScreen';
import IntroHistoryScreen from './src/screens/IntroHistoryScreen';
import EditProfileScreen from './src/screens/profile/EditProfileScreen';
import SavedHubScreen from './src/screens/profile/SavedHubScreen';
import MyOpportunitiesScreen from './src/screens/profile/MyOpportunitiesScreen';
import MyApplicationsScreen from './src/screens/profile/MyApplicationsScreen';
import MyEventsScreen from './src/screens/profile/MyEventsScreen';
import MyOrganizationsScreen from './src/screens/profile/MyOrganizationsScreen';
import SettingsScreen from './src/screens/profile/SettingsScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SearchScreen from './src/screens/SearchScreen';
import SavedScreen from './src/screens/SavedScreen';
import GalleryScreen from './src/screens/GalleryScreen';
import AuthFlow from './src/screens/auth/AuthFlow';
import BlockedScreen from './src/screens/auth/BlockedScreen';
import OnboardingFlow from './src/screens/onboarding/OnboardingFlow';

const SAVED_KEY = 'smr_saved_v1';
const SAVED_NET_KEY = 'smr_saved_net_v1';
const SAVED_OPP_KEY = 'smr_saved_opp_v1';
const SAVED_EVT_KEY = 'smr_saved_evt_v1';

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
  const [person, setPerson] = useState<Person | null>(null);
  const [org, setOrg] = useState<OrgItem | null>(null);
  const [opp, setOpp] = useState<OpportunityItem | null>(null);
  const [createOpp, setCreateOpp] = useState(false);
  const [oppReload, setOppReload] = useState(0);
  const [evt, setEvt] = useState<EventItem | null>(null);
  const [createEvt, setCreateEvt] = useState(false);
  const [evtReload, setEvtReload] = useState(0);
  const [introTarget, setIntroTarget] = useState<IntroTarget | null>(null);
  const [showIntros, setShowIntros] = useState(false);
  const [profileSub, setProfileSub] = useState<'edit' | 'saved' | 'opps' | 'apps' | 'events' | 'orgs' | 'settings' | null>(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [overlay, setOverlay] = useState<'search' | 'saved' | 'gallery' | 'review' | null>(null);
  const [reviewCat, setReviewCat] = useState<string | undefined>(undefined);
  const [saved, setSaved] = useState<string[]>([]);
  const [savedNet, setSavedNet] = useState<string[]>([]);
  const [savedOpp, setSavedOpp] = useState<string[]>([]);
  const [savedEvt, setSavedEvt] = useState<string[]>([]);
  const [savedHydrated, setSavedHydrated] = useState(false);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const framed = Platform.OS === 'web' && width > 500;
  const topPad = Math.max(insets.top, framed ? 14 : 10);

  const [fontsLoaded] = useFonts({ Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold });

  useEffect(() => {
    (async () => {
      try { const raw = await AsyncStorage.getItem(SAVED_KEY); if (raw) setSaved(JSON.parse(raw)); } catch {}
      try { const rawN = await AsyncStorage.getItem(SAVED_NET_KEY); if (rawN) setSavedNet(JSON.parse(rawN)); } catch {}
      try { const rawO = await AsyncStorage.getItem(SAVED_OPP_KEY); if (rawO) setSavedOpp(JSON.parse(rawO)); } catch {}
      try { const rawE = await AsyncStorage.getItem(SAVED_EVT_KEY); if (rawE) setSavedEvt(JSON.parse(rawE)); } catch {}
      NetworkActions.seedDemoIntros().catch(() => {});
      await Notifications.seed().catch(() => {});
      Notifications.unreadCount().then(setUnreadNotifs).catch(() => {});
      setSavedHydrated(true);
    })();
  }, []);
  const refreshUnread = () => Notifications.unreadCount().then(setUnreadNotifs).catch(() => {});
  useEffect(() => { if (savedHydrated) AsyncStorage.setItem(SAVED_KEY, JSON.stringify(saved)).catch(() => {}); }, [saved, savedHydrated]);
  useEffect(() => { if (savedHydrated) AsyncStorage.setItem(SAVED_NET_KEY, JSON.stringify(savedNet)).catch(() => {}); }, [savedNet, savedHydrated]);
  useEffect(() => { if (savedHydrated) AsyncStorage.setItem(SAVED_OPP_KEY, JSON.stringify(savedOpp)).catch(() => {}); }, [savedOpp, savedHydrated]);
  useEffect(() => { if (savedHydrated) AsyncStorage.setItem(SAVED_EVT_KEY, JSON.stringify(savedEvt)).catch(() => {}); }, [savedEvt, savedHydrated]);

  if (!fontsLoaded || auth.loading || !savedHydrated) {
    return <View style={[styles.root, { backgroundColor: colors.bg }]} />;
  }

  const toggleSave = (id: string) => setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleSaveNet = (id: string) => setSavedNet((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleSaveOpp = (id: string) => setSavedOpp((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleSaveEvt = (id: string) => setSavedEvt((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const openArticle = (a: Article) => setArticle(a);
  const openPerson = (p: Person) => setPerson(p);
  const openOrg = (o: OrgItem) => setOrg(o);
  const openOpp = (o: OpportunityItem) => setOpp(o);
  const openEvent = (e: EventItem) => setEvt(e);
  const openIntro = (t: IntroTarget) => setIntroTarget(t);
  const openNotifications = () => setShowNotifs(true);
  const deepLink = (type: EntityType, id?: string): boolean => {
    setShowNotifs(false);
    refreshUnread();
    if (type === 'opportunity' && id) { const o = OPPORTUNITIES.find((x) => x.id === id); if (o) { openOpp(o); return true; } }
    if (type === 'event' && id) { const e = EVENTS.find((x) => x.id === id); if (e) { openEvent(e); return true; } }
    if (type === 'article' && id) { const a = findArticle(id); if (a) { openArticle(a); return true; } }
    if (type === 'intro') { setShowIntros(true); return true; }
    return false;
  };
  const goTab = (k: TabKey) => { setTab(k); setArticle(null); setPerson(null); setOrg(null); setOpp(null); setCreateOpp(false); setEvt(null); setCreateEvt(false); setIntroTarget(null); setShowIntros(false); setProfileSub(null); setShowNotifs(false); setOverlay(null); };

  // ── Root gate ──
  const isMain = auth.user ? (!auth.suspended && !auth.needsOnboarding) : auth.isGuest;

  const tabScreens: { key: TabKey; node: React.ReactNode }[] = [
    { key: 'review', node: <HomeScreen onOpen={openArticle} onOpenSearch={() => setOverlay('search')} onGoTab={goTab} onOpenReviewFeed={(cat) => { setReviewCat(cat); setOverlay('review'); }} saved={saved} onToggleSave={toggleSave} onOpenPerson={openPerson} onOpenOrg={openOrg} onOpenOpportunity={openOpp} onOpenEvent={openEvent} onOpenNotifications={openNotifications} unreadNotifs={unreadNotifs} /> },
    { key: 'network', node: <NetworkScreen onOpenPerson={openPerson} onOpenOrg={openOrg} saved={savedNet} onToggleSave={toggleSaveNet} /> },
    { key: 'opportunities', node: <OpportunitiesScreen onOpen={openOpp} onCreate={() => setCreateOpp(true)} saved={savedOpp} onToggleSave={toggleSaveOpp} reloadKey={oppReload} /> },
    { key: 'events', node: <EventsScreen onOpen={openEvent} onCreate={() => setCreateEvt(true)} saved={savedEvt} onToggleSave={toggleSaveEvt} reloadKey={evtReload} /> },
    { key: 'profile', node: <ProfileScreen onOpenSub={(sub) => setProfileSub(sub)} onOpenGallery={() => setOverlay('gallery')} onOpenIntros={() => setShowIntros(true)} /> },
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
        {overlay === 'search' && <AnimatedScreen onClose={() => setOverlay(null)}>{(close) => <SearchScreen onCancel={close} onOpenArticle={openArticle} onOpenPerson={openPerson} onOpenOrg={openOrg} onOpenOpportunity={openOpp} onOpenEvent={openEvent} />}</AnimatedScreen>}
        {overlay === 'saved' && <AnimatedScreen onClose={() => setOverlay(null)}>{(close) => <SavedScreen saved={saved} onBack={close} onOpen={openArticle} onToggleSave={toggleSave} />}</AnimatedScreen>}
        {overlay === 'gallery' && <AnimatedScreen onClose={() => setOverlay(null)}>{(close) => <GalleryScreen onBack={close} />}</AnimatedScreen>}
        {overlay === 'review' && <AnimatedScreen onClose={() => setOverlay(null)}>{(close) => <ReviewFeedScreen onBack={close} onOpen={openArticle} saved={saved} onToggleSave={toggleSave} initialCategory={reviewCat} />}</AnimatedScreen>}
        {article && <AnimatedScreen onClose={() => setArticle(null)}>{(close) => <ArticleScreen item={article} onBack={close} saved={saved.includes(article.id)} onToggleSave={() => toggleSave(article.id)} onOpen={openArticle} onGoTab={goTab} onOpenPerson={openPerson} onOpenOrg={openOrg} onOpenOpportunity={openOpp} onOpenEvent={openEvent} />}</AnimatedScreen>}
        {person && <AnimatedScreen onClose={() => setPerson(null)}>{(close) => <PersonProfileScreen person={person} onBack={close} saved={savedNet.includes(person.id)} onToggleSave={() => toggleSaveNet(person.id)} onOpenArticle={openArticle} onOpenOrg={openOrg} onOpenIntro={openIntro} />}</AnimatedScreen>}
        {org && <AnimatedScreen onClose={() => setOrg(null)}>{(close) => <OrganizationProfileScreen org={org} onBack={close} saved={savedNet.includes(org.id)} onToggleSave={() => toggleSaveNet(org.id)} onOpenArticle={openArticle} onOpenPerson={openPerson} onGoTab={goTab} onOpenOpportunity={openOpp} onOpenEvent={openEvent} onOpenIntro={openIntro} />}</AnimatedScreen>}
        {opp && <AnimatedScreen onClose={() => setOpp(null)}>{(close) => <OpportunityDetailScreen opp={opp} onBack={close} saved={savedOpp.includes(opp.id)} onToggleSave={() => toggleSaveOpp(opp.id)} onOpenOrg={openOrg} onOpenPerson={openPerson} onOpenIntro={openIntro} />}</AnimatedScreen>}
        {createOpp && <AnimatedScreen onClose={() => setCreateOpp(false)}>{(close) => <CreateOpportunityScreen onBack={close} onCreated={() => { setOppReload((n) => n + 1); close(); goTab('opportunities'); }} />}</AnimatedScreen>}
        {evt && <AnimatedScreen onClose={() => setEvt(null)}>{(close) => <EventDetailScreen event={evt} onBack={close} saved={savedEvt.includes(evt.id)} onToggleSave={() => toggleSaveEvt(evt.id)} onOpenOrg={openOrg} onOpenPerson={openPerson} onOpenArticle={openArticle} onOpenIntro={openIntro} />}</AnimatedScreen>}
        {createEvt && <AnimatedScreen onClose={() => setCreateEvt(false)}>{(close) => <CreateEventScreen onBack={close} onCreated={() => { setEvtReload((n) => n + 1); close(); goTab('events'); }} />}</AnimatedScreen>}
        {introTarget && <AnimatedScreen onClose={() => setIntroTarget(null)}>{(close) => <IntroRequestScreen target={introTarget} onBack={close} onCreated={() => { close(); setShowIntros(true); }} />}</AnimatedScreen>}
        {showIntros && <AnimatedScreen onClose={() => setShowIntros(false)}>{(close) => <IntroHistoryScreen onBack={close} onOpenPerson={openPerson} onOpenOrg={openOrg} />}</AnimatedScreen>}
        {showNotifs && <AnimatedScreen onClose={() => { setShowNotifs(false); refreshUnread(); }}>{(close) => <NotificationsScreen onBack={() => { close(); refreshUnread(); }} onDeepLink={deepLink} />}</AnimatedScreen>}
        {profileSub && (
          <AnimatedScreen onClose={() => setProfileSub(null)}>
            {(close) => (
              profileSub === 'edit' ? <EditProfileScreen onBack={close} />
              : profileSub === 'saved' ? <SavedHubScreen onBack={close} saved={saved} savedNet={savedNet} savedOpp={savedOpp} savedEvt={savedEvt} onToggleSave={toggleSave} onToggleSaveNet={toggleSaveNet} onToggleSaveOpp={toggleSaveOpp} onToggleSaveEvt={toggleSaveEvt} onOpenArticle={openArticle} onOpenPerson={openPerson} onOpenOrg={openOrg} onOpenOpportunity={openOpp} onOpenEvent={openEvent} />
              : profileSub === 'opps' ? <MyOpportunitiesScreen onBack={close} onOpen={openOpp} onCreate={() => { setProfileSub(null); setCreateOpp(true); }} />
              : profileSub === 'apps' ? <MyApplicationsScreen onBack={close} onOpen={openOpp} />
              : profileSub === 'events' ? <MyEventsScreen onBack={close} onOpen={openEvent} />
              : profileSub === 'orgs' ? <MyOrganizationsScreen onBack={close} onOpen={openOrg} />
              : <SettingsScreen onBack={close} />
            )}
          </AnimatedScreen>
        )}
      </>
    );
  }

  const showTabs = isMain && !article && !person && !org && !opp && !createOpp && !evt && !createEvt && !introTarget && !showIntros && !profileSub && !showNotifs && !overlay;

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
