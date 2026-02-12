
import "dotenv/config";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { db } from "./db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { restaurants, reviews } from "../shared/schema";
import { sql } from "drizzle-orm";

async function importData() {
    const dataDir = path.resolve(__dirname, "../data/bay_area");

    if (!fs.existsSync(dataDir)) {
        console.error(`Data directory not found: ${dataDir}`);
        process.exit(1);
    }

    const files = fs.readdirSync(dataDir).filter((file) => file.endsWith(".json"));

    for (const file of files) {
        console.log(`Processing ${file}...`);
        const filePath = path.join(dataDir, file);
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const data = JSON.parse(fileContent);

        // Ensure data is an array
        const items = Array.isArray(data) ? data : [data];

        for (const item of items) {
            if (!item.placeId) {
                console.warn(`Skipping item without placeId: ${item.title}`);
                continue;
            }

            // Upsert Restaurant
            await db
                .insert(restaurants)
                .values({
                    placeId: item.placeId,
                    name: item.title,
                    address: item.address,
                    description: item.description,
                    category: item.categoryName,
                    rating: item.totalScore || 0,
                    userRatingsTotal: item.reviewsCount || 0,
                    priceLevel: item.price,
                    website: item.website,
                    phone: item.phone,
                    latitude: item.location?.lat,
                    longitude: item.location?.lng,
                    isHalal: false, // Default
                    halalStatus: "unknown",
                    alcoholStatus: "unknown",
                    dietaryLabels: [],
                    data: item,
                })
                .onConflictDoUpdate({
                    target: restaurants.placeId,
                    set: {
                        name: item.title,
                        address: item.address,
                        description: item.description,
                        category: item.categoryName,
                        rating: item.totalScore,
                        userRatingsTotal: item.reviewsCount,
                        priceLevel: item.price,
                        website: item.website,
                        phone: item.phone,
                        latitude: item.location?.lat,
                        longitude: item.location?.lng,
                        // Preserve new fields if they exist
                        data: item,
                        updatedAt: new Date(),
                    },
                });

            // Fetch restaurant ID for reviews linking
            const [restaurant] = await db
                .select({ id: restaurants.id })
                .from(restaurants)
                .where(sql`${restaurants.placeId} = ${item.placeId}`)
                .limit(1);

            if (!restaurant) {
                console.error(`Failed to retrieve restaurant ID for ${item.title}`);
                continue;
            }

            // Upsert Reviews
            if (item.reviews && Array.isArray(item.reviews)) {
                for (const review of item.reviews) {
                    if (!review.reviewId) continue;

                    await db.insert(reviews).values({
                        reviewId: review.reviewId,
                        restaurantId: restaurant.id,
                        reviewerName: review.name,
                        reviewerPhotoUrl: review.reviewerPhotoUrl,
                        rating: review.stars,
                        text: review.text,
                        publishedAtDate: review.publishedAtDate ? new Date(review.publishedAtDate) : null,
                        responseFromOwnerText: review.responseFromOwnerText,
                        responseFromOwnerDate: review.responseFromOwnerDate ? new Date(review.responseFromOwnerDate) : null,
                        data: review
                    }).onConflictDoUpdate({
                        target: reviews.reviewId,
                        set: {
                            reviewerName: review.name,
                            reviewerPhotoUrl: review.reviewerPhotoUrl,
                            rating: review.stars,
                            text: review.text,
                            publishedAtDate: review.publishedAtDate ? new Date(review.publishedAtDate) : null,
                            responseFromOwnerText: review.responseFromOwnerText,
                            responseFromOwnerDate: review.responseFromOwnerDate ? new Date(review.responseFromOwnerDate) : null,
                            data: review
                        }
                    })
                }
            }
        }
    }
    console.log("Import completed successfully.");
    process.exit(0);
}

importData().catch((err) => {
    console.error("Import failed:", err);
    process.exit(1);
});
