// Cihaza özgü benzersiz ID (her cihaz için tek, değişmez)
function cihazIdGetir() {
  let cihazId = localStorage.getItem("pw_cihaz_id");
  if (!cihazId) {
    cihazId =
      "cihaz_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
    localStorage.setItem("pw_cihaz_id", cihazId);
  }
  return cihazId;
}

// localStorage cache'den profil listesi oku
function profilleriGetir() {
  return JSON.parse(localStorage.getItem("pw_profiller") || "[]");
}

// localStorage cache'den aktif profili oku
function aktifProfiliGetir() {
  const aktifId = localStorage.getItem("pw_aktif_profil");
  const profiller = profilleriGetir();
  return profiller.find((p) => p.id === aktifId) || profiller[0] || null;
}

// localStorage cache'e profil listesini kaydet
function profilleriKaydet(profiller) {
  localStorage.setItem("pw_profiller", JSON.stringify(profiller));
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
      tarih: new Date().toISOString(),
    });
  } catch (e) {
    console.warn("Firebase profil güncellenemedi (offline?):", e);
  }
}

// Mevcut localStorage profilleri Firebase'e migrate et (bir kez çalışır)
async function migrasyonYap() {
  if (localStorage.getItem("pw_firebase_migrate_v1") === "done") return;
  const profiller = profilleriGetir();
  if (profiller.length === 0) {
    localStorage.setItem("pw_firebase_migrate_v1", "done");
    return;
  }
  // Her profil için yedek kodu yoksa oluştur ve Firebase'e yaz
  for (const profil of profiller) {
    try {
      await yedekKoduOlustur(profil);
    } catch (e) {
      console.warn("Migrasyon hatası:", profil.ad, e);
    }
  }
  localStorage.setItem("pw_firebase_migrate_v1", "done");
  console.log("✅ Profil migrasyonu tamamlandı");
}

