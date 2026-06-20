const HARFLER = [
  "A",
  "B",
  "C",
  "Ç",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I/İ",
  "K",
  "L",
  "M",
  "N",
  "O",
  "Ö",
  "P",
  "R",
  "S",
  "Ş",
  "T",
  "U",
  "Ü",
  "V",
  "Y",
  "Z",
];
const HARF_DOSYA_ESLEME = {
  A: "a",
  B: "b",
  C: "c",
  Ç: "ch",
  D: "d",
  E: "e",
  F: "f",
  G: "g",
  H: "h",
  "I/İ": "i",
  K: "k",
  L: "l",
  M: "m",
  N: "n",
  O: "o",
  Ö: "oo",
  P: "p",
  R: "r",
  S: "s",
  Ş: "sh",
  T: "t",
  U: "u",
  Ü: "uu",
  V: "v",
  Y: "y",
  Z: "z",
};
const EMAILJS_SERVICE_ID = "service_ojr0p6q";
const EMAILJS_TEMPLATE_ID = "template_dlmjr0w";
const EMAILJS_PUBLIC_KEY = "D01aRDtRbWdqpLIjm";
const OYUN_SURESI = 360;

// Oyun durum değişkenleri (Doğru, yanlış sayıları da buraya eklendi)
let oyunDurumu = {
  harfDurumlari: {},
  harfCevaplari: {},
  yuklenenSorular: {},
  secilenSorular: {},
  mevcutHarfIndeks: 0,
  mevcutHarf: "A",
  kalanSure: OYUN_SURESI,
  zamanlayici: null,
  pasKuyrugu: [],
  pasModu: false,
  pasIndeks: 0,
  calisiyor: false,
  puan: 0,
  dogruSayisi: 0,
  yanlisSayisi: 0,
  pasSayisi: 0,
};

