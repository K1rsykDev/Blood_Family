import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCounts } from "@/hooks/useAdminCounts";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Users,
  FileEdit,
  Info,
  Newspaper,
  Gift,
  Film,
  Crown,
  User,
  Settings,
  LogOut,
  LogIn,
  UserPlus,
  Shield,
  ChevronUp,
  Skull,
  ShoppingBag,
  Coins,
  FileText,
} from "lucide-react";

interface SocialLinks {
  social_tiktok: string | null;
  social_youtube: string | null;
  social_discord: string | null;
  social_telegram: string | null;
}

interface NavLabels {
  home: string;
  leaders: string;
  apply: string;
  info: string;
  reports: string;
  news: string;
  giveaways: string;
  players: string;
  cinema: string;
}

const defaultNavLabels: NavLabels = {
  home: "Головна",
  leaders: "Керівники Blood",
  apply: "Заявка",
  info: "Інформація",
  reports: "Контракти",
  news: "Новини",
  giveaways: "Розіграші",
  players: "Гравці",
  cinema: "Кінотеатр",
};

export function AppSidebar() {
  const { user, profile, signOut, isLoading } = useAuth();
  const { totalPending } = useAdminCounts();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  
  const [navLabels, setNavLabels] = useState<NavLabels>(defaultNavLabels);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    social_tiktok: null,
    social_youtube: null,
    social_discord: null,
    social_telegram: null,
  });

  // Easter egg state
  const [easterEggClicks, setEasterEggClicks] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setEasterEggClicks(prev => {
      const newCount = prev + 1;
      if (newCount >= 5) {
        setShowEasterEgg(true);
        return 0;
      }
      return newCount;
    });
    
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    clickTimeoutRef.current = setTimeout(() => {
      setEasterEggClicks(0);
    }, 2000);
  };

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("nav_labels, social_tiktok, social_youtube, social_discord, social_telegram")
        .eq("id", 1)
        .single();
      
      if (data?.nav_labels) {
        const labels = data.nav_labels as unknown as Partial<NavLabels>;
        setNavLabels({ ...defaultNavLabels, ...labels });
      }
      if (data) {
        setSocialLinks({
          social_tiktok: (data as any).social_tiktok || null,
          social_youtube: (data as any).social_youtube || null,
          social_discord: (data as any).social_discord || null,
          social_telegram: (data as any).social_telegram || null,
        });
      }
    };
    fetchSettings();
  }, []);

  const isMember = profile?.role === "member" || profile?.role === "admin" || profile?.role === "developer";
  const isDeveloper = profile?.role === "developer";
  const showApplyTab = !profile || profile.role === "guest" || isDeveloper;
  const hasAdminAccess = profile?.role === "admin" || profile?.role === "developer" || (profile as any)?.custom_role?.has_admin_access;

  const isActive = (path: string) => location.pathname === path;

  // Main nav items
  const quickAccessItems = [
    { title: navLabels.home, url: "/", icon: Home },
    { title: "Керівники Blood", url: "/leaders", icon: Crown },
  ];

  const memberItems = isMember ? [
    { title: navLabels.info, url: "/information", icon: Info },
    { title: navLabels.news, url: "/news", icon: Newspaper },
    { title: navLabels.giveaways, url: "/giveaways", icon: Gift },
    { title: navLabels.players, url: "/players", icon: Users },
    { title: navLabels.cinema, url: "/cinema", icon: Film },
    { title: "Магазин", url: "/shop", icon: ShoppingBag },
    { title: navLabels.reports, url: "/reports", icon: FileText },
  ] : [];

  return (
    <Sidebar side="left" collapsible="icon" className="border-r border-sidebar-border">
      {/* Easter Egg Dialog */}
      <Dialog open={showEasterEgg} onOpenChange={setShowEasterEgg}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-purple-900/90 to-black border-purple-500/50">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-display bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
              🎉 Ти знайшов пасхалку! 🎉
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4 py-4">
            <div className="text-6xl animate-bounce">🥚✨</div>
            <p className="text-lg text-purple-200">
              Вітаю, допитливий друже!
            </p>
            <div className="bg-purple-800/50 rounded-lg p-4 border border-purple-500/30">
              <p className="text-sm text-purple-300 italic">
                "Цей сайт створено з любов'ю та безсонними ночами. 
                Якщо ти це читаєш - ти справжній детектив! 🕵️"
              </p>
              <p className="text-xs text-purple-400 mt-2">
                — KIryIIIa, розробник Blood Residence
              </p>
            </div>
            <div className="flex justify-center gap-2 text-2xl">
              <span className="animate-spin">⚙️</span>
              <span className="animate-pulse">💜</span>
              <span className="animate-bounce">🔥</span>
            </div>
            <p className="text-xs text-muted-foreground">
              P.S. Нікому не кажи про це місце... 🤫
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Logo Header */}
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div 
          onClick={handleLogoClick}
          className="flex items-center justify-center gap-3 group w-full cursor-pointer select-none"
        >
          <Skull className={`w-8 h-8 text-primary group-hover:text-blood-glow transition-colors flex-shrink-0 ${easterEggClicks > 0 ? 'animate-pulse' : ''}`} />
          {!collapsed && (
            <span className="font-display text-lg font-bold tracking-wider text-gradient-blood">
              BLOOD
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {/* Quick Access */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            {!collapsed && "Швидкий доступ"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickAccessItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className={`transition-all duration-200 ${
                      isActive(item.url)
                        ? "bg-primary/20 text-primary border-l-2 border-primary"
                        : "hover:bg-sidebar-accent text-sidebar-foreground"
                    }`}
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {/* Apply tab */}
              {showApplyTab && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/apply")}
                    tooltip={navLabels.apply}
                    className={`transition-all duration-200 ${
                      isActive("/apply")
                        ? "bg-primary/20 text-primary border-l-2 border-primary"
                        : "hover:bg-sidebar-accent text-sidebar-foreground"
                    }`}
                  >
                    <Link to="/apply" className="flex items-center gap-3">
                      <FileEdit className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span className="truncate">{navLabels.apply}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Member Navigation */}
        {isMember && memberItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              {!collapsed && "Сім'я"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {memberItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                      className={`transition-all duration-200 ${
                        isActive(item.url)
                          ? "bg-primary/20 text-primary border-l-2 border-primary"
                          : "hover:bg-sidebar-accent text-sidebar-foreground"
                      }`}
                    >
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && <span className="truncate">{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin Panel */}
        {hasAdminAccess && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              {!collapsed && "Управління"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/admin")}
                    tooltip="Адмін панель"
                    className={`transition-all duration-200 ${
                      isActive("/admin")
                        ? "bg-gold/20 text-gold border-l-2 border-gold"
                        : "hover:bg-sidebar-accent text-gold"
                    }`}
                  >
                    <Link to="/admin" className="flex items-center gap-3">
                      <div className="relative">
                        <Shield className="w-5 h-5 flex-shrink-0" />
                        {totalPending > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="absolute -top-2 -right-2 h-4 min-w-[16px] px-1 text-[10px] font-bold animate-pulse"
                          >
                            {totalPending}
                          </Badge>
                        )}
                      </div>
                      {!collapsed && (
                        <span className="truncate flex items-center gap-2">
                          Адмін панель
                          {totalPending > 0 && (
                            <Badge 
                              variant="destructive" 
                              className="h-5 min-w-[20px] px-1.5 text-xs font-bold"
                            >
                              {totalPending}
                            </Badge>
                          )}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                {isDeveloper && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/developer")}
                      tooltip="Панель розробника"
                      className={`transition-all duration-200 ${
                        isActive("/developer")
                          ? "bg-purple-500/20 text-purple-500 border-l-2 border-purple-500"
                          : "hover:bg-sidebar-accent text-purple-500"
                      }`}
                    >
                      <Link to="/developer" className="flex items-center gap-3">
                        <Settings className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && <span className="truncate">Панель розробника</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Social Media Links */}
        {(socialLinks.social_tiktok || socialLinks.social_youtube || socialLinks.social_discord || socialLinks.social_telegram) && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              {!collapsed && "Наші соц мережі"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {socialLinks.social_tiktok && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="TikTok"
                      className="transition-all duration-200 hover:bg-sidebar-accent"
                    >
                      <a href={socialLinks.social_tiktok} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                        <span className="text-lg flex-shrink-0">🎵</span>
                        {!collapsed && <span className="truncate">TikTok</span>}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {socialLinks.social_youtube && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="YouTube"
                      className="transition-all duration-200 hover:bg-sidebar-accent"
                    >
                      <a href={socialLinks.social_youtube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                        <span className="text-lg flex-shrink-0 text-red-500">▶</span>
                        {!collapsed && <span className="truncate">YouTube</span>}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {socialLinks.social_discord && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="Discord"
                      className="transition-all duration-200 hover:bg-sidebar-accent"
                    >
                      <a href={socialLinks.social_discord} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                        <span className="text-lg flex-shrink-0 text-indigo-400">💬</span>
                        {!collapsed && <span className="truncate">Discord</span>}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {socialLinks.social_telegram && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="Telegram"
                      className="transition-all duration-200 hover:bg-sidebar-accent"
                    >
                      <a href={socialLinks.social_telegram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                        <span className="text-lg flex-shrink-0 text-sky-400">✈️</span>
                        {!collapsed && <span className="truncate">Telegram</span>}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* User Footer */}
      <SidebarFooter className="border-t border-sidebar-border p-2">
        {isLoading ? (
          <div className="flex items-center gap-3 p-2">
            <div className="w-9 h-9 rounded-full bg-sidebar-accent animate-pulse" />
            {!collapsed && <div className="h-4 w-24 bg-sidebar-accent animate-pulse rounded" />}
          </div>
        ) : user ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="w-full hover:bg-sidebar-accent transition-colors"
                  >
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={profile?.avatar_url || ""} alt={profile?.username || ""} />
                      <AvatarFallback className="bg-primary/20 text-primary text-sm">
                        {profile?.username?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    {!collapsed && (
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium truncate">{profile?.username || "Користувач"}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground capitalize">{profile?.role || "guest"}</p>
                          {isMember && (
                            <span className="text-xs text-yellow-500 flex items-center gap-0.5">
                              <Coins className="w-3 h-3" />
                              {((profile as any)?.bc_balance || 0).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {!collapsed && <ChevronUp className="w-4 h-4 text-muted-foreground" />}
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align="start"
                  className="w-56 bg-popover border border-border"
                >
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/profile" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Профіль
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => {
                      navigate("/profile");
                      // Trigger settings dialog via custom event
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('openProfileSettings'));
                      }, 100);
                    }}
                  >
                    <Settings className="w-4 h-4" />
                    Налаштування
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => signOut()}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Вийти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Увійти"
                className="hover:bg-sidebar-accent transition-colors"
              >
                <Link to="/auth" className="flex items-center gap-3">
                  <LogIn className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>Увійти</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Реєстрація"
                className="bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
              >
                <Link to="/auth?mode=signup" className="flex items-center gap-3">
                  <UserPlus className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>Реєстрація</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
