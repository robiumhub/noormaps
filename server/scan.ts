
import "dotenv/config";
import { db } from "./db";
import { restaurants, reviews } from "@shared/schema";
import { eq, sql, inArray } from "drizzle-orm";

async function scanRestaurants() {
    console.log("Starting scan for potential Halal restaurants...");

    const keywords = ["halal", "zabiha", "muslim", "alcohol", "bar", "wine", "beer", "pork", "haram", "bacon", "permit", "certified"];

    // We want to find restaurants that have ANY review containing these keywords
    // and set isPotentialHalal = true.
    // Ideally this would be a single SQL query, but for now we can iterate or use a subquery.

    // Let's try to do it in batches or a smart update.
    // Fetch all restaurants with their reviews is too heavy.

    // 1. Reset all to false (optional, but good for re-runs if logic changes drastically, though expensive)
    // await db.update(restaurants).set({ isPotentialHalal: false });

    // 2. Find IDs of restaurants that have relevant reviews
    // efficient SQL query using LIKE/ILIKE with OR

    const conditions = keywords.map(w => sql`param ILIKE ${`%${w}%`}`);
    // Drizzle doesn't easily support OR across an array map without constructing the sql chunk manually or using `or(...)`

    // Let's do a raw SQL approach for efficiency or process in chunks.
    // Since we have ~1000 restaurants, we can fetch them all but maybe just ID and Name.

    const allRestaurants = await db.query.restaurants.findMany({
        with: {
            reviews: {
                columns: {
                    text: true
                }
            }
        },
        columns: {
            id: true,
            name: true,
            category: true
        }
    });

    console.log(`Scanning ${allRestaurants.length} restaurants...`);
    let flaggedCount = 0;

    for (const r of allRestaurants) {
        let isPotential = false;

        // Check category first
        const cat = (r.category || "").toLowerCase();
        if (cat.includes("halal") || cat.includes("middle eastern") || cat.includes("mediterranean") || cat.includes("pakistani") || cat.includes("indian") || cat.includes("afghan")) {
            isPotential = true;
        }

        // Check reviews
        if (!isPotential && r.reviews) {
            const combinedText = r.reviews.map(rev => rev.text).join(" ").toLowerCase();
            if (keywords.some(k => combinedText.includes(k))) {
                isPotential = true;
            }
        }

        if (isPotential) {
            await db.update(restaurants)
                .set({ isPotentialHalal: true })
                .where(eq(restaurants.id, r.id));
            flaggedCount++;
        } else {
            await db.update(restaurants)
                .set({ isPotentialHalal: false })
                .where(eq(restaurants.id, r.id));
        }
    }

    console.log(`Scan complete. Flagged ${flaggedCount} restaurants as potential candidates.`);
    process.exit(0);
}

scanRestaurants().catch(err => {
    console.error("Scan failed:", err);
    process.exit(1);
});
