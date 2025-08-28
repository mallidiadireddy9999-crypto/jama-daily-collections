import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Mic, Delete, IndianRupee } from "lucide-react";

interface PaymentKeypadProps {
  onBack: () => void;
  onConfirm: (amount: number) => void;
  customerName?: string;
}

const PaymentKeypad = ({ onBack, onConfirm, customerName = "Customer" }: PaymentKeypadProps) => {
  const [amount, setAmount] = useState('');

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

  const handleConfirm = () => {
    const finalAmount = parseInt(amount) || 0;
    if (finalAmount > 0) {
      onConfirm(finalAmount);
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
          <h1 className="text-xl font-bold text-foreground">Collect Payment</h1>
          <p className="text-sm text-muted-foreground">చెల్లింపు సేకరించండి</p>
        </div>
      </div>

      {/* Customer Info */}
      <Card className="p-4 text-center shadow-card">
        <p className="text-sm text-muted-foreground">Collecting from</p>
        <p className="text-lg font-semibold text-foreground">{customerName}</p>
      </Card>

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
            Enter payment amount / చెల్లింపు మొత్తం
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
          disabled={!amount || parseInt(amount) === 0}
          className="w-full"
        >
          <Check className="h-6 w-6 mr-2" />
          Confirm Payment / చెల్లింపు నిర్ధారించండి
        </Button>

        {/* Voice Input Button */}
        <Button
          variant="ghost"
          size="lg"
          className="w-full border-2 border-dashed border-muted-foreground/30 hover:border-primary"
        >
          <Mic className="h-5 w-5 mr-2" />
          Voice Input / వాయిస్ ఇన్‌పుట్
        </Button>
      </div>

      {/* Amount in Words (for confirmation) */}
      {amount && parseInt(amount) > 0 && (
        <Card className="p-3 bg-muted">
          <p className="text-xs text-center text-muted-foreground">
            Amount: ₹{formatAmount(amount)}
          </p>
        </Card>
      )}
    </div>
  );
};

export default PaymentKeypad;