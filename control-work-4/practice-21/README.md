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

Запустить Redis:

```bash
docker run -d --name redis-cache -p 6379:6379 redis
```

Создать `.env` (см. `.env.example`):

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
