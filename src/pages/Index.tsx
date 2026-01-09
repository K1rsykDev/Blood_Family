import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Skull, Target, Users, DollarSign, Shield, Zap, Trophy, Gift } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { user } = useAuth();
  const [memberCount, setMemberCount] = useState(150);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("member_count")
        .eq("id", 1)
        .single();
      
      if (data?.member_count) {
        setMemberCount(data.member_count);
      }
    };
    fetchSettings();
  }, []);

  const benefits = [
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: "Високий заробіток",
      description: "Контракти з виплатами від 5000$ до 50000$",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Захист сім'ї",
      description: "Ми завжди прикриваємо своїх братів",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Дружній колектив",
      description: "Команда професіоналів, які стануть твоєю сім'єю",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Активність 24/7",
      description: "Завжди є хто в онлайні для спільних справ",
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: "Розіграші",
      description: "Щотижневі призи для активних учасників",
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Контракти",
      description: "Стабільний потік замовлень від перевірених клієнтів",
    },
  ];

  const stats = [
    { value: `${memberCount}+`, label: "Учасників" },
    { value: "$5M+", label: "Виплачено" },
    { value: "24/7", label: "Активність" },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden px-4">
        <div className="container mx-auto text-center relative z-10">
          <div className="animate-fade-up opacity-0" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
            <Skull className="w-16 h-16 md:w-24 md:h-24 mx-auto text-primary mb-4 md:mb-6 animate-float" />
          </div>
          
          <h1 
            className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black mb-4 md:mb-6 animate-fade-up opacity-0"
            style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}
          >
            <span className="text-gradient-blood">BLOOD</span>{" "}
            <span className="text-foreground">RESIDENCE</span>
          </h1>
          
          <p 
            className="font-body text-base sm:text-lg md:text-2xl max-w-2xl mx-auto mb-4 md:mb-6 animate-fade-up opacity-0 text-foreground drop-shadow-lg"
            style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}
          >
            <span className="bg-background/60 px-2 py-1 rounded">
              Найпотужніша сім'я на сервері. 
              Кров за кров. Blood понад усе.
            </span>
          </p>

          <div 
            className="mb-8 md:mb-10 animate-fade-up opacity-0"
            style={{ animationDelay: "0.35s", animationFillMode: "forwards" }}
          >
            <div className="inline-block p-3 md:p-6 bg-background/80 border border-primary/30 rounded-xl backdrop-blur-md">
              <div className="flex items-center gap-2 justify-center mb-1.5 md:mb-2">
                <Gift className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                <span className="text-xs md:text-sm uppercase tracking-wide text-muted-foreground">Наш промокод</span>
              </div>
              <p className="font-display text-xl md:text-3xl font-bold text-gradient-blood mb-1.5 md:mb-2">
                BLOOD
              </p>
              <p className="text-xs md:text-base text-muted-foreground max-w-md">
                50.000$ + Diamond VIP + Getter на 5 днів + 100.000$ від лідера сім'ї!
              </p>
            </div>
          </div>
          
          <div 
            className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center animate-fade-up opacity-0"
            style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}
          >
            <Link to="/apply">
              <Button className="btn-blood rounded-xl text-base md:text-lg px-6 md:px-10 py-5 md:py-6 w-full sm:w-auto pulse-blood">
                <Skull className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Приєднатися
              </Button>
            </Link>
            {!user && (
              <Link to="/auth">
                <Button 
                  variant="outline" 
                  className="rounded-xl text-base md:text-lg px-6 md:px-10 py-5 md:py-6 w-full sm:w-auto border-primary/50 hover:bg-primary/10"
                >
                  Увійти
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-16 relative">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-3 md:gap-6">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="card-blood p-4 md:p-6 text-center animate-fade-up opacity-0"
                style={{ animationDelay: `${0.1 * index}s`, animationFillMode: "forwards" }}
              >
                <div className="font-display text-2xl md:text-4xl font-bold text-primary mb-1 md:mb-2">
                  {stat.value}
                </div>
                <div className="font-body text-xs md:text-sm text-muted-foreground uppercase tracking-wide">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl md:text-4xl font-bold text-center mb-3 md:mb-4">
            Чому <span className="text-gradient-blood">Blood Residence</span>?
          </h2>
          <p className="text-center text-muted-foreground mb-8 md:mb-12 max-w-xl mx-auto text-sm md:text-base">
            Ми — не просто банда. Ми — сім'я, де кожен важливий.
          </p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={benefit.title}
                className="card-blood p-4 md:p-6 group hover:border-primary/50 transition-all duration-300 animate-fade-up opacity-0"
                style={{ animationDelay: `${0.1 * index}s`, animationFillMode: "forwards" }}
              >
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3 md:mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {benefit.icon}
                </div>
                <h3 className="font-display text-lg md:text-xl font-semibold mb-1.5 md:mb-2">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground text-sm md:text-base">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="card-blood p-6 md:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(0_72%_51%_/_0.2)_0%,_transparent_70%)]" />
            <div className="relative z-10">
              <h2 className="font-display text-2xl md:text-4xl font-bold mb-3 md:mb-4">
                Готовий стати частиною <span className="text-gradient-blood">сім'ї</span>?
              </h2>
              <p className="text-muted-foreground mb-6 md:mb-8 max-w-xl mx-auto text-sm md:text-base">
                Заповни заявку і ми зв'яжемося з тобою протягом 24 годин
              </p>
              <Link to="/apply">
                <Button className="btn-blood rounded-xl text-base md:text-lg px-8 md:px-10 py-5 md:py-6">
                  Подати заявку
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Skull className="w-6 h-6 text-primary" />
            <span className="font-display text-lg font-bold">BLOOD RESIDENCE</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Blood Residence. Всі права захищені.
          </p>
        </div>
      </footer>
    </Layout>
  );
};

export default Index;
