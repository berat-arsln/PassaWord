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
