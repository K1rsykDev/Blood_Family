import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdminCounts {
  pendingContracts: number;
  pendingApplications: number;
  pendingLeaveRequests: number;
  pendingVacations: number;
}

export const useAdminCounts = () => {
  const [counts, setCounts] = useState<AdminCounts>({
    pendingContracts: 0,
    pendingApplications: 0,
    pendingLeaveRequests: 0,
    pendingVacations: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchCounts = async () => {
    try {
      const [contractsRes, applicationsRes, leaveRes, vacationsRes] = await Promise.all([
        supabase.from("contracts").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("leave_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("vacations").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      setCounts({
        pendingContracts: contractsRes.count || 0,
        pendingApplications: applicationsRes.count || 0,
        pendingLeaveRequests: leaveRes.count || 0,
        pendingVacations: vacationsRes.count || 0,
      });
    } catch (error) {
      console.error("Error fetching admin counts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();

    // Subscribe to realtime updates
    const contractsChannel = supabase
      .channel("admin-contracts-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "contracts" }, fetchCounts)
      .subscribe();

    const applicationsChannel = supabase
      .channel("admin-applications-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, fetchCounts)
      .subscribe();

    const leaveChannel = supabase
      .channel("admin-leave-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "leave_requests" }, fetchCounts)
      .subscribe();

    const vacationsChannel = supabase
      .channel("admin-vacations-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "vacations" }, fetchCounts)
      .subscribe();

    return () => {
      supabase.removeChannel(contractsChannel);
      supabase.removeChannel(applicationsChannel);
      supabase.removeChannel(leaveChannel);
      supabase.removeChannel(vacationsChannel);
    };
  }, []);

  const totalPending = counts.pendingContracts + counts.pendingApplications + counts.pendingLeaveRequests + counts.pendingVacations;

  return { counts, totalPending, loading, refetch: fetchCounts };
};
