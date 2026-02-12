import fetch from "node-fetch";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { SerpRestaurant, SerpReview } from "../shared/types";

const API_KEY = process.env.SERP_API_KEY;
const LOCATION = "Pleasanton, CA";
const OUTPUT_DIR = path.resolve(__dirname, "../data");
const MAX_RESTAURANTS = 150; // Safety cap to stay within budget (Discovery + Review fetches)

if (!API_KEY) {
    console.error("SERP_API_KEY is not defined in .env");
    process.exit(1);
}

async function fetchRestaurantsPage(query: string, start: number = 0): Promise<SerpRestaurant[]> {
    console.log(`Searching for restaurants: ${query} (offset: ${start})...`);
    const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(query)}&type=search&start=${start}&api_key=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
        throw new Error(`SerpAPI Error: ${data.error}`);
    }

    return (data.local_results || []).map((r: any) => ({
        title: r.title,
        data_id: r.data_id,
        address: r.address,
        description: r.description,
        category: r.type,
        rating: r.rating,
        thumbnail: r.thumbnail
    }));
}

async function fetchReviews(dataId: string): Promise<SerpReview[]> {
    console.log(`Fetching reviews for data_id: ${dataId}...`);
    const url = `https://serpapi.com/search.json?engine=google_maps_reviews&data_id=${dataId}&api_key=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
        console.warn(`Could not fetch reviews for ${dataId}: ${data.error}`);
        return [];
    }

    return (data.reviews || []).map((r: any) => ({
        snippet: r.snippet,
        rating: r.rating,
        user: { name: r.user?.name || "Anonymous" }
    }));
}

async function main() {
    try {
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR);
        }

        const allRestaurantsMap = new Map<string, SerpRestaurant>();
        let start = 0;
        let hasMore = true;

        let totalProcessed = 0;
        console.log("--- PHASE 1: COMPREHENSIVE DISCOVERY ---");
        while (hasMore && allRestaurantsMap.size < MAX_RESTAURANTS) {
            const results = await fetchRestaurantsPage(`restaurants in ${LOCATION}`, start);

            if (results.length === 0) {
                console.log("No more results returned from SerpAPI.");
                hasMore = false;
                break;
            }

            console.log(`Processing ${results.length} candidates from page...`);
            for (const r of results) {
                totalProcessed++;
                // Strict locality check: ensure the restaurant is actually in Pleasanton
                const isPleasanton = r.address && r.address.toLowerCase().includes("pleasanton");
                if (isPleasanton) {
                    if (!allRestaurantsMap.has(r.data_id)) {
                        allRestaurantsMap.set(r.data_id, r);
                    }
                } else {
                    console.log(`Skipping: ${r.title} (Location: ${r.address})`);
                }
            }

            start += 20; // SerpAPI typical Google Maps page size

            // If we didn't get a full page, we're likely done
            if (results.length < 20) {
                hasMore = false;
            }

            // Safety break for pagination loop
            if (start > 200) break;
        }

        const uniqueRestaurants = Array.from(allRestaurantsMap.values());
        console.log(`Found ${uniqueRestaurants.length} unique restaurants strictly in ${LOCATION}.`);

        console.log("\n--- PHASE 2: RAW REVIEW HARVESTING ---");
        const rawReviews: Record<string, SerpReview[]> = {};
        const finalData: any[] = [];

        for (const r of uniqueRestaurants) {
            const reviews = await fetchReviews(r.data_id);
            rawReviews[r.data_id] = reviews;

            finalData.push({
                ...r,
                rawReviews: reviews
            });

            // Sleep to avoid aggressive rate limiting
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        // Save Raw Data
        fs.writeFileSync(
            path.join(OUTPUT_DIR, "raw_restaurants.json"),
            JSON.stringify(uniqueRestaurants, null, 2)
        );

        fs.writeFileSync(
            path.join(OUTPUT_DIR, "raw_reviews_map.json"),
            JSON.stringify(rawReviews, null, 2)
        );

        fs.writeFileSync(
            path.join(OUTPUT_DIR, "complete_raw_dataset.json"),
            JSON.stringify(finalData, null, 2)
        );

        console.log("\nSUCCESS: Raw database built.");
        console.log(`Path: ${path.join(OUTPUT_DIR, "complete_raw_dataset.json")}`);

    } catch (error) {
        console.error("Error building raw database:", error);
    }
}

main();
