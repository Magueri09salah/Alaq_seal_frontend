import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches 
      || window.navigator.standalone 
      || localStorage.getItem('pwa-dismissed');

    if (isInstalled) {
      console.log('PWA already installed or dismissed');
      return;
    }

    // Listen for install prompt
    const handler = (e) => {
      console.log('📱 PWA install prompt available');
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show banner after 10 seconds (reduced for testing)
      setTimeout(() => {
        setShowBanner(true);
      }, 10000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      console.log('No install prompt available');
      return;
    }

    console.log('📲 Showing install prompt...');
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('✅ User accepted the install prompt');
      toast.success('Application installée avec succès!');
    } else {
      console.log('❌ User dismissed the install prompt');
    }

    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    console.log('⏭️ User dismissed install banner');
    setShowBanner(false);
    localStorage.setItem('pwa-dismissed', 'true');
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-2xl shadow-2xl border border-neutral-200 p-6 z-50 animate-slide-up">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-neutral-400 hover:text-neutral-600 transition-colors"
        aria-label="Fermer"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="font-heading font-bold text-neutral-900 mb-1">
            Installer AlaqSeal
          </h3>
          <p className="text-sm text-neutral-600 font-body mb-4">
            Installez l'application sur votre appareil pour un accès rapide et une utilisation hors ligne.
          </p>

          <div className="flex gap-3">
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-sm font-heading font-medium text-neutral-600 hover:bg-neutral-50 rounded-lg transition-colors"
            >
              Plus tard
            </button>
            <button
              onClick={handleInstall}
              className="px-4 py-2 text-sm font-heading font-medium bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors shadow-sm"
            >
              Installer maintenant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}