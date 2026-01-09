import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { Loader2, ShoppingBag, User, Plus, Pencil, Trash2, Sparkles, Gift, Crown, Star, Zap, Heart } from "lucide-react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  field: string;
  icon: string;
  is_active: boolean;
  created_at: string;
}

interface ShopTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
}

const iconOptions = [
  { value: "sparkles", label: "Sparkles", icon: Sparkles },
  { value: "gift", label: "Gift", icon: Gift },
  { value: "crown", label: "Crown", icon: Crown },
  { value: "star", label: "Star", icon: Star },
  { value: "zap", label: "Zap", icon: Zap },
  { value: "heart", label: "Heart", icon: Heart },
];

const getIconComponent = (iconName: string) => {
  const found = iconOptions.find(i => i.value === iconName);
  return found ? found.icon : Sparkles;
};

export const DeveloperShopHistory = () => {
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [transactions, setTransactions] = useState<ShopTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 1000,
    field: "",
    icon: "sparkles",
    is_active: true,
  });

  const fetchData = async () => {
    const [itemsRes, transactionsRes] = await Promise.all([
      supabase
        .from("shop_items")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("bc_transactions")
        .select(`
          id, user_id, amount, type, description, created_at,
          profiles(username, avatar_url)
        `)
        .eq("type", "shop_purchase")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    if (itemsRes.data) setItems(itemsRes.data);
    if (transactionsRes.data) setTransactions(transactionsRes.data as ShopTransaction[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 1000,
      field: "",
      icon: "sparkles",
      is_active: true,
    });
    setEditingItem(null);
  };

  const openEditDialog = (item: ShopItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      field: item.field,
      icon: item.icon,
      is_active: item.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.field.trim()) {
      toast({
        title: "Помилка",
        description: "Заповніть всі обов'язкові поля",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        const { error } = await supabase
          .from("shop_items")
          .update({
            name: formData.name,
            description: formData.description,
            price: formData.price,
            field: formData.field,
            icon: formData.icon,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingItem.id);

        if (error) throw error;
        toast({ title: "Товар оновлено" });
      } else {
        const { error } = await supabase
          .from("shop_items")
          .insert({
            name: formData.name,
            description: formData.description,
            price: formData.price,
            field: formData.field,
            icon: formData.icon,
            is_active: formData.is_active,
          });

        if (error) throw error;
        toast({ title: "Товар додано" });
      }

      setDialogOpen(false);
      resetForm();
      await fetchData();
    } catch (error) {
      console.error("Error saving item:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося зберегти товар",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item: ShopItem) => {
    const confirmed = await confirm({
      title: "Видалення товару",
      description: `Видалити "${item.name}"?`,
      confirmText: "Видалити",
      variant: "destructive",
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("shop_items")
        .delete()
        .eq("id", item.id);

      if (error) throw error;
      toast({ title: "Товар видалено" });
      await fetchData();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося видалити товар",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="items" className="w-full">
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="items">Товари</TabsTrigger>
          <TabsTrigger value="history">Історія покупок</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold">
              Товари магазину ({items.length})
            </h3>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="btn-blood">
                  <Plus className="w-4 h-4 mr-2" />
                  Додати товар
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Редагувати товар" : "Новий товар"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Назва *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-secondary"
                      placeholder="Підсвічування нікнейму"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Опис</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="bg-secondary"
                      placeholder="Опис товару..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Ціна (BC) *</Label>
                      <Input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                        className="bg-secondary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Іконка</Label>
                      <Select
                        value={formData.icon}
                        onValueChange={(value) => setFormData({ ...formData, icon: value })}
                      >
                        <SelectTrigger className="bg-secondary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {iconOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <div className="flex items-center gap-2">
                                <opt.icon className="w-4 h-4" />
                                {opt.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Поле профілю *</Label>
                    <Input
                      value={formData.field}
                      onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                      className="bg-secondary"
                      placeholder="has_nickname_glow"
                    />
                    <p className="text-xs text-muted-foreground">
                      Назва поля в таблиці profiles яке буде встановлено в true
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Активний</Label>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full btn-blood"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editingItem ? (
                      "Зберегти"
                    ) : (
                      "Додати"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Немає товарів</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const IconComponent = getIconComponent(item.icon);
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-4 bg-secondary/30 rounded-lg border border-border/50 ${!item.is_active ? 'opacity-50' : ''}`}
                  >
                    <div className="p-2 bg-secondary rounded-lg">
                      <IconComponent className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{item.name}</p>
                        {!item.is_active && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded">Неактивний</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {item.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Поле: <code className="bg-secondary px-1 rounded">{item.field}</code>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm text-yellow-500 font-bold">
                        {item.price.toLocaleString()} BC
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(item)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h3 className="font-display text-lg font-bold">Історія покупок</h3>
            <span className="text-sm text-muted-foreground">
              ({transactions.length} покупок)
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Ще немає покупок</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-border/50"
                >
                  {tx.profiles?.avatar_url ? (
                    <img
                      src={tx.profiles.avatar_url}
                      alt={tx.profiles.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {tx.profiles?.username || "Невідомий"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {tx.description || "Покупка в магазині"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-yellow-500">
                      {Math.abs(tx.amount).toLocaleString()} BC
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(tx.created_at), "dd.MM.yy HH:mm", { locale: uk })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      <ConfirmDialog />
    </div>
  );
};
