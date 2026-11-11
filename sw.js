// Oiru Bio — service worker (offline + sempre busca versão nova)
const CACHE = 'oiru-v5';
const ASSETS = [
  './', './index.html', './app.js', './manifest.json',
  './logo-branco.png', './logo-verde.png',
  './icon-192.png', './icon-512.png',
  './icon-arvore.svg', './icon-comunidade.svg', './icon-dados.svg',
  './icon-gota.svg', './icon-mapa.svg', './icon-rede.svg', './icon-registro.svg', './icon-sensor.svg',
  './leaflet/leaflet.css', './leaflet/leaflet.js',
  './leaflet/images/marker-icon.png', './leaflet/images/marker-icon-2x.png', './leaflet/images/marker-shadow.png',
  './leaflet/images/layers.png', './leaflet/images/layers-2x.png',
  './sora-regular.ttf', './sora-semibold.ttf', './sora-bold.ttf'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k !== CACHE).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // HTML e JS: NETWORK-FIRST — sempre pega a versão nova quando online
  if(e.request.mode === 'navigate' || url.pathname.endsWith('.js') || url.pathname.endsWith('.json')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // assets estáticos (fonte, logo, ícones): cache-first
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }))
  );
});
