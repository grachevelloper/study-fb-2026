# Практики 15–16: HTTPS + App Shell + WebSocket + Push

TypeScript-реализация PWA-приложения с:
- **Практика 15**: HTTPS через mkcert, архитектура App Shell
- **Практика 16**: WebSocket (Socket.IO) + Push-уведомления

## Структура проекта

```
practice-15-16/
├── src/
│   ├── server.ts            # Сервер: Express + Socket.IO + web-push
│   └── client/
│       ├── app.ts           # Клиент (компилируется в public/app.js)
│       └── sw.ts            # Service Worker (компилируется в public/sw.js)
├── public/
│   ├── content/
│   │   ├── home.html        # Динамический контент главной страницы
│   │   └── about.html       # Страница "О приложении"
│   ├── assets/
│   │   └── icon.svg
│   ├── index.html           # App Shell (каркас)
│   ├── styles.css
│   └── manifest.json
├── tsconfig.json            # Конфиг TypeScript для сервера
├── tsconfig.client.json     # Конфиг TypeScript для клиента
├── tsconfig.sw.json         # Конфиг TypeScript для Service Worker
└── package.json
```

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Генерация VAPID-ключей

```bash
npm run generate-vapid
```

Скопируйте полученные Public Key и Private Key в `src/server.ts`:

```typescript
const VAPID_PUBLIC_KEY = 'ВАШ_ПУБЛИЧНЫЙ_КЛЮЧ';
const VAPID_PRIVATE_KEY = 'ВАШ_ПРИВАТНЫЙ_КЛЮЧ';
```

### 3. Настройка HTTPS (Практика 15)

```bash
# macOS
brew install mkcert
# Windows (через Chocolatey)
choco install mkcert

mkcert -install
mkcert localhost 127.0.0.1 ::1
```

Скопируйте `localhost.pem` и `localhost-key.pem` в корень проекта (рядом с `package.json`).

### 4. Сборка TypeScript

```bash
npm run build
```

Это создаст:
- `dist/server.js` — скомпилированный сервер
- `public/app.js` — скомпилированный клиент
- `public/sw.js` — скомпилированный Service Worker

### 5. Запуск

```bash
# Продакшн (после сборки)
npm start

# Разработка (без сборки, через ts-node)
npm run dev
```

Откройте браузер: `https://localhost:3001` (или `http://localhost:3001` без HTTPS).

## Проверка работы

1. Откройте две вкладки браузера на `https://localhost:3001`
2. В одной вкладке нажмите «Включить уведомления»
3. В другой добавьте задачу — в первой вкладке появится всплывающее сообщение (WebSocket)
4. Если вкладка свёрнута или закрыта — придёт системное Push-уведомление
5. DevTools → Application → Service Workers — SW должен быть активен
6. DevTools → Application → Cache Storage — увидите два кэша: статический и динамический
7. Отключите сеть — приложение работает из кэша
