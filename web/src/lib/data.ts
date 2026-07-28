// Демо-дані веб-версії Sport Market Review (українською).
// Спільний контент для всіх сторінок. Пізніше замінюється на Supabase.

export type Tone = "accent" | "ok" | "warn" | "danger" | "neutral";

export interface Article {
  id: string; type: string; category: string; title: string; subtitle: string;
  author: string; date: string; readMin: number; comments: number; featured?: boolean;
  body?: string[];
}
export interface Person {
  id: string; initials: string; name: string; verified?: boolean; role: string;
  availability: string[]; competencies: string[];
}
export interface Org {
  id: string; initials: string; name: string; verified?: boolean; type: string; city: string; sports: string[];
}
export interface Opportunity {
  id: string; title: string; type: string; org: string; verified?: boolean; status: [string, Tone];
  sport: string; format: string; budget: string; deadline: string; apps: number; desc: string;
}
export interface EventItem {
  id: string; day: string; month: string; title: string; org: string; format: string;
  cost: string; seats: string; city: string; desc: string;
}

export const ARTICLES: Article[] = [
  { id: "a1", type: "Новина", category: "Маркетинг", featured: true, title: "Nike запускає глобальну кампанію навколо жіночого футболу", subtitle: "Найбільша інвестиція бренду в жіночий спорт за пʼять років: від амбасадорок до власної культурної платформи у 20 країнах.", author: "Марія Левченко", date: "24 липня 2026", readMin: 4, comments: 12,
    body: ["Nike представив глобальну кампанію за участю футболісток національних збірних. Це найбільша інвестиція бренду в жіночий футбол за останні пʼять років.", "Кампанія охоплює 20 країн і поєднує медійний охват з локальними активаціями клубів-партнерів.", "Жіночий спорт стає окремою спонсорською категорією з власними бюджетами."] },
  { id: "a3", type: "Новина", category: "Комерція", title: "Ліга чемпіонів отримала титульного партнера у категорії fintech", subtitle: "Уперше титульним партнером турніру стає fintech-бренд — із фокусом на цифрові платежі та вболівальницький досвід.", author: "Редакція SMR", date: "24 липня 2026", readMin: 3, comments: 8 },
  { id: "a4", type: "Дослідження", category: "Медіа", title: "Як топ-клуби будують власні стрімінгові платформи", subtitle: "D2C-модель проти класичного продажу прав: чому клуби забирають частину прав собі.", author: "Андрій Мельник", date: "23 липня 2026", readMin: 7, comments: 31 },
  { id: "a2", type: "Кейс", category: "Кейси", featured: true, title: "Як банк зібрав повний стадіон через реферальну програму", subtitle: "Спонсор зробив білети вимірюваним каналом: приведи друга — отримай місце поруч і кешбек.", author: "Ірина Савченко", date: "22 липня 2026", readMin: 8, comments: 26 },
  { id: "a5", type: "Колонка", category: "Маркетинг", title: "Чому перформанс-маркетинг витісняє креатив у спорті", subtitle: "Коли все міряють у ROMI, зі спонсорства зникає те, за що його любили, — емоція.", author: "Олег Кравець", date: "вчора", readMin: 5, comments: 21 },
  { id: "a6", type: "Рейтинг", category: "Комерція", title: "Рейтинг: найдорожчі неймінг-угоди арен Європи", subtitle: "Порівняння naming rights: від чого залежить ціна і чому місткість — не головне.", author: "Редакція SMR", date: "3 дні тому", readMin: 4, comments: 14 },
  { id: "a8", type: "Інсайт", category: "iGaming", title: "Букмекери на футболках: де межа для клубів", subtitle: "iGaming готовий платити за титульні розміщення, але регуляторний тиск зростає.", author: "Данило Бондар", date: "сьогодні", readMin: 5, comments: 48 },
];
export const findArticle = (id: string) => ARTICLES.find((a) => a.id === id);

export const PEOPLE: Person[] = [
  { id: "p1", initials: "ОК", name: "Олена Ковальчук", verified: true, role: "Head of Sponsorship · ФК «Динамо» · Київ", availability: ["Шукаю партнерів", "Спікер"], competencies: ["Спонсорство", "Комерція", "Партнерства"] },
  { id: "p2", initials: "АМ", name: "Андрій Мельник", verified: true, role: "CMO · MEGOGO Sport · Львів", availability: ["Відкритий до проєктів"], competencies: ["Маркетинг", "Медіа", "Технології"] },
  { id: "p3", initials: "ІС", name: "Ірина Савченко", verified: true, role: "Commercial Director · УАФ · Київ", availability: ["Шукаю партнерів"], competencies: ["Комерція", "Управління", "Івенти"] },
  { id: "p4", initials: "ДБ", name: "Данило Бондар", role: "Sponsorship Manager · iGaming · Варшава", availability: ["Відкритий до роботи"], competencies: ["iGaming", "Спонсорство"] },
  { id: "p5", initials: "МТ", name: "Марія Ткаченко", role: "Спортивний менеджмент · Київ", availability: ["Відкрита до роботи"], competencies: ["Аналітика", "Research"] },
  { id: "p6", initials: "ОК", name: "Олег Кравець", role: "Колумніст · спортивний маркетинг", availability: ["Готовий бути спікером"], competencies: ["Медіа", "Маркетинг"] },
];
export const findPerson = (id: string) => PEOPLE.find((p) => p.id === id);

