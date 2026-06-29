/* ========================================================================= */
/* DÜELLO ANA KOORDİNATÖR — Tüm modülleri bağlar, game.js hook'ları         */
/* ========================================================================= */

/* --------- Başlatma --------- */
window.duelloSisteminiBaslat = async function () {
  // Ekranları oluştur (DOM'a enjekte et)
  duelloEkranlariOlustur();

  // Sayfa yenilenme kontrolü (önceki düello kaldığı yerden devam edebilir)
  const yenilendiMi = await duelloSayfaYenilemeyiKontrolEt();
  if (yenilendiMi) return;
};

/* --------- Ana Sayfa Buton Değişimi --------- */
// "OYNA" butonunu kaldırıp "Tek Oyunculu / Düello" butonlarını gösterir
window.duelloAnaSayfaButonlariniAyarla = function () {
  const hazirEkrani = document.getElementById("hazirEkrani");
  if (!hazirEkrani) return;

  // Mevcut OYNA butonunu gizle
  const oynaButon = hazirEkrani.querySelector(".ana-buton");
  if (oynaButon) oynaButon.style.display = "none";

  // Zaten eklendiyse tekrar ekleme
  if (document.getElementById("duelloModSecimi")) return;

  const modSecimi = document.createElement("div");
  modSecimi.id = "duelloModSecimi";
  modSecimi.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    max-width: 320px;
    margin-top: 8px;
  `;
  modSecimi.innerHTML = `
    <button
      class="ana-buton"
      onclick="tekOyunculuBaslat()"
      style="background:linear-gradient(145deg,#1976d2,#0d47a1);margin:0"
    >
      👤 Tek Oyunculu
    </button>
    <button
      class="ana-buton"
      onclick="duelloMenuAc()"
      style="background:linear-gradient(145deg,#7c3aed,#4f1fc7);
             box-shadow:0 4px 20px rgba(124,58,237,0.45);margin:0"
    >
      ⚔️ Düello
    </button>
  `;

  hazirEkrani.appendChild(modSecimi);
};

/* --------- Tek Oyunculu Başlat --------- */
window.tekOyunculuBaslat = function () {
  // Düello modunu kapat, normal oyunu başlat
  window.oyunDurumu.duelloModu = false;
  oyunuBaslat();
};

/* --------- Düello Menüsü Aç --------- */
window.duelloMenuAc = function () {
  // Giriş alanlarını temizle
  const odaKoduGiris = document.getElementById("odaKoduGiris");
  if (odaKoduGiris) odaKoduGiris.value = "";

  const odaKoduGirGiris = document.getElementById("odaKoduGirGiris");
  if (odaKoduGirGiris) odaKoduGirGiris.value = "";

  // Hata mesajlarını temizle
  const hatalar = ["odaOlusturHata", "odaGirHata", "beklemHata"];
  hatalar.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  });

  // Butonları serbest bırak
  const butonlar = ["odaOlusturButon", "odaGirButon"];
  butonlar.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = false;
  });

  duelloEkraniGoster("duelloMenuEkrani");
};

/* --------- game.js Hook — oyunuBitir --------- */
// game.js'deki oyunuBitir fonksiyonunu sarmallar
// Düello modunda skoru kaydetmez, geçmişe eklemez
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

  // Süre bonusu yok, kombo yok, geçmiş yok, skor yok
  // Sadece sonuç objesini oluştur ve Firebase'e gönder
  const sonuc = duelloSonucObjesiOlustur();
  duelloOyunBitti(sonuc);

  // LocalStorage kaydını temizle
  duelloLocalStorageTemizle();
};

/* --------- game.js Hook — zamanlayiciBaslat --------- */
// Her saniye çalışan zamanlayıcıya periyodik kayıt ekler
const _orijinalZamanlayiciBaslat = window.zamanlayiciBaslat;

if (typeof zamanlayiciBaslat === "function") {
  const _orijinal = zamanlayiciBaslat;
  window.zamanlayiciBaslat = function () {
    if (window.oyunDurumu?.zamanlayici) {
      clearInterval(window.oyunDurumu.zamanlayici);
    }
    window.oyunDurumu.zamanlayici = setInterval(() => {
      window.oyunDurumu.kalanSure--;

      if (typeof sureyiGuncelle === "function") sureyiGuncelle();

      // Düello modunda periyodik kayıt
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
// Düello modunda skor kaydını engelle
const _orijinalSkorkaydet = window.skorkaydet;
window.skorkaydet = function (puan, dogru, yanlis, pas, detay) {
  if (window.oyunDurumu?.duelloModu) return; // Düelloda kaydetme
  if (typeof _orijinalSkorkaydet === "function") {
    _orijinalSkorkaydet(puan, dogru, yanlis, pas, detay);
  }
};

/* --------- game.js Hook — gecmiseKaydet --------- */
// Düello modunda geçmişe kaydetmeyi engelle
const _orijinalGecmiseKaydet = window.gecmiseKaydet;
window.gecmiseKaydet = function (veri) {
  if (window.oyunDurumu?.duelloModu) return; // Düelloda kaydetme
  if (typeof _orijinalGecmiseKaydet === "function") {
    _orijinalGecmiseKaydet(veri);
  }
};

/* --------- Sonuç Ekranı Açıldığında --------- */
// duelloSonucEkrani açıldığında yeni oyun dinleyicisini başlat
const _orijinalEkraniGoster = window.ekraniGoster;
window.ekraniGoster = function (ekranId) {
  if (typeof _orijinalEkraniGoster === "function") {
    _orijinalEkraniGoster(ekranId);
  }
};

/* --------- Düello Ekran Geçişi Hook --------- */
// duelloEkraniGoster sonuç ekranı açarsa dinleyiciyi başlat
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

    // Sadece düello oyunu sırasında bağlantı kopmasını algıla
    if (
      !bagli &&
      window.oyunDurumu?.duelloModu &&
      window.oyunDurumu?.calisiyor
    ) {
      // Oyun zamanlayıcısını durdur
      if (window.oyunDurumu.zamanlayici) {
        clearInterval(window.oyunDurumu.zamanlayici);
      }

      // Mevcut durumu kaydet
      duelloOyunDurumunuKaydet();

      // Bağlantı koptu ekranına geç
      duelloBaglantiKoptu();
    }
  });
};

/* --------- Bakım Modu + Düello Uyumluluğu --------- */
// Bakım modunda düello butonlarını gösterme
window.duelloBakimModuKontrol = function () {
  const modSecimi = document.getElementById("duelloModSecimi");
  if (modSecimi) modSecimi.style.display = "none";
};

/* --------- DOMContentLoaded --------- */
document.addEventListener("DOMContentLoaded", () => {
  // Düello sistemini başlat
  duelloSisteminiBaslat();

  // Firebase bağlantı izleyicisini başlat
  // (veritabani hazır olduktan sonra çalışsın diye kısa gecikme)
  setTimeout(() => {
    if (window.veritabani && window.ref && window.onValue) {
      duelloBaglantiIzleyicisiniBaslat();
    }
  }, 2000);
});

/* --------- Profil Yüklendikten Sonra Butonları Ayarla --------- */
// app.js'deki profil yükleme tamamlandığında çağrılır
window.duelloProfilHazir = function () {
  duelloAnaSayfaButonlariniAyarla();
};