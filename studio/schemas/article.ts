import {defineType, defineField} from 'sanity'

export const CATEGORIES = ['Маркетинг', 'Спонсорство', 'Комерція', 'Медіа', 'Управління', 'Інновації', 'iGaming']

export default defineType({
  name: 'article',
  title: 'Матеріал',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Заголовок', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'subtitle', title: 'Підзаголовок', type: 'string'}),
    defineField({name: 'category', title: 'Категорія', type: 'string', options: {list: CATEGORIES}, validation: (r) => r.required()}),
    defineField({name: 'kind', title: 'Тип матеріалу', type: 'string', options: {list: ['News', 'Case Study', 'Interview', 'Research', 'Insight', 'Opinion', 'Guide', 'Ranking', 'Partner Material']}, initialValue: 'News'}),
    defineField({name: 'excerpt', title: 'Короткий опис (лід)', type: 'text', rows: 3}),
    defineField({name: 'image', title: 'Головне фото', type: 'image', options: {hotspot: true}}),
    defineField({name: 'date', title: 'Дата публікації', type: 'datetime', initialValue: () => new Date().toISOString()}),
    defineField({name: 'readMin', title: 'Час читання (хв)', type: 'number', initialValue: 4}),
    defineField({name: 'commentsCount', title: 'Кількість коментарів (для «Найобговорюваніші»)', type: 'number', initialValue: 0}),
    defineField({name: 'topToday', title: 'У блок «Головне сьогодні»', type: 'boolean', initialValue: false}),
    defineField({name: 'facts', title: 'Основні факти', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'why', title: 'Чому це важливо', type: 'text', rows: 3}),
    defineField({name: 'conclusion', title: 'Висновок для індустрії', type: 'text', rows: 3}),
    defineField({name: 'source', title: 'Першоджерело', type: 'string'}),
    defineField({
      name: 'caseStudy', title: 'Case Study (для типу «Case Study»)', type: 'object',
      fields: [
        {name: 'campaign', title: 'Назва кампанії', type: 'string'},
        {name: 'brand', title: 'Бренд', type: 'string'},
        {name: 'org', title: 'Спортивна організація', type: 'string'},
        {name: 'country', title: 'Країна', type: 'string'},
        {name: 'sport', title: 'Вид спорту', type: 'string'},
        {name: 'task', title: 'Задача', type: 'text', rows: 2},
        {name: 'audience', title: 'Аудиторія', type: 'text', rows: 2},
        {name: 'mechanics', title: 'Механіка', type: 'text', rows: 2},
        {name: 'channels', title: 'Канали', type: 'array', of: [{type: 'string'}]},
        {name: 'results', title: 'Результати', type: 'array', of: [{type: 'string'}]},
        {name: 'takeaway', title: 'Головний висновок', type: 'text', rows: 2},
        {name: 'ukraine', title: 'Застосовність для України', type: 'text', rows: 2},
      ],
    }),
  ],
  orderings: [{title: 'Свіжі спочатку', name: 'dateDesc', by: [{field: 'date', direction: 'desc'}]}],
  preview: {
    select: {title: 'title', subtitle: 'category', media: 'image'},
  },
})
