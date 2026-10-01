import { Apple, Coffee, Drumstick, Soup, Utensils } from "lucide-react";

interface Meal {
  icon: React.ReactNode;
  name: string;
  items: string[];
  calories: number;
}

interface DayMenu {
  day: string;
  meals: Meal[];
  totalCalories: number;
}

function calculateDailyCalories(
  weight: number,
  heightCm: number,
  age: number,
  sex: "female" | "male",
  target: number | null
): number {
  let bmr = 10 * weight + 6.25 * heightCm - 5 * age;
  bmr += sex === "male" ? 5 : -161;
  const tdee = bmr * 1.2;
  const heightM = heightCm / 100;
  const bmi = weight / (heightM * heightM);

  if (target != null) {
    if (weight > target) return Math.round(tdee - 500);
    else if (weight < target) return Math.round(tdee + 300);
  } else {
    if (bmi >= 25) return Math.round(tdee - 500);
    else if (bmi < 18.5) return Math.round(tdee + 300);
  }
  return Math.round(tdee);
}

const mealTemplates: {
  type: string;
  icon: React.ReactNode;
  name: string;
  options: { items: string[]; calories: number }[];
}[] = [
  {
    type: "breakfast",
    icon: <Coffee className="h-5 w-5" />,
    name: "Завтрак",
    options: [
      { items: ["Овсяная каша на молоке с ягодами", "Варёное яйцо", "Зелёный чай"], calories: 380 },
      { items: ["Творожная запеканка с изюмом", "Сметана 10%", "Кофе с молоком"], calories: 420 },
      { items: ["Омлет из 2 яиц с овощами", "Цельнозерновой тост", "Чай"], calories: 350 },
      { items: ["Гречневая каша с молоком", "Банан", "Какао"], calories: 400 },
      { items: ["Сырники со сметаной", "Мёд", "Чай с лимоном"], calories: 450 },
      { items: ["Мюсли с йогуртом и фруктами", "Орехи (20г)", "Сок"], calories: 380 },
      { items: ["Блины с творогом", "Варенье", "Чай"], calories: 420 },
    ],
  },
  {
    type: "snack1",
    icon: <Apple className="h-5 w-5" />,
    name: "Перекус",
    options: [
      { items: ["Яблоко", "Грецкие орехи (20г)"], calories: 180 },
      { items: ["Груша", "Миндаль (15г)"], calories: 160 },
      { items: ["Банан", "Кефир 1%"], calories: 200 },
      { items: ["Йогурт натуральный", "Ягоды (100г)"], calories: 150 },
      { items: ["Морковь с хумусом"], calories: 170 },
      { items: ["Творог 5%", "Мёд (1 ч.л.)"], calories: 190 },
      { items: ["Апельсин", "Сыр (30г)"], calories: 180 },
    ],
  },
  {
    type: "lunch",
    icon: <Soup className="h-5 w-5" />,
    name: "Обед",
    options: [
      { items: ["Куриная грудка на пару", "Гречка", "Салат из свежих овощей с маслом"], calories: 550 },
      { items: ["Суп куриный с вермишелью", "Рыба запечённая", "Рис отварной"], calories: 600 },
      { items: ["Борщ", "Говядина тушёная", "Картофельное пюре"], calories: 650 },
      { items: ["Уха", "Котлеты рыбные", "Овощи на пару"], calories: 520 },
      { items: ["Щи из свежей капусты", "Плов с курицей", "Салат"], calories: 580 },
      { items: ["Суп-пюре из тыквы", "Индейка запечённая", "Киноа"], calories: 540 },
      { items: ["Солянка", "Макароны с сыром", "Овощи гриль"], calories: 620 },
    ],
  },
  {
    type: "snack2",
    icon: <Utensils className="h-5 w-5" />,
    name: "Полдник",
    options: [
      { items: ["Творог 2%", "Ягоды (100г)"], calories: 180 },
      { items: ["Кефир", "Хлебцы цельнозерновые (2 шт)"], calories: 160 },
      { items: ["Фруктовый салат", "Йогурт"], calories: 170 },
      { items: ["Морковный сок", "Сухарики"], calories: 150 },
      { items: ["Смузи из банана и ягод"], calories: 190 },
      { items: ["Ряженка", "Орехи (15г)"], calories: 180 },
      { items: ["Яблоко печёное с творогом"], calories: 160 },
    ],
  },
  {
    type: "dinner",
    icon: <Drumstick className="h-5 w-5" />,
    name: "Ужин",
    options: [
      { items: ["Рыба на пару", "Тушёные овощи", "Кефир 1%"], calories: 400 },
      { items: ["Куриная грудка гриль", "Салат из огурцов и помидоров", "Чай"], calories: 380 },
      { items: ["Омлет с овощами", "Хлеб ржаной", "Йогурт"], calories: 420 },
      { items: ["Творожная запеканка", "Сметана", "Чай с мятой"], calories: 350 },
      { items: ["Салат с тунцом и яйцом", "Хлебцы", "Кефир"], calories: 390 },
      { items: ["Индейка запечённая", "Брокколи на пару", "Травяной чай"], calories: 370 },
      { items: ["Рыбные котлеты", "Овощное рагу", "Ряженка"], calories: 410 },
    ],
  },
];

