import express from 'express';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { Server } from 'socket.io';
import webpush from 'web-push';
import cors from 'cors';


const VAPID_PUBLIC_KEY =
  'BMBnFZ-9VqTRc1RKQh6RBL84ZT1vD3omsMWY76aTdwQyWfyvAOqjnDuyzyLD8Hj2LJp_iZEMr9YIS8EEn-ztUVw';
const VAPID_PRIVATE_KEY = 'fAPiL4arQwdp2nG9w9Sy7K-06ChrDqbc0hT_9ouo83k';

webpush.setVapidDetails('mailto:student@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

interface PushSubscriptionData {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NewTaskPayload {
  text: string;
  timestamp: number;
}

let subscriptions: PushSubscriptionData[] = [];

const app = express();
app.use(cors());
app.use(express.json());

// Раздача статических файлов из папки public
app.use(express.static(path.join(__dirname, '../public')));

// Публичный VAPID-ключ для клиента (чтобы не хардкодить в app.ts)
app.get('/vapid-public-key', (_req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});


app.post('/subscribe', (req, res) => {
  const subscription = req.body as PushSubscriptionData;
  const exists = subscriptions.some((s) => s.endpoint === subscription.endpoint);
  if (!exists) {
    subscriptions.push(subscription);
  }
  res.status(201).json({ message: 'Подписка сохранена' });
});


app.post('/unsubscribe', (req, res) => {
  const { endpoint } = req.body as { endpoint: string };
  subscriptions = subscriptions.filter((s) => s.endpoint !== endpoint);
  res.status(200).json({ message: 'Подписка удалена' });
});

// ============================================================
// HTTPS: если в корне проекта есть localhost.pem и localhost-key.pem
// (генерируются командой: mkcert localhost 127.0.0.1 ::1),
// сервер запустится по HTTPS. Иначе — HTTP.
// ============================================================
const certPath = path.join(__dirname, '../localhost.pem');
const keyPath = path.join(__dirname, '../localhost-key.pem');
const useHttps = fs.existsSync(certPath) && fs.existsSync(keyPath);

const serverInstance = useHttps
  ? https.createServer({ cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) }, app)
  : http.createServer(app);

// Socket.IO
const io = new Server(serverInstance, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
  console.log('Клиент подключён:', socket.id);

  socket.on('newTask', (task: NewTaskPayload) => {
    // Рассылаем событие всем подключённым клиентам (включая отправителя)
    io.emit('taskAdded', task);

    // Отправляем push-уведомление всем подписанным клиентам
    const payload = JSON.stringify({ title: 'Новая задача', body: task.text });
    subscriptions.forEach((sub) => {
      webpush.sendNotification(sub, payload).catch((err) => {
        console.error('Push error:', err);
      });
    });
  });

  socket.on('disconnect', () => {
    console.log('Клиент отключён:', socket.id);
  });
});

const PORT = 3001;
serverInstance.listen(PORT, () => {
  const protocol = useHttps ? 'https' : 'http';
  console.log(`Сервер запущен: ${protocol}://localhost:${PORT}`);
  if (!useHttps) {
    console.log('Для HTTPS выполните:');
    console.log('  mkcert -install');
    console.log('  mkcert localhost 127.0.0.1 ::1');
    console.log('Скопируйте localhost.pem и localhost-key.pem в корень проекта и перезапустите.');
  }
});
