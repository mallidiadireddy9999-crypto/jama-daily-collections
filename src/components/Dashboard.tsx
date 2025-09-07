import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarProvider } from "@/components/ui/sidebar";
import { 
  PlusCircle, 
  HandCoins, 
  FileText, 
  TrendingUp,
  Users,
  IndianRupee,
  Clock,
  LogOut,
  User,
  Menu
} from "lucide-react";
import jamaLogo from "@/assets/jama-logo.png";
import PaymentKeypad from "./PaymentKeypad";
import AddLoanModal from "./AddLoanModal";
import CollectionsList from "./CollectionsList";
import PendingBalanceList from "./PendingBalanceList";
import ActiveLoansList from "./ActiveLoansList";
import NewLoansToday from "./NewLoansToday";
import ReportsPage from "./ReportsPage";
import { AppSidebar } from "./AppSidebar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'payment' | 'collections' | 'pending' | 'activeLoans' | 'newLoans' | 'reports'>('dashboard');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [showAddLoanModal, setShowAddLoanModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    // Listen for sidebar navigation events
    const handleSidebarNavigate = (event: any) => {
      console.log("Received sidebarNavigate event:", event.detail);
      const view = event.detail;
      if (view === 'reports') {
        console.log("Setting current view to reports");
        setCurrentView('reports');
        setSidebarOpen(false);
      }
    };

    window.addEventListener('sidebarNavigate', handleSidebarNavigate);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('sidebarNavigate', handleSidebarNavigate);
    };
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "లోపం",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "విజయవంతంగా లాగ్ అవుట్ అయ్యారు",
        description: "వీడ్కోలు!",
      });
      navigate('/login');
    }
  };

  const handleSignIn = () => {
    navigate('/login');
  };
  
  const [todayStats, setTodayStats] = useState({
    totalCollected: 15750,
    pendingBalance: 48200,
    activeLoans: 12,
    newLoansToday: 3
  });

  const [todaysCollections, setTodaysCollections] = useState<Array<{
    id: string;
    customerId: string;
    customerName: string;
    amount: number;
    timestamp: string;
    time: string;
  }>>([]);

  const handleCollectPayment = () => {
    setCurrentView('payment');
    setSelectedCustomer('Customer'); // Default customer name
  };

  const handleAddNewLoan = () => {
    setShowAddLoanModal(true);
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleViewCollections = () => {
    setCurrentView('collections');
  };

  const handleViewPendingBalance = () => {
    setCurrentView('pending');
  };

  const handleViewActiveLoans = () => {
    setCurrentView('activeLoans');
  };

  const handleViewNewLoans = () => {
    setCurrentView('newLoans');
  };

  const handleViewReports = () => {
    setCurrentView('reports');
  };

  const handleLoanSave = (loan: any) => {
    // Update stats
    setTodayStats(prev => ({
      ...prev,
      activeLoans: prev.activeLoans + 1,
      newLoansToday: prev.newLoansToday + 1,
      pendingBalance: prev.pendingBalance + loan.amount
    }));

    // Show success toast
    toast({
      title: "లోన్ విజయవంతంగా జోడించబడింది! ✅",
      description: `${loan.customerName} కోసం ₹${loan.amount.toLocaleString()} లోన్ సృష్టించబడింది`,
      duration: 3000,
    });
  };

  const handlePaymentConfirm = (amount: number, customerId: string, customerName: string) => {
    setSelectedCustomer(customerName);
    const newCollection = {
      id: Date.now().toString(),
      customerId,
      customerName,
      amount,
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleTimeString('te-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    };

    // Add to today's collections
    setTodaysCollections(prev => [newCollection, ...prev]);

    // Update stats with received amount
    setTodayStats(prev => ({
      ...prev,
      totalCollected: prev.totalCollected + amount,
      pendingBalance: Math.max(0, prev.pendingBalance - amount)
    }));

    // Show success toast
    toast({
      title: "వసూలు విజయవంతంగా నమోదు చేయబడింది! ✅",
      description: `${customerName} (ID: ${customerId}) నుండి ₹${amount.toLocaleString()} వసూలైంది`,
      duration: 3000,
    });

    setCurrentView('dashboard');
  };

  if (currentView === 'payment') {
    return (
      <PaymentKeypad
        onBack={handleBackToDashboard}
        onConfirm={handlePaymentConfirm}
        customerName={selectedCustomer}
      />
    );
  }

  if (currentView === 'collections') {
    return (
      <CollectionsList
        onBack={handleBackToDashboard}
        collections={todaysCollections}
      />
    );
  }

  if (currentView === 'pending') {
    return (
      <PendingBalanceList
        onBack={handleBackToDashboard}
      />
    );
  }

  if (currentView === 'activeLoans') {
    return (
      <ActiveLoansList
        onBack={handleBackToDashboard}
      />
    );
  }

  if (currentView === 'newLoans') {
    return (
      <NewLoansToday
        onBack={handleBackToDashboard}
      />
    );
  }

  if (currentView === 'reports') {
    return (
      <ReportsPage
        onBack={handleBackToDashboard}
      />
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-card p-4 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-between items-center w-full mb-4">
            {/* Menu Button - positioned in top left */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-green-600 border-green-600 text-white hover:bg-green-700 hover:border-green-700 font-bold shadow-lg"
                  onClick={() => {
                    console.log("Menu button clicked, current state:", sidebarOpen);
                    console.log("Setting sidebar to open");
                    setSidebarOpen(true);
                  }}
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="left" 
                className="p-0 w-64"
                aria-describedby="sidebar-description"
              >
                <div className="sr-only">
                  <h2 id="sidebar-title">Navigation Menu</h2>
                  <p id="sidebar-description">Main navigation sidebar for the application</p>
                </div>
                <AppSidebar onClose={() => {
                  console.log("Closing sidebar");
                  setSidebarOpen(false);
                }} />
              </SheetContent>
            </Sheet>

            {/* Auth Button - positioned in top right */}
            {user ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                లాగ్ అవుట్
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignIn}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <User className="h-4 w-4 mr-2" />
                లాగిన్
              </Button>
            )}
          </div>

          <div className="flex justify-center">
            <div className="bg-gradient-money px-6 py-3 rounded-lg shadow-money flex items-center gap-3">
              <img src="/lovable-uploads/6931d901-421c-4070-833d-a383481866ec.png" alt="Wallet" className="h-12 w-12" />
              <h1 className="text-2xl font-bold text-primary-foreground">
                JAMA <span className="text-lg">చేయి</span>
              </h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            ఇక పెన్ పేపర్ అవసరం లేదు
          </p>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card 
          className="p-4 shadow-card bg-gradient-success cursor-pointer hover:scale-105 transition-transform"
          onClick={handleViewCollections}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <IndianRupee className="h-5 w-5 text-white" />
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-white/90 font-semibold">నేటి వసూలు</p>
              <p className="text-lg font-bold text-white">
                ₹{todayStats.totalCollected.toLocaleString()}
              </p>
              <p className="text-xs text-white/80 font-medium">
                {todaysCollections.length} వసూలు
              </p>
            </div>
          </div>
        </Card>

        <Card 
          className="p-4 shadow-card bg-gradient-success cursor-pointer hover:scale-105 transition-transform"
          onClick={handleViewPendingBalance}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Clock className="h-5 w-5 text-white" />
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-white/90 font-semibold">బాకీ మొత్తం</p>
              <p className="text-lg font-bold text-white">
                ₹{todayStats.pendingBalance.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card 
          className="p-4 shadow-card bg-gradient-success cursor-pointer hover:scale-105 transition-transform"
          onClick={handleViewActiveLoans}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-white" />
              <span className="text-xs text-white bg-white/20 px-2 py-1 rounded-full font-semibold">
                క్రియాశీలం
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-white/90 font-semibold">క్రియాశీల లోన్‌లు</p>
              <p className="text-lg font-bold text-white">
                {todayStats.activeLoans}
              </p>
            </div>
          </div>
        </Card>

        <Card 
          className="p-4 shadow-card bg-gradient-success cursor-pointer hover:scale-105 transition-transform"
          onClick={handleViewNewLoans}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <PlusCircle className="h-5 w-5 text-white" />
              <span className="text-xs text-white bg-white/20 px-2 py-1 rounded-full font-semibold">
                కొత్తది
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-white/90 font-semibold">నేడు కొత్తవి</p>
              <p className="text-lg font-bold text-white">
                {todayStats.newLoansToday}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        <Button variant="money" size="xl" className="w-full" onClick={handleAddNewLoan}>
          <PlusCircle className="h-6 w-6 mr-3" />
          <div className="text-left">
            <p className="font-semibold">కొత్త లోన్ జోడించండి</p>
          </div>
        </Button>

        <Button variant="collect" size="xl" className="w-full" onClick={handleCollectPayment}>
          <HandCoins className="h-6 w-6 mr-3" />
          <div className="text-left">
            <p className="font-semibold">వసూలు నమోదు చేయండి</p>
          </div>
        </Button>

        <Button variant="report" size="xl" className="w-full" onClick={handleViewReports}>
          <FileText className="h-6 w-6 mr-3" />
          <div className="text-left">
            <p className="font-semibold">రిపోర్ట్‌లు చూడండి</p>
          </div>
        </Button>
      </div>

      {/* Quick Summary */}
      <Card className="p-4 shadow-card bg-gradient-card">
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">నేటి సారాంశం</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">వసూలు:</span>
              <span className="font-medium text-success">₹{todayStats.totalCollected.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">బాకీ:</span>
              <span className="font-medium text-warning">₹{todayStats.pendingBalance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">క్రియాశీల లోన్‌లు:</span>
              <span className="font-medium text-primary">{todayStats.activeLoans}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Add Loan Modal */}
      <AddLoanModal
        open={showAddLoanModal}
        onOpenChange={setShowAddLoanModal}
        onSave={handleLoanSave}
      />
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;