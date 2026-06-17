/* ========================================================================= */
/* PASSAWORD NAVIGASYON MENÜSÜ                                               */
/* ========================================================================= */
window.passaWordMenuAc = function () {
  const menu = document.getElementById("passaWordMenu");
  if (!menu) return;
  const acikMi = !menu.classList.contains("gizli");
  if (acikMi) {
    menu.classList.add("gizli");
  } else {
    menu.classList.remove("gizli");
    // Dışarı tıklayınca kapat
    setTimeout(() => {
      document.addEventListener("click", function kapat(e) {
        if (!menu.contains(e.target)) {
          menu.classList.add("gizli");
          document.removeEventListener("click", kapat);
        }
      });
    }, 0);
  }
};

window.passaWordPanelSec = function (e, panel) {
  if (e && e.stopPropagation) e.stopPropagation();
  const menu = document.getElementById("passaWordMenu");
  if (menu) menu.classList.add("gizli");

  // Seçili item'ı vurgula (bir sonraki açılışta)
  ["skor", "oyuncu", "ayarlar"].forEach((p) => {
    const el = document.getElementById(
      "pwNav" + p.charAt(0).toUpperCase() + p.slice(1)
    );
    if (el)
      el.style.background =
        p === panel ? "rgba(79,195,247,0.15)" : "transparent";
  });

  if (panel === "skor") modalAc("skorModal");
  else if (panel === "oyuncu") modalAc("profilSecModal");
  else if (panel === "ayarlar") modalAc("ayarlarModal");
};

async function bakimModuVeDuyuruKontrol() {
  try {
    onValue(ref(veritabani, "ayarlar/bakimModu"), (snap) => {
      const bakimAktif = snap.exists() && snap.val() === true;
      const adminGiris = sessionStorage.getItem("pw_admin_giris") === "true";
      if (bakimAktif && !adminGiris) {
        ekraniGoster("bakimEkrani");
      } else {
        const mevcut = document.querySelector(".ekran:not(.gizli)");
        if (mevcut && mevcut.id === "bakimEkrani") {
          const aktifProfil = aktifProfiliGetir();
          ekraniGoster("baslangicEkrani");
          if (aktifProfil) {
            document.getElementById("profilOlusturKutu").style.display = "none";
            const hazir = document.getElementById("hazirEkrani");
            hazir.style.display = "flex";
            hazir.style.flexDirection = "column";
            document.getElementById("hosgeldinIsim").textContent =
              aktifProfil.ad;
            aktifProfilUiGuncelle();
          }
        }
      }
    });

    onValue(ref(veritabani, "ayarlar/duyurular"), (snap) => {
      duyurulariGoster(snap);
    });
  } catch (e) {
    console.warn("Bakım/duyuru kontrolü hatası:", e);
  }
}

function duyurulariGoster(snap) {
  const anasayfaBandi = document.getElementById("duyuruBandi");
  const anasayfaMetni = document.getElementById("duyuruMetni");
  const oyunBandi = document.getElementById("duyuruBandiOyun");
  const oyunMetni = document.getElementById("duyuruMetniOyun");

  if (!snap || !snap.exists()) {
    if (anasayfaBandi) anasayfaBandi.classList.add("gizli");
    if (oyunBandi) oyunBandi.classList.add("gizli");
    return;
  }

  const veri = snap.val();
  const simdiki = Date.now();

  const aktifDuyurular = Object.entries(veri)
    .map(([key, d]) => ({ key, ...d }))
    .filter((d) => {
      if (!d.metin) return false;
      const gorulmeKey = "pw_duyuru_" + d.key;
      const gorulme = JSON.parse(
        localStorage.getItem(gorulmeKey) || '{"sayi":0,"ilk":0}'
      );
      if (d.sureDakika > 0 && gorulme.ilk > 0) {
        const gecenDakika = (simdiki - gorulme.ilk) / 60000;
        if (gecenDakika >= d.sureDakika) return false;
      }
      if (d.maksGorunum > 0 && gorulme.sayi >= d.maksGorunum) return false;
      return true;
    })
    .sort((a, b) => (b.olusturulma || 0) - (a.olusturulma || 0));

  if (aktifDuyurular.length === 0) {
    if (anasayfaBandi) anasayfaBandi.classList.add("gizli");
    if (oyunBandi) oyunBandi.classList.add("gizli");
    return;
  }

  const metinler = aktifDuyurular.map((d) => d.metin).join(" • ");

  aktifDuyurular.forEach((d) => {
    const gorulmeKey = "pw_duyuru_" + d.key;
    const gorulme = JSON.parse(
      localStorage.getItem(gorulmeKey) || '{"sayi":0,"ilk":0}'
    );
    localStorage.setItem(
      gorulmeKey,
      JSON.stringify({
        sayi: gorulme.sayi + 1,
        ilk: gorulme.ilk || simdiki,
      })
    );
  });

  if (anasayfaBandi && anasayfaMetni) {
    anasayfaMetni.textContent = metinler;
    anasayfaBandi.classList.remove("gizli");
  }

  if (oyunBandi && oyunMetni) {
    oyunMetni.textContent = metinler;
    oyunBandi.classList.remove("gizli");
  }

  const sonucBandi = document.getElementById("duyuruBandiSonuc");
  const sonucMetni = document.getElementById("duyuruMetniSonuc");
  if (sonucBandi && sonucMetni) {
    sonucMetni.textContent = metinler;
    sonucBandi.classList.remove("gizli");
  }
}

window.adminGiris = async function () {
  const sifre = document.getElementById("adminSifreGiris").value;
  if (!sifre) {
    toastGoster("Şifre girin!");
    return;
  }
  try {
    const { signInWithEmailAndPassword } = await import(
      "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js"
    );
    await signInWithEmailAndPassword(
      kimlikDogrulama,
      "beratarsln@gmail.com",
      sifre
    );
    if (window._sifirlaModunda) {
      window._sifirlaModunda = false;
      modalKapat("adminModal");
      onayGoster(
        "⚠️ Genel Skoru Sıfırla",
        "Tüm genel skor tablosu silinecek. Emin misin?",
        async () => {
          try {
            await remove(ref(veritabani, "skorlar"));
            toastGoster("✅ Sıfırlandı!");
          } catch (hata) {
            toastGoster("❌ Başarısız!");
          }
        }
      );
    } else {
      sessionStorage.setItem("pw_admin_giris", "true");
      document.getElementById("adminSifreEkrani").classList.add("gizli");
      document.getElementById("adminIcerik").classList.remove("gizli");
      adminOneriYukle();
      // Bakım ekranındaysak çık
      const mevcutEkran = document.querySelector(".ekran:not(.gizli)");
      if (mevcutEkran && mevcutEkran.id === "bakimEkrani") {
        modalKapat("adminModal");
        ekraniGoster("baslangicEkrani");
        const aktifProfil = aktifProfiliGetir();
        if (aktifProfil) {
          document.getElementById("profilOlusturKutu").style.display = "none";
          const hazir = document.getElementById("hazirEkrani");
          hazir.style.display = "flex";
          hazir.style.flexDirection = "column";
          document.getElementById("hosgeldinIsim").textContent = aktifProfil.ad;
          aktifProfilUiGuncelle();
        }
      }
    }
  } catch (hata) {
    toastGoster("Yanlış şifre!");
  }
};

