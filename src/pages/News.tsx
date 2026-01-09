import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Newspaper, Calendar, Loader2 } from "lucide-react";

interface NewsItem {
  id: number;
  title: string;
  content: string;
  image_url: string | null;
  published_at: string;
}

const News = () => {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);

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
    const fetchNews = async () => {
      const { data } = await supabase
        .from("news")
        .select("*")
        .order("published_at", { ascending: false });

      if (data) {
        setNews(data as NewsItem[]);
      }
      setLoadingNews(false);
    };

    fetchNews();
  }, []);

  if (isLoading || loadingNews) {
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
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Newspaper className="w-12 h-12 mx-auto text-primary mb-4" />
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Новини
            </h1>
            <p className="text-muted-foreground">
              Останні події та оновлення Blood Residence
            </p>
          </div>

          {news.length === 0 ? (
            <div className="card-blood p-12 text-center">
              <p className="text-muted-foreground">
                Новин поки що немає
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {news.map((item) => (
                <article key={item.id} className="card-blood overflow-hidden">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Calendar className="w-4 h-4" />
                      {new Date(item.published_at).toLocaleDateString("uk-UA", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                    <h2 className="font-display text-xl font-bold mb-3">
                      {item.title}
                    </h2>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {item.content}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default News;
