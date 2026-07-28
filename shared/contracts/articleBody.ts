// Версіонований контракт тіла статті + runtime-валідація.
// Зберігається у articles.body (jsonb). Невідомі блоки НЕ ламають документ —
// нормалізуються у блок 'unknown' зі збереженням сирих даних (forward-compat).

export const ARTICLE_BODY_VERSION = 1 as const;

export type BlockId = string;

export interface BaseBlock { id: BlockId; type: string; }

export interface ParagraphBlock extends BaseBlock { type: 'paragraph'; text: string; }
export interface HeadingBlock extends BaseBlock { type: 'heading'; level: 2 | 3 | 4; text: string; }
export interface ImageBlock extends BaseBlock { type: 'image'; url: string; alt?: string; caption?: string; }
export interface QuoteBlock extends BaseBlock { type: 'quote'; text: string; author?: string; }
export interface ListBlock extends BaseBlock { type: 'list'; ordered: boolean; items: string[]; }
export interface TableBlock extends BaseBlock { type: 'table'; header?: string[]; rows: string[][]; }
export interface CalloutBlock extends BaseBlock { type: 'callout'; variant: 'info' | 'warn' | 'success' | 'note'; text: string; }
export interface EmbedBlock extends BaseBlock { type: 'embed'; provider: string; url: string; }
/** Невідомий/майбутній тип блоку — зберігаємо сирі дані, рендеримо безпечно. */
export interface UnknownBlock extends BaseBlock { type: 'unknown'; raw: unknown; }

export type ArticleBodyBlock =
  | ParagraphBlock | HeadingBlock | ImageBlock | QuoteBlock
  | ListBlock | TableBlock | CalloutBlock | EmbedBlock | UnknownBlock;

export interface ArticleBodyDocument {
  version: number;
  blocks: ArticleBodyBlock[];
}

export const KNOWN_BLOCK_TYPES = [
  'paragraph', 'heading', 'image', 'quote', 'list', 'table', 'callout', 'embed',
] as const;

export type ValidateResult =
  | { ok: true; doc: ArticleBodyDocument; warnings: string[] }
  | { ok: false; error: string };

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function str(v: unknown): string { return typeof v === 'string' ? v : ''; }
function strArr(v: unknown): string[] { return Array.isArray(v) ? v.map(str) : []; }

let counter = 0;
function ensureId(v: unknown): BlockId {
  if (typeof v === 'string' && v.length > 0) return v;
  counter += 1;
  return `b_${counter.toString(36)}`; // стабільний у межах одного normalizе
}

/**
 * Валідує та нормалізує довільний вхід у ArticleBodyDocument.
 * Верхній рівень має бути { version, blocks[] } — інакше error.
 * Кожен блок нормалізується; невідомі типи → UnknownBlock (warning).
 */
export function validateArticleBody(input: unknown): ValidateResult {
  if (!isObj(input)) return { ok: false, error: 'body is not an object' };
  if (typeof input.version !== 'number') return { ok: false, error: 'body.version missing/not a number' };
  if (!Array.isArray(input.blocks)) return { ok: false, error: 'body.blocks is not an array' };

  const warnings: string[] = [];
  const blocks: ArticleBodyBlock[] = input.blocks.map((raw, i): ArticleBodyBlock => {
    if (!isObj(raw)) { warnings.push(`block[${i}] not an object → unknown`); return { id: ensureId(null), type: 'unknown', raw }; }
    const id = ensureId(raw.id);
    switch (raw.type) {
      case 'paragraph': return { id, type: 'paragraph', text: str(raw.text) };
      case 'heading': {
        const lvl = raw.level === 3 ? 3 : raw.level === 4 ? 4 : 2;
        return { id, type: 'heading', level: lvl as 2 | 3 | 4, text: str(raw.text) };
      }
      case 'image': return { id, type: 'image', url: str(raw.url), alt: raw.alt ? str(raw.alt) : undefined, caption: raw.caption ? str(raw.caption) : undefined };
      case 'quote': return { id, type: 'quote', text: str(raw.text), author: raw.author ? str(raw.author) : undefined };
      case 'list': return { id, type: 'list', ordered: raw.ordered === true, items: strArr(raw.items) };
      case 'table': return { id, type: 'table', header: raw.header ? strArr(raw.header) : undefined, rows: Array.isArray(raw.rows) ? raw.rows.map(strArr) : [] };
      case 'callout': {
        const variant = (['info', 'warn', 'success', 'note'] as const).includes(raw.variant as never) ? (raw.variant as CalloutBlock['variant']) : 'info';
        return { id, type: 'callout', variant, text: str(raw.text) };
      }
      case 'embed': return { id, type: 'embed', provider: str(raw.provider), url: str(raw.url) };
      default:
        warnings.push(`block[${i}] unknown type "${String(raw.type)}" → unknown`);
        return { id, type: 'unknown', raw };
    }
  });

  return { ok: true, doc: { version: input.version, blocks }, warnings };
}

/** Порожнє валідне тіло (для чернеток). */
export function emptyArticleBody(): ArticleBodyDocument {
  return { version: ARTICLE_BODY_VERSION, blocks: [] };
}
