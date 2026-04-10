# Практики 15–16–17: HTTPS · App Shell · WebSocket · Push · Напоминания

Учебный TODO-менеджер с полным стеком браузерных технологий. Продолжение практик 13–14.

## Что реализовано

| Практика | Тема | Что добавлено |
|----------|------|---------------|
| 15 | HTTPS + App Shell | Node.js/Express сервер, локальный HTTPS через mkcert, архитектура App Shell (динамическая загрузка контента через fetch) |
| 16 | WebSocket + Push | Двусторонняя связь через Socket.IO, Push-уведомления через Web Push API + VAPID |
| 17 | Детализация Push | Форма с напоминаниями (datetime-local), серверное планирование через setTimeout, кнопка «Отложить на 5 минут» в уведомлении, эндпоинт /snooze |

## Структура проекта

```
src/
  server.ts              # Express + Socket.IO + web-push + /snooze
  client/
    types.ts             # Интерфейсы: Task, TaskPayload, ReminderPayload, ...
    constants.ts         # STORAGE_KEY, SERVER_URL
    storage.ts           # localStorage: loadTasks, saveTasks, generateId, escapeHtml
    socket.ts            # Socket.IO клиент: initSocket, emitNewTask, emitNewReminder
    push.ts              # Web Push: fetchVapidKey, subscribeToPush, unsubscribeFromPush
    notes.ts             # Логика задач и напоминаний: initNotes
    shell.ts             # App Shell навигация: loadContent
    pwa.ts               # Регистрация SW, install prompt, кнопки push
    main.ts              # Точка входа клиента
    sw.ts                # Service Worker: кэш, push, notificationclick, snooze
public/
  app.js                 # Клиентский бандл (esbuild из main.ts)
  sw.js                  # Service Worker (esbuild из sw.ts)
  index.html             # App Shell каркас (header, nav, footer — постоянные)
  styles.css
  manifest.json
  assets/icon.svg
  content/
    home.html            # Формы задач и напоминаний + список (динамический контент)
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

Push-уведомления в браузере требуют HTTPS (исключение — localhost).
Для полноценного тестирования на локальной машине:

```bash
# macOS
brew install mkcert

# Windows
choco install mkcert

mkcert -install
mkcert localhost 127.0.0.1 ::1
```

Скопировать `localhost.pem` и `localhost-key.pem` в корень проекта.
При следующем `npm start` сервер автоматически запустится по `https://localhost:3001`.

### Генерация VAPID-ключей (Практика 16)

VAPID — пара ключей для идентификации сервера перед push-сервисом браузера.

```bash
npm run generate-vapid
```

Заменить значения `VAPID_PUBLIC_KEY` и `VAPID_PRIVATE_KEY` в `src/server.ts`, затем пересобрать:

```bash
npm run build && npm start
```

## Команды сборки

```bash
npm run build        # полная сборка: server + client + sw
npm run build:server # только сервер (TypeScript → dist/server.js)
npm run build:client # только клиент (esbuild → public/app.js)
npm run build:sw     # только Service Worker (esbuild → public/sw.js)
npm run typecheck    # проверка типов без компиляции
npm run dev          # запуск сервера через ts-node (без пересборки клиента)
```

## Как проверить работу

### Базовый сценарий
1. `npm run build && npm start`
2. Открыть `http://localhost:3001`
3. Добавить задачу → она сохраняется в localStorage
4. Перезагрузить страницу → задачи остаются

### WebSocket (Практика 16)
1. Открыть две вкладки на `http://localhost:3001`
2. В одной добавить задачу → в другой появится всплывающее уведомление

### Push-уведомления (Практика 16)
1. Нажать «Включить уведомления» → разрешить в браузере
2. Свернуть браузер или закрыть вкладку
3. В другой вкладке добавить задачу → придёт системное уведомление

### Напоминания (Практика 17)
1. Заполнить форму «Добавить с напоминанием» (текст + дата/время в будущем)
2. Нажать «Добавить с напоминанием»
3. Дождаться указанного времени → придёт push с кнопкой «Отложить на 5 минут»
4. Нажать «Отложить» → через 5 минут напоминание придёт повторно

### PWA и офлайн
1. DevTools → Application → Service Workers → убедиться что SW активен
2. DevTools → Application → Cache Storage → видны кэши `notes-cache-v4` и `dynamic-content-v1`
3. DevTools → Network → Offline → страница открывается из кэша

## Архитектура: как данные проходят через систему

```
Пользователь заполняет форму напоминания
        ↓
notes.ts → сохраняет в localStorage → emitNewReminder() через WebSocket
        ↓
server.ts → получает событие → setTimeout(delay) → сохраняет в Map<reminders>
        ↓
[проходит время...]
        ↓
setTimeout срабатывает → webpush.sendNotification() → Push-сервер Google/Mozilla
        ↓
Service Worker (sw.ts) → событие push → showNotification() с кнопкой «Отложить»
        ↓
Пользователь нажимает «Отложить» → fetch('/snooze?reminderId=...')
        ↓
server.ts → clearTimeout() → новый setTimeout(5 минут)
```

## Технологии

- **Node.js + Express** — HTTP/HTTPS сервер, раздача статики, REST-эндпоинты
- **Socket.IO** — WebSocket с автоматическим fallback на long-polling
- **web-push** — отправка push через протокол Web Push (VAPID)
- **Service Worker** — перехват запросов, кэш, получение push в фоне
- **TypeScript** — строгая типизация на сервере и клиенте
- **esbuild** — сборка клиентского кода (значительно быстрее webpack)
- **mkcert** — доверенные локальные TLS-сертификаты
