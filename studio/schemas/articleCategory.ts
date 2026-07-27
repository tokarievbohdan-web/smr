import {defineType, defineField} from 'sanity'

// Керований довідник категорій Review
export default defineType({
  name: 'articleCategory',
  title: 'Категорія Review',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Назва', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title'}}),
    defineField({name: 'order', title: 'Порядок', type: 'number', initialValue: 0}),
  ],
  orderings: [{title: 'За порядком', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'title'}},
})
