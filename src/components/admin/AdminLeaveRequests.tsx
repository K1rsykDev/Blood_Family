import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, UserMinus, Check, X, Clock, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LeaveRequest {
  id: string;
  user_id: string;
  username_ingame: string;
  reason: string;
  status: string;
  created_at: string;
  profiles: {
    username: string;
  };
}

export const AdminLeaveRequests = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  
  const isDeveloper = profile?.role === "developer";

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("leave_requests")
      .select("*, profiles!leave_requests_user_id_fkey(username)")
      .order("created_at", { ascending: false });

    if (data) {
      setRequests(data as LeaveRequest[]);
    }
    setLoading(false);
  };

  const handleRequest = async (id: string, userId: string, approved: boolean) => {
    setProcessing(id);

    try {
      // Update request status
      const { error: updateError } = await supabase
        .from("leave_requests")
        .update({
          status: approved ? "approved" : "rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateError) throw updateError;

      // If approved, change user role to guest
      if (approved) {
        const { error: roleError } = await supabase
          .from("profiles")
          .update({
            role: "guest",
            custom_role_id: null,
          })
          .eq("id", userId);

        if (roleError) throw roleError;
      }

      toast({
        title: approved ? "Заявку схвалено" : "Заявку відхилено",
        description: approved ? "Роль учасника знято, видано роль гостя" : "",
      });

      fetchRequests();
    } catch (error) {
      console.error("Error processing request:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося обробити заявку",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const deleteRequest = async (id: string) => {
    if (!confirm("Ви впевнені, що хочете видалити цю заявку?")) return;
    
    setProcessing(id);
    try {
      const { error } = await supabase
        .from("leave_requests")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Заявку видалено",
      });

      fetchRequests();
    } catch (error) {
      console.error("Error deleting request:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося видалити заявку",
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

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const processedRequests = requests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      <h3 className="font-display text-lg font-semibold flex items-center gap-2">
        <UserMinus className="w-5 h-5 text-primary" />
        Заявки на вихід з сім'ї
      </h3>

      {pendingRequests.length === 0 && processedRequests.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Заявок немає
        </p>
      ) : (
        <>
          {pendingRequests.length > 0 && (
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                Очікують розгляду ({pendingRequests.length})
              </h4>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead>Користувач</TableHead>
                      <TableHead>Нік у грі</TableHead>
                      <TableHead>Причина</TableHead>
                      <TableHead>Дата</TableHead>
                      <TableHead className="text-right">Дії</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.profiles?.username || "—"}
                        </TableCell>
                        <TableCell>{request.username_ingame}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {request.reason}
                        </TableCell>
                        <TableCell>
                          {new Date(request.created_at).toLocaleDateString("uk-UA")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleRequest(request.id, request.user_id, true)}
                              disabled={processing === request.id}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              {processing === request.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRequest(request.id, request.user_id, false)}
                              disabled={processing === request.id}
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

          {processedRequests.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Історія заявок</h4>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead>Користувач</TableHead>
                      <TableHead>Нік у грі</TableHead>
                      <TableHead>Причина</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Дата</TableHead>
                      {isDeveloper && <TableHead className="text-right">Дії</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedRequests.slice(0, 10).map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.profiles?.username || "—"}
                        </TableCell>
                        <TableCell>{request.username_ingame}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {request.reason}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              request.status === "approved"
                                ? "bg-green-500/20 text-green-500"
                                : "bg-red-500/20 text-red-500"
                            }`}
                          >
                            {request.status === "approved" ? "Схвалено" : "Відхилено"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(request.created_at).toLocaleDateString("uk-UA")}
                        </TableCell>
                        {isDeveloper && (
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteRequest(request.id)}
                              disabled={processing === request.id}
                              className="text-destructive hover:text-destructive"
                            >
                              {processing === request.id ? (
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
