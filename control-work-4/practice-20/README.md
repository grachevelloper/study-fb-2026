# Практика 20: REST API с MongoDB

## Запуск

Создай `.env` в корне проекта:

```env
MONGO_URI="mongodb+srv://<user>:<password>@cluster0.wudqtoj.mongodb.net/practice20?appName=Cluster0"
```

```bash
npm install
npm run dev
```

## Тестирование через curl

```bash
# Создать пользователя
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Михаил","last_name":"Петров","age":20}'

# Список всех
curl http://localhost:3000/api/users

# Получить по id
curl http://localhost:3000/api/users/<_id>

# Обновить
curl -X PATCH http://localhost:3000/api/users/<_id> \
  -H "Content-Type: application/json" \
  -d '{"age":21}'

# Удалить
curl -X DELETE http://localhost:3000/api/users/<_id>
```
