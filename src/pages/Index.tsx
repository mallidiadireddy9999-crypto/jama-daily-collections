import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "@/components/Dashboard";
import ActiveLoansList from "@/components/ActiveLoansList";
import PendingBalanceList from "@/components/PendingBalanceList";
import NewLoansToday from "@/components/NewLoansToday";
import CollectionsList from "@/components/CollectionsList";
import RecentCollectionsList from "@/components/RecentCollectionsList";
import ReportsPage from "@/components/ReportsPage";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogIn } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<string>("dashboard");

  useEffect(() => {
    if (!loading && !user) {
      // Show login prompt instead of redirecting immediately
      setCurrentView("login-prompt");
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-card flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && currentView === "login-prompt") {
    return (
      <div className="min-h-screen bg-gradient-card flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md w-full">
          <div className="space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
              <img 
                src="/lovable-uploads/ff3ffabf-f0ae-4db2-b9ae-0144863bfcf6.png" 
                alt="JAMA" 
                className="w-16 h-16 object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Welcome to JAMA</h1>
              <p className="text-muted-foreground mb-6">
                Please sign in to access your daily collection management dashboard
              </p>
            </div>
            <Button 
              onClick={() => navigate("/auth")} 
              className="w-full"
              size="lg"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Sign In / Sign Up
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case "active-loans":
        return <ActiveLoansList onBack={() => setCurrentView("dashboard")} />;
      case "pending-balance":
        return <PendingBalanceList onBack={() => setCurrentView("dashboard")} />;
      case "new-loans":
        return <NewLoansToday onBack={() => setCurrentView("dashboard")} />;
      case "collections":
        return <CollectionsList onBack={() => setCurrentView("dashboard")} collections={[]} />;
      case "recent-collections":
        return <RecentCollectionsList onBack={() => setCurrentView("dashboard")} />;
      case "reports":
        return <ReportsPage onBack={() => setCurrentView("dashboard")} />;
      default:
        return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar onNavigate={setCurrentView} />
        <div className="flex-1 overflow-auto">
          {renderCurrentView()}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
