# Практика 21: Кэширование с использованием Redis

## Описание

Приложение расширяет практику №11 (RBAC REST API) — добавлено кэширование запросов через Redis.

| Маршрут | Метод | TTL | Описание |
|---|---|---|---|
| `/api/users` | GET | 60 с | Список пользователей |
| `/api/users/:id` | GET | 60 с | Пользователь по id |
| `/api/products` | GET | 600 с | Список товаров |
| `/api/products/:id` | GET | 600 с | Товар по id |

При изменении данных соответствующий кэш инвалидируется автоматически.

## Запуск

Создать `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

Запустить Redis через Docker Compose:

```bash
npm run redis:up
```

Или вручную:

```bash
docker compose up -d redis
```

Основные переменные окружения:

```env
PORT=3000
JWT_SECRET=your_access_secret
REFRESH_SECRET=your_refresh_secret
REDIS_URL=redis://127.0.0.1:6379
```

Установить зависимости и запустить:

```bash
npm install
npm run dev
```

Для production-сборки:

```bash
npm run build
npm start
```

## Структура

```text
src/
  auth.routes.ts        # регистрация, вход, refresh/logout/me
  users.routes.ts       # CRUD пользователей + кэш users:*
  products.routes.ts    # CRUD товаров + кэш products:*
  routes.ts             # подключение route-модулей
  cache.ts              # Redis client, saveToCache, invalidation
  middlewares/          # auth, roles, cacheMiddleware, respondWithCache
  utils/                # утилиты пользователей, товаров, токенов и request helpers
```

## Тестирование кэша

```bash
# Регистрация (первый пользователь станет admin)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","first_name":"Admin","last_name":"User","password":"secret"}'

# Вход
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"secret"}'

# Первый запрос — source: "server" (данные сохраняются в Redis)
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer <accessToken>"

# Повторный запрос в течение 1 минуты — source: "cache"
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer <accessToken>"

# После PUT/DELETE кэш инвалидируется, следующий GET снова обратится к серверу
```
