import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, 
  HandCoins, 
  FileText, 
  TrendingUp,
  Users,
  IndianRupee,
  Clock
} from "lucide-react";
import jamaLogo from "@/assets/jama-logo.png";
import PaymentKeypad from "./PaymentKeypad";
import AddLoanModal from "./AddLoanModal";
import CollectionsList from "./CollectionsList";
import PendingBalanceList from "./PendingBalanceList";
import ActiveLoansList from "./ActiveLoansList";
import NewLoansToday from "./NewLoansToday";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'payment' | 'collections' | 'pending' | 'activeLoans' | 'newLoans'>('dashboard');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [showAddLoanModal, setShowAddLoanModal] = useState(false);
  const { toast } = useToast();
  
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

  return (
    <div className="min-h-screen bg-gradient-card p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="bg-gradient-money px-6 py-3 rounded-lg shadow-money flex items-center gap-3">
            <img src="/lovable-uploads/6931d901-421c-4070-833d-a383481866ec.png" alt="Wallet" className="h-8 w-8" />
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
              <IndianRupee className="h-5 w-5 text-success-foreground" />
              <TrendingUp className="h-4 w-4 text-success-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-success-foreground/80">నేటి వసూలు</p>
              <p className="text-lg font-bold text-success-foreground">
                ₹{todayStats.totalCollected.toLocaleString()}
              </p>
              <p className="text-xs text-success-foreground/60">
                {todaysCollections.length} వసూలు
              </p>
            </div>
          </div>
        </Card>

        <Card 
          className="p-4 shadow-card cursor-pointer hover:scale-105 transition-transform"
          onClick={handleViewPendingBalance}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Clock className="h-5 w-5 text-warning" />
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">బాకీ మొత్తం</p>
              <p className="text-lg font-bold text-foreground">
                ₹{todayStats.pendingBalance.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card 
          className="p-4 shadow-card cursor-pointer hover:scale-105 transition-transform"
          onClick={handleViewActiveLoans}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-xs text-success bg-success/10 px-2 py-1 rounded-full">
                క్రియాశీలం
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">క్రియాశీల లోన్‌లు</p>
              <p className="text-lg font-bold text-foreground">
                {todayStats.activeLoans}
              </p>
            </div>
          </div>
        </Card>

        <Card 
          className="p-4 shadow-card cursor-pointer hover:scale-105 transition-transform"
          onClick={handleViewNewLoans}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <PlusCircle className="h-5 w-5 text-primary" />
              <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                కొత్తది
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">నేడు కొత్తవి</p>
              <p className="text-lg font-bold text-foreground">
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

        <Button variant="report" size="xl" className="w-full">
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
  );
};

export default Dashboard;