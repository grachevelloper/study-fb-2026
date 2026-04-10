import { io, Socket } from 'socket.io-client';
import { SERVER_URL } from './constants';
import type { TaskPayload, ReminderPayload } from './types';

let socket!: Socket;

export function initSocket(): void {
  socket = io(SERVER_URL);
  socket.on('taskAdded', (data: TaskPayload) => {
    console.log('Задача от другого клиента:', data);
    showWsNotification(`Новая задача: ${data.text}`);
  });
}

export function emitNewTask(payload: TaskPayload): void {
  socket.emit('newTask', payload);
}

export function emitNewReminder(payload: ReminderPayload): void {
  socket.emit('newReminder', payload);
}

function showWsNotification(message: string): void {
  const el = document.createElement('div');
  el.className = 'ws-notification';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}
