import { ArrowLeft, Users, IndianRupee, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

interface ActiveLoan {
  id: string;
  customerId: string;
  customerName: string;
  loanAmount: number;
  paidAmount: number;
  pendingAmount: number;
  startDate: string;
  dailyAmount: number;
  status: 'active' | 'completed' | 'overdue';
}

interface ActiveLoansListProps {
  onBack: () => void;
}

const ActiveLoansList = ({ onBack }: ActiveLoansListProps) => {
  const { t } = useLanguage();
  
  // Mock data - this would come from your database
  const activeLoans: ActiveLoan[] = [
    {
      id: "L001",
      customerId: "C001",
      customerName: "Rajesh Kumar",
      loanAmount: 50000,
      paidAmount: 35000,
      pendingAmount: 15000,
      startDate: "2023-12-01",
      dailyAmount: 500,
      status: 'active'
    },
    {
      id: "L007",
      customerId: "C007",
      customerName: "Sudha Rani",
      loanAmount: 25000,
      paidAmount: 16500,
      pendingAmount: 8500,
      startDate: "2023-12-15",
      dailyAmount: 300,
      status: 'active'
    },
    {
      id: "L015",
      customerId: "C015",
      customerName: "Venkat Rao",
      loanAmount: 40000,
      paidAmount: 27800,
      pendingAmount: 12200,
      startDate: "2023-11-20",
      dailyAmount: 400,
      status: 'overdue'
    },
    {
      id: "L022",
      customerId: "C022",
      customerName: "Lakshmi Devi",
      loanAmount: 30000,
      paidAmount: 23200,
      pendingAmount: 6800,
      startDate: "2024-01-05",
      dailyAmount: 350,
      status: 'active'
    }
  ];

  const totalActiveAmount = activeLoans.reduce((sum, loan) => sum + loan.loanAmount, 0);
  const totalCollected = activeLoans.reduce((sum, loan) => sum + loan.paidAmount, 0);
  const totalPending = activeLoans.reduce((sum, loan) => sum + loan.pendingAmount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return "text-success bg-success/10";
      case 'overdue': return "text-destructive bg-destructive/10";
      case 'completed': return "text-primary bg-primary/10";
      default: return "text-muted-foreground bg-muted/10";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return t("క్రియాశీలం", "Active");
      case 'overdue': return t("మించిపోయింది", "Overdue");
      case 'completed': return t("పూర్తైంది", "Completed");
      default: return t("తెలియదు", "Unknown");
    }
  };

  const getProgressPercentage = (paid: number, total: number) => {
    return Math.round((paid / total) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-card p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{t("క్రియాశీల లోన్‌లు", "Active Loans")}</h1>
          <p className="text-sm text-muted-foreground">
            {t(`మొత్తం ${activeLoans.length} లోన్‌లు క్రియాశీలంగా ఉన్నాయి`, `Total ${activeLoans.length} loans are active`)}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <IndianRupee className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">{t("మొత్తం రాశి", "Total Amount")}</p>
          <p className="text-sm font-bold text-foreground">
            ₹{totalActiveAmount.toLocaleString()}
          </p>
        </Card>
        
        <Card className="p-3 text-center bg-success/10">
          <TrendingUp className="h-5 w-5 text-success mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">{t("వసూలైనది", "Collected")}</p>
          <p className="text-sm font-bold text-success">
            ₹{totalCollected.toLocaleString()}
          </p>
        </Card>
        
        <Card className="p-3 text-center bg-warning/10">
          <Users className="h-5 w-5 text-warning mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">{t("బాకీ", "Pending")}</p>
          <p className="text-sm font-bold text-warning">
            ₹{totalPending.toLocaleString()}
          </p>
        </Card>
      </div>

      {/* Active Loans List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">{t("లోన్ వివరాలు", "Loan Details")}</h2>
        
        {activeLoans.length === 0 ? (
          <Card className="p-6 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{t("క్రియాశీల లోన్‌లు లేవు", "No active loans")}</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeLoans.map((loan) => {
              const progress = getProgressPercentage(loan.paidAmount, loan.loanAmount);
              
              return (
                <Card key={loan.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {loan.customerName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          ID: {loan.customerId} • {t("లోన్", "Loan")} ID: {loan.id}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(loan.status)}`}>
                        {getStatusText(loan.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">{t("మొత్తం రాశి", "Total Amount")}</p>
                        <p className="font-bold text-foreground">
                          ₹{loan.loanAmount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t("రోజువారీ", "Daily")}</p>
                        <p className="font-bold text-primary">
                          ₹{loan.dailyAmount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t("వసూలైనది", "Collected")}</p>
                        <p className="font-bold text-success">
                          ₹{loan.paidAmount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t("బాకీ", "Pending")}</p>
                        <p className="font-bold text-warning">
                          ₹{loan.pendingAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("పురోగతి", "Progress")}</span>
                        <span className="font-medium text-foreground">{progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-gradient-success h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{t("ప్రారంభ తేదీ:", "Start Date:")}</span>
                        <span className="text-foreground">{loan.startDate}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="sticky bottom-4">
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">
              {activeLoans.length} {t("క్రియాశీల లోన్‌లు", "active loans")}
            </p>
            <div className="flex justify-around">
              <div>
                <p className="text-xs text-muted-foreground">{t("వసూలు రేట్", "Collection Rate")}</p>
                <p className="text-lg font-bold text-success">
                  {Math.round((totalCollected / totalActiveAmount) * 100)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("బాకీ మొత్తం", "Pending Amount")}</p>
                <p className="text-lg font-bold text-warning">
                  ₹{totalPending.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ActiveLoansList;