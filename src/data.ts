// Контент Sport Market Review — модель Review + демо-дані (українською)

export type MaterialType =
  | 'News' | 'Case Study' | 'Interview' | 'Research' | 'Insight' | 'Opinion' | 'Guide' | 'Ranking' | 'Partner Material';

export const MATERIAL_TYPES: { id: MaterialType; label: string }[] = [
  { id: 'News', label: 'Новина' },
  { id: 'Case Study', label: 'Кейс' },
  { id: 'Interview', label: 'Інтервʼю' },
  { id: 'Research', label: 'Дослідження' },
  { id: 'Insight', label: 'Інсайт' },
  { id: 'Opinion', label: 'Колонка' },
  { id: 'Guide', label: 'Гайд' },
  { id: 'Ranking', label: 'Рейтинг' },
  { id: 'Partner Material', label: 'Партнерський' },
];
export const typeLabel = (t?: string) => MATERIAL_TYPES.find((m) => m.id === t)?.label || t || '';

// Категорії — керований довідник (fallback, якщо CMS порожня)
export interface Category { id: string; title: string }
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'industry', title: 'Індустрія' },
  { id: 'governance', title: 'Управління' },
  { id: 'commercial', title: 'Комерція' },
  { id: 'marketing', title: 'Маркетинг' },
  { id: 'case-studies', title: 'Кейси' },
  { id: 'insights', title: 'Інсайти' },
  { id: 'igaming', title: 'iGaming' },
  { id: 'media', title: 'Медіа' },
  { id: 'technology', title: 'Технології' },
  { id: 'infrastructure', title: 'Інфраструктура' },
  { id: 'investments', title: 'Інвестиції' },
  { id: 'community-sport', title: 'Масовий спорт' },
];

export type BodyBlock =
  | { type: 'text'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'quote'; text: string; author?: string }
  | { type: 'image'; label: string }
  | { type: 'table'; headers: string[]; rows: string[][] };

export interface Author { name: string; role: string; initials: string }
export interface Stat { value: string; label: string }
export interface CaseStudy {
  campaign: string; brand: string; org: string; country: string; sport: string;
  task: string; audience: string; mechanics: string; channels: string[];
  results: string[]; takeaway: string; ukraine: string;
}

export interface Article {
  id: string;
  type: MaterialType;
  category: string;        // title категорії
  title: string;
  subtitle?: string;
  excerpt: string;
  photo: string;
  imageUrl?: string;
  author: Author;
  date: string;
  readMin: number;
  commentsCount: number;
  topToday?: boolean;
  body: BodyBlock[];
  stats?: Stat[];
  facts?: string[];
  why?: string;
  conclusion?: string;
  source?: string;
  savedNote?: string;
  caseStudy?: CaseStudy;
  relatedOrgs?: string[];      // ids ORGANIZATIONS
  relatedPeople?: string[];    // ids PEOPLE
  relatedOpportunities?: string[]; // ids OPPORTUNITIES
  relatedEvents?: string[];    // ids EVENTS
  comments: Comment[];
}

export interface Comment { author: string; role: string; initials: string; text: string; helpful: number; reply?: boolean }

const A = (name: string, role: string, initials: string): Author => ({ name, role, initials });
const RED = A('Редакція SMR', 'Sport Market Review', 'SM');

