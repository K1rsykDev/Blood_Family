import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, Clock, CheckCircle, XCircle, Palmtree } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Vacation {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  created_at: string;
  vacation_type?: string;
}

interface VacationRequestProps {
  userId: string;
  userRole: string;
}

export const VacationRequest = ({ userId, userRole }: VacationRequestProps) => {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [vacationType, setVacationType] = useState<"ooc" | "ic">("ooc");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingVacation, setExistingVacation] = useState<Vacation | null>(null);
  const [activeVacation, setActiveVacation] = useState<Vacation | null>(null);
  const [loading, setLoading] = useState(true);

  const canRequest = userRole === "member" || userRole === "admin" || userRole === "developer";

  useEffect(() => {
    const fetchVacations = async () => {
      // Check for pending request
      const { data: pending } = await supabase
        .from("vacations")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "pending")
        .maybeSingle();

      if (pending) {
        setExistingVacation(pending);
      }

      // Check for active vacation
      const today = new Date().toISOString().split("T")[0];
      const { data: active } = await supabase
        .from("vacations")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "approved")
        .gte("end_date", today)
        .lte("start_date", today)
        .maybeSingle();

      if (active) {
        setActiveVacation(active);
      }

      setLoading(false);
    };

    fetchVacations();
  }, [userId]);

  const handleSubmit = async () => {
    if (!startDate || !endDate || !reason.trim()) {
      toast({
        title: "Помилка",
        description: "Заповніть всі поля",
        variant: "destructive",
      });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast({
        title: "Помилка",
        description: "Дата початку не може бути пізніше дати закінчення",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("vacations")
        .insert({
          user_id: userId,
          start_date: startDate,
          end_date: endDate,
          reason: reason.trim(),
          vacation_type: vacationType,
        });

      if (error) throw error;

      toast({
        title: "Заявку надіслано",
        description: "Очікуйте на рішення адміністрації",
      });

      setExistingVacation({
        id: "",
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
        status: "pending",
        created_at: new Date().toISOString(),
        vacation_type: vacationType,
      });
      setStartDate("");
      setEndDate("");
      setReason("");
    } catch (error) {
      console.error("Error submitting vacation request:", error);
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

  if (!canRequest) {
    return (
      <div className="card-blood p-6 text-center">
        <Palmtree className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-display text-lg font-semibold mb-2">Недоступно</h3>
        <p className="text-sm text-muted-foreground">
          Ця функція доступна тільки для учасників сім'ї
        </p>
      </div>
    );
  }

  if (activeVacation) {
    return (
      <div className="card-blood p-6">
        <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
          <Palmtree className="w-5 h-5 text-green-500" />
          Ви у відпустці!
        </h3>
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-2">
          <p className="text-sm">
            <span className="font-medium">Тип:</span>{" "}
            <span className={activeVacation.vacation_type === "ic" ? "text-blue-400" : "text-orange-400"}>
              {activeVacation.vacation_type === "ic" ? "IC (In Character)" : "OOC (Out of Character)"}
            </span>
          </p>
          <p className="text-sm">
            <span className="font-medium">Період:</span>{" "}
            {new Date(activeVacation.start_date).toLocaleDateString("uk-UA")} -{" "}
            {new Date(activeVacation.end_date).toLocaleDateString("uk-UA")}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Причина:</span> {activeVacation.reason}
          </p>
        </div>
      </div>
    );
  }

  if (existingVacation) {
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
          <Palmtree className="w-5 h-5 text-primary" />
          Заявка на відпустку
        </h3>
        <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            {statusIcons[existingVacation.status as keyof typeof statusIcons]}
            <span className="font-medium">
              {statusLabels[existingVacation.status as keyof typeof statusLabels]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Тип:</span>{" "}
            <span className={existingVacation.vacation_type === "ic" ? "text-blue-400" : "text-orange-400"}>
              {existingVacation.vacation_type === "ic" ? "IC (In Character)" : "OOC (Out of Character)"}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Період:</span>{" "}
            {new Date(existingVacation.start_date).toLocaleDateString("uk-UA")} -{" "}
            {new Date(existingVacation.end_date).toLocaleDateString("uk-UA")}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Причина:</span> {existingVacation.reason}
          </p>
          <p className="text-xs text-muted-foreground">
            Подано: {new Date(existingVacation.created_at).toLocaleDateString("uk-UA")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-blood p-6">
      <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
        <Palmtree className="w-5 h-5 text-primary" />
        Взяти відпустку
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Заповніть форму щоб подати заявку на відпустку. Після схвалення у вашому профілі буде відображатися статус "У відпустці".
      </p>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Дата початку</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-secondary"
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div className="space-y-2">
            <Label>Дата закінчення</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-secondary"
              min={startDate || new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>
        <div className="space-y-3">
          <Label>Тип відпустки</Label>
          <div className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg">
            <span className={`text-sm font-medium transition-colors ${vacationType === "ooc" ? "text-orange-400" : "text-muted-foreground"}`}>
              OOC
            </span>
            <Switch
              checked={vacationType === "ic"}
              onCheckedChange={(checked) => setVacationType(checked ? "ic" : "ooc")}
            />
            <span className={`text-sm font-medium transition-colors ${vacationType === "ic" ? "text-blue-400" : "text-muted-foreground"}`}>
              IC
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {vacationType === "ooc" 
              ? "OOC (Out of Character) — відпустка поза грою" 
              : "IC (In Character) — відпустка в рамках гри"}
          </p>
        </div>
        <div className="space-y-2">
          <Label>Причина відпустки</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Опишіть причину відпустки..."
            className="bg-secondary min-h-[100px]"
            maxLength={500}
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full btn-blood"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Calendar className="w-4 h-4 mr-2" />
          )}
          Подати заявку
        </Button>
      </div>
    </div>
  );
};
