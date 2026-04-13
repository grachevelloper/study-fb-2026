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

interface NewReminderPayload {
  id: string;
  text: string;
  reminderTime: number;
}

interface ReminderEntry {
  timeoutId: ReturnType<typeof setTimeout>;
  text: string;
  reminderTime: number;
}

let subscriptions: PushSubscriptionData[] = [];


const reminders = new Map<string, ReminderEntry>();

const app = express();
app.use(cors());
app.use(express.json());


app.use(express.static(path.join(__dirname, '../public')));


app.get('/vapid-public-key', (_req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});


app.post('/subscribe', (req, res) => {
  const subscription = req.body as PushSubscriptionData;
  const exists = subscriptions.some((s) => s.endpoint === subscription.endpoint);
  if (!exists) {
    subscriptions.push(subscription);
    console.log(`[subscribe] Новая подписка добавлена. Всего подписок: ${subscriptions.length}`);
  } else {
    console.log(`[subscribe] Подписка уже существует. Всего подписок: ${subscriptions.length}`);
  }
  res.status(201).json({ message: 'Подписка сохранена' });
});


app.post('/unsubscribe', (req, res) => {
  const { endpoint } = req.body as { endpoint: string };
  subscriptions = subscriptions.filter((s) => s.endpoint !== endpoint);
  res.status(200).json({ message: 'Подписка удалена' });
});

// Эндпоинт для откладывания напоминания на 5 минут
app.post('/snooze', (req, res) => {
  const reminderId = req.query.reminderId as string;
  if (!reminderId || !reminders.has(reminderId)) {
    res.status(404).json({ error: 'Reminder not found' });
    return;
  }

  const reminder = reminders.get(reminderId)!;
  clearTimeout(reminder.timeoutId);

  const newDelay = 5 * 60 * 1000;
  const newTimeoutId = setTimeout(() => {
    const payload = JSON.stringify({
      title: 'Напоминание отложено',
      body: reminder.text,
      reminderId,
    });
    subscriptions.forEach((sub) => {
      webpush.sendNotification(sub, payload).catch((err) => {
        console.error('Push error:', err);
      });
    });
    reminders.delete(reminderId);
  }, newDelay);

  reminders.set(reminderId, {
    timeoutId: newTimeoutId,
    text: reminder.text,
    reminderTime: Date.now() + newDelay,
  });

  res.status(200).json({ message: 'Reminder snoozed for 5 minutes' });
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
  
    io.emit('taskAdded', task);

    
    const payload = JSON.stringify({ title: 'Новая задача', body: task.text });
    subscriptions.forEach((sub) => {
      webpush.sendNotification(sub, payload).catch((err) => {
        console.error('Push error:', err);
      });
    });
  });

  socket.on('newReminder', (reminder: NewReminderPayload) => {
    const { id, text, reminderTime } = reminder;
    const delay = reminderTime - Date.now();
    console.log(`[newReminder] id=${id}, delay=${Math.round(delay / 1000)}с, подписок=${subscriptions.length}`);
    if (delay <= 0) {
      console.log(`[newReminder] Пропущено — время уже прошло`);
      return;
    }

    if (reminders.has(id)) {
      console.log(`[newReminder] Уже запланировано, пропускаем: id=${id}`);
      return;
    }

    const timeoutId = setTimeout(() => {
      console.log(`[push] Отправляем push для id=${id}, подписок=${subscriptions.length}`);
      const payload = JSON.stringify({
        title: '🔔 Напоминание',
        body: text,
        reminderId: id,
      });
      subscriptions.forEach((sub, i) => {
        webpush.sendNotification(sub, payload)
          .then(() => console.log(`[push] Успешно отправлено подписчику #${i}`))
          .catch((err: unknown) => console.error(`[push] Ошибка подписчику #${i}:`, err));
      });
      reminders.delete(id);
    }, delay);

    reminders.set(id, { timeoutId, text, reminderTime });
    console.log(`[newReminder] Запланировано: id=${id}, через ${Math.round(delay / 1000)}с`);
  });

  socket.on('disconnect', () => {
    console.log('Клиент отключён:', socket.id);
  });
});

const PORT = 3001;
serverInstance.listen(PORT, () => {
  const protocol = useHttps ? 'https' : 'http';
  console.log(`Сервер запущен: ${protocol}://localhost:${PORT}`);
});
