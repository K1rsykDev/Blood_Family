import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";

interface NewsItem {
  id: number;
  title: string;
  content: string;
  image_url: string | null;
  published_at: string;
}

export const AdminNews = () => {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image_url: "",
  });

  const fetchNews = async () => {
    const { data } = await supabase
      .from("news")
      .select("*")
      .order("published_at", { ascending: false });

    if (data) {
      setNews(data as NewsItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const openDialog = (item?: NewsItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        content: item.content,
        image_url: item.image_url || "",
      });
    } else {
      setEditingItem(null);
      setFormData({ title: "", content: "", image_url: "" });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingItem) {
        const { error } = await supabase
          .from("news")
          .update({
            title: formData.title,
            content: formData.content,
            image_url: formData.image_url || null,
          })
          .eq("id", editingItem.id);

        if (error) throw error;
        toast({ title: "Новину оновлено" });
      } else {
        const { error } = await supabase
          .from("news")
          .insert([{
            title: formData.title,
            content: formData.content,
            image_url: formData.image_url || null,
          }]);

        if (error) throw error;
        toast({ title: "Новину створено" });
      }

      await fetchNews();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving news:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося зберегти новину",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteItem = async (id: number) => {
    const confirmed = await confirm({
      title: "Видалення новини",
      description: "Ви впевнені, що хочете видалити цю новину?",
      confirmText: "Видалити",
      variant: "destructive",
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase.from("news").delete().eq("id", id);
      if (error) throw error;

      await fetchNews();
      toast({ title: "Новину видалено" });
    } catch (error) {
      console.error("Error deleting news:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося видалити новину",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="card-blood p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-semibold">Новини</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()} className="btn-blood">
              <Plus className="w-4 h-4 mr-2" />
              Додати
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingItem ? "Редагувати новину" : "Нова новина"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Заголовок</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-secondary border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Вміст</Label>
                <Textarea
                  id="content"
                  rows={5}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="bg-secondary border-border resize-none"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image_url">URL зображення (опційно)</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="bg-secondary border-border"
                  placeholder="https://..."
                />
              </div>
              <Button type="submit" className="w-full btn-blood" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Зберегти"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {news.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Новин не знайдено
        </p>
      ) : (
        <div className="space-y-4">
          {news.map((item) => (
            <div key={item.id} className="p-4 bg-secondary/50 rounded-lg flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{item.content}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(item.published_at).toLocaleDateString("uk-UA")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="icon" variant="ghost" onClick={() => openDialog(item)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => deleteItem(item.id)} className="text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog />
    </div>
  );
};
