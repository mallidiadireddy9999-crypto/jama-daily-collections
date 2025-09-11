import { useState, useEffect } from "react";
import { ArrowLeft, Users, IndianRupee, Calendar, TrendingUp, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import EditLoanModal from "./EditLoanModal";

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
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);

  // Fetch active loans from database
  const fetchActiveLoans = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data: loans, error } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;

      // Get collections for each loan to calculate paid/pending amounts
      const loansWithStats = await Promise.all(
        (loans || []).map(async (loan) => {
          const { data: collections } = await supabase
            .from('collections')
            .select('amount')
            .eq('loan_id', loan.id);

          const paidAmount = collections?.reduce((sum, col) => sum + Number(col.amount), 0) || 0;
          const loanAmount = Number(loan.amount);
          const pendingAmount = loanAmount - paidAmount;

          return {
            id: loan.id,
            customerId: loan.customer_mobile || loan.id,
            customerName: loan.customer_name,
            loanAmount,
            paidAmount,
            pendingAmount: Math.max(0, pendingAmount),
            startDate: loan.start_date,
            dailyAmount: Math.ceil(loanAmount / (loan.duration_months * 30)), // Rough daily calculation
            status: (pendingAmount <= 0 ? 'completed' : 'active') as 'active' | 'completed' | 'overdue'
          };
        })
      );

      setActiveLoans(loansWithStats);
    } catch (error: any) {
      console.error('Error fetching active loans:', error);
      toast({
        title: t("లోపం", "Error"),
        description: t("లోన్ డేటా లోడ్ చేయడంలో లోపం", "Error loading loan data"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveLoans();
  }, [user]);

  // Calculate totals from fetched data
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
    <div className="min-h-screen bg-gradient-card pb-24">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="default" size="icon" onClick={onBack} className="shadow-lg">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{t("క్రియాశీల లోన్‌లు", "Active Loans")}</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? t("లోడ్ అవుతోంది...", "Loading...") : t(`మొత్తం ${activeLoans.length} లోన్‌లు క్రియాశీలంగా ఉన్నాయి`, `Total ${activeLoans.length} loans are active`)}
          </p>
        </div>
      </div>

        {/* Quick Overview */}
        <Card className="p-4 bg-muted/50">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground mb-2">{t("క్రియాశీల లోన్‌ల సారాంశం", "Active Loans Overview")}</h2>
            <p className="text-sm text-muted-foreground">
              {activeLoans.length} {t("లోన్‌లు క్రియాశీలంగా ఉన్నాయి", "active loans")}
            </p>
          </div>
        </Card>

      {/* Active Loans List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">{t("లోన్ వివరాలు", "Loan Details")}</h2>
        
        {loading ? (
          <Card className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-muted-foreground">{t("లోడ్ అవుతోంది...", "Loading...")}</p>
          </Card>
        ) : activeLoans.length === 0 ? (
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
                          ID: {loan.customerId} • {t("లోన్", "Loan")} ID: {loan.id.slice(0, 8)}...
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(loan.status)}`}>
                          {getStatusText(loan.status)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingLoanId(loan.id)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
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

      </div>
      
      {/* Sticky Summary Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg z-10">
        <div className="p-4">
          <div className="flex justify-between items-center max-w-6xl mx-auto">
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{t("వసూలు రేట్", "Collection Rate")}</p>
                <p className="text-lg font-bold text-success">
                  {totalActiveAmount > 0 ? Math.round((totalCollected / totalActiveAmount) * 100) : 0}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{t("మొత్తం లోన్‌లు", "Total Loans")}</p>
                <p className="text-lg font-bold text-primary">
                  ₹{totalActiveAmount.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{t("వసూలైనది", "Collected")}</p>
                <p className="text-lg font-bold text-success">
                  ₹{totalCollected.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{t("బాకీ మొత్తం", "Pending Amount")}</p>
                <p className="text-lg font-bold text-warning">
                  ₹{totalPending.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditLoanModal
        isOpen={!!editingLoanId}
        onClose={() => setEditingLoanId(null)}
        loanId={editingLoanId}
        onLoanUpdated={() => {
          fetchActiveLoans();
          setEditingLoanId(null);
        }}
      />
    </div>
  );
};

export default ActiveLoansList;