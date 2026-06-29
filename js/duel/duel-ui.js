/* ========================================================================= */
/* DÜELLO UI — Ekran geçişleri ve HTML enjeksiyonu                           */
/* ========================================================================= */

// Düello ekranlarının HTML'ini index.html'e enjekte eder
function duelloEkranlariOlustur() {
  // Zaten oluşturulduysa tekrar oluşturma
  if (document.getElementById("duelloMenuEkrani")) return;

  const ekranlar = `
    <!-- Düello Menü Ekranı -->
    <div class="ekran gizli" id="duelloMenuEkrani">
      <div class="header" style="position:absolute;top:0;left:0;right:0">
        <button class="header-buton" onclick="modalAc('ayarlarModal')" aria-label="Ayarlar">⚙️</button>
        <span class="header-baslik">PassaWord</span>
        <div class="header-sag">
          <button class="header-buton" onclick="modalAc('skorModal')" aria-label="Skor Tablosu">🏆</button>
          <button class="header-buton" onclick="modalAc('bilgiModal')" aria-label="Nasıl Oynanır">ℹ️</button>
        </div>
      </div>
      <div class="duello-menu-icerik">
        <div style="font-size:48px">⚔️</div>
        <div class="duello-baslik">DÜELLO</div>
        <div class="duello-alt-baslik">Arkadaşınla aynı soruları aynı anda çöz!</div>
        <button class="duello-buton duello-buton-birincil" onclick="duelloEkraniGoster('odaOlusturEkrani')">🏠 Oda Oluştur</button>
        <button class="duello-buton duello-buton-ikincil" onclick="duelloEkraniGoster('odaGirEkrani')">🚪 Odaya Gir</button>
        <button class="duello-buton duello-buton-geri" onclick="duellodenCik()">← Geri</button>
      </div>
    </div>

    <!-- Oda Oluştur Ekranı -->
    <div class="ekran gizli" id="odaOlusturEkrani">
      <div class="header" style="position:absolute;top:0;left:0;right:0">
        <button class="header-buton" onclick="duelloEkraniGoster('duelloMenuEkrani')" aria-label="Geri">←</button>
        <span class="header-baslik">Oda Oluştur</span>
        <div class="header-sag"></div>
      </div>
      <div class="duello-menu-icerik">
        <div style="font-size:40px">🏠</div>
        <div class="duello-baslik" style="font-size:22px">Oda Kodu Belirle</div>
        <div class="duello-alt-baslik">4-20 karakter, harf ve rakam kullanabilirsin.</div>
        <input
          class="duello-giris-alani"
          id="odaKoduGiris"
          type="text"
          placeholder="Oda kodunu yaz..."
          maxlength="20"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="none"
          spellcheck="false"
        />
        <div class="duello-hata-mesaj" id="odaOlusturHata"></div>
        <button class="duello-buton duello-buton-birincil" id="odaOlusturButon" onclick="odaOlustur()">Oluştur →</button>
        <button class="duello-buton duello-buton-geri" onclick="duelloEkraniGoster('duelloMenuEkrani')">← Geri</button>
      </div>
    </div>

    <!-- Odaya Gir Ekranı -->
    <div class="ekran gizli" id="odaGirEkrani">
      <div class="header" style="position:absolute;top:0;left:0;right:0">
        <button class="header-buton" onclick="duelloEkraniGoster('duelloMenuEkrani')" aria-label="Geri">←</button>
        <span class="header-baslik">Odaya Gir</span>
        <div class="header-sag"></div>
      </div>
      <div class="duello-menu-icerik">
        <div style="font-size:40px">🚪</div>
        <div class="duello-baslik" style="font-size:22px">Oda Kodunu Gir</div>
        <div class="duello-alt-baslik">Arkadaşının oluşturduğu oda kodunu yaz.</div>
        <input
          class="duello-giris-alani"
          id="odaKoduGirGiris"
          type="text"
          placeholder="Oda kodunu yaz..."
          maxlength="20"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="none"
          spellcheck="false"
        />
        <div class="duello-hata-mesaj" id="odaGirHata"></div>
        <button class="duello-buton duello-buton-ikincil" id="odaGirButon" onclick="odayaGir()">Gir →</button>
        <button class="duello-buton duello-buton-geri" onclick="duelloEkraniGoster('duelloMenuEkrani')">← Geri</button>
      </div>
    </div>

    <!-- Bekleme Odası Ekranı -->
    <div class="ekran gizli" id="beklemOdasiEkrani">
      <div class="header" style="position:absolute;top:0;left:0;right:0">
        <button class="header-buton" onclick="odadanCik()" aria-label="Çık">←</button>
        <span class="header-baslik">Bekleme Odası</span>
        <div class="header-sag"></div>
      </div>
      <div class="duello-menu-icerik">
        <div class="duello-oda-kutu">
          <div class="duello-oda-kodu-satir">
            <div>
              <div class="duello-oda-kodu-etiket">ODA KODU</div>
              <div class="duello-oda-kodu-deger" id="beklemOdaKodu">—</div>
            </div>
            <button class="duello-oda-kodu-kopyala" onclick="odaKodunuKopyala()">📋 Kopyala</button>
          </div>
          <div class="duello-oyuncular">
            <div class="duello-oyuncu-karti" id="hostKarti">
              <div class="duello-oyuncu-ikon">👑</div>
              <div class="duello-oyuncu-ad" id="hostAd">Bekleniyor...</div>
              <div class="duello-oyuncu-durum" id="hostDurum">⚪ Bekleniyor</div>
            </div>
            <div class="duello-oyuncu-karti" id="misafirKarti">
              <div class="duello-oyuncu-ikon">👤</div>
              <div class="duello-oyuncu-ad bos" id="misafirAd">Bekleniyor...</div>
              <div class="duello-oyuncu-durum bekliyor" id="misafirDurum">⚪ Bekleniyor</div>
            </div>
          </div>
        </div>

        <button class="duello-hazir-buton" id="hazirButon" onclick="hazirDurumunuDegistir()">
          ✅ Hazırım
        </button>

        <!-- Sadece host görür -->
        <button class="duello-baslat-buton gizli" id="oyunuBaslatButon" onclick="duelloBaslat()" disabled>
          ▶ Oyunu Başlat
        </button>

        <div class="duello-hata-mesaj" id="beklemHata"></div>
      </div>
    </div>

    <!-- Rakip Bekleniyor Ekranı (erken biten için) -->
    <div class="ekran gizli" id="rakipBekleniyorEkrani">
      <div class="duello-bekleme-icerik">
        <div class="duello-bekleme-spinner"></div>
        <div class="duello-bekleme-baslik">Rakip Bekleniyor</div>
        <div class="duello-bekleme-alt">Rakibiniz oyunu bitiriyor...<br>Sonuçlar birlikte açılacak.</div>
      </div>
    </div>

    <!-- Bağlantı Koptu Ekranı -->
    <div class="ekran gizli" id="baglantiKoptuEkrani">
      <div class="duello-bekleme-icerik">
        <div style="font-size:48px">📡</div>
        <div class="duello-bekleme-baslik">Bağlantı Kesildi</div>
        <div class="duello-bekleme-alt">Yeniden bağlanılıyor...</div>
        <div class="duello-geri-sayim" id="yenidenBaglanGeriSayim">60</div>
        <div class="duello-bekleme-alt">Süre dolmadan dönerseniz<br>oyun kaldığı yerden devam eder.</div>
      </div>
    </div>

    <!-- Düello Sonuç Ekranı -->
    <div class="ekran gizli" id="duelloSonucEkrani">
      <div class="header">
        <button class="header-buton" onclick="modalAc('ayarlarModal')" aria-label="Ayarlar">⚙️</button>
        <span class="header-baslik">PassaWord</span>
        <div class="header-sag">
          <button class="header-buton" onclick="modalAc('skorModal')" aria-label="Skor Tablosu">🏆</button>
          <button class="header-buton" onclick="modalAc('bilgiModal')" aria-label="Nasıl Oynanır">ℹ️</button>
        </div>
      </div>

      <div style="overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:12px;padding-bottom:24px">
        <!-- Sonuç başlık -->
        <div style="text-align:center;padding:16px 14px 0">
          <div id="duelloSonucBaslik" style="font-size:22px;font-weight:900;color:#fff;margin-bottom:4px">⚔️ DÜELLO BİTTİ</div>
          <div id="duelloSonucAltBaslik" style="font-size:14px;color:var(--metin-soluk)"></div>
        </div>

        <!-- Üst butonlar -->
        <div class="sonuc-butonlar" style="padding:0 14px">
          <button onclick="duelloYeniOyunIste()" style="background:linear-gradient(145deg,#7c3aed,#4f1fc7);color:#fff;box-shadow:0 4px 16px rgba(124,58,237,0.35)">
            ⚔️ Yeni Oyun
          </button>
          <button onclick="duelloAnaSayfayaGit()" style="background:rgba(255,65,255,0.47);border:1px solid rgba(255,255,255,0.12);color:#fff">
            🏠 Ana Sayfa
          </button>
        </div>

        <!-- Karşılaştırma kartları -->
        <div class="duello-sonuc-karsilastirma" id="duelloSonucKarsilastirma"></div>

        <!-- Harf harf detay listesi -->
        <div class="duello-sonuc-liste" id="duelloSonucListe"></div>

        <!-- Alt butonlar -->
        <div class="sonuc-butonlar" style="padding:0 14px">
          <button onclick="duelloYeniOyunIste()" style="background:linear-gradient(145deg,#7c3aed,#4f1fc7);color:#fff;box-shadow:0 4px 16px rgba(124,58,237,0.35)">
            ⚔️ Yeni Oyun
          </button>
          <button onclick="duelloAnaSayfayaGit()" style="background:rgba(255,65,255,0.47);border:1px solid rgba(255,255,255,0.12);color:#fff">
            🏠 Ana Sayfa
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", ekranlar);
}

// Düello ekranına geç (diğer tüm ekranları gizle)
function duelloEkraniGoster(ekranId) {
  const tumEkranlar = document.querySelectorAll(".ekran");
  tumEkranlar.forEach((e) => e.classList.add("gizli"));
  const hedef = document.getElementById(ekranId);
  if (hedef) hedef.classList.remove("gizli");
}

// Ana sayfaya dön (düellodan çık)
function duellodenCik() {
  const profil = aktifProfiliGetir();
  if (!profil) {
    ekraniGoster("baslangicEkrani");
    return;
  }
  ekraniGoster("baslangicEkrani");
  document.getElementById("profilOlusturKutu").style.display = "none";
  const hazir = document.getElementById("hazirEkrani");
  hazir.style.display = "flex";
  hazir.style.flexDirection = "column";
}

// Bekleme odası UI güncelle
function beklemOdasiUiGuncelle(odaVerisi) {
  if (!odaVerisi) return;

  document.getElementById("beklemOdaKodu").textContent =
    odaVerisi.odaKodu || "—";

  // Host
  const hostAd = document.getElementById("hostAd");
  const hostDurum = document.getElementById("hostDurum");
  const hostKarti = document.getElementById("hostKarti");
  if (odaVerisi.host) {
    hostAd.textContent = odaVerisi.host.ad || "—";
    hostAd.classList.remove("bos");
    if (odaVerisi.host.hazir) {
      hostDurum.textContent = "🟢 Hazır";
      hostDurum.className = "duello-oyuncu-durum hazir";
      hostKarti.classList.add("hazir");
    } else {
      hostDurum.textContent = "⚪ Hazır Değil";
      hostDurum.className = "duello-oyuncu-durum bekliyor";
      hostKarti.classList.remove("hazir");
    }
  }

  // Misafir
  const misafirAd = document.getElementById("misafirAd");
  const misafirDurum = document.getElementById("misafirDurum");
  const misafirKarti = document.getElementById("misafirKarti");
  if (odaVerisi.misafir) {
    misafirAd.textContent = odaVerisi.misafir.ad || "—";
    misafirAd.classList.remove("bos");
    if (odaVerisi.misafir.hazir) {
      misafirDurum.textContent = "🟢 Hazır";
      misafirDurum.className = "duello-oyuncu-durum hazir";
      misafirKarti.classList.add("hazir");
    } else {
      misafirDurum.textContent = "⚪ Hazır Değil";
      misafirDurum.className = "duello-oyuncu-durum bekliyor";
      misafirKarti.classList.remove("hazir");
    }
  } else {
    misafirAd.textContent = "Bekleniyor...";
    misafirAd.classList.add("bos");
    misafirDurum.textContent = "⚪ Bekleniyor";
    misafirDurum.className = "duello-oyuncu-durum bekliyor";
    misafirKarti.classList.remove("hazir");
  }

  // Host ise başlat butonunu göster
  const duelloDurum = window.duelloDurum || {};
  const baslatButon = document.getElementById("oyunuBaslatButon");
  const hazirButon = document.getElementById("hazirButon");

  if (duelloDurum.rolum === "host") {
    baslatButon.classList.remove("gizli");
    const ikisiDeHazir =
      odaVerisi.host?.hazir && odaVerisi.misafir?.hazir;
    baslatButon.disabled = !ikisiDeHazir;
  } else {
    baslatButon.classList.add("gizli");
  }

  // Hazır butonu kendi durumunu yansıtsın
  const benimHazirligim =
    duelloDurum.rolum === "host"
      ? odaVerisi.host?.hazir
      : odaVerisi.misafir?.hazir;
  if (benimHazirligim) {
    hazirButon.textContent = "✅ Hazırım (Geri Al)";
    hazirButon.classList.add("hazir-aktif");
  } else {
    hazirButon.textContent = "✅ Hazırım";
    hazirButon.classList.remove("hazir-aktif");
  }
}

// Oda kodunu kopyala
function odaKodunuKopyala() {
  const kod = document.getElementById("beklemOdaKodu").textContent;
  if (!kod || kod === "—") return;
  navigator.clipboard
    .writeText(kod)
    .then(() => toastGoster("Oda kodu kopyalandı!"))
    .catch(() => toastGoster("Kopyalanamadı."));
}

// Düello sonuç ekranını doldur
function duelloSonucEkraniniDoldur(sonucVerisi) {
  const { odaKodu, hostAd, misafirAd, hostSonuc, misafirSonuc, sorular } =
    sonucVerisi;

  const hostPuan = hostSonuc.puan || 0;
  const misafirPuan = misafirSonuc.puan || 0;
  const benimRolum = window.duelloDurum?.rolum || "host";

  // Başlık
  let baslik = "⚔️ DÜELLO BİTTİ";
  let altBaslik = "";
  if (hostPuan > misafirPuan) {
    altBaslik = benimRolum === "host" ? "🏆 Kazandın!" : "😞 Kaybettin.";
  } else if (misafirPuan > hostPuan) {
    altBaslik = benimRolum === "misafir" ? "🏆 Kazandın!" : "😞 Kaybettin.";
  } else {
    altBaslik = "🤝 Berabere!";
  }
  document.getElementById("duelloSonucBaslik").textContent = baslik;
  document.getElementById("duelloSonucAltBaslik").textContent = altBaslik;

  // Karşılaştırma kartları
  const karsilastirma = document.getElementById("duelloSonucKarsilastirma");
  karsilastirma.innerHTML = "";

  const kartlar = [
    {
      ad: hostAd,
      sonuc: hostSonuc,
      puan: hostPuan,
      kazanan: hostPuan >= misafirPuan,
      esit: hostPuan === misafirPuan,
    },
    {
      ad: misafirAd,
      sonuc: misafirSonuc,
      puan: misafirPuan,
      kazanan: misafirPuan >= hostPuan,
      esit: hostPuan === misafirPuan,
    },
  ];

  kartlar.forEach((k) => {
    const sinif = k.esit
      ? "duello-sonuc-kart esit"
      : k.kazanan
      ? "duello-sonuc-kart kazanan"
      : "duello-sonuc-kart kaybeden";

    const rozet = k.esit ? "🤝" : k.kazanan ? "🏆" : "💔";

    const div = document.createElement("div");
    div.className = sinif;
    div.innerHTML = `
      <div class="duello-sonuc-rozet">${rozet}</div>
      <div class="duello-sonuc-oyuncu-ad">${k.ad}</div>
      <div class="duello-sonuc-puan">${k.puan}</div>
      <div class="duello-sonuc-puan-etiket">puan</div>
      <div class="duello-sonuc-istat">
        <div class="duello-sonuc-istat-satir dogru">✅ ${k.sonuc.dogru || 0} Doğru</div>
        <div class="duello-sonuc-istat-satir yanlis">❌ ${k.sonuc.yanlis || 0} Yanlış</div>
        <div class="duello-sonuc-istat-satir pas">⏭️ ${k.sonuc.pas || 0} Pas</div>
      </div>
    `;
    karsilastirma.appendChild(div);
  });

  // Harf detay listesi
  const liste = document.getElementById("duelloSonucListe");
  liste.innerHTML = "";

  const HARFLER = window.HARFLER || [];
  HARFLER.forEach((harf) => {
    const soru = sorular?.[harf];
    if (!soru) return;

    const hostCevap = hostSonuc.cevaplar?.[harf];
    const misafirCevap = misafirSonuc.cevaplar?.[harf];

    const kalem = document.createElement("div");
    kalem.className = "duello-sonuc-kalem";

    const hostCevapMetin = hostCevap?.verilen === "Pas" || !hostCevap?.verilen
      ? "Pas"
      : hostCevap.verilen;
    const misafirCevapMetin = misafirCevap?.verilen === "Pas" || !misafirCevap?.verilen
      ? "Pas"
      : misafirCevap.verilen;

    const hostSinif = hostCevap?.dogruMu ? "dogru" : hostCevapMetin === "Pas" ? "pas" : "yanlis";
    const misafirSinif = misafirCevap?.dogruMu ? "dogru" : misafirCevapMetin === "Pas" ? "pas" : "yanlis";

    kalem.innerHTML = `
      <div class="duello-sonuc-harf">${harf}</div>
      <div class="duello-sonuc-bilgi">
        <div class="duello-sonuc-bilgi-soru">${soru.soru || ""}</div>
        <div class="duello-sonuc-bilgi-dogru">✓ ${soru.cevap || ""}</div>
        <div class="duello-sonuc-cevaplar">
          <div class="duello-sonuc-cevap-cipi">
            <div class="cevap-ad">${hostAd}</div>
            <div class="cevap-deger ${hostSinif}">${hostCevapMetin}</div>
          </div>
          <div class="duello-sonuc-cevap-cipi">
            <div class="cevap-ad">${misafirAd}</div>
            <div class="cevap-deger ${misafirSinif}">${misafirCevapMetin}</div>
          </div>
        </div>
      </div>
    `;
    liste.appendChild(kalem);
  });
}

// Yeni oyun isteği toast'ı göster (rakipten gelince)
function duelloYeniOyunIstegiGoster(istegiYapanAd, kabul, reddet) {
  const eskiToast = document.getElementById("duelloIstekToast");
  if (eskiToast) eskiToast.remove();

  const toast = document.createElement("div");
  toast.id = "duelloIstekToast";
  toast.className = "duello-istek-toast";
  toast.innerHTML = `
    <div class="duello-istek-metin">⚔️ ${istegiYapanAd} tekrar oynamak istiyor!</div>
    <div class="duello-istek-butonlar">
      <button class="duello-istek-kabul" onclick="duelloIstekKabul()">Kabul</button>
      <button class="duello-istek-reddet" onclick="duelloIstekReddet()">Reddet</button>
    </div>
  `;
  document.body.appendChild(toast);

  window._duelloIstekKabul = kabul;
  window._duelloIstekReddet = reddet;
}

window.duelloIstekKabul = function () {
  const toast = document.getElementById("duelloIstekToast");
  if (toast) toast.remove();
  if (window._duelloIstekKabul) window._duelloIstekKabul();
};

window.duelloIstekReddet = function () {
  const toast = document.getElementById("duelloIstekToast");
  if (toast) toast.remove();
  if (window._duelloIstekReddet) window._duelloIstekReddet();
};

// Sistem bildirimi göster (oda kapatıldı, vb.)
function duelloSistemBildirimiGoster(mesaj, altMesaj, butonMetin, butonFn) {
  const eskiBildirim = document.getElementById("duelloSistemBildirim");
  if (eskiBildirim) eskiBildirim.remove();

  const bildirim = document.createElement("div");
  bildirim.id = "duelloSistemBildirim";
  bildirim.className = "duello-sistem-bildirim";
  bildirim.innerHTML = `
    <div class="duello-sistem-bildirim-kutu">
      <div class="duello-sistem-bildirim-ikon">⚠️</div>
      <div class="duello-sistem-bildirim-baslik">${mesaj}</div>
      <div class="duello-sistem-bildirim-alt">${altMesaj || ""}</div>
      <button class="duello-buton duello-buton-geri" style="max-width:100%;margin-top:4px" onclick="duelloSistemBildiriminiKapat()">
        ${butonMetin || "Tamam"}
      </button>
    </div>
  `;
  document.body.appendChild(bildirim);
  window._duelloSistemBildirimFn = butonFn || null;
}

window.duelloSistemBildiriminiKapat = function () {
  const bildirim = document.getElementById("duelloSistemBildirim");
  if (bildirim) bildirim.remove();
  if (window._duelloSistemBildirimFn) window._duelloSistemBildirimFn();
};

// Geri sayım güncelle (bağlantı koptu ekranı)
function baglantiGeriSayimGuncelle(saniye) {
  const el = document.getElementById("yenidenBaglanGeriSayim");
  if (el) el.textContent = saniye;
}

// Düello ana sayfa butonu
function duelloAnaSayfayaGit() {
  if (window.duelloDurum?.odaRef) {
    odadanCik();
  } else {
    duellodenCik();
  }
}

// Global erişim için window'a bağla
window.duelloEkranlariOlustur = duelloEkranlariOlustur;
window.duelloEkraniGoster = duelloEkraniGoster;
window.duellodenCik = duellodenCik;
window.beklemOdasiUiGuncelle = beklemOdasiUiGuncelle;
window.odaKodunuKopyala = odaKodunuKopyala;
window.duelloSonucEkraniniDoldur = duelloSonucEkraniniDoldur;
window.duelloYeniOyunIstegiGoster = duelloYeniOyunIstegiGoster;
window.duelloSistemBildirimiGoster = duelloSistemBildirimiGoster;
window.baglantiGeriSayimGuncelle = baglantiGeriSayimGuncelle;
window.duelloAnaSayfayaGit = duelloAnaSayfayaGit;