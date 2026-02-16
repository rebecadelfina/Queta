import { type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";

export interface PaymentRecord {
  id: string;
  userId: string;
  plan: "7days" | "30days";
  amount: number;
  reference: string;
  status: "pending" | "approved" | "rejected";
  method: "express" | "bank_transfer" | "manual";
  createdAt: string;
  approvedAt?: string;
}

export interface Subscription {
  active: boolean;
  plan: "trial" | "7days" | "30days" | "none";
  startDate: string;
  endDate: string;
  paymentProofUri?: string;
  paymentStatus: "none" | "pending" | "approved" | "rejected";
}

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserSubscription(userId: string, subscription: Subscription): Promise<boolean>;
  getAllPayments(): Promise<PaymentRecord[]>;
  savePayments(payments: PaymentRecord[]): Promise<void>;
  getUserPayments(userId: string): Promise<PaymentRecord[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private payments: PaymentRecord[] = [];

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUserSubscription(
    userId: string,
    subscription: Subscription
  ): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    // In a real app, this would update a database
    // For now, we'll just mark it successful
    return true;
  }

  async getAllPayments(): Promise<PaymentRecord[]> {
    return this.payments;
  }

  async savePayments(payments: PaymentRecord[]): Promise<void> {
    this.payments = payments;
  }

  async getUserPayments(userId: string): Promise<PaymentRecord[]> {
    return this.payments.filter((p) => p.userId === userId);
  }
}

export const storage = new MemStorage();
