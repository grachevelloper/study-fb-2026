"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const socket_io_1 = require("socket.io");
const web_push_1 = __importDefault(require("web-push"));
const cors_1 = __importDefault(require("cors"));
const VAPID_PUBLIC_KEY = 'BMBnFZ-9VqTRc1RKQh6RBL84ZT1vD3omsMWY76aTdwQyWfyvAOqjnDuyzyLD8Hj2LJp_iZEMr9YIS8EEn-ztUVw';
const VAPID_PRIVATE_KEY = 'fAPiL4arQwdp2nG9w9Sy7K-06ChrDqbc0hT_9ouo83k';
web_push_1.default.setVapidDetails('mailto:student@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
let subscriptions = [];
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Раздача статических файлов из папки public
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// Публичный VAPID-ключ для клиента (чтобы не хардкодить в app.ts)
app.get('/vapid-public-key', (_req, res) => {
    res.json({ publicKey: VAPID_PUBLIC_KEY });
});
app.post('/subscribe', (req, res) => {
    const subscription = req.body;
    const exists = subscriptions.some((s) => s.endpoint === subscription.endpoint);
    if (!exists) {
        subscriptions.push(subscription);
    }
    res.status(201).json({ message: 'Подписка сохранена' });
});
app.post('/unsubscribe', (req, res) => {
    const { endpoint } = req.body;
    subscriptions = subscriptions.filter((s) => s.endpoint !== endpoint);
    res.status(200).json({ message: 'Подписка удалена' });
});
// ============================================================
// HTTPS: если в корне проекта есть localhost.pem и localhost-key.pem
// (генерируются командой: mkcert localhost 127.0.0.1 ::1),
// сервер запустится по HTTPS. Иначе — HTTP.
// ============================================================
const certPath = path_1.default.join(__dirname, '../localhost.pem');
const keyPath = path_1.default.join(__dirname, '../localhost-key.pem');
const useHttps = fs_1.default.existsSync(certPath) && fs_1.default.existsSync(keyPath);
const serverInstance = useHttps
    ? https_1.default.createServer({ cert: fs_1.default.readFileSync(certPath), key: fs_1.default.readFileSync(keyPath) }, app)
    : http_1.default.createServer(app);
// Socket.IO
const io = new socket_io_1.Server(serverInstance, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
});
io.on('connection', (socket) => {
    console.log('Клиент подключён:', socket.id);
    socket.on('newTask', (task) => {
        // Рассылаем событие всем подключённым клиентам (включая отправителя)
        io.emit('taskAdded', task);
        // Отправляем push-уведомление всем подписанным клиентам
        const payload = JSON.stringify({ title: 'Новая задача', body: task.text });
        subscriptions.forEach((sub) => {
            web_push_1.default.sendNotification(sub, payload).catch((err) => {
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
