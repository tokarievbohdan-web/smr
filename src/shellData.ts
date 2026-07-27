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

export type Tone = 'info' | 'success' | 'warning' | 'neutral' | 'danger';
export type BudgetVisibility = 'Публічний' | 'За запитом' | 'Не вказаний';

export interface Applicant {
  id: string; name: string; role: string; initials: string; shade?: number;
  message: string; portfolio?: string; status: string; // ключ зі статусів відгуку
}
export interface OpportunityItem {
  id: string; title: string; type: string; org: string; city: string;
  budget?: string; deadline?: string; status: { label: string; tone: Tone };
  // Розширені поля (PROMPT 07)
  sport?: string; geography?: string; format?: string; professionalCategory?: string;
  budgetVisibility?: BudgetVisibility; budgetFrom?: number; budgetTo?: number; currency?: string;
  publishedAt?: string; expiresAt?: string; shortDesc?: string; fullDesc?: string;
  contactMethod?: string; externalLink?: string; tags?: string[];
  applicationsCount?: number; verified?: boolean; featured?: boolean; recommended?: boolean;
  applicants?: Applicant[];
}
export const OPPORTUNITIES: OpportunityItem[] = [
  {
    id: 'op1', title: 'Head of Sponsorship у футбольний клуб', type: 'Вакансія', org: 'ФК «Динамо» Київ', city: 'Київ',
    sport: 'Футбол', geography: 'Київ', format: 'Офлайн', professionalCategory: 'Спонсорство',
    budgetVisibility: 'За запитом', deadline: '15 серпня', publishedAt: '18 липня 2026', expiresAt: '15 серпня 2026',
    shortDesc: 'Шукаємо керівника напряму спонсорства для розвитку партнерських програм клубу.',
    fullDesc: 'ФК «Динамо» Київ шукає Head of Sponsorship. Ви відповідатимете за пошук категорійних брендів, пакетування прав, переговори й активації на матчдей. Досвід у спортивній або медійній комерції від 3 років.',
    contactMethod: 'Через застосунок', tags: ['Спонсорство', 'Партнерства', 'B2B'], applicationsCount: 3, verified: true, recommended: true,
    status: { label: 'Опубліковано', tone: 'success' },
    applicants: [
      { id: 'ap1', name: 'Данило Бондар', role: 'Sponsorship Manager · Варшава', initials: 'ДБ', shade: 0, message: 'Маю 4 роки у спонсорських активаціях, готовий обговорити деталі.', portfolio: 'linkedin.com/in/dbondar', status: 'shortlisted' },
      { id: 'ap2', name: 'Марія Ткаченко', role: 'Спортивний менеджмент · Київ', initials: 'МТ', shade: 1, message: 'Шукаю першу роль у спонсорстві, сильна аналітика ринку.', portfolio: 'maria.pdf', status: 'new' },
      { id: 'ap3', name: 'Андрій Мельник', role: 'CMO · медіаплатформа · Львів', initials: 'АМ', shade: 2, message: 'Цікавить напрям, маю релевантний медіадосвід.', status: 'viewed' },
    ],
  },
  {
    id: 'op2', title: 'Титульне партнерство ліги на сезон 2026/27', type: 'Партнерство', org: 'Українська Прем’єр-ліга', city: 'Україна',
    sport: 'Футбол', geography: 'Україна', format: 'Гібрид', professionalCategory: 'Комерція',
    budgetVisibility: 'За запитом', budget: '€ обговорюється', deadline: '01 вересня', publishedAt: '20 липня 2026', expiresAt: '01 вересня 2026',
    shortDesc: 'Ліга відкриває категорію титульного партнера на новий сезон.',
    fullDesc: 'Пропонуємо права титульного партнера турніру: нейминг, медіапокриття, digital-активації та кешбек абонементникам. Пріоритет — категорії fintech, telecom, retail.',
    contactMethod: 'Email', externalLink: 'upl.ua/partners', tags: ['Титульне', 'Медіа', 'Fintech'], applicationsCount: 5, verified: true, featured: true,
    status: { label: 'Опубліковано', tone: 'success' },
  },
  {
    id: 'op3', title: 'Тендер: продакшн матчевих трансляцій', type: 'Тендер', org: 'MEGOGO Sport', city: 'Львів',
    sport: 'Мультиспорт', geography: 'Львів', format: 'Офлайн', professionalCategory: 'Продакшн',
    budgetVisibility: 'Публічний', budget: '₴2–3 млн', budgetFrom: 2000000, budgetTo: 3000000, currency: '₴',
    deadline: '20 серпня', publishedAt: '19 липня 2026', expiresAt: '20 серпня 2026',
    shortDesc: 'Оголошуємо тендер на продакшн матчевих трансляцій сезону.',
    fullDesc: 'Потрібен підрядник для продакшну матчевих трансляцій: багатокамерна зйомка, графіка, режисура, доставлення сигналу. Обовʼязковий досвід спортивного продакшну.',
    contactMethod: 'Email', tags: ['Продакшн', 'OTT', 'Трансляції'], applicationsCount: 2, verified: true,
    status: { label: 'Дедлайн близько', tone: 'warning' },
  },
  {
    id: 'op4', title: 'Послуги: діджитал-активації на матчдей', type: 'Послуга', org: 'Agency 8848', city: 'Львів',
    sport: 'Мультиспорт', geography: 'Львів', format: 'Гібрид', professionalCategory: 'Маркетинг',
    budgetVisibility: 'Не вказаний', publishedAt: '17 липня 2026',
    shortDesc: 'Пропонуємо послуги діджитал-активацій та матчдей-досвіду для клубів.',
    fullDesc: 'Агенція пропонує діджитал-активації, соціальні механіки й контент для матчдею. Портфоліо кампаній із вимірюваним залученням.',
    contactMethod: 'Через застосунок', tags: ['Активації', 'Контент'], applicationsCount: 0,
    status: { label: 'Опубліковано', tone: 'success' },
  },
  {
    id: 'op5', title: 'Спонсорський пакет жіночої команди', type: 'Спонсорство', org: 'ФК «Динамо» Київ', city: 'Київ',
    sport: 'Футбол', geography: 'Київ', format: 'Офлайн', professionalCategory: 'Спонсорство',
    budgetVisibility: 'Публічний', budget: 'від ₴500 тис', budgetFrom: 500000, currency: '₴',
    deadline: '10 вересня', publishedAt: '24 липня 2026', expiresAt: '10 вересня 2026',
    shortDesc: 'Відкриваємо категорійні пакети для партнерів жіночої команди.',
    fullDesc: 'Пропонуємо спонсорські пакети навколо жіночої футбольної команди: джерсі, контент-серіал, соціальні активації. Окрема комерційна пропозиція на запит.',
    contactMethod: 'Через застосунок', tags: ['Жіночий спорт', 'Спонсорство'], applicationsCount: 1, verified: true, featured: true, recommended: true,
    status: { label: 'Опубліковано', tone: 'success' },
  },
  {
    id: 'op6', title: 'Пошук інвестицій для sports-tech стартапу', type: 'Інвестиція', org: 'Sportech UA', city: 'Київ',
    sport: 'Мультиспорт', geography: 'Європа', format: 'Віддалено', professionalCategory: 'Технології',
    budgetVisibility: 'За запитом', deadline: '30 вересня', publishedAt: '23 липня 2026', expiresAt: '30 вересня 2026',
    shortDesc: 'Стартап у сфері аналітики матчів шукає seed-інвестиції.',
    fullDesc: 'Sports-tech стартап (аналітика матчевих даних) залучає seed-раунд. Є MVP і перші пілоти з клубами. Шукаємо профільного інвестора або фонд.',
    contactMethod: 'Email', externalLink: 'sportech.ua', tags: ['SportsTech', 'Seed', 'Аналітика'], applicationsCount: 4,
    status: { label: 'Опубліковано', tone: 'success' },
  },
];
export const findOpportunity = (id: string) => OPPORTUNITIES.find((o) => o.id === id);

