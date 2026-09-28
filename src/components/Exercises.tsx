import { Bike, Dumbbell, PersonStanding, Timer, TrendingUp, Zap } from "lucide-react";

interface Exercise {
  icon: React.ReactNode;
  name: string;
  duration: string;
  description: string;
  intensity: "low" | "medium" | "high";
}

export function Exercises() {
  const exercises: Exercise[] = [
    {
      icon: <PersonStanding className="h-5 w-5" />,
      name: "Ходьба",
      duration: "30-60 мин/день",
      description:
        "Начните с 30 минут быстрой ходьбы. Постепенно увеличивайте до 10 000 шагов в день. Отлично подходит для начинающих.",
      intensity: "low",
    },
    {
      icon: <Bike className="h-5 w-5" />,
      name: "Велосипед",
      duration: "30-45 мин/день",
      description:
        "Езда на велосипеде сжигает 400-600 ккал в час. Укрепляет ноги и сердечно-сосудистую систему.",
      intensity: "medium",
    },
    {
      icon: <Zap className="h-5 w-5" />,
      name: "HIIT (интервальная тренировка)",
      duration: "20-30 мин/день",
      description:
        "Чередование высокой и низкой интенсивности. Например: 30 сек бег, 30 сек ходьба. Сжигает жир даже после тренировки.",
      intensity: "high",
    },
    {
      icon: <Dumbbell className="h-5 w-5" />,
      name: "Силовые тренировки",
      duration: "3-4 раза в неделю",
      description:
        "Приседания, отжимания, выпады, планка. Увеличивают мышечную массу, которая сжигает калории даже в покое.",
      intensity: "medium",
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      name: "Растяжка и йога",
      duration: "15-20 мин/день",
      description:
        "Улучшает гибкость, снижает стресс, помогает восстановлению. Делайте утром или после тренировки.",
      intensity: "low",
    },
  ];

  const intensityColors = {
    low: "bg-mint text-pine-700",
    medium: "bg-amber-50 text-amber-700",
    high: "bg-coral/10 text-coral",
  };

  const intensityLabels = {
    low: "Лёгкая",
    medium: "Средняя",
    high: "Высокая",
  };

  return (
    <section className="reveal rounded-xl border border-line bg-cream shadow-card">
      <header className="border-b border-line px-5 py-4">
        <h2 className="font-display text-sm font-semibold tracking-wide text-ink">
          Физические упражнения
        </h2>
        <p className="mt-0.5 text-xs text-fog">
          Комбинируйте кардио и силовые для лучшего результата
        </p>
      </header>
      <div className="divide-y divide-line">
        {exercises.map((ex) => (
          <div key={ex.name} className="p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-mint text-pine-700">
                {ex.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-ink">{ex.name}</p>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${intensityColors[ex.intensity]}`}
                  >
                    {intensityLabels[ex.intensity]}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-fog">
                  <Timer className="mr-1 inline h-3 w-3" strokeWidth={2} />
                  {ex.duration}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-fog">{ex.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <footer className="border-t border-line bg-paper/50 px-5 py-3">
        <p className="text-[11px] leading-relaxed text-fog">
          💡 <strong>Совет:</strong> Начните с 3 тренировок в неделю по 30 минут. Постепенно
          увеличивайте нагрузку. Делайте разминку 5-10 минут перед каждой тренировкой.
        </p>
      </footer>
    </section>
  );
}
