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

const Dashboard = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'payment'>('dashboard');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  
  const todayStats = {
    totalCollected: 15750,
    pendingBalance: 48200,
    activeLoans: 12,
    newLoansToday: 3
  };

  const handleCollectPayment = () => {
    setCurrentView('payment');
    setSelectedCustomer('Customer'); // Default customer name
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const handlePaymentConfirm = (amount: number) => {
    // Handle payment confirmation logic here
    console.log(`Payment confirmed: ₹${amount} from ${selectedCustomer}`);
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

  return (
    <div className="min-h-screen bg-gradient-card p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="bg-gradient-money px-6 py-3 rounded-lg shadow-money">
            <h1 className="text-2xl font-bold text-primary-foreground">
              JAMA <span className="text-lg">జమ</span>
            </h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          ఇక పెన్ పేపర్ అవసరం లేదు
        </p>
        <p className="text-xs text-muted-foreground">
          No need for pen and paper anymore
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 shadow-card bg-gradient-success">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <IndianRupee className="h-5 w-5 text-success-foreground" />
              <TrendingUp className="h-4 w-4 text-success-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-success-foreground/80">Today's Collection</p>
              <p className="text-lg font-bold text-success-foreground">
                ₹{todayStats.totalCollected.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 shadow-card">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Clock className="h-5 w-5 text-warning" />
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Pending Balance</p>
              <p className="text-lg font-bold text-foreground">
                ₹{todayStats.pendingBalance.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 shadow-card">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-xs text-success bg-success/10 px-2 py-1 rounded-full">
                Active
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Active Loans</p>
              <p className="text-lg font-bold text-foreground">
                {todayStats.activeLoans}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 shadow-card">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <PlusCircle className="h-5 w-5 text-primary" />
              <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                New
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">New Today</p>
              <p className="text-lg font-bold text-foreground">
                {todayStats.newLoansToday}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        <Button variant="money" size="xl" className="w-full">
          <PlusCircle className="h-6 w-6 mr-3" />
          <div className="text-left">
            <p className="font-semibold">Add New Loan</p>
            <p className="text-xs opacity-90">కొత్త లోన్ జోడించండి</p>
          </div>
        </Button>

        <Button variant="collect" size="xl" className="w-full" onClick={handleCollectPayment}>
          <HandCoins className="h-6 w-6 mr-3" />
          <div className="text-left">
            <p className="font-semibold">Collect Payment</p>
            <p className="text-xs opacity-90">చెల్లింపు సేకరించండి</p>
          </div>
        </Button>

        <Button variant="report" size="xl" className="w-full">
          <FileText className="h-6 w-6 mr-3" />
          <div className="text-left">
            <p className="font-semibold">View Reports</p>
            <p className="text-xs opacity-90">రిపోర్ట్‌లు చూడండి</p>
          </div>
        </Button>
      </div>

      {/* Quick Summary */}
      <Card className="p-4 shadow-card bg-gradient-card">
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Today's Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Collections:</span>
              <span className="font-medium text-success">₹{todayStats.totalCollected.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending:</span>
              <span className="font-medium text-warning">₹{todayStats.pendingBalance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Loans:</span>
              <span className="font-medium text-primary">{todayStats.activeLoans}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;