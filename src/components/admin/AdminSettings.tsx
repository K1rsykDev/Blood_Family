import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Settings, Key, Palette, Snowflake, Eye, EyeOff } from "lucide-react";

interface SiteSettings {
  id: number;
  background_url: string | null;
  snow_enabled: boolean;
  garland_enabled: boolean;
  primary_color: string;
  admin_code: string;
  show_admin_code: boolean;
}

export const AdminSettings = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    background_url: "",
    snow_enabled: true,
    garland_enabled: true,
    primary_color: "#dc2626",
    admin_code: "",
    show_admin_code: false,
  });

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (data) {
      setSettings(data as SiteSettings);
      setFormData({
        background_url: data.background_url || "",
        snow_enabled: data.snow_enabled ?? true,
        garland_enabled: data.garland_enabled ?? true,
        primary_color: data.primary_color || "#dc2626",
        admin_code: data.admin_code || "",
        show_admin_code: data.show_admin_code ?? false,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("site_settings")
        .update({
          background_url: formData.background_url || null,
          snow_enabled: formData.snow_enabled,
          garland_enabled: formData.garland_enabled,
          primary_color: formData.primary_color,
          admin_code: formData.admin_code,
          show_admin_code: formData.show_admin_code,
        })
        .eq("id", 1);

      if (error) throw error;

      toast({
        title: "Налаштування збережено",
        description: "Зміни набудуть чинності після оновлення сторінки",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося зберегти налаштування",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Visual Settings */}
      <div className="card-blood p-6">
        <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          Візуальні налаштування
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="background_url">URL фонового зображення</Label>
            <Input
              id="background_url"
              value={formData.background_url}
              onChange={(e) => setFormData({ ...formData, background_url: e.target.value })}
              className="bg-secondary border-border"
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground">
              Залиште порожнім для використання тем (dark/light)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="primary_color">Основний колір</Label>
            <div className="flex gap-3">
              <Input
                id="primary_color"
                type="color"
                value={formData.primary_color}
                onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                className="w-16 h-10 p-1 bg-secondary border-border"
              />
              <Input
                value={formData.primary_color}
                onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                className="flex-1 bg-secondary border-border"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Snowflake className="w-4 h-4 text-snow" />
              <Label htmlFor="snow_enabled">Падаючий сніг</Label>
            </div>
            <Switch
              id="snow_enabled"
              checked={formData.snow_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, snow_enabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-gold">✨</span>
              <Label htmlFor="garland_enabled">Гірлянда</Label>
            </div>
            <Switch
              id="garland_enabled"
              checked={formData.garland_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, garland_enabled: checked })}
            />
          </div>

          <Button type="submit" className="w-full btn-blood" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Зберегти"}
          </Button>
        </form>
      </div>

      {/* Security Settings */}
      <div className="card-blood p-6">
        <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
          <Key className="w-5 h-5 text-gold" />
          Безпека
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="admin_code">Код адміністратора</Label>
            <div className="relative">
              <Input
                id="admin_code"
                type={showCode ? "text" : "password"}
                value={formData.admin_code}
                onChange={(e) => setFormData({ ...formData, admin_code: e.target.value })}
                className="bg-secondary border-border pr-10"
                placeholder="Секретний код"
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Цей код дозволяє користувачам отримати права адміністратора через їх профіль
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="show_admin_code">Показувати код тут</Label>
            </div>
            <Switch
              id="show_admin_code"
              checked={formData.show_admin_code}
              onCheckedChange={(checked) => setFormData({ ...formData, show_admin_code: checked })}
            />
          </div>

          {formData.show_admin_code && (
            <div className="p-4 bg-gold/10 border border-gold/20 rounded-lg">
              <p className="text-sm font-medium mb-1">Поточний код:</p>
              <p className="font-mono text-lg text-gold">{formData.admin_code}</p>
            </div>
          )}

          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <h3 className="font-semibold text-sm mb-2">⚠️ Важливо</h3>
            <p className="text-xs text-muted-foreground">
              Тримайте код адміністратора в секреті. Будь-хто з цим кодом зможе отримати 
              повний доступ до адмін-панелі.
            </p>
          </div>

          <Button type="submit" className="w-full btn-blood" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Зберегти"}
          </Button>
        </form>
      </div>

      {/* Discord API Info */}
      <div className="card-blood p-6 md:col-span-2">
        <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Discord Bot API - Інструкція
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3">Ендпоінти API</h3>
            <div className="space-y-2 text-sm font-mono bg-secondary/50 p-4 rounded-lg">
              <div><strong>Create Contract:</strong> /api/create-contract</div>
              <div><strong>Check Pending:</strong> /api/pending-notifications</div>
              <div><strong>Confirm:</strong> /api/mark-notified</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Як підключити Discord бота</h3>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Створіть Edge Function для API ендпоінтів</li>
              <li>Бот має викликати <code>create-contract</code> з полями: <code>discord_id</code>, <code>amount</code>, <code>description</code></li>
              <li>Контракти з'являться у гравця та адміна автоматично</li>
              <li>Після виплати бот може отримати сповіщення через <code>pending-notifications</code></li>
              <li>Секрет API передавайте в заголовку <code>X-API-SECRET</code></li>
            </ol>
          </div>
        </div>

        <div className="mt-6 p-4 bg-primary/10 rounded-lg">
          <h3 className="font-semibold mb-2">Приклад запиту створення контракту:</h3>
          <pre className="text-xs font-mono bg-secondary/50 p-3 rounded overflow-x-auto">
{`POST /functions/v1/create-contract
Headers: 
  X-API-SECRET: your-secret-key
  Content-Type: application/json

Body:
{
  "discord_id": "123456789012345678",
  "amount": 5000,
  "description": "Виконано контракт на гравця X"
}`}
          </pre>
        </div>
      </div>
    </div>
  );
};