function adminOneriYukle(filtre = "soru") {
  const oneriRef = ref(veritabani, "geribildirimler");
  const liste = document.getElementById("adminOneriListe");
  const eskiSekme = document.getElementById("adminSekmeler");
  if (eskiSekme) eskiSekme.remove();

  const sekmeDiv = document.createElement("div");
  sekmeDiv.id = "adminSekmeler";
  sekmeDiv.style.cssText =
    "display:flex;gap:8px;padding:0 16px 12px;flex-wrap:wrap;";
  [
    ["soru", "❓ Öneriler", "#1976d2"],
    ["sikayet", "⚠️ Şikayetler", "#d62828"],
    ["hata", "🔴 Oyun İçi Hatalar", "#e65100"],
    ["passaword", "🎮 PassaWord", "#0d47a1"],
    ["duzenle", "✏️ Soru Düzenle", "#7b1fa2"],
  ].forEach(([f, etiket, renk]) => {
    const btn = document.createElement("button");
    btn.textContent = etiket;
    btn.style.cssText = `
          padding:7px 14px;
          border-radius:8px;
          border:none;
          cursor: pointer;
          font-weight:700;
          font-size:13px;
          background:${filtre === f ? renk : "rgba(255,255,255,0.08)"};color:${
      filtre === f ? "#fff" : "#8899bb"
    };`;
    btn.onclick = () => adminOneriYukle(f);
    sekmeDiv.appendChild(btn);
  });
  liste.before(sekmeDiv);

  if (filtre === "duzenle") {
    adminSoruDuzenleGoster();
    return;
  }

  if (filtre === "passaword") {
    adminPassaWordPanelGoster();
    return;
  }

  if (filtre === "hata") {
    liste.innerHTML = "";
    const hataRef = ref(veritabani, "hatabildirimler");
    onValue(
      hataRef,
      (anlık) => {
        const veri = anlık.val();
        liste.innerHTML = "";
        if (!veri) {
          liste.innerHTML = `<div style="text-align:center;
                color:var(--metin-soluk);
                padding:24px;
                font-size:14px;">Hata bildirimi yok.</div>`;
          return;
        }
        Object.entries(veri)
          .sort((a, b) => new Date(b[1].tarih) - new Date(a[1].tarih))
          .forEach(([key, hata]) => {
            const jsonMetin = JSON.stringify(
              {
                soru: hata.soru,
                cevap: hata.cevap,
                alternatifler: hata.alternatifler || [],
              },
              null,
              2
            );
            const kart = document.createElement("div");
            kart.className = "admin-oneri-kart";
            kart.dataset.key = key;

            // Dosya Sırası yerine "Soru ID" yazdırıyoruz
            kart.innerHTML = `
          <span style="
          font-size:11px;
          padding:2px 8px;
          border-radius:10px;
          font-weight:700; 
          background:rgba(230,81,0,0.15);color:#ff6d00;">🔴 Oyun İçi Hata Bildirimi</span>
          <div style="font-size:13px;font-weight:700;color:#fff;margin-top:8px;">${
            hata.harf
          } Harfi (Soru ID: ${hata.soruId})</div>
          <div class="admin-oneri-soru" style="margin-top:4px;">📝 ${
            hata.soru
          }</div>
          <div style="font-size:13px;color:#4fc3f7;margin-top:4px;">✅ Sistem Cevabı: <b>${
            hata.cevap
          }</b></div>
          <div style="font-size:13px;color:#ff1744;margin-top:4px;">❌ Kullanıcı Cevabı: <b>${
            hata.kullanici_cevabi
          }</b></div>
          <div class="admin-oneri-meta" style="margin-top:6px;">👤 Bildiren: ${
            hata.profilAdi
          } &nbsp;•&nbsp; 📅 ${new Date(hata.tarih).toLocaleDateString(
              "tr-TR"
            )} ${new Date(hata.tarih).toLocaleTimeString("tr-TR", {
              hour: "2-digit",
              minute: "2-digit",
            })}</div>
          <div class="admin-buton-grubu" style="margin-top:10px;">
            <button class="admin-onayla" style="background:linear-gradient(145deg,#1976d2,#0d47a1);" 
            onclick="adminJsonKopyala(this,'${btoa(
              unescape(encodeURIComponent(jsonMetin))
            )}')">📋 JSON Kopyala</button>
            <button class="admin-reddet" onclick="hataOneriReddet('${key}',this)">🗑 Sil</button>
          </div>
        `;
            liste.appendChild(kart);
          });
      },
      { onlyOnce: true }
    );
  } else {
    onValue(
      oneriRef,
      (anlık) => {
        const veri = anlık.val();
        liste.innerHTML = "";
        if (!veri) {
          liste.innerHTML = `<div style="text-align:center;color:var(--metin-soluk);
                padding:24px;font-size:14px;">Hiç kayıt yok.</div>`;
          return;
        }
        const girdiler = Object.entries(veri).filter(([_, v]) => {
          if (filtre === "soru") return v.altTur && v.altTur.includes("Soru");
          if (filtre === "sikayet")
            return v.kategori && v.kategori.includes("Şikayet");
          return true;
        });
        if (girdiler.length === 0) {
          liste.innerHTML = `<div style="text-align:center;color:var(--metin-soluk);padding:24px;font-size:14px;">Kayıt yok.</div>`;
          return;
        }
        girdiler
          .sort((a, b) => new Date(b[1].tarih) - new Date(a[1].tarih))
          .forEach(([key, oneri]) => {
            const soruOneriMi = oneri.altTur && oneri.altTur.includes("Soru");
            const jsonMetin = soruOneriMi
              ? JSON.stringify(
                  {
                    soru: oneri.mesaj,
                    cevap: oneri.cevap || "",
                    alternatifler: oneri.alternatifler
                      ? oneri.alternatifler
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                      : [],
                  },
                  null,
                  2
                )
              : null;
            const kart = document.createElement("div");
            kart.className = "admin-oneri-kart";
            kart.dataset.key = key;
            kart.innerHTML = `
          <span style="font-size:11px;padding:2px 8px;border-radius:10px;font-weight:700; background:${
            soruOneriMi ? "rgba(0,200,83,0.15)" : "rgba(255,23,68,0.15)"
          }; color:${soruOneriMi ? "#00c853" : "#ff1744"};">${
              oneri.altTur || oneri.kategori || "?"
            }</span>
          <div class="admin-oneri-soru" style="margin-top:8px;">📝 ${
            oneri.mesaj
          }</div>
          ${
            soruOneriMi && oneri.cevap
              ? `<div style="font-size:13px;color:#4fc3f7;margin-top:4px;">✅ Cevap: <b>${oneri.cevap}</b></div>`
              : ""
          }
          <div class="admin-oneri-meta" style="margin-top:6px;">👤 ${
            oneri.profilAdi
          } &nbsp;•&nbsp; 📅 ${new Date(oneri.tarih).toLocaleDateString(
              "tr-TR"
            )} ${new Date(oneri.tarih).toLocaleTimeString("tr-TR", {
              hour: "2-digit",
              minute: "2-digit",
            })}</div>
          <div class="admin-buton-grubu" style="margin-top:10px;">
            ${
              soruOneriMi
                ? `<button class="admin-onayla" style="background:linear-gradient(145deg,#1976d2,#0d47a1);" 
                onclick="adminJsonKopyala(this,'${btoa(
                  unescape(encodeURIComponent(jsonMetin))
                )}')">📋 JSON Kopyala</button>`
                : ""
            }
            <button class="admin-reddet" onclick="adminOneriReddet('${key}',this)">🗑 Sil</button>
          </div>
        `;
            liste.appendChild(kart);
          });
      },
      { onlyOnce: true }
    );
  }
}

window.adminOneriReddet = function (key, btn) {
  if (btn) {
    btn.textContent = "⏳...";
    btn.disabled = true;
  }
  remove(ref(veritabani, `geribildirimler/${key}`))
    .then(() => {
      toastGoster("✅ Silindi");
      document.querySelector(`.admin-oneri-kart[data-key="${key}"]`)?.remove();
    })
    .catch(() => toastGoster("❌ Silinemedi!"));
};
window.hataOneriReddet = function (key, btn) {
  if (btn) {
    btn.textContent = "⏳...";
    btn.disabled = true;
  }
  remove(ref(veritabani, `hatabildirimler/${key}`))
    .then(() => {
      toastGoster("✅ Silindi");
      document.querySelector(`.admin-oneri-kart[data-key="${key}"]`)?.remove();
    })
    .catch(() => toastGoster("❌ Silinemedi!"));
};
window.adminJsonKopyala = function (btn, b64) {
  navigator.clipboard
    .writeText(decodeURIComponent(escape(atob(b64))))
    .then(() => {
      const orijinal = btn.textContent;
      btn.textContent = "✅ Kopyalandı!";
      setTimeout(() => (btn.textContent = orijinal), 2000);
    });
};

/* ========================================================================= */
/* ADMİN PASSAWORD PANELİ (BAŞLANGIÇ)                                       */
/* ========================================================================= */
/* ---- Yardımcı: bölüm başlığı oluştur ---- */
function _pwBaslik(emoji, baslik, renk) {
  return `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;cursor:pointer;"
          onclick="_pwToggle(this)">
          <div style="font-size:13px;font-weight:800;color:${renk};letter-spacing:0.5px;">
            ${emoji} ${baslik}
          </div>
          <span style="color:${renk};font-size:16px;transition:transform .2s;" class="pw-toggle-ok">▼</span>
        </div>`;
}

function _pwToggle(baslikEl) {
  const govde = baslikEl.nextElementSibling;
  const ok = baslikEl.querySelector(".pw-toggle-ok");
  const kapali = govde.style.display === "none";
  govde.style.display = kapali ? "" : "none";
  ok.style.transform = kapali ? "" : "rotate(-90deg)";
}

function adminPassaWordPanelGoster() {
  const liste = document.getElementById("adminOneriListe");
  liste.innerHTML = `
<div style="display:flex;flex-direction:column;gap:0;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:14px;overflow:hidden;margin-bottom:14px;">
  <div onclick="pwSekmeGec('skor',this)" id="pwSekmeBtn_skor"
    style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.05);color:#fff;font-size:15px;font-weight:600;">
    <span>🏆 Genel Skor Tablosu</span><span>›</span>
  </div>
  <div onclick="pwSekmeGec('oyuncu',this)" id="pwSekmeBtn_oyuncu"
    style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.05);color:#fff;font-size:15px;font-weight:600;">
    <span>👤 Oyuncu Yönetimi</span><span>›</span>
  </div>
  <div onclick="pwSekmeGec('ayarlar',this)" id="pwSekmeBtn_ayarlar"
    style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;cursor:pointer;color:#fff;font-size:15px;font-weight:600;">
    <span>⚙️ Oyun Ayarları</span><span>›</span>
  </div>
</div>

<!-- SKOR PANELİ -->
<div id="pwPanel_skor">
  <div style="font-size:12px;font-weight:700;color:var(--metin-soluk);margin-bottom:6px;letter-spacing:.4px;">MEVCUT SIRALAMA</div>
<button onclick="pwSiralamayiGor()" style="width:100%;background:rgba(79,195,247,0.1);border:1px solid rgba(79,195,247,0.3);border-radius:8px;color:#4fc3f7;font-size:14px;font-weight:700;padding:10px;cursor:pointer;margin-bottom:10px;">
  📊 Sıralamayı Gör
</button>
<div id="pwSkorListe" style="margin-bottom:10px;display:none;"></div>
  <div style="font-size:12px;font-weight:700;color:var(--metin-soluk);margin:10px 0 6px;letter-spacing:.4px;">ELLE KAYIT EKLE</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px;">
    <input id="pwEkleIsim" class="giris-alani" placeholder="İsim" style="font-size:13px;padding:9px 10px;text-align:left;">
    <input id="pwEklePuan" class="giris-alani" type="number" placeholder="Puan" style="font-size:13px;padding:9px 10px;text-align:left;">
    <input id="pwEkleDogru" class="giris-alani" type="number" placeholder="Doğru" style="font-size:13px;padding:9px 10px;text-align:left;">
    <input id="pwEkleYanlis" class="giris-alani" type="number" placeholder="Yanlış" style="font-size:13px;padding:9px 10px;text-align:left;">
    <input id="pwEklePas" class="giris-alani" type="number" placeholder="Pas" style="font-size:13px;padding:9px 10px;text-align:left;">
  </div>
  <button onclick="pwSkorEkle()" style="width:100%;background:linear-gradient(145deg,#1976d2,#0d47a1);border:none;border-radius:8px;color:#fff;font-size:14px;font-weight:700;padding:10px;cursor:pointer;margin-bottom:8px;">
    ➕ Skoru Ekle
  </button>
  <button onclick="pwSkorTablosuSifirlaOnay()" style="width:100%;background:rgba(255,23,68,0.12);border:1px solid rgba(255,23,68,0.3);border-radius:8px;color:#ff4444;font-size:13px;font-weight:700;padding:10px;cursor:pointer;">
    ⚠️ Skor Tablosunu Sıfırla
  </button>
</div>

<!-- OYUNCU PANELİ -->
<div id="pwPanel_oyuncu" style="display:none;">
  <div style="font-size:12px;font-weight:700;color:var(--metin-soluk);margin-bottom:6px;letter-spacing:.4px;">YEDEK KODU İLE OYUNCU ARA</div>
  <div style="display:flex;gap:6px;margin-bottom:8px;">
    <input id="pwOyuncuKodAra" class="giris-alani" placeholder="PW-XXXXX" style="flex:1;font-size:13px;padding:9px 10px;text-align:left;">
    <button onclick="pwOyuncuAra()" style="background:rgba(206,147,216,0.2);border:1px solid rgba(206,147,216,0.35);border-radius:8px;color:#ce93d8;font-size:13px;font-weight:700;padding:9px 14px;cursor:pointer;white-space:nowrap;">
      🔍 Ara
    </button>
  </div>
  <div id="pwOyuncuSonuc"></div>

  <div style="font-size:12px;font-weight:700;color:var(--metin-soluk);margin:10px 0 6px;">
  ♻️ PROFİL KURTAR
  </div>
  
  <div style="margin-bottom:10px;">
  <input
    id="pwProfilKurtarKod"
    class="giris-alani"
    placeholder="PW-XXXXX"
    style="
      width:100%;
      text-align:left;
      margin-bottom:8px;
    "
  >

  <button
    onclick="pwProfilKurtar()"
    class="gonder-buton"
    style="width:100%;"
  >
    Geri Getir
  </button>
</div>

  <div style="font-size:12px;font-weight:700;color:var(--metin-soluk);margin:10px 0 6px;letter-spacing:.4px;">TÜM KAYITLI PROFİLLER</div>
  <button onclick="pwTumOyunculariYukle()" style="width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#fff;font-size:13px;font-weight:700;padding:9px;cursor:pointer;margin-bottom:8px;">
    📋 Profilleri Listele
  </button>
  <div id="pwOyuncuListe"></div>
  
</div>

<!-- AYARLAR PANELİ -->
<div id="pwPanel_ayarlar" style="display:none;">
  <div style="font-size:12px;font-weight:700;color:var(--metin-soluk);margin-bottom:6px;letter-spacing:.4px;">YENİ DUYURU EKLE</div>
  <input id="pwDuyuruMetin" class="giris-alani" placeholder="Duyuru metni" style="font-size:13px;padding:9px 10px;text-align:left;margin-bottom:6px;">
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px;">
    <input id="pwDuyuruSure" class="giris-alani" type="number" placeholder="Süre (0=sonsuz)" style="font-size:12px;padding:8px 10px;text-align:left;" min="0">
    <select id="pwDuyuruSureBirim" class="giris-alani" style="font-size:12px;padding:8px 10px;background:#111827;color:#fff;border:1.5px solid rgba(255,255,255,0.15);border-radius:12px;">
      <option value="dakika">Dakika</option>
      <option value="saat">Saat</option>
      <option value="gun" selected>Gün</option>
    </select>
    <input id="pwDuyuruMaksGorunum" class="giris-alani" type="number" placeholder="Maks görüntüleme (0=sonsuz)" style="font-size:12px;padding:8px 10px;text-align:left;" min="0">
  </div>
  <button onclick="pwDuyuruEkle()" style="width:100%;background:linear-gradient(145deg,#2e7d32,#1b5e20);border:none;border-radius:8px;color:#fff;font-size:13px;font-weight:700;padding:9px;cursor:pointer;margin-bottom:10px;">➕ Duyuru Ekle</button>
  <div style="font-size:12px;font-weight:700;color:var(--metin-soluk);margin-bottom:6px;letter-spacing:.4px;">MEVCUT DUYURULAR</div>
  <div id="pwDuyuruListe" style="margin-bottom:10px;">
    <div style="color:var(--metin-soluk);font-size:13px;text-align:center;padding:8px;">Yükleniyor...</div>
  </div>
  <div style="font-size:12px;font-weight:700;color:var(--metin-soluk);margin-bottom:6px;letter-spacing:.4px;">BAKIM MODU</div>
  <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.04);border-radius:10px;padding:10px 14px;margin-bottom:10px;">
    <div>
      <div style="font-size:13px;font-weight:700;color:#fff;">Bakım Modu</div>
      <div id="pwBakimDurum" style="font-size:11px;color:var(--metin-soluk);margin-top:2px;">Yükleniyor...</div>
    </div>
    <button id="pwBakimBtn" onclick="pwBakimToggle()" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:#fff;font-size:13px;font-weight:700;padding:7px 14px;cursor:pointer;">⏳</button>
  </div>
  
  <div style="font-size:12px;font-weight:700;color:var(--metin-soluk);margin-bottom:6px;letter-spacing:.4px;">🎁 BONUS KOD EKLE</div>
  <input id="pwBonusKod" class="giris-alani" placeholder="KOD (ÖRN: BERAT)" style="font-size:13px;padding:9px 10px;text-align:left;margin-bottom:6px;">
  <input id="pwBonusPuan" class="giris-alani" type="number" placeholder="Bonus puan miktarı" style="font-size:13px;padding:9px 10px;text-align:left;margin-bottom:6px;">
  <input id="pwBonusAciklama" class="giris-alani" placeholder="Açıklama (sonuç ekranında görünür)" style="font-size:13px;padding:9px 10px;text-align:left;margin-bottom:6px;">
  <input id="pwBonusLimit" class="giris-alani" type="number" placeholder="Profil başına kullanım limiti" style="font-size:13px;padding:9px 10px;text-align:left;margin-bottom:6px;">
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px;">
    <input id="pwBonusSure" class="giris-alani" type="number" placeholder="Süre (0=sonsuz)" style="font-size:12px;padding:8px 10px;text-align:left;" min="0">
    <select id="pwBonusSureBirim" class="giris-alani" style="font-size:12px;padding:8px 10px;background:#111827;color:#fff;border:1.5px solid rgba(255,255,255,0.15);border-radius:12px;">
      <option value="dakika">Dakika</option>
      <option value="saat">Saat</option>
      <option value="gun" selected>Gün</option>
    </select>
  </div>
  <button onclick="pwBonusKodEkle()" style="width:100%;background:linear-gradient(145deg,#e65100,#bf360c);border:none;border-radius:8px;color:#fff;font-size:14px;font-weight:700;padding:10px;cursor:pointer;margin-bottom:10px;">➕ Kodu Ekle</button>
  <div style="font-size:12px;font-weight:700;color:var(--metin-soluk);margin-bottom:6px;letter-spacing:.4px;">AKTİF BONUS KODLAR</div>
  <div id="pwBonusListe"></div>
