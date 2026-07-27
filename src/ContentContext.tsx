import React, { createContext, useContext, useEffect, useState } from 'react';
import { Article, Person, Category, ARTICLES, PEOPLE, DEFAULT_CATEGORIES } from './data';
import { fetchArticles, fetchPeople, fetchCategories } from './api';

type ContentValue = {
  articles: Article[];
  people: Person[];
  categories: Category[];
  loading: boolean;
  error: boolean;
  refresh: () => void;
};

const Ctx = createContext<ContentValue>({
  articles: ARTICLES,
  people: PEOPLE,
  categories: DEFAULT_CATEGORIES,
  loading: false,
  error: false,
  refresh: () => {},
});

export const useContent = () => useContext(Ctx);

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [articles, setArticles] = useState<Article[]>(ARTICLES);
  const [people, setPeople] = useState<Person[]>(PEOPLE);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const [a, p, c] = await Promise.all([fetchArticles(), fetchPeople(), fetchCategories()]);
      setArticles(a);
      setPeople(p);
      setCategories(c);
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <Ctx.Provider value={{ articles, people, categories, loading, error, refresh: load }}>{children}</Ctx.Provider>
  );
}
