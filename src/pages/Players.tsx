import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Users, User, Palmtree } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PlayerProfile {
  id: string;
  username: string;
  role: string;
  custom_role_id: string | null;
  avatar_url: string | null;
  created_at: string;
  position_title: string | null;
  position_title_color: string | null;
  position_responsibility: string | null;
  sort_priority: number;
  has_nickname_glow: boolean;
  nickname_gradient_start: string | null;
  nickname_gradient_end: string | null;
  static: string | null;
  custom_roles?: {
    display_name: string;
    color: string;
  } | null;
}

interface ActiveVacation {
  user_id: string;
  end_date: string;
}

const Players = () => {
  const { user, profile, isLoading: authLoading } = useAuth();
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [activeVacations, setActiveVacations] = useState<Record<string, ActiveVacation>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const isMember = profile?.role === "member" || profile?.role === "admin" || profile?.role === "developer";

  useEffect(() => {
    const fetchPlayers = async () => {
      const { data } = await supabase
        .from("profiles")
        .select(`
          id, username, role, custom_role_id, avatar_url, created_at,
          position_title, position_title_color, position_responsibility, sort_priority,
          has_nickname_glow, nickname_gradient_start, nickname_gradient_end, static,
          custom_roles(display_name, color)
        `)
        .neq("role", "guest")
        .order("sort_priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (data) {
        setPlayers(data as PlayerProfile[]);
      }
      setLoading(false);
    };

    const fetchActiveVacations = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("vacations")
        .select("user_id, end_date")
        .eq("status", "approved")
        .lte("start_date", today)
        .gte("end_date", today);

      if (data) {
        const vacationsMap: Record<string, ActiveVacation> = {};
        data.forEach((v) => {
          vacationsMap[v.user_id] = v;
        });
        setActiveVacations(vacationsMap);
      }
    };

    if (isMember) {
      fetchPlayers();
      fetchActiveVacations();
    } else {
      setLoading(false);
    }
  }, [isMember]);

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

  const filteredPlayers = players.filter((player) =>
    player.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </div>
      </Layout>
    );
  }

  if (!isMember) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Доступ обмежено</h1>
          <p className="text-muted-foreground">
            Ця сторінка доступна тільки для учасників сім'ї
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <Users className="w-12 h-12 mx-auto text-primary mb-4" />
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Гравці Blood Residence
          </h1>
          <p className="text-muted-foreground">
            {filteredPlayers.length} гравців
          </p>
        </div>

        <div className="card-blood p-4 md:p-6">
          {/* Search */}
          <div className="mb-4 md:mb-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Пошук за нікнеймом..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary"
            />
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredPlayers.map((player, index) => (
              <Link 
                key={player.id} 
                to={`/profile/${player.id}`}
                className="block"
              >
                <div className="bg-secondary/30 rounded-xl p-4 hover:bg-secondary/50 transition-colors border border-border/50">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground w-6">{index + 1}</span>
                    {player.avatar_url ? (
                      <img
                        src={player.avatar_url}
                        alt={player.username}
                        className="w-12 h-12 rounded-full object-cover border-2 border-border"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center border-2 border-border">
                        <User className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span 
                          className={`font-semibold ${player.has_nickname_glow && player.nickname_gradient_start ? 'nickname-gradient-glow whitespace-nowrap' : 'truncate'}`}
                          data-text={player.username}
                          style={player.has_nickname_glow && player.nickname_gradient_start ? {
                            background: `linear-gradient(90deg, ${player.nickname_gradient_start}, ${player.nickname_gradient_end || player.nickname_gradient_start})`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            '--glow-color-start': player.nickname_gradient_start,
                            '--glow-color-end': player.nickname_gradient_end || player.nickname_gradient_start,
                          } as React.CSSProperties : undefined}
                        >
                          {player.username}
                        </span>
                        {activeVacations[player.id] && (
                          <span className="flex items-center gap-1 text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded">
                            <Palmtree className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <p className="text-sm mt-0.5">
                        {player.position_title ? (
                          <span 
                            className="font-medium"
                            style={{ color: player.position_title_color || undefined }}
                          >
                            {player.position_title}
                          </span>
                        ) : player.custom_roles ? (
                          <span style={{ color: player.custom_roles.color }}>
                            {player.custom_roles.display_name}
                          </span>
                        ) : (
                          <span className={roleColors[player.role] || "text-muted-foreground"}>
                            {roleLabels[player.role] || player.role}
                          </span>
                        )}
                      </p>
                      {player.position_responsibility && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {player.position_responsibility}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Посада</TableHead>
                  <TableHead>Нікнейм</TableHead>
                  <TableHead>Статик</TableHead>
                  <TableHead>Відповідальність</TableHead>
                  <TableHead className="text-right">Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlayers.map((player, index) => (
                  <TableRow key={player.id} className="hover:bg-secondary/30">
                    <TableCell className="font-mono text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      {player.position_title ? (
                        <span 
                          className="text-sm font-medium"
                          style={{ color: player.position_title_color || undefined }}
                        >
                          {player.position_title}
                        </span>
                      ) : player.custom_roles ? (
                        <span style={{ color: player.custom_roles.color }}>
                          {player.custom_roles.display_name}
                        </span>
                      ) : (
                        <span className={roleColors[player.role] || "text-muted-foreground"}>
                          {roleLabels[player.role] || player.role}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {player.avatar_url ? (
                          <img
                            src={player.avatar_url}
                            alt={player.username}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                            <User className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span 
                            className={`font-medium ${player.has_nickname_glow && player.nickname_gradient_start ? 'nickname-gradient-glow' : ''}`}
                            data-text={player.username}
                            style={player.has_nickname_glow && player.nickname_gradient_start ? {
                              background: `linear-gradient(90deg, ${player.nickname_gradient_start}, ${player.nickname_gradient_end || player.nickname_gradient_start})`,
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                              backgroundClip: "text",
                              '--glow-color-start': player.nickname_gradient_start,
                              '--glow-color-end': player.nickname_gradient_end || player.nickname_gradient_start,
                            } as React.CSSProperties : undefined}
                          >
                            {player.username}
                          </span>
                          {activeVacations[player.id] && (
                            <span className="flex items-center gap-1 text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded">
                              <Palmtree className="w-3 h-3" />
                              Відпустка
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {player.static ? (
                        <span className="text-sm font-mono text-primary">
                          {player.static}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {player.position_responsibility ? (
                        <span className="text-sm text-muted-foreground truncate block">
                          {player.position_responsibility}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/profile/${player.id}`}>
                          Профіль
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredPlayers.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Гравців не знайдено
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Players;
