import { pgTable, text, serial, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Scheduling configuration table
export const scheduleConfig = pgTable("schedule_config", {
  id: serial("id").primaryKey(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  interval: integer("interval").notNull(), // in minutes
  isActive: boolean("is_active").default(true),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  listingId: text("listing_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  revenue: text("revenue").notNull(),
  monthlyProfit: text("monthly_profit").notNull(),
  profitMargin: text("profit_margin").notNull(),
  promoText: text("promo_text").notNull(),
  posted: boolean("posted").default(false),
  postedAt: timestamp("posted_at"),
  scheduledTime: timestamp("scheduled_time"),
  error: text("error"),
  skipped: boolean("skipped").default(false),
});

// Create a custom schema that accepts ISO strings for dates
export const insertScheduleConfigSchema = createInsertSchema(scheduleConfig, {
  startTime: z.string().transform(str => new Date(str)),
  endTime: z.string().transform(str => new Date(str)),
}).omit({
  id: true,
  isActive: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  posted: true,
  postedAt: true,
  scheduledTime: true,
  error: true,
  skipped: true,
});

// User schemas with validation
export const insertUserSchema = createInsertSchema(users, {
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
}).omit({
  id: true,
  createdAt: true,
});

export type InsertScheduleConfig = z.infer<typeof insertScheduleConfigSchema>;
export type ScheduleConfig = typeof scheduleConfig.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;