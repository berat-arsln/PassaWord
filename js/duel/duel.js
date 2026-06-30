/* ========================================================================= */
/* DÜELLO ANA KOORDİNATÖR — Tüm modülleri bağlar, game.js hook'ları         */
/* ========================================================================= */

window.addEventListener("error", (e) => {
  alert("HATA: " + e.message + " | " + e.filename + ":" + e.lineno);
});

/* --------- Başlatma --------- */
window.duelloSisteminiBaslat = async function () {
  // Ekranları oluştur (DOM'a enjekte et)
  duelloEkranlariOlustur();

  // Sayfa yenilenme kontrolü (önceki düello kaldığı yerden devam edebilir)
  const yenilendiMi = await duelloSayfaYenilemeyiKontrolEt();
  if (yenilendiMi) return;
};

/* --------- Tek Oyunculu Başlat --------- */
window.tekOyunculuBaslat = function () {
  window.oyunDurumu.duelloModu = false;
  oyunuBaslat();
};

/* --------- Düello Menüsü Aç --------- */
window.duelloMenuAc = function () {
  const odaKoduGiris = document.getElementById("odaKoduGiris");
  if (odaKoduGiris) odaKoduGiris.value = "";

  const odaKoduGirGiris = document.getElementById("odaKoduGirGiris");
  if (odaKoduGirGiris) odaKoduGirGiris.value = "";

  const hatalar = ["odaOlusturHata", "odaGirHata", "beklemHata"];
  hatalar.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  });

  const butonlar = ["odaOlusturButon", "odaGirButon"];
  butonlar.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = false;
  });

  duelloEkraniGoster("duelloMenuEkrani");
};

/* --------- game.js Hook — oyunuBitir --------- */
const _orijinalOyunuBitir = window.oyunuBitir;

window.oyunuBitir = function (erkenBitirildi = false) {
  if (!window.oyunDurumu?.duelloModu) {
    // Normal mod — orijinal fonksiyon
    if (typeof _orijinalOyunuBitir === "function") {
      _orijinalOyunuBitir(erkenBitirildi);
    }
    return;
  }

  // Düello modu
  clearInterval(window.oyunDurumu.zamanlayici);
  window.oyunDurumu.calisiyor = false;

  const sonuc = duelloSonucObjesiOlustur();
  duelloOyunBitti(sonuc);

  // NOT: localStorage'ı SİLMİYORUZ — "rakip bekleniyor" durumunda
  // sayfa yenilenirse bu kayıt sayesinde Firebase'den durumu tekrar kontrol edebiliriz.
  // Kayıt sadece "oyun" veya "bekleme" durumuna geçince (room.js/result.js) ya da
  // sonuç ekranı gösterilince temizlenecek.
};

/* --------- game.js Hook — zamanlayiciBaslat --------- */
if (typeof zamanlayiciBaslat === "function") {
  window.zamanlayiciBaslat = function () {
    if (window.oyunDurumu?.zamanlayici) {
      clearInterval(window.oyunDurumu.zamanlayici);
    }
    window.oyunDurumu.zamanlayici = setInterval(() => {
      window.oyunDurumu.kalanSure--;

      if (typeof sureyiGuncelle === "function") sureyiGuncelle();

      if (window.oyunDurumu.duelloModu) {
        duelloPeriyodikKayit();
      }

      if (window.oyunDurumu.kalanSure <= 0) {
        window.oyunuBitir();
      }
    }, 1000);
  };
}

/* --------- game.js Hook — skorkaydet --------- */
const _orijinalSkorkaydet = window.skorkaydet;
window.skorkaydet = function (puan, dogru, yanlis, pas, detay) {
  if (window.oyunDurumu?.duelloModu) return;
  if (typeof _orijinalSkorkaydet === "function") {
    _orijinalSkorkaydet(puan, dogru, yanlis, pas, detay);
  }
};

/* --------- game.js Hook — gecmiseKaydet --------- */
const _orijinalGecmiseKaydet = window.gecmiseKaydet;
window.gecmiseKaydet = function (veri) {
  if (window.oyunDurumu?.duelloModu) return;
  if (typeof _orijinalGecmiseKaydet === "function") {
    _orijinalGecmiseKaydet(veri);
  }
};

/* --------- Düello Ekran Geçişi Hook --------- */
// duelloEkraniGoster sonuç ekranını açarsa yeni oyun isteği dinleyicisini başlat
const _orijinalDuelloEkraniGoster = window.duelloEkraniGoster;
window.duelloEkraniGoster = function (ekranId) {
  if (typeof _orijinalDuelloEkraniGoster === "function") {
    _orijinalDuelloEkraniGoster(ekranId);
  }

  if (ekranId === "duelloSonucEkrani") {
    duelloSonucEkraniAcildi();
  }
};

/* --------- Firebase Bağlantı Kopma Algılama --------- */
window.duelloBaglantiIzleyicisiniBaslat = function () {
  const baglantiRef = ref(veritabani, ".info/connected");

  onValue(baglantiRef, (snap) => {
    const bagli = snap.val();

    if (
      !bagli &&
      window.oyunDurumu?.duelloModu &&
      window.oyunDurumu?.calisiyor
    ) {
      if (window.oyunDurumu.zamanlayici) {
        clearInterval(window.oyunDurumu.zamanlayici);
      }

      duelloOyunDurumunuKaydet();
      duelloBaglantiKoptu();
    }
  });
};

/* --------- DOMContentLoaded --------- */
document.addEventListener("DOMContentLoaded", () => {
  duelloSisteminiBaslat();

  setTimeout(() => {
    if (window.veritabani && window.ref && window.onValue) {
      duelloBaglantiIzleyicisiniBaslat();
    }
  }, 2000);
});