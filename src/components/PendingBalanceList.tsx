import { useState, useEffect } from "react";
import { ArrowLeft, Clock, IndianRupee, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AdDisplay } from "./AdDisplay";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PendingBalance {
  id: string;
  customerId: string;
  customerName: string;
  pendingAmount: number;
  totalLoan: number;
  lastPayment: string;
  daysOverdue: number;
}

interface PendingBalanceListProps {
  onBack: () => void;
}

const PendingBalanceList = ({ onBack }: PendingBalanceListProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingBalances, setPendingBalances] = useState<PendingBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  // Fetch pending balances from database
  const fetchPendingBalances = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get paginated data
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data: loans, error } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get collections for each loan to calculate pending amounts
      const loansWithPending = await Promise.all(
        (loans || []).map(async (loan) => {
          const { data: collections } = await supabase
            .from('collections')
            .select('amount, collection_date')
            .eq('loan_id', loan.id)
            .order('collection_date', { ascending: false });

          const paidAmount = collections?.reduce((sum, col) => sum + Number(col.amount), 0) || 0;
          const loanAmount = Number(loan.amount);
          const pendingAmount = loanAmount - paidAmount;
          
          // Calculate days overdue (rough calculation)
          const startDate = new Date(loan.start_date);
          const today = new Date();
          const expectedDays = loan.duration_months * 30;
          const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          const daysOverdue = Math.max(0, daysSinceStart - expectedDays);

          const lastPaymentDate = collections?.[0]?.collection_date || loan.start_date;

          return {
            id: loan.id,
            customerId: loan.customer_mobile || loan.id,
            customerName: loan.customer_name,
            pendingAmount: Math.max(0, pendingAmount),
            totalLoan: loanAmount,
            lastPayment: lastPaymentDate,
            daysOverdue
          };
        })
      );

      // Only show loans with pending amounts
      const filteredBalances = loansWithPending.filter(loan => loan.pendingAmount > 0);
      setPendingBalances(filteredBalances);
      setTotalCount(filteredBalances.length);
    } catch (error: any) {
      console.error('Error fetching pending balances:', error);
      toast({
        title: t("లోపం", "Error"),
        description: t("బాకీ డేటా లోడ్ చేయడంలో లోపం", "Error loading pending data"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingBalances();
  }, [user, currentPage]);

  const totalPending = pendingBalances.reduce((sum, item) => sum + item.pendingAmount, 0);

  const getPriorityColor = (daysOverdue: number) => {
    if (daysOverdue >= 7) return "text-destructive";
    if (daysOverdue >= 4) return "text-warning";
    return "text-muted-foreground";
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
          <h1 className="text-2xl font-bold text-foreground">{t("బాకీ మొత్తాలు", "Pending Balances")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("మొత్తం బాకీ:", "Total Pending:")} ₹{totalPending.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="p-4 bg-warning/10 border-warning/20">
        <div className="flex items-center space-x-3">
          <Clock className="h-6 w-6 text-warning" />
          <div>
            <p className="font-semibold text-foreground">{t("చెల్లింపు బకాయిలు", "Payment Dues")}</p>
            <p className="text-sm text-muted-foreground">
              {pendingBalances.length} {t("కస్టమర్లకు బాకీలు ఉన్నాయి", "customers have pending dues")}
            </p>
          </div>
        </div>
      </Card>

      {/* Ad Display - Bottom */}
      <AdDisplay position="bottom" maxAds={1} />

      {/* Pending Balance List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">{t("బాకీ వివరాలు", "Pending Details")}</h2>
        
        {loading ? (
          <Card className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-muted-foreground">{t("లోడ్ అవుతోంది...", "Loading...")}</p>
          </Card>
        ) : pendingBalances.length === 0 ? (
          <Card className="p-6 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{t("ఈ రోజు బాకీలు లేవు", "No pending dues today")}</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingBalances.map((balance) => (
              <Card key={balance.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-foreground">
                        {balance.customerName}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        (ID: {balance.customerId})
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center space-x-1">
                        <IndianRupee className="h-3 w-3 text-warning" />
                        <span className="text-muted-foreground">{t("బాకీ:", "Pending:")}</span>
                        <span className="font-bold text-warning">
                          ₹{balance.pendingAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-muted-foreground">{t("మొత్తం:", "Total:")}</span>
                        <span className="text-foreground">
                          ₹{balance.totalLoan.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{t("చివరి చెల్లింపు:", "Last Payment:")}</span>
                        <span className="text-foreground">{balance.lastPayment}</span>
                      </div>
                      <span className={`font-medium ${getPriorityColor(balance.daysOverdue)}`}>
                        {balance.daysOverdue} {t("రోజులు మించిపోయింది", "days overdue")}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalCount > pageSize && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {Array.from({ length: Math.ceil(totalCount / pageSize) }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => setCurrentPage(page)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / pageSize), p + 1))}
                className={currentPage === Math.ceil(totalCount / pageSize) ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      </div>
      
      {/* Sticky Summary Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg z-10">
        <div className="p-4">
          <div className="flex justify-between items-center max-w-6xl mx-auto">
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{t("ఓవర్‌డ్యూ కస్టమర్లు", "Overdue Customers")}</p>
                <p className="text-lg font-bold text-destructive">
                  {pendingBalances.filter(b => b.daysOverdue >= 7).length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{t("మొత్తం కస్టమర్లు", "Total Customers")}</p>
                <p className="text-lg font-bold text-primary">
                  {pendingBalances.length}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{t("యావరేజ్ బాకీ", "Average Pending")}</p>
                <p className="text-lg font-bold text-warning">
                  ₹{pendingBalances.length > 0 ? Math.round(totalPending / pendingBalances.length).toLocaleString() : 0}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{t("మొత్తం బాకీ", "Total Pending")}</p>
                <p className="text-lg font-bold text-warning">
                  ₹{totalPending.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingBalanceList;