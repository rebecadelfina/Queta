import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  PREDICTIONS: "protips_predictions",
  RESERVATIONS: "protips_reservations",
  SCALE_ENTRIES: "protips_scale_entries",
  USER_PROFILE: "protips_user_profile",
  TRIAL_START: "protips_trial_start",
  SUBSCRIPTION: "protips_subscription",
  IS_ADMIN: "protips_is_admin",
};

export interface Prediction {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchTime: string;
  market: string;
  odd: number;
  result: "win" | "loss" | "pending";
  isPremium: boolean;
  date: string;
}

export interface Reservation {
  id: string;
  house: "bantubet" | "elephantebet";
  imageUri: string;
  date: string;
}

export interface ScaleEntry {
  id: string;
  date: string;
  odds: { value: number; result: "win" | "loss" | "pending"; label?: string }[];
  isScheduled: boolean;
}

export interface Subscription {
  active: boolean;
  plan: "trial" | "7days" | "30days" | "none";
  startDate: string;
  endDate: string;
  paymentProofUri?: string;
  paymentStatus: "none" | "pending" | "approved" | "rejected";
}

function genId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

async function getJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function setJSON(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function getPredictions(): Promise<Prediction[]> {
  return getJSON(KEYS.PREDICTIONS, []);
}

export async function savePrediction(p: Omit<Prediction, "id">): Promise<Prediction> {
  const predictions = await getPredictions();
  const newP = { ...p, id: genId() };
  predictions.push(newP);
  await setJSON(KEYS.PREDICTIONS, predictions);
  return newP;
}

export async function updatePrediction(id: string, updates: Partial<Prediction>): Promise<void> {
  const predictions = await getPredictions();
  const idx = predictions.findIndex((p) => p.id === id);
  if (idx >= 0) {
    predictions[idx] = { ...predictions[idx], ...updates };
    await setJSON(KEYS.PREDICTIONS, predictions);
  }
}

export async function deletePrediction(id: string): Promise<void> {
  const predictions = await getPredictions();
  await setJSON(KEYS.PREDICTIONS, predictions.filter((p) => p.id !== id));
}

export async function getReservations(): Promise<Reservation[]> {
  return getJSON(KEYS.RESERVATIONS, []);
}

export async function saveReservation(r: Omit<Reservation, "id">): Promise<Reservation> {
  const reservations = await getReservations();
  const newR = { ...r, id: genId() };
  reservations.push(newR);
  await setJSON(KEYS.RESERVATIONS, reservations);
  return newR;
}

export async function deleteReservation(id: string): Promise<void> {
  const reservations = await getReservations();
  await setJSON(KEYS.RESERVATIONS, reservations.filter((r) => r.id !== id));
}

export async function getScaleEntries(): Promise<ScaleEntry[]> {
  return getJSON(KEYS.SCALE_ENTRIES, []);
}

export async function saveScaleEntry(s: Omit<ScaleEntry, "id">): Promise<ScaleEntry> {
  const entries = await getScaleEntries();
  const existing = entries.findIndex((e) => e.date === s.date);
  const newS = { ...s, id: genId() };
  if (existing >= 0) {
    entries[existing] = { ...entries[existing], ...s };
    await setJSON(KEYS.SCALE_ENTRIES, entries);
    return entries[existing];
  }
  entries.push(newS);
  await setJSON(KEYS.SCALE_ENTRIES, entries);
  return newS;
}

export async function updateScaleEntry(id: string, updates: Partial<ScaleEntry>): Promise<void> {
  const entries = await getScaleEntries();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx >= 0) {
    entries[idx] = { ...entries[idx], ...updates };
    await setJSON(KEYS.SCALE_ENTRIES, entries);
  }
}

export async function getSubscription(): Promise<Subscription> {
  return getJSON(KEYS.SUBSCRIPTION, {
    active: false,
    plan: "none",
    startDate: "",
    endDate: "",
    paymentStatus: "none",
  });
}

export async function saveSubscription(s: Subscription): Promise<void> {
  await setJSON(KEYS.SUBSCRIPTION, s);
}

export async function getTrialStart(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.TRIAL_START);
}

export async function setTrialStart(date: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.TRIAL_START, date);
}

