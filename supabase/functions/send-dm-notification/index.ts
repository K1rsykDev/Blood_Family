import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { receiver_id, sender_username, message_preview } = await req.json();
    
    console.log("DM notification request:", { receiver_id, sender_username, message_preview });

    if (!receiver_id || !sender_username) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create notification in database
    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: receiver_id,
      title: "Нове повідомлення",
      message: `${sender_username}: ${message_preview?.substring(0, 50)}${message_preview?.length > 50 ? '...' : ''}`,
      type: "message",
    });

    if (notifError) {
      console.error("Error creating notification:", notifError);
    }

    // Check if receiver has Telegram connected
    const { data: connection } = await supabase
      .from("telegram_connections")
      .select("telegram_chat_id")
      .eq("user_id", receiver_id)
      .eq("is_connected", true)
      .maybeSingle();

    if (connection?.telegram_chat_id && botToken) {
      // Send Telegram message
      const telegramMessage = `💬 *Нове повідомлення від ${sender_username}*\n\n${message_preview?.substring(0, 200)}${message_preview?.length > 200 ? '...' : ''}\n\n_Відкрийте сайт для відповіді_`;
      
      try {
        const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: connection.telegram_chat_id,
            text: telegramMessage,
            parse_mode: "Markdown",
          }),
        });

        const telegramResult = await telegramResponse.json();
        console.log("Telegram send result:", telegramResult);
      } catch (tgError) {
        console.error("Telegram send error:", tgError);
      }
    } else {
      console.log("No Telegram connection for user or no bot token");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("DM notification error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