</div>
`;

  window.pwSekmeGec = function (sekme, btn) {
    ["skor", "oyuncu", "ayarlar"].forEach((s) => {
      document.getElementById("pwPanel_" + s).style.display =
        s === sekme ? "block" : "none";
      const b = document.getElementById("pwSekmeBtn_" + s);
      if (b) {
        b.style.background =
          s === sekme ? "rgba(255,255,255,0.11)" : "transparent";
        b.style.color = s === sekme ? "#fff" : "var(--metin-soluk)";
      }
    });
    if (sekme === "skor") pwSkorListesiYukle();
    if (sekme === "ayarlar") {
  pwBakimDurumKontrol();
  pwDuyuruListesiYukle();
  pwBonusListesiYukle();
}
  };

  /* Sıralamayı yükle */
  setTimeout(
    () => pwSekmeGec("ayarlar", document.getElementById("pwSekmeBtn_ayarlar")),
    0
  );
  /* Bakım modunu kontrol et */
  pwBakimDurumKontrol();
  /* Mevcut duyuruyu  listesi getir */
  pwDuyuruListesiYukle();
}
/* ========================================================================= */
/* ADMİN PASSAWORD PANELİ (BİTİŞ)                                           */
/* ========================================================================= */

window.pwSiralamayiGor = function () {
  const modal = document.createElement("div");
  modal.id = "pwSiralamaModal";
  modal.style.cssText =
    "position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(5px);z-index:200;display:flex;align-items:flex-end;justify-content:center;";
  modal.innerHTML = `
    <div style="background:linear-gradient(170deg,#111827,#0d1530);border:1px solid rgba(255,255,255,0.09);border-radius:20px 20px 0 0;width:100%;max-width:560px;max-height:88dvh;overflow-y:auto;padding:0 0 24px;position:relative;">
      <div style="width:40px;height:4px;background:rgba(255,255,255,0.18);border-radius:2px;margin:12px auto 18px;"></div>
