import { Bell, BellOff, BellRing, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBrowserNotifications } from "@/hooks/useBrowserNotifications";

export const NotificationSettings = () => {
  const { permission, requestPermission, isSupported } = useBrowserNotifications();

  const handleRequestPermission = async () => {
    await requestPermission();
  };

  const resetDismissed = () => {
    localStorage.removeItem("notification-banner-dismissed");
    window.location.reload();
  };

  if (!isSupported) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BellOff className="w-5 h-5" />
            Сповіщення браузера
          </CardTitle>
          <CardDescription>
            Ваш браузер не підтримує сповіщення
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Спробуйте використати інший браузер для отримання сповіщень про нові повідомлення та виплати контрактів.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="w-5 h-5" />
          Сповіщення браузера
        </CardTitle>
        <CardDescription>
          Отримуйте сповіщення прямо в браузері
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Статус дозволу</p>
            <p className="text-xs text-muted-foreground">
              {permission === "granted" && "Сповіщення увімкнені"}
              {permission === "denied" && "Сповіщення заблоковані"}
              {permission === "default" && "Очікує дозволу"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {permission === "granted" && (
              <div className="flex items-center gap-1 text-green-500">
                <Check className="w-4 h-4" />
                <span className="text-sm">Увімкнено</span>
              </div>
            )}
            {permission === "denied" && (
              <div className="flex items-center gap-1 text-destructive">
                <BellOff className="w-4 h-4" />
                <span className="text-sm">Заблоковано</span>
              </div>
            )}
            {permission === "default" && (
              <Button size="sm" onClick={handleRequestPermission}>
                <BellRing className="w-4 h-4 mr-2" />
                Увімкнути
              </Button>
            )}
          </div>
        </div>

        {permission === "granted" && (
          <div className="space-y-3 pt-2 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              Ви будете отримувати сповіщення про:
            </p>
            <ul className="text-sm space-y-2">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Нові особисті повідомлення
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Виплати контрактів
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Системні сповіщення
              </li>
            </ul>
          </div>
        )}

        {permission === "denied" && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              Щоб увімкнути сповіщення:
            </p>
            <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
              <li>Натисніть на іконку замка в адресному рядку</li>
              <li>Знайдіть "Сповіщення" в налаштуваннях</li>
              <li>Змініть на "Дозволити"</li>
              <li>Оновіть сторінку</li>
            </ol>
          </div>
        )}

        {permission === "default" && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              Натисніть "Увімкнути" вище, щоб отримувати сповіщення про нові повідомлення та виплати контрактів навіть коли вкладка не активна.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
