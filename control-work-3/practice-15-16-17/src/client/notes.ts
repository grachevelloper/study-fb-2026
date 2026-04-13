import { loadTasks, saveTasks, generateId, escapeHtml } from './storage';
import { emitNewTask, emitNewReminder } from './socket';
import type { Task, TaskPayload } from './types';

export function initNotes(): void {
  const form = document.getElementById('note-form') as HTMLFormElement;
  const input = document.getElementById('note-input') as HTMLInputElement;
  const reminderForm = document.getElementById('reminder-form') as HTMLFormElement;
  const reminderText = document.getElementById('reminder-text') as HTMLInputElement;
  const reminderTime = document.getElementById('reminder-time') as HTMLInputElement;
  const list = document.getElementById('notes-list') as HTMLUListElement;
  const filterBtns = document.querySelectorAll<HTMLButtonElement>('.filter-btn');
  const clearBtn = document.getElementById('clear-completed-btn');

  let currentFilter: 'all' | 'active' | 'completed' = 'all';

  function applyFilter(tasks: Task[]): Task[] {
    if (currentFilter === 'active') return tasks.filter((t) => !t.completed);
    if (currentFilter === 'completed') return tasks.filter((t) => t.completed);
    return tasks;
  }

  function renderTasks(): void {
    const allTasks = loadTasks();
    const visible = applyFilter(allTasks);
    list.innerHTML = '';

    if (visible.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'empty-state';
      empty.textContent =
        allTasks.length === 0
          ? 'Пока задач нет. Добавьте первую запись.'
          : currentFilter === 'active'
            ? 'Нет активных задач.'
            : 'Нет выполненных задач.';
      list.appendChild(empty);
    } else {
      visible.forEach((task) => {
        const li = document.createElement('li');
        li.className = 'task-item' + (task.completed ? ' task-item--done' : '');
        li.dataset.id = task.id;

        let reminderInfo = '';
        if (task.reminder) {
          const date = new Date(task.reminder);
          reminderInfo = `<span class="task-item__reminder">🔔 Напоминание: ${date.toLocaleString()}</span>`;
        }

        li.innerHTML = `
          <label class="task-item__label">
            <input type="checkbox" ${task.completed ? 'checked' : ''} data-action="toggle" />
            <span class="task-item__text${task.completed ? ' task-item__text--completed' : ''}">${escapeHtml(task.text)}</span>
          </label>
          ${reminderInfo}
          <button class="button button--danger button--small" data-action="delete">Удалить</button>
        `;
        list.appendChild(li);
      });
    }

    const statsEl = document.getElementById('task-stats');
    if (statsEl) {
      const total = allTasks.length;
      const done = allTasks.filter((t) => t.completed).length;
      statsEl.textContent = `Всего: ${total} | Активных: ${total - done} | Выполненных: ${done}`;
    }
  }

  function addTask(text: string, reminderTimestamp: number | null = null): void {
    const trimmed = text.trim();
    if (!trimmed) return;
    const tasks = loadTasks();
    const newTask: Task = {
      id: generateId(),
      text: trimmed,
      completed: false,
      createdAt: new Date().toISOString(),
      reminder: reminderTimestamp,
    };
    tasks.unshift(newTask);
    saveTasks(tasks);
    renderTasks();

    if (reminderTimestamp) {
      emitNewReminder({ id: newTask.id, text: trimmed, reminderTime: reminderTimestamp });
    } else {
      const payload: TaskPayload = { text: trimmed, timestamp: Date.now() };
      emitNewTask(payload);
    }
  }

  form.addEventListener('submit', (e: Event) => {
    e.preventDefault();
    addTask(input.value);
    input.value = '';
    input.focus();
  });

  reminderForm.addEventListener('submit', (e: Event) => {
    e.preventDefault();
    const text = reminderText.value.trim();
    const datetime = reminderTime.value;
    if (text && datetime) {
      const timestamp = new Date(datetime).getTime();
      if (timestamp > Date.now()) {
        addTask(text, timestamp);
        reminderText.value = '';
        reminderTime.value = '';
      } else {
        alert('Дата напоминания должна быть в будущем');
      }
    }
  });

  list.addEventListener('click', (e: Event) => {
    const target = e.target as HTMLElement;
    const item = target.closest<HTMLElement>('[data-id]');
    if (!item) return;
    const id = item.dataset.id as string;
    if (target.dataset.action === 'delete') {
      saveTasks(loadTasks().filter((t) => t.id !== id));
      renderTasks();
    }
  });

  list.addEventListener('change', (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.dataset.action !== 'toggle') return;
    const item = target.closest<HTMLElement>('[data-id]');
    if (!item) return;
    const id = item.dataset.id as string;
    saveTasks(loadTasks().map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
    renderTasks();
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter as 'all' | 'active' | 'completed';
      filterBtns.forEach((b) => b.classList.remove('filter-btn--active'));
      btn.classList.add('filter-btn--active');
      renderTasks();
    });
  });

  clearBtn?.addEventListener('click', () => {
    saveTasks(loadTasks().filter((t) => !t.completed));
    renderTasks();
  });

  const pendingReminders = loadTasks().filter(
    (t) => t.reminder !== null && t.reminder !== undefined && t.reminder > Date.now(),
  );
  console.log(`[notes] Переотправка напоминаний при загрузке: ${pendingReminders.length} шт.`);
  pendingReminders.forEach((t) => {
    console.log(`[notes] emitNewReminder: id=${t.id}, text="${t.text}", reminderTime=${new Date(t.reminder as number).toLocaleString()}`);
    emitNewReminder({ id: t.id, text: t.text, reminderTime: t.reminder as number });
  });

  renderTasks();
}
