import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import * as Storage from "@/lib/storage";

interface DataContextValue {
  currentUser: Storage.UserProfile | null;
  predictions: Storage.Prediction[];
  reservations: Storage.Reservation[];
  scaleEntries: Storage.ScaleEntry[];
  comments: Storage.Comment[];
  allUsers: Storage.UserProfile[];
  teamConfigs: Storage.TeamConfig[];
  marketConfigs: Storage.MarketConfig[];
  matches: Storage.Match[];
  hasAccess: boolean;
  daysLeft: number;
  isTrial: boolean;
  loading: boolean;
  trialDaysLeft: number;
  trialExpired: boolean;
  refreshAll: () => Promise<void>;
  login: (username: string, password: string) => Promise<Storage.UserProfile | null>;
  register: (username: string, password: string, displayName: string) => Promise<Storage.UserProfile | null>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Storage.UserProfile>) => Promise<void>;
  changePassword: (oldPw: string, newPw: string) => Promise<boolean>;
  addPrediction: (p: Omit<Storage.Prediction, "id">) => Promise<void>;
  updatePrediction: (id: string, updates: Partial<Storage.Prediction>) => Promise<void>;
  deletePrediction: (id: string) => Promise<void>;
  addReservation: (r: Omit<Storage.Reservation, "id">) => Promise<void>;
  publishReservation: (id: string) => Promise<void>;
  deleteReservation: (id: string) => Promise<void>;
  addResultReservation: (house: "bantubet" | "elephantebet", imageUri: string, ticketId: string | undefined, daysExpire: number) => Promise<void>;
  getResultReservations: (house: "bantubet" | "elephantebet") => Promise<Storage.Reservation[]>;
  updateReservationExpiry: (id: string, daysExpire: number) => Promise<void>;
  addScaleEntry: (s: Omit<Storage.ScaleEntry, "id">) => Promise<void>;
  updateScaleEntry: (id: string, updates: Partial<Storage.ScaleEntry>) => Promise<void>;
  submitPaymentProof: (uri: string, plan: "7days" | "30days") => Promise<void>;
  approveUserSubscription: (userId: string) => Promise<void>;
  addComment: (text: string) => Promise<void>;
  approveComment: (id: string) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
  // Team & Market Config
  addTeamConfig: (team: Storage.TeamConfig) => Promise<void>;
  removeTeamConfig: (teamName: string) => Promise<void>;
  updateMarketTeams: (marketName: string, teamNames: string[]) => Promise<void>;
  saveTeamConfigs: (configs: Storage.TeamConfig[]) => Promise<void>;
  saveMarketConfigs: (configs: Storage.MarketConfig[]) => Promise<void>;
  // Match Management
  addMatch: (match: Omit<Storage.Match, "id">) => Promise<void>;
  updateMatch: (id: string, updates: Partial<Storage.Match>) => Promise<void>;
  deleteMatch: (id: string) => Promise<void>;
  getMatchesByDate: (date: string) => Promise<Storage.Match[]>;
  saveMatches: (matches: Storage.Match[]) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Storage.UserProfile | null>(null);
  const [predictions, setPredictions] = useState<Storage.Prediction[]>([]);
  const [reservations, setReservations] = useState<Storage.Reservation[]>([]);
  const [scaleEntries, setScaleEntries] = useState<Storage.ScaleEntry[]>([]);
  const [comments, setComments] = useState<Storage.Comment[]>([]);
  const [allUsers, setAllUsers] = useState<Storage.UserProfile[]>([]);
  const [teamConfigs, setTeamConfigs] = useState<Storage.TeamConfig[]>([]);
  const [marketConfigs, setMarketConfigs] = useState<Storage.MarketConfig[]>([]);
  const [matches, setMatches] = useState<Storage.Match[]>([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);
  const [isTrial, setIsTrial] = useState(true);
  const [loading, setLoading] = useState(true);
  const [trialDaysLeft, setTrialDaysLeft] = useState(3);
  const [trialExpired, setTrialExpired] = useState(false);

  const refreshAll = useCallback(async () => {
    try {
      // Registra a data de instalação na primeira vez
      await Storage.registerInstallationDate();
      await Storage.createAdminIfNeeded();
      await Storage.createTestUserIfNeeded();
      
      // Verifica se o trial expirou
      const expired = await Storage.isTrialExpired();
      const daysLeft = await Storage.getDaysLeftInTrial();
      setTrialExpired(expired);
      setTrialDaysLeft(daysLeft);
      
      await Storage.seedDemoData();
      const [preds, res, scale, cmts, users, user, teams, markets, mtchs] = await Promise.all([
        Storage.getPredictions(),
        Storage.getReservations(),
        Storage.getScaleEntries(),
        Storage.getComments(),
        Storage.getUsers(),
        Storage.getCurrentUser(),
        Storage.getTeamConfigs(),
        Storage.getMarketConfigs(),
        Storage.getMatches(),
      ]);
      setPredictions(preds);
      setReservations(res);
      setScaleEntries(scale);
      setComments(cmts);
      setAllUsers(users);
      setTeamConfigs(teams);
      setMarketConfigs(markets);
      setMatches(mtchs);
      
      let currentUserToSet = user;
      
      // Se nenhum usuário logado, tenta logar o admin automaticamente
      if (!user) {
        const adminUser = users.find((u) => u.isAdmin);
        if (adminUser) {
          currentUserToSet = adminUser;
        }
      }
      
      if (currentUserToSet) {
        const freshUser = users.find((u) => u.id === currentUserToSet!.id);
        if (freshUser) {
          setCurrentUser(freshUser);
          const access = Storage.checkUserAccess(freshUser);
          setHasAccess(access.hasAccess);
          setDaysLeft(access.daysLeft);
          setIsTrial(access.isTrial);
        } else {
          setCurrentUser(currentUserToSet);
          const access = Storage.checkUserAccess(currentUserToSet);
          setHasAccess(access.hasAccess);
          setDaysLeft(access.daysLeft);
          setIsTrial(access.isTrial);
        }
      } else {
        setCurrentUser(null);
        setHasAccess(false);
      }
    } catch (e) {
      console.error("Error refreshing:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  const login = useCallback(async (username: string, password: string) => {
    const user = await Storage.loginUser(username, password);
    if (user) {
      setCurrentUser(user);
      const access = Storage.checkUserAccess(user);
      setHasAccess(access.hasAccess);
      setDaysLeft(access.daysLeft);
      setIsTrial(access.isTrial);
    }
    return user;
  }, []);

  const register = useCallback(async (username: string, password: string, displayName: string) => {
    const user = await Storage.registerUser(username, password, displayName);
    if (user) {
      setCurrentUser(user);
      const access = Storage.checkUserAccess(user);
      setHasAccess(access.hasAccess);
      setDaysLeft(access.daysLeft);
      setIsTrial(access.isTrial);
      setAllUsers(await Storage.getUsers());
    }
    return user;
  }, []);

  const logout = useCallback(async () => {
    await Storage.logoutUser();
    setCurrentUser(null);
    setHasAccess(false);
    setDaysLeft(0);
    setIsTrial(true);
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Storage.UserProfile>) => {
    if (!currentUser) return;
    await Storage.updateUserProfile(currentUser.id, updates);
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    setAllUsers(await Storage.getUsers());
  }, [currentUser]);

  const changePassword = useCallback(async (oldPw: string, newPw: string) => {
    if (!currentUser) return false;
    if (currentUser.password !== oldPw) return false;
    await Storage.updateUserProfile(currentUser.id, { password: newPw });
    setCurrentUser({ ...currentUser, password: newPw });
    return true;
  }, [currentUser]);

  const addPrediction = useCallback(async (p: Omit<Storage.Prediction, "id">) => {
    await Storage.savePrediction(p);
    setPredictions(await Storage.getPredictions());
  }, []);

  const updatePrediction = useCallback(async (id: string, updates: Partial<Storage.Prediction>) => {
    await Storage.updatePrediction(id, updates);
    setPredictions(await Storage.getPredictions());
  }, []);

  const deletePrediction = useCallback(async (id: string) => {
    await Storage.deletePrediction(id);
    setPredictions(await Storage.getPredictions());
  }, []);

  const addReservation = useCallback(async (r: Omit<Storage.Reservation, "id">) => {
    await Storage.saveReservation(r);
    setReservations(await Storage.getReservations());
  }, []);

  const publishReservation = useCallback(async (id: string) => {
    await Storage.updateReservation(id, { published: true });
    setReservations(await Storage.getReservations());
  }, []);

  const deleteReservation = useCallback(async (id: string) => {
    await Storage.deleteReservation(id);
    setReservations(await Storage.getReservations());
  }, []);

  const addResultReservationFn = useCallback(async (house: "bantubet" | "elephantebet", imageUri: string, ticketId: string | undefined, daysExpire: number) => {
    await Storage.addResultReservation(house, imageUri, ticketId, daysExpire);
    setReservations(await Storage.getReservations());
  }, []);

  const getResultReservationsFn = useCallback(async (house: "bantubet" | "elephantebet") => {
    return Storage.getResultReservations(house);
  }, []);

  const updateReservationExpiryFn = useCallback(async (id: string, daysExpire: number) => {
    await Storage.updateReservationExpiry(id, daysExpire);
    setReservations(await Storage.getReservations());
  }, []);

  const addScaleEntry = useCallback(async (s: Omit<Storage.ScaleEntry, "id">) => {
    await Storage.saveScaleEntry(s);
    setScaleEntries(await Storage.getScaleEntries());
  }, []);

  const updateScaleEntry = useCallback(async (id: string, updates: Partial<Storage.ScaleEntry>) => {
    await Storage.updateScaleEntry(id, updates);
    setScaleEntries(await Storage.getScaleEntries());
  }, []);

  const submitPaymentProof = useCallback(async (uri: string, plan: "7days" | "30days") => {
    if (!currentUser) return;
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + (plan === "7days" ? 7 : 30));
    const sub: Storage.Subscription = {
      active: false,
      plan,
      startDate: now.toISOString(),
      endDate: end.toISOString(),
      paymentProofUri: uri,
      paymentStatus: "pending",
    };
    await Storage.updateUserSubscription(currentUser.id, sub);
    setCurrentUser({ ...currentUser, subscription: sub });
    setAllUsers(await Storage.getUsers());
  }, [currentUser]);

  const approveUserSubscription = useCallback(async (userId: string) => {
    const users = await Storage.getUsers();
    const user = users.find((u) => u.id === userId);
    if (user) {
      const now = new Date();
      const end = new Date(now);
      const days = user.subscription.plan === "7days" ? 7 : 30;
      end.setDate(end.getDate() + days);
      const sub: Storage.Subscription = {
        ...user.subscription,
        active: true,
        paymentStatus: "approved",
        startDate: now.toISOString(),
        endDate: end.toISOString(),
      };
      await Storage.updateUserSubscription(userId, sub);
      setAllUsers(await Storage.getUsers());
      if (currentUser && currentUser.id === userId) {
        setCurrentUser({ ...currentUser, subscription: sub });
        setHasAccess(true);
        setIsTrial(false);
        setDaysLeft(days);
      }
    }
  }, [currentUser]);

  const addCommentFn = useCallback(async (text: string) => {
    if (!currentUser) return;
    await Storage.addComment({
      userId: currentUser.id,
      username: currentUser.displayName,
      userPhoto: currentUser.photoUri,
      text,
      date: new Date().toISOString(),
      approved: currentUser.isAdmin,
    });
    setComments(await Storage.getComments());
  }, [currentUser]);

  const approveCommentFn = useCallback(async (id: string) => {
    await Storage.approveComment(id);
    setComments(await Storage.getComments());
  }, []);

  const deleteCommentFn = useCallback(async (id: string) => {
    await Storage.deleteComment(id);
    setComments(await Storage.getComments());
  }, []);

  // Team & Market Config functions
  const addTeamConfigFn = useCallback(async (team: Storage.TeamConfig) => {
    await Storage.addTeamConfig(team);
    setTeamConfigs(await Storage.getTeamConfigs());
  }, []);

  const removeTeamConfigFn = useCallback(async (teamName: string) => {
    await Storage.removeTeamConfig(teamName);
    setTeamConfigs(await Storage.getTeamConfigs());
  }, []);

  const updateMarketTeamsFn = useCallback(async (marketName: string, teamNames: string[]) => {
    await Storage.updateMarketTeams(marketName, teamNames);
    setMarketConfigs(await Storage.getMarketConfigs());
  }, []);

  const saveTeamConfigsFn = useCallback(async (configs: Storage.TeamConfig[]) => {
    await Storage.saveTeamConfigs(configs);
    setTeamConfigs(configs);
  }, []);

  const saveMarketConfigsFn = useCallback(async (configs: Storage.MarketConfig[]) => {
    await Storage.saveMarketConfigs(configs);
    setMarketConfigs(configs);
  }, []);

  // Match Management functions
  const addMatchFn = useCallback(async (match: Omit<Storage.Match, "id">) => {
    await Storage.addMatch(match);
    setMatches(await Storage.getMatches());
  }, []);

  const updateMatchFn = useCallback(async (id: string, updates: Partial<Storage.Match>) => {
    await Storage.updateMatch(id, updates);
    setMatches(await Storage.getMatches());
  }, []);

  const deleteMatchFn = useCallback(async (id: string) => {
    await Storage.deleteMatch(id);
    setMatches(await Storage.getMatches());
  }, []);

  const getMatchesByDateFn = useCallback(async (date: string) => {
    return Storage.getMatchesByDate(date);
  }, []);

  const saveMatchesFn = useCallback(async (mtchs: Storage.Match[]) => {
    await Storage.saveMatches(mtchs);
    setMatches(mtchs);
  }, []);

  const value = useMemo(() => ({
    currentUser, predictions, reservations, scaleEntries, comments, allUsers,
    teamConfigs, marketConfigs, matches,
    hasAccess, daysLeft, isTrial, loading, trialDaysLeft, trialExpired, refreshAll,
    login, register, logout, updateProfile, changePassword,
    addPrediction, updatePrediction, deletePrediction,
    addReservation, publishReservation, deleteReservation,
    addResultReservation: addResultReservationFn, getResultReservations: getResultReservationsFn, updateReservationExpiry: updateReservationExpiryFn,
    addScaleEntry, updateScaleEntry,
    submitPaymentProof, approveUserSubscription,
    addComment: addCommentFn, approveComment: approveCommentFn, deleteComment: deleteCommentFn,
    addTeamConfig: addTeamConfigFn, removeTeamConfig: removeTeamConfigFn,
    updateMarketTeams: updateMarketTeamsFn, saveTeamConfigs: saveTeamConfigsFn, saveMarketConfigs: saveMarketConfigsFn,
    addMatch: addMatchFn, updateMatch: updateMatchFn, deleteMatch: deleteMatchFn, getMatchesByDate: getMatchesByDateFn, saveMatches: saveMatchesFn,
  }), [currentUser, predictions, reservations, scaleEntries, comments, allUsers,
    teamConfigs, marketConfigs, matches,
    hasAccess, daysLeft, isTrial, loading, trialDaysLeft, trialExpired, refreshAll,
    login, register, logout, updateProfile, changePassword,
    addPrediction, updatePrediction, deletePrediction,
    addReservation, publishReservation, deleteReservation,
    addResultReservationFn, getResultReservationsFn, updateReservationExpiryFn,
    addScaleEntry, updateScaleEntry,
    submitPaymentProof, approveUserSubscription,
    addCommentFn, approveCommentFn, deleteCommentFn,
    addTeamConfigFn, removeTeamConfigFn, updateMarketTeamsFn, saveTeamConfigsFn, saveMarketConfigsFn,
    addMatchFn, updateMatchFn, deleteMatchFn, getMatchesByDateFn, saveMatchesFn]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
