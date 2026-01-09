import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Sparkles, Loader2, Coins, Gift, Crown, Star, Zap, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { GlowColorPicker } from "@/components/shop/GlowColorPicker";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  field: string;
  icon: string;
  is_active: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  sparkles: <Sparkles className="w-8 h-8 text-yellow-400" />,
  gift: <Gift className="w-8 h-8 text-pink-400" />,
  crown: <Crown className="w-8 h-8 text-yellow-500" />,
  star: <Star className="w-8 h-8 text-blue-400" />,
  zap: <Zap className="w-8 h-8 text-purple-400" />,
  heart: <Heart className="w-8 h-8 text-red-400" />,
};

const Shop = () => {
  const { user, profile, isLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [bcBalance, setBcBalance] = useState(0);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [ownedItems, setOwnedItems] = useState<Record<string, boolean>>({});
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingGlowItem, setPendingGlowItem] = useState<ShopItem | null>(null);

  const isMember = profile?.role === "member" || profile?.role === "admin" || profile?.role === "developer";

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!isMember) {
      navigate("/");
    }
  }, [user, profile, isLoading, navigate, isMember]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      // Fetch balance and profile data
      const { data: profileData } = await supabase
        .from("profiles")
        .select("bc_balance, has_nickname_glow")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setBcBalance((profileData as any).bc_balance || 0);
        // Store owned items based on profile fields
        setOwnedItems({
          has_nickname_glow: (profileData as any).has_nickname_glow || false,
        });
      }

      // Fetch shop items
      const { data: items } = await supabase
        .from("shop_items")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (items) {
        setShopItems(items);
      }
      
      setLoadingBalance(false);
    };

    fetchData();
  }, [user]);

  const handlePurchase = async (item: ShopItem) => {
    if (!user) return;
    
    if (bcBalance < item.price) {
      toast({
        title: "Недостатньо BC",
        description: `Вам потрібно ${item.price} BC для цієї покупки`,
        variant: "destructive",
      });
      return;
    }

    // Check if already owned
    if (ownedItems[item.field]) {
      toast({
        title: "Вже куплено",
        description: "Ви вже маєте цей предмет",
        variant: "destructive",
      });
      return;
    }

    // If this is a nickname glow purchase, show color picker
    if (item.field === "has_nickname_glow") {
      setPendingGlowItem(item);
      setShowColorPicker(true);
      return;
    }

    // For other items, proceed with regular confirm dialog
    await processPurchase(item);
  };

  const processPurchase = async (item: ShopItem, glowColors?: { start: string; end: string }) => {
    if (!user) return;

    const confirmed = await confirm({
      title: "Підтвердження покупки",
      description: `Купити "${item.name}" за ${item.price} BC?`,
      confirmText: "Купити",
    });

    if (!confirmed) return;

    await executePurchase(item, glowColors);
  };

  const executePurchase = async (item: ShopItem, glowColors?: { start: string; end: string }) => {
    if (!user) return;

    setPurchasing(item.id);

    try {
      // Deduct BC and update profile
      const newBalance = bcBalance - item.price;
      
      const updateData: Record<string, any> = { 
        bc_balance: newBalance,
        [item.field]: true 
      };

      // Add glow colors if provided
      if (glowColors) {
        updateData.nickname_gradient_start = glowColors.start;
        updateData.nickname_gradient_end = glowColors.end;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Record transaction
      await supabase
        .from("bc_transactions")
        .insert({
          user_id: user.id,
          amount: -item.price,
          type: "shop_purchase",
          description: item.name,
        });

      setBcBalance(newBalance);
      setOwnedItems(prev => ({ ...prev, [item.field]: true }));
      await refreshProfile();

      toast({
        title: "Покупка успішна!",
        description: `Ви придбали "${item.name}"`,
      });
    } catch (error) {
      console.error("Error purchasing item:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося здійснити покупку",
        variant: "destructive",
      });
    } finally {
      setPurchasing(null);
    }
  };

  const handleGlowColorConfirm = async (startColor: string, endColor: string) => {
    if (!pendingGlowItem) return;
    await executePurchase(pendingGlowItem, { start: startColor, end: endColor });
    setPendingGlowItem(null);
  };

  if (isLoading || loadingBalance) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <ShoppingBag className="w-12 h-12 mx-auto text-primary mb-4" />
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Магазин
            </h1>
            <p className="text-muted-foreground mb-4">
              Витрачай BC на унікальні предмети
            </p>
            <div className="inline-flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-full">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="font-display text-xl font-bold text-yellow-500">
                {bcBalance.toLocaleString()} BC
              </span>
            </div>
          </div>

          {shopItems.length === 0 ? (
            <div className="text-center py-12 card-blood">
              <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">Магазин порожній</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {shopItems.map((item) => {
                const isOwned = ownedItems[item.field];
                return (
                  <div key={item.id} className="card-blood p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-secondary/50 rounded-lg">
                        {iconMap[item.icon] || <Sparkles className="w-8 h-8 text-yellow-400" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display text-lg font-bold mb-1">
                          {item.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {item.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-yellow-500 font-semibold">
                            <Coins className="w-4 h-4" />
                            {item.price.toLocaleString()} BC
                          </div>
                          {isOwned ? (
                            <span className="text-green-500 font-medium text-sm">
                              ✓ Куплено
                            </span>
                          ) : (
                            <Button
                              onClick={() => handlePurchase(item)}
                              disabled={purchasing === item.id || bcBalance < item.price}
                              className="btn-blood"
                            >
                              {purchasing === item.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "Купити"
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-8 card-blood p-6">
            <h3 className="font-display text-lg font-bold mb-4">Як отримати BC?</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full" />
                При виплаті контракту ви отримуєте 200 BC
              </li>
            </ul>
          </div>
        </div>
      </div>
      <ConfirmDialog />
      <GlowColorPicker
        open={showColorPicker}
        onOpenChange={(open) => {
          setShowColorPicker(open);
          if (!open) setPendingGlowItem(null);
        }}
        onConfirm={handleGlowColorConfirm}
        username={profile?.username || "Username"}
      />
    </Layout>
  );
};

export default Shop;
