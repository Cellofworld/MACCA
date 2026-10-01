export interface WeightEntry {
  id: string;
  date: string;
  weight: number;
  note?: string;
}

export type Sex = "female" | "male";

export interface Profile {
  heightCm: number;
  age: number;
  sex: Sex;
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
