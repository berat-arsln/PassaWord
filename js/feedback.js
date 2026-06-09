      /* Form ve Seçimler */
      window.geriBildirimGonder = async function () {
        const mesaj = document.getElementById("geriBildirimMesaj").value.trim();
        if (!mesaj) {
          toastGoster("Lütfen mesajınızı yazın!");
          return;
        }
        const kategoriEl = document.querySelector(
          "#kategoriGrubu .secim-cipi.secili"
        );
        const altTurEl = document.querySelector(
          "#altTurGrubu .secim-cipi.secili"
        );
        const kategori = kategoriEl
          ? kategoriEl.textContent.trim()
          : "Belirsiz";
        const altTur = altTurEl ? altTurEl.textContent.trim() : "Belirsiz";
        const profil = aktifProfiliGetir();
        const profilAdi = profil ? profil.ad : "Anonim";
        const cevap = document.getElementById("geriBildirimCevap").value.trim();
        const alternatif = document
          .getElementById("geriBildirimAlternatif")
          .value.trim();

        try {
          const geriBildirimRef = ref(veritabani, "geribildirimler");
          await push(geriBildirimRef, {
            profilAdi,
            kategori,
            altTur,
            mesaj,
            cevap: cevap || "",
            alternatifler: alternatif || "",
            tarih: new Date().toISOString(),
          });
          toastGoster("Geri bildiriminiz gönderildi! Teşekkürler 🙏");
          document.getElementById("geriBildirimMesaj").value = "";
          modalKapat("geriBildirimModal");
        } catch (hata) {
          console.warn(hata);
        }
      };

      window.altTurGuncelle = function (kategori) {
        const grup = document.getElementById("altTurGrubu");
        grup.innerHTML = "";
        const secenekler =
          kategori === "oneri"
            ? [
                ["❓ Soru Önerisi", true],
                ["🎮 Oyunla İlgili Öneri", false],
              ]
            : [
                ["🐛 Soru Hatası", true],
                ["⚙️ Teknik Hata", false],
                ["🔤 Harf/Soru Uyumsuzluğu", false],
              ];
        secenekler.forEach(([metin, secili]) => {
          const cip = document.createElement("div");
          cip.className = `secim-cipi${secili ? " secili" : ""}`;
          cip.textContent = metin;
          cip.onclick = () => {
            cipSec(cip, "altTurGrubu");
          };
          grup.appendChild(cip);
        });
        const ilkSecili = grup.querySelector(".secim-cipi.secili");
        const soruOneriMi = ilkSecili && ilkSecili.textContent.includes("Soru");
        document.getElementById("alternatifGrup").style.display = soruOneriMi
          ? "block"
          : "none";
      };
      window.cipSec = function (el, grupId) {
        el.closest(".secim-grubu")
          .querySelectorAll(".secim-cipi")
          .forEach((c) => c.classList.remove("secili"));
        el.classList.add("secili");
        if (grupId === "altTurGrubu") {
          document.getElementById("alternatifGrup").style.display =
            el.textContent.includes("Soru") ? "block" : "none";
        }
      };

