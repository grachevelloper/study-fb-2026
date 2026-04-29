# Практика 22: Балансировка нагрузки в веб-приложениях

## Описание

Практика демонстрирует балансировку HTTP-запросов между несколькими экземплярами backend-приложения.

Реализовано:

- три backend-сервера на Express;
- Nginx как основной балансировщик нагрузки;
- настройки отказоустойчивости `max_fails` и `fail_timeout`;
- резервный backend-сервер `backend3`;
- альтернативная балансировка через HAProxy;
- пример Kubernetes Service с типом `LoadBalancer`.

## Структура

```text
src/server.ts              # backend-сервер с /, /api/info и /health
nginx/nginx.conf           # upstream backend + max_fails/fail_timeout
haproxy/haproxy.cfg        # frontend/backend + health checks
docker-compose.yml         # backend1, backend2, backend3, nginx, haproxy
k8s/backend-service.yml    # пример Service для Kubernetes
```

## Локальный запуск backend-серверов

```bash
npm install

# В разных терминалах
npm run dev:backend1
npm run dev:backend2
npm run dev:backend3
```

Проверка отдельных backend-серверов:

```bash
curl http://localhost:3000
curl http://localhost:3001
curl http://localhost:3002
```

## Запуск с Nginx

```bash
npm run compose:nginx
```

Nginx будет доступен на порту `8080`.

Проверка распределения запросов:

```bash
for i in {1..6}; do curl -s http://localhost:8080 | jq; done
```

В ответах поле `instance` будет чередоваться между `backend-1` и `backend-2`.
Сервер `backend-3-backup` используется как резервный и начнет получать запросы, если основные серверы станут недоступны.

## Отказоустойчивость в Nginx

В `nginx/nginx.conf` настроен upstream:

```nginx
upstream backend {
  server backend1:3000 max_fails=2 fail_timeout=30s;
  server backend2:3000 max_fails=2 fail_timeout=30s;
  server backend3:3000 backup;
}
```

Если один из основных backend-серверов дважды подряд не отвечает, Nginx временно исключает его из балансировки на `30s`.

Проверка:

```bash
docker stop practice-22-backend-1
for i in {1..6}; do curl -s http://localhost:8080 | jq; done
```

После остановки `backend-1` запросы продолжит обрабатывать `backend-2`. Если остановить оба основных сервера, Nginx переключится на `backend-3-backup`.

## Запуск с HAProxy

```bash
npm run compose:haproxy
```

HAProxy будет доступен на порту `8081`, страница статистики - на `http://localhost:8404/stats`.

Проверка:

```bash
for i in {1..6}; do curl -s http://localhost:8081 | jq; done
```

В `haproxy/haproxy.cfg` используется `balance roundrobin` и health check по маршруту `/health`.

## Остановка

```bash
npm run compose:down
```

## Сборка

```bash
npm run build
npm start
```
