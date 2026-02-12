import { pgTable, text, serial, integer, boolean, jsonb, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  placeId: text("place_id").unique().notNull(), // Stable ID from Google
  name: text("name").notNull(),
  address: text("address").notNull(),
  description: text("description"),
  category: text("category"),
  rating: doublePrecision("rating"),
  userRatingsTotal: integer("user_ratings_total"),
  priceLevel: text("price_level"),
  website: text("website"),
  phone: text("phone"),
  googleMapsUrl: text("google_maps_url"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  isHalal: boolean("is_halal").default(false), // derived/manual - simple boolean
  halalStatus: text("halal_status").default("unknown"), // 'certified', 'partial', 'muscle_meat', 'mixed', 'unknown'
  alcoholStatus: text("alcohol_status").default("unknown"), // 'none', 'beer_wine', 'full_bar', 'unknown'
  isPotentialHalal: boolean("is_potential_halal").default(false), // flagged by keyword search
  dietaryLabels: text("dietary_labels").array(), // e.g. ['pork-free', 'vegetarian-friendly']
  data: jsonb("data"), // Store full original JSON for future reference
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id),
  reviewId: text("review_id").unique().notNull(), // Google Review ID
  reviewerName: text("reviewer_name"),
  reviewerPhotoUrl: text("reviewer_photo_url"),
  rating: integer("rating"),
  text: text("text"),
  publishedAtDate: timestamp("published_at_date"),
  responseFromOwnerText: text("response_from_owner_text"),
  responseFromOwnerDate: timestamp("response_from_owner_date"),
  data: jsonb("data"), // Store full review JSON
});

export const aiAnalysisLogs = pgTable("ai_analysis_logs", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id),
  analysisDate: timestamp("analysis_date").defaultNow(),
  modelUsed: text("model_used"),
  promptUsed: text("prompt_used"),
  rawResponse: jsonb("raw_response"),
});

export const aiAnalysisLogsRelations = relations(aiAnalysisLogs, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [aiAnalysisLogs.restaurantId],
    references: [restaurants.id],
  }),
}));

export const restaurantsRelations = relations(restaurants, ({ many }) => ({
  reviews: many(reviews),
  aiLogs: many(aiAnalysisLogs),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [reviews.restaurantId],
    references: [restaurants.id],
  }),
}));

export const insertRestaurantSchema = createInsertSchema(restaurants);
export const selectRestaurantSchema = createSelectSchema(restaurants);
export type Restaurant = typeof restaurants.$inferSelect;
export type InsertRestaurant = typeof restaurants.$inferInsert;

export const insertReviewSchema = createInsertSchema(reviews);
export const selectReviewSchema = createSelectSchema(reviews);
export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;
