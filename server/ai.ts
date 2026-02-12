
import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "./db";
import { restaurants, aiAnalysisLogs, reviews } from "../shared/schema";
import { eq, ilike, or, and } from "drizzle-orm";

// Load API Key from ../CodingWorkout/.env if not in current .env
// In a real scenario, we'd probably symlink or copy the .env, but let's try to read it if process.env.GEMINI_API_KEY is missing.
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

let apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    const otherEnvPath = path.resolve(__dirname, "../../CodingWorkout/.env");
    if (fs.existsSync(otherEnvPath)) {
        const envConfig = dotenv.parse(fs.readFileSync(otherEnvPath));
        apiKey = envConfig.GEMINI_API_KEY;
    }
}

if (!apiKey) {
    throw new Error("GEMINI_API_KEY not found in environment or ../CodingWorkout/.env");
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function analyzeRestaurant(restaurantId: number) {
    const restaurant = await db.query.restaurants.findFirst({
        where: eq(restaurants.id, restaurantId),
        with: {
            reviews: true
        }
    });

    if (!restaurant) throw new Error(`Restaurant ${restaurantId} not found`);

    // Filter relevant reviews
    const keywords = ["halal", "zabiha", "muslim", "alcohol", "bar", "wine", "beer", "pork", "haram", "bacon"];
    const relevantReviews = restaurant.reviews.filter(r => {
        const text = (r.text || "").toLowerCase();
        return keywords.some(k => text.includes(k));
    }).map(r => ({
        text: r.text,
        rating: r.rating,
        date: r.publishedAtDate
    }));

    if (relevantReviews.length === 0) {
        console.log(`No relevant reviews found for ${restaurant.name}`);
        return;
    }

    const prompt = `
    You are an expert at analyzing restaurant reviews to determine Halal and Alcohol status for Muslim diners.
    
    Restaurant: "${restaurant.name}"
    Category: "${restaurant.category}"
    
    Here are some relevant reviews:
    ${JSON.stringify(relevantReviews.slice(0, 30))} 
    
    Based ONLY on these reviews and the restaurant details, determine:
    1. isHalal: boolean (true if there is strong evidence of halal options)
    2. halalStatus: 'certified' | 'partial' | 'muscle_meat' | 'mixed' | 'unknown' | 'not_halal'
       - certified: explicitly stated as certified
       - partial: only some items are halal (e.g. chicken only, or lamb only)
       - muscle_meat: reviews mention "halal meat" but not full certification
       - mixed: serves both halal and pork/non-halal meat
       - not_halal: explicit mentions of not being halal
    3. alcoholStatus: 'none' | 'beer_wine' | 'full_bar' | 'unknown'
    4. dietaryLabels: string[] (e.g. "pork-free", "alcohol-free", "vegetarian-friendly", "verified-halal")
    
    Return a JSON object with keys: isHalal, halalStatus, alcoholStatus, dietaryLabels.
    Do not use markdown formatting. Just JSON.
    `;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        const analysis = JSON.parse(responseText);

        console.log(`Analysis for ${restaurant.name}:`, analysis);

        // Update Restaurant
        await db.update(restaurants)
            .set({
                isHalal: analysis.isHalal,
                halalStatus: analysis.halalStatus,
                alcoholStatus: analysis.alcoholStatus,
                dietaryLabels: analysis.dietaryLabels,
                updatedAt: new Date()
            })
            .where(eq(restaurants.id, restaurantId));

        // Log Analysis
        await db.insert(aiAnalysisLogs).values({
            restaurantId: restaurantId,
            modelUsed: "gemini-1.5-flash",
            promptUsed: `Analyzed ${relevantReviews.length} reviews for ${restaurant.name}`,
            rawResponse: analysis
        });

    } catch (error) {
        console.error(`Error analyzing ${restaurant.name}:`, error);
    }
}
