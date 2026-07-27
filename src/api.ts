// Шар даних: якщо CMS підключена (cms.ts projectId) — тягне з Sanity,
// інакше повертає демо-дані з data.ts. Екрани не залежать від джерела.
import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import { CMS, cmsEnabled } from './cms';
import { ARTICLES, DISCUSSIONS, PEOPLE, Article, Discussion, Person } from './data';

const client = cmsEnabled()
  ? createClient({ projectId: CMS.projectId, dataset: CMS.dataset, apiVersion: CMS.apiVersion, useCdn: true })
  : null;

const builder = client ? imageUrlBuilder(client) : null;
const imgUrl = (src: any, w = 800) => (builder && src ? builder.image(src).width(w).url() : undefined);

export async function fetchArticles(): Promise<Article[]> {
  if (!client) return ARTICLES;
  try {
    const rows = await client.fetch<any[]>(
      `*[_type == "article"] | order(date desc){
        "id": _id, category, kind, title, excerpt, image, date, readMin,
        "topToday": topToday, facts, why, conclusion, source
      }`
    );
    return rows.map((r) => ({
      id: r.id,
      category: r.category,
      kind: r.kind || 'News',
      title: r.title,
      excerpt: r.excerpt || '',
      photo: '',
      imageUrl: imgUrl(r.image),
      date: r.date ? new Date(r.date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }) : '',
      readMin: r.readMin || 3,
      commentsCount: 0,
      topToday: !!r.topToday,
      facts: r.facts || [],
      why: r.why || '',
      conclusion: r.conclusion || '',
      source: r.source || '',
      comments: [],
    })) as Article[];
  } catch (e) {
    return ARTICLES;
  }
}

export async function fetchDiscussions(): Promise<Discussion[]> {
  if (!client) return DISCUSSIONS;
  try {
    const rows = await client.fetch<any[]>(
      `*[_type == "discussion"]{
        "id": _id, badge, category, title, "preview": body, meta, hot,
        author, authorRole, authorInitials, "body": body
      }`
    );
    return rows.map((r) => ({
      id: r.id,
      badge: r.badge,
      category: r.category || '',
      title: r.title,
      preview: r.preview,
      meta: r.meta || '',
      hot: !!r.hot,
      author: r.author || '',
      authorRole: r.authorRole || '',
      authorInitials: r.authorInitials || '',
      body: r.body || '',
      thread: [],
    })) as Discussion[];
  } catch (e) {
    return DISCUSSIONS;
  }
}

export async function fetchPeople(): Promise<Person[]> {
  if (!client) return PEOPLE;
  try {
    const rows = await client.fetch<any[]>(`*[_type == "person"]{ "id": _id, name, initials, role, tags }`);
    return rows.map((r, i) => ({
      id: r.id,
      name: r.name,
      initials: r.initials || r.name?.slice(0, 2).toUpperCase(),
      role: r.role || '',
      tags: r.tags || [],
      shade: i % 3,
    })) as Person[];
  } catch (e) {
    return PEOPLE;
  }
}
