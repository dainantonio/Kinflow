export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  const swPath = '/Kinflow/sw.js';

  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register(swPath, { scope: '/Kinflow/' });
      console.info('Service worker registered successfully');
    } catch (error) {
      console.warn('Service worker registration failed', error);
    }
  });
}
