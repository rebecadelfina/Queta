import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  PREDICTIONS: "qb_predictions",
  RESERVATIONS: "qb_reservations",
  SCALE_ENTRIES: "qb_scale_entries",
  USERS: "qb_users",
  CURRENT_USER: "qb_current_user",
  COMMENTS: "qb_comments",
  TEAM_CONFIG: "qb_team_config",
  MARKET_CONFIG: "qb_market_config",
  MATCHES: "qb_matches",
  API_MATCHES: "qb_api_matches", // Jogos da API
  APP_INSTALL_DATE: "qb_app_install_date", // Data de primeira instalação
};

export const MARKETS = [
  "Equipa de casa ganha",
  "Equipa de fora ganha",
  "Empate no jogo completo",
  "Equipa de casa ganha no HT e no Final",
  "Equipa de fora ganha no HT e no Final",
  "Mais de 2 golos no jogo",
  "Mais de +2.5 golos no jogo",
  "Menos de 3.5 golos no jogo",
  "Menos de 4.5 golos no jogo",
  "Faixa de golo de 2-6 no jogo",
  "Faixa de golo 1-6 no jogo",
  "Qualquer uma ganha e Faixa de golo de 2-6",
  "Qualquer uma ganha e menos de 4.5 golos",
  "Casa ganha ou empata e Faixa de 2-6 golos",
  "Fora ganha ou empata e Faixa de 2-6 golos",
  "Total de golos acima de 1.5",
  "Total de golos acima de 2.5",
  "Equipa de fora ganha ou empata",
  "Equipa de casa ganha ou empata",
  "Qualquer uma ganha",
  "Casa ganha ou empata e acima de 1.5 golos",
  "Fora ganha ou empata e acima de 1.5 golos",
  "Casa ganha ou empata e abaixo de 4.5 golos",
  "Fora ganha ou empata e abaixo de 4.5 golos",
  "Qualquer uma ganha e abaixo de 4.5 golos",
  "Ambas marcam",
  "Equipa de casa marca mais de 0.5",
  "Equipa de casa marca mais de 1.5",
  "Equipa de fora marca mais de 0.5",
  "Equipa de fora marca mais de 1.5",
  "Casa ganha pelo menos uma parte",
  "Fora ganha pelo menos uma parte",
  "Empate em pelo menos uma parte",
  "Handicap +2.5 a favor da casa",
  "Handicap +2.5 a favor da fora",
  "Ambas equipas levam cartoes",
  "Equipa de casa ganha sem sofrer",
  "Equipa de fora ganha sem sofrer",
  "Remate no alvo equipa de casa",
  "Remate no alvo equipa de fora",
  "Total de cantos no jogo",
  "Combinacoes de resultados exatos",
  "Mercado Milionario",
  "Alcance de golos acima de 7",
  "Cantos 5 ou menos",
  "Cantos 6-8",
  "Cantos 9-11",
  "Cantos 12-14",
  "Cantos 15 ou mais",
  "1T abaixo de 1.5 golos",
  "1T abaixo de 2.5 golos",
  "1T acima de 1.5 golos",
  "1T acima de 2.5 golos",
  "2T acima de 1.5 golos",
  "2T acima de 2.5 golos",
  "2T abaixo de 1.5 golos",
  "2T abaixo de 2.5 golos",
  "Casa empate anula aposta",
  "Fora empate anula aposta",
  "Total remates a baliza casa",
  "Total remates a baliza fora",
  "Faixa de golos 4-6",
  "Faixa de golos 7 ou mais",
  "Casa ganha total de cantos",
  "Fora ganha total de cantos",
];

export interface UserProfile {
  id: string;
  username: string;
  password: string;
  displayName: string;
  photoUri?: string;
  isAdmin: boolean;
  trialStart: string;
  subscription: Subscription;
  createdAt: string;
}

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
  published: boolean;
  ticketId?: string; // ID da ficha
  type: "initial" | "result"; // initial (antes jogo) | result (depois jogo)
  expiresAt?: string; // Data de expiração para fichas de resultado (ISO string)
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

export interface Comment {
  id: string;
  userId: string;
  username: string;
  userPhoto?: string;
  text: string;
  date: string;
  approved: boolean;
}

