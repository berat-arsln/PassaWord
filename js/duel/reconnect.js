/* ========================================================================= */
/* DÜELLO YENİDEN BAĞLANMA — Bağlantı kopması, geri sayım, sayfa yenileme   */
/* ========================================================================= */

const YENIDEN_BAGLAN_SURE = 60; // saniye

window.duelloReconnect = {
  zamanlayici: null,
  kalanSure: YENIDEN_BAGLAN_SURE,
  aktif: false,
  odaKodu: null,
  rolum: null,
};

/* --------- Bağlantı Koptu --------- */
window.duelloBaglantiKoptu = function () {
  if (window.duelloReconnect.aktif) return;

  const { odaKodu, rolum } = window.duelloDurum;
  if (!odaKodu || !rolum) return;

  window.duelloReconnect.aktif = true;
  window.duelloReconnect.odaKodu = odaKodu;
  window.duelloReconnect.rolum = rolum;
  window.duelloReconnect.kalanSure = YENIDEN_BAGLAN_SURE;

  // Oyun durumunu localStorage'a kaydet (sayfa yenilenirse geri dönebilsin)
  duelloOyunDurumunuKaydet();

  // Bağlantı koptu ekranına geç
  duelloEkraniGoster("baglantiKoptuEkrani");
  baglantiGeriSayimGuncelle(window.duelloReconnect.kalanSure);

  // Geri sayımı başlat
  window.duelloReconnect.zamanlayici = setInterval(() => {
    window.duelloReconnect.kalanSure--;
    baglantiGeriSayimGuncelle(window.duelloReconnect.kalanSure);

    if (window.duelloReconnect.kalanSure <= 0) {
      duelloBaglantiZamanAsimi();
    }
  }, 1000);

  // Firebase bağlantısını dinle
  duelloFirebaseBaglantiDinle();
};

/* --------- Firebase Bağlantı Durumu Dinle --------- */
function duelloFirebaseBaglantiDinle() {
  const baglantiRef = ref(veritabani, ".info/connected");

  const dinleyici = onValue(baglantiRef, (snap) => {
    const bagli = snap.val();

    if (bagli && window.duelloReconnect.aktif) {
      // Bağlantı geri geldi
      dinleyici(); // dinleyiciyi kapat
      duelloYenidenBaglan();
    }
  });

  window.duelloReconnect.baglantiDinleyici = dinleyici;
}

/* --------- Yeniden Bağlan --------- */
async function duelloYenidenBaglan() {
  const { odaKodu, rolum } = window.duelloReconnect;
  if (!odaKodu || !rolum) return;

  try {
    // Odanın hâlâ var olup olmadığını kontrol et
    const odaSnap = await get(ref(veritabani, `duelRooms/${odaKodu}`));

    if (!odaSnap.exists()) {
      // Oda silinmiş
      duelloBaglantiTemizle();
      duelloLocalStorageTemizle();
      duelloSistemBildirimiGoster(
        "Oda Kapatıldı",
        "Bağlantı kesildiği sırada oda kapandı.",
        "Ana Sayfa",
        () => duellodenCik()
      );
      return;
    }

    const odaVerisi = odaSnap.val();

    // Presence'ı yenile
    duelloPresenceYenile(odaKodu, rolum);

    // Geri sayımı durdur
    duelloBaglantiTemizle();

    // Oyun hâlâ devam ediyorsa kaldığı yerden devam et
    if (odaVerisi.durum === "oyun") {
      const kayitliDurum = duelloLocalStorageOku();

      if (kayitliDurum) {
        duelloOyunDurumunuGeriYukle(kayitliDurum);
      }

      // Dinleyiciyi yeniden başlat
      window.duelloDurum.odaKodu = odaKodu;
      window.duelloDurum.rolum = rolum;
      odaDinleyicisiniBaslat(odaKodu);

      duelloEkraniGoster("oyunEkrani");

      // Zamanlayıcıyı yeniden başlat (kalan süreden)
      if (
        window.oyunDurumu.calisiyor &&
        typeof zamanlayiciBaslat === "function"
      ) {
        if (window.oyunDurumu.zamanlayici) {
          clearInterval(window.oyunDurumu.zamanlayici);
        }
        zamanlayiciBaslat();
      }

    } else if (odaVerisi.durum === "bitti" && odaVerisi.sonuc) {
      // Oyun bitmişse sonuç ekranına git
      duelloLocalStorageTemizle();
      duelloSonucGoster(odaVerisi.sonuc);

    } else if (odaVerisi.durum === "bekleme") {
      // Bekleme odasına dön
      duelloLocalStorageTemizle();
      window.duelloDurum.odaKodu = odaKodu;
      window.duelloDurum.rolum = rolum;
      odaDinleyicisiniBaslat(odaKodu);
      duelloEkraniGoster("beklemOdasiEkrani");
      document.getElementById("beklemOdaKodu").textContent = odaKodu;
    }

  } catch (hata) {
    console.error("Yeniden bağlanma hatası:", hata);
    duelloBaglantiZamanAsimi();
  }
}

