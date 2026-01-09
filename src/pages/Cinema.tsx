import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, Film, Users, Plus, DoorOpen, Trash2 } from "lucide-react";

interface CinemaRoom {
  id: string;
  name: string;
  max_seats: number;
  current_video_url: string | null;
  created_by: string;
  created_at: string;
  member_count?: number;
}

const Cinema = () => {
  const { user, profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<CinemaRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const isMember = profile?.role && ["member", "admin", "developer"].includes(profile.role);

  useEffect(() => {
    if (!authLoading && isMember) {
      fetchRooms();
      subscribeToRooms();
    }
  }, [authLoading, isMember]);

  const fetchRooms = async () => {
    const { data: roomsData } = await supabase
      .from("cinema_rooms")
      .select("*")
      .order("created_at", { ascending: false });

    if (roomsData) {
      // Get member counts for each room
      const roomsWithCounts = await Promise.all(
        roomsData.map(async (room) => {
          const { count } = await supabase
            .from("cinema_room_members")
            .select("*", { count: "exact", head: true })
            .eq("room_id", room.id);
          return { ...room, member_count: count || 0 };
        })
      );
      setRooms(roomsWithCounts);
    }
    setLoading(false);
  };

  const subscribeToRooms = () => {
    const channel = supabase
      .channel("cinema-rooms-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cinema_rooms" },
        () => fetchRooms()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cinema_room_members" },
        () => fetchRooms()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createRoom = async () => {
    if (!newRoomName.trim() || !user) return;

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("cinema_rooms")
        .insert({
          name: newRoomName.trim(),
          max_seats: 10,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Кімнату створено!" });
      setNewRoomName("");
      setDialogOpen(false);
      
      if (data) {
        navigate(`/cinema/${data.id}`);
      }
    } catch (error) {
      console.error("Error creating room:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося створити кімнату",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const deleteRoom = async (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from("cinema_rooms")
        .delete()
        .eq("id", roomId);

      if (error) throw error;
      toast({ title: "Кімнату видалено" });
    } catch (error) {
      console.error("Error deleting room:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося видалити кімнату",
        variant: "destructive",
      });
    }
  };

  const joinRoom = (roomId: string) => {
    navigate(`/cinema/${roomId}`);
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!isMember) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h1 className="font-display text-2xl font-bold mb-4">Доступ заборонено</h1>
          <p className="text-muted-foreground">
            Кінотеатр доступний тільки для учасників сім'ї
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Film className="w-8 h-8 text-primary" />
            <h1 className="font-display text-2xl md:text-3xl font-bold">Кінотеатр</h1>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-blood gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Створити кімнату</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Нова кімната</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Назва кімнати</Label>
                  <Input
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="Наприклад: Фільмовий вечір"
                    className="bg-secondary"
                    maxLength={50}
                  />
                </div>
                <Button
                  onClick={createRoom}
                  disabled={creating || !newRoomName.trim()}
                  className="w-full btn-blood"
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Створити
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {rooms.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Поки немає кімнат</h3>
              <p className="text-muted-foreground mb-4">
                Створіть першу кімнату, щоб дивитись відео разом!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <Card
                key={room.id}
                className="glass-card cursor-pointer hover:border-primary/50 transition-all group"
                onClick={() => joinRoom(room.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="truncate">{room.name}</span>
                    {room.created_by === user?.id && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => deleteRoom(room.id, e)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>
                        {room.member_count}/{room.max_seats}
                      </span>
                    </div>
                    <Button size="sm" variant="outline" className="gap-2">
                      <DoorOpen className="w-4 h-4" />
                      Увійти
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Cinema;