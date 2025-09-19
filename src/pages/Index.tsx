import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "@/components/Dashboard";
import ActiveLoansList from "@/components/ActiveLoansList";
import PendingBalanceList from "@/components/PendingBalanceList";
import NewLoansToday from "@/components/NewLoansToday";
import AddLoanForm from "@/components/AddLoanForm";
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
import CustomerWiseReport from "@/components/CustomerWiseReport";
import { DeactivatedAccount } from "@/components/DeactivatedAccount";

const Index = () => {
  const { user, loading, userRole, userProfile } = useAuth();
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
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center overflow-hidden">
        <div className="text-center space-y-8 relative">
          {/* Animated background circles */}
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/10 rounded-full animate-pulse"></div>
          <div className="absolute -bottom-20 -right-20 w-32 h-32 bg-secondary/10 rounded-full animate-pulse delay-300"></div>
          
          {/* Logo animation */}
          <div className="relative">
            <div className="animate-scale-in">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-glow shadow-lg mb-4">
                <img 
                  src="/lovable-uploads/5687e4de-9f9a-4de1-8c5c-92952cc9cd45.png" 
                  alt="JAMA" 
                  className="w-16 h-16 object-contain animate-fade-in"
                />
              </div>
            </div>
            {/* Logo glow effect */}
            <div className="absolute inset-0 w-24 h-24 rounded-full bg-primary/20 animate-ping mx-auto"></div>
          </div>

          {/* App title animation */}
          <div className="animate-fade-in delay-500">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              JAMA
            </h1>
            <p className="text-lg text-muted-foreground">Daily Collection App</p>
          </div>

          {/* Loading animation */}
          <div className="animate-fade-in delay-700">
            <div className="w-48 h-2 bg-muted rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse w-3/4"></div>
            </div>
            <p className="text-sm text-muted-foreground mt-4 animate-pulse">Loading your dashboard...</p>
          </div>

          {/* Floating elements */}
          <div className="absolute top-10 right-10 w-6 h-6 bg-primary/20 rounded-full animate-bounce delay-200"></div>
          <div className="absolute bottom-10 left-10 w-4 h-4 bg-secondary/20 rounded-full animate-bounce delay-500"></div>
        </div>
      </div>
    );
  }

  if (!user && currentView === "login-prompt") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center p-4 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 bg-primary/5 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-secondary/5 rounded-full animate-pulse delay-300"></div>
          <div className="absolute top-1/2 left-10 w-16 h-16 bg-accent/5 rounded-full animate-pulse delay-500"></div>
        </div>

        <Card className="p-8 text-center max-w-md w-full animate-scale-in shadow-2xl border-0 bg-background/95 backdrop-blur-sm relative z-10">
          <div className="space-y-6">
            {/* Animated logo */}
            <div className="relative animate-fade-in">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-glow shadow-lg mb-4">
                <img 
                  src="/lovable-uploads/5687e4de-9f9a-4de1-8c5c-92952cc9cd45.png" 
                  alt="JAMA" 
                  className="w-14 h-14 object-contain"
                />
              </div>
              {/* Logo pulse effect */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-20 rounded-full bg-primary/20 animate-ping"></div>
            </div>

            {/* Animated text */}
            <div className="animate-fade-in delay-300">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                Welcome to JAMA
              </h1>
              <p className="text-muted-foreground mb-6">
                Please sign in to access your daily collection management dashboard
              </p>
            </div>

            {/* Animated button */}
            <div className="animate-fade-in delay-500">
              <Button 
                onClick={() => navigate("/login")} 
                className="w-full hover-scale shadow-lg"
                size="lg"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Sign In / Sign Up
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check if user account is deactivated
  if (userProfile && userProfile.is_active === false) {
    return <DeactivatedAccount />;
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
                <h1 className="text-3xl font-bold">Ad Notifications Management</h1>
              </div>
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Send Notifications About Ads</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button className="h-20">
                      📢 Notify All Users About New Ads
                    </Button>
                    <Button variant="outline" className="h-20">
                      🎯 Send Targeted Ad Notifications
                    </Button>
                    <Button variant="outline" className="h-20">
                      🔔 Highlight Important Ads at Login
                    </Button>
                    <Button variant="outline" className="h-20">
                      📱 Push Notification Settings
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Notification system is integrated with the ads database. Use these tools to send notifications to users about new advertisements and highlight important campaigns.
                  </p>
                </div>
              </Card>
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
      case "add-loan":
        return <AddLoanForm onBack={() => setCurrentView("dashboard")} />;
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
