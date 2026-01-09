import { ReactNode, useEffect, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";
import { SnowEffect } from "./SnowEffect";
import { supabase } from "@/integrations/supabase/client";
import { useBrowserNotifications } from "@/hooks/useBrowserNotifications";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Moon, Sun, Code, PanelLeft, Wrench } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface LayoutProps {
  children: ReactNode;
}

interface SiteSettings {
  snow_enabled: boolean;
  garland_enabled: boolean;
  background_url: string | null;
  primary_color: string | null;
  maintenance_mode: boolean;
}

export const Layout = ({ children }: LayoutProps) => {
  // Initialize browser notifications listener
  useBrowserNotifications();
  const { profile, isLoading: authLoading } = useAuth();

  const [settings, setSettings] = useState<SiteSettings>({
    snow_enabled: true,
    garland_enabled: true,
    background_url: null,
    primary_color: null,
    maintenance_mode: false,
  });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved !== "light";
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("snow_enabled, garland_enabled, background_url, primary_color, maintenance_mode")
        .eq("id", 1)
        .single();

      if (data) {
        setSettings({
          snow_enabled: data.snow_enabled ?? true,
          garland_enabled: data.garland_enabled ?? true,
          background_url: data.background_url,
          primary_color: data.primary_color,
          maintenance_mode: (data as any).maintenance_mode ?? false,
        });
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const backgroundImage = isDarkMode ? "/images/bg-dark.png" : "/images/bg-light.png";

  // Check if maintenance mode is active and user is not developer
  const isDeveloper = profile?.role === "developer";
  const showMaintenance = settings.maintenance_mode && !isDeveloper && !authLoading;

  if (showMaintenance) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        {/* Background */}
        <div 
          className="fixed inset-0 -z-20"
          style={{
            backgroundImage: settings.background_url 
              ? `url(${settings.background_url})`
              : `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="fixed inset-0 bg-background/90 -z-10" />
        
        <div className="text-center px-6 max-w-lg">
          <div className="w-20 h-20 mx-auto mb-6 bg-primary/20 rounded-full flex items-center justify-center">
            <Wrench className="w-10 h-10 text-primary animate-pulse" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-4 text-gradient-blood">
            Технічна перерва
          </h1>
          <p className="text-muted-foreground text-lg mb-2">
            Сайт тимчасово недоступний
          </p>
          <p className="text-muted-foreground">
            Ми оновлюємо сайт, щоб зробити його ще кращим. Будь ласка, поверніться пізніше.
          </p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen relative flex w-full">
        {/* Fixed background for iOS compatibility */}
        <div 
          className="fixed inset-0 -z-20"
          style={{
            backgroundImage: settings.background_url 
              ? `url(${settings.background_url})`
              : `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="fixed inset-0 bg-background/80 -z-10" />
        
        <SnowEffect enabled={settings.snow_enabled} />

        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        {/* Mobile Navigation */}
        <MobileNav />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen w-full">
          {/* Desktop Header with Sidebar Toggle */}
          <header className="hidden md:flex items-center h-14 px-4 border-b border-border/50 bg-background/50 backdrop-blur-sm sticky top-0 z-30">
            <SidebarTrigger className="mr-4 hover:bg-secondary rounded-lg p-2 transition-colors">
              <PanelLeft className="w-5 h-5" />
            </SidebarTrigger>
            <div className="flex-1" />
          </header>

          {/* Main Content */}
          <main className="flex-1 pt-16 md:pt-0">{children}</main>

          {/* Footer with credits */}
          <footer className="py-4 border-t border-border/30 bg-background/50 backdrop-blur-sm">
            <div className="container mx-auto px-4">
              <p className="text-center text-xs text-muted-foreground flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5">
                <Code className="w-3 h-3" />
                <span>Розробка:</span>
                <span className="font-semibold text-primary">KiryIIIa</span>
                <span className="mx-1">•</span>
                <span>Дизайн:</span>
                <span className="font-semibold text-primary">APACHI</span>
              </p>
            </div>
          </footer>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="fixed bottom-4 right-4 z-50 p-3 rounded-full bg-secondary/80 backdrop-blur-sm border border-border hover:bg-secondary transition-colors shadow-lg"
          aria-label="Toggle theme"
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-yellow-500" />
          ) : (
            <Moon className="w-5 h-5 text-primary" />
          )}
        </button>
      </div>
    </SidebarProvider>
  );
};
