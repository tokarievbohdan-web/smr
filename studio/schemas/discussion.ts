import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'discussion',
  title: 'Обговорення',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Тема', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'category', title: 'Категорія (напр. iGaming або "Комерція · Case")', type: 'string'}),
    defineField({name: 'badge', title: 'Бейдж', type: 'string', options: {list: ['Тема тижня', 'Питання']}}),
    defineField({name: 'hot', title: 'Гаряче', type: 'boolean', initialValue: false}),
    defineField({name: 'body', title: 'Текст стартового допису', type: 'text', rows: 5}),
    defineField({name: 'author', title: 'Автор', type: 'string'}),
    defineField({name: 'authorRole', title: 'Роль автора', type: 'string'}),
    defineField({name: 'authorInitials', title: 'Ініціали автора', type: 'string', validation: (r) => r.max(2)}),
    defineField({name: 'meta', title: 'Мета (напр. "48 коментарів · 12 учасників")', type: 'string'}),
  ],
  preview: {select: {title: 'title', subtitle: 'category'}},
})
