import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText } from "lucide-react";

interface ContractStats {
  total: number;
  today: number;
  month: number;
  pending: number;
  approved: number;
  paid: number;
}

interface ContractsTabProps {
  userId: string;
  userRole: string;
}

export const ContractsTab = ({ userId, userRole }: ContractsTabProps) => {
  const [stats, setStats] = useState<ContractStats>({
    total: 0,
    today: 0,
    month: 0,
    pending: 0,
    approved: 0,
    paid: 0,
  });
  const [loading, setLoading] = useState(true);

  const canAccessContracts = userRole === "member" || userRole === "admin" || userRole === "developer";

  useEffect(() => {
    const fetchStats = async () => {
      if (!canAccessContracts) {
        setLoading(false);
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      const { data: contracts } = await supabase
        .from("contracts")
        .select("id, created_at, status")
        .eq("user_id", userId)
        .neq("status", "rejected");

      if (contracts) {
        const todayCount = contracts.filter(
          (c) => new Date(c.created_at!) >= today
        ).length;
        const monthCount = contracts.filter(
          (c) => new Date(c.created_at!) >= monthStart
        ).length;
        const pendingCount = contracts.filter((c) => c.status === "pending").length;
        const approvedCount = contracts.filter((c) => c.status === "approved").length;
        const paidCount = contracts.filter((c) => c.status === "paid").length;

        setStats({
          total: contracts.length,
          today: todayCount,
          month: monthCount,
          pending: pendingCount,
          approved: approvedCount,
          paid: paidCount,
        });
      }

      setLoading(false);
    };

    fetchStats();
  }, [userId, canAccessContracts]);

  if (loading) {
    return (
      <div className="card-blood p-6 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
      </div>
    );
  }

  if (!canAccessContracts) {
    return (
      <div className="card-blood p-6 text-center">
        <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-display text-lg font-semibold mb-2">Недоступно</h3>
        <p className="text-sm text-muted-foreground">
          Контракти доступні тільки для учасників сім'ї
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card-blood p-6">
        <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Статистика контрактів
        </h3>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-secondary/50 rounded-lg">
            <div className="font-display text-2xl font-bold text-primary">
              {stats.total}
            </div>
            <div className="text-sm text-muted-foreground">Всього</div>
          </div>
          <div className="text-center p-4 bg-secondary/50 rounded-lg">
            <div className="font-display text-2xl font-bold text-primary">
              {stats.today}
            </div>
            <div className="text-sm text-muted-foreground">Сьогодні</div>
          </div>
          <div className="text-center p-4 bg-secondary/50 rounded-lg">
            <div className="font-display text-2xl font-bold text-primary">
              {stats.month}
            </div>
            <div className="text-sm text-muted-foreground">Цей місяць</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="font-display text-xl font-bold text-yellow-500">
              {stats.pending}
            </div>
            <div className="text-xs text-muted-foreground">Очікують</div>
          </div>
          <div className="text-center p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="font-display text-xl font-bold text-blue-500">
              {stats.approved}
            </div>
            <div className="text-xs text-muted-foreground">Схвалено</div>
          </div>
          <div className="text-center p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="font-display text-xl font-bold text-green-500">
              {stats.paid}
            </div>
            <div className="text-xs text-muted-foreground">Оплачено</div>
          </div>
        </div>

      </div>
    </div>
  );
};
