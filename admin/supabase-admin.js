/* Admin SPA ↔ Supabase Auth + довірений Next.js API (foundation).
 *
 * Модель безпеки:
 *   1. Адмін логіниться через Supabase Auth (Email OTP), anon key.
 *   2. Отримує звичайний Supabase JWT.
 *   3. Привілейовані дії йдуть у Next.js API (API_BASE) з Authorization: Bearer.
 *   4. Сервер перевіряє JWT + активний запис у admin_users + потрібну роль.
 *   5. SPA НЕ тримає service_role і НЕ робить привілейованих запитів напряму.
 *   6. Приховування кнопки — не захист; усі admin-ендпоінти віддають 401/403.
 *
 * Підключення в index.html (перед основним скриптом):
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   <script src="config.local.js"></script>
 *   <script src="supabase-admin.js"></script>
 */
(function () {
  var cfg = window.SMR_ADMIN_CONFIG || {};
  var sb = null;
  function client() {
    if (!sb) {
      if (!window.supabase || !cfg.SUPABASE_URL) throw new Error('Supabase SDK/config не завантажені');
      sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    }
    return sb;
  }

  var smrAdmin = {
    /** Крок 1: надіслати одноразовий код на email. */
    async login(email) {
      var r = await client().auth.signInWithOtp({ email: String(email).trim().toLowerCase() });
      if (r.error) throw r.error;
      return true;
    },
    /** Крок 2: підтвердити код → сесія з JWT. */
    async verifyOtp(email, code) {
      var r = await client().auth.verifyOtp({ email: String(email).trim().toLowerCase(), token: String(code).trim(), type: 'email' });
      if (r.error) throw r.error;
      return r.data.user;
    },
    async getToken() {
      var s = await client().auth.getSession();
      return s.data.session ? s.data.session.access_token : null;
    },
    async logout() { await client().auth.signOut(); },

    /** Виклик довіреного API. Кидає {code,message} при 4xx/5xx. */
    async api(path, body) {
      var token = await this.getToken();
      if (!token) throw { code: 'unauthorized', message: 'Немає сесії — увійдіть повторно' };
      var res = await fetch((cfg.API_BASE || '') + path, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
        body: JSON.stringify(body || {}),
      });
      var json = await res.json().catch(function () { return null; });
      if (!res.ok || !json || json.ok === false) {
        throw (json && json.error) || { code: 'server_error', message: 'HTTP ' + res.status };
      }
      return json.data;
    },

    // Зручні обгортки над еталонними ендпоінтами:
    verifyProfile(profileId) { return this.api('/api/admin/profiles/verify', { profileId: profileId }); },
    verifyOrganization(orgId) { return this.api('/api/admin/organizations/verify', { orgId: orgId }); },
    blockUser(profileId, reason) { return this.api('/api/admin/users/block', { profileId: profileId, reason: reason }); },
    unblockUser(profileId) { return this.api('/api/admin/users/unblock', { profileId: profileId }); },
  };

  window.smrAdmin = smrAdmin;
})();
