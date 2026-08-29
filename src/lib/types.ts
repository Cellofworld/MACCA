export interface WeightEntry {
  id: string;
  /** ISO-дата yyyy-mm-dd (локальная) */
  date: string;
  /** вес в кг */
  weight: number;
  note?: string;
}

export type Sex = "female" | "male";

export interface Profile {
  heightCm: number;
  age: number;
  sex: Sex;
  /** целевой вес в кг, null — цель не задана */
  target: number | null;
}

export type View = "overview" | "history";

export type RangeKey = "7" | "30" | "90" | "all";

export type ToastKind = "success" | "error" | "info";

export interface ToastData {
  id: number;
  message: string;
  kind: ToastKind;
  action?: { label: string; onClick: () => void };
}
