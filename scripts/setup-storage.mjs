#!/usr/bin/env node
/**
 * Створює Storage-бакет для редакційних зображень (staging/prod setup).
 * Публічний бакет: опубліковані обкладинки/inline доступні за URL; шляхи — UUID
 * (непередбачувані). Ліміт 8MB, лише JPEG/PNG/WebP (SVG заборонено).
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/setup-storage.mjs
 */
import { createClient } from '@supabase/supabase-js';
const URL = process.env.SUPABASE_URL, SR = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SR) { console.error('need SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
const svc = createClient(URL, SR, { auth: { persistSession: false } });
const { data: list } = await svc.storage.listBuckets();
if ((list || []).find((b) => b.name === 'article-media')) { console.log('bucket article-media already exists'); process.exit(0); }
const { error } = await svc.storage.createBucket('article-media', {
  public: true, fileSizeLimit: '8MB', allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
});
if (error) { console.error('ERR', error.message); process.exit(1); }
console.log('✅ bucket article-media created (public, 8MB, jpeg/png/webp)');
