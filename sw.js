/* Service Worker：离线缓存应用外壳；新闻数据由页面 localStorage 缓存 */
const CACHE = 'brief-shell-v4';
const SHELL = ['./index.html', './manifest.json', 'icons/icon-180.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // 新闻接口不走缓存（页面已有 localStorage 兜底），保证每次拿到最新
  if (url.includes('rss2json') || url.includes('allorigins') || url.includes('news.google') || url.includes('mymemory')) return;
  // 应用外壳：缓存优先，未命中则网络回源并写入缓存
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return resp;
    }).catch(() => caches.match('./index.html')))
  );
});
