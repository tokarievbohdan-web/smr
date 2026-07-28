# Деплой веб-версії на власний VPS (ukraine.com.ua)

Застосунок на **Next.js** (папка `web/`). Є два способи. Для VPS рекомендуємо
**Спосіб A (Node + nginx)** — він переживе перехід на Supabase/SSR. Якщо поки
потрібен лише статичний сайт (навіть на shared-хостингу) — **Спосіб B (експорт)**.

---

## Спосіб A — Node-сервер на VPS (рекомендовано)

Застосунок збирається у **standalone**-бандл (`output: "standalone"` у
`next.config.ts`) — самодостатній сервер із мінімумом залежностей.

### 1. Підготувати VPS (один раз)
```bash
# Node 20+ (nvm або nodesource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx
sudo npm i -g pm2
```

### 2. Доставити код і зібрати
```bash
# на VPS: клонувати репозиторій (або rsync/scp тільки папку web)
git clone <ваш-git-remote> smr && cd smr/web
npm ci
npm run build
# докласти статику й public у standalone-рантайм:
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/ 2>/dev/null || true
```

### 3. Запустити під PM2 (автозапуск, рестарти)
```bash
cd .next/standalone
PORT=3000 pm2 start server.js --name smr-web
pm2 save && pm2 startup   # автозапуск після ребута
```
Сервер слухає `127.0.0.1:3000`.

### 4. nginx як reverse proxy + SSL
`/etc/nginx/sites-available/smr` (замінити `example.com`):
```nginx
server {
  listen 80;
  server_name example.com www.example.com;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
  }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/smr /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -d www.example.com   # безкоштовний SSL
```

### 5. DNS
У панелі домену створити A-запис `@` і `www` → IP вашого VPS.

### Оновлення після змін
```bash
cd smr && git pull && cd web && npm ci && npm run build
cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/ 2>/dev/null || true
pm2 restart smr-web
```

---

## Спосіб B — Статичний експорт (найпростіший, підходить і для shared-хостингу)

Оскільки зараз дані демонстраційні, сайт можна віддавати як статику без Node.

1. У `next.config.ts` тимчасово замінити `output: "standalone"` на
   `output: "export"`.
2. Зібрати:
   ```bash
   cd web && npm ci && npm run build     # згенерує папку web/out
   ```
3. Завантажити вміст `web/out/` у корінь сайту:
   - **shared ukraine.com.ua**: у `public_html/` через FTP/файловий менеджер;
   - **VPS + nginx**: у `root /var/www/smr;` і `try_files $uri $uri.html $uri/ =404;`.

> Обмеження експорту: без SSR і серверних функцій. Коли додамо Supabase-auth із
> SSR — повертаємось на Спосіб A.

---

## Адмінпанель на піддомені `admin.sportmarket.review`

Адмінка (`admin/index.html`) — **статична** (Node не потрібен), віддається nginx
з окремого server-блоку на піддомені. A-запис `admin` → IP VPS має існувати.

```bash
# 1. скопіювати статику у веб-корінь (репозиторій уже клоновано в /root/smr)
mkdir -p /var/www/smr-admin
cp -r /root/smr/admin/* /var/www/smr-admin/

# 2. nginx-блок для піддомену
cat >/etc/nginx/sites-available/smr-admin <<'EOF'
server {
  listen 80;
  server_name admin.sportmarket.review;
  root /var/www/smr-admin;
  index index.html;
  location / { try_files $uri $uri/ /index.html; }
}
EOF
ln -sf /etc/nginx/sites-available/smr-admin /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# 3. SSL для піддомену
certbot --nginx -d admin.sportmarket.review --non-interactive --agree-tos -m tokariev.bohdan@gmail.com
```

Оновлення після змін: `cp -r /root/smr/admin/* /var/www/smr-admin/` (після `git pull`).

> **Безпека.** Поточна адмінка має **клієнтську демо-автентифікацію** (пароль
> `smr2026`) — вона НЕ захищає дані по-справжньому (обходиться в браузері). Це
> прийнятно лише для демо. Оскільки піддомен публічний, поставте додатковий
> шлюз HTTP Basic Auth на рівні nginx, поки не зробимо серверну авторизацію
> адмінів через Supabase:
> ```bash
> apt install -y apache2-utils
> htpasswd -c /etc/nginx/.htpasswd smradmin        # задасте пароль
> # у server-блоці smr-admin додати в location /:
> #   auth_basic "SMR Admin"; auth_basic_user_file /etc/nginx/.htpasswd;
> nginx -t && systemctl reload nginx
> ```

---

## Що знадобиться від вас
- Доступ по SSH до VPS (root або sudo-користувач) та IP.
- Домен, делегований на DNS, де можна створити A-записи.
- Git-remote (GitHub/GitLab) або можливість залити папку `web/` на сервер.

Готовий `ecosystem.config.js` для PM2 — у цій же папці.
