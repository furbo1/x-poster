import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  error: text("error"),
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  posted: true,
  postedAt: true,
  error: true,
});

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;
