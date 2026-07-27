// Конфіг підключення до Sanity (веб-адмінки).
// Встав сюди projectId свого Sanity-проєкту після `sanity init`.
// Поки projectId порожній — застосунок працює на демо-даних із data.ts.
export const CMS = {
  projectId: '1s3pj0dm',
  dataset: 'production',
  apiVersion: '2024-01-01',
};

export const cmsEnabled = () => CMS.projectId.trim().length > 0;
