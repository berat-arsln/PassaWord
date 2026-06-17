const isPWA = new URLSearchParams(window.location.search).get('pwa') === '1';

if (isPWA) {
    const style = document.createElement('style');
    style.textContent = `
        html, body { 
            overscroll-behavior-y: contain !important;
        }
    `;
    document.head.appendChild(style);

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            const oyunEkrani = document.getElementById('oyunEkrani');
            const oyunGorunur = oyunEkrani && !oyunEkrani.classList.contains('gizli');
            if (!oyunGorunur) {
                window.location.reload();
            }
        }
    });
}

function guncelleBannerGoster() {
  const mevcutBanner = document.getElementById("guncelleBanner");
  if (mevcutBanner) return;

  const banner = document.createElement("div");
  banner.id = "guncelleBanner";
  banner.style.cssText = `
    position:fixed;bottom:20px;left:50%;transform:translateX(-50%);
    background:#1a2744;border:1px solid rgba(79,195,247,0.4);
    border-radius:14px;padding:14px 18px;z-index:9999;
    display:flex;align-items:center;gap:12px;
    box-shadow:0 4px 24px rgba(0,0,0,0.4);max-width:320px;width:90%;
  `;
  banner.innerHTML = `
    <div style="flex:1;font-size:13px;color:#fff;font-weight:600;">
      🔄 Yeni sürüm mevcut!
    </div>
    <button onclick="window.location.reload()" style="
      background:linear-gradient(145deg,#1976d2,#0d47a1);
      border:none;border-radius:8px;color:#fff;
      font-size:13px;font-weight:700;padding:8px 14px;cursor:pointer;
    ">Güncelle</button>
    <button onclick="this.parentElement.remove()" style="
      background:transparent;border:none;color:rgba(255,255,255,0.5);
      font-size:18px;cursor:pointer;padding:0 4px;
    ">✕</button>
  `;
  document.body.appendChild(banner);
}

window.bekleyenGuncellemeyiKontrolEt = function() {
  if (window._bekleyenGuncelleme) {
    window._bekleyenGuncelleme = false;
    guncelleBannerGoster();
  }
};

function versiyonKontrolBaslat() {
  onValue(ref(veritabani, "ayarlar/versiyon"), (snap) => {
    if (!snap.exists()) return;
    const sunucuVersiyon = snap.val();
    const yerelVersiyon = localStorage.getItem("pw_versiyon");

    if (!yerelVersiyon) {
      localStorage.setItem("pw_versiyon", sunucuVersiyon);
      return;
    }

    if (yerelVersiyon !== sunucuVersiyon) {
      localStorage.setItem("pw_versiyon", sunucuVersiyon);
      const oyunEkrani = document.getElementById("oyunEkrani");
      const oyunAcikMi = oyunEkrani && !oyunEkrani.classList.contains("gizli");
      if (oyunAcikMi) {
        window._bekleyenGuncelleme = true;
      } else {
        guncelleBannerGoster();
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  versiyonKontrolBaslat();
});