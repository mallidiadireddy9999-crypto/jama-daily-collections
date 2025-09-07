import { ArrowLeft, PlusCircle, IndianRupee, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

interface NewLoan {
  id: string;
  customerId: string;
  customerName: string;
  loanAmount: number;
  dailyAmount: number;
  createdTime: string;
  phoneNumber: string;
}

interface NewLoansTodayProps {
  onBack: () => void;
}

const NewLoansToday = ({ onBack }: NewLoansTodayProps) => {
  const { t } = useLanguage();
  
  // Mock data - this would come from your database
  const newLoansToday: NewLoan[] = [
    {
      id: "L025",
      customerId: "C025",
      customerName: "అనిల్ కుమార్",
      loanAmount: 35000,
      dailyAmount: 400,
      createdTime: "10:30 AM",
      phoneNumber: "9876543210"
    },
    {
      id: "L026", 
      customerId: "C026",
      customerName: "రమా దేవి",
      loanAmount: 20000,
      dailyAmount: 250,
      createdTime: "02:15 PM",
      phoneNumber: "9123456789"
    },
    {
      id: "L027",
      customerId: "C027", 
      customerName: "విజయ్ కృష్ణ",
      loanAmount: 15000,
      dailyAmount: 200,
      createdTime: "04:45 PM",
      phoneNumber: "9988776655"
    }
  ];

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
        
        {newLoansToday.length === 0 ? (
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
                      <p className="text-xs text-muted-foreground">{t("లోన్ మొత్తం", "Loan Amount")}</p>
                      <div className="flex items-center space-x-1">
                        <IndianRupee className="h-4 w-4 text-primary" />
                        <p className="text-lg font-bold text-primary">
                          {loan.loanAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">{t("రోజువారీ చెల్లింపు", "Daily Payment")}</p>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-success" />
                        <p className="text-lg font-bold text-success">
                          ₹{loan.dailyAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">{t("వ్యవధి:", "Duration:")}</span>
                        <span className="ml-2 font-medium text-foreground">
                          {Math.ceil(loan.loanAmount / loan.dailyAmount)} {t("రోజులు", "days")}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t("రేట్:", "Rate:")}</span>
                        <span className="ml-2 font-medium text-foreground">
                          {Math.round(((loan.dailyAmount * Math.ceil(loan.loanAmount / loan.dailyAmount)) / loan.loanAmount - 1) * 100)}%
                        </span>
                      </div>
                    </div>
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