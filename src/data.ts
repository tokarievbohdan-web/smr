// Контент Sport Market Community

export type Kind = 'News' | 'Case' | 'Insight';

export interface Comment {
  author: string;
  role: string;
  initials: string;
  text: string;
  helpful: number;
  reply?: boolean;
}

export interface Article {
  id: string;
  category: string;
  kind: Kind;
  title: string;
  excerpt: string;
  photo: string; // подпись плейсхолдера
  date: string;
  readMin: number;
  commentsCount: number;
  facts: string[];
  why: string;
  conclusion: string;
  source: string;
  comments: Comment[];
  savedNote?: string;
  topToday?: boolean;
}

export const FEED_FILTERS = ['Усе', 'Маркетинг', 'Спонсорство', 'Комерція', 'Медіа'];

export const INTERESTS = [
  'Спонсорство',
  'Комерція',
  'Маркетинг',
  'Медіа',
  'Управління',
  'Інновації',
  'iGaming',
];

export const ARTICLES: Article[] = [
  {
    id: 'a1',
    category: 'Маркетинг',
    kind: 'News',
    title: 'Nike запускає глобальну кампанію навколо жіночого футболу',
    excerpt:
      'Бренд представив кампанію за участю футболісток національних збірних — від окремих амбасадорок до власної культурної платформи.',
    photo: 'кадр з кампанії Nike',
    date: '24 липня 2026',
    readMin: 4,
    commentsCount: 12,
    topToday: true,
    facts: [
      '12 футболісток із 8 збірних',
      'Запуск у 20 країнах одночасно',
      'Окрема лінійка екіпірування та контент-серіал',
    ],
    why:
      'Бренд переходить від підтримки окремих спортсменок до створення власної культурної платформи навколо жіночого спорту — і забирає цю територію раніше за конкурентів.',
    conclusion:
      'Жіночий спорт стає окремою спонсорською категорією з власними бюджетами. Клубам і федераціям варто готувати окремі комерційні пропозиції вже зараз.',
    source: 'SportsPro Media',
    savedNote: 'збережено сьогодні',
    comments: [
      {
        author: 'Олена Ковальчук',
        role: 'Head of Sponsorship · ФК «Динамо»',
        initials: 'ОК',
        text:
          'Важливо, що Nike робить це не разовою акцією, а платформою. Для клубів це сигнал: жіночі команди треба продавати окремо, зі своєю аудиторією.',
        helpful: 18,
      },
      {
        author: 'Андрій Мельник',
        role: 'CMO · спортивна платформа',
        initials: 'АМ',
        text:
          'Згоден. Медіаметрики жіночого футболу в Європі за два роки виросли кратно — бюджети підуть слідом.',
        helpful: 7,
        reply: true,
      },
    ],
  },
  {
    id: 'a2',
    category: 'Медіа',
    kind: 'Case',
    title: 'Як топ-клуби будують власні стрімінгові платформи',
    excerpt:
      'Розбір: чому клуби забирають частину прав собі, скільки це коштує і що це означає для мовників.',
    photo: 'скрін стрімінгу клубу',
    date: '23 липня 2026',
    readMin: 7,
    commentsCount: 31,
    topToday: false,
    facts: [
      'D2C-модель замість продажу всіх прав',
      'Прямі дані про глядача',
      'Новий інвентар для спонсорів',
    ],
    why:
      'Власний OTT дає клубу пряме володіння аудиторією та даними — і новий рекламний інвентар, якого не було при класичній моделі прав.',
    conclusion:
      'Гібридна модель — частина матчів партнерам, частина собі — стає нормою. Мовникам доведеться конкурувати за контент, а не лише купувати права.',
    source: 'SportsPro Media',
    savedNote: 'збережено вчора',
    comments: [
      {
        author: 'Андрій Мельник',
        role: 'CMO · спортивна платформа',
        initials: 'АМ',
        text: 'Головне питання — утримання. Свій OTT легко запустити і важко наповнювати цілий сезон.',
        helpful: 9,
      },
    ],
  },
  {
    id: 'a3',
    category: 'Спонсорство',
    kind: 'News',
    title: 'Ліга чемпіонів отримала титульного партнера у категорії fintech',
    excerpt:
      'Уперше титульним партнером турніру стає fintech-бренд — із фокусом на цифрові платежі та вболівальницький досвід.',
    photo: 'фото стадіону',
    date: '24 липня 2026',
    readMin: 3,
    commentsCount: 8,
    topToday: true,
    facts: ['Контракт на 4 сезони', 'Фокус на digital-активації', 'Кешбек для власників абонементів'],
    why:
      'Fintech заходить у преміальний спортивний інвентар з перформанс-логікою — прямі платежі й вимірювана атрибуція замість іміджу.',
    conclusion:
      'Категорія fintech стає новим драйвером титульного спонсорства. Клубам варто готувати пакети з digital-інтеграціями.',
    source: 'SportsPro Media',
    comments: [],
  },
];

