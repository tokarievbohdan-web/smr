// Спільні ID/дата типи. Framework-agnostic: без залежностей від React/Next.
// БД використовує uuid + timestamptz/date; API віддає ISO 8601 рядки.

/** UUID v4 (branded, щоб не плутати з довільним рядком). */
export type UUID = string & { readonly __brand: 'UUID' };
/** ISO 8601 з часом та зоною, напр. 2026-07-28T10:00:00Z. */
export type ISODateTime = string & { readonly __brand: 'ISODateTime' };
/** Календарна дата без часу, напр. 2026-07-28. */
export type ISODate = string & { readonly __brand: 'ISODate' };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isUUID(v: unknown): v is UUID {
  return typeof v === 'string' && UUID_RE.test(v);
}
export function isISODate(v: unknown): v is ISODate {
  return typeof v === 'string' && ISO_DATE_RE.test(v);
}

/** Безпечне приведення рядка/Date до ISODateTime (null → null). */
export function toISODateTime(v: string | Date | null | undefined): ISODateTime | null {
  if (v == null) return null;
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString() as ISODateTime;
}

/** Дата (yyyy-mm-dd) з ISO-рядка/Date. */
export function toISODate(v: string | Date | null | undefined): ISODate | null {
  if (v == null) return null;
  if (typeof v === 'string' && ISO_DATE_RE.test(v)) return v as ISODate;
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10) as ISODate;
}
