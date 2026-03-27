import { useState, useEffect } from 'react';

/**
 * Hook to handle PWA install prompt.
 */
export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPrompt(e);
      setIsInstallable(true);
      console.log('PWA: Ready to install');

      // -------------------------------------------------------------------
      // AUTO-PROMPT LOGIC (As requested)
      // Trigger the prompt after a short delay (1.5s)
      // -------------------------------------------------------------------
      const hasPromptedThisSession = sessionStorage.getItem('pwa_auto_prompted');
      
      if (!hasPromptedThisSession) {
        const timer = setTimeout(() => {
          console.log('PWA: Attempting automatic install prompt...');
          e.prompt();
          sessionStorage.setItem('pwa_auto_prompted', 'true');
        }, 1500); // 1.5s delay for UX

        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const showInstallPrompt = async () => {
    if (!installPrompt) {
      console.warn('PWA: No install prompt available');
      return;
    }

    try {
      // Show the install prompt
      await installPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await installPrompt.userChoice;
      console.log(`PWA: User response to the install prompt: ${outcome}`);

      // If user accepted, we clear the prompt
      if (outcome === 'accepted') {
        setInstallPrompt(null);
        setIsInstallable(false);
      }
    } catch (err) {
      console.error('PWA: Install prompt error', err);
    }
  };

  return { isInstallable, showInstallPrompt };
}
