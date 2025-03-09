import { pgTable, text, serial, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
});

export type InsertScheduleConfig = z.infer<typeof insertScheduleConfigSchema>;
export type ScheduleConfig = typeof scheduleConfig.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;