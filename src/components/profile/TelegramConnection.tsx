import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Send, Copy, Check, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface TelegramConnectionProps {
  userId: string;
}

export const TelegramConnection = ({ userId }: TelegramConnectionProps) => {
  const { toast } = useToast();
  const [connectionCode, setConnectionCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchConnection = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("telegram_connections")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data) {
      setConnectionCode(data.connection_code);
      setIsConnected(data.is_connected);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchConnection();

    // Subscribe to connection updates
    const channel = supabase
      .channel("telegram-connection-channel")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "telegram_connections",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          setIsConnected(updated.is_connected);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const generateCode = async () => {
    setIsGenerating(true);
    try {
      // Generate a random 8-character code
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let code = "";
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Check if connection exists
      const { data: existing } = await supabase
        .from("telegram_connections")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        // Update existing
        await supabase
          .from("telegram_connections")
          .update({ connection_code: code, is_connected: false, telegram_chat_id: null })
          .eq("user_id", userId);
      } else {
        // Create new
        await supabase.from("telegram_connections").insert({
          user_id: userId,
          connection_code: code,
        });
      }

      setConnectionCode(code);
      setIsConnected(false);
      toast({
        title: "Код згенеровано!",
        description: "Введіть цей код в Telegram боті для підключення",
      });
    } catch (error) {
      console.error("Error generating code:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося згенерувати код",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyCode = async () => {
    if (!connectionCode) return;
    await navigator.clipboard.writeText(connectionCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast({
      title: "Скопійовано!",
    });
  };

  if (isLoading) {
    return (
      <div className="card-blood p-6">
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="card-blood p-6">
      <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
        <Send className="w-5 h-5 text-[#0088cc]" />
        Telegram
      </h3>

      {isConnected ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <Check className="w-6 h-6 text-green-500" />
            <div>
              <p className="font-semibold text-green-500">Підключено!</p>
              <p className="text-sm text-muted-foreground">
                Ви отримуєте сповіщення в Telegram
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={generateCode}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Перепідключити
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Підключіть Telegram щоб отримувати сповіщення про виплати контрактів,
            новини та інше.
          </p>

          {connectionCode ? (
            <div className="space-y-4">
              <div className="p-4 bg-secondary/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Ваш код підключення:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xl font-mono font-bold tracking-wider text-primary">
                    {connectionCode}
                  </code>
                  <Button variant="ghost" size="icon" onClick={copyCode}>
                    {isCopied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-[#0088cc]/10 border border-[#0088cc]/30 rounded-lg">
                <p className="text-sm font-semibold mb-2">Як підключити:</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Відкрийте бота <span className="text-[#0088cc] font-mono">@BloodFamilyBot</span></li>
                  <li>Натисніть "Start" або напишіть /start</li>
                  <li>Введіть код: <span className="font-mono font-bold">{connectionCode}</span></li>
                </ol>
              </div>

              <Button
                variant="outline"
                onClick={generateCode}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Згенерувати новий код
              </Button>
            </div>
          ) : (
            <Button
              onClick={generateCode}
              disabled={isGenerating}
              className="w-full btn-blood"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Отримати код підключення
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
