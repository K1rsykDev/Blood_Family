import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const useBrowserNotifications = () => {
  const { user, profile } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (!("Notification" in window)) return;

    const syncPermission = () => {
      setPermission(Notification.permission);
    };

    // Initial sync
    syncPermission();

    // Keep in sync after user changes permission via prompt/browser UI
    window.addEventListener("focus", syncPermission);
    document.addEventListener("visibilitychange", syncPermission);

    return () => {
      window.removeEventListener("focus", syncPermission);
      document.removeEventListener("visibilitychange", syncPermission);
    };
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, []);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission !== "granted") return;
    
    try {
      const notification = new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  }, [permission]);

  // Listen for new direct messages
  useEffect(() => {
    if (!user || permission !== "granted") return;

    console.log("[BrowserNotifications] Setting up DM listener for user:", user.id);

    const channel = supabase
      .channel(`browser-dm-notifications-${user.id}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log("[BrowserNotifications] New DM received:", payload);
          
          const newMessage = payload.new as {
            id: string;
            sender_id: string;
            message: string;
          };

          // Don't show notification if the page is focused
          if (document.hasFocus()) {
            console.log("[BrowserNotifications] Page is focused, skipping notification");
            return;
          }

          // Get sender's username
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", newMessage.sender_id)
            .single();

          const senderName = senderProfile?.username || "Хтось";
          
          console.log("[BrowserNotifications] Showing DM notification from:", senderName);
          showNotification(`Нове повідомлення від ${senderName}`, {
            body: newMessage.message.length > 100 
              ? newMessage.message.substring(0, 100) + "..." 
              : newMessage.message,
            tag: `dm-${newMessage.id}`,
          });
        }
      )
      .subscribe((status) => {
        console.log("[BrowserNotifications] DM channel status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, permission, showNotification]);

  // Listen for contract status changes (paid)
  useEffect(() => {
    if (!user || permission !== "granted") return;

    console.log("[BrowserNotifications] Setting up contract listener for user:", user.id);

    const channel = supabase
      .channel(`browser-contract-notifications-${user.id}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "contracts",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("[BrowserNotifications] Contract update received:", payload);
          
          const updatedContract = payload.new as {
            id: number;
            status: string;
            amount: number;
          };
          const oldContract = payload.old as { status: string };

          // Only notify when status changes to paid
          if (updatedContract.status === "paid" && oldContract.status !== "paid") {
            console.log("[BrowserNotifications] Showing contract paid notification");
            showNotification("Контракт виплачено! 💰", {
              body: `Ваш контракт на суму ${updatedContract.amount.toLocaleString()} виплачено!`,
              tag: `contract-paid-${updatedContract.id}`,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log("[BrowserNotifications] Contract channel status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, permission, showNotification]);

  // Listen for new notifications in the notifications table
  useEffect(() => {
    if (!user || permission !== "granted") return;

    console.log("[BrowserNotifications] Setting up notifications listener for user:", user.id);

    const channel = supabase
      .channel(`browser-notifications-${user.id}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("[BrowserNotifications] New notification received:", payload);
          
          const newNotification = payload.new as {
            id: string;
            title: string;
            message: string;
            type: string;
          };

          // Don't show if page is focused
          if (document.hasFocus()) {
            console.log("[BrowserNotifications] Page is focused, skipping notification");
            return;
          }

          console.log("[BrowserNotifications] Showing notification:", newNotification.title);
          showNotification(newNotification.title, {
            body: newNotification.message,
            tag: `notification-${newNotification.id}`,
          });
        }
      )
      .subscribe((status) => {
        console.log("[BrowserNotifications] Notifications channel status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, permission, showNotification]);

  return {
    permission,
    requestPermission,
    showNotification,
    isSupported: "Notification" in window,
  };
};
