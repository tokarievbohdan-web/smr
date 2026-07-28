import 'server-only';

// Rate-limit FOUNDATION: in-memory токен-бакет на процес. Достатньо як бар'єр
// у межах одного інстансу. Для multi-instance/edge замінити на Redis/Upstash
// (інтерфейс checkRateLimit лишається тим самим).

interface Bucket { tokens: number; updated: number; }
const buckets = new Map<string, Bucket>();

const CAPACITY = 30;         // сплеск
const REFILL_PER_SEC = 1;    // 1 запит/сек усталено

export function checkRateLimit(key: string, now = Date.now()): { allowed: boolean; remaining: number } {
  const b = buckets.get(key) ?? { tokens: CAPACITY, updated: now };
  const elapsed = Math.max(0, (now - b.updated) / 1000);
  b.tokens = Math.min(CAPACITY, b.tokens + elapsed * REFILL_PER_SEC);
  b.updated = now;
  if (b.tokens < 1) { buckets.set(key, b); return { allowed: false, remaining: 0 }; }
  b.tokens -= 1;
  buckets.set(key, b);
  return { allowed: true, remaining: Math.floor(b.tokens) };
}
