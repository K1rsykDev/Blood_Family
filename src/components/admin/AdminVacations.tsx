import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Palmtree, Check, X, Clock, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
interface Vacation {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  created_at: string;
  vacation_type: string;
  profiles: {
    username: string;
  };
}

export const AdminVacations = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  
  const isDeveloper = profile?.role === "developer";

  useEffect(() => {
    fetchVacations();
  }, []);

  const fetchVacations = async () => {
    const { data } = await supabase
      .from("vacations")
      .select("*, profiles!vacations_user_id_fkey(username)")
      .order("created_at", { ascending: false }) as { data: Vacation[] | null };

    if (data) {
      setVacations(data as Vacation[]);
    }
    setLoading(false);
  };

  const handleVacation = async (id: string, approved: boolean) => {
    setProcessing(id);

    try {
      const { error } = await supabase
        .from("vacations")
        .update({
          status: approved ? "approved" : "rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: approved ? "Відпустку схвалено" : "Відпустку відхилено",
      });

      fetchVacations();
    } catch (error) {
      console.error("Error processing vacation:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося обробити заявку",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
      </div>
    );
  }

  const pendingVacations = vacations.filter((v) => v.status === "pending");
  const activeVacations = vacations.filter((v) => {
    const today = new Date().toISOString().split("T")[0];
    return v.status === "approved" && v.end_date >= today && v.start_date <= today;
  });
  const processedVacations = vacations.filter((v) => v.status !== "pending");

  const cancelVacation = async (id: string) => {
    setProcessing(id);
    try {
      const { error } = await supabase
        .from("vacations")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Відпустку скасовано",
      });

      fetchVacations();
    } catch (error) {
      console.error("Error cancelling vacation:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося скасувати відпустку",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const deleteVacation = async (id: string) => {
    if (!confirm("Ви впевнені, що хочете видалити цю відпустку?")) return;
    
    setProcessing(id);
    try {
      const { error } = await supabase
        .from("vacations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Відпустку видалено",
      });

      fetchVacations();
    } catch (error) {
      console.error("Error deleting vacation:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося видалити відпустку",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="font-display text-lg font-semibold flex items-center gap-2">
        <Palmtree className="w-5 h-5 text-primary" />
        Управління відпустками
      </h3>

      {pendingVacations.length === 0 && processedVacations.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Заявок на відпустку немає
        </p>
      ) : (
        <>
          {activeVacations.length > 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2 text-green-500">
                <Palmtree className="w-4 h-4" />
                Зараз у відпустці ({activeVacations.length})
              </h4>
              <div className="space-y-2">
                {activeVacations.map((v) => (
                  <div key={v.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{v.profiles?.username}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">
                        до {new Date(v.end_date).toLocaleDateString("uk-UA")}
                      </span>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => cancelVacation(v.id)}
                        disabled={processing === v.id}
                        className="h-7 px-2"
                      >
                        {processing === v.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <X className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pendingVacations.length > 0 && (
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                Очікують розгляду ({pendingVacations.length})
              </h4>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead>Користувач</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead>Період</TableHead>
                      <TableHead>Причина</TableHead>
                      <TableHead>Дата заявки</TableHead>
                      <TableHead className="text-right">Дії</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingVacations.map((vacation) => (
                      <TableRow key={vacation.id}>
                        <TableCell className="font-medium">
                          {vacation.profiles?.username || "—"}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            vacation.vacation_type === "ooc" 
                              ? "bg-purple-500/20 text-purple-400" 
                              : "bg-blue-500/20 text-blue-400"
                          }`}>
                            {vacation.vacation_type === "ooc" ? "OOC" : "IC"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(vacation.start_date).toLocaleDateString("uk-UA")} -{" "}
                          {new Date(vacation.end_date).toLocaleDateString("uk-UA")}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {vacation.reason}
                        </TableCell>
                        <TableCell>
                          {new Date(vacation.created_at).toLocaleDateString("uk-UA")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleVacation(vacation.id, true)}
                              disabled={processing === vacation.id}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              {processing === vacation.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleVacation(vacation.id, false)}
                              disabled={processing === vacation.id}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {processedVacations.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Історія відпусток</h4>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead>Користувач</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead>Період</TableHead>
                      <TableHead>Причина</TableHead>
                      <TableHead>Статус</TableHead>
                      {isDeveloper && <TableHead className="text-right">Дії</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedVacations.slice(0, 10).map((vacation) => (
                      <TableRow key={vacation.id}>
                        <TableCell className="font-medium">
                          {vacation.profiles?.username || "—"}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            vacation.vacation_type === "ooc" 
                              ? "bg-purple-500/20 text-purple-400" 
                              : "bg-blue-500/20 text-blue-400"
                          }`}>
                            {vacation.vacation_type === "ooc" ? "OOC" : "IC"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(vacation.start_date).toLocaleDateString("uk-UA")} -{" "}
                          {new Date(vacation.end_date).toLocaleDateString("uk-UA")}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {vacation.reason}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              vacation.status === "approved"
                                ? "bg-green-500/20 text-green-500"
                                : vacation.status === "cancelled"
                                ? "bg-yellow-500/20 text-yellow-500"
                                : "bg-red-500/20 text-red-500"
                            }`}
                          >
                            {vacation.status === "approved" ? "Схвалено" : vacation.status === "cancelled" ? "Скасовано" : "Відхилено"}
                          </span>
                        </TableCell>
                        {isDeveloper && (
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteVacation(vacation.id)}
                              disabled={processing === vacation.id}
                              className="text-destructive hover:text-destructive"
                            >
                              {processing === vacation.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
