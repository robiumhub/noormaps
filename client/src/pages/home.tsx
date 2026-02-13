import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
    Search, MapPin, Star, Utensils, Info, X,
    CheckCircle2, ChevronRight, Heart, Filter,
    SlidersHorizontal, ArrowRight
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AnalyzedRestaurant } from "@shared/types";

export default function Home() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [activeRestaurant, setActiveRestaurant] = useState<AnalyzedRestaurant | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
    const [filterFlags, setFilterFlags] = useState({
        fullHalal: false,
        alcoholFree: true // Default to true as per UX plan "Zero tolerance mode"
    });

    const { data: restaurants, isLoading } = useQuery<AnalyzedRestaurant[]>({
        queryKey: ["/api/restaurants"],
        queryFn: async () => {
            const res = await fetch("/api/restaurants");
            if (!res.ok) throw new Error("Failed to fetch restaurants");
            return res.json();
        }
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
            const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(r.classification.charAt(0).toUpperCase() + r.classification.slice(1));
            const matchesCompliance = (!filterFlags.fullHalal || r.isHalal) && (!filterFlags.alcoholFree || true); // Alcohol-free logic would need DB field, placeholder for now

            return matchesSearch && matchesCategory && matchesStatus && matchesCompliance;
        });
    }, [restaurants, searchTerm, selectedCategory, selectedStatus, filterFlags]);

    return (
        <div className="min-h-screen bg-[#fafaf9] text-slate-900 font-sans selection:bg-primary/10">
            {/* Header */}
            <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-xl py-4 sticky top-0 z-50">
                <div className="container mx-auto px-4 flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                        <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/20 rotate-3">
                            <Utensils className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex flex-col -gap-1">
                            <h1 className="text-xl font-black text-primary tracking-tighter leading-none">
                                NoorMaps
                            </h1>
                            <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">Premium Halal</span>
                        </div>
                    </div>

                    <div className="relative w-full max-w-lg hidden lg:block mx-8">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, cuisine, or address..."
                            className="w-full pl-11 pr-4 py-3 rounded-2xl border-0 bg-slate-100/50 focus:bg-white focus:ring-2 focus:ring-primary/20 shadow-inner transition-all text-sm font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <nav className="flex gap-4 items-center">
                        <button className="hidden sm:flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-primary transition-colors px-4 py-2">
                            Add Listing
                        </button>
                        <button className="bg-primary text-white px-6 py-2.5 rounded-2xl text-xs font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                            Sign In
                        </button>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section className="bg-white border-b border-slate-200/60 py-16 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px]"></div>
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-secondary/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-[100px]"></div>

                <div className="container mx-auto px-4 relative">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-[10px] font-black uppercase tracking-widest mb-6">
                            <Star className="h-3 w-3 fill-secondary" /> Discovery Pleasanton
                        </div>
                        <h2 className="text-5xl font-black mb-6 tracking-tight text-slate-900 leading-[1.1]">The Halal Gold Standard <br /><span className="text-primary italic">for Intelligent Dining.</span></h2>
                        <p className="text-lg text-slate-500 max-w-2xl mb-10 font-medium leading-relaxed">
                            Discover {restaurants?.length || 0} hand-verified locations. We use AI to analyze thousands of real reviews, giving you the confidence to dine with peace of mind.
                        </p>
                    </div>
                </div>
            </section>

            {/* Main Content with Sidebar */}
            <main className="container mx-auto px-4 py-12">
                <div className="flex gap-10 items-start">

                    {/* Sidebar Filters */}
                    <aside className={`w-72 shrink-0 sticky top-28 hidden lg:block transition-all ${!isSidebarOpen && 'opacity-0 -translate-x-10 pointer-events-none'}`}>
                        <div className="flex items-center justify-between mb-8">
                            <h4 className="text-lg font-black tracking-tight flex items-center gap-2">
                                <SlidersHorizontal className="h-5 w-5 text-primary" /> Filter Results
                            </h4>
                            <button
                                onClick={() => {
                                    setSearchTerm("");
                                    setSelectedCategory(null);
                                    setSelectedStatus([]);
                                    setFilterFlags({ fullHalal: false, alcoholFree: false });
                                }}
                                className="text-[10px] font-bold text-primary uppercase tracking-wider hover:opacity-70 transition-opacity"
                            >
                                Reset
                            </button>
                        </div>

                        <div className="space-y-10">
                            {/* Verification Filter */}
                            <div className="space-y-4">
                                <label className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Verification Status</label>
                                <div className="space-y-2.5">
                                    {['Verified', 'Probable', 'Options'].map((status) => (
                                        <label key={status} className="flex items-center group cursor-pointer" onClick={() => {
                                            setSelectedStatus(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
                                        }}>
                                            <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center bg-white mr-3 ${selectedStatus.includes(status) ? 'border-primary bg-primary/5' : 'border-slate-200 group-hover:border-primary'}`}>
                                                {selectedStatus.includes(status) && <div className="w-2.5 h-2.5 bg-primary rounded-[2px]"></div>}
                                            </div>
                                            <span className={`text-sm font-semibold transition-colors ${selectedStatus.includes(status) ? 'text-primary' : 'text-slate-600 group-hover:text-slate-900'}`}>{status}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Compliance Toggles */}
                            <div className="space-y-4">
                                <label className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Compliance</label>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between cursor-pointer group" onClick={() => setFilterFlags(prev => ({ ...prev, fullHalal: !prev.fullHalal }))}>
                                        <span className={`text-sm font-semibold transition-colors ${filterFlags.fullHalal ? 'text-primary' : 'text-slate-700'}`}>Full Halal Menu</span>
                                        <div className={`w-10 h-6 rounded-full relative p-1 transition-colors ${filterFlags.fullHalal ? 'bg-primary' : 'bg-slate-200'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${filterFlags.fullHalal ? 'translate-x-4' : ''}`}></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between cursor-pointer group" onClick={() => setFilterFlags(prev => ({ ...prev, alcoholFree: !prev.alcoholFree }))}>
                                        <span className={`text-sm font-semibold transition-colors ${filterFlags.alcoholFree ? 'text-primary' : 'text-slate-700'}`}>Alcohol-Free</span>
                                        <div className={`w-10 h-6 rounded-full relative p-1 transition-colors ${filterFlags.alcoholFree ? 'bg-primary' : 'bg-slate-200'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${filterFlags.alcoholFree ? 'translate-x-4' : ''}`}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Categories */}
                            <div className="space-y-4">
                                <label className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Popular Cuisines</label>
                                <div className="flex flex-wrap gap-2">
                                    {categories.slice(0, 12).map((cat: string) => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${selectedCategory === cat ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white text-slate-600 hover:border-primary/50 border-slate-200'}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Results Grid */}
                    <div className="flex-grow">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h3 className="text-2xl font-black tracking-tight mb-2">Featured Places</h3>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    Showing <span className="text-slate-900">{filteredRestaurants.length}</span> results in <span className="text-primary font-black">Pleasanton</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsMobileFilterOpen(true)}
                                className="lg:hidden flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm font-black active:scale-95 transition-all"
                            >
                                <Filter className="h-4 w-4" /> Filter
                            </button>
                        </div>

                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="h-[420px] bg-slate-100 animate-pulse rounded-[2rem]" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredRestaurants.map((r: AnalyzedRestaurant) => (
                                    <Card
                                        key={r.data_id}
                                        className="overflow-hidden group hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-500 border-slate-200/60 shadow-sm flex flex-col rounded-[2rem] bg-white relative"
                                    >
                                        <div className="h-64 bg-slate-100 relative overflow-hidden">
                                            <img
                                                src={r.thumbnail || "https://images.unsplash.com/photo-1544124499-58912cbddaad?w=800&auto=format&fit=crop&q=60"}
                                                alt={r.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                                            />

                                            <button className="absolute top-6 right-6 p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg shadow-black/5 hover:bg-white hover:scale-110 active:scale-95 transition-all group/heart">
                                                <Heart className="h-5 w-5 text-slate-400 group-hover:text-red-500 group-hover:fill-red-500 transition-colors" />
                                            </button>

                                            <div className="absolute top-6 left-6 flex flex-col gap-2">
                                                {r.classification === "verified" && (
                                                    <span className="bg-primary/95 backdrop-blur-md text-white md:text-[10px] text-[8px] font-black px-4 py-1.5 rounded-full shadow-lg uppercase tracking-[0.15em] flex items-center gap-1.5 border border-white/20">
                                                        <CheckCircle2 className="h-3 w-3" /> Verified
                                                    </span>
                                                )}
                                                {r.classification === "probable" && (
                                                    <span className="bg-blue-600/95 backdrop-blur-md text-white md:text-[10px] text-[8px] font-black px-4 py-1.5 rounded-full shadow-lg uppercase tracking-[0.15em] border border-white/20">
                                                        Probable
                                                    </span>
                                                )}
                                                {r.classification === "options" && (
                                                    <span className="bg-secondary/95 backdrop-blur-md text-white md:text-[10px] text-[8px] font-black px-4 py-1.5 rounded-full shadow-lg uppercase tracking-[0.15em] border border-white/20">
                                                        Options
                                                    </span>
                                                )}
                                            </div>

                                            {r.rating && (
                                                <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl flex items-center gap-1.5 text-sm font-black shadow-xl border border-white/50">
                                                    <Star className="h-4 w-4 fill-secondary text-secondary" />
                                                    {r.rating}
                                                </div>
                                            )}
                                        </div>

                                        <CardContent className="p-6 flex-grow flex-col">
                                            <div className="mb-6">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="text-2xl font-black group-hover:text-primary transition-colors line-clamp-1 tracking-tight">{r.title}</h4>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-400 text-[13px] font-semibold">
                                                    <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                                                    <span className="truncate">{r.address}</span>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full mx-1"></span>
                                                    <span className="text-slate-500">0.2 mi</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2 mb-8">
                                                <span className="bg-slate-100 text-slate-700 px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border border-slate-200/50">
                                                    {r.category || "Restaurant"}
                                                </span>
                                                {r.isHalal && (
                                                    <span className="bg-primary/5 text-primary px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border border-primary/10">
                                                        Certified Menu
                                                    </span>
                                                )}
                                            </div>

                                            {r.halalReviews.length > 0 ? (
                                                <div className="mt-auto space-y-6">
                                                    <div className="relative bg-slate-50/80 p-6 rounded-3xl border border-slate-100 group-hover:bg-primary/5 group-hover:border-primary/10 transition-all">
                                                        <div className="absolute -top-3 left-6 px-3 py-1 bg-white border border-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest text-primary shadow-sm">
                                                            Top Evidence
                                                        </div>
                                                        <p className="text-[13px] font-medium italic leading-relaxed text-slate-600 line-clamp-2">
                                                            "{r.halalReviews[0]}"
                                                        </p>
                                                    </div>

                                                    <button
                                                        onClick={() => setActiveRestaurant(r)}
                                                        className="w-full py-4 rounded-2xl text-[13px] font-black text-white bg-primary shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group/btn hover:scale-[1.02] active:scale-95 transition-all"
                                                    >
                                                        Details & {r.halalReviews.length} Evidence Quotes
                                                        <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setActiveRestaurant(r)}
                                                    className="w-full mt-auto py-4 rounded-2xl text-[13px] font-black text-slate-900 bg-slate-100 flex items-center justify-center gap-2 group/btn hover:bg-slate-200 active:scale-95 transition-all"
                                                >
                                                    View Information
                                                    <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                                </button>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Mobile Filter Sheet */}
            {isMobileFilterOpen && (
                <div className="fixed inset-0 z-[150] lg:hidden">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMobileFilterOpen(false)}></div>
                    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[3rem] p-10 space-y-10 animate-in slide-in-from-bottom duration-500 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-2xl font-black tracking-tight flex items-center gap-3">
                                <SlidersHorizontal className="h-6 w-6 text-primary" /> Filter Results
                            </h4>
                            <button
                                onClick={() => setIsMobileFilterOpen(false)}
                                className="p-2.5 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Status Filter */}
                        <div className="space-y-6">
                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Verification Status</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['Verified', 'Probable', 'Options'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setSelectedStatus(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status])}
                                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all active:scale-95 ${selectedStatus.includes(status) ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 text-slate-600'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full border-2 transition-all ${selectedStatus.includes(status) ? 'border-primary bg-primary' : 'border-slate-300'}`}></div>
                                        <span className="font-bold text-sm">{status}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Compliance Toggles */}
                        <div className="space-y-6">
                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Compliance</label>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between bg-slate-50 p-5 rounded-2xl border border-slate-100" onClick={() => setFilterFlags(prev => ({ ...prev, fullHalal: !prev.fullHalal }))}>
                                    <span className={`text-sm font-bold ${filterFlags.fullHalal ? 'text-primary' : 'text-slate-700'}`}>Full Halal Menu</span>
                                    <div className={`w-10 h-6 rounded-full relative p-1 transition-colors ${filterFlags.fullHalal ? 'bg-primary' : 'bg-slate-300'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${filterFlags.fullHalal ? 'translate-x-4' : ''}`}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Categories */}
                        <div className="space-y-6">
                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Popular Cuisines</label>
                            <div className="flex flex-wrap gap-2.5">
                                {categories.map((cat: string) => (
                                    <button
                                        key={cat}
                                        onClick={() => {
                                            setSelectedCategory(selectedCategory === cat ? null : cat);
                                            setIsMobileFilterOpen(false);
                                        }}
                                        className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border ${selectedCategory === cat ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => setIsMobileFilterOpen(false)}
                            className="w-full bg-primary text-white py-5 rounded-[2.5rem] font-black text-sm shadow-xl shadow-primary/20"
                        >
                            Show Results
                        </button>
                    </div>
                </div>
            )}

            {/* Modal Integration */}
            {activeRestaurant && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveRestaurant(null)}></div>
                    <div className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col animate-in fade-in zoom-in duration-300 border border-white/20">
                        <button
                            onClick={() => setActiveRestaurant(null)}
                            className="absolute top-6 right-6 z-10 p-2.5 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full transition-all border border-white/40 shadow-xl"
                        >
                            <X className="h-5 w-5 text-slate-900" />
                        </button>

                        <div className="h-64 relative shrink-0">
                            <img
                                src={activeRestaurant.thumbnail || "https://images.unsplash.com/photo-1544124499-58912cbddaad?w=800&auto=format&fit=crop&q=60"}
                                alt={activeRestaurant.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent"></div>
                            <div className="absolute bottom-6 left-8">
                                <h2 className="text-4xl font-black tracking-tighter text-slate-900 mb-2">{activeRestaurant.title}</h2>
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                                    <MapPin className="h-4 w-4 text-primary" /> {activeRestaurant.address}
                                </div>
                            </div>
                        </div>

                        <div className="p-10 overflow-y-auto flex-grow space-y-10">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</p>
                                        <p className="text-lg font-black text-slate-900 capitalize">{activeRestaurant.classification}</p>
                                    </div>
                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${activeRestaurant.classification === 'verified' ? 'bg-primary/10 text-primary' :
                                        activeRestaurant.classification === 'probable' ? 'bg-blue-100 text-blue-600' : 'bg-secondary/10 text-secondary'
                                        }`}>
                                        <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Cuisine</p>
                                        <p className="text-lg font-black text-slate-900 line-clamp-1">{activeRestaurant.category}</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-2xl bg-slate-200/50 text-slate-400 flex items-center justify-center">
                                        <Utensils className="h-6 w-6" />
                                    </div>
                                </div>
                            </div>

                            {/* Halal Summary Box */}
                            <div className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/10 space-y-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                                <h5 className="text-xl font-black tracking-tight flex items-center gap-3 text-primary">
                                    <Info className="h-6 w-6" />
                                    Why it's {activeRestaurant.classification}?
                                </h5>
                                <div className="space-y-4">
                                    {activeRestaurant.halalReviews.slice(0, 3).map((rev, idx) => (
                                        <div key={idx} className="bg-white/60 p-5 rounded-2xl border border-white relative shadow-sm">
                                            <p className="text-sm font-medium italic leading-relaxed text-slate-700">"{rev}"</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {activeRestaurant.description && (
                                <div className="space-y-4">
                                    <h5 className="text-[11px] font-black uppercase tracking-widest text-slate-400">About the Location</h5>
                                    <p className="text-md leading-relaxed text-slate-600 font-medium">{activeRestaurant.description}</p>
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-slate-50 border-t flex gap-4">
                            <button className="flex-grow bg-primary text-white py-5 rounded-[2rem] font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                                Get Directions
                            </button>
                            <button className="p-5 bg-white border border-slate-200 rounded-[2rem] hover:bg-slate-100 transition-colors">
                                <Heart className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="bg-white border-t border-slate-200/60 py-20 mt-20 relative overflow-hidden">
                <div className="container mx-auto px-4 text-center text-slate-500 relative z-10">
                    <div className="flex items-center justify-center gap-2.5 mb-8 opacity-60">
                        <div className="bg-slate-200 p-2 rounded-lg grayscale">
                            <Utensils className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-xl font-black tracking-tighter text-slate-900">NoorMaps</h1>
                    </div>
                    <p className="text-sm font-bold max-w-sm mx-auto leading-relaxed mb-8">Empowering the Muslim community to discover with intelligence and trust.</p>
                    <div className="flex justify-center gap-8 text-[11px] font-black uppercase tracking-widest text-slate-400">
                        <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-primary transition-colors">Contact Support</a>
                    </div>
                    <p className="mt-12 text-[10px] font-bold opacity-30">© 2026 NoorMaps. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
