import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Shield, Users as UsersIcon, Loader2, Code } from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  discord_id: string | null;
  role: string;
  created_at: string;
}

export const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { profile } = useAuth();

  const isDeveloper = profile?.role === "developer";

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setUsers(data as UserProfile[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateRole = async (userId: string, role: "guest" | "member" | "admin" | "developer") => {
    // Admins can only assign guest or member roles
    if (!isDeveloper && (role === "admin" || role === "developer")) {
      toast({
        title: "Помилка",
        description: "Тільки розробник може видавати роль адміна або розробника",
        variant: "destructive",
      });
      return;
    }

    // Check if target user is admin or developer - only developer can change their role
    const targetUser = users.find(u => u.id === userId);
    if (!isDeveloper && targetUser && (targetUser.role === "admin" || targetUser.role === "developer")) {
      toast({
        title: "Помилка",
        description: "Тільки розробник може змінювати роль адмінам та розробникам",
        variant: "destructive",
      });
      return;
    }

    setProcessingId(userId);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", userId);

      if (error) throw error;

      await fetchUsers();
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

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="card-blood p-6">
      <h2 className="font-display text-xl font-semibold mb-6">Користувачі</h2>

      {!isDeveloper && (
        <div className="mb-4 p-3 bg-gold/10 border border-gold/20 rounded-lg text-sm text-muted-foreground">
          ⚠️ Як адміністратор, ви можете видавати тільки ролі "Гість" та "Учасник"
        </div>
      )}

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
                <th className="text-left py-3 px-4 font-display">Дата реєстрації</th>
                <th className="text-left py-3 px-4 font-display">Дії</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const RoleIcon = roleIcons[user.role] || User;
                
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
                    <td className="py-3 px-4 text-muted-foreground text-sm">
                      {new Date(user.created_at).toLocaleDateString("uk-UA")}
                    </td>
                    <td className="py-3 px-4">
                      {(() => {
                        const canEditThisUser = isDeveloper || (user.role !== "admin" && user.role !== "developer");
                        
                        return (
                          <Select
                            value={user.role}
                            onValueChange={(value) => updateRole(user.id, value as any)}
                            disabled={processingId === user.id || !canEditThisUser}
                          >
                            <SelectTrigger className="w-36 bg-secondary">
                              {processingId === user.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <SelectValue />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="guest">Гість</SelectItem>
                              <SelectItem value="member">Учасник</SelectItem>
                              {isDeveloper && (
                                <>
                                  <SelectItem value="admin">Адмін</SelectItem>
                                  <SelectItem value="developer">Розробник</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};