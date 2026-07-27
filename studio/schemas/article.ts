import {defineType, defineField} from 'sanity'

export const CATEGORIES = ['Маркетинг', 'Спонсорство', 'Комерція', 'Медіа', 'Управління', 'Інновації', 'iGaming']

export default defineType({
  name: 'article',
  title: 'Матеріал',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Заголовок', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'category', title: 'Категорія', type: 'string', options: {list: CATEGORIES}, validation: (r) => r.required()}),
    defineField({name: 'kind', title: 'Тип', type: 'string', options: {list: ['News', 'Case', 'Insight']}, initialValue: 'News'}),
    defineField({name: 'excerpt', title: 'Короткий опис (лід)', type: 'text', rows: 3}),
    defineField({name: 'image', title: 'Головне фото', type: 'image', options: {hotspot: true}}),
    defineField({name: 'date', title: 'Дата публікації', type: 'datetime', initialValue: () => new Date().toISOString()}),
    defineField({name: 'readMin', title: 'Час читання (хв)', type: 'number', initialValue: 4}),
    defineField({name: 'topToday', title: 'У блок «Головне сьогодні»', type: 'boolean', initialValue: false}),
    defineField({name: 'facts', title: 'Основні факти', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'why', title: 'Чому це важливо', type: 'text', rows: 3}),
    defineField({name: 'conclusion', title: 'Висновок для індустрії', type: 'text', rows: 3}),
    defineField({name: 'source', title: 'Першоджерело', type: 'string'}),
  ],
  orderings: [{title: 'Свіжі спочатку', name: 'dateDesc', by: [{field: 'date', direction: 'desc'}]}],
  preview: {
    select: {title: 'title', subtitle: 'category', media: 'image'},
  },
})
