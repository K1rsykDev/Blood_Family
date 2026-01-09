import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Loader2 } from "lucide-react";

const Leaders = () => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaders = async () => {
      const { data } = await supabase
        .from("blood_leaders")
        .select("content")
        .eq("id", 1)
        .maybeSingle();

      if (data) {
        setContent(data.content);
      }
      setLoading(false);
    };

    fetchLeaders();
  }, []);

  // Simple markdown to HTML conversion
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('# ')) {
        return <h1 key={index} className="font-display text-2xl md:text-4xl font-bold mb-4 md:mb-6 text-gradient-blood">{line.slice(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="font-display text-xl md:text-2xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-gold">{line.slice(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={index} className="font-display text-lg md:text-xl font-semibold mt-4 md:mt-6 mb-2 md:mb-3">{line.slice(4)}</h3>;
      }
      if (line.startsWith('- ')) {
        const content = line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary">$1</strong>');
        return (
          <div key={index} className="flex items-start gap-2 md:gap-3 mb-2 ml-2 md:ml-4">
            <span className="text-primary mt-1">•</span>
            <span className="text-sm md:text-base" dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        );
      }
      if (line.trim() === '') {
        return <div key={index} className="h-1.5 md:h-2" />;
      }
      return <p key={index} className="text-muted-foreground mb-2 text-sm md:text-base">{line}</p>;
    });
  };

  if (loading) {
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
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 md:mb-8">
            <Crown className="w-12 h-12 md:w-16 md:h-16 mx-auto text-gold mb-3 md:mb-4" />
          </div>
          
          <div className="card-blood p-4 md:p-8">
            {renderContent(content)}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Leaders;
