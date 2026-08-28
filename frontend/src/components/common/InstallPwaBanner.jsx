import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X } from 'lucide-react';

export const InstallPwaBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      console.log('[PWA] User installed KiranaFlow App');
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto bg-emerald-900 text-white p-3.5 rounded-2xl shadow-2xl z-50 flex items-center justify-between border border-emerald-700 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 bg-emerald-700 rounded-xl flex items-center justify-center text-white shrink-0 font-bold">
          <Smartphone className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-white">Install KiranaFlow App</h4>
          <p className="text-[11px] text-emerald-200 truncate">Add to Home Screen for fast mobile access</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleInstallClick}
          className="px-3 py-1.5 bg-violet-600 text-white font-extrabold text-xs rounded-xl flex items-center gap-1 shadow-sm hover:bg-violet-700 transition"
        >
          <Download className="w-3.5 h-3.5" />
          Install
        </button>
        <button onClick={() => setShowBanner(false)} className="p-1 text-emerald-300 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};