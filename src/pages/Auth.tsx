import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skull, Mail, Lock, User, Loader2, KeyRound } from "lucide-react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  identifier: z.string().min(1, "Введіть email або нікнейм"),
  password: z.string().min(6, "Мінімум 6 символів"),
});

const signupSchema = z
  .object({
    email: z.string().email("Введіть коректний email"),
    username: z.string().min(3, "Мінімум 3 символи").max(50, "Максимум 50 символів"),
    password: z.string().min(6, "Мінімум 6 символів"),
    confirmPassword: z.string().min(6, "Мінімум 6 символів"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Паролі не співпадають",
    path: ["confirmPassword"],
  });

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [identifier, setIdentifier] = useState(""); // email or username for login
  const [email, setEmail] = useState(""); // for signup only
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  
  // Password reset flow
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const { signIn, signUp, user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && profile) {
      if (profile.password_reset_required) {
        setNeedsPasswordReset(true);
      } else {
        navigate("/");
      }
    }
  }, [user, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const result = loginSchema.safeParse({ identifier, password });
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

        // Check if identifier is email or username
        let loginEmail = identifier;
        if (!identifier.includes("@")) {
          // It's a username, fetch email
          try {
            const response = await supabase.functions.invoke("get-email-by-username", {
              body: { username: identifier },
            });
            
            if (response.error || response.data?.error) {
              setErrors({ identifier: "Користувача не знайдено" });
              setIsSubmitting(false);
              return;
            }
            
            loginEmail = response.data.email;
          } catch (err) {
            setErrors({ identifier: "Помилка пошуку користувача" });
            setIsSubmitting(false);
            return;
          }
        }

        const { error } = await signIn(loginEmail, password);
        if (error) {
          setIsSubmitting(false);
          return;
        }
        // Check will happen in useEffect after profile loads
      } else {
        const result = signupSchema.safeParse({ email, password, confirmPassword, username });
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

        const { error } = await signUp(email, password, username);
        if (!error) {
          navigate("/");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (newPassword.length < 6) {
      setErrors({ newPassword: "Мінімум 6 символів" });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrors({ confirmNewPassword: "Паролі не співпадають" });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Помилка",
          description: "Сесія закінчилась. Спробуйте увійти знову.",
          variant: "destructive",
        });
        setNeedsPasswordReset(false);
        return;
      }

      const response = await supabase.functions.invoke("set-new-password", {
        body: { new_password: newPassword },
      });

      if (response.error) throw response.error;

      toast({
        title: "Пароль змінено",
        description: "Ваш новий пароль успішно встановлено!",
      });

      // Refresh profile and navigate
      window.location.href = "/";
    } catch (error) {
      console.error("Error setting password:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося змінити пароль. Спробуйте ще раз.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password reset form
  if (needsPasswordReset) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <div className="card-blood p-8">
              <div className="text-center mb-8">
                <KeyRound className="w-16 h-16 mx-auto text-gold mb-4" />
                <h1 className="font-display text-2xl font-bold">
                  Встановіть новий пароль
                </h1>
                <p className="text-muted-foreground mt-2">
                  Адміністратор скинув ваш пароль. Введіть новий пароль для продовження.
                </p>
              </div>

              <form onSubmit={handleSetNewPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Новий пароль</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 bg-secondary border-border"
                    />
                  </div>
                  {errors.newPassword && (
                    <p className="text-sm text-destructive">{errors.newPassword}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">Підтвердіть пароль</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmNewPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="pl-10 bg-secondary border-border"
                    />
                  </div>
                  {errors.confirmNewPassword && (
                    <p className="text-sm text-destructive">{errors.confirmNewPassword}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full btn-blood rounded-lg py-6"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Встановити пароль"
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="card-blood p-8">
            <div className="text-center mb-8">
              <Skull className="w-16 h-16 mx-auto text-primary mb-4" />
              <h1 className="font-display text-2xl font-bold">
                {isLogin ? "Вхід в акаунт" : "Реєстрація"}
              </h1>
              <p className="text-muted-foreground mt-2">
                {isLogin
                  ? "Увійдіть щоб отримати доступ до функцій сім'ї"
                  : "Створіть акаунт щоб приєднатися"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="username">Нікнейм</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Ваш нікнейм"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 bg-secondary border-border"
                    />
                  </div>
                  {errors.username && (
                    <p className="text-sm text-destructive">{errors.username}</p>
                  )}
                </div>
              )}

              {isLogin ? (
                <div className="space-y-2">
                  <Label htmlFor="identifier">Email або нікнейм</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="email@example.com або нікнейм"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="pl-10 bg-secondary border-border"
                    />
                  </div>
                  {errors.identifier && (
                    <p className="text-sm text-destructive">{errors.identifier}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-secondary border-border"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-secondary border-border"
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Підтвердіть пароль</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 bg-secondary border-border"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full btn-blood rounded-lg py-6"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isLogin ? (
                  "Увійти"
                ) : (
                  "Зареєструватися"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isLogin
                  ? "Немає акаунту? Зареєструйтесь"
                  : "Вже є акаунт? Увійдіть"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Auth;
