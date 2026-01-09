import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Clock, Trophy, Loader2, Users, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Giveaway {
  id: number;
  title: string;
  description: string;
  prize: string;
  image_url: string | null;
  ends_at: string;
  is_active: boolean;
  winner_id: string | null;
}

interface Participant {
  giveaway_id: number;
  user_id: string;
}

interface Winner {
  username: string;
}

const Giveaways = () => {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [loadingGiveaways, setLoadingGiveaways] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantCounts, setParticipantCounts] = useState<Record<number, number>>({});
  const [winners, setWinners] = useState<Record<number, Winner>>({});
  const [participating, setParticipating] = useState<number | null>(null);

  const isMember = profile?.role === "member" || profile?.role === "admin" || profile?.role === "developer";

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!profile) return;
    if (!isMember) {
      navigate("/");
    }
  }, [user, profile, isLoading, navigate, isMember]);

  useEffect(() => {
    const fetchGiveaways = async () => {
      const { data } = await supabase
        .from("giveaways")
        .select("*")
        .eq("is_active", true)
        .order("ends_at", { ascending: true });

      if (data) {
        setGiveaways(data as Giveaway[]);
        
        // Fetch winners
        const winnersData: Record<number, Winner> = {};
        for (const giveaway of data) {
          if (giveaway.winner_id) {
            const { data: winnerProfile } = await supabase
              .from("profiles")
              .select("username")
              .eq("id", giveaway.winner_id)
              .maybeSingle();
            if (winnerProfile) {
              winnersData[giveaway.id] = winnerProfile;
            }
          }
        }
        setWinners(winnersData);
      }
      setLoadingGiveaways(false);
    };

    const fetchParticipants = async () => {
      if (!user) return;
      
      const { data: myParticipations } = await supabase
        .from("giveaway_participants")
        .select("giveaway_id, user_id")
        .eq("user_id", user.id);
      
      if (myParticipations) {
        setParticipants(myParticipations);
      }
    };

    const fetchCounts = async () => {
      const { data: allParticipants } = await supabase
        .from("giveaway_participants")
        .select("giveaway_id");
      
      if (allParticipants) {
        const counts: Record<number, number> = {};
        allParticipants.forEach((p) => {
          counts[p.giveaway_id] = (counts[p.giveaway_id] || 0) + 1;
        });
        setParticipantCounts(counts);
      }
    };

    fetchGiveaways();
    fetchParticipants();
    fetchCounts();
  }, [user]);

  const handleParticipate = async (giveawayId: number) => {
    if (!user) return;
    setParticipating(giveawayId);

    const isParticipating = participants.some(p => p.giveaway_id === giveawayId);

    try {
      if (isParticipating) {
        const { error } = await supabase
          .from("giveaway_participants")
          .delete()
          .eq("giveaway_id", giveawayId)
          .eq("user_id", user.id);

        if (error) throw error;
        
        setParticipants(prev => prev.filter(p => p.giveaway_id !== giveawayId));
        setParticipantCounts(prev => ({ ...prev, [giveawayId]: (prev[giveawayId] || 1) - 1 }));
        toast({ title: "Участь скасовано" });
      } else {
        const { error } = await supabase
          .from("giveaway_participants")
          .insert([{ giveaway_id: giveawayId, user_id: user.id }]);

        if (error) throw error;
        
        setParticipants(prev => [...prev, { giveaway_id: giveawayId, user_id: user.id }]);
        setParticipantCounts(prev => ({ ...prev, [giveawayId]: (prev[giveawayId] || 0) + 1 }));
        toast({ title: "Ви берете участь!" });
      }
    } catch (error) {
      console.error("Error toggling participation:", error);
      toast({ title: "Помилка", variant: "destructive" });
    } finally {
      setParticipating(null);
    }
  };

  const getTimeRemaining = (endsAt: string) => {
    const now = new Date();
    const end = new Date(endsAt);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Завершено";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} дн. ${hours} год.`;
    return `${hours} год.`;
  };

  const isEnded = (endsAt: string) => new Date(endsAt).getTime() < Date.now();

  if (isLoading || loadingGiveaways) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Gift className="w-12 h-12 mx-auto text-gold mb-4" />
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Розіграші
            </h1>
            <p className="text-muted-foreground">
              Бери участь та вигравай призи!
            </p>
          </div>

          {giveaways.length === 0 ? (
            <div className="card-blood p-12 text-center">
              <p className="text-muted-foreground">
                Активних розіграшів наразі немає
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {giveaways.map((giveaway) => {
                const isParticipating = participants.some(p => p.giveaway_id === giveaway.id);
                const ended = isEnded(giveaway.ends_at);
                const hasWinner = !!giveaway.winner_id;
                
                return (
                  <div key={giveaway.id} className="card-blood overflow-hidden group">
                    {giveaway.image_url && (
                      <img
                        src={giveaway.image_url}
                        alt={giveaway.title}
                        className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <div className="p-6">
                      <h2 className="font-display text-xl font-bold mb-2">
                        {giveaway.title}
                      </h2>
                      <p className="text-muted-foreground text-sm mb-4">
                        {giveaway.description}
                      </p>
                      
                      <div className="flex items-center gap-2 text-gold mb-3">
                        <Trophy className="w-5 h-5" />
                        <span className="font-semibold">{giveaway.prize}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{getTimeRemaining(giveaway.ends_at)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{participantCounts[giveaway.id] || 0} учасників</span>
                        </div>
                      </div>

                      {hasWinner && winners[giveaway.id] ? (
                        <div className="bg-gold/20 border border-gold/50 rounded-lg p-3 text-center">
                          <Trophy className="w-5 h-5 text-gold mx-auto mb-1" />
                          <p className="text-sm text-gold font-semibold">
                            Переможець: {winners[giveaway.id].username}
                          </p>
                        </div>
                      ) : ended ? (
                        <div className="bg-muted rounded-lg p-3 text-center">
                          <p className="text-sm text-muted-foreground">
                            Розіграш завершено, очікуємо результати
                          </p>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleParticipate(giveaway.id)}
                          disabled={participating === giveaway.id}
                          className={isParticipating ? "w-full bg-green-600 hover:bg-green-700" : "w-full btn-blood"}
                        >
                          {participating === giveaway.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : isParticipating ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Ви берете участь
                            </>
                          ) : (
                            "Беру участь"
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Giveaways;
