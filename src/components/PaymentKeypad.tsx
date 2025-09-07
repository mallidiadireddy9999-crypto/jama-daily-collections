import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Check, Mic, Delete, IndianRupee, User, Search, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface PaymentKeypadProps {
  onBack: () => void;
  onConfirm: (amount: number, customerId: string, customerName: string) => void;
  customerName?: string;
}

const PaymentKeypad = ({ onBack, onConfirm, customerName = "Customer" }: PaymentKeypadProps) => {
  const [amount, setAmount] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [customerNotFound, setCustomerNotFound] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();

  // Function to fetch customer data by ID or Name
  const fetchCustomerData = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSelectedCustomerName('');
      setCustomerNotFound(false);
      return;
    }

    setIsLoadingCustomer(true);
    setCustomerNotFound(false);

    try {
      // Check if search term looks like a UUID (for loan ID search)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchTerm);
      
      let query = supabase
        .from('loans')
        .select('customer_name, customer_mobile, id');

      // Build the search query based on search term type
      if (isUUID) {
        // If it's a UUID, search by ID, mobile, and name
        query = query.or(`id.eq.${searchTerm},customer_mobile.eq.${searchTerm},customer_name.ilike.%${searchTerm}%`);
      } else {
        // If it's not a UUID, only search by mobile and name (safer)
        query = query.or(`customer_mobile.eq.${searchTerm},customer_name.ilike.%${searchTerm}%`);
      }

      const { data: loans, error } = await query.limit(5);

      if (error) {
        console.error('Error fetching customer:', error);
        toast({
          title: t("లోపం", "Error"),
          description: t("కస్టమర్ డేటా తెచ్చడంలో లోపం", "Error fetching customer data"),
          variant: "destructive",
        });
        return;
      }

      if (loans && loans.length > 0) {
        // If exact match found (by ID or mobile), use first result
        const exactMatch = loans.find(loan => 
          loan.customer_mobile === searchTerm || 
          loan.id === searchTerm
        );
        
        if (exactMatch) {
          setSelectedCustomerName(exactMatch.customer_name);
          setCustomerId(exactMatch.customer_mobile || exactMatch.id);
        } else {
          // For name search, use first result
          setSelectedCustomerName(loans[0].customer_name);
          setCustomerId(loans[0].customer_mobile || loans[0].id);
        }
        
        setCustomerNotFound(false);
        toast({
          title: t("కస్టమర్ దొరికాడు", "Customer Found"),
          description: `${loans[0].customer_name}`,
        });
      } else {
        setSelectedCustomerName('');
        setCustomerNotFound(true);
        toast({
          title: t("కస్టమర్ దొరకలేదు", "Customer Not Found"),
          description: t("ఈ పేరు లేదా ID తో కస్టమర్ దొరకలేదు", "No customer found with this name or ID"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setSelectedCustomerName('');
      setCustomerNotFound(true);
      toast({
        title: t("లోపం", "Error"),
        description: t("కస్టమర్ వెతకడంలో లోపం", "Error searching for customer"),
        variant: "destructive",
      });
    } finally {
      setIsLoadingCustomer(false);
    }
  };

  // Auto-fetch when search term changes
  useEffect(() => {
    const delayedFetch = setTimeout(() => {
      if (customerId.length >= 2) { // Search when at least 2 characters for names
        fetchCustomerData(customerId);
      } else {
        setSelectedCustomerName('');
        setCustomerNotFound(false);
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(delayedFetch);
  }, [customerId]);

  const quickAmounts = [100, 500, 1000];

  const handleNumberPress = (num: string) => {
    if (amount.length < 8) { // Limit to reasonable amount
      setAmount(amount + num);
    }
  };

  const handleQuickAmount = (value: number) => {
    const currentAmount = parseInt(amount) || 0;
    setAmount((currentAmount + value).toString());
  };

  const handleClear = () => {
    setAmount('');
  };

  const handleBackspace = () => {
    setAmount(amount.slice(0, -1));
  };

  const handleConfirm = async () => {
    const finalAmount = parseInt(amount) || 0;
    if (finalAmount <= 0 || !customerId.trim() || !selectedCustomerName.trim()) {
      toast({
        title: t("లోపం", "Error"),
        description: t("దయచేసి అన్ని వివరాలను నమోదు చేయండి", "Please fill all details"),
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: t("లోపం", "Error"),
        description: t("దయచేసి లాగిన్ చేయండి", "Please login first"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Find the loan to get loan_id
      const { data: loans, error: loanError } = await supabase
        .from('loans')
        .select('id')
        .eq('user_id', user.id)
        .or(`customer_mobile.eq.${customerId},customer_name.ilike.%${selectedCustomerName}%`)
        .limit(1);

      if (loanError) {
        throw loanError;
      }

      if (!loans || loans.length === 0) {
        toast({
          title: t("లోపం", "Error"),
          description: t("ఈ కస్టమర్ కు లోన్ దొరకలేదు", "No loan found for this customer"),
          variant: "destructive",
        });
        return;
      }

      // Save collection to database
      const { error: collectionError } = await supabase
        .from('collections')
        .insert({
          user_id: user.id,
          loan_id: loans[0].id,
          amount: finalAmount,
          notes: `Collection from ${selectedCustomerName} (${customerId})`
        });

      if (collectionError) {
        throw collectionError;
      }

      toast({
        title: t("విజయం", "Success"),
        description: t(`₹${finalAmount} ${selectedCustomerName} నుండి విజయవంతంగా వసూలు చేయబడింది`, `₹${finalAmount} collected successfully from ${selectedCustomerName}`),
      });

      // Call original onConfirm for any additional handling
      onConfirm(finalAmount, customerId.trim(), selectedCustomerName.trim());

    } catch (error: any) {
      console.error('Error saving collection:', error);
      toast({
        title: t("లోపం", "Error"),
        description: error.message || t("వసూలు సేవ్ చేయడంలో లోపం", "Error saving collection"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatAmount = (amt: string) => {
    const num = parseInt(amt) || 0;
    return num.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-card p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{t("వసూలు నమోదు", "Record Collection")}</h1>
        </div>
      </div>

      {/* Customer Selection */}
      <Card className="p-4 shadow-card">
        <div className="space-y-3">
          <Label htmlFor="customerId" className="flex items-center gap-2 text-sm font-medium">
            <User className="h-4 w-4" />
            {t("కస్టమర్ ID లేదా పేరు", "Customer ID or Name")}
          </Label>
          <div className="relative">
            <Input
              id="customerId"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder={t("కస్టమర్ పేరు లేదా ID లేదా మొబైల్", "Customer Name, ID or Mobile Number")}
              className="h-11 pr-10"
            />
            {isLoadingCustomer && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Search className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          
          {/* Auto-fetched Customer Name Display */}
          {selectedCustomerName && (
            <div className="bg-success/10 border border-success/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-success" />
                <div>
                  <p className="text-sm font-medium text-success">{t("కస్టమర్ దొరికాడు", "Customer Found")}</p>
                  <p className="text-sm text-foreground font-semibold">{selectedCustomerName}</p>
                </div>
              </div>
            </div>
          )}

          {/* Customer Not Found */}
          {customerNotFound && customerId.length >= 2 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-destructive">{t("కస్టమర్ దొరకలేదు", "Customer Not Found")}</p>
                  <p className="text-xs text-muted-foreground">{t("దయచేసి సరైన ID ని ధృవీకరించండి", "Please verify the correct ID")}</p>
                </div>
              </div>
            </div>
          )}

          {/* Manual Name Entry (fallback) */}
          {customerId && !selectedCustomerName && !isLoadingCustomer && (
            <>
              <Label htmlFor="customerName" className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4" />
                {t("కస్టమర్ పేరు (మాన్యువల్)", "Customer Name (Manual)")}
              </Label>
              <Input
                id="customerName"
                value={selectedCustomerName}
                onChange={(e) => setSelectedCustomerName(e.target.value)}
                placeholder={t("కస్టమర్ పేరు నమోదు చేయండి", "Enter Customer Name")}
                className="h-11"
              />
            </>
          )}
        </div>
      </Card>

      {/* Customer Info */}
      {customerId && selectedCustomerName && (
        <Card className="p-4 text-center shadow-card bg-muted">
          <p className="text-sm text-muted-foreground">{t("వసూలైన మొత్తం", "Collected Amount")}</p>
          <p className="text-lg font-semibold text-foreground">{selectedCustomerName} (ID: {customerId})</p>
        </Card>
      )}

      {/* Amount Display */}
      <Card className="p-6 shadow-money bg-gradient-success">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <IndianRupee className="h-8 w-8 text-success-foreground" />
            <span className="text-4xl font-bold text-success-foreground">
              {formatAmount(amount) || '0'}
            </span>
          </div>
          <p className="text-sm text-success-foreground/80">
            {t("వసూలైన మొత్తం నమోదు చేయండి", "Enter the collected amount")}
          </p>
        </div>
      </Card>

      {/* Quick Amount Buttons */}
      <div className="grid grid-cols-3 gap-3">
        {quickAmounts.map((value) => (
          <Button
            key={value}
            variant="outline"
            size="lg"
            onClick={() => handleQuickAmount(value)}
            className="h-12 bg-muted hover:bg-primary hover:text-primary-foreground"
          >
            +{value}
          </Button>
        ))}
      </div>

      {/* Number Pad */}
      <div className="grid grid-cols-3 gap-4">
        {/* Numbers 1-9 */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <Button
            key={num}
            variant="outline"
            size="xl"
            onClick={() => handleNumberPress(num.toString())}
            className="h-16 text-2xl font-bold bg-primary text-primary-foreground hover:bg-primary-dark border-0"
          >
            {num}
          </Button>
        ))}

        {/* Bottom Row: Clear, 0, Backspace */}
        <Button
          variant="outline"
          size="xl"
          onClick={handleClear}
          className="h-16 text-xl font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 border-0"
        >
          C
        </Button>

        <Button
          variant="outline"
          size="xl"
          onClick={() => handleNumberPress('0')}
          className="h-16 text-2xl font-bold bg-accent text-accent-foreground hover:bg-accent/80 border-0"
        >
          0
        </Button>

        <Button
          variant="outline"
          size="xl"
          onClick={handleBackspace}
          className="h-16 bg-warning text-warning-foreground hover:bg-warning/90 border-0"
        >
          <Delete className="h-6 w-6" />
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          variant="money"
          size="xl"
          onClick={handleConfirm}
          disabled={!amount || parseInt(amount) === 0 || !customerId.trim() || !selectedCustomerName.trim() || isSubmitting}
          className="w-full"
        >
          <Check className="h-6 w-6 mr-2" />
          {isSubmitting ? t("సేవ్ చేస్తోంది...", "Saving...") : t("వసూలు నమోదు చేయండి", "Record Collection")}
        </Button>

        {/* Voice Input Button */}
        <Button
          variant="ghost"
          size="lg"
          className="w-full border-2 border-dashed border-muted-foreground/30 hover:border-primary"
        >
          <Mic className="h-5 w-5 mr-2" />
          {t("వాయిస్ ఇన్‌పుట్", "Voice Input")}
        </Button>
      </div>

      {/* Amount in Words (for confirmation) */}
      {amount && parseInt(amount) > 0 && (
        <Card className="p-3 bg-muted">
          <p className="text-xs text-center text-muted-foreground">
            {t("మొత్తం:", "Amount:")} ₹{formatAmount(amount)}
          </p>
        </Card>
      )}
    </div>
  );
};

export default PaymentKeypad;