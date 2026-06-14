// Sadece PWA modunda pull-to-refresh'e izin ver
if (window.matchMedia('(display-mode: fullscreen)').matches || 
    window.matchMedia('(display-mode: standalone)').matches) {
    document.body.style.overflowY = 'auto';
    document.body.style.overscrollBehaviorY = 'auto';
}
