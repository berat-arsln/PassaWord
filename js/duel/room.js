/* ========================================================================= */
/* DÜELLO ODA YÖNETİMİ — Oluştur, gir, hazır, başlat, çık                   */
/* ========================================================================= */

// Aktif düello durumu (global)
window.duelloDurum = {
  odaKodu: null,
  odaRef: null,
  rolum: null,       // "host" veya "misafir"
  profilAd: null,
  dinleyici: null,   // Firebase onValue dinleyicisi
};

/* --------- Yardımcı --------- */
function odaKoduGecerliMi(kod) {
  if (!kod || kod.length < 4 || kod.length > 20) return false;
  return /^[a-zA-Z0-9ğüşıöçĞÜŞİÖÇ]+$/.test(kod);
}

function hataMesajiGoster(elId, mesaj) {
  const el = document.getElementById(elId);
  if (el) el.textContent = mesaj;
}

function hataMesajiTemizle(elId) {
  const el = document.getElementById(elId);
  if (el) el.textContent = "";
}

function butonuKilitle(elId, kilitle) {
  const el = document.getElementById(elId);
  if (el) el.disabled = kilitle;
}

/* --------- Oda Oluştur --------- */
window.odaOlustur = async function () {
  const girdi = document.getElementById("odaKoduGiris");
  const kod = girdi ? girdi.value.trim() : "";

  hataMesajiTemizle("odaOlusturHata");

  if (!odaKoduGecerliMi(kod)) {
    hataMesajiGoster(
      "odaOlusturHata",
      "Kod 4-20 karakter olmalı, sadece harf ve rakam içermeli."
    );
    return;
  }

  butonuKilitle("odaOlusturButon", true);

  const profil = aktifProfiliGetir();
  if (!profil) {
    hataMesajiGoster("odaOlusturHata", "Profil bulunamadı.");
    butonuKilitle("odaOlusturButon", false);
    return;
  }

  try {
    const odaRef = ref(veritabani, `duelRooms/${kod}`);
    const mevcutSnap = await get(odaRef);

    if (mevcutSnap.exists()) {
      hataMesajiGoster("odaOlusturHata", "Bu oda kodu kullanımda.");
      butonuKilitle("odaOlusturButon", false);
      return;
    }

    const odaVerisi = {
      odaKodu: kod,
      durum: "bekleme",       // bekleme | oyun | bitti
      olusturulma: Date.now(),
      host: {
        ad: profil.ad,
        hazir: false,
      },
      misafir: null,
    };

    await set(odaRef, odaVerisi);

    // Düello durumunu kaydet
    window.duelloDurum.odaKodu = kod;
    window.duelloDurum.odaRef = odaRef;
    window.duelloDurum.rolum = "host";
    window.duelloDurum.profilAd = profil.ad;

    // Presence başlat
    duelloPresenceBaslat(kod, "host");

    // Oda dinleyicisini başlat
    odaDinleyicisiniBaslat(kod);

    // Bekleme odasına geç
    duelloEkraniGoster("beklemOdasiEkrani");
    document.getElementById("beklemOdaKodu").textContent = kod;

  } catch (hata) {
    console.error("Oda oluşturma hatası:", hata);
    hataMesajiGoster("odaOlusturHata", "Bir hata oluştu, tekrar dene.");
    butonuKilitle("odaOlusturButon", false);
  }
};

