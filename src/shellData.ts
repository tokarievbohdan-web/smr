// Демонстраційні дані для shell-екранів (українською). Замінюються реальними з Supabase.

export interface OrgItem {
  id: string; name: string; type: string; city: string; sports: string[]; verified?: boolean;
}
export const ORGANIZATIONS: OrgItem[] = [
  { id: 'o1', name: 'ФК «Динамо» Київ', type: 'Клуб', city: 'Київ', sports: ['Футбол'], verified: true },
  { id: 'o2', name: 'Українська асоціація футболу', type: 'Федерація', city: 'Київ', sports: ['Футбол'], verified: true },
  { id: 'o3', name: 'Favbet', type: 'Бренд', city: 'Київ', sports: ['Мультиспорт'] },
  { id: 'o4', name: 'MEGOGO Sport', type: 'Медіа', city: 'Київ', sports: ['Мультиспорт'], verified: true },
  { id: 'o5', name: 'Agency 8848', type: 'Агентство', city: 'Львів', sports: ['Маркетинг'] },
];

export interface OpportunityItem {
  id: string; title: string; type: string; org: string; city: string; budget?: string; deadline?: string; status: { label: string; tone: 'info' | 'success' | 'warning' | 'neutral' };
}
export const OPPORTUNITIES: OpportunityItem[] = [
  { id: 'op1', title: 'Head of Sponsorship у футбольний клуб', type: 'Вакансія', org: 'ФК «Динамо» Київ', city: 'Київ', deadline: '15 серпня', status: { label: 'Відкрито', tone: 'success' } },
  { id: 'op2', title: 'Титульне партнерство ліги на сезон 2026/27', type: 'Партнерство', org: 'Українська Прем’єр-ліга', city: 'Україна', budget: '€ обговорюється', deadline: '01 вересня', status: { label: 'Відкрито', tone: 'success' } },
  { id: 'op3', title: 'Тендер: продакшн матчевих трансляцій', type: 'Тендер', org: 'MEGOGO Sport', city: 'Київ', budget: '₴2–3 млн', deadline: '20 серпня', status: { label: 'Дедлайн близько', tone: 'warning' } },
  { id: 'op4', title: 'Послуги: діджитал-активації на матчдей', type: 'Послуга', org: 'Agency 8848', city: 'Львів', status: { label: 'Відкрито', tone: 'success' } },
];
export const OPPORTUNITY_TYPES = ['Усі', 'Вакансія', 'Партнерство', 'Тендер', 'Послуга', 'Інвестиція'];

export interface EventItem {
  id: string; title: string; date: string; city: string; format: string;
}
export const EVENTS: EventItem[] = [
  { id: 'e1', title: 'Sport Business Forum Ukraine 2026', date: '12 вересня', city: 'Київ', format: 'Офлайн' },
  { id: 'e2', title: 'Спонсорство у спорті: практикум для клубів', date: '24 вересня', city: 'Онлайн', format: 'Онлайн' },
  { id: 'e3', title: 'Медіаправа та OTT: круглий стіл', date: '03 жовтня', city: 'Львів', format: 'Офлайн' },
];
export const EVENT_FILTERS = ['Усі', 'Найближчі', 'Онлайн', 'Офлайн'];
export const NETWORK_TABS = ['Люди', 'Організації'];
export const NETWORK_FILTERS = ['Усі', 'Спонсорство', 'Клуби', 'Медіа', 'Київ'];