export const ARTICLES: Article[] = [
  {
    id: 'a1',
    type: 'News',
    category: 'Маркетинг',
    title: 'Nike запускає глобальну кампанію навколо жіночого футболу',
    subtitle: 'Найбільша інвестиція бренду в жіночий спорт за пʼять років',
    excerpt: 'Бренд представив кампанію за участю футболісток національних збірних — від амбасадорок до власної культурної платформи.',
    photo: 'кадр з кампанії Nike',
    author: A('Марія Левченко', 'Редакторка · маркетинг', 'МЛ'),
    date: '24 липня 2026',
    readMin: 4,
    commentsCount: 12,
    topToday: true,
    body: [
      { type: 'text', text: 'Nike представив глобальну кампанію за участю футболісток національних збірних. Це найбільша інвестиція бренду в жіночий футбол за останні пʼять років.' },
      { type: 'quote', text: 'Це не спонсорство ради логотипа — це перформанс-канал з прямою атрибуцією на продажі.', author: 'Керівник маркетингу бренду' },
      { type: 'image', label: 'ключовий візуал кампанії' },
      { type: 'text', text: 'Кампанія охоплює 20 країн і поєднує медійний охват з локальними активаціями клубів-партнерів.' },
    ],
    facts: ['12 футболісток із 8 збірних', 'Запуск у 20 країнах одночасно', 'Окрема лінійка екіпірування та контент-серіал'],
    why: 'Бренд переходить від підтримки окремих спортсменок до створення власної культурної платформи навколо жіночого спорту — і забирає цю територію раніше за конкурентів.',
    conclusion: 'Жіночий спорт стає окремою спонсорською категорією з власними бюджетами. Клубам варто готувати окремі комерційні пропозиції вже зараз.',
    source: 'SportsPro Media',
    savedNote: 'збережено сьогодні',
    relatedOrgs: ['o3', 'o1'],
    relatedPeople: ['p1', 'p2'],
    relatedOpportunities: ['op2'],
    relatedEvents: ['e1'],
    comments: [
      { author: 'Олена Ковальчук', role: 'Head of Sponsorship · ФК «Динамо»', initials: 'ОК', text: 'Важливо, що Nike робить це платформою, а не разовою акцією. Для клубів це сигнал продавати жіночі команди окремо.', helpful: 18 },
      { author: 'Андрій Мельник', role: 'CMO · спортивна платформа', initials: 'АМ', text: 'Медіаметрики жіночого футболу зросли кратно — бюджети підуть слідом.', helpful: 7, reply: true },
    ],
  },
  {
    id: 'a2',
    type: 'Case Study',
    category: 'Кейси',
    title: 'Як банк зібрав повний стадіон через реферальну програму',
    subtitle: 'Кейс: перетворення білетів на перформанс-канал',
    excerpt: 'Спонсор зробив білети вимірюваним каналом: приведи друга — отримай місце поруч і кешбек.',
    photo: 'фото стадіону',
    author: A('Ірина Савченко', 'Commercial Director', 'ІС'),
    date: '22 липня 2026',
    readMin: 8,
    commentsCount: 26,
    topToday: false,
    body: [
      { type: 'text', text: 'Локальний банк шукав спосіб довести ROI спонсорства без прямих продажів. Рішенням стала реферальна механіка навколо матчдею.' },
      { type: 'heading', text: 'Що зробили' },
      { type: 'text', text: 'Кожен вболівальник отримував персональне посилання: приведи друга — обидва отримують знижку і місця поруч.' },
    ],
    caseStudy: {
      campaign: '«Приведи друга на матч»',
      brand: 'Регіональний банк',
      org: 'ФК «Динамо» Київ',
      country: 'Україна',
      sport: 'Футбол',
      task: 'Довести ROI спонсорського пакета без прямого e-commerce.',
      audience: 'Вболівальники 25–45, власники абонементів та їхнє коло.',
      mechanics: 'Реферальні посилання в застосунку клубу з трекінгом і миттєвою нагородою (знижка + місця поруч).',
      channels: ['Застосунок клубу', 'SMS', 'Email', 'Матчдей-екрани'],
      results: ['94% заповнюваність трибун', '−40% вартість залучення (CAC)', '+18% повторних відвідувань'],
      takeaway: 'Дефіцит і соціальний контекст (місця поруч з друзями) продають краще за знижку.',
      ukraine: 'Модель легко відтворити для українських клубів середнього розміру — потрібен лише застосунок з реферальним трекінгом.',
    },
    stats: [{ value: '94%', label: 'заповнено' }, { value: '−40%', label: 'CAC' }],
    conclusion: 'Білети стають перформанс-інвентарем — з атрибуцією, а не лише охопленням.',
    source: 'SMR Кейси',
    savedNote: 'збережено вчора',
    relatedOrgs: ['o1'],
    relatedPeople: ['p3', 'p1'],
    relatedOpportunities: ['op4'],
    relatedEvents: ['e2'],
    comments: [
      { author: 'Данило Бондар', role: 'Sponsorship Manager', initials: 'ДБ', text: 'Ключове — чиста атрибуція. Саме її не вистачає більшості спонсорських пакетів.', helpful: 11 },
    ],
  },
  {
    id: 'a3',
    type: 'News',
    category: 'Комерція',
    title: 'Ліга чемпіонів отримала титульного партнера у категорії fintech',
    subtitle: 'Уперше титульним стає fintech-бренд',
    excerpt: 'Фокус на цифрові платежі та вболівальницький досвід — категорія fintech заходить у преміальний інвентар.',
    photo: 'фото арени',
    author: RED,
    date: '24 липня 2026',
    readMin: 3,
    commentsCount: 8,
    topToday: true,
    body: [
      { type: 'text', text: 'Уперше титульним партнером турніру стає fintech-бренд — із фокусом на цифрові платежі та вболівальницький досвід.' },
      { type: 'table', headers: ['Параметр', 'Значення'], rows: [['Строк', '4 сезони'], ['Фокус', 'Digital-активації'], ['Бонус', 'Кешбек абонементникам']] },
    ],
    facts: ['Контракт на 4 сезони', 'Фокус на digital-активації', 'Кешбек для власників абонементів'],
    why: 'Fintech заходить у преміальний спортивний інвентар з перформанс-логікою — прямі платежі й вимірювана атрибуція замість іміджу.',
    conclusion: 'Категорія fintech стає новим драйвером титульного спонсорства.',
    source: 'SportsPro Media',
    relatedOrgs: ['o2'],
    relatedPeople: ['p4'],
    relatedEvents: ['e1'],
    comments: [],
  },
  {
    id: 'a4',
    type: 'Research',
    category: 'Медіа',
    title: 'Як топ-клуби будують власні стрімінгові платформи',
    subtitle: 'D2C-модель проти класичного продажу прав',
    excerpt: 'Чому клуби забирають частину прав собі, скільки це коштує і що це означає для мовників.',
    photo: 'скрін стрімінгу',
    author: A('Андрій Мельник', 'CMO · медіаплатформа', 'АМ'),
    date: '23 липня 2026',
    readMin: 7,
    commentsCount: 31,
    body: [
      { type: 'text', text: 'Власний OTT дає клубу пряме володіння аудиторією й даними — і новий рекламний інвентар.' },
      { type: 'quote', text: 'Свій OTT легко запустити і важко наповнювати цілий сезон.', author: 'CMO клубу' },
    ],
    facts: ['D2C замість продажу всіх прав', 'Прямі дані про глядача', 'Новий інвентар для спонсорів'],
    why: 'Гібридна модель — частина матчів партнерам, частина собі — стає нормою.',
    conclusion: 'Мовникам доведеться конкурувати за контент, а не лише купувати права.',
    source: 'SportsPro Media',
    relatedOrgs: ['o4'],
    relatedPeople: ['p2'],
    comments: [
      { author: 'Ірина Савченко', role: 'Commercial Director', initials: 'ІС', text: 'Утримання — головний виклик. Контент-план на сезон вирішує все.', helpful: 9 },
    ],
  },
  {
    id: 'a5',
    type: 'Opinion',
    category: 'Маркетинг',
    title: 'Чому перформанс-маркетинг вбиває креатив у спорті',
    subtitle: 'Колонка про баланс метрик і бренду',
    excerpt: 'Коли все міряють у ROMI, зі спонсорства зникає те, за що його любили, — емоція.',
    photo: 'ілюстрація',
    author: A('Олег Кравець', 'Колумніст', 'ОК'),
    date: 'вчора',
    readMin: 5,
    commentsCount: 21,
    body: [
      { type: 'text', text: 'Атрибуція дисциплінує бюджети, але тисне довгі бренд-історії, які не рахуються в кліку.' },
      { type: 'quote', text: 'Не все, що важливо, можна порахувати в кліку.' },
    ],
    why: 'Перформанс — для нижньої воронки, бренд-активації — для лояльності. Потрібен баланс.',
    conclusion: 'Індустрії варто повернути місце «неатрибутованому» бренд-будівництву.',
    relatedPeople: ['p2'],
    comments: [],
  },
  {
    id: 'a6',
    type: 'Ranking',
    category: 'Комерція',
    title: 'Рейтинг: найдорожчі неймінг-угоди арен Європи',
    subtitle: 'Топ-5 контрактів року',
    excerpt: 'Порівняння naming rights: від чого залежить ціна і чому місткість — не головне.',
    photo: 'графіка рейтингу',
    author: RED,
    date: '3 дні тому',
    readMin: 4,
    commentsCount: 14,
    body: [
      { type: 'text', text: 'Головний множник — трансляційні хвилини з іменем арени в кадрі, а не місткість.' },
      { type: 'table', headers: ['#', 'Арена', 'Строк'], rows: [['1', 'Приклад А', '15 років'], ['2', 'Приклад Б', '10 років'], ['3', 'Приклад В', '8 років']] },
    ],
    conclusion: 'Довгі контракти й медіапокриття визначають вартість неймінгу.',
    relatedOrgs: ['o2'],
    relatedOpportunities: ['op2'],
    comments: [],
  },
  {
    id: 'a7',
    type: 'Interview',
    category: 'Управління',
    title: 'Інтервʼю: як федерація перебудовує комерційну модель',
    subtitle: 'Розмова з комерційною директоркою',
    excerpt: 'Про централізацію прав, роботу з брендами та підготовку до нового циклу.',
    photo: 'портрет',
    author: RED,
    date: '4 дні тому',
    readMin: 9,
    commentsCount: 6,
    body: [
      { type: 'text', text: '— З чого почали перебудову комерційної моделі?' },
      { type: 'text', text: '— З централізації прав і єдиного стандарту пакетів для брендів.' },
    ],
    why: 'Централізація дає переговорну силу й прозорість для партнерів.',
    conclusion: 'Єдиний стандарт пакетів пришвидшує угоди.',
    relatedOrgs: ['o2'],
    relatedPeople: ['p3'],
    comments: [],
  },
  {
    id: 'a8',
    type: 'Insight',
    category: 'iGaming',
    title: 'Букмекери на футболках: де межа для клубів',
    subtitle: 'Категорія платить найбільше — і несе ризики',
    excerpt: 'iGaming готовий платити за титульні розміщення, але регуляторний тиск зростає.',
    photo: 'ілюстрація',
    author: A('Данило Бондар', 'Sponsorship Manager', 'ДБ'),
    date: 'сьогодні',
    readMin: 5,
    commentsCount: 48,
    body: [
      { type: 'text', text: 'iGaming-бренди готові платити найбільше за джерсі-розміщення. Але репутаційні ризики зростають.' },
      { type: 'quote', text: 'Джерсі — так, дитячі програми — ніколи. Це знімає більшість питань.', author: 'CMO клубу' },
    ],
    why: 'Прозорі правила відповідальної гри роблять категорію стійкою вдовгу.',
    conclusion: 'Межу визначає репутаційна стратегія клубу, а не лише гроші.',
    relatedPeople: ['p4'],
    comments: [
      { author: 'Ірина Савченко', role: 'Commercial Director', initials: 'ІС', text: 'Ключове — прозорі правила відповідальної гри в самій активації.', helpful: 14 },
    ],
  },
];

