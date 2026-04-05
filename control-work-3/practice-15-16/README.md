# Практики 15–16: HTTPS + App Shell + WebSocket + Push

Продолжение практик 13–14. Добавляет сервер, HTTPS, архитектуру App Shell, WebSocket и Push-уведомления.

## Отличия от практик 13–14

| | 13–14 | 15–16 |
|---|---|---|
| Сервер | Нет (статика) | Express + Node.js |
| Протокол | HTTP | HTTPS (mkcert) |
| Загрузка контента | Всё в `index.html` | App Shell — контент через `fetch` |
| Реальное время | Нет | WebSocket (Socket.IO) |
| Уведомления | Нет | Push (web-push + VAPID) |
| Язык | Vanilla JS | TypeScript |

## Структура проекта

```
src/
  server.ts              # Express + Socket.IO + web-push
  client/
    types.ts             # Интерфейсы Task, TaskPayload, ...
    constants.ts         # STORAGE_KEY, SERVER_URL
    storage.ts           # localStorage (loadTasks, saveTasks, ...)
    socket.ts            # Socket.IO клиент (initSocket, emitNewTask)
    push.ts              # Push API (subscribe, unsubscribe, VAPID)
    notes.ts             # Логика заметок (initNotes)
    shell.ts             # App Shell навигация (loadContent)
    pwa.ts               # SW регистрация + install prompt + push-кнопки
    main.ts              # Точка входа
    sw.ts                # Service Worker (Cache First + Network First + Push)
public/
  app.js                 # Клиентский бандл (esbuild из main.ts)
  sw.js                  # Service Worker (esbuild из sw.ts)
  index.html             # App Shell каркас
  styles.css
  manifest.json
  assets/icon.svg
  content/
    home.html            # Форма + список задач (динамический контент)
    about.html           # О приложении (динамический контент)
```

## Запуск

```bash
npm install
npm run build
npm start
# → http://localhost:3001
```

### HTTPS (Практика 15)

```bash
# macOS
brew install mkcert
# Windows: choco install mkcert

mkcert -install
mkcert localhost 127.0.0.1 ::1
```

Скопировать `localhost.pem` и `localhost-key.pem` в корень проекта. При следующем `npm start` сервер автоматически запустится по `https://localhost:3001`.

### VAPID-ключи (Практика 16)

```bash
npm run generate-vapid
```

Заменить ключи в `src/server.ts` (строки с `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`), пересобрать:

```bash
npm run build:server && npm start
```

## Сборка и проверка типов

```bash
npm run build        # полная сборка (server + client + sw)
npm run typecheck    # только проверка типов без компиляции
npm run dev          # сервер через ts-node (без пересборки клиента)
```

## Как проверить работу

1. `npm run build && npm start`
2. Открыть две вкладки на `http://localhost:3001`
3. В одной вкладке нажать «Включить уведомления»
4. В другой добавить задачу → в первой появится всплывашка (WebSocket)
5. Свернуть браузер, добавить задачу → придёт системное уведомление (Push)
6. DevTools → Application → Cache Storage → два кэша: `notes-cache-v3` и `dynamic-content-v1`
7. Отключить сеть → приложение работает из кэша
