export interface SerpRestaurant {
    title: string;
    data_id: string;
    address: string;
    description?: string;
    category: string;
    rating?: number;
    thumbnail?: string;
}

export interface SerpReview {
    snippet: string;
    rating: number;
    user: {
        name: string;
    };
}

export interface AnalyzedRestaurant extends SerpRestaurant {
    halalReviews: string[];
    isHalal: boolean;
    classification: "verified" | "probable" | "options" | "unconfirmed";
    halalScore: number;
    mentionsZabiha: boolean;
}
