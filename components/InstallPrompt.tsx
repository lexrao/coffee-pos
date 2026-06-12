"use client";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOS, setShowIOS] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    // iOS detection
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const safari = /safari/.test(navigator.userAgent.toLowerCase());
    if (ios && safari) {
      setIsIOS(true);
      const dismissed = localStorage.getItem("brewco_ios_prompt");
      if (!dismissed) setTimeout(() => setShowIOS(true), 3000);
      return;
    }

    // Android / Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      const dismissed = localStorage.getItem("brewco_install_dismissed");
      if (!dismissed) setTimeout(() => setShow(true), 3000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setShow(false);
    setPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    setShowIOS(false);
    localStorage.setItem("brewco_install_dismissed", "1");
    localStorage.setItem("brewco_ios_prompt", "1");
  };

  if (installed || (!show && !showIOS)) return null;

  if (showIOS) {
    return (
      <div className="install-banner">
        <span className="install-icon">☕</span>
        <div className="install-text">
          <strong>Add to Home Screen</strong>
          <span>Tap <strong>Share</strong> then <strong>"Add to Home Screen"</strong> to install</span>
        </div>
        <button className="install-dismiss" onClick={handleDismiss}>✕</button>
      </div>
    );
  }

  return (
    <div className="install-banner">
      <span className="install-icon">☕</span>
      <div className="install-text">
        <strong>Install Brew & Co.</strong>
        <span>Add to your home screen for quick access</span>
      </div>
      <button className="install-btn" onClick={handleInstall}>Install</button>
      <button className="install-dismiss" onClick={handleDismiss}>✕</button>
    </div>
  );
}