export async function getIsAdmin(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.IS_ADMIN);
  return val === "true";
}

export async function setIsAdmin(val: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.IS_ADMIN, val ? "true" : "false");
}

export async function checkAccess(): Promise<{ hasAccess: boolean; daysLeft: number; isTrial: boolean }> {
  const sub = await getSubscription();
  const trialStart = await getTrialStart();
  const isAdmin = await getIsAdmin();

  if (isAdmin) return { hasAccess: true, daysLeft: 999, isTrial: false };

  if (sub.active && sub.paymentStatus === "approved") {
    const end = new Date(sub.endDate);
    const now = new Date();
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft > 0) return { hasAccess: true, daysLeft, isTrial: false };
    await saveSubscription({ ...sub, active: false, plan: "none" });
  }

  if (!trialStart) {
    await setTrialStart(new Date().toISOString());
    return { hasAccess: true, daysLeft: 3, isTrial: true };
  }

  const start = new Date(trialStart);
  const now = new Date();
  const daysPassed = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, 3 - daysPassed);

  return { hasAccess: daysLeft > 0, daysLeft, isTrial: true };
}

export function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const days = ["Domingo", "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado"];
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  return `${day}/${month} (${days[d.getDay()]})`;
}

export function getMonthName(month: number): string {
  const names = [
    "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  return names[month];
}

export function getWeekOfMonth(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00");
  const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
  return Math.ceil((d.getDate() + firstDay.getDay()) / 7);
}

export async function seedDemoData(): Promise<void> {
  const predictions = await getPredictions();
  if (predictions.length > 0) return;

  const today = new Date();
  const todayStr = getTodayStr();

  const demoPredictions: Omit<Prediction, "id">[] = [
    {
      homeTeam: "Manchester City",
      awayTeam: "Arsenal",
      league: "Premier League",
      matchTime: "16:30",
      market: "Ambas Marcam",
      odd: 1.85,
      result: "pending",
      isPremium: false,
      date: todayStr,
    },
    {
      homeTeam: "Barcelona",
      awayTeam: "Real Madrid",
      league: "La Liga",
      matchTime: "20:00",
      market: "+2.5 Golos",
      odd: 1.72,
      result: "pending",
      isPremium: false,
      date: todayStr,
    },
    {
      homeTeam: "PSG",
      awayTeam: "Marseille",
      league: "Ligue 1",
      matchTime: "19:45",
      market: "1X",
      odd: 1.35,
      result: "pending",
      isPremium: true,
      date: todayStr,
    },
    {
      homeTeam: "Bayern Munich",
      awayTeam: "Dortmund",
      league: "Bundesliga",
      matchTime: "17:30",
      market: "+1.5 Golos",
      odd: 1.45,
      result: "pending",
      isPremium: true,
      date: todayStr,
    },
  ];

  for (const p of demoPredictions) {
    await savePrediction(p);
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

  const pastPredictions: Omit<Prediction, "id">[] = [
    {
      homeTeam: "Liverpool",
      awayTeam: "Chelsea",
      league: "Premier League",
      matchTime: "15:00",
      market: "+1.5 Golos",
      odd: 1.55,
      result: "win",
      isPremium: false,
      date: yesterdayStr,
    },
    {
      homeTeam: "Juventus",
      awayTeam: "AC Milan",
      league: "Serie A",
      matchTime: "18:00",
      market: "Ambas Marcam",
      odd: 1.90,
      result: "loss",
      isPremium: false,
      date: yesterdayStr,
    },
  ];

  for (const p of pastPredictions) {
    await savePrediction(p);
  }

  const demoScale: Omit<ScaleEntry, "id">[] = [
    {
      date: yesterdayStr,
      odds: [
        { value: 3.23, result: "win", label: "Odd 1" },
        { value: 3.14, result: "loss", label: "Odd 2" },
      ],
      isScheduled: false,
    },
    {
      date: todayStr,
      odds: [
        { value: 2.59, result: "pending", label: "Odd 1" },
        { value: 3.23, result: "pending", label: "Odd 2" },
        { value: 8.41, result: "pending", label: "Bonus" },
      ],
      isScheduled: false,
    },
  ];

  for (const s of demoScale) {
    await saveScaleEntry(s);
  }
}
