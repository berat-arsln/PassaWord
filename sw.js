/* ========================================
   SERVİS WORKER
   Çevrimdışı destek için önbellekleme
   ======================================== */

/* Önbellek adı ve versiyonu */
const ONBELLEK_ADI = 'passaword-v2.6.01';

const ONBELLEKLENECEK = [
  './',
  './index.html',
  './manifest.json',
  './favicon.svg',
  './css/main.css',
  './css/game.css',
  './css/modals.css',
  './css/admin.css',
  './css/responsive.css',
  './js/ui.js',
  './js/profile.js',
  './js/game.js',
  './js/scores.js',
  './js/feedback.js',
  './js/admin.js',
  './js/app.js',
  './questions/a_questions.json',
  './questions/b_questions.json',
  './questions/c_questions.json',
  './questions/ch_questions.json',
  './questions/d_questions.json',
  './questions/e_questions.json',
  './questions/f_questions.json',
  './questions/g_questions.json',
  './questions/h_questions.json',
  './questions/i_questions.json',
  './questions/k_questions.json',
  './questions/l_questions.json',
  './questions/m_questions.json',
  './questions/n_questions.json',
  './questions/o_questions.json',
  './questions/oo_questions.json',
  './questions/p_questions.json',
  './questions/r_questions.json',
  './questions/s_questions.json',
  './questions/sh_questions.json',
  './questions/t_questions.json',
  './questions/u_questions.json',
  './questions/uu_questions.json',
  './questions/v_questions.json',
  './questions/y_questions.json',
  './questions/z_questions.json'
];

self.addEventListener('install', (olay) => {
  olay.waitUntil(
    caches.open(ONBELLEK_ADI).then((onbellek) => {
      return onbellek.addAll(ONBELLEKLENECEK);
    })
  );
  // skipWaiting YOK — kullanıcıya sormadan geçmesin
});

self.addEventListener('activate', (olay) => {
  olay.waitUntil(
    caches.keys().then((anahtarlar) => {
      return Promise.all(
        anahtarlar
          .filter((anahtar) => anahtar !== ONBELLEK_ADI)
          .map((anahtar) => caches.delete(anahtar))
      );
    }).then(() => {
      // Güncelleme olan sekmelere bildirim gönder
      return self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => client.postMessage({ tip: 'GUNCELLEME_VAR' }));
      });
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (olay) => {
  if (
    olay.request.url.includes('firebase') ||
    olay.request.url.includes('emailjs') ||
    olay.request.url.includes('googleapis') ||
    olay.request.url.includes('github')
  ) {
    return;
  }

  // Network-first: önce internetten dene, olmassa cache'den sun
  olay.respondWith(
    fetch(olay.request)
      .then((agYaniti) => {
        const kopyaYanit = agYaniti.clone();
        caches.open(ONBELLEK_ADI).then((onbellek) => {
          onbellek.put(olay.request, kopyaYanit);
        });
        return agYaniti;
      })
      .catch(() => {
        return caches.match(olay.request);
      })
  );
});

self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});