export const ORGS: Org[] = [
  { id: "o1", initials: "ДК", name: "ФК «Динамо» Київ", verified: true, type: "Клуб", city: "Київ", sports: ["Футбол"] },
  { id: "o2", initials: "УАФ", name: "Українська асоціація футболу", verified: true, type: "Федерація", city: "Київ", sports: ["Футбол"] },
  { id: "o4", initials: "MS", name: "MEGOGO Sport", verified: true, type: "Медіа", city: "Львів", sports: ["Мультиспорт"] },
  { id: "o3", initials: "FB", name: "Favbet", type: "Бренд", city: "Київ", sports: ["iGaming"] },
  { id: "o5", initials: "88", name: "Agency 8848", type: "Агентство", city: "Львів", sports: ["Маркетинг"] },
  { id: "o6", initials: "UPL", name: "Українська Премʼєр-ліга", verified: true, type: "Ліга", city: "Україна", sports: ["Футбол"] },
];
export const findOrg = (id: string) => ORGS.find((o) => o.id === id);

export const OPPS: Opportunity[] = [
  { id: "op1", title: "Head of Sponsorship у футбольний клуб", type: "Вакансія", org: "ФК «Динамо» Київ", verified: true, status: ["Опубліковано", "ok"], sport: "Футбол", format: "Офлайн", budget: "За запитом", deadline: "15 серпня", apps: 3, desc: "Шукаємо керівника напряму спонсорства для розвитку партнерських програм клубу." },
  { id: "op2", title: "Титульне партнерство ліги на сезон 2026/27", type: "Партнерство", org: "Українська Премʼєр-ліга", verified: true, status: ["Featured", "accent"], sport: "Футбол", format: "Гібрид", budget: "€ обговорюється", deadline: "01 вересня", apps: 5, desc: "Ліга відкриває категорію титульного партнера: нейминг, медіапокриття, digital-активації." },
  { id: "op5", title: "Спонсорський пакет жіночої команди", type: "Спонсорство", org: "ФК «Динамо» Київ", verified: true, status: ["Опубліковано", "ok"], sport: "Футбол", format: "Офлайн", budget: "від ₴500 тис", deadline: "10 вересня", apps: 1, desc: "Категорійні пакети для партнерів жіночої футбольної команди." },
  { id: "op3", title: "Тендер: продакшн матчевих трансляцій", type: "Тендер", org: "MEGOGO Sport", verified: true, status: ["Дедлайн близько", "warn"], sport: "Мультиспорт", format: "Офлайн", budget: "₴2–3 млн", deadline: "20 серпня", apps: 2, desc: "Підрядник для продакшну матчевих трансляцій сезону: багатокамерна зйомка, графіка, режисура." },
  { id: "op6", title: "Пошук інвестицій для sports-tech стартапу", type: "Інвестиція", org: "Sportech UA", status: ["Опубліковано", "ok"], sport: "Мультиспорт", format: "Віддалено", budget: "За запитом", deadline: "30 вересня", apps: 4, desc: "Стартап у сфері аналітики матчів шукає seed-інвестиції. Є MVP і перші пілоти з клубами." },
  { id: "op4", title: "Послуги: діджитал-активації на матчдей", type: "Послуга", org: "Agency 8848", status: ["Опубліковано", "ok"], sport: "Мультиспорт", format: "Гібрид", budget: "Не вказаний", deadline: "—", apps: 0, desc: "Діджитал-активації, соціальні механіки й контент для матчдею." },
];
export const findOpp = (id: string) => OPPS.find((o) => o.id === id);

export const EVENTS: EventItem[] = [
  { id: "e1", day: "12", month: "вер", title: "Sport Business Forum Ukraine 2026", org: "Sport Market Review · Київ", format: "Офлайн", cost: "₴2 500", seats: "58 місць", city: "Київ", desc: "Головна щорічна подія спортивного бізнесу України: панелі, кейси, нетворкінг." },
  { id: "e4", day: "18", month: "вер", title: "Sport Business Networking Night", org: "Sport Market Review · Київ", format: "Офлайн", cost: "₴500", seats: "12 місць", city: "Київ", desc: "Вечір знайомств для професіоналів спортивної індустрії." },
  { id: "e2", day: "24", month: "вер", title: "Спонсорство у спорті: практикум для клубів", org: "Agency 8848 · Онлайн", format: "Онлайн", cost: "Безкоштовно", seats: "немає", city: "Онлайн", desc: "Практичний вебінар про побудову спонсорських пакетів." },
  { id: "e3", day: "03", month: "жов", title: "Медіаправа та OTT: круглий стіл", org: "MEGOGO Sport · Львів", format: "Гібрид", cost: "₴900", seats: "34 місця", city: "Львів", desc: "Дискусія про монетизацію медіаправ і власні OTT-платформи." },
  { id: "e5", day: "25", month: "жов", title: "Sport Marketing Awards 2026", org: "Sport Market Review · Київ", format: "Офлайн", cost: "від ₴1 800", seats: "140 місць", city: "Київ", desc: "Щорічна премія за найкращі кейси спортивного маркетингу." },
];
export const findEvent = (id: string) => EVENTS.find((e) => e.id === id);

export const NAV = [
  { href: "/", label: "Огляд" },
  { href: "/network", label: "Мережа" },
  { href: "/opportunities", label: "Можливості" },
  { href: "/events", label: "Події" },
  { href: "/profile", label: "Профіль" },
];
