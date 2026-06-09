      function genelSkorTablosunuDinle() {
        const skorRef = ref(veritabani, "skorlar");

        onValue(skorRef, (anlık) => {
          const veri = anlık.val();
          const liste = document.getElementById("genelSkorListe");
          liste.innerHTML = "";

          if (!veri) {
            liste.innerHTML = `<div style="text-align:center;color:var(--metin-soluk);padding:24px;font-size:14px;">Henüz skor yok. İlk sen ol!</div>`;
            return;
          }

          

          const skorDizisi = Object.entries(veri)
            .map(([k, v]) => ({ _key: k, ...v }))
            .sort((a, b) => b.puan - a.puan)
            .slice(0, 20);
          const madalyalar = ["🥇", "🥈", "🥉"];

          skorDizisi.forEach((skor, i) => {
            const d = skor.dogru || 0;
            const y = skor.yanlis || 0;
            const p = skor.pas || 0;

            const satir = document.createElement("div");
            satir.className = "skor-satir";
            satir.innerHTML = `
        <div class="skor-satir-ust">
          <div class="skor-sira">${madalyalar[i] || i + 1}</div>
          <div class="skor-isim">${skor.isim} <span style="font-size:11px;color:var(--metin-soluk)">${new Date(skor.tarih).toLocaleDateString('tr-TR')}</span></div>
          <div style="display:flex;align-items:center;gap:6px;">
            <div class="skor-puan">${skor.puan} puan</div>
            
          </div>
        </div>
        <div class="skor-satir-alt">
          <span style="color:var(--dogru-renk);">✓ ${d}</span>
          <span style="color:var(--yanlis-renk);">✗ ${y}</span>
          <span style="color:var(--pas-renk);">~ ${p}</span>
        </div>
      `;

            // Detay tıklaması
            satir.style.cursor = 'pointer';
            satir.addEventListener('click', (e) => {
              if (e.target.tagName === 'BUTTON') return; // Silme butonuna tıklama detay açmasın
              if (skor.detay && skor.detay.length > 0) {
                gecmisDetayGoster(skor, 0);
              } else {
                toastGoster('Bu oyunun detayı yok.');
              }
            });

            

            liste.appendChild(satir);
          });
        });
      }

      function kisiselSkorTablosunuGuncelle() {
        const profil = aktifProfiliGetir();
        const liste = document.getElementById("kisiselSkorListe");
        liste.innerHTML = "";

        if (!profil || !profil.skorlar || profil.skorlar.length === 0) {
          liste.innerHTML = `<div style="
          text-align:center;
          color:var(--metin-soluk);
          padding:24px;
          font-size:14px;">Henüz skor yok. Oyna ve rekorunu kır!</div>`;
          return;
        }

        const kodKutu = document.createElement("div");
        kodKutu.style.cssText = "padding:0 16px 12px;";
        kodKutu.innerHTML = `<div class="ayar-etiket">Yedekleme Kodu</div><div class="yedek-kod-kutu" 
        style="font-size:13px;letter-spacing:2px;cursor:pointer;" 
        onclick="kopyala(this)" title="Kopyalamak için tıkla">${profil.yedekKod || '(Henüz oluşturulmadı)'}</div>`;
        liste.appendChild(kodKutu);

        const madalyalar = ["🥇", "🥈", "🥉"];
        profil.skorlar.slice(0, 20).forEach((skor, i) => {
          const tarih = new Date(skor.tarih).toLocaleDateString("tr-TR");
          const d = skor.dogru || 0;
          const y = skor.yanlis || 0;
          const p = skor.pas || 0;

          const satir = document.createElement("div");
          satir.className = "skor-satir";
          satir.innerHTML = `
        <div class="skor-satir-ust">
          <div class="skor-sira">${madalyalar[i] || i + 1}</div>
          <div class="skor-isim">${
            profil.ad
          } <span style="font-size:11px;color:var(--metin-soluk)">${tarih}</span></div>
          <div class="skor-puan">${skor.puan} puan</div>
        </div>
        <div class="skor-satir-alt">
          <span style="color:var(--dogru-renk);">✓ ${d}</span>
          <span style="color:var(--yanlis-renk);">✗ ${y}</span>
          <span style="color:var(--pas-renk);">~ ${p}</span>
        </div>
    `;
    
    satir.style.cursor = 'pointer';
satir.addEventListener('click', () => {
  const profil = aktifProfiliGetir();
  const gecmis = profil?.gecmis || [];
  // Skoru tarihe göre eşleştir
  const eslesen = gecmis.find(g => g.puan === skor.puan && 
    new Date(g.tarih).toLocaleDateString('tr-TR') === tarih);
  if (eslesen) {
    gecmisDetayGoster(eslesen, 0);
  } else {
    toastGoster('Bu oyunun detayı bulunamadı.');
  }
});
          liste.appendChild(satir);
        });
      }