export interface TeamConfig {
  name: string;
  active: boolean;
}

export interface MarketConfig {
  name: string;
  teamNames: string[]; // Equipas para as quais este mercado está disponível
  active: boolean;
}

export interface Match {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  homeTeam: string;
  awayTeam: string;
  league: string;
  available: boolean; // Se está disponível para os utilizadores
  selectedMarkets: string[]; // Mercados selecionados para este jogo
  status: "pending" | "live" | "finished";
}

export interface ApiMatch {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  homeTeam: string;
  awayTeam: string;
  homeTeamId?: string;
  awayTeamId?: string;
  league: string;
  competition?: string;
  status: "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED" | "CANCELLED";
  feedTime?: string; // timestamp da API
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

export async function getUsers(): Promise<UserProfile[]> {
  return getJSON(KEYS.USERS, []);
}

async function saveUsers(users: UserProfile[]): Promise<void> {
  await setJSON(KEYS.USERS, users);
}

export async function registerUser(username: string, password: string, displayName: string): Promise<UserProfile | null> {
  const users = await getUsers();
  if (users.find((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return null;
  }
  const user: UserProfile = {
    id: genId(),
    username,
    password,
    displayName,
    isAdmin: false,
    trialStart: new Date().toISOString(),
    subscription: { active: false, plan: "trial", startDate: new Date().toISOString(), endDate: "", paymentStatus: "none" },
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await saveUsers(users);
  await setJSON(KEYS.CURRENT_USER, user);
  return user;
}

export async function loginUser(username: string, password: string): Promise<UserProfile | null> {
  const users = await getUsers();
  const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
  if (!user) return null;
  await setJSON(KEYS.CURRENT_USER, user);
  return user;
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  return getJSON(KEYS.CURRENT_USER, null);
}

export async function logoutUser(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.CURRENT_USER);
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
  const users = await getUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...updates };
    await saveUsers(users);
    const current = await getCurrentUser();
    if (current && current.id === userId) {
      await setJSON(KEYS.CURRENT_USER, users[idx]);
    }
  }
}

export async function updateUserSubscription(userId: string, sub: Subscription): Promise<void> {
  const users = await getUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx >= 0) {
    users[idx].subscription = sub;
    await saveUsers(users);
    const current = await getCurrentUser();
    if (current && current.id === userId) {
      await setJSON(KEYS.CURRENT_USER, users[idx]);
    }
  }
}

export async function createAdminIfNeeded(): Promise<void> {
  const users = await getUsers();
  if (!users.find((u) => u.isAdmin)) {
    const admin: UserProfile = {
      id: genId(),
      username: "admin",
      password: "admin123",
      displayName: "Administrador",
      isAdmin: true,
      trialStart: new Date().toISOString(),
      subscription: { active: true, plan: "30days", startDate: new Date().toISOString(), endDate: new Date(Date.now() + 365 * 86400000).toISOString(), paymentStatus: "approved" },
      createdAt: new Date().toISOString(),
    };
    users.push(admin);
    await saveUsers(users);
  }
}

export async function createTestUserIfNeeded(): Promise<void> {
  const users = await getUsers();
  if (!users.find((u) => u.username === "testeuser")) {
    const now = new Date().toISOString();
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // Comprovativo fake em base64 (PNG simples)
    const fakeProof = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    
    const testUser: UserProfile = {
      id: genId(),
      username: "testeuser",
      password: "senha123",
      displayName: "Teste - Pagamento Pendente",
      photoUri: "https://i.pravatar.cc/150?img=5",
      isAdmin: false,
      trialStart: now,
      subscription: { 
        active: true, 
        plan: "7days", 
        startDate: now, 
        endDate: endDate, 
        paymentStatus: "pending",
        paymentProofUri: fakeProof
      },
      createdAt: now,
    };
    users.push(testUser);
    await saveUsers(users);
  }
}

export async function registerInstallationDate(): Promise<void> {
  const existing = await AsyncStorage.getItem(KEYS.APP_INSTALL_DATE);
  if (!existing) {
    await AsyncStorage.setItem(KEYS.APP_INSTALL_DATE, new Date().toISOString());
  }
}

