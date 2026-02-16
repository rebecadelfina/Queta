import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  numeric,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Matches table
export const matches = pgTable("matches", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  apiId: integer("api_id").notNull().unique(),
  date: date("date").notNull(),
  time: varchar("time", { length: 5 }),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  homeTeamId: integer("home_team_id").notNull(),
  awayTeamId: integer("away_team_id").notNull(),
  league: text("league").notNull(),
  leagueCode: varchar("league_code", { length: 10 }).notNull(),
  leagueId: integer("league_id").notNull(),
  status: varchar("status", { length: 20 }).notNull(), // SCHEDULED, LIVE, FINISHED, POSTPONED
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Predictions/Apostas table
export const predictions = pgTable("predictions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  matchId: varchar("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  prediction: varchar("prediction", { length: 10 }).notNull(), // "1", "X", "2" (home, draw, away)
  odds: numeric("odds", { precision: 5, scale: 2 }),
  stake: numeric("stake", { precision: 10, scale: 2 }),
  result: varchar("result", { length: 10 }), // "won", "lost", "draw", "pending"
  profit: numeric("profit", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Comments table
export const comments = pgTable("comments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  approved: boolean("approved").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Reservations/Apostas em casas de apostas
export const reservations = pgTable("reservations", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  house: varchar("house", { length: 20 }).notNull(), // "bantubet", "elephantebet"
  ticketId: text("ticket_id"),
  type: varchar("type", { length: 20 }).default("initial"), // "initial", "result"
  imageUrl: text("image_url"),
  published: boolean("published").default(false),
  expiresAt: timestamp("expires_at"),
  resultImageUrl: text("result_image_url"),
  resultText: text("result_text"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Scale/Escala - possibly for team ratings or match ratings
export const scales = pgTable("scales", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  matchId: varchar("match_id").references(() => matches.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-10 scale
  comment: text("comment"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Schema validators
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertMatchSchema = createInsertSchema(matches).pick({
  apiId: true,
  date: true,
  time: true,
  homeTeam: true,
  awayTeam: true,
  homeTeamId: true,
  awayTeamId: true,
  league: true,
  leagueCode: true,
  leagueId: true,
  status: true,
});

export const insertPredictionSchema = createInsertSchema(predictions).pick({
  userId: true,
  matchId: true,
  prediction: true,
  odds: true,
  stake: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  userId: true,
  text: true,
});

export const insertReservationSchema = createInsertSchema(reservations).pick({
  userId: true,
  house: true,
  ticketId: true,
  type: true,
  imageUrl: true,
  expiresAt: true,
});

export const insertScaleSchema = createInsertSchema(scales).pick({
  userId: true,
  matchId: true,
  rating: true,
  comment: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matches.$inferSelect;

export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type Prediction = typeof predictions.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type Reservation = typeof reservations.$inferSelect;

export type InsertScale = z.infer<typeof insertScaleSchema>;
export type Scale = typeof scales.$inferSelect;
