import type { Express } from "express";
import { createServer, type Server } from "http";
import fs from "fs";
import path from "path";
import { db } from "./db";
import { restaurants, reviews } from "../shared/schema";
import { eq, ilike, or, sql, desc, count } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
    // Existing route (backward compatibility)
    app.get("/api/restaurants", (_req, res) => {
        try {
            const dataPath = path.resolve(__dirname, "../data/restaurants.json");
            if (!fs.existsSync(dataPath)) {
                return res.json([]);
            }
            const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
            res.json(data);
        } catch (error) {
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