export async function getInstallationDate(): Promise<Date | null> {
  const dateStr = await AsyncStorage.getItem(KEYS.APP_INSTALL_DATE);
  return dateStr ? new Date(dateStr) : null;
}

export async function isTrialExpired(): Promise<boolean> {
  const installDate = await getInstallationDate();
  if (!installDate) return false;
  
  const now = new Date();
  const diffMs = now.getTime() - installDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  return diffDays > 3; // Trial de 3 dias
}

export async function getDaysLeftInTrial(): Promise<number> {
  const installDate = await getInstallationDate();
  if (!installDate) return 3;
  
  const now = new Date();
  const diffMs = now.getTime() - installDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  const daysLeft = Math.max(0, 3 - Math.ceil(diffDays));
  return daysLeft;
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
  const reservations = await getJSON(KEYS.RESERVATIONS, []);
  // Limpar reservas de resultado expiradas
  const now = new Date().toISOString();
  const active = reservations.filter((r) => !r.expiresAt || r.expiresAt > now);
  if (active.length !== reservations.length) {
    await setJSON(KEYS.RESERVATIONS, active);
  }
  return active;
}

export async function saveReservation(r: Omit<Reservation, "id">): Promise<Reservation> {
  const reservations = await getReservations();
  const newR = { ...r, id: genId() };
  reservations.push(newR);
  await setJSON(KEYS.RESERVATIONS, reservations);
  return newR;
}

export async function updateReservation(id: string, updates: Partial<Reservation>): Promise<void> {
  const reservations = await getReservations();
  const idx = reservations.findIndex((r) => r.id === id);
  if (idx >= 0) {
    reservations[idx] = { ...reservations[idx], ...updates };
    await setJSON(KEYS.RESERVATIONS, reservations);
  }
}

export async function deleteReservation(id: string): Promise<void> {
  const reservations = await getReservations();
  await setJSON(KEYS.RESERVATIONS, reservations.filter((r) => r.id !== id));
}

// Result Reservations (Fichas de Resultado)
export async function addResultReservation(house: "bantubet" | "elephantebet", imageUri: string, ticketId: string | undefined, daysExpire: number): Promise<Reservation> {
  const reservations = await getReservations();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + daysExpire);
  
  const newR: Reservation = {
    id: genId(),
    house,
    imageUri,
    ticketId,
    date: new Date().toISOString(),
    published: true, // Fichas de resultado sempre públicas
    type: "result",
    expiresAt: expiresAt.toISOString(),
  };
  reservations.push(newR);
  await setJSON(KEYS.RESERVATIONS, reservations);
  return newR;
}

export async function getResultReservations(house: "bantubet" | "elephantebet"): Promise<Reservation[]> {
  const reservations = await getReservations();
  return reservations.filter((r) => r.house === house && r.type === "result");
}

export async function updateReservationExpiry(id: string, daysExpire: number): Promise<void> {
  const reservations = await getReservations();
  const idx = reservations.findIndex((r) => r.id === id);
  if (idx >= 0) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysExpire);
    reservations[idx].expiresAt = expiresAt.toISOString();
    await setJSON(KEYS.RESERVATIONS, reservations);
  }
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

export async function getComments(): Promise<Comment[]> {
  return getJSON(KEYS.COMMENTS, []);
}

export async function addComment(c: Omit<Comment, "id">): Promise<Comment> {
  const comments = await getComments();
  const newC = { ...c, id: genId() };
  comments.push(newC);
  await setJSON(KEYS.COMMENTS, comments);
  return newC;
}

export async function approveComment(id: string): Promise<void> {
  const comments = await getComments();
  const idx = comments.findIndex((c) => c.id === id);
  if (idx >= 0) {
    comments[idx].approved = true;
    await setJSON(KEYS.COMMENTS, comments);
  }
}

export async function deleteComment(id: string): Promise<void> {
  const comments = await getComments();
  await setJSON(KEYS.COMMENTS, comments.filter((c) => c.id !== id));
}