<button onclick="document.getElementById('pwSiralamaModal').remove()" style="position:absolute;top:14px;right:14px;width:32px;height:32px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:50%;color:rgba(255,255,255,0.6);font-size:16px;display:flex;align-items:center;justify-content:center;cursor:pointer;">✕</button>
<div style="font-size:18px;font-weight:800;text-align:center;margin-bottom:16px;color:#fff;">🏆 SIRALAMA (TOP 50)</div>
      <div id="pwSiralamaListe" style="padding:0 16px;">
        <div style="text-align:center;color:var(--metin-soluk);padding:24px;">Yükleniyor...</div>
      </div>
      <div style="padding:0 16px;margin-top:12px;">
        <button onclick="document.getElementById('pwSiralamaModal').remove()" style="width:100%;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:12px;color:#fff;font-size:15px;font-weight:700;padding:14px;cursor:pointer;">Kapat</button>
      </div>
    </div>
  `;
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });
  document.body.appendChild(modal);

  const sorgu = query(
    ref(veritabani, "skorlar"),
    orderByChild("puan"),
    limitToLast(50)
  );
  get(sorgu).then((anlık) => {
    const veri = anlık.val();
    const liste = document.getElementById("pwSiralamaListe");
    if (!veri) {
      liste.innerHTML = `<div style="text-align:center;color:var(--metin-soluk);padding:24px;">Kayıt yok.</div>`;
      return;
    }
    const dizisi = Object.entries(veri)
      .map(([k, v]) => ({ _key: k, ...v }))
      .sort((a, b) => b.puan - a.puan);
    liste.innerHTML = "";
    dizisi.forEach((s, i) => {
      const tarih = s.tarih
        ? new Date(s.tarih).toLocaleDateString("tr-TR")
        : "—";
      const satir = document.createElement("div");
      satir.style.cssText =
        "display:flex;align-items:center;gap:8px;padding:9px 10px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);margin-bottom:6px;";
      satir.innerHTML = `
        <div style="min-width:24px;font-size:13px;font-weight:800;color:${
          i < 3 ? "#ffd600" : "var(--metin-soluk)"
        };">${i + 1}</div>
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:700;color:#fff;">${
            s.isim || "?"
          }</div>
          <div style="font-size:11px;color:var(--metin-soluk);margin-top:1px;">${tarih} &nbsp;<span style="color:#00e676;">✓${
        s.dogru || 0
      }</span> <span style="color:#ff1744;">✗${
        s.yanlis || 0
      }</span> <span style="color:#ffd600;">~${s.pas || 0}</span></div>
        </div>
        <div style="font-size:15px;font-weight:800;color:#4fc3f7;">${
          s.puan
        }</div>
        <button onclick="pwSkorSil('${
          s._key
        }',this)" style="background:rgba(255,23,68,0.15);border:1px solid rgba(255,23,68,0.3);border-radius:6px;color:#ff6b6b;font-size:11px;font-weight:700;padding:4px 8px;cursor:pointer;">🗑</button>
      `;
      liste.appendChild(satir);
    });
  });
};

/* ========================================================================= */
/* ADMİN PASSAWORD - SKOR YÖNETİMİ                                          */
/* ========================================================================= */
function pwSkorListesiYukle() {
  const konteyner = document.getElementById("pwSkorListe");
  if (!konteyner) return;
  const sorgu = query(
    ref(veritabani, "skorlar"),
    orderByChild("puan"),
    limitToLast(50)
  );
  get(sorgu)
    .then((anlık) => {
      const veri = anlık.val();
      if (!veri) {
        konteyner.innerHTML = `<div style="color:var(--metin-soluk);font-size:13px;text-align:center;padding:8px;">Kayıt yok.</div>`;
        return;
      }
      const dizisi = Object.entries(veri)
        .map(([k, v]) => ({ _key: k, ...v }))
        .sort((a, b) => b.puan - a.puan);

      konteyner.innerHTML = "";
      dizisi.forEach((s, i) => {
        const tarih = s.tarih
          ? new Date(s.tarih).toLocaleDateString("tr-TR")
          : "—";
        const satir = document.createElement("div");
        satir.style.cssText =
          "display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:8px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);margin-bottom:5px;";
        satir.innerHTML = `
              <div style="min-width:22px;font-size:12px;font-weight:800;color:${
                i < 3 ? "#ffd600" : "var(--metin-soluk)"
              };">${i + 1}</div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${
                  s.isim || "?"
                }</div>
                <div style="font-size:11px;color:var(--metin-soluk);margin-top:1px;">
                  ${tarih} &nbsp;
                  <span style="color:#00e676;">✓${s.dogru || 0}</span>
                  <span style="color:#ff1744;"> ✗${s.yanlis || 0}</span>
                  <span style="color:#ffd600;"> ~${s.pas || 0}</span>
                </div>
              </div>
              <div style="font-size:14px;font-weight:800;color:#4fc3f7;margin-right:4px;">${
                s.puan
              }</div>
              <button onclick="pwSkorSil('${
                s._key
              }',this)" style="background:rgba(255,23,68,0.15);border:1px solid rgba(255,23,68,0.3);border-radius:6px;color:#ff6b6b;font-size:11px;font-weight:700;padding:4px 8px;cursor:pointer;white-space:nowrap;">🗑</button>
            `;
        konteyner.appendChild(satir);
      });
    })
    .catch(() => {
      if (konteyner)
        konteyner.innerHTML = `<div style="color:#ff6b6b;font-size:13px;">Yüklenemedi.</div>`;
    });
}

window.pwSkorSil = function (key, btn) {
  if (!confirm("Bu skoru silmek istediğine emin misin?")) return;
  btn.textContent = "⏳";
  btn.disabled = true;
  remove(ref(veritabani, `skorlar/${key}`))
    .then(() => {
      btn.closest("div[style]").remove();
      toastGoster("✅ Skor silindi");
    })
    .catch(() => {
      toastGoster("❌ Silinemedi!");
      btn.textContent = "🗑";
      btn.disabled = false;
    });
};

window.pwSkorEkle = function () {
  const isim = document.getElementById("pwEkleIsim")?.value.trim();
  const puan = parseInt(document.getElementById("pwEklePuan")?.value) || 0;
  const dogru = parseInt(document.getElementById("pwEkleDogru")?.value) || 0;
  const yanlis = parseInt(document.getElementById("pwEkleYanlis")?.value) || 0;
  const pas = parseInt(document.getElementById("pwEklePas")?.value) || 0;

  if (!isim) {
    toastGoster("⚠️ İsim boş olamaz!");
    return;
  }
  if (puan < 0) {
    toastGoster("⚠️ Puan 0 veya üzeri olmalı!");
    return;
  }

  push(ref(veritabani, "skorlar"), {
    isim,
    puan,
    dogru,
    yanlis,
    pas,
    tarih: new Date().toISOString(),
  })
    .then(() => {
      toastGoster("✅ Skor eklendi!");
      [
        "pwEkleIsim",
        "pwEklePuan",
        "pwEkleDogru",
        "pwEkleYanlis",
        "pwEklePas",
      ].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
      pwSkorListesiYukle();
    })
    .catch(() => toastGoster("❌ Eklenemedi!"));
};

window.pwSkorTablosuSifirlaOnay = function () {
  if (
    !confirm(
      "TÜM genel skor tablosu silinecek! Bu geri alınamaz. Devam edilsin mi?"
    )
  )
    return;
  if (!confirm("Son kez onaylıyor musun? Tüm skorlar kalıcı silinecek."))
    return;
  remove(ref(veritabani, "skorlar"))
    .then(() => {
      toastGoster("✅ Skor tablosu sıfırlandı");
      pwSkorListesiYukle();
    })
    .catch(() => toastGoster("❌ Sıfırlanamadı!"));
};

/* ========================================================================= */
/* ADMİN PASSAWORD - OYUNCU YÖNETİMİ                                        */
/* ========================================================================= */
window.pwOyuncuAra = async function () {
  const kod = document
    .getElementById("pwOyuncuKodAra")
    ?.value.trim()
    .toUpperCase();
  const sonuc = document.getElementById("pwOyuncuSonuc");
  if (!sonuc) return;
  if (!kod) {
    toastGoster("⚠️ Kod boş olamaz!");
    return;
  }

  sonuc.innerHTML = `<div style="color:var(--metin-soluk);font-size:13px;">Aranıyor...</div>`;
  try {
    const snap = await get(ref(veritabani, `yedekler/${kod}`));
    if (!snap.exists()) {
      sonuc.innerHTML = `<div style="color:#ff6b6b;font-size:13px;padding:8px 0;">Bu koda ait profil bulunamadı.</div>`;
      return;
    }
    const p = snap.val();
    sonuc.innerHTML = pwOyuncuKartHtml(kod, p);
  } catch (e) {
    sonuc.innerHTML = `<div style="color:#ff6b6b;font-size:13px;">Hata oluştu.</div>`;
  }
};

window.pwTumOyunculariYukle = async function () {
  const konteyner = document.getElementById("pwOyuncuListe");
  if (!konteyner) return;
  konteyner.innerHTML = `<div style="color:var(--metin-soluk);font-size:13px;text-align:center;padding:8px;">Yükleniyor...</div>`;
  try {
    const snap = await get(ref(veritabani, "yedekler"));
    if (!snap.exists()) {
      konteyner.innerHTML = `<div style="color:var(--metin-soluk);font-size:13px;text-align:center;padding:8px;">Kayıtlı profil yok.</div>`;
      return;
    }
    const veri = snap.val();
    konteyner.innerHTML = "";
    Object.entries(veri)
      .sort((a, b) => new Date(b[1].tarih || 0) - new Date(a[1].tarih || 0))
      .forEach(([kod, p]) => {
        const div = document.createElement("div");
        div.style.marginBottom = "8px";
        div.innerHTML = pwOyuncuKartHtml(kod, p);
        konteyner.appendChild(div);
      });
  } catch (e) {
    konteyner.innerHTML = `<div style="color:#ff6b6b;font-size:13px;">Hata oluştu.</div>`;
  }
};

function pwOyuncuKartHtml(kod, p) {
  const tarih = p.tarih ? new Date(p.tarih).toLocaleDateString("tr-TR") : "—";
  const skorSayisi = (p.skorlar || []).length;
  const gecmisSayisi = (p.gecmis || []).length;
  const enYuksek =
    skorSayisi > 0 ? Math.max(...(p.skorlar || []).map((s) => s.puan)) : 0;
  return `
          <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(206,147,216,0.2);border-radius:10px;padding:10px 12px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
              <div>
                <div style="font-size:14px;font-weight:800;color:#fff;">${
                  p.ad || "?"
                }</div>
                <div style="font-size:11px;color:var(--metin-soluk);margin-top:1px;">🔑 ${kod} &nbsp;•&nbsp; 📅 ${tarih}</div>
              </div>
              <button onclick="pwOyuncuSil('${kod}',this)" style="background:rgba(255,23,68,0.15);border:1px solid rgba(255,23,68,0.3);border-radius:6px;color:#ff6b6b;font-size:11px;font-weight:700;padding:5px 10px;cursor:pointer;">🗑 Sil</button>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <span style="background:rgba(79,195,247,0.1);border-radius:6px;padding:3px 8px;font-size:11px;color:#4fc3f7;">🏆 En yüksek: ${enYuksek}</span>
              <span style="background:rgba(255,255,255,0.06);border-radius:6px;padding:3px 8px;font-size:11px;color:var(--metin-soluk);">🎮 ${skorSayisi} skor</span>
              <span style="background:rgba(255,255,255,0.06);border-radius:6px;padding:3px 8px;font-size:11px;color:var(--metin-soluk);">📋 ${gecmisSayisi} geçmiş</span>
            </div>
          </div>`;
}

window.pwOyuncuSil = async function (kod, btn) {
  if (!confirm(`"${kod}" kodlu profil silinecek. Emin misin?`)) return;

  btn.textContent = "⏳";
  btn.disabled = true;

  try {
    const snap = await get(ref(veritabani, `yedekler/${kod}`));

    if (snap.exists()) {
      await set(ref(veritabani, `silinenProfiller/${kod}`), snap.val());
    }

    await remove(ref(veritabani, `yedekler/${kod}`));

    toastGoster("✅ Profil silindi");
    pwTumOyunculariYukle();
  } catch (e) {
    toastGoster("❌ Silinemedi!");
    btn.textContent = "🗑 Sil";
    btn.disabled = false;
  }
};

/* ========================================================================= */
/* ADMİN PASSAWORD - OYUN AYARLARI                                           */
/* ========================================================================= */

/* ========================================================================= */
/* DUYURU YÖNETİMİ — Çoklu, süre birimli                                    */
/* ========================================================================= */

window.pwDuyuruEkle = async function () {
  const metin = document.getElementById("pwDuyuruMetin")?.value.trim();
  if (!metin) {
    toastGoster("Duyuru metni girin!");
    return;
  }
  const sure = parseInt(document.getElementById("pwDuyuruSure")?.value) || 0;
  const birim = document.getElementById("pwDuyuruSureBirim")?.value || "gun";
  const maks =
    parseInt(document.getElementById("pwDuyuruMaksGorunum")?.value) || 0;

  let sureDakika = 0;
  if (sure > 0) {
    if (birim === "dakika") sureDakika = sure;
    else if (birim === "saat") sureDakika = sure * 60;
    else if (birim === "gun") sureDakika = sure * 60 * 24;
  }

  try {
    const yeniRef = push(ref(veritabani, "ayarlar/duyurular"));
    await set(yeniRef, {
      metin,
      sureDakika,
      maksGorunum: maks,
      olusturulma: Date.now(),
    });
    toastGoster("✅ Duyuru eklendi!");
    document.getElementById("pwDuyuruMetin").value = "";
    document.getElementById("pwDuyuruSure").value = "";
    document.getElementById("pwDuyuruMaksGorunum").value = "";
    pwDuyuruListesiYukle();
  } catch (e) {
    toastGoster("❌ Eklenemedi!");
  }
};

window.pwDuyuruSil = async function (key) {
  try {
    await remove(ref(veritabani, `ayarlar/duyurular/${key}`));
    toastGoster("✅ Duyuru silindi");
    pwDuyuruListesiYukle();
  } catch (e) {
    toastGoster("❌ Silinemedi!");
  }
};

function pwDuyuruListesiYukle() {
  const konteyner = document.getElementById("pwDuyuruListe");
  if (!konteyner) return;
  get(ref(veritabani, "ayarlar/duyurular"))
    .then((snap) => {
      if (!snap.exists()) {
        konteyner.innerHTML = `<div style="color:var(--metin-soluk);font-size:13px;text-align:center;padding:8px;">Duyuru yok.</div>`;
        return;
      }
      const veri = snap.val();
      konteyner.innerHTML = "";
      Object.entries(veri)
        .sort((a, b) => (b[1].olusturulma || 0) - (a[1].olusturulma || 0))
        .forEach(([key, d]) => {
          let sureYazi = "Sonsuz";
          if (d.sureDakika > 0) {
            if (d.sureDakika < 60) sureYazi = `${d.sureDakika} dakika`;
            else if (d.sureDakika < 1440)
              sureYazi = `${Math.round(d.sureDakika / 60)} saat`;
            else sureYazi = `${Math.round(d.sureDakika / 1440)} gün`;
          }
          const div = document.createElement("div");
          div.style.cssText =
            "background:rgba(255,255,255,0.04);border:1px solid rgba(255,214,0,0.2);border-radius:8px;padding:9px 12px;margin-bottom:6px;display:flex;align-items:flex-start;gap:8px;";
          div.innerHTML = `
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:700;color:#ffd600;word-break:break-word;">${
              d.metin
            }</div>
            <div style="font-size:11px;color:var(--metin-soluk);margin-top:3px;">⏱ ${sureYazi} &nbsp;•&nbsp; 👁 Maks: ${
            d.maksGorunum || "Sonsuz"
          }</div>
          </div>
          <button onclick="pwDuyuruSil('${key}')" style="background:rgba(255,23,68,0.15);border:1px solid rgba(255,23,68,0.3);border-radius:6px;color:#ff6b6b;font-size:11px;font-weight:700;padding:4px 8px;cursor:pointer;white-space:nowrap;flex-shrink:0;">🗑</button>
        `;
          konteyner.appendChild(div);
        });
    })
    .catch(() => {
      const konteyner = document.getElementById("pwDuyuruListe");
      if (konteyner)
        konteyner.innerHTML = `<div style="color:#ff6b6b;font-size:13px;">Yüklenemedi.</div>`;
    });
}

async function pwBakimDurumKontrol() {
  try {
    const snap = await get(ref(veritabani, "ayarlar/bakimModu"));
    const aktif = snap.exists() && snap.val() === true;
    _pwBakimUiGuncelle(aktif);
  } catch (e) {}
}

function _pwBakimUiGuncelle(aktif) {
  const durum = document.getElementById("pwBakimDurum");
  const btn = document.getElementById("pwBakimBtn");
  if (durum)
    durum.textContent = aktif
      ? "🔴 Aktif — Oyunculara giriş kapalı"
      : "🟢 Kapalı — Oyun açık";
  if (btn) {
    btn.textContent = aktif ? "🟢 Kapat" : "🔴 Aç";
    btn.style.background = aktif
      ? "rgba(0,200,83,0.15)"
      : "rgba(255,23,68,0.15)";
    btn.style.borderColor = aktif
      ? "rgba(0,200,83,0.35)"
      : "rgba(255,23,68,0.35)";
    btn.style.color = aktif ? "#00c853" : "#ff4444";
  }
}

window.pwBakimToggle = async function () {
  const btn = document.getElementById("pwBakimBtn");
  if (btn) {
    btn.textContent = "⏳";
    btn.disabled = true;
  }
  try {
    const snap = await get(ref(veritabani, "ayarlar/bakimModu"));
    const simdiki = snap.exists() && snap.val() === true;
    await set(ref(veritabani, "ayarlar/bakimModu"), !simdiki);
    _pwBakimUiGuncelle(!simdiki);
    toastGoster(!simdiki ? "🔴 Bakım modu açıldı" : "🟢 Bakım modu kapatıldı");
  } catch (e) {
    toastGoster("❌ Değiştirilemedi!");
  } finally {
    if (btn) btn.disabled = false;
  }
};

/* ========================================================================= */
/* ADMİN SORU DÜZENLEME (BAŞLANGIÇ)                                          */
/* ========================================================================= */
window._adminSoruData = null;

function adminSoruDuzenleGoster() {
  const liste = document.getElementById("adminOneriListe");
  liste.innerHTML = `
  <div style="display:flex;gap:8px;margin:0 0 12px;background:rgba(255,255,255,0.05);border-radius:10px;padding:3px;">
    <button id="adminDuzenleSekme" onclick="adminDuzenleSekmeGec('duzenle')"
      style="flex:1;height:36px;border-radius:8px;border:none;background:rgba(255,255,255,0.11);color:#fff;font-size:14px;font-weight:700;cursor:pointer;">
      ✏️ Düzenle
    </button>
    <button id="adminEkleSekme" onclick="adminDuzenleSekmeGec('ekle')"
      style="flex:1;height:36px;border-radius:8px;border:none;background:transparent;color:var(--metin-soluk);font-size:14px;font-weight:700;cursor:pointer;">
      ➕ Ekle
    </button>
  </div>

  <div id="adminDuzenlePanel">
    <div class="form-grup">
      <span class="form-etiket">Harf Seç</span>
      <select id="adminHarfSec" class="giris-alani" style="text-align:left;cursor:pointer;appearance:auto;-webkit-appearance:auto;">
        ${HARFLER.map((h) => `<option value="${h}">${h}</option>`).join("")}
      </select>
    </div>
    <div class="form-grup">
      <span class="form-etiket">Soru ID</span>
      <input type="number" id="adminSoruIdGiris" class="giris-alani"
        placeholder="Hata bildirimindeki ID..." 
        style="text-align:left;" autocomplete="off" />
    </div>
    <button class="gonder-buton" onclick="adminSoruYukle()">🔍 Soruları Getir</button>
    
    <button onclick="adminSorulariDuzelt()" style="width:100%;margin-top:8px;background:linear-gradient(145deg,#7b1fa2,#4a0072);
  border:none;border-radius:8px;color:#fff;font-size:14px;font-weight:700;padding:11px;cursor:pointer;">
  🔧 Soruları Düzelt
