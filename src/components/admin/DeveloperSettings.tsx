import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Palette, Key, Snowflake, Eye, EyeOff, User, Shield, Users as UsersIcon, Code, Crown, KeyRound, Trash2, Plus, Tag, Navigation, Share2, Wrench, Coins, ShoppingBag } from "lucide-react";
import { BCManagement } from "./BCManagement";
import { DeveloperShopHistory } from "./DeveloperShopHistory";

interface SiteSettings {
  id: number;
  background_url: string | null;
  snow_enabled: boolean;
  garland_enabled: boolean;
  primary_color: string;
  admin_code: string;
  show_admin_code: boolean;
  member_count: number;
  maintenance_mode: boolean;
  social_tiktok: string | null;
  social_youtube: string | null;
  social_discord: string | null;
  social_telegram: string | null;
}

interface CustomRole {
  id: string;
  name: string;
  display_name: string;
  color: string;
  has_admin_access: boolean;
  has_reports_access: boolean;
  has_news_access: boolean;
  has_giveaways_access: boolean;
  has_roulette_access: boolean;
  has_developer_access: boolean;
  can_change_username: boolean;
}

interface UserProfile {
  id: string;
  username: string;
  discord_id: string | null;
  role: string;
  custom_role_id: string | null;
  created_at: string;
}

