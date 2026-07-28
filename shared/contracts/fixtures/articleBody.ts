// Тестові fixtures для контракту тіла статті.
import type { ArticleBodyDocument } from '../articleBody';
import { ARTICLE_BODY_VERSION } from '../articleBody';

export const VALID_ARTICLE_BODY: ArticleBodyDocument = {
  version: ARTICLE_BODY_VERSION,
  blocks: [
    { id: 'b1', type: 'heading', level: 2, text: 'Заголовок розділу' },
    { id: 'b2', type: 'paragraph', text: 'Абзац тексту про ринок спортивного бізнесу.' },
    { id: 'b3', type: 'quote', text: 'Ключова теза.', author: 'Експерт' },
    { id: 'b4', type: 'list', ordered: false, items: ['Пункт 1', 'Пункт 2'] },
    { id: 'b5', type: 'image', url: 'https://example.com/x.jpg', alt: 'Схема', caption: 'Підпис' },
    { id: 'b6', type: 'callout', variant: 'info', text: 'Важлива примітка.' },
    { id: 'b7', type: 'table', header: ['A', 'B'], rows: [['1', '2'], ['3', '4']] },
    { id: 'b8', type: 'embed', provider: 'youtube', url: 'https://youtu.be/x' },
  ],
};

/** Містить невідомий тип блоку — має нормалізуватись у 'unknown', не падати. */
export const BODY_WITH_UNKNOWN_BLOCK = {
  version: 1,
  blocks: [
    { id: 'k1', type: 'paragraph', text: 'ок' },
    { id: 'k2', type: 'super-future-widget', payload: { a: 1 } },
  ],
};

/** Невалідний верхній рівень — validateArticleBody має повернути ok:false. */
export const INVALID_BODY_TOP_LEVEL = { foo: 'bar' };

/** blocks не масив. */
export const INVALID_BODY_BLOCKS = { version: 1, blocks: 'nope' };
