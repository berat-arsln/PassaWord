/* ========================================================================= */
/* DÜELLO SENKRONIZASYON — Oyun başlatma, cevap sync, sonuç                  */
/* ========================================================================= */

// Düello oyun başlatma (Firebase'den gelen oyunVerisi ile)
window.duelloOyunuBaslat = async function (oyunVerisi) {
  const { sorular, baslangicZamani } = oyunVerisi;

  // Soruları oyunDurumu'na yükle (game.js'deki yapıyla uyumlu)
  // NOT: Firebase'de güvenli key (a, b, c...) ile saklandığı için harf eşlemesiyle geri çeviriyoruz
  const HARFLER = window.HARFLER || [];
  const HARF_DOSYA_ESLEME = window.HARF_DOSYA_ESLEME || {};
  HARFLER.forEach((harf) => {
    const guvenliKey = HARF_DOSYA_ESLEME[harf] || harf;
    if (sorular[guvenliKey]) {
      window.oyunDurumu.secilenSorular[harf] = sorular[guvenliKey];
    } else {
      window.oyunDurumu.secilenSorular[harf] = null;
    }
  });

  // Düello modunu işaretle
  window.oyunDurumu.duelloModu = true;
  window.oyunDurumu.duelloSorular = sorular;

  // Oyun durumunu sıfırla
  window.oyunDurumu.harfDurumlari = {};
  window.oyunDurumu.harfCevaplari = {};
  window.oyunDurumu.mevcutHarfIndeks = 0;
  window.oyunDurumu.mevcutHarf = HARFLER[0];
  window.oyunDurumu.kalanSure = window.OYUN_SURESI || 360;
  window.oyunDurumu.pasKuyrugu = [];
  window.oyunDurumu.pasModu = false;
  window.oyunDurumu.pasIndeks = 0;
  window.oyunDurumu.calisiyor = false;
  window.oyunDurumu.puan = 0;
  window.oyunDurumu.dogruSayisi = 0;
  window.oyunDurumu.yanlisSayisi = 0;
  window.oyunDurumu.pasSayisi = 0;
  window.oyunDurumu.aktifBonus = null;
  window.oyunDurumu.bonusUygulandı = false;

  HARFLER.forEach((h) => {
    window.oyunDurumu.harfDurumlari[h] = "varsayilan";
  });

  // Başlangıç zamanına kadar bekle
  const simdi = Date.now();
  const beklemeSuresi = Math.max(0, baslangicZamani - simdi);

  // Oyun ekranına geç
  duelloEkraniGoster("oyunEkrani");

  const input = document.getElementById("cevapGiris");
  if (input) {
    input.setAttribute("readonly", "true");
    setTimeout(() => input.removeAttribute("readonly"), 100);
  }

  // Geri sayım göster (3 saniye)
  if (beklemeSuresi > 0) {
    duelloGeriSayimGoster(Math.ceil(beklemeSuresi / 1000));
  }

  setTimeout(() => {
    window.oyunDurumu.calisiyor = true;

    if (typeof klavyeDurumunuGuncelle === "function") klavyeDurumunuGuncelle();
    if (typeof daireOlustur === "function") daireOlustur();
    if (typeof harfiAktifYap === "function") harfiAktifYap(0, true);
    if (typeof zamanlayiciBaslat === "function") zamanlayiciBaslat();
    if (typeof canliIstatistikGuncelle === "function") canliIstatistikGuncelle();

    // Duyuruları yükle
    if (window.veritabani && window.ref && window.get && window.duyurulariGoster) {
      get(ref(veritabani, "ayarlar/duyurular"))
        .then((snap) => duyurulariGoster(snap))
        .catch(console.error);
    }
  }, beklemeSuresi);
};