// ── Довідники Можливостей (PROMPT 07) ──
export const OPPORTUNITY_TYPE_LABELS = [
  'Спонсорство', 'Партнерство', 'Вакансія', 'Проєктна робота', 'Тендер', 'Послуга', 'Інвестиція',
  'Грант', 'Медіапартнерство', 'Пошук амбасадора', 'Пошук майданчика', 'Пошук спікера', 'Волонтерство', 'Інше',
];
export const OPPORTUNITY_TYPES = ['Усі', ...OPPORTUNITY_TYPE_LABELS];
export const WORK_FORMATS = ['Офлайн', 'Віддалено', 'Гібрид'];
export const BUDGET_VISIBILITY: BudgetVisibility[] = ['Публічний', 'За запитом', 'Не вказаний'];
export const CURRENCIES = ['₴', '€', '$'];
export const GEO_LIST = ['Україна', 'Київ', 'Львів', 'Харків', 'Дніпро', 'Одеса', 'Європа', 'Віддалено'];

// Статуси публікації можливості
export const OPP_STATUSES: { key: string; label: string; tone: Tone }[] = [
  { key: 'draft', label: 'Чернетка', tone: 'neutral' },
  { key: 'pending', label: 'На модерації', tone: 'warning' },
  { key: 'published', label: 'Опубліковано', tone: 'success' },
  { key: 'changes', label: 'Потрібні правки', tone: 'warning' },
  { key: 'paused', label: 'Призупинено', tone: 'neutral' },
  { key: 'closed', label: 'Закрито', tone: 'neutral' },
  { key: 'rejected', label: 'Відхилено', tone: 'danger' },
  { key: 'expired', label: 'Прострочено', tone: 'neutral' },
  { key: 'archived', label: 'Архів', tone: 'neutral' },
];
export const oppStatus = (key: string) => OPP_STATUSES.find((s) => s.key === key) || OPP_STATUSES[0];