/* --------- Zaman Aşımı --------- */
function duelloBaglantiZamanAsimi() {
  duelloBaglantiTemizle();
  duelloLocalStorageTemizle();

  // Oyun zamanlayıcısını durdur
  if (window.oyunDurumu?.zamanlayici) {
    clearInterval(window.oyunDurumu.zamanlayici);
  }

  // Oda verisini temizle (misafirse kendi alanını sil)
  const { odaKodu, rolum } = window.duelloReconnect;
  if (odaKodu && rolum) {
    if (rolum === "host") {
      remove(ref(veritabani, `duelRooms/${odaKodu}`)).catch(console.error);
    } else {
      remove(
        ref(veritabani, `duelRooms/${odaKodu}/misafir`)
      ).catch(console.error);
    }
    remove(
      ref(veritabani, `duelPresence/${odaKodu}/${rolum}`)
    ).catch(console.error);
  }

  duelloDurumunuSifirla();

  duelloSistemBildirimiGoster(
    "Bağlantı Kesildi",
    "Süre doldu, oyun sonlandırıldı.",
    "Ana Sayfa",
    () => duellodenCik()
  );
}

/* --------- Sayfa Yenileme Kontrolü --------- */
window.duelloSayfaYenilemeyiKontrolEt = async function () {
  const kayitliDurum = duelloLocalStorageOku();
  if (!kayitliDurum) return false;

  const { odaKodu, rolum, profilAd } = kayitliDurum;
  if (!odaKodu || !rolum) return false;

  // Süre dolmuş mu?
  const gecenSure = Date.now() - (kayitliDurum.kayitZamani || 0);
  if (gecenSure > YENIDEN_BAGLAN_SURE * 1000) {
    duelloLocalStorageTemizle();
    return false;
  }

  try {
    const odaSnap = await get(ref(veritabani, `duelRooms/${odaKodu}`));
    if (!odaSnap.exists()) {
      duelloLocalStorageTemizle();
      return false;
    }

    const odaVerisi = odaSnap.val();

    // Profil kontrolü
    const profil = aktifProfiliGetir();
    if (!profil || profil.ad !== profilAd) {
      duelloLocalStorageTemizle();
      return false;
    }

    // Duello durumunu geri yükle
    window.duelloDurum.odaKodu = odaKodu;
    window.duelloDurum.odaRef = ref(veritabani, `duelRooms/${odaKodu}`);
    window.duelloDurum.rolum = rolum;
    window.duelloDurum.profilAd = profilAd;

    // Presence yenile
    duelloPresenceYenile(odaKodu, rolum);

    // Oda dinleyicisini başlat
    odaDinleyicisiniBaslat(odaKodu);

    if (odaVerisi.durum === "oyun" && odaVerisi.oyunVerisi) {
      // Oyun devam ediyorsa kaldığı yerden devam et
      duelloOyunDurumunuGeriYukle(kayitliDurum);
      duelloEkraniGoster("oyunEkrani");

      const input = document.getElementById("cevapGiris");
      if (input) {
        input.setAttribute("readonly", "true");
        setTimeout(() => input.removeAttribute("readonly"), 100);
      }

      setTimeout(() => {
        if (typeof klavyeDurumunuGuncelle === "function") klavyeDurumunuGuncelle();
        if (typeof daireOlustur === "function") daireOlustur();
        if (typeof harfiAktifYap === "function") {
          harfiAktifYap(window.oyunDurumu.mevcutHarfIndeks, true);
        }
        if (typeof zamanlayiciBaslat === "function") zamanlayiciBaslat();
        if (typeof canliIstatistikGuncelle === "function") canliIstatistikGuncelle();
      }, 100);

    } else if (odaVerisi.durum === "bitti" && odaVerisi.sonuc) {
      duelloLocalStorageTemizle();
      duelloSonucGoster(odaVerisi.sonuc);

    } else if (odaVerisi.durum === "bekleme") {
      duelloLocalStorageTemizle();
      duelloEkraniGoster("beklemOdasiEkrani");
      document.getElementById("beklemOdaKodu").textContent = odaKodu;
    }

    return true;

  } catch (hata) {
    console.error("Sayfa yenileme kontrolü hatası:", hata);
    duelloLocalStorageTemizle();
    return false;
  }
};

