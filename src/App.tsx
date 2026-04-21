
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import YandexCallback from "./pages/YandexCallback";
import { WbLayout } from "./components/wb/WbLayout";
import WbIntro from "./pages/wb/WbIntro";
import WbDashboard from "./pages/wb/WbDashboard";
import WbSales from "./pages/wb/WbSales";
import WbProducts from "./pages/wb/WbProducts";
import WbAds from "./pages/wb/WbAds";
import WbForecast from "./pages/wb/WbForecast";
import WbInsights from "./pages/wb/WbInsights";
import WbSettings from "./pages/wb/WbSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth/yandex/callback" element={<YandexCallback />} />
          <Route path="/wb" element={<WbLayout />}>
            <Route index element={<WbIntro />} />
            <Route path="dashboard" element={<WbDashboard />} />
            <Route path="sales" element={<WbSales />} />
            <Route path="products" element={<WbProducts />} />
            <Route path="ads" element={<WbAds />} />
            <Route path="forecast" element={<WbForecast />} />
            <Route path="insights" element={<WbInsights />} />
            <Route path="settings" element={<WbSettings />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;