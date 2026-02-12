import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AdminPage from "@/pages/AdminPage";
import AdminRestaurantDetail from "@/pages/AdminRestaurantDetail";

function Router() {
    return (
        <Switch>
            <Route path="/" component={Home} />
            <Route path="/admin" component={AdminPage} />
            <Route path="/admin/restaurant/:id" component={AdminRestaurantDetail} />
            <Route component={NotFound} />
        </Switch>
    );
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Router />
            <Toaster />
        </QueryClientProvider>
    );
}

export default App;