/* --------- Odaya Gir --------- */
window.odayaGir = async function () {
  const girdi = document.getElementById("odaKoduGirGiris");
  const kod = girdi ? girdi.value.trim() : "";

  hataMesajiTemizle("odaGirHata");

  if (!kod) {
    hataMesajiGoster("odaGirHata", "Oda kodu boş olamaz.");
    return;
  }

  butonuKilitle("odaGirButon", true);

  const profil = aktifProfiliGetir();
  if (!profil) {
    hataMesajiGoster("odaGirHata", "Profil bulunamadı.");
    butonuKilitle("odaGirButon", false);
    return;
  }

  try {
    const odaRef = ref(veritabani, `duelRooms/${kod}`);
    const snap = await get(odaRef);

    if (!snap.exists()) {
      hataMesajiGoster("odaGirHata", "Oda bulunamadı.");
      butonuKilitle("odaGirButon", false);
      return;
    }

    const odaVerisi = snap.val();

    // Oda dolu mu?
    if (odaVerisi.misafir) {
      hataMesajiGoster("odaGirHata", "Bu oda dolu.");
      butonuKilitle("odaGirButon", false);
      return;
    }

    // Oyun başlamış mı?
    if (odaVerisi.durum === "oyun") {
      hataMesajiGoster("odaGirHata", "Oyun zaten başlamış.");
      butonuKilitle("odaGirButon", false);
      return;
    }

    // Misafir olarak eklen
    await set(ref(veritabani, `duelRooms/${kod}/misafir`), {
      ad: profil.ad,
      hazir: false,
    });

    // Düello durumunu kaydet
    window.duelloDurum.odaKodu = kod;
    window.duelloDurum.odaRef = odaRef;
    window.duelloDurum.rolum = "misafir";
    window.duelloDurum.profilAd = profil.ad;

    // Presence başlat
    duelloPresenceBaslat(kod, "misafir");

    // Oda dinleyicisini başlat
    odaDinleyicisiniBaslat(kod);

    // Bekleme odasına geç
    duelloEkraniGoster("beklemOdasiEkrani");
    document.getElementById("beklemOdaKodu").textContent = kod;

  } catch (hata) {
    console.error("Odaya giriş hatası:", hata);
    hataMesajiGoster("odaGirHata", "Bir hata oluştu, tekrar dene.");
    butonuKilitle("odaGirButon", false);
  }
};

/* --------- Oda Dinleyicisi --------- */
function odaDinleyicisiniBaslat(kod) {
  // Önceki dinleyiciyi temizle
  if (window.duelloDurum.dinleyici) {
    window.duelloDurum.dinleyici();
    window.duelloDurum.dinleyici = null;
  }

  const odaRef = ref(veritabani, `duelRooms/${kod}`);

  const dinleyici = onValue(odaRef, (snap) => {
    if (!snap.exists()) {
      // Oda silindi
      const mevcutEkran = document.querySelector(".ekran:not(.gizli)");
      const duelloEkranlari = [
        "beklemOdasiEkrani",
        "baglantiKoptuEkrani",
        "rakipBekleniyorEkrani",
        "duelloSonucEkrani",
      ];
      const duelloEkranindaMi = mevcutEkran &&
        duelloEkranlari.includes(mevcutEkran.id);

      if (duelloEkranindaMi && window.duelloDurum.rolum === "misafir") {
        duelloSistemBildirimiGoster(
          "Oda Kapatıldı",
          "Host odadan çıktı.",
          "Ana Sayfa",
          () => duellodenCik()
        );
      }

      duelloDurumunuSifirla();
      return;
    }

    const odaVerisi = snap.val();

    // Bekleme odasındaysa UI güncelle
    const beklemEkrani = document.getElementById("beklemOdasiEkrani");
    if (beklemEkrani && !beklemEkrani.classList.contains("gizli")) {
      beklemOdasiUiGuncelle(odaVerisi);
    }

    // Oyun başlatma sinyali
    if (odaVerisi.durum === "oyun" && odaVerisi.oyunVerisi) {
      const beklemEkraniGizliMi =
        document.getElementById("beklemOdasiEkrani")?.classList.contains("gizli");

      // Sadece bekleme odasındaysa oyunu başlat
      if (!beklemEkraniGizliMi) {
        duelloOyunuBaslat(odaVerisi.oyunVerisi);
      }
    }

    // Sonuç sinyali
    if (odaVerisi.durum === "bitti" && odaVerisi.sonuc) {
      const rakipEkrani = document.getElementById("rakipBekleniyorEkrani");
      if (rakipEkrani && !rakipEkrani.classList.contains("gizli")) {
        duelloSonucGoster(odaVerisi.sonuc);
      }
    }

    // "Yeni oyun" kabul edilip durum beklemeye dönünce, sonuç ekranında
    // bekleyen taraf (isteği gönderen) otomatik bekleme odasına geçsin
    if (odaVerisi.durum === "bekleme") {
      const duelloSonucEkrani = document.getElementById("duelloSonucEkrani");
      const sonucEkraniAcikMi =
        duelloSonucEkrani && !duelloSonucEkrani.classList.contains("gizli");

      if (sonucEkraniAcikMi) {
        // Sistem bildirimini kapat (varsa "İstek Gönderildi" bildirimi)
        const bildirim = document.getElementById("duelloSistemBildirim");
        if (bildirim) bildirim.remove();

        if (typeof duelloSonuctenCik === "function") duelloSonuctenCik();
        duelloEkraniGoster("beklemOdasiEkrani");
        document.getElementById("beklemOdaKodu").textContent = kod;
      }
    }

    // Yeni oyun isteği
    if (odaVerisi.yeniOyunIstegi) {
      const istekYapan = odaVerisi.yeniOyunIstegi.yapan;
      const benimRolum = window.duelloDurum.rolum;

      // Benim isteğim değilse toast göster
      if (istekYapan !== benimRolum) {
        const istegiYapanAd = istekYapan === "host"
          ? odaVerisi.host?.ad
          : odaVerisi.misafir?.ad;

        duelloYeniOyunIstegiGoster(
          istegiYapanAd || "Rakip",
          () => yeniOyunIstegiKabul(kod),
          () => yeniOyunIstegiReddet(kod)
        );
      }
    }
  });

  window.duelloDurum.dinleyici = dinleyici;
}

