import { useState } from "react";
import { useAdminRestaurants } from "@/hooks/use-admin-restaurants";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

export default function AdminPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [zip, setZip] = useState("");

    // Debounce search/zip in real app, but for now direct state is fine for simplicity
    const { data, isLoading, error } = useAdminRestaurants(page, 20, search, zip);

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Restaurant Admin Console</h1>

            {/* Filters */}
            <div className="flex gap-4 mb-6 p-4 bg-gray-100 rounded-lg">
                <input
                    type="text"
                    placeholder="Search by name, category..."
                    className="p-2 border rounded w-1/3"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
                <input
                    type="text"
                    placeholder="Filter by Zip Code"
                    className="p-2 border rounded w-40"
                    value={zip}
                    onChange={(e) => { setZip(e.target.value); setPage(1); }}
                />
            </div>

            {isLoading && <p>Loading...</p>}
            {error && <p className="text-red-500">Error loading data.</p>}

            {/* Table */}
            {data && (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviews</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.data.map((r) => (
                                <tr key={r.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{r.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.category}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">{r.address}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.rating || "N/A"}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.userRatingsTotal}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <Link href={`/admin/restaurant/${r.id}`} className="text-indigo-600 hover:text-indigo-900">View</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 bg-gray-50">
                        <span className="text-sm text-gray-700">
                            Page {data.meta.page} of {data.meta.totalPages} (Total: {data.meta.total})
                        </span>
                        <div className="flex gap-2">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                disabled={page >= data.meta.totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
