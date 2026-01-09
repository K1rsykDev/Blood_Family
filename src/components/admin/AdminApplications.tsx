import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, CheckCircle, XCircle, Loader2, User, MessageSquare, Trash2 } from "lucide-react";

interface Application {
  id: number;
  username: string;
  static: string;
  age: number;
  timezone: string;
  playtime: string;
  motive: string;
  discord_id: string | null;
  status: string;
  created_at: string;
}

export const AdminApplications = () => {
  const { profile } = useAuth();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { toast } = useToast();

  const isDeveloper = profile?.role === "developer";

  const fetchApplications = async () => {
    let query = supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter as "pending" | "accepted" | "rejected");
    }

    const { data } = await query;
    if (data) {
      setApplications(data as Application[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const updateStatus = async (id: number, status: "pending" | "accepted" | "rejected", username: string) => {
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      // If accepted, try to find and update user's profile to member role
      if (status === "accepted") {
        // Find profile by username
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", username)
          .limit(1);

        if (profiles && profiles.length > 0) {
          await supabase
            .from("profiles")
            .update({ role: "member" })
            .eq("id", profiles[0].id);
        }
      }

      await fetchApplications();
      toast({
        title: status === "accepted" ? "Заявку прийнято!" : "Заявку відхилено",
        description: status === "accepted" 
          ? "Користувача автоматично додано до сім'ї як учасника"
          : "Заявку було відхилено",
      });
    } catch (error) {
      console.error("Error updating application:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося оновити статус",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const deleteApplication = async (id: number) => {
    const confirmed = await confirm({
      title: "Видалення заявки",
      description: "Видалити цю заявку назавжди?",
      confirmText: "Видалити",
      variant: "destructive",
    });
    if (!confirmed) return;
    
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("applications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await fetchApplications();
      toast({
        title: "Заявку видалено",
      });
    } catch (error) {
      console.error("Error deleting application:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося видалити заявку",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const statusConfig = {
    pending: { label: "Очікує", color: "text-yellow-500", icon: Clock },
    accepted: { label: "Прийнято", color: "text-green-500", icon: CheckCircle },
    rejected: { label: "Відхилено", color: "text-red-500", icon: XCircle },
  };

  const playtimeLabels: Record<string, string> = {
    "daily-4h": "Щодня 4+ годин",
    "daily-2h": "Щодня 2-4 години",
    "weekends": "Тільки вихідні",
    "irregular": "Нерегулярно",
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
        <h2 className="font-display text-xl font-semibold">Заявки на вступ</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40 bg-secondary">
            <SelectValue placeholder="Фільтр" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Всі</SelectItem>
            <SelectItem value="pending">Очікують</SelectItem>
            <SelectItem value="accepted">Прийняті</SelectItem>
            <SelectItem value="rejected">Відхилені</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {applications.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Заявок не знайдено
        </p>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const status = statusConfig[app.status as keyof typeof statusConfig];
            const StatusIcon = status?.icon || Clock;

            return (
              <div
                key={app.id}
                className="p-4 bg-secondary/50 rounded-lg"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-display text-lg font-bold flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        {app.username}
                      </span>
                      <span className={`flex items-center gap-1 text-sm ${status?.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        {status?.label}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground mb-3">
                      <div><strong>Статік:</strong> {app.static}</div>
                      <div><strong>Вік:</strong> {app.age}</div>
                      <div><strong>Часовий пояс:</strong> {app.timezone}</div>
                      <div><strong>Час гри:</strong> {playtimeLabels[app.playtime] || app.playtime}</div>
                    </div>

                    {app.discord_id && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <MessageSquare className="w-4 h-4 text-[#5865F2]" />
                        <strong>Discord:</strong> {app.discord_id}
                      </div>
                    )}
                    
                    <p className="text-sm text-muted-foreground">
                      <strong>Мотивація:</strong> {app.motive}
                    </p>
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(app.created_at).toLocaleString("uk-UA")}
                    </p>
                  </div>

                  {app.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(app.id, "rejected", app.username)}
                        disabled={processingId === app.id}
                        className="border-destructive text-destructive hover:bg-destructive/10"
                      >
                        Відхилити
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateStatus(app.id, "accepted", app.username)}
                        disabled={processingId === app.id}
                        className="btn-blood"
                      >
                        {processingId === app.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Прийняти"
                        )}
                      </Button>
                    </div>
                  )}

                  {isDeveloper && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteApplication(app.id)}
                      disabled={deletingId === app.id}
                      className="text-destructive hover:bg-destructive/10 ml-2"
                    >
                      {deletingId === app.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <ConfirmDialog />
    </div>
  );
};