/* --------- Hazır Durumu --------- */
window.hazirDurumunuDegistir = async function () {
  const { odaKodu, rolum } = window.duelloDurum;
  if (!odaKodu || !rolum) return;

  try {
    const yolHazir = `duelRooms/${odaKodu}/${rolum}/hazir`;
    const snap = await get(ref(veritabani, yolHazir));
    const mevcutHazir = snap.exists() ? snap.val() : false;
    await set(ref(veritabani, yolHazir), !mevcutHazir);
  } catch (hata) {
    console.error("Hazır durumu hatası:", hata);
  }
};

/* --------- Oyunu Başlat (sadece host) --------- */
window.duelloBaslat = async function () {
  const { odaKodu, rolum } = window.duelloDurum;
  if (!odaKodu || rolum !== "host") return;

  butonuKilitle("oyunuBaslatButon", true);

  try {
    // Soruları yükle (ekranı DEĞİŞTİRMEDEN, game.js'deki sorulariYukle yerine)
    const sorularSetiVar =
      window.oyunDurumu?.yuklenenSorular &&
      Object.keys(window.oyunDurumu.yuklenenSorular).length > 0;

    if (!sorularSetiVar) {
      await duelloSorulariSessizceYukle();
    }

    sorulariSec();

    // Seçilen soruları Firebase'e kaydet
    // NOT: HARFLER içindeki "I/İ" gibi harfler Firebase key'i olamaz ("/" yasak)
    // bu yüzden güvenli anahtar (a, b, c... harf dosya eşlemesi) kullanıyoruz
    const sorularObj = {};
    const HARFLER = window.HARFLER || [];
    const HARF_DOSYA_ESLEME = window.HARF_DOSYA_ESLEME || {};
    HARFLER.forEach((harf) => {
      const soru = window.oyunDurumu?.secilenSorular?.[harf];
      const guvenliKey = HARF_DOSYA_ESLEME[harf] || harf;
      if (soru) {
        sorularObj[guvenliKey] = {
          harf: harf,
          soru: soru.soru,
          cevap: soru.cevap,
          alternatifler: soru.alternatifler || [],
          id: soru.id,
        };
      }
    });

    const baslangicZamani = Date.now() + 3000; // 3 saniye sonra başlar

    await set(ref(veritabani, `duelRooms/${odaKodu}/durum`), "oyun");
    await set(ref(veritabani, `duelRooms/${odaKodu}/oyunVerisi`), {
      sorular: sorularObj,
      baslangicZamani,
    });

  } catch (hata) {
    console.error("Oyun başlatma hatası:", hata);
    hataMesajiGoster("beklemHata", "Oyun başlatılamadı, tekrar dene.");
    butonuKilitle("oyunuBaslatButon", false);
  }
};

