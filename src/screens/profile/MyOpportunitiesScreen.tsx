import React, { useEffect, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { colors, space } from '../../theme';
import { OpportunityItem, OPPORTUNITIES, oppStatus } from '../../shellData';
import { OpportunityStore } from '../../opportunityStore';
import { useAuth } from '../../AuthContext';
import { AppHeader, FilterChips, OpportunityCard, EmptyState, Button } from '../../ui';

const ALL = 'Усі';

export default function MyOpportunitiesScreen({ onBack, onOpen, onCreate }: {
  onBack: () => void; onOpen: (o: OpportunityItem) => void; onCreate: () => void;
}) {
  const { user } = useAuth();
  const [items, setItems] = useState<{ opp: OpportunityItem; statusLabel: { label: string; tone: any } }[]>([]);
  const [filter, setFilter] = useState(ALL);

  useEffect(() => {
    (async () => {
      const created = await OpportunityStore.listCreated();
      const mine = OPPORTUNITIES.filter((o) => user?.profile?.org && o.org === user.profile.org);
      const all = [...created, ...mine];
      const withStatus = await Promise.all(all.map(async (opp) => {
        const override = await OpportunityStore.getOppState(opp.id);
        return { opp, statusLabel: override ? oppStatus(override) : opp.status };
      }));
      setItems(withStatus);
    })();
  }, [user]);

  const statuses = [ALL, ...Array.from(new Set(items.map((i) => i.statusLabel.label)))];
  const list = items.filter((i) => filter === ALL || i.statusLabel.label === filter);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader title="Мої можливості" onBack={onBack} right={<Button label="Створити" size="sm" icon="add" variant="primary" onPress={onCreate} />} />
      {items.length > 0 && (
        <View style={{ paddingHorizontal: space(5), paddingBottom: space(2) }}>
          <FilterChips items={statuses} value={filter} onChange={setFilter} />
        </View>
      )}
      <ScrollView contentContainerStyle={{ padding: space(5), paddingTop: space(2), gap: 12 }} showsVerticalScrollIndicator={false}>
        {list.length ? list.map(({ opp, statusLabel }) => (
          <OpportunityCard key={opp.id} title={opp.title} type={opp.type} org={opp.org} city={opp.city}
            budget={opp.budgetVisibility === 'Публічний' ? opp.budget : undefined} deadline={opp.deadline}
            statusLabel={statusLabel} sport={opp.sport} format={opp.format} applications={opp.applicationsCount}
            verified={opp.verified} onPress={() => onOpen(opp)} />
        )) : <EmptyState icon="briefcase-outline" title="Немає можливостей" subtitle="Опублікуйте можливість — вона зʼявиться тут із відгуками." action="Створити" onAction={onCreate} />}
      </ScrollView>
    </View>
  );
}