export function checkUserAccess(user: UserProfile): { hasAccess: boolean; daysLeft: number; isTrial: boolean } {
  if (user.isAdmin) return { hasAccess: true, daysLeft: 999, isTrial: false };

  if (user.subscription.active && user.subscription.paymentStatus === "approved") {
    const end = new Date(user.subscription.endDate);
    const now = new Date();
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft > 0) return { hasAccess: true, daysLeft, isTrial: false };
  }

  const start = new Date(user.trialStart);
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

// Team & Market Configuration
export async function getTeamConfigs(): Promise<TeamConfig[]> {
  return getJSON(KEYS.TEAM_CONFIG, []);
}

export async function saveTeamConfigs(configs: TeamConfig[]): Promise<void> {
  await setJSON(KEYS.TEAM_CONFIG, configs);
}

export async function addTeamConfig(team: TeamConfig): Promise<void> {
  const configs = await getTeamConfigs();
  const exists = configs.find((t) => t.name.toLowerCase() === team.name.toLowerCase());
  if (!exists) {
    configs.push(team);
    await saveTeamConfigs(configs);
  }
}

export async function removeTeamConfig(teamName: string): Promise<void> {
  const configs = await getTeamConfigs();
  await saveTeamConfigs(configs.filter((t) => t.name !== teamName));
}

export async function getMarketConfigs(): Promise<MarketConfig[]> {
  return getJSON(KEYS.MARKET_CONFIG, []);
}

export async function saveMarketConfigs(configs: MarketConfig[]): Promise<void> {
  await setJSON(KEYS.MARKET_CONFIG, configs);
}

export async function updateMarketTeams(marketName: string, teamNames: string[]): Promise<void> {
  const configs = await getMarketConfigs();
  const idx = configs.findIndex((m) => m.name === marketName);
  if (idx >= 0) {
    configs[idx].teamNames = teamNames;
    await saveMarketConfigs(configs);
  }
}

export async function getAvailableMarketsForTeam(teamName: string): Promise<string[]> {
  const configs = await getMarketConfigs();
  return configs
    .filter((m) => m.active && m.teamNames.includes(teamName))
    .map((m) => m.name);
}

export async function seedDemoData(): Promise<void> {
  await createAdminIfNeeded();
  const predictions = await getPredictions();
  if (predictions.length > 0) return;

  const todayStr = getTodayStr();
  const today = new Date();

  const demoPredictions: Omit<Prediction, "id">[] = [
    { homeTeam: "Manchester City", awayTeam: "Arsenal", league: "Premier League", matchTime: "16:30", market: "Ambas marcam", odd: 1.85, result: "pending", isPremium: false, date: todayStr },
    { homeTeam: "Barcelona", awayTeam: "Real Madrid", league: "La Liga", matchTime: "20:00", market: "Mais de +2.5 golos no jogo", odd: 1.72, result: "pending", isPremium: false, date: todayStr },
    { homeTeam: "PSG", awayTeam: "Marseille", league: "Ligue 1", matchTime: "19:45", market: "Equipa de casa ganha ou empata", odd: 1.35, result: "pending", isPremium: true, date: todayStr },
    { homeTeam: "Bayern Munich", awayTeam: "Dortmund", league: "Bundesliga", matchTime: "17:30", market: "Total de golos acima de 1.5", odd: 1.45, result: "pending", isPremium: true, date: todayStr },
  ];
  for (const p of demoPredictions) await savePrediction(p);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

  const pastPredictions: Omit<Prediction, "id">[] = [
    { homeTeam: "Liverpool", awayTeam: "Chelsea", league: "Premier League", matchTime: "15:00", market: "Total de golos acima de 1.5", odd: 1.55, result: "win", isPremium: false, date: yesterdayStr },
    { homeTeam: "Juventus", awayTeam: "AC Milan", league: "Serie A", matchTime: "18:00", market: "Ambas marcam", odd: 1.90, result: "loss", isPremium: false, date: yesterdayStr },
  ];
  for (const p of pastPredictions) await savePrediction(p);

  const demoScale: Omit<ScaleEntry, "id">[] = [
    { date: yesterdayStr, odds: [{ value: 3.23, result: "win", label: "Odd 1" }, { value: 3.14, result: "loss", label: "Odd 2" }], isScheduled: false },
    { date: todayStr, odds: [{ value: 2.59, result: "pending", label: "Odd 1" }, { value: 3.23, result: "pending", label: "Odd 2" }, { value: 8.41, result: "pending", label: "Bonus" }], isScheduled: false },
  ];
  for (const s of demoScale) await saveScaleEntry(s);
}

