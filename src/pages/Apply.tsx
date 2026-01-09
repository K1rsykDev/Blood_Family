import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Skull, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { z } from "zod";

const applicationSchema = z.object({
  username: z.string().min(2, "Мінімум 2 символи").max(100, "Максимум 100 символів"),
  static: z.string().min(1, "Обов'язкове поле"),
  age: z.number().min(1, "Вкажіть вік").max(99, "Перевірте вік"),
  timezone: z.string().min(1, "Вкажіть часовий пояс"),
  playtime: z.string().min(1, "Оберіть варіант"),
  motive: z.string().min(5, "Мінімум 5 символів").max(1000, "Максимум 1000 символів"),
  discord_id: z.string().min(2, "Вкажіть Discord для зв'язку"),
});

const Apply = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    username: "",
    static: "",
    age: "",
    timezone: "",
    playtime: "",
    motive: "",
    discord_id: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    const data = {
      ...formData,
      age: parseInt(formData.age) || 0,
    };

    const result = applicationSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.from("applications").insert([
        {
          username: data.username,
          static: data.static,
          age: data.age,
          timezone: data.timezone,
          playtime: data.playtime,
          motive: data.motive,
          discord_id: data.discord_id,
        },
      ]);

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: "Заявку відправлено!",
        description: "Ми розглянемо її найближчим часом.",
      });
    } catch (error) {
      console.error("Error submitting application:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося відправити заявку. Спробуйте пізніше.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto text-center">
            <div className="card-blood p-12">
              <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-6" />
              <h1 className="font-display text-2xl font-bold mb-4">
                Заявку відправлено!
              </h1>
              <p className="text-muted-foreground">
                Дякуємо за інтерес до Blood Residence. Ми розглянемо вашу заявку
                та зв'яжемося з вами через Discord протягом 24 годин.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Skull className="w-16 h-16 mx-auto text-primary mb-4" />
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Заявка на вступ
            </h1>
            <p className="text-muted-foreground">
              Заповніть форму і станьте частиною нашої сім'ї
            </p>
          </div>

          {/* Registration notice */}
          {!user && (
            <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-foreground">
                  Рекомендуємо спочатку{" "}
                  <Link to="/auth?mode=signup" className="text-primary hover:underline font-semibold">
                    зареєструвати акаунт
                  </Link>
                  , щоб відслідковувати статус заявки та отримати доступ до функцій сім'ї після схвалення.
                </p>
              </div>
            </div>
          )}

          <div className="card-blood p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="username">Нік на сервері *</Label>
                  <Input
                    id="username"
                    placeholder="Ваш ігровий нік"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="bg-secondary border-border"
                  />
                  {errors.username && (
                    <p className="text-sm text-destructive">{errors.username}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="static">Статік *</Label>
                  <Input
                    id="static"
                    placeholder="Ваш статік на сервері"
                    value={formData.static}
                    onChange={(e) =>
                      setFormData({ ...formData, static: e.target.value })
                    }
                    className="bg-secondary border-border"
                  />
                  {errors.static && (
                    <p className="text-sm text-destructive">{errors.static}</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="age">Скільки вам років *</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="18"
                    min="1"
                    max="99"
                    value={formData.age}
                    onChange={(e) =>
                      setFormData({ ...formData, age: e.target.value })
                    }
                    className="bg-secondary border-border"
                  />
                  {errors.age && (
                    <p className="text-sm text-destructive">{errors.age}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Часовий пояс *</Label>
                  <Input
                    id="timezone"
                    placeholder="Наприклад: UTC+2 (Київ)"
                    value={formData.timezone}
                    onChange={(e) =>
                      setFormData({ ...formData, timezone: e.target.value })
                    }
                    className="bg-secondary border-border"
                  />
                  {errors.timezone && (
                    <p className="text-sm text-destructive">{errors.timezone}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="playtime">Скільки можете грати *</Label>
                <Select
                  value={formData.playtime}
                  onValueChange={(value) =>
                    setFormData({ ...formData, playtime: value })
                  }
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Оберіть варіант" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily-4h">Щодня 4+ годин</SelectItem>
                    <SelectItem value="daily-2h">Щодня 2-4 години</SelectItem>
                    <SelectItem value="weekends">Тільки вихідні</SelectItem>
                    <SelectItem value="irregular">Нерегулярно</SelectItem>
                  </SelectContent>
                </Select>
                {errors.playtime && (
                  <p className="text-sm text-destructive">{errors.playtime}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="discord_id">Discord для зв'язку *</Label>
                <Input
                  id="discord_id"
                  placeholder="Ваш Discord нік (наприклад: username#1234)"
                  value={formData.discord_id}
                  onChange={(e) =>
                    setFormData({ ...formData, discord_id: e.target.value })
                  }
                  className="bg-secondary border-border"
                />
                {errors.discord_id && (
                  <p className="text-sm text-destructive">{errors.discord_id}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="motive">Чому хочете приєднатися до Blood Residence? *</Label>
                <Textarea
                  id="motive"
                  placeholder="Розкажіть про себе, свій досвід на RP серверах, чому хочете бути в нашій сім'ї..."
                  rows={5}
                  value={formData.motive}
                  onChange={(e) =>
                    setFormData({ ...formData, motive: e.target.value })
                  }
                  className="bg-secondary border-border resize-none"
                />
                {errors.motive && (
                  <p className="text-sm text-destructive">{errors.motive}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full btn-blood rounded-lg py-6 text-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Відправляємо...
                  </>
                ) : (
                  <>
                    <Skull className="w-5 h-5 mr-2" />
                    Відправити заявку
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Apply;
