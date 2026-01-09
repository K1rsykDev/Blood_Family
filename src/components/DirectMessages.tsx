import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from "@/components/ui/context-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { MessageSquare, Send, Users, User, Loader2, X, ArrowLeft, Search, Check, CheckCheck, Pencil, Trash2, Reply, Smile } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

interface MessageReaction {
  id: string;
  message_id: string;
  message_type: "dm" | "general";
  user_id: string;
  emoji: string;
}

interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
  reply_to_id?: string | null;
  reply_to?: DirectMessage | null;
}

interface GeneralMessage {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  reply_to_id?: string | null;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
}

interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_at: string;
  other_user?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  unread_count?: number;
}

interface DirectMessagesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUserId?: string;
}

export const DirectMessages = ({ open, onOpenChange, initialUserId }: DirectMessagesProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [activeTab, setActiveTab] = useState<"conversations" | "general">("conversations");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [generalMessages, setGeneralMessages] = useState<GeneralMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [editingMessage, setEditingMessage] = useState<{ id: string; text: string; type: "dm" | "general" } | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; text: string; sender: string; type: "dm" | "general" } | null>(null);
  const [reactions, setReactions] = useState<MessageReaction[]>([]);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [contextMenuOpen, setContextMenuOpen] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const selectedConversationRef = useRef<string | null>(null);
  const shouldScrollToBottomRef = useRef(true);

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => (c.other_user?.username || "").toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  const scrollToBottom = (force = false) => {
    if (force || shouldScrollToBottomRef.current) {
      // Use "auto" for passive updates to avoid fighting user scroll.
      // Use "smooth" only for explicit/forced scrolls.
      messagesEndRef.current?.scrollIntoView({ behavior: force ? "smooth" : "auto" });
    }
  };

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    // Check if user is near bottom (within 100px)
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    shouldScrollToBottomRef.current = isNearBottom;
  }, []);

  useEffect(() => {
    // Only auto-scroll if user is near bottom
    if ((messages.length > 0 || generalMessages.length > 0) && shouldScrollToBottomRef.current) {
      scrollToBottom();
    }
  }, [messages, generalMessages]);

  useEffect(() => {
    if (open && user) {
      fetchConversations();
      fetchGeneralMessages();
      
      if (initialUserId && initialUserId !== user.id) {
        handleStartConversation(initialUserId);
      }
    }
  }, [open, user, initialUserId]);

  // Keep ref in sync with state
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // Stable channel refs to prevent duplicate subscriptions
  const dmChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const gcChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pendingFetchRef = useRef<{ dm: NodeJS.Timeout | null; conv: NodeJS.Timeout | null; gc: NodeJS.Timeout | null }>({ dm: null, conv: null, gc: null });

  useEffect(() => {
    if (!open || !user) return;

    // Cleanup any existing channels first
    if (dmChannelRef.current) {
      supabase.removeChannel(dmChannelRef.current);
      dmChannelRef.current = null;
    }
    if (gcChannelRef.current) {
      supabase.removeChannel(gcChannelRef.current);
      gcChannelRef.current = null;
    }

    let isSubscribed = true;

    // Debounced fetch functions to prevent rapid re-fetching
    const debouncedFetchMessages = (convId: string) => {
      if (pendingFetchRef.current.dm) clearTimeout(pendingFetchRef.current.dm);
      pendingFetchRef.current.dm = setTimeout(() => {
        if (isSubscribed && selectedConversationRef.current === convId) {
          fetchMessagesForConversation(convId, false);
        }
      }, 100);
    };

    const debouncedFetchConversations = () => {
      if (pendingFetchRef.current.conv) clearTimeout(pendingFetchRef.current.conv);
      pendingFetchRef.current.conv = setTimeout(() => {
        if (isSubscribed) fetchConversations();
      }, 150);
    };

    const debouncedFetchGeneralMessages = () => {
      if (pendingFetchRef.current.gc) clearTimeout(pendingFetchRef.current.gc);
      pendingFetchRef.current.gc = setTimeout(() => {
        if (isSubscribed) fetchGeneralMessages();
      }, 100);
    };

    // Use stable channel names (without Date.now())
    const dmChannel = supabase
      .channel('dm-realtime-' + user.id)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_messages',
        },
        (payload) => {
          if (!isSubscribed) return;
          
          const msg = (payload.new || payload.old) as DirectMessage;
          if (msg && (msg.sender_id === user.id || msg.receiver_id === user.id)) {
            const currentConv = selectedConversationRef.current;
            const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
            
            if (currentConv && currentConv === otherUserId) {
              debouncedFetchMessages(currentConv);
            }
            debouncedFetchConversations();
          }
        }
      )
      .subscribe();

    dmChannelRef.current = dmChannel;

    const gcChannel = supabase
      .channel('gc-realtime-' + user.id)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'general_chat',
        },
        () => {
          if (isSubscribed) debouncedFetchGeneralMessages();
        }
      )
      .subscribe();

    gcChannelRef.current = gcChannel;

    return () => {
      isSubscribed = false;
      // Clear pending timeouts
      if (pendingFetchRef.current.dm) clearTimeout(pendingFetchRef.current.dm);
      if (pendingFetchRef.current.conv) clearTimeout(pendingFetchRef.current.conv);
      if (pendingFetchRef.current.gc) clearTimeout(pendingFetchRef.current.gc);
      
      if (dmChannelRef.current) {
        supabase.removeChannel(dmChannelRef.current);
        dmChannelRef.current = null;
      }
      if (gcChannelRef.current) {
        supabase.removeChannel(gcChannelRef.current);
        gcChannelRef.current = null;
      }
    };
  }, [open, user]);

  const fetchConversations = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false });

    if (data) {
      const conversationsWithUsers = await Promise.all(
        data.map(async (conv) => {
          const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
          
          const [{ data: userData }, { count: unreadCount }] = await Promise.all([
            supabase
              .from("profiles")
              .select("id, username, avatar_url")
              .eq("id", otherUserId)
              .single(),
            supabase
              .from("direct_messages")
              .select("*", { count: "exact", head: true })
              .eq("sender_id", otherUserId)
              .eq("receiver_id", user.id)
              .eq("is_read", false)
          ]);
          
          return {
            ...conv,
            other_user: userData,
            unread_count: unreadCount || 0,
          };
        })
      );
      setConversations(conversationsWithUsers);
    }
  };

  const fetchMessagesForConversation = async (otherUserId: string, showLoading = true) => {
    if (!user) return;
    if (showLoading) setLoading(true);

    const { data } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });

    // Only update messages if this conversation is still selected (prevents race condition)
    if (data && selectedConversationRef.current === otherUserId) {
      setMessages(data as DirectMessage[]);
      // Fetch reactions for these messages
      fetchReactionsForMessages(data.map(m => m.id), "dm");
    }
    if (showLoading) setLoading(false);

    // Only mark as read if still viewing this conversation
    if (selectedConversationRef.current === otherUserId) {
      await supabase
        .from("direct_messages")
        .update({ is_read: true })
        .eq("receiver_id", user.id)
        .eq("sender_id", otherUserId);
    }
  };

  const fetchGeneralMessages = async () => {
    const { data } = await supabase
      .from("general_chat")
      .select(`
        *,
        profiles:user_id(username, avatar_url)
      `)
      .order("created_at", { ascending: true })
      .limit(100);

    if (data) {
      setGeneralMessages(data as GeneralMessage[]);
      // Fetch reactions for these messages
      fetchReactionsForMessages(data.map(m => m.id), "general");
    }
  };

  const fetchReactionsForMessages = async (messageIds: string[], type: "dm" | "general") => {
    if (messageIds.length === 0) return;
    
    const { data } = await supabase
      .from("message_reactions")
      .select("*")
      .in("message_id", messageIds)
      .eq("message_type", type);
    
    if (data) {
      setReactions(prev => {
        const filtered = prev.filter(r => !messageIds.includes(r.message_id));
        return [...filtered, ...data.map(d => ({ ...d, message_type: d.message_type as "dm" | "general" }))];
      });
    }
  };

  const toggleReaction = async (messageId: string, emoji: string, messageType: "dm" | "general") => {
    if (!user) return;
    
    const existingReaction = reactions.find(
      r => r.message_id === messageId && r.user_id === user.id && r.emoji === emoji
    );
    
    if (existingReaction) {
      await supabase.from("message_reactions").delete().eq("id", existingReaction.id);
      setReactions(prev => prev.filter(r => r.id !== existingReaction.id));
    } else {
      const { data, error } = await supabase.from("message_reactions").insert({
        message_id: messageId,
        message_type: messageType,
        user_id: user.id,
        emoji
      }).select().single();
      
      if (data && !error) {
        setReactions(prev => [...prev, { ...data, message_type: data.message_type as "dm" | "general" }]);
      }
    }
  };

  const getMessageReactions = (messageId: string) => {
    const msgReactions = reactions.filter(r => r.message_id === messageId);
    const grouped: { emoji: string; count: number; hasUser: boolean }[] = [];
    
    REACTION_EMOJIS.forEach(emoji => {
      const emojiReactions = msgReactions.filter(r => r.emoji === emoji);
      if (emojiReactions.length > 0) {
        grouped.push({
          emoji,
          count: emojiReactions.length,
          hasUser: emojiReactions.some(r => r.user_id === user?.id)
        });
      }
    });
    
    return grouped;
  };

  const startReply = (msgId: string, text: string, sender: string, type: "dm" | "general") => {
    setReplyingTo({ id: msgId, text, sender, type });
    setContextMenuOpen(null);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const handleStartConversation = async (otherUserId: string) => {
    if (!user) return;
    
    setMessages([]); // Clear old messages immediately
    setSelectedConversation(otherUserId);
    setActiveTab("conversations");
    shouldScrollToBottomRef.current = true; // Reset scroll behavior for new conversation
    
    const { data: existingConv } = await supabase
      .from("conversations")
      .select("*")
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`)
      .maybeSingle();

    if (!existingConv) {
      await supabase.from("conversations").insert({
        user1_id: user.id,
        user2_id: otherUserId,
      });
    }

    await fetchConversations();
    await fetchMessagesForConversation(otherUserId);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || sending) return;
    setSending(true);

    const messageText = newMessage.trim();

    try {
      if (activeTab === "general") {
        const { error } = await supabase.from("general_chat").insert({
          user_id: user.id,
          message: messageText,
          reply_to_id: replyingTo?.type === "general" ? replyingTo.id : null,
        });
        if (error) throw error;
      } else if (selectedConversation) {
        const { error } = await supabase.from("direct_messages").insert({
          sender_id: user.id,
          receiver_id: selectedConversation,
          message: messageText,
          reply_to_id: replyingTo?.type === "dm" ? replyingTo.id : null,
        });
        if (error) throw error;

        await supabase
          .from("conversations")
          .update({ last_message_at: new Date().toISOString() })
          .or(`and(user1_id.eq.${user.id},user2_id.eq.${selectedConversation}),and(user1_id.eq.${selectedConversation},user2_id.eq.${user.id})`);

        // Get sender username for notification
        const { data: senderProfile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();

        // Send notification (don't await to not block UI)
        supabase.functions.invoke("send-dm-notification", {
          body: {
            receiver_id: selectedConversation,
            sender_username: senderProfile?.username || "Користувач",
            message_preview: messageText,
          },
        }).catch(err => console.error("Notification error:", err));
      }

      setNewMessage("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося відправити повідомлення",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleEditMessage = async () => {
    if (!editingMessage || !newMessage.trim()) return;
    setSending(true);

    try {
      if (editingMessage.type === "dm") {
        const { error } = await supabase
          .from("direct_messages")
          .update({ message: newMessage.trim() })
          .eq("id", editingMessage.id);
        if (error) throw error;
        setMessages((prev) =>
          prev.map((m) => (m.id === editingMessage.id ? { ...m, message: newMessage.trim() } : m))
        );
      } else if (editingMessage.type === "general") {
        const { error } = await supabase
          .from("general_chat")
          .update({ message: newMessage.trim() })
          .eq("id", editingMessage.id);
        if (error) throw error;
        setGeneralMessages((prev) =>
          prev.map((m) => (m.id === editingMessage.id ? { ...m, message: newMessage.trim() } : m))
        );
      }
      setNewMessage("");
      setEditingMessage(null);
      toast({ title: "Повідомлення відредаговано" });
    } catch (error) {
      console.error("Error editing message:", error);
      toast({ title: "Помилка", description: "Не вдалося редагувати", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (msgId: string, type: "dm" | "general") => {
    try {
      if (type === "dm") {
        const { error } = await supabase.from("direct_messages").delete().eq("id", msgId);
        if (error) throw error;
        setMessages((prev) => prev.filter((m) => m.id !== msgId));
      } else if (type === "general") {
        const { error } = await supabase.from("general_chat").delete().eq("id", msgId);
        if (error) throw error;
        setGeneralMessages((prev) => prev.filter((m) => m.id !== msgId));
      }
      toast({ title: "Повідомлення видалено" });
    } catch (error) {
      console.error("Error deleting message:", error);
      toast({ title: "Помилка", description: "Не вдалося видалити", variant: "destructive" });
    }
    setContextMenuOpen(null);
  };

  const startEditing = (msgId: string, text: string, type: "dm" | "general") => {
    setEditingMessage({ id: msgId, text, type });
    setNewMessage(text);
    setContextMenuOpen(null);
  };

  const cancelEditing = () => {
    setEditingMessage(null);
    setNewMessage("");
  };

  const handleLongPressStart = useCallback((msgId: string) => {
    const timer = setTimeout(() => {
      setContextMenuOpen(msgId);
    }, 500);
    setLongPressTimer(timer);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  const selectedUser = conversations.find((c) => c.other_user?.id === selectedConversation)?.other_user;

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const shell = (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isMobile && activeTab === "conversations" && selectedConversation && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedConversation(null)}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Назад</span>
            </Button>
          )}

          <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>

          <div className="min-w-0">
            <p className="font-semibold leading-none truncate">
              {activeTab === "general" ? "Загальний чат" : selectedUser?.username || "Дірект"}
            </p>
            <p className="text-xs text-muted-foreground truncate">Blood Residence • повідомлення</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex min-h-0 flex-1 flex-col">
        <div className="px-4 pt-3 shrink-0">
          <TabsList className="grid w-full grid-cols-2 bg-secondary/60">
            <TabsTrigger value="conversations" className="gap-2">
              <User className="h-4 w-4" />
              Діалоги
            </TabsTrigger>
            <TabsTrigger value="general" className="gap-2">
              <Users className="h-4 w-4" />
              Чат
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Conversations */}
        <TabsContent value="conversations" className="m-0 min-h-0 flex-1 overflow-hidden">
          <div className="flex h-full w-full overflow-hidden">
            {/* List */}
            <aside
              className={
                "min-h-0 border-r border-border bg-background/40 " +
                (selectedConversation ? "hidden md:flex" : "flex") +
                " w-full md:w-80 flex-col"
              }
            >
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Пошук діалогів..."
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">Немає діалогів</p>
                    <p className="text-xs text-muted-foreground mt-1">Відкрий профіль гравця та натисни “Написати”.</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredConversations.map((conv) => {
                      const active = selectedConversation === conv.other_user?.id;
                      const unreadCount = conv.unread_count || 0;
                      return (
                        <button
                          key={conv.id}
                          onClick={() => {
                            const newId = conv.other_user?.id || null;
                            if (newId !== selectedConversation) {
                              setMessages([]); // Clear old messages immediately
                              setSelectedConversation(newId);
                              shouldScrollToBottomRef.current = true; // Reset scroll behavior
                              if (newId) fetchMessagesForConversation(newId);
                            }
                          }}
                          className={
                            "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors " +
                            (active ? "bg-secondary" : "hover:bg-secondary/60")
                          }
                        >
                          <div className="relative shrink-0">
                            {conv.other_user?.avatar_url ? (
                              <img
                                src={conv.other_user.avatar_url}
                                alt={`Аватар ${conv.other_user?.username || "користувача"}`}
                                className="h-10 w-10 rounded-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-5 w-5" />
                              </div>
                            )}
                            {unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                                {unreadCount > 99 ? "99+" : unreadCount}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{conv.other_user?.username}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {unreadCount > 0 ? `${unreadCount} непрочитаних` : "Натисни щоб відкрити"}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </aside>

            {/* Thread */}
            <main className={(selectedConversation ? "flex" : "hidden md:flex") + " min-h-0 flex-1 flex-col overflow-hidden"}>
              {!selectedConversation ? (
                <div className="flex h-full items-center justify-center p-8 text-center">
                  <div className="max-w-sm">
                    <p className="text-sm text-muted-foreground">Вибери діалог, щоб переглянути повідомлення.</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Thread header */}
                  <div className="flex items-center gap-3 border-b border-border px-4 py-3 shrink-0 bg-secondary/20">
                    {selectedUser?.avatar_url ? (
                      <img
                        src={selectedUser.avatar_url}
                        alt={`Аватар ${selectedUser.username}`}
                        className="h-9 w-9 rounded-full object-cover shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium leading-none truncate">{selectedUser?.username}</p>
                      <p className="text-xs text-muted-foreground">Приватний діалог</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div 
                    ref={messagesContainerRef}
                    onScroll={handleScroll}
                    className="min-h-0 flex-1 overflow-y-auto px-4 py-4 bg-background"
                  >
                    {loading ? (
                      <div className="flex justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <p className="text-sm">Напиши перше повідомлення.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((msg) => {
                          const mine = msg.sender_id === user?.id;
                          const msgReactions = getMessageReactions(msg.id);
                          const replyTo = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null;
                          
                          const msgContent = (
                            <div
                              className={
                                "max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm select-none " +
                                (mine ? "bg-primary text-primary-foreground" : "bg-secondary")
                              }
                              onTouchStart={() => handleLongPressStart(msg.id)}
                              onTouchEnd={handleLongPressEnd}
                              onTouchCancel={handleLongPressEnd}
                            >
                              {replyTo && (
                                <div className={`text-xs mb-2 p-2 rounded-lg border-l-2 ${mine ? "bg-primary-foreground/10 border-primary-foreground/50" : "bg-background/50 border-primary/50"}`}>
                                  <p className="opacity-70 truncate">{replyTo.message}</p>
                                </div>
                              )}
                              <p className="text-sm leading-snug break-words">{msg.message}</p>
                              <div className="mt-1 flex items-center gap-1 justify-end">
                                <span className="text-[11px] opacity-70">{formatTime(msg.created_at)}</span>
                                {mine && (
                                  msg.is_read ? (
                                    <CheckCheck className="h-3.5 w-3.5 text-blue-400" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5 opacity-70" />
                                  )
                                )}
                              </div>
                              {msgReactions.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {msgReactions.map(r => (
                                    <button
                                      key={r.emoji}
                                      onClick={() => toggleReaction(msg.id, r.emoji, "dm")}
                                      className={`text-xs px-1.5 py-0.5 rounded-full ${r.hasUser ? "bg-primary/20" : "bg-background/20"}`}
                                    >
                                      {r.emoji} {r.count}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );

                          return (
                            <div key={msg.id} className={"flex " + (mine ? "justify-end" : "justify-start")}>
                              <ContextMenu>
                                <ContextMenuTrigger asChild>
                                  {msgContent}
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                  <div className="flex gap-1 p-2">
                                    {REACTION_EMOJIS.map(emoji => (
                                      <button
                                        key={emoji}
                                        onClick={() => toggleReaction(msg.id, emoji, "dm")}
                                        className="text-lg hover:scale-125 transition-transform p-1"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                  <ContextMenuSeparator />
                                  <ContextMenuItem onClick={() => startReply(msg.id, msg.message, mine ? "Ви" : selectedUser?.username || "", "dm")}>
                                    <Reply className="h-4 w-4 mr-2" />
                                    Відповісти
                                  </ContextMenuItem>
                                  {mine && (
                                    <>
                                      <ContextMenuItem onClick={() => startEditing(msg.id, msg.message, "dm")}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Редагувати
                                      </ContextMenuItem>
                                      <ContextMenuItem onClick={() => handleDeleteMessage(msg.id, "dm")} className="text-destructive">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Видалити
                                      </ContextMenuItem>
                                    </>
                                  )}
                                </ContextMenuContent>
                              </ContextMenu>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  {/* Composer */}
                  <div className="shrink-0 border-t border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3">
                    {replyingTo && replyingTo.type === "dm" && (
                      <div className="flex items-center gap-2 mb-2 px-2 py-1 bg-secondary/50 rounded-lg text-sm">
                        <Reply className="h-3.5 w-3.5 text-primary" />
                        <span className="text-muted-foreground truncate flex-1">Відповідь на: {replyingTo.text.slice(0, 30)}...</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={cancelReply}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                    {editingMessage && editingMessage.type === "dm" && (
                      <div className="flex items-center gap-2 mb-2 px-2 py-1 bg-secondary/50 rounded-lg text-sm">
                        <Pencil className="h-3.5 w-3.5 text-primary" />
                        <span className="text-muted-foreground">Редагування</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={cancelEditing}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                    <div className="flex items-end gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={editingMessage ? "Редагувати повідомлення..." : replyingTo ? "Написати відповідь..." : "Написати повідомлення..."}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            editingMessage ? handleEditMessage() : sendMessage();
                          }
                          if (e.key === "Escape") {
                            if (editingMessage) cancelEditing();
                            if (replyingTo) cancelReply();
                          }
                        }}
                        className="flex-1"
                      />
                      <Button 
                        onClick={editingMessage ? handleEditMessage : sendMessage} 
                        disabled={sending}
                        size="icon" 
                        className="btn-blood shrink-0"
                      >
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        <span className="sr-only">{editingMessage ? "Зберегти" : "Відправити"}</span>
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </main>
          </div>
        </TabsContent>

        {/* General */}
        <TabsContent value="general" className="m-0 min-h-0 flex-1 overflow-hidden">
          <div className="min-h-0 h-full flex flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 bg-background">
              {generalMessages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <p className="text-sm">Поки що в чаті немає повідомлень</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {generalMessages.map((msg) => {
                    const mine = msg.user_id === user?.id;
                    const msgReactions = getMessageReactions(msg.id);
                    const replyTo = msg.reply_to_id ? generalMessages.find(m => m.id === msg.reply_to_id) : null;
                    
                    const msgContent = (
                      <div className={"max-w-[90%] " + (mine ? "" : "flex gap-2")}
                        onTouchStart={() => handleLongPressStart(msg.id)}
                        onTouchEnd={handleLongPressEnd}
                        onTouchCancel={handleLongPressEnd}
                      >
                        {!mine && (
                          msg.profiles?.avatar_url ? (
                            <img
                              src={msg.profiles.avatar_url}
                              alt={`Аватар ${msg.profiles?.username || "користувача"}`}
                              className="h-8 w-8 rounded-full object-cover shrink-0"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <User className="h-4 w-4" />
                            </div>
                          )
                        )}

                        <div className={"rounded-2xl px-3.5 py-2.5 shadow-sm " + (mine ? "bg-primary text-primary-foreground" : "bg-secondary")}>
                          {!mine && (
                            <p className="text-xs font-medium text-primary mb-1 truncate">{msg.profiles?.username}</p>
                          )}
                          {replyTo && (
                            <div className={`text-xs mb-2 p-2 rounded-lg border-l-2 ${mine ? "bg-primary-foreground/10 border-primary-foreground/50" : "bg-background/50 border-primary/50"}`}>
                              <p className="opacity-70 font-medium">{replyTo.profiles?.username}</p>
                              <p className="opacity-60 truncate">{replyTo.message}</p>
                            </div>
                          )}
                          <p className="text-sm leading-snug break-words">{msg.message}</p>
                          <p className="mt-1 text-[11px] opacity-70">{formatTime(msg.created_at)}</p>
                          {msgReactions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {msgReactions.map(r => (
                                <button
                                  key={r.emoji}
                                  onClick={() => toggleReaction(msg.id, r.emoji, "general")}
                                  className={`text-xs px-1.5 py-0.5 rounded-full ${r.hasUser ? "bg-primary/20" : "bg-background/20"}`}
                                >
                                  {r.emoji} {r.count}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );

                    return (
                      <div key={msg.id} className={"flex " + (mine ? "justify-end" : "justify-start")}>
                        <ContextMenu>
                          <ContextMenuTrigger asChild>
                            {msgContent}
                          </ContextMenuTrigger>
                          <ContextMenuContent>
                            <div className="flex gap-1 p-2">
                              {REACTION_EMOJIS.map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => toggleReaction(msg.id, emoji, "general")}
                                  className="text-lg hover:scale-125 transition-transform p-1"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                            <ContextMenuSeparator />
                            <ContextMenuItem onClick={() => startReply(msg.id, msg.message, msg.profiles?.username || "", "general")}>
                              <Reply className="h-4 w-4 mr-2" />
                              Відповісти
                            </ContextMenuItem>
                            {mine && (
                              <>
                                <ContextMenuItem onClick={() => startEditing(msg.id, msg.message, "general")}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Редагувати
                                </ContextMenuItem>
                                <ContextMenuItem onClick={() => handleDeleteMessage(msg.id, "general")} className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Видалити
                                </ContextMenuItem>
                              </>
                            )}
                          </ContextMenuContent>
                        </ContextMenu>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3">
              {replyingTo && replyingTo.type === "general" && (
                <div className="flex items-center gap-2 mb-2 px-2 py-1 bg-secondary/50 rounded-lg text-sm">
                  <Reply className="h-3.5 w-3.5 text-primary" />
                  <span className="text-muted-foreground truncate flex-1">Відповідь на: {replyingTo.text.slice(0, 30)}...</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={cancelReply}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              {editingMessage && editingMessage.type === "general" && (
                <div className="flex items-center gap-2 mb-2 px-2 py-1 bg-secondary/50 rounded-lg text-sm">
                  <Pencil className="h-3.5 w-3.5 text-primary" />
                  <span className="text-muted-foreground">Редагування</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={cancelEditing}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={editingMessage?.type === "general" ? "Редагувати повідомлення..." : replyingTo?.type === "general" ? "Написати відповідь..." : "Написати в загальний чат..."}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      editingMessage?.type === "general" ? handleEditMessage() : sendMessage();
                    }
                    if (e.key === "Escape") {
                      if (editingMessage) cancelEditing();
                      if (replyingTo) cancelReply();
                    }
                  }}
                  className="flex-1"
                />
                <Button onClick={editingMessage?.type === "general" ? handleEditMessage : sendMessage} disabled={sending} size="icon" className="btn-blood shrink-0">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span className="sr-only">{editingMessage ? "Зберегти" : "Відправити"}</span>
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[92dvh] p-0 flex flex-col gap-0 overflow-hidden">
          <VisuallyHidden>
            <SheetTitle>Дірект - Повідомлення</SheetTitle>
            <SheetDescription>Приватні повідомлення та загальний чат Blood Residence</SheetDescription>
          </VisuallyHidden>
          {shell}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden w-[95vw] sm:w-[92vw] max-w-5xl h-[85vh] sm:h-[680px] flex flex-col gap-0">
        <VisuallyHidden>
          <DialogTitle>Дірект - Повідомлення</DialogTitle>
          <DialogDescription>Приватні повідомлення та загальний чат Blood Residence</DialogDescription>
        </VisuallyHidden>
        {shell}
      </DialogContent>
    </Dialog>
  );
};
