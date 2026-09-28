import { Coffee, Drumstick, Soup, Utensils } from "lucide-react";

interface Meal {
  icon: React.ReactNode;
  time: string;
  name: string;
  items: string[];
  calories: string;
}

export function DietMenu({ targetCalories = 1800 }: { targetCalories?: number }) {
  const meals: Meal[] = [
    {
      icon: <Coffee className="h-5 w-5" />,
      time: "7:00 - 9:00",
      name: "Завтрак",
      items: [
        "Овсяная каша на воде с ягодами (150г)",
        "Варёное яйцо (1 шт)",
        "Зелёный чай без сахара",
      ],
      calories: "350-400 ккал",
    },
    {
      icon: <Utensils className="h-5 w-5" />,
      time: "11:00 - 12:00",
      name: "Перекус",
      items: ["Яблоко или груша (1 шт)", "Грецкие орехи (20г)"],
      calories: "150-200 ккал",
    },
    {
      icon: <Soup className="h-5 w-5" />,
      time: "13:00 - 14:00",
      name: "Обед",
      items: [
        "Куриная грудка на пару (150г)",
        "Гречка или бурый рис (100г)",
        "Салат из свежих овощей с оливковым маслом (150г)",
      ],
      calories: "500-600 ккал",
    },
    {
      icon: <Utensils className="h-5 w-5" />,
      time: "16:00 - 17:00",
      name: "Полдник",
      items: ["Творог 2% (100г)", "Ягоды или фрукты (100г)"],
      calories: "150-200 ккал",
    },
    {
      icon: <Drumstick className="h-5 w-5" />,
      time: "19:00 - 20:00",
      name: "Ужин",
      items: [
        "Рыба на пару (150г)",
        "Тушёные овощи (200г)",
        "Кефир 1% (200мл)",
      ],
      calories: "350-400 ккал",
    },
  ];

  return (
    <section className="reveal rounded-xl border border-line bg-cream shadow-card">
      <header className="border-b border-line px-5 py-4">
        <h2 className="font-display text-sm font-semibold tracking-wide text-ink">
          Примерное меню на день
        </h2>
        <p className="mt-0.5 text-xs text-fog">
          Сбалансированное питание на ~{targetCalories} ккал
        </p>
      </header>
      <div className="divide-y divide-line">
        {meals.map((meal) => (
          <div key={meal.name} className="p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-mint text-pine-700">
                {meal.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-bold text-ink">{meal.name}</p>
                  <p className="tnum shrink-0 text-xs font-semibold text-pine-600">
                    {meal.calories}
                  </p>
                </div>
                <p className="mt-0.5 text-[11px] text-fog">{meal.time}</p>
                <ul className="mt-2 space-y-1">
                  {meal.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-fog">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-pine-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
      <footer className="border-t border-line bg-paper/50 px-5 py-3">
        <p className="text-[11px] leading-relaxed text-fog">
          💡 <strong>Совет:</strong> Пейте воду за 30 минут до еды. Избегайте еды за 3 часа до сна.
          Готовьте на пару, варите или запекайте — избегайте жарки.
        </p>
      </footer>
    </section>
  );
}
