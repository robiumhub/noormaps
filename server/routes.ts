import type { Express } from "express";
import { createServer, type Server } from "http";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { db } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { restaurants, reviews } from "../shared/schema.js";
import { eq, ilike, or, sql, desc, count } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
    // List All Restaurants for Home Page
    app.get("/api/restaurants", async (_req, res) => {
        try {
            const allRestaurants = await db.query.restaurants.findMany({
                with: {
                    reviews: {
                        limit: 10
                    }
                },
                orderBy: desc(restaurants.rating)
            });

            // Map database results to AnalyzedRestaurant interface expected by frontend
            const mappedData = allRestaurants.map(r => {
                const data = (r.data as any) || {};

                // Extract halal-related reviews for evidence quotes
                const keywords = ["halal", "zabiha", "muslim", "meat", "pork", "alcohol"];
                const halalReviews = r.reviews
                    .filter(rev => {
                        const text = (rev.text || "").toLowerCase();
                        return keywords.some(k => text.includes(k));
                    })
                    .map(rev => rev.text)
                    .filter(Boolean);

                // Map classification based on halalStatus
                let classification: "verified" | "probable" | "options" | "unconfirmed" = "unconfirmed";
                if (r.halalStatus === "certified") classification = "verified";
                else if (r.halalStatus === "partial" || r.halalStatus === "muscle_meat") classification = "probable";
                else if (r.halalStatus === "mixed") classification = "options";

                return {
                    title: r.name,
                    data_id: r.placeId,
                    address: r.address,
                    description: r.description,
                    category: r.category || "Restaurant",
                    rating: r.rating,
                    thumbnail: data.thumbnail,
                    isHalal: r.isHalal,
                    classification: classification,
                    halalReviews: halalReviews.slice(0, 5),
                    halalScore: 0, // Not explicitly used in current UI but required by interface
                    mentionsZabiha: halalReviews.some(rev => rev?.toLowerCase().includes("zabiha"))
                };
            });

            res.json(mappedData);
        } catch (error) {
            console.error("Fetch Restaurants Error:", error);
            res.status(500).json({ message: "Failed to fetch restaurants" });
        }
    });

    // ADMIN: List Restaurants
    app.get("/api/admin/restaurants", async (req, res) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = (req.query.search as string) || "";
        const zip = (req.query.zip as string) || "";

        const offset = (page - 1) * limit;

        const whereConditions = [];

        if (search) {
            whereConditions.push(
                or(
                    ilike(restaurants.name, `%${search}%`),
                    ilike(restaurants.description, `%${search}%`),
                    ilike(restaurants.category, `%${search}%`)
                )
            );
        }

        if (zip) {
            // Address usually contains zip at the end or we can use regex if needed, but simple ilike is okay for now
            whereConditions.push(ilike(restaurants.address, `%${zip}%`));
        }

        const whereClause = whereConditions.length > 0 ? sql.join(whereConditions, sql` AND `) : undefined;

        try {
            const results = await db
                .select()
                .from(restaurants)
                .where(whereClause)
                .limit(limit)
                .offset(offset)
                .orderBy(desc(restaurants.rating));

            // Get total count for pagination
            const [totalResult] = await db
                .select({ count: count() })
                .from(restaurants)
                .where(whereClause);

            res.json({
                data: results,
                meta: {
                    total: totalResult.count,
                    page,
                    limit,
                    totalPages: Math.ceil(totalResult.count / limit)
                }
            });
        } catch (error) {
            console.error("Admin API Error:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    });

    // ADMIN: Get Single Restaurant with Reviews
    app.get("/api/admin/restaurants/:id", async (req, res) => {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

        try {
            const restaurant = await db.query.restaurants.findFirst({
                where: eq(restaurants.id, id),
                with: {
                    reviews: {
                        orderBy: desc(reviews.publishedAtDate),
                        limit: 50 // Limit reviews to avoid payload explosion
                    }
                }
            });

            if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

            res.json(restaurant);
        } catch (error) {
            console.error("Admin Detail API Error:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    });

    const httpServer = createServer(app);
    return httpServer;
}
