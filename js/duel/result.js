/* ========================================================================= */
/* DÜELLO SONUÇ — Sonuç ekranı yönetimi, yeni oyun isteği takibi            */
/* ========================================================================= */

// Sonuç ekranı açıldığında yeni oyun isteği dinleyicisini başlat
window.duelloSonucEkraniAcildi = function () {
  const { odaKodu } = window.duelloDurum;
  if (!odaKodu) return;

  duelloYeniOyunIstegiDinle(odaKodu);
};

/* --------- Yeni Oyun İsteği Dinleyici --------- */
function duelloYeniOyunIstegiDinle(odaKodu) {
  // Önceki dinleyiciyi temizle
  if (window._duelloYeniOyunDinleyici) {
    window._duelloYeniOyunDinleyici();
    window._duelloYeniOyunDinleyici = null;
  }

  const istekRef = ref(veritabani, `duelRooms/${odaKodu}/yeniOyunIstegi`);

  const dinleyici = onValue(istekRef, (snap) => {
    if (!snap.exists()) return;

    const istek = snap.val();
    const benimRolum = window.duelloDurum.rolum;

    // Kendi isteğimse gösterme
    if (istek.yapan === benimRolum) return;

    // Rakibin isteği
    const odaRef = ref(veritabani, `duelRooms/${odaKodu}`);
    get(odaRef).then((odaSnap) => {
      if (!odaSnap.exists()) return;
      const odaVerisi = odaSnap.val();
      const istegiYapanAd =
        istek.yapan === "host"
          ? odaVerisi.host?.ad
          : odaVerisi.misafir?.ad;

      duelloYeniOyunIstegiGoster(
        istegiYapanAd || "Rakip",
        () => _yeniOyunKabul(odaKodu),
        () => _yeniOyunReddet(odaKodu)
      );
    }).catch(console.error);
  });

  window._duelloYeniOyunDinleyici = dinleyici;
}

/* --------- Kabul --------- */
async function _yeniOyunKabul(odaKodu) {
  try {
    // İsteği temizle
    await remove(ref(veritabani, `duelRooms/${odaKodu}/yeniOyunIstegi`));

    // Sonuçları temizle
    await remove(ref(veritabani, `duelRooms/${odaKodu}/sonuc`));
    await remove(ref(veritabani, `duelRooms/${odaKodu}/oyunVerisi`));
    await remove(ref(veritabani, `duelRooms/${odaKodu}/oyuncuSonuclari`));

    // Hazır durumlarını sıfırla
    await set(
      ref(veritabani, `duelRooms/${odaKodu}/host/hazir`),
      false
    );
    await set(
      ref(veritabani, `duelRooms/${odaKodu}/misafir/hazir`),
      false
    );

    // Durumu beklemeye al
    await set(
      ref(veritabani, `duelRooms/${odaKodu}/durum`),
      "bekleme"
    );

    // Dinleyiciyi kapat
    if (window._duelloYeniOyunDinleyici) {
      window._duelloYeniOyunDinleyici();
      window._duelloYeniOyunDinleyici = null;
    }

    // Sistem bildirimini kapat (varsa)
    const eskiBildirim = document.getElementById("duelloSistemBildirim");
    if (eskiBildirim) eskiBildirim.remove();

    // Bekleme odasına dön
    duelloEkraniGoster("beklemOdasiEkrani");
    document.getElementById("beklemOdaKodu").textContent = odaKodu;

  } catch (hata) {
    console.error("Yeni oyun kabul hatası:", hata);
  }
}

/* --------- Reddet --------- */
async function _yeniOyunReddet(odaKodu) {
  try {
    await remove(
      ref(veritabani, `duelRooms/${odaKodu}/yeniOyunIstegi`)
    );
  } catch (hata) {
    console.error("Yeni oyun reddet hatası:", hata);
  }
}

/* --------- Yeni Oyun İste (sonuç ekranındaki buton) --------- */
window.duelloYeniOyunIste = async function () {
  const { odaKodu, rolum } = window.duelloDurum;

  if (!odaKodu || !rolum) {
    // Oda yoksa direkt menüye dön
    duellodenCik();
    return;
  }

  // Rakibin hâlâ odada olup olmadığını kontrol et
  try {
    const odaSnap = await get(ref(veritabani, `duelRooms/${odaKodu}`));
    if (!odaSnap.exists()) {
      duellodenCik();
      return;
    }

    const odaVerisi = odaSnap.val();
    const diger = rolum === "host" ? "misafir" : "host";

    if (!odaVerisi[diger]) {
      // Rakip odada değil
      duelloSistemBildirimiGoster(
        "Rakip Ayrıldı",
        "Rakibiniz odadan çıkmış.",
        "Ana Sayfa",
        () => duellodenCik()
      );
      return;
    }

    // İsteği Firebase'e yaz
    await set(
      ref(veritabani, `duelRooms/${odaKodu}/yeniOyunIstegi`),
      {
        yapan: rolum,
        zaman: Date.now(),
      }
    );

    // Bekleme bildirimi göster
    duelloSistemBildirimiGoster(
      "İstek Gönderildi",
      "Rakibinizin kabulü bekleniyor...",
      "İptal",
      () => _yeniOyunIstegiIptal(odaKodu)
    );

    // Rakibin reddetmesini dinle
    _reddDinleyicisiniBaslat(odaKodu);

  } catch (hata) {
    console.error("Yeni oyun isteği hatası:", hata);
  }
};

