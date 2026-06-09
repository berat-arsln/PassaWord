      window.gecmisSekmeGec = function(sekme) {
        document.getElementById('sekmeGecmis').classList.toggle('aktif', sekme === 'gecmis');
        document.getElementById('sekmeFavori').classList.toggle('aktif', sekme === 'favori');
        document.getElementById('gecmisListe').classList.toggle('gizli', sekme !== 'gecmis');
        document.getElementById('favoriListe').classList.toggle('gizli', sekme !== 'favori');
      };

      function gecmisModalGuncelle() {
        const profil = aktifProfiliGetir();
        gecmisListesiniOlustur(profil);
        favoriListesiniOlustur(profil);
      }

      function gecmisListesiniOlustur(profil) {
        const liste = document.getElementById('gecmisListe');
        liste.innerHTML = '';
        const gecmis = profil?.gecmis || [];

        if (gecmis.length === 0) {
          liste.innerHTML = `<div style="text-align:center;color:var(--metin-soluk);padding:24px;font-size:14px;">Henüz oyun oynamadın.</div>`;
          return;
        }

        gecmis.forEach((oyun, i) => {
          const tarih = new Date(oyun.tarih).toLocaleDateString('tr-TR');
          const saat = new Date(oyun.tarih).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'});
          const favoriMi = (profil.favoriler || []).some(f => f.tarih === oyun.tarih);

          const satir = document.createElement('div');
          satir.className = 'skor-satir';
          satir.style.cursor = 'pointer';
          satir.innerHTML = `
            <div class="skor-satir-ust">
              <div class="skor-sira" style="color:var(--metin-soluk);font-size:14px;">${i + 1}</div>
              <div class="skor-isim">
                ${tarih} ${saat}
                <div style="font-size:11px;color:var(--metin-soluk);margin-top:2px;">
                  <span style="color:var(--dogru-renk);">✓ ${oyun.dogruSayisi}</span> &nbsp;
                  <span style="color:var(--yanlis-renk);">✗ ${oyun.yanlisSayisi}</span> &nbsp;
                  <span style="color:var(--pas-renk);">~ ${oyun.pasSayisi}</span>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:10px;">
                <div class="skor-puan">${oyun.puan}</div>
                <button onclick="event.stopPropagation();favoriToggle(${i})" style="background:none;border:none;cursor:pointer;padding:4px;">
                  ${favoriMi ? favoriIkonDolu() : favoriIkonBos()}
                </button>
              </div>
            </div>
          `;
          satir.addEventListener('click', () => gecmisDetayGoster(oyun, i));
          liste.appendChild(satir);
        });
      }

      function favoriListesiniOlustur(profil) {
        const liste = document.getElementById('favoriListe');
        liste.innerHTML = '';
        const favoriler = profil?.favoriler || [];

        if (favoriler.length === 0) {
          liste.innerHTML = `<div style="text-align:center;color:var(--metin-soluk);padding:24px;font-size:14px;">Henüz favori eklemedin.</div>`;
          return;
        }

        const sayfaBasi = window._favoriSayfa || 0;
        const sayfadakiler = favoriler.slice(sayfaBasi * 20, sayfaBasi * 20 + 20);

        sayfadakiler.forEach((oyun, i) => {
          const gercekIndeks = sayfaBasi * 20 + i;
          const tarih = new Date(oyun.tarih).toLocaleDateString('tr-TR');
          const saat = new Date(oyun.tarih).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'});

          const satir = document.createElement('div');
          satir.className = 'skor-satir';
          satir.style.cursor = 'pointer';
          satir.innerHTML = `
            <div class="skor-satir-ust">
              <div class="skor-sira" style="color:var(--metin-soluk);font-size:14px;">${gercekIndeks + 1}</div>
              <div class="skor-isim">
                ${tarih} ${saat}
                <div style="font-size:11px;color:var(--metin-soluk);margin-top:2px;">
                  <span style="color:var(--dogru-renk);">✓ ${oyun.dogruSayisi}</span> &nbsp;
                  <span style="color:var(--yanlis-renk);">✗ ${oyun.yanlisSayisi}</span> &nbsp;
                  <span style="color:var(--pas-renk);">~ ${oyun.pasSayisi}</span>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:10px;">
                <div class="skor-puan">${oyun.puan}</div>
                <button onclick="event.stopPropagation();favoriKaldir(${gercekIndeks})" style="background:none;border:none;cursor:pointer;padding:4px;">
                  ${favoriIkonDolu()}
                </button>
              </div>
            </div>
          `;
          satir.addEventListener('click', () => gecmisDetayGoster(oyun, gercekIndeks));
          liste.appendChild(satir);
        });

        /* Sayfalama */
        if (favoriler.length > 20) {
          const toplamSayfa = Math.ceil(favoriler.length / 20);
          const sayfaDiv = document.createElement('div');
          sayfaDiv.style.cssText = 'display:flex;justify-content:center;gap:8px;padding:12px;';
          for (let s = 0; s < toplamSayfa; s++) {
            const btn = document.createElement('button');
            btn.textContent = s + 1;
            btn.style.cssText = `padding:6px 12px;border-radius:8px;border:none;cursor:pointer;font-weight:700;
              background:${s === sayfaBasi ? '#1976d2' : 'rgba(255,255,255,0.08)'};
              color:${s === sayfaBasi ? '#fff' : 'var(--metin-soluk)'};`;
            btn.onclick = () => { window._favoriSayfa = s; favoriListesiniOlustur(aktifProfiliGetir()); };
            sayfaDiv.appendChild(btn);
          }
          liste.appendChild(sayfaDiv);
        }
      }

      function favoriIkonBos() {
        return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>`;
      }

      function favoriIkonDolu() {
        return `<svg width="22" height="22" viewBox="0 0 24 24" fill="#e53935" stroke="#e53935" stroke-width="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>`;
      }

      window.favoriToggle = function(gecmisIndeks) {
        const profil = aktifProfiliGetir();
        const profiller = profilleriGetir();
        const indeks = profiller.findIndex(p => p.id === profil.id);
        if (indeks === -1) return;

        const oyun = profiller[indeks].gecmis[gecmisIndeks];
        profiller[indeks].favoriler = profiller[indeks].favoriler || [];
        const favIndeks = profiller[indeks].favoriler.findIndex(f => f.tarih === oyun.tarih);

        if (favIndeks === -1) {
          profiller[indeks].favoriler.push(oyun);
          toastGoster('Favoriye eklendi 🔖');
        } else {
          profiller[indeks].favoriler.splice(favIndeks, 1);
          toastGoster('Favoriden çıkarıldı');
        }

        profilleriKaydet(profiller);
        gecmisModalGuncelle();

        /* Firebase güncelle */
        const gp = profiller[indeks];
        if (gp.yedekKod) {
          set(ref(veritabani, `yedekler/${gp.yedekKod}`), {
            id: gp.id, ad: gp.ad, skorlar: gp.skorlar || [],
            gecmis: gp.gecmis || [], favoriler: gp.favoriler || [],
            olusturulma: gp.olusturulma, tarih: new Date().toISOString()
          }).catch(console.error);
        }
      };

      window.favoriKaldir = function(favIndeks) {
        const profil = aktifProfiliGetir();
        const profiller = profilleriGetir();
        const indeks = profiller.findIndex(p => p.id === profil.id);
        if (indeks === -1) return;

        profiller[indeks].favoriler.splice(favIndeks, 1);
        profilleriKaydet(profiller);
        toastGoster('Favoriden çıkarıldı');
        gecmisModalGuncelle();

        const gp = profiller[indeks];
        if (gp.yedekKod) {
          set(ref(veritabani, `yedekler/${gp.yedekKod}`), {
            id: gp.id, ad: gp.ad, skorlar: gp.skorlar || [],
            gecmis: gp.gecmis || [], favoriler: gp.favoriler || [],
            olusturulma: gp.olusturulma, tarih: new Date().toISOString()
          }).catch(console.error);
        }
      };

      window.gecmisDetayGoster = function(oyun, indeks) {
        /* Mevcut modalı kapat, detay modalını aç */
        const detayModal = document.getElementById('gecmisDetayModal');
        const liste = document.getElementById('gecmisDetayListe');
        const baslik = document.getElementById('gecmisDetayBaslik');

        const tarih = new Date(oyun.tarih).toLocaleDateString('tr-TR');
        const saat = new Date(oyun.tarih).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'});
        baslik.textContent = `${tarih} ${saat} — ${oyun.puan} puan`;

        liste.innerHTML = '';
        (oyun.detay || []).forEach((d, idx) => {
          const sinif = d.durum === 'dogru' ? 's-dogru' : d.durum === 'yanlis' ? 's-yanlis' : 's-pas';
          const kalem = document.createElement('div');
          kalem.className = `sonuc-kalem ${sinif}`;
          kalem.innerHTML = `
            <div class="sonuc-harf">${d.harf}</div>
            <div class="sonuc-bilgi">
              <div class="sonuc-soru">${d.soru}</div>
              <div class="sonuc-verilen-cevap">${d.verilenCevap === 'Pas' ? 'Pas geçildi' : d.verilenCevap}</div>
              <div class="sonuc-dogru-cevap">✓ Doğru: ${d.dogruCevap}</div>
              <button class="hata-bildir-buton gecmis-hata-btn">⚠ Hata Bildir</button>
            </div>
          `;
          const btn = kalem.querySelector('.gecmis-hata-btn');
          btn.addEventListener('click', () => gecmisHataBildir(d, btn));
          liste.appendChild(kalem);
        });

        document.getElementById('gecmisDetayModal').classList.add('acik');
      };
      
      
      window.sonucFavoriToggle = function() {
        const profil = aktifProfiliGetir();
        const profiller = profilleriGetir();
        const indeks = profiller.findIndex(p => p.id === profil.id);
        if (indeks === -1) return;

        const gecmis = profiller[indeks].gecmis || [];
        if (gecmis.length === 0) return;

        const sonOyun = gecmis[0]; /* En son oynanan */
        profiller[indeks].favoriler = profiller[indeks].favoriler || [];
        const favIndeks = profiller[indeks].favoriler.findIndex(f => f.tarih === sonOyun.tarih);

        if (favIndeks === -1) {
          profiller[indeks].favoriler.push(sonOyun);
          sonucFavoriButonGuncelle(true);
          toastGoster('Favoriye eklendi 🔖');
        } else {
          profiller[indeks].favoriler.splice(favIndeks, 1);
          sonucFavoriButonGuncelle(false);
          toastGoster('Favoriden çıkarıldı');
        }

        profilleriKaydet(profiller);

        const gp = profiller[indeks];
        if (gp.yedekKod) {
          set(ref(veritabani, `yedekler/${gp.yedekKod}`), {
            id: gp.id, ad: gp.ad, skorlar: gp.skorlar || [],
            gecmis: gp.gecmis || [], favoriler: gp.favoriler || [],
            olusturulma: gp.olusturulma, tarih: new Date().toISOString()
          }).catch(console.error);
        }
      };

      function sonucFavoriButonGuncelle(favoriMi) {
        const ikon = favoriMi ? favoriIkonDolu() : favoriIkonBos();
        const yazi = favoriMi ? 'Favoriden Çıkar' : 'Favoriye Ekle';

        const ikon1 = document.getElementById('favoriButonIkon');
        const yazi1 = document.getElementById('favoriButonYazi');
        const ikon2 = document.getElementById('favoriButonIkon2');
        const yazi2 = document.getElementById('favoriButonYazi2');

        if (ikon1) ikon1.innerHTML = ikon;
        if (yazi1) yazi1.textContent = yazi;
        if (ikon2) ikon2.innerHTML = ikon;
        if (yazi2) yazi2.textContent = yazi;
                                             }
