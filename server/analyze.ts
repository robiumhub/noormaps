import "dotenv/config";
import { db } from "./db";
import { restaurants, aiAnalysisLogs } from "../shared/schema";
import { analyzeRestaurant } from "./ai";
import { eq, isNull, sql, and } from "drizzle-orm";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import fetch from "node-fetch";

// Assuming apiKey is defined elsewhere or needs to be defined here
// For example:
let apiKey = process.env.GEMINI_API_KEY; // Make sure this is available

if (!apiKey) {
    const otherEnvPath = path.resolve(__dirname, "../../CodingWorkout/.env");
    if (fs.existsSync(otherEnvPath)) {
        const envConfig = dotenv.parse(fs.readFileSync(otherEnvPath));
        apiKey = envConfig.GEMINI_API_KEY;
    }
}

async function listModels() {
    try {
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not set in environment variables.");
        }
        console.log("Listing models via REST API...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`API Error: ${response.status} ${text}`);
        }

        const data = await response.json();
        fs.writeFileSync("models.json", JSON.stringify(data, null, 2));
        console.log("Models saved to models.json");

    } catch (error) {
        console.error("List Models failed:", error);
    }
}

async function runAnalysis() {
    // Find restaurant with 'unknown' status AND flagged as potential, limit 5
    const targets = await db.query.restaurants.findMany({
        where: and(
            eq(restaurants.halalStatus, "unknown"),
            eq(restaurants.isPotentialHalal, true)
        ),
        limit: 5
    });

    console.log(`Found ${targets.length} restaurants to analyze.`);

    for (const r of targets) {
        console.log(`Analyzing ${r.name} (${r.id})...`);
        await analyzeRestaurant(r.id);
    }

    console.log("Analysis batch complete.");
    process.exit(0);
}

// Call listModels first, then potentially runAnalysis or exit
// listModels().then(() => {
// If you want to run analysis after listing models, uncomment the line below
// runAnalysis();
// process.exit(0); // Exit after listing models
// }).catch(err => {
//    console.error("Script failed:", err);
//    process.exit(1);
// });

// Original runAnalysis error handling, kept for reference if runAnalysis is still intended to be the primary flow
runAnalysis().catch(err => {
    console.error("Analysis script failed:", err);
    process.exit(1);
});
