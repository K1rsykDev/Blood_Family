import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bot-secret",
};

const BOT_SECRET = Deno.env.get("TELEGRAM_BOT_SECRET") || "BloodFamilyBot2024";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify bot secret
  const botSecret = req.headers.get("x-bot-secret");
  if (botSecret !== BOT_SECRET) {
    console.error("Invalid bot secret");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { action, ...params } = await req.json();
    console.log("Telegram bot action:", action, params);

    switch (action) {
      // Connect user account by code
      case "connect": {
        const { code, telegram_chat_id } = params;
        
        // Find connection by code
        const { data: connection, error: findError } = await supabase
          .from("telegram_connections")
          .select("id, user_id, profiles!inner(username)")
          .eq("connection_code", code.toUpperCase())
          .eq("is_connected", false)
          .maybeSingle();

        if (findError || !connection) {
          console.error("Connection not found:", findError);
          return new Response(JSON.stringify({ 
            success: false, 
            message: "❌ Невірний код або акаунт вже підключено" 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Update connection
        const { error: updateError } = await supabase
          .from("telegram_connections")
          .update({
            telegram_chat_id,
            is_connected: true,
            connected_at: new Date().toISOString(),
          })
          .eq("id", connection.id);

        if (updateError) {
          console.error("Update error:", updateError);
          throw updateError;
        }

        // Create notification
        await supabase.from("notifications").insert({
          user_id: connection.user_id,
          title: "Telegram підключено!",
          message: "Ваш Telegram акаунт успішно підключено. Тепер ви будете отримувати сповіщення.",
          type: "success",
        });

        const profile = connection.profiles as unknown as { username: string };

        return new Response(JSON.stringify({ 
          success: true, 
          message: `✅ Акаунт "${profile?.username}" успішно підключено!`,
          username: profile?.username
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Submit support ticket
      case "support": {
        const { telegram_chat_id, message, type = "support" } = params;

        // Find user by telegram_chat_id
        const { data: connection } = await supabase
          .from("telegram_connections")
          .select("user_id")
          .eq("telegram_chat_id", telegram_chat_id)
          .eq("is_connected", true)
          .maybeSingle();

        const { error } = await supabase.from("support_tickets").insert({
          user_id: connection?.user_id || null,
          telegram_chat_id,
          message,
          type,
        });

        if (error) throw error;

        return new Response(JSON.stringify({ 
          success: true, 
          message: type === "idea" 
            ? "💡 Дякуємо за ідею! Ми розглянемо її."
            : "📩 Ваше звернення отримано. Очікуйте відповідь." 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get pending notifications for connected user
      case "get_notifications": {
        const { telegram_chat_id } = params;

        // Find user
        const { data: connection } = await supabase
          .from("telegram_connections")
          .select("user_id")
          .eq("telegram_chat_id", telegram_chat_id)
          .eq("is_connected", true)
          .maybeSingle();

        if (!connection) {
          return new Response(JSON.stringify({ notifications: [] }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get unread notifications
        const { data: notifications } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", connection.user_id)
          .eq("is_read", false)
          .order("created_at", { ascending: false })
          .limit(10);

        return new Response(JSON.stringify({ notifications: notifications || [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Mark notifications as read
      case "mark_read": {
        const { notification_ids } = params;

        if (notification_ids?.length) {
          await supabase
            .from("notifications")
            .update({ is_read: true })
            .in("id", notification_ids);
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get pending support tickets for developer
      case "get_support_tickets": {
        const { telegram_chat_id } = params;

        // Check if user is developer
        const { data: connection } = await supabase
          .from("telegram_connections")
          .select("user_id, profiles!inner(role)")
          .eq("telegram_chat_id", telegram_chat_id)
          .eq("is_connected", true)
          .maybeSingle();

        const profile = connection?.profiles as unknown as { role: string } | null;
        
        if (!connection || profile?.role !== "developer") {
          return new Response(JSON.stringify({ 
            success: false, 
            message: "Тільки розробники можуть переглядати тікети" 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: tickets } = await supabase
          .from("support_tickets")
          .select("*, profiles(username)")
          .eq("status", "open")
          .order("created_at", { ascending: false })
          .limit(20);

        return new Response(JSON.stringify({ tickets: tickets || [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Respond to support ticket
      case "respond_ticket": {
        const { telegram_chat_id, ticket_id, response_message } = params;

        // Check if user is developer
        const { data: connection } = await supabase
          .from("telegram_connections")
          .select("user_id, profiles!inner(role)")
          .eq("telegram_chat_id", telegram_chat_id)
          .eq("is_connected", true)
          .maybeSingle();

        const profile = connection?.profiles as unknown as { role: string } | null;

        if (!connection || profile?.role !== "developer") {
          return new Response(JSON.stringify({ 
            success: false, 
            message: "Тільки розробники можуть відповідати на тікети" 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get ticket
        const { data: ticket } = await supabase
          .from("support_tickets")
          .select("*")
          .eq("id", ticket_id)
          .single();

        if (!ticket) {
          return new Response(JSON.stringify({ 
            success: false, 
            message: "Тікет не знайдено" 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Update ticket
        await supabase
          .from("support_tickets")
          .update({
            admin_response: response_message,
            responded_by: connection.user_id,
            status: "answered",
            updated_at: new Date().toISOString(),
          })
          .eq("id", ticket_id);

        return new Response(JSON.stringify({ 
          success: true, 
          user_telegram_chat_id: ticket.telegram_chat_id,
          message: "✅ Відповідь надіслано"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check connection status
      case "check_connection": {
        const { telegram_chat_id } = params;

        const { data: connection } = await supabase
          .from("telegram_connections")
          .select("user_id, profiles!inner(username, role)")
          .eq("telegram_chat_id", telegram_chat_id)
          .eq("is_connected", true)
          .maybeSingle();

        const profile = connection?.profiles as unknown as { username: string; role: string } | null;

        return new Response(JSON.stringify({ 
          connected: !!connection,
          username: profile?.username,
          is_developer: profile?.role === "developer"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error: unknown) {
    console.error("Telegram bot error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
