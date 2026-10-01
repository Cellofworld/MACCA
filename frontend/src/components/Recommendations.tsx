import { Apple, Droplet, Moon, Sun, Utensils } from "lucide-react";

interface Recommendation {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

export function Recommendations({
  bmi,
  weeklyRate,
}: {
  bmi: number | null;
  weeklyRate: number | null;
}) {
  const recommendations: Recommendation[] = [
    {
      icon: <Utensils className="h-5 w-5" />,
      title: "Питание",
      description:
        "Ешьте 4-5 раз в день небольшими порциями. Избегайте быстрых углеводов и трансжиров. Пейте 1.5-2 литра воды в день.",
      color: "bg-mint text-pine-700",
    },
    {
      icon: <Droplet className="h-5 w-5" />,
      title: "Водный баланс",
      description:
        "Начинайте день со стакана воды. Пейте за 30 минут до еды и через час после. Избегайте сладких напитков.",
      color: "bg-blue-50 text-blue-700",
    },
    {
      icon: <Moon className="h-5 w-5" />,
      title: "Сон",
      description:
        "Спите 7-9 часов в сутки. Недостаток сна повышает уровень грелина — гормона голода. Ложитесь до 23:00.",
      color: "bg-purple-50 text-purple-700",
    },
    {
      icon: <Sun className="h-5 w-5" />,
      title: "Активность",
      description:
        "Ходите минимум 10 000 шагов в день. Используйте лестницу вместо лифта. Делайте перерывы каждые 30 минут сидячей работы.",
      color: "bg-amber-50 text-amber-700",
    },
  ];

  if (bmi != null) {
    if (bmi >= 25 && bmi < 30) {
      recommendations.push({
        icon: <Apple className="h-5 w-5" />,
        title: "Снижение веса",
        description:
          "Ваш ИМТ указывает на избыточный вес. Сократите калорийность на 300-500 ккал в день. Добавьте больше овощей и клетчатки.",
        color: "bg-coral/10 text-coral",
      });
    } else if (bmi >= 30) {
      recommendations.push({
        icon: <Apple className="h-5 w-5" />,
        title: "Важно",
        description:
          "При ИМТ ≥30 рекомендуется консультация врача. Начните с постепенного снижения веса на 0.5-1 кг в неделю.",
        color: "bg-coral/10 text-coral",
      });
    }
  }

  if (weeklyRate != null) {
    if (weeklyRate < -1) {
      recommendations.push({
        icon: <Utensils className="h-5 w-5" />,
        title: "Слишком быстро",
        description:
          "Вы теряете более 1 кг в неделю — это может быть нездоровым. Увеличьте калорийность рациона и добавьте белок.",
        color: "bg-amber-50 text-amber-700",
      });
    } else if (weeklyRate > 0) {
      recommendations.push({
        icon: <Utensils className="h-5 w-5" />,
        title: "Набор веса",
        description:
          "Ваш вес растёт. Проверьте калорийность рациона, уменьшите порции и увеличьте физическую активность.",
        color: "bg-coral/10 text-coral",
      });
    }
  }

  return (
    <section className="card reveal">
      <header className="card-header">
        <div>
          <h2 className="card-title">Рекомендации для вас</h2>
          <p className="card-subtitle">Персональные советы на основе ваших данных</p>
        </div>
      </header>
      <div className="recs-grid">
        {recommendations.map((rec) => (
          <div key={rec.title} className="rec-card">
            <span className={`icon icon-md ${rec.color}`}>{rec.icon}</span>
            <div className="rec-content">
              <p className="font-bold text-sm">{rec.title}</p>
              <p className="text-xs text-fog mt-1 leading-relaxed">{rec.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
