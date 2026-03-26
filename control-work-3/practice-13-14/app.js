const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const taskStats = document.getElementById('taskStats');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const networkStatus = document.getElementById('networkStatus');
const installBtn = document.getElementById('installBtn');
const installHint = document.getElementById('installHint');
const filterBtns = document.querySelectorAll('.filter-btn');

const STORAGE_KEY = 'practice_13_14_todos_v2';

let currentFilter = 'all';
let deferredInstallPrompt = null;

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function updateNetworkStatus() {
  const isOnline = navigator.onLine;
  networkStatus.textContent = isOnline ? 'Онлайн' : 'Офлайн';
  networkStatus.classList.toggle('badge--success', isOnline);
  networkStatus.classList.toggle('badge--offline', !isOnline);
}

function applyFilter(tasks) {
  if (currentFilter === 'active') return tasks.filter((t) => !t.completed);
  if (currentFilter === 'completed') return tasks.filter((t) => t.completed);
  return tasks;
}

function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = 'task-item';
  li.dataset.id = task.id;

  const left = document.createElement('div');
  left.className = 'task-item__left';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = task.completed;
  checkbox.dataset.action = 'toggle';

  const text = document.createElement('span');
  text.className = 'task-item__text' + (task.completed ? ' task-item__text--completed' : '');
  text.textContent = task.text;

  left.appendChild(checkbox);
  left.appendChild(text);

  const actions = document.createElement('div');
  actions.className = 'task-item__actions';

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'button button--secondary button--small';
  editBtn.textContent = 'Изменить';
  editBtn.dataset.action = 'edit';

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'button button--danger button--small';
  deleteBtn.textContent = 'Удалить';
  deleteBtn.dataset.action = 'delete';

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);
  li.appendChild(left);
  li.appendChild(actions);

  return li;
}

function switchToEditMode(li, task) {
  li.classList.add('task-item--editing');

  const left = li.querySelector('.task-item__left');
  left.querySelector('input[type="checkbox"]').hidden = true;
  left.querySelector('.task-item__text').hidden = true;

  const editInput = document.createElement('input');
  editInput.type = 'text';
  editInput.className = 'task-item__edit-input';
  editInput.value = task.text;
  editInput.maxLength = 120;
  editInput.dataset.role = 'edit-input';
  left.appendChild(editInput);
  editInput.focus();
  editInput.select();

  const actions = li.querySelector('.task-item__actions');
  actions.innerHTML = '';

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'button button--success button--small';
  saveBtn.textContent = 'Сохранить';
  saveBtn.dataset.action = 'save-edit';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'button button--secondary button--small';
  cancelBtn.textContent = 'Отмена';
  cancelBtn.dataset.action = 'cancel-edit';

  actions.appendChild(saveBtn);
  actions.appendChild(cancelBtn);

  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveBtn.click();
    if (e.key === 'Escape') cancelBtn.click();
  });
}

function updateStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  taskStats.textContent = `Всего: ${total} | Активных: ${total - completed} | Выполненных: ${completed}`;
}

function renderTasks() {
  const allTasks = loadTasks();
  const visible = applyFilter(allTasks);

  taskList.innerHTML = '';

  if (visible.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = allTasks.length === 0
      ? 'Пока задач нет. Добавьте первую запись.'
      : currentFilter === 'active' ? 'Нет активных задач.' : 'Нет выполненных задач.';
    taskList.appendChild(empty);
  } else {
    visible.forEach((task) => taskList.appendChild(createTaskElement(task)));
  }

  updateStats(allTasks);
}

function addTask(text) {
  const t = text.trim();
  if (!t) return;
  const tasks = loadTasks();
  tasks.unshift({ id: generateId(), text: t, completed: false, createdAt: new Date().toISOString() });
  saveTasks(tasks);
  renderTasks();
}

function toggleTask(id) {
  saveTasks(loadTasks().map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
  renderTasks();
}

function deleteTask(id) {
  if (!window.confirm('Удалить эту задачу?')) return;
  saveTasks(loadTasks().filter((t) => t.id !== id));
  renderTasks();
}

function saveEdit(id, newText) {
  const t = newText.trim();
  if (!t) return;
  saveTasks(loadTasks().map((task) => task.id === id ? { ...task, text: t } : task));
  renderTasks();
}

function clearCompleted() {
  const tasks = loadTasks();
  const count = tasks.filter((t) => t.completed).length;
  if (count === 0) { alert('Нет выполненных задач.'); return; }
  if (!window.confirm(`Удалить ${count} выполненных задач?`)) return;
  saveTasks(tasks.filter((t) => !t.completed));
  renderTasks();
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}

function updateInstallHint() {
  if (isStandalone()) {
    installHint.textContent = 'Приложение запущено в standalone-режиме.';
    if (installBtn) installBtn.hidden = true;
    return;
  }
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  installHint.textContent = isSafari
    ? 'Safari: File → Add to Dock.'
    : 'Chrome / Edge: кнопка браузера или «Установить PWA».';
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  if (!isStandalone()) installBtn.hidden = false;
});

installBtn.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installBtn.hidden = true;
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  installBtn.hidden = true;
  updateInstallHint();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(console.error);
  });
}

taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addTask(taskInput.value);
  taskForm.reset();
  taskInput.focus();
});

taskList.addEventListener('click', (e) => {
  const item = e.target.closest('.task-item');
  if (!item) return;
  const id = item.dataset.id;
  const action = e.target.dataset.action;

  if (action === 'delete') deleteTask(id);
  else if (action === 'edit') {
    const task = loadTasks().find((t) => t.id === id);
    if (task) switchToEditMode(item, task);
  } else if (action === 'save-edit') {
    const inp = item.querySelector('[data-role="edit-input"]');
    if (inp) saveEdit(id, inp.value);
  } else if (action === 'cancel-edit') {
    renderTasks();
  }
});

taskList.addEventListener('change', (e) => {
  if (e.target.dataset.action !== 'toggle') return;
  const item = e.target.closest('.task-item');
  if (item) toggleTask(item.dataset.id);
});

filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    filterBtns.forEach((b) => b.classList.remove('filter-btn--active'));
    btn.classList.add('filter-btn--active');
    renderTasks();
  });
});

clearCompletedBtn.addEventListener('click', clearCompleted);
window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);

updateNetworkStatus();
updateInstallHint();
renderTasks();
