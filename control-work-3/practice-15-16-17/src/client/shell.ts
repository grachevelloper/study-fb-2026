import { initNotes } from './notes';

const contentDiv = document.getElementById('app-content') as HTMLElement;
const homeBtn = document.getElementById('home-btn') as HTMLButtonElement;
const aboutBtn = document.getElementById('about-btn') as HTMLButtonElement;

export function setActiveButton(activeId: string): void {
  [homeBtn, aboutBtn].forEach((btn) => btn.classList.remove('active'));
  (document.getElementById(activeId) as HTMLButtonElement).classList.add('active');
}

export async function loadContent(page: string): Promise<void> {
  try {
    const response = await fetch(`/content/${page}.html`);
    const html = await response.text();
    contentDiv.innerHTML = html;
    if (page === 'home') {
      initNotes();
    }
  } catch (err) {
    contentDiv.innerHTML =
      '<p class="empty-state">Ошибка загрузки страницы. Проверьте подключение.</p>';
    console.error(err);
  }
}

homeBtn.addEventListener('click', () => {
  setActiveButton('home-btn');
  loadContent('home');
});

aboutBtn.addEventListener('click', () => {
  setActiveButton('about-btn');
  loadContent('about');
});
