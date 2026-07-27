import React, { createContext, useContext, useEffect, useState } from 'react';
import { Article, Discussion, Person, ARTICLES, DISCUSSIONS, PEOPLE } from './data';
import { fetchArticles, fetchDiscussions, fetchPeople } from './api';

type ContentValue = {
  articles: Article[];
  discussions: Discussion[];
  people: Person[];
  loading: boolean;
  refresh: () => void;
};

const Ctx = createContext<ContentValue>({
  articles: ARTICLES,
  discussions: DISCUSSIONS,
  people: PEOPLE,
  loading: false,
  refresh: () => {},
});

export const useContent = () => useContext(Ctx);

export function ContentProvider({ children }: { children: React.ReactNode }) {
  // Стартуємо з демо-даних — застосунок одразу наповнений; потім підміняємо контентом з CMS
  const [articles, setArticles] = useState<Article[]>(ARTICLES);
  const [discussions, setDiscussions] = useState<Discussion[]>(DISCUSSIONS);
  const [people, setPeople] = useState<Person[]>(PEOPLE);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [a, d, p] = await Promise.all([fetchArticles(), fetchDiscussions(), fetchPeople()]);
      setArticles(a);
      setDiscussions(d);
      setPeople(p);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Ctx.Provider value={{ articles, discussions, people, loading, refresh: load }}>{children}</Ctx.Provider>
  );
}
