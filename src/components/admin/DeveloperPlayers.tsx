import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Users, User, GripVertical, Edit, Save, X, Palmtree, Sparkles } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface PlayerProfile {
  id: string;
  username: string;
  role: string;
  custom_role_id: string | null;
  avatar_url: string | null;
  created_at: string;
  position_title: string | null;
  position_responsibility: string | null;
  position_title_color: string | null;
  sort_priority: number;
  static: string | null;
  has_nickname_glow: boolean;
  custom_roles?: {
    display_name: string;
    color: string;
  } | null;
}

interface ActiveVacation {
  user_id: string;
  end_date: string;
}

export const DeveloperPlayers = () => {
  const { toast } = useToast();
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [activeVacations, setActiveVacations] = useState<Record<string, ActiveVacation>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPlayer, setEditingPlayer] = useState<PlayerProfile | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editResponsibility, setEditResponsibility] = useState("");
  const [editTitleColor, setEditTitleColor] = useState("#ffffff");
  const [editStatic, setEditStatic] = useState("");
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState<string | null>(null);

  const presetColors = [
    "#ffffff", "#ef4444", "#f97316", "#eab308", "#22c55e", 
    "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899", "#f43f5e"
  ];

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

  useEffect(() => {
    fetchPlayers();
    fetchActiveVacations();
  }, []);

  const fetchPlayers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select(`
        id, username, role, custom_role_id, avatar_url, created_at,
        position_title, position_responsibility, position_title_color, sort_priority, static, has_nickname_glow,
        custom_roles(display_name, color)
      `)
      .neq("role", "guest")
      .order("sort_priority", { ascending: false })
      .order("created_at", { ascending: false });

    if (data) {
      setPlayers(data as PlayerProfile[]);
    }
    setLoading(false);
  };

  const fetchActiveVacations = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("vacations")
      .select("user_id, end_date")
      .eq("status", "approved")
      .lte("start_date", today)
      .gte("end_date", today);

    if (data) {
      const vacationsMap: Record<string, ActiveVacation> = {};
      data.forEach((v) => {
        vacationsMap[v.user_id] = v;
      });
      setActiveVacations(vacationsMap);
    }
  };

  const filteredPlayers = players.filter((player) =>
    player.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openEditDialog = (player: PlayerProfile) => {
    setEditingPlayer(player);
    setEditTitle(player.position_title || "");
    setEditResponsibility(player.position_responsibility || "");
    setEditTitleColor(player.position_title_color || "#ffffff");
    setEditStatic(player.static || "");
  };

  const savePlayerPosition = async () => {
    if (!editingPlayer) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          position_title: editTitle.trim() || null,
          position_responsibility: editResponsibility.trim() || null,
          position_title_color: editTitleColor,
          static: editStatic.trim() || null,
        })
        .eq("id", editingPlayer.id);

      if (error) throw error;

      toast({ title: "Збережено" });
      setEditingPlayer(null);
      fetchPlayers();
    } catch (error) {
      console.error("Error saving position:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося зберегти",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const movePlayer = async (playerId: string, direction: "up" | "down") => {
    setReordering(playerId);

    const playerIndex = players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) {
      setReordering(null);
      return;
    }

    const targetIndex = direction === "up" ? playerIndex - 1 : playerIndex + 1;
    if (targetIndex < 0 || targetIndex >= players.length) {
      setReordering(null);
      return;
    }

    const currentPlayer = players[playerIndex];
    const targetPlayer = players[targetIndex];

    try {
      // Always swap priorities between the two players
      const currentPriority = currentPlayer.sort_priority;
      const targetPriority = targetPlayer.sort_priority;

      // If priorities are the same, assign unique values based on direction
      if (currentPriority === targetPriority) {
        const newCurrentPriority = direction === "up" ? targetPriority + 1 : targetPriority - 1;
        
        await supabase
          .from("profiles")
          .update({ sort_priority: newCurrentPriority })
          .eq("id", currentPlayer.id);
      } else {
        // Swap priorities - update both in parallel
        await Promise.all([
          supabase
            .from("profiles")
            .update({ sort_priority: targetPriority })
            .eq("id", currentPlayer.id),
          supabase
            .from("profiles")
            .update({ sort_priority: currentPriority })
            .eq("id", targetPlayer.id)
        ]);
      }

      await fetchPlayers();
    } catch (error) {
      console.error("Error reordering:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося змінити порядок",
        variant: "destructive",
      });
    } finally {
      setReordering(null);
    }
  };

  const setPlayerPriority = async (playerId: string, priority: number) => {
    setReordering(playerId);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ sort_priority: priority })
        .eq("id", playerId);

      if (error) throw error;
      fetchPlayers();
    } catch (error) {
      console.error("Error setting priority:", error);
      toast({
        title: "Помилка",
        variant: "destructive",
      });
    } finally {
      setReordering(null);
    }
  };

  const toggleNicknameGlow = async (playerId: string, value: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ has_nickname_glow: value })
        .eq("id", playerId);

      if (error) throw error;

      toast({
        title: value ? "Світіння додано" : "Світіння забрано",
      });
      fetchPlayers();
    } catch (error) {
      console.error("Error toggling glow:", error);
      toast({
        title: "Помилка",
        variant: "destructive",
      });
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Управління гравцями ({filteredPlayers.length})
        </h3>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Пошук за нікнеймом..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-secondary"
        />
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead className="w-16">Порядок</TableHead>
              <TableHead>Гравець</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>Статик</TableHead>
              <TableHead>Посада</TableHead>
              <TableHead>Відповідальність</TableHead>
              <TableHead className="text-right">Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlayers.map((player) => {
              const playerIndex = players.findIndex(p => p.id === player.id);
              return (
              <TableRow key={player.id} className="hover:bg-secondary/30">
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => movePlayer(player.id, "up")}
                      disabled={playerIndex === 0 || reordering === player.id}
                    >
                      {reordering === player.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <span className="text-xs">▲</span>
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => movePlayer(player.id, "down")}
                      disabled={playerIndex === players.length - 1 || reordering === player.id}
                    >
                      <span className="text-xs">▼</span>
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {player.avatar_url ? (
                      <img
                        src={player.avatar_url}
                        alt={player.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{player.username}</span>
                      {player.has_nickname_glow && (
                        <Sparkles className="w-3 h-3 text-yellow-500" />
                      )}
                      {activeVacations[player.id] && (
                        <span className="flex items-center gap-1 text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded">
                          <Palmtree className="w-3 h-3" />
                          Відпустка
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {player.custom_roles ? (
                    <span style={{ color: player.custom_roles.color }}>
                      {player.custom_roles.display_name}
                    </span>
                  ) : (
                    <span className={roleColors[player.role] || "text-muted-foreground"}>
                      {roleLabels[player.role] || player.role}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {player.static ? (
                    <span className="text-sm font-mono text-primary">
                      {player.static}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {player.position_title ? (
                    <span className="text-sm font-medium" style={{ color: player.position_title_color || "#ffffff" }}>
                      {player.position_title}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell className="max-w-xs">
                  {player.position_responsibility ? (
                    <span className="text-sm truncate block">
                      {player.position_responsibility}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {player.has_nickname_glow && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleNicknameGlow(player.id, false)}
                        title="Забрати світіння"
                        className="text-yellow-500 hover:text-yellow-400"
                      >
                        <Sparkles className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(player)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/profile/${player.id}`}>Профіль</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {filteredPlayers.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          Гравців не знайдено
        </p>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingPlayer} onOpenChange={() => setEditingPlayer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редагування посади: {editingPlayer?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Посада</Label>
              <div className="flex gap-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Наприклад: Заступник лідера"
                  className="bg-secondary flex-1"
                  style={{ color: editTitleColor, borderColor: editTitleColor }}
                  maxLength={100}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Колір посади</Label>
              <div className="flex gap-2 flex-wrap">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setEditTitleColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      editTitleColor === color ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110" : "border-border hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input
                  type="color"
                  value={editTitleColor}
                  onChange={(e) => setEditTitleColor(e.target.value)}
                  className="w-8 h-8 rounded-full cursor-pointer border-2 border-border"
                  title="Вибрати інший колір"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Статик на сервері</Label>
              <Input
                value={editStatic}
                onChange={(e) => setEditStatic(e.target.value)}
                placeholder="Наприклад: 12345"
                className="bg-secondary"
                maxLength={20}
              />
            </div>
            <div className="space-y-2">
              <Label>За що відповідає</Label>
              <Textarea
                value={editResponsibility}
                onChange={(e) => setEditResponsibility(e.target.value)}
                placeholder="Опишіть обов'язки..."
                className="bg-secondary min-h-[100px]"
                maxLength={500}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={savePlayerPosition}
                disabled={saving}
                className="flex-1 btn-blood"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Зберегти
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditingPlayer(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
