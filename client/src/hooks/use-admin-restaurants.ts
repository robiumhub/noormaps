
import { useQuery } from "@tanstack/react-query";

interface AdminRestaurant {
    id: number;
    placeId: string;
    name: string;
    address: string;
    rating: number;
    userRatingsTotal: number;
    category: string;
    updatedAt: string;
}

interface AdminRestaurantsResponse {
    data: AdminRestaurant[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export function useAdminRestaurants(page = 1, limit = 20, search = "", zip = "") {
    return useQuery<AdminRestaurantsResponse>({
        queryKey: ["admin-restaurants", page, limit, search, zip],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search,
                zip,
            });
            const res = await fetch(`/api/admin/restaurants?${params}`);
            if (!res.ok) {
                throw new Error("Failed to fetch restaurants");
            }
            return res.json();
        },
    });
}
