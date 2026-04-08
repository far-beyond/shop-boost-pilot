import { useState, useEffect } from "react";
import { Download, Smartphone, Share, MoreVertical, Plus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import Layout from "@/components/Layout";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const { language } = useLanguage();
  const isEn = language === "en";
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl overflow-hidden shadow-lg">
            <img src="/pwa-icon-192.png" alt="MapBoost AI" width={80} height={80} />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">
            {isEn ? "Install MapBoost AI" : "MapBoost AI をインストール"}
          </h1>
          <p className="text-muted-foreground text-lg">
            {isEn
              ? "Add to your home screen for a native app experience"
              : "ホーム画面に追加して、アプリのように使えます"}
          </p>
        </div>

        {installed ? (
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="flex items-center gap-4 py-8 justify-center">
              <CheckCircle2 className="w-8 h-8 text-accent" />
              <p className="text-lg font-medium text-foreground">
                {isEn ? "App installed successfully!" : "アプリのインストールが完了しました！"}
              </p>
            </CardContent>
          </Card>
        ) : deferredPrompt ? (
          <div className="text-center">
            <Button size="lg" onClick={handleInstall} className="text-base px-8 py-6 gap-2">
              <Download className="w-5 h-5" />
              {isEn ? "Install App" : "アプリをインストール"}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {isIOS ? (
              <Card>
                <CardContent className="py-6 space-y-5">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-primary" />
                    {isEn ? "Install on iPhone / iPad" : "iPhone / iPad にインストール"}
                  </h2>
                  <ol className="space-y-4 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">1</span>
                      <span>{isEn ? "Tap the " : "画面下部の "}<Share className="inline w-4 h-4 mx-1" />{isEn ? " Share button at the bottom" : " 共有ボタンをタップ"}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">2</span>
                      <span>{isEn ? "Scroll down and tap " : "「"}<Plus className="inline w-4 h-4 mx-1" />{isEn ? " Add to Home Screen" : " ホーム画面に追加」をタップ"}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">3</span>
                      <span>{isEn ? "Tap \"Add\" to confirm" : "「追加」をタップして完了"}</span>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-6 space-y-5">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-primary" />
                    {isEn ? "Install on Android" : "Android にインストール"}
                  </h2>
                  <ol className="space-y-4 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">1</span>
                      <span>{isEn ? "Tap the " : "ブラウザの "}<MoreVertical className="inline w-4 h-4 mx-1" />{isEn ? " menu in Chrome" : " メニューをタップ"}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">2</span>
                      <span>{isEn ? "Tap \"Install app\" or \"Add to Home screen\"" : "「アプリをインストール」または「ホーム画面に追加」をタップ"}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">3</span>
                      <span>{isEn ? "Tap \"Install\" to confirm" : "「インストール」をタップして完了"}</span>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
