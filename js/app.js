// Sadece PWA modunda pull-to-refresh'e izin ver
if (window.matchMedia('(display-mode: fullscreen)').matches || 
    window.matchMedia('(display-mode: standalone)').matches) {
    document.body.style.overflowY = 'auto';
    document.body.style.overscrollBehaviorY = 'auto';
    document.body.style.touchAction = 'pan-y';
    document.documentElement.style.overflowY = 'auto';
    
    const style = document.createElement('style');
    style.textContent = `
        html, body { 
            overscroll-behavior-y: auto !important; 
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