async function profilleriFirebaseIleEslestir() {
  const profiller = profilleriGetir();
  if (profiller.length === 0) return;
  const kalanlar = [];
  for (const profil of profiller) {
    if (!profil.yedekKod) {
      kalanlar.push(profil);
      continue;
    }
    try {
      const snap = await get(ref(veritabani, `yedekler/${profil.yedekKod}`));
      if (snap.exists()) {
        kalanlar.push(profil);
      } else {
        toastGoster(`⚠️ "${profil.ad}" profili sunucuda bulunamadı, silindi.`);
      }
    } catch (e) {
      kalanlar.push(profil);
    }
  }
  if (kalanlar.length !== profiller.length) {
    profilleriKaydet(kalanlar);
    const aktifId = localStorage.getItem("pw_aktif_profil");
    const aktifHalaVar = kalanlar.some((p) => p.id === aktifId);
    if (!aktifHalaVar) {
      if (kalanlar.length > 0) {
        localStorage.setItem("pw_aktif_profil", kalanlar[0].id);
      } else {
        localStorage.removeItem("pw_aktif_profil");
        ekraniGoster("baslangicEkrani");
        document.getElementById("hazirEkrani").style.display = "none";
        document.getElementById("profilOlusturKutu").style.display = "block";
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
  Object.values(_profilSilmeListenerleri).forEach((unsub) => unsub());
  _profilSilmeListenerleri = {};
  const profiller = profilleriGetir();
  profiller.forEach((profil) => {
    if (!profil.yedekKod) return;
    // Önce bir kez kontrol et, varsa listener başlat
    get(ref(veritabani, `yedekler/${profil.yedekKod}`))
      .then((snap) => {
        if (!snap.exists()) return; // Zaten yok, listener başlatma
        const profilRef = ref(veritabani, `yedekler/${profil.yedekKod}`);
        _profilSilmeListenerleri[profil.id] = onValue(profilRef, (s) => {
          if (!s.exists()) {
            const kalanlar = profilleriGetir().filter(
              (p) => p.id !== profil.id
            );
            profilleriKaydet(kalanlar);
            if (localStorage.getItem("pw_aktif_profil") === profil.id) {
              if (kalanlar.length > 0) {
                localStorage.setItem("pw_aktif_profil", kalanlar[0].id);
                toastGoster("⚠️ Aktif profil silindi.");
                setTimeout(() => {
                  modalAc("profilSecModal");
                  profilListesiniGuncelle();
                }, 500);
              } else {
                localStorage.removeItem("pw_aktif_profil");
                toastGoster("⚠️ Profilin silindi.");
                document
                  .querySelectorAll(".modal-arkaplan.acik")
                  .forEach((m) => m.classList.remove("acik"));
                ekraniGoster("baslangicEkrani");
                document.getElementById("hazirEkrani").style.display = "none";
                document.getElementById("profilOlusturKutu").style.display =
                  "block";
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
      })
      .catch(() => {});
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
  const indeks = profiller.findIndex((p) => p.id === profil.id);
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
      tarih: new Date().toISOString(),
    });
    return profil.yedekKod;
  }

  // İlk kez oluştur
  const karakterler = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let kod = "PW-";
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
    tarih: new Date().toISOString(),
  });

  // Kodu profile kaydet
  const profiller = profilleriGetir();
  const indeks = profiller.findIndex((p) => p.id === profil.id);
  if (indeks !== -1) {
    profiller[indeks].yedekKod = kod;
    profilleriKaydet(profiller);
  }

  return kod;
}

/* ========================================================================= */
/* AKTİF PROFİL UI GÜNCELLEME                                               */
/* ========================================================================= */
function aktifProfilUiGuncelle() {
  const profil = aktifProfiliGetir();
  const adiEl = document.getElementById("aktifProfilAdi");
  const altEl = document.getElementById("aktifProfilAlt");
  if (!profil) {
    if (adiEl) adiEl.textContent = "—";
    if (altEl) altEl.innerHTML = "Henüz profil yok";
    return;
  }
  if (adiEl) adiEl.textContent = profil.ad;
  if (altEl) {
    altEl.innerHTML = profil.yedekKod
      ? `Şu an aktif profil • Silmek için basılı tut<br><span style="font-size:10px;color:#4fc3f7;letter-spacing:1px;">${profil.yedekKod}</span>`
      : `Şu an aktif profil • Silmek için basılı tut`;
  }
}

window.profilOlustur = function () {
  const isim = document.getElementById("profilIsimGiris").value.trim();
  if (!isim) {
    toastGoster("Lütfen bir isim girin!");
    return;
  }
  const yeniProfil = {
    id: "profil_" + Date.now(),
    ad: isim,
    skorlar: [],
    olusturulma: new Date().toISOString(),
  };
  const profiller = profilleriGetir();
  profiller.push(yeniProfil);
  profilleriKaydet(profiller);
  localStorage.setItem("pw_aktif_profil", yeniProfil.id);
  document.getElementById("profilOlusturKutu").style.display = "none";
  const hazir = document.getElementById("hazirEkrani");
  hazir.style.display = "flex";
  hazir.style.flexDirection = "column";
  hazir.style.alignItems = "center";
  hazir.style.gap = "16px";
  document.getElementById("hosgeldinIsim").textContent = isim;
  document.getElementById("aktifProfilAdi").textContent = isim;
  // Otomatik yedek kod oluştur
  yedekKoduOlustur(yeniProfil)
    .then(() => {
      localStorage.setItem("pw_aktif_profil", yeniProfil.id);
      aktifProfilUiGuncelle();
      document.getElementById("hosgeldinIsim").textContent = isim;
      document.getElementById("profilOlusturKutu").style.display = "none";
      const hazir = document.getElementById("hazirEkrani");
      hazir.style.display = "flex";
      hazir.style.flexDirection = "column";
      hazir.style.alignItems = "center";
      hazir.style.gap = "16px";
      modalKapat("profilEkleModal");
      modalKapat("ayarlarModal");
      const tazeProfiller = profilleriGetir();
      const tazeProfil = tazeProfiller.find((p) => p.id === yeniProfil.id);
      if (tazeProfil && tazeProfil.yedekKod) {
        aktifProfilSilmeDinleyicisiBaslat(tazeProfil.id, tazeProfil.yedekKod);
      }
      profilListesiniGuncelle();
    })
    .catch(console.error);
};

window.yeniProfilEkle = function () {
  const ad = document.getElementById("yeniProfilAdi").value.trim();
  if (!ad) {
    toastGoster("Lütfen profil adı girin!");
    return;
  }
  const yeniProfil = {
    id: "profil_" + Date.now(),
    ad,
    skorlar: [],
    olusturulma: new Date().toISOString(),
  };
  const profiller = profilleriGetir();
  profiller.push(yeniProfil);
  profilleriKaydet(profiller);
  localStorage.setItem("pw_aktif_profil", yeniProfil.id);
  document.getElementById("yeniProfilAdi").value = "";

  // UI'ı hemen güncelle
  aktifProfilUiGuncelle();
  document.getElementById("hosgeldinIsim").textContent = ad;
  document.getElementById("profilOlusturKutu").style.display = "none";
  const hazir = document.getElementById("hazirEkrani");
  hazir.style.display = "flex";
  hazir.style.flexDirection = "column";
  hazir.style.alignItems = "center";
  hazir.style.gap = "16px";
  modalKapat("profilEkleModal");
  modalKapat("ayarlarModal");
  toastGoster(`"${ad}" oluşturuldu!`);

  // Firebase'e arka planda yaz
  yedekKoduOlustur(yeniProfil)
    .then(() => {
      aktifProfilUiGuncelle();
      const tazeProfiller = profilleriGetir();
      const tazeProfil = tazeProfiller.find((p) => p.id === yeniProfil.id);
      if (tazeProfil && tazeProfil.yedekKod) {
        aktifProfilSilmeDinleyicisiBaslat(tazeProfil.id, tazeProfil.yedekKod);
      }
      profilListesiniGuncelle();
    })
    .catch(console.error);
};

function profilListesiniGuncelle() {
  const profiller = profilleriGetir();
  const aktifProfil = aktifProfiliGetir();
  const liste = document.getElementById("profilListesi");
  liste.innerHTML = "";
  if (profiller.length === 0) {
    liste.innerHTML = `<div style="text-align:center;color:var(--metin-soluk);
          padding:24px;font-size:14px;">Kayıtlı profil yok.</div>`;
    return;
  }

  profiller.forEach((profil) => {
    const satir = document.createElement("div");
    satir.className = `profil-satir${
      profil.id === aktifProfil?.id ? " aktif-profil" : ""
    }`;
    const enIyiSkor =
      profil.skorlar?.length > 0
        ? Math.max(...profil.skorlar.map((s) => s.puan))
        : 0;
    satir.innerHTML = `<div class="profil-adi">${profil.ad}${
      profil.yedekKod
        ? `<span style="font-size:10px;color:var(--metin-soluk);font-weight:600;margin-left:6px;letter-spacing:1px;">${profil.yedekKod}</span>`
        : ""
    }</div><div class="profil-skor">${
      enIyiSkor > 0 ? enIyiSkor + " puan" : "Yeni"
    }</div>${
      profil.id === aktifProfil?.id
        ? '<span class="rozet-aktif">AKTİF</span>'
        : ""
    }`;

    satir.addEventListener("click", () => {
      localStorage.setItem("pw_aktif_profil", profil.id);
      document.getElementById("aktifProfilAdi").textContent = profil.ad;
      document.getElementById("hosgeldinIsim").textContent = profil.ad;
      profilListesiniGuncelle();
      toastGoster(`"${profil.ad}" seçildi`);
      document.getElementById("hosgeldinIsim").textContent = profil.ad;
      document.getElementById("profilOlusturKutu").style.display = "none";
      const hazir = document.getElementById("hazirEkrani");
      hazir.style.display = "flex";
      hazir.style.flexDirection = "column";
      hazir.style.alignItems = "center";
      hazir.style.gap = "16px";
      aktifProfilUiGuncelle();
      // Yeni aktif profil için silme dinleyicisini başlat
      aktifProfilSilmeDinleyicisiBaslat(profil.id, profil.yedekKod);
    });

    let uzunBasmaZamanlayi;
    satir.addEventListener("touchstart", () => {
      uzunBasmaZamanlayi = setTimeout(() => {
        profilSilOnay(profil);
      }, 570);
    });
    satir.addEventListener("touchend", () => clearTimeout(uzunBasmaZamanlayi));
    satir.addEventListener("touchmove", () => clearTimeout(uzunBasmaZamanlayi));
    satir.addEventListener("mousedown", () => {
      uzunBasmaZamanlayi = setTimeout(() => {
        profilSilOnay(profil);
      }, 570);
    });
    satir.addEventListener("mouseup", () => clearTimeout(uzunBasmaZamanlayi));
    satir.addEventListener("mouseleave", () =>
      clearTimeout(uzunBasmaZamanlayi)
    );
    liste.appendChild(satir);
  });
}

function profilSilOnay(profil) {
  onayGoster(
    "Profili Sil",
    `"${profil.ad}" profilini silmek istediğine emin misin? Yedekleme kodu da silinecek; bu profili kullanan diğer cihazlar senkronizasyonunu kaybeder.`,
    async () => {
      // Firebase'den yedek kodunu da sil
      if (profil.yedekKod) {
        try {
          const snap = await get(
            ref(veritabani, `yedekler/${profil.yedekKod}`)
          );

          if (snap.exists()) {
            await set(
              ref(veritabani, `silinenProfiller/${profil.yedekKod}`),
              snap.val()
            );
          }

          await remove(ref(veritabani, `yedekler/${profil.yedekKod}`));
        } catch (e) {
          console.warn("Firebase silme hatası:", e);
        }
      }

      const profiller = profilleriGetir().filter((p) => p.id !== profil.id);
      profilleriKaydet(profiller);

      const aktif = aktifProfiliGetir();
      if (!aktif || aktif.id === profil.id) {
        if (profiller.length > 0) {
          localStorage.setItem("pw_aktif_profil", profiller[0].id);
        } else {
          localStorage.removeItem("pw_aktif_profil");
        }
      }

      profilListesiniGuncelle();
      toastGoster(`"${profil.ad}" silindi`); // Backtick kullanıldı

      const kalanProfiller = profilleriGetir();
      if (kalanProfiller.length === 0) {
        modalKapat("profilSecModal");
        modalKapat("ayarlarModal");
        ekraniGoster("baslangicEkrani");
        document.getElementById("hazirEkrani").style.display = "none";
        document.getElementById("profilOlusturKutu").style.display = "block";
      } else {
        const yeniAktif = aktifProfiliGetir();
        if (yeniAktif) {
          document.getElementById("aktifProfilAdi").textContent = yeniAktif.ad;
          document.getElementById("hosgeldinIsim").textContent = yeniAktif.ad;
        }
      }
    }
  );
}

window.yedekKoduGoster = async function () {
  const profil = aktifProfiliGetir();
  if (!profil) return;
  const gosterge = document.getElementById("yedekKodGosterge");
  gosterge.textContent = "Oluşturuluyor...";
  modalAc("yedekKodModal");
  const kod = await yedekKoduOlustur(profil);
  gosterge.textContent = kod;
};

window.profilGeriYukle = async function () {
  const kod = document.getElementById("yedekKodGiris").value.trim();
  if (!kod) {
    toastGoster("Lütfen kod girin!");
    return;
  }

// BONUS KOD KONTROLÜ
  const bonusKodSonuc = await bonusKodKontrolEt(kod);
  if (bonusKodSonuc !== null) {
    document.getElementById("yedekKodGiris").value = "";
    if (bonusKodSonuc === "gecersiz") {
      toastGoster("❌ Geçersiz veya süresi dolmuş kod!");
    } else if (bonusKodSonuc === "limit") {
      toastGoster("⚠️ Bu kodu zaten kullandın!");
    } else if (bonusKodSonuc === "oyun_suruyor") {
      toastGoster("⚠️ Oyun biterken kod kullanılamaz!");
    } else if (bonusKodSonuc === "profil_yok") {
      toastGoster("⚠️ Önce bir profil oluştur!");
    } else {
      toastGoster(`🎁 Bonus eklendi! Sonraki ${bonusKodSonuc.limit} oyununda +${bonusKodSonuc.puan} puan kazanacaksın!`);
    }
    return;
  }


  if (kod === "/pwadmin") {
    document.getElementById("yedekKodGiris").value = "";
    modalKapat("profilYukleModal");
    modalAc("adminModal");
    return;
  }
  if (kod === "/genelsifirla") {
    document.getElementById("yedekKodGiris").value = "";
    modalKapat("profilYukleModal");
    genelSifirlaBaslat();
    return;
  }

  toastGoster("Aranıyor...");
  try {
    const snap = await get(ref(veritabani, `yedekler/${kod}`));
    if (!snap.exists()) {
      toastGoster("Kod bulunamadı!");
      return;
    }
    const veri = snap.val();
    const profiller = profilleriGetir();
    const mevcutIndeks = profiller.findIndex((p) => p.id === veri.id);
    const tamVeri = {
      id: veri.id,
      ad: veri.ad,
      skorlar: veri.skorlar || [],
      gecmis: veri.gecmis || [],
      favoriler: veri.favoriler || [],
      olusturulma: veri.olusturulma,
      yedekKod: kod,
    };
    if (mevcutIndeks !== -1)
      profiller[mevcutIndeks] = { ...profiller[mevcutIndeks], ...tamVeri };
    else profiller.push(tamVeri);
    profilleriKaydet(profiller);
    localStorage.setItem("pw_aktif_profil", veri.id);
    document.getElementById("yedekKodGiris").value = "";
    modalKapat("profilYukleModal");
    toastGoster(`"${veri.ad}" yüklendi!`);
  } catch (hata) {
    toastGoster("Bağlantı hatası!");
  }
};

window.genelSifirlaBaslat = function () {
  window._sifirlaModunda = true;
  document.getElementById("adminSifreEkrani").classList.remove("gizli");
  document.getElementById("adminIcerik").classList.add("gizli");
  document.getElementById("adminSifreGiris").value = "";
  modalAc("adminModal");
};
window.kopyala = function (elVeyaId) {
  const el =
    typeof elVeyaId === "string" ? document.getElementById(elVeyaId) : elVeyaId;
  navigator.clipboard
    .writeText(el.textContent.trim())
    .then(() => toastGoster("Kopyalandı! 📋"))
    .catch(() => toastGoster("Kopyalanamadı"));
};

window.profilOlustur = profilOlustur;
window.yeniProfilEkle = yeniProfilEkle;
window.profilGeriYukle = profilGeriYukle;
window.yedekKoduGoster = yedekKoduGoster;
window.genelSifirlaBaslat = genelSifirlaBaslat;
window.kopyala = kopyala;

window.aktifProfilUiGuncelle = aktifProfilUiGuncelle;
window.profilListesiniGuncelle = profilListesiniGuncelle;


/* ========================================================================= */
/* BONUS KOD KONTROLÜ                                                        */
/* ========================================================================= */
async function bonusKodKontrolEt(girilen) {
  try {
    const snap = await get(ref(veritabani, "bonusCodes"));
    if (!snap.exists()) return null;

    const veri = snap.val();
    const simdiki = Date.now();

    // Girilen kodla eşleşen bonus kodu ara
    const eslesen = Object.entries(veri).find(
      ([_, d]) => d.kod && d.kod.toUpperCase() === girilen.toUpperCase()
    );
    if (!eslesen) return null; // Bonus kodu değil, normal yedek kodu olabilir

    const [key, bonusData] = eslesen;

    // Süresi dolmuş mu?
    if (bonusData.expireAt > 0 && simdiki > bonusData.expireAt) {
      return "gecersiz";
    }


// Oyun şu an oynanıyor mu?
    if (typeof oyunDurumu !== "undefined" && oyunDurumu.calisiyor) {
      return "oyun_suruyor";
    }


    // Aktif profil var mı?
    const profil = aktifProfiliGetir();
    if (!profil) return "profil_yok";

    // Bu profil daha önce kullandı mı?
    // Profil bazlı kontrol
    const kullanimKey = `pw_bonus_${key}_${profil.id}`;
    const kullanimSayisi = parseInt(localStorage.getItem(kullanimKey) || "0");
    if (kullanimSayisi >= bonusData.limit) {
      return "limit";
    }

    // Cihaz bazlı kontrol
    const cihazKey = `pw_bonus_${key}_cihaz_${cihazIdGetir()}`;
    const cihazKullanimSayisi = parseInt(localStorage.getItem(cihazKey) || "0");
    if (cihazKullanimSayisi >= bonusData.limit) {
      return "limit";
    }

    // Geçerli — pendingBonus olarak kaydet
    const pendingBonus = {
      key,
      puan: bonusData.puan,
      aciklama: bonusData.aciklama,
      kalanHak: bonusData.limit,
    };
    localStorage.setItem("pw_pending_bonus", JSON.stringify(pendingBonus));

    // Kullanım sayısını artır
    localStorage.setItem(kullanimKey, String(kullanimSayisi + 1));
    localStorage.setItem(cihazKey, String(cihazKullanimSayisi + 1));

    return { puan: bonusData.puan, limit: bonusData.limit };
  } catch (e) {
    console.warn("Bonus kod kontrol hatası:", e);
    return null;
  }
}

window.bonusKodKontrolEt = bonusKodKontrolEt;
