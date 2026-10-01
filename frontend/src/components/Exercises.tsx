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
      description: "Начните с 30 минут быстрой ходьбы. Постепенно увеличивайте до 10 000 шагов в день. Отлично подходит для начинающих.",
      intensity: "low",
    },
    {
      icon: <Bike className="h-5 w-5" />,
      name: "Велосипед",
      duration: "30-45 мин/день",
      description: "Езда на велосипеде сжигает 400-600 ккал в час. Укрепляет ноги и сердечно-сосудистую систему.",
      intensity: "medium",
    },
    {
      icon: <Zap className="h-5 w-5" />,
      name: "HIIT",
      duration: "20-30 мин/день",
      description: "Чередование высокой и низкой интенсивности. Например: 30 сек бег, 30 сек ходьба. Сжигает жир даже после тренировки.",
      intensity: "high",
    },
    {
      icon: <Dumbbell className="h-5 w-5" />,
      name: "Силовые тренировки",
      duration: "3-4 раза в неделю",
      description: "Приседания, отжимания, выпады, планка. Увеличивают мышечную массу, которая сжигает калории даже в покое.",
      intensity: "medium",
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      name: "Растяжка и йога",
      duration: "15-20 мин/день",
      description: "Улучшает гибкость, снижает стресс, помогает восстановлению. Делайте утром или после тренировки.",
      intensity: "low",
    },
    {
      icon: <PersonStanding className="h-5 w-5" />,
      name: "Бег",
      duration: "20-40 мин/день",
      description: "Эффективное кардио для сжигания калорий. Начните с чередования бега и ходьбы. Сжигает 500-800 ккал в час.",
      intensity: "high",
    },
    {
      icon: <Dumbbell className="h-5 w-5" />,
      name: "Плавание",
      duration: "30-45 мин/день",
      description: "Щадящая нагрузка на суставы, задействует все группы мышц. Сжигает 400-700 ккал в час.",
      intensity: "medium",
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      name: "Танцы",
      duration: "30-60 мин/день",
      description: "Весёлый способ сжечь калории и улучшить координацию. Можно заниматься дома по видео или в группе.",
      intensity: "medium",
    },
  ];

  const intensityColors = {
    low: "badge-good",
    medium: "badge-warn",
    high: "badge-bad",
  };

  const intensityLabels = {
    low: "Лёгкая",
    medium: "Средняя",
    high: "Высокая",
  };

  return (
    <section className="card reveal">
      <header className="card-header">
        <div>
          <h2 className="card-title">Физические упражнения</h2>
          <p className="card-subtitle">Комбинируйте кардио и силовые для лучшего результата</p>
        </div>
      </header>
      <div className="exercises-grid">
        {exercises.map((ex) => (
          <div key={ex.name} className="exercise-card">
            <span className="icon icon-md">{ex.icon}</span>
            <div className="exercise-content">
              <div className="exercise-header">
                <p className="text-sm font-bold">{ex.name}</p>
                <span className={`badge ${intensityColors[ex.intensity]}`}>
                  {intensityLabels[ex.intensity]}
                </span>
              </div>
              <p className="text-[11px] text-fog flex items-center gap-1 mt-0.5">
                <Timer className="inline h-3 w-3" strokeWidth={2} />
                {ex.duration}
              </p>
              <p className="text-xs leading-relaxed text-fog mt-2">{ex.description}</p>
            </div>
          </div>
        ))}
      </div>
      <footer className="exercises-footer">
        <p className="text-[11px] leading-relaxed text-fog">
          💡 <strong>Совет:</strong> Начните с 3 тренировок в неделю по 30 минут. Постепенно
          увеличивайте нагрузку. Делайте разминку 5-10 минут перед каждой тренировкой.
        </p>
      </footer>
    </section>
  );
}
