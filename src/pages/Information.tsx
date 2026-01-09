import { Layout } from "@/components/Layout";

const Information = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header Image */}
          <div className="relative h-40 sm:h-48 md:h-64 rounded-xl overflow-hidden mb-4 md:mb-6">
            <img
              src="/images/info-header-v2.png"
              alt="Blood Residence"
              className="w-full h-full object-cover object-center"
              loading="eager"
            />
          </div>

          {/* Content Card */}
          <div className="card-blood p-4 md:p-8 space-y-6 md:space-y-8">
            {/* Date Badge */}
            <div className="text-center">
              <span className="inline-block px-4 md:px-6 py-2 md:py-3 bg-primary/20 rounded-full text-primary font-semibold text-base md:text-lg border border-primary/30">
                📅 01.08.2025
              </span>
            </div>

            {/* Hero Text */}
            <div className="text-center space-y-2">
              <p className="text-lg md:text-xl text-muted-foreground">
                Дата, з якої почалась не просто команда, а
              </p>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-primary">
                Резиденція Blood
              </h1>
            </div>

            {/* Main Content */}
            <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground leading-relaxed">
              {/* About Blood */}
              <div className="bg-secondary/30 rounded-xl p-4 md:p-6 border border-border/50">
                <p className="text-base md:text-lg text-center">
                  <span className="text-primary font-semibold">Blood</span> — це не про одну гру. 
                  <span className="text-primary font-semibold"> Blood</span> — це про всіх і всюди.
                </p>
              </div>

              {/* Mission Statement */}
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  🎮 Ми є в кожній комп'ютерній грі, де потрібні <span className="text-foreground font-medium">характер</span>, <span className="text-foreground font-medium">витримка</span> і <span className="text-foreground font-medium">сила</span>. Де важлива команда, а не випадковість. Де перемагають не ті, хто зраджує, а ті, хто стоїть до кінця.
                </p>
              </div>

              {/* Brotherhood Values */}
              <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 md:p-6">
                <p className="text-center text-lg md:text-xl font-display text-foreground">
                  🤝 Ми не кидаємо своїх. <span className="text-primary font-bold">Ніколи.</span>
                </p>
                <div className="mt-4 space-y-2 text-center text-muted-foreground">
                  <p>У важкий момент — <span className="text-foreground">ми поруч</span></p>
                  <p>У перемозі — <span className="text-foreground">ми разом</span></p>
                  <p>У поразці — <span className="text-foreground">ми стаємо сильнішими</span></p>
                </div>
              </div>

              {/* Core Principles */}
              <div className="space-y-4">
                <h3 className="text-lg md:text-xl font-display font-bold text-foreground text-center">
                  🩸 Blood — це резиденція людей, які:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                    <span className="text-primary text-xl">💪</span>
                    <span className="text-foreground">Не бояться відповідальності</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                    <span className="text-primary text-xl">🛡️</span>
                    <span className="text-foreground">Не зливають команду</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                    <span className="text-primary text-xl">⚔️</span>
                    <span className="text-foreground">Не ламаються під тиском</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                    <span className="text-primary text-xl">🔥</span>
                    <span className="text-foreground">Не продають своїх принципів</span>
                  </div>
                </div>
              </div>

              {/* Unity Statement */}
              <div className="text-center space-y-3 py-4">
                <p className="text-base md:text-lg">
                  Тут <span className="text-primary font-semibold">кожен має значення</span>. 
                </p>
                <p className="text-base md:text-lg">
                  Тут немає "одинаків" — є <span className="text-foreground font-medium">брати і сестри</span> по крові і духу.
                </p>
                <p className="text-muted-foreground italic">
                  Ми не кричимо, що ми сила — ми нею стаємо з кожним днем.
                </p>
              </div>

              {/* The Choice */}
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-xl p-4 md:p-6 space-y-4">
                <h3 className="text-xl md:text-2xl font-display font-bold text-primary text-center">
                  Blood — це вибір
                </h3>
                <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                  <span className="px-3 py-1.5 bg-primary/20 rounded-full text-foreground text-sm md:text-base">
                    Вибір бути вірним
                  </span>
                  <span className="px-3 py-1.5 bg-primary/20 rounded-full text-foreground text-sm md:text-base">
                    Вибір бути сильним
                  </span>
                  <span className="px-3 py-1.5 bg-primary/20 rounded-full text-foreground text-sm md:text-base">
                    Вибір не зраджувати
                  </span>
                </div>
                <p className="text-center text-muted-foreground text-sm md:text-base">
                  Навіть коли важко.
                </p>
              </div>

              {/* Warning/Promise */}
              <div className="space-y-4 text-center py-4">
                <p className="text-base md:text-lg">
                  Якщо ти з нами — ти під <span className="text-primary font-semibold">захистом резиденції</span>.
                </p>
                <p className="text-base md:text-lg text-muted-foreground">
                  Якщо ти проти нас — ти просто ще не знаєш, з ким маєш справу.
                </p>
              </div>
            </div>

            {/* Bottom Section - Motto */}
            <div className="pt-6 border-t border-border">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 text-center">
                <div className="p-4 md:p-5 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors">
                  <span className="text-2xl md:text-3xl">🌍</span>
                  <p className="font-display font-bold text-primary mt-2 text-base md:text-lg">Blood — ми всюди</p>
                </div>
                <div className="p-4 md:p-5 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors">
                  <span className="text-2xl md:text-3xl">🤝</span>
                  <p className="font-display font-bold text-primary mt-2 text-base md:text-lg">Blood — ми разом</p>
                </div>
                <div className="p-4 md:p-5 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors">
                  <span className="text-2xl md:text-3xl">💪</span>
                  <p className="font-display font-bold text-primary mt-2 text-base md:text-lg">Blood — ми сила</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Information;