// Статуси відгуку
export const APPLICATION_STATUSES: { key: string; label: string; tone: Tone }[] = [
  { key: 'new', label: 'Новий', tone: 'info' },
  { key: 'viewed', label: 'Переглянуто', tone: 'neutral' },
  { key: 'shortlisted', label: 'Шорт-ліст', tone: 'success' },
  { key: 'contacted', label: 'Звʼязалися', tone: 'info' },
  { key: 'accepted', label: 'Прийнято', tone: 'success' },
  { key: 'rejected', label: 'Відхилено', tone: 'danger' },
  { key: 'withdrawn', label: 'Відкликано', tone: 'neutral' },
];
export const appStatus = (key: string) => APPLICATION_STATUSES.find((s) => s.key === key) || APPLICATION_STATUSES[0];

export interface EventSpeaker { name: string; role: string; initials: string; shade?: number }
export interface EventItem {
  id: string; title: string; date: string; city: string; format: string;
  // Розширені поля (PROMPT 08)
  type?: string; organizer?: string; org?: string; time?: string; timezone?: string;
  venue?: string; cost?: string; isPaid?: boolean; ticketUrl?: string;
  seatsTotal?: number; seatsLeft?: number; regDeadline?: string;
  shortDesc?: string; fullDesc?: string; cover?: string;
  speakers?: EventSpeaker[]; partners?: string[]; tags?: string[]; relatedArticles?: string[];
  featured?: boolean; thisWeek?: boolean; status?: { label: string; tone: Tone };
}
export const EVENTS: EventItem[] = [
  {
    id: 'e1', title: 'Sport Business Forum Ukraine 2026', type: 'Форум', date: '12 вересня', city: 'Київ',
    format: 'Офлайн', organizer: 'Sport Market Review', org: 'o4', time: '10:00', timezone: 'EET (UTC+2)',
    venue: 'Parkovy Convention Center, Київ', cost: '₴2 500', isPaid: true, ticketUrl: 'concert.ua/smr-forum',
    seatsTotal: 400, seatsLeft: 58, regDeadline: '08 вересня', featured: true,
    shortDesc: 'Головна щорічна подія спортивного бізнесу України.',
    fullDesc: 'Форум збирає клуби, ліги, бренди й агенції для обговорення комерціалізації спорту: спонсорство, медіаправа, інфраструктура, інвестиції. Панелі, кейси й нетворкінг-сесії.',
    speakers: [
      { name: 'Олена Ковальчук', role: 'Head of Sponsorship · ФК «Динамо»', initials: 'ОК', shade: 0 },
      { name: 'Ірина Савченко', role: 'Commercial Director · УАФ', initials: 'ІС', shade: 2 },
      { name: 'Андрій Мельник', role: 'CMO · MEGOGO Sport', initials: 'АМ', shade: 1 },
    ],
    partners: ['MEGOGO Sport', 'Favbet', 'Українська Прем’єр-ліга'],
    tags: ['Спонсорство', 'Медіа', 'Інвестиції'], relatedArticles: ['a1', 'a3'],
  },
  {
    id: 'e2', title: 'Спонсорство у спорті: практикум для клубів', type: 'Воркшоп', date: '24 вересня', city: 'Україна',
    format: 'Онлайн', organizer: 'Agency 8848', org: 'o5', time: '18:00', timezone: 'EET (UTC+2)',
    cost: 'Безкоштовно', isPaid: false, seatsTotal: 200, seatsLeft: 0, regDeadline: '23 вересня', thisWeek: true,
    shortDesc: 'Практичний вебінар про побудову спонсорських пакетів.',
    fullDesc: 'Розбираємо, як клубу зібрати комерційну пропозицію, оцінити інвентар і вести перемовини з брендами. З прикладами та шаблонами.',
    speakers: [{ name: 'Данило Бондар', role: 'Sponsorship Manager', initials: 'ДБ', shade: 0 }],
    partners: [], tags: ['Спонсорство', 'Практикум'], relatedArticles: ['a2'],
  },
  {
    id: 'e3', title: 'Медіаправа та OTT: круглий стіл', type: 'Конференція', date: '03 жовтня', city: 'Львів',
    format: 'Гібрид', organizer: 'MEGOGO Sport', org: 'o4', time: '12:00', timezone: 'EET (UTC+2)',
    venue: 'Lviv Media Hub', cost: '₴900', isPaid: true, ticketUrl: 'megogo.net/roundtable',
    seatsTotal: 120, seatsLeft: 34, regDeadline: '01 жовтня',
    shortDesc: 'Дискусія про монетизацію медіаправ і власні OTT-платформи.',
    fullDesc: 'Мовники, клуби та ліги обговорюють майбутнє медіаправ: D2C проти класичного продажу прав, утримання аудиторії, рекламний інвентар.',
    speakers: [{ name: 'Андрій Мельник', role: 'CMO · MEGOGO Sport', initials: 'АМ', shade: 1 }],
    partners: ['MEGOGO Sport'], tags: ['Медіа', 'OTT'], relatedArticles: ['a4'],
  },
  {
    id: 'e4', title: 'Sport Business Networking Night', type: 'Нетворкінг', date: '18 вересня', city: 'Київ',
    format: 'Офлайн', organizer: 'Sport Market Review', time: '19:00', timezone: 'EET (UTC+2)',
    venue: 'Roof Bar, Київ', cost: '₴500', isPaid: true, ticketUrl: 'concert.ua/smr-night',
    seatsTotal: 150, seatsLeft: 12, regDeadline: '17 вересня', thisWeek: true,
    shortDesc: 'Вечір знайомств для професіоналів спортивної індустрії.',
    fullDesc: 'Неформальний нетворкінг для клубів, брендів, агенцій і медіа. Формат коротких знайомств і вільного спілкування.',
    speakers: [], partners: ['Favbet'], tags: ['Нетворкінг'], relatedArticles: [],
  },
  {
    id: 'e5', title: 'Sport Marketing Awards 2026', type: 'Премія', date: '25 жовтня', city: 'Київ',
    format: 'Офлайн', organizer: 'Sport Market Review', time: '18:30', timezone: 'EET (UTC+2)',
    venue: 'Fairmont Grand Hotel, Київ', cost: 'від ₴1 800', isPaid: true, ticketUrl: 'concert.ua/sma2026',
    seatsTotal: 300, seatsLeft: 140, regDeadline: '20 жовтня', featured: true,
    shortDesc: 'Щорічна премія за найкращі кейси спортивного маркетингу.',
    fullDesc: 'Урочиста церемонія нагородження найкращих спонсорських і маркетингових кейсів року. Понад 12 номінацій.',
    speakers: [], partners: ['MEGOGO Sport', 'Українська Прем’єр-ліга'], tags: ['Маркетинг', 'Кейси'], relatedArticles: ['a6'],
  },
  {
    id: 'e6', title: 'Дедлайн подання на грант розвитку клубів', type: 'Дедлайн', date: '30 вересня', city: 'Онлайн',
    format: 'Онлайн', organizer: 'Українська асоціація футболу', org: 'o2', time: '23:59', timezone: 'EET (UTC+2)',
    cost: 'Безкоштовно', isPaid: false, regDeadline: '30 вересня',
    shortDesc: 'Останній день подання заявок на грантову програму.',
    fullDesc: 'Дедлайн подання заявок на програму грантів для розвитку інфраструктури клубів. Подання — через сайт організатора.',
    speakers: [], partners: [], tags: ['Грант', 'Дедлайн'], ticketUrl: 'uaf.ua/grants', relatedArticles: [],
  },
];
export const findEvent = (id: string) => EVENTS.find((e) => e.id === id);

