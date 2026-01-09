import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Skull,
  Menu,
  X,
  ShoppingBag,
} from "lucide-react";

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

interface SocialLinks {
  social_tiktok: string | null;
  social_youtube: string | null;
  social_discord: string | null;
  social_telegram: string | null;
}

export function MobileNav() {
  const { user, profile, signOut, isLoading } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
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

  const handleLogoClickEasterEgg = (e: React.MouseEvent) => {
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

  const handleNavClick = () => setOpen(false);

  const NavLink = ({ to, icon: Icon, children, active, className = "" }: {
    to: string;
    icon: any;
    children: React.ReactNode;
    active?: boolean;
    className?: string;
  }) => (
    <Link
      to={to}
      onClick={handleNavClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        active
          ? "bg-primary/20 text-primary"
          : "text-foreground hover:bg-secondary"
      } ${className}`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="font-medium">{children}</span>
    </Link>
  );

  return (
    <>
      {/* Easter Egg Dialog */}
      <Dialog open={showEasterEgg} onOpenChange={setShowEasterEgg}>
        <DialogContent className="max-w-[90vw] sm:max-w-md bg-gradient-to-br from-purple-900/90 to-black border-purple-500/50 p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-center text-lg sm:text-2xl font-display bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
              🎉 Ти знайшов пасхалку! 🎉
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-3 py-2 sm:py-4">
            <div className="text-4xl sm:text-6xl animate-bounce">🥚✨</div>
            <p className="text-base sm:text-lg text-purple-200">
              Вітаю, допитливий друже!
            </p>
            <div className="bg-purple-800/50 rounded-lg p-3 border border-purple-500/30">
              <p className="text-xs sm:text-sm text-purple-300 italic">
                "Цей сайт створено з любов'ю та безсонними ночами. 
                Якщо ти це читаєш - ти справжній детектив! 🕵️"
              </p>
              <p className="text-xs text-purple-400 mt-2">
                — KIryIIIa, розробник Blood Residence
              </p>
            </div>
            <div className="flex justify-center gap-2 text-xl sm:text-2xl">
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

      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Logo */}
          <div 
            onClick={handleLogoClickEasterEgg}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <Skull className={`w-7 h-7 text-primary ${easterEggClicks > 0 ? 'animate-pulse' : ''}`} />
            <span className="font-display text-lg font-bold text-gradient-blood">
              BLOOD
            </span>
          </div>

        {/* Menu Button */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] max-w-sm p-0 bg-background border-l border-border">
            <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="flex items-center gap-3">
                <Skull className="w-6 h-6 text-primary" />
                <span className="font-display text-gradient-blood">BLOOD RESIDENCE</span>
              </SheetTitle>
            </SheetHeader>

            <div className="flex flex-col h-[calc(100%-73px)]">
              {/* Navigation */}
              <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
                {/* Quick Access */}
                <p className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Швидкий доступ
                </p>
                <NavLink to="/" icon={Home} active={isActive("/")}>
                  {navLabels.home}
                </NavLink>
                <NavLink to="/leaders" icon={Crown} active={isActive("/leaders")}>
                  {navLabels.leaders}
                </NavLink>
                {showApplyTab && (
                  <NavLink to="/apply" icon={FileEdit} active={isActive("/apply")}>
                    {navLabels.apply}
                  </NavLink>
                )}

                {/* Member Section */}
                {isMember && (
                  <>
                    <p className="px-4 py-2 mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Сім'я
                    </p>
                    <NavLink to="/information" icon={Info} active={isActive("/information")}>
                      {navLabels.info}
                    </NavLink>
                    <NavLink to="/news" icon={Newspaper} active={isActive("/news")}>
                      {navLabels.news}
                    </NavLink>
                    <NavLink to="/giveaways" icon={Gift} active={isActive("/giveaways")}>
                      {navLabels.giveaways}
                    </NavLink>
                    <NavLink to="/players" icon={Users} active={isActive("/players")}>
                      {navLabels.players}
                    </NavLink>
                    <NavLink to="/cinema" icon={Film} active={isActive("/cinema")}>
                      {navLabels.cinema}
                    </NavLink>
                    <NavLink to="/shop" icon={ShoppingBag} active={isActive("/shop")}>
                      Магазин
                    </NavLink>
                  </>
                )}

                {/* Admin Section */}
                {hasAdminAccess && (
                  <>
                    <p className="px-4 py-2 mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Управління
                    </p>
                    <NavLink 
                      to="/admin" 
                      icon={Shield} 
                      active={isActive("/admin")}
                      className={isActive("/admin") ? "bg-gold/20 text-gold" : "text-gold hover:bg-gold/10"}
                    >
                      Адмін панель
                    </NavLink>
                    {isDeveloper && (
                      <NavLink 
                        to="/developer" 
                        icon={Settings} 
                        active={isActive("/developer")}
                        className={isActive("/developer") ? "bg-purple-500/20 text-purple-500" : "text-purple-500 hover:bg-purple-500/10"}
                      >
                        Панель розробника
                      </NavLink>
                    )}
                  </>
                )}

                {/* Social Media Links */}
                {(socialLinks.social_tiktok || socialLinks.social_youtube || socialLinks.social_discord || socialLinks.social_telegram) && (
                  <>
                    <p className="px-4 py-2 mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Наші соц мережі
                    </p>
                    <div className="flex flex-wrap gap-2 px-4">
                      {socialLinks.social_tiktok && (
                        <a
                          href={socialLinks.social_tiktok}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={handleNavClick}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                        >
                          <span className="text-lg">🎵</span>
                          <span className="text-sm font-medium">TikTok</span>
                        </a>
                      )}
                      {socialLinks.social_youtube && (
                        <a
                          href={socialLinks.social_youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={handleNavClick}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                        >
                          <span className="text-lg text-red-500">▶</span>
                          <span className="text-sm font-medium">YouTube</span>
                        </a>
                      )}
                      {socialLinks.social_discord && (
                        <a
                          href={socialLinks.social_discord}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={handleNavClick}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                        >
                          <span className="text-lg text-indigo-400">💬</span>
                          <span className="text-sm font-medium">Discord</span>
                        </a>
                      )}
                      {socialLinks.social_telegram && (
                        <a
                          href={socialLinks.social_telegram}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={handleNavClick}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                        >
                          <span className="text-lg text-sky-400">✈️</span>
                          <span className="text-sm font-medium">Telegram</span>
                        </a>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* User Footer */}
              <div className="border-t border-border p-4 space-y-3">
                {isLoading ? (
                  <div className="flex items-center gap-3 p-2">
                    <div className="w-10 h-10 rounded-full bg-secondary animate-pulse" />
                    <div className="h-4 w-24 bg-secondary animate-pulse rounded" />
                  </div>
                ) : user ? (
                  <>
                    <Link 
                      to="/profile" 
                      onClick={handleNavClick}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={profile?.avatar_url || ""} alt={profile?.username || ""} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {profile?.username?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{profile?.username || "Користувач"}</p>
                        <p className="text-xs text-muted-foreground capitalize">{profile?.role || "guest"}</p>
                      </div>
                    </Link>
                    <div className="grid grid-cols-2 gap-2">
                      <Link to="/profile" onClick={handleNavClick}>
                        <Button variant="outline" className="w-full" size="sm">
                          <User className="w-4 h-4 mr-2" />
                          Профіль
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          signOut();
                          handleNavClick();
                        }}
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Вийти
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link to="/auth" onClick={handleNavClick}>
                      <Button variant="outline" className="w-full">
                        <LogIn className="w-4 h-4 mr-2" />
                        Увійти
                      </Button>
                    </Link>
                    <Link to="/auth?mode=signup" onClick={handleNavClick}>
                      <Button className="w-full btn-blood">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Реєстрація
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      </div>
    </>
  );
}
