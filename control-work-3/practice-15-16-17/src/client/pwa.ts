import { fetchVapidKey, subscribeToPush, unsubscribeFromPush } from './push';
import { SERVER_URL } from './constants';
import type { BeforeInstallPromptEvent } from './types';

const networkStatus = document.getElementById('networkStatus') as HTMLElement;
const installBtn = document.getElementById('installBtn') as HTMLButtonElement;

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function updateNetworkStatus(): void {
  const isOnline = navigator.onLine;
  networkStatus.textContent = isOnline ? 'Онлайн' : 'Офлайн';
  networkStatus.classList.toggle('badge--success', isOnline);
  networkStatus.classList.toggle('badge--offline', !isOnline);
}

window.addEventListener('beforeinstallprompt', (e: Event) => {
  e.preventDefault();
  deferredInstallPrompt = e as BeforeInstallPromptEvent;
  if (!isStandalone()) installBtn.hidden = false;
});

installBtn.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  await deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installBtn.hidden = true;
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  installBtn.hidden = true;
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered:', reg.scope);

      await fetchVapidKey();

      const enableBtn = document.getElementById('enable-push') as HTMLButtonElement | null;
      const disableBtn = document.getElementById('disable-push') as HTMLButtonElement | null;

      if (enableBtn && disableBtn) {
        const existingSub = await reg.pushManager.getSubscription();
        if (existingSub) {
          console.log('[pwa] Найдена существующая подписка, переотправляем на сервер');
          const res = await fetch(`${SERVER_URL}/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(existingSub),
          });
          console.log('[pwa] /subscribe ответ:', res.status);
          enableBtn.style.display = 'none';
          disableBtn.style.display = 'inline-block';
        } else {
          console.log('[pwa] Подписка не найдена — нужно нажать "Включить уведомления"');
        }

        enableBtn.addEventListener('click', async () => {
          if (Notification.permission === 'denied') {
            alert('Уведомления запрещены. Разрешите их в настройках браузера.');
            return;
          }
          if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
              alert('Необходимо разрешить уведомления.');
              return;
            }
          }
          await subscribeToPush();
          enableBtn.style.display = 'none';
          disableBtn.style.display = 'inline-block';
        });

        disableBtn.addEventListener('click', async () => {
          await unsubscribeFromPush();
          disableBtn.style.display = 'none';
          enableBtn.style.display = 'inline-block';
        });
      }
    } catch (err) {
      console.error('SW registration failed:', err);
    }
  });
}
