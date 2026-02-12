import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";

export default function AdminRestaurantDetail() {
    const [match, params] = useRoute("/admin/restaurant/:id");
    const id = params?.id;

    const { data: restaurant, isLoading, error } = useQuery({
        queryKey: ["admin-restaurant", id],
        queryFn: async () => {
            const res = await fetch(`/api/admin/restaurants/${id}`);
            if (!res.ok) throw new Error("Failed to fetch");
            return res.json();
        },
        enabled: !!id,
    });

    if (isLoading) return <div className="p-6">Loading...</div>;
    if (error) return <div className="p-6 text-red-500">Error loading restaurant.</div>;
    if (!restaurant) return <div className="p-6">Not found</div>;

    return (
        <div className="container mx-auto p-6">
            <Link href="/admin" className="text-indigo-600 hover:underline mb-4 inline-block">&larr; Back to Admin</Link>

            <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>
                <p className="text-gray-600 mb-4">{restaurant.address}</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Category:</strong> {restaurant.category}</div>
                    <div><strong>Rating:</strong> {restaurant.rating} ({restaurant.userRatingsTotal} reviews)</div>
                    <div><strong>Place ID:</strong> {restaurant.placeId}</div>
                    <div><strong>Website:</strong> <a href={restaurant.website} target="_blank" className="text-blue-500 truncate block">{restaurant.website}</a></div>

                    <div className="col-span-2 mt-4 border-t pt-4">
                        <h3 className="font-bold mb-2">Status & Labels</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="font-semibold">Halal Status:</span> {restaurant.halalStatus || "unknown"}
                            </div>
                            <div>
                                <span className="font-semibold">Alcohol Status:</span> {restaurant.alcoholStatus || "unknown"}
                            </div>
                            <div className="col-span-2">
                                <span className="font-semibold">Dietary Labels:</span> {restaurant.dietaryLabels ? restaurant.dietaryLabels.join(", ") : "None"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-bold mb-4">Reviews</h2>
            <div className="space-y-4">
                {restaurant.reviews && restaurant.reviews.length > 0 ? (
                    restaurant.reviews.map((review: any) => (
                        <div key={review.reviewId} className="bg-white p-4 rounded shadow border">
                            <div className="flex items-center gap-2 mb-2">
                                {review.reviewerPhotoUrl && <img src={review.reviewerPhotoUrl} alt="" className="w-8 h-8 rounded-full" />}
                                <span className="font-bold">{review.reviewerName}</span>
                                <span className="text-yellow-500">{"★".repeat(review.rating)}</span>
                                <span className="text-gray-400 text-sm">{new Date(review.publishedAtDate).toLocaleDateString()}</span>
                            </div>
                            <p className="text-gray-800 whitespace-pre-wrap">{review.text}</p>
                            {review.responseFromOwnerText && (
                                <div className="mt-2 pl-4 border-l-2 border-gray-300 bg-gray-50 p-2 text-sm">
                                    <span className="font-semibold block">Owner Response:</span>
                                    {review.responseFromOwnerText}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <p>No reviews stored for this restaurant.</p>
                )}
            </div>
        </div>
    );
}
