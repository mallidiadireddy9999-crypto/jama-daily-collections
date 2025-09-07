import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Loan {
  id: string;
  customer_name: string;
  customer_mobile: string;
  amount: number;
  interest_rate: number;
  duration_months: number;
  start_date: string;
}

interface EditLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
  onLoanUpdated: () => void;
}

const EditLoanModal = ({ isOpen, onClose, loan, onLoanUpdated }: EditLoanModalProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    customerName: "",
    customerMobile: "",
    loanAmount: "",
    interestRate: "",
    durationMonths: "",
    startDate: new Date()
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (loan) {
      setFormData({
        customerName: loan.customer_name,
        customerMobile: loan.customer_mobile || "",
        loanAmount: loan.amount.toString(),
        interestRate: loan.interest_rate.toString(),
        durationMonths: loan.duration_months.toString(),
        startDate: new Date(loan.start_date)
      });
    }
  }, [loan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !loan) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('loans')
        .update({
          customer_name: formData.customerName,
          customer_mobile: formData.customerMobile,
          amount: parseFloat(formData.loanAmount),
          interest_rate: parseFloat(formData.interestRate),
          duration_months: parseInt(formData.durationMonths),
          start_date: formData.startDate.toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', loan.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: t("విజయవంతం", "Success"),
        description: t("లోన్ వివరాలు అప్‌డేట్ చేయబడ్డాయి", "Loan details updated successfully"),
      });

      onLoanUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error updating loan:', error);
      toast({
        title: t("లోపం", "Error"),
        description: t("లోన్ అప్‌డేట్ చేయడంలో లోపం", "Error updating loan"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("లోన్ వివరాలు సవరించండి", "Edit Loan Details")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">{t("కస్టమర్ పేరు", "Customer Name")}</Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) => handleInputChange("customerName", e.target.value)}
              placeholder={t("కస్టమర్ పేరు నమోదు చేయండి", "Enter customer name")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerMobile">{t("మొబైల్ నంబర్", "Mobile Number")}</Label>
            <Input
              id="customerMobile"
              type="tel"
              value={formData.customerMobile}
              onChange={(e) => handleInputChange("customerMobile", e.target.value)}
              placeholder={t("మొబైల్ నంబర్ నమోదు చేయండి", "Enter mobile number")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="loanAmount">{t("లోన్ మొత్తం (₹)", "Loan Amount (₹)")}</Label>
            <Input
              id="loanAmount"
              type="number"
              value={formData.loanAmount}
              onChange={(e) => handleInputChange("loanAmount", e.target.value)}
              placeholder={t("లోన్ మొత్తం నమోదు చేయండి", "Enter loan amount")}
              required
              min="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interestRate">{t("వడ్డీ రేటు (%)", "Interest Rate (%)")}</Label>
            <Input
              id="interestRate"
              type="number"
              step="0.1"
              value={formData.interestRate}
              onChange={(e) => handleInputChange("interestRate", e.target.value)}
              placeholder={t("వడ్డీ రేటు నమోదు చేయండి", "Enter interest rate")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="durationMonths">{t("వ్యవధి (నెలలు)", "Duration (Months)")}</Label>
            <Input
              id="durationMonths"
              type="number"
              value={formData.durationMonths}
              onChange={(e) => handleInputChange("durationMonths", e.target.value)}
              placeholder={t("వ్యవధి నమోదు చేయండి", "Enter duration")}
              min="1"
            />
          </div>

          <div className="space-y-2">
            <Label>{t("ప్రారంభ తేదీ", "Start Date")}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.startDate ? format(formData.startDate, "PPP") : <span>{t("తేదీ ఎంచుకోండి", "Pick a date")}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.startDate}
                  onSelect={(date) => date && setFormData(prev => ({ ...prev, startDate: date }))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              {t("రద్దు చేయండి", "Cancel")}
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? t("అప్‌డేట్ అవుతోంది...", "Updating...") : t("అప్‌డేట్ చేయండి", "Update")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditLoanModal;