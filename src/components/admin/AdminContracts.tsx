import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DollarSign, Clock, CheckCircle, XCircle, Loader2, Image as ImageIcon, Calculator, User, Trash2 } from "lucide-react";

interface Contract {
  id: number;
  user_id: string;
  discord_id: string | null;
  amount: number;
  description: string;
  image_url: string | null;
  status: string;
  created_at: string;
  profiles?: {
    username: string;
  };
}

export const AdminContracts = () => {
  const { profile } = useAuth();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const isDeveloper = profile?.role === "developer";

  // Calculator state
  const [calcInput, setCalcInput] = useState("");
  const [calcResult, setCalcResult] = useState<string>("");

  const fetchContracts = async () => {
    let query = supabase
      .from("contracts")
      .select(`*, profiles(username)`)
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter as "pending" | "approved" | "paid" | "rejected");
    }

    const { data } = await query;
    if (data) {
      setContracts(data as Contract[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContracts();
  }, [filter]);

  const updateStatus = async (id: number, status: "pending" | "approved" | "paid" | "rejected") => {
    setProcessingId(id);
    try {
      // Get contract to find user_id for BC reward
      const contract = contracts.find(c => c.id === id);
      
      const { error } = await supabase
        .from("contracts")
        .update({ status, notified: status === "paid" })
        .eq("id", id);

      if (error) throw error;

      // If contract is paid, give 200 BC to the user
      if (status === "paid" && contract) {
        // Get current balance
        const { data: profileData } = await supabase
          .from("profiles")
          .select("bc_balance")
          .eq("id", contract.user_id)
          .single();

        const currentBalance = (profileData as any)?.bc_balance || 0;
        
        // Update balance
        await supabase
          .from("profiles")
          .update({ bc_balance: currentBalance + 200 })
          .eq("id", contract.user_id);

        // Record transaction
        await supabase
          .from("bc_transactions")
          .insert({
            user_id: contract.user_id,
            amount: 200,
            type: "contract_payment",
            description: `Виплата за контракт #${id}`,
          });
      }

      await fetchContracts();
      toast({
        title: "Статус оновлено",
        description: status === "paid" ? "Контракт виплачено! +200 BC гравцю" : `Статус змінено на ${status}`,
      });
    } catch (error) {
      console.error("Error updating contract:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося оновити статус",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const deleteContract = async (id: number) => {
    const confirmed = await confirm({
      title: "Видалення контракту",
      description: "Видалити цей контракт назавжди?",
      confirmText: "Видалити",
      variant: "destructive",
    });
    if (!confirmed) return;
    
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("contracts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await fetchContracts();
      toast({
        title: "Контракт видалено",
      });
    } catch (error) {
      console.error("Error deleting contract:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося видалити контракт",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCalcInput = (value: string) => {
    setCalcInput(prev => prev + value);
  };

  const calculateResult = () => {
    try {
      // Safe eval using Function
      const result = new Function('return ' + calcInput)();
      setCalcResult(Number(result).toLocaleString());
    } catch {
      setCalcResult("Помилка");
    }
  };

  const clearCalc = () => {
    setCalcInput("");
    setCalcResult("");
  };

  const statusConfig = {
    pending: { label: "Очікує", color: "text-yellow-500", icon: Clock },
    approved: { label: "Схвалено", color: "text-blue-500", icon: CheckCircle },
    paid: { label: "Виплачено", color: "text-green-500", icon: CheckCircle },
    rejected: { label: "Відхилено", color: "text-red-500", icon: XCircle },
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <>
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Contracts List */}
        <div className="lg:col-span-3 card-blood p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-semibold">Контракти</h2>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40 bg-secondary">
                <SelectValue placeholder="Фільтр" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі</SelectItem>
                <SelectItem value="pending">Очікують</SelectItem>
                <SelectItem value="approved">Схвалені</SelectItem>
                <SelectItem value="paid">Виплачені</SelectItem>
                <SelectItem value="rejected">Відхилені</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {contracts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Контрактів не знайдено
            </p>
          ) : (
            <div className="space-y-4">
              {contracts.map((contract) => {
                const status = statusConfig[contract.status as keyof typeof statusConfig];
                const StatusIcon = status?.icon || Clock;

                return (
                  <div
                    key={contract.id}
                    className="p-4 bg-secondary/50 rounded-lg"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-display text-lg font-bold text-primary flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {contract.amount.toLocaleString()}
                          </span>
                          <span className={`flex items-center gap-1 text-sm ${status?.color}`}>
                            <StatusIcon className="w-4 h-4" />
                            {status?.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm text-muted-foreground">
                            <strong>Користувач:</strong> {contract.profiles?.username || "Невідомий"}
                          </p>
                          <Link 
                            to={`/profile/${contract.user_id}`}
                            className="text-primary hover:underline text-sm flex items-center gap-1"
                          >
                            <User className="w-3 h-3" />
                            Профіль
                          </Link>
                        </div>
                        {contract.discord_id && (
                          <p className="text-sm text-muted-foreground mb-1">
                            <strong>Discord ID:</strong> {contract.discord_id}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {contract.description}
                        </p>
                        
                        {contract.image_url && (
                          <div className="mt-3">
                            <button
                              onClick={() => setSelectedImage(contract.image_url)}
                              className="flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                              <ImageIcon className="w-4 h-4" />
                              Переглянути фото
                            </button>
                            <img 
                              src={contract.image_url} 
                              alt="Contract" 
                              className="mt-2 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setSelectedImage(contract.image_url)}
                            />
                          </div>
                        )}
                        
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(contract.created_at).toLocaleString("uk-UA")}
                        </p>
                      </div>

                      {contract.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(contract.id, "rejected")}
                            disabled={processingId === contract.id}
                            className="border-destructive text-destructive hover:bg-destructive/10"
                          >
                            Відхилити
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateStatus(contract.id, "paid")}
                            disabled={processingId === contract.id}
                            className="btn-blood"
                          >
                            {processingId === contract.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Виплатити"
                            )}
                          </Button>
                        </div>
                      )}

                      {isDeveloper && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteContract(contract.id)}
                          disabled={deletingId === contract.id}
                          className="text-destructive hover:bg-destructive/10 ml-2"
                        >
                          {deletingId === contract.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Calculator */}
        <div className="card-blood p-6">
          <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Калькулятор
          </h3>
          
          <div className="space-y-3">
            <Input
              value={calcInput}
              onChange={(e) => setCalcInput(e.target.value)}
              placeholder="Введіть вираз..."
              className="bg-secondary font-mono text-right"
            />
            
            {calcResult && (
              <div className="p-3 bg-primary/10 rounded-lg text-right">
                <span className="text-sm text-muted-foreground">Результат: </span>
                <span className="font-display text-xl font-bold text-primary">{calcResult}</span>
              </div>
            )}

            <div className="grid grid-cols-4 gap-2">
              {['7', '8', '9', '/'].map(btn => (
                <Button key={btn} variant="outline" onClick={() => handleCalcInput(btn)} className="h-10">
                  {btn}
                </Button>
              ))}
              {['4', '5', '6', '*'].map(btn => (
                <Button key={btn} variant="outline" onClick={() => handleCalcInput(btn)} className="h-10">
                  {btn}
                </Button>
              ))}
              {['1', '2', '3', '-'].map(btn => (
                <Button key={btn} variant="outline" onClick={() => handleCalcInput(btn)} className="h-10">
                  {btn}
                </Button>
              ))}
              {['0', '.', '=', '+'].map(btn => (
                <Button 
                  key={btn} 
                  variant={btn === '=' ? "default" : "outline"} 
                  onClick={() => btn === '=' ? calculateResult() : handleCalcInput(btn)} 
                  className={`h-10 ${btn === '=' ? 'btn-blood' : ''}`}
                >
                  {btn}
                </Button>
              ))}
            </div>

            <Button variant="outline" onClick={clearCalc} className="w-full">
              Очистити
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Фото контракту</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <img 
              src={selectedImage} 
              alt="Contract" 
              className="w-full max-h-[70vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDialog />
    </>
  );
};