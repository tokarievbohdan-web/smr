// Демонстраційні дані для shell-екранів (українською). Замінюються реальними з Supabase.
import { ContactLink, ProjectItem, TeamMember } from './data';

export interface OrgItem {
  id: string; name: string; type: string; city: string; sports: string[]; verified?: boolean;
  cover?: string; shortDesc?: string; fullDesc?: string; country?: string; region?: string;
  website?: string; founded?: string; audience?: string;
  socials?: ContactLink[]; contacts?: ContactLink[]; team?: TeamMember[];
  services?: string[]; directions?: string[]; partners?: string[]; portfolio?: ProjectItem[];
  relatedArticles?: string[]; activeOpportunities?: string[]; events?: string[];
}
export const ORGANIZATIONS: OrgItem[] = [
  {
    id: 'o1', name: 'ФК «Динамо» Київ', type: 'Клуб', city: 'Київ', region: 'Київська', country: 'Україна',
    sports: ['Футбол'], verified: true,
    shortDesc: 'Професійний футбольний клуб із власною комерційною та медіапрограмою.',
    fullDesc: 'Один із провідних футбольних клубів України. Розвиває спонсорські партнерства, матчдей-активації та власні медіапродукти. Активно працює з брендами у категоріях fintech, retail і телеком.',
    website: 'dynamo.ua', founded: '1927', audience: '4.2 млн підписників у соцмережах',
    socials: [
      { type: 'instagram', label: 'Instagram', value: 'instagram.com/dynamo' },
      { type: 'youtube', label: 'YouTube', value: 'youtube.com/dynamo' },
    ],
    contacts: [{ type: 'email', label: 'Комерційний відділ', value: 'partners@dynamo.ua' }],
    team: [
      { name: 'Олена Ковальчук', role: 'Head of Sponsorship', initials: 'ОК' },
      { name: 'Ірина Савченко', role: 'Commercial Director', initials: 'ІС' },
    ],
    services: ['Спонсорські пакети', 'Матчдей-активації', 'Медіарозміщення'],
    directions: ['Спонсорство', 'Медіа', 'Комерція'],
    partners: ['Fintech-бренд', 'Телеком-оператор', 'Спортивний ритейл'],
    portfolio: [{ title: 'Реферальна програма матчдею', desc: '94% заповнюваність трибун і −40% CAC для спонсора.' }],
    relatedArticles: ['a2', 'a1'], activeOpportunities: ['op1'], events: ['e1'],
  },
  {
    id: 'o2', name: 'Українська асоціація футболу', type: 'Федерація', city: 'Київ', region: 'Київська', country: 'Україна',
    sports: ['Футбол'], verified: true,
    shortDesc: 'Керівний орган футболу в Україні.',
    fullDesc: 'Централізує комерційні права, формує єдиний стандарт спонсорських пакетів і координує роботу з брендами-партнерами національних збірних та турнірів.',
    website: 'uaf.ua', founded: '1991', audience: 'Національні збірні та турніри',
    socials: [{ type: 'facebook', label: 'Facebook', value: 'facebook.com/uaf' }],
    contacts: [{ type: 'email', label: 'Партнерства', value: 'commercial@uaf.ua' }],
    team: [{ name: 'Ірина Савченко', role: 'Commercial Director', initials: 'ІС' }],
    services: ['Централізовані права', 'Спонсорські пакети збірних'],
    directions: ['Управління', 'Комерція'],
    partners: ['Титульний партнер турніру'],
    portfolio: [{ title: 'Єдиний стандарт пакетів', desc: 'Прозоре пакетування прав для брендів.' }],
    relatedArticles: ['a7', 'a3'], activeOpportunities: ['op2'], events: ['e1'],
  },
  {
    id: 'o3', name: 'Favbet', type: 'Бренд', city: 'Київ', region: 'Київська', country: 'Україна',
    sports: ['Мультиспорт'], verified: false,
    shortDesc: 'Бренд у категорії iGaming зі спонсорськими активаціями у спорті.',
    fullDesc: 'Інвестує у спортивне спонсорство з фокусом на відповідальні активації та вимірювану атрибуцію. Працює з клубами й лігами у категорії джерсі-розміщень.',
    website: 'favbet.ua', founded: '2007', audience: 'Спортивна аудиторія 21+',
    socials: [{ type: 'instagram', label: 'Instagram', value: 'instagram.com/favbet' }],
    contacts: [{ type: 'email', label: 'Маркетинг', value: 'sponsorship@favbet.ua' }],
    team: [{ name: 'Данило Бондар', role: 'Sponsorship Manager', initials: 'ДБ' }],
    services: ['Спонсорські розміщення', 'Матчдей-активації'],
    directions: ['iGaming', 'Спонсорство', 'Маркетинг'],
    partners: ['Футбольні клуби', 'Кіберспортивні організації'],
    portfolio: [], relatedArticles: ['a8'], activeOpportunities: [], events: [],
  },
  {
    id: 'o4', name: 'MEGOGO Sport', type: 'Медіа', city: 'Львів', region: 'Львівська', country: 'Україна',
    sports: ['Мультиспорт'], verified: true,
    shortDesc: 'Спортивна медіаплатформа й OTT-сервіс.',
    fullDesc: 'Транслює спортивні події та розвиває власні медіапродукти. Пропонує брендам рекламний інвентар у прямих трансляціях і цифрових активаціях.',
    website: 'megogo.net', founded: '2011', audience: 'Понад 3 млн глядачів спорту',
    socials: [{ type: 'youtube', label: 'YouTube', value: 'youtube.com/megogosport' }],
    contacts: [{ type: 'email', label: 'Реклама', value: 'ads@megogo.net' }],
    team: [{ name: 'Андрій Мельник', role: 'CMO', initials: 'АМ' }],
    services: ['Трансляції', 'Рекламний інвентар', 'Продакшн'],
    directions: ['Медіа', 'Технології', 'Продакшн'],
    partners: ['Ліги', 'Клуби', 'Бренди'],
    portfolio: [{ title: 'Запуск клубного OTT', desc: 'D2C-модель із прямим володінням аудиторією.' }],
    relatedArticles: ['a4'], activeOpportunities: ['op3'], events: ['e3'],
  },
  {
    id: 'o5', name: 'Agency 8848', type: 'Агентство', city: 'Львів', region: 'Львівська', country: 'Україна',
    sports: ['Мультиспорт'], verified: false,
    shortDesc: 'Маркетингова агенція для спортивних брендів і клубів.',
    fullDesc: 'Створює діджитал-активації, матчдей-досвід і контент для спортивних організацій. Спеціалізується на перформанс-кампаніях і соціальних механіках.',
    website: 'agency8848.com', founded: '2018', audience: 'B2B — клуби та бренди',
    socials: [{ type: 'instagram', label: 'Instagram', value: 'instagram.com/agency8848' }],
    contacts: [{ type: 'email', label: 'Нові проєкти', value: 'hello@agency8848.com' }],
    team: [],
    services: ['Діджитал-активації', 'Контент', 'Матчдей-досвід'],
    directions: ['Маркетинг', 'Продакшн', 'Технології'],
    partners: ['Клуби', 'Спортивні бренди'],
    portfolio: [{ title: 'Активації на матчдей', desc: 'Соціальні механіки з вимірюваним залученням.' }],
    relatedArticles: [], activeOpportunities: ['op4'], events: [],
  },
];
export const findOrg = (id: string) => ORGANIZATIONS.find((o) => o.id === id);

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