// Match Management (Jogos com data/hora)
export async function getMatches(): Promise<Match[]> {
  return getJSON(KEYS.MATCHES, []);
}

export async function saveMatches(matches: Match[]): Promise<void> {
  await setJSON(KEYS.MATCHES, matches);
}

export async function addMatch(match: Omit<Match, "id">): Promise<Match> {
  const matches = await getMatches();
  const newMatch = { ...match, id: genId() };
  matches.push(newMatch);
  await saveMatches(matches);
  return newMatch;
}

export async function updateMatch(id: string, updates: Partial<Match>): Promise<void> {
  const matches = await getMatches();
  const idx = matches.findIndex((m) => m.id === id);
  if (idx >= 0) {
    matches[idx] = { ...matches[idx], ...updates };
    await saveMatches(matches);
  }
}

export async function deleteMatch(id: string): Promise<void> {
  const matches = await getMatches();
  await saveMatches(matches.filter((m) => m.id !== id));
}

export async function getMatchesByDate(date: string): Promise<Match[]> {
  const matches = await getMatches();
  return matches.filter((m) => m.date === date).sort((a, b) => a.time.localeCompare(b.time));
}

// API Match Functions
export async function getApiMatches(): Promise<ApiMatch[]> {
  return getJSON(KEYS.API_MATCHES, []);
}

export async function saveApiMatches(matches: ApiMatch[]): Promise<void> {
  await setJSON(KEYS.API_MATCHES, matches);
}

export async function fetchMatchesForDate(dateStr: string): Promise<ApiMatch[]> {
  try {
    const API_KEY = "5bdac23e79514c9aac67cf28e95d3ae3"; // Football-Data.org API key
    
    // Format date for API (YYYY-MM-DD)
    const [year, month, day] = dateStr.split("-");
    const startDate = `${year}-${month}-${day}`;
    const endDate = `${year}-${month}-${day}`;

    // Fetch from Football-Data.org - Get all matches for the day
    const response = await fetch(
      `https://api.football-data.org/v4/matches?dateFrom=${startDate}&dateTo=${endDate}`,
      {
        headers: { "X-Auth-Token": API_KEY },
      }
    );

    if (!response.ok) {
      console.error("Football-Data API error:", response.status, response.statusText);
      return [];
    }

    const data: any = await response.json();
    const matches: ApiMatch[] = [];

    if (data.matches && Array.isArray(data.matches)) {
      for (const m of data.matches) {
        const [hours, minutes] = (m.utcDate?.split("T")[1]?.substring(0, 5) || "00:00").split(":");
        const localTime = `${hours}:${minutes}`;

        matches.push({
          id: `api_${m.id}`,
          date: dateStr,
          time: localTime,
          homeTeam: m.homeTeam?.name || m.homeTeam?.shortName || "Home",
          awayTeam: m.awayTeam?.name || m.awayTeam?.shortName || "Away",
          homeTeamId: m.homeTeam?.id?.toString(),
          awayTeamId: m.awayTeam?.id?.toString(),
          league: m.competition?.name || "Unknown League",
          competition: m.competition?.code || "UNK",
          status: m.status || "SCHEDULED",
          feedTime: new Date().toISOString(),
        });
      }
    }

    // Cache the results
    await saveApiMatches(matches);
    return matches;
  } catch (error) {
    console.error("Error fetching matches from API:", error);
    return [];
  }
}

export async function convertApiMatchToMatch(apiMatch: ApiMatch): Promise<Match> {
  return {
    id: genId(),
    date: apiMatch.date,
    time: apiMatch.time,
    homeTeam: apiMatch.homeTeam,
    awayTeam: apiMatch.awayTeam,
    league: apiMatch.league,
    available: false, // starts as unavailable, admin enables it
    selectedMarkets: [],
    status: apiMatch.status === "LIVE" ? "live" : apiMatch.status === "FINISHED" ? "finished" : "pending",
  };
}