/* --------- İptal --------- */
async function _yeniOyunIstegiIptal(odaKodu) {
  try {
    window._duelloManuelIptal = true;
    await remove(
      ref(veritabani, `duelRooms/${odaKodu}/yeniOyunIstegi`)
    );

    // Reddet dinleyicisini kapat
    if (window._duelloReddDinleyici) {
      window._duelloReddDinleyici();
      window._duelloReddDinleyici = null;
    }
  } catch (hata) {
    console.error("Yeni oyun iptal hatası:", hata);
  }
}

/* --------- Reddet Dinleyicisi --------- */
// Karşı taraf reddederse bildirim göster, kendi iptal ettiysek sessizce kapat
function _reddDinleyicisiniBaslat(odaKodu) {
  if (window._duelloReddDinleyici) {
    window._duelloReddDinleyici();
    window._duelloReddDinleyici = null;
  }

  const istekRef = ref(
    veritabani,
    `duelRooms/${odaKodu}/yeniOyunIstegi`
  );

  // İlk değeri atla (henüz var olan isteği "silindi" sanmasın)
  let ilkDeger = true;

  const dinleyici = onValue(istekRef, (snap) => {
    if (ilkDeger) {
      ilkDeger = false;
      return;
    }

    if (!snap.exists()) {
      // İstek silindi (reddedildi veya biz iptal ettik)
      dinleyici();
      window._duelloReddDinleyici = null;

      const eskiBildirim = document.getElementById("duelloSistemBildirim");
      if (eskiBildirim) eskiBildirim.remove();

      // Kendi iptalimiz değilse (hâlâ sonuç ekranındaysak ve manuel iptal etmediysek) reddedildi mesajı göster
      if (!window._duelloManuelIptal) {
        duelloSistemBildirimiGoster(
          "İstek Reddedildi",
          "Rakibiniz yeni oyun isteğini reddetti.",
          "Tamam",
          () => {}
        );
      }
      window._duelloManuelIptal = false;
    }
  });

  window._duelloReddDinleyici = dinleyici;
}

/* --------- Sonuç Ekranı Çıkış Kontrolü --------- */
// Oyuncu sonuç ekranından ayrılırsa diğeri etkilenmez
// Bu fonksiyon sadece kendi temizliğini yapar
window.duelloSonuctenCik = function () {
  // Yeni oyun dinleyicisini kapat
  if (window._duelloYeniOyunDinleyici) {
    window._duelloYeniOyunDinleyici();
    window._duelloYeniOyunDinleyici = null;
  }

  // Reddet dinleyicisini kapat
  if (window._duelloReddDinleyici) {
    window._duelloReddDinleyici();
    window._duelloReddDinleyici = null;
  }

  // Toast varsa kaldır
  const toast = document.getElementById("duelloIstekToast");
  if (toast) toast.remove();

  // Sistem bildirimi varsa kaldır
  const bildirim = document.getElementById("duelloSistemBildirim");
  if (bildirim) bildirim.remove();
};

/* --------- Ana Sayfa Butonu --------- */
window.duelloAnaSayfayaGit = async function () {
  const { odaKodu, rolum } = window.duelloDurum;

  duelloSonuctenCik();

  if (!odaKodu || !rolum) {
    duellodenCik();
    return;
  }

  try {
    if (rolum === "misafir") {
      // Misafir çıkarsa kendi alanını sil
      await remove(
        ref(veritabani, `duelRooms/${odaKodu}/misafir`)
      );
      await remove(
        ref(veritabani, `duelPresence/${odaKodu}/misafir`)
      );

      // Oda dinleyicisini kapat
      if (window.duelloDurum.dinleyici) {
        window.duelloDurum.dinleyici();
        window.duelloDurum.dinleyici = null;
      }

      duelloDurumunuSifirla();
      duellodenCik();

    } else if (rolum === "host") {
      // Host çıkarsa odayı tamamen sil
      await remove(ref(veritabani, `duelRooms/${odaKodu}`));
      await remove(
        ref(veritabani, `duelPresence/${odaKodu}`)
      );

      // Oda dinleyicisini kapat
      if (window.duelloDurum.dinleyici) {
        window.duelloDurum.dinleyici();
        window.duelloDurum.dinleyici = null;
      }

      duelloDurumunuSifirla();
      duellodenCik();
    }
  } catch (hata) {
    console.error("Ana sayfa dönüş hatası:", hata);
    duelloDurumunuSifirla();
    duellodenCik();
  }
};

window.duelloYeniOyunIstegiDinle = duelloYeniOyunIstegiDinle;