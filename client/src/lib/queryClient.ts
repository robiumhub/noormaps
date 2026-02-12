import { QueryClient, QueryFunction } from "@tanstack/react-query";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: false,
        },
    },
});

export const apiRequest = async (
    method: string,
    url: string,
    data?: unknown,
): Promise<Response> => {
    const res = await fetch(url, {
        method,
        headers: data ? { "Content-Type": "application/json" } : {},
        body: data ? JSON.stringify(data) : undefined,
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "An error occurred");
    }

    return res;
};
