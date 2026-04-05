import { updateNetworkStatus } from './pwa';
import { initSocket } from './socket';
import { setActiveButton, loadContent } from './shell';

updateNetworkStatus();
window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);

initSocket();
setActiveButton('home-btn');
loadContent('home');
