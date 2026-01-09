import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, Loader2, DollarSign, Clock, CheckCircle, XCircle, Image, Trophy, Medal, Award } from "lucide-react";
import { z } from "zod";

const contractSchema = z.object({
  amount: z.number().min(1, "Сума має бути більше 0"),
  description: z.string().optional(),
});

interface Contract {
  id: number;
  amount: number;
  description: string;
  image_url: string | null;
  status: string;
  created_at: string;
}

interface LeaderboardEntry {
  user_id: string;
  username: string;
  count: number;
}

const Reports = () => {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [leaderboards, setLeaderboards] = useState<{
    daily: LeaderboardEntry[];
    weekly: LeaderboardEntry[];
    monthly: LeaderboardEntry[];
  }>({ daily: [], weekly: [], monthly: [] });

  const [formData, setFormData] = useState({
    amount: "",
    description: "",
  });

  const isMember = profile?.role === "member" || profile?.role === "admin" || profile?.role === "developer";

  useEffect(() => {
    // Wait for both auth and profile to load
    if (isLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    // Wait for profile to load before checking role
    if (!profile) return;
    if (!isMember) {
      navigate("/");
    }
  }, [user, profile, isLoading, navigate, isMember]);

  useEffect(() => {
    const fetchContracts = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("contracts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setContracts(data as Contract[]);
      }
    };

    fetchContracts();
  }, [user]);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Fetch all approved/paid contracts
      const { data: allContracts } = await supabase
        .from("contracts")
        .select("user_id, created_at, status")
        .in("status", ["approved", "paid"]);

      if (!allContracts) return;

      // Get profiles for user names
      const userIds = [...new Set(allContracts.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.username]) || []);

      // Calculate leaderboards
      const calculateLeaderboard = (contracts: typeof allContracts, since: Date): LeaderboardEntry[] => {
        const counts = new Map<string, number>();
        contracts
          .filter(c => new Date(c.created_at!) >= since)
          .forEach(c => {
            counts.set(c.user_id, (counts.get(c.user_id) || 0) + 1);
          });
        
        return Array.from(counts.entries())
          .map(([user_id, count]) => ({
            user_id,
            username: profileMap.get(user_id) || "Unknown",
            count
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
      };

      setLeaderboards({
        daily: calculateLeaderboard(allContracts, todayStart),
        weekly: calculateLeaderboard(allContracts, weekStart),
        monthly: calculateLeaderboard(allContracts, monthStart),
      });
    };

    fetchLeaderboards();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Файл занадто великий",
          description: "Максимальний розмір файлу 5MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('contracts')
      .upload(fileName, file);

    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }

    const { data: publicUrl } = supabase.storage
      .from('contracts')
      .getPublicUrl(fileName);

    return publicUrl.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    const data = {
      amount: parseFloat(formData.amount) || 0,
      description: formData.description,
    };

    const result = contractSchema.safeParse(data);
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
      let imageUrl: string | null = null;

      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile);
      }

      const { data: newContract, error } = await supabase
        .from("contracts")
        .insert([
          {
            user_id: user?.id,
            discord_id: profile?.discord_id,
            amount: data.amount,
            description: data.description,
            image_url: imageUrl,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setContracts([newContract as Contract, ...contracts]);
      setFormData({ amount: "", description: "" });
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast({
        title: "Звіт створено!",
        description: "Очікуйте на виплату.",
      });
    } catch (error) {
      console.error("Error creating contract:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося створити звіт.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusConfig = {
    pending: { label: "Очікує", color: "text-yellow-500", icon: Clock },
    approved: { label: "Схвалено", color: "text-blue-500", icon: CheckCircle },
    paid: { label: "Виплачено", color: "text-green-500", icon: CheckCircle },
    rejected: { label: "Відхилено", color: "text-red-500", icon: XCircle },
  };

  const LeaderboardCard = ({ title, entries, icon: Icon }: { title: string; entries: LeaderboardEntry[]; icon: React.ElementType }) => (
    <div className="bg-secondary/30 rounded-lg p-3">
      <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        {title}
      </h3>
      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">Немає даних</p>
      ) : (
        <div className="space-y-1">
          {entries.map((entry, idx) => (
            <div key={entry.user_id} className="flex items-center justify-between text-xs">
              <span className={idx === 0 ? "text-gold font-semibold" : "text-muted-foreground"}>
                {idx + 1}. {entry.username}
              </span>
              <span className="text-primary font-semibold">{entry.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 md:mb-8">
            <h1 className="font-display text-2xl md:text-4xl font-bold mb-2">
              Звіти по контрактах
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Створюйте звіти про виконані контракти та отримуйте виплати
            </p>
          </div>

          {/* Mobile Leaderboards - horizontal scroll */}
          <div className="lg:hidden mb-6">
            <div className="card-blood p-4">
              <h2 className="font-display text-base font-semibold mb-3 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-gold" />
                Топ гравців
              </h2>
              <div className="grid grid-cols-3 gap-2">
                <LeaderboardCard title="День" entries={leaderboards.daily} icon={Trophy} />
                <LeaderboardCard title="Тиждень" entries={leaderboards.weekly} icon={Medal} />
                <LeaderboardCard title="Місяць" entries={leaderboards.monthly} icon={Award} />
              </div>
              <div className="mt-3 p-2 bg-primary/10 border border-primary/30 rounded-lg">
                <p className="text-xs text-center text-muted-foreground">
                  🏆 Топ 1 за місяць отримає винагороду!
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-6 md:gap-8">
            {/* Desktop Leaderboards Sidebar */}
            <div className="hidden lg:block lg:col-span-1 space-y-4">
              <div className="card-blood p-4">
                <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-gold" />
                  Топ гравців
                </h2>
                <div className="space-y-3">
                  <LeaderboardCard title="За день" entries={leaderboards.daily} icon={Trophy} />
                  <LeaderboardCard title="За тиждень" entries={leaderboards.weekly} icon={Medal} />
                  <LeaderboardCard title="За місяць" entries={leaderboards.monthly} icon={Award} />
                </div>
                <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-lg">
                  <p className="text-xs text-center text-muted-foreground">
                    🏆 В кінці місяця топ 1 за місяць отримає винагороду!
                  </p>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 grid lg:grid-cols-2 gap-6 md:gap-8">
              {/* New Report Form */}
              <div className="card-blood p-6">
                <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Новий звіт
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Сума контракту ($)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="amount"
                        type="number"
                        placeholder="5000"
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData({ ...formData, amount: e.target.value })
                        }
                        className="pl-10 bg-secondary border-border"
                      />
                    </div>
                    {errors.amount && (
                      <p className="text-sm text-destructive">{errors.amount}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Опис контракту</Label>
                    <Textarea
                      id="description"
                      placeholder="Опишіть деталі виконаного контракту..."
                      rows={4}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      className="bg-secondary border-border resize-none"
                    />
                    {errors.description && (
                      <p className="text-sm text-destructive">{errors.description}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image">Скріншот/Фото</Label>
                    <div 
                      className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {previewUrl ? (
                        <div className="relative">
                          <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className="max-h-40 mx-auto rounded-lg object-contain"
                          />
                          <p className="text-sm text-muted-foreground mt-2">
                            Натисніть щоб змінити
                          </p>
                        </div>
                      ) : (
                        <>
                          <Image className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Натисніть щоб завантажити фото
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPG до 5MB
                          </p>
                        </>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full btn-blood rounded-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Створити звіт
                      </>
                    )}
                  </Button>
                </form>
              </div>

              {/* Contracts List */}
              <div className="card-blood p-6">
                <h2 className="font-display text-xl font-semibold mb-4">
                  Мої контракти
                </h2>

                {contracts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    У вас ще немає звітів
                  </p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {contracts.map((contract) => {
                      const status = statusConfig[contract.status as keyof typeof statusConfig];
                      const StatusIcon = status.icon;

                      return (
                        <div
                          key={contract.id}
                          className="p-4 bg-secondary/50 rounded-lg"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className="font-display text-lg font-bold text-primary">
                              ${contract.amount.toLocaleString()}
                            </span>
                            <span className={`flex items-center gap-1 text-sm ${status.color}`}>
                              <StatusIcon className="w-4 h-4" />
                              {status.label}
                            </span>
                          </div>
                          {contract.image_url && (
                            <img 
                              src={contract.image_url} 
                              alt="Contract" 
                              className="w-full h-24 object-cover rounded-lg mb-2"
                            />
                          )}
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {contract.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(contract.created_at).toLocaleDateString("uk-UA")}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