</button>
<div id="adminDuzeltSonuc" style="margin-top:10px;font-size:13px;color:var(--metin-soluk);"></div>
  </div>

  <div id="adminEklePanel" style="display:none;">
    <div class="form-grup">
      <span class="form-etiket">Harf Seç</span>
      <select id="adminEkleHarfSec" class="giris-alani" style="text-align:left;cursor:pointer;appearance:auto;-webkit-appearance:auto;">
        ${HARFLER.map((h) => `<option value="${h}">${h}</option>`).join("")}
      </select>
    </div>
    <textarea id="adminSoruEkleMetin" style="width:100%;background:#111827;border:1.5px solid rgba(255,255,255,0.12);
      border-radius:8px;color:#fff;font-size:13px;padding:10px 12px;outline:none;
      font-family:inherit;resize:vertical;min-height:160px;display:block;margin-bottom:10px;"
      placeholder="s: Türkiye'nin başkenti&#10;c: Ankara&#10;a: ankara, ANKARA&#10;&#10;s: ...&#10;c: ...&#10;a: ..."></textarea>
    <button onclick="adminSoruEkle()" style="width:100%;background:linear-gradient(145deg,#00c853,#007b33);
      border:none;border-radius:8px;color:#fff;font-size:14px;font-weight:700;padding:11px;cursor:pointer;">
      ➕ Soruları Ekle
    </button>
    <div id="adminEkleSonuc" style="margin-top:10px;font-size:13px;color:var(--metin-soluk);"></div>
  </div>

  <div id="adminSoruListesi" style="margin-top:4px;"></div>
