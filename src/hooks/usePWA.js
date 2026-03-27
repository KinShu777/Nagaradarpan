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
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const showInstallPrompt = async () => {
    if (!installPrompt) return;

    // Show the install prompt
    installPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;
    console.log(`PWA: User response to the install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, so clear it
    setInstallPrompt(null);
    setIsInstallable(false);
  };

  return { isInstallable, showInstallPrompt };
}