/* ========================================================================= */
/* JSON DOSYALARINDAN SORULARI YÜKLEME (BAŞLANGIÇ)                           */
/* ========================================================================= */
async function sorulariYukle() {
  document.getElementById("yuklemeMesaj").textContent = "Sorular yükleniyor...";
  ekraniGoster("yuklemEkrani");

  const yuklemeSozleri = HARFLER.map(async (harf) => {
    const dosyaAdi = HARF_DOSYA_ESLEME[harf];
    try {
      const yanit = await fetch(`./questions/${dosyaAdi}_questions.json`);
      if (!yanit.ok) throw new Error(`${harf} yüklenemedi`);
      const sorular = await yanit.json();

      // JSON dosyasındaki 'id' değerini kullanıyoruz.
      // Eğer eski formattaki bir dosya denk gelirse diye yedeğe (idx + 1) koyuyoruz.
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
    oyunDurumu.yuklenenSorular[harf] = sorular;
  });
  return true;
}
/* ========================================================================= */
/* JSON DOSYALARINDAN SORULARI YÜKLEME (BİTİŞ)                               */
/* ========================================================================= */

function sorulariSec() {
  oyunDurumu.secilenSorular = {};
  HARFLER.forEach((harf) => {
    const havuz = oyunDurumu.yuklenenSorular[harf] || [];
    if (havuz.length > 0) {
      const rastgeleIndeks = Math.floor(Math.random() * havuz.length);
      oyunDurumu.secilenSorular[harf] = havuz[rastgeleIndeks];
    } else {
      oyunDurumu.secilenSorular[harf] = null;
    }
  });
}

// Oyuna Başlama
window.oyunuBaslat = async function () {
  await sorulariYukle();
  sorulariSec();

  oyunDurumu.harfDurumlari = {};
  oyunDurumu.harfCevaplari = {};
  oyunDurumu.mevcutHarfIndeks = 0;
  oyunDurumu.mevcutHarf = HARFLER[0];
  oyunDurumu.kalanSure = OYUN_SURESI;
  oyunDurumu.pasKuyrugu = [];
  oyunDurumu.pasModu = false;
  oyunDurumu.pasIndeks = 0;
  oyunDurumu.calisiyor = true;
  oyunDurumu.puan = 0;
  oyunDurumu.dogruSayisi = 0;
  oyunDurumu.yanlisSayisi = 0;
  oyunDurumu.pasSayisi = 0;
  oyunDurumu.bonusUygulandı = false;

  HARFLER.forEach((h) => {
    oyunDurumu.harfDurumlari[h] = "varsayilan";
  });

  ekraniGoster("oyunEkrani");
  const input = document.getElementById("cevapGiris");
input.setAttribute("readonly", "true");
setTimeout(() => {
  input.removeAttribute("readonly");
}, 100);
  tumProfillereSilmeDinleyicisiBaslat();
  get(ref(veritabani, "ayarlar/duyurular")).then((snap) =>
    duyurulariGoster(snap)
  );
  canliIstatistikGuncelle();

  setTimeout(() => {
    klavyeDurumunuGuncelle(); // İstatistiği doğru yere koy
    daireOlustur();
    harfiAktifYap(0, true);
    zamanlayiciBaslat();
  }, 100);
};

// Daire Boyutlandırma ve Oluşturma
function daireOlculeriniHesapla() {
  const vg = window.innerWidth;
  const vy = window.visualViewport
    ? window.visualViewport.height
    : window.innerHeight;
  const bilgisayarMi = !window._dokunmatik && vg >= 1025;
  const klavyeAcikMi =
    window.visualViewport &&
    window.screen.height - window.visualViewport.height > 150;

  let mevcut;
  if (bilgisayarMi) {
    // Dairenin üstten ve alttan kesilmemesi için boşluk payını 320px'e çıkardık
    const kullanilabilir = Math.min(vg * 0.85, vy - 320);
    mevcut = Math.max(300, Math.min(kullanilabilir, 750));
  } else {
    if (klavyeAcikMi) {
      // KLAVYE AÇIK: Üst menü (Header) yok. Sadece Input ve İstatistik barı var.
      // Kalan tüm alanı daireye verebiliriz. Sadece alttan 95px boşluk bırakıyoruz.
      const kullanilabilir = Math.min(vg * 0.95, vy - 95);
      mevcut = Math.max(150, Math.min(kullanilabilir, 450));
    } else {
      // KLAVYE KAPALI: Header var, Input var.
      const kullanilabilir = Math.min(vg * 0.95, vy - 115);
      mevcut = Math.max(200, Math.min(kullanilabilir, 450));
    }
  }

  const topBoyutu = Math.round(mevcut / 12);
  return { konteynirBoyutu: mevcut, topBoyutu };
}

function daireOlustur() {
  const konteyner = document.getElementById("daireKonteyneri");
  konteyner.querySelectorAll(".harf-topu").forEach((t) => t.remove());

  const olculer = daireOlculeriniHesapla();
  const { konteynirBoyutu, topBoyutu } = olculer;

  konteyner.style.width = konteynirBoyutu + "px";
  konteyner.style.height = konteynirBoyutu + "px";

  const mx = konteynirBoyutu / 2;
  const my = konteynirBoyutu / 2;
  const yaricap = (konteynirBoyutu - topBoyutu * 1.3) / 2;
  const toplamHarf = HARFLER.length;

  HARFLER.forEach((harf, i) => {
    const aci = (2 * Math.PI * i) / toplamHarf - Math.PI / 2;
    const x = mx + yaricap * Math.cos(aci);
    const y = my + yaricap * Math.sin(aci);

    const top = document.createElement("div");
    top.className = "harf-topu durum-" + oyunDurumu.harfDurumlari[harf];
    top.id = "top-" + harf;
    top.style.width = topBoyutu + "px";
    top.style.height = topBoyutu + "px";
    top.style.left = x + "px";
    top.style.top = y + "px";
    top.style.fontSize = Math.round(topBoyutu * 0.36) + "px";
    top.textContent = harf;

    konteyner.insertBefore(top, konteyner.querySelector(".merkez-gosterge"));
  });
}

function ekraniYenile() {
  if (!document.getElementById("oyunEkrani").classList.contains("gizli")) {
    daireOlustur();
    aktifTopuIsaretle(oyunDurumu.mevcutHarf);
  }
  bilgisayarModunuAyarla();
}
window.addEventListener("resize", ekraniYenile);

// Harf Aktifleştirme
function harfiAktifYap(indeks, ilkMi = false) {
  const harf = oyunDurumu.pasModu
    ? oyunDurumu.pasKuyrugu[oyunDurumu.pasIndeks]
    : HARFLER[indeks];
  oyunDurumu.mevcutHarf = harf;
  oyunDurumu.mevcutHarfIndeks = indeks;

  const soruVerisi = oyunDurumu.secilenSorular[harf];
  document.getElementById("soruHarfi").textContent = harf;
  document.getElementById(
    "soruMetni"
  ).innerHTML = `<span id="soruHarfi">${harf}</span>: ${
    soruVerisi ? soruVerisi.soru : "(Soru bulunamadı)"
  }`;

  cevapAlaniniTemizle();
  if (!ilkMi) {
    setTimeout(() => aktifTopuIsaretle(harf, true), 30);
  } else {
    aktifTopuIsaretle(harf, false);
  }
}

function aktifTopuIsaretle(harf, animasyonlu = false) {
  HARFLER.forEach((h) => {
    const top = document.getElementById("top-" + h);
    if (!top) return;
    top.className = `harf-topu durum-${oyunDurumu.harfDurumlari[h]}`;
  });
  const aktifTop = document.getElementById("top-" + harf);
  if (aktifTop) {
    if (animasyonlu) {
      aktifTop.className = "harf-topu gecis-animasyon durum-aktif";
      setTimeout(() => {
        if (aktifTop.classList.contains("gecis-animasyon"))
          aktifTop.className = "harf-topu durum-aktif";
      }, 370);
    } else {
      aktifTop.className = "harf-topu durum-aktif";
    }
  }
}

function zamanlayiciBaslat() {
  if (oyunDurumu.zamanlayici) clearInterval(oyunDurumu.zamanlayici);
  oyunDurumu.zamanlayici = setInterval(() => {
    oyunDurumu.kalanSure--;
    sureyiGuncelle();
    if (oyunDurumu.kalanSure <= 0) oyunuBitir();
  }, 1000);
}

function sureyiGuncelle() {
  const dk = Math.floor(oyunDurumu.kalanSure / 60);
  const sn = oyunDurumu.kalanSure % 60;
  const el = document.getElementById("surGosterge");
  el.textContent = `${String(dk).padStart(2, "0")}:${String(sn).padStart(
    2,
    "0"
  )}`;
  if (oyunDurumu.kalanSure <= 30) el.classList.add("kritik");
  else el.classList.remove("kritik");
}

/* ========================================================================= */
/* CEVAP DEĞERLENDİRME & YENİ PUANLAMA MANTIĞI                               */
/* ========================================================================= */
window.cevapVer = function () {
  const bilgisayarMi = !window._dokunmatik && window.innerWidth >= 1025;
  const ham = bilgisayarMi
    ? document.getElementById("bilgisayarCevapGiris").value.trim()
    : document.getElementById("cevapGiris").value.trim();

  if (!ham) {
    pasCek();
    return;
  }

  const harf = oyunDurumu.mevcutHarf;
  const soruVerisi = oyunDurumu.secilenSorular[harf];
  const dogruCevap = soruVerisi ? soruVerisi.cevap : "";
  const alternatifler = soruVerisi ? soruVerisi.alternatifler || [] : [];

  const dogruMu = cevapKontrol(ham, dogruCevap, alternatifler);

  if (dogruMu) {
    oyunDurumu.harfDurumlari[harf] = "dogru";
    oyunDurumu.puan += 10;
    oyunDurumu.dogruSayisi++;
  } else {
    oyunDurumu.harfDurumlari[harf] = "yanlis";
    // Yanlış cevapta 5 puan düş. Math.max ile 0'ın altına inmesini engelle.
    oyunDurumu.puan = Math.max(0, oyunDurumu.puan - 5);
    oyunDurumu.yanlisSayisi++;
  }

  // Pas kuyruğunda ise pas sayısını düşür ki son istatistik doğru olsun
  if (oyunDurumu.pasModu || oyunDurumu.pasKuyrugu.includes(harf)) {
    oyunDurumu.pasSayisi = Math.max(0, oyunDurumu.pasSayisi - 1);
  }

  oyunDurumu.harfCevaplari[harf] = {
    verilen: ham,
    dogru: dogruCevap,
    soru: soruVerisi ? soruVerisi.soru : "",
    dogruMu,
  };

  canliIstatistikGuncelle();
  sonrakiSoruya();
};

window.pasCek = function () {
  const harf = oyunDurumu.mevcutHarf;
  const soruVerisi = oyunDurumu.secilenSorular[harf];

  if (!oyunDurumu.pasModu) {
    oyunDurumu.harfDurumlari[harf] = "pas";
    if (!oyunDurumu.pasKuyrugu.includes(harf)) {
      oyunDurumu.pasKuyrugu.push(harf);
      oyunDurumu.pasSayisi++;
    }
    oyunDurumu.harfCevaplari[harf] = {
      verilen: "Pas",
      dogru: soruVerisi ? soruVerisi.cevap : "",
      soru: soruVerisi ? soruVerisi.soru : "",
      dogruMu: false,
    };
  }

  canliIstatistikGuncelle();
  cevapAlaniniTemizle();
  sonrakiSoruya();
};

function cevapKontrol(verilen, dogru, alternatifler) {
  const normaliz = (s) =>
    s
      .trim()
.toLowerCase()
.replace(/ı/g, "i")
.replace(/İ/g, "i")
.replace(/I/g, "i")
.replace(/ğ/g, "g")
.replace(/Ğ/g, "g")
.replace(/ü/g, "u")
.replace(/Ü/g, "u")
.replace(/ş/g, "s")
.replace(/Ş/g, "s")
.replace(/ö/g, "o")
.replace(/Ö/g, "o")
.replace(/ç/g, "c")
.replace(/Ç/g, "c");

  const v = normaliz(verilen);
  const d = normaliz(dogru);

  // 1. Tam eşleşme
  if (v === d) return true;

  // 2. Alternatifler
  for (const alt of alternatifler) {
    if (v === normaliz(alt)) return true;
  }

  // 3. Suffix toleransı: doğru cevap bu eklerden biriyle bitiyorsa
  //    kullanıcı eki yazmadan da doğru kabul edilsin
  const ekler = [
    "lar",
    "ler",
    "lık",
    "lik",
    "luk",
    "lük",
    "lı",
    "li",
    "lu",
    "lü",
    "mak",
    "mek",
    "ma",
    "me",
    "k",
    "i",
    "ca",
    "cı",
    "ci",
    "cu",
    "çı",
  ];

  for (const ek of ekler) {
    if (d.endsWith(ek)) {
      const kok = d.slice(0, -ek.length);
      if (kok.length >= 3 && v === kok) return true;
    }
  }
  // 4. Ek çifti toleransı: li↔lik, lı↔lık, lu↔luk, lü↔lük, me↔mek, ma↔mak
  const ekCiftleri = [
    ["li", "lik"],
    ["lı", "lık"],
    ["lu", "luk"],
    ["lü", "lük"],
    ["me", "mek"],
    ["ma", "mak"],
  ];

  for (const [kisa, uzun] of ekCiftleri) {
    if (d.endsWith(kisa)) {
      const kok = d.slice(0, -kisa.length);
      if (kok.length >= 2 && v === kok + uzun) return true;
    }
    if (d.endsWith(uzun)) {
      const kok = d.slice(0, -uzun.length);
      if (kok.length >= 2 && v === kok + kisa) return true;
    }
  }
  return false;
}

function sonrakiSoruya() {
  cevapAlaniniTemizle();
  if (oyunDurumu.pasModu) {
    oyunDurumu.pasIndeks++;
    while (
      oyunDurumu.pasIndeks < oyunDurumu.pasKuyrugu.length &&
      oyunDurumu.harfDurumlari[oyunDurumu.pasKuyrugu[oyunDurumu.pasIndeks]] !==
        "pas"
    ) {
      oyunDurumu.pasIndeks++;
    }
    if (oyunDurumu.pasIndeks >= oyunDurumu.pasKuyrugu.length) {
      const kalanPaslar = oyunDurumu.pasKuyrugu.filter(
        (h) => oyunDurumu.harfDurumlari[h] === "pas"
      );
      if (kalanPaslar.length === 0) {
        oyunuBitir();
        return;
      }
      oyunDurumu.pasIndeks = 0;
      while (
        oyunDurumu.pasIndeks < oyunDurumu.pasKuyrugu.length &&
        oyunDurumu.harfDurumlari[
          oyunDurumu.pasKuyrugu[oyunDurumu.pasIndeks]
        ] !== "pas"
      ) {
        oyunDurumu.pasIndeks++;
      }
    }
    harfiAktifYap(oyunDurumu.pasIndeks);
  } else {
    oyunDurumu.mevcutHarfIndeks++;
    if (oyunDurumu.mevcutHarfIndeks >= HARFLER.length) {
      const kalanPaslar = oyunDurumu.pasKuyrugu.filter(
        (h) => oyunDurumu.harfDurumlari[h] === "pas"
      );
      if (kalanPaslar.length === 0) {
        oyunuBitir();
        return;
      }
      oyunDurumu.pasModu = true;
      oyunDurumu.pasIndeks = 0;
      harfiAktifYap(oyunDurumu.pasIndeks);
    } else {
      harfiAktifYap(oyunDurumu.mevcutHarfIndeks);
    }
  }
}

function cevapAlaniniTemizle() {
  document.getElementById("cevapGiris").value = "";
  document.getElementById("bilgisayarCevapGiris").value = "";
}

/* ========================================================================= */
/* OYUNU BİTİRME & YENİ BONUSLAR (10 Saniye, Kombo vs)                       */
/* ========================================================================= */
window.erkenBitir = function () {
  // Tuşa basılırsa oyunu bitir fonksiyonunu "true" (erken bitirildi) parametresiyle çağır
  oyunuBitir(true);
};

function oyunuBitir(erkenBitirildi = false) {
  clearInterval(oyunDurumu.zamanlayici);
  oyunDurumu.calisiyor = false;

// BONUS KOD KONTROLÜ
  const pendingBonusRaw = localStorage.getItem("pw_pending_bonus");
  let bonusKodPuan = 0;
  let bonusKodAciklama = "";
  if (pendingBonusRaw && !oyunDurumu.bonusUygulandı) {
    oyunDurumu.bonusUygulandı = true;
    try {
      const pb = JSON.parse(pendingBonusRaw);
      bonusKodPuan = pb.puan || 0;
      bonusKodAciklama = pb.aciklama || "";
      oyunDurumu.puan += bonusKodPuan;
      const kalanHak = (pb.kalanHak || 1) - 1;
      if (kalanHak > 0) {
        localStorage.setItem("pw_pending_bonus", JSON.stringify({ ...pb, kalanHak }));
      } else {
        localStorage.removeItem("pw_pending_bonus");
      }
    } catch (e) {
      localStorage.removeItem("pw_pending_bonus");
    }
  }
  let sureBonus = 0;

  // EĞER OYUN ERKEN BİTİRİLMEDİYSE SÜRE BONUSU VER (Erken bitirildiyse 0 kalır) Her 10 saniye için 1 puan
  if (!erkenBitirildi) {
    sureBonus = Math.max(0, Math.floor(oyunDurumu.kalanSure / 10));
    oyunDurumu.puan += sureBonus;
  }

  // Yeni Kombo Bonusu: 15 veya daha fazla doğru yapana ekstra puan
  let komboBonus = 0;
  if (oyunDurumu.dogruSayisi >= 15) {
    komboBonus = oyunDurumu.dogruSayisi; // Örn: 18 doğru = +18 puan
    oyunDurumu.puan += komboBonus;
  }

  gecmiseKaydet({
    tarih: new Date().toISOString(),
    puan: oyunDurumu.puan,
    dogruSayisi: oyunDurumu.dogruSayisi,
    yanlisSayisi: oyunDurumu.yanlisSayisi,
    pasSayisi: oyunDurumu.pasSayisi,
    detay: HARFLER.map((harf) => ({
      harf,
      durum: oyunDurumu.harfDurumlari[harf] || "pas",
      soru: oyunDurumu.secilenSorular[harf]?.soru || "",
      dogruCevap: oyunDurumu.secilenSorular[harf]?.cevap || "",
      verilenCevap: oyunDurumu.harfCevaplari[harf]?.verilen || "—",
    })),
  });

  // Skor kaydetme işlemine istatistikleri de gönderiyoruz
  skorkaydet(
    oyunDurumu.puan,
    oyunDurumu.dogruSayisi,
    oyunDurumu.yanlisSayisi,
    oyunDurumu.pasSayisi,
    HARFLER.map((harf) => ({
      harf,
      durum: oyunDurumu.harfDurumlari[harf] || "pas",
      soru: oyunDurumu.secilenSorular[harf]?.soru || "",
      dogruCevap: oyunDurumu.secilenSorular[harf]?.cevap || "",
      verilenCevap: oyunDurumu.harfCevaplari[harf]?.verilen || "—",
    }))
  );
  sonucEkraniniOlustur(sureBonus, komboBonus, bonusKodPuan, bonusKodAciklama);
  ekraniGoster("sonucEkrani");
  if (window.bekleyenGuncellemeyiKontrolEt) window.bekleyenGuncellemeyiKontrolEt();
}

function skorkaydet(puan, dogru, yanlis, pas, detay) {
  const profil = aktifProfiliGetir();
  if (!profil) return;

  const profiller = profilleriGetir();
  const indeks = profiller.findIndex((p) => p.id === profil.id);
  if (indeks !== -1) {
    profiller[indeks].skorlar = profiller[indeks].skorlar || [];
    profiller[indeks].skorlar.push({
      puan,
      dogru,
      yanlis,
      pas,
      tarih: new Date().toISOString(),
    });
    profiller[indeks].skorlar = profiller[indeks].skorlar
      .sort((a, b) => b.puan - a.puan)
      .slice(0, 50);
    profilleriKaydet(profiller);

    /* Yedek kodu varsa Firebase'i otomatik güncelle */
    const guncellenenProfil = profiller[indeks];
    if (guncellenenProfil.yedekKod) {
      set(ref(veritabani, `yedekler/${guncellenenProfil.yedekKod}`), {
        id: guncellenenProfil.id,
        ad: guncellenenProfil.ad,
        skorlar: guncellenenProfil.skorlar || [],
        gecmis: guncellenenProfil.gecmis || [],
        favoriler: guncellenenProfil.favoriler || [],
        olusturulma: guncellenenProfil.olusturulma,
        tarih: new Date().toISOString(),
      }).catch(console.error);
    }
  }

  const skorRef = ref(veritabani, "skorlar");
  // Veritabanına istatistikleri de yolluyoruz
  push(skorRef, {
    isim: profil.ad,
    puan,
    dogru,
    yanlis,
    pas,
    detay: detay || [],
    tarih: new Date().toISOString(),
  }).catch(console.error);
}

function sonucEkraniniOlustur(sureBonus, komboBonus, bonusKodPuan = 0, bonusKodAciklama = "") {
  const liste = document.getElementById("sonucListe");
  liste.innerHTML = "";

  HARFLER.forEach((harf) => {
    const durum = oyunDurumu.harfDurumlari[harf];
    const veri = oyunDurumu.harfCevaplari[harf] || {
      verilen: "—",
      dogru: oyunDurumu.secilenSorular[harf]?.cevap || "?",
      soru: oyunDurumu.secilenSorular[harf]?.soru || "",
    };
    const sinif =
      durum === "dogru" ? "s-dogru" : durum === "yanlis" ? "s-yanlis" : "s-pas";

    const kalem = document.createElement("div");
    kalem.className = `sonuc-kalem ${sinif}`;
    kalem.innerHTML = `
      <div class="sonuc-harf">${harf}</div>
      <div class="sonuc-bilgi">
        <div class="sonuc-soru">${veri.soru}</div>
        <div class="sonuc-verilen-cevap">${
          veri.verilen === "Pas" ? "Pas geçildi" : veri.verilen
        }</div>
        <div class="sonuc-dogru-cevap">✓ Doğru Cevap: ${veri.dogru}</div>
        <button class="hata-bildir-buton" onclick="hataBildir('${harf}', this)">⚠ Hata Bildir</button>
      </div>
    `;
    liste.appendChild(kalem);
  });

  document.getElementById("finalPuan").textContent = oyunDurumu.puan;
  document.getElementById(
    "istatDogru"
  ).textContent = `✓ ${oyunDurumu.dogruSayisi} Doğru`;
  document.getElementById(
    "istatYanlis"
  ).textContent = `✗ ${oyunDurumu.yanlisSayisi} Yanlış`;
  document.getElementById(
    "istatPas"
  ).textContent = `~ ${oyunDurumu.pasSayisi} Pas`;
  document.getElementById("istatBonus").textContent = `⏱ +${sureBonus} Bonus`;

  const komboCipi = document.getElementById("istatKombo");
  if (komboBonus > 0) {
    komboCipi.textContent = `🔥 +${komboBonus} Kombo`;
    komboCipi.classList.remove("gizli");
  } else {
    komboCipi.classList.add("gizli");
  }

const bonusCipi = document.getElementById("istatBonusKod");
  if (bonusCipi) {
    if (bonusKodPuan > 0) {
      bonusCipi.textContent = `🎁 +${bonusKodPuan} Bonus Kod`;
      bonusCipi.classList.remove("gizli");
      const aciklamaEl = document.getElementById("bonusKodAciklama");
      if (aciklamaEl && bonusKodAciklama) {
        aciklamaEl.textContent = bonusKodAciklama;
        aciklamaEl.classList.remove("gizli");
      }
    } else {
      bonusCipi.classList.add("gizli");
      const aciklamaEl = document.getElementById("bonusKodAciklama");
      if (aciklamaEl) aciklamaEl.classList.add("gizli");
    }
  }

  /* Favori butonunu güncelle */
  const profil = aktifProfiliGetir();
  const gecmis = profil?.gecmis || [];
  const sonOyun = gecmis[0];
  const favoriMi =
    sonOyun && (profil?.favoriler || []).some((f) => f.tarih === sonOyun.tarih);
  sonucFavoriButonGuncelle(favoriMi);
}

// DOM Yüklendiğinde
window.addEventListener("DOMContentLoaded", () => {
  const aktifProfilSatir = document.getElementById("aktifProfilSatir");
  let uzunBasmaZamanlayi;
  aktifProfilSatir.addEventListener("touchstart", () => {
    uzunBasmaZamanlayi = setTimeout(() => {
      const profil = aktifProfiliGetir();
      if (profil) profilSilOnay(profil);
    }, 570);
  });
  aktifProfilSatir.addEventListener("touchend", () =>
    clearTimeout(uzunBasmaZamanlayi)
  );
  aktifProfilSatir.addEventListener("touchmove", () =>
    clearTimeout(uzunBasmaZamanlayi)
  );

  window._dokunmatik = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  bilgisayarModunuAyarla();
  yatayModKontrol();
  window.addEventListener("resize", yatayModKontrol);
  window.addEventListener("orientationchange", () =>
    setTimeout(yatayModKontrol, 300)
  );

  const aktifProfil = aktifProfiliGetir();
  if (aktifProfil) {
    ekraniGoster("baslangicEkrani");
    document.getElementById("profilOlusturKutu").style.display = "none";
    const hazir = document.getElementById("hazirEkrani");
    hazir.style.display = "flex";
    hazir.style.flexDirection = "column";
    document.getElementById("hosgeldinIsim").textContent = aktifProfil.ad;
    aktifProfilUiGuncelle();
    // Silme listener'ını başlat
    tumProfillereSilmeDinleyicisiBaslat();
  } else {
    ekraniGoster("baslangicEkrani");
  }

  // Firebase migrasyonu (arka planda, sessizce)
  migrasyonYap().catch(console.warn);

  // Bakım modu ve duyuru kontrolü
  bakimModuVeDuyuruKontrol();

  genelSkorTablosunuDinle();

  // Çift dokunma engelleme
  let sonDokunma = 0;
  document.addEventListener(
    "touchend",
    (e) => {
      const simdi = Date.now();
      if (simdi - sonDokunma < 1) e.preventDefault();
      sonDokunma = simdi;
    },
    { passive: false }
  );
});

// Bilgisayar/Mobil Modu
function bilgisayarModunuAyarla() {
  const bilgisayarMi = !window._dokunmatik && window.innerWidth >= 1025;
  if (bilgisayarMi) {
    document.getElementById("bilgisayarCevapAlani").style.display = "block";
    document.querySelector(".giris-klavye-alani").style.display = "none";
  }
}

// Yatay Uyarı (Klavye açılmasından etkilenmemesi için screen değerleri kullanıldı)
function yatayModKontrol() {
  // window.innerHeight yerine cihazın fiziksel ekran oranına (screen) bakıyoruz
  const yatay = window.screen.width > window.screen.height;
  if (window._dokunmatik && yatay) {
    document.getElementById("yatayUyari").classList.remove("gizli");
  } else {
    document.getElementById("yatayUyari").classList.add("gizli");
  }
}

/* ========================================================================= */
/* KLAVYE AÇILMASI & CANLI İSTATİSTİK YER DEĞİŞİMİ (EVRENSEL KÖKTEN ÇÖZÜM)   */
/* ========================================================================= */
let maxEkranBoyutu = window.visualViewport
  ? window.visualViewport.height
  : window.innerHeight;

// Cihaz yan çevrildiğinde ekran boyutunu evrensel olarak sıfırla
window.addEventListener("orientationchange", () => {
  setTimeout(() => {
    maxEkranBoyutu = window.visualViewport
      ? window.visualViewport.height
      : window.innerHeight;
    ekraniYenile();
  }, 300);
});

function klavyeDurumunuGuncelle() {
  const oyunEkrani = document.getElementById("oyunEkrani");

  if (window.visualViewport) {
    if (window.visualViewport.height > maxEkranBoyutu) {
      maxEkranBoyutu = window.visualViewport.height;
    }

    // Android ve iOS için ortak klavye algılama mantığı
    const isKeyboardOpen = maxEkranBoyutu - window.visualViewport.height > 150;

    if (isKeyboardOpen) {
      oyunEkrani.classList.add("klavye-acik");
      // Tüm cihazlarda ekranı tam olarak kalan boşluğa sabitler (Kesilmeyi önler)
      oyunEkrani.style.height = window.visualViewport.height + "px";
    } else {
      oyunEkrani.classList.remove("klavye-acik");
      oyunEkrani.style.height = "100dvh"; // Klavye kapanınca normale dön
    }
  }
}

if (window.visualViewport) {
  let klavyeZamanlayici;
  window.visualViewport.addEventListener("resize", () => {
    if (!document.getElementById("oyunEkrani").classList.contains("gizli")) {
      clearTimeout(klavyeZamanlayici);

      // Ekran boyutunu anında güncelle (Android/iOS fark etmeksizin)
      document.getElementById("oyunEkrani").style.height =
        window.visualViewport.height + "px";

      // Tarayıcının kendi kendine sayfayı kaydırmasını (scroll) engelle
      window.scrollTo(0, 0);

      klavyeZamanlayici = setTimeout(() => {
        ekraniYenile();
        klavyeDurumunuGuncelle();
      }, 100);
    }
  });

  // Evrensel kaydırma kilidi: Oyun oynanırken ana sayfanın kaymasını kesin olarak engeller
  // (Sonuç ekranındaki liste kaydırmasını etkilemez, sadece dış çerçeveyi kilitler)
  window.addEventListener("scroll", () => {
    if (
      document.getElementById("oyunEkrani").classList.contains("klavye-acik")
    ) {
      window.scrollTo(0, 0);
    }
  });
}
// Canlı istatistik sayılarını DOM üzerinde güncelleyen fonksiyon
function canliIstatistikGuncelle() {
  document.getElementById("canliPuan").textContent = oyunDurumu.puan;
  document.getElementById("canliDogru").textContent = oyunDurumu.dogruSayisi;
  document.getElementById("canliYanlis").textContent = oyunDurumu.yanlisSayisi;
  document.getElementById("canliPas").textContent = oyunDurumu.pasSayisi;
}

/* ========================================================================= */
/* GELİŞMİŞ HATA BİLDİRİMİ (BAŞLANGIÇ)                                       */
/* ========================================================================= */
window.hataBildir = async function (harf, btn) {
  const soruVerisi = oyunDurumu.secilenSorular[harf];
  const kullaniciCevabi =
    oyunDurumu.harfCevaplari[harf]?.verilen || "Belirtilmedi";
  const profil = aktifProfiliGetir();
  const profilAdi = profil ? profil.ad : "Anonim";

  if (!soruVerisi) return;

  btn.textContent = "⏳...";
  btn.disabled = true;

  try {
    const hataBildirimRef = ref(veritabani, "hatabildirimler");
    await push(hataBildirimRef, {
      harf,
      soruId: soruVerisi.id || "Bilinmiyor", // JSON'dan gelen ID'yi veritabanına gönderiyoruz
      soru: soruVerisi.soru,
      cevap: soruVerisi.cevap,
      kullanici_cevabi: kullaniciCevabi, // Kullanıcının girdiği yanlış cevap
      profilAdi: profilAdi, // Hangi kullanıcı bildirdi?
      alternatifler: soruVerisi.alternatifler || [],
      tarih: new Date().toISOString(),
    });
    btn.textContent = "✓ Bildirildi";
    btn.style.color = "#00e676";
    btn.style.borderColor = "rgba(0,230,118,0.3)";
  } catch (hata) {
    console.error(hata);
    btn.textContent = "⚠ Hata Bildir";
    btn.disabled = false;
  }
};
/* Geçmiş oyun detayından hata bildirimi */
window.gecmisHataBildir = async function (d, btn) {
  if (btn.disabled) return;
  btn.textContent = "⏳...";
  btn.disabled = true;

  const profil = aktifProfiliGetir();
  const profilAdi = profil ? profil.ad : "Anonim";

  try {
    const hataBildirimRef = ref(veritabani, "hatabildirimler");
    await push(hataBildirimRef, {
      harf: d.harf,
      soruId: d.soruId || "Bilinmiyor",
      soru: d.soru,
      cevap: d.dogruCevap,
      kullanici_cevabi: d.verilenCevap || "Belirtilmedi",
      profilAdi: profilAdi,
      kaynak: "gecmis",
      tarih: new Date().toISOString(),
    });
    btn.textContent = "✓ Bildirildi";
    btn.style.color = "#00e676";
    btn.style.borderColor = "rgba(0,230,118,0.3)";
  } catch (hata) {
    console.error(hata);
    btn.textContent = "⚠ Hata Bildir";
    btn.disabled = false;
  }
};
/* ========================================================================= */
/* GELİŞMİŞ HATA BİLDİRİMİ (BİTİŞ)                                           */
/* ========================================================================= */

document.addEventListener("keydown", (e) => {
  if (e.repeat) return; // Çift atlamayı (basılı tutma bug'ını) engeller
  if (document.getElementById("oyunEkrani").classList.contains("gizli")) return;
  if (document.querySelector(".modal-arkaplan.acik")) return;
  const bilgisayarMi = !window._dokunmatik && window.innerWidth >= 1025;
  if (bilgisayarMi) {
    if (e.key === "Enter") {
      e.preventDefault();
      cevapVer();
    }
    if (
      e.key === " " &&
      document.activeElement !== document.getElementById("bilgisayarCevapGiris")
    ) {
      e.preventDefault();
      pasCek();
    }
  } else {
    if (e.key === "Enter") {
      e.preventDefault();
      cevapVer();
      return;
    }
  }
});
