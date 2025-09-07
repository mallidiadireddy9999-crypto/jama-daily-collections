import { useState, useEffect } from "react";
import { ArrowLeft, PlusCircle, IndianRupee, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface NewLoan {
  id: string;
  customerId: string;
  customerName: string;
  loanAmount: number;
  dailyAmount: number;
  createdTime: string;
  phoneNumber: string;
  // Enhanced fields for the new loan structure
  principalAmount: number;
  disbursedAmount: number;
  totalCollection: number;
  profitInterest: number;
  repaymentType: string;
  disbursementType: string;
  cuttingAmount: number;
}

interface NewLoansTodayProps {
  onBack: () => void;
}

const NewLoansToday = ({ onBack }: NewLoansTodayProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [newLoansToday, setNewLoansToday] = useState<NewLoan[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch today's new loans from database
  const fetchNewLoansToday = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const { data: loans, error } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user.id)
        .eq('start_date', today);

      if (error) throw error;

      const formattedLoans: NewLoan[] = (loans || []).map(loan => ({
        id: loan.id,
        customerId: loan.customer_mobile || loan.id,
        customerName: loan.customer_name,
        loanAmount: Number(loan.disbursed_amount || loan.amount), // Use disbursed amount if available
        dailyAmount: Number(loan.installment_amount) || Math.ceil(Number(loan.amount) / (loan.duration_months * 30)),
        createdTime: new Date(loan.created_at).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: true 
        }),
        phoneNumber: loan.customer_mobile || "N/A",
        // Additional fields for enhanced display
        principalAmount: Number(loan.amount),
        disbursedAmount: Number(loan.disbursed_amount || loan.amount),
        totalCollection: Number(loan.total_collection || 0),
        profitInterest: Number(loan.profit_interest || 0),
        repaymentType: loan.repayment_type || 'daily',
        disbursementType: loan.disbursement_type || 'full',
        cuttingAmount: Number(loan.cutting_amount || 0)
      }));

      setNewLoansToday(formattedLoans);
    } catch (error: any) {
      console.error('Error fetching new loans today:', error);
      toast({
        title: t("లోపం", "Error"),
        description: t("కొత్త లోన్ డేటా లోడ్ చేయడంలో లోపం", "Error loading new loan data"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewLoansToday();

    // Set up real-time subscription for new loans
    const channel = supabase
      .channel('new-loans-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'loans',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('New loan added:', payload);
          // Refresh the loans list when a new loan is inserted
          fetchNewLoansToday();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'loans',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Loan updated:', payload);
          // Refresh the loans list when a loan is updated
          fetchNewLoansToday();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const totalNewLoansAmount = newLoansToday.reduce((sum, loan) => sum + loan.loanAmount, 0);
  const totalDailyCollection = newLoansToday.reduce((sum, loan) => sum + loan.dailyAmount, 0);

  return (
    <div className="min-h-screen bg-gradient-card p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{t("నేడు కొత్త లోన్‌లు", "New Loans Today")}</h1>
          <p className="text-sm text-muted-foreground">
            {t(`ఈ రోజు ${newLoansToday.length} కొత్త లోన్‌లు జోడించబడ్డాయి`, `${newLoansToday.length} new loans added today`)}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 bg-primary/10 border-primary/20">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <IndianRupee className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">{t("మొత్తం రాశి", "Total Amount")}</span>
            </div>
            <p className="text-xl font-bold text-primary">
              ₹{totalNewLoansAmount.toLocaleString()}
            </p>
          </div>
        </Card>

        <Card className="p-4 bg-success/10 border-success/20">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <PlusCircle className="h-5 w-5 text-success" />
              <span className="text-sm text-muted-foreground">{t("రోజువారీ వసూలు", "Daily Collections")}</span>
            </div>
            <p className="text-xl font-bold text-success">
              ₹{totalDailyCollection.toLocaleString()}
            </p>
          </div>
        </Card>
      </div>

      {/* New Loans List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">{t("కొత్త లోన్‌ల వివరాలు", "New Loan Details")}</h2>
        
        {loading ? (
          <Card className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-muted-foreground">{t("లోడ్ అవుతోంది...", "Loading...")}</p>
          </Card>
        ) : newLoansToday.length === 0 ? (
          <Card className="p-6 text-center">
            <PlusCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{t("ఈ రోజు కొత్త లోన్‌లు లేవు", "No new loans today")}</p>
            <Button variant="outline" className="mt-3">
              {t("కొత్త లోన్ జోడించండి", "Add New Loan")}
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {newLoansToday.map((loan) => (
              <Card key={loan.id} className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-primary">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-foreground">
                          {loan.customerName}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t("కస్టమర్", "Customer")} ID: {loan.customerId} • {t("లోన్", "Loan")} ID: {loan.id}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        📞 {loan.phoneNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {t("కొత్తది", "New")}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {loan.createdTime}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">{t("ప్రిన్సిపల్ మొత్తం", "Principal Amount")}</p>
                      <div className="flex items-center space-x-1">
                        <IndianRupee className="h-4 w-4 text-primary" />
                        <p className="text-lg font-bold text-primary">
                          ₹{loan.principalAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">{t("డిస్బర్స్డ్ మొత్తం", "Disbursed Amount")}</p>
                      <div className="flex items-center space-x-1">
                        <IndianRupee className="h-4 w-4 text-success" />
                        <p className="text-lg font-bold text-success">
                          ₹{loan.disbursedAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Additional loan details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">{t("కిస్తు మొత్తం", "Installment Amount")}</p>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-warning" />
                        <p className="text-lg font-bold text-warning">
                          ₹{loan.dailyAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">{t("మొత్తం వసూలు", "Total Collection")}</p>
                      <div className="flex items-center space-x-1">
                        <IndianRupee className="h-4 w-4 text-primary" />
                        <p className="text-lg font-bold text-primary">
                          ₹{loan.totalCollection.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">{t("రకం:", "Type:")}</span>
                        <span className="ml-2 font-medium text-foreground">
                          {loan.disbursementType === 'full' ? t("పూర్తి", "Full") : t("కటింగ్", "Cutting")}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t("చెల్లింపు:", "Payment:")}</span>
                        <span className="ml-2 font-medium text-foreground">
                          {loan.repaymentType === 'daily' ? t("రోజువారీ", "Daily") : 
                           loan.repaymentType === 'weekly' ? t("వారానికి", "Weekly") : t("నెలకు", "Monthly")}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t("లాభం:", "Profit:")}</span>
                        <span className="ml-2 font-medium text-success">
                          ₹{loan.profitInterest.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Show cutting amount if applicable */}
                    {loan.disbursementType === 'cutting' && loan.cuttingAmount > 0 && (
                      <div className="mt-2 pt-2 border-t border-muted-foreground/20">
                        <div className="text-sm">
                          <span className="text-muted-foreground">{t("కటింగ్ మొత్తం:", "Cutting Amount:")}</span>
                          <span className="ml-2 font-medium text-warning">
                            ₹{loan.cuttingAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Today's Summary */}
      <div className="sticky bottom-4">
        <Card className="p-4 bg-gradient-money text-primary-foreground">
          <div className="text-center space-y-2">
            <p className="text-sm opacity-90">
              {t("ఈ రోజు మొత్తం కొత్త వ్యాపారం", "Today's Total New Business")}
            </p>
            <div className="flex justify-around">
              <div>
                <p className="text-xs opacity-75">{newLoansToday.length} {t("లోన్‌లు", "loans")}</p>
                <p className="text-xl font-bold">
                  ₹{totalNewLoansAmount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs opacity-75">{t("రోజువారీ వసూలు", "Daily Collections")}</p>
                <p className="text-xl font-bold">
                  ₹{totalDailyCollection.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default NewLoansToday;