/* --------- Soruları Sessizce Yükle (ekran değiştirmeden) --------- */
async function duelloSorulariSessizceYukle() {
  const HARFLER = window.HARFLER || [];
  const HARF_DOSYA_ESLEME = window.HARF_DOSYA_ESLEME || {};

  const yuklemeSozleri = HARFLER.map(async (harf) => {
    const dosyaAdi = HARF_DOSYA_ESLEME[harf];
    try {
      const yanit = await fetch(`./questions/${dosyaAdi}_questions.json`);
      if (!yanit.ok) throw new Error(`${harf} yüklenemedi`);
      const sorular = await yanit.json();

      const numaraliSorular = sorular.map((s, idx) => {
        s.id = s.id || idx + 1;
        return s;
      });

      return { harf, sorular: numaraliSorular };
    } catch (hata) {
      console.warn(`${harf} hatası:`, hata);
      return { harf, sorular: [] };
    }
  });

  const sonuclar = await Promise.all(yuklemeSozleri);
  sonuclar.forEach(({ harf, sorular }) => {
    window.oyunDurumu.yuklenenSorular[harf] = sorular;
  });
}

/* --------- Odadan Çık --------- */
window.odadanCik = async function () {
  const { odaKodu, rolum, dinleyici } = window.duelloDurum;

  // Dinleyiciyi kapat
  if (dinleyici) {
    dinleyici();
    window.duelloDurum.dinleyici = null;
  }

  // Presence temizle
  duelloPresenceBitir(odaKodu, rolum);

  if (odaKodu) {
    try {
      if (rolum === "host") {
        // Host çıkarsa odayı tamamen sil
        await remove(ref(veritabani, `duelRooms/${odaKodu}`));
      } else if (rolum === "misafir") {
        // Misafir çıkarsa sadece misafir alanını sil
        await remove(ref(veritabani, `duelRooms/${odaKodu}/misafir`));
      }
    } catch (hata) {
      console.error("Odadan çıkış hatası:", hata);
    }
  }

  duelloDurumunuSifirla();
  duellodenCik();
};

/* --------- Presence --------- */
function duelloPresenceBaslat(odaKodu, rol) {
  const presenceRef = ref(
    veritabani,
    `duelPresence/${odaKodu}/${rol}`
  );

  set(presenceRef, {
    cevrimici: true,
    sonGorulme: Date.now(),
  }).catch(console.error);

  window.duelloDurum.presenceRef = presenceRef;
}

function duelloPresenceBitir(odaKodu, rol) {
  if (!odaKodu || !rol) return;
  const presenceRef = ref(veritabani, `duelPresence/${odaKodu}/${rol}`);
  remove(presenceRef).catch(console.error);
}



/* --------- Durum Sıfırla --------- */
function duelloDurumunuSifirla() {
  window.duelloDurum = {
    odaKodu: null,
    odaRef: null,
    rolum: null,
    profilAd: null,
    dinleyici: null,
    presenceRef: null,
  };
}

window.duelloDurumunuSifirla = duelloDurumunuSifirla;
window.odaDinleyicisiniBaslat = odaDinleyicisiniBaslat;