export const findArticle = (id: string) => ARTICLES.find((a) => a.id === id);

export interface Person { id: string; name: string; initials: string; role: string; tags: string[]; shade: number }
export const PEOPLE: Person[] = [
  { id: 'p1', name: 'Олена Ковальчук', initials: 'ОК', role: 'Head of Sponsorship · ФК «Динамо» · Київ', tags: ['Спонсорство', 'Партнерства'], shade: 0 },
  { id: 'p2', name: 'Андрій Мельник', initials: 'АМ', role: 'CMO · спортивна медіаплатформа · Львів', tags: ['Маркетинг', 'Медіа'], shade: 1 },
  { id: 'p3', name: 'Ірина Савченко', initials: 'ІС', role: 'Commercial Director · федерація · Київ', tags: ['Комерція', 'Events'], shade: 2 },
  { id: 'p4', name: 'Данило Бондар', initials: 'ДБ', role: 'Sponsorship Manager · betting-платформа · Варшава', tags: ['iGaming', 'Спонсорство'], shade: 0 },
  { id: 'p5', name: 'Марія Ткаченко', initials: 'МТ', role: 'Студентка · спортивний менеджмент · Київ', tags: ['Research'], shade: 1 },
];
export const findPerson = (id: string) => PEOPLE.find((p) => p.id === id);

export const ME = {
  name: 'Олена Ковальчук', initials: 'ОК', role: 'Head of Sponsorship · ФК «Динамо»', city: 'Київ, Україна',
  email: 'olena@club.ua', position: 'Head of Sponsorship', company: 'ФК «Динамо» Київ',
  bio: '10 років у спортивній комерції. Веду спонсорські партнерства клубу. Відкрита до партнерських запитів.',
  tags: ['Спонсорство', 'Партнерства', 'Комерція'],
  activity: [
    { context: 'До матеріалу · Nike і жіночий футбол', text: 'Важливо, що Nike робить це платформою…', helpful: 18 },
    { context: 'До кейсу · реферальна програма', text: 'Ключове — чиста атрибуція…', helpful: 11 },
  ],
};

export const SEARCH_TAGS = ['#спонсорство', '#неймінг', '#активації', '#медіаправа'];