export const DeveloperSettings = () => {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [leadersContent, setLeadersContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [activeTab, setActiveTab] = useState<"visual" | "security" | "users" | "leaders" | "roles" | "navbar" | "social" | "bc" | "shop">("visual");
  const [resettingPasswordId, setResettingPasswordId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    background_url: "",
    snow_enabled: true,
    garland_enabled: true,
    primary_color: "#dc2626",
    admin_code: "",
    show_admin_code: false,
    member_count: 150,
    maintenance_mode: false,
  });

  const [socialLinks, setSocialLinks] = useState({
    social_tiktok: "",
    social_youtube: "",
    social_discord: "",
    social_telegram: "",
  });

  const [navLabels, setNavLabels] = useState({
    home: "Головна",
    leaders: "Керівники Blood",
    apply: "Заявка",
    info: "Інформація",
    reports: "Контракти",
    news: "Новини",
    giveaways: "Розіграші",
  });

  const [roleFormData, setRoleFormData] = useState({
    name: "",
    display_name: "",
    color: "#22c55e",
    has_admin_access: false,
    has_reports_access: true,
    has_news_access: true,
    has_giveaways_access: true,
    has_roulette_access: false,
    has_developer_access: false,
    can_change_username: false,
  });

  const fetchData = async () => {
    // Fetch settings
    const { data: settingsData } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (settingsData) {
      setSettings(settingsData as SiteSettings);
      setFormData({
        background_url: settingsData.background_url || "",
        snow_enabled: settingsData.snow_enabled ?? true,
        garland_enabled: settingsData.garland_enabled ?? true,
        primary_color: settingsData.primary_color || "#dc2626",
        admin_code: settingsData.admin_code || "",
        show_admin_code: settingsData.show_admin_code ?? false,
        member_count: (settingsData as any).member_count ?? 150,
        maintenance_mode: (settingsData as any).maintenance_mode ?? false,
      });
      setSocialLinks({
        social_tiktok: (settingsData as any).social_tiktok || "",
        social_youtube: (settingsData as any).social_youtube || "",
        social_discord: (settingsData as any).social_discord || "",
        social_telegram: (settingsData as any).social_telegram || "",
      });
      if ((settingsData as any).nav_labels) {
        const labels = (settingsData as any).nav_labels;
        setNavLabels({
          home: labels.home || "Головна",
          leaders: labels.leaders || "Керівники Blood",
          apply: labels.apply || "Заявка",
          info: labels.info || "Інформація",
          reports: labels.reports || "Контракти",
          news: labels.news || "Новини",
          giveaways: labels.giveaways || "Розіграші",
        });
      }
    }

    // Fetch users
    const { data: usersData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (usersData) {
      setUsers(usersData as UserProfile[]);
    }

    // Fetch custom roles
    const { data: rolesData } = await supabase
      .from("custom_roles")
      .select("*")
      .order("created_at", { ascending: false });

    if (rolesData) {
      setCustomRoles(rolesData as CustomRole[]);
    }

    // Fetch leaders content
    const { data: leadersData } = await supabase
      .from("blood_leaders")
      .select("content")
      .eq("id", 1)
      .maybeSingle();

    if (leadersData) {
      setLeadersContent(leadersData.content);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSettingsSubmit = async (e: React.FormEvent) => {
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
          member_count: formData.member_count,
          maintenance_mode: formData.maintenance_mode,
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

  const handleLeadersSubmit = async () => {
    setIsSubmitting(true);

    try {
      const { data: existing } = await supabase
        .from("blood_leaders")
        .select("id")
        .eq("id", 1)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("blood_leaders")
          .update({ content: leadersContent, updated_at: new Date().toISOString() })
          .eq("id", 1);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("blood_leaders")
          .insert({ id: 1, content: leadersContent });
        if (error) throw error;
      }

      toast({
        title: "Контент збережено",
        description: "Сторінка 'Керівники Blood' оновлена",
      });
    } catch (error) {
      console.error("Error saving leaders:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося зберегти контент",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateRole = async (userId: string, role: "guest" | "member" | "admin" | "developer") => {
    setProcessingId(userId);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role, custom_role_id: null })
        .eq("id", userId);

      if (error) throw error;

      await fetchData();
      toast({
        title: "Роль оновлено",
        description: `Користувачу присвоєно роль: ${roleLabels[role]}`,
      });
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося оновити роль",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const assignCustomRole = async (userId: string, customRoleId: string | null) => {
    setProcessingId(userId);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ custom_role_id: customRoleId })
        .eq("id", userId);

      if (error) throw error;

      await fetchData();
      toast({
        title: "Кастомну роль призначено",
      });
    } catch (error) {
      console.error("Error assigning custom role:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося призначити кастомну роль",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleResetPassword = async (userId: string, username: string) => {
    const confirmed = await confirm({
      title: "Скидання пароля",
      description: `Скинути пароль для ${username}?\nКористувач зможе встановити новий пароль при наступному вході.`,
      confirmText: "Скинути",
    });
    if (!confirmed) return;
    
    setResettingPasswordId(userId);
    try {
      const response = await supabase.functions.invoke("reset-user-password", {
        body: { user_id: userId },
      });

      if (response.error) throw response.error;

      toast({
        title: "Пароль скинуто",
        description: `${username} зможе встановити новий пароль при вході`,
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося скинути пароль",
        variant: "destructive",
      });
    } finally {
      setResettingPasswordId(null);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    const confirmed = await confirm({
      title: "Видалення користувача",
      description: `УВАГА! Ви впевнені що хочете ВИДАЛИТИ профіль "${username}"?\n\nЦя дія незворотня! Всі дані користувача будуть видалені.`,
      confirmText: "Видалити",
      variant: "destructive",
    });
    if (!confirmed) return;
    
    setDeletingUserId(userId);
    try {
      const response = await supabase.functions.invoke("delete-user", {
        body: { user_id: userId },
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      toast({
        title: "Користувача видалено",
        description: `Профіль "${username}" успішно видалено`,
      });
      
      await fetchData();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося видалити користувача",
        variant: "destructive",
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleCreateRole = async () => {
    if (!roleFormData.name.trim() || !roleFormData.display_name.trim()) {
      toast({
        title: "Помилка",
        description: "Заповніть всі обов'язкові поля",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingRole) {
        const { error } = await supabase
          .from("custom_roles")
          .update({
            name: roleFormData.name,
            display_name: roleFormData.display_name,
            color: roleFormData.color,
            has_admin_access: roleFormData.has_admin_access,
            has_reports_access: roleFormData.has_reports_access,
            has_news_access: roleFormData.has_news_access,
            has_giveaways_access: roleFormData.has_giveaways_access,
            has_roulette_access: roleFormData.has_roulette_access,
            has_developer_access: roleFormData.has_developer_access,
            can_change_username: roleFormData.can_change_username,
          })
          .eq("id", editingRole.id);

        if (error) throw error;
        toast({ title: "Роль оновлено" });
      } else {
        const { error } = await supabase
          .from("custom_roles")
          .insert({
            name: roleFormData.name,
            display_name: roleFormData.display_name,
            color: roleFormData.color,
            has_admin_access: roleFormData.has_admin_access,
            has_reports_access: roleFormData.has_reports_access,
            has_news_access: roleFormData.has_news_access,
            has_giveaways_access: roleFormData.has_giveaways_access,
            has_roulette_access: roleFormData.has_roulette_access,
            has_developer_access: roleFormData.has_developer_access,
            can_change_username: roleFormData.can_change_username,
          });

        if (error) throw error;
        toast({ title: "Роль створено" });
      }

      setRoleDialogOpen(false);
      setEditingRole(null);
      resetRoleForm();
      await fetchData();
    } catch (error: any) {
      console.error("Error saving role:", error);
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося зберегти роль",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    const confirmed = await confirm({
      title: "Видалення ролі",
      description: "Видалити цю роль? Користувачам з цією роллю буде знято кастомну роль.",
      confirmText: "Видалити",
      variant: "destructive",
    });
    if (!confirmed) return;

    setDeletingRoleId(roleId);
    try {
      // First, remove role from all users
      await supabase
        .from("profiles")
        .update({ custom_role_id: null })
        .eq("custom_role_id", roleId);

      // Then delete the role
      const { error } = await supabase
        .from("custom_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;

      toast({ title: "Роль видалено" });
      await fetchData();
    } catch (error) {
      console.error("Error deleting role:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося видалити роль",
        variant: "destructive",
      });
    } finally {
      setDeletingRoleId(null);
    }
  };

  const openEditRole = (role: CustomRole) => {
    setEditingRole(role);
    setRoleFormData({
      name: role.name,
      display_name: role.display_name,
      color: role.color,
      has_admin_access: role.has_admin_access,
      has_reports_access: role.has_reports_access,
      has_news_access: role.has_news_access,
      has_giveaways_access: role.has_giveaways_access,
      has_roulette_access: role.has_roulette_access,
      has_developer_access: role.has_developer_access,
      can_change_username: role.can_change_username,
    });
    setRoleDialogOpen(true);
  };

  const resetRoleForm = () => {
    setRoleFormData({
      name: "",
      display_name: "",
      color: "#22c55e",
      has_admin_access: false,
      has_reports_access: true,
      has_news_access: true,
      has_giveaways_access: true,
      has_roulette_access: false,
      has_developer_access: false,
      can_change_username: false,
    });
  };

  const roleLabels: Record<string, string> = {
    guest: "Гість",
    member: "Учасник",
    admin: "Адмін",
    developer: "Розробник",
  };

  const roleColors: Record<string, string> = {
    guest: "text-muted-foreground",
    member: "text-primary",
    admin: "text-gold",
    developer: "text-purple-500",
  };

  const roleIcons: Record<string, any> = {
    guest: User,
    member: UsersIcon,
    admin: Shield,
    developer: Code,
  };

  const getUserCustomRole = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user?.custom_role_id) return null;
    return customRoles.find(r => r.id === user.custom_role_id);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeTab === "visual" ? "default" : "outline"}
          onClick={() => setActiveTab("visual")}
          className={activeTab === "visual" ? "btn-blood" : ""}
        >
          <Palette className="w-4 h-4 mr-2" />
          Візуальні
        </Button>
        <Button
          variant={activeTab === "security" ? "default" : "outline"}
          onClick={() => setActiveTab("security")}
          className={activeTab === "security" ? "btn-blood" : ""}
        >
          <Key className="w-4 h-4 mr-2" />
          Безпека
        </Button>
        <Button
          variant={activeTab === "users" ? "default" : "outline"}
          onClick={() => setActiveTab("users")}
          className={activeTab === "users" ? "btn-blood" : ""}
        >
          <UsersIcon className="w-4 h-4 mr-2" />
          Користувачі
        </Button>
        <Button
          variant={activeTab === "roles" ? "default" : "outline"}
          onClick={() => setActiveTab("roles")}
          className={activeTab === "roles" ? "btn-blood" : ""}
        >
          <Tag className="w-4 h-4 mr-2" />
          Ролі
        </Button>
        <Button
          variant={activeTab === "leaders" ? "default" : "outline"}
          onClick={() => setActiveTab("leaders")}
          className={activeTab === "leaders" ? "btn-blood" : ""}
        >
          <Crown className="w-4 h-4 mr-2" />
          Керівники
        </Button>
        <Button
          variant={activeTab === "navbar" ? "default" : "outline"}
          onClick={() => setActiveTab("navbar")}
          className={activeTab === "navbar" ? "btn-blood" : ""}
        >
          <Navigation className="w-4 h-4 mr-2" />
          Навігація
        </Button>
        <Button
          variant={activeTab === "social" ? "default" : "outline"}
          onClick={() => setActiveTab("social")}
          className={activeTab === "social" ? "btn-blood" : ""}
        >
          <Share2 className="w-4 h-4 mr-2" />
          Соц мережі
        </Button>
        <Button
          variant={activeTab === "bc" ? "default" : "outline"}
          onClick={() => setActiveTab("bc")}
          className={activeTab === "bc" ? "btn-blood" : ""}
        >
          <Coins className="w-4 h-4 mr-2" />
          BC Валюта
        </Button>
        <Button
          variant={activeTab === "shop" ? "default" : "outline"}
          onClick={() => setActiveTab("shop")}
          className={activeTab === "shop" ? "btn-blood" : ""}
        >
          <ShoppingBag className="w-4 h-4 mr-2" />
          Магазин
        </Button>
      </div>

      {/* Visual Settings Tab */}
      {activeTab === "visual" && (
        <div className="card-blood p-6">
          <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Візуальні налаштування
          </h2>

          <form onSubmit={handleSettingsSubmit} className="space-y-6">
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

            <div className="space-y-2">
              <Label htmlFor="member_count">Кількість учасників (на головній)</Label>
              <Input
                id="member_count"
                type="number"
                value={formData.member_count}
                onChange={(e) => setFormData({ ...formData, member_count: parseInt(e.target.value) || 0 })}
                className="bg-secondary border-border"
                placeholder="150"
              />
              <p className="text-xs text-muted-foreground">
                Відображається як "X+ учасників" на головній сторінці
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-yellow-500" />
                <div>
                  <Label htmlFor="maintenance_mode" className="text-yellow-500 font-medium">Технічна перерва</Label>
                  <p className="text-xs text-muted-foreground">
                    Тільки розробники зможуть заходити на сайт
                  </p>
                </div>
              </div>
              <Switch
                id="maintenance_mode"
                checked={formData.maintenance_mode}
                onCheckedChange={(checked) => setFormData({ ...formData, maintenance_mode: checked })}
              />
            </div>

            <Button type="submit" className="w-full btn-blood" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Зберегти"}
            </Button>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div className="card-blood p-6">
          <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
            <Key className="w-5 h-5 text-gold" />
            Безпека
          </h2>

          <form onSubmit={handleSettingsSubmit} className="space-y-6">
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
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="card-blood p-6">
          <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-primary" />
            Управління користувачами
          </h2>

          {users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Користувачів не знайдено
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-display">Користувач</th>
                    <th className="text-left py-3 px-4 font-display">Discord ID</th>
                    <th className="text-left py-3 px-4 font-display">Роль</th>
                    <th className="text-left py-3 px-4 font-display">Кастомна роль</th>
                    <th className="text-left py-3 px-4 font-display">Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const RoleIcon = roleIcons[user.role] || User;
                    const customRole = getUserCustomRole(user.id);
                    
                    return (
                      <tr key={user.id} className="border-b border-border/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            {user.username}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {user.discord_id || "-"}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`flex items-center gap-1 ${roleColors[user.role]}`}>
                            <RoleIcon className="w-4 h-4" />
                            {roleLabels[user.role] || user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {customRole ? (
                            <span style={{ color: customRole.color }} className="font-medium">
                              {customRole.display_name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Select
                              value={user.role}
                              onValueChange={(value) => updateRole(user.id, value as any)}
                              disabled={processingId === user.id}
                            >
                              <SelectTrigger className="w-28 bg-secondary">
                                {processingId === user.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <SelectValue />
                                )}
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="guest">Гість</SelectItem>
                                <SelectItem value="member">Учасник</SelectItem>
                                <SelectItem value="admin">Адмін</SelectItem>
                                <SelectItem value="developer">Розробник</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select
                              value={user.custom_role_id || "none"}
                              onValueChange={(value) => assignCustomRole(user.id, value === "none" ? null : value)}
                              disabled={processingId === user.id}
                            >
                              <SelectTrigger className="w-32 bg-secondary">
                                <SelectValue placeholder="Кастомна" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Без кастомної</SelectItem>
                                {customRoles.map((role) => (
                                  <SelectItem key={role.id} value={role.id}>
                                    <span style={{ color: role.color }}>{role.display_name}</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResetPassword(user.id, user.username)}
                              disabled={resettingPasswordId === user.id}
                              title="Скинути пароль"
                            >
                              {resettingPasswordId === user.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <KeyRound className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id, user.username)}
                              disabled={deletingUserId === user.id}
                              title="Видалити профіль"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              {deletingUserId === user.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === "roles" && (
        <div className="card-blood p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <Tag className="w-5 h-5 text-green-500" />
              Кастомні ролі
            </h2>
            <Dialog open={roleDialogOpen} onOpenChange={(open) => {
              setRoleDialogOpen(open);
              if (!open) {
                setEditingRole(null);
                resetRoleForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="btn-blood">
                  <Plus className="w-4 h-4 mr-2" />
                  Створити роль
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingRole ? "Редагувати роль" : "Створити нову роль"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Ідентифікатор (англійською)</Label>
                    <Input
                      value={roleFormData.name}
                      onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                      placeholder="kanabis"
                      className="bg-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Назва (відображення)</Label>
                    <Input
                      value={roleFormData.display_name}
                      onChange={(e) => setRoleFormData({ ...roleFormData, display_name: e.target.value })}
                      placeholder="Канабіс"
                      className="bg-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Колір</Label>
                    <div className="flex gap-3">
                      <Input
                        type="color"
                        value={roleFormData.color}
                        onChange={(e) => setRoleFormData({ ...roleFormData, color: e.target.value })}
                        className="w-16 h-10 p-1 bg-secondary"
                      />
                      <Input
                        value={roleFormData.color}
                        onChange={(e) => setRoleFormData({ ...roleFormData, color: e.target.value })}
                        className="flex-1 bg-secondary"
                      />
                      <span 
                        className="px-4 py-2 rounded font-bold"
                        style={{ color: roleFormData.color }}
                      >
                        Приклад
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3 pt-2 border-t border-border">
                    <Label className="text-base font-semibold">Права доступу</Label>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="has_admin_access">Адмін панель</Label>
                      <Switch
                        id="has_admin_access"
                        checked={roleFormData.has_admin_access}
                        onCheckedChange={(checked) => setRoleFormData({ ...roleFormData, has_admin_access: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="has_reports_access">Контракти</Label>
                      <Switch
                        id="has_reports_access"
                        checked={roleFormData.has_reports_access}
                        onCheckedChange={(checked) => setRoleFormData({ ...roleFormData, has_reports_access: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="has_news_access">Новини</Label>
                      <Switch
                        id="has_news_access"
                        checked={roleFormData.has_news_access}
                        onCheckedChange={(checked) => setRoleFormData({ ...roleFormData, has_news_access: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="has_giveaways_access">Розіграші</Label>
                      <Switch
                        id="has_giveaways_access"
                        checked={roleFormData.has_giveaways_access}
                        onCheckedChange={(checked) => setRoleFormData({ ...roleFormData, has_giveaways_access: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="has_roulette_access">Рулетка</Label>
                      <Switch
                        id="has_roulette_access"
                        checked={roleFormData.has_roulette_access}
                        onCheckedChange={(checked) => setRoleFormData({ ...roleFormData, has_roulette_access: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="can_change_username">Змінювати нікнейм</Label>
                      <Switch
                        id="can_change_username"
                        checked={roleFormData.can_change_username}
                        onCheckedChange={(checked) => setRoleFormData({ ...roleFormData, can_change_username: checked })}
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreateRole} className="w-full btn-blood" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingRole ? "Зберегти" : "Створити")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {customRoles.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Кастомних ролей ще немає
            </p>
          ) : (
            <div className="grid gap-4">
              {customRoles.map((role) => (
                <div key={role.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: role.color }}
                    />
                    <div>
                      <p className="font-semibold" style={{ color: role.color }}>
                        {role.display_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{role.name}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {role.has_admin_access && (
                        <span className="text-xs px-2 py-1 bg-gold/20 text-gold rounded">Адмін</span>
                      )}
                      {role.has_roulette_access && (
                        <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded">Рулетка</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditRole(role)}>
                      Редагувати
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRole(role.id)}
                      disabled={deletingRoleId === role.id}
                      className="text-destructive hover:text-destructive"
                    >
                      {deletingRoleId === role.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Leaders Tab */}
      {activeTab === "leaders" && (
        <div className="card-blood p-6">
          <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
            <Crown className="w-5 h-5 text-gold" />
            Редагування сторінки "Керівники Blood"
          </h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Контент (підтримується Markdown)</Label>
              <Textarea
                value={leadersContent}
                onChange={(e) => setLeadersContent(e.target.value)}
                className="bg-secondary border-border min-h-[300px] font-mono text-sm"
                placeholder="# Заголовок..."
              />
              <p className="text-xs text-muted-foreground">
                Використовуйте # для заголовків, ## для підзаголовків, - для списків, **текст** для жирного
              </p>
            </div>

            <Button onClick={handleLeadersSubmit} className="w-full btn-blood" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Зберегти контент"}
            </Button>
          </div>
        </div>
      )}

      {/* Navbar Tab */}
      {activeTab === "navbar" && (
        <div className="card-blood p-6">
          <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" />
            Назви вкладок навігації
          </h2>

          <form onSubmit={async (e) => {
            e.preventDefault();
            setIsSubmitting(true);
            try {
              const { error } = await supabase
                .from("site_settings")
                .update({ nav_labels: navLabels })
                .eq("id", 1);

              if (error) throw error;

              toast({
                title: "Навігацію оновлено",
                description: "Зміни набудуть чинності після оновлення сторінки",
              });
            } catch (error) {
              console.error("Error saving nav labels:", error);
              toast({
                title: "Помилка",
                description: "Не вдалося зберегти навігацію",
                variant: "destructive",
              });
            } finally {
              setIsSubmitting(false);
            }
          }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Головна</Label>
                <Input
                  value={navLabels.home}
                  onChange={(e) => setNavLabels({ ...navLabels, home: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Керівники Blood</Label>
                <Input
                  value={navLabels.leaders}
                  onChange={(e) => setNavLabels({ ...navLabels, leaders: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Заявка</Label>
                <Input
                  value={navLabels.apply}
                  onChange={(e) => setNavLabels({ ...navLabels, apply: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Інформація</Label>
                <Input
                  value={navLabels.info}
                  onChange={(e) => setNavLabels({ ...navLabels, info: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Контракти</Label>
                <Input
                  value={navLabels.reports}
                  onChange={(e) => setNavLabels({ ...navLabels, reports: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Новини</Label>
                <Input
                  value={navLabels.news}
                  onChange={(e) => setNavLabels({ ...navLabels, news: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Розіграші</Label>
                <Input
                  value={navLabels.giveaways}
                  onChange={(e) => setNavLabels({ ...navLabels, giveaways: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <Button type="submit" className="w-full btn-blood" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Зберегти"}
            </Button>
          </form>
        </div>
      )}

      {/* Social Media Tab */}
      {activeTab === "social" && (
        <div className="card-blood p-6">
          <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Соціальні мережі
          </h2>

          <form onSubmit={async (e) => {
            e.preventDefault();
            setIsSubmitting(true);
            try {
              const { error } = await supabase
                .from("site_settings")
                .update({
                  social_tiktok: socialLinks.social_tiktok || null,
                  social_youtube: socialLinks.social_youtube || null,
                  social_discord: socialLinks.social_discord || null,
                  social_telegram: socialLinks.social_telegram || null,
                })
                .eq("id", 1);

              if (error) throw error;

              toast({
                title: "Соц мережі оновлено",
                description: "Посилання збережено успішно",
              });
            } catch (error) {
              console.error("Error saving social links:", error);
              toast({
                title: "Помилка",
                description: "Не вдалося зберегти посилання",
                variant: "destructive",
              });
            } finally {
              setIsSubmitting(false);
            }
          }} className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <span className="text-lg">🎵</span>
                TikTok
              </Label>
              <Input
                value={socialLinks.social_tiktok}
                onChange={(e) => setSocialLinks({ ...socialLinks, social_tiktok: e.target.value })}
                className="bg-secondary border-border"
                placeholder="https://tiktok.com/@yourprofile"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <span className="text-lg">🎬</span>
                YouTube
              </Label>
              <Input
                value={socialLinks.social_youtube}
                onChange={(e) => setSocialLinks({ ...socialLinks, social_youtube: e.target.value })}
                className="bg-secondary border-border"
                placeholder="https://youtube.com/@yourchannel"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <span className="text-lg">💬</span>
                Discord
              </Label>
              <Input
                value={socialLinks.social_discord}
                onChange={(e) => setSocialLinks({ ...socialLinks, social_discord: e.target.value })}
                className="bg-secondary border-border"
                placeholder="https://discord.gg/yourserver"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <span className="text-lg">✈️</span>
                Telegram
              </Label>
              <Input
                value={socialLinks.social_telegram}
                onChange={(e) => setSocialLinks({ ...socialLinks, social_telegram: e.target.value })}
                className="bg-secondary border-border"
                placeholder="https://t.me/yourchannel"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Залиште поле порожнім, щоб приховати відповідну іконку в бічній панелі
            </p>

            <Button type="submit" className="w-full btn-blood" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Зберегти"}
            </Button>
          </form>
        </div>
      )}

      {/* BC Currency Tab */}
      {activeTab === "bc" && (
        <BCManagement users={users} onRefresh={fetchData} />
      )}

      {/* Shop History Tab */}
      {activeTab === "shop" && (
        <div className="card-blood p-6">
          <DeveloperShopHistory />
        </div>
      )}
      <ConfirmDialog />
    </div>
  );
};
