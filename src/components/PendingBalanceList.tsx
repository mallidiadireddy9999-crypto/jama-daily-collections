import { ArrowLeft, Clock, IndianRupee, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

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
  
  // Mock data - this would come from your database
  const pendingBalances: PendingBalance[] = [
    {
      id: "1",
      customerId: "C001",
      customerName: "రాజేష్ కుమార్",
      pendingAmount: 15000,
      totalLoan: 50000,
      lastPayment: "2024-01-10",
      daysOverdue: 5
    },
    {
      id: "2",
      customerId: "C007",
      customerName: "సుధా రాణి",
      pendingAmount: 8500,
      totalLoan: 25000,
      lastPayment: "2024-01-12",
      daysOverdue: 3
    },
    {
      id: "3",
      customerId: "C015",
      customerName: "వేంకట రావు",
      pendingAmount: 12200,
      totalLoan: 40000,
      lastPayment: "2024-01-08",
      daysOverdue: 7
    },
    {
      id: "4",
      customerId: "C022",
      customerName: "లక్ష్మీ దేవి",
      pendingAmount: 6800,
      totalLoan: 30000,
      lastPayment: "2024-01-11",
      daysOverdue: 4
    },
    {
      id: "5",
      customerId: "C009",
      customerName: "కృష్ణ మూర్తి",
      pendingAmount: 5700,
      totalLoan: 20000,
      lastPayment: "2024-01-09",
      daysOverdue: 6
    }
  ];

  const totalPending = pendingBalances.reduce((sum, item) => sum + item.pendingAmount, 0);

  const getPriorityColor = (daysOverdue: number) => {
    if (daysOverdue >= 7) return "text-destructive";
    if (daysOverdue >= 4) return "text-warning";
    return "text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-gradient-card p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={onBack}>
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

      {/* Pending Balance List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">{t("బాకీ వివరాలు", "Pending Details")}</h2>
        
        {pendingBalances.length === 0 ? (
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

      {/* Quick Actions */}
      <div className="sticky bottom-4">
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              {t("మొత్తం బాకీ మొత్తం", "Total Pending Amount")}
            </p>
            <p className="text-2xl font-bold text-warning">
              ₹{totalPending.toLocaleString()}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PendingBalanceList;