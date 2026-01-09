import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Loader2, Gift, Users, Trophy, Sparkles } from "lucide-react";

interface Giveaway {
  id: number;
  title: string;
  description: string;
  prize: string;
  image_url: string | null;
  ends_at: string;
  is_active: boolean;
  winner_id: string | null;
}

interface Participant {
  id: string;
  user_id: string;
  giveaway_id: number;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

export const AdminGiveaways = () => {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Giveaway | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [participantsDialogOpen, setParticipantsDialogOpen] = useState(false);
  const [selectedGiveaway, setSelectedGiveaway] = useState<Giveaway | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [pickingWinner, setPickingWinner] = useState(false);
  const [winner, setWinner] = useState<Participant | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    prize: "",
    image_url: "",
    ends_at: "",
    is_active: true,
  });

  const fetchGiveaways = async () => {
    const { data } = await supabase
      .from("giveaways")
      .select("*")
      .order("ends_at", { ascending: false });

    if (data) {
      setGiveaways(data as Giveaway[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGiveaways();
  }, []);

  const openDialog = (item?: Giveaway) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        description: item.description,
        prize: item.prize,
        image_url: item.image_url || "",
        ends_at: item.ends_at.split("T")[0],
        is_active: item.is_active,
      });
    } else {
      setEditingItem(null);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 7);
      setFormData({
        title: "",
        description: "",
        prize: "",
        image_url: "",
        ends_at: tomorrow.toISOString().split("T")[0],
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        prize: formData.prize,
        image_url: formData.image_url || null,
        ends_at: new Date(formData.ends_at).toISOString(),
        is_active: formData.is_active,
      };

      if (editingItem) {
        const { error } = await supabase
          .from("giveaways")
          .update(payload)
          .eq("id", editingItem.id);

        if (error) throw error;
        toast({ title: "Розіграш оновлено" });
      } else {
        const { error } = await supabase
          .from("giveaways")
          .insert([payload]);

        if (error) throw error;
        toast({ title: "Розіграш створено" });
      }

      await fetchGiveaways();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving giveaway:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося зберегти розіграш",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteItem = async (id: number) => {
    const confirmed = await confirm({
      title: "Видалення розіграшу",
      description: "Ви впевнені, що хочете видалити цей розіграш?",
      confirmText: "Видалити",
      variant: "destructive",
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase.from("giveaways").delete().eq("id", id);
      if (error) throw error;

      await fetchGiveaways();
      toast({ title: "Розіграш видалено" });
    } catch (error) {
      console.error("Error deleting giveaway:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося видалити розіграш",
        variant: "destructive",
      });
    }
  };

  const openParticipantsDialog = async (giveaway: Giveaway) => {
    setSelectedGiveaway(giveaway);
    setParticipantsDialogOpen(true);
    setLoadingParticipants(true);
    setWinner(null);

    try {
      const { data } = await supabase
        .from("giveaway_participants")
        .select("id, user_id, giveaway_id, profiles(username, avatar_url)")
        .eq("giveaway_id", giveaway.id);

      if (data) {
        setParticipants(data as unknown as Participant[]);
        
        // Check if there's already a winner
        if (giveaway.winner_id) {
          const winnerParticipant = data.find(p => p.user_id === giveaway.winner_id);
          if (winnerParticipant) {
            setWinner(winnerParticipant as unknown as Participant);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching participants:", error);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const pickWinner = async () => {
    if (!selectedGiveaway || participants.length === 0) return;
    
    setPickingWinner(true);
    
    // Animation - cycle through participants
    const animationDuration = 3000;
    const intervalTime = 100;
    let elapsed = 0;
    
    const interval = setInterval(() => {
      elapsed += intervalTime;
      const randomIndex = Math.floor(Math.random() * participants.length);
      setWinner(participants[randomIndex]);
      
      if (elapsed >= animationDuration) {
        clearInterval(interval);
        
        // Final winner selection
        const finalWinner = participants[Math.floor(Math.random() * participants.length)];
        setWinner(finalWinner);
        
        // Save winner to database
        supabase
          .from("giveaways")
          .update({ winner_id: finalWinner.user_id })
          .eq("id", selectedGiveaway.id)
          .then(({ error }) => {
            if (error) {
              console.error("Error saving winner:", error);
              toast({ title: "Помилка збереження переможця", variant: "destructive" });
            } else {
              toast({ title: `Переможець: ${finalWinner.profiles.username}!` });
              fetchGiveaways();
            }
          });
        
        setPickingWinner(false);
      }
    }, intervalTime);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="card-blood p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-semibold">Розіграші</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()} className="btn-blood">
              <Plus className="w-4 h-4 mr-2" />
              Додати
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingItem ? "Редагувати розіграш" : "Новий розіграш"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Назва</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-secondary border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Опис</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-secondary border-border resize-none"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prize">Приз</Label>
                <Input
                  id="prize"
                  value={formData.prize}
                  onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
                  className="bg-secondary border-border"
                  placeholder="$50,000 + Sultan RS"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image_url">URL зображення (опційно)</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="bg-secondary border-border"
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ends_at">Дата завершення</Label>
                <Input
                  id="ends_at"
                  type="date"
                  value={formData.ends_at}
                  onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                  className="bg-secondary border-border"
                  required
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Активний</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
              <Button type="submit" className="w-full btn-blood" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Зберегти"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {giveaways.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Розіграшів не знайдено
        </p>
      ) : (
        <div className="space-y-4">
          {giveaways.map((item) => (
            <div key={item.id} className="p-4 bg-secondary/50 rounded-lg flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Gift className={`w-4 h-4 ${item.is_active ? "text-gold" : "text-muted-foreground"}`} />
                  <h3 className="font-display font-semibold">{item.title}</h3>
                  {!item.is_active && (
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">Неактивний</span>
                  )}
                  {item.winner_id && (
                    <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      Переможець визначений
                    </span>
                  )}
                </div>
                <p className="text-sm text-primary mb-1">{item.prize}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Закінчується: {new Date(item.ends_at).toLocaleDateString("uk-UA")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="icon" variant="ghost" onClick={() => openParticipantsDialog(item)} title="Учасники">
                  <Users className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => openDialog(item)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => deleteItem(item.id)} className="text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Participants Dialog */}
      <Dialog open={participantsDialogOpen} onOpenChange={setParticipantsDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Users className="w-5 h-5" />
              Учасники: {selectedGiveaway?.title}
            </DialogTitle>
          </DialogHeader>
          
          {loadingParticipants ? (
            <div className="py-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            </div>
          ) : participants.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Ще немає учасників
            </p>
          ) : (
            <div className="space-y-4">
              <div className="max-h-64 overflow-y-auto space-y-2">
                {participants.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      winner?.user_id === p.user_id
                        ? "bg-gold/20 border border-gold/50"
                        : "bg-secondary/50"
                    }`}
                  >
                    {p.profiles.avatar_url ? (
                      <img
                        src={p.profiles.avatar_url}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                        {p.profiles.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium">{p.profiles.username}</span>
                    {winner?.user_id === p.user_id && (
                      <Trophy className="w-4 h-4 text-gold ml-auto" />
                    )}
                  </div>
                ))}
              </div>

              {winner && !pickingWinner && (
                <div className="bg-gold/20 border border-gold/50 rounded-lg p-4 text-center">
                  <Trophy className="w-8 h-8 text-gold mx-auto mb-2" />
                  <p className="font-display font-bold text-lg">
                    Переможець: {winner.profiles.username}
                  </p>
                </div>
              )}

              {!selectedGiveaway?.winner_id && participants.length > 0 && (
                <Button
                  onClick={pickWinner}
                  disabled={pickingWinner}
                  className="w-full btn-blood"
                >
                  {pickingWinner ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                      Визначаємо переможця...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Визначити переможця
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog />
    </div>
  );
};