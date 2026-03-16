import { useState, useEffect } from 'react';

export default function PWAUpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    // Listen for custom event from service worker registration
    const handleUpdate = (event) => {
      console.log('🔄 Update available!');
      setWaitingWorker(event.detail);
      setShowUpdate(true);
    };

    window.addEventListener('swUpdateAvailable', handleUpdate);

    return () => {
      window.removeEventListener('swUpdateAvailable', handleUpdate);
    };
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      console.log('📥 Activating new Service Worker...');
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      
      waitingWorker.addEventListener('statechange', (e) => {
        if (e.target.state === 'activated') {
          console.log('✅ New version activated, reloading...');
          window.location.reload();
        }
      });
    }
  };

  const handleDismiss = () => {
    console.log('⏭️ User dismissed update notification');
    setShowUpdate(false);
  };

  if (!showUpdate) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl shadow-2xl p-4 z-50 animate-slide-down">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        
        <div className="flex-1">
          <p className="font-heading font-bold mb-1">Mise à jour disponible</p>
          <p className="text-sm text-blue-100 font-body mb-3">
            Une nouvelle version de l'application est disponible.
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-sm font-heading font-medium text-blue-100 hover:text-white transition-colors"
            >
              Plus tard
            </button>
            <button
              onClick={handleUpdate}
              className="px-4 py-1.5 bg-white text-blue-600 font-heading font-medium rounded-lg hover:bg-blue-50 transition-colors text-sm shadow-sm"
            >
              Mettre à jour
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-blue-100 hover:text-white transition-colors"
          aria-label="Fermer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}