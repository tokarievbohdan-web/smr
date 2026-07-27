import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'person',
  title: 'Учасник спільноти',
  type: 'document',
  fields: [
    defineField({name: 'name', title: "Ім'я", type: 'string', validation: (r) => r.required()}),
    defineField({name: 'initials', title: 'Ініціали', type: 'string', validation: (r) => r.max(2)}),
    defineField({name: 'role', title: 'Роль · компанія · місто', type: 'string'}),
    defineField({name: 'tags', title: 'Теги', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'avatar', title: 'Фото (необовʼязково)', type: 'image', options: {hotspot: true}}),
  ],
  preview: {select: {title: 'name', subtitle: 'role', media: 'avatar'}},
})
