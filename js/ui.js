window.anaSayfayaGit = function () {
  clearInterval(oyunDurumu.zamanlayici);
  oyunDurumu.calisiyor = false;
  ekraniGoster("baslangicEkrani");
  const aktifProfil = aktifProfiliGetir();
  if (aktifProfil) {
    document.getElementById("profilOlusturKutu").style.display = "none";
    const hazir = document.getElementById("hazirEkrani");
    hazir.style.display = "flex";
    hazir.style.flexDirection = "column";
    hazir.style.alignItems = "center";
    hazir.style.gap = "16px";
    document.getElementById("hosgeldinIsim").textContent = aktifProfil.ad;
  }
};

/* Modallar */
window.modalAc = function (id) {
  if (id === "skorModal") kisiselSkorTablosunuGuncelle();
  if (id === "ayarlarModal") aktifProfilUiGuncelle();
  if (id === "profilSecModal") {
    profilleriFirebaseIleEslestir().then(() => profilListesiniGuncelle());
  }
  if (id === "geriBildirimModal") altTurGuncelle("oneri");
  if (id === "gecmisModal") gecmisModalGuncelle();
  if (id === "adminModal") {
    document.getElementById("adminSifreEkrani").classList.remove("gizli");
    document.getElementById("adminIcerik").classList.add("gizli");
    document.getElementById("adminSifreGiris").value = "";
  }
  document.getElementById(id).classList.add("acik");
};
window.modalKapat = function (id) {
  document.getElementById(id).classList.remove("acik");
};
window.disaTiklaKapat = function (e, id) {
  if (e.target === document.getElementById(id)) modalKapat(id);
};
window.sekmeGec = function (sekme) {
  document
    .getElementById("sekmeGenel")
    .classList.toggle("aktif", sekme === "genel");
  document
    .getElementById("sekmeKisisel")
    .classList.toggle("aktif", sekme === "kisisel");
  document
    .getElementById("genelSkorListe")
    .classList.toggle("gizli", sekme !== "genel");
  document
    .getElementById("kisiselSkorListe")
    .classList.toggle("gizli", sekme !== "kisisel");
};

function onayGoster(baslik, mesaj, onayCallback) {
  document.getElementById("onayBaslik").textContent = baslik;
  document.getElementById("onayMesaj").textContent = mesaj;
  document.getElementById("onayEvetButon").onclick = () => {
    onayCallback();
    onayKapat();
  };
  document.getElementById("onayDiyalog").classList.add("acik");
}

window.onayKapat = function () {
  document.getElementById("onayDiyalog").classList.remove("acik");
};
function toastGoster(mesaj, sure = 2500) {
  const toast = document.getElementById("toastBildirim");
  toast.textContent = mesaj;
  toast.classList.add("goster");
  setTimeout(() => toast.classList.remove("goster"), sure);
}

window.toastGoster = toastGoster;
function ekraniGoster(id) {
  document.querySelectorAll(".ekran").forEach((e) => e.classList.add("gizli"));
  document.getElementById(id).classList.remove("gizli");
  // Duyuru bandını başlangıç ekranında göster, oyun/sonuç ekranında gizle
  const bandi = document.getElementById("duyuruBandi");
  const oyunBandi = document.getElementById("duyuruBandiOyun");
  if (bandi && id !== "baslangicEkrani") bandi.classList.add("gizli");
  if (oyunBandi && id !== "oyunEkrani") oyunBandi.classList.add("gizli");

  // Profil UI'ı güncelle
  if (id === "baslangicEkrani") aktifProfilUiGuncelle();
}
