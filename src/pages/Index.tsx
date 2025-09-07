import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "@/components/Dashboard";
import ActiveLoansList from "@/components/ActiveLoansList";
import PendingBalanceList from "@/components/PendingBalanceList";
import NewLoansToday from "@/components/NewLoansToday";
import CollectionsList from "@/components/CollectionsList";
import RecentCollectionsList from "@/components/RecentCollectionsList";
import ReportsPage from "@/components/ReportsPage";
import { SuperAdminDashboard } from "@/components/SuperAdminDashboard";
import { UserManagement } from "@/components/UserManagement";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogIn, ArrowLeft } from "lucide-react";
import { AdsManagement } from "@/components/AdsManagement";

const Index = () => {
  const { user, loading, userRole } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<string>("dashboard");

  useEffect(() => {
    console.log('Index useEffect - user:', user, 'loading:', loading, 'userRole:', userRole, 'currentView:', currentView);
    
    if (!loading && !user) {
      console.log('Setting currentView to login-prompt');
      setCurrentView("login-prompt");
    }
    // Don't reset currentView when user exists - let navigation handle it
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
                src="/lovable-uploads/5687e4de-9f9a-4de1-8c5c-92952cc9cd45.png" 
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
    // Super Admin Views
    if (userRole === 'super_admin') {
      switch (currentView) {
        case "dashboard":
          return <SuperAdminDashboard onNavigate={setCurrentView} />;
        case "user-management":
          return <UserManagement onBack={() => setCurrentView("dashboard")} />;
        case "user-reports":
          return <UserManagement onBack={() => setCurrentView("dashboard")} />;
        case "ads-management":
          return <AdsManagement onBack={() => setCurrentView("dashboard")} />;
        case "notifications":
          return (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => setCurrentView("dashboard")} className="p-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-3xl font-bold">Notifications</h1>
              </div>
              <div className="p-6 text-center">Notifications feature coming soon...</div>
            </div>
          );
        default:
          return <SuperAdminDashboard onNavigate={setCurrentView} />;
      }
    }

    // Jama User Views (existing functionality)
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
        <AppSidebar onNavigate={setCurrentView} userRole={userRole} />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header with sidebar trigger */}
          <header className="h-12 flex items-center border-b bg-background px-4 shrink-0">
            <SidebarTrigger />
            <div className="ml-4 font-semibold">
              {userRole === 'super_admin' ? 'Jama - Super Admin Panel' : 'Jama - Daily Collection'}
            </div>
          </header>
          {/* Main content */}
          <main className="flex-1 overflow-auto p-6">
            {renderCurrentView()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
