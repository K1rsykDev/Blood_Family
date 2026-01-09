import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBrowserNotifications } from "@/hooks/useBrowserNotifications";

export const NotificationPermissionBanner = () => {
  const { permission, requestPermission, isSupported } = useBrowserNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the banner
    const wasDismissed = localStorage.getItem("notification-banner-dismissed");
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Show banner after a short delay if permission is default
    if (isSupported && permission === "default") {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [permission, isSupported]);

  const handleAllow = async () => {
    await requestPermission();
    setVisible(false);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
    localStorage.setItem("notification-banner-dismissed", "true");
  };

  if (!isSupported || permission !== "default" || dismissed || !visible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm">
              Увімкнути сповіщення?
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Отримуйте сповіщення про нові повідомлення та виплати контрактів
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleAllow}
                className="text-xs"
              >
                Дозволити
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-xs"
              >
                Пізніше
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-6 w-6"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
