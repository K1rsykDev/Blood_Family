import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserMinus, Clock, CheckCircle, XCircle } from "lucide-react";

interface LeaveRequest {
  id: string;
  username_ingame: string;
  reason: string;
  status: string;
  created_at: string;
}

interface LeaveFamilyProps {
  userId: string;
  userRole: string;
}

export const LeaveFamily = ({ userId, userRole }: LeaveFamilyProps) => {
  const { toast } = useToast();
  const [usernameIngame, setUsernameIngame] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<LeaveRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const canLeave = userRole === "member" || userRole === "admin";

  useEffect(() => {
    const fetchExistingRequest = async () => {
      const { data } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "pending")
        .maybeSingle();

      if (data) {
        setExistingRequest(data);
      }
      setLoading(false);
    };

    fetchExistingRequest();
  }, [userId]);

  const handleSubmit = async () => {
    if (!usernameIngame.trim() || !reason.trim()) {
      toast({
        title: "Помилка",
        description: "Заповніть всі поля",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("leave_requests")
        .insert({
          user_id: userId,
          username_ingame: usernameIngame.trim(),
          reason: reason.trim(),
        });

      if (error) throw error;

      toast({
        title: "Заявку надіслано",
        description: "Очікуйте на рішення адміністрації",
      });

      setExistingRequest({
        id: "",
        username_ingame: usernameIngame.trim(),
        reason: reason.trim(),
        status: "pending",
        created_at: new Date().toISOString(),
      });
      setUsernameIngame("");
      setReason("");
    } catch (error) {
      console.error("Error submitting leave request:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося надіслати заявку",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="card-blood p-6 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
      </div>
    );
  }

  if (!canLeave) {
    return (
      <div className="card-blood p-6 text-center">
        <UserMinus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-display text-lg font-semibold mb-2">Недоступно</h3>
        <p className="text-sm text-muted-foreground">
          Ця функція доступна тільки для учасників сім'ї
        </p>
      </div>
    );
  }

  if (existingRequest) {
    const statusIcons = {
      pending: <Clock className="w-5 h-5 text-yellow-500" />,
      approved: <CheckCircle className="w-5 h-5 text-green-500" />,
      rejected: <XCircle className="w-5 h-5 text-red-500" />,
    };

    const statusLabels = {
      pending: "Очікує розгляду",
      approved: "Схвалено",
      rejected: "Відхилено",
    };

    return (
      <div className="card-blood p-6">
        <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
          <UserMinus className="w-5 h-5 text-primary" />
          Заявка на вихід
        </h3>
        <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            {statusIcons[existingRequest.status as keyof typeof statusIcons]}
            <span className="font-medium">
              {statusLabels[existingRequest.status as keyof typeof statusLabels]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Нік у грі:</span> {existingRequest.username_ingame}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Причина:</span> {existingRequest.reason}
          </p>
          <p className="text-xs text-muted-foreground">
            Подано: {new Date(existingRequest.created_at).toLocaleDateString("uk-UA")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-blood p-6">
      <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
        <UserMinus className="w-5 h-5 text-primary" />
        Покинути сім'ю
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Якщо ви хочете покинути Blood Residence, заповніть форму нижче. Після схвалення адміністрацією вашу роль буде знято.
      </p>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Нікнейм у грі</Label>
          <Input
            value={usernameIngame}
            onChange={(e) => setUsernameIngame(e.target.value)}
            placeholder="Ваш нікнейм у грі"
            className="bg-secondary"
            maxLength={50}
          />
        </div>
        <div className="space-y-2">
          <Label>Причина виходу</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Опишіть причину, чому ви хочете покинути сім'ю..."
            className="bg-secondary min-h-[100px]"
            maxLength={500}
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          variant="destructive"
          className="w-full"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <UserMinus className="w-4 h-4 mr-2" />
          )}
          Подати заявку на вихід
        </Button>
      </div>
    </div>
  );
};