// Geri sayım overlay (3-2-1)
function duelloGeriSayimGoster(saniye) {
  const eskiOverlay = document.getElementById("duelloGeriSayimOverlay");
  if (eskiOverlay) eskiOverlay.remove();

  const overlay = document.createElement("div");
  overlay.id = "duelloGeriSayimOverlay";
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.75);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 9997;
    gap: 12px;
  `;
  overlay.innerHTML = `
    <div style="font-size:16px;font-weight:700;color:rgba(255,255,255,0.7);letter-spacing:2px">HAZIR OL</div>
    <div id="duelloGeriSayimRakam" style="font-size:80px;font-weight:900;color:#7c3aed;line-height:1">${saniye}</div>
    <div style="font-size:14px;color:rgba(255,255,255,0.5)">⚔️ Düello başlıyor...</div>
  `;
  document.body.appendChild(overlay);

  let kalan = saniye;
  const interval = setInterval(() => {
    kalan--;
    const rakamEl = document.getElementById("duelloGeriSayimRakam");
    if (kalan <= 0) {
      clearInterval(interval);
      overlay.remove();
    } else if (rakamEl) {
      rakamEl.textContent = kalan;
    }
  }, 1000);
}

// Oyun bitince sonucu Firebase'e yaz
window.duelloOyunBitti = async function (oyunSonucu) {
  const { odaKodu, rolum } = window.duelloDurum;
  if (!odaKodu || !rolum) return;

  try {
    // Kendi sonucumu yaz
    await set(
      ref(veritabani, `duelRooms/${odaKodu}/oyuncuSonuclari/${rolum}`),
      oyunSonucu
    );

    // Rakibin sonucunu kontrol et
    const diger = rolum === "host" ? "misafir" : "host";
    const digerSnap = await get(
      ref(veritabani, `duelRooms/${odaKodu}/oyuncuSonuclari/${diger}`)
    );

    if (digerSnap.exists()) {
      // İki sonuç da var, sonuç ekranını oluştur
      await duelloSonucHesapla(odaKodu, oyunSonucu, digerSnap.val());
    } else {
      // Rakip henüz bitmedi, bekle
      duelloEkraniGoster("rakipBekleniyorEkrani");
      duelloRakipBeklemeBaslat(odaKodu, rolum, oyunSonucu);
    }
  } catch (hata) {
    console.error("Düello oyun bitti hatası:", hata);
  }
};

// Rakip bitince dinle
function duelloRakipBeklemeBaslat(odaKodu, rolum, benimSonucum) {
  const diger = rolum === "host" ? "misafir" : "host";
  const digerRef = ref(
    veritabani,
    `duelRooms/${odaKodu}/oyuncuSonuclari/${diger}`
  );

  const dinleyici = onValue(digerRef, async (snap) => {
    if (!snap.exists()) return;

    // Rakip bitti, dinleyiciyi kapat
    dinleyici();

    const digerSonuc = snap.val();
    await duelloSonucHesapla(odaKodu, benimSonucum, digerSonuc);
  });
}

// Sonucu hesapla ve Firebase'e yaz (sadece host yazar)
async function duelloSonucHesapla(odaKodu, benimSonucum, digerSonuc) {
  const { rolum } = window.duelloDurum;

  // Oda verisini al (host/misafir adlarını almak için)
  const odaSnap = await get(ref(veritabani, `duelRooms/${odaKodu}`));
  if (!odaSnap.exists()) return;
  const odaVerisi = odaSnap.val();

  const hostSonuc = rolum === "host" ? benimSonucum : digerSonuc;
  const misafirSonuc = rolum === "misafir" ? benimSonucum : digerSonuc;

  const sonucVerisi = {
    odaKodu,
    hostAd: odaVerisi.host?.ad || "Host",
    misafirAd: odaVerisi.misafir?.ad || "Misafir",
    hostSonuc,
    misafirSonuc,
    sorular: odaVerisi.oyunVerisi?.sorular || {},
    zaman: Date.now(),
  };

  // Sadece host sonucu Firebase'e yazar (çift yazımı önler)
  if (rolum === "host") {
    await set(ref(veritabani, `duelRooms/${odaKodu}/sonuc`), sonucVerisi);
    await set(ref(veritabani, `duelRooms/${odaKodu}/durum`), "bitti");
  }

  // İkisi de sonucu göster
  duelloSonucGoster(sonucVerisi);
}

// Sonuç ekranını göster
window.duelloSonucGoster = function (sonucVerisi) {
  duelloSonucEkraniniDoldur(sonucVerisi);
  duelloEkraniGoster("duelloSonucEkrani");
};

// Kendi sonuç objesini oluştur (game.js oyunuBitir'den çağrılır)
window.duelloSonucObjesiOlustur = function () {
  const HARFLER = window.HARFLER || [];
  const HARF_DOSYA_ESLEME = window.HARF_DOSYA_ESLEME || {};
  const cevaplar = {};

  HARFLER.forEach((harf) => {
    const veri = window.oyunDurumu.harfCevaplari?.[harf];
    const guvenliKey = HARF_DOSYA_ESLEME[harf] || harf;
    cevaplar[guvenliKey] = {
      verilen: veri?.verilen || "Pas",
      dogruMu: veri?.dogruMu || false,
    };
  });

  return {
    puan: window.oyunDurumu.puan || 0,
    dogru: window.oyunDurumu.dogruSayisi || 0,
    yanlis: window.oyunDurumu.yanlisSayisi || 0,
    pas: window.oyunDurumu.pasSayisi || 0,
    cevaplar,
    zaman: Date.now(),
  };
};

window.duelloGeriSayimGoster = duelloGeriSayimGoster;
window.duelloRakipBeklemeBaslat = duelloRakipBeklemeBaslat;