export interface Discussion {
  id: string;
  badge?: 'Тема тижня' | 'Питання';
  category: string;
  title: string;
  preview?: string;
  meta: string;
  hot?: boolean;
  avatars?: string[];
}

export const DISCUSSIONS: Discussion[] = [
  {
    id: 'd1',
    badge: 'Тема тижня',
    category: 'iGaming',
    title: 'Букмекери на футболках: де межа для українських клубів?',
    meta: '48 коментарів · 12 учасників',
    hot: true,
    avatars: ['ОК', 'АМ', 'ІС'],
  },
  {
    id: 'd2',
    category: 'Комерція · Case',
    title: 'Скільки насправді коштує неймінг арени в Україні',
    preview:
      '«Порівняння з європейськими угодами некоректне без урахування медіапокриття…» — останній коментар',
    meta: '26 коментарів · оновлено 40 хв тому',
  },
  {
    id: 'd3',
    badge: 'Питання',
    category: 'Спонсорство',
    title: 'Як ви рахуєте ROI спонсорського пакета без прямих продажів?',
    meta: '14 коментарів · від учасника спільноти',
  },
  {
    id: 'd4',
    category: 'Медіа · Insight',
    title: 'Чому клубні подкасти працюють краще за пресконференції',
    meta: '9 коментарів · вчора',
  },
];

export interface Person {
  id: string;
  name: string;
  initials: string;
  role: string;
  tags: string[];
  shade: number;
}

export const PEOPLE: Person[] = [
  { id: 'p1', name: 'Олена Ковальчук', initials: 'ОК', role: 'Head of Sponsorship · ФК «Динамо» · Київ', tags: ['Спонсорство', 'Партнерства'], shade: 0 },
  { id: 'p2', name: 'Андрій Мельник', initials: 'АМ', role: 'CMO · спортивна медіаплатформа · Львів', tags: ['Маркетинг', 'Медіа'], shade: 1 },
  { id: 'p3', name: 'Ірина Савченко', initials: 'ІС', role: 'Commercial Director · федерація · Київ', tags: ['Комерція', 'Events'], shade: 2 },
  { id: 'p4', name: 'Данило Бондар', initials: 'ДБ', role: 'Sponsorship Manager · betting-платформа · Варшава', tags: ['iGaming', 'Спонсорство'], shade: 0 },
  { id: 'p5', name: 'Марія Ткаченко', initials: 'МТ', role: 'Студентка · спортивний менеджмент · Київ', tags: ['Research'], shade: 1 },
];

// Поточний користувач
export const ME = {
  name: 'Олена Ковальчук',
  initials: 'ОК',
  role: 'Head of Sponsorship · ФК «Динамо»',
  city: 'Київ, Україна',
  email: 'olena@club.ua',
  position: 'Head of Sponsorship',
  company: 'ФК «Динамо» Київ',
  bio:
    '10 років у спортивній комерції. Веду спонсорські партнерства клубу, до цього — агентський бік. Відкрита до партнерських запитів.',
  tags: ['Спонсорство', 'Партнерства', 'Комерція'],
  activity: [
    { context: 'До матеріалу · Nike і жіночий футбол', text: 'Важливо, що Nike робить це не разовою акцією, а платформою…', helpful: 18 },
    { context: 'До обговорення · неймінг арени', text: 'Порівняння з європейськими угодами некоректне без урахування медіапокриття…', helpful: 11 },
  ],
};

export const SEARCH_TAGS = ['#спонсорство', '#неймінг', '#активації'];