/* --------- Presence Yenile --------- */
function duelloPresenceYenile(odaKodu, rolum) {
  const presenceRef = ref(veritabani, `duelPresence/${odaKodu}/${rolum}`);
  set(presenceRef, {
    cevrimici: true,
    sonGorulme: Date.now(),
  }).catch(console.error);
  window.duelloDurum.presenceRef = presenceRef;
}

/* --------- LocalStorage İşlemleri --------- */
function duelloOyunDurumunuKaydet() {
  const { odaKodu, rolum, profilAd } = window.duelloDurum;
  if (!odaKodu || !rolum) return;

  const kayit = {
    odaKodu,
    rolum,
    profilAd,
    kayitZamani: Date.now(),
    oyunDurum: {
      harfDurumlari: { ...window.oyunDurumu.harfDurumlari },
      harfCevaplari: { ...window.oyunDurumu.harfCevaplari },
      mevcutHarfIndeks: window.oyunDurumu.mevcutHarfIndeks,
      mevcutHarf: window.oyunDurumu.mevcutHarf,
      kalanSure: window.oyunDurumu.kalanSure,
      pasKuyrugu: [...(window.oyunDurumu.pasKuyrugu || [])],
      pasModu: window.oyunDurumu.pasModu,
      pasIndeks: window.oyunDurumu.pasIndeks,
      puan: window.oyunDurumu.puan,
      dogruSayisi: window.oyunDurumu.dogruSayisi,
      yanlisSayisi: window.oyunDurumu.yanlisSayisi,
      pasSayisi: window.oyunDurumu.pasSayisi,
    },
  };

  try {
    localStorage.setItem("pw_duello_kayit", JSON.stringify(kayit));
  } catch (hata) {
    console.error("Düello kayıt hatası:", hata);
  }
}

function duelloLocalStorageOku() {
  try {
    const raw = localStorage.getItem("pw_duello_kayit");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function duelloLocalStorageTemizle() {
  localStorage.removeItem("pw_duello_kayit");
}

function duelloOyunDurumunuGeriYukle(kayit) {
  if (!kayit?.oyunDurum) return;
  const d = kayit.oyunDurum;

  window.oyunDurumu.harfDurumlari = d.harfDurumlari || {};
  window.oyunDurumu.harfCevaplari = d.harfCevaplari || {};
  window.oyunDurumu.mevcutHarfIndeks = d.mevcutHarfIndeks || 0;
  window.oyunDurumu.mevcutHarf = d.mevcutHarf || "A";
  window.oyunDurumu.kalanSure = d.kalanSure || 360;
  window.oyunDurumu.pasKuyrugu = d.pasKuyrugu || [];
  window.oyunDurumu.pasModu = d.pasModu || false;
  window.oyunDurumu.pasIndeks = d.pasIndeks || 0;
  window.oyunDurumu.puan = d.puan || 0;
  window.oyunDurumu.dogruSayisi = d.dogruSayisi || 0;
  window.oyunDurumu.yanlisSayisi = d.yanlisSayisi || 0;
  window.oyunDurumu.pasSayisi = d.pasSayisi || 0;
  window.oyunDurumu.calisiyor = true;
  window.oyunDurumu.duelloModu = true;
}

/* --------- Bağlantı Temizle --------- */
function duelloBaglantiTemizle() {
  if (window.duelloReconnect.zamanlayici) {
    clearInterval(window.duelloReconnect.zamanlayici);
    window.duelloReconnect.zamanlayici = null;
  }
  if (window.duelloReconnect.baglantiDinleyici) {
    window.duelloReconnect.baglantiDinleyici();
    window.duelloReconnect.baglantiDinleyici = null;
  }
  window.duelloReconnect.aktif = false;
}

/* --------- Oyun Sırasında Periyodik Kayıt --------- */
// game.js zamanlayıcısı her saniye çalışır,
// biz de her 10 saniyede bir localStorage'a kaydederiz
let _duelloKayitSayaci = 0;
window.duelloPeriyodikKayit = function () {
  if (!window.oyunDurumu?.duelloModu) return;
  _duelloKayitSayaci++;
  if (_duelloKayitSayaci >= 10) {
    _duelloKayitSayaci = 0;
    duelloOyunDurumunuKaydet();
  }
};

window.duelloBaglantiKoptu = window.duelloBaglantiKoptu;
window.duelloOyunDurumunuKaydet = duelloOyunDurumunuKaydet;
window.duelloLocalStorageTemizle = duelloLocalStorageTemizle;
window.duelloBaglantiTemizle = duelloBaglantiTemizle;