import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import * as Storage from "@/lib/storage";

interface DataContextValue {
  predictions: Storage.Prediction[];
  reservations: Storage.Reservation[];
  scaleEntries: Storage.ScaleEntry[];
  subscription: Storage.Subscription | null;
  isAdmin: boolean;
  hasAccess: boolean;
  daysLeft: number;
  isTrial: boolean;
  loading: boolean;
  refreshAll: () => Promise<void>;
  addPrediction: (p: Omit<Storage.Prediction, "id">) => Promise<void>;
  updatePrediction: (id: string, updates: Partial<Storage.Prediction>) => Promise<void>;
  deletePrediction: (id: string) => Promise<void>;
  addReservation: (r: Omit<Storage.Reservation, "id">) => Promise<void>;
  deleteReservation: (id: string) => Promise<void>;
  addScaleEntry: (s: Omit<Storage.ScaleEntry, "id">) => Promise<void>;
  updateScaleEntry: (id: string, updates: Partial<Storage.ScaleEntry>) => Promise<void>;
  submitPaymentProof: (uri: string, plan: "7days" | "30days") => Promise<void>;
  approveSubscription: () => Promise<void>;
  toggleAdmin: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [predictions, setPredictions] = useState<Storage.Prediction[]>([]);
  const [reservations, setReservations] = useState<Storage.Reservation[]>([]);
  const [scaleEntries, setScaleEntries] = useState<Storage.ScaleEntry[]>([]);
  const [subscription, setSubscription] = useState<Storage.Subscription | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);
  const [daysLeft, setDaysLeft] = useState(3);
  const [isTrial, setIsTrial] = useState(true);
  const [loading, setLoading] = useState(true);

  const refreshAll = useCallback(async () => {
    try {
      await Storage.seedDemoData();
      const [preds, res, scale, sub, admin, access] = await Promise.all([
        Storage.getPredictions(),
        Storage.getReservations(),
        Storage.getScaleEntries(),
        Storage.getSubscription(),
        Storage.getIsAdmin(),
        Storage.checkAccess(),
      ]);
      setPredictions(preds);
      setReservations(res);
      setScaleEntries(scale);
      setSubscription(sub);
      setIsAdmin(admin);
      setHasAccess(access.hasAccess);
      setDaysLeft(access.daysLeft);
      setIsTrial(access.isTrial);
    } catch (e) {
      console.error("Error refreshing data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

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

  const deleteReservation = useCallback(async (id: string) => {
    await Storage.deleteReservation(id);
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
    await Storage.saveSubscription(sub);
    setSubscription(sub);
  }, []);

  const approveSubscription = useCallback(async () => {
    const sub = await Storage.getSubscription();
    if (sub) {
      const updated = { ...sub, active: true, paymentStatus: "approved" as const };
      await Storage.saveSubscription(updated);
      setSubscription(updated);
      const access = await Storage.checkAccess();
      setHasAccess(access.hasAccess);
      setDaysLeft(access.daysLeft);
      setIsTrial(access.isTrial);
    }
  }, []);

  const toggleAdmin = useCallback(async () => {
    const current = await Storage.getIsAdmin();
    await Storage.setIsAdmin(!current);
    setIsAdmin(!current);
    if (!current) {
      setHasAccess(true);
      setDaysLeft(999);
      setIsTrial(false);
    } else {
      const access = await Storage.checkAccess();
      setHasAccess(access.hasAccess);
      setDaysLeft(access.daysLeft);
      setIsTrial(access.isTrial);
    }
  }, []);

  const value = useMemo(() => ({
    predictions, reservations, scaleEntries, subscription, isAdmin,
    hasAccess, daysLeft, isTrial, loading, refreshAll,
    addPrediction, updatePrediction, deletePrediction,
    addReservation, deleteReservation,
    addScaleEntry, updateScaleEntry,
    submitPaymentProof, approveSubscription, toggleAdmin,
  }), [predictions, reservations, scaleEntries, subscription, isAdmin,
    hasAccess, daysLeft, isTrial, loading, refreshAll,
    addPrediction, updatePrediction, deletePrediction,
    addReservation, deleteReservation,
    addScaleEntry, updateScaleEntry,
    submitPaymentProof, approveSubscription, toggleAdmin]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
