import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Coins, Send, User, Sparkles, Palette, X } from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
}

interface BCManagementProps {
  users: UserProfile[];
  onRefresh: () => Promise<void>;
}

export const BCManagement = ({ users, onRefresh }: BCManagementProps) => {
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [bcAmount, setBcAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userBalances, setUserBalances] = useState<Record<string, number>>({});
  const [loadingBalances, setLoadingBalances] = useState(false);

  // Gradient nickname state
  const [gradientUserId, setGradientUserId] = useState<string>("");
  const [gradientStart, setGradientStart] = useState("#facc15");
  const [gradientEnd, setGradientEnd] = useState("#ec4899");
  const [isUpdatingGradient, setIsUpdatingGradient] = useState(false);
  const [currentGradient, setCurrentGradient] = useState<{ start: string | null; end: string | null }>({ start: null, end: null });

  const fetchUserBalance = async (userId: string) => {
    if (userBalances[userId] !== undefined) return;
    
    setLoadingBalances(true);
    const { data } = await supabase
      .from("profiles")
      .select("bc_balance")
      .eq("id", userId)
      .single();
    
    if (data) {
      setUserBalances(prev => ({ ...prev, [userId]: (data as any).bc_balance || 0 }));
    }
    setLoadingBalances(false);
  };

  const fetchUserGradient = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("nickname_gradient_start, nickname_gradient_end")
      .eq("id", userId)
      .single();
    
    if (data) {
      setCurrentGradient({
        start: (data as any).nickname_gradient_start || null,
        end: (data as any).nickname_gradient_end || null,
      });
      if ((data as any).nickname_gradient_start) {
        setGradientStart((data as any).nickname_gradient_start);
      }
      if ((data as any).nickname_gradient_end) {
        setGradientEnd((data as any).nickname_gradient_end);
      }
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    fetchUserBalance(userId);
  };

  const handleGradientUserSelect = (userId: string) => {
    setGradientUserId(userId);
    fetchUserGradient(userId);
  };

  const handleGiveBC = async () => {
    if (!selectedUserId || !bcAmount) {
      toast({
        title: "Помилка",
        description: "Виберіть користувача та введіть кількість BC",
        variant: "destructive",
      });
      return;
    }

    const amount = parseInt(bcAmount);
    if (isNaN(amount) || amount === 0) {
      toast({
        title: "Помилка",
        description: "Введіть коректну кількість BC",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current balance
      const { data: profileData } = await supabase
        .from("profiles")
        .select("bc_balance")
        .eq("id", selectedUserId)
        .single();

      const currentBalance = (profileData as any)?.bc_balance || 0;
      const newBalance = currentBalance + amount;

      if (newBalance < 0) {
        toast({
          title: "Помилка",
          description: "Баланс не може бути від'ємним",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Update balance
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ bc_balance: newBalance })
        .eq("id", selectedUserId);

      if (updateError) throw updateError;

      // Record transaction
      await supabase
        .from("bc_transactions")
        .insert({
          user_id: selectedUserId,
          amount: amount,
          type: "admin_grant",
          description: description || (amount > 0 ? "Нараховано розробником" : "Знято розробником"),
        });

      // Update local state
      setUserBalances(prev => ({ ...prev, [selectedUserId]: newBalance }));

      toast({
        title: amount > 0 ? "BC нараховано" : "BC знято",
        description: `${amount > 0 ? "+" : ""}${amount} BC для ${users.find(u => u.id === selectedUserId)?.username}`,
      });

      setBcAmount("");
      setDescription("");
    } catch (error) {
      console.error("Error giving BC:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося нарахувати BC",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetGradient = async () => {
    if (!gradientUserId) {
      toast({
        title: "Помилка",
        description: "Виберіть користувача",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingGradient(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          nickname_gradient_start: gradientStart,
          nickname_gradient_end: gradientEnd,
          has_nickname_glow: true,
        })
        .eq("id", gradientUserId);

      if (error) throw error;

      setCurrentGradient({ start: gradientStart, end: gradientEnd });

      toast({
        title: "Градієнт встановлено",
        description: `Градієнтний нікнейм для ${users.find(u => u.id === gradientUserId)?.username}`,
      });
    } catch (error) {
      console.error("Error setting gradient:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося встановити градієнт",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingGradient(false);
    }
  };

  const handleRemoveGradient = async () => {
    if (!gradientUserId) return;

    setIsUpdatingGradient(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          nickname_gradient_start: null,
          nickname_gradient_end: null,
          has_nickname_glow: false,
        })
        .eq("id", gradientUserId);

      if (error) throw error;

      setCurrentGradient({ start: null, end: null });

      toast({
        title: "Градієнт видалено",
        description: `Градієнт знято з ${users.find(u => u.id === gradientUserId)?.username}`,
      });
    } catch (error) {
      console.error("Error removing gradient:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося видалити градієнт",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingGradient(false);
    }
  };

  const selectedUsername = users.find(u => u.id === gradientUserId)?.username || "Користувач";

  return (
    <div className="space-y-6">
      {/* BC Management */}
      <div className="card-blood p-6">
        <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
          <Coins className="w-5 h-5 text-yellow-500" />
          Управління BC валютою
        </h2>

        <div className="space-y-6">
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <h3 className="font-semibold text-yellow-500 mb-2">Інформація</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• При виплаті контракту гравець отримує 100 BC автоматично</li>
              <li>• Підсвічування нікнейму коштує 5000 BC в магазині</li>
              <li>• Введіть від'ємне число щоб зняти BC</li>
            </ul>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Виберіть користувача</Label>
              <Select value={selectedUserId} onValueChange={handleUserSelect}>
                <SelectTrigger className="bg-secondary">
                  <SelectValue placeholder="Виберіть користувача" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {user.username}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedUserId && (
              <div className="p-3 bg-secondary/50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Поточний баланс:</span>
                <span className="font-display text-lg font-bold text-yellow-500 flex items-center gap-1">
                  <Coins className="w-4 h-4" />
                  {loadingBalances ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    `${(userBalances[selectedUserId] || 0).toLocaleString()} BC`
                  )}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => setBcAmount("-100")}
                className="border-red-500/50 text-red-500 hover:bg-red-500/10"
              >
                -100 BC
              </Button>
              <Button
                variant="outline"
                onClick={() => setBcAmount("100")}
                className="border-green-500/50 text-green-500 hover:bg-green-500/10"
              >
                +100 BC
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Кількість BC</Label>
              <Input
                type="number"
                value={bcAmount}
                onChange={(e) => setBcAmount(e.target.value)}
                placeholder="Введіть кількість (може бути від'ємним)"
                className="bg-secondary"
              />
            </div>

            <div className="space-y-2">
              <Label>Опис (необов'язково)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Причина нарахування"
                className="bg-secondary"
              />
            </div>

            <Button
              onClick={handleGiveBC}
              disabled={isSubmitting || !selectedUserId || !bcAmount}
              className="w-full btn-blood"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {bcAmount && parseInt(bcAmount) < 0 ? "Зняти BC" : "Нарахувати BC"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Gradient Nickname Management */}
      <div className="card-blood p-6">
        <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-pink-500" />
          Градієнтний нікнейм
        </h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Виберіть користувача</Label>
            <Select value={gradientUserId} onValueChange={handleGradientUserSelect}>
              <SelectTrigger className="bg-secondary">
                <SelectValue placeholder="Виберіть користувача" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {user.username}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {gradientUserId && (
            <>
              {/* Preview */}
              <div className="p-4 bg-secondary/50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-2">Попередній перегляд:</p>
                <span
                  className="font-display text-2xl font-bold"
                  style={{
                    background: `linear-gradient(90deg, ${gradientStart}, ${gradientEnd})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {selectedUsername}
                </span>
              </div>

              {/* Color Pickers */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Початковий колір
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={gradientStart}
                      onChange={(e) => setGradientStart(e.target.value)}
                      className="w-14 h-10 p-1 bg-secondary"
                    />
                    <Input
                      value={gradientStart}
                      onChange={(e) => setGradientStart(e.target.value)}
                      className="flex-1 bg-secondary font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Кінцевий колір
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={gradientEnd}
                      onChange={(e) => setGradientEnd(e.target.value)}
                      className="w-14 h-10 p-1 bg-secondary"
                    />
                    <Input
                      value={gradientEnd}
                      onChange={(e) => setGradientEnd(e.target.value)}
                      className="flex-1 bg-secondary font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Current gradient info */}
              {currentGradient.start && (
                <div className="p-3 bg-pink-500/10 border border-pink-500/20 rounded-lg">
                  <p className="text-sm text-pink-400">
                    Поточний градієнт: {currentGradient.start} → {currentGradient.end}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={handleRemoveGradient}
                  disabled={isUpdatingGradient || !currentGradient.start}
                  variant="outline"
                  className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                >
                  {isUpdatingGradient ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      Видалити
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleSetGradient}
                  disabled={isUpdatingGradient}
                  className="btn-blood"
                >
                  {isUpdatingGradient ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Встановити
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
