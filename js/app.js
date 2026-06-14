// Sadece PWA modunda pull-to-refresh'e izin ver
const isPWA = new URLSearchParams(window.location.search).get('pwa') === '1';

if (isPWA) {
    const style = document.createElement('style');
    style.textContent = `
        html, body { 
            overscroll-behavior-y: contain !important;
            touch-action: pan-y !important; 
        }
    `;
    document.head.appendChild(style);

    let startY = 0;
    document.addEventListener('touchstart', e => {
        startY = e.touches[0].clientY;
    });
    document.addEventListener('touchend', e => {
        const endY = e.changedTouches[0].clientY;
        const diff = endY - startY;
        if (diff > 80 && window.scrollY === 0) {
            window.location.reload();
        }
    });
}
