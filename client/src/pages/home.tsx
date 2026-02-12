import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Star, Utensils, Info, X, CheckCircle2, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AnalyzedRestaurant } from "@shared/types";

export default function Home() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [activeRestaurant, setActiveRestaurant] = useState<AnalyzedRestaurant | null>(null);

    const { data: restaurants, isLoading } = useQuery<AnalyzedRestaurant[]>({
        queryKey: ["/api/restaurants"],
    });

    const categories = useMemo(() => {
        if (!restaurants) return [];
        const cats = new Set(restaurants.map((r: AnalyzedRestaurant) => r.category).filter(Boolean));
        return Array.from(cats) as string[];
    }, [restaurants]);

    const filteredRestaurants = useMemo(() => {
        if (!restaurants) return [];
        return restaurants.filter((r: AnalyzedRestaurant) => {
            const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.address.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = !selectedCategory || r.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [restaurants, searchTerm, selectedCategory]);

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="border-b bg-card/80 backdrop-blur-md py-4 sticky top-0 z-50">
                <div className="container mx-auto px-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary p-2 rounded-lg">
                            <Utensils className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-primary tracking-tighter">
                            NoorMaps
                        </h1>
                    </div>
                    <div className="relative w-full max-w-md hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search halal restaurants in Pleasanton..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <nav className="flex gap-6 items-center">
                        <a href="#" className="text-sm font-bold border-b-2 border-primary pb-1">Restaurants</a>
                        <button className="bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-bold hover:bg-primary hover:text-white transition-all">
                            Sign In
                        </button>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section className="bg-primary/5 py-12 border-b relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <div className="container mx-auto px-4 relative">
                    <h2 className="text-4xl font-black mb-4 tracking-tighter text-slate-900">Halal Discovery: Pleasanton</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mb-8 font-medium">
                        We've analyzed real user reviews to verify halal claims and zabiha options.
                    </p>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${!selectedCategory ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white hover:bg-muted border-slate-200'}`}
                        >
                            All Types
                        </button>
                        {categories.map((cat: string) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${selectedCategory === cat ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white hover:bg-muted border-slate-200'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-12">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h3 className="text-2xl font-black tracking-tight mb-1">Our Top Picks</h3>
                        <p className="text-sm text-muted-foreground font-medium">Hand-verified through review analysis</p>
                    </div>
                    <span className="text-xs font-bold bg-muted px-3 py-1.5 rounded-full border">
                        {filteredRestaurants.length} locations
                    </span>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-80 bg-muted animate-pulse rounded-2xl" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredRestaurants.map((r: AnalyzedRestaurant) => (
                            <Card key={r.data_id} className="overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-slate-200/60 shadow-sm flex flex-col rounded-2xl">
                                <div className="h-52 bg-muted relative overflow-hidden">
                                    <img
                                        src={r.thumbnail || "https://images.unsplash.com/photo-1544124499-58912cbddaad?w=800&auto=format&fit=crop&q=60"}
                                        alt={r.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                                        {r.classification === "verified" && (
                                            <span className="bg-emerald-600/90 backdrop-blur-md text-white md:text-[10px] text-[8px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-widest flex items-center gap-1.5 border border-white/20">
                                                <CheckCircle2 className="h-3 w-3" /> Verified
                                            </span>
                                        )}
                                        {r.classification === "probable" && (
                                            <span className="bg-blue-600/90 backdrop-blur-md text-white md:text-[10px] text-[8px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-widest border border-white/20">
                                                Probable
                                            </span>
                                        )}
                                        {r.classification === "options" && (
                                            <span className="bg-orange-500/90 backdrop-blur-md text-white md:text-[10px] text-[8px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-widest border border-white/20">
                                                Options
                                            </span>
                                        )}
                                    </div>
                                    {r.rating && (
                                        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-xl flex items-center gap-1 text-sm font-black shadow-lg border border-slate-100">
                                            <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                                            {r.rating}
                                        </div>
                                    )}
                                </div>
                                <CardContent className="p-6 flex-grow flex flex-col">
                                    <div className="mb-4">
                                        <h4 className="text-xl font-black mb-1.5 group-hover:text-primary transition-colors line-clamp-1 tracking-tight">{r.title}</h4>
                                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                                            <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-primary/60" />
                                            <span className="truncate">{r.address}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mb-6">
                                        <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-lg text-[10px] font-bold border border-slate-200">
                                            {r.category || "Restaurant"}
                                        </span>
                                    </div>

                                    {r.halalReviews.length > 0 && (
                                        <div className="mt-auto pt-5 border-t border-slate-100">
                                            <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 relative">
                                                <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0 opacity-70" />
                                                <p className="text-xs italic leading-relaxed text-slate-600 line-clamp-2">
                                                    "{r.halalReviews[0]}"
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setActiveRestaurant(r)}
                                                className="w-full mt-4 py-2 rounded-xl text-xs font-black text-primary hover:bg-primary/5 transition-all border border-primary/20 flex items-center justify-center gap-2 group/btn"
                                            >
                                                See {r.halalReviews.length} Evidence Quotes
                                                <ChevronRight className="h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            {/* Modal Integration */}
            {activeRestaurant && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveRestaurant(null)}></div>
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl relative flex flex-col animate-in fade-in zoom-in duration-300">
                        <button
                            onClick={() => setActiveRestaurant(null)}
                            className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-slate-100 rounded-full transition-all border border-slate-100"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="h-48 relative shrink-0">
                            <img
                                src={activeRestaurant.thumbnail || "https://images.unsplash.com/photo-1544124499-58912cbddaad?w=800&auto=format&fit=crop&q=60"}
                                alt={activeRestaurant.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                            <div className="absolute bottom-4 left-6">
                                <h2 className="text-3xl font-black tracking-tighter">{activeRestaurant.title}</h2>
                                <p className="text-sm font-bold text-muted-foreground flex items-center gap-1.5">
                                    <MapPin className="h-3 w-3" /> {activeRestaurant.address}
                                </p>
                            </div>
                        </div>

                        <div className="p-8 overflow-y-auto flex-grow space-y-8">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Status</p>
                                    <p className="text-lg font-black text-slate-900 capitalize flex items-center gap-2">
                                        {activeRestaurant.classification}
                                        <div className={`h-2 w-2 rounded-full ${activeRestaurant.classification === 'verified' ? 'bg-emerald-500' :
                                            activeRestaurant.classification === 'probable' ? 'bg-blue-500' : 'bg-orange-500'
                                            }`}></div>
                                    </p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Cuisine</p>
                                    <p className="text-lg font-black text-slate-900 line-clamp-1">{activeRestaurant.category}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h5 className="text-lg font-black tracking-tight flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                    Halal Evidence Found
                                </h5>
                                <div className="space-y-4">
                                    {activeRestaurant.halalReviews.map((rev, idx) => (
                                        <div key={idx} className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/50 relative">
                                            <p className="text-sm italic leading-relaxed text-slate-700">"{rev}"</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {activeRestaurant.description && (
                                <div className="space-y-3">
                                    <h5 className="text-sm font-black uppercase tracking-widest text-muted-foreground">About</h5>
                                    <p className="text-sm leading-relaxed text-slate-600 font-medium">{activeRestaurant.description}</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-slate-50 border-t flex gap-3">
                            <button className="flex-grow bg-primary text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:-translate-y-0.5 transition-all">
                                Get Directions
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="bg-slate-50 border-t py-12 mt-20 relative overflow-hidden">
                <div className="container mx-auto px-4 text-center text-muted-foreground relative z-10">
                    <div className="flex items-center justify-center gap-2 mb-6 opacity-40 grayscale">
                        <Utensils className="h-8 w-8" />
                        <h1 className="text-xl font-black tracking-tighter">NoorMaps</h1>
                    </div>
                    <p className="text-sm font-bold">© 2026 NoorMaps. Empowering the Muslim community.</p>
                    <div className="flex justify-center gap-4 mt-4 opacity-60">
                        <a href="#" className="hover:text-primary transition-colors">Privacy</a>
                        <a href="#" className="hover:text-primary transition-colors">Terms</a>
                        <a href="#" className="hover:text-primary transition-colors">Support</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