`;
}

function adminSoruKartRender(kart, soru, index) {
  const hedefId = window._adminSoruData ? window._adminSoruData.hedefId : -1;
  const aktifMi = soru.id === hedefId;
  if (aktifMi) kart.style.borderColor = "rgba(79,195,247,0.45)";
  else kart.style.borderColor = "";
  kart.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span style="font-size:12px;font-weight:700;color:${
              aktifMi ? "#4fc3f7" : "var(--metin-soluk)"
            };">
              ${aktifMi ? "🎯 " : ""}ID: ${soru.id}
            </span>
            <button onclick="adminSoruDuzenleAc(${index})"
              style="background:rgba(79,195,247,0.15);border:1px solid rgba(79,195,247,0.3);
              border-radius:8px;color:#4fc3f7;font-size:13px;font-weight:700;
              padding:6px 12px;cursor:pointer;">✏️ Düzenle</button>
          </div>
          <div style="font-size:14px;font-weight:600;color:#fff;margin-bottom:4px;">📝 ${
            soru.soru
          }</div>
          <div style="font-size:13px;color:#4fc3f7;">✅ ${soru.cevap}</div>
          ${
            soru.alternatifler && soru.alternatifler.length > 0
              ? `<div style="font-size:12px;color:var(--metin-soluk);margin-top:3px;">📎 ${soru.alternatifler.join(
                  ", "
                )}</div>`
              : ""
          }
        `;
}

