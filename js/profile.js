      // Cihaza özgü benzersiz ID (her cihaz için tek, değişmez)
      function cihazIdGetir() {
        let cihazId = localStorage.getItem('pw_cihaz_id');
        if (!cihazId) {
          cihazId = 'cihaz_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
          localStorage.setItem('pw_cihaz_id', cihazId);
        }
        return cihazId;
      }

      // localStorage cache'den profil listesi oku
      function profilleriGetir() {
        return JSON.parse(localStorage.getItem('pw_profiller') || '[]');
      }

      // localStorage cache'den aktif profili oku
      function aktifProfiliGetir() {
        const aktifId = localStorage.getItem('pw_aktif_profil');
        const profiller = profilleriGetir();
        return profiller.find(p => p.id === aktifId) || profiller[0] || null;
      }

      // localStorage cache'e profil listesini kaydet
      function profilleriKaydet(profiller) {
        localStorage.setItem('pw_profiller', JSON.stringify(profiller));
      }

      // Firebase'e profil yaz (ana kayıt + yedekler yolu)
      async function firebaseProfilGuncelle(profil) {
        if (!profil || !profil.yedekKod) return;
        try {
          await set(ref(veritabani, `yedekler/${profil.yedekKod}`), {
            id: profil.id,
            ad: profil.ad,
            skorlar: profil.skorlar || [],
            gecmis: profil.gecmis || [],
            favoriler: profil.favoriler || [],
            olusturulma: profil.olusturulma,
            tarih: new Date().toISOString()
          });
        } catch(e) {
          console.warn('Firebase profil güncellenemedi (offline?):', e);
        }
      }

      // Mevcut localStorage profilleri Firebase'e migrate et (bir kez çalışır)
      async function migrasyonYap() {
        if (localStorage.getItem('pw_firebase_migrate_v1') === 'done') return;
        const profiller = profilleriGetir();
        if (profiller.length === 0) {
          localStorage.setItem('pw_firebase_migrate_v1', 'done');
          return;
        }
        // Her profil için yedek kodu yoksa oluştur ve Firebase'e yaz
        for (const profil of profiller) {
          try {
            await yedekKoduOlustur(profil);
          } catch(e) {
            console.warn('Migrasyon hatası:', profil.ad, e);
          }
        }
        localStorage.setItem('pw_firebase_migrate_v1', 'done');
        console.log('✅ Profil migrasyonu tamamlandı');
      }
      
      async function profilleriFirebaseIleEslestir() {
        const profiller = profilleriGetir();
        if (profiller.length === 0) return;
        const kalanlar = [];
        for (const profil of profiller) {
          if (!profil.yedekKod) { kalanlar.push(profil); continue; }
          try {
            const snap = await get(ref(veritabani, `yedekler/${profil.yedekKod}`));
            if (snap.exists()) {
              kalanlar.push(profil);
            } else {
              toastGoster(`⚠️ "${profil.ad}" profili sunucuda bulunamadı, silindi.`);
            }
          } catch(e) {
            kalanlar.push(profil);
          }
        }
        if (kalanlar.length !== profiller.length) {
          profilleriKaydet(kalanlar);
          const aktifId = localStorage.getItem('pw_aktif_profil');
          const aktifHalaVar = kalanlar.some(p => p.id === aktifId);
          if (!aktifHalaVar) {
            if (kalanlar.length > 0) {
              localStorage.setItem('pw_aktif_profil', kalanlar[0].id);
            } else {
              localStorage.removeItem('pw_aktif_profil');
              ekraniGoster('baslangicEkrani');
              document.getElementById('hazirEkrani').style.display = 'none';
              document.getElementById('profilOlusturKutu').style.display = 'block';
            }
          }
          aktifProfilUiGuncelle();
          profilListesiniGuncelle();
        }
      }

      // Aktif profilin Firebase'de hâlâ var olup olmadığını dinle
      // Admin sildiyse → profil seçim ekranına yönlendir
      
      let _profilSilmeListenerleri = {};
      
      
      
      function tumProfillereSilmeDinleyicisiBaslat() {
        Object.values(_profilSilmeListenerleri).forEach(unsub => unsub());
        _profilSilmeListenerleri = {};
        const profiller = profilleriGetir();
        profiller.forEach(profil => {
          if (!profil.yedekKod) return;
          // Önce bir kez kontrol et, varsa listener başlat
          get(ref(veritabani, `yedekler/${profil.yedekKod}`)).then(snap => {
            if (!snap.exists()) return; // Zaten yok, listener başlatma
            const profilRef = ref(veritabani, `yedekler/${profil.yedekKod}`);
            _profilSilmeListenerleri[profil.id] = onValue(profilRef, (s) => {
              if (!s.exists()) {
                const kalanlar = profilleriGetir().filter(p => p.id !== profil.id);
                profilleriKaydet(kalanlar);
                if (localStorage.getItem('pw_aktif_profil') === profil.id) {
                  if (kalanlar.length > 0) {
                    localStorage.setItem('pw_aktif_profil', kalanlar[0].id);
                    toastGoster('⚠️ Aktif profil silindi.');
                    setTimeout(() => { modalAc('profilSecModal'); profilListesiniGuncelle(); }, 500);
                  } else {
                    localStorage.removeItem('pw_aktif_profil');
                    toastGoster('⚠️ Profilin silindi.');
                    document.querySelectorAll('.modal-arkaplan.acik').forEach(m => m.classList.remove('acik'));
                    ekraniGoster('baslangicEkrani');
                    document.getElementById('hazirEkrani').style.display = 'none';
                    document.getElementById('profilOlusturKutu').style.display = 'block';
                  }
                } else {
                  toastGoster(`⚠️ "${profil.ad}" profili silindi.`);
                  profilListesiniGuncelle();
                }
                aktifProfilUiGuncelle();
                if (_profilSilmeListenerleri[profil.id]) {
                  _profilSilmeListenerleri[profil.id]();
                  delete _profilSilmeListenerleri[profil.id];
                }
              }
            });
          }).catch(() => {});
        });
      }

      function aktifProfilSilmeDinleyicisiBaslat(profilId, yedekKod) {
        tumProfillereSilmeDinleyicisiBaslat();
      }

      // Geçmişe kaydet (localStorage + Firebase sync)
      function gecmiseKaydet(oyunVerisi) {
        const profil = aktifProfiliGetir();
        if (!profil) return;

        const profiller = profilleriGetir();
        const indeks = profiller.findIndex(p => p.id === profil.id);
        if (indeks === -1) return;

        profiller[indeks].gecmis = profiller[indeks].gecmis || [];
        profiller[indeks].gecmis.unshift(oyunVerisi);
        profiller[indeks].gecmis = profiller[indeks].gecmis.slice(0, 20);
        profilleriKaydet(profiller);

        // Firebase'e sync et
        firebaseProfilGuncelle(profiller[indeks]);
      }

      // Yedek kodu oluştur veya mevcut olanı Firebase'e yaz
      async function yedekKoduOlustur(profil) {
        if (profil.yedekKod) {
          // Mevcut kodu Firebase'e yaz (güncelle)
          await set(ref(veritabani, `yedekler/${profil.yedekKod}`), {
            id: profil.id,
            ad: profil.ad,
            skorlar: profil.skorlar || [],
            gecmis: profil.gecmis || [],
            favoriler: profil.favoriler || [],
            olusturulma: profil.olusturulma,
            tarih: new Date().toISOString()
          });
          return profil.yedekKod;
        }

        // İlk kez oluştur
        const karakterler = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let kod = 'PW-';
        for (let i = 0; i < 5; i++) {
          kod += karakterler[Math.floor(Math.random() * karakterler.length)];
        }

        await set(ref(veritabani, `yedekler/${kod}`), {
          id: profil.id,
          ad: profil.ad,
          skorlar: profil.skorlar || [],
          gecmis: profil.gecmis || [],
          favoriler: profil.favoriler || [],
          olusturulma: profil.olusturulma,
          tarih: new Date().toISOString()
        });

        // Kodu profile kaydet
        const profiller = profilleriGetir();
        const indeks = profiller.findIndex(p => p.id === profil.id);
        if (indeks !== -1) {
          profiller[indeks].yedekKod = kod;
          profilleriKaydet(profiller);
        }

        return kod;
                }
