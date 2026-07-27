// Шар даних: CMS (Sanity) з фолбэком на демо-дані data.ts. Екрани не залежать від джерела.
import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import { CMS, cmsEnabled } from './cms';
import { ARTICLES, PEOPLE, Article, Person, Category, DEFAULT_CATEGORIES } from './data';

const client = cmsEnabled()
  ? createClient({ projectId: CMS.projectId, dataset: CMS.dataset, apiVersion: CMS.apiVersion, useCdn: true })
  : null;
const builder = client ? imageUrlBuilder(client) : null;
const imgUrl = (src: any, w = 900) => (builder && src ? builder.image(src).width(w).url() : undefined);

const REDACTION = { name: 'Редакція SMR', role: 'Sport Market Review', initials: 'SM' };

export async function fetchArticles(): Promise<Article[]> {
  if (!client) return ARTICLES;
  try {
    const rows = await client.fetch<any[]>(
      `*[_type == "article"] | order(date desc){
        "id": _id, category, kind, title, subtitle, excerpt, image, date, readMin, commentsCount,
        "topToday": topToday, facts, why, conclusion, source, caseStudy
      }`
    );
    if (!rows.length) return ARTICLES;
    return rows.map((r): Article => ({
      id: r.id,
      type: r.kind || 'News',
      category: r.category || 'Індустрія',
      title: r.title,
      subtitle: r.subtitle,
      excerpt: r.excerpt || '',
      photo: '',
      imageUrl: imgUrl(r.image),
      author: REDACTION,
      date: r.date ? new Date(r.date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }) : '',
      readMin: r.readMin || 3,
      commentsCount: r.commentsCount || 0,
      topToday: !!r.topToday,
      body: r.excerpt ? [{ type: 'text', text: r.excerpt }] : [],
      facts: r.facts || [],
      why: r.why || '',
      conclusion: r.conclusion || '',
      source: r.source || '',
      caseStudy: r.caseStudy,
      comments: [],
    }));
  } catch {
    return ARTICLES;
  }
}

export async function fetchPeople(): Promise<Person[]> {
  if (!client) return PEOPLE;
  try {
    const rows = await client.fetch<any[]>(`*[_type == "person"]{ "id": _id, name, initials, role, tags }`);
    if (!rows.length) return PEOPLE;
    return rows.map((r, i) => ({
      id: r.id,
      name: r.name,
      initials: r.initials || r.name?.slice(0, 2).toUpperCase(),
      role: r.role || '',
      tags: r.tags || [],
      shade: i % 3,
    })) as Person[];
  } catch {
    return PEOPLE;
  }
}

export async function fetchCategories(): Promise<Category[]> {
  if (!client) return DEFAULT_CATEGORIES;
  try {
    const rows = await client.fetch<any[]>(`*[_type == "articleCategory"] | order(order asc){ "id": _id, title }`);
    return rows.length ? rows.map((r) => ({ id: r.id, title: r.title })) : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}