window.adminSoruYukle = async function () {
  const harfEl = document.getElementById("adminHarfSec");
  const idEl = document.getElementById("adminSoruIdGiris");
  if (!harfEl || !idEl) return;

  const harf = harfEl.value;
  const hedefId = parseInt(idEl.value);
  if (!hedefId || hedefId < 1) {
    toastGoster("Geçerli bir ID girin!");
    return;
  }

  const listesi = document.getElementById("adminSoruListesi");
  listesi.innerHTML = `<div style="text-align:center;color:var(--metin-soluk);padding:24px;font-size:14px;">⏳ Yükleniyor...</div>`;

  const dosyaAdi = HARF_DOSYA_ESLEME[harf];
  const apiUrl = `https://api.github.com/repos/berat-arsln/PassaWord/contents/questions/${dosyaAdi}_questions.json`;

  try {
    const tokenSnap = await get(ref(veritabani, "config/githubToken"));
    const token = tokenSnap.val();
    if (!token) {
      listesi.innerHTML = `<div style="text-align:center;color:#ff1744;padding:16px;font-size:14px;">❌ Firebase'de token bulunamadı!</div>`;
      return;
    }

    // SHA için API çağrısı
    const apiYanit = await fetch(apiUrl, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    if (!apiYanit.ok) throw new Error(`GitHub API hatası: ${apiYanit.status}`);
    const dosyaVeri = await apiYanit.json();
    const sha = dosyaVeri.sha;

    // İçerik için raw URL (public repo, auth yok, CORS çalışır)
    const rawUrl = `https://raw.githubusercontent.com/berat-arsln/PassaWord/main/questions/${dosyaAdi}_questions.json`;
    const rawYanit = await fetch(rawUrl + "?t=" + Date.now());
    if (!rawYanit.ok) throw new Error(`Dosya okunamadı: ${rawYanit.status}`);
    const icerik = await rawYanit.json();

    const hedefIndex = icerik.findIndex((s) => (s.id || 0) === hedefId);
    const baslangic = Math.max(0, hedefIndex - 5);
    const bitis = Math.min(icerik.length - 1, hedefIndex + 5);

    window._adminSoruData = {
      tumSorular: icerik,
      sha,
      harf,
      dosyaAdi,
      hedefId,
    };

    listesi.innerHTML = "";
    for (let i = baslangic; i <= bitis; i++) {
      const kart = document.createElement("div");
      kart.className = "admin-oneri-kart";
      kart.id = `adminSoruKart_${i}`;
      adminSoruKartRender(kart, icerik[i], i);
      listesi.appendChild(kart);
    }
  } catch (hata) {
    console.error(hata);
    listesi.innerHTML = `<div style="text-align:center;color:#ff1744;padding:24px;font-size:14px;">❌ ${hata.message}</div>`;
  }
};

window.adminSoruDuzenleAc = function (index) {
  if (!window._adminSoruData) return;
  const soru = window._adminSoruData.tumSorular[index];
  const kart = document.getElementById(`adminSoruKart_${index}`);
  if (!kart) return;
  kart.innerHTML = `
          <div style="font-size:12px;font-weight:700;color:var(--metin-soluk);margin-bottom:10px;">✏️ ID: ${
            soru.id
          } düzenleniyor</div>
          <span class="form-etiket">Soru</span>
          <textarea id="duzenle_soru_${index}" style="width:100%;background:#111827;border:1.5px solid rgba(255,255,255,0.12);
            border-radius:8px;color:#fff;font-size:14px;padding:10px 12px;margin-bottom:8px;
            outline:none;font-family:inherit;resize:vertical;min-height:70px;display:block;">${
              soru.soru
            }</textarea>
          <span class="form-etiket">Cevap</span>
          <input type="text" id="duzenle_cevap_${index}" autocomplete="off"
            style="width:100%;background:#111827;border:1.5px solid rgba(255,255,255,0.12);
            border-radius:8px;color:#fff;font-size:14px;padding:10px 12px;margin-bottom:8px;outline:none;display:block;"
            value="${soru.cevap}" />
          <span class="form-etiket">Alternatifler (virgülle ayır)</span>
          <input type="text" id="duzenle_alt_${index}" autocomplete="off"
            style="width:100%;background:#111827;border:1.5px solid rgba(255,255,255,0.12);
            border-radius:8px;color:#fff;font-size:14px;padding:10px 12px;margin-bottom:10px;outline:none;display:block;"
            value="${
              soru.alternatifler ? soru.alternatifler.join(", ") : ""
            }" />
          <div class="admin-buton-grubu">
            <button id="adminKaydetBtn_${index}" onclick="adminSoruKaydet(${index})"
              style="flex:1;background:linear-gradient(145deg,#00c853,#007b33);border:none;
              border-radius:8px;color:#fff;font-size:13px;font-weight:700;padding:10px;cursor:pointer;">💾 Kaydet</button>
            <button onclick="adminSoruDuzenleIptal(${index})"
              style="flex:1;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
              border-radius:8px;color:#888;font-size:13px;font-weight:700;padding:10px;cursor:pointer;">✕ İptal</button>
          </div>
          <button id="adminSilBtn_${index}" onclick="adminSoruSilOnay(${index})"
            style="width:100%;margin-top:8px;background:linear-gradient(145deg,#c62828,#7f0000);border:none;
            border-radius:8px;color:#fff;font-size:13px;font-weight:700;padding:10px;cursor:pointer;">🗑️ Bu Soruyu Sil</button>
        `;
};

window.adminSoruDuzenleIptal = function (index) {
  if (!window._adminSoruData) return;
  const kart = document.getElementById(`adminSoruKart_${index}`);
  if (!kart) return;
  adminSoruKartRender(kart, window._adminSoruData.tumSorular[index], index);
};

window.adminSoruKaydet = async function (index) {
  if (!window._adminSoruData) return;

  const yeniSoru = document
    .getElementById(`duzenle_soru_${index}`)
    ?.value.trim();
  const yeniCevap = document
    .getElementById(`duzenle_cevap_${index}`)
    ?.value.trim();
  const yeniAltRaw = document
    .getElementById(`duzenle_alt_${index}`)
    ?.value.trim();

  if (!yeniSoru || !yeniCevap) {
    toastGoster("Soru ve cevap boş olamaz!");
    return;
  }

  const yeniAlternatifler = yeniAltRaw
    ? yeniAltRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const kaydetBtn = document.getElementById(`adminKaydetBtn_${index}`);
  if (kaydetBtn) {
    kaydetBtn.textContent = "⏳ Kaydediliyor...";
    kaydetBtn.disabled = true;
  }

  try {
    const tokenSnap = await get(ref(veritabani, "config/githubToken"));
    const token = tokenSnap.val();
    if (!token) {
      toastGoster("❌ Token bulunamadı!");
      return;
    }

    const { tumSorular, sha, dosyaAdi } = window._adminSoruData;
    tumSorular[index] = {
      ...tumSorular[index],
      soru: yeniSoru,
      cevap: yeniCevap,
      alternatifler: yeniAlternatifler,
    };

    const apiUrl = `https://api.github.com/repos/berat-arsln/PassaWord/contents/questions/${dosyaAdi}_questions.json`;
    const yeniIcerikB64 = btoa(
      unescape(encodeURIComponent(JSON.stringify(tumSorular, null, 2)))
    );

    const yanit = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Admin: ID ${tumSorular[index].id} güncellendi`,
        content: yeniIcerikB64,
        sha,
      }),
    });

    if (!yanit.ok) {
      const err = await yanit.json();
      throw new Error(err.message || `GitHub API: ${yanit.status}`);
    }

    const sonucVeri = await yanit.json();
    window._adminSoruData.sha = sonucVeri.content.sha;

    toastGoster("✅ Soru GitHub'a kaydedildi!");
    const kart = document.getElementById(`adminSoruKart_${index}`);
    adminSoruKartRender(kart, tumSorular[index], index);
  } catch (hata) {
    console.error(hata);
    toastGoster("❌ Kaydetme hatası: " + hata.message);
    if (kaydetBtn) {
      kaydetBtn.textContent = "💾 Kaydet";
      kaydetBtn.disabled = false;
    }
  }
};

window.adminSoruSil = async function (index) {
  if (!window._adminSoruData) return;
  const soru = window._adminSoruData.tumSorular[index];

  const silBtn = document.getElementById(`adminSilBtn_${index}`);
  if (silBtn) {
    silBtn.textContent = "⏳ Siliniyor...";
    silBtn.disabled = true;
  }

  try {
    const tokenSnap = await get(ref(veritabani, "config/githubToken"));
    const token = tokenSnap.val();
    if (!token) {
      toastGoster("❌ Token bulunamadı!");
      return;
    }

    const { tumSorular, sha, dosyaAdi } = window._adminSoruData;
    const yeniListe = tumSorular.filter((_, i) => i !== index);

    const apiUrl = `https://api.github.com/repos/berat-arsln/PassaWord/contents/questions/${dosyaAdi}_questions.json`;
    const yeniIcerikB64 = btoa(
      unescape(encodeURIComponent(JSON.stringify(yeniListe, null, 2)))
    );

    const yanit = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Admin: ID ${soru.id} silindi`,
        content: yeniIcerikB64,
        sha,
      }),
    });

    if (!yanit.ok) {
      const err = await yanit.json();
      throw new Error(err.message || `GitHub API: ${yanit.status}`);
    }

    const sonucVeri = await yanit.json();
    window._adminSoruData.sha = sonucVeri.content.sha;
    window._adminSoruData.tumSorular = yeniListe;

    toastGoster("✅ Soru silindi!");
    const kart = document.getElementById(`adminSoruKart_${index}`);
    if (kart) kart.remove();
  } catch (hata) {
    console.error(hata);
    toastGoster("❌ Silme hatası: " + hata.message);
    if (silBtn) {
      silBtn.textContent = "🗑️ Bu Soruyu Sil";
      silBtn.disabled = false;
    }
  }
};

window.adminSoruSilOnay = function (index) {
  if (!window._adminSoruData) return;
  const soru = window._adminSoruData.tumSorular[index];
  onayGoster(
    "Soruyu Sil",
    `ID ${soru.id} numaralı soru silinecek: "${soru.soru.slice(0, 60)}"`,
    () => adminSoruSil(index)
  );
};

window.adminSoruEkle = async function () {
  const harf = document.getElementById("adminEkleHarfSec").value;
  const metin = document.getElementById("adminSoruEkleMetin").value.trim();
  const sonuc = document.getElementById("adminEkleSonuc");

  if (!metin) {
    toastGoster("Metin girin!");
    return;
  }

  // Blokları böl
  const bloklar = metin
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  const yeniSorular = [];

  for (const blok of bloklar) {
    const satirlar = blok
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    let s = "",
      c = "",
      a = [];
    for (const satir of satirlar) {
      if (satir.startsWith("s:")) s = satir.slice(2).trim();
      else if (satir.startsWith("c:")) c = satir.slice(2).trim();
      else if (satir.startsWith("a:"))
        a = satir
          .slice(2)
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
    }
    if (!s || !c) {
      sonuc.textContent = "❌ Hatalı format: " + blok.slice(0, 30);
      return;
    }
    yeniSorular.push({ soru: s, cevap: c, alternatifler: a });
  }

  sonuc.textContent = "⏳ Yükleniyor...";

  try {
    const tokenSnap = await get(ref(veritabani, "config/githubToken"));
    const token = tokenSnap.val();
    if (!token) {
      sonuc.textContent = "❌ Token bulunamadı!";
      return;
    }

    const dosyaAdi = HARF_DOSYA_ESLEME[harf];
    const apiUrl = `https://api.github.com/repos/berat-arsln/PassaWord/contents/questions/${dosyaAdi}_questions.json`;

    const apiYanit = await fetch(apiUrl, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    const dosyaVeri = await apiYanit.json();
    const sha = dosyaVeri.sha;

    const rawUrl = `https://raw.githubusercontent.com/berat-arsln/PassaWord/main/questions/${dosyaAdi}_questions.json?t=${Date.now()}`;
    const rawYanit = await fetch(rawUrl);
    const mevcutSorular = await rawYanit.json();

    const maxId = mevcutSorular.reduce((max, s) => Math.max(max, s.id || 0), 0);
    const eklenecekler = yeniSorular.map((s, i) => ({
      id: maxId + i + 1,
      ...s,
    }));
    const yeniListe = [...mevcutSorular, ...eklenecekler];

    const yeniIcerikB64 = btoa(
      unescape(encodeURIComponent(JSON.stringify(yeniListe, null, 2)))
    );

    const yanit = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Admin: ${harf} harfine ${eklenecekler.length} soru eklendi`,
        content: yeniIcerikB64,
        sha,
      }),
    });

    if (!yanit.ok) throw new Error("GitHub hatası");

    sonuc.textContent = `✅ ${eklenecekler.length} soru eklendi! (ID: ${
      maxId + 1
    } - ${maxId + eklenecekler.length})`;
    document.getElementById("adminSoruEkleMetin").value = "";
  } catch (hata) {
    sonuc.textContent = "❌ Hata: " + hata.message;
  }
};

window.adminSorulariDuzelt = async function () {
  const harf = document.getElementById("adminHarfSec").value;
  const sonuc = document.getElementById("adminDuzeltSonuc");
  sonuc.textContent = "⏳ Yükleniyor...";

  try {
    const tokenSnap = await get(ref(veritabani, "config/githubToken"));
    const token = tokenSnap.val();
    if (!token) {
      sonuc.textContent = "❌ Token bulunamadı!";
      return;
    }

    const dosyaAdi = HARF_DOSYA_ESLEME[harf];
    const apiUrl = `https://api.github.com/repos/berat-arsln/PassaWord/contents/questions/${dosyaAdi}_questions.json`;

    const apiYanit = await fetch(apiUrl, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    const dosyaVeri = await apiYanit.json();
    const sha = dosyaVeri.sha;

    const rawUrl = `https://raw.githubusercontent.com/berat-arsln/PassaWord/main/questions/${dosyaAdi}_questions.json?t=${Date.now()}`;
    const rawYanit = await fetch(rawUrl);
    const sorular = await rawYanit.json();

    // Alfabetik sırala
    const sirali = [...sorular].sort((a, b) =>
      a.cevap.localeCompare(b.cevap, "tr", { sensitivity: "base" })
    );

    // ID'leri yeniden ver
    const duzeltilmis = sirali.map((s, i) => ({ ...s, id: i + 1 }));

    const yeniIcerikB64 = btoa(
      unescape(encodeURIComponent(JSON.stringify(duzeltilmis, null, 2)))
    );

    const yanit = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Admin: ${harf} harfi düzeltildi (${duzeltilmis.length} soru)`,
        content: yeniIcerikB64,
        sha,
      }),
    });

    if (!yanit.ok) throw new Error("GitHub hatası");

    sonuc.textContent = `✅ ${harf} harfi düzeltildi! ${duzeltilmis.length} soru alfabetik sıralandı ve ID'ler 1'den başlatıldı.`;
  } catch (hata) {
    sonuc.textContent = "❌ Hata: " + hata.message;
  }
};

window.adminDuzenleSekmeGec = function (sekme) {
  document.getElementById("adminDuzenlePanel").style.display =
    sekme === "duzenle" ? "block" : "none";
  document.getElementById("adminEklePanel").style.display =
    sekme === "ekle" ? "block" : "none";
  document.getElementById("adminDuzenleSekme").style.background =
    sekme === "duzenle" ? "rgba(255,255,255,0.11)" : "transparent";
  document.getElementById("adminDuzenleSekme").style.color =
    sekme === "duzenle" ? "#fff" : "var(--metin-soluk)";
  document.getElementById("adminEkleSekme").style.background =
    sekme === "ekle" ? "rgba(255,255,255,0.11)" : "transparent";
  document.getElementById("adminEkleSekme").style.color =
    sekme === "ekle" ? "#fff" : "var(--metin-soluk)";
};

// Bakım modundaki admin giriş kontrolü
window.adminGirisKontrol = function () {
  document.getElementById("adminSifreEkrani").classList.remove("gizli");
  document.getElementById("adminIcerik").classList.add("gizli");
  document.getElementById("adminSifreGiris").value = "";
  document.getElementById("adminModal").classList.add("acik");
};

window.profilGeriGetirAdmin = async function () {
  const kod = document
    .getElementById("profilKurtarmaKodu")
    .value.trim()
    .toUpperCase();

  if (!kod) {
    toastGoster("Kod girin!");
    return;
  }

  try {
    const kaynakRef = ref(veritabani, `silinenProfiller/${kod}`);
    const snap = await get(kaynakRef);

    if (!snap.exists()) {
      toastGoster("Silinen profil bulunamadı!");
      return;
    }

    await set(ref(veritabani, `yedekler/${kod}`), snap.val());

    await remove(kaynakRef);

    toastGoster("✅ Profil geri getirildi!");
    document.getElementById("profilKurtarmaKodu").value = "";
  } catch (e) {
    console.error(e);
    toastGoster("❌ İşlem başarısız!");
  }
};

window.pwProfilKurtar = async function () {
  const kod = document
    .getElementById("pwProfilKurtarKod")
    .value.trim()
    .toUpperCase();

  if (!kod) {
    toastGoster("Kod girin!");
    return;
  }

  try {
    const kaynakRef = ref(veritabani, `silinenProfiller/${kod}`);
    const snap = await get(kaynakRef);

    if (!snap.exists()) {
      toastGoster("Silinen profil bulunamadı!");
      return;
    }

    await set(ref(veritabani, `yedekler/${kod}`), snap.val());

    await remove(kaynakRef);

    toastGoster("✅ Profil geri getirildi!");
    document.getElementById("pwProfilKurtarKod").value = "";
  } catch (e) {
    toastGoster("❌ İşlem başarısız!");
  }
};


window.pwBonusKodEkle = async function () {
  const kod = document.getElementById("pwBonusKod")?.value.trim().toUpperCase();
  const puan = parseInt(document.getElementById("pwBonusPuan")?.value) || 0;
  const aciklama = document.getElementById("pwBonusAciklama")?.value.trim();
  const limit = parseInt(document.getElementById("pwBonusLimit")?.value) || 1;
  const sure = parseInt(document.getElementById("pwBonusSure")?.value) || 0;
  const birim = document.getElementById("pwBonusSureBirim")?.value || "gun";

  if (!kod) { toastGoster("Kod girin!"); return; }
  if (puan <= 0) { toastGoster("Geçerli puan girin!"); return; }

  let expireAt = 0;
  if (sure > 0) {
    let ms = sure;
    if (birim === "dakika") ms = sure * 60 * 1000;
    else if (birim === "saat") ms = sure * 3600 * 1000;
    else if (birim === "gun") ms = sure * 86400 * 1000;
    expireAt = Date.now() + ms;
  }

  try {
    const yeniRef = push(ref(veritabani, "bonusCodes"));
    await set(yeniRef, { kod, puan, aciklama, limit, expireAt, olusturulma: Date.now() });
    toastGoster("✅ Bonus kod eklendi!");
    ["pwBonusKod","pwBonusPuan","pwBonusAciklama","pwBonusLimit","pwBonusSure"]
      .forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
    pwBonusListesiYukle();
  } catch (e) {
    toastGoster("❌ Eklenemedi!");
  }
};

function pwBonusListesiYukle() {
  const konteyner = document.getElementById("pwBonusListe");
  if (!konteyner) return;
  get(ref(veritabani, "bonusCodes")).then(snap => {
    if (!snap.exists()) {
      konteyner.innerHTML = `<div style="color:var(--metin-soluk);font-size:13px;text-align:center;padding:8px;">Bonus kod yok.</div>`;
      return;
    }
    const veri = snap.val();
    konteyner.innerHTML = "";
    Object.entries(veri)
      .sort((a, b) => (b[1].olusturulma || 0) - (a[1].olusturulma || 0))
      .forEach(([key, d]) => {
        const doldu = d.expireAt > 0 && Date.now() > d.expireAt;
        const div = document.createElement("div");
        div.style.cssText = "background:rgba(255,255,255,0.04);border:1px solid rgba(230,81,0,0.25);border-radius:8px;padding:9px 12px;margin-bottom:6px;display:flex;align-items:flex-start;gap:8px;";
        div.innerHTML = `
          <div style="flex:1;min-width:0;">
            <div style="font-size:14px;font-weight:800;color:#ff9800;">${d.kod}</div>
            <div style="font-size:12px;color:var(--metin-soluk);margin-top:2px;">+${d.puan} puan &nbsp;•&nbsp; Limit: ${d.limit}x</div>
            ${d.aciklama ? `<div style="font-size:11px;color:var(--metin-soluk);margin-top:2px;">${d.aciklama}</div>` : ""}
            <div style="font-size:11px;margin-top:3px;color:${doldu ? "#ff1744" : "#00e676"};">
              ${doldu ? "🔴 Süresi doldu" : "🟢 Aktif"}
            </div>
          </div>
          <button onclick="pwBonusKodSil('${key}')" style="background:rgba(255,23,68,0.15);border:1px solid rgba(255,23,68,0.3);border-radius:6px;color:#ff6b6b;font-size:11px;font-weight:700;padding:4px 8px;cursor:pointer;white-space:nowrap;flex-shrink:0;">🗑</button>
        `;
        konteyner.appendChild(div);
      });
  });
}

window.pwBonusKodSil = async function (key) {
  if (!confirm("Bu bonus kodu silmek istediğine emin misin?")) return;
  try {
    await remove(ref(veritabani, `bonusCodes/${key}`));
    toastGoster("✅ Silindi");
    pwBonusListesiYukle();
  } catch (e) {
    toastGoster("❌ Silinemedi!");
  }
};