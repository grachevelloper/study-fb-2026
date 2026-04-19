# Практика 19: REST API с PostgreSQL

## Запуск

```bash
npm install
npm run dev
```

`.env` в корне проекта:

```env
PG_USER=nrgrachev
PG_PASSWORD=...
PG_DATABASE=practice19
```

Создать БД перед первым запуском:

```bash
psql postgres -c "CREATE DATABASE practice19;"
```

## Тестирование через curl

```bash
# Создать пользователя
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Иван","last_name":"Иванов","age":25}'

# Список всех
curl http://localhost:3000/api/users

# Получить по id
curl http://localhost:3000/api/users/1

# Обновить
curl -X PATCH http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"age":26}'

# Удалить
curl -X DELETE http://localhost:3000/api/users/1
```