// ── Довідники Подій (PROMPT 08) ──
export const EVENT_TYPE_LABELS = [
  'Конференція', 'Форум', 'Вебінар', 'Нетворкінг', 'Воркшоп', 'Презентація', 'Премія',
  'Спортивно-діловий івент', 'Спільнотна подія', 'Освітня програма', 'Дедлайн', 'Інше',
];
export const EVENT_TYPES = ['Усі', ...EVENT_TYPE_LABELS];
export const EVENT_FORMATS = ['Онлайн', 'Офлайн', 'Гібрид'];
export const EVENT_FILTERS = ['Усі', 'Найближчі', 'Онлайн', 'Офлайн'];

// Статуси реєстрації на подію
export const REGISTRATION_STATUSES: { key: string; label: string; tone: Tone }[] = [
  { key: 'registered', label: 'Зареєстровано', tone: 'success' },
  { key: 'waitlist', label: 'Список очікування', tone: 'warning' },
  { key: 'cancelled', label: 'Скасовано', tone: 'neutral' },
  { key: 'attended', label: 'Відвідав', tone: 'info' },
  { key: 'noshow', label: 'Не прийшов', tone: 'danger' },
];
export const regStatus = (key: string) => REGISTRATION_STATUSES.find((s) => s.key === key) || REGISTRATION_STATUSES[0];
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
