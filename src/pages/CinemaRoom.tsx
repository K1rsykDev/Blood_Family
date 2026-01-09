import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  ArrowLeft,
  Send,
  Users,
  Play,
  Pause,
  Link as LinkIcon,
  User,
  Crown,
} from "lucide-react";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface RoomMember {
  id: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

interface ChatMessage {
  id: string;
  message: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

interface Room {
  id: string;
  name: string;
  max_seats: number;
  current_video_url: string | null;
  video_playing: boolean;
  video_time: number;
  created_by: string;
}

const CinemaRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user, profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const isUpdatingRef = useRef(false);
  const lastSyncRef = useRef<number>(0);
  const playerInitializedRef = useRef(false);

  const isMember = profile?.role && ["member", "admin", "developer"].includes(profile.role);
  const isOwner = room?.created_by === user?.id;

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      console.log("YouTube API already loaded");
      return;
    }

    console.log("Loading YouTube IFrame API...");
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      console.log("YouTube IFrame API Ready");
    };
  }, []);

  useEffect(() => {
    if (!authLoading && isMember && roomId) {
      initRoom();
    }
    return () => {
      leaveRoom();
    };
  }, [authLoading, isMember, roomId]);

  // Initialize YouTube player when room and video are ready
  useEffect(() => {
    if (!room?.current_video_url) return;

    const videoId = extractYoutubeId(room.current_video_url);
    if (!videoId) return;

    // Skip if same video already initialized
    if (videoId === currentVideoId && playerRef.current) return;

    const initPlayer = () => {
      console.log("Initializing YouTube player with video:", videoId);
      
      // Destroy existing player
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.log("Error destroying player:", e);
        }
        playerRef.current = null;
      }

      setPlayerReady(false);

      // Wait for container to be in DOM
      const container = document.getElementById("youtube-player");
      if (!container) {
        console.log("Container not found, retrying...");
        setTimeout(initPlayer, 100);
        return;
      }

      try {
        playerRef.current = new window.YT.Player("youtube-player", {
          videoId,
          playerVars: {
            autoplay: 0,
            controls: isOwner ? 1 : 0,
            disablekb: isOwner ? 0 : 1,
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
            fs: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              console.log("YouTube player ready");
              setPlayerReady(true);
              setCurrentVideoId(videoId);
              
              // Sync to current room state
              if (room.video_time > 0) {
                event.target.seekTo(room.video_time, true);
              }
              if (room.video_playing) {
                event.target.playVideo();
              }
            },
            onStateChange: (event: any) => {
              console.log("Player state changed:", event.data);
              if (!isOwner || isUpdatingRef.current) return;
              handleOwnerStateChange(event.data);
            },
            onError: (event: any) => {
              console.error("YouTube player error:", event.data);
            },
          },
        });
      } catch (e) {
        console.error("Error creating player:", e);
      }
    };

    // Wait for YT API to load
    const checkAndInit = () => {
      if (window.YT && window.YT.Player) {
        initPlayer();
      } else {
        console.log("Waiting for YouTube API...");
        setTimeout(checkAndInit, 100);
      }
    };

    checkAndInit();

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.log("Error destroying player on cleanup:", e);
        }
        playerRef.current = null;
      }
    };
  }, [room?.current_video_url, isOwner]);

  // Sync video state from room updates (for non-owners)
  useEffect(() => {
    if (!room || !playerRef.current || !playerReady || isOwner) return;

    const now = Date.now();
    if (now - lastSyncRef.current < 500) return;
    lastSyncRef.current = now;

    isUpdatingRef.current = true;

    try {
      const currentTime = playerRef.current.getCurrentTime?.() || 0;
      const timeDiff = Math.abs(currentTime - room.video_time);

      // Sync time if difference is more than 2 seconds
      if (timeDiff > 2) {
        playerRef.current.seekTo(room.video_time, true);
      }

      // Sync play/pause state
      const playerState = playerRef.current.getPlayerState?.();
      const isPlaying = playerState === 1;

      if (room.video_playing && !isPlaying) {
        playerRef.current.playVideo();
      } else if (!room.video_playing && isPlaying) {
        playerRef.current.pauseVideo();
      }
    } catch (e) {
      console.error("Error syncing video:", e);
    }

    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 100);
  }, [room?.video_playing, room?.video_time, playerReady, isOwner]);

  const handleOwnerStateChange = useCallback(async (state: number) => {
    if (!roomId || !playerRef.current) return;

    const currentTime = playerRef.current.getCurrentTime?.() || 0;

    // YT.PlayerState: PLAYING = 1, PAUSED = 2
    if (state === 1) {
      await supabase
        .from("cinema_rooms")
        .update({ video_playing: true, video_time: currentTime })
        .eq("id", roomId);
    } else if (state === 2) {
      await supabase
        .from("cinema_rooms")
        .update({ video_playing: false, video_time: currentTime })
        .eq("id", roomId);
    }
  }, [roomId]);

  // Periodically sync time from owner
  useEffect(() => {
    if (!isOwner || !playerReady || !roomId) return;

    const interval = setInterval(async () => {
      if (!playerRef.current) return;
      
      const playerState = playerRef.current.getPlayerState?.();
      if (playerState === 1) { // Only sync while playing
        const currentTime = playerRef.current.getCurrentTime?.() || 0;
        await supabase
          .from("cinema_rooms")
          .update({ video_time: currentTime })
          .eq("id", roomId);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isOwner, playerReady, roomId]);

  const initRoom = async () => {
    await fetchRoom();
    await joinRoom();
    await fetchMembers();
    await fetchMessages();
    subscribeToChanges();
    setLoading(false);
  };

  const fetchRoom = async () => {
    if (!roomId) return;
    
    const { data } = await supabase
      .from("cinema_rooms")
      .select("*")
      .eq("id", roomId)
      .maybeSingle();

    if (data) {
      setRoom(data);
      setVideoUrl(data.current_video_url || "");
    } else {
      toast({
        title: "Кімнату не знайдено",
        variant: "destructive",
      });
      navigate("/cinema");
    }
  };

  const joinRoom = async () => {
    if (!roomId || !user) return;

    const { count } = await supabase
      .from("cinema_room_members")
      .select("*", { count: "exact", head: true })
      .eq("room_id", roomId);

    if (room && count && count >= room.max_seats) {
      toast({
        title: "Кімната повна",
        variant: "destructive",
      });
      navigate("/cinema");
      return;
    }

    await supabase.from("cinema_room_members").upsert({
      room_id: roomId,
      user_id: user.id,
    });
  };

  const leaveRoom = async () => {
    if (!roomId || !user) return;
    await supabase
      .from("cinema_room_members")
      .delete()
      .eq("room_id", roomId)
      .eq("user_id", user.id);
  };

  const fetchMembers = async () => {
    if (!roomId) return;
    
    const { data } = await supabase
      .from("cinema_room_members")
      .select("id, user_id, profiles(username, avatar_url)")
      .eq("room_id", roomId);

    if (data) {
      setMembers(data as unknown as RoomMember[]);
    }
  };

  const fetchMessages = async () => {
    if (!roomId) return;
    
    const { data } = await supabase
      .from("cinema_chat")
      .select("id, message, created_at, user_id, profiles(username, avatar_url)")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (data) {
      setMessages(data as unknown as ChatMessage[]);
      scrollToBottom();
    }
  };

  const subscribeToChanges = () => {
    if (!roomId) return;

    const channel = supabase
      .channel(`cinema-room-${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cinema_rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setRoom(payload.new as Room);
          } else if (payload.eventType === "DELETE") {
            toast({ title: "Кімнату видалено" });
            navigate("/cinema");
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cinema_room_members", filter: `room_id=eq.${roomId}` },
        () => fetchMembers()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "cinema_chat", filter: `room_id=eq.${roomId}` },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !roomId) return;

    const { error } = await supabase.from("cinema_chat").insert({
      room_id: roomId,
      user_id: user.id,
      message: newMessage.trim(),
    });

    if (!error) {
      setNewMessage("");
    }
  };

  const updateVideoUrl = async () => {
    if (!roomId || !isOwner) return;

    const youtubeId = extractYoutubeId(videoUrl);
    
    await supabase
      .from("cinema_rooms")
      .update({ 
        current_video_url: youtubeId ? videoUrl : null,
        video_playing: false,
        video_time: 0
      })
      .eq("id", roomId);

    setShowUrlInput(false);
  };

  const togglePlayPause = async () => {
    console.log("togglePlayPause called", { isOwner, playerRef: !!playerRef.current, roomId, playerReady });
    
    if (!isOwner) {
      console.log("Not owner, cannot control");
      return;
    }
    
    if (!playerRef.current) {
      console.log("Player not initialized");
      return;
    }
    
    if (!roomId) {
      console.log("No roomId");
      return;
    }

    try {
      const playerState = playerRef.current.getPlayerState();
      const currentTime = playerRef.current.getCurrentTime() || 0;
      
      console.log("Current player state:", playerState, "Current time:", currentTime);

      if (playerState === 1) {
        // Currently playing, pause it
        playerRef.current.pauseVideo();
        await supabase
          .from("cinema_rooms")
          .update({ video_playing: false, video_time: currentTime })
          .eq("id", roomId);
        console.log("Paused video");
      } else {
        // Not playing, play it
        playerRef.current.playVideo();
        await supabase
          .from("cinema_rooms")
          .update({ video_playing: true, video_time: currentTime })
          .eq("id", roomId);
        console.log("Started video");
      }
    } catch (e) {
      console.error("Error in togglePlayPause:", e);
    }
  };

  const extractYoutubeId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
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
        </div>
      </Layout>
    );
  }

  const hasVideo = !!room?.current_video_url && !!extractYoutubeId(room.current_video_url);

  return (
    <Layout>
      <div className="container mx-auto px-2 sm:px-4 py-4 min-h-0">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/cinema")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display text-lg sm:text-xl font-bold truncate">
            {room?.name}
          </h1>
          {isOwner && (
            <span className="flex items-center gap-1 text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
              <Crown className="w-3 h-3" />
              Власник
            </span>
          )}
          <div className="flex items-center gap-1 text-muted-foreground ml-auto">
            <Users className="w-4 h-4" />
            <span className="text-sm">{members.length}/{room?.max_seats}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Video Section */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              {hasVideo ? (
                <div id="youtube-player" className="w-full h-full" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                  <Play className="w-12 h-12 mb-2" />
                  <p className="text-sm">Відео не вибрано</p>
                </div>
              )}
              
            </div>

            {/* Video Controls */}
            <div className="mt-4 flex flex-wrap gap-2">
              {isOwner ? (
                <>
                  {hasVideo && (
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={togglePlayPause}
                    >
                      {room?.video_playing ? (
                        <>
                          <Pause className="w-4 h-4" />
                          Пауза
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Відтворити
                        </>
                      )}
                    </Button>
                  )}
                  
                  {showUrlInput ? (
                    <div className="flex gap-2 flex-1 min-w-[200px]">
                      <Input
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="YouTube URL..."
                        className="bg-secondary flex-1"
                      />
                      <Button onClick={updateVideoUrl} className="btn-blood">
                        Зберегти
                      </Button>
                      <Button variant="outline" onClick={() => setShowUrlInput(false)}>
                        Скасувати
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => setShowUrlInput(true)}
                    >
                      <LinkIcon className="w-4 h-4" />
                      {hasVideo ? "Змінити відео" : "Додати відео"}
                    </Button>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {room?.video_playing ? "▶ Відтворюється" : "⏸ На паузі"} • Керує власник кімнати
                </p>
              )}
            </div>

            {/* Members */}
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                У кімнаті:
              </h3>
              <div className="flex flex-wrap gap-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className={`flex items-center gap-2 px-2 py-1 rounded-full text-sm ${
                      member.user_id === room?.created_by 
                        ? "bg-yellow-500/20 border border-yellow-500/30" 
                        : "bg-secondary/50"
                    }`}
                  >
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={member.profiles.avatar_url || undefined} />
                      <AvatarFallback>
                        <User className="w-3 h-3" />
                      </AvatarFallback>
                    </Avatar>
                    <span>{member.profiles.username}</span>
                    {member.user_id === room?.created_by && (
                      <Crown className="w-3 h-3 text-yellow-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Section */}
          <div className="flex flex-col bg-secondary/30 rounded-lg border border-border h-[300px] lg:h-full">
            <div className="p-3 border-b border-border">
              <h3 className="font-semibold">Чат</h3>
            </div>
            
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex gap-2">
                    <Avatar className="w-6 h-6 flex-shrink-0">
                      <AvatarImage src={msg.profiles.avatar_url || undefined} />
                      <AvatarFallback>
                        <User className="w-3 h-3" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <span className="text-xs text-primary font-medium">
                        {msg.profiles.username}
                      </span>
                      <p className="text-sm break-words">{msg.message}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>

            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Повідомлення..."
                  className="bg-secondary text-sm"
                  maxLength={500}
                />
                <Button
                  size="icon"
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="btn-blood"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CinemaRoom;