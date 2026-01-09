import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Skull, Menu, X, LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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

interface NavbarProps {
  garlandEnabled?: boolean;
}

const GarlandOnNavbar = () => {
  const lights = Array.from({ length: 30 }, (_, i) => i);
  const colors = ['#ff3333', '#33ff33', '#ffff33', '#ff33ff', '#33ffff'];

  return (
    <div className="absolute bottom-0 left-0 right-0 translate-y-full pointer-events-none overflow-visible h-10">
      <svg
        className="w-full h-full absolute top-0"
        viewBox="0 0 1920 40"
        preserveAspectRatio="none"
      >
        {/* Main wavy wire */}
        <path
          d="M0,4 Q32,10 64,4 T128,4 T192,4 T256,4 T320,4 T384,4 T448,4 T512,4 T576,4 T640,4 T704,4 T768,4 T832,4 T896,4 T960,4 T1024,4 T1088,4 T1152,4 T1216,4 T1280,4 T1344,4 T1408,4 T1472,4 T1536,4 T1600,4 T1664,4 T1728,4 T1792,4 T1856,4 T1920,4"
          fill="none"
          stroke="hsl(120 35% 20%)"
          strokeWidth="2"
        />
        
        {/* Connectors and lights */}
        {lights.map((i) => {
          const x = (i + 0.5) * (1920 / 30);
          const wireY = 4 + Math.sin(i * 0.5) * 6;
          const stringLength = 10 + Math.sin(i * 1.2) * 5;
          const color = colors[i % colors.length];
          
          return (
            <g key={i}>
              {/* String connecting to wire */}
              <line
                x1={x}
                y1={wireY}
                x2={x}
                y2={wireY + stringLength}
                stroke="hsl(120 25% 18%)"
                strokeWidth="1"
              />
              {/* Light cap */}
              <rect
                x={x - 2}
                y={wireY + stringLength}
                width="4"
                height="3"
                fill="hsl(120 20% 28%)"
                rx="0.5"
              />
              {/* Light bulb */}
              <ellipse
                cx={x}
                cy={wireY + stringLength + 6}
                rx="3"
                ry="4"
                fill={color}
                filter="url(#glow)"
              />
            </g>
          );
        })}
        {/* Glow filter */}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
      </svg>
    </div>
  );
};

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

export const Navbar = ({ garlandEnabled = true }: NavbarProps) => {
  const { user, profile, signOut, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [navLabels, setNavLabels] = useState<NavLabels>(defaultNavLabels);

  useEffect(() => {
    const fetchNavLabels = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("nav_labels")
        .eq("id", 1)
        .single();
      
      if (data?.nav_labels) {
        const labels = data.nav_labels as unknown as Partial<NavLabels>;
        setNavLabels({ ...defaultNavLabels, ...labels });
      }
    };
    fetchNavLabels();
  }, []);

  const isMember = profile?.role === "member" || profile?.role === "admin" || profile?.role === "developer";
  const isDeveloper = profile?.role === "developer";
  const showApplyTab = !profile || profile.role === "guest" || isDeveloper;

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-18 py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <Skull className="w-9 h-9 text-primary group-hover:text-blood-glow transition-colors" />
            <span className="font-display text-xl md:text-2xl font-bold tracking-wider text-gradient-blood">
              BLOOD RESIDENCE
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="font-body text-sm uppercase tracking-wide text-muted-foreground hover:text-primary transition-colors"
            >
              {navLabels.home}
            </Link>
            <Link
              to="/leaders"
              className="font-body text-sm uppercase tracking-wide text-muted-foreground hover:text-primary transition-colors"
            >
              {navLabels.leaders}
            </Link>
            {showApplyTab && (
              <Link
                to="/apply"
                className="font-body text-sm uppercase tracking-wide text-muted-foreground hover:text-primary transition-colors"
              >
                {navLabels.apply}
              </Link>
            )}
            {isMember && (
              <>
                <Link
                  to="/information"
                  className="font-body text-sm uppercase tracking-wide text-muted-foreground hover:text-primary transition-colors"
                >
                  {navLabels.info}
                </Link>
                <Link
                  to="/news"
                  className="font-body text-sm uppercase tracking-wide text-muted-foreground hover:text-primary transition-colors"
                >
                  {navLabels.news}
                </Link>
                <Link
                  to="/giveaways"
                  className="font-body text-sm uppercase tracking-wide text-muted-foreground hover:text-primary transition-colors"
                >
                  {navLabels.giveaways}
                </Link>
                <Link
                  to="/players"
                  className="font-body text-sm uppercase tracking-wide text-muted-foreground hover:text-primary transition-colors"
                >
                  {navLabels.players}
                </Link>
                <Link
                  to="/cinema"
                  className="font-body text-sm uppercase tracking-wide text-muted-foreground hover:text-primary transition-colors"
                >
                  {navLabels.cinema}
                </Link>
              </>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <User className="w-4 h-4" />
                  {profile?.username || "Профіль"}
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => signOut()}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/auth")}
                  className="font-body uppercase tracking-wide"
                >
                  Увійти
                </Button>
                <Button
                  onClick={() => navigate("/auth?mode=signup")}
                  className="btn-blood rounded-lg"
                >
                  Реєстрація
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <Link
                to="/"
                className="font-body text-sm uppercase tracking-wide text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {navLabels.home}
              </Link>
              <Link
                to="/leaders"
                className="font-body text-sm uppercase tracking-wide text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {navLabels.leaders}
              </Link>
              {showApplyTab && (
                <Link
                  to="/apply"
                  className="font-body text-sm uppercase tracking-wide text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {navLabels.apply}
                </Link>
              )}
              {isMember && (
                <>
                  <Link
                    to="/information"
                    className="font-body text-sm uppercase tracking-wide text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {navLabels.info}
                  </Link>
                  <Link
                    to="/news"
                    className="font-body text-sm uppercase tracking-wide text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {navLabels.news}
                  </Link>
                  <Link
                    to="/giveaways"
                    className="font-body text-sm uppercase tracking-wide text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {navLabels.giveaways}
                  </Link>
                  <Link
                    to="/players"
                    className="font-body text-sm uppercase tracking-wide text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {navLabels.players}
                  </Link>
                  <Link
                    to="/cinema"
                    className="font-body text-sm uppercase tracking-wide text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {navLabels.cinema}
                  </Link>
                </>
              )}
              <div className="pt-4 border-t border-border">
                {user ? (
                  <div className="flex flex-col gap-2">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      {profile?.username || "Профіль"}
                    </Link>
                    <button
                      onClick={() => {
                        signOut();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-2 text-sm text-destructive"
                    >
                      <LogOut className="w-4 h-4" />
                      Вийти
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        navigate("/auth");
                        setIsMenuOpen(false);
                      }}
                      className="justify-start"
                    >
                      Увійти
                    </Button>
                    <Button
                      onClick={() => {
                        navigate("/auth?mode=signup");
                        setIsMenuOpen(false);
                      }}
                      className="btn-blood rounded-lg"
                    >
                      Реєстрація
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Garland hanging from navbar */}
      {garlandEnabled && <GarlandOnNavbar />}
    </nav>
  );
};