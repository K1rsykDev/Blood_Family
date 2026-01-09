import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Code, Loader2, Users, Settings } from "lucide-react";
import { DeveloperSettings } from "@/components/admin/DeveloperSettings";
import { DeveloperPlayers } from "@/components/admin/DeveloperPlayers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Developer = () => {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();

  const isDeveloper = profile?.role === "developer";

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    } else if (!isLoading && profile?.role !== "developer") {
      navigate("/");
    }
  }, [user, profile, isLoading, navigate]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </div>
      </Layout>
    );
  }

  if (profile?.role !== "developer") {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <Code className="w-12 h-12 mx-auto text-purple-500 mb-4" />
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Панель розробника
          </h1>
          <p className="text-muted-foreground">
            Повне керування Blood Residence
          </p>
        </div>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-6">
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Налаштування
            </TabsTrigger>
            <TabsTrigger value="players" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Гравці
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <DeveloperSettings />
          </TabsContent>

          <TabsContent value="players">
            <DeveloperPlayers />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Developer;
