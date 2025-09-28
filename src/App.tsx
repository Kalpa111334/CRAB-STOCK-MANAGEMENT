import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import QualityControlDashboard from "./pages/dashboard/QualityControlDashboard";
import SaleDashboard from "./pages/dashboard/SaleDashboard";
import PurchasingDashboard from "./pages/dashboard/PurchasingDashboard";
import CreatePurchase from "./pages/CreatePurchase";
import PurchaseAnalytics from "./pages/PurchaseAnalytics";
import Stock from "./pages/Stock";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";
import SplashScreen from "./components/SplashScreen";
import { useState } from "react";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  const getDashboardRoute = () => {
    switch (user.role) {
      case 'admin':
        return '/admin';
      case 'quality_control':
        return '/quality-control';
      case 'purchasing':
        return '/dashboard/purchasing';
      case 'sale':
        return '/sale';
      default:
        return '/auth';
    }
  };

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to={getDashboardRoute()} replace />} />
        <Route path="/auth" element={<Navigate to={getDashboardRoute()} replace />} />
        
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/quality-control" 
          element={
            <ProtectedRoute allowedRoles={['quality_control', 'admin', 'purchasing']}>
              <QualityControlDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/dashboard/purchasing" 
          element={
            <ProtectedRoute allowedRoles={['purchasing', 'admin']}>
              <PurchasingDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/dashboard/sale" 
          element={
            <ProtectedRoute allowedRoles={['sale', 'admin']}>
              <SaleDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/sale" 
          element={
            <ProtectedRoute allowedRoles={['sale', 'admin']}>
              <SaleDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/create-purchase" 
          element={
            <ProtectedRoute allowedRoles={['purchasing', 'admin']}>
              <CreatePurchase />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/purchase-analytics" 
          element={
            <ProtectedRoute allowedRoles={['purchasing', 'admin']}>
              <PurchaseAnalytics />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/stock" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'quality_control', 'purchasing']}>
              <Stock />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/users" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Users />
            </ProtectedRoute>
          } 
        />
        
        <Route path="*" element={<Navigate to={getDashboardRoute()} replace />} />
      </Routes>
    </>
  );
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            {showSplash ? (
              <SplashScreen onComplete={handleSplashComplete} />
            ) : (
              <AppRoutes />
            )}
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
