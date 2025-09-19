import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { 
  PlusCircle, 
  HandCoins, 
  FileText, 
  TrendingUp,
  Users,
  IndianRupee,
  Clock,
  Edit,
} from "lucide-react";
import jamaLogo from "@/assets/jama-logo.png";
import PaymentKeypad from "./PaymentKeypad";
import { AdDisplay } from "./AdDisplay";
import { CoinFlowAnimation } from "./CoinFlowAnimation";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DashboardProps {
  onNavigate: (view: string) => void;
}

const Dashboard = ({ onNavigate }: DashboardProps) => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'payment'>('dashboard');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalCollected: 0,
    pendingBalance: 0,
    activeLoans: 0,
    newLoansToday: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch loans statistics
      const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select('amount, status, start_date')
        .eq('user_id', user.id);

      if (loansError) throw loansError;

      // Fetch collections statistics
      const { data: collections, error: collectionsError } = await supabase
        .from('collections')
        .select('amount, collection_date')
        .eq('user_id', user.id);

      if (collectionsError) throw collectionsError;

      // Calculate statistics
      const activeLoans = loans?.filter(loan => loan.status === 'active').length || 0;
      const totalLoanAmount = loans?.reduce((sum, loan) => sum + Number(loan.amount), 0) || 0;
      const totalCollected = collections?.reduce((sum, collection) => sum + Number(collection.amount), 0) || 0;
      const pendingBalance = totalLoanAmount - totalCollected;
      
      // Count today's new loans
      const today = new Date().toISOString().split('T')[0];
      const newLoansToday = loans?.filter(loan => loan.start_date === today).length || 0;

      // Show coin animation if total collected increased significantly
      const previousTotal = dashboardStats.totalCollected;
      if (totalCollected > previousTotal + 500) { // Show animation for increases > 500
        setShowCoinAnimation(true);
      }

      setDashboardStats({
        totalCollected,
        pendingBalance,
        activeLoans,
        newLoansToday
      });

    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: t("లోపం", "Error"),
        description: t("డేటా లోడ్ చేయడంలో లోపం", "Error loading data"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when user changes
  useEffect(() => {
    fetchDashboardStats();

    // Set up real-time subscription for loans
    if (user) {
      const channel = supabase
        .channel('dashboard-loans-realtime')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'loans',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Loan changed:', payload);
            // Refresh dashboard stats when any loan is modified
            fetchDashboardStats();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'collections',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Collection changed:', payload);
            // Refresh dashboard stats when any collection is modified
            fetchDashboardStats();
          }
        )
        .subscribe();

      // Cleanup subscription on unmount
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  // Refresh data when returning from other views
  useEffect(() => {
    if (currentView === 'dashboard') {
      fetchDashboardStats();
    }
  }, [currentView]);

  const handleCollectPayment = () => {
    setCurrentView('payment');
    setSelectedCustomer('Customer'); // Default customer name
  };

  const handleAddNewLoan = () => {
    onNavigate('add-loan');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleViewActiveLoans = () => {
    onNavigate('active-loans');
  };

  const handleViewPendingBalance = () => {
    onNavigate('pending-balance');
  };

  const handleViewNewLoans = () => {
    onNavigate('new-loans');
  };

  const handleViewCollections = () => {
    onNavigate('collections');
  };

  const handleViewReports = () => {
    onNavigate('reports');
  };

  const handleViewRecentCollections = () => {
    onNavigate('recent-collections');
  };

  if (currentView === 'payment') {
    return (
      <PaymentKeypad
        customerName={selectedCustomer}
        onBack={handleBackToDashboard}
        onConfirm={(amount, customerId, customerName) => {
          // Show celebration animation for large collections
          if (amount > 1000) {
            setShowCoinAnimation(true);
          }
          // Refresh dashboard stats after payment collection
          fetchDashboardStats();
          setCurrentView('dashboard');
        }}
      />
    );
  }

  return (
    <>
      {/* Coin Flow Animation for Dashboard */}
      <CoinFlowAnimation 
        isActive={showCoinAnimation}
        amount={dashboardStats.totalCollected}
        coinCount={10}
        onComplete={() => setShowCoinAnimation(false)}
      />
      
      <div className="min-h-screen bg-gradient-card">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <SidebarTrigger className="lg:hidden" />
            <div className="flex items-center space-x-3">
              <img src="/lovable-uploads/ff3ffabf-f0ae-4db2-b9ae-0144863bfcf6.png" alt="JAMA Logo" className="h-10 w-10 object-contain" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">JAMA</h1>
                <p className="text-sm text-muted-foreground">
                  {t("రోజువారీ వసూలు నిర్వహణ", "Daily Collection Management")}
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {t("స్వాగతం", "Welcome")}, {user?.email}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            className="p-4 cursor-pointer hover:shadow-lg transition-shadow bg-gradient-money text-primary-foreground"
            onClick={handleViewActiveLoans}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5" />
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold opacity-90">{t("క్రియాశీల లోన్‌లు", "Active Loans")}</p>
                <p className="text-2xl font-bold">{loading ? "..." : dashboardStats.activeLoans}</p>
                <p className="text-xs opacity-75">{t("మొత్తం లోన్‌లు", "Total loans")}</p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-4 cursor-pointer hover:shadow-lg transition-shadow bg-gradient-success text-white"
            onClick={handleViewCollections}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <IndianRupee className="h-5 w-5" />
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold opacity-90">{t("ఈ రోజు వసూలు", "Today's Collection")}</p>
                <p className="text-xl font-bold">₹{loading ? "..." : dashboardStats.totalCollected.toLocaleString()}</p>
                <p className="text-xs opacity-75">{t("మొత్తం వసూలైనది", "Total collected")}</p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-4 cursor-pointer hover:shadow-lg transition-shadow bg-gradient-warning text-white"
            onClick={handleViewPendingBalance}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Clock className="h-5 w-5" />
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold opacity-90">{t("బాకీ మొత్తం", "Pending Amount")}</p>
                <p className="text-xl font-bold">₹{loading ? "..." : dashboardStats.pendingBalance.toLocaleString()}</p>
                <p className="text-xs opacity-75">{t("చెల్లించాల్సినది", "To be collected")}</p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-4 cursor-pointer hover:shadow-lg transition-shadow bg-gradient-primary text-white"
            onClick={handleViewNewLoans}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <PlusCircle className="h-5 w-5" />
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold opacity-90">{t("ఈ రోజు కొత్త లోన్‌లు", "New Loans Today")}</p>
                <p className="text-2xl font-bold">{loading ? "..." : dashboardStats.newLoansToday}</p>
                <p className="text-xs opacity-75">{t("నేడు జోడించబడినవి", "Added today")}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Ad Display - Top Banner */}
        <AdDisplay position="top" maxAds={1} className="mb-4" />

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleCollectPayment}>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                <HandCoins className="h-6 w-6 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t("చెల్లింపు వసూలు", "Collect Payment")}</h3>
                <p className="text-sm text-muted-foreground">{t("నగదు వసూలు చేయండి", "Collect cash payments")}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleAddNewLoan}>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <PlusCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t("కొత్త లోన్", "New Loan")}</h3>
                <p className="text-sm text-muted-foreground">{t("కొత్త లోన్ జోడించండి", "Add a new loan")}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleViewRecentCollections}>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center">
                <Edit className="h-6 w-6 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t("ఇటీవలి వసూలు", "Recent Collections")}</h3>
                <p className="text-sm text-muted-foreground">{t("చెల్లింపులు సవరించండి", "Edit payments")}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleViewReports}>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-info/10 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-info" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t("రిపోర్ట్‌లు", "Reports")}</h3>
                <p className="text-sm text-muted-foreground">{t("వ్యాపార రిపోర్ట్‌లు చూడండి", "View business reports")}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Sidebar Ad Display - Only on larger screens to avoid collision */}
      <AdDisplay position="side" maxAds={2} />

    </div>
    </>
  );
};

export default Dashboard;