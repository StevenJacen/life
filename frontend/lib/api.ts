const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

export interface LifeState {
  id: number;
  age: number;
  money: number;
  attributes: Record<string, number>;
  career: string;
  family_class: string;
  education_level: string;
  happiness: number;
  health: number;
  is_active: number;
  ended_at: string | null;
  cause_of_death: string | null;
  backstory: string | null;
  backstory_summary: string | null;
  created_at: string;
}

export interface EventDef {
  id: number;
  title: string;
  description: string;
  min_age: number;
  max_age: number;
  repeatable: number;
  once_per_life: number;
  weight_formula: string;
  parent_event_id: number | null;
}

export interface EventOption {
  id: number;
  event_id: number;
  text: string;
  description: string;
}

export interface EffectResult {
  type: string;
  target?: string;
  delta?: number;
  newValue: number | string;
}

export interface HumorItem {
  id: number;
  content: string;
  category: string;
  tags: string;
  usage_count: number;
  created_at: string;
}

export interface NextTurnData {
  event: EventDef | null;
  options: EventOption[];
  humor_quote: HumorItem | null;
}

export interface SuddenEvent {
  id: number;
  title: string;
  description: string;
}

export interface SuddenEventResult {
  event: SuddenEvent;
  results: EffectResult[];
}

export interface SkipYearData {
  state: LifeState;
  humor_quote: HumorItem | null;
  sudden_events: SuddenEventResult[];
  ended?: boolean;
  cause_of_death?: string;
}

export interface ChooseData {
  state: LifeState;
  event: EventDef;
  option: EventOption;
  results: EffectResult[];
  humor_quote: HumorItem | null;
  sudden_events: SuddenEventResult[];
  ended?: boolean;
  cause_of_death?: string;
}

export interface LogItem {
  id: number;
  life_id: number;
  age: number;
  event_id: number;
  option_id: number;
  result: string;
  created_at: string;
  event_title: string;
  option_text: string;
  sudden_title?: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Request failed");
  return json.data as T;
}

export interface LifeSummary {
  state: LifeState;
  totalYears: number;
  totalEvents: number;
  totalSudden: number;
  isMarried: boolean;
  maxMoney: number;
  maxHappiness: number;
  finalCareer: string;
  finalEducation: string;
}

export const api = {
  createLife: () => request<LifeState>("/api/life", { method: "POST" }),
  fromBackstory: (age: number, description: string) =>
    request<LifeState>("/api/life/from-backstory", {
      method: "POST",
      body: JSON.stringify({ age, description }),
    }),
  getLife: (id: number) => request<LifeState>(`/api/life/${id}`),
  nextTurn: (id: number) => request<NextTurnData>(`/api/life/${id}/next-turn`, { method: "POST" }),
  chooseOption: (id: number, optionId: number) =>
    request<ChooseData>(`/api/life/${id}/choose`, {
      method: "POST",
      body: JSON.stringify({ optionId }),
    }),
  skipYear: (id: number) => request<SkipYearData>(`/api/life/${id}/skip-year`, { method: "POST" }),
  generateAIEvent: (id: number) => request<{ eventId: number; title: string; description: string; options: any[] }>(`/api/life/${id}/generate-ai-event`, { method: "POST" }),
  refreshHumor: () => request<{ inserted: number; total: number }>("/api/humor/refresh", { method: "POST" }),
  getLogs: (id: number) => request<LogItem[]>(`/api/life/${id}/logs`),
  getSummary: (id: number) => request<LifeSummary>(`/api/life/${id}/summary`),
};
