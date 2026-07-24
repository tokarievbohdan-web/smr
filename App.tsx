import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, space, fonts } from './src/theme';
import { NewsItem, NEWS } from './src/data';
import FeedScreen from './src/screens/FeedScreen';
import ArticleScreen from './src/screens/ArticleScreen';
import ClubScreen from './src/screens/ClubScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { TrendsScreen, ProfileScreen } from './src/screens/StubScreens';

type TabKey = 'feed' | 'trends' | 'club' | 'profile';

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'feed', label: 'Лента', icon: 'flash' },
  { key: 'trends', label: 'Тренды', icon: 'flame' },
  { key: 'club', label: 'Клуб', icon: 'chatbubbles' },
  { key: 'profile', label: 'Профиль', icon: 'person' },
];

function TabBar({ active, onChange }: { active: TabKey; onChange: (k: TabKey) => void }) {
  return (
    <View style={styles.tabbar}>
      {TABS.map((t) => {
        const on = active === t.key;
        return (
          <TouchableOpacity key={t.key} style={styles.tab} activeOpacity={0.7} onPress={() => onChange(t.key)}>
            <Ionicons
              name={on ? t.icon : (`${t.icon}-outline` as any)}
              size={22}
              color={on ? colors.accent : colors.textFaint}
            />
            <Text style={[styles.tabLabel, { color: on ? colors.accent : colors.textFaint }]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function App() {
  const [tab, setTab] = useState<TabKey>('feed');
  const [article, setArticle] = useState<NewsItem | null>(null);
  const [onboarded, setOnboarded] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const { width } = useWindowDimensions();
  const framed = Platform.OS === 'web' && width > 500;

  const toggleSave = (id: string) =>
    setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const savedItems = NEWS.filter((n) => saved.includes(n.id));

  const app = (
    <View style={styles.app}>
      <View style={styles.statusPad}>
        <Text style={styles.clock}>9:41</Text>
        <Text style={styles.status}>5G  ▮▮▮  100%</Text>
      </View>

      <View style={{ flex: 1 }}>
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
        ) : (
          <>
            {tab === 'feed' && (
              <FeedScreen onOpen={setArticle} interests={interests} saved={saved} onToggleSave={toggleSave} />
            )}
            {tab === 'trends' && <TrendsScreen />}
            {tab === 'club' && <ClubScreen />}
            {tab === 'profile' && (
              <ProfileScreen savedItems={savedItems} interestsCount={interests.length} onOpen={setArticle} />
            )}
          </>
        )}
      </View>

      {onboarded && !article && <TabBar active={tab} onChange={setTab} />}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: framed ? '#E4DECF' : colors.bg }]}>
      <StatusBar style="dark" />
      {framed ? <View style={styles.phone}>{app}</View> : app}
    </View>
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
    borderColor: '#1C1A16',
    backgroundColor: colors.bg,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 30 },
  },
  app: { flex: 1, width: '100%', backgroundColor: colors.bg },
  statusPad: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space(5),
    paddingTop: space(3),
    paddingBottom: space(1),
  },
  clock: { fontFamily: fonts.serif, color: colors.text, fontSize: 14, fontWeight: '700' },
  status: { fontFamily: fonts.mono, color: colors.text, fontSize: 11, fontWeight: '600' },
  tabbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: space(2.5),
    paddingBottom: space(4),
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: 'rgba(251,248,241,0.96)',
  },
  tab: { alignItems: 'center', gap: 4 },
  tabLabel: { fontFamily: fonts.mono, fontSize: 9.5, fontWeight: '600', letterSpacing: 0.3 },
});