// ── Довідники Мережі (керовані значення для фільтрів) ──
export const SPORTS_LIST = ['Футбол', 'Баскетбол', 'Волейбол', 'Теніс', 'Єдиноборства', 'Хокей', 'Кіберспорт', 'Мультиспорт'];
export const DIRECTIONS = ['Спонсорство', 'Маркетинг', 'Медіа', 'Комерція', 'Управління', 'Продакшн', 'Технології', 'Аналітика', 'Івенти', 'iGaming', 'Research'];
export const CITIES = ['Київ', 'Львів', 'Харків', 'Дніпро', 'Одеса', 'Варшава'];
export const REGIONS = ['Київська', 'Львівська', 'Харківська', 'Дніпропетровська', 'Одеська'];

export const AVAILABILITY_STATUSES = [
  'Відкритий до роботи',
  'Відкритий до проєктів',
  'Шукаю партнерів',
  'Шукаю інвестиції',
  'Готовий бути спікером',
  'Не розглядаю пропозиції',
];

// 18 типів організацій (укр. підписи використовуються як значення type)
export const ORG_TYPES = [
  'Клуб', 'Федерація', 'Ліга', 'Бренд', 'Агентство', 'Медіа', 'SportsTech', 'Стартап',
  'Інвестор', 'Фонд', 'Арена', 'Академія', 'Спортивна школа', 'ГО', 'Держорганізація',
  'Організатор подій', 'Продакшн', 'Постачальник послуг', 'Інше',
];

export const PEOPLE_SORT = ['Рекомендовані', 'За іменем', 'Спочатку верифіковані'];
export const ORG_SORT = ['Рекомендовані', 'За назвою', 'Спочатку верифіковані', 'З можливостями'];

// Рекомендовані профілі (кураторський підбір для порожнього стану)
export const RECOMMENDED_PEOPLE = ['p1', 'p2', 'p3'];
export const RECOMMENDED_ORGS = ['o1', 'o4', 'o2'];
