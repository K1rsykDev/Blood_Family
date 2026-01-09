import { useState, useEffect } from "react";
import { useNavigate, Routes, Route, Link, useLocation } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCounts } from "@/hooks/useAdminCounts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  FileText, 
  Users, 
  Newspaper, 
  Gift, 
  Loader2,
  UserCheck,
  UserMinus,
  Palmtree
} from "lucide-react";
import { AdminContracts } from "@/components/admin/AdminContracts";
import { AdminApplications } from "@/components/admin/AdminApplications";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminNews } from "@/components/admin/AdminNews";
import { AdminGiveaways } from "@/components/admin/AdminGiveaways";
import { AdminLeaveRequests } from "@/components/admin/AdminLeaveRequests";
import { AdminVacations } from "@/components/admin/AdminVacations";

const AdminNav = () => {
  const location = useLocation();
  const { counts } = useAdminCounts();
  
  const navItems = [
    { path: "/admin", label: "Контракти", icon: FileText, count: counts.pendingContracts },
    { path: "/admin/applications", label: "Заявки", icon: UserCheck, count: counts.pendingApplications },
    { path: "/admin/users", label: "Користувачі", icon: Users, count: 0 },
    { path: "/admin/news", label: "Новини", icon: Newspaper, count: 0 },
    { path: "/admin/giveaways", label: "Розіграші", icon: Gift, count: 0 },
    { path: "/admin/leave-requests", label: "Вихід", icon: UserMinus, count: counts.pendingLeaveRequests },
    { path: "/admin/vacations", label: "Відпустки", icon: Palmtree, count: counts.pendingVacations },
  ];

  return (
    <nav className="mb-8 overflow-x-auto -mx-4 px-4">
      <div className="flex gap-2 min-w-max pb-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path === "/admin" 
            ? location.pathname === "/admin" || location.pathname === "/admin/"
            : location.pathname.startsWith(item.path);
          
          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant={isActive ? "default" : "outline"}
                className={`whitespace-nowrap relative ${isActive ? "btn-blood" : "border-border"}`}
                size="sm"
              >
                <Icon className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.label.split(' ')[0]}</span>
                {item.count > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="ml-1.5 h-5 min-w-[20px] px-1.5 text-xs font-bold animate-pulse"
                  >
                    {item.count}
                  </Badge>
                )}
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

const Admin = () => {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();

  const hasAdminAccess = profile?.role === "admin" || profile?.role === "developer" || (profile as any)?.custom_role?.has_admin_access;

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    } else if (!isLoading && !hasAdminAccess) {
      navigate("/");
    }
  }, [user, profile, isLoading, navigate, hasAdminAccess]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </div>
      </Layout>
    );
  }

  if (!hasAdminAccess) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <Shield className="w-12 h-12 mx-auto text-gold mb-4" />
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Адмін-панель
          </h1>
          <p className="text-muted-foreground">
            Керування Blood Residence
          </p>
        </div>

        <AdminNav />

        <Routes>
          <Route path="/" element={<AdminContracts />} />
          <Route path="/applications" element={<AdminApplications />} />
          <Route path="/users" element={<AdminUsers />} />
          <Route path="/news" element={<AdminNews />} />
          <Route path="/giveaways" element={<AdminGiveaways />} />
          <Route path="/leave-requests" element={<AdminLeaveRequests />} />
          <Route path="/vacations" element={<AdminVacations />} />
        </Routes>
      </div>
    </Layout>
  );
};

export default Admin;