function generateWeekMenu(dailyCalories: number): DayMenu[] {
  const days = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
  const weekMenu: DayMenu[] = [];
  const baseCalories = 1800;
  const ratio = dailyCalories / baseCalories;

  for (let i = 0; i < 7; i++) {
    const dayMeals: Meal[] = mealTemplates.map((template) => {
      const option = template.options[i];
      return {
        icon: template.icon,
        name: template.name,
        items: option.items,
        calories: Math.round(option.calories * ratio),
      };
    });
    const totalCalories = dayMeals.reduce((sum, meal) => sum + meal.calories, 0);
    weekMenu.push({ day: days[i], meals: dayMeals, totalCalories });
  }
  return weekMenu;
}

export function WeeklyMenu({
  weight,
  heightCm,
  age,
  sex,
  target,
}: {
  weight: number;
  heightCm: number;
  age: number;
  sex: "female" | "male";
  target: number | null;
}) {
  const dailyCalories = calculateDailyCalories(weight, heightCm, age, sex, target);
  const weekMenu = generateWeekMenu(dailyCalories);

  const heightM = heightCm / 100;
  const bmi = weight / (heightM * heightM);
  let goalText = "Поддержание веса";
  let goalColor = "bg-mint text-pine-700";

  if (target != null) {
    if (weight > target) { goalText = "Снижение веса"; goalColor = "bg-coral/10 text-coral"; }
    else if (weight < target) { goalText = "Набор веса"; goalColor = "bg-amber-50 text-amber-700"; }
  } else {
    if (bmi >= 25) { goalText = "Снижение веса"; goalColor = "bg-coral/10 text-coral"; }
    else if (bmi < 18.5) { goalText = "Набор веса"; goalColor = "bg-amber-50 text-amber-700"; }
  }

  return (
    <section className="card reveal">
      <header className="card-header">
        <div>
          <h2 className="card-title">Меню на неделю</h2>
          <p className="card-subtitle">Персональное меню на основе вашего веса и цели</p>
        </div>
        <div className="menu-header-info">
          <span className={`badge ${goalColor.includes("coral") ? "badge-bad" : goalColor.includes("amber") ? "badge-warn" : "badge-good"}`}>
            {goalText}
          </span>
          <p className="tnum text-xs font-semibold text-pine-600">~{dailyCalories} ккал/день</p>
        </div>
      </header>

      <div className="menu-days">
        {weekMenu.map((day) => (
          <details key={day.day} className="menu-day">
            <summary className="menu-day-summary">
              <div className="menu-day-header">
                <span className="menu-day-badge">
                  <span className="text-xs font-bold">{day.day.slice(0, 2)}</span>
                </span>
                <div>
                  <p className="text-sm font-bold">{day.day}</p>
                  <p className="text-[11px] text-fog">5 приёмов пищи</p>
                </div>
              </div>
              <div className="menu-day-meta">
                <p className="tnum text-sm font-bold text-pine-600">{day.totalCalories} ккал</p>
                <svg className="menu-day-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </summary>

            <div className="menu-day-content">
              {day.meals.map((meal, idx) => (
                <div key={idx} className="menu-meal">
                  <span className="icon">{meal.icon}</span>
                  <div className="menu-meal-content">
                    <div className="menu-meal-header">
                      <p className="text-sm font-bold">{meal.name}</p>
                      <p className="tnum text-xs font-semibold text-pine-600">{meal.calories} ккал</p>
                    </div>
                    <ul className="menu-meal-items">
                      {meal.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="menu-meal-item">
                          <span className="menu-meal-dot" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>

      <footer className="menu-footer">
        <p className="text-[11px] leading-relaxed text-fog">
          💡 <strong>Рекомендации:</strong> Пейте 1.5-2 литра воды в день. Ешьте медленно, тщательно
          пережёвывая. Избегайте еды за 3 часа до сна. Готовьте на пару, варите или запекайте.
        </p>
      </footer>
    </section>
  );
}
