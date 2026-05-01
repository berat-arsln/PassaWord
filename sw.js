/* ========================================
   SERVİS WORKER
   Çevrimdışı destek için önbellekleme
   ======================================== */

/* Önbellek adı ve versiyonu */
const ONBELLEK_ADI = 'passaword-v6';

/* Önbelleğe alınacak dosyalar */
const ONBELLEKLENECEK = [
  './',
  './index.html',
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
  './questions/ii_questions.json',
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

/* Servis worker kurulumu - dosyaları önbelleğe al */
self.addEventListener('install', (olay) => {
  olay.waitUntil(
    caches.open(ONBELLEK_ADI).then((onbellek) => {
      return onbellek.addAll(ONBELLEKLENECEK);
    })
  );
  self.skipWaiting();
});

/* Aktivasyon - eski önbellekleri temizle */
self.addEventListener('activate', (olay) => {
  olay.waitUntil(
    caches.keys().then((anahtarlar) => {
      return Promise.all(
        anahtarlar
          .filter((anahtar) => anahtar !== ONBELLEK_ADI)
          .map((anahtar) => caches.delete(anahtar))
      );
    })
  );
  self.clients.claim();
});

/* İstekleri yakala - önce önbellekten sun, yoksa ağdan al */
self.addEventListener('fetch', (olay) => {
  /* Firebase ve EmailJS isteklerini önbelleğe alma */
  if (
    olay.request.url.includes('firebase') ||
    olay.request.url.includes('emailjs') ||
    olay.request.url.includes('googleapis')
  ) {
    return;
  }

  olay.respondWith(
    caches.match(olay.request).then((onbellekYaniti) => {
      /* Önbellekte varsa oradan sun */
      if (onbellekYaniti) return onbellekYaniti;
      /* Yoksa ağdan al ve önbelleğe ekle */
      return fetch(olay.request).then((agYaniti) => {
        const kopyaYanit = agYaniti.clone();
        caches.open(ONBELLEK_ADI).then((onbellek) => {
          onbellek.put(olay.request, kopyaYanit);
        });
        return agYaniti;
      });
    })
  );
});

